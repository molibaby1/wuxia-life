# Standing Semantic Authorization Runtime Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove per-attempt Human SHA approval gates from the Bounded Formal Event path while preserving exact machine provenance, fresh binding/repository/evidence checks, replay protection, bounded Participant behavior, and fail-closed shadow execution; then run one continuous model-backed bounded trial that stops at Human promotion review.

**Architecture:** Keep the existing two machine evidence boundaries, but reinterpret them as Host-owned manifests rather than Human approval tokens. A preflight manifest freezes Requirement/Contract/evidence/binding/prompt/job-budget before Proposal/Reviewer execution; an execution manifest binds the accepted Proposal, independent Review, Admission, and shadow scope before deterministic materialization. Add one family-specific orchestration entry point so the first real trial can run continuously without a Human round-trip, while the existing preparation, admission, executor, and verifier remain independently runnable.

**Tech Stack:** TypeScript, Node.js `fs/promises`, existing `runStructuredParticipantExecution`, Reference Participant binding locks, existing Formal Event v2 proposal/review/admission/result contracts, `tsx` focused tests.

**Spec:** `docs/superpowers/specs/2026-10-07-standing-semantic-authorization-host-enforced-freshness-v1-design.md`

## Global Constraints

- Base implementation on current `dev`; before editing, fast-forward safely if `origin/dev` advanced and do not discard local work.
- PD-125 supersedes per-attempt Human approval of bare SHA/digest for bounded shadow-only workloads; SHA/digests remain mandatory machine provenance.
- Preserve PD-122 fresh exact binding resolution, role-specific binding locks, no silent rebind, PD-099 v2 watchdog, and at most one same-thread structural correction where already permitted.
- Preserve `bounded-formal-event-authoring-v1@1`: one Formal Event, current effect/write envelope only, no Person/Relationship/Runtime/Schema/scheduler/generic Story/Task expansion.
- Keep Proposal and Reviewer independent invocations/workspaces/identities; Reviewer must consume the exact validated Proposal from the same attempt.
- No full Auto Evolution discovery in the first model-backed trial.
- No authoritative Event catalog mutation during shadow execution; `src/data/lines/p22-content-expansions.json` may change only inside the isolated shadow workspace.
- No generic authorization registry/DSL/framework and no generic trial runner.
- Historical preschool #13–#19 artifacts, consumed SHA records, authority source bytes, and proof semantics must not be rewritten.
- Human promotion remains required for the actual verified patch; no autonomous commit/push/merge of authored Event content.

## Review Focus

- A preflight manifest whose repo/evidence/binding/prompt identity drifts before a Participant job must fail before that job starts.
- Repo/evidence/binding drift between Proposal and Reviewer must prevent Reviewer execution rather than silently recapturing/rebinding inside the active attempt.
- Reusing the same preflight manifest role invocation must remain fail-closed so one attempt cannot silently duplicate Proposal/Reviewer jobs.
- Invalid/non-conforming Review or non-ELIGIBLE Admission must prevent any shadow materialization.
- Missing, tampered, or stale execution manifest must fail before the shadow workspace is mutated; no fallback to a Human SHA approval path is allowed.

---

## File Structure

Keep the existing family-specific files; do not create a generic authorization subsystem.

- `scripts/evolution/autonomousAuthoring/boundedFormalEventParticipantGenerationAuthorization.ts`
  - Reinterpret Gate A as the Host preflight manifest.
  - Own manifest build, canonical digest, freshness validation, and per-role replay/consumption markers.
  - Remove Human approval fields/state.
- `scripts/evolution/autonomousAuthoring/runBoundedFormalEventProposalParticipant.ts`
  - Consume a Host preflight-manifest reference, not Human authorization.
- `scripts/evolution/autonomousAuthoring/runBoundedFormalEventReviewParticipant.ts`
  - Consume the same preflight manifest plus the exact Proposal Participant result.
- `scripts/evolution/autonomousAuthoring/prepareBoundedFormalEventTrial.ts`
  - Build the preflight manifest automatically, run Proposal then Reviewer, evaluate Admission, and build the execution manifest.
- `scripts/evolution/autonomousAuthoring/boundedFormalEventTrialAuthorization.ts`
  - Reinterpret Gate B as the Host execution manifest.
  - Bind Proposal/Review/Admission plus exact preparation provenance; remove Human approval state.
- `scripts/evolution/autonomousAuthoring/runBoundedFormalEventShadowTrial.ts`
  - Require and validate the Host execution manifest; remove Human authorization parameters and `EXECUTION_AUTHORIZATION_REQUIRED` behavior.
