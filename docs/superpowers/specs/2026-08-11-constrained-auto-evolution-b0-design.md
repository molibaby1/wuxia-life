# 受约束自动进化系统：B0 护栏校准设计

状态：B0 护栏校准已完成并关闭（人工 accept）。
最终依据：HEAD `e6e9118`，run `.tmp/b0/b0-status-20260812085143/`。
废止：`b0-closure-20260812081550-8f7730` 不得作为当前最终依据。
B0 `passed` 不授权 B1、正式配置修改、自动合入或发布；B1 必须作为新的独立产品阶段重新裁决。

## 1. 目标与边界

### 1.1 目标

B0 只验证自动优化系统的护栏是否能识别已知的坏配置，并保证评估过程本身可复现、可审计、不可被污染。

B0 通过后必须能够证明：

- 已知严重坏例可以被机械审计或红队审查发现；
- 正常 Control 样本不会被硬性误杀；
- 相同 manifest 与 seed 可以复现相同的原始 Trace、机械指标和确定性 verdict；
- 机械审计、玩家视角盲评和红队意见之间的分歧会被保留；
- 每条结论都可以追溯到源码、配置、fixture、seed 和运行版本。

### 1.2 非目标

B0 不负责：

- 修改或优化正式事件配置；
- 自动生成、选择、合入或发布候选配置；
- 证明游戏已经“好玩”或替代真人体验验证；
- 重建 causality/replayability 正式验收 metric；
- 修改 PlayerState、GameState、Snapshot、Contract、Schema 或存档版本；
- 新增 Route、Identity、关系数值或第二 canonical source；
- 调整现有 P8/P9/P40 正式阈值和 verdict 语义。

B0 通过不自动授权 B1、正式配置修改、自动合入或发布。B1 必须作为新的独立产品阶段重新裁决。

## 2. 当前系统依据与约束

当前项目已经具备：

- 由 `src/data/events.json` 及其 imports 驱动的事件目录；
- Headless、seed 和 Trace 运行能力；
- `gate:experience`、`gate:playability`、Golden Line 和 P3 等现有验证入口；
- 可复用的事件执行记录、公开结果和部分纯指标函数。

当前系统不能直接作为 B0 闭环：

- persona 选择策略会读取 direct/outcome hidden effects，不能直接代表真实玩家选择；
- experience Trace 同时携带 hidden policy、完整状态和 state delta，必须先投影为 player-visible Trace；
- 部分 gate 脚本会写入 tracked latest 报告，候选运行不能直接调用这些写入入口；
- 当前没有通用 candidate overlay、同 seed baseline/candidate runner、train/holdout/adversarial registry、patch-scope validator 或 immutable gate manifest。

当前工作树已有青年重大机会 Slice 的用户改动。B0 不重置、清理、格式化、覆盖或提交这些改动；实现前必须捕获可复现的源码指纹，无法捕获时直接 blocked。

## 3. 角色与信息隔离

B0 不使用多个 Agent 的多数投票。独立性来自职责、输入和权限隔离。

| 角色 | 允许读取 | 输出 | 禁止 |
| --- | --- | --- | --- |
| 实验控制器 | 全部 manifest 和运行元数据 | 冻结 manifest、seed 分层、A/B 映射、状态推进 | 修改评价阈值或语义 |
| Fixture 构造器 | B0 fixture 规范 | Control、Known-bad、攻击 fixture | 修改正式事件源 |
| 模拟器 | 冻结 overlay、seed、运行版本 | 原始 Trace | 评价结果或修改候选 |
| 机械审计器 | 原始 Trace、hidden state、硬约束定义 | 确定性指标和硬性 verdict | 读取盲评或红队结论 |
| 玩家视角盲评器 | 脱敏 player-visible Trace、匿名 A/B 样本 | 感性观察和证据引用 | 读取 hidden effects、阈值、A/B 真身份、机械 verdict |
| 红队审计器 | 匿名样本和必要的原始证据 | 漏检、污染、泄漏和越权报告；拥有 veto | 修改运行输入或覆盖其他结论 |
| 人工裁决者 | 完整证据、全部冲突和密封标签 | B0 passed/failed/blocked 与理由 | 以多数票替代证据 |

