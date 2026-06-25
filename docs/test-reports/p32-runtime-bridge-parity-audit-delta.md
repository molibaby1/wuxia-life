# P32 Runtime Bridge Parity Audit Delta

**Date:** 2026-06-24  
**Branch:** `codex/p32-wuxia-wave1-habit-led-runtime-sim-parity`  
**Story:** P32-001  
**Baseline:** `docs/test-reports/p31-key-choice-bridge-audit-delta.md`, `docs/test-reports/p31-closure-report.md` §6

Read-only inventory of P31 JSON event `flag_set` bridge effects vs `resolveP31HabitLedKeyChoiceBridges` static resolver. No gameplay behavior changed in this story.

---

## 1. Bridge Inventory: JSON Events vs Static Resolver

| # | Event ID | Source | Positive choice | JSON `flag_set` (bridge) | Event condition (habit gate) | Resolver gate | Resolver bridge preconditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `p28_social_reputation_reinforcement` | `p22-content-expansions.json` | `attend_banquet` | `p28_social_reputation_reinforced`, **`ally_network`** | `lifeStates.socialMomentum >= 2` | `socialMomentum >= 2` | `p28_social_reputation_reinforced === true` |
| 2 | `p27_study_habit_healer_reinforcement` | `medical.json` | `顺势钻研医理` | `p27_study_healer_path`, **`medical_pure`**, `medical_talent` | `lifeStates.studyHabit >= 2` | `studyHabit >= 2` | `p27_study_healer_path === true` |
| 3 | `p29_study_habit_case_record_duty` | `medical.json` | `接下汇辑之责` | `p29_study_healer_case_duty`, **`medical_divine_doctor_fame`**, `medical_talent` | `studyHabit >= 3` **and** `flags.p27_study_healer_path == true` | `studyHabit >= 3` | `p27_study_healer_path === true` **and** `p29_study_healer_case_duty === true` |

**Resolver location:** `src/p25/p31HabitLedKeyChoiceBridges.ts`  
**Sim/fixture entry:** `resolveHabitLedFixtureFlags()` in `src/p25/validationSlices.ts`

---

## 2. Parity Classification

### 2.1 Aligned (threshold + precondition match)

| Bridge flag | Alignment | Notes |
| --- | --- | --- |
| `ally_network` | **Aligned at threshold** | Event condition `socialMomentum >= 2` matches resolver; positive choice sets bridge flag + precondition flag together |
| `medical_pure` | **Aligned at threshold** | Event condition `studyHabit >= 2` matches resolver; positive choice sets `p27_study_healer_path` + `medical_pure` atomically |
| `medical_divine_doctor_fame` | **Aligned at threshold + chain** | Event requires `p27_study_healer_path`; resolver requires same + `p29_study_healer_case_duty` from positive choice |

When player meets event eligibility and takes the positive choice, JSON `flag_set` outputs and resolver outputs **match** for all three bridge flags.

### 2.2 Parity Risks

| Risk ID | Type | Bridge(s) | JSON behavior | Resolver behavior | Severity | Event pointer |
| --- | --- | --- | --- | --- | --- | --- |
| P32-RISK-001 | **Threshold drift** | all 3 | Choice effects apply `flag_set` unconditionally once choice executes | Re-checks `lifeStates.*` threshold at sim time | **Low** | Event conditions gate eligibility; drift only if conditions and resolver thresholds diverge in future edits |
| P32-RISK-002 | **Precondition mismatch** | `medical_divine_doctor_fame` | Sets fame on positive choice only (event also gates `p27_study_healer_path`) | Requires both `p27_study_healer_path` and `p29_study_healer_case_duty` | **Low** | `medical.json` → `p29_study_habit_case_record_duty` choice 0 |
| P32-RISK-003 | **Poison mutex gap** | `ally_network`, `medical_pure`, `medical_divine_doctor_fame` | JSON choice effects **do not** check `medical_poison_path` | Resolver blocks all three when `medical_poison_path === true` | **Resolved (P33-002)** | Runtime JSON path in `applyEventChoiceFlagSets` now mirrors resolver mutex; raw game-engine JSON effects unchanged |
| P32-RISK-004 | **Direct vs derived unlock** | all 3 | Runtime applies bridge flags via event `flag_set` | P31 fixtures use resolver to derive flags from bridge preconditions only | **Monitor** | P31 static baseline 100% uses resolver; P32 short-chain must use event effects path |

---

## 3. P32 Parity Test Targets (P32-002)

| Case | Player state | Bridge flags (pre-choice) | Expected JSON vs resolver |
| --- | --- | --- | --- |
| Renown above threshold | `socialMomentum: 2` | `{}` → after positive choice | Both set `ally_network` + `p28_social_reputation_reinforced` |
| Renown below threshold | `socialMomentum: 1` | `{ p28_social_reputation_reinforced: true }` | Resolver: no `ally_network`; JSON event ineligible |
| Medical pure at 2 | `studyHabit: 2` | `{}` → after p27 positive | Both set `medical_pure` + `p27_study_healer_path` |
| Medical fame at 3 + chain | `studyHabit: 3`, `p27_study_healer_path: true` | after p29 positive | Both set `medical_divine_doctor_fame` |
| Medical fame below 3 | `studyHabit: 2`, chain flags set | — | Resolver: no fame; p29 event ineligible |
| Poison mutex | any above thresholds + `medical_poison_path: true` | bridge preconditions met | **Both block** — aligned via `applyEventChoiceFlagSets` + `comparePoisonMutexParity` (P33-002) |

---

## 4. Short-Chain Sim Target (P32-003)

Prefer **renown path** first (single-event bridge → composite eval):

| Step | Action | Outcome |
| --- | --- | --- |
| 1 | Seed player: `socialMomentum >= 2`, stat gates met, no achievement key_choice flags | Habit on-ramp ready |
| 2 | Apply `p28_social_reputation_reinforcement` positive choice effects | `ally_network` via JSON, not direct fixture seed |
| 3 | `evaluateCompositeDestinyOutcome('jianghu_renown_sage', …)` | Unlock without `resolveP31HabitLedKeyChoiceBridges` on fixture |

Medical path (optional P32-006): p27 positive → p29 positive → composite eval for `medical_sage_healer`.

---

## 5. P32 Story Wiring Order

| Priority | Story | Target |
| --- | --- | --- |
| 1 | P32-001 | This audit |
| 2 | P32-002 | JSON↔resolver parity tests (`p32BridgeParity.ts`) |
| 3 | P32-003 | Renown short-chain sim slice |
| 4 | P32-004 | Runtime sim baseline delta vs P31 static |
| 5 | P32-005 | Isolated regression asserts |
| 6 | P32-006 | **Skip-first** medical short-chain if parity + renown slice prove pattern |
| 7 | P32-007 | Closure report |

---

## 6. Verification

```bash
rg 'resolveP31HabitLedKeyChoiceBridges|ally_network|medical_pure|medical_divine_doctor_fame' src/p25/ src/data/lines/
```

Audit-only story — no test run required.

---

## 7. P33 Poison Mutex Resolution (P33-002)

**Decision:** Align runtime JSON path with resolver mutex in `applyEventChoiceFlagSets` (low-risk fix). Raw JSON `flag_set` effects in `medical.json` / `p22-content-expansions.json` remain unchanged; game engine direct application may still set bridge flags — monitor if full engine parity required.

**Automated gate:** `comparePoisonMutexParity()` asserts all 3 bridges block when `medical_poison_path === true`.

```bash
npm exec tsx tests/p32RuntimeParityTests.ts
npm exec tsx tests/p25LifetimeSimulationTests.ts
```
