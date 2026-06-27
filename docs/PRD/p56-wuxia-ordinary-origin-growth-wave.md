# PRD: P56 Wuxia Ordinary Origin Growth Wave

> **Derived from:** `agent_docs/p25-wuxia-lifetime-simulation-experience-verify-result.md`, `docs/test-reports/p25-ordinary-wiring-evidence.md`, `agent_docs/p54-wuxia-sample-lines-residual-polish-gaps.md`  
> **Stage slug:** `p56-wuxia-ordinary-origin-growth-wave`  
> **Stage type:** post-North-Star ordinary-origin growth, not a blocker-remediation stage

## 1. Introduction

P25 已经证明 Wave 4 最低标准成立：`farm_peasant`、`town_apprentice`、`tavern_hand` 三条平凡出身路径已完成 distinct opportunity bias、early/mid wiring、trajectory slice 与 baseline 验证，North Star §3.4 / §8 item 2 已 **Met**。

因此，P56 不是去“补做未完成的 Wave 4 验收”，而是一个 **growth wave**：在现有三个 ordinary origins 基础上，补更多中期分岔、mid-tier outcome hooks、玩家可感知表达与窄验证，让“平凡出身”从“已达最低标准”提升为“更像一组可持续扩展的人生入口”。

P56 依然必须 bounded。它不应该扩成全量普通人生态系统，不应该和 sample-line 轨混写，也不应该重启 P25/P54 已证明的最低准则。

## 2. Goals

- 在三个 ordinary origins 上补一层中期成长与分流深度
- 提升 ordinary origins 的玩家可读性与 distinct feel，而不是只增加标签
- 补 mid-tier eligibility / route pressure / life-memory 证据
- 为后续更大 ordinary content wave 留下清晰边界与验证资产

## 3. Non-Goals

- 不重做 P25 Wave 4 最低验收
- 不新增第四个 ordinary origin
- 不扩成全量平民社会 / 地图 / 职业系统
- 不重开 sample-line 轨
- 不与 `merchant_magnate` 阶段混写
- 不做平台化、调度器重写或全量 deferred 事件接线

## 4. User Stories

### US-001: Audit Ordinary-Origin Growth Gaps
**Description:** As a maintainer, I want an audit of what the three ordinary origins already prove and what still feels thin so P56 grows depth rather than replaying P25 acceptance work.

