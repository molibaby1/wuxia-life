# PRD: P55 Wuxia Merchant Magnate Bounded Expansion

> **Derived from:** `agent_docs/p54-wuxia-sample-lines-residual-polish-gaps.md`, `docs/test-reports/p25-mixed-identity-slice.md`, `docs/test-reports/p39-section8-item3-reconciliation-closure.md`  
> **Stage slug:** `p55-wuxia-merchant-magnate-bounded-expansion`  
> **Stage type:** bounded Wave 3 merchant-content growth outside the closed sample-line track

## 1. Introduction

P54 已将 sample-line 轨（P46→P54）收口为 **CLEAR**，且明确不建议继续在 sample-line 轨内扩新阶段。当前剩余的增长项里，优先级最高的是 `GAP-NS8-WAVE34`：Wave 3 `merchant_magnate` 与 Wave 4 平凡出身扩展，均被标记为 **explicit defer**，但不再是 North Star §8 blocker。

其中 `merchant_magnate` 最适合作为下一阶段的第一站。仓库当前已经具备：

- P25 静态 mixed identity slice 中 `merchant_magnate` **PASS**
- P53/P54 对 merchant debt / favor / expansion pressure 刚完成补强
- 商路线相关配置、表达、验证 harness 仍处于热状态，延续成本最低

P55 的目标不是重开 sample-line，也不是一次性交付完整商路宇宙，而是把 `merchant_magnate` 做成一个 **bounded、可验证、可复盘** 的 Wave 3 商路增长阶段：补最小内容链、补最小 habit-led / route-led 证明、补 replay / audit 证据，并保持现有 sample-line / P25 / P39 结论不退化。

## 2. Goals

- 把 `merchant_magnate` 从现有静态 mixed identity 验证，推进到 bounded 的内容与仿真证明
- 为商路巨贾线定义最小 on-ramp、midlife pressure、late payoff 三段式链路
- 复用既有 merchant route / debt / favor / wealth-capital 信号，不做新平台
- 为 `merchant_magnate` 增加窄验证与 closure 证据，避免只停留在静态 slice

## 3. Non-Goals

- 不重开 P46→P54 sample-line 轨
- 不同时实现 Wave 4 ordinary growth
- 不扩成全量商帮 / 地图 / 门派经济系统
- 不做 runtime 平台化、调度器重写或事件池批量激活
- 不要求 full birth→death 全谱商路穷举
- 不替代 `gate:playability`、`guard:sample-lines-baseline` 或 P39 bounded audit

## 4. User Stories

### US-001: Audit Merchant Magnate Current Evidence
**Description:** As a maintainer, I want an audit of the current `merchant_magnate` evidence chain so P55 extends real gaps rather than rebuilding already-proven surfaces.

