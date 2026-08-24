# Wealth / Economy Product Contract v1 与 Repository Inventory

> 状态：Accepted product contract；repository-grounded read-only inventory
>
> Accepted：2026-08-22
>
> 本文是 Wuxia-Life 当前正式经济产品契约及其 implementation inventory。Part A 定义产品语义；Part B 记录当前仓库事实、迁移影响面与后续技术边界。当前 `money` / `wealth` 实现、旧配置和旧测试均属于 migration evidence，不能覆盖 Part A。

## Part A — Accepted Product Contract v1

## 1. 背景与问题定义

当前银两同时承担了日常生计、非经济成长成本和战略财富三种职责，导致两个相反的问题：

1. 武学、学识等非经济路线被迫持续处理现金流，经济资源变成通用成长税；
2. 经营路线虽然能够大量获得银两，但财富主要表现为余额累积，缺乏长期世界意义。

本设计不通过调整银两产出/消耗数值解决该问题，而是重新定义经济资源身份。

## 2. 核心产品决定

Wuxia-Life 不模拟角色的日常现金流。

经济系统只描述：

1. 角色能够调动的战略经济能力；
2. 角色已经在世界中建立的持久经济基础。

核心经济状态由以下两个概念承担：

- **财力（Wealth Capacity）**：角色当前能够调动的战略经济能力；
- **资产（Asset）**：角色在世界中形成的、可持续影响未来事件的具名持久状态。

银两可以继续作为世界观和事件叙事语言出现，但不再默认等价于核心玩家资源余额。

## 3. 财力 Contract

### 3.1 定义

财力表示角色的经济行动能力，而不是：

- 钱包余额；
- 日常收入；
- 日常支出；
- 通用行动点；
- 通用成长燃料；
- 隐藏财富经验值。

### 3.2 粗粒度经济身份

当前产品语义采用粗粒度离散等级。暂定语义名称：

1. 无余财；
2. 略有积蓄；
3. 家资殷实；
4. 豪富；
5. 富甲一方。

具体枚举名、显示名和等级数量可在 repository-grounded implementation design 中根据现有数据结构确认，但不得改变“粗粒度经济身份而非余额”的产品语义。

**关键定义：**“无余财”不表示无法维持正常生活，只表示没有足以投入重大经济事项的额外经济能力。

### 3.3 非累计原则

财力采用关键事件驱动的状态迁移。

禁止将以下机制作为财力的默认实现：

- wealth XP / wealth score；
- 隐藏银两余额；
- 每次普通事件小额加减；
- 阈值累计升级；
- 周期性收入/支出结算；
- 自动衰减；
- 自动维护费。

绝大多数事件不改变财力。

### 3.4 财力迁移判据

只有事件足以持续扩大或缩小角色未来的经济选择空间时，才允许改变财力等级。

统一语义测试：

> 事件发生后，我们是否还会使用原来的经济身份描述这个角色？

如果答案是“是”，财力保持不变。

## 4. 资产 Contract

资产首先是世界事实，其次才具有经济意义。

典型资产可以包括：

- 商号；
- 田庄；
- 商队；
- 商路；
- 镖局；
- 山庄；
- 其他长期产业、组织性经济基础或具有持续经济作用的世界存在。

资产必须能够对后续玩法产生具体作用，而不只是另一种财富计分方式。

例如，“镇远镖局”可以成为未来事件的条件、关系网络、人员调度来源或冲突来源，而不应只表达成固定财富值。

禁止将资产机械换算成财力：

- 不定义“商号 = X 财力”；
- 不通过资产价格求和计算财力等级；
- 不要求所有资产都直接提升财力。

正确关系是：

> 资产 / 重大经济事实 → 改变未来经济行动能力 → 必要时触发财力迁移。

## 5. 日常经济抽象原则

以下内容默认不进入核心经济状态：

- 普通收入；
- 普通消费；
- 基本吃住；
- 普通交通；
- 日常练功成本；
- 普通读书成本；
- 普通社交支出；
- 一般医疗与生活用品；
- 日常家庭开销。

该原则必须对收入和支出对称适用。

世界叙事仍可描述“花了几两银子”“得到一笔酬劳”，但除非达到正式经济状态迁移条件，否则不修改财力。

## 6. 经济资源事件边界

只有满足以下任一条件的事件才有资格读取或修改核心经济状态：

1. 经济能力本身是该选择成立的关键条件；
2. 事件结果足以持续改变角色未来的经济行动能力；
3. 事件形成、失去或改变了持久资产。

带有金钱叙事不等于必须触碰财力。

## 7. 财力的四种合法玩法用途

### 7.1 资格（Requirement）

财力可以作为某种经济规模行为的资格条件。

例如：举办大型宴会、组织大型活动、购买极其稀有的物品、承担重大经济计划。

满足资格通常不导致财力下降。

### 7.2 替代解决路径（Alternative Path）

财力可以为一个问题提供经济型解决路径，但不得天然成为最佳路径。

例如获取珍贵秘籍可以存在：

- 师门路径；
- 人脉路径；
- 冒险路径；
- 财力购买路径。

