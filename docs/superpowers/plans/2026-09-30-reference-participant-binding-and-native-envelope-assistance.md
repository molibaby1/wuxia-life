# Reference Participant Binding and Native Envelope Assistance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seal the controlled Codex reference binding, add Codex-native JSON-object envelope assistance without transferring semantic authority away from the Host, and prove communication reliability before any new governed Layer A attempt.

**Architecture:** Keep ordinary `CODEX_CURRENT` behavior available for ordinary operator work, but introduce a reference-only sealed binding that explicitly carries executable identity, model, reasoning effort, ambient config fingerprint, and native envelope-schema identity. Governed authorization v2 commits to that binding lock; the same lock drives initial and resumed Solution commands. Communication matrices and a historical Solution-only probe run outside governed attempt history and must pass before Layer A is reopened.

**Tech Stack:** TypeScript, Node.js child processes and filesystem APIs, existing Codex CLI adapter, existing Participant execution trace/Host validators, `tsx` tests.

**Spec:** `docs/superpowers/specs/2026-09-30-reference-participant-binding-and-native-envelope-assistance-design.md`

## Global Constraints

- Use only `/Users/zhouyun/code/wuxia-life`; do not create Git worktrees.
- Do not create or execute `attempt-000012` while implementing or validating this plan.
- Keep the production initial Participant hard timeout at exactly `1_800_000ms`.
- Keep the production bounded retransmission ceiling at exactly `60_000ms` and maximum retransmissions at one.
- Provider-native output schema may require only a JSON object envelope; it must not duplicate `SolutionWorkV1`, Autonomous Authoring, Card, reference, identity, or provenance semantics.
- Host strict envelope, Role-schema, identity, reference, Contract, provenance, and repository-integrity validation remains authoritative.
- Do not add Host extraction, Markdown stripping, field completion, normalization, semantic repair, or retry-until-valid behavior.
- Remove the current Solution-only compact/single-line serialization instruction; legal pretty-printed JSON must remain valid.
- Preserve all existing reference-trial attempt history byte-for-byte; communication probes must not write under the governed reference-trial attempt tree.
- Do not invoke Reviewer, Shadow Authoring, promotion generation, or authoritative catalog writes from communication-only probes.
- Do not modify the user's existing untracked `docs/governance/auto-evolution-capability-assessment-2026-09-26.md`.
- A normal Codex CLI upgrade is allowed operationally; for a controlled proof it changes the sealed binding and therefore requires fresh communication evidence.

## Review Focus

1. **Binding changes after Human authorization:** executable target/version, explicit model/reasoning, ambient config SHA, or envelope-schema SHA changes must reject admission before a new attempt directory is created.
2. **Executable symlink drift:** resolving the same `which codex` path to a different real path/version must count as binding drift, not as the same binding.
3. **Provider schema drift:** changing the committed/native envelope schema bytes after candidate approval must reject the governed run.
4. **Pretty-printed terminal JSON:** multi-line legal JSON objects must continue to pass Host envelope validation and must not be converted into a single-line protocol requirement.
5. **Probe containment:** Matrix A–D evidence may use `.tmp/evolution/**` or dedicated probe roots but must never create governed attempt directories, promotion artifacts, or authoritative content changes.

---

### Task 1: Add the sealed reference Participant binding contract

**Files:**
- Create: `scripts/evolution/operator/referenceParticipantBinding.ts`
- Create: `scripts/evolution/operator/codexJsonObjectEnvelope.schema.json`
- Modify: `scripts/evolution/problemAgnosticSolution/agentParticipant.ts`
- Modify: `scripts/evolution/participantObservability.ts`
- Modify: `scripts/evolution/operator/resolveParticipantBinding.ts`
- Test: `tests/evolution/referenceParticipantBinding.test.ts`

**Interfaces:**
- Consumes: existing `OperatorParticipantBindingId`, `ResolvedOperatorParticipantBinding`, `WorkspaceAgentParticipantOptions`, `canonicalJson()`, and `sha256Hex()`.
- Produces:
  - `ReferenceParticipantBindingLockV1`
  - `captureReferenceParticipantBindingLock(input)`
  - `referenceParticipantBindingLockSha256(lock)`
  - `resolveReferenceParticipantBindingFromLock(input)`

- [ ] **Step 1: Write failing lock-capture tests**

