# Merchant Late Economic Progression Legacy Money Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `merchant_wealth_peak → merchant_sect_investment → merchant_business_empire → merchant_ending_tycoon` from legacy wallet semantics to the Human-accepted Wealth Capacity progression, including the first explicit Wealth Major Commitment downgrade.

**Architecture:** This is a configuration-first migration using only existing runtime primitives: `wealth_capacity_set`, `wealth_capacity_raise_to`, `wealth_capacity_at_least`, explicit additive `stat_modify`, and existing route flags. No runtime/schema changes are required. The focused regression suite freezes authoring semantics, real choice availability, intentional Wealth downgrade/recovery, wallet neutrality, and Tycoon ending eligibility.

**Tech Stack:** TypeScript, JSON event authoring, Node `assert`, existing `GameEngineIntegration`, `ConditionEvaluator`, `EventLoader`, real test gate.

**Spec:** `docs/product/wealth-economy-merchant-late-economic-progression-legacy-money-migration-design.md`

## Global Constraints

- Scope is only `merchant_wealth_peak`, `merchant_sect_investment`, `merchant_business_empire`, and `merchant_ending_tycoon` plus directly required focused-test/gate/docs synchronization.
- `merchant_ending_bankrupt`, Royal/Chamber/Hidden Wealth endings, identity-merchant, P26/P42, origin money, P17, global money retirement, Auto Evolution, B0, and P8 are out of scope.
- Snapshot remains exactly `3.15.0`.
- `merchant_shop` remains the only formal `AssetId`; do not add an empire or sect-investment Asset.
- Do not add a Wealth level or a generic Wealth-spending/decrement primitive.
- Heavy sect investment is the only authorized Wealth downgrade in this slice: `regional_magnate → wealthy` via existing `wealth_capacity_set`.
- Business Empire restores/ensures `regional_magnate` via existing `wealth_capacity_raise_to`.
- All retained non-economic stat deltas touched by this slice must use explicit `operator: "add"`.
- Do not modify `StatModifyHandler` defaults.
- Preserve `merchant_invest_good`, `merchant_invest_evil`, `merchant_invest_both`, `merchant_wealthy`, and `merchant_empire` flag identities.
- Do not reset/clean/stash/overwrite unrelated dirty work.
- Default `commits = 0`; do not create commits unless Human explicitly requests them after delivery.

---

## File Map

**Create**
- `tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts` — focused authoring + runtime contract for Peak/Sect/Empire/Tycoon.
- `docs/product/wealth-economy-merchant-late-economic-progression-legacy-money-migration-design.md` — accepted design copied from the provided spec artifact if it is not already present in the repository.

**Modify**
- `src/data/lines/merchant.json` — only the four accepted late-economy events.
- `tests/wealthMerchantVerticalSlice.test.ts` — retire the stale Peak `money +200` preservation assertions and replace them with the new wallet-neutral Peak contract.
- `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts` — replace only the stale `testPeakRemainsDeferred` boundary with a forward boundary asserting Peak is now migrated while later bankruptcy/other endings remain outside this suite.
- `tests/runRealTestGate.ts` — register `merchantLateEconomicProgressionLegacyMoneyMigration`.
- `docs/product/wealth-economy-product-contract-design.md` — Part B implementation inventory only.
- `docs/governance/product-decisions.md` — add PD-071.
- `docs/README.md` — index this migration design as delivered.

**Inspect only unless an exact regression proves synchronization is required**
- `tests/p102MerchantMartialPatronBridgeTests.ts`
- `tests/p103MerchantMartialPatronBridgeOriginTests.ts`
- `tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts`
- `tests/p101MerchantMagnateBridgeOriginEndgameTests.ts`
- `tests/p110MerchantMartialPatronLateLifeTests.ts`

These consumers depend on existing `merchant_invest_*` / `merchant_wealthy` / `merchant_empire` flags. The accepted design preserves those identities, so do not edit these tests pre-emptively.

---

### Task 1: RED — Freeze the Late-Economy Authoring Contract

**Files:**
- Create: `tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts`
- Inspect: `src/data/lines/merchant.json`

**Interfaces:**
- Consumes: `EventLoader.getInstance().getEventById(id)`, `EventChoice.condition`, `EffectDefinition`.
- Produces: focused assertions that later tasks must satisfy; no production mutation.

- [ ] **Step 1: Create focused event helpers and money/stat assertions**

Use the existing migration-test style:

