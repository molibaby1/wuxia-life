# Auto Evolution Bounded More-Work Continuation v1

## 1. Status

**Status: HUMAN ACCEPTED — 2026-09-12. Implementation must conform to PD-117 and this design.**

This design defines a bounded continuation path for an existing Auto Evolution Reviewer outcome:

```text
REQUEST_MORE_WORK
```

It addresses the observed workflow gap where Reviewer identifies concrete additional work, but the current Host immediately routes:

```text
REQUEST_MORE_WORK
→ DEFER_MORE_WORK_REQUESTED
→ STOP
```

The design does **not** assume that every Reviewer request is correct, that every run should continue, or that the goal is to maximize `READY_FOR_CONFIG_EXECUTION`.

The product objective remains:

> Auto Evolution should, with useful reliability, continue valuable product-improvement reasoning when a bounded next step exists, while preserving evidence, authority, permission, and fail-closed boundaries.

This design is not implementation authorization. Before implementation, the written design must be Human accepted and the corresponding product/governance authority must be recorded. Existing historical artifacts remain immutable.

---

## 2. Evidence and Problem Statement

Historical V3/V4 ordinary-run audit found eight Reviewer `REQUEST_MORE_WORK` outcomes. In the reviewed cases, the dominant pattern was not “Reviewer rejects a valid solution for arbitrary reasons.” Reviewer often identified concrete unresolved work such as:

- incomplete row-level configuration details;
- missing preservation of existing `condition` / `effects` semantics;
- unclosed source-row / age-eligibility / history / pool-exhaustion checks;
- a bounded fixed-input check capable of discriminating between competing explanations;
- missing product-authority approval after local investigation had narrowed the issue.

Current workflow semantics convert every such review into `DEFER_MORE_WORK_REQUESTED` and stop the ordinary session. The historical continuation reference already records this limitation: “需要补充” does not become additional investigation within those sessions.

Therefore the current bottleneck is defined as:

```text
PRIMARY_BOTTLENECK = REQUEST_MORE_WORK continuation semantics
ROOT_CAUSE_CLASS = WORKFLOW_DESIGN
```

The design must preserve the distinction between:

- a bounded next step that can be completed in the current execution context;
- evidence genuinely unavailable without a new run / sample / external source;
- a Human product or authority decision;
- a proposal that should simply be rejected.

---

## 3. Existing Authority and Required Authority Change

### 3.1 Existing authority that remains unchanged

The following remain authoritative unless separately changed:

- PD-100 Human Follow-up creation scope: only a formal `ESCALATE_HUMAN` route automatically creates a retained Human work item;
- PD-111 bounded causal-attribution handoff and prohibition on exposing raw Phase0 internal source;
- authoritative product repository write remains disallowed for reasoning Participants;
- ordinary configuration execution remains allowed only through the existing accepted configuration-only execution path;
- full P3 remains deferred;
- historical V1 decision, review, report, and manifest artifacts remain valid historical evidence;
- existing Solution envelope retransmission remains transport/contract recovery only and is not semantic continuation.

### 3.2 Authority that this design proposes to change

Current product/governance material records `DEFER_MORE_WORK_REQUESTED` as a terminal stop with manual follow-up. This design proposes a new bounded exception:

> The Host may automatically perform at most one Reviewer-driven bounded continuation per multi-round session when a completed Reviewer returns `REQUEST_MORE_WORK`.

This changes current execution logic and Participant budget semantics. It therefore requires a new accepted Product Decision before implementation. The new decision must explicitly preserve PD-100 HFL scope and full-P3 deferral rather than silently rewriting them.

---

## 4. Goals

1. Allow one concrete Reviewer `REQUEST_MORE_WORK` to become bounded follow-up work instead of an immediate dead end.
2. Reuse the existing Solution and Reviewer responsibilities rather than add a new domain-specific reasoning Role.
3. Preserve the original review and decision evidence; never overwrite historical/intermediate artifacts.
4. Keep continuation bounded: at most one continuation per multi-round session, with at most two additional Participant jobs.
5. Keep the Host domain-agnostic. The Host does not decide whether an age rule, content row, selector, narrative, or authority interpretation is correct.
6. Allow the continuation to end in any legitimate existing terminal outcome, including `DEFER`, `ESCALATE_HUMAN`, `SKIP`, or `DEFER_MORE_WORK_REQUESTED`.
7. Preserve Human authority boundaries: continuation must not turn an authority decision into an LLM decision.
8. Preserve stochastic LLM behavior. Success is not “same input → same output”; success is useful bounded progression without invalid authority bypass.

