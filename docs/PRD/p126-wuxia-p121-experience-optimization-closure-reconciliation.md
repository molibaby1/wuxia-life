# PRD: P126 Wuxia P121 Experience Optimization Closure Reconciliation

> **Derived from:** `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md` (Discovery pass 2026-07-09)
> **Stage slug:** `p126-wuxia-p121-experience-optimization-closure-reconciliation`
> **Gaps addressed:** GAP-P121-N01 (missing formal umbrella closure after P122/P123/P124/P125)
> **Stage type:** docs-only reconciliation; no runtime or UI code changes

## 1. Introduction

P121 把体验优化收敛为三个最小方向（早期成长反馈、商贾 10–15 岁分岔、武功主显收敛）并附带 US-004 反过度设计约束。执行波次已分别交付：

| P121 方向 | User Story | 已交付 Stage | 状态 |
|-----------|------------|--------------|------|
| 早期成长反馈显性化 | US-001 | P122 | ✅ DONE |
| 商贾 10–15 岁关键分岔 | US-002 | P94（pre-queue） | ✅ DONE + closure report |
| 武功主显职责收敛 | US-003 | P123 + P124 + P125 | ✅ DONE |
| 反过度设计 / 范围边界 | US-004 | 各 stage 边界 | ✅ 已执行 |

但 P121 总纲仍缺 **formal closure**：`end_state_status: OPEN`。本阶段在 **不修改业务代码、不重开 P94、不 spawn 新功能 stage** 的前提下，产出对账报告、更新 test-reports、标记 defer 项，并给出 P121 umbrella 是否可宣告闭合的建议。

## 2. Goals

- 逐条映射 P121 US-001~004 与 Success Criteria → 已交付 stage 证据
- 明确 US-002 仅引用 P94 既有 closure，**禁止**重复 spawn 商贾 10–15 分岔功能 stage
- 为 P123/P124/P125 武功主显切片补齐或汇总 test-reports 证据（若尚无独立 closure artifact）
- 汇总 P122 早期成长反馈 proof 与 P94 商贾青春期链 proof 的对账结论
- 固化 P121 §8 Defer Queue，防止会话接力范围扩散
- 产出 P126 closure 报告，推荐 Discovery 对 P121 umbrella 输出 `end_state_status: CLEAR` 或保留 OPEN 的理由

## 3. Non-Goals

- 不修改 `src/`、`server/`、测试 harness 或任何运行逻辑
- 不 spawn 或重开 P94 商贾 10–15 分岔 stage
- 不新增 P122/P123/P124/P125 功能实现
- 不开启技能系统、多出身并行优化、武功底层数值迁移
- 不处理 P19 generic endgame、ordinary-origin overlays、Wave 4 扩展
- 不运行 gate 刷新（除非仅引用既有 latest gate 报告）

## 4. P121 Delivery Mapping (Reference)

### US-001 → P122

| P121 AC 要点 | P122 证据 |
|--------------|-----------|
| ≥2 类早期成长确认信号 | `shapingSummary`、period settlement、long-term impact（Signal A/B/C） |
| 玩家可见，非 hidden flag | `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` |
| 单路线可复核样本 | `merchant_house` 5–12，`tests/p122EarlyVisibleGrowthFeedbackTests.ts` |

### US-002 → P94（pre-queue，只读引用）

| P121 AC 要点 | P94 证据 |
|--------------|----------|
| 10–15 岁关键承担/分岔节点 | `hvg_merchant_post_fork_confirmation`、`hvg_merchant_first_responsibility_challenge` |
| 后果在后续可读 | ledger/caravan track → `merchant_talent_discovery` 承接 |
| 与 0–7 / 8–12 / 16+ 衔接 | `docs/test-reports/p94-merchant-10-15-growth-chain-closure-report.md` |

**Constraint:** P126 仅 cross-reference P94；不得 spawn 新 P94 等价 stage。

### US-003 → P123 + P124 + P125

| P121 AC 要点 | Stage | 证据 |
|--------------|-------|------|
| 武学总读数 vs 细分职责边界 | P123 第一屏收敛 | `mainScreenModel.ts` coreStats 收窄；`tests/mainScreenModel.test.ts` P123 guards |
| 非武路线摘要不被 martial 抢屏 | P124 tendencySummary 再平衡 | P124 sample states + regression in `mainScreenModel.test.ts` |
| 完整属性页解释层主次 | P125 full panel 文案/分组 | P125 hierarchy assertions in `mainScreenModel.test.ts` |

### US-004 → 各 Stage 边界

| P121 AC 要点 | 执行方式 |
|--------------|----------|
| 不新增技能/熟练度/第二成长面板 | P122/P123/P124/P125 PRD Non-Goals 均已声明 |
| 新字段/表达须映射三目标之一 | 各 stage scope lock stories（P122-001、P123-001 等） |
| 文档列出 defer 项 | P121 §8 + 本 stage US-004 |

## 5. User Stories

### US-001: P121 User Story Acceptance Reconciliation Report

**Description:** As a maintainer, I want a reconciliation report mapping each P121 US-001~004 acceptance criterion to delivered stage evidence, so the umbrella PRD can be formally closed without re-auditing every sub-stage.

