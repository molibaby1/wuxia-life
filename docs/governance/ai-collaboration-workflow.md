# ChatGPT × Codex 阶段目标协作协议

> 用途：规定 Wuxia-Life 项目中 ChatGPT、Codex 与人工维护者的职责、授权边界和回传格式。
> 目标：同时控制产品语义风险、降低无意义往返，并利用聊天与 Codex 的独立 token 额度。
> 最后更新：2026-08-14
> 本轮增补：Human Gate 收敛、授权继承与交接职责；保留 Product Direction Drift Guard。

---

## 1. 协作模型

项目采用：

```text
阶段目标驱动
+ 正式设计 acceptance 后授权继承
+ 边界内自主执行
+ 结构性 blocker 才暂停
+ 正常阶段只保留“设计 acceptance / 最终 closure”两个 Human Gate
+ 阶段完成后统一验收
+ 复杂工作先做产品对齐，防止局部合理整体漂移
```

不是：Codex 无限自主推进整个项目、每一个测试细节都返回 ChatGPT、ChatGPT 直接修改全部代码，或用当前代码和测试反向决定产品语义。

最终产品方向决策者始终是**人工维护者**。Agent / ChatGPT / Codex 只做检查、报告和建议，不得自行宣布新产品语义。

---

## 2. 模型分工

### ChatGPT / 深推理模型

负责：

- 识别真正要解决的问题；
- 区分产品缺陷、模拟器偏差和证据缺口；
- 裁决产品语义；
- 定义阶段目标；
- 明确权威层级和禁止范围；
- 定义结构性 blocker；
- 在复杂任务上执行 Product Direction Drift Guard；
- 在正式设计 accepted 后形成 implementation plan 与可直接交给 Codex 的执行任务；
- 复核 Codex 完成报告与 Human 提供的 runtime evidence；
- 决定下一阶段。

原则：

```text
高成本
低频
高杠杆
```

### Codex / 执行模型

负责：

- 读取真实仓库；
- 核对调用链和 owner；
- 在授权范围内设计实现；
- 修改代码；
- 新增聚焦测试；
- 运行完整验证；
- 完成浏览器验收；
- 修复当前 Slice 内的普通回归；
- 输出结构化报告并报告 runtime artifact 路径；
- 对复杂 / 产品性 / 架构性任务在开始与收口时执行 Drift Guard（见 §14）；
- 默认不负责为 ChatGPT 交接制作或上传 `project.zip` / evidence ZIP，除非 Human 明确要求。

原则：

```text
低成本
高频
工程闭环
```

### 人工维护者

负责最终产品责任、决定正式设计与最终 closure 是否接受、管理 Git/commit/branch/发布，并对高风险变更进行最终审批。项目源码包与 runtime evidence 包由 Human 按需要手动打包 / 上传给 ChatGPT；Codex 只需报告相关路径。Human Gate 的产品对齐问题由人工最终回答。

---

## 3. 为什么采用分层协作

### 3.1 风险控制

防止：

```text
局部语义误解
→ 自主扩大实现
→ 修改代码和测试
→ 错误设计形成工程自洽
→ 用“已经做了很多”反向抬高产品权威
```

### 3.2 Token 配额优化

聊天与 Codex 使用独立额度：

```text
ChatGPT / Sol：
深度分析、产品裁决、少量高价值任务定义

Codex / Luna：
代码搜索、实现、测试、浏览器运行、大量工程执行
```

目标不是减少两者分工，而是减少没有决策价值的往返。

---

## 4. 阶段任务必须包含

### 4.1 目标状态

描述完成后必须成立的产品事实，避免只写“优化结局”“完善身份”“修复体验”。

### 4.2 已确认事实

只写已经有代码、测试、Trace 或浏览器证据支持的事实，并明确区分已确认事实、合理推断、暂定假设和尚待验证。

### 4.3 允许范围

允许修改的文件类别或系统边界。文件清单是预估，不要求为符合清单制造空改动；真实 owner 不同但仍在边界内时，Codex 可以自行调整。

### 4.4 禁止范围

列出不可为了完成目标而改变的产品规则和系统。

### 4.5 结构性 blocker

定义什么情况必须停止并请求产品裁决。

### 4.6 完成标准

必须可验证，且包括产品语义、自动化测试、Local/API/Headless parity、Browser 证据和未闭合项的诚实记录。

### 4.7 产品对齐（仅复杂 / 产品性 / 阶段性任务）