Add tests that assert a captured lock contains:
- `schemaVersion: "reference-participant-binding-lock-v1"`;
- `bindingId: "CODEX_CURRENT"`;
- provider `codex-local-subagent`;
- executable real path, not merely the unresolved symlink path;
- exact executable version;
- non-empty explicit model;
- non-empty explicit reasoning effort;
- ambient config SHA-256 or the literal `"ABSENT"`;
- native envelope assistance `enabled: true`, repo-relative schema ref, and exact schema SHA-256.

Also assert the lock digest is stable under object-key ordering.

- [ ] **Step 2: Run the new test and verify RED**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

Expected: FAIL because the lock module and schema do not yet exist.

- [ ] **Step 3: Implement the binding-lock types and capture function**

In `referenceParticipantBinding.ts`, define:

```ts
export interface ReferenceParticipantBindingLockV1 {
  schemaVersion: 'reference-participant-binding-lock-v1';
  bindingId: 'CODEX_CURRENT';
  provider: 'codex-local-subagent';
  executableRealPath: string;
  executableVersion: string;
  modelConfigured: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
  ambientCodexConfigSha256: string | 'ABSENT';
  nativeEnvelopeAssistance: {
    enabled: true;
    schemaRef: string;
    schemaSha256: string;
  };
}
```

Implement:

```ts
export async function captureReferenceParticipantBindingLock(input: {
  repositoryRoot: string;
  bindingId: OperatorParticipantBindingId;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
}): Promise<ReferenceParticipantBindingLockV1>

export function referenceParticipantBindingLockSha256(
  lock: ReferenceParticipantBindingLockV1,
): string
```

Use `realpath()` for the executable identity, `codex --version` for version, and SHA-256 bytes for the ambient config and committed schema. Reject empty model/reasoning values.

- [ ] **Step 4: Add the envelope-only provider schema**

Create `codexJsonObjectEnvelope.schema.json` with only the JSON-object transport constraint accepted by the installed Codex CLI. Do not encode domain fields and do not encode single-line/canonical requirements.

- [ ] **Step 5: Extend Participant binding metadata/receipt without changing ordinary semantics**

Extend `WorkspaceAgentParticipantOptions.bindingMetadata` only with optional non-secret fields needed for:
- ambient config SHA;
- native envelope schema SHA.

Update `buildParticipantBindingReceipt()` so explicit reference Participants report:
- `modelConfigured`;
- `modelResolution: "EXPLICIT"`;
- `reasoningEffort`;
- config/schema digests.

Existing ordinary Participants with no explicit values must retain their current receipt behavior.

- [ ] **Step 6: Implement locked resolution and drift checks**

Implement:

```ts
export async function resolveReferenceParticipantBindingFromLock(input: {
  repositoryRoot: string;
  lock: ReferenceParticipantBindingLockV1;
}): Promise<ResolvedOperatorParticipantBinding>
```

It must re-resolve executable real path/version, ambient config SHA, and schema SHA and fail closed on any mismatch before returning a Participant.

The returned Participant must expose the lock's explicit model/reasoning values in `participant.model` and `participant.reasoningEffort`.

- [ ] **Step 7: Add drift tests from Review Focus**

Tests must cover:
- same symlink path but changed real target;
- changed executable version;
- changed ambient config bytes;
- changed schema bytes;
- missing ambient config when lock expected bytes;
- absent config remaining absent;
- no accidental mutation of ordinary `resolveOperatorParticipantBinding()` behavior.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/evolution/operator/referenceParticipantBinding.ts \
  scripts/evolution/operator/codexJsonObjectEnvelope.schema.json \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/participantObservability.ts \
  scripts/evolution/operator/resolveParticipantBinding.ts \
  tests/evolution/referenceParticipantBinding.test.ts
git commit -m "feat: seal reference participant binding"
```

### Task 2: Wire native JSON-object assistance into the locked Codex Solution path and restore accepted sender wording

**Files:**
- Modify: `scripts/evolution/operator/resolveParticipantBinding.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
- Modify: `src/evolution/structuredTerminalEnvelope.ts` only if tests reveal an implementation defect; otherwise leave unchanged.
- Test: `tests/evolution/referenceParticipantBinding.test.ts`
- Test: `tests/evolution/solutionAgentLoop.test.ts`

**Interfaces:**
- Consumes: `ReferenceParticipantBindingLockV1` and the locked resolver from Task 1.
- Produces: a locked Codex Participant whose initial and resume commands carry the same explicit model/reasoning and `--output-schema` configuration.

- [ ] **Step 1: Write failing command-construction tests**

