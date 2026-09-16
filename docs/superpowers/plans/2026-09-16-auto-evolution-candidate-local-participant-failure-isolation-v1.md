# Auto Evolution Candidate-local Participant Failure Isolation v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Human-accepted PD-119 containment rule so mechanically proven candidate-local Participant output rejections interrupt only the active Candidate while preserving strict fail-closed behavior for runtime, provider-protocol, identity, scope, repository/provenance, Host-infrastructure, verification, sealed-source, and unknown failures.

**Architecture:** Add a typed Participant/output failure layer and a durable `candidate-lane-failure-v2` contract. Candidate-local containment is derived only from typed origin/reason facts that can be mechanically verified; the scheduler consumes the validated containment fact to choose either `Candidate.INTERRUPTED + Pool.PROCESSING` or the existing Pool/Session fail-closed path. No new Candidate, Pool, or Session enum is introduced; crash reconciliation reads the same durable typed failure artifact.

**Tech Stack:** TypeScript 5.9, Node.js `fs/promises` / `path`, `tsx` test runners, existing Auto Evolution contracts and Host state machine.

**Spec:** `docs/superpowers/specs/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1-design.md`

## Global Constraints

- Runtime implementation MUST NOT begin until the accepted design, PD-119, and `docs/product/auto-evolution-model.md` authority sync are present in the implementation worktree.
- Current implementation truth at plan creation is `dev@5b7b5a20a4f7fdb923f89489d356e3d5ffbdec4a`; re-read `dev` before execution and reconcile later changes instead of assuming this SHA is still current.
- Ordinary semantic retry remains exactly `0`.
- Existing Solution same-thread envelope retransmission remains separate serialization recovery and MUST NOT be expanded to Reviewer or semantic repair by this plan.
- Do not guess, rewrite, normalize, or auto-correct Participant output or repository/artifact references.
- Do not loosen repoRef or artifactRef validation.
- Do not add Candidate / Pool / Logical Session states such as `PARTIAL_SUCCESS`, `COMPLETED_WITH_FAILURES`, or `DEGRADED`.
- Candidate-local rejection MUST NOT create Human Follow-up state.
- PD-111 evidence scope, PD-117 continuation shape, PD-118 source order / budget / source-change / resume semantics, and the one-source-transition ceiling remain unchanged except for the exact PD-119 containment rule.
- Containment MUST NOT depend on `message.includes(...)`, `String(error)`, `ENOENT` text, or coarse `errorKind === "invalid_output"` alone.
- Historical `candidate-lane-failure-v1` artifacts MUST NOT be reinterpreted as candidate-local.
- A local missing/non-regular repoRef is isolatable only after the Host proves the same target is missing/non-regular in the authoritative repository root; workspace-only absence is fail-closed Host infrastructure failure.
- Durable Participant/Role evidence and `candidate-lane-failure-v2` MUST be retained before persisting the Candidate `ACTIVE → INTERRUPTED` transition; that transition MUST be durable before a later Candidate activates.
- Do not bundle the previously reviewed GameEngine `WUXIA_ENGINE_QUIET` local patch into this feature. If that unrelated local patch exists in the execution worktree, preserve it without making it part of PD-119 commits.

---

## File Map

### New files

- `docs/superpowers/specs/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1-design.md` — accepted design.
- `docs/superpowers/plans/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1.md` — this implementation plan.
- `scripts/evolution/problemAgnosticSolution/participantFailureClassification.ts` — typed failure facts and output-validation error helpers.
- `scripts/evolution/candidateLaneFailureContract.ts` — durable `candidate-lane-failure-v2` validation and containment mapping.
- `tests/evolution/candidateLaneFailureContract.test.ts` — durable failure contract and mapping tests.
- `tests/evolution/repoReferenceClassification.test.ts` — reference classification/canonical-source cross-check tests.

### Existing files expected to change

- `docs/governance/product-decisions.md` — PD-119 authority.
- `docs/product/auto-evolution-model.md` — current first-layer AE semantics.
- `scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts` — typed failure facts for runtime/protocol/envelope/schema/accepted-result failures.
- `scripts/evolution/problemAgnosticSolution/repoReference.ts` — typed repoRef errors and authoritative-root cross-check.
- `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts` — typed identity/reference failures and authoritative repository root.
- `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts` — typed completed-output validation and references.
- `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts` — propagate typed revision/re-reviewer Participant failures.
- `scripts/evolution/runCandidateLane.ts` — write durable candidate-lane v2 terminal failure evidence.
- `scripts/evolution/runCandidateReviewContinuation.ts` — write durable v2 evidence for continuation Participant failures.
- `scripts/evolution/candidatePoolState.ts` — add local Candidate interruption that leaves Pool `PROCESSING`.
- `scripts/evolution/runMultiCandidateSessionSlice.ts` — consume validated containment and continue/pause/exhaust correctly.
- `scripts/evolution/reconcileCandidateSession.ts` — deterministic recovery from complete local-failure v2 evidence.
- `scripts/evolution/reporting/buildMultiCandidateOperationalRunReport.ts` — Human-readable typed isolated-failure projection.
- `scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts` — archive the same Human-readable failure projection without changing canonical `report.json` schema unless an existing contract requires it.
- `scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts` — terminal output for typed candidate-local interruption facts.
- `tests/evolution/agentParticipant.test.ts` only if helper-level classification requires coverage there; do not change the `WorkspaceAgentJobFailure` public shape unless implementation proves unavoidable.
- `tests/evolution/envelopeRetransmission.test.ts` — output-envelope/runtime distinction.
- `tests/evolution/solutionAgentLoop.test.ts` — Solution typed output failure cases.
- `tests/evolution/solutionReviewerLoop.test.ts` — Reviewer typed output failure cases.
- `tests/evolution/reviewContinuation.test.ts` — typed continuation Participant failure propagation.
- `tests/evolution/candidateLane.test.ts` — v2 durable workflow outcome.
- `tests/evolution/candidateReviewContinuation.test.ts` — continuation v2 durable workflow outcome.
- `tests/evolution/candidatePoolContract.test.ts` — local interruption + exhaustion semantics.
- `tests/evolution/candidateSessionReconciliation.test.ts` — v2 local reconciliation and v1 fail-closed compatibility.
- `tests/evolution/multiCandidateSessionSlice.test.ts` — scheduler continuation/pause/exhaust/fail-closed behavior.
- `tests/evolution/multiCandidateOperationalRunReport.test.ts` — isolated failure observability.
- `tests/evolution/multiCandidateReportArchive.test.ts` — archived Human-readable evidence.
- `tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts` — operator terminal facts.

---

### Task 1: Land the accepted authority before runtime code

**Files:**
- Create: `docs/superpowers/specs/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1-design.md`
- Create: `docs/superpowers/plans/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/product/auto-evolution-model.md`