阶段任务定义时必须能指出：对应的第一层产品规范或 Product Decision，以及成功后玩家 / 游戏 / 正式产品能力的具体变化。说不清则不得开阶段。

---

## 5. Codex 自主处理权限

以下属于普通工程问题，Codex 应在当前阶段内自行闭环，**豁免** Product Direction Drift Guard：

- owner 文件与任务预估不同；
- 聚焦测试断言固定了过时数值；
- fixture 需要同步；
- 类型错误；
- 构建错误；
- 允许范围内的技术方案选择；
- 测试注册；
- 报告路径或 CLI 小问题；
- 浏览器 alert/dialog 处理；
- 本 Slice 引入的回归；
- 需要补一个范围内测试；
- 允许范围内新增少量辅助文件；
- 单点 bugfix / 文案笔误 / 纯格式化。

不得因为这些问题频繁返回 ChatGPT，也不得为此做完整产品审计。

---

## 6. 结构性 blocker

遇到以下情况必须停止：

1. 必须修改 PlayerState、Snapshot、Schema 或正式 Contract；
2. 必须新增正式状态来源或第二个 canonical source；
3. 必须改变当前任务明确禁止的产品规则；
4. 存在两个无法由权威文档裁决的互斥产品方案；
5. 真实代码证明当前阶段目标或前提不成立；
6. 问题根因属于另一个独立产品系统；
7. 当前允许范围内无法满足验收标准；
8. 自动化与真实浏览器事实出现产品语义冲突；
9. 为完成目标必须解析非正式文本、测试标签或 Trace 私有数据；
10. 修改会影响当前 Slice 之外的正式行为；
11. Product Alignment / Assumption Drift / Plain-Language Stage Review / External Participant Replacement Check 无法通过，或答案明显偏离第一层产品规范；
12. implementation 需要新增 accepted design 未包含的产品假设、修改第一层产品规范、扩大 scope 或改变 accepted boundary；
13. 需要执行未预授权的真实外部调用，或超过已预授权的 provider / model / 输入边界 / 最大调用次数；
14. 为继续推进必须跨越当前阶段明确的 STOP boundary。

不得自行扩大范围。普通 bugfix、测试修正与 accepted scope 内的实现选择不构成新的 Human Gate。

---

## 7. Blocker 回传格式

```markdown
# 结构性 Blocker

## 已确认事实

...

## 根因与调用链

...

## 为什么当前边界内无法完成

...

## 可选方案

### 方案 A
影响：

### 方案 B
影响：

## 需要裁决的唯一问题

...
```

一次只请求一个最高杠杆裁决。

若因 Drift Guard 停止，额外用一段话说明：偏离了哪条第一层产品目标，以及哪个新假设未经授权。

---

## 8. 完成回传格式

```markdown
# 阶段完成报告

## 结论

目标是否全部成立。

## 根因

原问题为什么存在。

## 修改文件

...

## 产品语义

改变了什么；明确没有改变什么。

## 白话收口（重要阶段必填）

我们刚刚实际做成了什么，它为什么属于这个产品？

## Human Gate 对齐问题（供人工回答）

本阶段成功后，产品为什么比开始前更接近第一层产品目标？
可选结论：implementation succeeded / product direction should stop|retire|change。

## 自动化验证

命令、退出码、P8/P11 状态。

## 浏览器验收

真实完成项与环境缺口。

## Git 状态

是否提交、是否创建分支、是否存在既有 dirty worktree。

## 相邻问题

只登记，不自行实施。
```

---

## 9. 阶段执行循环

复杂 / 产品性 / 阶段性工作的正常路径采用**授权继承**，不再把 planning、plan acceptance、implementation authorization 拆成连续 Human Gate：

```text
1. ChatGPT 读取当前阶段和最新证据（含第一层产品规范）
2. 复杂任务先做 Product Alignment + Assumption Drift Check
3. ChatGPT 完成正式产品设计
4. Human Gate #1：接受 / 不接受正式设计
5. 若 ACCEPTED：ChatGPT 直接形成 implementation plan + Codex execution task
   （只要 plan 不新增产品假设或扩大 accepted scope，授权自动继承，无需再次审批）
6. Codex 在 accepted boundary 内自主实施、测试、修复普通回归；若任务已预授权一次 real smoke，则仅在 deterministic verification PASS 后执行该次 smoke
7. 命中结构性 blocker：按固定格式暂停；否则推进到阶段完成并 STOP
8. Human 按需要手动上传源码包和 runtime evidence；ChatGPT 做一次性 implementation / smoke / Drift Guard review
9. Human Gate #2：最终 ACCEPTED / CLOSED，或指出需要修正的真实 blocker
10. 只在具有 authority 意义的状态变化时更新 current-product-stage.md；新的长期产品裁决才写入 product-decisions.md
```

