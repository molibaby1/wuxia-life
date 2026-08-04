# Late-Life Active Action Player Experience Baseline

日期：2026-08-04  
阶段：Late-Life Active Action Player Experience Baseline  
方案：C（Trace 定位 → 正式 Snapshot → Browser 正式恢复 → 公开信息决策 → 事后 oracle）

## Executive Summary

本阶段完成了 3 条固定样本、4 个年龄窗口、12 个正式 Snapshot 和 60 次真实 Browser API UI 主动行动决策：

| 样本 | 30 | 45 | 60 | 75 | 决策 |
| --- | --- | --- | --- | --- | --- |
| martial / 801 | 30 | 45 | 60 | 75 | 20 |
| wealth / 804 | 30 | 45 | 60 | 76* | 20 |
| balanced / 810 | 30 | 45 | 60 | 75 | 20 |

`wealth/804` 的 75 岁检查点正式落在 76 岁，符合“目标年龄或之后第一个 active_action”。`balanced/810` 使用分析侧 seed override 810；persona 定义中的默认 seed 仍是 808，未修改 persona。

主要事实：

- 12/12 检查点均有 5 个公开行动候选；年龄没有带来新的可见行动结构。
- Browser 恢复后 10/12 个检查点与 Snapshot 的可见年龄精确一致；`wealth/804` 和 `balanced/810` 的 45 岁检查点恢复后显示 46 岁，已记录为 parity drift。
- 60 次选择均能从公开行动名称、收益、消耗和风险形成可读理由；这证明了决策可解释性，不等于证明真实用户会喜欢。
- 60 次结果中 50 次 exact/template repeat；53 次只有即时反馈，7 次出现可见长期影响区或状态回响。
- Browser 选择与事后 oracle 在 39/60 次分歧，divergence rate 为 65%。分歧不是选择前读取 oracle 造成的：oracle 只在选择与正式结果写入后读取。

结论：当前中晚年主动行动的主要问题是“候选集合长期静态 + 结果反馈高度模板化”，而不是行动不可见或 Browser 无法操作。阶段完成后只推荐一个下一 Slice：`B：晚年主动行动结果反馈与长期回响可读性 Slice`；本报告不实施该 Slice。

## Evidence Boundary

已使用：正式 Headless session、`defaultSnapshotConverter`、Snapshot Contract validator、P6B API slot restore、真实 Browser DOM locator/click、API 持久化后的 post-choice Snapshot、现有 persona action oracle。

Browser 选择前只读取页面可见的候选名称、收益方向、公开消耗、风险等级和页面公开资源；没有读取 hidden effects、oracle 分数或未来 Trace。选择后才读取 API Snapshot 和 replay 记录用于结果及 oracle 对照。

Browser 直接观察到的字段为年龄、银两、功力、名望、体魄和 5 个候选按钮。当前连接的 in-app Browser 未提供 390px viewport 控制，因此 mobile390 overflow 记为 evidence gap；桌面 `1280px` 页面检查无横向溢出。Browser 驱动期间出现的 Statsig 网络超时属于浏览器工具外部日志，不属于应用 Console error。

## Baseline Failure Fingerprint

阶段前和阶段后均保持同一非绿色指纹，未新增或扩大失败：

| 命令 | 阶段前 | 阶段后 | 指纹 |
| --- | --- | --- | --- |
| `npm test` | exit 1 | exit 1 | p38/p39/p40 的既有 `p8-scholar-su` opaque ratio `0.5` |
| `npm run validate:event-quality` | exit 1 | exit 1 | scannedEvents=425；blocker=9、major=147、minor=36、total=192 |
| `npm run gate:playability` | exit 1 | exit 1 | 同一 P8 opaque ratio 基线 |
| `npm run gate:p11-scheduling` | exit 0 | exit 0 | P11 pass |
| `git diff --check` | exit 0 | exit 0 | 无 whitespace error |

这些失败不属于本只读基线的产品回归；没有修改 P8、P11、事件、persona、oracle 或产品代码。

## Checkpoint Generation

检查点由正式 runner phase driver 从固定 persona/seed 生成，仅在 `age >= targetAge && sessionPhase === active_planning` 导出。每份 Snapshot 均经过：

