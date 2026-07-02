# P109 Merchant Martial Patron Late-Life Scope Contract

> **Date:** 2026-07-02
> **Stage:** P109 Wuxia Merchant Martial Patron Late-Life Design-First
> **Contract type:** Design-first scope boundary
> **Route:** `merchant_martial_patron`（商武一体金主）

---

## 1. Purpose

P109 是 `merchant_martial_patron` 路线的 late-life 阶段 **design-first contract** 阶段。本契约明确 P109 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P109 保持 design-first 定位，不滑向 partial implementation，也不扩成 full patron route 规划。

P109 之于 P110（late-life implementation），如同 P78 之于 P79（renown late-life implementation）、P107 之于 P108（patron payoff implementation）。

---

## 2. Allowed Layers (P109 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 late-life 之前有什么 | Prerequisite audit (P109-001) |
| **Scope contract** | ✅ | 锁定 design-first 边界 | Scope contract (P109-002) |
| **Direction comparison / branch design** | ✅ | 比较 late-life 叙事方向，设计 3 条 payoff 分支 | Direction comparison (P109-003) |
| **Late-life contract definition** | ✅ | 定义 late-life 的 flag、gate、事件结构、表达更新 | Late-life contract (P109-004) |
| **Validation shape definition** | ✅ | 定义 P110 implementation 阶段的 proof / regression 形状 | P110 validation shape (P109-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P110 的边界 | Closure report (P109-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P109 只做 6 类事：
1. **Audit** — 摸清家底（prerequisite audit）
2. **Scope** — 锁定边界（scope contract）
3. **Design** — 三条 late-life 分支（direction comparison + branch design）
4. **Contract** — 定义契约（late-life contract）
5. **Shape** — 锁定验证形状（validation shape for P110）
6. **Close** — 收口与 handoff（closure report）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P109 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P110 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P110 (implementation) |
| **P102–P108 patron rewrite** | Bridge/pressure/payoff 已 closed | Regression guard only |
| **P55/P97–P101 magnate spine rewrite** | Magnate spine 已 closed | Regression guard only |
| **Patron endgame echo design** | Late-life 只定义到 late-life checkpoint | P111+ |
| **New framework / system** | 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P110 分阶段实施 |
| **Full 5×3 entry×payoff×late-life identity matrix** | Bounded minimum: 1 native + 1 bridge per branch | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P110 实施时验证 |
| **Full-lifetime `gate:p20` broad rerun** | 超出 bounded scope | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |
| **Cross-route interactions** | 不设计 patron × renown 等跨路线交互 | 远期待评估 |
| **Ordinary origin patron late-life** | 超出 bounded scope | P109+ bonus / defer |

### 3.1 Forbidden Summary — The Red Line

P109 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P108 (Payoff Implementation) → P109 (Late-Life Design-First)

| Aspect | P108 | P109 |
|--------|------|------|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | Payoff choice event + expression | Late-life 方向选择 + 契约定义 |
| **Runtime changes** | ✅ Yes | ❌ No |
| **Checkpoint flag** | Sets `merchant_patron_payoff_done` + payoff markers | Defines `merchant_patron_late_life_done` (contract only) |

**P109 从 P108 继承：**
- `merchant_patron_payoff_done` + 三选一 payoff marker 作为 late-life 上游 gate 与分支 key
- Payoff choice 表达（goal / cost label / identity）作为 late-life 表达上游
- `merchant_patron_late_life_done` 接口已预留（P108 C12 确认未设）

### 4.2 P109 (Late-Life Design-First) → P110 (Late-Life Implementation)

| Aspect | P109 | P110 |
|--------|------|------|
| **Stage type** | Design-first (docs only) | Implementation (runtime changes) |
| **Deliverable** | Contract + validation shape | Spine event + expression + tests |
| **Decision authority** | P109 locks all direction decisions | P110 executes contract, no new direction choices |
| **GO/NO-GO** | P109 closure gives recommendation | P110 proceeds only if GO |

**P110 必须从 P109 继承：**
- Event ID: `merchant_patron_late_life`
- Event type: auto with 3 branches keyed on payoff marker
- Age range: 52–56
- Checkpoint: `merchant_patron_late_life_done` + `merchant_patron_late_life_identity_done`
- 3 late-life branch markers + expression updates
- Validation shape from `p109-p110-validation-shape.md`

### 4.3 P109 vs P111+ (Endgame Echo)

| Aspect | P109/P110 Late-Life | P111+ Endgame Echo |
|--------|---------------------|-------------------|
| **Life stage** | 50岁+ 活跃人生阶段 | 临终回顾 / 最终遗产 |
| **Checkpoint** | `merchant_patron_late_life_done` | `merchant_patron_endgame_echo_done` |
| **Player agency** | Auto（后果展开） | TBD（P111 design-first） |
| **Scope** | P109 defines; P110 implements | P111+ only reserves interface |

---

## 5. Minimum Coverage Contract

P109/P110 minimum viable late-life coverage:

| Coverage | Minimum | Bonus (defer) |
|----------|---------|---------------|
| Payoff branches | 3 (holder/breaker/balancer) | — |
| Entry variants per branch | 1 native + 1 bridge overlay | Full 5×3 matrix |
| Expression surfaces | cost label + goal + identity | life memory / summary |
| Proof paths | 3 (one per payoff branch) | Full variant exhaust |
| Regression | P102–P108 patron + magnate + guard | Full lifetime |

---

## 6. Success Criteria (P109 Stage)

- [ ] Prerequisite audit complete
- [ ] Scope contract locked (this document)
- [ ] Three late-life branches designed with meaningful differentiation
- [ ] Late-life contract written (`docs/PRD/p109-merchant-martial-patron-late-life-contract.md`)
- [ ] P110 validation shape defined
- [ ] Closure report with GO/NO-GO for P110
- [ ] Zero runtime changes
- [ ] Typecheck passes

---

**P109-002 complete.**
