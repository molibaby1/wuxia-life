# P109 Merchant Martial Patron Late-Life Prerequisite Audit

> **Date:** 2026-07-02
> **Stage:** P109 Wuxia Merchant Martial Patron Late-Life Design-First
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Gaps addressed:** GAP-P108-N01
> **Story:** P109-001 (read-only; no runtime changes)

---

## 1. Executive Summary

本审计汇总 `merchant_martial_patron` 路线在 late-life 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。目的是确保 P109 从真实的 gating surface 出发，而非基于假设设计 late-life。

**结论：** Patron 路线已具备进入 late-life 设计的坚实基础——P102–P104 bridge entry/on-ramp、P106 pressure、P108 payoff choice 均已落地。`merchant_patron_payoff_done` + 三选一 `merchant_patron_payoff_*` marker 作为明确上游 gate；表达面已按 payoff choice 分化 goal / cost label / identity。Late-life 阶段缺失的是 late-life 事件、`merchant_patron_late_life_done` checkpoint、late-life choice marker、late-life 表达更新与 P110 proof。

---

## 2. Existing Patron Route Infrastructure (P102–P108)

### 2.1 Flags & Markers

| Flag / Marker | Set By | Stage | Purpose | Late-Life Relevance |
|---------------|--------|-------|---------|---------------------|
| `route_wealth_committed` / `p22_wealth_route_forked` | P22 wealth fork | Pre-bridge | 财富路线承诺 | 上游 gate（native + bridge 共用） |
| `merchant_invest_good` / `merchant_invest_evil` / `merchant_invest_both` | `merchant_sect_investment` | Pre-bridge | 门派投资标记 | Native entry arm 前置 |
| `apprentice_merchant_bridge_crossed` | P58 bridge | Bridge-origin | 学徒商路 bridge | P103 patron bridge arm |
| `tavern_merchant_bridge_crossed` | P59 bridge | Bridge-origin | 酒肆商路 bridge | P103 patron bridge arm |
| `peasant_merchant_bridge_crossed` | P60 bridge | Bridge-origin | 农人商路 bridge | P104 patron bridge arm |
| `merchant_patron_bridge_crossed` | `merchant_patron_bridge_entry` | P102+ entry | Bridge 终态 guard | 上游 |
| `merchant_patron_on_ramp_done` | entry choices | P102+ entry | On-ramp 检查点 | Late-life 间接上游 |
| `merchant_patron_on_ramp_orthodox` | native choice | P102 | Native 侠义盟约变体 | Late-life 表达修饰参考 |
| `merchant_patron_on_ramp_martial` | native choice | P102 | Native 武力护商变体 | Late-life 表达修饰参考 |
| `merchant_patron_bridge_apprentice_craft` | P103 choice | P103 | 学徒 bridge-origin | Late-life 表达修饰参考 |
| `merchant_patron_bridge_tavern_network` | P103 choice | P103 | 酒肆 bridge-origin | Late-life 表达修饰参考 |
| `merchant_patron_bridge_peasant_grain` | P104 choice | P104 | 农人 bridge-origin | Late-life 表达修饰参考 |
| `merchant_patron_midlife_pressure_done` | `merchant_patron_midlife_pressure` | P106 | Pressure 检查点 | Payoff 上游；late-life 间接上游 |
| `merchant_patron_pressure_*` (6 variants) | pressure choices | P106 | Variant pressure markers | 叙事延续参考 |
| `merchant_patron_payoff_done` | `merchant_patron_payoff_echo` | P108 | **Payoff 检查点** | **Late-life 的直接上游 gate** |
| `merchant_patron_identity_done` | payoff choices | P108 | Identity 终态 | Late-life 表达上游 |
| `merchant_patron_payoff_resolved` | payoff choices | P108 | Payoff choice 后果总标记 | Late-life 分支 key 辅助 |
| `merchant_patron_payoff_covenant_holder` | payoff A | P108 | 硬扛盟约 marker | **Late-life Branch A key** |
| `merchant_patron_payoff_covenant_breaker` | payoff B | P108 | 撕破盟约 marker | **Late-life Branch B key** |
| `merchant_patron_payoff_balancer` | payoff C | P108 | 商武平衡 marker | **Late-life Branch C key** |
| `merchant_patron_late_life_done` | *(reserved, not set)* | P109+ (planned) | Late-life 检查点 | **P110 implementation target** |
| `merchant_patron_endgame_echo_done` | *(reserved, not set)* | P111+ (planned) | Endgame echo | 远期预留 |

