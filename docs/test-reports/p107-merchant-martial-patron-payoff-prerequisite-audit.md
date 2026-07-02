# P107 Merchant Martial Patron Payoff Prerequisite Audit

> **Date:** 2026-07-02
> **Stage:** P107 Wuxia Merchant Martial Patron Payoff Design-First
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Gaps addressed:** GAP-P106-D01, GAP-P106-D02
> **Story:** P107-001 (read-only; no runtime changes)

---

## 1. Executive Summary

本审计汇总 `merchant_martial_patron` 路线在 payoff 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。目的是确保 P107 从真实的 gating surface 出发，而非基于假设设计 payoff。

**结论：** Patron 路线已具备进入 payoff 设计的坚实基础——P102–P104 bridge entry/on-ramp、P106 pressure 均已落地，`merchant_patron_midlife_pressure_done` 作为明确上游 gate，表达面覆盖 goal / cost label / identity 三层且含 5 条变体分支。Payoff 阶段缺失的是 choice-based 身份转折、payoff choice markers、`merchant_patron_payoff_resolved` 后果链与 payoff 表达按选择分化；当前 P102 lightweight auto `merchant_patron_payoff_echo` 仅设 checkpoint，无玩家选择空间。

---

## 2. Existing Patron Route Infrastructure

### 2.1 Flags & Markers

| Flag / Marker | Set By | Stage | Purpose | Payoff Relevance |
|---------------|--------|-------|---------|------------------|
| `route_wealth_committed` / `p22_wealth_route_forked` | P22 wealth fork / ordinary bridges | Pre-bridge | 财富路线承诺 | 上游 gate（native + bridge 共用） |
| `merchant_invest_good` / `merchant_invest_evil` / `merchant_invest_both` | `merchant_sect_investment` | Pre-bridge | 门派投资标记 | Native entry arm 前置 |
| `apprentice_merchant_bridge_crossed` | P58 bridge | Bridge-origin | 学徒商路 bridge | P103 patron bridge arm |
| `tavern_merchant_bridge_crossed` | P59 bridge | Bridge-origin | 酒肆商路 bridge | P103 patron bridge arm |
| `peasant_merchant_bridge_crossed` | P60 bridge | Bridge-origin | 农人商路 bridge | P104 patron bridge arm |
| `merchant_patron_bridge_crossed` | `merchant_patron_bridge_entry` | P102+ entry | Bridge 终态 guard | 上游（entry 后已设） |
| `merchant_patron_on_ramp_done` | `merchant_patron_bridge_entry` choices | P102+ entry | On-ramp 检查点 | Pressure 上游；payoff 间接上游 |
| `merchant_patron_on_ramp_orthodox` | `patron_embrace_orthodox_sect` | P102 native | Native 侠义盟约变体 | Payoff 表达分支参考 |
| `merchant_patron_on_ramp_martial` | `patron_embrace_martial_backer` | P102 native | Native 武力护商变体 | Payoff 表达分支参考 |
| `merchant_patron_bridge_apprentice_craft` | `patron_bridge_apprentice_craft_alliance` | P103 | 学徒 bridge-origin 检查点 | Payoff 表达分支参考 |
| `merchant_patron_bridge_tavern_network` | `patron_bridge_tavern_network_alliance` | P103 | 酒肆 bridge-origin 检查点 | Payoff 表达分支参考 |
| `merchant_patron_bridge_peasant_grain` | `patron_bridge_peasant_grain_alliance` | P104 | 农人 bridge-origin 检查点 | Payoff 表达分支参考 |
| `merchant_patron_midlife_pressure_done` | `merchant_patron_midlife_pressure` | P106 | **Pressure 检查点** | **Payoff 的直接上游 gate** |
| `merchant_patron_pressure_orthodox` | pressure choice | P106 | Variant pressure marker | Payoff 叙事延续参考 |
| `merchant_patron_pressure_martial` | pressure choice | P106 | Variant pressure marker | Payoff 叙事延续参考 |
| `merchant_patron_pressure_apprentice` | pressure choice | P106 | Variant pressure marker | Payoff 叙事延续参考 |
| `merchant_patron_pressure_tavern` | pressure choice | P106 | Variant pressure marker | Payoff 叙事延续参考 |
| `merchant_patron_pressure_peasant` | pressure choice | P106 | Variant pressure marker | Payoff 叙事延续参考 |
| `merchant_patron_pressure_generic` | pressure choice | P106 | Variant pressure marker | Payoff 叙事延续参考 |
| `merchant_patron_payoff_done` | `merchant_patron_payoff_echo` | P102 payoff | Payoff echo 检查点 | **P108 升级为 choice checkpoint** |
| `merchant_patron_identity_done` | `merchant_patron_payoff_echo` | P102 payoff | Identity 终态标记 | **P108 按 choice 分化 identity** |
| `merchant_patron_payoff_resolved` | *(reserved, not set)* | P107+ (planned) | Payoff choice 后果总标记 | **P107 contract 定义** |
| `merchant_patron_late_life_done` | *(reserved, not set)* | P109+ (planned) | Late-life 检查点 | 远期预留 |

