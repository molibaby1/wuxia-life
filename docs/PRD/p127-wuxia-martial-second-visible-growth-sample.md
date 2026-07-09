# PRD: P127 Wuxia Martial Second Visible Growth Sample

> **Derived from:** `docs/test-reports/p126-p121-experience-optimization-closure-report.md`, `agent_docs/p126-wuxia-p121-experience-optimization-closure-reconciliation-gaps.md`
> **Supporting evidence:** `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md`, `docs/test-reports/p33-habit-zero-on-ramp-slice.md`, `tests/p122EarlyVisibleGrowthFeedbackTests.ts`, `tests/p41HabitFeedbackTests.ts`
> **Stage slug:** `p127-wuxia-martial-second-visible-growth-sample`
> **Stage type:** docs-first experience extension; single-sample follow-up

## 1. Introduction

P121 已正式闭环。下一步不该重开 `merchant 10–15`、武功主显、或技能系统，而该处理 P126 已明确记录的 defer：

**非 `merchant_house` 路线早期成长反馈模板化扩展。**

但这里也不能一口气做成“多出身成长系统”。P127 只做一件事：

**把 P122 已证明可行的“可见成长闭环”，扩到第二条单样板，并优先选 `martial_family`。**

目标不是泛化架构，而是证明 P122 不是 `merchant_house` 特供补丁。

## 2. Goals

- 在第二条单样板上复用 P122 的可见成长闭环
- 继续只用现有 `habit`、现有摘要位、现有反馈位、现有 echo/route 承接位
- 证明“早期成长可见化”可以跨出 `merchant_house`，但不扩成并行工程
- 为后续是否值得做 `scholar_house` 提供更低风险前例

## 3. Why This Direction

### 3.1 Why not reopen merchant

`merchant_house` 已在 P122 完成：

- 行为：`action_household_errand` / `action_household_apprentice`
- 塑形：`businessHabit >= 2`
- 可见确认：`shapingSummary` / `periodSummaryDisplay` / 长期影响
- 轻承接：`p9_echo_business_hook` / `p9_early_business_focus`

继续做 merchant，大概率是在重复证明同一件事。

### 3.2 Why not choose poor_family

`poor_family` 早期更像生存压力和营生活动噪音，不像一条干净的“单轴塑形 -> 可见确认 -> 承接”样板。它更容易把最小扩展做成混合问题。

### 3.3 Why martial_family is the cheapest second sample

`martial_family` 已具备更直接的第二样板前提：

- 幼年动作已存在：`action_childhood_training`
- 幼年承接 flag 已存在：`p9_echo_training_hook`、`p9_early_training_focus`
- `trainingHabit` 已是现有 `shapingSummary` 轴之一
- 后续承接更早：`p22_early_martial_route_fork` 在 16 岁就读取 `trainingHabit >= 2`
- 非路线回响也已有：`p42_training_habit_youth_sparring`

这比 `scholar_house` 更便宜。`scholar_house` 虽然可做，但其早期 `studyHabit` 累积更依赖 `comprehension/knowledge -> studyHabit` 的间接链，证明链更绕，最小性更差。

## 4. Scope

### In Scope

- 只做第二条早期可见成长样板
- 固定出身：`martial_family`
- 固定塑形轴：`trainingHabit`
- 固定主样板年龄：5–8 岁
- 固定轻承接验证年龄：8–16 岁
- 只复用现有表达层、阶段结算、长期影响、echo / route 承接

### Out of Scope

- `scholar_house` 平行实现
- `poor_family` 或其他出身扩展
- 技能系统、熟练度树、第二套成长系统
- 武功底层数值迁移
- 武功主显再次收敛
- 新增独立成长面板
- merchant 路线再补一轮

## 5. Core Problem

P122 已证明“成长发生了但玩家感觉不到”可以靠现有层修正，但它仍然只覆盖一条商路样板。

如果不补第二条单样板，P122 就始终像一个 merchant 专项补丁，而不是一个已被证明可复用的体验模式。

P127 要解决的不是“武道内容不够多”，而是：

**武道方向是否也能在不加新系统的前提下，把早期成长做成玩家可见闭环。**

## 6. Player-Facing Signals

P127 必须继续复用 P122 的三类确认信号，不允许发明第四套东西：

### Signal A: 主界面塑形短句确认

玩家能从“塑形未成”稳定进入类似：

- `习武 · 渐成`

### Signal B: 年龄推进 / 阶段结算确认

玩家在年龄推进时能读到：

- 这一期的成长主轴是习武，而不是只看到武功数字涨了

### Signal C: 行为后的长期影响确认

玩家在完成早期练功动作后，反馈区能看到：

- 习武塑形加深
- 武道方向已被记住

## 7. Preferred Landing Layers

### P0. 表达层

