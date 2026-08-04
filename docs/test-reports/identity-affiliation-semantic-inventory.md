# Identity / Affiliation 语义事实核对报告

## 0. 核对边界

- 核对类型：只读语义 inventory，不是产品裁决，也不是实现计划。
- 核对对象：当前工作区中的新引擎、正式 EventLoader、Snapshot/Save、Headless/API/Browser 边界，以及相关测试和叙事分析模块。
- 未修改：产品代码、PlayerState、Snapshot Contract、事件、flags producer、人生摘要、结局判定和 UI。
- 权威边界：本报告遵循 `docs/product/player-model.md`、`docs/governance/project-convergence.md`、`docs/governance/product-decisions.md`、`docs/governance/current-product-stage.md` 和 `docs/governance/ai-collaboration-workflow.md`。

## 1. Executive Summary

当前仓库不是只有一个“身份来源”，而是同时存在三类不同性质的正式状态和多类派生信号：

1. `state.identity` 是唯一被 `deriveLifeMemorySummary()` 直接消费的正式身份容器。它由 `IdentitySystem` 根据属性、flags、karma 和成就自动记录，允许持久化，并被事件条件读取。
2. `state.lifePath.primaryIdentity` 也是 Snapshot 可持久化的正式字段，但当前生产事件没有发现调用 `LifePathManager.setPrimaryIdentity()`；它长期保持 `none`，且不进入人生摘要或 Browser/API 身份展示。
3. `player.sect` 与 `player.title` 是 Snapshot Contract 中的正式 PlayerState 字段，但新引擎的正式门派事件主要写入 `current_sect` 等 flags，没有同步写入 `player.sect`；新引擎也没有稳定的 `player.title` producer。

与此同时，`route_*`、`p8_route_*`、`p9_route_identity_*`、`current_sect`、`sect_*` 和 `sect_faction` 真实参与事件调度、UI 标签或叙事分析，但它们不能未经产品裁决直接升级为 canonical identity。`EndingSystem` 负责最终结局分类，使用属性、flags、成就、关键选择和 life states，不使用 `state.identity` 作为实际判定输入；`EndingInfo.requirements.identity` 在类型中存在，但 `meetsEndingRequirements()` 没有对应消费分支。

当前人生摘要长期显示 `none` 的直接原因是：新游戏初始化了 `identity: { identities: [], primary: 'none' }`，而摘要只读取该容器；它不读取 `lifePath.primaryIdentity`、`player.sect`、`player.title`、`current_sect`、route flags 或叙事标签。只要没有满足 `IdentitySystem` 当前阈值的正式 identity，`mainScreenModel` 和 `EndingScreen` 就会显示“暂无身份”。这不是“仓库没有方向信号”，而是“方向信号没有进入摘要消费的 identity 容器”。

本阶段未命中结构性 blocker。关键正式文件和唯一 Snapshot Contract 均存在；问题属于产品语义尚未统一，而不是当前只读核对无法完成。

## 2. 概念拆分

| 概念 | 当前代码对应信号 | 当前性质 | 不应自动等同于 |
| --- | --- | --- | --- |
| Affiliation（门派/组织/阵营归属） | `player.sect`、`current_sect`、`sect_*`、`sect_faction`、`lifePath.faction` | 组织归属、阵营机械或持久字段的混合 | 商人、学者、江湖称号、最终结局 |
| Occupation（长期职业方向） | `business_empire`、`route_official`、`write_famous_book`、merchant/official 事件与属性 | 部分是正式 flags/阈值，部分是叙事方向 | 所属门派、名望称号、ending |
| Reputation title（社会评价/江湖称号） | `player.title`、`IdentityInfo.title`、ending name/title 映射 | 三个字段/展示来源尚未统一 | occupation、affiliation、identity |
| Life identity（当前主要人生定位） | `state.identity.primary`；另有未接通的 `lifePath.primaryIdentity` | 正式 identity 容器存在，但语义覆盖和 consumer 不完整 | 单个 route flag、门派名、ending |
| Narrative route（叙事路线/阶段方向） | `route_*`、`p8_route_*`、`p9_route_identity_*`、route preference、阶段摘要 | 事件门禁、叙事和分析信号 | canonical identity |
| Ending classification（最终人生结局） | `state.ending`、`EndingSystem` 的 ending ID/category | 终局分类与已持久化解释 | 身份、职业、路线 |

