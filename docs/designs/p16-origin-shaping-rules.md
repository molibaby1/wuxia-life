# P16 Origin-Shaping Design Rules (US-004)

How origin influences upbringing and later tendencies without full determinism.

## Origin Influence Dimensions

| Dimension | Childhood effect | Later tendency |
|-----------|------------------|----------------|
| Hardship tolerance | More hardship events weighted when `hardshipExposure` high | `endurance` tendency |
| Discipline | Guidance quality shapes structured routines | `discipline` tendency |
| Family obligation | Low resources → survival-weighted events | `ambition` + `caution` |
| Learning access | High guidance → study-biased childhood pool | `discipline`, knowledge growth |
| Early worldview | Social capital shapes family/social daily events | `empathy`, `socialEase` |
| Regional background | Neutral tags (`urban`, `frontier`, `rural`) bias exposure tags | Route pressure signals |

## Recognizable but Not Deterministic

- Each origin applies **event weight multipliers** (±40% band) not hard event locks.
- Two lives with the same origin can diverge on daily draws and rare lines.
- Initial stat modifiers remain explicit; tendency shaping accumulates gradually.

## Explicit vs Implicit Outputs

| Effect | Visibility |
|--------|------------|
| Initial stats / money | **Explicit** — player stats |
| Origin name in age-40 summary | **Explicit** — `summarySignals.origin` |
| Childhood event weight shifts | **Implicit** in play; **explicit** in P16 reports |
| Tendency accumulation (`discipline`, `endurance`, …) | **Inspectable** via shaping report / echo suffix |
| Composite destiny progress | **Explicit** in gate artifacts |

## Config Authority

- All origin resource and shaping fields live in `WorldProfile.originSurfaces` (profile-first).
- Runtime reads surfaces through `getOriginSurfaceForPlayer()` — no wuxia-specific branching in shared evaluators.
- TraitSystem `origins.ts` remains compatible; profile surfaces extend (not replace) trait biases.

## Shaping Payoff

Childhood experiences map to tendencies via `childhoodShapingRules` config:

- High hardship + survival events → `endurance` increment
- Guidance-heavy study events → `discipline` increment
- Social family events → `empathy` / `socialEase`

Surfaced in later callbacks through echo summary variables (`tendency_suffix`) when thresholds met.
