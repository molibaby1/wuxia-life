# P48 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-26  
**Mode:** post-run (`--pipeline-auto`)  
**Branch:** `codex/p48-wuxia-sample-lines-player-facing-expression`  
**Parent PRD:** `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 9/9 `passes: true`（P48-001 … P48-009） |
| **Verify** | `agent_docs/p48-wuxia-sample-lines-player-facing-expression-verify-result.md` — PASS（Round 2） |
| **Finalize** | commit `64678ac` — FIX-001 … FIX-009 已应用 |

### Evidence (2026-06-26 discovery)

| Check | Result |
| --- | --- |
| Surface audit | `docs/test-reports/p48-sample-lines-player-facing-surface-audit.md` — present |
| PRD §10–§12 Expression tasks ×3 | Present（正派 / 邪路 / 商路 O/D/M-E*） |
| PRD §13–§14 Cross-line rules | Present |
| PRD §15 Age-40 summary rules | Present |
| PRD §16 Surface mapping | Present |
| PRD §17 Closure evidence | Present |
| P48 §17.1 文档阶段收口六类证据 | **齐备** |
| US-001 … US-009 acceptance criteria | All `[x]` in PRD markdown |

P48 **文档阶段** Goals 全部达成：三线表达面 audit、9 个表达小任务拆分、跨线 current-goal / 代价规则、40 岁总结规则、轻量 surface mapping、closure 与 P49 handoff 均已写入 PRD 与 test-reports。本 stage **不改 gameplay 行为**；§17.6 将「文档收口」与「表达实施收口」明确分离。

---

## Product End-State mapping

### §3 成就谱系（快照）

| Area | Status | Notes |
| --- | --- | --- |
| Wave 1 P16 三条 | **Met** | 可追溯；非 P48 样本线焦点 |
| Wave 1 新增两条 | **Partial** | `jianghu_renown_sage` / `medical_sage_healer` 待实现 |
| Wave 2 巅峰 | **Partial** | P35 pinnacle traces |
| Wave 3/4 混合/平凡 | **Defer** | North Star §3.3/§3.4 intentional defer |

### §6 重玩动机（快照）

| Proxy | Status | Notes |
| --- | --- | --- |
| P45 bounded replay matrix | **Met** | 机制塑形可区分 persona |
| 三条 0–40 最小可玩人生样本 | **Open** | P47/P48 规格已定义；**JSON 配置 + 玩家可读表达尚未 runtime 落地** |
| 玩家可复述人生线 | **Open** | 需 P48 表达实施 + P49 验证闭合 |

### §8 Discovery 完成判定

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 主流/混合/巅峰可玩样本 | **Partial** | Wave 1 成就链有 trace；**P46 三条样本线（正派/邪路/商路）未 runtime 玩家可读** |
| 2 — 平凡出身 ≥3 可区分 | **Partial** | `p25-ordinary-origin-slice` 有证据；非 P48 焦点 |
| 3 — 选择后果零自相矛盾 | **Partial** | P39 8-path slice Met；全池 defer |
| 4 — 巅峰运气+选择门禁 | **Partial** | P35 pinnacle dual-gate |
| 5 — 门禁不退化 | **Met** | P38/P40 playability gate PASS |

**end_state_status:** **OPEN** — North Star §8 checklist 五项未全 Met；P48 闭合的是**表达规格文档**，非 Product End-State 全量 GO。

---

## Gap inventory

| Gap ID | Description | Route | Priority | Target stage |
| --- | --- | --- | --- | --- |
| GAP-EXPRESSION-IMPL | O/D/M-E* 九任务（currentGoal、consequence、DEBT/RISK、age-40 落点）尚未写入 `playerFacingLabels.ts` / `lifeMemoryLabels.ts` / `deriveLifeMemorySummary.ts` | **next-stage** | P0 | P48 实施 backlog；P49 前须部分落地 |
| GAP-MERCHANT-KEY-CHOICE | 商路关键节点未进 `ALL_KEY_CHOICE_EVENT_IDS`（surface audit §6.2） | **next-stage** | P0 | M-E1/M-E2 实施 |
| GAP-MERCHANT-DEBT-RISK | `merchant_midlife_debt` / crisis 未进 DEBT/RISK 映射 | **next-stage** | P0 | M-E2 实施 |
| GAP-AGE40-SUMMARY-ALL | 三线专用 `*_age40_identity_summary` / 展示落点 runtime 缺失（规格 §15 + audit §2） | **next-stage** | P0 | 配置 + O/D/M-E3 实施 |
| GAP-CONFIG-IMPL | P47 Task O/D/M 系列 JSON 配置尚未 fully 落地 | **next-stage** | P0 | P47 实施 backlog；P49 前须收口 |
| GAP-SAMPLE-VALIDATION | 无固定 seed 0–40 仿真 + 人工 playtest checklist closure | **next-stage** | P0 | **P49**（已排队） |
| GAP-END08-SAMPLE-LINES | §8 item 1 子集：三条样本线需配置 + 表达 + 验证闭合 | **next-stage** | P0 | P48 实施 → P49 |
| GAP-ROUTE-MERCHANT | `route_merchant` 未进 `LONG_TERM_FLAG_LABELS` 白名单 | **next-stage** | P0 | M-E1 实施 |
| GAP-WAVE1-NEW-ACH | `jianghu_renown_sage` / `medical_sage_healer` 待实现 | **defer** | Low | 非 P48 范围 |
| GAP-WAVE3-4 | Wave 3 混合 / Wave 4 平凡扩展 | **defer** | Low | North Star §3.3/§3.4 |
| GAP-FULL-POOL-AUDIT | 全内容池 consequence audit | **defer** | Low | P39 partial |
| GAP-POISON-MUTEX | Game-engine JSON poison mutex | **monitor** | Low | 非阻塞 |

### 表达实施 backlog（P48 §10–§16 规格已定义，runtime 待补）

| Task | 样本线 | 状态 | 阻塞 P49 启动？ |
| --- | --- | --- | --- |
| O-E1 当前追求叙事 | 正派 | 未实施 | 否（P49 可先做 contract / replay 规格） |
| O-E2 gray mission 分支 consequence | 正派 | 未实施 | 否 |
| O-E3 40 岁身份总结 | 正派 | 未实施 | **是**（P49 closure） |
| D-E1 诱惑/收益表达 | 邪路 | 未实施 | 否 |
| D-E2 isolation/betrayal 代价 | 邪路 | 未实施 | 否 |
| D-E3 40 岁身份总结 | 邪路 | 未实施 | **是**（P49 closure） |
| M-E1 商路 currentGoal + route_merchant | 商路 | 未实施 | 否 |
| M-E2 债务/义气/风险 | 商路 | 未实施 | **是**（P49 商路线可读） |
| M-E3 40 岁身份总结 | 商路 | 未实施 | **是**（P49 closure） |

依据 P48 §17.6：文档齐备但 O/D/M-E* 未实施 → **可启动 P49 验证规格/脚本**，但不得宣称 P48 **实施收口** 或样本线已玩家可读。

---

## In-stage delta

**None.** P48 九 story 均已 `passes: true`；verify PASS；不得回改已关闭 story。

---

## Next-stage PRD（已存在 — 禁止 duplicate spawn）

P46 路线图已在 pipeline queue **index 3** 预排队 P49；discovery **不重复 spawn**。

| Order | stage_slug | prd_md | prd_json | Queue |
| --- | --- | --- | --- | --- |
| 3 | `p49-wuxia-sample-lines-validation-and-playtest` | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md` | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.prd.json` | **queued** |

**Discovery 动作：** Orchestrator **advance to P49**（index 3）。`spawned: false`。

**P49 handoff 输入（来自 P48）：**

1. 本 PRD §13–§15 作为验证 checklist 输入
2. Surface audit §7–§8 作为表达实施 backlog 优先级
3. P46 §10.2 共享验收口径作为 closure 标准
4. P47 §16 age-40 hook 实施状态（影响 interim vs 专用 summary）
5. `docs/test-reports/p49-sample-lines-validation-contract.md`（P49 已起草 contract）

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **in-stage** | 0 | P48 文档 stage closed |
| **next-stage** | 8 | Hand off to queued P49 + P48 表达实施 backlog + P47 配置 backlog |
| **defer** | 3 | Wave 1 new achievements, Wave 3/4, full pool |
| **monitor** | 1 | GAP-POISON-MUTEX |
