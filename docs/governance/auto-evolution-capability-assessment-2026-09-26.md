# Auto Evolution 能力审视与治理判断（2026-09-26）

> 状态：只读分析结论，供 Human 后续治理复核；不是 Product Decision、第一层产品规范或 implementation authorization。
> 核查基线：`dev`，`281de20b13dbfba97a40c62613d3b5e2b8e30dff`。本次没有启动 AE、修改运行逻辑或生成新的自然样本。
> 权威仍以 [文档索引](../README.md) 所列第一层产品规范、当前 Product Decisions 和阶段边界为准。本文件不改变 `RUN / OBSERVE`、Human Approval、Participant budget、permission 或 STOP。

## 核心结论

AE 已具备可运行的 Agent 工作流、来源与权限控制、候选处理和旁路报告，也为具体产品问题提供过有用证据。**当前最核心的短板是产品效果证据链尚未形成可复核、可重复的闭环。**治理上尤其容易把下列五个层级合并为一个“自动改进成功”结论：

1. Headless 轨迹出现玩家可能看见的问题信号；
2. Participant 提出诊断或方案，Reviewer 接受；
3. workflow 合法结束或在隔离工作区完成修改；
4. Human 批准并将修改落入正式产品；
5. 改后的自然玩家可见体验确实改善，且这种结果能在其他问题上复现。

现有证据支持前几步在一些案例中能够发生，也支持 Preschool 第一轮 8 条内容修改后走到了自然 Headless/P8 样本复核；但尚不支持“AE 已能稳定、普遍地改善玩家体验”。[当前阶段](current-product-stage.md)本身也把 PD-118 长期自然有效性、稳定性和普遍性列为未证明事项。这个判断是**证据边界**，不是对 AE 无价值的判决。

## 术语与证据边界

- **普通 AE 的自然运行**指未为取得预期 route 人为挑选问题或干预 Participant 的实际工作流调用。其初始来源仍是 P8 persona、随机 seed 和 Headless 模拟；`runMultiCandidateOrdinaryEvolution.ts` 选取 persona，`runPhase0.ts` 调用 `runHeadlessPersona` 并投影玩家可见轨迹。External Feedback 提示 Participant “把这当作你刚刚亲自经历的一段人生”。因此“player-observable”表示材料原则上可被玩家看到，**不表示真人玩家实际游玩并给出反馈**。相关实现：`scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts:106-126`、`scripts/evolution/phase0/runPhase0.ts:197-219`、`scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback.ts:33-45`。
- **workflow 验证**能证明 Schema、来源、权限、状态转移和特定执行路径；不能单独证明诊断正确、内容有意义或真人感受改善。[PD-055](product-decisions.md)明确不把外部参与者的主观判断当金标准；`src/p8/metricDefinitions.ts:3-79` 的自动指标基于 simulation，真人 UI 理解度为非阻断项。
- **隔离工作区的 source change 或未来 shadow patch**不等于 authoritative repository 已被修改。[当前阶段](current-product-stage.md)记录的首个自然跨轮配置执行发生在 disposable workspace，`authoritativeRootChanged=false`；它与后续经 Human 批准提交的 Preschool 内容改动是不同的产品落地事实，必须分开记账。
- **Human Approval**是现行产品权限边界，不因一次 `DEFER`、没有自动修改，或 Reviewer 接受方案就自动成为“需要放宽权限”的证据。

## 关键发现

### 1. 产品效果链已有具体正例，但结果是部分达成

Preschool 内容容量提供了目前较强的纵向证据：`ordinary-run-20260919-000001` 在 4–7 岁观察到 24 个可见 beat，其中 7 个为 generic gap；后续把已修复的 Scheduling 问题与仍存在的 `CONTENT_CAPACITY_GAP` 分开诊断。Human 于 9 月 22 日批准第一轮 8 条 shared-neutral 内容；正式实现见提交 `e80eecc8`。依据：[Preschool 第一轮 authoring authority](../superpowers/specs/2026-09-22-preschool-content-capacity-authoring-design.md)，尤其 §Gap Diagnosis。

