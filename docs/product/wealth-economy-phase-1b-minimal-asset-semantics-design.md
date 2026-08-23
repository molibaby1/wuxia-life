# Wuxia-Life — Phase 1B Minimal Asset Semantics Design

**Status:** Human accepted

**Date:** 2026-08-23

**Parent contract:** `docs/product/wealth-economy-product-contract-design.md`

## 1. Purpose

Phase 1B proves the smallest canonical Asset lifecycle required by the accepted Wealth / Economy Product Contract:

```text
acquire a named asset
→ ownership persists in canonical state
→ later gameplay can read ownership
→ ownership can be removed
→ later gameplay reflects the removal
```

This phase does **not** build a general economy or asset-management platform.

## 2. Accepted product semantics

An Asset is a named, durable world fact representing something the player currently owns or controls and that can affect future gameplay.

Asset is not:

- money or Wealth Capacity;
- an inventory item stack;
- an affiliation;
- a generic story flag;
- an automatically appreciating resource;
- an entity with value, maintenance cost, income, location, subtype, quantity, or lifecycle metadata in Phase 1B.

Asset ownership does not automatically change Wealth Capacity.

## 3. Repository-grounded storage decision

Phase 1B does **not** add a new `GameState.assets` / `PlayerState.assets` / Snapshot field.

The existing required canonical `GameState.facts` is used as the **storage substrate** for Asset v1 because it already:

- is canonical runtime state;
- round-trips through Snapshot/save;
- is distinct from legacy flags;
- can represent a strict boolean durable fact;
- does not require a Snapshot schema/version change.

However, raw fact keys are not the Asset API.

Business code and event content must not directly read or write the backing fact key. Asset ownership is exposed only through the typed Asset semantic layer.

## 4. Canonical Asset surface

Phase 1B defines one and only one canonical asset:

```text
AssetId = merchant_shop
Display label = 自营商铺
```

Required semantic operations:

```text
hasAsset(facts, assetId) -> boolean
addAsset(facts, assetId) -> Facts
removeAsset(facts, assetId) -> Facts
getOwnedAssets(facts) -> AssetId[]
```

Event contract:

```text
condition: asset_owned

effects:
- asset_add
- asset_remove
```

Only registered `AssetId` values are legal.

Ownership is true only when the backing canonical fact is exactly boolean `true`. Truthy strings/numbers do not count.

## 5. Backing fact encapsulation

The backing key is an implementation detail owned by the Asset module, for example conceptually:

```text
asset_owned_merchant_shop
```

No event JSON, UI, gameplay module, test outside the Asset semantic tests, or other business code may depend on that literal key.

This is a deliberate staging seam. It allows a future move from facts-backed binary ownership to a dedicated Asset collection if real requirements prove that necessary.

## 6. Merchant-shop vertical

### 6.1 Acquisition

`merchant_first_shop` has three existing variants:

- `open_grocery_shop`
- `open_weapon_shop`
- `open_herb_shop`

All three add the same canonical Asset:

```text
asset_add merchant_shop
```

Existing shop-type flags remain temporarily for legacy variant/content compatibility:

```text
merchant_shop_grocery
merchant_shop_weapon
merchant_shop_herb
```

Those flags answer “which historical shop variant was chosen”, not canonical current ownership.

### 6.2 Ownership read — operating difficulty

`merchant_shop_failure` must stop using the three shop-type flags as its ownership test.

Its eligibility becomes logically:

```text
asset_owned merchant_shop
AND
existing non-ownership rhythm / pressure conditions
```

Existing non-ownership flags remain unchanged.

### 6.3 Removal

`merchant_shop_failure.close_shop` adds:

```text
asset_remove merchant_shop
```

Existing legacy effects, including `merchant_shop_failed`, remain unless independently migrated later.

After this choice, canonical ownership must be false even though historical shop-variant flags may still be true.

### 6.4 Downstream ownership read

`merchant_caravan_guard` must stop using shop-type flags as its shop-ownership gate.

Its eligibility becomes logically:

```text
asset_owned merchant_shop
AND
existing caravan rhythm / pressure conditions
```

This proves that removal has real downstream gameplay consequences.

## 7. Condition and effect semantics

### `asset_owned`

Example:

```json
{
  "type": "asset_owned",
  "asset": "merchant_shop"
}
```

Semantics:

- valid registered AssetId + ownership true => condition true;
- valid registered AssetId + ownership absent/false => false;
- invalid/unknown AssetId => rejected/fail-closed by contract tooling/runtime as appropriate;
- no fallback to legacy shop flags.

### `asset_add`

Example:

```json
{
  "type": "asset_add",
  "asset": "merchant_shop"
}
```

Semantics:

- idempotently establishes current canonical ownership;
- preserves unrelated facts;
- does not modify money, Wealth Capacity, inventory, affiliation, or legacy flags implicitly.

### `asset_remove`

Example:

```json
{
  "type": "asset_remove",
  "asset": "merchant_shop"
}
```

Semantics:

- removes canonical ownership;
- idempotent if already absent;
- preserves unrelated facts;
- does not clear legacy shop-type/history flags automatically.

## 8. Snapshot / save boundary

No Snapshot version change is authorized or required for Phase 1B.

`3.15.0` remains canonical.

Asset ownership persists because canonical `facts` already persists.

Phase 1B must prove a Snapshot/save-style round trip of Asset ownership without adding a new snapshot field.

No migration from legacy shop flags to Asset ownership is performed.

No load-time derivation is allowed.

## 9. Presentation / API boundary

Asset is a player-relevant world state and needs minimal visibility.

The UI should expose a compact summary such as:

```text
资产：自营商铺
```

No Asset management UI is added.

Because ownership is stored in top-level `facts`, it must not be misrepresented as a new `PlayerState` canonical field merely for presentation.

For API/browser parity, a derived read model may expose:

```text
ownedAssets: AssetId[]
```

This is a DTO/presentation projection derived through `getOwnedAssets(state.facts)`, not a new persistence field.

## 10. Legacy compatibility boundary

Phase 1B intentionally retains:

- shop-type flags;
- legacy money costs/rewards in the selected merchant events;
- `merchant_shop_failed`;
- other merchant flags and expressions outside the two ownership reads selected by this vertical;
- remaining merchant money consumers;
- numeric legacy `wealth`;
- P17 `money + wealth` debt.

No full merchant-flag migration is authorized.

## 11. Explicit non-goals

Phase 1B must not add:

- a generic Asset entity model;
- `GameState.assets` / `PlayerState.assets`;
- Snapshot 3.16.0;
- save migration or fallback derivation;
- asset quantity or multiple shop instances;
- shop subtype schema;
- asset value/net worth;
- automatic income or maintenance;
- asset location/status/owner metadata;
- automatic Wealth Capacity transitions;
- caravan/route/estate/manor/sect assets;
- generic ownership/lifecycle framework;
- wholesale merchant expression migration;
- unrelated economy or Auto Evolution changes.

## 12. Acceptance semantics

Phase 1B is delivered when all are true:

1. `merchant_shop` is the only registered AssetId.
2. Raw backing fact keys are encapsulated by the Asset semantic module.
3. All three first-shop choices canonically acquire `merchant_shop`.
4. `merchant_shop_failure` reads canonical Asset ownership instead of shop-type flags for ownership.
5. `close_shop` removes canonical ownership.
6. `merchant_caravan_guard` reads canonical Asset ownership instead of shop-type flags for ownership.
7. Closing the shop prevents later shop-owned gameplay from passing solely because historical shop flags remain.
8. Ownership round-trips through the existing canonical `facts` snapshot path on schema 3.15.0.
9. Browser/API player-facing presentation can display `自营商铺` through a derived read model.
10. Asset mutation does not change Wealth Capacity or legacy money automatically.
11. Existing legacy variant flags remain for compatibility.
12. No Asset platform, new Snapshot field, save migration, or Phase 2 economy system is introduced.
