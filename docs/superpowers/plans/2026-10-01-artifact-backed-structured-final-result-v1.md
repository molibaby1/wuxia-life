# Artifact-Backed Structured Final Result V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Solution-only controlled reference transport in which the complete `SolutionWorkV1` is written to one Host-fixed workspace artifact and the terminal message carries only a small integrity receipt, then validate it with synthetic and historical Solution-only evidence before any Layer A reopening.

**Architecture:** Preserve the existing domain pipeline after transport. A new artifact-backed delivery mode prepares `.evolution-participant/final-result.json`, validates a small terminal receipt, verifies exact artifact bytes/size/SHA, then feeds those artifact bytes into the existing strict envelope → Role schema → accepted-result checks. Existing terminal-mode Roles remain unchanged; artifact-backed V1 is Solution-only, sealed-reference-only, and has zero retransmissions.

**Tech Stack:** TypeScript, Node.js filesystem/process APIs, existing Codex CLI adapter, existing Host structured-envelope and Solution validators, `tsx` tests.

**Spec:** `docs/superpowers/specs/2026-10-01-artifact-backed-structured-final-result-v1-design.md`

## Global Constraints

- Work only in `/Users/zhouyun/code/wuxia-life`; do not create Git worktrees.
- Do not modify `SolutionWorkV1`, Autonomous Authoring domain schemas, Reviewer domain schema, Shadow authority, catalog/product semantics, or promotion authority.
- Host-fixed result path is exactly `.evolution-participant/final-result.json`.
- Terminal receipt schema version is exactly `artifact-backed-structured-final-result-receipt-v1`.
- Receipt fields are exactly `schemaVersion`, `bytes`, `sha256`; receipt contains no path.
- Maximum result artifact size is exactly `1_048_576` bytes. This is a transport safety ceiling, not domain semantics.
- Host hashes and parses the exact artifact bytes; no canonicalization before integrity comparison.
- No Host extraction, Markdown stripping, normalization, field completion, repair, or workspace search fallback.
- Artifact-backed pilot has exactly zero retransmissions.
- Existing terminal-mode retransmission behavior remains unchanged.
- Production initial hard timeout remains exactly `1_800_000ms`.
- Synthetic artifact-backed matrix observation ceiling is exactly `300_000ms`; this is experiment-only and does not change the production hard timeout.
- Production terminal-mode retransmission timeout remains exactly `60_000ms`; this plan does not modify it.
- Synthetic and historical communication evidence must remain outside governed reference-trial history.
- Do not create or execute `attempt-000012`.
- Do not invoke Reviewer, Shadow, promotion package generation, or authoritative content mutation during artifact-backed communication validation.
- Preserve the user's existing untracked `docs/governance/auto-evolution-capability-assessment-2026-09-26.md`.
- Preserve all prior terminal-mode matrix/spike evidence; use new create-only evidence roots.

## Review Focus

1. **Reserved-path substitution:** preexisting file, symlinked parent, symlinked final file, or path escaping the workspace must fail before semantic validation.
2. **Integrity mismatch:** receipt byte length/SHA must bind to the exact bytes Host reads; whitespace-changing reserialization must not be accepted as the same artifact.
3. **Oversized artifact:** a result larger than `1_048_576` bytes must be rejected before Host reads the full file and must never be truncated into acceptance.
4. **Transport/domain separation:** receipt validation must never replace `validateSolutionWork()`; Reviewer/downstream code must receive only the validated `SolutionWorkV1`.
5. **Pilot containment:** artifact-backed failures must not trigger same-thread continuation, governed attempts, Reviewer/Shadow, or promotion.

---

### Task 1: Add the artifact-backed transport contract and fixed-file validator

**Files:**
- Create: `src/evolution/artifactBackedStructuredFinalResultContract.ts`
- Create: `scripts/evolution/problemAgnosticSolution/artifactBackedStructuredResult.ts`
- Create: `tests/evolution/artifactBackedStructuredFinalResult.test.ts`

