# Generic Relationship Legacy Quarantine / PD-104 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove nine causally invalid generic relationship events from the active runtime, close their direct fabricated-person consumers, preserve explicitly retained transient/social-network content, and reduce the formal runtime catalog from 400 to 391 without creating replacement NPCs or expanding PD-103.

**Architecture:** Keep quarantine as a content/governance operation, not a new runtime subsystem. Move the nine authored legacy events into one dedicated non-runtime JSON source, leave EventLoader architecture unchanged, remove only direct consumer interpretations that depend on dead or non-concrete relationship facts, and prove closure through one aggregate deterministic regression plus existing P17/P18/Life Memory/PD-101/PD-103 regressions.

**Tech Stack:** TypeScript, JSON-authored formal events, existing EventLoader/runtime catalog, Node `tsx` tests, existing event-asset inventory/manifest tooling.

**Spec:** `docs/product/generic-relationship-legacy-quarantine-design.md`

## Global Constraints

- Human design acceptance is complete; implementation authorization is inherited as long as this plan does not add product assumptions or cross a STOP boundary.
- Current development is destructive. Pre-PD-104 legacy content-state continuity is not guaranteed.
- Do not add migration, fallback, history reconstruction, compatibility-only events, aliases, inferred persons, or dead-flag compatibility branches.
- Quarantine exactly these nine active events:
  - `relationship_master_disciple`
  - `relationship_master_betrayal`
  - `relationship_master_legacy`
  - `relationship_blood_brotherhood`
  - `relationship_sworn_help`
  - `relationship_mentor_encounter`
  - `relationship_enemy_create`
  - `relationship_revenge`
  - `p22_relationship_mentor_obligation`
- `relationship_enemy_create` and `relationship_revenge` are retired semantics; retaining their source in the deferred file does not authorize restoration.
- Explicitly retain `relationship_life_saving`, `relationship_debt_return`, and the five accepted social-network events.
- Do not create replacement master, sworn-sibling, mentor, rival/enemy content.
- Do not create new Person Archetypes or expand the PD-103 Sex-Variant catalog.
- Do not add new relationship flags, generic Person/NPC state, Person registry, `person.attributes`, affinity semantics, or Relationship schema changes.
- Do not redesign P17/P18. Only remove/close direct legacy consumers whose producer evidence disappears under PD-104. If P17/P18 requires a new product model to remain coherent, STOP.
- Do not clean up `relationship_life_saving` / `relationship_debt_return` semantics in this task.
- Do not redesign social-network content.
- Expected inventory after the accepted removal is exactly 28 runtime-loaded files / 391 runtime events / 7 active `relationship.json` events. `391` is a consequence of `400 - 9`, never a target to force.
- If the live repository cannot reconcile to `400 - 9 = 391`, STOP and report the inventory difference before changing unrelated content.
- Preserve all unrelated dirty working-tree content.
- Existing repository-level B0/source-freeze, sample-line, event-quality, playability, golden-line, or experience failures remain separate unless the failure is directly caused by PD-104.

---

## File Structure

**Create**

- `docs/product/generic-relationship-legacy-quarantine-design.md` — accepted long-term PD-104 authority.
- `src/data/lines/relationship-person-legacy-deferred.json` — non-runtime source containing exactly the nine quarantined/retired legacy event definitions.
- `tests/genericRelationshipLegacyQuarantine.test.ts` — aggregate runtime/source/consumer/inventory closure regression.

**Modify**

- `docs/product/player-model.md` — minimal delegation to PD-104.
- `docs/governance/product-decisions.md` — append PD-104.
- `docs/README.md` — index the new authority and delegation.
- `src/data/lines/relationship.json` — remove the eight governed relationship events, leaving the seven accepted active relationship events.
- `src/data/lines/p22-content-expansions.json` — remove `p22_relationship_mentor_obligation`.
- `src/core/deriveLifeMemorySummary.ts` — stop promoting generic `has_master` / `has_sworn_siblings` facts into fabricated concrete-person entries / synthetic affinity.
- `src/p18/stateAccess.ts` — remove `master_legacy` consumption if the pre-mutation producer audit confirms the quarantined `relationship_master_legacy` is its only active producer.
- `src/p17/stateAccess.ts`, `src/p17/achievementMaintenance.ts`, or other production files returned by the mandatory flag audit — modify only if they are direct active consumers of `mentor_bond`, `master_legacy`, `has_master`, or `has_sworn_siblings` and the audit proves no independent legitimate producer supports that consumer.
- Existing tests that explicitly assert the quarantined content or `400` formal catalog size — update only where the assertion represents the active runtime catalog or the removed legacy semantic.
- `tests/runRealTestGate.ts` — register the new aggregate regression.
- `src/data/event-asset-manifest.json` — regenerate after the content move.