不同路径可以产生不同后续关系、风险和世界结果。

### 7.3 重大投入（Major Commitment）

只有真正足以改变经济身份的重大投入才允许降低财力。

重大财力下降原则上必须换取持久世界结果，例如山庄、产业、组织或其他长期能力。

### 7.4 经济建设（Economic Development）

经营、投资或其他人生事件可以形成资产、经济网络或其他长期经济基础。

当这些事实足以使角色经济行动能力发生质变时，可以提升财力。

## 8. 非经济成长硬约束

不得仅为了以下目的给非经济行为附加财力成本：

- 平衡收益；
- 提高难度；
- 制造通用 trade-off；
- 降低行为频率。

因此，普通练功、普通读书等基础成长不得把财力作为通用成长税。

如果非经济路线需要约束，应优先从该领域自身寻找约束，例如：

- 时间；
- 机会；
- 风险；
- 师承；
- 人生阶段；
- 路线竞争；
- 关系；
- 领域条件。

## 9. 反万能财力原则

财力是一种解决问题的能力，不是选择质量的等级。

对于非经济问题，财力原则上不得单独替代该领域的核心能力。

例如：

- 富甲一方不等于自动成为武林盟主；
- 富甲一方不等于自动成为绝顶高手；
- 富甲一方不等于自动获得真正的人际关系。

财力可以提供资源、场合、机会和组织能力，但领域核心条件仍必须成立。

该原则对称适用：非经济能力也不能完全绕过经济问题本身所需的真实经济基础。

## 10. 路线非对称原则

不同人生路线与财力系统的交互频率可以天然不对称。

经营路线可以频繁涉及：

- 财力迁移；
- 资产形成；
- 投资决策；
- 商业关系。

武学、学识或其他非经济路线可以长期完全不触碰财力。

产品需要平衡的是不同人生方向的价值和可行性，而不是经济交互次数。

## 11. 出生背景原则

富裕出身应改变角色可用的人生路径和机会，但不得成为所有成长方向的通用倍率。

富裕角色可以更早获得：

- 投资机会；
- 稀有资源购买路径；
- 大型组织活动资格；
- 特殊教育或师承机会。

贫寒角色仍必须能够通过非经济路径正常发展武学、学识、人际等核心能力。

## 12. Silver / 财富 Migration Classification

现有任何 silver / 财富读写在迁移前必须先进行语义分类，禁止直接从“+X/-X”调整成另一组数值。

### 12.1 DAILY_ABSTRACTED

日常收入或日常消费。

处理：删除核心经济状态变化；必要时保留叙事。

典型：普通练功成本、普通读书成本、普通生活支出、普通劳动收入。

### 12.2 NARRATIVE_ONLY

钱只是世界叙事的一部分，不构成经济身份变化。

处理：保留文本，不修改财力。

### 12.3 WEALTH_REQUIREMENT

事件实际表达的是角色是否具备足够经济行动能力。

处理：改为财力门槛，默认不消耗财力。

### 12.4 WEALTH_TRANSITION

事件足以长期改变角色经济身份。

处理：改为财力等级迁移。

### 12.5 ASSET_TRANSITION

事件形成、改变或失去持久经济基础。

处理：改为资产状态变化；如果同时改变经济身份，再联动 WEALTH_TRANSITION。

## 13. 典型迁移语义

### 普通练功 / 普通读书

现状语义：行为成长 + 银两消耗。

目标分类：`DAILY_ABSTRACTED`。

目标：删除经济状态变化。

### 普通护镖 / 普通劳动报酬

如果只是正常报酬：`NARRATIVE_ONLY` 或 `DAILY_ABSTRACTED`。

只有足以改变人物经济身份时才是 `WEALTH_TRANSITION`。

### 大型宴会

通常属于 `WEALTH_REQUIREMENT`。

财力表示能够举办这种规模活动的能力，而不是活动结束后必然经济降级。

### 开宗立派 / 建立山庄

通常可能同时涉及：

- `WEALTH_REQUIREMENT`；
- `ASSET_TRANSITION`；
- 可选的 `WEALTH_TRANSITION`。

是否降低财力取决于投入是否足以改变人物经济身份，而不是固定成本。

### 远行贸易

普通成功不应机械提升财力。

根据实际结果可能是：

- 经营能力成长，财力不变；
- 形成稳定商路 → `ASSET_TRANSITION`；
- 经济基础完成质变 → `ASSET_TRANSITION + WEALTH_TRANSITION`。

## 14. 对 Auto Evolution 的产品边界

本 Contract 进入 repository authority 后，Auto Evolution 可以在 Contract 内识别和修复具体经济语义问题，例如：

- 普通练功仍错误扣除财力；
- 重大经济投入没有产生持久结果；
- 普通收入错误提升财力；
- 资产存在但无法参与任何后续世界状态。

Auto Evolution 不应自行：

- 恢复普通成长的财力成本；
- 把财力重新定义为余额；
- 新增隐藏 wealth score；
- 将财力改为通用难度资源；
- 推翻本 Contract 的产品层决定。

