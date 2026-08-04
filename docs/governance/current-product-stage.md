# Wuxia-Life 当前产品阶段

用途：为 ChatGPT、Codex 和人工维护者提供当前唯一工作目标。本文是滚动看板，不是长期产品规范。最后更新：2026-08-04

1. 当前阶段

Active Action Canonical Practice Visibility Slice 已完成并关闭。

上一阶段 inventory 唯一推荐 B 的收窄版本已完成：

复用现有 canonical practice facts，在正式主界面“人生摘要”中独立展示玩家当前已经形成的练功、读书与营生实践轨迹。

本阶段只改善既有事实的玩家可见表达，不建立主动行动到未来事件的因果链，不承诺后续事件、阶段回响或结局。

本阶段已停止，不进入 socializing/travel 长期语义、事件回调、ending、action history 或其他相邻系统。

2. 产品语义

本阶段展示的是当前已经成立的实践累计事实：

trainingHabit → 练功实践
studyHabit    → 读书实践
businessHabit → 营生实践

正式 tier 继续使用既有 Life Memory 语义：

1 → 有过实质实践
2 → 开始重复
3 → 较为稳定
4 → 长期深入
5 → 贯穿多个阶段

玩家可见表达示例：

实践    练功实践 · 长期深入 / 读书实践 · 开始重复

没有可见 practice trajectory 时：

实践    尚未形成持续实践

该字段只陈述当前事实，不得表达或暗示：

玩家已经成为某种职业或身份；

某项实践已经成为正式人生路线；

后续一定会出现某个事件或机会；

某个 ending 将因此发生；

某一次主动行动与某个未来事件存在已确认的单独因果关系。

3. 已确认事实

正式主动行动仍为 training、study、socializing、business、travel。

trainingHabit、studyHabit、businessHabit 是现有 canonical practice facts，值域为 0–5。

三项 facts 已持久化于 Snapshot 3.13.0，本阶段不修改 Snapshot、Schema 或 Contract。

Life Memory 3.0.0 的 deriveLifeMemorySummary() 已将三项 facts 派生为 LifeMemorySummary.habitTrajectory。

habitTrajectory 已拥有正式 label、tier、排序与 visibility；它是本阶段唯一 practice presentation source。

GameScreen.vue 的 Local/API 路径均已将 Life Memory summary 传给 buildMainScreenModel()。

MainScreenLifeSummary.vue 是当前正式挂载、非 ending、玩家持续可见的“人生摘要”consumer。

periodSummaryBuilder.ts 已有 practice trajectory consumer，不是本阶段缺失点。

主动行动结果卡已经负责本次 actual before/after delta 与实际 habit 增量提示，不属于本阶段修改范围。

LifeMemoryPanel.vue 当前未挂载；本阶段不接入整个面板。

当前 Browser ending 没有形成通用 Life Memory practice 展示；ending 不属于本阶段。

socializing/travel 没有 dedicated practice habit axis；现有 flags/history 不足以支持与三项 habit 对称的长期实践表达。

practice habits 不得定义 tendencySummary、Affiliation、Title、Occupation、identity、route 或 ending classification。

4. 实施目标与正式数据链

正式数据链必须保持为：

PlayerState.lifeStates
  → deriveLifeMemorySummary()
  → LifeMemorySummary.habitTrajectory
  → buildMainScreenModel()
  → MainScreenLifeSummary.vue

实施要求：

在 MainScreenModel 中增加独立的 practice summary 字段。

该字段只从 LifeMemorySummary.habitTrajectory 派生。

只消费 visibility === 'player' 的 entries。

保持现有 trajectory 排序，最多展示前两项。

在 MainScreenLifeSummary.vue 中新增独立“实践”行。

“实践”不得替换、修改或参与现有“倾向”计算。

Local/API 继续共享同一个 buildMainScreenModel()，不得建立平行 builder。

不得直接从 player.lifeStates 在 UI/ViewModel 层重新实现：

tier 映射；

practice label；

排序；

visibility；

另一套 practice trajectory 选择规则。

5. 允许修改范围

允许修改：

src/components/mainScreenModel.ts
src/components/MainScreenLifeSummary.vue
src/components/GameScreen.vue
tests/mainScreenModel.test.ts
docs/governance/current-product-stage.md

tests/runRealTestGate.ts 核对结论：该文件未出现在当前 git diff --name-only，且 git diff -- tests/runRealTestGate.ts 为空。本 Slice 未修改该文件；既有 gate 已注册并执行 mainScreenModelTests 与 gameScreenPresentationTests。本 Slice 不涉及 gate 顺序、失败处理或退出码变更。

