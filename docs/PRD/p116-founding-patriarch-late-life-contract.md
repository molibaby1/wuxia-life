# P116 Founding Patriarch Late-Life Contract

> **Route:** `founding_patriarch`（开派祖师）
> **Stage:** Late-Life — 门派治理次序的晚年
> **Selected direction:** Auto event with 2 branches keyed on pressure marker
> **Preceding:** P113 bridge entry / on-ramp + P115 midlife pressure + P113 payoff
> **Subsequent:** Endgame echo (P118+) — interfaces reserved only
> **Status:** LOCKED — P116 design-first complete

---

## 1. Core Direction

**Selected:** 门派治理次序的晚年 — auto late-life with 2 pressure-driven branches

**Why auto (not choice):**
- Late-life 是 pressure 治理次序选择的 *后果*，不是新选择
- 玩家已在 pressure（40–45 岁）做了门规 vs 盟约的次序判断；payoff（48–52 岁）做了名号定型
- 与 patron late-life（P109）/ renown late-life（P78）结构对称
- 与 magnate late-life choice 区分（magnate 是 entry track 分化）

**Why pressure-keyed (not payoff-keyed):**
- P115 pressure 已明确分化 `rule_first` / `alliance_first` 治理次序，是 founding-patriarch 独有风味
- Payoff 三选一（续责/自立/双门）是名号定型层面的价值判断，适合表达修饰层
- 2 分支 minimum 满足 bounded default；与 patron 的 3 payoff branches 形成路线差异化

**Core narrative question:** 治理次序之后，开派晚年怎么过？

**Distinction from pressure:**
- Pressure = "我先稳哪一边"（治理次序，choice event）
- Late-life = "这个次序，带来了这样的晚年"（自然后果，auto event）

**Distinction from payoff:**
- Payoff = "我怎样定型开派名号"（身份抉择，choice event）
- Late-life = "这个治理次序晚年怎么展开"（沉淀后果，auto event）

**Distinction from endgame echo:**
- Endgame echo = 临终回顾 / 最终遗产（P118+）
- Late-life = 50岁+ 的活跃人生阶段，有自己的叙事和身份
- Late-life 在 endgame 之前；预留 `founding_patriarch_endgame_echo_done` 接口

---

## 2. Two Branch Directions

### Branch A: 门规守成终老（Rule Keeper）

| 维度 | 内容 |
|------|------|
| **Pressure marker** | `founding_patriarch_pressure_rule_first` |
| **Flavor 锚点** | 门规守成——书斋治学比盟约文书更占心思，弟子争议一件接一件 |
| **核心叙事** | 先稳门规传承的后果：晚年以书斋治学为主，盟约事务退为背景，门规守了一辈子。 |
| **Stat 变化** | reputation +2, connections +1, martialPower +1 |
| **Late-life marker** | `founding_patriarch_late_rule_keeper` |
| **叙事调性** | 沉稳守成——门规立派终老 |

### Branch B: 盟约续责终老（Alliance Bearer）

| 维度 | 内容 |
|------|------|
| **Pressure marker** | `founding_patriarch_pressure_alliance_first` |
| **Flavor 锚点** | 盟约续责——诸派差遣比治学卷宗更占心思，门规收束为执行工具 |
| **核心叙事** | 先稳诸派盟约的后果：晚年以山门对外为主，门规收束为工具，盟约扛了一辈子。 |
| **Stat 变化** | reputation +3, connections +2, martialPower 0 |
| **Late-life marker** | `founding_patriarch_late_alliance_bearer` |
| **叙事调性** | 疲惫续责——盟约立派终老 |

**Differentiation check:** 两个分支有实质差异——stat 分布不同、late-life marker 不同、cost label 不同、goal 不同、identity 不同、叙事调性不同。不是换皮。

---

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `founding_patriarch_late_life` |
| `version` | `1.0.0` |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | **`auto`** |
| `location` | `sample-lines-spine.json` |

### 3.2 Trigger Conditions

| Condition | Value | Source |
|-----------|-------|--------|
| Payoff done | `founding_patriarch_payoff_done` | P113 upstream gate |
| Not yet late-life | `!founding_patriarch_late_life_done` | Late-life guard |
| Orthodox exclusivity | `orthodox_childhood_seed_done` && !demonic/merchant seeds | Spine exclusivity |
| Pressure marker present | `founding_patriarch_pressure_rule_first` OR `founding_patriarch_pressure_alliance_first` | Branch key |

### 3.3 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 52 | Payoff 48–52 后 +0–4 年；对齐 patron P109 / renown P78 |
| `ageMax` | 56 | Bounded late-life window |
| Trigger | `age_reach: 52` | 与 patron/renown late-life 节奏对齐 |

### 3.4 Branching Logic

