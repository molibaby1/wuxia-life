# Auto Evolution Durable Evidence Capsule v1 Closure Patch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining contract gaps in the already-implemented Durable Evidence Capsule v1 without redesigning the feature or changing AE product semantics.

**Architecture:** Keep the current Capsule implementation and patch only the identified gaps: strict evidence allowlisting, semantic isolation of observability writes, bounded manual repair, role-bound participant receipts, fail-closed manifest validation, and package completeness verification. The current dirty implementation is the working base; clean `dev@657155f09ca7272b758c7f562b1b0230c9f91ff0` is used only as an isolated A/B baseline for failure attribution.

**Tech Stack:** TypeScript, Node.js `fs/promises`, `tsx` tests, existing AE contracts and ordinary operator, Bash `package-project.sh`.

**Spec:** `docs/superpowers/specs/2026-09-13-auto-evolution-durable-evidence-capsule-v1-design.md`

## Global Constraints

- Start from the existing uncommitted Durable Evidence implementation. **Do not reset, checkout, or discard the current working tree.**
- Repository authority baseline for A/B comparison only: `molibaby1/wuxia-life`, branch `dev`, commit `657155f09ca7272b758c7f562b1b0230c9f91ff0`.
- Preserve PD-100 HFL trigger scope.
- Preserve PD-111 Participant evidence authority; durable Human forensic retention must not widen Participant-visible inputs.
- Preserve PD-117 continuation semantics, budgets, base-decision immutability, and effective-route behavior.
- Do not retain complete Agent workspaces or the whole `.tmp/evolution/**` tree.
- Do not add exact filesystem replay guarantees.
- Do not add Participant jobs, gameplay reruns, or new reasoning stages for evidence purposes.
- Observability/evidence write failure must not alter the already-defined AE semantic route or prevent an otherwise-valid Participant invocation.
- Use TDD for every behavioral fix: write a failing test, observe the intended failure, make the smallest production change, rerun focused tests, then commit.
- Keep unrelated baseline failures separate; do not modify gameplay code/tests to make the full gate green.

---

## File Map

### Existing files to modify

- `scripts/evolution/evidence/ordinaryEvidenceCollector.ts`
  - Replace broad recursive tree collection with contract-declared evidence enumeration.
- `scripts/evolution/evidence/durableEvidenceCapsule.ts`
  - Make manifest parsing fail closed; require `sourceRef`; add role-bound participant receipt contract and validation.
- `scripts/evolution/evidence/durableEvidenceIndex.ts`
  - Keep index rebuild independent from Capsule publication; no semantic change.
- `scripts/evolution/evidence/verifyPackagedEvidence.ts`
  - Verify package metadata against actual extracted Capsules, not merely the Capsules that happen to exist.
- `scripts/evolution/participantObservability.ts`
  - Make prompt/binding sidecar persistence best-effort and non-semantic.
- `scripts/evolution/localEvidenceOnlyParticipant.ts`
  - Preserve available local Participant stderr without making persistence failure semantic.
- `scripts/evolution/runMinimalExternalFeedback.ts`
  - Persist available stderr and expose enough invocation facts for receipt construction.
- `scripts/evolution/runImprovementHypothesis.ts`
  - Same minimum invocation evidence as Feedback.
- `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
  - Keep current stderr behavior; expose/refine receipt inputs only as needed.
- `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`
  - Persist available stderr best-effort; prompt/binding write failure must not suppress Reviewer execution.
- `scripts/evolution/configurationExecutionParticipant.ts`
  - Persist available stderr best-effort; include authority refs needed by the receipt.
- `scripts/evolution/multiRoundExecutionValidation.ts`
  - Configuration evidence capture failure must not change execution/route semantics.
- `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts`
  - Authority/skill snapshot retention failure must not prevent Solution/Reviewer execution.
- `scripts/evolution/operator/runOrdinaryEvolution.ts`
  - Use shared Capsule retention; separate Capsule publish success from index refresh failure; correct repair guidance.
- `package-project.sh`
  - Invoke strengthened post-extraction verifier; no change to latest-5 policy.
- `package.json`
  - Add bounded manual repair command.

### New files to create

- `scripts/evolution/evidence/retainOrdinaryEvidence.ts`
  - Shared ordinary-session → Capsule retention function used by the operator and repair CLI.
- `scripts/evolution/evidence/repairOrdinaryEvidence.ts`
  - CLI for bounded repair of an already-completed existing `.tmp` session.
- `scripts/evolution/evidence/participantReceipt.ts`
  - Build and validate role-bound participant receipts from explicit historical artifacts and manifest objects.

### Tests to modify/create

- Modify `tests/evolution/durableEvidenceCapsule.test.ts`
- Modify `tests/evolution/durableEvidenceForensicE2E.test.ts`
- Modify `tests/evolution/durableEvidencePackaging.test.ts`
- Modify `tests/evolution/packageProjectCapsule.test.ts`
- Modify `tests/evolution/ordinaryEvolutionOperator.test.ts`
- Modify `tests/evolution/configurationEvidence.test.ts`
- Modify the existing Feedback/Hypothesis/Solution/Reviewer/configuration Participant tests that already assert observability artifacts.
- Create `tests/evolution/ordinaryEvidenceAllowlist.test.ts`
- Create `tests/evolution/durableEvidenceRepair.test.ts`
- Create `tests/evolution/participantReceipt.test.ts`
- Create `tests/evolution/observabilitySemanticIsolation.test.ts`

---

### Task 1: Replace Recursive Retention with a Strict Contract Allowlist

**Files:**
- Modify: `scripts/evolution/evidence/ordinaryEvidenceCollector.ts`
- Create: `tests/evolution/ordinaryEvidenceAllowlist.test.ts`
- Modify: `tests/evolution/durableEvidenceForensicE2E.test.ts`

**Interfaces:**
- Consumes: `CollectOrdinaryEvidenceInput`, Phase0 seal helpers, completed ordinary session layout.
- Produces: unchanged public function `collectOrdinaryEvidence(input): Promise<DurableEvidenceObjectInput[]>`.
- Invariant: no undeclared file becomes durable merely because it appears below `round-1`, `round-2`, `configuration-execution`, `authority-snapshots`, or `skill-snapshots`.

- [ ] **Step 1: Write the failing undeclared-file test**

Create a completed fixture with a legitimate Feedback artifact and an undeclared sibling:

```ts
await writeFile(join(roundRoot, 'feedback-runs', sourceRunRef, 'feedback.json'), '{}\n');
await writeFile(join(roundRoot, 'debug-secret.txt'), 'must-not-retain\n');

