# P79 Validation Shape — Renown Late-Life Implementation

> **Date:** 2026-06-29
> **Source Stage:** P78 Renown Late-Life Design-First
> **Target Stage:** P79 Renown Late-Life Playable Implementation
> **Purpose:** Define what P79 must prove and what regressions must not break

---

## 1. Validation Philosophy

P79 is a bounded implementation stage (1 auto event + expression updates). Validation follows the established pattern:
- **Targeted proof** — show the chain works end-to-end for each branch
- **Narrow regression** — verify existing renown stages and merchant late-life don't break
- **No full lifetime exhaust** — focused verification only

---

## 2. Targeted Proof Chain Nodes

P79 targeted proof must show the full chain: payoff → late-life → expression changes.

### 2.1 Core Nodes (Must Have)

| # | Node | Verification | Branch Coverage |
|---|------|--------------|-----------------|
| 1 | Pre-late-life baseline (post-payoff) | Show state after payoff but before late-life: payoff flags set, payoff expression visible | All 3 branches (A/B/C) |
| 2 | Late-life event fires at age 52 | Verify event triggers correctly with right conditions | All 3 branches |
| 3 | Branch A: Burnout flags + stats | `renown_late_life_done` + `renown_late_life_identity_done` + `tavern_renown_late_burnout` set; stats match (rep+2, con+1, cha-1) | Branch A only |
| 4 | Branch B: Lone Wolf flags + stats | `renown_late_life_done` + `renown_late_life_identity_done` + `tavern_renown_late_lone_wolf` set; stats match (rep-1, con-2, cha+3) | Branch B only |
| 5 | Branch C: Mentor flags + stats | `renown_late_life_done` + `renown_late_life_identity_done` + `tavern_renown_late_mentor` set; stats match (rep+3, con+2, cha+2) | Branch C only |
| 6 | Cost label per branch | Sample line cost label updates correctly (油尽灯枯 / 逍遥自在 / 传承授业) | All 3 branches |
| 7 | Current goal per branch | Sample line + ordinary origin current goal updates correctly | All 3 branches |
| 8 | Late-life identity per branch | Late-life identity text shows correctly (deepens age-40 identity) | All 3 branches |

**Core total: 8 nodes × 3 branches coverage = ~14 verifications (some shared)**

### 2.2 Bonus Nodes (Nice to Have)

| # | Node | Verification |
|---|------|--------------|
| 9 | Life memory per branch | Ordinary origin life memory updates for each branch |
| 10 | Origin summary per branch | Ordinary origin summary updates for each branch |
| 11 | Full chain traceback | origin → bridge → on-ramp → pressure → payoff → late-life |
| 12 | Mutex with other lines | Late-life doesn't fire for merchant/orthodox/demonic |
| 13 | Branch matching guarantee | Late-life branch matches payoff choice (A→A, B→B, C→C) |
| 14 | Tavern-born flavor check | 10+ surfaces verified for tavern-born consistency |

**Bonus total: 6 nodes**

### 2.3 Proof Document Structure

Targeted proof document should include:
1. Executive summary
2. Core nodes verification (8 nodes)
3. Bonus nodes verification (6 nodes, if implemented)
4. Tavern-born flavor check
5. Distinction from merchant late-life
6. Late-life closure assessment

---

## 3. Regression Test Shape

### 3.1 Estimated Test Count
~20–25 tests across 6–7 groups

### 3.2 Test Groups

#### Group 1: Event Wiring (~4 tests)
- Late-life event exists in sample-lines-spine.json
- Event type is auto
- Age range is 52–56
- Trigger conditions match contract (upstream gate + exclusivity + mutex)

#### Group 2: Pre-Late-Life Baseline (~2 tests)
- Sample line detection works for post-payoff state
- Payoff cost label shows before late-life

#### Group 3: Branch A Post-Late-Life (~4 tests)
- Flags: `renown_late_life_done` + `tavern_renown_late_burnout`
- Stats match (rep+2, con+1, cha-1)
- Cost label: 油尽灯枯
- Current goal: 守住这一辈子的名声，撑到最后

