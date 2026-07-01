# P69 Next-Route Candidate Inventory

> **Date:** 2026-06-29
> **Stage:** P69 Wuxia Next Route Candidate Reconciliation
> **Story:** P69-001 — Audit Candidate Route Inventory
> **Purpose:** Inventory all plausible next-route candidates grounded in the current repo so P69 compares real options, not imaginary future routes.

---

## 1. Overview

This inventory catalogues the candidate routes that could serve as the **next replication target** for the merchant trilogy optimization methodology (bridges → entry → flavor → cost → shape+recap).

Selection criteria for inclusion:
1. The route / outcome already exists in repo code and config
2. There is at least a plausible bridge path from an ordinary origin
3. The route represents a meaningful replication target (not a trivial one-off)

---

## 2. Candidate A: `jianghu_renown_sage` (江湖名宿)

### 2.1 Basic Profile

| Field | Value |
|-------|-------|
| **Outcome ID** | `jianghu_renown_sage` |
| **Outcome label** | 江湖名宿 |
| **Tier** | mainstream (mid-tier) |
| **Outcome type** | Single-track mainstream (martial + reputation + social) |
| **Cross-track groups** | 1 (martial track primary) |
| **Gate location** | `wuxiaOriginSurfaces.ts` — composite destiny evaluation |

### 2.2 Gate Requirements

Requires ALL:
1. `skill_growth >= 45`
2. `reputation >= 65`
3. `social_capital >= 55`
4. `key_choices`: any of `['mentor_bond', 'ally_network']`

### 2.3 Linked Origins

| Origin | Bridge Status | Bridge Mechanism | Evidence Source |
|--------|--------------|------------------|-----------------|
| `tavern_hand` | **Existing baseline** | `ally_network` flag from childhood network fork | P25 ordinary wiring evidence; `ordinarySimulationBaselines.ts` fixture `ordinary_tavern_renown_path` |
| `farm_peasant` | **Theoretical only** | `mentor_bond` path fixtures mentioned in P25 but no concrete bridge seed | P25 ordinary wiring evidence (mention only); P60 farm-peasant gap audit (confirms theoretical only) |
| `town_apprentice` | **No wiring** | No documented path | — |

### 2.4 Existing Evidence Surfaces

| Evidence Type | Status | Details |
|---------------|--------|---------|
| **Wiring evidence** | ✅ Strong | P25 Wave 1 ordinary wiring explicitly maps tavern_hand → jianghu_renown_sage via ally_network |
| **Short-chain proof** | ✅ Complete | P32-003 renown short-chain slice: event-driven unlock via `p28_social_reputation_reinforcement` → `ally_network` → composite eval |
| **Runtime parity** | ✅ Verified | P32 runtime parity tests cover renown bridge at threshold |
| **Lifetime trace** | ⚠️ Partial | P34 birth-to-death e2e covers the habit-led sim baseline but not from ordinary origins |
| **Closure reports** | ✅ Multiple | P30, P31, P32, P34 closures all include renown path coverage |
| **Playable bridge** | ❌ No ordinary-origin playable bridge | Existing evidence is from habit-led sim and P25 baseline fixtures; no "apprentice→merchant" style playable bridge for any ordinary origin |

### 2.5 What Makes It Plausible

1. **Strong wiring foundation** — tavern_hand → renown via ally_network is already documented and fixture-verified in P25
2. **Short-chain precedent** — P32 proves the event-driven composite eval pattern works for renown
3. **Multiple ordinary origins could feed it** — tavern_hand (ally_network), farm_peasant (mentor_bond), potentially apprentice (mentor_bond)
4. **Mainstream tier is under-explored** — merchant trilogy focused on mixed tier; mainstream tier replication tests methodology generality

### 2.6 What's Missing

1. **No playable bridge from any ordinary origin** — existing wiring is fixture-level, not event-driven playable
2. **No sample-line spine** — renown has no equivalent of the P55 merchant magnate spine (on_ramp → pressure → payoff)
3. **No existing differentiation layers** — no entry differentiation, cost differentiation, or success-shape work for renown path
4. **Single-track outcome** — mainstream tier with one primary track; may have less differentiation surface area than mixed

---

## 3. Candidate B: `merchant_martial_patron` (商武一体)

### 3.1 Basic Profile

| Field | Value |
|-------|-------|
| **Outcome ID** | `merchant_martial_patron` |
| **Outcome label** | 商武一体 |
| **Tier** | mixed (mid-tier composite) |
| **Outcome type** | Dual-track mixed (merchant track + martial track) |
| **Cross-track groups** | 2 (merchant_track + martial_track) |
| **Gate location** | `wuxiaOriginSurfaces.ts` — composite destiny evaluation |

### 3.2 Gate Requirements

Requires ALL:
1. `skill_growth >= 50`
2. `resources >= 50`
3. `key_choices`: any of `['merchant_invest_good', 'merchant_invest_both', 'merchant_invest_evil']`
4. `key_choices`: any of `['route_wealth_committed', 'p22_wealth_route_forked']`

### 3.3 Linked Origins

