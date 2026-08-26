# Phase 1B Minimal Asset Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one canonical, persistent `merchant_shop` Asset lifecycle using typed Asset semantics backed by existing canonical `facts`, without adding a new Snapshot field or broad economy framework.

**Architecture:** Introduce a narrow Asset semantic module (`AssetId`, catalog, ownership helpers) that exclusively maps canonical Asset IDs onto boolean entries in `GameState.facts`. Add dedicated `asset_owned`, `asset_add`, and `asset_remove` event semantics, migrate one merchant-shop vertical to them, and project owned assets into the player-facing API/UI as derived read data. Legacy shop-variant flags remain for compatibility and are not canonical ownership.

**Tech Stack:** TypeScript 5.9, Vue 3, existing EventLoader / ConditionEvaluator / EventExecutor, canonical Snapshot 3.15.0, tsx tests.

**Spec:** `docs/product/wealth-economy-phase-1b-minimal-asset-semantics-design.md`

## Global Constraints

- `merchant_shop` is the only AssetId in Phase 1B.
- `GameState.facts` is storage substrate only; raw backing fact keys must not leak into event JSON, presentation, or unrelated business code.
- Do not add `GameState.assets`, `PlayerState.assets`, or a new Snapshot field.
- Snapshot remains `3.15.0`; no save migration, fallback, or legacy-flag derivation.
- `asset_add` / `asset_remove` do not modify Wealth Capacity or money automatically.
- Existing shop-type flags remain as legacy variant/history compatibility.
- Do not migrate unrelated merchant flags, money consumers, sample-line expressions, P8/P17, or Auto Evolution.
- Do not add asset value, quantity, subtype, location, income, maintenance, metadata, or a generic lifecycle framework.
- Latest accepted branch state includes Phase 1A delivered, Event Quality validator support for the current canonical condition grammar, and `AllTests` at 70/70. Extend those current files; do not regress or replace their corrections with older repository copies.

---

## File Structure

**Create**

- `src/types/asset.ts` — canonical Asset IDs, labels, type guard.
- `src/core/assetOwnership.ts` — exclusive facts-backed ownership mapping and pure helpers.
- `tests/assetOwnershipSemantics.test.ts` — storage-layer semantics and encapsulation behavior.
- `tests/assetEventSemantics.test.ts` — condition/effect semantics and fail-closed behavior.
- `tests/merchantShopAssetVertical.test.ts` — real merchant acquisition/read/removal/downstream lifecycle proof.
- `tests/assetPresentation.test.ts` — local/API read-model and presentation proof.

**Modify**

- `src/types/eventTypes.ts` — add Asset condition/effect contract.
- `src/core/ConditionEvaluator.ts` — evaluate `asset_owned` via canonical helper.
- `src/core/EventExecutor.ts` — execute `asset_add` / `asset_remove` via canonical helper.
- `scripts/validateEventQuality.ts` — extend the **current** canonical condition validator to `asset_owned`.
- `tests/eventQualityConditionContract.test.ts` — extend current validator regression with Asset condition cases.
- `src/data/lines/merchant.json` — migrate only the selected shop ownership vertical.
- `src/contracts/sessionProgression.ts` — add derived `ownedAssets` to player-facing DTO, not canonical PlayerState.
- `server/src/services/sessionProgressionMapper.ts` — derive `ownedAssets` from runtime `facts`.
- `src/components/mainScreenModel.ts` — expose a compact Asset summary from derived `ownedAssets`.
- `src/components/MainScreenLifeSummary.vue` — render the Asset summary row.
- `src/components/GameScreen.vue` — derive local `ownedAssets` from `GameState.facts`, use API projection in API mode, and pass the summary.
- `tests/mainScreenModel.test.ts` — sync DTO fixture and Asset summary expectations.
- `tests/runRealTestGate.ts` — register new focused tests.
- `docs/product/wealth-economy-product-contract-design.md` — Part B implementation status only after code is verified.
- `docs/governance/product-decisions.md` — record Human-accepted Phase 1B storage/semantic decision if the current governance sequence does not already contain it.
- `docs/README.md` — add design link only if required by current product-doc navigation conventions.

**Do not modify**

