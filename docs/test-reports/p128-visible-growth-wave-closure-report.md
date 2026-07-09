# P128 Visible Growth Wave Closure Report

**Date:** 2026-07-09  
**Branch:** `codex/p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation`  
**Story:** P128-005  
**Verdict:** **GO — 5/5 stories complete; visible-growth two-sample wave CLOSED; Product End-State remains OPEN**

---

## 1. Summary

P128 executed docs-only reconciliation after P127 — no runtime, UI, or test harness changes:

| Story | Deliverable | Result |
| --- | --- | --- |
| P128-001 | Scope contract | `p128-visible-growth-wave-scope-contract.md` |
| P128-002 | Cross-sample reconciliation | `p128-visible-growth-two-sample-reconciliation.md` |
| P128-003 | P126 defer queue update | Reconciliation §7 — martial **Closed**, scholar **Defer** |
| P128-004 | Scholar defer rationale | `p128-scholar-visible-growth-defer-rationale.md` |
| P128-005 | Closure + end-state handoff | This report |

**Wave closure:** The P122+P127 visible-growth two-sample wave (`merchant_house` + `martial_family`) is **formally closed**.

---

## 2. P128 Delivery Outcomes

| Success criterion (PRD §6) | Status |
| --- | --- |
| 双样板 reconciliation + closure 报告 | ✅ Met |
| P126 defer martial Closed / scholar Defer | ✅ Met |
| 无业务代码改动 | ✅ Met |
| End-State OPEN 队列明确 | ✅ Met (§3 below) |

**Regression evidence (referenced, not re-run):**

- `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts` — post-run PASS
- `npx tsx tests/p127MartialSecondVisibleGrowthTests.ts` — post-run PASS

---

## 3. North Star Still-OPEN Queue (Product End-State)

**Source:** `docs/designs/p25-lifetime-simulation-north-star.md` §3, §6, §8  
**Note:** P120 §8 Discovery CLEAR applies to a prior reconciliation slice. Product End-State below lists **remaining waves and expansions** that P128 does not implement and that block full North Star completion.

### 3.1 Wave 2–4 Achievements (§3) — OPEN

| Wave | Tier | Status | Evidence / gap |
| --- | --- | --- | --- |
| **Wave 1** | Mainstream (5 composite) | **Partial delivery** | P25 Wave 1 closed config + sim; `jianghu_renown_sage` playable spine P71–P81; `medical_sage_healer` P83–P93 |
| **Wave 2** | 巅峰成就 (pinnacle) | **OPEN** | §3.2 — luck + choice dual gate; sim trace exists (P35) but full playable spine coverage incomplete vs Wave 1 depth |
| **Wave 3** | 混合成就 (cross-track) | **OPEN** | §3.3 — `merchant_magnate` deferred; `healer_swordsman` trace only (P35); `merchant_martial_patron` P102–P112 closed but not full Wave 3 catalog |
| **Wave 4** | 平凡出身可信人生 | **OPEN** | §3.4 — P25 ordinary slice PASS (3 paths); **expansion** to full Wave 4 opportunity structure not delivered |

**P128 does not implement any Wave 2–4 achievement content.**

### 3.2 Ordinary Origins ≥3 Distinguishable Trajectories (§3.4 / §8 item 2) — OPEN at expansion level

| Field | Status |
| --- | --- |
| P25 static slice (3 ordinary paths) | **Met** — `docs/test-reports/p25-ordinary-origin-slice.md` |
| Wave 4 full expansion (更多平凡出身 + 机会结构) | **OPEN** — deferred across P39, P55, P120 |
| Early visible growth on ordinary origins | **OPEN** — P122/P127 cover vivid origins only; ordinary origins lack P122-style Signal A/B/C loop |

**Distinction:** §8 item 2 Met for Discovery slice; **product Wave 4 expansion + early-life readability on ordinary origins** remains OPEN.

### 3.3 §6 Replay Proxy — OPEN

**Source:** North Star §6 internal metrics proxy

| Proxy metric | Target | Current status |
| --- | --- | --- |
| ≥3 materially different full-lifetime trajectories (different origins + choices) | Required for replay motivation | **Partial** — P25 pathDivergenceProxy 0.250 post-rebalance; full multi-origin exhaust not continuous gate |
| Pinnacle unlock rate << mainstream; ≥80% failures attributable | Wave 2 readiness | **OPEN** — Wave 2 not fully playable |
| Cross-run high-value repeat event rate declining | P20 proxy | **Partial** — `gate:p20` PASS; long-horizon product metric not closed |

**P128 does not run simulation gate refresh.**

### 3.4 §8 CLEAR Checklist (full Product End-State) — OPEN

