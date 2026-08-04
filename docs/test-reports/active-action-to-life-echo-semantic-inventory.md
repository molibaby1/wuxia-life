# Active Action-to-Life Echo Semantic Inventory

> 阶段：Active Action-to-Life Echo Semantic Inventory
>
> 日期：2026-08-04
>
> 类型：只读事实核对与产品裁决输入；本报告没有实施长期回响。

## 1. Executive Summary

当前主动行动已经拥有一条完整的正式事实链：

```text
activeActionCatalog
  → ActivePlanningService.executeActiveActionOnState
  → ActionResultResolver + public stat delta
  → lifeStates / flags / actionHistory / actionFocusStreak / numeric state
  → formal EventLoader consumers
  → period summary / Life Memory / ending recap / existing UI
```

结论不是“缺少长期回响状态”，而是“事实已经产生，正式 consumer 也存在，但很多 consumer 没有在本次五次窗口中触发，或没有在玩家最容易看到的时点被表达出来”。

关键数字：

| 事实 | 结果 |
| --- | ---: |
| 正式主动行动 | 5 个 |
| 可复用 Browser observation | 60 条、12 个 checkpoint |
| 上一阶段 `IMMEDIATE_ONLY` | 53 / 60 |
| 本报告逐条复核后：`ANALYSIS_FALSE_NEGATIVE` | 2 |
| 本报告逐条复核后：`CONSUMER_NOT_TRIGGERED_IN_WINDOW` | 43 |
| 本报告逐条复核后：`PERSISTED_BUT_INVISIBLE` | 8 |
| `trainingHabit` formal event readers | 9 |
| `studyHabit` formal event readers | 10 |
| `businessHabit` formal event readers | 5 |
| 需要新增 canonical state 的证据 | 不足 |

唯一推荐的下一产品 Slice 是 **B：利用现有 canonical facts，改善主动行动结果与长期实践回响的玩家可读表达**。它不需要新增 PlayerState、Snapshot 或通用因果框架，覆盖的是已存在的五类行动事实和当前 53 条样本中最主要的“已持久化但未及时可读”缺口。本报告只推荐，不实施。

本阶段没有命中 `current-product-stage.md` 定义的结构性 blocker，完成后停止，不进入 Action-to-Life Echo 实施、晚年行动或长期回响扩展。

## 2. 证据边界与方法

使用的正式来源：

- `src/data/activeActionCatalog.ts`
- `src/core/activePlanning/ActivePlanningService.ts`
- `src/core/activePlanning/ActionResultResolver.ts`
- `src/core/activePlanning/activeActionSummaryBuilder.ts`
- `src/utils/practiceTrajectorySummary.ts`
- `src/core/deriveLifeMemorySummary.ts`
- `src/core/EndingSystem.ts`
- `src/core/endingPresentation.ts`
- `src/p19/finalSummaryComposition.ts`
- `src/p12/readerRegistry.ts` 与 `src/narrative/NarrativeConfigLoader.ts`
- 正式 EventLoader 清单及其 loaded event JSON
- Snapshot 3.13.0、Life Memory 3.0.0 的现有测试与 contract
- `.tmp/late-life-active-action-baseline/observations.json`
- `.tmp/late-life-active-action-baseline/analysis.json`
- `.tmp/late-life-active-action-baseline/checkpoints/manifest.json`
- `.tmp/late-life-active-action-baseline/browser-parity.json`
- `.tmp/late-life-active-action-baseline/oracle-comparison.json`
- `.tmp/late-life-active-action-result-differentiation/browser-scenarios.json`

判断规则：

1. 只使用正式 action ID、正式 state read/write 和真实 observation evidence；不从 event ID、正文或测试标签反推身份或因果。
2. “formal consumer”必须位于当前 loaded EventLoader 或正式 runtime/UI/summary 路径，并直接读取目标事实。
3. “存在 formal consumer”不等于“本条 observation 已产生可见长期回响”。必须另记实际 post-choice event、summary 或 ending evidence。
4. `actionSummary.longTermImpactLines` 是当前结果卡中的即时状态确认，不自动等同于一个新的 deferred long-term echo subsystem。
5. 本报告没有重跑完整 60 次 Browser 决策，没有新增测试、脚本、state、Contract 或 UI。

## 3. 概念拆分

本次核对继续把下列概念视为不同层次：

