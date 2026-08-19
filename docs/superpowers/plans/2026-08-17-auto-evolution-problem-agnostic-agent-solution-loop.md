# Problem-Agnostic Agent Solution Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run one no-execution experiment that packages a fresh product problem, hands it to a workspace-capable Solution Agent, independently reviews the result with a second Agent, and deterministically routes the outcome without domain-specific Orchestrator reasoning.

**Architecture:** Reuse the existing External Feedback and Improvement Hypothesis stages. Replace the old active Investigation/Modification Work middle with four small units: `ProblemPackage`, disposable Agent job workspaces, `SolutionWork` / `SolutionReview` contracts, and a deterministic Router. The authoritative repository remains unchanged; both Agent jobs operate in independent disposable copies and the experiment stops after routing.

**Tech Stack:** TypeScript 5.9, Node.js filesystem/child-process APIs, existing canonical JSON/SHA-256 provenance helpers, existing DeepSeek Feedback/Hypothesis runners, existing Cursor CLI pattern for first workspace-capable Agent implementation.

## Global Constraints

- New long-term authority: Orchestrator owns workflow; Agents own reasoning.
- No problem taxonomy or domain-specific branching in the new active path.
- Fixed source experience: sealed Cross-Run Cohort `cohort-run-000001`.
- Do not expose historical longitudinal/cohort/resource-dynamics conclusions to Solution or Reviewer.
- Reuse External Feedback and Improvement Hypothesis; do not call Hypothesis Investigation or Modification Work.
- Hypothesis selection is deterministic participant-order index 0 after validating the whole set.
- Maximum Participant Job Invocations = 4; retry = 0.
- Solution and Reviewer operate in separate disposable writable workspaces from the same clean authoritative baseline.
- Authoritative repository must remain unchanged before/after every Agent job.
- Secrets (`.env`, credentials, API keys) must not be copied into Agent workspaces or artifacts.
- Program/code change recommendations are allowed as reasoning but route to Human escalation.
- No configuration execution, gameplay change, Candidate, comparative run, promotion, or autonomous loop in this experiment.
- All experiment artifacts are create-only under `.tmp/evolution/problem-agnostic-agent-solution-loop/`.
- Real Participant jobs run only after deterministic tests/typecheck pass.
- Terminal state after Decision Router: Human workflow review.

---

## Task 1: Authority preflight and active experiment docs

**Files:**
- Create: `docs/superpowers/specs/2026-08-17-auto-evolution-problem-agnostic-agent-solution-loop-design.md`
- Create: `docs/superpowers/plans/2026-08-17-auto-evolution-problem-agnostic-agent-solution-loop.md`
- Modify: `docs/governance/current-product-stage.md`
- Test: no new runtime test; use repository searches and governance consistency checks.

**Interfaces:**
- Consumes: current Project Sources and repo docs authority.
- Produces: active-stage authority for this experiment only.

- [ ] **Step 1: Verify direction-reset authority is installed**

Confirm current docs express all of:

```text
Auto Evolution = Agent Workflow Orchestrator
Orchestrator owns workflow; Agents own reasoning
configuration-level automatic work is the current preferred automatic write boundary
program/runtime/framework changes escalate to Human
NO_PROPOSAL / REJECT / SKIP / DEFER / ESCALATE are valid outcomes
```

If repository docs still present Bounded Resource Dynamics as active next work, perform only the already-Human-approved docs alignment/closure sync first. If the direction-reset authority is absent or materially different, STOP.

- [ ] **Step 2: Write the accepted design verbatim in product meaning**

Use the accepted design provided with this plan. Do not add execution, retry-loop, UI, multi-provider, or domain-specific behavior.

- [ ] **Step 3: Write this implementation plan into the repo plan path**

Keep exact constraints and STOP boundary.

- [ ] **Step 4: Update current product stage**

Record only:

```text
Problem-Agnostic Agent Solution Loop = ACTIVE / Human accepted design
fixed source = sealed cohort-run-000001
max participant jobs = 4
retry = 0
old Hypothesis Investigation path = not active for this experiment
old Modification Work path = not active for this experiment
config execution = NOT AUTHORIZED in this experiment
code execution = NOT AUTHORIZED
STOP = Human workflow review after Decision Router
```

- [ ] **Step 5: Verify no predecessor sealed artifacts changed**

Hash or git-status-check `.tmp/evolution/cross-run-cohort-investigation-evidence/` and other sealed roots used by this experiment.

---

## Task 2: Define problem-agnostic contracts

**Files:**
- Create: `src/evolution/problemPackageContract.ts`
- Create: `src/evolution/solutionWorkContract.ts`
- Create: `src/evolution/solutionReviewContract.ts`
- Create: `src/evolution/solutionDecisionContract.ts`
- Test: `tests/evolution/problemAgnosticSolutionContracts.test.ts`

**Interfaces:**
- Consumes: `ImprovementHypothesis` from `src/evolution/improvementHypothesisContract.ts`.
- Produces:
  - `ProblemPackageV1`
  - `SolutionWorkV1`
  - `SolutionReviewV1`
  - `SolutionDecisionV1`
  - strict parse/validation functions.

- [ ] **Step 1: Write failing exact-key contract tests**

Cover valid payloads and rejection of unknown fields. Include a test that a `ProblemPackageV1` containing any of these fields fails:

```text
problemType
domain
resourceStat
mechanismType
investigationMode
allowedMechanismRefs
```

- [ ] **Step 2: Implement `ProblemPackageV1`**

Required shape:

```ts
export interface ProblemPackageV1 {
  schemaVersion: 'problem-package-v1';
  problemId: string;
  source: {
    runRef: string;
    observablePayloadRef: string;
    externalFeedbackRef: string;
    improvementHypothesisRef: string;
  };
  problem: {
    hypothesisId: string;
    statement: string;
    observedBasis: string;
    feedbackRefs: string[];
    evidenceRefs: string[];
    unknowns: string[];
    productSignificance: string;
  };
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  permissions: {
    authoritativeProductWrite: false;
    sandboxWrite: true;
    productExecution: false;
    codeExecution: false;
  };
}
```

`problem.*` is copied verbatim from the selected `ImprovementHypothesis`; no new interpretation fields are allowed.

- [ ] **Step 3: Implement `SolutionWorkV1`**

```ts
export type SolutionWorkStatus =
  | 'OPTIONS'
  | 'NO_PROPOSAL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'ESCALATE';

export type SolutionChangeScope =
  | 'configuration'
  | 'program'
  | 'mixed'
  | 'uncertain';

export interface SolutionOptionV1 {
  optionId: string;
  proposedChange: string;
  rationale: string;
  repoRefs: string[];
  artifactRefs: string[];
  changeScope: SolutionChangeScope;
  expectedPlayerObservableDifference: string;
  risks: string[];
  unknowns: string[];
}
```

Root contains `schemaVersion`, `status`, `problemId`, `options`, optional `recommendedOptionId`, `summary`, `repoRefs`, `artifactRefs`. Enforce maximum three options and stable option ids `option-000001..` in participant order.

- [ ] **Step 4: Implement `SolutionReviewV1`**

```ts
export type SolutionReviewDecision =
  | 'ACCEPT_OPTION'
  | 'ACCEPT_NO_ACTION'
  | 'REJECT'
  | 'REQUEST_MORE_WORK'
  | 'DEFER'
  | 'ESCALATE';

export type ReviewScopeAssessment =
  | 'config_only'
  | 'code_required'
  | 'mixed'
  | 'uncertain';
```

Root includes `schemaVersion`, `problemId`, `decision`, optional `acceptedOptionId`, optional `scopeAssessment`, `assessment`, `repoRefs`, `artifactRefs`, `concerns`.

