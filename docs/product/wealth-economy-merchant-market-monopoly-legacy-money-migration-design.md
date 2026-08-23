# Wealth / Economy — Merchant Market Monopoly Legacy Money Migration Design

**Status:** Human accepted — delivered 2026-08-23  
**Scope:** `merchant_market_monopoly` choice outcomes only (`monopoly_trade`, `fair_competition`)

## 1. Problem

### 1.1 Current state

After the delivered caravan slice, market-stage **entry** already uses Wealth Capacity:

```text
merchant_caravan_success == true
AND
wealth_capacity_at_least comfortable_means
```

But market-stage **choice outcomes** still express commercial success through legacy wallet arithmetic:

```text
monopoly_trade   → money +80, reputation -10, merchant_monopoly
fair_competition → money +40, reputation +10, merchant_fair_trade
```

This creates a semantic fracture:

```text
market entry     → controlled by Wealth Capacity
market choice    → still controlled by legacy money rewards
```

A player who reaches the market stage through canonical Wealth semantics still receives choice copy and effects framed as cash padding, not as the accepted economic-identity transition the product now requires.

### 1.2 Why this is not caravan-style structural debt

Repository analysis for this event has established:

```text
No structural downstream unlock dependency found.
```

Unlike `merchant_caravan_guard escort_personally → money +60`, which previously pushed self-made merchants across the downstream `money >= 150` gate, the `+80/+40` rewards on `merchant_market_monopoly` are **soft legacy-wallet padding only**.

Direct downstream consumers of this event are flag-based:

- `merchant_official_connection` requires `merchant_monopoly == true || merchant_fair_trade == true`
- `merchant_ending_hidden_wealth` requires `merchant_fair_trade == true && chivalry >= 50`

Neither consumer reads the removed `+80/+40` amounts. Removing those wallet effects therefore does not break proven direct structural reachability into official connection or hidden-wealth ending identity.

## 2. Accepted semantics — Approach B (asymmetric Wealth transition)

Human has formally accepted **Approach B — 非对称 Wealth transition**. Approach A (remove the legacy money rewards while retaining only reputation + existing route flags) and Approach C (defer behavioral migration and keep the wallet rewards as debt) are closed.

### 2.1 `monopoly_trade`

Remove legacy:

```text
money +80
```

Migrate to:

```text
wealth_capacity_raise_to: wealthy
reputation -10
merchant_monopoly = true
```

Product meaning:

> 通过控制货源和市场支配实现经济身份质变，因此 Wealth Capacity 至少提升到 `wealthy`；同时承担同行怨恨和社会声誉代价。

This is an **event-level economic identity transition**, not a numeric conversion from `+80` to `wealthy`.

### 2.2 `fair_competition`

Remove legacy:

```text
money +40
```

Retain:

```text
reputation +10
merchant_fair_trade = true
```

Do **not** add any Wealth transition.

Product meaning:

> 公平竞争提供社会信誉、长期商业身份和既有专属后续路径，但本事件不代表经济身份进一步跃迁。

### 2.3 Route divergence after migration

```text
monopoly_trade
→ Wealth economic advancement
→ reputation cost
→ merchant_monopoly

fair_competition
→ no Wealth advancement
→ reputation gain
→ merchant_fair_trade
→ existing hidden-wealth downstream
```

The two routes are intentionally **not** economically symmetric.

## 3. Wealth boundary

- `wealthy` here means market dominance has expanded the character's future economic action capacity; it is not a wallet balance.
- `wealth_capacity_raise_to` remains monotonic:
  - `comfortable_means + monopoly → wealthy`
  - `wealthy + monopoly → wealthy`
  - `regional_magnate + monopoly → regional_magnate`
- Wealth must not be derived from flags, reputation, or legacy `money`.
- The fair path must not auto-upgrade Wealth.
- No Wealth arithmetic, downgrade, or `+1` ladder semantics are introduced.

## 4. Durable semantics

Continue using existing milestone flags:

```text
merchant_monopoly
merchant_fair_trade
```

These remain route-identity markers. Do **not** add:

- a second Asset
- a market-position schema
- a new persisted field
- a new fact type

Current evidence is insufficient to justify an independent “market position” entity model. Flags remain the durable route milestone representation for this slice.

## 5. Downstream compatibility

### 5.1 Preserved consumers

- `merchant_official_connection` continues to unlock from either `merchant_monopoly` or `merchant_fair_trade`.
- `merchant_ending_hidden_wealth` continues to require `merchant_fair_trade` plus `chivalry >= 50`.

### 5.2 Explicitly not migrated in this slice

- `merchant_official_connection` wallet thresholds and bribe arithmetic
- `merchant_chamber_of_commerce money >= 300`
- origin / `merchant_wealth_peak` legacy money
- any other merchant money consumer outside this event's two choices

Removing `+80/+40` does not break the proven direct structural reachability of official-connection or hidden-wealth branches, because those branches key off flags and non-wallet conditions already present before this migration.

## 6. Player-facing copy

### 6.1 Narrative body may remain metaphorical

The event body may continue narrative language such as “快速积累财富” if it fits existing tone. That is story framing, not a wallet promise.

### 6.2 Choice labels/descriptions must stop exposing wallet rewards

Choice copy must no longer display:

```text
金钱 +80
金钱 +40
```

Players should see the real trade-off, for example:

```text
垄断经营
→ 财力跃升 / 声望受损

公平竞争
→ 保持财力 / 声望提升
```

Exact wording should converge to existing merchant-route style. Do not promise unimplemented industry controls, market-management systems, or numeric payout guarantees.

## 7. Explicit non-goals

- `merchant_chamber_of_commerce` money migration
- `merchant_official_connection` money migration
- merchant ending money migration
- second Asset or `merchant_caravan` Asset
- market-position schema / framework
- Snapshot version change
- Wealth Capacity enum change
- new runtime primitive
- origin / `merchant_wealth_peak` money migration
- P17 changes
- global `money` field retirement
- Auto Evolution / B0 / P8 changes
- making Wealth a universal downstream unlock for all later merchant content

## 8. Acceptance semantics

This design is complete when implementation evidence proves:

### 8.1 Wealth transitions

```text
comfortable_means + monopoly → wealthy
wealthy + monopoly             → wealthy
regional_magnate + monopoly    → regional_magnate
comfortable_means + fair       → comfortable_means
```

### 8.2 Wallet retirement

```text
money → neither choice reads or writes legacy wallet balance
```

### 8.3 Route identity preserved

```text
monopoly → merchant_monopoly flag set
fair     → merchant_fair_trade flag set
```

### 8.4 Reputation semantics

Reputation effects remain additive social consequences:

```text
monopoly → reputation decreases
fair     → reputation increases
```

Authoring must use explicit additive `stat_modify` operator where product intent is delta-based; do not accidentally preserve runtime `set` default behavior as the new contract.

### 8.5 Downstream continuity

```text
merchant_monopoly or merchant_fair_trade → merchant_official_connection eligible
merchant_fair_trade + chivalry >= 50     → merchant_ending_hidden_wealth eligible
```

without requiring the retired `+80/+40` wallet padding.

## 9. Scope boundary

### In scope

- `merchant_market_monopoly` choice effects and choice copy only
- focused migration test
- directly required predecessor-test synchronization
- real-gate registration
- PD-069
- Wealth / Economy Contract Part B inventory update
- docs index closure

### Out of scope

Everything listed in Section 7 plus any unrelated merchant JSON, broad gate repair, or predecessor slice re-opening beyond the minimum test-boundary updates required to retire the old “deferred market money” guard.
