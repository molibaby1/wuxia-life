# Auto Evolution Bounded More-Work Continuation v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use TDD for every behavior change: write the failing test, run it and confirm the expected failure, then write the minimum production code. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement one session-bounded Reviewer-driven continuation so the first eligible `REQUEST_MORE_WORK` can become one fresh Solution revision plus, when needed, one fresh re-review, without weakening authority, evidence, HFL, execution, or loop-safety boundaries.

**Architecture:** Preserve the existing four-job Problem-Agnostic Solution Loop as the immutable base workflow. Add a separate Host-layer `review-continuation-000001` workflow after a base decision of `DEFER_MORE_WORK_REQUESTED`; it reuses `SolutionWorkV1`, `SolutionReviewV1`, and `SolutionDecisionV1`, records create-only continuation provenance, and returns an effective route to the multi-round Host. Evolve the multi-round manifest/session summary and Operational Report with new schema versions instead of reinterpreting historical V1/V4 artifacts.

**Tech Stack:** TypeScript, Node.js filesystem APIs, existing structured Participant runtime, Codex `CODEX_CURRENT` participant binding, create-only JSON artifacts, `tsx` tests.

**Spec:** `docs/superpowers/specs/2026-09-12-auto-evolution-bounded-more-work-continuation-v1-design.md`

## Global Constraints

- Human accepted the design on 2026-09-12. Implementation authorization inherits from that accepted design only while this plan does not change its product semantics or scope.
- Before code changes, record the authority change as **PD-117: Bounded More-Work Continuation v1**. Do not silently rewrite PD-100 or PD-111.
- Existing base round remains: `Feedback → Hypothesis → Solution → Reviewer → base Decision`, max 4 Participant jobs.
- Trigger only the **first** completed Reviewer `REQUEST_MORE_WORK` in the entire multi-round session.
- `maxReviewContinuations = 1`; `maxReviewContinuationParticipantJobs = 2`; `maxTotalParticipantJobs = 11`; semantic retry count remains `0`.
- Revision Solution is a fresh Participant invocation. Re-review is a fresh Reviewer invocation only if the revision returns `OPTIONS`.
- Existing Solution envelope retransmission remains transport/contract recovery only; it must not be used as semantic revision state.
- A second valid `REQUEST_MORE_WORK` after re-review routes to `DEFER_MORE_WORK_REQUESTED` and stops. No second continuation.
- `DEFER` means required evidence is genuinely unavailable in the current execution context. `ESCALATE` means Human product/governance/authority judgment is required. `REJECT` remains a terminal proposal judgment.
- No new gameplay run/sample is created merely to satisfy continuation. Existing gameplay rerun occurs only after an effective `READY_FOR_CONFIG_EXECUTION`, exactly as today.
- HFL trigger scope remains PD-100: only an **effective formal `ESCALATE_HUMAN`** creates an automatic retained Human Follow-up item.
- PD-111 evidence boundary remains unchanged; do not expose raw Phase0 internal source.
- Full P3 remains deferred. Do not introduce new Participant roles, generic work queues, continuation databases, Reviewer subtypes, provider/model switching, or Selection changes.
- Production Ordinary AE participant binding remains `CODEX_CURRENT`; do not add DeepSeek or a model override.
- Historical manifest/report/HFL schemas remain readable and immutable.
- Do not create commits during this implementation; leave the complete diff for Human final review unless Human explicitly changes that instruction.
- Task A (retiring the temporary DeepSeek Selection experiment execution line) must be completed and verified before this plan begins. Do not mix Task A cleanup with continuation implementation.
- `NEXT_REVIEW_INPUT: REPOSITORY_REQUIRED` after implementation because this changes runtime orchestration, schemas, report projection, and HFL retention.

## Product Direction Drift Guard

- **Real problem:** Historical ordinary runs repeatedly reached `REQUEST_MORE_WORK`, but the Host converted that into an immediate stop even when the Reviewer named bounded current-context work.
- **Authority:** `docs/product/auto-evolution-model.md`, PD-100, PD-111, and the accepted design above.
- **Product improvement:** AE can consume one concrete bounded Reviewer follow-up instead of discarding a still-actionable product-improvement path.
- **Why framework work is justified:** This is not Participant quality tuning; the current Host lacks a workflow transition required to consume an already-valid Reviewer outcome.
- **Human-participant thought experiment:** If Solution and Reviewer were humans, “Reviewer requests one bounded revision, investigator revises once, fresh reviewer checks again” is still a coherent workflow.

---

### Task 1: Record PD-117 and install the accepted design as authority input

**Files:**
- Create: `docs/superpowers/specs/2026-09-12-auto-evolution-bounded-more-work-continuation-v1-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/product/auto-evolution-model.md`
- Modify: `docs/governance/ai-collaboration-workflow.md`
- Do **not** update `docs/governance/current-product-stage.md` yet; that file should only claim engineering delivery after deterministic verification succeeds.

**Interfaces:**
- Produces the authority that Tasks 2–9 implement.
- No runtime interface changes in this task.

- [ ] **Step 1: Install the accepted design document**

Copy the Human-approved design into the canonical spec path above. Change only its status line from:

```text
DRAFT — direction approved by Human; written design awaiting final Human acceptance.
```

to:

```text
HUMAN ACCEPTED — 2026-09-12. Implementation must conform to PD-117 and this design.
```

Do not rewrite the accepted body.

- [ ] **Step 2: Append PD-117 exactly around these invariants**

