Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

# 核心原则

AI 必须区分“代码改动任务”和“纯文档任务”。

## 代码改动任务

适用于修改代码、配置、脚本、数据库、接口、测试、构建链路，或任何可能带来运行行为变化、副作用、兼容性影响的任务。

工作流程：

1. 分析需求
2. 制定清晰的实施计划（包含修改文件、新增功能、受影响系统、潜在风险）
3. 等待审批
4. 仅执行已批准的计划
5. 按顺序执行所有已批准计划，中途不再询问
6. 不得更改计划之外的任何内容

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
3. **等待审批** - 代码任务未获审批前不进入业务代码实施；纯文档任务按文档清单规则执行
4. **按批准范围实施** - 不得扩散到批准范围之外
5. **跨会话接力** - 新会话开始时先读取 `docs/README.md`，只读取其中列出的权威文档和当前任务明确指定的文件，不得遍历全部历史 PRD 推断产品方向
6. **交付收口** - 测试结果和自动生成报告默认输出到不提交的 `artifacts/` 或临时目录，不写入 `docs/test-reports`

补充文档规则：

1. 已完成任务的临时计划不继续作为产品规则；有长期价值的结论合并进权威规范，其余依靠 Git 历史保存
2. 发现旧代码、测试或文档与权威规范冲突时，不得创建兼容层来调和；应报告冲突并按权威规范制定迁移计划
3. 纯文档任务虽然不需要代码审批，但涉及大量新建、删除或重组文档时，仍必须先给出清单并获得用户批准；用户已在任务中批准的文件除外

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
## Current governance documents

Before analysis or implementation, read:

1. `docs/product/player-model.md`
2. `docs/governance/project-convergence.md`
3. `docs/governance/product-decisions.md`
4. `docs/governance/current-product-stage.md`
5. `docs/governance/ai-collaboration-workflow.md`

Use stage-goal execution:

- Codex may autonomously close ordinary implementation issues inside the current stage.
- Stop only for structural blockers defined by the current-stage and collaboration documents.
- Do not proceed into candidate next stages after the current completion criteria are met.