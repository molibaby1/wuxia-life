# PRD: 幼童期被动叙事出身隔离（Stage-5）

## 1. Introduction

Stage-1～4 已完成 0～7 岁开场 agency、0～2 岁四链、3～7 岁密度与节奏。玩家实机反馈：**3～7 岁 passive filler 跨出身串味**（书香门第出现「营中操练」等边疆文案）。

**根因：** 0～2 岁已用 `originInfantPassiveChain` 严格按出身 dequeue；3～7 岁仍用 `selectPreschoolPassiveEntry` **软加权随机**，外国出身条目 weight≥1 且池耗尽时回退全量 pool。详见 `docs/designs/preschool-passive-origin-isolation-rules.md`。

**本 PRD（Stage-5）** 在 **3～7 岁 passive 选择层** 建立与 Stage-3 一致的 **出身硬隔离**，不改变 agency 形态与 0～2 链。

**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`

## 2. Goals

- 消除 3～7 岁 passive 叙事中的 **外国出身专属条目**
- 池耗尽时仅回退 **neutral** 或 age-appropriate gap，禁止外国条目回退
- 四出身各 30+ 次抽样：**外国专属 id 出现率 0%**
- 保持 Stage-4 密度指标（≥8 非占位叙事 / 35 步）不回归
- `gate:p16`、`gate:playability` 不退化

## 3. 冻结决策

- **硬过滤优先于加权：** 非本出身专属 tag 的条目 **不得进入候选池**
- **`neutral` 条目四出身共享**，但应控制重复（Stage-5 仅隔离，重复去重可 follow-up）
- **不降低** 本出身条目权重逻辑；权重只在合法池内生效
- **0～2 岁逻辑不变**（`selectOrderedOriginInfantPassive`）
- **spine 事件串味**（如 `p22_origin_frontier_orphan` 出现在书香）**不在本 PRD** — 若需修，另开 spine 条件 PRD

## 4. User Stories

### US-001: Cross-Origin Bleed Audit (Read-Only)
**Description:** As a maintainer, I want a documented inventory of bleed paths so that fixes target the selector not content alone.

**Acceptance Criteria:**
- [ ] Document R1–R4 root causes with file/line references in `docs/test-reports/preschool-origin-bleed-audit.md`
- [ ] List all 3～7 catalog ids grouped by originTags (scholar/martial/merchant/frontier/neutral)
- [ ] Reproduce 书香 age-4 bleed with id `child_frontier_drill` cited from stage2 playtest log
- [ ] No gameplay code changes in this story

### US-002: Hard Origin Filter For Preschool Passive Pool
**Description:** As a player, I want passive filler at ages 3–7 to match my origin so that childhood feels coherent.

**Acceptance Criteria:**
- [ ] Add `isPreschoolPassiveEligible(entry, playerOriginTag)` (or equivalent) in `preschoolPassiveSpine.ts` or shared helper
- [ ] `selectPreschoolPassiveEntry` builds pool from **eligible entries only** before scoring
- [ ] Foreign-origin exclusive entries (e.g. `child_frontier_drill` for scholar) never selected
- [ ] Typecheck passes
- [ ] New unit tests in `tests/preschoolOriginIsolationTests.ts` — scholar age 4 × 100 rolls → 0 foreign ids

### US-003: Neutral-Only Exhaustion Fallback
**Description:** As a player, when origin-specific passives are exhausted, I should see generic home-season text—not another origin's story.

**Acceptance Criteria:**
- [ ] When no unseen eligible origin+neutral entries: select from **neutral-only** unseen pool
- [ ] When neutral also exhausted: return `preschool_passive_gap` (placeholder), **not** full merged catalog
- [ ] Remove or guard legacy fallback that repopulates pool with all origins (`candidates.length === 0 → full pool`)
- [ ] Unit test: force history to contain all scholar entries → next pick is neutral or gap only
- [ ] Typecheck passes

### US-004: Config Validation For originTags
**Description:** As a maintainer, I want CI to reject preschool passive entries missing or ambiguous originTags.

**Acceptance Criteria:**
- [ ] Validate `preschool-passive-spine.json` + preschool-age catalog entries: every entry has non-empty `originTags`
- [ ] Reject entries with multiple exclusive origin tags (scholar+martial in one row)
- [ ] Wire into existing content validation or new test file
- [ ] Typecheck passes

### US-005: Four-Origin Isolation Regression Suite
**Description:** As a maintainer, I want automated proof across all four origins for ages 3–7.

**Acceptance Criteria:**
- [ ] Script or test: each origin × ages {3,4,5,6,7} × 30 random passive picks
- [ ] **0** selections of foreign exclusive ids per origin
- [ ] Save report `docs/test-reports/preschool-origin-isolation-stage5.md`
- [ ] `npm run gate:p16` pass after changes

### US-006: API Playtest Bleed Detector
**Description:** As an experience reviewer, I want the stage2 API driver to fail on cross-origin passive ids.

**Acceptance Criteria:**
- [ ] Extend `scripts/runApiBrowserPlaytestStage2.ts` (or new script) to flag passive ids whose exclusive originTags mismatch player origin
- [ ] 书香门第 35-step run: **0 bleed flags**
- [ ] Save `docs/test-reports/api-browser-playtest-stage5-origin-isolation.md`
- [ ] Verify in browser using dev-browser skill or documented equivalent

### US-007: Stage-5 Closure Report
**Description:** As a product owner, I want closure tying audit, tests, and playtest together.

**Acceptance Criteria:**
- [ ] Create `docs/test-reports/early-childhood-preschool-origin-isolation-stage5-closure.md`
- [ ] References US-001～US-006 artifacts
- [ ] Confirms Stage-4 metrics still met (density ≥8, placeholder 0 in 0–4)
- [ ] Lists residual risks (neutral repetition, spine cross-origin if any)
- [ ] No code in this story

## 5. Functional Requirements

- **FR-1:** For age ∈ [3,7], passive selection must filter by player origin flag → tag mapping (`ORIGIN_FLAG_TO_PASSIVE_TAG`).
- **FR-2:** Entry with `originTags: ['martial']` must not be selectable when player has `origin_scholar_family`.
- **FR-3:** Entry with `originTags: ['neutral']` remains selectable for all origins.
- **FR-4:** Exhaustion fallback order: (origin+neutral unseen) → (neutral unseen) → gap entry.
- **FR-5:** `selectPassiveNarrative` age≤2 path unchanged.
- **FR-6:** Bleed detector must run in CI or documented gate script for regression.

## 6. Non-Goals (Out of Scope)

- Rewriting 0～2 infant quest chains
- Fixing non-passive spine events (`selectEvent`) cross-origin triggers
- Adding new preschool narrative content (unless required to replace removed bleed paths)
- 8～12 childhood band
- Neutral entry deduplication / title repetition (optional follow-up PRD)
- `.prd.json` generation

## 7. Design Considerations

- **Primary touchpoint:** `src/data/preschoolPassiveSpine.ts` — `selectPreschoolPassiveEntry`, `scoreEntry`, `mergedPreschoolCatalog`
- **Shared helper candidate:** extract `resolvePlayerOriginTags` duplication between `infantPassiveNarratives.ts` and `preschoolPassiveSpine.ts`
- **Example fix (conceptual):**

```typescript
function isEligible(entry: PreschoolPassiveEntry, playerTags: Set<string>): boolean {
  const tags = entry.originTags;
  if (tags.includes('neutral') && tags.length === 1) return true;
  return tags.some(t => t !== 'neutral' && playerTags.has(t));
}
```

- **Player-visible:** no UI change expected; period summary body should stop showing foreign scenes

## 8. Technical Considerations

- **Tests:**
  ```bash
  npm exec tsx tests/preschoolOriginIsolationTests.ts
  npm run gate:p16
  npm run gate:playability
  npm exec tsx scripts/runApiBrowserPlaytestStage2.ts  # with bleed flags
  ```
- **Risk:** Over-filtering leaves thin pools for some origins → mitigate with neutral/gap, not foreign bleed
- **Merge conflict:** low if only touching `preschoolPassiveSpine.ts` + tests

## 9. Success Metrics

| 指标 | 目标 |
| --- | --- |
| 外国专属 passive id 出现率（3～7 岁） | **0%**（四出身抽样） |
| 书香 35 步 API bleed flags | **0** |
| Stage-4 非占位叙事 beats |仍 ≥8 |
| 玩家串味主观反馈 | 无「营中操练出现在书香」类报告 |
| gate:p16 + gate:playability | pass |

## 10. Risks and Rollback

| 风险 | 缓解 |
| --- | --- |
| 合法池过薄 → 重复 neutral | 接受；后续 content PRD 加本出身条目 |
| 误杀 dual-tag 条目 | US-004 schema validation |
| 与 spine 串味混淆 | audit 文档区分 passive vs story_event |

**回滚：** revert US-002～US-003 only; keep audit/tests.

## 11. Story Priority

```
US-001 → US-002 → US-003 → US-004 → US-005 → US-006 → US-007
```

US-005 可与 US-006 并行（tests vs script）。

## 12. Open Questions

| # | 问题 | 建议默认 |
| --- | --- | --- |
| Q1 | 3～7 是否也要有序 micro-chain？ | **否（P0）**；硬过滤即可；micro-chain 为 P2 |
| Q2 | `p22_origin_frontier_orphan` 等 spine 串味是否同批修？ | **否**；另 PRD |
| Q3 | businessAcumen 等在 merchant 条目是否允许其他出身 | **否** |

---

**状态：** 已实施 · 收口见 `docs/test-reports/early-childhood-preschool-origin-isolation-stage5-closure.md`
