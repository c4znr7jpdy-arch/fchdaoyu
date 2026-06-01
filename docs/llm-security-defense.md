## 外部 LLM 配置风险防范方案与最佳实践

基于对 `99-llm-proxy.md` 文档和源码的深入分析，本文梳理了当前架构中允许玩家配置外部 LLM 端点所带来的全部安全风险，并给出了分层防御方案与具体代码修复建议。

---

### 一、风险全景

当前架构的核心问题在于**信任链断裂**：游戏服务器信任了玩家自行提供的 LLM 端点（通过 `x-llm-base-url` 请求头），而服务器端的 Zod Schema 验证和资源引擎都没有对 LLM 返回的数值做合理性校验。这使得攻击者可以用一个"假代理"完全控制 LLM 的返回内容，构造出通过 Zod 验证但逻辑上非法的响应。

风险按严重程度分为三个等级：

**致命级（直接破坏经济系统）：** 副本负值 costs 注入是最严重的漏洞。`DungeonCostSchema` 中 `value: z.number()` 没有 `.min(0)` 约束，而 `ResourceEngine.consume()` 用 `-cost.value` 计算实际变化量。当代理返回 `spirit_stones: -5000000` 时，双负得正，玩家凭空获得 500 万灵石。同样的路径适用于修为、寿元和材料。DB 层只有"不小于 0"的下限守卫，没有上限，因此注入的正值畅通无阻。

**高危级（操纵游戏机制）：** 副本掉落物可以被代理完全控制，每轮返回 `reward_score: 100` 的满值物品；副本结算可以被强制为 S 级评价；炼丹的药性规划可以被劫持以强制产出特定丹族（如破境丹）。

**中低级（间接影响平衡）：** 材料语义标签注入可以扩大词条候选池（但受白名单限制，无法凭空创造不存在的词条）；材料生成的元素可以被强制偏向（但受 Zod enum 限制，只能在合法元素中选择）。

---

### 二、分层防御策略

防御需要在四个层面同时加固，形成纵深防御。任何单独一层都不足以完全消除风险。

#### 第 1 层：入口验证 — LLM 配置本身

当前 `app.ts` 直接从请求头读取 `x-llm-base-url` 并传入 AI Client，没有任何校验。建议增加以下措施：

**白名单机制**：只允许预注册的 LLM 服务商域名。对于自托管场景，要求管理员在服务端配置允许的域名列表，而非由客户端自由指定。

```typescript
// app.ts — 替换直接从 header 读取的逻辑
const ALLOWED_LLM_HOSTS = new Set([
  'api.deepseek.com',
  'api.openai.com',
  'api.anthropic.com',
  // 如需支持自建，从服务端配置读取
  ...getServerConfig('customLlmHosts'),
]);

function validateLlmBaseUrl(url: string): string {
  const parsed = new URL(url);
  if (!ALLOWED_LLM_HOSTS.has(parsed.hostname)) {
    throw new Error(`LLM host not allowed: ${parsed.hostname}`);
  }
  // 禁止内网地址和回环
  const ip = dns.lookupSync(parsed.hostname);
  if (isPrivateIP(ip)) {
    throw new Error('Private/internal addresses are not permitted');
  }
  return url;
}
```

**SSRF 防护**：即使开放自定义 URL，也必须拒绝内网地址（`127.0.0.0/8`、`10.0.0.0/8`、`192.168.0.0/16`、`169.254.0.0/16` 等），防止攻击者利用服务器探测内网服务。

**速率限制与审计日志**：对所有 LLM 配置变更记录审计日志，并对同一用户的配置修改频率做限制。

#### 第 2 层：Schema 约束 — 收紧 Zod 验证

这是投入产出比最高的修复点。当前的 Zod Schema 只验证了结构（字段类型），没有验证语义（值域合理性）。

**副本 costs 加非负约束**：

```typescript
// types.ts — DungeonCostSchema 修复
const DungeonCostSchema = z.object({
  type: z.enum(['spirit_stones', 'cultivation_exp', 'comprehension_insight', 'lifespan', 'material']),
  value: z.number().min(0).max(1_000_000), // 关键修复：加下限
  // material 类型还需要 name 字段
  name: z.string().optional(),
});
```

