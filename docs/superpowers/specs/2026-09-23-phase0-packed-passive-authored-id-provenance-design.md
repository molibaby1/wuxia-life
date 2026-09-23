# Phase 0 Packed Passive Authored-ID Provenance Design

Status: `HUMAN ACCEPTED — 2026-09-23`

Authority identifier: `phase0-packed-passive-authored-id-provenance-20260923`

Baseline: `dev@6a46b2749c301b002420f3f77190ea3439d783bb`

## 1. Purpose

Close the confirmed Phase 0 `MEASUREMENT_PROBLEM` for packed passive-memory provenance without changing gameplay or the player-observable evidence boundary.

The current sealed Phase 0 source preserves the player-visible passive title/body but does not preserve the canonical authored IDs that produced a packed passive card. As a result, exact authored-ID-level capacity accounting currently requires a bounded deterministic diagnostic replay.

This design makes those exact ordered authored IDs available directly in the already-sealed Human-forensic player-surface source while keeping `reviewer-input/observable-payload.json` byte semantics and Participant visibility unchanged.

## 2. Confirmed current implementation facts

At the accepted baseline:

- `src/core/activePlanning/annualPassiveMemory.ts` already has the exact packed source entries through `AnnualPassiveMemoryPlan.entries`.
- `commitAnnualPassiveMemory()` returns those exact authored IDs as `entryIds`.
- `src/headless/session/sessionTypes.ts` exposes `annualPassiveMemory` in progression volatile state.
- `src/headless/playability/runnerSteps.ts` reads the passive presentation before `acknowledgeProgression('passive_continue')`.
- `src/headless/playability/playerSurfaceCapture.ts` currently records only the visible passive presentation in the player-surface step.
- `scripts/evolution/phase0/runPhase0.ts` seals `internal/player-surface-source.json`.
- `reviewer-input/observable-payload.json` is projected from that internal player-surface source.
- `scripts/evolution/phase0/provenance.ts` already includes `internal/player-surface-source.json` in `PHASE0_REQUIRED_SEALED_ARTIFACTS`.
- durable evidence retention already treats sealed Phase 0 internal source material as Human-forensic evidence.
- PD-111 requires Feedback / Hypothesis to remain player-observable only and forbids raw `internal/player-surface-source.json` from Participant workspaces.
- bounded causal attribution currently treats passive narrative steps as `unavailable`.

Therefore the information-loss point is the player-surface capture step, not catalog selection, Phase 0 sealing, or observable projection.

## 3. Accepted design

Extend the existing internal player-surface step with one optional provenance field:

```ts
passiveEntryIds?: string[];
```

The field belongs on:

```ts
HeadlessApiPlayerSurfaceStep
```

in:

```text
src/headless/playability/playerSurfaceCapture.ts
```

For a `kind: 'passive_narrative'` step, when the current progression volatile state contains a packed `annualPassiveMemory`, capture:

```ts
annualPassiveMemory.entries.map(entry => entry.id)
```

in exact display / plan order.

The source becomes conceptually:

```text
AnnualPassiveMemoryPlan.entries
        ↓
HeadlessApiPlayerSurfaceStep.passiveEntryIds
        ↓
internal/player-surface-source.json
        ↓
existing Phase 0 seal
        ↓
Human forensic authored-ID accounting
```

The player-visible projection remains:

```text
presentationCards
        ↓
projectHeadlessApiPlayerObservablePayload()
        ↓
reviewer-input/observable-payload.json
```

The projector must not consume `passiveEntryIds`.

## 4. Provenance semantics

`passiveEntryIds` means:

> The exact ordered source entry IDs of the packed passive-memory plan whose visible presentation is recorded by this same player-surface step.

Rules:

1. Preserve exact plan order.
2. Preserve exact IDs, including generic gap IDs when a packed plan contains them.
3. Ages 0–3 annual packed memory naturally records its existing packed entry count.
4. Ages 4–7 preschool season memory naturally records its existing three-entry packed plan.
5. Do not derive the IDs retrospectively from title/text.
6. Do not recover IDs from `eventHistory` after acknowledgement.
7. Capture from the same volatile plan that produced the visible passive card.
8. If no packed `annualPassiveMemory` exists for a passive presentation, omit `passiveEntryIds`.
9. Do not encode “unknown” as an empty array. Absence means exact packed source provenance was not present at capture time.

This field is diagnostic provenance, not gameplay state and not player-visible content.

## 5. Versioning decision

Keep:

```text
HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION
= headless-api-player-surface-source-v1
```

Do not introduce v2 for this change.

Rationale:

