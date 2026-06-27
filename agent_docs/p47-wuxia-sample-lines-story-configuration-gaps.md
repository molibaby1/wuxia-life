# P47 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-26  
**Mode:** post-run (`--pipeline-auto`)  
**Branch:** `codex/p47-wuxia-sample-lines-story-configuration`  
**Parent PRD:** `docs/PRD/p47-wuxia-sample-lines-story-configuration.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 10/10 `passes: true`（P47-001 … P47-010） |
| **Verify** | `agent_docs/p47-wuxia-sample-lines-story-configuration-verify-result.md` — PASS（Round 2） |
| **Finalize** | commit `3d7d75b` — FIX-001 … FIX-010 已应用 |

### Evidence (2026-06-26 discovery)

| Check | Result |
| --- | --- |
| Gap audit | `docs/test-reports/p47-sample-lines-content-anchor-gap-audit.md` — present |
| PRD §10–§12 Chapter spine ×3 | Present（正派 / 邪路 / 商路 0–40） |
| PRD §13–§15 Early-life tasks ×3 | Present（O-1/O-2/O-3, D-1/D-2/D-3, M-1/M-2/M-3） |
| PRD §16 Midlife + age-40 hooks | Present |
| PRD §17 Flag/route wiring | Present |
| PRD §18 Closure evidence | Present |
| P46 §11.1 文档收口三类证据 | spine + audit + flag 续链 — **齐备** |
| US-001 … US-010 acceptance criteria | All `[x]` in PRD markdown |

P47 **文档阶段** Goals 全部达成：三条线 0–40 spine、early-life 任务拆分、中年代价与 40 岁钩子规格、flag/routePoint wiring、closure 规则均已写入 PRD 与 test-reports。本 stage **不直接改 gameplay JSON**；§18.4 将「文档收口」与「配置实施收口」明确分离。

---

## Product End-State mapping

### §3 成就谱系（快照）

| Area | Status | Notes |
| --- | --- | --- |
| Wave 1 P16 三条 | **Met** | 可追溯；非 P47 三条样本线焦点 |
| Wave 1 新增两条 | **Partial** | `jianghu_renown_sage` / `medical_sage_healer` 待实现 |
| Wave 2 巅峰 | **Partial** | P35 pinnacle traces |
| Wave 3/4 混合/平凡 | **Defer** | North Star §3.3/§3.4 intentional defer |

### §6 重玩动机（快照）

| Proxy | Status | Notes |
| --- | --- | --- |
| P45 bounded replay matrix | **Met** | 机制塑形可区分 persona |
| 三条 0–40 最小可玩人生样本 | **Open** | P47 文档已定义 spine；**JSON 配置与玩家可读尚未落地** |
| 玩家可复述人生线 | **Open** | 需 P48 表达 + P49 验证闭合 |

### §8 Discovery 完成判定

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 主流/混合/巅峰可玩样本 | **Partial** | Wave 1 成就链有 trace；**P46 三条样本线（正派/邪路/商路）未 runtime 落地** |
| 2 — 平凡出身 ≥3 可区分 | **Partial** | `p25-ordinary-origin-slice` 有证据；非 P47 焦点 |
| 3 — 选择后果零自相矛盾 | **Partial** | P39 8-path slice Met；全池 defer |
| 4 — 巅峰运气+选择门禁 | **Partial** | P35 pinnacle dual-gate |
| 5 — 门禁不退化 | **Met** | P38/P40 playability gate PASS |

**end_state_status:** **OPEN** — North Star §8 checklist 五项未全 Met；P47 闭合的是**配置规格文档**，非 Product End-State 全量 GO。

---

## Gap inventory

| Gap ID | Description | Route | Priority | Target stage |
| --- | --- | --- | --- | --- |
| GAP-CONFIG-IMPL | Task O/D/M 系列（童年种子、route flag、age-40 summary 等）尚未写入 `src/data/lines/` JSON | **next-stage** | P0 | P48 规格对齐期可并行；P49 前须实施 |
| GAP-SAMPLE-EXPRESSION | 关键目标/代价/身份未映射到 summary、route-signal、life-memory | **next-stage** | P0 | P48 |
| GAP-SAMPLE-VALIDATION | 无固定 seed 0–40 仿真 + 人工 playtest checklist closure | **next-stage** | P0 | P49 |
| GAP-END08-SAMPLE-LINES | §8 item 1 子集：三条样本线需 P47 实施 + P48 表达 + P49 验证闭合 | **next-stage** | P0 | P48→P49 |
| GAP-AGE40-SUMMARY-ALL | 三线专用 `*_age40_identity_summary` / `*_age40_identity_done` 在 repo 中缺失（规格已定义） | **next-stage** | P0 | 配置实施（P48 前/并行） |
| GAP-ROUTE-MERCHANT | `route_merchant` 统一 gate flag 缺失（gap audit §5.2） | **next-stage** | P0 | Task M-1 实施 |
| GAP-WAVE1-NEW-ACH | `jianghu_renown_sage` / `medical_sage_healer` 待实现 | **defer** | Low | 非 P47 范围 |
| GAP-WAVE3-4 | Wave 3 混合 / Wave 4 平凡扩展 | **defer** | Low | North Star §3.3/§3.4 |
| GAP-FULL-POOL-AUDIT | 全内容池 consequence audit | **defer** | Low | P39 partial |
| GAP-POISON-MUTEX | Game-engine JSON poison mutex | **monitor** | Low | 非阻塞 |

### 配置实施 backlog（P47 §13–§15 规格已定义，runtime 待补）

| Task | 样本线 | 状态 | 阻塞 P48？ |
| --- | --- | --- | --- |
| O-1 童年种子 route 绑定 | 正派 | 未实施 | 否（P48 可先做表达 audit） |
| O-2 少年首次被认可 milestone | 正派 | 未实施 | 否 |
| O-3 青年入门 mandatory 保护 | 正派 | 部分存在 | 否 |
| D-1 童年 demonic 种子 | 邪路 | 未实施 | 否 |
| D-2 少年越界 preview | 邪路 | 未实施 | 否 |
| D-3 青年诱惑 mandatory 标注 | 邪路 | 部分存在 | 否 |
| M-1 童年种子 + `route_merchant` | 商路 | 未实施 | 否 |
| M-2 第一桶金 once/mainline | 商路 | 部分存在 | 否 |
| M-3 商队/投资续链 | 商路 | 部分存在 | 否 |
| 三线 age-40 summary 节点 | 全线 | **缺失** | P48 大规模展示前须补配置或 P48 降级 |

依据 P47 §18.3：上述文档齐备但配置未实施 → **可启动 P48 规格对齐**，但不得宣称 P47 **实施收口** 或样本线已玩家可读。

---

## In-stage delta

**None.** P47 十 story 均已 `passes: true`；verify PASS；不得回改已关闭 story。

---

## Next-stage PRD（已存在 — 禁止 duplicate spawn）

P46 路线图已在 pipeline queue **index 2–3** 预排队 P48/P49；discovery **不重复 spawn**。

| Order | stage_slug | prd_md | prd_json | Queue |
| --- | --- | --- | --- | --- |
| 2 | `p48-wuxia-sample-lines-player-facing-expression` | `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md` | `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.prd.json` | **queued** |
| 3 | `p49-wuxia-sample-lines-validation-and-playtest` | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md` | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.prd.json` | **queued** |

**Discovery 动作：** Orchestrator **advance to P48**（index 2）。`spawned: false`。

**P48 handoff 输入（来自 P47）：**

1. 本 PRD §10–§17 作为展示映射规格
2. `docs/test-reports/p47-sample-lines-content-anchor-gap-audit.md` 中「缺失」项为 backlog
3. P46 §10.2 shared 验收口径为 P49 前置参考

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **in-stage** | 0 | P47 文档 stage closed |
| **next-stage** | 6 | Hand off to queued P48→P49 + 配置实施 backlog |
| **defer** | 3 | Wave 1 new achievements, Wave 3/4, full pool |
| **monitor** | 1 | GAP-POISON-MUTEX |
