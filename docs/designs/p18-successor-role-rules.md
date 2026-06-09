# P18 Successor Role Rules (US-004)

## Shared Model

All successor types share:

- **Quality** (0–1): capacity to carry forward teachings, skills, or duties
- **Loyalty** (0–1): likelihood of continuity vs rupture
- **Instability** (0–1): betrayal, collapse, or incapacity risk
- **Inspectable signals**: flags + lifePath buckets + heritage stats

## Role Definitions

| Role | Definition | Primary signals | Distinct in P18 pass |
| --- | --- | --- | --- |
| **Disciple** | Non-kin martial/school successor | `lifePath.relationships.disciples`, `has_disciples`, teaching flags | Full cultivation cost + martial channel |
| **Heir** | Designated continuity holder (sect/family) | `heir_designated`, `sect_heir`, `family_heir` | Overlaps wealth + responsibility channels |
| **Offspring** | Biological children | `has_child`, `player.children`, `child_*` flags | Education path selects skill channel bias |
| **Adopted successor** | Non-blood inheriting student | `adopted_successor`, `inheriting_student` | Shares disciple channels; distinct loyalty baseline |
| **Inheriting student** | Late-life formal transmission target | `master_legacy`, `martial_transmission` | Highest martial channel weight |

## Overlap Rules (first P18 pass)

- **May overlap**: disciple + inheriting student (same martial channel); heir + offspring (family + responsibility)
- **Stay partially distinct**: adopted successor uses disciple cost model but lower default loyalty; heir adds responsibility channel without requiring martial quality

## Meaningful Quality / Capacity / Loyalty / Instability

- **Quality**: inferred from `martialHeritage`, `scholarlyHeritage`, cultivation flags, disciple count (capped)
- **Capacity**: quality × role weight from profile `SuccessorRoleConfig`
- **Loyalty**: reduced by unmet cultivation cost pressure and inherited vendetta without capability
- **Instability**: rises when burden channels active and quality below channel requirement