```ts
import assert from 'node:assert/strict';
import { EventLoader } from '../src/core/EventLoader';
import type { EffectDefinition, EventChoice, EventDefinition } from '../src/types/eventTypes';

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

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function hasAdditiveStat(effects: EffectDefinition[], stat: string, value: number): boolean {
  return effects.some(effect =>
    effect.type === 'stat_modify'
    && (effect.target ?? effect.stat) === stat
    && effect.value === value
    && effect.operator === 'add'
  );
}
```

- [ ] **Step 2: Add Peak authoring assertions**

Assert:

```ts
const peak = getEvent('merchant_wealth_peak');
const peakEffects = peak.autoEffects ?? [];

assert.equal(peakEffects.some(isMoneyEffect), false);
assert(peakEffects.some(effect =>
  effect.type === 'wealth_capacity_set' && effect.value === 'regional_magnate'
));
assert(hasAdditiveStat(peakEffects, 'reputation', 25));
assert(hasAdditiveStat(peakEffects, 'charisma', 10));
assert(peakEffects.some(effect =>
  effect.type === 'flag_set'
  && effect.flag === 'merchant_wealthy'
  && effect.value === true
));
```

- [ ] **Step 3: Add Sect authoring assertions**

For `invest_righteous_heavy`, assert exactly the accepted Wealth gate shape:

```ts
assert.deepEqual(heavy.condition, {
  type: 'wealth_capacity_at_least',
  minimum: 'regional_magnate',
});
assert.equal((heavy as EventChoice & { conditions?: unknown }).conditions, undefined);
```

Assert every sect choice has no money effect.

Assert Heavy contains:

```ts
{ type: 'wealth_capacity_set', value: 'wealthy' }
```

and explicit additive deltas:

```text
chivalry +20
reputation +30
martialPower +10
```

Assert standard righteous has no Wealth effect and additive `chivalry +10`, `reputation +15`.

Assert evil has no Wealth effect and additive `martialPower +15`, `chivalry -10`.

Assert both has no Wealth effect and additive `charisma +12`.

Assert all three existing `merchant_invest_*` flag identities remain unchanged.

Assert Heavy copy contains neither `金钱` nor `500`.

- [ ] **Step 4: Add Business Empire and Tycoon authoring assertions**

For `merchant_business_empire`, assert:

```ts
const empireEffects = empire.autoEffects ?? [];
assert.equal(empireEffects.some(isMoneyEffect), false);
assert(empireEffects.some(effect =>
  effect.type === 'wealth_capacity_raise_to'
  && effect.minimum === 'regional_magnate'
));
assert(hasAdditiveStat(empireEffects, 'reputation', 20));
assert(hasAdditiveStat(empireEffects, 'charisma', 10));
assert(empireEffects.some(effect =>
  effect.type === 'flag_set'
  && effect.flag === 'merchant_empire'
  && effect.value === true
));
```

For `merchant_ending_tycoon`, assert the conditions are two canonical conditions, with one expression carrying only the milestone identity and one formal Wealth condition:

```ts
assert.equal(tycoon.conditions?.length, 2);
assert(tycoon.conditions?.some(condition =>
  condition.type === 'expression'
  && condition.expression === 'flags.merchant_empire == true'
));
assert(tycoon.conditions?.some(condition =>
  condition.type === 'wealth_capacity_at_least'
  && condition.minimum === 'regional_magnate'
));
assert.equal(
  tycoon.conditions?.some(condition =>
    condition.type === 'expression' && condition.expression.includes('money')
  ),
  false,
);
```

- [ ] **Step 5: Run the new focused suite and verify RED**

Run:

```bash
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
```

Expected: **FAIL** on current legacy authoring, including at least one of:

- Peak still has `money +200`;
- Heavy still uses plural `conditions` with `money >=500`;
- sect choices still have money effects;
- Empire still has `money set 150`;
- Tycoon still has `money >=500` in its expression;
- retained stat effects are missing `operator: add`.

Do not weaken the test to fit current JSON.

---

### Task 2: Migrate Wealth Peak and Sect Investment

