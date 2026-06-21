# PRD: 幼年 Spine / story_event 出身隔离（Stage-6）

## 1. Introduction

Stage-1～5 已完成 0～7 岁 agency、0～2 四链、3～7 passive 硬隔离。实机仍出现 **spine / story_event 跨出身串味**：

- 书香门第 age 2 · `p22_origin_frontier_orphan`（`api-browser-playtest-stage2.md` step 7）
- 根因：trait `startingFlags` 与 `origin_background` 主 flag 冲突、P22 条件 flag 名错误、运行时无 `stageFit` 硬门禁

**本 PRD（Stage-6）** 在 **`selectEvent()` / `getAvailableEvents()` 路径** 建立与 Stage-5 passive 同级的 **出身硬隔离**，并修正配置层 origin 条件。详见 `docs/designs/spine-origin-isolation-rules.md`。

**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`

## 2. Goals

- 消除 0～7 岁 **story_event** 中的外国出身专属条目
- 建立 **主出身 flag 权威**（`origin_background` 四选一优先于 trait startingFlags）
- 修正 P22 等 catalog 的 **origin flag 名不一致**
- 四出身各 30+ 次 spine 抽样：**外国专属 story_event id 0%**
- 书香 Stage-2 35 步 API：**0 spine bleed flags**
- Stage-5 passive 隔离与 Stage-4 密度指标 **不回归**

## 3. 冻结决策

- **硬过滤优先于加权：** 非本出身专属 spine **不得进入** `getAvailableEvents` 候选（age 0～7）
- **主出身权威：** `resolvePrimaryOriginFamilyFlag` 与 Stage-5 `resolveOriginTags` 同优先级（infant chain flags 顺序）
- **trait startingFlags 不得单独解锁** 外国专属 spine（如 `origin_poor_family` 不能触发 `origin_frontier` 事件）
- **0～2 passive 链、3～7 passive 选择器不变**（Stage-3/5）
- **配置 + 运行时双轨修复：** 仅改 JSON 不够；必须加 runtime gate
- **age 0～7 为 P0 审计 band**；gate 实现可复用于 age ≤ 12，但 US-005 矩阵仅强制 0～7

## 4. User Stories

### US-001: Spine Cross-Origin Bleed Audit (Read-Only)
**Description:** As a maintainer, I want a documented inventory of spine bleed paths so that fixes target the scheduler and config, not copy alone.

**Acceptance Criteria:**
- [ ] Create `docs/test-reports/spine-origin-bleed-audit.md` with R1–R5 root causes and file references
- [ ] List 0～7 age-relevant `story_event` ids grouped by origin exclusivity (scholar/martial/merchant/frontier/neutral)
- [ ] Reproduce 书香 age-2 bleed: `p22_origin_frontier_orphan` cited from stage2 playtest step 7
- [ ] Document flag inventory: `origin.json` vs `p22-content-expansions.json` vs `traits/origins.ts` startingFlags
- [ ] No gameplay code changes in this story

### US-002: Primary Origin Family Flag Resolver
**Description:** As the engine, I need a single canonical player origin flag so that spine gates and passive gates agree.

**Acceptance Criteria:**
- [ ] Add `resolvePrimaryOriginFamilyFlag(state): string | null` (shared module, reused by spine gate)
- [ ] Priority matches Stage-5: first match among `origin_scholar_family`, `origin_wuxia_family`, `origin_merchant_family`, `origin_frontier` on player/state flags
- [ ] Returns `null` before `origin_background` completes (age 0 / pre-choice)
- [ ] Unit tests: scholar choice + `origin_poor_family` trait flag → primary is `origin_scholar_family`
- [ ] Typecheck passes

### US-003: Hard Origin Gate For Spine Events (Age 0–7)
**Description:** As a player, I want story events at ages 0–7 to match my chosen origin so that childhood spine feels coherent.

**Acceptance Criteria:**
- [ ] Add `isSpineOriginEligible(event, primaryOriginFlag, age)` (or equivalent)
- [ ] Wire into `GameEngineIntegration.getAvailableEvents` or `passesRuntimeEventGuards` for `age <= 7`
- [ ] Events classified origin-exclusive (see design §3.2) must not pass when primary flag mismatches
- [ ] Neutral/general childhood events (`clever_speech`, `childhood_preference`, `origin_background`, …) unchanged
- [ ] `p22_origin_frontier_orphan` not selectable for `origin_scholar_family` primary even if `origin_poor_family` set
- [ ] New unit tests in `tests/spineOriginIsolationTests.ts`
- [ ] Typecheck passes

### US-004: Fix Catalog Origin Condition Mismatches
**Description:** As a maintainer, I want event conditions to use the same flag names as `origin.json` so that intended origins can trigger and foreign origins cannot.

**Acceptance Criteria:**
- [ ] Fix `p22_origin_frontier_orphan`: use `origin_frontier` (not `origin_frontier_family`); remove erroneous cross-origin OR per design §3.3
- [ ] Audit and fix other 0～7 spine entries in P22 / identity-* / childhood bands with wrong `origin_*` names
- [ ] Document changed ids in audit report appendix
- [ ] Existing P22 tests updated; `tests/p22ContentLibraryTests.ts` live-ops gate still pass
- [ ] Typecheck passes

### US-005: Four-Origin Spine Isolation Regression Suite
**Description:** As a maintainer, I want automated proof across all four origins for ages 0–7 story_event selection.

**Acceptance Criteria:**
- [ ] Script or test: each primary origin × ages {1,2,3,4,5,6,7} × 30 `getAvailableEvents` or headless story picks
- [ ] **0** foreign exclusive story_event ids per origin
- [ ] Matrix table: origin × age × forbidden ids seen (expect empty)
- [ ] Save `docs/test-reports/spine-origin-isolation-stage6.md`
- [ ] `npm run gate:p16` pass after changes

### US-006: API Playtest Spine Bleed Detector
**Description:** As an experience reviewer, I want the stage2 API driver to fail on cross-origin spine ids.

**Acceptance Criteria:**
- [ ] Extend `scripts/runApiBrowserPlaytestStage2.ts` (or sibling script) to flag `story_event` ids whose origin exclusivity mismatches player primary origin
- [ ] 书香门第 35-step run: **0 spine bleed flags** (includes no `p22_origin_frontier_orphan`)
- [ ] Save `docs/test-reports/api-browser-playtest-stage6-spine-isolation.md`
- [ ] Verify in browser or document equivalent headless contract

### US-007: Origin Spine Config Validation (CI)
**Description:** As a maintainer, I want CI to reject new spine entries with ambiguous or mismatched origin semantics.

**Acceptance Criteria:**
- [ ] Validate: if `authoringSemantics.stageFit` contains `origin_*`, required primary flag must exist in canonical flag set
- [ ] Validate: condition expressions referencing `origin_*` use names from `origin.json` allowlist
- [ ] Warn or fail on `origin_poor_family` in same OR branch as frontier/scholar/merchant/wuxia exclusive events
- [ ] Wire into content validation test file
- [ ] Typecheck passes

### US-008: Stage-6 Closure Report
**Description:** As a product owner, I want closure tying audit, tests, config fixes, and playtest together.

**Acceptance Criteria:**
- [ ] Create `docs/test-reports/early-childhood-spine-origin-isolation-stage6-closure.md`
- [ ] References US-001～US-007 artifacts
- [ ] Confirms Stage-5 passive bleed still 0; Stage-4 density still met
- [ ] Lists residual risks (8～12 spine, daily fallback pool, neutral repetition → Stage-7)
- [ ] No code in this story

## 5. Functional Requirements

- **FR-1:** For age ∈ [0,7], `getAvailableEvents` must apply origin hard gate after live_ops and before weighted pick.
- **FR-2:** Primary origin from `origin_background` choice overrides conflicting trait `startingFlags` for gate purposes.
- **FR-3:** Event with exclusive origin semantics for frontier must not be available when primary is `origin_scholar_family`.
- **FR-4:** `resolvePrimaryOriginFamilyFlag` must be shared/importable by passive and spine layers (avoid drift).
- **FR-5:** Config fixes must not re-open passive bleed (Stage-5 tests remain green).
- **FR-6:** Bleed detector for spine runs in CI or documented gate alongside Stage-5 passive detector.

## 6. Non-Goals (Out of Scope)

- Rewriting 0～2 infant passive chains (Stage-3)
- 3～7 passive pool logic (Stage-5)
- Neutral passive title deduplication / micro-chains (Stage-7)
- Full 8～12 spine content rewrite (gate may extend; content audit optional)
- Replacing `selectEvent` weighted architecture globally
- `.prd.json` generation

## 7. Design Considerations

- **Primary touchpoints:**
  - `src/core/GameEngineIntegration.ts` — `getAvailableEvents`, `passesRuntimeEventGuards`, `selectEvent`
  - `src/data/lines/p22-content-expansions.json` — orphan conditions
  - Shared resolver (new or `src/data/originInfantPassiveChain.ts` / `src/p16/originSurfaces.ts`)
- **Example gate (conceptual):**

```typescript
if (age <= 7 && primaryFlag && isOriginExclusiveSpineEvent(event)) {
  if (!spineOriginMatches(event, primaryFlag)) return false;
}
```

- **Player-visible:** wrong-origin story titles disappear; correct-origin P22 events may **start** appearing for frontier after US-004

## 8. Technical Considerations

- **Tests:**
  ```bash
  npm exec tsx tests/spineOriginIsolationTests.ts
  npm run gate:p16
  npm run gate:playability
  npm exec tsx scripts/runApiBrowserPlaytestStage2.ts  # with spine bleed flags
  ```
- **Risk:** Over-filtering thins weak-origin P22 pools → mitigate with correct conditions + neutral childhood events, not foreign bleed
- **Merge conflict:** medium (`GameEngineIntegration.ts` + P22 JSON + tests)

## 9. Success Metrics

| 指标 | 目标 |
| --- | --- |
| 外国专属 spine id（0～7 岁） | **0%**（四出身抽样） |
| 书香 35 步 API spine bleed flags | **0** |
| `p22_origin_frontier_orphan` @ 书香 | **0** |
| 边疆 primary + age 1～3 orphan 可选 | **≥1** 环境可复现（US-004 后） |
| Stage-5 passive bleed | **0**（不回归） |
| gate:p16 + gate:playability | pass |

## 10. Risks and Rollback

| 风险 | 缓解 |
| --- | --- |
| 误杀通用童年 spine | US-001 白名单 neutral ids；gate 仅 origin-exclusive |
| P22 弱出身池更薄 | US-004 修正条件使边疆可触发本属事件 |
| 与 trait poor/street 叙事冲突 | 主 flag 权威 + 独立 poor 事件 follow-up |
| passive/spine 双标准 | US-002 共享 resolver |

**回滚：** revert US-003 runtime gate; keep US-001 audit and US-004 config fixes if safe.

## 11. Story Priority

```
US-001 → US-002 → US-003 → US-004 → US-005 → US-006 → US-007 → US-008
```

US-005 可与 US-006 并行（tests vs script）。US-004 可与 US-003 并行（config vs runtime）但合并前须联调。

## 12. Open Questions

| # | 问题 | 建议默认 |
| --- | --- | --- |
| Q1 | gate age 上限 7 还是 12？ | **7（P0）**；实现可写 `<=12` 常数，测试矩阵仅 0～7 |
| Q2 | poor_family trait 是否保留独立 spine？ | **follow-up**；本 Stage 仅禁止串到四主出身 foreign 事件 |
| Q3 | dailyEventSystem 回退是否纳入 gate？ | **是（P0）** 若回退事件带 origin-exclusive |

---

**状态：** 待实施
