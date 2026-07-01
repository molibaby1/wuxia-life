# P88 Medical Payoff Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P88 Wuxia Medical Payoff Design-First
> **Story:** P88-001 — Audit Medical Payoff Prerequisites
> **Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Purpose:** 汇总 medical 路线在 payoff 阶段之前已有的全部资产（flags, markers, events, expressions），明确哪些可复用、哪些是 gap，覆盖 2 个 variants（compassionate + pragmatic）。

---

## 1. Executive Summary

Medical 路线（tavern_hand → medical_sage_healer）已完成 **4 个阶段** 的建设：bridge (P83) → entry differentiation (P84) → on-ramp spine (P85) → pressure (P86/P87)。

**现有资产总览：**
- 6 个 checkpoint/通用 flags
- 7 个 stage-specific markers（含 2 个 pressure variant markers）
- 5 个 spine events（bridge / on-ramp ×2 / pressure ×2）
- 7 个 player-facing expression surfaces（sample line + ordinary origin）
- 4 个已预留的 payoff TODO 占位符

**Payoff 阶段的入口条件已经具备：** `medical_midlife_pressure_done` 已在 P87 实现，是 payoff 的直接上游 gate。2 个 variants 各有清晰的 pressure 叙事钩子和差异化方向。

---

## 2. Flags & Markers Inventory

### 2.1 Checkpoint / 通用 Flags

| Flag | 设置阶段 | 作用 | Payoff 相关性 |
|------|----------|------|--------------|
| `tavern_medical_bridge_crossed` | Bridge (P83) | Bridge 跨越 checkpoint | ✅ 基础路径确认 |
| `route_medical_committed` | Bridge (P83) | 通用路线承诺标记 | ✅ Sample line 检测用 |
| `medical_on_ramp_done` | On-ramp (P85) | On-ramp checkpoint | ✅ Pressure 的上游 gate |
| `medical_midlife_pressure_done` | Pressure (P87) | Pressure checkpoint | ✅ **Payoff 的直接上游 gate** |
| `medical_pure` | Bridge (P83) | Key_choice dim 2 | ⚠️ Legacy — sample-line 分支未使用 |
| `medical_talent` | Bridge (P83) | 天赋确认 | ⚠️ Legacy — sample-line 分支未使用 |

### 2.2 Stage-Specific Variant Markers

| Marker | 设置阶段 | 作用 | Payoff 相关性 |
|--------|----------|------|--------------|
| `tavern_embrace_compassionate_healer` | Bridge (P83) | Compassionate 入口选择 | ✅ Variant A 身份确认 |
| `tavern_embrace_pragmatic_healer` | Bridge (P83) | Pragmatic 入口选择 | ✅ Variant B 身份确认 |
| `tavern_medical_on_ramp_compassionate` | On-ramp (P85) | Compassionate on-ramp 标记 | ✅ Variant A 路径确认 |
| `tavern_medical_on_ramp_pragmatic` | On-ramp (P85) | Pragmatic on-ramp 标记 | ✅ Variant B 路径确认 |
| `tavern_medical_pressure_compassionate` | Pressure (P87) | Compassionate pressure 标记 | ✅ **Variant A payoff gate** |
| `tavern_medical_pressure_pragmatic` | Pressure (P87) | Pragmatic pressure 标记 | ✅ **Variant B payoff gate** |

### 2.3 已预留的 Payoff Flag 占位符

P87 已在 `sampleLineExpression.ts` 中预留 TODO 注释（但未设置 flag）：

| Flag | 预留位置 | 说明 |
|------|---------|------|
| `medical_payoff_done` | sampleLineExpression.ts:246 | Payoff 共享 checkpoint |
| `medical_age40_identity_done` | sampleLineExpression.ts:246 | Age-40 identity 检查点 |
| `tavern_medical_payoff_compassionate` | sampleLineExpression.ts:361 | Compassionate payoff marker |
| `tavern_medical_payoff_pragmatic` | sampleLineExpression.ts:361 | Pragmatic payoff marker |

---

## 3. Events Inventory

### 3.1 Bridge Event

| 属性 | 值 |
|------|---|
| ID | `ordinary_tavern_midlife_medical_bridge` |
| 文件 | `ordinary-origin-midlife.json` |
| 类型 | choice（2 个 embrace + decline） |
| 年龄 | 28 岁 |
| 触发条件 | `tavern_hand` origin + `!ordinary_tavern_midlife_done` |
| 设置 flags | `tavern_medical_bridge_crossed`, `route_medical_committed`, variant-specific markers |

### 3.2 On-Ramp Events（2 个，各对应 1 个 variant）

