# Product Experience Governance — Golden Line Event Spine

**Stories:** US-005  
**Machine source:** `src/data/golden-line-spine.json`  
**Scope:** ages 0–30 only

---

## Summary

| Metric | Value |
| --- | ---: |
| Active spine events | 35 (35 active) |
| Manual choice events | 17 |
| Key choices | 9 |
| Max timeline anchor gap | 2 years |
| Later payoffs (key choices) | 9 / 9 (100%) |

---

## Readable Timeline (shared backbone)

| Age | Phase | Event ID | Type | Beat |
| ---: | --- | --- | --- | --- |
| 0 | Birth | `birth_wuxia_family` / `birth_with_phenomenon` | auto | 出生与初始禀赋（二选一） |
| 1 | Childhood | `origin_background` / `toddler_exploration` | choice / auto | 出身或童年探索 |
| 3 | Childhood | `clever_speech` | auto | 童年性格形成 |
| 4 | Childhood | `childhood_preference` | **choice** | 第一次成形抉择 |
| 6 | Childhood | `martial_arts_enlightenment` | **choice** | 武学启蒙方向 |
| 8 | Childhood | `childhood_summary` | auto | 童年阶段收束 |
| 10 | Childhood | `preteen_training` | auto | 少年根基（PXG2 桥接） |
| 12 | Childhood | `late_childhood_prep` | auto | 衔接少年期 |
| 13 | Youth | `youth_begins` | auto | 少年初长成 |
| 13–14 | Route entry | `sect_path_choice` | **choice** | 门派/流浪路线分岔 |

**Gap check (backbone):** 0→1→3→4→6→8→10→12→13 — 每步 ≤ 2 年。

---

## Route branches (ages 14–30)

### Orthodox / sect

| Age | Event ID | Type | Beat |
| ---: | --- | --- | --- |
| 14–16 | `orthodox_initiation` | auto | 师父清虚真人，首次下山 |
| 13–17 | `orthodox_trial_entry` | **choice** | 正道试炼（修心/修劲） |
| 13–17 | `orthodox_trial_service` | **choice** | 下山行善，路线冲突 |
| 13–18 | `orthodox_trial_completion` | auto | 路线承诺完成 |
| 14–17 | `sect_trial_entry` → `sect_trial_final` | **choice** | 门派入门试炼链 |
| 15 | `sect_trial` | **choice** | 门派年度试炼 |
| 15–17 | `training_focus` | **choice** | 修炼专精 |

### Wandering hero

| Age | Event ID | Type | Beat |
| ---: | --- | --- | --- |
| 16 | `jianghu_experience` | auto | 首次江湖历练 |
| 17 | `martial_improvement` | auto | 武艺巩固 |
| 19 | `continued_journey` | auto | 青年期游历 |
| 15+ | `love_first_meet` | **choice** | 情感/关系 beat |
| 20–30 | `hero_first_case` | **choice** | 早期侠义后果 |

### Demonic path

| Age | Event ID | Type | Beat |
| ---: | --- | --- | --- |
| 14–17 | `demonic_encounter` | **choice** | 幽影门入口 |
| 14–16 | `demonic_trial` | auto | 试炼开启 |
| 14–18 | `demonic_trial_shadow` | **choice** | 暗影试炼 |
| 14–18 | `demonic_trial_blood` | auto | 血影试炼 |
| 16–25 | `demonic_power_struggle` | **choice** | 门内权斗 |
| 17–30 | `demonic_usurpation` / `demonic_renounce_path` | choice / auto | 夺位或退隐 payoff |
| 18+ | `understand_unconventional_truth` | auto | 魔道认知后果 |
| 16–30 | `outlaw_cultivation` | **choice** | 身份线修炼 |

---

## Milestone coverage (US-005)

| Required beat | Spine anchor |
| --- | --- |
| Birth | `birth_*` |
| Childhood identity | `origin_background`, `childhood_preference` |
| First formative choice | `childhood_preference` |
| Route entry | `sect_path_choice`, `demonic_encounter` |
| Route conflict | `orthodox_trial_service`, `demonic_power_struggle` |
| Mentor / relationship | `orthodox_initiation` (master), `love_first_meet` |
| Early adulthood consequence | `hero_first_case`, `understand_unconventional_truth`, `continued_journey` |

---

## Active promotion

Spine event IDs are listed in `src/data/golden-line-spine.json`.  
`npm run report:event-asset-inventory` promotes them to `active` in `event-asset-manifest.json`.

Regenerate: `npm run report:event-asset-inventory`

---

*PXG2 — 2026-05-30*
