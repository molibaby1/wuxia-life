# Auto Evolution Candidate Pool v1 — Plan A Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land PD-118 authority, add canonical Candidate Pool / Multi-candidate Session contracts, split source formation from a candidate-local lane, and prove deterministic serial multi-candidate processing on one source without durable resume or source mutation.

**Architecture:** Keep legacy multi-round readers intact. Introduce new candidate/session contracts beside them, extract Feedback+Hypothesis formation into a source-analysis unit, extract Solution/Reviewer/Decision into a candidate-local lane keyed by the original hypothesis identity, and add a pure Host scheduler that advances ordinary candidate terminals but stops at READY/failure. Do not integrate durable Logical Session resume or configuration execution until Plan B.

**Tech Stack:** TypeScript, Node.js, existing Phase0 provenance, existing Feedback/Hypothesis/Solution/Reviewer contracts, custom executable TypeScript test files (`npm exec -- tsx ...`).

**Spec:** `docs/designs/auto-evolution-source-local-candidate-pool-v1.md` (approved source in handoff: `approved/auto-evolution-source-local-candidate-pool-v1.md`).

## Global Constraints

- Execute only after confirming current branch is `dev` and re-reading current HEAD.
- First commit is documentation/authority only; no runtime code in that commit.
- Preserve PD-111 evidence restrictions exactly.
- Remove `selectFirstHypothesis` from the new active path; do not delete historical Selection readers or historical replay tests in Plan A.
- Candidate IDs must preserve original `hypothesisId` and source order.
- Candidate lifecycle state must not duplicate Decision route semantics.
- Ordinary candidate terminal disposition continues the Pool; READY/failure stops the Pool.
- No Host-slice persistence/resume, no configuration execution, no source superseding in Plan A.
- No HFL semantic change. New-path HFL retention migration is completed in Plan B when durable candidate lane evidence exists.
- Every code task uses TDD and ends with a commit.

---

## File Structure for Plan A

**Create**

- `docs/designs/auto-evolution-source-local-candidate-pool-v1.md` — accepted engineering spec.
- `scripts/evolution/candidatePoolContract.ts` — Candidate/Pool identities, states, parser/validator, deterministic builders.
- `scripts/evolution/multiCandidateSessionManifestContract.ts` — new Logical Session manifest/summary contracts; no product route aggregation.
- `scripts/evolution/runSourceCandidateAnalysis.ts` — fixed-source preflight, observable source copy, Feedback and complete Hypothesis Set formation once per Source Epoch.
- `scripts/evolution/runCandidateLane.ts` — one exact original candidate → attribution → Problem Package → Solution → Reviewer → base Decision; writes candidate activation provenance.
- `scripts/evolution/candidatePoolState.ts` — pure deterministic state transitions and next-candidate activation selection.
- `scripts/evolution/runSourceCandidatePool.ts` — in-memory/one-invocation serial scheduler used for Plan A integration tests.
- `tests/evolution/candidatePoolContract.test.ts`
- `tests/evolution/multiCandidateSessionManifestContract.test.ts`
- `tests/evolution/sourceCandidateAnalysis.test.ts`
- `tests/evolution/candidateLane.test.ts`
- `tests/evolution/sourceCandidatePool.test.ts`

**Modify**

- `docs/product/auto-evolution-model.md`
- `docs/governance/product-decisions.md`
- `docs/governance/current-product-stage.md`
- `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts` — become a legacy compatibility wrapper over the extracted source-analysis + first-candidate lane; no longer the future multi-candidate Host.
- `scripts/evolution/problemAgnosticSolution/buildProblemPackage.ts` — add an active-candidate input path that does not require a Selection artifact while preserving legacy selected-hypothesis support.
- `tests/evolution/problemAgnosticAgentSolutionLoop.test.ts`
- `tests/evolution/problemPackageBuilder.test.ts`
- `tests/evolution/boundedCausalAttribution.test.ts` only if its helper input must accept activation provenance instead of a selected-hypothesis artifact.

**Keep as legacy/read-only in Plan A**

