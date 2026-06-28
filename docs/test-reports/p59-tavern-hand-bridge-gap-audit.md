# P59 Tavern Hand Bridge Gap Audit (P59-001)

Generated: 2026-06-28

## Scope

This audit maps the existing `tavern_hand` ordinary-origin growth signals, the available mixed / merchant-adjacent downstream gates, and the runtime bridge gap between them. It identifies what P59 must close to turn the tavern-hand guest-network and ally-referral signals from narrative flavor into a runtime-reachable bridge into a higher-value route.

## 1. Existing Tavern-Hand Ordinary-Growth Signals

### 1.1 Origin Surface (`wuxiaOriginSurfaces.ts`)
- **originId:** `tavern_hand`
- **label:** 跑堂伙计
- **originTier:** `ordinary`
- **Resources:** familyResources 0.36, guidanceQuality 0.22, socialCapital 0.58, hardshipExposure 0.44
- **Regional background:** `urban`
- **Event bias:** `service` (1.45×), `rumor` (1.3×), `social` (1.15×)
- **Key observation:** `socialCapital` is the highest among the three ordinary origins (0.58 vs 0.38 for apprentice, 0.18 for peasant), consistent with a network-based origin.

### 1.2 Early Life Chain (`ordinary-origin-early-life.json`)
- **Infant chain:** `quest_tavern_infant_passive_0_2` (from P25 ordinary wiring)
- **Preschool:** `preschool_tavern_*` (from P25 ordinary wiring)
- **Childhood choice (9–13):** `ordinary_tavern_network_fork`
  - `tavern_service_committed` → service path (学跑堂)
  - `tavern_guest_network` + `ally_network` → network path (记客人)

### 1.3 Midlife Depth (P56, `ordinary-origin-midlife.json`)
- **`tavern_guest_network`** — early guest exposure signal (age 25, from childhood fork)
- **`ordinary_tavern_midlife_guest_regulars`** (age 25): guest regulars recognition
  - `tavern_embrace_network` → network cultivation path (+charisma +connections)
  - `tavern_keep_distance` → cautious path
- **`ordinary_tavern_midlife_ally_referral`** (age 27): ally referral opportunity
  - `tavern_take_referral` → accept referral to city shop (+externalSkill +reputation)
  - `tavern_decline_referral` → decline, stay at tavern

### 1.4 Baseline Fixture (`ordinarySimulationBaselines.ts`)
- Fixture `ordinary_tavern_renown_path` (id: `ordinary_tavern_renown_path`)
  - originId: `tavern_hand`
  - flags: `ally_network: true`, `tavern_guest_network: true`
  - Targets: `jianghu_renown_sage` (江湖名宿) via `ally_network`
  - **This fixture targets renown, not merchant.** It proves tavern_hand can reach mid-tier but only through the renown route, not through a merchant-adjacent path.

### 1.5 Expression Surfaces (`ordinaryOriginExpression.ts`)
- `tavernCurrentGoal()` — 5 states: early service → guest network → midlife guest regulars → ally referral
- `tavernLifeMemory()` — 5 narrative memories from early service → ally referral
- `deriveOrdinaryOriginSummary()` — 2 summary tiers (early/midlife)
- **No expression currently reads as "crossing into merchant ascent" or "entering a broader opportunity network beyond tavern"** — all text stays within ordinary tavern flavor.

## 2. Existing Downstream Gate Options

### 2.1 Mixed Destiny Gates (`wuxiaOriginSurfaces.ts`)

#### `merchant_magnate` (巨贾行商, mixed tier)
Requires ALL:
1. `resources >= 55`
2. `social_capital >= 55`
3. `key_choices`: any of `['route_wealth_committed', 'p22_wealth_route_forked']`
4. `key_choices`: any of `['business_empire', 'merchant_empire', 'merchant_wealthy']`

#### `jianghu_renown_sage` (江湖名宿, mainstream tier)
Requires ALL:
1. `skill_growth >= 45`
2. `reputation >= 65`
3. `social_capital >= 55`
4. `key_choices`: any of `['mentor_bond', 'ally_network']`

**Current state:** Tavern hand already reaches `jianghu_renown_sage` via `ally_network` (documented in P25 ordinary wiring). This is the existing P25 path.

#### `merchant_martial_patron` (商武一体, mixed tier)
Requires ALL:
1. `skill_growth >= 50`
2. `resources >= 50`
3. `key_choices`: any of `['merchant_invest_good', 'merchant_invest_both', 'merchant_invest_evil']`
4. `key_choices`: any of `['route_wealth_committed', 'p22_wealth_route_forked']`

### 2.2 P55 Magnate Chain (sample-lines-spine.json)
- `magnate_on_ramp` spine event (age 28–32): merchant route + wealth milestone gate
  - Gate expression accepts: `apprentice_merchant_bridge_crossed` (added in P58)
  - Does NOT currently accept any tavern-hand-specific flag
