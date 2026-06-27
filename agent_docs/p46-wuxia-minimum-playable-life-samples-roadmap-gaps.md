# P46 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-26  
**Mode:** post-run (`--pipeline-auto`)  
**Branch:** `codex/p46-wuxia-minimum-playable-life-samples-roadmap`  
**Parent PRD:** `docs/PRD/p46-wuxia-minimum-playable-life-samples-roadmap.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 4/4 `passes: true`（P46-001 … P46-004） |
| **Verify** | `agent_docs/p46-wuxia-minimum-playable-life-samples-roadmap-verify-result.md` — PASS |
| **Finalize** | commit `869b58e` — pipeline finalize after review |

### Evidence (2026-06-26 discovery)

| Check | Result |
| --- | --- |
| P46 PRD §10 Shared Sample-Line Quality Bar | Present |
| P46 PRD §11 Phase Handoff Rules | Present |
| P46 PRD §2 Stage PRD Index（P47/P48/P49） | Present |
| Stage PRD files on disk | P47/P48/P49 `.md` + `.prd.json` exist |
| US-001 … US-004 acceptance criteria | All `[x]` in PRD markdown |

P46 Goals satisfied: three-line scope contract, executable stage split, shared quality bar, phase handoff rules.本 stage 为**路线图/planning**，不直接改 gameplay；交付物为后续三阶段 PRD 与验收口径。

---

## Product End-State mapping

### §3 成就谱系（快照）

| Area | Status | Notes |
| --- | --- | --- |
| Wave 1 P16 三条 | **Met** | `grandmaster_guardian` / `sect_leader_statesman` / `lone_sword_legend` 可追溯 |
| Wave 1 新增两条 | **Partial** | `jianghu_renown_sage` / `medical_sage_healer` 有配置目标，非 P46 范围 |
| Wave 2 巅峰 | **Partial** | P35 pinnacle traces；非 P46 三条样本线 |
| Wave 3/4 混合/平凡 | **Defer** | North Star §3.3/§3.4  intentional defer |

### §6 重玩动机（快照）

| Proxy | Status | Notes |
| --- | --- | --- |
| P45 bounded replay matrix | **Met** | 机制塑形可区分 persona |
| 三条 0–40 最小可玩人生样本 | **Open** | P46 路线图已定义，**尚未实现** |
| 玩家可复述人生线 | **Open** | 需 P47→P48→P49 链闭合 |

### §8 Discovery 完成判定

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 主流/混合/巅峰可玩样本 | **Partial** | Wave 1 成就链有仿真 trace；**P46 三条样本线（正派/邪路/商路）未落地** |
| 2 — 平凡出身 ≥3 可区分 | **Partial** | `p25-ordinary-origin-slice` 有证据；非 P46 焦点 |
| 3 — 选择后果零自相矛盾 | **Partial** | P39 8-path slice Met；全池仍 defer |
| 4 — 巅峰运气+选择门禁 | **Partial** | P35 pinnacle dual-gate |
| 5 — 门禁不退化 | **Met** | P38/P40 playability gate PASS |

**end_state_status:** **OPEN** — North Star §8 checklist 五项均未全 Met；P46 未闭合项的核心是「三条最小可玩人生样本线尚未实现/未玩家可读/未验证收口」。

---

## Gap inventory

| Gap ID | Description | Route | Priority | Target stage |
| --- | --- | --- | --- | --- |
| GAP-SAMPLE-CONFIG | 三条 0–40 样本线缺少统一 spine、gap audit、flag/routePoint 续链配置 | **next-stage** | P0 | P47 |
| GAP-SAMPLE-EXPRESSION | 关键目标/代价/身份信号未映射到 summary、route-signal、life-memory | **next-stage** | P0 | P48 |
| GAP-SAMPLE-VALIDATION | 无固定 seed 0–40 仿真 + 人工 playtest checklist closure | **next-stage** | P0 | P49 |
| GAP-END08-SAMPLE-LINES | §8 item 1 子集：P46 三条样本线非 Wave 1 成就 trace，需独立 closure | **next-stage** | P0 | P47→P49 |
| GAP-WAVE1-NEW-ACH | `jianghu_renown_sage` / `medical_sage_healer` 待实现 | **defer** | Low | 非 P46 范围 |
| GAP-WAVE3-4 | Wave 3 混合 / Wave 4 平凡扩展 | **defer** | Low | North Star §3.3/§3.4 |
| GAP-FULL-POOL-AUDIT | 全内容池 consequence audit | **defer** | Low | P39 partial |
| GAP-POISON-MUTEX | Game-engine JSON poison mutex | **monitor** | Low | 非阻塞 |

---

## In-stage delta

**None.** P46 四 story 均已 `passes: true`；verify PASS；不得回改已关闭 story。

---

## Next-stage PRD（已存在 — 禁止 duplicate spawn）

P46 路线图阶段已在 §2 Stage PRD Index 中产出三阶段 PRD；pipeline queue **index 1–3** 已排队 P47/P48/P49。

| Order | stage_slug | prd_md | prd_json | Queue |
| --- | --- | --- | --- | --- |
| 1 | `p47-wuxia-sample-lines-story-configuration` | `docs/PRD/p47-wuxia-sample-lines-story-configuration.md` | `docs/PRD/p47-wuxia-sample-lines-story-configuration.prd.json` | **queued** |
| 2 | `p48-wuxia-sample-lines-player-facing-expression` | `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md` | `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.prd.json` | **queued** |
| 3 | `p49-wuxia-sample-lines-validation-and-playtest` | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md` | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.prd.json` | **queued** |

**Discovery 动作：** `spawned: false` — 不重复生成 PRD；Orchestrator **advance to P47**。

**Note：** P47/P48/P49 的 `prd.json` 中 `passes: true` 反映 P46 规划阶段 story 拆分完成，**不等于** runtime/content 实施完成。P47 仍缺 `docs/test-reports/` 下 gap audit 与三条线 spine 实施证据；现有 `src/data/lines/` 内容为分散锚点（如 `orthodox.json`、`merchant.json`、`identity-demon.json`），未满足 P46 §10 最低可玩门槛。

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **in-stage** | 0 | P46 closed |
| **next-stage** | 4 | Hand off to queued P47→P48→P49 |
| **defer** | 3 | Wave 1 new achievements, Wave 3/4, full pool |
| **monitor** | 1 | GAP-POISON-MUTEX |
