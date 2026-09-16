# Auto Evolution Candidate-local Participant Failure Isolation v1

## 1. Status

**Status: HUMAN ACCEPTED — 2026-09-16. Authority sync is required before runtime implementation.**

This design narrows the failure-containment behavior introduced by PD-118 for one evidence-backed case: a Candidate Participant completes its invocation, but the Host rejects that candidate's unaccepted structured output for a deterministic output-conformance defect.

This document is Human-accepted design, but it is not yet current product authority or runtime implementation authorization. Until the required authority sync is recorded, current PD-118 behavior remains authoritative in the repository: Participant failure is fail-closed at the Pool / Logical Session boundary.

The proposed product objective is:

> Preserve fail-closed behavior for failures that can affect Pool / Session integrity, while preventing a mechanically proven candidate-local output rejection from permanently discarding unrelated PENDING candidates from the same exact sealed source.

This design does not authorize semantic retry, output repair, reference guessing, model switching, or autonomous recovery of the failed candidate.

---

## 2. Evidence and Problem Statement

### 2.1 Natural evidence reviewed

The design investigation reviewed three natural ordinary runs from 2026-09-16, but they do not represent three equivalent current-baseline failures.

- `ordinary-run-20260916-000001` occurred on the earlier `ff096986...` baseline. A recoverable Codex reconnect event was interpreted as a failed turn even though the stream later completed normally. Commit `43c8b5bb...` (`fix: tolerate recoverable codex reconnect events`) corrected that provider-stream behavior.
- `ordinary-run-20260916-000003` also occurred before the current baseline. The Solution output omitted required root-level `repoRefs` / `artifactRefs`; commit `7c09bb4...` (`fix: deliver solution work schema to participants`) added explicit SolutionWorkV1 schema guidance for those fields.
- `ordinary-run-20260916-000004` ran on `dev@5b7b5a20...`, after both corrections. The Solution produced a structurally complete result, but one nested repository reference used `src/data/identity-year-events.json` instead of the existing `src/data/lines/identity-year-events.json`. Host reference validation rejected the result. The active candidate became `INTERRUPTED`, the Pool became `INTERRUPTED`, the Logical Session became `FAILED`, and six unrelated candidates remained `PENDING` and could not be resumed through the ordinary operator.

Therefore the current evidence does **not** establish a generalized high rate of equivalent Participant failures. It does establish one current-baseline blast-radius mismatch:

```text
candidate-local unaccepted output defect
→ active candidate interrupted
→ entire Source-local Pool interrupted
→ Logical Session failed
→ unrelated PENDING candidates become unreachable
```

### 2.2 Root design issue

The problem is not that the Host rejects invalid references. Reference validation is required and must remain strict.

The problem is that current scheduling couples three distinct facts:

```text
Candidate.INTERRUPTED
Pool.INTERRUPTED
Session.FAILED
```

PD-118 intentionally chose this conservative coupling for v1 and explicitly listed candidate-level Participant-failure isolation as a re-discussion condition. The observed `000004` run satisfies that condition strongly enough to reopen the containment boundary, without proving or authorizing broader retry / recovery behavior.

---

## 3. Existing Authority and Required Authority Change

### 3.1 Authority that remains unchanged

The following current semantics remain authoritative and are not reopened by this design:

- PD-111 player-observable / bounded diagnostic evidence boundary;
- PD-117 continuation shape and immutable base Decision;
- PD-118 deterministic source-order Candidate Activation;
- one ACTIVE candidate at a time;
- ordinary semantic retry remains `0`;
- existing same-thread envelope retransmission remains a separate, already-authorized serialization recovery mechanism;
- candidate identity remains Source-Epoch-local and is not rebound across Source changes;
- READY_FOR_CONFIG_EXECUTION remains a source-change barrier;
- one source-changing transition per Logical Session remains the current authority ceiling;
- repository / provenance / scope / deterministic verification / sealed-source integrity failures remain fail-closed;
- Participant output never gains routing authority until Host validation accepts it;
- unresolved Participant failure does not automatically create Human Follow-up state;
- Run Report remains deterministic observability, not reasoning or routing authority.

