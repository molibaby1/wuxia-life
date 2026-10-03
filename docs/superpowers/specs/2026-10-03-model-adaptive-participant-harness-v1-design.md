# Model-Adaptive Participant Harness v1 — Design

**Date:** 2026-10-03
**Status:** APPROVED DESIGN — REVISION 1 / HUMAN ACCEPTED
**Original approval:** 2026-10-03 — accepted authorization-integrity vs communication-certification separation
**Revision approval:** 2026-10-03 — Human explicitly made bounded structural correction and watchdog-style timeout mandatory before the next real attempt-000014
**Project:** wuxia-life / Auto Evolution
**Scope:** minimum Harness hardening required before returning Layer A to a real governed attempt

## 1. Purpose

Model-Adaptive Participant Harness v1 removes three avoidable causes of wasted governed Participant work while preserving exact authorization and fail-closed validation:

1. binding drift invalidates authorization but does not automatically trigger detached synthetic recertification;
2. a completed substantive Role result is not discarded solely because its terminal representation has one machine-detectable envelope/schema defect;
3. a Participant that is still observably progressing is not terminated merely because a fixed wall-clock deadline elapsed.

The intended sequence is:

```text
fix already-established Harness principles
→ focused deterministic verification
→ fresh exact binding
→ fresh attempt-000014 authorization candidate
→ Human exact canonical-SHA approval
→ one real governed attempt-000014
```

This revision supersedes the earlier pre-#14 conclusion that Reviewer structural correction and generalized watchdog behavior could wait for another real failure.
## 2. Why revision is required

The earlier design correctly identified four directions:

1. bounded structural correction;
2. timeout as watchdog rather than ordinary deadline;
3. workload shaping;
4. real-path-first validation.

Revision 1 changes the implementation priority of directions 1 and 2.

The Human has determined that directions 1 and 2 are not speculative optimizations. They are established Harness problems already exposed repeatedly by prior real Participant runs.

Relevant existing evidence includes:

- repeated completed/near-completed structured outputs that failed at envelope or Role-schema boundaries;
- attempt-000013 ending at Reviewer `invalid_output` after expensive upstream work;
- existing Solution bounded envelope/schema retransmission proving the correction pattern is already architecturally accepted;
- historical same-thread continuation evidence beyond the current 60-second correction ceiling;
- prior fixed-timeout failures that led to PD-099 v2's partial Solution-only activity-aware scheduler.

Therefore the next real #14 should not be used merely to rediscover these already-known principles.

## 3. Preserved PD-122 authorization decision

The authorization half of PD-122 remains unchanged:

```text
binding drift
→ old attempt authorization becomes stale
→ fresh exact current binding is mandatory
→ fresh attempt-specific Human exact-SHA authorization is mandatory
→ admission re-resolves current binding
→ mismatch fails closed
```

Binding drift alone does not require Matrix A/B/C, artifact probes, or a new full synthetic communication certification campaign.

After the mandatory Harness hardening in this design is implemented and deterministically verified, the default evidence path returns to one real governed #14.
## 4. Mandatory pre-#14 hardening A — bounded structural correction

### 4.1 Principle

If a Participant has completed substantive work and the Host can deterministically prove that rejection is only a machine-detectable structured-output representation defect, the Host MUST allow at most one bounded same-thread correction when the Participant transport supports same-thread continuation.

This is representation recovery, not semantic retry.

```text
completed Role reasoning
+ envelope/schema representation defect
+ same-thread continuation available
→ one correction request
→ same substantive Role result
→ full Host validation again
```

### 4.2 Eligible failures

Revision 1 correction is eligible only for terminal structured Role-result failures at these two boundaries:

- structured terminal envelope failure:
  - empty terminal payload;
  - invalid JSON;
  - JSON root is not an object;
- Role schema failure:
  - the JSON object does not satisfy the exact Role schema.

The Host MAY include its exact schema diagnostic as quoted data in the correction request.

### 4.3 Ineligible failures

No correction is allowed for:

- Participant runtime unavailable;
- process failure;
- timeout;
- continuation failure;
- accepted-result semantic validation;
- problem / option identity mismatch;
- reference validation failure;
- Contract non-conformance;
- Reviewer substantive rejection;
- internal consistency rejection after Role schema acceptance;
- permission / authority failure;
- provenance mismatch;
- artifact integrity or security failure;
- any failure whose correction would require new investigation or new substantive claims.

