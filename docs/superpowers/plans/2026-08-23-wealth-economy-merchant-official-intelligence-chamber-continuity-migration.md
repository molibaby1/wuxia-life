# Merchant Official–Intelligence–Chamber Continuity Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace legacy wallet semantics in `merchant_official_connection` → `merchant_intelligence_network` → `merchant_chamber_of_commerce` with the Human-accepted Wealth Capacity continuity while preserving route flags, additive non-economic outcomes, and the existing `merchant_wealth_peak` boundary.

**Architecture:** This is a configuration/test/governance migration using existing `wealth_capacity_at_least` and `wealth_capacity_raise_to` primitives. `heavy_bribe` becomes a Wealth-gated alternative path; intelligence retires its wallet producer; Chamber requires `comfortable_means` and raises economic identity to at least `wealthy`. No runtime primitive, Asset, persisted field, or Snapshot change is allowed.

**Tech Stack:** TypeScript, JSON event authoring, Node `assert/strict`, `tsx`, existing `EventLoader`, `ConditionEvaluator`, `GameEngineIntegration`, existing real test gate.

**Spec:** `docs/product/wealth-economy-merchant-official-intelligence-chamber-continuity-migration-design.md`

## Global Constraints

- Scope is exactly `merchant_official_connection`, `merchant_intelligence_network`, and `merchant_chamber_of_commerce`, plus focused tests/gate and governance closure.
- `heavy_bribe` requires `wealth_capacity_at_least wealthy`; it does not decrease Wealth Capacity.
- `moderate_bribe` has no Wealth requirement or Wealth transition.
- `merchant_intelligence_network` changes neither money nor Wealth Capacity.
- Chamber entry requires `merchant_intelligence` AND `wealth_capacity_at_least comfortable_means`.
- Chamber success uses `wealth_capacity_raise_to wealthy` and must not downgrade `wealthy` or `regional_magnate`.
- All retained non-economic stat deltas in the three touched events must explicitly use `operator: "add"`.
- Exact wallet reads/writes are retired from all three touched events; narrative references to silver may remain where they do not promise numeric wallet mechanics.
- `merchant_wealth_peak` remains untouched, including `wealth_capacity_set: regional_magnate` and legacy `money +200`.
- `merchant_shop` remains the only registered AssetId.
- Snapshot remains `3.15.0`; no save migration or new persisted field.
- No changes to Wealth enum, `StatModifyHandler`, condition/effect grammar, P17, identity-merchant, P26/P42, Auto Evolution, B0, P8, or unrelated broad failures.
- Preserve existing unrelated dirty work; do not reset, clean, stash, or overwrite it.
- **Commits are not authorized by this plan.** Keep `commits = 0` unless the Human separately asks for a scoped commit.

---

## File Map

**Create**

- `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts` — canonical authoring + runtime + continuity proof for the three-event slice.

**Modify**

- `src/data/lines/merchant.json` — only the three accepted events.
- `tests/runRealTestGate.ts` — register the new focused suite.
- `docs/product/wealth-economy-product-contract-design.md` — Part B implementation inventory only.
- `docs/governance/product-decisions.md` — add PD-070.
- `docs/README.md` — index the new design as delivered.
- `docs/product/wealth-economy-merchant-official-intelligence-chamber-continuity-migration-design.md` — mark implementation delivered and record factual final inventory if needed.

**Inspect only unless a scope-local regression proves synchronization is required**

- `tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts`
- `tests/wealthMerchantVerticalSlice.test.ts`
- `tests/p95MerchantOperatingChainTests.ts`

Do not edit those files merely to broaden coverage.

---

### Task 1: Migrate Official Connection off legacy wallet semantics

**Files:**
- Create: `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`
- Modify: `src/data/lines/merchant.json` — `merchant_official_connection` only

