# Auto Evolution Candidate Pool v1 — Plan B Durable Host Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add the durable, resumable multi-candidate Host required by PD-118: candidate-local continuation, 11-job Host slices, exact baseline validation, crash reconciliation, one bounded source transition, and durable source/session state. Do not switch the default ordinary operator/reporting path yet; Plan C performs final activation after observability supports the new contracts.

**Architecture:** Keep Plan A's Candidate Pool and Candidate Lane as the semantic core. Add a durable session store outside the authoritative product fingerprint, a Host-slice orchestrator above the Pool, candidate-local continuation after the base Candidate Lane, and a reusable bounded source-transition primitive extracted from the current P2 Host. The new Host must be able to start or resume an exact Logical Session without rerunning Feedback/Hypothesis for an existing Source Epoch.

**Tech Stack:** TypeScript, Node.js `fs/promises`, existing canonical JSON/SHA-256 provenance helpers, existing Phase0 seal validation, existing Solution/Reviewer/Configuration Execution participants, custom executable TypeScript test files (`npm exec -- tsx ...`), current `dev` AE contracts.

**Spec:** `docs/designs/auto-evolution-source-local-candidate-pool-v1.md` (Human accepted / written-spec review accepted, PD-118).

## Global Constraints

- Do not add semantic ranking, priority, dedupe, merge, cross-source rebinding, or a generic queue.
- Do not widen PD-111 evidence. Diagnostic scope remains exactly the ACTIVE candidate's `evidenceRefs`.
- Do not change PD-100 HFL trigger: only the effective formal `ESCALATE_HUMAN` creates retained HFL state.
- Do not add semantic retry. Crash reconciliation may consume already-valid immutable terminal artifacts; it must not call a Participant again.
- One Candidate Lane gets at most one bounded continuation. Another candidate retains its own independent one-continuation entitlement.
- One Host execution slice gets at most 11 Participant jobs. This is not a Logical Session lifetime cap.
- Budget pause is legal only at a candidate boundary. Never force an ACTIVE candidate to `DEFER` because the slice is out of budget.
- One source-changing transition per Logical Session remains the v1 ceiling.
- A successful source transition requires configuration execution, scope verification, deterministic verification, real rerun, and a valid sealed new source. Do not mark old pending candidates `SUPERSEDED` before all five are complete.
- Do not weaken repository/provenance/scope/verification fail-closed behavior.
- Durable operational state must not perturb the authoritative product/config fingerprint.
- Preserve all existing `multi-round-*` contracts and tests as legacy read/runtime compatibility until Plan C switches the ordinary operator.
- Do not modify gameplay code/content, Participant prompts' product judgment, execution permissions, HFL lifecycle semantics, or full P3.
- Use test-first changes. Every task starts with a failing focused test, then minimal implementation, then the focused green run.
- Run `git diff --check` before every commit.

## Current `dev` Facts This Plan Must Respect

- `captureAuthoritativeFingerprint()` excludes `artifacts/**` and `.tmp/evolution/**` through `isEvolutionWorkspacePathExcluded()`. Therefore `artifacts/evolution/sessions/**` is an appropriate durable operational-state root without weakening the product fingerprint.
- `runOrdinaryEvolution()` currently allocates a new session and Phase0 source on every invocation; it has no resume mode.
- `runReviewContinuation()` is currently owned by the multi-round Host and globally limited to one per session.
- `multiRoundExecutionValidation.ts` currently owns the correct bounded configuration execution, scope verification, deterministic verification, modified-runtime rerun, and source sealing path.
- The current P2 Host has `MAX_TOTAL_PARTICIPANT_JOBS = 11`, `MAX_EXECUTION_PARTICIPANT_JOBS = 1`, and `MAX_TRANSITIONS = 1`.
- Existing Participant workspaces are transient and belong under `.tmp/evolution/**`; do not persist complete agent workspace copies into durable operational state.

---

### Task 1: Add the Durable Logical Session Store and Immutable Source Anchors

**Files:**
- Create: `scripts/evolution/candidateSessionStore.ts`
- Create: `tests/evolution/candidateSessionStore.test.ts`
- Modify: `scripts/evolution/multiCandidateSessionManifestContract.ts`
- Test: `tests/evolution/multiCandidateSessionManifestContract.test.ts`

**Interfaces:**

