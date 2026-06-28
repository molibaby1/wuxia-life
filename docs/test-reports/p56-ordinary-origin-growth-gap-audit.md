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

---

## Appendix A: Peasant Growth Contract (US-003)

### Origin Identity
`farm_peasant` — rural hardship, constitution-focused, "ordinary" identity maintained.

### Midlife Signals / Forks

| Signal | Flag | Description | Fork Type |
|--------|------|-------------|-----------|
| **peasant_midlife_steadfast_accrual** | `peasant_midlife_steadfast_accrual` | By age 28, the peasant has accumulated land, tools, or livestock through years of consistent field work. Represents "staying and accumulating through hardship." | Staying/accumulating |
| **peasant_midlife_outside_offer** | `peasant_midlife_outside_offer` | By age 30, a merchant or traveling craftsman offers the peasant a chance to leave the village — trade labor for wider opportunity. Represents "switching paths." | Switching |

### Fork Details

#### Signal 1: Steadfast Accrual (Staying/Accumulating)
- **Trigger condition:** `peasant_steadfast_field` flag set from childhood fork + age ≥ 28
- **Outcome flags:** `peasant_midlife_steadfast_accrual`, `ordinary_peasant_midlife_done`
- **Player-facing text:** "你靠年复一年的耕种攒下几亩薄田，日子虽苦却有了根基。"
- **Identity impact:** Reinforces rural roots, does not elevate to vivid status

#### Signal 2: Outside Offer (Switching)
- **Trigger condition:** `peasant_swap_crew_curiosity` flag set from childhood fork + age ≥ 30
- **Outcome flags:** `peasant_midlife_outside_offer`, `ordinary_peasant_midlife_done`
- **Player-facing text:** "走南闯北的商人路过村子，说镇上缺人手——你第一次认真想过离开。"
- **Identity impact:** Opens possibility without forcing departure

### Boundary Constraints
- Does NOT rewrite peasant into a vivid origin (e.g., martial hero, merchant lord)
- Both signals are midlife depth, not dramatic transformation
- Keeps ordinary identity: rural laborer with bounded options

---

## Appendix B: Apprentice Growth Contract (US-004)

### Origin Identity
`town_apprentice` — craft/trade, comprehension-focused, "ordinary" identity maintained.

### Midlife Signals / Forks

| Signal | Flag | Description | Fork Type |
|--------|------|-------------|-----------|
| **apprentice_midlife_craft_mastery** | `apprentice_midlife_craft_mastery` | By age 26, the apprentice has mastered a specific craft skill (woodwork, metalwork, etc.) and gains recognition as a skilled artisan. Represents "trade/craft opportunity." | Craft mastery |
| **apprentice_midlife_trade_network** | `apprentice_midlife_trade_network` | By age 28, the apprentice has built trade relationships through years of running errands and meeting merchants. Represents "magnate opportunity" seed. | Trade network |

### Fork Details

#### Signal 1: Craft Mastery
- **Trigger condition:** `apprentice_craft_committed` flag set from childhood fork + age ≥ 26
- **Outcome flags:** `apprentice_midlife_craft_mastery`, `ordinary_apprentice_midlife_done`
- **Player-facing text:** "你专精的手艺终于得到认可，师傅说你可以出师了——镇上人都知道你的名字。"
- **Identity impact:** Elevates skill status within ordinary bounds

#### Signal 2: Trade Network
- **Trigger condition:** `apprentice_trade_curiosity` flag set from childhood fork + age ≥ 28
- **Outcome flags:** `apprentice_midlife_trade_network`, `ordinary_apprentice_midlife_done`
- **Player-facing text:** "跑外市让你认识了不少买卖人，有人提议合伙做小本生意。"
- **Identity impact:** Opens merchant pathway without recreating merchant_house

### Boundary Constraints
- Does NOT recreate merchant_house (vivid merchant origin)
- Both signals are within ordinary craft/trade bounds
- Keeps ordinary identity: skilled town worker with trade connections

---

## Appendix C: Tavern Growth Contract (US-005)

### Origin Identity
`tavern_hand` — social/network, charisma-focused, "ordinary" identity maintained.

### Midlife Signals / Forks

| Signal | Flag | Description | Fork Type |
|--------|------|-------------|-----------|
| **tavern_midlife_guest_regulars** | `tavern_midlife_guest_regulars` | By age 25, the tavern hand has become a fixture — regular guests know them by name and share information. Represents "guest circulation/chance meeting." | Guest network |
| **tavern_midlife_ally_referral** | `tavern_midlife_ally_referral` | By age 27, the ally network built through tavern work leads to a referral for a position outside the tavern (guard, steward, etc.). Represents "ally network opportunity." | Ally network |

### Fork Details

#### Signal 1: Guest Regulars
- **Trigger condition:** `tavern_guest_network` flag set from childhood fork + age ≥ 25
- **Outcome flags:** `tavern_midlife_guest_regulars`, `ordinary_tavern_midlife_done`
- **Player-facing text:** "常来的客人认得你了，有人请你帮忙传话、带信——你在镇上有了些人脉。"
- **Identity impact:** Builds social capital within ordinary bounds

#### Signal 2: Ally Referral
- **Trigger condition:** `ally_network` flag set from childhood fork + age ≥ 27
- **Outcome flags:** `tavern_midlife_ally_referral`, `ordinary_tavern_midlife_done`
- **Player-facing text:** "你帮忙照顾过的客人说城里的铺子缺人——问你愿不愿意去试试。"
- **Identity impact:** Opens wider world without becoming social elite

### Boundary Constraints
- Does NOT turn tavern_hand into a vivid elite social route
- Both signals are within ordinary social bounds
- Keeps ordinary identity: tavern worker with modest network advantages
