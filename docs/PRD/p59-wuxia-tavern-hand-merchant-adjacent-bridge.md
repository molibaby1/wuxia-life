# PRD: P59 Wuxia Tavern Hand Merchant-Adjacent Bridge

> **Derived from:** `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`, `agent_docs/p58-wuxia-town-apprentice-merchant-magnate-bridge-discovery-result.md`, `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`, `docs/test-reports/p25-ordinary-wiring-evidence.md`
> **Stage slug:** `p59-wuxia-tavern-hand-merchant-adjacent-bridge`
> **Stage type:** bounded ordinary-origin bridge stage after P58

## 1. Introduction

P58 已经完成 `town_apprentice` → `merchant_magnate` 的 bounded runtime bridge，并在 closure / discovery 中明确指出：后续 ordinary-origin bridge 中，`tavern_hand` 的可行性高于 `farm_peasant`。原因不是它已经天然属于 merchant 线，而是它已具备更接近桥接所需的社会关系信号：P56 已给出 `regular customers` 与 `ally referral` 两段 midlife growth，P25 也已把 `tavern_hand` 归入“guest network 可导向 mixed/renown”的 ordinary wiring 资产。

因此，P59 最合理的下一步不是继续深挖 merchant magnate 内部内容，也不是强行同时覆盖所有 ordinary origins，而是围绕 `tavern_hand` 做一个单-origin、可执行、可验证的 bounded bridge stage：把“酒肆人脉”从 ordinary growth 信号推进到一条可运行的 merchant-adjacent 或 mixed-adjacent 上升通道。

P59 的重点应是“让 tavern-hand 的 network accumulation 转化为一个明确、可读、可验证的 bridge”，而不是扩成新的大社交系统、城市经营系统，或重开 sample-line / second 40+ 方向。

## 2. Goals

- 为 `tavern_hand` 定义并落地一条单-origin 的 bounded bridge，使既有 guest-network / referral 信号不再停留在 ordinary flavor
- 优先复用 P56 已有 `tavern_hand` growth 事件与现有 mixed / merchant-adjacent gate，而不是发明新框架
- 让玩家可见层读得出“酒肆帮工靠人脉进入更大买卖或城内机会”的跃迁
- 补 targeted proof 与窄回归，证明该桥接不是仅靠 fixture 文档口径成立

## 3. Non-Goals

- 不继续扩写 `merchant_magnate` 内部 magnate wave、payoff wave 或经济系统
- 不同时处理 `farm_peasant` bridge
- 不重开 sample-line 轨，不新增 second 40+ node
- 不扩成 full tavern/social simulation、城市经营系统、平台化或全量 lifetime sim
- 不把 `tavern_hand` 直接改写成 `merchant_house` 的普通复制版

## 4. User Stories

### US-001: Audit Tavern-Hand Bridge Opportunity
**Description:** As a maintainer, I want an audit of the current `tavern_hand` bridge opportunity so P59 closes a real repo gap instead of inventing a disconnected route.

**Acceptance Criteria:**
- [ ] 汇总 P56 中 `tavern_hand` 的 existing growth signals、choice forks、表达资产与 mixed wiring 证据
- [ ] 明确 P59 是“merchant-adjacent / mixed-adjacent bridge”，不是 merchant deepening stage
- [ ] 明确当前缺的到底是 gate wiring、bridge checkpoint、还是目标 destiny 定义
- [ ] 输出 `docs/test-reports/p59-tavern-hand-bridge-gap-audit.md`

### US-002: Lock P59 Scope Contract
**Description:** As a planner, I want a scope contract for P59 so the stage stays single-origin and bounded.

**Acceptance Criteria:**
- [ ] 明确 P59 只处理 `tavern_hand`
- [ ] 明确允许层：配置接线、轻量 bridge expression、targeted proof、窄测试
- [ ] 明确禁止项：sample-line、merchant magnate deepening、full social system、第二个 ordinary origin 同包
- [ ] 输出 `docs/test-reports/p59-tavern-hand-bridge-scope-contract.md`

### US-003: Define Tavern-Hand Bridge Contract
**Description:** As a designer, I want a bounded contract for how `tavern_hand` guest-network / ally-referral signals graduate into a higher-value route.

**Acceptance Criteria:**
- [ ] 基于现有 `regular customers` / `ally referral` 事件定义最小前置条件组
- [ ] 至少定义 1 个明确的 bridge checkpoint
- [ ] 明确 bridge 指向的目标是 merchant-adjacent 还是其他 mixed destiny，并给出 repo-grounded 理由
- [ ] 保持 bridge 发生前 `tavern_hand` ordinary identity 仍成立

### US-004: Choose And Lock The Downstream Gate
**Description:** As a maintainer, I want P59 to lock one downstream gate so implementation does not sprawl across multiple half-connected routes.

