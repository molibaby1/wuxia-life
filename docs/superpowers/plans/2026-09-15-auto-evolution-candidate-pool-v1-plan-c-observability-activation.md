# Auto Evolution Candidate Pool v1 — Plan C Observability and Default Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make the PD-118 multi-candidate model the default ordinary Auto Evolution path only after reporting, Human projection, indexing, terminal evidence, and legacy-read compatibility can represent it truthfully.

**Architecture:** Add a new multi-candidate report snapshot schema/read path instead of forcing Candidate Sessions into legacy round semantics. Build deterministic Human actions from the full Logical Session, group immutable report snapshots by Logical Session in the operational index, publish terminal forensic evidence only when the Logical Session is terminal, then switch the ordinary operator to the new START/RESUME Host. Keep legacy reports/manifests/Selection artifacts readable without migration or backfill.

**Tech Stack:** TypeScript, Node.js, existing Sidecar Run Report modules, existing Durable Evidence Capsule primitives, current HFL Inbox/index, current ordinary operator wrapper, custom executable TypeScript test files (`npm exec -- tsx ...`).

**Spec:** `docs/designs/auto-evolution-source-local-candidate-pool-v1.md` (Human accepted / written-spec review accepted, PD-118).

## Global Constraints

- Candidate product dispositions remain independent facts. Do not synthesize `overallRoute`, `dominantRoute`, route precedence, or “last candidate route = Session outcome”.
- Human projection may return multiple actions. Do not collapse simultaneous `RESUME_SESSION` + `REVIEW_HUMAN_FOLLOWUP` into one winner action.
- Report Producer remains deterministic observability only. No new LLM/Participant call, quality score, semantic merge, or routing authority.
- Historical `multi-round-run-manifest-v1/v2`, session summaries, operational reports v1..v6, Selection artifacts, and HFL items remain read-only compatible. Do not rewrite/backfill them.
- New default ordinary sessions must not call `selectFirstHypothesis` in their active path.
- Do not delete historical Selection replay code/tests merely because new ordinary sessions no longer use Selection.
- PAUSED Session recoverability is not terminal forensic completion.
- Only terminal Logical Sessions may publish the final immutable forensic capsule for the new model.
- Do not expand HFL trigger scope, PD-111 evidence scope, config/code execution authority, source-transition count, or semantic retry.
- Preserve current operator branch/binding/preflight behavior except where START/RESUME identity semantics explicitly change it.
- Use existing project test execution style: `npm exec -- tsx tests/evolution/<file>.test.ts`; current `package.json` has no Vitest or lint script.
- Run `git diff --check` before every commit.

## Current `dev` Facts This Plan Must Respect

- `buildOperationalRunReport.ts` and `archiveOperationalRunReport.ts` currently read legacy workflow roots plus `multi-round-*` Session summaries.
- `archiveOperationalRunReport.ts` currently supports report schemas through v6 and computes report identity using legacy multi-round durable semantics.
- `buildHumanReviewSummary.ts` currently projects one principal conclusion/recommended action from the last/effective workflow route.
- `buildOperationalObservabilityIndex.ts` currently treats each archived report as a top-level run entry and orders by `createdAt`.
- `runOrdinaryEvolution.ts` currently archives a report/evidence result after each invocation and prints `lastRoundTerminalRoute`/legacy Session outcome fields.
- `package.json` maps `evolution:operator:run` to `tsx scripts/evolution/operator/runOrdinaryEvolution.ts` and `npm test` to the existing real test gate `tsx tests/runRealTestGate.ts`.

---

### Task 1: Add Multi-candidate Report Snapshot Schema v7

**Files:**
- Modify: `scripts/evolution/reporting/buildOperationalObservabilityIndex.ts`
- Create: `scripts/evolution/reporting/buildMultiCandidateOperationalRunReport.ts`
- Create: `tests/evolution/multiCandidateOperationalRunReport.test.ts`
- Modify: `tests/evolution/operationalRunReport.test.ts`

**Interfaces:**

Add a new report schema without changing v1..v6 parsing:

