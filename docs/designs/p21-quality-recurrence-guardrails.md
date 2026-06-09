# P21 Quality And Recurrence Guardrails (US-005)

Rules for acceptable thematic recurrence versus harmful repetition or slop.

## Acceptable Thematic Recurrence

- **Route reinforcement** — same route identity motif (e.g., martial training callbacks) when `stageSignals` advance lifecycle.
- **Archetype continuity** — repeated tags within `thematicContinuityFloor` (P20 repetition pressure).
- **Echo payoffs** — deliberate early-action → midlife callback pairs declared in `echoHooks`.
- **Summary template reuse** — route-matched `age40_identity` templates with distinct `echo_suffix` variables.

## Harmful Repetition / Slop

- **Exact-repeat congestion** — same `event.id` or near-duplicate title within lookback window without setback class justification.
- **Cross-route homogenization** — events with identical text and effects across unlike `pathAffinity` routes.
- **Stage signal vacuum** — high-weight events in age band with no `narrativeScheduling.stageSignals` and no route point.
- **Tone drift** — modern/anachronistic diction in wuxia-facing `content.text` (flagged by tone markers).
- **Duplicate-feel clusters** — >3 events sharing `duplicateRiskClass` and overlapping age ranges.

## Minimum Quality Expectations

| Dimension | Expectation |
| --- | --- |
| Route fit | `authoringSemantics.routeFit` matches `pathAffinity` and active route flags |
| Stage fit | `ageRange` aligns with declared `stageSignals` and stage purpose |
| Tone consistency | Contains ≥1 wuxia tone marker; no blocked modernisms |
| Wuxia flavor | Title/text reference jianghu, cultivation, sect, or period-appropriate social frame |

## Enforcement

- `contentStyleConstraints` — theme/route/stage/tone rules in profile.
- `contentDuplicateConstraints` — duplicate-risk classes and recurrence pressure bounds.
- `evaluateContentConstraints()` — report findings consumed by `gate:p21` and production matrix.