**Acceptance Criteria:**
- [ ] 汇总三个 ordinary origins 当前的 proven surfaces 与薄弱点
- [ ] 区分“已 Met 的最低准则”与“仍可增长的玩家体验层”
- [ ] 输出 `docs/test-reports/p56-ordinary-origin-growth-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock Ordinary Growth Scope Contract
**Description:** As a planner, I want a scope contract for ordinary-origin growth so P56 stays focused on depth and differentiation instead of broad world expansion.

**Acceptance Criteria:**
- [ ] 明确只处理 `farm_peasant`、`town_apprentice`、`tavern_hand`
- [ ] 明确允许层：剧情配置、轻量展示、验证脚本
- [ ] 明确禁止项：新增第四 origin、sample-line、全量平民系统、批量 deferred 接线
- [ ] 输出 `docs/test-reports/p56-ordinary-origin-growth-scope-contract.md`

### US-003: Define Peasant Growth Contract
**Description:** As a designer, I want a bounded growth contract for `farm_peasant` so the path has a clearer midlife identity beyond early hardship tags.

**Acceptance Criteria:**
- [ ] 定义至少 2 个 peasant-specific 中期信号或分岔
- [ ] 至少 1 个信号与“坚守 / 换路 / 积累”相关
- [ ] 不把 peasant 直接改写成 vivid origin
- [ ] 规格写入 PRD 或 audit 附录

### US-004: Define Apprentice Growth Contract
**Description:** As a designer, I want a bounded growth contract for `town_apprentice` so the path leads more clearly toward craft or merchant opportunity instead of only serving as a starter tag.

**Acceptance Criteria:**
- [ ] 定义至少 2 个 apprentice-specific 中期信号或分岔
- [ ] 至少 1 个信号与 trade / craft / magnate opportunity 相关
- [ ] 保持 ordinary identity，而不是直接升格为 merchant_house 复刻
- [ ] 规格写入 PRD 或 audit 附录

### US-005: Define Tavern Growth Contract
**Description:** As a designer, I want a bounded growth contract for `tavern_hand` so the path shows clearer network-driven opportunity rather than only serving as a generic social start.

**Acceptance Criteria:**
- [ ] 定义至少 2 个 tavern-specific 中期信号或分岔
- [ ] 至少 1 个信号与 ally network / guest circulation / chance meeting 相关
- [ ] 保持 ordinary identity，不改成 vivid social elite
- [ ] 规格写入 PRD 或 audit 附录

### US-006: Wire Ordinary Growth Story Configuration
**Description:** As a developer, I want the three ordinary origins wired with bounded midlife depth so their opportunity structures stay distinct beyond the childhood slice.

**Acceptance Criteria:**
- [ ] 三条 ordinary paths 都新增最少 1 个中期配置接点
- [ ] 不引入新的 origin framework
- [ ] 早期 wiring 与既有 P25 regression 不退化
- [ ] 相关 targeted tests 可验证

### US-007: Add Ordinary Player-Facing Expression
**Description:** As a player, I want the three ordinary origins to read differently in summaries, goals, or life-memory so the growth wave feels visible instead of hidden in flags.

**Acceptance Criteria:**
- [ ] 三条 ordinary origins 各至少新增 1 个可读表达信号
- [ ] 表达能够说明其不同的机会结构
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-008: Add Ordinary Mid-Tier Verification Slice
**Description:** As a maintainer, I want a bounded verification slice proving that the added ordinary-origin growth changes are runtime-visible and not just documented intentions.

**Acceptance Criteria:**
- [ ] 至少新增 1 份 mid-tier / midlife ordinary verification artifact
- [ ] 涵盖三条 ordinary origins 的差异点
- [ ] 可读展示关键 flags、events 或 summaries
- [ ] 不要求 full lifetime exhaust

### US-009: Add Ordinary Regression Tests
**Description:** As a maintainer, I want narrow tests for the ordinary growth additions so later edits do not flatten the three paths back into generic low-tier starts.",

**Acceptance Criteria:**
- [ ] 三条 ordinary origins 各至少补 1 条窄断言
- [ ] 复用现有 P25 / origin / simulation harness
- [ ] 不重写全量 P25 tests
- [ ] 相关命令 Pass

### US-010: Produce P56 Closure Report
**Description:** As a maintainer, I want a P56 closure report showing what ordinary-origin depth increased and what still remains out of scope for a larger ordinary-content wave.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`
- [ ] 汇总配置、表达、验证、测试证据
- [ ] 明确 P25 minimum remains valid and unchanged
- [ ] 列出仍 defer 的 ordinary-content 扩展项

## 5. Functional Requirements

1. FR-1: P56 只处理三个已存在的 ordinary origins，不新增 origin 数量。
2. FR-2: P56 必须明确拆分为剧情配置、轻量展示、验证脚本三类工作。
3. FR-3: P56 必须保留 ordinary origins 与 vivid origins 的边界，不得把它们写成降配版 vivid path。
4. FR-4: P56 必须复用 P25 / origin / simulation 现有 harness。
5. FR-5: P56 closure 必须明确“这是 growth wave，不是最低标准补课”。

## 6. Success Criteria

- 三条 ordinary origins 的中期 distinct feel 明显增强
- 玩家可见层能更清晰地区分 peasant / apprentice / tavern 三条线
- P25 Wave 4 最低标准不退化
- 存在新的 ordinary-specific bounded verification asset

## 7. Dependencies / Context

- P25 Wave 4 verify: `agent_docs/p25-wuxia-lifetime-simulation-experience-verify-result.md`
- Ordinary wiring baseline: `docs/test-reports/p25-ordinary-wiring-evidence.md`
- P54 defer queue: `agent_docs/p54-wuxia-sample-lines-residual-polish-gaps.md`

## 8. Open Questions

- P56 是否需要新增 1 条 ordinary-specific midlife trace，还是 bounded comparative artifact 已足够
- `town_apprentice` 是否应作为后续 `merchant_magnate` 的主要 ordinary bridge
- ordinary growth 文案优先放在 currentGoal 还是 life-memory 更合适
