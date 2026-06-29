# P89 Medical Payoff Targeted Proof

**Date**: 2026-06-29
**PRD**: p89-wuxia-medical-payoff-playable-implementation
**Scope**: 验证 payoff 阶段（pressure → payoff → expression changes），覆盖 2 variants × 3 choices = 6 分支

## Proof 方法

由于本仓库使用 headless 测试框架，targeted proof 采用以下三层：

1. **配置层**：事件 JSON 存在且格式合法
2. **逻辑层**：表达函数正确分支（6 核心节点 × 2 variants × 3 choices）
3. **合约层**：与 P87 pressure 的衔接性 + flag 命名一致性 + 完整链路回溯

---

## 1. 配置层 Proof

### 1.1 事件存在性

| 事件 ID | 存在 | 类型 | 触发年龄 |
|---------|------|------|----------|
| `medical_payoff_compassionate` | ✅ | choice | 42-46 |
| `medical_payoff_pragmatic` | ✅ | choice | 43-47 |

### 1.2 事件条件

**Compassionate Payoff 触发条件**：
```
flags.has('medical_midlife_pressure_done') 
&& flags.has('tavern_medical_pressure_compassionate') 
&& !flags.has('medical_payoff_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
```

**Pragmatic Payoff 触发条件**：
```
flags.has('medical_midlife_pressure_done') 
&& flags.has('tavern_medical_pressure_pragmatic') 
&& !flags.has('medical_payoff_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
```

**验证**：
- ✅ 两个事件互斥（需要不同的 pressure variant marker）
- ✅ 共享 `medical_payoff_done` 检查点，防止重复触发
- ✅ 需要 `medical_midlife_pressure_done`，与 P87 衔接
- ✅ Compassionate 年龄 42-46，Pragmatic 年龄 43-47（pragmatic 稍晚，符合人设）
- ✅ 排除正邪童年种子线
- ✅ 事件类型为 choice（玩家主动抉择），与 pressure 的 auto 形成对比

### 1.3 事件效果

#### 共享 autoEffects（两个事件都有）

| 效果 | 值 |
|------|-----|
| `medical_payoff_done` | ✅ |
| `medical_age40_identity_done` | ✅ |
| `event_record` | 对应事件 id |

#### Compassionate 3 Choices

| 效果 | A: 硬扛到底 | B: 学会放手 | C: 找到传承 |
|------|-----------|-----------|-----------|
| marker flag | `tavern_medical_payoff_compassionate_holder` | `tavern_medical_payoff_compassionate_let_go` | `tavern_medical_payoff_compassionate_legacy` |
| reputation | +2 | -1 | +1 |
| constitution | -2 | +2 | +1 |
| charisma | — | +1 | +2 |
| chivalry | +3 | -1 | +1 |

#### Pragmatic 3 Choices

| 效果 | A: 硬扛人情 | B: 撕破脸皮 | C: 人情练达 |
|------|-----------|-----------|-----------|
| marker flag | `tavern_medical_payoff_pragmatic_holder` | `tavern_medical_payoff_pragmatic_breaker` | `tavern_medical_payoff_pragmatic_master` |
| reputation | +4 | -3 | +2 |
| constitution | — | +2 | — |
| connections | +3 | -5 | +1 |
| charisma | — | -1 | +4 |
| chivalry | -2 | +1 | — |
| money | +60 | — | +30 |

**验证**：
- ✅ stats 与 P88 contract 一致
- ✅ 两个 variant 共享检查点但保留独立 marker
- ✅ Compassionate = 仁心的三种归宿（理想主义维度）
- ✅ Pragmatic = 世故的三种归宿（现实主义维度）
- ✅ 每个 choice 有独特的 stat profile
- ✅ 与 renown_midlife_payoff 结构一致（choice 事件 + 3 选项 + marker）

### 1.4 JSON Schema 合法性

- ✅ `sample-lines-spine.json` JSON.parse 成功
- ✅ 两个事件字段完整（id, version, category, priority, weight, ageRange, triggers, conditions, content, eventType, autoEffects, choices, metadata）
- ✅ metadata.tags 包含 p89、medical、payoff、mainline、choice、once
- ✅ choices 数组每个选项包含 id、text、description、effects

---

## 2. 逻辑层 Proof（6 分支全验证）

### 2.1 Variant A: Compassionate — 仁心之解（3 Choices）