```ts
export const CANDIDATE_SESSION_ROOT = 'artifacts/evolution/sessions' as const;

export interface CandidateSessionLocation {
  sessionRoot: string;
  manifestPath: string;
}

export interface RetainedSourceEpochAnchor {
  sourceEpochRef: string;
  manifestRef: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  sourceExperimentRootHash: string;
}

export function resolveCandidateSessionLocation(
  repositoryRoot: string,
  logicalSessionId: string,
): CandidateSessionLocation;

export async function writeMultiCandidateSessionManifestAtomic(...): Promise<void>;
export async function readDurableMultiCandidateSessionManifest(...): Promise<MultiCandidateSessionManifestV1>;
export async function retainSourceEpochAnchor(...): Promise<RetainedSourceEpochAnchor>;
export async function materializeSourceEpochAnchor(...): Promise<{ sourceRoot: string }>;
export async function retainSourceAnalysisArtifacts(...): Promise<void>;
export async function retainCandidateLaneArtifacts(...): Promise<void>;
```

The source anchor must be immutable and reconstruct the exact sealed Phase0 tree without depending on `.tmp`. Store file content by hash under a path that does not recreate generic `inputs/`, `workspaces/`, or `agent-workspaces/` directory segments in the durable tree; keep a manifest mapping original relative paths to stored object hashes. Materialization reconstructs the original tree in a transient `.tmp/evolution/<logicalSessionId>/<hostSliceId>/...` root and revalidates its Phase0 seal/hash before use.

The canonical mutable session manifest is the only mutable operational file. Write it through temp-file + rename; never modify immutable source-analysis or candidate-lane evidence in place.

- [ ] **Step 1: Write failing durable-store tests**

Cover all of these:

```text
session root = artifacts/evolution/sessions/<logicalSessionId>
manifest atomic replacement leaves one valid canonical manifest
source anchor retains exact relative path + sha256 mapping
materialized source passes existing Phase0 seal validation
second attempt to change an existing immutable object/source anchor fails closed
source-analysis artifact bytes are create-only
candidate-lane evidence bytes are create-only
unsafe relative paths are rejected
```

Also assert `captureAuthoritativeFingerprint(repositoryRoot)` is identical before and after writing a fixture session below `artifacts/evolution/sessions/**`.

- [ ] **Step 2: Run the store test and verify red**

```bash
npm exec -- tsx tests/evolution/candidateSessionStore.test.ts
```

Expected: FAIL because `candidateSessionStore.ts` does not exist.

- [ ] **Step 3: Extend the new Session contract for an analysis-pending Source Epoch**

A successful source transition can consume the remaining slice budget before Source B Feedback/Hypothesis run. Represent that state explicitly instead of violating the 11-job limit.

Add a source-epoch lifecycle owned by the Session contract, for example:

```ts
export type SourceEpochLifecycle =
  | 'ANALYSIS_PENDING'
  | 'POOL_ACTIVE'
  | 'POOL_EXHAUSTED'
  | 'SUPERSEDED'
  | 'INTERRUPTED';
```

A Source Epoch in `ANALYSIS_PENDING` has a durable source anchor but no Pool yet. Do not invent a Candidate or Hypothesis Set for it. `currentSourceEpochRef` may point to `ANALYSIS_PENDING`.

Write the failing contract test first, then implement the minimum contract change.

- [ ] **Step 4: Implement the durable store**

Use existing:

```ts
canonicalJson
sha256Hex
validatePhase0RunSeal
```

Do not use semantic repair. On materialization, a missing object, hash mismatch, or invalid seal is a hard error.

Retain only candidate-lane evidence necessary for future reconciliation, source transition, HFL, and observability. Do not retain full copied repository workspaces.

- [ ] **Step 5: Run focused tests**

```bash
npm exec -- tsx tests/evolution/candidateSessionStore.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
npm exec -- tsx tests/evolution/workspaceStateProvenance.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the durable store**

```bash
git add scripts/evolution/candidateSessionStore.ts \
  scripts/evolution/multiCandidateSessionManifestContract.ts \
  tests/evolution/candidateSessionStore.test.ts \
  tests/evolution/multiCandidateSessionManifestContract.test.ts
git diff --check
git commit -m "feat: add durable AE candidate session store"
```

---

### Task 2: Add Host-slice Budget Accounting and Candidate Admission

**Files:**
- Create: `scripts/evolution/candidateSliceBudget.ts`
- Create: `tests/evolution/candidateSliceBudget.test.ts`
- Modify: `scripts/evolution/multiCandidateSessionManifestContract.ts`
- Test: `tests/evolution/multiCandidateSessionManifestContract.test.ts`

**Interfaces:**

```ts
export interface HostSliceBudgetV1 {
  maxParticipantJobs: 11;
  usedParticipantJobs: number;
  remainingParticipantJobs: number;
}

