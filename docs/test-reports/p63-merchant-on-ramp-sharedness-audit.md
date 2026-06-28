# P63 Merchant On-Ramp Sharedness Audit

> **Date:** 2026-06-28
> **Stage:** P63 Merchant Magnate Bridge-Entry Differentiation
> **Branch:** `codex/p63-wuxia-merchant-magnate-bridge-entry-differentiation`
> **Type:** Documentation-only — no runtime changes

---

## 1. Audit Purpose

P63-001 produces an audit of what the three ordinary bridges (apprentice, tavern, peasant) currently share at `merchant_magnate` entry. This document identifies the **flattening point** where the three distinct bridge identities converge too quickly into identical magnate entry experience.

This audit is the **truth source** for what P63 must differentiate, and what sharing is healthy reuse that should NOT be broken.

---

## 2. Shared Gates at Magnate Entry

### 2.1 On-Ramp Gate (P55 Source)

| Gate ID | Bridge Flag Accepts | Shared? |
|---------|-------------------|---------|
| `magnate_on_ramp` | `apprentice_merchant_bridge_crossed` | Yes — all three |
| `magnate_on_ramp` | `tavern_merchant_bridge_crossed` | Yes — all three |
| `magnate_on_ramp` | `peasant_merchant_bridge_crossed` | Yes — all three |

**Assessment:** All three bridge flags satisfy `magnate_on_ramp` identically. This is **healthy reuse** — a single gate that accepts any qualified bridge entry.

### 2.2 Midlife Debt Milestone Gate (P55 Source)

| Gate ID | Bridge Flag Accepts | Shared? |
|---------|-------------------|---------|
| `merchant_midlife_debt_milestone` | `apprentice_merchant_bridge_crossed` | Yes — all three |
| `merchant_midlife_debt_milestone` | `tavern_merchant_bridge_crossed` | Yes — all three |
| `merchant_midlife_debt_milestone` | `peasant_merchant_bridge_crossed` | Yes — all three |

**Assessment:** All three bridges satisfy the same milestone gate. **Healthy reuse.**

### 2.3 Downstream Gates (P55 Source)

| Gate ID | Bridge Flag Accepts | Shared? |
|---------|-------------------|---------|
| `magnate_midlife_pressure` | All three bridge flags | Yes — shared |
| `magnate_payoff` | All three bridge flags | Yes — shared |
| `merchant_magnate` (mixed gate) | All three bridge flags | Yes — shared |

**Assessment:** The entire P55 magnate chain is shared. **Healthy reuse of the magnate skeleton.**

---

## 3. Shared Flags

### 3.1 Bridge Checkpoint Flags

| Bridge | Bridge Flag | Route Commitment Flag |
|--------|-------------|----------------------|
| P58 Apprentice | `apprentice_merchant_bridge_crossed` | `route_wealth_committed` |
| P59 Tavern Hand | `tavern_merchant_bridge_crossed` | `route_wealth_committed` |
| P61 Peasant | `peasant_merchant_bridge_crossed` | `route_wealth_committed` |

**Assessment:** Flag naming follows `{origin}_merchant_bridge_crossed` pattern. **Healthy reuse of naming convention.**

### 3.2 Route Commitment Flag

| Flag | Used By | Purpose |
|------|---------|---------|
| `route_wealth_committed` | All three bridges | Marks player has committed to merchant wealth route |

**Assessment:** Shared across all three. **Healthy reuse — single route identity.**

---

## 4. Shared Expression Surfaces

### 4.1 currentGoal() Surface

| Bridge | Expression Text |
|--------|----------------|
| P58 Apprentice | "合伙经商已有起色，商路渐通" |
| P59 Tavern Hand | "城里铺子已上手，酒肆人脉铺出了商路" |
| P61 Peasant | "跟着粮商走南闯北，粮路渐宽" |

**Assessment:** All three follow pattern "[context-specific opening] + 商路渐通/铺出了商路/粮路渐宽". **Structurally identical templates — FLATTENING.**

### 4.2 lifeMemory() Surface

| Bridge | Expression Text |
|--------|----------------|
| P58 Apprentice | "你与买卖人合伙经商，从学徒踏上了商路。" |
| P59 Tavern Hand | "你靠着酒肆积累的人脉进了城里的铺子，从跑堂伙计踏上了商路。" |
| P61 Peasant | "你从田间走到粮路上，农家出身却踏上了商路。" |

**Assessment:** All three follow pattern "[origin-specific path] + 踏上了商路". **Structurally identical templates — FLATTENING.**

### 4.3 deriveOrdinaryOriginSummary() Surface

| Bridge | Expression Text |
|--------|----------------|
| P58 Apprentice | "学徒出身的商人：从铺子学徒到商路合伙，跨越了手艺与买卖的界限。" |
| P59 Tavern Hand | "酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。" |
| P61 Peasant | "农家出身的粮货商人：从田间到粮路，跨越了体力与买卖的界限。" |

**Assessment:** All three follow pattern "[origin]出身的商人：[origin-specific path]，[bridge-specific metaphor]。". **Structurally identical templates — FLATTENING.**

---

## 5. Entry Identity Chain Comparison