**Interfaces:**
- Produces:

```ts
export const ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH =
  '.evolution-participant/final-result.json' as const;

export const ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES = 1_048_576 as const;

export interface ArtifactBackedStructuredFinalResultReceiptV1 {
  schemaVersion: 'artifact-backed-structured-final-result-receipt-v1';
  bytes: number;
  sha256: string;
}

export function validateArtifactBackedStructuredFinalResultReceipt(
  value: unknown,
): ArtifactBackedStructuredFinalResultReceiptV1;

export function renderArtifactBackedStructuredFinalResultInstructionsV1(input: {
  roleSchemaName: string;
}): string;
```

Filesystem helper:

```ts
export interface ConsumedArtifactBackedStructuredResult {
  rawBytes: Buffer;
  rawText: string;
  bytes: number;
  sha256: string;
  parsedObject: Record<string, unknown>;
}

export async function prepareArtifactBackedStructuredResult(input: {
  workspaceRoot: string;
}): Promise<{ resultPath: string }>;

export async function consumeArtifactBackedStructuredResult(input: {
  workspaceRoot: string;
  destinationRoot: string;
  receipt: ArtifactBackedStructuredFinalResultReceiptV1;
}): Promise<ConsumedArtifactBackedStructuredResult>;
```

- [ ] **Step 1: Write RED receipt-contract tests**

Test exact success and failures:

- exact three-field receipt passes;
- unknown field fails;
- missing field fails;
- wrong schemaVersion fails;
- negative/fractional/non-number `bytes` fails;
- `bytes > 1_048_576` fails;
- uppercase/short/non-hex SHA fails.

Also test renderer anchors:
- fixed result path;
- complete Role result belongs in artifact, not terminal;
- terminal contains receipt only;
- Host rejects rather than repairs.

- [ ] **Step 2: Run receipt tests and verify RED**

Run:

`npm exec -- tsx tests/evolution/artifactBackedStructuredFinalResult.test.ts`

Expected: FAIL because the contract/helper modules do not exist.

- [ ] **Step 3: Implement the pure contract**

Keep the receipt validator exact-key and Role-agnostic. Do not import `SolutionWorkV1` into the contract module.

The renderer receives only `roleSchemaName`; it must contain no Solution-specific branching.

- [ ] **Step 4: Write RED fixed-path preparation tests**

Use disposable directories to prove:

- empty workspace prepares the reserved parent and leaves result file absent;
- preexisting reserved result file rejects;
- reserved parent as symlink rejects;
- reserved final path as symlink rejects;
- ordinary unrelated workspace files do not matter.

- [ ] **Step 5: Implement `prepareArtifactBackedStructuredResult()`**

Resolve the workspace root once. Verify/create the reserved parent with create-only/safe-directory semantics. Before Participant invocation require the final result path to be absent.

Do not delete or overwrite a stale result.

- [ ] **Step 6: Write RED artifact-consumption tests**

Create exact files and receipts to pin:

- valid pretty-printed JSON object passes;
- exact bytes/SHA are returned;
- exact raw bytes are copied create-only to `destinationRoot/structured-result-artifact.raw.json`;
- missing file fails;
- final symlink fails;
- symlinked reserved parent fails;
- non-regular file fails;
- >1 MiB file fails before full read;
- receipt byte mismatch fails;
- receipt SHA mismatch fails;
- invalid UTF-8 bytes fail without replacement decoding;
- malformed JSON fails;
- array/scalar JSON root fails;
- fenced/prose-wrapped JSON fails.

Assert no alternative file is searched when the fixed path is missing/invalid.

- [ ] **Step 7: Implement `consumeArtifactBackedStructuredResult()`**

After Participant completion:

