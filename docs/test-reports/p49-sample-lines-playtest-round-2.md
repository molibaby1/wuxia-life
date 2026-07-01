# P49 Sample Lines Playtest Round 2

> **Round:** 2  
> **Date:** 2026-06-26  
> **Tester:** external reviewer (simulation-assisted, protocol-only — did not read round-1 verdict)  
> **Method:** Fixed-seed replay to age 40 + life-memory / main-screen expression review per `p52-sample-lines-playtest-round-2-protocol.md`

## 1. Session setup

| Line | Seed | Persona | Route track |
| --- | --- | --- | --- |
| 正派武道 | 301 | 顾清和 | sect |
| 邪路偏锋 | 303 | 沈夜 | demonic |
| 商路崛起 | 804 | 沈聚财 | wealth (`p8-wealth-shen`) |

Evidence base: post-P51 live sim + replay checkpoint export (seeds 301/303/804, ages 13–40).

---

## 2. 正派武道 (seed 301)

### 2.1 P46 §10.2 checklist

| # | Question | Label | Notes |
| --- | --- | --- | --- |
| 1 | 知道当前追求什么 | **pass** | Age 25 goal「行侠守义，承担门派义务」清晰；age 40 专用 identity 可读 |
| 2 | 感到选择有代价 | **warning** | Life-memory 有守正/门派义务信号，但本 seed 未走到 gray mission 拒绝分支，代价感偏「义务」而非「牺牲」 |
| 3 | 记得一个关键转折 | **pass** | `orthodox_trial_completion` 前后：从「入门试炼」到「正式弟子」转变明显 |
| 4 | 愿意继续到下一阶段 | **pass** | 中年仍在推进门派/家庭线，无 dead-end 感 |
| 5 | 愿意重开另一条线 | **pass** | 目标文案与邪/商差异大，有动力试另两条 |

### 2.2 Required prose

- **复述:** 「被门派认可的正派弟子，中年仍在行侠守义、承担门派与家庭义务。」
- **继续意愿:** **yes** — 路线 phase 连贯，age 40 identity 给出总结钩子。
- **重开意愿:** **yes** — 想对比邪路的「换力量」与商路的「周转经营」。
- **关键转折记忆:** 约 age 18，`orthodox_trial_completion` — 完成正道试炼后被认可。

### 2.3 Line verdict

**warning** — 5 项中 4 pass / 1 warning（代价分支未在本 seed 充分呈现，非表达缺失）。

---

## 3. 邪路偏锋 (seed 303)

### 3.1 P46 §10.2 checklist

| # | Question | Label | Notes |
| --- | --- | --- | --- |
| 1 | 知道当前追求什么 | **pass** | Age 18+「邪路已开」→ age 25「力量与地盘在涨，诱惑未止」连贯 |
| 2 | 感到选择有代价 | **pass** | `demonic_midlife_expansion`、isolation/betrayal 风险在 life-memory 可读 |
| 3 | 记得一个关键转折 | **pass** | `demonic_youth_first_transgression` — 第一次越界节点记得住 |
| 4 | 愿意继续到下一阶段 | **pass** | 邪路收益叙事持续至 40，有 escalation 感 |
| 5 | 愿意重开另一条线 | **pass** | 「诱惑换力量」与正派守正、商路经营完全不同 |

### 3.2 Required prose

- **复述:** 「先试探底线再越界，靠诱惑换力量与地盘，越往后孤立感越强。」
- **继续意愿:** **yes** — midlife expansion 让人好奇 40 岁后后果。
- **重开意愿:** **yes** — 已感受到邪路「收益+反噬」双轨，愿试守正或营商对照。
- **关键转折记忆:** 约 age 18 前后，`demonic_youth_first_transgression` — 邪路正式打开。

### 3.3 Line verdict

**pass** — 5/5 可读；三线中身份信号最强的一条。

---

## 4. 商路崛起 (seed 804)

### 4.1 P46 §10.2 checklist

| # | Question | Label | Notes |
| --- | --- | --- | --- |
| 1 | 知道当前追求什么 | **pass** | Age 18 `merchant_first_shop` 后 goal 转为经营态（「第一桶金已得，店铺经营中」）；age 25+ 仍为店铺/周转语义，无邪路 goal 渗入 |
| 2 | 感到选择有代价 | **warning** | 商队/财富信号存在；本 seed midlife 债务 flag 触发较弱，代价感不如邪路 explicit |
| 3 | 记得一个关键转折 | **pass** | `merchant_first_shop` age ~18 — 从「尚未开张」到开店，转折清晰 |
| 4 | 愿意继续到下一阶段 | **pass** | 财富/商队/caravan gate 持续，经营线有推进 |
| 5 | 愿意重开另一条线 | **pass** | 营商/周转 framing 与另两线可区分 |

### 4.2 Required prose

- **复述:** 「从小显营商天赋，十八岁左右开张，之后靠店铺与商队扩张财富。」
- **继续意愿:** **yes** — 经营链已接通，想看 midlife 债务/人情压力是否加深。
- **重开意愿:** **yes** — 商路「周转/人情」与邪路「力量/孤立」对比鲜明。
- **关键转折记忆:** 约 age 18，`merchant_first_shop` — 第一间店铺开张。

### 4.3 Line verdict

**warning** — 5 项中 4 pass / 1 warning（代价维 midlife 债务在本 seed 偏弱，属配置触发深度而非 goal 串线）。

---

## 5. Cross-line retell (checklist §6)

**Prompt:** 30 秒内各用一句话复述三线差异。

| Line | One-line retell | Distinguishable? |
| --- | --- | --- |
| 正派 | 「入门试炼后被认可，中年行侠守义、承担门派义务。」 | yes |
| 邪路 | 「越界后靠诱惑换力量与地盘，孤立与背叛风险随行。」 | yes |
| 商路 | 「十八岁左右开店，靠经营与商队滚雪球，人情周转是底色。」 | yes |

**Retell verdict:** **pass** — 三线 30 秒内可区分；商路身份弱于邪路但仍明显不同于正/邪。

---

## 6. Residual notes (raw only)

- 正派 301：gray mission 分支未在本 seed 命中 → 代价项 warning，不判 fail。
- 商路 804：并行 `route_demonic` flag 存在但 currentGoal 仍为商路经营表达（post-P51 RW-05 行为）。
- 未阅读 round-1 结论；以上标签仅基于本 session replay + expression 面。

---

## 7. Round verdict (per-line only)

| Line | Verdict |
| --- | --- |
| 正派 301 | **warning** |
| 邪路 303 | **pass** |
| 商路 804 | **warning** |

**Round summary:** 2/3 lines pass or warning-only；无 fail；商路开店链与 age-25 goal 已可读（与 pre-P51「尚未开张」问题不同）。

Cross-tester comparison and final verdict → see `p52-cross-tester-playtest-comparison.md` (not in this file).
