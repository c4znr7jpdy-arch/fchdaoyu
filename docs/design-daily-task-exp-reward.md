## 每日任务经验值奖励 — 修改方案

### 背景

经验计算器（`exp-gain-strategies`）已经为 `daily_task` 场景做了完整的策略定义和测试，包括按难度分档的经验预算（easy 1.2%、normal 2.2%、hard 3.8%、elite 6%）以及境界节奏乘数。但 `TaskService.recordTaskEvent()` 目前只通过邮件发放灵石奖励，完全没有接入经验系统。本方案将这条链路补齐。

### 现状分析

**已就绪的基础设施：**

- `DAILY_TASK_EXP_BUDGET`（`cultivationExpGain.ts`）：定义了按难度的经验百分比
- `dailyTaskStrategy`（`exp-gain-strategies/index.ts`）：完整的策略实现，调用 `resolve()` 即可得到计算输入
- `DailyTaskExpContext`（`types.ts`）：上下文类型，包含 `realm`、`realmStage`、`expCap`、`difficulty`
- `calculateSceneCultivationExp('daily_task', ctx)`（`ExpBudgetCalculator.ts`）：统一计算入口
- `addCultivationExp(cultivator, options)`（`expGainSystem.ts`）：统一修为增加入口，处理瓶颈、上限、感悟等

**缺失的环节：**

1. `ExpGainSource` 类型中没有 `'daily_task'`，无法标识来源
2. `DailyTaskDefinition` 没有 `difficulty` 字段，无法区分经验档位
3. `recordTaskEvent()` 中完成任务后没有调用经验计算和修为增加逻辑
4. 奖励邮件和 `rewardSummary` 没有展示经验值

---

### 修改清单

#### 1. 扩展 `ExpGainSource` 类型

**文件：** `src/server/utils/expGainSystem.ts`

在 `ExpGainSource` 联合类型中添加 `'daily_task'`：

```ts
export type ExpGainSource =
  | 'retreat'
  | 'battle'
  | 'dungeon'
  | 'pill'
  | 'event'
  | 'reward'
  | 'daily_task';  // 新增
```

#### 2. 为每日任务定义添加 `difficulty` 字段

**文件：** `src/shared/types/task.ts`

在 `TaskDefinition` 接口中添加可选的 `difficulty` 字段（引用已有的 `DailyTaskDifficulty` 类型）：

```ts
import type { DailyTaskDifficulty } from '@shared/engine/cultivation/exp-gain-strategies/types';

export interface TaskDefinition {
  // ...现有字段
  difficulty?: DailyTaskDifficulty;  // 新增：日常任务难度档位
}
```

**文件：** `src/server/lib/services/taskDefinitions.ts`

在 `DailyTaskDefinition` 接口中添加必填的 `difficulty` 字段：

```ts
export interface DailyTaskDefinition extends ... {
  // ...现有字段
  difficulty: DailyTaskDifficulty;  // 新增：必填，用于经验计算
}
```

为三个现有日常任务分配难度：

| 任务 | dailyKind | 建议难度 | 理由 |
|------|-----------|---------|------|
| 丹炉留痕 (`daily_alchemy_once`) | alchemy | `easy` | 炼丹操作简单，只需开炉一次 |
| 云游一程 (`daily_dungeon_once`) | dungeon | `normal` | 副本有一定挑战，但属于日常级别 |
| 试手天骄 (`daily_ranking_once`) | ranking | `hard` | 天骄榜对手较强，战斗难度偏高 |

对应到经验百分比（以 `expCap` 为基数）：

| 难度 | 百分比 | 炼气/初期 (expCap=1200) | 元婴/初期 (expCap=12000) |
|------|--------|----------------------|----------------------|
| easy | 1.2% × 3.0 = 3.6% | ~43 | ~432 |
| normal | 2.2% × 3.0 = 6.6% | ~79 | ~792 |
| hard | 3.8% × 3.0 = 11.4% | ~136 | ~1368 |

