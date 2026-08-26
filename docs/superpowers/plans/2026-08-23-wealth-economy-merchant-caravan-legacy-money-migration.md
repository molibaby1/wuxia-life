# Merchant Caravan Legacy Money Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove precise legacy `money` semantics from `merchant_caravan_guard`, preserve self-made merchant progression by migrating `merchant_market_monopoly` entry to Wealth Capacity, and leave market-event internal money rewards explicitly deferred.

**Architecture:** Reuse the already-delivered `wealth_capacity_at_least` condition and monotonic `wealth_capacity_raise_to` effect; no new runtime primitive is required. Migrate only caravan choice requirements/effects plus the immediate downstream market-event entry gate. Correct the existing non-canonical caravan choice `conditions[]` authoring to singular `condition`, prove the full route with one new focused authoring/runtime test, and update only tests/docs that intentionally freeze the superseded caravan wallet behavior.

**Tech Stack:** TypeScript, JSON-authored events, Node `assert`, existing EventLoader / ConditionEvaluator / GameEngineIntegration / Wealth Capacity / Asset infrastructure.

**Spec:** `docs/product/wealth-economy-merchant-caravan-legacy-money-migration-design.md`

## Global Constraints

- Wealth Capacity remains categorical: `no_surplus`, `modest_savings`, `comfortable_means`, `wealthy`, `regional_magnate`.
- Reuse existing `wealth_capacity_at_least` and `wealth_capacity_raise_to`; do not add a new Wealth runtime primitive.
- `wealth_capacity_raise_to` remains monotonic and must never lower current Wealth Capacity.
- High legacy `money` must not substitute for the accepted caravan Wealth / martial requirements.
- `merchant_shop` remains the only AssetId; do not add a caravan Asset.
- `merchant_caravan_success` remains a milestone flag, not an Asset.
- Snapshot remains exactly `3.15.0`; no persisted-field or save migration.
- `merchant_market_monopoly` internal `money +80/+40` choice effects remain unchanged and must be guarded as deferred debt.
- Other merchant `money` consumers, origin `money +200`, `merchant_wealth_peak +200`, P17, and global money retirement are out of scope.
- Do not build generic composite conditions, alternative-path frameworks, economy-score abstractions, or Wealth arithmetic.
- Existing unrelated dirty work must be preserved; do not reset/clean it.
- Do not create commits unless explicitly requested by the Human.

---

## File Structure

**Create**
- `tests/merchantCaravanLegacyMoneyMigration.test.ts` — focused authoring + runtime + downstream-continuity proof for this slice.

**Modify**
- `src/data/lines/merchant.json` — migrate only `merchant_caravan_guard` and `merchant_market_monopoly` entry eligibility.
- `tests/merchantShopLegacyMoneyMigration.test.ts` — retire the previous scope guard that intentionally required caravan legacy money; replace it with a guard that market choice rewards remain deferred.
- `tests/runRealTestGate.ts` — register the new focused test.
- `docs/product/wealth-economy-product-contract-design.md` — update Part B implementation inventory after verification.
- `docs/governance/product-decisions.md` — add PD-068 only after implementation semantics are verified.
- `docs/README.md` — index the accepted/delivered caravan migration design.

**Inspect; modify only if direct exact-contract regression proves necessary**
- `tests/p95MerchantOperatingChainTests.ts`
- `tests/merchantShopAssetVertical.test.ts`
- other merchant-focused tests that directly freeze the changed caravan authoring shape.

**Do not modify**
- Wealth runtime implementation (`src/types/wealthCapacity.ts`, `src/core/EventExecutor.ts`) unless a pre-existing bug in the already accepted primitive is independently demonstrated; this plan expects no runtime change.
- `merchant_market_monopoly` choice effects/text for `money +80/+40`.
- Asset schema / ownership module.
- Snapshot / save schema.

---

### Task 1: Write the caravan migration contract test (RED)

