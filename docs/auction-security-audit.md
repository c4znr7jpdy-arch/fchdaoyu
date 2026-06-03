## 拍卖行交易全链路安全审计报告

审计日期：2026-06-03

审计范围：AuctionService、MailService、ResourceEngine、邮件领取、MarketService（坊市回收）

---

### 一、交易链路总览

拍卖行的完整交易流程如下：

**上架 (listItem)**：校验物品所有权与品质 -> 获取 Redis 分布式锁 -> 事务内扣除物品 -> 创建拍卖记录（status=active） -> 释放锁

**购买 (buyItem)**：获取 Redis 分布式锁（锁 key = listingId） -> 校验拍卖状态/过期/自买 -> 事务内扣除买家灵石（原子 SQL） -> 直接给卖家加灵石（原子 SQL，扣除10%手续费） -> 更新拍卖状态为 sold -> 发邮件给买家（物品附件） -> 发邮件给卖家（灵石附件）

**下架 (cancelListing)**：查询拍卖记录 -> 校验所有权和状态（事务外） -> 事务内更新状态为 cancelled -> 发邮件返还物品

**过期 (expireListings)**：定时任务触发 -> 原子标记过期 -> 发邮件返还物品

**邮件领取 (mail claim)**：查询邮件 -> 检查 isClaimed（事务外） -> 通过 ResourceEngine.gain 发放附件 -> 事务内标记 isClaimed=true

---

### 二、发现的风险点

#### 【P0 严重】卖家灵石双重发放 — 直接入账 + 邮件附件重复

这是最可能导致灵石膨胀的根本漏洞。

在 `buyItem` 的事务中（AuctionService.ts 第 538-544 行），卖家的灵石被**直接增加**到了 cultivators 表：

```typescript
// 5.2 增加卖家灵石（扣除手续费后）
await tx
  .update(schema.cultivators)
  .set({
    spirit_stones: sql`${schema.cultivators.spirit_stones} + ${sellerAmount}`,
  })
  .where(eq(schema.cultivators.id, listing.sellerId));
```

紧接着（第 572-586 行），**同一事务内**又给卖家发送了一封包含灵石附件的邮件：

```typescript
// 5.5 发送邮件给卖家（灵石）
await MailService.sendMail(
  listing.sellerId,
  '拍卖行物品售出',
  `...获得 ${sellerAmount} 灵石。`,
  [{ type: 'spirit_stones', name: '灵石', quantity: sellerAmount }],
  'reward',
  tx,
);
```

卖家在邮件系统中点击"领取"后，`resourceEngine.gain` 会再次将 `sellerAmount` 加到卖家的灵石余额中。

**结果：每笔拍卖交易，卖家获得 2 倍灵石（一次直接入账，一次通过邮件领取）。** 10% 手续费形同虚设，实际净收益为 `2 * price * 0.9 - price = 0.8 * price`，即每卖出一件物品，灵石净增 `0.8 * price`。这是正收益，完全可以无限刷钱。

这就是你观察到"玩家频繁买卖后灵石累计到几千万"的最可能原因。两个账号之间反复对敲，灵石越滚越大。

**修复建议**：移除直接入账（5.2 步骤），仅通过邮件发放灵石；或移除邮件中的灵石附件，仅保留直接入账。推荐保留直接入账方式（即时反馈更好），将卖家邮件的附件改为纯通知（不含 spirit_stones 类型的附件）。

---

#### 【P0 严重】邮件领取接口存在 TOCTOU 竞态条件 — 可双倍领取任意邮件

`/mail/claim` 端点（cultivator.router.ts 第 1396-1468 行）在事务外读取邮件状态，在事务内才标记已领取：

