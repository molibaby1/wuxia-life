# P3 Midlife Experience and Trust Hardening Session Prompts

本文件提供 P3 可复制的新会话提示词。每次只复制一个 story 的提示词，不要合并多个 story 执行。所有会话必须先读取并遵守 `AGENTS.md`，然后读取 PRD、PRD JSON、本执行计划和分发表。

## Controller Prompt

```text
你正在接手 wuxia-life 的 P3 Midlife Experience and Trust Hardening 执行分发控制。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/p3-midlife-experience-and-trust-hardening.md
2. docs/PRD/p3-midlife-experience-and-trust-hardening.prd.json
3. agent_docs/p3-midlife-experience-and-trust-hardening-application-execution-plan.md
4. agent_docs/p3-midlife-experience-and-trust-hardening-story-dispatch-matrix.md

当前目标不是改代码，而是确认 P3 的执行顺序、依赖、可并行边界和当前工作区状态。

请输出：
- P3 总目标
- 当前各 story 的依赖关系
- 最适合启动的下一个 story
- 启动前需要确认的风险

不要修改代码。不要扩展 PRD 范围。不要把多个 story 合并成一个大改动。
```

## US-001 Prompt: Rebaseline P3 Warning Sources

```text
你正在接手 P3 的 US-001：Rebaseline P3 Warning Sources。

本会话只处理 US-001。目标是重新跑当前 P3 baseline，记录 warning 来源，并产出 baseline 报告。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、P3 application execution plan、P3 story dispatch matrix。

Scope:
- 运行 `npm run gate:golden-line` 并记录 warning。
- 运行 `npm run gate:experience` 并记录 warning failure。
- 将 warning 分类为 death risk、romance/family、payoff、route contradiction 或 other。
- 产出 P3 baseline report。

Non-goals:
- 不修改业务代码。
- 不调 gate 阈值。
- 不修 warning。

Validation:
- `npm run gate:golden-line`
- `npm run gate:experience`
- `npm run typecheck`

Done:
- baseline report 汇总命令输出和 warning 分类。
```

## US-002 Prompt: Define P3 Trust Targets

```text
你正在接手 P3 的 US-002：Define P3 Trust Targets。

本会话只处理 US-002。目标是把 P3 的玩家信任指标冻结为后续 gate 和实现可引用的规则。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-001 baseline、P3 application execution plan、P3 story dispatch matrix。

Scope:
- 定义 death rate、romance/family achievement、simulated payoff rate、route contradiction 的目标阈值。
- 定义哪些 warning 在 P3 必须成为 blocker。
- 定义哪些 warning 可以保持 non-blocking 以及原因。
- 文档化 0-50 deterministic scenarios 的目标状态。

Non-goals:
- 不修改业务代码。
- 不直接修 warning。
- 不新增 story 范围外指标。

Validation:
- `npm run typecheck`

Done:
- trust target 文档可被后续 death、romance、payoff、route 和 final gate stories 引用。
```

## US-003 Prompt: Audit Death Sources

```text
你正在接手 P3 的 US-003：Audit Death Sources。

本会话只处理 US-003。目标是查明所有 active 和 candidate 的死亡或强生存惩罚来源。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-001 baseline、P3 execution plan、P3 dispatch matrix。

Scope:
- 盘点 active 和 candidate events 中会直接杀死玩家或大幅降低生存的来源。
- 标注是否有 player-visible warning、avoidable choice 或 mitigation path。
- 标注是否发生在 age 50 前。
- 产出按 route 和 age range 分组的 death-source report。

Non-goals:
- 不修改业务代码。
- 不调死亡概率或事件效果。
- 不写兼容兜底。

Validation:
- `npm run typecheck`

Done:
- death-source report 能支持 US-004、US-005、US-006 继续执行。
```

## US-004 Prompt: Define Death Risk Design Rules