最明显的混用风险不是单个字段定义错误，而是同一个中文“身份”在不同 consumer 中分别表示：`state.identity` 的 PlayerIdentity、flags 推出的 UI 标签、路线分析标签、门派归属和结局名称。当前代码表现为“多个概念并存但尚未完成正式映射”，不能据此断言产品已经选择了一个统一身份模型。

## 3. 当前正式数据流

### 3.1 新游戏与 `state.identity`

`GameEngineIntegration.createInitialState()` 初始化：

```text
state.identity = { identities: [], primary: 'none' }
player.sect = null
player.title = null
```

`EventExecutor.executeEffects()` 在每批 effect 执行后调用：

```text
IdentitySystem.determineIdentity(newState)
→ IdentitySystem.recordIdentity(newState, newIdentity)
```

`determineIdentity()` 按优先级检查属性、flags、karma 和成就，当前 criteria 包含 `outlaw`、`hero`、`sect_leader`、`merchant`、`scholar`、`assassin`、`doctor`、`official`、`beggar`、`hermit`。`recordIdentity()` 只追加尚不存在的身份；第一次记录的身份成为 `primary`，之后不会依据新信号重新排序。

`EffectType` 没有 `identity_set`、`identity_add` 或等价的正式事件 effect。正式事件通过 `stat_modify`、`flag_set`、karma、成就等间接满足 identity criteria。`GameEngineIntegration.addIdentity()` 是另一个直接写入入口，但当前正式事件搜索未发现其被调用。

### 3.2 `lifePath`

`LifePathManager.create()` 创建：

```text
primaryIdentity = 'none'
faction = 'neutral'
lifeStage = 'growth'
```

`GameEngineIntegration.getAvailableEvents()` 在需要时初始化 `lifePath`。`EventExecutor` 当前注册的 LifePath handlers 可以写入 `faction`、`achievements`、`commitments` 和 `relationships`，但没有调用 `setPrimaryIdentity()` 的正式 producer。`setPrimaryIdentity()` 仍存在于 `LifePathManager`，其逻辑还会根据 identity 推导 faction，但没有进入主事件闭环。

`deriveLifeMemorySummary()` 不读取 `lifePath.primaryIdentity`；Browser/API 也没有直接展示它。

### 3.3 门派、阵营与方向 flags

正式 EventLoader 通过 `src/data/events.json` 的 imports 加载 `sect-beggars`、`sect-border`、`sect-marginal`、`sect-shaolin`、`sect-wudang`、`identity-*`、`official`、`merchant` 等事件。新引擎的 FlagSetHandler 将 flags 同步到顶层和 `player.flags`，并对 `sect_faction` 做阵营互斥处理。

正式事件实际写入的代表性信号包括：

| 方向 | 代表性正式信号 | 主要用途 |
| --- | --- | --- |
| 正道/名门 | `route_orthodox`、`sect_shaolin`、`sect_wudang`、`sect_faction: orthodox` | 事件条件、门派路线、UI 派生标签 |
| 非正统/魔道 | `route_demonic`、`sect_faction: unconventional`、`current_sect: shadow_sect` | 事件互斥、路线和 UI 标签 |
| 丐帮/边关 | `route_beggars`、`route_border`、`current_sect: beggars/border` | 事件选择、UI 派生标签 |
| 商路 | `business_empire`、`money`、`businessAcumen`、merchant route signals | identity criteria、结局/叙事方向 |
| 学者 | `write_famous_book`、`knowledge`/`comprehension`、`p9_route_identity_scholar` | Identity criteria 或分析/叙事 |
| 仕途 | `route_official`、`become_official`、`reputation`/`comprehension` | 事件路线和 Identity criteria |
| 侠客/英雄 | `chivalry`、`reputation`、hero route events | Identity criteria、事件和结局资格 |
| 家庭/普通人生 | spouse、children、`lifeStates`、家庭 flags | `quiet_family_life` 等 ending 判定与解释 |

