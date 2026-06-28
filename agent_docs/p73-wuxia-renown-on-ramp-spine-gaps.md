# P73 Wuxia Renown On-Ramp Spine — Gaps Report

> **Stage:** P73 Wuxia Renown On-Ramp Spine
> **Discovery mode:** post-run, pipeline-auto, allow spawn-stage
> **Date:** 2026-06-29

---

## 1. Stage-Level Gaps (In-Stage)

| Gap ID | Description | Severity | Routing | Status |
|--------|-------------|----------|---------|--------|
| — | 无 in-stage gaps | — | — | All closed |

**结论：** P73 全部 8 个 user stories 已通过，closure report 已产出，stage 内无遗留 gap。

---

## 2. North Star §8 Gaps (End-State)

对照 `docs/designs/p25-lifetime-simulation-north-star.md` §8 "Discovery 完成判定"：

### §8.1 主流、混合、巅峰三类成就均有可玩样本且规则文档化

| Gap ID | 描述 | 影响维度 | Routing |
|--------|------|----------|---------|
| END-NS8-WAVE1-RENOWN-INCOMPLETE | `jianghu_renown_sage` 目前只有 bridge + entry + on-ramp，缺 pressure + payoff，不构成完整可玩样本 | Wave 1 主流成就 | next-stage (P74+) |
| END-NS8-WAVE1-MEDICAL-UNSTARTED | `medical_sage_healer` 完全未开始 | Wave 1 主流成就 | deferred (future cycle) |
| END-NS8-WAVE2-PEAK-UNSTARTED | 巅峰成就 Wave 2 完全未开始 | Wave 2 巅峰成就 | deferred (far future) |
| END-NS8-WAVE3-MIXED-UNSTARTED | 混合成就 Wave 3 完全未开始 | Wave 3 混合成就 | deferred (far future) |

### §8.2 平凡出身 ≥3 种产生与鲜明出身可区分的早期与中期轨迹

| Gap ID | 描述 | 影响维度 | Routing |
|--------|------|----------|---------|
| END-NS8-WAVE4-ORIGINS-RENOWN-SINGLE | renown 路线仅覆盖 `tavern_hand` 出身，`farm_peasant` / `town_apprentice` 等尚无 renown bridge | Wave 4 平凡出身 | deferred (future cycle) |

### §8.3 主动 + 事件触发选择的后果链零自相矛盾

| Gap ID | 描述 | 影响维度 | Routing |
|--------|------|----------|---------|
| END-NS8-CHOICE-RENOWN-NO-CHOICE | renown on-ramp 目前是 auto event，无主动/事件触发选择；完整路线应有选择分支 | 选择体系 | deferred (pressure stage 可考虑引入) |

### §8.4 模拟门禁证明：巅峰需运气+选择；主流可单靠合理选择+时间达中高档

| Gap ID | 描述 | 影响维度 | Routing |
|--------|------|----------|---------|
| END-NS8-SIM-GATE-RENOWN-UNPROVEN | renown 路线尚无 sim gate 证明 | 模拟门禁 | deferred (路线完整后) |

### §8.5 `gate:playability`、`gate:p20` 及 P25 专用报告不退化

| Gap ID | 描述 | 影响维度 | Routing |
|--------|------|----------|---------|
| END-NS8-GATES-RENOWN-UNCHECKED | renown 新增内容尚未在完整 gate 套件中验证不退化 | Gate 套件 | deferred (路线完整后或集中验证) |

---

## 3. Route-Level Gaps (Renown Route Continuity)

按 merchant trilogy 方法论（bridge → entry → on-ramp → pressure → payoff），renown 路线当前进度：

| 阶段 | 状态 | 对应 P |
|------|------|--------|
| Bridge | ✅ Done | P71 |
| Entry | ✅ Done | P72 |
| On-ramp | ✅ Done | P73 |
| Pressure | ❌ 未定义方向 | **Next: P74** |
| Payoff | ❌ 未定义 | P75+ |

| Gap ID | 描述 | Routing |
|--------|------|---------|
| ROUTE-RENOWN-PRESSURE-UNDEFINED | renown pressure 方向未定义：是 "声名之累"、"人情债"、还是 "江湖恩怨"？需 design-first 明确 | **next-stage (P74)** |
| ROUTE-RENOWN-PRESSURE-NOCONTRACT | 无 pressure contract：触发条件、叙事节点、flag 接口、表达更新均未定义 | **next-stage (P74)** |
| ROUTE-RENOWN-PAYOFF-UNDEFINED | renown payoff / late identity 深化未定义 | deferred (P75+) |

---

## 4. Summary

| Category | Count | Routing |
|----------|-------|---------|
| In-stage gaps | 0 | — |
| End-state gaps | 7 | 1 next-stage + 6 deferred |
| Route-level gaps | 3 | 1 next-stage + 2 deferred |

**Immediate next action:** Spawn P74 renown pressure design-first contract stage.
