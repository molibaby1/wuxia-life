# P25 Lifetime Simulation Design Rules (US-002)

Wave 1 design rules for mainstream achievements, choice channels, and consequence consistency. Aligns with `docs/designs/p25-lifetime-simulation-north-star.md` and PRD §12 frozen decisions.

---

## 1. Achievement Tiers

| Tier | Wave | Player expectation | Unlock model |
| --- | --- | --- | --- |
| **Mainstream** | 1 | Clear pursuable life goals; mid-probability with reasonable play | Multi-factor composite (`WUXIA_COMPOSITE_DESTINY_OUTCOMES`); ≥3 dimension classes per outcome |
| **Pinnacle** | 2 | Life highlight + luck window; not grindable | Choice validity + rare line / low-probability window; both required |
| **Mixed** | 3 | Cross-track exploration reward | ≥2 identity tracks or resource/relationship dimensions; explicit coexist/mutex in config |

### Wave 1 frozen mainstream set (5)

1. `grandmaster_guardian` — martial + reputation + guardian oath  
2. `sect_leader_statesman` — martial + social + resources + alliance broker  
3. `lone_sword_legend` — peak martial + low social + rare master encounter  
4. `jianghu_renown_sage` — moderate martial + high reputation/social + mentor or ally bond  
5. `medical_sage_healer` — reputation + resources + medical line flags; non-martial axis; poison path mutex  

**Deferred:** `merchant_magnate` → implemented in Wave 3 mixed tier (`WUXIA_MIXED_DESTINY_OUTCOMES`).

### Wave 2 pinnacle set (2)

Separate config: `WUXIA_PINNACLE_DESTINY_OUTCOMES` in `wuxiaOriginSurfaces.ts` (not in mainstream array).

1. `jianghu_myth_legend` — 武林神话 — peak martial + reputation + `p16_guardian_oath` (choice) + `p16_rare_master_encounter` (luck); `grindCannotSubstituteLuck`
2. `founding_patriarch` — 开派祖师 — martial/social/resources + `p16_alliance_brokered` (choice) + `p16_scholar_mentor` (luck); `grindCannotSubstituteLuck`

**Pinnacle rules:**

- Both **choice** and **luck** gates required (`gateKind` on flag requirements); evaluator sets `unmetGates.choice` / `unmetGates.luck` in sim output.
- Stat axes at threshold **without** luck window → **LOCKED** (`grindCannotSubstituteLuck`).
- **Coexist:** pinnacle outcomes may unlock alongside mainstream (e.g. myth + grandmaster_guardian).
- **Mutex:** none frozen for Wave 2; mixed-tier mutex deferred to Wave 3.

### Wave 3 mixed set (3)

Separate config: `WUXIA_MIXED_DESTINY_OUTCOMES` in `wuxiaOriginSurfaces.ts` (not in mainstream/pinnacle arrays).

1. `merchant_magnate` — 巨贾行商 — wealth route (`p22_wealth_route_forked`) + merchant empire flags + resources/social; **mutex** `lone_sword_legend`; **coexist** `jianghu_renown_sage`, `sect_leader_statesman`
2. `healer_swordsman` — 医武双绝 — martial skill + medical line flags + reputation; **coexist** `grandmaster_guardian`, `medical_sage_healer`
3. `merchant_martial_patron` — 商武一体 — martial skill + resources + merchant invest + wealth route; **coexist** `merchant_magnate`, `grandmaster_guardian`

**Mixed rules:**

- Each outcome declares `crossTrackGroups` (≥2 tracks) with inspectable `unmetCrossTracks` in sim output.
- `coexistWith` / `mutexWith` explicit in config; evaluator applies `mutexWith` via `applyMutexToReports`.
- Stat axes alone **without** cross-track flags → **LOCKED**.

### Wave 4 ordinary set (3)

Separate entries in `WUXIA_ORIGIN_SURFACES` with `originTier: 'ordinary'` (not debuffed vivid origins).

1. `farm_peasant` — 普通农户 — labor/seasonal/family opportunity bias; rural rhythm
2. `town_apprentice` — 小镇学徒 — craft/apprenticeship/discipline bias; town trade rhythm
3. `tavern_hand` — 跑堂伙计 — service/rumor/social bias; tavern network rhythm

**Ordinary rules:**

- **Different opportunity structure**, not uniform stat debuffs of vivid origins (`originTier` + distinct `eventBiasTags` / `shapingTendencies`).
- Mid-tier mainstream or mixed achievements remain **reachable** (no hard origin lockout on composite evaluators).
- Pinnacle probability **lower** than vivid martial/scholar starts but **not forced to zero**.
- Infant chains + preschool tags + early-life choice config in `origin-infant-passives.json`, `preschool-passive-spine.json`, `ordinary-origin-early-life.json`.