- `MainScreenLifeSummary`
- `shapingSummary`
- 现有反馈区“长期影响”

### P0. 年龄推进结算

- `periodSummaryDisplay`

### P1. 事件回响 / 路线承接

- `p9_echo_training_hook`
- `p9_early_training_focus`
- `p22_early_martial_route_fork`
- `p42_training_habit_youth_sparring`

要求只证明“可读性提升”，不补新分岔主线。

## 8. Minimal Sample

### Origin

- `martial_family`

### Primary actions

- `action_childhood_yard_play`
- `action_childhood_training`

以 `action_childhood_training` 为主证明动作；`action_childhood_yard_play` 只作为更轻量前置行为参考，不强行扩成双主动作闭环。

### Threshold

- `trainingHabit >= 2`

### Continuation targets

- `p9_echo_training_hook`
- `p9_early_training_focus`
- `p22_early_martial_route_fork`
- `p42_training_habit_youth_sparring`

## 9. User Stories

### US-001: Show martial shaping confirmation on existing summary surfaces

**Description:** As a player, I want the main screen to clearly tell me that my early martial behavior is shaping me, so childhood training feels like growth instead of empty repetition.

**Acceptance Criteria:**

- [ ] 在 `martial_family` 样板中，5–8 岁可以稳定从“塑形未成”进入明确的习武塑形短句
- [ ] 该短句来自现有 `trainingHabit` / `lifeStates`，不是新平行系统
- [ ] 文案表达的是成长方向，不是重复“你出身武学世家”
- [ ] 玩家能明确读出“习武方向正在成形”

### US-002: Confirm martial shaping at age progression / period settlement

**Description:** As a player, I want age progression to summarize my martial shaping growth, so each step feels like I became more of a martial person rather than merely gaining stats.

**Acceptance Criteria:**

- [ ] 至少一处年龄推进 / 阶段结算会总结本期习武塑形变化
- [ ] 文案强调“这是反复练出来的”，而不是年龄自然增长
- [ ] 继续复用现有 `periodSummaryDisplay`
- [ ] 不新增独立结算系统

### US-003: Show long-term impact after early martial actions

**Description:** As a player, I want early training actions to leave visible long-term traces in the feedback area, so I can connect my behavior to my martial shaping.

**Acceptance Criteria:**

- [ ] 早期练功动作完成后，反馈区能显示至少一种玩家可见的长期影响确认
- [ ] 确认信号能被理解为“这会继续影响我的人生走向”
- [ ] 优先复用现有长期影响 / flag 显示机制
- [ ] 不要求这一步直接打开新分支，只要求因果被玩家看见

### US-004: Prove continuation readability on one martial sample

**Description:** As a maintainer, I want one narrow martial sample proof that visible growth improves later route readability, so the pattern is proven reusable without opening parallel implementation.

**Acceptance Criteria:**

- [ ] 样板范围固定在 `martial_family` 5–16 岁
- [ ] 证据能展示“行为 -> `trainingHabit` 累积 -> 可见确认 -> `p22` / `p42` 更可读”
- [ ] 不并行改 `scholar_house`
- [ ] 不把正道路线扩写、门派主线扩写、或武功系统迁移混进同一波

## 10. Success Criteria

- 玩家能在 `martial_family` 早期段稳定感到“我因练功而成长”
- 至少两种玩家可见确认信号被证明可用
- `trainingHabit` 的后续承接不再只是内部条件，而是玩家可读前因
- P127 交付后，可以明确说“P122 模式已在第二条样板上复用成功”

## 11. Verification Standard

- 必须产出一份窄 proof 文档，固定在 `martial_family` 样板上
- 必须有窄回归测试，覆盖 summary / long-term impact / settlement / continuation readability
- 不要求浏览器大范围实机矩阵
- 只重跑与 P127 直接相关的窄测试

## 12. Non-Goals

- 不把 `scholar_house` 一起做掉
- 不把武道内容扩成完整少年主线
- 不重写 `p22` 或 `p21` 内容池
- 不改底层成长公式
- 不做跨两条以上出身的模板工程

## 13. Minimal Execution Order

1. 锁定 `martial_family` 样板、动作、阈值、承接点
2. 接通 `shapingSummary` 的习武可见确认
3. 接通反馈区“长期影响”的习武确认
4. 接通年龄推进结算中的习武成长句
5. 产出 `p22` / `p42` 轻承接 proof
6. 补窄回归测试并收口

## 14. Recommendation

P127 只适合做成单样板执行单，不适合继续拆成“多路线统一成长模板”。

如果 P127 做完还想继续扩，下一步才有资格比较：

- 是先做 `scholar_house`
- 还是停在“两条样板已证明”并转向更高优先 backlog

在 P127 之前就讨论统一模板，属于典型过度设计。
