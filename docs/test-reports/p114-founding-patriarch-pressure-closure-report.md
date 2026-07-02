# P114 Founding Patriarch Pressure Closure Report

> **Date:** 2026-07-02  
> **Stage:** P114 Wuxia Founding Patriarch Midlife Pressure Design-First  
> **Branch:** `codex/p114-wuxia-founding-patriarch-midlife-pressure-design-first`

## 1. Executive Summary

P114 已在不改 runtime 的前提下完成 founding-patriarch midlife pressure 的 design-first 闭环：完成 prerequisite audit、scope contract、direction comparison、pressure contract、validation shape，并将实现输入锁定给 P115。

**Result:** ✅ GO（进入 P115 playable pressure implementation）

---

## 2. Deliverables Completed

| Story | Artifact | Status |
| ----- | -------- | ------ |
| P114-001 | `docs/test-reports/p114-founding-patriarch-pressure-prerequisite-audit.md` | ✅ |
| P114-002 | `docs/test-reports/p114-founding-patriarch-pressure-scope-contract.md` | ✅ |
| P114-003 | `docs/test-reports/p114-founding-patriarch-pressure-direction-comparison.md` | ✅ |
| P114-004 | `docs/PRD/p114-founding-patriarch-pressure-contract.md` | ✅ |
| P114-005 | `docs/test-reports/p114-p115-validation-shape.md` | ✅ |
| P114-006 | 本 closure report | ✅ |

---

## 3. What P114 Now Locks

### 3.1 Direction

- 选定 pressure 方向：**门派延续之责**
- 拒绝/延后方向：盟约与治学撕裂（备选），自立 vs 续责（defer payoff/late-life）

### 3.2 Contract

- pressure checkpoint: `founding_patriarch_midlife_pressure_done`
- core event: `founding_patriarch_midlife_pressure`（choice）
- age band: 40–45
- variant priority: scholar > alliance
- player-facing minimum signals: cost label + current goal
- gate order: `on-ramp -> pressure -> payoff`

### 3.3 Validation shape

- proof nodes 固定为 pre-pressure -> event -> checkpoint -> expression -> payoff gate order
- 回归边界固定为 P37 + P102–P112 + P113 + sample-lines baseline
- closure criteria 已锁定 14 条

---

## 4. P115 Boundary (Implementation Handoff)

P115 **必须做**：
- 按 P114 contract 落地单核心 pressure 事件与 checkpoint
- 落地至少 2 个 pressure-specific 表达信号
- 将 payoff gate 调整为 pressure 后置
- 按 validation shape 提供证据与回归结果

P115 **不得做**：
- 重写 P113 on-ramp/payoff 叙事结构
- 扩写为多事件 pressure chain（除非另起 design stage）
- 引入新系统或 UI

---

## 5. Deferred Items

| Item | Deferred reason |
| ---- | --------------- |
| Stat threshold gate 强化 | 设计已记录，runtime 是否启用留给 P115 判定 |
| 多事件 pressure 链 | 超出本次最小 contract 范围 |
| Payoff/late-life 深化 | 属于后续阶段，不在 P114 |

---

## 6. Verification

| Check | Result |
| ----- | ------ |
| `npm run typecheck` (story-by-story) | ✅ Pass |
| Runtime behavior changes in P114 | ✅ None（docs-only） |

---

## 7. GO / NO-GO Decision

**Decision: GO**

理由：
1. 方向、flag、事件、表达、顺序、验证边界均已无歧义。
2. 保持最小实现原则，无业务代码改动，无系统扩展。
3. P115 可直接按合同执行，不需要再次做方向博弈。
