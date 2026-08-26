# Merchant Shop Legacy Money Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove precise legacy `money` reads/writes from the merchant talent → first shop → shop-failure lifecycle and make that vertical run on Wealth Capacity + `merchant_shop` Asset semantics.

**Architecture:** Add one narrow monotonic Wealth effect, `wealth_capacity_raise_to`, implemented beside the existing `wealth_capacity_set`. Migrate only `merchant_talent_discovery`, `merchant_first_shop`, and the shop-failure choices in `src/data/lines/merchant.json`; preserve Phase 1B Asset ownership and leave caravan/internal downstream money semantics unchanged. Update exact-contract tests that currently freeze the superseded wallet behavior, then close documentation/gates without widening scope.

**Tech Stack:** TypeScript, Vue/Vite, JSON-authored events, Node `assert`, existing GameEngine/EventLoader/ConditionEvaluator infrastructure.

**Spec:** `docs/product/wealth-economy-merchant-shop-legacy-money-migration-design.md`

## Global Constraints

- Wealth Capacity remains categorical: `no_surplus`, `modest_savings`, `comfortable_means`, `wealthy`, `regional_magnate`.
- `wealth_capacity_raise_to` is monotonic and must never lower current Wealth Capacity.
- Do not derive Wealth Capacity from `money`, numeric `wealth`, legacy flags, save payloads, or Asset ownership.
- `merchant_shop` remains the only AssetId; no second Asset is introduced.
- Snapshot remains exactly `3.15.0`; no snapshot/save migration or new persisted field.
- Opening, investing in, or closing the first shop must not automatically change Wealth Capacity.
- `merchant_caravan_guard` internal money requirement/reward/cost semantics are explicitly out of scope.
- Merchant origin legacy `money +200` and `merchant_wealth_peak money +200` remain unchanged.
- Do not modify P17 `money + wealth`, general `money` presentation, or global money retirement.
- Do not build a generic ordered-enum/composite-condition/economy framework.
- Existing unrelated dirty work must be preserved.

---

## File Structure

**Create**
- `tests/merchantShopLegacyMoneyMigration.test.ts` — focused end-to-end contract for this migration slice.

**Modify**
- `src/types/wealthCapacity.ts` — canonical monotonic raise helper.
- `src/types/eventTypes.ts` — new `WEALTH_CAPACITY_RAISE_TO` effect type and `minimum?: WealthCapacity` payload field.
- `src/core/EventExecutor.ts` — dedicated fail-closed `WealthCapacityRaiseToHandler` registration/implementation.
- `src/data/lines/merchant.json` — migrate only the accepted merchant-shop vertical.
- `tests/wealthCapacityEventSemantics.test.ts` — focused effect semantics and invalid-value regression.
- `tests/wealthMerchantVerticalSlice.test.ts` — retire the Phase-1A assertion that `invest_more` must keep `money -50`.
- `tests/merchantShopAssetVertical.test.ts` — freeze Asset lifecycle while asserting shop actions no longer mutate legacy money.
- `tests/testMerchantStatecraftVerticalSlice.ts` — update runtime vertical from wallet deltas to Wealth + Asset semantics.
- `tests/p38FrustrationRemediationTests.ts` — remove/fix exact assertions that intentionally froze the retired merchant money setback/condition.
- `tests/runRealTestGate.ts` — register the new focused migration test.
- `docs/product/wealth-economy-product-contract-design.md` — update Part B implementation inventory only after code/test verification.
- `docs/governance/product-decisions.md` — add the accepted migration decision as the next PD entry.
- `docs/README.md` — link the accepted design and reflect closure state.

**Do not modify**
- `src/contracts/gameStateSnapshot.ts`
- `src/types/asset.ts`
- `src/core/assetOwnership.ts` except only if a test proves an existing bug (not expected)
- `src/data/lines/origin.json`
- `merchant_caravan_guard` choice conditions/effects
- P17, P50, P8, B0, Auto Evolution, or unrelated route content

---

### Task 1: Add monotonic `wealth_capacity_raise_to`

**Files:**
- Modify: `src/types/wealthCapacity.ts`
- Modify: `src/types/eventTypes.ts`
- Modify: `src/core/EventExecutor.ts`
- Modify: `tests/wealthCapacityEventSemantics.test.ts`

