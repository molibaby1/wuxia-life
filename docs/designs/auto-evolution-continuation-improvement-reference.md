# Auto Evolution 终态后续入口与优化优先级

> 日期：2026-09-08。性质：问题盘点与未来优化参考，不是 implementation authorization。  
> 用户期望：每一次“异常结束”都应提供继续推进解决的入口指引。本文将其落实为待实施、待验证的设计目标。  
> 基线：自然运行 `ordinary-run-20260908-000007` 至 `000012` 使用 `da3515a`；工作区后续未提交改动不是本批验证结果。

## 1. 目标与边界

AE 应帮助游戏持续发现问题、形成可审查方案，并在权限内改进。流程能结束、报告能生成，只能证明部分工程能力；不能证明问题得到解决。

这里的“异常结束”是用户对“没有继续推进”的体验描述，不新增或重命名 machine enum：

- **正常无动作**：没有形成问题、没有必要修改、方案被有理由地拒绝。可以完成归档，不强制继续。
- **未解决但正常停止**：证据不足、要求补充工作、等待产品裁决。应能找到后续处理入口。
- **执行异常**：Participant、验证、封存、权限、宿主或报告生成失败。先诊断和保留证据，再判断恢复条件。
- **预算或阶段完成**：达到既有边界后停止，不应被误报为故障。

**有入口 ≠ 自动重试 ≠ 自动执行 ≠ 所有结果都交给 Human。** 合理的入口也可以是“当前无需行动；出现指定新证据时重新评估”。

本文服从 [AE 产品模型](../product/auto-evolution-model.md)、[玩家模型](../product/player-model.md)、[当前阶段](../governance/current-product-stage.md)、[协作流程](../governance/ai-collaboration-workflow.md)、[收敛原则](../governance/project-convergence.md)及 [Product Decisions](../governance/product-decisions.md)。不改变 PD-100 的 HFL 创建范围、PD-106 的内容审批、PD-111 的诊断边界、既有 retry/budget/STOP；不启动 full P3。

## 2. 已有证据与当前判断

| 观察 | 支持的判断 | 不支持的推论 |
| --- | --- | --- |
| `000007–000012`：1 次 `ESCALATE_HUMAN`、2 次 `DEFER_MORE_WORK_REQUESTED`、3 次 `DEFER`；均无产品执行、无跨轮，可观测性 PASS | 工程路径能正常终止，但尚未形成持续改进闭环 | 全部都是运行故障；全部都自动创建了人工事项 |
| 六轮共 40 条假设，每轮仅调查第一条，均围绕童年练武重复 | 调查覆盖集中，34 条其他假设未进入 Solution | 第一条一定选错；后续假设一定更有价值或更易执行 |
| 固定 `p8-martial-lin`，只有 seed 变化 | 不能回答跨角色、跨出身、跨策略问题 | 多个 seed 等价于广泛玩家覆盖 |
| Reviewer 要求具体条目、年龄窗口、delta、池容量及验证；当前运行停止 | “需要补充”没有在这些 session 内继续成为补充调查 | 必须增加无限对话、自动 retry 或新的 Agent |
| 本地 3 角色 × 3 seed 对照：4–7 岁均有 8 条不同标题的被动叙事；书香与均衡角色的被动序列相同，主动行动不同 | 同一事件重复、主题集中与策略集中应分别判断；固定样本的整体代表性存在问题 | 已证明 CONTENT_GAP、应减少成长收益、应增加语义去重 |
| 武林对照早期轨迹与 `000010–000012` 一致；补充检查可见“练功实践有所积累” | 对照复现原路径，不能把问题概括成完全没有成长反馈 | Milestone 的全部浏览器呈现已经验证；体验已经改善 |

历史明确工程缺陷“引用反馈/假设却未交付文件”已修复，并在后续工作区核对中验证。权限提示歧义已澄清，但不能据此保证 Participant 不再误判。被动叙事 attribution 为 `unavailable` 是 PD-111 当前边界，不是漏实现。

当前工作区正在进行随机角色采样等改动；需要独立验证其选取、封存与重放。本文不把它计作已通过自然运行的改进。

## 3. 优先级与最小推进方向