**Files:**
- Create: `tests/merchantCaravanLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes existing `wealth_capacity_at_least` condition.
- Consumes existing `wealth_capacity_raise_to` effect.
- Consumes existing canonical `merchant_shop` Asset gate.
- Produces a focused executable specification for Tasks 2–3.

- [ ] **Step 1: Add authoring helpers**

Create helpers equivalent to:

```ts
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

function hasMoneyEffect(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money',
  );
}
```

Also add a `baseState()` helper using a real `GameEngineIntegration.startNewGame(...)` state rather than a hand-invented partial state.

- [ ] **Step 2: Add RED authoring assertions**

Assert the intended final authoring:

```ts
const caravan = getEvent('merchant_caravan_guard');
const elite = getChoice(caravan, 'hire_elite_guards');
const personal = getChoice(caravan, 'escort_personally');
const normal = getChoice(caravan, 'hire_normal_guards');

assert.deepEqual(elite.condition, {
  type: 'wealth_capacity_at_least',
  minimum: 'comfortable_means',
});
assert.equal((elite as any).conditions, undefined);
assert.equal(hasMoneyEffect(elite), false);

assert.deepEqual(personal.condition, {
  type: 'expression',
  expression: 'martialPower >= 30',
});
assert.equal((personal as any).conditions, undefined);
assert.equal(hasMoneyEffect(personal), false);
assert(
  personal.effects?.some(
    effect => effect.type === 'wealth_capacity_raise_to'
      && effect.minimum === 'comfortable_means',
  ),
);

assert.equal(hasMoneyEffect(normal), false);
assert.equal(
  normal.effects?.some(effect => effect.type === 'wealth_capacity_raise_to'),
  false,
);
```

Also assert the elite text no longer contains `金钱` or `150`.

- [ ] **Step 3: Add RED downstream-entry assertions**

Assert `merchant_market_monopoly.conditions` becomes exactly the semantic AND of caravan success + Wealth Capacity:

```ts
const market = getEvent('merchant_market_monopoly');
assert.deepEqual(market.conditions, [
  {
    type: 'expression',
    expression: 'flags.merchant_caravan_success == true',
  },
  {
    type: 'wealth_capacity_at_least',
    minimum: 'comfortable_means',
  },
]);
```

Guard the deferred boundary:

```ts
for (const choice of market.choices ?? []) {
  assert(
    choice.effects?.some(
      effect => effect.type === 'stat_modify'
        && (effect.target ?? effect.stat) === 'money',
    ),
    `${choice.id} market money reward is intentionally deferred`,
  );
}
```

- [ ] **Step 4: Add RED runtime eligibility assertions**

Using `ConditionEvaluator`, prove:

```text
modest_savings + money 999 → elite unavailable
comfortable_means + money 0 → elite available
martialPower 29 → personal unavailable
martialPower 30 → personal available
```

Evaluate `choice.condition` (singular), not `choice.conditions`.

- [ ] **Step 5: Add RED runtime effect assertions**

Execute real choice effects through `GameEngineIntegration.executeChoiceEffects(...)` with sentinel `money = 37`.

Prove elite path:

```text
comfortable_means + elite
→ money remains 37
→ Wealth remains comfortable_means
→ reputation +10
→ merchant_caravan_success true
```

Prove personal path from self-made merchant:

```text
modest_savings + martialPower 30 + personal
→ money remains 37
→ Wealth becomes comfortable_means
→ martialPower +5
→ merchant_caravan_success true
```

Also execute personal path from `wealthy` and assert Wealth remains `wealthy`.

Prove normal path:

```text
money remains 37
Wealth unchanged
charisma +3
merchant_caravan_success is not set by this choice
```

Use a fresh engine/state per branch so flags do not leak across assertions.

- [ ] **Step 6: Add downstream continuity runtime assertions**

With `ConditionEvaluator`, prove both event conditions must pass:

```text
merchant_caravan_success + no/modest Wealth + money 999
→ market Wealth condition false

