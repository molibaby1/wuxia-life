# P18 Inheritance Scope And Burden Rules (US-005)

## In Scope (P18)

| Channel | Asset expression | Burden expression |
| --- | --- | --- |
| Martial teachings | `martialHeritage`, transmission flags → opportunity on `legacy`, `training` | Weak transmission → `decline` risk |
| Technical skills | `scholarlyHeritage`, `child_scholar` | Obsolete skill burden (low quality heir) |
| Social capital | `connections`, `influence` → `backing`, `family` | Network obligation → `duty`, `exposure` |
| Wealth/industry | `merchantNetwork`, `wealth` → `resource` | Estate upkeep → `duty` |
| Reputation | `reputation`, hero mantle → `prestige` | Backlash inherited → `backlash` |
| Vendettas | (none as asset) | `swornEnemies`, `inherited_vendetta` → `feud`, `conflict` |
| Responsibilities | Protected access → `sect`, `family` | `mustProtect`, sect heir duty → `obligation` |

## Deferred Beyond P18

- Per-NPC successor simulation with individual stats
- Multi-generation playable descendants
- UI for inheritance ledger
- Cross-theme legacy packs

## Explicit vs Implicit Effects

| Effect | Visibility |
| --- | --- |
| Active inheritance channel patterns | Explicit in `LaterLifeLegacyReport` |
| Succession quality score | Explicit in reports/gates |
| Opportunity/risk multipliers | Implicit in scheduling; explicit in debug reports |
| Summary signal strings | Explicit in life-memory hooks |

## Polarity Rule

Every channel pattern declares `asset`, `burden`, or `mixed`. Burden channels must increase risk tags or reduce succession quality when active without matching capability.