**Files:**
- Modify: `src/data/lines/merchant.json` — `merchant_wealth_peak`, `merchant_sect_investment` only
- Test: `tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes: existing `wealth_capacity_set`, `wealth_capacity_at_least`, singular `EventChoice.condition`.
- Produces: wallet-neutral Peak and sect choices; Heavy Major Commitment `regional_magnate → wealthy`; existing invest flags preserved.

- [ ] **Step 1: Migrate `merchant_wealth_peak` minimally**

Change only its `autoEffects`:

```json
[
  {"type": "wealth_capacity_set", "value": "regional_magnate"},
  {"type": "stat_modify", "stat": "reputation", "value": 25, "operator": "add"},
  {"type": "stat_modify", "stat": "charisma", "value": 10, "operator": "add"},
  {"type": "flag_set", "flag": "merchant_wealthy", "value": true}
]
```

Remove only the legacy `money +200` effect. Keep the existing Wealth transition primitive and flag.

- [ ] **Step 2: Migrate `invest_righteous_heavy`**

Replace plural legacy money conditions with singular canonical condition:

```json
"condition": {
  "type": "wealth_capacity_at_least",
  "minimum": "regional_magnate"
}
```

Remove all money effects.

Add the intentional Major Commitment effect:

```json
{"type": "wealth_capacity_set", "value": "wealthy"}
```

Make retained stats explicit additive:

```json
{"type": "stat_modify", "stat": "chivalry", "value": 20, "operator": "add"},
{"type": "stat_modify", "stat": "reputation", "value": 30, "operator": "add"},
{"type": "stat_modify", "stat": "martialPower", "value": 10, "operator": "add"}
```

Keep `merchant_invest_good = true`.

Update choice text to remove precise wallet language and expose the strategic commitment, for example:

```text
倾力扶持正道（重大投入：财力降至豪富，侠义提升）
```

A style-equivalent wording is allowed, but it must not contain `金钱` or `500` and must not promise an unimplemented subsystem.

- [ ] **Step 3: Migrate the three standard sect choices**

For `invest_righteous`, `invest_evil`, and `invest_both`:

- delete the money effect;
- do not add any Wealth requirement;
- do not add any Wealth transition;
- preserve the existing route flag;
- make every retained stat delta explicit `operator: "add"`.

Exact retained deltas:

```text
invest_righteous:
  chivalry +10
  reputation +15
  merchant_invest_good

invest_evil:
  martialPower +15
  chivalry -10
  merchant_invest_evil

invest_both:
  charisma +12
  merchant_invest_both
```

- [ ] **Step 4: Run the focused suite**

Run:

```bash
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
```

Expected: it may still fail on Business Empire/Tycoon assertions, but all Peak/Sect authoring assertions must now pass. If the test stops at the first failure, temporarily use named subtests or assertions in a sequence that makes the failure location explicit; do not comment out later contract checks.

---

### Task 3: Runtime-Prove Peak and Sect Major Commitment

**Files:**
- Modify: `tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts`
- Production already modified in Task 2

**Interfaces:**
- Consumes: `GameEngineIntegration.executeChoiceEffects`, `ConditionEvaluator.evaluate`, existing Wealth handlers.
- Produces: deterministic runtime proof for Peak and all sect branches.

- [ ] **Step 1: Add deterministic runtime helpers**

Use:

```ts
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { GameState } from '../src/types/eventTypes';

const MONEY_SENTINEL = 37;

function startState(name: string): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame(name, 'male');
  const state = engine.getGameState();
  state.player.money = MONEY_SENTINEL;
  state.player.traits = [];
  return { engine, state };
}
```

- [ ] **Step 2: Prove Peak is wallet-neutral and additive**

Seed:

```text
wealthCapacity = wealthy
reputation = 40
charisma = 20
money = 37
```

Execute Peak `autoEffects` and assert:

```text
wealthCapacity = regional_magnate
money = 37
reputation = 65
charisma = 30
merchant_wealthy = true
```

- [ ] **Step 3: Prove Heavy choice availability uses Wealth, not wallet**

Use `ConditionEvaluator` against `heavy.condition`:

```text
regional_magnate + money 0   → true
wealthy + money 999          → false
```

Also assert `heavy.condition` exists and no plural `conditions` field survives.

- [ ] **Step 4: Prove Heavy executes an intentional Wealth downgrade**

Seed:

```text
wealthCapacity = regional_magnate
money = 37
chivalry = 30
reputation = 40
martialPower = 50
traits = []
```

Execute Heavy effects and assert:

```text
wealthCapacity = wealthy
money = 37
chivalry = 50
reputation = 70
martialPower = 60
merchant_invest_good = true
```

- [ ] **Step 5: Runtime-prove all standard choices are Wealth-neutral**

Use a small table-driven loop with fresh engines. Each starts at `regional_magnate`, `money = 37`, `traits = []`.

Expected outcomes:

```text
invest_righteous:
  Wealth regional_magnate
  money 37
  chivalry before +10
  reputation before +15
  merchant_invest_good

