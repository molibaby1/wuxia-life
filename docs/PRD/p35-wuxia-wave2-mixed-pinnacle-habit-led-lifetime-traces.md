# PRD: P35 Wuxia Wave 2 Mixed/Pinnacle Habit-Led Lifetime Traces

> **Derived from:** `docs/PRD/p34-wuxia-wave1-habit-led-lifetime-birth-to-death-e2e-slice.md` (Discovery pass 2026-06-24, round 8/8)
> **Stage slug:** `p35-wuxia-wave2-mixed-pinnacle-habit-led-lifetime-traces`
> **Gaps addressed:** GAP-END-08-01 (mixed/pinnacle partial), GAP-END-MIXED-PIN

## 1. Introduction

P34 闭合了 Wave 1 medical **birth→death lifetime sim e2e**（habit-zero on-ramp → JSON bridges → terminal composite eval，100% `medical_sage_healer` without static resolver）。P25 已有 mixed identity slice、pinnacle baseline、rare-window waste slice，但均为 **static fixture / short baseline**，未串联 habit/semi-personality on-ramp 与 **lifetime trajectory** 至 mixed/pinnacle unlock。

P35 在 **不交付 Wave 4 平凡出身扩展、不全量迁移 medical 池、不修复 game-engine JSON poison mutex、不强制 renown birth→death lifetime、不一次性交付 merchant_magnate Wave 3 内容** 的前提下，新增至少 **1 条** mixed-achievement 与 **1 条** pinnacle-achievement habit-led lifetime sim trace（或 near-lifetime slice 至 terminal eval）、baseline delta、regression、closure。

## 2. Goals

- 新增至少 **1 条** mixed-achievement habit-led lifetime sim trace（如 `healer_swordsman` 或等价 cross-track outcome）：on-ramp 可观测 → 跨轨 bridge/flags → terminal eval，证明 unlock 不经 static resolver seed
- 新增至少 **1 条** pinnacle-achievement habit-led lifetime sim trace 或 dual-gate slice：证明 luck+choice 双门槛在 habit-led 路径上可复盘（失败/成功归因到稀有线或关键选择）
- 文档化 seed、age progression、事件序列、unlock 与终局 outcome 于 `docs/test-reports/`
- 运行 mixed/pinnacle sim baseline delta，记录 vs P25 static mixed/pinnacle slices 的对齐或差异
- 扩展 isolated regression 覆盖 P35 traces；产出 closure 报告，列出 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新增 Wave 1 mainstream medical/renown 内容样本（P34 已闭合）
- 不交付 Wave 4 平凡出身 ≥3 全量扩展
- 不交付 Wave 3 `merchant_magnate` 全量商路内容
- 不全量迁移 medical 池 stat/talent gate（3/18 保持）
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不修改已 `passes: true` 的 P34 story 或 parent PRD
- 不强制 renown birth→death lifetime（P34 skip 保持有效）
- 不修复 game-engine JSON poison mutex 非 sim path（Monitor 保持）
- 不要求 Wave 2–4 成就配置一次性全量落地

## 4. User Stories

### US-001: P35 Mixed Habit-Led Lifetime Sim Trace

**Description:** As a maintainer, I want a mixed-achievement habit-led lifetime sim trace proving cross-track unlock from on-ramp through terminal eval.

**Acceptance Criteria:**

- [ ] Add mixed lifetime trace under P25 test harness with habit/semi-personality on-ramp observability, cross-track bridge flags, and terminal composite eval
- [ ] Target a P25 mixed outcome (e.g. `healer_swordsman`) or documented equivalent cross-track outcome
- [ ] Document seed, age steps, event sequence, unlock, and terminal outcome under `docs/test-reports/`
- [ ] Unlock without static `resolveP31HabitLedKeyChoiceBridges` on fixtures
- [ ] Typecheck passes

### US-002: P35 Pinnacle Habit-Led Lifetime Sim Trace Or Dual-Gate Slice

**Description:** As a maintainer, I want a pinnacle-achievement habit-led lifetime trace or dual-gate slice proving luck+choice gating on a habit-led path.

**Acceptance Criteria:**

- [ ] Add pinnacle lifetime trace or dual-gate slice under P25 test harness (success path and/or documented failure attribution)
- [ ] Target a P25 pinnacle outcome (e.g. `jianghu_myth_legend` or `founding_patriarch`) or documented equivalent
- [ ] Document luck window, key choices, and unlock/failure outcome under `docs/test-reports/`
- [ ] Align with P25 rare-window waste slice semantics where applicable
- [ ] Typecheck passes

### US-003: Run Mixed/Pinnacle Sim Baseline Delta

**Description:** As a maintainer, I want sim metrics comparing P35 trace inputs vs P25 static mixed/pinnacle baselines.

**Acceptance Criteria:**

- [ ] Run sim baseline with P35 trace inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P25 mixed identity slice and pinnacle baseline metrics
- [ ] Do not modify gameplay behavior beyond parity fixes if audit finds drift

### US-004: Extend P35 Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P35 mixed/pinnacle habit-led traces.

**Acceptance Criteria:**

- [ ] Extend `tests/p34LifetimeParityTests.ts` or sibling isolated file for P35 mixed/pinnacle asserts
- [ ] Assert unlock outcomes and no static resolver on path where applicable
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-005: Write P35 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P35 proved and what remains for North Star §8.

**Acceptance Criteria:**

- [ ] Summarize mixed/pinnacle traces, baseline delta, and verification commands
- [ ] List remaining Wave 2–4 deferrals, renown optional lifetime, medical pool, poison mutex Monitor
- [ ] Cross-reference North Star §8 items still OPEN after P35
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- ≥1 mixed + ≥1 pinnacle habit-led lifetime trace (or dual-gate slice) documented with test asserts
- Baseline delta documents parity or justified delta vs P25 static mixed/pinnacle slices
- `typecheck` 与 P25/P34 定向测试保持通过

## 6. Dependencies / Context

- Parent: P34 closure `docs/test-reports/p34-closure-report.md`
- Wave 1 lifetime: `docs/test-reports/p34-medical-lifetime-birth-to-death-slice.md`, `src/p25/p34LifetimeBirthToDeathSlice.ts`
- P25 mixed/pinnacle: `docs/test-reports/p25-mixed-identity-slice.md`, `p25-pinnacle-baseline-metrics.md`, `p25-rare-window-waste-slice.json`
- Traceability: `src/p25/achievementTraceability.ts` (`P25_MIXED_ACHIEVEMENT_TRACEABILITY`, `P25_PINNACLE_ACHIEVEMENT_TRACEABILITY`)
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.2–3.3, §8

## 7. Open Questions

- Mixed trace 优先 `healer_swordsman` vs `merchant_martial_patron` — 默认 `healer_swordsman`（与 P34 medical habit 栈衔接）
- Pinnacle trace 优先 success path vs failure attribution slice — 默认至少 1 条 success path + 文档化 failure 归因
- Terminal checkpoint — 默认 fixed terminal age + composite eval（与 P34 slice 模式一致）