Add `### PD-117：Bounded More-Work Continuation v1` after PD-116 with these implementation-authority statements:

```text
Human accepted: 2026-09-12.

- The first completed Reviewer REQUEST_MORE_WORK in one multi-round session may trigger at most one Host-owned bounded continuation.
- The continuation contains one fresh Solution revision and, only when the revised Solution returns OPTIONS, one fresh independent Reviewer re-review.
- REQUEST_MORE_WORK is reserved for concrete, decision-relevant work achievable in the current execution context. Genuinely unavailable evidence routes DEFER; Human product/governance/authority judgment routes ESCALATE; an unacceptable proposal may route REJECT.
- A second REQUEST_MORE_WORK is terminal DEFER_MORE_WORK_REQUESTED; no second continuation is allowed.
- The base round Decision remains immutable evidence. Continuation creates its own Decision; the Host uses the continuation Decision as the effective route.
- Session-wide limits are one review continuation, at most two continuation Participant jobs, and at most eleven total Participant jobs. Ordinary semantic retry remains zero; existing envelope retransmission remains separate transport recovery.
- No new gameplay sample/run is created merely to satisfy continuation. Existing configuration execution and post-execution rerun semantics remain gated by an effective READY_FOR_CONFIG_EXECUTION.
- PD-100 HFL trigger scope is unchanged: only an effective formal ESCALATE_HUMAN automatically creates retained Human Follow-up state.
- PD-111 evidence scope is unchanged; raw internal Phase0 source remains unavailable to Solution/Reviewer.
- Full P3 remains deferred. This decision does not authorize a generic work queue, new reasoning Role, new Reviewer subtype schema, autonomous program/code writes, model switching, or Selection tuning.
```

Add re-discussion conditions for increasing the continuation count/budget, changing HFL/PD-111 scope, adding new evidence acquisition, or generalizing into a queue.

- [ ] **Step 3: Align first-layer AE model and collaboration workflow**

In `auto-evolution-model.md`, add the bounded continuation as an Orchestrator workflow rule, not Participant intelligence. In `ai-collaboration-workflow.md`, state that `REQUEST_MORE_WORK` can cause exactly one bounded Host continuation under PD-117, while `DEFER` and `ESCALATE` retain their existing meanings.

Do not change player-model semantics or game-domain rules.

- [ ] **Step 4: Verify authority consistency**

Run:

```bash
rg -n "PD-117|Bounded More-Work Continuation|REQUEST_MORE_WORK|DEFER_MORE_WORK_REQUESTED" \
  docs/governance/product-decisions.md \
  docs/product/auto-evolution-model.md \
  docs/governance/ai-collaboration-workflow.md \
  docs/superpowers/specs/2026-09-12-auto-evolution-bounded-more-work-continuation-v1-design.md
```

Expected: PD-117 and the accepted spec agree on one continuation, two continuation Participant jobs, eleven total jobs, unchanged PD-100/PD-111 scope, and second `REQUEST_MORE_WORK` stop semantics.

---

### Task 2: Add continuation contracts and versioned multi-round manifest/session summary

**Files:**
- Create: `src/evolution/reviewContinuationContract.ts`
- Create: `tests/evolution/reviewContinuationContract.test.ts`
- Modify: `scripts/evolution/multiRoundRunManifestContract.ts`
- Create: `tests/evolution/multiRoundRunManifestContract.test.ts`

**Interfaces:**
- Produces:

```ts
export interface ReviewContinuationRevisionRequestV1 {
  schemaVersion: 'review-continuation-revision-request-v1';
  continuationId: 'review-continuation-000001';
  continuationOrdinal: 1;
  round: 1 | 2;
  sourceRunRef: string;
  problemPackageRef: 'problem-package.json';
  problemPackageSha256: string;
  originalSolutionRef: 'solution-agent/result.json';
  originalSolutionSha256: string;
  originalReviewRef: 'reviewer-agent/review.json';
  originalReviewSha256: string;
  baseDecisionRef: 'decision.json';
  baseDecisionSha256: string;
  workspaceBaselineFingerprintSha256: string;
}

export interface ReviewContinuationV1 {
  schemaVersion: 'review-continuation-v1';
  continuationId: 'review-continuation-000001';
  continuationOrdinal: 1;
  round: 1 | 2;
  parentWorkflowRef: 'round-1' | 'round-2';
  sourceRunRef: string;
  startedAt: string;
  completedAt: string;
  baseDecisionRef: 'decision.json';
  baseDecisionSha256: string;
  revisionRequestRef: 'review-continuation-000001/revision-request.json';
  revisionRequestSha256: string;
  revisionStatus: 'OPTIONS' | 'NO_PROPOSAL' | 'INSUFFICIENT_EVIDENCE' | 'ESCALATE' | 'participant_failure';
  reReviewStatus: 'not_run' | 'ACCEPT_OPTION' | 'ACCEPT_NO_ACTION' | 'REJECT' | 'REQUEST_MORE_WORK' | 'DEFER' | 'ESCALATE' | 'participant_failure';
  continuationDecisionRef: 'review-continuation-000001/decision.json' | null;
  continuationDecisionSha256: string | null;
  participantJobCount: 1 | 2;
  terminalStatus: 'completed' | 'participant_failure';
  terminalRoute: SolutionRoute | 'PARTICIPANT_FAILURE';
}
```

- Produces `MultiRoundRunManifestV2` and `MultiRoundSessionSummaryV2` while preserving V1 parsers.