**Interfaces:**
- Produces: `raiseWealthCapacityTo(current: WealthCapacity, minimum: WealthCapacity): WealthCapacity`
- Produces: `EffectType.WEALTH_CAPACITY_RAISE_TO = 'wealth_capacity_raise_to'`
- Produces effect payload: `{ type: 'wealth_capacity_raise_to', minimum: WealthCapacity }`
- Produces runtime handler semantics used by Task 2.

- [ ] **Step 1: Extend the existing focused test with RED cases**

Add assertions to `tests/wealthCapacityEventSemantics.test.ts` that execute the real EventExecutor path and prove:

```ts
const noSurplus = makeState();
noSurplus.player.wealthCapacity = 'no_surplus';
const raised = await engine.executeChoiceEffects([
  { type: 'wealth_capacity_raise_to', minimum: 'modest_savings' } as never,
], 'wealth_raise_probe', 'raise');
assert.equal(raised.gameState.player.wealthCapacity, 'modest_savings');
```

Also cover:

```ts
comfortable_means + raise_to modest_savings
→ comfortable_means

money before === money after
wealth before === wealth after
facts before deepEqual facts after
```

And invalid input:

```ts
{ type: 'wealth_capacity_raise_to', minimum: 'mythic' as never }
→ rejects/throws through the dedicated handler
```

Do not encode numeric `+1` behavior anywhere in the test.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
```

Expected: failure because `wealth_capacity_raise_to` is not a registered EffectType/handler.

- [ ] **Step 3: Add the canonical helper**

In `src/types/wealthCapacity.ts`, add:

```ts
export function raiseWealthCapacityTo(
  current: WealthCapacity,
  minimum: WealthCapacity,
): WealthCapacity {
  return meetsWealthCapacity(current, minimum) ? current : minimum;
}
```

Do not export rank numbers or add score/XP helpers.

- [ ] **Step 4: Add the effect contract**

In `src/types/eventTypes.ts`:

```ts
WEALTH_CAPACITY_RAISE_TO = 'wealth_capacity_raise_to',
```

and add the narrow payload field to `EffectDefinition`:

```ts
/** Minimum canonical Wealth Capacity for wealth_capacity_raise_to. */
minimum?: WealthCapacity;
```

Keep existing `wealth_capacity_set` unchanged.

- [ ] **Step 5: Implement and register the dedicated handler**

In `src/core/EventExecutor.ts`, import `raiseWealthCapacityTo` and add:

```ts
export class WealthCapacityRaiseToHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isWealthCapacity(effect.minimum)) {
      throw new Error(`Invalid wealth capacity minimum: ${String(effect.minimum)}`);
    }

    return {
      ...state,
      player: {
        ...state.player,
        wealthCapacity: raiseWealthCapacityTo(
          state.player.wealthCapacity,
          effect.minimum,
        ),
      },
    };
  }
}
```

Register exactly once:

```ts
this.handlers.set(
  EffectType.WEALTH_CAPACITY_RAISE_TO,
  new WealthCapacityRaiseToHandler(),
);
```

Do not route it through `StatModifyHandler`.

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/types/wealthCapacity.ts src/types/eventTypes.ts src/core/EventExecutor.ts tests/wealthCapacityEventSemantics.test.ts
git commit -m "feat: add monotonic wealth capacity raise effect"
```

---

### Task 2: Migrate merchant talent and first-shop eligibility

**Files:**
- Create: `tests/merchantShopLegacyMoneyMigration.test.ts`
- Modify: `src/data/lines/merchant.json`
- Modify: `tests/p38FrustrationRemediationTests.ts`
- Modify: `tests/testMerchantStatecraftVerticalSlice.ts`

**Interfaces:**
- Consumes: `wealth_capacity_raise_to` from Task 1.
- Produces: merchant talent → at least `modest_savings`.
- Produces: first-shop event requirement = `merchant_talent` AND Wealth Capacity ≥ `modest_savings`.

- [ ] **Step 1: Create the focused RED test for exact authoring semantics**

Create `tests/merchantShopLegacyMoneyMigration.test.ts` using real `EventLoader`, `ConditionEvaluator`, `GameEngineIntegration`, and `hasAsset`.

Start with authoring assertions:

