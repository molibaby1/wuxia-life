# Wuxia-Life 当前产品阶段

用途：为 ChatGPT、Codex 和人工维护者提供当前唯一工作目标。本文是滚动看板，不是长期产品规范。

最后更新：2026-08-11

---

## 0. 当前状态：受约束自动进化 B0 护栏校准（Authorized Slice）

本 Slice 只校准自动优化护栏：known-bad 可检出、Control 不误杀、manifest/hash 可复现、角色信息隔离、red-team veto、人工最终裁决。

### 0.1 目标与非目标

- 目标：在隔离目录 `scripts/b0/` 与 `tests/b0/` 内落地 B0 管线；artifact 只写 `.tmp/b0/<runId>/`。
- 非目标：不进入 B1；不优化或合入正式事件配置；不证明游戏好玩；不取消真人体验校准。
- Overlay 语义：不修改 `EventLoader` / `GameEngineIntegration`；candidate 对照使用 sealed fixture Trace，而非引擎调度注入。

### 0.2 Global Constraints

- 不修改 `src/data/events.json`、正式 lines、PlayerState、Snapshot、Contract、Schema。
- 不修改正式 gate 阈值、测试逻辑或 tracked latest 报告；不调用会写 latest 的 gate CLI。
- 完整保留青年重大机会 Slice 的既有 dirty/untracked 改动；不 reset、clean、`git add .` 或覆盖无关文件。
- 默认不 commit / merge / 发布。

### 0.3 Owner

- 工具与编排：`scripts/b0/**`
- 专项测试：`tests/b0/**`
- 设计：`docs/superpowers/specs/2026-08-11-constrained-auto-evolution-b0-design.md`
- 计划：`docs/superpowers/plans/2026-08-11-constrained-auto-evolution-b0.md`

### 0.4 停止条件

- 必须修改核心运行逻辑、正式事件目录、PlayerState、Snapshot、Contract、Schema 或正式 gate 才能完成 → structural blocker。
- B0 `passed` 不授权 B1 或正式配置修改。

---

## 1. 青年重大机会因果化 Authorized Slice（已完成并关闭）

本 Slice 已完成并关闭。它将 14～20 岁的门派、爱情、幽影门和武林大会从按年龄发放的必然剧情，收敛为由既有正式事实开启、可永久错过、选择会改变后续资格的重大机会。关闭仅描述本地正式语义、自动化和两条实际 Browser 路径；不等同于完整外部玩家体验验证。

四条目标线为：

- 门派机会；
- 爱情机会；
- 幽影门机会；
- 武林大会机会。

年龄只决定机会窗口；四条目标线都允许永久不发生，窗口结束后不补发。

### 1.1 Global Constraints

- 不新增或修改 PlayerState、GameState、Snapshot、正式 Contract、Condition Schema、Effect Schema 或存档版本；Snapshot 必须保持 `3.14.0`。
- 不新增 Route State、Identity、隐藏累计分数、通用 NPC 好感度或第二个 canonical source。
- 不扩充事件池，不重写全部正式事件 priority，不统一 `triggers.random`，不修改 DailyEvent、Milestone、Ending 或 UI。
- 不为删除的 `meet_love_interest`、`sect_path_choice`、`identity-outlaw.json` 保留兼容、迁移、别名或 fallback。
- 条件解析失败继续 fail closed；测试使用 before/after 正式状态和事件资格，不使用正文关键词、Trace、persona 或 Milestone 代替事实。
- 只处理目标事件、调度上限以及被删除资产的直接生产消费者；历史未加载的 `src/data/youthEvents.ts`、`src/data/youthEvents.json`、`src/data/adultEvents.ts` 不恢复也不纳入正式入口。
- 当前工作树中的既有改动归用户所有；每个 checkpoint 使用精确路径检查，不运行 `git add .`，不 reset、clean、批量格式化或覆盖无关文件。
- 本计划默认不提交。每个任务的 Git 命令仅在用户另行明确授权 commit 后执行。

