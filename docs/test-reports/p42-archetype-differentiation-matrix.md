# P42 Archetype Differentiation Matrix

**Date:** 2026-06-25  
**Branch:** `codex/p42-wuxia-habit-trajectory-content-densification`  
**Story:** P42-005

Documents before/after differentiation for two axes across two archetype clusters each. Differences are visible in narrative framing and consequence shape (stats/flags), not hidden gates alone.

---

## 1. Selected Axes & Clusters

| Axis | Cluster A | Cluster B |
| --- | --- | --- |
| `trainingHabit` | Martial ascendant (门派/武家) | Scholar statesman (文士/养生) |
| `studyHabit` | Scholar statesman (书院/仕林) | Wealth merchant (账簿/营生) |

---

## 2. trainingHabit — Before vs After

### Before (P26 baseline)

| Event | Framing | Consequence shape |
| --- | --- | --- |
| `p26_training_habit_midlife_callback` | Generic「苦练成势」 | +martialPower, +reputation |
| `p27_mentor_obligation_consequence` | Generic「授徒之责」 | reputation vs martialPower tradeoff |

**Gap:** Same `trainingHabit >= 3` gate produced similar martial-facing copy regardless of scholar vs martial life type.

### After (P42)

| Event | Cluster | Age | Visible framing | Consequence shape |
| --- | --- | --- | --- | --- |
| `p42_training_habit_martial_clan_echo` | Martial | 32–40 | 门墙试锋、代表师门出战 | +martialPower/+reputation (high) |
| `p42_training_habit_scholar_body_echo` | Scholar | 30–38 | 养生拳意、读书人不伤身 | +constitution, +knowledge (auto) |

**Differentiation proof:** Martial path rewards combat reputation; scholar path rewards constitution/knowledge with no sect trial framing.

---

## 3. studyHabit — Before vs After

### Before (P26–P29 baseline)

| Event | Framing | Consequence shape |
| --- | --- | --- |
| `p26_study_habit_midlife_callback` | Generic「旧卷回声」 | +knowledge, +reputation |
| `p27_study_habit_healer_reinforcement` | Medical crossover | healer path flags |
| `p27_renown_upkeep_pressure` | Generic清名义务 | reputation maintenance |

**Gap:** Scholar and merchant lives both saw「读书」echo through academic/medical frames; no merchant ledger framing.

### After (P42)

| Event | Cluster | Age | Visible framing | Consequence shape |
| --- | --- | --- | --- | --- |
| `p42_study_habit_scholar_academy_echo` | Scholar | 28–36 | 书院问难、以文义服人 | +knowledge/+reputation |
| `p42_study_habit_merchant_ledger_echo` | Merchant | 26–34 | 账理精通、梳理货单 | +businessAcumen/+money |

**Differentiation proof:** Scholar echo builds reputation/knowledge; merchant echo builds businessAcumen/money with no academy/debate copy.

---

## 4. Regression Coverage

```bash
npm exec tsx tests/personalityHabitTrajectoryTests.ts  # testP42ArchetypeDifferentiation
npm exec tsx tests/p42ContentDensityTests.ts
```

---

## 5. Remaining Thin Areas

- Archetype differentiation not yet applied to `businessHabit`, `socialMomentum`, or `familyBond` (deferred to P43+)
- Childhood band still lacks archetype-specific readers for training/study
