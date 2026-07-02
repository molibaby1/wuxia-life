# P109 Merchant Martial Patron Late-Life Contract

> **Route:** `merchant_martial_patron`（商武一体金主）
> **Stage:** Late-Life — 商武定型的晚年
> **Selected direction:** Auto event with 3 branches keyed on payoff choice
> **Preceding:** P102–P104 patron bridge entry / on-ramp + P106 pressure + P108 payoff
> **Subsequent:** Endgame echo (P111+) — interfaces reserved only
> **Status:** LOCKED — P109 design-first complete

---

## 1. Core Direction

**Selected:** 商武定型的晚年 — auto late-life with 3 payoff-driven branches

**Why auto (not choice):**
- Late-life 是 payoff 选择的 *后果*，不是新选择
- 玩家已在 payoff（48–52 岁）做了商武定型价值判断
- 与 renown late-life（P78）结构对称
- 与 magnate late-life choice 区分（magnate 是 entry track 分化）

**Core narrative question:** 商武撕裂之解的选择，带来了怎样的晚年？

**Distinction from payoff:**
- Payoff = "我选择这样定型商武一体"（主动抉择，choice event）
- Late-life = "这个选择，带来了这样的晚年"（自然后果，auto event）
- Payoff 回答"我是谁"，Late-life 回答"这个身份晚年怎么过"

**Distinction from endgame echo:**
- Endgame echo = 临终回顾 / 最终遗产（P111+）
- Late-life = 50岁+ 的活跃人生阶段，有自己的叙事和身份
- Late-life 在 endgame 之前；预留 `merchant_patron_endgame_echo_done` 接口

---

## 2. Three Branch Directions

### Branch A: 盟约绑紧（Covenant Bound）

| 维度 | 内容 |
|------|------|
| **Payoff marker** | `merchant_patron_payoff_covenant_holder` |
| **Flavor 锚点** | 盟约终老——护镖借道一件接一件，刀与算盘都没放下 |
| **核心叙事** | 硬扛盟约的后果：晚年山门差遣比账房还多，商武名号响了一辈子，担子也重了一辈子，但不退缩。 |
| **Stat 变化** | martialPower +1, reputation +2, businessAcumen +1 |
| **Late-life marker** | `merchant_patron_late_covenant_bound` |
| **叙事调性** | 悲剧英雄——盟约如山终老 |

### Branch B: 自由孤立（Isolated Merchant）

| 维度 | 内容 |
|------|------|
| **Payoff marker** | `merchant_patron_payoff_covenant_breaker` |
| **Flavor 锚点** | 孤商自在——商号靠自己，山门疏远，自由且孤立 |
| **核心叙事** | 撕破盟约的后果：商路完全靠自己，没人借道没人护镖，但也没人指手画脚。自由是真的，孤立也是真的。 |
| **Stat 变化** | businessAcumen +3, martialPower -1, reputation 0 |
| **Late-life marker** | `merchant_patron_late_isolated_merchant` |
| **叙事调性** | 反英雄——断武孤商 |

### Branch C: 新盟可持续（Sustainable Covenant）

| 维度 | 内容 |
|------|------|
| **Payoff marker** | `merchant_patron_payoff_balancer` |
| **Flavor 锚点** | 新盟掌局——重谈的规矩还在运转，后来人请教商武分寸 |
| **核心叙事** | 商武平衡的后果：新盟约可持续运转，账房与演武场不再两头拉扯，成了商武一体的理想晚年。 |
| **Stat 变化** | businessAcumen +2, martialPower +1, reputation +2 |
| **Late-life marker** | `merchant_patron_late_sustainable_covenant` |
| **叙事调性** | 中庸智者——新盟久立 |

**Differentiation check:** 三个分支有实质差异——stat 分布不同、late-life marker 不同、cost label 不同、goal 不同、identity 不同、叙事调性不同。不是换皮。

---

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `merchant_patron_late_life` |
| `version` | `1.0.0` |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | **`auto`** |
| `location` | `sample-lines-spine.json` |

### 3.2 Trigger Conditions

| Condition | Value | Source |
|-----------|-------|--------|
| Payoff done | `merchant_patron_payoff_done` | P108 upstream gate |
| Not yet late-life | `!merchant_patron_late_life_done` | Late-life guard |
| No orthodox/demonic seeds | `!orthodox_childhood_seed_done` && `!demonic_childhood_seed_done` | Spine exclusivity |

### 3.3 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 52 | Payoff 48–52 后 +0–4 年；对齐 renown P78 |
| `ageMax` | 56 | Bounded late-life window |
| Trigger | `age_reach: 52` | 与 renown late-life 节奏对齐 |

