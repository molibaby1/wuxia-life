# P8 Browser Acceptance Notes

生成时间：2026-06-07

## 环境

- 本地 Web：`VITE_P6B_API_URL=` 清空后 `vite --port 5175`（避免 `.env.development.local` API 模式「后端未就绪」阻断）
- 默认 `npm run dev` 若配置了 `VITE_P6B_API_URL` 需 P6B 后端，**不适用于 P8 切片本地验收**

## US-027 / US-029 / US-031 / US-033 / US-035 验收记录

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 启动屏加载 | ✅ | 5175 本地模式显示姓名/性别/开始人生 |
| 主动行动 5 方向 | ✅（代码） | catalog 含练功/读书/交游/营商/游历；`getAvailableActiveActions` 暴露 |
| 行动 reward/cost/risk | ✅（代码） | `buildActiveActionChoices` 返回 summary 字段；GameScreen 卡片展示 |
| 属性含义 | ✅（代码） | `AttributePanel` 属性认知区块 |
| 路线/身份 UI | ✅（代码） | `LifeMemoryPanel` + route 相关 memory |
| 40 岁摘要 | ✅（代码） | `deriveLifeMemorySummary` 持续更新 |
| 完整手动玩通 | ⚠️ 部分 | 浏览器自动化对 Vue「开始人生」点击未稳定进入 GameScreen；建议真人复验 |
| Console 阻断错误 | ✅ | 启动页无 error（本地模式） |

## UX 非自动化项（留真人）

- 主动行动 tradeoff 是否「一眼懂」
- 两局是否可见不同身份倾向
- 20–30 分钟节奏是否空窗

## 建议命令

```bash
# P8 门禁
npm run gate:playability

# 本地切片（无 API）
env -u VITE_P6B_API_URL VITE_P6B_API_URL= npm run dev
```