第一轮改后的自然 Headless/P8 玩家可见样本复核记录了 8/8 已提交且 8/8 可见，没有重复或跨 origin 泄漏；同时仍有 4 个 generic gap、需求 30 大于可用容量 26，结论为 `PARTIAL`。Human 又批准 5 条残余内容，正式实现见 `6a46b274`。依据：[残余容量 authoring authority](../superpowers/specs/2026-09-23-preschool-residual-content-capacity-authoring-design.md)，尤其 §Exact residual Gap Diagnosis 与 §First-round authoring assessment。

**判断（高置信）：**AE 相关自然 Headless/P8 证据能够促成 Human 决策、正式产品修改和改后样本复核；第一轮没有完全解决目标问题。这个案例既反驳“AE 从未推动产品变化”，也不能推出“AE 已自主完成闭环”或“对玩家体验的普遍改善已经证实”。本次尚未据同一证据链确认第二轮 5 条内容落地后的自然体验结论。PD-113 另记录了 AE 玩家可见证据进入正式产品决策，但本次没有把它当作完整改后体验闭环。

### 2. PD-120 的授权与普通运行的固定交付物之间存在落差

[PD-120](product-decisions.md)和当前 [Content Authoring Workflow Contract v2](../product/content-authoring-workflow-contract-design.md)允许 AE 从玩家可见信号完成 Gap Diagnosis、Content Proposal、Draft Authoring Contract，并停在 Human Approval。它们没有授权 Human Approval 前的正式内容实施。

当前 ordinary path 仍以 `External Feedback → Improvement Hypothesis → SolutionWorkV1 options → Reviewer → Decision` 为主。Hypothesis 阶段明确不产出具体方案；`SolutionWorkV1` 约定的是通用修改选项，没有固定 Gap 分类、Content Proposal 或 Authoring Card 产物；默认 authority refs 没有列入当前内容工作流契约。Decision Router 仅在 typed configuration authority 成立时给出 `READY_FOR_CONFIG_EXECUTION`，其他被接受的越界方案进入 `ESCALATE_HUMAN`。实现入口：`scripts/evolution/improvementHypothesis/deepseekImprovementHypothesis.ts:48-64`、`scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts:102-135`、`scripts/evolution/runMultiCandidateSessionSlice.ts:111-118`、`scripts/evolution/problemAgnosticSolution/routeSolutionDecision.ts:35-56`。

**判断（高置信）：**PD-120 给出了 AE 可以做什么的权限，现行普通运行契约尚未机械保证交出完整、可供 Human 审批的内容材料。通用 Participant 可能自发提出有用内容方案，不能据此声称 PD-120 工作流已经稳定交付；也不能把 Human 审批硬门误判为 bug。

9 月 24 日 [Contract-Constrained Autonomous Authoring v1 设计](../superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md)虽已 Human accepted，却明确要求先完成新的 Product Decision 与 canonical Contract 调和；在此之前 runtime authority **not operative**。其目标也只是 isolated shadow patch，正式仓库 promotion 仍由 Human 控制。当前不能将该设计或 [实施计划](../superpowers/plans/2026-09-24-contract-constrained-autonomous-authoring-v1-implementation-plan.md)写成已生效的 AE 能力。

### 3. 新多候选路径的自然稳定性仍处于观察期

本次只读枚举 `artifacts/evolution/run-reports/candidate-session-report-*/report.json`，发现 9 份不同 Logical Session 的 v7 快照：5 份 `FAILED`，4 份 `PAUSED`，没有 `COMPLETED`。其中 3 次为 `HOST_SLICE_BUDGET` 暂停，1 次为 `SOURCE_B_ANALYSIS_PENDING` 暂停；这两类暂停不是自动等于故障。最近的 `ordinary-run-20260924-000002` 使用 10 个 Participant job，处理 8 个候选中的 3 个，留下 5 个 PENDING 和 2 个正式 Human Follow-up item。另一个 9 月 24 日 Session 已发生一次 configuration source transition，但停在 Source B analysis pending。

**判断（中置信）：**这些快照证明真实运行能够处理多个候选、暂停和升级，也说明还不能把新路径描述为已稳定完成长期连续循环。样本跨多次代码修复，`PAUSED` 是可恢复状态；`5/9` 不能作为当前 HEAD 的故障率，`0 COMPLETED` 也不能单独证明设计失败。[当前阶段](current-product-stage.md)对 PD-118 的表述应继续保持“deterministic acceptance 已验证，长期自然效果未证明”。旧的 `selectFirstHypothesis` 单候选瓶颈已经迁移，不能继续当作现存根因。

