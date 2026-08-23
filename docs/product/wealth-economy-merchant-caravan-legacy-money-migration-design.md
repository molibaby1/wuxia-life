# Wuxia-Life — Merchant Caravan Legacy Money Migration Design

**Status:** Human accepted  
**Date:** 2026-08-23  
**Scope:** `merchant_caravan_guard` + `merchant_market_monopoly` entry continuity only

## 1. Purpose

This slice continues the accepted Wealth / Economy Product Contract after the delivered Merchant Shop migration.

The target is not to migrate all merchant economy content. It is to remove precise legacy `money` semantics from the caravan decision itself while preserving the existing downstream progression into `merchant_market_monopoly`.

The slice must prove that a merchant can reach the same economic-development stage through either:

- sufficient existing Wealth Capacity; or
- a non-economic domain capability (martial ability) used to successfully complete a commercial expansion event.

The result must not introduce a caravan Asset, automatic Wealth arithmetic, or a general economy framework.

## 2. Confirmed repository state

Current `merchant_caravan_guard`:

- requires canonical `merchant_shop` Asset at event level;
- preserves the existing caravan rhythm / pressure condition;
- `hire_elite_guards` currently uses legacy `money >= 150`, then `money -150` and `money +100`;
- `escort_personally` currently requires `martialPower >= 30` and grants `money +60`;
- `hire_normal_guards` grants `money +30`;
- only elite and personal escort set `merchant_caravan_success`.

Current `merchant_market_monopoly` entry requires:

```text
merchant_caravan_success == true && money >= 150
```

Therefore the current `escort_personally +60` is not merely a reward. With common money baselines it can also push a self-made merchant across the downstream `money >= 150` gate. Removing that reward without migrating downstream eligibility would silently break route continuity.

A second implementation fact matters: choice availability in Browser / Headless reads canonical singular `choice.condition`. The current caravan elite/personal choices use non-canonical plural `conditions`, so the accepted Wealth and martial gates must be authored as singular `condition` in this slice.

## 3. Accepted product semantics

### 3.1 Elite guards are a Wealth alternative path

`hire_elite_guards` becomes available when:

```text
wealthCapacity >= comfortable_means
```

Player-facing meaning:

> A character with `家资殷实` or greater economic capability can mobilize enough resources to buy the safest caravan protection path.

This is a Wealth Requirement / Alternative Path, not a Major Commitment.

Therefore:

- no precise `money` requirement;
- no `money` cost;
- no `money` reward;
- no automatic Wealth downgrade;
- no automatic Wealth upgrade is required because the entry requirement already guarantees at least `comfortable_means`.

Existing non-economic outcomes remain:

- `reputation +10`;
- `merchant_caravan_success = true`.

### 3.2 Personal escort converts successful commercial expansion into economic identity growth

`escort_personally` keeps the existing martial requirement:

```text
martialPower >= 30
```

On success:

- remove `money +60`;
- keep `martialPower +5`;
- keep `merchant_caravan_success = true`;
- add `wealth_capacity_raise_to: comfortable_means`.

This is not “martial skill generates money”. The event already describes a merchant organizing cross-region transport. The martial capability is the way the character successfully completes that commercial expansion. The successful expansion is the economic fact that justifies moving a self-made merchant from `modest_savings` to at least `comfortable_means`.

The existing monotonic `wealth_capacity_raise_to` contract applies:

- lower Wealth may rise to `comfortable_means`;
- equal/higher Wealth remains unchanged;
- no arithmetic or automatic +1 semantics.

### 3.3 Normal guards remain a conservative non-breakthrough path

`hire_normal_guards`:

- removes `money +30`;
- keeps `charisma +3`;
- does not set `merchant_caravan_success`;
- does not change Wealth Capacity.

This preserves the existing distinction: the ordinary-guard option is safer / incremental but does not establish the commercial breakthrough required by the next stage.

Do not add a new flag, Asset, payoff framework, or compensating numeric reward simply to make the option look symmetrical.

## 4. Downstream continuity

`merchant_market_monopoly` entry must be migrated in the same slice.

Replace the combined legacy expression:

```text
merchant_caravan_success == true && money >= 150
```

with two canonical event conditions:

```text
merchant_caravan_success == true
AND
wealth_capacity_at_least comfortable_means
```

This gives two valid route shapes:

### Existing-wealth route

```text
comfortable_means+
→ hire elite guards
→ merchant_caravan_success
→ market-stage eligibility
```