export function createHostSliceBudget(): HostSliceBudgetV1;
export function consumeHostSliceJobs(budget: HostSliceBudgetV1, count: number): HostSliceBudgetV1;
export function requiredCandidateAdmissionJobs(input: {
  sourceTransitionAvailable: boolean;
}): 4 | 5;
export function canAdmitCandidate(input: {
  budget: HostSliceBudgetV1;
  sourceTransitionAvailable: boolean;
}): boolean;
```

Source analysis costs 2 Participant jobs only when the current Source Epoch is `ANALYSIS_PENDING`. Candidate base lane and continuation consume their actual jobs. Configuration execution consumes 1 Participant job. Phase0 rerun and deterministic verification are not Participant jobs.

- [ ] **Step 1: Write failing budget tests**

Require:

```ts
assert.equal(requiredCandidateAdmissionJobs({ sourceTransitionAvailable: true }), 5);
assert.equal(requiredCandidateAdmissionJobs({ sourceTransitionAvailable: false }), 4);
assert.equal(canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 7, remainingParticipantJobs: 4 }, sourceTransitionAvailable: true }), false);
assert.equal(canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 6, remainingParticipantJobs: 5 }, sourceTransitionAvailable: true }), true);
```

Also reject negative usage, usage > 11, and a consume operation that would exceed 11.

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/candidateSliceBudget.test.ts
```

- [ ] **Step 3: Implement pure budget helpers**

No I/O and no route semantics. Admission only answers whether an entire legal Candidate Lane plus one possible execution Participant job can fit.

- [ ] **Step 4: Add per-slice accounting to the Session manifest**

Each Host slice record must expose at least:

```ts
hostSliceId: string;
startedAt: string;
endedAt: string | null;
participantJobs: number;
state: 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED' | 'FAILED';
reason: string | null;
```

Validate `participantJobs <= 11`. Do not add a lifetime total cap that blocks future slices.

- [ ] **Step 5: Run focused tests**

```bash
npm exec -- tsx tests/evolution/candidateSliceBudget.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/candidateSliceBudget.ts \
  scripts/evolution/multiCandidateSessionManifestContract.ts \
  tests/evolution/candidateSliceBudget.test.ts \
  tests/evolution/multiCandidateSessionManifestContract.test.ts
git diff --check
git commit -m "feat: add AE host slice budget accounting"
```

---

### Task 3: Make Bounded Review Continuation Candidate-local

**Files:**
- Create: `scripts/evolution/runCandidateReviewContinuation.ts`
- Create: `tests/evolution/candidateReviewContinuation.test.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts`
- Test: `tests/evolution/reviewContinuation.test.ts`
- Test: `tests/evolution/reviewContinuationContract.test.ts`
- Test: `tests/evolution/workflowContinuationAudit.test.ts`

**Interfaces:**

```ts
export interface RunCandidateReviewContinuationInput {
  candidateRef: string;
  candidateLaneRoot: string;
  baseDecisionPath: string;
  problemPackagePath: string;
  sourceFingerprintSha256: string;
  participant: WorkspaceAgentParticipantOptions;
  // exact existing Solution/Reviewer artifacts and workspace provenance required by the current continuation implementation
}

export type CandidateReviewContinuationResult =
  | {
      status: 'not_requested';
      participantJobs: 0;
      effectiveDecisionPath: string;
    }
  | {
      status: 'completed';
      participantJobs: 1 | 2;
      continuationRef: 'review-continuation-000001';
      effectiveDecisionPath: string;
      effectiveDecision: SolutionDecisionV1;
    }
  | {
      status: 'participant_failure';
      participantJobs: 1 | 2;
      continuationRef: 'review-continuation-000001';
      failureRef: string;
    };
```

Candidate-local eligibility is based only on this candidate's base Decision and absence/presence of this candidate's own `review-continuation-000001`. There is no Session-global `reviewContinuationCount` gate.

- [ ] **Step 1: Write a failing fairness test**

Create two independent candidate lane fixtures:

```text
H1 base Decision = REQUEST_MORE_WORK -> continuation allowed
H2 base Decision = REQUEST_MORE_WORK -> continuation also allowed
```

Prove H1's completed continuation does not make H2 terminal without its own continuation.

