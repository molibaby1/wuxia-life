# 武侠人生模拟 — 项目总览

**最后更新**: 2026-05-30  
**当前阶段**: Product Experience Governance（PXG）收口完成  
**可玩范围**: **0–30 岁黄金人生线**（非完整 0–80 人生）

---

## 执行依据（优先引用）

本阶段以以下文档为 **canonical 执行源**，而非旧 Phase 1/2 完成报告：

1. `docs/PRD/product-experience-governance.md`
2. `docs/PRD/product-experience-governance-scope-and-guardrails.md`
3. `agent_docs/product-experience-governance-dispatch-index.md`

旧文档中「0–80 完整人生」「Phase 2 已 100% 完成」等宣称已 **supersede**；详见 scope doc §3 Stale Documentation Registry。

---

## 当前进度

```
✅ PXG0: 范围冻结与架构护栏（US-001, US-022）
✅ PXG1: 事件资产与状态字段审计（US-002–004, US-014）
✅ PXG2: 黄金线 spine、反馈标准与 payoff（US-005–008）
✅ PXG3: 优先路线生命周期（US-009–013）
✅ PXG4: 确定性仿真与体验门禁（US-015–019）
✅ PXG5: 最小可玩 UI 与治理收口（US-020–021, US-023–024）

⏸ Deferred: 0–80 全人生扩展、完整 UI 重设计、小程序 UI
⏸ Planned (not started): 前后端分离、数据库、账号与云同步
```

---

## 黄金线可玩范围（0–30）

| 维度 | 说明 |
| --- | --- |
| 年龄 | 出生 → 童年 → 青年 → 路线入门/承诺 → 30 岁前 |
| 优先路线 | 门派正统、流浪侠客、魔道 |
| 事件资产 | runtime-loaded JSON lines + asset manifest 分类（active / candidate / deferred） |
| 玩家 UI | Web 最小可玩布局（desktop/mobile）；debug 仅 `?debug=1` 开发入口 |

---

## 快速验证

```bash
npm install
npm run typecheck
npm run gate:golden-line
npm run gate:experience
npm run report:experience-governance-closure
npm run dev   # 默认玩家流；?debug=1 开启调试面板
```

---

## 核心目录（精简）

```
wuxia-life/
├── src/
│   ├── core/              # GameEngineIntegration, RouteStateManager, SaveManager
│   ├── components/        # GameScreen, StartScreen, DebugPanel（dev only）
│   ├── composables/       # useNewGameEngine
│   ├── data/lines/        # 事件 JSON（data-driven）
│   └── utils/             # playerFacingLabels, debugAccess
├── scripts/               # golden-line gate, closure report, inventory
├── docs/PRD/              # product-experience-governance*
└── docs/test-reports/     # PXG 审计与 closure 报告
```

---

## 工作分类

| 状态 | 内容 |
| --- | --- |
| **Completed** | PXG0–PXG5 全部 user stories；黄金线 gate；最小可玩 UI；debug 隔离 |
| **Active** | 0–30 黄金线内容与门禁维护 |
| **Deferred** | 31–80 岁事件、非优先路线深度、UI polish、历史 Phase 报告正文 |
| **Planned** | 前后端分离架构（**可规划，本阶段未实施**） |

---

## 前后端分离就绪度（摘要）

US-022 护栏已满足：状态可序列化、事件 data-driven、结构化 choice feedback、显式 save schema version。  
**结论：可以开始规划**前后端分离与 API 边界，但 **不应在本治理阶段启动** DB / 账号 / 云同步 / 小程序运行时。

详见 `docs/test-reports/product-experience-governance-closure.md`。

---

**维护**: 游戏开发组  
**文档策略**: 无本地绝对路径； stale 文档见 scope doc §3
