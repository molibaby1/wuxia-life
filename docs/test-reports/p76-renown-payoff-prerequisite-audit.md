# P76 Renown Payoff — Prerequisite Audit

> **Purpose:** 汇总 `jianghu_renown_sage` 路线在 payoff 阶段之前已有的全部资产（flags, markers, events, expressions），明确哪些可复用、哪些是 gap。
> **Stage:** P76 design-first — zero runtime changes

## 1. Executive Summary

Renown 路线（tavern_hand + ally_network seed → jianghu_renown_sage）已完成 **4 个阶段**的建设：bridge (P70/P71) → entry differentiation (P72) → on-ramp spine (P73) → pressure (P74/P75)。

**现有资产总览：**
- 5 个 checkpoint/通用 flags
- 4 个 stage-specific markers
- 3 个 spine events（bridge / on-ramp / pressure）
- 6+ 个 player-facing expression surfaces（sample line + ordinary origin）
- 2 个已预留的 payoff TODO 占位符

**Payoff 阶段的入口条件已经具备：** `renown_midlife_pressure_done` 已在 P75 实现，是 payoff 的直接上游 gate。

---

## 2. Flags & Markers Inventory

### 2.1 Checkpoint / 通用 Flags

| Flag | 设置阶段 | 作用 | 位置 |
|------|----------|------|------|
| `route_renown_committed` | Bridge (P71) | 通用路线承诺标记，用于 sample line 检测 | `ordinary-origin-midlife.json` |
| `tavern_renown_bridge_crossed` | Bridge (P71) | Bridge 跨越 checkpoint，renown 路线入口 | `ordinary-origin-midlife.json` |
| `renown_on_ramp_done` | On-ramp (P73) | On-ramp checkpoint，pressure 的上游 gate | `sample-lines-spine.json` |
| `renown_midlife_pressure_done` | Pressure (P75) | Pressure checkpoint，**payoff 的上游 gate** | `sample-lines-spine.json` |
| `ally_network` | Childhood (P8 seed) | 前置种子，bridge 的触发条件之一 | P32 short-chain |

### 2.2 Stage-Specific Markers

| Marker | 设置阶段 | 作用 | 位置 |
|--------|----------|------|------|
| `tavern_renown_on_ramp` | On-ramp (P73) | On-ramp 阶段风味标记 | `sample-lines-spine.json` |
| `tavern_renown_pressure` | Pressure (P75) | Pressure 阶段风味标记 | `sample-lines-spine.json` |
| `tavern_midlife_renown_bridge` | Bridge (P71) | Bridge 事件触发标记 | `ordinary-origin-midlife.json` |
| `tavern_embrace_renown` | Bridge (P71) | Bridge 选择"拥抱声名"标记 | `ordinary-origin-midlife.json` |

### 2.3 已预留的 Payoff Flag 占位符

P75 已在 `sampleLineExpression.ts` 中预留了 TODO 注释（但未设置 flag）：
- `renown_payoff_done` — payoff checkpoint（待实现）
- `renown_age40_identity_done` — age-40 identity 深化标记（待实现）

---

## 3. Events Inventory

### 3.1 Bridge Event

| 属性 | 值 |
|------|---|
| ID | `ordinary_tavern_midlife_renown_bridge` |
| 文件 | `ordinary-origin-midlife.json` |
| 类型 | choice（2 选项：拥抱声名 / 留守酒肆） |
| 年龄 | 29 岁左右（midlife） |
| 触发条件 | `tavern_hand` origin + `ally_network` + `!ordinary_tavern_midlife_done` |
| 设置 flags | `tavern_renown_bridge_crossed`, `route_renown_committed`, `tavern_embrace_renown`, `tavern_midlife_renown_bridge`, `ordinary_tavern_midlife_done` |

### 3.2 On-Ramp Event

| 属性 | 值 |
|------|---|
| ID | `renown_on_ramp` |
| 文件 | `sample-lines-spine.json` |
| 类型 | auto |
| 年龄 | 32–35 岁 |
| 标题 | 声名初显 |
| 上游 gate | `tavern_renown_bridge_crossed` + `!renown_on_ramp_done` + 排除 orthodox/demonic seeds |
| 设置 flags | `renown_on_ramp_done`, `tavern_renown_on_ramp` |
| Stat 变化 | reputation +5, connections +4, charisma +2 |
| Tags | `p73`, `renown`, `on-ramp`, `mainline`, `mandatory`, `once` |

### 3.3 Pressure Event

| 属性 | 值 |
|------|---|
| ID | `renown_midlife_pressure` |
| 文件 | `sample-lines-spine.json` |
| 类型 | auto |
| 年龄 | 37–41 岁 |
| 标题 | 人情债重 |
| 上游 gate | `renown_on_ramp_done` + `!renown_midlife_pressure_done` + 排除 orthodox/demonic seeds |
| 设置 flags | `renown_midlife_pressure_done`, `tavern_renown_pressure` |
| Stat 变化 | reputation +3, connections +2, charisma +1 |
| Tags | `p75`, `renown`, `pressure`, `mainline`, `mandatory`, `once` |

### 3.4 Payoff Event（待实现）

- **尚无** payoff 事件
- 预留入口：`renown_midlife_pressure_done` 是直接上游 gate
- 预期年龄：43–47 岁左右（pressure 后约 6 年）

---

