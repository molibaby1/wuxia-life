# Phase 0 Packed Passive Authored-ID Provenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use the repository's TDD and verification-before-completion methods to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Status: `COMPLETED / HISTORICAL — archived after implementation 2026-09-24` Execution chronology: - Accepted design authority landed at: `a666cc8efbd623b16f07446f5e0c8f17087959d6` - This implementation plan was used locally for execution but was not committed before implementation. - Implementation landed at: `c5c998920adb0aa67f6e56c119aef04c00771443` - This document is retained as the historical execution plan and must not be interpreted as evidence that the plan commit preceded the implementation commit.

**Goal:** Preserve exact ordered packed-passive authored IDs in the already-sealed internal Phase 0 player-surface source, without changing gameplay, observable payload bytes, Participant evidence permissions, or bounded causal-attribution scope.

**Architecture:** Add one optional internal-only `passiveEntryIds?: string[]` field to `HeadlessApiPlayerSurfaceStep`. Capture it in `runPassiveProgressionStep()` from the same current `annualPassiveMemory.entries` that produced the visible passive card, before acknowledgement. Keep the current source version and existing Phase 0 artifact/seal structure; the observable projector and bounded causal-attribution semantics remain unchanged.

**Tech Stack:** TypeScript, Node.js, `tsx`, existing headless runner / Phase 0 tooling, Node `assert`.

**Spec:** `docs/superpowers/specs/2026-09-23-phase0-packed-passive-authored-id-provenance-design.md`

## Global Constraints

- Authority identifier: `phase0-packed-passive-authored-id-provenance-20260923`.
- Starting baseline for implementation: `dev@a666cc8efbd623b16f07446f5e0c8f17087959d6`.
- Keep `HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION = 'headless-api-player-surface-source-v1'`.
- Do not add a new Phase 0 artifact.
- Do not modify `scripts/evolution/phase0/runPhase0.ts` or `scripts/evolution/phase0/provenance.ts`.
- Do not modify selection, RNG, passive commit, `eventHistory`, calendar progression, packed-card size, content, AE routing, or gameplay state.
- Do not change the observable transcript schema.
- `passiveEntryIds` is `HUMAN_FORENSIC_ONLY`; it must never enter player-observable payloads.
- Raw `internal/player-surface-source.json` remains Participant-forbidden under PD-111.
- `passive_narrative` remains `attribution.kind == 'unavailable'` in bounded causal attribution.
- Historical v1 player-surface sources without `passiveEntryIds` must remain readable.
- If correctness requires a new artifact, v2 source schema, Participant permission expansion, full experience trace/state-delta retention, or durable-evidence redesign: STOP and return to Human review.
- No production code before the required feature RED is observed.
- Do not run AE, ordinary evolution, replay, or Natural PVER as part of this implementation.

---



## File Structure

Expected production modifications:

- `src/headless/playability/playerSurfaceCapture.ts:40-58`
  - Owns the internal player-surface step shape.
  - Add the optional `passiveEntryIds` provenance field only.
- `src/headless/playability/runnerSteps.ts:472-492`
  - Owns passive progression capture.
  - Copy exact IDs from current `annualPassiveMemory.entries` into the player-surface step before acknowledgement.

Expected test modifications:

- `tests/evolution/playerSurfaceCapture.test.ts:12+`
  - Real headless-run proof that captured packed-passive IDs equal the IDs actually committed for that same passive step.
- `tests/evolution/phase0EndToEnd.test.ts:52+`
  - Real sealed Phase 0 proof that internal evidence contains IDs and reviewer payload does not.
- `tests/evolution/playerObservableTranscript.test.ts:11+`
  - Projection invariance / non-leak proof.
- `tests/evolution/boundedCausalAttribution.test.ts:39+, 202+`
  - PD-111 boundary proof that passive attribution remains unavailable and authored IDs do not enter diagnostic output.

No other file is expected to change.

---