下表是未来工作的排序，不表示各项都已获代码实施授权。P0 为下一项优先设计/验证工作；涉及证据完整性或越权的真实故障则始终优先止损。

| 优先级 / 项目 | 问题、原因假设 | 最小方向与预期影响 | 风险与验收 |
| --- | --- | --- | --- |
| **P0：终态后续入口** | route/stopReason 能解释“停了”，但不足以统一回答“接下来具体做什么”；现有 Human-view 已有部分指引，不应另建一套入口 | 审计并补齐既有报告投影及 CLI 失败提示；输出原因、证据、负责人、下一动作、恢复条件。让未解决事项可接手 | 不把建议当授权，不让主循环依赖报告。覆盖下节全部终态族；已有入口直接复用，缺失处明确标记 |
| **P1：缺证据后的有界调查** | 单次输入不足；已有可读代码或本地对照未被充分利用；多次运行重新开始而非补齐已知缺口 | 先区分“现有材料可回答”和“确需新采样”；让调查交付明确缺口及可执行的取证步骤。先以现有授权工具手工闭环一个案例，再决定是否需要 runtime continuation | 不开放 raw internal trace，不增加隐式 LLM 调用。验收看缺口是否减少、结论是否有新证据，不能只看调用次数或 READY |
| **P1：方案具体化与审查交接** | “协调内容、缩小覆盖”等提案把产品选择留给执行者 | 明确修改对象、具体差异、预期影响、不变量与验证；未完成部分如实作为待调查项，不伪装成可执行配置 | 不新增庞大 schema 或僵化领域模板。Reviewer 能定位未完成项；执行者无需再做未经授权的产品设计 |
| **P2：采样覆盖与可复现性** | 单一角色导致重复观察；随机 seed 不能替代角色覆盖 | 利用现有 persona 与封存输入扩展有限覆盖；记录实际选中角色与 seed，后续 round 保持同源 | 随机允许重复，不保证三次覆盖；不按是否容易 READY 选样。验证相同输入可重放、覆盖有变化、权限不变 |
| **P2：候选选择覆盖** | 固定取第一条造成调查集中 | 先量化未调查候选与已调查主题；再评估一个独立、可解释的选择规则。与采样改动分开验证 | 不按“容易修改”挑题，不增加领域打分器。验收看调查覆盖和选择 provenance，不要求提高接受率 |
| **P3：权限与产品改进范围匹配** | 真实问题经常涉及内容语义或程序，而普通自动执行仅限已授权配置 | 先审阅 retained HFL 中的重复问题，判断哪些值得进入现有正式任务；只有明确证据支持时才讨论授权范围 | 不以长期没有执行为由开放代码修改。每个事项保留具体产品价值、审批依据和执行边界 |

角色采样改善不能替代 P0/P1：换了角色后，系统仍可能再次停在“证据不足、请补充”。

## 4. 每个终态的后续入口

判定顺序：先看 operator/preflight 是否启动成功，再看 session `run-manifest.json` 的 stopReason 和 execution，最后用 round decision、Solution/Reviewer 解释原因。不要把 `ROUND_1_TERMINAL_NOT_READY` 单独当根因。

下表是**目标指引与当前可用入口的映射**，不是宣布已有自动恢复能力。“调查任务”指现有人工或已授权 Codex 任务，不要求新建系统。入口统一从 `artifacts/evolution/index.md` 的运行报告开始；无报告时使用 CLI 错误与已生成的阶段文件。

