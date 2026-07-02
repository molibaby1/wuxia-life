# P105 Merchant Martial Patron Pressure Prerequisite Audit

> **Date:** 2026-07-02
> **Stage:** P105 Wuxia Merchant Martial Patron Pressure Design-First
> **Route:** `merchant_martial_patron`（商武一体金主）
> **Gaps addressed:** GAP-P104-N01, GAP-P104-N02
> **Story:** P105-001 (read-only; no runtime changes)

---

## 1. Executive Summary

本审计汇总 `merchant_martial_patron` 路线在 pressure 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。目的是确保 P105 从真实的 gating surface 出发，而非基于假设设计 pressure。

**结论：** Patron 路线已具备进入 pressure 设计的坚实基础——P102 native bridge entry、P103 apprentice/tavern bridge-origin、P104 peasant bridge-origin 均已落地，`merchant_patron_on_ramp_done` 作为明确上游 gate，表达面覆盖 goal / cost label / identity 三处且含 5 条变体分支。Pressure 阶段缺失的是 spine 事件、checkpoint flag 与 pressure 表达更新；可复用 magnate / renown pressure 的里程碑模式作为实施先例。

---

## 2. Existing Patron Route Infrastructure

### 2.1 Flags & Markers

| Flag / Marker | Set By | Stage | Purpose | Pressure Relevance |
|---------------|--------|-------|---------|-------------------|
| `route_wealth_committed` / `p22_wealth_route_forked` | P22 wealth fork / ordinary bridges | Pre-bridge | 财富路线承诺 | 上游 gate（native + bridge 共用） |
| `merchant_invest_good` / `merchant_invest_evil` / `merchant_invest_both` | `merchant_sect_investment` | Pre-bridge | 门派投资标记 | Native entry arm 前置 |
| `apprentice_merchant_bridge_crossed` | P58 bridge | Bridge-origin | 学徒商路 bridge | P103 patron bridge arm |
| `tavern_merchant_bridge_crossed` | P59 bridge | Bridge-origin | 酒肆商路 bridge | P103 patron bridge arm |
| `peasant_merchant_bridge_crossed` | P60 bridge | Bridge-origin | 农人商路 bridge | P104 patron bridge arm |
| `merchant_patron_bridge_crossed` | `merchant_patron_bridge_entry` | P102+ entry | Bridge 终态 guard | 上游（entry 后已设） |
| `merchant_patron_on_ramp_done` | `merchant_patron_bridge_entry` choices | P102+ entry | **On-ramp 检查点** | **Pressure 的直接上游 gate** |
| `merchant_patron_on_ramp_orthodox` | `patron_embrace_orthodox_sect` | P102 native | Native 侠义盟约变体 | Pressure 表达分支参考 |
| `merchant_patron_on_ramp_martial` | `patron_embrace_martial_backer` | P102 native | Native 武力护商变体 | Pressure 表达分支参考 |
| `merchant_patron_bridge_apprentice_craft` | `patron_bridge_apprentice_craft_alliance` | P103 | 学徒 bridge-origin 检查点 | Pressure 表达分支参考 |
| `merchant_patron_bridge_tavern_network` | `patron_bridge_tavern_network_alliance` | P103 | 酒肆 bridge-origin 检查点 | Pressure 表达分支参考 |
| `merchant_patron_bridge_peasant_grain` | `patron_bridge_peasant_grain_alliance` | P104 | 农人 bridge-origin 检查点 | Pressure 表达分支参考 |
| `merchant_patron_payoff_done` | `merchant_patron_payoff_echo` | P102 payoff | Payoff echo 检查点 | **Pressure 之后、payoff 之前需插入 pressure** |
| `merchant_patron_identity_done` | `merchant_patron_payoff_echo` | P102 payoff | Identity 终态标记 | Payoff 阶段；pressure 不触碰 |
| `merchant_patron_midlife_pressure_done` | *(reserved, not set)* | P106+ (planned) | **Pressure 检查点** | **P105 需定义的核心 flag** |
| `merchant_patron_pressure_*` | *(reserved)* | P106+ (planned) | Variant-scoped pressure markers | P105 contract 定义 |

### 2.2 Events

| Event ID | Location | Type | Age Range | Stage |
|----------|----------|------|-----------|-------|
| `merchant_patron_bridge_entry` | `sample-lines-spine.json` | Choice (5 options) | 34–38 | P102/P103/P104 entry |
| `merchant_patron_payoff_echo` | `sample-lines-spine.json` | Auto | 48–52 | P102 lightweight payoff |

