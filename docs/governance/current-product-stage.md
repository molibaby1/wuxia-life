# Wuxia-Life 当前产品阶段

> 用途：为 ChatGPT、Codex 和人工维护者提供当前唯一工作目标。本文是滚动看板，不是长期产品规范。
> 最后更新：2026-08-04

## 1. 当前阶段目标

完成 `Late-Life Active Action Result Differentiation`：让主动行动的即时结果根据行动类别、实际 before/after public delta、正式收益递减和公开资源状态产生确定性、可解释的玩家反馈，并完成 Local/API/Headless/Browser parity 与受限真实 Browser 验收。

本阶段已完成。完成后停止；不得进入 `Action-to-Life Echo`、晚年行动扩充、长期回响、Snapshot parity 修复或其他候选阶段。

## 2. 本阶段边界

允许：

- 核对正式 owner/data flow；
- 扩展现有 shared active-action result builder；
- 为 presentation 传递已有 public before/after delta、既有 diminishing-return signal 和公开 money；
- 更新 Local/API/Headless/Browser 的既有 result consumer；
- 新增聚焦测试、parity 测试和受限 Browser 临时产物；
- 更新本阶段 closure report。

严格禁止：

```text
修改主动行动收益、成本、解锁、概率或收益递减规则
新增事件、行动或长期回响
修改 period summary、ending、PlayerState、Snapshot、Life Memory
修改 persona、oracle、P8、P11
创建第二套 Trace、Snapshot、Browser 或 result builder
重跑完整 60 次 Browser Baseline
进入 Action-to-Life Echo
```

## 3. 已确认结果

- `activeActionSummaryBuilder` 是唯一正式结果表达 owner；Local、Headless、API mapper 和 Browser 均使用同一语义对象。
- public delta 来自正式结算前后的公开 player numeric fields；理论 reward summary 不覆盖实际 delta。
- 正/零/负/混合变化、行动类别、既有正式收益递减和当前公开银两压力均有确定性文案。
- `activeActionResultDifferentiation.test.ts` 已注册到 `tests/runRealTestGate.ts`，输出 `16 focused scenarios ok`。
- `activeActionResultParity.test.ts` 通过，确认 Local/API/Headless/Browser parity。
- 真实 Browser API slot restore 后完成 15 个聚焦结果场景，覆盖 martial、wealth、balanced，中年窗口、低资源、重复递减和类别切换；应用 Console/page error 均为 0。
- Local 正式 `GameEngineIntegration` execution path 已加入 parity 测试；一次 Local UI 新开人生推进停留在既有连续故事事件，没有被冒充为 Browser action 证据。
- 未修改任何主动行动结算数值、Snapshot、PlayerState、事件、persona、oracle、P8 或 P11。

权威 closure 报告：`docs/test-reports/late-life-active-action-result-differentiation.md`。

## 4. Failure fingerprint

阶段前后保持同一历史非绿色指纹，未新增或扩大失败：

```text
npm test                         exit 1：既有 P8 p38/p39/p40；p8-scholar-su opaque ratio 0.5
npm run validate:event-quality   exit 1：425 events；blocker 9 / major 147 / minor 36
npm run gate:playability         exit 1：同一 P8 基线
npm run gate:p11-scheduling      exit 0：pass
git diff --check                 exit 0
```

新增主动行动两个 suite 在 `npm test` 中实际执行并通过；P8、事件质量和 playability 失败未处理，避免扩大本阶段范围。

## 5. 阶段完成与停止条件

本阶段 closure 满足：

1. 真实 owner、输入和 consumer 已核对；
2. shared result builder 只消费正式 public delta、既有递减信号和公开资源；
3. Local/API/Headless/Browser parity 通过；
4. 16 个 focused tests 和 15 个真实 Browser 结果场景通过；
5. `typecheck`、`typecheck:p6b`、`build`、完整 `npm test`、事件质量、playability、P11 和 diff 检查均已运行；
6. 历史 failure fingerprint 未扩大；
7. 没有命中本阶段定义的结构性 blocker。

到此停止，不实施任何下一 Slice，不进入 `Action-to-Life Echo`。
