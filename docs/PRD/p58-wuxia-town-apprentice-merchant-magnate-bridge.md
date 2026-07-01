# PRD: P58 Wuxia Town Apprentice Merchant-Magnate Bridge

> **Derived from:** `docs/test-reports/p55-merchant-magnate-closure-report.md`, `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`, `agent_docs/p56-wuxia-ordinary-origin-growth-wave-gaps.md`, `docs/test-reports/p25-ordinary-wiring-evidence.md`
> **Stage slug:** `p58-wuxia-town-apprentice-merchant-magnate-bridge`
> **Stage type:** bounded ordinary-to-mixed bridge stage outside the closed sample-line track

## 1. Introduction

P54/P57 已经确认 sample-line 轨闭合，不应继续围绕 sample-line second 40+ node 扩写。P55 又将 `merchant_magnate` 推进为 bounded 的 merchant Wave 3 增长阶段，形成了可复用的 magnate on-ramp → pressure → payoff 链，但该链当前仍主要站在既有 merchant route 资产之上。

与此同时，P56 已把 `town_apprentice` 的 ordinary growth 做到 midlife depth，并在 growth contract 中明确了 trade-network 是 `merchant_magnate` 的 opportunity seed。但仓库现状仍存在一个真实缺口：`town_apprentice` 的 runtime 配置和验证资产，尚未把这颗 ordinary seed 接入现有 `merchant_magnate` mixed gate 所依赖的 wealth-route / empire 证据链。

因此，P58 不应继续做“更深 merchant 内容波次”，也不应扩成全量 ordinary-content follow-up；它应聚焦一个更小、更可执行的目标：把 `town_apprentice` 到 `merchant_magnate` 的路径，从“文档与 fixture 口径上可达”推进到“bounded、可验证、可复盘的 playable bridge”。

## 2. Goals

- 为 `town_apprentice` 定义并落地一条最小 ordinary → mixed bridge，使其能接入现有 `merchant_magnate` gate 链
- 复用 P55 已有 magnate 链与 P25/P37 已有 wealth-route gate，不重做整条 merchant growth
- 让 apprentice 路线在玩家可见层读得出“从学徒走向商路”的跃迁，而不是只停留在 ordinary 文案
- 补 targeted sim / verification / regression 证据，减少对静态 fixture 直塞 mixed flags 的依赖

## 3. Non-Goals

- 不重开 sample-line 轨，不新增 second 40+ node
- 不同时扩 `farm_peasant` 或 `tavern_hand` 的 mixed bridge
- 不重做 P55 magnate payoff 设计，不新增更深的 merchant wave
- 不扩成 full lifetime sim、全量商帮/地图/经济系统
- 不做平台化、调度器重写、事件池批量激活
- 不把 `town_apprentice` 改写成 `merchant_house` 复刻或 vivid origin

## 4. User Stories

### US-001: Audit Apprentice-to-Magnate Bridge Gap
**Description:** As a maintainer, I want an audit of the current `town_apprentice` → `merchant_magnate` evidence chain so P58 closes the real bridge gap instead of rebuilding P55 or P56.