```ts
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7 = 'operational-run-report-v7' as const;

export interface CandidateDispositionSummaryV1 {
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  processingState: CandidateProcessingState;
  effectiveRoute: string | null;
  effectiveReasonCode: string | null;
  effectiveDecisionRef: string | null;
  humanFollowupRef: string | null;
  supersededBySourceEpochRef: string | null;
  interruptionRef: string | null;
}

export interface OperationalRunReportV7 {
  schemaVersion: 'operational-run-report-v7';
  reportId: string;
  createdAt: string;
  logicalSessionId: string;
  hostSliceId: string;
  sessionStateAtSnapshot: LogicalSessionState;
  sessionExecution: MultiCandidateSessionSummaryV1;
  candidates: CandidateDispositionSummaryV1[];
  recoverableSessionStateRef: string;
  terminalForensicEvidenceRef: string | null;
}
```

The exact field names may follow existing report naming conventions, but the semantic requirements above are mandatory.

- [ ] **Step 1: Write failing v7 parse/validation tests**

Require:

```text
logicalSessionId required
hostSliceId required
sessionStateAtSnapshot required
all candidate records preserve original candidateRef/hypothesisId/sourceIndex
no overallRoute/dominantRoute/lastRoundTerminalRoute in v7
PAUSED report permits terminalForensicEvidenceRef = null
legacy v1..v6 fixtures still parse unchanged
```

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateOperationalRunReport.test.ts
```

- [ ] **Step 3: Implement v7 parser/serializer types**

Extend the report union in `buildOperationalObservabilityIndex.ts`. Do not change existing schema constants or legacy object parsing.

- [ ] **Step 4: Implement deterministic v7 report construction from durable Session state**

`buildMultiCandidateOperationalRunReport.ts` must consume the canonical durable `MultiCandidateSessionManifestV1` + Candidate Pool records and strict Decision artifacts. It must not discover semantic state by prose/file names.

Disposition counts are derived observability facts only.

- [ ] **Step 5: Run report schema tests**

```bash
npm exec -- tsx tests/evolution/multiCandidateOperationalRunReport.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/reporting/buildOperationalObservabilityIndex.ts \
  scripts/evolution/reporting/buildMultiCandidateOperationalRunReport.ts \
  tests/evolution/multiCandidateOperationalRunReport.test.ts \
  tests/evolution/operationalRunReport.test.ts
git diff --check
git commit -m "feat: add AE multi-candidate report snapshot schema"
```

---

### Task 2: Archive One Immutable Report Snapshot per Host Slice

**Files:**
- Create: `scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts`
- Create: `tests/evolution/multiCandidateReportArchive.test.ts`
- Modify: `scripts/evolution/reporting/archiveOperationalRunReport.ts` only for shared helpers if needed; keep legacy CLI behavior intact.
- Test: `tests/evolution/multiRoundSessionObservability.test.ts`

**Interfaces:**

```ts
export interface ArchiveMultiCandidateSessionReportInput {
  repositoryRoot: string;
  logicalSessionId: string;
  hostSliceId: string;
  terminalForensicEvidenceRef?: string | null;
}

export interface ArchiveMultiCandidateSessionReportResult {
  reportId: string;
  reportDirectory: string;
  reportJsonPath: string;
  reportMarkdownPath: string;
  logicalSessionId: string;
  hostSliceId: string;
  createdAt: string;
}
```

Report identity must include stable session semantics **and** hostSliceId, so slice #1 and slice #2 of one Logical Session produce distinct immutable snapshots.

- [ ] **Step 1: Write failing immutable-snapshot tests**

Create one Logical Session with two durable Host slices. Archive after each and require:

```text
reportId(slice1) != reportId(slice2)
logicalSessionId is identical
hostSliceId differs
slice1 report bytes remain unchanged after slice2 archive
re-archiving the exact same slice semantics is idempotent/reuses the same report identity according to existing archive conventions
```

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateReportArchive.test.ts
```

- [ ] **Step 3: Implement archive logic using existing run-reports conventions**

Reuse current safe-path/create-only/report index roots. Do not place mutable Session state inside immutable report directories.

- [ ] **Step 4: Render v7 Markdown without route aggregation**

The report header should show:

```text
Logical Session
Host Slice
Session lifecycle state / pause/failure reason
Current Source Epoch
candidate total/completed/pending/superseded/interrupted counts
disposition counts
source transition count
recoverable session-state ref
terminal forensic evidence status/ref
```

Then list candidate facts by sourceIndex. Do not print an “overall terminal route”.

- [ ] **Step 5: Run archive + legacy observability tests**

```bash
npm exec -- tsx tests/evolution/multiCandidateReportArchive.test.ts
npm exec -- tsx tests/evolution/multiRoundSessionObservability.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts \
  scripts/evolution/reporting/archiveOperationalRunReport.ts \
  tests/evolution/multiCandidateReportArchive.test.ts
git diff --check
git commit -m "feat: archive AE logical session report snapshots"
```

---

### Task 3: Add Multi-action Human Review Projection

**Files:**
- Modify: `scripts/evolution/reporting/buildHumanReviewSummary.ts`
- Create: `tests/evolution/multiCandidateHumanReviewSummary.test.ts`
- Test: `tests/evolution/humanReviewSummary.test.ts`
- Test: `tests/evolution/observabilitySemanticIsolation.test.ts`

**Interfaces:**

Keep legacy projection output for v1..v6 reports. Add a v7 projection with actions:

```ts
export type MultiCandidateHumanActionKind =
  | 'RESUME_SESSION'
  | 'REVIEW_HUMAN_FOLLOWUP'
  | 'INVESTIGATE_HOST_FAILURE'
  | 'AWAIT_EXECUTION_AUTHORITY'
  | 'OPTIONAL_DECISION_AUDIT';

export interface MultiCandidateHumanActionV1 {
  kind: MultiCandidateHumanActionKind;
  requirement: 'REQUIRED' | 'OPTIONAL' | 'AVAILABLE';
  blocksResume: boolean;
  candidateRef: string | null;
  humanFollowupRef: string | null;
  reason: string;
}

export interface MultiCandidateHumanReviewSummaryV1 {
  logicalSessionId: string;
  sessionState: LogicalSessionState;
  explanation: string[];
  actions: MultiCandidateHumanActionV1[];
}
```

- [ ] **Step 1: Write failing mixed-disposition tests**

Fixture:

```text
H1 SKIP
H2 DEFER
H3 ESCALATE_HUMAN -> HFL item
H4 PENDING
Session PAUSED/HOST_SLICE_BUDGET
```

Require actions contain both:

```text
RESUME_SESSION, blocksResume=false
REVIEW_HUMAN_FOLLOWUP for H3, blocksResume=false
```

There must be no route-precedence winner and no single “recommended action” replacing the set.

- [ ] **Step 2: Add failure/authority-boundary tests**

Require:

```text
Session FAILED -> INVESTIGATE_HOST_FAILURE, blocksResume=true
Source-change limit pause -> action explains new authority is required; no automatic second execution
COMPLETED with only SKIP/DEFER -> no fake resume action
```

- [ ] **Step 3: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateHumanReviewSummary.test.ts
```

- [ ] **Step 4: Implement deterministic action projection**

Actions may be ordered operationally (blocking recovery first, required Human work, resumable work, optional audit), but that ordering must not be represented as candidate importance.

Do not alter HFL state; only read current retained disposition when rendering HFL actions, preserving the current “historical report vs current HFL operational state” rule.

- [ ] **Step 5: Run new and legacy Human-view tests**

```bash
npm exec -- tsx tests/evolution/multiCandidateHumanReviewSummary.test.ts
npm exec -- tsx tests/evolution/humanReviewSummary.test.ts
npm exec -- tsx tests/evolution/observabilitySemanticIsolation.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/reporting/buildHumanReviewSummary.ts \
  tests/evolution/multiCandidateHumanReviewSummary.test.ts
