# Wuxia-Life 单角色人生全局实现差异台账

> **性质：只读审查的差异登记与后续治理导航，不是新的 Product Decision、Contract、Schema、实施计划或 Codex 授权。**
>
> **首次登记：**2026-10-10  
> **审查基线：**`molibaby1/wuxia-life` / `dev` / `c7ba4f1a3508d80e2568efefdbe76afbf1245683`  
> **审查方式：**直接核对 GitHub `dev` 的正式文档、当前代码、事件定义、Snapshot 定义及测试**源码**；本轮没有执行新一轮完整自然人生模拟、浏览器/API 联机体验或当前 HEAD 测试命令。  
> **登记状态：**初次全局调查完成；后续需由 Human 分项确认验证与治理授权。  
> **更新原则：**未来更新时记录新的核验日期、HEAD、可重现证据、Human 决定和结果，不用新的代码状态自动覆盖已有正式产品语义。

> **2026-10-10 架构裁决：**[PD-130](product-decisions.md) 已批准**退役浏览器 Local 玩家 Runtime**。原始代码审查证据保留；SL-GAP-02／03 在实际入口退役后记为 `RETIRED_WITH_RUNTIME`，不再作为 Local 缺陷修复目标。SL-GAP-04 不再追求与浏览器 Local 的玩家体验 parity，继续保留正式 Headless／API 调度合规验证。SL-GAP-01 及其他非 Local-only 问题照常保持 OPEN。**不迁移或兼容旧存档**，但不据此更改现行 Snapshot Contract。

> **PD-130 实施核验（2026-10-10；实施起点 `dev` HEAD `42f77408bcb7f2f08b679674fa80de93a242b8fe`）：**正式 Web 入口已无 `useNewGameEngine` 路径。真实浏览器 API smoke 覆盖新档、事件选择与反馈、主动行动与结算、保存、页面重载、恢复并继续；另在“柜台边的小主意”待选择时保存，重载后恢复同一事件及两个选项并结算。缺少 `VITE_P6B_API_URL` 显示配置错误，API 不可用显示后端失败，均未启动 Local。Headless `playerVisibleFeedback.test.ts` 覆盖正式自动事件、Choice outcome 结算与玩家反馈；`headlessSession.test.ts` 覆盖合法空效果选择、单次事件记录及结果确认；`p72SessionPhase.test.ts` 覆盖阶段确认与事件调度；`tests/AllTests.ts` 保留共享 `resolveFirstChoiceEffects` 的首个可用 outcome、条件不满足／无效条件及选择 effects fallback 行为断言。API 集成测试覆盖待处理正式事件保存恢复，`normalLongevityEndingClosure.test.ts` 覆盖寿终、终局快照恢复与重复推进幂等。**未执行从出生到寿终的完整自然 Web 人生。**`npm run typecheck`、`npm run build`、`npm run test:contracts`、`npm run test:headless`、`npm run test:p6b:unit`、`npm test`、`npm run test:p6b` 通过。默认 Headless `npm run gate:playability` 当前与隔离的未修改基线均失败，8 个 persona 有 frustration / opaque-ratio blockers；剔除 `generatedAt` 后两份 JSON 报告完全相同，且本次 diff 未改动 Gate 的 Headless Runtime、Simulator、Persona、指标或脚本依赖，未发现本次退役引入的 Gate 回归；SL-GAP-04 因此仍开放。`report:p2-gameplay-structure` 未运行；已知 `routeCompletionRate is not defined` 在实施起点也存在，本次脚本差异只调整 Choice feedback 覆盖扫描，未处理该异常。


> **2026-10-10 Frustration 调查与裁决：**基线 dev / fc418f2c0ead3ae66fb672e647eae9f2da416e25 上，默认 Headless P8 Gate 复现 8/8 persona frustration blockers；8 局均截至年龄 40。按**旧评价器**统计 33 条候选负面记录、26 opaque；样本混有实际大幅结算下降、状态展示疑点、文本分类漏判与属性超限归一化疑点。不能把 26 条一律裁为“不公平挫折”。Human 已批准 [PD-131](product-decisions.md) 作为产品评价依据；**当前 Gate、阈值、基线、事件和 Runtime 均未修改，Gate 仍 NO-GO**。此项另记 SL-GAP-10，不能以 frustration blocker 代替 SL-GAP-04 的调度违规证据。

## 1. 权威与使用边界

- **顶层游戏产品：**[`docs/product/game-product-foundation.md`](../product/game-product-foundation.md)；以单角色完整人生及行动—时间—世界—历史—反馈—正常结束因果闭环作为审查主线。
- **人物和长期反馈：**[`docs/product/player-model.md`](../product/player-model.md)，尤其 Life Milestone 的事实派生、ACQUISITION / POSITION / PROSPECT / CONTINUITY。
- **正式裁决：**[`docs/governance/product-decisions.md`](product-decisions.md)，尤其 PD-030、PD-031、PD-033、PD-108、PD-126、PD-127、PD-128、PD-129；具体事项服从仍有效的领域 Product Decision / Contract / Schema。
- **领域 Contract：**[`Character / Relationship`](../product/character-relationship-product-contract-design.md)、[`Parenthood / Family Life`](../product/parenthood-family-life-product-contract-design.md)、[`Content Authoring Workflow`](../product/content-authoring-workflow-contract-design.md)；正式持久化按 [Snapshot Contract](../contracts/game-state-snapshot-contract.md) `3.16.0`。
- **实现证据：**以每次复查时指定的 GitHub `dev` HEAD 为准。本次下方文件位置均以首次基线为依据；未来代码行号可能变化。
- **协作规则：**缺陷先验证和定位根因，再提最小有界治理任务；本台账的排序不表示已经获得实施授权。

**不得据此启动：**通用世界/NPC 模拟、通用 StoryArc 或任务状态机、平行成就/人生评价体系、跨人物档案与奖励、批量事件扩写、整体 Ending 重构或 Auto Evolution 能力扩张。既有 Status Issue #5 继续单独保留，不因这份台账自动升级优先级。

**分项状态含义：**`CONFIRMED_CODE_GAP` = 由当前代码及正式语义直接支持的实现差异（不等于新一轮运行复现已完成）；`CONFIRMED_PATH_DIFFERENCE` = 代码路径差异已明确，但产品影响还需实例；`NEEDS_VALIDATION` = 现有证据不足以定性缺陷；`DEFERRED` = 尚非核心阻碍；`RETIRED_WITH_RUNTIME` = 仅属于已退役 Runtime 的差异不再形成维护义务（不表示替代路径通过了该项独立语义测试）；`CLOSED_VERIFIED` = 只有取得当前证据后才可使用。所有项初始均为 `OPEN`，禁止写成“已修复”。

## 2. 当前体验链路与实现边界

```text
出生 / 初始人物状态与出身事实
→ 年龄、年月日与人生阶段
→ 主动行动、合法事件、重要选择、世界变化 / 挫折
→ 实际效果结算 + canonical facts + actionHistory / eventHistory
→ 公开结果 / 阶段反馈 + Life Memory / Life Milestone 派生
→ 后续事件机会、人物关系、历史因果
→ 正常寿终或其他合法生命终结
        ↑
   正式 Web：Vue UI → Server API → Headless Session → 共享核心引擎
   无数据库 Headless 模拟 / 回放仍供测试与验证使用
```