```text
你正在接手 P3 的 US-004：Define Death Risk Design Rules。

本会话只处理 US-004。目标是定义死亡风险在早期、中年、后期如何变得可读、可避、可解释。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-003 death-source report、US-002 trust targets、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义 early、midlife、late-life death-risk rules。
- 定义 high-risk choices 前必须出现的 warning signal。
- 定义 health、allies、reputation、route state、prior choices 等 mitigation 方法。
- 定义 unavoidable death 允许条件。
- 定义 0-50 deterministic scenarios 的 death-rate target。

Non-goals:
- 不修改业务代码。
- 不直接调事件。

Validation:
- `npm run typecheck`

Done:
- death risk rules 可直接指导 US-005 telemetry 和 US-006 tuning。
```

## US-005 Prompt: Implement Death Risk Telemetry

```text
你正在接手 P3 的 US-005：Implement Death Risk Telemetry。

本会话只处理 US-005。目标是让 simulation/report 能解释死亡原因。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-003 report、US-004 rules、P3 execution plan、P3 dispatch matrix。

Scope:
- simulation output 在死亡时记录 death event id。
- 记录 age、route state、recent key choices。
- 记录是否有 visible warning 或 mitigation path。
- reports 汇总 top death causes。

Non-goals:
- 不调死亡设计。
- 不修具体死亡分支。
- 不改变非死亡 simulation 行为。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- death-rate warning 可以快速追踪到事件原因和上下文。
```

## US-006 Prompt: Tune Early and Midlife Death Risk

```text
你正在接手 P3 的 US-006：Tune Early and Midlife Death Risk。

本会话只处理 US-006。目标是让 0-50 early/midlife death 变得有预警、可规避，并满足 P3 death target。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-004 rules、US-005 telemetry output、P3 execution plan、P3 dispatch matrix。

Scope:
- 确保 0-50 deterministic scenarios 不会无预警死亡。
- high-risk choices 添加玩家可见 warning text 或 risk feedback。
- 每条 priority route 的 high-risk branch 至少有一个 mitigation route。
- 让 `npm run gate:experience` 不再失败 death-rate warning target。

Non-goals:
- 不移除所有死亡。
- 不扩写无关事件。
- 不绕过 gate。

Validation:
- `npm run gate:experience`
- `npm run typecheck`
- 相关 tests。

Done:
- death risk 在 0-50 deterministic samples 中可读且可避免。
```

## US-007 Prompt: Audit Romance and Family Availability

```text
你正在接手 P3 的 US-007：Audit Romance and Family Availability。

本会话只处理 US-007。目标是查明 romance/family achievement 当前为什么不可达或不稳定。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-001 baseline、P3 execution plan、P3 dispatch matrix。

Scope:
- 盘点 runtime 加载的 romance/family events。
- 标注 route、age、flag、relationship、choice requirements。
- 找出 deterministic scenarios 中第一个 missing 或 unlikely trigger。
- 产出 romance/family availability report。

Non-goals:
- 不修改业务代码。
- 不新增恋爱或家庭剧情。

Validation:
- `npm run typecheck`

Done:
- report 指出真实链路断点，供 US-008 和 US-009 使用。
```

## US-008 Prompt: Define Romance and Family Sample Arc

```text
你正在接手 P3 的 US-008：Define Romance and Family Sample Arc。

本会话只处理 US-008。目标是定义一个 31-50 前后可达的 romance/family 样例弧线。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-007 report、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义一个 sample romance/family arc。
- 包含 meeting、trust growth、conflict、commitment or separation、midlife consequence。
- 能与 orthodox/sect、wandering hero、demonic path 共存并有路线差异。
- 至少 3 个 player choices 和至少 2 个 later payoffs。

Non-goals:
- 不实现事件。
- 不让 romance/family 成为必选路线。

Validation:
- `npm run typecheck`

Done:
- arc spec 可直接交给 US-009 实现。
```

## US-009 Prompt: Implement Reachable Romance Family Path

```text
你正在接手 P3 的 US-009：Implement Reachable Romance Family Path。

本会话只处理 US-009。目标是让至少一条 romance/family path 通过正常 deterministic 0-50 play 可达。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-007 report、US-008 arc spec、P3 execution plan、P3 dispatch matrix。

Scope:
- 实现或调整一条 deterministic 0-50 scenario 可达的 romance/family path。
- 使用现有 relationship 和 choice feedback systems。
- 移除 hidden impossible flags 或不可达触发条件。
- 让 `romance_family_achievement_rate` 达到配置下限。

Non-goals:
- 不实现多条 romance/family 主线。
- 不重做关系系统。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- romance/family progression 通过正常 play 可达。
```