Human acceptance 不自动创造 accepted design 之外的新产品语义。

---

## 10. 文档维护职责

### `product-decisions.md`

只记录长期有效的已裁决语义。

### `current-product-stage.md`

只记录当前目标、当前 Slice、accepted boundary、完成标准、具有 authority 意义的阶段状态和候选下一阶段。

不要把它当作实时执行流水账；默认不记录 `plan pending`、`implementation pending`、`smoke authorized/running` 等没有独立产品决策价值的微观状态。

### 本协作协议

只有分工、授权或回传规则变化时更新。

### 交接总结

仅在会话上下文过长、需要更换 ChatGPT 会话或需要对外移交项目时生成，不再作为日常滚动看板。

---

## 11. 防止计划过宽

阶段目标不是项目路线图。Codex 达成当前完成标准后必须停止，即使发现身份仍为空、晚年行动重复、其他 ending 文案简单、历史文档混乱或 Deferred 内容未清理。

这些只能登记为候选下一阶段。

---

## 12. 防止任务过碎

不应为一个断言值变化、一个 fixture、一个类型错误、一个测试注册、一个可自动接受的浏览器弹窗、一个报告路径或一个允许范围内的实现选择单独开启 ChatGPT 裁决轮次。

它们应由 Codex 在当前阶段内完成，并豁免完整 Drift Guard。

---

## 13. 每次给 Codex 的短模板

```markdown
# 阶段目标

继承：

- `docs/product/player-model.md`
- `docs/product/auto-evolution-model.md`
- `docs/governance/project-convergence.md`
- `docs/governance/product-decisions.md`
- `docs/governance/current-product-stage.md`
- `docs/governance/ai-collaboration-workflow.md`
- `AGENTS.md`

采用阶段目标模式。复杂 / 产品性 / 架构性任务先做 Product Direction Drift Guard；普通工程问题豁免。

请在不突破当前阶段文档中的目标、允许范围和禁止范围的前提下，自主完成：

- 真实状态核对；
- 根因定位；
- 最小实现；
- 聚焦测试；
- 范围内回归修复；
- 完整验证；
- Browser 验收；
- 完成报告（重要阶段含白话收口）。

普通工程问题无须中途返回。正式设计已经 Human ACCEPTED 时，只要本任务未新增产品假设、扩大范围或改变 accepted boundary，即视为继承 planning / implementation 授权，不再申请重复审批。

只有命中 `current-product-stage.md` 或协作协议定义的结构性 blocker 时才停止，并按 blocker 格式报告。若任务明确预授权 real smoke，严格遵守指定 provider / model / 输入边界 / 最大调用次数，并在完成后 STOP；否则不得自行真实调用外部 participant。

完成时只报告修改、验证结果、runtime artifact 路径与 blocker/deviation；**不要为了 ChatGPT 交接制作或上传 ZIP**，除非 Human 明确要求。

完成当前阶段目标后停止，不得进入候选下一阶段。本任务不创造 accepted boundary 之外的新产品语义或授权。
```

---

## 14. Product Direction Drift Guard

详细条文与 `AGENTS.md` 中同名章节一致。此处只定协作触发点。

### 何时必须执行

- 新设计 / plan / 跨子系统实现；
- 阶段目标定义与阶段收口；
- Human Gate；
- 涉及外部参与者（真人、LLM、Agent、Reviewer、Planner 等）的方案。

### 何时豁免

见 §5：单点工程修复与当前阶段内普通闭环。

### 六项检查（短硬）

| 检查 | 时机 | 失败动作 |
| --- | --- | --- |
| A Product Alignment | 复杂任务开始前 | 停止；不得默认实施 |
| B Assumption Drift | 新设计 / plan 形成时 | 未经授权假设不得成为前提 |
| C Plain-Language Stage Review | 重要阶段结束 | 白话说不清产品归属 → governance review |
| D Human Gate Alignment | Human Gate | 必须回答“更接近哪条第一层目标”；可判停/退役/改向 |
| E External Participant Replacement | 外部智能参与设计 | “若换成真人是否仍合理？”作 drift detector |
| F Authority hierarchy | 任何冲突 | 代码/测试/acceptance 不覆盖产品规范；禁止 sunk-cost 抬权 |

### Drift detection 原则

