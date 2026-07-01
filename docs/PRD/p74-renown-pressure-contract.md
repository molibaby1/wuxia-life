# P74 Renown Pressure Contract

> **Route:** jianghu_renown_sage（江湖名宿）
> **Origin:** tavern_hand（酒肆帮工）
> **Stage:** Pressure — 人情债渐重
> **Selected direction:** 人情债渐重 (Favor Debt Burden)
> **Preceding:** P73 on-ramp (声名初显)
> **Subsequent:** Payoff (P75+) — deferred

---

## 1. Core Narrative

### 1.1 Event Identity

**事件名称：** 人情债重（或"酒肆债台"）

**核心叙事：**
这些年你在江湖上的名声越来越响，靠的是一笔一笔攒下的人情。可名声越大，欠下的人情也越多——受过你恩惠的人来谢你，你受过恩惠的人来找你，还有人借着你的名头在外行事。这日，酒肆里来了一拨又一拨的人，有报恩的、有讨债的、有求你出面的。你站在酒肆柜台后，忽然想起小时候在这儿见惯的人情往来——那时候你只觉得热闹，如今才知道，这人情债，是真的能压得人喘不过气。

**Tavern-born 风味锚点：**
- 事件发生在酒肆（核心场景）
- 压力来源是"人情债"，不是武功、不是金钱
- "酒肆出身"视角的反差：从小见惯人情，如今自己陷进去
- 与 merchant pressure 的"金钱债"形成鲜明对比

### 1.2 What Makes It Iconic

这是 renown 路线的 pressure 节点，它回答了："声名之后呢？"

- **Before pressure (on-ramp):** "在江湖上有了名号，常有人来请你主持公道、引荐高人" — 上升期，风光无限
- **After pressure:** "一面维持声名，一面应付越来越重的人情债" — 维持期，代价显现

Pressure 让 renown 路线从"一帆风顺的上升"变成"有代价的成长"，增加了叙事深度。

---

## 2. Trigger Conditions

### 2.1 Prerequisites

| Condition | Value | Source |
|-----------|-------|--------|
| Origin | `origin_tavern_hand` | childhood origin |
| Bridge crossed | `tavern_renown_bridge_crossed` | P71 bridge |
| Route committed | `route_renown_committed` | P71 bridge |
| On-ramp done | `renown_on_ramp_done` | P73 on-ramp |
| Ally network seed | `ally_network` | childhood seed |

### 2.2 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 37 | On-ramp 在 32-35 岁，给 2-5 年享受"声名初显"的时间 |
| `ageMax` | 41 | 确保在 midlife 后期触发，为 payoff (42+) 留空间 |
| Trigger | `age_reach: 37` | 与 merchant pressure (36-40) 节奏对齐但略晚 |

### 2.3 Threshold Gates (宽松优先)

最小门槛（确保玩家有一定基础后才触发）：

| Stat | Min Value | Rationale |
|------|-----------|-----------|
| `reputation` | ≥ 12 | On-ramp 后名声有积累 |
| `connections` | ≥ 10 | 人脉广了才有人情债 |

**实现策略：** P75 实施时确认系统是否支持 stat 阈值检查。若不支持或太复杂，先用宽松条件（仅 on-ramp + age range），stat 阈值作为增强项 defer。

### 2.4 Exclusivity Guards

| Guard | Purpose |
|-------|---------|
| `!renown_midlife_pressure_done` | 只触发一次 |
| `!tavern_merchant_bridge_crossed` | 与 merchant 路线互斥（已由 detectSampleLine 优先级保证） |

---

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `renown_midlife_pressure` |
| `version` | `1.0.0` |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | `auto`（强制性里程碑事件） |
| `location` | `sample-lines-spine.json`（与 `magnate_midlife_pressure` 同模式） |

### 3.2 Why Auto (Not Choice)

- 与 merchant pressure (`magnate_midlife_pressure`) 模式对齐
- 人情债是 renown 路线的必然代价——你选了这条路，就必然要面对这个压力
- Choice 的空间（如何应对人情债）留给 payoff 阶段
- 保持 simple，符合 small-step 原则

### 3.3 Auto Effects

**效果：**
- 设置 `renown_midlife_pressure_done`（pressure 检查点）
- 设置 `tavern_renown_pressure`（事件触发标记，origin-scoped）
- Stat 变化：reputation +3（名声还在涨，但代价也来了）, connections +2（人脉继续扩展）, charisma +1
- 压力感体现：不直接扣 stat，但通过表达层传递"债"的感觉

**叙事文本（参考方向，P75 实施时润色）：**
> 这些年，你在江湖上的名声越来越响。酒肆里常有人来，有受过你恩惠专程来道谢的，有你欠了人情找上门来的，还有人借着你的名头在外行事。你站在柜台后，看着一拨又一拨的人，忽然想起小时候在这儿见惯的人情往来——那时候你只觉得热闹，如今才知道，这人情债，是真的能压得人喘不过气。

