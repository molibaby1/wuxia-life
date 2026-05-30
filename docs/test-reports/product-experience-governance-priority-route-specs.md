# Product Experience Governance — Priority Route Specs (0–30)

**Stories:** US-010 (orthodox/sect), US-011 (wandering hero), US-012 (demonic path)  
**Spine reference:** `src/data/golden-line-spine.json`, `src/data/golden-line-payoff-map.json`  
**Lifecycle reference:** `docs/test-reports/product-experience-governance-route-lifecycle.md`

---

## Shared backbone (all routes)

| Age | Event | Role |
| ---: | --- | --- |
| 0–12 | `birth_*` → `childhood_preference` → `martial_arts_enlightenment` | Identity formation (shared) |
| 13 | `sect_path_choice` | **Route fork** — orthodox vs wanderer entry |
| 14–17 | Route-specific entry events | First route commitment window |
| 16–20 | Conflict / relationship / trial beats | Route-specific |
| 20–30 | Early adulthood consequence | Payoff anchor |

---

## Route 1 — Orthodox / Sect (US-010)

**routeId:** `sect` · **flag:** `route_orthodox` · **assets:** `sect-wudang.json`, `sect-shaolin.json`, `training.json`

### Age 0–30 beats

| Age | Phase | Event | Beat |
| ---: | --- | --- | --- |
| 13 | Start | `sect_path_choice` → `join_orthodox` | 选择拜入正道 |
| 14–16 | Start | `orthodox_initiation` | 师父清虚真人，首次下山 |
| 13–17 | Commitment | `orthodox_trial_entry` | 修心/修劲试炼分岔 |
| 13–17 | Conflict | `orthodox_trial_service` | 下山行善，侠义 vs 谋略 |
| 14–17 | Commitment | `sect_trial_entry` → `sect_trial_final` | 门派入门试炼链 |
| 15 | Commitment | `sect_trial` | 年度门派试炼 |
| 15–17 | Growth | `training_focus` | 修炼专精 |
| 13–18 | Completion | `orthodox_trial_completion` | 正道 early arc 收束 |

### Key choices (≥3)

| # | Event | Choice IDs | Durable writes |
| --- | --- | --- | --- |
| 1 | `sect_path_choice` | `join_orthodox` | `route_orthodox`, `orthodox_trial_active` |
| 2 | `orthodox_trial_entry` | `orthodox_trial_mind`, `orthodox_trial_force`, delays/fails | `orthodox_trial_*_done/failed` |
| 3 | `orthodox_trial_service` | `service_aid`, `service_injury`, `service_meditate` | `orthodox_trial_service_done`, `orthodox_trial_exceeded` |
| 4 | `sect_trial_final` | `trial_final_success`, `trial_final_delay` | `sect_trial_completed` |

### Payoffs (≥2)

| Key choice | Payoff event | Mechanism |
| --- | --- | --- |
| `orthodox_trial_entry` | `orthodox_trial_service` | Requires mind/force done |
| `orthodox_trial_service` | `orthodox_trial_completion` | Requires `orthodox_trial_service_done` |
| `sect_trial_final` | `sect_trial`, `martial_improvement` | Post-trial progression |

### Failure / turn-away (≥1)

| Condition | Outcome |
| --- | --- |
| `orthodox_trial_force_fail` without recovery | Trial setback; may block completion beat |
| Player later accepts `demonic_encounter` while `route_orthodox` active + locked | **Blocked** by sect↔demonic strong exclusion unless turn event |
| Explicit sect expulsion (future) | `route_orthodox_failed` → `sect` lifecycle `failed` |

---

## Route 2 — Wandering Hero (US-011)

**routeId:** `wanderer` (+ `hero` coexist) · **flag:** `route_wanderer` · **assets:** `sect-wudang.json`, `identity-hero.json`, `sect-border.json`, `general.json`

### Age 0–30 beats

| Age | Phase | Event | Beat |
| ---: | --- | --- | --- |
| 13 | Start | `sect_path_choice` → `stay_wanderer` | 拒绝入门，选择流浪 |
| 16 | Start | `jianghu_experience` | 首次江湖历练 |
| 17 | Growth | `martial_improvement` | 武艺巩固 |
| 19 | Growth | `continued_journey` | 青年游历 |
| 15+ | Relationship | `love_first_meet` | 情感/关系 beat（wanderer 线常见） |
| 20–30 | Commitment | `hero_first_case` | 第一次公开侠义行动 |
| 20–30 | Consequence | `hero_save_village` (payoff) | 侠名传播 |

