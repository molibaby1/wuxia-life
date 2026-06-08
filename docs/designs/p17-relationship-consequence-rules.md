# P17 Relationship Consequence Loop Rules (US-004)

## Loop model

Long-term relationship consequences are **profile patterns** activated by flags and/or `lifePath` signals. Each active pattern contributes:

- **Opportunity tags** — boost formal-event weights (aid, access, shielding).
- **Risk tags** — boost setback / feud / obligation events (burden, entanglement, betrayal).

Intensity scales with `baseIntensity` (0–1) and optional lifePath counts (e.g. sworn enemy list length).

## Relationship types

| Type | Activation signals | Upside loop | Burden loop |
| --- | --- | --- | --- |
| Ally / sworn | `has_sworn_siblings`, allies list | `support`, `social_shielding` on `relationship`, `rescue` | `obligation`, `entanglement` on `duty`, `faction` |
| Mentor | `has_mentor`, mentors list | `support` on `training`, `comprehension` | `obligation` on `duty`, `mentor_debt` |
| Kinship | spouse, children, `mustProtect` | `social_shielding` on `family` | `obligation` on `family`, `duty` |
| Enemy / feud | `swornEnemies`, enemies list | — | `feud`, `betrayal_risk` on `conflict`, `revenge` |
| Life debt | `has_life_debt` | — | `obligation`, `entanglement` on `debt`, `duty` |

## Summary vs implicit

- **Explicit in summary/report**: active pattern ids, consequence kind, intensity, triggered flags.
- **Implicit in weighting**: per-tag multipliers applied in later-life selection (age ≥ 25); players feel through event mix, not numeric HUD.

## Meaningful pressure (P17 bar)

- **Aid**: measurable opportunity-tag boost ≥ 1.15× vs baseline without pattern.
- **Burden**: risk-tag boost ≥ 1.2× or opportunity suppression on competing tags.
- **Protection**: shielding reduces `conflict` / `feud` risk weights when ally pattern active.
- **Betrayal / feud**: enemy patterns raise `conflict`, `revenge`, `betrayal` tags.
- **Obligation / entanglement**: positive ties still raise `duty` and `debt` risk tags.

## Non-goals (relationship)

- Per-NPC dialogue simulation.
- Descendant or intergenerational kinship.
- UI relationship graph redesign.
