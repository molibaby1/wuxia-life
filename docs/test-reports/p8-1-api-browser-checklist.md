# P8.1 API 浏览器验收清单

执行前：`p6b:serve` + `VITE_P6B_API_URL` + `npm run dev`。可使用 Cursor **browser-testing-with-devtools** skill 辅助。

| # | 检查项 | Pass | Fail | Blocker? |
| --- | --- | --- | --- | --- |
| 1 | 三槽 UI 显示，空槽可新局 | | | |
| 2 | 有档槽可继续 | | | |
| 3 | 进入 `active_planning`，≥3 行动方向 | | | |
| 4 | 执行行动后出现 action summary 卡 | | | |
| 5 | Summary ack 后进入下一相位 | | | |
| 6 | 扰动卡（若出现）可 ack | | | |
| 7 | 剧情 choice UI 可选且有效 | | | |
| 8 | Life memory / 身份线索可见 | | | |
| 9 | 刷新后续玩一致 | | | |
| 10 | 控制台无阻断 error；API 错误有提示 | | | |

记录结果至：`docs/test-reports/p8-1-api-browser-acceptance-notes.md`
