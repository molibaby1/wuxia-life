# Late-Life Active Action Result Differentiation Closure

日期：2026-08-04  
阶段：Late-Life Active Action Result Differentiation

## Executive Summary

本阶段已完成唯一目标：主动行动的即时结果现在由行动类别、真实 public before/after delta、既有正式收益递减信号和当前公开银两共同决定，输出确定、可解释且跨运行模式一致的玩家反馈。

本阶段没有修改主动行动收益、成本、解锁、概率或收益递减规则；没有修改事件、persona、oracle、PlayerState、Snapshot、P8、P11、period summary 或 ending；没有新增长期回响。真实 Browser API slot restore 后完成 12 个聚焦场景、12 次独立/序列化行动记录，全部无应用 Console/page error。

## 1. Owner 与正式数据流

正式路径如下：

```text
公开 planning option
  → ActivePlanningService.executeActiveActionOnState
  → ActionResultResolver.resolveActiveAction
  → applyStatDeltas
  → calculatePublicStatDeltas(beforePlayer, state.player)
  → activeActionSummaryBuilder.buildActiveActionSummaryDisplay
  → Local / Headless 直接消费；API 只做 DTO 传输；Browser GameScreen/App 展示
```

| 信号 | 正式 owner | producer | consumer | 生命周期/持久化 | canonical | 本阶段处理 |
| --- | --- | --- | --- | --- | --- | --- |
| 行动类别与正式行动名 | `activeActionCatalog` + `ActionResultResolver` | 正式 action definition / resolver metadata | shared builder、Local/API/Headless/Browser | 本次行动结果；行动记录仍按既有路径保存 | 是 | 用于类别化事实文案 |
| action result 数值 | `ActionResultResolver` | 正式结算 | `ActivePlanningService` | 本次结算 | 是 | 未改变数值 |
| public before/after delta | `calculatePublicStatDeltas` | `ActivePlanningService` | shared builder、摘要 DTO | 本次结果 | 是 | 作为结果解释唯一数值来源 |
| same-category repetition | 既有 `sameCategoryRepeat >= 3` 规则 | `ActionResultResolver` | summary builder | 当前行动结果；沿用既有状态 | 是 | 仅暴露既有布尔信号，不改规则 |
| 当前公开银两压力 | `state.player.money` | `ActivePlanningService` | summary builder、Browser/Headless DTO | 当前运行状态 | 是 | 仅在 `0` 或负数时显示压力提示 |
| `resultExplanation` | `activeActionSummaryBuilder` | shared pure builder | Local、API、Headless、GameScreen、App | action summary volatile result | 是 | 新增确定性字段 |
| `diminishingReturnNotice` | `activeActionSummaryBuilder` | shared pure builder | 同上 | action summary volatile result | 是 | 新增确定性字段 |
| `resourcePressureNotice` | `activeActionSummaryBuilder` | shared pure builder | 同上 | action summary volatile result | 是 | 新增确定性字段 |

没有发现第二个同时生效的正式结果文案 owner。API 的 `sessionProgressionMapper` 只传输 shared summary；Headless 不再为反馈另建语义；Browser 只消费 DTO 字段。

## 2. Root Cause

旧路径已经有 `appliedDeltaSummary`，但它只显示格式化后的变化，缺少对“这是什么类别”“同时有收益和代价”“是否为零变化”“是否触发正式递减”“当前资源是否已经透支”的确定性解释。Browser/App 也只把旧 delta 行作为结果文本，因此不同类别和不同结果状态长期呈现为同一模板。

根因是结果表达层没有消费完整的正式输入，而不是行动结算错误：

- 结算数值和收益递减规则本身保留不变；
- builder 现在直接读取 `publicDelta` 的数值判断正负，不从理论 `rewardSummary` 推断实际结果；
- builder 不读取 hidden effects、oracle、未来事件、ending 或未发生的长期影响。

## 3. 最小实现与改动范围

本阶段涉及的正式代码和测试改动：