仅这一个改动就能封堵最致命的负值注入漏洞。`min(0)` 确保 costs 只能是消耗而非获取。

**副本掉落物加合理值域**：

```typescript
// DungeonRoundSchema 补充
acquired_items: z.array(z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  material_type: z.string().optional(),
  element: z.string().optional(),
  reward_score: z.number().min(0).max(100), // 已有，保留
})).max(5), // 限制每轮掉落数量上限
```

**副本结算加一致性校验**：

```typescript
// DungeonSettlementSchema 增加 refine
DungeonSettlementSchema.refine(
  (data) => {
    // S 级评价时 blueprints 数量不超过 5，且 reward_score 需在合理范围
    if (data.settlement.reward_tier === 'S') {
      return data.settlement.reward_blueprints.length <= 5;
    }
    return true;
  },
  { message: 'Settlement blueprints count inconsistent with tier' }
);
```

**炼丹 plan 加材料一致性校验**：在 `AlchemyRecipePlanner` 中，除了验证 `materialVectors.length === input.materials.length` 外，还应校验 intentVector 的权重分布是否在合理范围内，避免极端操纵。

#### 第 3 层：资源引擎守卫 — 最终防线

即使 Schema 验证被绕过，资源引擎作为写入数据库前的最后一关必须守住。

**资源变化量上限**：

```typescript
// ResourceEngine.ts — consume() 方法加固
private static readonly MAX_SINGLE_DELTA: Record<string, number> = {
  spirit_stones: 1_000_000,   // 单次最多变动 100 万
  cultivation_exp: 500_000,   // 单次最多变动 50 万
  lifespan: 10_000,           // 单次最多变动 1 万年
  comprehension_insight: 100, // 已有 [0, 100] clamp
};

async consume(costs: DungeonCost[], tx: Transaction) {
  for (const cost of costs) {
    // 断言：cost.value 必须为非负数
    if (cost.value < 0) {
      throw new Error(`Negative cost detected: ${cost.type}=${cost.value}`);
    }
    // 断言：变化量不超过上限
    const maxDelta = ResourceEngine.MAX_SINGLE_DELTA[cost.type] ?? Infinity;
    if (cost.value > maxDelta) {
      throw new Error(`Cost exceeds maximum: ${cost.type}=${cost.value} > ${maxDelta}`);
    }
    // ... 原有逻辑
  }
}
```

**资源更新函数加上限守卫**：

```typescript
// cultivatorService.ts — 所有 update 函数统一加固
async function updateSpiritStones(userId, cultivatorId, delta, tx) {
  if (!Number.isFinite(delta)) throw new Error('Invalid delta');
  const MAX_DELTA = 1_000_000;
  const clampedDelta = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, delta));

  const cultivator = await db.query.cultivators.findFirst({ where: eq(cultivators.id, cultivatorId) });
  const newValue = cultivator[0].spirit_stones + clampedDelta;
  if (newValue < 0) throw new Error('Insufficient spirit stones');
  // 新增上限
  const MAX_VALUE = 100_000_000;
  const finalValue = Math.min(newValue, MAX_VALUE);
  // ... 写入
}
```

**统一寿元消耗路径**：当前副本 cost 路径直接调 `updateLifespan`，绕过了 `consumeLifespanAndHandleDepletion` 中的死亡检查。两条路径应当合并，确保无论从哪里消耗寿元都会触发死亡判定。

#### 第 4 层：行为监控与异常检测

前面的硬编码守卫之外，还需要软性监控来发现未知攻击模式。

**异常值告警**：对每次 LLM 返回的关键数值（costs、reward_score、settlement tier）做统计监控。当某个玩家的数值持续偏离正常分布（比如连续 5 轮副本都是 S 级 + 满值 reward_score），触发告警。

```typescript
// 在 LLM 响应处理链路中加入异常检测
function detectAnomaly(llmResponse: ParsedResponse, context: GameContext) {
  const stats = getPlayerStats(context.playerId);
  
  // 连续高收益检测
  if (llmResponse.settlement?.reward_tier === 'S') {
    stats.consecutiveSTier++;
    if (stats.consecutiveSTier > 3) {
      alertService.flag('consecutive_s_tier', context.playerId, stats);
    }
  } else {
    stats.consecutiveSTier = 0;
  }
  
  // 资源变化速率检测
  const delta = computeResourceDelta(llmResponse);
  if (delta.spirit_stones > 1_000_000) {
    alertService.flag('large_resource_gain', context.playerId, delta);
  }
}
```