只有现有测试文件无法验证正式组件挂载时，才允许新增一个窄范围 component/UI 测试文件。

docs/governance/current-product-stage.md 只允许在实施完成后更新：

实施状态；

实际修改文件；

验证命令与退出码；

closure 结论。

如果真实代码证明必须修改上述范围以外的业务文件，先按结构性 blocker 处理，不得自行扩大范围。

6. 严格禁止

修改主动行动定义、收益、成本、递减或结算
修改 ActivePlanningService、ActionResultResolver 或 action result DTO
修改主动行动结果卡语义
修改 periodSummaryBuilder.ts
修改事件、事件条件、EventLoader、调度或事件内容
为 socializing/travel 新增长期实践轴或玩家可见长期身份
修改 P9 echo flags 或其语义
挂载或扩展 LifeMemoryPanel.vue
修改 ending、EndingScreen、ending classification 或 ending recap
新增 PlayerState、Snapshot、Schema、Contract 或 migration
新增、替换或扩展 actionHistory
新增通用 action-to-echo、因果历史或 future callback 框架
修改 tendencySummary 算法
由 habit 推导 identity、occupation、affiliation、title、route 或 ending
重跑完整 60 次 late-life Browser observation
顺带修复 P8、P9、p39、p40、event-quality 或 playability 既有问题
无关重构、格式化、旧代码清理或文档扩张
提交、reset、clean 或清理 dirty worktree

7. 验收标准

7.1 ViewModel

必须验证：

无可见 trajectory：显示 尚未形成持续实践。

单项 trajectory：正确显示正式 label 与 tier。

多项 trajectory：保持既有排序并最多显示两项。

diagnostic/hidden entries 不进入玩家摘要。

habit 变化不改变：

tendencySummary；

affiliationSummary；

titleSummary；

experienceSummary；

riskSummary。

socializing/travel flags 或 action history 不进入 practice summary。

至少覆盖以下样本：

training

study

business

预期表达

0

0

0

尚未形成持续实践

1

0

0

练功实践 · 有过实质实践

3

2

0

练功实践 · 较为稳定 / 读书实践 · 开始重复

2

4

5

营生实践 · 贯穿多个阶段 / 读书实践 · 长期深入

5

5

5

按既有稳定排序显示前两项

7.2 正式 UI

必须验证：

MainScreenLifeSummary.vue 正式渲染“实践”行；

玩家可见文案只陈述当前实践事实；

页面不存在未来事件、机会、路线或 ending 承诺；

原有“目标 / 所属 / 经历 / 风险 / 倾向”语义不变；

主动行动结果卡与阶段摘要原有表达不变。

7.3 Local/API 一致性

必须验证：

Local 继续由 deriveLifeMemorySummary() 产生 Life Memory；

API 继续使用服务端提供的同 schema Life Memory；

两条路径都进入同一个 buildMainScreenModel()；

不存在 Local/API 专用 practice builder、fallback 或双重语义。

7.4 Browser 证据

至少完成一次正式 Browser/DOM 验收，证明：

“人生摘要”中实际出现“实践”行；

无 practice 与有 practice 至少各验证一个状态；

页面刷新或既有 Snapshot 恢复后，practice 表达仍与 canonical facts 一致；

Console 没有本 Slice 新增错误。

如果现有 API Browser harness 可以定向注入 Life Memory，再补一条 API 模式证据；如果不能，使用现有 contract/ViewModel 测试证明共享数据链，并明确记录该 Browser 证据缺口，不得为此新增测试基础设施。

8. 验证命令

先运行与修改范围直接相关的窄测试，再运行：

npm run typecheck
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check

当前已知参考 failure fingerprint：

npm test                       exit 1：既有 P8/P9/p39/p40 failure family，具体随机断言可能波动
npm run validate:event-quality exit 1：425 events；blocker 9 / major 147 / minor 36
npm run gate:playability      exit 1：既有 P8 playability baseline failure
npm run gate:p11-scheduling   exit 0
git diff --check               exit 0

实施前后必须使用同一组命令记录结果，并区分：

本 Slice 新增失败；

既有 failure fingerprint；

随机断言文本波动。

不得把既有非绿色 gate 顺带修复，也不得将其错误归因于本 Slice。

9. 结构性 blocker

只有出现以下情况才停止实施并报告：

