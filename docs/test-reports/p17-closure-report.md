# P17 Closure Report

Generated: 2026-06-08T11:30:04.108Z

## Before / After
- Relationship: Relationship flags and lifePath lists were summary-only; now profile patterns weight later-life opportunity/risk tags.
- Faction/identity: Faction membership unlocked events but lacked duty/exposure loops; organization and status patterns add sustained pressure.
- Achievement: High-tier achievements ended at prestige flags; maintenance patterns expose unmet pressure and decline risk.

## Implemented
- Relationship patterns: 5
- Faction/identity patterns: 7
- Maintenance patterns: 3
- Later-life wiring from age: 25

## Validation
- Ally changes opportunity: true
- Faction adds duty: true
- Achievement fragile when neglected: true
- P17 gate: pass
- gate:playability: pass (Warnings: 3 JSON: /Users/zhouyun/code/wuxia-life/docs/test-reports/p8-playability-gate-latest.json Markdown: /Users/zhouyun/code/wuxia-life/docs/test-reports/p8-playability-gate-latest.md)
- gate:p12-profile: pass (P12 profile gate decision: pass Wrote docs/test-reports/p12-profile-gate-latest.{json,md} Wrote docs/test-reports/p12-profile-smoke-latest.json)

## Non-goals
- No descendant or intergenerational gameplay
- No UI expansion for maintenance meters
- No second-theme feature pack
- No scheduler rewrite — extends getRouteSchedulingMultiplier only

# P17 Mid-Late-Life Consequence Gate

Generated: 2026-06-08T11:30:01.817Z
Decision: **pass**

## Coverage
- Relationship patterns: 5 (upside: social_shielding; burden: obligation, feud, entanglement)
- Faction/identity patterns: 7 (org: 3, status: 4)
- Achievement maintenance: 3 (dimensions: resources, internal_stability, reputation, external_threat, alliances, followers)

## Balance
- Relationship upside+burden: true
- Faction protection+duty: true
- Achievement prestige+upkeep: true

## Sample trajectories
- Sworn ally: multiplier=1.64; patterns=p17_sworn_shielding
- Feud enemy: risk=1.67; patterns=p17_feud_pressure
- Orthodox duty: risk=1.68; patterns=p17_orthodox_protection,p17_sect_duty_exposure
- Neglected hero upkeep: p17_hero_reputation_upkeep:reputation required=0.60 current=0.15 pressure=0.45; p17_hero_reputation_upkeep:external_threat required=0.45 current=0.16 pressure=0.29
