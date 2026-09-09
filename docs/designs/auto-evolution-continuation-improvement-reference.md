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
| `OPERATOR_PREFLIGHT_FAILED`、`PARTICIPANT_BINDING_UNAVAILABLE` | 从 CLI 错误进入宿主/绑定诊断；当前仅强制 `dev` 分支。dirty tree 可启动是 **DEV_CONVENIENCE_ONLY**（本地边改边跑；result 披露 `workingTreeClean` + fingerprint），**不是** Product Decision，也不是正式观察 batch 的权威策略 | 前置条件满足并具备运行授权后再启动；不自动 stash/reset，不切换 provider，不伪造未开始的 session 结果。正式观察 / 可引用结论的 run 仍应在 clean tree 上执行；dirty 证据必须带着 `workingTreeClean=false` 解读，不得当 clean baseline |
| `PARTICIPANT_FAILURE`（External Feedback `invalid_reference` / parse 等）且为 local-subagent | 优先读 `feedback-runs/<runRef>/` 下 create-only sidecars：`participant-prompt.txt`、`participant-binding.json`、`participant-execution-trace.json`，以及既有 `raw-participant-response.txt` / `invocation.json` | 这些 sidecars **仅覆盖 ordinary AE External Feedback local-subagent**；Hypothesis / Solution / Reviewer **不在本边界内**，不得默认期待同名文件。未证明其他 Role 需要前，不推广 |
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

随机采样实现已完成本地确定性验证；当时尚未提交、未观察新的真实 Participant batch。后续提交与自然运行见下节：

- 实际实现从完整的 8 人 P8 roster 选人；不是此前仅作对照的三个角色。生成的 seed 决定角色，封存输入记录实际角色与运行 seed；同一 session 的后续 round 沿用该来源。
- 指定 `9000–9007` 覆盖全部 8 个 roster 位置，每人执行一次 Phase0 和同输入重放，共 16 次本地模拟，目标年龄 8 岁。全部 seal 校验通过，8 组 observable payload hash 均一致。
- 该样本刻意覆盖 roster，不是随机频率实验，也不证明完整人生的稳定性。随机允许重复，不承诺三次运行覆盖三人。
- `phase0EndToEnd`、`p2-real-rerun` 和 operator 测试通过。改后运行测试使用受控工程 fixture，不是实际 Participant 自然产生的跨轮成功证据。
- 当前未修改候选选择、产品内容、权限、retry 或 HFL 状态。源码 fingerprint 在模拟前后保持一致。

证据：[采样与封存重放记录](../../artifacts/ae-p2-sampling-20260909/sampling-proof.json)。本项仅关闭工程采样验证；真实随机运行能否扩大调查主题，仍待观察。下一项候选选择优化先做契约审计，不能把当前固定选择语义静默改成随机挑题或按容易执行排序。

### P2 候选选择契约审计与新批次复核（2026-09-09）

审计基线 `1eef1d0`；角色采样与 seed 封存已分别进入 `9a8806d` 和 `1eef1d0`。本次仅更新参考文档并生成本地审计材料，未修改运行代码。

**新证据优先于旧假设。** 新发现三轮自然运行均使用 `1eef1d0`：

| Session（20260909） | 实际角色 | 候选数 / 已调查数 | 实际终态与继续入口 |
| --- | --- | --- | --- |
| `000001` | `p8-explorer-lu` | 5 / 1 | `DEFER / INSUFFICIENT_EVIDENCE`；从原 Solution 的 unknowns 与所选 evidenceRefs 开始补证据，保留原停止结果 |
| `000002` | `p8-balanced-wei` | 未进入 hypothesis 阶段 | `PARTICIPANT_FAILURE / EXTERNAL_FEEDBACK / invalid_reference`；从原始响应 `observations[7].evidenceRefs` 的 `entry-000-123` 开始诊断 |
| `000003` | `p8-cautious-han` | 6 / 1 | `ESCALATE_HUMAN`；从现有 retained HFL item 与 Reviewer 意见进入异步产品复核，active count 从 4 变成 5 |

三轮 observability 均 PASS，均无产品执行和跨轮。两条被调查假设均转向中后段重复体验；这证明本批确实采到了不同角色与不同人生阶段的问题，不证明随机频率均衡或长期主题覆盖。11 条候选中仍有 9 条未调查，但“未调查”不等于更重要，也不证明应该替换当前所选问题。

**选择边界与耦合：**

