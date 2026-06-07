# P8 Closure Report

生成时间：2026-06-07

## 1. 自动化门禁结果

| 项 | 结果 |
| --- | --- |
| `npm run gate:playability` | **PASS**（无 blocker） |
| 报告 | `docs/test-reports/p8-playability-gate-latest.json` / `.md` |
| 主要 warnings | 各 persona `causality` direct echoes 偏少；部分 `pacing` 6–7y 低影响窗口 |

## 2. 真人切片准入

| 项 | 状态 |
| --- | --- |
| 0–40 范围定义 | ✅ `docs/designs/p8-human-test-slice-scope.md` |
| Gap 审计 | ✅ `docs/test-reports/p8-human-slice-gap-audit.md` |
| 测试脚本 | ✅ `docs/test-reports/p8-human-test-script.md` |
| 浏览器验收 | ⚠️ 本地模式可启动；完整流程建议真人复验（见 browser notes） |

**准入结论：** 达到 **fix blockers first → 小规模真人测试** 线：自动化无 blocker，已知 warnings 不阻断 5–8 人试点，但因果 echo 指标需在真人反馈中重点观察。

## 3. 残余风险

1. 因果 echo 自动化计数偏保守（direct echo 常为 0），可能低估真实因果 UI。
2. `.env.development.local` 默认 API 模式会误导本地切片测试。
3. P3 AllTests 中 5 项 midlife 样本失败（与 P8 改动无直接关联，全量 `npm test` 仍失败）。
4. 浏览器自动化未能稳定点击「开始人生」进入主流程。

## 4. 建议下一步

**推荐：run human testing（小规模 5–8 人）**，并行：

- 使用 `p8-human-test-script.md`
- 开发时用无 API 本地命令
- 收集因果/节奏 warnings 是否被真人感知

若真人普遍反馈「固定练功感」或「不懂属性」，则回到 **fix blockers first**。

## 5. 验证命令

```bash
npm run typecheck
./node_modules/.bin/tsx tests/p8PlayabilityTests.ts
npm run gate:playability
npm run simulate:gameplay:samples -- --quiet
env -u VITE_P6B_API_URL VITE_P6B_API_URL= npm run dev   # 本地切片
```

## 6. 交付摘要

- P8 模块：`src/p8/*`
- 模拟器 persona 策略与选择诊断：`tests/GameProcessSimulator.ts`
- 主动行动扩展：营商、游历
- 门禁命令：`npm run gate:playability`
- 文档：metrics、persona roster、baselines、human slice、browser notes