> 注：实际经验值 = `expCap × difficultyPercent × realmPaceMultiplier`，由 `calculateCultivationExpByCap` 计算，含 floor/ceil 取整。

#### 3. 新增经验计算辅助函数

**文件：** `src/server/utils/expGainSystem.ts`

添加 `calculateDailyTaskExpGain` 辅助函数，与已有的 `calculateBattleExpGain`、`calculateDungeonExpGain` 风格一致：

```ts
import type { DailyTaskDifficulty } from '@shared/engine/cultivation/exp-gain-strategies/types';

/**
 * 日常任务获取修为的辅助函数
 * @param cultivator 角色
 * @param difficulty 任务难度
 */
export function calculateDailyTaskExpGain(
  cultivator: Cultivator,
  difficulty: DailyTaskDifficulty = 'normal',
): number {
  if (!cultivator.cultivation_progress) {
    return 0;
  }

  return calculateSceneCultivationExp('daily_task', {
    realm: cultivator.realm,
    realmStage: cultivator.realm_stage,
    expCap: cultivator.cultivation_progress.exp_cap,
    difficulty,
  }).baseExp;
}
```

#### 4. 在 `recordTaskEvent` 中接入经验奖励

**文件：** `src/server/lib/services/TaskService.ts`

这是核心改动。在 `recordTaskEvent()` 方法中，当任务完成（`task.status === 'completed'`）时：

1. 加载 cultivator 数据（`loadBundleOrThrow`）
2. 计算经验值（`calculateDailyTaskExpGain`）
3. 调用 `addCultivationExp` 应用修为增长
4. 将经验奖励追加到邮件附件中

改动位置在第 1132-1147 行，`task.status === 'completed'` 分支内：

```ts
if (task.status === 'completed') {
  // —— 经验值奖励 ——
  let expReward = 0;
  if (definition.difficulty) {
    const cultivator = await loadBundleOrThrow(cultivatorId);
    expReward = calculateDailyTaskExpGain(cultivator, definition.difficulty);

    if (expReward > 0) {
      const { result: expResult, updated_progress } = addCultivationExp(
        cultivator,
        {
          source: 'daily_task',
          base_amount: expReward,
        },
      );
      // TODO: 将 updated_progress 持久化到 cultivator 记录
      // await updateCultivatorProgress(cultivatorId, updated_progress);
      expReward = expResult.exp_gained; // 取实际获得值（可能被 cap 截断）
    }
  }

  // —— 邮件发放 ——
  const rewardAttachments = resolveTaskRewardAttachments(definition, context.realm);
  // 将经验值追加为邮件附件展示
  const mailAttachments = expReward > 0
    ? [
        ...rewardAttachments,
        { type: 'cultivation_exp' as const, name: '修为', quantity: expReward },
      ]
    : rewardAttachments;

  if (mailAttachments.length > 0) {
    await MailService.sendMail(
      cultivatorId,
      `【今日日常】${task.snapshot.title}`,
      `道友已办妥"${task.snapshot.title}"，这份薄礼已由传音玉简送达。`,
      mailAttachments,
      'reward',
    );
  }
}
```

> **注意：** 当前 `MailAttachmentType` 只有 `'material' | 'consumable' | 'artifact' | 'spirit_stones'`，不包含 `'cultivation_exp'`。有两种处理方式：
> - **方式 A（推荐）：** 只在邮件正文文案中提及经验值，不扩展附件类型，改动最小
> - **方式 B：** 在 `MailAttachmentType` 中新增 `'cultivation_exp'`，前端可渲染经验值附件图标
>
> **修为持久化：** `addCultivationExp` 返回 `updated_progress` 后，需通过 `cultivatorService` 现有的更新接口将其写回 `cultivation_progress` 字段。

#### 5. 更新 `rewardSummary` 展示经验值

**文件：** `src/server/lib/services/TaskService.ts`

在 `formatTaskRewardSummary` 中追加经验值的文本展示：