### Tier requirements (mainstream)

- Each outcome exposes **inspectable partial progress** (dimension status in sim/gate output).
- **Single-axis stacking must not** unlock the highest mainstream tier without missing another critical dimension (existing P16 cases + new non-martial/social-led entries satisfy this).
- P16 three IDs and thresholds are **frozen**; Wave 1 adds traceability and consistency only.

---

## 2. Choice Channels & Minimum Feedback

### 2.1 Active choices (player-initiated)

Daily planning, route investment, relationship/resource allocation. Per P16 agency: weight rises with age.

**Minimum feedback layers (all three required on golden/spine priority paths):**

| Layer | Requirement |
| --- | --- |
| **Immediate narrative** | Non-vague outcome text describing what happened |
| **Visible impact** | Stat, relationship, route, or reputation change surfaced to player |
| **Future implication** | Durable flag or explicit long-term hint readable by later events/summary |

Reference: `docs/test-reports/product-experience-governance-choice-feedback-standard.md`, `src/data/golden-line-feedback-patterns.ts`.

### 2.2 Event-triggered choices (system-initiated)

Encounters, trials, faction/relationship forks on golden spine.

- Options must be **state-valid** (age, flags, resources).
- **Decline is a choice** — must set observable flags or stats, not silent noop.
- Same three-layer feedback standard applies.

### 2.3 Long-term state contract

Key spine choices must write flags listed in `golden-line-payoff-map.json` `durableWrites`, consumed by mid-life events or `deriveLifeMemorySummary`.

---

## 3. Consequence Consistency (North Star §4.3)

Forbidden patterns — validation must flag with event/flag/summary pointers:

| Defect | Definition | Example |
| --- | --- | --- |
| **Causal break** | Summary/narrative contradicts prior key choice | Killed master, endgame「尊师重道」 |
| **Ghost flag** | Condition references flag never set or cleared inconsistently | `mentor_bond` consumed, never written |
| **Window contradiction** | Mutually exclusive states active at summary |「独身」+ forced spouse line |
| **Missing feedback** | Key choice changes state with no player-facing explanation | Hidden stat-only delta on spine choice |
| **Invalid replay** | Same early sequence across origins with no thematic difference | Identical 0–10 spine with zero origin bias |

**Severity:** Critical = ghost flag blocking achievement or dead event chain; High = causal break on golden path; Medium = feedback-only.

---

## 4. Wave 1 Explicit Deferrals (Wave 2–4)

| Topic | Goal | Wave | Wave 1 stance |
| --- | --- | --- | --- |
| Pinnacle luck gates | 3 | 2 | `WUXIA_PINNACLE_DESTINY_OUTCOMES` (2 dual-gate outcomes) |
| Randomness / memorable accidents calibration | 3, 8 | 2 | Rare-line multiplier wiring (US-010) |
| Mixed achievements (`merchant_magnate`, etc.) | 4 | 3 | `WUXIA_MIXED_DESTINY_OUTCOMES` (3 cross-track outcomes) |
| Ordinary-origin expansion (≥3 pools) | 5 | 4 | `WUXIA_ORIGIN_SURFACES` +3 ordinary (`farm_peasant`, `town_apprentice`, `tavern_hand`) |
| Full-life pacing polish | 1, 8 | 5+ | Baseline + bounded rebalance only |
| UI theme / large frontend | — | Non-goal | No composite destiny UI panel |
| Scheduler / simulation core rewrite | — | Non-goal | Profile-first + reporting |

---

## 5. Configuration & Layer Order

Per `simulation-driven-optimization-workflow.md`:

1. **`tuning_config`** — weights, cooldowns, bounded pacing for reachability  
2. **`world profile` / content** — composite outcomes, line JSON, EventLoader imports  
3. **`runtime`** — only when config cannot express behavior (e.g. `maxValue` dimension, validation slice)

Wave 1 composite achievements live in `WUXIA_COMPOSITE_DESTINY_OUTCOMES` + necessary event flag wiring.

---

## 6. Simulation & Acceptance

- Baseline: fixed seeds, sample count, JSON under `docs/test-reports/p25-*-baseline-metrics.json`
- Metrics: mainstream unlock rates, path divergence proxy, high-severity contradiction count
- Gates: `gate:playability`, `gate:p20` must not regress after rebalance
- Closure maps each Ultimate North Star Goal to met / partial / missing with evidence paths