- `selectFirstHypothesis.ts` 的 `fresh-problem-hypothesis-selection-v1` 明确固定 `rule=first_hypothesis_in_participant_order`、`selectedIndex=0`，保留原始候选文件 hash 与所选 hypothesis hash。
- `buildProblemPackage.ts` 和 `buildBoundedCausalAttribution.ts` 将所选 draft 包装为单条列表重新解析；其 ID 会被重建为 `hypothesis-000001`。若仅把选择改为第二条，Problem Package 构造会拒绝它。该行为与当前固定第一条路径一致，不是已发生的普通运行回归。
- Hypothesis prompt 允许 `0..N`，禁止 priority/score 等字段，没有说明 downstream 固定取第一条。此处是可讨论的通信缺口，但不能直接推断 Participant 已因缺少说明而排错序，也不应借补提示词引入未经验证的优先级标准。
- 报告通过所选 ID 引用问题；PD-111 的诊断范围必须继续严格等于所选问题的 evidenceRefs。不能通过重排、重编号历史候选或扩展诊断材料来绕过选择边界。

**本次决定：暂不随机选题。** 新角色采样已经改变观察范围，继续同时改变候选规则会混淆因果；当前证据不足以证明改变选择契约比处理具体未解决事项更有价值。本项关闭“契约审计”，不关闭“长期候选覆盖改善”。

若后续不同角色仍反复调查同一问题、且原始候选确有有价值的其他主题，再进入独立选择设计。其最小边界应包括：明确新版本与选择规则；保存原列表、原 ID、实际 index 和可重放选择依据；修正两个消费者对单条 ID 的重建假设；覆盖零候选、非首项、来源 hash/ID 一致性、诊断严格同域和旧产物可读性。该设计涉及原任务明确要求保留的 Schema 语义，必须获得具体边界变更授权后实施，不能把“继续”解释成静默改写 v1。

**已由 Human 搁置的独立问题：** `000002` 的反馈包含不存在的 `entry-000-123`。Human 补充说明该格式错误曾多次出现，并明确要求后续专门处理，本轮不再调查。保持 validator fail closed，不猜测修正 ID、不覆盖旧响应、不增加隐式重试。

验证：`freshProblemTransferSelection`、`problemPackageBuilder`、`boundedCausalAttribution` 三组原有测试通过；本地受控探针证明第一条可构造、第二条因 ID 重建被拒绝。未新增游戏模拟或真实模型调用，未重跑全套测试，未宣称运行改善。审计材料：[新批次与候选清单](../../artifacts/ae-p2-candidate-audit-20260909/new-runs.json)、[选择边界探针](../../artifacts/ae-p2-candidate-audit-20260909/check-selection.ts)。

### P1 方案具体化与可接手调查（2026-09-09）

继续处理“证据不足”和“方案不合规”之后缺少具体推进条件的问题。修改限定在现有 Solution / Reviewer prompt 和对应测试，沿用现有输出字段、决策契约及调用预算：

- Solution 在 `proposedChange` 交代对象与具体前后差异，在既有 rationale/risks 中交代保留语义与验证方法；未定的产品选择留在 unknowns，不编造参数凑成可执行方案。
- 未知项需要说明已有证据回答了什么、最小区分性检查、起始引用及恢复条件。仅使用当前 job 可访问证据，不假定其他 session 已传入，也不请求越界内部材料。
- 跨运行普遍性只用于确实依赖它的结论或决策，不把它变成所有局部问题的默认前置条件。
- Reviewer 区分“这个实现方案被禁止”与“产品目标必须改变权威”，在有依据时指出现有边界内的调查路径，不替 Solution 设计或批准未经审查的替代方案。

本次另用已完成的 `20260909-000001/000003` 做有界证据对照，未把对照注入或改写历史 Participant 结果。13 个已选条目中，两轮共同出现 `jianghu_year_patrol` 与 `scholar_year_social`，支持不同角色的这些案例存在相近的即时反馈形态；不证明全体玩家或所有路线的普遍性。部分选择配置含持久 flag / event record，因此“即时只有数值”不能直接推出“没有后果”。涉及配置与封存 workspace 文件均与当前源码一致。

原 `000001` 请求的不同角色证据现在部分具备；仍需区分呈现、内容与节奏原因。原 `000003` 的普通 ChoiceOutcome wrapper 方案继续不合规，不要求 Human 为救该方案而撤销 PD-112。下一条具体调查可以从既有 `medical_apprentice` 的写入、后续消费者和真实可见回应开始，验证是否丢失已存在的有意义后果，再决定是呈现修复还是正式产品缺口。不能仅凭配置消费者存在就宣称本次人生实际出现了后续回应。

证据：[跨运行条目与配置对照](../../artifacts/ae-p1-handoff-20260909/cross-run-evidence.json)、[已回答问题及后续检查](../../artifacts/ae-p1-handoff-20260909/followup.json)。测试先复现缺少交接要求，再验证两端实际 prompt 交付；这仅证明工程交付，不证明 LLM 遵循率或自然运行改善。没有新模型调用、自动 continuation、游戏配置修改或 HFL 状态变更；效果未验证前不扩大本轮范围。