#### Choice A: 硬扛到底（油尽灯枯）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-payoff baseline | ✅ | pressure 后 payoff 前：cost label = "仁心耗尽"，current goal = "一面撑着身子救人，一面看着自己的仁心一点点耗尽" |
| 2. Event fires | ✅ | `medical_payoff_compassionate` choice 事件，age 42-46 |
| 3. 3 choices visible | ✅ | 硬扛到底 / 学会放手 / 找到传承 |
| 4. Choice A selected | ✅ | marker = `tavern_medical_payoff_compassionate_holder` |
| 5. Checkpoint set | ✅ | `medical_payoff_done` + `medical_age40_identity_done` |
| 6. Cost label update | ✅ | "仁心耗尽" → "油尽灯枯" |
| 7. Current goal update | ✅ | "趁着还能动，能多救一个是一个" |
| 8. Age-40 identity | ✅ | "你是油尽灯枯的仁心医者：从酒肆帮工到一代名医，一辈子救了无数人，唯独忘了救自己。" |

#### Choice B: 学会放手（释然行医）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-payoff baseline | ✅ | 同上 |
| 2. Event fires | ✅ | 同上 |
| 3. 3 choices visible | ✅ | 同上 |
| 4. Choice B selected | ✅ | marker = `tavern_medical_payoff_compassionate_let_go` |
| 5. Checkpoint set | ✅ | 同上 |
| 6. Cost label update | ✅ | "仁心耗尽" → "释然行医" |
| 7. Current goal update | ✅ | "量力而行，把有限的精力留给真正需要的人" |
| 8. Age-40 identity | ✅ | "你是释然通透的医者：从酒肆帮工到一代名医，曾以为自己能救所有人，直到身体垮了才学会量力而行。" |

#### Choice C: 找到传承（仁心传承）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-payoff baseline | ✅ | 同上 |
| 2. Event fires | ✅ | 同上 |
| 3. 3 choices visible | ✅ | 同上 |
| 4. Choice C selected | ✅ | marker = `tavern_medical_payoff_compassionate_legacy` |
| 5. Checkpoint set | ✅ | 同上 |
| 6. Cost label update | ✅ | "仁心耗尽" → "仁心传承" |
| 7. Current goal update | ✅ | "把医术和仁心传下去，让更多人能得到救治" |
| 8. Age-40 identity | ✅ | "你是传道授业的仁医之师：从酒肆帮工到一代名医，身体垮了，但仁心没断，医术和医德一起传了下去。" |

### 2.2 Variant B: Pragmatic — 人情之解（3 Choices）

#### Choice A: 硬扛人情（声名所累）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-payoff baseline | ✅ | pressure 后 payoff 前：cost label = "人情债缠身"，current goal = "一面维持名声，一面应付越来越多的人情债" |
| 2. Event fires | ✅ | `medical_payoff_pragmatic` choice 事件，age 43-47 |
| 3. 3 choices visible | ✅ | 硬扛人情 / 撕破脸皮 / 人情练达 |
| 4. Choice A selected | ✅ | marker = `tavern_medical_payoff_pragmatic_holder` |
| 5. Checkpoint set | ✅ | `medical_payoff_done` + `medical_age40_identity_done` |
| 6. Cost label update | ✅ | "人情债缠身" → "声名所累" |
| 7. Current goal update | ✅ | "维持各方人情，在权贵圈里站稳脚跟" |
| 8. Age-40 identity | ✅ | "你是声名赫赫的权贵御医：从酒肆帮工到一代名医，靠人情世故闯出了名头，成了权贵座上宾，只是再也脱不开身。" |

#### Choice B: 撕破脸皮（快意江湖）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-payoff baseline | ✅ | 同上 |
| 2. Event fires | ✅ | 同上 |
| 3. 3 choices visible | ✅ | 同上 |
| 4. Choice B selected | ✅ | marker = `tavern_medical_payoff_pragmatic_breaker` |
| 5. Checkpoint set | ✅ | 同上 |
| 6. Cost label update | ✅ | "人情债缠身" → "快意江湖" |
| 7. Current goal update | ✅ | "断了权贵的人情，只给愿意给的人看病" |
| 8. Age-40 identity | ✅ | "你是快意恩仇的江湖游医：从酒肆帮工到一代名医，曾在权贵圈里风生水起，后来撕破脸断了人情，反倒活得自在。" |

#### Choice C: 人情练达（人情练达）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-payoff baseline | ✅ | 同上 |
| 2. Event fires | ✅ | 同上 |
| 3. 3 choices visible | ✅ | 同上 |
| 4. Choice C selected | ✅ | marker = `tavern_medical_payoff_pragmatic_master` |
| 5. Checkpoint set | ✅ | 同上 |
| 6. Cost label update | ✅ | "人情债缠身" → "人情练达" |
| 7. Current goal update | ✅ | "拿捏人情往来的分寸，游刃有余地行走在权贵之间" |
| 8. Age-40 identity | ✅ | "你是人情练达的一代名医：从酒肆帮工到一代名医，深谙人情世故，拿捏得恰到好处，谁都给面子，谁也绑不住。" |