上述变化属于正式产品方向变更，应升级至 Human authority。

## 15. 第一阶段实施范围

正式 implementation planning 前必须先进行 repository-grounded inventory。

在确认真实结构后，第一阶段目标原则上只包含：

- 建立财力的正式产品状态语义；
- 支持财力 requirement；
- 支持财力 transition；
- 支持满足最小需求的 asset state；
- 对现有 silver / 财富读写进行分类；
- 移除日常非经济成长的银两依赖；
- 迁移必要的关键事件；
- 更新对应产品规范和测试。

## 16. 明确不在第一阶段实施

- 完整产业经营模拟；
- 商号经营平台；
- 自动资产收益；
- 资产折旧；
- 每年财务结算；
- 自动生活费；
- 自动维护费；
- 继承系统；
- 家族财富体系；
- 复杂价格系统；
- 通货膨胀；
- 完整经济 UI；
- 为所有路线重写大量事件；
- 为未来可能需求建立经济 framework；
- 修改 Auto Evolution workflow 本身。

## 17. Repository-grounded Inventory 必须回答的问题

在进入 implementation plan 前，只读检查真实 repository，并明确回答：

1. 当前 silver / 财富的 authoritative schema / state 定义在哪里；
2. 当前所有核心读写入口有哪些；
3. 哪些事件、出生设定、行为、测试和 UI 直接依赖该字段；
4. 是否已有可复用的离散状态 / requirement / persistent entity 机制；
5. 当前是否已有可承担 Asset 语义的正式模型；
6. 哪些现有银两行为属于五类 migration classification；
7. 哪些迁移需要代码级能力，哪些只是配置层修改；
8. 是否存在 save/state compatibility 或历史 fixture 约束；
9. 最小可运行迁移切片是什么；
10. 哪些问题仍必须升级给 Human 决策。

在 inventory 完成之前，不预设新的 schema、枚举名称、资产框架或具体修改文件。

## 18. 验收语义

第一阶段完成后至少应满足：

1. 普通武学、学识等非经济成长不再依赖日常银两成本；
2. 普通收入/消费不再构成需要玩家持续维护的现金流循环；
3. 财力表现为粗粒度战略经济能力，而非余额或隐藏累计分；
4. 重大经济机会可以读取财力资格；
5. 只有经济身份质变才改变财力；
6. 至少能表达实施范围内所需的持久资产变化；
7. 经营路线仍然拥有明确的经济发展空间，而不是失去核心玩法；
8. 财富不能成为非经济路线的万能成长燃料或万能解；
9. 现有关键经济事件的迁移符合五类 classification；
10. Auto Evolution 可以依据 repository authority 判断具体事件是否违反该 Contract。

## 19. Authority / Governance

本设计是产品语义层 Contract。

实施时仍以当前 repository authority、正式产品规范、governance、真实实现和测试为最终事实来源。

如果 repository 现状与本设计存在实现冲突，应先区分：

- 历史实现尚未迁移；
- 当前正式产品规范与本设计存在冲突；
- 技术结构导致本设计无法按预期最小落地。

不得因为旧代码或旧测试当前如此运行，就自动覆盖已接受的产品语义；但也不得在没有 repository-grounded inventory 的情况下猜测实现方式。

## Part B — Repository-grounded Inventory（2026-08-22）

> 本部分来自当前 repository 的只读调查。它不新增产品语义，也不授权 production/config/schema/test 修改。

### 4. 当前经济状态模型

| 问题 | 当前事实 | 证据 |
| --- | --- | --- |
| authoritative runtime balance | `PlayerState.wealthCapacity` 是主运行时的必需离散字段；`money` / `wealth` 仍保留为迁移债务的数值字段 | `src/types/eventTypes.ts:82,483,860`；`src/contracts/gameStateSnapshot.ts:25,64`；`src/contracts/validation/canonicalGameStateValidation.ts:389` |
| optional parallel field | `PlayerState.wealth?: number` 仍是可选 legacy 字段，没有被重新定义为正式财富语义 | `src/types/eventTypes.ts:853-864`；`src/contracts/gameStateSnapshot.ts:46-92` |
| primary default | `GameEngineIntegration.createInitialState()` 将 `wealthCapacity` 初始化为 `no_surplus`；主流程仍保留 legacy `money` 初值 | `src/core/GameEngineIntegration.ts:113-176`，尤其 `:138` |
| current snapshot | Snapshot schema 现在是 `3.15.0`，`3.14.0` 在 canonical validation 中被拒绝 | `src/contracts/gameStateSnapshot.ts:30`；`tests/canonicalWealthCapacityState.test.ts:11,29-30` |
| derived ambiguity | P17 的 `resources` 维度仍把 `money + wealth` 作为 legacy 派生读取；它不是 accepted Wealth Capacity source of truth | `src/p17/stateAccess.ts:65-85` |

结论：当前仓库已经形成单一的 `wealthCapacity` canonical state，但 `money` / `wealth` / P17 派生仍作为迁移债务保留。

### 5. 核心读写与约束入口