## 4. Player-Facing Expression Surfaces

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Bridge 后 | On-ramp 后 | Pressure 后 | Payoff（待实现） |
|---------|-----------|------------|-------------|-----------------|
| `detectSampleLine()` | renown ✅ | renown ✅ | renown ✅ | renown ✅ |
| `renownCurrentGoal()` | "凭人脉声名在江湖立足…" | "在江湖上有了名号…" | "一面维持声名，一面应付越来越重的人情债" | TODO: `renown_payoff_done` 分支 |
| `deriveSampleLineCostLabel()` | 江湖声名之累 | 江湖声名之累 | 人情债渐重 | TODO: payoff 后差异化 |
| `renownAge40Identity()` | 基础版身份描述 | 基础版身份描述 | 基础版身份描述 | TODO: `renown_age40_identity_done` 深化 |

**当前 age40 identity 文本：**
> 你是从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量。

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Bridge 后 | On-ramp 后 | Pressure 后 | Payoff（待实现） |
|---------|-----------|------------|-------------|-----------------|
| `tavernCurrentGoal()` | "江湖上渐渐有了名声…" | "在江湖上有了名号…" | "一面维持声名，一面应付越来越重的人情债" | TODO: payoff 后更新 |
| `tavernLifeMemory()` | "你凭着酒肆里攒下的人脉…" | "你第一次以江湖人的身份主持了公道…" | "这些年欠的人情、攒的面子…" | TODO: payoff 记忆 |
| `deriveOrdinaryOriginSummary()` | "酒肆出身的江湖人物…" | "酒肆出身的江湖名宿：凭人脉与面子…" | "酒肆出身的江湖名宿：靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重。" | TODO: payoff 后终局总结 |

### 4.3 现有 Expression 表面总数

- Sample line: 4 个表面（detection + currentGoal + costLabel + age40Identity）
- Ordinary origin: 3 个表面（currentGoal + lifeMemory + summary）
- **总计：7 个 expression surfaces**，其中 6 个已有 pressure 阶段内容，均需要 payoff 阶段更新

---

## 5. Merchant Payoff Precedent（参考）

Merchant 路线的 payoff（P53/P55）已实现，可供 renown 参考模式：

### 5.1 Merchant Payoff 模式
- **事件类型：** auto（`magnate_payoff`，age 42–46）
- **Checkpoint：** `magnate_payoff_done`
- **Expression 更新：** costLabel、currentGoal、age40Identity、destinySentence
- **Stat 变化：** 正向加成（商业帝国自然成型）

### 5.2 Renown 与 Merchant 的差异点
- Merchant payoff = auto（积累式成功）
- Renown payoff = **choice-based**（人情债怎么还？价值判断）
- 这是 renown 路线差异化的关键

---

## 6. Payoff Gap Analysis

### 6.1 已有（可复用）
- ✅ 上游 gate：`renown_midlife_pressure_done`（P75 已实现）
- ✅ Sample line detection：`detectSampleLine()` 已识别 renown
- ✅ Expression 骨架：6 个 surfaces 已有 pressure 版本，可扩展 payoff 分支
- ✅ TODO 占位符：`renown_payoff_done` 和 `renown_age40_identity_done` 已在注释中标注
- ✅ Merchant payoff 先例：可参考 auto payoff 的实现模式

### 6.2 缺失（payoff 需要新增）
- ❌ Payoff 事件：`renown_midlife_payoff`（choice 类型，3 个选项）
- ❌ Payoff checkpoint flag：`renown_midlife_payoff_done`
- ❌ Choice-specific markers：3 个身份标记（A/B/C 三选项各一）
- ❌ Age-40 identity 深化：`renown_age40_identity_done` + 差异化文本
- ❌ Expression payoff 分支：6 个 surfaces 各需 payoff 状态的更新
- ❌ Stat 变化：3 个选项各有不同的 stat 调整
- ❌ Targeted proof：payoff 链路的验证证据
- ❌ Regression tests：payoff 相关的测试用例

---

## 7. Readiness Assessment

| 维度 | 状态 | 说明 |
|------|------|------|
| 上游 gate 就绪 | ✅ Ready | `renown_midlife_pressure_done` 已在 P75 落地 |
| Expression 骨架 | ✅ Ready | 6+ surfaces 已有 pressure 版本，扩展即可 |
| Merchant 先例 | ✅ Ready | auto payoff 模式可参考（但 renown 要做 choice-based） |
| Design 清晰度 | ⚠️ Needs work | Payoff 的具体 choice 方向、stat 变化、表达差异需在 P76 明确 |
| Implementation 复杂度 | ⚠️ Medium | Choice event + 3 条分支表达，比 auto payoff 复杂 |

**结论：** Payoff 的前置基础设施已就绪。P76 需要做的是 design-first——明确 choice 方向、contract、validation shape，为 P77 implementation 扫清设计歧义。

---

## 8. Audit Conclusion

Renown 路线从 bridge 到 pressure 的 4 个阶段建设扎实，flags/events/expressions 三层结构完整，为 payoff 阶段提供了清晰的入口和可扩展的表达骨架。

**Payoff 阶段的核心设计决策：**
1. Choice-based vs auto？→ **推荐 choice-based**（差异化 + 符合"人情债怎么还"的叙事）
2. 3 个 choice 方向是什么？→ 需要 P76-003 明确
3. 每个 choice 的 stat/identity/expression 差异？→ 需要 P76-004 定义

本审计确认：**P76 design-first stage 可以 proceed。**