### 1.2 根因与批准范围

根因有两层：正式青年机会以前主要由年龄/必然调度触发，且全局 12 项候选截取可排除合格 storyline；重复门派、爱情和幽影门入口又使资格与后续事实不唯一。

批准范围只包括四条机会线、regular formal 候选上限、删除资产的直接消费者及其聚焦回归。Task 8 的独立批准范围还包括 P8/P9 evidence path：已执行、可见的自动 `main_story` 过渡被补入 persona pacing evidence，避免删除必然门派入口后把真实 `youth_begins` 漏记为节奏空档。该修复不改变事件资格、priority、年龄窗口、effects、P8/P9 threshold 或历史 baseline。

### 1.3 已完成的自动化验收

Task 8 最终记录：

```text
npm exec -- tsx tests/youthCausalOpportunity.test.ts：exit 0
npm run typecheck：exit 0
npm run validate:event-quality：exit 1（418 个事件，九个既有且范围外 ID）
npm run test:contracts：exit 0
npm run test:headless：exit 0
npm run test:headless:parity：exit 0
npm test：exit 0
npm run build：exit 0（保留非失败的 >500 kB chunk-size warning）
npm run gate:p11-scheduling：exit 0（decision: warning）
npm run gate:golden-line：exit 0（PASS；active blockers 0、feedback issues 0、simulated gaps 0、static payoff 90.0%）
git diff --check：exit 0
```

`validate:event-quality` 的九个既有范围外 ID 为：`demonic_trial_recover`、`family_teach_grandchild`、`orthodox_trial_recovery`、`p22_endgame_hermit_memory`、`p22_origin_frontier_orphan`、`p22_wave_early_frontier_growth`、`p22_wave_late_fade_closure`、`p22_wave_mid_merchant_identity`、`sect_trial_recover`。未为隐藏这些结果而修改质量规则或保留事件。

### 1.4 Browser 关闭证据与边界

两条验收都经正常本地 UI 和存档完成，未添加 debug route、query fixture、production hook 或 Snapshot 后门；最终检查的 Browser tab 均没有 console warning/error。

- **低暴露对照（存档 1，低暴露验收）**：从 0 岁开始保持低练功/低社会暴露；14 岁选择“留在家族继续修炼”，初恋机会选择“只是远远一望，默默离开”。自然推进到 32 岁，摘要显示“无固定所属”“读书实践”“少年勤学/读书成习”，没有爱情、幽影门或武林大会事实；游戏仍正常可玩，并显示后期普通事件“开宗立派”。
- **因果机会路径（存档 2，因果机会验收）**：选择“武林世家”；正常行动形成 `trainingHabit`，可见“练功成习”且功力达到 37+；“与玩伴相处/街坊跑腿”使人脉达到 8+ 后又到 10+、名望达到 2；初恋路径依次可见“初遇”→“上前搭话，礼貌问候”→“心动”；约 19 岁可见武林大会邀请，之后仍可正常推进。约 21 岁的最终可见界面仍为正常行动、无固定所属。

以下 Browser 项是 **Evidence Insufficient**，不是 PASS、FAIL 或 N/A：正常路径没有在机会窗口内自然完成幽影门“接触 → 正式邀请”链；没有自然到达爱情 × 幽影门冲突；武林大会的接受与观战分支后续未独立捕获。它们保留自动化的正式 before/after 证据，不因本次 Browser 未捕获而新增调度后门。早期长批次出现过一次 Statsig 网络超时；它不是最终验收 tab 的产品 console error，只能算瞬时外部警告。

### 1.5 Task 9 文档收口与停止边界

Task 9 只更新本治理记录和其任务报告，没有代码、运行时或 UI 改动，也没有 stage、commit 或暂存操作。工作树保持 dirty/uncommitted，现有 Slice 文件、计划/规格工件及其他用户改动均未被重置、清理或覆盖。