**Interfaces:**
- Consumes: `EventLoader.getInstance().getEventById(id)`, `ConditionEvaluator.evaluate(condition, state)`, `GameEngineIntegration.executeChoiceEffects(effects, eventId, choiceId)`, existing `wealth_capacity_at_least` condition.
- Produces: canonical `heavy_bribe.condition`, wallet-free official choices, explicit additive official stat effects, `merchant_official_friend` continuity.

- [ ] **Step 1: Create focused test helpers and failing Official authoring assertions**

Create `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts` with helpers following the existing merchant migration tests:

```ts
import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';

const MONEY_SENTINEL = 37;

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `missing choice ${id} in ${event.id}`);
  return choice;
}

function hasMoneyEffect(effects: EventDefinition['autoEffects'] | EventChoice['effects']): boolean {
  return (effects ?? []).some(
    effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money',
  );
}

function hasAdditiveStatEffect(
  effects: EventDefinition['autoEffects'] | EventChoice['effects'],
  stat: string,
  value: number,
): boolean {
  return (effects ?? []).some(
    effect => effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === stat
      && effect.value === value
      && effect.operator === 'add',
  );
}

function testOfficialAuthoring(): void {
  const official = getEvent('merchant_official_connection');
  const heavy = getChoice(official, 'heavy_bribe');
  const moderate = getChoice(official, 'moderate_bribe');
  const refuse = getChoice(official, 'refuse_bribe');

  assert.deepEqual(heavy.condition, {
    type: 'wealth_capacity_at_least',
    minimum: 'wealthy',
  });
  assert.equal((heavy as EventChoice & { conditions?: unknown }).conditions, undefined);
  assert.equal(hasMoneyEffect(heavy.effects), false);
  assert(hasAdditiveStatEffect(heavy.effects, 'reputation', 25));
  assert(hasAdditiveStatEffect(heavy.effects, 'charisma', 12));
  assert(heavy.effects.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_official_friend'
      && effect.value === true,
  ));
  assert.equal(heavy.text.includes('金钱'), false);
  assert.equal(heavy.text.includes('500'), false);

  assert.equal(moderate.condition, undefined);
  assert.equal(hasMoneyEffect(moderate.effects), false);
  assert(hasAdditiveStatEffect(moderate.effects, 'reputation', 15));
  assert(hasAdditiveStatEffect(moderate.effects, 'charisma', 8));
  assert(moderate.effects.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_official_friend'
      && effect.value === true,
  ));
  assert.equal(moderate.text.includes('金钱'), false);
  assert.equal(moderate.text.includes('-30'), false);

  assert.equal(hasMoneyEffect(refuse.effects), false);
  assert(hasAdditiveStatEffect(refuse.effects, 'chivalry', 10));
  assert(hasAdditiveStatEffect(refuse.effects, 'reputation', -5));
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Temporarily call only `testOfficialAuthoring()` from `run()` and execute:

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected RED evidence must include current legacy facts such as `heavy.condition` being `undefined`, plural `conditions[]`, money effects still present, or missing explicit `operator: add`.

- [ ] **Step 3: Apply the minimal Official authoring migration**

In `src/data/lines/merchant.json`, change only `merchant_official_connection`.

`heavy_bribe` must become equivalent to:

```json
{
  "id": "heavy_bribe",
  "text": "重孝换取特权（需财力：豪富，声望 +25）",
  "condition": {
    "type": "wealth_capacity_at_least",
    "minimum": "wealthy"
  },
  "effects": [
    {"type": "stat_modify", "stat": "reputation", "value": 25, "operator": "add"},
    {"type": "stat_modify", "stat": "charisma", "value": 12, "operator": "add"},
    {"type": "flag_set", "flag": "merchant_official_friend", "value": true}
  ]
}
```

`moderate_bribe` must retain no condition and become equivalent to:

```json
{
  "id": "moderate_bribe",
  "text": "适度孝敬（声望 +15）",
  "effects": [
    {"type": "stat_modify", "stat": "reputation", "value": 15, "operator": "add"},
    {"type": "stat_modify", "stat": "charisma", "value": 8, "operator": "add"},
    {"type": "flag_set", "flag": "merchant_official_friend", "value": true}
  ]
}
```

`refuse_bribe` must keep its current route semantics but make retained deltas explicit:

```json
{
  "id": "refuse_bribe",
  "text": "拒绝，保持清白",
  "effects": [
    {"type": "stat_modify", "stat": "chivalry", "value": 10, "operator": "add"},
    {"type": "stat_modify", "stat": "reputation", "value": -5, "operator": "add"}
  ]
}
```

Do not change the event-level entry condition or body copy.

- [ ] **Step 4: Add and run Official runtime proof**

Append deterministic runtime checks using `player.traits = []` and `money = MONEY_SENTINEL`:

```ts
async function testOfficialRuntime(): Promise<void> {
  const official = getEvent('merchant_official_connection');
  const heavy = getChoice(official, 'heavy_bribe');
  const moderate = getChoice(official, 'moderate_bribe');
  const evaluator = new ConditionEvaluator();

  const lowEngine = new GameEngineIntegration();
  lowEngine.startNewGame('Official Heavy Low Wealth', 'male');
  const low = lowEngine.getGameState();
  low.player.wealthCapacity = 'comfortable_means';
  low.player.money = 999;
  assert.equal(evaluator.evaluate(heavy.condition!, low), false);

  const heavyEngine = new GameEngineIntegration();
  heavyEngine.startNewGame('Official Heavy Wealthy', 'male');
  const heavyState = heavyEngine.getGameState();
  heavyState.player.wealthCapacity = 'wealthy';
  heavyState.player.money = MONEY_SENTINEL;
  heavyState.player.reputation = 20;
  heavyState.player.charisma = 20;
  heavyState.player.traits = [];
  await heavyEngine.executeChoiceEffects(heavy.effects, official.id, heavy.id);
  const heavyAfter = heavyEngine.getGameState();
  assert.equal(heavyAfter.player.money, MONEY_SENTINEL);
  assert.equal(heavyAfter.player.wealthCapacity, 'wealthy');
  assert.equal(heavyAfter.player.reputation, 45);
  assert.equal(heavyAfter.player.charisma, 32);
  assert.equal(heavyAfter.flags.merchant_official_friend, true);

  const moderateEngine = new GameEngineIntegration();
  moderateEngine.startNewGame('Official Moderate', 'male');
  const moderateState = moderateEngine.getGameState();
  moderateState.player.wealthCapacity = 'comfortable_means';
  moderateState.player.money = MONEY_SENTINEL;
  moderateState.player.reputation = 20;
  moderateState.player.charisma = 20;
  moderateState.player.traits = [];
  await moderateEngine.executeChoiceEffects(moderate.effects, official.id, moderate.id);
  const moderateAfter = moderateEngine.getGameState();
  assert.equal(moderateAfter.player.money, MONEY_SENTINEL);
  assert.equal(moderateAfter.player.wealthCapacity, 'comfortable_means');
  assert.equal(moderateAfter.player.reputation, 35);
  assert.equal(moderateAfter.player.charisma, 28);
  assert.equal(moderateAfter.flags.merchant_official_friend, true);
}
```

Call both `testOfficialAuthoring()` and `await testOfficialRuntime()` from `run()`.

Run:

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected: PASS for the Official portion.

- [ ] **Step 5: Check the task diff boundary**

```bash
git diff -- src/data/lines/merchant.json tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
git diff --check
```

Expected: only Official Connection plus the focused test is changed by this task. Do not commit.

---

### Task 2: Retire Intelligence Network wallet production

**Files:**
- Modify: `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`
- Modify: `src/data/lines/merchant.json` — `merchant_intelligence_network` only

**Interfaces:**
- Consumes: `merchant_official_friend` produced by Task 1; `GameEngineIntegration.executeChoiceEffects()` for autoEffects.
- Produces: wallet-neutral `merchant_intelligence_network`, explicit additive stat semantics, `merchant_intelligence` milestone.

- [ ] **Step 1: Append failing Intelligence authoring assertions**

Add:

```ts
function testIntelligenceAuthoring(): void {
  const intelligence = getEvent('merchant_intelligence_network');
  assert.equal(hasMoneyEffect(intelligence.autoEffects), false);
  assert(hasAdditiveStatEffect(intelligence.autoEffects, 'charisma', 8));
  assert(hasAdditiveStatEffect(intelligence.autoEffects, 'reputation', -5));
  assert(intelligence.autoEffects?.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_intelligence'
      && effect.value === true,
  ));
  assert.equal(
    intelligence.autoEffects?.some(
      effect => effect.type === 'wealth_capacity_set'
        || effect.type === 'wealth_capacity_raise_to',
    ),
    false,
  );
}
```

Call it from `run()` before changing production.

- [ ] **Step 2: Run and verify RED**

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected: FAIL because `merchant_intelligence_network` still contains the legacy money effect and lacks explicit additive operators.

- [ ] **Step 3: Apply minimal Intelligence migration**

Change only `merchant_intelligence_network.autoEffects` to:

```json
[
  {"type": "stat_modify", "stat": "charisma", "value": 8, "operator": "add"},
  {"type": "stat_modify", "stat": "reputation", "value": -5, "operator": "add"},
  {"type": "flag_set", "flag": "merchant_intelligence", "value": true}
]
```

Do not change event conditions, title/body copy, timing, priority, weight, or metadata.

- [ ] **Step 4: Add Intelligence runtime proof**

Add:

```ts
async function testIntelligenceRuntime(): Promise<void> {
  const intelligence = getEvent('merchant_intelligence_network');
  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Intelligence Wallet Neutral', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.money = MONEY_SENTINEL;
  state.player.charisma = 20;
  state.player.reputation = 20;
  state.player.traits = [];
  state.flags.merchant_official_friend = true;
  state.player.flags.merchant_official_friend = true;

  await engine.executeChoiceEffects(intelligence.autoEffects ?? [], intelligence.id);
  const after = engine.getGameState();
  assert.equal(after.player.money, MONEY_SENTINEL);
  assert.equal(after.player.wealthCapacity, 'comfortable_means');
  assert.equal(after.player.charisma, 28);
  assert.equal(after.player.reputation, 15);
  assert.equal(after.flags.merchant_intelligence, true);
}
```

Call it from `run()`.

Run:

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected: PASS through Official + Intelligence portions.

- [ ] **Step 5: Check task boundary**

```bash
git diff -- src/data/lines/merchant.json tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
git diff --check
```

Do not commit.

---

### Task 3: Replace Chamber wallet gate/reward with Wealth requirement + economic-development transition

**Files:**
- Modify: `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`
- Modify: `src/data/lines/merchant.json` — `merchant_chamber_of_commerce` only

**Interfaces:**
- Consumes: `merchant_intelligence` milestone from Task 2; existing `wealth_capacity_at_least` condition; existing `wealth_capacity_raise_to` effect.
- Produces: canonical chamber eligibility, wallet-neutral Chamber outcome, `merchant_chamber_head`, Wealth transition to at least `wealthy`.

- [ ] **Step 1: Append failing Chamber authoring assertions**

Add:

```ts
function testChamberAuthoring(): void {
  const chamber = getEvent('merchant_chamber_of_commerce');

  assert.deepEqual(chamber.conditions, [
    {
      type: 'expression',
      expression: 'flags.merchant_intelligence == true',
    },
    {
      type: 'wealth_capacity_at_least',
      minimum: 'comfortable_means',
    },
  ]);

  assert.equal(hasMoneyEffect(chamber.autoEffects), false);
  assert(chamber.autoEffects?.some(
    effect => effect.type === 'wealth_capacity_raise_to'
      && effect.minimum === 'wealthy',
  ));
  assert(hasAdditiveStatEffect(chamber.autoEffects, 'reputation', 30));
  assert(hasAdditiveStatEffect(chamber.autoEffects, 'charisma', 12));
  assert(chamber.autoEffects?.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_chamber_head'
      && effect.value === true,
  ));
}
```

Call it from `run()` before production changes.

- [ ] **Step 2: Run and verify RED**

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected: FAIL because Chamber still uses the mixed `money >= 300` expression, still writes money, lacks `wealth_capacity_raise_to wealthy`, and its retained stat effects are not explicitly additive.

- [ ] **Step 3: Apply minimal Chamber migration**

Change only `merchant_chamber_of_commerce`.

Conditions must be exactly:

```json
[
  {"type": "expression", "expression": "flags.merchant_intelligence == true"},
  {"type": "wealth_capacity_at_least", "minimum": "comfortable_means"}
]
```

Auto effects must be equivalent to:

```json
[
  {"type": "wealth_capacity_raise_to", "minimum": "wealthy"},
  {"type": "stat_modify", "stat": "reputation", "value": 30, "operator": "add"},
  {"type": "stat_modify", "stat": "charisma", "value": 12, "operator": "add"},
  {"type": "flag_set", "flag": "merchant_chamber_head", "value": true}
]
```

Do not modify `merchant_wealth_peak`.

- [ ] **Step 4: Add eligibility proof independent of legacy money**

Add:

```ts
function testChamberEligibilityRuntime(): void {
  const chamber = getEvent('merchant_chamber_of_commerce');
  const evaluator = new ConditionEvaluator();

  const lowEngine = new GameEngineIntegration();
  lowEngine.startNewGame('Chamber Low Wealth', 'male');
  const low = lowEngine.getGameState();
  low.flags.merchant_intelligence = true;
  low.player.flags.merchant_intelligence = true;
  low.player.wealthCapacity = 'modest_savings';
  low.player.money = 999;
  assert.equal(evaluator.evaluate(chamber.conditions![0], low), true);
  assert.equal(evaluator.evaluate(chamber.conditions![1], low), false);

  const comfortableEngine = new GameEngineIntegration();
  comfortableEngine.startNewGame('Chamber Comfortable', 'male');
  const comfortable = comfortableEngine.getGameState();
  comfortable.flags.merchant_intelligence = true;
  comfortable.player.flags.merchant_intelligence = true;
  comfortable.player.wealthCapacity = 'comfortable_means';
  comfortable.player.money = 0;
  assert.equal(evaluator.evaluate(chamber.conditions![0], comfortable), true);
  assert.equal(evaluator.evaluate(chamber.conditions![1], comfortable), true);
}
```

- [ ] **Step 5: Add Chamber Wealth transition matrix**

Add a helper:

```ts
async function assertChamberTransition(
  beforeWealth: 'comfortable_means' | 'wealthy' | 'regional_magnate',
  expectedWealth: 'wealthy' | 'regional_magnate',
): Promise<void> {
  const chamber = getEvent('merchant_chamber_of_commerce');
  const engine = new GameEngineIntegration();
  engine.startNewGame(`Chamber ${beforeWealth}`, 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = beforeWealth;
  state.player.money = MONEY_SENTINEL;
  state.player.reputation = 20;
  state.player.charisma = 20;
  state.player.traits = [];

  await engine.executeChoiceEffects(chamber.autoEffects ?? [], chamber.id);
  const after = engine.getGameState();
  assert.equal(after.player.money, MONEY_SENTINEL);
  assert.equal(after.player.wealthCapacity, expectedWealth);
  assert.equal(after.player.reputation, 50);
  assert.equal(after.player.charisma, 32);
  assert.equal(after.flags.merchant_chamber_head, true);
}

async function testChamberRuntimeMatrix(): Promise<void> {
  await assertChamberTransition('comfortable_means', 'wealthy');
  await assertChamberTransition('wealthy', 'wealthy');
  await assertChamberTransition('regional_magnate', 'regional_magnate');
}
```

Call `testChamberEligibilityRuntime()` and `await testChamberRuntimeMatrix()` from `run()`.

Run:

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected: PASS through all three migrated events.

- [ ] **Step 6: Check task boundary**

```bash
git diff -- src/data/lines/merchant.json tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
git diff --check
```

Do not commit.

---

### Task 4: Prove end-to-end continuity and freeze the downstream boundary

**Files:**
- Modify: `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`
- Inspect only: `src/data/lines/merchant.json` — `merchant_wealth_peak`

**Interfaces:**
- Consumes: all three migrated events from Tasks 1–3.
- Produces: full-chain proof for fair/moderate and monopoly/heavy paths; explicit proof that `merchant_wealth_peak` is reachable by flag but remains deferred.

- [ ] **Step 1: Add a helper for event-level condition conjunction**

```ts
function eventConditionsPass(event: EventDefinition, engine: GameEngineIntegration): boolean {
  const evaluator = new ConditionEvaluator();
  const state = engine.getGameState();
  return (event.conditions ?? []).every(condition => evaluator.evaluate(condition, state));
}
```

- [ ] **Step 2: Add fair-route end-to-end continuity test**

Build the chain from a `comfortable_means` state without relying on wallet changes:

```ts
async function testFairModerateToChamberContinuity(): Promise<void> {
  const official = getEvent('merchant_official_connection');
  const moderate = getChoice(official, 'moderate_bribe');
  const intelligence = getEvent('merchant_intelligence_network');
  const chamber = getEvent('merchant_chamber_of_commerce');
  const peak = getEvent('merchant_wealth_peak');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Fair Moderate Chamber Continuity', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.money = MONEY_SENTINEL;
  state.player.reputation = 40;
  state.player.charisma = 20;
  state.player.traits = [];
  state.flags.merchant_fair_trade = true;
  state.player.flags.merchant_fair_trade = true;

  assert.equal(eventConditionsPass(official, engine), true);
  await engine.executeChoiceEffects(moderate.effects, official.id, moderate.id);
  assert.equal(engine.getGameState().player.money, MONEY_SENTINEL);
  assert.equal(eventConditionsPass(intelligence, engine), true);

  await engine.executeChoiceEffects(intelligence.autoEffects ?? [], intelligence.id);
  assert.equal(engine.getGameState().player.money, MONEY_SENTINEL);
  assert.equal(eventConditionsPass(chamber, engine), true);

  await engine.executeChoiceEffects(chamber.autoEffects ?? [], chamber.id);
  const after = engine.getGameState();
  assert.equal(after.player.money, MONEY_SENTINEL);
  assert.equal(after.player.wealthCapacity, 'wealthy');
  assert.equal(after.flags.merchant_chamber_head, true);
  assert.equal(eventConditionsPass(peak, engine), true);
}
```

- [ ] **Step 3: Add monopoly/heavy continuity test**

Use a `wealthy` state with legacy money below the old threshold to prove Heavy availability is Wealth-driven:

```ts
async function testMonopolyHeavyToChamberContinuity(): Promise<void> {
  const official = getEvent('merchant_official_connection');
  const heavy = getChoice(official, 'heavy_bribe');
  const intelligence = getEvent('merchant_intelligence_network');
  const chamber = getEvent('merchant_chamber_of_commerce');
  const evaluator = new ConditionEvaluator();

  const engine = new GameEngineIntegration();
  engine.startNewGame('Monopoly Heavy Chamber Continuity', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'wealthy';
  state.player.money = 0;
  state.player.reputation = 40;
  state.player.charisma = 20;
  state.player.traits = [];
  state.flags.merchant_monopoly = true;
  state.player.flags.merchant_monopoly = true;

  assert.equal(eventConditionsPass(official, engine), true);
  assert.equal(evaluator.evaluate(heavy.condition!, engine.getGameState()), true);
  await engine.executeChoiceEffects(heavy.effects, official.id, heavy.id);
  assert.equal(engine.getGameState().player.money, 0);

  assert.equal(eventConditionsPass(intelligence, engine), true);
  await engine.executeChoiceEffects(intelligence.autoEffects ?? [], intelligence.id);
  assert.equal(engine.getGameState().player.money, 0);

  assert.equal(eventConditionsPass(chamber, engine), true);
  await engine.executeChoiceEffects(chamber.autoEffects ?? [], chamber.id);
  assert.equal(engine.getGameState().player.wealthCapacity, 'wealthy');
  assert.equal(engine.getGameState().player.money, 0);
}
```

- [ ] **Step 4: Freeze the `merchant_wealth_peak` deferred boundary**

Add assertions, but do not execute or modify the event:

```ts
function testPeakRemainsDeferred(): void {
  const peak = getEvent('merchant_wealth_peak');
  assert(peak.autoEffects?.some(
    effect => effect.type === 'wealth_capacity_set'
      && effect.value === 'regional_magnate',
  ));
  assert(peak.autoEffects?.some(
    effect => effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === 'money'
      && effect.value === 200,
  ));
}
```

This assertion is a scope boundary, not approval of the future wallet semantics.

- [ ] **Step 5: Run the complete focused suite**

Ensure `run()` now executes every authoring/runtime/continuity function and ends with:

```ts
console.log('merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts: ok');
```

Run:

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
```

Expected: PASS.

Also run predecessor slices:

```bash
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
```

Expected: PASS. `wealthMerchantVerticalSlice` must still prove the deferred `merchant_wealth_peak money +200` behavior.

Do not commit.

---

### Task 5: Register the real gate and close repository authority

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`
- Modify: `docs/product/wealth-economy-merchant-official-intelligence-chamber-continuity-migration-design.md`

**Interfaces:**
- Consumes: delivered behavior and focused test from Tasks 1–4.
- Produces: real-gate coverage plus PD-070 and Part B factual inventory. No Product Contract Part A semantic rewrite.

- [ ] **Step 1: Register the focused suite**

In `tests/runRealTestGate.ts`, add next to the existing merchant migration suites:

```ts
{
  name: 'merchantOfficialIntelligenceChamberLegacyMoneyMigration',
  entry: 'tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts',
},
```

Do not reorder unrelated suites.

- [ ] **Step 2: Update Product Contract Part B only**

In `docs/product/wealth-economy-product-contract-design.md`, record the delivered repository facts:

```text
merchant_official_connection no longer reads/writes exact money;
heavy_bribe uses wealth_capacity_at_least wealthy as a singular choice condition;
moderate_bribe remains available without a Wealth requirement;
merchant_intelligence_network no longer writes money;
merchant_chamber_of_commerce requires merchant_intelligence + wealth_capacity_at_least comfortable_means;
chamber leadership uses wealth_capacity_raise_to wealthy;
merchant_wealth_peak and later merchant wallet consumers remain deferred.
```

Do not rewrite Part A or infer new general rules.

- [ ] **Step 3: Add PD-070**

Append a decision with this substance:

```text
PD-070: Merchant Official–Intelligence–Chamber continuity migrated from legacy wallet semantics

- heavy_bribe uses wealth_capacity_at_least wealthy as a stronger Wealth-gated Alternative Path; it does not consume or decrease Wealth Capacity.
- moderate_bribe retires its small wallet cost and continues to produce merchant_official_friend without a Wealth requirement.
- merchant_intelligence_network retires its legacy wallet producer and keeps merchant_intelligence as the durable milestone.
- merchant_chamber_of_commerce requires merchant_intelligence plus wealth_capacity_at_least comfortable_means and raises Wealth Capacity to at least wealthy when chamber leadership is established.
- retained non-economic stat deltas in these touched events are explicit additive effects.
- no new Asset, runtime primitive, persisted field, Snapshot migration, or downstream merchant wallet migration is introduced.
```

Re-discussion conditions must explicitly name `merchant_wealth_peak`, sect investment, business empire, tycoon/bankrupt endings, and parallel identity-merchant semantics as deferred future decisions.

- [ ] **Step 4: Update README and design delivery status**

Add the new design to `docs/README.md` beside the three earlier Wealth/Economy merchant migration designs and mark it delivered only after the focused implementation/test evidence exists.

Update the design status from “implementation not yet delivered” to delivered and keep the original accepted semantics intact.

- [ ] **Step 5: Run focused gate-level checks after authority changes**

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm run test:contracts
npm run typecheck
git diff --check
```

Expected: all PASS.

Do not commit.

---

### Task 6: Closure verification and scope attribution

**Files:**
- Verify all files changed in Tasks 1–5.
- Do not change unrelated files merely to make broad gates green.

**Interfaces:**
- Consumes: full migration slice.
- Produces: fresh closure evidence sufficient for Human review.

- [ ] **Step 1: Run all scope-local focused suites**

```bash
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/AllTests.ts
```

Expected: all scope-local suites PASS; report the current AllTests count rather than hard-coding an old baseline.

- [ ] **Step 2: Run canonical compile/contract/headless/build checks**

```bash
npm run typecheck
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run build
npm run validate:event-quality
git diff --check
```

Expected: no scope-local error and no new `invalid_condition` for Official/Intelligence/Chamber authoring.

- [ ] **Step 3: Run the real gate**

```bash
npm test
```

The command must actually be executed even if known broad failures remain.

From the log explicitly report PASS/FAIL for at least:

```text
wealthCapacityEventSemantics
wealthMerchantVerticalSlice
merchantShopAssetVertical
merchantShopLegacyMoneyMigration
merchantCaravanLegacyMoneyMigration
merchantMarketMonopolyLegacyMoneyMigration
merchantOfficialIntelligenceChamberLegacyMoneyMigration
```

If the new suite or a directly related Wealth/Asset/merchant migration suite fails, return:

```text
MERCHANT_OFFICIAL_INTELLIGENCE_CHAMBER_CONTINUITY_REGRESSION_REMAINS
```

Do not mark delivered.

If those suites pass and `npm test` fails only on attributable pre-existing/broad failures (for example known P9/P11/P40/B0/source-freeze or other unrelated suites), record them without modifying them; they do not block this slice closure.

- [ ] **Step 4: Perform mutation-boundary inspection**

Run:

```bash
git status --short
git diff --stat
git diff -- src/data/lines/merchant.json
git diff -- tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts tests/runRealTestGate.ts
git diff -- docs/product/wealth-economy-product-contract-design.md docs/governance/product-decisions.md docs/README.md docs/product/wealth-economy-merchant-official-intelligence-chamber-continuity-migration-design.md
```

Confirm:

```text
merchant_wealth_peak production mutation = 0
merchant_sect_investment mutation = 0
merchant_business_empire mutation = 0
merchant endings mutation = 0
identity-merchant mutation = 0
Asset schema mutation = 0
Snapshot mutation = 0
runtime primitive mutation = 0
unrelated dirty work preserved = yes
commits = 0
```

- [ ] **Step 5: Produce the final implementation report**

Use exactly one of:

```text
MERCHANT_OFFICIAL_INTELLIGENCE_CHAMBER_CONTINUITY_DELIVERED
```

or

```text
MERCHANT_OFFICIAL_INTELLIGENCE_CHAMBER_CONTINUITY_REGRESSION_REMAINS
```

Report:

1. changed files grouped as implementation / tests-gate / docs-governance;
2. Official semantics (heavy/moderate/refuse);
3. Intelligence semantics;
4. Chamber entry + Wealth transition matrix;
5. full fair/moderate and monopoly/heavy continuity evidence;
6. proof legacy money remains unchanged through the migrated path;
7. proof `merchant_wealth_peak` remains deferred and reachable by flag;
8. focused/canonical/real-gate results;
9. broad failures with scope attribution;
10. mutation boundary and `commits = 0`;
11. deviations, or `None`.

Stop after the report. Do not continue into `merchant_wealth_peak`, sect investment, empire, endings, or identity-merchant analysis/implementation.
