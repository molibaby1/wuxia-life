# Sex-Variant Person Archetype v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deliberately narrow Sex-Variant Person Archetype capability so the existing merchant-family introduced-marriage character binds to 沈清禾 for male players or 沈知衡 for female players, stays stable across the run/save-load boundary, and reuses the same three-event semantics without creating a generic NPC/person system.

**Architecture:** Keep authored archetype/variant definitions static and closed. Persist only one string fact per materialized archetype (`person_variant:<archetypeId>`), materialize the selected event at presentation time, render only three allowlisted person tokens, and add one dedicated `set_spouse_from_person` special-effect consumer. Do not add a Person object, registry, generic attributes, new Snapshot fields, generic effect templating, or person-aware condition language.

**Tech Stack:** TypeScript, Vue runtime via `GameEngineIntegration`, JSON-authored formal events, strict Snapshot `3.16.0`, Node `tsx` tests.

**Spec:** `docs/product/sex-variant-person-archetype-contract-design.md`

## Global Constraints

- Human design acceptance is complete; implementation authorization is inherited as long as this plan does not expand the accepted scope.
- Development is currently destructive: pre-PD-103 沈清禾 mid-chain content-state compatibility is **not guaranteed**, even when an old save still structurally validates as Snapshot `3.16.0`.
- Do not add load-time inference, history reconstruction, fallback, aliasing, or migration for missing `person_variant:*` facts.
- Snapshot schema stays exactly `3.16.0`; no `personInstances` or other top-level persisted fields.
- v1 has exactly one authored archetype: `merchant_introduced_partner_v1`.
- v1 has exactly two authored variants: `female_qinghe` and `male_zhiheng`.
- Variant selection is deterministic for the first sample: player male → `female_qinghe`; player female → `male_zhiheng`.
- The only v1 variant fields are `sex`, `displayName`, `pronoun`, and `address`.
- Event rendering supports only `{{person.name}}`, `{{person.pronoun}}`, and `{{person.address}}`.
- Do not add `person.attributes`, generic metadata, arbitrary `person.*` paths, `person_sex_is`, generic person conditions, generic effect templating, random names, random sex, portrait logic, personality/background variation, NPC registry, or multi-person event binding.
- The existing three technical event/history IDs remain unchanged; they are legacy technical identifiers and do not define concrete variant identity.
- The three introduced-marriage events remain semantically identical across male/female player variants: same access semantics, shared-matter choices, histories, marriage/no-marriage legality, and canonical effects.
- Parenthood remains Mingyue-first-sample only; do not generalize it for 沈清禾 or 沈知衡.
- Event count remains 400 and runtime-loaded file count remains 28; if inventory changes, STOP and explain why rather than compensating with content.
- Any pressure toward a second semantic instantiation dimension, multiple instantiated persons in one event, variant-specific core story branches, or generic Person state is a mandatory `BLOCKED` re-design condition.

---

## File Structure

**Create**

- `docs/product/sex-variant-person-archetype-contract-design.md` — accepted long-term product authority.
- `src/types/personArchetype.ts` — closed v1 type vocabulary only; no extensible attributes map.
- `src/data/personArchetypeCatalog.ts` — static authored archetype + two authored variant bundles.
- `src/core/SexVariantPersonArchetype.ts` — persisted binding, strict lookup, closed token rendering, and event materialization.
- `tests/sexVariantPersonArchetypeV1.test.ts` — architectural/runtime/save-load regression suite.

**Modify**

- `docs/product/player-model.md` — one delegation sentence to the new contract.
- `docs/product/character-relationship-product-contract-design.md` — replace stale “person instantiation not designed” wording only where necessary; Generic Person Instantiation remains unauthorized.
- `docs/governance/product-decisions.md` — append PD-103 with the accepted narrow scope and destructive-development compatibility boundary.
- `docs/README.md` — add the accepted contract and update the player-model delegation tree/index wording.
- `src/types/eventTypes.ts` — add one optional `personBinding` field to `EventDefinition` using the closed type.
- `src/core/GameEngineIntegration.ts` — fail-closed person-binding eligibility and selected-event materialization.
- `src/core/EventExecutor.ts` — support dedicated `special / set_spouse_from_person` only.
- `src/core/ChoiceFeedbackGenerator.ts` — recognize the dedicated spouse effect as the same public spouse delta class.
- `src/headless/session/HeadlessEngineSessionImpl.ts` — re-materialize a catalog event from an already persisted binding when executing a headless choice from a snapshot; never create during this reconstruction path.
- `tests/GameProcessSimulator.ts` — treat `set_spouse_from_person` as the same relationship-oriented auto-choice signal as existing `set_spouse`; do not add any new generic scoring model.
- `src/data/lines/merchant.json` — migrate the current fixed 沈清禾 presentation/effect to the archetype binding and remove the male-only introduction condition.
- `tests/introducedMarriageShenQingheV1.test.ts` — preserve existing semantic tests while adding the female-player/male-variant coverage and replacing fixed-name assertions with instance-derived assertions.
- `tests/runRealTestGate.ts` — register `sexVariantPersonArchetypeV1.test.ts`.
- `src/data/event-asset-manifest.json` — regenerate after the JSON content changes.