1. re-check reserved parent/final path containment;
2. `lstat` final file and reject symlink/non-regular file;
3. inspect size and reject `> 1_048_576` before reading;
4. read exact bytes once;
5. compute exact byte count and SHA-256;
6. compare to receipt;
7. persist exact bytes create-only as `structured-result-artifact.raw.json`;
8. decode with `new TextDecoder('utf-8', { fatal: true })` (or equivalent strict UTF-8 decoder) and reject invalid bytes;
9. call existing `validateStructuredTerminalEnvelope()` on the strictly decoded text;
10. return the parsed object without Role-specific validation.

Do not reserialize before hashing.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/artifactBackedStructuredFinalResult.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/evolution/artifactBackedStructuredFinalResultContract.ts \
  scripts/evolution/problemAgnosticSolution/artifactBackedStructuredResult.ts \
  tests/evolution/artifactBackedStructuredFinalResult.test.ts
git commit -m "feat: add artifact-backed structured result contract"
```

### Task 2: Add a sealed artifact-backed reference binding and Codex receipt schema

**Files:**
- Create: `scripts/evolution/operator/codexArtifactBackedReceipt.schema.json`
- Modify: `scripts/evolution/operator/referenceParticipantBinding.ts`
- Modify: `scripts/evolution/operator/resolveParticipantBinding.ts`
- Modify: `scripts/evolution/participantObservability.ts`
- Modify: `tests/evolution/referenceParticipantBinding.test.ts`

**Interfaces:**
- Preserve existing `ReferenceParticipantBindingLockV1` behavior for old terminal evidence.
- Produce:

```ts
export interface ArtifactBackedReferenceParticipantBindingLockV2 {
  schemaVersion: 'reference-participant-binding-lock-v2';
  bindingId: 'CODEX_CURRENT';
  provider: 'codex-local-subagent';
  executableRealPath: string;
  executableVersion: string;
  modelConfigured: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
  ambientCodexConfigSha256: string | 'ABSENT';
  structuredResultDelivery: {
    kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
    resultRelativePath: '.evolution-participant/final-result.json';
    receiptSchemaRef: 'scripts/evolution/operator/codexArtifactBackedReceipt.schema.json';
    receiptSchemaSha256: string;
  };
}

export async function captureArtifactBackedReferenceParticipantBindingLock(input: {
  repositoryRoot: string;
  bindingId: OperatorParticipantBindingId;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
}): Promise<ArtifactBackedReferenceParticipantBindingLockV2>;

export async function resolveArtifactBackedReferenceParticipantBindingFromLock(input: {
  repositoryRoot: string;
  lock: ArtifactBackedReferenceParticipantBindingLockV2;
}): Promise<ResolvedOperatorParticipantBinding>;

export function artifactBackedReferenceParticipantBindingLockSha256(
  lock: ArtifactBackedReferenceParticipantBindingLockV2,
): string;
```

- [ ] **Step 1: Write RED receipt-schema tests**

Test that the committed provider schema is transport-only:

- object root;
- only `schemaVersion`, `bytes`, `sha256` properties;
- all three required;
- additional properties false;
- no `SolutionWorkV1` / autonomous-authoring / Card fields.

Host validator remains responsible for the exact schemaVersion, SHA regex, and 1 MiB ceiling even if provider JSON Schema support is narrower.

- [ ] **Step 2: Write RED binding-v2 tests**

Pin:

- exact CLI real path/version/model/reasoning/config SHA;
- exact fixed result path;
- exact receipt-schema ref/SHA;
- stable canonical lock digest;
- executable/config/schema drift rejection;
- fixed delivery-mode drift rejection;
- old V1 lock tests remain green and old lock shape is not rewritten.

- [ ] **Step 3: Run binding tests and verify RED**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

Expected: new V2 assertions FAIL.

- [ ] **Step 4: Add the Codex receipt schema**

Use the smallest Codex-supported JSON Schema that constrains the receipt object/keys/types. Do not put Role/domain semantics in it.

If Codex rejects a JSON Schema keyword during the later live matrix, remove only unsupported provider-side keywords while keeping the Host receipt validator exact; do not weaken Host validation.

- [ ] **Step 5: Generalize Codex reference Participant schema wiring**

Refactor `createCodexReferenceParticipant()` only enough to accept the chosen terminal output-schema path/SHA and optional delivery-mode observability metadata.

Both initial `codex exec` and any ordinary terminal-mode resume path must retain their current behavior.

Artifact-backed V2 Participant must expose no same-thread continuation path to the artifact-backed caller; zero-retransmission enforcement remains in Task 3.

- [ ] **Step 6: Implement binding-v2 capture/resolution**

V2 re-resolves and fail-closes on:

- executable real path/version drift;
- ambient config drift;
- receipt schema drift;
- invalid fixed path/delivery mode.

Do not reinterpret a V1 terminal lock as V2.

- [ ] **Step 7: Extend binding observability**

Add optional non-secret receipt/delivery facts to `buildParticipantBindingReceipt()`, e.g.:

- `structuredResultDeliveryMode`;
- `nativeReceiptSchemaSha256`.

Do not remove or rename existing V1 receipt fields.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/evolution/operator/codexArtifactBackedReceipt.schema.json \
  scripts/evolution/operator/referenceParticipantBinding.ts \
  scripts/evolution/operator/resolveParticipantBinding.ts \
  scripts/evolution/participantObservability.ts \
  tests/evolution/referenceParticipantBinding.test.ts
git commit -m "feat: seal artifact-backed reference binding"
```