- `src/contracts/gameStateSnapshot.ts`
- Snapshot schema version constants
- canonical snapshot player-key lists solely for Asset
- `src/types/wealthCapacity.ts`
- legacy numeric `wealth`
- P17 `money + wealth`
- unrelated sample-line expressions or merchant chain content

---

### Task 1: Canonical Asset Identity and Facts-Backed Ownership

**Files:**
- Create: `src/types/asset.ts`
- Create: `src/core/assetOwnership.ts`
- Test: `tests/assetOwnershipSemantics.test.ts`

**Interfaces:**
- Produces: `AssetId`, `ASSET_VALUES`, `ASSET_LABELS`, `isAssetId(value)`.
- Produces: `hasAsset(facts, assetId)`, `addAsset(facts, assetId)`, `removeAsset(facts, assetId)`, `getOwnedAssets(facts)`.
- Storage key mapping remains private to `assetOwnership.ts`.

- [ ] **Step 1: Write the failing semantic test**

Create `tests/assetOwnershipSemantics.test.ts` with direct behavioral assertions equivalent to:

```ts
import assert from 'node:assert/strict';
import {
  addAsset,
  getOwnedAssets,
  hasAsset,
  removeAsset,
} from '../src/core/assetOwnership';
import { ASSET_LABELS, isAssetId } from '../src/types/asset';

const baseFacts = { unrelated_fact: 'kept' };

assert.equal(isAssetId('merchant_shop'), true);
assert.equal(isAssetId('merchant_caravan'), false);
assert.equal(ASSET_LABELS.merchant_shop, '自营商铺');

assert.equal(hasAsset(baseFacts, 'merchant_shop'), false);

const acquired = addAsset(baseFacts, 'merchant_shop');
assert.equal(hasAsset(acquired, 'merchant_shop'), true);
assert.equal(acquired.unrelated_fact, 'kept');
assert.notEqual(acquired, baseFacts);
assert.deepEqual(getOwnedAssets(acquired), ['merchant_shop']);

const repeated = addAsset(acquired, 'merchant_shop');
assert.deepEqual(getOwnedAssets(repeated), ['merchant_shop']);

const removed = removeAsset(acquired, 'merchant_shop');
assert.equal(hasAsset(removed, 'merchant_shop'), false);
assert.equal(removed.unrelated_fact, 'kept');

// Exact boolean semantics: truthy legacy-like values must not become ownership.
const suspiciousFacts = { ...acquired } as Record<string, boolean | string | number>;
for (const key of Object.keys(suspiciousFacts)) {
  if (key !== 'unrelated_fact') suspiciousFacts[key] = 'yes';
}
assert.equal(hasAsset(suspiciousFacts, 'merchant_shop'), false);

console.log('assetOwnershipSemantics.test.ts: ok');
```

The test must not import or assert the backing fact-key literal. It verifies behavior, not storage spelling.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm exec tsx tests/assetOwnershipSemantics.test.ts
```

Expected: FAIL because the Asset modules do not exist.

- [ ] **Step 3: Implement the minimal Asset identity module**

Create `src/types/asset.ts` with one canonical value only:

```ts
export const ASSET_VALUES = ['merchant_shop'] as const;
export type AssetId = (typeof ASSET_VALUES)[number];

export const ASSET_LABELS: Record<AssetId, string> = {
  merchant_shop: '自营商铺',
};

const ASSET_ID_SET = new Set<string>(ASSET_VALUES);

export function isAssetId(value: unknown): value is AssetId {
  return typeof value === 'string' && ASSET_ID_SET.has(value);
}
```

Do not add future assets.

- [ ] **Step 4: Implement the facts-backed ownership module**

Create `src/core/assetOwnership.ts`.

Requirements:

```ts
import type { Facts } from '../types/eventTypes';
import { ASSET_VALUES, type AssetId } from '../types/asset';

function assetFactKey(assetId: AssetId): string {
  return `asset_owned_${assetId}`;
}

export function hasAsset(facts: Facts, assetId: AssetId): boolean {
  return facts[assetFactKey(assetId)] === true;
}

export function addAsset(facts: Facts, assetId: AssetId): Facts {
  return { ...facts, [assetFactKey(assetId)]: true };
}

