# PRD: P123 Wuxia Main Screen Martial Primary Display Narrowing

> **Derived from:** `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md`
> **Supporting analysis:** `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`, `docs/test-reports/2026-06-30-martial-attribute-simplification-analysis.md`, `docs/designs/p7-attribute-visibility-tiers.md`
> **Stage slug:** `p123-wuxia-main-screen-martial-primary-display-narrowing`
> **Stage type:** display-first experience optimization; smallest visible slice

## 1. Introduction

P122 已经把“成长发生了但玩家感觉不到”补成了最小可见闭环。`merchant_house` 早期成长现在能被玩家看见，P94–P96 的商路线中青年链也已闭环。继续在商贾成长链上补内容，不是当前最优先项。

当前更该处理的是 P121 的第三方向：

**武功主显职责收敛。**

问题不是武功属性不该存在，而是主界面第一屏把 `martialPower`、`externalSkill`、`internalSkill`、`qinggong`、`constitution` 长期并列主显，天然把“武学细分”放成了“人生主画面”。这会让非武路线即使已经有成长，也很难抢到注意力。

本 PRD 只做第一刀：

**缩减主界面第一屏的武功主显密度，不动底层数值，不动完整属性页解释体系。**

## 2. Goals

- 让主界面第一屏不再默认由 4–5 个武功相关数值占满
- 明确 `martialPower` 是武学总读数，而不是五项并列中的一项
- 给非武路线腾出第一屏注意力，不靠新增系统
- 用最小 UI 收敛验证“武功主显减法”是否提升可读性

## 3. Core Problem

当前第一屏问题很具体：

- `coreStats` 直接放了 `功力 / 外功 / 内功 / 轻功 / 体魄 / 银两`
- `topResources` 还重复显示 `体魄`
- 玩家还没点开完整属性说明，就已经被武功细分层淹没

这不是“数值太多”的抽象抱怨，而是**第一屏职责错位**：

- `martialPower` 应该承担“武学总读数”
- `externalSkill` / `internalSkill` / `qinggong` 更像风格细分
- `constitution` 更接近生存底子

## 4. Scope

### In Scope

- 只改主界面第一屏的核心属性主显
- 只处理 `coreStats` / `topResources` 这一层
- 只处理展示职责，不改底层属性含义
- 允许同步调整极少量说明文案，使第一屏职责自洽

### Out of Scope

- 不改 `fullStatGroups` 的完整分组结构
- 不改事件条件、奖励、底层数值关系
- 不删属性
- 不做新面板、新分页、新筛选器
- 不顺手处理 `tendencySummary` 算法
- 不补路线内容

## 5. User Stories

### US-001: Make first-screen combat readout stop dominating the whole screen

**Description:** As a player, I want the first screen to show the main combat readout without four other martial sub-stats shouting next to it, so non-martial growth can stay visible.

**Acceptance Criteria:**

- [ ] 主界面第一屏不再同时主显 `功力 / 外功 / 内功 / 轻功 / 体魄`
- [ ] `martialPower` 继续保留在第一屏，作为武学总读数
- [ ] 至少 2 个武学细分属性从第一屏主显降级到完整属性说明层
- [ ] 非武路线玩家第一眼不再像被迫先看一排武功细分

### US-002: Keep constitution readable without pretending it is a martial specialization

**Description:** As a player, I want 体魄 to stay understandable as a survival base, not be bundled mentally as one more martial specialization.

**Acceptance Criteria:**

- [ ] `体魄` 的第一屏位置与说明不再暗示它是和外功/内功/轻功同级的武学细分
- [ ] 若 `体魄` 保留第一屏，则职责必须更接近生存底子而非武学风格
- [ ] 不新增新属性名或替代系统

### US-003: Preserve data completeness while narrowing primary emphasis

**Description:** As a maintainer, I want to reduce first-screen emphasis without deleting or hiding needed data from the full panel.

**Acceptance Criteria:**

- [ ] 被降级的武学细分属性仍可在完整属性页查看
- [ ] 不删除现有属性
- [ ] 不修改事件、条件、奖励对这些属性的依赖
- [ ] 变更严格局限在展示主次关系

## 6. Functional Requirements

- FR-1: `martialPower` 必须在第一屏保留为武学总读数。
- FR-2: `externalSkill`、`internalSkill`、`qinggong` 中至少两项不得继续占据第一屏核心属性位。
- FR-3: `constitution` 的第一屏职责必须与“生存底子”对齐，而不是继续充当武学细分并列项。
- FR-4: 完整属性页必须继续保留所有现有武功细分数值。
- FR-5: 本轮改动不得修改任何底层属性计算、事件门槛或奖励逻辑。

## 7. Non-Goals

- 不重写武功系统
- 不合并属性字段
- 不调整 `tendencySummary`
- 不改完整属性页分组解释
- 不处理商贾、医术、门派等路线内容

## 8. Likely Touchpoints

- `src/components/mainScreenModel.ts`
- `src/components/MainScreenStatsPanel.vue`
- `src/components/GameScreen.vue`

## 9. Verification Standard

- 第一屏核心属性主显中的武功细分数量明显减少
- `功力` 仍保留为总读数
- 完整属性页仍能看到全部武功细分
- 非武路线第一屏不再被武功细分默认压屏

## 10. Recommended Execution Order

1. 先收缩第一屏 `coreStats`
2. 再校正 `topResources` 与 `体魄` 职责
3. 最后做浏览器核对，确认第一屏认知负担确实下降