| 概念 | 当前正式含义 | 本报告是否把它当成 action-to-life echo |
| --- | --- | --- |
| Affiliation | `player.affiliation` 的门派、组织、阵营归属 | 否 |
| Occupation | 商人、学者等较长期的职业方向或实践轴 | 仅以现有 `businessHabit` / `studyHabit` 事实核对，不新增职业字段 |
| Reputation title | 社会评价、江湖称号、`player.title` | 否 |
| Life identity | 当前主要人生定位 | 否；不能由 action 文本临时推导 |
| Narrative route | 事件和阶段摘要中的路线叙事 | 只作为正式事件 context，不等于行动事实 |
| Ending classification | `EndingSystem` 的最终结局分类 | 否；ending explanation 可以读取实践事实，但不改变分类 owner |
| Practice trajectory | `trainingHabit`、`studyHabit`、`businessHabit` 派生出的实践轨迹 | 是当前最接近的既有长期塑形事实 |
| Immediate result | before/after public delta、递减和资源压力的本期反馈 | 是即时结果，不是长期回响 |

因此，当前代码主要表现为“尚未把所有语义做成统一身份模型”，而不是已知地把 affiliation、occupation、title、route 和 ending 混成同一字段。特别是 socializing/travel 不能因为有 `p9` flags 就被改写成职业或身份。

## 4. 正式主动行动 producer inventory

正式入口只有 `src/data/activeActionCatalog.ts` 的五个 `P7_MINIMUM_ACTION_IDS`。执行 owner 是 `ActivePlanningService.executeActiveActionOnState`；实际 reward/cost/diminishing-return owner 是 `ActionResultResolver.resolveActiveAction`；行动完成后的 habit/flag/history 写入也在同一正式执行链中。

| action ID / category | 即时公开效果 | canonical persistent writes | 正式长期消费面 | 观察结论 |
| --- | --- | --- | --- | --- |
| `action_training_basic` / training | `martialPower`、`constitution`、`money` | `lifeStates.trainingHabit += 1`（封顶 5）；`p9_echo_training_hook`、`p9_early_training_focus`；`actionHistory`；`actionFocusStreak`；numeric state/time | habit event gates、P9 hook/early-focus events、practice trajectory、Life Memory、period/final recap、ending explanation | facts 充足；晚年重复时 habit 常因封顶不再产生新 delta |
| `action_study_basic` / study | `comprehension`、`knowledge`、`charisma`、`money` | `lifeStates.studyHabit += 1`（封顶 5）；`p9_echo_study_hook`；`actionHistory`；`actionFocusStreak`；numeric state/time | study habit event gates、P9 hook、practice trajectory、Life Memory、period/final recap、ending explanation | facts 充足；当前样本较少，不能据此判断 study 路线内容密度 |
| `action_socializing_basic` / socializing | `connections`、`charisma`、`reputation`、`money` | 无 dedicated habit；`p9_echo_social_hook`、`p9_early_social_focus`；`actionHistory`；`actionFocusStreak`；numeric state/time | P9 hook/early-focus events、P7 history/report、通用 flag presentation | 有 canonical flags/history，但没有对应 practice trajectory axis |
| `action_business_basic` / business | `money`、`businessAcumen`、`reputation` | `lifeStates.businessHabit += 1`（封顶 5）；`p9_echo_business_hook`、`p9_early_business_focus`；`actionHistory`；`actionFocusStreak`；numeric state/time | business habit event gates、P9 hook/early-focus events、practice trajectory、Life Memory、period/final recap、ending explanation | facts 充足；样本中的 wealth 方向与既有 business facts 对齐 |
| `action_travel_basic` / travel | `knowledge`、`connections`、`reputation`、`money` | 无 dedicated habit；`p9_echo_travel_hook`、`p9_early_travel_focus`；demonic route 下改写为 `p9_demonic_restless_journey`；`actionHistory`；`actionFocusStreak`；numeric state/time | P9 hook/early-focus 或 demonic flag consumers、P7 history/report、通用 flag presentation | 有 canonical flags/history，但没有对应 practice trajectory axis |

所有 action 都还会产生时间推进与实际 public before/after delta。`actionHistory` 是正式 Snapshot 状态，并被 P7/report、P11 scheduling 与历史测试使用；它不是本阶段应新建的“行动回响历史机制”。`actionFocusStreak` 是正式递减输入，不是玩家身份来源。