### 2.2 Events

| Event ID | Location | Type | Age Range | Stage |
|----------|----------|------|-----------|-------|
| `merchant_patron_bridge_entry` | `sample-lines-spine.json` | Choice (5 options) | 34–38 | P102/P103/P104 entry |
| `merchant_patron_midlife_pressure` | `sample-lines-spine.json` | Choice (6 branches) | 40–44 | P106 pressure |
| `merchant_patron_payoff_echo` | `sample-lines-spine.json` | **Auto** | 48–52 | P102 lightweight payoff |

**Pressure 事件详情（P106 已落地）：**
- 触发：`merchant_patron_on_ramp_done` + `!merchant_patron_midlife_pressure_done` + `!merchant_patron_payoff_done`
- 6 条 choice 分支（5 variant + generic fallback）
- 效果：各分支设 `merchant_patron_midlife_pressure_done` + 对应 `merchant_patron_pressure_*`

**Payoff echo 详情（P102 lightweight，待 P108 升级）：**
- 触发：**`merchant_patron_midlife_pressure_done`** + `!merchant_patron_payoff_done`（P106 已调整 gate）
- 效果：`merchant_patron_payoff_done` + `merchant_patron_identity_done`（auto，无 choice）
- **Gap：** 无商武撕裂的价值判断选择；表达不随 payoff 选择分化

### 2.3 Expression Surfaces

#### Sample Line Expression (`src/p50/sampleLineExpression.ts`)

| Surface | Function | Pressure State | Payoff State (current) |
|---------|----------|----------------|------------------------|
| Current Goal | `merchantCurrentGoal()` | 5 variant + generic pressure goals | 单一："商武一体名号已定…" |
| Cost Label | `deriveSampleLineCostLabel()` | 5 variant "之债" + generic | 单一："商武名号之累" |
| Age-40 Identity | `merchantAge40Identity()` | on-ramp identity（pressure 不更新） | 5 variant payoff identity（按 entry marker，不按 payoff choice） |

**Expression priority rules（P106 确认）：**
1. Magnate markers win when set
2. `merchant_patron_payoff_done` > pressure > on-ramp
3. Native patron orthodox/martial > bridge-origin variants
4. Generic patron fallback

**Payoff gap：** payoff 表达仅读 `merchant_patron_payoff_done` / `merchant_patron_identity_done`，不读 payoff choice markers；identity 仅按 entry variant 分化，不按 payoff 选择分化。

### 2.4 Mixed Achievement & Traceability

| Asset | Location | Status |
|-------|----------|--------|
| Achievement ID | `wuxiaOriginSurfaces.ts` → `merchant_martial_patron` | ✅ tier mixed, coexistWith magnate |
| Mixed path | `mixedSimulationBaselines.ts` → `mixed_merchant_patron_path` | ✅ Static proof |
| Mixed identity slice | `mixedIdentitySlice.ts` | ✅ merchant_track + martial_track |
| P37 lifetime slice | `p37AdditionalMixedPinnacleLifetimeSlices.ts` | ✅ habit-led trace |

### 2.5 Tests & Proof Artifacts

