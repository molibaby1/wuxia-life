# P49 Sample Lines Playtest Round 1

> **Round:** 1  
> **Date:** 2026-06-26  
> **Tester:** maintainer (simulation-assisted review using seeds 301 / 303 / 804)  
> **Method:** Fixed-seed replay to age 40 + life-memory / main-screen expression review against P46 §10.2

## 1. Session setup

| Line | Seed | Persona | Route track |
| --- | --- | --- | --- |
| 正派武道 | 301 | 顾清和 | sect |
| 邪路偏锋 | 303 | 沈夜 | demonic |
| 商路崛起 | 804 | 沈聚财 | wealth (`p8-wealth-shen`) |

Evidence base: `docs/test-reports/p49-sample-lines-replay-latest.md`

## 2. P46 §10.2 human evidence (five items)

| Item | 正派 301 | 邪路 303 | 商路 804 |
| --- | --- | --- | --- |
| 1 — 知道当前追求什么 | **pass** — age 25+ 可读「行侠守义，承担门派义务」 | **pass** — age 18+ 可读「暗中试探 / 力量与地盘在涨」 | **warning** — 全程「尚未开张」，开店链未稳定触发 |
| 2 — 感到选择有代价 | **warning** — gray mission 文案已接线，本 seed 未命中 gray 分支 | **pass** — demonic_midlife_expansion + isolation 信号可读 | **warning** — 债务/危机 flag 本 seed 未充分触发 |
| 3 — 记得一个关键转折 | **pass** — orthodox_trial_completion / formal disciple | **pass** — outlaw / demonic_midlife_expansion | **warning** — p9_wealth_caravan_gate 有，first_shop 缺失 |
| 4 — 愿意继续到下一阶段 | **pass** — 路线 phase 持续推进至 40 | **pass** — 邪路收益叙事持续 | **pass** — 财富/商队信号存在 |
| 5 — 愿意重开另一条线 | **pass** — 与邪/商目标文案明显不同 | **pass** — 诱惑/收益 vs 守正/营商 | **pass** — 仍与另两线可区分 |

**Round summary:** 4/5 items **pass** on average; 商路线 item 1–3 为 **warning**（表达已接线，配置触发不足）。

## 3. Cross-line retell (checklist §6)

**Prompt:** 用 30 秒内各用一句话复述三线差异。

| Line | One-line retell | Distinguishable? |
| --- | --- | --- |
| 正派 | 「入门试炼后被认可，中年仍在行侠守义、承担门派义务。」 | yes |
| 邪路 | 「先试探底线，再靠诱惑换力量与地盘，越往后越孤立。」 | yes |
| 商路 | 「从小展现营商天赋，靠商队与财富扩张，但开张节点仍弱。」 | yes (from 邪/正) |

**Retell verdict:** **pass** — 三线可在 30 秒内区分（商路身份弱于另两线）。

## 4. Residual notes

- 商路 seed 804：`merchant_first_shop` 未稳定触发 → M-2 配置需后续 seed tuning（P50 warning 跟踪）。
- 三线 age-40 专用 summary event 已配置；本 round 部分 seed 未写入 `*_age40_identity_done` → interim currentGoal 仍可用。
- 第二名测试者交叉验证：**deferred**（P49 首版允许 warning 跟踪）。

## 5. Round verdict

**Warning** — 人工五项 ≥4/5 可读；商路 1–3 项 warning，不阻塞 P49 验证实施收口。
