# P85 Medical On-Ramp Targeted Proof

**Date**: 2026-06-29
**PRD**: p85-wuxia-medical-sage-on-ramp-spine
**Scope**: 仅验证 on-ramp 阶段（入口→on-ramp），不验证 pressure/payoff/endgame

## Proof 方法

由于本仓库使用 headless 测试框架，targeted proof 采用以下三层：

1. **配置层**：事件 JSON 存在且格式合法
2. **逻辑层**：表达函数正确分支
3. **合约层**：与 P84 bridge 事件的衔接性

---

## 1. 配置层 Proof

### 1.1 事件存在性

| 事件 ID | 存在 | 类型 | 触发年龄 |
|---------|------|------|----------|
| `medical_on_ramp_compassionate` | ✅ | auto | 31-34 |
| `medical_on_ramp_pragmatic` | ✅ | auto | 31-34 |

### 1.2 事件条件

**Compassionate 触发条件**：
```
flags.has('tavern_medical_bridge_crossed') 
&& flags.has('tavern_embrace_compassionate_healer') 
&& !flags.has('medical_on_ramp_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
```

**Pragmatic 触发条件**：
```
flags.has('tavern_medical_bridge_crossed') 
&& flags.has('tavern_embrace_pragmatic_healer') 
&& !flags.has('medical_on_ramp_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
```

**验证**：
- ✅ 两个事件互斥（需要不同的 embrace marker）
- ✅ 共享 `medical_on_ramp_done` 检查点，防止重复触发
- ✅ 需要 `tavern_medical_bridge_crossed`，与 P84 衔接
- ✅ 排除正邪童年种子线

### 1.3 事件效果

| 效果 | Compassionate | Pragmatic |
|------|--------------|-----------|
| `medical_on_ramp_done` | ✅ | ✅ |
| variant marker | `tavern_medical_on_ramp_compassionate` | `tavern_medical_on_ramp_pragmatic` |
| `event_record: medical_on_ramp` | ✅ | ✅ |
| reputation | +6 | +4 |
| chivalry | +5 | — |
| constitution | -2 | — |
| money | — | +80 |
| connections | — | +4 |
| charisma | — | +3 |

**验证**：
- ✅ stats 与 PRD 合同一致
- ✅ 两个 variant 共享检查点但保留独立 marker
- ✅ 与 renown_on_ramp 效果结构一致（reputation + variant-specific stats）

### 1.4 JSON Schema 合法性

- ✅ `sample-lines-spine.json` JSON.parse 成功
- ✅ 两个事件字段完整（id, version, category, priority, weight, ageRange, triggers, conditions, content, eventType, autoEffects, metadata）
- ✅ metadata.tags 包含 p85、medical、on-ramp、mainline、once

---

## 2. 逻辑层 Proof

### 2.1 Current Goal 表达链

**sampleLineExpression.ts → medicalCurrentGoal()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_on_ramp_compassionate` | "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧" |
| `tavern_medical_on_ramp_pragmatic` | "镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏" |
| `tavern_embrace_compassionate_healer`（无 on-ramp） | "多救一个是一个，酒肆的小药庐挤不下了" |
| `tavern_embrace_pragmatic_healer`（无 on-ramp） | "名声银子都要挣，酒肆出来的大夫懂分寸" |

**验证**：
- ✅ on-ramp 阶段优先级高于 bridge/embrace 阶段
- ✅ 两个 variant 文本区分度足够

**ordinaryOriginExpression.ts → tavernCurrentGoal()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_on_ramp_compassionate` | "周边村子的人都慕名而来，小药庐挤不下，大堂都摆上了病床" |
| `tavern_medical_on_ramp_pragmatic` | "镇上大户都来请你，诊金丰厚，还认识了不少有头有脸的人物" |

**验证**：
- ✅ 与 sample line 表达一致但不重复（不同视角）
- ✅ 优先级高于 bridge/embrace

### 2.2 Life Memory 表达

**tavernLifeMemory()**

| Flag 组合 | 特征 |
|-----------|------|
| `tavern_medical_on_ramp_compassionate` | 周边村子慕名而来、大堂摆病床、老掌柜叹气、仁心、身子撑不住 |
| `tavern_medical_on_ramp_pragmatic` | 大户老爷治病、厚赏、引荐有头有脸的人物、懂分寸会办事 |

**验证**：
- ✅ 与事件文本叙事连贯
- ✅ 各 variant 有 distinct flavor
- ✅ 包含酒肆出生场景元素（老掌柜、酒肆大堂）

### 2.3 Summary 表达

**deriveOrdinaryOriginSummary()**

| Flag 组合 | 返回文本 |
|-----------|---------|
| `tavern_medical_on_ramp_compassionate` | "酒肆出身的仁心医者：名声传开，周边村子的人都慕名而来，累是累，但救人要紧。" |
| `tavern_medical_on_ramp_pragmatic` | "酒肆出身的世故人医：镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏。" |

**验证**：
- ✅ 一句话概括身份 + 当前阶段
- ✅ 与 renown_on_ramp 的 summary 风格一致（"酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号..."）

---

## 3. 合约层 Proof（与 P84 的衔接）

### 3.1 Bridge → On-Ramp 过渡

| P84 bridge 状态 | 可触发的 P85 on-ramp |
|----------------|---------------------|
| `tavern_medical_bridge_crossed` + `tavern_embrace_compassionate_healer` | `medical_on_ramp_compassionate` |
| `tavern_medical_bridge_crossed` + `tavern_embrace_pragmatic_healer` | `medical_on_ramp_pragmatic` |
| 仅 `tavern_medical_bridge_crossed`（无 embrace） | ❌ 不可触发（必须有 variant） |

**验证**：
- ✅ bridge 是 on-ramp 的前置条件
- ✅ 必须先选定 variant（embrace）才能进入 on-ramp
- ✅ 与 renown 路线的结构一致（bridge → embrace → on-ramp）

### 3.2 Flag 命名规范

| 命名模式 | 示例 | 符合规范 |
|---------|------|---------|
| `{route}_on_ramp_done` | `medical_on_ramp_done` | ✅ |
| `tavern_{route}_on_ramp_{variant}` | `tavern_medical_on_ramp_compassionate` | ✅ |
| `event_record: {route}_on_ramp` | `medical_on_ramp` | ✅ |

**验证**：
- ✅ 与 renown 路线的 flag 命名模式完全一致
- ✅ 便于后续阶段复用模式

---

## 4. 未覆盖项（不在 P85 范围）

以下内容**不在**本阶段 proof 范围内，留待后续阶段：

- pressure 阶段事件和表达
- payoff 阶段事件和表达
- endgame 阶段事件和表达
- 其他 origin（farm_peasant、town_apprentice）的 medical 路线
- 毒医路线

---

## 5. 结论

P85 medical on-ramp spine 配置正确，表达完整，与 P84 bridge 衔接顺畅。两个 variant（仁心医者 / 世故人医）有清晰的叙事区分和 stat 差异，符合 on-ramp 阶段的产品定义。
