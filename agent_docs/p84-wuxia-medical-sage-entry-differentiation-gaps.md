# P84 Medical Sage Entry Differentiation — Gaps

> **Stage:** P84 — Medical Sage Entry Differentiation Refinement
> **对照北极星:** `docs/designs/p25-lifetime-simulation-north-star.md`
> **当前状态:** Entry differentiation 已完成（P84 scope 内）

## 1. 当前阶段完成状态

P84 的 8 个 user stories 均已完成：

| Story | 状态 | 产出 |
|-------|------|------|
| P84-001 | ✅ Done | sharedness audit 文档 |
| P84-002 | ✅ Done | scope contract 文档 |
| P84-003 | ✅ Done | entry differentiation contract |
| P84-004 | ✅ Done | entry-level wiring（sample-line + markers） |
| P84-005 | ✅ Done | player-facing entry expression（7 surfaces） |
| P84-006 | ✅ Done | targeted entry proof |
| P84-007 | ✅ Done | narrow regression tests（14 tests） |
| P84-008 | ✅ Done | closure report |

**stage_status: CLEAR** — P84 的 bounded scope 已全部交付。

---

## 2. North Star 对照 — End-State Gaps

对照 `p25-lifetime-simulation-north-star.md` 中 **Wave 1 主流成就** 的 `medical_sage_healer` 定义：

### 2.1 成就解锁条件（未达成）

North Star 要求的 `medical_sage_healer` 解锁条件：

| 条件 | 当前状态 | Gap |
|------|----------|-----|
| 声望 ≥55 | ❌ 未实现完整 stat threshold 交付 | 需 pressure / payoff 阶段逐步推升声望 |
| 资源 ≥30 | ❌ 未实现完整 stat threshold 交付 | 需 pragmatic variant 等路径推升资源 |
| 关键抉择：`medical_divine_doctor_fame` 或 `medical_imperial` | ❌ 仅有配置引用，无实际事件链触发 | 需 payoff / late-life 阶段实现 |
| 辅助门槛：`medical_plague_hero` 或 `medical_pure` | ❌ 仅有配置引用，无实际事件链触发 | 需 pressure 阶段实现疫症/医德抉择 |
| 毒术线 `medical_poison_path` 互斥 | ❌ 毒术线完全未实现 | 远期 Wave，当前 defer |

### 2.2 路线骨架缺失（按 spine 阶段）

参照 renown 路线的完整 spine 方法论（entry → on-ramp → pressure → payoff → late-life → endgame），医疗路线当前仅完成：

| 阶段 | 状态 | 对应 renown 先例 |
|------|------|------------------|
| Bridge（P83） | ✅ Done | P70-P71 |
| Entry Differentiation（P84） | ✅ Done | P72 |
| **On-Ramp Spine** | ❌ **Gap** | P73 |
| **Pressure** | ❌ Gap | P74-P75 |
| **Payoff** | ❌ Gap | P76-P77 |
| **Late-Life** | ❌ Gap | P78-P79 |
| **Endgame** | ❌ Gap | P80-P81 |

### 2.3 出身覆盖不足

North Star Wave 4 要求平凡出身有可区分轨迹。当前医疗路线：

| 出身 | 医疗路线状态 |
|------|-------------|
| tavern_hand | ✅ Bridge + Entry 完成 |
| farm_peasant | ❌ 无医疗 bridge |
| town_apprentice | ❌ 无医疗 bridge |

### 2.4 多维度组合要求

North Star 要求主流成就解锁条件为**多维度组合**（出身/技能/关系/资源/关键抉择/稀有机遇中至少 3 类）。

当前医疗路线仅有：
- 出身维度（tavern_hand）
- 基础 flag 维度（bridge + variant）
- ❌ 缺少关系维度
- ❌ 缺少资源维度的有意义抉择
- ❌ 缺少稀有机遇维度

---

## 3. Gap 路由

### 3.1 In-Stage（当前 P84）

**无。** P84 scope 已完全闭合，所有 entry differentiation 目标均已达成。

### 3.2 Next-Stage（P85 — Medical On-Ramp Spine）

**立即 spawn：** P85 医疗路线 on-ramp spine 阶段。

内容：
- 第一个 on-ramp 标志性事件（过桥后的第一个叙事里程碑）
- 延续 compassionate / pragmatic 两个 variant 的分化
- 保持 tavern-born 风味
- sample-line expression 更新到 on-ramp 层
- 为 pressure 阶段预留接口

参照 renown P73 模式。

### 3.3 Deferred（更远期）

| Gap | 预计阶段 | 说明 |
|-----|----------|------|
| Pressure 阶段（疫症/医德抉择） | P86+ | 对应 `medical_plague_hero` / `medical_pure` |
| Payoff 阶段（神医名声/太医） | P87+ | 对应 `medical_divine_doctor_fame` / `medical_imperial` |
| Late-life 阶段 | P88+ | 晚年医道传承/归隐等 |
| Endgame + 成就收口 | P89+ | 完整 `medical_sage_healer` 成就解锁 |
| farm_peasant 医疗 bridge | P90+ | 第二出身扩展 |
| town_apprentice 医疗 bridge | P91+ | 第三出身扩展 |
| Poison path 互斥线 | Wave 3+ | 混合成就波次 |
| 医武双绝混合成就 | Wave 3 | `healer_swordsman` |

---

## 4. 结论

- **当前 stage（P84）：CLEAR** — entry differentiation scope 已完整交付
- **End-state：OPEN** — 距 `medical_sage_healer` 完整成就还有 5+ 个 spine 阶段 + 多出身扩展
- **Next action：Spawn P85** — Medical On-Ramp Spine，延续 renown 路线 P73 模式
