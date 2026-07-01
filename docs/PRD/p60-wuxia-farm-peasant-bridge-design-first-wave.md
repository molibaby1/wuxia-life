# PRD: P60 Wuxia Farm Peasant Bridge Design-First Wave

> **Derived from:** `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`, `agent_docs/p58-wuxia-town-apprentice-merchant-magnate-bridge-discovery-result.md`, `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`, `docs/test-reports/p25-ordinary-wiring-evidence.md`
> **Stage slug:** `p60-wuxia-farm-peasant-bridge-design-first-wave`
> **Stage type:** bounded design-first discovery stage for deferred ordinary-origin bridge

## 1. Introduction

与 `town_apprentice`、`tavern_hand` 不同，`farm_peasant` 在现有仓库资产里并没有显式 trade-network 或 merchant-route seed。P56 只把它推进到“稳守田产 / 接受外来机会”的 ordinary growth，P25 也更偏向把它接到 `mentor_bond` / `jianghu_renown_sage` 这类路径，而不是现成的商路。

P58 的 discovery 已把这件事说清楚：`farm_peasant` bridge feasibility 为 **Low**，不是因为它没有潜力，而是因为它缺的首先不是“再接几根 flag”，而是“桥到底应该从什么事件种子长出来”。如果跳过这一步，直接做 playable bridge，只会导致强行商路化、身份崩塌或 scope 漫延。

因此，P60 应明确定位为 design-first wave：先用一小个阶段完成 `farm_peasant` bridge 方向审计、候选桥种子设计、目标路径选择与边界收口，产出后续可执行的 bridge contract。P60 不承担最终 playable wiring。

## 2. Goals

- 审计 `farm_peasant` 当前 ordinary growth 与 downstream wiring 资产，明确真实 bridge 缺口
- 定义 1 条 repo-grounded、叙事上成立、系统上 bounded 的 peasant bridge 方向
- 产出可供后续实现阶段直接消费的 bridge contract / scope contract / design evidence
- 明确 P61 的实施边界，避免直接跳入不稳定实现

## 3. Non-Goals

- 不在 P60 中直接落地 playable bridge 配置
- 不强行把 `farm_peasant` 接成 merchant-only 路径
- 不同时实现 `tavern_hand` bridge 或新 ordinary wave
- 不扩成农业经营系统、城乡迁移系统、平台化或 full lifetime sim
- 不重开 sample-line 轨或 second 40+ 规划

## 4. User Stories

### US-001: Audit Farm-Peasant Bridge Gap
**Description:** As a maintainer, I want a grounded audit of `farm_peasant` so the next stage solves the real absence of bridge seeds instead of patching symptoms.

**Acceptance Criteria:**
- [ ] 汇总 `farm_peasant` 当前 early / midlife flags、choices、表达与现有 downstream wiring
- [ ] 明确哪些 signal 已有，哪些关键 bridge seeds 缺失
- [ ] 对比 P58 apprentice 模式为何不能直接复用
- [ ] 输出 `docs/test-reports/p60-farm-peasant-bridge-gap-audit.md`

### US-002: Lock P60 Scope Contract
**Description:** As a planner, I want a scope contract so P60 remains a design-first stage instead of偷偷滑进实现层。

**Acceptance Criteria:**
- [ ] 明确 P60 只做 audit / design / contract / feasibility，不做 runtime wiring
- [ ] 明确允许层：候选方向分析、seed design、target selection、验证口径设计
- [ ] 明确禁止项：配置改动、bridge playable proof、全量内容扩写
- [ ] 输出 `docs/test-reports/p60-farm-peasant-bridge-scope-contract.md`

### US-003: Define Candidate Bridge Seeds
**Description:** As a designer, I want candidate bridge seeds for `farm_peasant` so downstream implementation has a clear starting point.

**Acceptance Criteria:**
- [ ] 至少提出 2 条候选 bridge seed 方向
- [ ] 每条方向都绑定现有仓库事件/flag/表达资产，而不是纯空想
- [ ] 比较其 narrative fit、system fit、scope cost
- [ ] 明确推荐唯一首选方向