### 5.1 Runtime mutation / requirement

| 入口 | 当前行为 | 分类意义 |
| --- | --- | --- |
| `src/core/ConditionEvaluator.ts:73-75` / `src/core/EventExecutor.ts` | `wealth_capacity_at_least`、`wealth_capacity_set`、`wealth_capacity_raise_to` 已进入正式 requirement / effect 处理链路；`stat_modify` 仍只适用于 legacy numeric fields | Wealth Capacity canonical surface |
| `src/core/EffectExecutor.ts:73-80` | `MONEY_MODIFY` 仍直接读写 `money`，减法下限为 `0` | legacy balance mutation；不是 Wealth Capacity transition |
| `src/core/EventExecutor.ts:193-310` | `StatModifyHandler` 仍允许 `money` 与 `wealth` 作为可修改字段；`wealthCapacity` 不是通用 stat target | legacy numeric mutation surface，Phase 1B 之外仍保留 |
| `src/core/GameEngineIntegration.ts:503-590` | `thresholds.attributes` 按玩家字段进行 `min/max` 检查，并另行检查 background / experience | 可复用 Requirement mechanism；不能把 numeric threshold 自动当 Capacity level |
| `src/core/GameEngineIntegration.ts:1480-1515` | 选择事件通过 `EventExecutor` 应用 effects，再写入 event history | 可复用 transition / provenance 链路 |

### 5.2 Active actions 与日常内容

`src/data/activeActionCatalog.ts:15-96` 中的成年基础主动行为已经不再绑定 `money` 成本或收益；`src/core/activePlanning/ActivePlanningService.ts:105-207` 仍执行行动、推进时间并生成 summary，但不再承载普通现金流。

`src/data/childhoodActionCatalog.ts:1-80` 的 `action_household_errand` / `action_household_apprentice` 也已经去掉 `money` 收益，保留的是非经济成长。

`src/data/life/dailyEvents.ts:1-240` 中的日常 livelihood 变体已不再使用 `money` statEffects，`daily_take_odd_job` 与 `daily_small_trade` 保留的是叙事和状态压力，而不是余额结算。

结论：普通成年主动行为、儿童家务型主动行为和日常 livelihood 现金流都已从核心经济状态中抽离，符合 `DAILY_ABSTRACTED` 的当前仓库事实。

### 5.3 正式加载的经济相关事件资产

正式入口由 `src/data/events.json:3-31` 和 `src/core/EventLoader.ts:152-185` 共同决定。当前实际加载、且会影响经济 inventory 的代表性资产包括：

- `origin.json`；
- `identity-merchant.json`；
- `merchant.json`；
- `family-life.json`；
- `relationship.json`；
- `middle-age-career.json`；
- `sect-border.json`；
- `medical.json`；
- `setback-events.json`；
- `p9-remediation.json`、`p11-validation.json`、`p21-content-samples.json`、`p22-content-expansions.json`。

这不是所有出现 `money` 文本的文件清单，而是当前正式 EventLoader path 中会进入 runtime catalog 的主要来源。

在这些正式加载源里，`origin.json` 已经写入 `wealth_capacity_set`，`merchant.json` 已经写入 `wealth_capacity_at_least` 与 `wealth_capacity_set`；`event-asset-manifest.json:75-96`、`:339-344` 中的 `daily.json`、`economy.json`、`money-events.json`、`shop.json` 仍然是 deferred/backlog evidence，不是当前正式 runtime source。

### 6. 出身、事件、UI、fixture 与 persistence

### 6.1 出身初始化存在重复路径

当前商户出身的 canonical wealth-capacity seed 已经落到 `origin.json`：`origin_merchant_family` 同时写入 `wealth_capacity_set: comfortable_means` 与 legacy `money +200`。

`src/data/childhoodEvents.json:650-657` 仍保留另一条 `money +200` 的 childhood legacy producer，它不是 canonical wealth-capacity seed，属于迁移债务。

`startNewGame()` 仍先应用 traits，再由正式事件调度应用出身 choice。当前仓库事实是：merchant origin 已具备独立的 `wealthCapacity` seed，但 legacy `money` producer 仍未彻底收敛。

### 6.2 代表性 event / action 语义

`merchant_shop_failure` 的 `invest_more` 使用 `wealth_capacity_at_least modest_savings` 且不再消费 legacy `money`；`merchant_wealth_peak` 使用 `wealth_capacity_set: regional_magnate`，并保留 additive `reputation +25`、`charisma +10` 与 `merchant_wealthy`。`merchant_talent_discovery` 的 `study_business` 使用 `wealth_capacity_raise_to modest_savings`，事件条件不再读取 `money >= 50`。`merchant_first_shop` 使用 `merchant_talent` + `wealth_capacity_at_least modest_savings`，三条开店路径与 `close_shop` 不再精确修改 `money`。

`origin_merchant_family` 已显式设置 `wealth_capacity_set: comfortable_means`，并保留 legacy `money +200`。`merchant_wealth_peak` 的 legacy `money +200` 已退役，不再作为后续钱包消费者的兼容 evidence。