主实现入口：
- API：[`useApiGameEngine.ts`](../../src/composables/useApiGameEngine.ts) → [`server/src/services/gameService.ts`](../../server/src/services/gameService.ts) → [`HeadlessEngineSessionImpl.ts`](../../src/headless/session/HeadlessEngineSessionImpl.ts) → 同一核心引擎。
- `GameProcessSimulator.local_direct` 是 P8 独立仿真路径，不是浏览器玩家 Runtime。
- 内容和因果：[`EventLoader.ts`](../../src/core/EventLoader.ts)、[`ActivePlanningService.ts`](../../src/core/activePlanning/ActivePlanningService.ts)、[`ChoiceOutcomeResolver.ts`](../../src/core/ChoiceOutcomeResolver.ts)。
- 长期反馈：[ `deriveMilestoneProjection.ts` ](../../src/core/deriveMilestoneProjection.ts)、[`deriveLifeMemorySummary.ts`](../../src/core/deriveLifeMemorySummary.ts)、[`GameScreen.vue`](../../src/components/GameScreen.vue)。
- 终局：[`EndingSystem.ts`](../../src/core/EndingSystem.ts)、[`EndingScreen.vue`](../../src/components/EndingScreen.vue)。

**已确认存在的基础能力（仅为代码层面）：**带时间/收益/风险与历史的主动行动；依资格、权重、冷却和历史选择的正式事件；具备实际 delta 的结算；持久 `eventHistory` / `actionHistory`；从正式事实派生而不反向修改状态的 Milestone；Headless 当前正式事件决策点保存；法定终局效果和展示。**不可据此推断完整人生自然运行、跨端行为或玩家体验已经达标。**

## 3. 差异总览与初步处理顺序

下表顺序按对**合法行动、真实时间、长期因果、存档连续性与玩家可感知反馈**的影响排定，不按文件复杂度或修复成本排序。排序为调查建议，可依复现实证调整。

| ID | 待处理问题 | 证据定性 | 初步优先 | 当前状态 | 后续最小决策点 |
| --- | --- | --- | --- | --- | --- |
| SL-GAP-01 | 主动行动的年龄推进可能遗漏正式节点钩子 | CONFIRMED_PATH_DIFFERENCE | P1 | OPEN / 待复现 | 跨生日时节点事实是否缺失、最小受影响路径 |
| SL-GAP-02 | 已退役 Local 曾拒绝合法的零效果选择 | CONFIRMED_CODE_GAP（历史基线） | 退役归档 | RETIRED_WITH_RUNTIME | 浏览器 Local 执行入口已删除；不为旧路径补修；此状态不代表已验证 API 零效果选择 |
| SL-GAP-03 | 已退役 Local 曾无法恢复未完成的当前正式事件 | CONFIRMED_PATH_DIFFERENCE（历史基线） | 退役归档 | RETIRED_WITH_RUNTIME | 真实 API Web smoke 已保存并恢复正式事件后继续；不为旧路径补修 |
| SL-GAP-04 | 正式 Headless/API 调度与行动优先级合规性仍需核验 | CONFIRMED_PATH_DIFFERENCE | P1 验证 | OPEN / 保留正式路径验证 | 核验 PD-126 决策点；8 个 frustration blockers 不构成已证实调度违规（另见 SL-GAP-10） |
| SL-GAP-05 | Milestone 详细持续查询未进入当前主界面 | CONFIRMED_CODE_GAP | P1 反馈 | OPEN | 四项反馈职责在生产入口的实际可达性 |
| SL-GAP-06 | Milestone 重要经历覆盖可能不足 | NEEDS_VALIDATION | P2 | OPEN | 真实人生中哪些有证据的重要经历未获记录 |
| SL-GAP-07 | 重要人物与关系的可达人生连续性 | NEEDS_VALIDATION | P2 | OPEN | 已批准 Person-first 语义在活跃内容中是否成立 |
| SL-GAP-08 | 无家庭人物可被推为“壮志未酬” | CONFIRMED_CODE_GAP / 领域冲突 | P2 | OPEN | 评价是否具备实际志向未实现的事实依据 |
| SL-GAP-09 | 自然出生至终局 / 早逝 / 存档的端到端证据不足 | NEEDS_VALIDATION | P2 验证 | OPEN | 不注入终局年龄时能否正常结束且状态一致 |
| SL-GAP-10 | Frustration 负面经历、风险提示、结果反馈与 Gate 证据口径混淆 | CONFIRMED_CODE_GAP / SEMANTIC_EVIDENCE_GAP | P1 体验证据 | OPEN / Slice A、D、C1、C2a 已完成；C2 与其他证据仍开放 | 按 PD-131 继续处理未决 Status、文本分类与 Gate 证据口径；最新隔离 P8 Gate 为 4 个 frustration blocker，仍 NO-GO |
| SL-GAP-11 | 跨领域物品与持有基础能力尚未形成正式完整闭环 | CONFIRMED_CODE_GAP（静态证据，待运行验证） | 战略基础优先，实施范围待裁决 | OPEN / 待核查与设计 | 唯一归属真源与跨领域 Item 获得／持有／失去／后续识别闭环；数量与消耗延期 |

### SL-GAP-01 — 主动行动与日历推进的年龄节点分叉

- **现象/代码证据：**[`GameEngineIntegration.advanceTime()` L1726–1765](../../src/core/GameEngineIntegration.ts) 在年龄变动后执行 `applyYouthTransitionSeeds` 及 `applyP16RareLineCheckpoints`；[`executeActiveActionOnState()` L112–143](../../src/core/activePlanning/ActivePlanningService.ts) 通过同文件 `advanceTimeOnState()`（L264–298）直接修改年龄/日期，不调用上述钩子。
- **涉及正式语义：**Game Product Foundation §3.2；PD-129 的年龄、不可逆经历、真实因果；P16 已有具体节点规则仍须遵守。
- **可能影响（推断）：**通过主动行动跨越 10 / 13 / 15 / 20 岁等节点时，少年阶段衔接或稀有机缘检查可能遗漏；不等于已经证实某局自然游戏漏触发。
- **最小验证：**相同合法 state 与跨生日条件下，分别走正式日历与行动路径；对比年龄、过渡 flags、稀有节点记录与后续事件资格。检查是否存在其他结算路径补偿。
- **验收关注：**同一正式时间变更的生命周期结果不应因操作入口而无依据分叉；不得借机新增通用时间/人生引擎。
- **状态：**OPEN；仅完成只读路径核对。

### SL-GAP-02 — Local 曾误把合法零效果决定当成无效选择（已随 Runtime 退役）

- **首次审查基线（已退役源码）：**原 `useNewGameEngine.handleChoice()`（当时 L352–387）在 `effectsToExecute.length === 0` 时返回 `false`，不继续结算。活跃目录登记的 [`relationship_life_saving`](../../src/data/lines/relationship.json) 有合法选项 `relationship_life_saving_not_save`，其 `effects: []`；[`src/data/events.json`](../../src/data/events.json) 引用该 line。对照 [Headless 选择执行](../../src/headless/session/HeadlessEngineSessionImpl.ts) L431–445 可执行空 effects。
- **正式语义：**PD-030（合法选择一次完成真实阶段）；玩家有权决定不参与、不承诺。无公开状态 delta 不等于无合法决定。
- **影响：**该事件达到合法触发条件并在 Local 展示时，“继续赶路”会被拒绝，阻断这一决策点。
- **最小验证：**以合法事件/选项直接复现；验证 Local、Headless、API 对“零效果但合法”的执行、历史与推进一致。
- **验收关注：**合法空 effects 仍能完成事件；无新增虚构效果、无重复结算、无额外确认页。
- **状态：**`RETIRED_WITH_RUNTIME`（2026-10-10）。上述行为仅描述首次审查基线；Local 玩家入口、`useNewGameEngine` 与其专属流程已从当前工作树移除，生产 Web 仅走 API／Headless。未将此状态解释为 API 零效果选择已通过独立验证。

