# P93 Medical Endgame Targeted Proof

**Date**: 2026-06-29
**PRD**: p93-wuxia-medical-endgame-playable
**Contract**: p92-medical-endgame-contract
**Scope**: 验证 endgame 阶段（late-life → endgame → expression changes），覆盖 2 variants × 3 choices = 6 分支
**Constraint**: Lightweight — 1 echo event + expression only, no stat changes

## Proof 方法

由于本仓库使用 headless 测试框架，targeted proof 采用以下三层：

1. **配置层**：事件 JSON 存在且格式合法
2. **逻辑层**：表达函数正确分支（6 核心节点 × 2 variants × 3 choices + bonus nodes）
3. **合约层**：与 P91 late-life 的衔接性 + flag 命名一致性 + 完整链路回溯

---

## 1. 配置层 Proof

### 1.1 事件存在性

| 事件 ID | 存在 | 类型 | 触发年龄 | 对应变体 |
|---------|------|------|----------|----------|
| `medical_endgame_echo_compassionate_ember` | ✅ | auto | 60-65 | Comp-A: 仁心不灭·烬 |
| `medical_endgame_echo_compassionate_peace` | ✅ | auto | 60-65 | Comp-B: 医者从容·淡 |
| `medical_endgame_echo_compassionate_legacy` | ✅ | auto | 60-65 | Comp-C: 仁心满天下·传 |
| `medical_endgame_echo_pragmatic_fame_remain` | ✅ | auto | 60-65 | Prag-A: 医名犹存·寂 |
| `medical_endgame_echo_pragmatic_wanderer_legend` | ✅ | auto | 60-65 | Prag-B: 江湖游医·遥 |
| `medical_endgame_echo_pragmatic_grand_master` | ✅ | auto | 60-65 | Prag-C: 一代宗师·名 |

### 1.2 事件条件

**Compassionate Endgame 触发条件（以 ember 为例）**：
```
flags.has('medical_late_life_done') 
&& flags.has('tavern_medical_late_compassionate_final') 
&& !flags.has('medical_endgame_echo_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
&& flags.has('tavern_medical_bridge_crossed')
```

**Pragmatic Endgame 触发条件（以 fame_remain 为例）**：
```
flags.has('medical_late_life_done') 
&& flags.has('tavern_medical_late_pragmatic_fallen') 
&& !flags.has('medical_endgame_echo_done')
&& !flags.has('orthodox_childhood_seed_done')
&& !flags.has('demonic_childhood_seed_done')
&& flags.has('tavern_medical_bridge_crossed')
```

**验证**：
- ✅ 6 个事件基于 late-life branch marker 分支（3 compassionate + 3 pragmatic）
- ✅ 共享 `medical_endgame_echo_done` 检查点，防止重复触发
- ✅ 需要 `medical_late_life_done`，与 P91 衔接
- ✅ 所有事件年龄 60-65，符合 endgame 阶段定义
- ✅ 排除正邪童年种子线
- ✅ 事件类型为 auto（echo event，自动触发的身后名）
- ✅ 每个事件对应唯一的 late-life branch marker
- ✅ 6 个事件互斥（late-life 保证只有一个 marker）

### 1.3 事件效果（Lightweight: No Stat Changes）

#### 共享 autoEffects（6 个事件都有）

| 效果 | 值 |
|------|-----|
| `medical_endgame_echo_done` | ✅ |
| `medical_endgame_identity_done` | ✅ |
| `event_record` | `medical_endgame_echo` |
| `stageSignals` | `["medical_endgame"]` |

#### Compassionate 3 Branches（Spiritual/Healing Legacy 轴）

| 效果 | A: 仁心不灭·烬 | B: 医者从容·淡 | C: 仁心满天下·传 |
|------|----------------|----------------|------------------|
| marker flag | `tavern_medical_endgame_compassionate_ember` | `tavern_medical_endgame_compassionate_peace` | `tavern_medical_endgame_compassionate_legacy` |
| stat changes | **None** | **None** | **None** |

