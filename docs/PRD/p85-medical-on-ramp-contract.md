# P85 Medical On-Ramp Contract

> **Route:** medical_sage_healer（一代名医）
> **Origin:** tavern_hand（酒肆帮工）
> **Stage:** On-ramp spine — 过桥后的第一个标志性叙事节点
> **Variants:** compassionate（仁心医者）+ pragmatic（世故人医）
> **Preceding:** P83 bridge (tavern_medical_bridge_crossed) + P84 entry differentiation
> **Subsequent:** pressure (P86+) / payoff (P87+) — deferred

## 1. Core Narrative

### 1.1 Event Identity

**事件名称：** 医名初起（或"小药庐装不下了"）

**核心叙事定位：**
这是 medical_sage_healer 路线的第一个真正内容事件，它回答了："过桥之后呢？"

- **Before on-ramp:** "我靠自学的医术在镇上立足，酒肆后面辟出了小药庐"
- **After on-ramp:** "我第一次真正感受到——我在医道上有了立足之地。小药庐装不下了，我的名字也传开了。"

**Tavern-born 风味锚点：**
- 事件与酒肆熟客、人脉、小药庐相关，不是宫廷御医或江湖神医
- 起点是"酒肆后面的小药庐"，不是医馆、不是太医院
- 声名靠熟客口口相传，不是官方册封或武林大会

### 1.2 What Makes It Iconic

这是医疗路线的第一个标志性节点，玩家能明确感受到：
1. 我选择的医道路线有了第一个里程碑
2. 我的 variant（仁心/世故）在这个里程碑上有不同的表现
3. 我从"酒肆里的小大夫"变成了"镇上有名的大夫"

## 2. Trigger Conditions

### 2.1 Prerequisites

| Condition | Value | Source |
|-----------|-------|--------|
| Origin | `origin_tavern_hand` | childhood origin |
| Bridge crossed | `tavern_medical_bridge_crossed` | P83 bridge |
| Route committed | `route_medical_committed` | P83 bridge |
| Variant marker | `tavern_embrace_compassionate_healer` OR `tavern_embrace_pragmatic_healer` | P83 bridge |
| Medical talent | `medical_talent` OR `medical_pure` | P27 / P83 bridge |

### 2.2 Age Range

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `ageMin` | 31 | bridge 在 28 岁，给 3 年缓冲期，让玩家感受"刚过桥"的状态 |
| `ageMax` | 34 | 确保在 midlife 前期触发，为后续 pressure/payoff 留空间 |
| Trigger | `age_reach: 31` | 与 renown on-ramp (32-35) 节奏接近，略早一点（医疗路线成名略快） |

### 2.3 Exclusivity Guards

| Guard | Purpose |
|-------|---------|
| `!medical_on_ramp_done` | 只触发一次 |
| `!ordinary_tavern_midlife_done` | 与其他 tavern midlife 事件互斥（已由 bridge 事件保证） |
| `!tavern_renown_bridge_crossed` | 与 renown 路线互斥（已由 detectSampleLine 优先级保证） |
| `!tavern_merchant_bridge_crossed` | 与 merchant 路线互斥（已由 ordinary_tavern_midlife_done 保证） |

## 3. Event Specification

### 3.1 Basic Info

| Field | Value |
|-------|-------|
| `id` | `medical_on_ramp` |
| `version` | `1.0.0` |
| `category` | `main_story` |
| `priority` | `0` |
| `weight` | `100` |
| `eventType` | `auto`（与 renown on-ramp / merchant on-ramp 模式对齐；强制性里程碑事件） |
| Location | `sample-lines-spine.json`（与 magnate_on_ramp / renown_on_ramp 同模式） |

### 3.2 Two-Variant Branching

**结构：** 同一个 auto event ID，根据 variant marker 走不同的 narrative / stats 分支。

```
medical_on_ramp (auto event)
  ├── Compassionate branch (tavern_embrace_compassionate_healer)
  │   ├── Narrative: 义诊浪潮 / 穷人求医 / 仁心之累
  │   ├── Stats: reputation +6, chivalry +5, constitution -2
  │   └── Flags: medical_on_ramp_done, tavern_medical_on_ramp_compassionate
  │
  └── Pragmatic branch (tavern_embrace_pragmatic_healer)
      ├── Narrative: 大户求医 / 丰厚报酬 / 人情与名声
      ├── Stats: reputation +4, money +80, connections +4, charisma +3
      └── Flags: medical_on_ramp_done, tavern_medical_on_ramp_pragmatic
```

### 3.3 Compassionate Variant Detail

**Narrative (仁心医者 on-ramp)：**