```ts
const talent = getEvent('merchant_talent_discovery');
const studyBusiness = getChoice(talent, 'study_business');
const talentExpr = expressionConditions(talent).join(' ');

assert.equal(talentExpr.includes('money'), false);
assert.match(talentExpr, /flags\.origin_merchant_family/);
assert(
  studyBusiness.effects.some(
    effect => effect.type === 'wealth_capacity_raise_to'
      && effect.minimum === 'modest_savings',
  ),
);
assert.equal(
  studyBusiness.effects.some(
    effect => effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === 'money',
  ),
  false,
);
```

For `merchant_first_shop` assert exact event-level AND shape:

```ts
assert.deepEqual(shop.conditions, [
  { type: 'expression', expression: 'flags.merchant_talent == true' },
  { type: 'wealth_capacity_at_least', minimum: 'modest_savings' },
]);
```

- [ ] **Step 2: Add RED runtime cases proving wallet independence**

Use `ConditionEvaluator` to prove `merchant_talent_discovery` no longer treats arbitrary cash as merchant aptitude:

```ts
richButUnqualified.player.money = 999;
richButUnqualified.player.charisma = 1;
richButUnqualified.flags = { route_merchant: true };
assert.equal(evaluator.evaluate(talent.conditions![0], richButUnqualified), false);
```

Prove merchant-origin evidence replaces the old balance proxy when route context exists:

```ts
merchantOrigin.player.money = 0;
merchantOrigin.player.charisma = 1;
merchantOrigin.flags = {
  origin_merchant_family: true,
  route_merchant: true,
};
assert.equal(evaluator.evaluate(talent.conditions![0], merchantOrigin), true);
```

Retain the existing HVG route evidence case:

```ts
hvgState.player.money = 0;
hvgState.player.charisma = 1;
hvgState.flags = {
  route_merchant: true,
  hvg_merchant_first_challenge_done: true,
};
assert.equal(evaluator.evaluate(talent.conditions![0], hvgState), true);
```

- [ ] **Step 3: Run the new focused test and verify RED**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
```

Expected: FAIL on the old `money >= 50`, `money +20`, and first-shop money gate.

- [ ] **Step 4: Migrate `merchant_talent_discovery` authoring**

In `src/data/lines/merchant.json`, change the talent event expression to the accepted non-wallet proxy:

```text
(charisma >= 12 || flags.origin_merchant_family == true || flags.hvg_merchant_ledger_track == true || flags.hvg_merchant_caravan_track == true || flags.hvg_merchant_first_challenge_done == true) && (flags.merchant_childhood_seed_done == true || flags.p8_route_wealth == true || flags.route_merchant == true)
```

In `study_business.effects`, replace:

```json
{"type":"stat_modify","stat":"money","value":20}
```

with:

```json
{"type":"wealth_capacity_raise_to","minimum":"modest_savings"}
```

Keep:

```json
{"type":"stat_modify","stat":"charisma","value":5}
{"type":"flag_set","flag":"merchant_talent","value":true}
{"type":"flag_set","flag":"route_merchant","value":true}
```

Update `study_business.description` so it no longer claims a cash loss. Keep the “first bucket of gold” event narrative as narrative evidence of the strategic transition.

- [ ] **Step 5: Migrate `merchant_first_shop` eligibility**

Replace the single wallet expression with:

```json
"conditions": [
  {"type":"expression","expression":"flags.merchant_talent == true"},
  {"type":"wealth_capacity_at_least","minimum":"modest_savings"}
]
```

Do not add an OR/composite condition mechanism.

- [ ] **Step 6: Update P38 exact-contract expectations, not P38 production logic**

`tests/p38FrustrationRemediationTests.ts` currently freezes the merchant event as a money setback and freezes the old effects/condition string.

Update only the merchant-specific assertions:

- remove `merchant_talent_discovery` from the false-positive loop that labels its synthetic money loss an “actual setback”;
- remove the merchant case from the presentation target that expects a deterministic money cost warning;
- update `testWealthTargetEffectInvariance()` (rename locally if clarity requires) so the merchant block freezes the new effect array and no-money condition string instead of requiring legacy `money +20` / `money >= 50`.

Do not alter the hero/peril/sworn-help regression semantics.

- [ ] **Step 7: Update the statecraft vertical so Task 2 is fully green**

In `tests/testMerchantStatecraftVerticalSlice.ts`, capture `const initialMoney = initial.player.money` before executing `study_business`.

After `study_business`, assert:

```ts
afterTalent.player.flags?.merchant_talent === true
afterTalent.player.wealthCapacity === 'modest_savings'
afterTalent.player.money === initialMoney
```

Until Task 3 removes the opening cost, keep the existing Phase-1B shop checkpoint for this task: after `open_grocery_shop`, the shop-type flag and reputation still apply, the Asset is owned, and the legacy opening money effect still produces the current pre-Task-3 wallet result. This temporary assertion is removed in Task 3.

- [ ] **Step 8: Verify Task 2 GREEN**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/testMerchantStatecraftVerticalSlice.ts
npm exec tsx tests/p94MerchantGrowthChainTests.ts
```