### SL-GAP-03 — Local 曾在恢复时重新抽取未完成的事件（已随 Runtime 退役）

- **首次审查基线（已退役源码）：**Local 当前事件曾处于 `useNewGameEngine.engineState.currentEvent`；其 `loadGameFromSave()`（当时 L718–745）恢复 Snapshot 后清空事件并调用 `getNextEvent()`。[`HeadlessEngineSessionImpl.serialize()` L502–527](../../src/headless/session/HeadlessEngineSessionImpl.ts) 则使用已有 `pendingStoryEventId` 表示可恢复目录事件；hydrate 重新挂载。
- **正式语义：**单角色承诺/机会连续性；PD-126 明确覆盖 Headless、P8、API 的决策点行为（其文字不直接宣称 Local 也在同一实施范围）；Snapshot `3.16.0` 的既有字段边界。
- **影响（推断）：**保存事件 A 后读取，Local 可能重新选择事件 B；至少未可靠保留原决策点。
- **最小验证：**在同一已选未结算事件处保存、恢复，并比较事件 ID、选项、随机次数、历史与可用行动。额外验证已执行事件、未确认结果、终局的边界。
- **验收关注：**不静默替换已经进入的决策点；不擅自新增 Snapshot 字段或通用调度状态。
- **状态：**`RETIRED_WITH_RUNTIME`（2026-10-10）。真实 API Web smoke 在“柜台边的小主意”待选择时保存并重载，恢复了同一事件及两个选项，随后正常结算并继续推进。该证据验证本次被选定 API 事件恢复路径；不把旧 Local 的维护责任移交给其他实现。

### SL-GAP-04 — 正式 Headless/API 调度与行动优先级合规性

- **历史路径差异：**首次审查发现的 Local [`getNextEvent()` L125–244] 在判断可用主动行动前尝试调度；浏览器 Local Runtime 已退役，这个差异不再形成并行维护或 parity 要求。
- **当前正式路径证据：**PD-126 约束 Headless/API 的行动、强制事件、行动确认与时间推进调度；`npm run test:headless`、`npm run test:p6b` 通过。2026-10-10 的 8 个 persona frustration / opaque-ratio blockers 已另归 SL-GAP-10：代表性运行未见可确认的调度违规，但未采集完整 Scheduler 候选、eligibility、权重与选择证据，故不能据此关闭本项。
- **正式语义：**PD-126 对 Headless、P8、API 的优先级具有具体约束；PD-030 / PD-033 约束操作与正式结算。不可把 PD-126 未写明的 Local 范围自动扩张为已经裁决的实现细节。
- **可能影响（推断）：**正式 Web 的 API/Headless 决策点可能仍有不合 PD-126 的情况；随机选择天然允许不同，不要求相同 seed 的每个事件绝对一致。
- **最小验证：**对正式 API/Headless 的合法决策点和受控调度机会核对何时允许 Scheduler 抽取、是否抢占有效主动规划、结果是否重复确认；不再比较浏览器 Local。
- **状态：**OPEN / NEEDS_VALIDATION；不得仅凭分支顺序直接宣布完整产品缺陷。

### SL-GAP-05 — Milestone 详细查询入口缺口

- **现象/代码证据：**[`deriveMilestoneProjection.ts`](../../src/core/deriveMilestoneProjection.ts) 从当前事实与历史派生已获得/Prospect；[`lifeMemoryFeedback.ts`](../../src/components/lifeMemoryFeedback.ts) 与 [`GameScreen.vue` L306–365](../../src/components/GameScreen.vue) 已有获得卡。[`LifeMemoryPanel.vue`](../../src/components/LifeMemoryPanel.vue) 能展示描述、取得年龄与依据，但当前生产 [`GameScreen.vue` L125–155](../../src/components/GameScreen.vue) 未挂载；主界面仅挂载摘要及属性面板，印记和 Prospect 只显示紧凑内容。
- **正式语义：**PD-128；Player Model 的 ACQUISITION / POSITION / PROSPECT / CONTINUITY 以及取得依据的只读解释边界。
- **影响：**长期印记数据存在，但玩家缺少当前主流程内可持续打开的详细历史查询入口。不能误判为“Milestone 完全未实现”。
- **最小验证：**在正式 Web API 路径取得里程碑后验证入口、详细内容、已获得依据、Prospect、读档重看及无额外写入。
- **验收关注：**接入现有事实派生和展示能力，不再造 Milestone ledger、奖励、第二套 Achievement 或额外状态。
- **状态：**OPEN；生产组件树差异已确认，浏览器可达性待实测。

### SL-GAP-06 — Milestone 代表性与历史证据覆盖

- **当前证据：**[`life-milestones.json`](../../src/data/life-milestones.json) 有 13 个定义（8 个 `progress_stage`、1 个 `turning_point`、3 个 `payoff_echo`、1 个 `synthesis`）；[`src/types/milestone.ts`](../../src/types/milestone.ts) 条件使用 Habit、主动行动次数及事件发生历史。目录已有“行功遇险”负面转折，不能说负面印记完全不存在。
- **未确认：**少量目录不等于必然违反 PD-128；是否遗漏人生中真正重要的中性/负面/关系/责任经历，需要自然人生样本和合法历史证据证明。
- **最小验证：**不同出身与实践、重要关系、挫折、无婚育人生的有限样本；先列实际重要经历与当前可证明事实，再判断是否存在具体缺口。
- **禁止：**按领域硬凑数量、按 Tier 填矩阵、将 Milestone 用作游戏状态/奖励、建设平行成就体系。
- **状态：**OPEN / NEEDS_VALIDATION。

### SL-GAP-07 — 重要人物与关系的整体连续性

- **已确认：**正式 [Character / Relationship Contract](../product/character-relationship-product-contract-design.md) 要求 Person-first、真实交集、选择/冲突和可靠历史；[Parenthood Contract](../product/parenthood-family-life-product-contract-design.md) 要求子女作为独立人生可能，no-child 合法。[`tests/characterRelationshipMingyueV1.test.ts`](../../tests/characterRelationshipMingyueV1.test.ts) 与 [`tests/parenthoodMingyueV1.test.ts`](../../tests/parenthoodMingyueV1.test.ts) 定义了具体人物纵切验证。关系 Contract 已明确登记部分 legacy 语义仍待迁移。
- **未确认：**这些纵切不证明所有活跃人物/关系内容的自然可达性、独立意愿、历史消费和长期留存；遗留字段存在也不自动证明每一条活跃路径违规。
- **最小验证：**以当前活跃目录和自然人生追踪具体人物从进入、交集、分岔至后续引用的路径，并验证不进入恋爱/婚姻/亲子的人生也合法。
- **禁止：**据此先造通用 NPC 自治模拟、自动生成人物或 Relationship v2。
- **状态：**OPEN / NEEDS_VALIDATION。

### SL-GAP-08 — Ending 中的家庭价值推断冲突