### 3.2 Accepted authority change requiring repository sync

PD-118 currently states that Participant failure remains fail-closed and that v1 does not authorize skipping a failed candidate and continuing the Pool.

The Human-accepted design establishes one narrow exception that must now be recorded in repository authority:

> When the Host can deterministically prove that a Participant invocation completed normally and the only failure is a bounded, candidate-local output-conformance rejection, the active candidate may terminate as `INTERRUPTED` while the Source-local Candidate Pool remains `PROCESSING`.

This is not “skip any failed candidate.” It is a new containment rule for one mechanically classified failure family.

Authority sync must now record this as a **new Product Decision** (proposed `PD-119: Candidate-local Participant Output Rejection Isolation v1`) that locally supersedes only PD-118's blanket Participant-failure fail-closed statement. PD-118 remains historical accepted authority for the rest of the Source-local Candidate Pool model.

`docs/product/auto-evolution-model.md` must then be updated to reflect the new current first-layer product semantics.

No runtime implementation should precede that authority sync.

---

## 4. Goals

1. Preserve unrelated PENDING candidates when a failed active candidate is proven to have only a local output-conformance defect.
2. Keep the failed candidate terminal and non-authoritative; do not repair or retry it.
3. Preserve fail-closed behavior whenever Pool / Session safety cannot be mechanically proven.
4. Make containment depend on typed Host facts, not diagnostic error strings.
5. Reuse existing Candidate / Pool / Session lifecycle states wherever they already express the required semantics.
6. Preserve crash consistency: failure evidence and candidate interruption must be durable before a later candidate can activate.
7. Apply the same containment semantics to initial Solution, initial Reviewer, bounded revision Solution, and bounded re-reviewer execution.
8. Keep Human observability explicit: completed Sessions may still contain interrupted candidates, and reports must show that fact directly.

---

## 5. Non-Goals

This v1 does not:

- add semantic retry;
- retry malformed schema or invalid refs;
- ask the same Participant to repair its output;
- guess, normalize, or automatically correct repository / artifact references;
- loosen repoRef or artifactRef validation;
- continue after runtime, provider-protocol, provenance, scope, verification, sealed-source, repository-integrity, or unclassified failures;
- add a failure-count circuit breaker;
- create `PARTIAL_SUCCESS`, `COMPLETED_WITH_FAILURES`, `DEGRADED`, or other new Logical Session states;
- create a new Candidate processing state;
- create a generic recovery framework or queue;
- create automatic HFL items for isolated output rejection;
- change Source-change, continuation, budget, or evidence authority;
- change Candidate ordering, Selection, ranking, dedupe, or priority;
- modify product code, game behavior, or Participant reasoning prompts merely to reduce failure frequency.

---

## 6. Core Design Decision

The Host must distinguish **candidate terminal failure** from **Pool safety failure**.

The proposed invariant is:

```text
candidate-local output rejection
!= Pool interruption
!= Logical Session failure
```

A failed Participant result remains fully rejected. Isolation changes only the blast radius of that rejected result.

### 6.1 Candidate-local terminal kind

The design uses the conceptual classification:

```text
CANDIDATE_OUTPUT_REJECTED
```

This classification means:

- the Participant invocation completed sufficiently for the Host to enter formal output validation;
- the output never became an accepted Solution / Review / Decision;
- the defect is confined to the current candidate's returned representation;
- all relevant cross-candidate integrity invariants remain valid;
- durable failure evidence exists;
- the Host can continue the Pool without using, repairing, or interpreting the rejected semantic content.

`CANDIDATE_OUTPUT_REJECTED` is a failure-containment classification, **not** a new Candidate lifecycle state. The Candidate lifecycle remains `INTERRUPTED`.

### 6.2 Fail-closed default

Anything not mechanically proven to satisfy the local classification remains fail-closed.

The default rule is therefore:

```text
unknown / ambiguous failure
→ SESSION_FAIL_CLOSED
```

Safety is established positively; it is not inferred from absence of a known bad substring.

---

## 7. Typed Failure Classification

Containment must not be decided from `message`, `String(error)`, `ENOENT` text, or the existing coarse `errorKind === "invalid_output"` value.