这些信号的存在不意味着它们已经是同一个 identity 模型。

### 3.4 正式加载与 deferred identity 资产

`EventLoader` 当前正式加载 `identity-hero.json`、`identity-merchant.json`、`identity-demon.json`、`identity-outlaw.json` 和 `identity-year-events.json`。`events.json` 的 notes 明确标记以下身份事件尚未接线：

```text
identity-scholar
identity-hermit
identity-sect_leader
identity-assassin
identity-doctor
identity-beggar
identity-official
```

因此，“IdentitySystem criteria 中有某个身份”与“该身份有正式事件链”是两个事实，不能混写。`scholar`、`official` 等可以作为 criteria 字符串存在，但对应事件资产仍可能是 deferred；叙事 profile 中的 `scholar`、`merchant`、`wanderer` 等也不自动改变此结论。

## 4. Producer / Consumer 清单

### 4.1 正式状态与直接 consumer

| 字段/信号 | 正式 owner | producer | consumer | 生命周期/持久化 | 玩家可见性 | canonical 与冲突 |
| --- | --- | --- | --- | --- | --- | --- |
| `state.identity.identities` | `IdentitySystem` / `GameState` | `EventExecutor` 每批 effect 后自动判定记录；`GameEngineIntegration.addIdentity()` 可直接写入 | `EventExecutor.canTriggerEvent()` 的 identity 条件；`deriveLifeMemorySummary()`；`mainScreenModel`；`EndingScreen` | 累积列表；Snapshot 顶层可持久化 | Local 摘要、EndingScreen 摘要、API `lifeMemory` 间接可见 | 是正式 identity source；与 `lifePath.primaryIdentity`、flags route 可能冲突 |
| `state.identity.primary` | `IdentitySystem` | `recordIdentity()` 首次记录时设置；移除时由 `GameEngineIntegration.removeIdentity()` 回退 | 人生摘要传递；部分 identity 展示和条件语义 | 当前是“首次记录优先”的历史结果；Snapshot 可持久化 | Local/API/Headless 摘要间接可见 | 是正式 primary，但没有与其他 primary source 的优先级 |
| `state.identity.title` | `IdentityInfo` Contract | 当前未发现稳定 producer | 当前未发现主要 runtime consumer；与 `player.title` 不同步 | 可选、可持久化 | 未形成稳定展示 | 正式允许字段，但不是已证明有效的称号 owner |
| `state.lifePath.primaryIdentity` | `LifePathManager` / `LifePath` | `create/initialize` 写 `none`；`setPrimaryIdentity()` 可写但无正式调用点 | LifePath 内部兼容性/阵营逻辑；不进摘要 | 可持久化；当前通常保持 `none` | 当前不直接可见 | 第二个正式 identity-like source；无同步规则 |
| `state.lifePath.faction` | `LifePathManager` | `SetFactionHandler` | LifePath 逻辑和事件语义 | 可持久化 | 当前无稳定直接 UI | Affiliation/faction 信号，不应自动当作 identity |
| `player.sect` | `PlayerState` / Snapshot Contract | 新引擎初始化 `null`；`applyGameState()` 只复制状态；旧 `longEvents/storyData` 和 deprecated store 有历史直接 producer | Local `mainScreenModel.stageTags`、Local `EndingScreen`；API `PlayerSummaryDto.sect`；条件/旧模块部分读取 | Player canonical field，Snapshot 必持久化 | Local/API main flow 可见；API EndingScreen 当前未把 sect 放进 ending player projection | 与正式事件写入的 `current_sect` 不同步，是最明显的 affiliation source split |
| `player.title` | `PlayerState` / Snapshot Contract | 新引擎初始化 `null`；deprecated `gameStore` 可写；新终局 API 用 ending name 合成展示 title | Local `EndingScreen`；旧 store ending；Snapshot round-trip | Player canonical field，Snapshot 必持久化 | Local EndingScreen 可见；API 不是从该字段传递 | 与 `IdentityInfo.title`、ending name 是不同来源 |
| `flags.current_sect` | FlagSetHandler / 正式事件 | sect、demon/outlaw、chivalry 等 JSON effect | Event conditions、`AttributePanel`、部分 route/summary 逻辑 | 顶层/player flags 持久化 | AttributePanel 派生门派徽章可见 | 正式 mechanics signal，但非 `player.sect`，也非 canonical identity |
| `flags.route_*` / `sect_*` / `sect_faction` | FlagSetHandler / 正式事件 | Event JSON effects | Event gates、`playerFacingLabels`、AttributePanel heuristics、Ending flags、route definition | flags 持久化，部分有互斥/清除 | 通过标签、事件文本或摘要间接可见 | 是 canonical mechanics flags；不能自动升级为 identity |
| `criticalChoices` / achievements | 对应系统 | CriticalChoiceSystem、LifePath handlers、事件 effects | EndingSystem、life summary、事件条件 | Snapshot 可持久化 | 通过经历和结局间接可见 | 可能证明方向，但不是 identity source |
| `state.ending` | `EndingSystem` + ending presentation | `EventExecutor` 的 `end_game` 特殊 effect | Headless terminal、API terminal、Local `EndingScreen` | 终局时写入 Snapshot；description 已成为正式展示数据 | 终局直接可见 | Ending classification，不是 identity/route/title |