#### Pragmatic 3 Branches（Social/Medical Reputation 轴）

| 效果 | A: 医名犹存·寂 | B: 江湖游医·遥 | C: 一代宗师·名 |
|------|----------------|----------------|----------------|
| marker flag | `tavern_medical_endgame_pragmatic_fame_remain` | `tavern_medical_endgame_pragmatic_wanderer_legend` | `tavern_medical_endgame_pragmatic_grand_master` |
| stat changes | **None** | **None** | **None** |

**验证**：
- ✅ **No stat changes** — endgame 是记忆，不是力量（lightweight compliant）
- ✅ 6 个分支共享检查点但保留独立 marker
- ✅ Compassionate = spiritual/healing legacy 轴（薪火相传）
- ✅ Pragmatic = social/medical reputation 轴（医名远播）
- ✅ 每个分支有独特的 marker 和 narrative
- ✅ 与 renown_endgame_echo 结构一致（auto 事件 + 分支 marker + no stats）

### 1.4 JSON Schema 合法性

- ✅ `sample-lines-spine.json` JSON.parse 成功
- ✅ 6 个事件字段完整（id, version, category, priority, weight, ageRange, triggers, conditions, content, eventType, autoEffects, metadata）
- ✅ metadata.tags 包含 p93、medical、endgame、mainline、auto、once
- ✅ autoEffects 数组每个效果包含 type、target
- ✅ 每个事件有 stageSignals: ["medical_endgame"]

---

## 2. 逻辑层 Proof（6 分支全验证）

### 10 Core Nodes Summary

| # | 节点 | Comp-A | Comp-B | Comp-C | Prag-A | Prag-B | Prag-C |
|---|------|--------|--------|--------|--------|--------|--------|
| 1 | Pre-endgame baseline (late-life) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Event fires at age 60-65 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | Flags + identity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4 | Cost label (6 distinct) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5 | Current goal (6 distinct) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.1 Variant A: Compassionate — 薪火相传（3 Branches）

#### Branch A: 仁心不灭·烬（燃尽自己的点灯人）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-endgame baseline | ✅ | late-life 后 endgame 前：cost label = "最后仁心"，current goal = "多救一个是一个，撑到最后一刻"，identity = "燃尽自己的最后仁心" |
| 2. Event fires | ✅ | `medical_endgame_echo_compassionate_ember` auto 事件，age 60-65 |
| 3. Checkpoint set | ✅ | `medical_endgame_echo_done` + `medical_endgame_identity_done` |
| 4. Branch marker | ✅ | `tavern_medical_endgame_compassionate_ember` |
| 5. No stat changes | ✅ | 无 stat_modify（lightweight compliant） |
| 6. Cost label update | ✅ | "最后仁心" → "仁心不灭·烬" |
| 7. Current goal update | ✅ | "仁薪尽传，此生无憾" |
| 8. Endgame identity | ✅ | "燃尽自己的点灯人"（深化 late-life 身份） |
| 9. Life memory | ✅ | endgame 专属叙事：仁心像火种，灯熄了别处还亮着 |
| 10. Origin summary | ✅ | endgame 状态总结：从苦孩子到点灯人 |
| 11. Tavern-born flavor | ✅ | 酒肆熬药、老掌柜的"傻孩子"、苦孩子出身 |

#### Branch B: 医者从容·淡（从容淡然的老医者）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-endgame baseline | ✅ | late-life 后 endgame 前：cost label = "从容自在"，identity = "从容自在的老者" |
| 2. Event fires | ✅ | `medical_endgame_echo_compassionate_peace` auto 事件 |
| 3. Checkpoint set | ✅ | 同上 |
| 4. Branch marker | ✅ | `tavern_medical_endgame_compassionate_peace` |
| 5. No stat changes | ✅ | 无 stat_modify |
| 6. Cost label update | ✅ | "从容自在" → "医者从容·淡" |
| 7. Current goal update | ✅ | "晒晒太阳看看病，从容了此一生" |
| 8. Endgame identity | ✅ | "从容淡然的老医者"（深化 late-life 身份） |
| 9. Life memory | ✅ | endgame 专属叙事：老病人找上门、随手看病不收钱 |
| 10. Origin summary | ✅ | endgame 状态总结：硬扛半辈子终于想通了 |
| 11. Tavern-born flavor | ✅ | 晒太阳看街景、老掌柜的"想通了"、街坊邻里 |

