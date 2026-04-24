Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

# 核心原则

AI 必须遵循以下工作流程：

1. 分析需求
2. 制定清晰的实施计划（包含修改文件、新增功能、受影响系统、潜在风险）
3. 等待审批
4. 仅执行已批准的计划
5. 按顺序执行所有已批准计划，中途不再询问
6. 不得更改计划之外的任何内容

***

# 工作风格

- 可以自行完成的任务自行实施，而非指导用户实施流程
- 排查问题优先从自身可控、可见的领域开始，而非外部因素
- 遇到不确定的问题，可以明确查看原因的(日志,代码)就不要猜测
- 较大型工作计划产出 md 文档放入 `docs/` 目录，AI 工作计划放入 `agent_docs/` 目录
- md 文档中不要出现本地路径
- 修复问题时不做兼容兜底，直接寻找并处理根因

## 中大型任务 SOP

当任务跨多个子系统或预计需要多轮会话时：

1. **需求澄清** - 明确目标、范围、非目标、风险、受影响模块与兼容边界，先完成只读分析
2. **产出 PRD** - 在 `docs/PRD/` 下新增主题化 `.md` 文档，包含背景、目标、范围、用户故事、验收标准、风险与回滚
3. **产出 Ralph JSON** - 在 `docs/PRD/` 下新增 `*.prd.json`，包含 `project`、`branchName`、`description`、`userStories[]`
4. **等待审批** - 未获审批前不进入业务代码实施
5. **按优先级实施** - 严格按 `userStories` 优先级顺序实施，每个故事完成后补充验证证据
6. **跨会话接力** - 新会话必须先读取已审批的 PRD 与 JSON，不得跳过约束或扩散范围
7. **交付收口** - 包含改动清单、验证结果、残余风险、后续建议，若有 legacy 兼容链路需给出迁移窗口

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
