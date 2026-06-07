# P8 Persona Model and Fixed Roster

生成时间：2026-06-07

## 1. Persona Data Model

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Stable roster id |
| `name` | string | Display name |
| `gender` | `'male' \| 'female'` | Character creation |
| `seed` | number | Deterministic RNG seed |
| `strategy` | `PersonaActionStrategy` | Primary no-event action bias |
| `routePreference` | string | Intended route tendency tag |
| `riskPreference` | `'low' \| 'medium' \| 'high'` | Choice/action risk bias |
| `relationshipPreference` | `'low' \| 'medium' \| 'high'` | Social/romance bias |
| `choiceTendency` | legacy tendency key | Maps to existing simulator scoring |
| `shortTermGoals` | `PersonaGoal[]` | 2–4 goals with age band + evidence types |

### PersonaGoal

| Field | Description |
| --- | --- |
| `id` | Stable goal id |
| `label` | Human-readable goal |
| `ageBand` | `'0-20' \| '20-30' \| '30-40'` |
| `evidenceTypes` | e.g. `flag`, `route_state`, `stat_threshold`, `relationship`, `event_id` |
| `evidenceSpec` | Concrete check spec (flag name, stat key, etc.) |

## 2. Fixed Roster (8 personas, age 0–40 gate)

| id | name | strategy | route | risk | relationship | choiceTendency |
| --- | --- | --- | --- | --- | --- | --- |
| p8-martial-lin | 林破竹 | training | martial | medium | low | martial |
| p8-scholar-su | 苏文澜 | study | scholarly | low | medium | balanced |
| p8-social-gu | 顾清仪 | socializing | social | medium | high | relationship |
| p8-wealth-shen | 沈聚财 | business | wealth | medium | low | wealth |
| p8-cautious-han | 韩守拙 | training | conservative | low | medium | risk_averse |
| p8-deviant-ye | 叶走邪 | training | demonic | high | low | martial |
| p8-explorer-lu | 陆行远 | travel | wanderer | high | medium | balanced |
| p8-balanced-wei | 卫中和 | balanced | balanced | medium | medium | balanced |

## 3. Short-Term Goals (per persona)

Each persona defines goals in `src/p8/personas.ts` with age bands 0–20, 20–30, 30–40. Evidence types drive achievement metric evaluation.

## 4. Primary Strategy Summaries

- **林破竹:** 优先练功，追求武力成长与门派/江湖身份。
- **苏文澜:** 优先读书，提升学识与悟性，偏文路。
- **顾清仪:** 优先交游，拓展人脉与情感线。
- **沈聚财:** 优先营商/敛财，财富与声望并重。
- **韩守拙:** 保守练功，规避高代价选择。
- **叶走邪:** 偏邪路事件与高风险选择，仍保持可玩主动规划。
- **陆行远:** 探索/游历导向，接受中等风险换见闻。
- **卫中和:** 均衡成长，不极端偏科。

Implementation: `src/p8/personas.ts`, `src/p8/types.ts`.
