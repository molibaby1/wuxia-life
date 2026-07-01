# P85 Medical On-Ramp Gap Audit

> **Stage:** P85 — medical_sage_healer on-ramp spine
> **Purpose:** 审计 medical 路线过桥后的现有内容，明确 on-ramp 之前已有的基础 vs 需要补的最小 spine，分析两个 variant 的 on-ramp 需求
> **Method:** 代码审计 + 配置审查，不做运行时改动

## 1. Existing Medical Infrastructure (Post-Entry)

### 1.1 Flags & Markers

| Flag | Source | Purpose |
|------|--------|---------|
| `medical_talent` | childhood / P27 / P29 | 医术天赋标记，bridge 前置条件之一 |
| `medical_pure` | P27 / P33 | 纯医道标记，满足 key_choices dim 2 |
| `tavern_medical_bridge_crossed` | P83 bridge | **bridge 跨越检查点** — medical 路线入口 |
| `route_medical_committed` | P83 bridge | 路线承诺标记 |
| `tavern_embrace_compassionate_healer` | P83 bridge | **Variant A** — 仁心医者选择标记 |
| `tavern_embrace_pragmatic_healer` | P83 bridge | **Variant B** — 世故人医选择标记 |
| `ordinary_tavern_midlife_done` | P56 midlife | 中年事件完成标记（互斥 guard） |
| `medical_apprentice` | medical.json | 拜师学医（传统路径，非 tavern 主链） |
| `medical_herb_master` | medical.json | 采药炼丹（传统路径） |
| `medical_divine_doctor_fame` | medical.json / P29 | 神医名声（传统路径 / P29 脉案） |
| `medical_plague_hero` | medical.json | 瘟疫救治英雄（传统路径） |
| `medical_imperial` | medical.json | 宫廷御医（传统路径） |
| `medical_folk_doctor` | medical.json | 民间游医（传统路径） |
| `medical_book_author` | medical.json | 医书传世（传统路径） |
| `medical_poison_path` | medical.json | 毒术路线（非 P85 范围） |

### 1.2 Events

#### Sample-Line Spine Events (sample-lines-spine.json)

| Event ID | Age | Role |
|----------|-----|------|
| — | — | **尚无 medical sample-line spine 事件** |

#### Medical Pool Events (medical.json)

| Event ID | Age | Role | Variant-Specific? |
|----------|-----|------|-------------------|
| `medical_talent_discovery` | 8-16 | 童年医术天赋发现 | No |
| `p27_study_habit_healer_reinforcement` | 18-28 | 治学习惯驱动医者路径 | No |
| `p29_study_habit_case_record_duty` | 26-34 | 脉案汇辑义务 | No |
| `p29_social_momentum_healer_network` | 24-32 | 口碑相传医者人脉 | No |
| `medical_master_apprentice` | 15-20 | 拜师名医 | No |
| `medical_herb_gathering` | 16-22 | 采药炼丹 | No |
| `medical_clinic_practice` | 18-25 | 坐诊治病 | No |
| `medical_plague_outbreak` | 20-30 | 瘟疫救治 | No |
| `medical_poison_temptation` | 22-32 | 毒术诱惑 | No |
| `medical_dual_cultivation` | 24-35 | 医毒双修 | No |
| `medical_divine_doctor_fame` | 26-38 | 神医名声 | No |
| `medical_imperial_doctor` | 28-42 | 宫廷御医 | No |
| `medical_palace_intrigue` | 30-45 | 宫廷斗争 | No |
| `medical_medical_book` | 32-48 | 医书传世 | No |
| `medical_poison_king` | 30-50 | 毒王 | No |
| `medical_ending_*` | 70-80 | 5 种结局（神医/毒王/御医/游医/隐士） | No |

#### Ordinary Origin Midlife Bridge (ordinary-origin-midlife.json)

| Event ID | Age | Role |
|----------|-----|------|
| `ordinary_tavern_midlife_medical_bridge` | 28 | **Bridge 事件** — "酒肆神医"，仁心医者 / 世故人医 二选一 |

**现状：只有 bridge 事件 + entry 表达，没有 on-ramp / pressure / payoff sample-line spine 事件。**
medical.json 中有大量传统医疗事件，但与 tavern-born healer 主链解耦，且无 variant 分化。

### 1.3 Expression Surfaces

#### Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Function | Medical Content | Variant Differentiation |
|---------|----------|-----------------|-------------------------|
| Sample line detection | `detectSampleLine()` | ✅ 识别 `tavern_medical_bridge_crossed` / `route_medical_committed` → `'medical'`（优先级高于 renown） | N/A |
| Current goal | `medicalCurrentGoal()` | ✅ 3 层：bridge / compassionate / pragmatic | ✅ 2 variants 不同 |
| Cost label | `deriveSampleLineCostLabel()` | ✅ 3 种：行医之重 / 仁心之累 / 世故之秤 | ✅ 2 variants 不同 |
| Age-40 identity | N/A | ❌ 无（仅 merchant/renown/orthodox/demonic 有） | — |
| Destiny sentence | N/A | ❌ 无（仅 merchant 有） | — |

#### Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Function | Medical Content | Variant Differentiation |
|---------|----------|-----------------|-------------------------|
| Current goal | `tavernCurrentGoal()` | ✅ 3 层：bridge / compassionate / pragmatic | ✅ 2 variants 不同 |
| Life memory | `tavernLifeMemory()` | ✅ 3 段：bridge / compassionate / pragmatic | ✅ 2 variants 不同 |
| Summary | `deriveOrdinaryOriginSummary()` | ✅ 3 种：bridge / compassionate / pragmatic | ✅ 2 variants 不同 |

#### Player-Facing Labels (`playerFacingLabels.ts`)

| Surface | Entry | Value |
|---------|-------|-------|
| Route display name | `ROUTE_DISPLAY_NAMES.medical` | "一代名医" |
| Route flag label | `ROUTE_FLAG_LABELS.route_medical_committed` | "一代名医之路" |
| Long-term flag label | `LONG_TERM_FLAG_LABELS.tavern_medical_bridge_crossed` | "踏上一代名医之路" |
| Route summary | `getPlayerRouteSummary()` | ✅ 识别 medical → "一代名医" / "路线进行中" |
| Raw route key | `readRawRouteKeyFromFlags()` | ✅ 识别 medical → `'medical'` |

### 1.4 Tests & Proof

| Test File | Coverage | Count |
|-----------|----------|-------|
| `p83TavernHandMedicalBridgeTests.ts` | Bridge 事件触发 + flag 设置 + 3 个表达面 + 互斥性 + key_choices dim 2 | ~21 assertions |
| `p84MedicalEntryDifferentiationTests.ts` | Sample line 检测 + 优先级 + 7 个表达面 + 2 variant 差异化 + 非 medical 隔离 | 14 test groups |

### 1.5 What Renown Has (Precedent)

Renown on-ramp 作为参考模板：

| Stage | Event Flag | Expression Updates | Variant? |
|-------|------------|-------------------|----------|
| Bridge | `tavern_renown_bridge_crossed` | Goal/life-memory/summary (ordinary origin) | No |
| **On-ramp** | `renown_on_ramp_done` | Current goal (×2), life memory, summary | No |
| Pressure | `renown_midlife_pressure_done` | Current goal (×2), cost label | No |
| Payoff | `renown_midlife_payoff_done` | Current goal (×3 variants), cost label (×3), identity (×3) | Yes (3 variants) |
| Late-life | `renown_late_life_done` | Current goal (×3), life memory (×3), summary (×3), identity (×3) | Yes (3 variants) |

## 2. Two-Variant On-Ramp Needs Analysis

### 2.1 Compassionate Variant (仁心医者)

**Identity:** 有钱没钱都给看，仁心济世，酒肆小药庐挤不下了

**On-ramp 应该是什么感觉：**
- 第一个标志性事件应该体现"仁心"的代价与回报
- 比如：一次大规模义诊/疫病初起/穷人求医浪潮
- 后果：声望+、侠义+、但身体/精力消耗
- 表达方向："仁心之累"加深，从"小药庐挤不下"到"真正的声名鹊起"

**需要的 on-ramp 元素：**
1. 事件：体现 compassionate 核心困境（救人的代价）
2. Stats: chivalry++, reputation++, 可能 constitution-
3. Flags: `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate`
4. Expression: current goal 更新、life memory 更新、summary 深化

### 2.2 Pragmatic Variant (世故人医)

**Identity:** 看病也讲人情世故，名声银子都要挣，酒肆出来的大夫懂分寸

**On-ramp 应该是什么感觉：**
- 第一个标志性事件应该体现"世故"的精明与分寸
- 比如：一位大户人家的老爷/江湖人物求医，给了丰厚报酬，也带来了名气与人情
- 后果：银子+、声望+、人脉+，但可能侠义不增甚至略减
- 表达方向："世故之秤"加深，从"看病讲分寸"到"真正的名利双收"

**需要的 on-ramp 元素：**
1. 事件：体现 pragmatic 核心精明（人情与利益的平衡）
2. Stats: money++, reputation++, connections++, charisma+
3. Flags: `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic`
4. Expression: current goal 更新、life memory 更新、summary 深化

### 2.3 Shared Elements (两 variant 共享)

