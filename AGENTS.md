Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

# 核心原则

AI 必须区分“代码改动任务”和“纯文档任务”。

## 代码改动任务

适用于修改代码、配置、脚本、数据库、接口、测试、构建链路，或任何可能带来运行行为变化、副作用、兼容性影响的任务。

工作流程：

1. 分析需求
2. 制定清晰的实施计划（包含修改文件、新增功能、受影响系统、潜在风险）
3. 判断当前是否已有可继承的 Human 授权：
   - 若没有既有授权，等待审批后再实施；
   - 若复杂 / 产品性 / 阶段性任务的正式设计已经 Human ACCEPTED，且 implementation plan **没有新增产品假设、扩大范围、修改 accepted boundary 或跨越 STOP boundary**，则该 acceptance 自动授权 planning 与 Codex implementation，不再重复申请 plan acceptance / implementation authorization。
4. 仅执行已批准或按上述规则继承授权的计划
5. 按顺序执行授权范围内任务；普通工程问题自行闭环，中途不再询问
6. 不得更改计划之外的任何内容；命中结构性 blocker 时立即停止

### Human Gate 收敛与授权继承

复杂 / 产品性 / 阶段性工作的正常路径默认只有两个 Human Gate：

```text
正式产品设计
→ Human ACCEPTED
→ implementation plan + Codex execution（授权自动继承）
→ deterministic implementation / 预授权 real smoke（若有）
→ Human final review
→ ACCEPTED / CLOSED
```

规则：

- implementation plan 是 accepted design 的工程约束，不是默认的独立审批 Gate；
- 只有出现新的产品假设、范围扩大、第一层产品规范变更、accepted design 变更、跨越 STOP boundary、超过预授权的真实外部调用次数，或原 scope 内无法解决的结构性 blocker 时，才重新请求 Human 裁决；
- real smoke 可在阶段任务中预授权，但必须写死 provider / model（如适用）、输入边界、最大调用次数和完成后的 STOP；未预授权不得自行调用；
- `current-product-stage.md` 只记录具有 authority 意义的阶段状态，不作为 plan pending / implementation pending / smoke running 等微观执行流水账；
- Codex 默认只负责实施、验证、生成 runtime artifacts 并报告其路径，不负责为 ChatGPT 交接制作或上传 ZIP；项目包 / evidence 包由 Human 按需手动打包和上传，除非 Human 明确要求 Codex 打包。

详细规则以 `docs/governance/ai-collaboration-workflow.md` 为准。

## 纯文档任务

适用于仅新增或修改 PRD、runbook、说明文档、交接文档、设计文档、`prd.json` 等文档文件，且不改动代码、配置、脚本、数据库或运行逻辑。

默认直接执行，不需要先等待审批；完成后汇报改动内容、关键假设和注意事项即可。

若文档任务过程中需要同时改代码或其他运行逻辑文件，立即切回“代码改动任务”流程。

***

# 工作风格

- 可以自行完成的任务自行实施，而非指导用户实施流程
- 排查问题优先从自身可控、可见的领域开始，而非外部因素
- 遇到不确定的问题，可以明确查看原因的(日志,代码)就不要猜测
- 默认不创建新文档，除非用户明确要求、内容将成为长期权威规范、当前任务确实需要跨会话实施计划，或真实运行/部署需要 runbook
- md 文档中不要出现本地路径
- 修复问题时不做兼容兜底，直接寻找并处理根因

## 中大型任务与文档治理

当任务跨多个子系统或预计需要多轮会话时：

1. **需求澄清** - 明确目标、范围、非目标、风险、受影响模块与兼容边界，先完成只读分析
2. **文档清单与审批** - 默认不创建新文档；一个任务原则上只允许一份当前实施文档，不同时创建 Markdown、JSON、scope contract、proof 和 closure report。涉及大量新建、删除或重组文档时，先给出清单并获得用户批准；用户在请求中已明确批准的文件除外
3. **确认授权** - 代码任务没有既有 Human 授权时先等待审批；正式设计已 Human ACCEPTED 且 implementation plan 未新增产品假设 / 扩大 scope / 改变 accepted boundary 时，按“授权继承”规则直接进入实施；纯文档任务按文档清单规则执行
4. **按批准范围实施** - 不得扩散到批准范围之外
5. **跨会话接力** - 新会话开始时先读取 `docs/README.md`，只读取其中列出的权威文档和当前任务明确指定的文件，不得遍历全部历史 PRD 推断产品方向
6. **交付收口** - 测试结果和自动生成报告默认输出到不提交的 `artifacts/` 或临时目录，不写入 `docs/test-reports`

补充文档规则：

1. 已完成任务的临时计划不继续作为产品规则；有长期价值的结论合并进权威规范，其余依靠 Git 历史保存
2. 发现旧代码、测试或文档与权威规范冲突时，不得创建兼容层来调和；应报告冲突并按权威规范制定迁移计划
3. 纯文档任务虽然不需要代码审批，但涉及大量新建、删除或重组文档时，仍必须先给出清单并获得用户批准；用户已在任务中批准的文件除外
4. Superpowers 工作区：复杂设计 / implementation plan 若使用 Superpowers workflow，可按需创建 `docs/superpowers/specs/` 与 `docs/superpowers/plans/`。它们是**当前活跃工作区**，不是第一层产品 authority。必须先读第一层产品规范并通过 Product Direction Drift Guard；任务结束必须按 `docs/README.md` 生命周期清场（完成/退休则删除或精炼毕业，不得让 completed plan / old spec 永久留作 implementation authority）。不创建长期 `handoffs/` / `session-prompts/` 目录。

