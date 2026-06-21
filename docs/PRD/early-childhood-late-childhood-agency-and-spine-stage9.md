# PRD: 童年晚期 Agency 与 Spine 密度（Stage-9 · 8～12 岁）

## 1. Introduction

Stage-1～8 已将 **0～7 岁** agency、passive/spine/trait 隔离、neutral passive 去重与 gap 收口验收为 **PASS**（`docs/test-reports/early-childhood-opening-experience-final-playtest.md`）。35 步 headless 终龄常 **>7**，玩家会进入 **8～12 岁** band，但本套件此前仅做 **gate 防御**（Stage-7 US-002），未系统验收 P16 受限主动形态与出身叙事密度。

Stage-8 closure §5 与 Stage-7 US-006（P2）遗留：

| 遗留项 | 现状 | Stage-9 动作 |
| --- | --- | --- |
| **8～12 P16 agency** | `CHILDHOOD_MAX_AGE=12`；8+ palette max 4 categories；营商/游历抑制依赖 runtime，缺专项 headless 矩阵 | 审计 + 硬化 + 验收 |
| **8～12 spine 密度** | catalog 8～12 overlap **15** 事件，**0** 四主 exclusive（Stage-7 audit）；多为 neutral / p9 童年 echo | 可选出身向 spine 最小包 |
| **Neutral spine dedup** | Stage-7 US-006 **P2 延后** | 正式 id-family 重复调权 |
| **被动同标题连出** | 终验 **PARTIAL**（边疆 max=3，目标 ≤2） | 若 US-005 后仍 PARTIAL，纳入 passive 去重扩展 |

**设计真源（待 US-001 后定稿）：** `docs/designs/p16-stage-agency-rules.md`（8～12 allowlist）+ Stage-7 baseline audit  
**套件索引：** `docs/PRD/early-childhood-opening-experience-index.md`  
**前置 closure：** `docs/test-reports/early-childhood-stage8-closure.md`

## 2. Goals

- **8～12 岁** headless/API 路径符合 P16：**training / study** 可入池；**business / travel / socializing** 抑制（demonic 等显式例外除外）
- 8～12 spine 选择 **0 bleed**（Stage-7 回归）；可选加厚 **出身向** spine，减少 neutral 占位感
- Neutral **spine id** 重复率 ≤ Stage-7 baseline（US-006 指标）
- 35 步终验 **被动同标题连出 ≤2** 四出身 **PASS**（若 Stage-8 后仍 PARTIAL）
- Stage-5/6/7/8 隔离与 gap 门禁 **不回归**
- 验收写入 `docs/test-reports/`；**不产出 `.prd.json`**

## 3. 冻结决策

- **Hard filter 优先**（延续 Stage-5～7）；8～12 不降低 `isSpineOriginEligible` / `isTraitLineSpineEligible`
- **Agency 真源：** `docs/designs/p16-stage-agency-rules.md` § Late Childhood (8–12)；不得引入 13+ 路线入口 flag（`p9_early_*` 等）的新 childhood 触发
- **Palette 上限：** age 8～12 维持 `resolveChildhoodActionPalette` max **4** categories；5～7 仍为 **2**（不回归 Stage-4）
- **8～12 spine 内容：** 新增事件必须带正确 origin / trait 条件；禁止 foreign OR 填池
- **Neutral spine dedup：** 仅调 **合法池内** 权重/重复惩罚；不改变 eligibility 与 daily gate 顺序
- **Passive 连出：** 优先扩 dedup window 或 8+ band 专用 passive catalog；**不**绕过 origin isolation
- **终验脚本：** 可扩展 `runEarlyChildhoodFinalPlaytest.ts` 报告 8～12 观测列；**不**降低 Stage-8 gap ≤2 门禁
- **不产出 `.prd.json`**

## 4. User Stories

### US-001: Stage-9 Baseline Audit (Read-Only)

**Description:** As a maintainer, I want an inventory of 8～12 agency paths, spine pools, and repetition metrics before changes.

**Acceptance Criteria:**

