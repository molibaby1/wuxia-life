# P86 Medical Pressure Contract

> **Route:** `medical_sage_healer`（一代名医）
> **Origin:** `tavern_hand`（酒肆帮工）
> **Stage:** Pressure — 仁心耗尽 / 人情债缠身
> **Selected direction (Compassionate):** 仁心耗尽 / 身体垮掉 (Burnout)
> **Selected direction (Pragmatic):** 人情债缠身 (Favor Debt Entanglement)
> **Preceding:** P85 on-ramp (医名初起)
> **Subsequent:** Payoff (P88+) — deferred

---

## 1. Core Narrative (Dual Variant)

### 1.1 Compassionate Variant: 仁心耗尽 (Burnout)

**事件名称：** 仁心耗尽（或"药庐里的倒下"）

**核心叙事：**
这些日子，来找你看病的人越来越多——周边村子的、外乡来的、背着铺盖卷在酒肆门口等天亮的。你见不得人受苦，有钱没钱都给看。小药庐挤不下了，酒肆大堂都摆上了病床。老掌柜劝你歇歇，你说"救人要紧"。

终于有一天，你正给人诊脉，眼前一黑，栽倒在药庐里。醒来时，老掌柜坐在旁边叹气，碗里熬着药。门外还有等着看病的人，你想起身，却发现连抬手的力气都没有了。

窗外的阳光照进来，你忽然想起小时候在酒肆里看老掌柜给穷苦人免账——那时候你只觉得他心善，如今才知道，仁心这东西，是真的能把人耗干的。

**Tavern-born 风味锚点：**
- 事件发生在酒肆小药庐（核心场景）
- 压力来源是"仁心"和"救人"，不是武功、不是金钱
- "酒肆出身"视角的反差：从小见惯了生老病死，没想到自己栽在"太好心"上
- 老掌柜的角色（叹气、熬药、劝你休息）
- 与 merchant pressure 的"金钱债"、renown pressure 的"人情债"形成鲜明对比——这是"身体债"

### 1.2 Pragmatic Variant: 人情债缠身 (Favor Debt Entanglement)

**事件名称：** 人情债缠身（或"酒肆门槛踩平"）

**核心叙事：**
这些年，你靠医术和分寸在镇上站稳了脚跟。镇上大户都来请你看病，诊金丰厚，还认识了不少有头有脸的人物。你懂分寸、会办事——该收的收，该推的推，这才是长久之道。

可人情是把双刃剑。今天张员外请你去给他的小妾看病（不能不去，人家引荐过你），明天李知府让你给他的幕僚出诊（还不能收钱，欠着人情呢），后天王捕头的亲戚找上门来（不收钱就是不给面子）。

这日，酒肆里来了一拨又一拨的人——有来道谢的，有来求人的，有带着名帖请你过府的。你站在柜台后，看着一拨又一拨的人，忽然想起小时候在这儿见惯的人情往来——那时候你只觉得热闹，如今才知道，这人情网，是真的能把人缠住的。

**Tavern-born 风味锚点：**
- 事件发生在酒肆（核心场景）
- 压力来源是"权贵人情"和"分寸感"，不是武功
- "酒肆出身"视角的反差：从小见惯人情世故，以为自己能拿捏，没想到还是陷进去
- 与 renown pressure 的"江湖人情债"有区别——renown 是江湖人士的人情，medical pragmatic 是权贵阶层的人情
- 与 merchant pressure 的"经营压力"有区别——merchant 是钱的问题，pragmatic 是人的问题

### 1.3 What Makes Pressure Iconic (Per Variant)

这是 medical 路线的 pressure 节点，它回答了："医名初起之后呢？"

| Variant | Before Pressure (On-Ramp) | After Pressure |
|---------|---------------------------|----------------|
| **Compassionate** | "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧" | "身子撑不住了，但求医的人还在门口排队——仁心，也是有代价的" |
| **Pragmatic** | "镇上大户都来请你，名声银子双丰收，该拿捏的得拿捏" | "一面应付各路权贵的人情，一面在人情网中找平衡——世故，也是有重量的" |

Pressure 让 medical 路线从"一帆风顺的上升"变成"有代价的成长"，增加了叙事深度。两个 variant 的代价类型完全不同，强化了 variant 分化。

---

## 2. Trigger Conditions

### 2.1 Shared Prerequisites