- **现象/代码证据：**[`EndingSystem.determineNeutralEnding()` L547–584](../../src/core/EndingSystem.ts) 以达到中等功力/声望/学识且**没有配偶子女**为条件，判为 `unfulfilled_ambition`，没有要求真实“未实现志向”的历史事实。[相应测试](../../tests/quietFamilyLifeEndingExplanation.test.ts) L115–126 固定了有无家庭造成的分类差异。
- **正式语义：**[Parenthood Contract §2](../product/parenthood-family-life-product-contract-design.md) 明确禁止因缺少家庭事实推导“壮志未酬”“不完整”等评价；PD-128 不将复杂独立 Ending 分类作为当前核心建设目标。
- **玩家影响：**正常无婚育、但有自身成长的人生可能被盖上缺少事实依据的负面价值判断。
- **最小验证：**使用同能力、有/无家庭及有/无真实未竟志向事实的样本，核对终局 ID 和展示；区分合法已有终局兼容资产与应处理的语义冲突。
- **禁止：**未经授权全量拆除 EndingSystem 或创建新的生命周期评分轴。
- **状态：**OPEN；明确领域 Contract 冲突，尚未授权具体迁移。

### SL-GAP-09 — 完整自然人生及终局跨端证据不足

- **已确认：**[`tests/normalLongevityEndingClosure.test.ts`](../../tests/normalLongevityEndingClosure.test.ts) 定义了 80 岁 `ordinary_life` 正式终结、终局不可重复结算及 Headless Snapshot 恢复测试；[`tests/earlyDeathTerminalConsistency.test.ts`](../../tests/earlyDeathTerminalConsistency.test.ts) 有早逝的状态一致性验证。
- **证据界限：**这些测试主要构造或注入特定年龄/状态；历史 [`tests/fixtures/gates/p8-playability-gate-latest.json`](../../tests/fixtures/gates/p8-playability-gate-latest.json) 生成于 2026-08-08 且结束年龄为 40，不是本基线下真实出生至寿终证明。
- **最小验证：**真实从出生依合法事件/主动行动推进至正常结束；覆盖无重大成就、不同路线、提前死亡与存档恢复；检查终局年龄、唯一结算、反馈和新人物不继承旧人物事实。
- **禁止：**把新的详细人生总结或评价系统当成验证正常结束的必要前置。
- **状态：**OPEN / NEEDS_VALIDATION。

### SL-GAP-10 — Frustration Fairness 与 Gate 证据口径

- **复现事实：**2026-10-10 / fc418f2c0ead3ae66fb672e647eae9f2da416e25。默认 Headless P8 Gate 失败，8/8 persona blocker、0 warning，全部运行到年龄 40（并非寿终）。原分类器口径各人 3–5 条“负面记录”，合计 33 条、26 opaque／7 warned；**这些是旧评价器的输出，不是已经验证的玩家不公平挫折数量**。附加 Headless 玩家界面与结算状态追踪支持以下有界分类，未更改源码。
- **A — 真实属性下降／内容意图（审查基线 16 条 opaque）：**refugee_sect_story（8 persona）、court_politics_revealed（5）、p26_business_habit_obligation（2）、merchant_talent_discovery（1）相关 stat_modify 省略 operator；共享 statModifySemantics.ts 默认 set。Human 已对九项效果作出后续明确裁决，Slice A 已按批准的操作符修复，详见下方实施记录；共享默认语义未变。
- **B — 文本分类漏判（5 条）：**youth_road_peril 的选项描述已有“带伤／伤痛”等可见风险，但现有关键词组合将其判为 opaque；应核对完整玩家可见信息与评价判定，不能仅靠增加单词关闭缺陷。
- **C — 状态反馈疑点（2 条）：**`career_martial_innovation` 曾实际添加 `fatigued` 等 Status，但结果卡未展示变化。Slice C1 已通过 canonical before/after 为 Choice 与 Daily recovery 的实际状态变化补充反馈，没有扩展 `PlayerSummaryDto` 或 Snapshot；Status 长期保留价值仍属 Slice C2，继续开放审查。
- **D — 越界／归一化疑点（2 条）：**medical_imperial_doctor、medical_palace_intrigue 样本观察到 charisma 101→100、104→100；正式操作 clamp 至 0–100，应追溯越界生产路径，不允许以“正常的负面经历”或“直接从分母排除”替代根因定位。
- **E — 预警充分性待核查（1 条）：**demonic_encounter 的 chivalry 8→0 已由结果卡展示，选择前对侠义损失的可预见性仍需核验。
- **权威与分界：**[PD-131](product-decisions.md) 已明确真实事实、选择前合理可预见性、事后事实反馈与玩家可见 Gate 证据的不同职责。PD-031／032／033 与 PD-079 保持有效。与 PD-126 调度（SL-GAP-04）及自然完整人生（SL-GAP-09）分开处理。
- **下一步最小范围：**Slice A、Slice D 与 Slice C1 已完成。继续核验 B 类文本分类、E 类 `demonic_encounter` 选择前风险、Slice C2 的具体 Status 长期用途，并独立治理 P8 证据口径。现有 `>0.35` 阈值、旧报告、历史 fixture 不改；一旦正式更换指标口径，单独版本化并建立有证据的新基线和回归，不以删除 blocker 为目标。
- **Slice A 实施与验证（2026-10-10；实施提交 `281b51193fc9760fbd02e46cf37238a71dd60ea6`）：**仅对四事件九项已裁决效果写入显式 `operator`；新增 `tests/fourEventStatEffectIntent.test.ts`，通过 EventLoader 装载正式定义、EventExecutor 实际结算，并将玩家公开 delta 与 canonical before/after 对照。回归先在旧行为下复现失败（侠义 `-8→5`，预期增量结算 `-8→-3`）；修复后覆盖多组属性初值、Trait 增长倍率、名望下限、魅力上限、flags、资格条件及 Merchant 开店资格。公布真相选项增加方向性文案“公开真相可能损及名望。”，不披露精确数值。PD-081 未被追溯解释为曾规定声望使用 `add`；该操作符依据是本次 Human 补充裁决。
- **Slice A 验证结果：**`git diff --check`、`npm run typecheck`、`npm run build`、`npm run test:contracts`、`npm run test:headless`、`npm run test:p6b:unit`、`npm test`、`npm run test:p6b` 与定向真实结算测试均通过。隔离输出的 P8 Headless Gate 仍为 `fail`：5 个 persona blocker、0 warning，阈值仍为 `0.35`；未覆盖或未解决的样本包括 youth_road_peril、demonic_encounter、career_martial_innovation、medical_imperial_doctor／medical_palace_intrigue。该 Gate 结果不代表 PD-131 整体语义迁移完成。
- **SL-GAP-10 / Slice A 状态：**CLOSED；**SL-GAP-10 整体状态：OPEN。**PD-131 的 Status 长期用途（Slice C2）、`charisma` 越界来源、文本与 Gate 证据口径以及其他风险仍开放；没有把 26 条 opaque 一并关闭。SL-GAP-04 与 SL-GAP-09 继续独立开放。
- **Slice D 根因与修复（2026-10-10；修复提交 `31a081442ee5bcf5c6ef1947553006b0016aecef`）：**首次越界来自年龄 29 的 `p8-social-gu / seed 803`：`medical_divine_doctor_fame` 将 charisma `92→100` 后，第 178 步 `action_socializing_basic` 经 `executeActiveActionOnState → applyStatDeltas → writePlayerNumeric` 写成 `100→101`。共享写入函数当时没有 charisma 边界；主动行动的历史、解析结果和反馈沿用了理论增量。之后两次交游将状态推至 `104`，Medical `add` 效果才把 `101→100`、`104→100`，故 Medical 不是首个越界生产者。完整修复前运行峰值为 `133`。
- **Slice D 修复内容：**共享 `writePlayerNumeric` 只对 charisma 截断至 `0..100`，其他属性语义不变；`applyStatDeltas` 返回实际 before/after 增量，主动行动的 `ActionResult.deltas`、`ActionHistoryEntry.deltas`、奖励摘要、行动摘要、结果解释和完成反馈都消费该实际值。年度／学前被动成长摘要采用实际增量；`CriticalChoiceSystem` 的 `marriage_choice:love` 直接魅力写入也改走共享边界，侠义 `+5` 与选择事实保留。Trait 倍率、年龄收益、事件定义、Snapshot 与 Gate 口径未改。
- **Slice D 验证结果：**`90→91` 正常增长、`99→100` 只记录实际 `+1`、`100→100` 记录 charisma `0` 且行动仍推进时间并留历史；主动行动历史、结果对象及公开 before/after delta 一致。Headless 被动 `99→100` 公开 `+1`、`100→100` 不显示虚构收益；关键选择近上限不越界；两条 Medical 正向效果在 `100` 输入时保持 `100→100` 且其他奖励／flag 正常。`p8-social-gu / seed 803` 修复后完整运行至 40 岁，最大值 `100`、越界转移 `0`；8 个 P8 persona（seed `801..808`）均运行至 40 岁，越界转移均为 `0`。`npm run typecheck`、`npm run build`、`npm run test:contracts`、`npm run test:headless`、`npm run test:p6b:unit`、`npm test`、`npm run test:p6b`、`git diff --check` 及定向回归通过；覆盖包含 Trait 增长倍率和 Slice A 四事件效果。
- **Slice D Gate 与 Snapshot 边界：**隔离 P8 Gate `fail`，4 blocker、0 warning、阈值 `0.35`，均为 frustration opaque-ratio（`p8-martial-lin`、`p8-scholar-su`、`p8-deviant-ye`、`p8-explorer-lu`）；Slice A 后的 5-blocker 基线报告保留未覆盖。Snapshot `3.16.0` 校验及 Headless 恢复实测仍接受并保留 `charisma=101`；本次按范围未改 Snapshot validator 或 Contract，旧／外部构造的非法 Snapshot 仍是单独待治理的传播风险。
- **SL-GAP-10 / Slice D 状态：**CLOSED（仅限已确认的主动行动、共享被动成长和关键选择写入路径及其结果一致性）；**SL-GAP-10 整体状态仍为 OPEN**。Status 长期用途（Slice C2）、文本分类、选择前风险与 Gate 证据口径仍待处理；不得据此将 PD-131 整体迁移、SL-GAP-04 或 SL-GAP-09 标记完成。

