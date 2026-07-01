# PRD: P37 Wuxia Additional Mixed/Pinnacle Habit-Led Lifetime Traces

> **Derived from:** `docs/PRD/p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation.md` (Discovery pass 2026-06-24, user selected Option B)
> **Stage slug:** `p37-wuxia-additional-mixed-pinnacle-lifetime-traces`
> **Gaps addressed:** GAP-END-08-01a, GAP-END-08-01b

## 1. Introduction

P35 已证明 mixed `healer_swordsman` 与 pinnacle `jianghu_myth_legend` 两条 habit-led lifetime sim trace（habit-zero on-ramp → JSON bridges → terminal eval，100% unlock，无 static resolver）。P36 §8 reconciliation 判定 **类别级 Met**，但 **additional outcomes** 仍 Open：`merchant_martial_patron`（商武混合）与 `founding_patriarch`（开派祖师类巅峰）尚无 habit-led lifetime 证明。

P37 在 **不修复 P8 playability、不交付 Wave 3 merchant_magnate 全量、不全量迁移 medical 池、不重写 scheduler** 的前提下，新增上述 **2 条** additional habit-led lifetime trace、baseline delta、回归测试、§8 item 1 更新对账与 closure。

## 2. Goals

- 新增 **1 条** mixed `merchant_martial_patron` habit-led lifetime trace：营生/武力双 habit on-ramp → 跨轨 bridge → terminal mixed eval，100% unlock，无 static resolver
- 新增 **1 条** pinnacle `founding_patriarch` habit-led lifetime trace：习惯/社交 on-ramp → alliance/门派 bridge → terminal pinnacle eval，100% unlock 或 documented dual-gate（choice + 可选 luck），无 static resolver
- 文档化 seed、age progression、事件序列、unlock 于 `docs/test-reports/`
- 运行 P37 sim baseline delta，对比 P25 static mixed/pinnacle baselines 与 P35 traces
- 扩展 isolated regression +（可选）P36 consistency audit 纳入 P37 trace flag 序列
- 产出 closure，更新 §8 item 1 从 Partial 向 **additional outcomes Met** 推进

## 3. Non-Goals

- 不修复 P8 playability frustration blockers（Option A 范围）
- 不交付 Wave 3 `merchant_magnate` 全量商路内容
- 不交付 Wave 4 平凡出身扩展
- 不全量迁移 medical 池
- 不重写 scheduler / dailyEvents
- 不修改已 `passes: true` 的 P26–P36 stories
- 不要求第三条 mixed 或第四条 pinnacle outcome

## 4. User Stories

### US-001: P37 Outcome Audit And Traceability Delta

**Description:** As a maintainer, I want an audit of `merchant_martial_patron` and `founding_patriarch` composite requirements vs existing P27–P29 habit bridges so P37 traces target minimal unlock gaps.

**Acceptance Criteria:**

- [ ] Inventory composite gates, key_choices, and habitLedOnRampEvents for both outcomes
- [ ] Map minimal event/bridge sequence for each lifetime trace
- [ ] Save audit under `docs/test-reports/` or `docs/designs/`
- [ ] No gameplay behavior changes in this story

### US-002: P37 Merchant Martial Patron Mixed Lifetime Trace

**Description:** As a maintainer, I want a mixed `merchant_martial_patron` habit-led lifetime sim trace proving business+martial cross-track unlock.

**Acceptance Criteria:**

- [ ] Add mixed lifetime trace under P25 test harness with `businessHabit` and/or `trainingHabit` on-ramp observability
- [ ] Target outcome `merchant_martial_patron` with cross-track bridge flags from JSON events (e.g. wealth route + martial reinforcement)
- [ ] Document seed, age steps, event sequence, unlock under `docs/test-reports/`
- [ ] Unlock without static `resolveP31HabitLedKeyChoiceBridges` on fixtures
- [ ] Typecheck passes

### US-003: P37 Founding Patriarch Pinnacle Lifetime Trace

**Description:** As a maintainer, I want a pinnacle `founding_patriarch` habit-led lifetime sim trace proving alliance/sect cross-track unlock on a habit-led path.

**Acceptance Criteria:**

- [ ] Add pinnacle lifetime trace under P25 test harness with habit/semi-personality on-ramp (e.g. `socialMomentum`, `trainingHabit`, or documented equivalent)
- [ ] Target outcome `founding_patriarch` with bridge to `p16_alliance_brokered` or documented equivalent key choice
- [ ] Document seed, age steps, luck/choice gates if any, unlock under `docs/test-reports/`
- [ ] Unlock without static resolver on fixtures; align with P35 pinnacle dual-gate semantics where luck applies
- [ ] Typecheck passes

### US-004: Run P37 Sim Baseline Delta And Regression

**Description:** As a maintainer, I want baseline metrics and isolated regression for P37 traces vs P25/P35 baselines.

**Acceptance Criteria:**

- [ ] Run sim baseline with P37 trace inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P25 static and P35 habit-led baselines for both outcomes
- [ ] Add or extend isolated test file (e.g. `tests/p37AdditionalMixedPinnacleParityTests.ts`) asserting unlock and no static resolver
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-005: Write P37 Closure And Section 8 Item 1 Update

**Description:** As a maintainer, I want a closure note updating §8 item 1 status after P37 additional traces.

**Acceptance Criteria:**

- [ ] Summarize both traces, baseline delta, verification commands
- [ ] Explicitly state §8 item 1 additional-outcomes status after P37 (Met vs remaining Partial)
- [ ] List remaining defer queue (P8, full pool audit, Wave 3/4)
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- 2/2 additional outcomes (`merchant_martial_patron`, `founding_patriarch`) have habit-led lifetime trace docs + test asserts
- Both traces report 100% unlock on success path without static resolver
- `typecheck` + P37 isolated tests + P34/P35 carry-forward tests pass

## 6. Dependencies / Context

- Parent: P36 reconciliation `docs/test-reports/p36-north-star-section8-reconciliation.md`
- P35 patterns: `src/p25/p35MixedPinnacleLifetimeSlices.ts`
- Traceability: `src/p25/achievementTraceability.ts` (`merchant_martial_patron`, `founding_patriarch`)
- P25 static: `src/p25/mixedIdentitySlice.ts`, `src/p25/rareWindowWasteSlice.ts`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.2–3.3, §8 item 1

## 7. Open Questions

- `merchant_martial_patron` 优先 `businessHabit` vs dual `businessHabit+trainingHabit` — 默认双 habit on-ramp（与 healer_swordsman 对称）
- `founding_patriarch` 是否需要 luck window — 默认 choice-first（`p16_alliance_brokered`），若 composite 需 luck 则文档化 dual-gate 对照
- Consistency audit 扩展 — 默认在 P37-004 或 closure 中记录是否纳入 P36 harness（非阻塞）