Also prove a second REQUEST_MORE_WORK *inside the same candidate* becomes terminal `DEFER_MORE_WORK_REQUESTED` and does not create `review-continuation-000002`.

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/candidateReviewContinuation.test.ts
```

- [ ] **Step 3: Extract/reuse the existing continuation core**

Keep the current PD-117 continuation shape intact: one fresh Solution revision and, only for `OPTIONS`, one fresh independent Reviewer. Preserve base Decision immutability and existing structured-output/retransmission behavior.

The legacy `runReviewContinuation()` API must continue to work for `multiRoundExecutionValidation.ts` until final migration. Prefer extracting a shared internal core and making both the legacy round wrapper and the new candidate wrapper call it. Do not duplicate the reasoning pipeline.

- [ ] **Step 4: Verify old and new continuation suites**

```bash
npm exec -- tsx tests/evolution/candidateReviewContinuation.test.ts
npm exec -- tsx tests/evolution/reviewContinuation.test.ts
npm exec -- tsx tests/evolution/reviewContinuationContract.test.ts
npm exec -- tsx tests/evolution/workflowContinuationAudit.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/runCandidateReviewContinuation.ts \
  scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts \
  tests/evolution/candidateReviewContinuation.test.ts
git diff --check
git commit -m "feat: make AE review continuation candidate local"
```

---

### Task 4: Migrate HFL Retention from Selection Provenance to Candidate Provenance

**Files:**
- Modify: `scripts/evolution/humanFollowup/retainHumanFollowupWorkItem.ts`
- Modify: `scripts/evolution/runCandidateLane.ts`
- Create: `tests/evolution/candidateHumanFollowupRetention.test.ts`
- Test: `tests/evolution/humanFollowupRetention.test.ts`
- Test: `tests/evolution/humanFollowupSolutionLoopIntegration.test.ts`

**Interfaces:**

Extend HFL retention with a discriminated provenance input. Legacy callers continue using legacy selection evidence; new candidate callers use:

```ts
candidateProvenance: {
  mode: 'candidate-activation-v1';
  candidateActivationPath: string;
  hypothesisSetPath: string;
};
```

Do not create a fake `selection/selected-hypothesis.json` for a new Candidate Lane.

- [ ] **Step 1: Write failing candidate-HFL retention tests**

For a candidate that ends in effective `ESCALATE_HUMAN`, prove retained evidence contains:

```text
candidate activation artifact
original full Hypothesis Set
Problem Package
bounded diagnostic evidence
Solution / Reviewer / effective Decision evidence
```

and does **not** require a legacy Selection artifact.

Also prove two different candidates from the same Pool can create two distinct HFL items because their workflow/candidate provenance differs.

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/candidateHumanFollowupRetention.test.ts
```

- [ ] **Step 3: Implement discriminated provenance retention**

Keep the existing HFL identity rule and lifecycle unchanged. New-candidate retention must still require effective formal `ESCALATE_HUMAN` and existing accepted reason codes.

Do not add semantic dedupe or merge.

- [ ] **Step 4: Move new-path HFL creation out of the base lane**

`runCandidateLane.ts` remains base reasoning only. HFL must be created by the Host **after** candidate-local continuation resolves the effective Decision, so a base `REQUEST_MORE_WORK` cannot create premature HFL state.

Expose enough lane refs for the Host to call HFL retention.

- [ ] **Step 5: Run HFL regression suites**

```bash
npm exec -- tsx tests/evolution/candidateHumanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/humanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/humanFollowupSolutionLoopIntegration.test.ts
npm exec -- tsx tests/evolution/humanFollowupWorkItemContract.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/humanFollowup/retainHumanFollowupWorkItem.ts \
  scripts/evolution/runCandidateLane.ts \
  tests/evolution/candidateHumanFollowupRetention.test.ts
git diff --check
git commit -m "feat: retain HFL from AE candidate provenance"
```

---

### Task 5: Extract a Reusable Bounded Configuration Source-transition Primitive

**Files:**
- Create: `scripts/evolution/runBoundedSourceTransition.ts`
- Create: `tests/evolution/boundedSourceTransition.test.ts`
- Modify: `scripts/evolution/multiRoundExecutionValidation.ts`
- Test: `tests/evolution/multiRoundExecutionValidation.test.ts`
- Test: `tests/evolution/p2-success-path.test.ts`
- Test: `tests/evolution/p2-scope.test.ts`
- Test: `tests/evolution/p2-verification-failure.test.ts`
- Test: `tests/evolution/p2-rerun-failure.test.ts`
- Test: `tests/evolution/p2-configuration-participant.test.ts`

**Interfaces:**

