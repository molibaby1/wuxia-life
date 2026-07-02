# P105 Merchant Martial Patron Pressure Contract

> **Route:** `merchant_martial_patron`（商武一体金主）
> **Stage:** Pressure — 护商武力负担
> **Selected direction:** 护商武力负担 (Martial Backer Burden)
> **Preceding:** P102–P104 patron bridge entry / on-ramp
> **Subsequent:** Payoff echo deepening (P106+) — gate adjustment deferred

---

## 1. Core Narrative

### 1.1 Event Identity

**事件名称：** 盟约如山（或"护商之累"）

**核心叙事：**
当年投银换护商，门派的刀确实护住了你的货路。可商号越扩，盟约兑现得越彻底——护镖要出人手，借道要讲规矩，商路上的纠纷得按江湖算法，江湖上的恩怨也会拖进账本。这日，山门又派人来传话：有一批货要借你的商路，有一批债要按盟约清。你站在账房与演武场之间，忽然明白——商武一体不是口号，是每一笔都要用刀来算的担子。

**商武一体风味锚点：**
- 压力来源是"护商武力盟约的兑现负担"，不是金钱债（magnate）也不是江湖人情债（renown）
- 场景在商号与山门之间 — 商武复合空间
- Entry 文本的直接延续："商路上的纠纷，要按江湖规矩算"
- 与 on-ramp cost labels（护商武力之累、侠义盟约之累）形成因果链

### 1.2 What Makes It Iconic

这是 patron 路线的 pressure 节点，它回答了："商武盟约立了之后呢？"

- **Before pressure (on-ramp):** "银钱换盟约，正把手中的商路与门派的剑绑在同一条绳上" — 上升期，盟约初立
- **After pressure:** "一面扩张商路，一面应付门派护商盟约兑现后的武力负担" — 维持期，负担显现

Pressure 让 patron 路线从"盟约初立的上升"变成"有代价的商武复合经营"，增加叙事深度。

---

## 2. Trigger Conditions

### 2.1 Prerequisites

| Condition | Value | Source |
|-----------|-------|--------|
| Patron on-ramp done | `merchant_patron_on_ramp_done` | P102–P104 entry |
| Bridge crossed | `merchant_patron_bridge_crossed` | P102+ entry (implicit via on-ramp) |
| Not yet pressured | `!merchant_patron_midlife_pressure_done` | Pressure guard |
| No orthodox/demonic seeds | `!orthodox_childhood_seed_done` && `!demonic_childhood_seed_done` | Spine exclusivity |

**Note:** Pressure 不区分 native vs bridge-origin 的 entry gate — 只要 `merchant_patron_on_ramp_done` 即可。变体差异通过 choice 条件分支和 expression 读取 entry markers 体现。

### 2.2 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 40 | Entry 34–38 后至少 2 年缓冲 |
| `ageMax` | 44 | 为 payoff echo (48–52) 留空间；对齐 magnate midlife 节奏 |
| Trigger | `age_reach: 40` | 与 magnate pressure (36) 大致同期但略晚（patron entry 更晚） |

### 2.3 Threshold Gates (宽松优先)

最小门槛（P106 实施时可选）：

| Stat | Min Value | Rationale |
|------|-----------|-----------|
| `martialPower` | ≥ 8 | 有武力基础才谈护商负担 |
| `businessAcumen` | ≥ 8 | 商路已铺开才谈盟约兑现 |

**实现策略：** P106 实施时若 stat 阈值检查复杂，先用宽松条件（仅 on-ramp + age range），stat 阈值作为增强项 defer。

### 2.4 Exclusivity Guards

| Guard | Purpose |
|-------|---------|
| `!merchant_patron_midlife_pressure_done` | 只触发一次 |
| `!merchant_patron_payoff_done` | 不与 payoff 阶段冲突 |
| Magnate markers | `detectSampleLine()` / expression priority — magnate 表达优先时不显示 patron pressure 表达 |

---

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `merchant_patron_midlife_pressure` |
| `version` | `1.0.0` |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | `choice`（对齐 `magnate_midlife_pressure`） |
| `location` | `sample-lines-spine.json` |

### 3.2 Why Choice (Not Auto)

- 与 `magnate_midlife_pressure` 模式对齐 — patron 已有 5 条 entry variant，适合条件分支
- 玩家对"如何应对护商负担"有有限选择空间（守盟约 / 收缩 / generic）
- Renown 用 auto 是因为单 origin 单风味；patron 是多变体路线，choice 更合适
- 保持 bounded：1 事件 + 条件分支，不扩成多事件链

### 3.3 Choice Branches (Tightly Coupled Group)

所有分支共享 checkpoint `merchant_patron_midlife_pressure_done`。各分支额外设 variant-scoped pressure marker。

