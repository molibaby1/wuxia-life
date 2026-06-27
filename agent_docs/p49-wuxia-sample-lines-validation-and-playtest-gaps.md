# P49 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-26  
**Mode:** post-run (`--pipeline-auto`)  
**Branch:** `codex/p49-wuxia-sample-lines-validation-and-playtest`  
**Finalize commit:** `ba487bb`  
**Parent PRD:** `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 9/9 `passes: true`（P49-001 … P49-009） |
| **Verify** | `agent_docs/p49-wuxia-sample-lines-validation-and-playtest-verify-result.md` — PASS（Round 2） |
| **Finalize** | commit `ba487bb` — FIX-001 … FIX-009 已应用 |

### Evidence (2026-06-26 discovery)

| Check | Result |
| --- | --- |
| Validation contract | `docs/test-reports/p49-sample-lines-validation-contract.md` — **present** |
| Human playtest checklist | `docs/test-reports/p49-sample-lines-human-playtest-checklist.md` — **present** |
| PRD §10 Validation contract summary | **present** |
| PRD §11–§13 Fixed-seed replay spec ×3 | **present**（seed 301 / 303 / 804） |
| PRD §14 Cross-line comparison dimensions | **present** |
| PRD §15 Human playtest checklist summary | **present** |
| PRD §16 Replay harness task split（RH-1–RH-4） | **present** |
| PRD §17 Human-facing report task split（HR-1–HR-4） | **present** |
| PRD §18 Closure evidence + doc vs impl split | **present** |
| P49 §18.1 文档阶段收口七类证据 | **齐备** |
| US-001 … US-009 acceptance criteria | All `[x]` in PRD markdown（ba487bb） |
| Replay harness code | **缺失** — 无 `src/p49/`、`scripts/runP49SampleLineReplay.ts`、`npm run p49:replay` |
| Replay latest reports | **缺失** — 无 `p49-sample-lines-replay-latest.*` |
| Cross-line comparison latest | **缺失** — 无 `p49-sample-lines-cross-line-comparison-latest.md` |
| Playtest round archive | **缺失** — 无 `p49-sample-lines-playtest-round-*.md` |
| Closure report | **缺失** — 无 `p49-sample-lines-closure-report.md` |

P49 **文档阶段** Goals 全部达成：validation contract、三线 fixed-seed replay 规格、五维 cross-line 对比规则、人工 playtest checklist、harness/report 任务拆分、closure 与阻塞规则均已落盘。本 stage **不交付 replay 脚本或 playtest 执行**；§18.6 将「文档收口」与「验证实施收口」明确分离。

---

## Product End-State mapping

### §3 成就谱系（快照）

| Area | Status | Notes |
| --- | --- | --- |
| Wave 1 P16 三条 | **Met** | 可追溯；非 P46 样本线焦点 |
| Wave 1 新增两条 | **Partial** | `jianghu_renown_sage` / `medical_sage_healer` 待实现 |
| Wave 2 巅峰 | **Partial** | P35 pinnacle traces |
| Wave 3/4 混合/平凡 | **Defer** | North Star §3.3/§3.4 intentional defer |

### §6 重玩动机（快照）

| Proxy | Status | Notes |
| --- | --- | --- |
| P45 bounded replay matrix | **Met** | 机制塑形可区分 persona |
| 三条 0–40 最小可玩人生样本 | **Open** | P47/P48/P49 **规格齐备**；配置/表达/replay/playtest **未 runtime 闭合** |
| 玩家可复述人生线 | **Open** | 需 P48 表达实施 + P49 验证实施 + ≥1 轮 playtest |

### §8 Discovery 完成判定

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 主流/混合/巅峰可玩样本 | **Partial** | Wave 1 成就链有 trace；**P46 三条样本线未通过 P49 replay + playtest closure** |
| 2 — 平凡出身 ≥3 可区分 | **Partial** | `p25-ordinary-origin-slice` 有证据；非 P46–P49 焦点 |
| 3 — 选择后果零自相矛盾 | **Partial** | P39 8-path slice Met；全池 defer |
| 4 — 巅峰运气+选择门禁 | **Partial** | P35 pinnacle dual-gate |
| 5 — 门禁不退化 | **Met** | P38/P40 playability gate PASS（P49 未改 runtime） |

**end_state_status:** **OPEN** — North Star §8 checklist 五项未全 Met；P49 闭合的是**验证规格文档**，非 Product End-State 全量 GO，亦非 P46 三阶段整体 closure。

---

## Gap inventory

| Gap ID | Description | Route | Priority | Target stage |
| --- | --- | --- | --- | --- |
| GAP-P47-CONFIG-IMPL | P47 Task O/D/M 系列（童年种子、route flag、age-40 summary hook 等）JSON 配置未 fully 落地 | **next-stage** | P0 | **P50** |
| GAP-P48-EXPRESSION-IMPL | O/D/M-E* 九任务（currentGoal、consequence、DEBT/RISK、age-40 落点）未写入 player-facing / life-memory 面 | **next-stage** | P0 | **P50** |
| GAP-RH-MATRIX | RH-1：`P49_SAMPLE_LINE_MATRIX` 常量模块缺失 | **next-stage** | P0 | **P50** |
| GAP-RH-CHECKPOINT | RH-2：0–40 checkpoint 仿真导出未实现 | **next-stage** | P0 | **P50** |
| GAP-RH-DELTA | RH-3：cross-line delta 报告（`p49-sample-lines-replay-latest.*`）未产出 | **next-stage** | P0 | **P50** |
| GAP-RH-CLI | RH-4：`runP49SampleLineReplay.ts` / `npm run p49:replay` 缺失 | **next-stage** | P1 | **P50** |
| GAP-HR-REPLAY-MD | HR-1：人类可读 replay latest 摘要未产出 | **next-stage** | P0 | **P50** |
| GAP-HR-CROSS-LINE | HR-2：五维 cross-line 比较 latest 报告未产出 | **next-stage** | P0 | **P50** |
| GAP-PLAYTEST-ROUND | ≥1 轮人工 playtest checklist 完成记录缺失 | **next-stage** | P0 | **P50** |
| GAP-CLOSURE-REPORT | HR-4：`p49-sample-lines-closure-report.md` 未产出 | **next-stage** | P0 | **P50** |
| GAP-P46-OVERALL-CLOSURE | P46 三阶段整体 closure 未达成（依赖 P47 实施 + P48 表达 + P49 验证实施） | **next-stage** | P0 | **P50** |
| GAP-END08-SAMPLE-LINES | §8 item 1 子集：三条样本线需配置 + 表达 + replay + playtest 全链闭合 | **next-stage** | P0 | **P50** |
| GAP-MERCHANT-KEY-CHOICE | 商路关键节点未进 `ALL_KEY_CHOICE_EVENT_IDS`（P48 audit §6.2） | **next-stage** | P0 | **P50**（M-E1/M-E2） |
| GAP-AGE40-SUMMARY-ALL | 三线专用 `*_age40_identity_summary` runtime 缺失 | **next-stage** | P0 | **P50**（interim 可 warning） |
| GAP-WAVE1-NEW-ACH | `jianghu_renown_sage` / `medical_sage_healer` 待实现 | **defer** | Low | 非 P46–P49 范围 |
| GAP-WAVE3-4 | Wave 3 混合 / Wave 4 平凡扩展 | **defer** | Low | North Star §3.3/§3.4 |
| GAP-FULL-POOL-AUDIT | 全内容池 consequence audit | **defer** | Low | P39 partial |

### P49 验证实施 backlog（规格已定义 §16–§17，runtime 待补）

| Task | 状态 | 阻塞 P49 实施收口？ |
| --- | --- | --- |
| RH-1 Fixed-seed matrix | 未实施 | **是** |
| RH-2 Checkpoint 输出 | 未实施 | **是** |
| RH-3 Cross-line delta | 未实施 | **是** |
| RH-4 CLI 入口 | 未实施 | 否（可合并 RH-3） |
| HR-1 Replay latest MD | 未实施 | **是** |
| HR-2 Cross-line comparison | 未实施 | **是** |
| HR-3 Playtest round template | 未实施 | 否（checklist 已存在） |
| HR-4 Closure 汇总页 | 未实施 | **是** |

依据 P49 §18.6：contract + §10–§18 + checklist 齐备 → **P49 文档收口** ✓；RH/HR + playtest → **P49 验证实施收口** → 方可 P46 整体 closure。

### 上游实施 backlog（P49 closure 前置）

| Backlog | 来源 | P49 主 seed 影响 |
| --- | --- | --- |
| P47 Task O/D/M JSON | P47 §13–§17 | 断链 → replay **fail** |
| P48 O/D/M-E* 表达 | P48 §10–§12 | 可读性 → cross-line / playtest |
| 商路 `route_merchant` + key choice | P47 M-1 + P48 M-E1 | 商路 804 可 **warning** 不单独 fail |

---

## In-stage delta

**None.** P49 九 story 均已 `passes: true`；verify PASS；不得回改已关闭 story。

---

## Next-stage PRD（Discovery spawn）

P49 为 P46 路线图 queue **末阶段（index 3）**；文档 stage 已 CLEAR，`end_state_status: OPEN` → **必须 spawn** 验证实施 stage。

| Order | stage_slug | prd_md | prd_json | Queue |
| --- | --- | --- | --- | --- |
| 4（新） | `p50-wuxia-sample-lines-validation-implementation` | `docs/PRD/p50-wuxia-sample-lines-validation-implementation.md` | `docs/PRD/p50-wuxia-sample-lines-validation-implementation.prd.json` | **spawned** |

**Discovery 动作：** spawn P50；Orchestrator **insert at queue index 4** 并 advance。

**P50 输入（来自 P49）：**

1. `docs/test-reports/p49-sample-lines-validation-contract.md` — pass/warning/fail 口径
2. P49 PRD §11–§13 — benchmark seed 301/303/804 + checkpoint 期望
3. P49 PRD §14 — 五维 cross-line 判定
4. `docs/test-reports/p49-sample-lines-human-playtest-checklist.md` — 人工证据表
5. P49 PRD §16–§17 — RH/HR 任务拆分
6. P48 surface audit + P47 gap audit — 上游配置/表达 backlog 优先级

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **in-stage** | 0 | P49 文档 stage closed |
| **next-stage** | 14 | Spawn **P50**（验证实施 + 上游 backlog 收口） |
| **defer** | 3 | Wave 1 new achievements, Wave 3/4, full pool |
