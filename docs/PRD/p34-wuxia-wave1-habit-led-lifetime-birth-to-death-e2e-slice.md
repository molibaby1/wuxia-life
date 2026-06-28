# PRD: P34 Wuxia Wave 1 Habit-Led Lifetime Birth-to-Death E2E Slice

> **Derived from:** `docs/PRD/p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice.md` (Discovery pass 2026-06-24, round 8/8)
> **Stage slug:** `p34-wuxia-wave1-habit-led-lifetime-birth-to-death-e2e-slice`
> **Gaps addressed:** GAP-P33-001, GAP-P33-003 (optional), GAP-END-08-01 (partial)

## 1. Introduction

P33 闭合了 Wave 1 medical **runtime short-chain**、poison mutex sim gate、habit-zero on-ramp **partial** slice（0→threshold only）、medical runtime baseline 100% aligned。Renown 与 medical 的 event-driven short-chain 均已证明 unlock without static resolver；但 **full birth→death lifetime sim** 仍缺失——P33 habit-zero slice 止于 bridge eligibility，未串联 age progression、终局 eval 与 death/end-state。

P34 在 **不扩 medical 池、不交付 Wave 2–4、不强制 mentor_bond / medical_imperial bridge、不一次性移除 legacy `*_habit` 读者** 的前提下，新增至少 **1 条** habit-led birth→death（或 near-birth→death）lifetime sim e2e slice、lifetime baseline delta、regression、closure。

## 2. Goals

- 新增至少 **1 条** habit-led birth→death lifetime sim e2e slice：habit-zero/near-zero 起点 → on-ramp → bridge events → composite eval → 终局/死亡节点，证明 Wave 1 主流成就 unlock 不经 static resolver seed
- 文档化 seed、age  progression、事件序列、unlock 与终局 outcome 于 `docs/test-reports/`
- 运行 lifetime sim baseline delta，记录 vs P33 short-chain / P31 static 的对齐或差异
- 扩展 isolated regression 覆盖 P34 birth→death slice 断言
- 产出 P34 closure 报告，列出 e2e 余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新增 medical / business / semi-personality 内容样本
- 不全量迁移 medical 池 stat/talent gate（3/18 保持）
- 不交付 Wave 2–4 成就配置或平凡出身扩展
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不修改已 `passes: true` 的 P33 story 或 parent PRD
- 不要求 renown **与** medical 双路径 full lifetime（skip-first：一条 proven 即可）
- 不强制 game-engine JSON poison mutex 全路径修复（P33 sim gate 已对齐；非 sim path 保持 Monitor 除非 audit 发现 low-risk fix）
- 不扩展混合/巅峰 habit-led trace（North Star §3.2–3.3 defer）

## 4. User Stories

### US-001: P34 Birth-to-Death Lifetime Sim E2E Slice

**Description:** As a maintainer, I want a habit-led birth→death lifetime sim slice proving event-driven Wave 1 mainstream unlock from near-zero habit through end-of-life eval.

**Acceptance Criteria:**

- [ ] Add lifetime slice under P25 test harness: habit-zero/near-zero seed → on-ramp → bridge chain → composite eval → terminal age/death checkpoint
- [ ] Slice documents seed, age steps, event sequence, unlock, and terminal outcome under `docs/test-reports/`
- [ ] Unlock `jianghu_renown_sage` or `medical_sage_healer` without static `resolveP31HabitLedKeyChoiceBridges` on fixtures
- [ ] Typecheck passes

### US-002: Optional Second Lifetime Path Or Skip Evidence

**Description:** As a maintainer, I want an optional second birth→death path or documented skip if one path proves the pattern.

**Acceptance Criteria:**

- [ ] If US-001 covers one achievement only, add second renown/medical lifetime slice **or** document skip with evidence under `docs/test-reports/`
- [ ] Skip acceptable if US-001 + US-004 already prove lifetime unlock pattern with lower risk
- [ ] Typecheck passes if implemented

### US-003: Run Lifetime Sim Baseline Delta

**Description:** As a maintainer, I want sim metrics comparing P34 birth→death inputs vs P33 short-chain and P31 static baselines.

**Acceptance Criteria:**

- [ ] Run sim baseline with P34 lifetime slice inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P33 short-chain and P31 static unlock rates
- [ ] Do not modify gameplay behavior beyond parity fixes if audit finds drift

### US-004: Extend P34 Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P34 birth→death lifetime slice.

**Acceptance Criteria:**

- [ ] Extend `tests/p33RuntimeParityTests.ts` or sibling isolated file for P34 lifetime asserts
- [ ] Assert birth→death unlock outcome and no static resolver on path
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-005: Write P34 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P34 proved and what remains for North Star §8.

**Acceptance Criteria:**

- [ ] Summarize lifetime slice, baseline delta, and verification commands
- [ ] List remaining mixed/pinnacle habit-led, game-engine poison mutex, medical pool, and Wave 2–4 deferrals
- [ ] Cross-reference North Star §8 items still OPEN after P34
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- ≥1 birth→death lifetime sim slice proves Wave 1 mainstream unlock without static resolver seed
- Lifetime baseline documents parity or justified delta vs P33 short-chain 100% unlock
- `typecheck` 与 P25/P33 定向测试保持通过

## 6. Dependencies / Context

- Parent: P33 closure `docs/test-reports/p33-closure-report.md`
- Short-chain: `docs/test-reports/p33-medical-short-chain-slice.md`, `p32-renown-short-chain-slice.md`
- Habit-zero on-ramp: `docs/test-reports/p33-habit-zero-on-ramp-slice.md`, `src/p25/p33HabitZeroOnRampSlice.ts`
- Runtime baseline: `docs/test-reports/p33-runtime-sim-baseline-delta.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1, §8
- Resolver: `src/p25/p31HabitLedKeyChoiceBridges.ts`, `src/p25/p32HabitLedShortChainSlice.ts`

## 7. Open Questions

- Lifetime slice 优先 renown 还是 medical — 默认 medical（P33 主题延续）；renown 可选 US-002
- Terminal checkpoint 用 fixed age vs death event — 默认 fixed terminal age + composite eval（与 P25 slice 模式一致）
- Game-engine JSON poison mutex — 保持 Monitor；US-001 使用 sim helper path
