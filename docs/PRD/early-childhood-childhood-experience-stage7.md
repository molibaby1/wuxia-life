# PRD: 幼年体验收口（Stage-7）— Spine 扩 band · Trait 线 · Neutral 去重

## 1. Introduction

Stage-1～6 已完成 0～7 岁 agency、passive/spine 出身硬隔离与 P22 配置修正。Stage-6 closure §4 将以下项划入 **Stage-7**：

- Ages **8～12** spine gate 未覆盖（常量 `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 7`）
- **`dailyEventSystem`** 回退不经 `getAvailableEvents` 门禁
- **`origin_poor_family` / `origin_streetborn`** trait 线 spine 与四主出身并存时的 narrative bleed
- **Neutral passive / spine** 标题重复（Stage-5 明确 follow-up）

**本 PRD（Stage-7）** 在 **不破坏 Stage-5/6 回归** 前提下，扩展 spine 隔离 band、治理 trait 线事件、落地 neutral 去重。

**设计真源：** `docs/designs/childhood-experience-stage7-rules.md`  
**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`  
**前置 closure：** `docs/test-reports/early-childhood-spine-origin-isolation-stage6-closure.md`

## 2. Goals

- 将 spine origin hard gate 扩展至 **age ≤ 12**，并在 **daily 回退路径** 施加同等 `isSpineOriginEligible`
- 建立 **trait-line spine eligibility**（poor / street），消除与四主出身并存时的错误 narrative bleed
- 3～7 passive **neutral 标题去重**（近期抑制 + 可选 micro-chain P2）
- Stage-5/6 全部现有测试与 gate **不回归**
- 验收证据写入 `docs/test-reports/`（见 §4 各 US）

## 3. 冻结决策

- **硬过滤优先于加权**（延续 Stage-5/6）
- **主出身权威不变：** `resolvePrimaryOriginFamilyFlag` 优先于 trait `startingFlags` 用于四主 foreign exclusive 判定
- **Spine band：** 实现常量 **12**；测试矩阵 P0=0～7（回归），P1=8～12（新增）
- **Daily 路径：** 必须接线 gate（防御性 + 未来 catalog 变更）；不得假设 daily 永远 neutral
- **Trait-line：** poor 事件不得靠 `origin_poor_family` OR 解锁四主 foreign exclusive；street 同理；trait-line 仅匹配对应 trait flag
- **Neutral 去重：** 仅影响 **合法池内** 权重/排序，不改变 Stage-5 eligibility 与回退顺序
- **不产出 `.prd.json`**

## 4. User Stories

### US-001: Stage-7 Baseline Audit (Read-Only)

**Description:** As a maintainer, I want an inventory of 8～12 spine, daily fallback, trait-line, and neutral repetition paths before code changes.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage7-baseline-audit.md`
- [ ] List story_event ids with ageRange overlapping **8～12**, grouped by origin exclusivity (scholar/martial/merchant/frontier/trait-poor/trait-street/neutral)
- [ ] Document daily fallback call chain: `selectEvent` → `dailyEventSystem.selectEvent` with file references
- [ ] Inventory trait-line spine ids referencing `origin_poor_family` or `origin_streetborn` (incl. `p22-content-expansions.json`)
- [ ] Measure neutral passive title repetition: sample 4 origins × age 3～7 × 30 picks; report top duplicated titles
- [ ] No gameplay code changes in this story

### US-002: Extend Spine Origin Gate To Age 12

**Description:** As the engine, I need origin-exclusive spine filtering through age 12 so that late childhood story events match primary origin.

**Acceptance Criteria:**

- [ ] Raise `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX` to **12** in `src/p16/spineOriginIsolation.ts` (or named constant used by gate)
- [ ] Confirm `GameEngineIntegration.getAvailableEvents` uses updated constant (no duplicate magic number)
- [ ] Extend `tests/spineOriginIsolationTests.ts`: four origins × ages **{8,9,10,11,12}** × 30 rolls → **0** foreign exclusive ids
- [ ] **Regression:** existing 0～7 matrix tests unchanged pass criteria (0 foreign ids)
- [ ] Save matrix to `docs/test-reports/spine-origin-isolation-stage7-extended-band.md`
- [ ] Typecheck passes
- [ ] Tests pass

### US-003: Daily Fallback Origin Gate