**Interfaces:**
- Consumes: Human-accepted design from 2026-09-16 and the authority-sync brief supplied with this plan.
- Produces: repository authority that explicitly authorizes only typed candidate-local output-rejection isolation; all runtime tasks depend on this authority being present.

- [ ] **Step 1: Re-read current authority and verify PD-119 is still the next valid decision number**

Run:

```bash
git switch dev
git pull --ff-only
git status --short
grep -n "^### PD-11[89]" docs/governance/product-decisions.md
grep -n "Source-local Candidate Pool / Multi-candidate Session" docs/product/auto-evolution-model.md
```

Expected: clean worktree before feature work; if another accepted PD has already consumed `PD-119`, use the next unused PD number but preserve the accepted semantics exactly and update this plan/spec references consistently before proceeding.

- [ ] **Step 2: Add the accepted design and this plan verbatim**

Copy the Human-accepted design into the spec path with this status line:

```markdown
**Status: HUMAN ACCEPTED — 2026-09-16. Authority sync is required before runtime implementation.**
```

Copy this plan into the plan path. Do not edit the accepted semantics while copying.

- [ ] **Step 3: Add the new Product Decision**

Append the exact accepted PD-119 text from `2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-authority-sync.md`. The decision MUST include these normative statements:

```text
completed Participant output conformance + proven integrity
→ Candidate.INTERRUPTED
→ Pool remains PROCESSING

runtime / provider protocol / cross-task identity / scope /
repository-provenance-workspace integrity / verification /
sealed-source / unknown
→ Pool / Logical Session fail closed
```

It MUST explicitly preserve `semanticRetryCount = 0`, PD-111, PD-117 continuation shape, PD-118 source order/budget/source change, and PD-100 HFL scope.

- [ ] **Step 4: Update first-layer Auto Evolution semantics minimally**

In `docs/product/auto-evolution-model.md`, update the header to the PD-119 authority-sync date and add the accepted containment paragraph in §2.5.1. Replace only the blanket Participant-failure sentence; do not restate or rewrite the rest of PD-118 semantics.

Required sentence-level meaning:

```text
mechanically proven candidate-local Participant output rejection
→ interrupt Candidate only

all integrity/runtime/provider/identity/scope/verification/unknown failures
→ fail closed
```

- [ ] **Step 5: Verify the authority-only diff**

Run:

```bash
git diff --check
git diff -- docs/governance/product-decisions.md docs/product/auto-evolution-model.md docs/superpowers/specs/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1-design.md docs/superpowers/plans/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1.md
git diff --name-only
```

Expected: only the four documentation files above are changed/created at this task boundary. No `scripts/`, `src/`, or `tests/` file may appear yet.

- [ ] **Step 6: Commit authority sync separately**

```bash
git add docs/governance/product-decisions.md \
  docs/product/auto-evolution-model.md \
  docs/superpowers/specs/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1-design.md \
  docs/superpowers/plans/2026-09-16-auto-evolution-candidate-local-participant-failure-isolation-v1.md
git commit -m "docs: accept candidate-local Participant failure isolation"
```

---

### Task 2: Introduce typed Participant failure facts and the durable candidate-lane v2 contract

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/participantFailureClassification.ts`
- Create: `scripts/evolution/candidateLaneFailureContract.ts`
- Create: `tests/evolution/candidateLaneFailureContract.test.ts`

**Interfaces:**
- Produces:

```ts
export type ParticipantFailureOrigin =
  | 'PARTICIPANT_RUNTIME'
  | 'PROVIDER_PROTOCOL'
  | 'OUTPUT_ENVELOPE'
  | 'OUTPUT_SCHEMA'
  | 'OUTPUT_IDENTITY'
  | 'OUTPUT_INTERNAL_CONSISTENCY'
  | 'OUTPUT_REFERENCE'
  | 'HOST_INFRASTRUCTURE'
  | 'UNKNOWN';

export type ParticipantFailureReason =
  | 'RUNTIME_UNAVAILABLE'
  | 'PROCESS_FAILURE'
  | 'TIMEOUT'
  | 'PROVIDER_PROTOCOL_FAILURE'
  | 'CONTINUATION_PROTOCOL_FAILURE'
  | 'EMPTY_ENVELOPE'
  | 'INVALID_JSON_ENVELOPE'
  | 'NON_OBJECT_ENVELOPE'
  | 'ROLE_SCHEMA_INVALID'
  | 'PROBLEM_ID_MISMATCH'
  | 'OPTION_ID_MISMATCH'
  | 'MALFORMED_LOCATOR'
  | 'MISSING_TARGET'
  | 'NOT_REGULAR_FILE'
  | 'ABSOLUTE_PATH'
  | 'ESCAPES_ALLOWED_ROOT'
  | 'IO_ERROR'
  | 'WORKSPACE_MATERIALIZATION_MISMATCH'
  | 'SKILL_DELIVERY_FAILURE'
  | 'UNCLASSIFIED';

export interface ParticipantFailureFacts {
  origin: ParticipantFailureOrigin;
  reason: ParticipantFailureReason;
  participantErrorKind: string | null;
  message: string;
}

export class ParticipantOutputValidationError extends Error {
  readonly facts: ParticipantFailureFacts;
}

export function classifyWorkspaceAgentFailure(input: {
  errorKind: 'runtime_unavailable' | 'process' | 'timeout' | 'invalid_output' | 'continuation';
  message: string;
}): ParticipantFailureFacts;
```

- Produces durable candidate-lane contract:

```ts
export type CandidateLaneFailureStage =
  | 'SOLUTION'
  | 'REVIEWER'
  | 'SOLUTION_REVISION'
  | 'RE_REVIEWER';

export type CandidateLaneFailureContainment =
  | 'CANDIDATE_LOCAL'
  | 'SESSION_FAIL_CLOSED';

export interface CandidateLaneFailureV2 {
  schemaVersion: 'candidate-lane-failure-v2';
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  stage: CandidateLaneFailureStage;
  actualParticipantJobs: 1 | 2;
  retryCount: 0;
  failureOrigin: ParticipantFailureOrigin;
  failureReason: ParticipantFailureReason;
  containment: CandidateLaneFailureContainment;
  participantErrorKind: string | null;
  message: string;
}

export function containmentForParticipantFailure(
  facts: ParticipantFailureFacts,
): CandidateLaneFailureContainment;

export function buildCandidateLaneFailureV2(input: Omit<CandidateLaneFailureV2,
  'schemaVersion' | 'retryCount' | 'containment'> & { retryCount?: 0 }
): CandidateLaneFailureV2;

