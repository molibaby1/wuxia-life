# P8 Human Slice Gap Audit

生成时间：2026-06-07

## 1. 审计方法

对照 `docs/designs/p8-human-test-slice-scope.md`，审阅 0–40 Web 切片与 P8 gate 输出。本故事不实施修复。

## 2. 发现

| 领域 | 现状 | 分类 | 说明 |
| --- | --- | --- | --- |
| 主动行动种类 | P7 三方向 + P8 营商/游历 | **defer→已补** | US-026 已扩 catalog |
| 无事件模拟行为 | 曾固定练功 | **blocker→已修** | persona 策略选择 |
| 属性含义 UI | AttributePanel P7 认知 | **pass** | 显式/半显式分层 |
| 路线分化 | 多条 identity/route 事件 | **warning** | UI 身份可见性依赖 LifeMemory/flags |
| 40 岁摘要 | deriveLifeMemorySummary | **warning** | 非专用「40 岁弹窗」，靠面板持续更新 |
| 重玩钩子 | 摘要含 unresolved hints | **warning** | 需真人验证是否足够 |
| 终局/道具/地图 | 未覆盖 | **defer** | 明确非目标 |

## 3. 建议优先项（已在 P8 内处理）

1. Persona 驱动无事件行动（US-009）
2. `gate:playability`（US-023）
3. 营商/游历主动行动（US-026）

## 4. 留待真人测试

- UI 是否「懂」属性与行动 tradeoff
- 20–30 分钟是否感到无聊或空窗
- 是否想立即重开一局
