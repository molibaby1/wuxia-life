# PRD: P99 Wuxia Merchant Magnate Native Late-Life Sample

> **Derived from:** `docs/PRD/p98-wuxia-merchant-magnate-native-midlate-differentiation.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p99-wuxia-merchant-magnate-native-late-life-sample`
> **Gaps addressed:** GAP-P98-N01, GAP-P98-N02
> **Stage type:** bounded native-path magnate post-payoff late-life sample, not full empire rewrite

## 1. Introduction

P98 已让 native `merchant_house` 的 P97 entry markers 与 P98 pressure/payoff markers 在 ages 36–46 产生可读、可验证的 ledger vs caravan 分化，且 P55 骨架与 P63/P64 bridge 不退化。

但 P55 magnate spine 在 `magnate_payoff_done` 后**无 late-life 事件**；native ledger/caravan 玩家在 age 46+ 仍落回 generic magnate 表达。Wave 3 §8 item 1 的 native merchant→magnate 链因此止于 payoff，缺 bounded late-life 可玩样本。

本阶段只解决一个窄缺口：

**让 native ledger/caravan 的 P98 payoff lineage 在 post-payoff late-life（age 48–56 带）产生可读、可验证的差异化样本，且不破坏 P55 骨架、P98 mid/late 或 P64 bridge 分化。**

不重做 P97/P98 magnate 入口与中后段，不进入 `merchant_martial_patron`，不扩 Wave 4 或 full empire ending 图谱。

## 2. Goals

- 审计 post-`magnate_payoff_done` magnate flattening，明确 late-life 接线面
- 定义 bounded late-life scope contract（single spine event + native ledger/caravan branches）
- 新增或接线 `magnate_late_life`（或等价 narrow event ID）读取 P98 payoff markers 或 P97 entry lineage
- 让 ledger vs caravan 在 late-life 呈现至少两组可读 player-facing 差异（文案、表达或轻量 marker 后果）
- 保持 P55 on-ramp → pressure → payoff → late-life 主链可通；P63/P64 bridge 表达**不退化**
- 以窄 proof + 回归测试闭合本 stage，推进 Wave 3 §8 native magnate 链 toward late-life sample

## 3. Non-Goals

- 不重做 P97 magnate on-ramp 或 P98 pressure/payoff wiring
- 不重做 P64 bridge pressure/payoff/late-life 分化（bridge late-life 可 defer）
- 不实现 `merchant_martial_patron` 跨路线桥接
- 不做 merchant endgame echo / final legacy 全图谱（P100+ defer）
- 不新建 economy / trade-platform / 第二套经营容器
- 不做全生命周期 broad audit 或 `gate:p20` 全量重跑
- 不新增独立 UI 面板
- 不一次性实现 North Star §8 全谱

## 4. Core Product Decision

沿用已确认主链：

`P97 magnate 入口 → P98 magnate 中后段 → P99 magnate 晚年样本 → P55 magnate 骨架收束`

在 late-life 具体化为：

1. native 玩家已携带 P98 `magnate_native_payoff_*` markers（或 P97 entry lineage fallback）
2. post-payoff late-life event 读取上述 markers，输出 ledger/caravan 差异化 framing、choice 分支或轻量 downstream marker
3. bridge-origin 玩家仍走 generic 或 P64-priority 表达，不与 native track 分支冲突
4. 分化结果**喂入**既有 P55 spine 架构，不替换 on-ramp / pressure / payoff event ID

## 5. User Stories

### US-001: Audit Native Magnate Post-Payoff Flattening

**Description:** As a maintainer, I want the post-payoff magnate flattening gap documented so P99 targets the P98 payoff → late-life discontinuity.

**Acceptance Criteria:**

- [ ] Document current magnate spine terminus after `magnate_payoff_done` and available late-life hooks
- [ ] Explicitly identify where P98 payoff markers are not consumed downstream
- [ ] Distinguish native track late-life target from bridge-origin defer scope
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Lock Native Magnate Late-Life Scope Contract

**Description:** As a planner, I want a scope contract so P99 stays a bounded late-life sample and does not sprawl into full empire rewrite.

**Acceptance Criteria:**

