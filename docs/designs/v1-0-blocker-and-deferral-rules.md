# v1.0 Blocker And Deferral Rules

Triage rules for v1.0 release-candidate work.

## Issue classes

| Class | Definition | RC action |
|-------|------------|-----------|
| **Release blocker** | Prevents clean v1.0 launch: crash, soft-lock, unreadable first-run, or alignment overestimate on ship-critical dimension | Hold candidate; fix before ship |
| **Launch-quality issue** | Playable but borderline dimension; internal gate may pass | Patch or targeted RC wave; document mitigation |
| **Post-launch candidate** | Desirable improvement not required for first publish | Defer to hotfix, patch, or content wave per cadence doc |

## Counts as launch improvement

- Measurable gain on a launch dimension baseline or RC comparison sample
- Alignment gap closes between internal and human-facing proxies
- RC reporting redirects from false-positive internal health to player-facing fix

## Does NOT count

- Pool count increase without baseline delta
- Matrix formatting or report prose only
- Passing upstream gates without playtest comparison when alignment gap is open

## Explicitly deferred beyond v1.0

| Work | Defer to |
|------|----------|
| In-game feedback UI | Post-launch patch (schema exists) |
| Production telemetry pipeline | Infrastructure wave |
| Multi-locale playtest panels | Process, not code |
| New archetype families or themes | Content wave |
| Full runtime narrative rewrite | Out of v1.0 scope |
| New phase-based roadmap (P25+) | Forbidden — use version trains |

Deferred items appear in RC evaluation `deferredItems` with `reason` and `revisitPhase`.