- [ ] **Step 1: Write failing continuation-contract tests**

Cover exact-key validation, SHA-256 validation, canonical continuation ID/ordinal, `participantJobCount` bounds, and these cross-field rules:

```ts
// completed continuation requires decision ref/hash and a normal SolutionRoute
// participant_failure requires null decision ref/hash and terminalRoute PARTICIPANT_FAILURE
// reReviewStatus === 'not_run' is valid only when revisionStatus !== 'OPTIONS' or revision failed
// reReviewStatus !== 'not_run' implies participantJobCount === 2
```

Run:

```bash
npx tsx tests/evolution/reviewContinuationContract.test.ts
```

Expected RED: module/functions do not exist.

- [ ] **Step 2: Implement `reviewContinuationContract.ts` minimally**

Export validators/parsers:

```ts
validateReviewContinuationRevisionRequest(value: unknown): ReviewContinuationRevisionRequestV1
parseReviewContinuationRevisionRequest(raw: string): ReviewContinuationRevisionRequestV1
validateReviewContinuation(value: unknown): ReviewContinuationV1
parseReviewContinuation(raw: string): ReviewContinuationV1
```

Use fail-closed exact-key validation consistent with existing evolution contracts.

- [ ] **Step 3: Verify continuation contract GREEN**

```bash
npx tsx tests/evolution/reviewContinuationContract.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write failing manifest-v2 compatibility tests**

Define V2 types with this shape:

```ts
export interface RoundManifestEntryV2 {
  round: 1 | 2;
  workflowRef: string;
  sourceRunRef: string;
  baseTerminalRoute: string | null;
  baseReasonCode: string | null;
  continuationRef: string | null;
  effectiveTerminalRoute: string | null;
  effectiveReasonCode: string | null;
  executionRef: string | null;
  resultingRunRef: string | null;
  nextAction: 'CONFIGURATION_EXECUTION' | 'ROUND_2' | 'STOP';
}

export interface ReviewContinuationManifestEntryV2 {
  round: 1 | 2;
  continuationRef: string;
  participantJobs: 1 | 2;
  terminalStatus: 'completed' | 'participant_failure';
  terminalRoute: string;
  decisionRef: string | null;
}
```

`MultiRoundRunManifestV2` must include:

```ts
limits: {
  maxAgentRounds: 2;
  maxCrossRoundTransitions: 1;
  maxRoundParticipantJobs: 4;
  maxReviewContinuations: 1;
  maxReviewContinuationParticipantJobs: 2;
  maxExecutionParticipantJobs: 1;
  maxTotalParticipantJobs: 11;
  retryCount: 0;
};
reviewContinuations: ReviewContinuationManifestEntryV2[];
budget: {
  round1ParticipantJobs: number;
  reviewContinuationParticipantJobs: number;
  executionParticipantJobs: number;
  round2ParticipantJobs: number;
  totalParticipantJobs: number;
  retryCount: 0;
};
```

`MultiRoundSessionSummaryV2` must preserve common session fields and add:

```ts
schemaVersion: 'multi-round-session-summary-v2';
rounds: Array<{
  round: 1 | 2;
  baseTerminalRoute: string | null;
  baseReasonCode: string | null;
  continuationRef: string | null;
  effectiveTerminalRoute: string | null;
  effectiveReasonCode: string | null;
}>;
reviewContinuationCount: 0 | 1;
reviewContinuationParticipantJobs: number;
lastRoundTerminalRoute: string | null; // effective route convenience field
```

Tests must prove:

1. historical V1 manifest parses unchanged;
2. V2 parses with 0 or 1 continuation;
3. V2 rejects >1 continuation, >2 continuation jobs, or >11 total jobs;
4. V2 rejects a round continuation ref that is missing from `reviewContinuations`;
5. `buildMultiRoundSessionSummary` returns V1 for V1 manifest and V2 for V2 manifest.

Run:

```bash
npx tsx tests/evolution/multiRoundRunManifestContract.test.ts
```

Expected RED before implementation.

- [ ] **Step 5: Implement V2 without mutating V1 semantics**

Keep existing constants/types for V1. Add:

```ts
MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2
MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2
MultiRoundRunManifestV2
MultiRoundSessionSummaryV2
MultiRoundRunManifest = MultiRoundRunManifestV1 | MultiRoundRunManifestV2
MultiRoundSessionSummary = MultiRoundSessionSummaryV1 | MultiRoundSessionSummaryV2
```

`readMultiRoundRunManifest()` returns the union and dispatches by `schemaVersion`.

- [ ] **Step 6: Verify manifest compatibility GREEN**

```bash
npx tsx tests/evolution/multiRoundRunManifestContract.test.ts
npx tsx tests/evolution/workflowDecisionAudit.test.ts
```

Expected: PASS; historical V1 fixtures remain accepted.

---

### Task 3: Add fresh Solution revision and fresh Reviewer re-review execution

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`
- Modify: `tests/evolution/solutionAgentLoop.test.ts`
- Modify: `tests/evolution/solutionReviewerLoop.test.ts`

**Interfaces:**
- Add:

```ts
export interface RunSolutionRevisionInput extends RunSolutionAgentInput {
  originalSolutionWork: SolutionWorkV1;
  originalReview: SolutionReviewV1;
}

export function buildSolutionRevisionPrompt(
  problemPackage: ProblemPackage,
  originalSolutionWork: SolutionWorkV1,
  originalReview: SolutionReviewV1,
  assignedSkills: DeliveredParticipantSkill[],
): string;

export async function runSolutionRevisionAgent(
  input: RunSolutionRevisionInput,
): Promise<SolutionAgentRunResult>;
```

