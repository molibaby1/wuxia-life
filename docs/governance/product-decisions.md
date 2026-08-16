# Wuxia-Life 产品决策账本

> 用途：记录已经完成裁决、后续默认不再重新讨论的产品与工程语义。
> 适用对象：ChatGPT、Codex、人工维护者。
> 最后更新：2026-08-14
> 状态口径：仅记录当前会话中已经确认的事实；未完成事项不写成既定决策。

---

## 1. 使用规则

1. 本文只记录已经完成裁决的事实，不记录临时想法、候选方案和待办事项。
2. 当前任务、风险和下一步放在 `current-product-stage.md`，不得混入本文。
3. 历史代码、历史测试和历史文档只能说明过去状态，不能自动覆盖本文和更高层权威文档。
4. 新决策只有在产品语义被明确裁决后才写入。
5. 每条决策应尽量回答：正式语义是什么、哪些旧语义退出、明确不做什么、什么条件下允许重新讨论。

---

## 2. 权威层级

从高到低：

1. 第一层产品规范：
   - `docs/product/player-model.md`（人物模型）
   - `docs/product/auto-evolution-model.md`（Auto Evolution 产品模型）
2. `docs/governance/project-convergence.md`
3. `docs/governance/product-decisions.md`
4. `AGENTS.md`
5. `docs/README.md`
6. 当前有效 Contract / Schema
7. 当前代码与测试

历史 PRD、Phase、Pxx、report、proof、closure、实施计划和旧交接总结默认不具有当前产品规范效力。Auto Evolution 旧方案与 Reviewer Calibration 历史文档不得覆盖 `docs/product/auto-evolution-model.md`。

---

## 3. 项目阶段原则

### PD-001：治理不能替代产品开发

Canonical Player Model 的主要治理阶段已经完成。项目当前应从玩家真实体验和产品价值出发，不再因为发现旧字段、历史报告、未接线内容或死配置而自动开启新治理阶段。

重新进入模型治理只允许发生在以下情况：

- 当前玩家体验被正式状态冲突直接破坏；
- 新功能无法在现有语义下正确实现；
- 正式 Contract、Schema 或持久化边界发生实际冲突；
- 存在两个同时生效的 canonical source。

### PD-002：采用最小正确 Slice

每次只实施一个有真实证据、边界明确、能够独立验收的产品 Slice。

不得为了未来可能需要而提前增加抽象层、通用框架、配置系统、扩展点、第二状态来源或未被当前需求要求的模型。

---

## 4. Canonical Player Model 已完成裁决

### PD-010：武学成长只保留 `martialPower`

以下旧武学字段已经退出正式模型与生产边界：

```text
externalSkill
internalSkill
qinggong
```

不得重新加入 PlayerState、Snapshot、Condition、Effect、UI、Headless 或 Challenge。普通叙事中的“内功”“外功”“轻功”等词语不属于旧字段残留。

### PD-011：numeric health 与 energy 已删除

正式健康语义为：

```text
healthStatus
statuses
```

不得重新引入 numeric `health` 或 numeric `energy`。

### PD-012：Habit 当前只保留三项

```ts
lifeStates: {
  trainingHabit: number;
  studyHabit: number;
  businessHabit: number;
}
```

`familyBond` 和 `socialMomentum` 已退出正式模型，不建设替代通用数值轴。

### PD-013：Route Lifecycle 与 `lifePath.focus` 已删除

以下运行态模型已经退出：

```text
routeStates
routeHistory
roadCommitments
RouteManager
route completion / failure / conflict
lifePath.focus
FocusType
```

测试报告、叙事标签和分析分类中出现 `route`，不代表允许重新建立 runtime Route State。

### PD-014：其他旧平行属性只登记，不自动治理

例如：

```text
charisma
businessAcumen
influence
martialHeritage
scholarlyHeritage
merchantNetwork
wealth
affinity
Karma
```

只有直接阻塞当前最高优先级产品问题时，才允许进入限定分析。

---

## 5. Persistence 与终局

### PD-020：Snapshot 当前正式版本为 `3.14.0`

正式规则：

- 只接受 `3.14.0`；
- 更早版本整体拒绝；
- 未知未来版本拒绝；
- 不提供 migration、fallback、compatibility layer 或 silent cleanup；
- Browser 与 Headless 共用统一 canonical contract。

### PD-021：正常寿终使用现有 canonical 终局链

正式链路：

