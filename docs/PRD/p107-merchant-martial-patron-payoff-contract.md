# P107 Merchant Martial Patron Payoff Contract

> **Route:** `merchant_martial_patron`（商武一体金主）
> **Stage:** Payoff — 商武撕裂之解
> **Selected direction:** Choice-based payoff（商武撕裂怎么解？）
> **Preceding:** P102–P104 patron bridge entry / on-ramp + P106 pressure
> **Subsequent:** Late-life / endgame echo (P109+) — interfaces reserved only
> **Status:** LOCKED — P107 design-first complete

---

## 1. Core Direction

**Selected:** 商武撕裂之解 — choice-based payoff（商武一体的名号定型，选择驱动）

**Why choice-based (vs magnate auto):**
- Magnate payoff 是 auto（商业帝国自然成型），因为巨贾的成功是积累式的
- Patron payoff 应该是 choice-based，因为"商武撕裂怎么解"是价值判断问题
- Choice 显著提升 patron 路线与 magnate 路线的差异化
- 与 renown choice payoff（P76）结构对称，但商武风味独立

**Core narrative question:** 盟约如山、负担兑现之后，商武一体的名号你要怎么定型？

**Distinction from pressure:**
- Pressure = "护商武力负担兑现了"（意识到盟约代价）
- Payoff = "我选择这样定型商武一体"（主动解决商武撕裂）
- Pressure 回答"负担有多重"，Payoff 回答"负担之后我是谁"

**Distinction from P102 lightweight echo:**
- P102 echo = auto，名号落定，无选择
- P107 contract = choice，三个实质不同的商武定型路径
- P108 将 `merchant_patron_payoff_echo` 从 auto 升级为 choice

---

## 2. Three Choice Directions

### Option A: 硬扛盟约（盟约如山）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 侠义金主——盟约既立，刀出鞘、账落笔，一个字都不许反悔 |
| **核心叙事** | 商武一体的名号是靠盟约撑住的。护镖、借道、江湖规矩全都扛下来，商号与山门绑得更紧，名号更响，但账房与演武场之间的拉扯永不停歇。 |
| **Stat 变化** | businessAcumen +2, martialPower +3, reputation +2 |
| **Identity marker** | `merchant_patron_payoff_covenant_holder` |
| **远期伏笔** | 盟约越绑越紧（late-life 预留） |
| **叙事调性** | 悲剧英雄——为了名号牺牲自由 |

### Option B: 撕破盟约（断武从商）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 商路中人——账房里的数字比演武场的刀更可靠 |
| **核心叙事** | 商武一体的名号不该靠别人的刀撑。撕破护商盟约，断了门派差遣，商号归商号、江湖归江湖。财富保住了，但失去了山门庇护。 |
| **Stat 变化** | businessAcumen +4, martialPower -2, reputation -1 |
| **Identity marker** | `merchant_patron_payoff_covenant_breaker` |
| **远期伏笔** | 自由但孤立（late-life 预留） |
| **叙事调性** | 反英雄——撕破盟约，商路归商路 |

### Option C: 商武平衡（新盟新矩）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 商武掌柜的智慧——盟约可以改，规矩可以谈 |
| **核心叙事** | 商武一体不是绑死，是谈出来的。重新划定盟约边界——该出刀时出刀，该算账时算账，商号与山门各守其份，不再被两头拉扯。 |
| **Stat 变化** | businessAcumen +3, martialPower +1, reputation +2 |
| **Identity marker** | `merchant_patron_payoff_balancer` |
| **远期伏笔** | 可持续发展的新盟约（late-life 预留） |
| **叙事调性** | 中庸智者——谈出新规矩 |

**Differentiation check:** 三个选项有实质差异——stat 分布不同、identity marker 不同、cost label 不同、goal 不同、叙事调性不同。不是换皮。

---

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `merchant_patron_payoff_echo`（升级，保留 ID） |
| `version` | `2.0.0`（P108 bump） |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | **`choice`**（从 auto 升级） |
| `location` | `sample-lines-spine.json` |

### 3.2 Trigger Conditions

| Condition | Value | Source |
|-----------|-------|--------|
| Pressure done | `merchant_patron_midlife_pressure_done` | P106 upstream gate |
| Not yet paid off | `!merchant_patron_payoff_done` | Payoff guard |
| No orthodox/demonic seeds | `!orthodox_childhood_seed_done` && `!demonic_childhood_seed_done` | Spine exclusivity |

### 3.3 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 48 | 保持 P102 echo age band |
| `ageMax` | 52 | Pressure 40–44 后 +4–8 年缓冲 |
| Trigger | `age_reach: 48` | 与 renown payoff 节奏大致对齐 |

### 3.4 Choice Branches