Assert locked Solution initial args contain:
- `exec --json`;
- explicit `-m <lock.modelConfigured>`;
- explicit `-c` followed by `model_reasoning_effort=<JSON.stringify(lock.reasoningEffort)>`, producing e.g. `model_reasoning_effort="max"`;
- `--output-schema <absolute-path-to-codexJsonObjectEnvelope.schema.json>`.

Assert same-thread `exec resume` carries the same model, reasoning, and output-schema values.

Assert non-reference ordinary binding remains unchanged.

- [ ] **Step 2: Write the sender-contract regression test**

In `solutionAgentLoop.test.ts`, assert the Solution prompt:
- still requires one complete valid JSON object;
- does **not** contain `Return it as one compact JSON line.`;
- does **not** require canonical or single-line JSON;
- still includes the fixed Host/Contract instructions.

Add an envelope regression asserting a legal pretty-printed JSON object is accepted.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

Expected: new assertions FAIL.

- [ ] **Step 4: Implement locked Codex initial/resume args**

Keep `createCodexCurrentParticipant()` compatible for ordinary use. Add the smallest reference-only configuration path necessary so the locked resolver builds initial and resume args from the lock.

Do not add provider-native domain semantics.

- [ ] **Step 5: Remove the compact/single-line instruction**

Delete only the Solution-only line:

`Return it as one compact JSON line. Compact only whitespace; never omit or summarize required fields or content.`

Retain the requirement to verify complete valid JSON and all required content.

If a replacement sentence is necessary, it may say only that the complete object must satisfy the existing Structured Final Output Contract; it must not add canonical/single-line semantics.

- [ ] **Step 6: Run focused tests**

Run both focused test files again.

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/evolution/operator/resolveParticipantBinding.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  tests/evolution/referenceParticipantBinding.test.ts \
  tests/evolution/solutionAgentLoop.test.ts
git commit -m "feat: add codex native envelope assistance"
```

### Task 3: Bind governed execution authorization to the sealed Participant

**Files:**
- Modify: `scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts`
- Create: `scripts/evolution/autonomousAuthoring/buildPreschoolReferenceTrialAuthorization.ts`
- Test: `tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts`

**Interfaces:**
- Consumes: `ReferenceParticipantBindingLockV1`, `referenceParticipantBindingLockSha256()`, and `resolveReferenceParticipantBindingFromLock()`.
- Produces:
  - execution authorization schema `preschool-reference-trial-execution-authorization-v2`;
  - a create-only authorization-candidate builder;
  - pre-attempt and pre-Solution binding drift enforcement.

- [ ] **Step 1: Write failing authorization-v2 tests**

Update/add tests for a new authorization shape containing:

```ts
participantBindingLock: ReferenceParticipantBindingLockV1;
participantBindingLockSha256: string;
```

The candidate's canonical SHA must commit to both fields.

Old persisted v1 authorization artifacts remain historical evidence; new attempts must require v2.

- [ ] **Step 2: Add candidate-builder RED tests**

Define a builder interface:

```ts
export async function buildPreschoolReferenceTrialAuthorizationCandidate(input: {
  liveRepositoryRoot: string;
  attemptRef: string;
  authorizationRef: string;
  authorizedAt: string;
  participantBindingLockPath: string;
  expectedParticipantBindingLockSha256: string;
  destinationPath: string;
}): Promise<{
  canonicalSha256: string;
  rawSha256: string;
  participantBindingLockSha256: string;
}>
```

Test that it:
- captures current disk history;
- reads the supplied communication-validated binding lock;
- verifies the supplied lock SHA and current environment still match that lock;
- writes create-only;
- embeds the exact lock and lock digest;
- returns the same canonical SHA the runner later verifies.

- [ ] **Step 3: Run the authorization tests and verify RED**

Run:

`npm exec -- tsx tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts`

Expected: FAIL on v2/binding-lock assertions.

- [ ] **Step 4: Implement authorization v2 parsing**

Update the authorization interface/parser so new governed attempts accept only:

`schemaVersion: "preschool-reference-trial-execution-authorization-v2"`

with the existing fields plus the full binding lock and `participantBindingLockSha256`.

Validate:
- lock shape;
- lock digest;
- authorization canonical digest;
- external Human-approved canonical digest.

Do not rewrite old attempt artifacts.

- [ ] **Step 5: Verify binding drift before attempt creation**

Inside `admitReferenceTrialAttempt()`, after authorization/history checks but **before creating the target attempt directory**, call `resolveReferenceParticipantBindingFromLock()`.

If drift exists, return the existing authorization/admission STOP path and leave the target attempt absent.

Persist a create-only `participant-binding-lock.json` sidecar only after admission succeeds.

- [ ] **Step 6: Re-verify the same lock at BINDING stage**

Pass the authorized lock into `runVerifiedHistoricalTrial()`.

At the BINDING stage, resolve it again and use only the returned locked Participant for Solution, Reviewer, and Shadow where the current trial intentionally shares one binding.

If drift appears after attempt creation but before Participant invocation, fail closed and record the attempt failure; never silently recapture a new lock.

- [ ] **Step 7: Add exact drift/admission tests**

Cover Review Focus cases:
- config changes after authorization candidate but before admission → STOP and no attempt directory;
- CLI real path/version changes → STOP and no attempt directory;
- provider schema bytes change → STOP and no attempt directory;
- lock digest tampering → STOP;
- authorization canonical digest tampering → STOP;
- valid v2 authorization → normal synthetic trial path proceeds.

- [ ] **Step 8: Implement the create-only candidate builder**

Build it from existing `captureReferenceTrialLegacyHistory()` plus the already communication-validated binding-lock file supplied by the caller. Verify that file's SHA against `expectedParticipantBindingLockSha256` and call `resolveReferenceParticipantBindingFromLock()` before embedding it.

Export the existing runner canonicalization helper and reuse it in the builder; do not create a second canonicalization algorithm.

The builder must not create an attempt directory, recapture a different binding, or run a Participant.

- [ ] **Step 9: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts`

