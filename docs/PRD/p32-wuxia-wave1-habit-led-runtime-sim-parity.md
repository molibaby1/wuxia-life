# PRD: P32 Wuxia Wave 1 Habit-Led Runtime Sim Parity

> **Derived from:** `docs/PRD/p31-wuxia-wave1-habit-led-achievement-unlock-chain.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p32-wuxia-wave1-habit-led-runtime-sim-parity`
> **Gaps addressed:** GAP-P31-001, GAP-P31-002, GAP-P31-003 (partial), GAP-END-08-01 (partial)

## 1. Introduction

P31 闭合了 Wave 1 habit-led → composite destiny **unlock chain** on static validation slice：3 条 threshold-gated key-choice bridge、`resolveP31HabitLedKeyChoiceBridges`、full-unlock fixtures、sim baseline 100% unlock vs P30 0%。但 unlock 证明仍依赖 **静态 resolver + seeded bridge flags**，P31-006 short-chain sim **skipped**；JSON 事件 `flag_set` bridge 与 static resolver 的 **runtime parity** 仅 closure Monitor 项，无自动化门禁。

P32 在 **不新建 habit 轴、不扩 medical 池、不交付 Wave 2–4 成就、不强制 birth→death 全生命周期** 的前提下，闭合 Wave 1 habit-led unlock 的 **runtime sim parity**：bridge parity audit、JSON↔resolver 对齐测试、habit on-ramp → bridge → composite eval 短链 sim slice、runtime sim baseline delta、regression、closure。

## 2. Goals

- 盘点 P31 JSON bridge effects vs `resolveP31HabitLedKeyChoiceBridges` 并产出 runtime parity audit delta
- 添加 **automated parity/regression** 证明 JSON event bridge 与 static resolver 在 threshold + precondition 下输出一致
- 新增至少 **1 条** habit on-ramp → bridge → composite eval 短链 sim slice（renown 或 medical 路径），降低对 static fixture 单独依赖
- 运行 runtime sim baseline delta，记录 event-driven unlock 与 P31 static baseline 的对齐或差异
- 扩展 isolated regression 覆盖 P32 parity 与 short-chain sim 断言
- 产出 P32 closure 报告，列出 runtime/e2e 余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新增 medical / business / semi-personality 内容样本
- 不全量迁移 medical 池 stat/talent gate（3/18 保持）
- 不交付 Wave 2–4 成就配置或平凡出身扩展
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不一次性移除 legacy `*_habit` 读者
- 不修改已 `passes: true` 的 P31 story 或 parent PRD
- 不要求完整 lifetime sim birth→death（P32 优先 short-chain slice + parity）
- 不强制交付 `mentor_bond` / `medical_imperial` 额外 bridge（P31 audit 已 defer）

## 4. User Stories

### US-001: P32 Runtime Bridge Parity Audit Delta

**Description:** As a maintainer, I want an audit of P31 JSON bridge effects vs static resolver so P32 parity targets are explicit.

**Acceptance Criteria:**

- [ ] Inventory P31 bridge events in `p22-content-expansions.json` / `medical.json` vs `resolveP31HabitLedKeyChoiceBridges` conditions
- [ ] Classify parity risks (threshold drift, precondition mismatch, poison mutex) with event pointers
- [ ] Save under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: Add JSON↔Resolver Bridge Parity Tests

**Description:** As a maintainer, I want automated tests proving JSON event bridge outputs match the static resolver at habit thresholds.

**Acceptance Criteria:**

- [ ] Add targeted parity test(s) comparing event `flag_set` bridge results to `resolveP31HabitLedKeyChoiceBridges` for all 3 P31 bridges
- [ ] Tests cover above/below threshold and `medical_poison_path` mutex
- [ ] Typecheck passes
- [ ] Relevant P25 tests pass

### US-003: Add Habit-Led Short-Chain Sim Slice

**Description:** As a maintainer, I want a short-chain sim slice from habit on-ramp through bridge to composite eval to reduce reliance on static fixtures alone.

**Acceptance Criteria:**

- [ ] Add at least one short-chain sim slice under P25 test harness (habit threshold → bridge flag → key_choice → composite eval)
- [ ] Slice documents seed, event sequence, and unlock outcome under `docs/test-reports/` or test inline docs
- [ ] Prefer renown **or** medical path first; second path optional if first proves pattern
- [ ] Typecheck passes

### US-004: Run Runtime Sim Baseline Delta

**Description:** As a maintainer, I want sim metrics comparing runtime/event-driven unlock paths vs P31 static baseline.

**Acceptance Criteria:**

- [ ] Run sim baseline with P32 short-chain or event-driven inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P31 static baseline: runtime unlock rate and parity notes
- [ ] Do not modify gameplay behavior beyond parity fixes if audit finds drift

### US-005: Extend P32 Runtime Parity Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P32 parity and short-chain sim slices.

**Acceptance Criteria:**

- [ ] Extend `tests/p25LifetimeSimulationTests.ts` or sibling isolated file for P32 parity + short-chain asserts
- [ ] Assert parity alignment and short-chain unlock outcome
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-006: Optional Second Short-Chain Path Or E2E Extension

**Description:** As a maintainer, I want an optional second short-chain path or minimal e2e extension if the first slice pattern is proven.

**Acceptance Criteria:**

- [ ] If US-003 covers one path only, add second renown/medical short-chain slice **or** document skip with evidence
- [ ] Skip if US-003 + US-005 already prove both achievements at runtime with lower risk
- [ ] Typecheck passes if implemented

### US-007: Write P32 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P32 proved and what remains for full Wave 1 runtime/e2e and North Star §8.

**Acceptance Criteria:**

- [ ] Summarize parity tests, short-chain sim, baseline delta, and verification commands
- [ ] List remaining runtime/e2e gaps and deferred medical pool / Wave 2–4 items
- [ ] Cross-reference North Star §8 items still OPEN after P32
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- Automated parity tests cover all 3 P31 bridges with threshold + mutex cases
- ≥1 habit-led short-chain sim slice proves unlock without direct achievement flag seed
- Runtime sim baseline documents parity or justified delta vs P31 100% static unlock
- `typecheck` 与 P25 定向测试保持通过

## 6. Dependencies / Context

- Parent: P31 closure `docs/test-reports/p31-closure-report.md`
- Bridge audit: `docs/test-reports/p31-key-choice-bridge-audit-delta.md`
- Static baseline: `docs/test-reports/p31-habit-led-sim-baseline-delta.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1, §8
- Resolver: `src/p25/p31HabitLedKeyChoiceBridges.ts`, `src/p25/validationSlices.ts`

## 7. Open Questions

- Short-chain sim 应优先 renown 还是 medical 路径（audit 决定；优先已有 P31 bridge 事件序列）
- US-006 第二路径是否必要取决于 US-003 是否已覆盖双成就 runtime unlock；默认 skip-first