merchant_caravan_success + comfortable_means + money 0
→ both market conditions true
```

- [ ] **Step 7: Run the new test and confirm RED for the intended reasons**

Run:

```bash
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
```

Expected before implementation: FAIL because caravan still contains legacy money effects / plural choice `conditions`, and market entry still contains `money >= 150`.

Do not change the test to match the old implementation.

---

### Task 2: Migrate `merchant_caravan_guard`

**Files:**
- Modify: `src/data/lines/merchant.json`
- Test: `tests/merchantCaravanLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes existing `wealth_capacity_at_least`.
- Consumes existing `wealth_capacity_raise_to`.
- Preserves existing event-level `asset_owned: merchant_shop` + rhythm condition.

- [ ] **Step 1: Canonicalize elite choice eligibility**

Replace the choice-level plural legacy condition:

```json
"conditions": [
  {"type": "expression", "expression": "money >= 150"}
]
```

with singular canonical:

```json
"condition": {
  "type": "wealth_capacity_at_least",
  "minimum": "comfortable_means"
}
```

Update player-facing text to remove the exact-money requirement, e.g.:

```text
雇佣精锐保镖团队（需财力达到家资殷实，安全率最高）
```

- [ ] **Step 2: Remove elite wallet arithmetic**

Delete only:

```json
{"type":"stat_modify","stat":"money","value":-150}
{"type":"stat_modify","stat":"money","value":100}
```

Keep:

```json
{"type":"stat_modify","stat":"reputation","value":10}
{"type":"flag_set","flag":"merchant_caravan_success","value":true}
```

Do not add Wealth downgrade or a redundant Wealth raise effect.

- [ ] **Step 3: Canonicalize personal-escort eligibility**

Replace plural:

```json
"conditions": [
  {"type":"expression","expression":"martialPower >= 30"}
]
```

with singular:

```json
"condition": {
  "type":"expression",
  "expression":"martialPower >= 30"
}
```

This makes the existing accepted martial requirement actually visible to Browser/Headless canonical choice availability.

- [ ] **Step 4: Replace personal wallet reward with economic-identity transition**

Delete:

```json
{"type":"stat_modify","stat":"money","value":60}
```

Keep martial growth and success flag, and add:

```json
{"type":"wealth_capacity_raise_to","minimum":"comfortable_means"}
```

Resulting semantics must be equivalent to:

```text
martialPower +5
wealthCapacity raise_to comfortable_means
merchant_caravan_success = true
```

- [ ] **Step 5: Remove normal-guard ordinary cash reward**

Delete only:

```json
{"type":"stat_modify","stat":"money","value":30}
```

Keep:

```json
{"type":"stat_modify","stat":"charisma","value":3}
```

Do not add success flag, Wealth change, or a replacement numeric reward.

- [ ] **Step 6: Run the focused test**

```bash
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
```

Expected: caravan assertions pass; downstream market-entry assertions may still fail until Task 3.

---

### Task 3: Migrate only `merchant_market_monopoly` entry continuity

**Files:**
- Modify: `src/data/lines/merchant.json`
- Test: `tests/merchantCaravanLegacyMoneyMigration.test.ts`

**Interfaces:**
- Consumes caravan success flag from Task 2.
- Consumes canonical Wealth requirement.
- Does not modify market choice outcomes.

- [ ] **Step 1: Replace the combined legacy market entry expression**

Replace:

```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.merchant_caravan_success == true && money >= 150"
  }
]
```

with:

```json
"conditions": [
  {
    "type": "expression",
    "expression": "flags.merchant_caravan_success == true"
  },
  {
    "type": "wealth_capacity_at_least",
    "minimum": "comfortable_means"
  }
]
```

Event-level `conditions[]` are intentional AND semantics; do not add a composite-condition framework.

- [ ] **Step 2: Leave market choices untouched**

Confirm by diff that these remain exactly legacy debt for this slice:

```text
monopoly_trade → money +80
fair_competition → money +40
```

Do not edit their text/effects.

- [ ] **Step 3: Run the focused test**

```bash
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
```

Expected: PASS.

---

### Task 4: Retire stale exact-contract assertions and prove adjacent merchant continuity

