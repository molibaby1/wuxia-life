# P42 Habit Content Coverage Gap Map

**Date:** 2026-06-25  
**Branch:** `codex/p42-wuxia-habit-trajectory-content-densification`  
**Story:** P42-001  
**Baseline:** P26–P29 habit/semi-personality wiring closure

Read-only inventory of `lifeStates.*` **gated** content samples (condition reads axis at threshold). Writers-only events excluded from reader counts.

**Age bands:** childhood 0–12 · youth 13–19 · early adult 20–34 · midlife 35–49 · later life 50+

---

## 1. Inventory By Axis

### trainingHabit (4 readers)

| Event ID | Age | Bands | Role | Pool |
| --- | --- | --- | --- | --- |
| `p22_early_martial_route_fork` | 16–22 | youth, early adult | route fork | p22 |
| `p21_martial_route_reinforcement` | 20–26 | early adult | reinforcement | p21 |
| `p26_training_habit_midlife_callback` | 26–34 | early adult | callback | p21 |
| `p27_mentor_obligation_consequence` | 30–38 | early adult, midlife | obligation | p21 |

### studyHabit (6 readers)

| Event ID | Age | Bands | Role | Pool |
| --- | --- | --- | --- | --- |
| `p27_study_habit_healer_reinforcement` | 18–28 | youth, early adult | reinforcement (medical) | medical |
| `p21_scholar_route_reinforcement` | 22–28 | early adult | reinforcement | p21 |
| `p26_study_habit_midlife_callback` | 24–32 | early adult | callback | p21 |
| `p21_study_echo_callback` | 25–30 | early adult | echo callback | p21 |
| `p29_study_habit_case_record_duty` | 26–34 | early adult | obligation (medical) | medical |
| `p27_renown_upkeep_pressure` | 32–40 | early adult, midlife | obligation | p21 |

### businessHabit (2 readers)

| Event ID | Age | Bands | Role | Pool |
| --- | --- | --- | --- | --- |
| `p22_early_wealth_route_fork` | 18–24 | youth, early adult | route fork | p22 |
| `p26_business_habit_obligation` | 34–44 | early adult, midlife | obligation | merchant |

### socialMomentum (4 readers)

| Event ID | Age | Bands | Role | Pool |
| --- | --- | --- | --- | --- |
| `p28_social_momentum_network_fork` | 24–30 | early adult | fork | relationship |
| `p29_social_momentum_healer_network` | 24–32 | early adult | opportunity (medical) | medical |
| `p28_social_reputation_reinforcement` | 26–34 | early adult | reinforcement | relationship |
| `p29_social_momentum_patron_obligation` | 36–46 | midlife | obligation | relationship |

### familyBond (3 readers + 5 writers)

**Readers**

| Event ID | Age | Bands | Role | Pool |
| --- | --- | --- | --- | --- |
| `p28_family_bond_sibling_support` | 28–42 | early adult, midlife | support | family-life |
| `p28_family_bond_elder_care` | 35–50 | midlife, later life | obligation | family-life |
| `p28_family_bond_caretaker_obligation` | 42–52 | midlife, later life | obligation | family-life |

**Writers only (no axis gate):** `family_child_born`, `family_crisis`, and three choice branches — accumulate `familyBond` but do not require it for eligibility.

---

## 2. Coverage Matrix (reader count per band)

| Axis | childhood | youth | early adult | midlife | later life | Total |
| --- | --- | --- | --- | --- | --- | --- |
| trainingHabit | 0 | 1 | 4 | 1 | 0 | 4 |
| studyHabit | 0 | 1 | 6 | 1 | 0 | 6 |
| businessHabit | 0 | 1 | 2 | 1 | 0 | 2 |
| socialMomentum | 0 | 0 | 3 | 1 | 0 | 4 |
| familyBond | 0 | 0 | 1 | 3 | 2 | 3 |

---

## 3. Sparse Bands & Single-Sample Dependency Risks

| Risk | Detail | P42 target story |
| --- | --- | --- |
| **R1 — childhood void** | All five axes have **zero** gated readers ages 0–12; daily hooks accumulate but no narrative echo | P42-002 (study), defer training childhood to youth band |
| **R2 — later-life void** | training / study / business / social have **zero** readers at 50+; familyBond has 2 | P42-002–004 |
| **R3 — businessHabit thin** | Only 2 samples total; midlife relies on single obligation (`p26_business_habit_obligation`) | P42-003 |
| **R4 — socialMomentum youth gap** | No readers 13–19 despite daily social hooks from teen age | P42-003 |
| **R5 — trainingHabit route skew** | 2/4 samples are route forks/reinforcement; non-route shaping echo sparse outside midlife callback | P42-002 |
| **R6 — familyBond obligation skew** | 2/3 readers are obligation-heavy; positive/restorative echo missing | P42-004 |
| **R7 — archetype sameness** | Same axis gates produce similar copy regardless of martial vs scholar vs merchant life type | P42-005 |

---

## 4. Recommended Densification Targets (execution order)

| Priority | Axis | Target bands | Min new samples |
| --- | --- | --- | --- |
| 1 | trainingHabit + studyHabit | youth, later life | 2 each |
| 2 | businessHabit + socialMomentum | youth, midlife, later life | 2 each |
| 3 | familyBond | midlife restorative + later identity/money | 2 |
| 4 | trainingHabit + studyHabit | archetype clusters (martial vs scholar; scholar vs merchant) | revise/add pairs |

---

## 5. Verification

Generated via read-only scan:

```bash
npm exec -- tsx -e "
import { EventLoader } from './src/core/EventLoader.ts';
// ... axis + age-band classifier (P42 audit script)
"
```

No gameplay files modified in this story.
