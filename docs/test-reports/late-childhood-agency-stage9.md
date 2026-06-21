# Late Childhood Agency — Stage-9 (US-002)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-late-childhood-agency-and-spine-stage9.md`  
**Baseline:** `docs/test-reports/early-childhood-stage9-baseline-audit.md`

## Change

`src/p16/childhoodAgency.ts` — for ages **8–12**, filter palette categories to **training + study** only (`LATE_CHILDHOOD_SUPPRESSED_CATEGORIES`: business, travel, socializing). Adult catalog ids remain blocked for all childhood. Demonic travel exception unchanged (ages 5–9 only).

## Matrix results

| Dimension | Coverage | Result |
| --- | --- | --- |
| Origins | scholar, martial, merchant, frontier | **PASS** |
| Ages | 8, 9, 10, 11, 12 | **PASS** |
| Ticks / cell | 20 | **PASS** |
| Suppressed action bleed | 0 (adult + lite category) | **PASS** |
| Allowlist present | ≥1 training or study per cell | **PASS** |

**Cells:** 4 × 5 × 20 = **400** palette checks + **400** headless `active_planning` checks.

### Post-fix palette (static)

| Origin | Ages 8–12 | ids |
| --- | --- | --- |
| scholar | 8–12 | `action_study_lite`, `action_childhood_training` |
| martial | 8–12 | `action_childhood_training` |
| merchant | 8–12 | `action_study_lite`, `action_childhood_training` |
| frontier | 8–12 | `action_childhood_training` |

No 8–9 vs 10–12 sub-band split (PRD §11 Q1 default).

## Commands

```bash
npm exec tsx tests/lateChildhoodAgencyStage9Tests.ts
npm exec tsx tests/p16OriginDestinyTests.ts
npm run gate:p16
npx tsc --noEmit
```

## Decision

**PASS** — 8–12 P16 agency guardrails hardened; 0 suppressed-category bleed in matrix.