### Key choices (≥3)

| # | Event | Choice IDs | Durable writes |
| --- | --- | --- | --- |
| 1 | `sect_path_choice` | `stay_wanderer` | `route_wanderer` |
| 2 | `childhood_preference` | `play_outside`, `balance_both` | `freeSpirit`, `balancedApproach` (wanderer-friendly) |
| 3 | `love_first_meet` | `love_greet`, `love_charm`, `love_pass` | `love_started`, `love_approach_method` |
| 4 | `hero_first_case` | `fight_bandits`, `help_secretly` | `hero_first_case` |

### Payoffs (≥2)

| Key choice | Payoff event | Mechanism |
| --- | --- | --- |
| `sect_path_choice` (wanderer) | `jianghu_experience`, `demonic_encounter` (branch) | Route flag gates availability |
| `hero_first_case` | `continued_journey`, `hero_save_village` | Hero flag + reputation |
| `martial_arts_enlightenment` | `martial_improvement` | Training focus flags |

### Failure / compromise (≥1)

| Condition | Outcome |
| --- | --- |
| `love_pass` at `love_first_meet` | Relationship deferred; wanderer arc continues without lover |
| Join sect after wanderer start (`join_orthodox`) | Soft exclusion → requires **turn event** if wanderer locked |
| Low chivalry + accept demonic | Drift toward demonic branch; hero/wanderer arc compromised |

---

## Route 3 — Demonic Path (US-012)

**routeId:** `demonic` · **flag:** `route_demonic` · **assets:** `sect-marginal.json`, `identity-demon.json`

### Age 0–30 beats

| Age | Phase | Event | Beat |
| ---: | --- | --- | --- |
| 14–17 | Start / temptation | `demonic_encounter` | 幽影门诱惑入口 |
| 14–16 | Commitment | `demonic_trial` | 试炼开启 |
| 14–18 | Power gain | `demonic_trial_shadow`, `demonic_trial_blood` | 暗影/血影试炼 |
| 16–25 | Social cost | `demonic_power_struggle` | 门内权斗 |
| 17–30 | Moral conflict | `demonic_usurpation` / `demonic_renounce_path` | 夺位或退隐 |
| 18+ | Consequence | `understand_unconventional_truth` | 魔道认知后果 |
| 16–30 | Identity | `outlaw_cultivation` | 邪修身份线 |

### Key choices (≥3)

| # | Event | Choice IDs | Durable writes |
| --- | --- | --- | --- |
| 1 | `demonic_encounter` | `accept_demonic`, `decline_demonic` | `route_demonic`, `current_sect` |
| 2 | `demonic_trial_shadow` | shadow trial choices | demonic trial flags |
| 3 | `demonic_power_struggle` | `demonic_usurp`, `demonic_renounce` | `demonic_path_usurp`, `demonic_path_renounce` |
| 4 | `outlaw_cultivation` | cultivation choices | outlaw identity flags |

### Payoffs (≥2)

| Key choice | Payoff event | Mechanism |
| --- | --- | --- |
| `demonic_encounter` | `demonic_trial`, `demonic_trial_shadow` | `route_demonic` gate |
| `demonic_power_struggle` | `demonic_usurpation`, `demonic_renounce_path` | usurp/renounce flags |
| `demonic_encounter` | `understand_unconventional_truth` | `sect_faction` unconventional |

### Redemption / escalation / isolation (≥1)

| Condition | Outcome |
| --- | --- |
| `decline_demonic` at encounter | Route never starts; `demonic` stays `inactive` |
| `demonic_renounce_path` | Redemption turn-away; potential wanderer pivot (turn event) |
| `demonic_path_usurp` | Escalation — lock-in demonic, karma/reputation cost |
| Sect + demonic both active | **Contradiction** — blocked at selection gate |

---

## Cross-route notes

- **Fork point:** age 13 `sect_path_choice` splits sect vs wanderer; demonic enters independently via encounter (often wanderer/low-chivalry branch).
- **Do not conflate:** `route_official`, `route_beggars` are non-priority (deferred).
- **Spine broken-event fix (PXG3):** `orthodox_trial_service`, `love_first_meet` — loader stub `effects` added for outcomes-based choices; regenerate manifest via `npm run report:event-asset-inventory`.

---

*PXG3 / US-010–012 — 2026-05-30*
