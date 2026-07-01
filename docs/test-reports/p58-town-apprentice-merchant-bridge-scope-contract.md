# P58 Town Apprentice → Merchant Bridge Scope Contract (P58-002)

Generated: 2026-06-27

## Purpose

This scope contract defines the precise boundaries for P58: what is in scope, what is explicitly forbidden, and what layers are allowed. It prevents scope drift from the single `town_apprentice` → `merchant_magnate` bridge into broader merchant or ordinary expansion.

## 1. Stage Identity

**P58:** Close the bounded runtime bridge from `town_apprentice` ordinary-origin into the current `merchant_magnate` mixed gate and P55 magnate chain.

**Stage type:** Bounded ordinary-to-mixed bridge stage outside the closed sample-line track.

## 2. Allowed Scope

### 2.1 Target Origin
- **Only:** `town_apprentice`
- **Not:** `farm_peasant`, `tavern_hand`, or any vivid origin

### 2.2 Target Gate
- **Only:** `merchant_magnate` mixed destiny outcome
- **Not:** `healer_swordsman`, `merchant_martial_patron`, or any mainstream/pinnacle outcome

### 2.3 Allowed Layers

| Layer | Allowed | Boundary |
|-------|---------|----------|
| Configuration wiring | ✅ | Only through existing ordinary/merchant/wealth-route JSON carriers |
| Light expression | ✅ | Only on existing expression surfaces (no new UI components) |
| Targeted sim/verification | ✅ | One bounded artifact showing seed → bridge → magnate checkpoint |
| Narrow regression | ✅ | Tests covering bridge gate, expression, proof; reusing P25/P55/P56 harness |
| Design contracts | ✅ | Bridge contract + magnate entry contract (docs/config) |
| Audit/scope docs | ✅ | Gap audit, scope contract, closure report |

### 2.4 Allowed Configuration Changes
- Flag-setting rules that connect apprentice trade signals to merchant-route flags
- New JSON carrier entries within existing config schemas
- Modification of existing midlife event effects (adding flag consequences)

### 2.5 Allowed Expression Changes
- New `currentGoal` / `lifeMemory` / `summary` branches for bridge states
- Updated or new Chinese text strings within existing expression functions
- No new UI components, no new rendering surfaces

## 3. Forbidden Scope

### 3.1 Explicitly Forbidden
| Item | Reason |
|------|--------|
| Sample-line reopen | P54/P57 confirmed sample-line track closed |
| Second 40+ node expansion | Out of scope per PRD |
| `farm_peasant` or `tavern_hand` bridge | Only `town_apprentice` is in scope |
| Full merchant wave expansion | P55 already closed magnate chain |
| New origin or merchant framework | Must reuse existing carriers |
| Platformization / scheduler rewrite | Out of scope per PRD |
| Event pool batch activation | Out of scope per PRD |
| Full lifetime sim | Not required for bounded bridge proof |
| Economy system / map system | Out of scope per PRD |
| Vivid merchant origin rewrite | Apprentice must keep ordinary identity |

### 3.2 Implicitly Forbidden (Scope Drift Traps)
- Adding more than 2 bridge expression signals (keep narrow)
- Adding more than 1 targeted proof artifact (keep narrow)
- Rewriting existing P55 magnate chain events
- Adding new mixed destiny outcomes
- Changing P25 baseline fixture definitions
- Modifying P56 midlife event structure (only adding flag consequences)

## 4. Success Criteria

Per PRD §6:
1. `town_apprentice` trade-network reaches existing mixed/magnate evidence chain at runtime
2. Player-visible layer distinguishes "ordinary apprentice midlife" from "merchant ascent"
3. At least 1 targeted proof not relying on static mixed fixture seeding
4. P55, P56, P25 existing conclusions and boundaries do not regress

## 5. Validation Commands

- `npx tsc --noEmit` — typecheck must pass
- `npm exec tsx tests/p56OrdinaryOriginGrowthTests.ts` — existing P56 tests pass
- `npm exec tsx tests/p25MixedBaselineTests.ts` — existing P25 mixed tests pass (if applicable)
- Any new tests must pass

## 6. Rollback

If audit discovers apprentice signals cannot bounded-ly reach existing magnate gate:
- P58 falls back to bridge contract documentation only
- No强行 implementation layer expansion
- If bridge needs sample-line guard changes or new framework,方案 is out of scope → revert to smaller targeted proof