**Expected existing focused regressions**

- `tests/testLifeMemorySummary.ts`
- `tests/p17ConsequenceTests.ts`
- `tests/p18LegacyTests.ts`
- `tests/p22ContentLibraryTests.ts`
- `tests/p43ArchetypeRecapEndingTests.ts`
- `tests/characterRelationshipMingyueV1.test.ts`
- `tests/characterRelationshipSaiyinV1.test.ts`
- `tests/characterRelationshipMarriageV1.test.ts`
- `tests/introducedMarriageShenQingheV1.test.ts`
- `tests/sexVariantPersonArchetypeV1.test.ts`

**Do not modify**

- `src/core/EventLoader.ts` source-loading architecture.
- `src/data/events.json`.
- Snapshot contracts/schema/version.
- PD-103 catalog/runtime except regression assertions proving it remains unchanged.
- Relationship type/schema or `Relationship.affinity`.
- Mingyue, Saiyin, Shen Qinghe/Shen Zhiheng, Parenthood event content.
- `relationship_life_saving` / `relationship_debt_return`.
- The five retained social-network events.
- P17/P18 product rules outside direct dead-legacy consumer removal.

---

### Task 1: Close PD-104 Repository Authority

**Files:**
- Create: `docs/product/generic-relationship-legacy-quarantine-design.md`
- Modify: `docs/product/player-model.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: Human-approved PD-104 spec.
- Produces: repository authority used by every later implementation task.

- [ ] **Step 1: Add the accepted design as repository authority**

Copy the Human-approved design to:

```text
docs/product/generic-relationship-legacy-quarantine-design.md
```

Do not weaken these points:

```text
- nine governed events leave active runtime;
- enemy/revenge semantics are retired;
- life-saving/debt and five social-network events stay active/out of scope;
- generic relationship booleans cannot fabricate concrete persons;
- destructive development: no legacy content-state compatibility requirement;
- no replacement NPC / PD-103 expansion;
- 400 - 9 = 391 expected inventory;
- mandatory STOP conditions fail closed.
```

- [ ] **Step 2: Add the minimal player-model delegation**

Add one concise delegation beside the Character / Relationship authority references, with substance equivalent to:

```text
Generic Relationship Legacy Quarantine 的 active-content disposition、generic relationship boolean 的 concrete-person consumer boundary 与 future replacement 规则由 PD-104 / Generic Relationship Legacy Quarantine Design 定义；该 decision 不授权 replacement NPC、Relationship v2 或 PD-103 自动 materialization。
```

Do not alter first-layer PlayerState definitions.

- [ ] **Step 3: Append PD-104**

Append `PD-104：Generic Relationship Legacy Quarantine` to `docs/governance/product-decisions.md`.

The decision record must explicitly name:

```text
Quarantine pending redesign:
- relationship_master_disciple
- relationship_master_betrayal
- relationship_master_legacy
- relationship_blood_brotherhood
- relationship_sworn_help
- relationship_mentor_encounter
- p22_relationship_mentor_obligation

Retired semantics:
- relationship_enemy_create
- relationship_revenge

Retained/out of scope:
- relationship_life_saving
- relationship_debt_return
- p28_social_momentum_network_fork
- p28_social_reputation_reinforcement
- p29_social_momentum_patron_obligation
- p42_social_momentum_youth_introduction
- p42_social_momentum_later_testimonial
```

Also record:

```text
ally_network != mentor evidence
no migration/fallback/reconstruction
no replacement person
no new relation flags
no PD-103 expansion
expected active runtime count = 391 from 400 - 9
```

- [ ] **Step 4: Update `docs/README.md`**

Add the PD-104 design under accepted product/governance authorities and update the player-model delegation/index so a fresh session can discover it without reading historical plans.

Do not elevate this implementation plan to first-layer authority.

- [ ] **Step 5: Verify authority consistency**

Run:

```bash
rg -n "PD-104|Generic Relationship Legacy|relationship_master_disciple|relationship_enemy_create|ally_network.*mentor|replacement NPC" \
  docs/product docs/governance docs/README.md
