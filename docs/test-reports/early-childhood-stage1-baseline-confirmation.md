# Stage-1 Baseline Confirmation Audit (US-001)

**PRD:** `docs/PRD/early-childhood-opening-experience-governance.md`  
**Branch:** `ralph/early-childhood-opening-experience-governance`  
**Date:** 2026-06-20  
**Scope:** Read-only confirmation that Stage-1 agency mechanisms are wired as designed. No gameplay behavior changes.

## Summary

| Check | Result | Evidence |
| --- | --- | --- |
| `shouldOfferDailyPlanning(age)` false for 0–4, true from 5 | **PASS** | `src/p16/childhoodAgency.ts`; repro command below |
| `SessionPhase` includes `passive_progression` / `period_summary` | **PASS** | `src/contracts/sessionProgression.ts` L22–29 |
| `ProgressionAckKind` includes `passive_continue` / `period_summary` | **PASS** | `src/contracts/sessionProgression.ts` L56–61 |
| Headless phase routing for infant/preschool | **PASS** | `HeadlessEngineSessionImpl.getSessionPhase()` L515–527 |
| Infant band stat clamps (chivalry/internalSkill/martialPower) | **PASS** | `src/core/activePlanning/ageActionStatCaps.ts` |
| Typecheck | **PASS** | `npx tsc --noEmit` exit 0 |

**Verdict:** Stage-1 baseline confirmed. Safe to proceed with US-002 gate regression.

---

## 1. Daily planning age gate

**Source:** `src/p16/childhoodAgency.ts`

```typescript
export const DAILY_PLANNING_MIN_AGE = 5;
export function shouldOfferDailyPlanning(age: number): boolean {
  if (age > CHILDHOOD_MAX_AGE) return true;
  return age >= DAILY_PLANNING_MIN_AGE;
}
```

**Repro:**

```bash
npm exec -- tsx -e "
import { shouldOfferDailyPlanning, DAILY_PLANNING_MIN_AGE } from './src/p16/childhoodAgency.ts';
for (let age = 0; age <= 13; age++) {
  console.log('age', age, 'shouldOfferDailyPlanning=', shouldOfferDailyPlanning(age));
}
"
```

**Observed (2026-06-20):**

| Age | `shouldOfferDailyPlanning` |
| --- | --- |
| 0–4 | `false` |
| 5–12 | `true` (childhood band) |
| 13+ | `true` (adult band) |

**Related:** `resolveChildhoodActionPalette` returns `[]` when `!shouldOfferDailyPlanning(age)` (L134–136), ensuring `planningOptions.length === 0` for ages 0–4.

---

## 2. Session phase & ack kinds

**Source:** `src/contracts/sessionProgression.ts`

- `SessionPhase`: `'passive_progression' | 'period_summary'` present in union (L22–29).
- `ProgressionAckKind`: `'passive_continue' | 'period_summary'` present (L56–61).

**Headless routing:** `src/headless/session/HeadlessEngineSessionImpl.ts`

- `getSessionPhase()`: when `!shouldOfferDailyPlanning(age)` → `'passive_progression'` (L524–525).
- `pendingPeriodSummary` → `'period_summary'` (L517).
- `acknowledgeProgression('passive_continue')` requires `passive_progression` phase (L648–652).
- `acknowledgeProgression('period_summary')` requires `period_summary` phase (L658–660).

**API / UI wiring (spot-check, no changes):**

- `src/composables/useApiGameEngine.ts` maps phases to ack kinds.
- `src/App.vue` renders non-empty nodes for `passive_progression` / `period_summary`.
- `src/components/GameScreen.vue` period-summary card when `apiSessionPhase === 'period_summary'`.

---

## 3. Infant band stat clamps

**Source:** `src/core/activePlanning/ageActionStatCaps.ts`

- `INFANT_MAX_AGE = 2` (imported from `childhoodAgency.ts`).
- Age ≤ 2: only `constitution`, `comprehension`, `health` allowed; |Δ| ≤ 1 per stat.
- Ages 3–7: `chivalry`, `internalSkill`, `martialPower` stripped via `EARLY_FORBIDDEN_STATS`.

**Repro:**

```bash
npm exec -- tsx -e "
import { clampActionDeltasForAge } from './src/core/activePlanning/ageActionStatCaps.ts';
console.log('infant', clampActionDeltasForAge(1, { chivalry: 5, internalSkill: 3, martialPower: 2, constitution: 2, health: -1 }));
console.log('preschool', clampActionDeltasForAge(4, { chivalry: 5, internalSkill: 3, martialPower: 2, constitution: 2 }));
"
```

**Observed:**

- Age 1 input `{ chivalry: 5, internalSkill: 3, martialPower: 2, constitution: 2, health: -1 }` → `{ constitution: 1, health: -1 }` (forbidden stats dropped, Δ capped).
- Age 4 same input → `{ constitution: 2 }` (martial/chivalry/internal stripped).

**Consumers:** `ActionResultResolver.ts` (active actions), `HeadlessEngineSessionImpl.executePassiveChildhoodTick`, `useNewGameEngine.ts`.

---

## 4. Validation commands run

```bash
npx tsc --noEmit   # exit 0
```

---

## 5. Stage-2 touchpoints for downstream stories

| Story | Surfaces confirmed here |
| --- | --- |
| US-002 | Gates exercise headless passive path + p16OriginDestiny infant assertions |
| US-003 | Browser playtest targets ages 3–4 passive + age-4 `childhood_preference` spine |
| US-004 | Origin-tagged passive selection in `infantPassiveNarratives.ts` / `selectPassiveNarrative` |

---

**Auditor:** Ralph A2 executor (automated read-only audit)  
**Gameplay changes:** None