**Entry 事件详情：**
- 触发：native arm（wealth + invest）**OR** bridge arm（wealth + apprentice/tavern/peasant bridge crossed）
- Guard：`!merchant_patron_bridge_crossed` + no orthodox/demonic seeds
- 选项：native orthodox / native martial / apprentice craft / tavern network / peasant grain
- 效果：各选项设 `merchant_patron_on_ramp_done` + 对应变体 marker + `merchant_patron_bridge_crossed`

**Payoff echo 详情：**
- 触发：`merchant_patron_on_ramp_done` + `!merchant_patron_payoff_done`
- 效果：`merchant_patron_payoff_done` + `merchant_patron_identity_done`
- **Gap：** 当前 on-ramp 直接连到 age 48 payoff，中间无 pressure 里程碑

### 2.3 Expression Surfaces

#### Sample Line Expression (`src/p50/sampleLineExpression.ts`)

| Surface | Function | On-Ramp State | Payoff State |
|---------|----------|---------------|--------------|
| Current Goal | `merchantCurrentGoal()` | 5 variant-specific goals（orthodox/martial/apprentice/tavern/peasant） | "商武一体名号已定…" |
| Cost Label | `deriveSampleLineCostLabel()` | 5 variant labels（侠义盟约之累 / 护商武力之累 / 手艺护商之累 / 人脉护商之累 / 粮路护商之累） | "商武名号之累" |
| Age-40 Identity | `merchantAge40Identity()` | 5 variant on-ramp identities | 5 variant payoff identities |

**Expression priority rules（P104 确认）：**
1. Magnate markers win when set
2. Native patron orthodox/martial win when invest variant markers set
3. Bridge-origin expressions when respective bridge markers set
4. Generic patron fallback when only `merchant_patron_on_ramp_done`

**Pressure gap：** 无 `merchant_patron_midlife_pressure_done` 分支；on-ramp 与 payoff 表达之间无 pressure 态。

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
| P102 chain proof | `docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md` | Native chain nodes |
| P103 chain proof | `docs/test-reports/p103-merchant-martial-patron-bridge-origin-chain-proof.md` | Bridge-origin nodes |
| P104 chain proof | `docs/test-reports/p104-merchant-martial-patron-bridge-origin-peasant-chain-proof.md` | Peasant nodes |
| Typecheck | `tsc --noEmit` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 3. What Exists Before Pressure (Reusable Assets)

### 3.1 Gating Surfaces (可直接复用)

- **Upstream gate:** `merchant_patron_on_ramp_done` — entry 检查点，pressure 事件的直接前置
- **Variant markers:** 5 条 entry 变体 flag — pressure 表达分支的载体（P106 读取，不新建变体体系）
- **Terminal guard:** `merchant_patron_bridge_crossed` — 确保 entry 只触发一次（pressure 不重复设）
- **Route detection:** `detectSampleLine()` → `merchant_martial_patron` when patron markers set
- **Coexistence:** magnate markers 优先 — pressure 表达须在 magnate 分支之后、patron payoff 之前插入

### 3.2 Expression Carriers (pressure 更新载体)

- `merchantCurrentGoal()` — P0 pressure signal 候选
- `deriveSampleLineCostLabel()` — P0 pressure signal 候选（on-ramp 已有"之累"标签，可深化）
- `merchantAge40Identity()` — defer to payoff deepening；pressure 阶段可选轻量更新

### 3.3 Narrative Seeds (on-ramp 已埋下)

Entry 事件文本已暗示 pressure 方向：
> "每一笔盟约都意味着：商路上的纠纷，要按江湖规矩算；江湖上的恩怨，也会拖进账本。"

On-ramp cost labels 已命名负担类型（护商武力之累、侠义盟约之累等）——pressure 是自然深化，非全新叙事。

---

## 4. What Is Missing (P105 / P106 Target)

| Gap | ID | Description |
|-----|-----|-------------|
| No pressure spine event | GAP-P104-N01 | `merchant_patron_on_ramp_done` 与 `merchant_patron_payoff_echo` 之间无 pressure 里程碑 |
| No pressure checkpoint flag | GAP-P104-N02 | 无 `merchant_patron_midlife_pressure_done` 或等价检查点 |
| No pressure expression | GAP-P105-01 | goal / cost label 无 pressure 态分支 |
| No pressure tests | GAP-P105-02 | 无 pressure 链路 proof 或 regression |