Expected: PASS, with historical external-input integration still `NOT RUN` unless its required inputs were explicitly supplied.

- [ ] **Step 10: Commit**

```bash
git add scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts \
  scripts/evolution/autonomousAuthoring/buildPreschoolReferenceTrialAuthorization.ts \
  tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts
git commit -m "feat: bind reference authorization to participant"
```

### Task 4: Implement communication Matrix A–C outside governed Layer A

**Files:**
- Create: `scripts/evolution/contractConformance/referenceParticipantCommunicationMatrix.ts`
- Create: `scripts/evolution/contractConformance/runReferenceParticipantCommunicationMatrix.ts`
- Modify: `package.json`
- Test: `tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

**Interfaces:**
- Consumes: sealed reference binding APIs from Task 1 and existing `runWorkspaceAgentJob()`, `runWorkspaceAgentContinuation()`, `validateStructuredTerminalEnvelope()`.
- Produces: create-only matrix evidence under `.tmp/evolution/reference-participant-communication/<matrix-ref>/`.

- [ ] **Step 1: Write failing Matrix A tests**

Define evidence types that record:
- matrix/trial identity;
- binding-lock digest;
- schema digest;
- elapsed time;
- last observable activity;
- runtime outcome;
- Host envelope validity.

Use a fake Participant to assert three independent trivial-object trials are required and no Role/domain validation is inferred from this matrix.

- [ ] **Step 2: Write failing Matrix B tests**

Define a deterministic `buildSyntheticLargeEnvelopePayload()` whose serialized size is in the 22–26 KiB range and whose nesting is non-trivial.

Host validation must compare the returned parsed object against the deterministic expected payload after envelope parsing. No repair or substring extraction is allowed.

- [ ] **Step 3: Write failing Matrix C tests**

Matrix C must:
- create a fresh completed thread for each measurement;
- issue one `RE-EMIT ONLY` same-thread request;
- use the same envelope-only schema;
- record startup, first-output-activity, and terminal-completion latency;
- classify whether completion is within the production 60,000ms boundary.

Use an experiment-only observation ceiling of `300_000ms`; this does not change production timeout policy.

If a continuation completes after 60,000ms but before 300,000ms, report measured evidence and require Human design review before production timeout changes.

- [ ] **Step 4: Run the matrix test and verify RED**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

Expected: FAIL because the matrix runner does not exist.

- [ ] **Step 5: Implement Matrix A/B/C runners and evidence**

Keep all evidence outside governed reference-trial history.

The runner must accept explicit:
- model;
- reasoning effort;
- ambient Codex config path;
- evidence root/matrix ref.

It captures one binding lock at matrix start, persists it create-only as `<matrix-root>/binding-lock.json`, records its SHA in matrix evidence, and uses that exact lock for every trial.

- [ ] **Step 6: Add the CLI and package script**

Add a package script such as:

`evolution:reference-communication:matrix`

The CLI must not expose any option that can invoke governed Layer A.

- [ ] **Step 7: Add containment tests**

Assert the matrix runner refuses an evidence root inside:

`artifacts/evolution/autonomous-authoring/reference-trials/`

and never creates:
- `attempt-*`;
- `promotion-package.json`;
- `promotion.patch`.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/evolution/contractConformance/referenceParticipantCommunicationMatrix.ts \
  scripts/evolution/contractConformance/runReferenceParticipantCommunicationMatrix.ts \
  tests/evolution/referenceParticipantCommunicationMatrix.test.ts \
  package.json
git commit -m "feat: add reference communication matrix"
```

