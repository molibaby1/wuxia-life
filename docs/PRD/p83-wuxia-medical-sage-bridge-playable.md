# PRD: P83 Wuxia Medical Sage Bridge Playable Implementation

> **Derived from:** `docs/PRD/p82-medical-sage-bridge-contract.md`, `docs/test-reports/p82-medical-sage-bridge-design-closure-report.md`, `docs/test-reports/p82-p83-validation-shape.md`
> **Stage slug:** `p83-wuxia-medical-sage-bridge-playable`
> **Stage type:** bounded runtime bridge implementation stage for medical_sage_healer

## 1. Introduction

P83 承接 `P82`，把 `medical_sage_healer`（一代名医）路线从"设计上可达"推进到"runtime 上可达、可验证、可回归"。它对应的是 renown 方法论中的 bridge 实施阶段（对应 P71）：**先闭 playable bridge，再谈后续体验优化。**

P83 严格按 P82 bridge contract 落地，不做 entry densification、不做 spine、不做 pressure/payoff。只要 bridge 还没闭合，后续体验优化都不稳。

**Bridge shape（来自 P82 contract）：** Habit-Led Study-Healer Bridge — `tavern_hand` + study habit / latent medical aptitude → midlife bridge event (age 26–30) → `tavern_medical_bridge_crossed` → `medical_sage_healer` composite gate。

**2 entry variants：** 仁心医者 (Compassionate Healer) / 世故人医 (Pragmatic Healer)。

**3 expression surfaces：** currentGoal / lifeMemory / summary。

**Mutual exclusivity：** 与 merchant bridge（P59）、renown bridge（P71）三者互斥，共用 `ordinary_tavern_midlife_done` 锁。

## 2. Goals

- 闭合 `medical_sage_healer` 路线的最小 runtime bridge
- 实现 2 个 entry variants（compassionate / pragmatic）
- 让 bridge 具备 gate acceptance、玩家可见表达（3 surfaces）、targeted proof、窄回归
- 验证与 merchant、renown 两座桥的三方互斥性
- 保持改动 bounded，不引入新 framework
- 为 `P84` 的 entry differentiation refinement 建立健康基础

## 3. Non-Goals

- 不添加 medical sample-line spine 事件（on_ramp / pressure / payoff）
- 不做 entry differentiation refinement（P82 contract 定义的 2 个 variants 之外的深化）
- 不做 cost differentiation
- 不做 success-shape / destiny sentence
- 不做 full lifetime sim exhaust
- 不新增大型 content wave
- 不做 social-momentum healer bridge 方向
- 不做 farm_peasant / town_apprentice medical bridge
- 不做 poison path (`medical_poison_path`) 作为主路线
- 不新增 UI 组件（仅在现有 expression surfaces 上加分支）
- 不修改 renown 路线内容（保持 regression clean）

## 4. User Stories

### US-001: Audit Implementation Delta Against The Bridge Contract
**Description:** As a maintainer, I want an implementation delta audit so P83 only changes what the approved bridge contract actually requires.