```typescript
// 事务外读取
const mail = await getExecutor().query.mails.findFirst({
  where: and(eq(mails.id, mailId), eq(mails.cultivatorId, cultivator.id)),
});
if (mail.isClaimed) {
  return c.json({ error: 'Already claimed' }, 400);
}

// ... 解析附件 ...

// 事务内发放 + 标记
const result = await resourceEngine.gain(
  user.id, cultivator.id, gains,
  async (tx) => {
    await tx.update(mails)
      .set({ isClaimed: true, isRead: true })
      .where(eq(mails.id, mailId));
  },
);
```

两个并发请求可以同时通过 `isClaimed` 检查。由于 `resourceEngine.gain` 内部的 UPDATE 语句是 `WHERE eq(mails.id, mailId)` 而非 `WHERE eq(mails.id, mailId) AND eq(mails.isClaimed, false)`，两个事务都能成功执行，导致同一封邮件的附件被发放两次。

对比系统中其他关键操作（buy、list、sell 等）都有 Redis 分布式锁保护，唯独邮件领取没有，这是一个明显的防护缺失。

**修复建议**：

1. 为 `/mail/claim` 和 `/mail/claim-all` 增加 Redis 分布式锁（锁 key = mailId 或 cultivatorId）
2. 将 UPDATE 语句改为带条件更新：`WHERE eq(mails.id, mailId) AND eq(mails.isClaimed, false)`，并检查返回的行数是否为 1
3. 推荐两者同时实施（纵深防御）

---

#### 【P1 高危】下架操作 (cancelListing) 存在 TOCTOU 竞态 — 可能导致物品重复返还

`cancelListing`（AuctionService.ts 第 599-653 行）在事务外校验拍卖状态，在事务内更新：

```typescript
// 事务外查询
const listing = await auctionRepository.findById(listingId);
if (listing.status !== 'active') { throw ... }

// 事务内更新
await q.transaction(async (tx) => {
  await auctionRepository.updateStatus(tx, listingId, 'cancelled');
  // 发送邮件返还物品
  await MailService.sendMail(...);
});
```

如果在"事务外查询"和"事务内更新"之间，另一个请求（购买或过期定时任务）将该拍卖状态改为 `sold` 或 `expired`，cancelListing 仍然会执行并将状态覆盖为 `cancelled`，同时发送物品返还邮件。此时物品可能已经通过购买流程转移给了买家，但卖家又通过取消拿回了一份。

此漏洞无 Redis 锁保护（buyItem 有锁但 cancelListing 没有）。

**修复建议**：在 cancelListing 的事务内加入状态二次校验，使用 `SELECT ... FOR UPDATE` 锁定拍卖行后再判断状态。

---

#### 【P1 高危】updateSpiritStones 使用 SELECT-then-UPDATE 模式，存在丢失更新风险

`cultivatorService.ts` 第 1455-1491 行的 `updateSpiritStones` 函数：

```typescript
const cultivator = await dbInstance
  .select({ spirit_stones: schema.cultivators.spirit_stones })
  .from(schema.cultivators)
  .where(eq(schema.cultivators.id, cultivatorId))
  .limit(1);

const newValue = Math.min(cultivator[0].spirit_stones + safeDelta, ceiling);

await dbInstance
  .update(schema.cultivators)
  .set({ spirit_stones: newValue })
  .where(eq(schema.cultivators.id, cultivatorId));
```

这是经典的"读取-计算-写入"模式，在并发场景下会导致丢失更新。两个事务可能读到相同的旧值，各自计算后写入，后写入的覆盖先写入的。

虽然 `buyItem` 中的灵石扣减和增加使用了原子 SQL 表达式（`spirit_stones + X`），不受此问题影响，但所有通过 `resourceEngine.gain` / `resourceEngine.consume` 的灵石变动（包括邮件领取、副本奖励、坊市交易等）都走这个有缺陷的路径。

**修复建议**：改用原子 SQL 表达式 `spirit_stones = spirit_stones + delta`，配合 `WHERE` 条件做边界保护；或在 SELECT 时加 `FOR UPDATE`。

---

#### 【P2 中危】拍卖行无最高价格限制 — 便利灵石转移