- [ ] Create `docs/test-reports/early-childhood-stage9-baseline-audit.md`
- [ ] Document 8～12 action palette resolution: `resolveChildhoodActionPalette`, headless planning branch, suppressed category set
- [ ] Reconcile Stage-7 §2 8～12 spine inventory; note new entries since Stage-7
- [ ] Sample 35-step runs: ages 8～12 步数占比、formal vs daily vs planning 比例（四出身）
- [ ] Record neutral spine id repetition baseline for US-004（e.g. `childhood_summary`, p9 childhood echo ids）
- [ ] Record passive title consecutive failures from latest final playtest（边疆 max=3 等）
- [ ] No gameplay code changes

### US-002: 8～12 P16 Agency Guardrails

**Description:** As a player aged 8～12, I want age-appropriate actions only—training and study, not adult commerce or travel—unless an explicit narrative exception applies.

**Acceptance Criteria:**

- [ ] Headless matrix: four origins × ages **{8,9,10,11,12}** × 20 planning ticks → **0** suppressed action ids（`business`, `travel`, `socializing` adult catalog）in action records
- [ ] Assert **≥1** allowlisted action（training or study lite）offered when planning is active
- [ ] Optional age sub-bands 8～9 vs 10～12: document palette id differences if implemented
- [ ] Save `docs/test-reports/late-childhood-agency-stage9.md`
- [ ] `npm run gate:p16` pass（若覆盖 childhood agency）
- [ ] Typecheck passes; tests pass

### US-003: 8～12 Origin-Flavored Spine Minimum Pack (Optional P1)

**Description:** As a player, I want late childhood formal beats that reflect my origin, not only neutral childhood_summary echoes.

**Acceptance Criteria:**

- [ ] Add **≥1** origin-exclusive or origin-weighted spine/story_event per four-main origin for age band **8～12**（config path per Stage-6/7 conventions）
- [ ] Each passes `isSpineOriginEligible` + `validateSpineOriginConfig`
- [ ] `spineOriginIsolationTests` 8～12 matrix: **0** foreign exclusive ids
- [ ] Save manifest in `docs/test-reports/late-childhood-spine-content-stage9.md`
- [ ] **Deferrable:** if audit shows product bar met with neutral-only pool + agency fix

**Priority:** P1 — may defer if US-002 + US-004 meet bar without new catalog

### US-004: Neutral Spine Repetition Tuning (Stage-7 US-006 Carryover)

**Description:** As a maintainer, I want reduced repetition among neutral spine ids during ages 0～12.

**Acceptance Criteria:**

- [ ] Extend formal repetition / profile pressure for neutral spine id families listed in US-001 audit
- [ ] 35-step headless sample: neutral spine id repetition rate **≤** US-001 baseline
- [ ] Save `docs/test-reports/neutral-spine-repetition-stage9.md`
- [ ] **Regression:** `spineOriginIsolationTests` + daily gate tests pass
- [ ] Typecheck passes; tests pass

**Priority:** P2 — ship if US-001 shows repetition above bar; else document waive in closure

### US-005: Passive Title Consecutive Hardening (If Still PARTIAL)

**Description:** As a player, I want passive narrative titles not to repeat more than twice in a row across the opening run.

**Acceptance Criteria:**

- [ ] Re-run `npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts`; if all origins **maxConsecutivePassiveTitle ≤2**, mark story **waived** in closure
- [ ] If **PARTIAL:** extend dedup（e.g. raise `NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW`, or 8+ passive title history）without breaking Stage-5 isolation
- [ ] Unit test: forced repeat scenario → consecutive **≤2**
- [ ] Update `docs/test-reports/neutral-passive-dedup-stage7.md` appendix or `neutral-passive-dedup-stage9.md`
- [ ] Typecheck passes; tests pass

### US-006: Extended Playtest & Stage-9 Closure

**Description:** As a product owner, I want closure tying agency, spine, dedup, and opening run metrics.

**Acceptance Criteria:**