`merchant.json` 的 merchant talent → first shop → shop-failure 竖切已不再在该路径上使用精确 `money` 条件或效果。`merchant_caravan_guard` 已不再读写精确 `money`：`hire_elite_guards` 使用 singular `wealth_capacity_at_least comfortable_means`；`escort_personally` 保留武力门槛并以 `wealth_capacity_raise_to comfortable_means` 表达自营扩张后的经济身份提升；`hire_normal_guards` 不再产生普通现金奖励。`merchant_market_monopoly` 入口使用 `merchant_caravan_success` + `wealth_capacity_at_least comfortable_means`；`monopoly_trade` 不再读写 `money`，以 `wealth_capacity_raise_to wealthy` 表达市场支配后的经济身份跃迁；`fair_competition` 不再读写 `money` 且不改变 Wealth Capacity。`merchant_official_connection` 不再读写精确 `money`；`heavy_bribe` 使用 singular `wealth_capacity_at_least wealthy` 作为 choice condition；`moderate_bribe` 无 Wealth 要求且继续产生 `merchant_official_friend`。`merchant_intelligence_network` 不再写入 `money`。`merchant_chamber_of_commerce` 要求 `merchant_intelligence` + `wealth_capacity_at_least comfortable_means`；商会会长使用 `wealth_capacity_raise_to wealthy`。`merchant_wealth_peak`、`merchant_sect_investment`、`merchant_business_empire` 与 `merchant_ending_tycoon` 已进入 late progression migration，不再依赖 legacy wallet semantics。

### 6.3 UI / presentation

当前 presentation 已把 `wealthCapacity` 作为主经济身份：

- 主界面把 `wealthCapacity` 放在 `topResources[0]`，标签为“财力”，同时仍保留 `money` / “银两” 的次级可见性（`src/components/mainScreenModel.ts:286-319`）；
- GameScreen 的 player surface 传出 `wealthCapacity`（`src/components/GameScreen.vue:282-292`）；
- session API mapper 也携带 `wealthCapacity`（`server/src/services/sessionProgressionMapper.ts`，见 `tests/wealthCapacityPresentation.test.ts`）；
- 终局与世界观文本仍可见 legacy `money` / `银两` 叙事。

这些事实说明 UI / API 已经把 `wealthCapacity` 作为当前正式经济身份，但 legacy `money` visibility 仍在。

### 6.4 Persistence、fixture 与 tests

- Snapshot schema 当前为 `3.15.0`；`wealthCapacity` 是必需且 categorical，`wealth` 仍是 legacy 可选字段，结构校验为 closed allowlist（`src/contracts/gameStateSnapshot.ts:15-92`、`docs/contracts/game-state-snapshot-contract.md:3-9`）。
- `SaveManager` 保存前后都通过 canonical validation，`3.14.0` 及更旧版本不会被 fallback 或 silent migration 接受（`src/core/SaveManager.ts:49-77`、`:93-163`；`docs/contracts/game-state-snapshot-contract.md:49-71`）。
- `inventory` 只是可选的 `InventoryItem[]`，每项只有 `id/name/quantity`（`src/types/eventTypes.ts:1054-1061`）；fixture 中的 `item_silver`（`src/contracts/fixtures/gameStateSnapshotAge50.ts:310-314`）不构成正式 Asset/ownership/holding 模型。
- 既有 tests 与 gate fixtures 已开始断言 `wealthCapacity`、presentation parity 和 merchant vertical slice，但 `money` / `wealth` 的 legacy 断言仍然存在于一部分历史测试里。它们是迁移影响面与历史 evidence，不覆盖 accepted Contract authority。

未来如果删除 `money`、改变其语义、把 `wealth` 变为正式字段，至少会影响 runtime `PlayerState`、Event/Condition handlers、Snapshot types/validator、converter、SaveManager、fixtures、tests、UI 和外部历史存档重建。当前 save policy 明确“外部重建 current snapshot，runtime 不做 migration”，因此本轮不尝试兼容或重写历史 evidence。

### 7. Five-way migration inventory

下表覆盖能够实际修改或约束玩家经济状态的 authoritative path，以及会影响后续迁移设计的代表性内容。它不是对所有文本中“银子/财富”字样的穷举。

