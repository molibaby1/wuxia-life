# P19 Late-Life Callback And Closure Surface Audit (US-002)

Read-only inventory of pre-endgame recovery for relationships, vendettas, faction ties, inheritance, and obligations.

## Scope

- P17 `relationshipConsequencePatterns`, `factionIdentityConsequencePatterns`, `achievementMaintenancePatterns`
- P18 `successorRoleConfigs`, `inheritanceChannelPatterns`, `legacyOutcomePatterns`
- `elderly-legacy.json`, `elderlyEvents.json`, `inheritance.json`
- `lifePath.relationships`, `lifePath.commitments.swornEnemies`, `mustProtect`

## Closure Surface Inventory

| Surface | Dimension | Classification | Pre-endgame recovery? |
| --- | --- | --- | --- |
| P17 relationship patterns | ally/enemy/feud/obligation | **partially config-driven** | Scheduling risk/opportunity; no explicit reconciliation line |
| P17 faction patterns | protection/exposure/duty | **partially config-driven** | Same — no collapse/reward closure typing |
| P17 achievement maintenance | post-hero neglect | **partially config-driven** | Unmet pressure in report; not final summary |
| P18 inheritance channels | asset/burden/mixed | **partially config-driven** | Successor outcome space; not protagonist closure |
| P18 legacy outcomes | transmission/rupture | **partially config-driven** | Report-only for scheduling |
| `elderly-legacy.json` | teaching/heir choices | **content-only** | Sets flags; no recovery kind taxonomy |
| `swornEnemies` lifePath | vendetta | **runtime-bound** | Listed in memory; no resolution arc typing |
| Sect duty flags | faction obligation | **content-only** | Event one-offs |

## Collapse Patterns

1. **Major arcs end at flag** — `inheritance_legacy_complete`, feud flags persist without reconciliatory vs retributive closure.
2. **No recovery kind dimension** — Config cannot express reconciliation/reward vs collapse/retribution on the same axis.
3. **Implicit-only consequences** — P17/P18 multipliers change weights but produce no inspectable recovery output for tests/reports.
4. **Relationship-only samples** — Elderly content skews personal legacy; faction and obligation closure underrepresented.

## P19 Priority (pre-endgame recovery)

1. `preEndgameRecoveryPatterns` with dimension + recoveryKind.
2. Resolver producing `PreEndgameRecoveryReport` with explicit summary lines where configured.
3. At least one sample each: relationship/vendetta, faction/social-position, legacy/succession.
4. Wire multiplier into late-life path alongside P17/P18.

No gameplay changes in US-002.