### 2.3 Sample Line 表达链

**sampleLineExpression.ts → medicalCurrentGoal()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_payoff_compassionate_holder` | "趁着还能动，能多救一个是一个" |
| `tavern_medical_payoff_compassionate_let_go` | "量力而行，把有限的精力留给真正需要的人" |
| `tavern_medical_payoff_compassionate_legacy` | "把医术和仁心传下去，让更多人能得到救治" |
| `tavern_medical_payoff_pragmatic_holder` | "维持各方人情，在权贵圈里站稳脚跟" |
| `tavern_medical_payoff_pragmatic_breaker` | "断了权贵的人情，只给愿意给的人看病" |
| `tavern_medical_payoff_pragmatic_master` | "拿捏人情往来的分寸，游刃有余地行走在权贵之间" |
| `tavern_medical_pressure_compassionate`（无 payoff） | "一面撑着身子救人，一面看着自己的仁心一点点耗尽" |

**验证**：
- ✅ payoff 阶段优先级高于 pressure 阶段
- ✅ 6 个 choice 文本区分度足够
- ✅ 两个 variant 有本质差异（不是镜像）
- ✅ Compassionate = 仁心的三种归宿，Pragmatic = 世故的三种归宿

**sampleLineExpression.ts → deriveSampleLineCostLabel()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_payoff_compassionate_holder` | "油尽灯枯" |
| `tavern_medical_payoff_compassionate_let_go` | "释然行医" |
| `tavern_medical_payoff_compassionate_legacy` | "仁心传承" |
| `tavern_medical_payoff_pragmatic_holder` | "声名所累" |
| `tavern_medical_payoff_pragmatic_breaker` | "快意江湖" |
| `tavern_medical_payoff_pragmatic_master` | "人情练达" |
| `tavern_medical_pressure_compassionate`（无 payoff） | "仁心耗尽" |

**验证**：
- ✅ 6 个 cost label 全部不同
- ✅ Compassionate 三个：油尽灯枯/释然行医/仁心传承（递进关系）
- ✅ Pragmatic 三个：声名所累/快意江湖/人情练达（递进关系）
- ✅ 与 P88 contract 完全一致

### 2.4 Age-40 Identity 表达

**medicalAge40Identity()**

| Flag 组合 | 身份开头 |
|-----------|---------|
| `tavern_medical_payoff_compassionate_holder` | 油尽灯枯的仁心医者 |
| `tavern_medical_payoff_compassionate_let_go` | 释然通透的医者 |
| `tavern_medical_payoff_compassionate_legacy` | 传道授业的仁医之师 |
| `tavern_medical_payoff_pragmatic_holder` | 声名赫赫的权贵御医 |
| `tavern_medical_payoff_pragmatic_breaker` | 快意恩仇的江湖游医 |
| `tavern_medical_payoff_pragmatic_master` | 人情练达的一代名医 |

**验证**：
- ✅ 6 个身份描述全部不同
- ✅ 每个身份都有"从酒肆帮工到一代名医"的出身锚点
- ✅ Compassionate 三个身份调性：悲壮/释然/温暖传承
- ✅ Pragmatic 三个身份调性：讽刺身不由己/痛快反英雄/智者游刃有余

### 2.5 Ordinary Origin 表达链

