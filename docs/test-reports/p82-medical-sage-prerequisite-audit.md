# P82 Medical Sage Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P82 Wuxia Medical Sage Bridge Design-First Contract
> **Story:** P82-001 — Audit Medical Route Prerequisites
> **Target Route:** `medical_sage_healer` (一代名医)
> **Purpose:** Audit existing medical_sage_healer assets — origins, flags, gates, expressions, tests, events — so P82 starts from real gating surfaces rather than assumptions.

---

## 1. Executive Summary

`medical_sage_healer` is a mainstream-tier composite destiny outcome with a strong evidence foundation from P27/P29 habit-led medical events and P33/P34 short-chain/lifetime validation. The route has:

- **One verified habit-led on-ramp:** studyHabit → `p27_study_habit_healer_reinforcement` → `p29_study_habit_case_record_duty` → composite eval
- **One verified social-momentum on-ramp:** socialMomentum → `p29_social_momentum_healer_network` (sets medical_talent only — partial on-ramp, not full bridge
- **Two verified event-driven unlock proofs:** P33 short-chain (poor_family origin) and P34 birth-to-death lifetime (poor_family origin)
- **A working composite gate:** `wuxiaOriginSurfaces.ts` — requires reputation≥55, resources≥30, and 2 key_choice dimensions
- **Existing medical event pool:** 20+ events in `medical.json` covering talent discovery → apprentice → herb gathering → clinic practice → plague → poison → divine doctor fame → imperial doctor → endings
- **Existing habit-led sim framework:** P27 study-healer + P29 study-case-duty + P29 social-healer-network

**Core gap:** `medical_sage_healer` has no **playable bridge** from any ordinary origin (tavern_hand / farm_peasant / town_apprentice). The medical flags come from habit-led sim events or vivid-origin event pools, not from an ordinary-origin midlife "cross the bridge" event chain. There's also no sample-line spine for medical (no equivalent of the P55 merchant magnate on_ramp → pressure → payoff sequence). There is zero medical expression in `ordinaryOriginExpression.ts`.

---

## 2. Gate Truth Surface

### 2.1 Composite Gate Definition

**Source:** `src/narrative/profile/wuxiaOriginSurfaces.ts`

| Field | Value |
|-------|-------|
| **Outcome ID** | `medical_sage_healer` |
| **Label** | 一代名医 |
| **Tier** | mainstream (mid-tier) |
| **Require all?** | Yes |

**Requirements (all must be met):

| Dimension | Threshold | Type |
|-----------|-----------|------|
| `reputation` | ≥ 55 | stat |
| `resources` | ≥ 30 | stat |
| `key_choices` (dim 1) | any of `['medical_divine_doctor_fame', 'medical_imperial']` | flag |
| `key_choices` (dim 2) | any of `['medical_plague_hero', 'medical_pure']` — blocked by `medical_poison_path` | flag |

### 2.2 Coexistence / Mutex

- **Coexists with:** `grandmaster_guardian`, `healer_swordsman`
- **Mutex with:** none explicit in config (but `medical_poison_path` blocks key_choices dim 2)

---

## 3. Achievement Traceability

**Source:** `src/p25/achievementTraceability.ts`

```
medical_sage_healer: {
  choiceFlags: ['medical_divine_doctor_fame', 'medical_imperial', 'medical_plague_hero', 'medical_pure'],
  midLifeConsequenceSurfaces: ['medical_divine_doctor_fame', 'medical_imperial_doctor', 'medical_palace_intrigue'],
  habitLedOnRampEvents: [
    'p27_study_habit_healer_reinforcement',
    'p29_study_habit_case_record_duty',
    'p29_social_momentum_healer_network',
  ],
}
```

---

## 4. Medical Event Pool Inventory

**Source:** `src/data/lines/medical.json` — 21 events total

### 4.1 Early-Life Talent Discovery (Age 8-22)

| Event ID | Age | Type | Key Flags Set | Bridge Relevance |
|----------|-----|------|--------------|------------------|
| `medical_talent_discovery` | 8-16 | choice | `medical_talent` | Initial talent seed — comprehension+chivalry gate |
| `medical_master_apprentice` | 15-20 | choice | `medical_apprentice` / `medical_self_taught` | Apprenticeship path |
| `medical_herb_gathering` | 16-22 | auto | `medical_herb_master` | Skill progression |

### 4.2 Habit-Led On-Ramp Events (P27/P29, Age 18-34)

| Event ID | Age | Habit Trigger | Key Flags Set | Bridge Relevance |
|----------|-----|---------------|--------------|------------------|
| `p27_study_habit_healer_reinforcement` | 18-28 | studyHabit ≥ 2 | `p27_study_healer_path`, `medical_pure`, `medical_talent` | **Primary on-ramp** — study habit → healer path |
| `p29_study_habit_case_record_duty` | 26-34 | studyHabit ≥ 3 + p27_study_healer_path | `p29_study_healer_case_duty`, `medical_divine_doctor_fame`, `medical_talent` | **Primary bridge** — sets key_choice flag for gate |
| `p29_social_momentum_healer_network` | 24-32 | socialMomentum ≥ 2 | `p29_social_healer_network`, `medical_talent` | Secondary on-ramp — social momentum → healer network |

### 4.3 Mid-Life Progression Events (Age 18-48)

| Event ID | Age | Type | Key Flags Set | Notes |
|----------|-----|------|--------------|-------|
| `medical_clinic_practice` | 18-25 | auto | (stats only) | Builds reputation/chivalry |
| `medical_plague_outbreak` | 20-30 | choice | `medical_plague_hero` | Key choice flag (high comprehension gate |
| `medical_poison_temptation` | 22-32 | choice | `medical_pure` / `medical_poison_path` | Moral fork — poison blocks pure path |
| `medical_dual_cultivation` | 24-35 | auto | (stats only) | Poison path progression |
| `medical_divine_doctor_fame` | 26-38 | auto | `medical_divine_doctor_fame` | Key choice flag — auto after plague_hero or pure |
| `medical_imperial_doctor` | 28-42 | choice | `medical_imperial` / `medical_folk_doctor` | Key choice flag — imperial vs folk |
| `medical_palace_intrigue` | 30-45 | choice | (stats only) | Imperial path consequence |
| `medical_medical_book` | 32-48 | auto | `medical_book_author` | Legacy — book writing |
| `medical_poison_king` | 30-50 | auto | (stats only) | Poison path pinnacle |

### 4.4 Endings (Age 70-80)

| Event ID | Ending Type | Condition |
|----------|-------------|-----------|
| `medical_ending_divine_doctor` | `medical_divine_doctor` | medical_book_author + chivalry≥80 + reputation≥100 |
| `medical_ending_poison_king` | `medical_poison_king` | medical_poison_path + martialPower≥150 |
| `medical_ending_imperial_doctor` | `medical_imperial` | medical_imperial |
| `medical_ending_folk_doctor` | `medical_folk` | medical_folk_doctor |
| `medical_ending_hermit` | `medical_hermit` | medical_apprentice + !medical_book_author |

---

## 5. Flag Propagation Chain

### 5.1 Study-Habit Path (Primary, Verified)

```
studyHabit ≥ 2 (age 18-28)
  → p27_study_habit_healer_reinforcement (choice: 顺势钻研医理)
    → medical_pure ✅ (key_choice dim 2)
    → medical_talent
    → p27_study_healer_path

studyHabit ≥ 3 + p27_study_healer_path (age 26-34)
  → p29_study_habit_case_record_duty (choice: 接下汇辑之责)
    → medical_divine_doctor_fame ✅ (key_choice dim 1)
    → medical_talent
    → p29_study_healer_case_duty

Composite gate evaluation
  → medical_sage_healer unlocked ✅
```

### 5.2 Social-Momentum Path (Partial, Not Full Bridge)

```
socialMomentum ≥ 2 (age 24-32)
  → p29_social_momentum_healer_network (choice: 开设驻点，广接病患)
    → medical_talent
    → p29_social_healer_network
    → reputation +10, chivalry +6

⚠️ **Gap:** This path sets medical_talent and builds reputation but does NOT set any key_choice flags that satisfies the gate alone. It needs additional events (medical_clinic_practice, medical_poison_temptation → medical_pure, medical_divine_doctor_fame auto) to complete the bridge.

### 5.3 Traditional Talent→Apprentice Path (Legacy, Not Habit-Led)

```
medical_talent_discovery (age 8-16)
  → medical_talent
  → medical_master_apprentice (age 15-20)
    → medical_apprentice or medical_self_taught
    → medical_herb_gathering (auto)
      → medical_herb_master
      → medical_clinic_practice (auto)
        → reputation +12, chivalry +8
        → medical_plague_outbreak (choice)
          → medical_plague_hero ✅ (key_choice dim 2)
          → medical_divine_doctor_fame (auto) ✅ (key_choice dim 1)
          → medical_imperial_doctor (choice)
            → medical_imperial ✅ (key_choice dim 1 alt)
```

This is the original medical.json event chain but it relies on early talent_discovery which is NOT habit-led and has no ordinary-origin seeding.

---

## 6. Ordinary-Origin Inventory

### 6.1 Tavern Hand

**Origin ID:** `tavern_hand`

#### 6.1.1 Early-Life Flag Chain

**Source:** `ordinary-origin-early-life.json`

| Choice Path | Flags Set | Medical Relevance |
|------------|-----------|------------------|
| 学跑堂 (master_service) | `tavern_service_committed`, `ordinary_tavern_midlife_seed` | None — service path |
| 记客人 (track_guests) | `tavern_guest_network`, `ally_network` | None — network path |

**Key insight:** Zero medical-related flags or medical seed in tavern_hand early-life. No medical talent discovery, no healer inclination.

#### 6.1.2 Midlife Events

**Source:** `ordinary-origin-midlife.json`

| Event ID | Age | Condition | Medical Relevance |
|----------|-----|-----------|-------------------|
| `ordinary_tavern_midlife_guest_regulars` | 25 | `tavern_guest_network && !ordinary_tavern_midlife_done | None |
| `ordinary_tavern_midlife_ally_referral` | 27 | `ally_network && !ordinary_tavern_midlife_done | Merchant bridge only |

**Key insight:** Zero medical midlife events for tavern_hand. No bridge to medical_sage_healer.

### 6.2 Farm Peasant

**Origin ID:** `farm_peasant`

- No medical seed or events in early-life or midlife
- No documented path to medical_sage_healer

### 6.3 Town Apprentice

**Origin ID:** `town_apprentice`

- No medical seed or events in early-life or midlife
- No documented path to medical_sage_healer

---

## 7. Existing Expression Surfaces

### 7.1 Ordinary Origin Expression

**Source:** `src/p56/ordinaryOriginExpression.ts`

**Medical-related branches: **Zero.** None of the three ordinary origins have any medical-specific expression text (currentGoal, lifeMemory, summary). All medical expression is entirely in the generic medical event pool.

### 7.2 Sample Line Expression

**Source:** `src/p50/sampleLineExpression.ts`

**Medical-related:** None. Sample line expression is sect-focused only (orthodox/demonic/merchant/renown only. No medical sample line exists.

---

## 8. Existing Tests and Proofs

### 8.1 P33 Medical Short-Chain Proof

**Source:** `tests/p33RuntimeParityTests.ts` + `docs/test-reports/p33-medical-short-chain-slice.md`

**What it proves:**
- `p27_study_habit_healer_reinforcement` → `medical_pure`
- `p29_study_habit_case_record_duty` → `medical_divine_doctor_fame`
- With stats at threshold → medical_sage_healer unlocks
- Uses event-driven JSON flag_set path, not static resolver
- Origin: `poor_family` (vivid tier, not ordinary)

**Limitations:**
- Origin is poor_family (vivid), not any ordinary origin
- It's a habit-led sim slice, not a playable event chain from birth
- No midlife bridge event — flags come from habit events

### 8.2 P34 Birth-to-Death Lifetime Proof

**Source:** `tests/p34LifetimeParityTests.ts` + `docs/test-reports/p34-medical-lifetime-birth-to-death-slice.md`

**What it proves:**
- Full birth-to-death lifetime sim with medical_sage_healer unlock
- Habit-zero on-ramp: studyHabit builds from 0 through comprehension events
- Event sequence: p27 → p29 → composite eval at age 72
- Origin: `poor_family` (vivid tier, not ordinary)

**Limitations:**
- Origin is poor_family (vivid), not ordinary
- No ordinary-origin midlife bridge
- No sample-line spine

### 8.3 Ordinary Baseline Fixtures

**Source:** `src/p25/ordinarySimulationBaselines.ts`

**Medical fixtures:**
- `ordinary_tavern_renown_path` — renown, not medical
- `ordinary_apprentice_merchant_path` — merchant, not medical
- `ordinary_peasant_renown_path` — renown, not medical

**Medical-specific ordinary fixture: **None.** No ordinary-origin medical path baseline fixture.

---

## 9. What Exists vs What's Missing

### 9.1 What Already Exists (Before Bridge)

| Category | Status | Details |
|----------|--------|---------|
| **Composite gate** | ✅ Complete | `medical_sage_healer` in `wuxiaOriginSurfaces.ts` with 4 requirements |
| **Key-choice flags (medical_pure)** | ✅ Exists | Set from p27 study-healer + poison_temptation decline |
| **Key-choice flags (medical_divine_doctor_fame)** | ✅ Exists | Set from p29 study-case-duty + auto after plague_hero/pure |
| **Key-choice flags (medical_plague_hero)** | ✅ Exists | Set from plague_outbreak choice |
| **Key-choice flags (medical_imperial)** | ✅ Exists | Set from imperial_doctor choice |
| **Medical event pool (21 events)** | ✅ Complete | `medical.json` — talent → apprentice → clinic → plague → fame → imperial → endings |
| **Habit-led on-ramp (study path)** | ✅ Verified | p27 + p29 study-healer chain, P33/P34 validated |
| **Habit-led on-ramp (social path)** | ⚠️ Partial | p29 social-healer-network sets medical_talent only — not full bridge |
| **Achievement traceability** | ✅ Complete | `achievementTraceability.ts` has 3 habit-led on-ramps |
| **Short-chain proof (P33)** | ✅ Exists | Event-driven unlock from habit-led sim |
| **Lifetime proof (P34)** | ✅ Exists | Birth-to-death habit-led lifetime sim |
| **P25 ordinary baseline fixtures | ❌ Missing | No medical path ordinary baseline fixture |

### 9.2 What's Missing (For a Playable Bridge from Ordinary Origin)

| Category | Status | Gap Description |
|----------|--------|-----------------|
| **Playable bridge event (ordinary origin)** | ❌ Missing | No midlife "cross into medical healer" event for any ordinary origin |
| **Bridge commitment flag** | ❌ Missing | No `tavern_medical_bridge_crossed equivalent |
| **Route committed flag** | ❌ Missing | No `route_medical_committed` equivalent |
| **Medical expression (ordinary)** | ❌ Missing | No post-bridge identity text for any ordinary origin path |
| **Sample-line spine** | ❌ Missing | No on_ramp → pressure → payoff sequence for medical |
| **Post-bridge progression** | ❌ Missing | No content after the bridge — just gate unlock |
| **Origin differentiation** | ❌ Missing | No tavern_hand-flavored entry into medical path |
| **Ordinary baseline fixture** | ❌ Missing | No ordinary_*_medical_path fixture |
| **Ordinary-origin expression** | ❌ Missing | Zero medical branches in ordinaryOriginExpression.ts |

---

## 10. Bridge Distance Assessment

How far is `medical_sage_healer` from a playable bridge from `tavern_hand` (the strongest ordinary origin candidate)?

| Step | Status | Effort |
|------|--------|--------|
| 1. Add bridge-crossing midlife event | ❌ Not started | Small — 1 new event with 2 choices (accept / decline) |
| 2. Add bridge flags | ❌ Not started | Tiny — 2 new flags |
| 3. Add expression branches | ❌ Not started | Small — 3 surfaces × medical bridge branch |
| 4. Add sample-line spine (post-bridge) | ❌ Not started | Medium — 3 spine events (on_ramp / pressure / payoff) |
| 5. Add tests | ❌ Not started | Small-medium — targeted proof + regression tests |

**Overall bridge distance:** **Close** — the gate and habit-led on-ramps both exist and are verified. The gap is an ordinary-origin midlife bridge event + post-bridge spine + expression. This is comparable to where renown was at P70.

---

## 11. Audit Conclusion

`medical_sage_healer` has a **strong foundation** for a playable bridge from ordinary origins:

1. The composite gate is complete and verified
2. Two key-choice flags (medical_pure + medical_divine_doctor_fame) already have habit-led paths
3. The short-chain proof pattern is validated (P33)
4. The birth-to-death lifetime pattern is validated (P34)
5. The medical event pool is substantial (21 events)
6. The achievement traceability is documented

The gap is **not feasibility** — it's **playability from ordinary origins**. The route is reachable in habit-led sim from vivid origins, but there's no event-driven "cross the bridge" narrative from any ordinary origin, and no post-bridge progression content in sample-line style.

This makes `medical_sage_healer` an excellent candidate for the renown methodology replication:
- Single-seed bridge potential (simple, low risk)
- Strong existing foundation (verified habit-led on-ramps)
- Clear gap (playable bridge + spine, not "does this even work?")
- Tests methodology generality (non-martial single-axis mainstream)

---

**P82-001 complete.** Prerequisite audit saved.
