# P85 Medical On-Ramp Scope Contract

> **Stage:** P85 — medical_sage_healer on-ramp spine
> **Purpose:** 明确 P85 范围边界，防止扩散成 full medical content wave
> **Variant Focus:** compassionate (仁心医者) + pragmatic (世故人医) — 两个 variant 都必须在 on-ramp 层可区分

## 1. P85 Mission

为 `medical_sage_healer` 建立最小可玩的 on-ramp spine——过桥后的第一个标志性叙事事件，让医疗路线从"有标签"变成"有内容"。

**这不是 full medical content wave，而是最小 bounded 的 spine：一个 on-ramp 里程碑事件 + 对应的表达和验证，且需延续 compassionate / pragmatic 两个 variant 的分化。**

## 2. Allowed Layers

P85 只允许在以下四层做改动：

### Layer 1: Event Configuration (事件配置)
- 新增 1 个 on-ramp spine 事件（2 variant 分支）
- 通过现有事件系统（sample-lines-spine.json）配置
- 新增 on-ramp 检查点 flag（`medical_on_ramp_done`）+ 2 个 variant marker（`tavern_medical_on_ramp_compassionate` / `tavern_medical_on_ramp_pragmatic`）
- 触发条件：post-bridge + age 范围 + variant 分支
- 不引入新的事件框架或调度器

### Layer 2: Player-Facing Expression (玩家可见表达)
- 更新 currentGoal（sample line + ordinary origin 各 1 处，2 variant 各不同）
- 更新 life memory（ordinary origin，2 variant 各不同）
- 更新 summary（ordinary origin，2 variant 各不同）
- cost label 可保持 entry 层（仁心之累 / 世故之秤），如需要可微调
- 不新增 UI 组件
- 通过现有载体传递（sampleLineExpression / ordinaryOriginExpression / playerFacingLabels）
- 至少 2 个 on-ramp-specific 可读信号

### Layer 3: Targeted Proof (定向验证)
- 产出 1 份 bridge → on-ramp 路径的 targeted proof
- 覆盖 2 variants（compassionate + pragmatic）
- 展示事件触发 + 表达变化
- 展示 2 variants 在 on-ramp 层的差异
- 不要求 full lifetime exhaust
- 支持是否继续 pressure 阶段的决策

### Layer 4: Narrow Regression Tests (窄回归测试)
- 新增测试文件 `tests/p85TavernHandMedicalOnRampSpineTests.ts`
- 覆盖 on-ramp 触发条件
- 覆盖事件触发 + flag 设置（2 variants）
- 覆盖表达更新（current goal / life memory / summary）
- 覆盖 2 variant 差异化断言
- 覆盖与 renown / merchant / plain tavern 的差异化断言
- 复用现有 test harness
- 不重写全量测试体系

## 3. Forbidden Expansions

以下内容明确禁止在 P85 实施：

### 3.1 No Pressure Wave
- ❌ 不做 midlife pressure 事件
- ❌ 不做 medical 路线的代价/压力深化
- ❌ 不做"仁心之累"或"世故之秤"的压力事件化表达
- ❌ 不做 plague hero / medical pure 抉择
- **Defer to P86+**

### 3.2 No Payoff Wave
- ❌ 不做 age-40 identity 深化
- ❌ 不做神医名声 / 太医线 / payoff
- ❌ 不做 destiny sentence
- ❌ 不做 late-life / endgame
- **Defer to P87+**

### 3.3 No New Systems
- ❌ 不新建事件框架或调度器
- ❌ 不新建 route framework
- ❌ 不新增 UI 组件或屏幕
- 复用现有事件系统 + 表达载体

### 3.4 No Full Route Expansion
- ❌ 不做全生命周期内容波次
- ❌ 不补全 youth / late-life 内容
- ❌ 不做 stat threshold gate 验证
- 只做 on-ramp 这一个里程碑

### 3.5 No Second Route
- ❌ 不扩展到第二条新路线
- ❌ 不做第二条 medical-adjacent 路线
- 仅聚焦 `medical_sage_healer` + `tavern_hand` origin

### 3.6 No Other Origins
- ❌ 不扩展到 farm_peasant / town_apprentice 的 medical 路径
- 仅处理 tavern_hand origin 的 medical 路线

### 3.7 No Poison Path
- ❌ 不做 poison / 毒王 路线
- 仅聚焦 pure healer 路径
- **Defer to 更远阶段**

## 4. Boundary with P86 (Pressure Stage)