```

Expected: one coherent active authority story; no wording says PD-104 creates replacement persons.

- [ ] **Step 6: Commit authority closure**

```bash
git add docs/product/generic-relationship-legacy-quarantine-design.md \
        docs/product/player-model.md \
        docs/governance/product-decisions.md \
        docs/README.md
git commit -m "docs: record generic relationship legacy quarantine"
```

---

### Task 2: Freeze the Live Producer / Consumer Map Before Mutation

**Files:**
- Read: `src/data/lines/*.json`
- Read: `src/core/deriveLifeMemorySummary.ts`
- Read: `src/p17/**/*.ts`
- Read: `src/p18/**/*.ts`
- Read: other production files returned by the exact searches below
- Test: `tests/genericRelationshipLegacyQuarantine.test.ts`

**Interfaces:**
- Consumes: current 400-event live repository.
- Produces: deterministic pre-mutation evidence for `has_master`, `master_legacy`, `has_sworn_siblings`, `mentor_bond`, and `ally_network`; failing regression skeleton that encodes PD-104 before implementation.

- [ ] **Step 1: Confirm the accepted pre-mutation catalog baseline**

Run:

```bash
npm run report:event-asset-inventory
```

Required precondition:

```text
runtimeLoadedFiles = 28
totalEventsInRuntime = 400
```

Then count the current relationship source IDs:

```bash
node - <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/lines/relationship.json', 'utf8'));
const events = Array.isArray(data) ? data : data.events;
console.log(`relationshipEvents=${events.length}`);
console.log(events.map(e => e.id).join('\n'));
NODE
```

Required precondition:

```text
relationshipEvents=15
```

If either current baseline differs, STOP. Do not reinterpret PD-104 against a different baseline without Human review.

- [ ] **Step 2: Freeze exact occurrences of the five governed facts**

Run:

```bash
rg -n --hidden --glob '!node_modules/**' --glob '!artifacts/**' \
  '\b(has_master|master_legacy|has_sworn_siblings|mentor_bond|ally_network)\b' \
  src tests
```

Then separately inspect formal event producers:

```bash
rg -n \
  '\b(has_master|master_legacy|has_sworn_siblings|mentor_bond|ally_network)\b' \
  src/data/lines
```

Classify every **production** occurrence into:

```text
formal producer
production consumer
presentation consumer
test-only occurrence
```

Do not count the future deferred file as an active producer.

- [ ] **Step 3: Enforce the accepted disposition algorithm**

For each governed fact, use this exact algorithm:

```text
1. Remove the nine PD-104 events from the hypothetical active producer set.
2. If no independent legitimate active producer remains:
   - active consumers of that dead fact must be removed if they exist only for that legacy semantic.
3. If an independent legitimate active producer remains:
   - keep the fact;
   - keep only consumers whose abstract meaning is actually supported by that producer;
   - never synthesize a concrete person solely from the boolean.
4. ally_network remains legal social-network evidence but can never stand in for mentor_bond / an actual mentor.
```

Expected evidence from the accepted design:

```text
master_legacy:
  quarantined relationship_master_legacy is expected to be the relevant producer;
  P18 direct legacy/succession read must be removed if no second producer exists.

mentor_bond:
  quarantined relationship_mentor_encounter is expected to be the generic producer;
  p22_relationship_mentor_obligation leaves active runtime;
  any additional production read with no independent producer is dead and must be removed.

has_master:
  do not assume the flag itself is globally dead;
  path/sect-specific producers may exist;
  regardless, Life Memory may not fabricate an anonymous concrete master from this boolean.

has_sworn_siblings:
  do not fabricate a concrete Life Memory person from the boolean;
  retain the coarse fact only if another legitimate producer/consumer genuinely exists.

ally_network:
  KEEP for social-network semantics;
  never infer mentor.
```

If the audit discovers that removing a direct consumer requires redesigning P17/P18 domain semantics rather than deleting a dead legacy branch, STOP with `BLOCKED`.

- [ ] **Step 4: Write the failing aggregate regression before mutation**

Create `tests/genericRelationshipLegacyQuarantine.test.ts`.

Define these exact constants:

```ts
const QUARANTINED_EVENT_IDS = [
  'relationship_master_disciple',
  'relationship_master_betrayal',
  'relationship_master_legacy',
  'relationship_blood_brotherhood',
  'relationship_sworn_help',
  'relationship_mentor_encounter',
  'relationship_enemy_create',
  'relationship_revenge',
  'p22_relationship_mentor_obligation',
] as const;

