# P76 Renown Payoff Design-First — Gaps Report

> **Stage:** P76 — design-first contract for jianghu_renown_sage payoff
> **Discovery mode:** post-run (pipeline-auto)
> **Stage status:** CLEAR — 6/6 stories passed, contract LOCKED

---

## 1. In-Stage Gaps (P76 范围内)

### 已闭合 (Closed by P76)

| Gap | Status | Closing Story | Evidence |
|-----|--------|---------------|----------|
| GAP-P76-001: Payoff 方向未确定（choice vs auto） | ✅ Closed | P76-003 | `p76-renown-payoff-direction-comparison.md` — 选定 choice-based "人情债之解" |
| GAP-P76-002: 三个选择方向未定义 | ✅ Closed | P76-003/P76-004 | `p76-renown-payoff-contract.md` — 硬扛/撕破脸/找平衡，各有 stat/identity/叙事差异 |
| GAP-P76-003: Payoff event spec 缺失 | ✅ Closed | P76-004 | Contract §3 — 完整 event spec: ID/type/age/trigger/conditions/effects/metadata |
| GAP-P76-004: Player-facing expression 更新边界未定义 | ✅ Closed | P76-004 | Contract §4 — 5 个 expression surfaces × 3 choices = 15 条具体文本 |
| GAP-P76-005: P77 验证标准未锁定 | ✅ Closed | P76-005 | `p76-p77-validation-shape.md` — 11 core nodes + ~25 tests + 9 closure criteria |
| GAP-P76-006: Late-life / endgame flag 接口未预留 | ✅ Closed | P76-004 | Contract §6 — `renown_late_life_identity_done` + `renown_endgame_echo_done` |

**In-stage gaps: 0 open, 6 closed.** P76 范围内所有 gap 均已闭合。

---

## 2. Next-Stage Gaps (P77 — Payoff Implementation)

以下 gap 不在 P76 design-first 范围内，属于 P77 implementation 阶段：

| Gap | Priority | Description | Routing |
|-----|----------|-------------|---------|
| GAP-P77-001 | P0 | Payoff 事件 runtime wiring 缺失 | **P77** — 在 `sample-lines-spine.json` 中配置 `renown_midlife_payoff` choice 事件 |
| GAP-P77-002 | P0 | Sample line expression 更新未实现（cost label + current goal） | **P77** — `sampleLineExpression.ts` 中 payoff 分支逻辑 |
| GAP-P77-003 | P0 | Ordinary origin expression 更新未实现（current goal） | **P77** — `ordinaryOriginExpression.ts` 中 payoff 分支逻辑 |
| GAP-P77-004 | P1 | Ordinary origin life memory 更新未实现 | **P77** — `tavernLifeMemory()` payoff 分支 |
| GAP-P77-005 | P1 | Ordinary origin summary 更新未实现 | **P77** — `deriveOrdinaryOriginSummary()` payoff 分支 |
| GAP-P77-006 | P0 | Age-40 identity 表达未实现 | **P77** — `renownAge40Identity()` payoff 深化 |
| GAP-P77-007 | P0 | Targeted proof 缺失 | **P77** — pressure → payoff → expression changes 全链路验证 |
| GAP-P77-008 | P0 | Regression tests 缺失 | **P77** — ~25 tests 跨 7 groups，覆盖 event wiring / pre-payoff / A/B/C post-payoff / distinct from merchant / no regression |
| GAP-P77-009 | P0 | Closure report 缺失 | **P77** — 汇总 implementation 结果 + 9 closure criteria 检查表 |

**Next-stage gaps: 9 open.** 全部路由到 P77。

---

## 3. End-State Open Items (North Star 对照)

对照 North Star §3（成就谱系）、§6（重玩动机）、§8（Discovery 完成判定），以下为仍未完成的更大范围项：

### END-001: `jianghu_renown_sage` 完整路线未闭合
- **状态:** OPEN — bridge/entry/on-ramp/pressure 已完成，payoff 待实现，late-life / endgame 未启动
- **关联 Wave:** Wave 1 主流成就
- **当前进度:** P76 design-first 完成 → P77 implementation → P78+ late-life → endgame echo
- **预计剩余阶段:** 至少 2 个（payoff impl + late-life），endgame 可能需要更多

### END-002: `medical_sage_healer` 路线完全未启动
- **状态:** OPEN — Wave 1 第二条新增成就路线，仍在 defer 队列
- **关联 Wave:** Wave 1 主流成就
- **预计阶段:** 至少 5-6 个（bridge → entry → on-ramp → pressure → payoff）
- **依赖:** Renown 路线方法论验证完成后启动

### END-003: Mentor-bond 第二条 renown seed 未启动
- **状态:** OPEN — 当前 renown 只有 ally_network 一条 seed，mentor_bond 未做
- **关联 Wave:** Wave 1 主流成就（jianghu_renown_sage 达成路径多元化）
- **预计阶段:** 至少 2-3 个（bridge + on-ramp 复用 + pressure/payoff 差异化）
- ** defer 原因:** 先验证一条 seed 跑通再扩展

### END-004: Other origins 的 renown 路线未启动
- **状态:** OPEN — 当前仅 tavern_hand origin 能走 renown 路线
- **关联 Wave:** Wave 4 平凡出身（farm_peasant / town_apprentice 是否能走 renown）
- ** defer 原因:** 先把一条出身做深做透，再考虑扩展

### END-005: Wave 2 巅峰成就未启动
- **状态:** OPEN — 运气 + 选择双门槛的极稀有结果
- **关联 Wave:** Wave 2 巅峰成就
- ** defer 原因:** Wave 1 主流成就尚未全部完成

### END-006: Wave 3 混合成就未启动
- **状态:** OPEN — 跨界组合（医武双绝、商武一体等）
- **关联 Wave:** Wave 3 混合成就
- ** defer 原因:** Wave 1 单路线尚未全部完成

### END-007: Wave 4 平凡出身光谱未完成
- **状态:** OPEN — 目前只有 3 种平凡出身（farm_peasant / town_apprentice / tavern_hand），North Star 要求 ≥3 种且轨迹可区分
- **关联 Wave:** Wave 4 平凡出身
- **当前状态:** 3 种出身已存在，但 renown 路线仅 tavern_hand 有

### END-008: 重玩动机指标未验证
- **状态:** OPEN — North Star §6 要求：不同出身 + 不同关键选择产生 ≥3 条 materially different 全生命周期轨迹
- **关联:** §6 重玩动机
- ** defer 原因:** 单路线内容尚在填充，等 Wave 1 完成后统一验证

**End-state open items: 8 items.**

---

## 4. Gap Routing Summary

| Category | Count | Routing |
|----------|-------|---------|
| In-stage (P76) gaps | 0 open, 6 closed | P76 已闭合 |
| Next-stage (P77) gaps | 9 open | 全部路由到 P77 payoff implementation |
| End-state open items | 8 open | 继续在后续 pipeline 阶段推进 |

**结论:** P76 stage 本身 CLEAR，但 end_state 仍 OPEN，需要 spawn P77 继续推进。