export function removeAsset(facts: Facts, assetId: AssetId): Facts {
  const next = { ...facts };
  delete next[assetFactKey(assetId)];
  return next;
}

export function getOwnedAssets(facts: Facts): AssetId[] {
  return ASSET_VALUES.filter((assetId) => hasAsset(facts, assetId));
}
```

`assetFactKey()` must remain non-exported.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm exec tsx tests/assetOwnershipSemantics.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/asset.ts src/core/assetOwnership.ts tests/assetOwnershipSemantics.test.ts
git commit -m "feat: add canonical asset ownership semantics"
```

---

### Task 2: Dedicated Asset Event Contract

**Files:**
- Modify: `src/types/eventTypes.ts`
- Modify: `src/core/ConditionEvaluator.ts`
- Modify: `src/core/EventExecutor.ts`
- Modify: `scripts/validateEventQuality.ts`
- Modify: `tests/eventQualityConditionContract.test.ts`
- Create: `tests/assetEventSemantics.test.ts`

**Interfaces:**
- Consumes: `AssetId`, `isAssetId`, `hasAsset`, `addAsset`, `removeAsset` from Task 1.
- Produces EventCondition: `{ type: 'asset_owned'; asset: AssetId }`.
- Produces EffectTypes: `asset_add`, `asset_remove`.
- Produces EffectDefinition field: `asset?: AssetId`.

- [ ] **Step 1: Write failing runtime event-semantics tests**

Create `tests/assetEventSemantics.test.ts` that starts from a real `GameEngineIntegration` state and asserts:

```ts
const evaluator = new ConditionEvaluator();
const executor = new EventExecutor();
const state = makeState();
state.facts = { unrelated_fact: 7 };
state.player.money = 321;
state.player.wealthCapacity = 'comfortable_means';

assert.equal(
  evaluator.evaluate({ type: 'asset_owned', asset: 'merchant_shop' } as never, state),
  false,
);

const acquired = await executor.executeEffects([
  { type: 'asset_add', asset: 'merchant_shop' } as never,
], state);

assert.equal(
  evaluator.evaluate({ type: 'asset_owned', asset: 'merchant_shop' } as never, acquired),
  true,
);
assert.equal(acquired.player.money, 321);
assert.equal(acquired.player.wealthCapacity, 'comfortable_means');
assert.equal(acquired.facts.unrelated_fact, 7);

const removed = await executor.executeEffects([
  { type: 'asset_remove', asset: 'merchant_shop' } as never,
], acquired);
assert.equal(
  evaluator.evaluate({ type: 'asset_owned', asset: 'merchant_shop' } as never, removed),
  false,
);
```

Also verify fail-closed invalid Asset IDs:

```ts
await assert.rejects(
  () => executor.executeEffects([
    { type: 'asset_add', asset: 'unknown_asset' } as never,
  ], state),
  /invalid asset/i,
);
```

and evaluator invalid input returns false rather than falling back to flags.

- [ ] **Step 2: Extend the current Event Quality regression test before implementation**

In the **current branch version** of `tests/eventQualityConditionContract.test.ts`, add cases proving:

- valid `asset_owned / merchant_shop` => no `invalid_condition`;
- unknown AssetId => `invalid_condition`;
- current existing `expression`, `status_has`, and `wealth_capacity_at_least` cases remain green.

Do not replace the Phase 1A validator corrective with an older expression-only implementation.

- [ ] **Step 3: Run tests and verify RED**

```bash
npm exec tsx tests/assetEventSemantics.test.ts
npm exec tsx tests/eventQualityConditionContract.test.ts
```

Expected: FAIL because Asset event grammar is not implemented.

- [ ] **Step 4: Extend the canonical event types**

In `src/types/eventTypes.ts`:

```ts
import type { AssetId } from './asset';
```

Add to `EventCondition`:

```ts
| {
    type: 'asset_owned';
    asset: AssetId;
  }
```

Add EffectType members:

```ts
ASSET_ADD = 'asset_add',
ASSET_REMOVE = 'asset_remove',
```

Add a dedicated optional field to `EffectDefinition`:

