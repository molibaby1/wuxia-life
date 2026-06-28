# PRD: P52 Wuxia Sample Lines Baseline Hardening And Cross-Tester Validation

> **Derived from:** `docs/test-reports/p49-sample-lines-closure-report.md` and `docs/test-reports/p51-sample-lines-tuning-closure-report.md` (post-P51 pass baseline, 2026-06-26)
> **Stage slug:** `p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation`
> **Stage type:** user-directed post-CLEAR hardening, non-blocking extension

## 1. Introduction

P51 已把三条 0–40 岁最小可玩人生样本线收口到 **Pass with documented defer**：正派武道、邪路偏锋、商路崛起三线 benchmark replay 稳定成立，表达层和验证层已接线，`gate:playability` 不退化。

但当前 baseline 仍有两个现实问题：

1. **真人证据还偏薄**：只有一轮 playtest round，RW-04 仍是 optional defer。
2. **自动化守护还偏窄**：当前 replay / spine / expression 测试已经能拦住关键回归，但“这组 baseline 未来被无意打穿”仍缺一个明确的、小而稳的守护层。

P52 不是为了重开产品主线，也不是为了继续扩样本线，而是把当前已通过的三线 baseline 变成**更可信、可回归、可交接**的稳定基线。

## 2. Goals

- 完成第二名测试者的三线真人 playtest round，并归档结果
- 对比两轮真人 playtest，判断样本线是否跨测试者仍具备可复述性、可继续性与可重开性
- 为三线 baseline 增加一层小型自动化守护，覆盖当前最关键的生命线断点
- 更新 closure 证据，使当前 baseline 从“通过”升级到“更可信的长期回归基线”
- 保持当前 `gate:playability`、P49 replay、P50 spine/expression 测试不退化

## 3. Non-Goals

- 不新增第四条样本线
- 不扩写 40 岁后的新内容主干
- 不重做 runtime 平台化
- 不做大 UI 重构或新面板
- 不为所有中期 checkpoint 建立庞大快照体系
- 不因为第二轮 playtest 出现轻微偏差就立刻进入大范围调参

## 4. User Stories

### US-001: Audit Current Post-P51 Evidence Gaps
**Description:** As a maintainer, I want a concise audit of the remaining post-P51 evidence gaps so P52 hardens the real weak spots instead of reopening closed work.

**Acceptance Criteria:**
- [ ] 盘点当前 closure 里仍然偏弱的证据项
- [ ] 明确哪些属于真人证据缺口，哪些属于自动化守护缺口
- [ ] 产出 `docs/test-reports/p52-baseline-hardening-gap-audit.md`
- [ ] 本故事不改 gameplay 行为

### US-002: Define Round-2 Human Playtest Protocol
**Description:** As a maintainer, I want an explicit second-round playtest protocol so cross-tester validation is repeatable instead of conversational.

**Acceptance Criteria:**
- [ ] 明确 round 2 使用的 seeds、样本线、记录模板与通过口径
- [ ] 明确测试者与 round 1 的对比维度
- [ ] 明确哪些结果记为 pass / warning / fail
- [ ] 将 protocol 保存到 `docs/test-reports/` 或配套文档

### US-003: Execute And Archive Human Playtest Round 2
**Description:** As a maintainer, I want a second completed playtest round archived so the sample-line baseline has cross-tester evidence instead of single-tester proof only.

**Acceptance Criteria:**
- [ ] 第二名测试者完成三条线的 round 2 checklist
- [ ] 结果保存为 `docs/test-reports/p49-sample-lines-playtest-round-2.md`
- [ ] 每条线均记录复述、继续意愿、重开意愿、关键转折记忆
- [ ] 若有 warning，必须具备文字归因，而不是只写分数

### US-004: Produce Cross-Tester Comparison Report
**Description:** As a maintainer, I want a round-1 versus round-2 comparison report so I can judge whether the baseline is stable across different human readers.

**Acceptance Criteria:**
- [ ] 产出 `docs/test-reports/p52-cross-tester-playtest-comparison.md`
- [ ] 比较三条线在可复述性、代价感知、继续意愿、重开意愿上的一致与分歧
- [ ] 明确哪些差异是正常波动，哪些差异需要后续关注
- [ ] 结论中不得把单次主观偏好误写成 blocking defect

### US-005: Define The Minimum Automated Guard Contract
**Description:** As a maintainer, I want an explicit minimum guard contract so future work knows which sample-line invariants must not silently regress.

**Acceptance Criteria:**
- [ ] 定义 baseline 最关键的自动化守护项
- [ ] 至少覆盖：merchant 804 经营态、三线 age-40 identity、cross-line cost distinct、playability gate non-regression
- [ ] 明确哪些守护应放在现有测试内，哪些应放在报告/脚本层
- [ ] 将 contract 写入 PRD 或配套测试报告