Expected: all PASS. No Task-3 wallet-removal assertion is introduced before Task 3.

- [ ] **Step 9: Commit Task 2**

```bash
git add src/data/lines/merchant.json tests/merchantShopLegacyMoneyMigration.test.ts tests/p38FrustrationRemediationTests.ts tests/testMerchantStatecraftVerticalSlice.ts
git commit -m "feat: migrate merchant shop entry to wealth capacity"
```

---

### Task 3: Remove precise wallet mutations from shop opening / investment / closing

**Files:**
- Modify: `src/data/lines/merchant.json`
- Modify: `tests/merchantShopLegacyMoneyMigration.test.ts`
- Modify: `tests/wealthMerchantVerticalSlice.test.ts`
- Modify: `tests/merchantShopAssetVertical.test.ts`
- Modify: `tests/testMerchantStatecraftVerticalSlice.ts`

**Interfaces:**
- Consumes: existing `merchant_shop` Asset API and `wealth_capacity_at_least` requirement.
- Produces: complete no-wallet shop lifecycle through close.

- [ ] **Step 1: Extend focused test with RED shop-mutation assertions**

For all three `merchant_first_shop` choices:

```ts
assert.equal(hasMoneyEffect(choice), false);
assert(hasAssetAddMerchantShop(choice));
```

For `invest_more`:

```ts
assert.deepEqual(investMore.condition, {
  type: 'wealth_capacity_at_least',
  minimum: 'modest_savings',
});
assert.equal(hasMoneyEffect(investMore), false);
assert.equal(hasWealthMutation(investMore), false);
```

For `close_shop`:

```ts
assert.equal(hasMoneyEffect(closeShop), false);
assert(hasAssetRemoveMerchantShop(closeShop));
assert(hasReputationMinusFive(closeShop));
assert(hasMerchantShopFailedFlag(closeShop));
assert.equal(closeShop.text.includes('金钱'), false);
```

Add a scope guard proving `merchant_caravan_guard` still contains its current legacy money semantics so the task cannot silently expand:

```ts
const caravan = getEvent('merchant_caravan_guard');
assert(caravan.choices!.some(choice => hasMoneyEffect(choice)));
assert(
  caravan.choices!.some(choice =>
    JSON.stringify((choice as any).conditions ?? []).includes('money >= 150')
  ),
);
```

