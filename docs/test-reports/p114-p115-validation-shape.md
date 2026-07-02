# P114-P115 Validation Shape

> **Stage:** P114 design-first handoff for P115 playable pressure  
> **Date:** 2026-07-02  
> **Scope:** `founding_patriarch` midlife pressure only

## 1. Purpose

在 P115 编码前固定最小可验证证据形状，避免实现阶段再次讨论“什么算 pressure closed”。

---

## 2. Proof Chain Nodes (required)

| Node | Must prove |
| ---- | ---------- |
| Pre-pressure | `founding_patriarch_on_ramp_done=true` 且 `founding_patriarch_midlife_pressure_done=false` |
| Event fires | 在 age band 内触发 `founding_patriarch_midlife_pressure` |
| Checkpoint set | `founding_patriarch_midlife_pressure_done=true` 且对应分支 flag 写入 |
| Expression shift | 至少 2 个 player-facing 信号从 on-ramp 语义切换到 pressure 语义 |
| Payoff gate order | payoff 触发需依赖 pressure done（顺序被锁定） |

---

## 3. Regression Boundaries

| Boundary | Expected |
| -------- | -------- |
| P37 parity (`founding_patriarch` lifetime trace) | 不回归 |
| P102–P112 patron spine | 不受影响 |
| P113 bridge/on-ramp/payoff 基础路径 | 不被破坏，仅增加 pressure gate 顺序 |
| `guard:sample-lines-baseline` | 绿色通过 |

---

## 4. P115 Closure Criteria (>=10)

1. `founding_patriarch_midlife_pressure` 在约定 age band 可触发。  
2. 触发前必须满足 `founding_patriarch_on_ramp_done`。  
3. 事件 one-shot 生效：已 done 后不会重复触发。  
4. 事件结束必设 `founding_patriarch_midlife_pressure_done`。  
5. 分支 A 时设置 `founding_patriarch_pressure_rule_first`。  
6. 分支 B 时设置 `founding_patriarch_pressure_alliance_first`。  
7. scholar/alliance 同时存在时按 scholar 优先路径呈现。  
8. 至少 1 个 cost label 信号体现“门派延续之重”。  
9. 至少 1 个 current goal 信号体现“维持传承 + 承接续责”。  
10. payoff gate 只有在 pressure done 后才可触发。  
11. P113 既有 on-ramp 标记仍可按原逻辑写入。  
12. P37 与 P102–P112 相关回归测试保持通过。  
13. `npm run typecheck` 通过。  
14. `npm run guard:sample-lines-baseline` 通过（若 P115 触及样本线数据）。

---

## 5. Evidence Package for P115 Closure Report

| Evidence | Minimal requirement |
| -------- | ------------------- |
| Chain proof markdown | 展示 pre-pressure -> event -> checkpoint -> expression 四节点 |
| Focused tests | 至少覆盖触发、分支、one-shot、gate 顺序 |
| Regression run log | typecheck + 关键回归边界命令结果 |
| Deferred list | 明确未做项（如 stat 阈值增强） |

---

## 6. Out of Scope in This Validation Shape

- 不要求 full-lifetime `gate:p20` broad rerun
- 不要求新增系统级压测
- 不要求扩到 late-life/endgame 新分支
