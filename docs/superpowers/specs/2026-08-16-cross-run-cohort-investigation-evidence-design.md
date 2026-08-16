# Cross-Run Cohort Investigation Evidence Experiment

## Status

Human-authorized experiment. This is an evidence-generation stage, not closure verification.

## Product alignment

The experiment tests whether Auto Evolution Investigation can use a preregistered, player-observable P8 cohort to distinguish a bounded descriptive signal from a single-run observation. It does not change gameplay, PlayerState, Snapshot, runtime contracts, or product balance.

## Frozen inputs

- Candidate C is the experimental baseline only.
- Selected baseline commit: `74fb4fb3179f3ddeec78e3a43232ece0fc6e420f`.
- Candidate C `family-life` SHA-256: `3ef049dcf0ef77d47a0d2d6c1156488e678b8c4e54ead3c8e0b59dee794eb6c6`.
- Catalog version: `1.0.0`.
- End age: `80`.
- The fixed P8 roster and seeds are exactly the eight registrations in the implementation plan. The anchor `p8-scholar-su / 101` is excluded from the cohort.
- The preregistered signal is an exact match against player-observable `visibleFeedbackLines` only:
  - `银两已用尽，当前可见资源压力较高。`
  - `银两已透支，当前可见资源压力较高。`

## Runtime composition

Create-only materialization starts from the sealed Skeleton 007 `workspace-c`. The full selected-baseline manifest and Human decision hash must validate before copying. Only these three current root files may be overlaid, after their expected hashes match the accepted composition evidence:

- `src/core/activePlanning/ActionResultResolver.ts`
- `src/headless/playability/playerSurfaceCapture.ts`
- `src/headless/playability/runnerSteps.ts`

Current Investigation and Modification Work tooling is not copied into the runtime workspace. Historical Fresh-Problem composition evidence is read-only and never rewritten.

## Evidence contract

`cohort-v1` consists of the exact sealed `longitudinal-v1` evidence plus bounded cohort evidence. Before the participant call, the implementation must rebuild the longitudinal pack and compare its canonical hash to the sealed longitudinal evidence hash.

The cohort participant input exposes only `cohort-run-000001` through `cohort-run-000008`, raw descriptive facts, player-observable pressure entries, and formal `actionId` provenance. It does not expose persona names, persona IDs, seeds, hidden state, PlayerState, ExperienceTrace, state deltas, final state, prevalence scores, significance, confidence, population probability, or an automatic verdict.

All eight runs remain in the denominator, including runs with zero pressure entries. The output is descriptive evidence only; it must preserve uncertainty about population prevalence and resource dynamics.

## External-call and stop boundary

All deterministic tests and typecheck run before any real participant call. The only real call is one DeepSeek `deepseek-v4-flash` Hypothesis Investigation with `evidenceMode = cohort-v1`, fixed `runRef = ae-fresh-problem-transfer-001`, fixed `hypothesisId = hypothesis-000001`, and retry count zero.

After the call, write the Human review package and mark governance as Human final review pending. Do not run Modification Work, generate Candidate, modify gameplay, rerun Investigation, add registrations, inspect resource dynamics, or start a successor experiment.

## Human review

Human must decide independently:

1. `COHORT_RETRIEVAL_ADEQUATE` or `COHORT_RETRIEVAL_NOT_ADEQUATE`.
2. `INVESTIGATION_USED_COHORT` or `INVESTIGATION_DID_NOT_USE_COHORT`.
3. `UNCERTAINTY_PRESERVED` or `UNCERTAINTY_NOT_PRESERVED`.

Even an 8/8 descriptive result is not population prevalence.