**Do not modify**

- `src/contracts/gameStateSnapshot.ts`
- `src/contracts/validation/canonicalGameStateValidation.ts`
- `src/headless/snapshot/SnapshotConverter.ts`
- `src/types/conditionExpression.ts`
- `src/core/ConditionEvaluator.ts`
- `src/types` relationship schema / `Relationship.affinity`
- `src/data/events.json`
- `src/core/EventLoader.ts` source list
- Mingyue/Saiyin/Parenthood content except regression assertions if a test needs to observe unchanged behavior

---

### Task 1: Close Repository Authority and Record Destructive-Development Compatibility

**Files:**
- Create: `docs/product/sex-variant-person-archetype-contract-design.md`
- Modify: `docs/product/player-model.md`
- Modify: `docs/product/character-relationship-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: Human-accepted Sex-Variant Person Archetype Contract v1.
- Produces: repository authority for all later tasks; PD-103 explicitly authorizes only the narrow sex-variant capability and explicitly rejects compatibility reconstruction for pre-PD-103 content state.

- [ ] **Step 1: Add the accepted contract verbatim, including the clarified compatibility policy**

Create `docs/product/sex-variant-person-archetype-contract-design.md` from the accepted spec. Section 10.1 must say, in substance and explicitly, all of the following:

```text
Current development is destructive.
Pre-PD-103 沈清禾 mid-chain saves are not a supported content-compatibility requirement.
No load-time inference, spouse/history reconstruction, migration, fallback, alias, or require→create repair is authorized.
Snapshot schema remains 3.16.0.
```

Do not weaken the mandatory Complexity BLOCK list.

- [ ] **Step 2: Add the player-model delegation**

In the “特质、状态和故事事实” authority area, add one concise delegation after the Character / Relationship delegation:

```text
有限 Sex-Variant Person Archetype 的正式语义由 Sex-Variant Person Archetype Contract v1 定义；它只允许同一合法 Person Archetype 在核心人物语义不变时绑定有限 male/female identity variant，不授权 Generic Person Instantiation、NPC Generator 或开放式人物属性系统。
```

Do not change first-layer PlayerState semantics.

- [ ] **Step 3: Update the Character / Relationship contract only where stale**

Search for wording equivalent to “人物实例化尚未设计” or “Person Instantiation requires future design”. Replace only the stale blanket statement with the narrower current state:

```text
Generic Person Instantiation remains unauthorized. A limited Sex-Variant Person Archetype capability is governed separately by PD-103 / Sex-Variant Person Archetype Contract v1.
```

Do not rewrite PD-101’s Person Definition, fact-first, romance/marriage, or delayed-abstraction rules.

- [ ] **Step 4: Append PD-103**

Append `PD-103：Sex-Variant Person Archetype Contract v1` to `docs/governance/product-decisions.md`. It must record:

```text
- same archetype only when Access / Character Anchors / Core Concern / Event Responsibilities / Relationship Possibilities / main causal chain remain the same;
- v1 variant fields = sex + displayName + pronoun/address only;
- first sample selection = male player→female_qinghe, female player→male_zhiheng;
- persisted state = one string fact person_variant:<archetypeId>;
- no Person object / registry / generic attributes / condition language / effect templating;
- create only when selected for presentation; require never auto-creates;
- dedicated set_spouse_from_person is authorized;
- Snapshot remains 3.16.0;
- pre-PD-103 mid-chain content-state compatibility is not guaranteed in this destructive-development stage and receives no fallback/migration;
- all listed complexity triggers default to BLOCK / split archetype / Human re-design.
```

- [ ] **Step 5: Update `docs/README.md`**

Add the new contract under accepted product contracts and update the player-model delegation diagram to include it without making it first-layer authority, e.g.:

```text
player-model
├─ Wealth / Economy Contract
├─ Character / Relationship Contract
│  └─ Sex-Variant Person Archetype Contract
└─ Parenthood / Family Life Contract
```

Update governance-index wording from “PD-101 / PD-102” to include PD-103.

- [ ] **Step 6: Verify authority consistency**

Run:

```bash
rg -n "Person Instantiation|Sex-Variant|PD-103|person_variant" docs/product docs/governance docs/README.md
```

Expected: no current authority claims that all person instantiation is “undesignated”; every new mention preserves “Generic Person Instantiation remains unauthorized”.

- [ ] **Step 7: Commit authority closure**

```bash
git add docs/product/sex-variant-person-archetype-contract-design.md \
        docs/product/player-model.md \
        docs/product/character-relationship-product-contract-design.md \
        docs/governance/product-decisions.md \
        docs/README.md
