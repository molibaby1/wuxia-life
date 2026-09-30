# Reference Participant Binding and Native Envelope Assistance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seal the controlled Codex reference binding, add Codex-native JSON-object envelope assistance without transferring semantic authority away from the Host, and prove communication reliability before any new governed Layer A attempt.

**Architecture:** Keep ordinary `CODEX_CURRENT` behavior available for ordinary operator work, but introduce a reference-only sealed binding that explicitly carries executable identity, model, reasoning effort, ambient config fingerprint, and native envelope-schema identity. Governed authorization v2 commits to that binding lock; the same lock drives initial and resumed Solution commands. Communication matrices and a historical Solution-only probe run outside governed attempt history and must pass before Layer A is reopened.

**Tech Stack:** TypeScript, Node.js child processes and filesystem APIs, existing Codex CLI adapter, existing Participant execution trace/Host validators, `tsx` tests.

**Spec:** `docs/superpowers/specs/2026-09-30-reference-participant-binding-and-native-envelope-assistance-design.md`

**Revision execution scope (2026-10-01):** Tasks 1–3 and Task 5 are already delivered on `dev`; do not redo them. The approved correction changes only Task 4's Matrix B/C measurement semantics and Task 6's live rerun/evidence gate. Matrix D remains conditional and must not run if corrected Matrix B fails or if Matrix C requires Human timeout-policy review.

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

1. **Matrix B filler-only variance:** changed lengths of designated non-semantic `padding` must not fail the gate when structure is exact, padding remains non-empty `x+`, and total parsed size stays 22–26 KiB.
2. **Matrix B real corruption:** missing records/keys, changed correctness-bearing fields/checksum markers, invalid filler type/content, out-of-band total size, malformed envelope, or timeout must still fail.
3. **Matrix C policy separation:** a structurally valid continuation that completes after 60,000ms but within 300,000ms must stop at `CONTINUATION_TIMEOUT_POLICY_REVIEW`; it must never auto-change the production timeout.
4. **Fresh sealed evidence:** corrected A/B/C must share one fresh binding lock and new evidence root; prior v1/v2 evidence is immutable and must not be mixed into the corrected verdict.
5. **Probe containment:** Matrix D remains blocked unless corrected B passes and C has a supported/approved retransmission policy; no communication evidence may create governed attempts, Reviewer/Shadow invocations, promotion artifacts, or authoritative content writes.

---

### Task 1: Add the sealed reference Participant binding contract — DELIVERED / DO NOT REDO

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

### Task 2: Wire native JSON-object assistance into the locked Codex Solution path and restore accepted sender wording — DELIVERED / DO NOT REDO

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

### Task 3: Bind governed execution authorization to the sealed Participant — DELIVERED / DO NOT REDO

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

### Task 4: Correct Matrix B/C measurement semantics

