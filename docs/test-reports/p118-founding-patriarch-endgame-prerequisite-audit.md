# P118 Founding Patriarch Endgame Prerequisite Audit

> **Date:** 2026-07-02
> **Stage:** P118 Wuxia Founding Patriarch Endgame Design-First
> **Route:** `founding_patriarch`（开派祖师）
> **Gaps addressed:** GAP-P117-N01, GAP-P117-N02, GAP-P117-N03
> **Story:** P118-001 (read-only; no runtime changes)

---

## 1. Executive Summary

本审计汇总 `founding_patriarch` 路线在 endgame 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。P117 已完成 late-life runtime；两个 pressure-driven 分支各有 stat、identity、表达分化。Endgame 阶段缺失的是 endgame echo 事件、`founding_patriarch_endgame_echo_done` checkpoint、endgame 表达 tier 与 P119 proof。

**结论：** Founding-patriarch 路线已具备进入 endgame 设计的坚实基础——P113–P117 共 6 个阶段完整落地。`founding_patriarch_late_life_done` + 二选一 `founding_patriarch_late_*` marker 作为明确上游 gate；表达面已按 late-life branch 分化 goal / cost label / identity。Endgame 可读取 late-life markers 延续叙事，参照 patron P111/P112 与 renown P80/P81 模式。

---

## 2. Founding-Patriarch Route Flag & Marker Inventory (P113–P117)

### 2.1 Checkpoint Flags (Stage Gates)

| Flag | Stage | Set By | Purpose |
|------|-------|--------|---------|
| `founding_patriarch_bridge_crossed` | Bridge (P113) | `founding_patriarch_bridge_entry` | Bridge 终态 guard |
| `founding_patriarch_on_ramp_done` | Entry (P113) | entry choices | On-ramp 检查点 |
| `founding_patriarch_midlife_pressure_done` | Pressure (P115) | `founding_patriarch_midlife_pressure` | Pressure 检查点 |
| `founding_patriarch_payoff_done` | Payoff (P113) | `founding_patriarch_payoff_echo` | Payoff 检查点 |
| `founding_patriarch_identity_done` | Payoff (P113) | payoff choices | Payoff identity 终态 |
| `founding_patriarch_late_life_done` | Late-life (P117) | `founding_patriarch_late_life_*` | **Late-life 检查点；endgame 直接上游** |
| `founding_patriarch_late_life_identity_done` | Late-life (P117) | same | Late-life 身份深化 |
| `founding_patriarch_endgame_echo_done` | *(reserved, not set)* | P119+ (planned) | **Endgame echo 检查点** |

### 2.2 Branch / Identity Markers

| Marker | Stage | Branch | Purpose |
|--------|-------|--------|---------|
| `founding_patriarch_on_ramp_scholar` | Entry (P113) | Scholar 变体 | Entry variant |
| `founding_patriarch_on_ramp_alliance` | Entry (P113) | Alliance 变体 | Entry variant |
| `founding_patriarch_pressure_rule_first` | Pressure (P115) | A: 守规治学优先 | Pressure choice A；late-life Branch A key |
| `founding_patriarch_pressure_alliance_first` | Pressure (P115) | B: 续盟扩责优先 | Pressure choice B；late-life Branch B key |
| `founding_patriarch_payoff_legacy_holder` | Payoff (P113) | A: 续责如山 | Payoff choice A（表达修饰） |
| `founding_patriarch_payoff_independent_founder` | Payoff (P113) | B: 自立山门 | Payoff choice B（表达修饰） |
| `founding_patriarch_payoff_dual_gate` | Payoff (P113) | C: 双门并立 | Payoff choice C（表达修饰） |
| `founding_patriarch_late_rule_keeper` | Late-life (P117) | A: 门规守成终老 | **Endgame Branch A key** |
| `founding_patriarch_late_alliance_bearer` | Late-life (P117) | B: 盟约续责终老 | **Endgame Branch B key** |

**Total:** 8 checkpoint flags + 10 stage/branch markers = 18 flags（含 endgame reserved）

---

## 3. Founding-Patriarch Route Event Inventory

### 3.1 Spine Events (`sample-lines-spine.json`)

| Event ID | Type | Age | Stage | Branch |
|----------|------|-----|-------|--------|
| `founding_patriarch_bridge_entry` | Choice (2 options) | 32–38 | Entry | scholar / alliance |
| `founding_patriarch_midlife_pressure` | Choice (2 branches) | 40–45 | Pressure | rule_first / alliance_first |
| `founding_patriarch_payoff_echo` | Choice (3 branches) | 48–52 | Payoff | A/B/C |
| `founding_patriarch_late_life_rule_keeper` | **Auto** | 52–56 | Late-life | A: 门规守成终老 |
| `founding_patriarch_late_life_alliance_bearer` | **Auto** | 52–56 | Late-life | B: 盟约续责终老 |