### 3.4 Checkpoint Flags

| Flag | Set By | Purpose |
|------|--------|---------|
| `renown_midlife_pressure_done` | Auto event | **Pressure 检查点** — payoff 阶段的前置条件 |
| `tavern_renown_pressure` | Auto event | 事件触发标记（origin-scoped） |

---

## 4. Player-Facing Expression Updates

### 4.1 Pressure-Specific Signals (至少 2 个)

#### Signal 1: Cost Label 深化 (Sample Line)

**位置：** `src/p50/sampleLineExpression.ts` → `deriveSampleLineCostLabel()`

**变化：**
- **Before pressure:** "江湖声名之累"
- **After pressure:** "人情债渐重"

**为什么：**
- 从抽象的"累"变成具体的"债"
- 更有画面感，更 tavern-born（酒肆里最讲究人情债）
- 与 merchant "巨贾负担"（金钱压力）形成对比

#### Signal 2: Current Goal 更新 (Sample Line + Ordinary Origin)

**Sample Line 位置：** `src/p50/sampleLineExpression.ts` → `renownCurrentGoal()`

**变化：**
- **Before pressure:** "在江湖上有了名号，常有人来请你主持公道、引荐高人"
- **After pressure:** "一面维持声名，一面应付越来越重的人情债"

**Ordinary Origin 位置：** `src/p56/ordinaryOriginExpression.ts` → `tavernCurrentGoal()`

**变化：**
- **Before pressure:** "在江湖上有了名号，常有人来请你主持公道"
- **After pressure:** "一面维持声名，一面应付越来越重的人情债"

**为什么：**
- 目标从"上升期"变成"维持期 + 应付压力"
- 明确体现 pressure 阶段的核心矛盾
- 两处同步更新，保持一致

#### Signal 3 (可选 bonus): Life Memory 新增 (Ordinary Origin)

**位置：** `src/p56/ordinaryOriginExpression.ts` → `tavernLifeMemory()`

**变化（pressure 后新增/替换）：**
> "这些年欠的人情、攒的面子，如今都成了要还的债。有人登门道谢，有人上门讨债，酒肆的门槛都快被踩平了。你才明白——江湖名声，从来不是白来的。"

**为什么：**
- 具体的记忆画面，比抽象的标签更有代入感
- 呼应 on-ramp 记忆（"第一次以江湖人的身份主持了公道"），形成因果链
- 强化 tavern-born 风味（酒肆场景）

### 4.2 Summary 更新 (Ordinary Origin)

**位置：** `src/p56/ordinaryOriginExpression.ts` → `deriveOrdinaryOriginSummary()`

**变化：**
- **Before pressure:** "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。"
- **After pressure:** "酒肆出身的江湖名宿：靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重。"

### 4.3 Expression Update Summary

| Surface | Function | Pressure Update? | Priority |
|---------|----------|------------------|----------|
| Sample line currentGoal | `renownCurrentGoal()` | ✅ Yes | P0 |
| Sample line cost label | `deriveSampleLineCostLabel()` | ✅ Yes | P0 |
| Ordinary origin currentGoal | `tavernCurrentGoal()` | ✅ Yes | P0 |
| Ordinary origin lifeMemory | `tavernLifeMemory()` | ✅ Yes | P1 |
| Ordinary origin summary | `deriveOrdinaryOriginSummary()` | ✅ Yes | P1 |
| Sample line age40 identity | `renownAge40Identity()` | ❌ Defer to payoff | — |

**至少 2 个 pressure-specific signals：✅ 满足（cost label + currentGoal 就是 2 个核心 signal）**

---

## 5. Differences: Pressure vs On-Ramp vs Generic Midlife

### 5.1 Pressure vs On-Ramp

| Aspect | On-Ramp (声名初显) | Pressure (人情债渐重) |
|--------|---------------------|----------------------|
| **阶段定位** | 上升期、第一个里程碑 | 维持期、代价显现 |
| **核心情绪** | 自豪、成就感、"我做到了" | 疲惫、压力、"这就是代价吗" |
| **目标方向** | 向外扩张（名声越来越大） | 向内维持（维持名声 + 应付债务） |
| **表达基调** | 积极向上 | 复杂、有重量 |
| **Stat 变化** | 大幅提升（+5/+4/+2） | 小幅提升（+3/+2/+1），压力感靠表达 |

### 5.2 Renown Pressure vs Generic Midlife

