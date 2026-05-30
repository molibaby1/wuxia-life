# Product Experience Governance — Simulation & Experience Gates (PXG4)

交付：US-015 ~ US-019

## Commands

| Command | Purpose |
| --- | --- |
| `npm run simulate:golden-line` | 4 个 deterministic 0–30 场景，输出 `public/reports/golden-line-simulation-*.json` |
| `npm run gate:golden-line` | 连续性 / 反馈 / 路线健康 / active-scope 门禁（失败非零退出） |
| `npm run gate:experience` | 主入口；含 legacy P2 样本 + golden-line 子门禁 |
| `npm run report:golden-line-feedback` | 反馈扫描（由 `gate:golden-line` 集成） |

## Deterministic scenarios

| Sample ID | Route track | Seed | End age |
| --- | --- | --- | --- |
| `golden-sect` | sect | 301 | 30 |
| `golden-wanderer` | wanderer | 302 | 30 |
| `golden-demonic` | demonic | 303 | 30 |
| `golden-neutral-baseline` | (none) | 304 | 30 |

## Gate thresholds

- Event gap ≤ 2 in-game years（有意义事件之间）
- Manual choice events ≥ 6（0–30 仿真内 `totalChoices`）
- Key-choice payoff：静态 `golden-line-payoff-map.json` ≥ 70%；仿真 payoff 低于阈值记 **warning**
- Route contradiction：`route-conflict-table.json` strong_exclusion；路线专项样本为 **blocker**，neutral 为 **warning**
- Active scope：`active` 事件仅 `blocker` 级 quality issue 阻断；`deferred`/`candidate` 的 major+ 计入 warning 汇总

## Machine report

`docs/test-reports/product-experience-governance-golden-line-gates.md`（`npm run gate:golden-line` 再生）

---

*PXG4 — 2026-05-30*
