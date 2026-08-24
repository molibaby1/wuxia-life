# Merchant Bankrupt Ending Temporary Retirement Design

**Status:** Human accepted; implementation delivered
**Date:** 2026-08-24
**Scope:** `merchant_ending_bankrupt` only, plus directly required active-catalog manifest/test/governance synchronization.

## 1. Problem

The current merchant bankruptcy ending is still authored as:

```text
merchant_talent == true
AND money <= 50
→ merchant_ending_bankrupt
```

That contract is no longer semantically valid after the merchant Wealth Capacity migration.

Repository-grounded analysis established all of the following:

- migrated merchant progression from shop through Tycoon no longer depends on legacy wallet balance;
- `no_surplus` explicitly means “no strategic surplus”, not bankruptcy or inability to live;
- the migrated late-game spine can legally produce `merchant_empire + regional_magnate + money <= 50` states;
- merchant endings share the regular weighted formal-event lane, so bankrupt can compete with Tycoon/Royal/Chamber/Hidden-Wealth rather than being deterministically suppressed;
- the repository contains no durable late-game business-collapse / insolvency milestone that can legitimately replace the wallet gate;
- `merchant_shop_failed` and loss of the single `merchant_shop` Asset are historical/local business facts and are explicitly not equivalent to bankruptcy.

Therefore the active bankruptcy ending currently produces false-positive terminal semantics.

## 2. Accepted Product Decision

Temporarily retire `merchant_ending_bankrupt` from active gameplay.

Retirement means:

```text
merchant_ending_bankrupt
→ absent from the active EventLoader catalog
→ absent from event-asset manifest inventory
→ cannot become eligible or compete in the ending pool
```

There is intentionally **no replacement bankruptcy condition** in this slice.

Specifically, do not replace the legacy wallet gate with:

- `wealthCapacity == no_surplus`;
- any other Wealth Capacity level;
- `merchant_shop_failed`;
- loss of `merchant_shop` ownership;
- a newly invented `merchant_bankrupt` / `merchant_business_collapsed` flag;
- an impossible placeholder condition;
- global ending precedence rules.

## 3. Why Temporary Retirement Is the Correct Immediate Action

### 3.1 Keeping the wallet gate is invalid

`money <= 50` now mostly reflects interaction with deferred/global wallet systems, not failure inside the migrated merchant progression. A successful `regional_magnate` with `merchant_empire` can still have a low legacy wallet and therefore become eligible for both Tycoon and Bankrupt endings.

### 3.2 Direct Wealth substitution is invalid

The Wealth Contract explicitly separates strategic economic capacity from wallet balance and bankruptcy. In particular:

```text
no_surplus ≠ bankrupt
```

Wealth Capacity cannot be used as a shorthand failure flag.

### 3.3 A dedicated bankruptcy flag would be premature

The repository currently has no valid producer for a durable bankruptcy state. Adding a flag only so the ending can consume it would move the magic from a wallet threshold to an unsupported label.

### 3.4 Retirement removes a known wrong outcome without inventing gameplay

Removing the invalid ending from the active pool is lower-risk and more truthful than authoring a replacement failure model without evidence.

## 4. Retirement Mechanism

Use the existing repository pattern for removing obsolete events from the active catalog:

1. delete the `merchant_ending_bankrupt` event definition from `src/data/lines/merchant.json`;
2. synchronize `src/data/event-asset-manifest.json` so the removed event is no longer listed as runtime-loaded;
3. keep the historical/product decision in documentation rather than preserving an unreachable active event definition.

Do **not** use `metadata.enabled = false` as a retirement mechanism. Current EventLoader/GameEngine formal selection does not use that field as an active-pool filter.

Do **not** use `weight = 0`; single-candidate formal selection can still return an event independently of its configured weight.

Do **not** add an impossible condition or sentinel flag merely to make the event unreachable.

## 5. Runtime Semantics After Retirement

After this slice:

### 5.1 Low legacy wallet does not imply bankruptcy

A state such as:

```text
merchant_talent = true
money = 0
```

must not expose `merchant_ending_bankrupt`, because the event no longer exists in the active catalog.

### 5.2 Successful merchant ending remains valid at low wallet

A state such as:

```text
merchant_talent = true
merchant_empire = true
wealthCapacity = regional_magnate
money = 0
age = 70
```

must still allow `merchant_ending_tycoon` according to its existing formal conditions, while no bankrupt ending can compete.

### 5.3 Other merchant endings are untouched

Do not change:

- `merchant_ending_tycoon`;
- `merchant_ending_royal`;
- `merchant_ending_chamber`;
- `merchant_ending_hidden_wealth`.

This slice does not introduce deterministic success-ending precedence or any other scheduler behavior.

## 6. Wealth Boundary

This retirement does not change Wealth Capacity.

No new Wealth transition, requirement, decrement, or derivation is authorized.