invest_evil:
  Wealth regional_magnate
  money 37
  martialPower before +15
  chivalry before -10
  merchant_invest_evil

invest_both:
  Wealth regional_magnate
  money 37
  charisma before +12
  merchant_invest_both
```

Choose non-boundary baselines (for example chivalry 30) so stat clamping does not hide additive behavior.

- [ ] **Step 6: Run the focused suite**

Run:

```bash
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
```

Expected: Peak/Sect authoring and runtime sections PASS; Business Empire/Tycoon may remain RED until Task 4.

---

### Task 4: Migrate Business Empire and Tycoon Ending, Then Prove Late-Spine Continuity

**Files:**
- Modify: `src/data/lines/merchant.json` — `merchant_business_empire`, `merchant_ending_tycoon` only
- Modify: `tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes: `wealth_capacity_raise_to regional_magnate`, formal event-level `wealth_capacity_at_least` condition.
- Produces: wallet-neutral Empire and canonical Tycoon ending gate.

- [ ] **Step 1: Migrate `merchant_business_empire`**

Replace current `autoEffects` with the accepted semantics:

```json
[
  {"type": "wealth_capacity_raise_to", "minimum": "regional_magnate"},
  {"type": "stat_modify", "stat": "reputation", "value": 20, "operator": "add"},
  {"type": "stat_modify", "stat": "charisma", "value": 10, "operator": "add"},
  {"type": "flag_set", "flag": "merchant_empire", "value": true}
]
```

Remove only the legacy `money set 150` effect.

- [ ] **Step 2: Migrate Tycoon entry conditions**

Replace:

```json
{"type": "expression", "expression": "flags.merchant_empire == true && money >= 500"}
```

with two event conditions:

```json
{"type": "expression", "expression": "flags.merchant_empire == true"},
{"type": "wealth_capacity_at_least", "minimum": "regional_magnate"}
```

Do not alter the ending flag/effect or other endings.

- [ ] **Step 3: Runtime-prove Business Empire recovery/no-op matrix**

Case A — Heavy route recovery:

```text
before:
  Wealth wealthy
  merchant_invest_good = true
  money = 37
  reputation = 40
  charisma = 20

after Empire:
  Wealth regional_magnate
  money = 37
  reputation = 60
  charisma = 30
  merchant_empire = true
```

Case B — ordinary route no-op:

```text
before:
  Wealth regional_magnate
  merchant_invest_evil = true
  money = 37

after Empire:
  Wealth regional_magnate
  money = 37
  merchant_empire = true
```

- [ ] **Step 4: Runtime-prove Tycoon eligibility matrix**

Implement a helper that evaluates **all** event conditions:

```ts
function eventConditionsPass(event: EventDefinition, state: GameState): boolean {
  const evaluator = new ConditionEvaluator();
  return (event.conditions ?? []).every(condition => evaluator.evaluate(condition, state));
}
```

Prove:

```text
merchant_empire = true, regional_magnate, money = 0   → true
merchant_empire = true, wealthy, money = 999          → false
merchant_empire absent, regional_magnate, money = 999 → false
```

- [ ] **Step 5: Add end-to-end Heavy late-spine runtime proof**

Start with:

```text
wealthCapacity = wealthy
merchant_chamber_head = true
money = 37
traits = []
```

Execute, in order:

```text
merchant_wealth_peak.autoEffects
invest_righteous_heavy.effects
merchant_business_empire.autoEffects
```

Assert after each stage:

```text
Peak:  regional_magnate, merchant_wealthy, money 37
Heavy: wealthy, merchant_invest_good, money 37
Empire: regional_magnate, merchant_empire, money 37
Tycoon conditions: true
```

This is the required proof that the late economic spine closes without wallet arithmetic.

- [ ] **Step 6: Run focused suite and require GREEN**

Run:

```bash
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
```

Expected: PASS.

---

### Task 5: Synchronize Existing Contracts Without Expanding Scope

**Files:**
- Modify: `tests/wealthMerchantVerticalSlice.test.ts`
- Modify: `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`
- Inspect only: `tests/p102MerchantMartialPatronBridgeTests.ts`, `tests/p103MerchantMartialPatronBridgeOriginTests.ts`, `tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts`, `tests/p101MerchantMagnateBridgeOriginEndgameTests.ts`, `tests/p110MerchantMartialPatronLateLifeTests.ts`

**Interfaces:**
- Consumes: new Peak contract and preserved `merchant_invest_*` flag identities.
- Produces: predecessor tests that no longer freeze retired wallet debt.