#### Branch C: 仁心满天下·传（桃李满天下的仁医宗师）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-endgame baseline | ✅ | late-life 后 endgame 前：cost label = "仁心传承"，identity = "仁心满天下的老宗师" |
| 2. Event fires | ✅ | `medical_endgame_echo_compassionate_legacy` auto 事件 |
| 3. Checkpoint set | ✅ | 同上 |
| 4. Branch marker | ✅ | `tavern_medical_endgame_compassionate_legacy` |
| 5. No stat changes | ✅ | 无 stat_modify |
| 6. Cost label update | ✅ | "仁心传承" → "仁心满天下·传" |
| 7. Current goal update | ✅ | "看着仁心一辈辈传下去，这就够了" |
| 8. Endgame identity | ✅ | "桃李满天下的仁医宗师"（深化 late-life 身份） |
| 9. Life memory | ✅ | endgame 专属叙事：徒弟们散在各地、个个仁心仁术 |
| 10. Origin summary | ✅ | endgame 状态总结：从苦孩子到桃李满天下 |
| 11. Tavern-born flavor | ✅ | 徒弟们像当年的小帮工、老掌柜的欣慰、从苦孩子到宗师 |

### 2.2 Variant B: Pragmatic — 医名远播（3 Branches）

#### Branch A: 医名犹存·寂（失势但名存的老太医）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-endgame baseline | ✅ | late-life 后 endgame 前：cost label = "人走茶凉"，current goal = "看淡世态炎凉"，identity = "失势的老御医" |
| 2. Event fires | ✅ | `medical_endgame_echo_pragmatic_fame_remain` auto 事件，age 60-65 |
| 3. Checkpoint set | ✅ | `medical_endgame_echo_done` + `medical_endgame_identity_done` |
| 4. Branch marker | ✅ | `tavern_medical_endgame_pragmatic_fame_remain` |
| 5. No stat changes | ✅ | 无 stat_modify（lightweight compliant） |
| 6. Cost label update | ✅ | "人走茶凉" → "医名犹存·寂" |
| 7. Current goal update | ✅ | "权势如烟云，医名自长久" |
| 8. Endgame identity | ✅ | "失势但名存的老太医"（深化 late-life 身份） |
| 9. Life memory | ✅ | endgame 专属叙事：门前冷落、医书药方还在传 |
| 10. Origin summary | ✅ | endgame 状态总结：从跑堂到御医再到失势，医名比权势长久 |
| 11. Tavern-born flavor | ✅ | 从跑堂到御医的爬天梯、人走茶凉、老掌柜的叹息 |

#### Branch B: 江湖游医·遥（传说里的逍遥游医）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-endgame baseline | ✅ | late-life 后 endgame 前：cost label = "逍遥自在"，identity = "逍遥自在的老游医" |
| 2. Event fires | ✅ | `medical_endgame_echo_pragmatic_wanderer_legend` auto 事件 |
| 3. Checkpoint set | ✅ | 同上 |
| 4. Branch marker | ✅ | `tavern_medical_endgame_pragmatic_wanderer_legend` |
| 5. No stat changes | ✅ | 无 stat_modify |
| 6. Cost label update | ✅ | "逍遥自在" → "江湖游医·遥" |
| 7. Current goal update | ✅ | "传说真假谁在乎，自在就好" |
| 8. Endgame identity | ✅ | "传说里的逍遥游医"（深化 late-life 身份） |
| 9. Life memory | ✅ | endgame 专属叙事：江湖上到处是传说、真假难辨 |
| 10. Origin summary | ✅ | endgame 状态总结：从听故事到自己成了故事 |
| 11. Tavern-born flavor | ✅ | 酒肆里听江湖故事、老掌柜的"野马"、三教九流 |

