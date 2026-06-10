# P24 Playtest Dimension Rules

Explicit playtest dimensions in scope for wuxia-life P24 calibration.

## Dimensions in scope

| ID | Label | Life phase | Combines |
|----|-------|------------|----------|
| `first_run_readability` | First-run readability | origin, childhood | Early prose clarity, origin legibility, first-choice comprehension |
| `onboarding_motivation` | Onboarding motivation | childhood, early_route | Momentum to continue after first session |
| `replay_distinctiveness` | Replay distinctiveness | early_route, midlife | Cross-run felt difference beyond content count |
| `route_differentiation` | Route differentiation | early_route, midlife | Path legibility and meaningful route contrast |
| `late_game_payoff` | Late-game payoff | midlife, legacy | Consequence weight and memorable stakes |
| `ending_aftertaste` | Ending aftertaste | legacy_endgame | Post-run resonance and closure distinctness |

## Calibration combination model

P24 judges player-facing quality by combining:

1. **First-run readability** — Can a new player understand what is happening and what matters in the opening?
2. **Replay desire** — Does a second run feel meaningfully different, not merely rerolled?
3. **Route distinction** — Can players articulate or feel different life paths?
4. **Consequence weight** — Do mid/late choices carry stakes that persist in memory?
5. **Ending aftertaste** — Does the run end with a distinct emotional residue?

Calibration combines these through:

- **Profile baselines** — stronger/weaker slice pairs per dimension with minimum score delta.
- **Playtest comparison samples** — machine-readable before/after across representative slices.
- **Alignment indicators** — detect when internal reports over- or under-estimate human experience.
- **RC evaluation** — release decisions require both internal health and external-facing scores.

## Scoring interpretation

- Scores are normalized 0–1 proxies wired through replay slices and existing P19/P20/P23 evidence.
- Human playtest feedback (when captured) takes precedence over internal proxy when alignment gap exceeds threshold.
- A dimension passes baseline calibration when stronger slice scores exceed weaker slice by `minimumScoreDelta`.

## Non-goals

- Replacing P23 internal experience acceptance (P24 extends with outward calibration layer)
- UI work or new theme content
- Runtime rewrite of narrative delivery