## 5. Canonical persistent fact inventory

| 事实 | owner / producer | 生命周期 | 持久化 | canonical 性 | 玩家可见边界 |
| --- | --- | --- | --- | --- | --- |
| `player.lifeStates.trainingHabit` | action completion + `applyPracticeHabitEffects` | 当前人生全程，0–5 | Snapshot 3.13.0 | 是 | 通过 action result、Life Memory、summary/ending recap 间接可见 |
| `player.lifeStates.studyHabit` | 同上 | 当前人生全程，0–5 | Snapshot 3.13.0 | 是 | 同上 |
| `player.lifeStates.businessHabit` | 同上 | 当前人生全程，0–5 | Snapshot 3.13.0 | 是 | 同上 |
| `state.flags` / `player.flags` action completion flags | `ActivePlanningService` | 当前人生；事件可继续读取 | Snapshot 3.13.0 | 是 | 仅在 `isPlayerVisibleFlag` 与正式 event presentation 允许时可见 |
| `state.actionHistory` | `appendActionHistory` | 每次 action / disturbance 追加 | Snapshot 3.13.0 | 是 | 当前不是独立长期回响 UI；供 report/scheduling/history 使用 |
| `state.actionFocusStreak` | `updateFocusStreak` | 当前连续行动窗口 | Snapshot 3.13.0 | 是 | 递减文案只显示公开的“收益递减”，不暴露阈值 |
| player numeric stats / time | action resolver + state executor | 当前人生全程 | Snapshot 3.13.0 | 是 | action result、属性面板、summary 等 |
| event history / facts / relations | EventExecutor / formal events | 事件生命周期 | Snapshot 3.13.0 | 是 | Life Memory、summary、ending 等各自消费 |
| `LifeMemorySummary.habitTrajectory` | `deriveLifeMemorySummary` | 每次派生 | 不重复持久化；derived-only | 是派生 Contract，不是新事实 | `LifeMemoryPanel` 玩家可见 |

### 5.1 信息损失

现有三项 habits 能区分主要 practice axis，但会有意丢失：

- 具体 action 次数与每次实际 delta；
- action 的时间顺序；
- habit 增长来自 action 还是其他事件 effect；
- 封顶 5 以后重复行动的差异；
- socializing 与 travel 的实践方向，因为它们没有 dedicated habit axis。

这些是聚合事实的产品取舍，不足以证明应该新增 `action history` 或通用因果 state。已有 `actionHistory` 已经记录了正式执行事实，但禁止把它另包装为第二套长期回响框架。

## 6. Formal consumer inventory

### 6.1 Formal loaded event consumers

`src/data/events.json` 及其 EventLoader imports 是正式事件入口。静态读取当前 loaded events 得到以下按信号分组的 consumer 集合；下列数字是 event-condition readers，不是本次 60 条 observation 的实际触发次数。

| canonical signal | loaded event readers | 代表性 consumer | 消费方式 | 当前窗口实际证据 |
| --- | ---: | --- | --- | --- |
| `trainingHabit` | 9 | `setback_cultivation_deviation`、`p21_*`、`p26_*`、`p42_*`、sample-lines spine | condition gate / payload | 大量已持久化但本条没有 callback；1 条 observation 有 `sect_midlife_stewardship` continuation |
| `studyHabit` | 10 | `p21_*`、`p27_study_habit_healer_reinforcement`、`p29_study_habit_case_record_duty`、`p42_*`、sample-lines spine | condition gate / payload | 本次没有 continuation event；Life Memory/ending 等其他 consumer 仍存在 |
| `businessHabit` | 5 | `p21_*`、`p26_business_habit_obligation`、`p42_business_habit_midlife_syndicate`、merchant/sample-lines consumers | condition gate / payload | 1 条 observation 有 `merchant_midlife_debt_milestone` continuation，其余未在本窗口触发 |
| `p9_echo_*` flags | 多个 P9 callback events | `p9_*` hook callbacks | flag gate | observation 中未因 action summary 单独形成额外 callback；flag write 是真实的 |
| `p9_early_*` flags | P11/P9 early-focus consumers | early-focus event gates | flag gate | 未在 53 条 immediate-only 中观察到对应 callback |
| `p9_demonic_restless_journey` | demonic route events | travel special route | route-specific flag gate | 本次三 persona 样本不构成该 route 的证据 |