```text
defaultSnapshotConverter.toSnapshot
validateGameStateSnapshot
defaultSnapshotConverter.fromSnapshot（恢复前后验证）
```

Schema 为 `3.13.0`，旧版本没有迁移或兼容回退。`wealth/804` 的 target 75 实际年龄为 76；没有伪造 75 岁状态。

最终 manifest：`.tmp/late-life-active-action-baseline/checkpoints/manifest.json`。Snapshot 内容 hash 对 `createdAt`、`updatedAt`、`gameTimestamp` 等运行时噪声做了分析侧归一化；连续生成的 manifest fingerprint/hash 相同。

## Browser State Parity

恢复路径是正式 P6B API slot restore：Browser UI 进入存档槽位 → 点击 `继续` → 服务端 restore → Browser 读取公开页面。12/12 恢复均显示 5 个主动行动候选。

精确 parity 为 10/12。两个差异如下：

| 检查点 | Snapshot age | Browser restore 页面 age | 差异 |
| --- | ---: | ---: | --- |
| wealth / 804 / 45 | 45 | 46 | restore 后正式自动续接跨过一个年龄 |
| balanced / 810 / 45 | 45 | 46 | restore 后正式自动续接跨过一个年龄 |

这不是 Browser 私有状态写入，也不是报告侧修正；它是正式 API restore 在这两个检查点上的可观察恢复漂移，已保留为产品/运行时证据缺口。其余公开字段匹配，且所有检查点都能继续进入 active planning。

## Decision Sample

每个检查点从独立恢复的 Browser 状态开始，连续完成 5 次主动行动，并完整 ack action summary、disturbance、period summary、story continuation，直到下一个 active planning。决策记录位于 `.tmp/late-life-active-action-baseline/observations.json`。

公开决策协议：

- martial：公开成本可承担时优先练功；公开银两不足时先选现金流行动。
- wealth：公开收益直接指向银两与经营时优先营商。
- balanced：依据公开状态和候选集合，避免无理由机械重复，轮换可见方向。

选择分布：

| action | 次数 |
| --- | ---: |
| `action_training_basic` | 24 |
| `action_business_basic` | 24 |
| `action_study_basic` | 4 |
| `action_socializing_basic` | 4 |
| `action_travel_basic` | 4 |

## Action Set Progression

每个窗口的公开候选数均为 5，且行动 ID 集合没有随 30/45/60/75 岁变化。按“实际被选择的行动集合”观察：

- martial 四窗均只选 `training`；相邻窗口 Jaccard=1。
- wealth 四窗均只选 `business`；相邻窗口 Jaccard=1。
- balanced 四窗均选 5 类基础行动；相邻窗口 Jaccard=1。

因此，persona 目标改变了选择分布，但年龄窗口没有产生新行动结构。这里严格区分“公开候选集合”和“本次协议实际选择集合”：前者每窗 5 个，后者体现协议偏好。

## Decision Readability

60/60 被分类为 `CLEAR`：每次公开候选都包含名称、收益方向、消耗和风险；结果页面包含行动名称和行动小结。这个分类只证明公开信息足以支撑本次可审查理由，不代表人类玩家的主观可读性已经完成验收。

未自动判定 `SEMANTIC_REPEAT`，保留人工复核边界；当前结果的语义重复不能仅靠字符串标准化合法下结论。

## Result Repetition

行动结果的可见 DOM 小结提取后：

- exact/template repeat observations：50/60；
- 仅标准化数字和空白后的 template repeat 仍为 50/60；
- semantic repeat：不自动下结论，人工复核队列为空但不表示语义重复不存在。

这说明变化主要来自数值，而不是结果叙事结构；当前结果回馈无法稳定表达“为什么这一期值得做”。

## Long-Term Echo

按选择后的可见长期影响区、正式 post-choice state 和新增 event/replay 证据分类：

- `IMMEDIATE_ONLY`：53/60；
- `STATE_ECHO`：7/60；
- `EVENT_ECHO` / `SUMMARY_ECHO` / `ENDING_ECHO`：本样本未确认。

7 次 state echo 不等价于长期内容已经形成完整链条；它只表示选择后存在可观察的实践/方向状态证据。没有根据时间相邻关系推断因果。

## Browser/Oracle Divergence