Future bankruptcy gameplay may or may not change Wealth Capacity. That decision must be made when there is a concrete business-failure event and evidence for the post-failure economic identity.

The following remain true:

```text
money <= 50 ≠ bankrupt
no_surplus ≠ bankrupt
merchant_shop_failed ≠ bankrupt
merchant_shop ownership loss ≠ bankrupt
```

## 7. Asset Boundary

`merchant_shop` remains the only formal `AssetId`.

Bankruptcy is not modeled as `asset_remove merchant_shop`, because one shop is not the totality of a late-game merchant's economic position and the repository already permits historical shop failure followed by later success.

No new business-empire Asset or portfolio model is introduced.

## 8. Future Reintroduction Criteria

A bankruptcy ending may be reintroduced only after repository-grounded product design establishes a real bankruptcy-producing gameplay fact.

At minimum, future design should answer:

1. What event or chain constitutes persistent business failure, insolvency, or collapse?
2. Is the failure recoverable before terminal ending selection?
3. Does it coexist with or invalidate `merchant_empire`, `merchant_chamber_head`, or other success milestones?
4. Does it change Wealth Capacity, and if so why?
5. What durable milestone/fact records the failure?
6. How should failure endings interact with successful merchant endings?

The future producer must exist before a dedicated bankruptcy flag/fact is considered canonical.

## 9. Event-Asset Inventory Synchronization

Because retirement removes a runtime-loaded event, the canonical event-asset inventory must be synchronized.

Expected consequences include:

- `merchant_ending_bankrupt` absent from `src/data/event-asset-manifest.json`;
- merchant runtime event count reduced by one;
- total runtime event count reduced by one;
- deferred runtime-event count reduced by one;
- golden-line overlap counts unchanged because the retired event was age 65–75.

Use the repository's existing event-asset inventory generator or an equivalent exact synchronization. Do not leave a manifest entry for an event no longer loaded by `EventLoader`.

## 10. Governance / Contract Recording

Record the decision as PD-072:

> Merchant bankrupt ending is temporarily retired because legacy wallet balance is no longer valid bankruptcy evidence. No replacement Wealth condition, failure flag, Asset rule, or ending precedence rule is introduced. Reintroduction requires concrete persistent business-failure gameplay evidence.

Update Wealth / Economy Product Contract Part B implementation inventory to state that:

- `merchant_ending_bankrupt` is no longer an active legacy-wallet consumer;
- bankruptcy semantics remain unresolved at the product level pending real failure gameplay;
- this does not mean `no_surplus` has been redefined as bankruptcy.

## 11. Testing Contract

A focused regression suite must prove all of the following:

1. `EventLoader.getEventById('merchant_ending_bankrupt') === undefined`.
2. `src/data/event-asset-manifest.json` contains no `merchant_ending_bankrupt` event entry.
3. A `merchant_talent + money = 0` state does not expose a bankrupt ending.
4. A `merchant_empire + regional_magnate + money = 0` state still exposes `merchant_ending_tycoon` at its valid age and does not expose bankrupt.
5. Other merchant endings remain in the active catalog.
6. No new bankruptcy flag/fact/Wealth rule is added by this slice.

The focused suite must be registered in the real test gate.

## 12. Explicit Non-Goals

This slice does **not**:

- design or implement a business-collapse event;
- add `merchant_bankrupt`, `merchant_business_collapsed`, insolvency, debt-crisis, or equivalent state;
- alter Wealth Capacity levels or semantics;
- alter `merchant_shop` Asset semantics;
- add a second Asset;
- alter ending scheduling, weighted selection, priority, or precedence;
- modify Tycoon/Royal/Chamber/Hidden-Wealth ending conditions;
- migrate `identity-merchant.json`;
- migrate P26/P42;
- retire global `money`;
- modify origin/P17/global economy semantics;
- modify Auto Evolution, B0, P8, or unrelated broad gates;
- change Snapshot `3.15.0`.

## 13. Acceptance Criteria

The slice is delivered only when:

1. `merchant_ending_bankrupt` is absent from the active event catalog.
2. It is absent from the event-asset manifest.
3. Low legacy wallet alone cannot produce a bankrupt ending.
4. Tycoon remains eligible for `merchant_empire + regional_magnate` even with `money = 0`.
5. Other merchant endings are unchanged.
6. No replacement bankruptcy state or Wealth mapping is introduced.
7. PD-072, Product Contract Part B, README, and this design reflect the retirement accurately.
8. Focused tests, merchant/Wealth regression suites, typecheck, contracts, headless/parity, build, and diff checks pass scope-locally.
9. `npm test` is run and scope-local results are separated from known broad/pre-existing failures.
10. Snapshot remains `3.15.0`; `merchant_shop` remains the only formal AssetId.
11. No commit is created unless Human explicitly requests it after review.