```ts
export interface RunBoundedSourceTransitionInput {
  authoritativeRoot: string;
  transitionRoot: string;
  sourceRoot: string;
  sourceRunRef: string;
  acceptedCandidateArtifacts: {
    problemPackagePath: string;
    solutionPath: string;
    reviewPath: string;
  };
  participant: WorkspaceAgentParticipantOptions;
  // existing dependency injection hooks for materialization, execution, verification, rerun, source validation
}

export type BoundedSourceTransitionResult =
  | {
      status: 'succeeded';
      participantJobs: 1;
      executionRef: string;
      resultingRunRef: string;
      resultingSourceRoot: string;
      executionEvidenceRef: string;
    }
  | {
      status: 'failed';
      participantJobs: 0 | 1;
      failureReason: string;
      executionEvidenceRef: string | null;
    };
```

This primitive owns no Candidate scheduling and no second source transition. It performs exactly the already-authorized P2 mutation sequence for one accepted configuration candidate.

- [ ] **Step 1: Write focused extraction tests before moving code**

Require the same fail-closed behavior currently proven by P2:

```text
accepted config-only option -> isolated workspace execution
actual changed files outside allowlist -> failure
verification failure -> failure
rerun failure -> failure
invalid new seal -> failure
successful rerun -> one valid new source ref/root
no authoritative-root mutation
```

- [ ] **Step 2: Run the new test and verify red**

```bash
npm exec -- tsx tests/evolution/boundedSourceTransition.test.ts
```

- [ ] **Step 3: Extract, do not rewrite, the current P2 implementation**

Move the shared execution/materialization/scope/verification/rerun/source-validation logic out of `multiRoundExecutionValidation.ts` into `runBoundedSourceTransition.ts` while preserving current semantics and dependency-injection testability.

Make the legacy `runMultiRoundExecutionValidation()` call the new primitive. This task must be behavior-preserving for all current P2 tests.

Do not change:

```text
allowed write path derivation
configuration-only authority
repository fingerprint guard
verification command set
rerun seed/persona continuity
source seal validation
```

- [ ] **Step 4: Run P2 regression tests immediately**

```bash
npm exec -- tsx tests/evolution/boundedSourceTransition.test.ts
npm exec -- tsx tests/evolution/multiRoundExecutionValidation.test.ts
npm exec -- tsx tests/evolution/p2-success-path.test.ts
npm exec -- tsx tests/evolution/p2-scope.test.ts
npm exec -- tsx tests/evolution/p2-verification-failure.test.ts
npm exec -- tsx tests/evolution/p2-rerun-failure.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: PASS with no P2 semantic change.

- [ ] **Step 5: Commit the extraction**

```bash
git add scripts/evolution/runBoundedSourceTransition.ts \
  scripts/evolution/multiRoundExecutionValidation.ts \
  tests/evolution/boundedSourceTransition.test.ts
git diff --check
git commit -m "refactor: extract bounded AE source transition"
```

---

### Task 6: Implement the Resumable Multi-candidate Host Slice

**Files:**
- Create: `scripts/evolution/runMultiCandidateSessionSlice.ts`
- Create: `tests/evolution/multiCandidateSessionSlice.test.ts`
- Modify: `scripts/evolution/candidatePoolState.ts`
- Modify: `scripts/evolution/candidateSessionStore.ts`
- Modify: `scripts/evolution/multiCandidateSessionManifestContract.ts`
- Test: `tests/evolution/sourceCandidatePool.test.ts`
- Test: `tests/evolution/candidatePoolContract.test.ts`

**Interfaces:**

```ts
export interface RunMultiCandidateSessionSliceInput {
  mode: 'START_NEW_SESSION' | 'RESUME_SESSION';
  repositoryRoot: string;
  logicalSessionId: string;
  hostSliceId: string;
  participantBindingId: string;
  participant: WorkspaceAgentParticipantOptions;
  repositoryBaseline: {
    branch: string;
    headSha: string;
    workingTreeFingerprint: string;
  };
  initialSourceRoot?: string; // required only for START_NEW_SESSION
  authorityRefs?: string[];
  dependencies?: MultiCandidateSessionSliceDependencies;
}
```

Result:

```ts
export interface MultiCandidateSessionSliceResult {
  logicalSessionId: string;
  hostSliceId: string;
  sessionState: LogicalSessionState;
  reason: string | null;
  participantJobs: number;
  currentSourceEpochRef: string;
  manifestPath: string;
  sourceTransitionCount: 0 | 1;
}
```

- [ ] **Step 1: Write failing serial-processing tests**

Use deterministic dependency-injected candidate lane results:

```text
H1 SKIP -> H2 starts
H1 DEFER -> H2 starts
H1 ESCALATE -> HFL retention called, H2 starts
H1 terminal DEFER_MORE_WORK_REQUESTED -> H2 starts
H1 READY -> H2 does not start
H1 participant failure -> H2 does not start
```

Verify candidate records preserve original hypothesis IDs and sourceIndex.

- [ ] **Step 2: Add a failing budget-pause test**

Construct a slice where remaining Participant jobs are below admission capacity before H3. Require:

```text
Session = PAUSED
reason = HOST_SLICE_BUDGET
H3 = PENDING
no ACTIVE candidate
```

No Decision route may be synthesized for H3.

- [ ] **Step 3: Add a failing resume test**

Start slice #1, complete H1/H2, pause before H3, then invoke slice #2 with the same logicalSessionId.

Assert:

```text
Feedback calls across both slices for Source A = 1
Hypothesis calls across both slices for Source A = 1
H3 is the first candidate activated in slice #2
Participant binding is unchanged
```

- [ ] **Step 4: Implement START_NEW_SESSION orchestration**

Sequence:

```text
validate/create exact Logical Session
retain initial Source Epoch anchor
consume 2 jobs for source analysis
persist full original Hypothesis Set + Pool
while a candidate can be admitted:
  PENDING -> ACTIVE
  run base Candidate Lane
  if REQUEST_MORE_WORK: run candidate-local continuation
  resolve effective Decision
  if ESCALATE_HUMAN: retain HFL item
  retain immutable candidate lane evidence
  if ordinary terminal: mark COMPLETED and continue
  if READY: mark SOURCE_CHANGE_PENDING / barrier and stop candidate activation
  if participant failure: mark INTERRUPTED / Session FAILED and stop