- Add:

```ts
export interface RunSolutionReReviewerInput extends RunSolutionReviewerInput {
  originalSolutionWork: SolutionWorkV1;
  originalReview: SolutionReviewV1;
}

export function buildSolutionReReviewerPrompt(
  problemPackage: ProblemPackage,
  originalSolutionWork: SolutionWorkV1,
  originalReview: SolutionReviewV1,
  revisedSolutionWork: SolutionWorkV1,
  assignedSkills: DeliveredParticipantSkill[],
): string;

export async function runSolutionReReviewer(
  input: RunSolutionReReviewerInput,
): Promise<SolutionReviewerRunResult>;
```

- Base `runSolutionAgent()` and `runSolutionReviewer()` output contracts/artifact schemas remain unchanged.

- [ ] **Step 1: Write failing Reviewer-semantics prompt tests**

Extend `solutionReviewerLoop.test.ts` to require the base Reviewer prompt to state:

```text
REQUEST_MORE_WORK: concrete, decision-relevant, bounded work achievable in the current execution context.
DEFER: material evidence cannot be obtained in the current execution context and requires genuinely new evidence.
ESCALATE: Human product/governance/authority judgment is required.
REJECT: the proposal is unacceptable and bounded revision of that proposal is not the appropriate next action.
```

Also assert the prompt does **not** tell Reviewer to maximize continuation or acceptance.

Run the test and confirm RED because those semantics are not yet explicit.

- [ ] **Step 2: Add the minimum Reviewer prompt semantics**

Add one compact “Decision semantics” section to `buildSolutionReviewerPrompt`; do not rewrite unrelated Reviewer instructions.

- [ ] **Step 3: Write failing revision/re-review runner tests**

In the Solution test, assert the revision prompt:

- includes canonical JSON of original Solution and original Review;
- says Reviewer concerns are feedback to investigate, not ground truth;
- requires bounded work only;
- says unavailable evidence → `INSUFFICIENT_EVIDENCE` and Human authority → `ESCALATE`;
- does not request a new gameplay sample;
- uses a new invocation ref/destination and does not receive an existing thread ref from the base Solution.

In the Reviewer test, assert re-review receives original Solution, original Review, and revised Solution and remains independent.

Run both tests and confirm RED.

- [ ] **Step 4: Refactor only enough to share the existing validated execution path**

Inside each existing runner file, extract the current “load skills → build prompt → `runStructuredParticipantExecution` → validate references → write artifacts” body into a private helper that accepts a prebuilt prompt. Keep the base prompt/result behavior byte-for-byte equivalent apart from the explicit Reviewer decision-semantics addition.

Do not add a new output schema.

- [ ] **Step 5: Implement revision/re-review prompt builders and runners**

Use the same `SolutionWorkV1` / `SolutionReviewV1` validators and reference checks as base execution. Use distinct invocation refs supplied by the caller; semantic revision must start through the participant's normal `buildArgs`, not the base invocation's thread ref. Existing envelope retransmission may still occur only if structured-output recovery is triggered inside that new invocation.

- [ ] **Step 6: Verify runner GREEN and base regression safety**

```bash
npx tsx tests/evolution/solutionAgentLoop.test.ts
npx tsx tests/evolution/solutionReviewerLoop.test.ts
npx tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
```

Expected: PASS.

---

### Task 4: Extend HFL retention for an effective continuation escalation without changing PD-100

**Files:**
- Modify: `scripts/evolution/humanFollowup/retainHumanFollowupWorkItem.ts`
- Modify: `tests/evolution/humanFollowupRetention.test.ts`
- Modify: `tests/evolution/humanFollowupSolutionLoopIntegration.test.ts`

**Interfaces:**
- Preserve the current call shape for base escalations.
- Add an optional continuation evidence descriptor:

```ts
export interface HumanFollowupContinuationEvidence {
  effectiveDecisionPath: string;
  continuationRelativePaths: string[];
}

export interface RetainHumanFollowupWorkItemInput {
  // existing fields unchanged
  continuation?: HumanFollowupContinuationEvidence;
}
```

- When `continuation` is absent, existing evidence paths and deterministic identity remain unchanged.
- When present, `workflowRoot` remains the base round root. `decisionSha256` is calculated from the effective continuation decision. Evidence contains the base decision plus the supplied nested continuation evidence.

- [ ] **Step 1: Write failing continuation-HFL retention tests**

Create a base round fixture with:

```text
problem-package.json
selection/selected-hypothesis.json
solution-agent/result.json
reviewer-agent/review.json
decision.json                         # base REQUEST_MORE_WORK decision
review-continuation-000001/
  continuation.json
  revision-request.json
  solution-revision/result.json
  reviewer-agent/review.json
  decision.json                       # effective ESCALATE_HUMAN
```

Assert:

1. retained trigger remains `ESCALATE_HUMAN`;
2. `provenance.decisionSha256` equals the continuation decision SHA;
3. evidence includes original Solution/Review/base Decision and revision/re-review/effective Decision;
4. no item is created for continuation `DEFER`, `SKIP`, `DEFER_MORE_WORK_REQUESTED`, or participant failure;
5. existing base escalation fixture produces exactly the historical V1 evidence set.

Run and confirm RED.

- [ ] **Step 2: Generalize path validation minimally**

