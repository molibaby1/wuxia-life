# P32-006 Second Short-Chain Path — Skip Rationale

**Date:** 2026-06-24  
**Story:** P32-006  
**Decision:** **Skipped** — medical runtime short-chain not added

---

## Evidence for skip-first

| Criterion | Status | Evidence |
| --- | --- | --- |
| US-003 proves short-chain pattern | **Done** | Renown path: `runP32RenownShortChainSlice()` unlocks `jianghu_renown_sage` via JSON event chain |
| US-005 proves parity for all 3 bridges | **Done** | `testP32JsonResolverBridgeParity()` + `p32RuntimeParityTests.ts` cover renown + medical bridges at threshold |
| Medical achievement unlock at runtime | **Partial via parity** | JSON↔resolver aligned for `medical_pure` + `medical_divine_doctor_fame` at thresholds; P31 static fixtures remain 100% medical unlock |
| Risk of duplicate coverage | **Low add value** | Medical short-chain would repeat p27→p29 two-event pattern already validated by parity tests + P31 full-unlock fixtures |

---

## What would P32-006 add

A second short-chain slice (`p27_study_habit_healer_reinforcement` → `p29_study_habit_case_record_duty` → composite eval) would mirror the renown slice with two JSON events instead of one. Parity tests already prove each event's bridge output matches the resolver; renown slice proves the end-to-end **event-driven composite eval** pattern without static resolver.

---

## Deferred to future stage

- Full medical two-event runtime short-chain sim
- Habit zero birth→death lifetime sim (GAP-P31-003 carry-forward)
- `mentor_bond` / `medical_imperial` optional bridges (P31 defer)

---

## Verification (skip acceptance)

```bash
npm exec tsx tests/p32RuntimeParityTests.ts   # medical bridge parity at threshold
npm exec tsx tests/p25LifetimeSimulationTests.ts  # P31 medical full-unlock fixtures
```

Both pass on 2026-06-24.