### US-006: Add Merchant Goal Bleed Regression Guard
**Description:** As a developer, I want a narrow regression guard for the merchant-versus-demonic midlife goal conflict so RW-05 does not silently come back.

**Acceptance Criteria:**
- [ ] 为 merchant 804 并行 `route_demonic` 场景保留 focused regression
- [ ] 断言 merchant line detection 和 currentGoal 仍保持商路表达
- [ ] 测试位置复用现有 P50 expression surface
- [ ] 不新增新测试框架

### US-007: Add Age-25 And Age-40 Baseline Guard Surface
**Description:** As a developer, I want a narrow baseline guard for the most important checkpoint outputs so future tuning does not break the current baseline silently.

**Acceptance Criteria:**
- [ ] 为 301/303/804 的 age 25 与 age 40 checkpoint 定义最小 guard
- [ ] 至少覆盖当前目标表达与 age-40 identity done / summary
- [ ] 守护实现复用现有 replay / spine 测试，不复制一整套 harness
- [ ] 若使用 snapshot，必须保持小而可读

### US-008: Add Baseline Guard Runner Or Script Alias
**Description:** As a maintainer, I want one small command for sample-line hardening checks so future sessions can rerun the post-P51 baseline cheaply.

**Acceptance Criteria:**
- [ ] 提供一个小范围 baseline guard 入口（脚本别名或文档化命令集合）
- [ ] 入口至少包含 P50 spine、P50 expression、P49 replay 三类检查
- [ ] 入口不替代 `gate:playability`，只作为 cheap guard
- [ ] 在文档中写明何时跑 cheap guard，何时跑 full gate

### US-009: Produce P52 Closure Addendum
**Description:** As a maintainer, I want a P52 closure addendum so the repo can distinguish “P51 baseline passes” from “P52 baseline is hardened and cross-tester checked”.

**Acceptance Criteria:**
- [ ] 产出 `docs/test-reports/p52-baseline-hardening-closure-report.md`
- [ ] 汇总 round 2 playtest、cross-tester comparison、automated guard 增补结果
- [ ] 明确 P52 完成后哪些 residual 仍仅为 monitor
- [ ] 不重新打开已关闭的 P46–P51 blocker

## 5. Functional Requirements

1. FR-1: P52 必须保持在 post-CLEAR hardening 范围内，不得扩成功能开发阶段。
2. FR-2: 第二轮真人 playtest 必须沿用当前三线 baseline，而不是换成新样本集。
3. FR-3: 自动化守护必须小而稳，优先复用现有 P49/P50 测试与 replay surface。
4. FR-4: P52 closure 必须同时引用真人 round-2 证据与自动化守护证据。
5. FR-5: P52 不得把轻微主观差异直接升级为产品 blocker。

## 6. Success Criteria

- 第二轮真人 playtest 完成并归档
- round 1 / round 2 对比能证明三条线的核心体验跨测试者仍可区分
- merchant 804 / age-40 identity / cross-line cost distinct 拥有更明确的回归守护
- 未来会话有一个低成本命令能快速回归当前 baseline
- `gate:playability` 和现有专项测试不退化

## 7. Dependencies / Context

- Current closure: `docs/test-reports/p49-sample-lines-closure-report.md`
- Current tuning closure: `docs/test-reports/p51-sample-lines-tuning-closure-report.md`
- Existing tests:
  - `tests/p50SampleLineSpineTests.ts`
  - `tests/p50SampleLineExpressionTests.ts`
  - `tests/p49SampleLineReplayTests.ts`
- Existing reports:
  - `docs/test-reports/p49-sample-lines-playtest-round-1.md`
  - `docs/test-reports/p49-sample-lines-cross-line-comparison-latest.md`
  - `docs/test-reports/p8-playability-gate-latest.md`

## 8. Recommended Follow-Up After P52

- 若 round 2 与自动化守护都稳定，可继续进入 **40+ payoff 扩展** 的新阶段。
- 若 round 2 仍暴露轻量表达歧义，但不影响 spine / replay，可优先立一个小型 **P53 expression polish**，不要重开大范围内容扩写。
- 若 cheap guard 经常抓到同类回归，再考虑把其升级成更正式的 sample-line baseline gate。

## 9. Open Questions

- 第二轮测试者是否必须完全不参考 round 1 结论，还是允许只看 protocol 不看结果
- cheap guard 最终是更适合作为 `npm run` 别名，还是仅保留文档化命令集合
- 如果 round 2 出现单线轻微分歧，是否优先记为 monitor，而不是立刻新开调参阶段