```text
ordinary_life
→ special/end_game
→ EndingSystem.determineEnding()
→ state.ending
→ player.alive = false
→ flags.gameEnded / ending_triggered
→ Headless terminal
→ Browser EndingScreen
```

不得在 Headless、Trace、Browser 或 App 中根据 `ordinary_life` event ID 特判终局。

### PD-022：正常寿终不改变 EndingSystem 的分类规则

当前正常寿终只是接入已有 ending 判定，不等于所有 ending 的解释力已经充分。

结局判定与结局解释应分开：

```text
EndingSystem：决定 ending 类型
Ending presentation：解释为什么得到该结局
```

---

### PD-023：同一 ending 类型可以具有基于正式最终状态的动态解释

`EndingSystem` 继续负责 ending 分类；玩家可见解释可以在终局产生时，根据正式结构化最终状态生成，并写入现有 `state.ending.description`。

当前 `quiet_family_life` 的正式规则：

- ending ID、title、判定顺序和阈值保持不变；
- wealth 与 balanced 可以共享 `quiet_family_life`；
- 最终 description 可以根据 canonical `lifeStates`、玩家属性和家庭状态产生不同解释；
- Local、Headless、API 和 Snapshot 消费同一份已经持久化的 description；
- 其他 ending 默认继续使用既有静态 description。

明确禁止：

- 从事件正文、event ID、Trace、persona、seed 或测试标签生成结局解释；
- 根据解释结果反向改变 ending ID；
- 借结局解释新增 identity、sect、title 或第二状态来源；
- 显示内部阈值、评分或调试信息。

重新讨论条件：

- 现有 ending Contract 无法承载正式终局展示；
- 多个 ending 都出现系统性的解释缺失；
- Browser 与 Local/API/Headless 无法继续共享同一正式 description。

---

## 6. 玩家可见反馈

### PD-030：主循环每个真实阶段只需一次操作

已经完成并应持续保持：

- 长事件正文可完整阅读；
- 每个真实剧情阶段都停留等待玩家操作，不自动跳过；
- 决策阶段选择一次即完成结算并进入下一真实阶段；
- 单路径阶段点击一次“继续”即完成结算并进入下一真实阶段；
- `action_summary`、`period_summary` 等内部结算状态不得成为第二个玩家操作页；
- 上一阶段结果与下一阶段并列显示，只保留阶段名、所选行动和实际变化，不重复刚读过的正文或选项说明；
- 不使用定时器自动越过真实剧情阶段；
- Local/API 不得要求重复 acknowledgment 或重复结算。

### PD-031：结果卡以 canonical before/after 状态为准

结果卡必须展示公开玩家状态的真实 delta。

不得：

- 根据事件当前固定数值写死测试；
- 在公开状态已变化时显示“未见明显数值变化”；
- 重新执行 effect 以计算展示；
- 使用隐藏 outcome 代替正式执行结果。

### PD-032：选择前信息不泄露精确隐藏 effects

出身、行动和事件选项可以提供方向、收益类型、投入和风险说明，但不直接暴露后台精确 effects 或内部判定阈值。


### PD-033：主动行动结果以实际结算事实为唯一来源

主动行动的玩家可见结果必须根据正式执行后的 before/after state 和 actual public delta 确定性生成。

正式规则：

- actual delta 是结果事实来源；
- 不重新执行 effects；
- 不用配置中的理论收益覆盖实际结算；
- 正、负、零和混合 delta 必须被准确表达；
- 正式收益递减必须玩家可见，但不得泄露内部阈值和公式；
- 相同正式输入必须生成相同结果；
- Local、API、Headless 和 Browser 使用同一结果语义；
- 结果说明可以解释当前成本、收益和递减；
- 结果说明不得宣称尚未发生的事件、阶段回响或结局。

明确禁止：

- 使用随机同义句降低重复率；
- 根据 seed 或当前时间轮换文案；
- 调用 LLM 动态生成正式结算说明；
- 从 hidden outcome 或未来 Trace 生成玩家反馈；
- 把即时结果包装成长期人生意义；
- 为展示结果新增持久化 action history。

重新讨论条件：

- 正式主动行动结算不再能提供 before/after state；
- Local/API/Headless 采用不同结算协议；
- 产品明确新增需要持久化的主动行动生命周期。

---

## 7. 身份与归属

### PD-040：身份与归属 inventory 已完成

只读核对确认：

- `state.identity`、`lifePath.primaryIdentity`、`player.sect`、`player.title` 与 `flags.current_sect` 同时存在；
- 它们分别表达通用身份、人生轨迹、门派字段、称号和事件机械信号；
- 人生摘要长期显示 `none`，是因为 consumer 只读取 `state.identity`；
- 当前不存在一个可以直接修 UI 的统一 canonical identity source。

