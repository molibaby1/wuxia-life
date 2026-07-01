# P74 Renown Pressure Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P74 Wuxia Renown Pressure Design-First
> **Route:** jianghu_renown_sage（江湖名宿）
> **Origin:** tavern_hand（酒肆帮工）

---

## 1. Executive Summary

本审计汇总 `jianghu_renown_sage` 路线在 pressure 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。目的是确保 P74 从真实的 gating surface 出发，而非基于假设设计 pressure。

**结论：** Renown 路线已具备进入 pressure 设计的坚实基础——3 个阶段（bridge / entry / on-ramp）均已落地，checkpoint flag 体系完整，表达面覆盖 6+ 处，tavern-born 风味一致。Pressure 阶段有明确的上游 gate（`renown_on_ramp_done`）和可复用的表达载体。

---

## 2. Existing Renown Route Infrastructure

### 2.1 Flags & Markers

| Flag / Marker | Set By | Stage | Purpose | Pressure Relevance |
|---------------|--------|-------|---------|--------------------|
| `ally_network` | Childhood seed | P9 / youth | 童年人脉种子 | 上游前置，pressure 可呼应 |
| `tavern_renown_bridge_crossed` | `ordinary_tavern_midlife_renown_bridge` event, choice `embrace_renown` | P71 bridge | Bridge 检查点 | 上游 gate（已由 on-ramp 保证） |
| `route_renown_committed` | Same as above | P71 bridge | 路线承诺标记 | 上游 gate（路线归属） |
| `tavern_renown_on_ramp` | `renown_on_ramp` auto event | P73 on-ramp | 事件触发标记（origin-scoped） | 可复用为 pressure 参考标记 |
| `renown_on_ramp_done` | `renown_on_ramp` auto event | P73 on-ramp | **On-ramp 检查点** | **Pressure 的直接上游 gate** |
| `renown_midlife_pressure_done` | *(reserved, not set)* | P74+ (planned) | Pressure 检查点 | **P74 需定义的核心 flag** |
| `renown_payoff_done` | *(reserved, not set)* | P75+ (planned) | Payoff 检查点 | 预留，P74 需保留接口 |
| `renown_age40_identity_done` | *(reserved, not set)* | P75+ (planned) | Age-40 identity 检查点 | 预留，P74 需保留接口 |

### 2.2 Events

| Event ID | Location | Type | Age Range | Stage |
|----------|----------|------|-----------|-------|
| `ordinary_tavern_midlife_renown_bridge` | `ordinary-origin-midlife.json` | Choice (2 options) | 29 | P71 bridge |
| `renown_on_ramp` | `sample-lines-spine.json` | Auto (mandatory) | 32–35 | P73 on-ramp |

**Bridge 事件详情：**
- 触发：`origin_tavern_hand` + `ally_network` + `!ordinary_tavern_midlife_done`
- 选项：`embrace_renown`（接受 → 设 bridge + route 旗标） / `decline_renown`（拒绝 → 走普通 tavern 线）
- 叙事：儿时好友引荐 → 江湖名号 → 选择是否踏上 renown 之路

**On-ramp 事件详情：**
- 触发：`tavern_renown_bridge_crossed` + `!renown_on_ramp_done` + no orthodox/demonic seeds
- 类型：Auto（强制性里程碑，与 merchant `magnate_on_ramp` 对齐）
- 效果：`renown_on_ramp_done` + `tavern_renown_on_ramp`，reputation +5, connections +4, charisma +2
- 叙事：两拨江湖人闹到酒肆，请玩家主持公道 → "兄台高义" → 声名有了分量

### 2.3 Expression Surfaces

#### Sample Line Expression (`src/p50/sampleLineExpression.ts`)

