# P55 Merchant Magnate Gap Audit

> **Date:** 2026-06-27
> **Stage:** P55 bounded merchant magnate expansion
> **Branch:** `codex/p55-wuxia-merchant-magnate-bounded-expansion`

## 1. Purpose

Audit the current `merchant_magnate` evidence chain to identify what exists (proven layers) and what is missing (runtime / content / verification layers), so P55 extends real gaps rather than rebuilding already-proven surfaces.

## 2. Proven Layers

### 2.1 P25 Static Mixed Identity Slice

| Artifact | File | Status |
| --- | --- | --- |
| `mixed_merchant_magnate_path` | `src/p25/mixedSimulationBaselines.ts:35` | PASS — `route_wealth_committed: true, business_empire: true` |
| `merchant_magnate` mixed outcome | `src/p25/mixedIdentitySlice.ts:32` | PASS — ≥2 cross-track groups satisfied |
| P25 mixed baseline metrics | `docs/test-reports/p25-mixed-identity-slice.md` | PASS — magnate path confirmed |

**Evidence:** The P25 mixed identity slice proves `merchant_magnate` as a composite identity from ≥2 cross-track groups (商路 + 富甲) at summary. This is the static label proof.

### 2.2 Merchant Route Configuration (merchant.json)

| Event | ID | What it provides |
| --- | --- | --- |
| 经商天赋 | `merchant_talent` | Youth talent discovery → `route_merchant` |
| 开设店铺 | `merchant_first_shop` | Shop opening with 3 variants (grocery/weapon/herb) |
| 经营困境 | `merchant_shop_failure` | Failure / recovery fork |
| 商队护送 | `merchant_caravan_guard` | Caravan → `merchant_caravan_success` |
| 垄断市场 | `merchant_market_monopoly` | Monopoly → `merchant_monopoly` or `merchant_fair_trade` |
| 官商勾结 | `merchant_official_connection` | Official friend → `merchant_official_friend` |
| 情报买卖 | `merchant_intelligence_network` | Intelligence → `merchant_intelligence` |
| 商会会长 | `merchant_chamber_of_commerce` | Chamber head → `merchant_chamber_head` |
| 富可敌国 | `merchant_wealth_peak` | Wealth peak → `merchant_wealthy` |
| 投资门派 | `merchant_sect_investment` | Sect investment → `merchant_invest_good/evil/both` |
| 商业帝国 | `merchant_business_empire` | Empire → `merchant_empire` |
| 结局系列 | `merchant_ending_*` | 4 terminal endings |

**Coverage:** Full merchant route from talent discovery → shop → expansion → empire → endings exists in `merchant.json`.

### 2.3 Sample-Line Spine Events

| Event | ID | Gate |
| --- | --- | --- |
| 童年种子 | `merchant_childhood_seed_milestone` | `p8_route_wealth \|\| p9_echo_business_hook` |
| 40 岁身份 | `merchant_age40_identity_summary` | `merchant_talent \|\| merchant_childhood_seed_done \|\| p8_route_wealth` |
| 中年代价 | `merchant_midlife_debt_milestone` | shop path + age 32 |
| 45 岁分岔 | `merchant_age45_expansion_fork` | `merchant_age40_identity_done` |

**Coverage:** Spine events exist for merchant childhood → age 32 debt → age 40 identity → age 45 expansion fork.

### 2.4 Expression Layer (sampleLineExpression.ts)

| Surface | Function | Status |
| --- | --- | --- |
| currentGoal | `merchantCurrentGoal()` | 8 branches covering full merchant lifecycle |
| age40Identity | `merchantAge40Identity()` | Debt vs non-debt branches |
| costLabel | `deriveSampleLineCostLabel()` | Returns "商路债务" for merchant |

### 2.5 P54 Residual Polish

| Artifact | Status |
| --- | --- |
| `merchant_midlife_debt_milestone` gate broadened + mandatory | Closed — seed 804 debt path verified |
| `merchantCurrentGoal` midlife debt expression | Closed — "周转吃紧，人情债未清" |
| Guard G-17 | Closed — merchant debt baseline guarded |

### 2.6 Related Infrastructure

| Layer | Status |
| --- | --- |
| `deriveLifeMemorySummary` | Merchant route detected via `route_merchant` / `route_wealth_committed` / `p22_wealth_route_forked` |
| P25 achievement traceability | `merchant_magnate` has choiceFlags + midLifeConsequenceSurfaces |
| P25 ordinary baselines | `merchant_magnate` in `MID_TIER_OUTCOMES` |
| P39 content pool consistency | `merchant_magnate` referenced in P39 slice |

## 3. Missing Layers

### 3.1 Magnate-Specific Spine Events

| Gap | Description |
| --- | --- |
| No magnate on-ramp milestone | No spine event triggers the magnate path specifically (distinct from generic merchant route) |
| No magnate midlife pressure | No spine event for magnate-specific pressure (distinct from `merchant_midlife_debt`) |
| No magnate payoff node | No spine event for magnate terminal outcome (distinct from `merchant_age45_expansion_fork`) |

**Impact:** The magnate path relies entirely on generic merchant events. There is no distinct chain that proves "magnate" as a bounded, recognizable arc.

### 3.2 Magnate Expression Signals

| Gap | Description |
| --- | --- |
| No magnate currentGoal branch | `merchantCurrentGoal()` does not distinguish magnate from generic merchant |
| No magnate age40 identity | `merchantAge40Identity()` does not distinguish magnate from generic merchant |
| No magnate life-memory signal | `deriveLifeMemorySummary` has no magnate-specific label |

**Impact:** Players cannot read "magnate" as a distinct arc. The magnate is invisible at the expression layer.

### 3.3 Magnate Simulation Proof

| Gap | Description |
| --- | --- |
| No targeted sim slice | No simulation or benchmark proves the magnate terminal outcome is reachable |
| No flag/event evidence trail | No recorded evidence of magnate-specific flags being set during simulation |

**Impact:** The magnate path has no runtime reachability proof beyond the static P25 label.

### 3.4 Magnate Regression Tests

| Gap | Description |
| --- | --- |
| No on-ramp test | No test asserts magnate on-ramp conditions |
| No payoff test | No test asserts magnate payoff node |
| No expression test | No test asserts magnate-specific expression |

**Impact:** Future merchant edits could silently erase the magnate path.

### 3.5 Magnate Documentation

| Gap | Description |
| --- | --- |
| No replay/audit artifact | No readable artifact for the magnate path |
| No closure report | No P55 closure report |

## 4. Gap Priority

| Priority | Gap | Story |
| --- | --- | --- |
| 1 | Magnate on-ramp contract (design) | P55-003 |
| 2 | Magnate payoff contract (design) | P55-004 |
| 3 | Magnate spine events (config) | P55-005 |
| 4 | Magnate expression signals | P55-006 |
| 5 | Magnate sim slice | P55-007 |
| 6 | Magnate regression tests | P55-008 |
| 7 | Magnate replay artifact | P55-009 |
| 8 | P55 closure report | P55-010 |

## 5. Non-Goals Reminder

- Not reopening sample-line track (P46→P54)
- Not implementing Wave 4 ordinary growth
- Not expanding to full economy system
- Not runtime platformization or event pool batch activation