- [ ] **Step 5: Implement `SolutionDecisionV1`**

Statuses:

```ts
export type SolutionRoute =
  | 'READY_FOR_CONFIG_EXECUTION'
  | 'SKIP'
  | 'DEFER'
  | 'DEFER_MORE_WORK_REQUESTED'
  | 'ESCALATE_HUMAN';
```

Decision artifact records only structured workflow inputs and reason codes, not domain text.

- [ ] **Step 6: Run contract tests and typecheck**

Run:

```bash
npx tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npm run typecheck
```

Expected: PASS.

---

## Task 3: Build the Problem Package without domain preprocessing

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/buildProblemPackage.ts`
- Test: `tests/evolution/problemPackageBuilder.test.ts`
- Reuse: `scripts/evolution/freshProblemTransfer/selectFirstHypothesis.ts`

**Interfaces:**
- Consumes: selected hypothesis artifact, source refs, authority refs, source fingerprint.
- Produces: create-only `problem-package.json` matching `ProblemPackageV1`.

- [ ] **Step 1: Write failing tests for verbatim hypothesis transfer**

Assert all selected hypothesis text/ref arrays are byte-for-byte equivalent after JSON parsing and no derived domain fields appear.

- [ ] **Step 2: Implement builder**

Expose:

```ts
export async function buildProblemPackage(input: {
  selectedHypothesisPath: string;
  runRef: string;
  observablePayloadRef: string;
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  authorityRefs: string[];
  productSourceFingerprintSha256: string;
  destinationPath: string;
}): Promise<ProblemPackageV1>;
```

Use canonical JSON and create-only `wx` semantics.

- [ ] **Step 3: Add no-domain-key recursive guard**

Before writing, recursively reject reserved Orchestrator keys:

```text
problemType
domain
resourceStat
mechanismType
investigationMode
allowedMechanismRefs
```

This is a drift guard, not a product taxonomy.

- [ ] **Step 4: Run builder tests**

Expected: valid package passes; destination-exists and injected-domain-field tests fail closed.

---

## Task 4: Implement disposable Agent workspace preparation

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/agentWorkspace.ts`
- Test: `tests/evolution/agentWorkspaceIsolation.test.ts`

**Interfaces:**
- Consumes: authoritative repo root, experiment root, job kind (`solution` or `reviewer`).
- Produces: independent workspace path, baseline fingerprint, copy manifest.

- [ ] **Step 1: Write failing isolation tests**

Test with a fixture repository containing normal files plus `.env`, `.env.local`, `.git`, and a pre-existing `.tmp/evolution` tree.

Expected workspace must contain product source/docs needed for inspection but exclude secrets and git internals.

- [ ] **Step 2: Implement `prepareAgentWorkspace()`**

```ts
export async function prepareAgentWorkspace(input: {
  authoritativeRoot: string;
  destinationRoot: string;
  jobKind: 'solution' | 'reviewer';
}): Promise<{
  workspaceRoot: string;
  authoritativeFingerprintSha256: string;
  workspaceBaselineFingerprintSha256: string;
  manifestPath: string;
}>;
```

Use deterministic copy rules. At minimum exclude:

```text
.git/
.env
.env.*
node_modules/
dist/
.tmp/evolution/problem-agnostic-agent-solution-loop/
```

Do not copy credentials. Preserve source/docs/package manifests needed by an Agent to inspect and run repository commands.

- [ ] **Step 3: Prove reviewer independence**

Test that modifying Solution workspace then creating Reviewer workspace does not copy the Solution modification and both initial workspaces have identical baseline fingerprints.

- [ ] **Step 4: Add authoritative-root fingerprint guard**

Expose helper to capture fingerprint before and after Agent jobs. The experiment must fail if authoritative root changes.

---