本条是事实核对结论。后续正式产品语义由 PD-041 裁决。

### PD-041：取消通用 Life Identity，建立单一 Canonical Affiliation（已实施）

**正式语义**

不得使用一个通用 identity 容器概括门派、职业、称号、人生方向和结局。

正式分层：

```text
Affiliation       当前客观组织归属，单一 canonical state
Title             明确事件授予的社会称号
Occupation        当前不建立通用状态
Reputation        属性、经历和叙事评价，不建立通用身份状态
Narrative route   确定性派生，不持久化为 identity
Ending            独立终局分类
```

Canonical Affiliation：

```ts
player.affiliation: AffiliationId | null
```

当前稳定 ID：

```text
shaolin
wudang
beggars
border
shadow_sect
```

`player.sect` 与 `flags.current_sect` 必须迁移后删除，不允许双写、fallback 或 compatibility projection。

以下通用身份结构退出正式模型：

```text
state.identity
IdentityInfo
PlayerIdentity
IdentitySystem
lifePath.primaryIdentity
```

事件的 identity 门槛必须迁移为其真实属性、flags、经历、成就或 Affiliation 条件。不得新建另一套通用身份分类器。

`player.title` 保留，但只能由明确事件正式授予。Ending name、route label 和 UI heuristic 不得写入或冒充 Title。

**实施状态**

- `state.identity`、`IdentitySystem`、`lifePath.primaryIdentity` 已从正式 runtime 删除；
- `player.sect` 与 `flags.current_sect` 已删除，当前组织归属唯一由 `player.affiliation` 持有；
- 正式事件已使用 `affiliation_set` / `affiliation_clear`，身份门槛已迁移为显式事实条件；
- Snapshot 当前为 `3.14.0`，Life Memory 为 `3.0.0`，旧版本和旧字段拒绝；
- Local、API、Headless、Browser 的玩家展示已分别呈现所属、称号、经历、方向和结局。

**持久化边界**

该裁决属于破坏性 canonical migration：

- 完成实施时 Snapshot 版本从 `3.12.0` 升至 `3.13.0`；
- `3.12.x` 及更早版本整体拒绝；
- 不提供 migration、fallback、双写或 silent cleanup；
- Life Memory 删除通用 identity projection，schema 从 `2.0.0` 升至 `3.0.0`；
- Local、API、Headless 与 Browser 使用同一 Affiliation 与 Title 来源。

**明确不做**

- 不建立 occupations 数组或 primary occupation；
- 不建立 affiliation history；
- 不支持多个当前组织；
- 不从 event ID、结果文本、Trace、persona 或 route flag 猜测 Affiliation；
- 不把 `sect_faction` 或 `lifePath.faction` 自动同步为 Affiliation；
- 不激活 deferred identity event files；
- 不重建 Route Lifecycle；
- 不因删除 identity 自动重写 EndingSystem。

**重新讨论条件**

- 产品明确需要同时加入多个组织；
- 玩法需要追踪加入、离开和转换的完整历史；
- 某个职业玩法必须回答玩家当前是否正式任职；
- Title 获得与失去形成独立产品机制；
- 现有单一 Affiliation 无法表达正式组织归属。
---

## 8. 模拟与体验证据

### PD-050：`oracle_effect_score_v1` 不是现实玩家模型

该策略读取隐藏 effects、不统一属性量纲、确定性选最高分、同分时选择候选顺序第一项，并对多 outcome 存在合并偏差。

它适合：流程可达性、状态执行、阶段覆盖、回归保护和批量发现目标路径。

它不适合直接证明：真实玩家会如何选择、persona 真实分化、玩家是否理解选项或游戏是否好玩。

### PD-051：自动 Trace 与浏览器证据分工

```text
Headless Trace：
批量运行、状态变化、路径比较、阶段 payload、目标路径定位

Browser：
DOM、布局、按钮、自动推进、Console、Local storage、刷新读档、玩家可见解释
```

绿色自动化测试不能替代完整玩家体验证据。

### PD-052：Causality 与 Replayability 目标保留，当前自动 metric 退出正式验收

**正式语义**

- 因果连续性仍是有效产品目标。
- 人生可区分性仍是有效产品目标。
- 自动 simulation 可用于发现路径、状态和内容候选问题。
- 当前 causality/replayability payload 只属于 legacy diagnostic。
- 当前自动数据不能直接证明真人玩家的因果感受或重玩体验。