| Artifact | Location | Coverage |
|----------|----------|----------|
| P102 bridge tests | `tests/p102MerchantMartialPatronBridgeTests.ts` | Native wealth+invest path |
| P103 bridge-origin tests | `tests/p103MerchantMartialPatronBridgeOriginTests.ts` | Apprentice + tavern paths |
| P104 peasant tests | `tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts` | Peasant bridge path |
| P106 pressure tests | `tests/p106MerchantMartialPatronPressureTests.ts` | 22 assertions |
| P102 chain proof | `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md` | Native chain nodes |
| P103 chain proof | `docs/test-reports/p103-merchant-martial-patron-bridge-origin-chain-proof.md` | Bridge-origin nodes |
| P104 chain proof | `docs/test-reports/p104-merchant-martial-patron-bridge-origin-peasant-chain-proof.md` | Peasant nodes |
| P106 targeted proof | `docs/test-reports/p106-merchant-martial-patron-pressure-targeted-proof.md` | Pressure chain nodes |
| Typecheck | `tsc --noEmit` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 3. What Exists Before Payoff (Reusable Assets)

### 3.1 Gating Surfaces (可直接复用)

- **Upstream gate:** `merchant_patron_midlife_pressure_done` — P106 pressure 检查点，payoff 事件的直接前置
- **Entry variant markers:** 5 条 entry 变体 flag — payoff 表达可叠加 entry 风味（P108 读取，不新建变体体系）
- **Pressure variant markers:** 5+1 pressure markers — payoff 叙事可延续 pressure 分支语境
- **Terminal guards:** `merchant_patron_bridge_crossed`、pressure/payoff once guards
- **Route detection:** `detectSampleLine()` → `merchant_martial_patron` when patron markers set
- **Coexistence:** magnate markers 优先 — payoff 表达须在 magnate 分支之后

### 3.2 Expression Carriers (payoff 更新载体)

- `merchantCurrentGoal()` — P0 payoff signal 候选（按 payoff choice 分化）
- `deriveSampleLineCostLabel()` — P0 payoff signal 候选（按 payoff choice 分化）
- `merchantAge40Identity()` — P0 payoff identity 深化（按 payoff choice × entry variant）

### 3.3 Narrative Seeds (pressure 已埋下)

P105 contract §6.3 为 payoff 预留叙事钩子：
- "商武一体的名号，是靠盟约撑住的还是靠刀撑住的？"
- "能不能在商道与武道之间找到不再被两头拉扯的位置？"

P106 pressure 事件文本强化：
> 你站在账房与演武场之间，忽然明白：商武一体，是每一笔都要用刀来算的担子。

On-ramp → pressure → payoff 因果链已闭合；payoff 是自然回答"商武撕裂怎么解"。

---

## 4. P106 Payoff Gate Adjustment (Post-P106 State)

| Aspect | Pre-P106 | Post-P106 (current) |
|--------|----------|---------------------|
| Payoff echo gate | `merchant_patron_on_ramp_done` | **`merchant_patron_midlife_pressure_done`** |
| Spine ordering | entry → payoff (gap) | entry → pressure → payoff |
| Downstream flags | payoff sets `payoff_done` + `identity_done` | Pressure does **not** set payoff flags |
| Reserved flags | `payoff_resolved`, `late_life_done` documented | Still reserved, not set |

**P106 closure C11 confirmed:** Pressure does not set `merchant_patron_payoff_done` / `merchant_patron_identity_done`.

---

## 5. Reserved Flag Status

| Flag | Current Runtime State | P107 Contract Role |
|------|----------------------|-------------------|
| `merchant_patron_payoff_resolved` | Not defined in spine; not set anywhere | Payoff choice 后果总标记；P108 在任一 payoff choice 时设置 |
| `merchant_patron_late_life_done` | Not defined in spine; not set anywhere | Late-life 检查点；P109+ 消费 |

---

## 6. What Is Missing (P107 / P108 Target)