Formal event presence is not actual causality. `sect_midlife_stewardship` 和 `merchant_midlife_debt_milestone` 被记录为 post-choice continuation evidence，但没有把 event ID 或正文当作新的 action identity，也没有宣称它们只由该 action 造成。

### 6.2 Summary、Life Memory、ending 与 UI

| consumer owner | 读取 | surface / 生命周期 | 当前判断 |
| --- | --- | --- | --- |
| `activeActionSummaryBuilder` + `ActivePlanningService` | actual public delta、递减、当前 money、habit/flag delta | 本期 action result | 唯一即时结果表达 owner；`longTermImpactLines` 是当前卡片的状态确认 |
| `GameScreen.vue` | shared action summary DTO | Local/API/Browser action card | 使用同一语义对象；没有第二套 Browser echo builder |
| `practiceTrajectorySummary.ts` | 三项 habits | action result、period growth、late-life recap | 既有共享派生 helper |
| `deriveLifeMemorySummary.ts` | 三项 habits | Life Memory 生成 | `habitTrajectory` derived-only，未新增冗余 persistence |
| `LifeMemoryPanel.vue` | `habitTrajectory` | 玩家可见长期塑形面板 | 当前最明确的长期实践 consumer |
| `periodSummaryBuilder.ts` | practice trajectory / public state | period summary | 可消费既有实践轨迹；不是新 action history |
| `p19/finalSummaryComposition.ts` | late-life practice recap | final summary | 正式 final summary consumer |
| `EndingSystem.ts` | late-life practice recap fallback | ending summary fallback | 读取实践事实，但不把它变成 ending classification source |
| `endingPresentation.ts` | training/business/study habit values | `quiet_family_life` explanation axis | 只改变解释文案；不改变 ending ID/classification |
| `MainScreenLifeSummary.vue` / `mainScreenModel.ts` | goal、affiliation、experience、risk、numeric tendency | 人生摘要 | 不把 habits 自动升级成 identity；practice 不应与 affiliation/title 混合 |
| Local/API/Headless DTO mappers | shared summary / Life Memory | transport boundary | 目前没有发现平行的 long-term echo DTO owner |

P44 audit 进一步确认 4 个 engine recap surface 已接入既有 helper：Life Memory、P19 final summary、Ending fallback 及相应 summary surface；`EndingScreen.vue` 的直接 UI wiring 仍属于 deferred boundary。本报告不接线。

### 6.3 Formal、deferred、analysis-only 的分离

| 来源 | 分类 | 说明 |
| --- | --- | --- |
| `EventLoader` loaded events | formal runtime | 当前正式事件条件与 payload reader |
| `NarrativeConfigLoader.resolveConfiguredAge40Identity`、`resolveConfiguredEchoSummaryVars`、`resolveEchoHookForFlags` | formal config/profile reader | 由 `readerRegistry` 的 profile-first 路径登记；是配置读取，不是第二个 canonical state owner |
| `src/narrative/config/echoHooks.ts` | formal authoring/config contract | 描述 source action、hook flag、callback event、age、targets、summary contribution；只有实际被正式 reader 读取的部分计入 runtime 事实图 |
| `config/echoHooks.getEchoHookByFlag` 旧 helper、旧 summary template、route/stage helper | deferred / historical | `readerRegistry` 已将其列为 deferred；不计入正式 consumer coverage |
| `src/p8/collectPersonaMetrics.ts`、P9 simulation metrics | analysis-only | 可记录 configured echo/metrics，不是玩家正式长期回响 consumer |
| tests、baseline labels、`presentation.longTermEcho` | evidence/analysis label | 用于观察分类，不是 canonical state、producer 或 consumer |

## 7. Echo Matrix