### 2.2 Events

| Event ID | Location | Type | Age Range | Stage |
|----------|----------|------|-----------|-------|
| `merchant_patron_bridge_entry` | `sample-lines-spine.json` | Choice (5 options) | 34–38 | P102/P103/P104 entry |
| `merchant_patron_midlife_pressure` | `sample-lines-spine.json` | Choice (6 branches) | 40–44 | P106 pressure |
| `merchant_patron_payoff_echo` | `sample-lines-spine.json` | **Choice (3 branches)** v2.0.0 | 48–52 | P108 payoff |

**Payoff 事件详情（P108 已落地）：**
- 触发：`merchant_patron_midlife_pressure_done` + `!merchant_patron_payoff_done` + orthodox/demonic exclusivity
- 3 条 choice 分支：硬扛盟约 / 撕破盟约 / 商武平衡
- 共享效果：`merchant_patron_payoff_done` + `merchant_patron_identity_done` + `merchant_patron_payoff_resolved` + 对应 payoff marker
- **Gap：** 无 late-life 下游事件；`merchant_patron_late_life_done` 未接线

### 2.3 Three Payoff Choice State Differences (Post-P108)

| Dimension | covenant_holder (A) | covenant_breaker (B) | balancer (C) |
|-----------|---------------------|----------------------|--------------|
| **Stat 变化** | businessAcumen +2, martialPower +3, reputation +2 | businessAcumen +4, martialPower -2, reputation -1 | businessAcumen +3, martialPower +1, reputation +2 |
| **Payoff marker** | `merchant_patron_payoff_covenant_holder` | `merchant_patron_payoff_covenant_breaker` | `merchant_patron_payoff_balancer` |
| **Cost label** | 盟约如山之累 | 断武从商之快 | 商武新矩之累 |
| **Current goal** | 硬扛盟约护商，商武名号靠刀与账一起撑 | 撕破盟约，商号不再听山门差遣 | 重谈盟约边界，商武各守其份 |
| **Age-40 identity** | 靠盟约定型的商武金主：出钱出刀都在一条绳上… | 断武从商的巨贾：撕破盟约后商路靠自己… | 懂商武分寸的金主：重谈盟约后商号与山门各守其份… |
| **远期伏笔 (P107)** | 盟约越绑越紧 | 自由但孤立 | 可持续发展的新盟约 |

### 2.4 Expression Surfaces (`src/p50/sampleLineExpression.ts`)

| Surface | Function | Payoff State (current) | Late-Life Gap |
|---------|----------|------------------------|---------------|
| Current Goal | `merchantCurrentGoal()` | 3 payoff choice goals | 无 `late_life_done` 分支 |
| Cost Label | `deriveSampleLineCostLabel()` | 3 payoff choice labels | 无 late-life label |
| Age-40 Identity | `merchantAge40Identity()` | payoff choice + bridge overlay | 无 late-life identity 深化 |

**Expression priority rules（P108 确认）：**
1. Magnate markers win when set
2. `merchant_patron_payoff_done` > pressure > on-ramp
3. Within payoff: payoff choice marker > entry variant
4. Generic fallback

**Late-life gap：** 表达层无 `merchant_patron_late_life_done` gate；payoff 表达在 late-life 后不会继续演化。

### 2.5 Tests & Proof Artifacts