## US-010 Prompt: Add Romance Family Simulation Sample

```text
你正在接手 P3 的 US-010：Add Romance Family Simulation Sample。

本会话只处理 US-010。目标是新增或定义一个面向 romance/family arc 的 deterministic regression sample。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-009 implementation handoff、P3 execution plan、P3 dispatch matrix。

Scope:
- 添加或定义 deterministic sample，目标是 romance/family arc。
- sample output 包含 relationship state、key choices、final relationship/family outcome。
- gate 或 report 能标识 completed、separated 或 failed。

Non-goals:
- 不新增无关剧情。
- 不改变其他 deterministic strategy。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- romance/family regression 能被 gate 或 report 看见。
```

## US-011 Prompt: Audit Simulated Key-Choice Payoff Gaps

```text
你正在接手 P3 的 US-011：Audit Simulated Key-Choice Payoff Gaps。

本会话只处理 US-011。目标是找出 static payoff map 通过但 simulation 没有真实 payoff 的缺口。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、现有 payoff map 和 simulation reports、P3 execution plan、P3 dispatch matrix。

Scope:
- 比较 static payoff map expectations 与 0-30/0-50 simulation results。
- 找出写入 state 但没有 simulated payoff 的 key choices。
- 找出被 age、route、condition、priority ordering 阻塞的 payoff events。
- 产出 key-choice payoff gap report。

Non-goals:
- 不修改业务代码。
- 不新增 payoff hook。

Validation:
- `npm run typecheck`

Done:
- report 能支持 US-012、US-013、US-014。
```

## US-012 Prompt: Define Payoff Timing Rules

```text
你正在接手 P3 的 US-012：Define Payoff Timing Rules。

本会话只处理 US-012。目标是定义关键选择多久、以什么形式回响才算玩家可感知 payoff。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-011 report、US-002 trust targets、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义 key choice 到 first payoff 的最大推荐年龄距离。
- 定义 payoff 类型：text callback、event availability、altered choice、relationship change、route change、risk mitigation、ending weight。
- 定义 0-50 priority-route samples 的 minimum simulated payoff rate。
- 定义 missed payoff opportunity 的报告方式。

Non-goals:
- 不实现 payoff。
- 不修改 gate。

Validation:
- `npm run typecheck`

Done:
- payoff rules 可直接指导 US-013 和 US-014。
```

## US-013 Prompt: Implement Missing Payoff Hooks

```text
你正在接手 P3 的 US-013：Implement Missing Payoff Hooks。

本会话只处理 US-013。目标是补上 audit 中确认的 simulated payoff 缺口。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-011 report、US-012 rules、route contradiction audit/fix handoff 若已存在、P3 execution plan、P3 dispatch matrix。

Scope:
- 为有 simulated gaps 的 key choices 添加或调整 payoff hooks。
- 使用现有 state、flag、relationship、route、feedback 机制。
- 不制造 route contradiction。
- 让 simulated key-choice payoff rate 达到 P3 target。

Non-goals:
- 不新增无关 choice。
- 不重写 payoff 系统。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- 0-50 priority-route samples 的 simulated payoff rate 达标。
```

## US-014 Prompt: Harden Payoff Gate

```text
你正在接手 P3 的 US-014：Harden Payoff Gate。

本会话只处理 US-014。目标是让 gate 区分 static payoff coverage 和 simulated payoff coverage。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-012 rules、US-013 handoff、P3 execution plan、P3 dispatch matrix。

Scope:
- gate 区分 static payoff coverage 与 simulated payoff coverage。
- simulated payoff 低于 P3 target 时按 trust targets fail 或 block。
- gate output 列出 missing choice id、expected payoff id、sample id、likely block reason。

Non-goals:
- 不修具体 payoff hook。
- 不降低 target。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- broken simulated player memory 不再被 static map 掩盖。
```

## US-015 Prompt: Audit Priority Route Contradictions