- [ ] Re-run `npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts`; update final playtest with Stage-9 row（8～12 观测 + 连出 + gap 回归）
- [ ] Create `docs/test-reports/early-childhood-stage9-closure.md`
- [ ] References US-001～US-005 artifacts
- [ ] Confirms Stage-5/6/7/8 non-regression with command snippets
- [ ] Lists Stage-10 candidates（13+ youth band, trait content volume, browser 实机 ★ 分）
- [ ] No code in this story

## 5. Functional Requirements

- **FR-1:** Ages 8～12 planning must not surface adult-framed minimum actions blocked by P16 childhood policy.
- **FR-2:** All spine selection paths for age ≤12 must retain Stage-7 gate behavior.
- **FR-3:** New 8～12 spine content must pass origin/trait config validation before merge.
- **FR-4:** Neutral spine dedup must not reintroduce foreign-origin bleed or skip gap fallback.
- **FR-5:** Stage-8 gap ≤2 and bleed=0 contracts remain mandatory in final playtest.

## 6. Non-Goals

- 13～20 youth agency 与路线分叉（P16 全生命周期）
- 重写 0～7 infant / preschool 链（Stage-3/5/8）
- 合并 trait 与 `origin_background` UI
- 全局 `selectEvent` 架构重写
- Browser 实机主观 ★ 分治理（可 Stage-10 单列）
- `.prd.json`

## 7. Design Considerations

**Primary touchpoints:**

| 区域 | 文件 |
| --- | --- |
| Childhood agency | `src/p16/childhoodAgency.ts` |
| Headless 规划 | `src/headless/session/HeadlessEngineSessionImpl.ts` |
| Formal / daily 选择 | `src/core/GameEngineIntegration.ts`, `DailyEventSystem.ts` |
| Spine gate | `src/p16/spineOriginIsolation.ts` |
| Passive 去重 | `src/data/preschoolPassiveSpine.ts` |
| 8～12 内容 | `childhoodEvents.ts`, `p22-content-expansions.json`, story catalogs |
| 终验 | `scripts/runEarlyChildhoodFinalPlaytest.ts` |
| CI | `tests/runRealTestGate.ts`, `gate:p16` |

## 8. Success Metrics

| 指标 | Stage-8 后 baseline | Stage-9 目标 |
| --- | --- | --- |
| Suppressed action bleed (8～12) | 未专项测 | **0%** |
| Foreign exclusive spine (8～12) | 0% | **0%** |
| Gap 步 / 35 / 出身 | 2/2/2/0 | **≤2**（不回归） |
| Passive/spine/trait bleed | 0 | **0** |
| Passive title consecutive | PARTIAL（边疆 3） | **≤2** 四出身 |
| Neutral spine id repetition | Stage-7 baseline | **≤ baseline** |
| 四出身启发式评分 | ★★★★☆ / ★★★☆☆ | **不回归** |

## 9. Risks and Rollback

| 风险 | 缓解 |
| --- | --- |
| 8～12 palette 过宽 | US-002 矩阵 + P16 allowlist 单测 |
| 新 spine 误触 foreign | config validation + isolation tests |
| Dedup 导致 gap 回升 | 回退顺序不变；gap 优于重复 |
| US-003 范围膨胀 | P1 可 defer；最小 1 条/出身 |

**回滚：** revert US-002 palette changes; revert US-004 weighting; keep US-001 audit.

## 10. Story Priority

```
US-001 → US-002 → US-003 ∥ US-004 → US-005 → US-006
```

US-003 与 US-004 可并行；US-005 仅在终验仍 PARTIAL 时实施；US-006 必须 US-002 完成后跑。

## 11. Open Questions

| # | 问题 | 建议默认 |
| --- | --- | --- |
| Q1 | 8～12 是否拆分 palette 子 band（8～9 / 10～12）？ | **P1 可选**；US-002 先验证现网 4-category |
| Q2 | US-003 是否 P0？ | **P1 deferrable**；agency + dedup 优先 |
| Q3 | 终验是否扩步数观测 8～12？ | **是**，加报告列，不改 35 步主门禁 |
| Q4 | demonic `travel` age 5～9 例外是否保留？ | **是**，P16 既有例外；8～12 不扩新例外 |

---

**状态：** 已验收（Stage-9 closure PASS · 2026-06-21）
