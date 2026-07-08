# PRD: P122 Early Visible Growth Feedback Minimal Implementation

> **Derived from:** `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md`
> **Supporting analysis:** `docs/test-reports/p120-closure-report.md`, `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`, `docs/test-reports/2026-06-30-merchant-early-experience-feedback-and-analysis.md`, `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`, `docs/test-reports/visible-growth-scope-contract.md`, `docs/test-reports/hvg-merchant-visible-growth-proof.md`
> **Stage slug:** `p122-early-visible-growth-feedback-minimal-implementation`
> **Stage type:** docs-first experience fix; smallest executable slice

## 1. Introduction

P120 已确认当前产品不是“结构没闭环”，而是“成长发生了，但玩家感受不到”。P121 已经把体验优化拆成三个方向，但那份总 PRD 仍然太宽，不能直接丢给执行会话。

本 PRD 只解决其中一个问题：

**把早期成长从 runtime 内部真相，转成玩家能连续看到的确认信号。**

这不是新系统设计，也不是商贾路线重做。它只要求现有 `habit`、现有摘要位、现有反馈位、现有 echo/route 承接位，组成一条最小可见闭环：

`行为 -> 塑形累积 -> 玩家确认 -> 后续机会更可读`

## 2. Goals

- 让玩家在早期年龄段明确看到“我最近在往什么方向成长”
- 让成长确认优先复用现有表达层与结算层，而不是新增独立面板
- 用单一路线样板证明现有 `habit` 足以支撑可见成长闭环
- 为后续“商贾 10–15 岁分岔补强”提供前置体验底座，但不提前实现它

## 3. Core Problem

现状不是没有成长，而是成长确认断在了玩家视野外：

- `businessHabit`、`trainingHabit`、`studyHabit` 等塑形轴会在运行时累积
- `p9_echo_business_hook`、`p9_early_business_focus` 等承接标记已经存在
- 主界面已有 `tendencySummary`、`shapingSummary`
- 事件反馈区已有“长期影响”展示位
- 年龄推进已有 `periodSummaryDisplay`

问题在于这些点没有被组织成稳定的“成长被确认”体验，所以玩家读到的是事件，没读到成长。

## 4. Scope

### In Scope

- 只做早期成长确认信号的可见化
- 只使用现有 `habit` / `lifeStates` / route flag / echo hook 体系
- 只做单一路线样板：`merchant_house`
- 只覆盖最小样板年龄段：5–12 岁
- 只要求“看见成长”和“看见成长后的轻承接”，不要求补完整新分岔

### Out of Scope

- 商贾 10–15 岁关键分岔补强
- 武功主显职责收敛
- 技能系统、熟练度树、第二套成长系统
- 多出身并行改造
- 全量早期事件重写
- 按年龄自动涨点
- 新增独立成长面板或复杂新 UI

## 5. Player-Facing Growth Confirmation Signals

本轮必须让玩家看到的，不是抽象“系统变好了”，而是以下三类确认信号：

### Signal A: 塑形已成的短句确认

玩家在主界面摘要里，能稳定看到类似“营生 · 渐成”“习武 · 初现”的短句，而不是长期停留在“塑形未成”。

目标：

- 让玩家知道自己不是白过了一年
- 让“我正在成为什么样的人”先于大路线分岔被看见

### Signal B: 年龄推进后的年度变化确认

玩家在年龄推进/阶段结算时，能读到“这一年你的哪条成长线变清楚了”，而不是只看到泛化结算文案或数值变化碎片。

目标：

- 把“去年和今年不一样”做成体感
- 让 repeated action 的累计结果被显式总结

### Signal C: 关键行为后的长期影响确认

玩家做完会推动塑形的行为后，反馈区能明确出现“长期影响”或等价确认，而不是只有银两/数值增减。

目标：

- 让玩家把行为与塑形建立因果连接
- 避免成长仍然只停留在 hidden flag / hidden habit

## 6. Preferred Landing Layers

