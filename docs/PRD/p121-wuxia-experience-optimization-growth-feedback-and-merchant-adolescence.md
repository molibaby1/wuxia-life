# PRD: P121 Wuxia Experience Optimization (Growth Feedback And Merchant Adolescence)

> **Derived from:** `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`
> **Supporting analysis:** `docs/test-reports/2026-06-30-merchant-early-experience-feedback-and-analysis.md`, `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`, `docs/test-reports/2026-06-30-martial-attribute-simplification-analysis.md`
> **Stage slug:** `p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence`
> **Stage type:** product experience optimization; docs-first bounded implementation wave

## 1. Introduction

P120 已经把 `merchant_martial_patron` 与 `founding_patriarch` 两条 sample-lines playable spine 闭合，并将 North Star §8 推到 `CLEAR`。但这只证明“结构能跑通”，不证明“玩家已经感觉到成长”。

当前最明显的体验问题并不是缺系统，而是已有系统没有稳定转化成玩家可感知的成长闭环。商贾出身 0–15 岁阶段尤其暴露出这个问题：前期有 flavor，内部状态也在变化，但玩家难以持续感到“我变强了”“我正在成形”“我的路线正在分化”。

本阶段不再优先扩新大线路，而是把体验优化收敛为三个最小方向：

- 让早期成长反馈显性化
- 补上商贾 10–15 岁关键分岔段
- 收敛武功主显职责，为非武路线腾出认知空间

## 2. Goals

- 建立“选择 -> 成长确认 -> 新事件/挑战 -> 再成长”的可感知正反馈
- 让商贾出身在 10–15 岁出现至少一个明确的承担或分岔节点，避免路线断档
- 降低武功细分数值对主界面的占据，明确哪些是总读数、哪些只是风格细分
- 在不引入新大系统的前提下，提升玩家对已有成长、分化、路线成形的感知

## 3. Non-Goals

- 不开启完整技能系统设计与实现
- 不新增新的大型路线波次
- 不重做整套战斗/武功底层数值体系
- 不扩成多出身并行优化工程
- 不靠单纯增加 flavor 文本来掩盖成长反馈缺失
- 不在本阶段处理 P19 generic endgame integration、ordinary-origin founding-patriarch overlays、Wave 4 ordinary expansion

## 4. User Stories

### US-001: Make early growth feedback visible

**Description:** As a player, I can clearly perceive that my early-life choices changed who I am becoming, instead of only advancing hidden state.

**Acceptance Criteria:**

- [ ] 明确至少 2 类早期成长确认信号：例如年龄推进后的身份/倾向确认、关键节点后的能力或路线倾向确认
- [ ] 成长确认必须是玩家可见反馈，不得只停留在 hidden flag 或内部属性变化
- [ ] 反馈应服务于“去年和今年不一样”的体验，而不是重复解释背景
- [ ] 不引入新系统层；优先复用现有表达层、事件结果层、样本链验证方式
- [ ] 至少提供 1 组可复核样本，证明成长反馈已进入玩家视野

### US-002: Add a merchant adolescence shaping fork (age 10-15)

**Description:** As a player with merchant origin, I encounter a meaningful shaping segment in adolescence that starts turning background flavor into a playable path.

**Acceptance Criteria:**

- [ ] 商贾出身在 10–15 岁新增至少 1 个关键承担/分岔节点
- [ ] 该节点必须让玩家感到“我准备成为什么样的商人”，而不只是再看一段日常文本
- [ ] 该节点的后果必须能在后续表达、事件触发或阶段目标中被读出来
- [ ] 不要求一次做成完整多分支大链；允许先做单关键节点 + 后续可读回响
- [ ] 需明确与 0–7 岁 flavor、8–12 岁 shaping、16+ 商路线的衔接方式

### US-003: Narrow martial as a displayed axis, not the whole worldview

**Description:** As a player, I can understand martial growth at a glance without letting martial sub-stats drown out non-martial life paths.

**Acceptance Criteria:**

- [ ] 明确武学总读数与细分属性的职责边界
- [ ] 明确哪些数值继续主显，哪些降级为背景细分或表达支撑
- [ ] 优先做展示职责收敛，不做底层大迁移
- [ ] 调整后的方案不能让玩家更难理解“我哪里变强了”
- [ ] 非武路线必须因此获得更可见的能力空间，而不是只把武功词换个说法

### US-004: Keep the scope minimal and anti-overdesign

**Description:** As a maintainer, I can improve perceived growth without reopening the project into another multi-system design spiral.

**Acceptance Criteria:**

- [ ] 本阶段不新增技能系统、熟练度树、专精树、第二套成长面板
- [ ] 若需要新字段、新表达或新事件，必须证明它直接服务于成长可感知性
- [ ] 任一改动都应能映射回“成长显性化 / 商贾青春期分岔 / 武功主显收敛”三项目标之一
- [ ] 文档中需明确列出 defer 项，防止会话接力时范围扩散

## 5. Success Criteria

- 玩家在早期年龄段能稳定感到“我因选择而成长”
- 商贾出身不再在 10–15 岁出现明显的路线断档
- 武功相关显示不再压制其他人生能力轴
- 本阶段交付后，至少一条早期出身样板路线更接近“成长剧情播放器”而不是“事件播放列表”

## 6. Recommended Execution Order

1. 先做“成长反馈显性化”最小实现  
   先解决“成长发生了但玩家感觉不到”的总问题。

2. 再做“商贾 10–15 岁关键分岔”  
   这是当前最清晰、最值得打样的一条早期路线断点。

3. 最后做“武功主显职责收敛”  
   先收敛展示与认知负担，再决定未来是否值得动更深层数值结构。

## 7. Dependencies / Context

- P120 closure: `docs/test-reports/p120-closure-report.md`
- P120 reconciliation: `docs/test-reports/p120-north-star-section8-reconciliation.md`
- Experience priority summary: `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`
- Merchant experience analysis: `docs/test-reports/2026-06-30-merchant-early-experience-feedback-and-analysis.md`
- Merchant 0-15 audit: `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`
- Martial attribute analysis: `docs/test-reports/2026-06-30-martial-attribute-simplification-analysis.md`

## 8. Defer Queue

- 完整技能系统
- 武功底层数值大迁移
- 多出身并行早期重做
- `merchant_magnate` full spine 补齐
- ordinary-origin founding-patriarch overlays
- P19 generic endgame integration

## 9. Open Questions

- 早期成长确认信号应优先挂在表达层、事件回响，还是年龄结算摘要
- 商贾 10–15 岁分岔应优先强调“经营承担”还是“人脉/手艺/账房”方向
- 武功主显收敛是只改展示，还是允许附带最小字段降权

## 10. Recommendation

本 PRD 适合作为体验优化总纲，但不适合直接丢给执行会话整包开工。下一步应拆成 2–3 个更小的执行前置文档：

1. 早期成长反馈显性化最小实现
2. 商贾 10–15 岁关键分岔补强
3. 武功主显职责收敛（展示优先）

否则又会回到“方向是对的，但一次想修太多”的老毛病。
