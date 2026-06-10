# P24 Measurable Versus Weakly Calibrated Experience Gaps Audit

Read-only audit of which player-facing surfaces are testable with human feedback, partially proxyable by internal reports, or still not meaningfully calibrated. No gameplay changes.

## Calibration class matrix

| Surface | Human feedback testable | Partially proxyable | Not meaningfully calibrated | Primary risk |
|---------|------------------------|---------------------|----------------------------|--------------|
| First-run readability | Yes — session notes, comprehension probes | P8 early-age survival, P16 origin agency | Prose clarity per origin | Internal gate passes while first events feel opaque |
| Onboarding motivation | Yes — continue/drop intent | P7 action palette breadth, P9 mandatory lane | Emotional momentum | Players quit before systems surface; metrics show "alive" |
| Replay distinctiveness | Partial — second-run interviews | P20 overlap decay, replay slices | Desire to start again | Content count rises without felt difference |
| Route differentiation | Partial — route recall tests | P11 route points, P20 pacing | Route tone and legibility | Scheduling health masks similar-feeling paths |
| Late-game payoff | Partial — stakes recall | P17/P23 consequence scores | Memorable weight | Flags and scores pass; moments feel flat |
| Ending aftertaste | Partial — post-run sentiment | P19 category + memory tone | Resonance and distinct closure | Category match without lasting impression |

## Internal pass / player fail risks

1. **Volume optimism** — P22 pool expansion and P23 acceptance baselines can improve while first-run readability stays weak.
2. **Metric self-validation** — P23 balance indicators measure internal structure; without playtest alignment they overestimate shippability.
3. **Age-40 ceiling** — P8 playability stops at 40; onboarding and ending calibration need explicit RC surfaces beyond playability gate.
4. **Report cleanliness bias** — cleaner internal reports mistaken for RC-quality improvement.
5. **Missing redirection evidence** — no structured sample where player feedback changes the preferred fix.

## Weakest evidence boundaries (P24 priority)

1. Internal-external alignment (no comparison surface today)
2. RC release judgment (implicit maintainer knowledge)
3. First-run and onboarding human-facing calibration
4. Outward appeal when internal health is strong (false-positive RC confidence)

## Deferred beyond P24

- Full player UI for in-game feedback capture
- Live telemetry from production builds
- Large-scale external playtest panel automation
- New theme or runtime rewrite for narrative delivery
