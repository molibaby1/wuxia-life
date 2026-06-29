# P87 Medical Pressure Playable Implementation - Gaps

**Discovery date**: 2026-06-29
**Stage**: p87-wuxia-medical-pressure-playable-implementation
**North Star reference**: docs/designs/p25-lifetime-simulation-north-star.md

---

## Current State Summary

P87 已完成 medical_sage_healer 路线的 pressure 阶段可玩实现：

- ✅ 2 个 pressure auto 事件（compassionate + pragmatic）
- ✅ 5 个表达面 × 2 variants 的 pressure 状态更新
- ✅ Payoff flag 接口预留
- ✅ 36 项窄回归测试通过
- ✅ P83/P84/P85/P75 既有 evidence 不退化
- ✅ Targeted proof + closure report 产出

Medical 路线当前进度：bridge → entry → on-ramp → **pressure** (P87 done) → payoff → late-life → endgame

---

## Gap Analysis (vs North Star)

### GAP-001: Medical Payoff 阶段缺失
- **Severity**: High
- **Route**: medical_sage_healer
- **Current state**: 仅 pressure 阶段完成，payoff 未实现
- **North Star requirement**: 主流成就应有完整生命周期（bridge → entry → on-ramp → pressure → payoff）
- **Routing**: **next-stage** (P88 payoff design-first)
- **Details**:
  - Compassionate variant payoff: 硬扛到底 / 学会放手 / 找到传承
  - Pragmatic variant payoff: 硬扛人情 / 撕破脸皮 / 人情练达
  - 2 variants × 3 choices = 6 payoff 分支
  - Choice 事件（非 auto），给玩家 agency
  - Age-40 identity 深化
- **Precedent**: P76 renown payoff design-first

### GAP-002: Medical Late-life / Endgame 阶段缺失
- **Severity**: Medium
- **Route**: medical_sage_healer
- **Current state**: 无 late-life / endgame 内容
- **North Star requirement**: 完整一生模拟应覆盖到终局
- **Routing**: **deferred** (P90+, 待 payoff 完成后)
- **Details**:
  - 晚年身份收束
  - 终局总结与回响
  - 与 P19 终局回响系统对接

### GAP-003: 毒医路线（Poison Path）缺失
- **Severity**: Medium
- **Route**: medical_sage_healer 分支
- **Current state**: 无 poison path 内容
- **North Star requirement**: 医疗线应有医德/疫症抉择，与毒术线互斥
- **Routing**: **deferred** (独立大方向，待主流成就完成后)
- **Details**:
  - 与 compassionate / pragmatic 平行的第三条 variant
  - 与 medical_pure / plague hero 互斥
  - 独特的 pressure / payoff 叙事

### GAP-004: Plague Hero / Medical Pure 完整抉择缺失
- **Severity**: Medium
- **Route**: medical_sage_healer
- **Current state**: 无相关内容
- **North Star requirement**: 辅助门槛 medical_plague_hero 或 medical_pure
- **Routing**: **deferred** (深度内容，待 payoff 后)
- **Details**:
  - 疫症英雄线：大瘟疫中的抉择
  - 纯医线：不问世事，专注医术
  - 与毒医线互斥
  - 影响终局成就条件

### GAP-005: 其他 Origin 的 Medical 路线缺失
- **Severity**: Low
- **Route**: medical_sage_healer
- **Current state**: 仅 tavern_hand origin 有 medical 路线
- **North Star requirement**: 平凡出身也能讲出可信故事
- **Routing**: **deferred** (Wave 4 出身光谱)
- **Details**:
  - farm_peasant origin medical 线
  - town_apprentice origin medical 线
  - 各 origin 有不同的早期机会结构

### GAP-006: Medical 主流成就收束条件未验证
- **Severity**: Medium
- **Route**: medical_sage_healer
- **Current state**: 成就条件在 North Star 中定义，但未实现验证
- **North Star requirement**:
  - 声望 ≥55；资源 ≥30
  - 关键抉择：medical_divine_doctor_fame 或 medical_imperial
  - 辅助门槛：medical_plague_hero 或 medical_pure
  - 武学 ≤50（非 martial 单轴）
- **Routing**: **deferred** (待 payoff + late-life 完成后统一验证)
- **Details**:
  - 终局成就检测逻辑
  - 成就画像与可读目标
  - 多维度组合验证

---

## In-Stage vs Next-Stage Routing

| Gap ID | Description | Routing | Stage |
|--------|-------------|---------|-------|
| GAP-001 | Medical Payoff 阶段 | next-stage | P88 (payoff design-first) |
| GAP-002 | Late-life / Endgame | deferred | P90+ |
| GAP-003 | 毒医路线 | deferred | 独立大方向 |
| GAP-004 | Plague Hero / Medical Pure | deferred | 深度内容波次 |
| GAP-005 | 其他 Origin 医疗线 | deferred | Wave 4 |
| GAP-006 | 成就收束验证 | deferred | 终局统一验证 |

**In-stage (P87)**: 无 — P87 scope 已全部完成，所有 story 均为 PASS。

**Next-stage (P88)**: GAP-001 — Medical payoff design-first 阶段，参考 P76 renown payoff design-first 模式。

---

## End-State Status

**end_state_status: OPEN**

理由：
1. Medical 路线仅完成到 pressure 阶段，payoff / late-life / endgame 均未实现
2. 毒医路线、plague hero / medical pure 抉择等深度内容缺失
3. 仅覆盖 tavern_hand origin，其他 origin 无 medical 路线
4. 主流成就收束条件未验证