| action | canonical facts | formal event consumer | summary / memory / ending | player-visible now | deferred / analysis-only | primary diagnosis |
| --- | --- | --- | --- | --- | --- | --- |
| training | `trainingHabit`、training flags、history、streak、numeric delta | 9 habit readers + P9/P11 hooks | action card、period trajectory、Life Memory、final/ending recap、quiet-family explanation | public delta；habit delta 时显示“练功实践有所积累” | old echo helpers、P8 metrics | persisted fact exists; many late-life readers not triggered |
| study | `studyHabit`、study flag、history、streak、numeric delta | 10 habit readers + P9 hook | same practice surfaces | public delta；habit delta 时显示 study line | same | persisted fact exists; sample coverage thin |
| socializing | social/early flags、history、streak、numeric delta | P9/P11 flag readers | no dedicated practice trajectory; history/report only | public social delta; no stable long-term axis | P8/P9 metrics | persisted but no dedicated visible practice consumer |
| business | `businessHabit`、business flags、history、streak、numeric delta | 5 habit readers + P9/P11/merchant readers | same practice surfaces and ending explanation | public money/business/renown delta; habit line when delta appears | same | persisted fact exists; late-life readers not triggered |
| travel | travel/early or demonic flag、history、streak、numeric delta | P9/P11/route readers | no dedicated practice trajectory; history/report only | public knowledge/connections/renown delta | route/config metrics | persisted flags but no dedicated visible practice consumer |

The matrix shows the main gap is consumer timing and expression, not producer absence. The axis is not symmetric: the three habits have a shared trajectory consumer; socializing/travel remain flag/history based. That asymmetry is a product semantic fact and should not be silently “fixed” by treating every action as an occupation.

## 8. `trainingHabit` / `studyHabit` / `businessHabit` sufficiency

### 8.1 Evidence

P44's formal loaded-event scan reports:

| axis | producer | Snapshot | event readers | derived/player-visible consumers | sufficiency |
| --- | --- | --- | ---: | --- | --- |
| training | `action_training_basic` | yes, 0–5 | 9 | action card, Life Memory, period/final/ending recap | sufficient for current Slice |
| study | `action_study_basic` | yes, 0–5 | 10 | action card, Life Memory, period/final/ending recap | sufficient for current Slice |
| business | `action_business_basic` | yes, 0–5 | 5 | action card, Life Memory, period/final/ending recap | sufficient for current Slice |

Each axis has a stable producer, lifecycle, persistence, formal readers and at least one player-facing consumer. The aggregate loses order and per-action detail, but no evidence says those dimensions are required for the proposed next Slice. Therefore the strict new-state necessity test for candidate D fails.

### 8.2 What is not sufficient

The existing habits do not by themselves model affiliation, occupation, title, identity, route or ending classification. They are practice facts. Socializing and travel also have no habit axis. Any future product decision must specify whether it wants a practice recap, a profession model, a title, or a narrative route before deciding on state.

## 9. 53 条 `IMMEDIATE_ONLY` 逐条复核

上一阶段的 `IMMEDIATE_ONLY` 是 presentation classification，而不是 canonical-state absence proof。以下逐条表保留了 observation 的 global review number、checkpoint、checkpoint-local sequence、年龄、action 和实际 continuation event。

分类定义：

- `ANALYSIS_FALSE_NEGATIVE`：上一分类只看 immediate presentation，但该 observation 有真实 post-choice continuation event evidence；这证明存在 deferred event evidence，不证明 event 只由该 action 造成。
- `CONSUMER_NOT_TRIGGERED_IN_WINDOW`：action 写入已有 canonical fact，且存在 formal consumer，但本条选择后的窗口没有观察到该 consumer 的 callback/summary/ending evidence。
- `PERSISTED_BUT_INVISIBLE`：action 写入 flags/history 等正式事实，但当前没有对应 dedicated practice trajectory 或可见长期 consumer evidence。
- `TRUE_IMMEDIATE_ONLY`：没有任何 relevant persistent fact；本批没有符合这一条件的行。
- `INSUFFICIENT_EVIDENCE`：证据无法区分以上类型；本批没有强行使用这一类。

复核结果：`ANALYSIS_FALSE_NEGATIVE` 2、`CONSUMER_NOT_TRIGGERED_IN_WINDOW` 43、`PERSISTED_BUT_INVISIBLE` 8、其他 0。换言之，原始 53/60 不能被解释为 53 个缺失长期事实；其中 45 条属于已有 practice facts 的观察窗口/表达问题（含 2 条原分析漏报的 downstream event evidence），另 8 条是 flags/history 已持久化但没有 dedicated practice consumer 的行动。

