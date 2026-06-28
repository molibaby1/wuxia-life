# P59 Tavern-Hand Bridge: Downstream Gate Selection

> **Stage:** P59 tavern-hand merchant-adjacent bridge
> **Chosen downstream gate:** `merchant_magnate` via P55 magnate chain

## 1. Available Options

### Option A: `merchant_magnate` (巨贾行商, mixed tier)
- **Entry point:** `magnate_on_ramp` spine event (age 28-32)
- **Path:** tavern_hand → referral → city shop → magnate on-ramp → magnate chain → merchant_magnate
- **Precedent:** P58 apprentice bridge uses exactly this pattern

### Option B: `jianghu_renown_sage` (江湖名宿, mainstream tier)
- **Entry point:** Already reachable via `ally_network` (P25 existing path)
- **Path:** tavern_hand → ally_network → renown
- **Status:** Already exists — not a new bridge

### Option C: `merchant_martial_patron` (商武一体, mixed tier)
- **Entry point:** Requires merchant invest flags + route_wealth_committed
- **Path:** Would need martial axis + merchant axis — tavern_hand lacks martial seed
- **Status:** Two-axis requirement makes it a worse fit

### Option D: Invent a new destiny
- **Status:** Explicitly forbidden by PRD non-goals

## 2. Evaluation

| Criterion | Option A (merchant_magnate) | Option B (renown_sage) | Option C (merchant_martial) | Option D (new destiny) |
|-----------|------------------------------|-------------------------|----------------------------|------------------------|
| Repo-grounded | ✅ P55 chain exists, P58 precedent | ✅ Already exists | ⚠️ Exists but poor fit | ❌ New framework |
| Narrative fit | ✅ City shop referral → merchant-adjacent | ❌ Already P25 path, not new | ❌ Martial axis missing | ❌ Not allowed |
| Bounded scope | ✅ Reuse P55/P58 pattern | ❌ Not a new bridge | ❌ Two axes = bigger scope | ❌ Forbidden |
| Reuse existing assets | ✅ Magnate chain + P58 gate pattern | N/A (existing) | ❌ Need martial seed work | ❌ Zero reuse |
| Single-origin focus | ✅ Only need bridge flag + gate expansion | N/A | ❌ Two axes = more work | ❌ Out of scope |

## 3. Chosen: Option A — `merchant_magnate` via P55 magnate chain

### 3.1 Why this is preferable to inventing a new destiny

1. **P55 magnate chain already exists** — `magnate_on_ramp` → `magnate_midlife_pressure` → `magnate_payoff` is a complete, tested, closed chain. Inventing a new destiny would require new framework, new events, new expression — all out of scope.

2. **P58 established the bridge pattern** — the apprentice bridge already proved that a single `*_merchant_bridge_crossed` flag can satisfy both route + milestone conditions in `magnate_on_ramp` and `merchant_midlife_debt_milestone`. Reusing this pattern is minimal, bounded change.

3. **Tavern_hand's profile aligns** — highest socialCapital (0.58) among ordinary origins, urban background, service/rumor/social event bias. The "referral → city shop → magnate" narrative reads naturally for a network-based ordinary origin.

4. **No identity collapse** — the bridge flag approach keeps `tavern_hand` ordinary identity intact; the expression reads as "tavern-hand-turned-merchant-adjacent" not "generic merchant." This is consistent with P58's approach for apprentice.

### 3.2 Reuse boundary vs. P55 magnate chain

| Layer | P55 owns | P59 adds |
|-------|----------|----------|
| Spine events | `magnate_on_ramp`, `magnate_midlife_pressure`, `magnate_payoff` | None (reuse all) |
| Gate expressions | Existing route + milestone conditions | Add `tavern_merchant_bridge_crossed` as alternative in both conditions |
| Expression | P50 sample line expression (merchant_magnate identity, age40 identity, cost label | P56 ordinary origin expression (bridge branch for tavern_hand) |
| Chain entry | Merchant_house origin + merchant childhood seed | Tavern_hand origin + ally referral → bridge flag |

**P59 does NOT modify:**
- P55 magnate chain events themselves
- P50 sample line expression
- Merchant_house origin or merchant childhood seed
- Any vivid merchant origin content

### 3.3 Consistency with P25 ordinary wiring

P25 already documented that `tavern_hand` has:
- `jianghu_renown_sage` / mixed via guest network (already reachable)
- Highest socialCapital among ordinary origins (0.58)

P59 adds a second path — merchant-adjacent via the same guest-network signal set. This is consistent with P25's observation that guest network is a multi-purpose asset for `tavern_hand`. The renown path (mentor/ally) and the merchant path (referral/city shop) are two different fruits of the same network tree — both valid, both grounded in the origin's strengths.

## 4. Gate Expansion Plan

The `tavern_merchant_bridge_crossed` flag will be added as an alternative in both conditions of:
1. `magnate_on_ramp` (both route condition + milestone condition)
2. `merchant_midlife_debt_milestone` (both route condition + milestone condition)

This mirrors the exact pattern from P58's `apprentice_merchant_bridge_crossed`.