git commit -m "docs: record sex-variant person archetype contract"
```

---

### Task 2: Add the Closed Archetype Catalog and Binding Runtime

**Files:**
- Create: `src/types/personArchetype.ts`
- Create: `src/data/personArchetypeCatalog.ts`
- Create: `src/core/SexVariantPersonArchetype.ts`
- Test: `tests/sexVariantPersonArchetypeV1.test.ts`

**Interfaces:**
- Consumes: `GameState.facts`, `PlayerState.gender`, `EventDefinition` text/choice/outcome fields.
- Produces:
  - `PersonArchetypeId`
  - `PersonVariantId`
  - `PersonEventBinding`
  - `personVariantFactKey(archetypeId)`
  - `readBoundPersonVariant(state, archetypeId)`
  - `canSatisfyPersonBinding(state, binding)`
  - `materializePersonBoundEvent(state, event, options)` where `options.allowCreate` is explicit
  - strict display-name resolution for the dedicated spouse consumer.

- [ ] **Step 1: Write the failing catalog/binding tests**

Create `tests/sexVariantPersonArchetypeV1.test.ts` with a first block that asserts these exact authored definitions:

```ts
assert.equal(personVariantFactKey('merchant_introduced_partner_v1'),
  'person_variant:merchant_introduced_partner_v1');

assert.deepEqual(getPersonArchetype('merchant_introduced_partner_v1').variantByPlayerGender, {
  male: 'female_qinghe',
  female: 'male_zhiheng',
});

assert.deepEqual(getPersonVariant('merchant_introduced_partner_v1', 'female_qinghe'), {
  id: 'female_qinghe',
  sex: 'female',
  displayName: '沈清禾',
  pronoun: '她',
  address: '姑娘',
});

assert.deepEqual(getPersonVariant('merchant_introduced_partner_v1', 'male_zhiheng'), {
  id: 'male_zhiheng',
  sex: 'male',
  displayName: '沈知衡',
  pronoun: '他',
  address: '公子',
});
```

Also scan the serialized catalog and assert it does not contain keys/terms such as:

```text
attributes
traits
personality
background
socialClass
familyTrade
variantMetadata
```

- [ ] **Step 2: Run the new test and verify it fails because the modules do not exist**

```bash
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
```

Expected: module-not-found / missing export failure.

- [ ] **Step 3: Implement the closed type vocabulary**

Create `src/types/personArchetype.ts` with no generic attribute map:

```ts
export type PersonArchetypeId = 'merchant_introduced_partner_v1';
export type PersonVariantId = 'female_qinghe' | 'male_zhiheng';
export type PersonSex = 'male' | 'female';

export interface PersonEventBinding {
  archetypeId: PersonArchetypeId;
  mode: 'create' | 'require';
}

export interface PersonVariantDefinition {
  id: PersonVariantId;
  sex: PersonSex;
  displayName: string;
  pronoun: string;
  address: string;
}