| Condition | Value | Source |
|-----------|-------|--------|
| Origin | `origin_tavern_hand` | childhood origin |
| Bridge crossed | `tavern_medical_bridge_crossed` | P83 bridge |
| Route committed | `route_medical_committed` | P83 bridge |
| On-ramp done | `medical_on_ramp_done` | P85 on-ramp |

### 2.2 Variant-Specific Prerequisites

| Variant | Prerequisite | Source |
|---------|-------------|--------|
| **Compassionate** | `tavern_medical_on_ramp_compassionate` | P85 on-ramp |
| **Pragmatic** | `tavern_medical_on_ramp_pragmatic` | P85 on-ramp |

### 2.3 Age Range

| Variant | ageMin | ageMax | Rationale |
|---------|--------|--------|-----------|
| **Compassionate** | 36 | 40 | On-ramp (31-34) 后 2-6 年，给玩家享受"医名初起"的时间；身体垮掉来得略早（仁心消耗得快） |
| **Pragmatic** | 37 | 41 | On-ramp (31-34) 后 3-7 年，给玩家享受"名声银子双丰收"的时间；人情债积累得略慢 |

Trigger 方式：`age_reach`（与 on-ramp 模式一致）

### 2.4 Threshold Gates (宽松优先)

最小门槛（确保玩家有一定基础后才触发）：

| Variant | Stat | Min Value | Rationale |
|---------|------|-----------|-----------|
| **Compassionate** | `reputation` | ≥ 10 | On-ramp 后名声有积累 |
| **Compassionate** | `chivalry` | ≥ 8 | 有侠义之心才会把自己累垮 |
| **Pragmatic** | `reputation` | ≥ 10 | On-ramp 后名声有积累 |
| **Pragmatic** | `connections` | ≥ 8 | 人脉广了才有人情债 |

**实现策略：** P87 实施时确认系统是否支持 stat 阈值检查。若不支持或太复杂，先用宽松条件（仅 on-ramp + age range + variant marker），stat 阈值作为增强项 defer。

### 2.5 Exclusivity Guards

| Guard | Purpose |
|-------|---------|
| `!medical_midlife_pressure_done` | 只触发一次 |
| `!tavern_renown_bridge_crossed` | 与 renown 路线互斥（已由 detectSampleLine 优先级保证） |
| `!tavern_merchant_bridge_crossed` | 与 merchant 路线互斥（已由 ordinary_tavern_midlife_done 保证） |

---

## 3. Event Specification

### 3.1 Basic Info (Dual Event Pattern)

遵循 P85 on-ramp 的 2-event 模式：两个独立的 auto event，各走各的条件，共享 checkpoint flag。

| Field | Compassionate Variant | Pragmatic Variant |
|-------|----------------------|-------------------|
| `id` | `medical_pressure_compassionate` | `medical_pressure_pragmatic` |
| `version` | `1.0.0` | `1.0.0` |
| `category` | `main_story` | `main_story` |
| `priority` | `0` | `0` |
| `weight` | `100` | `100` |
| `eventType` | `auto`（强制性里程碑事件） | `auto`（强制性里程碑事件） |
| `location` | `sample-lines-spine.json` | `sample-lines-spine.json` |

### 3.2 Why Auto (Not Choice)

- 与 renown pressure / merchant pressure 模式对齐
- 压力是路线的必然代价——选了 compassionate 就必然要面对身体垮掉，选了 pragmatic 就必然要面对人情债
- Choice 的空间（如何应对压力）留给 payoff 阶段
- 保持 simple，符合 small-step 原则

### 3.3 Compassionate Variant Effects

**效果：**
- 设置 `medical_midlife_pressure_done`（pressure 检查点，共享）
- 设置 `tavern_medical_pressure_compassionate`（variant marker，origin-scoped）
- Stat 变化：
  - `constitution` -3（身体垮掉了，再扣 3 点）
  - `reputation` +3（名声还在涨，但代价也来了）
  - `chivalry` +2（侠义之名更盛）
- 压力感体现：constitution 明显下降，配合表达层传递"仁心耗尽"的感觉