| Choice ID | Condition (entry marker) | Narrative Framing | Pressure Marker |
|-----------|-------------------------|-------------------|-----------------|
| `patron_pressure_orthodox_hold` | `merchant_patron_on_ramp_orthodox` | 守侠义盟约，按道义护商，哪怕周转吃紧 | `merchant_patron_pressure_orthodox` |
| `patron_pressure_martial_expand` | `merchant_patron_on_ramp_martial` | 加派护镖人手，以武力撑商路，债记在盟约上 | `merchant_patron_pressure_martial` |
| `patron_pressure_apprentice_quality` | `merchant_patron_bridge_apprentice_craft` | 用手艺标准筛货换护商，品质比规模更烫手 | `merchant_patron_pressure_apprentice` |
| `patron_pressure_tavern_network` | `merchant_patron_bridge_tavern_network` | 靠酒肆消息网调度护商，借道比利润更烫手 | `merchant_patron_pressure_tavern` |
| `patron_pressure_peasant_grain` | `merchant_patron_bridge_peasant_grain` | 粮路脚力撑护商，囤粮与护镖两头紧 | `merchant_patron_pressure_peasant` |
| `patron_pressure_generic` | *(no condition — fallback)* | 盟约如山，商路越大，护商武力负担越重 | `merchant_patron_pressure_generic` |

### 3.4 Shared Effects (All Branches)

- 设置 `merchant_patron_midlife_pressure_done`（**Pressure 检查点**）
- 设置对应 `merchant_patron_pressure_*` marker
- `event_record` → `merchant_patron_midlife_pressure`
- Stat 变化（轻量）：因分支而异，建议 +1~2 relevant stat（P106 润色）

### 3.5 Narrative Text (Reference)

> 商号越扩，门派的刀护得越实在——护镖要出人手，借道要讲规矩，商路上的纠纷得按江湖算法。山门又派人来传话，你站在账房与演武场之间，忽然明白：商武一体，是每一笔都要用刀来算的担子。

---

## 4. Player-Facing Expression Updates

### 4.1 Pressure-Specific Signals (至少 2 个)

#### Signal 1: Cost Label 深化

**位置：** `src/p50/sampleLineExpression.ts` → `deriveSampleLineCostLabel()`

**插入点：** `merchant_patron_on_ramp_done` 分支之后、`merchant_patron_payoff_done` 之前；在 magnate 分支之后。

| Variant | Before Pressure (on-ramp) | After Pressure |
|---------|---------------------------|----------------|
| Orthodox | 侠义盟约之累 | **侠义盟约之债** |
| Martial | 护商武力之累 | **护商武力之债** |
| Apprentice | 手艺护商之累 | **手艺护商之债** |
| Tavern | 人脉护商之累 | **人脉护商之债** |
| Peasant | 粮路护商之累 | **粮路护商之债** |
| Generic | 商武盟约之累 | **盟约护商之累** |

**Gate:** `flags.merchant_patron_midlife_pressure_done`

**为什么：** 从"累"深化为"债/负担兑现" — 与 magnate "赊欠之债" 和 renown "人情债渐重" 形成三角区分，但 patron 的"债"是武力盟约义务。

#### Signal 2: Current Goal 更新

**位置：** `src/p50/sampleLineExpression.ts` → `merchantCurrentGoal()`

**插入点：** 同上。

| Variant | Before Pressure (on-ramp) | After Pressure |
|---------|---------------------------|----------------|
| Orthodox | 银钱换侠义盟约，正把手中的商路与门派的剑绑在同一条绳上 | **一面守侠义盟约护商，一面应付门派索债般的武力差遣** |
| Martial | 武力护商路，正把护镖与放贷拧成一条商武绳 | **一面加派护镖撑商路，一面应付盟约兑现后的武力负担** |
| Apprentice | 手艺眼光换门派护商，正把刨花与剑鞘绑成一条商武绳 | **一面用手艺标准护商，一面应付盟约兑现后的品质与护镖两头紧** |
| Tavern | 酒肆人脉换门派借道，正把消息网与护镖拧成一条商武绳 | **一面靠消息网调度护商，一面应付盟约兑现后的借道与人手两头紧** |
| Peasant | 粮路脚力换门派护商，正把囤粮与护镖拧成一条商武绳 | **一面用粮路脚力撑护商，一面应付盟约兑现后的囤粮与护镖两头紧** |
| Generic | 商武一体之约已立，门派对投比单纯营利更烫手 | **一面扩张商路，一面应付门派护商盟约兑现后的武力负担** |

**Gate:** `flags.merchant_patron_midlife_pressure_done`

**Expression priority（与 P104 一致）：**
1. Magnate markers win
2. `merchant_patron_payoff_done` > pressure > on-ramp
3. Native orthodox/martial > bridge-origin variants
4. Generic fallback

### 4.2 Deferred Expression Updates

| Surface | Defer Reason |
|---------|--------------|
| `merchantAge40Identity()` | 属 payoff / identity 深化阶段 |
| Ordinary origin expression | Patron 当前仅在 sample line 表达；P106 可选 bonus |