| Artifact | Location | Coverage |
|----------|----------|----------|
| P102 bridge tests | `tests/p102MerchantMartialPatronBridgeTests.ts` | Native wealth+invest path |
| P103 bridge-origin tests | `tests/p103MerchantMartialPatronBridgeOriginTests.ts` | Apprentice + tavern paths |
| P104 peasant tests | `tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts` | Peasant bridge path |
| P106 pressure tests | `tests/p106MerchantMartialPatronPressureTests.ts` | 22 assertions |
| P108 payoff tests | `tests/p108MerchantMartialPatronPayoffTests.ts` | R1–R29 payoff choice |
| P108 closure | `docs/test-reports/p108-merchant-martial-patron-payoff-closure-report.md` | 12/12 closed |
| Typecheck | `npm run typecheck` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 3. What Exists Before Late-Life (Reusable Assets)

### 3.1 Gating Surfaces (可直接复用)

- **Upstream gate:** `merchant_patron_payoff_done` — P108 payoff 检查点，late-life 事件的直接前置
- **Branch key:** 三选一 `merchant_patron_payoff_*` marker — late-life 分支逻辑 key（与 renown P78 模式对称）
- **Entry variant markers:** 5 条 entry 变体 flag — late-life 表达可叠加 entry 风味
- **Terminal guards:** `merchant_patron_bridge_crossed`、payoff once guards
- **Route detection:** `detectSampleLine()` → `merchant_martial_patron` when patron markers set
- **Coexistence:** magnate markers 优先 — late-life 表达须在 magnate 分支之后

### 3.2 Expression Carriers (late-life 更新载体)

- `merchantCurrentGoal()` — P0 late-life signal（按 late-life branch 分化，gate: `late_life_done`）
- `deriveSampleLineCostLabel()` — P0 late-life signal
- `merchantAge40Identity()` — P0 late-life identity 深化（late-life marker > payoff marker > entry variant）

### 3.3 Narrative Seeds (payoff 已埋下)

P107 contract §2 为 late-life 预留叙事钩子：
- covenant_holder → "盟约越绑越紧"
- covenant_breaker → "自由但孤立"
- balancer → "可持续发展的新盟约"

Payoff 事件文本强化：
> 商武一体的名号已经传开，但你自己最清楚——这名号是靠盟约撑住的，还是靠刀撑住的，还是两者之间的某条绳？

On-ramp → pressure → payoff → late-life 因果链已闭合到 payoff；late-life 是自然兑现 payoff 选择的远期后果。

---

## 4. Reserved Flag Status

| Flag | Current Runtime State | P109 Contract Role |
|------|----------------------|-------------------|
| `merchant_patron_late_life_done` | Not defined in spine; not set anywhere | Late-life 检查点；P110 实施 |
| `merchant_patron_late_life_identity_done` | Not defined | Late-life 身份深化（推荐，对齐 renown P78） |
| `merchant_patron_endgame_echo_done` | Not defined | Endgame echo；P111+ 消费 |

---

## 5. What Is Missing (P109 / P110 Target)

| Gap | ID | Description |
|-----|-----|-------------|
| No late-life event | GAP-P108-N01 | Spine 在 payoff 后无 late-life 事件 |
| No late-life checkpoint | GAP-P109-01 | `merchant_patron_late_life_done` 未接线 |
| No late-life branch markers | GAP-P109-02 | 无 `merchant_patron_late_*` choice markers |
| No late-life expression | GAP-P109-03 | goal / cost label / identity 无 late-life 分支 |
| No late-life tests | GAP-P109-04 | 无 late-life 链路 proof 或 regression |

---

## 6. Late-Life Precedent Comparison

### 6.1 Renown Late-Life (P78 — choice payoff → auto late-life × 3 branches)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Event type | Auto with 3 branches | **推荐对齐** |
| Core narrative | 人情债选择的晚年后果 | Patron：商武定型选择的晚年后果 |
| Upstream gate | `renown_midlife_payoff_done` | 对称：`merchant_patron_payoff_done` |
| Branch key | `tavern_renown_payoff_*` | 对称：`merchant_patron_payoff_*` |
| Age range | 52–56 | **推荐对齐**（payoff 48–52 后 +4 年） |
| Checkpoint | `renown_late_life_done` + `renown_late_life_identity_done` | 对称模式 |
| Expression | late_life_done > payoff_done | 可复用 gate 顺序 |