| Aspect | Renown Pressure (人情债) | Generic Midlife |
|--------|--------------------------|-----------------|
| **压力来源** | 人情债、名声的代价 | 中年危机、生计压力等通用内容 |
| **场景** | 酒肆（核心场景） | 各种通用场景 |
| **机制** | 人脉/面子/人情 | 通用 stat 变化 |
| **独特性** | renown 路线独有 | 所有出身都可能遇到 |
| **与路线关联** | 直接是 renown 路线的一部分 | 与路线无关的通用事件 |

### 5.3 Renown Pressure vs Merchant Pressure

| Aspect | Renown Pressure | Merchant Pressure |
|--------|-----------------|-------------------|
| **核心债务** | 人情债 | 金钱债 |
| **压力来源** | 名声太大、人脉太广 | 生意太大、债务太多 |
| **场景** | 酒肆 | 商铺/商路 |
| **风味** | 江湖名宿、人情世故 | 商人巨贾、经营负担 |
| **共通模式** | auto 里程碑 + stat 变化 + 表达更新 | auto 里程碑 + stat 变化 + 表达更新 |

**结论：** 模式对称（都是 auto 里程碑 + 表达更新），但风味完全不同（人情债 vs 金钱债）。

---

## 6. Payoff Stage Interfaces (Reserved Only)

### 6.1 Flag Interfaces (Reserved)

Pressure 阶段为后续 payoff 阶段预留以下 flag 接口，**本阶段不实现**：

| Flag | Purpose | Stage |
|------|---------|-------|
| `renown_payoff_done` | Payoff 检查点 | P75+ |
| `renown_age40_identity_done` | Age-40 identity 检查点 | P75+ |

### 6.2 Narrative Hooks for Payoff

Pressure 事件应为 payoff 阶段埋下种子：
- "人情债能不能还得清？" — payoff 可以选择不同的应对方式
- "名声和自由，哪个更重要？" — payoff 可以是价值观选择
- "能不能在人情网中找到自己的位置？" — payoff 可以是平衡/和解

这些种子在 pressure 文本中暗示，但不展开。payoff 具体设计留给后续阶段。

### 6.3 What Payoff Could Look Like (概念性，非 contract)

仅供参考，**不是 P74 contract 的一部分**：
- 硬扛到底（维持高名声，但代价持续）
- 索性撕破脸（名声下降，但活得轻松）
- 找到平衡（在人情网中游刃有余，形成自己的处世之道）

---

## 7. Implementation Notes (For P75)

### 7.1 Event Placement

**推荐位置：** `src/data/lines/sample-lines-spine.json`

**理由：**
- 与 merchant `magnate_midlife_pressure` 同模式
- 属于 sample line spine 事件，不是 ordinary origin growth 事件
- 与 renown_on_ramp 放在一起，路线事件集中

### 7.2 Stat Threshold Implementation

- 优先用 flag gate（`renown_on_ramp_done` + age range），确保能触发
- Stat 阈值作为增强项，若现有事件系统支持则加上，否则 defer
- 与 on-ramp 实施策略一致：先宽松后收紧

### 7.3 Compatibility with P71/P72/P73

- P71 bridge 事件的 flag 完全兼容
- P72 entry expression 作为 pressure 前的状态，完全兼容
- P73 on-ramp 作为 pressure 的直接上游，完全兼容
- `detectSampleLine()` 优先级不变（renown 仍优先于 merchant）
- 普通 tavern 路径不受影响

---

## 8. Flavor Verification Checklist

Pressure 设计是否保持 tavern-born renown 风味？

- [x] 核心机制是人脉/面子/人情，而非武功
- [x] 叙事与酒肆或酒肆出身强相关
- [x] 与 merchant pressure（金钱/债务/经营）明确区分
- [x] 与 generic 江湖压力（正邪/门派/恩怨）明确区分
- [x] "酒肆出身的" 视角贯穿始终
- [x] 与 on-ramp 风味连续（人情 → 人情债）

**风味验证：✅ 通过**

---

## 9. Contract Summary

| Item | Value |
|------|-------|
| **Direction** | 人情债渐重 (Favor Debt Burden) |
| **Event ID** | `renown_midlife_pressure` |
| **Event type** | Auto (mandatory milestone) |
| **Age range** | 37–41 |
| **Upstream gate** | `renown_on_ramp_done` |
| **Checkpoint flag** | `renown_midlife_pressure_done` |
| **Core signals** | Cost label ("人情债渐重") + Current goal ("一面维持声名，一面应付越来越重的人情债") |
| **Expression surfaces** | 5 个（3 P0 + 2 P1） |
| **New systems** | 零 — 全部复用现有架构 |
| **Payoff interface** | `renown_payoff_done` + `renown_age40_identity_done` (reserved only) |
| **Flavor** | Tavern-born renown — 人情债，非金钱债非武功压 |

---

**Contract owner:** P74 pressure design-first stage
**Contract status:** Defined (for implementation in P75)