| 分类 | 当前代表性实现 | 当前判断与后续约束 |
| --- | --- | --- |
| `DAILY_ABSTRACTED` | `activeActionCatalog.ts` 的 `action_training_basic`、`action_study_basic`、`action_socializing_basic`、`action_business_basic`、`action_travel_basic`；`childhoodActionCatalog.ts` 的 `action_household_errand` / `action_household_apprentice`；`dailyEvents.ts` 的 `daily_take_odd_job`、`daily_small_trade` 等日常 livelihood 变体 | 这些 ordinary cash-flow producers 已不再直接改写核心经济状态；accepted contract 仍禁止把它们退化成 hidden score 或 Capacity XP |
| `NARRATIVE_ONLY` | `src/p8/personas.ts` 的“积累财富”目标；`p9-remediation.json` / `p11-validation.json` 的 `pathAffinity.wealth`；UI 的“银两”标签与商人文本 | 这些标签、目标、路径权重或展示语义不能单独创建 Wealth state。若同一内容还含 effect/condition，应拆分并按对应行重新分类 |
| `WEALTH_REQUIREMENT` | `merchant.json` 的 `wealth_capacity_at_least`：`merchant_first_shop` / `invest_more`（`modest_savings`）、`hire_elite_guards`（`comfortable_means`）、`merchant_market_monopoly` 入口（`comfortable_means`）、`merchant_official_connection.heavy_bribe`（`wealthy`）、`merchant_chamber_of_commerce`（`comfortable_means`）；仍未迁移的 `money` threshold 只剩 `identity-merchant.json`、`relationship.json` 等平行 wallet 语义 | merchant talent → shop → caravan → market → official → intelligence → chamber 竖切已迁移；`merchant_sect_investment` / `merchant_business_empire` / `merchant_ending_tycoon` late progression 已切到 Wealth Capacity；`moderate_bribe` 等无 Wealth 门槛路径已退役 wallet gate；余额阈值 consumer 仍存在于 identity-merchant、relationship 与其他 deferred path |
| `WEALTH_TRANSITION` | `origin.json` 的 `wealth_capacity_set: comfortable_means`；`merchant.json` 的 `wealth_capacity_raise_to modest_savings`（`study_business`）、`wealth_capacity_raise_to comfortable_means`（`escort_personally`）、`wealth_capacity_raise_to wealthy`（`merchant_market_monopoly.monopoly_trade`、`merchant_chamber_of_commerce`）、`wealth_capacity_set: regional_magnate`（`merchant_wealth_peak`，并退役 legacy `money +200`）、`wealth_capacity_set: wealthy`（`merchant_sect_investment.invest_righteous_heavy`）、`wealth_capacity_raise_to regional_magnate`（`merchant_business_empire`）；`fair_competition` 不改变 Wealth Capacity；legacy money delta 仅仍在 `origin_merchant_family`（deferred） | transition 不等于余额加减；raise_to 与 set 已在 merchant 主线多段并存；late progression 已进入财富身份迁移而非钱包迁移 |
| `ASSET_TRANSITION` | `merchant.json` 的三条首次开店路径通过 `asset_add` 建立 `merchant_shop`，`close_shop` 通过 `asset_remove` 移除；开店/投资/关店不再伴随 wallet mutation | `merchant_shop` 已有最小正式 Asset identity；shop lifecycle wallet 已从该竖切退役 |
| `UNRESOLVED` | legacy `money` / numeric optional `wealth`；P17 的 `money + wealth` 派生；`merchant_*` 以外仍未迁移的 merchant money consumers；`childhoodEvents.json` 的 legacy `money +200` producer；Phase 1B 之外的 merchant flags 是否升级为 Asset；旧 `src/data/storyData.ts` money path 是否仍有任何正式消费者 | 这些问题无法由当前 authority 安全推导。必须保留为迁移前决策，不通过 alias、fallback 或兼容层“折中”；`merchant_shop` 的 Phase 1B ownership 不属于 unresolved |

### 8. 可复用的现有能力

| 目标 | 已有机制 | 是否足够直接承载新语义 |
| --- | --- | --- |
| Wealth Capacity 的离散表达 | `wealthCapacity` enum + labels + `isWealthCapacity` / `meetsWealthCapacity`，并已进入 runtime、snapshot、UI 和 validation | 已经足够承载 Phase 1A 的 canonical Capacity contract，但仍不是 Asset contract |
| Phase 1B Asset identity / ownership | `src/types/asset.ts` 与 `src/core/assetOwnership.ts`；`asset_owned` / `asset_add` / `asset_remove` 通过 typed API 使用 canonical `facts` | 足够承载唯一 `merchant_shop` 的二值持有语义；不表达通用 Asset entity、数量、价值、位置或收益 |
| Requirement | `ConditionEvaluator` 的受控 expression，`GameEngineIntegration.checkThresholds()` 的 attributes/background/experience checks | 足以承载 requirement 评估基础；需要新语义映射时不能复用旧 numeric balance 作为最终模型 |
| State transition | `EffectDefinition`、`EventExecutor`、flags、event history、active action history | 足以承载显式事件转换与 provenance；不需要先建 generic economy framework |
| Persistent world facts | `facts`、`flags`、`eventHistory`、`achievements`、`affiliation`、relationships | 可承载叙事事实和组织/关系信号，但不等于经济 Asset ownership |
| UI feedback | 主界面 resource model、action summary、event outcome、ending stats | 可复用展示边界；当前已经展示 `wealthCapacity`，但仍保留 legacy money visibility |

### 9. Asset 承载能力判断

当前仍没有通用 Asset entity/collection，但 Phase 1B 已通过最小 typed semantic layer 表达唯一 `merchant_shop` 的正式 ownership：