- `magnate_midlife_pressure` spine event (age 36–40): magnate-specific pressure
- `magnate_payoff` spine event (age 42–46): magnate payoff
- Chain: `magnate_on_ramp_done` → `magnate_midlife_pressure_done` → `magnate_payoff_done`

### 2.3 Merchant Midlife Debt Milestone
- `merchant_midlife_debt_milestone` (age 32–38): also has route + milestone conditions
- Also accepts `apprentice_merchant_bridge_crossed` from P58
- Does NOT currently accept any tavern-hand-specific flag

## 3. Bridge Gap Analysis

### 3.1 What Exists
| Layer | Evidence | Status |
|-------|----------|--------|
| Tavern origin surface | `tavern_hand` ordinary tier with highest socialCapital among ordinary origins | ✅ Complete |
| Early life chain | infant → preschool → childhood network fork | ✅ Complete |
| Midlife depth | guest network → guest regulars → ally referral | ✅ Complete (P56) |
| Existing mid-tier path | `jianghu_renown_sage` via `ally_network` | ✅ Complete (P25) |
| Mixed gate definitions | `merchant_magnate`, `merchant_martial_patron` defined | ✅ Complete |
| P55 magnate chain | on-ramp → pressure → payoff spine | ✅ Complete |
| P58 apprentice bridge pattern | `apprentice_merchant_bridge_crossed` flag + gate expansion pattern | ✅ Reference available |

### 3.2 What Is Missing
| Gap | Description | Impact |
|-----|-------------|--------|
| **Runtime flag bridge** | No config wires `tavern_take_referral` → `route_wealth_committed` or equivalent merchant-adjacent flag | Tavern network signals never reach merchant-adjacent gates |
| **Transition expression** | No expression reads as "crossing from tavern service into a broader opportunity network" | Bridge invisible to player |
| **Midlife → downstream gate connector** | `tavern_take_referral` only gives +externalSkill +reputation, no route flag or business milestone | Ally referral is a narrative dead-end for merchant-adjacent paths |
| **Targeted proof** | No sim/replay shows tavern seed → bridge → downstream gate checkpoint | Bridge only exists as narrative, not runtime proof |
| **Regression coverage** | No tests verify tavern-hand bridge path is not silently broken | Bridge could regress undetected |

### 3.3 Root Cause
The P56 midlife growth created tavern-hand network signals (`tavern_guest_network`, `tavern_midlife_guest_regulars`, `tavern_midlife_ally_referral`, `tavern_take_referral`) as **narrative endpoints** — they write currentGoal and lifeMemory but never set route flags or business empire flags. The existing baseline fixture (`ordinary_tavern_renown_path`) targets `jianghu_renown_sage` through `ally_network`, which is a valid P25 path but not a merchant-adjacent bridge. The `tavern_take_referral` option reads as "去城里的铺子试试" (try the city shop) — a perfect narrative setup for a merchant-adjacent bridge — but it currently only grants stats, not route flags.

## 4. P59 Scope Boundaries

### 4.1 In Scope (recommended)
- Wiring tavern-hand referral signal to an existing downstream gate through JSON config
- Adding player-visible expression for the bridge crossing
- Producing one targeted proof that does not rely on static mixed-flag seeding
- Narrow regression tests covering bridge gate, expression, and proof

### 4.2 Out of Scope (per PRD non-goals)
- Reopening sample-line track or adding second 40+ nodes
- Expanding `farm_peasant` bridge
- Redesigning P55 magnate payoff or adding deeper merchant waves
- Full lifetime sim, economy system, or platformization
- Creating a new destiny or route framework

## 5. Recommendations for P59 Implementation

1. **P59-003 (Bridge Contract):** Define the minimal tavern-hand prerequisite set (guest network + embrace network + ally referral + take referral) and the checkpoint where referral converts to a merchant-adjacent route flag
2. **P59-004 (Downstream Gate):** Choose `merchant_magnate` as the downstream target (via P55 magnate chain), mirroring the P58 apprentice bridge pattern — tavern_hand's high socialCapital and urban background make merchant-adjacent a natural fit, and reusing the P55 chain avoids inventing a new destiny
3. **P59-005 (Wire Config):** Add flag-setting rules in midlife config so `tavern_take_referral` → `tavern_merchant_bridge_crossed` (analogous to `apprentice_merchant_bridge_crossed`), and expand `magnate_on_ramp` + `merchant_midlife_debt_milestone` gates to accept the new bridge flag
4. **P59-006 (Expression):** Add ≥2 readable bridge signals in existing expression surfaces (currentGoal, lifeMemory, summary)
5. **P59-007 (Proof):** Produce one targeted sim artifact showing tavern seed → bridge → magnate checkpoint
6. **P59-008 (Tests):** Add narrow regression covering bridge gate, expression, and proof