export function validateCandidateLaneFailureV2(value: unknown): CandidateLaneFailureV2;
export function parseCandidateLaneFailureV2(raw: string): CandidateLaneFailureV2;
```

- [ ] **Step 1: Write contract tests first**

Create `tests/evolution/candidateLaneFailureContract.test.ts` with at least these exact assertions:

```ts
import assert from 'node:assert/strict';
import {
  buildCandidateLaneFailureV2,
  containmentForParticipantFailure,
  parseCandidateLaneFailureV2,
} from '../../scripts/evolution/candidateLaneFailureContract';

export async function runCandidateLaneFailureContractTests(): Promise<void> {
  assert.equal(containmentForParticipantFailure({
    origin: 'OUTPUT_REFERENCE',
    reason: 'MISSING_TARGET',
    participantErrorKind: 'invalid_output',
    message: 'missing',
  }), 'CANDIDATE_LOCAL');

  assert.equal(containmentForParticipantFailure({
    origin: 'OUTPUT_IDENTITY',
    reason: 'PROBLEM_ID_MISMATCH',
    participantErrorKind: 'invalid_output',
    message: 'wrong problem',
  }), 'SESSION_FAIL_CLOSED');

  assert.equal(containmentForParticipantFailure({
    origin: 'PROVIDER_PROTOCOL',
    reason: 'PROVIDER_PROTOCOL_FAILURE',
    participantErrorKind: 'invalid_output',
    message: 'failed completed-turn protocol',
  }), 'SESSION_FAIL_CLOSED');

  assert.equal(containmentForParticipantFailure({
    origin: 'OUTPUT_REFERENCE',
    reason: 'ESCAPES_ALLOWED_ROOT',
    participantErrorKind: 'invalid_output',
    message: 'escape',
  }), 'SESSION_FAIL_CLOSED');

  const failure = buildCandidateLaneFailureV2({
    candidateRef: 'pool-1/hypothesis-000001',
    hypothesisId: 'hypothesis-000001',
    sourceIndex: 0,
    stage: 'SOLUTION',
    actualParticipantJobs: 1,
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    participantErrorKind: 'invalid_output',
    message: 'repoRef target missing from canonical repository',
  });
  assert.equal(failure.containment, 'CANDIDATE_LOCAL');
  assert.deepEqual(parseCandidateLaneFailureV2(JSON.stringify(failure)), failure);

  assert.throws(() => parseCandidateLaneFailureV2(JSON.stringify({
    ...failure,
    containment: 'SESSION_FAIL_CLOSED',
  })), /containment/i);
}
```

Also test: malformed schema, `retryCount !== 0`, candidateRef/hypothesis identity mismatch, invalid source index, invalid stage, and an unknown origin/reason pair.

- [ ] **Step 2: Run the new test and confirm failure**

```bash
npx tsx tests/evolution/candidateLaneFailureContract.test.ts
```

Expected: FAIL because the new modules/functions do not exist.

- [ ] **Step 3: Implement the minimal typed classification module**

`classifyWorkspaceAgentFailure()` MUST use this exact semantic mapping:

```ts
runtime_unavailable -> PARTICIPANT_RUNTIME / RUNTIME_UNAVAILABLE
process             -> PARTICIPANT_RUNTIME / PROCESS_FAILURE
timeout             -> PARTICIPANT_RUNTIME / TIMEOUT
continuation        -> PROVIDER_PROTOCOL / CONTINUATION_PROTOCOL_FAILURE
invalid_output      -> PROVIDER_PROTOCOL / PROVIDER_PROTOCOL_FAILURE
```

The last mapping is deliberate: `WorkspaceAgentJobFailure.invalid_output` happens before formal role-output validation when provider-specific completed-output interpretation rejects the turn. Do not treat it as `OUTPUT_SCHEMA`.

`ParticipantOutputValidationError` must carry typed facts and preserve a Human-readable `message` without granting the message any routing authority.

- [ ] **Step 4: Implement the durable v2 parser and pure containment mapping**

`containmentForParticipantFailure()` MUST return `CANDIDATE_LOCAL` only for:

```text
OUTPUT_ENVELOPE + EMPTY_ENVELOPE | INVALID_JSON_ENVELOPE | NON_OBJECT_ENVELOPE
OUTPUT_SCHEMA + ROLE_SCHEMA_INVALID
OUTPUT_INTERNAL_CONSISTENCY + OPTION_ID_MISMATCH
OUTPUT_REFERENCE + MALFORMED_LOCATOR | MISSING_TARGET | NOT_REGULAR_FILE
```

All other combinations must return `SESSION_FAIL_CLOSED` or be rejected by the parser as an invalid origin/reason combination.

The parser must recompute expected containment from origin/reason and reject a serialized artifact that lies about its containment.

- [ ] **Step 5: Run the contract test**

```bash
npx tsx tests/evolution/candidateLaneFailureContract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the typed contract foundation**

```bash
git add scripts/evolution/problemAgnosticSolution/participantFailureClassification.ts \
  scripts/evolution/candidateLaneFailureContract.ts \
  tests/evolution/candidateLaneFailureContract.test.ts
git commit -m "feat: define typed candidate Participant failure facts"
```

---

### Task 3: Classify repo/artifact reference failures without weakening validation

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/repoReference.ts`
- Create: `tests/evolution/repoReferenceClassification.test.ts`

**Interfaces:**
- Consumes: `ParticipantOutputValidationError`, `ParticipantFailureFacts` from Task 2.
- Produces:

```ts
export async function assertRepoReferenceFileAgainstAuthoritative(input: {
  workspaceRoot: string;
  authoritativeRoot: string;
  reference: string;
  label: string;
}): Promise<void>;

export async function assertArtifactReferenceFile(input: {
  artifactRoot: string;
  workspaceRoot: string;
  authoritativeRoot: string;
  reference: string;
  label: string;
}): Promise<void>;
```

Keep the existing `parseRepoReference()` and `assertRepoReferenceFile()` exports for compatibility. Existing callers that do not need PD-119 classification may keep using them.

- [ ] **Step 1: Write the reference classification tests**

Create temporary `authoritative`, `workspace`, and `artifact` roots and test these cases:

```text
A. authoritative missing + workspace missing
   -> OUTPUT_REFERENCE / MISSING_TARGET

B. authoritative regular file + workspace missing
   -> HOST_INFRASTRUCTURE / WORKSPACE_MATERIALIZATION_MISMATCH

C. authoritative directory + workspace directory
   -> OUTPUT_REFERENCE / NOT_REGULAR_FILE

D. malformed line locator `src/a.ts:0`
   -> OUTPUT_REFERENCE / MALFORMED_LOCATOR

E. absolute path
   -> OUTPUT_REFERENCE / ABSOLUTE_PATH
   -> containment later must be SESSION_FAIL_CLOSED