The earliest component that has enough structured facts must produce a typed failure origin / reason. Higher layers map those typed facts to containment.

A minimal conceptual taxonomy is:

```text
FailureOrigin
  PARTICIPANT_RUNTIME
  PROVIDER_PROTOCOL
  OUTPUT_ENVELOPE
  OUTPUT_SCHEMA
  OUTPUT_IDENTITY
  OUTPUT_INTERNAL_CONSISTENCY
  OUTPUT_REFERENCE
  REPOSITORY_INTEGRITY
  SOURCE_PROVENANCE
  HOST_INFRASTRUCTURE
  VERIFICATION
  UNKNOWN
```

Reference failure requires a more specific reason:

```text
ReferenceFailureReason
  MALFORMED_LOCATOR
  MISSING_TARGET
  NOT_REGULAR_FILE
  ABSOLUTE_PATH
  ESCAPES_ALLOWED_ROOT
  IO_ERROR
```

Exact names may be adjusted during implementation planning, but the semantic distinctions are normative.

### 7.1 Candidate-local output rejection

The following are eligible for `CANDIDATE_OUTPUT_REJECTED`, subject to all integrity preconditions in section 8:

| Failure origin | Eligible case |
| --- | --- |
| `OUTPUT_ENVELOPE` | Participant runtime completed; approved envelope retransmission is unavailable by policy/capability or completed normally but final terminal payload is still empty / invalid JSON / non-object. A retransmission runtime failure is not eligible. |
| `OUTPUT_SCHEMA` | Formal role schema rejects the terminal object: missing field, invalid type, invalid enum, structurally invalid role payload. |
| `OUTPUT_INTERNAL_CONSISTENCY` | Output is internally inconsistent within the current candidate, e.g. Reviewer accepts an option id not present in the supplied SolutionWork. |
| `OUTPUT_REFERENCE` + `MALFORMED_LOCATOR` | Participant uses an invalid reference locator syntax that does not itself escape authority scope. |
| `OUTPUT_REFERENCE` + `MISSING_TARGET` | Reference stays within the allowed root and Host cross-check proves the target is absent from the corresponding authoritative / canonical source root, not merely missing from a disposable copy. |
| `OUTPUT_REFERENCE` + `NOT_REGULAR_FILE` | Reference stays within the allowed root and Host cross-check proves the target is not a regular file in the corresponding authoritative / canonical source root. |

These defects reject only the returned candidate output. They do not authorize Host interpretation of what the Participant “probably meant.”

### 7.2 Mandatory session fail-closed

The following continue to terminate the Pool / Logical Session fail-closed:

| Failure origin | Required handling |
| --- | --- |
| `PARTICIPANT_RUNTIME` | `runtime_unavailable`, process start/exit failure, timeout, or equivalent runtime failure. |
| `PROVIDER_PROTOCOL` | provider stream / turn protocol failure, missing completed turn, `turn.failed`, thread identity mismatch, continuation protocol mismatch, or equivalent failure before formal role-output validation. |
| envelope recovery runtime failure | same-thread retransmission times out, fails to start, fails the continuation protocol, or otherwise does not complete normally. |
| `OUTPUT_IDENTITY` | `problemId` or other cross-task / cross-candidate identity mismatch. |
| `OUTPUT_REFERENCE` + `ABSOLUTE_PATH` | reference violates the allowed relative-path boundary. |
| `OUTPUT_REFERENCE` + `ESCAPES_ALLOWED_ROOT` | `..` or equivalent resolution escapes the allowed root. |
| `OUTPUT_REFERENCE` + `IO_ERROR` | unexpected filesystem error that is not deterministically a missing / non-regular target. |
| `REPOSITORY_INTEGRITY` | authoritative repository fingerprint changes or equivalent repository-integrity invariant fails. |
| `SOURCE_PROVENANCE` | sealed source, source fingerprint, hypothesis mapping, baseline, or source provenance cannot be verified. |
| `HOST_INFRASTRUCTURE` | Skill delivery, workspace preparation/materialization, required artifact copy, durable-write prerequisite, or equivalent Host infrastructure failure. |
| `VERIFICATION` | existing deterministic verification / source-transition verification failure. |
| `UNKNOWN` | any failure whose origin cannot be reliably classified. |

