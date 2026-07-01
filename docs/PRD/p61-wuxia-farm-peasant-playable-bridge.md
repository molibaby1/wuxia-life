# PRD: P61 Wuxia Farm Peasant Playable Bridge

> **Derived from:** `docs/PRD/p60-wuxia-farm-peasant-bridge-design-first-wave.md`, `docs/test-reports/p60-farm-peasant-bridge-design-closure-report.md`, `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`, `docs/test-reports/p25-ordinary-wiring-evidence.md`
> **Stage slug:** `p61-wuxia-farm-peasant-playable-bridge`
> **Stage type:** bounded implementation stage following approved P60 bridge contract

## 1. Introduction

P61 不是独立起意的新阶段，而是建立在 P60 设计收口之后的实现阶段。只有当 P60 已经把 `farm_peasant` 的 bridge seed、downstream target、最小新增事件/flag 范围、验证口径全部说清楚，P61 才有资格落地 playable bridge。

这样拆分的原因很直接：`farm_peasant` 当前并不具备像 P58 `town_apprentice` 那样现成的 trade-network 种子。若没有 P60 先把方向锁死，P61 很容易一边设计一边实现，最终把 peasant 写成 scope 失控的半成品。因此，P61 必须明确承接 P60 的 contract，只做最小实现、最小表达、最小 proof 与窄回归。

## 2. Goals

- 按 P60 已批准的 bridge contract，将 `farm_peasant` 落地为一条 bounded、可验证、可复盘的 playable bridge
- 只实现 P60 指定的最小新增事件/choice/flag 范围，不临场扩写
- 让玩家可见层读得出 peasant 从 ordinary growth 进入更高价值阶段的跃迁
- 通过 targeted proof 与窄测试证明该 bridge 在 runtime 上真实可达

## 3. Non-Goals

- 不在 P61 重新讨论 bridge 方向或改写 P60 结论
- 不扩成农业经营、城乡迁移、完整经济循环或 full lifetime sim
- 不同时处理 `tavern_hand` 或新的 ordinary origin
- 不重开 sample-line 轨或 merchant magnate deepening wave
- 不做超出 P60 contract 的额外内容波次

## 4. User Stories

### US-001: Confirm P60 Contract Intake
**Description:** As a maintainer, I want a formal intake of the approved P60 bridge contract so P61 only implements what was already decided.

**Acceptance Criteria:**
- [ ] 引用 P60 closure 中的推荐方向、bridge checkpoint、downstream target、最小新增范围
- [ ] 明确哪些内容属于 P61，哪些仍应 defer
- [ ] 输出 `docs/test-reports/p61-farm-peasant-bridge-intake.md`
- [ ] 本故事不改运行行为

### US-002: Lock P61 Scope Contract
**Description:** As a planner, I want a scope contract so P61 remains a strict implementation stage.

**Acceptance Criteria:**
- [ ] 明确 P61 只实现 P60 已批准 contract
- [ ] 明确允许层：最小事件/choice/flag/config wiring、轻量表达、proof、窄测试
- [ ] 明确禁止项：重新设计方向、新系统、新长链内容扩写
- [ ] 输出 `docs/test-reports/p61-farm-peasant-bridge-scope-contract.md`

### US-003: Implement Minimum Bridge Content
**Description:** As a developer, I want the minimum new content required by P60 so `farm_peasant` can actually cross the bridge at runtime.

**Acceptance Criteria:**
- [ ] 仅新增或调整 P60 contract 指定的最小事件/choice/flag
- [ ] 不创建超出 contract 的第二套候选路径
- [ ] bridge 前后状态边界清晰
- [ ] 相关配置通过现有 carrier 落地

### US-004: Wire Downstream Gate
**Description:** As a developer, I want the peasant bridge wired into the chosen downstream gate so the path becomes reachable without new framework work.

**Acceptance Criteria:**
- [ ] 只接入 P60 选定的唯一 downstream target
- [ ] 不新增新 destiny framework
- [ ] bridge 后路径可进入既定 gate 或形成等价 proof
- [ ] 不破坏 P25 / P56 / P58 既有 evidence