| 终态 / 原因族 | 下一动作与接手方 | 恢复条件及边界 |
| --- | --- | --- |
| `SKIP`：`NO_PROBLEM_FORMED`、`NO_PROPOSAL`、`REVIEW_ACCEPT_NO_ACTION`、`REVIEW_REJECTED` | 阅读已有 Decision Audit；有合理依据则归档；依据缺失或出现新反证时进入只读审计 | 不因 SKIP 自动 rerun。可明确“无需行动”，同时列出重新评估触发条件 |
| `DEFER`：`INSUFFICIENT_EVIDENCE`、`REVIEW_DEFERRED` | 调查者从原 hypothesis、unknowns、review 取得具体缺口；说明可用本地取证、需要新样本或需要产品裁决 | 必须出现新证据或明确的取证任务后才继续；不能把换 seed 当作已解决缺口；当前不自动创建 HFL |
| `DEFER_MORE_WORK_REQUESTED` | 调查者逐条处理 Reviewer concerns，给出已补充/未解决/不采纳及依据，保留原方案和 review | 当前 session 已 STOP；再审须经既有授权入口，不能宣称系统已自动恢复。需要新 Participant 调用时明确其授权与预算 |
| `ESCALATE_HUMAN`：`EXPLICIT_ESCALATION`、`ACCEPTED_OUT_OF_SCOPE` | 进入既有 HFL Inbox，定位 retained item；Human/Codex 明确需要裁决的具体边界，沿 `retain + review + list` 处理 | 先看当前 disposition，已 CONVERTED/REJECTED/DEFERRED 不重复开启。`READY_FOR_FORMAL_TASK` 只进入正式流程，不是实施授权；其他运行不因此阻塞 |
| `PARTICIPANT_FAILURE`、`EXECUTION_PARTICIPANT_FAILURE` | 工程调查者检查 invocation、failure、execution trace，区分传输/超时/envelope/schema/引用问题；保留原失败 | 仅遵守已授权恢复机制；Solution envelope 一次同线程重传不能推广到 schema、Reviewer 或更多重试。修复后新尝试使用新身份，不改写旧结果 |
| `OPERATOR_PREFLIGHT_FAILED`、`PARTICIPANT_BINDING_UNAVAILABLE` | 从 CLI 错误进入宿主/绑定诊断；保护 dirty tree，修复具体前置条件 | 前置条件满足并具备运行授权后再启动；不自动 stash/reset，不切换 provider，不伪造未开始的 session 结果 |
| Phase0 采集、构建或发布阶段报错 | 工程调查者检查异常与已有 staging/seal 文件，判断输入、运行或发布失败 | 未封存输入不得交给后续 Participant；保留失败材料，修复后重新产生有效来源 |
| `AUTHORITATIVE_REPOSITORY_CHANGED`、`EXECUTION_SCOPE_VIOLATION` | 立即停止该分支；工程调查者核对 fingerprint、actualChangedFiles 与允许路径，必要时提交 Human | 不扩大 allowlist、不回滚他人改动、不把异常 diff 晋升为产品；受影响证据不可用于证明改进 |
| `DETERMINISTIC_VERIFICATION_FAILURE` | 工程调查者定位失败检查，区分新增回归与基线失败 | 不弱化检查或宣称通过；修复/裁决完成前不进入改后运行 |
| `NO_CONFIGURATION_CHANGE` | 从 execution result 与 diff 检查是无需修改、未落实方案还是执行异常 | 有依据的 no-op 可关闭；否则回到具体方案/执行诊断，不盲目重试 |
| `REAL_GAME_RERUN_FAILURE`、`SEALED_SOURCE_VALIDATION_FAILURE` | 工程调查者核对改后运行、输入身份、seal 与来源一致性 | 不能重用无效来源、补造 seal 或启动下一 round；修复后按授权生成新的有效证据 |
| `PARTICIPANT_BUDGET_EXCEEDED` | 核对 invocation accounting 与已发生调用；拆分剩余工作 | 不自动加预算；明确下一任务范围和授权，保留既有停止事实 |
| `ROUND_2_COMPLETED` | 查看两轮和执行/验证证据，确认本次达到阶段边界；有剩余事项则列出独立下一步 | 正常完成，不继续第三轮；isolated workspace 的修改仍不等于仓库 promotion |
| `OBSERVABILITY_REFRESH_FAILED` | 在原 session 上修复并重建相应 archive/inbox/index 旁路产物 | 不重跑游戏或 AE，不覆盖主执行 outcome，不把报告失败写成游戏失败 |
| 未知异常、原始异常字符串、缺失 manifest/decision | 报告最后一个已确认阶段、现有材料与缺失项；交工程调查任务定位 | 不猜测 route，不把缺失认定为正常结束；原因查明之前不盲目恢复。未知类型必须也有兜底指引 |

## 5. 指引的最小内容与验收

未来指引至少让接手者回答以下问题；这是展示/交接内容要求，**不是新增 JSON Contract 字段**：