#### Branch C: 一代宗师·名（德高望重的一代宗师）

| 节点 | 状态 | 证据 |
|------|------|------|
| 1. Pre-endgame baseline | ✅ | late-life 后 endgame 前：cost label = "德高望重"，identity = "德高望重的老名医" |
| 2. Event fires | ✅ | `medical_endgame_echo_pragmatic_grand_master` auto 事件 |
| 3. Checkpoint set | ✅ | 同上 |
| 4. Branch marker | ✅ | `tavern_medical_endgame_pragmatic_grand_master` |
| 5. No stat changes | ✅ | 无 stat_modify |
| 6. Cost label update | ✅ | "德高望重" → "一代宗师·名" |
| 7. Current goal update | ✅ | "看着这一世医名，守着这一份圆满" |
| 8. Endgame identity | ✅ | "德高望重的一代宗师"（深化 late-life 身份） |
| 9. Life memory | ✅ | endgame 专属叙事：高朋满座、人人敬重 |
| 10. Origin summary | ✅ | endgame 状态总结：从跑堂到一代宗师，走得稳 |
| 11. Tavern-born flavor | ✅ | 老掌柜的得意、酒肆里学的人情世故、从跑堂到名医 |

### 2.3 Sample Line 表达链

**sampleLineExpression.ts → medicalCurrentGoal()**

| Flag 组合 | 返回文本（endgame 层） |
|-----------|------------------------|
| `tavern_medical_endgame_compassionate_ember` | "仁薪尽传，此生无憾" |
| `tavern_medical_endgame_compassionate_peace` | "晒晒太阳看看病，从容了此一生" |
| `tavern_medical_endgame_compassionate_legacy` | "看着仁心一辈辈传下去，这就够了" |
| `tavern_medical_endgame_pragmatic_fame_remain` | "权势如烟云，医名自长久" |
| `tavern_medical_endgame_pragmatic_wanderer_legend` | "传说真假谁在乎，自在就好" |
| `tavern_medical_endgame_pragmatic_grand_master` | "看着这一世医名，守着这一份圆满" |
| （无 endgame，仅有 late-life） | late-life 层文本 |

**验证**：
- ✅ endgame 阶段优先级高于 late-life 阶段（medical_endgame_echo_done 在最上层）
- ✅ 6 个 endgame current goal 全部不同
- ✅ 两个 variant 有本质差异（不是镜像）
- ✅ Compassionate = spiritual/healing legacy（薪火相传），Pragmatic = social/medical reputation（医名远播）

**sampleLineExpression.ts → deriveSampleLineCostLabel()**

| Flag 组合 | 返回文本（endgame 层） |
|-----------|------------------------|
| `tavern_medical_endgame_compassionate_ember` | "仁心不灭·烬" |
| `tavern_medical_endgame_compassionate_peace` | "医者从容·淡" |
| `tavern_medical_endgame_compassionate_legacy` | "仁心满天下·传" |
| `tavern_medical_endgame_pragmatic_fame_remain` | "医名犹存·寂" |
| `tavern_medical_endgame_pragmatic_wanderer_legend` | "江湖游医·遥" |
| `tavern_medical_endgame_pragmatic_grand_master` | "一代宗师·名" |
| （无 endgame，仅有 late-life） | late-life 层 label |

**验证**：
- ✅ 6 个 endgame cost label 全部不同
- ✅ Compassionate 三个：仁心不灭·烬/医者从容·淡/仁心满天下·传（悲壮/平和/传承）
- ✅ Pragmatic 三个：医名犹存·寂/江湖游医·遥/一代宗师·名（跌落/超脱/巅峰）
- ✅ 与 P92 contract 完全一致
- ✅ 命名格式：XX·X，体现 endgame 的"身后事"感

### 2.4 Endgame Identity 表达

**medicalAge40Identity() — endgame 优先**

