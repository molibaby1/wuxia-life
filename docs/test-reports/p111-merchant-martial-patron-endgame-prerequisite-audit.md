# P111 Merchant Martial Patron Endgame Prerequisite Audit

> **Date:** 2026-07-02
> **Stage:** P111 Wuxia Merchant Martial Patron Endgame Design-First
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Gaps addressed:** GAP-P110-N01
> **Story:** P111-001 (read-only; no runtime changes)

---

## 1. Executive Summary

本审计汇总 `merchant_martial_patron` 路线在 endgame 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。P110 已完成 late-life runtime；三个 payoff-driven 分支各有 stat、identity、表达分化。Endgame 阶段缺失的是 endgame echo 事件、`merchant_patron_endgame_echo_done` checkpoint、endgame 表达 tier 与 P112 proof。

**结论：** Patron 路线已具备进入 endgame 设计的坚实基础——P102–P110 共 6 个阶段完整落地。`merchant_patron_late_life_done` + 三选一 `merchant_patron_late_*` marker 作为明确上游 gate；表达面已按 late-life branch 分化 goal / cost label / identity。Endgame 可读取 late-life markers 延续叙事，参照 renown P80→P81 与 magnate P100 模式。

---

## 2. Patron Route Flag & Marker Inventory (P102–P110)

### 2.1 Checkpoint Flags (Stage Gates)

| Flag | Stage | Set By | Purpose |
|------|-------|--------|---------|
| `merchant_patron_bridge_crossed` | Bridge (P102+) | `merchant_patron_bridge_entry` | Bridge 终态 guard |
| `merchant_patron_on_ramp_done` | Entry (P102+) | entry choices | On-ramp 检查点 |
| `merchant_patron_midlife_pressure_done` | Pressure (P106) | `merchant_patron_midlife_pressure` | Pressure 检查点 |
| `merchant_patron_payoff_done` | Payoff (P108) | `merchant_patron_payoff_echo` | Payoff 检查点 |
| `merchant_patron_identity_done` | Payoff (P108) | payoff choices | Payoff identity 终态 |
| `merchant_patron_late_life_done` | Late-life (P110) | `merchant_patron_late_life_*` | **Late-life 检查点；endgame 直接上游** |
| `merchant_patron_late_life_identity_done` | Late-life (P110) | same | Late-life 身份深化 |
| `merchant_patron_endgame_echo_done` | *(reserved, not set)* | P112+ (planned) | **Endgame echo 检查点** |

### 2.2 Branch / Identity Markers

| Marker | Stage | Branch | Purpose |
|--------|-------|--------|---------|
| `merchant_patron_on_ramp_orthodox` | Entry (P102) | Native 侠义盟约 | Entry variant |
| `merchant_patron_on_ramp_martial` | Entry (P102) | Native 武力护商 | Entry variant |
| `merchant_patron_bridge_apprentice_craft` | Entry (P103) | 学徒 bridge | Entry variant |
| `merchant_patron_bridge_tavern_network` | Entry (P103) | 酒肆 bridge | Entry variant |
| `merchant_patron_bridge_peasant_grain` | Entry (P104) | 农人 bridge | Entry variant |
| `merchant_patron_payoff_covenant_holder` | Payoff (P108) | A: 硬扛盟约 | Payoff choice A |
| `merchant_patron_payoff_covenant_breaker` | Payoff (P108) | B: 撕破盟约 | Payoff choice B |
| `merchant_patron_payoff_balancer` | Payoff (P108) | C: 商武平衡 | Payoff choice C |
| `merchant_patron_late_covenant_bound` | Late-life (P110) | A: 盟约绑紧 | **Endgame Branch A key** |
| `merchant_patron_late_isolated_merchant` | Late-life (P110) | B: 自由孤立 | **Endgame Branch B key** |
| `merchant_patron_late_sustainable_covenant` | Late-life (P110) | C: 新盟可持续 | **Endgame Branch C key** |

**Total:** 8 checkpoint flags + 11 stage/branch markers = 19 flags（含 endgame reserved）

---

## 3. Patron Route Event Inventory

### 3.1 Spine Events (`sample-lines-spine.json`)

