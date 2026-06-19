# PRD: 幼年 Agency 机制（Stage-1）

## 1. Introduction

2026-06-17 实机证明：0 岁起即进入「规划三选一」，与 P16 分龄 agency 及玩家常识冲突。Stage-1 在 **runtime/API 层** 落地分龄机制，使 0～4 岁不再出现日常主动规划，并补齐被动推进、数值 clamp、期终小结。

**状态：已实施**（代码在工作区；本子代理可作基线对照或补缺，非必须重做）

**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`

## 2. Goals

- 0～4 岁：`planningOptions.length === 0`，phase 为 `passive_progression` 或 `story_event`
- 5 岁起：恢复 lite 主动规划（最多 2 类，见 `childhoodAgency.ts`）
- 0～2 岁：侠义/内功/功力等禁止因行动或被动结算跳变
- 每次被动推进后：`period_summary` 含叙事 + 实际 stat delta
- API 与 headless 单点真源（`HeadlessEngineSessionImpl`）

## 3. 冻结决策

| 常量/规则 | 值 |
| --- | --- |
| `INFANT_MAX_AGE` | 2 |
| `DAILY_PLANNING_MIN_AGE` | 5 |
| `shouldOfferDailyPlanning(0～4)` | false |
| 婴儿允许属性 | constitution, health, comprehension；Δ≤1 |

## 4. User Stories

### US-001: Passive Session Phase
**Description:** As a player, I want ages 0–4 to advance via passive continuation so that infants are not asked to plan their life.

**Acceptance Criteria:**
- [ ] `SessionPhase` includes `passive_progression` and `period_summary`
- [ ] `getSessionPhase()` returns `passive_progression` when age < 5 and no pending story/summary
- [ ] `resolveChildhoodActionPalette` returns `[]` for ages 0–4
- [ ] `ProgressionAckKind` includes `passive_continue` and `period_summary`
- [ ] `p72SessionPhase.test.ts` covers age 1 passive case
- [ ] Typecheck passes

### US-002: Passive Tick And Period Summary
**Description:** As a player, I want each passive season to show what happened before I continue.

**Acceptance Criteria:**
- [ ] `executePassiveChildhoodTick` advances 1 quarter, writes `eventHistory`, builds `periodSummary`
- [ ] `SessionProgressionPayload` includes `periodSummary` and `passiveNarrative`
- [ ] `GameScreen` renders period summary card before ack
- [ ] `App.vue` maps API `passive_progression` / `period_summary` to non-empty `currentNode`
- [ ] Verify in browser using dev-browser skill

### US-003: Age-Band Stat Clamps
**Description:** As a player, I want infant stat changes to stay believable.

**Acceptance Criteria:**
- [ ] `ageActionStatCaps.ts` clamps infant band to allowed stats only
- [ ] `ActionResultResolver` applies clamps after roll
- [ ] `birth_with_phenomenon` does not grant `internalSkill+5` at age 0 (flag/comprehension only)
- [ ] `p16OriginDestinyTests` asserts infant training yields chivalry=0, internalSkill=0
- [ ] Typecheck passes

### US-004: Infant Passive Narrative Catalog (V0)
**Description:** As a player, I want origin-flavored passive text during ages 0–7 filler gaps.

**Acceptance Criteria:**
- [ ] `infantPassiveNarratives.ts` catalog with origin tags and age bands
- [ ] `selectPassiveNarrative` weights by origin flags
- [ ] `resolvePlanningPlaceholderText` never uses江湖变故 placeholder for age ≤2
- [ ] Typecheck passes

### US-005: Local/API Parity Thin Adapter
**Description:** As a maintainer, I want local `useNewGameEngine` to mirror headless passive flow.

**Acceptance Criteria:**
- [ ] `useNewGameEngine` branches on `shouldOfferDailyPlanning` like headless session
- [ ] `useApiGameEngine` handles new ack kinds
- [ ] No UI-only hide of planning while server still returns `active_planning` for age 0–4
- [ ] Typecheck passes

## 5. Functional Requirements

- **FR-1:** Ages 0–4 must not expose `active_planning` with non-empty options.
- **FR-2:** Passive ack must be authoritative on server for API mode.
- **FR-3:** Stat clamps apply at resolve time, not display-only.
- **FR-4:** Placeholder copy must be age-aware (`resolvePlanningPlaceholderText`).

## 6. Non-Goals

- 四出身 5 节点顺序 quest 链（Stage-3）
- 3～7 岁 spine 密度调优（Stage-4）
- 5～7 岁「轻量 2 选」UI 改造（Stage-4）
- 少年/成年线

## 7. Key Touchpoints (Reference)

- `src/p16/childhoodAgency.ts`
- `src/headless/session/HeadlessEngineSessionImpl.ts`
- `src/core/activePlanning/ageActionStatCaps.ts`
- `src/core/activePlanning/periodSummaryBuilder.ts`
- `src/data/infantPassiveNarratives.ts`
- `src/contracts/sessionProgression.ts`
- `server/src/services/sessionProgressionMapper.ts`
- `src/components/GameScreen.vue`, `src/App.vue`

## 8. Success Metrics

- Infant 10-period run: 0 planning options
- Period summary non-empty rate ≥95%
- `gate:p16` pass after merge

---

**状态：** 已实施 · 供 Stage-2/3/4 子代理作基线对照