- `scripts/evolution/freshProblemTransfer/selectFirstHypothesis.ts`
- `scripts/evolution/multiRoundRunManifestContract.ts`
- `scripts/evolution/multiRoundExecutionValidation.ts`
- historical Selection/replay tests.

---

### Task 1: Land the Human-Accepted Authority Before Runtime Changes

**Files:**
- Create: `docs/designs/auto-evolution-source-local-candidate-pool-v1.md`
- Modify: `docs/product/auto-evolution-model.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/governance/current-product-stage.md`
- Source: `approved/auto-evolution-source-local-candidate-pool-v1.md`
- Source: `approved/pd-118-source-local-candidate-pool-v1.md`
- Source: `approved/pd-118-authority-sync.md`

**Interfaces:**
- Consumes: Human-approved written spec and PD-118 text in this handoff.
- Produces: repository authority that unambiguously authorizes activeCandidate/Candidate Pool semantics before runtime implementation.

- [ ] **Step 1: Verify authority files still contain the old implementation semantics**

Run:

```bash
git branch --show-current
git rev-parse HEAD
grep -n "selectFirstHypothesis\|selected hypothesis\|每 session 最多一次 continuation\|最多 11" \
  docs/product/auto-evolution-model.md docs/governance/product-decisions.md
```

Expected: branch `dev`; old Selection / session-wide continuation wording is still present before the authority commit.

- [ ] **Step 2: Copy the accepted design spec exactly and mark written review accepted**

Run from the handoff root:

```bash
cp approved/auto-evolution-source-local-candidate-pool-v1.md \
  docs/designs/auto-evolution-source-local-candidate-pool-v1.md
```

Expected first status line contains:

```text
HUMAN-ACCEPTED / WRITTEN SPEC REVIEW ACCEPTED；ENGINEERING NOT STARTED
```

- [ ] **Step 3: Append the accepted PD-118 text and update the stale decision-ledger date**

Append exactly the contents of `approved/pd-118-source-local-candidate-pool-v1.md` to `docs/governance/product-decisions.md`, separated by one blank line. Change the ledger metadata to:

```text
> 最后更新：2026-09-15
```

Do not edit PD-117 historical wording; PD-118 records the superseding relationship.

- [ ] **Step 4: Apply the first-layer product-model authority sync**

Use `approved/pd-118-authority-sync.md` section 1 as the exact semantic checklist. Ensure `docs/product/auto-evolution-model.md` explicitly states all of the following:

```text
Candidate terminal != Candidate Pool exhausted.
activeCandidate.evidenceRefs owns bounded diagnostic scope.
Logical Session != Host invocation.
One continuation per Candidate Lane.
11 Participant jobs per Host execution slice.
READY is a source-change barrier.
Session has lifecycle state, not an overall product route.
Report may expose multiple candidate facts and multiple Human actions.
```

- [ ] **Step 5: Update current stage without claiming engineering completion**

Add a dated entry to `docs/governance/current-product-stage.md` equivalent to:

```text
PD-118 Source-local Candidate Pool / Multi-candidate Session v1:
HUMAN ACCEPTED / WRITTEN SPEC REVIEW ACCEPTED / ENGINEERING NOT STARTED.
Current dev runtime is still legacy multi-round + selectFirstHypothesis until the implementation plans complete.
```

Keep the overall project stage `RUN / OBSERVE`; do not claim Candidate Pool is delivered.

- [ ] **Step 6: Verify authority consistency**

Run:

```bash
grep -n "PD-118\|activeCandidate\|Candidate Pool\|Host execution slice" \
  docs/product/auto-evolution-model.md \
  docs/governance/product-decisions.md \
  docs/governance/current-product-stage.md \
  docs/designs/auto-evolution-source-local-candidate-pool-v1.md

git diff --check
```

Expected: all four documents contain the new authority; no runtime/script/test files are changed in this commit; `git diff --check` exits 0.

- [ ] **Step 7: Commit the authority gate**