These remain ordinary fail-closed outcomes under existing authority, including PD-119.
### 4.4 Correction count and thread identity

Maximum correction count is exactly one per Role invocation.

Correction MUST use the same Participant thread/session.

If same-thread continuation is unavailable, mismatched, or fails, the Host MUST fail closed. It MUST NOT start a fresh Participant session as a substitute correction.

There is no correction loop and no retry-until-success behavior.

### 4.5 Mandatory Role coverage before #14

Revision 1 MUST cover terminal structured Participants on the real Layer A path:

- terminal-mode Solution where that delivery mode is used;
- Reviewer;
- Re-reviewer;
- Shadow Authoring / `configuration-execution`.

Reviewer and Re-reviewer share the same execution path and must receive identical correction semantics.

The existing Solution terminal correction becomes the common mechanism rather than a Solution-only exception.

### 4.6 Artifact-backed Solution boundary

The actual reference Solution currently uses `WORKSPACE_ARTIFACT_RECEIPT_V1`.

Artifact-backed recovery is NOT added in Revision 1.

Reason: artifact-backed failure recovery may require rewriting Host-reserved files, preserving first-artifact bytes, re-establishing receipt/file integrity, and distinguishing receipt-only correction from full-result rewrite. That is a different transport-recovery protocol from correcting one terminal Role object.

Artifact-backed Solution therefore remains fail closed for receipt/artifact/integrity/Role-schema failures under its existing authority.

This is a deliberate transport boundary, not permission to discard terminal structural failures in Reviewer/Shadow.

### 4.7 Evidence preservation

For every attempted correction, durable evidence MUST preserve:

1. original Participant prompt;
2. original raw terminal output;
3. original validation result and exact failure class;
4. Host correction prompt;
5. corrected raw terminal output;
6. correction execution trace;
7. corrected validation result;
8. final accepted/failure classification.

Accepted-result validation MUST run again after corrected Role-schema validation succeeds.
## 5. Mandatory pre-#14 hardening B — timeout is a watchdog

### 5.1 Principle

Participant timeout is abnormal-safety protection, not an ordinary execution deadline.

The default behavior MUST be:

```text
before evaluation window
→ allow work

after evaluation window + recent meaningful stdout progress
→ continue

after evaluation window + prolonged stdout inactivity
→ terminate as stalled

regardless of activity, absolute safety cap reached
→ terminate as runaway protection
```

A healthy Participant must not be killed solely because a fixed default wall-clock duration has elapsed.

### 5.2 Host-visible progress signal

The Host cannot inspect private reasoning.

Revision 1 uses the existing conservative observable signal already implemented for Solution:

- non-empty stdout activity refreshes progress;
- stderr remains diagnostic only and does NOT refresh the watchdog;
- process liveness alone does not count as progress.

This preserves the existing safety choice that noisy stderr cannot keep a stuck Participant alive indefinitely.

### 5.3 Default V1 watchdog values

Revision 1 generalizes the already accepted PD-099 v2 values instead of inventing a new parameter search:

```text
evaluationStartMs = 1_800_000
stdoutInactivityMs = 600_000
absoluteCapMs = 2_700_000
```

Interpretation:

- no default inactivity termination before 30 minutes;
- after 30 minutes, 10 minutes of stdout silence is a stall;
- 45 minutes is the absolute abnormal-safety cap even if stdout activity continues.

These values are safety boundaries, not expected completion times or SLAs.
### 5.4 Default Role coverage

When `WorkspaceAgentParticipantOptions.timeoutMs` is not explicitly supplied, every initial `runWorkspaceAgentJob` Role MUST use the activity-aware watchdog policy, including:

- Solution;
- Reviewer;
- feedback;
- hypothesis;
- configuration-execution.

This removes the current Solution-only exception.

An explicit `participant.timeoutMs` remains a fixed timeout override for callers that deliberately require a controlled observation ceiling, deterministic test, or diagnostic experiment. It is not the production default.

### 5.5 Same-thread correction continuation

The bounded structural correction introduced by §4 MUST also use activity-aware watchdog semantics.

The current fixed `ENVELOPE_RETRANSMISSION_TIMEOUT_MS = 60_000` MUST NOT remain the production correction deadline.

