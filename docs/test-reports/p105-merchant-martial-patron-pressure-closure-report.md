# P105 Merchant Martial Patron Pressure Design-First — Closure Report

> **Date:** 2026-07-02
> **Stage:** P105 Wuxia Merchant Martial Patron Pressure Design-First
> **Branch:** `codex/p105-wuxia-merchant-martial-patron-pressure-design-first`
> **Status:** Complete — 6/6 user stories passed

---

## 1. Executive Summary

P105 successfully delivered the **design-first contract** for the `merchant_martial_patron`（商武一体金主）pressure stage. After this stage, the patron route has a clearly defined pressure direction, event structure, expression updates, and validation shape — all ready for P106 to implement.

**What was delivered:**
- 1 prerequisite audit (existing infrastructure mapped)
- 1 scope contract (design-only boundaries locked)
- 1 direction comparison (3 candidates evaluated, 1 selected)
- 1 pressure contract (护商武力负担 / Martial Backer Burden)
- 1 P106 validation shape (targeted proof + regression boundaries)
- 1 closure report (this document)

**Selected direction:** 护商武力负担 (Martial Backer Burden)
- 商武一体风味：5/5
- Boundedness：5/5
- Implementation risk：Low
- Natural extension of on-ramp（盟约 → 盟约负担兑现）

**Scope discipline:** Strictly design-first — 6/6 stories are documentation-only. Zero runtime code changes. Zero scope creep.

**GO / NO-GO:** **GO** — pressure 阶段值得进入 P106 implementation。

---

## 2. Stage Outputs Summary

### 2.1 Prerequisite Audit (P105-001)

**Document:** `docs/test-reports/p105-merchant-martial-patron-pressure-prerequisite-audit.md`

**Key findings:**
- P102–P104 foundation verified: native + 3 bridge-origin paths all reach `merchant_patron_on_ramp_done`
- 12+ flags/markers identified; `merchant_patron_on_ramp_done` is direct upstream gate
- 3 expression surfaces (goal / cost label / identity) with 5 variant branches
- 2 spine events in place: entry (choice) + payoff echo (auto)
- Gap confirmed: no pressure event between age 34–38 entry and age 48–52 payoff
- Magnate + renown pressure precedents available as reference patterns

### 2.2 Scope Contract (P105-002)

**Document:** `docs/test-reports/p105-merchant-martial-patron-pressure-scope-contract.md`

**Allowed layers (4):** audit, compare, contract, shape

**Forbidden expansions (14):** runtime wiring, P102–P104 rewrite, magnate spine rewrite, payoff redesign, new UI, stat validation, full lifetime exhaust, etc.

**Red line:** No runtime code changes under `src/`.

### 2.3 Pressure Direction Comparison (P105-003)

**Document:** `docs/test-reports/p105-merchant-martial-patron-pressure-direction-comparison.md`

| Candidate | Verdict | Score |
|-----------|---------|-------|
| A — 护商武力负担 | **Selected** | 5/5 fit, 5/5 bounded |
| B — 门派人情债 | Rejected | Renown overlap |
| C — 商武身份撕裂 | Deferred | Too large for pressure small-step |

### 2.4 Pressure Contract (P105-004)

**Document:** `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`

**Core specification:**

| Element | Value |
|---------|-------|
| Event ID | `merchant_patron_midlife_pressure` |
| Type | Choice (+ 6 variant branches + generic fallback) |
| Age band | 40–44 |
| Upstream gate | `merchant_patron_on_ramp_done` |
| Checkpoint | `merchant_patron_midlife_pressure_done` |
| Variant markers | `merchant_patron_pressure_orthodox/martial/apprentice/tavern/peasant/generic` |
| Expression signals | Cost label 深化 + current goal 更新 (× 6 variants) |

### 2.5 P106 Validation Shape (P105-005)

**Document:** `docs/test-reports/p105-p106-validation-shape.md`

- 5 core proof nodes (pre-pressure → event → checkpoint → 2 expressions)
- ~19–22 regression assertions across 6 groups
- 11 closure criteria
- Regression guard: P102–P104 patron + P97–P101 magnate
- No full lifetime exhaust required

---

## 3. Gaps Closed in P105

| Gap ID | Description | Resolution |
|--------|-------------|------------|
| GAP-P104-N01 | No pressure spine event | Contract defines `merchant_patron_midlife_pressure` |
| GAP-P104-N02 | No pressure checkpoint flag | Contract defines `merchant_patron_midlife_pressure_done` |
| GAP-P105-01 | No pressure expression design | Contract defines 2 signals × 6 variants |
| GAP-P105-02 | No validation shape | P106 validation shape document |

---

## 4. Boundary With P106

### 4.1 P105 Delivers (Design)