| §8 item | Discovery slice (P120) | Product End-State |
| --- | --- | --- |
| 1. 三类成就可玩样本 + 规则文档化 | Met (bounded samples) | **OPEN** — Wave 2–3 full catalog incomplete |
| 2. 平凡出身 ≥3 可区分轨迹 | Met (P25 slice) | **OPEN** — Wave 4 expansion |
| 3. 后果链零自相矛盾 | Met (P39+P120) | Met (maintain via gate) |
| 4. 模拟门禁巅峰/主流门槛 | Met (P25 baseline) | **OPEN** — post-Wave-2 validation pending |
| 5. gate:playability / gate:p20 不退化 | Met | Maintain — not Product COMPLETE |

**Orchestrator must NOT output Product `COMPLETED` based on P128 alone.**

---

## 4. Consolidated Defer Queue (Post-P128)

Inherited from P126 §7 + P128 updates:

| Item | Status | Notes |
| --- | --- | --- |
| 完整技能系统 | **Defer** | P121 Non-Goals |
| 武功底层数值大迁移 | **Defer** | P123–P125 display-only |
| 非 merchant 可见成长扩展 — martial | **Closed** | P127 + P128 reconciliation |
| 非 merchant 可见成长扩展 — scholar | **Defer** | `p128-scholar-visible-growth-defer-rationale.md` |
| `merchant_magnate` full spine | **Defer** | P97–P99 samples |
| ordinary-origin founding-patriarch overlays | **Defer** | P113 orthodox-only |
| P19 generic endgame integration | **Defer** | Lightweight echo preserved |
| Wave 2–4 achievement waves | **OPEN** | Product backlog |
| Wave 4 ordinary-origin expansion | **OPEN** | P25 slice only |

---

## 5. Recommended Next Functional Stage Theme

**Recommendation (highest priority): Wave 4 ordinary-origin early trajectory — visible growth on one ordinary origin**

### Why this theme

1. **Natural successor to P128:** P122/P127 closed visible growth on **vivid** origins (`merchant_house`, `martial_family`). P25 already proves 3 ordinary origins have distinct early/mid trajectories (`farm_peasant`, `town_apprentice`, `tavern_hand`) — but they lack P122-style Signal A/B/C confirmation.
2. **Higher strategic weight than scholar third sample:** P128-004 documents scholar defer; ordinary-origin early readability addresses Wave 4 §3.4 directly.
3. **Bounded single-sample execution model exists:** Reuse P122/P127 pattern (one origin, one habit axis, narrow proof + regression) — e.g. `tavern_hand` + existing social/service habit wiring from P59/P71 renown bridge chain.
4. **Does not respawn closed work:** Does not reopen P122 merchant, P127 martial, or P126 umbrella.

### Evidence pointers (recommendation only — no implementation)

| Pointer | Relevance |
| --- | --- |
| `docs/test-reports/p25-ordinary-origin-slice.md` | 3 ordinary paths with distinct early/mid flags — baseline for sample selection |
| `docs/test-reports/p59-tavern-hand-bridge-gap-audit.md` | Tavern ordinary origin early chain inventory |
| `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md` | Existing tavern_hand bridge wiring |
| `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` | Signal A/B/C pattern to replicate |
| `docs/PRD/p122-early-visible-growth-feedback-minimal-implementation.md` | Execution model reference |

### Alternative (lower priority for immediate spawn)

**Wave 1 `jianghu_renown_sage` lifetime readability gap** — P71–P81 spine closed; remaining gap is cross-stage polish and sim trace depth (`docs/test-reports/p27-habit-pool-audit-delta.md` notes full jianghu trace not P27 scope). Useful if product prioritizes Wave 1 mainstream completion over Wave 4 early-life expansion.

**Explicit non-recommendation:** Scholar third visible-growth sample — defer per P128-004. Unified cross-origin growth template — reject per P127 §14.

---

## 6. Stage Closure Status

| Prior stage | Status | P128 action |
| --- | --- | --- |
| P122 visible growth (merchant) | ✅ Closed | Cross-reference |
| P127 visible growth (martial) | ✅ Closed | Cross-reference |
| P128 reconciliation | ✅ Closed (5/5) | This report |

**No respawn. No business code changed.**

---

## 7. Discovery Handoff

| Field | Value |
| --- | --- |
| **Visible-growth wave** | **CLOSED** (two samples) |
| **Product End-State** | **OPEN** — see §3 |
| **Suggested P129+ theme** | Wave 4 ordinary-origin early trajectory (single sample) |
| **discovery-pass** | Run post-run on paired PRD before outer loop CLEAR |

---

**P128 complete. Visible-growth two-sample wave formally closed. Product End-State OPEN queue documented for P129+ Discovery spawn.**