**退出正式验收的规则**

以下规则不再具有正式产品验收效力，也不得作为默认测试失败依据：

- `directEchoCount >= 3`；
- `tooFewEchoes` 的产品验收含义；
- replay cosine `>= 0.82`；
- near-duplicate pair `<= 3`；
- causality/replayability gate warning；
- 依赖这些数字的默认测试失败。

**明确不做**

- 不删除因果连续性或人生可区分性产品目标；
- 不删除 diagnostic payload；
- 不修改事件；
- 不调整现有 threshold 数值；
- 不重建 metric；
- 不新增 persona、seed 或运行次数；
- 不把自动 persona 当成真实玩家模型。

**重新讨论条件**

只有产品明确批准新的测量对象、证据来源和验收标准后，才允许重新建立 causality/replayability 正式 gate。


### PD-053：人生里程碑是派生反馈，不是新的状态真相

**背景**

实际游玩显示，玩家能够看到学识、功力、金钱和 Habit 等数值变化，但难以判断：

- 数值处于什么水平；
- 重复实践产生了什么阶段成果；
- 自己正在成为什么样的人；
- 当前有哪些可以接近的发展方向。

长期目标距离较远时，单纯数值反馈不足以支撑持续决策。

**正式语义**

引入 Life Milestone 作为独立的只读派生反馈层。

正式数据流为：

```text
Existing Formal Facts
→ Milestone Evaluation
→ Achieved Milestones
+ Milestone Prospects
→ Player-visible Feedback
```

Milestone 的职责是解释已有事实，而不是生产新的游戏事实。

Milestone 应帮助玩家回答：

1. 我已经形成了什么阶段成果；
2. 我现在正在接近什么；
3. 之前的选择、实践和经历对当前人生意味着什么。

**与其他概念的边界**

Milestone 不等于：

- Achievement；
- Identity；
- Affiliation；
- Title；
- Occupation；
- Route；
- Ending；
- Task。

Milestone 不得写入现有 Achievement 字段，也不得被事件或路线作为条件消费。

**第一阶段证据来源**

第一阶段仅允许消费：

- monotonic Habit；
- active-action history；
- event history；
- 经审核的 durable facts；
- canonical current facts。

第一阶段不得依赖不完整的普通 choice 历史，也不得使用无法恢复历史状态的任意数值组合来证明永久成果。

**透明性**

第一阶段只提供透明 Milestone：

- 玩家可以理解达成条件；
- 玩家可以看到当前进度；
- 玩家可以看到获得原因。

不建设隐藏成就、谜题式条件或完整任务清单。

**奖励与反向影响**

第一阶段不提供：

- 属性奖励；
- 金钱奖励；
- 成就点；
- 事件权重；
- 路线资格；
- 称号装备；
- 调度影响。

Milestone 不得反向修改游戏状态。

**持久化边界**

第一阶段不新增：

- PlayerState 字段；
- GameState 字段；
- Snapshot state 字段；
- save migration；
- milestone unlock ledger。

只有未来产品明确要求可靠记录任意复合条件的首次达成年龄或永久解锁事实时，才能重新裁决是否建立 ledger。

**验收边界**

自动测试只能证明：

- 条件求值正确；
- 数据链正确；
- Local/API 一致；
- 没有污染正式状态。

是否改善方向感、阶段满足感和重复行动体验，必须通过实际游玩验证。

**明确不做**

Life Milestone Minimal Vertical Slice 完成后，不自动授权：

- 大规模扩充 Milestone；
- 奖励系统；
- 隐藏成就；
- 任务系统；
- 结果页交互修改；
- 读书、练功事件扩充；
- Milestone 持久化；
- metric 或玩家模型扩展。

**重新讨论条件**

出现以下任一需求时，必须重新进行产品裁决：

- 需要可靠记录任意复合条件的首次达成年龄；
- 需要数值下降后仍永久保留 Milestone；
- 需要 Milestone 反向影响事件、路线、属性或结局；
- 需要将非 canonical 属性提升为正式条件来源；
- 需要建设隐藏条件、奖励或任务链。

### PD-054：独立悟性属性退出，学习理解统一归入学识

**正式语义**

