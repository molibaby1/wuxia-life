# PRD: P49 Wuxia Sample Lines Validation And Playtest

## 1. Introduction

P49 是三条最小可玩人生样本线的第三执行阶段，目标是验证“这三条线是否真的能稳定出现、能被读懂、能被复述、能激发继续和重开的意愿”。

本阶段不负责继续扩内容主干，也不负责大规模 UI 补完。重点是把已有剧情配置与轻量表达，转成可重复运行的验证脚本、对比报告和人工 playtest checklist，让最终结论不再停留在“看起来应该不错”。

## 2. Goals

- 为三条样本线建立固定 seed 的 0-40 仿真验证口径
- 为三条样本线建立玩家可读性与可复述性的人工 checklist
- 证明三条线之间存在清晰差异，而不只是内部 flag 不同
- 形成最终 closure 规则，支撑后续是否继续扩样本线

## 3. User Stories

### US-001: Define The Validation Contract For The Three Sample Lines
**Description:** As a maintainer, I want an explicit validation contract for the three sample lines so that closure is judged against a stable bar instead of taste alone.

**Acceptance Criteria:**
- [ ] 定义三条样本线的 pass / warning / fail 口径
- [ ] 定义仿真证据与人工证据的最低组合
- [ ] 明确 gate pass 不是唯一 closure 信号
- [ ] 将 contract 保存到 `docs/test-reports/`

### US-002: Define Fixed Seed Replay Coverage For Orthodox Martial
**Description:** As a tester, I want a fixed seed replay plan for the orthodox line so that its 0-40 sample can be rechecked consistently after later changes.

**Acceptance Criteria:**
- [ ] 定义正派武道的固定 seed 与关键检查年龄
- [ ] 定义应出现的关键节点与身份信号
- [ ] 定义应出现的代价或回流信号
- [ ] 将 replay 规格写入 PRD

### US-003: Define Fixed Seed Replay Coverage For Demonic Edge
**Description:** As a tester, I want a fixed seed replay plan for the demonic line so that temptation, gain, and backlash can be rechecked consistently after later changes.

**Acceptance Criteria:**
- [ ] 定义邪路偏锋的固定 seed 与关键检查年龄
- [ ] 定义应出现的关键节点与身份信号
- [ ] 定义应出现的代价或回流信号
- [ ] 将 replay 规格写入 PRD

### US-004: Define Fixed Seed Replay Coverage For Merchant Rise
**Description:** As a tester, I want a fixed seed replay plan for the merchant line so that its business-growth and obligation arc can be rechecked consistently after later changes.

**Acceptance Criteria:**
- [ ] 定义商路崛起的固定 seed 与关键检查年龄
- [ ] 定义应出现的关键节点与身份信号
- [ ] 定义应出现的代价或回流信号
- [ ] 将 replay 规格写入 PRD

### US-005: Define Cross-Line Comparison Dimensions
**Description:** As a maintainer, I want explicit comparison dimensions across the three lines so that validation focuses on readable life differences rather than hidden implementation differences.

**Acceptance Criteria:**
- [ ] 定义三条线的对比维度：目标、代价、身份总结、继续意愿、重开意愿
- [ ] 每个维度都有明确判定方式
- [ ] 对比维度写入 PRD
- [ ] 不在本故事中新增实现

### US-006: Define Human Playtest Checklist
**Description:** As a maintainer, I want a bounded human playtest checklist so that “好不好玩”有最小人工证据，而不是只靠自动化结论。

**Acceptance Criteria:**
- [ ] 定义一次游玩后的复述问题
- [ ] 定义继续意愿检查项
- [ ] 定义关键转折记忆检查项
- [ ] 定义重开另一条线的意愿检查项
- [ ] 将 checklist 保存到 `docs/test-reports/` 或 PRD

### US-007: Split Replay Harness Work Into Small Tasks
**Description:** As an implementer, I want replay-harness work split into small tasks so validation tooling can be added incrementally and rechecked often.

**Acceptance Criteria:**
- [ ] 将固定 seed matrix 定义拆成独立小任务
- [ ] 将 checkpoint 输出拆成独立小任务
- [ ] 将差异报告输出拆成独立小任务
- [ ] 每个任务都能单次迭代完成

### US-008: Split Human-Facing Report Work Into Small Tasks
**Description:** As an implementer, I want report and checklist work split into small tasks so human-verification artifacts can be produced without bundling too many concerns together.

**Acceptance Criteria:**
- [ ] 将 replay latest 报告拆成独立小任务
- [ ] 将 cross-line 比较报告拆成独立小任务
- [ ] 将人工 checklist 报告拆成独立小任务
- [ ] 每个任务都能单次迭代完成

### US-009: Define Final Closure Evidence
**Description:** As a maintainer, I want explicit final closure evidence so the project can say whether the three minimum playable life samples are actually ready to serve as the next experience baseline.

**Acceptance Criteria:**
- [ ] 定义最终 closure 需要的脚本输出
- [ ] 定义最终 closure 需要的人工证据
- [ ] 定义仍然属于 warning 但可接受的残余问题
- [ ] 定义必须阻塞 closure 的失败类型
- [ ] 将 closure 规则写入 PRD

## 4. Functional Requirements

1. FR-1: 本阶段必须为三条样本线定义固定 seed replay 验证口径。
2. FR-2: 本阶段必须定义 cross-line 对比维度，且维度面向玩家可读差异。
3. FR-3: 本阶段必须定义人工 playtest checklist，覆盖复述、代价感知、关键转折、继续意愿、重开意愿。
4. FR-4: 所有验证工具与报告任务都必须拆成单次迭代可完成的小任务。
5. FR-5: 最终 closure 必须同时依赖仿真证据与人工证据。

## 5. Non-Goals

- 不继续扩大新的剧情主干
- 不在本阶段做 runtime 平台化
- 不做全量路线矩阵验证
- 不把自动化结果直接等同于“好玩”
- 不在本阶段扩成更高年龄段的全生命周期覆盖

## 6. Design Considerations

- replay 输出要足够紧凑，便于长期回归
- human checklist 要足够短，能低成本重复执行
- 比较维度应围绕玩家能记住的东西，而不是维护者才懂的内部术语
- closure 要允许少量 residual warning，但不能接受三条线体感趋同

## 7. Technical Considerations

- 预期复用现有 P45 trajectory replay 和 life-memory 派生思路
- 预期新增内容主要在 `scripts/`、`tests/`、`docs/test-reports/`
- 固定 seed 检查应尽量采用现有 simulator / replay surface

## 8. Success Metrics

- 三条线都有固定 seed replay 规格
- cross-line comparison 维度清晰且可复用
- 人工 playtest checklist 成本低且信息密度高
- 最终 closure 规则能明确判断是否达到“最小可玩人生样本线”基线

## 9. Open Questions

- 三条线是否都应强制使用单一 seed，还是允许每条线各自有 1-2 个基准 seed
- 人工 checklist 是否要区分首次体验与二次重开体验
- 最终 closure 是否需要单独的“弱样本分类”附录