const RETAINED_EVENT_IDS = [
  'relationship_life_saving',
  'relationship_debt_return',
  'p28_social_momentum_network_fork',
  'p28_social_reputation_reinforcement',
  'p29_social_momentum_patron_obligation',
  'p42_social_momentum_youth_introduction',
  'p42_social_momentum_later_testimonial',
] as const;
```

The test must initially assert the **post-PD-104** state:

```text
- runtime excludes all nine QUARANTINED_EVENT_IDS;
- dedicated deferred source contains all nine IDs exactly once;
- runtime includes every RETAINED_EVENT_ID;
- relationship runtime source has 7 events;
- runtime-loaded files = 28;
- total runtime events = 391;
- Life Memory does not synthesize master/sworn concrete-person entries from only has_master / has_sworn_siblings;
- ally_network alone cannot expose p22_relationship_mentor_obligation because that event is not active;
- no new relationship replacement flags or Person Archetype IDs were introduced by PD-104.
```

For the source-content test, read the JSON files directly with `fs.readFileSync`.

For runtime membership, use the same formal catalog adapter/helper currently used by existing event-catalog tests; do not create a second EventLoader implementation.

- [ ] **Step 5: Run the new test and verify it fails for the intended reasons**

Run:

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
```

Expected: failures showing the nine events are still active, deferred source missing, count still 400/15, and old Life Memory presentation still present.

A syntax/module failure in the test itself is not an acceptable red state; fix the test until it fails on PD-104 behavior.

- [ ] **Step 6: Commit only the test skeleton if repository convention allows red-test commits**

If this repository normally commits red tests separately:

```bash
git add tests/genericRelationshipLegacyQuarantine.test.ts
git commit -m "test: define generic relationship quarantine closure"
```

If repository convention does not commit red tests, leave it uncommitted and include it in Task 3’s implementation commit. Do not change production code in this task.

---

### Task 3: Move Exactly Nine Legacy Events Out of the Runtime Catalog

**Files:**
- Create: `src/data/lines/relationship-person-legacy-deferred.json`
- Modify: `src/data/lines/relationship.json`
- Modify: `src/data/lines/p22-content-expansions.json`
- Test: `tests/genericRelationshipLegacyQuarantine.test.ts`

**Interfaces:**
- Consumes: nine existing event objects exactly as currently authored.
- Produces: one non-runtime deferred source; active runtime content reduced by exactly nine events with no replacement content.

- [ ] **Step 1: Create the dedicated deferred source by moving, not rewriting, the event definitions**

Create:

```text
src/data/lines/relationship-person-legacy-deferred.json
```

Move these eight complete event objects from `relationship.json`:

```text
relationship_master_disciple
relationship_master_betrayal
relationship_master_legacy
relationship_blood_brotherhood
relationship_sworn_help
relationship_mentor_encounter
relationship_enemy_create
relationship_revenge
```

Move this complete event object from `p22-content-expansions.json`:

```text
p22_relationship_mentor_obligation
```

Preserve each legacy object’s original authored content/effects/conditions inside the deferred file. PD-104 is quarantining provenance, not silently rewriting the historical source.

The deferred file must contain exactly nine event IDs and no new replacement event.

- [ ] **Step 2: Keep the deferred source out of formal runtime loading**

Do **not** add `relationship-person-legacy-deferred.json` to:

```text
src/core/EventLoader.ts
src/data/events.json
any active line-map/source list
```

Verify with:

```bash
rg -n "relationship-person-legacy-deferred" src/core src/data/events.json
```

Expected: no runtime-loader registration.

- [ ] **Step 3: Verify `relationship.json` has exactly seven active events**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/lines/relationship.json', 'utf8'));
const events = Array.isArray(data) ? data : data.events;
console.log(events.length);
console.log(events.map(e => e.id).join('\n'));
NODE
```

Expected:

```text
7
```

The remaining set must still contain `relationship_life_saving` and `relationship_debt_return`. Do not remove another event merely to make the number fit.

- [ ] **Step 4: Verify the deferred source has exactly the accepted nine IDs**

Run:

```bash
node - <<'NODE'
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/lines/relationship-person-legacy-deferred.json', 'utf8'));
const events = Array.isArray(data) ? data : data.events;
const expected = new Set([
  'relationship_master_disciple',
  'relationship_master_betrayal',
  'relationship_master_legacy',
  'relationship_blood_brotherhood',
  'relationship_sworn_help',
  'relationship_mentor_encounter',
  'relationship_enemy_create',
  'relationship_revenge',
  'p22_relationship_mentor_obligation',
]);
if (events.length !== 9) throw new Error(`expected 9 deferred events, got ${events.length}`);
for (const event of events) {
  if (!expected.delete(event.id)) throw new Error(`unexpected/duplicate deferred id: ${event.id}`);
}
if (expected.size) throw new Error(`missing deferred ids: ${[...expected].join(', ')}`);
console.log('PD104_DEFERRED_IDS_OK');
NODE
```

Expected:

```text
PD104_DEFERRED_IDS_OK
```

- [ ] **Step 5: Run the aggregate regression**

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
```