| Choice ID | Narrative Framing | Payoff Marker |
|-----------|-------------------|---------------|
| `patron_payoff_hold_covenant` | 盟约如山，护镖借道一个都不能少——商武名号靠刀与账一起撑 | `merchant_patron_payoff_covenant_holder` |
| `patron_payoff_break_covenant` | 商号归商号，江湖归江湖——撕破盟约，不再听山门差遣 | `merchant_patron_payoff_covenant_breaker` |
| `patron_payoff_balance_covenant` | 盟约可以改，规矩可以谈——商武各守其份，不再两头拉扯 | `merchant_patron_payoff_balancer` |

### 3.5 Shared Effects (All Branches)

- 设置 `merchant_patron_payoff_done`（**Payoff 检查点**）
- 设置 `merchant_patron_identity_done`（Identity 终态）
- 设置 `merchant_patron_payoff_resolved`（**Payoff choice 后果总标记**）
- 设置对应 `merchant_patron_payoff_*` choice marker（三选一）
- `event_record` → `merchant_patron_payoff_echo`
- Stat 变化：按分支（见 §2）

### 3.6 Narrative Text (Reference)

**Title:** 商武一体·名号定型

**Text:**
> 四十八岁这年，你站在账房与演武场之间，想起当年那笔门派投资，也想起这些年护镖借道、江湖规矩拖进账本的每一页。
>
> 商武一体的名号已经传开，但你自己最清楚——这名号是靠盟约撑住的，还是靠刀撑住的，还是两者之间的某条绳？
>
> 山门的人还在等你的回话。这笔账，该定下来了。

**Choice options (reference):**

- **硬扛盟约：** "盟约既立，就没有退缩的字。护镖、借道、江湖规矩——我全扛。"
- **撕破盟约：** "商号是我的，不是山门的。这盟约，到此为止。"
- **商武平衡：** "盟约可以改。该出刀时出刀，该算账时算账——咱们重谈规矩。"

---

## 4. Player-Facing Expression Updates

### 4.1 Payoff-Specific Signals (至少 3 个)

Expression 读取优先级：`payoff_done` 分支内，先读 payoff choice marker，再 fallback entry variant。

#### Signal 1: Cost Label（按 payoff choice 分化）

**位置：** `deriveSampleLineCostLabel()` → `merchant_patron_payoff_done` 分支

| Payoff Choice | Cost Label |
|---------------|------------|
| covenant_holder | **盟约如山之累** |
| covenant_breaker | **断武从商之快** |
| balancer | **商武新矩之累** |
| fallback (payoff done, no choice marker) | 商武名号之累（legacy） |

**Gate:** `flags.merchant_patron_payoff_done` + payoff choice marker

#### Signal 2: Current Goal（按 payoff choice 分化）

**位置:** `merchantCurrentGoal()` → `merchant_patron_payoff_done` 分支

| Payoff Choice | Current Goal |
|---------------|--------------|
| covenant_holder | **硬扛盟约护商，商武名号靠刀与账一起撑** |
| covenant_breaker | **撕破盟约，商号不再听山门差遣** |
| balancer | **重谈盟约边界，商武各守其份** |
| fallback | 商武一体名号已定，门派对投与江湖护卫都成了招牌（legacy） |

**Gate:** `flags.merchant_patron_payoff_done` + payoff choice marker

#### Signal 3: Age-40 Identity（按 payoff choice × entry variant 分化）

**位置:** `merchantAge40Identity()` → `merchant_patron_identity_done` 分支

Payoff choice marker 优先于 entry variant 的 identity 分化。每个 payoff choice 提供 base identity；entry variant 可作为修饰（P108 实施时至少覆盖 native orthodox + 1 bridge-origin）。

| Payoff Choice | Base Identity (reference) |
|---------------|---------------------------|
| covenant_holder | 你是靠盟约定型的商武金主：出钱出刀都在一条绳上，名号越大，担子越重，但从不退缩 |
| covenant_breaker | 你是断武从商的巨贾：撕破盟约后商路靠自己，财富保住了，山门庇护没了 |
| balancer | 你是懂商武分寸的金主：重谈盟约后商号与山门各守其份，不再被两头拉扯 |

**Gate:** `flags.merchant_patron_identity_done` + payoff choice marker

### 4.2 Expression Priority (unchanged from P106)

1. Magnate markers win
2. `merchant_patron_payoff_done` > pressure > on-ramp
3. Within payoff: payoff choice marker > entry variant
4. Generic fallback

### 4.3 Deferred Expression Updates

| Surface | Defer Reason |
|---------|--------------|
| Ordinary origin patron expression | P108 optional bonus / defer |
| Life memory / summary | Late-life stage (P109+) |
| Full 5×3 entry×payoff identity matrix | P108 minimum: 1 native + 1 bridge per choice |