```bash
git add docs/product/auto-evolution-model.md \
  docs/governance/product-decisions.md \
  docs/governance/current-product-stage.md \
  docs/designs/auto-evolution-source-local-candidate-pool-v1.md
git commit -m "docs: accept AE source-local candidate pool v1"
```

---

### Task 2: Add Candidate Pool and Multi-candidate Session Contracts

**Files:**
- Create: `scripts/evolution/candidatePoolContract.ts`
- Create: `scripts/evolution/multiCandidateSessionManifestContract.ts`
- Test: `tests/evolution/candidatePoolContract.test.ts`
- Test: `tests/evolution/multiCandidateSessionManifestContract.test.ts`

**Interfaces:**
- Consumes: `ImprovementHypothesis`, existing `SolutionDecisionV1` route/reason artifacts by reference only.
- Produces:
  - `CandidateProcessingState = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SOURCE_CHANGE_PENDING' | 'INTERRUPTED' | 'SUPERSEDED'`
  - `CandidatePoolStatus = 'PROCESSING' | 'SOURCE_CHANGE_BARRIER' | 'EXHAUSTED' | 'SUPERSEDED' | 'INTERRUPTED'`
  - `CandidatePoolV1`, `CandidateRecordV1`, `CandidatePoolTransitionV1`
  - `MultiCandidateSessionManifestV1`, `MultiCandidateSessionSummaryV1`
  - `parseCandidatePoolV1`, `buildCandidatePoolV1`, `parseMultiCandidateSessionManifestV1`, `buildMultiCandidateSessionSummaryV1`

- [ ] **Step 1: Write failing Candidate Pool contract tests**

Create tests that require these exact invariants:

```ts
assert.deepEqual(pool.candidates.map(c => c.hypothesisId), [
  'hypothesis-000001',
  'hypothesis-000002',
]);
assert.deepEqual(pool.candidates.map(c => c.sourceIndex), [0, 1]);
assert.equal(pool.candidates[1]!.processingState, 'PENDING');
assert.throws(() => parseCandidatePoolV1({ ...pool, candidates: [
  { ...pool.candidates[0], sourceIndex: 1 },
  { ...pool.candidates[1], sourceIndex: 0 },
] }));
```

Also prove the parser rejects:

```text
more than one ACTIVE candidate
COMPLETED candidate without effectiveDecisionRef
SOURCE_CHANGE_PENDING candidate without effectiveDecisionRef
SUPERSEDED candidate without supersededBySourceEpochRef
Pool EXHAUSTED while any candidate remains PENDING/ACTIVE
candidateRef/hypothesis identity mismatch
duplicate hypothesisId/sourceIndex
```

- [ ] **Step 2: Run Candidate Pool tests and verify red**

```bash
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
```

Expected: FAIL because `candidatePoolContract.ts` does not exist.

- [ ] **Step 3: Implement the exact contract surface**

Start the new file with these public types/constants:

```ts
export const CANDIDATE_POOL_SCHEMA_VERSION = 'candidate-pool-v1' as const;

export type CandidateProcessingState =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SOURCE_CHANGE_PENDING'
  | 'INTERRUPTED'
  | 'SUPERSEDED';

export type CandidatePoolStatus =
  | 'PROCESSING'
  | 'SOURCE_CHANGE_BARRIER'
  | 'EXHAUSTED'
  | 'SUPERSEDED'
  | 'INTERRUPTED';

export interface CandidateRecordV1 {
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  hypothesisSha256: string;
  processingState: CandidateProcessingState;
  laneRef: string | null;
  baseDecisionRef: string | null;
  effectiveDecisionRef: string | null;
  humanFollowupRef: string | null;
  sourceTransitionRef: string | null;
  interruptionRef: string | null;
  supersededBySourceEpochRef: string | null;
}
```

`CandidatePoolV1` must include the exact source, hypothesis-set, baseline, status, candidates, and transitions fields from the accepted spec. Compute `poolId` deterministically from canonical JSON of logicalSessionId + sourceRunRef + sourceFingerprintSha256 + hypothesisSet.sha256. Compute each `hypothesisSha256` from canonical JSON of the original hypothesis object. Do not include natural-language similarity or priority fields.

