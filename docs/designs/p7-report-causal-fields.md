# P7 Report Causal Fields (US-035)

| Field | Purpose |
| --- | --- |
| sourceKind | active_action / story_event / random_disturbance / automatic_progression |
| actionSummary | Human-readable action result line |
| attributeThresholdHit | Attributes that satisfied a branch threshold |
| attributeThresholdMiss | Attributes that blocked a branch |
| lockReasonSummary | Player-facing lock explanation aggregate |
| annualJumpDiagnostic | Unintended +1 age jumps with source id |

Implementation: `src/core/activePlanning/p7ReportFields.ts`
