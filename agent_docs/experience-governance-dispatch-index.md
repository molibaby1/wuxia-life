# 体验治理多会话分发索引

## 使用方式

本索引用于把体验治理阶段拆成多个后续会话。新会话应先读取：

1. `agent_docs/current-state-problem-description.md`
2. `docs/PRD/experience-governance-distributed-plan.md`
3. 本索引
4. 对应执行包文档

若需要直接启动新会话，优先从 `agent_docs/experience-governance-session-prompts.md` 复制对应提示词，再按提示词读取上下文。

执行前必须遵守项目流程：先做只读分析和实施计划，等待审批后再改代码。每个包只能修改自己范围内的内容，不得顺手处理其他包问题。

## 推荐顺序

1. 包 A：事件生命周期与复读根因治理
2. 包 A-prime：事件生命周期收口
3. 包 A-tail：复读分类收口
4. 包 B：年龄段与候选池节奏治理
5. 包 B-tail：负面/经济短窗口节奏收口
6. 包 C：路线主导权治理
7. 包 D：体验验证门禁升级

## 包依赖

| 包 | 文档 | 依赖 | 可并行性 |
|---|---|---|---|
| A | `agent_docs/experience-governance-pack-a-event-lifecycle.md` | 无 | 最高优先级，建议先做 |
| A-prime | `agent_docs/experience-governance-pack-a-prime-lifecycle-closure.md` | A 的残余问题与 B/C 后验证结果 | 建议在 D 前单独收口 |
| A-tail | `agent_docs/experience-governance-pack-a-tail-repetition-classifier.md` | A-prime 后的复读分类误伤样本 | 小尾包，建议在 D 前处理 |
| B | `agent_docs/experience-governance-pack-b-rhythm-distribution.md` | A 的事件历史口径结论 | 可在 A 审批后开始 |
| B-tail | `agent_docs/experience-governance-pack-b-tail-negative-economy-rhythm.md` | A-tail 后剩余的负面/经济短窗口同类重复 | 小尾包，建议在 D 前处理 |
| C | `agent_docs/experience-governance-pack-c-route-dominance.md` | A 的门禁口径，B 的候选池结论 | 建议在 A/B 后做 |
| D | `agent_docs/experience-governance-pack-d-experience-gate.md` | A/B/C 的指标输出 | 最后收口 |

## 分发原则

- 包 A 负责“事件是否该触发”。
- 包 A-prime 负责“事件被消费后是否按真实口径进入生命周期”。
- 包 A-tail 负责“复读指标是否把真实同类和文本误伤分清楚”。
- 包 B 负责“什么时候触发、触发多少、给谁让路”。
- 包 B-tail 负责“负面/经济类事件在短窗口内是否过密”。
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
npm run gate:experience
npm run report:experience-governance-closure
```

`npm run validate` 已包含 `gate:experience`；复读类指标（`adjacent_same_*` / `short_window_same_class_rate`）为 **blocker**，不可 waiver。

若某包新增或调整命令，应把命令写入对应包的交付说明和最终报告。

## 交付收口要求

每个包结束时必须提供：

- 改动范围
- 验证结果
- before/after 指标
- 残余风险
- 是否影响后续包

包 D 完成后，应产出体验治理 closure 报告，汇总 A-D 的指标变化和后续风险。