Expected at this intermediate point: runtime/deferred membership assertions should pass. Consumer-closure/count assertions may still fail until Tasks 4–5.

- [ ] **Step 6: Commit the content quarantine**

```bash
git add src/data/lines/relationship.json \
        src/data/lines/p22-content-expansions.json \
        src/data/lines/relationship-person-legacy-deferred.json \
        tests/genericRelationshipLegacyQuarantine.test.ts
git commit -m "content: quarantine generic relationship legacy events"
```

---

### Task 4: Close Fabricated-Person Consumers Without Creating Replacement Semantics

**Files:**
- Modify: `src/core/deriveLifeMemorySummary.ts`
- Modify: `src/p18/stateAccess.ts` only if Task 2 proves `master_legacy` loses its last legitimate active producer
- Modify: any additional direct production consumer identified by Task 2 only under the accepted disposition algorithm
- Test: `tests/genericRelationshipLegacyQuarantine.test.ts`
- Test: `tests/testLifeMemorySummary.ts`
- Test: `tests/p17ConsequenceTests.ts`
- Test: `tests/p18LegacyTests.ts`

**Interfaces:**
- Consumes: Task 2 producer/consumer audit and Task 3 active catalog.
- Produces: no fabricated concrete master/sworn/mentor presentation from dead/generic booleans; no dead `master_legacy`/`mentor_bond` cross-domain consumer.

- [ ] **Step 1: Add explicit failing Life Memory assertions**

In `tests/genericRelationshipLegacyQuarantine.test.ts`, construct canonical states that differ only by:

```ts
state.flags.has_master = true;
```

and:

```ts
state.flags.has_sworn_siblings = true;
```

Call the current public Life Memory derivation API from `src/core/deriveLifeMemorySummary.ts`.

Assert that the result contains no concrete-person entry created solely from those booleans:

```text
no person named/typed as 恩师 from has_master alone
no person named/typed as 义兄弟/义兄弟姐妹 from has_sworn_siblings alone
no synthetic affinity / affinityBand attached to such fabricated entries
```

Do not assert that the raw historical boolean must be physically deleted from PlayerState.

Run:

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
```

Expected: fail on the old Life Memory synthesis before production edit.

- [ ] **Step 2: Remove only the fabricated Life Memory mappings**

In `src/core/deriveLifeMemorySummary.ts`, remove the branches that create anonymous master/sworn concrete-person entries solely from:

```text
has_master
has_sworn_siblings
```

Do not alter:

```text
spouse fact presentation
child fact presentation
PD-103 bound spouse identity
other concrete-person histories
habit / shaping summaries
```

Do not replace these branches with generic labels such as `师父甲` or a PD-103 archetype.

- [ ] **Step 3: Re-run Life Memory regressions**

Run:

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
npm exec tsx tests/testLifeMemorySummary.ts
npm exec tsx tests/p43ArchetypeRecapEndingTests.ts
npm exec tsx tests/p41HabitFeedbackTests.ts
```

Expected: PD-104 Life Memory assertions pass and existing unrelated Life Memory behavior remains green.

- [ ] **Step 4: Close `master_legacy` only if the audit proves it is dead**

Re-run:

```bash
rg -n '\bmaster_legacy\b' src --glob '!src/data/lines/relationship-person-legacy-deferred.json'
```

If Task 2 + this search show **no active producer** and `src/p18/stateAccess.ts` still consumes `master_legacy`, remove that consumer branch from P18.

Do not substitute another flag and do not redesign successor semantics.

Update `tests/p18LegacyTests.ts` so that a synthetic state containing only `master_legacy=true` no longer satisfies the retired generic master-legacy channel, while still preserving every unrelated P18 channel.

If another legitimate active producer exists, leave the supported abstract consumer intact and record the producer in the final audit table.

- [ ] **Step 5: Close `mentor_bond` only if the audit proves it is dead**

Run:

```bash
rg -n '\bmentor_bond\b' src --glob '!src/data/lines/relationship-person-legacy-deferred.json'
```

