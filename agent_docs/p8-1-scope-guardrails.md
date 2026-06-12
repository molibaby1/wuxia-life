# P8.1 Scope Guardrails

## Canonical runtimes

| 场景 | Canonical | 非 canonical |
| --- | --- | --- |
| 自动化可玩性门禁 | `headless_server`（`HeadlessEngineSession` phase 循环） | `local_direct`（`GameProcessSimulator`）仅对比 |
| 真人 0–40 切片验收 | API 浏览器栈（`p6b:serve` + `VITE_P6B_API_URL` + `npm run dev`） | 清空 API URL 的本地引擎模式 |

## Required validation commands

```bash
npm run typecheck
npm test
npm run gate:playability              # 默认 headless_server
npm run gate:playability -- --mode local_direct   # 对比专用
npm run test:p6b:unit
npm run test:p6b:db                   # 需 DATABASE_URL
npm run build
```

## Out of scope

- 新 P8 指标 / 新 persona
- HTTP E2E 跑满 8 persona gate
- 删除 `GameProcessSimulator`
- `gate:validate` 矩阵变更
- UI 视觉重做
- deferred 事件批量接入

## Agent notes

- Baseline：`docs/test-reports/p8-playability-gate-latest.json` 须含 `runtimePath: headless_server`
- `public/reports/manifest.json` 已 gitignore；gate 不写 manifest
- Parity：`tests/headless/p81HeadlessLocalParity.test.ts`（固定种子，容忍策略见 design doc）