- [ ] **Step 1: Update `wealthMerchantVerticalSlice.test.ts` Peak authoring expectation**

Keep the existing assertion that Peak sets `regional_magnate`.

Replace the old assertion:

```text
merchant_wealth_peak must retain legacy money +200 for downstream consumers
```

with:

```ts
assert.equal(
  peak.autoEffects?.some(
    effect => effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === 'money'
  ),
  false,
  'merchant_wealth_peak must be wallet-neutral after late progression migration',
);
```

Also assert Peak retained reputation/charisma effects are additive if doing so matches this test's existing scope.

- [ ] **Step 2: Update `wealthMerchantVerticalSlice.test.ts` Peak runtime expectation**

Replace:

```text
afterPeak.money === moneyBeforePeak + 200
```

with:

```text
afterPeak.money === moneyBeforePeak
```

Keep `afterPeak.wealthCapacity === regional_magnate`.

Do **not** change the merchant-origin `money +200` assertions; origin money remains deferred.

- [ ] **Step 3: Retire the Official/Chamber predecessor deferred guard**

In `tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts`, replace only `testPeakRemainsDeferred()`.

New boundary should assert:

```text
merchant_wealth_peak:
  still sets regional_magnate
  no longer has money effect
```

Do not make that suite responsible for sect/empire/tycoon details; the new focused suite owns them.

- [ ] **Step 4: Run synchronized predecessor suites**

Run:

```bash
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Probe patron/late-life consumers before editing them**

Run without changing their code:

```bash
npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts
npm exec tsx tests/p103MerchantMartialPatronBridgeOriginTests.ts
npm exec tsx tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts
npm exec tsx tests/p101MerchantMagnateBridgeOriginEndgameTests.ts
npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts
```

Expected: PASS because `merchant_invest_*`, `merchant_wealthy`, and `merchant_empire` identities are unchanged.

If one fails, inspect the exact assertion. Only synchronize it if the failure directly encodes a retired wallet/set behavior from these four events. Do not change sample-line product semantics, bridge gates, or unrelated route design.

---

### Task 6: Real Gate Registration, Governance Closure, and Full Verification

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`
- Modify: `docs/product/wealth-economy-merchant-late-economic-progression-legacy-money-migration-design.md`

**Interfaces:**
- Consumes: all implemented runtime behavior and focused tests.
- Produces: registered real-gate evidence and repository authority closure.

- [ ] **Step 1: Register the focused suite**

Add beside the other merchant migration suites in `tests/runRealTestGate.ts`:

```ts
{
  name: 'merchantLateEconomicProgressionLegacyMoneyMigration',
  entry: 'tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts',
},
```

Do not reorder unrelated gates.

- [ ] **Step 2: Update Wealth / Economy Contract Part B only**

Synchronize implementation inventory so it states:

- `merchant_wealth_peak` legacy `money +200` is retired;
- Peak still sets `regional_magnate`;
- Heavy sect investment requires `regional_magnate` and intentionally sets Wealth to `wealthy` as a Human-authorized Major Commitment;
- standard sect investments are wallet-neutral and Wealth-neutral;
- Business Empire raises Wealth to at least `regional_magnate` and no longer writes money;
- Tycoon requires `merchant_empire` + `regional_magnate`, not wallet balance;
- `merchant_ending_bankrupt`, identity-merchant, P26/P42, origin legacy money, P17, and global money retirement remain deferred/unresolved as applicable.

Do not alter Part A product principles except for a factual cross-reference if the document structure requires it. The Major Commitment principle already exists; this slice supplies implementation evidence rather than creating generic Wealth spending rules.

- [ ] **Step 3: Add PD-071**

Record only the accepted semantics, for example:

```text
PD-071: Merchant late economic progression retires legacy wallet semantics.

- Wealth Peak retires money +200, keeps regional_magnate and additive social effects.
- Heavy righteous sect investment is the first explicitly authorized Wealth Major Commitment: regional_magnate requirement, intentional set to wealthy, persistent merchant_invest_good outcome.
- Other sect investment paths do not consume Wealth.
- Business Empire raises Wealth to at least regional_magnate and retains merchant_empire.
- Tycoon requires merchant_empire + regional_magnate; legacy money >=500 is retired.
- This does not authorize generic Wealth arithmetic, a second Asset, a new Wealth level, or bankruptcy migration.
```

