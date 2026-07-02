# P102 Merchant Martial Patron Bridge Gap Audit

> **Stage:** P102 Wuxia Merchant Martial Patron Bridge (Narrow Playable)  
> **Story:** P102-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P101-N01

## 1. Purpose

Document existing `merchant_martial_patron` achievement/traceability assets and isolate missing spine/sample-line hooks so P102 targets the correct bounded bridge wiring surface without reopening P55/P97–P101 magnate spine.

---

## 2. Existing Assets (Pre-P102)

### 2.1 Mixed achievement definition

| Asset | Location | Status |
| ----- | -------- | ------ |
| Outcome ID | `wuxiaOriginSurfaces.ts` → `merchant_martial_patron` | ✅ Defined — tier `mixed`, `coexistWith: merchant_magnate` |
| Requirements | skill_growth≥50, resources≥50, `merchant_invest_*`, `route_wealth_committed`/`p22_wealth_route_forked` | ✅ Gate defined |
| Cross-tracks | `merchant_track` + `martial_track` | ✅ Aligned with 商武一体 |

### 2.2 Traceability / simulation proof

| Asset | Location | Status |
| ----- | -------- | ------ |
| P25 mixed path | `mixedSimulationBaselines.ts` → `mixed_merchant_patron_path` | ✅ Static composite proof |
| P25 mixed identity slice | `mixedIdentitySlice.ts` | ✅ PASS — merchant_track+martial_track |
| P37 habit-led lifetime | `p37AdditionalMixedPinnacleLifetimeSlices.ts` | ✅ `p37_mixed_merchant_patron_habit_zero_lifetime` |
| P37 trace report | `p37-mixed-merchant-patron-lifetime-trace.md` | ✅ route_wealth_committed + merchant_invest_good |
| Achievement traceability | `achievementTraceability.ts` | ✅ choiceFlags + midLifeConsequenceSurfaces |
| P39 content pool | `p39ContentPoolConsistencySlice.ts` | ✅ Referenced |

### 2.3 Merchant route content (partial)

| Asset | Location | Status |
| ----- | -------- | ------ |
| Wealth fork | `p22-content-expansions.json` → `p22_early_wealth_route_fork` | ✅ Sets `route_wealth_committed` |
| Sect investment | `merchant.json` → `merchant_sect_investment` | ✅ Sets `merchant_invest_good/evil/both` |
| Rare line | `merchant_patron_line` → `p16_merchant_patron` | ✅ Probabilistic; not spine bridge |

### 2.4 Magnate spine (closed — do not reopen)

| Stage | Scope | P102 relationship |
| ----- | ----- | ----------------- |
| P55 | `magnate_on_ramp` → pressure → payoff → late-life | **Forbidden rewrite** |
| P97–P101 | Native + bridge magnate differentiation through endgame echo | **Regression guard only** |

---

## 3. Missing Layers (P102 Target)

### 3.1 No patron bridge spine events

| Gap | Description |
| --- | ----------- |
| No patron bridge entry | No sample-line spine event reads wealth/martial commitment flags and sets patron checkpoint beyond flavor |
| No patron payoff/echo | No lightweight P93-style terminal echo for patron path |
| No patron checkpoint flags | No `merchant_patron_bridge_crossed` / `merchant_patron_on_ramp_done` / `merchant_patron_payoff_done` in spine |

**Impact:** Players with `route_wealth_committed` + `merchant_invest_*` can unlock mixed achievement via sim/trace only; no playable event-driven bridge comparable to P63 magnate entry or P83 medical bridge.

### 3.2 No patron expression differentiation

| Surface | Reads patron bridge markers? | Status |
| ------- | ---------------------------- | ------ |
| `merchantCurrentGoal` | ❌ | No patron branch |
| `merchantAge40Identity` | ❌ | No patron branch |
| `deriveSampleLineCostLabel` | ❌ | No patron branch |

**Impact:** Even if flags were set manually, player-facing text would read as generic merchant or magnate.

### 3.3 No ordinary-origin cross-route bridge

| Origin | Bridge to patron? | Notes |
| ------ | ----------------- | ----- |
| `merchant_house` | ❌ Spine hook | P37 habit-led trace only |
| `town_apprentice` / `tavern_hand` / `farm_peasant` | ❌ | P58/P59/P60 target `merchant_magnate`, not patron |
| P69 inventory | ❌ Zero ordinary-origin patron bridge | Deferred to P102 |

---

## 4. Prerequisite Flags (P22/P37 Evidence)

| Flag | Source | Role in patron bridge |
| ---- | ------ | --------------------- |
| `route_wealth_committed` | P22 wealth fork / ordinary merchant bridges | Wealth route commitment |
| `p22_wealth_route_forked` | P22 early fork | Alternate wealth commitment signal |
| `merchant_invest_good` | `merchant_sect_investment` | Orthodox sect patron investment |
| `merchant_invest_evil` | `merchant_sect_investment` | Martial/evil sect backer |
| `merchant_invest_both` | `merchant_sect_investment` | Dual patron investment |

**P37 terminal bridge flags:** `[route_wealth_committed, merchant_invest_good]` — P102 spine entry should align with this evidence chain.

---

## 5. Patron vs Magnate — Scope Boundary

| Dimension | `merchant_magnate` (P55–P101 closed) | `merchant_martial_patron` (P102 target) |
| --------- | ------------------------------------ | --------------------------------------- |
| Focus | 财富规模 + 经营负担 | 武力投资 + 门派关系 + 商武复合身份 |
| Entry spine | `magnate_on_ramp` | **New** `merchant_patron_bridge_entry` (distinct conditions) |
| Mid/late chain | Full magnate pressure → payoff → late-life → endgame | **Lightweight** payoff echo only (P93 pattern) |
| Coexistence | `coexistWith` in gate definition | Allowed; expression priority: magnate markers win |
| Ordinary bridge | P63 apprentice/tavern/peasant → magnate | **Out of scope** — P102 uses wealth+invest flags on merchant_house path |

---

## 6. Gap Inventory

| Gap | ID | P102 story |
| --- | -- | ---------- |
| No patron spine entry | GAP-P102-01 | P102-003 |
| No patron expression | GAP-P102-02 | P102-004 |
| No proof/tests | GAP-P102-03 | P102-005 |
| No scope contract | GAP-P102-04 | P102-002 |

---

## 7. Recommended P102 Hook (Minimal Spine)

1. **Entry** `merchant_patron_bridge_entry` (age 34–38): reads `route_wealth_committed`/`p22_wealth_route_forked` + `merchant_invest_*` → sets `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, variant marker
2. **Payoff echo** `merchant_patron_payoff_echo` (age 48–52): auto, reads `merchant_patron_on_ramp_done` → sets `merchant_patron_payoff_done`, `merchant_patron_identity_done`
3. **Expression**: patron branches in `merchantCurrentGoal` + one additional surface; magnate tiers retain priority

**No changes** to `magnate_on_ramp`, P97–P101 native/bridge magnate events, or ordinary-origin bridges.
