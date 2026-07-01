# P73 Renown On-Ramp Contract

> **Route:** jianghu_renown_sage（江湖名宿）
> **Origin:** tavern_hand（酒肆帮工）
> **Stage:** On-ramp spine — 过桥后的第一个标志性叙事节点
> **Preceding:** P71 bridge (tavern_renown_bridge_crossed) + P72 entry differentiation
> **Subsequent:** pressure (P74+) / payoff (P75+) — deferred

## 1. Core Narrative

### 1.1 Event Identity

**事件名称：** 江湖调解（或"声名初显"）

**核心叙事：**
你在江湖上的名声渐渐传开——不是因为武功多高，而是因为你认识的人多、能说上话、肯给面子。这日，两拨江湖人因为一点纠纷闹到酒肆，都指名要你主持公道。你知道，一旦接过这事，你的名字就不再只是"酒肆里的伙计"——你在江湖上有了位置。

**Tavern-born 风味锚点：**
- 事件发生在酒肆（或与酒肆相关的场景）
- 核心是"人脉"和"引荐"，不是武功
- 解决方式靠面子、人情、关系网，不是打打杀杀
- 声名是"人情往来的重量"，不是实力排名

### 1.2 What Makes It Iconic

这是 renown 路线的第一个真正内容事件，它回答了："过桥之后呢？"

- **Before on-ramp:** "我在江湖上有了些名号，常有人来寻我引荐"
- **After on-ramp:** "我第一次真正以江湖人的身份，主持了一场公道。我的名字，在江湖上有了分量。"

## 2. Trigger Conditions

### 2.1 Prerequisites

| Condition | Value | Source |
|-----------|-------|--------|
| Origin | `origin_tavern_hand` | childhood origin |
| Bridge crossed | `tavern_renown_bridge_crossed` | P71 bridge |
| Route committed | `route_renown_committed` | P71 bridge |
| Ally network seed | `ally_network` | childhood seed |

### 2.2 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 32 | bridge 在 29 岁，给 3 年缓冲期，让玩家感受"刚过桥"的状态 |
| `ageMax` | 35 | 确保在 midlife 前期触发，为后续 pressure/payoff 留空间 |
| Trigger | `age_reach: 32` | 与 merchant on-ramp (28-32) 的节奏对齐 |

### 2.3 Threshold Gates

最小门槛（确保玩家有一定基础后才触发）：

| Stat | Min Value | Rationale |
|------|-----------|-----------|
| `reputation` | ≥ 8 | 已有一定名声基础 |
| `connections` | ≥ 6 | 人脉网络初具规模 |
| `charisma` | ≥ 8 | 有人格魅力撑得起场面 |

**实现方式：** 通过 flag 表达或 stat 阈值检查（优先 flag，与现有系统一致）。

### 2.4 Exclusivity Guards

| Guard | Purpose |
|-------|---------|
| `!renown_on_ramp_done` | 只触发一次 |
| `!ordinary_tavern_midlife_done` | 与其他 tavern midlife 事件互斥（已由 bridge 事件保证） |
| `!tavern_merchant_bridge_crossed` | 与 merchant 路线互斥（已由 detectSampleLine 优先级保证） |

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `renown_on_ramp`（或 `tavern_renown_on_ramp`） |
| `version` | `1.0.0` |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | `auto`（与 merchant on-ramp 模式对齐；强制性里程碑事件） |

### 3.2 Auto Effects

**Auto 事件（无选择）：** 与 merchant on-ramp (`magnate_on_ramp`) 一致，on-ramp 是强制性里程碑事件，玩家到达后自动触发。

**效果：**
- 设置 `renown_on_ramp_done`（on-ramp 检查点）
- 设置 `tavern_renown_on_ramp`（事件触发标记）
- 效果：reputation +5, connections +4, charisma +2
- 叙事：你接过了这场调解，凭着认识的人和积攒的面子，竟真把事情摆平了。两拨人都服你的气，临走时都抱拳称一句「兄台高义」。你知道，从今天起，你的名字在江湖上有了分量。

**Note:** 选择 auto 而非 choice 的原因：1) 与 merchant on-ramp 模式对齐（magnate_on_ramp 也是 auto）；2) on-ramp 是路线的标志性节点，玩家既然选择了 renown 路线（在 bridge 阶段选择），on-ramp 就是自然进展；3) 如果需要"拒绝 on-ramp"的分支，可以在后续阶段添加。

### 3.3 Checkpoint Flags

| Flag | Set By | Purpose |
|------|--------|---------|
| `renown_on_ramp_done` | Auto event | **On-ramp 检查点** — 后续 pressure/payoff 的前置条件 |
| `tavern_renown_on_ramp` | Auto event | 事件触发标记（origin-scoped） |

