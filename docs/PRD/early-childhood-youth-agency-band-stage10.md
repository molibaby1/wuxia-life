# PRD: 少年期 Agency Band（Stage-10 · 13～20 岁）

## 1. Introduction

Stage-1～9 已将 **0～12 岁** agency、passive/spine/trait 隔离、8～12 P16 受限主动（training/study only）与 opening 终验收口为 **PASS**（`docs/test-reports/early-childhood-stage9-closure.md`）。35 步 headless 终龄常 **15～19**，玩家会进入 **13～20 岁** youth band，但本套件此前 **未系统验收** P16「中等 agency · 路线探索起步」形态。

Stage-9 closure § Stage-10 candidates 与 P16 全生命周期缺口：

| 候选 / 遗留 | 现状 | Stage-10 动作 |
| --- | --- | --- |
| **13+ youth agency band** | `age > 12` 时 `resolveChildhoodActionPalette` 直接 `getMinimumActions()`（五类 adult basic）；无 13～20 专项矩阵 | **本 Stage 主轴** — 审计 + 硬化 + 验收 |
| **Route entry 时序** | `routeDefinitions` 仍标 `ageBand: '0-10'`；`applyYouthTransitionSeeds` 仅在 12→13 边界生效；P8 persona 在 age 13 才种 `p9_early_*` | 对齐配置 ageBand + 边界矩阵 |
| **US-003 deferred (Stage-9)** | 8～12 四主 exclusive spine **0** 条 | 可选 P1 carryover（非主轴） |
| **Trait-line 内容量** | Stage-8 poor 最小包已合入 | **Out of scope** → Stage-11 |
| **Browser 实机 ★ 分治理** | Stage-2 机制 PASS；主观评分未纳入 CI | **Out of scope** → Stage-11 |

**设计真源（待 US-001 后定稿）：** `docs/designs/p16-stage-agency-rules.md` § Youth (13–20) + Stage-9 agency 实现  
**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`  
**前置 closure：** `docs/test-reports/early-childhood-stage9-closure.md`

## 2. Goals

- **13～20 岁** headless/API 路径符合 P16 **Moderate agency**：路线探索起步，但 **非** 21+ 全量 adult 战略池
- 12→13 边界：`applyYouthTransitionSeeds` / `promoteYouthRouteEntryFromUpbringing` 行为可观测、可回归；**0～12 不得** 因 childhood 行动直接写入 `p9_early_*` entry（persona 仿真 age 13 种子除外）
- `routeDefinitions` entry signal `ageBand` 与 youth 边界一致（**13～20**，非 0～10）
- 35 步终验扩展 **13～20 观测列**；Stage-5/6/7/8/9 隔离与 gap 门禁 **不回归**
- 验收写入 `docs/test-reports/`；产出配套 `early-childhood-youth-agency-band-stage10.prd.json`

## 3. 冻结决策

- **8～12 规则不变**（Stage-9 `LATE_CHILDHOOD_SUPPRESSED_CATEGORIES`）；本 Stage 只新增 **13～20** 层
- **Agency 真源：** `docs/designs/p16-stage-agency-rules.md`；US-001 须补全 § Youth (13–20) 可执行细则（allowlist、palette 上限、lite→basic 梯度）
- **Youth 常量：** `YOUTH_MIN_AGE = 13`（已有）；新增 `YOUTH_MAX_AGE = 20`；`age > 20` 走现有 adult `getMinimumActions()` 路径
- **Moderate 默认（待 US-001 确认）：**
  - 13～20 允许 `training`、`study`、`socializing`（lite 优先）
  - 13～20 允许 `business`、`travel`（自 youth band 解禁；可用 lite / 受限 basic，禁止与 21+ 同池无差别）
  - Palette 上限 **≤5** categories，origin/persona 排序保留；**禁止** 13 岁首 tick 五类 adult basic 齐出
- **Route entry：** `p9_early_*` / `p9_echo_*` 作为 entry signal 的 **生效窗口** 对齐 13～20；childhood 仅保留 `p16_deferred_*` 与 echo hook **锁定**，在 12→13 由 `promoteYouthRouteEntryFromUpbringing` 晋升
- **Demonic 例外：** 保留 Stage-9 / P16 既有 demonic travel 语义； youth band 不新增 wanderer focus 捷径
- **终验脚本：** 可扩展 `runEarlyChildhoodFinalPlaytest.ts` 报告 13～20 列；**不**降低 Stage-8 gap ≤2 / Stage-9 8～12 门禁
- **产出 `.prd.json`**（Ralph 执行索引）

## 4. User Stories

> **Ralph 粒度：** 9 个 US（`early-childhood-youth-agency-band-stage10.prd.json`）。实现 / 矩阵 / 配置 / 时序测试 / 终验分列，单 story 可在一轮 Ralph 迭代内完成。

### US-001: Stage-10 Baseline Audit (Read-Only)

**Description:** As a maintainer, I want an inventory of 13～20 agency paths, youth transition flags, and route-entry timing before changes.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage10-baseline-audit.md`
- [ ] Add repro script `scripts/runStage10BaselineAudit.ts`（只读盘点，不改 gameplay）
- [ ] Document ages {13,14,16,18,20} palette：`resolveChildhoodActionPalette` age>12 分支、`getMinimumActions`、headless planning 调用链
- [ ] Sample 35-step runs（四出身）：13～20 步数占比、planning action id 分布
- [ ] Inventory `routeDefinitions.ts` 六条 `ageBand: 0-10` entry vs youth promotion 路径
- [ ] Record `applyYouthTransitionSeeds(12→13)` 四出身 flag 输出
- [ ] 记录 `daily_take_odd_job` 等 age 12+ 配置事件是否越界（§11 Q5）
- [ ] No gameplay code changes（audit script 除外）