- **Slice C1 实施与验证（2026-10-11；提交 `aaf418cf72376d75488e0eee634db6f49e39b0ca`）：**Choice 仅在 canonical before/after 确认 `fatigued` / `anxious` 净变化时，将事实说明附加到既有 `narrativeResult`；Daily recovery 仅在结算确实移除对应 Status 时写入 stage result，单独 `story_automatic` 结果也只消费实际 stage result。未改变 Status 结算或生命周期，未新增反馈 Contract、API 字段或 Snapshot 语义。
- **Slice C1 验证结果：**定向 `playerVisibleFeedback.test.ts` 先 RED（空状态 `innovate_full` 未报告两项新增），修复后 PASS；覆盖重复添加、已存在及不存在状态的移除、属性 delta 与叙事并存、恢复后 Choice、Daily fatigue/anxiety recovery、catch-up 与独立 `story_automatic` 结果，以及无实际变化时不声称恢复。`npm run typecheck`、`npm run build`、`npm run test:contracts`、`npm run test:headless`、`npm run test:p6b:unit`、`npm test`、`npm run test:p6b`、`git diff --check` 均通过。隔离正式 API 的 Choice 请求返回 HTTP 200，API 反馈与 canonical 状态一致；真实浏览器 DOM/截图验证 `innovate_full` 的 `[] → [fatigued, anxious]`、状态说明与功力 `+10`，以及 `innovate_suspend` 的 `[anxious] → []`、解除说明与学识 `+3`。当前浏览器工具未提供独立 DevTools Console/Network 面板；API 响应另以 HTTP 请求核验。当前代码与隔离的 `origin/dev` / `11a7c799` Headless P8 对照均为 `FAIL`、4 个相同 frustration blocker、0 warning，阈值 `0.35` 未改；该结果不改变 Gate 口径，也不证明长期 Status 价值。
- **SL-GAP-10 / Slice C 状态：**Slice C1 `CLOSED`；Slice C2 `OPEN`，仍待按具体事件审查长期消费者、可达性、恢复机会、玩家理解及人生时间尺度。Slice A、Slice D 保持 `CLOSED`；**SL-GAP-10 整体仍为 `OPEN`**。

- **Slice C2a 实施与验证（2026-10-11；起始 `dev` / `7b820853b418e6ec2902d3573c2f95092eff615f`；代码提交 `5143fbb5`）：**按 PD-131 补充裁决，仅移除指定 10 个 Daily 与 6 个 Choice 的持久 `status_add`。Daily 与 Choice ID 清单见 PD-131 的 2026-10-11 Status 具体内容裁决；4 个未决 Daily `anxious` 来源及 `innovate_full` 的 `anxious` 保持原行为。未改 Status 类型与生命周期、调度、Snapshot、C1 反馈、奖励或 P8 Gate。Family crisis 的 `family_crisis_limited_support` 移除最后一项效果后显式保留空效果 Choice；正式 Headless 结算测试确认仍成功执行、未添加 `anxious`，且存档历史与响应追加各恰有一条 `family_crisis` 记录。
- **Slice C2a 定向与项目验证：**`canonicalFatigueAnxietyStatusMigration.test.ts`、`playerVisibleFeedback.test.ts`、`choiceIdExecutionClosure.test.ts`、`boundedFormalEventAuthoring.test.ts`、`p38FrustrationRemediationTests.ts`、`wealthDailyCashAbstraction.test.ts` 均通过；新增 Family crisis 空效果 Choice 历史结算断言。`git diff --check`、`npm run typecheck`、`npm run build`、`npm run test:contracts`、`npm run test:headless`、`npm run test:p6b:unit`、`npm test`、`npm run test:p6b` 均通过。测试覆盖指定来源删除、保留来源、恢复与 before/after 反馈、确定性奖励及空效果正式事件历史；武林大会 Choice 1 的 `+50 / -10` 声望分支定义由内容契约断言保护。
- **Slice C2a 自然轨迹与 Gate 对照：**`p8-martial-lin / seed 801 / local_direct` before/after 均运行到 40 岁，38 条事件、22 次选择。33 岁 `innovate_full` 功力均为 `24→34`；Status 从 `[]→[fatigued, anxious]` 变为 `[]→[anxious]`，最终仍有 `anxious`。34 岁自然选择武林大会的 Choice 3，既有属性结果不变。该自然轨迹没有选中 25 岁 Daily 焦虑来源，因而不作为该 Daily 在自然人生中消失的证据；该来源由定向 DailyEventSystem 结算测试验证。改动前后 8-persona P8 Gate 均为 `FAIL`、终止年龄 40、4 个相同 frustration blocker、0 warning、阈值 `0.35`；创新事件 blocker 描述从“进入疲惫状态”变为“进入焦虑状态”。Gate 指标、分类器、阈值及 fixture 未修改，此结果不评价本次裁决正确性。
- **武林大会 Choice 1 奖励缺口（C2a 基线事实，后续已修复）：**正式 Headless 对 C2a 实施前后的 Choice 1 结算在 seed `1..3` 下声望均保持 `40`；改动前状态会新增 `fatigued`，改动后不再新增。Choice JSON 中原有 `success` `+50` / `failure` `-10` 声望分支仍完整保留，但当时正式路径两侧都没有应用该奖励。该记录描述 C2a 阶段发现的基线问题；2026-10-11 已按 PD-132 接入现有 ChallengeSystem，当前实现与证据见下方收尾记录。
- **SL-GAP-10 / Slice C2a 状态：**`CLOSED`（仅限本次批准的 16 个具体来源与自身验证）；Slice C2 仍 `OPEN`，包括 4 个未裁决 Daily `anxious` 来源、`innovate_full` 的 `anxious` 长期价值、保留生产者的完整玩家反馈核查、旧 Snapshot 状态的实际人生行为、`youth_road_peril` 文本与 Gate 证据分类、`demonic_encounter` 选择前风险、非法 Snapshot `charisma` 输入传播，以及下方列出的其他两项 Random Effect 缺口和独立开放的 SL-GAP-04、SL-GAP-09。Slice A、Slice D 与 Slice C1 继续 `CLOSED`；**SL-GAP-10 整体及 PD-131 的 C2 均保持 `OPEN`**。