## 4. Expression Updates

### 4.1 Current Goal (Sample Line)

`renownCurrentGoal()` 新增 on-ramp 分支：

- **Before on-ramp:** "凭人脉声名在江湖立足，常有人来寻你引荐主事"
- **After on-ramp (accepted):** "在江湖上有了名号，常有人来请你主持公道、引荐高人"
- **After on-ramp (declined):** 保持 entry 状态（不变化）

### 4.2 Current Goal (Ordinary Origin)

`tavernCurrentGoal()` 新增 on-ramp 分支：

- **Before on-ramp:** "江湖上渐渐有了名声，常有人来寻你引荐"
- **After on-ramp (accepted):** "江湖上有了名号，常有人来请你主持公道"

### 4.3 Life Memory (Ordinary Origin)

`tavernLifeMemory()` 新增 on-ramp 分支：

- **After on-ramp (accepted):** "你第一次以江湖人的身份主持了公道，两拨人都服你的气。从那天起，你的名字在江湖上有了分量——不是因为武功，是因为人脉和面子。"

### 4.4 Summary (Ordinary Origin)

`deriveOrdinaryOriginSummary()` 新增 on-ramp 分支：

- **Before on-ramp:** "酒肆出身的江湖人物：靠人脉和名声在江湖上立足。"
- **After on-ramp (accepted):** "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。"

### 4.5 Cost Label (Sample Line)

`deriveSampleLineCostLabel()` on-ramp 后是否增强？

- **P73 范围：** 保持 "江湖声名之累" 不变
- **Defer to pressure stage：** 深化代价感（"人情债渐重" 等）

### 4.6 Age-40 Identity (Sample Line)

`renownAge40Identity()` on-ramp 后是否增强？

- **P73 范围：** 保持现有文本不变（基础版已足够）
- **Defer to payoff stage：** 深化身份表达

## 5. Subsequent Stage Interfaces

### 5.1 Flag Interfaces for Future Stages

P73 预留以下 flag 接口，供后续阶段使用：

| Flag | Purpose | Stage |
|------|---------|-------|
| `renown_midlife_pressure_done` | Midlife pressure 检查点 | P74+ |
| `renown_payoff_done` | Payoff 检查点 | P75+ |
| `renown_age40_identity_done` | Age-40 identity 检查点 | P75+ |

### 5.2 Narrative Hooks for Pressure

On-ramp 事件应埋下 pressure 阶段的种子：
- "人情债" 的伏笔
- "名声越大，麻烦越多" 的暗示
- "站得越高，越难抽身" 的预感

这些种子在 on-ramp 文本中暗示，但不展开。

## 6. Implementation Notes

### 6.1 Event Placement

放在哪里？两个选项：

| Option | Location | Pros | Cons |
|--------|----------|------|------|
| **A** | `ordinary-origin-midlife.json` | 与 bridge 事件同文件，tavern origin 集中 | 该文件已到 midlife 后期（age 29），on-ramp (age 32) 可能超出"midlife growth"范围 |
| **B** | `sample-lines-spine.json` | 与 merchant `magnate_on_ramp` 同模式，sample line spine 集中 | 需要确认 renown 是否已接入 sample-lines-spine 系统 |

**推荐：** Option B — `sample-lines-spine.json`  
**理由：** 与 merchant `magnate_on_ramp` 模式一致，属于 sample line spine 事件，不是 ordinary origin growth 事件。

### 6.2 Stat Threshold Implementation

现有事件系统是否支持 stat 阈值检查？

- 若支持：直接用 `stat_gte` 条件
- 若不支持：用 flag 代理（通过其他事件设置门槛 flag）

**P73 策略：** 先用宽松条件（仅 bridge + age range），确保能触发；stat 阈值作为增强项，若系统支持则加上，否则 defer。

### 6.3 Compatibility with P71/P72

- P71 bridge 事件设置的 flag 完全兼容
- P72 entry expression 作为 on-ramp 前的状态，完全兼容
- `detectSampleLine()` 优先级不变（renown 仍优先于 merchant）
- 普通 tavern 路径不受影响

## 7. Validation Shape

P73 需要验证的关键点：

1. **触发条件：** bridge 后 + age 32-35 → 事件触发
2. **Flag 设置：** Option A → `renown_on_ramp_done` 正确设置
3. **表达更新：** on-ramp 前后 currentGoal / summary / lifeMemory 有差异
4. **风味正确：** tavern-born + renown 风味贯穿
5. **无退化：** P71/P72 既有 evidence 不退化
6. **差异化：** 与 merchant on-ramp / plain tavern 有区分

---
**Contract owner:** P73 on-ramp spine stage  
**Contract status:** Defined (for implementation in P73-004/005)
