# P105 Merchant Martial Patron Pressure Direction Comparison

> **Date:** 2026-07-02
> **Stage:** P105 Wuxia Merchant Martial Patron Pressure Design-First
> **Route:** `merchant_martial_patron`（商武一体金主）

---

## 1. Purpose

为 `merchant_martial_patron` 的 pressure 阶段比较多个叙事方向，选定最符合商武一体风味、最 bounded、最适合 small-step 实施的方向。

本比较遵循 quality-first + small-step 原则：
- **Quality first:** 风味正确性 > 叙事丰富度 > 实现复杂度
- **Small step:** 优先选择能用 1 个核心事件（+ variant 分支）+ 少量表达更新实现的方向

---

## 2. Candidates Overview

| # | Direction | Core Narrative | 商武一体 Fit | Boundedness | Distinction from Magnate/Renown | Implementation Risk |
|---|-----------|----------------|--------------|-------------|--------------------------------|---------------------|
| A | **护商武力负担** (Martial Backer Burden) | 门派护商盟约兑现了，但护镖、借道、江湖纠纷都要按武道规矩算，商路越扩负担越重 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| B | **门派人情债** (Sect Favor Debt) | 投银换盟约欠下门派人情，掌门开口要你还，商武边界模糊 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Medium |
| C | **商武身份撕裂** (Merchant-Martial Identity Split) | 商人与江湖人的双重身份冲突，两边规矩打架，自我认同危机 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | High |

---

## 3. Candidate A: 护商武力负担 (Martial Backer Burden)

### 3.1 Core Narrative

**一句话概括：** 当年投银换护商，如今商路铺开了，门派的刀也确实护住了货——可每一笔护镖、每一次借道、每一起江湖纠纷，都要按武道规矩算，账本上的数字算不清这笔账。

**叙事弧光：**
- **On-ramp (商武盟约):** 银钱换盟约，商路与剑鞘绑在一起，上升期
- **Pressure (护商武力负担):** 盟约兑现了，但护商武力成了甩不掉的担子——商路上的麻烦要出刀，江湖恩怨会拖进账本
- **(Payoff 伏笔):** 商武一体名号能否稳住，取决于你如何在商道与武道之间找平衡

**商武一体锚点：**
- 压力来源是"护商武力"和"盟约兑现"，不是纯金钱（magnate）也不是纯人情（renown）
- Entry 文本已埋伏笔："商路上的纠纷，要按江湖规矩算；江湖上的恩怨，也会拖进账本"
- On-ramp cost labels 已命名："护商武力之累"、"侠义盟约之累" — pressure 是自然深化

### 3.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `merchant_patron_on_ramp_done` | Entry 之后才谈负担 |
| Age range | 40–44 | Entry 34–38 后 2–6 年缓冲 |
| Exclusivity | `!merchant_patron_midlife_pressure_done` | 只触发一次 |
| Variant | Entry variant markers | 读取已有 5 条变体，不新建变体体系 |

### 3.3 Player Choice Space

**建议：Choice 事件（对齐 `magnate_midlife_pressure`）**

- 1 个核心事件 `merchant_patron_midlife_pressure`
- 按 entry variant 提供条件分支 choice + generic fallback
- 玩家选择"如何应对当前一波护商负担"（守盟约 / 收缩护镖 / generic 硬扛）
- 所有分支设共享 checkpoint `merchant_patron_midlife_pressure_done`

### 3.4 Player-Facing Signals (至少 2 个)

1. **Cost Label 深化：** "护商武力之累" → "盟约护商之累"（或 variant-specific 深化）
2. **Current Goal 更新：** "正把护镖与放贷拧成一条商武绳" → "一面扩张商路，一面应付门派护商盟约兑现后的武力负担"

### 3.5 Distinction Assessment

| vs | Distinction |
|----|-------------|
| Magnate | Magnate = 金钱债/经营规模；Patron = 武力盟约/护商负担 |
| Renown | Renown = 江湖人情债；Patron = 商武复合的武力义务 |
| On-ramp | On-ramp = 上升期绑盟约；Pressure = 维持期负担显现 |

**风味评分：⭐⭐⭐⭐⭐ (5/5)**

**Boundedness：⭐⭐⭐⭐⭐ — 1 事件 + variant branches + 2 表达更新**

---

## 4. Candidate B: 门派人情债 (Sect Favor Debt)