#### Group 4: Branch B Post-Late-Life (~4 tests)
- Flags: `renown_late_life_done` + `tavern_renown_late_lone_wolf`
- Stats match (rep-1, con-2, cha+3)
- Cost label: 逍遥自在
- Current goal: 无牵无挂，过好剩下的日子

#### Group 5: Branch C Post-Late-Life (~4 tests)
- Flags: `renown_late_life_done` + `tavern_renown_late_mentor`
- Stats match (rep+3, con+2, cha+2)
- Cost label: 传承授业
- Current goal: 指点后辈，把这一辈子的人情世故传下去

#### Group 6: Distinct from Merchant (~2 tests)
- Renown late-life summary ≠ merchant late-life summary
- Renown late-life memory ≠ merchant late-life memory

#### Group 7: No Regression P71/P72/P73/P75/P77 (~5 tests)
- P71 bridge: bridge event still fires, flags still work
- P72 entry: entry differentiation still works
- P73 on-ramp: on-ramp event still fires, expression unchanged
- P75 pressure: pressure event still fires, expression unchanged
- P77 payoff: payoff event still fires, 3 choices still work

---

## 4. Closure Criteria for P79

P79 is considered closed when ALL of the following are met:

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Late-life event fires correctly with right conditions | Test Group 1 + proof node 2 |
| 2 | Three branches work correctly (A/B/C) | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 3 | Branch-specific flags set correctly (one per path) | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 4 | Stat changes correct per branch | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 5 | Cost label + current goal update per branch | Test Groups 3/4/5 + proof nodes 6/7 |
| 6 | Late-life identity deepens per branch | Proof node 8 |
| 7 | Tavern-born flavor consistent across all branches | Proof §14 (flavor check) |
| 8 | No P71/P72/P73/P75/P77 regressions | Test Group 7 + all prior suites pass |
| 9 | Typecheck passes | `npm run typecheck` exits 0 |

**Total: 9 closure criteria**

---

## 5. Regression Boundaries

### 5.1 Prior Renown Stages — Must Not Regress
- **P71 Bridge:** `ordinary_tavern_midlife_renown_bridge` event, `tavern_renown_bridge_crossed` flag, bridge expression
- **P72 Entry:** `detectSampleLine()` returns `'renown'`, entry-level cost label + current goal
- **P73 On-Ramp:** `renown_on_ramp` event, `renown_on_ramp_done` flag, on-ramp expression
- **P75 Pressure:** `renown_midlife_pressure` event, `renown_midlife_pressure_done` flag, pressure expression
- **P77 Payoff:** `renown_midlife_payoff` event, 3 choices, payoff expression

### 5.2 Other Sample Lines — Must Not Regress
- Merchant line: `magnate_on_ramp`, `merchant_midlife_debt_milestone`, `magnate_payoff`
- Orthodox line: orthodox childhood seed + age-25 + age-32 + age-45
- Demonic line: demonic childhood seed + age-40 + age-45

### 5.3 Guard Tests (If Available)
- `guard:sample-lines-baseline` — if this script exists and is relevant
- `p50SampleLineSpineTests` — baseline spine tests
- `p50SampleLineExpressionTests` — baseline expression tests

---

## 6. No Full Lifetime Exhaust Required

P79 does NOT require:
- Full lifetime simulation exhaust
- Multiple seed testing beyond targeted proof
- All combinations of stats/flags
- Playtesting or subjective quality assessment

P79 is a bounded implementation stage — targeted proof + narrow regression is sufficient.

---

## 7. Implementation → Validation Mapping

| P79 Story (Estimated) | Validation Focus |
|----------------------|-----------------|
| Wire late-life spine event | Group 1 (event wiring) + proof nodes 1–2 |
| Add late-life expression — sample line core | Groups 3/4/5 (cost label + current goal) + proof nodes 6–7 |
| Add late-life expression — late-life identity | Proof node 8 |
| Add late-life expression — ordinary origin bonus | Proof nodes 9–10 (life memory + summary) |
| Targeted proof document | All core + bonus proof nodes |
| Narrow regression tests | Groups 1–7 |
| Closure report | All 9 closure criteria |

---

*Validation shape defined. P78-005 passed.*
