# PRD: P128 Wuxia Visible Growth Two-Sample Wave Closure Reconciliation

> **Derived from:** `docs/PRD/p127-wuxia-martial-second-visible-growth-sample.md` (Discovery pass 2026-07-09)
> **Stage slug:** `p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation`
> **Gaps addressed:** GAP-P126-D02, GAP-P127-C01 (formal wave closure), visible-growth defer handoff
> **Stage type:** docs-only reconciliation; no runtime or UI code changes

## 1. Introduction

P122 在 `merchant_house` / `businessHabit` 上证明了早期可见成长闭环。P127 在 `martial_family` / `trainingHabit` 上复用了同一模式，产出 proof 与窄回归（`p127-martial-second-visible-growth-sample-proof.md`、`tests/p127MartialSecondVisibleGrowthTests.ts`）。

P126 曾将「非 `merchant_house` 路线早期成长反馈模板化扩展」记入 defer。P127 闭合了其中 **martial** 分支；**scholar_house** 仍在 P127 Non-Goals，且 P127 §14 明确：两条样板已够证明可复用性时，应停止扩展并转向更高优先 backlog。

本 stage **不修改业务代码**，正式对账 P122+P127 双样板波次、闭合 P126 defer 的 martial 部分、文档化 scholar 继续 defer 的理由，并列出 Product End-State 仍 OPEN 的优先队列供后续 Discovery spawn。

## 2. Goals

- 逐条映射 P122 + P127 Goals → 已交付 proof / 测试证据
- 正式宣告 visible-growth 双样板波次可闭合（merchant + martial），满足「P122 非 merchant 特供」验收
- 文档化 `scholar_house` / `studyHabit` 第三样板 **继续 defer** 的成本与理由（P127 §3.3、§12）
- 更新 P126 defer queue：martial 扩展项标 **Closed**；scholar 标 **Defer** 并附 rationale
- 产出 P128 closure 报告，列出 North Star §3 / §8 仍 OPEN 项及建议下一功能 stage 主题（不由本 stage 实施）

## 3. Non-Goals

- 不修改 `src/`、`server/`、测试 harness 或任何运行逻辑
- 不实施 `scholar_house` 第三可见成长样板
- 不新增跨出身 visible-growth 模板抽象或通用框架
- 不开启技能系统、武功底层数值迁移、Wave 2–4 成就实现
- 不重开 P122 / P127 功能 stage
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

## 5. User Stories

### US-001: P122 + P127 Cross-Sample Reconciliation Report

**Description:** As a maintainer, I want a reconciliation report mapping P122 and P127 goals to delivered proof artifacts, so the two-sample visible-growth wave can be formally closed.

**Acceptance Criteria:**

- [ ] Report maps each P122 / P127 Goal to proof path and regression test pointer
- [ ] Explicitly states cross-origin reusability claim: pattern proven on merchant + martial, not merchant-only patch
- [ ] Save as `docs/test-reports/p128-visible-growth-two-sample-reconciliation.md`
- [ ] Typecheck passes (docs-only; no code change required)

### US-002: P126 Defer Queue Update For Visible-Growth Extension

**Description:** As a maintainer, I want the P126 defer item for non-merchant visible growth updated with martial closed and scholar deferred, so product backlog does not silently respawn P127 scope.

**Acceptance Criteria:**

- [ ] Update or cross-reference P126 defer queue: martial branch **Closed** (P127); scholar branch **Defer** with rationale
- [ ] Cite P127 §3.3 indirect `studyHabit` chain as cost reason; no respawn of P127 martial work
- [ ] Document saved under `docs/test-reports/` (section in US-001 report or sibling artifact)
- [ ] Typecheck passes

### US-003: Scholar Third-Sample Defer Rationale

**Description:** As a maintainer, I want an explicit defer note for scholar_house visible growth, so future Discovery does not assume P128 implies scholar implementation.

**Acceptance Criteria:**

- [ ] Document why scholar_house remains OUT OF SCOPE after two-sample closure (indirect habit chain, P127 Non-Goals, cost vs proof value)
- [ ] List preconditions that would justify a future scholar sample stage (if any), without committing to implementation
- [ ] Save as `docs/test-reports/p128-scholar-visible-growth-defer-rationale.md`
- [ ] Typecheck passes

### US-004: End-State OPEN Queue And Handoff Recommendation

**Description:** As a maintainer, I want P128 closure to list North Star §3 / §8 still-OPEN items and recommend the next functional stage theme, so pipeline Discovery can spawn P129+ without re-auditing P122–P127.

**Acceptance Criteria:**

- [ ] Closure report lists at least: Wave 2–4 achievements, ordinary origins ≥3, §6 replay proxy, §8 CLEAR checklist — all still OPEN
- [ ] Recommend one highest-priority **functional** follow-up theme (e.g. Wave 4 ordinary-origin early trajectory, or Wave 1 jianghu lifetime readability gap) with evidence pointers — recommendation only, no implementation
- [ ] Save closure as `docs/test-reports/p128-visible-growth-wave-closure-report.md`
- [ ] Typecheck passes

## 6. Success Criteria

- 双样板（merchant + martial）visible-growth 波次有正式 reconciliation 与 closure 报告
- P126 defer「非 merchant 模板化扩展」martial 分支标 Closed；scholar 标 Defer 且理由可查
- 无业务代码改动；P122 / P127 回归证据被引用而非重复验证
- End-State OPEN 队列明确，不误导 Orchestrator 输出 `COMPLETED`

## 7. Verification Standard

- 产出物均为 `docs/test-reports/` 下 markdown
- 引用既有 `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts` 与 `npx tsx tests/p127MartialSecondVisibleGrowthTests.ts` 结果（post-run 已 PASS）
- 不要求浏览器实机矩阵

## 8. Dependencies / Context

- Parent: `docs/PRD/p127-wuxia-martial-second-visible-growth-sample.md`
- Sibling proof: P122 targeted proof, P127 martial proof
- Defer source: `docs/test-reports/p126-p121-experience-optimization-closure-report.md` §7
- End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3, §6, §8

## 9. Open Questions

- None blocking — scholar defer and next functional theme are documented in US-003 / US-004, not implemented here.