if no pending candidate: Pool EXHAUSTED / Session COMPLETED unless a later Source Epoch exists
if insufficient admission budget: Session PAUSED/HOST_SLICE_BUDGET
atomically persist after every completed deterministic state transition
```

Do not perform source transition in this step yet; leave the READY barrier for Step 6 below.

- [ ] **Step 5: Implement RESUME_SESSION validation before any Participant call**

Validate all of:

```text
logicalSessionId
schema/contracts
branch
HEAD
workingTreeFingerprint
participant binding
current source anchor object hashes
Phase0 seal/hash
source-analysis artifact hashes
Hypothesis Set hash
Pool/candidate identity mapping
transition-history consistency
```

Any mismatch must throw/fail closed before Feedback/Hypothesis/Solution/Reviewer are called.

- [ ] **Step 6: Integrate one bounded source transition**

On effective READY and `sourceTransitionCount === 0`:

```text
runBoundedSourceTransition()
```

Only on `status === 'succeeded'`:

```text
create durable Source B anchor
mark old Pool SUPERSEDED
mark only old PENDING candidates SUPERSEDED with supersededBySourceEpochRef = B
increment sourceTransitionCount to 1
create Source B epoch = ANALYSIS_PENDING
set currentSourceEpochRef = B
```

If at least 2 Participant jobs remain, source analysis for B may run in the same slice; otherwise pause cleanly with Source B `ANALYSIS_PENDING` and no synthetic Pool. A later RESUME performs Feedback/Hypothesis exactly once for B.

If source transition fails, do not supersede old PENDING candidates; Session becomes `FAILED` with the exact failure reason/ref.

If `sourceTransitionCount === 1` and a Source B candidate becomes READY:

```text
candidate = SOURCE_CHANGE_PENDING
Session = PAUSED
reason = SOURCE_CHANGE_LIMIT_REACHED
```

No second configuration execution call.

- [ ] **Step 7: Run the Host-slice suite**

```bash
npm exec -- tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm exec -- tsx tests/evolution/sourceCandidatePool.test.ts
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
npm exec -- tsx tests/evolution/candidateReviewContinuation.test.ts
npm exec -- tsx tests/evolution/candidateHumanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/boundedSourceTransition.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the new Host**

```bash
git add scripts/evolution/runMultiCandidateSessionSlice.ts \
  scripts/evolution/candidatePoolState.ts \
  scripts/evolution/candidateSessionStore.ts \
  scripts/evolution/multiCandidateSessionManifestContract.ts \
  tests/evolution/multiCandidateSessionSlice.test.ts
git diff --check
git commit -m "feat: add resumable AE multi-candidate host slice"
```

---

### Task 7: Implement Crash Reconciliation Without Semantic Retry

**Files:**
- Create: `scripts/evolution/reconcileCandidateSession.ts`
- Create: `tests/evolution/candidateSessionReconciliation.test.ts`
- Modify: `scripts/evolution/runMultiCandidateSessionSlice.ts`
- Modify: `scripts/evolution/candidateSessionStore.ts`

**Interfaces:**