---

## 5. Pressure Precedent Comparison

### 5.1 Magnate Pressure (`magnate_midlife_pressure`)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Upstream gate | `magnate_on_ramp_done` | 对称：`merchant_patron_on_ramp_done` |
| Age band | 36–40 | Patron entry 34–38 → pressure 建议 40–44 |
| Event type | Choice（多 variant 分支 + generic fallback） | Patron 有 5 entry variants → 适合 choice + fallback |
| Checkpoint | `magnate_midlife_pressure_done` | 对称：`merchant_patron_midlife_pressure_done` |
| Variant markers | `magnate_native_pressure_*` | 对称：`merchant_patron_pressure_*` |
| Core narrative | 金钱债 / 经营负担 | Patron 须区分：武力盟约负担，非金钱债 |
| Expression | cost label + goal 更新 | 可复用模式 |

### 5.2 Renown Pressure (`renown_midlife_pressure`)

| Aspect | Value | Patron Relevance |
|--------|-------|------------------|
| Upstream gate | `renown_on_ramp_done` | 对称模式 |
| Age band | 37–41 | 参考 midlife 节奏 |
| Event type | Auto（单一事件） | Patron 变体多 → choice 模式更合适（对齐 magnate） |
| Checkpoint | `renown_midlife_pressure_done` + `tavern_renown_pressure` | 需 origin/variant-scoped marker |
| Core narrative | 人情债渐重 | Patron 须区分：门派盟约/护商武力，非江湖人情债 |
| Expression | cost label + goal + life memory | Patron 至少 2 个 signal（goal + cost label） |

### 5.3 Precedent Summary

| Dimension | Magnate | Renown | Patron (planned) |
|-----------|---------|--------|------------------|
| 核心压力 | 金钱债 | 人情债 | **护商武力/盟约负担**（待 P105 选定） |
| 事件模式 | Choice + variants | Auto | **Choice + variants**（推荐，对齐 magnate + patron 变体体系） |
| 上游 gate | on_ramp_done | on_ramp_done | on_ramp_done |
| 表达更新 | 2+ surfaces | 2+ surfaces | 2+ surfaces（goal + cost label） |

---

## 6. Timeline Slot Analysis

当前 patron spine 时间线：

```
Age 34–38: merchant_patron_bridge_entry (on-ramp)
Age 40–44: [GAP — pressure slot]
Age 48–52: merchant_patron_payoff_echo
```

Magnate 参考间距：on-ramp ~28 → pressure 36–40（+8 年）→ payoff 42–46（+6 年）。

Patron 建议：entry 34–38 → pressure **40–44**（+2–6 年缓冲）→ payoff echo 48–52（+4–8 年）。与 magnate midlife 节奏大致对齐，且不与 payoff echo 年龄重叠。

---

## 7. Non-Regression Boundaries

P105 / P106 pressure 工作不得破坏：

| Closed Stage | Guard |
|--------------|-------|
| P102 native patron bridge | `p102MerchantMartialPatronBridgeTests` |
| P103 apprentice/tavern bridge-origin | `p103MerchantMartialPatronBridgeOriginTests` |
| P104 peasant bridge-origin | `p104MerchantMartialPatronBridgeOriginPeasantTests` |
| P55/P97–P101 magnate spine | P100/P101 magnate tests |
| Payoff echo wiring | `merchant_patron_payoff_echo` gate unchanged until P106+ explicitly extends |

---

## 8. Audit Conclusion

**Sufficient foundation for pressure design-first contract.**

- ✅ 上游 gate 明确：`merchant_patron_on_ramp_done`
- ✅ 5 条变体 marker 可用于 pressure 表达分支
- ✅ 3 处表达面已覆盖 on-ramp / payoff，pressure 有插入点
- ✅ magnate / renown pressure 提供可复用里程碑模式
- ❌ 缺 pressure 事件、checkpoint flag、pressure 表达 — P106 implementation target
- ⚠️ Payoff echo 当前仅读 `on_ramp_done`；P106 可能需将 gate 改为 `pressure_done`（contract 阶段仅记录，不改 runtime）

**P105-001 complete.**