### Task 3: Extend structured Participant execution with artifact-backed delivery

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/agentParticipant.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/participantFailureClassification.ts` only if needed to map existing facts; do not add a broad new persisted taxonomy.
- Create: `tests/evolution/artifactBackedStructuredParticipantExecution.test.ts`

**Interfaces:**
- Add:

```ts
export type StructuredResultDeliveryMode =
  | { kind: 'TERMINAL_JSON' }
  | {
      kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
      resultRelativePath: '.evolution-participant/final-result.json';
    };
```

Extend `runStructuredParticipantExecution<T>()` input with:

```ts
structuredResultDelivery?: StructuredResultDeliveryMode;
```

Default remains `TERMINAL_JSON`.

- [ ] **Step 1: Write RED terminal-mode compatibility tests**

Using fake Participants, assert omitted/`TERMINAL_JSON` mode preserves:

- current terminal envelope validation;
- current schema validation;
- current accepted-result validation;
- current bounded retransmission behavior;
- current result shape.

No existing terminal-mode test may need semantic expectation changes.

- [ ] **Step 2: Write RED artifact-mode happy-path test**

Fake Participant behavior:

- writes complete JSON to the fixed workspace path;
- returns valid small receipt as terminal payload.

Assert execution:

- validates receipt envelope/schema;
- consumes exact artifact;
- validates artifact envelope;
- passes parsed artifact to `validateSchema`;
- then calls `validateAcceptedResult`;
- returns the validated domain value;
- reports `acceptedAttempt: 0`;
- records recovery as not attempted.

- [ ] **Step 3: Write RED earliest-failure tests**

One test per boundary:

- invalid receipt JSON;
- invalid receipt shape;
- missing artifact;
- symlink/non-regular artifact;
- oversize artifact;
- byte mismatch;
- SHA mismatch;
- invalid artifact JSON;
- Role-schema failure;
- accepted-result failure.

Assert later validators are not called after an earlier failure.

Use existing `ParticipantFailureFacts` categories where reasonable; error messages/evidence must identify the exact artifact-backed boundary.

- [ ] **Step 4: Write RED zero-retransmission test**

Provide a Participant with a working `sameThreadContinuation` spy and an invalid artifact-backed receipt/artifact.

Assert continuation is never invoked and no retransmission prompt artifact is written.

- [ ] **Step 5: Add provider-stream evidence capture hooks**

Extend `WorkspaceAgentJobInput` with optional create-only capture paths:

```ts
providerStdoutArtifactPath?: string;
providerStderrArtifactPath?: string;
```

At process completion/timeout, when paths are supplied, persist the exact accumulated stdout/stderr without changing job interpretation.

Add tests that capture files contain the exact transport streams.

- [ ] **Step 6: Implement the artifact-backed branch**

At the start of artifact mode:

- call `prepareArtifactBackedStructuredResult()`;
- set provider stream capture paths under `destinationRoot`;
- run exactly one initial Participant job.

On successful process completion:

1. persist terminal receipt text;
2. validate receipt with existing structured envelope + Receipt V1 validator;
3. call `consumeArtifactBackedStructuredResult()`;
4. feed `parsedObject` into existing `validateSchema`;
5. call existing `validateAcceptedResult`.

Do not call `runWorkspaceAgentContinuation()` in this branch.

- [ ] **Step 7: Persist artifact-backed validation evidence**

Write one create-only evidence file, e.g. `artifact-backed-validation.json`, containing transport-only facts:

- delivery mode/version;
- fixed result ref;
- receipt validity;
- expected/actual bytes;
- expected/actual SHA;
- artifact envelope validity;
- Role-schema validation attempted/valid;
- accepted-result attempted/accepted;
- earliest failure boundary when failed.

Do not duplicate domain content into this evidence.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/artifactBackedStructuredParticipantExecution.test.ts`

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  scripts/evolution/problemAgnosticSolution/participantFailureClassification.ts \
  tests/evolution/artifactBackedStructuredParticipantExecution.test.ts