```ts
function formatTaskRewardSummary(
  definition: Pick<RuntimeTaskDefinition, 'category' | 'rewardAttachments' | 'difficulty'>,
  realm?: RealmType,
  realmStage?: RealmStage,
  expCap?: number,
): string[] {
  const items = resolveTaskRewardAttachments(definition, realm).map((attachment) => {
    return `${attachment.name} x${attachment.quantity}`;
  });

  // 追加经验值展示
  if (definition.category === 'daily' && definition.difficulty && realm && realmStage) {
    const expCalc = calculateSceneCultivationExp('daily_task', {
      realm,
      realmStage,
      expCap,
      difficulty: definition.difficulty,
    });
    if (expCalc.baseExp > 0) {
      items.push(`修为 x${expCalc.baseExp}`);
    }
  }

  return items;
}
```

对应地，`createTaskMetadata` 也需要传入 `realmStage` 和 `expCap`。

#### 6. 更新测试

**文件：** `src/server/lib/services/TaskService.test.ts`

需要添加的测试用例：

- 完成日常任务后，cultivator 的修为应当增加对应经验值
- 不同难度的任务给予不同数量的经验值
- 当修为已达上限（capped）时，经验值应当被截断
- 奖励摘要（rewardSummary）中应包含经验值文本
- 邮件附件/正文中应体现经验值奖励

**文件：** `src/server/utils/expGainSystem.ts` 或新建 `expGainSystem.test.ts`

- `calculateDailyTaskExpGain` 对各个难度、各境界的计算正确性
- cultivator 无 `cultivation_progress` 时返回 0

---

### 数据流总览

```
recordTaskEvent(cultivatorId, event)
  │
  ├─ 匹配日常任务 → 更新进度 → 判断完成
  │
  └─ 任务完成？
       ├─ YES
       │   ├─ loadBundleOrThrow → 获取 cultivator
       │   ├─ calculateDailyTaskExpGain(cultivator, difficulty)
       │   │     └─ calculateSceneCultivationExp('daily_task', ctx)
       │   │           └─ dailyTaskStrategy.resolve() → calculateCultivationExpByCap()
       │   ├─ addCultivationExp(cultivator, { source: 'daily_task', base_amount })
       │   │     └─ 瓶颈检查 → 上限截断 → 更新 cultivation_progress
       │   ├─ 持久化 updated_progress
       │   └─ MailService.sendMail(灵石 + 修为)
       │
       └─ NO → 仅更新进度
```

---

### 可选扩展（不在本次必做范围内）

1. **MailAttachment 扩展：** 如果需要经验值作为正式附件展示，可在 `MailAttachment` 类型中添加 `cultivation_exp` 类型。否则只在邮件正文中提及即可。

2. **前端展示：** `TaskProgressSnapshot.rewardSummary` 已支持 `string[]`，只需前端渲染时识别 `修为 xNNN` 格式即可。

3. **全部完成额外奖励：** 如果后续想加入"三个日常全部完成"的额外经验奖励，可以在 `recordTaskEvent` 末尾检查当日所有日常任务的完成状态，追加一次 `system_reward` 类型的经验。

4. **难度动态化：** 当前难度写死在任务定义中。如果后续想做"每日随机难度"，可将 `difficulty` 改为在 `createTaskMetadata` 时随机生成并存入 `TaskInstanceMetadata`，计算时从 metadata 读取。

---

### 改动文件汇总

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/server/utils/expGainSystem.ts` | 修改 | 添加 `'daily_task'` 到 `ExpGainSource`；新增 `calculateDailyTaskExpGain` |
| `src/shared/types/task.ts` | 修改 | `TaskDefinition` 添加可选 `difficulty` 字段 |
| `src/server/lib/services/taskDefinitions.ts` | 修改 | `DailyTaskDefinition` 添加必填 `difficulty`；三个任务定义赋值 |
| `src/server/lib/services/TaskService.ts` | 修改 | `recordTaskEvent` 接入经验奖励；`formatTaskRewardSummary` 展示经验 |
| `src/server/lib/services/TaskService.test.ts` | 修改 | 添加经验奖励相关测试 |