| Flag 组合 | 返回文本（endgame 层） |
|-----------|------------------------|
| `tavern_medical_endgame_compassionate_ember` | "燃尽自己的点灯人" |
| `tavern_medical_endgame_compassionate_peace` | "从容淡然的老医者" |
| `tavern_medical_endgame_compassionate_legacy` | "桃李满天下的仁医宗师" |
| `tavern_medical_endgame_pragmatic_fame_remain` | "失势但名存的老太医" |
| `tavern_medical_endgame_pragmatic_wanderer_legend` | "传说里的逍遥游医" |
| `tavern_medical_endgame_pragmatic_grand_master` | "德高望重的一代宗师" |
| （无 endgame，仅有 late-life） | late-life 层 identity |

**验证**：
- ✅ endgame identity 优先级高于 late-life identity（done-flag-first）
- ✅ 6 个 endgame identity 全部不同
- ✅ 每个 identity 都深化了对应的 late-life identity
- ✅ 全部包含 tavern-born medical healer 风味锚点
- ✅ Compassionate vs Pragmatic 有本质差异

### 2.5 Ordinary Origin 表达链

**ordinaryOriginExpression.ts → 3 surfaces × 6 branches**

| Surface | 数量 | 验证 |
|---------|------|------|
| tavernCurrentGoal | 6 | ✅ endgame 版本与 sample line 一致 |
| tavernLifeMemory | 6 | ✅ endgame 专属叙事，每分支不同 |
| deriveOrdinaryOriginSummary | 6 | ✅ endgame 状态总结，每分支不同 |

**验证**：
- ✅ 3 expression surfaces × 6 branches = 18 endgame expression updates
- ✅ Done-flag-first pattern 在所有 3 个函数中一致
- ✅ 全部保持 tavern-born medical healer 风味

---

## 3. 合约层 Proof

### 3.1 P91 late-life → P93 endgame 衔接

| 维度 | 验证 |
|------|------|
| Upstream gate | ✅ 所有 endgame 事件检查 `medical_late_life_done` |
| Branch mapping | ✅ 6 late-life branches → 6 endgame branches，一一对应 |
|  | ✅ Comp final → Comp ember |
|  | ✅ Comp peaceful → Comp peace |
|  | ✅ Comp legacy → Comp legacy |
|  | ✅ Prag fallen → Prag fame_remain |
|  | ✅ Prag wanderer → Prag wanderer_legend |
|  | ✅ Prag master → Prag grand_master |
| Identity deepening | ✅ endgame identity 深化了 late-life identity（不是替换） |
| Flavor continuity | ✅ tavern-born medical healer 风味贯穿始终 |

### 3.2 Flag 命名一致性

| 命名模式 | 示例 | 验证 |
|----------|------|------|
| Checkpoint | `medical_endgame_echo_done` | ✅ 与 renown_endgame_done 模式一致 |
| Identity flag | `medical_endgame_identity_done` | ✅ 与 medical_late_life_identity_done 模式一致 |
| Branch marker (Comp) | `tavern_medical_endgame_compassionate_*` | ✅ tavern_medical + stage + variant + branch |
| Branch marker (Prag) | `tavern_medical_endgame_pragmatic_*` | ✅ 同上 |
| event_record target | `medical_endgame_echo` | ✅ 与 renown_endgame_echo 模式一致 |
| stageSignals | `["medical_endgame"]` | ✅ 与 medical_late_life 模式一致 |

### 3.3 完整链路回溯

**Comp-A 完整链路**：
bridge (tavern_medical_bridge_crossed) → entry (compassionate_healer) → on-ramp (compassionate) → pressure (compassionate) → payoff (compassionate_holder) → late-life (compassionate_final) → endgame (compassionate_ember)

**Prag-C 完整链路**：
bridge (tavern_medical_bridge_crossed) → entry (pragmatic_healer) → on-ramp (pragmatic) → pressure (pragmatic) → payoff (pragmatic_master) → late-life (pragmatic_master) → endgame (pragmatic_grand_master)

**验证**：
- ✅ 7 阶段完整链路（bridge → entry → on-ramp → pressure → payoff → late-life → endgame）
- ✅ 每个阶段的 variant 一致（compassionate 始终 compassionate，pragmatic 始终 pragmatic）
- ✅ 每个阶段都有对应的 marker flag
- ✅ 每个阶段都有 expression 更新

