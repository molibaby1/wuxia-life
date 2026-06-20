# PRD: 幼童期内容与节奏（Stage-4 · 3～7 岁）

## 1. Introduction

Stage-1 解决 **agency 形态**（0～4 被动、5+ 规划），Stage-3 加厚 **0～2 岁出身链**。Stage-4 针对实机仍突出的 **3～7 岁耐玩度**：spine 过稀、占位文案、5～7 岁 lite 行动单调、属性变化缺叙事来源。

**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`  
**体验证据：** `docs/test-reports/api-browser-playtest-experience-2026-06-17.md` §3～§7

## 2. Goals

- 3～4 岁：被动期有密度，**4 岁童年偏好**稳定可达；仍无日常规划
- 5～7 岁：lite 行动池随年龄/出身 **解锁变化**（5 岁 ≠ 7 岁同池）
- 35 步内：≥8 条有情节叙事；「暂无江湖变故」≤3 次
- 属性变化在 summary/叙事中 **可复述原因**
- 可选：5～7 岁探索「轻量 2 选」呈现（非三行动卡片），若实现成本高可退化为最多 2 项 lite 行动 + 更好文案

## 3. 冻结决策

- 3～4 岁：**不**恢复 `active_planning` 三行动
- 5 岁起：保留 `DAILY_PLANNING_MIN_AGE = 5`；lite palette max 2 categories（已实现则验证）
- 4 岁「童年偏好」为首个**日常外**正式抉择（与 1 岁出身选择分层）
- 不批量加入成人江湖战斗事件

## 4. User Stories

### US-001: Story-Gap Scheduling Preference
**Description:** As a player, I want story gaps in ages 0–7 to prefer spine or passive filler over empty planning placeholders.

**Acceptance Criteria:**
- [ ] When `selectEvent()` returns null and age ≤7, scheduler prefers passive narrative or queued spine before `active_planning` (age≥5 only)
- [ ] Document behavior in `docs/test-reports/early-childhood-story-gap-stage4.md`
- [ ] Headless or unit test: age 3 gap does not enter planning
- [ ] Typecheck passes

### US-002: Spine Density And Origin Variants (3～7)
**Description:** As a player, I want more memorable beats between ages 3 and 7.

**Acceptance Criteria:**
- [ ] Add or extend at least 2 origin-variant passive/spine entries per origin for ages 3–7 (config-driven)
- [ ] `clever_speech` (age 3) or equivalent has ≥1 origin text variant OR separate weighted passive
- [ ] 35-step simulation from age 0: ≥8 non-placeholder narrative beats by age 7
- [ ] Typecheck passes

### US-003: Age-Graduated Lite Action Pool (5～7)
**Description:** As a player, I want my available childhood actions to change as I grow from 5 to 7.

**Acceptance Criteria:**
- [ ] Define bands: 5–6 vs 7 with different lite action id sets or labels (e.g. 5岁「院中玩耍」→7岁「帮家里打杂」)
- [ ] Same save at age 5 vs 7: palette ids are not identical for ≥2 origins
- [ ] Still max 2 options per planning period
- [ ] No adult P7 five-action set in 5–7 band
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Placeholder And Copy Governance
**Description:** As a player, I should not see system filler that breaks wuxia immersion in early childhood.

**Acceptance Criteria:**
- [ ] Ages 0–4: zero occurrences of「本期暂无强求的江湖变故，你可安排日常行动」
- [ ] Ages 5–7: placeholder ≤3 per 35 steps; replaced by `resolvePlanningPlaceholderText` age-appropriate copy
- [ ] Ages 5–7 planning intro mentions childhood framing, not jianghu career optimization
- [ ] Verify in browser using dev-browser skill

### US-005: Stat Delta Narrative Binding
**Description:** As a player, I want to understand why stats changed after childhood actions or passive seasons.

**Acceptance Criteria:**
- [ ] `activeActionSummary` and `periodSummary` include human-readable cause when deltas non-zero
- [ ] Sample audit: 5 random childhood deltas in playtest log — 100% mappable to narrative sentence
- [ ] Document in `docs/test-reports/early-childhood-stat-narrative-stage4.md`

### US-006: Disturbance Age Guard (0～7)
**Description:** As a player, I should not see jianghu disturbance cards in infancy.

**Acceptance Criteria:**
- [ ] `DisturbanceResolver` (or equivalent) does not return adult disturbances for age ≤7
- [ ] If disturbance impossible in band, pipeline skips without empty UI
- [ ] Typecheck passes

### US-007: Stage-4 Playtest Closure
**Description:** As an experience reviewer, I want a single report proving 3～7 pacing improved.

**Acceptance Criteria:**
- [ ] API browser playtest 书香门第 0→7 岁，35+ steps
- [ ] Subjective rating vs 2026-06-17 baseline documented (target ≥★★★)
- [ ] Save `docs/test-reports/api-browser-playtest-stage4.md`
- [ ] `npm run gate:playability` pass

## 5. Functional Requirements

- **FR-1:** Age 3–4 never shows `planningOptions` except via bug.
- **FR-2:** Age 4 `childhood_preference` remains `story_event` with choices.
- **FR-3:** Age 5–7 planning shows ≤2 lite actions.
- **FR-4:** Placeholder strings age-gated in `App.vue` / `resolvePlanningPlaceholderText`.
- **FR-5:** Narrative beat counter available in test report or debug export.

## 6. Non-Goals

- 8～12 岁 P16 palette 重构
- 少年门派选择线
- 新扰动卡 UI 视觉 redesign
- P20 全生命周期 pacing

## 7. Design Considerations

- 5～7「轻量 2 选」若与现有 `PlanningOptionDto` 兼容，优先改 **文案与池**，不必新 phase
- Origin variants should read through `getOriginChildhoodEventMultiplier` / origin surfaces where spine already hooks

## 8. Success Metrics

| 指标 | 目标 |
| --- | --- |
| 35 步非占位叙事 | ≥8 |
| 0～4 岁江湖变故占位 | 0 |
| 5～7 岁占位总计 | ≤3 / 35 步 |
| 5 岁 vs 7 岁行动池 | 不完全相同 |
| 实机耐玩评分 | ≥★★★（评审） |

## 9. Story Priority

**US-004 → US-001 → US-002 → US-003 → US-005 → US-006 → US-007**  
（占位与调度先改，实机最后收口）

---

**状态：** 已实施（Stage-4 · `ralph/early-childhood-preschool-content-and-pacing`）