- **最小通用 Choice Challenge 收尾（PD-132；实施起点 `dev` / `b4285e3c7c5e8bf73ab064114df96eb4957c2a10`）：**仅显式配置 `choice.challenge` 的 Choice 调用现有 ChallengeSystem 场景判定；武林大会 Choice 1 是首个实例，`martial_arts_tournament` 的既有功力、学识、难度及测试模式倍率规则继续参与判定。正式受控随机上下文中只判定一次，只执行命中的 `stat_modify` 声望分支（成功 `+50`、失败 `-10`）。定向 Headless 测试验证两支 canonical 声望变化、真实结果反馈与事件历史一致、普通 Choice 和 Choice 2／3 不变；无效场景在抽签前失败且不执行效果。未改其他六项已加载 Choice、P8 Gate、概率数值、Random Effect Contract、API、Save 或 Snapshot。
- **挑战回放与已知限制：**回放复用记录中现有 `outcomeText`，通过与成功／失败叙事文本的唯一匹配选择原分支效果，不重新抽签；缺失或无法唯一匹配时明确失败。成功、失败两支定向测试使用与原始运行相反的回放随机值，并确认随机源调用为零、回放后的实际声望与原结果一致。此最小实现依赖既有结果文本保持可唯一匹配；若文本被改写或重复，回放会失败关闭，未新增 Replay／Snapshot Schema 或文本映射抽象。
- **本次验证（2026-10-11）：**`npm exec -- tsx tests/headless/martialArtsConferenceChallenge.test.ts`、`npm exec -- tsx tests/canonicalFatigueAnxietyStatusMigration.test.ts`、`npm exec -- tsx tests/canonicalMartialChallengeConsumerMigration.test.ts`、`npm run test:headless`、`npm run test:contracts`、`npm run typecheck`、`npm run build` 均通过；定向测试覆盖成功／失败声望、既有场景概率因子、测试模式倍率、单次结算、回放、反馈与普通 Choice。
- **第二个 PD-132 实例：江湖高手比试（Human accepted：2026-10-11；实施起点 `dev` / `237b730e6b3982efb57eb11dce5c9497ef35f680`）：**仅将 `jianghu_challenge / accept_challenge` 接入新建的非致命 `jianghu_open_challenge` 场景；保留事件／选择 ID、年龄、权重、触发条件、原 `jianghu_duel` 与婉拒效果。成功和失败只执行各自合法 `stat_modify` 分支，选择前提示失利名望风险，反馈陈述真实胜败与见证传播，不宣称固定属性 delta。未改其余五项 Random Effect Choice、ChallengeSystem、回放语义、P8 Gate、API、Save 或 Snapshot。
- **第二实例复现与验证（2026-10-11；实施基线 `237b730e6b3982efb57eb11dce5c9497ef35f680`）：**修复前，定向正式 Headless 测试用受控成功随机值执行真实事件，复现名望没有预期的 `+20`；配置后同一断言转绿。成功路径 canonical 名望／功力分别 `+20 / +5`，失败路径名望 `-10` 且功力不变；名望 `4` 的失败只实际减少 `4` 并显示 canonical `-4`；两分支均仅抽签一次、各写一条事件历史。Choice 反馈分别匹配真实 outcome；成功与失败 Replay 都保留原叙事和属性、随机源调用为零；婉拒保留侠义 `+5` 且不抽签。场景参数、功力阈值、全局难度系数、测试模式倍率及既有 `jianghu_duel` 参数均有定向断言。
- **第二实例验证命令：**`npm exec -- tsx tests/headless/jianghuChallenge.test.ts`、`npm run test:headless`、`npm run test:contracts`、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。该具体 Choice 缺口为 `CLOSED_VERIFIED`（仅限本事件；实施基线为 `237b730e6b3982efb57eb11dce5c9497ef35f680`）。**该次验证时其余五项 Random Effect 缺口仍为 OPEN：**`jianghu_grudge / fight_grudge`、`jianghu_demon_sect / lead_expedition`、`jianghu_public_enemy / fight_doubters`、`jianghu_secret_manual / fight_for_manual`、`career_good_evil_war / career_good_evil_war_choice_1`。Slice C2、SL-GAP-10 整体与 P8 Gate 均保持 OPEN；本次未运行或调整 P8 Gate。

- **第三个 PD-132 实例：江湖恩怨（Human accepted：2026-10-11；实施起点 `dev` / `c6ae8c13038cf4958592f2258a052f12b0d34b9d`）：**仅调整 `jianghu_grudge` 的描述、两个 Choice 文案与胜败效果。来人只被表述为声称有旧怨，过往不被系统确认；`fight_grudge` 使用既有 `jianghu_open_challenge`，成功克制取胜后基础侠义声誉 `+10`，失败以空效果保留落败结果；`peace_grudge` 不检定并保留人脉 `+10`，文案呈现主动联络同道、请求协调且不保证接受。Event／Choice ID、年龄、触发条件、权重和其余调度元数据均保留。未修改 Challenge／Choice／Replay 共享实现、其他 Random Effect、P8 Gate 或 Snapshot／API。
- **第三实例复现与结果：**修复前新增的正式 Headless Choice 回归测试用受控成功路径执行原始事件，侠义实际 delta 为 `0`，批准的 `+10` 未发生。修复后同一路径命中稳定成功 outcome 并结算侠义 `+10`（无 Trait 修正）；失败明确命中失败 outcome、落败叙事与空效果，六项核心属性均未变化；两支各只抽一次且各记录一条事件历史，public stat impacts 与 canonical before/after 一致。两支 Replay 保留结果文本及完整 PlayerState，随机调用为 `0`。调停结算人脉 `+10`、挑战随机调用为 `0`，没有伪造已调停成功的 `narrativeResult`。Outcome ID 在正式目录中唯一；可见文案不泄露精确数值或阈值。
- **第三实例验证命令（2026-10-11）：**`npm exec -- tsx tests/headless/jianghuGrudgeChallenge.test.ts`、`npm exec -- tsx tests/headless/jianghuChallenge.test.ts`、`npm exec -- tsx tests/headless/martialArtsConferenceChallenge.test.ts`、`npm run test:headless`、`npm run test:contracts`、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。原 `jianghu_challenge` 与武林大会 Challenge 回归通过。
- **第三实例状态：**`jianghu_grudge / fight_grudge` 单项 `CLOSED_VERIFIED`。**其余四项 Random Effect 缺口继续 OPEN：**`jianghu_demon_sect / lead_expedition`、`jianghu_public_enemy / fight_doubters`、`jianghu_secret_manual / fight_for_manual`、`career_good_evil_war / career_good_evil_war_choice_1`。SL-GAP-10 整体、Slice C2 与 P8 Gate 均保持 OPEN；P8 Gate 未运行。尚未验证真实 Web/API 玩家界面或自然调度命中；Trait 修正下的具体增量也未在本用例重复测试。

