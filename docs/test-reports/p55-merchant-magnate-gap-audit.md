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

## Appendix A: Magnate On-Ramp Contract (P55-003)

### A.1 Prerequisite Groups

The magnate path requires **both** groups satisfied:

**Group 1 — Merchant Route Foundation:**
- `route_merchant == true` OR `merchant_childhood_seed_done == true` OR `p8_route_wealth == true`

**Group 2 — Wealth Capital Milestone (at least one):**
- `merchant_caravan_success == true` (商队成功)
- `merchant_shop_grocery == true || merchant_shop_weapon == true || merchant_shop_herb == true` (开店)
- `merchant_wealthy == true` (富可敌国)
- `merchant_chamber_head == true` (商会会长)

### A.2 On-Ramp Milestone

| Field | Value |
| --- | --- |
| Event ID | `magnate_on_ramp` |
| Age range | 28–32 |
| Trigger | `age_reach: 28` |
| Gate | Group 1 AND Group 2 AND `!magnate_on_ramp_done` |
| Flag set | `magnate_on_ramp_done` |
| Narrative | "产业初成，商路已铺开半壁江山。你不再是小本经营的掌柜——财富与人脉把你推到了'巨贾'的门槛。" |

**Semantics:** The on-ramp marks the transition from "successful merchant" to "magnate threshold." It does not conflict with existing merchant-first, debt, or expansion semantics — it fires after the merchant route is established and wealth milestones are reached.

### A.3 Midlife Pressure Milestone

| Field | Value |
| --- | --- |
| Event ID | `magnate_midlife_pressure` |
| Age range | 36–40 |
| Trigger | `age_reach: 36` |
| Gate | `magnate_on_ramp_done == true` AND `!magnate_midlife_pressure_done` |
| Flag set | `magnate_midlife_pressure_done` |
| Narrative | "商号遍九州，人情债也遍九州。每笔赊账、每位合作伙伴、每桩江湖义气，都是一根牵着你的线——巨贾的担子，比掌柜的重得多。" |

**Semantics:** The midlife pressure is magnate-specific (distinct from `merchant_midlife_debt` which is about financial周转). The magnate pressure is about **obligation density** — too many people depend on you, too much capital is at risk, too many favors are owed.

### A.4 Relationship to Existing Spine

| Existing Event | Relationship |
| --- | --- |
| `merchant_midlife_debt_milestone` | Fires for generic merchant debt (financial周转). Magnate pressure is separate (obligation density). |
| `merchant_age40_identity_summary` | Fires for all merchant routes. Magnate on-ramp is a prerequisite for magnate-specific expression. |
| `merchant_age45_expansion_fork` | Fires for all merchant routes. Magnate payoff replaces this with a distinct terminal node. |

## Appendix B: Magnate Payoff Contract (P55-004)

### B.1 Payoff Node

| Field | Value |
| --- | --- |
| Event ID | `magnate_payoff` |
| Age range | 44–48 |
| Trigger | `age_reach: 44` |
| Gate | `magnate_on_ramp_done == true` AND `magnate_midlife_pressure_done == true` AND `!magnate_payoff_done` |
| Flag set | `magnate_payoff_done`, `magnate_payoff_resolved` |
| Narrative | "半生经营，你的商号已成江湖不可或缺的血脉。可每一笔利润都沾着人情，每一桩合作都系着风险——巨贾之位，坐上去容易，守住难。" |

### B.2 Payoff Semantics

The magnate payoff体现 **"财富规模 + 人情/风险/经营负担"** 三重维度：

| Dimension | Expression |
| --- | --- |
| 财富规模 | 商号遍九州，资本雄厚 |
| 人情/风险 | 每笔利润沾着人情，每桩合作系着风险 |
| 经营负担 | 坐上去容易，守住难 |

### B.3 Distinction from Existing Payoffs

| Payoff | Key Difference from Magnate |
| --- | --- |
| `merchant_martial_patron` | Patron focuses on **武力投资 + 门派关系**; magnate focuses on **财富规模 + 经营负担** |
| `merchant_age45_expansion_fork` | Expansion fork is a **选择分岔** (联号共担 vs 独守铺面); magnate payoff is a **terminal state** (巨贾之位已成，代价已至) |
| Sample-line merchant 45 | Sample-line merchant 45 is generic 商路 payoff; magnate payoff is specific to 巨贾 arc |

### B.4 Expression Contract

| Surface | Magnate Signal | Distinct from Merchant Generic |
| --- | --- | --- |
| currentGoal (post-on-ramp) | "产业初成，商路铺开半壁江山" | Generic merchant: "第一桶金已得，店铺经营中" |
| currentGoal (post-pressure) | "商号遍九州，人情债也遍九州" | Generic merchant: "周转吃紧，人情债未清" |
| currentGoal (post-payoff) | "巨贾之位已成，守住比扩张更难" | Generic merchant: "扩张分岔已至，债与人情并重" |
| age40Identity | "你是富甲一方却身不由己的巨贾" | Generic merchant: "你是靠经营立足的商路中人" |