验证结果：Solution、Reviewer、workflow integration、Solution/Reviewer replay 及 `vue-tsc --noEmit` 通过。全套 178 项中 175 项通过；`b0GuardrailCalibration`、`b0IsolationAndHash`、`b0RealControlHeadless` 三项冻结基线检查失败，输出含既有 HEAD 超出 freeze 和当前 dirty paths，不宣称全绿、不放宽 gate。详见[验证记录](../../artifacts/ae-p1-handoff-20260909/verification.json)。

> 后续工程便利（**非** Product Decision）：ordinary operator 允许 dirty tree 启动并披露 `workingTreeClean`（`DEV_CONVENIENCE_ONLY`）；`runRealTestGate` 将 B0 标为 `B0_NOT_IN_WORKING_TREE_GATE`（frozen-checkout 实验，不再作为当前 working-tree gate）。正式观察 batch 仍应用 clean tree；若恢复 clean 门禁，应同步重审是否把 B0 加回 gate。

### P1 拜师后果可见性核查（2026-09-09）

**关闭本案例的“已有后果是否丢失”疑问：没有发现丢失，不实施游戏修复。** 对 `ordinary-run-20260909-000003` 原始 sealed source 的核查确认：

| 原始 entry | 年龄 | 玩家已收到的经历 | 与拜师的联系 |
| --- | --- | --- | --- |
| `entry-000062` | 20 | 拜师名医，选择“拜师学艺” | 既有选择配置写入 `medical_apprentice` |
| `entry-000066` | 20 | 采药炼丹，正文明确“师父教你识别各种草药，带你上山采药” | 事件条件读取 `medical_apprentice`，后续写入 `medical_herb_master` |
| `entry-000070` | 21 | 坐诊治病，正文说明医馆坐诊与临床经验 | 条件读取 `medical_herb_master` |
| `entry-000073` | 21 | 瘟疫救治，玩家选择“全力救治” | 条件读取 `medical_apprentice` |

证据层级：原始运行已实际捕获上述事件；不是仅从配置推断可达，也未注入路线 flag。Medical 配置与原运行封存 workspace 一致。原 Phase0 seal 校验通过；从原 source 重新投影完整 observable payload，与 sealed reviewer-input、round source、Solution workspace、Reviewer workspace 四处文件逐字节一致。故本案例不存在这些后续正文在 AE 材料交付中丢失的问题。此结论不证明浏览器呈现或玩家主观成就感充足，也不否定“即时选择反馈偏数值”的原观察。

本次调查说明后续检查应区分**即时反馈形态**与**后续经历回应**，不能以所选 entry 缺少即时 narrative 为由推断整个后续人生没有回应。无需新增 ChoiceOutcome wrapper，也不需要为本案例改写 PD-112。完整 player-observable payload 本已包含后续材料；不要据此扩大 PD-111 的内部 diagnostic projection。

验证材料：[可重复核查脚本](../../artifacts/ae-medical-followup-20260909/verify.ts)、[原始链路与校验结果](../../artifacts/ae-medical-followup-20260909/verification.json)。现有 `playerSurfaceCapture`（含本地模拟）与 `playerObservableTranscript` 测试通过。本项未修改运行源码，未调用真实 Participant，未修改原 session 或 HFL disposition；未重跑全套测试。

下一有界入口保留为原对照中独立的节奏疑问：`000003` 多个不同事件集中在 20 岁，先区分真实调度与模拟推进造成的集中，再决定是否存在可修复问题。它尚未被判定为 bug，不以本次 Medical 可见链路核查替代该验证。

### P1 同龄事件集中：时间与连续派发诊断（2026-09-09）

**确认存在同日连续事件，暂不实施无依据的耗时修改。** 使用 `000003` 的归档 workspace 代码、原 persona 与 seed 做本地重放，目标停止年龄 23；23 岁前的 player-surface 原始步骤与原运行完全相同。记录实际日历后发现：20 岁的 8 个事件全部开始并结束于游戏日历第 21 年 1 月 11 日：行侠仗义、闭关修炼、文会交际、苦读诗书、拜师名医、远行贸易、采药炼丹、邻里人情。

源头分为两层：

1. 这些已执行选择或 auto effects 没有推进日历；`selectChoice` 执行配置效果后生成 summary，`period_summary` 确认路径可在当前日期继续取得下一事件。`ageRange.min=20` 仅表示进入候选窗口，并不意味着要在 20 岁当天经历全部内容。
2. `headlessPersonaRunner` 在 16 个年龄未变的 phase 步骤后调用 `ensureProgressionCatchUp`，强制加一年。该计数包括 summary 确认，并非“16 个事件”。本样本因此结束了这段同龄集中；不能将此补偿等同于事件本身合理消耗了一年。

