# P116 Founding Patriarch Late-Life Scope Contract

> **Date:** 2026-07-02
> **Stage:** P116 Wuxia Founding Patriarch Late-Life Design-First
> **Contract type:** Design-first scope boundary
> **Route:** `founding_patriarch`（开派祖师）

---

## 1. Purpose

P116 是 `founding_patriarch` 路线的 late-life 阶段 **design-first contract** 阶段。本契约明确 P116 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P116 保持 design-first 定位，不滑向 partial implementation，也不扩成 full pinnacle route 规划。

P116 之于 P117（late-life implementation），如同 P109 之于 P110（patron late-life）、P114 之于 P115（founding-patriarch pressure）。

---

## 2. Allowed Layers (P116 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 late-life 之前有什么 | Prerequisite audit (P116-001) |
| **Scope contract** | ✅ | 锁定 design-first 边界 | Scope contract (P116-002) |
| **Direction comparison / branch design** | ✅ | 比较 late-life 叙事方向，设计 2 条 pressure 分支 | Direction comparison (P116-003) |
| **Late-life contract definition** | ✅ | 定义 late-life 的 flag、gate、事件结构、表达更新 | Late-life contract (P116-004) |
| **Validation shape definition** | ✅ | 定义 P117 implementation 阶段的 proof / regression 形状 | P117 validation shape (P116-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P117 的边界 | Closure report (P116-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P116 只做 6 类事：
1. **Audit** — 摸清家底（prerequisite audit）
2. **Scope** — 锁定边界（scope contract）
3. **Design** — 两条 late-life 分支（direction comparison + branch design）
4. **Contract** — 定义契约（late-life contract）
5. **Shape** — 锁定验证形状（validation shape for P117）
6. **Close** — 收口与 handoff（closure report）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P116 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P117 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P117 (implementation) |
| **P113/P115 rewrite** | Bridge/pressure/payoff 已 closed | Regression guard only |
| **P37 lifetime trace rewrite** | P37 pinnacle trace 已 closed | Regression guard only |
| **P102–P112 patron spine rewrite** | Patron spine 已 closed | Regression guard only |
| **Founding-patriarch endgame echo design** | Late-life 只定义到 late-life checkpoint | P118+ |
| **New framework / system** | 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P117 分阶段实施 |
| **Full 2×3 pressure×payoff identity matrix** | Bounded minimum: 2 pressure branches + optional payoff overlay | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P117 实施时验证 |
| **Full-lifetime `gate:p20` broad rerun** | 超出 bounded scope | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |
| **Cross-route interactions** | 不设计 founding × patron 等跨路线交互 | 远期待评估 |
| **Ordinary-origin founding-patriarch late-life** | 超出 bounded scope | P117+ bonus / defer |
| **Sect inheritance handoff markers** | 属 endgame 范畴 | P118+ design-first |

### 3.1 Forbidden Summary — The Red Line

P116 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P115 (Pressure Implementation) → P116 (Late-Life Design-First)

| Aspect | P115 | P116 |
|--------|------|------|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | Midlife pressure event + expression | Late-life 方向选择 + 契约定义 |
| **Runtime changes** | ✅ Yes | ❌ No |
| **Checkpoint flag** | Sets `founding_patriarch_midlife_pressure_done` + pressure markers | Defines `founding_patriarch_late_life_done` (contract only) |

**P116 从 P115 继承：**
- `founding_patriarch_pressure_rule_first` / `founding_patriarch_pressure_alliance_first` 作为 late-life 分支 key
- Pressure 阶段表达（goal / cost label）作为 late-life 表达上游
- `founding_patriarch_payoff_done` 作为 late-life 直接上游 gate（P113 payoff 已接线）

### 4.2 P116 (Late-Life Design-First) → P117 (Late-Life Implementation)

| Aspect | P116 | P117 |
|--------|------|------|
| **Stage type** | Design-first (docs only) | Implementation (runtime changes) |
| **Deliverable** | Contract + validation shape | Spine event + expression + tests |
| **Decision authority** | P116 locks all direction decisions | P117 executes contract, no new direction choices |
| **GO/NO-GO** | P116 closure gives recommendation | P117 proceeds only if GO |

**P117 必须从 P116 继承：**
- Event ID: `founding_patriarch_late_life`
- Event type: auto with 2 branches keyed on pressure marker
- Age range: 52–56
- Checkpoint: `founding_patriarch_late_life_done` + `founding_patriarch_late_life_identity_done`
- 2 late-life branch markers + expression updates
- Validation shape from `p116-p117-validation-shape.md`

### 4.3 P116 vs P118+ (Endgame Echo)

| Aspect | P116/P117 Late-Life | P118+ Endgame Echo |
|--------|---------------------|-------------------|
| **Life stage** | 50岁+ 活跃人生阶段 | 临终回顾 / 最终遗产 |
| **Checkpoint** | `founding_patriarch_late_life_done` | `founding_patriarch_endgame_echo_done` |
| **Player agency** | Auto（后果展开） | TBD（P118 design-first） |
| **Scope** | P116 defines; P117 implements | P118+ only reserves interface |

---

## 5. Minimum Coverage Contract

P116/P117 minimum viable late-life coverage:

| Coverage | Minimum | Bonus (defer) |
|----------|---------|---------------|
| Pressure branches | 2 (rule_first / alliance_first) | — |
| Payoff overlay per branch | Optional expression modifier | Full 2×3 matrix |
| Entry variants per branch | 1 scholar + 1 alliance overlay | Full variant exhaust |
| Expression surfaces | cost label + goal + identity | life memory / summary |
| Proof paths | 2 (one per pressure branch) | Payoff overlay paths |
| Regression | P113/P115 + P37 + patron + guard | Full lifetime |

---

## 6. Success Criteria (P116 Stage)

- [x] Prerequisite audit complete
- [x] Scope contract locked (this document)
- [ ] Two late-life branches designed with meaningful differentiation
- [ ] Late-life contract written (`docs/PRD/p116-founding-patriarch-late-life-contract.md`)
- [ ] P117 validation shape defined
- [ ] Closure report with GO/NO-GO for P117
- [x] Zero runtime changes
- [x] Typecheck passes

---

**P116-002 complete.**