git diff --check
git commit -m "feat: project multiple AE human next actions"
```

---

### Task 4: Group Report Snapshots by Logical Session in the Operational Index

**Files:**
- Modify: `scripts/evolution/reporting/buildOperationalObservabilityIndex.ts`
- Create: `tests/evolution/multiCandidateOperationalIndex.test.ts`
- Test: `tests/evolution/operationalRunReport.test.ts`
- Test: `tests/evolution/multiRoundSessionObservability.test.ts`

**Interfaces:**

Add explicit index counts:

```ts
logicalSessionCount: number;
reportSnapshotCount: number;
```

For v7, top-level entries group by `logicalSessionId` and expose the latest snapshot plus a list/count of older snapshots. For legacy reports without `logicalSessionId`, preserve existing one-report/one-entry behavior rather than inventing session identity.

- [ ] **Step 1: Write failing grouping tests**

Archive:

```text
Session A / slice 1
Session A / slice 2
Session B / slice 1
one legacy v6 report
```

Require:

```text
reportSnapshotCount = 4
logicalSessionCount reflects A + B plus the legacy entry according to documented compatibility semantics
Session A appears once at top level
Session A latest points to slice 2
Session A exposes two snapshots
legacy report still renders and remains navigable
```

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateOperationalIndex.test.ts
```

- [ ] **Step 3: Implement grouping only for v7**

Do not infer a logical session across historical v1..v6 reports from names, sourceRunRef, or timestamps.

- [ ] **Step 4: Update Markdown index rendering**

Default Human view should show one row/section per v7 Logical Session using its latest snapshot, with a nested/history link for prior snapshots. Keep legacy rows.

- [ ] **Step 5: Run index/report regressions**

```bash
npm exec -- tsx tests/evolution/multiCandidateOperationalIndex.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
npm exec -- tsx tests/evolution/multiRoundSessionObservability.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/reporting/buildOperationalObservabilityIndex.ts \
  tests/evolution/multiCandidateOperationalIndex.test.ts
git diff --check
git commit -m "feat: group AE report snapshots by logical session"
```

---

### Task 5: Add Terminal Forensic Evidence for Multi-candidate Sessions

**Files:**
- Create: `scripts/evolution/evidence/retainMultiCandidateSessionEvidence.ts`
- Create: `tests/evolution/multiCandidateTerminalEvidence.test.ts`
- Modify only if shared helpers are needed: `scripts/evolution/evidence/durableEvidenceCapsule.ts`
- Test: `tests/evolution/durableEvidenceCapsule.test.ts`
- Test: `tests/evolution/durableEvidenceForensicE2E.test.ts`
- Test: `tests/evolution/durableEvidencePackaging.test.ts`

**Interfaces:**

```ts
export interface RetainMultiCandidateSessionEvidenceInput {
  repositoryRoot: string;
  logicalSessionId: string;
  createdAt: string;
}
```

Use the existing immutable Durable Evidence Capsule integrity primitive where possible. The terminal capsule may omit legacy round-shaped participant receipts if they cannot represent candidates truthfully; do not lie by mapping candidate lanes to fake rounds.

- [ ] **Step 1: Write failing terminal-vs-paused tests**

Require:

```text
PAUSED logical session -> terminal evidence retention refuses / returns not applicable
COMPLETED logical session -> immutable terminal capsule can be published
FAILED/INTERRUPTED terminal session -> capsule can retain failure evidence if state is closed enough for forensic publication
capsule includes canonical session manifest, all source-epoch anchor manifests, source analysis, candidate activation/provenance, decisions, continuation evidence, execution/source-transition evidence where present
```

The test must also prove a paused Session report can point to recoverable session state while `terminalForensicEvidenceRef` remains null.

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateTerminalEvidence.test.ts
```

- [ ] **Step 3: Implement terminal evidence collection from durable session state**

Do not collect from transient `.tmp` as the only source. All selected evidence objects must already have durable hashes/provenance from Plan B.

Use `HUMAN_FORENSIC_ONLY` for raw/internal evidence that PD-111 forbids to Solution/Reviewer. Participant-visible evidence visibility remains bounded to what was actually delivered.

- [ ] **Step 4: Keep existing evidence capsule schema/tests working**

Do not change historical capsule bytes or retroactively require candidate fields from old capsules.

- [ ] **Step 5: Run evidence regressions**

```bash
npm exec -- tsx tests/evolution/multiCandidateTerminalEvidence.test.ts
npm exec -- tsx tests/evolution/durableEvidenceCapsule.test.ts
npm exec -- tsx tests/evolution/durableEvidenceForensicE2E.test.ts
npm exec -- tsx tests/evolution/durableEvidencePackaging.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add scripts/evolution/evidence/retainMultiCandidateSessionEvidence.ts \
  scripts/evolution/evidence/durableEvidenceCapsule.ts \
  tests/evolution/multiCandidateTerminalEvidence.test.ts