| Origin | Bridge Status | Bridge Mechanism | Evidence Source |
|--------|--------------|------------------|-----------------|
| `merchant_house` | **Existing trace** | `route_wealth_committed` + `merchant_invest_good` | P37 mixed merchant-patron lifetime trace |
| `town_apprentice` | **Theoretical only** | Apprentice has merchant route but no martial seed; no existing bridge to patron | P58 apprentice bridge targets `merchant_magnate`, not `merchant_martial_patron` |
| `tavern_hand` | **No wiring** | No merchant+martial dual seed for tavern | — |
| `farm_peasant` | **No wiring** | No merchant+martial dual seed for peasant | — |

### 3.4 Existing Evidence Surfaces

| Evidence Type | Status | Details |
|---------------|--------|---------|
| **Mixed identity proof** | ✅ Complete | P25 mixed identity slice: PASS — merchant_martial_patron composite identity verified |
| **Lifetime trace** | ✅ Single trace | P37 merchant-patron lifetime trace from merchant_house origin (0→68 age) |
| **Additional mixed pinnacle traces** | ✅ Baseline | P35/P36/P37 wave 2 mixed pinnacle baseline metrics include merchant_martial_patron |
| **Closure reports** | ✅ Multiple | P35, P36, P37 closures cover mixed pinnacle traces |
| **Sample-line spine** | ❌ None | No sample-line spine events for merchant_martial_patron |
| **Ordinary-origin bridge** | ❌ None | No ordinary origin has a bridge into merchant_martial_patron |
| **Playable bridge** | ❌ None | No "cross the bridge" event chain from any ordinary origin |

### 3.5 What Makes It Plausible

1. **Mixed tier matches merchant trilogy type** — merchant_magnate (the trilogy target) is mixed tier; merchant_martial_patron is also mixed
2. **Dual-track = more differentiation surface area** — merchant + martial tracks mean more room for cost/shape differentiation
3. **Merchant track is already proven** — the trilogy methodology was proven on merchant_magnate; merchant_martial_patron shares the merchant track
4. **P60 farm-peasant audit contemplated similar direction** — the "labor → escort → jianghu renown" direction has adjacent logic

### 3.6 What's Missing

1. **No ordinary-origin bridge at all** — the only trace is from merchant_house (vivid tier), not from any ordinary origin
2. **Dual seed requirement = higher bridge cost** — need both merchant route AND martial seed, which is harder than single-track
3. **No sample-line spine** — no P55-style on_ramp/pressure/payoff spine to plug into
4. **Martial track from ordinary is weak** — ordinary origins have very limited martial growth paths compared to vivid origins
5. **No existing differentiation work** — zero entry/cost/shape differentiation, unlike merchant_magnate which already had P55 expansion before the trilogy

---

## 4. Other Candidates Considered But Excluded

| Candidate | Exclusion Reason |
|-----------|-----------------|
| `merchant_magnate` (巨贾行商) | Already fully optimized in merchant trilogy (P58–P67); not a "next" route |
| `healer_swordsman` (医剑双绝) | Medical track has even less ordinary-origin wiring than martial; P32-006 skipped medical short-chain |
| `demonic_path` (魔道巨擘) | No ordinary-origin bridge evidence at all; wrong tier trajectory |
| `orthodox_leader` (正道魁首) | No ordinary-origin bridge evidence at all; wrong tier trajectory |

---

## 5. Inventory Summary Matrix

| Dimension | `jianghu_renown_sage` | `merchant_martial_patron` |
|-----------|----------------------|--------------------------|
| **Tier** | mainstream | mixed |
| **Outcome type** | Single-track mainstream | Dual-track mixed |
| **Ordinary-origin wiring** | ✅ tavern_hand baseline (fixture) | ❌ None (only merchant_house) |
| **Short-chain proof** | ✅ P32 renown slice | ❌ No short-chain proof |
| **Lifetime trace** | ⚠️ Partial (habit-led) | ✅ Single (merchant_house) |
| **Sample-line spine** | ❌ None | ❌ None |
| **Playable bridge** | ❌ None | ❌ None |
| **Differentiation surface** | Medium (single track) | High (dual track) |
| **Bridge implementation cost** | Lower (single seed needed) | Higher (dual seed needed) |
| **Methodology transfer fit** | Medium (different tier type) | High (same tier type, same merchant track) |

---

## 6. Key Takeaway

Both candidates are plausible but have different strength profiles:

- **`jianghu_renown_sage`** is stronger in **foundation evidence** (P25 wiring + P32 short-chain + tavern_hand baseline) but weaker in **methodology fit** (mainstream vs mixed, single-track vs dual-track).

- **`merchant_martial_patron`** is stronger in **methodology type match** (mixed tier, dual-track, shares merchant track) but weaker in **ordinary-origin evidence** (zero ordinary-origin bridge, only vivid-tier trace).

The remaining stories (P69-003 through P69-006) will compare them across evidence strength, methodology fit, and implementation risk to select one or declare no-go.

---

**P69-001 complete.** Candidate inventory saved.