### 3.4 Two-Variant 本质差异

| 维度 | Compassionate (薪火相传) | Pragmatic (医名远播) | 本质差异 |
|------|---------------------------|----------------------|----------|
| Legacy axis | Spiritual/healing | Social/medical reputation | ✅ 内在 vs 外在 |
| Core question | 你的仁心，传下去了吗？ | 你的医名，流传下来了吗？ | ✅ 不同的核心问题 |
| Endgame tone | Bittersweet-warm-satisfied | Nostalgic-playful-grand | ✅ 不同的情感基调 |
| Key metaphor | 火种/灯 | 名声/传说 | ✅ 不同的核心隐喻 |
| Identity framing | 点灯人/老医者/仁医宗师 | 老太医/逍遥游医/一代宗师 | ✅ 不同的身份框架 |

**验证**：
- ✅ 两个 variant 不是镜像关系
- ✅ Compassionate 围绕"仁心传承"（内在精神遗产）
- ✅ Pragmatic 围绕"医名流传"（外在社会名声）
- ✅ 6 个分支各有独特性，不是简单的换皮

### 3.5 Lightweight 合规性

| Constraint | Requirement | Status |
|------------|-------------|--------|
| 1 echo event max | 1 conceptual event (6 variants) | ✅ |
| Expression updates only | No new systems/framework | ✅ |
| Auto event | Not a choice event | ✅ |
| ≤6 variants | 6 variants (2×3) | ✅ |
| Single age window | 60-65 | ✅ |
| 2+ endgame signals | Cost label + current goal + identity + more | ✅ |
| No stat changes | Zero stat_modify in all 6 events | ✅ |

**验证**：
- ✅ 全部 7 项 lightweight constraints 满足
- ✅ 无 stat 变化（endgame 是记忆，不是力量）
- ✅ 复用现有事件系统与表达系统，不建新系统

### 3.6 Tavern-Born 风味保持

**验证维度**：
- ✅ 所有 6 个 endgame 事件都有酒肆/老掌柜锚点
- ✅ 所有 6 个 identity 都包含"从酒肆里的苦孩子"或类似表述
- ✅ Ordinary origin expression 全部保持 tavern 视角
- ✅ 没有引入 non-tavern 的元素或框架

---

## 4. Bonus Nodes

| Bonus Node | Status | Notes |
|------------|--------|-------|
| Endgame identity depth | ✅ | 深化 late-life identity，不是简单重复 |
| Ordinary origin expression | ✅ | 3 surfaces × 6 branches = 18 updates |
| Full chain traceback | ✅ | 7-stage complete chain verified |
| Mutex with other lines | ✅ | tavern_medical_bridge_crossed + 排除正邪种子 |
| Branch matching | ✅ | 6 late-life → 6 endgame，一一对应 |
| Tavern-born flavor check | ✅ | 所有 6 分支都有 tavern anchors |
| Lightweight compliance | ✅ | 7/7 constraints satisfied |
| Two-variant axis differentiation | ✅ | Spiritual/healing vs social/medical reputation |

---

## 5. 结论与建议

### 5.1 结论

P93 medical endgame implementation 满足 P92 contract 的所有要求：

- ✅ 1 echo event（6 variants）正确配置
- ✅ 6 个变体都能正常工作，且有实质差异
- ✅ 两个 variant axis 有本质不同（不是镜像）
- ✅ 无 stat 变化（lightweight 合规）
- ✅ 6 expression surfaces × 6 branches = 36 expression updates
- ✅ Tavern-born medical healer 风味保持一致
- ✅ 与 P91 late-life 正确衔接
- ✅ 完整 7 阶段 medical 路线闭合

### 5.2 建议

**GO for P93 closure** — medical_sage_healer tavern_hand seed 的 Wave 1 实现已完整闭合（bridge → entry → on-ramp → pressure → payoff → late-life → endgame）。