**叙事文本（参考方向，P87 实施时润色）：**
> 这些日子，来找你看病的人越来越多。周边村子的、外乡来的、背着铺盖卷在酒肆门口等天亮的。你见不得人受苦，有钱没钱都给看。小药庐挤不下了，酒肆大堂都摆上了病床。老掌柜劝你歇歇，你说"救人要紧"。
>
> 终于有一天，你正给人诊脉，眼前一黑，栽倒在药庐里。
>
> 醒来时，老掌柜坐在旁边叹气，碗里熬着药。门外还有等着看病的人，你想起身，却发现连抬手的力气都没有了。
>
> 窗外的阳光照进来，你忽然想起小时候在酒肆里看老掌柜给穷苦人免账——那时候你只觉得他心善，如今才知道，仁心这东西，是真的能把人耗干的。

### 3.4 Pragmatic Variant Effects

**效果：**
- 设置 `medical_midlife_pressure_done`（pressure 检查点，共享）
- 设置 `tavern_medical_pressure_pragmatic`（variant marker，origin-scoped）
- Stat 变化：
  - `reputation` +4（名声继续涨）
  - `connections` +3（人脉继续扩展）
  - `charisma` +2（人情更练达）
  - `money` +50（权贵给的好处）
- 压力感体现：stats 都在涨，但通过表达层传递"人情网缠住了"的感觉——不是数值上的惩罚，而是心理上的重量

**叙事文本（参考方向，P87 实施时润色）：**
> 这些年，你靠医术和分寸在镇上站稳了脚跟。镇上大户都来请你看病，诊金丰厚，还认识了不少有头有脸的人物。你懂分寸、会办事——该收的收，该推的推，这才是长久之道。
>
> 可人情是把双刃剑。今天张员外请你去给他的小妾看病，明天李知府让你给他的幕僚出诊，后天王捕头的亲戚找上门来。
>
> 这日，酒肆里来了一拨又一拨的人——有来道谢的，有来求人的，有带着名帖请你过府的。你站在柜台后，看着一拨又一拨的人，忽然想起小时候在这儿见惯的人情往来——那时候你只觉得热闹，如今才知道，这人情网，是真的能把人缠住的。

### 3.5 Checkpoint Flags Summary

| Flag | Set By | Purpose |
|------|--------|---------|
| `medical_midlife_pressure_done` | Both variants (shared) | **Pressure 检查点** — payoff 阶段的前置条件 |
| `tavern_medical_pressure_compassionate` | Compassionate event | Variant A marker（origin-scoped） |
| `tavern_medical_pressure_pragmatic` | Pragmatic event | Variant B marker（origin-scoped） |

---

## 4. Player-Facing Expression Updates

### 4.1 Pressure-Specific Signals (Per Variant, 至少 2 个)

#### Compassionate Variant Signals

**Signal 1: Cost Label 深化 (Sample Line)**
- **位置：** `src/p50/sampleLineExpression.ts` → `deriveSampleLineCostLabel()`
- **变化：**
  - Before pressure: "仁心之累"
  - After pressure: "仁心耗尽"
- **为什么：** 从抽象的"累"变成具体的"耗尽"；更有画面感；呼应"油尽灯枯"的 tavern-born 表达

**Signal 2: Current Goal 更新 (Sample Line + Ordinary Origin)**
- **Sample Line 位置：** `src/p50/sampleLineExpression.ts` → `medicalCurrentGoal()`
- **Ordinary Origin 位置：** `src/p56/ordinaryOriginExpression.ts` → `tavernCurrentGoal()`
- **变化：**
  - Before pressure: "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧"
  - After pressure: "身子撑不住了，但求医的人还在门口排队——能救一个是一个吧"

#### Pragmatic Variant Signals

**Signal 1: Cost Label 深化 (Sample Line)**
- **位置：** `src/p50/sampleLineExpression.ts` → `deriveSampleLineCostLabel()`
- **变化：**
  - Before pressure: "世故之秤"
  - After pressure: "人情债缠身"
- **为什么：** 从抽象的"秤"变成具体的"债"；更有画面感，更 tavern-born（酒肆里最讲究人情债）

**Signal 2: Current Goal 更新 (Sample Line + Ordinary Origin)**
- **Sample Line 位置：** `src/p50/sampleLineExpression.ts` → `medicalCurrentGoal()`
- **Ordinary Origin 位置：** `src/p56/ordinaryOriginExpression.ts` → `tavernCurrentGoal()`
- **变化：**
  - Before pressure: "镇上大户都来请你，名声银子双丰收，该拿捏的得拿捏"
  - After pressure: "一面应付各路权贵的人情，一面在人情网中找平衡"