| # | checkpoint | local seq | age | action | revised classification | actual continuation |
| ---: | --- | ---: | ---: | --- | --- | --- |
| 1 | martial-801-age-30 | 1 | 30 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 2 | martial-801-age-30 | 2 | 30 | training | ANALYSIS_FALSE_NEGATIVE | `sect_midlife_stewardship` |
| 3 | martial-801-age-30 | 3 | 31 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 4 | martial-801-age-30 | 4 | 31 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 5 | martial-801-age-30 | 5 | 31 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 6 | martial-801-age-45 | 1 | 45 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 7 | martial-801-age-45 | 2 | 46 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 8 | martial-801-age-45 | 3 | 46 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 9 | martial-801-age-45 | 4 | 46 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 10 | martial-801-age-45 | 5 | 46 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 11 | martial-801-age-60 | 1 | 60 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 12 | martial-801-age-60 | 2 | 60 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 13 | martial-801-age-60 | 3 | 61 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 14 | martial-801-age-60 | 4 | 61 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 15 | martial-801-age-60 | 5 | 61 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 16 | martial-801-age-75 | 1 | 75 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 17 | martial-801-age-75 | 2 | 75 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 18 | martial-801-age-75 | 3 | 76 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 19 | martial-801-age-75 | 4 | 76 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 20 | martial-801-age-75 | 5 | 76 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 21 | wealth-804-age-30 | 2 | 31 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 22 | wealth-804-age-30 | 3 | 31 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 23 | wealth-804-age-30 | 4 | 31 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 24 | wealth-804-age-30 | 5 | 31 | business | ANALYSIS_FALSE_NEGATIVE | `merchant_midlife_debt_milestone` |
| 25 | wealth-804-age-45 | 1 | 45 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 26 | wealth-804-age-45 | 2 | 45 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 27 | wealth-804-age-45 | 3 | 46 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 28 | wealth-804-age-45 | 4 | 46 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 29 | wealth-804-age-45 | 5 | 46 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 30 | wealth-804-age-60 | 1 | 60 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 31 | wealth-804-age-60 | 2 | 60 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 32 | wealth-804-age-60 | 3 | 60 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 33 | wealth-804-age-60 | 4 | 60 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 34 | wealth-804-age-60 | 5 | 61 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 35 | wealth-804-age-75 | 1 | 76 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 36 | wealth-804-age-75 | 2 | 77 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 37 | wealth-804-age-75 | 3 | 77 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 38 | wealth-804-age-75 | 4 | 77 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 39 | wealth-804-age-75 | 5 | 77 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 40 | balanced-810-age-30 | 3 | 30 | socializing | PERSISTED_BUT_INVISIBLE | — |
| 41 | balanced-810-age-30 | 5 | 31 | travel | PERSISTED_BUT_INVISIBLE | — |
| 42 | balanced-810-age-45 | 1 | 45 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 43 | balanced-810-age-45 | 3 | 45 | socializing | PERSISTED_BUT_INVISIBLE | — |
| 44 | balanced-810-age-45 | 5 | 46 | travel | PERSISTED_BUT_INVISIBLE | — |
| 45 | balanced-810-age-60 | 1 | 60 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 46 | balanced-810-age-60 | 3 | 60 | socializing | PERSISTED_BUT_INVISIBLE | — |
| 47 | balanced-810-age-60 | 4 | 60 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 48 | balanced-810-age-60 | 5 | 61 | travel | PERSISTED_BUT_INVISIBLE | — |
| 49 | balanced-810-age-75 | 1 | 75 | training | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 50 | balanced-810-age-75 | 2 | 75 | study | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 51 | balanced-810-age-75 | 3 | 76 | socializing | PERSISTED_BUT_INVISIBLE | — |
| 52 | balanced-810-age-75 | 4 | 76 | business | CONSUMER_NOT_TRIGGERED_IN_WINDOW | — |
| 53 | balanced-810-age-75 | 5 | 76 | travel | PERSISTED_BUT_INVISIBLE | — |

### 9.1 Review by action

| action | immediate-only rows | revised split |
| --- | ---: | --- |
| training | 23 | 22 not triggered, 1 event evidence |
| study | 1 | 1 not triggered |
| business | 21 | 20 not triggered, 1 event evidence |
| socializing | 4 | 4 persisted but invisible |
| travel | 4 | 4 persisted but invisible |

The result does not authorize new event wiring. It says exactly where the current observation is blind: event consumers may be age/condition gated, while social/travel lack the shared practice axis that training/study/business already have.

## 10. A–E candidate comparison

Because the design document intentionally leaves product alternatives open, this report defines the five decision candidates explicitly rather than pretending they are existing runtime concepts.

