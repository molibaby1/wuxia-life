# P86 Medical Pressure Design-First — Gaps Analysis

> **Stage:** P86 Wuxia Medical Pressure Design-First
> **North Star:** `docs/designs/p25-lifetime-simulation-north-star.md`
> **Analysis date:** 2026-06-29

## 1. Current State Summary

P86 是 `medical_sage_healer`（一代名医）路线的 pressure 阶段 design-first contract 阶段。

**已完成的医疗路线进度：**

| Stage | Status | Key Deliverables |
|-------|--------|-----------------|
| P83 Bridge | ✅ Complete | Bridge event + 2 variants + 3 expression surfaces |
| P84 Entry Differentiation | ✅ Complete | 7 expression surfaces + 2-variant differentiation |
| P85 On-Ramp Spine | ✅ Complete | 2 auto events + 4 expression surfaces + 8 variant branches |
| **P86 Pressure Design-First** | ✅ **Complete** | Pressure contract (2 variants) + validation shape + closure report |

**P86 产出清单：**
- ✅ Prerequisite audit（10+ flags, 3 events, 7 expression surfaces 盘点）
- ✅ Scope contract（6 allowed layers, 14 forbidden expansions）
- ✅ Direction comparison（每 variant 3 个候选，各选 1 个）
  - Compassionate: 仁心耗尽 / 身体垮掉 (Burnout)
  - Pragmatic: 人情债缠身 (Favor Debt Entanglement)
- ✅ Pressure contract（2 events, shared checkpoint, 5 expression surfaces each）
- ✅ P87 validation shape（~26 proof nodes, ~30-35 assertions, 12 closure criteria）
- ✅ Closure report（GO recommendation for P87）
- ✅ Zero runtime changes（documentation-only）

## 2. Gap Analysis

### 2.1 In-Stage Gaps (P86)

**无 in-stage gap。** P86 所有 6 个 User Story 均已完成，且验证通过。

可选优化项（非必须，不影响 stage closure）：
- FIX-001: Direction comparison 文档中备选候选（B/C 类）缺少完整的四维度描述
- FIX-002: Pragmatic cost label "人情债缠身" 与 renown "人情债渐重" 字面相似度较高

**路由：均为 optional fix，不放入 current stage。**

### 2.2 Next-Stage Gaps (Immediately Actionable)

#### GAP-001: Pressure Playable Implementation (P87)

**Gap:** P86 只产出了 design-first contract，pressure 阶段还没有 runtime 实现。玩家目前走到 on-ramp（医名初起）后就没有后续路线事件了。

**What's needed:**
- 2 个 pressure auto events（compassionate + pragmatic）配置到 `sample-lines-spine.json`
- Pressure flags 接入运行时（`medical_midlife_pressure_done` + 2 variant markers）
- 5 个 expression surfaces 更新（cost label, current goal ×2, life memory, summary）
- Targeted proof 文档（验证 on-ramp → pressure 全链路）
- Regression tests（~30-35 assertions）
- P87 closure report

**North Star 关联:** Wave 1 主流成就 `medical_sage_healer` 的 pressure 阶段实现——从"上升期"推进到"有代价的成长期"。

**路由：NEXT_STAGE → P87**

### 2.3 Future-Stage Gaps (Deferred)

#### GAP-002: Medical Payoff Stage

**Gap:** Pressure 之后的 payoff / late identity 阶段尚未设计和实现。

**What's needed:**
- Compassionate payoff: 硬扛/放手/传承 三条路线
- Pragmatic payoff: 依附/撕破脸/平衡 三条路线
- Age-40 identity 深化
- 成就条件 `medical_divine_doctor_fame` / `medical_imperial` 的实现

**North Star 关联:** `medical_sage_healer` 成就的最终收束阶段。

**路由：FUTURE → P88+（P87 完成后再设计）**

#### GAP-003: Medical Plague Hero / Medical Pure Choice

**Gap:** North Star 要求的辅助门槛 `medical_plague_hero` 或 `medical_pure` 尚未设计。

**North Star 关联:** 成就条件的辅助门槛，与毒术线 `medical_poison_path` 互斥。

**路由：FUTURE → 待 payoff 阶段或独立 stage**

#### GAP-004: Other Origins Medical Route

**Gap:** 目前医疗路线仅覆盖 `tavern_hand` 出身，`farm_peasant`、`town_apprentice` 等其他出身尚无医疗路线。

**North Star 关联:** Wave 4 平凡出身光谱的一部分。

**路由：FUTURE → 远期待 tavern-born 路线完整后再扩展**

#### GAP-005: Poison Path (Dark Healer Route)

**Gap:** 毒医路线（`medical_poison_path`）作为医疗路线的黑暗变体尚未设计。

**North Star 关联:** 可能作为 Wave 3 混合成就或独立路线。

**路由：FUTURE → 长期 roadmap 项**

## 3. Gap Routing Summary

| Gap ID | Description | Route To | Priority |
|--------|-------------|----------|----------|
| GAP-001 | Pressure playable implementation | **P87 (spawn now)** | High |
| GAP-002 | Medical payoff stage | P88+ (after P87) | High |
| GAP-003 | Plague hero / medical pure choice | Future stage | Medium |
| GAP-004 | Other origins medical route | Future (Wave 4) | Low-Medium |
| GAP-005 | Poison path (dark healer) | Future roadmap | Low |

## 4. End-State Status

**end_state_status: OPEN**

`medical_sage_healer`（一代名医）主流成就距离 North Star 目标还差：
- Pressure 阶段 runtime 实现（P87）
- Payoff 阶段设计与实现
- 成就关键抉择（divine_doctor_fame / imperial）
- 辅助门槛（plague_hero / medical_pure）
- 多出身扩展

当前进度：~35-40%（bridge + entry + on-ramp + pressure design 完成）