**Files:**
- Modify: `tests/merchantShopLegacyMoneyMigration.test.ts`
- Inspect/modify only if directly required: `tests/p95MerchantOperatingChainTests.ts`
- Inspect/modify only if directly required: `tests/merchantShopAssetVertical.test.ts`
- Test: `tests/merchantCaravanLegacyMoneyMigration.test.ts`

**Interfaces:**
- Removes only assertions that intentionally froze caravan legacy wallet behavior.
- Preserves shop Asset and P95 rhythm semantics.

- [ ] **Step 1: Update the old shop-migration scope guard**

`tests/merchantShopLegacyMoneyMigration.test.ts` currently asserts that caravan choices still contain money effects and `money >= 150`. That was correct as the predecessor slice boundary and is now stale.

Replace that guard with the new deferred boundary:

```ts
const market = getEvent('merchant_market_monopoly');
assert(
  market.choices!.some(choice => hasMoneyEffect(choice)),
  'market choice money rewards remain deferred after caravan migration',
);
```

Also assert caravan no longer has money effects if that improves the predecessor test's boundary clarity.

- [ ] **Step 2: Run adjacent focused suites before changing them**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/p95MerchantOperatingChainTests.ts
```

If a suite fails only because it freezes the now-accepted caravan choice condition shape or wallet behavior, make the minimum test-contract synchronization.

Do not modify P95 rhythm/pressure product semantics or Asset ownership semantics.

- [ ] **Step 3: Re-run all four focused suites**

```bash
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/p95MerchantOperatingChainTests.ts
```

Expected: PASS.

---

### Task 5: Register the real gate and synchronize authority

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`
- Repository design location: `docs/product/wealth-economy-merchant-caravan-legacy-money-migration-design.md`

**Interfaces:**
- Produces real-gate coverage for the caravan slice.
- Produces PD-068 after verified implementation.
- Updates Part B implementation reality without changing Product Contract Part A.

- [ ] **Step 1: Register the focused test**

Add an entry adjacent to existing Wealth / Asset / merchant migration suites:

```ts
{
  name: 'merchantCaravanLegacyMoneyMigration',
  entry: 'tests/merchantCaravanLegacyMoneyMigration.test.ts',
},
```

Do not reorder unrelated gate entries.

- [ ] **Step 2: Run the registered test directly once more**

```bash
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
```

Expected: PASS.

- [ ] **Step 3: Update Wealth Contract Part B only**

Record implementation facts equivalent to:

- `merchant_caravan_guard` no longer reads/writes exact `money`;
- elite path uses `wealth_capacity_at_least comfortable_means`;
- personal escort uses martial requirement + `wealth_capacity_raise_to comfortable_means`;
- normal guard no longer creates ordinary cash reward;
- `merchant_market_monopoly` entry uses caravan success + Wealth Capacity;
- market choice `money +80/+40` remains deferred debt;
- no caravan Asset, no Snapshot change.

Do not modify Part A accepted Product Contract semantics.

- [ ] **Step 4: Add PD-068**

Add a concise Product Decision recording the delivered implementation boundary. It must explicitly state the deferred market choice rewards and no-caravan-Asset decision.

- [ ] **Step 5: Update docs index**

Add the caravan migration design under accepted product contracts / current Wealth migration docs, marked delivered only after verification.

- [ ] **Step 6: Run documentation diff check**

```bash
git diff --check
```

Expected: PASS.

---

### Task 6: Closure verification and scope audit

**Files:**
- No new production scope.
- Modify documentation only if fresh verification status requires factual correction.

- [ ] **Step 1: Run focused Wealth / Asset / merchant suites**

At minimum:

```bash
npm exec tsx tests/merchantCaravanLegacyMoneyMigration.test.ts
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/p95MerchantOperatingChainTests.ts
```

Expected: PASS.

- [ ] **Step 2: Run canonical gates**

```bash
npm run typecheck
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run build
npm exec tsx tests/AllTests.ts
```

Expected: scope-local PASS. Record current AllTests count; do not hard-code a historical count in implementation logic.

- [ ] **Step 3: Run event-quality validation**

```bash
npm run validate:event-quality
```

