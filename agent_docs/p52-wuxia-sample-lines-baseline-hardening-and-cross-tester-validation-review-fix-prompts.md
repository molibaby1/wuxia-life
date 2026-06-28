# P52 Review Fix Prompts

按顺序执行；每条完成后 lint + 相关 test。

## FIX-001 [required]
**依据：** PRD §4 US-001 / P52-001

你是 P52 实施会话。创建分支 `codex/p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation`（从当前 P51 HEAD）。

产出 `docs/test-reports/p52-baseline-hardening-gap-audit.md`，盘点 post-P51 仍薄弱证据：
- 真人：RW-04 round-2 playtest、cross-tester 对比缺失
- 自动化：301/303 age-25 guard、guard contract 文档化、cheap guard 入口、replay 归档与 RW-05 后代码不同步
- 明确哪些属 P51 已关闭（RW-01–03、RW-05）、哪些属 P52 范围
- 本故事不改 gameplay 代码

验收：文件存在且区分 human vs automated gaps。

## FIX-002 [required]
**依据：** PRD §4 US-002 / P52-002

基于 `docs/test-reports/p49-sample-lines-playtest-round-1.md` 与 P46 §10.2，编写 round-2 playtest protocol，保存至 `docs/test-reports/p52-sample-lines-playtest-round-2-protocol.md`（或同等路径）。

必须包含：
- seeds 301/303/804、persona、route track（与 round 1 一致）
- 记录模板：复述、继续意愿、重开意愿、关键转折记忆
- pass / warning / fail 口径
- 与 round 1 对比维度
- 测试者不得参考 round 1 结论（可看 protocol，不看 round-1 结果）

不改 gameplay。

## FIX-003 [required]
**依据：** PRD §4 US-003 / P52-003 + P52-004

按 FIX-002 protocol，由第二名测试者完成三线 checklist，归档 `docs/test-reports/p49-sample-lines-playtest-round-2.md`。

要求：
- 结构与 round-1 足够接近以便对比
- 每条线含 pass/warning/fail + 文字归因
- warning 必须有 prose 解释，不能只有分数
- 本文件只放 raw evidence，不写 cross-tester 总结结论

## FIX-004 [required]
**依据：** PRD §4 US-004 + US-005 / P52-005 + P52-006

产出：
1. `docs/test-reports/p52-cross-tester-playtest-comparison.md` — round 1 vs round 2，三线在可复述性、代价感知、继续意愿、重开意愿上的一致与分歧
2. 紧凑 verdict 表（可嵌入 comparison 或 closure）：哪些差异属正常波动 / monitor-only；不得把单次主观偏好写成 blocking defect；不得重开 P46–P51 blocker

## FIX-005 [required]
**依据：** PRD §4 US-005 / P52-007

编写 minimum automated guard contract，保存 `docs/test-reports/p52-sample-line-baseline-guard-contract.md`。

必须覆盖 invariant：
- merchant 804 经营态（`merchant_first_shop`、age-25 merchant-facing goal）
- 三线 age-40 identity done + 玩家可见文案
- cross-line cost distinct（age-13）
- merchant 804 + parallel `route_demonic` 不串线（RW-05）
- playability gate 非回归（文档层声明：cheap guard 不替代 `gate:playability`）

标明每项 guard 落在哪个测试/脚本。

## FIX-006 [required]
**依据：** PRD §4 US-007 / P52-009

在 `tests/p50SampleLineSpineTests.ts` 复用现有 `GameProcessSimulator` harness，为 seed **301** 与 **303** 增加 age-25 checkpoint guard（804 已有 `testMerchant804ShopChain`）：

- 从 report 取 age≤25 记录
- 断言 `deriveSampleLineCurrentGoal` 为线内表达（301：含「行侠」或「门派」类；303：含「力量」或「地盘」或邪路语义）
- 断言不含 raw key；merchant 线语义不得渗入
- 不用大 snapshot；窄断言即可

跑：`npm exec tsx tests/p50SampleLineSpineTests.ts`

## FIX-007 [required]
**依据：** PRD §4 US-008 + US-009 / P52-011 + P52-012

添加 cheap baseline guard 入口：
- 在 `package.json` 增加如 `guard:sample-lines-baseline` 或 `p52:baseline-guard`
- 串联：`npm exec tsx tests/p50SampleLineSpineTests.ts`、`npm exec tsx tests/p50SampleLineExpressionTests.ts`、`npm exec tsx tests/p49SampleLineReplayTests.ts`
- 不替代 `gate:playability`

在 guard contract 或 closure addendum 中写明：
- 何时跑 cheap guard（样本线小改、表达层回归）
- 何时必须跑 `npm run gate:playability`（playability 相关改动、发版前）

## FIX-008 [required]
**依据：** PRD §6 Success Criteria / P51 RW-05 后证据一致性

当前 `docs/test-reports/p49-sample-lines-replay-latest.md` 仍显示 804 age 25/32/40 goal「试探底线，换取力量」（commit `07bddbf` 生成，早于 `cb5e92e` RW-05 修复）。

执行 `npm run p49:replay`，更新：
- `docs/test-reports/p49-sample-lines-replay-latest.json`
- `docs/test-reports/p49-sample-lines-replay-latest.md`
- `docs/test-reports/p49-sample-lines-cross-line-comparison-latest.md`

验收：804 age 25+ currentGoal 为商路经营表达，与 `p50SampleLineSpineTests` 一致。

## FIX-009 [required]
**依据：** PRD §4 US-009 / P52-013

产出 `docs/test-reports/p52-baseline-hardening-closure-report.md`，汇总：
- round-2 playtest + cross-tester comparison + verdict
- automated guard 增补（引用 FIX-005–007）
- P52 后仍 monitor-only 的 residual（如单线轻微表达歧义）
- 明确区分「P51 baseline passes」vs「P52 hardened + cross-tester checked」
- 不重开 P46–P51 已关闭 blocker

更新 `docs/PRD/p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation.prd.json`：仅在实际验收通过后设 `passes: true`。

## FIX-010 [optional]
**依据：** P52-007 guard contract 补强

在 `tests/p49SampleLineReplayTests.ts` 增加 live sim 断言：对 matrix 全三线，checkpoint age 25 的 `summarizeSampleLineRun` currentGoal 与线 ID 一致（尤其 804 不含「试探底线」）。保持测试小而快，避免全报告 snapshot。
