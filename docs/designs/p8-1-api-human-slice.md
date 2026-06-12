# P8.1 API 模式真人 0–40 切片范围

生成时间：2026-06-12

> 取代 `p8-human-test-slice-scope.md` 中「本地 Web / 清空 API URL」验收引导。P8 指标与 persona 集不变；**验收环境**改为 API 栈。

## 1. 环境（canonical）

```bash
npm run p6b:setup && npm run p6b:serve   # 终端 A
cp .env.development.local.example .env.development.local
npm run dev                               # 终端 B
```

`.env.development.local` 须含 `VITE_P6B_API_URL=http://localhost:8787`。

## 2. 体验范围

与 P8 原切片一致：20–30 分钟、0–40 岁、验证目标感/因果感/成就感/挫折感/重玩意愿。

## 3. 必需表面（API 模式）

| 表面 | 最低要求 |
| --- | --- |
| 槽位 UI | 三槽新局/续玩，无本地模式引导 |
| 主动规划 | 至少一次 `active_planning`，≥3 类行动方向 |
| 行动反馈 | 结构化小结卡 + 可选扰动确认 |
| 剧情选择 | ≥3 次选择，有数值/关系反馈 |
| 路线信号 | 40 岁前可见身份/路线线索（UI 或 life memory） |
| 存档 | 刷新后可续玩（服务端槽位） |

## 4. 自动化准入

- `npm run gate:playability` 默认 `headless_server` 无 blocker
- 浏览器清单：`docs/test-reports/p8-1-api-browser-checklist.md`
- 进度 UI 回归参考：`docs/test-reports/p7-2-browser-acceptance-notes.md`

## 5. 非目标

- 不强制 HTTP E2E 跑满 8 persona（headless gate 已覆盖）
- 不以清空 `VITE_P6B_API_URL` 作为默认验收步骤