- `InventoryItem` 只有 `id/name/quantity`，仍更接近物品堆叠，不承担商铺/产业/组织的 owner、状态、地点、收益、转让或终止；
- `src/types/asset.ts` 注册唯一 `merchant_shop`；`src/core/assetOwnership.ts` 将其映射到 canonical `facts`，并封装 backing fact key；
- `flags` 和 `eventHistory` 仍可记录 `merchant_shop_*` 等历史/故事事实，但不再作为 canonical ownership source；
- `affiliation` / relationships 仍表达组织与关系事实，不是 holding/ownership 模型；
- snapshot 继续持久化 `facts`，Asset ownership 通过现有 facts round-trip 保留，不新增 Asset entity/collection 或 Snapshot 字段。

因此 Phase 1B 只完成 binary ownership、event lifecycle、persistence 和 derived presentation 边界；数量、价值、地点、收益、维护、转让、多实例和通用 Asset schema 仍未实现。

### 10. Compatibility / technical constraints

1. 当前 Snapshot 只接受 `3.15.0`；缺失必需字段、未知字段、旧版本和非 canonical shape 都会被拒绝。没有 runtime migration/fallback。
2. `wealthCapacity` 已经进入 runtime state、conditions、effects、UI、action history、fixtures 和 tests；这不是配置层 alias，而是正式 canonical contract。
3. `money` 已经同时进入 runtime state、conditions、effects、UI、action history delta、fixtures 和 tests；删除或改名不是配置级替换。
4. `wealth` 已经出现在 runtime type、Snapshot optional field、condition/effect allowlist 与 P17 派生读取中，但没有统一初始化和正式产品含义；保留它也会继续产生第二状态来源风险。
5. `events.json` / EventLoader 与 event-asset-manifest 对 runtime-loaded/backlog assets 的定义不同于“仓库中存在文件”；迁移必须绑定正式 loaded source，不能批量扫描所有 JSON。
6. 历史 gate fixture、旧 tests 和 diagnostic persona 可能继续记录余额语义。它们需要在未来迁移计划中分类为更新、冻结 evidence 或外部重建，不能在本轮静默改写。

### 11. Current implementation status

Phase 1A 与 Phase 1B 的仓库实现均已完成其批准边界。Phase 1A focused tests、Phase 1B focused tests、contracts、headless/parity、typecheck 与 build 已通过；sample-lines、event-quality broad inventory 与 repository real gate 中的既有/范围外 blocker 仍按基线单独记录，不构成 Asset slice 的新 blocker。

#### Phase 1A — Wealth Capacity Core

1. 普通练功、读书、交游、游历等主动行为的通用 `money` tax 已经移除。
2. `wealthCapacity` runtime contract 已经落地，且使用离散 categorical enum，而不是隐藏余额、XP 或累计 score。
3. 一个正式 merchant requirement 已迁移为 `wealth_capacity_at_least`，并保留 legacy money consumer 作为过渡证据。
4. 一个重大 merchant event 已迁移为 `wealth_capacity_set` transition。
5. Snapshot、Headless、Browser、fixture 与 tests 已对齐到同一 `wealthCapacity` source of truth。

#### Phase 1B — Minimal Asset Semantics

1. 唯一注册 AssetId 为 `merchant_shop`，ownership 由 typed Asset API backed by canonical `GameState.facts` 表达，raw backing key 不泄漏到业务边界。
2. `open_grocery_shop`、`open_weapon_shop`、`open_herb_shop` 均建立 canonical ownership；shop variant flags 保留为 legacy variant/history compatibility。
3. `merchant_shop_failure` 与 `merchant_caravan_guard` 使用 `asset_owned` 作为 shop ownership gate；`close_shop` 移除 ownership，而不自动清理历史 flags。
4. Asset ownership 通过现有 Snapshot facts path round-trip 持久化，Snapshot 仍为 `3.15.0`；不存在 load-time legacy flag derivation。
5. API 与主屏通过 derived `ownedAssets` / `assetSummary` 展示 ownership；没有新增 PlayerState、Snapshot 或 Asset management UI。
6. `asset_add` / `asset_remove` 不自动修改 money、Wealth Capacity 或其他经济状态。

#### Merchant Caravan Legacy Money Migration

1. `merchant_caravan_guard` 不再读写精确 `money`；精英路径使用 `wealth_capacity_at_least comfortable_means`；亲自护送保留武力门槛并以 `wealth_capacity_raise_to comfortable_means` 承接自营扩张；普通保镖不再产生现金奖励且不设置 `merchant_caravan_success`。
2. `merchant_market_monopoly` 入口使用 `merchant_caravan_success` + `wealth_capacity_at_least comfortable_means`；高 legacy `money` 单独不再解锁市场阶段。
3. 未新增 caravan Asset；`merchant_shop` 仍是唯一 AssetId；Snapshot 保持 `3.15.0`。

#### Merchant Market Monopoly Legacy Money Migration