### 4.2 Bonus Expression Updates (P1)

#### Life Memory 更新 (Ordinary Origin)

**位置：** `src/p56/ordinaryOriginExpression.ts` → `tavernLifeMemory()`

**Compassionate 版本：**
> "你在酒肆后面的小药庐行医，有钱没钱都给看。名声传开了，周边村子的人都慕名而来，小药庐挤不下，连酒肆大堂都摆上了病床。终于有一天，你累倒在药庐里。醒来时老掌柜坐在旁边叹气，门外还有等着看病的人。仁心这东西，是真的能把人耗干的。"

**Pragmatic 版本：**
> "你在酒肆后面的小药庐行医，看病收钱，也看人下菜碟。镇上大户人家的老爷被你治好后，厚赏了你，还把你引荐给了其他有头有脸的人物。名声越大，欠下的人情也越多——张员外的小妾、李知府的幕僚、王捕头的亲戚... 酒肆的门槛都被踩平了。这人情网，快把你缠住了。"

#### Summary 更新 (Ordinary Origin)

**位置：** `src/p56/ordinaryOriginExpression.ts` → `deriveOrdinaryOriginSummary()`

**Compassionate 版本：**
- Before: "酒肆出身的仁心名医：靠仁心济世在一方有了名气，小药庐装不下了，连酒肆大堂都摆上了病床。救人要紧，身子也在熬。"
- After: "酒肆出身的仁心名医：靠仁心济世闯出了名号，只是身子也熬垮了——仁心耗尽，油尽灯枯。"

**Pragmatic 版本：**
- Before: "酒肆出身的世故名医：懂人情知分寸，镇上大户都来请你，名声银子双丰收。酒肆出来的大夫，最懂这世道。"
- After: "酒肆出身的世故名医：靠医术和分寸在权贵间游走，名声银子都有了，只是人情债也越积越重——这世道，从来不是白混的。"

### 4.3 Expression Update Summary

| Surface | Function | Compassionate Update | Pragmatic Update | Priority |
|---------|----------|---------------------|-----------------|----------|
| Sample line currentGoal | `medicalCurrentGoal()` | ✅ Yes | ✅ Yes | P0 |
| Sample line cost label | `deriveSampleLineCostLabel()` | ✅ Yes (仁心耗尽) | ✅ Yes (人情债缠身) | P0 |
| Ordinary origin currentGoal | `tavernCurrentGoal()` | ✅ Yes | ✅ Yes | P0 |
| Ordinary origin lifeMemory | `tavernLifeMemory()` | ✅ Yes | ✅ Yes | P1 |
| Ordinary origin summary | `deriveOrdinaryOriginSummary()` | ✅ Yes | ✅ Yes | P1 |
| Sample line age40 identity | `medicalAge40Identity()` | ❌ Defer to payoff | ❌ Defer to payoff | — |

**至少 2 个 pressure-specific signals per variant：✅ 满足（cost label + currentGoal 就是 2 个核心 signal）**

---

## 5. Differences: Pressure vs On-Ramp vs Generic Midlife

### 5.1 Pressure vs On-Ramp (Per Variant)

**Compassionate:**

| Aspect | On-Ramp (医名初起) | Pressure (仁心耗尽) |
|--------|---------------------|----------------------|
| **阶段定位** | 上升期、第一个里程碑 | 维持期、代价显现 |
| **核心情绪** | 自豪、成就感、"我做到了" | 疲惫、悲壮、"这就是仁心的代价吗" |
| **目标方向** | 向外扩张（救更多的人） | 向内收缩（撑着别倒下） |
| **表达基调** | 积极向上中带点疲惫 | 悲壮、令人心疼 |
| **Stat 变化** | rep+6, chivalry+5, con-2 | rep+3, chivalry+2, con-3（代价更重） |

**Pragmatic:**

| Aspect | On-Ramp (医名初起) | Pressure (人情债缠身) |
|--------|---------------------|----------------------|
| **阶段定位** | 上升期、第一个里程碑 | 维持期、代价显现 |
| **核心情绪** | 得意、成就感、"我混出来了" | 纠结、沉重、"这就是世故的代价吗" |
| **目标方向** | 向外扩张（认识更多权贵） | 向内维持（在人情网中找平衡） |
| **表达基调** | 精明、练达 | 复杂、有重量 |
| **Stat 变化** | rep+4, money+80, connections+4, charisma+3 | rep+4, connections+3, charisma+2, money+50（增长放缓，压力感靠表达） |