- the new field is additive and optional;
- historical v1 sealed sources without the field remain valid;
- current observable projection does not depend on the field;
- current entry mapping does not depend on the field;
- mechanically bumping to v2 would otherwise force compatibility work in causal-attribution readers for historical sealed sources.

Compatibility semantics:

```text
v1 source without passiveEntryIds
  = historical source did not record exact packed-passive authored provenance

v1 source with passiveEntryIds
  = exact packed-passive authored provenance is available
```

This decision does not authorize arbitrary future additive changes to v1. A future incompatible structural or semantic change must be separately versioned.

## 6. Player-observable and Participant boundary

This design must preserve PD-111.

`passiveEntryIds` is:

```text
HUMAN_FORENSIC_ONLY
```

It is not player-observable evidence.

The following remain unchanged:

### Feedback / Hypothesis

They consume only player-observable evidence.

They must not receive:

```text
passiveEntryIds
internal/player-surface-source.json
```

### Solution / Reviewer

Raw:

```text
internal/player-surface-source.json
```

remains Participant-forbidden.

This change does not authorize raw internal source delivery to Solution or Reviewer.

### Observable payload

`reviewer-input/observable-payload.json` must not contain:

```text
passiveEntryIds
canonical passive authored IDs
generic passive gap IDs as internal provenance
```

unless some ID string independently appears as legitimate player-visible prose, which this design does not introduce.

### Bounded causal attribution

A `passive_narrative` source step remains:

```text
attribution: { kind: 'unavailable' }
```

This design does not authorize passive authored IDs to enter `bounded-causal-attribution-v1`.

The new provenance exists for Human forensic measurement only.

## 7. Phase 0 artifact and sealing boundary

Do not add a new Phase 0 artifact.

Continue using:

```text
internal/player-surface-source.json
```

which is already:

- written by `runPhase0.ts`;
- required by `PHASE0_REQUIRED_SEALED_ARTIFACTS`;
- covered by the experiment-root seal;
- forbidden by the Phase 0 Participant data-access boundary;
- retained as Human-forensic evidence by the durable evidence path.

Therefore this design does not require changes to:

```text
scripts/evolution/phase0/runPhase0.ts
scripts/evolution/phase0/provenance.ts
PHASE0_REQUIRED_SEALED_ARTIFACTS
ExperimentRootManifestV1
phase0-run-data-access-manifest schema
durable evidence artifact inventory
project packaging policy
```

unless implementation evidence proves an unexpected current-code conflict.

If such a conflict is found, STOP and return to Human review rather than broadening the implementation.

## 8. Runtime capture point

The accepted capture point is:

```text
src/headless/playability/runnerSteps.ts
runPassiveProgressionStep()
```

Before:

```ts
acknowledgeProgression('passive_continue')
```

read both:

```text
passiveNarrative
annualPassiveMemory
```

from the same current progression volatile state.

When recording the `passive_narrative` player-surface step:

- presentation remains built only from `passiveNarrative`;
- provenance IDs come only from `annualPassiveMemory.entries`;
- the capture must not mutate either structure;
- the capture must not affect selection, RNG, acknowledgement, eventHistory, time progression, or commit semantics.

## 9. Expected production scope

Expected production changes are limited to:

```text
src/headless/playability/playerSurfaceCapture.ts
src/headless/playability/runnerSteps.ts
```

Expected behavior:

### `playerSurfaceCapture.ts`

Add:

```ts
passiveEntryIds?: string[];
```

to `HeadlessApiPlayerSurfaceStep`.

No change to visible presentation types.

### `runnerSteps.ts`

In `runPassiveProgressionStep()`:

- read the current `annualPassiveMemory`;
- when present, copy `entries.map(entry => entry.id)` into `passiveEntryIds`;
- omit the field when no packed plan is present.

Do not modify the passive plan itself.

## 10. Verification contract

Implementation must use TDD and prove all of the following.

### A. Player-surface provenance capture

In:

```text
tests/evolution/playerSurfaceCapture.test.ts
```

prove with a real headless run that packed passive player-surface steps record exact ordered IDs.

At minimum prove:

- a preschool packed card has exactly three `passiveEntryIds`;
- all IDs are non-empty strings;
- the IDs correspond to the actual packed plan / committed passive entries for that step;
- capture does not expose hidden unrelated state.

Do not prove this only with a hand-built object.

### B. Observable projection non-leak

In:

```text
tests/evolution/playerObservableTranscript.test.ts
```

construct a source containing `passiveEntryIds`.

Prove:

```text
serializeObservablePayload(project(sourceWithIds))
==
serializeObservablePayload(project(sameSourceWithoutIds))
```

