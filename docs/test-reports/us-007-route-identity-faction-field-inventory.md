# US-007 字段盘点：Route / Identity / Faction / Sect / Karma / Relationship / Critical Choice

## 范围与方法

- 本文为只读盘点，不修改业务实现。
- 盘点对象来自当前主流程运行路径中的状态结构、效果处理器、条件判定与 UI 展示路径。
- 每个字段记录：`source`（定义来源）、`write points`（写入点）、`read points`（读取点）、`meaning`（语义）、`classification`（`main-flow` / `legacy-compatible` / `suspected-deprecated`）。

## 字段清单

| Field | Source | Write Points | Read Points | Meaning | Classification |
| --- | --- | --- | --- | --- | --- |
| `state.identity.identities` / `state.identity.primary` | `src/types/eventTypes.ts` (`IdentityInfo`)；初始值在 `src/core/GameEngineIntegration.ts` | `EventExecutor.executeEffects` 内 `IdentitySystem.determineIdentity` 后回写；`GameEngineIntegration.addIdentity/removeIdentity` | `EventExecutor.canTriggerEvent` 的 `triggerConditions.identity`；`IdentitySystem` 各判定/加成/结局函数 | 角色当前身份集合与主身份（事件、结局、成长加成判定） | `main-flow` |
| `state.lifePath.primaryIdentity` | `src/types/eventTypes.ts` (`LifePath`)；初始化于 `LifePathManager.initialize` | `LifePathManager.changeIdentity`、`applyAchievementEffects`；`EventExecutor` 各 `LIFEPATH_*` handler 触发初始化后维护 | `LifePathManager.canTriggerEvent` 身份兼容检查 | 人生轨迹系统中的主身份（与 `state.identity` 并存） | `legacy-compatible` |
| `state.flags.sect_faction`（同步到 `state.player.flags.sect_faction`） | Flag 体系（`state.flags` + `state.player.flags`） | `FlagSetHandler` 设置 `sect_faction` 并互斥清理 `orthodox_member`/`unconventional_member` | `GameScreen.routeLabel`、`ChoiceFeedbackGenerator` 路线推断、`GameEngineIntegration.getDominantPaths`、大量事件表达式 `flags.sect_faction` | 门派阵营立场（正统/非正统/中立） | `main-flow` |
| `state.lifePath.faction` | `src/types/eventTypes.ts` (`LifePath.faction`) | `SetFactionHandler`；`LifePathManager.changeIdentity`、`applyAchievementEffects` | `LifePathManager.canTriggerEvent` 的 `requirements.faction` | 人生轨迹层面的阵营字段 | `legacy-compatible` |
| `state.player.sect` | `src/types/eventTypes.ts` (`PlayerState.sect`)；初始值 `null` | 初始化默认值；`GameEngineIntegration.applyGameState` 可从外部 `nextState.player.sect` 同步 | `GameScreen`、`EndingScreen` 的展示 | 玩家门派名称（显示用） | `suspected-deprecated` |
| `state.player.flags.current_sect` | Flag 体系 | 事件 `flag_set` 写入（数据侧） | `AttributePanel` 读取并映射门派徽标/阵营文案 | 当前门派标识（UI 标签） | `legacy-compatible` |
| `state.karma.good_karma` / `state.karma.evil_karma` / `state.karma.history` | `src/types/eventTypes.ts` (`KarmaSystem`)；初始值在 `GameEngineIntegration` | `KarmaChangeHandler` -> `KarmaManager.addKarma`；`KarmaManager.clearKarma`；反序列化恢复 | `EventExecutor.canTriggerEvent` (`triggerConditions.karma`)；`IdentitySystem.determineIdentity`；`EndingSystem` 判定 | 善恶累积与因果历史（触发条件/结局/身份判定） | `main-flow` |
| `state.relations[relationId]` | `GameState.relations` 字典 | `RelationChangeHandler` 按运算符写入 | `RelationChangeHandler` 后续累积读取；作为关系数值索引源 | 关系值快速索引（ID -> 亲密/敌对数值） | `main-flow` |
| `state.player.relationships[]` | `PlayerState.relationships` | `RelationChangeHandler` 新增/更新数组；`GameEngineIntegration.applyGameState` 同步 | `GameScreen` 列表展示；`ChoiceFeedbackGenerator` 关系反馈计算 | 玩家侧关系明细（角色名/角色类型/亲密度） | `main-flow` |
| `state.lifePath.relationships.{allies,enemies,mentors,disciples}` | `LifePath.relationships` | `LifepathAddRelationshipHandler`；`LifePathManager.addRelationship`/成就副作用 | `LifePathManager.canTriggerEvent` 间接依赖（通过 commitment/路径规则）；`LifePathManager.getState` | 轨迹系统关系分类（阵营/门派叙事约束） | `legacy-compatible` |
| `state.criticalChoices.{sect_choice,life_goal,marriage_choice,midlife_choice,war_choice}` | `src/types/eventTypes.ts` (`CriticalChoices`)；`CriticalChoiceSystem` 选择点定义 | `GameEngineIntegration.executeChoiceEffects` 对关键事件调用 `CriticalChoiceSystem.recordChoice` | `EventExecutor.canTriggerEvent` (`triggerConditions.choices`)；`EndingSystem`/`IdentitySystem` 读取 | 关键抉择存档（后续事件链、身份与结局分歧依据） | `main-flow` |
| 路线 flags（如 `route_orthodox`、`route_demonic`、`route_wanderer`、`route_border`、`route_beggars`、`*_path`） | 事件效果 `flag_set` 与事件数据表达式 | 各事件 JSON 的 `flag_set` 效果写入；`FlagSetHandler` 统一落地 | `GameScreen.routeLabel`、`AttributePanel` 身份标签、事件条件表达式、`GameEngineIntegration.getDominantPaths` | 路线/分支状态信号（分散在 flags，命名不统一） | `legacy-compatible`（其中历史命名的 `*_path` 视为 `suspected-deprecated` 候选） |

## 分类结论（汇总）

- `main-flow`：`identity`、`sect_faction`、`karma`、`player.relationships`、`relations`、`criticalChoices`。
- `legacy-compatible`：`lifePath.primaryIdentity/faction/relationships`、`current_sect`、多数 route flags。
- `suspected-deprecated`：`player.sect`、部分历史命名路线 flags（尤其 `*_path` 与新 `route_*` 并存字段）。

## 当前缺口（为后续冲突规则准备）

- route 信号存在双轨：`sect_faction`、`route_*`、`*_path` 同时在用，命名与语义边界未统一。
- identity 也存在双轨：`state.identity.*` 与 `state.lifePath.primaryIdentity` 需明确谁是冲突规则主判定源。
- sect 字段存在展示层旧字段（`player.sect`）与 flag/映射字段（`current_sect`）并存，建议后续定义单一展示来源。