### Self-made martial route

```text
modest_savings + martialPower >= 30
→ escort personally
→ raise_to comfortable_means
→ merchant_caravan_success
→ market-stage eligibility
```

High legacy `money` alone must no longer unlock either the elite caravan path or the downstream market stage.

## 5. Explicitly deferred market semantics

This slice changes only `merchant_market_monopoly` **entry eligibility**.

Do not migrate its choices:

```text
monopoly_trade → money +80
fair_competition → money +40
```

Those outcomes raise a separate product question: what durable market position / Wealth transition / social consequence should represent market-level commercial success. Removing those numbers without designing their replacement would create an empty or semantically degraded event.

They remain explicit legacy debt.

## 6. No caravan Asset

Do not add `merchant_caravan` to `AssetId`.

Current evidence describes successfully organizing / escorting a caravan operation, not persistent ownership of a reusable caravan entity.

A caravan Asset should be reconsidered only if real gameplay requires persistent semantics such as:

- current ownership of a standing caravan;
- repeated invocation;
- loss / replacement;
- upgrades;
- persistent caravan-specific downstream conditions.

`merchant_caravan_success` remains a commercial milestone flag in this slice.

## 7. Canonical authoring requirements

### `merchant_caravan_guard`

Event-level conditions remain:

```text
asset_owned merchant_shop
AND
existing rhythm / pressure expression
```

Choice-level conditions must use singular canonical `condition`:

```text
hire_elite_guards.condition
= wealth_capacity_at_least comfortable_means

escort_personally.condition
= expression martialPower >= 30
```

Do not retain plural `conditions` on those choices.

### `merchant_market_monopoly`

Use event-level `conditions[]` AND semantics:

```text
expression: flags.merchant_caravan_success == true
wealth_capacity_at_least: comfortable_means
```

No composite-condition DSL is required.

## 8. Player-facing copy

Update caravan choice copy so it matches actual canonical conditions and effects.

At minimum:

- elite guards must no longer say `金钱≥150`;
- personal escort must not imply a money reward if such wording exists;
- normal guards must not promise a money reward;
- market event choice reward copy is out of scope and remains unchanged because those legacy rewards remain.

Recommended elite wording:

```text
雇佣精锐保镖团队（需财力达到家资殷实，安全率最高）
```

Minor wording adjustment is allowed to match existing style, without changing product semantics.

## 9. Scope boundary

### In scope

- `merchant_caravan_guard` precise `money` requirement / costs / rewards;
- canonical choice condition shape for elite and personal paths;
- `escort_personally → wealth_capacity_raise_to comfortable_means`;
- `merchant_market_monopoly` entry migration from `money >= 150` to Wealth Capacity;
- focused runtime / authoring tests;
- exact-contract test updates that intentionally freeze the retired caravan money behavior;
- gate registration;
- Contract Part B / Product Decision / docs index synchronization.

### Out of scope

- `merchant_market_monopoly` choice `money +80/+40`;
- other merchant `money` consumers;
- origin legacy `money +200`;
- `merchant_wealth_peak money +200`;
- P17 `money + wealth`;
- second Asset / caravan Asset;
- new persisted fields;
- Snapshot version change;
- save migration;
- generic alternative-path / composite-condition framework;
- automatic Wealth downgrade;
- full merchant economy migration;
- B0 / P8 / sample-line / unrelated broad-gate repairs.

## 10. Acceptance semantics

The slice is complete when real runtime evidence proves all of the following:

1. `hire_elite_guards` is unavailable to `modest_savings` even with arbitrarily high legacy `money`.
2. `hire_elite_guards` is available at `comfortable_means` with legacy `money = 0`.
3. Elite success does not mutate legacy `money` or Wealth Capacity and still sets `merchant_caravan_success` / reputation outcome.
4. `escort_personally` actually enforces `martialPower >= 30` through canonical singular `condition`.
5. Personal escort success does not mutate legacy `money`, keeps martial growth / success flag, and raises lower Wealth to at least `comfortable_means` without lowering higher Wealth.
6. Normal guards do not mutate legacy `money`, do not change Wealth, and do not set caravan success.
7. `merchant_market_monopoly` cannot be unlocked by high `money` alone.
8. `merchant_caravan_success + comfortable_means` unlocks the market event even with `money = 0`.
9. Market-event internal `money +80/+40` effects remain unchanged and explicitly deferred.
10. `merchant_shop` remains the only AssetId and Snapshot remains `3.15.0`.