F. `../outside`
   -> OUTPUT_REFERENCE / ESCAPES_ALLOWED_ROOT
   -> containment later must be SESSION_FAIL_CLOSED

G. unexpected lstat error injected through a tiny dependency seam if needed
   -> OUTPUT_REFERENCE / IO_ERROR

H. artifact exists in artifactRoot
   -> accepted

I. artifact absent in artifactRoot, but repo-relative regular file exists in both authoritativeRoot and workspaceRoot
   -> accepted, preserving existing fallback behavior

J. artifact missing everywhere
   -> OUTPUT_REFERENCE / MISSING_TARGET
```

Use `assert.rejects()` and inspect `error instanceof ParticipantOutputValidationError` plus `error.facts.origin/reason`; do not assert diagnostic substrings as the semantic contract.

- [ ] **Step 2: Run the reference test and confirm failure**

```bash
npx tsx tests/evolution/repoReferenceClassification.test.ts
```

Expected: FAIL because the new classified helpers do not exist.

- [ ] **Step 3: Refactor path validation into typed helpers**

Implement typed failures at the exact decision point:

```ts
function referenceFailure(
  origin: 'OUTPUT_REFERENCE' | 'HOST_INFRASTRUCTURE',
  reason: ParticipantFailureReason,
  message: string,
): never {
  throw new ParticipantOutputValidationError({
    origin,
    reason,
    participantErrorKind: 'invalid_output',
    message,
  });
}
```

Rules:

- malformed locator => `OUTPUT_REFERENCE/MALFORMED_LOCATOR`;
- absolute => `OUTPUT_REFERENCE/ABSOLUTE_PATH`;
- resolved escape => `OUTPUT_REFERENCE/ESCAPES_ALLOWED_ROOT`;
- always resolve the parsed repo path against the authoritative root as the canonical existence/type check;
- authoritative target missing => local `OUTPUT_REFERENCE/MISSING_TARGET` even if the disposable workspace contains a Participant-created file at that path;
- authoritative target non-regular => local `OUTPUT_REFERENCE/NOT_REGULAR_FILE`;
- authoritative target regular + workspace target regular => accepted;
- authoritative target regular + workspace target missing/non-regular => `HOST_INFRASTRUCTURE/WORKSPACE_MATERIALIZATION_MISMATCH` because the Host cannot prove whether the disposable workspace diverged through materialization or Participant mutation;
- any non-`ENOENT` I/O failure => `OUTPUT_REFERENCE/IO_ERROR` and therefore fail-closed.

Do not add any “closest path”, basename search, normalization, typo correction, or fallback guess.

- [ ] **Step 4: Run reference and existing Solution/Reviewer tests**

```bash
npx tsx tests/evolution/repoReferenceClassification.test.ts
npx tsx tests/evolution/solutionAgentLoop.test.ts
npx tsx tests/evolution/solutionReviewerLoop.test.ts
```

Expected: new test PASS; existing tests either PASS or expose call sites that must be updated in Task 5. Do not weaken assertions merely to keep old tests green.

- [ ] **Step 5: Commit classified reference validation**

```bash
git add scripts/evolution/problemAgnosticSolution/repoReference.ts \
  tests/evolution/repoReferenceClassification.test.ts
git commit -m "feat: classify Participant reference validation failures"
```

---

### Task 4: Emit typed failures from structured Solution execution and Reviewer execution

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`
- Modify: `tests/evolution/envelopeRetransmission.test.ts`
- Modify: `tests/evolution/solutionAgentLoop.test.ts`
- Modify: `tests/evolution/solutionReviewerLoop.test.ts`

**Interfaces:**
- `StructuredParticipantExecutionResult<T>` failure branch gains:

```ts
failure: ParticipantFailureFacts;
```

- `SolutionAgentRunResult` failure branch gains:

```ts
failure: ParticipantFailureFacts;
```

- `SolutionReviewerRunResult` failure branch gains:

```ts
failure: ParticipantFailureFacts;
```

- `RunSolutionAgentInput` and `RunSolutionReviewerInput` gain required:

```ts
repositoryRoot: string;
```

This is the authoritative repository root used only for reference/integrity classification; Participant still receives only the disposable workspace.

- [ ] **Step 1: Add failing tests for structured execution classification**

Extend `envelopeRetransmission.test.ts` so it asserts typed facts for all of these:

```text
initial runtime timeout
  -> PARTICIPANT_RUNTIME/TIMEOUT

provider completed-output interpreter rejects with invalid_output
  -> PROVIDER_PROTOCOL/PROVIDER_PROTOCOL_FAILURE

completed runtime + EMPTY envelope with no eligible retransmission
  -> OUTPUT_ENVELOPE/EMPTY_ENVELOPE

completed runtime + invalid JSON envelope after successful retransmission runtime
  -> OUTPUT_ENVELOPE/INVALID_JSON_ENVELOPE

retransmission timeout
  -> PARTICIPANT_RUNTIME/TIMEOUT (SESSION_FAIL_CLOSED later)

valid envelope + schema reject
  -> OUTPUT_SCHEMA/ROLE_SCHEMA_INVALID
```

- [ ] **Step 2: Run the structured execution test and confirm failure**

```bash
npx tsx tests/evolution/envelopeRetransmission.test.ts
```

Expected: FAIL because failure facts are not yet exposed.

- [ ] **Step 3: Add typed failure facts in `runStructuredParticipantExecution.ts`**

Implementation rules:

```ts
if (!attempt0Job.ok) {
  const failure = classifyWorkspaceAgentFailure(attempt0Job);
  return runtimeFailureResult(attempt0Job, { ...context, failure });
}
```

Envelope failure reasons map exactly:

```text
EMPTY           -> EMPTY_ENVELOPE
INVALID_JSON    -> INVALID_JSON_ENVELOPE
NON_OBJECT_ROOT -> NON_OBJECT_ENVELOPE
```

Schema exceptions map to `OUTPUT_SCHEMA/ROLE_SCHEMA_INVALID`.

`validateAcceptedResult()` may throw `ParticipantOutputValidationError`; preserve its facts. Any other thrown value must become `UNKNOWN/UNCLASSIFIED`, never `OUTPUT_SCHEMA` by guess.

When a retransmission job itself fails, use `classifyWorkspaceAgentFailure(attempt1Job)`; do not preserve the original local envelope classification as the terminal containment fact.

- [ ] **Step 4: Add failing Solution classification tests**

In `solutionAgentLoop.test.ts`, add production-shaped cases that prove:

```text
wrong problemId
  -> OUTPUT_IDENTITY/PROBLEM_ID_MISMATCH

in-scope missing repoRef, missing in authoritative repo too
  -> OUTPUT_REFERENCE/MISSING_TARGET

repoRef missing only from workspace but present in authoritative repo
  -> HOST_INFRASTRUCTURE/WORKSPACE_MATERIALIZATION_MISMATCH

absolute / escaping repoRef
  -> OUTPUT_REFERENCE/ABSOLUTE_PATH or ESCAPES_ALLOWED_ROOT
```

