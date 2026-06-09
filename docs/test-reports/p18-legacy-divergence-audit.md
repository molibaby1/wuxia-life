# P18 Late-Life Legacy Divergence Gap Audit (US-003)

Inventory of points where different cultivation and inheritance choices collapse into similar late-life endings.

## Low-Divergence Cases

| Case | Expected divergence | Current behavior | Fix layer |
| --- | --- | --- | --- |
| Invested disciple vs no disciples | Successor continuity vs void legacy | Disciple names in summary only | **runtime + config** |
| Child martial path vs child merchant path | Different heir capability mix | Flags differ; scheduling identical | **config** |
| High martialHeritage vs none | Ability transmission quality | Stat unused in selection | **runtime** |
| Hero reputation + weak heir | Personal triumph, fragile succession | P17 maintenance on hero only | **runtime + config** |
| Inherited vendetta + capable heir vs burden-only heir | Stable vs tragic succession | No heir-specific channel | **config + content** |
| Sect master with neglected disciples | Rupture / betrayal risk | Sect duty without cultivation pressure | **config** |
| Underinvestment in elderly teaching | Weakened legacy | Empty choice effects | **content + runtime** |

## Missing Or Weak Paths

| Path | Status | P18 target |
| --- | --- | --- |
| Betrayal / rupture succession | **missing** | `rupture_betrayal` legacy outcome pattern |
| Burden without capability | **missing** | `burden_without_capability` pattern |
| Network + obligation inheritance | **weak** | `network_obligation` channel pattern |
| Underinvestment weakening | **missing** | Cultivation cost unmet-pressure loop |
| Transcendence (successor exceeds master) | **missing** (deferred partial) | Transmission success at high intensity |

## Classification Summary

- **Config-only gaps**: channel polarity, role overlap rules, cost dimension thresholds
- **Content-only gaps**: empty elderly teaching effects, episodic legacy events
- **Runtime-bound gaps**: no successor quality score, no combined P17+P18 legacy multiplier

## P18 Focus

1. Wire successor cultivation + inheritance + cost into `getRouteSchedulingMultiplier` (age ≥ 25).
2. Add ≥3 materially different successor outcome patterns with inspectable reports.
3. Validation slices comparing trajectories with controlled cultivation/inheritance differences.

No gameplay changes in US-003.