### Task 5: Add the historical Solution-only communication probe

**Files:**
- Modify: `scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts` to export one `runPreschoolReferenceSolutionCommunicationProbe()` function that reuses the module's existing private historical preparation helpers without duplicating their semantics.
- Create: `scripts/evolution/autonomousAuthoring/runPreschoolReferenceSolutionCommunicationProbe.ts`
- Modify: `package.json`
- Test: `tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

**Interfaces:**
- Consumes: exact accepted evidence/observable/responsibility inputs, existing historical workspace/input construction, Task 1 locked binding, `runSolutionAgent()`, and existing Host terminal trace.
- Produces:

```ts
export async function runPreschoolReferenceSolutionCommunicationProbe(input: {
  liveRepositoryRoot: string;
  evidencePath: string;
  observablePayloadPath: string;
  responsibilityBriefPath: string;
  probeRef: string;
  destinationRoot: string;
  participantBindingLock: ReferenceParticipantBindingLockV1;
}): Promise<PreschoolReferenceSolutionCommunicationProbeResultV1>
```

The result states whether Host Role-schema validation was reached.
- [ ] **Step 1: Write failing containment tests**

The probe must reject any destination under the governed trial root and must never call:
- `admitReferenceTrialAttempt()`;
- `runSolutionReviewer()`;
- `runShadowAuthoringExecution()`;
- `buildPromotionPackage()`.

Use injected dependencies/spies rather than scanning output text.

- [ ] **Step 2: Write failing outcome tests**

Define a result/evidence shape with at least:
- probe ref;
- binding-lock digest;
- authoritative fingerprint before/after;
- Solution execution outcome;
- `envelopeValid`;
- `schemaValidationAttempted`;
- `schemaValid` when attempted;
- `reachedRoleSchemaValidation`;
- elapsed/last-activity facts;
- evidence artifact refs.

Test:
- valid envelope + valid schema → reached Role schema;
- valid envelope + schema failure → still reached Role schema;
- invalid envelope → did not reach Role schema;
- initial timeout → did not reach Role schema.

- [ ] **Step 3: Run the probe test and verify RED**

Run:

`npm exec -- tsx tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

Expected: FAIL because the probe does not exist.

- [ ] **Step 4: Reuse historical preparation without duplicating authority semantics**

Expose only the minimum helper surface needed to reproduce the same:
- historical baseline;
- Host authority root;
- exact accepted reference inputs;
- Problem Package;
- Contract packet;
- contamination guard;
- Solution workspace.

Do not fork a second implementation of the reference-case semantics.

- [ ] **Step 5: Implement the Solution-only probe**

Default evidence root:

`.tmp/evolution/preschool-reference-solution-communication-probes/<probe-ref>/`

Run exactly one Solution Participant per probe, using the sealed binding and native envelope assistance.

Capture authoritative fingerprint before and after and require equality.

Do not write governed attempt history.

- [ ] **Step 6: Add the CLI/package script**

Add a package script such as:

`evolution:reference-communication:solution-probe`

Require explicit accepted evidence, observable payload, responsibility brief, and `--binding-lock <matrix-root>/binding-lock.json`. Re-resolve that lock before the probe; do not recapture model/reasoning from ambient config.

The CLI itself must have no Reviewer/Shadow/promotion path.

- [ ] **Step 7: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts \
  scripts/evolution/autonomousAuthoring/runPreschoolReferenceSolutionCommunicationProbe.ts \
  tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts \
  package.json
