# P56 Ordinary-Origin Growth Gap Audit (US-001)

Generated: 2026-06-27

## Scope

This audit summarizes the proven surfaces and thin spots for the three ordinary origins (`farm_peasant`, `town_apprentice`, `tavern_hand`) as established by P25 Wave 4, and identifies growth opportunities for P56.

## Proven Surfaces (P25 Wave 4 Minimum — Already Met)

### farm_peasant
- **Infant chain (0–2):** `quest_peasant_infant_passive_0_2` with 5 nodes (cottage birth → straw swaddle → hoe grasp → yard crawl → path steps)
- **Preschool (3–7):** `preschool_peasant_*` passive entries
- **Childhood choice (8–15):** `ordinary_peasant_plow_fork` → `peasant_steadfast_field` / `peasant_swap_crew_curiosity`
- **Distinct opportunity bias:** Constitution-focused, rural hardship identity established
- **Mid-tier eligibility:** `jianghu_renown_sage` via `mentor_bond` path fixtures

### town_apprentice
- **Infant chain (0–2):** `quest_apprentice_infant_passive_0_2` with 5 nodes (shop birth → shavings swaddle → chisel grasp → workbench crawl → alley steps)
- **Preschool (3–7):** `preschool_apprentice_*` passive entries
- **Childhood choice (8–15):** `ordinary_apprentice_craft_fork` → `apprentice_craft_committed` / `apprentice_trade_curiosity`
- **Distinct opportunity bias:** Comprehension-focused, craft/trade identity established
- **Mid-tier eligibility:** `merchant_magnate` via trade route flags

### tavern_hand
- **Infant chain (0–2):** `quest_tavern_infant_passive_0_2` with 5 nodes (inn birth → wine swaddle → ladle grasp → cellar crawl → threshold steps)
- **Preschool (3–7):** `preschool_tavern_*` passive entries
- **Childhood choice (8–15):** `ordinary_tavern_network_fork` → `tavern_service_committed` / `tavern_guest_network` + `ally_network`
- **Distinct opportunity bias:** Social/network-focused, guest circulation identity established
- **Mid-tier eligibility:** `jianghu_renown_sage` / mixed via guest network

## Already-Met Minimum Criteria

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Distinct opportunity bias per origin | ✅ Met | P25 ordinary-origin-slice.md |
| Early/mid wiring (infant → preschool → childhood) | ✅ Met | ordinary-origin-early-life.json, origin-infant-passives.json |
| Trajectory slice vs vivid controls | ✅ Met | p25-ordinary-origin-slice.json |
| Baseline metrics | ✅ Met | p25-ordinary-baseline-metrics.json |

## Thin Spots / Growth Opportunities

### 1. Midlife Depth Gap
- **Current state:** Each origin has only one childhood fork (8–15) producing 2 flag variants
- **Gap:** No midlife-specific signals or forks exist beyond the childhood choice
- **Growth opportunity:** Add 2+ midlife signals per origin with distinct fork paths

### 2. Player-Facing Expression Gap
- **Current state:** No `currentGoal` or `life-memory` expressions for ordinary origins
- **Gap:** Ordinary origins are invisible in player-facing summaries and goals
- **Growth opportunity:** Add readable expression signals on existing surfaces (currentGoal, life-memory, summary)

### 3. Mid-Tier Verification Gap
- **Current state:** No verification artifact proving midlife changes are runtime-visible
- **Gap:** Only childhood slice is verified; midlife depth unverified
- **Growth opportunity:** Create mid-tier verification slice covering all three origins

### 4. Regression Test Gap
- **Current state:** No narrow assertions preventing ordinary origins from flattening back to generic starts
- **Gap:** No tests specifically guard the three ordinary paths
- **Growth opportunity:** Add per-origin regression tests

### 5. Configuration Wiring Gap
- **Current state:** Only childhood choices exist; no midlife configuration touchpoints
- **Gap:** No events or spine entries for midlife ordinary-origin growth
- **Growth opportunity:** Wire midlife story configuration without new framework

## Growth Opportunity Priority

| Priority | Opportunity | Impact | Effort |
|----------|-------------|--------|--------|
| 1 | Midlife depth (signals + forks) | High — core differentiation | Medium |
| 2 | Player-facing expression | High — visible to player | Low |
| 3 | Configuration wiring | Medium — enables runtime | Medium |
| 4 | Regression tests | Medium — prevents regression | Low |
| 5 | Verification slice | Low — documentation only | Low |

## Non-Goals (Confirmed)

- No fourth ordinary origin
- No sample-line work
- No full ordinary-life system
- No platform/scheduler rewrite
- No bulk deferred event wiring