Allow the effective decision to be a safe regular file nested below `workflowRoot` only when the explicit continuation descriptor is present. Do not allow absolute paths or `..`. Keep current strict root `decision.json` behavior for base calls.

- [ ] **Step 3: Build continuation evidence deterministically**

For continuation escalation, retain these round-relative paths in stable order:

```text
problem-package.json
<Problem Package source evidence refs>
selection/selected-hypothesis.json
solution-agent/result.json
reviewer-agent/review.json
decision.json
review-continuation-000001/revision-request.json
review-continuation-000001/solution-revision/result.json
review-continuation-000001/reviewer-agent/review.json   # only when present
review-continuation-000001/decision.json
review-continuation-000001/continuation.json
```

- [ ] **Step 4: Verify HFL GREEN**

```bash
npm run test:evolution:human-followup
```

Expected: PASS with unchanged base HFL behavior.

---

### Task 5: Implement the create-only `runReviewContinuation` workflow

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts`
- Create: `tests/evolution/reviewContinuation.test.ts`

**Interfaces:**

```ts
export interface ReviewContinuationDependencies {
  runSolutionRevision?: typeof runSolutionRevisionAgent;
  runSolutionReReviewer?: typeof runSolutionReReviewer;
  retainHumanFollowup?: typeof retainHumanFollowupWorkItem;
  now?: () => string;
}

export interface RunReviewContinuationInput {
  round: 1 | 2;
  repositoryRoot: string;       // current mutable evolution workspace baseline
  humanFollowupRoot: string;    // authoritative repository HFL root
  workflowInstanceRef: string;
  roundRoot: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  participant: WorkspaceAgentParticipantOptions;
  dependencies?: ReviewContinuationDependencies;
}

export type ReviewContinuationResult =
  | {
      status: 'completed';
      continuationRef: 'review-continuation-000001';
      participantJobs: 1 | 2;
      terminalRoute: SolutionRoute;
      terminalReasonCode: SolutionDecisionReasonCode;
      decision: SolutionDecisionV1;
      decisionPath: string;
      effectiveSolutionPath: string;
      effectiveReviewPath: string | null;
    }
  | {
      status: 'participant_failure';
      continuationRef: 'review-continuation-000001';
      participantJobs: 1 | 2;
      terminalRoute: 'PARTICIPANT_FAILURE';
      terminalReasonCode: null;
      decision: null;
      decisionPath: null;
      effectiveSolutionPath: string | null;
      effectiveReviewPath: string | null;
    };
```

- [ ] **Step 1: Write failing eligibility/preflight tests**

Tests must require all of these before any Participant call or continuation runtime write:

```text
base problem-package.json valid
base solution-agent/result.json = OPTIONS
base reviewer-agent/review.json = REQUEST_MORE_WORK
base decision.json = DEFER_MORE_WORK_REQUESTED / REVIEW_REQUEST_MORE_WORK
problemId matches across all artifacts
base Solution and Reviewer invocation baseline fingerprints match
fresh continuation Solution workspace fingerprint matches the base fingerprint
```

Tamper any one of these and assert `0` Participant calls and no `revision-request.json`.

- [ ] **Step 2: Write failing one-job and two-job flow tests**

Use injected fake runners:

1. revised `INSUFFICIENT_EVIDENCE` → one continuation job → `DEFER`;
2. revised `ESCALATE` → one job → `ESCALATE_HUMAN` and HFL callback once;
3. revised `OPTIONS` + re-review `ACCEPT_OPTION/config_only` → two jobs → `READY_FOR_CONFIG_EXECUTION`;
4. revised `OPTIONS` + re-review `REQUEST_MORE_WORK` → two jobs → `DEFER_MORE_WORK_REQUESTED` and no further calls;
5. revision Participant failure → one job, no decision fabricated;
6. re-review Participant failure → two jobs, no decision fabricated.

Confirm RED.

- [ ] **Step 3: Implement preflight and `revision-request.json`**

Read/validate the base artifacts from `roundRoot`; calculate their SHA-256 values. Read base Solution/Reviewer `invocation.json` to obtain the historical round workspace baseline fingerprint. Prepare fresh revision/re-review workspaces from `repositoryRoot` using the same Problem Package artifact refs as the base round.

Write `revision-request.json` only after all eligibility and baseline checks pass.

- [ ] **Step 4: Implement revision → optional re-review → decision**

Use invocation refs:

```text
solution-revision-000001
solution-rereviewer-000001
```

and destinations:

```text
review-continuation-000001/solution-revision/
review-continuation-000001/reviewer-agent/
```

For a non-`OPTIONS` revision, call `routeSolutionDecision()` with reviewer fields null and `actualParticipantJobs: 1`.

For `OPTIONS`, invoke fresh re-review and call `routeSolutionDecision()` with `actualParticipantJobs: 2`.

Keep `maxParticipantJobs: 4` inside `SolutionDecisionV1` because that historical contract remains unchanged; the continuation's stricter `maxReviewContinuationParticipantJobs: 2` is enforced by the continuation/manifest contracts.

- [ ] **Step 5: Implement create-only `continuation.json` and escalation retention**

On valid decision, write continuation decision then final `continuation.json`. On Participant failure, write final `continuation.json` with `terminalStatus: participant_failure`, null decision refs, and do not fabricate `solution-decision-v1`.

If and only if the continuation decision route is `ESCALATE_HUMAN`, call HFL retention with the continuation evidence descriptor from Task 4.

- [ ] **Step 6: Verify continuation workflow GREEN**

```bash
npx tsx tests/evolution/reviewContinuation.test.ts
npm run test:evolution:human-followup
```

Expected: PASS.

---

### Task 6: Integrate one session-wide continuation into the multi-round Host and effective execution handoff

**Files:**
- Modify: `scripts/evolution/multiRoundExecutionValidation.ts`
- Modify: `tests/evolution/multiRoundExecutionValidation.test.ts`

**Interfaces:**
- Add dependency injection:

```ts
runReviewContinuation?: (input: RunReviewContinuationInput) => Promise<ReviewContinuationResult>;
```

- Introduce a private host projection:

```ts
interface EffectiveRoundResolution {
  baseResult: ProblemAgnosticAgentSolutionLoopResult;
  baseRoute: string;
  baseReasonCode: string | null;
  effectiveRoute: string;
  effectiveReasonCode: string | null;
  continuation: ReviewContinuationResult | null;
  participantJobs: number;
  acceptedArtifacts: null | {
    problemPackagePath: string;
    solutionPath: string;
    reviewPath: string;
  };
}
```

- [ ] **Step 1: Write failing Round 1 continuation tests**

Add deterministic cases:

1. base `REQUEST_MORE_WORK`, token unused, continuation → `DEFER`: no execution, round manifest base route = `DEFER_MORE_WORK_REQUESTED`, effective route = `DEFER`;
2. base request, continuation → `READY`: configuration execution runs using the **revised** Solution/Review paths, not base paths;
3. base `ESCALATE_HUMAN`: no continuation call;
4. base `DEFER`: no continuation call;
5. continuation participant failure: session stops `PARTICIPANT_FAILURE`, no configuration execution.

Confirm RED.

- [ ] **Step 2: Write failing session-token tests**

Cover both directions:

```text
Round 1 uses continuation → execution → Round 2 REQUEST_MORE_WORK
=> Round 2 does not get a second continuation.