**Total:** 5 events（1 entry + 1 pressure + 1 payoff + 2 late-life auto）

**Gap:** Spine 在 late-life 后无 endgame echo 事件；`founding_patriarch_endgame_echo_done` 未接线。

---

## 4. Expression Surface Inventory

### 4.1 Sample Line Expression (`src/p50/sampleLineExpression.ts`)

| Surface | Function | Stages Covered |
|---------|----------|----------------|
| Current goal | `orthodoxCurrentGoal()` | On-ramp → Pressure → Payoff → Late-life |
| Cost label | `deriveSampleLineCostLabel()` | On-ramp → Pressure → Payoff → Late-life |
| Age-40 identity | `orthodoxAge40Identity()` | Payoff → Late-life |

**Expression priority (P117 confirmed):**
1. `founding_patriarch_late_life_done` > `founding_patriarch_payoff_done` > `founding_patriarch_midlife_pressure_done` > on-ramp
2. Within late-life: late-life branch marker > pressure marker > payoff choice marker > on-ramp variant

**Endgame gap:** 表达层无 `founding_patriarch_endgame_echo_done` gate；late-life 表达在 endgame 后不会继续演化（frozen at late-life tier）。

---

## 5. Two Late-Life Branch State Differences (Post-P117)

### 5.1 Stat Differences

| Dimension | rule_keeper (A) | alliance_bearer (B) |
|-----------|-----------------|---------------------|
| **Stat 变化** | reputation +2, connections +1, martialPower +1 | reputation +3, connections +2, martialPower 0 |
| **Late-life marker** | `founding_patriarch_late_rule_keeper` | `founding_patriarch_late_alliance_bearer` |
| **Pressure root** | `founding_patriarch_pressure_rule_first` | `founding_patriarch_pressure_alliance_first` |
| **Cost label** | 门规守成之累 | 盟约续责之累 |
| **Current goal** | 守门规至终，治学师承不能断 | 守盟约至终，诸派续责不能推 |
| **Identity** | 门规守成的开宗祖师… | 盟约续责的开宗祖师… |
| **叙事调性** | 沉稳守成——门规立派终老 | 疲惫续责——盟约立派终老 |

### 5.2 Branch Differentiation Check

两个分支有实质差异——stat 分布不同、late-life marker 不同、cost label 不同、goal 不同、identity 不同、叙事调性不同。不是换皮。

---

## 6. What Exists Before Endgame (Reusable Assets)

### 6.1 Gating Surfaces

- **Upstream gate:** `founding_patriarch_late_life_done` — P117 late-life 检查点，endgame 事件的直接前置
- **Branch key:** 二选一 `founding_patriarch_late_*` marker — endgame 分支逻辑 key（与 patron P111 模式对称）
- **Pressure lineage:** `founding_patriarch_pressure_*` marker 仍保留，可作为 fallback
- **Payoff modifier:** 三选一 `founding_patriarch_payoff_*` marker — endgame 表达可叠加 payoff 风味（P119 bonus）
- **Entry variant markers:** scholar / alliance on-ramp flag — endgame 表达可叠加 entry 风味（P119 bonus）
- **Terminal guards:** orthodox/demonic/merchant exclusivity、endgame once guard

### 6.2 Expression Carriers (endgame 更新载体)

- `orthodoxCurrentGoal()` — P0 endgame signal（gate: `endgame_echo_done` > `late_life_done`）
- `deriveSampleLineCostLabel()` — P0 endgame signal
- `orthodoxAge40Identity()` — P0 endgame identity 深化（endgame marker > late-life marker）

### 6.3 Tests & Proof Artifacts

| Artifact | Location | Coverage |
|----------|----------|----------|
| P113 bridge tests | `tests/p113FoundingPatriarchBridgeTests.ts` | Entry + payoff wiring |
| P115 pressure tests | `tests/p115FoundingPatriarchMidlifePressureTests.ts` | Pressure gate + branch markers |
| P117 late-life tests | `tests/p117FoundingPatriarchLateLifeTests.ts` | R1–R30 + 12-criteria |
| P117 closure | `docs/test-reports/p117-founding-patriarch-late-life-closure-report.md` | 12/12 closed |
| P37 parity | `tests/p37AdditionalMixedPinnacleParityTests.ts` | Non-regression |
| P102–P112 patron | Various patron tests | Non-regression |
| Typecheck | `npm run typecheck` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 7. Endgame Precedent Comparison