- `src/core/activePlanning/activeActionSummaryBuilder.ts`：扩展唯一 shared result builder；类别化文案、正/零/负/混合 delta、递减提示、公开银两压力提示。
- `src/core/activePlanning/ActivePlanningService.ts`：在现有结算前后捕获浅层 public player snapshot，计算 public before/after delta；不改变结算。
- `src/core/activePlanning/ActionResultResolver.ts`：将既有重复投入判断以 `diminishingReturn` metadata 暴露给 presentation；阈值与收益递减逻辑未变。
- `src/types/activeActionTypes.ts`：增加 summary presentation 字段和 metadata 布尔信号类型。
- `src/components/GameScreen.vue`、`src/App.vue`：展示 shared result explanation、递减提示和公开资源压力提示。
- `tests/activeActionResultDifferentiation.test.ts`：16 个聚焦场景，覆盖类别、实际 delta、零/负/混合结果、递减、资源压力、确定性和禁止未来承诺。
- `tests/activeActionResultParity.test.ts`：Local/API/Headless/Browser shared semantic parity。
- `tests/runRealTestGate.ts`：注册并实际执行上述两个 suite。

未新增第二套 result builder、Trace、Snapshot、Browser 框架或持久化字段。

## 4. 正式语义规则

| 输入事实 | 玩家反馈 |
| --- | --- |
| training/study/business/socializing/travel | 分别显示练功、读书、营生、交游、游历 |
| public delta 同时有正负 | 显示“同时有收获与代价”并列出实际 delta |
| 只有负 delta | 显示“并承担了可见代价”并列出实际 delta |
| 只有正 delta | 显示“并产生了可见变化”并列出实际 delta |
| public delta 全部为零/无可见变化 | 明确显示“没有带来可见数值变化” |
| 正式 `diminishingReturn` 为 true | 显示“同类连续投入已触发正式收益递减” |
| 当前公开 money 为 0/负数 | 分别显示银两用尽/透支压力 |

同一输入生成 byte-identical summary；没有随机同义句、时间、阈值泄露、ending 预测或未来事件承诺。理论 action reward 只保留在规划候选/metadata，不覆盖真实 public delta。

## 5. Local / API / Headless parity

通过：

```text
activeActionResultDifferentiation.test.ts: 16 focused scenarios ok
activeActionResultParity.test.ts: Local/API/Headless/Browser parity ok
```

核对事实：

- Local 与 Headless 由同一 `ActivePlanningService` 和 builder 产生语义；
- API mapper 保留同一 summary 对象，只承担传输；
- Browser `GameScreen.vue` 和 `App.vue` 消费相同三个 presentation 字段；
- Headless reactive proxy 使用现有运行态的浅层 public numeric snapshot，避免对 Vue proxy 做 `structuredClone`，不改变状态结构；
- `npm run typecheck`（包含 `typecheck:p6b`）通过。

## 6. 真实 Browser 聚焦验收

路径：P6B API slot restore → Browser UI `继续` → 处理正式恢复事件 → active planning → DOM 读取五个公开候选 → 点击一个候选 → 读取 action summary。

每个规划页均观察到相同的五个公开候选：练功、读书、交游、营商、游历；每个按钮同时公开收益方向、消耗和风险。每次记录了公开选择理由、可见 before/after、正式 response summary；完整原始记录保存在临时产物 `browser-scenarios.json`。

说明：表中的 before 是正式 restore 流程处理完恢复时强制事件后、玩家真正看到规划候选的可见状态，因此是主动行动的真实 before；它不是把 Snapshot 的 pre-event fingerprint 冒充成行动前状态。既有 Baseline 的 12 个 checkpoint parity 证据继续有效，本阶段没有创建第二套 parity 框架。