1. 停在何处：session 和 round 分别是什么结果？是否已经写入或执行过修改？
2. 为什么停：原始 reason、Participant 意见和工程判断分别是什么？哪些仍未知？
3. 缺什么：精确证据、具体方案、授权、运行环境或产品决定。
4. 谁来做：现有权限内的调查者、工程修复任务或 Human 产品裁决；若无需行动则明确说明。
5. 从哪里开始：可打开的报告/item/artifact/源码引用及明确动作；仅写“继续调查”不合格。
6. 何时可以继续：需要出现的证据或批准、调用/预算边界、已有重试上限与 STOP。
7. 如何保留历史：后续任务引用原运行和判断，原终态不改写；不要承诺非 HFL 临时材料永久留存。

验收应使用已有终态 fixture 与真实案例：

- 覆盖上述结果族以及未知错误；同一事实不显示相互矛盾的入口。
- `000010` 应指出缺少具体行级方案、主动行动残余路径及内容审批；不能只建议“再跑一次”。
- `000011/12` 应指出需要跨角色对照，并引用已完成对照后仍未知的部分；不能忽略新增证据重复提出相同请求。
- 正常 SKIP、阶段完成和未开始运行不误标为系统故障。
- 入口生成不触发模型调用、修改、HFL 创建或自动恢复；报告仍为旁路。
- 不以 READY 比例、修改数量、Human item 数量下降作为单一成功指标。更有价值的验证是：接手者能否找到起点、补齐已知缺口，并避免重复调查。

## 6. 建议实施顺序

1. 先做 P0 的已有指引覆盖审计，复用 `buildHumanReviewSummary` 与 operator 错误输出，列出真正缺口；不要重建报告系统。
2. 选 `000010` 或 `000011/12` 做一个 P1 有界后续案例，验证“原证据 → 补充工作 → 新判断”的可接手性。没有实施授权时停在调查或正式产品提案。
3. 独立验证角色采样改动；随机样本需如实报告重复，不做隐藏补偿。
4. 再讨论候选选择；先保持采样与选择两种变量分离。
5. 只有重复的、已调查且值得修改的问题持续卡在权限边界，才重新讨论产品授权范围。

不在本参考中建设自动任务系统、通用重试平台、报告分析 Agent、语义去重或新领域评分器。若需要增加 Participant 调用、恢复已停止 session 或扩大 HFL retention，必须另行明确设计与授权。

## 实施进展（2026-09-09）

P0 首个展示切片已实施并完成本地验证，尚未提交：

- 已知 Participant failure 在缺少 Decision Audit 时仍显示失败及诊断入口；不再误归为只有历史信息。
- Host 完整性、预算、验证、封存、改后运行、无变更和未知停止原因优先于上一轮 route 展示，并提供证据入口与恢复条件。
- 缺少工作流材料如实说明；正常 SKIP 保持无需执行，出现新证据时才复核。
- DEFER/REQUEST_MORE_WORK 指向 hypothesis unknowns、Solution summary、Reviewer concerns，并说明补充材料与授权条件。
- CLI 启动失败及旁路生成失败提供对应入口；未增加调用、自动重试、HFL item 或 session 恢复。
- 回归测试、类型检查、CLI 失败 smoke 与三份真实历史报告重渲染通过；machine JSON 保持不变。全量结果与基线失败见 [P0 验证记录](../../artifacts/ae-p0-continuation/verification-summary.json)。

该交付证明指引可以显示，不证明问题已被解决，也不代表完整自动 continuation。P1 下一步是以既有童年对照材料为输入，逐项回应 `000010` 的未决 concerns，形成明确的问题分类和后续取证/产品裁决清单；不自动执行其内容或收益调整提案。采样与候选选择工作保持独立验证。

### P1 有界后续案例（2026-09-09）

已对 `000010` 的七条 Reviewer concerns 逐项回应，见 [P1 调查记录](../../artifacts/ae-p1-followup-000010/followup.json)及 [内容池清单](../../artifacts/ae-p1-followup-000010/pool-inventory.json)。这是当前任务的调查结果，不是新的 Participant review，不修改原 session decision 或 HFL disposition。