- [ ] **Step 4: Write failing Multi-candidate Session contract tests**

Require a summary that exposes lifecycle and counts but no product-route aggregation:

```ts
const summary = buildMultiCandidateSessionSummaryV1(manifest);
assert.equal(summary.sessionState, 'PAUSED');
assert.equal(summary.sourceEpochs[0]!.candidateCounts.completed, 2);
assert.equal('lastRoundTerminalRoute' in summary, false);
assert.equal('overallRoute' in summary, false);
assert.equal('dominantRoute' in summary, false);
```

Reject `sourceTransitionCount > 1` and invalid currentSourceEpochRef.

- [ ] **Step 5: Run the new session-contract test and verify red**

```bash
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
```

Expected: FAIL because the new contract file does not exist.

- [ ] **Step 6: Implement the new Session manifest/summary contract**

Use this public lifecycle:

```ts
export type LogicalSessionState =
  | 'PROCESSING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | 'FAILED';

export interface MultiCandidateSessionLimitsV1 {
  maxParticipantJobsPerHostSlice: 11;
  maxCandidateContinuations: 1;
  maxCandidateContinuationParticipantJobs: 2;
  maxCandidateLaneParticipantJobs: 4;
  maxExecutionParticipantJobs: 1;
  maxSourceTransitions: 1;
  semanticRetryCount: 0;
}
```

Do not add an overall route field. Source Epoch summaries may expose disposition counts derived from candidate Decision artifacts later, but Session lifecycle stays separate.

- [ ] **Step 7: Run both contract suites**

```bash
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit contracts**

```bash
git add scripts/evolution/candidatePoolContract.ts \
  scripts/evolution/multiCandidateSessionManifestContract.ts \
  tests/evolution/candidatePoolContract.test.ts \
  tests/evolution/multiCandidateSessionManifestContract.test.ts
git commit -m "feat: add AE candidate pool session contracts"
```

---

### Task 3: Extract Source Analysis So Feedback and Hypotheses Are Formed Once

**Files:**
- Create: `scripts/evolution/runSourceCandidateAnalysis.ts`
- Modify: `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts`
- Test: `tests/evolution/sourceCandidateAnalysis.test.ts`
- Test: `tests/evolution/problemAgnosticAgentSolutionLoop.test.ts`

**Interfaces:**
- Consumes: fixed sealed Phase0 source, Feedback Participant, Improvement Hypothesis Participant.
- Produces:

```ts
export interface CompletedSourceCandidateAnalysisResult {
  status: 'completed';
  sourceRunRef: string;
  sourceRoot: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  authoritativeFingerprintSha256: string;
  observablePayloadRef: 'source/observable-payload.json';
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  hypotheses: ImprovementHypothesis[];
  noProblemAssessment: ImprovementHypothesisSetV2['noProblemAssessment'];
  actualParticipantJobs: 2;
}
```

Participant failure stays a fail-closed source-analysis result; it does not create a Candidate record.

- [ ] **Step 1: Write failing extraction tests**

Prove:

```ts
assert.equal(feedbackCalls, 1);
assert.equal(hypothesisCalls, 1);
assert.deepEqual(result.hypotheses.map(h => h.hypothesisId), [
  'hypothesis-000001',
  'hypothesis-000002',
]);
assert.equal(await exists(join(root, 'selection/selected-hypothesis.json')), false);
```

Also prove zero hypotheses retain the exact validated `noProblemAssessment` returned by the hypothesis contract.

- [ ] **Step 2: Run the test and verify red**

```bash
npm exec -- tsx tests/evolution/sourceCandidateAnalysis.test.ts
```

Expected: FAIL because the new source-analysis runner does not exist.

- [ ] **Step 3: Move source-only responsibilities out of the legacy loop**

`runSourceCandidateAnalysis` owns exactly:

```text
preflightFixedSource
copy sealed source / observable payload
capture authority/skill provenance required before Participants
run External Feedback once
run Improvement Hypothesis once
write feedback/hypothesis artifacts once
capture authoritative fingerprint
return complete validated hypothesis set
```

It must not call `selectFirstHypothesis`, bounded attribution, Solution, Reviewer, Decision routing, HFL retention, or configuration execution.

- [ ] **Step 4: Make the existing loop call the new source-analysis helper**

Keep `runProblemAgnosticAgentSolutionLoop` behavior temporarily compatible for its existing callers, but remove duplicate Feedback/Hypothesis implementation from that file. It may still choose the first candidate in its **legacy compatibility wrapper** until Task 6 introduces the new scheduler. Add an explicit comment:

```ts
// Legacy single-candidate compatibility path only.
// The PD-118 active Host uses runSourceCandidatePool / multi-candidate session orchestration.
```

- [ ] **Step 5: Run focused tests**

```bash
npm exec -- tsx tests/evolution/sourceCandidateAnalysis.test.ts
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npm exec -- tsx tests/evolution/improvementHypothesisContract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the extraction**