| Deliverable | P106 Uses As |
|-------------|--------------|
| Selected direction | Implementation north star — no re-selection |
| Event spec | Spine JSON wiring blueprint |
| Flag / gate table | Exact flags to set and check |
| Expression update table | Exact text changes per variant |
| Validation shape | Proof + test + closure criteria |

### 4.2 P106 Must Implement (Runtime)

| Item | Source |
|------|--------|
| `merchant_patron_midlife_pressure` in `sample-lines-spine.json` | Contract §3 |
| Expression branches in `sampleLineExpression.ts` | Contract §4 |
| New test file (e.g. `p106MerchantMartialPatronPressureTests.ts`) | Validation shape §3 |
| Targeted proof document | Validation shape §2 |
| Optional: payoff echo gate adjustment | Contract §6.2 |

### 4.3 P106 Must NOT Do

- Re-select pressure direction
- Rewrite P102–P104 bridge entry
- Rewrite magnate spine
- Expand into patron mid/late-life or full Wave 3 graph

---

## 5. Deferred Items (Out of P105/P106)

| Item | Reason | Target |
|------|--------|--------|
| Patron mid/late-life differentiation | Beyond pressure scope | P107+ |
| Patron endgame echo deepening (beyond P93 lightweight) | Payoff stage work | P107+ |
| 商武身份撕裂 pressure narrative | Deferred from direction comparison | Mid/late-life |
| Full Wave 3 mixed-achievement graph | Bounded stage | Roadmap |
| North Star §8 broader waves | Out of scope | Roadmap |
| Full-lifetime `gate:p20` broad rerun | Out of scope | Roadmap |
| Stat threshold gates | Enhancement defer | P106 optional |
| Ordinary origin expression for patron | Patron currently sample-line only | P106 bonus |

---

## 6. GO / NO-GO Assessment

### 6.1 GO Rationale

| Criterion | Assessment |
|-----------|------------|
| Upstream foundation solid | ✅ P102–P104 all paths reach on-ramp |
| Direction unambiguous | ✅ 护商武力负担 selected with clear rejection rationale |
| Contract complete | ✅ Event, flags, expressions, gates all specified |
| Validation shape fixed | ✅ P106 knows what "done" means |
| Implementation bounded | ✅ 1 event + expression + tests — small-step |
| Flavor distinct | ✅ vs magnate (金钱债) and renown (人情债) |
| Non-regression plan clear | ✅ P102–P104 + magnate tests as guard |

### 6.2 Verdict

**GO — Proceed to P106 playable pressure implementation.**

Pressure 阶段填补了 patron 路线 on-ramp → payoff echo 之间的叙事空白，实施面 bounded（1 spine event + 2 expression functions + ~20 tests），且与现有 magnate pressure 模式对称，实施风险低。

---

## 7. Artifact Index

| Artifact | Path | Story |
|----------|------|-------|
| PRD | `docs/PRD/p105-wuxia-merchant-martial-patron-pressure-design-first.md` | — |
| Ralph JSON | `docs/PRD/p105-wuxia-merchant-martial-patron-pressure-design-first.prd.json` | — |
| Prerequisite audit | `docs/test-reports/p105-merchant-martial-patron-pressure-prerequisite-audit.md` | P105-001 |
| Scope contract | `docs/test-reports/p105-merchant-martial-patron-pressure-scope-contract.md` | P105-002 |
| Direction comparison | `docs/test-reports/p105-merchant-martial-patron-pressure-direction-comparison.md` | P105-003 |
| Pressure contract | `docs/PRD/p105-merchant-martial-patron-pressure-contract.md` | P105-004 |
| P106 validation shape | `docs/test-reports/p105-p106-validation-shape.md` | P105-005 |
| Closure report | `docs/test-reports/p105-merchant-martial-patron-pressure-closure-report.md` | P105-006 |

---

## 8. Story Completion Matrix

| Story | Title | Priority | Status |
|-------|-------|----------|--------|
| P105-001 | Audit patron pressure prerequisites | 1 | ✅ Pass |
| P105-002 | Lock P105 scope contract | 2 | ✅ Pass |
| P105-003 | Compare patron pressure directions | 3 | ✅ Pass |
| P105-004 | Define patron pressure contract | 4 | ✅ Pass |
| P105-005 | Define P106 validation shape | 5 | ✅ Pass |
| P105-006 | Produce P105 closure report | 6 | ✅ Pass |

**Verification:** `npm run typecheck` passes on all commits. Zero `src/` changes across P105.

---

## 9. Handoff to P106

P106 should start by reading (in order):
1. `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`
2. `docs/test-reports/p105-p106-validation-shape.md`
3. `docs/test-reports/p105-merchant-martial-patron-pressure-prerequisite-audit.md`

No direction re-selection or scope clarification needed. Implement contract as specified.

---

**P105-006 complete. P105 stage closed.**