> 这些日子，来找你看病的人越来越多——不光是镇上的熟客，连周边村子的穷人也慕名而来。有人背着铺盖卷在酒肆门口等天亮，有人跪在小药庐前磕头求你救救家里的孩子。你见不得人受苦，有钱没钱都给看。
>
> 小药庐挤不下了，酒肆的大堂都摆上了病床。老掌柜叹口气，没说什么——他知道你这脾气。
>
> 名声传开了。镇上人都说，酒肆那位小大夫，是真的仁心。可只有你自己知道，这样下去，身子撑不了多久。

**Stats:**
- `reputation` +6（仁心之名传开）
- `chivalry` +5（侠义之心）
- `constitution` -2（累坏了身子）

**Flags:**
- `medical_on_ramp_done` = true（共享检查点）
- `tavern_medical_on_ramp_compassionate` = true（variant marker）

### 3.4 Pragmatic Variant Detail

**Narrative (世故人医 on-ramp)：**

> 这天，一位镇上大户人家的管家亲自来到酒肆，说他家老爷得了怪病，请了多少大夫都看不好。听闻你医术高明，特来请你过府一瞧——诊金丰厚，另有谢礼。
>
> 你去了。望闻问切，拿捏分寸，几副药下去，病情真的见好。老爷大喜，不仅厚赏了你，还在酒席上把你引荐给了镇上其他有头有脸的人物。
>
> 名声传开了。镇上人都说，酒肆出来的那位大夫，懂分寸、会办事，不光医术好，人情世故也拎得清。找你看病的人越来越多，但你知道——该收的收，该推的推，这才是长久之道。

**Stats:**
- `reputation` +4（名声渐起）
- `money` +80（丰厚诊金）
- `connections` +4（认识了不少大户人家）
- `charisma` +3（人情练达）

**Flags:**
- `medical_on_ramp_done` = true（共享检查点）
- `tavern_medical_on_ramp_pragmatic` = true（variant marker）

### 3.5 Checkpoint Flags Summary

| Flag | Set By | Purpose |
|------|--------|---------|
| `medical_on_ramp_done` | Auto event (both variants) | **On-ramp 检查点** — 后续 pressure/payoff 的前置条件 |
| `tavern_medical_on_ramp_compassionate` | Compassionate branch | Variant A marker（origin-scoped） |
| `tavern_medical_on_ramp_pragmatic` | Pragmatic branch | Variant B marker（origin-scoped） |

## 4. Expression Updates

### 4.1 Current Goal (Sample Line)

`medicalCurrentGoal()` 新增 on-ramp 分支：

| State | Text |
|-------|------|
| **Before on-ramp (compassionate)** | "多救一个是一个，酒肆的小药庐挤不下了" |
| **After on-ramp (compassionate)** | "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧" |
| **Before on-ramp (pragmatic)** | "名声银子都要挣，酒肆出来的大夫懂分寸" |
| **After on-ramp (pragmatic)** | "镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏" |

### 4.2 Current Goal (Ordinary Origin)

`tavernCurrentGoal()` 新增 on-ramp 分支：

| State | Text |
|-------|------|
| **Before on-ramp (compassionate)** | "酒肆后面辟出小药庐，有钱没钱都给看" |
| **After on-ramp (compassionate)** | "周边村子的人都慕名而来，小药庐挤不下，大堂都摆上了病床" |
| **Before on-ramp (pragmatic)** | "酒肆后面辟出小药庐，看病也讲人情世故" |
| **After on-ramp (pragmatic)** | "镇上大户都来请你，诊金丰厚，还认识了不少有头有脸的人物" |

### 4.3 Life Memory (Ordinary Origin)

`tavernLifeMemory()` 新增 on-ramp 分支：

**Compassionate:**
> 你在酒肆后面的小药庐行医，有钱没钱都给看。名声传开了，周边村子的人都慕名而来，小药庐挤不下，连酒肆大堂都摆上了病床。老掌柜叹口气，没说什么——他知道你这脾气。镇上人都说，你是真的仁心。可只有你自己知道，这样下去，身子撑不了多久。

**Pragmatic:**
> 你在酒肆后面的小药庐行医，看病收钱，也看人下菜碟。镇上大户人家的老爷被你治好后，厚赏了你，还把你引荐给了其他有头有脸的人物。名声传开了，找你看病的人越来越多。你懂分寸、会办事——该收的收，该推的推，这才是长久之道。

### 4.4 Summary (Ordinary Origin)

`deriveOrdinaryOriginSummary()` 新增 on-ramp 分支：

| State | Text |
|-------|------|
| **Before on-ramp (compassionate)** | "酒肆出身的仁心医者：靠自学在镇上行医，有钱没钱都给看，小药庐里挤满了求医的人。" |
| **After on-ramp (compassionate)** | "酒肆出身的仁心名医：靠仁心济世在一方有了名气，小药庐装不下了，连酒肆大堂都摆上了病床。救人要紧，身子也在熬。" |
| **Before on-ramp (pragmatic)** | "酒肆出身的世故人医：靠眼力在镇上行医，看病也讲分寸，名声银子都挣到了手。" |
| **After on-ramp (pragmatic)** | "酒肆出身的世故名医：懂人情知分寸，镇上大户都来请你，名声银子双丰收。酒肆出来的大夫，最懂这世道。" |