- `src/evolution/boundedFormalEventShadowResultContract.ts`
  - Replace Human-authorization provenance with execution-manifest provenance.
- `scripts/evolution/autonomousAuthoring/runBoundedFormalEventModelBackedTrial.ts`
  - New family-specific orchestration only; chain preparation → eligible execution manifest → shadow trial with no Human digest gate.
- `tests/evolution/boundedFormalEventAuthoring.test.ts`
  - Rewrite Gate A/Gate B tests around machine manifests and add continuous fake-participant orchestration coverage.

---

### Task 1: Convert Gate A into a Host preflight manifest

**Files:**
- Modify: `scripts/evolution/autonomousAuthoring/boundedFormalEventParticipantGenerationAuthorization.ts:29-520`
- Test: `tests/evolution/boundedFormalEventAuthoring.test.ts:267-~620`

**Interfaces:**
- Produces:
  - `BoundedFormalEventParticipantGenerationManifestV1`
  - `BuildBoundedFormalEventParticipantGenerationManifestResult`
  - `buildBoundedFormalEventParticipantGenerationManifest(...)`
  - `validateFreshBoundedFormalEventParticipantGenerationManifest(...)`
  - `consumeBoundedFormalEventParticipantGenerationManifest(...)`
  - a machine reference shape containing `manifestPath` + `manifestSha256`
- Removes:
  - `BoundedFormalEventGenerationAuthorizationApprovalV1`
  - `approvalState: 'AWAITING_HUMAN_EXACT_SHA256_APPROVAL'`
  - `humanApprovedSha256`
  - `humanAuthorizationRef`

- [ ] **Step 1: Rewrite the Gate A focused test first**

Rename `testParticipantGenerationAuthorizationGateA` to a manifest-oriented test such as `testParticipantGenerationPreflightManifest`.

Assert:
- manifest creation starts 0 Participant jobs;
- canonical manifest digest reproduces exactly;
- manifest contains the same fixed Requirement, Contract, role identities, binding-lock digests, prompt digests, and budget `allowedParticipantJobs=4 / proposalMaximumJobs=2 / reviewerMaximumJobs=2`;
- there is no `approvalState`, Human authorization ref, or Human-approved SHA field;
- repo/evidence/Requirement/Contract/binding/prompt drift fails before a Participant job;
- the same manifest+role consumption cannot be replayed.

- [ ] **Step 2: Run the focused test and verify the old Human-approval assertions fail**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: FAIL because the implementation still exposes/needs Human Gate A approval fields.

- [ ] **Step 3: Implement the preflight-manifest API**

In `boundedFormalEventParticipantGenerationAuthorization.ts`:
- keep the existing generation input packet as the exact source snapshot;
- replace the authorization-candidate schema with a preflight-manifest schema (use a new explicit schema string; do not leave `authorization-candidate` or `AWAITING_HUMAN...` in the canonical object);
- build the manifest directly from current repository/evidence/role locks/prompt digests;
- validate current repo/evidence/binding/prompt against the captured manifest;
- for Reviewer validation, require the exact Proposal Participant output from the same manifest and Proposal invocation;
- preserve create-only per-role consumption/replay protection, keyed by manifest digest + role;
- consumption evidence records manifest digest, role, invocationRef, bindingLockSha256, and maximum Participant jobs; no Human ref.

Do not weaken any current freshness checks.