有界反事实只在进程内抑制 20 岁的补偿调用，未改动归档文件或正式源码：20 岁事件从 8 个增至 11 个，前八个的顺序与日期不变；随后才由真实时间效果推进月份。它反证了“强制加年造成最初八个事件同日集中”的解释，不证明应删除 guard。两次实验均正常达到停止年龄条件；控制组最终 25 岁、反事实组 23 岁，目标年龄是停止阈值，允许最后一次事件耗时越过阈值，不截断事件伪造一致终点。

**问题分类与后续入口：** 当前更支持事件耗时语义与连续派发节奏不协调。闭关、苦读、远行等描述持续经历，却可在该路径无日历耗时地连续结算；不能仅归咎于奖励文案重复，也不能通过增加普通结果文案解决时间关系。下一步针对这些既有事件形成最小时间语义方案，区分应有持续时间的经历与允许同日发生的瞬时决定；只有明确既有时间推进机制、年龄窗口影响和合理耗时依据后，才实施有界修改。不得任意统一“一事一年”、改防卡死阈值充当产品节奏、或恢复概率 gate。具体耗时尚无验证依据，本轮不编造数值、不改玩家模型或已确定契约。

验证：[重放/反事实脚本](../../artifacts/ae-age20-audit-20260909/replay.ts)、[结果摘要](../../artifacts/ae-age20-audit-20260909/summary.json)、[控制组细节](../../artifacts/ae-age20-audit-20260909/replay.json)、[反事实细节](../../artifacts/ae-age20-audit-20260909/counterfactual.json)。涉及的 runner、progressionLoop、session 与 Medical 配置和当前文件一致；收尾时发现 `identity-year-events.json` 有并行新增路线/习惯准入条件，已保留。实验使用归档代码，不能把本批事件数量直接推广到正在修改的工作区。下一步先在并行修改稳定后复核准入影响，再评估耗时方案。仅证明本次 Headless 路径及实验区别，尚未证明浏览器相同行为或玩家体验改善；未调用 LLM、未变更历史决策或执行产品修复。

### PD-113 准入修改后的节奏复核（2026-09-09）

使用 `000003` 原 persona/seed，分别运行原归档代码、仅替换八条 PD-113 conditions 的归档代码、当前工作区，共三次本地模拟，目标停止年龄 23。单变量实验先断言八个事件除 conditions 外无变化，不修改源码或归档 catalog。原组 23 岁前的 surface 步骤与历史运行完全一致；准入条件文件在实验前后字节不变。

| 组别 | 20 岁事件数 | 其中执行前后日历不变 | 结果 |
| --- | --- | --- | --- |
| 原归档版本 | 8 | 8 | 原同日序列复现 |
| 仅替换准入条件 | 8 | 7 | 事件组成改变，持续时间问题仍在 |
| 当前工作区 | 8 | 7 | 19–22 岁事件与时间记录和单变量组完全一致 |

本样本不再选到原序列中的 `jianghu_year_patrol`、`scholar_year_social`、`merchant_year_trade`，但其他合格事件接替了它们。新序列前六个事件仍不推进日历，随后 `mingyue_value_conflict` 推进三个月。这支持准入修复改变了角色经历的内容，不支持把它称为节奏修复，也不应以总事件数没下降否定 PD-113 的准入目标。

`identityYearContextEligibility` 与 `globalMoneyIdentityYearWalletFlowRetirement` 两组原有/并行交付测试通过。未重跑全套测试；未改动并行实现、未新增模型调用。样本只有一个角色/seed 和有限年龄窗口，不推断全人生或总体体验改善。证据：[对照脚本](../../artifacts/ae-context-followup-20260909/compare.ts)、[完整记录](../../artifacts/ae-context-followup-20260909/comparison.json)、[摘要](../../artifacts/ae-context-followup-20260909/summary.json)。

**本项收口与下一设计边界：** 准入影响复核完成。持续经历耗时仍值得独立设计，优先候选限定为 `jianghu_year_training`（三个选择）与 `scholar_year_study`（两个选择），原因是两者明确描述持续练习且本样本实际零耗时。先确定耗时与已有投入语义、年龄窗口、事件效果执行顺序的关系，再给出具体差异和对照验证；不把“增加几个月”当作已证实的正确方案。PD-113 明确保持 effects、choice semantics、scheduler behavior 不变并排除 annual cadence 调整，因此本轮不能把耗时改动并入该已接受准入切片。后续正式设计应明确新的产品决定，仅覆盖所选持续经历；保留 PD-113 conditions，不调整通用防卡死阈值或全局调度，不以减少事件数或提高 READY 比例验收。

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
