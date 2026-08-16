# Implementation Plan: Cross-Run Cohort Investigation Evidence

## Scope

Implement the Human-authorized Cross-Run Cohort Investigation Evidence Experiment within the frozen design. No gameplay or formal player-state behavior changes are in scope.

## Ordered tasks

### 1. Activate governance and freeze the experiment

- Add the active experiment state, authorization, scope, and STOP boundary to `current-product-stage.md`.
- Keep prior Longitudinal closure immutable and distinguish it from this active experiment.
- Verify the design, plan, and governance contain the same roster, signal, call, and stop constraints.

### 2. Add failing cohort contract tests

- Test exact eight-run preregistration, duplicate/missing/extra registration rejection, and anchor exclusion.
- Test exact signal matching from `visibleFeedbackLines` and denominator preservation for zero-pressure runs.
- Test participant redaction: no persona names/IDs, seeds, hidden state, trace, deltas, final state, prevalence, confidence, significance, or automatic verdict.
- Test `cohort-v1` composition and canonical hash stability.

### 3. Implement bounded cohort evidence tooling

- Add create-only Candidate C runtime composition validation/materialization for the new runtime destination.
- Add cohort plan and eight-run mapping generation with the fixed roster.
- Add Phase0 run orchestration and mechanical validation of seals, source fingerprints, catalog hashes, persona/seed registration, and exact count.
- Add cohort evidence aggregation and frozen Investigation input assembly without modifying `activeActionSummaryBuilder.ts` or the Investigation result contract.

### 4. Rebuild and validate the sealed longitudinal base

- Rebuild `longitudinal-v1` from the preserved anchor/source evidence.
- Require canonical equality with the sealed longitudinal evidence pack before adding cohort evidence.

### 5. Run deterministic gates

- Run Phase0 tests, Investigation tests, Modification Work regression tests, cohort tests, and typecheck.
- Confirm zero provider calls before the real Investigation.
- Stop on any missing, invalid, extra, or mismatched Phase0 run.

### 6. Execute the single real Investigation and close the experiment stage

- Invoke exactly once with DeepSeek `deepseek-v4-flash`, `cohort-v1`, fixed run/hypothesis IDs, and no retry.
- Write raw provider/participant response, invocation metadata, evidence pack, investigation result, and Human review package create-only.
- Record model, invocationRef, providerResponseId, hashes, raw cohort summaries, and the five Investigation result sections.
- Set governance to Human final review pending and STOP.

## Verification checkpoints

- After tasks 1–3: contract tests and typecheck pass; no runtime gameplay source is changed.
- After task 4: rebuilt longitudinal hash equals the sealed hash; eight-run preflight is complete before any provider call.
- After task 5: all deterministic gates pass and provider call count is zero.
- After task 6: exactly one provider call is recorded, Human review package exists, and no downstream evolution stage ran.

## Non-goals

- No gameplay balancing or resource-income analysis.
- No PlayerState, Snapshot, schema, or Investigation prompt/result-contract change.
- No Modification Work, Candidate generation, promotion, production retain, autonomous loop, or successor experiment.