| 属性 | Compassionate | Pragmatic |
|------|--------------|-----------|
| ID | `medical_on_ramp_compassionate` | `medical_on_ramp_pragmatic` |
| 文件 | `sample-lines-spine.json` | `sample-lines-spine.json` |
| 类型 | auto | auto |
| 年龄 | 31-34 | 31-34 |
| 上游 gate | `medical_on_ramp_done`? No — `tavern_embrace_compassionate_healer` + `!medical_on_ramp_done` | `tavern_embrace_pragmatic_healer` + `!medical_on_ramp_done` |
| Stat 变化 | rep+6, chivalry+5, con-2 | rep+4, money+80, connections+4, charisma+3 |
| 设置 flags | `medical_on_ramp_done`, `tavern_medical_on_ramp_compassionate` | `medical_on_ramp_done`, `tavern_medical_on_ramp_pragmatic` |

### 3.3 Pressure Events（2 个，各对应 1 个 variant）

| 属性 | Compassionate 仁心耗尽 | Pragmatic 人情债缠身 |
|------|----------------------|-------------------|
| ID | `medical_pressure_compassionate` | `medical_pressure_pragmatic` |
| 文件 | `sample-lines-spine.json` | `sample-lines-spine.json` |
| 类型 | auto | auto |
| 年龄 | 36-40 | 37-41 |
| 上游 gate | `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` + `!medical_midlife_pressure_done` | `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` + `!medical_midlife_pressure_done` |
| Stat 变化 | rep+3, chivalry+2, con-3 | rep+4, connections+3, charisma+2, money+50 |
| 设置 flags | `medical_midlife_pressure_done`, `tavern_medical_pressure_compassionate` | `medical_midlife_pressure_done`, `tavern_medical_pressure_pragmatic` |

**Pressure 叙事钩子（payoff 的起点）：**
- Compassionate：身体垮掉、仁心耗尽、老掌柜叹气、夜里咳醒
- Pragmatic：人情债缠身、翻人情账、被各路人马纠缠

### 3.4 Payoff Events（待实现）

- **尚无** payoff 事件
- 预留入口：`medical_midlife_pressure_done` 是直接上游 gate
- 预期模式：choice-based（2 variants × 3 choices = 6 分支）
- 预期年龄：42-47 岁左右（pressure 后约 5-7 年）

---

## 4. Player-Facing Expression Surfaces

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Bridge 后 | Entry 后 | On-Ramp 后 | Pressure 后 | Payoff（待实现） |
|---------|-----------|----------|------------|-------------|-----------------|
| `detectSampleLine()` | medical ✅ | medical ✅ | medical ✅ | medical ✅ | medical ✅ |
| `deriveSampleLineCostLabel()` | 行医之重 | 仁心之累/世故之秤 | 仁心之累/世故之秤 | 仁心耗尽/人情债缠身 | TODO: payoff 后差异化 |
| `medicalCurrentGoal()` | 入门级目标 | 入门级目标 | On-ramp 目标（2 variants） | Pressure 目标（2 variants） | TODO: `medical_payoff_done` 分支（6 branches） |
| `medicalAge40Identity()` | — | — | — | —（deferred） | TODO: `medical_age40_identity_done` 深化（6 branches） |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Bridge 后 | Entry 后 | On-Ramp 后 | Pressure 后 | Payoff（待实现） |
|---------|-----------|----------|------------|-------------|-----------------|
| `tavernCurrentGoal()` | Bridge 分支 | Entry 分支（2 var） | On-ramp 分支（2 var） | Pressure 分支（2 var） | TODO: payoff 后更新（6 branches） |
| `tavernLifeMemory()` | Bridge（2 var） | — | On-ramp（2 var） | Pressure（2 var） | TODO: payoff 记忆（6 branches） |
| `deriveOrdinaryOriginSummary()` | Medical 分支 | Entry（2 var） | On-ramp（2 var） | Pressure（2 var） | TODO: payoff 后终局总结（6 branches） |

### 4.3 现有 Expression 表面总数

- Sample line: 4 个表面（detection + costLabel + currentGoal + age40Identity）
- Ordinary origin: 3 个表面（currentGoal + lifeMemory + summary）
- **总计：7 个 expression surfaces**
- Pressure 阶段已更新：5 个 surfaces × 2 variants = 10 个新分支
- Payoff 阶段预计新增：5 个 surfaces × 6 branches = 30 个新分支（2 variants × 3 choices）

---

## 5. Renown Payoff Precedent（参考）

Renown 路线的 payoff（P76 design-first → P77 implementation）已完成，可供 medical 参考模式：