- **共享检查点：** `medical_on_ramp_done`（on-ramp 里程碑）
- **共享事件结构：** 同一个 auto event ID，不同的 narrative/stats 分支
- **共享 tavern-born 底色：** 都从酒肆小药庐出发，不是 generic 神医
- **预留 pressure 接口：** `medical_midlife_pressure_done`（暂不实现）

## 3. On-Ramp Gap Summary

### 3.1 What Exists Before On-Ramp

✅ Bridge 事件（age 28，tavern_hand only）  
✅ 2 entry variants（compassionate / pragmatic）  
✅ Bridge 后的 entry 表达（7 surfaces: sample-line current goal, cost label, ordinary origin goal/memory/summary, route display name, route summary）  
✅ Sample line 检测（medical 优先级高于 renown）  
✅ 路线差异化（vs renown / merchant / plain tavern）  
✅ Tavern-born 风味（酒肆小药庐、跑堂出身）  
✅ P83 / P84 回归测试

### 3.2 What the Minimum On-Ramp Spine Needs

类比 renown `renown_on_ramp`，但 medical 有 2 variants，所以需要：

| Component | Need | Priority | Variant-Specific? |
|-----------|------|----------|-------------------|
| **On-ramp 事件** | 过桥后的第一个标志性叙事节点 | 🔴 必须 | ✅ 2 variants 不同文本/后果 |
| **On-ramp flag** | `medical_on_ramp_done` 检查点 | 🔴 必须 | 共享 + 各自 variant marker |
| **Sample line current goal 更新** | on-ramp 后的目标描述变化 | 🔴 必须 | ✅ 2 variants 不同 |
| **Ordinary origin current goal 更新** | on-ramp 后的目标描述（tavern 层） | 🔴 必须 | ✅ 2 variants 不同 |
| **Life memory 更新** | on-ramp 事件的记忆 | 🟡 应该 | ✅ 2 variants 不同 |
| **Summary 深化** | on-ramp 后的身份摘要变化 | 🟡 应该 | ✅ 2 variants 不同 |
| **Cost label 细化** | on-ramp 后的代价感增强 | 🟡 可选 | 可能共享（保持 entry 的即可） |
| **Age-40 identity** | 40 岁身份收束 | 🔵 defer（payoff 阶段） | — |

### 3.3 Core Gaps

**现状：** medical 路线只有 bridge + entry 标签，过桥后没有 sample-line spine 内容事件。

**最小 on-ramp spine 缺口：**
1. ❌ 没有 on-ramp 事件配置（sample-lines-spine.json）
2. ❌ 没有 on-ramp 检查点 flag + variant markers
3. ❌ 没有 on-ramp 后的表达更新（goal / memory / summary × 2 variants）

**不需要（P85 范围外）：**
- Pressure 事件
- Payoff 事件 / age-40 identity
- 新的事件框架
- 第二条路线
- Full lifetime 内容波次
- Poison path
- 其他出身扩展
- Plague hero / medical pure 抉择

## 4. On-Ramp Design Direction (Teaser)

基于现有 tavern-born medical healer 风味 + 2 variants，on-ramp 事件应该是：

- **触发时机：** bridge 后 3–5 年（age 31–34），给玩家一点"过桥"的缓冲
- **核心叙事：** "第一个真正的医名事件"——不是 generic 的"神医名声"，而是从酒肆小药庐出发的第一个标志性节点
- **Compassionate 风味：** 义诊/疫病/穷人求医浪潮，体现仁心的代价与回报
- **Pragmatic 风味：** 大户求医/丰厚报酬/人脉扩展，体现世故的精明与分寸
- **Tavern-born 底色：** 事件应与酒肆人脉、熟客介绍、小药庐起家相关，不是宫廷御医或江湖神医
- **Flag 接口：** 预留 `medical_midlife_pressure_done` / `medical_payoff_done` 接口

详细合同见 P85-003 on-ramp contract。

## 5. Audit Conclusion

- **现有基础：** Bridge + 2-variant entry differentiation 完整，7+ 表达面已就位
- **核心缺口：** 缺少第一个 post-bridge 内容事件（on-ramp spine）+ 对应表达
- **最小补全：** 1 个 on-ramp 事件（2 variant 分支）+ 3–4 个表达面更新 + 检查点 flag + variant markers
- **风险可控：** 完全可在现有事件系统内实现，不需要新框架
- **Tavern-born 风味保留：** 基于酒肆小药庐/熟客人脉的叙事方向与现有 bridge 一致
- **2 variant 分化可行性：** High — entry 层已有清晰差异，on-ramp 层可自然延续

---
**No runtime changes in this story.** 纯文档审计，零代码改动。
