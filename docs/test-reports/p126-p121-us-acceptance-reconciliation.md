# P126 P121 User Story Acceptance Reconciliation

> **Stage:** P126 Wuxia P121 Experience Optimization Closure Reconciliation  
> **Date:** 2026-07-09  
> **Branch:** `codex/p126-wuxia-p121-experience-optimization-closure-reconciliation`  
> **Story:** P126-001  
> **Parent umbrella:** `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md`

## 1. Purpose

Map each P121 US-001~004 acceptance criterion to delivered stage evidence (P122, P94 pre-queue, P123, P124, P125). Per-criterion status: **Met**, **Partial**, or **N/A**. US-002 references P94 closure only — **no respawn recommendation**.

---

## 2. US-001 — Early Growth Feedback Visible → **P122**

| # | P121 AC | Stage | Evidence | Status | Rationale |
| --- | --- | --- | --- | --- | --- |
| 1 | ≥2 类早期成长确认信号（身份/倾向确认、能力或路线倾向确认） | P122 | `shapingSummary` (Signal A)、period settlement (Signal B)、long-term impact (Signal C) | **Met** | 三类信号覆盖 summary、结算、反馈三时间窗 |
| 2 | 成长确认玩家可见，不得只停留 hidden flag | P122 | `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` §Signal A/B/C | **Met** | 主屏 shapingSummary、periodSummaryDisplay、longTermImpactLines 均可读 |
| 3 | 服务于「去年和今年不一样」，非重复背景 flavor | P122 | Proof §8–12 continuation; copy 行为驱动（errand/apprentice → 营生 · 渐成） | **Met** | 文案与 businessHabit 阈值挂钩，区分背景叙述 |
| 4 | 不引入新系统层；复用表达/事件/样本链 | P122 | PRD Non-Goals; `tests/p122EarlyVisibleGrowthFeedbackTests.ts` scope guards | **Met** | 仅复用 habit/echo/flag 既有接线 |
| 5 | 至少 1 组可复核样本 | P122 | `merchant_house` 5–12; `tests/p122EarlyVisibleGrowthFeedbackTests.ts` | **Met** | 单路线窄样本已 proof + regression |

**US-001 aggregate:** **Met** (5/5)

---

## 3. US-002 — Merchant Adolescence Shaping Fork (10–15) → **P94 (pre-queue, read-only)**

> **Constraint:** P126 cross-references P94 closure only. **Do not respawn** merchant 10–15 fork stage.

| # | P121 AC | Stage | Evidence | Status | Rationale |
| --- | --- | --- | --- | --- | --- |
| 1 | 商贾 10–15 岁至少 1 个关键承担/分岔节点 | P94 | `hvg_merchant_post_fork_confirmation` (10–12), `hvg_merchant_first_responsibility_challenge` (13–15) | **Met** | 两节点连续覆盖 10–15 段 |
| 2 | 让玩家感到「准备成为什么样的商人」 | P94 | Closure report §1: track-specific confirmation + challenge copy | **Met** | ledger/caravan 分化可读 |
| 3 | 后果在后续表达/事件/阶段目标可读 | P94 | `sampleLineExpression.ts`, `playerFacingLabels.ts`; `merchant_talent_discovery` eligibility | **Met** | goal/cost label 与 track 承接 |
| 4 | 允许单关键节点 + 可读回响 | P94 | Closure report §2: two nodes feed forward without full multi-branch | **Met** | 符合 P121 最小节点口径 |
| 5 | 与 0–7 / 8–12 / 16+ 衔接明确 | P94 | `docs/test-reports/p94-merchant-10-15-growth-chain-closure-report.md` §1–2; P122 8–12 echo 承接 | **Met** | 早期 fork → 10–15 节点 → `merchant_talent_discovery` → `merchant_first_shop` |

**US-002 aggregate:** **Met** (5/5) — closed via pre-queue P94; **no respawn**

---

## 4. US-003 — Narrow Martial Display Axis → **P123 + P124 + P125**