**Description:** As a maintainer, I want daily event fallback to respect the same spine origin rules so that selectEvent bypass cannot reintroduce bleed.

**Acceptance Criteria:**

- [ ] Wire `isSpineOriginEligible` into daily selection path (`DailyEventSystem.selectEvent` and/or `GameEngineIntegration.selectEvent` daily branch)
- [ ] For age ≤ 12: candidates whose built `EventDefinition` fails origin gate are **excluded** before weighted pick
- [ ] Headless test: mock or fixture daily config with origin-exclusive semantics → wrong primary **never** selected
- [ ] Document daily pool origin semantics in baseline audit appendix (confirm current pool neutral-only or list exceptions)
- [ ] Save `docs/test-reports/daily-fallback-origin-gate-stage7.md`
- [ ] **Regression:** `spineOriginIsolationTests` + `preschoolOriginIsolationTests` pass
- [ ] Typecheck passes
- [ ] Tests pass

### US-004: Trait-Line Spine Eligibility

**Description:** As a player with a trait origin (poor_family / streetborn) and a four-main origin choice, I want trait-line events to match my trait without foreign main-origin bleed.

**Acceptance Criteria:**

- [ ] Add trait-line classifier (`inferTraitLineExclusiveFlag` or equivalent) for events keyed on `origin_poor_family` / `origin_streetborn`
- [ ] Add `isTraitLineSpineEligible(event, state)` integrated into spine selection path **after** primary-origin gate
- [ ] Rules: four-main foreign exclusive remains blocked; poor-line only when `origin_poor_family` present; street-line only when `origin_streetborn` present; cross-trait blocked
- [ ] Audit fix: split or guard P22 entries where street/poor OR branches overlap four-main flags (document in audit appendix)
- [ ] Unit tests in `tests/traitLineSpineEligibilityTests.ts` (or extend `spineOriginIsolationTests.ts`)
- [ ] Save matrix `docs/test-reports/trait-line-spine-eligibility-stage7.md`
- [ ] **Regression:** Stage-6 scholar+poor orphan block test still passes
- [ ] Typecheck passes
- [ ] Tests pass

### US-005: Neutral Passive Title Deduplication

**Description:** As a player, I want less repeated neutral passive titles during ages 3～7 so that filler feels varied.

**Acceptance Criteria:**

- [ ] In `selectPreschoolPassiveEntry`, suppress candidates whose **title** matches any of the last **N** passive narrative titles in history (N=5 default, constant configurable)
- [ ] Suppression applies within **legal pool only** (after `isPreschoolPassiveEligible`); does not bypass origin isolation
- [ ] When all candidates suppressed, fall through to existing neutral-only → gap order (Stage-5)
- [ ] Unit test: force repeated neutral picks → same title **≤2** consecutive; 50-roll sample meets title diversity threshold
- [ ] Save `docs/test-reports/neutral-passive-dedup-stage7.md` with before/after title frequency tables
- [ ] **Regression:** `preschoolOriginIsolationTests` pass (0 foreign passive ids)
- [ ] Typecheck passes
- [ ] Tests pass

### US-006: Neutral Spine Repetition Tuning (Optional P2)

**Description:** As a maintainer, I want reduced repetition among neutral spine ids (e.g. clever_speech, toddler variants) during ages 0～12.

**Acceptance Criteria:**

- [ ] Extend formal repetition / profile pressure for neutral spine id families listed in audit
- [ ] 35-step API or headless sample: neutral spine id repetition rate **≤** Stage-6 baseline (document baseline in US-001)
- [ ] Save `docs/test-reports/neutral-spine-repetition-stage7.md`
- [ ] Typecheck passes
- [ ] Tests pass

**Priority:** P2 — may defer if US-005 meets product bar

### US-007: Stage-7 Closure Report