各评审角色在提交结果前不得读取其他评审结果。量化审计与盲评冲突时进入人工复核，不自动平均。

## 4. 数据流与状态机

```text
冻结 manifest
  → sealed fixture/seed/source
  → isolated overlay
  → 同 seed 模拟
  → mechanical audit + blind review + red-team review
  → evidence/hash check
  → human decision
```

运行状态为：

```text
draft
  → sealed
  → queued
  → simulated
  → audited
  → evidence_checked
  → awaiting_human
      → passed
      → failed
      → blocked
```

- `draft`：输入仍可编辑。
- `sealed`：manifest、fixture、seed 和版本指纹被冻结。
- `queued`：等待执行，不再接受输入修改。
- `simulated`：原始 Trace 已生成。
- `audited`：机械审计、盲评和红队结果均已产生。
- `evidence_checked`：hash、脱敏、来源和 A/B 映射通过检查。
- `awaiting_human`：等待人工查看完整证据。
- `passed`：B0 护栏校准通过，不代表正式配置可合入。
- `failed`：运行完整但漏检坏例或硬误杀 Control。
- `blocked`：输入泄漏、版本不确定、证据污染或越权修改。

B0 不需要 runtime rollback，因为它不改变正式 runtime。失败后创建新的 `runId`，保留旧 artifact，不覆盖旧结果。

## 5. Artifact 与证据链

每次 B0 运行都生成独立、不可覆盖的 artifact 集：

```text
manifest
fixture-set
seed-bundle
raw-traces
player-visible-traces
mechanical-audit
blind-review
red-team-review
evidence-index
human-decision
```

`manifest` 至少冻结：

- `runId`；
- 源码和 dirty diff 指纹；
- 事件目录和 overlay 指纹；
- fixture 与 seed bundle 指纹；
- evaluator、gate 和 artifact schema 版本；
- 允许的候选范围和禁止修改路径。

证据链必须可逐层追溯：

```text
source fingerprint
→ manifest hash
→ fixture hash
→ seed bundle hash
→ raw trace hash
→ visible trace hash
→ audit hash
→ review hash
→ verdict hash
→ human decision hash
```

player-visible Trace 必须移除：

- direct/outcome hidden effects；
- 内部阈值和评分；
- 完整 hidden state；
- A/B 真实身份；
- 机械审计 verdict。

任一 artifact 缺失、hash 不匹配、脱敏失败、A/B 映射泄漏或正式路径写入，都必须是 `blocked`，不能通过调参继续运行。

## 6. Fixture 与样本分层

### 6.1 游戏体验坏例

第一版只覆盖已有指标能够解释的结构问题：

1. 单事件在短窗口内重复触发；
2. 单一事件类别或单一事件过度垄断；
3. 正式事件被抑制，形成长期低影响空窗；
4. 选择不可达、多个选项实际等价或路径被单一选择吞并；
5. 实际负面状态变化存在，但玩家可见预警或解释被移除。

机械审计负责证明实际状态和事件序列，盲评只判断玩家是否能从公开 Trace 理解结果。B0 不把这些观察提升为新的 causality/replayability 正式标准。

### 6.2 管线污染攻击

以下攻击不是体验失败，而是立即 `blocked`：

- 修改 gate 阈值或测试；
- 覆盖 baseline 或 latest report；
- 将 holdout seed 暴露给提案或盲评；
- 在 player-visible Trace 中泄漏 hidden information；
- 修改 PlayerState、Snapshot、Contract 或 Schema；
- 修改 manifest 允许范围之外的文件；
- 让评审角色读取其他角色结论后重写意见。

### 6.3 样本分层

- `Control`：已知正常 fixture，用于检查硬误杀；
- `Known-bad`：人工注入的坏例，真实标签只由控制器保存；
- `Holdout`：未参与 fixture 调整的 persona × seed × routeTrack 组合；
- `Adversarial`：专门攻击重复、空窗、选择坍缩、负面解释缺失和基线污染，只用于守门。