```bash
git add scripts/evolution/runSourceCandidateAnalysis.ts \
  scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts \
  tests/evolution/sourceCandidateAnalysis.test.ts \
  tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
git commit -m "refactor: separate AE source candidate analysis"
```

---

### Task 4: Add Candidate Activation Provenance and a Candidate-local Problem Package Path

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/buildProblemPackage.ts`
- Create: `tests/evolution/candidateLane.test.ts` (initial activation/problem-package cases)
- Modify: `tests/evolution/problemPackageBuilder.test.ts`

**Interfaces:**
- Consumes: one exact `ImprovementHypothesis`, original `sourceIndex`, original hypothesis-set ref/hash.
- Produces activation artifact at `<candidateLaneRoot>/candidate-activation.json` with:

```ts
{
  schemaVersion: 'candidate-activation-v1',
  candidateRef,
  poolId,
  hypothesisId,
  sourceIndex,
  hypothesisSha256,
  hypothesisSetRef,
  sourceRunRef,
}
```

`buildProblemPackage` gains a candidate-based input path and preserves its legacy selected-hypothesis input path for historical callers.

- [ ] **Step 1: Write failing Problem Package tests**

Require a candidate-based build that never reads `selection/selected-hypothesis.json`:

```ts
const built = await buildProblemPackage({
  activeCandidate: hypothesis2,
  activeCandidateRef: 'pool-x/hypothesis-000002',
  activeCandidateSourceIndex: 1,
  // existing source/authority inputs...
});
assert.match(built.problemId, /hypothesis-000002$/);
```

Also assert no normalization changes the hypothesis ID.

- [ ] **Step 2: Run the builder tests and verify red**

```bash
npm exec -- tsx tests/evolution/problemPackageBuilder.test.ts
npm exec -- tsx tests/evolution/candidateLane.test.ts
```

Expected: FAIL on missing candidate-based input/API.

- [ ] **Step 3: Implement the dual input contract without inventing a Selection artifact**

Add a discriminated input shape such as:

```ts
type ProblemPackageCandidateInput = {
  activeCandidate: ImprovementHypothesis;
  activeCandidateRef: string;
  activeCandidateSourceIndex: number;
};

type ProblemPackageLegacySelectionInput = {
  selectedHypothesisPath: string;
};
```

Require exactly one branch. Candidate mode derives the problem directly from the supplied original hypothesis. Legacy mode keeps historical behavior.

- [ ] **Step 4: Run focused tests**

```bash
npm exec -- tsx tests/evolution/problemPackageBuilder.test.ts
npm exec -- tsx tests/evolution/candidateLane.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit candidate-based handoff support**

```bash
git add scripts/evolution/problemAgnosticSolution/buildProblemPackage.ts \
  tests/evolution/problemPackageBuilder.test.ts \
  tests/evolution/candidateLane.test.ts
git commit -m "feat: build problem packages from active candidates"
```

---

### Task 5: Extract One Candidate Lane with Exact PD-111 Scope