- 已回答：主动行动 `entry-000020` 不属于被动内容源，原被动配置方案不能承诺解决它；相关四个游戏源码文件与原运行一致。
- 已补证：武林 3–7 岁静态主池依次为 5/6/5/5/4 条，书香为 4/4/5/6/5 条；5–7 岁没有已编写的中性 fallback 条目，但仍有程序 gap。静态池不是扣除历史后的实际剩余池。
- 部分回答：九次对照说明不同标题、出身主题与主动策略需要分开判断；内容与总结呈现对主观重复感的贡献尚未分离。
- 保留未决：没有经批准的逐行目标差异，没有证据支持减少体魄收益，也没有证明 CONTENT_GAP。原 configuration option 仍不可执行。
- 验证：`preschoolPassiveSpineTests`、`preschoolOriginIsolationTests` 通过；未修改产品源码、未调用 Participant、未自动恢复运行。

**下一入口：Human 产品审阅上述证据，明确“已有不同场景具体缺少哪种重要童年经历或长期回应”。** 若能明确缺口，再形成 PD-106 的逐条 Content Proposal 与相应审批；若不能，则保留不改动结论。不要把“再补几个 seed”当作该产品判断的替代，也不要把本案例当作自动 continuation 已实现。

### P2 采样链路验证（2026-09-09）

当前工作区的随机采样实现已完成本地确定性验证，尚未提交，也没有新的真实 Participant batch：

- 实际实现从完整的 8 人 P8 roster 选人；不是此前仅作对照的三个角色。生成的 seed 决定角色，封存输入记录实际角色与运行 seed；同一 session 的后续 round 沿用该来源。
- 指定 `9000–9007` 覆盖全部 8 个 roster 位置，每人执行一次 Phase0 和同输入重放，共 16 次本地模拟，目标年龄 8 岁。全部 seal 校验通过，8 组 observable payload hash 均一致。
- 该样本刻意覆盖 roster，不是随机频率实验，也不证明完整人生的稳定性。随机允许重复，不承诺三次运行覆盖三人。
- `phase0EndToEnd`、`p2-real-rerun` 和 operator 测试通过。改后运行测试使用受控工程 fixture，不是实际 Participant 自然产生的跨轮成功证据。
- 当前未修改候选选择、产品内容、权限、retry 或 HFL 状态。源码 fingerprint 在模拟前后保持一致。

证据：[采样与封存重放记录](../../artifacts/ae-p2-sampling-20260909/sampling-proof.json)。本项仅关闭工程采样验证；真实随机运行能否扩大调查主题，仍待观察。下一项候选选择优化先做契约审计，不能把当前固定选择语义静默改成随机挑题或按容易执行排序。

## 7. 证据与实现入口

- 自然运行报告：
  - [000007](../../artifacts/evolution/run-reports/ae-report-a897121177f9d48e/report.json)
  - [000008](../../artifacts/evolution/run-reports/ae-report-d1e5dd0d655f72c2/report.json)
  - [000009](../../artifacts/evolution/run-reports/ae-report-fb7a24bb538fddb2/report.json)
  - [000010](../../artifacts/evolution/run-reports/ae-report-297365eafcced214/report.json)
  - [000011](../../artifacts/evolution/run-reports/ae-report-556645ea3f7b902f/report.json)
  - [000012](../../artifacts/evolution/run-reports/ae-report-218763db9ec84eba/report.json)
- [九次本地对照及验证](../../artifacts/ae-childhood-comparison-20260908/summary.json)：P8 bootstrap 与自动策略诊断样本，不代表无干预真人游玩。
- [终态契约](../../src/evolution/solutionDecisionContract.ts)、[Decision Router](../../scripts/evolution/problemAgnosticSolution/routeSolutionDecision.ts)、[多轮执行](../../scripts/evolution/multiRoundExecutionValidation.ts)。
- [Human-view 投影](../../scripts/evolution/reporting/buildHumanReviewSummary.ts)、[operator](../../scripts/evolution/operator/runOrdinaryEvolution.ts)、[HFL review](../../scripts/evolution/humanFollowup/reviewHumanFollowupWorkItem.ts)。

上述 artifacts 是本地运行证据，可能未随仓库分发；缺失时应标记不可用，不补造内容。本文保留结论摘要，不替代原始证据，也不是待办状态数据库。后续实施后更新对应结论，已接受的长期规则进入现有权威文档，避免形成第二套 authority。