---

## 5. Differences: Pressure vs On-Ramp vs Magnate Pressure

### 5.1 Pressure vs On-Ramp

| Aspect | On-Ramp (商武盟约) | Pressure (护商武力负担) |
|--------|---------------------|-------------------------|
| **阶段定位** | 上升期、盟约初立 | 维持期、负担兑现 |
| **核心情绪** | 绑定、成就感 | 疲惫、双重规矩 |
| **目标方向** | 向外绑盟约 | 向内维持 + 应付武力差遣 |
| **Cost label** | "之累"（抽象负担感） | "之债/之累"（盟约兑现） |

### 5.2 Patron Pressure vs Magnate Pressure

| Aspect | Patron Pressure | Magnate Pressure |
|--------|-----------------|------------------|
| **核心债务** | 武力盟约义务 | 金钱债 / 经营债 |
| **压力来源** | 护镖、借道、江湖规矩 | 赊账、扩张、周转 |
| **场景** | 账房与演武场之间 | 商铺 / 商路 |
| **事件模式** | Choice + variant branches | Choice + variant branches |
| **风味** | 商武一体、出钱出刀 | 巨贾、财富规模 |

### 5.3 Patron Pressure vs Renown Pressure

| Aspect | Patron Pressure | Renown Pressure |
|--------|-----------------|-----------------|
| **核心债务** | 武力盟约义务 | 江湖人情债 |
| **压力来源** | 门派护商差遣 | 名声太大、人情往来 |
| **场景** | 商号 + 山门 | 酒肆 |
| **事件模式** | Choice | Auto |
| **风味** | 商武复合 | 江湖名宿 |

---

## 6. Payoff / Late-Life Flag Interfaces (Reserved Only)

### 6.1 Flag Interfaces

| Flag | Purpose | Stage |
|------|---------|-------|
| `merchant_patron_payoff_done` | Payoff echo 检查点（已存在） | P102 — P106 可能调整 gate |
| `merchant_patron_identity_done` | Identity 终态（已存在） | P102 payoff echo |
| `merchant_patron_payoff_resolved` | Payoff choice 后果（预留） | P107+ |
| `merchant_patron_late_life_done` | Late-life 检查点（预留） | 远期 |

### 6.2 Payoff Gate Adjustment (P106 Note)

当前 `merchant_patron_payoff_echo` gate 仅读 `merchant_patron_on_ramp_done`。

**P106 建议（非 P105 实施）：**
- 将 payoff echo gate 改为 `merchant_patron_midlife_pressure_done` + `!merchant_patron_payoff_done`
- 或保持现有 gate 但在 P106 chain proof 中记录 pressure → payoff 时序

此调整为 P106 bounded wiring，P105 仅记录接口。

### 6.3 Narrative Hooks for Payoff

Pressure 事件应为 payoff 阶段埋下种子：
- "商武一体的名号，是靠盟约撑住的还是靠刀撑住的？"
- "能不能在商道与武道之间找到不再被两头拉扯的位置？"

---

## 7. Gate Acceptance (Pressure Checkpoint)

| Checkpoint | Required Flags | Acceptance |
|------------|----------------|------------|
| Pressure closed | `merchant_patron_midlife_pressure_done` | Set by any `merchant_patron_midlife_pressure` choice branch |
| Variant traceability | `merchant_patron_pressure_*` (one of) | Matches entry variant marker |
| Upstream satisfied | `merchant_patron_on_ramp_done` | Must be true before pressure fires |
| Downstream ready | `merchant_patron_payoff_done` = false | Payoff not yet consumed |

---

## 8. Implementation Notes (For P106)

### 8.1 Event Placement

**推荐位置：** `sample-lines-spine.json`，插入在 `merchant_patron_bridge_entry` 与 `merchant_patron_payoff_echo` 之间。

### 8.2 Expression Placement

**文件：** `src/p50/sampleLineExpression.ts`

**函数：** `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`

**模式：** 在现有 `merchant_patron_on_ramp_done` 与 `merchant_patron_payoff_done` 分支之间插入 `merchant_patron_midlife_pressure_done` 检查。

### 8.3 Variant Priority (Expression)

与 P104 确认的规则一致 — pressure 层不引入新 priority 体系，只读取已有 entry markers：

```
if (merchant_patron_midlife_pressure_done) {
  if (merchant_patron_on_ramp_orthodox) → orthodox pressure text
  else if (merchant_patron_on_ramp_martial) → martial pressure text
  else if (merchant_patron_bridge_apprentice_craft || apprentice_merchant_bridge_crossed) → apprentice
  else if (merchant_patron_bridge_tavern_network || tavern_merchant_bridge_crossed) → tavern
  else if (merchant_patron_bridge_peasant_grain || peasant_merchant_bridge_crossed) → peasant
  else → generic
}
```

---

**P105-004 complete.**