| # | checkpoint / action | 可见 before → after（money / martial / constitution / reputation） | 正式结果与差异信号 |
| ---: | --- | --- | --- |
| 1 | balanced-810-age-30 / 读书 | 231/43/3/22 → 216/43/3/22 | 悟性+2、学识+3、魅力+1、银两-15；普通学习 |
| 2 | wealth-804-age-30 / 营商 | 848/12/0/54 → 838/12/0/56 | 银两-10、经营+2、名望+2；实际结果没有照搬候选理论范围 |
| 3 | martial-801-age-30 / 练功 | 0/44/1/43 → -10/45/2/43 | 功力+1、体魄+1、银两-10；递减 + 透支提示 |
| 4 | martial-801-age-45 / 练功 | -80/37/5/39 → -90/38/6/39 | 功力+1、体魄+1、银两-10；透支提示，无递减 |
| 5 | wealth-804-age-45 / 营商 | 1161/24/0/79 → 1147/24/0/80 | 银两-14、经营+1、名望+1；递减 |
| 6 | balanced-810-age-30 / 读书（序列 1） | 231/43/3/22 → 216/43/3/22 | 悟性+2、学识+3、魅力+1、银两-15；普通 |
| 7 | balanced-810-age-30 / 读书（序列 2） | 216/43/3/22 → 201/43/3/22 | 同一实际结果；仍未触发正式递减 |
| 8 | balanced-810-age-30 / 读书（序列 3） | 201/43/3/22 → 186/43/3/22 | 悟性+1、学识+2、魅力+1、银两-15；递减提示 |
| 9 | balanced-810-age-30 / 练功 → 读书 | 231/43/3/22 → 221/44/4/22 → 206/44/4/22 | 类别切换后分别显示练功、读书，均按实际 delta |
| 10 | balanced-810-age-30 / 营商 → 游历 | 231/43/3/22 → 221/43/3/24 → 206/43/3/25 | 分别显示营生与游历；游历为学识+1、人脉+2、名望+1、银两-15 |
| 11 | balanced-810-age-30 / 读书（独立重放） | 231/43/3/22 → 216/43/3/22 | 与 #1 完全相同，证明相同输入确定性 |
| 12 | balanced-810-age-30 / 营商（独立重放） | 231/43/43/22 → 221/43/3/24 | 与同一正式输入保持相同类别和反馈结构 |

注：第 12 行的 martialPower/constitution 是 `43/3`；表格中的页面公开候选和完整文案均以临时 JSON 为准。所有 12 次 `consoleErrors=0`、`pageErrors=0`。本阶段未重跑完整 60 次 Browser Baseline。

## 7. Failure fingerprint

已按当前阶段命令完成验证。阶段前指纹取自上一阶段 closure；阶段后没有扩大失败集合：

| 命令 | 阶段前 | 阶段后 | 结论 |
| --- | --- | --- | --- |
| `npm test` | exit 1：P8 p38/p39/p40，`p8-scholar-su` opaque ratio `0.5` | exit 1：仍为同三项；新增 `activeActionResultDifferentiation`、`activeActionResultParity` 均 pass | 未扩大 |
| `npm run validate:event-quality` | exit 1：425 events；9 blocker / 147 major / 36 minor | 同一 425 / 9 / 147 / 36 | 未扩大 |
| `npm run gate:playability` | exit 1：同一 P8 opaque ratio 基线 | 同一 P8 基线 | 未扩大 |
| `npm run gate:p11-scheduling` | exit 0 | exit 0 | pass |
| `git diff --check` | exit 0 | exit 0 | pass |
| `npm run typecheck` | — | exit 0（含 `typecheck:p6b`） | pass |
| `npm run build` | — | exit 0 | pass；仅保留既有 chunk size warning |

`npm test` 输出中实际出现并通过：

```text
▶ Running activeActionResultDifferentiation (tests/activeActionResultDifferentiation.test.ts)
✔ activeActionResultDifferentiation passed
▶ Running activeActionResultParity (tests/activeActionResultParity.test.ts)
✔ activeActionResultParity passed
```

## 8. 明确不处理的范围

- 没有修改 action 数值、成本、概率、解锁或正式收益递减；
- 没有增加行动、事件、长期回响、Action-to-Life Echo 或新的持久化语义；
- 没有修改 period summary、ending、PlayerState、Snapshot、Life Memory、persona、oracle、P8、P11；
- 没有把当前 UI 中既有的实践/长期影响展示升级为新的回响系统；
- 没有重跑 60 次 Baseline，也没有修复上一阶段记录的 restore parity drift；
- 没有进入 Action-to-Life Echo 或任何后续候选阶段。

## Closure Verdict

阶段目标成立：正式 shared result builder 已接入真实 Local/API/Headless/Browser 路径；16 个 focused test scenarios、12 个真实 Browser result scenarios、determinism、parity 和历史 failure fingerprint 均有证据。到此停止。