git commit -m "feat: add reference solution communication probe"
```

### Task 6: Verify the implementation, run communication evidence, and stop at the reopening gate

**Files:**
- Modify only after evidence exists: `docs/governance/current-product-stage.md`
- Evidence: `.tmp/evolution/reference-participant-communication/**`
- Evidence: `.tmp/evolution/preschool-reference-solution-communication-probes/**`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: deterministic verification results plus Matrix A–D evidence; it does **not** produce a governed Layer A authorization.

- [ ] **Step 1: Run all focused deterministic tests**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

`npm exec -- tsx tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

`npm exec -- tsx tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

`npm exec -- tsx tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts`

Expected: PASS.

- [ ] **Step 2: Run regression suites**

Run:

`npm run test:evolution:autonomous-authoring`

`npm run test:evolution:solution-replay`

`npm run typecheck`

`git diff --check`

Expected: all gating commands exit 0.

The known stale `ordinaryEvolutionOperator.test.ts` report-format assertion remains non-gating unless this implementation changes that code path.

- [ ] **Step 3: Commit and push the implementation before live communication experiments**

Confirm:
- only intended tracked changes are present;
- the user's untracked governance file is untouched;
- `dev` is pushed.

Record the exact implementation SHA. All live Matrix A–D evidence must identify this SHA.

- [ ] **Step 4: Capture one sealed live binding for Matrix A–C**

Use the current intended explicit model/reasoning values. At plan-authoring time the ambient values are `gpt-6-luna` and `max`; if the Human intentionally changes them before execution, use the new explicit values and record them rather than silently inheriting config.

A normal CLI upgrade is not an error. Whatever CLI version is current at matrix start becomes part of that matrix's sealed binding and must remain unchanged for A–C.

- [ ] **Step 5: Run Matrix A**

Run three trivial-object trials.

Gate: 3/3 process completion, 3/3 Host envelope-valid.

If this gate fails, STOP communication validation and report `NATIVE_ENVELOPE_ASSISTANCE_UNRELIABLE` or the actual runtime failure; do not run Layer A.

- [ ] **Step 6: Run Matrix B**

Run three synthetic 22–26 KiB nested-object trials.

Gate: 3/3 completion and exact Host-parsed payload match, with no envelope repair.

If this gate fails, STOP before Matrix D.

- [ ] **Step 7: Run Matrix C**

Run three same-thread re-emission latency observations.

Do not modify the production 60-second constant.

Classify:
- all three complete within 60s → current production ceiling remains supported;
- any complete only after 60s but within the 300s observation ceiling → STOP for Human timeout-policy review;
- continuation runtime/identity is unreliable → STOP for communication design review.

Do not proceed to Matrix D unless Matrix C supports the current production policy.

- [ ] **Step 8: Run two historical Solution-only Matrix D probes**

Use the exact accepted historical evidence, observable payload, and responsibility brief from preserved reference artifacts.

Both probes must:
- load the exact `<matrix-root>/binding-lock.json` created by Matrix A–C and verify its recorded SHA before execution;
- finish before 1,800,000ms;
- produce a Host envelope-valid object;
- reach Role-schema validation;
- leave authoritative fingerprint unchanged.

A Role-schema failure is allowed for the communication gate if `schemaValidationAttempted=true`; an envelope failure or timeout is not.

- [ ] **Step 9: Verify probe containment**

After both probes, independently confirm:
- `attempt-000012` is absent;
- no admission lock exists;
- governed history is unchanged from its pre-probe SHA;
- no Reviewer/Shadow invocation was created;
- no promotion package/patch exists in probe output;
- authoritative fingerprint is unchanged.

- [ ] **Step 10: Update stage documentation from actual evidence only**

If A–D meet the spec's reopening gates, update `docs/governance/current-product-stage.md` to state:
- binding/envelope communication gate verified for the exact sealed binding;
- governed Layer A may be proposed again;
- no new Layer A attempt has yet been authorized.

If a matrix fails, document the actual failure boundary instead and leave Layer A frozen.

Do not describe deterministic tests as real Participant runtime evidence.

- [ ] **Step 11: Final verification and commit**

Run:

`git diff --check`

Then commit only the evidence-derived stage documentation change, if any, and push `dev`.

- [ ] **Step 12: Stop**

Return one consolidated report containing:
- implementation SHA;
- exact sealed binding facts and binding-lock SHA;
- A/B/C results and timings;
- D probe results;
- authoritative fingerprint check;
- governed history SHA before/after;
- whether the Layer A reopening gate is satisfied.

Do **not** create an `attempt-000012` authorization candidate in this plan. Reopening Layer A is a separate Human decision after reviewing this report.