### US-004: Choose And Justify The Downstream Target
**Description:** As a maintainer, I want P60 to choose one downstream target for `farm_peasant` and justify it with repo evidence.

**Acceptance Criteria:**
- [ ] 明确目标是 merchant-adjacent、renown-adjacent，还是其他既有 mixed destiny
- [ ] 解释为什么该目标优于“硬接 merchant magnate”
- [ ] 若需要引入新事件 seed，明确是最小增量而非新系统
- [ ] 结论写入正式 PRD 或 contract 文档

### US-005: Produce Farm-Peasant Bridge Contract
**Description:** As a designer, I want a bridge contract that defines the minimum future implementation shape for `farm_peasant`.

**Acceptance Criteria:**
- [ ] 定义最小前置条件组
- [ ] 定义 bridge checkpoint 应发生在哪一类事件上
- [ ] 定义最小新增事件/choice/flag 范围
- [ ] 明确 bridge 后的 downstream gate 与表达变化

### US-006: Define P61 Validation Shape
**Description:** As a planner, I want a validation shape for the follow-up playable stage so P61 can stay bounded.

**Acceptance Criteria:**
- [ ] 定义 P61 应补哪些 proof / tests / closure artifacts
- [ ] 明确哪些验证必须存在，哪些验证故意 defer
- [ ] 定义成功验收口径，避免 P61 再次发散
- [ ] 写入 P60 输出文档

### US-007: Produce P60 Closure Report
**Description:** As a maintainer, I want a closure report summarizing the chosen direction and the exact handoff into P61.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p60-farm-peasant-bridge-design-closure-report.md`
- [ ] 汇总 audit、候选方向比较、最终推荐方向、P61 handoff
- [ ] 明确为什么 P60 不直接落地 playable implementation
- [ ] 明确仍 defer 的更大 ordinary / economy / migration 系统项

## 5. Functional Requirements

1. FR-1: P60 只做 `farm_peasant` 的 design-first bridge discovery，不做实现层 runtime wiring。
2. FR-2: P60 必须给出唯一推荐方向，而不是把多个方向都留成开放问题。
3. FR-3: P60 的推荐方向必须绑定现有 repo 资产与现有 closure / gap 结论。
4. FR-4: P60 必须产出后续 playable stage 可直接消费的 contract 文档。
5. FR-5: P60 不得借设计阶段之名扩成 full ordinary redesign 或新平台规划。

## 6. Success Criteria

- `farm_peasant` bridge 的核心问题从“没有 seed、方向不清”变成“下一阶段可按 contract 实施”
- 至少有 1 条被明确推荐且 repo-grounded 的桥接方向
- P61 的范围、非目标、验证口径已被预先收口
- 不需要在 P60 中动代码，也能对后续阶段形成高质量约束

## 7. Dependencies / Context

- P58 closure: `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- P58 discovery: `agent_docs/p58-wuxia-town-apprentice-merchant-magnate-bridge-discovery-result.md`
- P56 closure: `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`
- P25 ordinary wiring: `docs/test-reports/p25-ordinary-wiring-evidence.md`
- Ordinary-origin midlife config: `src/data/lines/ordinary-origin-midlife.json`
- Mixed destiny gate surfaces: `src/narrative/profile/wuxiaOriginSurfaces.ts`

## 8. Risks And Rollback

### Risks

- **Design vagueness:** 容易停留在“也许可以这样”的空泛方向，无法真正约束 P61
- **Merchant bias:** 容易因为 P55/P58 刚完成而把 peasant 强行往商路挤
- **Scope inflation:** 容易从 bridge design 滑向城乡系统或田产系统重设计

### Rollback

- 若 audit 证明 `farm_peasant` 在当前仓库中不存在值得推进的 bounded bridge，则 P60 可收口为“不建议继续”的 closure 结论
- 若唯一可行方向需要新增大系统或重写普通起点结构，则应显式 defer，而不是伪装成小阶段

## 9. Validation Direction

- 证据层：audit、候选方向比较、推荐结论必须都绑定现有 repo 资产
- 合约层：bridge contract 必须足够具体，可直接转化为 P61 的实现故事
- 边界层：closure 必须清楚写出 P60 为什么只做 design-first，以及 P61 的 bounded handoff