Branching is based on which pressure marker is set:
- `founding_patriarch_pressure_rule_first` → Branch A (门规守成终老)
- `founding_patriarch_pressure_alliance_first` → Branch B (盟约续责终老)

**Exactly one of these two will be set** (guaranteed by P115 pressure event mutual exclusion).

Implementation pattern: single auto event with conditional `branchEffects` or equivalent spine branching keyed on pressure marker.

### 3.5 Shared Effects (All Branches)

- 设置 `founding_patriarch_late_life_done`（**Late-life 检查点**）
- 设置 `founding_patriarch_late_life_identity_done`（Late-life 身份深化）
- 设置对应 `founding_patriarch_late_*` branch marker（二选一）
- `event_record` → `founding_patriarch_late_life`
- Stat 变化：按分支（见 §2）

### 3.6 Narrative Text (Reference)

**Title:** 开派祖师·晚年几何

**Shared opening text:**
> 五十二岁这年，你站在山门与书斋之间，想起四十岁那年的次序选择。
>
> 开宗立派的名号传了这些年，江湖上的评价也定了调。可你自己最清楚——当年定下的治理次序，到了晚年，是个什么光景？
>
> 书斋里的卷宗还在翻，山门外的盟约还在续。这笔晚年的账，该算清了。

**Branch-specific text continues based on pressure marker** (see direction comparison §4–5).

---

## 4. Player-Facing Expression Updates

### 4.1 Late-Life-Specific Signals (至少 3 个)

Expression 读取优先级：`late_life_done` 分支内，先读 late-life branch marker，再 fallback pressure / payoff marker。

**Gate order (P117):** `founding_patriarch_late_life_done` > `founding_patriarch_payoff_done` > `founding_patriarch_midlife_pressure_done` > on-ramp

#### Signal 1: Cost Label（按 late-life branch 分化）

**位置：** `deriveSampleLineCostLabel()` → `founding_patriarch_late_life_done` 分支

| Late-Life Branch | Cost Label |
|------------------|------------|
| rule_keeper | **门规守成之累** |
| alliance_bearer | **盟约续责之累** |
| fallback (late-life done, no branch marker) | 开派晚年之累 |

**Gate:** `flags.founding_patriarch_late_life_done` + late-life branch marker

#### Signal 2: Current Goal（按 late-life branch 分化）

**位置:** `orthodoxCurrentGoal()` → `founding_patriarch_late_life_done` 分支

| Late-Life Branch | Current Goal |
|------------------|--------------|
| rule_keeper | **守门规至终，治学师承不能断** |
| alliance_bearer | **守盟约至终，诸派续责不能推** |
| fallback | 治理次序之后，晚年自有晚年的过法 |

**Gate:** `flags.founding_patriarch_late_life_done` + late-life branch marker

#### Signal 3: Age-40 Identity（按 late-life branch × on-ramp variant 分化）

**位置:** `orthodoxAge40Identity()` → `founding_patriarch_late_life_identity_done` 分支

Late-life branch marker 优先于 payoff choice marker。每个 late-life branch 提供 base identity；on-ramp variant 可作为修饰（P117 实施时至少覆盖 scholar + alliance 各 1 条）。

| Late-Life Branch | Base Identity (reference) |
|------------------|----------------------------|
| rule_keeper | 门规守成的开宗祖师：先稳门规传承的选择，到了晚年以书斋治学为主。弟子争议、门规执行一件接一件，盟约事务退为背景 |
| alliance_bearer | 盟约续责的开宗祖师：先稳诸派盟约的选择，到了晚年以山门对外为主。续责诸派、盟会差遣一件接一件，门规收束为执行工具 |

**Gate:** `flags.founding_patriarch_late_life_identity_done` + late-life branch marker

### 4.2 Expression Priority (updated for P117)

1. `founding_patriarch_late_life_done` > `founding_patriarch_payoff_done` > `founding_patriarch_midlife_pressure_done` > on-ramp
2. Within late-life: late-life branch marker > pressure marker > payoff choice marker > on-ramp variant
3. Generic orthodox fallback

### 4.3 Deferred Expression Updates

| Surface | Defer Reason |
|---------|--------------|
| Full 2×3 pressure×payoff identity matrix | P117 minimum: 2 pressure branches only |
| Ordinary-origin founding-patriarch expression | Out of bounded scope |
| Life memory / summary | Endgame echo stage (P118+) |
| Sect inheritance handoff markers | Endgame stage (P118+) |

---

## 5. Continuity Constraints

### 5.1 Pressure → Late-Life

| Constraint | Rule |
|------------|------|
| Branch traceability | Late-life branch marker 必须匹配 pressure marker |
| Gate order | `payoff_done` 必须在 `late_life` 之前 |
| Pressure marker preserved | Late-life 不得清除或覆盖 pressure marker |
| Narrative continuity | Late-life 文本必须引用 pressure 治理次序选择 |