---

## 5. Non-Goals

This v1 does not:

- create an unlimited Solution ↔ Reviewer conversation loop;
- retry until a proposal is accepted;
- optimize for `READY_FOR_CONFIG_EXECUTION` rate;
- automatically rerun gameplay or obtain a new seed merely because Reviewer wants more work;
- create a generic asynchronous continuation queue;
- automatically create HFL items for `DEFER` or `DEFER_MORE_WORK_REQUESTED`;
- change Selection, Hypothesis, Feedback, or PD-111 evidence scope;
- introduce domain-specific concern categories into the Host;
- introduce `LOCAL_REVISION / BOUNDED_EVIDENCE / HUMAN_AUTHORITY` enum subtypes in Reviewer output;
- resume the original Solution model thread for semantic work;
- reopen full P3;
- expand autonomous code/product write permissions.

---

## 6. Reviewer Decision Semantics

The existing Reviewer decision enum remains conceptually sufficient. v1 tightens active-runtime semantics without adding a subtype field.

### `REQUEST_MORE_WORK`

Use only when Reviewer can identify at least one concrete, decision-relevant, bounded item that can be worked on **within the current execution context** using the current source artifacts, repository snapshot, allowed local investigation, and existing authority references.

The requested work must be capable of materially changing the subsequent review decision.

Examples:

- inspect a concrete repository path or selector implementation;
- verify a fixed-input mapping using existing captured source/evidence;
- supply missing row-level before/after proposal details;
- preserve/check existing conditions/effects;
- run bounded local/static verification already available in the workspace.

### `DEFER`

Use when the material missing information cannot be obtained in the current execution context and requires genuinely new evidence, such as:

- a new gameplay run or new sample;
- unavailable external input;
- evidence not present in the current repository/source/package and not derivable locally.

### `ESCALATE`

Use when progress requires a Human product, governance, or authority decision rather than additional technical investigation.

### `REJECT`

Use when the proposed option is not acceptable and bounded additional work on that proposal is not the appropriate next action.

### Misclassification remains safe

Reviewer is still an LLM and may choose imperfectly. If Reviewer incorrectly returns `REQUEST_MORE_WORK` for an unavailable or authority-bound problem, the Revision Solution must not fabricate an answer. It may return `INSUFFICIENT_EVIDENCE` or `ESCALATE`, producing the corresponding safe terminal route.

---

## 7. Trigger and Session-Level Bound

The continuation trigger is purely mechanical:

```text
completed Reviewer decision == REQUEST_MORE_WORK
AND session review-continuation count == 0
```

The continuation token is **session-wide**, not per round.

Therefore:

- if Round 1 uses the continuation, Round 2 cannot use another one;
- if Round 1 reaches execution without continuation, Round 2 may use the one available continuation;
- a second `REQUEST_MORE_WORK` after the continuation never starts another continuation.

This rule keeps the worst-case Participant budget bounded while allowing the continuation at the actual point of need.

---

## 8. Placement in Architecture

Continuation belongs to the **execution Host / Orchestrator layer**, not to Participant hidden state and not to the Decision Router's domain logic.

The existing four-job problem-agnostic round remains an intact base workflow:

```text
Feedback
→ Hypothesis
→ Solution
→ Reviewer
→ base Decision
```

If the base Decision is `DEFER_MORE_WORK_REQUESTED`, the multi-round Host may invoke one separate continuation workflow.

This separation is intentional:

- the original `decision.json` remains immutable evidence of the base workflow;
- continuation has its own provenance and budget;
- existing `solution-decision-v1` does not need to pretend that six jobs occurred inside a four-job workflow;
- the Host can select the continuation's final decision as the **effective route** without overwriting the base decision.

---

## 9. Continuation Data Flow

```text
Base Round
  Problem Package
  Original SolutionWorkV1
  Original SolutionReviewV1 = REQUEST_MORE_WORK
  Base SolutionDecisionV1 = DEFER_MORE_WORK_REQUESTED
          ↓
Host eligibility check
          ↓
review-continuation-000001
          ↓
Fresh Solution Revision invocation
          ↓
if revised Solution status != OPTIONS
    → continuation Decision
else
    → Fresh Reviewer re-review
    → continuation Decision
          ↓
Host uses continuation Decision as effective route
```

No new Feedback, Hypothesis, Selection, or Problem Package is generated.

---

## 10. Revision Solution Invocation

### 10.1 Fresh invocation

The Revision Solution is a **new Participant invocation**.

It must not use:

- same-thread Codex resume from the initial Solution;
- provider conversation memory;
- hidden previous chain state.

The existing same-thread continuation capability remains reserved for the already-authorized Solution envelope retransmission mechanism.

### 10.2 Inputs

The Revision Solution receives:

- the exact same validated Problem Package;
- the exact original `SolutionWorkV1`;
- the exact original `SolutionReviewV1`;
- the original Reviewer concerns;
- the same repository/evolution-workspace state used by the base round;
- the same Problem Package source artifacts and authority refs;
- the same assigned Solution skills.

It must not receive:

- artifacts from unrelated historical runs;
- a newly generated gameplay sample;
- raw Phase0 internal source prohibited by PD-111;
- Human decisions that did not exist at the time of the current session.

### 10.3 Responsibility

The Revision Solution is instructed to:

1. treat Reviewer concerns as review feedback, not as ground truth;
2. address each material concern using bounded investigation available in the current context;
3. disagree with a concern when repository/evidence support that disagreement;
4. distinguish locally resolved facts from still-unavailable evidence and Human authority;
5. return a normal `SolutionWorkV1` outcome:
   - `OPTIONS`,
   - `NO_PROPOSAL`,
   - `INSUFFICIENT_EVIDENCE`, or
   - `ESCALATE`;
6. avoid broad re-investigation unrelated to the review concerns.

v1 deliberately reuses `SolutionWorkV1`; it does not introduce a new product-level “concern response” schema. Provenance of the revision request is recorded by the Host, and the re-review sees the original review plus revised solution.

---

## 11. Re-review

A fresh Reviewer is invoked **only if** the revised Solution returns `OPTIONS`.

The re-review receives:

- the same Problem Package;
- original Solution;
- original Review;
- revised Solution;
- continuation provenance binding those artifacts;
- the same repository/source/authority context.

The Reviewer remains independent. It is not instructed to accept because work was revised.

It may return any existing legal review decision.

If it returns `REQUEST_MORE_WORK` again:

```text
REQUEST_MORE_WORK #2
→ DEFER_MORE_WORK_REQUESTED
→ STOP
```

No second continuation is allowed.

---

## 12. Effective Routing

The base decision remains immutable.

The continuation creates its own validated `solution-decision-v1` using the revised Solution and, when present, re-review.

The Host defines:

```text
effective decision =
  continuation decision, if a continuation completed;
  otherwise base decision
```

Existing route semantics then apply to the effective decision.

### Effective `READY_FOR_CONFIG_EXECUTION`

Configuration execution uses the **revised** accepted option and fresh re-review, never the superseded original option/review pair.

### Effective `ESCALATE_HUMAN`

Human Follow-up retention is triggered exactly as under PD-100: only because the effective formal decision route is `ESCALATE_HUMAN` with an accepted HFL reason code.

The retained evidence must include enough continuation provenance to show:

- base Problem Package;
- original Solution;
- original Review;
- base Decision;
- revised Solution;
- re-review when present;
- continuation Decision.

This extends retained evidence, not HFL trigger scope.

### Effective `DEFER`, `SKIP`, `DEFER_MORE_WORK_REQUESTED`

No automatic HFL item is created, preserving PD-100.

---

## 13. Continuation Artifact Layout

Each bounded continuation is create-only and lives under the corresponding round:

```text
round-N/
  ...base workflow artifacts...

  review-continuation-000001/
    continuation.json
    revision-request.json

    solution-revision/
      invocation.json
      raw-output.txt
      execution-trace.json
      result.json | failure.json

    reviewer-agent/
      invocation.json
      raw-output.txt
      review.json | failure.json

    decision.json                 # continuation SolutionDecisionV1 when available
```

`revision-request.json` deterministically binds:

- base Problem Package SHA-256;
- original Solution SHA-256;
- original Review SHA-256;
- base Decision SHA-256;
- source run identity;
- workspace baseline fingerprint;
- continuation ordinal (`1` only).

`continuation.json` records Host-level state and outcome. It is not a reasoning artifact and does not contain hidden chain-of-thought.

At minimum it records:

```text
schemaVersion
continuationId
parentWorkflowRef
sourceRunRef
startedAt / completedAt
baseDecisionRef / sha256
revisionRequestRef / sha256
revisionStatus
reReviewStatus
continuationDecisionRef / sha256 | null
participantJobCount
terminalStatus
```

---

## 14. Workspace and Evidence Invariants

For a continuation to be valid:

1. the source run is unchanged;
2. the Problem Package bytes/hash are unchanged;
3. the product/repository snapshot is the same round baseline;
4. no configuration execution has occurred between base Reviewer and its continuation;
5. the Revision Solution workspace is freshly materialized from that same round baseline;
6. the re-review workspace is independently freshly materialized from the same round baseline;
7. Revision and re-review workspace baseline fingerprints match;
8. PD-111 evidence boundaries remain unchanged;
9. the continuation does not import evidence from another ordinary run;
10. all new runtime artifacts are create-only.

For Round 2, “same round baseline” means the post-execution evolution workspace state from which Round 2's base Solution/Reviewer were created.

---

## 15. Participant Failure and Contract Failure

A continuation Participant failure is not a reason to loop or retry semantic work.

Existing Role-local transport/envelope recovery rules remain unchanged. Beyond those existing mechanisms:

- no semantic retry of Revision Solution;
- no semantic retry of re-review;
- no automatic provider/model switch;
- no second review continuation.

A terminal continuation Participant failure stops the session with preserved failure artifacts. In session observability its effective terminal route is `PARTICIPANT_FAILURE`; no continuation `solution-decision-v1` is fabricated when there is no valid Participant result to route. It does not automatically create an HFL item solely because of failure, preserving PD-100.

---

## 16. Budget

Existing base-round limits remain conceptually intact:

```text
maxBaseRoundParticipantJobs = 4
maxExecutionParticipantJobs = 1
```

New session-wide limits:

```text
maxReviewContinuations = 1
maxReviewContinuationParticipantJobs = 2
retryCount = 0      # ordinary semantic retries; existing envelope recovery remains separate
```

Worst-case multi-round Participant budget becomes:

```text
Round 1 base                  4
One review continuation       2
Configuration execution       1
Round 2 base                  4
--------------------------------
maxTotalParticipantJobs      11
```

The continuation may consume only one Participant job when the revised Solution does not return `OPTIONS`.

The multi-round manifest must account for base-round, continuation, execution, and Round-2 jobs separately; counts must never be hidden inside an existing four-job decision budget.

---

## 17. Manifest and Observability

Current `multi-round-run-manifest-v1` has fixed limits of 4 per round and 9 total and no continuation provenance. It must not be silently reinterpreted.

Implementation therefore requires a versioned manifest evolution that can represent:

- base round terminal route;
- whether review continuation occurred;
- continuation reference;
- effective terminal route after continuation;
- continuation Participant-job count;
- session-wide continuation count;
- max total Participant jobs = 11;
- the existing execution / Round-2 transition semantics.

Historical manifest v1 remains readable and unchanged.

Session observability and Operational Report machine JSON must also expose the distinction between:

```text
base route
continuation occurred?
effective route
```

If the machine report shape changes, it must use a new schema version rather than mutating existing historical report schemas in place.

The Human-facing projection should make the sequence readable, for example:

```text
Reviewer requested bounded more work
→ one continuation executed
→ revised outcome: ESCALATE_HUMAN
```

It must not collapse the base review out of the audit trail.

---

## 18. Human Follow-up Semantics

PD-100 remains intact:

```text
Only effective formal ESCALATE_HUMAN creates an automatic HFL item.
```

Continuation must not create a new HFL trigger for:

- base `REQUEST_MORE_WORK`;
- final `DEFER_MORE_WORK_REQUESTED`;
- `DEFER`;
- Participant failure.

When continuation ends in a valid `ESCALATE_HUMAN`, HFL retention must preserve the continuation evidence chain so Human can distinguish:

- what was originally proposed;
- what Reviewer requested;
- what the bounded revision learned/changed;
- why the final escalation remains necessary.

---

## 19. Historical Protection Cases

Historical runs define design tests; they do not prescribe exact LLM answers.

### Case A — `ordinary-run-20260910-000006`

Historical Reviewer identified locally checkable coverage/path issues plus a possible Human age-semantics boundary.

Desired v1 behavior:

- first `REQUEST_MORE_WORK` may trigger one continuation;
- Revision performs the available bounded checks rather than simply repeating the proposal;
- if the surviving proposal still requires a Human age-semantics decision, the flow may legitimately end in `ESCALATE_HUMAN`;
- success is **not** defined as reaching READY.

### Case B — `ordinary-run-20260910-000007`

Historical Reviewer requested source-row, age-eligibility, history, and exhaustion-state mapping.

Desired v1 behavior:

- bounded local investigation may continue;
- a program/runtime or unresolved product-semantics boundary remains eligible for Human escalation;
- no cross-run prevalence requirement is invented for the bounded observed case.