### Task 1: RED — Prove real headless passive provenance is missing

**Files:**

- Modify: `tests/evolution/playerSurfaceCapture.test.ts:12+`
- Production: none

**Interfaces:**

- Consumes: `runHeadlessPersona(...)`, current `playerSurfaceTrace`, current `experienceTrace`.
- Produces: a failing regression that compares future `passiveEntryIds` against `ExperienceTrace.stateDelta.eventHistoryAdded` for the same packed passive acknowledgements.

- [ ] **Step 1: Extend the existing real headless capture run to request experience trace**

Change the existing capture run from:

```ts
const capturedRun = await runHeadlessPersona({
  persona,
  endAge: 8,
  catalogVersion: '1.0.0',
  seed: 101,
  maxSteps: 320,
  playerSurfaceTrace: true,
});
```

to:

```ts
const capturedRun = await runHeadlessPersona({
  persona,
  endAge: 8,
  catalogVersion: '1.0.0',
  seed: 101,
  maxSteps: 320,
  experienceTrace: true,
  playerSurfaceTrace: true,
});
```

- [ ] **Step 2: Add the feature RED using real runtime evidence**

After the existing player-surface assertions, add:

```ts
const preschoolSurfaceSteps = (capturedRun.playerSurfaceTrace?.steps ?? []).filter(
  step =>
    step.kind === 'passive_narrative'
    && typeof step.age === 'number'
    && step.age >= 4
    && step.age <= 7,
);
const preschoolTraceSteps = (capturedRun.experienceTrace?.steps ?? []).filter(
  step =>
    step.phaseBefore === 'passive_progression'
    && step.presentation?.passiveNarrative !== undefined
    && step.age >= 4
    && step.age <= 7,
);

assert.ok(preschoolSurfaceSteps.length > 0, 'fixture must capture preschool passive cards');
assert.equal(
  preschoolSurfaceSteps.length,
  preschoolTraceSteps.length,
  'player-surface and experience trace must observe the same preschool passive acknowledgements',
);

for (let index = 0; index < preschoolSurfaceSteps.length; index += 1) {
  const surfaceStep = preschoolSurfaceSteps[index]!;
  const traceStep = preschoolTraceSteps[index]!;
  const passiveEntryIds = (
    surfaceStep as typeof surfaceStep & { passiveEntryIds?: string[] }
  ).passiveEntryIds;

  assert.equal(surfaceStep.age, traceStep.age, 'paired passive evidence must preserve age');
  assert.ok(passiveEntryIds, 'packed passive surface step must preserve exact authored IDs');
  assert.equal(passiveEntryIds.length, 3, 'preschool packed passive card preserves three source IDs');
  assert.ok(
    passiveEntryIds.every(id => typeof id === 'string' && id.length > 0),
    'packed passive provenance contains only non-empty authored IDs',
  );
  assert.deepEqual(
    passiveEntryIds,
    traceStep.stateDelta.eventHistoryAdded,
    'captured packed-passive IDs must equal the IDs actually committed by the same acknowledgement',
  );
}
```

The cast is intentional: it allows the runtime RED to fail because the field is absent, instead of making the test fail only at TypeScript compile time.

- [ ] **Step 3: Run the RED**

Run:

```bash
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
```

Expected: exit `1`.

Expected failure must be the missing provenance assertion, such as:

```text
packed passive surface step must preserve exact authored IDs
```

If it fails for fixture setup, max-step exhaustion, unrelated trace mismatch, or another reason, fix the test fixture and rerun until the missing provenance is the cause.

Do not modify production yet.

---



### Task 2: RED — Prove sealed Phase 0 lacks the same provenance

**Files:**

- Modify: `tests/evolution/phase0EndToEnd.test.ts:52+`
- Production: none

**Interfaces:**

- Consumes: real `runPhase0(...)` output already created by the test.
- Produces: a second failing feature regression at the sealed-artifact boundary.

