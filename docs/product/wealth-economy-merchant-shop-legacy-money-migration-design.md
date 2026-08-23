# Wealth / Economy — Merchant Shop Legacy Money Migration Design

**Status:** Human accepted design basis — 2026-08-23

## 1. Purpose

This slice retires precise legacy `money` semantics from the merchant shop vertical without expanding into the wider merchant economy.

The target vertical begins at `merchant_talent_discovery` and ends at `merchant_shop_failure.close_shop`:

```text
merchant talent discovery
→ first strategic surplus
→ first-shop eligibility
→ open merchant_shop Asset
→ shop operating pressure
→ invest / change strategy / close
```

After this slice, that vertical must be playable through Wealth Capacity + `merchant_shop` Asset semantics and must not require or mutate precise `money` values.

This slice does **not** retire `money` globally.

## 2. Accepted product semantics

### 2.1 `merchant_talent_discovery` no longer uses wallet balance as evidence of merchant aptitude

Current legacy eligibility contains `money >= 50`. A precise wallet balance must no longer prove that the character has merchant aptitude.

Replace that branch with existing merchant-route evidence. The condition remains an expression; no generic OR/composite condition framework is added.

The intended gate is:

```text
(charisma >= 12
 OR origin_merchant_family
 OR hvg_merchant_ledger_track
 OR hvg_merchant_caravan_track
 OR hvg_merchant_first_challenge_done)
AND
(merchant_childhood_seed_done
 OR p8_route_wealth
 OR route_merchant)
```

This preserves the existing two-part meaning — merchant-route context plus aptitude/route evidence — while removing arbitrary cash balance as a proxy.

A character with `money = 999` but no qualifying merchant evidence must not become eligible merely because they are rich.

### 2.2 First strategic surplus is a Wealth Capacity transition

`study_business` currently grants `money +20` while the narrative describes earning the character's “first bucket of gold”.

Replace that numeric producer with a monotonic categorical effect:

```text
wealth_capacity_raise_to: modest_savings
```

Semantics:

- `no_surplus → modest_savings`
- `modest_savings → modest_savings`
- `comfortable_means → comfortable_means`
- higher tiers remain unchanged

This is not Wealth arithmetic and not `+1`. It is an explicit event-driven minimum floor.

The choice keeps its non-economic effects (`charisma`, `merchant_talent`, `route_merchant`). Its player-facing description must stop claiming a numeric/cash loss.

### 2.3 `wealth_capacity_raise_to` is a narrow canonical effect

Add one new dedicated effect type:

```text
wealth_capacity_raise_to
```

Payload:

```json
{
  "type": "wealth_capacity_raise_to",
  "minimum": "modest_savings"
}
```

The handler must:

- accept only valid `WealthCapacity` values;
- fail closed on invalid values;
- never lower current Wealth Capacity;
- never modify `money`, optional numeric `wealth`, Asset ownership, flags, or any other state;
- avoid any numeric/XP/score representation.

No generic ordered-enum framework is introduced.

### 2.4 First shop eligibility uses Wealth Capacity, not wallet balance

`merchant_first_shop` currently reads:

```text
merchant_talent && (money >= 50 || merchant_childhood_seed_done || p8_route_wealth)
```

After this slice it uses two event-level AND conditions:

```text
expression: merchant_talent == true
wealth_capacity_at_least: modest_savings
```

`merchant_talent` has only one current formal producer, `study_business`, and that producer now raises Wealth Capacity to at least `modest_savings`.

No fallback derives Wealth Capacity from `money`, old flags, or old saves.

### 2.5 Opening the first shop is a Wealth Requirement + Asset creation, not wallet spending

Remove the three precise opening costs:

- grocery shop `money -30`
- weapon shop `money -50`
- herb shop `money -40`

Do not replace them with Wealth Capacity decreases.

All three choices continue to:

- retain their shop-type legacy/history flags;
- retain their existing non-economic differentiators;
- `asset_add: merchant_shop`.