### 5.1 Renown Payoff 模式
- **事件类型：** choice（`renown_midlife_payoff`，3 个选项）
- **Checkpoint：** `renown_payoff_done`
- **Age-40 identity：** `renown_age40_identity_done`
- **Expression 更新：** costLabel、currentGoal、age40Identity、lifeMemory、summary
- **Choice 方向：** 硬扛到底 / 撕破脸皮 / 找到平衡

### 5.2 Medical 与 Renown 的差异点

| 维度 | Renown Payoff | Medical Payoff |
|------|--------------|---------------|
| Variants 数量 | 1（单一 renown 路线） | 2（compassionate + pragmatic） |
| Choice 分支数 | 3 | 6（2×3） |
| 核心矛盾 | 江湖名声带来的人情债 | 仁心耗尽 / 人情债缠身（2 种完全不同的压力源） |
| 身份标记 | 3 个 payoff markers | 6 个 payoff markers（每个 variant 3 个） |
| 实现复杂度 | 中等 | 较高（约 2 倍工作量） |

Medical payoff 的差异化优势：**2 variants 有本质不同的 payoff 弧光**，不是简单换皮。

---

## 6. Variant Payoff Prerequisite Analysis

### 6.1 Compassionate Variant (仁心医者 → 仁心耗尽)

**Pressure 终态 stats：**
- Reputation: +9（on-ramp +6, pressure +3）
- Chivalry: +7（on-ramp +5, pressure +2）
- Constitution: -5（on-ramp -2, pressure -3）
- Money: 无显著变化

**Pressure 叙事钩子（payoff 起点）：**
1. 身体垮掉 — 夜里咳醒、手发颤、老掌柜劝歇
2. 仁心耗尽 — 病人太多，救不过来的无力感
3. 药庐压力 — 小药庐挤不下，药材告急

**Payoff 可选方向（P87 closure report 建议）：**
- A. 硬扛到底：继续消耗，油尽灯枯
- B. 学会放手：接受自己不是神，该推的推
- C. 找到传承：把医术传下去，仁心延续

**Flags available for payoff gating：**
- `medical_midlife_pressure_done`（共享 checkpoint）
- `tavern_medical_pressure_compassionate`（variant marker）
- `tavern_medical_on_ramp_compassionate`（上游 variant 确认）

### 6.2 Pragmatic Variant (世故人医 → 人情债缠身)

**Pressure 终态 stats：**
- Reputation: +8（on-ramp +4, pressure +4）
- Money: +130（on-ramp +80, pressure +50）
- Connections: +7（on-ramp +4, pressure +3）
- Charisma: +5（on-ramp +3, pressure +2）

**Pressure 叙事钩子（payoff 起点）：**
1. 人情债缠身 — 张老爷、李掌柜、县衙师爷，各路关系都来找
2. 人情网越织越密 — 想脱身也脱不开
3. 世故之秤 — 名声与利益的平衡越来越难

**Payoff 可选方向（P87 closure report 建议）：**
- A. 硬扛人情：维持名声，越缠越紧
- B. 撕破脸皮：断了不该有的债，落个骂名
- C. 人情练达：拿捏分寸，游刃有余

**Flags available for payoff gating：**
- `medical_midlife_pressure_done`（共享 checkpoint）
- `tavern_medical_pressure_pragmatic`（variant marker）
- `tavern_medical_on_ramp_pragmatic`（上游 variant 确认）

### 6.3 Variant 差异总结（Payoff 层）

| 维度 | Compassionate 仁心耗尽 | Pragmatic 人情债缠身 |
|------|----------------------|-------------------|
| **核心 payoff 矛盾** | 自我消耗的极限 — 接受不完美 / 传承 / 耗尽 | 社会束缚的极限 — 撕破脸 / 游刃有余 / 越陷越深 |
| **压力方向** | 向内（身体/精神/道德） | 向外（社会关系/名声/利益） |
| **选择的代价性质** | 理想主义的代价 | 现实主义的代价 |
| **Tavern-born 风味锚点** | 老掌柜、小药庐、酒肆大堂的病人、煎药味 | 大户管家、酒席引荐、人情账本、酒肆里的各路消息 |
| **Payoff 后身份方向** | 悲剧英雄 / 释然医者 / 传承之师 | 声名狼藉 / 圆滑老手 / 人情练达 |

**2 variants 的 payoff 有本质差异** — 不是换皮，而是完全不同的价值判断维度。

---

## 7. Reusable Assets for Payoff

### 7.1 Systems & Patterns

| Asset | 可复用性 | 说明 |
|-------|---------|------|
| Sample-line spine event pattern | ✅ 完全 | 参考 renown payoff choice 事件模式 |
| Choice event branching | ✅ 完全 | Medical 已有 bridge choice 事件的先例 |
| Expression surface system | ✅ 完全 | 同一套 7 个 surfaces，扩展 payoff 分支 |
| Variant marker pattern | ✅ 完全 | `tavern_medical_pressure_*` → `tavern_medical_payoff_*` |
| Naming convention | ✅ 完全 | `medical_payoff_done` 匹配 renown 命名模式 |
| 2-variant 并行模式 | ✅ 完全 | P85/P87 已验证 2-variant 并行实现模式 |