The missing-target case should reproduce the `000004` class with a nested option repoRef rather than weakening validation.

- [ ] **Step 5: Update Solution Agent validation**

Replace direct `assertRepoReferenceFile(input.workspaceRoot, ...)` with the Task 3 authoritative helper. Replace private artifact-ref assertions with `assertArtifactReferenceFile()`.

Use typed identity rejection:

```ts
if (result.problemId !== problemPackage.problemId) {
  throw new ParticipantOutputValidationError({
    origin: 'OUTPUT_IDENTITY',
    reason: 'PROBLEM_ID_MISMATCH',
    participantErrorKind: 'invalid_output',
    message: 'SolutionWork problemId does not match ProblemPackage',
  });
}
```

Skill-delivery failure must return `HOST_INFRASTRUCTURE/SKILL_DELIVERY_FAILURE`, not a candidate-local output failure.

- [ ] **Step 6: Add failing Reviewer classification tests**

In `solutionReviewerLoop.test.ts`, assert:

```text
workspace Agent runtime failure
  -> classifyWorkspaceAgentFailure(...)

invalid/structurally invalid completed JSON
  -> OUTPUT_ENVELOPE or OUTPUT_SCHEMA, based on where validation fails

wrong problemId
  -> OUTPUT_IDENTITY/PROBLEM_ID_MISMATCH

acceptedOptionId absent from supplied SolutionWork
  -> OUTPUT_INTERNAL_CONSISTENCY/OPTION_ID_MISMATCH

in-scope missing repoRef proven missing from authoritative root
  -> OUTPUT_REFERENCE/MISSING_TARGET
```

- [ ] **Step 7: Update Reviewer completed-output validation without enabling Reviewer retransmission**

Reviewer must keep current policy: envelope retransmission is Solution-only. You may reuse `validateStructuredTerminalEnvelope()` and `validateSolutionReview()` to separate envelope from schema, but do not call a policy path that enables same-thread Reviewer retransmission.

Write failure artifacts with the existing schemaVersion unless a schema change is necessary for existing consumers; expose typed facts through the TypeScript result and candidate-lane v2 artifact rather than silently changing unrelated persisted Reviewer contracts.

- [ ] **Step 8: Run focused Participant tests**

```bash
npx tsx tests/evolution/envelopeRetransmission.test.ts
npx tsx tests/evolution/solutionAgentLoop.test.ts
npx tsx tests/evolution/solutionReviewerLoop.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit typed Role failure production**

```bash
git add scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  tests/evolution/envelopeRetransmission.test.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/solutionReviewerLoop.test.ts
git commit -m "feat: emit typed Participant output failures"
```

---

### Task 5: Persist candidate-lane v2 failure evidence for initial and continuation lanes

**Files:**
- Modify: `scripts/evolution/runCandidateLane.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts`
- Modify: `scripts/evolution/runCandidateReviewContinuation.ts`
- Modify: `tests/evolution/candidateLane.test.ts`
- Modify: `tests/evolution/reviewContinuation.test.ts`
- Modify: `tests/evolution/candidateReviewContinuation.test.ts`

**Interfaces:**
- `ParticipantFailureCandidateLaneResult` gains:

```ts
failure: CandidateLaneFailureV2;
```

- `ReviewContinuationResult` participant-failure branch gains:

```ts
failureStage: 'SOLUTION_REVISION' | 'RE_REVIEWER';
failure: ParticipantFailureFacts;
```

- `RunCandidateReviewContinuationInput` gains:

```ts
hypothesisId: string;
sourceIndex: number;
```

- `CandidateReviewContinuationResult` participant-failure branch gains:

```ts
workflowOutcomeRef: 'workflow-outcome.json';
failure: CandidateLaneFailureV2;
```

Keep the existing continuation-specific `failureRef` when it is useful provenance; do not replace historical continuation evidence with the root workflow outcome.

- [ ] **Step 1: Write failing initial-lane v2 evidence tests**

Update `candidateLane.test.ts` so a Solution missing canonical repoRef produces:

```json
{
  "schemaVersion": "candidate-lane-failure-v2",
  "stage": "SOLUTION",
  "failureOrigin": "OUTPUT_REFERENCE",
  "failureReason": "MISSING_TARGET",
  "containment": "CANDIDATE_LOCAL",
  "retryCount": 0
}
```

Also assert that a Solution runtime timeout produces the same v2 envelope with `SESSION_FAIL_CLOSED` containment.

- [ ] **Step 2: Run candidate-lane test and confirm failure**

```bash
npx tsx tests/evolution/candidateLane.test.ts
```

Expected: FAIL because the current lane writes `candidate-lane-failure-v1`.

- [ ] **Step 3: Replace lane v1 writer with validated v2 writer**

`runCandidateLane.ts` must build the artifact through `buildCandidateLaneFailureV2()` rather than writing caller-provided containment.

The ordering inside the lane remains:

```text
Participant failure artifact(s)
→ workflow-outcome.json candidate-lane-failure-v2
→ return participant_failure result
```

The lane itself does not change Pool/Session state.

- [ ] **Step 4: Add failing continuation propagation tests**

In `reviewContinuation.test.ts`, prove both revision and re-reviewer Participant failures carry `failureStage` and typed `ParticipantFailureFacts`.

In `candidateReviewContinuation.test.ts`, prove the candidate wrapper writes root `workflow-outcome.json` v2 with stage `SOLUTION_REVISION` or `RE_REVIEWER`, while retaining the underlying continuation evidence ref.

- [ ] **Step 5: Propagate typed failures through continuation**

When a Participant runner returns `{ ok: false }`, propagate its `failure` facts.

When an injected runner throws before returning a typed Participant result, classify it as:

```text
HOST_INFRASTRUCTURE / UNCLASSIFIED
→ SESSION_FAIL_CLOSED
```

Do not turn arbitrary thrown exceptions into `PROCESS_FAILURE` merely to make them look like Participant failures.

`runCandidateReviewContinuation()` writes `workflow-outcome.json` only after it has enough identity facts (`candidateRef`, `hypothesisId`, `sourceIndex`) to build a valid v2 artifact.

- [ ] **Step 6: Run continuation/candidate tests**

```bash
npx tsx tests/evolution/candidateLane.test.ts
npm run test:evolution:review-continuation
npx tsx tests/evolution/candidateReviewContinuation.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit durable candidate-lane failure evidence**

```bash
git add scripts/evolution/runCandidateLane.ts \
  scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts \
  scripts/evolution/runCandidateReviewContinuation.ts \
  tests/evolution/candidateLane.test.ts \
  tests/evolution/reviewContinuation.test.ts \
  tests/evolution/candidateReviewContinuation.test.ts
git commit -m "feat: persist typed candidate Participant failures"
```

