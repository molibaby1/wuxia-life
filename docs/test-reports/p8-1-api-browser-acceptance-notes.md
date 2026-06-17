# P8.1 API 浏览器验收记录

生成时间：2026-06-12  
分支：`ralph/p8-1-api-mode-playability-acceptance`  
环境：`npm run p6b:serve`（8787）+ `VITE_P6B_API_URL` + `npm run dev`（5173）  
执行：Cursor browser-testing-with-devtools（实机 checklist 1–10）

## 前置说明

| 事项 | 处理 |
| --- | --- |
| 首屏长期「正在连接服务器…」 | 根因：陈旧 `localStorage` 中 `wuxia-p6b-device-token`；`localStorage.clear()` 后刷新可恢复 |
| API 响应缺 `sessionPhase` | 根因：`p6b:serve` 未重启、运行旧进程；重启后响应含 `sessionPhase` / `slotVersion` / `planningOptions` |
| 验收角色名 | 槽位 1 新局「验收侠客」男；刷新后续玩槽位显示「存档 1 · 1 岁」 |

## Checklist 结果

| # | 检查项 | 结果 | Blocker? | 备注 |
| --- | --- | --- | --- | --- |
| 1 | 三槽 UI 显示，空槽可新局 | **Pass** | — | 三槽「暂无存档」+ 名字/性别 +「新人生」 |
| 2 | 有档槽可继续 | **Pass** | — | 刷新后槽 1 显示「继续」+「存档 1 · 1 岁」，点击进入 `active_planning` |
| 3 | 进入 `active_planning`，≥3 行动方向 | **Pass** | — | 出身选择后见「本期暂无强求…」+ 街坊跑腿 / 玩耍练功 / 帮家里打杂（3 项） |
| 4 | 执行行动后出现 action summary 卡 | **Pass** | — | `.active-action-summary-card`，标题「玩耍练功」，含耗时/收益/消耗/风险 |
| 5 | Summary ack 后进入下一相位 | **Pass** | — | 点「继续」→ `progression-ack` → 回到 `active_planning` |
| 6 | 扰动卡（若出现）可 ack | **Pass (N/A)** | — | 本轮未触发扰动；`tests/server/integration.test.ts` 已覆盖 disturbance ack |
| 7 | 剧情 choice UI 可选且有效 | **Pass** | — | 新局后出身四选一（武林世家等）可点并推进 |
| 8 | Life memory / 身份线索可见 | **Pass** | — | 「人生摘要」面板：人生路线、风险信号（如「身子正虚，宜静养」） |
| 9 | 刷新后续玩一致 | **Pass** | — | 刷新回槽位屏 →「继续」恢复至规划相位，行动选项仍在 |
| 10 | 控制台无阻断 error；API 错误有提示 | **Pass** | — | 全流程无阻断性 console error；陈旧 token 时槽位屏停留「正在连接服务器…」（非 crash，需清 token） |

## Blockers

**无 P8.1 玩法阻断项。**

## 非阻断观察

| 观察 | 严重度 |
| --- | --- |
| API 模式下 `GameScreen` 顶栏显示「玩家」而非服务端角色名 | 低（展示层，`gameEngine` 本地状态未同步） |
| 陈旧 device token 无自动恢复提示 | 低（运维/QA：清 `localStorage` 或换隐身窗口） |
| 开发时须确保 `p6b:serve` 与当前分支代码一致 | 低（否则缺 progression 字段） |

## 复现步骤

```bash
npm run p6b:setup && npm run p6b:serve   # 终端 A（变更后需重启）
cp .env.development.local.example .env.development.local && npm run dev   # 终端 B
```

1. 打开 `http://127.0.0.1:5173/`；若卡在连接，DevTools → `localStorage.clear()` → 刷新  
2. 输入名字、选性别 → 槽 1「新人生」  
3. 出身选一 → 确认 `active_planning` ≥3 行动 → 执行一项 → summary →「继续」  
4. 刷新 → 槽 1「继续」→ 确认回到规划相位  
