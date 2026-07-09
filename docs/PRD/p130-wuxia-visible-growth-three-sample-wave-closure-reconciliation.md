# PRD: P130 Wuxia Visible Growth Three-Sample Wave Closure Reconciliation

> **Derived from:** `docs/PRD/p129-wuxia-ordinary-origin-early-visible-growth-sample.md` (Discovery pass 2026-07-09)
> **Gaps addressed:** GAP-P129-D01, GAP-P129-D07
> **Stage slug:** `p130-wuxia-visible-growth-three-sample-wave-closure-reconciliation`
> **Stage type:** docs-only reconciliation; no runtime or UI code changes

## 1. Introduction

P122 在 `merchant_house` / `businessHabit` 上证明了早期可见成长闭环。P127 在 `martial_family` / `trainingHabit` 上复用同一模式。P128 正式闭合了 **vivid** 双样板波次（merchant + martial），并 handoff 推荐 P129。

P129 在 `tavern_hand` / `socialMomentum` 上完成了 **ordinary** 单样板扩展，产出 proof（`p129-ordinary-origin-visible-growth-sample-proof.md`）与窄回归（`tests/p129OrdinaryOriginVisibleGrowthTests.ts`）。

本 stage **不修改业务代码**，将 P122 + P127 + P129 三样板纳入同一 formal wave closure，更新 P128 遗留的「ordinary early visible growth OPEN」文档状态，文档化 farm/apprentice 继续 defer 的理由，并列出 Product End-State 仍 OPEN 的优先队列供后续 Discovery spawn。

## 2. Goals

- 逐条映射 P122 + P127 + P129 Goals → 已交付 proof / 测试证据（三样板 cross-sample reconciliation）
- 正式宣告 visible-growth **三样板波次**可闭合（vivid merchant + vivid martial + ordinary tavern_hand）
- 更新 P128 closure §3.2 文档漂移：ordinary early visible growth 由 P129 单样板 Met；farm/apprentice 标 **Defer**
- 文档化 `farm_peasant` / `town_apprentice` 平行样板 **继续 defer** 的成本与理由（P129 Non-Goals、P127 §14 停止扩展原则）
- 产出 P130 closure 报告，列出 North Star §3 / §8 仍 OPEN 项及建议下一功能 stage 主题（不由本 stage 实施）

## 3. Non-Goals

- 不修改 `src/`、`server/`、测试 harness 或任何运行逻辑
- 不实施 `farm_peasant` 或 `town_apprentice` 第二/第三 ordinary 可见成长样板
- 不实施 `scholar_house` 第三可见成长样板（继承 P128-004 defer）
- 不新增跨出身 visible-growth 模板抽象或通用框架
- 不开启技能系统、武功底层数值迁移、Wave 2–4 成就实现
- 不重开 P122 / P127 / P129 功能 stage
- 不运行全量 gate 刷新（仅引用既有 proof / 窄测试结果）

## 4. Delivery Mapping (Reference)

### P122 → merchant_house / businessHabit

| 要点 | 证据 |
| --- | --- |
| Signal A/B/C 可见确认 | `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` |
| 窄回归 | `tests/p122EarlyVisibleGrowthFeedbackTests.ts` |

### P127 → martial_family / trainingHabit

| 要点 | 证据 |
| --- | --- |
| Signal A/B/C + 8–16 承接可读 | `docs/test-reports/p127-martial-second-visible-growth-sample-proof.md` |
| Scope baseline | `docs/test-reports/p127-martial-visible-growth-sample-baseline.md` |
| 窄回归 | `tests/p127MartialSecondVisibleGrowthTests.ts` |

### P129 → tavern_hand / socialMomentum (ordinary)

| 要点 | 证据 |
| --- | --- |
| Signal A/B/C + 5–13 承接可读 | `docs/test-reports/p129-ordinary-origin-visible-growth-sample-proof.md` |
| Scope baseline | `docs/test-reports/p129-ordinary-origin-visible-growth-sample-baseline.md` |
| 窄回归 | `tests/p129OrdinaryOriginVisibleGrowthTests.ts` |

## 5. User Stories

### US-001: Lock Docs-Only Scope And Anti-Respawn Boundaries

**Description:** As a maintainer, I want P130 scope locked to documentation reconciliation before any work starts, so the stage does not respawn P129 tavern_hand implementation or open farm/apprentice parallel coding.

**Acceptance Criteria:**

- [ ] Stage is docs-only: no changes to `src/`, `server/`, test harness, or gameplay logic (PRD section 3 Non-Goals)
- [ ] Do not respawn or reopen P122, P127, or P129 functional stories
- [ ] Do not implement farm_peasant, town_apprentice, or scholar_house visible growth in this stage
- [ ] Cross-reference existing P122, P127, and P129 proof paths without duplicating runtime verification
- [ ] Typecheck passes