```text
你正在接手 P3 的 US-015：Audit Priority Route Contradictions。

本会话只处理 US-015。目标是把 route contradiction warning 追踪到具体事件和状态变化。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-001 baseline、P3 execution plan、P3 dispatch matrix。

Scope:
- 找出产生 route contradiction warning 的 deterministic samples。
- 找出激活冲突 route states 的 exact events 和 effects。
- 判断原因来自 event data、route conflict rules、simulation choice strategy 或 fallback behavior。
- 产出 route contradiction audit report。

Non-goals:
- 不修改业务代码。
- 不修 route contradiction。

Validation:
- `npm run typecheck`

Done:
- report 能指导 US-016 做根因修复。
```

## US-016 Prompt: Fix Priority Route Contradictions

```text
你正在接手 P3 的 US-016：Fix Priority Route Contradictions。

本会话只处理 US-016。目标是让强互斥 priority routes 不会在 deterministic 0-50 scenarios 中同时激活。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-015 report、US-002 trust targets、P3 execution plan、P3 dispatch matrix。

Scope:
- strong-exclusion priority routes 不能同时 active。
- route transitions 必须通过 explicit turn、corruption、redemption、exile 或 betrayal events。
- route state history 记录 transition reason。
- 消除 golden-line route contradiction warnings，或按 P3 target 升级为 blocker 后修复。

Non-goals:
- 不重做身份系统。
- 不删除路线内容来绕过矛盾。

Validation:
- `npm run gate:golden-line`
- `npm run typecheck`
- 相关 tests。

Done:
- deterministic 0-50 priority-route state 不再出现强互斥矛盾。
```

## US-017 Prompt: Extend Simulation to Ages 31-50

```text
你正在接手 P3 的 US-017：Extend Simulation to Ages 31-50。

本会话只处理 US-017。目标是让 deterministic samples 能跑到 age 50，并分离 youth/midlife metrics。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-002 trust targets、相关 gate/simulation 文件、P3 execution plan、P3 dispatch matrix。

Scope:
- existing deterministic samples 可以 run through age 50。
- simulation reports 分离 0-30 与 31-50 metrics。
- output 包含 event count、choice count、route state、relationship state、death status、payoff status for 31-50。

Non-goals:
- 不实现三条 midlife route arc。
- 不调整 trust target。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- 31-50 内容有独立可验证的 simulation 输出。
```

## US-018 Prompt: Define Orthodox Sect Midlife Arc

```text
你正在接手 P3 的 US-018：Define Orthodox Sect Midlife Arc。

本会话只处理 US-018。目标是定义 orthodox/sect 31-50 midlife route beats。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-017 output、US-016 route rules、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义 responsibility、internal pressure、moral compromise、reputation cost、midlife consequence。
- 至少 3 个 midlife events 或 event specs。
- 至少 2 个 manual choices。
- 至少 2 个 callbacks to ages 0-30 choices or route state。

Non-goals:
- 不实现事件。
- 不扩写非 priority routes。

Validation:
- `npm run typecheck`

Done:
- orthodox/sect arc spec 可交给 US-019 实现。
```

## US-019 Prompt: Implement Orthodox Sect Midlife Arc

```text
你正在接手 P3 的 US-019：Implement Orthodox Sect Midlife Arc。

本会话只处理 US-019。目标是实现 orthodox/sect 31-50 midlife arc。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-018 spec、US-017 simulation output、P3 execution plan、P3 dispatch matrix。

Scope:
- orthodox/sect deterministic scenario 在 ages 31-50 至少到达 3 个 route-relevant events。
- 至少 2 个 manual choices。
- 至少 2 个 earlier choices or states 影响 midlife text、availability 或 outcomes。

Non-goals:
- 不实现 wandering hero 或 demonic path。
- 不做大型内容扩张。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- orthodox/sect midlife obligations and consequences 可在 deterministic scenario 中验证。
```

## US-020 Prompt: Define Wandering Hero Midlife Arc

