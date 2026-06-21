# Youth Agency Stage-10 Matrix (US-004)

**Date:** 2026-06-22  
**PRD:** `docs/PRD/early-childhood-youth-agency-band-stage10.md`  
**Design:** `docs/designs/p16-stage-agency-rules.md` § Youth (13–20)

## Commands

```bash
npm exec tsx tests/youthAgencyStage10Tests.ts
npm exec tsx tests/lateChildhoodAgencyStage9Tests.ts
npm run gate:p16
```

## Matrix contract

| Dimension | Values |
| --- | --- |
| Origins | scholar, martial, merchant, frontier |
| Ages | 13–20 (inclusive) |
| Ticks per cell | 20 |

## Assertions

| Check | Target | Result |
| --- | --- | --- |
| All five `action_*_basic` same palette | **0** cells | **PASS** |
| Each cell ≥1 training/study (non-empty palette) | 100% | **PASS** |
| Each origin ≥1 cell with business/travel/socializing | 4/4 | **PASS** |
| 8–12 suppressed category bleed (regression) | **0** | **PASS** |
| Headless planning matrix | same rules | **PASS** |

## Implementation

- `resolveYouthActionPalette` in `src/p16/childhoodAgency.ts`
- `YOUTH_MAX_AGE = 20`; age >20 → `getMinimumActions()`
- Lite-first gradient; max 3 basics per palette

## Sample palette (static, age 16)

| Origin | Action ids |
| --- | --- |
| scholar | training/study/socializing/business/travel (lite + gradient basics) |
| martial | training + lite socializing/business/travel/study (floor scores) |
| merchant | business-weighted ordering |
| frontier | travel-weighted ordering |

**Decision:** **PASS** — youth moderate agency bar met; 8–12 Stage-9 contract preserved.