### 4.2 派生、分析与测试信号

| 来源 | 当前作用 | 分类 |
| --- | --- | --- |
| `src/utils/playerFacingLabels.ts` | 从 flags 生成正道、魔道、游侠、丐帮、仕途、商路等玩家反馈标签 | UI 派生标签，不是 canonical identity |
| `src/components/AttributePanel.vue` 的 `playerIdentities` | 从 `route_beggars`、`current_sect` 相关 flags、婚姻/子女/退隐/门主 flags 生成“身份标签” | UI heuristic；会把 affiliation、家庭状态、人生状态并列叫 identity |
| `src/narrative/config/routeDefinitions.ts` | 读取 `p9_route_identity_*` 等 flags，解析 merchant/wanderer/martial/deviant/scholar route | Narrative route resolution，不是 runtime identity |
| `src/narrative/profile/wuxiaIdentityTracks.ts` 及相关 profile 类型 | 定义 merchant、wanderer、martial、deviant、scholar、social、cautious、balanced 等模拟/分析轨道 | Analysis/profile taxonomy，不是 canonical state |
| `src/p50/sampleLineExpression.ts`、P8/P9/P11/P 系列 | 从 flags、persona、route preference 生成模拟、报告、回放或 age-40 文本 | Test/analysis/narrative data，不得反向生产 identity |
| `summaryTemplates`、`echoHooks`、`age40_identity` | 生成阶段或回响文本；可能把路线称作“身份” | Narrative presentation，不是 `summary.identity` |
| 测试 fixture 中的 `sect`、`identity` 或 route label | 构造特定 contract/分析场景 | Test input，不是 runtime producer |

## 5. 持久化和 UI 边界

### Local Browser

- `GameScreen` 使用完整 runtime `player`，并通过 `deriveLifeMemorySummary()` 生成摘要。
- `mainScreenModel.stageTags` 直接读取 `player.sect`。
- `AttributePanel` 不读取 `state.identity`，而是从 `player.flags` 计算 `currentSectInfo` 和 `playerIdentities`。
- `EndingScreen` 同时消费 `player.title`、`player.sect`、`lifeMemory.identity` 和 `ending`。因此同一页面上的“门派”“称号”“身份摘要”来自不同来源。

### API

`server/src/services/sessionProgressionMapper.ts` 的 `PlayerSummaryDto` 暴露 `sect` 和 life states，但不暴露 `title`、`state.identity` 或 `lifePath.primaryIdentity`。同一个 payload 另有：

