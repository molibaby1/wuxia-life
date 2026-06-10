# v1.0 Launch Dimension Rules

Required launch dimensions for v1.0 release-candidate judgment.

## Dimensions in scope

| ID | Label | Launch contribution |
|----|-------|---------------------|
| `first_run_readability` | First-run readability | New player can understand opening stakes and first choices |
| `onboarding_motivation` | Early engagement | First session creates momentum to continue |
| `replay_distinctiveness` | Replay value | Second run feels meaningfully different |
| `route_differentiation` | Route clarity | Paths remain legible and distinct |
| `late_game_payoff` | Mid/late payoff | Consequences carry memorable weight |
| `ending_aftertaste` | Ending quality | Run ends with resonant closure |

## How dimensions compose launch readiness

1. **First-run** (`first_run_readability`, `onboarding_motivation`) — v1.0 must justify release before deep replay is discovered.
2. **Replay** (`replay_distinctiveness`, `route_differentiation`) — Launch exceeds one-run curiosity.
3. **Payoff** (`late_game_payoff`, `ending_aftertaste`) — Full-life arcs reward investment beyond onboarding.
4. **Technical stability** — Upstream playability, profile, and scheduling gates remain passing (not a playtest dimension but a hard constraint).

## Implementation wiring

Dimensions, baselines, and RC samples are implemented through profile-first playtest calibration surfaces (`WorldProfile.playtestDimensionConfigs`, etc.) and validated by `gate:v1-0` / `gate:p24`.

## Non-goals

- Replacing P23 internal acceptance (v1.0 adds outward launch layer)
- UI redesign or new theme content