| candidate | scope / sample coverage | player perception point | systems touched | new state | event-quality risk | evidence strength | decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | Re-polish only the immediate result card; potential 53/60 rows, but does not add lifecycle visibility | immediately after action | existing result builder + existing UI | no | none | strong | reject: P7 immediate differentiation is already closed; it does not address deferred visibility |
| B | Use existing habits/flags and existing summary/Life Memory/ending consumers; 5 actions, all 60 observations potentially covered, with the main target being 43 not-triggered + 8 invisible rows | action result plus next summary/Life Memory/ending checkpoint | existing practice helper, summary, Life Memory and presentation consumers | no | low | strong | **recommend one Slice** |
| C | Ending-only recap or ending explanation expansion; 60/60 can be mentioned only at life end | final ending screen | ending presentation / final summary | no | medium | moderate | reject: too late to explain a decision and cannot repair the action-to-life loop |
| D | New canonical action-to-echo state or general action-history causal layer | any future checkpoint | PlayerState, Snapshot, Contract, executor, DTOs, UI and migration | yes | high | weak | reject: existing facts pass the sufficiency test; fails strict new-state necessity |
| E | Add/expand formal event callback content for each action family; theoretical 53/60 coverage | deferred event callback | event JSON, EventLoader pools, quality gates, Browser/event tests | no new state required in the narrow version | high | moderate-to-weak | reject: current event-quality gate is already non-green and the sample does not establish which callbacks are missing |

Quantitative comparison is intentionally multi-axis rather than one weighted score: observation coverage, actual sample diagnosis, systems touched, state requirement, and gate risk remain separately visible. Candidate B has the strongest evidence-to-change ratio and is the only recommendation.

## 11. PD-033 合并状态

`docs/governance/product-decisions.md` 中的 PD-033 已存在，且与本次 inventory 的事实边界一致：

- actual before/after delta 是结果事实；
- 不重新执行 effects，不用理论 reward 覆盖实际结算；
- 正、负、零、混合 delta 都要准确表达；
- 递减可以公开表达，但不泄露内部阈值；
- Local/API/Headless/Browser 共享语义；
- 不宣称尚未发生的事件、阶段回响或结局；
- 不新增 action history 作为结果展示机制。

因此本阶段的“PD-033 合并”结论是 **已核对、无需重复修改**。没有修改 `product-decisions.md`，避免制造重复决策或无意义 diff。

## 12. Failure fingerprint

### 12.1 既有参考指纹

上一阶段报告记录的参考指纹是：

```text
npm test                       exit 1：P8 p38/p39/p40；p8-scholar-su opaque ratio 0.5
npm run validate:event-quality exit 1：425 events；blocker 9 / major 147 / minor 36
npm run gate:playability      exit 1：同一 P8 baseline
npm run gate:p11-scheduling   exit 0
git diff --check               exit 0
```

### 12.2 本阶段前实跑指纹

本次在写入本报告前实际执行，结果为：

```text
npm test                       exit 1：P9 near-duplicate 8 vs baseline 3；p38 opaque ratio 0.5；p39 gate:playability fail；p40 near-duplicate pairs 8 > 3
npm run validate:event-quality exit 1：425 events；blocker 9 / major 147 / minor 36
npm run gate:playability      exit 1：既有 P8 playability baseline failure
npm run gate:p11-scheduling   exit 0
git diff --check               exit 0
```

P9 的近重复指纹是当前 checkout 的运行结果，不能被本次只读报告归因；本阶段没有修改 P9、persona、oracle、事件或产品代码。阶段后会再次运行同一组命令，只有“未新增本阶段相关 failure”才可作为 closure 结论。

### 12.3 本阶段后实跑指纹

写入本报告和阶段看板后，使用同一组命令再次执行：

```text
npm test                       exit 1：P9 causality changes 2 vs 2；p39 gate:playability fail；p40 near-duplicate pairs 8 > 3；本次 p38 通过
npm run validate:event-quality exit 1：425 events；blocker 9 / major 147 / minor 36
npm run gate:playability      exit 1：Decision FAIL；blockers 2；warnings 3；既有 P8 playability baseline
npm run gate:p11-scheduling   exit 0
git diff --check               exit 0
```

前后没有出现本阶段代码、事件、Contract 或 UI 相关的新失败。`npm test` 中 P9 的具体随机断言文本在两次运行间变化，但仍属于既有 P8/P9/p39/p40 指纹家族；p38 在阶段后本次通过。该波动不作为产品结论，也不构成结构性 blocker。

