# P59 Tavern Hand → Merchant-Adjacent Bridge Scope Contract (P59-002)

Generated: 2026-06-28

## Purpose

This scope contract defines the precise boundaries for P59: what is in scope, what is explicitly forbidden, and what layers are allowed. It prevents scope drift from the single `tavern_hand` → merchant-adjacent bridge into broader merchant, social, or ordinary expansion.

## 1. Stage Identity

**P59:** Close the bounded runtime bridge from `tavern_hand` ordinary-origin into the current `merchant_magnate` mixed gate and P55 magnate chain, by reusing the existing guest-network / ally-referral growth signals.

**Stage type:** Bounded ordinary-to-mixed bridge stage outside the closed sample-line track.

## 2. Allowed Scope

### 2.1 Target Origin
- **Only:** `tavern_hand`
- **Not:** `farm_peasant`, `town_apprentice`, or any vivid origin

### 2.2 Target Gate
- **Primary:** `merchant_magnate` mixed destiny outcome (via P55 magnate chain)
- **Not:** `healer_swordsman`, `merchant_martial_patron`, or any mainstream/pinnacle outcome as the primary target
- **Existing path preserved:** `jianghu_renown_sage` via `ally_network` (P25 existing path, untouched)

### 2.3 Allowed Layers

| Layer | Allowed | Boundary |
|-------|---------|----------|
| Configuration wiring | ✅ | Only through existing ordinary/merchant/wealth-route JSON carriers |
| Light expression | ✅ | Only on existing expression surfaces (no new UI components) |
| Targeted sim/verification | ✅ | One bounded artifact showing seed → bridge → magnate checkpoint |
| Narrow regression | ✅ | Tests covering bridge gate, expression, proof; reusing P25/P55/P56 harness |
| Design contracts | ✅ | Bridge contract + downstream gate entry contract (docs/config) |
| Audit/scope docs | ✅ | Gap audit, scope contract, closure report |

### 2.4 Allowed Configuration Changes
- Flag-setting rules that connect tavern-hand referral signals to merchant-route flags
- New JSON carrier entries within existing config schemas
- Modification of existing midlife event effects (adding flag consequences)
- Expansion of existing magnate gate expressions (accepting new bridge flag)

### 2.5 Allowed Expression Changes
- New `currentGoal` / `lifeMemory` / `summary` branches for bridge states
- Updated or new Chinese text strings within existing expression functions
- No new UI components, no new rendering surfaces
- Text must distinguish "ordinary tavern midlife growth" from "bridge crossing"

## 3. Forbidden Scope

### 3.1 Explicitly Forbidden
| Item | Reason |
|------|--------|
| Sample-line reopen | P54/P57 confirmed sample-line track closed |
| Second 40+ node expansion | Out of scope per PRD |
| `farm_peasant` bridge | Only `tavern_hand` is in scope |
| Full merchant wave expansion | P55 already closed magnate chain |
| New origin or merchant framework | Must reuse existing carriers |
| Platformization / scheduler rewrite | Out of scope per PRD |
| Event pool batch activation | Out of scope per PRD |
| Full lifetime sim | Not required for bounded bridge proof |
| Economy system / map system | Out of scope per PRD |
| Full tavern / social simulation | Out of scope per PRD |
| Vivid merchant origin rewrite | Tavern hand must keep ordinary identity |

### 3.2 Implicitly Forbidden (Scope Drift Traps)
- Adding more than 2 bridge expression signals (keep narrow)
- Adding more than 1 targeted proof artifact (keep narrow)
- Rewriting existing P55 magnate chain events
- Adding new mixed destiny outcomes
- Changing P25 baseline fixture definitions
- Modifying P56 midlife event structure (only adding flag consequences)
- Adding new UI components or new expression surfaces
- Expanding into tavern management or city relationship systems

## 4. Success Criteria

Per PRD §6:
1. `tavern_hand` guest-network / ally-referral reaches existing mixed/magnate evidence chain at runtime
2. Player-visible layer distinguishes "ordinary tavern midlife growth" from "bridge crossing into broader opportunity"
3. At least 1 targeted proof not relying on static mixed fixture seeding
4. P55, P56, P58, P25 existing conclusions and boundaries do not regress

## 5. Validation Commands

- `npx tsc --noEmit` — typecheck must pass
- `npm exec tsx tests/p56OrdinaryOriginGrowthTests.ts` — existing P56 tests pass
- `npm exec tsx tests/p58ApprenticeBridgeTests.ts` — existing P58 tests pass (no regression)
- Any new P59 tests must pass

## 6. Rollback

If audit discovers tavern-hand signals cannot bounded-ly reach existing magnate gate:
- P59 falls back to bridge contract documentation only
- No forced implementation layer expansion
- If bridge needs sample-line guard changes or new framework,方案 is out of scope → revert to smaller targeted proof
