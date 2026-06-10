# P24 RC Quality And Deferral Rules

Release-candidate judgment rules for wuxia-life P24.

## RC-quality improvement vs cleaner internal report

| Counts as RC-quality improvement | Does NOT count (report-only) |
|----------------------------------|------------------------------|
| Measurable outward experience gain on a playtest dimension | Pool count increase without baseline delta |
| Alignment gap closes between internal and human-facing scores | Matrix formatting or report prose cleanup |
| Targeted fix validated on representative RC sample | New internal metric with no playtest proxy |
| Redirection from false-positive internal health to player-facing fix | Passing upstream gates without playtest comparison |
| Preserved strong dimensions while weak dimension improves | Homogenization masked by aggregate pass rate |

## RC release readiness thresholds

A candidate build is **RC-ready** when:

1. All playtest calibration baselines distinguish stronger/weaker slices.
2. At least one playtest comparison sample passes per major life phase band (early, mid, late/end).
3. Internal-external alignment indicators are in healthy range or bias is documented with mitigation.
4. No open RC sample of class `weak_outward_experience` without recorded redirection or deferral.
5. Upstream gates (playability, P12 profile, P23 acceptance) do not regress.

## Explicitly deferred beyond P24

| Problem | Deferral reason |
|---------|-----------------|
| In-game feedback UI | Out of scope — schema only |
| Production telemetry pipeline | Requires infra not in this phase |
| Multi-locale playtest panels | Human process, not code |
| New archetype families or themes | Content expansion, not calibration closure |
| Full runtime narrative rewrite | Bounded calibration only |
| Automated LLM playtest agents | Future triage support; schema supports but not required |

## Deferral documentation

`releaseReadiness` is limited to `ship`, `hold`, or `redirect`. Scope deferrals are not a fourth readiness state.

Deferred items must appear in RC evaluation `deferredItems` field with `reason` and `revisitPhase` when encountered during RC review.