const evidence = await collectOrdinaryEvidence({
  repositoryRoot,
  sessionRoot,
  experimentRoot,
  sessionId,
  sourceRunRefs: [sourceRunRef],
});

assert.equal(
  evidence.some(item => item.sourceRef === 'round-1/debug-secret.txt'),
  false,
);
```

Add the same negative assertion for an undeclared file nested below a legitimate Participant directory, e.g. `round-1/solution-agent/uncontracted-debug.log`.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm exec -- tsx tests/evolution/ordinaryEvidenceAllowlist.test.ts
```

Expected: FAIL because current `collectTree()` recursively retains the undeclared files.

- [ ] **Step 3: Replace `collectTree()` with explicit artifact-family enumeration**

Delete broad recursive collection as the retention mechanism. Keep a small helper that only adds an exact declared path:

```ts
async function addDeclaredFile(input: {
  root: string;
  sourceRef: string;
  relativePath: string;
  evidence: DurableEvidenceObjectInput[];
  required: boolean;
  visibility?: DurableEvidenceVisibility;
  evidenceKind?: string;
}): Promise<void> {
  const sourcePath = join(resolve(input.root), input.sourceRef);
  if (!await isRegularFile(sourcePath)) {
    if (input.required) throw new Error(`required ordinary evidence is missing: ${input.sourceRef}`);
    return;
  }
  input.evidence.push({
    logicalName: `session:${input.sourceRef}`,
    relativePath: input.relativePath,
    sourcePath,
    visibility: input.visibility ?? visibilityFor(input.sourceRef),
    evidenceKind: input.evidenceKind ?? evidenceKindFor(input.sourceRef),
    sourceRef: input.sourceRef,
  });
}
```

Enumerate only contract-declared families. At minimum include the exact applicable paths already required by the accepted spec and current workflow:

```ts
const ROUND_ROOT_FILES = [
  'selection/selected-hypothesis.json',
  'causal-attribution/bounded-causal-attribution.json',
  'problem-package.json',
  'decision.json',
  'workflow-outcome.json',
] as const;

const FEEDBACK_FILES = [
  'observable-payload.json',
  'participant-prompt.txt',
  'participant-binding.json',
  'participant-execution-trace.json',
  'raw-provider-response.txt',
  'raw-participant-response.txt',
  'stderr.txt',
  'invocation.json',
  'feedback.json',
] as const;

const HYPOTHESIS_FILES = [
  'source-observable-payload.json',
  'source-feedback.json',
  'source-feedback-raw-participant-response.txt',
  'source-pattern-evidence.json',
  'participant-prompt.txt',
  'participant-binding.json',
  'participant-execution-trace.json',
  'raw-provider-response.txt',
  'raw-participant-response.txt',
  'stderr.txt',
  'invocation.json',
  'hypotheses.json',
] as const;

const SOLUTION_FILES = [
  'participant-prompt.txt',
  'participant-binding.json',
  'invocation.json',
  'execution-trace.json',
  'raw-output.txt',
  'stderr.txt',
  'result.json',
  'failure.json',
] as const;

const REVIEWER_FILES = [
  'participant-prompt.txt',
  'participant-binding.json',
  'invocation.json',
  'execution-trace.json',
  'raw-output.txt',
  'stderr.txt',
  'review.json',
  'failure.json',
] as const;
```

Also enumerate the PD-117 continuation paths explicitly under `review-continuation-000001/`:

```ts
const CONTINUATION_ROOT_FILES = [
  'continuation.json',
  'revision-request.json',
  'decision.json',
] as const;
```

Then apply `SOLUTION_FILES` to `review-continuation-000001/solution-revision/` and `REVIEWER_FILES` to `review-continuation-000001/reviewer-agent/` only when those invocation roots exist.

For `authority-snapshots` and `skill-snapshots`, **do not recurse arbitrarily**. Read and validate their declared `manifest.json`, then copy only the files explicitly listed by that manifest and whose path is safe and contained below the corresponding snapshot root.

For configuration execution, enumerate exactly:

```ts
const CONFIG_EXECUTION_FILES = [
  'participant-prompt.txt',
  'participant-binding.json',
  'invocation.json',
  'execution-trace.json',
  'raw-output.txt',
  'stderr.txt',
  'result.json',
  'failure.json',
  'before-manifest.json',
  'after-manifest.json',
] as const;
```

Read `before-manifest.json` and `after-manifest.json`, then copy only the `entries[].path` bytes declared by those manifests from `before/<path>` and `after/<path>` respectively. Never walk the entire extension directory.

