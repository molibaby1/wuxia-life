# 测试输出严重级别与关键词字典

本文档定义真实测试门禁（`npm test` → `tests/runRealTestGate.ts`）日志的**严重级别**与**关键词字典**，与 `docs/release-validation-contract.md` 一并作为合并前口径。

## 严重级别

| 级别 | 含义 | 对合并/发布 |
|------|------|----------------|
| **Blocker（阻断）** | 运行时错误、表达式求值失败、未知核心属性、无效持久化路径等；表明逻辑或数据契约已损坏或环境不可信 | 必须修复；门禁必须为失败 |
| **Warning（警告）** | 非致命偏差、可预期的降级、性能提示、已登记且可解释的噪音；不表示当前用例断言失败 | 允许合并前存在，但须在 PR 中说明并在发布清单中无「未解决的关键 Warning」 |
| **Info（信息）** | 进度、统计、人工可读摘要 | 不阻断 |

## Blocker 与 Warning 的边界

- **Blocker**：在门禁日志中出现即视为失败（**即使进程退出码为 0**）。当前由 `tests/runRealTestGate.ts` 在聚合日志上扫描子串；与退出码检查是 **AND 语义下的「任一命中即失败」**（退出码非 0 **或** 命中 Blocker 子串 → 失败）。
- **Warning**：不列入上述子串扫描表；但若属于「曾修复又复发」的已知模式（例如历史中的 `Unknown stat:*`），按发布合同视为 **关键 Warning**，须在合并前清零或显式豁免。
- **介于两者之间**：若新出现一类错误文本，团队应先在本文档「关键词字典」中归类并（若属 Blocker）同步更新 `tests/runRealTestGate.ts` 中的 `GATE_BLOCKER_SUBSTRINGS`，再合并行为变更。

## 关键词字典（与代码同步）

以下为 **Blocker** 子串（与 `GATE_BLOCKER_SUBSTRINGS` 保持一致）；命中任一则门禁失败。

| 子串 | 示例日志片段 | 说明 |
|------|----------------|------|
| `Failed to evaluate expression` | `Failed to evaluate expression: flags.x == 'y' ReferenceError: ...` | 条件表达式求值失败 |
| `ReferenceError` | `ReferenceError: foo is not defined` | 未定义标识符等运行时错误 |
| `Unknown stat` | `Unknown stat: someStat` | 未知属性键，易掩盖数据契约问题 |
| `localstorage-file invalid path` | Node 关于 `--localstorage-file` 路径无效的告警 | 持久化环境不可信 |

**Warning 示例（非穷尽）**：`[DifficultyManager] 未知的预设难度`（若已确认为可接受分支）、性能报告中的「事件总数偏多」类提示——**默认不阻断**，但若与功能退化相关则应升级为 Issue 并在发布前处理。

## 维护约定

- 新增 Blocker 模式：更新 `tests/runRealTestGate.ts` 中的 `GATE_BLOCKER_SUBSTRINGS`，并在此表增加一行示例。
- 仅文档描述、不更新扫描表的变更**无效**；以代码中的常量为准。
