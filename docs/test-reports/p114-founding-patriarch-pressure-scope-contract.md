# P114 Founding Patriarch Pressure Scope Contract

> **Date:** 2026-07-02  
> **Stage:** P114 Wuxia Founding Patriarch Midlife Pressure Design-First  
> **Branch:** `codex/p114-wuxia-founding-patriarch-midlife-pressure-design-first`

## 1. Purpose

锁定 P114 为 design-first 合同阶段，仅输出 audit / direction / contract / validation / closure 文档，不进入 runtime 实施。

---

## 2. Stage Boundary

| Dimension | Contract |
| --------- | -------- |
| Stage type | Design-first only |
| Expected output | 文档化压力方向 + 事件 contract + 验证形状 |
| Runtime impact | 0（不改运行行为） |
| Implementation handoff | P115 |

---

## 3. Allowed Surfaces

| Layer | Allowed in P114 |
| ----- | --------------- |
| Prerequisite audit | ✅ 盘点现有 flags/events/expressions |
| Pressure direction comparison | ✅ 至少 2 个候选 + 推荐方向 |
| Pressure contract docs | ✅ checkpoint flag / event spec / expression signals / gate order |
| Validation planning | ✅ proof chain + regression boundary + closure criteria |
| Closure report | ✅ GO/NO-GO 与 deferred 列表 |

---

## 4. Forbidden Items

| Forbidden | Why forbidden |
| --------- | ------------- |
| Runtime wiring | 这是 P115 职责 |
| P113 bridge/on-ramp/payoff 重写 | P113 已闭环，仅可引用 |
| P102–P112 patron spine 改动 | 非本路线且已闭环 |
| Payoff redesign | P114 只定义 pressure，不重做 payoff 内容 |
| New UI / new system | 超出最小 design-first 范围 |
| P37 lifetime trace reopen | P37 仅作为回归边界输入 |

---

## 5. Interaction Rules with Adjacent Routes

| Route | Rule in P114 scope |
| ----- | ------------------ |
| Renown pressure | 仅做差异化参照，不复用其剧情内容 |
| Patron pressure | 仅做 contract 方法论参照，不复用路径 flag |
| Magnate pressure | 仅复用顺序模型（on-ramp -> pressure -> payoff） |

---

## 6. Open Question Handling in Scope

| Question | Scope decision |
| -------- | -------------- |
| Pressure 阈值 gate 是否要做 | 文档中可记录，runtime 阈值实现 defer P115 |
| 与活跃 renown bridge 互斥策略 | 在 contract 给出优先级/排他规则，不改引擎 |

---

## 7. Exit Criteria for P114

- 6 个 stories 全部产出文档且 `passes=true`
- `npm run typecheck` 按 story 通过
- closure report 明确给出 P115 的 GO/NO-GO
- 无业务代码、配置、运行逻辑变更