export interface PersonArchetypeDefinition {
  id: PersonArchetypeId;
  variantByPlayerGender: Readonly<Record<PersonSex, PersonVariantId>>;
  variants: Readonly<Record<PersonVariantId, PersonVariantDefinition>>;
}
```

Do not add index signatures or `Record<string, unknown>` escape hatches.

- [ ] **Step 4: Implement the one-entry static catalog**

Create `src/data/personArchetypeCatalog.ts` with exactly one archetype and two variants. Export strict lookup/type-guard helpers; unknown IDs/variant IDs must not fall back to another value.

The data must be exactly:

```ts
merchant_introduced_partner_v1: {
  variantByPlayerGender: {
    male: 'female_qinghe',
    female: 'male_zhiheng',
  },
  variants: {
    female_qinghe: {
      id: 'female_qinghe',
      sex: 'female',
      displayName: '沈清禾',
      pronoun: '她',
      address: '姑娘',
    },
    male_zhiheng: {
      id: 'male_zhiheng',
      sex: 'male',
      displayName: '沈知衡',
      pronoun: '他',
      address: '公子',
    },
  },
}
```

- [ ] **Step 5: Add failing materialization tests before implementation**

Extend `tests/sexVariantPersonArchetypeV1.test.ts` with a minimal event fixture containing:

```ts
personBinding: {
  archetypeId: 'merchant_introduced_partner_v1',
  mode: 'create',
},
content: {
  title: '{{person.name}}来访',
  text: '{{person.name}}说{{person.pronoun}}会把账目核清。',
  description: '家里称{{person.address}}做事认真。',
},
choices: [{
  id: 'meet',
  text: '见{{person.pronoun}}一面',
  description: '与{{person.name}}谈谈',
  effects: [],
  outcomes: [{
    id: 'ok',
    condition: { type: 'expression', expression: 'player.age >= 0' },
    text: '{{person.name}}点头应下。',
    effects: [],
  }],
}],
```

Assert for a male player:

```text
binding fact becomes female_qinghe
all five supported player-facing text locations render 沈清禾/她/姑娘
```

Assert for a female player:

```text
binding fact becomes male_zhiheng
text renders 沈知衡/他/公子
```

Assert materializing the same archetype twice reuses the original fact and never reselects.

Assert a `mode: require` event with no fact is unsatisfied and cannot materialize with `allowCreate: false`.

Assert a persisted unknown binding like:

```ts
facts['person_variant:merchant_introduced_partner_v1'] = 'unknown_variant'
```

fails closed; it must not re-roll or coerce.

- [ ] **Step 6: Implement strict binding + closed token rendering**

Create `src/core/SexVariantPersonArchetype.ts` with these rules:

```ts
const PERSON_TOKEN_RENDERERS = {
  '{{person.name}}': variant.displayName,
  '{{person.pronoun}}': variant.pronoun,
  '{{person.address}}': variant.address,
};
```

Only render:

```text
event.content.title
event.content.text
event.content.description
choice.text
choice.description
outcome.text
```

Do not render condition expressions, IDs, metadata, effect values, effect targets, or arbitrary object fields.

`materializePersonBoundEvent(state, event, { allowCreate })` must:

```text
no personBinding → return unchanged event/state
existing valid binding → reuse it
missing + mode=create + allowCreate=true → select deterministic variant from player.gender and persist fact
missing + mode=require → fail closed
missing + mode=create + allowCreate=false → fail closed
invalid persisted variant → fail closed
```

The returned materialized event must be a detached copy for the rendered fields; do not mutate the static catalog event in place.

- [ ] **Step 7: Run the focused runtime test**

```bash
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit the closed runtime foundation**

```bash
git add src/types/personArchetype.ts \
        src/data/personArchetypeCatalog.ts \
        src/core/SexVariantPersonArchetype.ts \
        tests/sexVariantPersonArchetypeV1.test.ts
git commit -m "feat: add closed sex-variant person binding runtime"
```

---

### Task 3: Integrate Binding Eligibility, Presentation-Time Materialization, Save/Load Stability, and Dedicated Spouse Consumption

**Files:**
- Modify: `src/types/eventTypes.ts`
- Modify: `src/core/GameEngineIntegration.ts`
- Modify: `src/core/EventExecutor.ts`
- Modify: `src/core/ChoiceFeedbackGenerator.ts`
- Modify: `src/headless/session/HeadlessEngineSessionImpl.ts`
- Modify: `tests/GameProcessSimulator.ts`
- Test: `tests/sexVariantPersonArchetypeV1.test.ts`

**Interfaces:**
- Consumes: Task 2 binding/runtime functions.
- Produces: formal events can declare one closed `personBinding`; selection materializes `create`; `require` is fail-closed; save/load preserves the fact; `set_spouse_from_person` resolves only an existing binding.

- [ ] **Step 1: Add failing EventDefinition integration tests**

In `tests/sexVariantPersonArchetypeV1.test.ts`, construct an isolated `RuntimeEventCatalog` containing:

```text
create event: eligible for both genders, personBinding=create
require event: personBinding=require
```

Use `GameEngineIntegration` with only those events. Assert before implementation:

```text
getAvailableEvents() includes create but excludes require while no binding exists
selectEvent() returns a rendered create event and writes exactly one person_variant fact
subsequent getAvailableEvents() can include require once its normal event conditions pass
```

Use deterministic catalog weights so the isolated create event is selected without depending on the production event pool.

- [ ] **Step 2: Add the closed `personBinding` authoring field**

In `src/types/eventTypes.ts`:

```ts
import type { PersonEventBinding } from './personArchetype';
```

Add to `EventDefinition`:

```ts
personBinding?: PersonEventBinding;
```

Do not add person fields to `EventCondition`, `ConditionExpression`, `EffectDefinition`, `GameState`, `PlayerState`, or `Relationship`.

- [ ] **Step 3: Integrate binding availability into event guards**

In `GameEngineIntegration.passesRuntimeEventGuards`, after existing conditions/thresholds/legacy-trigger checks and before returning true, add:

```ts
if (event.personBinding && !canSatisfyPersonBinding(this.gameState, event.personBinding)) {
  return false;
}
```

`canSatisfyPersonBinding` must never create state.

Expected behavior:

```text
create + no binding + supported player gender → available
require + no binding → unavailable
valid existing binding → available subject to ordinary event guards
invalid binding → fail closed through the existing guard error path
```

- [ ] **Step 4: Materialize only after an event is actually selected**

Add one private helper in `GameEngineIntegration`:

```ts
private materializeSelectedEvent(event: EventDefinition | null): EventDefinition | null
```

It must:

```text
null → null
unbound event → unchanged event
person-bound event → call materializePersonBoundEvent(..., { allowCreate: true })
if a new binding fact is returned → apply it through existing applyGameState()
return the detached rendered event
```

Route every `selectEvent()` return of a selected `EventDefinition` through this helper, including formal selections and daily fallback calls. Unbound daily events remain byte-for-byte semantically unchanged.

Do not materialize during `getAvailableEvents`, EventLoader construction, catalog load, or simple event-ID lookup.

- [ ] **Step 5: Add the execution-only rematerialization path**

Add a public narrow helper on `GameEngineIntegration` for already selected/persisted person-bound events, e.g.:

```ts
public materializeEventForExecution(event: EventDefinition): EventDefinition
```

It must call the same materializer with:

```ts
{ allowCreate: false }
```

It may render an existing valid binding but may never create one.

This method exists for headless snapshot-driven choice execution only; do not turn it into a generic event transformation service.

- [ ] **Step 6: Re-materialize headless catalog events from persisted binding**

In `HeadlessEngineSessionImpl.executeChoice`, when the current event must be reconstructed from the catalog after `hydrate(snapshot)`, change:

```ts
event = this.dependencies.catalog.getEventById(...)
```

to obtain the raw event and then pass it through:

```ts
this.engine.materializeEventForExecution(rawEvent)
```

If the snapshot lacks the required binding, execution must fail; do not create or infer it.

This is the expected destructive-development behavior for pre-PD-103 mid-chain saves.

- [ ] **Step 7: Add the dedicated spouse consumer test**

Before implementing the handler, add assertions that executing:

```ts
{
  type: 'special',
  target: 'set_spouse_from_person',
  value: 'merchant_introduced_partner_v1',
}
```

sets:

```text
male player bound female_qinghe → spouse = 沈清禾
female player bound male_zhiheng → spouse = 沈知衡
```

Also assert missing binding and unknown archetype/variant fail closed rather than setting an empty/fallback spouse.

- [ ] **Step 8: Implement `set_spouse_from_person` in `SpecialEffectHandler`**

In `src/core/EventExecutor.ts`, add exactly one new `special` target branch:

```ts
if (target === 'set_spouse_from_person') {
  // effect.value must be a known PersonArchetypeId
  // resolve an existing bound variant only
  // set player.spouse = variant.displayName
}
```

Do not add a new generic effect type and do not template `effect.value`.

Keep existing `set_spouse` intact for fixed persons such as 明月.

- [ ] **Step 9: Preserve current public feedback/simulator semantics**

In `ChoiceFeedbackGenerator`, treat both:

```text
set_spouse
set_spouse_from_person
```

as the same public `spouse` impact class.

In `tests/GameProcessSimulator.ts`, update only the existing relationship-oriented spouse scoring check so either target receives the same current `+500` simulator preference behavior. Do not change the score value or create Person-specific scoring.

- [ ] **Step 10: Add save/load stability and destructive old-state tests**

In `tests/sexVariantPersonArchetypeV1.test.ts`:

1. Materialize `female_qinghe`, serialize through `defaultSnapshotConverter.toSnapshot`, hydrate/round-trip, and assert the binding fact remains `female_qinghe`.
2. Do the same for `male_zhiheng`.
3. Assert Snapshot metadata remains `3.16.0` and serialized state has no `personInstances` key.
4. Construct a valid current-schema snapshot with the normal preconditions/history for a `require` event but **without** `person_variant:merchant_introduced_partner_v1`; assert execution/materialization does not infer 沈清禾 and does not create a binding.

This fourth case documents the Human-approved destructive-development policy.

- [ ] **Step 11: Run focused architecture tests**

```bash
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
npm run test:contracts:snapshot
npm run test:contracts:save-schema
npm run test:headless
npm run test:headless:parity
```

Expected: all PASS; Snapshot remains `3.16.0`.

- [ ] **Step 12: Commit runtime integration**

```bash
git add src/types/eventTypes.ts \
        src/core/GameEngineIntegration.ts \
        src/core/EventExecutor.ts \
        src/core/ChoiceFeedbackGenerator.ts \
        src/headless/session/HeadlessEngineSessionImpl.ts \
        tests/GameProcessSimulator.ts \
        tests/sexVariantPersonArchetypeV1.test.ts
git commit -m "feat: bind sex-variant persons at event presentation"
```

