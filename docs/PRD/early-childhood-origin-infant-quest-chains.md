# PRD: 四出身婴儿被动链（Stage-3 · 0～2 岁内容）

## 1. Introduction

Stage-1 用 `infantPassiveNarratives.ts` **加权随机**填充 0～7 岁空窗，出身差异有限。策划已完成四链 quest spec（各 5 节点）。Stage-3 将 **0～2 岁**改为按出身 **顺序 dequeue** 的被动链，提升重玩差异与叙事连贯性。

**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`  
**策划真源：** `docs/designs/childhood-origin-infant-passive-index.md` 及四份 `childhood-*-origin-0-2-quest-spec.md`  
**机制前置：** Stage-1 `passive_progression` / `period_summary` 已存在

## 2. Goals

- 四出身各 5 节点专属链在 0～2 岁按序触发
- 链完成后设 `*_infant_chain_complete`，不重复播放
- 链外 filler 使用中立条目（如 `infant_crawl_home`），不与链节点同屏冲突
- 任意两出身推进至 2 岁：叙事 ID 重合度 **<50%**
- 保持 agency：0～2 岁仍无规划三选一；数值仍仅体魄/健康/悟性 Δ≤1

## 3. 冻结决策

- 不改动 `DAILY_PLANNING_MIN_AGE = 5`
- 不引入 0～2 岁玩家抉择（除全局 spine 如出生/出身若已存在）
- 四链节点 ID 前缀：`scholar_infant_*` / `martial_infant_*` / `merchant_infant_*` / `frontier_infant_*`
- 合并现有 catalog 四条襁褓文案入对应链 N2，避免双结算

## 4. User Stories

### US-001: Quest Chain Config Schema
**Description:** As a developer, I want a structured config for ordered infant quest chains so that content can be tuned without hardcoding in session logic.

**Acceptance Criteria:**
- [ ] Add config (TS or JSON under `src/data/`) for four chains with: `questId`, `originFlag`, `nodes[]` (id, ageMin, ageMax, title, text, statDeltas, completionFlag)
- [ ] Each chain has exactly 5 nodes matching quest spec IDs
- [ ] Schema documented in PRD companion comment or `docs/designs/` one-liner
- [ ] Typecheck passes

### US-002: Ordered Dequeue In Passive Selection
**Description:** As a player, I want my origin's infant story to unfold in a fixed order so that early life feels authored.

**Acceptance Criteria:**
- [ ] Replace or wrap `selectPassiveNarrative` for age ≤2: dequeue next incomplete chain node by origin flag
- [ ] When chain complete, fall back to neutral filler catalog (not other origins' nodes)
- [ ] `eventHistory` records chain node ids; completed nodes never replay
- [ ] `passive_continue` path uses same selector on server (headless)
- [ ] Typecheck passes
- [ ] Relevant tests pass

### US-003: Scholar Origin Chain Content
**Description:** As a player born 书香门第, I want five distinct passive beats from birth to age 2.

**Acceptance Criteria:**
- [ ] Wire `quest_scholar_infant_passive_0_2` per `childhood-scholar-origin-0-2-quest-spec.md`
- [ ] Flags: `scholar_infant_*` + `scholar_infant_chain_complete`
- [ ] No chivalry/internalSkill/money deltas in chain
- [ ] Typecheck passes

### US-004: Martial Origin Chain Content
**Description:** As a player born 武林世家, I want five distinct passive beats from birth to age 2.

**Acceptance Criteria:**
- [ ] Wire `quest_martial_infant_passive_0_2` per martial quest spec
- [ ] Constitution bias only where spec allows; no martial power jumps
- [ ] Typecheck passes

### US-005: Merchant Origin Chain Content
**Description:** As a player born 商贾之家, I want five distinct passive beats from birth to age 2.

**Acceptance Criteria:**
- [ ] Wire `quest_merchant_infant_passive_0_2` per merchant quest spec
- [ ] No money/commerce agency at infant band
- [ ] Typecheck passes

### US-006: Frontier Origin Chain Content
**Description:** As a player born 边疆异族, I want five distinct passive beats from birth to age 2.

**Acceptance Criteria:**
- [ ] Wire `quest_frontier_infant_passive_0_2` per frontier quest spec
- [ ] Typecheck passes

### US-007: Origin Divergence Regression
**Description:** As a maintainer, I want automated proof that four origins diverge before age 3.

**Acceptance Criteria:**
- [ ] Test or headless script: four origins to age 2, export narrative ids
- [ ] All C(4,2) pairs overlap <50%
- [ ] `npm run gate:p16` still pass
- [ ] Save sample output under `docs/test-reports/early-childhood-origin-chains-stage3.md`

## 5. Functional Requirements

- **FR-1:** Only one origin chain active per playthrough (by `origin_*` flag).
- **FR-2:** Node trigger respects age band in spec; out-of-order skip only if prior node flag set.
- **FR-3:** Chain nodes produce `periodSummary` with spec title/body/deltas.
- **FR-4:** Legacy `infant_swaddle_*` catalog entries merged or deprecated without duplicate triggers.
- **FR-5:** Disturbance pool remains disabled for age ≤7 (inherit Stage-1 if present).

## 6. Non-Goals

- 3～4 岁日常规划或新 spine（Stage-4）
- 5～7 岁 lite 行动形态改造（Stage-4）
- 修改 1 岁 `origin_background` 四选一时机
- 少年/成年线

## 7. Design Considerations

- Reuse quest spec narrative verbatim where possible; typos fixed in config only with design note
- 0～2 岁约 8～12 passive 期中，链占 5 次「有情节」叙事（index §2）
- 与全局 `birth_*`、`toddler_exploration` spine：链作 filler，不删除 spine 锚点

## 8. Technical Considerations

- Touch: `infantPassiveNarratives.ts` or successor `infantQuestChains.ts`, `selectPassiveNarrative`, `HeadlessEngineSessionImpl.executePassiveChildhoodTick`
- Coordinate merge with Stage-4 if both edit passive catalog

## 9. Success Metrics

| 指标 | 目标 |
| --- | --- |
| 每出身链 5 节点完成率（至 2 岁） | ≥80% |
| 两两出身 ID 重合度 | <50% |
| 0～2 岁规划选项 | 0 |
| 继续前叙事非空 | ≥95% |

## 10. Story Priority

**US-001 → US-002 → US-003～US-006（可并行）→ US-007**

---

**状态：** 已实施（Stage-3 · `ralph/early-childhood-origin-infant-quest-chains`）