- [ ] Define single late-life spine event band (recommended age 48–56) and checkpoint flags
- [ ] Define allowed surfaces: spine choice/auto wiring, expression, narrow proof
- [ ] Define forbidden items: endgame legacy wave, martial patron, bridge late-life rewrite, new UI
- [ ] Save scope contract under `docs/test-reports/`

### US-003: Wire Native Payoff Lineage Into Magnate Late-Life

**Description:** As a player, I want my ledger or caravan magnate payoff personality to carry into late life so identity does not reset after age 46.

**Acceptance Criteria:**

- [ ] Late-life event reads P98 payoff markers or P97 entry lineage for native merchant_house path
- [ ] Ledger and caravan produce different player-facing text, condition branch, or downstream marker
- [ ] Change affects at least one downstream state beyond flavor-only text
- [ ] P55 magnate chain through payoff remains reachable; new late-life is additive
- [ ] P63/P64 bridge-origin paths do not regress

### US-004: Strengthen Native Late-Life Expression

**Description:** As a player, I want late-life goals and burden labels to reflect my native operating track through the magnate arc.

**Acceptance Criteria:**

- [ ] Add or refine at least two player-facing expression pairs for native ledger vs caravan at late-life
- [ ] At least one expression reads P98 payoff or P97 entry markers
- [ ] Bridge-origin expressions retain priority when bridge markers are set
- [ ] Identity hooks (`merchantAge40Identity` or equivalent) reflect native track at late-life checkpoint when applicable

### US-005: Add Narrow Proof And Regression Coverage

**Description:** As a maintainer, I want proof and tests for native magnate late-life differentiation so the stage closes on evidence.

**Acceptance Criteria:**

- [ ] Add at least one focused test covering ledger and caravan native paths through late-life checkpoint
- [ ] Produce or update one proof artifact under `docs/test-reports/`
- [ ] Proof shows age, P97/P98 flags, and at least one changed player-facing outcome at late-life checkpoint
- [ ] Verification does not require full-lifetime broad audits
- [ ] `npm run typecheck` passes
- [ ] Relevant merchant-focused tests pass

### US-006: Produce Stage Closure And Next-Step Boundary

**Description:** As a maintainer, I want a closure report stating what P99 proves and what remains deferred.

**Acceptance Criteria:**

- [ ] Save a closure report under `docs/test-reports/`
- [ ] State what was added at magnate native late-life sample
- [ ] State what remains deferred (endgame legacy, bridge late-life, merchant_martial_patron, North Star §8 broader waves)
- [ ] Explicitly say this stage does not implement endgame rewrite or merchant_martial_patron
- [ ] Name the next bounded candidate stage after this one

## 6. Functional Requirements

1. FR-1: Native merchant_house magnate late-life must read P98 payoff markers and P97 entry lineage.
2. FR-2: Ledger vs caravan must produce distinguishable late-life outcomes or expression.
3. FR-3: P55 magnate skeleton and P63/P64 bridge mid/late differentiation must not regress.
4. FR-4: New wiring must reuse existing merchant route state model; no new progression container.
5. FR-5: Stage remains bounded to magnate late-life sample; no silent generalization to other routes.

## 7. Design Considerations

- ledger late-life：稳态巨贾守成、信誉与接班/收束抉择
- caravan late-life：行市赢家收势、货路与风险余波
- 调性：「巨贾之位已坐稳，晚年仍带经营人格」而非 empire 终局叙事
- 优先窄 spine/expression/choice 接线，pattern 参照 renown P79 / medical P91 late-life playable
- age band 建议 48–56，requires `magnate_payoff_done`

## 8. Success Metrics

- native merchant_house ledger/caravan 各有一条 magnate payoff→late-life 可玩样本
- replay age 48–56 checkpoint 能体现经营 track 差异
- P55/P63/P64/P97/P98 回归不退化
- 不引入新的系统级复杂度

## 9. Open Questions

- late-life 用 single auto event with branches 还是 choice event（P98 模式优先 choice 若后果需分化）
- 是否需读取 payoff-phase choice outcome（P99 做最小接线时优先 marker 链）

## 10. Out-Of-Scope Follow-Up

1. Merchant magnate endgame echo / final legacy（P100+ bounded endgame sample）
2. Bridge-origin magnate late-life differentiation
3. `merchant_martial_patron` 跨路线桥接
4. North Star §8 Wave 1/2/4 broader waves
5. Full-lifetime simulation `gate:p20` broad rerun
