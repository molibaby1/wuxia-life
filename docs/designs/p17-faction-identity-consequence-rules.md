# P17 Faction And Identity Consequence Rules (US-005)

## Membership creates benefits and obligations

Faction/identity patterns use the same opportunity/risk tag model as relationships, with layers:

- **organization** — sect, guild, orthodox/unconventional membership.
- **social_status** — official, hero mantle, reputation tier.

## Balance target

| Dimension | Upside (opportunity tags) | Downside (risk tags) |
| --- | --- | --- |
| Protection | `faction`, `rescue`, `backing` | — |
| Access | `sect`, `official`, `resource` | — |
| Duty | — | `duty`, `obligation`, `sect` |
| Exposure | — | `political`, `exposure`, `reputation` |
| Rivalry | — | `conflict`, `feud`, `rivalry` |
| Political cost | — | `political`, `gray_judgment` |

Target ratio: every protective pattern should have a paired duty or exposure pattern reachable in the same affiliation family (not necessarily simultaneous).

## Kinship / sworn vs faction layer

- **First P17 pass**: sworn brotherhood and kinship stay on the **relationship** pattern layer (`has_sworn_siblings`, `mustProtect`).
- Faction layer covers `sect_faction`, `route_*` identity resolution, and official/hero status flags.
- Cross-layer stacking is allowed (e.g. orthodox member + sworn sibling) with multiplicative caps.

## Summary vs implicit

- Reports list active faction/identity patterns and kinds.
- Scheduling applies tag multipliers; route labels unchanged.

## Non-goals

- Full political simulation.
- Scheduler rewrite or per-theme branches in shared runtime.