- [ ] **Step 2: Run focused test and verify RED**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
```

Expected: FAIL on shop open `-30/-50/-40`, invest `-50`, and close `-20`.

- [ ] **Step 3: Remove opening wallet effects only**

In `merchant_first_shop`:

- delete grocery `money -30`;
- delete weapon `money -50`;
- delete herb `money -40`.

Retain all variant flags, non-economic stat effects, event record, and `asset_add` effects exactly.

Do not introduce differing Wealth Capacity requirements by shop type.

- [ ] **Step 4: Remove `invest_more money -50` only**

Keep:

```json
"condition": {
  "type": "wealth_capacity_at_least",
  "minimum": "modest_savings"
}
```

Keep the charisma and `merchant_shop_success` effects. Do not mutate Wealth Capacity.

- [ ] **Step 5: Remove close-shop wallet cost and update copy**

Delete `money -20` from `close_shop`.

Change the choice text from:

```text
关门大吉（金钱 -20，声望 -5）
```

to wording that states only the remaining player-facing consequence, e.g.:

```text
关店止损（声望 -5）
```

Keep `reputation -5`, `merchant_shop_failed`, and `asset_remove`.

- [ ] **Step 6: Update the Phase-1A Wealth test debt assertion**

In `tests/wealthMerchantVerticalSlice.test.ts`, replace the comment/assertion that `invest_more` *must retain* `money -50` with assertions that:

```ts
invest_more has no money effect
invest_more condition remains wealth_capacity_at_least modest_savings
no_surplus + money 999 remains unavailable
modest_savings + money 0 remains available
```

This keeps the original “Wealth requirement independent of wallet” proof while retiring the intentional legacy debt.

Do not change the origin `money +200` or peak `money +200` assertions.

- [ ] **Step 7: Strengthen Asset lifecycle regression without changing Asset semantics**

In `tests/merchantShopAssetVertical.test.ts`, add/adjust assertions that opening and closing the shop no longer change `money`, while the Asset lifecycle remains:

```text
open → owned
close → not owned
historical shop flag remains true
```

Do not change backing facts or Asset APIs.

- [ ] **Step 8: Finish the statecraft vertical**

Update `tests/testMerchantStatecraftVerticalSlice.ts` so the complete runtime sequence asserts:

```text
initial money captured
study_business → money unchanged, wealthCapacity at least modest_savings
open_grocery_shop → money unchanged, merchant_shop owned, grocery flag true, reputation +5
```

Use `hasAsset(state.facts, 'merchant_shop')`; do not inspect the raw backing fact key.

- [ ] **Step 9: Verify Task 3 focused suite**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/testMerchantStatecraftVerticalSlice.ts
```

Expected: all PASS.

- [ ] **Step 10: Commit Task 3**

```bash
git add src/data/lines/merchant.json tests/merchantShopLegacyMoneyMigration.test.ts tests/wealthMerchantVerticalSlice.test.ts tests/merchantShopAssetVertical.test.ts tests/testMerchantStatecraftVerticalSlice.ts
git commit -m "feat: retire shop lifecycle wallet mutations"
```

---

### Task 4: Prove the full Wealth + Asset runtime vertical and guard scope

**Files:**
- Modify: `tests/merchantShopLegacyMoneyMigration.test.ts`
- Modify only if required by a proven test-contract drift: directly related merchant focused tests.

**Interfaces:**
- Consumes all Task 1–3 behavior.
- Produces one focused executable proof of the accepted migration slice.

- [ ] **Step 1: Add full runtime progression to the focused test**

Build a real engine sequence that starts with a non-rich character:

```text
wealthCapacity = no_surplus
money = a fixed sentinel (e.g. 37)
→ execute study_business
→ wealthCapacity = modest_savings
→ money still sentinel
→ first-shop Wealth condition evaluates true
→ execute open_grocery_shop
→ owns merchant_shop
→ money still sentinel
→ execute invest_more on a state where choice is eligible
→ money still sentinel
→ Wealth Capacity still modest_savings
```

Use separate engine/state for the close path if necessary:

```text
open_grocery_shop
→ close_shop
→ no longer owns merchant_shop
→ money unchanged across close
→ Wealth Capacity unchanged across close
```

- [ ] **Step 2: Add a rich-character non-downgrade proof**

Start at:

```text
wealthCapacity = comfortable_means
```

Execute `study_business` and assert it remains `comfortable_means`.

This is mandatory evidence that `raise_to` is not `set`.

- [ ] **Step 3: Add explicit no-fallback proof for first-shop eligibility**

Create state:

```text
merchant_talent = true
wealthCapacity = no_surplus
money = 999
```

Evaluate both `merchant_first_shop.conditions` and prove the Wealth condition blocks eligibility.

Then set:

```text
wealthCapacity = modest_savings
money = 0
```

and prove both conditions pass.

Do not add fallback behavior to make old states pass.

- [ ] **Step 4: Add an explicit out-of-scope caravan invariant**

Freeze the relevant existing caravan choices/effects in the focused test sufficiently to prove this slice did not migrate them. Do not require every unrelated caravan field; assert only the legacy money requirement/effect presence needed for scope control.