---

### Task 4: Migrate the Merchant Introduced-Marriage Slice Without Redesigning It

**Files:**
- Modify: `src/data/lines/merchant.json`
- Modify: `tests/introducedMarriageShenQingheV1.test.ts`
- Modify: `tests/sexVariantPersonArchetypeV1.test.ts`
- Modify: `tests/runRealTestGate.ts`
- Modify: `src/data/event-asset-manifest.json`

**Interfaces:**
- Consumes: `personBinding`, three closed person tokens, and `set_spouse_from_person` from Tasks 2–3.
- Produces: same three-event introduced-marriage causal chain available to both player genders with instance-derived presentation and spouse identity.

- [ ] **Step 1: Add failing male/female slice assertions before changing JSON**

Extend `tests/introducedMarriageShenQingheV1.test.ts` so the existing first-sample assertions become archetype assertions:

```text
male + origin_merchant_family + age 22–32 + unmarried + no spouse + no Mingyue romance → introduction available
female + same non-gender preconditions → introduction available
route_merchant still not required
```

Update the test helper that currently resolves raw catalog events directly. It must materialize the event before resolving the choice so dynamic text/effects are tested consistently:

```ts
async function materializedEvent(
  engine: GameEngineIntegration,
  eventId: string,
): Promise<EventDefinition> {
  const raw = getEvent(eventId);
  const result = materializePersonBoundEvent(
    engine.getGameState(),
    raw,
    { allowCreate: raw.personBinding?.mode === 'create' },
  );
  if (result.state !== engine.getGameState()) {
    engine.loadGameState(result.state);
  }
  return result.event;
}

async function choose(engine: GameEngineIntegration, eventId: string, choiceId: string) {
  const event = await materializedEvent(engine, eventId);
  const choice = event.choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing materialized choice: ${eventId}/${choiceId}`);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
  return resolved;
}
```

This helper is test-only. Production creation timing is separately verified through `GameEngineIntegration.selectEvent()` in `sexVariantPersonArchetypeV1.test.ts`; do not expose a test-only production API.

For a selected/materialized introduction event, assert:

```text
male player → female_qinghe / 沈清禾
female player → male_zhiheng / 沈知衡
```

Keep every existing semantic assertion for no-meet, shared matter, honor/renegotiate, marriage/no-marriage, no affinity/romance/quality, and Parenthood isolation.

- [ ] **Step 2: Run the introduced-marriage test and verify female coverage fails**

```bash
npm exec tsx tests/introducedMarriageShenQingheV1.test.ts
```

Expected: FAIL because the current introduction still requires `player.gender == "male"` and text/effect are fixed to 沈清禾.

- [ ] **Step 3: Add `personBinding` to the three existing events**

In `src/data/lines/merchant.json`:

`shen_qinghe_introduction`:

```json
"personBinding": {
  "archetypeId": "merchant_introduced_partner_v1",
  "mode": "create"
}
```

`shen_qinghe_shared_matter` and `shen_qinghe_marriage_decision`:

```json
"personBinding": {
  "archetypeId": "merchant_introduced_partner_v1",
  "mode": "require"
}
```

Do not change the event IDs, history IDs, age windows, pacing, choice IDs, or causal conditions except the gender guard described below.

- [ ] **Step 4: Remove only the obsolete male-player eligibility clause**

From `shen_qinghe_introduction` condition expression, remove:

```text
player.gender == "male"
```

Keep:

```text
origin_merchant_family
age 22–32
unmarried
no spouse
no mingyue_romance_confirmed
once / not previously introduced
```

Do not add a new orientation/compatibility condition.

- [ ] **Step 5: Replace only identity presentation with closed tokens**

Across the three events, replace concrete-name/pronoun/address presentation where it refers to the introduced person:

```text
沈清禾 → {{person.name}}
她 → {{person.pronoun}}   # only when the pronoun refers to the bound person
姑娘 → {{person.address}} # only if such wording is present/needed
```

Do not mechanically replace unrelated Chinese “她” text outside these three events.

The resulting event semantics must still say the same things:

```text
沈家长期商业往来
person participates in accounts/goods flow
commitments and accounts matter
business cooperation does not decide marriage
person wants to continue participating in family business after marriage
```

No male-specific social-role rewrite is allowed.

- [ ] **Step 6: Replace the fixed spouse effect only**

In both marriage outcomes that currently contain:

```json
{ "type": "special", "target": "set_spouse", "value": "沈清禾" }
```

replace with:

```json
{
  "type": "special",
  "target": "set_spouse_from_person",
  "value": "merchant_introduced_partner_v1"
}
```

Keep the existing:

```json
{ "type": "flag_set", "target": "married", "value": true }
```

exactly as the marriage fact.

- [ ] **Step 7: Verify the two complete variant paths**

Update/extend tests so each player gender runs both shared-matter histories:

```text
male → 沈清禾 → honor_terms → marriage
male → 沈清禾 → renegotiate → marriage
female → 沈知衡 → honor_terms → marriage
female → 沈知衡 → renegotiate → marriage
```

For all four:

```text
same event IDs
same choice IDs
same eligibility
same time advance
same history semantics
same married=true result
only spouse displayName differs by bound instance
```

Also test no-marriage for at least one path per gender and assert no regret/failure/single semantics.

- [ ] **Step 8: Verify presentation text is instance-derived across the full chain**

For both genders, assert the materialized:

```text
introduction content + choice text
shared-matter content
marriage-decision content + marriage choice
honor outcome text
renegotiate outcome text
```

contains only the correct concrete name/pronoun for that run and never the opposite variant name.

- [ ] **Step 9: Preserve Parenthood isolation**

For both:

```text
spouse = 沈清禾
spouse = 沈知衡
```

assert `mingyue_parenthood_decision` remains unavailable. Do not modify Parenthood JSON/runtime.

- [ ] **Step 10: Register the architecture suite**

Add to `tests/runRealTestGate.ts` adjacent to the relationship/introduced-marriage suites:

```ts
{ name: 'sexVariantPersonArchetypeV1', entry: 'tests/sexVariantPersonArchetypeV1.test.ts' },
```

- [ ] **Step 11: Run focused tests**

```bash
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
npm exec tsx tests/introducedMarriageShenQingheV1.test.ts
npm exec tsx tests/characterRelationshipMarriageV1.test.ts
npm exec tsx tests/characterRelationshipMingyueV1.test.ts
npm exec tsx tests/characterRelationshipSaiyinV1.test.ts
npm exec tsx tests/parenthoodMingyueV1.test.ts
```

Expected: PASS.

- [ ] **Step 12: Regenerate the event manifest and verify catalog count is unchanged**

Run the repository’s existing event inventory/manifest generation path used for `src/data/event-asset-manifest.json`, then:

```bash
npm run report:event-asset-inventory
```

Expected:

```text
runtimeLoadedFiles = 28
totalEventsInRuntime = 400
```

If the command reports another count, STOP and explain the inventory difference. Do not add/remove events to force 400.

- [ ] **Step 13: Commit the merchant slice migration**

```bash
git add src/data/lines/merchant.json \
        tests/introducedMarriageShenQingheV1.test.ts \
        tests/sexVariantPersonArchetypeV1.test.ts \
        tests/runRealTestGate.ts \
        src/data/event-asset-manifest.json
