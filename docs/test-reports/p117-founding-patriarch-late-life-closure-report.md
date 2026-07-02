# P117 Founding Patriarch Late-Life Closure Report

> **Stage:** P117 Founding Patriarch Late-Life Playable Implementation
> **Date:** 2026-07-02
> **Branch:** `codex/p117-wuxia-founding-patriarch-late-life-playable-implementation`
> **Contract:** `docs/PRD/p116-founding-patriarch-late-life-contract.md`

---

## 1. Summary

P117 将 P116 late-life contract 落地为可玩 runtime：`founding_patriarch` 路线在 payoff 之后进入 auto late-life 阶段，按 P115 pressure marker（`rule_first` / `alliance_first`）分化为两条晚年分支，并更新 cost label、current goal、age-40 identity 表达。

---

## 2. Deliverables

| Area | Status | Evidence |
|------|--------|----------|
| Spine event wiring | ✅ | `founding_patriarch_late_life_rule_keeper` + `founding_patriarch_late_life_alliance_bearer` |
| Branch flags + sequencing | ✅ | Pressure-keyed markers, mutual exclusion, payoff gate |
| Expression updates | ✅ | `sampleLineExpression.ts` — late_life > payoff > pressure > on-ramp |
| Targeted proof | ✅ | `docs/test-reports/p117-founding-patriarch-late-life-targeted-proof.md` |
| Regression tests | ✅ | `tests/p117FoundingPatriarchLateLifeTests.ts` (R1–R30) |
| Closure report | ✅ | This document |

---

## 3. Event Wiring

| Field | Value |
|-------|-------|
| Event IDs | `founding_patriarch_late_life_rule_keeper`, `founding_patriarch_late_life_alliance_bearer` |
| Event record | `founding_patriarch_late_life` |
| Type | auto × 2 branches |
| Age range | 52–56 |
| Upstream gate | `founding_patriarch_payoff_done` + pressure marker |
| Checkpoints | `founding_patriarch_late_life_done`, `founding_patriarch_late_life_identity_done` |
| Branch A marker | `founding_patriarch_late_rule_keeper` (rule_first) |
| Branch B marker | `founding_patriarch_late_alliance_bearer` (alliance_first) |
| Endgame reserved | Does **not** set `founding_patriarch_endgame_echo_done` |

---

## 4. Expression Updates

| Signal | Branch A (rule_keeper) | Branch B (alliance_bearer) |
|--------|------------------------|----------------------------|
| Cost label | 门规守成之累 | 盟约续责之累 |
| Current goal | 守门规至终，治学师承不能断 | 守盟约至终，诸派续责不能推 |
| Identity | 门规守成的开宗祖师（scholar overlay 可用） | 盟约续责的开宗祖师（alliance overlay 可用） |

Priority: `late_life_done` > `payoff_done` > `midlife_pressure_done` > on-ramp.

---

## 5. Closure Criteria (12/12)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Late-life event fires as auto | Targeted proof nodes 10–11; R2 |
| C2 | All checkpoint flags set | R6–R7 |
| C3 | Branch marker traceable to pressure marker | R21 |
| C4 | Cost label updates per branch | R13, R15 |
| C5 | Current goal updates per branch | R14, R16 |
| C6 | Identity updates (minimum 1 branch) | R17, R18 |
| C7 | 开派治理风味一致 | 山门/书斋/门规/盟约 narrative in spine text |
| C8 | No P113/P115 regressions | R22–R23 |
| C9 | No P37/patron regressions | R24–R28 |
| C10 | Typecheck passes | `npm run typecheck` ✅ |
| C11 | Guard sample-lines-baseline | R29 ✅ |
| C12 | Endgame interfaces reserved | R10 |

**P117 late-life closed: 12/12.**

---

## 6. GO / NO-GO for P118+ Endgame Echo

### **GO** — Endgame echo stage (P118+) is justified

**Rationale:**
1. Late-life checkpoints and branch markers are wired and expression-differentiated
2. `founding_patriarch_endgame_echo_done` interface reserved and unused
3. Full chain on-ramp → pressure → payoff → late-life is proven
4. Patron P111/P112 endgame echo precedent exists for structural reference

---

## 7. Deferred Items

| Item | Deferred To |
|------|-------------|
| Full 2×3 pressure×payoff identity matrix | Post-P117 |
| Ordinary-origin founding-patriarch late-life expression | P117+ bonus |
| Stat threshold gates on late-life branches | Optional enhancement |
| Founding-patriarch endgame echo implementation | P118+ |
| Sect inheritance handoff markers | P118+ |
| Life memory / summary updates | P118+ |
| Full-lifetime `gate:p20` broad rerun | Far future |

---

## 8. Test Commands

```
npm run typecheck
npm exec tsx tests/p117FoundingPatriarchLateLifeTests.ts
npm exec tsx tests/p115FoundingPatriarchMidlifePressureTests.ts
npm exec tsx tests/p113FoundingPatriarchBridgeTests.ts
npm run guard:sample-lines-baseline
```

All pass at P117 closure.

---

## 9. Story Completion

| Story | Title | Status |
|-------|-------|--------|
| P117-001 | Wire founding-patriarch late-life spine event | ✅ |
| P117-002 | Add late-life branch flags and sequencing | ✅ |
| P117-003 | Add late-life player-facing expression updates | ✅ |
| P117-004 | Add targeted late-life proof | ✅ |
| P117-005 | Add narrow regression coverage | ✅ |
| P117-006 | Produce P117 closure report | ✅ |

---

**P117 complete. Handoff to P118+ endgame echo.**