### 7.1 Patron Endgame (P111→P112)

| Aspect | Value | Founding-Patriarch Relevance |
|--------|-------|------------------------------|
| Event type | Single auto echo with 3 variants | **推荐对齐**（founding 用 2 variants） |
| Core narrative | 商武名号与盟约如何收官 | Founding：开派名号与门规/盟约遗产如何收官 |
| Upstream gate | `merchant_patron_late_life_done` | 对称：`founding_patriarch_late_life_done` |
| Branch key | `merchant_patron_late_*` | 对称：`founding_patriarch_late_*` |
| Age range | 60–65 | **推荐对齐** |
| Checkpoint | `endgame_echo_done` + `endgame_identity_done` | 对称模式 |
| Stats | None | **推荐对齐** |
| Expression | endgame_done > late_life_done | 可复用 gate 顺序 |

### 7.2 Renown Endgame (P80→P81)

| Aspect | Value | Founding-Patriarch Relevance |
|--------|-------|------------------------------|
| Event type | Single auto echo with 3 variants | 结构参考（founding 2 variants） |
| Core narrative | 江湖如何记住你 | Founding：山门如何记住开派祖师 |
| Upstream gate | `renown_late_life_done` | 对称：`founding_patriarch_late_life_done` |
| Age range | 60–65 | 推荐对齐 |
| Stats | None | 推荐对齐 |

### 7.3 Magnate Endgame (P100)

| Aspect | Value | Founding-Patriarch Relevance |
|--------|-------|------------------------------|
| Event type | Auto echo (ledger/caravan/generic) | 结构参考 |
| Core narrative | 巨贾终局回响 | Founding 用门规/盟约/书斋/山门主题，非守成传承 |
| Branch key | P99 `magnate_native_late_*` | Founding 用 P117 late-life markers（2-choice pressure lineage） |

### 7.4 Founding-Patriarch-Unique Opportunities

| Dimension | Renown | Magnate | Patron | Founding-Patriarch (unique) |
|-----------|--------|---------|--------|----------------------------|
| Core theme | 名声 / 江湖记忆 | 守成 / 商路传承 | 商武一体 / 盟约终局 | **开派治理 / 门规盟约遗产** |
| Scene anchor | 酒肆门槛 | 商铺/商路 | 账房与演武场 | **山门与书斋** |
| Endgame question | 江湖怎么记住你 | 巨贾名号怎么收官 | 商武名号怎么收官 | **开派名号与门规/盟约怎么收官** |
| Branch A echo | 名声比人长久 | 账本守成 | 盟约担子比人长久 | **门规比人长久** |
| Branch B echo | 传说真假参半 | 跑货传奇 | 孤商名号自立 | **盟约比人长久** |

---

## 8. What Is Missing (P118 / P119 Target)

| Gap | ID | Description |
|-----|-----|-------------|
| No endgame spine event | GAP-P117-N01 | Spine 在 late-life 后无 endgame echo 事件 |
| No endgame checkpoint | GAP-P117-N02 | `founding_patriarch_endgame_echo_done` 未接线 |
| No endgame branch markers | GAP-P117-N03 | 无 `founding_patriarch_endgame_*` markers |
| No endgame expression tier | GAP-P118-01 | goal / cost label / identity 无 endgame 分支 |
| Late-life markers unused downstream | GAP-P117-N03 | P117 `founding_patriarch_late_*` 无 endgame consumer |
| No endgame tests | GAP-P118-02 | 无 endgame 链路 proof 或 regression |

---

## 9. Foundation Strength Assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| Route depth | ✅ Strong | 6 stages (bridge → on-ramp → pressure → payoff → late-life) |
| Branch structure | ✅ Strong | 2 distinct late-life branches with full expression |
| Upstream gates | ✅ Ready | `late_life_done` + late-life markers wired |
| Endgame interface | ✅ Reserved | `founding_patriarch_endgame_echo_done` defined in contract, not set |
| Test coverage | ✅ Strong | P113/P115/P117 tests + 12-criteria closure |
| Precedent patterns | ✅ Clear | Patron P111/P112 + renown P80/P81 + magnate P100 provide templates |

**Foundation strength: ✅ Strong — ready for endgame design-first contract.**

---

**P118-001 complete.**
