# P129 Ordinary-Origin Visible Growth Sample Proof

Bounded proof for `tavern_hand` ages 5–13: behavior → socialMomentum → visible confirmation → continuation readability.

## Verification chain

1. Player performs early socializing actions at ages 5–8
2. `socialMomentum` accumulates on existing wiring via `p9_echo_social_hook`
3. Main-screen `shapingSummary` confirms growth (`人情 · 渐成`)
4. Active-action feedback shows long-term impact lines
5. Period settlement summarizes shaping growth
6. Age 9–13 childhood fork reads as follow-on from prior social shaping

## Sample action loop (tavern_hand 5–8)

- **action_socializing_lite #1**: socialMomentum=1, shapingSummary=`塑形未成`, longTerm=[人情往来加深；人情方向已被记住，后续机会会由此打开；早期人情重心已确立，人生会沿此方向展开]
- **action_socializing_lite #2**: socialMomentum=2, shapingSummary=`人情 · 渐成`, longTerm=[人情往来加深]

## Signal A — shapingSummary (summary surface)

| Checkpoint | socialMomentum | shapingSummary |
| --- | --- | --- |
| start | 0 | 塑形未成 |
| after 2× socializing | 2 | 人情 · 渐成 |

## Signal B — period settlement (periodSummaryDisplay)

- headline: 交游小成
- shaping growth line present: **true**
- body excerpt: 回看这一期，你的成长主轴是：人情 · 渐成。这是你反复做事积累出来的，不是年岁自然带来的。

## Signal C — long-term impact (feedback area)

- echo hook label: 人情方向已被记住，后续机会会由此打开
- shaping focus label: 早期人情重心已确立，人生会沿此方向展开
- shaping flag label: 人情往来加深

## 8–13 continuation readability

- `ordinary_tavern_network_fork` age band: **9–13**
- fork title: 酒肆分岔
- fork prompt excerpt: 掌柜让你选：专心学跑堂规矩，还是帮账房记流水、认江湖客人？…
- `track_guests` option: 记客人 → ally_network seed
- `p28_social_momentum_network_fork` eligible at age 24: **true**
- p28 title: 人脉成线
- p28 text excerpt: 长期人情往来塑成的名声与门路，已把熟识之人连成一张能互相引介的网。眼下有人邀你参加一场只认门路不认名帖的私宴。…
- Early social shaping makes guest-network fork readable as follow-on from prior人情往来

## Required acceptance (§10)

- At least 2 timepoint confirmations: **yes** (action feedback + period summary / shapingSummary)
- At least 1 from summary/feedback: **yes** (shapingSummary + longTermImpactLines)
- At least 1 from period settlement: **yes** (buildPeriodSummary shaping line)
- Distinguishes growth from background flavor: **yes** (behavior-driven copy, not origin repetition)
- No new system nouns: **yes** (existing habit / echo / flag wiring only)

## Scope guards

- Single route: tavern_hand only
- No farm_peasant or town_apprentice parallel work
- No scholar_house or vivid origin respawn
- No new growth system or panel
- Continuation targets locked: p9_echo_social_hook, p9_early_social_focus, ordinary_tavern_network_fork, p28_social_momentum_network_fork