### 5.2 Late-Life → Endgame Handoff

| Constraint | Rule |
|------------|------|
| Checkpoint isolation | `founding_patriarch_late_life_done` 独立于 `founding_patriarch_endgame_echo_done` |
| Branch marker preserved | Endgame 应读取 late-life branch marker（P118 contract only） |
| No endgame preemption | Late-life 不得设置 endgame checkpoint |
| Expression handoff | Late-life 表达在 endgame 之前；endgame 表达优先级更高（P118 定义） |

### 5.3 Late-Life vs Pressure vs Payoff

| Aspect | Pressure (门派延续之责) | Payoff (名号定型) | Late-Life (治理次序晚年) |
|--------|------------------------|--------------------|-----------------------|
| **阶段定位** | 治理次序期 | 名号定型期 | 后果期、晚年展开 |
| **核心情绪** | 次序、先稳哪边 | 决断、我是谁 | 沉淀、这个次序带来了什么 |
| **事件模式** | Choice（2 选项） | Choice（3 选项） | Auto（2 条件分支） |
| **Checkpoint** | `midlife_pressure_done` + pressure marker | `payoff_done` + payoff marker | `late_life_done` + `late_life_identity_done` |
| **Age band** | 40–45 | 48–52 | 52–56 |
| **Branch key** | Pressure markers | Payoff markers | **Pressure markers** |
| **Cost label** | 门派延续之重 | 续责/自立/双门 | 守成之累/续责之累 |

---

## 6. Route Distinction Contract

| Route | Late-life burden type | Difference from founding_patriarch |
| ----- | -------------------- | ---------------------------------- |
| Renown | 人情债的晚年后果 | founding 是门派治理次序后果，不是人情债 |
| Patron | 商武定型的晚年后果 | founding 是门规/盟约治理负担，不是商武一体 |
| Magnate | 守成传承的晚年选择 | founding 是 auto 后果展开，不是 entry track 选择 |

---

## 7. Flag Interfaces

### 7.1 Checkpoint Flags

| Flag | Purpose | Set By |
|------|---------|--------|
| `founding_patriarch_late_life_done` | Late-life 检查点 | Any late-life branch |
| `founding_patriarch_late_life_identity_done` | Late-life 身份深化 | Any late-life branch |

### 7.2 Branch-Specific Markers (二选一)

| Marker | Branch |
|--------|--------|
| `founding_patriarch_late_rule_keeper` | 门规守成终老 (A) |
| `founding_patriarch_late_alliance_bearer` | 盟约续责终老 (B) |

### 7.3 Endgame Echo Reserved (P118+)

| Flag | Purpose | Stage |
|------|---------|-------|
| `founding_patriarch_endgame_echo_done` | Endgame echo 检查点 | P118+ |

Endgame echo 应读取 late-life branch marker 以延续叙事（contract only；P118 设计）。

---

## 8. Gate Acceptance (Late-Life Checkpoint)

| Checkpoint | Required Flags | Acceptance |
|------------|----------------|------------|
| Late-life closed | `founding_patriarch_late_life_done` | Set by any late-life branch |
| Branch traceability | `founding_patriarch_late_*` (one of 2) | Matches pressure marker |
| Identity set | `founding_patriarch_late_life_identity_done` | Set alongside late_life_done |
| Upstream satisfied | `founding_patriarch_payoff_done` + one `founding_patriarch_pressure_*` | Must be true before late-life fires |
| Endgame ready | `founding_patriarch_endgame_echo_done` = false | Not yet consumed |

---

## 9. Implementation Notes (For P117)

### 9.1 Event Wiring Path

1. Add `founding_patriarch_late_life` auto event to `sample-lines-spine.json`
2. Insert after `founding_patriarch_payoff_echo` in spine ordering
3. Configure 2 conditional branches keyed on pressure markers
4. Set checkpoint + branch markers per branch
5. Bump metadata tags: `p116`, `p117`, `auto`, `late-life`

### 9.2 Expression Placement

**文件:** `src/p50/sampleLineExpression.ts`

**函数:** `orthodoxCurrentGoal()`, `deriveSampleLineCostLabel()`, `orthodoxAge40Identity()`

**模式:** 在 `founding_patriarch_late_life_done` / `founding_patriarch_late_life_identity_done` 分支内，先检查 late-life branch marker，再 fallback pressure / payoff / on-ramp variant.

### 9.3 Stat Threshold Gates (Optional Enhancement)

P117 可 defer stat 阈值检查；契约仅定义宽松 gate（payoff_done + age range + pressure marker present).

---

**P116-004 complete.**