### 3.4 Branching Logic

Branching is based on which payoff choice marker is set:
- `merchant_patron_payoff_covenant_holder` → Branch A (盟约绑紧)
- `merchant_patron_payoff_covenant_breaker` → Branch B (自由孤立)
- `merchant_patron_payoff_balancer` → Branch C (新盟可持续)

**Exactly one of these three will be set** (guaranteed by payoff event).

Implementation pattern: single auto event with conditional `branchEffects` or equivalent spine branching keyed on payoff marker.

### 3.5 Shared Effects (All Branches)

- 设置 `merchant_patron_late_life_done`（**Late-life 检查点**）
- 设置 `merchant_patron_late_life_identity_done`（Late-life 身份深化）
- 设置对应 `merchant_patron_late_*` branch marker（三选一）
- `event_record` → `merchant_patron_late_life`
- Stat 变化：按分支（见 §2）

### 3.6 Narrative Text (Reference)

**Title:** 商武一体·晚年几何

**Shared opening text:**
> 五十二岁这年，你站在账房与演武场之间，想起四十八岁那年的选择。
>
> 商武一体的名号传了这些年，江湖上的评价也定了调。可你自己最清楚——当年定下的路，到了晚年，是个什么光景？
>
> 账房里的算盘还在响，演武场的刀还在磨。这笔晚年的账，该算清了。

**Branch-specific text continues based on payoff choice** (see direction comparison §4–6).

---

## 4. Player-Facing Expression Updates

### 4.1 Late-Life-Specific Signals (至少 3 个)

Expression 读取优先级：`late_life_done` 分支内，先读 late-life branch marker，再 fallback payoff choice marker。

**Gate order (P110):** `merchant_patron_late_life_done` > `merchant_patron_payoff_done` > `merchant_patron_midlife_pressure_done` > on-ramp

#### Signal 1: Cost Label（按 late-life branch 分化）

**位置：** `deriveSampleLineCostLabel()` → `merchant_patron_late_life_done` 分支

| Late-Life Branch | Cost Label |
|------------------|------------|
| covenant_bound | **盟约终老之累** |
| isolated_merchant | **孤商自在之快** |
| sustainable_covenant | **新盟久立之累** |
| fallback (late-life done, no branch marker) | 商武晚年之累 |

**Gate:** `flags.merchant_patron_late_life_done` + late-life branch marker

#### Signal 2: Current Goal（按 late-life branch 分化）

**位置:** `merchantCurrentGoal()` → `merchant_patron_late_life_done` 分支

| Late-Life Branch | Current Goal |
|------------------|--------------|
| covenant_bound | **守盟约至终，商武名号不能倒** |
| isolated_merchant | **商路自分断，不再求山门庇护** |
| sustainable_covenant | **守新盟规矩，传商武分寸给后来人** |
| fallback | 商武定型之后，晚年自有晚年的过法 |

**Gate:** `flags.merchant_patron_late_life_done` + late-life branch marker

#### Signal 3: Age-40 Identity（按 late-life branch × entry variant 分化）

**位置:** `merchantAge40Identity()` → `merchant_patron_late_life_identity_done` 分支

Late-life branch marker 优先于 payoff choice marker。每个 late-life branch 提供 base identity；entry variant 可作为修饰（P110 实施时至少覆盖 native orthodox + 1 bridge-origin）。

| Late-Life Branch | Base Identity (reference) |
|------------------|----------------------------|
| covenant_bound | 盟约终老的商武金主：硬扛了一辈子盟约，晚年山门差遣比账房还多。护镖借道一件接一件，刀与算盘都没放下，但从不退缩 |
| isolated_merchant | 孤商巨贾：撕破盟约后商号靠自己撑起来了。山门疏远，商路自撑，自由是真的，孤立也是真的 |
| sustainable_covenant | 新盟掌局的金主：重谈的盟约规矩还在运转，商号与山门各守其份。后来人请教商武分寸，账房与演武场终于不再两头拉扯 |

**Gate:** `flags.merchant_patron_late_life_identity_done` + late-life branch marker

### 4.2 Expression Priority (updated for P110)

1. Magnate markers win
2. `merchant_patron_late_life_done` > `merchant_patron_payoff_done` > pressure > on-ramp
3. Within late-life: late-life branch marker > payoff choice marker > entry variant
4. Generic fallback

### 4.3 Deferred Expression Updates

| Surface | Defer Reason |
|---------|--------------|
| Ordinary origin patron expression | P110 optional bonus / defer |
| Life memory / summary | Endgame echo stage (P111+) |
| Full 5×3 entry×payoff×late-life identity matrix | P110 minimum: 1 native + 1 bridge per branch |