- **第四个 PD-132 实例：江湖纷争（Human accepted：2026-10-11；实施起点 `dev` / `cffcc06fffb1d5570a9e6cad4e0177f5a261d2f1`，隔离分支 `codex/pd-135-jianghu-conflict`）：**仅重构 `jianghu_demon_sect` 的玩家选择并增加 `jianghu_faction_skirmish` 场景。保留 Event ID、年龄、权重、名望资格和其他调度元数据；四个新 Choice 分别为 `support_traditional_skirmish`、`support_unconventional_skirmish`、`relieve_conflict_victims`、`stay_out_of_conflict`。两个武力 Choice 复用同一正式 Challenge 场景，成功基础名望 `+15`，失败空效果；援助保留 `comfortable_means` 资格并结算侠义声誉 `+10`；不介入无效果且无惩罚。退役旧 Choice ID 和原 Karma 奖励，不建立兼容别名。未修改共享 Challenge／Choice／Replay／Karma 实现、其他 Random Effect、P8 Gate、API、Save 或 Snapshot。
- **第四实例修复前复现与修复后结果：**正式 Headless 路径中，固定随机值 `0.99` 与 `0` 执行旧 `lead_expedition` 均返回成功并记录一条事件历史，但功力、名望、侠义没有预期结算，旧 `good_karma` 均增加 `20`；证明旧 Random Effect 胜败结构未被正式处理器执行。修复后定向测试验证四项新 Choice 与原调度元数据、局部场景参数；两个武力选择的成功均增加名望 `15`，失败命中各自 Outcome、只抽签一次且完整 `PlayerState` 不变，Karma 不变并只记录一条事件历史。两种挑战分支 Replay 复用原结果与完整人物状态、随机调用为 `0`。满足资格的援助增加侠义 `10`、不改变 Wealth Capacity 且不抽签；资格不足时不修改状态、不写历史、不抽签，其他合法选项仍可执行。不介入不改变核心属性或 Karma；公开反馈与 canonical before/after 一致，普通 Choice 不伪造 `narrativeResult`。
- **第四实例验证命令（2026-10-11）：**`npm exec -- tsx tests/headless/jianghuFactionConflict.test.ts`、`npm run test:headless`、`npm exec -- tsx tests/globalMoneyFinalStrategicProducerMigration.test.ts`、`npm run test:contracts`、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。全量 Headless 覆盖已交付的 `jianghuChallenge`、`jianghuGrudgeChallenge` 与武林大会 Challenge 回归。Choice ID 全仓检索确认源代码及测试中无旧 ID 消费；文档中的旧 ID 仅作为迁移决策和历史记录，不形成兼容路径。
- **第四实例状态与边界：**`jianghu_demon_sect` 本次 Random Effect 缺口为 `CLOSED_VERIFIED`。**剩余三项 Random Effect 缺口继续 OPEN：**`jianghu_public_enemy / fight_doubters`、`jianghu_secret_manual / fight_for_manual`、`career_good_evil_war / career_good_evil_war_choice_1`。SL-GAP-10 整体、Slice C2 与 P8 Gate 均保持 OPEN；未运行 P8 Gate。未验证真实 Web/API 玩家界面或自然调度命中；Trait 修正下的具体增量也未在本用例重复测试。**截至 2026-10-11 的验证记录，本次修改尚未提交或推送。**

- **第五个 PD-132 实例：江湖非议（PD-136，Human accepted：2026-10-12；实施基线 `7606a5ce10273a9659eb3f3f1963719f968a2723`）：**保留 `jianghu_public_enemy` 与全部调度元数据，将未经证实的“被陷害、成为武林公敌”改为“江湖非议”。保留 `investigate_truth` 的查访行动性质，将 `fight_doubters` 改为 `accept_public_challenge`，新增 `ignore_rumors`；不创建别名或 Replay 兼容层。引用审查发现 Event ID 还被事件资源清单引用并予以保留；基线审查未发现两个既有 Choice ID（`investigate_truth`、`fight_doubters`）的运行时代码、测试、脚本或 Replay 消费者；`ignore_rumors` 为新增 ID。`investigate_truth` 无其他有效消费者，`fight_doubters` 在差异台账中已有历史缺口记录。查访只增加人脉 `10`，不增加学识、不进入 Challenge、不声称已查明真相；比试复用 `jianghu_open_challenge`，成功基础名望 `+10`、失败空效果；不回应为空效果。三条路径都不自动改变侠义声誉或 Karma。
- **第五实例修复前复现与根因：**使用正式 Headless `executeChoice` 执行原始 `fight_doubters`，受控随机值 `0.99` 与 `0` 均返回 `success`、没有 `sourceOutcomeId`、名望实际变化均为 `0`，各记录一条事件历史；预期的名望 `+20 / -20` 胜败没有发生。旧配置把 `success` 与 `failure` 放在 `random` 效果同级；正式 `RandomEffectHandler` 只读取嵌套 `effects` 数组，缺少该数组时直接返回原状态，不解释同级胜败字段。修复仅在事件配置中使用已有 `choice.challenge`，未扩展共享 Random Effect 或 Challenge 实现。
- **第五实例修复后结果：**正式 Headless 定向测试确认目录 ID／调度元数据、三种 Choice 与空效果合法性；查访人脉 canonical delta 和反馈均为 `+10`，学识不变且不抽签；比试成功命中唯一稳定的 success Outcome、名望 canonical delta 与反馈均为 `+10`，失败命中独立 failure Outcome 且完整 `PlayerState` 不变。胜败各抽签一次、事件历史各写入一次；两种 Replay 均保留原胜败叙事与完整人物状态，不重新抽签。三条路径 Karma 不变，不回应不改变人物状态；普通 Choice 的 `narrativeResult` 为 `null`。
- **第五实例验证命令（2026-10-12）：**`npm exec -- tsx tests/headless/jianghuPublicOpinionChallenge.test.ts`、`npm exec -- tsx tests/headless/jianghuChallenge.test.ts`、`npm exec -- tsx tests/headless/jianghuGrudgeChallenge.test.ts`、`npm exec -- tsx tests/headless/jianghuFactionConflict.test.ts`、`npm exec -- tsx tests/headless/martialArtsConferenceChallenge.test.ts`、`npm run test:headless`、`npm run test:contracts`、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。新定向测试已注册进 Headless 总入口。
- **第五实例状态与边界：**`jianghu_public_enemy / fight_doubters` 单项缺口为 `CLOSED_VERIFIED`。**另外两项 Random Effect 缺口继续 OPEN：**`jianghu_secret_manual / fight_for_manual`、`career_good_evil_war / career_good_evil_war_choice_1`。SL-GAP-10 整体、Slice C2 与 P8 Gate 均保持 OPEN；本次未运行 P8 Gate。未验证真实 Web/API 玩家界面、自然调度命中或 Trait 修正下的具体增量。本次未修改 ChallengeSystem、ChoiceOutcomeResolver、场景参数、Replay／Karma 共享机制、API、Save、Snapshot 或 Schema。**实现验证阶段记录（提交前）：**当时尚未提交或推送；当前交付状态以 Git 历史和远端 refs 核验结果为准。

