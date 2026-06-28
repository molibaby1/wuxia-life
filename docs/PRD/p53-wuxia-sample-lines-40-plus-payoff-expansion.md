# PRD: P53 Wuxia Sample Lines 40+ Payoff Expansion

> **Derived from:** `docs/test-reports/p52-baseline-hardening-closure-report.md` and P52 PRD §8 Recommended Follow-Up (2026-06-26)  
> **Stage slug:** `p53-wuxia-sample-lines-40-plus-payoff-expansion`  
> **Stage type:** bounded content extension on hardened 0–40 baseline

## 1. Introduction

P52 已将三条 0–40 岁最小可玩人生样本线收口为 **cross-tester checked + cheap-guard protected** 的稳定基线：RW-04 已关闭，round-2 与自动化守护均稳定，无 blocking defect。

当前 baseline 在 age 40 有专用 identity 收束，但 **40 岁之后缺少有结构的 payoff 节点**——玩家完成 40 岁总结后缺少「下一阶段人生方向」的可感知钩子。P52 PRD §8 明确：若 round 2 与自动化守护稳定，可继续进入 **40+ payoff 扩展**。

本阶段在 **不破坏 P52 baseline guard**、不新增第四条样本线、不做 runtime 平台化的前提下，为三线各增加 **1–2 个 bounded 40+ payoff 节点**（目标 age 45–55 切片），并补齐表达、replay 与 guard 延伸。

## 2. Goals

- 为三线各定义 bounded 40+ payoff spine（承接 age-40 identity，不另起炉灶）
- 在 `sample-lines-spine.json` 或既有 line JSON 上落地最小可触发节点
- 将 40+ checkpoint 映射到玩家可见 summary / route signal / life-memory
- 扩展固定 seed replay 与 cheap guard 到 40+ 关键年龄
- 产出 P53 closure 报告，区分「0–40 baseline（P52）」与「40+ payoff slice（P53）」

## 3. Non-Goals

- 不新增第四条样本线
- 不做 full birth→death lifetime sim（North Star §8 lifetime track 另立阶段）
- 不重开 P46–P52 已关闭 blocker 或大规模调参
- 不强制解决 monitor-only 残差（M-orthodox-gray、M-merchant-debt）——若需 expression polish 可另开小 stage
- 不做大 UI 重构或新面板
- 不扩写全量事件池或 Wave 2–4 成就

## 4. User Stories

### US-001: Audit 40+ Payoff Gaps From P52 Baseline
**Description:** As a maintainer, I want a concise audit of what exists after age 40 for each sample line so P53 extends real spine gaps instead of inventing disconnected arcs.

**Acceptance Criteria:**
- [ ] 盘点三线 age-40 identity 之后现有内容与缺失 payoff 节点
- [ ] 引用 P52 monitor-only 残差，明确哪些不在 P53 scope
- [ ] 产出 `docs/test-reports/p53-sample-lines-40-plus-gap-audit.md`
- [ ] 本故事不改 gameplay 行为

### US-002: Define Bounded 40+ Payoff Scope Contract
**Description:** As a planner, I want an explicit scope contract for 40+ payoff so implementation stays bounded and guard-compatible.

**Acceptance Criteria:**
- [ ] 定义每线 40+ 目标年龄切片（建议 45–55）与最多 2 个 payoff 节点
- [ ] 定义与 P52 age-40 identity flag 的续链接条件
- [ ] 定义 pass / warning / fail 口径（仿真 + 可选轻量人工 spot-check）
- [ ] 将 contract 写入 PRD 或 `docs/test-reports/`

### US-003: Specify Orthodox 40+ Payoff Spine
**Description:** As a designer, I want an orthodox 40+ payoff spine so the martial line continues with stewardship, legacy, or sect obligation after age-40 identity.

**Acceptance Criteria:**
- [ ] 定义至少 1 个 40+ payoff 节点（含 flag 续链与 narrative hook）
- [ ] 节点与现有 `route_orthodox` / sect midlife 内容复用或桥接，不重复 age-40 总结
- [ ] 记录 spine 规格于 PRD 或 gap audit 附录
- [ ] 实现限于配置层小范围改动

### US-004: Specify Demonic 40+ Payoff Spine
**Description:** As a designer, I want a demonic 40+ payoff spine so the edge line continues with escalation, backlash, or territory consolidation after age-40 identity.

**Acceptance Criteria:**
- [ ] 定义至少 1 个 40+ payoff 节点（含 flag 续链与 narrative hook）
- [ ] 节点体现诱惑/收益/反噬延续，不与 age-40 邪路总结重复
- [ ] 记录 spine 规格于 PRD 或 gap audit 附录
- [ ] 实现限于配置层小范围改动

### US-005: Specify Merchant 40+ Payoff Spine
**Description:** As a designer, I want a merchant 40+ payoff spine so the business line continues with debt, expansion, or loyalty conflict after age-40 identity.

