# P3 Midlife Experience and Trust Hardening — Baseline Report (US-001)

生成时间：2026-05-30T16:59:00Z

Story：**US-001 Rebaseline P3 Warning Sources**

## 1. 摘要

本报告记录 P3 启动前的体验 warning 基线，来源为 `npm run gate:golden-line` 与 `npm run gate:experience`。两条 gate 均 **PASS**（exit 0），但存在 **7 条 P3 信任相关 warning**，另有 golden-line active-scope 质量汇总供后续 audit 参考。

| 信任类别 | Warning 数 | 主要来源 |
| --- | ---: | --- |
| death risk | 1 | experience gate |
| romance/family | 1 | experience gate |
| payoff | 4 | golden-line gate |
| route contradiction | 1 | golden-line gate |
| other | 0（gate warning） | — |

**P3 优先修复信号（按 PRD）：** 仿真 payoff 低于静态 map、neutral 样本路线互斥冲突、legacy 样本 100% 死亡率、无人达成 romance/family achievement。

## 2. 验证命令与 exit code

| Command | Exit code | Decision | 备注 |
| --- | ---: | --- | --- |
| `npm run gate:golden-line` | 0 | PASS | active blockers: 0；continuity warnings: 5 |
| `npm run gate:experience` | 0 | PASS | warningsFailed: true（非阻断） |
| `npm run typecheck` | 0 | PASS | `tsc --noEmit` |

### 2.1 `npm run gate:golden-line` 输出摘要

```text
=== Golden Line Gate (PXG4) ===
Decision: PASS
Active-scope blockers: 0
Feedback issues: 0
Report: docs/test-reports/product-experience-governance-golden-line-gates.md
```

Active scope 汇总（来自 gate 报告，非 P3 四类 trust warning，记入 §6）：

- total quality issues: 81
- deferred warnings (major+): 20
- candidate warnings (major+): 5

Deterministic 0–30 样本：

| Sample | Route track | Final age | Choices |
| --- | --- | ---: | ---: |
| golden-sect | sect | 30 | 13 |
| golden-wanderer | wanderer | 30 | 13 |
| golden-demonic | demonic | 30 | 11 |
| golden-neutral-baseline | neutral | 30 | 14 |

### 2.2 `npm run gate:experience` 输出摘要

```text
=== Experience Health Gate ===
Decision: PASS
Warnings failed (non-blocking): true
JSON: public/reports/experience-health-1780160304030.json

=== Golden Line Sub-Gate (0–30) ===
Decision: PASS
Active-scope blockers: 0
Feedback issues: 0
```

Legacy P2 样本（6 个，`runUntilDeath=true`，`years=85`）：

| Sample | Seed | Route track |
| --- | ---: | --- |
| martial-riser | 11 | — |
| merchant-weaver | 37 | — |
| bond-keeper | 73 | — |
| official-track | 201 | official |
| beggars-track | 202 | beggars |
| demonic-track | 203 | demonic |

## 3. Warning 分类明细

### 3.1 Death risk（1）

| Gate | Metric | Status | Actual | Threshold | Detail |
| --- | --- | --- | --- | --- | --- |
| experience | `death_rate` | warning FAIL | 1.0000 | min=0.15, max=0.9 | 6/6 legacy 样本在仿真结束时 `isAlive=false`（均跑至死亡，`years=85`） |

**Per-sample 观察**（`npm run simulate:gameplay:samples`，2026-05-30）：

| Sample | Death summary | Final state |
| --- | --- | --- |
| martial-riser | 有成有憾 | died |
| merchant-weaver | 壮志未酬 | died |
| bond-keeper | 壮志未酬 | died |
| official-track | 有成有憾 | died |
| beggars-track | 有成有憾 | died |
| demonic-track | 有成有憾 | died |

### 3.2 Romance / family（1）

| Gate | Metric | Status | Actual | Threshold | Detail |
| --- | --- | --- | --- | --- | --- |
| experience | `romance_family_achievement_rate` | info WARNING | 0.0000 | min=0.05, max=0.7 | 0/6 样本有 spouse 或 children > 0 |

**Per-sample 观察**：6/6 样本 `children=0`，无 spouse；均有 `lover_mingyue:48` notable relation，但不计入 achievement 指标。

### 3.3 Payoff（4）

静态 `golden-line-payoff-map.json` 覆盖率 **100%**；仿真 payoff 阈值 **70%**。以下均为 golden-line continuity **warning**（非 blocker）：