## 编码原则

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

***

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

***

## Product Direction Drift Guard

适用于**复杂 / 产品性 / 架构性 / 阶段性**工作：新设计、实施计划、跨子系统改动、阶段迁移、Human Gate、涉及外部参与者（真人 / LLM / Agent / Reviewer / Planner 等）的方案。

**明确豁免（不做产品审计）：** 单点 bugfix、类型错误、fixture/测试注册、文案笔误、允许范围内的实现选型、纯格式化、以及当前阶段内的普通工程回归。对这些任务直接按既有代码流程处理。

### A. Product Alignment Check（复杂任务开始前）

行动前必须能回答：

1. 当前任务解决的产品问题是什么？
2. 对应哪份第一层产品规范（`player-model` / `auto-evolution-model`）或 Product Decision？
3. 成功后，玩家、游戏或正式产品能力具体发生什么变化？
4. 若结果只改善辅助工具或内部流程，为什么仍值得成为当前产品工作？

无法回答 → 不得默认继续实施；停止并向用户报告。

### B. Assumption Drift Check（新设计或 plan 形成时）

列出本任务新引入的产品假设，并检查：

- 是否已由第一层产品规范定义；
- 是否已有 Product Decision 支持；
- 是否只为让当前技术方案成立而新增。

未经授权的新产品假设不得悄悄升级为 implementation premise。

### C. Plain-Language Stage Review（重要阶段结束时）

用非工程语言回答：

> 我们刚刚实际做成了什么，它为什么属于这个产品？

不得只用 Phase 名、模块名、Contract 名、测试名解释。若普通产品描述明显偏离第一层产品目标 → 停止推进并触发 governance review。

### D. Human Gate Alignment Question

Human Gate 除完成度与验证外，必须额外回答：

> 本阶段成功后，产品为什么比开始前更接近第一层产品目标？

允许结论：`implementation succeeded`，但 `product direction should stop / retire / change`。Human acceptance of implementation evidence **不**自动创造新的产品语义。

### E. External Participant Replacement Check

涉及 AI / Agent / Reviewer / Planner 等外部智能参与时，执行思想实验：

> 如果这个参与者是真人，这个模块仍然合理吗？

这是 drift detector，不是绝对设计规则。若模块只有在“AI 是应被训练、校准或控制的内部组件”假设下才成立 → 必须重新检查产品必要性。

### F. Authority hierarchy protection

- 已实现代码 = implementation reality；
- 测试通过 = 对应 Contract 被满足；
- Human acceptance = 某次明确 Gate 被接受。

以上事实**都不能**自动覆盖更高层产品规范。冲突时按 `docs/README.md` 权威层级重新判断。不得因 sunk cost（“已经做了很多”）反向提升其产品权威。

***

## 当前 Auto Evolution 成熟度与默认推进顺序

截至 2026-08-29，Auto Evolution 核心 Agent workflow 已进入早期可运行 / 工程化阶段，当前处于 RUN / OBSERVE；Human Follow-up Loop v1 authority 已记录，minimal runtime 已 engineering delivered / implementation review accepted，real pilot 仍 pending。不要再默认把“证明 workflow / Participant / Skill 是否主观更好”作为下一阶段。

当前默认顺序以 `docs/governance/current-product-stage.md` 为准：

```text
P1 Sidecar Run Report — delivered / usable
P2 Multi-round engineering path — closed
↓
Human Follow-up Loop v1 — engineering delivered / pilot pending
↓
RUN / OBSERVE
+
small real Human Follow-up pilot
↓
review actual usage
↓
full P3 remains DEFERRED
```

额外守则：

- `repository-grounded-investigation` v1 当前视为可用 Skill；除非真实运行暴露具体问题，不主动做 Skill behavioral A/B；
- Run Report 是旁路输出，不得让主流程依赖 Report 或未来 Report Analysis；
- ordinary Human Follow-up items 不成为同步 Human Gate；不得为制造 READY / escalation evidence 去 steer 运行；
- Communication Contract 固定通信语义 / provenance / outcome / permission，不规定 Agent 主观结论，也不预先绑定 MCP；
- Game / Auto Evolution / Skill / Report / Analysis 保持低耦合；设计意图不等于已证明物理解耦。

## Current governance documents

Before analysis or implementation, read:

1. `docs/product/player-model.md`
2. `docs/product/auto-evolution-model.md`
3. `docs/governance/project-convergence.md`
4. `docs/governance/product-decisions.md`
5. `docs/governance/current-product-stage.md`
6. `docs/governance/ai-collaboration-workflow.md`

Use stage-goal execution:

- Codex may autonomously close ordinary implementation issues inside the current stage.
- Stop only for structural blockers defined by the current-stage and collaboration documents.
- Do not proceed into candidate next stages after the current completion criteria are met.
- Complex / product / architectural / stage work must also pass the Product Direction Drift Guard above.