The current broad `WorkspaceAgentJobFailure.errorKind` remains diagnostic / compatibility information and is insufficient by itself to decide containment.

---

## 8. Integrity Preconditions for Candidate-local Isolation

A locally classifiable output defect is isolatable only when all applicable invariants are proven.

### 8.1 Invocation completion boundary

The Host must distinguish failures that happen **before** formal role-output validation from failures discovered **during** role-output validation.

For Solution, provider-specific JSON stream decoding / turn identity happens before structured terminal envelope validation. A provider-protocol failure that currently surfaces as `invalid_output` is therefore not equivalent to a malformed `SolutionWorkV1` payload.

For Reviewer, raw Participant completion must similarly be distinguished from subsequent review parsing / validation.

### 8.2 Repository integrity

The authoritative repository fingerprint captured before Participant execution must remain unchanged after Participant execution.

If the fingerprint check fails, the failure is never candidate-local, regardless of the Participant's returned output.

### 8.3 Candidate / Problem identity

Current candidate identity, `hypothesisId`, source index, Problem Package identity, and other cross-task bindings must remain exact.

An output that claims another `problemId` is fail-closed rather than locally repaired or ignored.

### 8.4 Reference target cross-check

`ENOENT` in a disposable Participant workspace is not sufficient evidence of Participant typo.

Before `MISSING_TARGET` or `NOT_REGULAR_FILE` can become candidate-local, the Host must prove the same target is absent / non-regular in the corresponding canonical source:

- repoRef: authoritative repository baseline;
- artifactRef: authoritative candidate artifact root or other formal artifact source that owns the reference.

If the canonical source contains a valid target but the disposable workspace does not, the failure is Host workspace/materialization integrity and must fail closed.

### 8.5 No accepted downstream authority

An isolatable failure must occur before any accepted effective Decision, HFL creation, source transition, authoritative mutation, or equivalent downstream routing authority is produced from the rejected Participant output.

No downstream artifact may treat rejected semantic content as accepted evidence.

---

## 9. Candidate / Pool / Session Lifecycle

No new Candidate, Pool, Host Slice, or Logical Session enum is required.

### 9.1 Local output rejection with remaining candidates

```text
ACTIVE candidate
→ durable CANDIDATE_OUTPUT_REJECTED evidence
→ candidate ACTIVE → INTERRUPTED
→ Pool remains PROCESSING
→ return to ordinary candidate-boundary admission
```

If Host-slice budget can admit the next candidate, processing continues in source order.

If budget cannot admit another candidate, the Host Slice / Logical Session pauses normally with `HOST_SLICE_BUDGET`; the Pool remains `PROCESSING` and ordinary resume semantics apply.

### 9.2 Pool exhaustion

`INTERRUPTED` is a terminal Candidate processing state.

If no Candidate remains `PENDING` or `ACTIVE`, the Pool becomes `EXHAUSTED` even when one or more Candidates are `INTERRUPTED`.

Example:

```text
candidate-1 COMPLETED
candidate-2 INTERRUPTED
candidate-3 COMPLETED
candidate-4 INTERRUPTED
pending=0
active=0
→ Pool EXHAUSTED
→ Logical Session COMPLETED
```

`COMPLETED` means workflow processing finished. It does not mean all Candidates succeeded or produced Decisions.

Reports must surface the interrupted count and failure details directly; Session state must not be overloaded into a quality verdict.

### 9.3 True Pool interruption

Pool `INTERRUPTED` is reserved for failures where the Host can no longer prove that activating another candidate is safe.

Conceptually:

```text
Candidate.INTERRUPTED
= this candidate did not produce an accepted terminal Decision

Pool.INTERRUPTED
= this Source-local Pool cannot safely continue

Session.FAILED
= this Logical Session hit a fail-closed boundary
```

A candidate-local output rejection only implies the first line.

### 9.4 No failure-count circuit breaker in v1

This design does not infer a systemic failure from an arbitrary count of local rejections.