| Event ID | Type | Age | Stage | Branch |
|----------|------|-----|-------|--------|
| `merchant_patron_bridge_entry` | Choice (5 options) | 34–38 | Entry | 5 entry variants |
| `merchant_patron_midlife_pressure` | Choice (6 branches) | 40–44 | Pressure | 6 pressure variants |
| `merchant_patron_payoff_echo` | Choice (3 branches) | 48–52 | Payoff | A/B/C |
| `merchant_patron_late_life_covenant_bound` | **Auto** | 52–56 | Late-life | A: 盟约绑紧 |
| `merchant_patron_late_life_isolated_merchant` | **Auto** | 52–56 | Late-life | B: 自由孤立 |
| `merchant_patron_late_life_sustainable_covenant` | **Auto** | 52–56 | Late-life | C: 新盟可持续 |

**Total:** 6 events（1 entry + 1 pressure + 1 payoff + 3 late-life auto）

**Gap:** Spine 在 late-life 后无 endgame echo 事件；`merchant_patron_endgame_echo_done` 未接线。

---

## 4. Expression Surface Inventory

### 4.1 Sample Line Expression (`src/p50/sampleLineExpression.ts`)

| Surface | Function | Stages Covered |
|---------|----------|----------------|
| Current goal | `merchantCurrentGoal()` | On-ramp → Pressure → Payoff → Late-life |
| Cost label | `deriveSampleLineCostLabel()` | On-ramp → Pressure → Payoff → Late-life |
| Age-40 identity | `merchantAge40Identity()` | Payoff → Late-life |

**Expression priority (P110 confirmed):**
1. Magnate markers win when set
2. `merchant_patron_late_life_done` > `merchant_patron_payoff_done` > pressure > on-ramp
3. Within late-life: late-life branch marker > payoff choice marker > entry variant

**Endgame gap:** 表达层无 `merchant_patron_endgame_echo_done` gate；late-life 表达在 endgame 后不会继续演化（frozen at late-life tier）。

---

## 5. Three Late-Life Branch State Differences (Post-P110)

### 5.1 Stat Differences

| Dimension | covenant_bound (A) | isolated_merchant (B) | sustainable_covenant (C) |
|-----------|---------------------|----------------------|--------------------------|
| **Stat 变化** | martialPower +1, reputation +2, businessAcumen +1 | businessAcumen +3, martialPower -1, reputation 0 | businessAcumen +2, martialPower +1, reputation +2 |
| **Late-life marker** | `merchant_patron_late_covenant_bound` | `merchant_patron_late_isolated_merchant` | `merchant_patron_late_sustainable_covenant` |
| **Cost label** | 盟约终老之累 | 孤商自在之快 | 新盟久立之累 |
| **Current goal** | 守盟约至终，商武名号不能倒 | 商路自分断，不再求山门庇护 | 守新盟规矩，传商武分寸给后来人 |
| **Identity** | 盟约终老的商武金主… | 孤商巨贾… | 新盟掌局的金主… |
| **叙事调性** | 悲剧英雄——盟约如山终老 | 反英雄——断武孤商 | 中庸智者——新盟久立 |

### 5.2 Branch Differentiation Check

三个分支有实质差异——stat 分布不同、late-life marker 不同、cost label 不同、goal 不同、identity 不同、叙事调性不同。不是换皮。

---

## 6. What Exists Before Endgame (Reusable Assets)

### 6.1 Gating Surfaces

- **Upstream gate:** `merchant_patron_late_life_done` — P110 late-life 检查点，endgame 事件的直接前置
- **Branch key:** 三选一 `merchant_patron_late_*` marker — endgame 分支逻辑 key（与 renown P80 模式对称）
- **Payoff lineage:** `merchant_patron_payoff_*` marker 仍保留，可作为 fallback
- **Entry variant markers:** 5 条 entry 变体 flag — endgame 表达可叠加 entry 风味（P112 bonus）
- **Terminal guards:** orthodox/demonic exclusivity、endgame once guard
- **Coexistence:** magnate markers 优先 — endgame 表达须在 magnate 分支之后

### 6.2 Expression Carriers (endgame 更新载体)

- `merchantCurrentGoal()` — P0 endgame signal（gate: `endgame_echo_done` > `late_life_done`）
- `deriveSampleLineCostLabel()` — P0 endgame signal
- `merchantAge40Identity()` — P0 endgame identity 深化（endgame marker > late-life marker）

### 6.3 Tests & Proof Artifacts