and prove serialized observable bytes contain neither:

```text
"passiveEntryIds"
```

nor the test canonical passive IDs.

This is the primary no-player-visible-change regression.

### C. Sealed Phase 0 evidence

In:

```text
tests/evolution/phase0EndToEnd.test.ts
```

prove a real sealed Phase 0 run contains passive provenance in:

```text
internal/player-surface-source.json
```

while:

```text
reviewer-input/observable-payload.json
```

does not contain the provenance key or canonical passive IDs.

Also prove:

- `validatePhase0RunSeal()` still succeeds;
- the existing access boundary remains unchanged;
- no new sealed artifact is required.

### D. Bounded causal attribution remains unavailable

In:

```text
tests/evolution/boundedCausalAttribution.test.ts
```

add a passive surface step with `passiveEntryIds`.

Select its observable entry as hypothesis evidence.

Prove:

```text
sourceKind == 'passive_narrative'
attribution.kind == 'unavailable'
```

and prove the diagnostic artifact does not contain the passive authored IDs.

The new field must not silently expand Participant diagnostic authority.

## 11. Strong non-behavior-change proof

Implementation verification must prove that the change is measurement-only.

For fixed:

```text
same HEAD-equivalent production semantics
same persona
same seed
same endAge
same catalogVersion
same maxSteps
```

the player-visible observable payload generated through the current projector must be identical whether internal passive provenance is considered or ignored.

The intended invariant is:

```text
internal evidence bytes may change
observable payload bytes must not
gameplay state/selection semantics must not
```

No claim is required that the sealed experiment-root hash remains the same; the sealed internal artifact is intentionally enriched, so its hash and the experiment root may legitimately change.

## 12. Regression and compatibility requirements

Existing tests must continue to prove:

- player-visible locked choices remain absent;
- hidden risk/state fields remain absent;
- same semantic inputs reproduce observable payload bytes;
- Phase 0 sealing remains valid;
- data-access boundaries remain valid;
- observable-to-surface entry mapping remains unchanged;
- story-event and active-action causal attribution remain unchanged;
- passive attribution remains unavailable.

Historical sealed v1 artifacts without `passiveEntryIds` must remain readable by current code paths that previously accepted them.

Do not rewrite historical artifacts.

## 13. Explicit non-goals

This design does not authorize:

- changing preschool selection;
- changing annual passive selection;
- changing RNG;
- changing `eventHistory`;
- changing time progression;
- changing packed-card size;
- changing player-visible title/body;
- changing observable transcript schema;
- exposing authored IDs in player-visible payload;
- exposing raw internal source to Participants;
- expanding bounded causal attribution;
- persisting full `experienceTrace`;
- persisting GameState/stateDelta/effects for this purpose;
- adding a new Phase 0 artifact;
- bumping player-surface source version;
- changing experiment-root schema;
- changing durable evidence schema;
- changing content;
- changing AE routing;
- fixing unrelated baseline tests.

## 14. STOP conditions

Implementation must STOP and return to Human review if any of the following is required:

- exact packed IDs cannot be obtained from current `annualPassiveMemory.entries`;
- correct capture requires changing passive commit or selection semantics;
- observable payload changes are necessary;
- Participant evidence permissions must expand;
- a new Phase 0 artifact is required;
- source-version v2 is required for correctness;
- historical v1 source readers become incompatible;
- durable evidence retention must be structurally redesigned;
- implementation needs full experience trace / state delta retention.

These would indicate a larger architecture change than this accepted measurement slice.

## 15. Relationship to existing authority

This design preserves and operates under:

- PD-111 Bounded Causal Attribution Evidence Handoff;
- the current player-observable information boundary;
- the existing Phase 0 sealed-source contract;
- the Durable Evidence Capsule visibility distinction;
- current preschool scheduler/content authorities.

It does not supersede those authorities.

It closes only the confirmed measurement gap:

> sealed Phase 0 evidence previously lacked canonical packed passive authored IDs required for exact Human forensic capacity accounting.

## 16. Success definition

After implementation, a new sealed Phase 0 Natural PVER must be sufficient to answer directly, without diagnostic replay:

```text
Which exact packed passive authored IDs were committed?
Which visible passive card did they produce?
Were generic gaps present?
Was an authored ID reused?
Was a foreign-origin authored ID consumed?
Was the legal authored pool exhausted?
```

while preserving:

```text
same player-visible observable evidence
same gameplay behavior
same Participant evidence permissions
same bounded causal-attribution scope
```

The implementation does not itself close any future product/content gap. It only makes the sealed evidence sufficient for exact passive authored-ID measurement.