git commit -m "feat: add artifact-backed participant delivery"
```

### Task 4: Wire artifact-backed delivery into the controlled Solution path

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
- Modify: `tests/evolution/solutionAgentLoop.test.ts`
- Test: `tests/evolution/artifactBackedStructuredParticipantExecution.test.ts`

**Interfaces:**
- Extend `RunSolutionAgentInput` with optional:

```ts
structuredResultDelivery?: StructuredResultDeliveryMode;
```

- Extend prompt builders with an optional delivery-mode argument while preserving existing callers:

```ts
buildSolutionAgentPrompt(..., structuredResultDelivery?: StructuredResultDeliveryMode): string
buildSolutionRevisionPrompt(..., structuredResultDelivery?: StructuredResultDeliveryMode): string
```

- [ ] **Step 1: Write RED artifact-backed Solution prompt tests**

Assert artifact-backed prompt:

- includes existing Solution reasoning/convergence/authority/Role-schema guidance;
- does not include the old instruction that terminal itself must match `SolutionWorkV1`;
- instructs complete `SolutionWorkV1` to fixed result path;
- instructs terminal receipt only;
- includes exact byte/SHA computation requirement;
- contains no second/free Agent-selected path;
- retains no-repair wording.

- [ ] **Step 2: Write terminal-mode regression tests**

Assert default prompt still uses `renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionWorkV1' })` semantics and ordinary current tests remain unchanged.

- [ ] **Step 3: Write RED run wiring test**

Call `runSolutionAgent()` in artifact-backed mode with a fake Participant that writes a valid Solution artifact + receipt.

Assert returned `result` is the validated `SolutionWorkV1`, references/identity checks run normally, and downstream-facing result paths remain compatible.

- [ ] **Step 4: Implement conditional prompt composition**

Use `renderArtifactBackedStructuredFinalResultInstructionsV1()` only for artifact mode; otherwise retain the existing shared terminal contract.

Remove the terminal-specific “Final JSON serialization check” from artifact mode or rewrite it to validate the fixed artifact, not the terminal receipt.

- [ ] **Step 5: Wire execution mode**

Pass `structuredResultDelivery` to `runStructuredParticipantExecution()`.

For artifact mode, force `retransmissionEnabled: false` regardless of the existing Solution terminal retransmission policy.

Do not alter `isEnvelopeRetransmissionEnabledForRole('solution')` for terminal-mode flows.

- [ ] **Step 6: Preserve result/evidence semantics**

After acceptance:

- `result.json` remains the canonical accepted `SolutionWorkV1`;
- raw transport artifact remains separately preserved by Task 3;
- terminal receipt remains separately preserved;
- `SolutionAgentRunResult.result` remains `SolutionWorkV1`.

Reviewer/downstream code must need no transport-mode branch.

- [ ] **Step 7: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

`npm exec -- tsx tests/evolution/artifactBackedStructuredParticipantExecution.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  tests/evolution/solutionAgentLoop.test.ts
git commit -m "feat: use artifact-backed delivery for controlled solution"
```

### Task 5: Add artifact-backed synthetic matrix and historical Solution-only probe

**Files:**
- Create: `scripts/evolution/contractConformance/referenceArtifactBackedCommunicationMatrix.ts`
- Create: `scripts/evolution/contractConformance/runReferenceArtifactBackedCommunicationMatrix.ts`
- Create: `tests/evolution/referenceArtifactBackedCommunicationMatrix.test.ts`
- Modify: `scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts`
- Create: `scripts/evolution/autonomousAuthoring/runPreschoolReferenceArtifactBackedSolutionProbe.ts`
- Create: `tests/evolution/preschoolReferenceArtifactBackedSolutionProbe.test.ts`
- Modify: `package.json`

**Interfaces:**
- Reuse the existing exported `buildSyntheticLargeEnvelopePayload()` and `validateSyntheticLargeEnvelopePayload()` from `referenceParticipantCommunicationMatrix.ts`; do not fork the synthetic payload semantics.
- Synthetic evidence:

```ts
export interface ReferenceArtifactBackedCommunicationMatrixV1 {
  schemaVersion: 'reference-artifact-backed-communication-matrix-v1';
  implementationSha: string;
  bindingLockRef: 'binding-lock.json';
  bindingLockSha256: string;
  status: 'PASS' | 'SYNTHETIC_FAILED' | 'BINDING_DRIFT' | 'RUNNER_FAILURE';
  trials: readonly ArtifactBackedSyntheticTrialEvidenceV1[];
}
```

- Historical probe function reuses the existing private Preschool historical preparation path but calls `runSolutionAgent()` with artifact-backed delivery.

- [ ] **Step 1: Write RED synthetic matrix tests**

Pin:

- new evidence root must be outside governed history;
- tracked implementation must be clean;
- one V2 artifact-backed binding lock is captured create-only and reused for all three trials;
- exactly three synthetic trials are required with `300_000ms` observation ceiling each;
- synthetic prompt requires fixed artifact + receipt, not large terminal output;
- each trial passes only when process completes, receipt/integrity/envelope/structure all pass;
- no continuation is invoked;
- evidence never writes `attempt-*`, promotion artifacts, or governed history.

- [ ] **Step 2: Implement the dedicated artifact-backed matrix**

Do not mutate or overload the existing terminal Matrix A/B/C evidence schema.

Default evidence root:

`.tmp/evolution/reference-artifact-backed-communication/<matrix-ref>/`

Use the production `runStructuredParticipantExecution()` artifact-backed mode, not the throwaway spike harness.

Use three independent disposable workspaces.

- [ ] **Step 3: Add matrix CLI/package script**

Add:

`evolution:reference-communication:artifact-backed-matrix`

Require explicit model, reasoning effort, config path, and matrix ref using the same style as the existing matrix CLI.

- [ ] **Step 4: Write RED historical probe gate/containment tests**

The new probe CLI must require:

- exact historical evidence;
- observable payload;
- responsibility brief;
- probe ref;
- binding lock from a passing artifact-backed matrix.

Reject:

- terminal matrix V1/V2 binding evidence;
- failing/incomplete artifact-backed matrix;
- matrix implementation SHA different from current clean `HEAD`;
- governed-history binding roots;
- symlink aliases into governed history.

- [ ] **Step 5: Reuse historical preparation without copying semantics**

In `runPreschoolReferenceTrial.ts`, expose one new function:

```ts
export async function runPreschoolReferenceArtifactBackedSolutionCommunicationProbe(...)
```