- [ ] **Step 4: Run the focused test**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: the new preflight-manifest tests PASS; later tasks may still fail on old Gate B expectations.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/autonomousAuthoring/boundedFormalEventParticipantGenerationAuthorization.ts tests/evolution/boundedFormalEventAuthoring.test.ts
git commit -m "refactor: make formal event preflight host-managed"
```

---

### Task 2: Remove Human authorization from Proposal/Reviewer and make preparation build preflight automatically

**Files:**
- Modify: `scripts/evolution/autonomousAuthoring/runBoundedFormalEventProposalParticipant.ts:30-~170`
- Modify: `scripts/evolution/autonomousAuthoring/runBoundedFormalEventReviewParticipant.ts:34-~190`
- Modify: `scripts/evolution/autonomousAuthoring/prepareBoundedFormalEventTrial.ts:28-197`
- Test: `tests/evolution/boundedFormalEventAuthoring.test.ts:1201-~1510`

**Interfaces:**
- Consumes Task 1 preflight-manifest APIs.
- Proposal input contains a machine preflight-manifest reference, not Human authorization.
- Proposal output records `generationManifestSha256` and `generationManifestConsumptionRef`; no Human authorization fields.
- Reviewer input contains the same preflight-manifest reference plus exact Proposal output.
- Reviewer output records the same machine manifest provenance.
- `PrepareBoundedFormalEventTrialInput` adds a `preflightManifestPath` and keeps the execution-manifest destination path; it no longer accepts `generationAuthorization`.
- `prepareBoundedFormalEventTrial()` builds the preflight manifest before the first model job.

- [ ] **Step 1: Update adapter/preparation tests before code**

Replace tests that assert “missing/wrong Human Gate A SHA → 0 jobs” with:
- invalid/tampered/stale preflight manifest → 0 Proposal jobs;
- Proposal role replay → no second Proposal job;
- Proposal failure → Reviewer jobs remain 0;
- repo/evidence/binding drift after Proposal but before Reviewer → Reviewer jobs remain 0;
- valid manifest + valid Proposal → exactly one independent Reviewer invocation boundary;
- Proposal and Reviewer identities/workspaces remain distinct.

Update fake Participant preparation so it calls `prepareBoundedFormalEventTrial()` without constructing fake Human approval data.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: FAIL because adapters/preparation still require `generationAuthorization`.

- [ ] **Step 3: Update Proposal Participant**

Change `BoundedFormalEventProposalParticipantInput` to consume the Task 1 manifest reference.

Before `runStructuredParticipantExecution`:
1. validate manifest freshness for the Proposal role;
2. fresh-resolve the locked binding;
3. consume the Proposal role marker;
4. then execute.

Return machine manifest provenance only.

- [ ] **Step 4: Update Reviewer Participant**

Use the same preflight manifest reference.

Before Reviewer execution:
1. validate Proposal is successful and schema-valid;
2. validate the same active manifest for Reviewer role;
3. verify Proposal provenance belongs to that same manifest/Proposal invocation;
4. fresh-resolve reviewer binding;
5. consume Reviewer role marker;
6. execute independent review.

No fallback path may recapture a new manifest mid-attempt.

- [ ] **Step 5: Update preparation orchestration**

At the start of `prepareBoundedFormalEventTrial()`:
- capture repo/evidence once;
- build the Host preflight manifest at `input.preflightManifestPath`;
- pass its machine reference automatically to Proposal then Reviewer;
- preserve the existing snapshot check between evidence capture and execution;
- if Proposal fails, return `PREPARATION_FAILED`;
- if Review/Admission is not eligible, return `NOT_ELIGIBLE`;
- only ELIGIBLE preparation proceeds to Task 3 execution-manifest creation.

- [ ] **Step 6: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: Proposal/Reviewer/preparation manifest tests PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/evolution/autonomousAuthoring/runBoundedFormalEventProposalParticipant.ts         scripts/evolution/autonomousAuthoring/runBoundedFormalEventReviewParticipant.ts         scripts/evolution/autonomousAuthoring/prepareBoundedFormalEventTrial.ts         tests/evolution/boundedFormalEventAuthoring.test.ts
git commit -m "refactor: run formal event participants under host preflight"
```

---

### Task 3: Convert Gate B into an execution manifest and remove Human authorization from shadow results

**Files:**
- Modify: `scripts/evolution/autonomousAuthoring/boundedFormalEventTrialAuthorization.ts:35-631`
- Modify: `scripts/evolution/autonomousAuthoring/runBoundedFormalEventShadowTrial.ts:21-~230`
- Modify: `src/evolution/boundedFormalEventShadowResultContract.ts:7-126`
- Modify: `tests/evolution/boundedFormalEventAuthoring.test.ts:782-~900, 1407-~1600`

**Interfaces:**
- Produces:
  - `BoundedFormalEventTrialExecutionManifestV1`
  - `buildBoundedFormalEventTrialExecutionManifest(...)`
  - `validateFreshBoundedFormalEventTrialExecutionManifest(...)`
- Preparation packet still binds exact Proposal/Review/Admission and Participant provenance, but Participant provenance now names the Task 1 generation manifest rather than Human authorization.
- Shadow trial input requires `executionManifestPath` + `executionManifestSha256`; these are passed automatically by the caller, not approved by Human.
- Shadow result v2 replaces `humanAuthorizationRef/humanAuthorizationSha256` with `executionManifestRef/executionManifestSha256`.
- Remove `EXECUTION_AUTHORIZATION_REQUIRED` from the normal Formal Event shadow terminal contract.

- [ ] **Step 1: Rewrite Gate B/shadow tests first**

Replace `testShadowTrialRequiresSeparateHumanAuthorization` with a machine-manifest test.

