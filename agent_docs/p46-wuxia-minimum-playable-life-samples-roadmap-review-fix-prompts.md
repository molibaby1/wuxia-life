# P46 Review Fix Prompts

## FIX-001 [required]

**依据：** P46 PRD §US-003 / `P46-003` / FR-4 / §8 Success Metrics

```text
你是 P46 文档修复执行代理。只改文档，不改业务代码或测试。

任务：在 docs/PRD/p46-wuxia-minimum-playable-life-samples-roadmap.md 新增专节「## 10. Shared Sample-Line Quality Bar」（或等价标题，放在 Open Questions 之后），写入跨三条样本线（正派武道 / 邪路偏锋 / 商路崛起）共享的最低可玩质量门槛。

必须包含：
1. 每条样本线最低体验要素（适用于 0–40 岁）：
   - 至少 5 个关键节点
   - 至少 2 个关键选择
   - 至少 1 个代价/失败回流
   - 至少 1 个中期身份信号（route signal / identity / life-memory 等玩家可感知信号）
   - 40 岁前可辨认的身份总结钩子
2. Shared 验收口径（供 P47/P48/P49 复用）：
   - 仿真证据最低组合（固定 seed、关键节点稳定出现、关键 flag 能续上等）
   - 人工证据最低组合（当前追求、代价感知、关键转折记忆、继续意愿、重开另一条线意愿）
   - 明确写出：gate pass / 自动化 gate 不是 closure 的唯一信号
3. 三条线差异要求：不同人生欲望、不同代价来源、不同 40 岁总结（可引用 §6 Design Considerations）

可参考 agent_docs/minimum-playable-life-samples-diagnosis-and-direction.md §「每条样本线的最低验收标准」，但内容必须写入 P46 PRD 正文，不能仅引用外部 agent doc。

同步：将 US-003 下 acceptance criteria 勾选为 [x]；prd.json P46-003 notes 可补「quality bar section added in PRD §10」。

验收：通读新增章节，确认 P46-003 四条 acceptanceCriteria 均可逐条对照到 PRD 正文。
```

## FIX-002 [required]

**依据：** P46 PRD §US-004 / `P46-004` / FR-2

```text
你是 P46 文档修复执行代理。只改文档，不改业务代码或测试。

任务：在 docs/PRD/p46-wuxia-minimum-playable-life-samples-roadmap.md 新增专节「## 11. Phase Handoff Rules」（或等价标题，紧接 Shared Quality Bar 之后），明确三阶段交接规则。

必须包含：
1. 阶段一（P47 剧情配置）收口前，不得启动 P48 大规模展示补齐
   - 列出 P47 最低收口证据类型（如三条线 spine 文档、gap audit、flags/routePoints 要求等），可指向 P47 PRD 但不替代 P46 内的 handoff 规则表述
2. 阶段二（P48 轻量展示）收口前，不得宣称「三条样本线已玩家可读 / 最小可玩已达成」
3. 阶段三（P49 验证）必须同时包含：仿真证据 + 人工 playtest checklist，才能对整个 P46 路线做最终 closure
4. 阶段依赖顺序表（P47 → P48 → P49），注明对应 PRD 文件名：
   - docs/PRD/p47-wuxia-sample-lines-story-configuration.md
   - docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md
   - docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md

同步：将 US-004 acceptance criteria 勾选为 [x]；prd.json P46-004 notes 可补「handoff rules section added in PRD §11」。

验收：四条 handoff acceptanceCriteria 均能在 P46 PRD 新章节中找到对应句子。
```

## FIX-003 [optional]

**依据：** P46 PRD §US-001 / `P46-001`

```text
在 docs/PRD/p46-wuxia-minimum-playable-life-samples-roadmap.md §5 Non-Goals 增补一条：
「不做全量事件池扩写 / whole-pool expansion」
（与 US-001 第三条及 P47 §5 Non-Goals 对齐）

并将 US-001 四条 criteria 勾选为 [x]。
```

## FIX-004 [optional]

**依据：** P46 PRD §US-002 / `P46-002`

```text
在 P46 PRD §2 Goals 或新增「Stage PRD Index」小节，显式列出三份阶段 PRD 路径及一句话职责，并在 §7 Technical Considerations 或 handoff 章节交叉引用，使「阶段依赖顺序」不依赖读者自行推断 intro 编号。

将 US-002 四条 criteria 勾选为 [x]。
```
