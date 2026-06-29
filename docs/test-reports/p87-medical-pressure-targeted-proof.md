# P87 Medical Pressure Targeted Proof

**Date**: 2026-06-29
**PRD**: p87-wuxia-medical-pressure-playable-implementation
**Scope**: 仅验证 pressure 阶段（on-ramp → pressure），不验证 payoff/late-life

## Proof 方法

由于本仓库使用 headless 测试框架，targeted proof 采用以下三层：

1. **配置层**：事件 JSON 存在且格式合法
2. **逻辑层**：表达函数正确分支（6 个核心节点 × 2 variants）
3. **合约层**：与 P85 on-ramp 的衔接性 + flag 命名一致性

---

## 1. 配置层 Proof

### 1.1 事件存在性

| 事件 ID | 存在 | 类型 | 触发年龄 |
|---------|------|------|----------|
| `medical_pressure_compassionate` | ✅ | auto | 36-40 |
| `medical_pressure_pragmatic` | ✅ | auto | 37-41 |

### 1.2 事件条件

**Compassionate 触发条件**：
```
flags.has('medical_on_ramp_done') 
&& flags.has('tavern_medical_on_ramp_compassionate') 
&& !flags.has('medical_midlife_pressure_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
```

**Pragmatic 触发条件**：
```
flags.has('medical_on_ramp_done') 
&& flags.has('tavern_medical_on_ramp_pragmatic') 
&& !flags.has('medical_midlife_pressure_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
```

**验证**：
- ✅ 两个事件互斥（需要不同的 on-ramp variant marker）
- ✅ 共享 `medical_midlife_pressure_done` 检查点，防止重复触发
- ✅ 需要 `medical_on_ramp_done`，与 P85 衔接
- ✅ Compassionate 年龄 36-40，Pragmatic 年龄 37-41（pragmatic 稍晚，符合人设）
- ✅ 排除正邪童年种子线

### 1.3 事件效果

| 效果 | Compassionate | Pragmatic |
|------|--------------|-----------|
| `medical_midlife_pressure_done` | ✅ | ✅ |
| variant marker | `tavern_medical_pressure_compassionate` | `tavern_medical_pressure_pragmatic` |
| `event_record: medical_pressure` | ✅ | ✅ |
| constitution | -3 | — |
| reputation | +3 | +4 |
| chivalry | +2 | — |
| money | — | +50 |
| connections | — | +3 |
| charisma | — | +2 |

**验证**：
- ✅ stats 与 PRD 合同一致
- ✅ 两个 variant 共享检查点但保留独立 marker
- ✅ Compassionate = 向内消耗（constitution-3，chivalry+2）
- ✅ Pragmatic = 向外束缚（connections+3，charisma+2，money+50）
- ✅ 与 renown_midlife_pressure 效果结构一致

### 1.4 JSON Schema 合法性

- ✅ `sample-lines-spine.json` JSON.parse 成功
- ✅ 两个事件字段完整（id, version, category, priority, weight, ageRange, triggers, conditions, content, eventType, autoEffects, metadata）
- ✅ metadata.tags 包含 p87、medical、pressure、mainline、once

---

## 2. 逻辑层 Proof（6 核心节点 × 2 Variants）

### Variant A: Compassionate（仁心耗尽）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-pressure state | ✅ | on-ramp 后 pressure 前：cost label = "仁心之累"，current goal = "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧" |
| 2. Event fires | ✅ | `medical_pressure_compassionate` auto 事件，age 36-40 |
| 3. Checkpoint set | ✅ | 设置 `medical_midlife_pressure_done` |
| 4. Variant marker | ✅ | 设置 `tavern_medical_pressure_compassionate` |
| 5. Cost label update | ✅ | "仁心之累" → "仁心耗尽" |
| 6. Current goal update | ✅ | sample line: "一面撑着身子救人，一面看着自己的仁心一点点耗尽" |

**Bonus 节点**：
- ✅ Life memory: 包含"老掌柜劝你歇一歇"、"夜里常常咳醒"、"仁心这东西，也是会耗尽的"
- ✅ Summary: "酒肆出身的仁心医者：名声传遍周边，只是仁心耗尽、身子渐垮，仍硬撑着救人。"
- ✅ Ordinary origin current goal: "一面撑着身子给人看病，一面看着自己的仁心一点点耗尽"