---

## 5. Differences: Payoff vs Pressure vs P102 Echo

### 5.1 Payoff vs Pressure

| Aspect | Pressure (护商武力负担) | Payoff (商武撕裂之解) |
|--------|-------------------------|----------------------|
| **阶段定位** | 维持期、负担兑现 | 定型期、身份抉择 |
| **核心情绪** | 疲惫、双重规矩 | 决断、我是谁 |
| **事件模式** | Choice（按 entry variant） | Choice（按 payoff 价值判断） |
| **Checkpoint** | `midlife_pressure_done` | `payoff_done` + `payoff_resolved` |
| **Cost label** | "之债"（盟约兑现） | "之累/之快/新矩"（定型后果） |

### 5.2 Payoff vs P102 Lightweight Echo

| Aspect | P102 Echo (auto) | P107 Contract (choice) |
|--------|------------------|------------------------|
| **玩家 agency** | 无（观看名号落定） | 有（选择商武定型路径） |
| **Identity** | 按 entry variant only | 按 payoff choice + entry variant |
| **Flags** | `payoff_done` + `identity_done` | + `payoff_resolved` + `payoff_*` marker |
| **Narrative** | "名号已定" | "名号怎么定" |

### 5.3 Patron Payoff vs Magnate / Renown Payoff

| Aspect | Magnate | Renown | Patron |
|--------|---------|--------|--------|
| **模式** | Auto | Choice | **Choice** |
| **核心问题** | 商业帝国成型 | 人情债怎么还 | **商武撕裂怎么解** |
| **场景** | 商铺 | 酒肆 | **账房与演武场** |
| **A 选项** | N/A | 硬扛面子 | **硬扛盟约** |
| **B 选项** | N/A | 撕破脸 | **撕破盟约** |
| **C 选项** | N/A | 人情世故 | **商武平衡** |

---

## 6. Flag Interfaces

### 6.1 Checkpoint Flags

| Flag | Purpose | Set By |
|------|---------|--------|
| `merchant_patron_payoff_done` | Payoff 检查点 | Any payoff choice |
| `merchant_patron_identity_done` | Identity 终态 | Any payoff choice |
| `merchant_patron_payoff_resolved` | Payoff choice 后果总标记 | Any payoff choice |

### 6.2 Choice-Specific Markers (三选一)

| Marker | Choice |
|--------|--------|
| `merchant_patron_payoff_covenant_holder` | 硬扛盟约 |
| `merchant_patron_payoff_covenant_breaker` | 撕破盟约 |
| `merchant_patron_payoff_balancer` | 商武平衡 |

### 6.3 Late-Life Reserved (P109+)

| Flag | Purpose | Stage |
|------|---------|-------|
| `merchant_patron_late_life_done` | Late-life 检查点 | P109+ |
| `merchant_patron_endgame_echo_done` | Endgame echo（若需要） | P110+ |

Late-life 应读取 payoff choice marker 以延续叙事（contract only；P109 实施）。

---

## 7. Gate Acceptance (Payoff Checkpoint)

| Checkpoint | Required Flags | Acceptance |
|------------|----------------|------------|
| Payoff closed | `merchant_patron_payoff_done` | Set by any payoff choice branch |
| Choice traceability | `merchant_patron_payoff_*` (one of 3) | Matches player choice |
| Resolved marker | `merchant_patron_payoff_resolved` | Set alongside payoff_done |
| Identity set | `merchant_patron_identity_done` | Set alongside payoff_done |
| Upstream satisfied | `merchant_patron_midlife_pressure_done` | Must be true before payoff fires |
| Late-life ready | `merchant_patron_late_life_done` = false | Not yet consumed |

---

## 8. Implementation Notes (For P108)

### 8.1 Event Upgrade Path

1. Change `merchant_patron_payoff_echo` `eventType` from `auto` to `choice`
2. Remove `autoEffects`; add 3 `choices` with conditions (no variant condition — all players see all 3)
3. Bump `version` to `2.0.0`
4. Update metadata tags: add `p107`, `p108`, `choice`; remove `auto` if present

### 8.2 Expression Placement

**文件:** `src/p50/sampleLineExpression.ts`

**函数:** `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`, `merchantAge40Identity()`

**模式:** 在 `merchant_patron_payoff_done` / `merchant_patron_identity_done` 分支内，先检查 payoff choice marker，再 fallback entry variant / legacy text.

### 8.3 Stat Threshold Gates (Optional Enhancement)

P108 可 defer stat 阈值检查；契约仅定义宽松 gate（pressure_done + age range）。

---

**P107-004 complete.**
