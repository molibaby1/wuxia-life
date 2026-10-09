# Wuxia-Life 单角色人生全局实现差异台账

> **性质：只读审查的差异登记与后续治理导航，不是新的 Product Decision、Contract、Schema、实施计划或 Codex 授权。**
>
> **首次登记：**2026-10-10  
> **审查基线：**`molibaby1/wuxia-life` / `dev` / `c7ba4f1a3508d80e2568efefdbe76afbf1245683`  
> **审查方式：**直接核对 GitHub `dev` 的正式文档、当前代码、事件定义、Snapshot 定义及测试**源码**；本轮没有执行新一轮完整自然人生模拟、浏览器/API 联机体验或当前 HEAD 测试命令。  
> **登记状态：**初次全局调查完成；后续需由 Human 分项确认验证与治理授权。  
> **更新原则：**未来更新时记录新的核验日期、HEAD、可重现证据、Human 决定和结果，不用新的代码状态自动覆盖已有正式产品语义。

## 1. 权威与使用边界

- **顶层游戏产品：**[`docs/product/game-product-foundation.md`](../product/game-product-foundation.md)；以单角色完整人生及行动—时间—世界—历史—反馈—正常结束因果闭环作为审查主线。
- **人物和长期反馈：**[`docs/product/player-model.md`](../product/player-model.md)，尤其 Life Milestone 的事实派生、ACQUISITION / POSITION / PROSPECT / CONTINUITY。
- **正式裁决：**[`docs/governance/product-decisions.md`](product-decisions.md)，尤其 PD-030、PD-031、PD-033、PD-108、PD-126、PD-127、PD-128、PD-129；具体事项服从仍有效的领域 Product Decision / Contract / Schema。
- **领域 Contract：**[`Character / Relationship`](../product/character-relationship-product-contract-design.md)、[`Parenthood / Family Life`](../product/parenthood-family-life-product-contract-design.md)、[`Content Authoring Workflow`](../product/content-authoring-workflow-contract-design.md)；正式持久化按 [Snapshot Contract](../contracts/game-state-snapshot-contract.md) `3.16.0`。
- **实现证据：**以每次复查时指定的 GitHub `dev` HEAD 为准。本次下方文件位置均以首次基线为依据；未来代码行号可能变化。
- **协作规则：**缺陷先验证和定位根因，再提最小有界治理任务；本台账的排序不表示已经获得实施授权。

**不得据此启动：**通用世界/NPC 模拟、通用 StoryArc 或任务状态机、平行成就/人生评价体系、跨人物档案与奖励、批量事件扩写、整体 Ending 重构或 Auto Evolution 能力扩张。既有 Status Issue #5 继续单独保留，不因这份台账自动升级优先级。

**分项状态含义：**`CONFIRMED_CODE_GAP` = 由当前代码及正式语义直接支持的实现差异（不等于新一轮运行复现已完成）；`CONFIRMED_PATH_DIFFERENCE` = 代码路径差异已明确，但产品影响还需实例；`NEEDS_VALIDATION` = 现有证据不足以定性缺陷；`DEFERRED` = 尚非核心阻碍；`CLOSED_VERIFIED` = 只有取得当前证据后才可使用。所有项初始均为 `OPEN`，禁止写成“已修复”。

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
   Local / Headless / API / Snapshot 应保持正式事实与决策点一致
