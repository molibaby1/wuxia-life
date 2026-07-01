# PRD: P51 Wuxia Sample Lines Merchant Trigger And Gate Wiring

> **Derived from:** `agent_docs/p50-wuxia-sample-lines-validation-implementation-discovery-result.md` (Discovery pass 2026-06-26)  
> **Stage slug:** `p51-wuxia-sample-lines-merchant-trigger-and-gate-wiring`  
> **Gaps addressed:** GAP-P50-MERCHANT-TRIGGER, GAP-P50-AGE40-IDENTITY, GAP-P50-CROSSLINE-COST, RW-01, RW-02, RW-03 (partial)

## 1. Introduction

P50 已将 P46–P49 规格落地为可重复运行的三线 benchmark replay（seeds 301/303/804）、玩家表达接线与 closure 证据链，整体 verdict 为 **Warning — baseline-ready with residual**。

本阶段是 **窄 scope tuning**，不扩新剧情主干、不新增样本线、不做 runtime 平台化。目标是在既有 `sample-lines-spine.json`、`merchant.json` 与 `src/p50/sampleLineExpression.ts` 上，消除 P50 closure 报告中的三项可验证 residual：

1. **RW-01** — 商路 seed 804 的 `merchant_first_shop` 触发不稳定，age 25+ 仍显示「尚未开张」
2. **RW-02** — 三线 benchmark replay 未稳定写入 `*_age40_identity_done`，依赖 interim currentGoal
3. **RW-03** — age 13 cross-line **代价感知** 维 1× collapsed（三线均「商路债务」）

成功收口后，P49 overall verdict 应由 **Warning → Pass**（无 blocking failure），P46 §11.3 可升级为 **Pass** 或 **Pass with documented defer**（RW-03/RW-04 若仍 optional）。

## 2. Goals

- 使 seed 804 在 age 16–22 稳定触发 `merchant_first_shop` 链，age 25+ currentGoal 反映开店/经营态
- 使 benchmark seeds 301/303/804 在 age 40 checkpoint 稳定触发对应 `*_age40_identity_done` 与专用 identity 文案
- 使 age 13 cross-line 代价维由 collapsed 升为 partial 或 distinct（三线代价来源可区分）
- 重新生成 P49 replay latest + cross-line comparison，并更新 closure report
- 保持 `gate:playability` 与 P50 专项测试不退化

## 3. Non-Goals

- 不新增第四条样本线或扩写全量事件池
- 不重构 scheduler / mandatory 平台
- 不做大 UI 或新面板
- 不实现 Wave 1 新增成就或 Wave 3/4 扩展
- 不强制第二名 playtest round（RW-04 仍为 optional defer）
- 不修复 RW-03 正派 301 并行 `route_merchant` 信号（除非本 stage 顺带消除且无副作用）

## 4. User Stories

### US-001: Stabilize Merchant First Shop For Benchmark Seed 804
**Description:** As a maintainer, I want seed 804 to reliably trigger the merchant shop chain so the merchant sample line reads as an active business arc rather than stuck at「尚未开张」.

**Acceptance Criteria:**
- [ ] Root cause of RW-01 documented in `docs/test-reports/p51-merchant-trigger-root-cause.md`（条件、seed persona、money/flag 门槛）
- [ ] Seed 804 replay：`merchant_talent` 或等效 `route_merchant` 在 age ≤16 就绪；`merchant_first_shop` 在 age 16–22 至少触发一次
- [ ] 任一 `merchant_shop_grocery` / `_weapon` / `_herb` 在 age ≤25 写入（或 documented mandatory fallback 事件）
- [ ] age 25 checkpoint currentGoal 含开店/经营语义，不再仅为「尚未开张」
- [ ] `p50SampleLineSpineTests` 或 `p49SampleLineReplayTests` 对 seed 804 增加 shop-chain 断言

### US-002: Stabilize Age-40 Identity Events For All Three Benchmark Seeds
**Description:** As a player, I want age-40 summary to use dedicated identity events when I completed the sample line so replay and playtest show memorable life-type closure.

**Acceptance Criteria:**
- [ ] Seed 301 replay age 40：`orthodox_age40_identity_done` 为 true；checkpoint 含专用 identity 文案（非仅 interim currentGoal）
- [ ] Seed 303 replay age 40：`demonic_age40_identity_done` 为 true；专用邪路 40 岁总结可见
- [ ] Seed 804 replay age 40：`merchant_age40_identity_done` 为 true；专用商路 40 岁总结可见
- [ ] 调整限于 `sample-lines-spine.json`、相关 line JSON 条件、或 benchmark persona 初始 flag/stat；不新增 unrelated 事件池
- [ ] `deriveSampleLineAge40Identity`（或等价）在 flag 存在时优先专用文案

### US-003: Differentiate Early Cross-Line Cost Expression
**Description:** As a maintainer, I want age-13 cost signals to differ across lines so cross-line comparison does not collapse on「商路债务」for all three.

**Acceptance Criteria:**
- [ ] age 13 checkpoint：正派代价文案引用守正/入门/练功代价来源（非泛化商路债务）
- [ ] age 13 checkpoint：邪路代价文案引用越界/邪念/风险来源
- [ ] age 13 checkpoint：商路代价文案保留债务/周转/经商风险语义
- [ ] `p49-sample-lines-cross-line-comparison-latest.md` 中 age 13 / 代价感知 维 verdict 为 **partial** 或 **distinct**（非 collapsed）
- [ ] `p50SampleLineExpressionTests` 或新增 focused test 覆盖三线 age-13 cost 字符串互不相同

