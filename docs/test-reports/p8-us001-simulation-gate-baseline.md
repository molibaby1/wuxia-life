# P8 US-001 — Simulation, Gate, and Browser Coverage Baseline

生成时间：2026-06-07

## 1. 现有命令覆盖

| 命令 | 用途 | 0–40 可玩性相关 |
| --- | --- | --- |
| `npm run simulate:gameplay` | 单样本/多样本 gameplay 模拟，输出 HTML+JSON 报告 | 部分：事件/选择/结局统计，无主动行动策略分化 |
| `npm run simulate:gameplay:samples` | 固定 3+3 路线样本批量模拟 | 部分：路线链与选择倾向，无 agency 指标 |
| `npm run gate:experience` | 体验健康门禁（P2/P3 衍生指标 + 模拟样本） | 部分：重复/死亡率/路线完成，非 P8 可玩性维度 |
| `npm run gate:golden-line` | 黄金线 0–30 样本门禁 | 弱：主线推进，不评主动规划 |
| `npm run gate:midlife` | 中年段门禁 | 弱：30+ 切片，非 P8 0–40 目标 |
| `npm run test:headless` | Headless 引擎单元 | 弱：无 persona 分化 |
| `npm run test:headless:parity` | 双轨 parity 样本 | 弱：parity 对齐，非可玩性 |
| `npm run test` | 全量回归门禁 | 间接：功能正确性，非体验指标 |
| `npm run dev` / `npm run preview` | 本地 Web 运行 | 人工：UI 可玩性需浏览器验证 |
| `npm run report:p7-1-closure` | P7.1 主动行动体验收口 | 部分：扰动/摘要可见性 |

## 2. 已反映 vs 未反映可玩性

**已部分反映：**
- 选择率、自动事件率（`gate:experience` / `gameplaySimulationGate`）
- 路线完成/断裂（route track samples）
- 主动行动 catalog 存在（练功/读书/交游，P7）
- 属性认知面板（P7 `AttributePanel`）
- 人生记忆摘要（`deriveLifeMemorySummary` / `LifeMemoryPanel`）

**未反映（P8 盲区）：**
- 无事件时固定 `action_training_basic` 回退（`GameProcessSimulator.simulateYear`）
- 无 persona 驱动的主动行动策略分化
- 无 agency / causality echo / achievement / frustration / replay similarity 指标
- 无 0–40 固定 persona 集与 pass/fail 可玩性门禁
- 无选择评分诊断（selected vs runner-up score）
- UI 理解度、重玩动机、真人测试脚本未纳入自动化

## 3. 主动行动 / 玩家能动性 / UI / 重玩 盲区

| 维度 | 现状 | 盲区 |
| --- | --- | --- |
| 主动行动选择 | Web 可选 3 类；模拟器无事件时固定练功 | 模拟与 Web 行为不一致；无财富/探索方向 |
| 玩家能动性 | 选择倾向 5 档（martial/wealth/…） | 无主动行动计数/多样性/重复无变化检测 |
| UI 理解 | 属性认知、行动摘要卡片（P7.1） | 无自动化 UI 可读性门禁 |
| 重玩动机 | 多种子样本存在 | 无 persona 间相似度聚类与警告 |

## 4. 结论

P8 需新增：固定 persona 集、策略化无事件行动、七维可玩性指标、`gate:playability` 命令，以及 0–40 真人切片准入文档与浏览器验收。

本故事为只读基线，未修改业务代码。