After removing `relationship_mentor_encounter`, if there is no independent legitimate active producer:

- remove any remaining production consumer whose only basis is `mentor_bond`;
- do not add a replacement mentor;
- do not map `ally_network` to `mentor_bond`.

If the remaining read belongs to a separate domain and cannot simply be deleted without new product semantics, STOP with `BLOCKED`.

- [ ] **Step 6: Prove `ally_network` does not fabricate mentor**

In the aggregate test, build a state with:

```text
ally_network = true
mentor_bond absent
```

Assert:

```text
runtime catalog does not contain p22_relationship_mentor_obligation
no tested PD-104 consumer creates a concrete mentor from ally_network
```

Do not remove `ally_network` itself.

- [ ] **Step 7: Run P17/P18 focused regressions**

Run:

```bash
npm exec tsx tests/p17ConsequenceTests.ts
npm exec tsx tests/p18LegacyTests.ts
npm exec tsx tests/p22ContentLibraryTests.ts
```

Expected: direct legacy consumer expectations are updated; no unrelated P17/P18 redesign is required.

- [ ] **Step 8: Commit consumer closure**

Stage only files actually justified by the Task 2 audit:

```bash
git add src/core/deriveLifeMemorySummary.ts \
        src/p18/stateAccess.ts \
        tests/genericRelationshipLegacyQuarantine.test.ts \
        tests/testLifeMemorySummary.ts \
        tests/p18LegacyTests.ts
```

If `src/p18/stateAccess.ts` or a listed test was not changed because a legitimate producer remains, omit it from `git add`.

If Task 2 identified and justified another direct consumer file, include only that file and its focused regression.

Commit:

```bash
git commit -m "fix: close generic relationship legacy consumers"
```

---

### Task 5: Reconcile the Formal Catalog to 391 and Regenerate the Manifest

**Files:**
- Modify: `src/data/event-asset-manifest.json`
- Modify: existing formal exact-count guard tests that truly encode active runtime catalog size
- Test: `tests/genericRelationshipLegacyQuarantine.test.ts`

**Interfaces:**
- Consumes: active runtime after Tasks 3–4.
- Produces: exact 28-file / 391-event formal inventory and updated count guards.

- [ ] **Step 1: Run the formal inventory before editing any count guard**

Run:

```bash
npm run report:event-asset-inventory
```

Required result:

```text
runtimeLoadedFiles = 28
totalEventsInRuntime = 391
```

If the actual result is not exactly `28 / 391`, STOP and explain the difference. Do not compensate by adding/removing events.

- [ ] **Step 2: Find every current `400` occurrence before changing tests**

Run:

```bash
rg -n '\b400\b' tests src scripts
```

Classify each result.

Change `400 → 391` **only** when the value means:

```text
exact formal active runtime event catalog size
```

Do not modify unrelated fixture/stat/business values.

Known historical exact-count guards have included files such as:

```text
tests/canonicalMartialLegacyProducerPruning.test.ts
tests/globalMoneyNumericWealthRuntimeRetirement.test.ts
tests/globalMoneyPhysicalRemovalClosure.test.ts
tests/globalMoneyFormalWalletAuthoringGuard.test.ts
tests/parenthoodMingyueV1.test.ts
tests/globalMoneyCurrentRuntimeCapabilityRetirement.test.ts
tests/globalMoneyE4CompatibilityBoundary.test.ts
tests/youthCausalOpportunity.test.ts
tests/introducedMarriageShenQingheV1.test.ts
tests/sexVariantPersonArchetypeV1.test.ts
```

The live repository search is authoritative. Do not edit a file merely because it appears in this historical list.

- [ ] **Step 3: Regenerate `event-asset-manifest.json` using the repository’s existing generator**

Use the same repository command/convention that produced the accepted PD-103 manifest. Do not hand-edit event hashes/counts.

Then verify:

```bash
npm run report:event-asset-inventory
```

Expected:

```text
runtimeLoadedFiles = 28
totalEventsInRuntime = 391
```

Also verify the deferred source is not counted as runtime-loaded.

- [ ] **Step 4: Strengthen the aggregate inventory assertions**

In `tests/genericRelationshipLegacyQuarantine.test.ts`, assert:

```text
runtimeLoadedFiles === 28
totalEventsInRuntime === 391
relationship active event count === 7
deferred source event count === 9
```

The test should explain in a comment:

```text
391 is 400 accepted baseline minus exactly nine PD-104 events.
```

- [ ] **Step 5: Run count-sensitive focused tests**