### Variant B: Pragmatic（人情债缠身）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-pressure state | ✅ | on-ramp 后 pressure 前：cost label = "世故之秤"，current goal = "镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏" |
| 2. Event fires | ✅ | `medical_pressure_pragmatic` auto 事件，age 37-41 |
| 3. Checkpoint set | ✅ | 设置 `medical_midlife_pressure_done` |
| 4. Variant marker | ✅ | 设置 `tavern_medical_pressure_pragmatic` |
| 5. Cost label update | ✅ | "世故之秤" → "人情债缠身" |
| 6. Current goal update | ✅ | sample line: "一面维持名声，一面应付越来越多的人情债" |

**Bonus 节点**：
- ✅ Life memory: 包含"翻着这些年记下的人情账"、"张老爷的姨娘、李掌柜的独子、县衙的师爷"、"被这张人情的网，缠得死死的"
- ✅ Summary: "酒肆出身的世故人医：镇上大户都捧着你，只是人情债越积越多，被缠得脱不开身。"
- ✅ Ordinary origin current goal: "一面维持名声场面，一面应付越来越多的人情债"

### 2.1 Sample Line 表达链

**sampleLineExpression.ts → medicalCurrentGoal()

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_pressure_compassionate` | "一面撑着身子救人，一面看着自己的仁心一点点耗尽" |
| `tavern_medical_pressure_pragmatic` | "一面维持名声，一面应付越来越多的人情债" |
| `tavern_medical_on_ramp_compassionate`（无 pressure） | "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧" |

**验证**：
- ✅ pressure 阶段优先级高于 on-ramp 阶段
- ✅ 两个 variant 文本区分度足够
- ✅ 向内消耗 vs 向外束缚 的方向明确

**sampleLineExpression.ts → deriveSampleLineCostLabel()

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_pressure_compassionate` | "仁心耗尽" |
| `tavern_medical_pressure_pragmatic` | "人情债缠身" |
| `tavern_embrace_compassionate_healer`（无 pressure） | "仁心之累" |

**验证**：
- ✅ cost label 从"累"升级为"耗尽"/"缠身"，压力感增强
- ✅ 与 PRD 合同一致

### 2.2 Ordinary Origin 表达链

**ordinaryOriginExpression.ts → tavernCurrentGoal()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_pressure_compassionate` | "一面撑着身子给人看病，一面看着自己的仁心一点点耗尽" |
| `tavern_medical_pressure_pragmatic` | "一面维持名声场面，一面应付越来越多的人情债" |

**验证**：
- ✅ 与 sample line 表达一致但略有差异（更具体的场景描述）
- ✅ 优先级高于 on-ramp

### 2.3 Life Memory 表达

**tavernLifeMemory()**

| Flag 组合 | 特征 |
|-----------|------|
| `tavern_medical_pressure_compassionate` | 老掌柜劝歇、夜里咳醒、手发颤、药庐门口望鱼肚白、仁心会耗尽 |
| `tavern_medical_pressure_pragmatic` | 翻人情账、张老爷/李掌柜/县衙师爷、人情网缠得死死的 |

**验证**：
- ✅ 与事件文本叙事连贯
- ✅ 各 variant 有 distinct flavor
- ✅ 包含酒肆出生场景元素（老掌柜、酒肆后院小药庐）

### 2.4 Summary 表达

**deriveOrdinaryOriginSummary()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_pressure_compassionate` | "酒肆出身的仁心医者：名声传遍周边，只是仁心耗尽、身子渐垮，仍硬撑着救人。" |
| `tavern_medical_pressure_pragmatic` | "酒肆出身的世故人医：镇上大户都捧着你，只是人情债越积越多，被缠得脱不开身。" |

**验证**：
- ✅ 一句话概括身份 + 当前阶段 + 压力代价
- ✅ 与 renown pressure 的 summary 风格一致

---

## 3. 合约层 Proof（与 P85 的衔接）

### 3.1 On-Ramp → Pressure 过渡

| P85 on-ramp 状态 | 可触发的 P87 pressure |
|-----------------|-----------------------|
| `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` | `medical_pressure_compassionate` |
| `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` | `medical_pressure_pragmatic` |
| 仅 `medical_on_ramp_done`（无 variant marker） | ❌ 不可触发（必须有 variant） |

**验证**：
- ✅ on-ramp 是 pressure 的前置条件
- ✅ 必须先有 variant marker 才能进入 pressure
- ✅ 与 renown 路线的结构一致（on-ramp → pressure）

### 3.2 Flag 命名规范