git diff --check
git commit -m "feat: retain terminal AE candidate session evidence"
```

---

### Task 6: Integrate Report Snapshot + Evidence into the New Multi-candidate Operator

**Files:**
- Modify: `scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts`
- Modify: `tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts`
- Modify: `scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts`
- Test: `tests/evolution/multiCandidateReportArchive.test.ts`

**Interfaces:**

Each Host invocation must end with:

```text
canonical Session manifest already persisted
if Session terminal: attempt terminal forensic evidence publication
archive immutable v7 report snapshot for this hostSliceId
refresh HFL inbox
rebuild operational index
return operator result
```

A paused Session is a successful Host invocation result with `sessionState='PAUSED'`, not a fake error.

- [ ] **Step 1: Extend operator tests for snapshot/evidence timing**

Prove:

```text
PAUSED slice -> report archived, recoverable session ref present, no terminal forensic capsule
COMPLETED slice -> terminal forensic capsule published before report so report can reference it
report/archive failure does not rewrite Candidate/Session semantic state
HFL inbox refresh occurs after candidate HFL retention
```

Follow existing operator failure-reporting conventions; do not invent a semantic route for an observability failure.

- [ ] **Step 2: Run red**

```bash
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
```

- [ ] **Step 3: Implement the integration**

Keep deterministic session state independent from sidecar report success. Main workflow must not depend on Report Producer to decide routes/candidates.

- [ ] **Step 4: Run focused operator/report tests**

```bash
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/multiCandidateReportArchive.test.ts
npm exec -- tsx tests/evolution/multiCandidateTerminalEvidence.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts \
  scripts/evolution/reporting/archiveMultiCandidateSessionReport.ts \
  tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
git diff --check
git commit -m "feat: archive AE candidate session slice observability"
```

---

### Task 7: Switch the Default Ordinary Operator to PD-118 START/RESUME Semantics

**Files:**
- Modify: `scripts/evolution/operator/runOrdinaryEvolution.ts`
- Modify: `tests/evolution/ordinaryEvolutionOperator.test.ts`
- Modify: `package.json` only if a new explicit convenience script is useful; keep `evolution:operator:run` as the canonical entry.
- Test: `tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts`
- Test: `tests/evolution/realRunObserveBatchPreflight.test.ts`

**CLI contract:**

Default invocation remains a new Session:

```bash
npm run evolution:operator:run
```

Resume requires exact identity:

```bash
npm run evolution:operator:run -- --resume-session <logicalSessionId>
```

Optional existing `--repository-root` and `--binding` flags remain supported. Do not add `--resume-latest`.

- [ ] **Step 1: Rewrite the ordinary operator tests first**

Require default operator behavior:

```text
no --resume-session -> START_NEW_SESSION -> allocate logicalSessionId -> Phase0 once -> new multi-candidate Host
--resume-session exact ID -> RESUME_SESSION -> no new logicalSessionId -> no Phase0 just to resume unchanged Source Epoch
wrong/missing session -> fail closed
output prints Logical Session + Host Slice + lifecycle + pending count/actions, not lastRoundTerminalRoute
```

Keep preflight branch/binding/error coverage from the current test.

- [ ] **Step 2: Run red before switching implementation**

```bash
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
```

- [ ] **Step 3: Make `runOrdinaryEvolution()` delegate to the multi-candidate operator**

Retire the current ordinary active call to `runMultiRoundExecutionValidation()` from the default path. Preserve the legacy function/module for historical tests or explicit legacy fixtures; do not make it the active new-session path.

Bump the operator result schema for the new Session semantics. New output must expose:

```text
logicalSessionId
hostSliceId
sessionState
pauseOrStopReason
currentSourceEpochRef
candidate counts
sourceTransitionCount
report snapshot ref
recoverable session state ref
terminal forensic evidence ref/status
```

Do not expose `lastRoundTerminalRoute` as a new-session conclusion.

- [ ] **Step 4: Keep CLI parse failures fail closed**

Reject:

```text
--resume-session without value
unknown mode-like flags
conflicting repeated session IDs
binding mismatch on resume
```

- [ ] **Step 5: Run operator/preflight tests**

```bash
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/realRunObserveBatchPreflight.test.ts
```

- [ ] **Step 6: Commit default activation**

```bash
git add scripts/evolution/operator/runOrdinaryEvolution.ts \
  tests/evolution/ordinaryEvolutionOperator.test.ts \
  package.json