### SL-GAP-11 — 跨领域物品与持有基础能力缺口

- **正式产品目标（Human accepted：2026-10-12）：**[PD-137](product-decisions.md) 将跨领域 Item 的具名识别、获得、当前持有、失去、后续条件消费、可靠持久化和真实反馈确认为必备核心。数量及消耗属正式未来扩展范围，**不是**第一阶段必做；普通生活物资的琐碎管理不作为默认目标。本条为独立基础能力缺口，不归入 SL-GAP-10。
- **代码证据（`dev` / `f808b0fb816540da78d16a460653f1a44b9d55f4`；静态核对）：**`src/types/eventTypes.ts` 已有 `InventoryItem`（`id/name/quantity`）、可选 `GameState.inventory`、`PlayerState.items` 及 `ITEM_ADD` / `ITEM_REMOVE` 类型；`src/core/EventExecutor.ts` 默认处理器未注册 Item Add / Remove，故不能仅凭类型宣称正式物品生命周期成立。`src/types/asset.ts` 当前仅注册 `merchant_shop`，`src/core/assetOwnership.ts` 通过 typed Asset API 和 canonical `GameState.facts` 提供二值获得、持有、移除、查询；`asset_owned` / `asset_add` / `asset_remove` 有对应正式处理路径。这是已批准的 Phase 1B 经济 Asset 能力，不是跨领域 Item 完成证据。
- **正式边界：**[Game Product Foundation](../product/game-product-foundation.md) 的唯一 canonical fact、事实与历史分离原则；[Player Model](../product/player-model.md) 对物品与故事事实的区分；[Wealth / Economy Contract](../product/wealth-economy-product-contract-design.md) 与 [Phase 1B Asset 规范](../product/wealth-economy-phase-1b-minimal-asset-semantics-design.md) 的经济资产责任；[Snapshot 3.16.0](../contracts/game-state-snapshot-contract.md) 的严格持久化边界，继续有效。不能由现有类型推定某种新的 Item 存储或持久化方案已被批准。
- **缺口定性和证据限制：**静态代码与 PD-137 的差异足以判定缺少完整的跨领域 Item 正式闭环；本次**没有**在当前 HEAD 实际运行 Item 的获得／失去、保存恢复、API／Web 呈现。数据结构选择、迁移影响、正式消费者分布仍待核对；不据此要求批量迁移旧 Flag 或原有事件。
- **有界下一步：**核查 Inventory、Asset、Facts、Player.items 与历史记录的现有生产者和消费者；界定唯一归属真源及可复用的最小业务操作；核实事件条件／效果、Headless／API、反馈及 Snapshot／Save 中的必要贯通；根据至少两个不同领域的具体用例确定最小实施 Slice。实施之前单独进行产品边界和 Contract／Schema 影响审查；不在差异台账中预定具体存储、兼容层、数量算法或模块设计。
- **未来验收：**正式跨领域取得、持有、失去、后续条件及恢复后状态正确；真实事件历史、canonical 前后变化与玩家反馈一致；已批准的 `merchant_shop` Asset、Wealth Capacity 及 Snapshot 不回归。数量／消耗延期不构成第一阶段失败，不得借前瞻扩展性引入琐碎库存。
- **状态：**`OPEN / CONFIRMED_CODE_GAP`（静态证据，待运行验证及独立实施授权）。PD-137 已获批不等于代码已修复。`jianghu_secret_manual / fight_for_manual` 与 `career_good_evil_war / career_good_evil_war_choice_1` 仍保持 SL-GAP-10 内各自的 OPEN；Slice C2、SL-GAP-10 整体、P8 Gate 及 SL-GAP-01～09 原有状态不变。

## 4. 依赖关系与建议治理节奏

```text
SL-GAP-01 / 04：合法行动与正式时间、调度
SL-GAP-10：独立的负面经历／反馈／Gate 证据（不据 frustration 推断调度违规）
                  ↓
SL-GAP-05 / 06：获得、查询、回顾真实 Milestone
                  ↓
SL-GAP-07 / 08 / 09：人物长期连续性、价值中立终局与自然完整人生
```

此图仅表示**验证上的主要因果依赖**，不是必须线性修复的技术依赖；SL-GAP-08 的明确领域冲突可以独立定界。推荐先最小受控复现上游 01–04，再核实 05–06 的反馈完整性，随后以少量差异化自然人生核对 07–09。高风险不等于已有修复授权。

### 分项推进记录（每次处理一项时填写）

使用本节作为未来每一项的最小闭环；不要把未经验证的结论写成“已解决”。

| 字段 | 要记录的内容 |
| --- | --- |
| Gap ID / 当前状态 | `OPEN` → `VALIDATED` / `NO_DEFECT` / `AUTHORIZED` / `CLOSED_VERIFIED` / `DEFERRED` 等；状态变化需证据 |
| 复查 HEAD 与日期 | 具体 commit SHA；禁止只写“当前 dev” |
| 正式权威 | 精确 PD、Contract、Schema 位置及冲突类型 |
| 事实与复现 | 实际输入、最小步骤、预期/实际表现、对应代码和测试 |
| 根因与范围 | 与相邻系统的因果及已确认的最小治理边界 |
| Human 决定 | 验证结论、授权或延期；不由本台账自动推断 |
| 实施结果 | 如后续另行授权，记录变更 commit、测试/实际运行证据与残余风险 |

## 5. 当前结论与验证边界

**结论：**当前实现具有单角色人生的关键基础机制，但没有足够当前自然运行证据证明完整、连续、可回顾的单角色人生体验已经达标。已经识别的主要风险集中于**合法选择 → 时间节点 → 正式事件/因果 → 存档恢复 → 长期反馈**的边界，而不是需要提前发明新系统。

**首次审查记录：**2026-10-10 对远程 `dev` 的代码、权威规范、事件内容、持久化及测试源码作只读差异审查；当时没有执行自然人生、浏览器/API 联机体验或当前 HEAD 测试。该历史记录不再覆盖上方 PD-130 的新核验结果。

**本次 PD-130 结果：**仅退役浏览器 Local 玩家 Runtime 和无消费者 Local 专属脚手架；保留共享 `GameEngineIntegration`、Headless/API、Snapshot 转换、`SaveManager.ts` 的测试/模拟用途及 `GameProcessSimulator.local_direct`。新档、事件选择、主动行动、保存/恢复有真实 API Web 运行证据；正常终局由 Headless 测试覆盖。工作树基线、测试结果和 Headless gate blocker 见上方实施核验记录。

**仍未建立的证据：**完整自然出生至寿终 Web 人生；Headless gate 的 8 个 persona blockers（独立见 SL-GAP-10，PD-131 仅裁决语义并未修复）；SL-GAP-01、04–10 的各自验证。退役不自动关闭这些事项，也不授权扩展到 gameplay 修复、Schema/Snapshot 变更或其他阶段。

> 本台账的存在只是保证下一轮可以从既有证据继续调查，而不是要求一次性完成全部事项。更新此文档时，优先修改既有条目状态及证据，不无边界增列工程 TODO。