Assert:
- missing execution manifest is rejected before workspace mutation;
- digest mismatch/tampered bytes fail before workspace mutation;
- repo/evidence/binding/proposal/review/admission drift fails before workspace mutation;
- valid execution manifest permits deterministic shadow materialization;
- result provenance contains execution manifest ref/digest and no Human authorization fields;
- invalid/non-ELIGIBLE Admission cannot reach executor.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: FAIL on obsolete Human Gate B/result fields.

- [ ] **Step 3: Refactor Gate B artifact into execution manifest**

In `boundedFormalEventTrialAuthorization.ts`:
- remove `approvalState`;
- rename authorization-candidate terminology in exported runtime types/functions to execution-manifest terminology;
- keep canonical preparation packet, repo/evidence freshness, binding-lock verification, exact Proposal/Review comparison, exact ELIGIBLE Admission comparison, write scope and `allowedParticipantJobs: 0`;
- remove Human authorization semantics from Participant provenance;
- preserve canonical bytes/digest and artifact path restrictions.

Do not create a compatibility Human-approval branch: Formal Event has no real model-backed historical trial that needs it.

- [ ] **Step 4: Update shadow result contract**

In `boundedFormalEventShadowResultContract.ts`:
- remove `EXECUTION_AUTHORIZATION_REQUIRED`;
- replace Human authorization provenance with execution-manifest provenance;
- require execution-manifest ref/digest for `SHADOW_AUTHORING_VERIFIED`;
- preserve unchanged authoritative fingerprints and exact write-surface requirements.

Keep `shadow-authoring-result-v2` unless implementation discovers a real persisted Formal Event v2 result that requires compatibility; if such an artifact exists, STOP and report rather than silently changing history.

- [ ] **Step 5: Update shadow trial runner**

`runBoundedFormalEventShadowTrial()` must:
- require machine execution-manifest path+digest as invocation input;
- validate manifest freshness before `evaluateBoundedFormalEventAdmission`/workspace execution;
- remove the “no authorization supplied → EXECUTION_AUTHORIZATION_REQUIRED” branch;
- remove `humanAuthorizationRef` and expected Human SHA parameters;
- preserve isolated workspace/artifact-root checks and authoritative fingerprint checks;
- pass execution-manifest provenance into the final shadow result.

- [ ] **Step 6: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: Gate B/execution-manifest and shadow-result tests PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/evolution/autonomousAuthoring/boundedFormalEventTrialAuthorization.ts         scripts/evolution/autonomousAuthoring/runBoundedFormalEventShadowTrial.ts         src/evolution/boundedFormalEventShadowResultContract.ts         tests/evolution/boundedFormalEventAuthoring.test.ts
git commit -m "refactor: make formal event shadow execution host-authorized"
```

---

### Task 4: Add one continuous family-specific model-backed trial runner

**Files:**
- Create: `scripts/evolution/autonomousAuthoring/runBoundedFormalEventModelBackedTrial.ts`
- Modify: `tests/evolution/boundedFormalEventAuthoring.test.ts`

**Interfaces:**
- Consumes:
  - `prepareBoundedFormalEventTrial(...)`
  - `runBoundedFormalEventShadowTrial(...)`
- Produces:
  - `runBoundedFormalEventModelBackedTrial(input, dependencies?)`
  - one family-specific result that contains preparation outcome and, only when ELIGIBLE, the shadow-trial result.
- It is not a generic Contract runner.

- [ ] **Step 1: Add a failing deterministic orchestration test**

Using fake Proposal/Reviewer Participants, assert one invocation of the new runner performs:

~~~text
fixed Human-direct Requirement
→ Host preflight manifest
→ Proposal
→ independent Reviewer
→ Host Admission = ELIGIBLE
→ execution manifest
→ isolated deterministic shadow execution
→ SHADOW_AUTHORING_VERIFIED
~~~

Assertions:
- no Human SHA/ref input exists anywhere;
- Proposal and Reviewer remain distinct;
- total fake Participant starts match the two role invocations unless one authorized structural correction is deliberately exercised;
- execution manifest is created only after ELIGIBLE Admission;
- authoritative repository fingerprint is unchanged;
- only the two Formal Event allowed shadow paths change.

Also add failure cases:
- Proposal invalid → no Reviewer, no execution manifest, no shadow execution;
- Reviewer non-conforming → no shadow execution;
- manifest drift → no subsequent stage;
- `CONTRACT_CHANGE_REQUIRED`/non-ELIGIBLE Admission → no shadow execution.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: FAIL because the continuous runner does not exist.

- [ ] **Step 3: Implement the family-specific runner**

The runner only coordinates existing boundaries. It must not:
- author content itself;
- duplicate validation logic from Proposal/Reviewer/Admission/verifier;
- create a generic Contract registry;
- catch fail-closed authority/integrity failures and continue.

On ELIGIBLE preparation, pass the exact Proposal/Review and execution-manifest result directly to `runBoundedFormalEventShadowTrial()`.

- [ ] **Step 4: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/evolution/autonomousAuthoring/runBoundedFormalEventModelBackedTrial.ts         tests/evolution/boundedFormalEventAuthoring.test.ts
git commit -m "feat: add continuous bounded formal event trial runner"
```