Round 1 READY without continuation → execution → Round 2 REQUEST_MORE_WORK
=> Round 2 may consume the one continuation token.
```

Also assert total jobs never exceed 11.

- [ ] **Step 3: Refactor accepted-execution artifact loading**

Change `readAcceptedExecutionInput()` to accept explicit artifact paths rather than assuming:

```text
roundRoot/solution-agent/result.json
roundRoot/reviewer-agent/review.json
```

For base READY, pass the existing base paths. For continuation READY, pass:

```text
roundRoot/review-continuation-000001/solution-revision/result.json
roundRoot/review-continuation-000001/reviewer-agent/review.json
```

The Problem Package path remains the base `roundRoot/problem-package.json`.

- [ ] **Step 4: Integrate eligibility mechanically**

After each completed base round:

```ts
if (
  base decision route === 'DEFER_MORE_WORK_REQUESTED'
  && reviewContinuationCount === 0
) {
  run exactly one review continuation;
}
```

Do not inspect Reviewer natural-language concerns in the Host.

Use continuation result as the effective route. If no continuation runs, effective route equals base route.

- [ ] **Step 5: Write manifest V2 only for new runs**

New `runMultiRoundExecutionValidation()` runs must produce `multi-round-run-manifest-v2` with:

```text
maxReviewContinuations = 1
maxReviewContinuationParticipantJobs = 2
maxTotalParticipantJobs = 11
reviewContinuations = 0..1 entries
budget.reviewContinuationParticipantJobs = 0..2
```

Each round records both base and effective route/reason plus continuation ref.

Historical V1 parsing remains in Task 2.

- [ ] **Step 6: Preserve existing Round 2 boundary**

Round 2 remains terminal after its effective decision; even effective Round 2 `READY_FOR_CONFIG_EXECUTION` does not open a second configuration-execution/cross-round cycle because `maxCrossRoundTransitions` remains 1.

- [ ] **Step 7: Verify Host GREEN**

```bash
npx tsx tests/evolution/multiRoundExecutionValidation.test.ts
npx tsx tests/evolution/p2-real-rerun.test.ts
```

Expected: PASS.

---

### Task 7: Version observability to expose base route, continuation, and effective route

**Files:**
- Modify: `scripts/evolution/operator/runOrdinaryEvolution.ts`
- Modify: `scripts/evolution/reporting/buildOperationalRunReport.ts`
- Modify: `scripts/evolution/reporting/buildOperationalObservabilityIndex.ts`
- Modify: `scripts/evolution/reporting/archiveOperationalRunReport.ts`
- Modify: `scripts/evolution/reporting/refreshArchivedOperationalRunReports.ts`
- Modify: `scripts/evolution/reporting/buildHumanReviewSummary.ts`
- Modify: `tests/evolution/ordinaryEvolutionOperator.test.ts`
- Modify: `tests/evolution/operationalRunReport.test.ts`
- Modify: `tests/evolution/humanReviewSummary.test.ts`

**Interfaces:**
- Add `auto-evolution-operational-run-report-v5` containing `MultiRoundSessionSummaryV2` + existing workspace provenance + existing audited workflows.
- V1–V4 parsers remain valid.

- [ ] **Step 1: Write failing operator/session-summary tests**

A V2 session summary with base `DEFER_MORE_WORK_REQUESTED`, continuation ref, and effective `ESCALATE_HUMAN` must format visibly as:

```text
base route: DEFER_MORE_WORK_REQUESTED
review continuation: review-continuation-000001
effective route: ESCALATE_HUMAN
```

Do not collapse it to one route.

- [ ] **Step 2: Write failing Operational Report V5 parse/archive tests**

Require:

1. a new V2 manifest archives as report V5;
2. V5 report identity includes durable V2 session semantics;
3. V1–V4 reports still parse/refresh unchanged;
4. report JSON exposes round `baseTerminalRoute`, `continuationRef`, and `effectiveTerminalRoute`;
5. workspace provenance remains present exactly as V4 did.

- [ ] **Step 3: Write failing Human Review projection tests**

For base request → continuation escalation:

- Human summary must treat effective `ESCALATE_HUMAN` as the current formal route;
- it must still explain that base Reviewer requested more work first;
- required ChatGPT/HFL guidance remains the ESCALATE behavior.

For second request → final `DEFER_MORE_WORK_REQUESTED`, the summary must not claim Human escalation or create HFL guidance.

- [ ] **Step 4: Implement session-summary union support**

Change consumers to accept:

```ts
MultiRoundSessionSummary = MultiRoundSessionSummaryV1 | MultiRoundSessionSummaryV2
```

Use V2 round facts when available; retain current V1 behavior for historical reports.

- [ ] **Step 5: Add report V5 and archive selection**

`archiveOperationalRunReport()` selects:

```text
no manifest               → V1
V1 summary, no provenance → V3
V1 summary + provenance   → V4
V2 summary + provenance   → V5
```

A V2 manifest without workspace provenance must fail closed rather than silently down-convert, because current production V2 runs require workspace provenance.

- [ ] **Step 6: Update index/refresh prose minimally**

Document V5 as “V4 + bounded review-continuation session semantics”. Do not turn observability into analysis or Participant-quality scoring.

- [ ] **Step 7: Verify observability GREEN**

```bash
npx tsx tests/evolution/ordinaryEvolutionOperator.test.ts
npx tsx tests/evolution/operationalRunReport.test.ts
npx tsx tests/evolution/humanReviewSummary.test.ts
npx tsx tests/evolution/workflowDecisionAudit.test.ts
```

Expected: PASS.

---

### Task 8: Add a controlled historical continuation replay and run only the approved fixed cases

**Files:**
- Create: `scripts/evolution/replay/runReviewContinuationReplay.ts`
- Create: `tests/evolution/reviewContinuationReplay.test.ts`
- Modify: `package.json`
- Runtime output only, not committed: `artifacts/ae-bounded-more-work-continuation-v1-20260912/`

**Interfaces:**
- CLI:

```text
--case-root <fixed-case-root>
--output <create-only-output-root>
--participant-binding CODEX_CURRENT
```

- Package scripts:

```json
"test:evolution:review-continuation": "tsx tests/evolution/reviewContinuationContract.test.ts && tsx tests/evolution/reviewContinuation.test.ts && tsx tests/evolution/reviewContinuationReplay.test.ts",
"evolution:review-continuation:replay": "tsx scripts/evolution/replay/runReviewContinuationReplay.ts"
```

- [ ] **Step 1: Write failing replay-integrity tests**

The replay must verify `ae-fixed-replay-case-manifest-v1`, fixed Problem Package hash, historical Solution/Review/Decision hashes, declared artifacts, and equal historical Solution/Reviewer workspace baseline fingerprints before any Participant call.

It must reject a protection case whose historical base decision is not `DEFER_MORE_WORK_REQUESTED` without calling a Participant.

- [ ] **Step 2: Implement replay as a thin adapter over the new continuation runners**

Do not regenerate Feedback/Hypothesis/Selection/Problem Package. Use the frozen historical workspace/content from the fixed case and create all replay outputs only under the requested output root.

Do not write HFL state during replay; the replay reports the would-be effective route as evidence only.

- [ ] **Step 3: Verify replay tests GREEN**

```bash
npm run test:evolution:review-continuation
npm run test:evolution:fixed-replay-case
npm run test:evolution:solution-replay
```

Expected: PASS.

- [ ] **Step 4: Deterministic gate before external Participant calls**

Run:

```bash
npm run typecheck
npx tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npx tsx tests/evolution/multiRoundExecutionValidation.test.ts
npm run test:evolution:human-followup
npm run test:evolution:review-continuation
git diff --check
```

All must pass before real replay.

- [ ] **Step 5: Execute the pre-authorized controlled replay**

External-call authorization is bounded as follows:

```text
Participant binding: CODEX_CURRENT
Model override: none; use the repository's canonical current binding
Target cases:
  ordinary-run-20260910-000006-round-1
  ordinary-run-20260910-000007-round-1
