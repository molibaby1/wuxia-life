# P91 Discovery Gaps — Medical Late-Life Playable Implementation

> **Stage:** P91 Wuxia Medical Late-Life Playable Implementation
> **对照:** P25 North Star + 代码现实
> **Date:** 2026-06-29

## 1. In-Stage Gaps (当前阶段可解决)

**Count: 0**

当前 P91 阶段全部 7 个 User Story 均已通过验收，无 in-stage gap。

- P91-001 (Event wiring): ✅ PASS
- P91-002 (Sample line expression): ✅ PASS
- P91-003 (Late-life identity): ✅ PASS
- P91-004 (Ordinary origin expression): ✅ PASS
- P91-005 (Targeted proof): ✅ PASS
- P91-006 (Regression coverage): ✅ PASS
- P91-007 (Closure report): ✅ PASS

## 2. Next-Stage Gaps (溢出至下一阶段)

### GAP-NEXT-001: Medical Endgame Echo Stage (P92 设计优先)

**Severity:** High
**Category:** 路线完整性
**来源:** P25 North Star §3.1 Wave 1 主流成就 — `medical_sage_healer` 需完成全生命周期叙事闭合

**描述:**
Medical 路线目前已走完 bridge → entry → on-ramp → pressure → payoff → late-life 共 6 个阶段，但缺少 endgame / final legacy 阶段（身后名）。对照 renown 路线方法论（7 阶段：bridge → entry → on-ramp → pressure → payoff → late-life → endgame），medical 路线还差最后一环。

**依据:**
- P91 closure report 明确给出 GO 推荐
- 6 个 late-life 分支均有清晰的 endgame echo 叙事钩子
- Renown 路线已有 P80 (design-first) → P81 (implementation) 先例
- P25 North Star Wave 1 要求 `medical_sage_healer` 有完整可玩样本

**下一阶段建议:**
P92 = Medical Endgame Design-First（轻量级 echo 模式，与 P80 renown endgame 同构）
- 1 auto echo event × 6 variants（2 variants × 3 choices = 6 late-life branches → 6 endgame echoes）
- Expression updates (sample line + ordinary origin)
- No stat changes（endgame 是记忆，不是力量）
- Lightweight constraint（不可扩成多事件 arc）

### GAP-NEXT-002: Wave 1 成就可追溯性巩固 (3 条 P16 成就)

**Severity:** Medium
**Category:** 成就系统
**来源:** P25 North Star §3.1 — "Wave 1 仅巩固可追溯性"

**描述:**
三条 P16 主流成就（`grandmaster_guardian`、`sect_leader_statesman`、`lone_sword_legend`）已存在，但可追溯性弱于 renown 和 medical 两条新路线。新路线有完整的 habit-led on-ramp → bridge → spine → expression 链路，而 P16 三条的 traceability 主要停留在 choice flag + midlife surface 层面。

**依据:**
- `achievementTraceability.ts` 中 P16 三条只有 `choiceFlags` + `midLifeConsequenceSurfaces`，缺少 `habitLedOnRampEvents`
- Renown 和 medical 均有完整的 habit-led on-ramp 链路
- P25 North Star §3.1 明确说 "Wave 1 仅巩固可追溯性"

**下一阶段建议:**
Defer 至 P92+，在 medical endgame 完成后再评估是否需要专门的 traceability consolidation stage。

### GAP-NEXT-003: Wave 2 巅峰成就

**Severity:** Low (far future)
**Category:** 产品路线图
**来源:** P25 North Star §3.2

**描述:**
巅峰成就（运气 + 选择双门槛）尚未启动。包括：
- `jianghu_myth_legend`（武林神话）
- `founding_patriarch`（开派祖师）
- 其他巅峰成就

**下一阶段建议:**
Wave 1 完成后进入 Wave 2。当前不 spawn。

### GAP-NEXT-004: Wave 3 混合成就

**Severity:** Low (far future)
**Category:** 产品路线图
**来源:** P25 North Star §3.3

**描述:**
混合成就（跨界组合）尚未启动。包括：
- `merchant_magnate`（巨贾行商，已推迟至 Wave 3）
- `healer_swordsman`（医武双绝）
- `merchant_martial_patron`（商武一体）

**下一阶段建议:**
Wave 2 完成后进入 Wave 3。当前不 spawn。

### GAP-NEXT-005: Wave 4 平凡出身光谱

**Severity:** Low (far future)
**Category:** 产品路线图
**来源:** P25 North Star §3.4

**描述:**
平凡出身光谱（普通农户、小镇学徒等）尚未启动。当前只有 `tavern_hand` 一条 ordinary origin 有完整路线。

**下一阶段建议:**
Wave 1/2/3 完成后进入 Wave 4。当前不 spawn。

## 3. Gap 路由汇总

| Gap ID | 路由 | 优先级 | 备注 |
|--------|------|--------|------|
| GAP-NEXT-001 | Next-Stage (P92) | High | Medical endgame design-first — 直接 spawn |
| GAP-NEXT-002 | Defer (Wave 1 尾期) | Medium | P16 三条 traceability 巩固 |
| GAP-NEXT-003 | Defer (Wave 2) | Low | 巅峰成就 |
| GAP-NEXT-004 | Defer (Wave 3) | Low | 混合成就 |
| GAP-NEXT-005 | Defer (Wave 4) | Low | 平凡出身光谱 |

**In-stage: 0 个**
**Next-stage (spawn now): 1 个 (GAP-NEXT-001)**
**Defer: 4 个**