### US-002: Youth (13–20) Design Rules Appendix

**Description:** As a designer, I want executable Youth agency rules so implementation and tests share one spec.

**Acceptance Criteria:**

- [ ] 扩展 `docs/designs/p16-stage-agency-rules.md` § Youth (13–20)：moderate 定义、palette ≤5、lite→basic 梯度、允许类别
- [ ] 明确边界：≤12 Stage-9 / 13～20 youth / >20 adult
- [ ] 记录 demonic 例外 carryover
- [ ] 在 baseline audit 附录交叉引用 US-001 发现（age 13 五 basic 齐出问题）
- [ ] No runtime gameplay changes

### US-003: Youth Palette Resolver & Engine Wiring

**Description:** As a developer, I want a youth-tier action palette wired into the planning path for ages 13～20.

**Acceptance Criteria:**

- [ ] `YOUTH_MAX_AGE = 20`；新增 `resolveYouthActionPalette`（per US-002）
- [ ] `resolveChildhoodActionPalette`：13～20 → youth resolver；>20 → `getMinimumActions()`；≤12 不变
- [ ] `GameEngineIntegration.getAvailableActiveActions` 接入 youth 分支
- [ ] `lateChildhoodAgencyStage9Tests` 回归 PASS
- [ ] Typecheck passes; tests pass

### US-004: Youth Agency Matrix Tests & CI Gate

**Description:** As a maintainer, I want automated proof that youth planning meets P16 moderate agency bar.

**Acceptance Criteria:**

- [ ] 新增 `tests/youthAgencyStage10Tests.ts`；接入 `runRealTestGate.ts`
- [ ] Matrix：四出身 × ages {13…20} × 20 ticks → **0** 五类 `action_*_basic` 同 tick 齐出
- [ ] 每 cell ≥1 training/study；每出身 ≥1 cell 可见 business/travel/socializing（对比 8～12）
- [ ] Save `docs/test-reports/youth-agency-stage10.md`；`npm run gate:p16` pass
- [ ] Typecheck passes; tests pass