| Surface | Function | Renown Bridge State | Renown On-Ramp State |
|---------|----------|---------------------|---------------------|
| Current Goal | `renownCurrentGoal()` | "凭人脉声名在江湖立足，常有人来寻你引荐主事" | "在江湖上有了名号，常有人来请你主持公道、引荐高人" |
| Cost Label | `deriveSampleLineCostLabel()` | "江湖声名之累" | "江湖声名之累"（不变，defer to pressure） |
| Age-40 Identity | `renownAge40Identity()` | Entry-level | Entry-level（不变，defer to payoff） |

#### Ordinary Origin Expression (`src/p56/ordinaryOriginExpression.ts`)

| Surface | Function | Renown Bridge State | Renown On-Ramp State |
|---------|----------|---------------------|---------------------|
| Current Goal | `tavernCurrentGoal()` | "江湖上渐渐有了名声，常有人来寻你引荐" | "在江湖上有了名号，常有人来请你主持公道" |
| Life Memory | `tavernLifeMemory()` | "凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号" | "第一次以江湖人的身份主持了公道...不是因为武功，是因为人脉和面子" |
| Summary | `deriveOrdinaryOriginSummary()` | "酒肆出身的江湖人物：靠人脉和名声在江湖上立足" | "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人" |

#### Other Surfaces

| Surface | File | Renown-Specific? |
|---------|------|------------------|
| Route detection | `sampleLineExpression.ts` → `detectSampleLine()` | ✅ `jianghu_renown_sage` 识别 |
| Player-facing labels | `playerFacingLabels.ts` | ✅ 路线名称/标签 |
| P25 validation slices | `p32HabitLedSimulationBaselines.ts` 等 | ✅ renown 路线验证基线 |
| Origin surfaces | `wuxiaOriginSurfaces.ts` | ✅ tavern_hand origin |

### 2.4 Tests & Proof Artifacts

| Artifact | Location | Coverage |
|----------|----------|----------|
| P71 bridge tests | `tests/p71TavernHandRenownBridgeTests.ts` | 15 assertions |
| P72 entry tests | `tests/p72TavernHandRenownEntryDifferentiationTests.ts` | 15 assertions |
| P73 on-ramp tests | `tests/p73TavernHandRenownOnRampSpineTests.ts` | 19 assertions |
| P71 targeted proof | `docs/test-reports/p71-*.md` | 11 chain nodes |
| P72 targeted proof | `docs/test-reports/p72-*.md` | 4 cases × 6 surfaces |
| P73 targeted proof | `docs/test-reports/p73-renown-on-ramp-targeted-proof.md` | 8 chain nodes |
| Typecheck | `tsc --noEmit` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 3. What Exists Before Pressure (Reusable Assets)

### 3.1 Gating Surfaces (可直接复用)

- **Upstream gate:** `renown_on_ramp_done` — on-ramp 检查点，pressure 事件的直接前置
- **Route marker:** `route_renown_committed` — 路线归属标记
- **Origin marker:** `origin_tavern_hand` + `ally_network` — 出身与种子标记
- **Sample line detection:** `detectSampleLine()` returns `jianghu_renown_sage` — 路线识别

### 3.2 Expression Carriers (可直接扩展)

- **Sample line:** `renownCurrentGoal()`, `deriveSampleLineCostLabel()`, `renownAge40Identity()` — 3 个可扩展点
- **Ordinary origin:** `tavernCurrentGoal()`, `tavernLifeMemory()`, `deriveOrdinaryOriginSummary()` — 3 个可扩展点
- **Life memory summary:** `deriveLifeMemorySummary.ts` — route status 集成点
- **Player-facing labels:** `playerFacingLabels.ts` — 标签/命名统一管理

### 3.3 Pattern Precedent (可参考模式)

- **Merchant pressure:** `magnate_midlife_pressure` + `merchant_midlife_debt_milestone` in `sample-lines-spine.json` — pressure 事件结构先例
- **Merchant expression:** cost label ("巨贾负担"), age40 identity — expression 更新先例
- **Auto event pattern:** `magnate_on_ramp` 和 `renown_on_ramp` 均为 auto — 强制性里程碑模式

---

## 4. Gaps Identified for Pressure Stage