- 人物只同等展示功力、体魄、学识、人脉、名望、侠义声誉六项核心属性；
- `knowledge` 同时承载知识、理解、文化与学习能力；
- 天生的学习禀赋由 Trait 表达，不再初始化一项独立数值；
- 原有悟性条件或唯一成长来源迁移到学识；同一配置已有学识项时删除悟性项，不相加、不重复计数；
- 金钱只作为资源展示，不进入核心属性；
- Snapshot `3.14.0` 拒绝旧字段，不提供迁移、兼容、回退读取或静默清理。

**明确不做**

- 不在本裁决中删除魅力、经营、影响力等其他既有非核心字段；
- 不新增潜力值、天赋数值投影或第二套学习属性；
- 不迁移旧存档。

### PD-055：外部参与者的主观判断不是金标准考题

**正式语义**

Wuxia-Life 要改进的是游戏。若大模型、真人或其它外部系统被用来观察游戏体验，他们是外部参与者，不是本产品要优化的对象。

- 外部参与者的主观体验或判断，不存在由 Wuxia-Life 提供的标准正确答案。
- 系统可以验证协议、结构、来源和可观察事实。例如：回复是否符合约定字段、材料是否只含玩家可见信息、这次问了谁、给了什么、收回什么是否可追溯。
- 系统不得把“与 gold answer 一致”定义为外部参与者主观判断的正确性。
- 不得用查准/查全、资格考试或 Freeze Checkpoint 证明某个观察者“应该怎样感觉才算正确”。

完整 Auto Evolution 产品模型见 `docs/product/auto-evolution-model.md`。本条不另建第二套规则。

**与 PD-050 / PD-051 / PD-052 的关系**

这三条是警告性原则：自动模拟策略不是真人玩家，自动 Trace 不能替代玩家体验证据，当前因果/重玩自动分数不能证明真人感受。它们针对程序分数和自动日志，**没有明确禁止 Reviewer Calibration**。本条才把“外部参与者主观判断不得用金标准定义正确性”写成产品规则。

**对已有 Auto Evolution 工作的含义**

- Phase 0 的 player-observable information boundary 仍然有效。
- Phase 1 Reviewer Calibration harness 曾经实现，这一历史事实可以保留；实现已于 2026-08-14 独立授权清理后从仓库移除，不表示必须进入未来产品架构。
- 未来仍可能需要某种调用记录、结构化意见或原文保存能力。那不等于保留或重建现有 Phase 1 calibration / qualification / gold-answer 实现。
- gold labels、qualification、precision/recall、sealed-qualification 和 Freeze Checkpoint 退出产品主线。本条裁决当时将其标为待清理且不执行删除；清理已另获独立授权并完成。
- 2026-08-14 起，Auto Evolution 产品方向以 `docs/product/auto-evolution-model.md` 为准；本条继续约束“不得金标准考试主观判断”。

**明确不做**

- 不在本裁决中设计或授权 participant framework、真人接口、新的 Agent 框架、Planner 或 Phase 2；
- 不把本条解释为禁止向外部参与者收集意见；
- 不把“未来仍可能需要某种协议能力”写成“必须保留或重建 Phase 1 文件”；
- 不把产品模型文档的存在解释为新的 implementation authorization。

**重新讨论条件**

- 产品明确要把某个外部任务定义成有客观对错的协议检查，且该任务不是主观体验判断；
- 产品明确批准新的体验意见来源和用法，且不把 gold-answer 一致性当作主观正确性。

---

## 9. AI 协作与授权

### PD-060：采用异构模型分工

```text
ChatGPT / 深推理模型：
产品分析、语义裁决、范围控制、阶段目标、结果复核

Codex / 执行模型：
真实仓库核对、实现、测试、浏览器验证、结构化汇报
```

该分工同时服务于降低连续语义漂移风险、利用聊天与 Codex 的独立 token 额度、把高成本推理集中在高杠杆决策，以及把机械工程执行交给成本更低的模型。

### PD-061：采用阶段目标驱动，而非无限自主开发

Codex 可以在当前阶段目标和边界内自主闭环普通工程问题。

只有出现结构性 blocker 时才停止，例如：

- 必须修改 PlayerState、Snapshot、Schema 或正式 Contract；
- 必须新增正式状态来源；
- 存在两个冲突的 canonical source；
- 必须改变明确禁止修改的产品规则；
- 真实代码证明阶段前提错误；
- 根因属于另一个独立产品系统；
- 当前边界内无法满足验收标准。

Codex 达成当前阶段目标后必须停止，不得顺带进入相邻系统。

---

## 10. 更新模板

```markdown
### PD-XXX：决策标题

**正式语义**

...

**明确不做**

...

**重新讨论条件**

...
```