### US-005: Route Definitions ageBand Alignment (13–20)

**Description:** As a maintainer, I want P9 route entry signals to declare youth window 13～20, not childhood 0～10.

**Acceptance Criteria:**

- [ ] `routeDefinitions.ts` 六条 entry `ageBand`：`0-10` → **`13-20`**
- [ ] `npm run gate:p11-scheduling` decision ≠ fail
- [ ] 记录 config diff 于 `youth-route-entry-timing-stage10.md` § config
- [ ] Typecheck passes; tests pass

### US-006: Route-Entry Timing Unit Tests

**Description:** As a maintainer, I want proof that `p9_early_*` cannot be set by childhood gameplay before age 13.

**Acceptance Criteria:**

- [ ] 扩展 `p16OriginDestinyTests` 或新增 `youthRouteEntryTimingStage10Tests.ts`
- [ ] ages {8,10,12} palette 路径不得新增 `p9_early_*` focus flags
- [ ] `applyYouthTransitionSeeds(12→13)` 四出身期望；`testYouthRouteEntryPromotion` 回归 PASS
- [ ] 完成 `docs/test-reports/youth-route-entry-timing-stage10.md`
- [ ] Typecheck passes; tests pass

### US-007: 8～12 Origin Spine Minimum Pack (Stage-9 Carryover, P1 Deferrable)

**Description:** As a player, I want late childhood formal beats that reflect my origin.

**Acceptance Criteria:**

- [ ] 四主出身各 ≥1 条 8～12 spine/story_event；过 gate 校验
- [ ] `spineOriginIsolationTests` 8～12：**0** foreign exclusive
- [ ] Save `docs/test-reports/late-childhood-spine-content-stage10.md`
- [ ] **Deferrable** if US-004 + US-006 meet bar

### US-008: Final Playtest 13–20 Columns

**Description:** As a maintainer, I want the opening playtest harness to observe youth-band ticks.

**Acceptance Criteria:**

- [ ] 扩展 `runEarlyChildhoodFinalPlaytest.ts`：13～20 步数 / planning 列
- [ ] 更新 `early-childhood-opening-experience-final-playtest.md` Stage-10 row
- [ ] gap ≤2、8～12 bleed=0、连出 ≤2 门禁不变
- [ ] Typecheck passes; tests pass

### US-009: Extended Playtest & Stage-10 Closure