Protection case:
  ordinary-run-20260910-000005-round-1
Maximum new Participant invocations: 4 total
  - up to 2 for 000006
  - up to 2 for 000007
  - 0 for 000005 protection eligibility check
New gameplay runs: 0
Configuration executions: 0
Authoritative repository writes by Participants: 0
Automatic retry/model switch: 0
STOP after these three case evaluations
```

Use create-only output directories:

```text
artifacts/ae-bounded-more-work-continuation-v1-20260912/000006/
artifacts/ae-bounded-more-work-continuation-v1-20260912/000007/
artifacts/ae-bounded-more-work-continuation-v1-20260912/000005-protection/
```

- [ ] **Step 6: Report replay mechanics, not a READY-rate score**

For each target report only:

```text
base historical route
continuation Participant count
revision status
re-review decision (if any)
effective route
whether requested bounded work was actually investigated
whether unavailable evidence was fabricated (must be NO)
whether Human authority was bypassed (must be NO)
```

For 000005 report `continuation invoked = NO`.

Do not launch a fresh ordinary session in this task.

---

### Task 9: Full regression, stage closure, and final implementation report

**Files:**
- Modify only after all code/tests/replay evidence above are complete:
  - `docs/governance/current-product-stage.md`
- Do not create a separate closure report document; runtime evidence stays in `artifacts/` and Git diff/history.

- [ ] **Step 1: Run focused full feature verification**

```bash
npm run test:evolution:review-continuation
npm run test:evolution:human-followup
npm run test:evolution:solution-replay
npm run test:evolution:fixed-replay-case
npx tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npx tsx tests/evolution/multiRoundExecutionValidation.test.ts
npx tsx tests/evolution/ordinaryEvolutionOperator.test.ts
npx tsx tests/evolution/operationalRunReport.test.ts
npx tsx tests/evolution/humanReviewSummary.test.ts
npx tsx tests/evolution/workflowDecisionAudit.test.ts
npm run typecheck
git diff --check
```

Expected: all focused commands PASS.

- [ ] **Step 2: Run repository-wide baseline comparison**

Run:

```bash
npm test
```

If the only failures remain the already-known baseline failures:

```text
stageAtomicProgression
canonicalUndefinedPropertyElimination
src/composables/useNewGameEngine.ts:583
Packed passive memory must be prepared before acknowledgement
```

report them as pre-existing/outside scope and do not modify them. Any new failure is a blocker and must be investigated before completion.

- [ ] **Step 3: Run scope/provenance audit**

Confirm mechanically:

```text
Production Selection modified? NO
DeepSeek experiment reintroduced? NO
PD-100 HFL trigger expanded? NO
PD-111 evidence scope expanded? NO
Full P3 reopened? NO
New gameplay sample during continuation? NO
More than one continuation/session possible? NO
More than two continuation Participant jobs possible? NO
Total Participant jobs > 11 possible? NO
Second REQUEST_MORE_WORK loops? NO
Base decision overwritten? NO
Historical V1 manifest/report parser removed? NO
Continuation READY executes original superseded option? NO
```

- [ ] **Step 4: Update current stage only after evidence is green**

Add a concise authority/status line under RUN / OBSERVE stating that PD-117 Bounded More-Work Continuation v1 is engineering-delivered and that it allows one bounded Reviewer-driven continuation while keeping HFL/PD-111/full-P3 boundaries unchanged. Do not add plan/smoke chronology.

- [ ] **Step 5: Final implementation report**

Report exactly these sections:

1. **Authority / design** — PD-117 path and accepted spec path.
2. **Changed files** — grouped by contract, Participant, Host, HFL, observability, replay, governance.
3. **State-machine behavior** — base route → optional continuation → effective route.
4. **Budget proof** — max 1 continuation, max 2 continuation jobs, max 11 total jobs.
5. **HFL / authority proof** — effective escalation only; protection of PD-100/PD-111.
6. **Historical compatibility** — V1 manifest and V1–V4 report parse results.
7. **Controlled replay table** — 000006, 000007, 000005 protection; no quality score or READY-rate optimization claim.
8. **Verification commands/results** — exact command and PASS/FAIL.
9. **Repository-wide baseline failures** — unchanged known failures, if still present.
10. **Scope audit** — answer each item from Step 3.
11. **Deviations/blockers** — state `NONE` if none; otherwise stop and identify the exact accepted-design boundary that could not be implemented.
12. **NEXT_REVIEW_INPUT: REPOSITORY_REQUIRED**.

Do not claim product effectiveness from deterministic tests alone. Engineering completion proves the bounded mechanism; natural ordinary-run effectiveness remains a later Human-approved observation decision.

---

## Acceptance Criteria

The implementation is mechanically acceptable only if all are true:

1. PD-117 is recorded before runtime behavior changes.
2. The accepted design is present at the canonical spec path.
3. Base Problem-Agnostic Solution Loop remains a four-job workflow.
4. First eligible `REQUEST_MORE_WORK` may start one Host continuation; no other base route starts it.
5. Continuation uses a fresh Solution revision invocation and at most one fresh re-review.
6. Second `REQUEST_MORE_WORK` is terminal and cannot recurse.
7. Revision can safely terminate as `NO_PROPOSAL`, `INSUFFICIENT_EVIDENCE`, or `ESCALATE` without forcing re-review.
8. Continuation Participant failure creates no fake Decision and no automatic HFL item.
9. Effective READY executes only the revised accepted option/review pair.
10. HFL is created only for effective formal `ESCALATE_HUMAN` and retains the complete base + continuation evidence chain.
11. No new gameplay sample is created to satisfy Reviewer work.
12. Session budget cannot exceed 11 jobs and continuation budget cannot exceed 2 jobs.
13. New runs use manifest/session-summary V2; historical V1 remains readable.
14. New archived reports use V5 and show base route, continuation occurrence, and effective route; V1–V4 remain readable/refreshable.
15. Ordinary AE remains `CODEX_CURRENT`; no provider/model switch is introduced.
16. Controlled replay uses only fixed 000006/000007 plus 000005 protection, at most 4 new Participant invocations, and no ordinary session.
17. Focused tests/typecheck/diff checks pass.
18. Repository-wide tests introduce no new failures beyond the separately known baseline failures.
19. No unrelated game/content/Selection/P3 changes are present.
20. Human final review receives a fresh repository snapshot because runtime implementation changed.