```ts
export type CandidateReconciliationResult =
  | { status: 'NO_ACTIVE_CANDIDATE' }
  | { status: 'RECONCILED'; candidateRef: string }
  | { status: 'INTERRUPTED'; candidateRef: string; interruptionRef: string };

export async function reconcileActiveCandidate(...): Promise<CandidateReconciliationResult>;
```

- [ ] **Step 1: Write the valid-terminal-artifact crash test**

Fixture state:

```text
Pool says H2 ACTIVE
candidate lane has Contract-valid base/effective terminal Decision and all refs required to prove completion
Pool update is missing
```

Resume must update Pool deterministically without invoking Solution/Reviewer/continuation again.

- [ ] **Step 2: Write the incomplete-terminal crash test**

Fixture state:

```text
Pool says H2 ACTIVE
Solution may exist, but no valid effective terminal Decision exists
```

Resume must produce:

```text
H2 = INTERRUPTED
Session = INTERRUPTED
no Participant call
```

- [ ] **Step 3: Run red**

```bash
npm exec -- tsx tests/evolution/candidateSessionReconciliation.test.ts
```

- [ ] **Step 4: Implement deterministic reconciliation**

Use strict existing artifact validators. Never infer a route from prose, partial files, filenames, or missing state. A terminal Decision must match candidate Problem Package identity and retained lane provenance.

- [ ] **Step 5: Invoke reconciliation before normal resume admission**

`RESUME_SESSION` sequence must be:

```text
validate baseline + durable state
reconcile ACTIVE if one exists
if interrupted -> stop
otherwise continue exact next PENDING candidate
```

- [ ] **Step 6: Run focused tests**

```bash
npm exec -- tsx tests/evolution/candidateSessionReconciliation.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionSlice.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add scripts/evolution/reconcileCandidateSession.ts \
  scripts/evolution/runMultiCandidateSessionSlice.ts \
  scripts/evolution/candidateSessionStore.ts \
  tests/evolution/candidateSessionReconciliation.test.ts
git diff --check
git commit -m "feat: reconcile interrupted AE candidate sessions"
```

---

### Task 8: Add an Explicit Start/Resume Operator Primitive Without Switching the Default CLI Yet

**Files:**
- Create: `scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts`
- Create: `tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts`
- Modify: `scripts/evolution/operator/runOrdinaryEvolution.ts` only to extract/share preflight helpers if required; do not switch its default AE workflow yet.
- Test: `tests/evolution/ordinaryEvolutionOperator.test.ts`

**Interfaces:**

```ts
export type MultiCandidateOperatorMode =
  | { mode: 'START_NEW_SESSION' }
  | { mode: 'RESUME_SESSION'; logicalSessionId: string };

export interface RunMultiCandidateOrdinaryEvolutionInput {
  repositoryRoot?: string;
  bindingId?: string;
  operation: MultiCandidateOperatorMode;
  dependencies?: ...;
}
```

START must allocate a new logical session ID and run Phase0 once. RESUME must require an exact existing logicalSessionId, must not allocate a new logical session ID, and must not call Phase0 merely to resume an unchanged Source Epoch.

Each invocation allocates a distinct deterministic/monotonic `hostSliceId` within that Logical Session.

- [ ] **Step 1: Write failing START/RESUME tests**

Prove:

```text
START -> allocateSessionId called once, Phase0 called once
RESUME -> allocateSessionId not called, Phase0 not called
RESUME missing exact session -> fail closed
RESUME wrong binding -> fail before Participant call
RESUME changed branch/HEAD/fingerprint -> fail before Participant call
```

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
```

- [ ] **Step 3: Implement the new primitive**

Reuse current operator preflight and binding resolution. START creates the first Source Epoch and delegates to `runMultiCandidateSessionSlice`. RESUME loads durable session state and delegates with exact identity.

Do not add “resume latest” behavior.

Do not archive a legacy operational report from this new primitive yet; Plan C adds multi-candidate report snapshots before activating the default operator path.

- [ ] **Step 4: Verify legacy operator still behaves as before**

```bash
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts \
  scripts/evolution/operator/runOrdinaryEvolution.ts \
  tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