The current product contract does not establish that opening one first small shop changes the character's overall economic identity.

### 2.6 `invest_more` is a Wealth Requirement / alternative path, not Wealth consumption

Keep the already canonical choice condition:

```text
wealth_capacity_at_least: modest_savings
```

Remove legacy `money -50`.

Do not add `wealth_capacity_set`, `wealth_capacity_raise_to`, or any automatic Wealth downgrade. The current event does not establish an economy-identity change large enough to justify a transition.

Keep the existing operating-result effects (`charisma`, `merchant_shop_success`).

### 2.7 Closing the shop removes the Asset, not a wallet amount

Remove legacy `money -20` from `close_shop`.

Keep:

- `reputation -5`;
- `merchant_shop_failed` history flag;
- `asset_remove: merchant_shop`.

Update the player-facing choice copy so it no longer advertises `金钱 -20`.

Closing the shop does not automatically lower Wealth Capacity.

### 2.8 Asset and Wealth remain decoupled

This slice does not introduce automatic mappings such as:

```text
open shop → Wealth -1
close shop → Wealth -1
merchant_shop owned → Wealth +1
```

Asset ownership is a persistent world fact. Wealth Capacity is an economic-action identity. Either changes only through its own explicit canonical semantic.

## 3. Explicitly deferred merchant money semantics

Do not migrate or change the internal money semantics of `merchant_caravan_guard` in this slice.

This includes:

- `money >= 150` elite-guard requirement;
- `money -150 / +100` elite-guard effects;
- `money +60` self-escort reward;
- `money +30` normal-guard result.

The event's `merchant_shop` Asset ownership gate remains as delivered in Phase 1B.

Also deferred:

- merchant origin legacy `money +200`;
- `merchant_wealth_peak` legacy `money +200`;
- monopoly/expansion/guild and other merchant money consumers;
- `PlayerState.money` retirement;
- optional numeric `wealth` retirement;
- P17 `money + wealth` retirement;
- second Asset;
- Snapshot version changes or save migration.

## 4. Compatibility boundary

Snapshot remains `3.15.0`.

No load-time fallback or derivation is added. A legacy `3.15.0` state with `merchant_talent=true` but `wealthCapacity=no_surplus` may no longer qualify for `merchant_first_shop`; this is an accepted consequence of the existing no-migration policy.

## 5. Test-contract synchronization

Tests that explicitly froze legacy merchant money semantics must be updated rather than weakened.

In particular:

- P38 tests must stop treating `merchant_talent_discovery.study_business` as a real money setback or freezing its legacy `money +20` effect / `money >= 50` eligibility branch.
- `wealthMerchantVerticalSlice.test.ts` must stop requiring `invest_more money -50`.
- `testMerchantStatecraftVerticalSlice.ts` must assert Wealth/Asset semantics instead of exact shop-wallet deltas.
- Existing Asset lifecycle assertions remain intact.

Do not remove exact-contract tests merely because the accepted product contract changed. Rewrite them to freeze the new accepted semantics.

## 6. Acceptance semantics

The slice is complete when all of the following are true:

1. No `money` read or write remains in `merchant_talent_discovery`.
2. `study_business` raises Wealth Capacity to at least `modest_savings` and never lowers a richer character.
3. `merchant_first_shop` reads `merchant_talent` + `wealth_capacity_at_least modest_savings`, not `money`.
4. No shop-opening choice changes `money`.
5. `invest_more` reads Wealth Capacity but does not change `money` or Wealth Capacity.
6. `close_shop` removes `merchant_shop`, applies the existing reputation/history consequences, and does not change `money` or Wealth Capacity.
7. `merchant_caravan_guard` money semantics are unchanged.
8. Snapshot stays `3.15.0`; no new Asset or PlayerState field is introduced.
9. Focused tests and the repository's normal contract/headless/type/build gates pass, subject only to independently attributed pre-existing broad baselines.
