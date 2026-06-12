# P8.1 API 模式真人测试脚本（20–30 分钟）

## 测前准备

```bash
npm run p6b:setup && npm run p6b:serve   # 终端 A
cp .env.development.local.example .env.development.local
npm run dev                               # 终端 B
```

确认：槽位 UI 可见；`curl -s http://localhost:8787/health/ready` 返回 ready。

观察员使用：`docs/test-reports/p8-1-api-observer-checklist.md`

## 游玩任务（0–40 岁）

| # | 任务 | 完成标准 |
| --- | --- | --- |
| 1 | 新局 | 选空槽创建角色，进入游戏 |
| 2 | 主动规划 | 至少一次打开规划，看到 ≥3 类行动并执行一项 |
| 3 | 行动小结 | 阅读小结卡并确认（action_summary ack） |
| 4 | 扰动（若有） | 阅读扰动叙事并确认（disturbance ack） |
| 5 | 剧情选择 | 完成 ≥3 次剧情选项，注意数值/关系变化 |
| 6 | 路线线索 | 40 岁前在 UI 或 life memory 看到至少 1 条身份/路线信号 |
| 7 | 续玩 | 刷新页面后从槽位继续，进度一致 |

## 测后问卷（每人）

1. 你是否清楚本局大致目标？（1–5）
2. 行动/选择后果是否可理解？（1–5）
3. 是否有成就感时刻？举例。
4. 挫折是否公平、可解释？（1–5）
5. 是否愿意再开一局？（是/否/条件）
6. 本局最记忆深刻的一点？

## Go / No-Go（P8.1 外部试玩准入）

| 级别 | 条件 |
| --- | --- |
| **Proceed** | `gate:playability` headless 无 blocker；浏览器清单无 severity=blocker 未解项 |
| **Fix blockers** | 任一 blocker 级浏览器/API 缺陷或 gate blocker |
| **Defer** | 仅 warning 级 gate + 文档化 UI 摩擦，产品负责人决定延后 |

自动化最低线：`npm test` 全绿 + 默认 `npm run gate:playability` pass。

浏览器最多允许：**0** 个未记录的 blocker；warning 须记入 `p8-1-api-browser-acceptance-notes.md`。