A run with eight candidates and eight deterministically isolated output rejections may therefore end:

```text
Pool EXHAUSTED
Session COMPLETED
completed=0
interrupted=8
```

That is a poor operational result but not, by itself, a Host-integrity failure. If natural evidence later shows a need for systemic-failure circuit breaking, that is a separate authority decision.

---

## 10. Source-change Interaction

A previously interrupted candidate remains terminal history for its Source Epoch.

If a later candidate reaches effective `READY_FOR_CONFIG_EXECUTION` and the existing authorized source transition succeeds:

- the earlier interrupted candidate remains `INTERRUPTED`;
- only still-`PENDING` candidates are superseded by Source change under existing PD-118 semantics;
- the interrupted candidate is not retried, rebound, or migrated to Source B;
- Source B forms a fresh Feedback / Hypothesis / Candidate Pool from the new sealed source.

No cross-Source recovery semantics are introduced.

---

## 11. Bounded Continuation Interaction

The same failure-containment rule applies to all Participant positions inside one Candidate Lane:

```text
initial Solution
initial Reviewer
bounded revision Solution
bounded re-reviewer
```

A candidate-local output rejection in any of these positions terminates that candidate as `INTERRUPTED` and may allow the Pool to continue.

Runtime / provider / integrity failures in any of these positions remain fail-closed.

PD-117 / PD-118 continuation constraints remain unchanged:

- at most one bounded continuation per Candidate Lane;
- base Decision remains immutable;
- second `REQUEST_MORE_WORK` remains terminal `DEFER_MORE_WORK_REQUESTED`;
- ordinary semantic retry remains `0`;
- envelope retransmission remains separate transport/serialization recovery.

---

## 12. Durable Failure Evidence and Crash Consistency

### 12.1 Persist typed classification

Containment must be reconstructable from durable facts; it must not exist only in an in-memory return value.

The active writer should therefore persist a new candidate-lane failure artifact version (proposed `candidate-lane-failure-v2`) containing at least:

```text
candidateRef
hypothesisId
sourceIndex
stage
participantJobs
retryCount = 0
failureOrigin
failureReason
containment = CANDIDATE_LOCAL | SESSION_FAIL_CLOSED
participantErrorKind (diagnostic / compatibility, when available)
message (diagnostic only)
```

Exact field names may be finalized in implementation planning. The normative requirement is that origin / reason / containment are stable structured facts and `message` is never the authority for routing.

Historical `candidate-lane-failure-v1` artifacts remain immutable historical evidence. Readers that need to support both generations must not reinterpret historical v1 failures as candidate-local automatically.

### 12.2 Write ordering

Before the Host may activate another candidate after local rejection, it must durably complete:

```text
Participant / role failure evidence
→ typed candidate-lane terminal failure artifact
→ Candidate ACTIVE → INTERRUPTED Pool transition persisted
→ only then next candidate activation
```

A crash between failure observation and durable interruption must not cause the Host to silently treat an ACTIVE candidate as safely skipped.

### 12.3 Resume / reconciliation

Existing deterministic reconciliation remains conservative:

- complete Contract-valid terminal artifacts may reconcile normally;
- complete typed `CANDIDATE_OUTPUT_REJECTED` evidence may reconcile the Candidate to `INTERRUPTED` while preserving a `PROCESSING` Pool;
- incomplete / ambiguous terminal evidence remains interrupted/fail-closed and must not be converted into a local rejection by inference;
- historical v1 Participant failure artifacts do not gain new local-isolation semantics retroactively.

---

## 13. Minimal Contract / Code Boundary

The design intentionally avoids broad state-model changes.

### 13.1 No Candidate / Pool / Session schema enum expansion

Existing states are sufficient:

- Candidate: `INTERRUPTED` already exists;
- Pool: `PROCESSING` can coexist with interrupted candidates;
- `EXHAUSTED` already means no `PENDING` / `ACTIVE` candidate remains;
- Logical Session `COMPLETED` already expresses finished workflow processing.

The implementation should not add a parallel failure lifecycle unless a concrete existing invariant makes the above representation impossible.

### 13.2 Required behavioral separation