```ts
asset?: AssetId;
```

Do not encode Asset IDs through `target`, `stat`, or numeric `value`.

- [ ] **Step 5: Implement `asset_owned` in ConditionEvaluator**

Import `isAssetId` and `hasAsset`.

Add before expression fallback:

```ts
if (condition.type === 'asset_owned') {
  return isAssetId(condition.asset) && hasAsset(state.facts, condition.asset);
}
```

Do not add backing fact names to the expression evaluator or `DIRECT_PLAYER_PROPERTIES`.

- [ ] **Step 6: Implement dedicated Asset effect handlers**

In `src/core/EventExecutor.ts`, add two handlers equivalent to:

```ts
class AssetAddHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isAssetId(effect.asset)) {
      throw new Error(`Invalid asset effect value: ${String(effect.asset)}`);
    }
    return { ...state, facts: addAsset(state.facts, effect.asset) };
  }
}

class AssetRemoveHandler implements EffectHandler {
  execute(effect: EffectDefinition, state: GameState): GameState {
    if (!isAssetId(effect.asset)) {
      throw new Error(`Invalid asset effect value: ${String(effect.asset)}`);
    }
    return { ...state, facts: removeAsset(state.facts, effect.asset) };
  }
}
```

Register both in `registerDefaultHandlers()`.

Do not mutate `state.facts` in place.

- [ ] **Step 7: Extend the current Event Quality condition validator**

Modify the current validator implementation in `scripts/validateEventQuality.ts` so `asset_owned` is accepted only when `isAssetId(condition.asset)` is true.

Preserve validation for:

- `expression` with nonblank expression;
- `status_has` with valid StatusId;
- `wealth_capacity_at_least` with valid WealthCapacity;
- unknown types => `invalid_condition`.

Do not introduce a generic arbitrary-object condition whitelist.

- [ ] **Step 8: Verify GREEN**

```bash
npm exec tsx tests/assetEventSemantics.test.ts
npm exec tsx tests/eventQualityConditionContract.test.ts
npm run validate:event-quality
npm run typecheck
```

Expected:

- focused tests PASS;
- Asset condition causes no new `invalid_condition`;
- historical unrelated event-quality issues may remain and must not be repaired in this task.

- [ ] **Step 9: Commit**

```bash
git add src/types/eventTypes.ts src/core/ConditionEvaluator.ts src/core/EventExecutor.ts scripts/validateEventQuality.ts tests/eventQualityConditionContract.test.ts tests/assetEventSemantics.test.ts
git commit -m "feat: add canonical asset event semantics"
```

---

### Task 3: Merchant Shop Ownership Lifecycle Vertical

**Files:**
- Modify: `src/data/lines/merchant.json`
- Create: `tests/merchantShopAssetVertical.test.ts`
- Keep existing: `tests/testMerchantStatecraftVerticalSlice.ts` unless its legitimate assertions must be synchronized with the new canonical ownership output.

**Interfaces:**
- Consumes: `asset_add`, `asset_remove`, `asset_owned` from Task 2.
- Proves acquisition -> read -> removal -> downstream read.

- [ ] **Step 1: Write a failing real-content vertical test**

The new test must load actual `merchant.json` through `EventLoader` and use `ConditionEvaluator` / `EventExecutor` or `GameEngineIntegration` rather than reimplementing event logic.

It must assert all of these:

1. `open_grocery_shop`, `open_weapon_shop`, and `open_herb_shop` each contain exactly one `asset_add` for `merchant_shop`.
2. Existing shop-type flags are still present in their corresponding choices.
3. Executing one open-shop choice establishes canonical ownership.
4. `merchant_shop_failure` has `asset_owned: merchant_shop` as the ownership gate and no longer depends on the three shop-type flags **for ownership**.
5. Existing non-ownership rhythm/pressure conditions remain.
6. `close_shop` contains `asset_remove: merchant_shop` and retains `merchant_shop_failed`.
7. After executing `close_shop`, canonical ownership is false while the historical shop-type flag can remain true.
8. `merchant_caravan_guard` uses `asset_owned: merchant_shop` for shop ownership and preserves its existing non-ownership caravan rhythm condition.
9. With historical `merchant_shop_grocery=true` but no canonical Asset, the migrated ownership gate must fail.
10. With canonical `merchant_shop` but no shop-type flag, the ownership portion must pass; the test may satisfy the separate rhythm condition explicitly.

