# 主界面多会话交接指南

## 目标

说明如何把主界面改版任务稳定交给其他会话实施，减少范围扩散、命名漂移和验收口径不一致。

## 推荐分发方式

最稳妥的方式是按批次分发，而不是把全部任务一次性丢给多个会话同时改同一批文件。

推荐拆法：

1. 会话 A：`Batch 1: 首屏主流程重构`
2. 会话 B：`Batch 2: 信息层级与摘要重构`
3. 会话 C：`Batch 3: 属性详情层与适配收口`

如果你只想开一个实现会话，则直接使用总控 Prompt。

## 分发前要给的材料

每个会话至少要拿到以下文档：

1. [主界面总控执行包](./main-screen-master-execution-pack.md)
2. [主界面改版执行 Prompts](./main-screen-batch-execution-prompts.md)
3. [主界面字段字典](./main-screen-field-dictionary.md)
4. [主界面验收检查表](./main-screen-acceptance-checklist.md)

如果是做 Batch 2 或 Batch 3，再补：

5. [主界面风险等级字典](./main-screen-risk-level-dictionary.md)
6. [主界面路线与阶段标签字典](./main-screen-route-stage-tag-dictionary.md)
7. [主界面成长倾向生成规则](./main-screen-growth-tendency-rule.md)

## 你应该怎么发给其他会话

### 方式 A：单批次派工

直接复制 [主界面改版执行 Prompts](./main-screen-batch-execution-prompts.md) 里对应批次的内容，再补一句：

```text
先只做这个 Batch，不要扩到其他页面，不要重写未要求的业务逻辑。完成后按“改动文件 / 结构变化 / 验证结果 / 残余风险”四段回报。
```

### 方式 B：总控实现

如果你希望一个会话直接做完，直接复制总控 Prompt，再补一句：

```text
严格按批次顺序推进。每完成一个 Batch 先自检并汇报，不要在未验证前继续扩改。
```

## 推荐回报格式

要求所有会话统一按下面格式回报：

### 1. 改动文件

- 列出实际修改了哪些文件

### 2. 结构变化

- 本批次把页面结构改成了什么
- 哪些模块被删除、上移、折叠或新增

### 3. 验证结果

- 做了哪些截图、手动检查或响应式检查
- 是否满足本批次验收标准

### 4. 残余风险

- 还有哪些问题没覆盖
- 哪些点需要下个批次继续收口

## 推荐执行顺序

### 串行最稳

1. 先完成 Batch 1
2. 验证首屏结构
3. 再做 Batch 2
4. 最后做 Batch 3

适合：

- 同一分支连续推进
- 想减少冲突和返工

### 并行更快

1. 一个会话先做 Batch 1
2. 另一个会话先只做 Batch 2 的文案与组件准备分析，不直接落代码
3. Batch 1 合并后，再让 Batch 2 / Batch 3 正式改代码

适合：

- 你准备多开会话
- 但仍想避免同时改同一块布局代码

## 明确不要让其他会话做的事

- 不要扩到其他页面
- 不要顺手重构无关组件
- 不要新增玩法或新字段
- 不要更改业务语义
- 不要把首页重新做成“属性百科页”

## 交接后你怎么验收

你自己不需要重新读完全部文档，只要抓 3 件事：

1. `继续` 是否首屏可见
2. 首页是否还在重复展示属性
3. 事件、风险、路线、倾向、属性是否已经分层

如果这 3 件事没过，就说明会话虽然改了代码，但没有真正按这套文档执行。

## 可直接复制的最短派工话术

### 派给单个 Batch 会话

```text
请按 docs/designs/main-screen-batch-execution-prompts.md 中对应 Batch 执行主界面改版。
必读：
- docs/designs/main-screen-master-execution-pack.md
- docs/designs/main-screen-field-dictionary.md
- docs/designs/main-screen-acceptance-checklist.md

要求：
- 只做这个 Batch
- 不扩到其他页面
- 不改业务语义
- 完成后按 改动文件 / 结构变化 / 验证结果 / 残余风险 回报
```

### 派给单个总控会话

```text
请按 docs/designs/main-screen-master-execution-pack.md 完整推进主界面改版。
严格按 Batch 1 -> Batch 2 -> Batch 3 顺序执行。

要求：
- 不扩到其他页面
- 不新增玩法
- 不改业务语义
- 每完成一个 Batch 先自检并汇报
- 最终用 docs/designs/main-screen-acceptance-checklist.md 收口
```