```text
你正在接手 P3 的 US-020：Define Wandering Hero Midlife Arc。

本会话只处理 US-020。目标是定义 wandering hero 31-50 midlife route beats。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-017 output、US-016 route rules、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义 old case、public reputation、ally cost、moral dilemma、midlife consequence。
- 至少 3 个 midlife events 或 event specs。
- 至少 2 个 manual choices。
- 至少 2 个 callbacks to ages 0-30 choices or route state。

Non-goals:
- 不实现事件。
- 不扩写非 priority routes。

Validation:
- `npm run typecheck`

Done:
- wandering hero arc spec 可交给 US-021 实现。
```

## US-021 Prompt: Implement Wandering Hero Midlife Arc

```text
你正在接手 P3 的 US-021：Implement Wandering Hero Midlife Arc。

本会话只处理 US-021。目标是实现 wandering hero 31-50 midlife arc。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-020 spec、US-017 simulation output、P3 execution plan、P3 dispatch matrix。

Scope:
- wandering hero deterministic scenario 在 ages 31-50 至少到达 3 个 route-relevant events。
- 至少 2 个 manual choices。
- 至少 2 个 earlier choices or states 影响 midlife text、availability 或 outcomes。

Non-goals:
- 不实现 orthodox/sect 或 demonic path。
- 不重做声望系统。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- wandering hero midlife events 证明 freedom 有 consequences。
```

## US-022 Prompt: Define Demonic Path Midlife Arc

```text
你正在接手 P3 的 US-022：Define Demonic Path Midlife Arc。

本会话只处理 US-022。目标是定义 demonic path 31-50 midlife route beats。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-017 output、US-016 route rules、US-004 death risk rules、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义 power expansion、social cost、betrayal or temptation、redemption or escalation、midlife consequence。
- 至少 3 个 midlife events 或 event specs。
- 至少 2 个 manual choices。
- 至少 2 个 callbacks to ages 0-30 choices or route state。

Non-goals:
- 不实现事件。
- 不让 severe harm 无预警。

Validation:
- `npm run typecheck`

Done:
- demonic path arc spec 可交给 US-023 实现。
```

## US-023 Prompt: Implement Demonic Path Midlife Arc

```text
你正在接手 P3 的 US-023：Implement Demonic Path Midlife Arc。

本会话只处理 US-023。目标是实现 demonic path 31-50 midlife arc，并保证危险可读。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-022 spec、US-004 death risk rules、US-017 simulation output、P3 execution plan、P3 dispatch matrix。

Scope:
- demonic deterministic scenario 在 ages 31-50 至少到达 3 个 route-relevant events。
- 至少 2 个 manual choices。
- 至少 2 个 earlier choices or states 影响 midlife text、availability 或 outcomes。
- death 或 severe harm branches 有 visible risk 和至少一个 mitigation path。

Non-goals:
- 不实现 orthodox/sect 或 wandering hero。
- 不制造无预警 instant death。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- demonic midlife events 让 power 有代价，且危险可读。
```

## US-024 Prompt: Add 0-50 Midlife Gate

```text
你正在接手 P3 的 US-024：Add 0-50 Midlife Gate。

本会话只处理 US-024。目标是新增 P3 0-50 midlife gate，防止三条 priority routes 的中年体验静默回退。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-017 output、US-019/US-021/US-023 handoffs、US-016 route rules、P3 execution plan、P3 dispatch matrix。

Scope:
- gate 检查所有 priority-route deterministic 0-50 samples。
- 检查每条路线的 minimum midlife route events。
- 检查每条路线的 minimum midlife manual choices。
- 检查 death risk readability 和 route contradiction。
- output 列出 sample id、age、event id、failed metric。

Non-goals:
- 不实现缺失 route arc。
- 不降低 P3 targets。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- midlife gate 能阻止 31-50 route content regression。
```

## US-025 Prompt: Define Life Memory Model

```text
你正在接手 P3 的 US-025：Define Life Memory Model。

本会话只处理 US-025。目标是定义轻量 life memory 的数据分类、来源和玩家标签。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、现有 game state 类型、P3 execution plan、P3 dispatch matrix。

Scope:
- 定义 route status、key choices、relationships、unresolved debts、risks、achievements。
- 定义每类由哪些 existing state fields 提供。
- 定义 player-facing labels。
- 定义 hidden 或 spoiler-protected 内容。

Non-goals:
- 不实现数据 derivation。
- 不做 UI。
- 不新增大型记忆系统。

Validation:
- `npm run typecheck`

Done:
- life memory model 可交给 US-026 实现。
```