### 4.1 Core Narrative

**一句话概括：** 投银进门派换的是盟约，可掌门、长老开口要你办事——还的是人情，不是利息。

**优势：** 叙事直观，与 entry 的"门派投资"直接挂钩。

**劣势：**
- 与 renown pressure（人情债渐重）风味重叠度高 — "人情"是 renown 的核心符号
- 与 magnate pressure 标题"人情如网"也有语义碰撞
- 商武一体的独特性被削弱为"又一种人情债"

### 4.2 Distinction Assessment

| vs | Distinction |
|----|-------------|
| Magnate | ⚠️ 弱 — magnate 已有"人情债" framing |
| Renown | ❌ 重叠 — 都是人情债，只是场景不同（酒肆 vs 山门） |
| On-ramp | ✅ 有延续 — 投资换盟约 |

**风味评分：⭐⭐⭐⭐ (4/5) — 可行但与 renown 太近**

**Boundedness：⭐⭐⭐⭐ — 实现简单但风味区分度不足**

---

## 5. Candidate C: 商武复合身份撕裂 (Merchant-Martial Identity Split)

### 5.1 Core Narrative

**一句话概括：** 你是商人还是江湖人？商号要守信誉，江湖要守义气——两边规矩打架，你自己也不知道该站哪边。

**优势：** 戏剧张力强，直击"商武一体"的身份悖论。

**劣势：**
- 需要更多叙事铺垫和 choice 分支才能成立 — 超出 small-step
- 与 on-ramp 的"绑成一条绳"积极基调反差过大，需要额外过渡
- 表达更新面更广（identity 深化），容易滑向 mid/late-life 范围
- 实现风险高：identity crisis 主题需要 payoff 阶段承接，pressure 单独承载不够

### 5.2 Distinction Assessment

| vs | Distinction |
|----|-------------|
| Magnate | ✅ 强 — 身份撕裂 vs 经营负担 |
| Renown | ✅ 强 — 身份认同 vs 人情债 |
| On-ramp | ⚠️ 跳跃大 — 从"绑绳"直接到"撕裂" |

**风味评分：⭐⭐⭐ (3/5) — 方向正确但时机过早**

**Boundedness：⭐⭐ — 需要更多事件和表达才能闭环**

---

## 6. Recommendation

### 6.1 Selected Direction: **A — 护商武力负担 (Martial Backer Burden)**

**理由：**

1. **风味最准：** 商武一体的核心是"出钱出刀"的复合义务，护商武力负担直接承接 entry 盟约叙事
2. **On-ramp 自然延伸：** Cost labels 已有"护商武力之累"等，pressure 是深化而非转向
3. **区分度最高：** 与 magnate（金钱债）和 renown（人情债）形成清晰三角
4. **最 bounded：** 1 个 choice 事件 + 5 variant 条件分支 + generic fallback + 2 表达更新
5. **先例对齐：** 模式与 `magnate_midlife_pressure` 对称，P106 实施成本最低

### 6.2 Rejected Directions

| Direction | Verdict | Reason |
|-----------|---------|--------|
| B — 门派人情债 | **Reject** | 与 renown pressure 风味重叠；magnate 已有"人情"语义 |
| C — 商武身份撕裂 | **Defer** | 戏剧价值高但超出 pressure small-step；留给 patron mid/late-life 或 payoff 深化 |

### 6.3 Quality-First / Small-Step Alignment

| Principle | A (Selected) | B | C |
|-----------|-------------|---|---|
| 风味正确性 | ✅ 5/5 | ⚠️ 4/5 | ⚠️ 3/5 |
| 最小实施面 | ✅ 1 event + branches | ✅ 1 event | ❌ 多事件 |
| 先例可复用 | ✅ magnate pattern | ✅ renown-like | ❌ 新 pattern |
| P106 无歧义输入 | ✅ | ⚠️ 需额外区分 renown | ❌ 范围不清 |

---

## 7. Open Questions Resolved for Contract

| Question (from PRD §7) | Resolution |
|------------------------|------------|
| Pressure age band | **40–44** — entry 34–38 后独立窗口，对齐 magnate midlife 节奏 |
| Native variant fork at pressure | **共用 1 事件 + 表达分支** — 读取 entry variant markers，不新建变体体系 |

---

**P105-003 complete.**