相邻但未授权的问题：上述九个 event-quality 结果、P11 的 exit-0 warning、build 的非失败 chunk-size warning，以及 Browser Evidence Insufficient 项。它们不授权事件池扩充、全局 priority/`triggers.random` 重构、P8/P9 再设计或新的产品阶段。

青年 Slice 关闭后的 Authorized successor 仅为上文 §0 的 B0 护栏校准；B0 通过后仍不自动授权 B1，任何再下一步必须基于独立产品裁决。

### 1.6 历史验收方向

Local、API、Headless 与 Browser 必须继续消费同一正式事件和状态语义。Browser 使用正常游戏路径完成两条对照：

- 低武道、低社会暴露路径：确认重大机会可以不发生且游戏仍可推进；
- 有训练、社会经历和公开证明路径：确认机会出现、选择产生不同后续，并完成一次爱情与幽影门冲突。

Browser 证据只证明当前本地产品路径和玩家可见表现，不外推为外部玩家体验验收。

### 1.7 历史结构性 blocker

命中下列任一情况必须停止并重新裁决：

- 如果实现必须修改 PlayerState、Snapshot、Contract、存档版本或通用 Condition Schema；
- 如果只有修改全部 regular 事件调度才能让目标 storyline 可达。

## 2. Life Milestone Minimal Vertical Slice（工程实现已完成）

### 2.1 阶段来源

本阶段来源于实际玩家体验反馈：

- 玩家能够看到属性和 Habit 变化，但无法判断变化的意义；
- 重复读书、练功和营生缺少阶段性成果；
- 玩家无法明确描述自己当前形成了什么特点；
- 长期目标距离过远，当前缺少可感知的发展方向。

### 2.2 阶段目标

实现：

```text
Existing Formal Facts
→ Data-driven Milestone Evaluation
→ Achieved Milestones
+ Milestone Prospects
→ Shared Life Memory Projection
→ Main Screen Feedback
```

使玩家能够看到：

- 已经形成的阶段成果；
- 当前最接近的少量发展方向；
- 每项成果或方向对应的事实和进度。

### 2.3 正式范围

只允许：

1. 定义 8 个透明 Milestone；
2. 实现小型结构化条件求值器；
3. 派生 `achievedMilestones`；
4. 派生最多 3 个 `milestoneProspects`；
5. 接入 Life Memory 共享派生链；
6. 在主界面展示最多 2 个印记和 1 个当前方向；
7. 增加对应 Contract、Local/API 和 UI 回归测试；
8. 将 Life Memory 派生 Contract 进行 minor version 更新。

### 2.4 八个固定样本

只允许：

- 初涉书卷；
- 少年勤学；
- 初试身手；
- 初通营生；
- 读书成习；
- 练功成习；
- 营生成习；
- 文武并进。

不得增加第 9 个 Milestone。

### 2.5 条件范围

第一阶段只允许：

- `habit_at_least`；
- `action_count`；
- `event_occurred`。

多个条件固定为 AND。

不得实现：

- 任意表达式 DSL；
- 嵌套条件树；
- `any`；
- `not`；
- stat threshold；
- hidden milestone；
- 自定义脚本条件。

### 2.6 状态边界

Milestone 是只读派生反馈。

不得修改或新增：

- PlayerState；
- GameState；
- Snapshot state shape；
- Snapshot schema version；
- save migration；
- Achievement；
- Identity；
- Affiliation；
- Title；
- Ending；
- route；
- event conditions；
- event effects；
- scheduling；
- active-action rewards。

第一阶段不建设 milestone ledger。

### 2.7 独立问题边界

本阶段不处理：

- 结果页与下一事件之间的交互拖沓；
- 重复读书、练功事件的内容差异；
- 数值平衡；
- 悟性是否进入 canonical player model；
- 隐藏成就；
- 奖励系统；
- 任务系统；
- Browser fixture；
- P8/P9/P40 metric。