git diff --check
git commit -m "feat: activate AE multi-candidate ordinary sessions"
```

If `package.json` does not need a change, do not touch it.

---

### Task 8: Prove the New Active Path No Longer Uses Winner Selection

**Files:**
- Modify: `tests/evolution/freshProblemTransferSelection.test.ts` only to label legacy behavior clearly if needed.
- Create: `tests/evolution/candidateSelectionRetirement.test.ts`
- Modify: `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts` only if residual active imports/calls remain.
- Keep: `scripts/evolution/freshProblemTransfer/selectFirstHypothesis.ts`
- Keep historical replay tests unchanged unless import paths were mechanically moved.

- [ ] **Step 1: Write a failing active-path retirement test**

Use a Hypothesis Set with at least three entries and run the default/new ordinary Host with dependency injection. Prove all applicable candidates are observed in source order unless a real barrier occurs.

Static/source-level assertion may additionally inspect the new default Host/operator module dependency graph or source text to ensure it does not import/call `selectFirstHypothesis`.

- [ ] **Step 2: Run red if any new active path still depends on Selection**

```bash
npm exec -- tsx tests/evolution/candidateSelectionRetirement.test.ts
```

- [ ] **Step 3: Remove only residual new-path Selection dependency**

Do not delete `selectFirstHypothesis.ts`, historical Selection artifacts, or replay experiments. They are legacy/history, not the active ordinary path.

- [ ] **Step 4: Run both new and legacy Selection tests**

```bash
npm exec -- tsx tests/evolution/candidateSelectionRetirement.test.ts
npm exec -- tsx tests/evolution/freshProblemTransferSelection.test.ts
npm exec -- tsx tests/evolution/selectionPriorityReplay.test.ts
npm exec -- tsx tests/evolution/conservativeSelectionReplayContract.test.ts
```

Expected: new active-path retirement PASS; historical Selection behavior/replay contracts remain readable/testable.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts \
  tests/evolution/candidateSelectionRetirement.test.ts \
  tests/evolution/freshProblemTransferSelection.test.ts
git diff --check
git commit -m "test: prove AE winner selection is off the active path"
```

---

### Task 9: Add End-to-end Deterministic Acceptance Scenarios

**Files:**
- Create: `tests/evolution/multiCandidateSessionAcceptance.test.ts`
- Modify: `tests/runRealTestGate.ts` only if the repository convention requires registering the new deterministic suite in the existing real gate; first inspect current imports/runners and add only if analogous AE closure tests are already registered there.

- [ ] **Step 1: Implement the complete acceptance matrix with dependency-injected Participants**

Cover at minimum:

```text
0 hypotheses -> noProblemAssessment, no synthetic candidate
H1 SKIP -> H2 processed
H1 DEFER -> H2 processed
H1 ESCALATE -> one HFL + H2 processed
H1 continuation -> H2 still gets its own continuation
H2 keeps original hypothesis-000002 identity
H2 diagnostic scope excludes H1/H3 evidence
slice budget pauses before next candidate, leaving it PENDING
resume exact session without re-running Source A Feedback/Hypothesis
baseline mismatch fails before Participant call
valid-terminal crash reconciles without Participant call
incomplete-terminal crash interrupts without semantic retry
READY blocks later current-source candidates
successful Source B supersedes only old PENDING candidates
execution/verification/rerun failure does not supersede
Source B second READY pauses at source-change limit
two candidates ESCALATE -> two distinct HFL items
mixed SKIP+DEFER+ESCALATE -> no overall route in report
PAUSED + HFL -> RESUME + REVIEW actions coexist
multiple slices -> one Logical Session with multiple report snapshots in index
```