**Files:**
- Modify: `scripts/evolution/contractConformance/referenceParticipantCommunicationMatrix.ts`
- Modify: `tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

**Interfaces:**
- Consumes: existing sealed binding APIs, `runWorkspaceAgentJob()`, `runWorkspaceAgentContinuation()`, and `validateStructuredTerminalEnvelope()`.
- Produces:
  - `validateSyntheticLargeEnvelopePayload(actual)` — strict semantic/structural validation for the synthetic large-object workload;
  - Matrix evidence schema v2 fields that distinguish exact byte equality from semantic/structural validity;
  - corrected Matrix B/C gates that never treat non-semantic filler byte equality as a requirement.

- [ ] **Step 1: Write failing Matrix B validator tests**

Add table-driven tests for a new exported helper:

```ts
export function validateSyntheticLargeEnvelopePayload(
  actual: Record<string, unknown>,
): {
  ok: boolean;
  measuredBytes: number;
  reason?: string;
}
```

Pin these cases:

- exact generated payload → `ok: true`;
- one or more `padding` strings change length but remain non-empty `x+`, and total serialized object remains 22–26 KiB → `ok: true`;
- missing record → `ok: false`;
- changed `nodeId`, ancestry, `values`, child id, or `checksumMarker` → `ok: false`;
- missing/extra required structural key → `ok: false`;
- non-string padding or padding containing characters other than `x` → `ok: false`;
- total serialized object outside 22–26 KiB → `ok: false`.

Do not use whole-object `isDeepStrictEqual` inside this helper.

- [ ] **Step 2: Write failing Matrix B gate tests**

Update fake-Participant tests so Matrix B passes only when all three trials:

- return `COMPLETED`;
- are Host envelope-valid;
- pass `validateSyntheticLargeEnvelopePayload()`;
- apply no Host repair.

Keep `payloadMatchedExactly` only as optional diagnostic evidence if useful; it MUST NOT control the Matrix B gate.

Add evidence fields:

```ts
payloadStructureValid?: boolean;
payloadMeasuredBytes?: number;
```

Bump new matrix evidence to `reference-participant-communication-matrix-v2`; do not rewrite existing v1 evidence.

- [ ] **Step 3: Write failing Matrix C semantic-preservation tests**

Matrix C initial and continuation results must use the same structural validator as Matrix B.

Add/rename evidence fields so the gate can state independently:

- initial envelope valid;
- initial structure valid;
- continuation envelope valid;
- continuation structure valid;
- continuation completion latency;
- within production 60,000ms;
- within observation 300,000ms.

A continuation that changes only valid non-semantic padding length remains structurally valid.

A continuation that changes a correctness-bearing field fails even if the JSON envelope is valid.

- [ ] **Step 4: Write failing Matrix C timeout-policy tests**

Pin these outcomes:

- 3/3 structurally valid continuations complete within 60,000ms → Matrix C gate passes;
- any structurally valid continuation completes after 60,000ms but at or before 300,000ms → status `CONTINUATION_TIMEOUT_POLICY_REVIEW`, Matrix D blocked;
- continuation exceeds 300,000ms, fails envelope validity, loses thread identity, or fails structural preservation → `CONTINUATION_UNRELIABLE`;
- no code path changes the production 60,000ms constant.

- [ ] **Step 5: Run the focused test and verify RED**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

Expected: FAIL on the new structural-validation/gate assertions.

- [ ] **Step 6: Implement the structural validator**

Validate the exact synthetic shape produced by `buildSyntheticLargeEnvelopePayload()`:

- exact top-level schema/header semantics;
- exactly 20 expected records;
- exact `nodeId`, ancestry, `values`, child id, and `checksumMarker`;
- `padding` is a non-empty string matching `/^x+$/`;
- serialized parsed payload size is within 22–26 KiB;
- no missing or unknown structural keys.

This helper is matrix-only measurement logic. It must not be reused as a production Role schema or Host repair mechanism.

- [ ] **Step 7: Correct Matrix B and C prompts/gates**

Matrix B prompt must ask for the complete supplied structure while explicitly stating that bulk `padding` is transport filler: preserve all correctness-bearing fields; padding must remain non-empty `x` filler and exact character count is not semantic.

Matrix C continuation prompt must request same-thread `RE-EMIT ONLY` with the same rule: preserve all correctness-bearing fields; filler length is non-semantic.

Replace gate dependence on exact deep equality with the new structural-validation result.

Keep:
- production initial timeout `1_800_000ms`;
- production retransmission timeout `60_000ms`;
- observation ceiling `300_000ms`;
- maximum production retransmissions = one.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

Expected: PASS.

- [ ] **Step 9: Run adjacent regression tests**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

`git diff --check`

Expected: PASS.

- [ ] **Step 10: Commit the correction**

```bash
git add scripts/evolution/contractConformance/referenceParticipantCommunicationMatrix.ts \
  tests/evolution/referenceParticipantCommunicationMatrix.test.ts
