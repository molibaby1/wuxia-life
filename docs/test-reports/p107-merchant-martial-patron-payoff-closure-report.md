# P107 Merchant Martial Patron Payoff Closure Report

> **Stage:** P107 Patron Payoff Design-First Contract
> **Date:** 2026-07-02
> **Branch:** `codex/p107-wuxia-merchant-martial-patron-payoff-design-first`
> **Contract:** `docs/PRD/p107-merchant-martial-patron-payoff-contract.md`

---

## 1. Summary

P107 delivers the design-first **商武撕裂之解** contract for `merchant_martial_patron` payoff: prerequisite audit, scope boundary, direction comparison (choice-based selected), payoff contract, P108 validation shape, and handoff — strictly docs-only per P76/P105 precedent.

---

## 2. Deliverables

| Story | Deliverable | Status |
| ----- | ----------- | ------ |
| P107-001 | Prerequisite audit | ✅ |
| P107-002 | Scope contract | ✅ |
| P107-003 | Payoff direction comparison | ✅ |
| P107-004 | Payoff contract | ✅ |
| P107-005 | P108 validation shape | ✅ |
| P107-006 | This closure report | ✅ |

---

## 3. Key Design Decisions (LOCKED)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payoff mode | **Choice-based** | 差异化 magnate auto；对称 renown choice 结构 |
| Core question | 商武撕裂怎么解？ | P105 §6.3 + P106 pressure 因果链 |
| Option A | 硬扛盟约 — `merchant_patron_payoff_covenant_holder` | 悲剧英雄，盟约绑紧 |
| Option B | 撕破盟约 — `merchant_patron_payoff_covenant_breaker` | 反英雄，断武从商 |
| Option C | 商武平衡 — `merchant_patron_payoff_balancer` | 中庸智者，新盟新矩 |
| Event ID | 升级 `merchant_patron_payoff_echo` auto → choice | 保持 spine 连续；P108 bump v2.0.0 |
| Upstream gate | `merchant_patron_midlife_pressure_done` | P106 已接线 |
| New flags | `payoff_resolved` + 3 choice markers | P106 预留接口落地 |
| Age band | 48–52 | 保持 P102 echo |

---

## 4. Closure Criteria

| # | Criterion | Status |
|---|-----------|--------|
| C1 | Prerequisite audit from real gating surfaces | ✅ |
| C2 | Scope contract locked (docs only) | ✅ |
| C3 | Direction comparison with recommendation | ✅ Choice-based |
| C4 | Payoff contract unambiguous | ✅ LOCKED |
| C5 | P108 validation shape fixed | ✅ 12 closure criteria defined |
| C6 | Zero runtime changes | ✅ No `src/` changes |
| C7 | Typecheck passes | ✅ |

**7/7 design-first closure criteria satisfied.**

---

## 5. Boundary with P108

**In scope (P108):**
- Upgrade `merchant_patron_payoff_echo` from auto to choice (3 branches)
- Wire `merchant_patron_payoff_resolved` + 3 choice markers
- Update `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`, `merchantAge40Identity()` per payoff choice
- Targeted proof (3 choice paths + 1 bridge-origin)
- Regression tests per validation shape §3
- Update P102 chain proof payoff nodes for choice behavior

**Out of scope (P108):**
- P106 pressure rewrite
- Late-life / endgame design (P109+)
- Ordinary origin patron expression (defer)
- Stat threshold gates (optional enhancement)
- Full 5×3 entry×payoff identity matrix
- New UI / framework

---

## 6. Deferred Larger Patron-Expansion Items

| Item | Defer To | Notes |
|------|----------|-------|
| Patron late-life stage | P109+ | Reads payoff choice markers |
| Patron endgame echo deepening | P110+ | After late-life |
| Full entry×payoff identity matrix (5×3) | P109+ or incremental | P108 minimum: 1 native + 1 bridge per choice |
| Ordinary origin patron expression | P108 bonus / defer | Not blocking payoff closed |
| Stat threshold gates | P108 optional | Loose gate sufficient |
| Full Wave 3 mixed-achievement graph | Roadmap | Beyond bounded stages |
| Cross-route interactions | Roadmap | patron × renown etc. |

---

## 7. GO / NO-GO for Payoff Implementation

**Recommendation: GO**

Rationale:
- Pressure → payoff chain is wired and proven (P106 gate requires pressure checkpoint)
- Payoff direction is locked with 3 distinct choice identities
- P108 validation shape exists with explicit closure criteria
- No regressions risk to closed stages if P108 follows contract
- Reserved flags (`payoff_resolved`, `late_life_done`) are named and scoped

---

## 8. Artifact Index

| Artifact | Path |
|----------|------|
| Prerequisite audit | `docs/test-reports/p107-merchant-martial-patron-payoff-prerequisite-audit.md` |
| Scope contract | `docs/test-reports/p107-merchant-martial-patron-payoff-scope-contract.md` |
| Direction comparison | `docs/test-reports/p107-merchant-martial-patron-payoff-direction-comparison.md` |
| Payoff contract | `docs/PRD/p107-merchant-martial-patron-payoff-contract.md` |
| P108 validation shape | `docs/test-reports/p107-p108-validation-shape.md` |
| PRD | `docs/PRD/p107-wuxia-merchant-martial-patron-payoff-design-first.md` |
| Ralph JSON | `docs/PRD/p107-wuxia-merchant-martial-patron-payoff-design-first.prd.json` |

---

## 9. Test Evidence

```
npm run typecheck → pass (doc-only stage; no runtime changes)
```

---

**P107 payoff design-first stage: CLOSED. P108 payoff implementation: GO.**
