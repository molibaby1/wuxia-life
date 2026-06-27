# P58 Apprentice Bridge Contract (P58-003)

Generated: 2026-06-27

## Purpose

Define the bounded contract for how `town_apprentice` trade-network signals graduate into the existing `merchant_magnate` wealth-route and magnate chain. This is the design-level bridge specification.

## 1. Apprentice Prerequisite Group

The following existing flags form the minimal apprentice prerequisite set:

### 1.1 Seed Flags (Early Life)
| Flag | Source | Meaning |
|------|--------|---------|
| `apprentice_trade_curiosity` | `ordinary_apprentice_craft_fork` childhood choice | Apprentice chose trade exposure over pure craft |

### 1.2 Growth Flags (Midlife)
| Flag | Source | Meaning |
|------|--------|---------|
| `apprentice_midlife_trade_network` | `ordinary_apprentice_midlife_trade_network` event | Trade network established through market visits |
| `apprentice_join_partnership` | Partnership choice option | Committed to joint venture with trade contacts |

### 1.3 Required Combination
Bridge fires when ALL:
- `origin_town_apprentice === true`
- `apprentice_trade_curiosity === true` (early seed)
- `apprentice_midlife_trade_network === true` (midlife growth)
- `apprentice_join_partnership === true` (commitment choice)

This ensures the bridge is gated by ordinary-origin identity, early trade interest, network growth, and a commitment decision — not by a single flag or static fixture.

## 2. Bridge Checkpoint

**Checkpoint name:** `apprentice_merchant_bridge_crossed`

**When it fires:** At the moment `apprentice_join_partnership` is set, if all prerequisite flags are present.

**What it sets:**
- `route_wealth_committed: true` — connects to existing merchant-route gate
- `apprentice_merchant_bridge_crossed: true` — bridge-specific tracking flag

**Rationale:** The `apprentice_join_partnership` choice is the natural bridge point — it represents the apprentice committing to a commercial venture with trade contacts, which is the narrative equivalent of entering the merchant route.

## 3. Connection to Existing Wealth-Route Gate

The `merchant_magnate` mixed destiny requires:
1. `resources >= 55` — apprentice gets `+120 money` from partnership, contributing to resources
2. `social_capital >= 55` — trade network provides social capital base
3. `route_wealth_committed` or `p22_wealth_route_forked` — **bridge sets `route_wealth_committed`**
4. `business_empire` or `merchant_empire` or `merchant_wealthy` — downstream magnate chain provides this

After bridge crossing, the path connects to:
- P55 `magnate_on_ramp` spine event (merchant route + wealth milestone)
- P55 `magnate_midlife_pressure` → `magnate_payoff` chain
- Existing `merchant_magnate` mixed gate via `route_wealth_committed`

## 4. Ordinary Identity Preservation

Before bridge checkpoint fires:
- Player is identified as `town_apprentice` (ordinary tier)
- All expression surfaces read as ordinary apprentice
- `currentGoal`, `lifeMemory`, `summary` show apprentice flavor
- No merchant-route flags are set

After bridge checkpoint fires:
- Player still has `origin_town_apprentice` flag
- Expression surfaces can now show bridge/merchant-ascent flavor
- `route_wealth_committed` enables merchant gate evaluation
- Magnate chain events become reachable

The bridge does NOT:
- Change origin tier from ordinary to vivid
- Remove apprentice identity flags
- Rewrite the apprentice origin surface
- Add new origin or framework

## 5. Implementation Layer

The bridge checkpoint is implemented by adding `route_wealth_committed` and `apprentice_merchant_bridge_crossed` to the `join_partnership` option's flags array in `src/data/lines/ordinary-origin-midlife.json`.

This is a minimal JSON config change within the existing midlife event structure — no new framework, no new config carrier.

## 6. Downstream Flag Flow

```
origin_town_apprentice + apprentice_trade_curiosity (early)
  ↓
apprentice_midlife_trade_network (midlife event)
  ↓
apprentice_join_partnership (choice)
  ↓
apprentice_merchant_bridge_crossed + route_wealth_committed (bridge checkpoint)
  ↓
P55 magnate_on_ramp (spine event)
  ↓
P55 magnate_midlife_pressure → magnate_payoff
  ↓
merchant_magnate mixed gate evaluation
```

## 7. Edge Cases

| Case | Behavior |
|------|----------|
| Player chooses `decline_partnership` | Bridge does NOT fire; apprentice stays on craft path |
| Player has `apprentice_trade_curiosity` but not `apprentice_midlife_trade_network` | Bridge prerequisite not met; no bridge |
| Player is not `town_apprentice` origin | Bridge flags are never checked; no bridge |
| Player already has `route_wealth_committed` from another source | Flag is idempotent; bridge tracking flag still set |