| Dimension | P85 (On-Ramp) | P86+ (Pressure) |
|-----------|---------------|-----------------|
| **核心叙事** | 第一个医名里程碑 | 行医的代价与压力 |
| **事件数** | 1 个（2 variant 分支） | 1+ 个压力事件 |
| **表达层** | current goal + memory + summary 更新 | cost label 深化 + identity 初现 |
| **Flag 接口** | `medical_on_ramp_done` + 2 variant markers | `medical_midlife_pressure_done` (预留) |
| **Stats 变化** | 正向为主（声名鹊起） | 代价显现（精力消耗 / 人情债） |
| **玩家感受** | "我真的在医道上有了立足之地" | "行医的代价比想象中重" |

## 5. Boundary Guards

### 5.1 Story Boundaries
- **US-001 / US-002 / US-003:** 文档阶段，零运行时改动
- **US-004:** 事件配置 + flag 设置（核心实现）
- **US-005:** 表达更新（玩家感知）
- **US-006:** Targeted proof（验证）
- **US-007:** 窄回归测试（防护）
- **US-008:** Closure report（收口）

### 5.2 Quality Priority Order
1. 触发稳定性 → 事件必须可靠触发，2 variants 都必须可达
2. 风味正确性 → tavern-born medical healer 风味必须贯穿
3. Variant 分化 → compassionate 与 pragmatic 在 on-ramp 层必须可感知
4. 表达清晰度 → 玩家能感知到"过桥后有了第一个真正的医名事件"
5. 测试覆盖度 → 窄覆盖即可，但关键路径必须有防护

### 5.3 Regression Guard
- P83 bridge evidence 不退化
- P84 entry differentiation evidence 不退化
- Renown on-ramp (`renown_on_ramp`) 不受影响
- Merchant on-ramp (`magnate_on_ramp`) 不受影响
- 其他 ordinary origin 路径不受影响
- Sample-line baseline guard 必须通过

## 6. What "On-Ramp Spine" Means (Medical Edition)

类比 renown on-ramp（`renown_on_ramp`），但 medical 有 2 variants：

| Dimension | Renown On-Ramp | Medical On-Ramp (P85) |
|-----------|----------------|----------------------|
| **Role** | 过桥后的第一个标志性节点 | 过桥后的第一个标志性节点 |
| **Count** | 1 个事件 | 1 个事件（2 variant 分支） |
| **Flag** | `renown_on_ramp_done` | `medical_on_ramp_done` + 2 variant markers |
| **Expression** | currentGoal + summary/memory 更新 | currentGoal + summary/memory 更新（2 variant 各不同） |
| **Flavor** | "声名初显，江湖上有了名号" | "医名初起，小药庐装不下了" |
| **Variants** | 1 个 | 2 个（compassionate + pragmatic） |
| **Subsequent** | pressure → payoff | pressure → payoff (deferred) |

**On-ramp 不是 pressure，不是 payoff，它是"你已经上路了，第一个里程碑到了"。**

## 7. Two-Variant Differentiation Requirement

P85 必须在 on-ramp 层保持 2 variant 的可感知差异：

### Compassionate (仁心医者) On-Ramp Flavor
- 叙事核心：救人的代价与回报
- Stats 倾向：chivalry++, reputation++, 可能 constitution-
- 表达关键词：仁心、累、挤不下、义诊、穷人
- 玩家感受："我救了很多人，但也累坏了"

### Pragmatic (世故人医) On-Ramp Flavor
- 叙事核心：人情与利益的平衡
- Stats 倾向：money++, reputation++, connections++, charisma+
- 表达关键词：世故、秤、分寸、大户、人情
- 玩家感受："我名利双收，也懂了人情世故"

### Shared Tavern-Born Flavor (两 variant 共享)
- 都从酒肆小药庐出发
- 都有熟客引荐/酒肆人脉的底色
- 都不是 generic 神医（不是宫廷御医，不是江湖游医）

## 8. Rollback Plan

若 P85 实施中发现问题：
1. 回退到 P84 entry-only 状态
2. 只需移除 on-ramp 事件配置 + 对应的表达分支
3. P83/P84 基础设施不受影响
4. 回退成本：低（配置 + 表达分支，无系统级改动）
5. 若 2 variants 差异无法在 on-ramp 层成立，可退回单 variant 先推进 spine

## 9. Contract Verification

本 scope contract 通过以下方式验证：
- [ ] US-001 gap audit 输出 → 确认缺口在 on-ramp 层，包含 2 variant 分析
- [ ] US-003 on-ramp contract → 明确 on-ramp 具体内容（含 2 variant）
- [ ] US-004 event wiring → 仅 1 个新事件（2 variant 分支）
- [ ] US-005 expression → 仅更新现有载体，2 variant 可区分
- [ ] US-007 tests → 窄范围回归，覆盖 2 variant 差异化
- [ ] US-008 closure → 明确后续阶段 defer 清单，给出 pressure GO/NO-GO