---

### Task 6: Decouple local Candidate interruption from Pool interruption and update scheduler lifecycle

**Files:**
- Modify: `scripts/evolution/candidatePoolState.ts`
- Modify: `scripts/evolution/runMultiCandidateSessionSlice.ts`
- Modify: `tests/evolution/candidatePoolContract.test.ts`
- Modify: `tests/evolution/multiCandidateSessionSlice.test.ts`

**Interfaces:**
- Produces:

```ts
export function interruptCandidateLocally(
  pool: CandidatePoolV1,
  candidateRef: string,
  interruptionRef: string,
): CandidatePoolV1;
```

Exact transition semantics:

```text
Candidate ACTIVE -> INTERRUPTED
Pool PROCESSING -> PROCESSING
reason = candidate-local Participant output rejected
```

Keep existing `interruptCandidate()` unchanged for fail-closed Pool interruption.

- [ ] **Step 1: Write failing pool-state tests**

Extend `candidatePoolContract.test.ts`:

```ts
const first = nextPendingCandidate(pool)!;
const active = activateCandidate(pool, first.candidateRef);
const isolated = interruptCandidateLocally(
  active,
  first.candidateRef,
  'source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json',
);
assert.equal(isolated.status, 'PROCESSING');
assert.equal(isolated.candidates[0]!.processingState, 'INTERRUPTED');
assert.equal(nextPendingCandidate(isolated)!.hypothesisId, 'hypothesis-000002');

const secondActive = activateCandidate(isolated, isolated.candidates[1]!.candidateRef);
const secondIsolated = interruptCandidateLocally(
  secondActive,
  secondActive.candidates[1]!.candidateRef,
  'source-epochs/source-epoch-000001/candidates/hypothesis-000002/workflow-outcome.json',
);
const exhausted = exhaustPoolIfComplete(secondIsolated);
assert.equal(exhausted.status, 'EXHAUSTED');
assert.equal(exhausted.candidates.filter(candidate => candidate.processingState === 'INTERRUPTED').length, 2);
```

- [ ] **Step 2: Run pool test and confirm failure**

```bash
npx tsx tests/evolution/candidatePoolContract.test.ts
```

Expected: FAIL because `interruptCandidateLocally()` does not exist.

- [ ] **Step 3: Implement the local state transition**

Implement with the existing `updateCandidate()` helper. Do not alter `CandidatePoolStatus` or parser enums.

- [ ] **Step 4: Add failing scheduler tests for the accepted lifecycle matrix**

In `multiCandidateSessionSlice.test.ts`, use dependency-injected lane results with valid `CandidateLaneFailureV2` values and prove all cases:

1. first candidate local rejection + second ordinary completion:

```text
candidate[0] = INTERRUPTED
candidate[1] = COMPLETED
pool = EXHAUSTED
session = COMPLETED
```

2. last candidate local rejection:

```text
pool = EXHAUSTED
session = COMPLETED
```

3. all candidates local rejection:

```text
all candidates = INTERRUPTED
pool = EXHAUSTED
session = COMPLETED
```

4. local rejection consumes jobs but cannot bypass slice budget:

```text
source analysis consumes 2 jobs
first rejected lane consumes 4 jobs
remaining = 5
one candidate may still be admitted because source transition is available and admission requires 5
if that candidate consumes enough jobs and a further PENDING candidate remains,
next boundary -> PAUSED/HOST_SLICE_BUDGET
```

Build the fixture so the pause occurs only at a candidate boundary; never simulate mid-candidate budget exhaustion.

5. `SESSION_FAIL_CLOSED` Participant failure retains current behavior:

```text
candidate = INTERRUPTED
pool = INTERRUPTED
session = FAILED
reason = PARTICIPANT_FAILURE
```

6. no HFL is created for local rejection.

- [ ] **Step 5: Update scheduler containment handling**

For both initial lane and continuation Participant failure branches:

```ts
if (failure.containment === 'CANDIDATE_LOCAL') {
  // evidence must already be retained
  const durableInterruptionRef = durableCandidateArtifactRef({
    sourceEpochRef: currentSourceEpochRef,
    hypothesisId: pending.hypothesisId,
    candidateLaneRoot: laneRoot,
    artifactPath: join(laneRoot, workflowOutcomeRef),
  });
  pool = interruptCandidateLocally(pool, pending.candidateRef, durableInterruptionRef);
  pool = exhaustPoolIfComplete(pool);
  await persistPool(..., pool);
  if (pool.status === 'EXHAUSTED') {
    sessionState = 'COMPLETED';
    slice = { ...slice, state: 'COMPLETED', endedAt: now() };
    break;
  }
  continue;
}

// existing fail-closed Participant failure path
pool = interruptCandidate(...);
...
```

Before the continuation branch changes Candidate state, call `retainLaneArtifacts()` so `workflow-outcome.json` and underlying continuation failure evidence are durable. The initial-lane branch already retains lane artifacts before processing the Participant failure; preserve that ordering.

For both local and fail-closed v2 Participant failures, persist `Candidate.interruptionRef` as the durable session-relative candidate artifact ref (for example `source-epochs/source-epoch-000001/candidates/hypothesis-000001/workflow-outcome.json`), not the lane-local string `workflow-outcome.json`. This gives reports/reconciliation a stable evidence target without guessing lane location.

Do not add a “skip failed candidate” Decision route. The Candidate remains `INTERRUPTED` with no effective Decision.

- [ ] **Step 6: Run pool and scheduler tests**

```bash
npx tsx tests/evolution/candidatePoolContract.test.ts
npx tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit lifecycle isolation**

```bash
git add scripts/evolution/candidatePoolState.ts \
  scripts/evolution/runMultiCandidateSessionSlice.ts \
  tests/evolution/candidatePoolContract.test.ts \
  tests/evolution/multiCandidateSessionSlice.test.ts
git commit -m "feat: isolate candidate-local Participant failures"
```

---

### Task 7: Make crash reconciliation understand complete v2 local failures and nothing older

**Files:**
- Modify: `scripts/evolution/reconcileCandidateSession.ts`
- Modify: `scripts/evolution/runMultiCandidateSessionSlice.ts`
- Modify: `tests/evolution/candidateSessionReconciliation.test.ts`
- Modify: `tests/evolution/multiCandidateSessionSlice.test.ts`

**Interfaces:**
- Extend `CandidateReconciliationResult` with:

```ts
| {
    status: 'CANDIDATE_LOCAL_FAILURE_RECONCILED';
    candidateRef: string;
    interruptionRef: string;
    poolStatus: 'PROCESSING' | 'EXHAUSTED';
  }