**Acceptance Criteria:**
- [ ] 对照 P82 bridge contract 列出需要新增或修改的最小实现点
- [ ] 明确哪些现有 wiring 可直接复用（midlife 事件系统、expression surfaces、mutual exclusivity 机制等）
- [ ] 明确需要新增的文件/配置/代码点
- [ ] 输出 `docs/test-reports/p83-medical-sage-bridge-implementation-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P83 Runtime Scope Contract
**Description:** As a planner, I want a runtime scope contract so P83 stays a playable-bridge stage and does not sprawl into later differentiation work.

**Acceptance Criteria:**
- [ ] 明确 P83 只处理 bridge wiring、2 entry variants、bridge expression（3 surfaces）、targeted proof、narrow tests
- [ ] 明确禁止项：spine events、entry densification beyond 2 variants、pressure/payoff work、new systems、additional origins
- [ ] 明确与 P84 的边界
- [ ] 输出 `docs/test-reports/p83-medical-sage-bridge-scope-contract.md`

### US-003: Implement Bridge Wiring + 2 Entry Variants
**Description:** As a developer, I want the medical sage bridge checkpoint wired through existing carriers with 2 entry variants so the target gate can be reached at runtime.

**Acceptance Criteria:**
- [ ] 在 `ordinary-origin-midlife.json` 中新增 medical bridge 事件（age 26–30, tavern_hand only）
- [ ] 实现 2 个 embrace choices：compassionate healer / pragmatic healer，各有 distinct stats/flags/flavor
- [ ] 实现 decline choice，设置 `ordinary_tavern_midlife_done` 但不设置 bridge flags
- [ ] 设置 bridge checkpoint flags：`tavern_medical_bridge_crossed` + `route_medical_committed`
- [ ] 在 bridge checkpoint 设置 `medical_pure` + `medical_talent`（幂等，已存在则不改变）
- [ ] 验证 `medical_pure` 满足 `medical_sage_healer` gate 的 key_choices dim 2
- [ ] 确保与 merchant bridge、renown bridge 的互斥性（`ordinary_tavern_midlife_done` 机制）
- [ ] 既有相关 evidence 不退化（P56/P58/P59/P61/P71/P72）

### US-004: Add Bridge Player-Facing Expression (3 Surfaces × 2 Variants)
**Description:** As a player, I want the bridge crossing to feel visible and route-specific so the new path does not read like a silent flag change.

**Acceptance Criteria:**
- [ ] `tavernCurrentGoal()` 添加 medical bridge 分支（bridge-crossed state）
- [ ] `tavernLifeMemory()` 添加 medical bridge 分支（bridge-crossed state）
- [ ] `deriveOrdinaryOriginSummary()` 添加 tavern-hand medical 分支
- [ ] 2 个 entry variants 在 expression 上有可感知差异（至少 lifeMemory 有 variant-specific 文案）
- [ ] tavern_hand identity 保留——`detectOrdinaryOrigin()` 仍返回 `'tavern_hand'`
- [ ] 表达文案风格与现有 tavern_hand 表达一致（口语化、有画面感、保留酒肆底色）
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-005: Add Targeted Bridge Proof
**Description:** As a maintainer, I want one targeted proof showing origin → bridge event → checkpoint → gate acceptance so the bridge is repo-proven without relying on static fixtures alone.

**Acceptance Criteria:**
- [ ] 产出 `docs/test-reports/p83-tavern-hand-medical-bridge-targeted-proof.md`
- [ ] 展示 P82 validation shape 定义的全部 14 个 chain nodes：
  1. Origin identity (origin_tavern_hand)
  2. Bridge event trigger (correct age + prerequisites)
  3. Bridge checkpoint (tavern_medical_bridge_crossed + route_medical_committed)
  4. Key-choice flag set at bridge (medical_pure)
  5. Entry variant A (compassionate)
  6. Entry variant B (pragmatic)
  7. Bridge decline path
  8. Player-facing signal 1 — currentGoal
  9. Player-facing signal 2 — lifeMemory
  10. Player-facing signal 3 — summary
  11. Origin identity preserved (still tavern_hand)
  12. Composite gate key_choices dim 2 met (medical_pure)
  13. Mutual exclusivity with merchant bridge
  14. Mutual exclusivity with renown bridge
- [ ] 不要求 full lifetime comparative exhaust
- [ ] proof 不依赖静态 shortcut 作为唯一证据

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow regression coverage so the new bridge cannot silently break later.

**Acceptance Criteria:**
- [ ] 新增测试文件 `tests/p83TavernHandMedicalBridgeTests.ts`
- [ ] 覆盖 P82 validation shape 定义的 ~15–20 个断言，至少包含：
  - Bridge flag chain（bridge_crossed, route_committed, medical_pure, medical_talent）
  - Prerequisite enforcement（wrong origin, midlife_done 等）
  - 2 entry variants（compassionate + pragmatic，各有 distinct stats/flags）
  - 3 expression surfaces（currentGoal, lifeMemory, summary）
  - Ordinary origin preservation（detectOrdinaryOrigin() 仍返回 tavern_hand）
  - Life-memory summary integration
  - Non-medical isolation（apprentice / farm_peasant 不受影响）
  - Mutual exclusivity: merchant vs medical（2 个方向）
  - Mutual exclusivity: renown vs medical（2 个方向）
  - Decline path（midlife_done set, bridge flags not set）
  - Composite gate key_choices dim 2（medical_pure 满足 gate）
  - Existing merchant bridge still works
  - Existing renown bridge still works
- [ ] 复用现有 harness（不重写全量路线测试体系）
- [ ] 以下回归套件全部通过：
  - `p56OrdinaryOriginGrowthTests`
  - `p58ApprenticeBridgeTests`
  - `p59TavernHandBridgeTests`
  - `p61FarmPeasantBridgeTests`
  - `p71TavernHandRenownBridgeTests`
  - `p72TavernHandRenownEntryDifferentiationTests`
  - `testLifeMemorySummary`
- [ ] `npm run typecheck` 通过

### US-007: Produce P83 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly how the medical sage bridge now works and what remains for later differentiation stages.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md`
- [ ] 汇总 wiring、2 entry variants、expression（3 surfaces）、proof、tests
- [ ] 明确 P82 contract 的 12 条 closure criteria 全部达成
- [ ] 明确与 `P84` 的边界
- [ ] 列出更大 densification / new-route 项的 defer
- [ ] 给出 entry differentiation 之后的路线规划建议（on-ramp / pressure / payoff 等）

