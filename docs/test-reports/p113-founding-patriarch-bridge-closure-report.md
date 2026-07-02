# P113 Founding Patriarch Bridge Closure Report

> **Date:** 2026-07-02  
> **Stage:** P113 Wuxia Founding Patriarch Bridge (Narrow Playable)  
> **Branch:** `codex/p113-wuxia-founding-patriarch-bridge-narrow-playable`  
> **Gaps addressed:** GAP-P112-N01, GAP-NS8-02

---

## 1. Executive Summary

P113 closed the **narrow playable bridge** from scholar/faction commitment (`p16_scholar_mentor` + `p22_faction_continuation_active`/`p16_alliance_brokered`) into `founding_patriarch` checkpoint flags with player-facing differentiation on the orthodox sample line. P37 lifetime traces and P102–P112 patron spine were not reopened.

**Result:** ✅ Bounded founding-patriarch bridge sample is runtime-reachable via sample-line spine.

---

## 2. What P113 Proves

| Claim | Evidence |
| ----- | -------- |
| Founding-patriarch bridge entry is spine-wired | `founding_patriarch_bridge_entry` in `sample-lines-spine.json` |
| Entry reads P22/P37 prerequisite flags | Gate: scholar mentor + faction continuation/alliance |
| Entry sets checkpoint flags | `founding_patriarch_bridge_crossed`, `founding_patriarch_on_ramp_done`, variant markers |
| Lightweight payoff echo | `founding_patriarch_payoff_echo` (choice v2.0.0, age 48–52, P93 pattern) |
| Player-facing differentiation | `orthodoxCurrentGoal`, `orthodoxAge40Identity`, `deriveSampleLineCostLabel` founding-patriarch branches |
| P37 non-regression | `p37AdditionalMixedPinnacleParityTests` pass |
| Patron non-regression | P102–P112 patron tests pass |
| Regression harness | `tests/p113FoundingPatriarchBridgeTests.ts` (8 assertion groups) |

---

## 3. Wiring Summary

### 3.1 Spine events

| Event | Age | Type | Terminal flags |
| ----- | --- | ---- | -------------- |
| `founding_patriarch_bridge_entry` | 32–38 | choice (2 variants) | `founding_patriarch_bridge_crossed`, `founding_patriarch_on_ramp_done` |
| `founding_patriarch_payoff_echo` | 48–52 | choice v2.0.0 | `founding_patriarch_payoff_done`, `founding_patriarch_identity_done` |

### 3.2 Expression surfaces

| Surface | Founding patriarch signal | Generic orthodox | Renown on-ramp |
| ------- | ------------------------- | ---------------- | -------------- |
| `orthodoxCurrentGoal` | 开宗立派 / payoff choice goal | 行侠守义 / 守正 | 江湖名号 / 引荐主事 |
| `deriveSampleLineCostLabel` | 开派盟约之累 / payoff 之累/之快 | 守正代价 | renown line cost |
| `orthodoxAge40Identity` | 开派苗子 / payoff identity | 正派武者 | renown identity |

---

## 4. Verification

| Check | Result |
| ----- | ------ |
| `npm run typecheck` | ✅ Pass |
| `tests/p113FoundingPatriarchBridgeTests.ts` | ✅ Pass (8 groups) |
| `tests/p37AdditionalMixedPinnacleParityTests.ts` | ✅ Pass |
| P102–P112 patron tests | ✅ Pass |
| `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 5. What Remains Deferred

| Item | Rationale |
| ---- | --------- |
| Full faction empire graph / multi-event pinnacle arc | PRD non-goal |
| Midlife pressure chain between entry and payoff | Narrow playable scope |
| Ordinary-origin founding-patriarch bridges | Out of scope for P113 |
| P37 `founding_patriarch` lifetime trace rewrite | Prior stage closed |
| Full North Star §8 Wave 2 pinnacle content wave | Out of scope |
| Full-lifetime `gate:p20` broad rerun | Bounded sample only |
| `jianghu_myth_legend` pinnacle expansion | P35 closed |

---

## 6. P113 vs Adjacent Stages

P113 **does not** modify P37 lifetime slices, P35 myth-legend traces, renown endgame (P79–P81), or P102–P112 patron spine events. Founding-patriarch bridge is an additive parallel sample aligned with P37 `founding_patriarch` traceability evidence (`p16_scholar_mentor` + `p16_alliance_brokered`).

---

## 7. Deliverables

| Story | Artifact |
| ----- | -------- |
| P113-001 | `docs/test-reports/p113-founding-patriarch-bridge-gap-audit.md` |
| P113-002 | `docs/test-reports/p113-founding-patriarch-bridge-scope-contract.md` |
| P113-003/004 | `sample-lines-spine.json`, `sampleLineExpression.ts` |
| P113-005 | `tests/p113FoundingPatriarchBridgeTests.ts`, chain proof |
| P113-006 | This closure report |