### Protection Case — `ordinary-run-20260910-000005`

Historical route was a legitimate Human authority escalation.

Desired v1 behavior:

```text
ESCALATE_HUMAN
→ no review continuation
```

The feature must not intercept or downgrade an existing authority escalation merely to keep the workflow moving.

### Loop Protection

A re-review returning `REQUEST_MORE_WORK` again must produce:

```text
DEFER_MORE_WORK_REQUESTED
→ STOP
```

with zero additional continuation jobs.

---

## 20. Validation Strategy

### 20.1 Deterministic engineering tests

Implementation must prove mechanically:

1. no continuation for `ACCEPT_OPTION`, `ACCEPT_NO_ACTION`, `REJECT`, `DEFER`, or `ESCALATE`;
2. exactly one continuation for the first eligible `REQUEST_MORE_WORK`;
3. no second continuation after re-review `REQUEST_MORE_WORK`;
4. one or two continuation jobs only;
5. fresh Solution Revision and fresh Reviewer invocations;
6. same Problem Package/source/baseline provenance;
7. no new gameplay run before an effective READY route;
8. configuration execution consumes revised accepted option when continuation reaches READY;
9. final escalation retains the full continuation evidence chain;
10. final non-escalation routes do not create HFL items;
11. total Participant jobs never exceed 11;
12. existing base workflow behavior is unchanged when no continuation triggers;
13. historical V1 contracts/manifests/reports remain readable.

### 20.2 Controlled historical replay

Before fresh ordinary-run observation, use available fixed historical cases to verify the new flow structurally.

The replay evaluation is qualitative and boundary-focused:

- Did the continuation perform the concrete bounded work Reviewer asked for?
- Did it avoid fabricating unavailable evidence?
- Did it preserve Human authority?
- Did it avoid an infinite loop?
- Did it produce a more actionable terminal state, even when that state is still DEFER or ESCALATE?

Do **not** score success by deterministic hypothesis/solution equality or READY rate.

### 20.3 Fresh ordinary runs

Fresh ordinary sessions are **not required for initial engineering acceptance**.

After deterministic tests and controlled replay pass, a separate Human-approved observation batch may evaluate natural behavior. That batch is an effectiveness validation, not part of this implementation's mechanical correctness gate.

---

## 21. Success Criteria

Bounded More-Work Continuation v1 is successful when:

- `REQUEST_MORE_WORK` no longer necessarily means an immediate dead end;
- one bounded continuation can consume current-context Reviewer feedback;
- legitimate `DEFER`, `ESCALATE`, `REJECT`, and no-action outcomes remain intact;
- Human authority is not weakened;
- no unlimited Participant loop exists;
- no new sample/run is silently manufactured;
- provenance remains fully auditable;
- existing historical artifacts remain valid;
- the feature improves the probability of meaningful product-improvement progression without requiring deterministic LLM outputs.

It is **not** required that every continued case becomes executable or that every model response is correct.

---

## 22. Implementation Scope Boundary

A future implementation plan may touch only the components required for:

- review-continuation orchestration;
- Revision Solution prompt/execution;
- re-review prompt/execution;
- continuation artifacts/contracts;
- multi-round manifest/session observability versioning;
- effective-route execution handoff;
- HFL retention of continuation evidence;
- formal product/governance authority updates;
- tests and controlled replay.

It must not include unrelated Selection tuning, new DeepSeek experiments, content changes, gameplay balancing, new autonomous program-write permission, generic work queues, or full-P3 platform work.

---

## 23. Decision Summary

```text
FEATURE = Bounded More-Work Continuation v1

TRIGGER = first Reviewer REQUEST_MORE_WORK in a multi-round session

MAX_CONTINUATIONS_PER_SESSION = 1
MAX_CONTINUATION_PARTICIPANT_JOBS = 2
MAX_TOTAL_PARTICIPANT_JOBS = 11

REVISION = fresh Solution invocation
RE_REVIEW = fresh Reviewer invocation only if revised Solution returns OPTIONS

SECOND_REQUEST_MORE_WORK = terminal DEFER_MORE_WORK_REQUESTED

NEW_GAMEPLAY_SAMPLE_FOR_CONTINUATION = NO
SAME_THREAD_SEMANTIC_RESUME = NO

HFL_TRIGGER_SCOPE_CHANGED = NO
PD_111_SCOPE_CHANGED = NO
FULL_P3_REOPENED = NO

SUCCESS_METRIC = bounded useful progression with preserved safety/authority,
not deterministic LLM output and not READY rate
```