### 6.2 Magnate Late-Life (P99 — auto payoff → choice late-life × ledger/caravan)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Event type | Choice (ledger vs caravan) | **Contrast** — patron 用 payoff choice 分支，非 entry track |
| Core narrative | 守成与传承 | Patron：盟约/商武关系的晚年定型 |
| Upstream gate | `magnate_payoff_done` | 对称：`merchant_patron_payoff_done` |
| Branch key | P98 payoff markers (ledger/caravan) | Patron 用 P108 payoff markers（3-choice） |
| Age range | 48–56 | Patron 推荐 52–56（更晚，对齐 renown） |
| Player agency | Choice at late-life | Patron 推荐 auto（后果展开，非新选择） |

### 6.3 Precedent Summary

| Dimension | Magnate | Renown | Patron (planned) |
|-----------|---------|--------|------------------|
| Payoff 模式 | Auto | Choice (3) | Choice (3) |
| Late-life 模式 | Choice (2 track) | Auto × 3 branches | **Auto × 3 branches**（推荐） |
| 核心 late-life 问题 | 守成怎么传 | 人情债的晚年 | **商武定型的晚年** |
| 场景 | 商铺/商路 | 酒肆门口 | **账房与演武场** |
| 分支数 | 2 (ledger/caravan) | 3 (payoff echo) | **3 (payoff echo)** |

**Patron 独特机会：** 三条 payoff choice 分支各自有 P107 预留的叙事 hook，late-life 可兑现「盟约绑紧 / 自由孤立 / 新盟可持续」——这是 magnate（单路径守成）和 renown（人情债）都不具备的商武一体差异化。

**Patron 独特约束：** 商武复合身份意味着 late-life 叙事须同时触及账房与演武场，不能退化为 generic 商人或 generic 武人。

---

## 7. Timeline Slot Analysis

当前 patron spine 时间线（post-P108）：

```
Age 34–38: merchant_patron_bridge_entry (on-ramp)
Age 40–44: merchant_patron_midlife_pressure (pressure) ✅ P106
Age 48–52: merchant_patron_payoff_echo (payoff choice) ✅ P108
Age 52–56: merchant_patron_late_life (late-life — planned P110)
```

Renown 参考：payoff 43–47 → late-life 52–56（+5–9 年）。
Magnate 参考：payoff 42–46 → late-life 48–56（+2–10 年）。
Patron：payoff 48–52 → late-life **52–56**（+0–8 年，下限与 renown 对齐）。

---

## 8. Non-Regression Boundaries

P109 / P110 late-life 工作不得破坏：

| Closed Stage | Guard |
|--------------|-------|
| P102 native patron bridge | `p102MerchantMartialPatronBridgeTests` |
| P103 apprentice/tavern bridge-origin | `p103MerchantMartialPatronBridgeOriginTests` |
| P104 peasant bridge-origin | `p104MerchantMartialPatronBridgeOriginPeasantTests` |
| P106 pressure | `p106MerchantMartialPatronPressureTests` |
| P108 payoff | `p108MerchantMartialPatronPayoffTests` |
| P55/P97–P101 magnate spine | P100/P101 magnate tests |
| Payoff gate / expression | P108 closure C1–C12 |

---

## 9. Audit Conclusion

**Sufficient foundation for late-life design-first contract.**

- ✅ 上游 gate 明确：`merchant_patron_payoff_done` + 三选一 payoff marker（P108 已接线）
- ✅ Payoff choice 表达已分化 goal / cost label / identity
- ✅ renown auto × 3 branches late-life（P78）提供可复用里程碑模式
- ✅ magnate late-life（P99）提供对比锚点（patron 应差异化）
- ✅ P107 远期伏笔为三条 late-life 分支提供叙事方向
- ❌ 缺 late-life 事件、checkpoint、branch markers、late-life 表达 — P110 implementation target
- ⚠️ `merchant_patron_late_life_done` 需在 P110 首次接线

**P109-001 complete.**