### 4. 当前单一操作入口与 canonical 产物不一致

在本次 checkout，`artifacts/evolution/index.md` 与 `artifacts/evolution/run-reports/index.md` 仍显示 63 份报告，最新停在 `ordinary-run-20260924-000001`；磁盘实际有 64 份 `report.json`，包含较新的 `ordinary-run-20260924-000002`。`artifacts/evolution/human-follow-up/index.md` 显示 27 项、active 0；canonical `item.json` 实有 29 项，其中该次运行创建的 2 项仍为 `OPEN`。该次 `.tmp/evolution/ordinary-run-20260924-000002/operator-result.json` 却记录 `observabilityStatus=PASS`、`humanFollowupActiveCount=2` 和索引路径。

**事实（高置信）：**此刻用户约定的入口看不到两个仍开放的 Human 项，且与同次 operator 结果不一致。**成因（推断，中置信）：**运行报告与 HFL 条目位于 Git 忽略的 `artifacts/`，三个派生索引是 Git 跟踪文件；索引修改时间晚于该次运行结束，内容又等于已提交快照。运行后索引被恢复或覆盖、canonical 产物仍留在磁盘，比当前刷新器从同一批文件漏算更符合证据；具体覆盖命令和操作者没有被本次证实。不要把此不一致反推为 AE 决策失败，也不要为修索引重跑 AE。

另有导航滞后：`docs/README.md` 仍将当前内容工作流称为 v1 / PD-106，而文件与 PD-120 已升级到 v2。它不改变 authority 顺序，却增加未来误读当前授权的风险。

## 后续治理应如何使用这些结论

1. **分层陈述能力。** 每次 closure 分别说明：工作流合规、诊断/提案质量、Human 接受与正式落地、改后自然玩家可见结果、跨案例可重复性。缺任何一层就保留 `unknown`，不把 report `PASS`、Reviewer `ACCEPT`、`READY`、shadow success 或正式 commit 自动翻译为玩家收益。
2. **先审具体链条，再讨论权限扩张。** Preschool 应保留第一轮 `PARTIAL` 和残余问题；PD-120 要求的完整审批材料应在自然案例中得到直接验证。只有反复出现已接受但权限外的问题、且正式 Product Decision 支持，才讨论新的自主执行权限。已接受但未生效的 9 月 24 日设计不得被提前用于运行。
3. **把派生入口与 canonical 状态的一致性作为操作前提。** 对 9 月 24 日索引差异先查运行后文件覆盖记录；必要时仅基于现存报告和 item 重建 sidecar，不重跑游戏或 Participant。后续索引若再次与 canonical 状态不一致，应报告两层事实及检查时间，不能只给一个绿色刷新状态。
4. **继续按当前 `RUN / OBSERVE` 收集新路径证据。** 不预选容易产生 `READY` 的问题、不以更多调用次数或修改数量代替产品效果、不因本分析启动 P3、通用评分器、聪明 Selector 或越界自动写入。

## 尚待回答的最小问题

- 第二轮 5 条 Preschool 内容正式提交之后，是否存在同一问题边界下的独立自然 Headless/P8 玩家可见样本复核？若有，结论是 `PASS`、`PARTIAL` 还是需要重新诊断？
- 当前 ordinary AE 能否在自然内容问题中实际交付 PD-120 要求的完整 Gap Diagnosis、Content Proposal 和 Draft Authoring Contract，而非仅升级一个通用方案？
- 9 月 24 日 19:11 左右，哪些工作树操作覆盖了三个索引？在不同 checkout / Git 操作后，派生入口如何与 ignored canonical 产物重新对齐？
- 在当前 HEAD 上，新的多候选 Session 能否跨多个 Host slice 完成，并在改后自然体验复核中给出可归因的产品效果？

本文件记录的是 2026-09-26 的判断与待复核问题。后续证据若改变结论，应更新或退休本文件；不得把它与第一层产品规范或 Product Decision 并列为新 authority。