**Description:** As a product owner, I want closure tying audit, extended band, daily gate, trait-line, and dedup together.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage7-closure.md`
- [ ] References US-001～US-006 artifacts
- [ ] Confirms Stage-5/6 non-regression with command output snippets
- [ ] Lists residual risks (8～12 content gaps, trait content volume, daily catalog evolution)
- [ ] No code in this story

## 5. Functional Requirements

- **FR-1:** For age ∈ [0,12], origin-exclusive spine must pass `isSpineOriginEligible` on **all** selection paths (`getAvailableEvents`, daily fallback).
- **FR-2:** Trait-line spine must pass `isTraitLineSpineEligible` when classifier matches poor/street semantics.
- **FR-3:** Primary origin from `origin_background` overrides trait flags for **four-main foreign exclusive** (Stage-6 invariant).
- **FR-4:** Neutral passive dedup must not reintroduce foreign-origin entries or skip gap fallback.
- **FR-5:** CI must run extended tests without breaking existing Stage-5/6 gates (`gate:p16`, `preschoolOriginIsolationTests`, `spineOriginIsolationTests` 0～7 section).
- **FR-6:** Config validation extended for trait-line OR-branch rules where applicable.

## 6. Non-Goals (Out of Scope)

- Rewriting 0～2 infant chains (Stage-3)
- Changing 3～7 passive eligibility rules (Stage-5) beyond dedup weighting
- Full 8～12 narrative content authoring
- Merging poor/street into four-main origin_background choices
- `.prd.json` generation
- Global `selectEvent` architecture rewrite

## 7. Design Considerations

**Primary touchpoints:**

| 区域 | 文件 |
| --- | --- |
| Spine gate 常量 | `src/p16/spineOriginIsolation.ts` |
| Formal 选择 | `src/core/GameEngineIntegration.ts` |
| Daily 回退 | `src/core/DailyEventSystem.ts` |
| Trait-line | 新模块或 `spineOriginIsolation.ts` 扩展 |
| Passive 去重 | `src/data/preschoolPassiveSpine.ts` |
| Trait 配置 | `src/data/traits/origins.ts`, `p22-content-expansions.json` |
| CI | `src/p16/spineOriginConfigValidation.ts`, `tests/runRealTestGate.ts` |

## 8. Technical Considerations

**Tests:**

```bash
npm exec tsx tests/spineOriginIsolationTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm exec tsx tests/traitLineSpineEligibilityTests.ts   # US-004
npm exec tsx tests/dailyFallbackOriginGateTests.ts     # US-003
npm run gate:p16
npm run typecheck
```

**Risk:** Extending band to 12 may over-filter thin 8～12 pools → mitigate with US-001 audit + neutral spine whitelist updates, not foreign bleed.

**Merge conflict:** medium (`GameEngineIntegration.ts`, `DailyEventSystem.ts`, tests)

## 9. Success Metrics

| 指标 | 目标 |
| --- | --- |
| Foreign exclusive spine (0～7, four origins) | **0%**（Stage-6 回归） |
| Foreign exclusive spine (8～12, four origins × 30) | **0%** |
| Trait-line cross-trait bleed | **0%** |
| Scholar + poor: foreign main-origin spine | **0%**（Stage-6 回归） |
| Neutral passive same-title consecutive | **≤2** |
| Stage-5 passive foreign ids | **0%**（回归） |
| `gate:p16` | pass |

## 10. Risks and Rollback

| 风险 | 缓解 |
| --- | --- |
| 8～12 池过薄 | US-001 审计；仅 hard-block exclusive，neutral 放行 |
| Daily gate 误杀 | 当前 pool 无 exclusive；测试用 mock 验证 |
| Trait-line 过严 | 产品确认 poor/street 并存叙事；单测矩阵四主×trait |
| Dedup 导致 gap 增多 | 回退顺序不变；gap 优于重复标题 |

**回滚：** revert US-002 constant to 7; revert US-003 daily wiring; keep US-001 audit.

## 11. Story Priority

```
US-001 → US-002 → US-003 → US-004 → US-005 → US-007
                              ↘ US-006 (P2, parallel after US-005)
```

US-003 可与 US-002 并行（daily vs constant）；US-004 依赖 US-001 trait 清单；US-005 独立。

## 12. Open Questions

| # | 问题 | 建议默认 |
| --- | --- | --- |
| Q1 | gate 上限 12 是否含 age 12 当日 daily？ | **是**，与 P16 幼年 band 上限一致 |
| Q2 | 书香 + poor_family 是否 **允许** poor-line spine？ | **允许** poor-line；**禁止** street/frontier/scholar foreign exclusive |
| Q3 | Neutral dedup N=5 是否可调？ | **常量** `NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW=5` |
| Q4 | US-006 是否 P0？ | **P2**，US-005 不足时再开 |

---

**状态：** 规划完成，待实施  
**规划基线：** `docs/test-reports/early-childhood-stage7-planning-baseline.md`