```

主实现入口：
- Local：[`src/App.vue`](../../src/App.vue) → [`src/composables/useNewGameEngine.ts`](../../src/composables/useNewGameEngine.ts) → [`GameEngineIntegration.ts`](../../src/core/GameEngineIntegration.ts)。
- API：[`useApiGameEngine.ts`](../../src/composables/useApiGameEngine.ts) → [`server/src/services/gameService.ts`](../../server/src/services/gameService.ts) → [`HeadlessEngineSessionImpl.ts`](../../src/headless/session/HeadlessEngineSessionImpl.ts) → 同一核心引擎。
- 内容和因果：[`EventLoader.ts`](../../src/core/EventLoader.ts)、[`ActivePlanningService.ts`](../../src/core/activePlanning/ActivePlanningService.ts)、[`ChoiceOutcomeResolver.ts`](../../src/core/ChoiceOutcomeResolver.ts)。
- 长期反馈：[ `deriveMilestoneProjection.ts` ](../../src/core/deriveMilestoneProjection.ts)、[`deriveLifeMemorySummary.ts`](../../src/core/deriveLifeMemorySummary.ts)、[`GameScreen.vue`](../../src/components/GameScreen.vue)。
- 终局：[`EndingSystem.ts`](../../src/core/EndingSystem.ts)、[`EndingScreen.vue`](../../src/components/EndingScreen.vue)。

**已确认存在的基础能力（仅为代码层面）：**带时间/收益/风险与历史的主动行动；依资格、权重、冷却和历史选择的正式事件；具备实际 delta 的结算；持久 `eventHistory` / `actionHistory`；从正式事实派生而不反向修改状态的 Milestone；Headless 当前正式事件决策点保存；法定终局效果和展示。**不可据此推断完整人生自然运行、跨端行为或玩家体验已经达标。**

## 3. 差异总览与初步处理顺序

下表顺序按对**合法行动、真实时间、长期因果、存档连续性与玩家可感知反馈**的影响排定，不按文件复杂度或修复成本排序。排序为调查建议，可依复现实证调整。

| ID | 待处理问题 | 证据定性 | 初步优先 | 当前状态 | 后续最小决策点 |
| --- | --- | --- | --- | --- | --- |
| SL-GAP-01 | 主动行动的年龄推进可能遗漏正式节点钩子 | CONFIRMED_PATH_DIFFERENCE | P1 | OPEN / 待复现 | 跨生日时节点事实是否缺失、最小受影响路径 |
| SL-GAP-02 | Local 拒绝合法的零效果选择 | CONFIRMED_CODE_GAP | P1 | OPEN / 待复现 | 合法无状态效果的选择应被记录并进入下一阶段 |
| SL-GAP-03 | Local 读档不保留未完成的当前正式事件 | CONFIRMED_PATH_DIFFERENCE | P1 | OPEN / 待复现 | 相同 Snapshot 是否恢复同一决策点 |
| SL-GAP-04 | Local / Headless / API 调度与行动优先级可能不一致 | CONFIRMED_PATH_DIFFERENCE | P1 验证 | OPEN / 待验证影响 | 合法调度边界是否改变玩家行动机会 |
| SL-GAP-05 | Milestone 详细持续查询未进入当前主界面 | CONFIRMED_CODE_GAP | P1 反馈 | OPEN | 四项反馈职责在生产入口的实际可达性 |
| SL-GAP-06 | Milestone 重要经历覆盖可能不足 | NEEDS_VALIDATION | P2 | OPEN | 真实人生中哪些有证据的重要经历未获记录 |
| SL-GAP-07 | 重要人物与关系的可达人生连续性 | NEEDS_VALIDATION | P2 | OPEN | 已批准 Person-first 语义在活跃内容中是否成立 |
| SL-GAP-08 | 无家庭人物可被推为“壮志未酬” | CONFIRMED_CODE_GAP / 领域冲突 | P2 | OPEN | 评价是否具备实际志向未实现的事实依据 |
| SL-GAP-09 | 自然出生至终局 / 早逝 / 存档的端到端证据不足 | NEEDS_VALIDATION | P2 验证 | OPEN | 不注入终局年龄时能否正常结束且状态一致 |

### SL-GAP-01 — 主动行动与日历推进的年龄节点分叉

- **现象/代码证据：**[`GameEngineIntegration.advanceTime()` L1726–1765](../../src/core/GameEngineIntegration.ts) 在年龄变动后执行 `applyYouthTransitionSeeds` 及 `applyP16RareLineCheckpoints`；[`executeActiveActionOnState()` L112–143](../../src/core/activePlanning/ActivePlanningService.ts) 通过同文件 `advanceTimeOnState()`（L264–298）直接修改年龄/日期，不调用上述钩子。
- **涉及正式语义：**Game Product Foundation §3.2；PD-129 的年龄、不可逆经历、真实因果；P16 已有具体节点规则仍须遵守。
- **可能影响（推断）：**通过主动行动跨越 10 / 13 / 15 / 20 岁等节点时，少年阶段衔接或稀有机缘检查可能遗漏；不等于已经证实某局自然游戏漏触发。
- **最小验证：**相同合法 state 与跨生日条件下，分别走正式日历与行动路径；对比年龄、过渡 flags、稀有节点记录与后续事件资格。检查是否存在其他结算路径补偿。
- **验收关注：**同一正式时间变更的生命周期结果不应因操作入口而无依据分叉；不得借机新增通用时间/人生引擎。
- **状态：**OPEN；仅完成只读路径核对。

### SL-GAP-02 — Local 误把合法零效果决定当成无效选择

- **现象/代码证据：**[`useNewGameEngine.handleChoice()` L352–387](../../src/composables/useNewGameEngine.ts) 在 `effectsToExecute.length === 0` 时返回 `false`，不继续结算。活跃目录登记的 [`relationship_life_saving`](../../src/data/lines/relationship.json) 有合法选项 `relationship_life_saving_not_save`，其 `effects: []`；[`src/data/events.json`](../../src/data/events.json) 引用该 line。对照 [Headless 选择执行](../../src/headless/session/HeadlessEngineSessionImpl.ts) L431–445 可执行空 effects。
- **正式语义：**PD-030（合法选择一次完成真实阶段）；玩家有权决定不参与、不承诺。无公开状态 delta 不等于无合法决定。
- **影响：**该事件达到合法触发条件并在 Local 展示时，“继续赶路”会被拒绝，阻断这一决策点。
- **最小验证：**以合法事件/选项直接复现；验证 Local、Headless、API 对“零效果但合法”的执行、历史与推进一致。
- **验收关注：**合法空 effects 仍能完成事件；无新增虚构效果、无重复结算、无额外确认页。
- **状态：**OPEN；代码证据明确，新一轮浏览器复现未做。

### SL-GAP-03 — Local 恢复时重新抽取未完成的事件

- **现象/代码证据：**Local 当前事件处于 `useNewGameEngine.engineState.currentEvent`；[`loadGameFromSave()` L718–745](../../src/composables/useNewGameEngine.ts) 恢复 Snapshot 后清空事件并调用 `getNextEvent()`。[`HeadlessEngineSessionImpl.serialize()` L502–527](../../src/headless/session/HeadlessEngineSessionImpl.ts) 则使用已有 `pendingStoryEventId` 表示可恢复目录事件；hydrate 重新挂载。
- **正式语义：**单角色承诺/机会连续性；PD-126 明确覆盖 Headless、P8、API 的决策点行为（其文字不直接宣称 Local 也在同一实施范围）；Snapshot `3.16.0` 的既有字段边界。
- **影响（推断）：**保存事件 A 后读取，Local 可能重新选择事件 B；至少未可靠保留原决策点。
- **最小验证：**在同一已选未结算事件处保存、恢复，并比较事件 ID、选项、随机次数、历史与可用行动。额外验证已执行事件、未确认结果、终局的边界。
- **验收关注：**不静默替换已经进入的决策点；不擅自新增 Snapshot 字段或通用调度状态。
- **状态：**OPEN；路径不对称已确认，具体玩家表现待复现。

### SL-GAP-04 — Local / Headless / API 正式事件调度边界

- **现象/代码证据：**Local [`getNextEvent()` L125–244](../../src/composables/useNewGameEngine.ts) 在可用主动行动判断前尝试 `gameEngine.selectEvent(age)`；Headless [`getSessionPhase()` L687–715](../../src/headless/session/HeadlessEngineSessionImpl.ts) 及 [`getNextEvent()` L255–301](../../src/headless/session/HeadlessEngineSessionImpl.ts) 对已有行动、强制事件、行动确认/时间推进调度边界作不同处理。
- **正式语义：**PD-126 对 Headless、P8、API 的优先级具有具体约束；PD-030 / PD-033 约束操作与正式结算。不可把 PD-126 未写明的 Local 范围自动扩张为已经裁决的实现细节。
- **可能影响（推断）：**Local 与 API 的普通事件密度、主动规划可见性和生命周期体验不同；随机选择天然允许不同，不要求相同 seed 的每个事件绝对一致。
- **最小验证：**合法相同决策点、受控调度机会及真实操作次数对照；确认何时允许 Scheduler 抽取、是否抢占有效主动规划、结果是否重复确认。
- **状态：**OPEN / NEEDS_VALIDATION；不得仅凭分支顺序直接宣布完整产品缺陷。

### SL-GAP-05 — Milestone 详细查询入口缺口

- **现象/代码证据：**[`deriveMilestoneProjection.ts`](../../src/core/deriveMilestoneProjection.ts) 从当前事实与历史派生已获得/Prospect；[`lifeMemoryFeedback.ts`](../../src/components/lifeMemoryFeedback.ts) 与 [`GameScreen.vue` L306–365](../../src/components/GameScreen.vue) 已有获得卡。[`LifeMemoryPanel.vue`](../../src/components/LifeMemoryPanel.vue) 能展示描述、取得年龄与依据，但当前生产 [`GameScreen.vue` L125–155](../../src/components/GameScreen.vue) 未挂载；主界面仅挂载摘要及属性面板，印记和 Prospect 只显示紧凑内容。
- **正式语义：**PD-128；Player Model 的 ACQUISITION / POSITION / PROSPECT / CONTINUITY 以及取得依据的只读解释边界。
- **影响：**长期印记数据存在，但玩家缺少当前主流程内可持续打开的详细历史查询入口。不能误判为“Milestone 完全未实现”。
- **最小验证：**在生产 Local/API 路径取得里程碑后验证入口、详细内容、已获得依据、Prospect、读档重看及无额外写入。
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

## 4. 依赖关系与建议治理节奏

```text
SL-GAP-01 / 02 / 04：合法行动与正式时间、调度
                  ↓
SL-GAP-03：事件/选择与已形成事实的可靠恢复
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

## 5. 本轮结论与明确未做

**结论：**当前实现具有单角色人生的关键基础机制，但没有足够当前自然运行证据证明完整、连续、可回顾的单角色人生体验已经达标。已经识别的主要风险集中于**合法选择 → 时间节点 → 正式事件/因果 → 存档恢复 → 长期反馈**的边界，而不是需要提前发明新系统。

**本轮已做：**对远程 `dev` 的代码、权威规范、事件内容、持久化及测试源码作只读差异审查，并将问题以证据等级和独立 ID 登记。

**本轮未做：**不将任何问题标记“已复现/已修复/测试通过”；不实施代码、事件、Schema、Snapshot、UI 或 API 迁移；不新增 Product Decision、Contract 或自动化治理项；不启动 Codex 和 AE。

> 本台账的存在只是保证下一轮可以从既有证据继续调查，而不是要求一次性完成全部事项。更新此文档时，优先修改既有条目状态及证据，不无边界增列工程 TODO。