这些问题不得因本次体验反馈被顺带纳入。

### 2.8 工程完成结果

已确认实现满足：

- 8 个 Milestone 由 JSON 数据定义；
- 求值器不包含具体 Milestone ID 分支；
- `achievedMilestones` 与 `milestoneProspects` 分离；
- Life Memory 保留完整已达成集合；“最多 2 项印记”只属于主界面展示限制；
- raw GameState 不包含 Milestone；
- Achievement 与 Milestone 不混合；
- Local/API 共用同一 Life Memory 链；
- 主界面无 Milestone 时不渲染空的“印记 / 方向”行；
- 无事件、调度、属性、奖励或存档行为变化；
- 工程验证已完成并通过。

### 2.9 产品验收边界

工程绿色不等于体验问题已经解决。

工程完成后必须停止，下一步只允许独立批准：

```text
Player Experience Validation
```

至少实际游玩一条书香路线至约 20 岁，判断：

- 是否能描述当前形成的特点；
- 是否理解最近获得的 Milestone；
- 是否知道当前接近什么方向；
- 是否仍然只是机械重复读书；
- 主界面反馈是否足够清晰；
- 下一优先级是否应转向结果交互或内容差异。

### 2.10 结构性停止条件

出现以下任一要求时停止实施并重新裁决：

- 必须新增 milestone ledger；
- 必须新增 PlayerState、GameState 或 Snapshot 字段；
- 必须修改现有 Achievement 语义；
- 必须依赖普通 choice 历史；
- 必须使用悟性作为正式核心条件；
- 必须新增事件；
- 必须影响游戏结果才能体现价值；
- Local/API 无法通过共享 Life Memory 链保持一致。

### 2.11 阶段关闭结果

本阶段正式状态为：

```text
Life Milestone Minimal Vertical Slice engineering implementation 已完成。
产品体验是否改善，等待独立 Player Experience Validation。
当前没有 Authorized 下一阶段。
```

不得自动授权内容扩充、交互修改、高级 Milestone 或 Player Experience Validation 实施。

## 3. P8 Frustration Evidence Fidelity Calibration

P8 的正式语义为：

```text
actual executed negative evidence
→ inspect related player-visible context
→ warned / explained / recoverable / opaque
```

实际负面证据来自单次执行的实际 effects 或 before/after 状态差异。事件前景中的“危机、受伤、失败、死亡”等词不能单独构成 setback。

P8 closure 保持以下结果：

- dangerous foreground 不再被误判为实际 setback；
- recovery-only event 不再被误判为 setback；
- Local/API/Headless choice evidence 语义保持一致；
- 已有玩家可见解释由 classifier 正确覆盖；
- frustration threshold `0.35` 与 blocker severity 保持有效。

### 3.1 P8 classifier 归属

当前 worktree 还包含已经裁决的 P8 evidence-conditioned multi-domain classifier coverage 及其 p38 synthetic regression。

它们属于 P8 frustration closure 的既有组成，不属于 P9/P40 deauthorization。Life Milestone 阶段不得修改其代码或测试。

涉及的既有实现 owner 为：

- `src/p8/collectPersonaMetrics.ts`：negative-domain classifier 收敛；
- `tests/p38FrustrationRemediationTests.ts`：对应 synthetic regression。

### 3.2 历史 closure baseline

P9/P40 deauthorization 之前的 P8 closure baseline 曾记录 `npm test：exit 1`，该记录只描述当时尚未撤销的 P9 causality 与 P40 replay similarity 历史断言。

它是历史 closure baseline，不是当前验证结果，也不得与当前门禁结果并列解读。

## 4. P9/P40 正式裁决