| # | P121 AC | Stage | Evidence | Status | Rationale |
| --- | --- | --- | --- | --- | --- |
| 1 | 武学总读数 vs 细分属性职责边界 | P123, P125 | `mainScreenModel.ts` coreStats 收窄; P125 `功力·总读数` + 风格特长文案 | **Met** | 第一屏 + 完整页双层边界 |
| 2 | 明确主显 vs 背景细分 | P123 | `tests/mainScreenModel.test.ts` P123 guards: coreStats = `功力,银两` only | **Met** | 外功/内功/轻功/体魄从第一屏降级 |
| 3 | 展示职责收敛，不做底层大迁移 | P123–P125 | 各 stage PRD Non-Goals; no event/reward changes | **Met** | 仅 UI/摘要/文案层 |
| 4 | 调整后玩家仍能理解「哪里变强了」 | P123, P124 | martialPower 保留第一屏; tendencySummary 武路样本仍读出功力 | **Met** | 总读数 + 武路摘要不打废 |
| 5 | 非武路线获得更可见能力空间 | P123, P124 | P124 merchant sample: tendency 读出学识/经营/人脉; shaping 营生 · 渐成 | **Met** | 第一屏减负 + 摘要再平衡 |

**US-003 aggregate:** **Met** (5/5) — display-layer only per P121 intent

---

## 5. US-004 — Anti-Overdesign / Scope Minimal → **各 Stage 边界**

| # | P121 AC | Stage | Evidence | Status | Rationale |
| --- | --- | --- | --- | --- | --- |
| 1 | 不新增技能系统、熟练度树、专精树、第二成长面板 | P122–P125 | 各 stage PRD §Non-Goals; P122 scope guards | **Met** | 无新系统 noun |
| 2 | 新字段/表达须直接服务成长可感知性 | P122–P125 | P122 habit wiring; P123–P125 仅展示层 | **Met** | 全部映射三目标之一 |
| 3 | 任一改动映射回三项目标之一 | P122–P125 | P121 §4 delivery mapping; 各 prd.json scope-lock stories | **Met** | 成长显性 / 商贾青春期 / 武功主显 |
| 4 | 文档列出 defer 项防范围扩散 | P121 §8, P126 | `docs/PRD/p126-wuxia-p121-experience-optimization-closure-reconciliation.md` §8; closure report §7 | **Met** | P121 §8 继承 + P126 closure report §7 consolidated defer queue 已写入 |

**US-004 aggregate:** **Met** (4/4)

---

## 6. Cross-Stage Evidence Index

| P121 US | Delivery Stage(s) | Primary Artifacts | Regression |
| --- | --- | --- | --- |
| US-001 | P122 | `p122-early-visible-growth-feedback-targeted-proof.md` | `tests/p122EarlyVisibleGrowthFeedbackTests.ts` |
| US-002 | P94 (pre-queue) | `p94-merchant-10-15-growth-chain-closure-report.md` | `tests/p94MerchantGrowthChainTests.ts` |
| US-003 | P123 | PRD + `mainScreenModel.test.ts` P123 block | same |
| US-003 | P124 | PRD + `mainScreenModel.test.ts` P124 samples | same |
| US-003 | P125 | PRD + `mainScreenModel.test.ts` P125 block | same |
| US-004 | All | Stage PRD Non-Goals + scope-lock stories | — |

---

## 7. Reconciliation Summary

| P121 User Story | Delivery | Criteria Met | Partial | N/A | Verdict |
| --- | --- | --- | --- | --- | --- |
| US-001 | P122 | 5 | 0 | 0 | **Met** |
| US-002 | P94 | 5 | 0 | 0 | **Met** (pre-queue; no respawn) |
| US-003 | P123+P124+P125 | 5 | 0 | 0 | **Met** |
| US-004 | Stage boundaries | 4 | 0 | 0 | **Met** |

**Overall:** P121 US-001~004 acceptance criteria are **documented as Met** against delivered evidence. No criterion requires reopening P94 or spawning new functional stages.