Current implementation couples Candidate interruption and Pool interruption in the same transition helper. Implementation must separate:

```text
candidate-local interruption
→ Candidate INTERRUPTED + Pool PROCESSING

fail-closed interruption
→ Candidate/Pool interruption + Session FAILED/INTERRUPTED as current authority requires
```

The exact helper names are not product semantics.

### 13.3 Typed validation propagation

Solution / Reviewer / continuation runners must expose enough typed failure information for the Host to distinguish:

- runtime / provider failures;
- envelope / role-schema failures;
- identity failures;
- internal-consistency failures;
- reference failure reasons;
- Host/integrity failures.

Do not implement this by parsing exception-message text in `runMultiCandidateSessionSlice` or reporting code.

---

## 14. Observability Semantics

A six-file observability correction was reviewed in the supplied `project(10).zip` working tree after `000004`, but as of this design baseline the authoritative remote `dev` branch is still `5b7b5a20...` and does not yet contain that patch. Therefore this design treats that patch as a reviewed compatible candidate implementation, not as current repository truth.

Its core projection rule remains compatible with this design: failure details should be derived deterministically from durable workflow facts, and operator/report output should expose the actual failed candidate, stage, kind/cause, and evidence without changing routing semantics. A future implementation may incorporate or supersede that local patch, but must re-verify it against the then-current `dev` branch.

For an isolated failure, reports / operator output should make both facts visible:

```text
candidate=hypothesis-000002
stage=SOLUTION
failureOrigin=OUTPUT_REFERENCE
failureReason=MISSING_TARGET
containment=CANDIDATE_LOCAL
cause=repoRef does not exist: src/data/identity-year-events.json
```

and later:

```text
sessionState=COMPLETED
poolStatus=EXHAUSTED
completed=7
interrupted=1
```

These facts are not contradictory: one Candidate failed while the workflow finished processing the Pool.

Canonical report identity / historical report immutability remain unchanged unless implementation planning proves a schema change is strictly necessary. Human-readable projections may derive typed failure details from durable failure artifacts.

---

## 15. Rejected Alternatives

### 15.1 Keep blanket Participant fail-closed

Rejected because `000004` demonstrates a current-baseline case where one unaccepted candidate-local reference defect permanently discards unrelated PENDING candidates, despite no repository / source / routing integrity loss.

### 15.2 Isolate every Participant failure

Rejected because runtime unavailable, timeout, provider protocol, identity, scope, provenance, workspace, and verification failures are not proven candidate-local and may indicate shared infrastructure / integrity failure.

### 15.3 Use `errorKind === "invalid_output"`

Rejected because current `invalid_output` spans multiple execution layers, including provider-protocol interpretation before formal structured output validation.

### 15.4 Parse diagnostic messages

Rejected because error-message wording is not a stable workflow contract and can silently broaden or narrow safety boundaries.

### 15.5 Auto-fix refs or retry Participant output

Rejected because it changes semantic-retry / repair authority, can mutate Participant meaning, and is unnecessary to solve the observed blast-radius problem.

### 15.6 Add `PARTIAL_SUCCESS` Session state

Rejected because Logical Session state is workflow lifecycle, not a synthesized Candidate quality verdict. Existing candidate counts already preserve the relevant facts.

### 15.7 Add an interruption threshold / circuit breaker now

Rejected for v1 because no natural evidence supports a correct threshold. Revisit only if repeated isolated failures show a distinct systemic runtime/operator need.

---

## 16. Validation Strategy for Future Implementation

Implementation acceptance must cover at least these cases.

### 16.1 Candidate-local cases

- Solution envelope remains malformed after authorized envelope handling → Candidate `INTERRUPTED`, Pool continues.
- Solution schema missing required field → Candidate `INTERRUPTED`, Pool continues.
- Reviewer schema / parse failure after normal Participant completion → Candidate `INTERRUPTED`, Pool continues.
- Reviewer accepts nonexistent current Solution option → Candidate `INTERRUPTED`, Pool continues.
- in-root repoRef missing from both Participant workspace and authoritative repository baseline → Candidate `INTERRUPTED`, Pool continues.
- in-root artifactRef missing from both candidate artifact source and Participant workspace → Candidate `INTERRUPTED`, Pool continues.
- same behaviors during bounded continuation → Candidate `INTERRUPTED`, Pool continues.