| Artifact | Location | Coverage |
|----------|----------|----------|
| P102–P104 bridge tests | `tests/p102–p104*.ts` | Entry paths |
| P106 pressure tests | `tests/p106MerchantMartialPatronPressureTests.ts` | 22 assertions |
| P108 payoff tests | `tests/p108MerchantMartialPatronPayoffTests.ts` | R1–R29 |
| P110 late-life tests | `tests/p110MerchantMartialPatronLateLifeTests.ts` | R1–R29 + 12-criteria |
| P110 closure | `docs/test-reports/p110-merchant-martial-patron-late-life-closure-report.md` | 12/12 closed |
| Typecheck | `npm run typecheck` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 7. Endgame Precedent Comparison

### 7.1 Renown Endgame (P80→P81)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Event type | Single auto echo with 3 variants | **推荐对齐** |
| Core narrative | 江湖如何记住你（身后名之声） | Patron：商武名号如何收官（商武终局回响） |
| Upstream gate | `renown_late_life_done` | 对称：`merchant_patron_late_life_done` |
| Branch key | `tavern_renown_late_*` | 对称：`merchant_patron_late_*` |
| Age range | 60–65 | **推荐对齐** |
| Checkpoint | `renown_endgame_done` + `renown_endgame_identity_done` | 对称模式 |
| Stats | None | **推荐对齐**（endgame 是回响，不是能力变化） |
| Expression | endgame_done > late_life_done | 可复用 gate 顺序 |

### 7.2 Magnate Endgame (P100)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Event type | Auto echo (ledger/caravan/generic) | 结构参考 |
| Core narrative | 巨贾终局回响 | Patron 用商武盟约主题，非守成传承 |
| Upstream gate | `magnate_late_life_done` | 对称：`merchant_patron_late_life_done` |
| Branch key | P99 `magnate_native_late_*` | Patron 用 P110 late-life markers（3-choice payoff lineage） |
| Age range | 58–65 | Patron 推荐 60–65（对齐 renown） |
| Player agency | Auto echo | **推荐对齐** |
| Distinction | 守成/商路/账本 | Patron：盟约/账房/演武场/刀 |

### 7.3 Patron-Unique Opportunities

| Dimension | Renown | Magnate | Patron (unique) |
|-----------|--------|---------|-----------------|
| Core theme | 名声 / 江湖记忆 | 守成 / 商路传承 | **商武一体 / 盟约终局** |
| Scene anchor | 酒肆门槛 | 商铺/商路 | **账房与演武场** |
| Endgame question | 江湖怎么记住你 | 巨贾名号怎么收官 | **商武名号与盟约怎么收官** |
| Branch A echo | 名声比人长久 | 账本守成 | **盟约担子比人长久** |
| Branch B echo | 传说真假参半 | 跑货传奇 | **孤商名号自立** |
| Branch C echo | 智慧传下去 | 规矩传下去 | **新盟规矩传下去** |

---

## 8. What Is Missing (P111 / P112 Target)

| Gap | ID | Description |
|-----|-----|-------------|
| No endgame spine event | GAP-P110-N01 | Spine 在 late-life 后无 endgame echo 事件 |
| No endgame checkpoint | GAP-P111-01 | `merchant_patron_endgame_echo_done` 未接线 |
| No endgame branch markers | GAP-P111-02 | 无 `merchant_patron_endgame_*` markers |
| No endgame expression tier | GAP-P111-03 | goal / cost label / identity 无 endgame 分支 |
| Late-life markers unused downstream | GAP-P110-N01 | P110 `merchant_patron_late_*` 无 endgame consumer |
| No endgame tests | GAP-P111-04 | 无 endgame 链路 proof 或 regression |

---

## 9. Foundation Strength Assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| Route depth | ✅ Strong | 6 stages (bridge → entry → pressure → payoff → late-life) |
| Branch structure | ✅ Strong | 3 distinct late-life branches with full expression |
| Upstream gates | ✅ Ready | `late_life_done` + late-life markers wired |
| Endgame interface | ✅ Reserved | `merchant_patron_endgame_echo_done` defined in contract, not set |
| Test coverage | ✅ Strong | P102–P110 tests + 12-criteria closure |
| Precedent patterns | ✅ Clear | Renown P80/P81 + magnate P100 provide templates |

**Foundation strength: ✅ Strong — ready for endgame design-first contract.**

---

**P111-001 complete.**