oracle 使用现有 `oracle_effect_score_v1`，读取 hidden effects、persona strategy、focus streak 等模拟器信息，仅在 Browser 选择及正式结果写入后执行。

| 指标 | 数值 |
| --- | ---: |
| Browser decisions | 60 |
| same as oracle | 21 |
| divergence | 39 |
| divergence rate | 65% |
| visible risk avoidance | 23 |
| visible state balancing | 16 |

这不是 Browser 错误：玩家根据公开成本/风险做出的选择与读取隐藏 effects 的固定策略不同，正是本阶段需要测量的 simulator bias。

## Product Defects

1. 30/45/60/75 岁的公开行动集合没有新结构，长期窗口看起来像同一套基础行动。
2. 结果小结高度模板化，50/60 次重复；长期影响虽然偶尔出现，但 53/60 次仍停留在即时反馈。
3. 两个 45 岁 API restore 检查点发生 age +1 漂移，正式恢复和生成的 active_action 检查点并不完全 parity。

## Simulator Bias

- Headless/persona oracle 的固定 focus-streak 策略会在连续行动后主动切换类别；Browser 协议可以因公开成本而继续原方向。
- balanced 的 Browser 轮换产生 5 类各 4 次，和 fixed oracle 不同；这不能直接被解释为产品缺陷。
- 三条 persona 不是总体真实玩家样本；结果不能外推用户群体。

## Evidence Gaps

- 当前 in-app Browser 没有 390px viewport 控制，mobile overflow 未完成真实尺寸验收。
- 60 次是受控协议样本，不是用户研究；没有玩家主观评分。
- semantic repeat 未由人工逐条完成语义裁决。
- 45 岁两条 restore drift 的根因需要另一个允许修改正式恢复/volatile 边界的产品 Slice；本阶段禁止修改 Snapshot、PlayerState 和 UI。

## Top 3 Problems

1. 行动结构没有随人生阶段变化。
2. 结果反馈重复，长期回响弱。
3. 正式 restore 在两个中年窗口存在可见年龄漂移。

## Unique Next Slice

只推荐：`B：晚年主动行动结果反馈与长期回响可读性 Slice`。

候选优先级定义如下：

- A：扩充行动集合；
- B：改进行动结果反馈和长期回响表达；
- C：修复 Snapshot/API restore parity；
- D：调整 persona/oracle 选择策略；
- E：扩充晚年事件内容。

选择 B 的原因是：60 次中 50 次结果重复、53 次只有即时反馈，这是最直接、最稳定、且与真实 Browser 玩家可见体验相连的缺陷。A 和 E 在反馈语义未清楚前会扩大内容面；C 只覆盖 2/12 检查点，先记录为 evidence gap；D 会改变本阶段明确禁止的模拟器基线。其余选项不是当前唯一优先级。

本 Slice 只被推荐，不在本阶段实施。

## Do Not Do

- 不把 60 次受控选择宣称为真实用户研究或“好玩分数”。
- 不把 Browser/oracle divergence 自动修成一致；那会抹掉玩家公开决策与模拟器 hidden score 的差异证据。
- 不为 parity drift 增加 Snapshot fallback、迁移或第二 canonical state source。
- 不在本阶段修改主动行动、事件、persona、oracle、PlayerState、Snapshot、UI、P8 或 P11。
- 不进入 Identity、晚年行动实现、长期回响候选实施或其他阶段。

## Verification

专项产物与结果：

```text
npm exec -- tsx tests/experience/lateLifeBaselineTypes.test.ts             → pass
npm exec -- tsx tests/experience/lateLifeBrowserDecisionLog.test.ts       → pass
npm exec -- tsx tests/experience/lateLifeBrowserCheckpointAcceptance.test.ts → pass
npm exec -- tsx tests/experience/compareLateLifeOracleChoices.test.ts     → pass
npm exec -- tsx tests/experience/analyzeLateLifeActiveActions.test.ts     → pass

checkpoint manifest → 12/12
real Browser API UI decisions → 60
Browser parity → 10 exact / 2 drift
oracle comparison → 39/60 divergence
```

阶段前后完整 gate 退出码与既有 failure fingerprint 见上文；阶段结束时未命中 current-product-stage.md 定义的结构性 blocker。

