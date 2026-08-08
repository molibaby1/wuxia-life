# Wuxia-Life 当前产品阶段

用途：为 ChatGPT、Codex 和人工维护者提供当前唯一工作目标。本文是滚动看板，不是长期产品规范。

最后更新：2026-08-07

---

## 1. 当前状态

P8 Frustration Evidence Fidelity Calibration 已完成并关闭。

P9/P40 Legacy Acceptance Deauthorization 已完成并关闭。

Life Milestone Minimal Vertical Slice engineering implementation 已完成。

Milestone Expansion Batch 1 已实现，进入实际游戏体验与内容迭代阶段。

产品体验是否改善，等待独立 Player Experience Validation。

当前不启动新的验证 Phase；后续根据实际游戏体验决定保留、修改、删除或补充内容。

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

- Life Milestone Minimal Vertical Slice 与 Expansion Batch 1 工程实现已完成；
- 当前不启动新的验证 Phase；
- 不进入 Player Experience Validation，除非获得独立授权；
- 不进入结果页交互优化；
- 不自动扩充读书、练功或营生内容，后续以实际体验决定；
- 不建设奖励、隐藏成就、任务系统或 milestone ledger；
- 不处理与本阶段无关的 dirty/untracked 内容；
- 下一阶段必须基于新的实际体验证据进行独立产品裁决。