### US-004: Regenerate Replay Reports And Upgrade Closure Verdict
**Description:** As a maintainer, I want updated P49 artifacts reflecting P51 fixes so closure evidence matches the new baseline.

**Acceptance Criteria:**
- [ ] `npm run p49:replay` 重新生成 `p49-sample-lines-replay-latest.json` / `.md`
- [ ] 重新生成 `p49-sample-lines-cross-line-comparison-latest.md`；collapsed 总数 ≤ P50 基线（目标 0）
- [ ] 更新 `docs/test-reports/p49-sample-lines-closure-report.md`：RW-01/RW-02 标记 resolved；overall P49 verdict **Pass**（或 Pass with RW-04 defer）
- [ ] 更新 P46 §11.3 整体 closure 状态为 **Pass** 或 **Pass with documented defer**
- [ ] `p49SampleLineReplayTests` 全 PASS；同 seed 双跑 deterministic hash 不变

### US-005: Regression Guard And P51 Closure Evidence
**Description:** As a maintainer, I want explicit P51 closure evidence and gate non-regression so tuning does not break playability.

**Acceptance Criteria:**
- [ ] `npm run typecheck` PASS
- [ ] `p50SampleLineSpineTests`、`p50SampleLineExpressionTests`、`p49SampleLineReplayTests` 全 PASS
- [ ] `gate:playability` 无回归（或 documented equivalent slice PASS）
- [ ] 新增 `docs/test-reports/p51-sample-lines-tuning-closure-report.md`：before/after 对照 RW-01/02/03、replay 摘要、residual defer 列表
- [ ] 本 stage 改动不降低 seeds 301/303/804 的 finalAge≥38

## 5. Functional Requirements

1. FR-1: 商路修复必须优先 tuning 条件/seed/persona/mandatory 保护，而非新增平行商路主线。
2. FR-2: age-40 修复必须复用 `sample-lines-spine.json` 既有 `*_age40_identity_summary` 事件。
3. FR-3: 表达层修复必须复用 `src/p50/sampleLineExpression.ts`，禁止新 dashboard。
4. FR-4: 所有修复必须通过 P49 benchmark matrix（301/303/804）可重复验证。
5. FR-5: closure 升级必须同时引用仿真 before/after；不得 silent pass。

## 6. Success Criteria

- Seed 804 age 25+ currentGoal 反映经营态；age 40 有 `merchant_age40_identity_done`
- Seeds 301/303 age 40 均有对应 `*_age40_identity_done`
- Cross-line age 13 代价维 non-collapsed
- P49 overall verdict **Pass**；P46 §11.3 **Pass**（RW-04 可 defer）
- 无 playability gate 回归

## 7. Dependencies / Context

- Parent: `docs/PRD/p50-wuxia-sample-lines-validation-implementation.md`
- Upstream specs: P47 §17 wiring, P48 §14–§16, P49 validation contract
- Baseline evidence: `docs/test-reports/p49-sample-lines-closure-report.md`（P50 Warning）
- Discovery: `agent_docs/p50-wuxia-sample-lines-validation-implementation-gaps.md`
- Key files: `src/data/lines/merchant.json`, `src/data/lines/sample-lines-spine.json`, `src/p50/sampleLineExpression.ts`, `src/p49/sampleLineReplay.ts`

## 8. Technical Notes

### RW-01 已知线索

- `merchant_first_shop` 条件：`flags.merchant_talent == true && money >= 50`（`merchant.json`）
- seed 804 persona 可能在 age 16 时 `merchant_talent` 未写入或 `money < 50`
- `merchant_childhood_seed_milestone` 已写 `route_merchant`，但不保证 `merchant_talent`
- 修复选项（择最小）：降低 benchmark 门槛、保证 `merchant_talent_discovery` 在 804 上 auto-resolve、为 804 增加 `mainline`/`mandatory` 保护、或 spine 桥接事件

### RW-02 已知线索

- spine 事件已存在，条件依赖 `route_orthodox` / `route_demonic` / `route_merchant`
- 301 可能缺 `route_orthodox`；303 可能缺稳定 `route_demonic`；804 可能缺 shop 前置导致 identity 条件弱满足
- 邪路 age40 trigger 为 age 38（`demonic_age40_identity_summary`），checkpoint 40 应仍可见 done flag

### RW-03 已知线索

- age 13 三线均显示「商路债务」→ `sampleLineExpression` cost 分支过早 fallback 到 merchant debt 文案
- 修复应基于各线 active route / seed milestone flags 选择 cost source

## 9. Open Questions

- 804 是否允许 benchmark-only persona stat 补丁（仅 sim/replay），避免影响 live 随机出生？
- age-40 若 route flag 仍弱：优先放宽 spine 条件 vs 增加 youth 桥接 flag — 实施时选最小 diff
- RW-03 正派并行 `route_merchant`：本 stage 仅修 cost 文案，是否顺带清除 301 上 `route_merchant` — 默认 **否**，除非零副作用