## 5. Functional Requirements

1. FR-1: P83 必须只实现 P82 批准的 bridge contract，scope 不扩散。
2. FR-2: P83 必须闭合 gate acceptance、3 expression surfaces、2 entry variants、targeted proof、regression 五类证据。
3. FR-3: P83 的 bridge 证据不能只依赖静态 fixture。
4. FR-4: P83 必须验证与 merchant、renown 两座桥的三方互斥性。
5. FR-5: P83 必须保留 tavern_hand origin identity。
6. FR-6: P83 不得扩成后续体验优化阶段（spine / pressure / payoff / late-life）。
7. FR-7: P83 不得修改 renown 路线内容，保持 regression clean。
8. FR-8: P83 closure 必须明确 P84 是否值得继续做。

## 6. Success Criteria

- `medical_sage_healer` 路线已形成 playable bridge（runtime-reachable from tavern_hand）
- 2 个 entry variants 均可用且有可感知差异
- bridge crossing 对玩家可见（3 expression surfaces）
- targeted proof 覆盖全部 14 个 chain nodes
- narrow regression 覆盖 ~15–20 个断言，所有既有回归套件通过
- `P84` 可以在 bridge 已闭合的前提下继续（entry differentiation refinement）

## 7. Dependencies / Context

- P82 closure: `docs/test-reports/p82-medical-sage-bridge-design-closure-report.md`
- P82 bridge contract: `docs/PRD/p82-medical-sage-bridge-contract.md`
- P83 validation shape: `docs/test-reports/p82-p83-validation-shape.md`
- P82 prerequisite audit: `docs/test-reports/p82-medical-sage-prerequisite-audit.md`
- Renown bridge pattern (P71): `docs/PRD/p71-wuxia-selected-next-route-playable-bridge.md`
- Medical events: `src/data/lines/medical.json`
- Achievement config: `src/narrative/profile/wuxiaOriginSurfaces.ts` (WUXIA_COMPOSITE_DESTINY_OUTCOMES)
- Ordinary origin expressions: `src/narrative/profile/ordinaryOriginExpression.ts`
- Midlife events: `src/data/lines/ordinary-origin-midlife.json`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** 容易顺手做 spine 事件或更多 entry variants，超出 bridge-only 范围。→ Mitigation: scope contract 明确禁止，US-002 提前锁定边界。
- **Mutual exclusivity complexity:** tavern_hand 有 3 座桥，互斥逻辑比 2 座桥时更复杂，容易出现漏网之鱼。→ Mitigation: 复用 `ordinary_tavern_midlife_done` 机制，US-006 专门验证 2 组互斥对。
- **Expression consistency risk:** medical bridge 的表达文案可能与现有 tavern_hand 风格不一致。→ Mitigation: 参考 renown bridge 的表达模式，保持酒肆底色。
- **Medical_pure idempotency risk:** 如果玩家已通过 habit-led 事件获得 medical_pure，bridge 事件再次设置的行为需明确。→ Mitigation: 幂等处理（已存在则不改变），US-003 AC 明确要求。

### Rollback

- 若 bridge 需要新 framework 才能闭合，应显式中止并回到 design-first
- 若目标 gate 本身定义不足，应先补 contract，不直接硬接实现
- 若互斥逻辑无法在现有机制内实现，应暂停并重新设计 bridge shape
- P83 是 bounded implementation，回退只需 revert 相关 config/code/test 变更

## 9. Validation Direction

- bridge 层：origin → bridge event → checkpoint → gate key_choice dim 2 必须可追踪
- variant 层：2 个 entry variants 必须有 distinct stats/flags/expression
- player-facing 层：bridge crossing 必须在 3 个 expression surfaces 上可见
- mutual exclusivity 层：与 merchant、renown 两座桥的双向互斥必须验证
- regression 层：后续编辑不能悄悄打断 bridge，既有桥也不能被破坏