- [ ] **Step 1: Inspect the already-loaded** `surfaceSource` **for preschool passive steps**

Immediately after:

```ts
const surfaceSource = JSON.parse(await readFile(
  join(first.outDir, 'internal', 'player-surface-source.json'),
  'utf8',
));
```

add a typed local view:

```ts
const passiveSourceSteps = (
  surfaceSource as {
    steps?: Array<{
      kind?: string;
      age?: number;
      passiveEntryIds?: string[];
    }>;
  }
).steps?.filter(
  step =>
    step.kind === 'passive_narrative'
    && typeof step.age === 'number'
    && step.age >= 4
    && step.age <= 7,
) ?? [];

assert.ok(passiveSourceSteps.length > 0, 'sealed fixture must contain preschool passive surface steps');

const firstPreschoolPassive = passiveSourceSteps[0]!;
assert.ok(
  firstPreschoolPassive.passiveEntryIds,
  'sealed internal player-surface source must preserve packed-passive authored IDs',
);
assert.equal(
  firstPreschoolPassive.passiveEntryIds.length,
  3,
  'sealed preschool passive provenance preserves three source IDs',
);
```

The existing Phase 0 fixture runs to age 12, so do not add a second simulation just for this assertion.

- [ ] **Step 2: Add reviewer-payload non-leak assertions using the recovered IDs**

After the presence assertion, add:

```ts
assert.equal(
  firstPayloadBytes.includes('"passiveEntryIds"'),
  false,
  'reviewer payload must not expose internal passive provenance key',
);
for (const id of firstPreschoolPassive.passiveEntryIds) {
  assert.equal(
    firstPayloadBytes.includes(id),
    false,
    `reviewer payload must not expose internal passive authored ID ${id}`,
  );
}
```

At RED time the test should fail before these loop assertions because the internal provenance is absent.

- [ ] **Step 3: Run the Phase 0 RED**

Run:

```bash
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
```

Expected: exit `1` because `passiveEntryIds` is absent from the sealed internal source.

Do not modify Phase 0 orchestration or sealing to satisfy this test.

---



### Task 3: GREEN — Add the minimal internal provenance capture

**Files:**

- Modify: `src/headless/playability/playerSurfaceCapture.ts:40-58`
- Modify: `src/headless/playability/runnerSteps.ts:472-492`
- Test: `tests/evolution/playerSurfaceCapture.test.ts`
- Test: `tests/evolution/phase0EndToEnd.test.ts`

**Interfaces:**

- Produces: `HeadlessApiPlayerSurfaceStep.passiveEntryIds?: string[]`.
- Source of truth: the current `HeadlessProgressionVolatileState.annualPassiveMemory.entries`.
- Consumer boundary: internal sealed player-surface source only; projector remains unchanged.

- [ ] **Step 1: Add the optional internal field**

In `HeadlessApiPlayerSurfaceStep`, add:

```ts
/** Exact ordered packed-passive source IDs for Human forensic provenance; never player-visible. */
passiveEntryIds?: string[];
```

Do not change:

```ts
HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION
```

Do not add the field to `HeadlessApiSurfacePresentationCard` or any player-visible type.

- [ ] **Step 2: Capture IDs from the same volatile plan before acknowledgement**

Replace the start of `runPassiveProgressionStep()` with the minimal equivalent structure:

```ts
export async function runPassiveProgressionStep(ctx: RunnerStepContext): Promise<void> {
  if (ctx.session.getTerminalState()) return;
  const stateBefore = snapshotStateForRecord(ctx.session);
  const progression = ctx.session.getProgressionVolatileState();
  const passive = progression.passiveNarrative;
  const annualPassiveMemory = progression.annualPassiveMemory;

  if (passive && playerSurfaceCaptureEnabled(ctx)) {
    recordPlayerSurfaceStep(ctx, {
      kind: 'passive_narrative',
      age: stateBefore.player?.age ?? 0,
      experienceContext: buildExperienceSemanticContext({
        age: stateBefore.player?.age ?? 0,
        kind: 'passive_narrative',
      }),
      ...(annualPassiveMemory
        ? { passiveEntryIds: annualPassiveMemory.entries.map(entry => entry.id) }
        : {}),
      presentationCards: [buildPassiveSurfacePresentation(passive)],
    });
  }

  await ctx.session.acknowledgeProgression('passive_continue');
  recordExperienceTrace(ctx, stateBefore, 'passive_progression', {
    ...(passive ? { presentation: { passiveNarrative: cloneExperienceTraceValue(passive) } } : {}),
    acknowledgement: { kind: 'passive_continue' },
  });
}
```

Important:

- Copy IDs before `acknowledgeProgression`.
- Do not read them back from `eventHistory`.
- Do not derive from visible title/body.
- Do not mutate `annualPassiveMemory`.
- Omit the field if `annualPassiveMemory` is absent.
- Do not encode absence as `[]`.

- [ ] **Step 3: Run the two feature tests**

Run:

```bash
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
```

Expected: both exit `0`.

If either requires changes to Phase 0 artifact inventory, source versioning, passive selection, commit semantics, or event history: STOP and return to Human review.

- [ ] **Step 4: Add a direct gameplay-isolation assertion to the headless capture test**

Use the same persona/seed/endAge with and without player-surface capture:

```ts
const withoutSurfaceCapture = await runHeadlessPersona({
  persona,
  endAge: 8,
  catalogVersion: '1.0.0',
  seed: 101,
  maxSteps: 320,
  experienceTrace: true,
});

assert.deepEqual(
  capturedRun.finalGameState,
  withoutSurfaceCapture.finalGameState,
  'internal player-surface provenance capture must not change final gameplay state',
);
```

Do not compare timestamp-bearing process records.

- [ ] **Step 5: Re-run the headless test**

Run:

```bash
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
```

Expected: exit `0`.

---



### Task 4: Lock the player-observable non-leak boundary

**Files:**

- Modify: `tests/evolution/playerObservableTranscript.test.ts:11+`
- Production: none

**Interfaces:**

- Consumes: `projectHeadlessApiPlayerObservablePayload(...)`.
- Produces: byte-level proof that optional internal passive provenance is projection-inert.

This is an invariant regression. It preserves existing projector behavior and therefore may pass immediately after Task 3; do not invent an artificial RED.

- [ ] **Step 1: Add an isolated passive projection fixture**

Add:

```ts
const passiveSourceWithIds: HeadlessApiPlayerSurfaceTrace = {
  schemaVersion: HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  steps: [{
    sequence: 1,
    kind: 'passive_narrative',
    age: 6,
    passiveEntryIds: [
      'internal-passive-alpha',
      'internal-passive-beta',
      'preschool_passive_gap::internal-gap',
    ],
    presentationCards: [{
      title: '6岁这一季',
      body: '【可见甲】正文甲\n\n【可见乙】正文乙\n\n【寻常一季】正文丙',
    }],
  }],
};

const passiveSourceWithoutIds = structuredClone(passiveSourceWithIds);
delete passiveSourceWithoutIds.steps[0]!.passiveEntryIds;

const withInternalIds = serializeObservablePayload(
  projectHeadlessApiPlayerObservablePayload(passiveSourceWithIds),
);
const withoutInternalIds = serializeObservablePayload(
  projectHeadlessApiPlayerObservablePayload(passiveSourceWithoutIds),
);

assert.equal(
  withInternalIds,
  withoutInternalIds,
  'internal packed-passive provenance must not change player-observable payload bytes',
);
assert.equal(withInternalIds.includes('"passiveEntryIds"'), false);
for (const internalId of passiveSourceWithIds.steps[0]!.passiveEntryIds ?? []) {
  assert.equal(
    withInternalIds.includes(internalId),
    false,
    `player-observable payload must not expose ${internalId}`,
  );
}
```