| Sample | Sim payoff | Hits | Static map | Detail |
| --- | ---: | --- | ---: | --- |
| golden-sect | 50.0% | 1/2 | 100.0% | Simulation key-choice payoff rate below 70% |
| golden-wanderer | 33.3% | 1/3 | 100.0% | Simulation key-choice payoff rate below 70% |
| golden-demonic | 50.0% | 1/2 | 100.0% | Simulation key-choice payoff rate below 70% |
| golden-neutral-baseline | 25.0% | 1/4 | 100.0% | Simulation key-choice payoff rate below 70% |

**模式：** 静态 map 全绿，四条 priority/neutral deterministic 0–30 样本的**仿真** payoff 均低于 70%。

### 3.4 Route contradiction（1）

| Sample | Gate | Severity | Detail |
| --- | --- | --- | --- |
| golden-neutral-baseline | continuity | warning | Route contradiction: **sect** and **demonic** both active (`strong_exclusion`) |

路线专项样本（golden-sect / golden-wanderer / golden-demonic）未触发 contradiction blocker。

### 3.5 Other（0 gate warning；上下文观察）

以下为基线观察，**当前 gate 未记为 warning**，供 US-015 / US-002 参考：

| 观察 | 来源 | 说明 |
| --- | --- | --- |
| Active-scope 质量 issue 汇总 | golden-line gate | 81 total；deferred major+ 20；candidate major+ 5；active blockers 0 |
| Legacy 样本路线并存 | gameplay simulation | `official-track` 终态 lifecycle：`demonic:active`, `official:completed`, `sect:active`；experience gate 未报 contradiction |
| Experience warning 指标均 pass | experience gate | `auto_event_rate`, `route_completion_rate`, `formal_event_ratio` 等 warning 级指标均 PASS |

## 4. 分类汇总表

| ID | Category | Gate | Sample / Scope | Signal |
| ---: | --- | --- | --- | --- |
| W1 | death risk | experience | all 6 legacy samples | `death_rate=1.0` > max 0.9 |
| W2 | romance/family | experience | all 6 legacy samples | `romance_family_achievement_rate=0` < min 0.05 |
| W3 | payoff | golden-line | golden-sect | sim payoff 50% (1/2) |
| W4 | payoff | golden-line | golden-wanderer | sim payoff 33.3% (1/3) |
| W5 | payoff | golden-line | golden-demonic | sim payoff 50% (1/2) |
| W6 | payoff | golden-line | golden-neutral-baseline | sim payoff 25% (1/4) |
| W7 | route contradiction | golden-line | golden-neutral-baseline | sect + demonic strong_exclusion |

## 5. 机器可读产物

| Artifact | Purpose |
| --- | --- |
| `docs/test-reports/product-experience-governance-golden-line-gates.md` | Golden-line gate 详细 findings |
| `public/reports/experience-health-1780160304030.json` | Experience gate 指标 JSON |
| `public/reports/gameplay-simulation-samples-1780160340531.json` | Legacy 6 样本 per-sample 摘要 |

## 6. 再生命令

```bash
npm run gate:golden-line
npm run gate:experience
npm run typecheck
```

Verbose golden-line findings（含 sample id）：

```bash
./node_modules/.bin/tsx scripts/runGoldenLineGate.ts
```

## 7. US-001 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Run `npm run gate:golden-line` and record all warnings | done — §2.1, §3.3–3.4 |
| Run `npm run gate:experience` and record all warning failures | done — §2.2, §3.1–3.2 |
| Classify warnings by trust category | done — §3–§4 |
| Produce P3 baseline report | done — 本文档 |
| Do not modify business code | done — 仅新增报告 |
| Typecheck passes | done — exit 0 |

## 8. 后续 story 入口

| Story | 与本基线的关系 |
| --- | --- |
| US-002 Define P3 Trust Targets | 以 W1–W7 为输入，定义 blocker vs non-blocking 阈值 |
| US-003 Audit Death Sources | 追溯 W1 六样本死亡链 |
| US-007 Audit Romance/Family | 追溯 W2 为何 lover 关系不计 achievement |
| US-011 Audit Payoff Gaps | 对比 W3–W6 静态 map vs 仿真 |
| US-015 Audit Route Contradictions | 追溯 W7 与 legacy official-track 观察 |

---

*P3-W0 / US-001 — 2026-05-30*