## Task 5: Implement workspace-capable Agent job adapter

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/agentParticipant.ts`
- Create: `scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts`
- Test: `tests/evolution/agentParticipant.test.ts`
- Reference only: `scripts/ralph-cursor-agent.sh`

**Interfaces:**
- Produces generic product-level interface independent of Cursor:

```ts
export interface WorkspaceAgentJobInput {
  invocationRef: string;
  role: 'solution' | 'reviewer';
  workspaceRoot: string;
  prompt: string;
}

export interface WorkspaceAgentJobSuccess {
  ok: true;
  rawOutput: string;
  exitCode: 0;
}

export interface WorkspaceAgentJobFailure {
  ok: false;
  errorKind: 'runtime_unavailable' | 'process' | 'timeout' | 'invalid_output';
  message: string;
  rawOutput?: string;
  exitCode?: number;
}
```

- [ ] **Step 1: Write adapter tests using a fake executable hook**

Do not require Cursor in unit tests. Assert one process invocation, supplied workspace, captured stdout/stderr, no retry.

- [ ] **Step 2: Implement generic adapter contract**

Keep Cursor-specific command construction in `cursorAgentParticipant.ts` only.

- [ ] **Step 3: Implement first Cursor adapter using the repository's proven CLI pattern**

Use non-interactive `cursor agent --print --trust --force --workspace <workspace>` semantics already present in `scripts/ralph-cursor-agent.sh`.

Do not name Cursor in product contracts or decision artifacts except participant metadata.

- [ ] **Step 4: Add preflight**

If `cursor` CLI/authentication is unavailable, return `runtime_unavailable` and STOP before any Agent job. Do not switch providers automatically.

---

## Task 6: Solution Agent prompt, result capture, and validation

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
- Test: `tests/evolution/solutionAgentLoop.test.ts`

**Interfaces:**
- Consumes: Problem Package, fresh source artifacts copied into the solution workspace.
- Produces: `solution-agent/invocation.json`, `raw-output.txt`, `result.json`.

- [ ] **Step 1: Write prompt-boundary tests**

Captured prompt must tell the Agent:

```text
You own investigation and solution reasoning.
Read the repository and referenced artifacts yourself.
You may run commands and make temporary changes inside this disposable workspace.
Do not modify or assume access to the authoritative repository.
Return zero to three options or an explicit no-proposal/insufficient-evidence/escalate result.
Program/code recommendations are allowed, but execution permission is separate.
Write/return only the structured SolutionWorkV1 result as the final job result.
```

Prompt must not contain `money`, `marriage`, `combat`, resource-specific analysis instructions, historical Human conclusions, or old Investigation responses unless those words occur verbatim in the fresh Problem Package/source evidence.

- [ ] **Step 2: Implement result parsing/validation**

Validate against `SolutionWorkV1`; validate every `repoRef` exists inside the clean baseline; validate every `artifactRef` resolves to an allowed source artifact or experiment artifact.

Do not judge whether references are intellectually correct.

- [ ] **Step 3: Persist create-only invocation/raw/result artifacts**

Invocation records participant runtime metadata, workspace baseline fingerprint, Problem Package hash, and job number. Do not persist secrets.

- [ ] **Step 4: Enforce retry zero**

Any runtime or validation failure produces a failed artifact and terminal STOP. Never call the Agent again in this experiment.

---

## Task 7: Independent Reviewer Agent

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`
- Test: `tests/evolution/solutionReviewerLoop.test.ts`

**Interfaces:**
- Consumes: Problem Package, validated `SolutionWorkV1`, a new clean Reviewer workspace.
- Produces: `reviewer-agent/invocation.json`, `raw-output.txt`, `review.json`.

- [ ] **Step 1: Write independence tests**

Reviewer prompt/input must not include:

```text
Solution workspace path
Solution workspace diff
Solution scratch files
Solution raw command transcript
hidden reasoning
```

It may include structured Solution Result and the Problem Package.

- [ ] **Step 2: Write Reviewer prompt test**