---

### Task 5: Full deterministic closure and landing

**Files:**
- All files touched in Tasks 1-4.

**Interfaces:**
- No new product semantics.
- The repository state after this task is the exact code basis for the real trial.

- [ ] **Step 1: Search for obsolete Human SHA gating in the Formal Event path**

Run:

```bash
rg -n "AWAITING_HUMAN_EXACT_SHA256_APPROVAL|humanApprovedSha256|generationHumanAuthorizationRef|humanAuthorizationArtifactPath|expectedHumanAuthorizationSha256|EXECUTION_AUTHORIZATION_REQUIRED"   scripts/evolution/autonomousAuthoring   src/evolution/boundedFormalEvent*   tests/evolution/boundedFormalEventAuthoring.test.ts
```

Expected: no active Formal Event runtime/test references. Historical preschool files are outside this check and must not be rewritten.

- [ ] **Step 2: Run the required focused/regression checks**

Run:

```bash
npm exec -- tsx tests/evolution/boundedFormalEventAuthoring.test.ts
npm run test:evolution:autonomous-authoring
npm run typecheck
git diff --check
```

Expected: all exit 0.

- [ ] **Step 3: Verify authoritative catalog and scope**

Run:

```bash
git diff -- src/data/lines/p22-content-expansions.json
git status --short
```

Expected before landing: no authoritative catalog diff and only planned implementation/test files changed.

- [ ] **Step 4: Commit any final test-only integration adjustments**

If Tasks 1-4 already left the tree clean, skip this commit. Otherwise commit only the scoped reconciliation changes:

`git commit -m "test: verify standing authorization formal event flow"`

- [ ] **Step 5: Push implementation to `dev`**

Push the reviewed commits. Confirm local `dev` and `origin/dev` match and the working tree is clean.

Do not run the real model-backed trial against unpushed local-only authorization code.

---

### Task 6: Run the first continuous model-backed Bounded Formal Event trial

**Files / Artifacts:**
- Runtime artifacts only under `.tmp/evolution/`, `artifacts/`, or repository-external paths.
- Authoritative source files must remain unchanged.

**Interfaces:**
- Consume clean landed `dev` from Task 5.
- Use current fresh `CODEX_CURRENT` binding locks under PD-122 retained semantics.
- Use fixed `HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT`.
- Use `bounded-formal-event-authoring-v1@1`.
- Run through `runBoundedFormalEventModelBackedTrial(...)`.

- [ ] **Step 1: Capture the fresh runtime inputs automatically**

Generate unique Proposal/Reviewer invocation refs and fresh role-specific binding locks from the current landed `dev`.

Do not generate a Human approval candidate and do not ask Human to approve a digest.

- [ ] **Step 2: Run one continuous model-backed trial**

Execute exactly one bounded trial:

~~~text
Host preflight
→ Proposal Participant
→ independent Reviewer
→ Host admission
→ isolated shadow execution
→ deterministic verification
~~~

No full AE discovery, no retry-until-success loop, no second Requirement.

PD-122's permitted same-thread structural correction remains available inside each Participant invocation; that is not a new business-level retry.

- [ ] **Step 3: Fail closed on any STOP outcome**

If Proposal/Reviewer/Admission/manifest/verifier returns a non-positive terminal or requires Contract change, stop and report the exact stage/evidence. Do not expand Contract or rerun with a looser prompt.

- [ ] **Step 4: If verified, present the actual result for Human promotion review**

Return:
- Event ID/title/body;
- exact eligibility/access predicate;
- choice/auto form and choices;
- actual effects;
- Proposal provenance;
- independent Reviewer decision and assessment;
- Admission result;
- changed-file set in the shadow workspace;
- verification results;
- exact patch/diff;
- machine manifest/digest provenance for audit;
- explicit statement that Natural Effectiveness is not established.

Do **not** ask Human to approve any manifest SHA. Ask only whether to `PROMOTE_EXACT_PATCH`, `DEFER`, or `REJECT` the actual verified patch.

- [ ] **Step 5: Do not promote automatically**

Regardless of verification success, leave authoritative `src/data/lines/p22-content-expansions.json` unchanged until Human reviews the actual patch.