---

## 5. Differences: Late-Life vs Payoff vs Magnate/Renown Late-Life

### 5.1 Late-Life vs Payoff

| Aspect | Payoff (商武撕裂之解) | Late-Life (商武定型的晚年) |
|--------|----------------------|---------------------------|
| **阶段定位** | 定型期、身份抉择 | 后果期、晚年展开 |
| **核心情绪** | 决断、我是谁 | 沉淀、这个选择带来了什么 |
| **事件模式** | Choice（3 选项） | Auto（3 条件分支） |
| **Checkpoint** | `payoff_done` + `payoff_resolved` | `late_life_done` + `late_life_identity_done` |
| **Age band** | 48–52 | 52–56 |
| **Cost label** | 之累/之快/新矩 | 终老之累/自在之快/久立之累 |

### 5.2 Patron Late-Life vs Magnate Late-Life

| Aspect | Magnate | Patron |
|--------|---------|--------|
| **模式** | Choice (ledger/caravan) | Auto × 3 branches |
| **分支 key** | Entry track markers | Payoff choice markers |
| **核心问题** | 守成怎么传 | 商武定型晚年怎么过 |
| **场景** | 商铺/商路 | 账房与演武场 |
| **玩家 agency** | Late-life 仍有选择 | Late-life 是后果展开 |

### 5.3 Patron Late-Life vs Renown Late-Life

| Aspect | Renown | Patron |
|--------|--------|--------|
| **模式** | Auto × 3 branches | Auto × 3 branches |
| **分支 key** | Payoff choice markers | Payoff choice markers |
| **核心问题** | 人情债的晚年 | 商武定型的晚年 |
| **场景** | 酒肆门口 | 账房与演武场 |
| **A 分支** | 油尽灯枯 | 盟约绑紧 |
| **B 分支** | 逍遥自在 | 自由孤立 |
| **C 分支** | 传承授业 | 新盟可持续 |

---

## 6. Flag Interfaces

### 6.1 Checkpoint Flags

| Flag | Purpose | Set By |
|------|---------|--------|
| `merchant_patron_late_life_done` | Late-life 检查点 | Any late-life branch |
| `merchant_patron_late_life_identity_done` | Late-life 身份深化 | Any late-life branch |

### 6.2 Branch-Specific Markers (三选一)

| Marker | Branch |
|--------|--------|
| `merchant_patron_late_covenant_bound` | 盟约绑紧 (A) |
| `merchant_patron_late_isolated_merchant` | 自由孤立 (B) |
| `merchant_patron_late_sustainable_covenant` | 新盟可持续 (C) |

### 6.3 Endgame Echo Reserved (P111+)

| Flag | Purpose | Stage |
|------|---------|-------|
| `merchant_patron_endgame_echo_done` | Endgame echo 检查点 | P111+ |

Endgame echo 应读取 late-life branch marker 以延续叙事（contract only；P111 设计）。

---

## 7. Gate Acceptance (Late-Life Checkpoint)

| Checkpoint | Required Flags | Acceptance |
|------------|----------------|------------|
| Late-life closed | `merchant_patron_late_life_done` | Set by any late-life branch |
| Branch traceability | `merchant_patron_late_*` (one of 3) | Matches payoff choice marker |
| Identity set | `merchant_patron_late_life_identity_done` | Set alongside late_life_done |
| Upstream satisfied | `merchant_patron_payoff_done` + one `merchant_patron_payoff_*` | Must be true before late-life fires |
| Endgame ready | `merchant_patron_endgame_echo_done` = false | Not yet consumed |

---

## 8. Implementation Notes (For P110)

### 8.1 Event Wiring Path

1. Add `merchant_patron_late_life` auto event to `sample-lines-spine.json`
2. Insert after `merchant_patron_payoff_echo` in spine ordering
3. Configure 3 conditional branches keyed on payoff markers
4. Set checkpoint + branch markers per branch
5. Bump metadata tags: `p109`, `p110`, `auto`, `late-life`

### 8.2 Expression Placement

**文件:** `src/p50/sampleLineExpression.ts`

**函数:** `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`, `merchantAge40Identity()`

**模式:** 在 `merchant_patron_late_life_done` / `merchant_patron_late_life_identity_done` 分支内，先检查 late-life branch marker，再 fallback payoff / entry variant.

### 8.3 Stat Threshold Gates (Optional Enhancement)

P110 可 defer stat 阈值检查；契约仅定义宽松 gate（payoff_done + age range + payoff marker present).

---

**P109-004 complete.**
