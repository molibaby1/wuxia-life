# PRD: P33 Wuxia Wave 1 Medical Runtime Short-Chain and E2E Slice

> **Derived from:** `docs/PRD/p32-wuxia-wave1-habit-led-runtime-sim-parity.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice`
> **Gaps addressed:** GAP-P32-001, GAP-P32-002, GAP-P32-003 (partial), GAP-P32-004, GAP-END-08-01 (partial)

## 1. Introduction

P32 闭合了 Wave 1 habit-led **runtime sim parity** on renown path：JSON↔resolver 自动化 parity tests、renown event-driven short-chain sim（100% unlock vs P31 static）、runtime baseline aligned。Medical 路径仍 **parity-only**（P32-006 skip）；`medical_poison_path` JSON mutex drift 为 Monitor（P32-RISK-003）；habit zero birth→death lifetime sim 仍缺失。

P33 在 **不扩 medical 池、不交付 Wave 2–4、不强制 mentor_bond / medical_imperial bridge、不要求完整 birth→death 全生命周期** 的前提下，闭合 medical two-event runtime short-chain、处理或门禁 poison mutex drift、新增 habit-zero on-ramp 最小 e2e slice、medical runtime baseline delta、regression、closure。

## 2. Goals

- 新增 medical two-event runtime short-chain sim slice（`p27_study_habit_healer_reinforcement` → `p29_study_habit_case_record_duty` → composite eval），证明 `medical_sage_healer` event-driven unlock
- 处理 `medical_poison_path` JSON↔resolver mutex drift：修复 JSON effects **或** 添加 parity gate + 文档化 accepted drift
- 新增至少 **1 条** habit-zero on-ramp 最小 e2e slice（从初始 habit 状态到 threshold，非 full birth→death）
- 运行 medical runtime sim baseline delta，记录 vs P31/P32 static/renown baseline 的对齐或差异
- 扩展 isolated regression 覆盖 P33 medical short-chain + habit-zero slice 断言
- 产出 P33 closure 报告，列出 e2e 余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新增 medical / business / semi-personality 内容样本（沿用 P27/P29 事件）
- 不全量迁移 medical 池 stat/talent gate（3/18 保持）
- 不交付 Wave 2–4 成就配置或平凡出身扩展
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不一次性移除 legacy `*_habit` 读者
- 不修改已 `passes: true` 的 P32 story 或 parent PRD
- 不要求完整 lifetime sim birth→death（P33 优先 medical short-chain + habit-zero minimal slice）
- 不强制交付 `mentor_bond` / `medical_imperial` 额外 bridge（P31/P32 defer）

## 4. User Stories

### US-001: P33 Medical Runtime Short-Chain Sim Slice

**Description:** As a maintainer, I want a medical two-event runtime short-chain sim slice proving event-driven `medical_sage_healer` unlock.

**Acceptance Criteria:**

- [ ] Add medical short-chain under P25 test harness: `studyHabit` threshold → p27 positive → p29 positive → composite eval
- [ ] Slice documents seed, event sequence, and unlock outcome under `docs/test-reports/`
- [ ] Unlock `medical_sage_healer` without static `resolveP31HabitLedKeyChoiceBridges` on fixtures
- [ ] Typecheck passes

### US-002: Resolve Or Gate Poison Mutex Drift

**Description:** As a maintainer, I want `medical_poison_path` mutex handled so runtime parity is explicit and gated.

**Acceptance Criteria:**

- [ ] Audit P32-RISK-003: JSON choice effects vs resolver poison mutex for all 3 bridges
- [ ] Either align JSON effects with resolver mutex **or** add automated gate documenting accepted drift with test asserts
- [ ] Update parity audit delta under `docs/test-reports/`
- [ ] Typecheck passes

### US-003: Add Habit-Zero On-Ramp Minimal E2E Slice

**Description:** As a maintainer, I want a minimal habit-zero on-ramp slice reducing reliance on seeded thresholds alone.

**Acceptance Criteria:**

- [ ] Add at least one slice starting from habit-zero (or near-zero) state through on-ramp events to bridge threshold
- [ ] Document seed, on-ramp sequence, and threshold outcome under `docs/test-reports/`
- [ ] Does not require full birth→death; partial slice acceptable
- [ ] Typecheck passes

### US-004: Run Medical Runtime Sim Baseline Delta

**Description:** As a maintainer, I want sim metrics comparing medical runtime short-chain vs P31/P32 baselines.

**Acceptance Criteria:**

- [ ] Run sim baseline with P33 medical short-chain inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P31 static and P32 renown runtime baseline
- [ ] Do not modify gameplay behavior beyond parity/mutex fixes if audit finds drift

### US-005: Extend P33 Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P33 medical short-chain and habit-zero slice.

**Acceptance Criteria:**

- [ ] Extend `tests/p32RuntimeParityTests.ts` or sibling isolated file for P33 asserts
- [ ] Assert medical short-chain unlock and habit-zero on-ramp outcome
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-006: Write P33 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P33 proved and what remains for full e2e and North Star §8.

**Acceptance Criteria:**

- [ ] Summarize medical short-chain, mutex handling, habit-zero slice, baseline delta, and verification commands
- [ ] List remaining birth→death e2e gaps and deferred Wave 2–4 / medical pool items
- [ ] Cross-reference North Star §8 items still OPEN after P33
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- Medical runtime short-chain proves `medical_sage_healer` unlock without static resolver seed
- Poison mutex drift resolved or explicitly gated with automated asserts
- ≥1 habit-zero on-ramp slice documents path from near-zero to bridge threshold
- Medical runtime baseline documents parity or justified delta vs P31 100% static unlock
- `typecheck` 与 P25/P32 定向测试保持通过

## 6. Dependencies / Context

- Parent: P32 closure `docs/test-reports/p32-closure-report.md`
- Parity audit: `docs/test-reports/p32-runtime-bridge-parity-audit-delta.md`
- Renown short-chain: `docs/test-reports/p32-renown-short-chain-slice.md`, `src/p25/p32HabitLedShortChainSlice.ts`
- Runtime baseline: `docs/test-reports/p32-runtime-sim-baseline-delta.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1, §8
- Resolver: `src/p25/p31HabitLedKeyChoiceBridges.ts`, `src/p25/p32BridgeParity.ts`

## 7. Open Questions

- Poison mutex: fix JSON effects vs document accepted drift — audit US-002 决定；默认 fix-if-low-risk else gate
- Habit-zero slice 优先 renown 还是 medical on-ramp — 默认 medical（P33 主题）；renown 可选若 medical 已覆盖 pattern
- Full birth→death e2e — 超出 P33 scope；closure 路由至后续 stage