- `lifeMemory`：由 Headless `getLifeMemory()` 派生，身份只来自 `state.identity`；
- `terminal`：暴露 ending id/name/description/category，不暴露 identity；
- `player`：提供可见属性和可选 `sect`。

API 模式的 `App.vue` 在进入 EndingScreen 时把 `terminal.ending.name` 合成为展示用 `title`。这不是从持久化 `player.title` 读取的，且 API ending player projection 当前没有把 `sect` 放入 EndingScreen 的临时 player 对象。

### Headless

- `HeadlessEngineSession.getRuntimeState()` 保留完整 `GameState`。
- `getLifeMemory()` 直接调用 `deriveLifeMemorySummary(runtimeState)`，因此与 Local 的摘要身份来源相同。
- `getTerminalState()` 从 `state.ending` 和 player alive/deathReason 生成 terminal，不单独计算 identity。
- `serialize()` 通过 SnapshotConverter 持久化 `player`、`identity`、`lifePath`、flags、choices、achievements 和 ending 等允许字段。

### Snapshot / Save / Load

Snapshot Contract 明确要求 `SnapshotPlayerState.sect`、`SnapshotPlayerState.title`；`GameStateSnapshotState` 还允许顶层 `identity` 和 `lifePath`，两者都有独立 validation。`SnapshotConverter` 使用 canonical key allow-list round-trip；`SaveManager` 通过同一 converter 保存和恢复。

人生摘要是 derived presentation，不是 Snapshot 的第二份身份状态。当前保存的是各个原始状态和 `state.ending.description`，不是把 `mainScreenModel.identitySummary` 再写入 Snapshot。

## 6. 冲突来源

1. **两套正式 identity 容器**：`state.identity.primary` 与 `state.lifePath.primaryIdentity` 都可表示主要身份，但没有同步、优先级或冲突处理规则。
2. **两套门派字段**：正式事件写 `flags.current_sect`，PlayerState/Snapshot/UI/API 又有 `player.sect`；当前没有新引擎 producer 证明两者同步。
3. **三种 title 语义**：`player.title`、`IdentityInfo.title`、API ending name 合成的临时 title 各自存在，未形成单一称号 owner。
4. **UI heuristic 与 canonical identity 不同**：AttributePanel 会把门派、正邪、婚姻、父母、退隐、门主统一放入 `playerIdentities`；`state.identity` 不会自动包含这些标签。
5. **route/profile 与 runtime identity 同名**：`p9_route_identity_*`、`age40_identity`、`wuxiaIdentityTracks` 使用 identity 词汇，但它们是路线/分析/文本信号。
6. **Ending 与 identity 解耦但类型有残留耦合**：`EndingInfo` 声明 `requirements.identity`，但 ending 实际评估数据没有 identity，requirements 检查也不消费该字段；结局不能被当作身份 consumer。
7. **历史引擎与新引擎并存**：`src/data/longEvents.ts`、`src/data/storyData.ts` 和 deprecated `src/store/gameStore.ts` 有直接写 `sect/title` 的旧路径，但当前 `EventLoader` 的正式 JSON imports 不等于这些旧路径已经是新引擎的 runtime owner。

## 7. 已确认事实