**Acceptance Criteria:**

- [ ] Map all P121 US-001~004 AC bullets to stage IDs (P122, P94, P123, P124, P125) and evidence files
- [ ] State Met / Partial / N/A per AC with one-line rationale
- [ ] US-002 must reference P94 closure only; no respawn recommendation
- [ ] Save under `docs/test-reports/p126-p121-us-acceptance-reconciliation.md`
- [ ] Docs-only; no code changes

### US-002: P121 Success Criteria Assessment

**Description:** As a maintainer, I want explicit Met/Partial/Open assessment for each P121 Success Criteria after all delivery stages, so Discovery knows whether P121 umbrella may close.

**Acceptance Criteria:**

- [ ] Assess all four P121 Success Criteria (§5) with evidence links
- [ ] Incorporate P122 sample-route proof for early growth perception
- [ ] Incorporate P94 closure for merchant 10–15 gap
- [ ] Incorporate P123–P125 for martial display cognitive load
- [ ] Recommend `end_state_status: CLEAR` or document remaining OPEN items
- [ ] Save under `docs/test-reports/p126-p121-success-criteria-assessment.md`
- [ ] Docs-only; no code changes

### US-003: Cross-Stage Evidence Consolidation (Test Reports)

**Description:** As a maintainer, I want martial-display and growth-feedback evidence consolidated into test-reports, so P121 closure does not depend on scattered stage artifacts.

**Acceptance Criteria:**

- [ ] Produce or update `docs/test-reports/p126-martial-display-slice-closure-summary.md` covering P123/P124/P125 with pointers to `mainScreenModel.test.ts` guards
- [ ] Cross-reference existing P122 proof (`p122-early-visible-growth-feedback-targeted-proof.md`) without duplicating runtime verification
- [ ] Cross-reference P94 closure (`p94-merchant-10-15-growth-chain-closure-report.md`) without reopening P94 scope
- [ ] No new automated tests; no code changes
- [ ] Artifacts sufficient for A1-verify doc-only pass

### US-004: Write P126 Closure, Defer Queue, And P121 Umbrella Verdict

**Description:** As a maintainer, I want a closure note summarizing P126 reconciliation and listing what remains deferred at product level after P121 delivery wave.

**Acceptance Criteria:**

- [ ] Summarize US-001~003 reconciliation outcomes
- [ ] Confirm P94 US-002 is closed via pre-queue delivery; no respawn
- [ ] List consolidated defer queue from P121 §8 plus any new defer discovered during reconciliation
- [ ] State explicit P121 umbrella verdict: recommend CLEAR or document blocking OPEN items
- [ ] Save under `docs/test-reports/p126-p121-experience-optimization-closure-report.md`
- [ ] Docs-only; no code changes

## 6. Success Criteria

- P121 US-001~004 each have documented Met/Partial/N/A status with evidence
- P121 Success Criteria §5 assessed with explicit umbrella closure recommendation
- P94 referenced as US-002 closure; no duplicate merchant 10–15 stage spawned
- P123/P124/P125 evidence consolidated in test-reports without code diff
- Defer queue updated and P126 closure report exists

## 7. Dependencies / Context

- Parent umbrella: `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md`
- US-001 delivery: `docs/PRD/p122-early-visible-growth-feedback-minimal-implementation.md`, `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md`
- US-002 delivery (pre-queue): `docs/test-reports/p94-merchant-10-15-growth-chain-closure-report.md`
- US-003 delivery: `docs/PRD/p123-wuxia-main-screen-martial-primary-display-narrowing.md`, `docs/PRD/p124-wuxia-non-martial-tendency-summary-rebalancing.md`, `docs/PRD/p125-wuxia-full-stats-panel-martial-role-clarification.md`
- Prior end-state pattern: `docs/test-reports/p120-closure-report.md`
- Experience priority: `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`

## 8. Defer Queue (Inherited + Reconfirmed)

P126 不得消除以下 defer；仅文档化确认其仍 OUT OF SCOPE：

- 完整技能系统
- 武功底层数值大迁移
- 多出身并行早期重做
- `merchant_magnate` full spine 补齐
- ordinary-origin founding-patriarch overlays
- P19 generic endgame integration
- 非 `merchant_house` 路线的早期成长反馈模板化扩展

## 9. Open Questions (Resolved in P126 Delivery)

- ~~P121 Success Criteria #4 是否需额外 doc-only 论证~~ → **Resolved:** P122+P94 联合满足；见 `p126-p121-success-criteria-assessment.md` §SC-4
- ~~US-003 展示层是否标 Partial~~ → **Resolved:** 展示层满足 P121「优先做展示职责收敛」原文，标 **Met**

## 10. Recommendation

本 PRD 为 **纯文档 reconciliation stage**。P126 四故事已全部交付（2026-07-09）；Discovery 可输出 P121 umbrella `end_state_status: CLEAR`（见 `p126-p121-experience-optimization-closure-report.md`）。

**禁止动作：** 任何试图在本 stage 内重开 P94 或补写商贾 10–15 功能内容的 spawn。