It must reuse the same historical input validation, disposable workspace materialization, authority packet, responsibility brief, contamination guards, and authoritative fingerprint checks as the existing Solution-only probe.

Only the binding type and `structuredResultDelivery` differ.

- [ ] **Step 6: Implement artifact-backed historical probe result evidence**

Record:

- implementation SHA;
- binding-lock SHA;
- runtime outcome;
- receipt validation;
- artifact integrity validation;
- artifact envelope validation;
- Role-schema validation attempted/valid;
- reachedRoleSchemaValidation;
- authoritative fingerprint before/after;
- governed history SHA before/after.

No Reviewer/Shadow/promotion path is allowed.

- [ ] **Step 7: Add probe CLI/package script**

Add:

`evolution:reference-communication:artifact-backed-solution-probe`

The CLI must load the exact passing matrix `binding-lock.json` and sibling matrix evidence.

- [ ] **Step 8: Run focused tests**

Run:

`npm exec -- tsx tests/evolution/referenceArtifactBackedCommunicationMatrix.test.ts`

`npm exec -- tsx tests/evolution/preschoolReferenceArtifactBackedSolutionProbe.test.ts`

`npm exec -- tsx tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

Expected: PASS. Existing terminal-mode probe behavior must remain unchanged.

- [ ] **Step 9: Commit**

```bash
git add scripts/evolution/contractConformance/referenceArtifactBackedCommunicationMatrix.ts \
  scripts/evolution/contractConformance/runReferenceArtifactBackedCommunicationMatrix.ts \
  tests/evolution/referenceArtifactBackedCommunicationMatrix.test.ts \
  scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts \
  scripts/evolution/autonomousAuthoring/runPreschoolReferenceArtifactBackedSolutionProbe.ts \
  tests/evolution/preschoolReferenceArtifactBackedSolutionProbe.test.ts \
  package.json