- [ ] **Step 5: Run focused + adjacent merchant tests**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/p94MerchantGrowthChainTests.ts
npm exec tsx tests/p95MerchantOperatingChainTests.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/testMerchantStatecraftVerticalSlice.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add tests/merchantShopLegacyMoneyMigration.test.ts tests/p38FrustrationRemediationTests.ts tests/p94MerchantGrowthChainTests.ts tests/p95MerchantOperatingChainTests.ts tests/wealthMerchantVerticalSlice.test.ts tests/merchantShopAssetVertical.test.ts tests/testMerchantStatecraftVerticalSlice.ts
git commit -m "test: prove merchant shop wealth asset migration"
```

If some listed adjacent tests required no edits, do not stage them.

---

### Task 5: Register the real gate and synchronize accepted authority

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Create/ensure repository copy: `docs/product/wealth-economy-merchant-shop-legacy-money-migration-design.md`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md`
- Modify: `docs/README.md`

**Interfaces:**
- Produces: real-gate coverage and repository authority matching delivered behavior.

- [ ] **Step 1: Register the focused test**

Add one entry to `tests/runRealTestGate.ts` following the existing Wealth/Asset test pattern:

```ts
{
  name: 'merchantShopLegacyMoneyMigration',
  entry: 'tests/merchantShopLegacyMoneyMigration.test.ts',
},
```

Do not reorder unrelated gate entries unless required by the local convention.

- [ ] **Step 2: Install the accepted design at the canonical docs path**

Place the accepted design at:

```text
docs/product/wealth-economy-merchant-shop-legacy-money-migration-design.md
```

Do not rewrite the accepted semantics during implementation closure.

- [ ] **Step 3: Update Contract Part B only**

In `docs/product/wealth-economy-product-contract-design.md`, update the repository inventory to record the new implementation facts:

- `merchant_talent_discovery` no longer reads/writes `money` and uses `wealth_capacity_raise_to: modest_savings`;
- `merchant_first_shop` uses `merchant_talent` + `wealth_capacity_at_least modest_savings` and opening choices no longer spend money;
- `invest_more` keeps the Wealth requirement but no longer spends money;
- `close_shop` removes the Asset/reputation/history state without wallet cost;
- `merchant_caravan_guard` internal money semantics remain legacy debt;
- merchant origin/wealth peak legacy `+200`, P17, numeric optional `wealth`, and remaining merchant money consumers remain unresolved/deferred.

Do not modify Part A product contract unless a contradiction is discovered; if so, STOP and report rather than silently changing accepted product semantics.

- [ ] **Step 4: Add the next Product Decision entry**

Add `PD-067` (or the actual next sequential ID if repository changed) recording only the accepted slice:

- `wealth_capacity_raise_to` is the monotonic event-driven minimum-floor semantic;
- merchant talent → first shop → shop failure lifecycle no longer uses precise `money`;
- shop open/invest/close do not automatically decrease Wealth Capacity;
- caravan and other merchant money consumers remain deferred;
- Snapshot stays 3.15.0 and Phase 1B Asset contract remains unchanged.

Do not grant general authority to migrate all merchant money.

- [ ] **Step 5: Update docs navigation**

Add the design link to `docs/README.md` near the Wealth/Phase-1B entries and describe it as the accepted merchant-shop legacy-money migration slice.

- [ ] **Step 6: Run documentation/static checks**

```bash
git diff --check
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit Task 5**

```bash
git add tests/runRealTestGate.ts docs/product/wealth-economy-merchant-shop-legacy-money-migration-design.md docs/product/wealth-economy-product-contract-design.md docs/governance/product-decisions.md docs/README.md
git commit -m "docs: record merchant shop money migration"
```

---

### Task 6: Final verification and closure report

**Files:**
- No production changes expected.
- Modify docs only if fresh verification status needs factual correction.

**Interfaces:**
- Produces final delivery result and exact deviation/broad-gate attribution.

- [ ] **Step 1: Run the focused migration test**

```bash
npm exec tsx tests/merchantShopLegacyMoneyMigration.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run Wealth + Asset adjacent tests**

```bash
npm exec tsx tests/wealthCapacityEventSemantics.test.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/testMerchantStatecraftVerticalSlice.ts
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/p94MerchantGrowthChainTests.ts
npm exec tsx tests/p95MerchantOperatingChainTests.ts
```

Expected: PASS.

- [ ] **Step 3: Run canonical/full local gates**

```bash
npm exec tsx tests/AllTests.ts
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run typecheck
npm run build
git diff --check
```

Expected within accepted scope:

- AllTests remains 70/70;
- contracts/headless/parity/typecheck/build/diff-check pass.

- [ ] **Step 4: Run the real gate**

```bash
npm test
```

If it fails only on already-known B0/source-freeze or independently dirty/out-of-scope baselines, record exact evidence. Do not modify those systems.

If the new migration test or a merchant/Wealth/Asset focused test fails inside the real gate, the slice is **not** delivered.

- [ ] **Step 5: Run broad diagnostics without widening scope**

```bash
npm run test:sample-lines-routes
npm run validate:event-quality
```

Interpretation:

- If failure signature matches a previously established clean-baseline issue and the migration-focused/merchant tests are green, record `PRE_EXISTING / OUT_OF_SCOPE`.
- If a failure newly points to `merchant_talent_discovery`, `merchant_first_shop`, `merchant_shop_failure`, `wealth_capacity_raise_to`, or the new focused test, investigate before closure.
- Do not “fix the gate” by modifying P50/P8/B0 or unrelated event-quality content.

- [ ] **Step 6: Verify scope invariants with search**

Run repository searches proving:

```bash
rg -n 'money' src/data/lines/merchant.json
rg -n 'wealth_capacity_raise_to' src tests docs
rg -n 'merchant_shop' src/data/lines/merchant.json tests/merchantShopLegacyMoneyMigration.test.ts
```

Manually confirm:

- no `money` appears in `merchant_talent_discovery`;
- no `money` effect appears in the three first-shop choices, `invest_more`, or `close_shop`;
- caravan and later merchant money semantics still exist and were not accidentally migrated;
- no second AssetId was added;
- Snapshot remains `3.15.0`.

- [ ] **Step 7: Produce closure result**

Use one terminal result:

```text
MERCHANT_SHOP_LEGACY_MONEY_MIGRATION_DELIVERED
```

only if all scope acceptance criteria are satisfied.

Otherwise use:

```text
MERCHANT_SHOP_LEGACY_MONEY_MIGRATION_BLOCKED
```

and identify the exact scope-local blocker.

Final report must include:

1. Result.
2. Commits / changed files.
3. `wealth_capacity_raise_to` semantics and tests.
4. Talent discovery eligibility migration.
5. First-shop requirement and opening-cost migration.
6. Invest/close migration.
7. Wealth + Asset runtime proof.
8. Explicitly retained merchant legacy money debt.
9. Verification results and broad-gate attribution.
10. Deviations.

- [ ] **Step 8: Closure commit if and only if factual docs need final status sync**

If documentation requires status changes after fresh verification:

```bash
git add docs/product/wealth-economy-product-contract-design.md docs/governance/product-decisions.md docs/README.md
git commit -m "docs: close merchant shop money migration"
```

Do not create a no-op closure commit if docs are already accurate.

---

## Acceptance Criteria

The implementation is accepted only when all are true:

1. `wealth_capacity_raise_to` exists as a dedicated fail-closed effect and is monotonic.
2. `merchant_talent_discovery` contains no `money` condition or effect.
3. Arbitrary high `money` alone cannot satisfy merchant-talent aptitude evidence.
4. `study_business` raises `no_surplus` to `modest_savings` and leaves richer Wealth Capacity unchanged.
5. `merchant_first_shop` requires `merchant_talent` and `wealth_capacity_at_least modest_savings`; no money fallback exists.
6. Opening grocery/weapon/herb shops does not modify `money` and still creates `merchant_shop` ownership.
7. `invest_more` keeps the Wealth requirement, does not modify `money`, and does not modify Wealth Capacity.
8. `close_shop` does not modify `money` or Wealth Capacity and still removes `merchant_shop`, applies reputation loss, and records failure history.
9. Existing Phase-1B Asset lifecycle remains correct.
10. `merchant_caravan_guard` internal money semantics are unchanged and explicitly deferred.
11. Merchant origin `money +200` and `merchant_wealth_peak money +200` remain unchanged.
12. Snapshot remains `3.15.0`; no new persisted field or save migration exists.
13. No second Asset or generic economy/condition framework is introduced.
14. `AllTests` remains 70/70 and focused Wealth/Asset/merchant tests pass.
15. Any remaining broad-gate failure is either resolved if scope-local or explicitly attributed as pre-existing/out-of-scope with evidence.