The correction continuation should inherit the same role-neutral watchdog policy unless a controlled caller explicitly supplies a fixed timeout.

This directly resolves the inconsistency where the Host allows correction in principle but kills a healthy same-thread correction merely because 60 seconds elapsed.

### 5.6 Trace semantics

Execution traces must expose the policy as role-neutral watchdog semantics rather than calling it Solution-only.

Revision 1 SHOULD replace the Solution-specific trace policy identity with a generic Participant activity-aware identity and use generic timeout details such as:

- `PARTICIPANT_STDOUT_INACTIVITY`;
- `PARTICIPANT_ABSOLUTE_CAP`.

The trace must continue to record:

- effective absolute timeout;
- policy parameters;
- output activity events;
- last observable activity;
- last stdout activity;
- timeout event and reason.

Existing trace schema version may remain if consumers do not require a schema-version bump; implementation must verify this rather than assume it.
## 6. Reviewer integration boundary

Reviewer currently bypasses the shared structured Participant executor and directly performs:

```text
runWorkspaceAgentJob
→ validateStructuredTerminalEnvelope
→ validateSolutionReview
→ accepted-result / identity / reference checks
```

Revision 1 SHOULD route Reviewer and Re-reviewer through the existing shared terminal structured execution mechanism rather than duplicating a second correction implementation.

The boundary must remain:

```text
validate envelope
→ validate SolutionReviewV1 schema
→ [one structural correction only if either of those failed]
→ accepted-result / identity / option / Contract-assessment / reference validation
→ no correction for those later failures
```

The wrapper may preserve its existing invocation/failure/review artifacts and public result type.

The refactor must not change Reviewer decision semantics.

## 7. Shadow integration boundary

Shadow Authoring already uses `runStructuredParticipantExecution` with role `configuration-execution` but currently passes `retransmissionEnabled: false`.

Revision 1 enables the common bounded structural correction for its terminal result.

Shadow workspace mutation, deterministic patch generation, authoritative-repository fingerprint checks, and promotion authority remain unchanged.

A structurally corrected terminal status does not alter the shadow filesystem work that already occurred; the corrected terminal result must describe the same substantive execution result.

## 8. Solution boundary

Terminal-mode Solution keeps the existing bounded structural correction semantics.

Artifact-backed Solution remains under §4.6 and receives watchdog hardening through the generic initial Participant scheduler, but no artifact-backed retransmission is introduced.

Solution revision/continuation semantics from PD-117 are workflow semantics and are not the same thing as structural correction. They remain unchanged.
## 9. PD-099 and PD-122 governance reconciliation

Implementation MUST update long-term governance so current authority no longer contradicts this revision.

### PD-099

PD-099 v2 remains historically correct as the first activity-aware Solution timeout policy.

Revision 1 supersedes only its Solution-only scope by generalizing the same watchdog principle and values to default workspace Participant execution and bounded correction continuation.

### PD-122

PD-122's original statements that Reviewer structural correction and timeout/watchdog expansion are not prerequisites for #14 are superseded by this Human-approved revision.

The revised operative rule is:

> Bounded terminal structural correction and role-neutral activity-aware watchdog behavior are mandatory Harness baseline work before a fresh attempt-000014 authorization candidate is prepared.

PD-122's authorization-integrity and real-path-first decisions remain unchanged.

## 10. Workload shaping

Workload shaping remains an accepted principle but is NOT a mandatory new architecture slice before #14.

Continue to prefer:

- remove redundant context;
- keep deterministic/mechanical work in Host code;
- use artifact + small receipt for large work products;
- keep one clear cognitive responsibility per invocation;
- split cognitive work only when evidence shows coupling is itself a bottleneck.

Do not redesign Agent decomposition merely because timeout/correction code is being touched.

## 11. Validation strategy

This hardening is validated with deterministic engineering tests, not another detached model-capability certification campaign.

Tests must prove at minimum:

### Structural correction

- Reviewer malformed envelope → exactly one same-thread correction → valid review accepted;
- Reviewer Role-schema failure → exactly one same-thread correction → valid review accepted;
- Re-reviewer receives the same behavior;
- Shadow terminal envelope/schema defect receives at most one correction;
- accepted-result/identity/reference/semantic failure does not trigger correction;
- missing same-thread capability does not create a fresh session;
- correction continuation failure/timeout fails closed;
- raw attempt 0, correction prompt, attempt 1, and trace evidence are preserved;
- second structural failure after correction is terminal.