本轮不该发明新挂点，优先挂在仓库里已经存在且最容易落地的位置。

### P0. 表达层

优先原因：

- 主界面已经有 `MainScreenLifeSummary`
- 已经显示 `tendencySummary` 与 `shapingSummary`
- 事件反馈区已经有“长期影响”展示位

本轮要求：

- 把塑形确认作为第一优先玩家确认层
- 让成长反馈优先进入现有摘要与反馈区，不新建面板

### P0. 年龄推进结算

优先原因：

- `GameScreen.vue` 已存在 `periodSummaryDisplay`
- 这是最天然的“去年 -> 今年”确认位

本轮要求：

- 年龄推进时，要能总结本期哪条塑形线被做实
- 结算文案必须强调“成长确认”，不是重复叙事背景

### P1. 事件回响

优先原因：

- 仓库已有 `p9_echo_business_hook`
- 已有 echo hook / callback 体系
- 已有“行为推动后续资格”的历史实现模式

本轮要求：

- 至少一处早期成长确认通过现有 echo / callback 思路可读
- 这里只做“确认成长已被记住”，不扩成新主线

### P1. 现有路线承接位

优先原因：

- `merchant_talent_discovery`、`route_merchant`、`p9_early_business_focus` 已经存在
- `hvg-merchant-visible-growth-proof.md` 已证明 `businessHabit` 与这些承接位可以形成最小链路

本轮要求：

- 只要证明“可见成长确认”会让后续承接更可读即可
- 不要求补新年龄段内容，不要求新大分岔

## 7. Minimal Sample

### Sample Route

- 固定为 `merchant_house`

原因：

- 当前问题最明确
- 已有 `businessHabit`、`p9_echo_business_hook`、`p9_early_business_focus` 基础
- 已有 proof 显示 5 岁跑腿、8 岁学徒后可以把 `businessHabit` 推到 2，并出现 `营生 · 渐成`

### Sample Age Band

- 主样板：5–8 岁
- 轻承接验证：8–12 岁

原因：

- 5–8 岁已经有可验证的行为与塑形积累
- 8–12 岁足够验证“成长确认后，后续承接是否更可读”
- 再往 10–15 岁推进，就会混入“青春期分岔补强”这个第二问题，超范围

### Sample Actions / State

- `action_household_errand`
- `action_household_apprentice`
- `businessHabit >= 2`
- `p9_echo_business_hook`
- `p9_early_business_focus`

## 8. User Stories

### US-001: Show shaping confirmation on existing summary surfaces

**Description:** As a player, I want the main screen to plainly tell me what kind of person I am becoming, so that early years feel like growth instead of passive playback.

**Acceptance Criteria:**

- [ ] 在样板路径中，5–8 岁可以稳定从“塑形未成”进入明确塑形短句
- [ ] 该短句来自现有 `habit` / `lifeStates`，不是新增平行系统
- [ ] 文案表达的是成长方向，不是重复出身背景
- [ ] 商贾样板中，玩家可明确读出“营生方向正在成形”

### US-002: Confirm growth at age progression / period settlement

**Description:** As a player, I want age progression to tell me what growth line became clearer this period, so that each age step feels like a meaningful change.

**Acceptance Criteria:**

- [ ] 在样板路径中，至少一处年龄推进/阶段结算会总结本期塑形变化
- [ ] 文案明确回答“你这段时间长成了什么”，而不是只列数值变化
- [ ] 反馈必须和前期行为有关，而不是年龄自然增长
- [ ] 不新增独立结算系统，只复用现有阶段结算位

### US-003: Confirm long-term impact immediately after shaping actions

**Description:** As a player, I want shaping actions to leave visible long-term traces in the feedback area, so that I can connect my choices to my growth.

**Acceptance Criteria:**

- [ ] 样板动作完成后，反馈区能显示至少一种玩家可见的长期影响确认
- [ ] 确认信号要能被玩家理解为“这会继续影响我的人生走向”
- [ ] 该确认优先复用现有长期影响/flag 显示机制
- [ ] 不要求这一步直接打开新分支，只要求因果被玩家看见

