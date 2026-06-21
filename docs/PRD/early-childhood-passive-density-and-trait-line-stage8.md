# PRD: 幼童 Passive 密度与 Poor Trait 线（Stage-8）

## 1. Introduction

Stage-1～7 机制验收 **PASS**（`docs/test-reports/early-childhood-opening-experience-final-playtest.md`）。边疆 primary-flag 冲突已在 `EventExecutor` 四主 `flag_set` 时清除其它四主 flag 修复。

**本 Stage 焦点：** 玩家可见的 **内容密度** — 减少 gap/neutral 被动占比；补齐 **poor_family trait** 最小 spine 集。**不**改 isolation gate 语义。

**设计真源：** `docs/designs/childhood-experience-stage8-content-rules.md`  
**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`  
**前置验收：** `docs/test-reports/early-childhood-opening-experience-final-playtest.md`

## 2. Goals

- 四出身 35 步 headless 验收：**gap 被动步 ≤2**（baseline 4～5）
- 新增 **poor trait** age 3～7 spine ≥1 条，且 trait-line gate 合规
- `primaryOriginFlagTests` 接入 CI（`runRealTestGate`）
- Stage-5/6/7 bleed 与去重测试 **不回归**
- 验收写入 `docs/test-reports/`

## 3. 冻结决策

- **只加内容 + CI 接线**；不改 `isPreschoolPassiveEligible` / spine gate 规则
- 新 passive 必须带正确 `originTags`；禁止 foreign 条目填池
- Poor spine 条件 **仅** `origin_poor_family`（或 poor 专用 successor flag），禁止与四主 OR
- Gap 指标以 `runEarlyChildhoodFinalPlaytest.ts` 的 `isGapPassiveTitle` 为准
- **8～12 agency** → Stage-9，本 PRD 不做
- **不产出 `.prd.json`**

## 4. User Stories

### US-001: Passive Pool & Gap Baseline Audit (Read-Only)

**Description:** As a maintainer, I want per-origin pool depth and gap frequency before adding content.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage8-pool-audit.md`
- [ ] Count eligible passive entries per origin tag × age {3,4,5,6,7}
- [ ] Cite final playtest gap 步 baseline（4～5/出身）
- [ ] List poor trait spine ids today (expect street only + zero poor)
- [ ] Propose 2～4 new entry slots per origin (title/theme sketch only)
- [ ] No gameplay code changes

### US-002: Wire Primary Origin Flag Tests To CI

**Description:** As a maintainer, I want primary-flag conflict regression in the real test gate.

**Acceptance Criteria:**

- [ ] Add `primaryOriginFlagTests` to `tests/runRealTestGate.ts` after `spineOriginConfigValidationTests`
- [ ] `npm test` runs `tests/primaryOriginFlagTests.ts` successfully
- [ ] Document in stage8 pool audit appendix

### US-003: Per-Origin Preschool Passive Content (Gap Reduction)

**Description:** As a player, I want more origin-flavored passive beats ages 3～7 so runs feel less like neutral gap filler.

**Acceptance Criteria:**

- [ ] Add **≥2** new entries per origin tag in `preschool-passive-spine.json` (or approved catalog path)
- [ ] Each entry: unique `id`, `originTags`, age band 3～7, non-empty `text`
- [ ] `validatePreschoolPassiveOriginTags` / US-004 rules still pass
- [ ] `preschoolOriginIsolationTests` — 0 foreign ids
- [ ] Save content manifest appendix in `docs/test-reports/early-childhood-stage8-passive-content.md`

### US-004: Poor Trait Spine Minimum Pack

**Description:** As a player with poor_family trait, I want at least one formative childhood spine beat.

**Acceptance Criteria:**

- [ ] Add **≥1** event age 3～7 with condition `flags.has("origin_poor_family")` only (no four-main OR)
- [ ] Pass `isTraitLineSpineEligible` + `validateSpineOriginConfig`
- [ ] Unit test: scholar primary + `origin_poor_family` → event **eligible**; scholar without poor → **ineligible**
- [ ] Save `docs/test-reports/trait-poor-spine-stage8.md`

### US-005: Final Playtest Gap Regression

**Description:** As a product owner, I want proof gap steps dropped without bleed regression.

**Acceptance Criteria:**

- [ ] Re-run `npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts`
- [ ] Update `docs/test-reports/early-childhood-opening-experience-final-playtest.md` with Stage-8 row
- [ ] **Gap 步 ≤2** per origin; passive/spine/trait bleed **0**
- [ ] Exit code 0

### US-006: Stage-8 Closure Report

**Description:** As a product owner, I want closure tying audit, content, trait pack, and playtest.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage8-closure.md`
- [ ] References US-001～US-005
- [ ] Lists Stage-9 candidates (8～12 agency, neutral spine dedup P2)
- [ ] No code in this story

## 5. Functional Requirements

- **FR-1:** New passive entries must pass `isPreschoolPassiveEligible` for intended origin only.
- **FR-2:** Poor spine must not appear in four-main foreign exclusive classifier.
- **FR-3:** `EventExecutor` primary-flag clearing behavior must remain covered by `primaryOriginFlagTests`.
- **FR-4:** Final playtest script unchanged in bleed contracts; gap metric is additive acceptance.

## 6. Non-Goals

- 8～12 childhood agency (Stage-9)
- Neutral spine repetition multiplier (Stage-7 US-006 P2)
- Rewriting 0～2 infant chains
- Merging trait into origin_background UI
- `.prd.json`

## 7. Success Metrics

| 指标 | Baseline (Stage-7 后) | Stage-8 目标 |
| --- | --- | --- |
| Gap 步 / 35 步 / 出身 | 4～5 | **≤2** |
| Passive bleed | 0 | 0 |
| Poor trait spine (3～7) | 0 | **≥1** |
| 四出身启发式评分 | ★★★☆☆ | ≥ ★★★☆☆（不回归） |

## 8. Story Priority

```
US-001 → US-002 → US-003 ∥ US-004 → US-005 → US-006
```

US-003 与 US-004 可并行；US-005 必须两者完成后跑。

---

**状态：** 待实施