git commit -m "feat: add male and female variants to introduced marriage"
```

---

### Task 5: Add Explicit Complexity-Firewall Regressions

**Files:**
- Modify: `tests/sexVariantPersonArchetypeV1.test.ts`

**Interfaces:**
- Consumes: final v1 implementation.
- Produces: regression evidence that implementation did not silently broaden into Generic Person Instantiation.

- [ ] **Step 1: Add source-level architecture assertions**

Read the relevant source files as text and assert all of the following remain absent from the new subsystem and event schema:

```text
personInstances
person.attributes
attributes: Record<
variantMetadata
person_sex_is
person_property
PersonRegistry
NpcRegistry
NPCRegistry
randomName
familyTrade
temperament
```

Scope the scan to the newly created/modified Person subsystem files plus the three merchant events so unrelated historical uses of generic words elsewhere do not create false positives.

- [ ] **Step 2: Assert only one instantiated person binding per event is representable**

The EventDefinition field must be singular:

```ts
personBinding?: PersonEventBinding
```

and the test should assert there is no `personBindings` array/property in the new types/runtime.

- [ ] **Step 3: Assert no person-aware condition capability was added**

Import `SUPPORTED_CONDITION_EXPRESSION_CAPABILITIES` and verify its supported categories remain the existing player/flags/events model; also source-scan `src/types/conditionExpression.ts` and `src/core/ConditionEvaluator.ts` to ensure no `person.` path or `person_sex_is` support was introduced.

- [ ] **Step 4: Assert Snapshot remains structurally unchanged**

Using a serialized current snapshot after person binding:

```ts
assert.equal(snapshot.metadata.schemaVersion, '3.16.0');
assert.equal(Object.hasOwn(snapshot.state, 'personInstances'), false);
assert.equal(
  snapshot.state.facts['person_variant:merchant_introduced_partner_v1'],
  expectedVariantId,
);
```

- [ ] **Step 5: Run the architecture suite and typecheck**

```bash
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the firewall regressions**