### US-002: Three-Sample Cross-Reconciliation Report

**Description:** As a maintainer, I want a reconciliation report mapping P122, P127, and P129 goals to delivered proof artifacts, so the three-sample visible-growth wave can be formally closed.

**Acceptance Criteria:**

- [ ] Map each P122 / P127 / P129 Goal to proof path and regression test pointer
- [ ] State cross-tier reusability claim: pattern proven on vivid origins (merchant + martial) **and** one ordinary origin (tavern_hand), not merchant-only or vivid-only patch
- [ ] Note P128 two-sample closure is superseded/extended by this three-sample closure (not contradicted)
- [ ] Save as `docs/test-reports/p130-visible-growth-three-sample-reconciliation.md`
- [ ] Typecheck passes

### US-003: Ordinary-Origin Defer Queue Update

**Description:** As a maintainer, I want the defer queue updated after P129 single-sample closure, so farm/apprentice parallel work does not silently respawn and P128 §3.2 doc drift is corrected.

**Acceptance Criteria:**

- [ ] Update defer queue: tavern_hand ordinary visible growth **Closed** (P129); farm_peasant and town_apprentice **Defer** with rationale
- [ ] Correct P128 closure §3.2 drift: early visible growth on ordinary origins is **Met** for single-sample proof scope; multi-origin parallel expansion remains defer
- [ ] Cite P127 §14 and P129 Non-Goals as stop-expansion rationale
- [ ] Document in `docs/test-reports/` (section in US-002 report or sibling artifact)
- [ ] Typecheck passes

### US-004: Farm/Apprentice Parallel-Sample Defer Rationale

**Description:** As a maintainer, I want an explicit defer note for farm_peasant and town_apprentice visible growth, so future Discovery does not assume P130 implies multi-origin ordinary batch implementation.

**Acceptance Criteria:**

- [ ] Document why farm_peasant and town_apprentice remain OUT OF SCOPE after three-sample closure (unclear/moderate habit axis, P129 Non-Goals, cost vs proof value)
- [ ] List optional preconditions that would justify a future second ordinary sample stage (if any), without committing to implementation
- [ ] Save as `docs/test-reports/p130-ordinary-origin-parallel-sample-defer-rationale.md`
- [ ] Typecheck passes

### US-005: End-State OPEN Queue And Handoff Recommendation

**Description:** As a maintainer, I want P130 closure to list North Star §3 / §8 still-OPEN items and recommend the next functional stage theme, so pipeline Discovery can spawn P131+ without re-auditing P122–P129.

**Acceptance Criteria:**

- [ ] Closure report lists at least: Wave 2–4 achievements, ordinary origins ≥3 **expansion** (not early visible growth), §6 replay proxy, §8 CLEAR checklist — all still OPEN at product level
- [ ] Recommend one highest-priority **functional** follow-up theme **other than** immediate second ordinary-origin visible-growth sample (e.g. Wave 2 pinnacle playable spine, Wave 1 jianghu lifetime readability, or Wave 4 midlife opportunity expansion) with evidence pointers — recommendation only
- [ ] Explicit non-recommendation: farm/apprentice parallel visible-growth samples (defer per US-004); scholar third sample (defer per P128-004)
- [ ] Save closure as `docs/test-reports/p130-visible-growth-wave-closure-report.md`
- [ ] Typecheck passes

## 6. Success Criteria

- 三样板（merchant + martial + tavern_hand）visible-growth 波次有正式 reconciliation 与 closure 报告
- P128 §3.2 doc drift corrected; farm/apprentice defer rationale可查
- 无业务代码改动；P122 / P127 / P129 回归证据被引用而非重复验证
- End-State OPEN 队列明确，不误导 Orchestrator 输出 `COMPLETED`

## 7. Verification Standard

- 产出物均为 `docs/test-reports/` 下 markdown
- 引用既有 `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts`、`p127MartialSecondVisibleGrowthTests.ts`、`p129OrdinaryOriginVisibleGrowthTests.ts` 结果（post-run PASS）
- 不要求浏览器实机矩阵

## 8. Dependencies / Context

- Parent: `docs/PRD/p129-wuxia-ordinary-origin-early-visible-growth-sample.md`
- Prior closure: `docs/test-reports/p128-visible-growth-wave-closure-report.md`
- Sibling proof: P122, P127, P129 proof artifacts
- End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3, §6, §8

## 9. Open Questions

- None blocking — farm/apprentice defer and next functional theme are documented in US-004 / US-005, not implemented here.