沿用现有 persona roster，不新增 persona。train、holdout、adversarial 的 seed 和组合必须在 manifest 中预先冻结，不能看完结果后重新切分。

## 7. B0 判定标准

### 7.1 通过

只有同时满足以下条件才能 `passed`：

- 所有严重 Known-bad 与 Holdout 坏例都被机械审计或红队发现；
- Control 没有硬性误杀；
- 同一 manifest + seed 的确定性结果可复现；
- player-visible Trace 没有 hidden information 泄漏；
- 红队没有发现证据链污染或越权路径；
- 所有分歧都被原样记录；
- 没有正式配置、测试、阈值、baseline 或 tracked report 改动；
- 人工可以从原始 Trace 重建结论，而不是只依赖摘要。

“LLM 觉得更好”不能单独使 B0 通过。

### 7.2 失败

运行完整但发生以下情况时为 `failed`：

- 严重坏例漏检；
- Control 被硬性误杀；
- 同一输入产生不可解释的确定性结果差异。

### 7.3 阻塞

发生以下情况时为 `blocked`：

- dirty source 无法冻结；
- 输入、标签、holdout 或 A/B 映射泄漏；
- artifact hash 或证据链断裂；
- 脱敏失败；
- 写入正式目录；
- 发现越权文件修改；
- 必须修改正式状态、Contract 或核心运行逻辑才能完成 overlay。

`failed` 和 `blocked` 都不能进入 B1，也不能通过放宽阈值、删除坏例或修改评审 prompt 来修复。

## 8. 最小实现边界

建议新增范围限制在独立 B0 工具目录及其专项测试内，使用被忽略的临时 artifact 根目录保存运行结果。

优先复用：

- Headless catalog/session 注入能力；
- 现有 simulator、seed、GameProcessRecord 和 ExperienceTrace；
- 现有纯指标函数与 gate evaluator；
- 现有事件质量校验的纯判断逻辑。

不能直接复用会覆盖正式报告的脚本入口。

候选 overlay 必须是内存或临时文件级替换，不能修改正式 `src/data`、singleton、全局 flags 或正式事件加载语义。如果现有注入点不足以实现隔离 overlay，必须停止并报告结构性 blocker，不得顺手扩大到核心代码重构。

## 9. 测试矩阵

至少覆盖：

- source boundary 与 dirty fingerprint；
- fixture overlay 隔离；
- baseline/candidate 同 seed 配对；
- player-visible Trace 脱敏；
- 角色信息隔离；
- 机械审计对已知坏例的检测；
- artifact hash 和状态迁移；
- 禁止写入正式路径；
- `failed` 与 `blocked` 语义；
- 同 manifest + seed 的重复运行一致性。

B0 不要求 Browser 证明真实玩家体验。Browser 或真人 playtest 仍是后续体验校准证据，不能被 B0 结果替代。

## 10. 实施前提与停止规则

设计文档获审阅后，才可以编写实现计划。实现前必须：

1. 将 B0 作为当前产品阶段中的独立、有限 Slice 记录；
2. 记录允许新增的工具和测试 owner；
3. 确认当前 dirty worktree 的源码快照方案；
4. 确认现有 Headless 注入点可以实现隔离 overlay。

以下任一情况必须停止并重新裁决：

- 需要修改 PlayerState、Snapshot、Contract、Schema 或存档版本；
- 需要新增第二 canonical source；
- 需要改变现有正式 gate 语义或阈值；
- 需要写入或覆盖 tracked latest 报告；
- 无法隐藏 holdout、hidden effects 或 A/B 身份；
- 多 Agent 只能通过同源投票而不能形成独立证据；
- B0 结果必须依赖“游戏已经好玩”的假设才能成立。

## 11. 收口与后续

B0 完成后只提交校准 artifact、检测矩阵、误杀结果、可重复性结果、证据链结果和人工裁决。

B0 `passed` 只意味着护栏具备进入下一次产品裁决的条件，不自动授权：

- B1 候选生成；
- 正式事件配置修改；
- 自动合入或发布；
- 取消真人体验校准。

B1 需要单独定义优化目标、配置白名单、Pareto 规则、候选审批和回滚策略。