```text
局部工程自洽 ≠ 产品方向正确
辅助工具变强 ≠ 游戏变好
实现被 accept ≠ 新产品语义成立
已经投入很多 ≠ 必须继续
```

不得建立 alignment score、自动产品打分、新 taxonomy、审核委员会、新 Agent framework 或治理软件。本护栏只补流程缺口。

本协议更新不授权任何 Auto Evolution 或其他产品实现。

---

## 15. Human Gate 收敛、授权继承与交接职责

本节用于避免同一产品决策被拆成多次形式审批。核心原则：

> **默认继续，越界才停。Human Gate 保护产品决策，不保护每一个工程动作。**

### 15.1 正常阶段只有两个 Human Gate

复杂 / 产品性 / 阶段性 successor 的默认流程：

```text
正式产品设计
→ Human Gate #1：ACCEPTED
→ implementation plan + Codex execution（授权继承）
→ deterministic implementation / 预授权 real smoke（若有）
→ STOP + evidence
→ Human Gate #2：final review
→ ACCEPTED / CLOSED
```

不再默认增加：

- planning authorization；
- implementation plan acceptance；
- implementation authorization；
- deterministic 完成后的重复 smoke authorization。

这些动作只有在它们引入了新的产品决策时才重新成为 Human Gate。

### 15.2 授权继承规则

正式设计 Human ACCEPTED 后，默认同时授权：

1. ChatGPT 将 accepted design 翻译成 implementation plan；
2. ChatGPT 形成可直接交给 Codex 的执行任务；
3. Codex 在 accepted scope 内实施、测试并修复普通工程问题。

前提是 plan / implementation **没有**：

- 新增产品假设；
- 扩大 accepted scope；
- 修改第一层产品规范；
- 改变 accepted design / Contract；
- 跨越当前 STOP boundary。

implementation plan 是工程约束和审计基准，不是默认的独立审批 Gate。

### 15.3 Real smoke 预授权

若真实外部调用本来就是该 accepted stage 的必要 integration evidence，可在 Codex execution task 中预授权，无需 deterministic 完成后再往返申请。预授权必须明确：

- provider / model（若适用）；
- 输入来源和权限边界；
- 最大真实调用次数；
- deterministic verification 必须先 PASS；
- 调用失败 / contract failure 后是否允许重试（默认不允许自行追加调用）；
- real smoke 完成后的 STOP。

任何超过预授权边界的调用都属于结构性 blocker。

### 15.4 什么时候必须重新找 Human

只有出现实质性新决策时暂停，例如：

- 新产品假设；
- 第一层产品规范或长期 Product Decision 需要变化；
- accepted design / Contract 需要改变；
- scope 扩大到新的产品系统；
- 新 provider / participant 或超过预授权真实调用次数；
- 跨越 accepted STOP boundary；
- 原 scope 内无法解决的结构性 blocker。

以下不构成新的 Human Gate：

- accepted scope 内的普通 bugfix；
- 测试 / fixture / typecheck 修正；
- 实现 owner 与 plan 预估不同但仍在同一边界内；
- 为满足已接受 Contract 所需的最小工程修正。

### 15.5 Governance 降噪

治理文档记录 authority，不记录每一步执行进度。

`current-product-stage.md` 应优先记录：

- 当前 active / closed 的产品阶段；
- accepted product boundary；
- 当前真正的 STOP；
- Human acceptance / closure；
- 候选下一阶段是否授权。

默认不记录：

```text
plan pending
plan accepted
implementation pending
implementation authorized
smoke authorized
smoke running
```

除非其中某一状态本身承载了独立的高风险产品裁决。

### 15.6 ZIP 与 runtime evidence 的职责边界

源码包和 runtime evidence 是不同交接物：

```text
project.zip
= 源码 / authority / tests / scripts

runtime artifacts
= 某一次真实运行实际发生了什么
```

默认职责：

- **Codex**：实施、测试、生成 runtime artifacts、报告 artifact 路径和 completion evidence；
- **Human**：按审阅需要手动打包 / 上传 `project.zip` 或相关 artifacts；
- **ChatGPT**：只读审阅 Human 提供的源码包与 evidence。

Codex 不应为了 ChatGPT 交接默认制作 ZIP，也不应为了方便审阅而改变 `package-project.sh` 的源码包语义。`artifacts/**` 继续遵守仓库既有 artifact convention；Human 需要 runtime review 时按需单独提供相关 evidence。

本节只改变协作流程，不创造任何新的 Wuxia-Life 产品语义或 Auto Evolution successor authorization。

