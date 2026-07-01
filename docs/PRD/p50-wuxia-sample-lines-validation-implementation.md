# PRD: P50 Wuxia Sample Lines Validation Implementation

> **Derived from:** `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md` (Discovery pass 2026-06-26)
> **Stage slug:** `p50-wuxia-sample-lines-validation-implementation`
> **Gaps addressed:** GAP-P47-CONFIG-IMPL, GAP-P48-EXPRESSION-IMPL, GAP-RH-MATRIX, GAP-RH-CHECKPOINT, GAP-RH-DELTA, GAP-RH-CLI, GAP-HR-REPLAY-MD, GAP-HR-CROSS-LINE, GAP-PLAYTEST-ROUND, GAP-CLOSURE-REPORT, GAP-P46-OVERALL-CLOSURE, GAP-END08-SAMPLE-LINES

## 1. Introduction

P50 是 P46 最小可玩人生样本线路线的**验证实施阶段**。P47–P49 已完成剧情配置规格、玩家可读表达规格与验证 contract；本阶段将上游 backlog 与 P49 RH/HR 任务落地为可重复运行的 replay 报告、人工 playtest 证据与 closure 汇总，使三条 0–40 岁样本线（正派武道 / 邪路偏锋 / 商路崛起）达到 P49 validation contract 的 **Pass** 或带 residual 的 **Warning** 收口。

本阶段不扩新剧情主干、不做 runtime 平台化、不覆盖全量路线矩阵。

## 2. Goals

- 落地 P47 最小配置 backbone，使三线 benchmark seed（301/303/804）在 age 40 前不断链
- 落地 P48 O/D/M-E* 表达任务，使 checkpoint 与 playtest 可读（interim age-40 可 warning）
- 实现 P49 RH-1–RH-4：fixed-seed matrix、checkpoint 导出、cross-line delta、CLI 入口
- 产出 P49 HR-1/HR-2/HR-4 报告与 ≥1 轮 playtest round 存档
- 形成 `p49-sample-lines-closure-report.md`，判定 P46 三阶段是否达到整体 closure

## 3. Non-Goals

- 不继续扩大新的剧情主干或全量事件池
- 不做 runtime 平台化或大 UI 重构
- 不做全量路线矩阵验证
- 不把 gate PASS 直接等同于 P46 closure
- 不在本阶段扩成更高年龄段的全生命周期覆盖
- 不实现 Wave 1 新增成就（`jianghu_renown_sage` / `medical_sage_healer`）或 Wave 3/4 扩展

## 4. User Stories

### US-001: Implement Minimum P47 Config Backbone For Three Sample Lines
**Description:** As an implementer, I want the minimum P47 spine nodes and flags wired in JSON so benchmark seeds replay without spine breaks.

**Acceptance Criteria:**
- [ ] Task O-1/O-2/O-3, D-1/D-2/D-3, M-1/M-2/M-3 minimum nodes present per P47 PRD §13–§15
- [ ] Benchmark seeds 301/303/804 reach age 40 without critical spine gaps (±2 age tolerance per P49 §11–§13)
- [ ] `route_merchant` or documented interim merchant signals for seed 804
- [ ] Age-40 summary hooks configured or documented interim fallback per P49 §18.4

### US-002: Implement P48 Orthodox And Demonic Player-Facing Expression
**Description:** As a player, I want orthodox and demonic sample lines to show readable current goals, costs, and age-40 identity so replay and playtest can distinguish lines.

**Acceptance Criteria:**
- [ ] O-E1/O-E2/O-E3 implemented in existing summary / life-memory surfaces (no parallel UI)
- [ ] D-E1/D-E2/D-E3 implemented in existing surfaces
- [ ] No raw eventId / flag keys in player-visible checkpoint output for orthodox/demonic
- [ ] Surface changes covered by at least one focused test or gate slice

### US-003: Implement P48 Merchant Player-Facing Expression
**Description:** As a player, I want the merchant line to show readable business goals, debt/obligation costs, and age-40 identity so the third sample line is not expression-empty.

**Acceptance Criteria:**
- [ ] M-E1/M-E2/M-E3 implemented (currentGoal, debt/risk, age-40 summary or interim)
- [ ] Merchant key choices wired into life-memory key-choice surface per P48 audit §6.2
- [ ] `route_merchant` in long-term impact whitelist if flag writes exist
- [ ] Merchant checkpoint output distinguishable from orthodox/demonic at age 25+

