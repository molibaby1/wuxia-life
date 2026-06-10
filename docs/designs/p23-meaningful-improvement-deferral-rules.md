# P23 Meaningful Improvement and Deferral Rules

## Meaningful player-experience improvement

Counts as **meaningful** when ALL hold:

1. Targeted experience dimension score improves by ≥ `minimumScoreDelta` (default 0.08).
2. Improvement is not explained solely by raw `eventCount` or pool volume increase.
3. At least one representative stronger/weaker slice pair shows the expected ordering.
4. No strong dimension regresses below its `healthyRange` minimum.

Counts as **merely larger content update** when:

- Pool `eventCount` rises ≥ 10% but dimension score delta < 0.03.
- New events pass P21 constraints but replay distinctiveness flat or down.
- Tuning changes distribution without weak-slice improvement.

## Explicitly deferred beyond P23

- Real-player sentiment surveys and telemetry pipelines
- Automated LLM judgment of narrative prose quality
- Per-persona UI customization of acceptance thresholds
- Cross-theme (non-wuxia) acceptance calibration
- Runtime scheduler rewrite for dynamic acceptance gating

## Tension resolution: weak vs strong dimensions

When improving a weak dimension risks regressing a strong one:

1. **Protect strong first** if strong dimension would drop below healthy range minimum.
2. **Bounded weak improvement** — accept partial weak gain if strong stays in healthy range.
3. **Redirect tuning** — prefer config-only tuning over content volume when volume would crowd strong dimensions.
4. **Document deferral** — record in live-balance sample `authoringNotes` when tradeoff deferred.

## Live-balance decision rule

Acceptance reporting **redirects** a wave when:

- `low_value_detection` sample fires (content volume up, experience delta flat/negative), OR
- Long-term balance indicator for a strong dimension exits healthy range, OR
- Comparison sample shows weaker slice scoring above stronger slice (inverted ordering).