Keep sealed Phase0 collection as its existing explicit `PHASE0_REQUIRED_SEALED_ARTIFACTS` enumeration plus `experiment-root.json` and `experiment-root.sha256`.

- [ ] **Step 4: Run allowlist and forensic tests GREEN**

Run:

```bash
npm exec -- tsx tests/evolution/ordinaryEvidenceAllowlist.test.ts
npm exec -- tsx tests/evolution/durableEvidenceForensicE2E.test.ts
```

Expected: PASS; undeclared files are absent while all currently required forensic artifacts remain present.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/evidence/ordinaryEvidenceCollector.ts \
  tests/evolution/ordinaryEvidenceAllowlist.test.ts \
  tests/evolution/durableEvidenceForensicE2E.test.ts
git commit -m "fix(evolution): enforce durable evidence allowlist"
```

---

### Task 2: Make Evidence Instrumentation Semantically Non-Blocking

**Files:**
- Modify: `scripts/evolution/participantObservability.ts`
- Modify: `scripts/evolution/localEvidenceOnlyParticipant.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`
- Modify: `scripts/evolution/configurationExecutionParticipant.ts`
- Modify: `scripts/evolution/multiRoundExecutionValidation.ts`
- Modify: `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts`
- Modify: `scripts/evolution/operator/runOrdinaryEvolution.ts`
- Create: `tests/evolution/observabilitySemanticIsolation.test.ts`
- Modify: `tests/evolution/ordinaryEvolutionOperator.test.ts`

**Interfaces:**
- Produces: `persistParticipantPromptAndBinding()` becomes best-effort and returns a status rather than throwing for sidecar write failures.
- Produces: Capsule publication success remains `PASS` even if a later evidence-index rebuild fails.
- Invariant: any newly-added evidence-only filesystem write may make Capsule retention fail later, but cannot prevent an otherwise-valid Participant call or alter route/outcome.

- [ ] **Step 1: Write RED tests for prompt/binding write failure**

Use a deterministic filesystem collision: make `observabilityRoot` a regular file so `mkdir()` for sidecars fails. Invoke a local Participant whose executable is a tiny successful Node process and assert the Participant still runs and returns its semantic result.

Test both:

```ts
runLocalEvidenceOnlyParticipant(...)
runSolutionReviewer(...)
```

The test must fail on the current implementation because `persistParticipantPromptAndBinding()` throws before `runWorkspaceAgentJob()`.

- [ ] **Step 2: Change prompt/binding persistence to best-effort**

Change the public helper to:

```ts
export interface ParticipantObservabilityPersistResult {
  status: 'PASS' | 'FAILED';
  errors: string[];
}