### US-004: Build P49 Fixed-Seed Replay Matrix And Checkpoint Export
**Description:** As a maintainer, I want encoded benchmark parameters and deterministic checkpoint export so sample-line validation is repeatable.

**Acceptance Criteria:**
- [ ] `P49_SAMPLE_LINE_MATRIX` (or equivalent) with seeds 301/303/804 and checkpoint ages 13/18/25/32/40
- [ ] 0–40 simulation export includes eventId summary, route flags, life-memory entry per checkpoint
- [ ] Two consecutive runs on same seed produce identical checkpoint JSON
- [ ] Unit test asserts matrix length = 3 and seed values match P49 PRD §11–§13

### US-005: Generate Cross-Line Replay Latest Reports
**Description:** As a maintainer, I want cross-line delta reports so five comparison dimensions are judged automatically at checkpoints.

**Acceptance Criteria:**
- [ ] `docs/test-reports/p49-sample-lines-replay-latest.json` generated
- [ ] `docs/test-reports/p49-sample-lines-replay-latest.md` human-readable per line × checkpoint
- [ ] `docs/test-reports/p49-sample-lines-cross-line-comparison-latest.md` with distinct/partial/collapsed per P49 §14.2
- [ ] `scripts/runP49SampleLineReplay.ts` and `npm run p49:replay` (or documented equivalent) regenerate reports

### US-006: Execute Human Playtest Round And Archive Results
**Description:** As a maintainer, I want at least one completed playtest round archived so P49 closure has human evidence beyond automation.

**Acceptance Criteria:**
- [ ] ≥1 tester completes checklist for all three lines using seeds 301/303/804
- [ ] Results saved as `docs/test-reports/p49-sample-lines-playtest-round-1.md` (or `{N}`)
- [ ] P46 §10.2 five items recorded with pass/warning/fail per line
- [ ] Cross-line retell section (checklist §6) shows lines distinguishable within 30 seconds

### US-007: Produce P49 Closure Report And P46 Overall Verdict
**Description:** As a maintainer, I want a single closure page combining simulation and human evidence so the project can state whether minimum playable life samples are baseline-ready.

**Acceptance Criteria:**
- [ ] `docs/test-reports/p49-sample-lines-closure-report.md` references replay latest + playtest round + §18 residual table
- [ ] Verdict: Pass / Warning / Fail per P49 validation contract §3
- [ ] Blocking failures explicitly listed if any (spine break, ≥2 collapsed dimensions, no human round)
- [ ] P46 §11.3 overall closure status stated with residual warnings if applicable

## 5. Functional Requirements

1. FR-1: 三线 benchmark seed replay 必须可重复运行至 age 40（或文档化 early stop 原因）。
2. FR-2: cross-line 比较必须覆盖 P49 §14 五维并在 latest 报告中落盘。
3. FR-3: 人工 playtest 必须 ≥1 轮且三线均完成 checklist。
4. FR-4: closure 报告必须同时引用仿真与人工证据；gate PASS  alone 不足。
5. FR-5: 残余 warning 必须写入 closure 附录；不得 silent pass。

## 6. Success Criteria

- 三线主 seed replay 无断链（商路 interim 信号允许 warning）
- cross-line 比较 ≤1 维 partial、无 ≥2 维 collapsed
- 人工五项 ≥4/5 可读/可感（允许 1–2 warning 项）
- `p49-sample-lines-closure-report.md` 给出 P46 整体 closure 判定
- `gate:playability` 及既有 P25 报告不退化

## 7. Dependencies / Context

- Parent stage: `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md`
- Upstream specs: P47 PRD §10–§18, P48 PRD §10–§17, P46 §10–§11
- Validation contract: `docs/test-reports/p49-sample-lines-validation-contract.md`
- Human checklist: `docs/test-reports/p49-sample-lines-human-playtest-checklist.md`
- Discovery gaps: `agent_docs/p49-wuxia-sample-lines-validation-and-playtest-gaps.md`
- Finalize evidence: commit `ba487bb`

## 8. Open Questions

- 专用 `*_age40_identity_summary` 若本 stage 未全部配置，interim 总结是否足够 Warning 收口 — 依 P49 §18.4 默认允许
- Playtest 是否需 2 名测试者交叉验证 — 首版 ≥1 名；第二名降为 warning 跟踪项
