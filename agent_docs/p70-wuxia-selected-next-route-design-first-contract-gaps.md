# P70 Selected Next Route Design-First Contract — Gaps

> **Stage:** P70 Wuxia Selected Next Route Design-First Contract
> **Discovery date:** 2026-06-29
> **Method:** Post-run discovery — compare PRD north-star, code reality, and North Star end-state

---

## 1. In-Stage Gaps (Current Stage)

**Count: 0**

P70 是 design-first contract 阶段，所有 6 个 user story 均已完成（`passes: true`）。对照 PRD 验收标准：

| Gap | Severity | Routing | Evidence |
|-----|----------|---------|----------|
| 无 in-stage gap | — | — | 6/6 stories passes:true；所有 5 份测试报告 + closure report 已产出；零运行时变更（符合 design-first 定位） |

**Verification:**
- ✅ P70-001 Prerequisite audit — `docs/test-reports/p70-selected-route-prerequisite-audit.md` 存在
- ✅ P70-002 Scope contract — `docs/test-reports/p70-selected-route-scope-contract.md` 存在
- ✅ P70-003 Bridge shapes comparison — `docs/test-reports/p70-candidate-bridge-shapes-comparison.md` 存在
- ✅ P70-004 Bridge contract — `docs/PRD/p70-jianghu-renown-sage-bridge-contract.md` 存在
- ✅ P70-005 P71 validation shape — `docs/test-reports/p70-p71-validation-shape.md` 存在
- ✅ P70-006 Closure report — `docs/test-reports/p70-selected-next-route-design-closure-report.md` 存在

---

## 2. Next-Stage Gaps (Routed to P71)

**Count: ~7** — 已由队列中的 P71 承接

| Gap ID | Description | Routed To | Priority |
|--------|-------------|-----------|----------|
| GAP-P71-01 | Playable bridge runtime wiring — `tavern_renown_bridge_crossed` + `route_renown_committed` flags、bridge event、config 接线 | P71 | High |
| GAP-P71-02 | Bridge player-facing expression — currentGoal、lifeMemory、summary 三个表达面的 renown bridge 分支 | P71 | High |
| GAP-P71-03 | Targeted proof — seed → bridge checkpoint → gate acceptance 顺序链路证明 | P71 | High |
| GAP-P71-04 | Narrow regression coverage — gate acceptance、expression、non-target isolation 三类断言 | P71 | High |
| GAP-P71-05 | Bridge event 实现 — 中年 renown bridge event（age 28-30）+ embrace_renown / stay_in_tavern 选择 | P71 | High |
| GAP-P71-06 | 与 merchant bridge 的互斥性验证 — `ordinary_tavern_midlife_done` 锁 | P71 | Medium |
| GAP-P71-07 | Basic renown on-ramp spine（如在 P71 范围内）— bridge 后第一层内容 | P71 | Medium |

**Status:** P71 PRD 与 prd.json 已存在，7 个 user story 已规划，全部 `passes: false`（等待实施）。

---

## 3. Subsequent-Stage Gaps (Routed to P72+)

**Count: ~10** — 已由队列中的 P72 及更后阶段承接

| Gap ID | Description | Routed To | Priority |
|--------|-------------|-----------|----------|
| GAP-P72-01 | Post-bridge entry differentiation — bridge 后第一层 shared path 的身份差异化 | P72 | High |
| GAP-P72-02 | Entry player-facing expression — 3+ entry-specific 可读信号 | P72 | High |
| GAP-P72-03 | Entry sharedness audit — 确认 flattening 点 | P72 | Medium |
| GAP-P73+ | Pressure/payoff flavor text — renown spine 的中后期内容差异化 | P73+ | Medium |
| GAP-P74+ | Cost differentiation — renown 路线的代价表达（江湖声名之累 / 人脉维系之重） | P74+ | Medium |
| GAP-P75+ | Success-shape + recap / destiny sentence — renown 终局收口 | P75+ | Medium |
| GAP-FUTURE-01 | Mentor-bond martial seed bridge — 第二条 renown 桥接方向 | Future cycle | Medium-High |
| GAP-FUTURE-02 | Farm_peasant renown bridge — 更多出身的 renown 桥接 | Future cycle | Medium |
| GAP-FUTURE-03 | Town_apprentice renown bridge — 更多出身的 renown 桥接 | Future cycle | Low-Medium |
| GAP-FUTURE-04 | medical_sage_healer 路线 — Wave 1 第五条主流成就 | Future cycle | High |

---

## 4. End-State Gaps (North Star §8)

对照 North Star §8 "Discovery 完成判定"：

| End-State Criterion | Status | Gap Detail |
|---------------------|--------|------------|
| 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | ❌ OPEN | 主流成就 5/3 可玩（缺 jianghu_renown_sage playable + medical_sage_healer）；混合成就 merchant_magnate 推迟到 Wave 3；巅峰成就未开始 |
| 平凡出身≥3种产生与鲜明出身可区分的早期与中期轨迹 | ❌ OPEN | Wave 4 未开始；当前仅 2 种 ordinary origin（town_apprentice, tavern_hand）+ farm_peasant（P61 bridge 已做） |
| 主动+事件触发选择的后果链，零自相矛盾 | ⚠️ PARTIAL | P16/P25/P30/P32 已有验证，但新路线（renown, medical）尚未验证 |
| 模拟门禁证明：巅峰需运气+选择；主流可单靠合理选择+时间达到中高档 | ❌ OPEN | 巅峰成就未实现；新主流成就未完全可玩；缺少系统性模拟门禁证据 |
| gate:playability、gate:p20 及 P25 专用报告不退化 | ⚠️ UNVERIFIED | P70 是纯文档阶段，理论上不影响；但 P71 实施后需回归验证 |

**Overall end_state_status: OPEN**

---

## 5. Doc-Only Drift Check

| Check | Status | Notes |
|-------|--------|-------|
| PRD.md 与 prd.json 一致性 | ✅ Consistent | 6 个 story 一一对应，全部 passes:true |
| Closure report 与 prd.json 一致性 | ✅ Consistent | Closure report 汇总 6/6 完成，与 prd.json 一致 |
| Bridge contract 与 closure report 一致性 | ✅ Consistent | 双方档描述一致（ally-network midlife bridge、checkpoint flags、3 expression surfaces） |
| P70 与 P71 边界清晰度 | ✅ Clear | closure report §8 明确定义了 P70/P71 边界；P71 PRD 已存在 |

**No doc-only drift detected. No reconciliation stage needed.**
