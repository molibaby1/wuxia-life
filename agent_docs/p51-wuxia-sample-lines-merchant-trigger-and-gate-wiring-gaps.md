# P51 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-26  
**Mode:** post-run (`--pipeline-auto`, queue terminus)  
**Branch:** `codex/p51-wuxia-sample-lines-merchant-trigger-and-gate-wiring`  
**Commit range:** `46da476`–`d517705`  
**Parent PRD:** `docs/PRD/p51-wuxia-sample-lines-merchant-trigger-and-gate-wiring.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md` §8

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 5/5 `passes: true`（P51-001 … P51-005） |
| **Verify** | `agent_docs/p51-wuxia-sample-lines-merchant-trigger-and-gate-wiring-verify-result.md` — **PASS** |
| **P49 closure** | `docs/test-reports/p49-sample-lines-closure-report.md` — **Pass**（RW-04 defer only） |
| **P46 §11.3** | **Pass with documented defer** |

### Evidence (2026-06-26 discovery)

| Check | Result |
| --- | --- |
| RW-01 merchant shop chain | **Resolved** — seed 804 `merchant_first_shop` age 16–22; age 25 goal 经营态 |
| RW-02 age-40 identity | **Resolved** — 301/303/804 `*_age40_identity_done` + 专用文案 |
| RW-03 cross-line cost | **Resolved** — age 13 代价 **distinct**；collapsed=0 |
| P51 closure report | `docs/test-reports/p51-sample-lines-tuning-closure-report.md` — **present** |
| Root cause doc | `docs/test-reports/p51-merchant-trigger-root-cause.md` — **present** |
| Replay latest | `p49-sample-lines-replay-latest.*` + cross-line comparison — **regenerated** |
| Spine / expression / replay tests | **Pass** |
| `gate:playability` | **Pass**（0 blockers；无 regression） |

P51 **窄 scope tuning** Goals 全部达成：RW-01/02/03 消除；P49 Warning→Pass；P46 §11.3 Pass with defer。

---

## Product End-State mapping

### §8 Discovery 完成判定

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 主流/混合/巅峰可玩样本 | **Met** | P34/P35/P37 lifetime traces（P39）；P46 三线 **Pass**（P51 后） |
| 2 — 平凡出身 ≥3 可区分 | **Met** | `p25-ordinary-origin-slice`（unchanged） |
| 3 — 选择后果零自相矛盾 | **Met** | P39 13-path audit `highSeverity=0` |
| 4 — 巅峰运气+选择门禁 | **Met** | P35 pinnacle dual-gate |
| 5 — 门禁不退化 | **Met** | P38/P40/P51 `gate:playability` **PASS** |

**end_state_status:** **CLEAR** — P50 阻塞项（P46 Warning / RW-01–03）已闭合；§8 五项 **Met**。RW-04/RW-05 为 **explicit defer**（P51 non-goals），与 P39 defer 队列口径一致，非 §8 checklist 阻塞项。

### §6 三条 0–40 最小可玩人生样本

| Proxy | Status | Notes |
| --- | --- | --- |
| P46 三线 benchmark replay | **Met** | Pass；cross-line distinct=22, collapsed=0 |
| 玩家可复述人生线 | **Partial→Met** | Playtest Round 1 archived；RW-04 第二名 optional defer |

---

## Gap inventory

| Gap ID | Description | Route | Priority | Target |
| --- | --- | --- | --- | --- |
| GAP-P51-PLAYTEST-CROSS | 第二名 playtest 交叉验证缺失 | **defer** | Low | RW-04 optional |
| GAP-P51-MERCHANT-DEMONIC-BLEED | Seed 804 midlife currentGoal 偶现邪路语义（parallel `route_demonic`） | **defer** | Low | RW-05；age-40 与 shop 链正确 |
| GAP-P51-ORTHODOX-MERCHANT-SIGNAL | 正派 301 并行 `route_merchant` 信号 | **defer** | Low | P50 RW-03 延续；cross-line distinct |
| GAP-WAVE1-NEW-ACH | `jianghu_renown_sage` / 新增 Wave 1 | **defer** | Low | North Star §3.2 intentional defer |
| GAP-WAVE3-4 | Wave 3 混合 / Wave 4 平凡扩展 | **defer** | Low | North Star §3.3/§3.4 |
| GAP-FULL-POOL-EXHAUST | 组合穷举 audit | **defer** | Low | P39 defer queue |

### P51 resolved (was P50 next-stage)

| ID | P50 status | P51 status |
| --- | --- | --- |
| RW-01 | warning | **Resolved** |
| RW-02 | warning | **Resolved** |
| RW-03 (cost collapsed) | warning | **Resolved** |

---

## In-stage delta

**None.** P51 五 story 均已 `passes: true`；verify PASS；不得回改已关闭 story。

---

## Next-stage PRD

**None.** P51 为 P46 路线图 queue **末阶段（index 5）**。`end_state_status: CLEAR`；剩余 gap 均为 **defer/monitor** — 无 verifiable spawn blocker。不 spawn P52。

| Order | stage_slug | Action |
| --- | --- | --- |
| — | — | **Pipeline COMPLETED** |

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **in-stage** | 0 | P51 closed |
| **next-stage** | 0 | No spawn — defer only |
| **defer** | 6 | RW-04, RW-05, orthodox merchant signal, Wave 1/3/4, pool exhaust |