- 因果连续性和人生可区分性仍是有效产品目标；
- 当前 causality/replayability metric 仅为 legacy diagnostic；
- causality/replayability 不产生正式 verdict 或 warning；
- `directEchoCount >= 3`、`tooFewEchoes` 产品验收含义、replay cosine `>= 0.82`、near-duplicate pair `<= 3` 及依赖它们的历史 assertions 已退出正式验收；
- 不授权 causality/replayability metric redesign；
- 不授权 P9/P40 内容修改。

raw diagnostic payload 继续保留，用于路径、状态和内容候选问题发现，但不能直接证明真人玩家的因果感受或重玩体验。

## 5. 进入本阶段前的正式验证基线

```text
npm run typecheck：exit 0
P8/P9/P40 定向测试：exit 0
npm test：exit 0
Headless P8 gate：PASS
Local P8 gate：PASS
P11 scheduling gate：exit 0
git diff --check：exit 0
```

Headless 与 Local gate 的 frustration blocker 均为 0；两条 gate 均保留 causality raw diagnostic 与 replay raw diagnostic。

## 6. Life Milestone 工程实现与最终验证

### 6.1 实现结果

当前实现形成正式共享链：

```text
GameState
→ deriveMilestoneProjection()
→ LifeMemorySummary 3.1.0
→ SessionProgressionPayload
→ buildMainScreenModel()
→ MainScreenLifeSummary.vue
```

实现结果：

- 新增 8 项固定 Milestone JSON 目录；
- 新增纯只读 Milestone 求值器；
- Life Memory 分别携带 `achievedMilestones` 与 `milestoneProspects`；
- 主界面最多展示 2 项“印记”和 1 项“方向”；
- `personaRuns`、事件、调度、奖励、PlayerState、GameState、Snapshot、Achievement 与 LifePath 均未被 Milestone 写入或修改；
- 旧 Habit 隔离测试只收敛比较范围，以排除新增的派生 Milestone projection；canonical Habit 隔离语义保持有效。

### 6.2 最终验证结果

```text
npm run typecheck：exit 0
5 个指定定向测试（Life Memory、Milestone、Main Screen、Habit、Identity）：exit 0
npm run test:contracts：exit 0
npm run test:headless：exit 0
npm run test:headless:parity：exit 0
npm test：exit 0
npm run build：exit 0
npm run gate:p11-scheduling：exit 0
git diff --check：exit 0
```

### 6.3 Browser 工程证据

已确认：

- 本地新人生可以正常进入游戏；
- 无 Milestone 时不渲染空的“印记 / 方向”行；
- Browser Console 无 warning/error；
- 临时开发服务与验收页面已关闭。

该路径尚未到达主动行动阶段，因此没有把空态验证宣称为“已获得印记”的 Browser 正向证据。Milestone 正向数据链由求值器、Life Memory 与主界面回归测试覆盖；实际玩家方向感是否改善仍需独立 Player Experience Validation。

## 7. Browser closure 裁决

目标特定 Browser DOM 证据缺失属于验收基础设施限制，不构成 P8 产品关闭 blocker。

现有共享正式渲染链、定向测试、effect invariance 和 Headless/Local 双 gate 足以支持关闭。

Life Milestone 阶段不新增 production hook、debug route、query parameter、Snapshot 字段、Browser fixture 或事件调度后门。

## 8. 既有关闭阶段未修改边界

Life Milestone 阶段不得修改：

- P8/P9/P40 metric、classifier、evidence producer 或 threshold；
- 任何 P8/P9/P40 latest reports；
- 事件、effects、conditions、weights、age 或 scheduling；
- persona、seed 或运行次数；
- event-quality 或其他已知非绿色项。

## 9. 当前停止条件

- 仅实施青年重大机会因果化 Authorized Slice，不自动进入相邻体验、UI、Milestone、Ending 或其他年龄段工作；
- 不新增事件池、正式状态来源、兼容层、迁移、fallback 或存档变化；
- 不处理与本阶段无关的 dirty/untracked 内容；
- 本 Slice 全部验收完成后停止，下一阶段必须获得独立产品裁决。