- [ ] **Step 2: Run the acceptance suite**

```bash
npm exec -- tsx tests/evolution/multiCandidateSessionAcceptance.test.ts
```

Expected: PASS.

- [ ] **Step 3: If required by existing test-gate conventions, register the deterministic suite**

Do not make the gate perform live external Participant calls or manufacture a natural READY run. The gate must remain deterministic.

- [ ] **Step 4: Run the affected existing AE suites**

```bash
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npm exec -- tsx tests/evolution/reviewContinuation.test.ts
npm exec -- tsx tests/evolution/multiRoundExecutionValidation.test.ts
npm exec -- tsx tests/evolution/humanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/humanReviewSummary.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
npm exec -- tsx tests/evolution/multiRoundSessionObservability.test.ts
npm exec -- tsx tests/evolution/observabilitySemanticIsolation.test.ts
npm exec -- tsx tests/evolution/ordinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/packageProjectCapsule.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add tests/evolution/multiCandidateSessionAcceptance.test.ts tests/runRealTestGate.ts
git diff --check
git commit -m "test: cover AE multi-candidate session acceptance"
```

If `tests/runRealTestGate.ts` did not require modification, do not stage it.

---

### Task 10: Final Legacy Compatibility and Semantic-isolation Audit

**Files:**
- Modify only if a real failure is found: legacy parsers/report readers named in previous tasks.
- Test: existing legacy tests only.

- [ ] **Step 1: Run legacy manifest/report/Selection compatibility**

```bash
npm exec -- tsx tests/evolution/multiRoundRunManifestContract.test.ts
npm exec -- tsx tests/evolution/multiRoundSessionObservability.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
npm exec -- tsx tests/evolution/freshProblemTransferSelection.test.ts
npm exec -- tsx tests/evolution/selectionPriorityReplay.test.ts
```

- [ ] **Step 2: Run evidence/HFL compatibility**

```bash
npm exec -- tsx tests/evolution/durableEvidenceCapsule.test.ts
npm exec -- tsx tests/evolution/durableEvidenceForensicE2E.test.ts
npm exec -- tsx tests/evolution/durableEvidencePackaging.test.ts
npm exec -- tsx tests/evolution/humanFollowupWorkItemContract.test.ts
npm exec -- tsx tests/evolution/humanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/humanFollowupInbox.test.ts
```

- [ ] **Step 3: Run PD-111 / communication boundary regressions**

```bash
npm exec -- tsx tests/evolution/boundedCausalAttribution.test.ts
npm exec -- tsx tests/evolution/structuredTerminalEnvelope.test.ts
npm exec -- tsx tests/evolution/envelopeRetransmission.test.ts
npm exec -- tsx tests/evolution/observabilitySemanticIsolation.test.ts
```

- [ ] **Step 4: Audit for semantic leakage**

Search changed/new code and confirm none of these became orchestration inputs:

```text
problem-domain labels
candidate natural-language similarity
priority score
HFL disposition as Pool scheduling priority
report action order as Candidate priority
legacy Selection winner result
```

Also confirm no new Participant-visible artifact contains raw Phase0 internal source, candidate pool internals, weights/probabilities, full trace, or unrelated candidate producer identities.

- [ ] **Step 5: Commit only if actual compatibility fixes were required**

Use a narrowly scoped commit message describing the concrete compatibility fix. Do not create a no-op commit.

---

### Task 11: Full Repository Verification and Governance Closure

**Files:**
- Modify: `docs/governance/current-product-stage.md`
- Modify: `docs/product/auto-evolution-model.md` only if implementation uncovered a wording mismatch with already-accepted PD-118 semantics; do not change product meaning.
- Modify: `docs/governance/product-decisions.md` only for implementation-status metadata if the ledger convention actually records it; do not rewrite PD-118 semantics.

- [ ] **Step 1: Re-read the accepted spec and create a line-by-line implementation checklist**

Verify each of these with concrete code/test evidence:

```text
all candidates preserved
original ID preserved
no winner Selection on default path
candidate terminal != pool terminal
candidate-local continuation
11 jobs per Host slice
pause only at candidate boundary
explicit exact resume
baseline/source/hypothesis/binding validation
crash reconciliation without semantic retry
READY source barrier
supersede only after valid Source B
one source transition max
HFL only from effective ESCALATE
Session has no product route
multiple report snapshots per Logical Session
actions[] Human projection
index groups v7 snapshots by logicalSessionId
paused != terminal forensic complete
legacy artifacts readable
```

- [ ] **Step 2: Run all new PD-118 suites**

```bash
npm exec -- tsx tests/evolution/candidatePoolContract.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionManifestContract.test.ts
npm exec -- tsx tests/evolution/sourceCandidateAnalysis.test.ts
npm exec -- tsx tests/evolution/candidateLane.test.ts
npm exec -- tsx tests/evolution/sourceCandidatePool.test.ts
npm exec -- tsx tests/evolution/candidateSessionStore.test.ts
npm exec -- tsx tests/evolution/candidateSliceBudget.test.ts
npm exec -- tsx tests/evolution/candidateReviewContinuation.test.ts
npm exec -- tsx tests/evolution/candidateHumanFollowupRetention.test.ts
npm exec -- tsx tests/evolution/boundedSourceTransition.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm exec -- tsx tests/evolution/candidateSessionReconciliation.test.ts
npm exec -- tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
npm exec -- tsx tests/evolution/multiCandidateOperationalRunReport.test.ts
npm exec -- tsx tests/evolution/multiCandidateReportArchive.test.ts
npm exec -- tsx tests/evolution/multiCandidateHumanReviewSummary.test.ts
npm exec -- tsx tests/evolution/multiCandidateOperationalIndex.test.ts
npm exec -- tsx tests/evolution/multiCandidateTerminalEvidence.test.ts
npm exec -- tsx tests/evolution/candidateSelectionRetirement.test.ts
npm exec -- tsx tests/evolution/multiCandidateSessionAcceptance.test.ts
```

- [ ] **Step 3: Run repository static/contract/build gates that exist on current `dev`**

```bash
npm run typecheck
npm run test:contracts
npm run build
git diff --check
```

All must exit 0 before claiming engineering closure.

- [ ] **Step 4: Run the existing project real test gate**

```bash
npm test
```

This is `tsx tests/runRealTestGate.ts` on current `dev`. Do not manufacture a natural AE `READY_FOR_CONFIG_EXECUTION` run just to make the feature look exercised. If the gate fails for an unrelated pre-existing issue, preserve the exact output and classify it instead of weakening the gate or broadening PD-118 scope.

- [ ] **Step 5: Inspect the final diff for scope**

```bash
git status --short
git diff --check
git diff --stat
```

Confirm no gameplay/content files, unrelated product schemas, model routing, semantic ranking, second source mutation, or generic queue framework were introduced.

- [ ] **Step 6: Update current stage only from verified evidence**

If and only if Steps 1–5 support it, record:

```text
PD-118 SOURCE-LOCAL CANDIDATE POOL / MULTI-CANDIDATE SESSION V1:
ENGINEERING DELIVERED / DEFAULT ORDINARY PATH ACTIVE / DETERMINISTIC ACCEPTANCE VERIFIED.
Natural long-run effectiveness remains RUN / OBSERVE evidence, not an implementation-closure claim.
```

Keep the distinction between deterministic engineering verification and later natural-run product evidence.

- [ ] **Step 7: Commit governance status**

```bash
git add docs/governance/current-product-stage.md docs/product/auto-evolution-model.md docs/governance/product-decisions.md
git diff --check
git commit -m "docs: record AE candidate pool v1 engineering status"
```

Stage only files actually changed.

**Plan C exit criterion:** The default ordinary Auto Evolution operator uses the PD-118 Source-local Candidate Pool model; exact resume, candidate-local continuation, one source-change barrier, immutable per-slice report snapshots, multi-action Human projection, Logical Session index grouping, terminal forensic evidence, and legacy read compatibility are all verified. No claim is made that long-run natural effectiveness is already established.