**Description:** As a product owner, I want closure tying youth agency, route timing, and opening run metrics.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage10-closure.md`
- [ ] References US-001～US-008（US-007 defer/waive 注明）
- [ ] Stage-5/6/7/8/9 non-regression command snippets
- [ ] Lists Stage-11 candidates
- [ ] No gameplay code in this story

## 5. Functional Requirements

- **FR-1:** Ages 13～20 planning must use youth-tier palette policy, not unfiltered `getMinimumActions()`.
- **FR-2:** Ages 8～12 must retain Stage-9 suppressed-category behavior（0 bleed regression）.
- **FR-3:** Route entry flags classified as youth entry must not be set by childhood gameplay paths before age 13.
- **FR-4:** `applyYouthTransitionSeeds` at 12→13 remains the canonical promotion path for deferred upbringing → `p9_early_*`.
- **FR-5:** Stage-8 gap ≤2 and Stage-9 8～12 agency contracts remain mandatory in final playtest.

## 6. Non-Goals

- **21+** adult agency 微调（高 agency 池已存在；仅确保 youth 不抢跑）
- Trait-line / poor / street **内容量** 扩展（Stage-11）
- Browser 实机主观 **★ 分** CI 治理（Stage-11）
- 重写 0～7 infant / preschool 链（Stage-3/5/8）
- 合并 trait 与 `origin_background` UI
- 全局 `selectEvent` 架构重写
- Youth **spine 内容** 大批量扩写（本 Stage 以 agency + route timing 为主；US-004 最小包 optional）

## 7. Design Considerations

**Primary touchpoints:**

| 区域 | 文件 |
| --- | --- |
| Stage agency | `src/p16/childhoodAgency.ts` |
| Headless 规划 | `src/headless/session/HeadlessEngineSessionImpl.ts` |
| Active actions | `src/core/GameEngineIntegration.ts`, `src/data/activeActionCatalog.ts`, `src/data/childhoodActionCatalog.ts` |
| Youth transition | `applyYouthTransitionSeeds`, `promoteYouthRouteEntryFromUpbringing` |
| Route config | `src/narrative/config/routeDefinitions.ts` |
| P8 persona seeds | `src/p8/personaYouthRouteSeeds.ts`, `tests/GameProcessSimulator.ts` |
| 终验 | `scripts/runEarlyChildhoodFinalPlaytest.ts` |
| CI | `tests/runRealTestGate.ts`, `tests/p16OriginDestinyTests.ts`, `gate:p16` |

**P16 Youth 设计意图（摘自 agency rules）：**

| 维度 | 13～20 目标 |
| --- | --- |
| Agency 等级 | **Moderate** — 路线探索起步 |
| 主动驱动 | Training focus、social seeds、mentor encounters（formal + active 协同） |
| 与 8～12 差异 | business / travel / socializing **解禁**；但非 21+ 全量战略 |
| 与 21+ 差异 | 限制 palette 宽度与 basic 动作曝光节奏 |

## 8. Success Metrics

| 指标 | Stage-9 后 baseline | Stage-10 目标 |
| --- | --- | --- |
| 8～12 suppressed action bleed | **0%** | **0%**（不回归） |
| 13～20 full-adult-basic same-tick dump | 未专项测（推定高） | **0%** matrix cells |
| `p9_early_*` before age 13 (gameplay path) | 未专项测 | **0** violations |
| Route entry ageBand config | `0-10` | **`13-20`** aligned |
| Gap 步 / 35 / 出身 | 2/2/2/0 | **≤2**（不回归） |
| Passive/spine/trait bleed | 0 | **0** |
| 四出身启发式评分 | ★★★★☆ | **不回归** |

## 9. Risks and Rollback

| 风险 | 缓解 |
| --- | --- |
| Youth palette 过窄导致 planning 空池 | US-004 矩阵 + ≥1 training/study 断言 |
| routeDefinitions ageBand 变更影响 P11 gate | US-005 跑 `gate:p11-scheduling` + US-004 `gate:p16` |
| 13 岁仍像童年 lite 池 | US-002 定义 lite→basic 梯度；US-004 断言 business/travel 可见 |
| US-007 范围膨胀 | P1 deferrable；最小 1 条/出身 |

**回滚：** revert US-003 palette resolver; revert US-005 routeDefinitions ageBand; keep US-001 audit.

## 10. Story Priority

```
US-001 → US-002 → US-003 → US-004
              ↘ US-005 → US-006
US-007 (P1 optional, parallel after US-004)
US-008 → US-009
```

US-005 可与 US-003/US-004 并行；US-009 必须 US-004 + US-006 + US-008 完成后执行。

## 11. Open Questions

| # | 问题 | 建议默认 |
| --- | --- | --- |
| Q1 | 13～20 是否拆 palette 子 band（13～15 / 16～20）？ | **P1 可选**；US-002 先验证单 band ≤5 categories |
| Q2 | US-004（8～12 spine）是否 P0？ | **P1 deferrable**；youth agency 优先 |
| Q3 | 终验是否扩 13～20 观测列？ | **是**，加报告列，不改 35 步主门禁 |
| Q4 | Youth 是否引入 youth-only lite action ids？ | **US-001 后定**；优先复用 childhood lite + 受限 basic |
| Q5 | `daily_take_odd_job` age 12+ 是否纳入 youth 审计？ | **是**，在 US-001 记录；config 调整放 US-002 若违规 |

---

**状态：** 待审批（规划稿 · 2026-06-22）