### 4.5 Cost Label (Sample Line)

`deriveSampleLineCostLabel()` on-ramp 后是否增强？

- **P85 范围：** 保持 entry 层不变（仁心之累 / 世故之秤）
- **Rationale:** 这两个 label 本身已经很好地表达了 on-ramp 后的代价感；pressure 阶段再深化
- **Defer to pressure stage：** 如"仁心耗尽" / "世故缠身"等更深入的代价表达

### 4.6 Age-40 Identity (Sample Line)

`medicalAge40Identity()` — P85 不新增（payoff 阶段再做）。

**Defer to payoff stage (P87+):** 40 岁身份收束 + full payoff 表达。

## 5. Subsequent Stage Interfaces

### 5.1 Flag Interfaces for Future Stages

P85 预留以下 flag 接口，供后续阶段使用：

| Flag | Purpose | Stage |
|------|---------|-------|
| `medical_midlife_pressure_done` | Midlife pressure 检查点 | P86+ |
| `medical_payoff_done` | Payoff 检查点 | P87+ |
| `medical_age40_identity_done` | Age-40 identity 检查点 | P87+ |

### 5.2 Narrative Hooks for Pressure

On-ramp 事件应埋下 pressure 阶段的种子：

**Compassionate hook:**
- "身子撑不了多久" → pressure 阶段身体垮掉 / 精力耗尽
- "小药庐挤不下" → pressure 阶段更多病人 / 更大的责任
- "仁心之累" → pressure 阶段具体化：救不过来的无力感

**Pragmatic hook:**
- "该收的收，该推的推" → pressure 阶段人情债 / 站队问题
- "认识了不少有头有脸的人物" → pressure 阶段权贵之间的拉扯
- "世故之秤" → pressure 阶段具体化：道义与利益的天平

这些种子在 on-ramp 文本中暗示，但不展开。

## 6. Implementation Notes

### 6.1 Event Placement

放在 `sample-lines-spine.json` — 与 `magnate_on_ramp` / `renown_on_ramp` 同模式，属于 sample line spine 事件。

**理由：**
- 与 merchant / renown on-ramp 模式一致
- 属于 medical sample line 的 spine 事件，不是 ordinary origin growth 事件
- 便于后续 pressure / payoff 事件继续放在同一文件

### 6.2 Variant Branching Implementation

**问题：** sample-lines-spine.json 中的 auto event 如何实现 variant 分支？

**方案：** 2 个独立的 auto event（各走各的条件），共享 checkpoint flag。

```
Event 1: medical_on_ramp_compassionate
  Conditions: tavern_medical_bridge_crossed && tavern_embrace_compassionate_healer && !medical_on_ramp_done
  Effects: medical_on_ramp_done + tavern_medical_on_ramp_compassionate + compassionate stats

Event 2: medical_on_ramp_pragmatic
  Conditions: tavern_medical_bridge_crossed && tavern_embrace_pragmatic_healer && !medical_on_ramp_done
  Effects: medical_on_ramp_done + tavern_medical_on_ramp_pragmatic + pragmatic stats
```

**理由：**
- 与现有事件系统的条件驱动模式一致
- 两个事件互斥（由 `!medical_on_ramp_done` + variant marker 保证）
- 实现简单，不需要新的分支机制

### 6.3 Compatibility with P83/P84

- P83 bridge 事件设置的 flag 完全兼容
- P84 entry expression 作为 on-ramp 前的状态，完全兼容
- `detectSampleLine()` 优先级不变（medical 仍优先于 renown）
- 普通 tavern 路径不受影响
- P83 / P84 测试必须全部通过

## 7. Validation Shape

P85 需要验证的关键点：

1. **触发条件：** bridge 后 + age 31-34 → 事件触发
2. **Variant 分支：** compassionate / pragmatic 各自触发正确的分支
3. **Flag 设置：** `medical_on_ramp_done` + variant marker 正确设置
4. **表达更新：** on-ramp 前后 currentGoal / summary / lifeMemory 有差异
5. **Variant 差异化：** 2 variants 在表达上有可感知差异
6. **风味正确：** tavern-born + medical healer 风味贯穿
7. **无退化：** P83/P84 既有 evidence 不退化
8. **差异化：** 与 renown on-ramp / merchant on-ramp / plain tavern 有区分

---
**Contract owner:** P85 on-ramp spine stage  
**Contract status:** Defined (for implementation in P85-004/005)