### US-005: Add Peasant Bridge Expression
**Description:** As a player, I want the peasant bridge to be legible through existing narrative surfaces.

**Acceptance Criteria:**
- [ ] 至少补 2 个 bridge 后表达信号
- [ ] 文案区分 ordinary peasant growth 与 bridge 后状态
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-006: Add Targeted Playable Proof
**Description:** As a maintainer, I want a bounded artifact proving the peasant bridge is runtime-reachable under the P60 contract.

**Acceptance Criteria:**
- [ ] 新增 1 条 targeted sim / replay / verification artifact
- [ ] 关键证据包含 peasant seed → bridge checkpoint → downstream gate
- [ ] 不依赖直接手塞 terminal destiny flags 作为唯一依据
- [ ] 不要求 combinatorial exhaust

### US-007: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests protecting the new peasant bridge from future regressions.

**Acceptance Criteria:**
- [ ] 至少覆盖 bridge gate、表达、proof key assertion 三类断言
- [ ] 复用既有 harness，不重写全量测试体系
- [ ] 相关命令 Pass
- [ ] 不引入与 stage 无关的测试重构

### US-008: Produce P61 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what playable bridge now exists for `farm_peasant`.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`
- [ ] 汇总 intake、配置、表达、proof、测试证据
- [ ] 明确与 P60 design-first、P59 tavern bridge 的边界
- [ ] 列出仍 defer 的更大系统项

## 5. Functional Requirements

1. FR-1: P61 只能实现 P60 已批准的唯一 bridge contract，不得重新选方向。
2. FR-2: P61 必须将 `farm_peasant` bridge 从设计口径推进到 runtime-playable 或 targeted-proof 口径。
3. FR-3: P61 必须通过现有内容 / route / gate 载体实现，不得引入新框架。
4. FR-4: P61 必须提供玩家可见表达与最小 proof，而不只是静态配置接线。
5. FR-5: P61 closure 必须明确这条 peasant bridge 已闭合到什么程度，以及哪些内容仍 defer。

## 6. Success Criteria

- `farm_peasant` 至少有 1 条遵循 P60 contract 的 runtime bridge
- 玩家可见层能区分普通 peasant growth 与 bridge 后的跃迁状态
- 至少存在 1 条不依赖静态终局 fixture 的 targeted proof
- P25、P56、P58 既有资产与边界不退化

## 7. Dependencies / Context

- P60 PRD: `docs/PRD/p60-wuxia-farm-peasant-bridge-design-first-wave.md`
- P60 closure: `docs/test-reports/p60-farm-peasant-bridge-design-closure-report.md`
- P56 closure: `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`
- P25 ordinary wiring: `docs/test-reports/p25-ordinary-wiring-evidence.md`
- Ordinary-origin config carriers: `src/data/lines/ordinary-origin-midlife.json`
- Existing destiny surfaces: `src/narrative/profile/wuxiaOriginSurfaces.ts`

## 8. Risks And Rollback

### Risks

- **Contract drift:** 若 P61 实施时绕开 P60 contract，阶段会重新失去边界
- **Identity mismatch:** peasant 的新 bridge 若写得过重，容易失去 ordinary-origin 根基
- **Implementation inflation:** 为了证明可达而误入更大系统扩写

### Rollback

- 若 P60 推荐方向在实现时证明无法 bounded 落地，P61 应回退到最小 contract-preserving 版本，而不是现场改题
- 若唯一实现方案需要新增大系统，则应终止该阶段并回写新的 design defer 结论

## 9. Validation Direction

- 配置层：P60 指定的最小事件/flag/gate wiring 在现有 carriers 中可触发
- 表达层：existing surfaces 能读出 peasant bridge 的前后差异
- 证明层：targeted artifact 展示 seed → bridge → downstream gate 的 key evidence
- 回归层：`typecheck`、相关 targeted tests、既有 ordinary / mixed evidence 不退化
