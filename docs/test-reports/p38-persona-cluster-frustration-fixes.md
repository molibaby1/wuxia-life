# P38 Persona-Cluster Frustration Fixes

**Date:** 2026-06-24  
**Story:** P38-003  
**Audit:** `docs/test-reports/p38-opaque-setback-root-cause-audit.md`

---

## Cluster 1 — Martial / social / training-heavy

**Personas:** p8-martial-lin, p8-social-gu  
**Primary opaque events:** `setback_injury` (6 combined opaque instances)

| eventId | Fix story | Explanation path |
| --- | --- | --- |
| `setback_injury` | P38-002 | `因用力过猛导致` → `explained`; `还有恢复之机` → recoverable hint |

**Residual after P38-002:** none for martial/social blocker personas.

---

## Cluster 2 — Wealth / deviant / property-risk

**Personas:** p8-wealth-shen, p8-deviant-ye  
**Primary opaque events:** `setback_property_loss` (3 combined opaque instances)

| eventId | Fix story | Explanation path |
| --- | --- | --- |
| `setback_property_loss` | P38-002 | `由于遭遇盗匪` + `导致` → `explained`; `还有机会补回` → recoverable hint |

**Residual after P38-002:** none for wealth/deviant blocker personas.

---

## Cluster 3 — Cautious / balanced / cultivation-risk

**Personas:** p8-cautious-han, p8-balanced-wei  
**Primary opaque events:** `setback_cultivation_deviation` (2 combined opaque instances); also `setback_injury` + `setback_property_loss` (P38-002)

| eventId | Fix story | Explanation path |
| --- | --- | --- |
| `setback_cultivation_deviation` | **P38-003** | `由于…导致` → `explained`; remove `危机` false trigger; `还有恢复之机` |
| `setback_injury` | P38-002 | explained |
| `setback_property_loss` | P38-002 | explained |

### setback_cultivation_deviation before/after

| | Text |
| --- | --- |
| **Before** | 修炼时心神不宁，你感到内息紊乱，一股邪念在心中滋长。这是每个武者都可能遇到的危机——走火入魔。 |
| **After** | 由于修炼时心神不宁，内息紊乱导致你险些走火入魔。暂停调息后还有恢复之机，切忌心浮气躁。 |
| **Expected classification** | `explained` |

---

## Cluster 4 — Social love-line (cross-cluster)

**Personas:** p8-martial-lin, p8-wealth-shen, p8-balanced-wei  
**Primary opaque events:** `love_secret_help` (3 instances)

| eventId | Fix story | Explanation path |
| --- | --- | --- |
| `love_secret_help` | P38-002 | Remove `危机` false-positive; `由于先前流言误会` → non-setback or explained |

---

## Passing persona regression guard

| Persona | Pre-P38 opaque ratio | Post-fix expectation |
| --- | --- | --- |
| p8-scholar-su | 0.00 | 0.00 (no narrative regression) |
| p8-explorer-lu | 0.00 | 0.00 (no narrative regression) |

Narrative edits are global template text only; no scheduler or persona routing changes. Passing personas retain zero setback samples in baseline gate age 0–40 window.

---

## Files changed (P38-003)

- `src/data/lines/setback-events.json` — `setback_cultivation_deviation`
