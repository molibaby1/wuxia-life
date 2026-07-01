# P54 Sample Lines Residual Polish — Gap Audit

> **Date:** 2026-06-26  
> **Stage:** P54 bounded residual polish on P53 baseline  
> **Baseline:** P53 closure (`docs/test-reports/p53-sample-lines-40-plus-closure-report.md`)

## 1. Purpose

窄审计 P52/P53 遗留的两个 **monitor-only** residual，明确弱点落在哪些年龄段与验证面，避免 P54 扩散成全量内容重调。

## 2. Residual evidence sources

| ID | 描述 | 证据来源 | 分类 |
| --- | --- | --- | --- |
| M-orthodox-gray | seed 301 gray mission / 守正代价可感知度偏弱 | `p52-cross-tester-playtest-comparison.md` §1.2/§2；`p52-baseline-hardening-closure-report.md` monitor 表；P53 gap audit §4 | monitor-only → P54 target |
| M-merchant-debt | seed 804 midlife 债务 / 人情代价深度偏轻 | 同上；P53 merchant 45 payoff 仅部分加强 copy | monitor-only → P54 target |

**Playtest 共识：** 两测试者对 301 代价、804 midlife debt 均为 **warning**；非 blocking，但玩家复述「差一点」。

## 3. Weak-spot inventory

### 3.1 M-orthodox-gray (seed 301)

| 维度 | 现状 | 弱点 |
| --- | --- | --- |
| **Age 25** | currentGoal =「行侠守义，承担门派义务」 | 义务可读，**守正牺牲/代价**未显式点出 |
| **Age 32** | 同上；`sect_midlife_faction_pressure_done` = false | **gray 链未触发** — `sect_midlife_gray_mission` 依赖完整 sect midlife 长链，benchmark sim 未命中 |
| **Replay** | checkpoint 25/32 goal 无「代价/灰度」维度 | comparison 无法区分 polish 前后 |
| **Expression** | `sect_midlife_gray_*` 分支 wired，但 live seed 301 无 flag | fixture 测试覆盖 expression，**live spine 缺口** |

**Root cause:** gray mission 在 `sect-wudang.json` 池内，gate 需 `sect_midlife_stewardship_done` → `sect_midlife_faction_pressure_done`；sample-line benchmark 未走完整 midlife，spine 无桥接节点。

### 3.2 M-merchant-debt (seed 804)

| 维度 | 现状 | 弱点 |
| --- | --- | --- |
| **Age 25** | goal =「第一桶金已得，店铺经营中」 | **Pass** — P51 RW-01 已关闭 |
| **Age 32** | goal 仍为「店铺经营中」；`merchant_midlife_debt` = false | **debt milestone 未触发** — 条件要求 `shop_failed \|\| caravan_success`，804 仅走 shop 开张路径 |
| **Age 40** | identity 通用「周转压力」；无 midlife debt flag | 债务/人情**信号偏 implied** |
| **Replay** | checkpoint 32/40 无 debt/favor 窄断言 | guard 未覆盖 residual |

**Root cause:** `merchant_midlife_debt_milestone` 条件过窄，未覆盖 benchmark seed 804 的 shop-only 成功路径。

## 4. P54 patch surfaces（按层）

| 层 | M-orthodox-gray | M-merchant-debt |
| --- | --- | --- |
| 剧情配置 | `sample-lines-spine.json` 增 age 25/32 守正代价桥接 | 放宽 `merchant_midlife_debt_milestone` gate |
| 轻量展示 | `sampleLineExpression.ts` 增 P54 flag → currentGoal | 强化 midlife debt / age-40 identity 文案 |
| 验证脚本 | spine + expression + replay 窄断言 | 同上 + guard G-16/G-17 |

## 5. Out of scope（本 audit 不碰）

- 第四条样本线、age 55+、full lifetime sim
- `sect-wudang.json` 全量 midlife 链重写
- 新 UI 组件、新 gate runner

## 6. Verdict

P53 0–50 baseline **完整**。P54 真实缺口为：**benchmark seed 上 residual 信号不可见** — 需 bounded spine 桥接 + expression + 窄 guard，非重开 P46–P53 blocker。

---

## Appendix A — Merchant debt signal contract (P54-003)

| Checkpoint | Seed | Signal flag / event | 表达目标 |
| --- | --- | --- | --- |
| **Age 32** | 804 | `merchant_midlife_debt` via `merchant_midlife_debt_milestone` | 扩张后赊欠与人情涌来 — **债务/周转压力** |
| **Age 40** | 804 | `merchant_age40_identity_done` + midlife debt → identity summary | 财富与**债/风险**并述 — **人情与扩张代价** |

**不变：** merchant-first identity；age-25「第一桶金已得，店铺经营中」；age-45 payoff「扩张分岔」结论。

## Appendix B — Orthodox gray-cost signal contract (P54-004)

| Checkpoint | Seed | Signal flag / event | 表达目标 |
| --- | --- | --- | --- |
| **Age 25** | 301 | `orthodox_righteousness_cost_visible` via `orthodox_age25_righteousness_cost_milestone` | 入门后**守正牺牲** — 义务先于私利 |
| **Age 32** | 301 | `orthodox_gray_pressure_visible` via `orthodox_age32_gray_pressure_milestone` | **灰度任务压力** — 守正须付代价 |

**不变：** 正派主轴；不把线改写成灰路线；age-40/45 orthodox identity 与 payoff 不退化。