**Acceptance Criteria:**
- [ ] 定义至少 1 个 40+ payoff 节点（含 flag 续链与 narrative hook）
- [ ] 节点可加强 midlife 债务/人情信号（可选回应 M-merchant-debt monitor）
- [ ] 记录 spine 规格于 PRD 或 gap audit 附录
- [ ] 实现限于配置层小范围改动

### US-006: Implement 40+ Spine Configuration
**Description:** As a developer, I want the 40+ payoff nodes wired into existing content carriers so they trigger on benchmark seeds without breaking P52 guards.

**Acceptance Criteria:**
- [ ] 三线 40+ 节点写入 `sample-lines-spine.json` 或既有 line JSON
- [ ] Benchmark seeds 301/303/804 在目标 age 切片内至少各触发 1 次 40+ payoff 事件或 flag
- [ ] `npm run guard:sample-lines-baseline` 仍 **Pass**（P52 0–40 不退化）
- [ ] 不引入新测试框架

### US-007: Wire Player-Facing Expression For 40+ Checkpoints
**Description:** As a player, I want 40+ payoff visible in summary or route signal so I know my life continues meaningfully after the age-40 identity beat.

**Acceptance Criteria:**
- [ ] 为 40+ checkpoint 定义 `deriveSampleLineCurrentGoal` 或等价表达规则
- [ ] 至少覆盖 benchmark seeds 301/303/804 的目标 age 检查点
- [ ] 复用 P48/P50 表达面，不新增 UI 组件
- [ ] `p50SampleLineExpressionTests` 或 focused test 覆盖 40+ 表达断言

### US-008: Extend Fixed-Seed Replay To 40+ Age Slice
**Description:** As a maintainer, I want replay extended beyond age 40 so 40+ payoff is regression-checked like the 0–40 baseline.

**Acceptance Criteria:**
- [ ] 扩展 `p49:replay` 或 companion script 到 age 45–55（或 contract 定义的上界）
- [ ] 更新 `p49-sample-lines-replay-latest.*` 含 40+ checkpoint 字段
- [ ] 同 seed 双跑 deterministic hash 仍一致
- [ ] 更新 cross-line comparison 含 40+ 可读差异维度（若适用）

### US-009: Extend Baseline Guard For 40+ Checkpoints
**Description:** As a maintainer, I want cheap guard extended to 40+ invariants so future edits do not silently drop post-40 payoff.

**Acceptance Criteria:**
- [ ] 更新 `p52-sample-line-baseline-guard-contract.md` 或 P53 addendum 含 G-40+ 项
- [ ] 在 spine 或 replay tests 增加窄 40+ 断言（每线至少 1 项）
- [ ] `npm run guard:sample-lines-baseline` 包含新断言且 **Pass**
- [ ] 不替代 `gate:playability`

### US-010: Produce P53 Closure Report
**Description:** As a maintainer, I want a P53 closure report distinguishing 0–40 baseline from 40+ payoff slice completion.

**Acceptance Criteria:**
- [ ] 产出 `docs/test-reports/p53-sample-lines-40-plus-closure-report.md`
- [ ] 汇总 gap audit、spine 落地、表达、replay、guard 证据
- [ ] 明确 P52 baseline 仍有效；列出仍 monitor-only 的 residual
- [ ] 不重开 P46–P52 blocker

## 5. Functional Requirements

1. FR-1: P53 必须保持 P52 0–40 baseline guard 不退化。
2. FR-2: 40+ 节点必须续接 age-40 identity flag，不得另起无关主线。
3. FR-3: 每线 40+ payoff 节点上限为 2，避免 scope creep。
4. FR-4: Replay 与 guard 延伸必须复用 P49/P50/P52 harness。
5. FR-5: P53 不得把 monitor-only 残差升级为 blocking defect。

## 6. Success Criteria

- 三线 benchmark seeds 在 40+ 切片有可触发的 payoff 节点
- 玩家可见表达在 40+ checkpoint 可读且线内一致
- Cheap guard 覆盖 40+ 关键断言
- P52 baseline guard 全 Pass
- Closure 报告区分 0–40 与 40+ 完成度

## 7. Dependencies / Context

- P52 closure: `docs/test-reports/p52-baseline-hardening-closure-report.md`
- Guard contract: `docs/test-reports/p52-sample-line-baseline-guard-contract.md`
- Spine: `src/data/lines/sample-lines-spine.json`
- Expression: `src/p50/sampleLineExpression.ts`
- Tests: `tests/p50SampleLineSpineTests.ts`, `tests/p49SampleLineReplayTests.ts`
- North Star §8 lifetime sim items remain **OPEN** — P53 addresses sample-line 40+ only

## 8. Open Questions

- 40+ 切片上界取 age 50 还是 55（取决于现有 mandatory 密度）
- M-merchant-debt 是否在 P53 顺带加强，还是留给独立 expression polish stage
- 是否需要在 P53 做轻量 playtest spot-check，或仅仿真 + guard 即可 closure
