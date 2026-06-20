# 主界面总控执行包

## 目标

将主界面改版所需的核心文档集中整理，作为单会话推进或多人分发时的统一入口。

## 快速开始

如果你要直接推进实现，按下面顺序使用：

1. 阅读 [主界面 UI 设计规范表](./main-screen-ui-spec.md)
2. 阅读 [主界面字段字典](./main-screen-field-dictionary.md)
3. 阅读 [主界面开发实施计划](./main-screen-implementation-batches.md)
4. 执行对应批次
5. 用 [主界面验收检查表](./main-screen-acceptance-checklist.md) 收口

如果你要把任务交给其他会话，优先阅读：

1. [主界面改版执行 Prompts](./main-screen-batch-execution-prompts.md)
2. [主界面多会话交接指南](./main-screen-multi-session-handoff-guide.md)
3. [主界面验收检查表](./main-screen-acceptance-checklist.md)

## 文档入口

### 设计与规范

- [主界面 UI 设计规范表](./main-screen-ui-spec.md)
- [主界面字段字典](./main-screen-field-dictionary.md)
- [主界面风险等级字典](./main-screen-risk-level-dictionary.md)
- [主界面路线与阶段标签字典](./main-screen-route-stage-tag-dictionary.md)
- [主界面成长倾向生成规则](./main-screen-growth-tendency-rule.md)
- [主界面风险来源归类表](./main-screen-risk-source-taxonomy.md)
- [主界面状态生成规则](./main-screen-state-generation-rules.md)

### 前端与实施

- [主界面前端开发任务单](./main-screen-frontend-task-list.md)
- [主界面开发实施计划](./main-screen-implementation-batches.md)
- [主界面组件契约草案](./main-screen-component-contract-draft.md)
- [主界面状态与交互矩阵](./main-screen-state-interaction-matrix.md)

### 验收与分发

- [主界面验收检查表](./main-screen-acceptance-checklist.md)
- [主界面改版执行 Prompts](./main-screen-batch-execution-prompts.md)
- [主界面多会话交接指南](./main-screen-multi-session-handoff-guide.md)

## 推荐使用方式

### 单会话实现

1. 先读 [主界面 UI 设计规范表](./main-screen-ui-spec.md)
2. 再读 [主界面字段字典](./main-screen-field-dictionary.md)
3. 按 [主界面开发实施计划](./main-screen-implementation-batches.md) 顺序推进
4. 用 [主界面验收检查表](./main-screen-acceptance-checklist.md) 收口

### 多会话分发

1. 用 [主界面改版执行 Prompts](./main-screen-batch-execution-prompts.md) 分配批次
2. 用 [主界面字段字典](./main-screen-field-dictionary.md) 统一命名
3. 用 [主界面多会话交接指南](./main-screen-multi-session-handoff-guide.md) 规范回报格式
4. 用 [主界面验收检查表](./main-screen-acceptance-checklist.md) 做统一验收

## 总目标

无论由哪个会话执行，最终都要达成以下结果：

1. 玩家进入主界面后，首屏可见 `继续`
2. 首页默认态不再平铺所有属性
3. 事件、风险、路线、倾向、属性各司其职
4. 主界面更适合 H5 与小程序的紧凑型移动端体验