### 5.1 P58 Apprentice Entry Chain

```
origin_town_apprentice
  + apprentice_trade_curiosity (childhood fork)
  + apprentice_midlife_trade_network (age 26–30, social context)
  + apprentice_join_partnership (age 28–32, choice)
    ↓
apprentice_merchant_bridge_crossed
    ↓
magnate_on_ramp → magnate chain
```

**Identity seed:** Craft skill → Trade network partnership

### 5.2 P59 Tavern Hand Entry Chain

```
origin_tavern_hand
  + tavern_guest_network (childhood fork)
  + tavern_midlife_guest_regulars (age 26–30, social context)
  + tavern_embrace_network (age 28–32, choice)
  + tavern_midlife_ally_referral (age 30–34)
  + tavern_take_referral (choice)
    ↓
tavern_merchant_bridge_crossed
    ↓
magnate_on_ramp → magnate chain
```

**Identity seed:** Social service → Guest network → Ally referral

### 5.3 P61 Peasant Entry Chain

```
origin_farm_peasant
  + peasant_swap_crew_curiosity (childhood fork)
  + ordinary_peasant_midlife_outside_offer (age 30, grain-trade offer)
  + peasant_accept_outside (choice)
    ↓
peasant_merchant_bridge_crossed
    ↓
magnate_on_ramp → magnate chain
```

**Identity seed:** Physical labor → Swap crew curiosity → Grain trade offer

---

## 6. Healthy Reuse vs Flattening

### 6.1 Healthy Reuse (Do NOT Break)

| Category | Items | Rationale |
|----------|-------|-----------|
| Gate architecture | `magnate_on_ramp`, `merchant_midlife_debt_milestone`, `magnate_midlife_pressure`, `magnate_payoff` | P55 magnate skeleton must remain intact |
| Flag naming pattern | `{origin}_merchant_bridge_crossed` | Consistent, predictable naming convention |
| Route commitment | `route_wealth_committed` | Single route identity is correct |
| Mixed identity | `merchant_magnate` | All three must reach same mixed outcome |
| Expression surface types | `currentGoal()`, `lifeMemory()`, `deriveOrdinaryOriginSummary()` | Surface types should remain consistent |

### 6.2 Flattening (P63 Must Address)

| Category | Current State | Problem | P63 Target |
|----------|---------------|---------|------------|
| Entry expression templates | All three use structurally identical `[X] + 商路` pattern | Player cannot distinguish origin at magnate entry | Differentiate the entry expression templates |
| currentGoal() tone | All say "商路渐通/铺出/粮路宽" | Identical progression tone | Add origin-specific tone/flavor |
| lifeMemory() structure | All say "从[X]踏上了商路" | Identical bridge crossing narrative | Differentiate the bridge-crossing narrative |
| Summary() structure | All say "[origin]出身的商人：从[X]..." | Identical origin framing | Differentiate the origin identity framing |
| Entry checkpoint flavor | No origin-specific checkpoint text at `magnate_on_ramp` | Gate entry is generic | Add bounded origin-specific checkpoint flavor |

---

## 7. Flattening Point Summary

**The primary flattening point is at `magnate_on_ramp` gate entry.**

After crossing their respective bridges, all three player types:
1. Arrive at the same `magnate_on_ramp` gate with identical checkpoint text
2. See the same `currentGoal()` expression pattern
3. Have the same `lifeMemory()` bridge-crossing narrative
4. Receive the same `deriveOrdinaryOriginSummary()` origin framing

**P63's minimum viable differentiation is:** Add bounded, origin-specific entry flavor at `magnate_on_ramp` that extends each bridge's seed identity without rewriting the P55 magnate skeleton.

---

## 8. Scope Boundary

### 8.1 What P63 CAN Change

- Expression templates for `currentGoal()`, `lifeMemory()`, `deriveOrdinaryOriginSummary()` at magnate entry
- Entry checkpoint flavor text for `magnate_on_ramp`
- Light configuration markers that indicate origin-bridge type
- Expression surface wiring to carry origin-specific differentiation

### 8.2 What P63 MUST NOT Change

- P55 magnate skeleton (on_ramp → pressure → payoff → magnate chain)
- Bridge flag naming pattern (`{origin}_merchant_bridge_crossed`)
- Route commitment mechanism (`route_wealth_committed`)
- Mixed identity destination (`merchant_magnate`)
- The shared gate architecture

---

## 9. Audit Conclusions

1. **Gate architecture is sound:** All three bridges correctly share the P55 magnate gates. This is healthy reuse.

2. **Flag pattern is sound:** The `{origin}_merchant_bridge_crossed` naming is consistent and should be preserved.

3. **Entry expression is the flattening point:** All three bridges use structurally identical expression templates that make the magnate entry experience read the same regardless of origin.

4. **Entry checkpoint lacks flavor:** The `magnate_on_ramp` gate entry has no origin-specific checkpoint text to distinguish the three paths.

5. **P63 target is clear:** Add minimum bounded differentiation through expression templates and entry checkpoint flavor that extends each bridge's seed identity.

---

## 10. Runtime Behavior Impact

**This story does not change runtime behavior.** This is a documentation-only audit to establish the truth source for P63 differentiation work.