### 5.2 Medical Pressure vs Generic Midlife

| Aspect | Medical Pressure | Generic Midlife |
|--------|-----------------|-----------------|
| **压力来源** | 仁心耗尽 / 人情债（路线专属） | 中年危机、生计压力等通用内容 |
| **场景** | 酒肆小药庐（核心场景） | 各种通用场景 |
| **机制** | 医术/仁心/人情 | 通用 stat 变化 |
| **独特性** | medical 路线独有（2 variants 各不同） | 所有出身都可能遇到 |
| **与路线关联** | 直接是 medical 路线的一部分 | 与路线无关的通用事件 |

### 5.3 Medical Pressure vs Renown/ Merchant Pressure

| Aspect | Medical Compassionate | Medical Pragmatic | Renown Pressure | Merchant Pressure |
|--------|----------------------|-------------------|-----------------|-------------------|
| **核心压力** | 仁心债/身体债 | 权贵人情债 | 江湖人情债 | 金钱债 |
| **压力来源** | 自己的仁心 | 权贵阶层 | 江湖人士 | 生意经营 |
| **场景** | 药庐/酒肆大堂 | 酒肆/权贵府邸 | 酒肆/江湖 | 商铺/商路 |
| **风味** | 仁心医者、悲壮 | 世故人医、纠结 | 江湖名宿、人情世故 | 商人巨贾、经营负担 |
| **共通模式** | auto 里程碑 + stat 变化 + 表达更新 | auto 里程碑 + stat 变化 + 表达更新 | auto 里程碑 + stat 变化 + 表达更新 | auto 里程碑 + stat 变化 + 表达更新 |

**结论：** 模式对称（都是 auto 里程碑 + 表达更新），但风味完全不同。两个 medical variant 也完全不同（向内消耗 vs 向外束缚）。

---

## 6. Payoff Stage Interfaces (Reserved Only)

### 6.1 Flag Interfaces (Reserved)

Pressure 阶段为后续 payoff 阶段预留以下 flag 接口，**本阶段不实现**：

| Flag | Purpose | Stage |
|------|---------|-------|
| `medical_payoff_done` | Payoff 检查点（共享） | P88+ |
| `medical_age40_identity_done` | Age-40 identity 检查点 | P88+ |
| `tavern_medical_payoff_compassionate` | Compassionate payoff variant marker | P88+ |
| `tavern_medical_payoff_pragmatic` | Pragmatic payoff variant marker | P88+ |

### 6.2 Narrative Hooks for Payoff

Pressure 事件应为 payoff 阶段埋下种子：

**Compassionate hooks:**
- "身子还能撑多久？" — payoff 可以选择硬扛/放手/找传承
- "仁心到底值不值得？" — payoff 可以是价值观选择
- "有人能接手吗？" — payoff 可以引入徒弟/传承线

**Pragmatic hooks:**
- "人情债能不能还清？" — payoff 可以选择依附/撕破脸/平衡
- "名声和自由，哪个更重要？" — payoff 可以是价值观选择
- "能不能在人情网中游刃有余？" — payoff 可以是平衡/和解

这些种子在 pressure 文本中暗示，但不展开。payoff 具体设计留给后续阶段。

### 6.3 What Payoff Could Look Like (概念性，非 contract)

仅供参考，**不是 P86 contract 的一部分**：

**Compassionate payoff 方向：**
- 硬扛到底（继续救人，油尽灯枯）
- 学会放手（减少接诊，颐养天年）
- 找到传承（收徒弟，把医术传下去）

**Pragmatic payoff 方向：**
- 彻底依附权贵（名声更高，但失去自由）
- 索性撕破脸（钱少了，但活得自在）
- 找到平衡点（在人情网中游刃有余，形成自己的处世之道）

---

## 7. Implementation Notes (For P87)

### 7.1 Event Placement

**推荐位置：** `src/data/lines/sample-lines-spine.json`

**理由：**
- 与 merchant `magnate_midlife_pressure` / renown `renown_midlife_pressure` 同模式
- 属于 sample line spine 事件，不是 ordinary origin growth 事件
- 与 `medical_on_ramp_compassionate` / `medical_on_ramp_pragmatic` 放在一起，路线事件集中

