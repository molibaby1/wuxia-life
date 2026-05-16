# 体验治理多会话分发索引

## 使用方式

本索引用于把体验治理阶段拆成多个后续会话。新会话应先读取：

1. `agent_docs/current-state-problem-description.md`
2. `docs/PRD/experience-governance-distributed-plan.md`
3. 本索引
4. 对应执行包文档

执行前必须遵守项目流程：先做只读分析和实施计划，等待审批后再改代码。每个包只能修改自己范围内的内容，不得顺手处理其他包问题。

## 推荐顺序

1. 包 A：事件生命周期与复读根因治理
2. 包 B：年龄段与候选池节奏治理
3. 包 C：路线主导权治理
4. 包 D：体验验证门禁升级

## 包依赖

| 包 | 文档 | 依赖 | 可并行性 |
|---|---|---|---|
| A | `agent_docs/experience-governance-pack-a-event-lifecycle.md` | 无 | 最高优先级，建议先做 |
| B | `agent_docs/experience-governance-pack-b-rhythm-distribution.md` | A 的事件历史口径结论 | 可在 A 审批后开始 |
| C | `agent_docs/experience-governance-pack-c-route-dominance.md` | A 的门禁口径，B 的候选池结论 | 建议在 A/B 后做 |
| D | `agent_docs/experience-governance-pack-d-experience-gate.md` | A/B/C 的指标输出 | 最后收口 |

## 分发原则

- 包 A 负责“事件是否该触发”。
- 包 B 负责“什么时候触发、触发多少、给谁让路”。
- 包 C 负责“路线如何持续塑造人生”。
- 包 D 负责“以后如何知道体验又坏了”。

## 共用验证命令

后续会话可根据改动范围选择：

```bash
npm run typecheck
npm run build
npm test
npm run repro:event-repetition
npm run report:rhythm-metrics
npm run simulate:gameplay:samples -- --diagnostics
```

若某包新增或调整命令，应把命令写入对应包的交付说明和最终报告。

## 交付收口要求

每个包结束时必须提供：

- 改动范围
- 验证结果
- before/after 指标
- 残余风险
- 是否影响后续包

包 D 完成后，应产出体验治理 closure 报告，汇总 A-D 的指标变化和后续风险。