- [ ] **Step 2: Run the vertical test and verify RED**

```bash
npm exec tsx tests/merchantShopAssetVertical.test.ts
```

Expected: FAIL because `merchant.json` still uses legacy ownership expressions and does not add/remove Asset.

- [ ] **Step 3: Add acquisition effects only to the three first-shop choices**

In `src/data/lines/merchant.json`, append:

```json
{"type": "asset_add", "asset": "merchant_shop"}
```

to each of:

- `open_grocery_shop`
- `open_weapon_shop`
- `open_herb_shop`

Preserve existing money/stat/flag effects and their relative semantics.

- [ ] **Step 4: Replace only the ownership portion of `merchant_shop_failure` conditions**

Change the event condition list to the equivalent of:

```json
"conditions": [
  {"type": "asset_owned", "asset": "merchant_shop"},
  {
    "type": "expression",
    "expression": "!flags.merchant_shop_success && (flags.hvg_merchant_caravan_track == true || flags.hvg_merchant_operating_pressure_done == true || flags.hvg_merchant_ledger_rhythm_expand == true || flags.hvg_merchant_ledger_pressure_stockout == true)"
  }
]
```

Do not migrate the rhythm flags.

- [ ] **Step 5: Add removal to `close_shop`**

Add:

```json
{"type": "asset_remove", "asset": "merchant_shop"}
```

Preserve the existing money/reputation/`merchant_shop_failed` effects.

Do not unset `merchant_shop_grocery/weapon/herb` in Phase 1B.

- [ ] **Step 6: Replace only the ownership portion of `merchant_caravan_guard`**

Use two ANDed event conditions:

```json
"conditions": [
  {"type": "asset_owned", "asset": "merchant_shop"},
  {
    "type": "expression",
    "expression": "!flags.hvg_merchant_caravan_track || flags.hvg_merchant_operating_pressure_done == true || flags.hvg_merchant_caravan_rhythm_fast == true || flags.hvg_merchant_caravan_rhythm_market == true"
  }
]
```

Do not migrate its choice-level money requirements or rewards.

- [ ] **Step 7: Verify focused vertical and existing merchant behavior**

```bash
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/testMerchantStatecraftVerticalSlice.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm run typecheck
```

If an existing merchant test fails only because it asserts the exact old effect list, synchronize that test with the new accepted Asset effect; do not weaken unrelated assertions.

- [ ] **Step 8: Commit**

```bash
git add src/data/lines/merchant.json tests/merchantShopAssetVertical.test.ts tests/testMerchantStatecraftVerticalSlice.ts tests/wealthMerchantVerticalSlice.test.ts
git commit -m "feat: migrate merchant shop ownership to canonical asset"
```

Only add existing test files to the commit if actually changed.

---

### Task 4: Prove Persistence Without a Snapshot Schema Change

**Files:**
- Extend: `tests/assetOwnershipSemantics.test.ts` **or** create `tests/assetPersistence.test.ts` if separation keeps the test focused.
- Do not modify: `src/contracts/gameStateSnapshot.ts`
- Do not modify: Snapshot version constants.

**Interfaces:**
- Consumes: `addAsset`, `hasAsset`.
- Consumes: `defaultSnapshotConverter`.
- Proves existing `facts` round trip preserves ownership.

- [ ] **Step 1: Add a failing persistence proof before any production changes**

Use a real new-game state and the existing converter:

```ts
const engine = new GameEngineIntegration();
engine.startNewGame('Asset Persistence', 'male');
const state = engine.getGameState();
state.facts = addAsset(state.facts, 'merchant_shop');

const snapshot = defaultSnapshotConverter.toSnapshot(state, {
  snapshotId: 'asset-persistence',
  createdAt: '2026-08-23T00:00:00.000Z',
});

assert.equal(snapshot.schemaVersion, '3.15.0');

const restored = defaultSnapshotConverter.fromSnapshot(
  JSON.parse(JSON.stringify(snapshot)),
);

assert.equal(hasAsset(restored.facts, 'merchant_shop'), true);
```