### Watchdog

- default Reviewer receives activity-aware policy;
- default configuration-execution receives activity-aware policy;
- default Solution retains equivalent policy values;
- stdout activity after the evaluation start extends execution;
- stderr-only activity does not extend execution;
- inactivity after the evaluation start terminates;
- absolute cap terminates even with continued stdout;
- explicit `timeoutMs` remains fixed;
- same-thread correction without explicit fixed timeout uses activity-aware policy;
- controlled callers that explicitly request a fixed continuation timeout still receive that fixed ceiling.
## 12. No synthetic reopening gate

After deterministic tests pass, do NOT automatically run:

- Matrix A/B/C;
- Matrix D;
- artifact-backed synthetic matrix;
- historical Solution-only probes.

Those tools remain diagnostic.

The next operational sequence is:

```text
implementation accepted
→ fresh exact Solution/downstream bindings
→ fresh attempt-000014 authorization candidate
→ Human exact canonical-SHA approval
→ exactly one real governed attempt-000014
```

If that real attempt reveals a new concrete communication failure, use the smallest relevant diagnostic tool.

## 13. Non-goals

Revision 1 does not authorize:

- semantic retry until acceptance;
- more than one structural correction;
- fresh-session correction fallback;
- artifact-backed Solution rewrite/retry protocol;
- weakening Role schema;
- Host JSON repair or normalization;
- Contract changes;
- Reviewer decision steering;
- automatic acceptance;
- new workload decomposition;
- provider abstraction;
- automatic promotion;
- changing binding/authorization exactness;
- changing PD-119 candidate/session containment semantics.

## 14. Stop conditions

Return to Human design review if implementation requires:

- correction of accepted-result/semantic failures;
- more than one correction attempt;
- a fresh session when same-thread continuation is unavailable;
- artifact-backed result-file rewrite/recovery;
- weakening exact Role schema;
- treating stderr noise as progress without new evidence;
- removing the absolute safety cap;
- changing watchdog values away from 1,800,000 / 600,000 / 2,700,000 without separate evidence;
- changing Contracts or promotion authority;
- unrelated Agent/workload redesign.
## 15. Acceptance criteria

Revision 1 is implemented only when all are true:

1. PD-122 governance reflects directions 1 and 2 as mandatory pre-#14;
2. terminal structured Solution/Reviewer/Re-reviewer/Shadow share one bounded structural-correction mechanism;
3. only envelope and Role-schema failures are eligible;
4. correction count is exactly one;
5. correction is same-thread only;
6. semantic/identity/reference/Contract failures do not trigger correction;
7. artifact-backed Solution remains fail closed for its transport/schema failures;
8. all default initial workspace Participant Roles use role-neutral activity-aware watchdog semantics;
9. stdout refreshes progress and stderr does not;
10. watchdog values remain 1,800,000 / 600,000 / 2,700,000;
11. structural correction continuation no longer uses a fixed 60-second production deadline;
12. explicit fixed timeout overrides remain available for controlled callers;
13. deterministic tests cover correction and watchdog boundaries;
14. no Matrix/probe certification campaign is introduced as an automatic gate;
15. no new #14 authorization candidate or #14 execution is created by this implementation.

## 16. Design conclusion

The pre-#14 Harness baseline is now:

```text
exact binding + exact Human authorization
+
one bounded same-thread correction for machine-detectable terminal structure errors
+
activity-aware watchdog with absolute safety cap
+
real workload as primary post-hardening evidence
```

The system should neither discard expensive completed reasoning for a correctable serialization defect nor terminate a Participant that is visibly still working simply because an ordinary wall-clock deadline elapsed.

Those are baseline Harness properties, not experiments to rediscover in attempt-000014.

## 17. Self-review

- Authorization integrity remains unchanged.
- No semantic retry is introduced.
- Correction eligibility is machine-detectable and narrow.
- Reviewer/Re-reviewer/Shadow are covered before #14.
- Artifact-backed transport is explicitly separated.
- Timeout values are reused from accepted PD-099 v2 rather than newly tuned.
- The 60-second correction deadline is explicitly removed from production correction semantics.
- Workload shaping remains a principle but not a new pre-#14 implementation slice.
- No synthetic recertification gate is restored.
- No #14 authorization or execution is authorized by this design.