```

- [ ] **Step 1: Write failing reconciliation tests**

Add cases in `candidateSessionReconciliation.test.ts`:

```text
A. ACTIVE candidate + valid matching workflow-outcome.json v2 / CANDIDATE_LOCAL + another PENDING
   -> Candidate INTERRUPTED
   -> Pool PROCESSING
   -> reconciliation status CANDIDATE_LOCAL_FAILURE_RECONCILED

B. ACTIVE candidate + valid matching local v2 + no remaining PENDING
   -> Candidate INTERRUPTED
   -> Pool EXHAUSTED

C. ACTIVE candidate + v2 SESSION_FAIL_CLOSED
   -> Pool INTERRUPTED
   -> status INTERRUPTED

D. ACTIVE candidate + historical candidate-lane-failure-v1
   -> Pool INTERRUPTED

E. ACTIVE candidate + malformed v2 / candidate identity mismatch
   -> Pool INTERRUPTED

F. ACTIVE candidate + both accepted Decision terminal artifact and workflow-outcome failure artifact
   -> contradictory terminal evidence
   -> Pool INTERRUPTED
```

- [ ] **Step 2: Run reconciliation test and confirm failure**

```bash
npx tsx tests/evolution/candidateSessionReconciliation.test.ts
```

Expected: FAIL because current reconciliation treats every incomplete terminal candidate as Pool-interrupting.

- [ ] **Step 3: Reconcile typed local failure before generic incomplete-terminal fallback**

Algorithm:

```text
find ACTIVE candidate
check for candidate-lane root workflow-outcome.json

if workflow-outcome exists:
  parse only candidate-lane-failure-v2
  verify candidateRef / hypothesisId / sourceIndex match ACTIVE candidate
  reject contradiction if accepted Decision terminal artifacts also exist
  if containment == CANDIDATE_LOCAL:
    interruptCandidateLocally(...)
    exhaustPoolIfComplete(...)
    atomic persist pool
    return CANDIDATE_LOCAL_FAILURE_RECONCILED
  else:
    existing fail-closed interrupt

if no v2 workflow-outcome:
  run existing accepted-Decision reconciliation
  otherwise existing incomplete-terminal fail-closed
```

Do not parse `candidate-lane-failure-v1` as v2, and do not upgrade it based on message/errorKind.

- [ ] **Step 4: Update slice resume handling**

When `runMultiCandidateSessionSlice()` receives `CANDIDATE_LOCAL_FAILURE_RECONCILED`:

- reload the persisted Pool;
- keep Logical Session `PROCESSING` if Pool is `PROCESSING`;
- if Pool is already `EXHAUSTED`, complete the Host slice and Logical Session without attempting budget admission;
- never recreate or rerun the failed Candidate.

- [ ] **Step 5: Add a resume-level regression test**

In `multiCandidateSessionSlice.test.ts`, construct durable session state with one ACTIVE candidate whose retained lane contains valid local v2 failure evidence and one PENDING candidate. Resume must reconcile the first to `INTERRUPTED` and process the second in source order.

Add the one-candidate variant where reconciliation exhausts the Pool and the Session ends `COMPLETED` directly.

- [ ] **Step 6: Run reconciliation and session tests**

```bash
npx tsx tests/evolution/candidateSessionReconciliation.test.ts
npx tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit crash-consistent reconciliation**

```bash
git add scripts/evolution/reconcileCandidateSession.ts \
  scripts/evolution/runMultiCandidateSessionSlice.ts \
  tests/evolution/candidateSessionReconciliation.test.ts \
  tests/evolution/multiCandidateSessionSlice.test.ts
git commit -m "feat: reconcile durable candidate-local failures"
```

---

### Task 8: Project typed isolated failures into operator/report observability without changing routing authority

**Files:**
- Modify: `scripts/evolution/reporting/buildMultiCandidateOperationalRunReport.ts`
- Modify: `scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts`
- Modify: `scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts`
- Modify: `tests/evolution/multiCandidateOperationalRunReport.test.ts`
- Modify: `tests/evolution/multiCandidateReportArchive.test.ts`
- Modify: `tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts`

**Interfaces:**
- Consumes: persisted candidate pool `interruptionRef` + validated `candidate-lane-failure-v2`.
- Produces deterministic Human-readable facts only. Report/operator code MUST NOT influence scheduler or containment.

Human-readable isolated-failure projection must include:

```text
candidate
stage
failureOrigin
failureReason
containment
evidence ref
message/cause as diagnostics
```

- [ ] **Step 1: Write failing report tests**

Add a completed session fixture with:

```text
total=2
completed=1
interrupted=1
pool=EXHAUSTED
session=COMPLETED
```

The interrupted candidate points to valid `candidate-lane-failure-v2` with `CANDIDATE_LOCAL` containment.

Assert Markdown/Human report explicitly says the Session completed while one candidate was interrupted and shows the typed failure fields. Do not call the Session `FAILED` merely because interrupted > 0.

- [ ] **Step 2: Write failing archive/operator tests**

Archive test: the immutable snapshot retains the same Human-readable typed failure projection.

Operator test: terminal output for a completed session with local rejection includes candidate/stage/origin/reason/containment and final Session `COMPLETED`.

Keep canonical `report.json` schema unchanged unless an existing current contract already has a safe extension point. PD-119 does not authorize a report schema migration by itself.

- [ ] **Step 3: Implement one deterministic failure reader/projection helper**

Avoid three independent parsers. Put a small helper in the reporting module already shared by report/archive/operator if such a shared module exists; otherwise add a focused helper under `scripts/evolution/reporting/`.

It must:

- resolve `interruptionRef` only inside the durable Logical Session root;
- parse only `candidate-lane-failure-v2` for typed details;
- show historical/untyped interruption as `typed details unavailable` rather than inferring from strings;
- never mutate artifacts.

- [ ] **Step 4: Run focused observability tests**

```bash
npx tsx tests/evolution/multiCandidateOperationalRunReport.test.ts
npx tsx tests/evolution/multiCandidateReportArchive.test.ts
npx tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit observability separately**

```bash
git add scripts/evolution/reporting/buildMultiCandidateOperationalRunReport.ts \
  scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts \
  scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts \
  tests/evolution/multiCandidateOperationalRunReport.test.ts \
  tests/evolution/multiCandidateReportArchive.test.ts \
  tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