git commit -m "feat: add artifact-backed communication validation"
```

### Task 6: Verify implementation, run live artifact-backed evidence, and stop at Layer A reopening review

**Files:**
- Modify only from actual evidence: `docs/governance/current-product-stage.md`
- Evidence: `.tmp/evolution/reference-artifact-backed-communication/**`
- Evidence: `.tmp/evolution/preschool-reference-artifact-backed-solution-probes/**`

**Interfaces:**
- Consumes Tasks 1–5.
- Produces deterministic verification + 3 synthetic trials + at most 2 historical Solution-only probes.
- Does not produce a governed authorization or `attempt-000012`.

- [ ] **Step 1: Run all focused deterministic tests**

Run:

`npm exec -- tsx tests/evolution/artifactBackedStructuredFinalResult.test.ts`

`npm exec -- tsx tests/evolution/artifactBackedStructuredParticipantExecution.test.ts`

`npm exec -- tsx tests/evolution/referenceParticipantBinding.test.ts`

`npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts`

`npm exec -- tsx tests/evolution/referenceArtifactBackedCommunicationMatrix.test.ts`

`npm exec -- tsx tests/evolution/preschoolReferenceArtifactBackedSolutionProbe.test.ts`

`npm exec -- tsx tests/evolution/preschoolReferenceSolutionCommunicationProbe.test.ts`

Expected: PASS.

- [ ] **Step 2: Run regression suites**

Run:

`npm run test:evolution:autonomous-authoring`

`npm run test:evolution:solution-replay`

`npm run typecheck`

`git diff --check`

Expected: all gating commands exit 0.

Report any unrelated pre-existing failure by name; do not silently omit it or broaden scope without causal relevance.

- [ ] **Step 3: Commit/push implementation before live evidence**

Confirm:

- all intended tracked implementation is committed on `dev`;
- `origin/dev` equals local `dev`;
- only the user's known untracked governance file remains;
- `DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS === 1_800_000`;
- terminal retransmission constant remains `60_000`;
- no artifact-backed continuation path exists.

Record exact implementation SHA.

- [ ] **Step 4: Capture a fresh artifact-backed sealed binding**

Use a new matrix ref and new evidence root.

Explicitly record current:

- Codex executable real path/version;
- model;
- reasoning effort;
- ambient config SHA;
- receipt schema SHA;
- delivery mode/version;
- fixed result path;
- binding-lock canonical SHA.

Do not reuse the old terminal matrix binding lock.

- [ ] **Step 5: Run the 3-trial synthetic artifact-backed matrix**

Gate: 3/3 must:

- complete within `300_000ms`;
- return valid small receipt;
- produce fixed-path artifact;
- match receipt bytes/SHA;
- satisfy size ceiling;
- satisfy artifact JSON envelope;
- satisfy synthetic structural validation;
- use no Host repair;
- use zero continuations.

If any trial fails, STOP. Do not run historical probes.

- [ ] **Step 6: Verify synthetic containment**

Before historical probes, independently confirm:

- authoritative repository fingerprint unchanged;
- governed history SHA unchanged;
- `attempt-000012` absent;
- admission lock absent;
- no Reviewer/Shadow/promotion artifacts;
- prior terminal matrices/spikes unchanged.

- [ ] **Step 7: Run historical Solution-only artifact-backed probe #1**

Use exact preserved historical accepted evidence, observable payload, and Human-approved responsibility brief.

Gate:

- completes before `1_800_000ms`;
- valid receipt;
- integrity-valid fixed artifact;
- artifact envelope valid;
- Host reaches `SolutionWorkV1` schema validation;
- authoritative fingerprint unchanged;
- governed history unchanged.

A Role-schema failure still counts as “transport reached Role schema”; it does not count as semantic success.

If the probe times out before valid artifact/receipt or fails transport/integrity/envelope, STOP and do not run probe #2 unless the failure is clearly an external transient and rerunning would not violate the no-retry evidence policy. Default is STOP.

- [ ] **Step 8: Run historical probe #2**

Only if probe #1 reaches Host Role-schema validation without containment failure.

Use a fresh disposable workspace and probe ref with the exact same sealed binding and historical inputs.

Apply the same gate.

- [ ] **Step 9: Verify final containment**

Confirm after live evidence:

- authoritative fingerprint before/after runtime evidence identical;
- governed history SHA before/after identical;
- `attempt-000012` absent;
- admission lock absent;
- Reviewer/Shadow invocation absent;
- promotion package/patch absent;
- user untracked governance file SHA unchanged.

- [ ] **Step 10: Update stage documentation from actual evidence**

If synthetic matrix fails: document the earliest artifact-backed transport boundary and keep Layer A frozen.

If synthetic passes but either historical probe fails before Role-schema validation: document that artifact-backed synthetic transport is verified but historical Solution transport remains unverified; keep Layer A frozen.

If synthetic 3/3 and both historical probes reach Role-schema validation: document that the artifact-backed communication gate is satisfied for the exact sealed binding and that a new governed Layer A campaign **may be proposed**. State explicitly that no new attempt is authorized yet.

- [ ] **Step 11: Final verification and stage-doc commit**

Run:

`git diff --check`

Commit/push only evidence-derived stage documentation changes.

- [ ] **Step 12: Stop and report**

Return one consolidated report with:

- final `dev` SHA and task commits;
- focused/regression verification;
- exact artifact-backed binding facts and lock SHA;
- receipt schema SHA;
- synthetic 3-trial results/timings/integrity facts;
- historical probe #1/#2 results if run;
- whether each reached Role-schema validation;
- authoritative fingerprint before/after;
- governed history SHA before/after;
- zero retransmissions confirmation;
- `1_800_000ms` / `60_000ms` production constants unchanged;
- `attempt-000012` absent;
- admission lock absent;
- Reviewer/Shadow/promotion absent;
- whether the Layer A reopening gate is satisfied.

Even if the reopening gate is satisfied, STOP. Do not generate an `attempt-000012` authorization candidate. A new governed Layer A campaign requires separate Human approval.