Run every exact-count guard changed in Step 2, plus:

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
npm exec tsx tests/introducedMarriageShenQingheV1.test.ts
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
npm exec tsx tests/parenthoodMingyueV1.test.ts
npm exec tsx tests/youthCausalOpportunity.test.ts
```

Expected: all pass with 391 active events and unchanged PD-103/Parenthood semantics.

- [ ] **Step 6: Commit inventory closure**

```bash
git add src/data/event-asset-manifest.json \
        tests/genericRelationshipLegacyQuarantine.test.ts
```

Add only the exact-count guard files actually changed in Step 2.

Commit:

```bash
git commit -m "test: close relationship quarantine event inventory"
```

---

### Task 6: Add Fail-Closed Governance / Scope Regressions

**Files:**
- Modify: `tests/genericRelationshipLegacyQuarantine.test.ts`
- Modify: `tests/runRealTestGate.ts`

**Interfaces:**
- Consumes: completed PD-104 runtime/content changes.
- Produces: one registered regression that prevents accidental restoration or scope creep.

- [ ] **Step 1: Add source-level fail-closed assertions**

Extend `tests/genericRelationshipLegacyQuarantine.test.ts` to assert:

```text
- no active event uses any of the nine quarantined IDs;
- deferred source contains those IDs but is not registered in EventLoader/runtime sources;
- retained life-saving/debt IDs remain active;
- five retained social-network IDs remain active;
- PD-104 did not create replacement flags such as has_enemy, enemy_bond, enemy_person, has_concrete_master, has_real_sworn_brother, mentor_person_exists, relationship_person_known;
- PD-104 did not add a new Person Archetype for master/sworn/mentor/enemy;
- PD-103's merchant_introduced_partner_v1 remains the same accepted first archetype set and is not used as a generic repair mechanism;
- no Snapshot top-level person registry or Relationship schema change was introduced by this task.
```

Use narrow static scans over the files changed by PD-104 and the existing PD-103 catalog/types; do not write a general repository policy framework.

- [ ] **Step 2: Register the regression in the real test gate**

Add `genericRelationshipLegacyQuarantine` to `tests/runRealTestGate.ts` using the same test-entry convention as the PD-103 and introduced-marriage focused tests.

- [ ] **Step 3: Run the registered test directly and through the gate entry mechanism**

Run:

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
```

Then use the repository’s supported focused gate invocation if present. If the gate has no test-name filter, defer the full `npm test` to Task 7 rather than adding a new runner feature.

- [ ] **Step 4: Commit the firewall registration**

```bash
git add tests/genericRelationshipLegacyQuarantine.test.ts tests/runRealTestGate.ts
git commit -m "test: guard generic relationship quarantine boundaries"
```

---

### Task 7: Full Verification, Audit Table, and STOP

**Files:**
- No new product files.
- Modify only a directly failing regression if it encoded the removed legacy semantics or old formal catalog count.
- Do not fix unrelated repository-level failures.

**Interfaces:**
- Consumes: completed PD-104 implementation.
- Produces: final evidence package/report only; no next-phase work.

- [ ] **Step 1: Re-run the producer / consumer audit and record final dispositions**

Run:

```bash
rg -n --hidden --glob '!node_modules/**' --glob '!artifacts/**' \
  '\b(has_master|master_legacy|has_sworn_siblings|mentor_bond|ally_network)\b' \
  src
```

Final report must include a table with exactly these rows:

```text
has_master
master_legacy
has_sworn_siblings
mentor_bond
ally_network
```

and columns:

```text
active producers after quarantine
active consumers after quarantine
final disposition
```

Required semantic outcomes:

```text
has_master:
  may remain if independent legitimate producers exist;
  cannot independently create a concrete Life Memory master.

master_legacy:
  if no producer remains, no active consumer may remain.

has_sworn_siblings:
  may remain as a coarse fact only if independently supported;
  cannot independently create a concrete Life Memory sworn person.

mentor_bond:
  if no producer remains, no active consumer may remain.

ally_network:
  remains valid social-network evidence;
  never equals mentor evidence.
```

- [ ] **Step 2: Run focused PD-104 and directly affected regressions**

Run:

```bash
npm exec tsx tests/genericRelationshipLegacyQuarantine.test.ts
npm exec tsx tests/testLifeMemorySummary.ts
npm exec tsx tests/p17ConsequenceTests.ts
npm exec tsx tests/p18LegacyTests.ts
npm exec tsx tests/p22ContentLibraryTests.ts
npm exec tsx tests/p43ArchetypeRecapEndingTests.ts
npm exec tsx tests/characterRelationshipMingyueV1.test.ts
npm exec tsx tests/characterRelationshipSaiyinV1.test.ts
npm exec tsx tests/characterRelationshipMarriageV1.test.ts
npm exec tsx tests/introducedMarriageShenQingheV1.test.ts
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
```

If a named test does not exist in the live repository, do not create a replacement merely to satisfy this list; report it as unavailable and run the nearest existing registered regression that covers the same accepted subsystem.

- [ ] **Step 3: Verify formal inventory and type/runtime parity**

Run:

```bash
npm run report:event-asset-inventory
npm run typecheck
npm run test:headless
npm run test:headless:parity
git diff --check
```

Required PD-104 inventory:

```text
28 runtime-loaded files
391 runtime events
7 active relationship.json events
9 deferred relationship-person legacy events
```

- [ ] **Step 4: Run current repository full gates**

Run:

```bash
npm test
npm run test:sample-lines-routes
npm run validate:event-quality
npm run gate:playability
npm run gate:golden-line
npm run gate:experience
```

Report existing repository-level failures separately.

Do not fix:

```text
B0 dirty-worktree/source-freeze
known sample-line seed failures
existing event-quality blockers
existing playability blockers
existing golden-line simulated gaps
existing experience class-rate failures
```

unless a failure is newly caused by PD-104.

- [ ] **Step 5: Verify no forbidden scope expansion occurred**

Run targeted scans:

```bash
git diff --name-only HEAD~7..HEAD
rg -n \
  'has_enemy|enemy_bond|enemy_person|has_concrete_master|has_real_sworn_brother|mentor_person_exists|relationship_person_known|person\.attributes|NPC registry|PersonRegistry' \
  src tests
```

Also inspect the PD-103 catalog diff:

```bash
git diff HEAD~7..HEAD -- src/data/personArchetypeCatalog.ts src/types/personArchetype.ts
```

Expected: no PD-104-driven expansion.

- [ ] **Step 6: Confirm repository cleanliness relative to pre-existing dirty state**

Run:

```bash
git status --short
git diff --check
```

Preserve unrelated dirty paths exactly; do not overwrite or commit them.

- [ ] **Step 7: STOP and report**

Return:

```text
verdict: CONFIRMED / PARTIAL / BLOCKED

commits made
changed files
authority closure status

quarantined IDs
retired IDs
explicitly retained IDs

runtime-loaded file count
runtime event count
relationship active event count
deferred event count

producer/consumer audit:
- has_master
- master_legacy
- has_sworn_siblings
- mentor_bond
- ally_network

Life Memory closure evidence
P18/master_legacy disposition
mentor_bond disposition
ally_network mentor-fabrication evidence

whether any replacement NPC/person archetype was created
whether PD-103 changed
whether new relationship flags/schema were introduced
whether any compatibility/migration layer was introduced

focused verification
full verification
existing repository-level failures separately

STOP-condition status
```

Do **not** start:

```text
replacement master design
sworn-sibling design
mentor design
rival/enemy redesign
life-debt cleanup
social-network redesign
Generic Relationship v2
another Person Archetype
```

after the report.

---

## Plan Self-Review

### Spec coverage

- Nine-event quarantine / retirement: Tasks 3, 6.
- Explicit retention of life-saving/debt + social network: Tasks 3, 6.
- Consumer closure and Life Memory boundary: Tasks 2, 4.
- `master_legacy` / `mentor_bond` producer-driven disposition: Tasks 2, 4, 7.
- `ally_network != mentor`: Tasks 4, 7.
- Dedicated non-runtime deferred source: Task 3.
- `400 - 9 = 391`, 28 runtime files, 7 relationship events: Task 5.
- Manifest/count guards: Task 5.
- Destructive-development compatibility boundary: Tasks 1, 6.
- No replacement persons / PD-103 expansion / relationship schema changes: Tasks 1, 6, 7.
- STOP conditions and no next-phase continuation: Task 7.

### Placeholder scan

No implementation step contains `TBD`, `TODO`, “similar to Task N”, or an open-ended instruction to invent semantics. The only conditional edits are controlled by the accepted producer/consumer disposition algorithm and mandatory STOP conditions.

### Type / interface consistency

PD-104 adds no runtime type or schema interface. The plan deliberately reuses the existing event catalog, Life Memory derivation API, P17/P18 state access, EventLoader source list, and manifest tooling.
