# P8 Playability Metrics — Schema and Thresholds

生成时间：2026-06-07

## 1. Metric Keys

### agency（能动性）

- **Intent:** 玩家是否有有意义的主动规划，而非随机回放或固定练功。
- **Scoring surface:** 主动行动次数、故事/选择/强制事件计数、主动行动类别多样性、无事件重复同一行动且无路线/目标/叙事变化窗口。
- **Measurement:** simulation
- **Severity:** blocker（重复无变化超阈值）；warning（主动行动占比过低）
- **Thresholds (0–40 small sample):**
  - `repeated_same_action_streak_max` = 4 → blocker
  - `active_action_share_min` = 0.08 → warning
  - `active_category_diversity_min` = 2 → warning

### causality（因果回响）

- **Intent:** 早期选择/行动在后续可见回响，人生有 authored 感。
- **Scoring surface:** 后续条件、解锁选项、反馈文本、路线状态、报告字段中对早期 action/choice 的引用数；区分直接引用 vs 纯 stat 增长。
- **Measurement:** simulation
- **Severity:** warning（age 40 前 echo 过少）
- **Thresholds:**
  - `direct_echo_count_min_by_40` = 3 → warning
  - `generic_stat_only_echo_ratio_max` = 0.85 → info

### achievement（目标达成）

- **Intent:** persona 短期目标在 0–40 有 payoff。
- **Scoring surface:** 每 persona 2–4 条短期目标 → achieved / missed / unavailable，附 flags/route/stats/relationship/eventId 证据。
- **Measurement:** simulation
- **Severity:** warning（多数 persona 40 岁无 achieved goal）
- **Thresholds:**
  - `personas_with_zero_achieved_ratio_max` = 0.6 → warning

### frustration（挫折与恢复）

- **Intent:**  setbacks 公平可理解，失败促重试而非不信任。
- **Scoring surface:** 负面结果分类：warned / explained / recoverable / opaque；opaque 比例与示例。
- **Measurement:** simulation
- **Severity:** blocker（opaque 超阈值）
- **Thresholds:**
  - `opaque_negative_ratio_max` = 0.35 → blocker
  - `opaque_count_max_per_persona` = 5 → warning

### replayability（重玩差异）

- **Intent:** 不同 persona/seed 产生可区分人生。
- **Scoring surface:** route tags、关键选择、主动行动分布、关系、主要 stat、40 岁摘要的相似度矩阵与聚类。
- **Measurement:** simulation
- **Severity:** warning（多 persona 近同输出）
- **Thresholds:**
  - `pairwise_similarity_warn` = 0.82 → warning
  - `cluster_size_warn` = 3 → warning

### pacing（节奏与无聊）

- **Intent:** 0–40 频繁有意义变化，避免长空窗。
- **Scoring surface:** 无新选择/路线/关系/有意义 stat 阈值/新摘要行的最长低影响窗口（年）。
- **Measurement:** simulation
- **Severity:** blocker（低影响窗口过长）
- **Thresholds:**
  - `low_impact_span_years_blocker` = 8 → blocker
  - `low_impact_span_years_warn` = 5 → warning
- **Note:** 保留现有 `gate:experience` 重复 blocker，不替代。

### narrative_memory（叙事记忆）

- **Intent:** 每条模拟人生产出可读三段摘要供人工审阅。
- **Scoring surface:** 早年 / 转折点 / 40 岁身份；至少 3 条 cited evidence；缺 identity 或 turning point → warning。
- **Measurement:** simulation（生成）+ human testing（可读性最终判断）
- **Severity:** warning（结构缺失）
- **Thresholds:**
  - `min_evidence_citations` = 3 → warning if below
  - Human-only: 摘要是否「像玩家故事」→ info, non-blocking

## 2. Human-Only Metrics (Non-Blocking for Automation)

| Key | Notes |
| --- | --- |
| `ui_comprehension` | 属性/行动/路线 UI 是否易懂 |
| `hesitation_boredom` | 真人观察表：犹豫、无聊、重启意图 |
| `replay_desire` | 测后问卷：是否想再开一局 |
| `memorable_story` | 测后：是否记住一条具体故事线 |

自动化门禁仅记录 `measurementSurface: human_only`；fail 决策不依赖上述键。

## 3. Implementation Reference

TypeScript 定义见 `src/p8/metricDefinitions.ts`；门禁评估见 `src/p8/playabilityGate.ts`。