Import `HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION` if this test currently imports only the type.

- [ ] **Step 2: Run the projection test**

Run:

```bash
npm exec tsx tests/evolution/playerObservableTranscript.test.ts
```

Expected: exit `0`.

A failure means the internal field leaks or changes projection bytes; fix the capture/projection boundary without changing the observable schema.

---



### Task 5: Lock PD-111 bounded causal-attribution boundary

**Files:**

- Modify: `tests/evolution/boundedCausalAttribution.test.ts:39+, 202+`
- Production: none

**Interfaces:**

- Consumes: current `buildBoundedCausalAttribution(...)`.
- Produces: proof that passive authored IDs remain unavailable to Participant-facing bounded diagnostics.

This is also a boundary invariant and may pass immediately after Task 3.

- [ ] **Step 1: Add a passive step to** `buildSurfaceTrace()`

Append after the existing disturbance step:

```ts
{
  sequence: 7,
  kind: 'passive_narrative',
  age: 20,
  passiveEntryIds: [
    'internal-passive-alpha',
    'internal-passive-beta',
    'preschool_passive_gap::internal-gap',
  ],
  presentationCards: [{
    title: '20岁这一段',
    body: 'Visible passive body',
  }],
},
```

Do not alter the existing first six steps or their observable-entry mapping.

Because this step is appended and emits one presentation card, it maps to:

```text
entry-000007
```

- [ ] **Step 2: Add a focused passive attribution build**

After the existing `unavailable` period-summary case, add:

```ts
const passivePath = join(root, 'diagnostic/passive-unavailable.json');
const passiveSelection = await writeSelection(
  join(root, 'passive-unavailable'),
  ['entry-000007'],
);
const passiveUnavailable = await buildBoundedCausalAttribution({
  sealedPhase0SourceRoot: sourceRoot,
  sealedObservablePayloadPath: observablePath,
  selectedHypothesisPath: passiveSelection,
  sourceRunRef: 'cohort-run-000001',
  sourceExperimentRootHash: HASH_A,
  destinationPath: passivePath,
});

assert.equal(passiveUnavailable.items[0]?.sourceKind, 'passive_narrative');
assert.equal(passiveUnavailable.items[0]?.attribution.kind, 'unavailable');

const passiveDiagnosticBytes = await readFile(passivePath, 'utf8');
for (const internalId of surface.steps[6]!.passiveEntryIds ?? []) {
  assert.equal(
    passiveDiagnosticBytes.includes(internalId),
    false,
    `bounded causal attribution must not expose passive authored ID ${internalId}`,
  );
}
```

- [ ] **Step 3: Explicitly prove historical v1 absence remains readable**

Create a clone with the optional field removed:

```ts
const historicalV1 = structuredClone(surface);
delete historicalV1.steps[6]!.passiveEntryIds;

assert.doesNotThrow(() =>
  projectHeadlessApiPlayerObservablePayload(historicalV1),
);
```

Do not add migration logic.

- [ ] **Step 4: Run the bounded attribution test**

Run:

```bash
npm exec tsx tests/evolution/boundedCausalAttribution.test.ts
```

Expected: exit `0`.

If making it pass requires expanding `bounded-causal-attribution-v1`, STOP.

---



### Task 6: Run focused semantic verification

**Files:**

- No new modifications expected.

- [ ] **Step 1: Run all directly affected tests fresh**

Run:

```bash
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
npm exec tsx tests/evolution/playerObservableTranscript.test.ts
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
npm exec tsx tests/evolution/boundedCausalAttribution.test.ts
```

Expected: all exit `0`.

- [ ] **Step 2: Run adjacent Phase 0 / seal / retention regressions**

Run:

```bash
npm exec tsx tests/evolution/runPhase0Tests.ts
npm exec tsx tests/evolution/phase0Provenance.test.ts
npm exec tsx tests/evolution/ordinaryEvidenceAllowlist.test.ts
```