### 7.2 Stat Threshold Implementation

- 优先用 flag gate（`medical_on_ramp_done` + age range + variant marker），确保能触发
- Stat 阈值作为增强项，若现有事件系统支持则加上，否则 defer
- 与 on-ramp 实施策略一致：先宽松后收紧

### 7.3 Compatibility with P83/P84/P85

- P83 bridge 事件的 flag 完全兼容
- P84 entry expression 作为 pressure 前的状态，完全兼容
- P85 on-ramp 作为 pressure 的直接上游，完全兼容
- `detectSampleLine()` 优先级不变（medical 仍优先于 renown）
- 普通 tavern 路径不受影响
- P83 / P84 / P85 测试必须全部通过

---

## 8. Flavor Verification Checklist

Pressure 设计是否保持 tavern-born medical healer 风味？

### 8.1 Compassionate Variant

- [x] 核心机制是医术/仁心/救人，而非武功
- [x] 叙事与酒肆小药庐或酒肆出身强相关
- [x] 老掌柜角色出现（叹气、熬药、劝休息）
- [x] 与 merchant pressure（金钱/债务/经营）明确区分
- [x] 与 renown pressure（人情债/名声）明确区分
- [x] 与 generic 江湖压力（正邪/门派/恩怨）明确区分
- [x] "酒肆出身的" 视角贯穿始终
- [x] 与 on-ramp 风味连续（累 → 累垮）

### 8.2 Pragmatic Variant

- [x] 核心机制是医术/人情/分寸，而非武功
- [x] 叙事与酒肆或酒肆出身强相关
- [x] 与 merchant pressure（金钱/债务/经营）明确区分
- [x] 与 renown pressure（江湖人情债）有区分——medical 是权贵人情，renown 是江湖人情
- [x] 与 generic 江湖压力（正邪/门派/恩怨）明确区分
- [x] "酒肆出身的" 视角贯穿始终
- [x] 与 on-ramp 风味连续（认识大户 → 人情债）

### 8.3 Two-Variant Differentiation

- [x] Compassionate 是向内的压力（自我消耗）
- [x] Pragmatic 是向外的压力（社会束缚）
- [x] 两个 variant 的核心情绪不同（悲壮 vs 纠结）
- [x] 两个 variant 的 stat 变化模式不同（con↓ vs connections↑）
- [x] 两个 variant 的表达文本有本质区别
- [x] 不是简单换皮，而是真正的差异化设计

**风味验证：✅ 通过**

---

## 9. Contract Summary

| Item | Compassionate Variant | Pragmatic Variant |
|------|----------------------|-------------------|
| **Direction** | 仁心耗尽 / 身体垮掉 (Burnout) | 人情债缠身 (Favor Debt Entanglement) |
| **Event ID** | `medical_pressure_compassionate` | `medical_pressure_pragmatic` |
| **Event type** | Auto (mandatory milestone) | Auto (mandatory milestone) |
| **Age range** | 36–40 | 37–41 |
| **Upstream gate** | `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` | `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` |
| **Checkpoint flag** | `medical_midlife_pressure_done` (shared) | `medical_midlife_pressure_done` (shared) |
| **Variant marker** | `tavern_medical_pressure_compassionate` | `tavern_medical_pressure_pragmatic` |
| **Core signals** | Cost label ("仁心耗尽") + Current goal ("身子撑不住了，但求医的人还在排队") | Cost label ("人情债缠身") + Current goal ("应付各路权贵的人情，在人情网中找平衡") |
| **Expression surfaces** | 5 个（3 P0 + 2 P1） | 5 个（3 P0 + 2 P1） |
| **Key stats** | con-3, rep+3, chivalry+2 | rep+4, connections+3, charisma+2, money+50 |
| **New systems** | 零 — 全部复用现有架构 | 零 — 全部复用现有架构 |
| **Payoff interface** | `medical_payoff_done` + `tavern_medical_payoff_compassionate` (reserved) | `medical_payoff_done` + `tavern_medical_payoff_pragmatic` (reserved) |
| **Flavor** | Tavern-born compassionate healer — 仁心耗尽，油尽灯枯 | Tavern-born pragmatic healer — 权贵人情网，世故的重量 |

---

**Contract owner:** P86 pressure design-first stage
**Contract status:** Defined (for implementation in P87)
