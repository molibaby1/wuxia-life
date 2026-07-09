# P127 Martial Second Visible Growth Sample Proof

Bounded proof for `martial_family` ages 5–16: behavior → trainingHabit → visible confirmation → continuation readability.

## Verification chain

1. Player performs childhood training actions at ages 5–8
2. `trainingHabit` accumulates on existing wiring
3. Main-screen `shapingSummary` confirms growth (`习武 · 渐成`)
4. Active-action feedback shows long-term impact lines
5. Period settlement summarizes shaping growth
6. Age 14–16 events read as follow-on from prior shaping

## Sample action loop (martial_family 5–8)

- **action_childhood_training #1**: trainingHabit=1, shapingSummary=`塑形未成`, longTerm=[习武塑形加深；习武方向已被记住，后续机会会由此打开；早期习武重心已确立，人生会沿此方向展开]
- **action_childhood_training #2**: trainingHabit=2, shapingSummary=`习武 · 渐成`, longTerm=[习武塑形加深]

## Signal A — shapingSummary (summary surface)

| Checkpoint | trainingHabit | shapingSummary |
| --- | --- | --- |
| start | 0 | 塑形未成 |
| after 2× training | 2 | 习武 · 渐成 |

## Signal B — period settlement (periodSummaryDisplay)

- headline: 练功小成
- shaping growth line present: **true**
- body excerpt: 回看这一期，你的成长主轴是：习武 · 渐成。这是你反复做事积累出来的，不是年岁自然带来的。

## Signal C — long-term impact (feedback area)

- echo hook label: 习武方向已被记住，后续机会会由此打开
- shaping focus label: 早期习武重心已确立，人生会沿此方向展开
- shaping flag label: 习武塑形加深

## 8–16 continuation readability

- `p42_training_habit_youth_sparring` eligible at age 15: **true**
- p42 title: 同窗过招
- p42 text excerpt: 你这些年养成的练武节律，已让同窗看出差别——不必等门派试炼，日常对练里你的起手、收势都比别人更稳。有人邀你牵头组织晨课，…
- `p22_early_martial_route_fork` eligible at age 17: **true**
- p22 title: 武途初分
- p22 text excerpt: 十六岁后你常于清晨练功、日暮复盘。一位游方武者路过，见你招式虽稚嫩却日日不辍，邀你择一路：是拜入正经门派，还是继续独行磨…
- Event copy references prior练功节律 / 日日不辍 — readable as follow-on from early shaping

## Required acceptance (§10)

- At least 2 timepoint confirmations: **yes** (action feedback + period summary / shapingSummary)
- At least 1 from summary/feedback: **yes** (shapingSummary + longTermImpactLines)
- At least 1 from period settlement: **yes** (buildPeriodSummary shaping line)
- Distinguishes growth from background flavor: **yes** (behavior-driven copy, not origin repetition)
- No new system nouns: **yes** (existing habit / echo / flag wiring only)

## Scope guards

- Single route: martial_family only
- No scholar_house parallel work
- No new growth system or panel
- Continuation targets locked: p9_echo_training_hook, p9_early_training_focus, p22_early_martial_route_fork, p42_training_habit_youth_sparring

