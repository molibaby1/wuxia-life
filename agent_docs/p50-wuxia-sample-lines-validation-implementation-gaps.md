# P50 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-26  
**Mode:** post-run (`--pipeline-auto`, queue terminus)  
**Branch:** `codex/p50-wuxia-sample-lines-validation-implementation`  
**Finalize commit:** _(pending finalize)_  
**Parent PRD:** `docs/PRD/p50-wuxia-sample-lines-validation-implementation.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 7/7 `passes: true`（P50-001 … P50-007） |
| **Verify** | `agent_docs/p50-wuxia-sample-lines-validation-implementation-verify-result.md` — **PASS** |
| **P49 closure** | `docs/test-reports/p49-sample-lines-closure-report.md` — **Warning** (baseline-ready) |
| **P46 §11.3** | **Warning — baseline-ready with residual** |

### Evidence (2026-06-26 discovery)

| Check | Result |
| --- | --- |
| P47 config backbone | `src/data/lines/sample-lines-spine.json` + O/D/M patches — **present** |
| P48 O/D/M expression | `src/p50/sampleLineExpression.ts` → life-memory + main-screen — **present** |
| P49 replay matrix | `src/p49/sampleLineReplay.ts` `P49_SAMPLE_LINE_MATRIX` 301/303/804 — **present** |
| Checkpoint export | ages 13/18/25/32/40 deterministic — **pass** (`p49SampleLineReplayTests`) |
| Replay latest reports | `p49-sample-lines-replay-latest.*` + cross-line comparison — **present** |
| CLI | `npm run p49:replay` — **present** |
| Playtest round 1 | `p49-sample-lines-playtest-round-1.md` — **present** |
| Closure report | `p49-sample-lines-closure-report.md` — **Warning** |
| Spine tests | seeds 301/303/804 → age ≥38 — **pass** (`p50SampleLineSpineTests`) |
| Expression tests | O/D/M player-visible text — **pass** (`p50SampleLineExpressionTests`) |
| `gate:playability` | `p8-playability-gate-latest.md` — **PASS** (no regression) |

P50 **验证实施 stage** Goals 全部达成：P47 最小配置、P48 表达接线、P49 replay/playtest/closure 证据链闭合。Overall P49 verdict **Warning**（PRD 允许的 residual 收口），非 blocking。

---

## Product End-State mapping

### §3 成就谱系（快照）

| Area | Status | Notes |
| --- | --- | --- |
| Wave 1 P16 三条 | **Met** | P30–P34 traces（非 P46 焦点） |
| Wave 1 新增两条 | **Defer** | 非 P46–P50 范围 |
| Wave 2 巅峰 | **Met** | P35 pinnacle traces |
| Wave 3/4 混合/平凡 | **Defer** | North Star §3.3/§3.4 intentional defer |
| P46 三条 0–40 样本线 | **Partial** | Warning baseline-ready；商路触发 / age-40 event 有 residual |

### §6 重玩动机（快照）

| Proxy | Status | Notes |
| --- | --- | --- |
| P45 bounded replay matrix | **Met** | 机制塑形可区分 persona |
| 三条 0–40 最小可玩人生样本 | **Partial** | 仿真 + 人工证据齐备；Warning residual |
| 玩家可复述人生线 | **Partial** | playtest Round 1 pass/warning；商路 1–3 项 warning |

### §8 Discovery 完成判定

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 主流/混合/巅峰可玩样本 | **Met** (core) / **Partial** (P46 subset) | P34/P35/P37 lifetime traces **Met**（P39 reconciliation）；P46 三线 **Warning baseline** |
| 2 — 平凡出身 ≥3 可区分 | **Met** | `p25-ordinary-origin-slice`（unchanged） |
| 3 — 选择后果零自相矛盾 | **Met** (bounded) | P39 13-path audit `highSeverity=0` |
| 4 — 巅峰运气+选择门禁 | **Met** | P35 pinnacle dual-gate |
| 5 — 门禁不退化 | **Met** | P38/P40 + P50 无 regression；P8 **PASS** |

**end_state_status:** **OPEN** — North Star §8 **core checklist Met**（P39）；P46 样本线子集 **Warning residual**（RW-01/RW-02）阻止 Product End-State 全量 **CLEAR** 与 P49 **Pass** 升级。保守口径：pipeline 不得以 COMPLETED 宣称样本线零 residual。

---

## Gap inventory

| Gap ID | Description | Route | Priority | Target |
| --- | --- | --- | --- | --- |
| GAP-P50-MERCHANT-TRIGGER | 商路 804 `merchant_first_shop` 触发不稳定；age 25+ 仍「尚未开张」 | **next-stage** | P0 | **P51**（proposed） |
| GAP-P50-AGE40-IDENTITY | 三线 `*_age40_identity_done` replay 未全触发；interim currentGoal 已覆盖 | **next-stage** | P1 | **P51** |
| GAP-P50-CROSSLINE-COST | age 13 代价维 1× collapsed（三线均「商路债务」） | **next-stage** | P1 | **P51**（merchant trigger 修复后复验） |
| GAP-P50-PLAYTEST-CROSS | 第二名 playtest 交叉验证缺失 | **defer** | Low | P49 §18.4 RW-04 |
| GAP-P50-ORTHODOX-MERCHANT-SIGNAL | 正派 301 并行 `route_merchant` 信号 | **defer** | Low | RW-03 非阻塞 |
| GAP-WAVE1-NEW-ACH | `jianghu_renown_sage` / `medical_sage_healer` | **defer** | Low | 非 P46–P50 范围 |
| GAP-WAVE3-4 | Wave 3 混合 / Wave 4 平凡扩展 | **defer** | Low | North Star §3.3/§3.4 |
| GAP-FULL-POOL-EXHAUST | 组合穷举 audit | **defer** | Low | P39 defer queue |

### P50 residual warnings（closure §18.4）

| ID | Area | Severity | Verifiable fix? |
| --- | --- | --- | --- |
| RW-01 | `merchant_first_shop` 不稳定 | warning | **Yes** — seed 804 age 18–25 稳定触发 |
| RW-02 | age-40 identity events 未全触发 | warning | **Yes** — replay 中 `*_age40_identity_done` |
| RW-03 | 301 并行 `route_merchant` | warning | No（cross-line 仍 distinct） |
| RW-04 | 第二名 playtest | warning | Optional |

---

## In-stage delta

**None.** P50 七 story 均已 `passes: true`；verify PASS；不得回改已关闭 story。

---

## Next-stage PRD（Discovery spawn recommendation）

P50 为 P46 路线图 queue **末阶段（index 4）**。Stage CLEAR，`end_state_status: OPEN`（样本线 Warning residual）→ **建议 spawn P51**（窄 scope tuning，非新剧情主干）。

| Order | stage_slug (proposed) | Scope | Queue |
| --- | --- | --- | --- |
| 5（新） | `p51-wuxia-sample-lines-merchant-trigger-and-gate-wiring` | RW-01/RW-02 + cross-line cost 复验 | **spawn recommended** |

**P51 可验收目标（verifiable）：**

1. Seed 804 replay：age 18–25 稳定触发 `merchant_first_shop` 链；age 25+ currentGoal 反映开店/经营态
2. 三线 age 40：`orthodox/demonic/merchant_age40_identity_done` 在 benchmark replay 中触发或文档化 deterministic 条件
3. Cross-line comparison：age 13 代价维 collapsed → partial/distinct；overall P49 verdict 可由 Warning → Pass
4. `gate:playability` + P50 regression tests 不退化

**Defer 替代：** 若 operator 接受 Warning baseline，可不 spawn P51；residual 由 `p49-sample-lines-closure-report.md` §6 跟踪。Pipeline 仍以 **OPEN** end-state 收口，**不得 COMPLETED**。

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **in-stage** | 0 | P50 closed |
| **next-stage** | 3 | Spawn **P51**（merchant trigger + age-40 wiring + cross-line re-verify） |
| **defer** | 5 | Playtest cross, orthodox merchant signal, Wave 1 new ach, Wave 3/4, pool exhaust |
