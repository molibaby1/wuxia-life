# Trait-Line Spine Eligibility — Stage-7 (US-005)

**PRD:** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Date:** 2026-06-21T04:32:50.688Z  
**Decision:** **PASS**

## P22 audit fixes

| Event | Issue | Resolution |
| --- | --- | --- |
| `p22_origin_frontier_orphan` | Stage-6 removed `origin_poor_family` OR | Config: `origin_frontier` only ✅ |
| `p22_childhood_street_shaping` | `origin_streetborn` OR `p22_frontier_orphan_shaped` | **Guarded** by `isTraitLineSpineEligible`: street trait OR frontier primary + orphan successor ✅ |

## Config validation (age ≤ 12)

Extended `validateSpineOriginConfig` with `street_or_cross_origin` and `trait_line_ambiguous` kinds. Current catalog: **0 failures**.

## Street-line matrix (four-main × trait)

| Primary | Trait | Street-line eligible |
| --- | --- | --- |
| origin_scholar_family | none | no |
| origin_scholar_family | poor | no |
| origin_scholar_family | street | yes |
| origin_wuxia_family | none | no |
| origin_wuxia_family | poor | no |
| origin_wuxia_family | street | yes |
| origin_merchant_family | none | no |
| origin_merchant_family | poor | no |
| origin_merchant_family | street | yes |
| origin_frontier | none | no |
| origin_frontier | poor | no |
| origin_frontier | street | yes |

## Cross-trait bleed

- Cells with trait ≠ street and eligible=yes: **0** (target 0)
- Stage-6 scholar+poor orphan block: regression covered in test suite ✅

## Reproduce

```bash
npm exec tsx tests/traitLineSpineEligibilityTests.ts
npm exec tsx tests/spineOriginConfigValidationTests.ts
```