- `PlayerIdentity` 当前是开放的 `string`，不是受限枚举；`IdentityInfo` 与 `LifePath` 都是可验证、可持久化的结构。
- 新游戏默认 `state.identity.primary = 'none'`、`identities = []`、`player.sect = null`、`player.title = null`。
- `EventExecutor` 每批 effect 后会运行 identity 自动判定；没有 identity 专用 effect type。
- `IdentitySystem.recordIdentity()` 的 primary 是首次记录优先，不是当前信号的重新计算结果。
- `LifePathManager.setPrimaryIdentity()` 在代码中存在，但当前正式调用点未发现；LifePath handlers 主要写其他字段。
- 正式事件和 flags 已表达正道、门派、魔道、商路、仕途、家庭等方向，但不代表它们已经有共同的产品语义。
- `deriveLifeMemorySummary()` 的 `summary.identity` 只复制 `state.identity.primary/identities`。
- `mainScreenModel` 和 `EndingScreen` 对空 identity 都使用“暂无身份”兜底。
- Ending 实际按属性、karma、flags、achievements、choices、家庭状态和 life states 判定；identity 不是当前 EndingSystem 的实际评估输入。
- Snapshot 同时容纳 PlayerState 的 `sect/title` 与顶层 `identity/lifePath`，但这只是 Contract 事实，不是产品优先级裁决。
- API/Headless/Local 共享同一份 derived lifeMemory 和 terminal ending source，但它们对 sect/title/identity 的暴露面不同。
- 权威治理文档中的 PD-040 已明确记录：叙事、flags、门派等不自动等于 canonical identity；当前阶段把 Identity/Affiliation 作为后续产品裁决候选，而不是本阶段自动实现项。

## 8. 合理推断

### 为什么摘要长期为 `none`

这是确定性的 consumer 边界问题：

```text
新游戏 identity = { primary: 'none', all: [] }
→ 方向 flags / player.sect / lifePath 不进入 deriveLifeMemorySummary().identity
→ mainScreenModel / EndingScreen 读取到空列表
→ 显示“暂无身份”
```

它不意味着玩家没有正道、商路、学者或家庭方向，也不意味着所有 identity criteria 都永远不会触发。满足现有 criteria 的路线可能进入 `state.identity`；只是其他方向信号不会因为“看起来像身份”而自动进入摘要。

### 正式状态是否已经足以派生玩家可见身份

答案分两层：

- **机械层面足够部分派生**：现有 `state.identity` 可以直接展示，flags/属性/choices/life states 也能提供大量方向证据。
- **产品语义层面不足**：缺少各概念的边界、同一玩家同时拥有多方向时的优先级、身份何时获得/失去、门派离开后的 affiliation 生命周期、occupation 与 title 的关系，以及哪些信号允许进入玩家可见 summary。

因此当前缺少的首要不是再加一个字段，而是产品语义和 source precedence；其次才是对已选模型所需的 producer/consumer 对齐。

### 身份是否必须持久化

不能对所有概念给一个统一答案：

- route/profile/摘要文本是确定性派生或展示数据，可以不单独持久化，但必须从 canonical inputs 重算。
- `player.sect`、`player.title`、`lifePath` 和当前 `state.identity` 都已经在 Snapshot 语义中作为状态存在。
- 当前 `state.identity.primary` 依赖“首次满足 criteria 的时间顺序”，不是从最终属性纯函数确定的结果；若保留这种历史语义，就必须持久化，不能只从当前 stats 可靠重算。
- 如果产品裁决把 identity 改为“当前 canonical state 的纯派生 profile”，则可以不持久化 identity 本身，但必须先定义完整输入、优先级和确定性规则。这是模型选择，不是本次核对可以替代的实现决定。

## 9. 尚待产品裁决的问题

1. `state.identity` 与 `lifePath.primaryIdentity` 是否保留为两个不同概念，还是只允许一个作为 Life identity owner？
2. `player.sect` 与 `flags.current_sect` 哪一个表示正式 affiliation；另一个是历史兼容字段、事件中间态还是必须同步的 projection？
3. affiliation 是否允许离开、转换、多个组织并存；`lifePath.faction` 是否属于 affiliation，还是属于更粗粒度阵营立场？
4. merchant、scholar、official、hero、hermit 等应归入 occupation、life identity、route，还是允许跨概念关联但不共用一个字段？
5. `player.title` 与 `IdentityInfo.title` 的 owner、生命周期和展示规则是什么；ending name 是否永远只属于 Ending classification？
6. `primary` 是首次形成的历史定位、当前最高优先级定位，还是玩家主动选择的自我认同？是否允许切换和失去？
7. `mainScreen`、`AttributePanel`、`lifeMemory`、`EndingScreen` 是否应展示同一层语义，还是明确区分“身份”“门派”“方向标签”和“经历”？
8. API/Headless 是否需要正式暴露 identity/affiliation/title，还是只暴露 lifeMemory 和 sect projection？
9. 当前 `EndingInfo.requirements.identity` 是有效产品规则还是历史类型残留？是否应继续保留为未使用字段，需由产品决定后再治理。
10. 现有正式 identity criteria 是否覆盖产品要求的方向；deferred identity event files 是否继续保持 deferred，不能因 UI 需要而隐式激活。