### 16.2 Fail-closed cases

- Participant executable unavailable;
- process non-zero exit;
- Participant timeout;
- Solution provider stream / completed-turn protocol failure;
- same-thread envelope retransmission runtime / continuation failure;
- `problemId` mismatch;
- absolute repoRef / artifactRef;
- reference escapes allowed root;
- unexpected filesystem I/O error;
- authoritative repository fingerprint mutation;
- source / hypothesis / workspace baseline mismatch;
- Skill delivery / workspace materialization failure;
- incomplete or ambiguous ACTIVE-candidate terminal artifacts during reconciliation.

Each must preserve current Session fail-closed behavior.

### 16.3 Lifecycle cases

- local interruption + budget available → next PENDING candidate activates in source order;
- local interruption + insufficient Host-slice budget → normal `PAUSED / HOST_SLICE_BUDGET`, then exact resume;
- final candidate locally interrupted → Pool `EXHAUSTED`, Session `COMPLETED`;
- mixed completed / interrupted candidates → Pool `EXHAUSTED`, Session `COMPLETED`, counts accurate;
- all candidates locally interrupted → Pool `EXHAUSTED`, Session `COMPLETED`, counts accurate;
- later READY candidate after earlier interruption → normal source-change barrier; earlier interrupted candidate remains terminal and is not rebound;
- crash after typed failure persistence but before next activation → deterministic reconcile to Candidate `INTERRUPTED`, Pool remains resumable/processable;
- crash with incomplete failure evidence → fail closed, never infer local rejection.

### 16.4 Regression boundaries

Verification must also prove no change to:

- ordinary semantic retry count;
- envelope retransmission policy;
- candidate order;
- evidence scope;
- HFL trigger scope;
- source-transition count / authority;
- reference validation strictness;
- repository/provenance/scope/verification fail-closed behavior;
- historical artifact interpretation.

---

## 17. Authority Sync Required Before Runtime Implementation

This design is Human accepted. Formal authority sync must occur before runtime implementation:

1. Add a new product decision, proposed `PD-119: Candidate-local Participant Output Rejection Isolation v1`.
2. State that PD-119 locally supersedes only PD-118's blanket Participant-failure fail-closed / no-failed-candidate-continuation clause.
3. Preserve PD-118 Candidate Pool, ordering, budget, source-change, resume, evidence, and ordinary semantic-retry semantics.
4. Update `docs/product/auto-evolution-model.md` § Source-local Candidate Pool / Multi-candidate Session so current first-layer authority reflects candidate-local isolation.
5. Explicitly retain fail-closed behavior for runtime/provider protocol, cross-task identity, scope, repository/provenance/workspace integrity, verification, sealed-source, and unknown failures.
6. Record that `COMPLETED` means workflow processing finished and may coexist with interrupted Candidates.
7. Record that no retry / auto-repair / HFL creation is authorized by this change.

Implementation planning may now use this Human-accepted design as its fixed design input, but runtime implementation must not begin until the authority sync above is present in the implementation worktree.

---

## 18. Design Acceptance Criteria

Human review on 2026-09-16 confirmed all of the following design acceptance criteria:

- `000004` is treated as the motivating current-baseline blast-radius case, not evidence of three identical current failures;
- only deterministically proven candidate-local output conformance is isolatable;
- typed classification, not diagnostic messages or coarse `invalid_output`, controls containment;
- scope / identity / runtime / provider / integrity / verification / unknown failures remain fail-closed;
- missing reference targets require canonical-source cross-check before local isolation;
- isolated Candidate state is `INTERRUPTED`; Pool remains `PROCESSING` while PENDING work exists;
- Pool `EXHAUSTED` / Session `COMPLETED` are valid even when interrupted Candidate count is non-zero;
- no new Candidate / Pool / Session enum is introduced for v1;
- semantic retry remains zero and no automatic repair is introduced;
- durable typed failure evidence precedes later Candidate activation;
- authority is synchronized before runtime implementation.
