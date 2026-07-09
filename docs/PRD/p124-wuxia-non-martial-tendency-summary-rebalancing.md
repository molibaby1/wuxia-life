# PRD: P124 Wuxia Non-Martial Tendency Summary Rebalancing

> **Derived from:** `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md`
> **Supporting analysis:** `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`, `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`, `docs/test-reports/2026-06-30-martial-attribute-simplification-analysis.md`
> **Stage slug:** `p124-wuxia-non-martial-tendency-summary-rebalancing`
> **Stage type:** summary-layer experience optimization

## 1. Introduction

P123 处理的是“第一屏主显太武功中心”的问题，但这还不够。即使武功细分从第一屏降级，如果 `tendencySummary` 仍优先把玩家读成“功力 / 内功 / 外功”，非武路线的成长感还是容易被吃掉。

本 PRD 只处理一句话：

**让 `tendencySummary` 在非武路线和早期阶段，更像人生倾向摘要，而不是另一行武功排行榜。**

## 2. Goals

- 让 `tendencySummary` 与 `routeSummary`、`shapingSummary` 协作，而不是互相打架
- 降低 martial bucket 对非武路线摘要的抢屏
- 让商路、学识、人脉、悟性等非武倾向在合适阶段更容易被读出来
- 不新增新摘要模块

## 3. Core Problem

当前 `tendencySummary` 的问题不是完全错误，而是**过度依赖显性数值排序**：

- martial 候选数量多
- `martialPower`、`internalSkill`、`externalSkill`、`qinggong` 容易重复占权重
- 非武路线即使已有 `shapingSummary` 或 route 方向，也可能被摘要层重新拉回武功语境

这会形成一个坏结果：

**玩家上面看见商路，下面又被摘要告诉“你主要还是功力/内功”。**

## 4. Scope

### In Scope

- 只改 `tendencySummary` 的生成规则
- 允许读取现有 `routeStatus`、`shapingSummary`、现有非武属性
- 只做摘要排序和降权，不改底层数值
- 只做单行摘要逻辑，不新增新 UI 区块

### Out of Scope

- 不改 `routeSummary`
- 不改 `shapingSummary`
- 不改完整属性面板
- 不改属性定义
- 不引入“职业倾向值”之类新容器

## 5. User Stories

### US-001: Let non-martial routes read like non-martial routes

**Description:** As a player on a merchant or other non-martial path, I want the tendency summary to read my current life direction instead of dragging me back to combat by default.

**Acceptance Criteria:**

- [ ] 非武路线下，`tendencySummary` 不再轻易被 2–3 个 martial 候选重复占领
- [ ] 商路样板里，营生/学识/人脉/悟性等方向在合适状态下可优先被读出
- [ ] 摘要文案与 `routeSummary`、`shapingSummary` 不出现明显互相打脸

### US-002: Keep martial readability for real martial-dominant states

**Description:** As a martial-heavy player, I still want the tendency summary to show martial dominance when combat truly is my main axis.

**Acceptance Criteria:**

- [ ] 武功确实主导时，`tendencySummary` 仍可读出武学总趋势
- [ ] 不为了扶正非武路线而把武功摘要彻底打废
- [ ] `martialPower` 的总读数优先于多个 martial 子项重复刷存在感

### US-003: Rebalance summary logic without inventing a new system

**Description:** As a maintainer, I want summary rebalancing to stay inside existing route/life-state/stat wiring, so this remains a display-layer fix instead of a new progression model.

**Acceptance Criteria:**

- [ ] 只使用现有 route、lifeStates、现有属性
- [ ] 不新增“倾向系统”“职业系统”“身份评分”之类新层
- [ ] 修改可以被窄测试覆盖

## 6. Functional Requirements

- FR-1: `tendencySummary` 必须减少 martial 子项重复占据摘要的概率。
- FR-2: 非武路线下，摘要生成必须优先考虑现有 route/shaping 语境。
- FR-3: martial dominance 仅在武功确实构成主成长轴时主显。
- FR-4: 不得新增任何新的成长、路线、倾向数据容器。

## 7. Non-Goals

- 不改第一屏核心属性位
- 不改完整属性说明页
- 不增删属性
- 不写新路线内容
- 不做技能系统

## 8. Likely Touchpoints

- `src/components/mainScreenModel.ts`
- `src/components/MainScreenLifeSummary.vue`

## 9. Verification Standard

- 商路等非武路线下，`tendencySummary` 更容易读出非武倾向
- 武路玩家仍能读出武学主轴
- 摘要与 `routeSummary`、`shapingSummary` 协同，而不是彼此冲突

## 10. Recommended Execution Order

1. 先降低 martial bucket 的重复主显
2. 再引入现有 route/shaping 语境做摘要优先级修正
3. 最后用商路与武路样板各做一组窄验证