git diff --check
git commit -m "feat: add AE candidate session start resume operator"
```

---

### Task 9: Verify Durable Session State Survives Project Packaging

**Files:**
- Modify only if needed: `package-project.sh`
- Modify: `tests/evolution/packageProjectCapsule.test.ts`
- Modify: `tests/evolution/ordinaryEvidenceAllowlist.test.ts` only if the new session-state path changes an existing allowlist assertion.
- Test: `tests/evolution/durableEvidencePackaging.test.ts`
- Test: `tests/evolution/durableEvidenceForensicE2E.test.ts`

**Interfaces:**
- Consumes: `artifacts/evolution/sessions/<logicalSessionId>/**` durable operational state.
- Produces: a `project.zip` that retains the canonical session manifest, source-object manifest/objects, source-analysis artifacts, and retained candidate evidence needed for future read-only diagnosis/resume reconstruction.

- [ ] **Step 1: Add a failing package fixture**

Create a fixture durable Candidate Session under `artifacts/evolution/sessions/ordinary-run-20990101-000001/` containing:

```text
session manifest
source-epoch object manifest
source objects
hypothesis set
one completed candidate Decision
one pending candidate record
```

Run `package-project.sh` and assert all required files are in the ZIP.

Also assert no transient `.tmp/evolution/**` or full agent workspace content is included because of this feature.

- [ ] **Step 2: Run red if current packaging drops any required durable path**

```bash
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
```

- [ ] **Step 3: Make the minimum packaging change only if required**

Prefer the storage layout from Task 1 that naturally survives the existing generic `artifacts/**` packaging. If a package script change is required, scope it specifically to verified Candidate Session durable state; do not broadly include all `.tmp`, `inputs`, or `agent-workspaces` paths.

- [ ] **Step 4: Run packaging/evidence regressions**

```bash
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
npm exec -- tsx tests/evolution/durableEvidencePackaging.test.ts
npm exec -- tsx tests/evolution/durableEvidenceForensicE2E.test.ts
npm exec -- tsx tests/evolution/ordinaryEvidenceAllowlist.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add package-project.sh \
  tests/evolution/packageProjectCapsule.test.ts \
  tests/evolution/ordinaryEvidenceAllowlist.test.ts
git diff --check
git commit -m "test: retain AE candidate session state in project package"
```

If `package-project.sh` required no change, commit only the relevant tests with an evidence-focused message.

---

### Task 10: Plan B Verification and Stage Status

**Files:**
- Modify: `docs/governance/current-product-stage.md`

- [ ] **Step 1: Run all Plan B focused suites**

```bash
npm exec -- tsx tests/evolution/candidateSessionStore.test.ts
npm exec -- tsx tests/evolution/candidateSliceBudget.test.ts
npm exec -- tsx tests/evolution/candidateReviewContinuation.test.ts
npm exec -- tsx tests/evolution/candidateHumanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/boundedSourceTransition.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm exec -- tsx tests/evolution/candidateSessionReconciliation.test.ts
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
npm exec -- tsx tests/evolution/reviewContinuation.test.ts
npm exec -- tsx tests/evolution/humanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/multiRoundExecutionValidation.test.ts
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run compile/static checks**

```bash
npm run typecheck
git diff --check
```

Expected: all exit 0.

- [ ] **Step 3: Re-run the legacy P2 safety set**

```bash
npm exec -- tsx tests/evolution/p2-success-path.test.ts
npm exec -- tsx tests/evolution/p2-scope.test.ts
npm exec -- tsx tests/evolution/p2-verification-failure.test.ts
npm exec -- tsx tests/evolution/p2-rerun-failure.test.ts
npm exec -- tsx tests/evolution/p2-participant-accounting.test.ts
```

Expected: PASS. If these regress, stop; do not weaken old fail-closed rules to make the new Host green.

- [ ] **Step 4: Inspect the implementation against Plan B invariants**

Verify manually:

```text
no resume-latest lookup
no session-global continuation gate on new Host
no lifetime 11-job cap on Logical Session
no budget pause while candidate ACTIVE
no old pending supersede before a valid Source B
no second source execution
no semantic retry in reconciliation
no fake Selection artifact in new path
no broad fingerprint exclusion added
```

- [ ] **Step 5: Update current stage conservatively**

Record:

```text
PD-118 DURABLE HOST ENGINEERING DELIVERED / OBSERVABILITY + DEFAULT OPERATOR ACTIVATION PENDING.
```

Do not claim the ordinary default operator, multi-candidate report snapshots, Human action set, or session-grouped index are complete until Plan C passes.

- [ ] **Step 6: Commit the verified stage update**

```bash
git add docs/governance/current-product-stage.md
git diff --check
git commit -m "docs: record AE durable candidate host status"
```

**Plan B exit criterion:** A new Host primitive can start and explicitly resume a durable Logical Session, give each candidate its own bounded continuation, enforce 11 jobs per Host slice, fail closed on baseline/crash integrity problems, perform at most one existing-authority source transition, preserve exact source/candidate evidence, and package the durable state. The default ordinary operator/reporting path remains legacy until Plan C intentionally activates the new model.