```bash
git add tests/sexVariantPersonArchetypeV1.test.ts
git commit -m "test: guard sex-variant person complexity boundary"
```

---

### Task 6: Full Verification, STOP Check, and Work-Doc Cleanup

**Files:**
- Modify only if verification exposes an in-scope defect.
- Remove after successful closure: `docs/superpowers/plans/2026-08-31-sex-variant-person-archetype-v1.md` if this plan was committed into the working repository and the project follows its documented temporary-workspace cleanup policy.
- Keep: `docs/product/sex-variant-person-archetype-contract-design.md` and PD-103 as long-term authority.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: final evidence package/report for Human review; no next-phase implementation.

- [ ] **Step 1: Run focused feature and contract tests**

```bash
npm exec tsx tests/sexVariantPersonArchetypeV1.test.ts
npm exec tsx tests/introducedMarriageShenQingheV1.test.ts
npm exec tsx tests/characterRelationshipMarriageV1.test.ts
npm exec tsx tests/characterRelationshipMingyueV1.test.ts
npm exec tsx tests/characterRelationshipSaiyinV1.test.ts
npm exec tsx tests/parenthoodMingyueV1.test.ts
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run typecheck
npm run report:event-asset-inventory
git diff --check
```

Expected feature-specific result:

```text
male player → female_qinghe → 沈清禾
female player → male_zhiheng → 沈知衡
same three-event semantics
binding survives save/load
no compatibility reconstruction
28 runtime files / 400 events
Snapshot 3.16.0
```

- [ ] **Step 2: Run repository-level verification without repairing unrelated failures**

```bash
npm test
npm run test:sample-lines-routes
npm run validate:event-quality
npm run gate:playability
npm run gate:golden-line
npm run gate:experience
```

Classify failures using repository policy. Existing B0 dirty-worktree/source-freeze and pre-existing quality/playability/golden-line/experience failures must be reported separately and must not be fixed under this task unless the new diff directly caused them.

- [ ] **Step 3: Run the mandatory Complexity STOP audit**

Before declaring completion, inspect the diff and answer each question `NO`:

```text
Did we add a second semantic instantiation dimension?
Did we add generic person attributes/metadata?
Did any event bind multiple instantiated persons?
Did male/female variants require different Character Anchors/Core Concern/core choices/effects?
Did we add person-aware condition language?
Did we add generic effect templating?
Did we add Person/NPC registry/state?
Did we change Snapshot schema?
Did we add compatibility inference/fallback/migration?
Did we generalize Parenthood?
```

If any answer is `YES`, verdict is `BLOCKED`; do not rationalize it as an implementation detail.

- [ ] **Step 4: Verify changed-file scope**

Run:

```bash
git status --short
git diff --stat
git diff --name-only
```

Every changed runtime line must trace to PD-103 or the existing introduced-marriage migration. Do not clean unrelated dirty files.

- [ ] **Step 5: Clean the temporary Superpowers plan after closure**

Per `docs/README.md`, completed `docs/superpowers/**` material is temporary workspace, not long-term authority. If this plan file was placed in the repository, remove it after implementation is complete and the accepted product authority/PD-103 fully capture the durable rules:

```bash
git rm docs/superpowers/plans/2026-08-31-sex-variant-person-archetype-v1.md
git commit -m "chore: retire completed sex-variant implementation plan"
```

Do not delete the accepted product contract.

- [ ] **Step 6: Final report and STOP**

Report exactly these categories:

```text
verdict: CONFIRMED / PARTIAL / BLOCKED
changed files
PD-103 / authority closure status
runtime architecture files
persisted fact key and two variants
male-player full path result
female-player full path result
save/load stability result
pre-PD-103 compatibility behavior (explicitly unsupported; no reconstruction)
set_spouse_from_person behavior
Snapshot version / top-level shape
runtime file count / event count
focused verification
repository-level verification and pre-existing blockers
Complexity STOP audit
whether any Generic Person Instantiation / NPC registry / person condition / generic effect templating / Parenthood generalization was introduced
```

Then STOP. Do not start Generic Relationship Legacy migration, random names, random-sex non-marriage NPCs, second archetype, portrait variants, sex-gated events, or any broader Person capability.

---

## Implementation Review Notes

The intended player-visible product change is deliberately small:

```text
商贾之家男性玩家 → 家里介绍的 concrete person 是沈清禾
商贾之家女性玩家 → 家里介绍的 concrete person 是沈知衡
```

Both are the same authored character archetype, not two independently maintained marriage plots. The feature is successful only if this diversity is achieved **without** turning Person into a general simulation subsystem.