`listItem` 仅校验 `price >= 1`，无上限。结合 P0 的双重发放漏洞，玩家可以设定极高价格（如 1000 万灵石）快速转移大量灵石，加速刷钱效率。

**修复建议**：根据游戏经济体系设定合理的单笔最高价格上限（如 100 万灵石），或在 `ListSchema` 中增加 `.max(MAX_PRICE)` 校验。

---

#### 【P2 中危】同一玩家多角色之间无交易限制

`buyItem` 仅禁止 `sellerId === buyerCultivatorId`（同一角色不能买自己的物品），但无法阻止同一用户（userId）的不同角色之间进行交易，也无法阻止两个玩家之间的合谋对敲。

结合 P0 的双重发放漏洞，两个玩家可以约定互相购买对方的高价物品，快速刷取灵石。

**修复建议**：增加同 userId 下角色之间的交易限制；对异常交易模式（高频互买、价格异常等）做检测和告警。

---

#### 【P2 中危】无交易频率限制

系统没有对买卖操作的频率做任何限制。玩家可以无限快速地循环"上架 -> 购买 -> 领取邮件 -> 再上架"。结合 P0 漏洞，刷钱速度完全不受约束。

**修复建议**：对单个玩家的买入操作增加冷却时间（如 5 秒内不可连续买入），对拍卖行整体交易频率做速率限制。

---

#### 【P3 低危】claim-all 批量领取的原子性问题

`/mail/claim-all`（cultivator.router.ts 第 1470-1551 行）将所有未领取邮件的附件合并成一个大 gains 数组，然后通过单次 `resourceEngine.gain` 调用发放。如果其中任何一个附件处理失败，整个事务回滚，所有邮件都无法领取。虽然这不是安全漏洞，但在附件种类复杂时可能导致可用性问题。

---

### 三、灵石膨胀量化估算

假设两个玩家合谋，使用 P0 漏洞刷钱：

1. 玩家 A 上架物品，标价 100 万灵石
2. 玩家 B 购买，B 扣除 100 万灵石
3. A 直接入账 `100万 * 0.9 = 90万` 灵石
4. A 领取邮件，再获得 `90万` 灵石
5. A 总计获得 `180万` 灵石，系统净增 `180万 - 100万 = 80万` 灵石

每轮对敲净增 80% 的标价。如果标价 100 万，刷 50 轮即可净增 4000 万灵石。考虑到无交易频率限制，这完全可以在短时间内完成。

---

### 四、各系统防护状态对照

| 操作 | Redis 分布式锁 | 事务内二次校验 | 原子 SQL | 状态 |
|------|:-:|:-:|:-:|------|
| 拍卖上架 (listItem) | 有 | 有 | 部分 | 较安全 |
| 拍卖购买 (buyItem) | 有 | 有 | 有 | 较安全（但有双重发放） |
| 拍卖下架 (cancelListing) | 无 | 无 | 无 | **有风险** |
| 拍卖过期 (expireListings) | 有（原子标记） | 有 | N/A | 较安全 |
| 邮件领取 (mail/claim) | 无 | 无 | 无 | **有风险** |
| 批量领取 (mail/claim-all) | 无 | 无 | 无 | **有风险** |
| 坊市购买 (market buy) | 有 | 有 | 有 | 安全 |
| 坊市回收 (recycle sell) | 有 | 有 | 有 | 安全 |

---

### 五、修复优先级建议

**立即修复（P0）**：

1. 移除 buyItem 中卖家灵石的双重发放，只保留一种方式
2. 为邮件领取接口增加分布式锁 + 条件更新

**尽快修复（P1）**：

3. cancelListing 事务内增加状态二次校验和行锁
4. updateSpiritStones 改为原子操作或加 FOR UPDATE

**后续优化（P2）**：

5. 增加拍卖行价格上限
6. 增加同 userId 角色间交易限制
7. 增加交易频率冷却
8. 增加异常交易监控告警（高频互买、大额循环交易等）