Also assert no top-level or player-level `assets` field appears in the serialized snapshot.

- [ ] **Step 2: Run RED/GREEN appropriately**

The persistence test may already pass once Tasks 1-3 exist because `facts` is already canonical. If it passes immediately, this is acceptable as a **proof test** rather than a production-change TDD cycle; do not invent production code to force a RED state.

Run:

```bash
npm exec tsx tests/assetPersistence.test.ts
npm run test:contracts:snapshot
npm run test:headless
```

Expected: PASS with schema still `3.15.0`.

- [ ] **Step 3: Commit only the proof test**

```bash
git add tests/assetPersistence.test.ts
git commit -m "test: prove asset ownership persists through canonical facts"
```

If the proof was added to `assetOwnershipSemantics.test.ts`, commit that file instead.

---

### Task 5: Derived API and Player-Facing Asset Presentation

**Files:**
- Modify: `src/contracts/sessionProgression.ts`
- Modify: `server/src/services/sessionProgressionMapper.ts`
- Modify: `src/components/mainScreenModel.ts`
- Modify: `src/components/MainScreenLifeSummary.vue`
- Modify: `src/components/GameScreen.vue`
- Modify: `tests/mainScreenModel.test.ts`
- Create: `tests/assetPresentation.test.ts`

**Interfaces:**
- Consumes: `AssetId`, `ASSET_LABELS`, `getOwnedAssets`.
- Produces derived DTO field: `PlayerSummaryDto.ownedAssets: AssetId[]`.
- Produces `MainScreenModel.assetSummary: string`.
- Does **not** add owned assets to PlayerState or Snapshot.

- [ ] **Step 1: Write failing presentation/API tests**

Create `tests/assetPresentation.test.ts` that proves:

1. A local presentation input with `ownedAssets: ['merchant_shop']` yields `assetSummary === '自营商铺'`.
2. Empty ownership yields `assetSummary === '暂无资产'`.
3. `mapSessionProgression()` derives `payload.player.ownedAssets` from `runtimeState.facts`, not from player flags.
4. A state with `merchant_shop_grocery=true` but no canonical Asset produces `ownedAssets=[]`.
5. A state with canonical Asset and no legacy shop flag produces `ownedAssets=['merchant_shop']`.

Use `addAsset()` in test setup; never hard-code the backing fact key.

- [ ] **Step 2: Run tests and verify RED**

```bash
npm exec tsx tests/assetPresentation.test.ts
```

Expected: FAIL because DTO/model do not expose Asset summary.

- [ ] **Step 3: Add derived `ownedAssets` to API DTO**

In `src/contracts/sessionProgression.ts`:

```ts
import type { AssetId } from '../types/asset';
```

Add to `PlayerSummaryDto`:

```ts
ownedAssets: AssetId[];
```

This is explicitly a derived player-facing read model, not canonical PlayerState.

- [ ] **Step 4: Derive API ownership from top-level facts**

In `server/src/services/sessionProgressionMapper.ts` import `getOwnedAssets` and map:

```ts
ownedAssets: getOwnedAssets(state.facts),
```

Never inspect legacy shop flags.

- [ ] **Step 5: Extend the main-screen read model**

In `src/components/mainScreenModel.ts`:

- extend the presentation input with derived `ownedAssets?: AssetId[]` without adding it to PlayerState;
- add `assetSummary: string` to `MainScreenModel`;
- build the summary from `ASSET_LABELS` in canonical Asset order;
- use `暂无资产` when empty.

The Asset summary is not a numeric stat and must not be added to `topResources` or core stat groups.

- [ ] **Step 6: Wire local/API modes without changing canonical state**

In `GameScreen.vue`:

- API mode uses `props.apiPlayer.ownedAssets`;
- local mode derives `getOwnedAssets(gameEngine.getGameState().facts)`;
- pass `mainScreenModel.assetSummary` to `MainScreenLifeSummary`.

In `MainScreenLifeSummary.vue`, add one compact row:

```text
资产 | 自营商铺
```

or `资产 | 暂无资产` when empty.