Require independent source inspection and explicit permission to reject all options. Do not ask the Reviewer to agree with the Solution Agent.

- [ ] **Step 3: Implement one Reviewer Agent job**

Use a freshly prepared Reviewer workspace. Validate review references and accepted option ids.

- [ ] **Step 4: Validate scope consistency structurally**

Do not overwrite either Agent's scope judgment. Preserve both for Router input.

---

## Task 8: Deterministic Decision Router

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/routeSolutionDecision.ts`
- Test: `tests/evolution/solutionDecisionRouter.test.ts`

**Interfaces:**
- Consumes: validated Solution Result + Review Result + fixed permission boundary.
- Produces: `SolutionDecisionV1`.

- [ ] **Step 1: Write routing matrix tests**

At minimum:

```text
OPTIONS + ACCEPT_OPTION + solution configuration + review config_only
→ READY_FOR_CONFIG_EXECUTION

OPTIONS + ACCEPT_OPTION + solution program
→ ESCALATE_HUMAN

OPTIONS + ACCEPT_OPTION + review code_required/mixed/uncertain
→ ESCALATE_HUMAN

NO_PROPOSAL
→ SKIP

INSUFFICIENT_EVIDENCE
→ DEFER

Reviewer REJECT
→ SKIP

Reviewer REQUEST_MORE_WORK
→ DEFER_MORE_WORK_REQUESTED

Reviewer DEFER
→ DEFER

Either side ESCALATE
→ ESCALATE_HUMAN
```

- [ ] **Step 2: Prove Router ignores domain text**

Create two fixtures with identical structured statuses/scopes but completely different problem/solution prose. Assert identical route and reason codes.

- [ ] **Step 3: Implement pure router**

No filesystem reads, LLM calls, product-source reads, keyword analysis, or problem classification.

---

## Task 9: Experiment orchestrator

**Files:**
- Create: `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts`
- Create: `tests/evolution/problemAgnosticAgentSolutionLoop.test.ts`
- Modify: existing evolution test runner if there is one appropriate to register the tests.

**Interfaces:**
- Reuses:
  - `scripts/evolution/runMinimalExternalFeedback.ts`
  - `scripts/evolution/runImprovementHypothesis.ts`
  - `scripts/evolution/freshProblemTransfer/selectFirstHypothesis.ts`
- Explicitly does not call:
  - `scripts/evolution/runHypothesisInvestigation.ts`
  - `scripts/evolution/runModificationWork.ts`

- [ ] **Step 1: Implement fixed-source preflight**

Require sealed source artifacts for:

```text
.tmp/evolution/cross-run-cohort-investigation-evidence/phase0/cohort-run-000001/reviewer-input/observable-payload.json
.tmp/evolution/cross-run-cohort-investigation-evidence/phase0/cohort-run-000001/provenance/source-fingerprint.json
.tmp/evolution/cross-run-cohort-investigation-evidence/phase0/cohort-run-000001/experiment-root.json
```

Verify Phase 0 seal/provenance using existing helpers. Do not read old cohort Investigation or Human-review artifacts.

- [ ] **Step 2: Run fresh External Feedback**

New experiment invocation identity; exactly one job; retry zero.

- [ ] **Step 3: Run fresh Improvement Hypothesis**

Exactly one job; retry zero; validate whole set.

- [ ] **Step 4: Handle zero-hypothesis terminal path**

If zero hypotheses, write a `decision.json` representing `SKIP` with reason `NO_PROBLEM_FORMED`, generate Human review package, and STOP with actual participant jobs = 2.

- [ ] **Step 5: Deterministically select index 0**

Reuse/refactor `selectFirstHypothesis()` without changing its historical semantics. Store a new experiment-local selection artifact if necessary; do not overwrite historical Fresh-Problem selection.

- [ ] **Step 6: Build Problem Package and two clean workspaces**

Solution and Reviewer workspace baselines must match each other and the authoritative source fingerprint semantics defined for this experiment.

- [ ] **Step 7: Run Solution Agent once**

If Solution returns a terminal no-proposal/insufficient/escalate status that does not require Reviewer under the accepted routing design, preserve result and route deterministically. Preferred first implementation: still run Reviewer for `OPTIONS`; do not invent additional review calls.

- [ ] **Step 8: Run Reviewer once for `OPTIONS`**

Fresh workspace, clean context, one job, retry zero.

- [ ] **Step 9: Route and STOP**

Write create-only `decision.json`. Even `READY_FOR_CONFIG_EXECUTION` is terminal in this experiment.

- [ ] **Step 10: Assert job budget**

Maximum actual participant jobs = 4. No internal framework retries.

---

## Task 10: Human review package and architecture assertions

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/buildHumanReviewPackage.ts`
- Test: `tests/evolution/problemAgnosticHumanReview.test.ts`