## 13. 已确认事实、合理推断、尚待裁决

### 已确认事实

- 五个正式 action 有唯一正式执行 owner。
- 三项 habit 是 Snapshot 3.13.0 中的 canonical persistent facts，值域为 0–5。
- `actionHistory` 与 `actionFocusStreak` 已存在，不需要本阶段新建。
- formal loaded events 直接读取三项 habit 与 P9 flags；数量见上表。
- Life Memory 的 `habitTrajectory` 是 derived-only，并且已有玩家可见 panel。
- ending classification owner 不读取 habits 作为新的 ending ID source；ending explanation/fallback 可以读取实践 recap。
- Browser baseline 的 53/60 是 presentation observation label，不是事实缺失计数。
- Local/API/Headless/Browser 已共享主动行动结果语义；本阶段没有发现第二套 echo builder。

### 合理推断

- 大多数 late-life immediate-only 是正式 event consumer 未在该年龄/条件窗口触发，或 action result 没有把已存在的 downstream meaning 放到可见时间线上。
- socializing/travel 的长期语义目前更接近 flags/history，而非三项 practice occupation；不能仅凭事件 hook 将它们升级为职业或身份。
- 53 条中的 2 条 post-choice continuation event 说明原始分类存在分析漏报，但不能单凭 event ID 证明 action 的唯一因果贡献。
- 现有 habits 对“实践回顾/有限 callback/ending explanation”足够，对“职业系统/身份系统/行动因果历史”并不自动足够；这些是不同产品问题。

### 尚待产品裁决的问题

- 产品是否要让“行动之后立即知道它会在何时以什么形式回响”成为明确体验承诺。
- socializing/travel 是否需要与三项 practice axis 平行的长期语义，还是保持一次性 social/travel flags 与 event route。
- habit 5 之后的重复行动是否仍要显示“实践继续”，以及该显示属于即时结果、period summary 还是 Life Memory。
- EndingScreen 的 deferred UI wiring 是否属于后续 B Slice，而不是把 ending explanation 误写成新的 classification。

## 14. 明确不建议做什么

- 不新增 `actionHistory`、`echoHistory`、通用 causal graph 或新的 persistent action-to-life state；正式 action history 已存在，重复建模会制造两个事实源。
- 不从 event ID、正文或测试标签推导 identity、occupation、affiliation、title 或 route。
- 不把 `trainingHabit`、`studyHabit`、`businessHabit` 直接改名为职业、身份或称号。
- 不把 socializing/travel 的 P9 flags 自动升级为 canonical occupation。
- 不为了解释 53/60 立即扩大事件池；当前 event-quality gate 仍有 9 blocker、147 major、36 minor。
- 不把 `EndingSystem` 的 recap 文案当成 ending classification source。
- 不在本阶段修复 P8/P9、oracle、persona、Snapshot parity drift 或历史事件质量。

## 15. 唯一下一 Slice 推荐与阶段收口

推荐：**B：利用现有 canonical facts，改善主动行动结果与长期实践回响的玩家可读表达。**

推荐理由：

1. 覆盖面最大：五类 action 都已有正式事实；本次 53 条中 43 条已有 formal consumer 但未在窗口触发，另 8 条至少有持久化 flags/history。
2. 风险最小：不需要新增 state、Snapshot、Contract、事件或通用因果框架。
3. 证据最强：P44、Life Memory、final summary、ending explanation 与既有 Browser observation 已共同证明现有 facts 可用。
4. 玩家时点更合理：可以在 action result、period summary、Life Memory 或现有 ending presentation 的既有边界内表达，而不是等到最终结局才第一次告诉玩家。

B 没有在本阶段实施。报告完成即停止；不会进入 B 的实现、Action-to-Life Echo、晚年行动或长期回响候选扩展。

## 16. 本阶段变更清单

- 新增本报告：`docs/test-reports/active-action-to-life-echo-semantic-inventory.md`
- 更新 `docs/governance/current-product-stage.md` 记录本只读阶段、事实结论、唯一推荐和停止边界
- 未修改产品代码、测试、事件、条件、调度、summary、Life Memory、ending、PlayerState、Snapshot、Contract、UI、persona、oracle、P8、P11 或 `product-decisions.md`