**Acceptance Criteria:**
- [ ] 汇总 `town_apprentice` 当前 ordinary 配置、表达、verification 与 mixed fixture 证据
- [ ] 明确区分“已存在的 magnate gate”与“尚未闭合的 apprentice runtime bridge”
- [ ] 输出 `docs/test-reports/p58-town-apprentice-merchant-bridge-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P58 Scope Contract
**Description:** As a planner, I want a scope contract for P58 so the stage stays focused on the single highest-value bridge instead of sprawling into general merchant or ordinary expansion.

**Acceptance Criteria:**
- [ ] 明确 P58 只处理 `town_apprentice` → `merchant_magnate`
- [ ] 明确允许层：配置接线、轻量表达、targeted sim / verification、窄回归
- [ ] 明确禁止项：sample-line、peasant/tavern 同步扩写、full merchant wave、平台化
- [ ] 输出 `docs/test-reports/p58-town-apprentice-merchant-bridge-scope-contract.md`

### US-003: Define Apprentice Bridge Contract
**Description:** As a designer, I want a bounded contract for how apprentice trade-network signals graduate into the existing wealth-route and magnate chain.

**Acceptance Criteria:**
- [ ] 定义 apprentice 侧最小前置条件组，基于 `apprentice_trade_curiosity` / `apprentice_midlife_trade_network` / `apprentice_join_partnership` 等现有信号
- [ ] 定义最少一个 ordinary-to-merchant bridge checkpoint
- [ ] 说明 bridge 如何衔接现有 `route_wealth_committed` 或等价 wealth-route gate
- [ ] 保持 apprentice 的 ordinary identity 到 bridge 发生前仍成立

### US-004: Define Magnate Entry Contract for Apprentice Route
**Description:** As a designer, I want a clear contract for when the bridged apprentice path should count as entering the magnate chain instead of remaining generic merchant flavor.

**Acceptance Criteria:**
- [ ] 定义 apprentice 路径进入 P55 magnate on-ramp 所需的最小附加条件
- [ ] 明确与 generic merchant start 的差异
- [ ] 明确与 P55 现有 magnate pressure / payoff 的复用边界
- [ ] 规格写入 PRD 或 audit 附录

### US-005: Wire Apprentice-to-Merchant Configuration
**Description:** As a developer, I want the apprentice bridge wired through existing JSON carriers so the path becomes runtime-reachable without a new framework.

**Acceptance Criteria:**
- [ ] 只通过现有 ordinary / merchant / wealth-route 配置载体实现 bridge
- [ ] 不新增新的 origin 或 merchant framework
- [ ] bridge 后路径能触发现有 magnate gate 链或等价 proof
- [ ] P55 / P56 / P25 现有 evidence 不退化

### US-006: Add Apprentice Bridge Player-Facing Expression
**Description:** As a player, I want the apprentice route to visibly read as crossing from skilled town worker into merchant ascent so the bridge is legible.

**Acceptance Criteria:**
- [ ] 在现有表达面补至少 2 个 apprentice-to-merchant bridge 可读信号
- [ ] 文案必须区分 ordinary apprentice midlife 与 magnate stage
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-007: Add Targeted Bridge Proof
**Description:** As a maintainer, I want a bounded sim or verification slice proving that `town_apprentice` can reach the current magnate chain without static mixed-fixture shortcuts.

**Acceptance Criteria:**
- [ ] 新增 1 条 targeted sim / replay / verification artifact
- [ ] 显示 apprentice seed → bridge flag → magnate checkpoint 的关键证据
- [ ] 证明不依赖直接手塞 terminal mixed flags 作为唯一依据
- [ ] 不要求 combinatorial exhaust 或 full lifetime platform wave

### US-008: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests for the apprentice bridge so future edits do not silently break the path or collapse it back into fixture-only proof.

**Acceptance Criteria:**
- [ ] 至少覆盖 bridge gate、玩家可见表达、targeted proof 三类断言
- [ ] 复用既有 P25 / P55 / P56 harness
- [ ] 不重写全量 merchant 或 ordinary tests
- [ ] 相关命令 Pass

### US-009: Produce P58 Closure Report
**Description:** As a maintainer, I want a P58 closure report stating exactly what runtime bridge now exists between `town_apprentice` and `merchant_magnate`, and what remains deferred for later merchant or ordinary waves.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- [ ] 汇总配置、表达、sim / verification、测试证据
- [ ] 明确与 P55 merchant deepening、P56 ordinary expansion、sample-line track 的边界
- [ ] 列出仍 defer 的更大 merchant / ordinary 后续项

## 5. Functional Requirements

1. FR-1: P58 只处理 `town_apprentice` 一条 ordinary-origin bridge，不扩到其他 origins。
2. FR-2: P58 必须复用现有 `merchant_magnate` mixed gate、P55 magnate chain、P56 apprentice growth signals。
3. FR-3: P58 必须把“ordinary apprentice 可以通向 magnate”从 fixture 口径推进到 runtime-playable 或 targeted-proof 口径。
4. FR-4: P58 不得通过 sample-line reopen、平台化或 full economy 扩 scope 来达成 bridge。
5. FR-5: P58 closure 必须明确 bridge 已闭合到什么程度，以及哪些 merchant deepening 仍留在后续阶段。

## 6. Success Criteria

- `town_apprentice` 的 trade-network 不再只是文档上的 magnate seed，而能接入现有 mixed / magnate 证据链
- 玩家可见层能区分“普通学徒 midlife”与“商路跃迁”两个阶段
- 至少存在 1 条不依赖静态 mixed fixture 直塞的 apprentice → magnate targeted proof
- P55、P56、P25 的既有结论和边界不退化

## 7. Dependencies / Context

- P55 closure: `docs/test-reports/p55-merchant-magnate-closure-report.md`
- P56 closure: `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`
- P56 post-run gaps: `agent_docs/p56-wuxia-ordinary-origin-growth-wave-gaps.md`
- P25 ordinary wiring: `docs/test-reports/p25-ordinary-wiring-evidence.md`
- P25 ordinary baseline fixtures: `src/p25/ordinarySimulationBaselines.ts`
- Mixed destiny gate: `src/narrative/profile/wuxiaOriginSurfaces.ts`

## 8. Risks And Rollback

### Risks

- **Scope drift:** 容易从单条 bridge 滑成更深 merchant-content wave
- **Identity collapse:** 容易把 apprentice 直接写成 vivid merchant origin 的复刻
- **Proof inflation:** 为了证明 bridge 可达而去重做 full lifetime sim 或平台层

### Rollback

- 若 audit 发现 apprentice 现有 signal 无法 bounded 地接入现有 magnate gate，则 P58 应退回只做 bridge contract 文档，不强行扩实现层
- 若 bridge 需要改动 sample-line guard 或新框架，则该方案视为越界，回退到更小的 targeted proof 方案

## 9. Validation Direction

- 配置层：bridge checkpoint 能在现有 JSON 载体中被触发
- 表达层：existing surfaces 能读出 apprentice → merchant 的跃迁
- 证明层：targeted sim / replay / verification artifact 展示 bridge key flags 与 magnate checkpoint
- 回归层：`typecheck`、相关 targeted tests、`guard:sample-lines-baseline` 保持不退化