## US-026 Prompt: Implement Life Memory Summary Data

```text
你正在接手 P3 的 US-026：Implement Life Memory Summary Data。

本会话只处理 US-026。目标是从 current game state 派生可序列化 life memory summary。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-025 model、现有 game state 类型、P3 execution plan、P3 dispatch matrix。

Scope:
- 新增 function 或 module，从 current game state derive life memory summary。
- summary 包含已有的 route status、key choices、relationships、unresolved debts、risks、achievements。
- player-facing labels 避免 raw event ids。
- summary 可序列化。

Non-goals:
- 不做 UI。
- 不把 summary 作为冗余持久状态保存，除非现有架构必须。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- UI 和 reports 可消费统一 life memory summary。
```

## US-027 Prompt: Display Minimum Life Memory View

```text
你正在接手 P3 的 US-027：Display Minimum Life Memory View。

本会话只处理 US-027。目标是在 gameplay UI 暴露最小 life memory section 或 panel。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-026 summary API、现有 gameplay UI、P3 execution plan、P3 dispatch matrix。

Scope:
- gameplay UI 暴露 minimum life memory section 或 panel。
- view 显示 route status、key choices、relationships、unresolved debts、risk signals。
- desktop 和 mobile 可读。
- 不做 large visual redesign。

Non-goals:
- 不重做 UI 信息架构。
- 不新增无关视觉主题。

Validation:
- `npm run typecheck`
- 使用 dev-browser workflow 进行浏览器验证。

Done:
- 玩家能在 gameplay UI 查看当前 life summary。
```

## US-028 Prompt: Add Life Memory Regression Coverage

```text
你正在接手 P3 的 US-028：Add Life Memory Regression Coverage。

本会话只处理 US-028。目标是给 life memory summary 添加回归测试。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-026 implementation、US-027 UI handoff 如相关、P3 execution plan、P3 dispatch matrix。

Scope:
- tests 覆盖至少一个 route state in memory summary。
- tests 覆盖至少一个 key choice。
- tests 覆盖至少一个 relationship。
- tests 覆盖 unresolved risk 或 debt when present。

Non-goals:
- 不改变 summary 功能。
- 不扩展 UI。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- player-facing history 不会在核心场景中静默消失。
```

## US-029 Prompt: Update Experience Gates for P3 Completion

```text
你正在接手 P3 的 US-029：Update Experience Gates for P3 Completion。

本会话只处理 US-029。目标是把最终 P3 trust standards 写入 experience gates。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-002 trust targets、US-010/US-014/US-016/US-024/US-028 handoffs、P3 execution plan、P3 dispatch matrix。

Scope:
- P3 gate 包含 0-50 deterministic samples。
- P3 gate 包含 death readability target。
- P3 gate 包含 romance/family achievement target。
- P3 gate 包含 simulated payoff target。
- P3 gate 包含 route contradiction target。

Non-goals:
- 不新增未定义 target。
- 不降低目标以换取通过。

Validation:
- `npm run typecheck`
- 相关 tests。

Done:
- passing P3 gate 表示游戏体验确实达到 P3 信任标准。
```

## US-030 Prompt: Produce P3 Closure Report

```text
你正在接手 P3 的 US-030：Produce P3 Closure Report。

本会话只处理 US-030。目标是产出 P3 closure report，支持项目决定是否进入前后端分离规划。

请先读取 AGENTS.md、P3 PRD、P3 PRD JSON、US-001 baseline、US-029 final gate output、所有 P3 story handoff、P3 execution plan、P3 dispatch matrix。

Scope:
- report 列出 completed P3 user stories。
- report 包含 verification commands and results。
- report 比较 P3 warning metrics before and after。
- report 包含 0-50 scenario summaries。
- report 包含 remaining risks and next-phase recommendation。
- 文档不得包含本地绝对路径。

Non-goals:
- 不修未完成 story。
- 不启动下一阶段实现。

Validation:
- `npm run typecheck`
- 检查 closure report 不含本地绝对路径。

Done:
- P3 可以被明确收口，并给出下一阶段建议。
```