**tavernCurrentGoal()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_payoff_compassionate_holder` | "趁着还能动，能多救一个是一个，药庐的灯夜夜亮着" |
| `tavern_medical_payoff_compassionate_let_go` | "每日十诊，量力而行，救人先救己" |
| `tavern_medical_payoff_compassionate_legacy` | "收个徒弟，把医术和仁心一起传下去" |
| `tavern_medical_payoff_pragmatic_holder` | "维持各方人情，在权贵圈里站稳脚跟" |
| `tavern_medical_payoff_pragmatic_breaker` | "断了权贵的人情，只给看得起的人看病" |
| `tavern_medical_payoff_pragmatic_master` | "拿捏人情往来的分寸，游刃有余地行走在权贵之间" |

**验证**：
- ✅ 与 sample line 表达方向一致但略有差异（更具体的酒肆视角）
- ✅ 优先级高于 pressure 阶段

### 2.6 Life Memory 表达

**tavernLifeMemory()**

| Choice | 特征锚点 |
|--------|---------|
| Compassionate A (硬扛) | 药庐的灯夜夜亮着、老掌柜劝歇、救人要紧、仁心耗干 |
| Compassionate B (放手) | 每日十诊告示、老掌柜拍肩膀、想通了、救人先救己 |
| Compassionate C (传承) | 酒肆后厨帮工的孩子、徒弟眼里有光、老掌柜教你一样、第一次独立坐诊 |
| Pragmatic A (硬扛) | 张员外/李知府/总督府/将军衙、诊金十倍、深宅大院、想起免费看病的自己 |
| Pragmatic B (撕破) | 请帖全退、老掌柜烫酒、好样的、不用看别人脸色 |
| Pragmatic C (练达) | 张员外的人情用药方还、该去的去该推的推、老掌柜说学到家了、八面玲珑用在行医上 |

**验证**：
- ✅ 6 个 life memory 全部不同
- ✅ 每个都有酒肆出生场景元素（老掌柜、酒肆、小药庐）
- ✅ 与事件文本叙事连贯

### 2.7 Summary 表达

**deriveOrdinaryOriginSummary()**

| Choice | 返回文本 |
|--------|---------|
| Compassionate A | "酒肆出身的仁心名医：靠仁心济世闯出了名号，只是身子也熬垮了——油尽灯枯，仁心不灭。" |
| Compassionate B | "酒肆出身的仁心名医：曾以为自己能救所有人，直到身体垮了才学会放手——量力而行，释然通透。" |
| Compassionate C | "酒肆出身的仁心名医：身体垮了，但仁心没断，收了徒弟把医术传下去——薪火相传，仁心延续。" |
| Pragmatic A | "酒肆出身的世故名医：靠医术和分寸在权贵间游走，名声银子都有了，只是人情网越织越密——声名赫赫，身不由己。" |
| Pragmatic B | "酒肆出身的世故名医：曾在权贵圈里风生水起，后来撕破脸断了人情，反倒活得自在——快意江湖，不伺候了。" |
| Pragmatic C | "酒肆出身的世故名医：深谙人情世故，拿捏得恰到好处，权贵都想结交，谁也绑不住你——人情练达，游刃有余。" |

**验证**：
- ✅ 6 个 summary 全部不同
- ✅ 一句话概括身份 + payoff 选择 + 结局调性
- ✅ 与 renown payoff 的 summary 风格一致

---

## 3. 合约层 Proof（与 P87 的衔接）

### 3.1 Pressure → Payoff 过渡

| P87 pressure 状态 | 可触发的 P89 payoff |
|-------------------|----------------------|
| `medical_midlife_pressure_done` + `tavern_medical_pressure_compassionate` | `medical_payoff_compassionate` |
| `medical_midlife_pressure_done` + `tavern_medical_pressure_pragmatic` | `medical_payoff_pragmatic` |
| 仅 `medical_midlife_pressure_done`（无 variant marker） | ❌ 不可触发（必须有 variant） |

**验证**：
- ✅ pressure 是 payoff 的前置条件
- ✅ 必须先有 variant marker 才能进入对应 payoff
- ✅ 与 renown 路线的结构一致（pressure → payoff）

### 3.2 Flag 命名规范

| 命名模式 | 示例 | 符合规范 |
|---------|------|---------|
| `{route}_payoff_done` | `medical_payoff_done` | ✅ |
| `{route}_age40_identity_done` | `medical_age40_identity_done` | ✅ |
| `tavern_{route}_payoff_{variant}_{choice}` | `tavern_medical_payoff_compassionate_holder` | ✅ |

**验证**：
- ✅ 与 renown 路线的 flag 命名模式一致
- ✅ 便于后续 late-life 阶段复用模式

### 3.3 完整链路回溯（Bridge → Entry → On-Ramp → Pressure → Payoff）

**Compassionate 完整链路（3 Choices）**：
```
tavern_medical_bridge_crossed 
→ tavern_embrace_compassionate_healer 
→ tavern_medical_on_ramp_compassionate 
→ tavern_medical_pressure_compassionate
→ tavern_medical_payoff_compassionate_holder / let_go / legacy
```

**Pragmatic 完整链路（3 Choices）**：
```
tavern_medical_bridge_crossed 
→ tavern_embrace_pragmatic_healer 
→ tavern_medical_on_ramp_pragmatic 
→ tavern_medical_pressure_pragmatic
→ tavern_medical_payoff_pragmatic_holder / breaker / master
```

**验证**：
- ✅ 5 阶段链路完整（bridge → entry → on-ramp → pressure → payoff）
- ✅ variant 方向始终一致（compassionate 始终是仁心，pragmatic 始终是世故）
- ✅ 每一步都有清晰的 checkpoint + marker 结构
- ✅ payoff 阶段将 2 条线扩展为 6 条线（2 × 3）

### 3.4 Variant 互斥性

- ✅ Compassionate payoff 仅在 `tavern_medical_pressure_compassionate` 时触发
- ✅ Pragmatic payoff 仅在 `tavern_medical_pressure_pragmatic` 时触发
- ✅ 两个 pressure variant 互斥（共享 `medical_midlife_pressure_done`）
- ✅ 因此两个 payoff 事件也互斥

---

## 4. Variant 差异化验证

### 4.1 两个 variant 本质差异

| 维度 | Compassionate | Pragmatic |
|------|--------------|-----------|
| 核心矛盾 | 仁心 vs 身体（理想主义维度） | 人情 vs 自由（现实主义维度） |
| Choice A | 硬扛到底 → 油尽灯枯（悲壮） | 硬扛人情 → 声名所累（讽刺） |
| Choice B | 学会放手 → 释然行医（成长/和解） | 撕破脸皮 → 快意江湖（痛快/反英雄） |
| Choice C | 找到传承 → 仁心传承（希望/延续） | 人情练达 → 游刃有余（成功/智者） |
| 主要 stat 维度 | constitution, chivalry | connections, charisma, money |
| Cost label 调性 | 悲壮/释然/温暖 | 讽刺/痛快/练达 |

**验证**：
- ✅ 两个 variant 有本质差异，不是简单镜像
- ✅ 符合 P88 contract 定义的方向
- ✅ tavern-born 风味贯穿始终

### 4.2 六个分支全部不同

- ✅ 6 个 cost label 全部不同
- ✅ 6 个 current goal 全部不同
- ✅ 6 个 age-40 identity 全部不同
- ✅ 6 个 life memory 全部不同
- ✅ 6 个 summary 全部不同
- ✅ 6 个 stat profile 全部不同

---

## 5. 跨路线区分

| 维度 | Medical Compassionate | Medical Pragmatic | Renown Payoff | Merchant Payoff |
|------|-------------------|-------------------|--------------|----------------|
| 事件类型 | choice | choice | choice | auto |
| Cost label | 油尽灯枯/释然行医/仁心传承 | 声名所累/快意江湖/人情练达 | 声名之累/快意恩仇/人情练达 | 巨贾负担 |
| 核心抉择 | 仁心怎么解 | 人情怎么了 | 人情债怎么还 | 商业帝国怎么守 |
| 场景锚点 | 药庐、老掌柜、病人 | 权贵府邸、请帖、老掌柜烫酒 | 酒肆、算盘、人情账 | 商号、账本、合伙人 |
| Summary 开头 | 酒肆出身的仁心名医 | 酒肆出身的世故名医 | 酒肆出身的江湖名宿 | 酒肆出身的商人 |

**验证**：
- ✅ medical 与 renown/merchant payoff 有明确区分
- ✅ medical 有自己的风味（行医、仁心、药庐）
- ✅ Pragmatic 与 renown 虽然都有"人情练达"，但来源和语境完全不同
  - Renown = 江湖人情，三教九流
  - Medical Pragmatic = 权贵人情，行医圈子

---

## 6. Late-Life Flag 预留

- ✅ `medical_late_life_done` — 概念预留（P90+）
- ✅ `medical_endgame_echo_done` — 概念预留（后续阶段）
- ✅ 6 个 payoff choice marker 都能作为 late-life 分支依据
- ✅ 当前实现不包含 late-life 逻辑，仅预留接口

---

## 7. 未覆盖项（不在 P89 范围）

以下内容**不在**本阶段 proof 范围内，留待后续阶段：

- late-life 阶段事件和表达
- endgame echo 阶段
- 其他 origin（farm_peasant、town_apprentice）的 medical 路线
- 毒医路线
- plague hero / medical pure 的完整抉择
- full lifetime exhaust

---

## 8. 结论

P89 medical payoff 配置正确，表达完整，与 P87 pressure 衔接顺畅。2 variants × 3 choices = 6 个分支全部有实质差异，不是换皮。tavern-born 风味贯穿始终，与 renown/merchant payoff 明确区分。

**Late-Life 阶段 GO/NO-GO 判断**：GO。

- ✅ payoff 阶段已完整落地（2 choice 事件，6 个分支，runtime 可见）
- ✅ 6 个分支全部有实质差异（stat、identity、表达、叙事调性）
- ✅ 两个 variant 有本质差异（不是镜像）
- ✅ tavern-born 风味保持良好
- ✅ 与 renown payoff 模式一致，可复用方法论
- ✅ 6 个 choice 方向都能自然延伸到 late-life

建议进入 P90 medical late-life design-first 阶段