### 4.1 Core Gaps (P74 需定义)

| Gap | Description | Priority |
|-----|-------------|----------|
| **Pressure direction** | Renown pressure 的核心叙事方向未定（声名之累？人情债？江湖恩怨？） | P0 |
| **Pressure checkpoint flag** | `renown_midlife_pressure_done` 的具体语义与设置时机 | P0 |
| **Pressure event(s)** | 1 个核心 pressure 事件（或 1 组小事件）的结构与触发条件 | P0 |
| **Pressure-specific expression** | 至少 2 个 pressure-specific player-facing signals | P0 |
| **Pressure vs on-ramp 边界** | Pressure 与 on-ramp 的叙事差异、节奏差异 | P1 |
| **Payoff flag 接口** | 为后续 payoff 阶段预留的 flag 接口定义 | P1 |

### 4.2 Non-Gaps (已有基础，无需重建)

- 路线识别机制 ✅
- Sample line spine 事件系统 ✅
- Ordinary origin 表达框架 ✅
- 测试 harness 与验证模式 ✅
- Tavern-born 风味锚点 ✅
- Merchant pressure 先例 ✅

---

## 5. Flavor Consistency Check

### 5.1 Tavern-Born Renown Flavor Anchors (已验证一致)

| Anchor | Evidence |
|--------|----------|
| **人脉 > 武功** | On-ramp 事件明确说"不是因为武功，是因为人脉和面子" |
| **酒肆场景** | Bridge + on-ramp 均发生在酒肆或与酒肆强相关 |
| **面子/人情** | "主持公道"、"给面子"、"兄台高义" — 核心是人情往来 |
| **酒肆出身前缀** | 每个 summary 都以"酒肆出身的"开头 |
| **与 merchant 区分** | Merchant = 商人/商路/财富；Renown = 江湖名宿/人脉/名声 |

### 5.2 Pressure Flavor Guidance

Pressure 设计必须延续以上风味锚点，**避免**：
- 变成 generic 江湖压力（正邪对立、门派纷争）
- 变成 merchant pressure 的翻版（金钱债务、经营危机）
- 偏离 tavern-born 根基（突然变成武功高手路线）

---

## 6. Merchant Pressure Precedent (Reference)

Merchant 路线的 pressure 结构作为参考模式：

| Aspect | Merchant Pressure | Renown Pressure (TBD) |
|--------|-------------------|----------------------|
| **Core event** | `magnate_midlife_pressure` (auto) | TBD |
| **Age range** | 36–40 | TBD (建议 37–41，比 on-ramp 晚 5 年) |
| **Checkpoint** | `merchant_midlife_debt_milestone`? | `renown_midlife_pressure_done` |
| **Core narrative** | 财务危机、债务压力 | TBD |
| **Expression updates** | cost label 深化, currentGoal 更新 | TBD（至少 2 个） |
| **Pattern** | Auto 里程碑事件 + stat 变化 + expression 更新 | 预计相同模式 |

---

## 7. Audit Conclusion

**Pressure stage readiness: ✅ Sufficient foundation for design-first**

现有基础设施足以支撑 pressure 阶段的设计工作：
- ✅ 明确的上游 gate（`renown_on_ramp_done`）
- ✅ 完整的表达载体体系（6+ 可扩展点）
- ✅ 可参考的 merchant pressure 先例
- ✅ 一致的 tavern-born 风味锚点
- ✅ 可用的测试 harness 与验证模式

**P74 需回答的核心问题：**
1. Renown pressure 的叙事方向是什么？（从多个候选中选 1 个）
2. Pressure 事件如何结构化？（1 个核心事件还是 1 组？）
3. Pressure 的 player-facing signals 有哪些？（至少 2 个）
4. Pressure 与 on-ramp、与 generic midlife 如何区分？

这些将在 P74-003（方向比较）和 P74-004（contract 定义）中回答。

---

**P74-001 complete.** Prerequisite audit saved.