Expected: all exit `0`.

These prove that:

- Phase 0 still seals and validates;
- no new required sealed artifact was introduced;
- the existing data-access/seal structure remains intact;
- durable evidence allowlisting can retain the enriched internal artifact without schema redesign.

- [ ] **Step 3: Run typecheck and diff hygiene**

Run:

```bash
npm run typecheck
git diff --check
```

Expected: both exit `0`.

Do not use repository-wide `npm test` as a reason to repair unrelated failures. If it is run, report its actual result without expanding scope.

---



### Task 7: Strong regression proof

**Files:**

- Keep all four new/modified test files in place.
- Temporarily revert only the two production files.

**Interfaces:**

- Proves the feature tests depend on the production capture change rather than passing accidentally.

- [ ] **Step 1: Save the production patch**

From the implementation starting SHA:

```bash
git diff a666cc8efbd623b16f07446f5e0c8f17087959d6 -- \
  src/headless/playability/playerSurfaceCapture.ts \
  src/headless/playability/runnerSteps.ts \
  > /tmp/phase0-packed-passive-provenance-production.patch
```

- [ ] **Step 2: Revert only production files to the starting SHA**

```bash
git checkout a666cc8efbd623b16f07446f5e0c8f17087959d6 -- \
  src/headless/playability/playerSurfaceCapture.ts \
  src/headless/playability/runnerSteps.ts
```

Do not revert tests.

- [ ] **Step 3: Re-run the two feature regressions and observe RED**

Run:

```bash
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
```

Expected: both fail because packed-passive provenance is absent.

At least the headless capture regression must fail at the exact missing-provenance assertion. If both tests remain green, the regression proof failed; do not continue.

- [ ] **Step 4: Restore the production patch**

Run:

```bash
git apply --check /tmp/phase0-packed-passive-provenance-production.patch
git apply /tmp/phase0-packed-passive-provenance-production.patch
```

- [ ] **Step 5: Re-run all four directly affected tests**

```bash
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
npm exec tsx tests/evolution/playerObservableTranscript.test.ts
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
npm exec tsx tests/evolution/boundedCausalAttribution.test.ts
```

Expected: all exit `0`.

- [ ] **Step 6: Re-run typecheck and diff check after restoration**

```bash
npm run typecheck
git diff --check
```

Expected: both exit `0`.

---



### Task 8: Final scope review and commit

**Files:**

- Modify: `src/headless/playability/playerSurfaceCapture.ts`
- Modify: `src/headless/playability/runnerSteps.ts`
- Modify: `tests/evolution/playerSurfaceCapture.test.ts`
- Modify: `tests/evolution/playerObservableTranscript.test.ts`
- Modify: `tests/evolution/phase0EndToEnd.test.ts`
- Modify: `tests/evolution/boundedCausalAttribution.test.ts`

- [ ] **Step 1: Verify exact changed-file scope**

Run:

```bash
git diff --name-only
```

Expected exactly:

```text
src/headless/playability/playerSurfaceCapture.ts
src/headless/playability/runnerSteps.ts
tests/evolution/boundedCausalAttribution.test.ts
tests/evolution/phase0EndToEnd.test.ts
tests/evolution/playerObservableTranscript.test.ts
tests/evolution/playerSurfaceCapture.test.ts
```

If any Phase 0 orchestration, provenance/seal, projector production, durable-evidence production, content, scheduler, or other file changed: STOP.

- [ ] **Step 2: Review the production diff against the accepted architecture**

Run:

```bash
git diff -- \
  src/headless/playability/playerSurfaceCapture.ts \
  src/headless/playability/runnerSteps.ts
```

Confirm all of the following:

```text
one optional field only
one read-only capture point only
source version unchanged
no selection/RNG changes
no acknowledgement changes
no eventHistory changes
no player-visible presentation changes
no projector changes
```

- [ ] **Step 3: Review test coverage against the spec**

Confirm:

```text
real runtime capture → exact committed IDs
sealed internal artifact → IDs present
observable projection → byte-identical with/without IDs
reviewer payload → no key/no IDs
bounded causal attribution → unavailable/no IDs
historical v1 without field → still readable
finalGameState with/without player-surface capture → identical
seal/retention regressions → green
```

- [ ] **Step 4: Stage only the six implementation files**

```bash
git add \
  src/headless/playability/playerSurfaceCapture.ts \
  src/headless/playability/runnerSteps.ts \
  tests/evolution/playerSurfaceCapture.test.ts \
  tests/evolution/playerObservableTranscript.test.ts \
  tests/evolution/phase0EndToEnd.test.ts \
  tests/evolution/boundedCausalAttribution.test.ts
```

- [ ] **Step 5: Verify staged diff**

```bash
git diff --cached --check
git diff --cached --name-only
git diff --cached
```

The staged file list must be exactly the six files above.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: preserve packed passive provenance"
```

- [ ] **Step 7: Push and verify**

```bash
git push origin dev
git rev-parse HEAD
git rev-parse origin/dev
git status --short
```

Acceptance:

```text
HEAD == origin/dev
working tree clean
```

---



## Acceptance Criteria

Implementation is accepted only when fresh evidence proves all of the following:

1. New sealed Phase 0 internal player-surface source records exact ordered `passiveEntryIds` for packed passive cards.
2. Preschool packed cards preserve three exact source IDs.
3. Captured IDs equal the IDs actually committed by the same passive acknowledgement.
4. Generic gap IDs are preserved when they are actual packed source IDs.
5. `reviewer-input/observable-payload.json` does not expose the key or internal authored IDs.
6. Projected observable bytes are identical for otherwise identical source traces with vs. without `passiveEntryIds`.
7. Final gameplay state is identical with vs. without player-surface capture for the fixed test run.
8. `passive_narrative` remains unavailable in bounded causal attribution and diagnostic bytes do not expose passive IDs.
9. Historical v1 source without the optional field remains readable.
10. Existing Phase 0 seal and required-artifact structure remains unchanged.
11. Existing durable evidence allowlisting accepts the enriched sealed internal source without schema changes.
12. Production changes are limited to `playerSurfaceCapture.ts` and `runnerSteps.ts`.
13. No AE, replay, or Natural PVER is run during implementation.
14. Strong regression proof demonstrates the feature tests fail when only the two production changes are reverted and pass again after restoration.



## Review Focus

Reviewers should pay particular attention to:

- provenance being captured from `annualPassiveMemory.entries` before acknowledgement;
- preservation of exact ordering, including gap IDs;
- no title/text reverse mapping;
- no post-commit `eventHistory` reconstruction;
- no new Phase 0 artifact;
- no source-version bump;
- no projector production change;
- no PD-111 authority expansion;
- no accidental gameplay mutation;
- no hidden ID leakage into reviewer or diagnostic outputs.



## Completion Report Contract

The executor must report:

1. starting HEAD / `origin/dev` / clean status;
2. RED command, exit code, and exact failure for player-surface capture;
3. RED command, exit code, and exact failure for sealed Phase 0;
4. exact production files changed;
5. exact test files changed;
6. directly affected test exit codes;
7. adjacent Phase 0 / provenance / retention test exit codes;
8. typecheck and `git diff --check` exits;
9. strong regression proof: GREEN → production-only revert → RED → restore → GREEN;
10. proof that observable bytes with/without internal IDs are identical;
11. proof that bounded passive attribution remains unavailable;
12. proof that historical v1 without the field remains readable;
13. final changed-file list;
14. implementation commit SHA;
15. push-after `HEAD` / `origin/dev`;
16. ending working-tree status;
17. explicit confirmation that no AE, replay, Natural PVER, content change, Phase 0 artifact/schema change, or Participant permission expansion occurred.

`NEXT_REVIEW_INPUT: REPOSITORY_REQUIRED`