git commit -m "fix: correct reference communication matrix semantics"
```

### Task 5: Add the historical Solution-only communication probe — DELIVERED / DO NOT REDO

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

### Task 6: Verify the correction, rerun communication evidence, and stop at the timeout/reopening gate

**Files:**
- Modify only after fresh evidence exists: `docs/governance/current-product-stage.md`
- Evidence: `.tmp/evolution/reference-participant-communication/**`
- Evidence only if allowed by Matrix C: `.tmp/evolution/preschool-reference-solution-communication-probes/**`

**Interfaces:**
- Consumes: delivered Tasks 1–5 plus corrected Task 4.
- Produces: fresh corrected Matrix A/B/C evidence and, only when permitted, Matrix D evidence. It does **not** produce a governed Layer A authorization.

- [ ] **Step 1: Run focused deterministic verification**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantCommunicationMatrix.test.ts`

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

`npm exec -- tsx tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

Expected: PASS.

- [ ] **Step 2: Run regression suites**

Run:

`npm run test:evolution:autonomous-authoring`

`npm run test:evolution:solution-replay`

`npm run typecheck`

`git diff --check`

Expected: all gating commands exit 0.

The known unrelated `ordinaryEvolutionOperator.test.ts` report-format assertion remains non-gating unless this correction changes that code path.

- [ ] **Step 3: Push the harness correction before live experiments**

Confirm:
- the correction commit is on `dev`;
- `origin/dev` equals local `dev`;
- only the user's existing untracked governance file remains;
- production timeout constants are still `1_800_000ms` initial and `60_000ms` retransmission.

Record the exact corrected implementation SHA. Fresh Matrix evidence must identify this SHA.

- [ ] **Step 4: Start one fresh corrected matrix root**

Use a new create-only matrix ref; do not reuse or mutate `reference-binding-2026-09-30-v2`.

Capture a fresh sealed binding using explicit current model/reasoning/config values. A normal Codex CLI upgrade is allowed; if the version/config differs from previous evidence, record the new binding and do not mix evidence across bindings.

Matrix A/B/C in this corrected run must share the exact new `binding-lock.json`.

- [ ] **Step 5: Run Matrix A**

Run three trivial-object trials under the corrected implementation.

Gate: 3/3 process completion and 3/3 Host envelope-valid.

If A fails, STOP with the actual runtime/provider failure. Do not run B/C/D.

- [ ] **Step 6: Run corrected Matrix B**

Run three synthetic 22–26 KiB nested-object trials.

Gate: all three trials must:
- complete before `1_800_000ms`;
- be Host envelope-valid;
- pass `validateSyntheticLargeEnvelopePayload()`;
- show no Host repair.

Non-semantic `padding` length differences are allowed only when the structural validator passes and total parsed size remains 22–26 KiB.

If any trial times out or fails structural validation, STOP. Do not run Matrix C or D. Do not change the 1,800-second hard timeout.

- [ ] **Step 7: Run corrected Matrix C**

Only if corrected Matrix B passes 3/3, run three fresh same-thread continuation measurements.

Each C trial must begin from a fresh completed, structurally valid large-object thread and then issue one `RE-EMIT ONLY` continuation under the same sealed binding and envelope schema.

Record for each:
- startup latency;
- first output activity latency;
- terminal completion latency;
- envelope validity;
- structural validity;
- within-60s;
- within-300s.

Classify:

- 3/3 structurally valid continuations complete within `60_000ms` → existing production ceiling remains supported and Matrix D may proceed;
- any structurally valid continuation completes after `60_000ms` but within `300_000ms` → status `CONTINUATION_TIMEOUT_POLICY_REVIEW`; STOP before Matrix D and return all three fresh measurements for Human timeout-policy approval;
- any continuation exceeds `300_000ms`, loses thread identity, fails envelope validity, or fails structural preservation → `CONTINUATION_UNRELIABLE`; STOP for communication design review.

Do not modify the production `60_000ms` constant in this task.

- [ ] **Step 8: Conditionally run Matrix D**

Run Matrix D **only** if corrected Matrix B passes and corrected Matrix C supports the current 60-second production policy, or if a replacement policy has already received a separate Human approval after Step 7.

If permitted, run two historical Solution-only probes using:
- the exact accepted historical evidence;
- observable payload;
- responsibility brief;
- the exact corrected-matrix `binding-lock.json`.

Both probes must:
- finish before `1_800_000ms`;
- produce a Host envelope-valid object;
- reach Role-schema validation;
- leave authoritative fingerprint unchanged.

Do not create `attempt-000012`, Reviewer, Shadow, promotion package, or promotion patch.

- [ ] **Step 9: Verify containment and immutable governed history**

After the fresh evidence run, confirm:
- `attempt-000012` is absent;
- admission lock is absent;
- governed history SHA is unchanged from before the corrected matrix/probes;
- previous v1/v2 matrix evidence remains unchanged;
- no Reviewer/Shadow invocation exists in communication evidence;
- no promotion package/patch was created;
- authoritative fingerprint is unchanged during runtime evidence collection.

- [ ] **Step 10: Update stage documentation from fresh evidence only**

Update `docs/governance/current-product-stage.md` with the corrected result.

If corrected B fails, record its actual earliest failure.

If corrected B passes but C triggers timeout-policy review, explicitly state:
- Matrix B corrected harness passed;
- the exact three Matrix C latencies;
- 60 seconds is unsupported for that sealed binding;
- production timeout remains unchanged;
- Matrix D remains blocked pending Human timeout-policy decision.

If A–D eventually meet the reopening gates, state only that governed Layer A may be proposed again; no attempt is authorized by this plan.

- [ ] **Step 11: Final verification and stage-doc commit**

Run:

`git diff --check`

Commit and push only the evidence-derived stage documentation change after confirming all evidence artifacts are preserved outside governed attempt history.

- [ ] **Step 12: Stop**

Return one consolidated report containing:
- corrected implementation SHA;
- exact sealed binding facts and binding-lock SHA;
- Matrix A results;
- corrected Matrix B results and structural-validation outcomes;
- corrected Matrix C three-trial latencies and policy classification;
- Matrix D results only if it was legitimately run;
- authoritative fingerprint before/after;
- governed history SHA before/after;
- production timeout constants unchanged confirmation;
- `attempt-000012` absent confirmation;
- whether the Layer A reopening gate is satisfied.

If Matrix C requires timeout-policy review, the report must stop there. Do not propose or implement a replacement timeout inside this execution.

Do **not** create an `attempt-000012` authorization candidate in this plan. Reopening Layer A remains a separate Human decision.