**Interfaces:**
- Consumes experiment artifacts only after terminal routing.
- Produces `.tmp/evolution/problem-agnostic-agent-solution-loop/human-review-package.md`.

- [ ] **Step 1: Include provenance and job summary**

Report source run hash, fresh Feedback/Hypothesis invocation refs, selected hypothesis, Problem Package hash, Solution/Reviewer workspace baseline fingerprints, invocation refs, result hashes, decision route, and actual participant-job count.

- [ ] **Step 2: Include Human-only inspectable Agent outputs**

Show structured Solution Result and Review Result. Raw outputs may be linked by artifact path rather than copied wholesale if large.

- [ ] **Step 3: Add mechanical architecture audit section**

Report:

```text
new active path contains domain branch = false
old runHypothesisInvestigation invoked = false
old runModificationWork invoked = false
authoritative repo changed by Agent jobs = false
solution/reviewer baseline fingerprints match = true
reviewer derived from solution workspace = false
config/gameplay execution performed = false
```

- [ ] **Step 4: Request exactly three Human decisions**

```text
ORCHESTRATION_AGNOSTIC / ORCHESTRATION_NOT_AGNOSTIC
AGENT_OWNS_REASONING / AGENT_DOES_NOT_OWN_REASONING
INDEPENDENT_REVIEW_AND_BOUNDARY / INDEPENDENT_REVIEW_OR_BOUNDARY_FAILED
```

Do not pre-fill Human outcomes.

---

## Task 11: Deterministic gate before real Participant jobs

**Files:**
- No new product files unless a test runner needs registration.

- [ ] **Step 1: Run focused new tests**

```bash
npx tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npx tsx tests/evolution/problemPackageBuilder.test.ts
npx tsx tests/evolution/agentWorkspaceIsolation.test.ts
npx tsx tests/evolution/agentParticipant.test.ts
npx tsx tests/evolution/solutionAgentLoop.test.ts
npx tsx tests/evolution/solutionReviewerLoop.test.ts
npx tsx tests/evolution/solutionDecisionRouter.test.ts
npx tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npx tsx tests/evolution/problemAgnosticHumanReview.test.ts
```

- [ ] **Step 2: Run predecessor regressions**

At minimum:

```bash
npx tsx tests/evolution/improvementHypothesisLoop.test.ts
npx tsx tests/evolution/improvementHypothesisContract.test.ts
npx tsx tests/evolution/phase0EndToEnd.test.ts
npm run typecheck
```

Run existing minimal External Feedback test runner/test file as defined by the repository.

- [ ] **Step 3: Verify zero real participant jobs so far**

The deterministic gate itself must not invoke DeepSeek or Cursor.

- [ ] **Step 4: Verify source authority unchanged**

No gameplay/config source modifications from Agent execution; implementation source changes for this feature are allowed in the development repo, but the fixed product baseline copied into Agent workspaces must be separately fingerprinted and treated as the experiment authority.