必须新增或修改 PlayerState、Snapshot、Schema、Contract 或持久化事实；

LifeMemorySummary.habitTrajectory 不能表达正式 label、tier、排序或 player visibility；

Local/API 实际没有共享可复用的 Life Memory → MainScreenModel 数据链；

正式主界面无法在允许文件范围内消费 practice summary；

实现必须修改主动行动结算、事件、period summary、ending 或 tendency 语义；

真实代码证明三项 habit 不是当前 canonical practice facts；

当前权威文档之间存在会实质改变产品语义的冲突。

以下不属于结构性 blocker：

既有 P8/P9/p39/p40 非绿色；

既有 event-quality/playability failure；

无法重跑完整 60 次 Browser observation；

socializing/travel 没有长期 practice axis；

当前 ending 未展示通用 practice recap。

10. 阶段完成定义

本阶段只有同时满足以下条件才算完成：

主界面“人生摘要”正式新增独立“实践”字段；

该字段只来自 LifeMemorySummary.habitTrajectory；

只覆盖 training、study、business 三项 canonical practice facts；

无 practice、有单项 practice、有多项 practice 均有自动化证据；

正式 Browser/DOM 已证明玩家能够看到该字段；

Local/API 共享同一 ViewModel 语义链；

tendency、identity、Affiliation、Title、route、ending 均未被 habit 重定义；

没有新增 state、Snapshot、Contract、事件或 action history；

修改文件全部位于批准范围内；

相关窄测试通过，完整验证结果已与既有 failure fingerprint 区分；

git diff --check 通过；

本文件已记录实际结果与 closure。

11. 阶段停止条件

完成上述 closure 后立即停止。

不得继续进入：

socializing/travel 长期语义；

主动行动到后续事件的接线；

新增事件或扩大 event readers；

P9 echo flag 文案治理；

Life Memory 全面板接入；

action history 或因果历史；

ending recap；

下一阶段产品优化。

12. 实施状态与 closure

本阶段已完成。实际修改文件：

src/components/mainScreenModel.ts
src/components/MainScreenLifeSummary.vue
src/components/GameScreen.vue
tests/mainScreenModel.test.ts
docs/governance/current-product-stage.md

实际数据链保持为：

PlayerState.lifeStates
  → deriveLifeMemorySummary()
  → LifeMemorySummary.habitTrajectory
  → buildMainScreenModel()
  → MainScreenLifeSummary.vue

MainScreenModel.practiceSummary 只过滤 visibility === 'player' 的既有 trajectory，保留既有顺序并取前两项；没有可见项时显示“尚未形成持续实践”。没有新增 practice owner、状态、Snapshot、Contract、事件、action history 或并行 Local/API builder。

窄测试结果：

npx tsx tests/mainScreenModel.test.ts       exit 0
npx tsx tests/gameScreenPresentationTests.ts exit 0
npx tsx tests/activeActionResultParity.test.ts exit 0
npm run typecheck                           exit 0

正式 Browser/DOM 结果：

Local 正式主界面新人生显示“实践 · 尚未形成持续实践”；API 正式主界面新人生同样无 practice，沿既有 UI 推进后显示“实践 · 练功实践 · 贯穿多个阶段”。两条路径 Console error/warning 均为 0；未新增卡片、弹窗或 LifeMemoryPanel 挂载。无 practice、有 practice 的自动化证据以及多项上限、可见性过滤证据均已通过。

完整验证结果：

npm test                         exit 1：新增 mainScreenModelTests、gameScreenPresentationTests 及相关 parity suite 通过；失败仍为既有 p9PlayabilityTests（known balanced consequence 2 vs 2）、p39ContentPoolConsistencyTests（gate:playability fail）和 p40ReplayPacingPolishTests（near-duplicate pairs 8 > 3）。
npm run validate:event-quality   exit 1：425 events；blocker 9 / major 147 / minor 36，既有 event-quality 指纹。
npm run gate:playability         exit 1：既有 P8 headless_server 基线，events=53、choices=30、age=40、blockers=2、warnings=3。
npm run gate:p11-scheduling      exit 0：pass。
git diff --check                 exit 0。

上述失败未涉及本 Slice 修改文件或 practice summary 语义，未扩大为 blocker。

Active Action Canonical Practice Visibility Slice 已完成并停止。当前文档不授权继续修改该 Slice，也不自动授权下一个产品阶段。下一阶段必须基于新的产品裁决单独开启；不得顺势处理 socializing/travel、event echo、ending 或既有非绿色 gate。