1. `merchant_market_monopoly` 两 choice 不再读写精确 `money`。
2. `monopoly_trade` 使用 `wealth_capacity_raise_to wealthy` 表达市场支配后的经济身份跃迁，并保留 `reputation -10`（additive）与 `merchant_monopoly` flag。
3. `fair_competition` 不改变 Wealth Capacity，保留 `reputation +10`（additive）与 `merchant_fair_trade` flag。
4. `merchant_official_connection` 与 `merchant_ending_hidden_wealth` 继续通过 route flags 消费，不依赖已退役的 `+80/+40` wallet padding。
5. 未新增 Asset 或 market-position schema；`merchant_shop` 仍是唯一 AssetId；Snapshot 保持 `3.15.0`。

#### Merchant Late Economic Progression Legacy Money Migration

1. `merchant_wealth_peak` 保留 `wealth_capacity_set: regional_magnate`、additive `reputation +25`、additive `charisma +10` 与 `merchant_wealthy`，legacy `money +200` 已退役。
2. `merchant_sect_investment` Heavy choice 要求 `wealth_capacity_at_least regional_magnate`，并刻意将 Wealth 设为 `wealthy`；标准 righteous、evil、both-side choice 不改变 Wealth 或 money，只保留 additive stat delta 与 route flags。
3. `merchant_business_empire` 使用 `wealth_capacity_raise_to regional_magnate`，保留 `merchant_empire`，且不再写入 money。
4. `merchant_ending_tycoon` 只要求 `merchant_empire` + `wealth_capacity_at_least regional_magnate`，legacy `money >=500` 已退役。
5. `merchant_ending_bankrupt` 已从 active catalog 暂时退役；legacy `money <= 50` consumer 已移除，但尚未引入 replacement bankruptcy semantics。`identity-merchant`、P26/P42、`origin` legacy money、P17 与 global money retirement 仍按各自的 deferred boundary 处理。
6. 本 slice 不引入新的 Asset、财富等级或通用 Wealth arithmetic framework。

Asset-specific 延期：dedicated Asset entity/collection、数量、价值、地点、收益、维护、转让和多实例。

明确延期：完整产业经营模拟、自动收益/维护费/衰减、全量 event 批量迁移、完整经济 UI、save migration、generic economy framework，以及 Auto Evolution workflow 改造。


### 12. Permission boundary

| 未来候选修改 | 性质 | 当前边界 |
| --- | --- | --- |
| 调整正式 loaded event 的普通 action/event effects、文本和余额 requirement | configuration-level | 仍需明确 slice、验证和 Human 授权；不得借此引入新 state source |
| Phase 1A canonical `wealthCapacity` + Snapshot `3.15.0` | code/runtime + formal Contract/Schema-level | 已依据 PD-065 获 Human authorization 并实施；该授权不自动覆盖未来修改 |
| 进一步修改 canonical Wealth / Snapshot / Asset Contract，或改变 `PlayerState`、initialization、Effect/Condition handlers、active planning、UI、runtime conversion、save policy 或 migration | code/runtime + formal Contract/Schema-level | 仍需相应 Human 裁决并单独形成 implementation plan；不因 Phase 1B closure 自动授权 |
| 修改 Auto Evolution permissions、framework、provider 或 workflow | workflow/framework-level | 不属于本任务；按当前 Auto Evolution stage 保持 STOP/ESCALATE |

accepted product design 不等于对上述 code、runtime、schema 或 migration 的自动授权。

### 13. Implementation / Human decisions still required

完整 accepted product semantics 已在 Part A 落库。当前剩余的是 repository-grounded implementation 决策，而不是重新选择经济资源模型：

1. `money` 与可选 `wealth` 的最终处理：删除、阶段性 legacy 保留、外部重建存档，或其他明确的一次性迁移政策。
2. P17 的 `money + wealth` 派生读取何时退休，以及如何保证迁移后只有一个正式 Wealth Capacity source of truth。
3. `childhoodEvents.json` 的 legacy `money +200` producer 是否继续保留、冻结为 evidence，还是在后续迁移里收敛。
4. Phase 1B 之外的 `merchant_shop_*`、`merchant_chamber_head`、`merchant_wealthy` 等 flags 是否需要升级为其他正式 Asset；本阶段只确认 `merchant_shop` 的 binary ownership，不把其他 flags 自动迁移。
5. 未加载的 `money-events.json`、`economy.json`、`shop.json` 等 backlog 内容是继续延期、删除，还是在未来重新纳入正式 catalog。
6. 如果 Phase 1B 需要改变 Snapshot shape / save compatibility，应按现有 formal Contract / Schema boundary 单独 Human 裁决，不得借 accepted product design 自动扩大权限。


### 14. Inventory conclusion

Repository-grounded inventory 已完成，且本次 authority corrective 不要求重做。当前实现事实与 accepted product semantics 的主要冲突已经被标记为 migration classification、compatibility 与 implementation decisions，而不是通过 numeric alias、fallback 或批量替换掩盖。

本文件现在同时承载：

- **Part A：完整 Human-accepted Product Contract**；
- **Part B：基于 2026-08-22 repository snapshot 的只读 implementation inventory**。

两者 authority 身份必须保持区分：Part A 定义产品语义；Part B 记录当前实现事实与迁移证据。实现事实不能反向覆盖 Part A。