### US-004: Prove the visible loop on one narrow merchant sample

**Description:** As a maintainer, I want one narrow merchant sample to prove that visible growth works, so that later work can extend the pattern instead of reopening design.

**Acceptance Criteria:**

- [ ] 样板范围固定在 `merchant_house` 5–12 岁
- [ ] 验证证据能展示“行为 -> 塑形累积 -> 可见确认 -> 后续承接更可读”
- [ ] 不并行改第二条路线
- [ ] 不把商贾 10–15 岁分岔补进同一波实现

## 9. Functional Requirements

- FR-1: 现有 `shapingSummary` 必须承担第一层成长确认职责。
- FR-2: 现有事件反馈区的“长期影响”必须能承接早期塑形确认。
- FR-3: 现有 `periodSummaryDisplay` 必须承担“本期成长被确认”的年度结算职责。
- FR-4: 样板实现必须以 `merchant_house` 的 `businessHabit` 成长链作为唯一主验证对象。
- FR-5: 现有 echo / route 承接位只用于证明成长后续可读，不用于扩写新大分岔。
- FR-6: 任一新增文案、flag 显示或结算摘要都必须直接服务于“成长感被确认”。
- FR-7: 本轮不得新增新系统容器、成长树、额外能力面板或多路线并行逻辑。

## 10. Verification Standard

本轮验收不是“加了几句文案”，而是要证明下面这条链真的被玩家看见：

1. 玩家在 5–8 岁做了商贾向行为
2. `businessHabit` 或等价现有塑形值确实累积
3. 主界面摘要或反馈区明确确认了这种成长
4. 年龄推进时，系统会总结这段成长已经成形
5. 8–12 岁的后续承接因此更容易被玩家理解为“前面成长的结果”

### Required Acceptance

- 样板路径下，玩家至少能看到 2 个不同时间点的成长确认信号
- 其中至少 1 个来自摘要/反馈层，至少 1 个来自年龄推进结算
- 确认内容必须能区分“背景 flavor”与“成长已发生”
- 样板中不得依赖新增系统名词来解释成长

## 11. Non-Goals

- 不定义完整“成长系统”
- 不定义技能、熟练度、专精、职业树
- 不补商贾 10–15 岁关键分岔
- 不讨论武功五属性如何收敛
- 不把所有路线都改成同样模板
- 不为了复用提前抽象“通用成长反馈框架”

## 12. Risks And Guardrails

### Risk 1: 借“成长显性化”之名偷做新系统

禁止。当前仓库已经有 `habit`、摘要位、反馈位、结算位，再造一层就是犯病。

### Risk 2: 一口气覆盖 0–15 全年龄段

禁止。那会把“成长显性化”和“商贾青春期分岔补强”重新绑死。

### Risk 3: 只补 flavor，不补确认

禁止。玩家缺的不是更会写，而是更能确认自己变了。

### Risk 4: 顺手并行优化别的路线

禁止。样板没证明之前，多路线并行只会稀释问题。

## 13. Minimal Execution Order

如果后续进入代码实现，最小顺序必须是：

1. 先锁定 `merchant_house` 5–8 岁样板行为与现有塑形阈值
2. 再把成长确认先接到现有表达层与反馈层
3. 再把同一条成长确认接到年龄推进结算
4. 最后验证 8–12 岁承接是否因此更可读

不允许倒序开工。先补 10–15 岁、先做新分岔、先做武功展示，都属于跑偏。

## 14. Recommendation

这份 PRD 已经够小，可以直接作为下一份执行 PRD 的边界基线。

但还有一个必须坚持的收口点：

**执行时不要贪。只要证明 `merchant_house` 5–12 岁能让玩家看见成长，这一波就该停。**

再往前多走一步，就会重新掉进“大一统成长系统设计”的坑里。