**Acceptance Criteria:**
- [ ] 汇总 `merchant_magnate` 当前已有的静态 slice、路径定义、相关 flags 与 docs
- [ ] 明确哪些层已经存在，哪些仍缺少 runtime / content / verification 证明
- [ ] 输出 `docs/test-reports/p55-merchant-magnate-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock Merchant Magnate Scope Contract
**Description:** As a planner, I want a scope contract for `merchant_magnate` so P55 stays bounded and does not sprawl into a full economy expansion.

**Acceptance Criteria:**
- [ ] 明确本阶段只做 `merchant_magnate` 最小可验证链
- [ ] 明确允许层：剧情配置、轻量展示、验证脚本
- [ ] 明确禁止项：Wave 4、全量经济系统、sample-line 重开、平台化
- [ ] 输出 `docs/test-reports/p55-merchant-magnate-scope-contract.md`

### US-003: Define Merchant Magnate On-Ramp Contract
**Description:** As a designer, I want a concrete on-ramp contract so `merchant_magnate` has a bounded early/mid-life entry path instead of a summary-only label.

**Acceptance Criteria:**
- [ ] 定义最少 2 个前置条件组（如 merchant route + wealth capital / caravan / favor pressure）
- [ ] 定义 1 个 on-ramp milestone 与 1 个 midlife pressure milestone
- [ ] 不破坏现有 merchant-first / debt / expansion 语义
- [ ] 规格写入 PRD 或 gap audit 附录

### US-004: Define Merchant Magnate Payoff Contract
**Description:** As a designer, I want a bounded payoff contract so `merchant_magnate` ends in a recognizable merchant power state without requiring a full sandbox economy.

**Acceptance Criteria:**
- [ ] 定义 1 个 magnate payoff 节点或 terminal summary contract
- [ ] payoff 必须体现“财富规模 + 人情 / 风险 / 经营负担”
- [ ] 与 `merchant_martial_patron`、sample-line merchant 45 payoff 明确区分
- [ ] 规格写入 PRD 或 gap audit 附录

### US-005: Wire Merchant Magnate Story Configuration
**Description:** As a developer, I want the magnate chain wired through bounded configuration changes so the target path can actually occur without adding a new runtime framework.

**Acceptance Criteria:**
- [ ] 通过现有配置载体实现 on-ramp / pressure / payoff 最小链
- [ ] 不引入新的配置系统
- [ ] 相关路径在 benchmark / targeted sim 中可被触发
- [ ] 既有 sample-line 与 P25 regression 不退化

### US-006: Add Merchant Magnate Player-Facing Expression
**Description:** As a player, I want `merchant_magnate` to be visible in currentGoal, identity summary, or life-memory so the route reads as a distinct life arc rather than hidden bookkeeping.

**Acceptance Criteria:**
- [ ] 在既有表达面补至少 2 个 magnate-specific 可读信号
- [ ] 区分 magnate 与 sample-line merchant 的 midlife debt / 45 payoff 文案
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-007: Add Targeted Merchant Magnate Simulation Slice
**Description:** As a maintainer, I want a bounded simulation slice for `merchant_magnate` so the stage proves runtime reachability beyond static path labels.

**Acceptance Criteria:**
- [ ] 新增 1 条 targeted sim / lifetime / near-lifetime slice
- [ ] 断言 `merchant_magnate` terminal outcome 或等价证明成立
- [ ] 记录关键 age / flag / event evidence
- [ ] 不要求 combinatorial exhaust

### US-008: Add Merchant Magnate Regression Tests
**Description:** As a maintainer, I want narrow tests for `merchant_magnate` so future merchant edits do not silently erase the new path.

**Acceptance Criteria:**
- [ ] 为 on-ramp / payoff / expression 至少各补 1 条窄断言
- [ ] 复用既有 test harness，不引入新框架
- [ ] 回归覆盖不重写全量 merchant tests
- [ ] 相关命令 Pass

### US-009: Produce Merchant Magnate Replay Or Audit Artifact
**Description:** As a maintainer, I want a readable artifact for the new magnate path so later sessions can verify the route without reopening code discovery.

**Acceptance Criteria:**
- [ ] 输出 1 份 magnate-specific replay / audit / trace artifact
- [ ] 可读展示关键 checkpoint、flags、recent events 或 terminal summary
- [ ] 与 P25 static slice、P39 bounded audit 证据可交叉引用
- [ ] 文档路径写入 closure

### US-010: Produce P55 Closure Report
**Description:** As a maintainer, I want a P55 closure report summarizing what `merchant_magnate` now proves and what still remains deferred for a larger merchant wave.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p55-merchant-magnate-closure-report.md`
- [ ] 汇总配置、表达、仿真、测试、文档证据
- [ ] 明确本阶段与 sample-line 轨、Wave 4、全量经济系统的边界
- [ ] 列出仍 defer 的 merchant growth 项

## 5. Functional Requirements

1. FR-1: P55 必须只处理 `merchant_magnate` 的 bounded growth，不得重开 sample-line 主线。
2. FR-2: P55 必须明确拆分为剧情配置、轻量展示、验证脚本三类工作。
3. FR-3: `merchant_magnate` 必须和 `merchant_martial_patron`、sample-line merchant 45 payoff 保持可读区分。
4. FR-4: P55 必须复用现有测试与 replay / trace harness。
5. FR-5: P55 的 closure 必须说明哪些商路扩展仍留在后续大波次。

## 6. Success Criteria

- `merchant_magnate` 不再只停留在 P25 static slice 标签层
- 至少有 1 条 bounded runtime / sim 证明链
- 玩家可见表达能区分 `merchant_magnate` 与现有 merchant sample-line
- 回归验证通过，且不退化 sample-line / P25 / P39 证据

## 7. Dependencies / Context

- P54 defer queue: `agent_docs/p54-wuxia-sample-lines-residual-polish-gaps.md`
- P25 mixed slice: `docs/test-reports/p25-mixed-identity-slice.md`
- P39 defer queue: `docs/test-reports/p39-section8-item3-reconciliation-closure.md`
- Merchant sample-line carry-forward: `docs/test-reports/p54-sample-lines-residual-polish-closure-report.md`

## 8. Open Questions

- `merchant_magnate` 更适合做 full lifetime trace，还是 bounded targeted sim slice 即可
- magnate payoff 应落在 age 45–55 还是 terminal summary
- 是否需要单独 merchant-specific replay 命令，还是复用现有 P25 / trace artifact