No management controls or Asset page.

- [ ] **Step 7: Synchronize existing DTO fixtures/tests strictly**

Update `tests/mainScreenModel.test.ts` `createPlayer()` to include:

```ts
ownedAssets: [],
```

Add focused assertions for `assetSummary` without weakening existing Wealth Capacity/money assertions.

Any other compile-time `PlayerSummaryDto` fixtures that fail because the new derived field is required should be updated explicitly with `ownedAssets: []`; do not make the field optional merely to avoid fixture work unless current API compatibility policy explicitly requires optional additive fields.

- [ ] **Step 8: Verify GREEN and parity**

```bash
npm exec tsx tests/assetPresentation.test.ts
npm exec tsx tests/mainScreenModel.test.ts
npm exec tsx tests/wealthCapacityPresentation.test.ts
npm run test:headless:parity
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/contracts/sessionProgression.ts server/src/services/sessionProgressionMapper.ts src/components/mainScreenModel.ts src/components/MainScreenLifeSummary.vue src/components/GameScreen.vue tests/mainScreenModel.test.ts tests/assetPresentation.test.ts
git commit -m "feat: present canonical asset ownership"
```

---

### Task 6: Register Gates, Sync Authority, and Close Phase 1B

**Files:**
- Modify: `tests/runRealTestGate.ts`
- Modify: `docs/product/wealth-economy-product-contract-design.md`
- Modify: `docs/governance/product-decisions.md` only if current authority lacks the Human-accepted Phase 1B decision.
- Modify: `docs/README.md` only if current navigation conventions require the design link.
- Repository design file: `docs/product/wealth-economy-phase-1b-minimal-asset-semantics-design.md`

**Interfaces:**
- No new runtime semantics.
- Registers focused regression coverage and records delivered implementation truth.

- [ ] **Step 1: Put the accepted design into repository authority**

Copy the Human-accepted design artifact verbatim in semantics to:

```text
docs/product/wealth-economy-phase-1b-minimal-asset-semantics-design.md
```

Formatting may match current docs, but do not change accepted semantics.

If governance requires a Product Decision, add a concise decision recording:

- Asset v1 uses typed facts-backed binary ownership;
- only `merchant_shop` is in Phase 1B;
- no new Snapshot field/version;
- raw fact key is encapsulated;
- Human accepted this Phase 1B direction;
- future dedicated Asset collection/entity schema remains a separate decision.

Do not put execution detail into `current-product-stage.md`.

- [ ] **Step 2: Register focused tests in the real test gate**

Add unique entries to `tests/runRealTestGate.ts` for:

```text
assetOwnershipSemantics
assetEventSemantics
merchantShopAssetVertical
assetPersistence
assetPresentation
```

Use the actual filenames created in prior tasks. Do not duplicate an entry if a test was merged into another focused file.

- [ ] **Step 3: Update Wealth Contract Part B only with verified implementation facts**

After all focused tests pass, update Part B to state:

- Phase 1B `merchant_shop` Asset vertical is implemented;
- ownership storage is canonical facts through a typed Asset API;
- Snapshot remains 3.15.0;
- no load-time legacy flag derivation exists;
- shop variant flags remain legacy compatibility;
- Asset does not auto-transition Wealth Capacity;
- dedicated Asset entity/collection remains unproven and deferred.

Do not alter Part A product semantics.

- [ ] **Step 4: Run focused verification**

```bash
npm exec tsx tests/assetOwnershipSemantics.test.ts
npm exec tsx tests/assetEventSemantics.test.ts
npm exec tsx tests/merchantShopAssetVertical.test.ts
npm exec tsx tests/assetPersistence.test.ts
npm exec tsx tests/assetPresentation.test.ts
npm exec tsx tests/eventQualityConditionContract.test.ts
npm exec tsx tests/testMerchantStatecraftVerticalSlice.ts
npm exec tsx tests/wealthMerchantVerticalSlice.test.ts
npm exec tsx tests/AllTests.ts
npm exec tsx tests/youthCausalOpportunity.test.ts
npm run test:contracts
npm run test:headless
npm run test:headless:parity
npm run typecheck
npm run build
npm run validate:event-quality
npm run test:sample-lines-routes
git diff --check
```