git commit -m "feat: report isolated candidate Participant failures"
```

---

### Task 9: Full regression, natural-run check, and completion evidence

**Files:**
- No planned production file changes. Fix only defects directly exposed by this feature's verification; do not broaden scope.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verifiable evidence that PD-119 is implemented without weakening current fail-closed or retry boundaries.

- [ ] **Step 1: Run all focused feature tests**

```bash
npx tsx tests/evolution/candidateLaneFailureContract.test.ts
npx tsx tests/evolution/repoReferenceClassification.test.ts
npx tsx tests/evolution/envelopeRetransmission.test.ts
npx tsx tests/evolution/solutionAgentLoop.test.ts
npx tsx tests/evolution/solutionReviewerLoop.test.ts
npx tsx tests/evolution/candidateLane.test.ts
npm run test:evolution:review-continuation
npx tsx tests/evolution/candidateReviewContinuation.test.ts
npx tsx tests/evolution/candidatePoolContract.test.ts
npx tsx tests/evolution/candidateSessionReconciliation.test.ts
npx tsx tests/evolution/multiCandidateSessionSlice.test.ts
npx tsx tests/evolution/multiCandidateOperationalRunReport.test.ts
npx tsx tests/evolution/multiCandidateReportArchive.test.ts
npx tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Run project contract/type gates**

```bash
npm run test:contracts
npm run typecheck
git diff --check
```

Expected: all PASS and no whitespace errors.

- [ ] **Step 3: Run the main project test gate**

```bash
npm test
```

Expected: PASS. If a pre-existing unrelated failure occurs, capture exact command/output and prove it reproduces on the pre-feature baseline before excluding it; do not waive failures by assertion.

- [ ] **Step 4: Inspect retry and authority invariants explicitly**

Run:

```bash
grep -R "semanticRetryCount" -n scripts/evolution src/evolution docs/product docs/governance
grep -R "CANDIDATE_OUTPUT_REJECTED\|candidate-lane-failure-v2" -n scripts/evolution tests/evolution docs/product docs/governance
grep -R "message.includes\|String(error).*contain\|invalid_output.*CANDIDATE_LOCAL" -n scripts/evolution || true
```

Expected:

- semantic retry remains zero in the active multi-candidate contract;
- new containment is present only in intended Host/contract/report surfaces;
- no message-substring or coarse-invalid-output routing shortcut exists.

- [ ] **Step 5: Run one ordinary natural AE session on a clean worktree**

Precondition:

```bash
git status --short
```

Expected: clean.

Run:

```bash
npm run evolution:operator:run
```

Interpretation rules:

- this natural run is a regression/smoke observation, not deterministic proof that local isolation triggers;
- if no candidate-local failure occurs, do not manufacture one and do not claim natural isolation proof;
- if a candidate-local failure naturally occurs, verify its v2 artifact, Candidate `INTERRUPTED`, Pool continuation or exhaustion, and Human-readable report facts;
- any runtime/provenance/scope/verification failure must still fail closed.

- [ ] **Step 6: Verify exact changed-file scope**

```bash
FEATURE_BASE_SHA="$(git rev-parse "$(git log --grep='docs: accept candidate-local Participant failure isolation' --format='%H' -n1)^")"
git status --short
git diff --stat "$FEATURE_BASE_SHA"..HEAD
git diff --name-only "$FEATURE_BASE_SHA"..HEAD
git log --oneline --decorate -n 12
```

Expected: changes are limited to the authority/design/plan, typed failure/reference machinery, candidate lane/continuation, pool/scheduler/reconciliation, observability, and their focused tests. No game/domain content/configuration should change.

- [ ] **Step 7: Produce the completion report**

The executor's final report must state, with command evidence:

```text
1. branch + final HEAD
2. authority files changed and accepted PD number
3. exact production/test files changed
4. typed failure origins/reasons implemented
5. candidate-local mapping implemented
6. fail-closed classes explicitly preserved
7. semanticRetryCount remains 0
8. candidate-lane-failure-v1 remains historical/fail-closed only
9. focused test commands and results
10. test:contracts result
11. typecheck result
12. npm test result
13. natural ordinary-run outcome, without overstating stochastic evidence
14. git diff --check result
15. any remaining known limitation or evidence gap
```

Do not report “fixed”, “complete”, or “tests pass” without the corresponding observable command output from this implementation worktree.

- [ ] **Step 8: Commit any verification-only corrections, then ensure clean status**

If verification exposed a feature-scoped defect and it was corrected with a test, commit it with a precise message. Then:

```bash
git status --short
```

Expected: empty output.

---

## Acceptance Criteria

Implementation is accepted only when all of these are true:

1. PD-119 / first-layer authority sync is committed before runtime behavior changes.
2. `000004`-class in-scope missing repoRef is deterministically classified as candidate-local only after authoritative-root cross-check.
3. A workspace-only missing repo file is fail-closed as Host infrastructure/materialization failure.
4. Provider/runtime/timeout/continuation-protocol failures remain fail-closed.
5. Cross-task `problemId` mismatch remains fail-closed.
6. Absolute/escaping references remain fail-closed.
7. Schema/envelope/internal-consistency output defects are candidate-local only after normal Participant runtime completion and any already-authorized envelope recovery completes normally.
8. Candidate-local failure produces no accepted Decision and no HFL.
9. Candidate-local failure persists `candidate-lane-failure-v2`, then Candidate `INTERRUPTED`, while Pool remains `PROCESSING` if work remains.
10. Source-order next Candidate activation proceeds normally and still obeys the 11-job Host-slice admission boundary.
11. A Pool containing only terminal `COMPLETED` / `INTERRUPTED` / `SUPERSEDED` candidates may become `EXHAUSTED`; Logical Session may become `COMPLETED` with interrupted candidates.
12. Existing Pool/Session fail-closed behavior remains for non-local failures.
13. Resume/reconciliation accepts only complete matching v2 local failure evidence; v1/incomplete/ambiguous evidence stays fail-closed.
14. No new Candidate/Pool/Session state, semantic retry, auto-repair, reference guessing, failure-count circuit breaker, ranking, source rebind, or second source-changing transition is introduced.
15. Operator/report surfaces expose typed interruption facts without becoming routing authority.
16. Focused tests, `npm run test:contracts`, `npm run typecheck`, `npm test`, and `git diff --check` pass, or any unrelated pre-existing failure is demonstrated against the pre-feature baseline with exact evidence.

## Explicitly Forbidden Changes

- Do not modify Game runtime, player model, content catalogs, event data, balance, or UX.
- Do not modify Participant reasoning prompts merely to avoid malformed output.
- Do not weaken `assertRepoReferenceFile` semantics or accept nonexistent paths.
- Do not infer a corrected path from repository search.
- Do not convert candidate-local failure into `DEFER`, `SKIP`, `ESCALATE_HUMAN`, or another Decision route.
- Do not retry the failed Candidate.
- Do not auto-create HFL for isolated failure.
- Do not reinterpret historical `candidate-lane-failure-v1` artifacts.
- Do not add a provider-health/failure-count threshold in v1.
- Do not merge the unrelated GameEngine quiet/logging patch into PD-119 commits.