| Gap | ID | Description |
|-----|-----|-------------|
| No choice-based payoff | GAP-P106-D01 | `merchant_patron_payoff_echo` 仍是 auto，无商武撕裂价值判断 |
| No payoff choice markers | GAP-P106-D02 | 无 `merchant_patron_payoff_*` choice markers；`payoff_resolved` 未接线 |
| No payoff choice expression | GAP-P107-01 | goal / cost label / identity 不按 payoff 选择分化 |
| No payoff tests | GAP-P107-02 | 无 payoff choice 链路 proof 或 regression |

---

## 7. Payoff Precedent Comparison

### 7.1 Magnate Payoff (`magnate_payoff` — auto pattern)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Event type | Auto | **Contrast — patron 应选 choice 差异化** |
| Core narrative | 商业帝国自然成型 | Patron：商武撕裂需主动抉择 |
| Upstream gate | `magnate_midlife_pressure_done` | 对称：`merchant_patron_midlife_pressure_done` |
| Checkpoint | `magnate_payoff_done` | 对称：`merchant_patron_payoff_done` |
| Player agency | 低（观看成功） | Patron payoff 应有高 agency |

### 7.2 Renown Payoff (`renown_midlife_payoff` — choice pattern, P76/P77)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Event type | Choice (3 options) | **推荐对齐 — 价值判断型 payoff** |
| Core narrative | 人情债怎么还？ | Patron：商武撕裂怎么解？ |
| Upstream gate | `renown_midlife_pressure_done` | 对称模式 |
| Choice markers | `tavern_renown_payoff_*` | 对称：`merchant_patron_payoff_*` |
| Expression | 按 choice 分化 goal / cost / identity | 可复用模式 |

### 7.3 Precedent Summary

| Dimension | Magnate | Renown | Patron (planned) |
|-----------|---------|--------|------------------|
| 核心 payoff 问题 | 成功了 | 人情债怎么还 | **商武撕裂怎么解** |
| 事件模式 | Auto | Choice (3) | **Choice (3)**（推荐） |
| 上游 gate | pressure_done | pressure_done | pressure_done |
| 表达更新 | 2+ surfaces | 3+ surfaces per choice | 3+ surfaces per choice |

---

## 8. Timeline Slot Analysis

当前 patron spine 时间线（post-P106）：

```
Age 34–38: merchant_patron_bridge_entry (on-ramp)
Age 40–44: merchant_patron_midlife_pressure (pressure) ✅ P106
Age 48–52: merchant_patron_payoff_echo (payoff — auto,待升级)
```

Magnate 参考：pressure 36–40 → payoff 42–46（+4–6 年）。
Renown 参考：pressure 37–41 → payoff 43–47（+4–6 年）。
Patron：pressure 40–44 → payoff **48–52**（+4–8 年）— 保持现有 age band，与 P102 echo 一致。

---

## 9. Non-Regression Boundaries

P107 / P108 payoff 工作不得破坏：

| Closed Stage | Guard |
|--------------|-------|
| P102 native patron bridge | `p102MerchantMartialPatronBridgeTests` |
| P103 apprentice/tavern bridge-origin | `p103MerchantMartialPatronBridgeOriginTests` |
| P104 peasant bridge-origin | `p104MerchantMartialPatronBridgeOriginPeasantTests` |
| P106 pressure | `p106MerchantMartialPatronPressureTests` |
| P55/P97–P101 magnate spine | P100/P101 magnate tests |
| Pressure gate / expression | P106 closure C1–C11 |

---

## 10. Audit Conclusion

**Sufficient foundation for payoff design-first contract.**

- ✅ 上游 gate 明确：`merchant_patron_midlife_pressure_done`（P106 已接线）
- ✅ 5 条 entry variant + 6 条 pressure variant 可用于叙事延续
- ✅ 3 处表达面已覆盖 on-ramp / pressure / payoff，payoff choice 有插入点
- ✅ renown choice payoff（P76/P77）提供可复用里程碑模式
- ✅ magnate auto payoff 提供对比锚点（patron 应差异化）
- ❌ 缺 choice-based payoff 事件、payoff choice markers、payoff choice 表达 — P108 implementation target
- ⚠️ `merchant_patron_payoff_echo` 需从 auto 升级为 choice（P107 contract 定义，P108 实施）

**P107-001 complete.**