The repository may retain broad historical quality findings. Required slice-local evidence:

- no `invalid_condition` caused by the new Wealth conditions;
- no new blocker attributable to `merchant_caravan_guard` / `merchant_market_monopoly` authoring.

Do not repair unrelated event-quality baseline issues.

- [ ] **Step 4: Run the real gate**

```bash
npm test
```

This command must actually be executed even if known broad baselines remain red.

From the log explicitly report the registered Wealth / Asset / Merchant Shop / Merchant Caravan suites. If those pass and final failure is only pre-existing / unrelated broad gates, do not widen this task.

If a clean scope-local suite fails because of this slice, closure is blocked until that regression is fixed.

- [ ] **Step 5: Run final diff and scope searches**

```bash
git diff --check
rg -n 'money >= 150|"stat": "money"|"target": "money"' src/data/lines/merchant.json
rg -n 'merchant_caravan' src/types src/core src/data tests docs
```

Interpretation:

- `merchant_caravan_guard` itself must have no exact `money` requirement/effect.
- `merchant_market_monopoly` entry must have no exact `money` gate.
- its two choice money rewards must still appear as intentional deferred debt.
- no `merchant_caravan` AssetId or new persisted field may exist.

- [ ] **Step 6: Audit changed-file scope**

Use `git status --short` and `git diff --name-only` against the task start point.

Allowed task-owned files are the files listed in this plan plus any directly demonstrated exact-contract test synchronization from Task 4.

Do not include unrelated Auto Evolution / B0 / P8 dirty work.

---

## Acceptance Criteria

The slice may be reported as `MERCHANT_CARAVAN_LEGACY_MONEY_MIGRATION_DELIVERED` only when:

1. `merchant_caravan_guard` contains no precise legacy `money` requirement/cost/reward.
2. Elite guards use canonical singular `condition: wealth_capacity_at_least comfortable_means`.
3. Personal escort uses canonical singular martial condition and raises Wealth to at least `comfortable_means` on success.
4. Normal guards do not mutate money, Wealth, or caravan-success state.
5. High legacy `money` alone cannot unlock elite guards.
6. High legacy `money` alone cannot unlock `merchant_market_monopoly`.
7. `merchant_caravan_success + comfortable_means` unlocks the market stage even with `money = 0`.
8. `merchant_market_monopoly` choice `money +80/+40` remains unchanged and documented as deferred debt.
9. No second Asset is added; `merchant_shop` remains the only AssetId.
10. Snapshot remains `3.15.0`; no save/schema migration occurs.
11. Focused tests and canonical compile/contract/headless/build checks pass.
12. `npm test` is actually run and scope-local registered suites pass.
13. No unrelated broad-gate repair or refactor is bundled.
14. Documentation / PD-068 reflect actual verified implementation, not intended future work.

## Final Report Format

### 1. Result

Return one of:

```text
MERCHANT_CARAVAN_LEGACY_MONEY_MIGRATION_DELIVERED
MERCHANT_CARAVAN_LEGACY_MONEY_MIGRATION_REGRESSION_REMAINS
```

### 2. Changed files

List exact implementation, tests/gate, and docs changes.

### 3. Caravan semantics

Report elite / personal / normal path conditions and effects.

### 4. Downstream continuity

Report `merchant_market_monopoly` entry behavior and prove `money` no longer gates entry.

### 5. Deferred debt

Confirm market choice `money +80/+40` and all other out-of-scope merchant money remain unchanged.

### 6. Verification

Report focused tests, typecheck, contracts, headless/parity, build, AllTests, event quality, real gate, and diff check.

### 7. Broad failures

If any broad gate remains red, separate exact scope-local failures from pre-existing / unrelated failures. Do not label the slice delivered if a scope-local registered suite fails.

### 8. Mutation boundary

Confirm:

- no caravan Asset;
- no Snapshot change;
- no Wealth arithmetic/downgrade;
- no market choice migration;
- unrelated dirty work preserved;
- commits created: `0` unless Human explicitly requested otherwise.

### 9. Deviations

Write `None` if there are none.