| 命名模式 | 示例 | 符合规范 |
|---------|------|---------|
| `{route}_midlife_pressure_done` | `medical_midlife_pressure_done` | ✅ |
| `tavern_{route}_pressure_{variant}` | `tavern_medical_pressure_compassionate` | ✅ |
| `event_record: {route}_pressure` | `medical_pressure` | ✅ |

**验证**：
- ✅ 与 renown 路线的 flag 命名模式完全一致
- ✅ 便于后续 payoff 阶段复用模式

### 3.3 完整链路回溯（Bridge → Entry → On-Ramp → Pressure）

**Compassionate 完整链路**：
```
tavern_medical_bridge_crossed → tavern_embrace_compassionate_healer → tavern_medical_on_ramp_compassionate → tavern_medical_pressure_compassionate
```

**Pragmatic 完整链路**：
```
tavern_medical_bridge_crossed → tavern_embrace_pragmatic_healer → tavern_medical_on_ramp_pragmatic → tavern_medical_pressure_pragmatic
```

**验证**：
- ✅ 4 阶段链路完整
- ✅ variant 方向一致（compassionate 始终是仁心，pragmatic 始终是世故）
- ✅ 每一步都有清晰的 checkpoint + marker 结构

---

## 4. Variant 差异化验证

### 4.1 本质差异

| 维度 | Compassionate | Pragmatic |
|------|--------------|-----------|
| 压力方向 | 向内消耗（身体垮掉） | 向外束缚（人情债缠身） |
| 主要代价 | constitution -3 | connections +3（债多） |
| Cost label | 仁心耗尽 | 人情债缠身 |
| 叙事核心 | 仁心熬干了、身子垮了 | 人情网缠住了、脱不开身 |
| 触发年龄 | 36-40（稍早，累垮） | 37-41（稍晚，债慢慢积） |

**验证**：
- ✅ 两个 variant 有本质差异，不是简单换皮
- ✅ 符合 P86 contract 定义的方向
- ✅ tavern-born 风味贯穿始终

---

## 5. 跨路线区分

| 维度 | Medical Compassionate | Medical Pragmatic | Renown Pressure | Merchant Pressure |
|------|-------------------|-------------------|-----------------|-------------------|
| Cost label | 仁心耗尽 | 人情债缠身 | 人情债渐重 | 人情与面子的担子 |
| Current goal 关键词 | 撑着身子、仁心耗尽 | 维持名声、人情债 | 维持声名、人情债 | 商号遍九州、人情面子债 |
| Summary 开头 | 酒肆出身的仁心医者 | 酒肆出身的世故人医 | 酒肆出身的江湖名宿 | 酒肆出身的商人 |
| 核心代价 | 身体/仁心 | 人情网 | 名声/人情 | 生意/债务 |

**验证**：
- ✅ medical 与 renown/merchant pressure 有明确区分
- ✅ medical 有自己的风味（行医、仁心、药庐）
- ✅ 不会与 renown 的"人情债"方向相近但来源不同（renown 是名声带来的人情，medical pragmatic 是行医带来的人情）

---

## 6. Payoff Flag 预留

- ✅ `medical_payoff_done` — 在 sampleLineExpression.ts 中以 TODO 注释预留
- ✅ `medical_age40_identity_done` — 在 sampleLineExpression.ts 中以 TODO 注释预留
- ✅ `tavern_medical_payoff_compassionate` / tavern_medical_payoff_pragmatic` — 在 sampleLineExpression.ts 中以 TODO 注释预留
- ✅ 注释明确标注 "for P88+ payoff stage"

---

## 7. 未覆盖项（不在 P87 范围）

以下内容**不在**本阶段 proof 范围内，留待后续阶段：

- payoff 阶段事件和表达
- age-40 identity 深化
- late-life 阶段
- 其他 origin（farm_peasant、town_apprentice）的 medical 路线
- 毒医路线
- plague hero / medical pure 的完整抉择

---

## 8. 结论

P87 medical pressure spine 配置正确，表达完整，与 P85 on-ramp 衔接顺畅。两个 variant（仁心耗尽 / 人情债缠身）有清晰的叙事区分和 stat 差异，符合 pressure 阶段的产品定义。

**Payoff 阶段 GO/NO-GO 判断**：GO。

- ✅ pressure 阶段已完整落地（2 variants，runtime 可见）
- ✅ 两个 variant 有本质差异，不是换皮
- ✅ tavern-born 风味保持良好
- ✅ 与 renown pressure 模式一致，可复用方法论
- ✅ payoff flag 接口已预留

建议进入 P88 payoff design-first 阶段
