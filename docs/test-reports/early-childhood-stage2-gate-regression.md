# Stage-2 Gate Regression (US-002)

**PRD:** `docs/PRD/early-childhood-opening-experience-governance.md`  
**Branch:** `ralph/early-childhood-opening-experience-governance`  
**Date:** 2026-06-20  
**Depends on:** US-001 baseline confirmation

## Summary

| Gate / test | Command | Exit | Result |
| --- | --- | --- | --- |
| P16 gate | `npm run gate:p16` | 0 | **pass** |
| P7.2 session phase | `npm exec tsx tests/headless/p72SessionPhase.test.ts` | 0 | **ok** (infant `passive_progression` included) |
| P16 origin destiny | `npm exec tsx tests/p16OriginDestinyTests.ts` | 0 | **passed** |
| P9 playability chain | `npm exec tsx tests/p9PlayabilityTests.ts` | 0 | **passed** |
| P8 playability gate | `npm run gate:playability` | 0 | **PASS**, 0 blockers |
| Typecheck | `npx tsc --noEmit` | 0 | clean |

**Verdict:** All Stage-2 regression gates green after Stage-1 passive childhood.

---

## P16 gate

```
P16 gate decision: pass
Wrote docs/test-reports/p16-gate-latest.{json,md}
```

---

## P7.2 session phase (infant passive)

```
p72SessionPhase.test.ts: ok
```

Infant case: age 1 → `passive_progression`; `passive_continue` / `period_summary` ack cycle verified.

---

## P16 + P9 tests

Direct suite runs (preferred over full `npm run test`, which also executes unrelated suites such as `p11SchedulingTests`):

```bash
npm exec tsx tests/p16OriginDestinyTests.ts   # ✔ passed
npm exec tsx tests/p9PlayabilityTests.ts      # P9 tests passed
```

---

## P8 playability gate

- **Decision:** PASS  
- **Blockers:** 0  
- **Warnings:** 10 (causality ×1, pacing ×8, replayability near-duplicate ×1 bucket)  
- **Near-duplicate pairs:** 2 (`p8-scholar-su ~ p8-wealth-shen`, `p8-explorer-lu ~ p8-balanced-wei`)  
- **Baseline:** Matches freshly written `p8-playability-gate-latest.json`; P9 `assertWarningCountMaintainsOrImproves` passed — no baseline inflation required.

### Early narrative samples (0–4 passive verified)

Persona Early lines now show spine + passive framing, **not** 0-year three-action planning:

| Persona | Early narrative sample |
| --- | --- |
| p8-martial-lin | 1岁 出身背景；4岁 童年选择；5岁 主动玩耍练功 |
| p8-scholar-su | 1岁 出身背景；4岁 童年选择；5岁 主动与玩伴相处 |
| p8-social-gu | 1岁 出身背景；4岁 童年选择；5岁 主动玩耍练功 |
| p8-wealth-shen | 1岁 出身背景；4岁 童年选择；5岁 主动与玩伴相处 |

Ages 0–4: no daily planning three-choice in samples; lite planning starts at age 5 (`DAILY_PLANNING_MIN_AGE`).

Artifacts: `docs/test-reports/p8-playability-gate-latest.{md,json}`

---

## P9 near-duplicate note

Passive childhood increased shared early-life beats across personas; current near-duplicate count (2 pairs) **equals** post-gate baseline. No baseline file adjustment — P9 triage asserts maintain-or-improve policy satisfied.

If overlap rises in future Stage-3/4 content work, prefer passive narrative dedup before raising baseline (per PRD §10).

---

**No gameplay code changes in this story.**