---

## Task 12: Execute the one real experiment and STOP

**Files/artifacts:**
- Create-only under `.tmp/evolution/problem-agnostic-agent-solution-loop/`.
- Modify governance only to record Human final review pending after successful terminal routing.

- [ ] **Step 1: Participant runtime preflight**

Confirm DeepSeek credentials for existing Feedback/Hypothesis runners and Cursor CLI/authentication for Agent jobs. Do not copy secrets to workspaces or artifacts.

If required runtime is unavailable, STOP with zero/partial jobs as applicable. Do not substitute another provider.

- [ ] **Step 2: Execute orchestration once**

No manual selection or mid-run steering.

- [ ] **Step 3: Preserve the actual terminal outcome**

Any of these is valid:

```text
SKIP
DEFER
DEFER_MORE_WORK_REQUESTED
ESCALATE_HUMAN
READY_FOR_CONFIG_EXECUTION
```

- [ ] **Step 4: Do not execute accepted work**

Even `READY_FOR_CONFIG_EXECUTION` stops here.

- [ ] **Step 5: Update governance to Human review pending**

Record actual job count and terminal route, but not Human acceptance.

- [ ] **Step 6: Report and STOP**

Report:

```text
source run / hashes
changed implementation files
tests/typecheck
participant job count
Feedback invocation
Hypothesis invocation
selected hypothesis
Problem Package hash
Solution invocation/result
Reviewer invocation/review (if run)
Decision route
authoritative source unchanged proof
old Investigation calls = 0
old Modification Work calls = 0
config/gameplay execution = 0
Human review package path
```

Then STOP for Human workflow review.

---

## Expected New/Modified Files

Expected new files:

```text
src/evolution/problemPackageContract.ts
src/evolution/solutionWorkContract.ts
src/evolution/solutionReviewContract.ts
src/evolution/solutionDecisionContract.ts

scripts/evolution/problemAgnosticSolution/buildProblemPackage.ts
scripts/evolution/problemAgnosticSolution/agentWorkspace.ts
scripts/evolution/problemAgnosticSolution/agentParticipant.ts
scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts
scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts
scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts
scripts/evolution/problemAgnosticSolution/routeSolutionDecision.ts
scripts/evolution/problemAgnosticSolution/buildHumanReviewPackage.ts
scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts

tests/evolution/problemAgnosticSolutionContracts.test.ts
tests/evolution/problemPackageBuilder.test.ts
tests/evolution/agentWorkspaceIsolation.test.ts
tests/evolution/agentParticipant.test.ts
tests/evolution/solutionAgentLoop.test.ts
tests/evolution/solutionReviewerLoop.test.ts
tests/evolution/solutionDecisionRouter.test.ts
tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
tests/evolution/problemAgnosticHumanReview.test.ts
```

Expected governance/spec files:

```text
docs/governance/current-product-stage.md
docs/superpowers/specs/2026-08-17-auto-evolution-problem-agnostic-agent-solution-loop-design.md
docs/superpowers/plans/2026-08-17-auto-evolution-problem-agnostic-agent-solution-loop.md
```

Do not modify as part of the new active reasoning path unless required for a regression-only compatibility fix within existing semantics:

```text
scripts/evolution/hypothesisInvestigation/**
scripts/evolution/runHypothesisInvestigation.ts
scripts/evolution/modificationWork/**
scripts/evolution/runModificationWork.ts
src/evolution/hypothesisInvestigationContract.ts
src/evolution/modificationWorkContract.ts
gameplay data/config/source
```

## Final Product-Direction Check

Before real Agent jobs, ask mechanically:

> If the selected problem were about marriage, combat, story pacing, or any other unseen domain instead of the actual fresh problem, would the new Orchestrator code path be identical?

The answer must be **yes** except for the content carried inside Problem Package and Agent outputs.

If not, STOP and revise before any real Participant job.