Expected scoped outcomes:

- all new Asset tests PASS;
- `AllTests` remains 70/70;
- youth canonical baseline remains PASS;
- no new `invalid_condition` from `asset_owned`;
- no Snapshot version/schema changes;
- any pre-existing sample-line/event-quality broad failures must be compared with the clean pre-Phase-1B baseline before attribution.

- [ ] **Step 5: Run full gate without broadening scope**

Run:

```bash
npm run verify:full
```

If it fails:

1. identify whether the failure is introduced by the clean Phase 1B diff;
2. if yes and inside the Phase 1B contract, correct it;
3. if base and Phase 1B HEAD both fail identically, classify `PRE_EXISTING / OUT_OF_SCOPE`;
4. do not modify B0, P8, sample-line content, Auto Evolution, or unrelated historical gates just to force green.

- [ ] **Step 6: Verify scope guards**

Explicitly prove all are true:

```text
Snapshot schema version == 3.15.0
no GameState.assets field
no PlayerState.assets field
ASSET_VALUES == ['merchant_shop']
no automatic Wealth Capacity mutation from asset_add/remove
no asset income/maintenance/value fields
legacy shop-type flags still exist
backing asset fact key is not referenced outside assetOwnership.ts and Asset semantic tests
```

Use repository search for the backing prefix chosen by implementation and report all matches.

- [ ] **Step 7: Commit closure docs/gate registration**

```bash
git add tests/runRealTestGate.ts docs/product/wealth-economy-phase-1b-minimal-asset-semantics-design.md docs/product/wealth-economy-product-contract-design.md docs/governance/product-decisions.md docs/README.md
git commit -m "docs: close minimal asset semantics phase"
```

Only add governance/README files if actually changed.

---

## Final Acceptance Criteria

Phase 1B may report `PHASE_1B_MINIMAL_ASSET_SEMANTICS_DELIVERED` only when:

1. `merchant_shop` is the sole AssetId.
2. Asset storage is encapsulated behind typed helpers over canonical `facts`.
3. No raw backing key is used by merchant event JSON or UI/API code.
4. `asset_owned`, `asset_add`, and `asset_remove` are canonical typed event semantics.
5. Event Quality accepts valid Asset conditions and rejects unknown Asset IDs.
6. All three first-shop choices acquire `merchant_shop`.
7. `merchant_shop_failure` ownership gating reads Asset, not shop-type flags.
8. `close_shop` removes Asset while historical variant flags may remain.
9. `merchant_caravan_guard` ownership gating reads Asset.
10. Historical shop flags alone cannot satisfy canonical ownership after close/removal.
11. Asset persists through Snapshot 3.15.0 via existing `facts` without a schema/version change.
12. API/local presentation derives `ownedAssets` from facts and displays `自营商铺`.
13. Asset changes do not automatically change money or Wealth Capacity.
14. Existing Phase 1A Wealth tests remain green.
15. `AllTests` remains 70/70 on the clean Phase 1B branch.
16. No Phase 1B scope expansion into Asset entities, economy simulation, full merchant migration, or unrelated gate repair occurred.

## Final Report Format

Report exactly these sections:

1. **Result** — `PHASE_1B_MINIMAL_ASSET_SEMANTICS_DELIVERED` or precise blocker.
2. **Commits / changed files** — grouped by Task 1-6.
3. **Canonical Asset contract** — Asset IDs, backing strategy, public helpers.
4. **Event semantics** — condition/effects and validation behavior.
5. **Merchant vertical proof** — acquisition, ownership read, removal, downstream read.
6. **Persistence** — Snapshot version and round-trip evidence.
7. **Presentation parity** — local/API derived `ownedAssets` and player-facing result.
8. **Legacy debt intentionally retained** — shop flags, money consumers, Asset entity deferral.
9. **Verification** — focused tests, AllTests, contracts/headless/parity, typecheck/build, event quality, sample lines, verify:full, diff-check.
10. **Deviations** — every departure from this plan; `None` if none.

Do not proceed to a broader Asset platform, second AssetId, or further money migration after closure without a new accepted scope.