export async function persistParticipantPromptAndBinding(input: {
  destinationRoot: string;
  prompt: string;
  participant: WorkspaceAgentParticipantOptions;
}): Promise<ParticipantObservabilityPersistResult> {
  const errors: string[] = [];
  for (const [path, content] of [
    ['participant-prompt.txt', input.prompt],
    ['participant-binding.json', `${canonicalJson(buildParticipantBindingReceipt(input.participant))}\n`],
  ] as const) {
    try {
      await writeCreateOnly(join(resolve(input.destinationRoot), path), content);
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { status: errors.length === 0 ? 'PASS' : 'FAILED', errors };
}
```

Callers may await it for ordering but must not branch semantic execution on `FAILED`.

- [ ] **Step 3: Write RED tests for Configuration evidence capture failure**

Extend `MultiRoundExecutionValidationDependencies` with injectable evidence-capture functions:

```ts
captureConfigurationBeforeEvidence?: typeof captureConfigurationBeforeEvidence;
captureConfigurationAfterEvidence?: typeof captureConfigurationAfterEvidence;
```

Test with both injected functions throwing. Assert:

```ts
executionParticipantCalls === 1
result.sessionExecution.execution.status // same semantic value as control
result.sessionExecution.stopReason        // same semantic value as control
```

If the control reaches rerun/Round 2, the failing-observability case must still reach the same semantic transition.

- [ ] **Step 4: Make Configuration evidence capture best-effort**

Wrap only the evidence side effect:

```ts
try {
  await captureBefore({ ... });
} catch {
  // Evidence closure may fail later; semantic execution continues.
}
```

Do the same for after-capture. Do **not** catch `snapshotWorkspace()`, scope verification, authoritative fingerprint checks, Participant execution, or deterministic verification: those are semantic/runtime operations, not evidence-only writes.

- [ ] **Step 5: Make authority/skill snapshot retention best-effort**

In `captureDeclaredProvenanceSnapshots()`, preserve source validation already performed by the workflow, but prevent copy/manifest-write failures under `authority-snapshots/**` and `skill-snapshots/**` from aborting Solution/Reviewer execution.

Implement it as a result-returning observability helper:

```ts
interface ProvenanceSnapshotResult {
  status: 'PASS' | 'FAILED';
  errors: string[];
}
```

Each snapshot file/manifest write records an error and continues. Do not weaken `assertRepoReferenceFile`, skill loading, workspace preparation, or Participant input validation.

- [ ] **Step 6: Separate Capsule publish from evidence-index rebuild**

Move `buildDurableEvidenceIndex()` out of the default `archiveCapsule` implementation in `runOrdinaryEvolution.ts`.

After Capsule publication:

```ts
durableEvidenceStatus = 'PASS';
durableEvidenceCapsulePath = ...;
```

Then attempt the evidence-index rebuild in its own `try/catch`. If it fails:

- leave `durableEvidenceStatus === 'PASS'`;
- add a distinct message such as `Durable Evidence Index: ...` to `observabilityError`;
- still attempt report archive, HFL inbox refresh, and operational index refresh.

Do not let report failure prevent HFL/index attempts either; each independent post-run observability side effect should have its own guarded attempt and aggregated errors.

- [ ] **Step 7: Run focused semantic-isolation tests GREEN**

Run:

```bash
npm exec -- tsx tests/evolution/observabilitySemanticIsolation.test.ts
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/configurationEvidence.test.ts
```

Expected: PASS. The same semantic execution occurs with evidence writes succeeding or failing; only observability/retention status differs.

- [ ] **Step 8: Commit**

```bash
git add scripts/evolution/participantObservability.ts \
  scripts/evolution/localEvidenceOnlyParticipant.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  scripts/evolution/configurationExecutionParticipant.ts \
  scripts/evolution/multiRoundExecutionValidation.ts \
  scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts \
  scripts/evolution/operator/runOrdinaryEvolution.ts \
  tests/evolution/observabilitySemanticIsolation.test.ts \
  tests/evolution/ordinaryEvolutionOperator.test.ts \
  tests/evolution/configurationEvidence.test.ts
git commit -m "fix(evolution): isolate evidence observability failures"
```

---

### Task 3: Add Bounded Manual Capsule Repair and Share the Retention Path

**Files:**
- Create: `scripts/evolution/evidence/retainOrdinaryEvidence.ts`
- Create: `scripts/evolution/evidence/repairOrdinaryEvidence.ts`
- Modify: `scripts/evolution/operator/runOrdinaryEvolution.ts`
- Modify: `package.json`
- Create: `tests/evolution/durableEvidenceRepair.test.ts`

**Interfaces:**
- Produces:

```ts
export interface RetainOrdinaryEvidenceInput {
  repositoryRoot: string;
  sessionRoot: string;
  experimentRoot: string;
  sessionId: string;
  sourceRunRef: string;
  sourceRunRefs: string[];
  repositoryIdentity: Record<string, unknown>;
  sessionExecution: MultiRoundSessionSummary;
  createdAt?: string;
}

export async function retainOrdinaryEvidenceCapsule(
  input: RetainOrdinaryEvidenceInput,
): Promise<DurableEvidenceCapsulePublishResult>;
```

- CLI:

```bash
npm run evolution:evidence:repair -- --root .tmp/evolution/<session-id>
```

- Invariant: repair reads an already-completed session; it never runs Phase0, invokes a Participant, starts a new ordinary session, or modifies historical execution artifacts.

- [ ] **Step 1: Write RED repair test**

Fixture requirements:

1. create a completed session tree;
2. create `operator-result.json` with the recorded branch/head/workingTreeClean and `experimentRoot`;
3. create a valid `experiment/run-manifest.json`;
4. confirm no Capsule exists;
5. run the repair entry point;
6. assert Capsule exists and verifies;
7. assert a fake Participant/gameplay dependency counter remains zero;
8. assert existing historical files have unchanged hashes.

- [ ] **Step 2: Extract current operator retention into `retainOrdinaryEvidence.ts`**

Move the current collector → event flags → `publishDurableEvidenceCapsule()` logic into `retainOrdinaryEvidenceCapsule()` without changing semantics.

The shared function must not rebuild indexes. Publishing the Capsule and rebuilding indexes are separate observability operations.

- [ ] **Step 3: Implement `repairOrdinaryEvidence.ts`**

Parse only:

```text
--root <existing completed session root>
--repository-root <optional; defaults cwd>
```

Then:

1. resolve `operator-result.json` under the supplied session root;
2. verify the operator session ID matches the directory/session;
3. resolve the recorded `experimentRoot` within the same repository;
4. read and parse `experiment/run-manifest.json` with existing multi-round manifest helpers;
5. derive the initial source run from `initialSourceRunRef` in the full run manifest, never from `resultingRunRef`;
6. derive all source run refs from the full run manifest and execution `resultingRunRef`;
7. build the current `MultiRoundSessionSummary` from that manifest;
8. call `retainOrdinaryEvidenceCapsule()`;
9. verify the published/reused Capsule;
10. attempt `buildDurableEvidenceIndex()` separately.

If Capsule repair succeeds and index rebuild fails, print the Capsule success and the index failure separately; do not delete or invalidate the Capsule.

- [ ] **Step 4: Add package script and fix operator guidance**

Add:

```json
"evolution:evidence:repair": "tsx scripts/evolution/evidence/repairOrdinaryEvidence.ts"
```

Change the operator summary guidance from the incorrect report-only command to include:

```text
npm run evolution:evidence:repair -- --root <原 session root>
```

Keep the existing report/HFL/index rebuild commands for their own artifacts.

- [ ] **Step 5: Run repair tests GREEN**

Run:

```bash
npm exec -- tsx tests/evolution/durableEvidenceRepair.test.ts
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
```

Expected: PASS; repair creates/verifies Capsule without invoking gameplay/Participants or mutating execution artifacts.

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/evidence/retainOrdinaryEvidence.ts \
  scripts/evolution/evidence/repairOrdinaryEvidence.ts \
  scripts/evolution/operator/runOrdinaryEvolution.ts \
  tests/evolution/durableEvidenceRepair.test.ts \
  package.json
git commit -m "feat(evolution): add bounded durable evidence repair"
```

---

### Task 4: Close the Uniform Participant Receipt Contract

**Files:**
- Create: `scripts/evolution/evidence/participantReceipt.ts`
- Modify: `scripts/evolution/evidence/durableEvidenceCapsule.ts`
- Modify: `scripts/evolution/evidence/ordinaryEvidenceCollector.ts`
- Modify: `scripts/evolution/localEvidenceOnlyParticipant.ts`
- Modify: `scripts/evolution/runMinimalExternalFeedback.ts`
- Modify: `scripts/evolution/runImprovementHypothesis.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`
- Modify: `scripts/evolution/configurationExecutionParticipant.ts`
- Create: `tests/evolution/participantReceipt.test.ts`
- Modify relevant Feedback/Hypothesis/Solution/Reviewer/configuration tests.

**Interfaces:**
- Add an input form to `DurableEvidenceCapsuleInput` whose refs use logical names only, then resolve hashes from the copied manifest objects during publication:

```ts
export interface DurableParticipantInvocationReceiptInput {
  invocationRef: string;
  role: 'feedback' | 'hypothesis' | 'solution' | 'reviewer' | 'configuration-execution';
  round: 1 | 2;
  continuationRef: string | null;
  promptLogicalName: string;
  bindingLogicalName: string;
  invocationLogicalName: string;
  rawOutputLogicalName: string | null;
  stderrLogicalName: string | null;
  executionTraceLogicalName: string;
  structuredResultLogicalName: string | null;
  failureLogicalName: string | null;
  visibleEvidenceLogicalNames: string[];
  skillLogicalNames: string[];
  authorityLogicalNames: string[];
}
```

- Add the resolved receipt form to `DurableEvidenceCapsuleManifest`:

```ts
export interface DurableEvidenceRefReceipt {
  logicalName: string;
  sha256: string;
}

export interface DurableParticipantInvocationReceipt {
  invocationRef: string;
  role: 'feedback' | 'hypothesis' | 'solution' | 'reviewer' | 'configuration-execution';
  round: 1 | 2;
  continuationRef: string | null;
  prompt: DurableEvidenceRefReceipt;
  binding: DurableEvidenceRefReceipt;
  invocation: DurableEvidenceRefReceipt;
  rawOutput: DurableEvidenceRefReceipt | null;
  stderr: DurableEvidenceRefReceipt | null;
  executionTrace: DurableEvidenceRefReceipt;
  structuredResult: DurableEvidenceRefReceipt | null;
  failure: DurableEvidenceRefReceipt | null;
  visibleEvidence: DurableEvidenceRefReceipt[];
  skills: DurableEvidenceRefReceipt[];
  authority: DurableEvidenceRefReceipt[];
}
```

- Manifest parser/verifier validates every receipt ref points to an actual declared object with the exact same SHA-256.
- Invariant: receipt is role-bound metadata; `PARTICIPANT_VISIBLE` remains only a historical classification and does not itself grant a file to every role.

- [ ] **Step 1: Write RED receipt tests**

Construct a Capsule fixture with Feedback, Hypothesis, Solution, Reviewer, and Configuration invocation artifacts. Assert every actual invocation has one receipt and that:

```ts
assert.equal(receipt.prompt.sha256, objectByName(receipt.prompt.logicalName).sha256);
assert.equal(receipt.executionTrace.sha256, objectByName(receipt.executionTrace.logicalName).sha256);
assert.equal(receipt.failure === null || receipt.structuredResult === null, true);
```

Tamper one receipt SHA and assert `verifyDurableEvidenceCapsule()` fails.

Add a PD-111 regression assertion: `internal/player-surface-source.json` may exist as `HUMAN_FORENSIC_ONLY` but must not appear in Feedback/Hypothesis `visibleEvidence` receipts.

- [ ] **Step 2: Preserve available stderr across roles**

Extend local evidence result:

```ts
export interface LocalEvidenceOnlyParticipantSuccess {
  ok: true;
  rawParticipantResponse: string;
  stderr: string;
}
```

Return `result.stderr` from `runLocalEvidenceOnlyParticipant()` and persist it best-effort as `stderr.txt` in Feedback and Hypothesis when non-empty or when the local runtime observed an empty stderr stream and a stable receipt requires the artifact.

For Reviewer and Configuration, after successful `runWorkspaceAgentJob()`, persist:

```ts
try {
  await writeCreateOnly(join(input.destinationRoot, 'stderr.txt'), job.stderr);
} catch {
  // forensic sidecar only; semantic result remains unchanged
}
```

Do not invent stderr for runtime failure objects that do not expose it.

- [ ] **Step 3: Include authority refs in Configuration invocation metadata**

Add the already-existing `input.authorityRefs` to `configuration-execution/invocation.json`:

```ts
const commonInvocation = {
  ...,
  authorityRefs: [...input.authorityRefs],
};
```

This is observability metadata only and must not change the prompt or allowed paths.

- [ ] **Step 4: Build receipts from declared historical artifacts during retention**

`participantReceipt.ts` should consume the already-collected `DurableEvidenceObjectInput[]` plus exact historical JSON artifacts and return `DurableParticipantInvocationReceiptInput[]`. It must not scan arbitrary directories and must refer only to logical names already present in the allowlisted evidence set.

Use known invocation roots:

```text
round-N/feedback-runs/<sourceRunRef>/
round-N/hypothesis-runs/<sourceRunRef>/
round-N/solution-agent/
round-N/reviewer-agent/
round-N/review-continuation-000001/solution-revision/
round-N/review-continuation-000001/reviewer-agent/
configuration-execution/
```

For each root that has an invocation artifact, require prompt/binding/trace plus either structured result or failure according to the invocation outcome. Build `visibleEvidence` only from the exact evidence declared by that role's historical contract:

- Feedback: its observable payload.
- Hypothesis: source observable payload + source feedback + optional declared pattern evidence.
- Solution/Reviewer: Problem Package source refs + bounded diagnostic refs; never raw `internal/player-surface-source.json`.
- Configuration: Problem Package, accepted Solution, accepted Review, and the already-declared authority refs; do not treat before/after Human forensic snapshots as Participant input.

Map Solution/Reviewer skill assignments to the exact `skill-snapshots/manifest.json` entries and authority refs to `authority-snapshots/manifest.json` entries. Missing required snapshot bytes make retention fail closed; they do not retroactively fail the historical Participant execution.

- [ ] **Step 5: Add receipts to the Capsule manifest and verify role bindings**

Add `participantReceipts` to `DurableEvidenceCapsuleInput`. In `manifestFromObjects()`, build a `Map<logicalName, DurableEvidenceObject>` after the evidence bytes have been copied/hashed, resolve each receipt input logical name to `{ logicalName, sha256 }`, and fail if any logical name is absent. Sort resolved receipts deterministically by round, continuationRef, role, invocationRef.

`retainOrdinaryEvidenceCapsule()` calls `collectOrdinaryEvidence()` first, then `buildParticipantInvocationReceiptInputs(...)`, then passes both `evidence` and `participantReceipts` to `publishDurableEvidenceCapsule()`.

Parser rules:

- array required;
- no duplicate `invocationRef`;
- all referenced logical names exist;
- referenced SHA equals object SHA;
- `structuredResult` and `failure` cannot both be non-null;
- every real invocation artifact in the allowlisted session must have exactly one receipt.

- [ ] **Step 6: Run participant receipt and role tests GREEN**

Run:

```bash
npm exec -- tsx tests/evolution/participantReceipt.test.ts
npm exec -- tsx tests/evolution/durableEvidenceForensicE2E.test.ts
```

Then run the existing focused Feedback/Hypothesis/Solution/Reviewer/configuration tests used by this repository.

Expected: PASS; all observable runtime evidence that exists is durable and role-bound without changing Participant authority.

- [ ] **Step 7: Commit**

```bash
git add scripts/evolution/evidence/participantReceipt.ts \
  scripts/evolution/evidence/durableEvidenceCapsule.ts \
  scripts/evolution/evidence/ordinaryEvidenceCollector.ts \
  scripts/evolution/localEvidenceOnlyParticipant.ts \
  scripts/evolution/runMinimalExternalFeedback.ts \
  scripts/evolution/runImprovementHypothesis.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  scripts/evolution/configurationExecutionParticipant.ts \
  tests/evolution/participantReceipt.test.ts \
  tests/evolution/durableEvidenceForensicE2E.test.ts
git commit -m "fix(evolution): close participant evidence receipts"
```

---

### Task 5: Make Capsule Manifest Parsing Fully Fail-Closed

**Files:**
- Modify: `scripts/evolution/evidence/durableEvidenceCapsule.ts`
- Modify: `tests/evolution/durableEvidenceCapsule.test.ts`
- Modify: `tests/evolution/durableEvidencePackaging.test.ts`
- Modify: `tests/evolution/packageProjectCapsule.test.ts`

**Interfaces:**
- `DurableEvidenceObjectInput.sourceRef` becomes required.
- `DurableEvidenceObject.sourceRef` becomes required.
- `repositoryIdentity` and `workflowIdentity` are required non-array objects and may not silently default to `{}`.
- Existing schema version remains `durable-evidence-capsule-v1`; this patch enforces the already-approved v1 contract rather than defining a new format.

- [ ] **Step 1: Write RED malformed-manifest tests**

Add cases that remove each field from a valid persisted manifest:

```ts
delete manifest.objects[0].sourceRef;
delete manifest.repositoryIdentity;
delete manifest.workflowIdentity;
```

Also test `repositoryIdentity = null`, `workflowIdentity = []`, and a receipt that references a missing logical object.

Each must fail `verifyDurableEvidenceCapsule()`.

- [ ] **Step 2: Require `sourceRef` at TypeScript and runtime boundaries**

Change:

```ts
sourceRef?: string;
```

to:

```ts
sourceRef: string;
```

in both input and manifest object types. Update `validateObjectInput()` and `parseManifest()` to require a safe, non-empty source ref for every object.

Update all current test fixtures to provide explicit source refs, for example:

```ts
sourceRef: `fixture/payload-${index}.txt`
```

- [ ] **Step 3: Require repository/workflow identity objects**

Add:

```ts
function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}
```

Use it in `parseManifest()` and return the validated values directly. Remove:

```ts
(manifest.repositoryIdentity ?? {})
(manifest.workflowIdentity ?? {})
```

- [ ] **Step 4: Run Capsule/package fixtures GREEN**

Run:

```bash
npm exec -- tsx tests/evolution/durableEvidenceCapsule.test.ts
npm exec -- tsx tests/evolution/durableEvidencePackaging.test.ts
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
```

Expected: PASS with no fixture relying on omitted `sourceRef` or defaulted identity objects.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/evidence/durableEvidenceCapsule.ts \
  tests/evolution/durableEvidenceCapsule.test.ts \
  tests/evolution/durableEvidencePackaging.test.ts \
  tests/evolution/packageProjectCapsule.test.ts
git commit -m "fix(evolution): fail closed on capsule manifest provenance"
```

---

### Task 6: Verify Package Selection Metadata Against Extracted Capsules

**Files:**
- Modify: `scripts/evolution/evidence/verifyPackagedEvidence.ts`
- Modify: `tests/evolution/packageProjectCapsule.test.ts`
- Modify: `tests/evolution/durableEvidencePackaging.test.ts`
- Modify: `package-project.sh` only if argument/path plumbing is required.

**Interfaces:**
- `verifyPackagedEvidence.ts --repository-root <extracted-root>` validates both:
  1. every actual extracted Capsule;
  2. the declared `evidence-package.json` inclusion set/count/bytes against those actual Capsules.

- [ ] **Step 1: Write RED missing-selected-Capsule verifier test**

Create package metadata declaring two session IDs, extract/copy only one valid Capsule, then invoke the verifier.

Expected failure message should identify the missing declared session ID.

Also add a test with one extra extracted Capsule not present in `includedSessionIds`; verifier must fail rather than silently accept the mismatch.

- [ ] **Step 2: Strengthen verifier**

Read:

```text
artifacts/evolution/run-evidence/evidence-package.json
```

Validate its schema and construct:

```ts
const expectedIds = new Set(metadata.includedSessionIds.map(item => item.sessionId));
const actualIds = new Set(capsules.map(item => item.manifest.sessionId));
```

Require exact set equality and:

```ts
metadata.includedCapsuleCount === actualIds.size
metadata.includedEvidenceBytes === sum(actual capsuleBytes)
metadata.locallyKnownCapsuleCount >= metadata.includedCapsuleCount
```

Also require each inclusion reason to be exactly `recent` or `explicit` and session IDs unique.

When zero Capsules are selected, zero is valid only when metadata declares zero.

- [ ] **Step 3: Keep whole-Capsule post-extraction hash verification**

Continue calling `loadValidDurableEvidenceCapsules()` so every manifest-declared file/hash is checked after extraction. Do not replace integrity verification with metadata-only checks.

- [ ] **Step 4: Run package tests GREEN**

Run:

```bash
npm exec -- tsx tests/evolution/durableEvidencePackaging.test.ts
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
```

Expected: PASS for latest-5 + explicit-old cases and FAIL for deliberately missing/extra selected Capsules.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/evidence/verifyPackagedEvidence.ts \
  tests/evolution/durableEvidencePackaging.test.ts \
  tests/evolution/packageProjectCapsule.test.ts \
  package-project.sh
git commit -m "fix(evolution): verify packaged capsule selection closure"
```

---

### Task 7: Prove Baseline Failure Attribution with an Isolated A/B Worktree

**Files:**
- No product-code changes unless A/B proves a regression caused by this feature.
- Record commands/results in the final implementation report; do not create a new governance decision for unrelated baseline failures.

**Interfaces:**
- A = clean `657155f09ca7272b758c7f562b1b0230c9f91ff0` isolated worktree.
- B = current Durable Evidence closure-patched dirty/feature worktree.
- Same Node/npm version and same exact commands for A and B.

- [ ] **Step 1: Create clean baseline worktree without touching current dirty work**

Run from the current repository:

```bash
git worktree add ../wuxia-life-baseline-657155 657155f09ca7272b758c7f562b1b0230c9f91ff0
```

Do not switch/reset the implementation worktree.

- [ ] **Step 2: Run the five reported failing tests in A**

```bash
npm exec -- tsx tests/stageAtomicProgression.test.ts
npm exec -- tsx tests/canonicalUndefinedPropertyElimination.test.ts
npm exec -- tsx tests/evolution/p2-success-path.test.ts
npm exec -- tsx tests/evolution/p2-closure-guards.test.ts
npm exec -- tsx tests/evolution/p2-participant-accounting.test.ts
```

Record exact exit code and failure message for each.

- [ ] **Step 3: Run the identical commands in B**

Run the same five commands in the implementation worktree with the same runtime versions.

- [ ] **Step 4: Classify only evidence-supported baseline failures**

Classification rule:

```text
A and B fail with materially identical failure
→ confirmed pre-existing baseline failure

A passes, B fails
→ Durable Evidence regression; stop completion and root-cause/fix it

A and B fail differently
→ not proven baseline-equivalent; investigate before acceptance
```

Do not modify unrelated gameplay tests/code merely to change the classification.

- [ ] **Step 5: Remove only the temporary baseline worktree after recording evidence**

```bash
git worktree remove ../wuxia-life-baseline-657155
```

No commit is required for this task unless an actual regression is found and fixed via a new RED→GREEN cycle.

---

### Task 8: Final Closure Verification and Documentation Sync

**Files:**
- Modify only if required: `docs/artifact-output-convention.md`
- Modify only if current text is inaccurate: `docs/superpowers/specs/2026-09-13-auto-evolution-durable-evidence-capsule-v1-design.md`

**Interfaces:**
- Completion claim is allowed only after the full evidence matrix below is recorded.

- [ ] **Step 1: Run all new/changed Durable Evidence tests**

```bash
npm exec -- tsx tests/evolution/ordinaryEvidenceAllowlist.test.ts
npm exec -- tsx tests/evolution/observabilitySemanticIsolation.test.ts
npm exec -- tsx tests/evolution/durableEvidenceRepair.test.ts
npm exec -- tsx tests/evolution/participantReceipt.test.ts
npm exec -- tsx tests/evolution/durableEvidenceCapsule.test.ts
npm exec -- tsx tests/evolution/configurationEvidence.test.ts
npm exec -- tsx tests/evolution/durableEvidenceForensicE2E.test.ts
npm exec -- tsx tests/evolution/durableEvidencePackaging.test.ts
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
```

All must PASS.

- [ ] **Step 2: Run focused AE regressions**

Run the focused role/workflow tests explicitly:

```bash
npm exec -- tsx tests/evolution/minimalExternalFeedbackLoop.test.ts
npm exec -- tsx tests/evolution/improvementHypothesisLoop.test.ts
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec -- tsx tests/evolution/multiRoundExecutionValidation.test.ts
npm exec -- tsx tests/evolution/multiRoundRunManifestContract.test.ts
npm exec -- tsx tests/evolution/participantFailureRouting.test.ts
npm exec -- tsx tests/evolution/p2-scope.test.ts
npm exec -- tsx tests/evolution/p2-real-rerun.test.ts
npm exec -- tsx tests/evolution/p2-verification-failure.test.ts
npm run test:evolution:human-followup
npm run test:evolution:solution-replay
npm run test:evolution:review-continuation
```

For PD-111 authority/workspace isolation, also run the repository tests that exercise actual Agent workspace separation and bounded source visibility. If their exact file names have changed in the current working tree, discover them by searching for `PD-111`, `workspace isolation`, `player-surface-source`, and `observable-payload` before running; record the exact discovered commands in the completion report.

- [ ] **Step 3: Run static/build gates**

```bash
npm run typecheck
npm run build
git diff --check
```

Expected: PASS; existing Vite chunk-size warning is not a failure.

- [ ] **Step 4: Re-run the temp-deletion forensic proof**

The E2E evidence must demonstrate all of the following after deleting the source `.tmp/evolution/<session>`:

```text
Capsule verifies
Feedback receipt verifies
Hypothesis receipt verifies
Selection / causal attribution / Problem Package / Decision remain auditable
Configuration before=A and after=B when config execution occurs
modified cross-round sealed Phase0 source validates
no complete Agent workspace is retained
```

- [ ] **Step 5: Run actual package command**

```bash
bash package-project.sh
```

If the local repository has no valid Capsule, `Verified packaged Durable Evidence Capsules: 0` is acceptable only if `evidence-package.json` also declares zero. The synthetic package tests remain the proof of latest-5 + explicit-old behavior.

- [ ] **Step 6: Run full repository gate and report, do not conceal, failures**

```bash
npm test
```

If it still fails, use the Task 7 A/B evidence to label each failure as confirmed baseline or regression. Do not claim “all repository tests pass” unless they actually do.

- [ ] **Step 7: Review documentation accuracy**

Ensure `docs/artifact-output-convention.md` accurately states:

```text
.tmp/evolution/** = ephemeral execution evidence
run-evidence/** = bounded durable forensic evidence
run-reports/** = semantic projection
manual repair = retain/verify completed existing session only
```

No doc may imply exact filesystem replay, workspace retention, widened PD-111 authority, or HFL trigger changes.

- [ ] **Step 8: Final repository evidence**

Record:

```bash
git status --short
git diff --stat
git log --oneline -8
```

The final report must state:

- exact modified files;
- every focused verification command and result;
- RED→GREEN evidence for each closure gap;
- A/B result for each previously reported baseline failure;
- temp-deletion forensic result;
- manual repair result;
- package selection/integrity result;
- explicit confirmation that PD-111, PD-117, HFL trigger, Participant roster/binding semantics, exact replay scope, and gameplay semantics did not change.

- [ ] **Step 9: Commit documentation-only corrections if any**

If documentation required changes:

```bash
git add docs/artifact-output-convention.md docs/superpowers/specs/2026-09-13-auto-evolution-durable-evidence-capsule-v1-design.md
git commit -m "docs(evolution): close durable evidence operational contract"
```

If no documentation correction is needed, do not create an empty/no-op commit.

---

## Acceptance Criteria

The closure patch is accepted only when all of the following are true:

1. Ordinary evidence retention is explicit allowlist-driven; arbitrary new files below otherwise-valid session directories are not retained.
2. Prompt/binding, provenance-snapshot, configuration-evidence, Capsule-index, and other evidence-only write failures cannot suppress a Participant invocation or alter AE route/outcome semantics.
3. Capsule publication success remains success even if a later index rebuild fails.
4. A documented CLI can repair/retain a Capsule from an already-completed existing `.tmp` session without gameplay, Participants, or historical execution mutation.
5. Every real applicable Participant invocation has one role-bound durable receipt linking prompt/binding/invocation/raw output/available stderr/trace/result-or-failure plus exact visible evidence, skill, and authority refs/hashes.
6. PD-111 Human-only evidence never appears in an unauthorized role's `visibleEvidence` receipt.
7. Every retained object has a required `sourceRef`; missing repository/workflow identity fails Capsule verification.
8. Manifest/receipt parsing is fail-closed and verifies refs against actual object hashes.
9. Package verification proves the declared inclusion set equals the actual extracted Capsule set and re-verifies all Capsule hashes.
10. Latest-5 + explicit-old and nested `inputs/**` whole-Capsule packaging still pass.
11. Temp-deletion forensic closure, configuration temporal evidence, and cross-round sealed-source validation all pass.
12. Previously reported full-gate/P2 failures are classified only from clean-baseline vs implementation A/B evidence.
13. No full Agent workspace or whole `.tmp` tree is retained; exact filesystem replay remains out of scope.
14. PD-111, PD-117, HFL trigger, Participant roster/binding semantics, and gameplay semantics remain unchanged.

## Final Human Review Gate

Do not mark Durable Evidence Capsule v1 as `CLOSED` merely because the implementer says the closure patch is done. Return the implementation evidence and dirty/committed diff for independent completion verification against this plan and the Human-accepted design spec.