### 7.2 Renown Payoff Precedent

**Reference:** P76 renown payoff design-first + P77 implementation

Renown payoff pattern:
- Single choice event: `renown_midlife_payoff`
- Age range: 43-47
- Trigger: `renown_midlife_pressure_done`
- 3 choices with distinct stats/identity/expression
- 5 expression surfaces updated
- Age-40 identity deepening

Medical payoff should follow similar structural pattern but with **2 variants**（2 个独立的 choice 事件）and different thematic content per variant.

---

## 8. Payoff Gap Analysis

### 8.1 已有（可复用）

- ✅ 上游 gate：`medical_midlife_pressure_done`（P87 已实现）
- ✅ 2 个 variant markers：`tavern_medical_pressure_compassionate` / `_pragmatic`（P87 已实现）
- ✅ Sample line detection：`detectSampleLine()` 已识别 medical
- ✅ Expression 骨架：7 个 surfaces 已有 pressure 版本，可扩展 payoff 分支
- ✅ TODO 占位符：4 个 payoff 相关 flag 已在注释中标注
- ✅ Renown payoff 先例：choice-based payoff 的完整模式可参考
- ✅ 2-variant 并行模式：P85/P87 已验证可行
- ✅ Tavern-born 风味：已有的酒肆/老掌柜/药庐意象可延续

### 8.2 缺失（payoff 需要新增）

| Category | Gap | 数量 |
|----------|-----|------|
| **Payoff events** | Compassionate payoff choice event + Pragmatic payoff choice event | 2 个事件 |
| **Payoff choices** | 2 variants × 3 choices = 6 个完整分支（含 stat 变化、identity marker、narrative） | 6 个分支 |
| **Payoff checkpoint flag** | `medical_payoff_done`（共享） | 1 个 |
| **Choice-specific markers** | 3 per variant = 6 个 payoff-specific identity markers | 6 个 |
| **Age-40 identity** | `medical_age40_identity_done` + 6 个差异化身份文本 | 1 + 6 |
| **Expression updates** | 5 个 surfaces × 6 branches = 30 个新表达分支 | ~30 个分支 |
| **Targeted proof** | Payoff 链路的验证证据（6 分支各有核心节点） | 1 份 |
| **Regression tests** | Payoff 相关的测试用例 | ~40-50 项 |

---

## 9. Readiness Assessment

| 维度 | 状态 | 说明 |
|------|------|------|
| 上游 gate 就绪 | ✅ Ready | `medical_midlife_pressure_done` 已在 P87 落地 |
| 2 个 variant 分化完成 | ✅ Ready | Pressure 阶段已建立清晰的 variant 差异 |
| Expression 骨架 | ✅ Ready | 7 个 surfaces 已有 pressure 版本，扩展即可 |
| Renown payoff 先例 | ✅ Ready | choice-based payoff 模式已验证（P76/P77） |
| 2-variant 并行模式 | ✅ Ready | P85/P87 已验证可行 |
| Design 清晰度 | ⚠️ Needs work | Payoff 的 6 个 choice 方向、stat 变化、表达差异需在 P88 明确 |
| Implementation 复杂度 | ⚠️ Medium-High | 2 个 choice events + 6 条分支表达，约为 renown payoff 的 2 倍 |

**结论：** Payoff 的前置基础设施已就绪。P88 需要做的是 design-first —— 明确 2 variants × 3 choices 的方向、contract、validation shape，为 P89 implementation 扫清设计歧义。

---

## 10. Audit Conclusion

Medical 路线从 bridge 到 pressure 的 4 个阶段建设扎实，flags/events/expressions 三层结构完整，2 个 variants 各有清晰的叙事弧光和身份标记，为 payoff 阶段提供了丰富的起点和可扩展的表达骨架。

**Payoff 阶段的核心设计决策：**
1. Choice-based vs auto？→ **推荐 choice-based**（2 variants 各有各的价值判断，符合 medical 路线差异化定位）
2. 每个 variant 的 3 个 choice 方向是什么？→ 需要 P88-003 明确
3. 每个 choice 的 stat/identity/expression 差异？→ 需要 P88-004 定义
4. 2 variants 的 payoff 如何保持本质差异？→ 需要 P88-003/004 确保

本审计确认：**P88 design-first stage 可以 proceed。**

---

**P88-001 complete.** Prerequisite audit saved.