**Acceptance Criteria:**
- [ ] 在现有 destiny / route 中选定唯一主要接入目标
- [ ] 说明为什么该目标比“再开新 destiny”更合理
- [ ] 若目标为 merchant-adjacent，说明与 P55 magnate chain 的复用边界
- [ ] 若目标不是 merchant chain，说明与 P25 ordinary wiring 的一致性

### US-005: Wire Tavern-Hand Bridge Configuration
**Description:** As a developer, I want the tavern-hand bridge wired through existing config carriers so it becomes runtime-reachable without a new framework.

**Acceptance Criteria:**
- [ ] 只通过现有 origin / route / destiny 配置载体实现 bridge
- [ ] 不新增 origin framework 或大型新系统
- [ ] bridge 后路径可进入既定 downstream gate 或形成等价 proof
- [ ] 不破坏 P56 / P58 已有 ordinary-origin evidence

### US-006: Add Tavern-Hand Bridge Expression
**Description:** As a player, I want the tavern-hand route to visibly read as crossing from local service work into a broader opportunity network.

**Acceptance Criteria:**
- [ ] 至少补 2 个 bridge 后表达信号
- [ ] 文案必须区分 ordinary `tavern_hand` growth 与 bridge 后状态
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-007: Add Targeted Bridge Proof
**Description:** As a maintainer, I want a bounded proof artifact showing `tavern_hand` can reach the chosen downstream gate through the new bridge.

**Acceptance Criteria:**
- [ ] 新增 1 条 targeted sim / replay / verification artifact
- [ ] 关键证据包含 tavern seed → bridge checkpoint → downstream gate
- [ ] 不依赖直接手塞 terminal mixed flags 作为唯一依据
- [ ] 不要求 combinatorial exhaust 或 full lifetime wave

### US-008: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests for the tavern-hand bridge so future edits do not silently collapse it.

**Acceptance Criteria:**
- [ ] 至少覆盖 bridge gate、玩家可见表达、proof key assertion 三类断言
- [ ] 复用既有 ordinary / mixed harness
- [ ] 不重写 merchant 或 ordinary 全量测试
- [ ] 相关命令 Pass

### US-009: Produce P59 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what bridge now exists for `tavern_hand` and what remains deferred.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`
- [ ] 汇总配置、表达、proof、测试证据
- [ ] 明确与 P58 apprentice bridge、P60 peasant design-first 的边界
- [ ] 列出仍 defer 的更大 social / merchant 后续项

## 5. Functional Requirements

1. FR-1: P59 只处理 `tavern_hand` 一条 ordinary-origin bridge，不同时扩其他 origins。
2. FR-2: P59 必须优先复用 P56 已有 tavern growth signals 与现有 destiny / route 资产。
3. FR-3: P59 必须把“guest network 可导向更高价值阶段”从文档口径推进到 runtime-playable 或 targeted-proof 口径。
4. FR-4: P59 不得通过新平台、新 destiny framework、full social sim 来达成 bridge。
5. FR-5: P59 closure 必须明确该桥接是否进入 merchant-adjacent 路径，以及与 P55 magnate chain 的关系。

## 6. Success Criteria

- `tavern_hand` 的人脉积累不再只是 ordinary flavor，而能通向一个明确且 repo-grounded 的 downstream gate
- 玩家可见层能区分“酒肆帮工的人脉增长”与“借人脉跨入更大机会”两个阶段
- 至少存在 1 条不依赖静态 mixed fixture 直塞的 tavern-hand bridge proof
- P56、P58、P25 的既有结论与边界不退化

## 7. Dependencies / Context

- P58 closure: `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- P58 discovery: `agent_docs/p58-wuxia-town-apprentice-merchant-magnate-bridge-discovery-result.md`
- P56 closure: `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`
- P25 ordinary wiring: `docs/test-reports/p25-ordinary-wiring-evidence.md`
- Ordinary-origin midlife config: `src/data/lines/ordinary-origin-midlife.json`
- Mixed destiny gate surfaces: `src/narrative/profile/wuxiaOriginSurfaces.ts`

## 8. Risks And Rollback

### Risks

- **Target ambiguity:** `tavern_hand` 更像 network-based origin，若下游目标选错，容易出现“硬接 merchant”式违和
- **Scope drift:** 容易从单条 bridge 滑成酒馆经营 / 城市关系系统
- **Identity collapse:** 容易把 tavern-hand 的 ordinary identity 淹没为 generic merchant flavor

### Rollback

- 若 audit 证明 `tavern_hand` 现有信号仍不足以 bounded 接入任何现有下游 gate，则 P59 回退为 contract-only stage，不强行进实现
- 若唯一可行方案需要新增大型 destiny 或框架，则视为越界，留待更高层规划处理

## 9. Validation Direction

- 配置层：bridge checkpoint 能在现有 JSON / route 载体中被触发
- 表达层：existing surfaces 能读出 tavern-hand 从人脉积累到机会跃迁的变化
- 证明层：targeted artifact 展示 seed → bridge → downstream gate 的 key evidence
- 回归层：`typecheck`、相关 targeted tests、ordinary / sample-line guard 不退化