Add re-discussion conditions for bankruptcy, generic Wealth spending, new Asset/level, or later identity-merchant/global wallet work.

- [ ] **Step 4: Update README and design delivery status**

Add the design to the accepted product design index in `docs/README.md` and mark it delivered only after implementation verification is complete.

Change the design status to:

```text
Human accepted on 2026-08-23; implementation delivered on 2026-08-23
```

Do not create a separate closure report document.

- [ ] **Step 5: Run focused and directly related suites**

Run:

```bash
npm exec tsx tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts
npm exec tsx tests/p103MerchantMartialPatronBridgeOriginTests.ts
npm exec tsx tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts
npm exec tsx tests/p101MerchantMagnateBridgeOriginEndgameTests.ts
npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts
npm exec tsx tests/AllTests.ts
```

Expected: all PASS.

- [ ] **Step 6: Run canonical build/contracts/headless verification**

Run:

```bash
npm run typecheck
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run build
npm run validate:event-quality
git diff --check
```

Requirements:

- typecheck/contracts/headless/parity/build/diff-check must PASS;
- `validate:event-quality` may retain known broad baseline blockers, but it must not report a new invalid condition caused by the Heavy singular Wealth condition or Tycoon formal Wealth condition.

Do not fix unrelated broad failures.

- [ ] **Step 7: Run the real gate**

Run:

```bash
npm test
```

From the real-gate output, explicitly report at least:

```text
wealthCapacityEventSemantics
wealthMerchantVerticalSlice
merchantShopAssetVertical
merchantShopLegacyMoneyMigration
merchantCaravanLegacyMoneyMigration
merchantMarketMonopolyLegacyMoneyMigration
merchantOfficialIntelligenceChamberLegacyMoneyMigration
merchantLateEconomicProgressionLegacyMoneyMigration
```

If any scope-local suite fails, the slice is not delivered.

Broad/pre-existing failures such as B0/source-freeze, P9, P11, P40, normalLongevityEndingClosure, or other independently evidenced baseline failures must be reported but not repaired in this task.

- [ ] **Step 8: Verify mutation boundary before reporting**

Run:

```bash
git status --short
git diff -- src/data/lines/merchant.json tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts tests/wealthMerchantVerticalSlice.test.ts tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts tests/runRealTestGate.ts docs/product/wealth-economy-product-contract-design.md docs/governance/product-decisions.md docs/README.md docs/product/wealth-economy-merchant-late-economic-progression-legacy-money-migration-design.md
git diff --check
```

Confirm:

```text
merchant_ending_bankrupt mutation = 0
other merchant endings mutation = 0
identity-merchant mutation = 0
P26/P42 mutation = 0
Asset schema mutation = 0
Snapshot mutation = 0
runtime primitive mutation = 0
global money retirement = 0
unrelated dirty work preserved = yes
commits = 0
```

---

## Expected Final Report

### 1. Result

Use exactly one:

```text
MERCHANT_LATE_ECONOMIC_PROGRESSION_MIGRATION_DELIVERED
```

or

```text
MERCHANT_LATE_ECONOMIC_PROGRESSION_MIGRATION_REGRESSION_REMAINS
```

### 2. Changed files

Group by:

- implementation;
- tests/gate;
- docs/governance.

### 3. Wealth Peak semantics

Report:

```text
money +200 retired
regional_magnate retained
reputation +25 additive
charisma +10 additive
merchant_wealthy retained
```

### 4. Sect Investment semantics

Report each choice and specifically prove:

```text
Heavy:
regional_magnate required
regional_magnate → wealthy
money unchanged
merchant_invest_good retained

Other three:
Wealth unchanged
money unchanged
route flags retained
```

### 5. Business Empire / Tycoon semantics

Report:

```text
Empire:
raise_to regional_magnate
merchant_empire retained
money unchanged

Tycoon:
merchant_empire + regional_magnate
no money gate
```

### 6. Runtime continuity

Report the Heavy end-to-end matrix:

```text
wealthy
→ Peak regional_magnate
→ Heavy wealthy
→ Empire regional_magnate
→ Tycoon eligible
```

and confirm the legacy money sentinel never changes.

### 7. Verification

Report every focused/canonical/real-gate command and distinguish scope-local from broad failures.

### 8. Mutation boundary

Explicitly confirm all forbidden areas remain untouched, especially `merchant_ending_bankrupt`.

### 9. Deviations

If none:

```text
None
```

Stop after reporting. Do not commit and do not continue into bankruptcy, identity-merchant, P26/P42, or global money retirement.