## 10. 可能的产品模型及代价

以下是供 ChatGPT 产品裁决的模型，不是本报告提出的完整实施计划。

### 模型 A：严格分层，保留不同概念

- Affiliation 单独表示组织/门派/阵营；Occupation 单独表示长期职业方向；Reputation title 单独表示社会称号；Life identity 只表示玩家当前主要人生定位；route 与 ending 保持派生/分类。
- 优点：语义最清晰，避免“丐帮弟子”“商人”“为人父母”“一派之主”被迫放进同一列表；与当前已有字段和 flags 兼容度最高。
- 代价：需要产品定义各层的 owner、生命周期和展示组合；UI/API 会需要多个明确字段或分组。

### 模型 B：canonical state 的确定性身份投影

- 不把 identity 当作额外历史事实，而是从已确认的 canonical stats、flags、choices、affiliation 和 life states 按固定优先级派生；`player.sect`、title、ending 仍保持独立。
- 优点：减少重复状态，回放、Save/Load 和跨端更容易保持一致；不会因事件执行顺序产生不同 primary。
- 代价：必须定义完整且稳定的优先级；历史身份、曾经拥有的职业和“后来改变人生方向”的叙事可能无法仅靠当前状态复原。

### 模型 C：事件记录型身份/轨迹

- 将身份获得、转换、失去视为 canonical event/ledger，当前 primary 是该 ledger 的确定结果；affiliation、occupation、title 仍分层保存。
- 优点：能表达身份形成的时间、转折和长期回响，适合叙事 RPG 的历史人生语义。
- 代价：状态和回放复杂度最高，需要明确冲突、撤销、离派、并存和迁移规则；不能把现有 flags 或正文直接当 ledger。

本报告不替产品选择 A/B/C。就当前证据而言，最需要先裁决的是“概念分层与 owner”，而不是立即新增一个更大的 identity 字段。

## 11. 明确不建议做什么

- 不从 event ID、事件正文、event history、Trace、persona、seed 或测试标签猜测 canonical identity。
- 不把 `current_sect`、`route_*`、`p9_route_identity_*` 或 AttributePanel 的 heuristic 自动升级为 `state.identity`。
- 不把 affiliation、occupation、reputation title、life identity、route、ending classification 合并到 `player.title` 或一个通用字符串列表。
- 不在没有产品优先级的情况下同步两个 primary identity source，也不通过 UI fallback 制造第三个 source of truth。
- 不为了解决“暂无身份”而修改人生摘要、EndingSystem、Snapshot Contract 或事件调度；这些应等待产品裁决后的单独范围。
- 不因 `IdentitySystem` 已有 criteria 就隐式激活 deferred identity event files。
- 不把测试 fixture、分析 profile、叙事模板或历史旧引擎的直接 `sect/title` 写入视为当前新引擎的正式 producer。

## 12. 结论

当前仓库已经有足够多的正式状态来支持一次产品语义裁决，但还没有一个足以覆盖所有“玩家身份、归属和人生方向”信号的统一 owner。`state.identity` 是当前摘要唯一读取的正式身份容器；它显示 `none` 的原因已被代码直接证明。`player.sect`、`player.title`、`lifePath`、flags、route/profile 和 ending 各自承载不同粒度的语义，当前更准确的判断是“概念尚未正式收敛”，而不是“需要把所有来源马上合并”。

下一步应由产品裁决选择概念边界、canonical owner、持久化策略和跨端展示契约；本报告到此停止，不进入 Identity 实现、晚年行动或长期回响候选阶段。
