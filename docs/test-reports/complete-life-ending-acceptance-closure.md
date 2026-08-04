# Complete-Life Ending Acceptance Closure

> 验收日期：2026-08-04

## 结论

Complete-Life Ending Acceptance Closure 已完成。专项测试已进入 `npm test` 真实测试门，wealth 与 balanced 的 `quiet_family_life` EndingScreen 证据均已闭合。本次没有修改 EndingSystem、ordinary_life、Snapshot schema、事件调度或身份模型。

## 修改文件

- `tests/runRealTestGate.ts`：注册 `tests/quietFamilyLifeEndingExplanation.test.ts`。
- `docs/governance/current-product-stage.md`：标记当前 Closure 完成并记录验证结果。

## 自动化验证

| 命令 | 结果 |
| --- | --- |
| `npm exec -- tsx tests/quietFamilyLifeEndingExplanation.test.ts` | exit 0 |
| `npm test` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run typecheck:p6b` | exit 0 |
| `npm run build` | exit 0 |
| `npm run test:contracts` | exit 0 |
| `npm run test:headless` | exit 0 |
| `npm run test:headless:parity` | exit 0 |
| `npm run gate:playability` | exit 0；P8 PASS；warnings=2 |
| `npm run gate:p11-scheduling` | exit 0；P11 PASS |
| `git diff --check` | exit 0 |

`npm test` 日志实际出现并通过：

```text
▶ Running quietFamilyLifeEndingExplanation (tests/quietFamilyLifeEndingExplanation.test.ts)
quietFamilyLifeEndingExplanation.test.ts: ok
✔ quietFamilyLifeEndingExplanation passed
```

## Browser EndingScreen 验收

使用真实 Chrome 对 API 模式页面执行存档槽位恢复和 EndingScreen 交互。终局 payload 由现有 canonical `GameEngineIntegration` 执行 `ordinary_life → end_game` 生成，再由页面通过 restore 消费；浏览器断言覆盖展示与交互边界，不新增测试专用产品路径。

| 断言 | wealth | balanced |
| --- | --- | --- |
| ending ID | `quiet_family_life` | `quiet_family_life` |
| 动态描述 | 生意和家业、经营能力、家人 | 练武、读书与营生、压力、家人 |
| 1500ms 不自动推进 | pass | pass |
| 点击继续进入一次 EndingScreen | pass | pass |
| terminal 后无 GameScreen | pass | pass |
| 刷新/读档后 description 保持 | pass | pass |
| Console 应用 error | 0 | 0 |
| 1280px 横向溢出 | `scrollWidth=1280` | — |
| 390px 横向溢出 | `scrollWidth=390` | `scrollWidth=390` |

## 产品语义与范围

- `quiet_family_life` 的 ID、title、判定顺序和阈值未改变。
- wealth 与 balanced 只共享 ending 分类，不共享动态解释文本。
- description 继续作为正式终局数据被 EndingScreen 消费；没有根据 event ID、Trace、persona 或测试标签重新计算。
- 本阶段没有进入 Identity、晚年行动或长期回响候选阶段。

## Git 状态

工作树原本已有多处用户改动；本次只新增测试门注册和本报告/阶段文档收口，没有提交、重置或清理既有改动。

## 相邻问题

- P8 gate 保持 PASS，既有 warnings=2；本 Closure 未处理。
- Local dev 开始按钮在本次自动浏览器构造阶段出现长时间无响应；不影响 API EndingScreen 真实交互验收，也未命中阶段定义的结构性 blocker。现象不属于本 Closure 的终局展示缺陷，留作相邻问题登记。