**Files:**
- Create: `scripts/evolution/runCandidateLane.ts`
- Modify: `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts`
- Modify: `tests/evolution/candidateLane.test.ts`
- Modify: `tests/evolution/boundedCausalAttribution.test.ts`
- Modify: `tests/evolution/problemAgnosticAgentSolutionLoop.test.ts`

**Interfaces:**
- Consumes:

```ts
export interface RunCandidateLaneOptions {
  repositoryRoot: string;
  sourceRoot: string;
  laneRoot: string;
  poolId: string;
  candidateRef: string;
  candidate: ImprovementHypothesis;
  sourceIndex: number;
  hypothesisSetRef: string;
  hypothesisSetSha256: string;
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  observablePayloadRef: string;
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  authorityRefs: string[];
  participant: WorkspaceAgentParticipantOptions;
  participantMode: 'deepseek' | 'local-subagent';
  dependencies?: CandidateLaneDependencies;
}
```

- Produces base lane result with candidate-local `actualParticipantJobs` of `1` or `2`, plus immutable activation/problem-package/diagnostic/Solution/Reviewer/base Decision artifacts. Continuation is not performed in Plan A.

- [ ] **Step 1: Expand candidate-lane tests with original-ID and evidence-isolation cases**

Use three hypotheses with disjoint refs and run H2. Assert:

```ts
assert.equal(result.hypothesisId, 'hypothesis-000002');
assert.equal(result.sourceIndex, 1);
assert.equal(result.actualParticipantJobs, 2);
assert.deepEqual(causalAttribution.selectedObservableRefs, hypothesis2.evidenceRefs);
assert.equal(await exists(join(laneRoot, 'selection/selected-hypothesis.json')), false);
```

Also inspect Solution/Reviewer workspace artifacts and prove the byte-identical diagnostic file only contains H2-scoped attribution.

- [ ] **Step 2: Run candidate-lane tests and verify red**

```bash
npm exec -- tsx tests/evolution/candidateLane.test.ts
npm exec -- tsx tests/evolution/boundedCausalAttribution.test.ts
```

Expected: FAIL because `runCandidateLane` does not exist.

- [ ] **Step 3: Move candidate-only responsibilities into `runCandidateLane`**

The function must perform exactly:

```text
write candidate-activation.json create-only
build bounded attribution from candidate.evidenceRefs
build candidate-mode Problem Package
prepare isolated Solution workspace
run Solution
if OPTIONS: prepare independent Reviewer workspace and run Reviewer
route base Decision
write decision.json create-only
write human-review-package.md
return candidate-local result
```

Do not run Feedback/Hypothesis, HFL retention, continuation, configuration execution, or source rerun here.

The base Decision budget must be candidate-local:

```ts
budget: {
  actualParticipantJobs: reviewerRan ? 2 : 1,
  maxParticipantJobs: 4,
  retryCount: 0,
}
```

- [ ] **Step 4: Convert the legacy single-candidate loop to delegate to `runCandidateLane`**

The compatibility wrapper may select first hypothesis only to preserve legacy callers/tests, then pass that exact original object/sourceIndex `0` into `runCandidateLane`. The new multi-candidate scheduler added next must not call `selectFirstHypothesis`.

- [ ] **Step 5: Run focused regression tests**

```bash
npm exec -- tsx tests/evolution/candidateLane.test.ts
npm exec -- tsx tests/evolution/boundedCausalAttribution.test.ts
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npm exec -- tsx tests/evolution/problemPackageBuilder.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the candidate lane**

```bash
git add scripts/evolution/runCandidateLane.ts \
  scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts \
  tests/evolution/candidateLane.test.ts \
  tests/evolution/boundedCausalAttribution.test.ts \
  tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