**LLM 调用来源标记**：在日志中记录每次 LLM 调用使用的 base URL，便于事后审计哪些玩家使用了自定义端点，以及他们的收益是否异常。

**响应指纹对比**：对 LLM 返回的文本内容做简单哈希或特征提取。真实 LLM 的输出具有随机性和多样性，而代理 mock 的响应往往使用固定模板（如代理代码中的 3 段 SCENES 轮换）。如果某个玩家的 LLM 响应多样性异常低，大概率是代理。

---

### 三、架构级最佳实践

除了上述针对性修复，以下是"支持外部 LLM"这一功能设计的长期最佳实践。

**原则一：LLM 永远不应是信任边界内的数据源。** LLM 的输出应当被视为"不可信的用户输入"，和玩家在表单中填写的文本同等对待。所有从 LLM 输出中提取的数值，都必须经过与玩家直接输入相同甚至更严格的验证。游戏的核心经济数值（灵石、修为、寿元等）不应由 LLM 生成——它们应当由服务端确定性计算，LLM 只负责叙事和文本生成。

**原则二：将"可注入"与"不可注入"的边界显式化。** 文档中已经标注了哪些系统"不可注入"（历练收益、幻境塔），因为它们的设计是正确的——数值在服务端预计算，LLM 只生成文本。应当逐步将副本 costs、掉落物等系统也迁移到同样的架构：服务端用蓝图/配置表决定数值，LLM 只负责 `scene_description` 等纯文本字段。

**原则三：最小权限原则。** 如果必须让 LLM 参与数值生成，应当为每个 LLM 调用定义严格的"数值预算"。比如一次副本每轮的 costs 总额不超过某个阈值，掉落的 reward_score 总和不超过某个上限。这些预算由服务端强制执行，不依赖 LLM 的"自律"。

**原则四：响应结构签名。** 可以考虑在 LLM 的 system prompt 中嵌入一个服务端生成的 nonce，要求 LLM 在响应中包含该 nonce。虽然这对"假代理"无效（代理可以解析 system prompt 并提取 nonce），但可以增加攻击复杂度，并且可以用来验证响应确实经过了完整的 LLM 调用链路。

**原则五：灰度发布与特性开关。** 外部 LLM 配置功能应该有一个全局开关，可以在发现异常时立即关闭。同时应支持灰度：先对小范围用户开放，监控数据无异常后再逐步扩大。

---

### 四、修复优先级与路线图

按紧迫程度排列的修复顺序：

**P0 — 立即修复（封堵致命漏洞）：**
- `DungeonCostSchema` 的 `value` 字段加 `.min(0)` — 一行代码封堵负值注入
- `ResourceEngine.consume()` 加 cost.value 非负断言 — 双重保险

**P1 — 短期修复（加固资源层）：**
- `cultivatorService.ts` 三个 update 函数加 per-call delta 上限
- 统一寿元消耗路径，确保死亡检查不被绕过
- 材料/灵石/修为加绝对值上限（ceiling）

**P2 — 中期修复（收紧 Schema）：**
- 所有 Zod Schema 的数值字段加 `.min(0).max(reasonableMax)`
- 副本掉落物数量加上限
- 炼丹 plan 加材料一致性校验

**P3 — 长期改进（架构升级）：**
- LLM 配置入口加白名单和 SSRF 防护
- 核心经济数值改为服务端确定性计算，LLM 只生成文本
- 部署行为监控和异常告警系统
- 建立 LLM 响应审计日志

---

### 五、总结

当前最根本的问题是把 LLM 当作了可信数据源。LLM 的输出本质上是不可预测的文本流，即使使用 Zod 做了结构验证，也无法防止"结构合法但语义非法"的响应（比如所有数值都是合法数字，但负值 costs 就是语义非法的）。正确的做法是将 LLM 限定在"文本生成器"的角色，把所有影响游戏状态的数值决策权收归服务端。Schema 约束、资源守卫和行为监控则是纵深防御的补充层，确保即使某一层被突破，攻击者也难以造成实质性损害。