git commit -m "refactor: add candidate-local AE investigation lane"
```

---

### Task 6: Add Pure Candidate Pool State Transitions

**Files:**
- Create: `scripts/evolution/candidatePoolState.ts`
- Modify: `tests/evolution/candidatePoolContract.test.ts`

**Interfaces:**
- Consumes: valid `CandidatePoolV1`.
- Produces pure functions:

```ts
export function nextPendingCandidate(pool: CandidatePoolV1): CandidateRecordV1 | null;
export function activateCandidate(pool: CandidatePoolV1, candidateRef: string): CandidatePoolV1;
export function completeCandidate(pool: CandidatePoolV1, candidateRef: string, refs: {
  laneRef: string;
  baseDecisionRef: string;
  effectiveDecisionRef: string;
}): CandidatePoolV1;
export function markSourceChangePending(...): CandidatePoolV1;
export function interruptCandidate(...): CandidatePoolV1;
export function exhaustPoolIfComplete(pool: CandidatePoolV1): CandidatePoolV1;
```

No filesystem, Participant calls, route ranking, or semantic inference in this module.

- [ ] **Step 1: Write failing transition tests**

Require:

```ts
const h1 = nextPendingCandidate(pool)!;
assert.equal(h1.hypothesisId, 'hypothesis-000001');
const active = activateCandidate(pool, h1.candidateRef);
assert.equal(active.candidates.filter(c => c.processingState === 'ACTIVE').length, 1);
```

Then prove H1 completion makes H2 next, and READY changes Pool status to `SOURCE_CHANGE_BARRIER` so `nextPendingCandidate()` returns `null`.

- [ ] **Step 2: Run and verify red**

```bash
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
```

Expected: FAIL on missing transition functions.

- [ ] **Step 3: Implement pure immutable transitions**

Every function returns a newly validated Pool object. Append one deterministic transition record for each state change. Do not mutate the input object.

- [ ] **Step 4: Run and verify green**

```bash
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit state transitions**

```bash
git add scripts/evolution/candidatePoolState.ts tests/evolution/candidatePoolContract.test.ts
git commit -m "feat: add deterministic AE candidate pool transitions"
```

---

### Task 7: Prove One-source Serial Multi-candidate Processing

**Files:**
- Create: `scripts/evolution/runSourceCandidatePool.ts`
- Create: `tests/evolution/sourceCandidatePool.test.ts`
- Modify: `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts` only if exports/shared dependency types must move; do not switch the ordinary operator yet.

**Interfaces:**
- Consumes: `runSourceCandidateAnalysis`, `buildCandidatePoolV1`, pure pool transitions, `runCandidateLane`.
- Produces:

```ts
export interface RunSourceCandidatePoolResult {
  sourceAnalysis: CompletedSourceCandidateAnalysisResult;
  pool: CandidatePoolV1;
  laneResults: CandidateLaneResult[];
  participantJobs: number;
  stopKind: 'POOL_EXHAUSTED' | 'SOURCE_CHANGE_BARRIER' | 'PARTICIPANT_FAILURE';
}
```

- [ ] **Step 1: Write failing scheduler tests for ordinary terminals**

Mock source analysis with H1/H2/H3 and lane outcomes:

```text
H1 → SKIP
H2 → DEFER
H3 → ESCALATE_HUMAN
```

Assert invocation order is exactly `[H1, H2, H3]`, all three become `COMPLETED`, Pool becomes `EXHAUSTED`, and no route precedence is computed.

- [ ] **Step 2: Add READY/failure stopping tests**

Fixture:

```text
H1 → SKIP
H2 → READY_FOR_CONFIG_EXECUTION
H3 → must not be invoked
```

Expected H2 `SOURCE_CHANGE_PENDING`, Pool `SOURCE_CHANGE_BARRIER`, H3 remains `PENDING`.

Second fixture: H2 Participant failure → H2 `INTERRUPTED`, Pool `INTERRUPTED`, H3 remains `PENDING`.

- [ ] **Step 3: Run and verify red**

```bash
npm exec -- tsx tests/evolution/sourceCandidatePool.test.ts
```

Expected: FAIL because scheduler does not exist.

- [ ] **Step 4: Implement the minimal serial scheduler**

The loop must be mechanically equivalent to:

```ts
while (pool.status === 'PROCESSING') {
  const next = nextPendingCandidate(pool);
  if (next === null) {
    pool = exhaustPoolIfComplete(pool);
    break;
  }
  pool = activateCandidate(pool, next.candidateRef);
  const result = await runCandidateLaneFor(next);
  if (result.status === 'participant_failure') {
    pool = interruptCandidate(pool, next.candidateRef, result.workflowOutcomeRef);
    break;
  }
  if (result.decision.route === 'READY_FOR_CONFIG_EXECUTION') {
    pool = markSourceChangePending(pool, next.candidateRef, result.refs);
    break;
  }
  pool = completeCandidate(pool, next.candidateRef, result.refs);
}
```

Do not add budget pause/resume, continuation, HFL retention, or source execution in this Plan A scheduler.

- [ ] **Step 5: Run foundation integration tests**

```bash
npm exec -- tsx tests/evolution/sourceCandidatePool.test.ts
npm exec -- tsx tests/evolution/candidateLane.test.ts
npm exec -- tsx tests/evolution/sourceCandidateAnalysis.test.ts
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the serial Pool foundation**

```bash
git add scripts/evolution/runSourceCandidatePool.ts tests/evolution/sourceCandidatePool.test.ts
git commit -m "feat: process AE candidates serially per source"
```

---

### Task 8: Plan A Closure and Legacy Guard

**Files:**
- Modify only if failures prove necessary: legacy tests/files already named in this plan.

**Interfaces:**
- Produces: a reviewed foundation that Plan B can integrate into the ordinary Host without changing approved semantics.

- [ ] **Step 1: Prove the new path has no semantic Selection dependency**

Run:

```bash
grep -R "selectFirstHypothesis" \
  scripts/evolution/runSourceCandidateAnalysis.ts \
  scripts/evolution/runCandidateLane.ts \
  scripts/evolution/candidatePoolState.ts \
  scripts/evolution/runSourceCandidatePool.ts && exit 1 || true
```

Expected: no matches.

- [ ] **Step 2: Prove legacy Selection support still exists for historical compatibility**

```bash
npm exec -- tsx tests/evolution/freshProblemTransferSelection.test.ts
npm exec -- tsx tests/evolution/selectionPriorityReplay.test.ts
npm exec -- tsx tests/evolution/conservativeSelectionReplayContract.test.ts
```

Expected: PASS. These are historical/experiment compatibility tests, not active-path authority.

- [ ] **Step 3: Run the Plan A regression set**

```bash
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
npm exec -- tsx tests/evolution/sourceCandidateAnalysis.test.ts
npm exec -- tsx tests/evolution/candidateLane.test.ts
npm exec -- tsx tests/evolution/sourceCandidatePool.test.ts
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npm exec -- tsx tests/evolution/problemPackageBuilder.test.ts
npm exec -- tsx tests/evolution/boundedCausalAttribution.test.ts
npm run typecheck
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Inspect the diff against Plan A non-goals**

```bash
git diff --stat HEAD~7..HEAD
git diff --check HEAD~7..HEAD
```

Verify manually that Plan A did not modify `multiRoundExecutionValidation.ts`, ordinary operator runtime semantics, HFL lifecycle, configuration execution authority, gameplay code/content, or legacy archived artifacts.

- [ ] **Step 5: Record Plan A implementation status in current stage only after verification**

Update the PD-118 entry in `docs/governance/current-product-stage.md` to:

```text
FOUNDATION ENGINEERING DELIVERED / HOST INTEGRATION NOT YET COMPLETE.
```

Do not claim ordinary operator migration, resume, source transition, or reporting complete.

- [ ] **Step 6: Commit the verified Plan A stage update**

```bash
git add docs/governance/current-product-stage.md
git commit -m "docs: record AE candidate pool foundation status"
```

**Plan A exit criterion:** The repository has formal PD-118 authority, canonical candidate/session contracts, one-time source analysis, an exact-original-ID Candidate Lane, and deterministic serial one-source Pool processing. Ordinary operator still uses the legacy Host until Plan B.
