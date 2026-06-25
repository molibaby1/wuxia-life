# PRD: P48 Wuxia Sample Lines Player-Facing Expression

## 1. Introduction

P48 是三条最小可玩人生样本线的第二执行阶段。它不负责继续扩剧情主干，而是把 P47 已经定义好的关键目标、长期代价、身份变化，转化成玩家能读懂的轻量表达。

这个阶段的原则是“轻量补齐，不做大 UI 重构”。重点是复用现有主界面 summary、life-memory、route signal、长期影响文案等表达面，让玩家在 0-40 岁内更稳定地知道：

- 我当前正在塑造成为什么样的人
- 我刚才的选择在推动哪条人生方向
- 我正在背上什么债、树什么敌、抓住什么机会
- 到 40 岁时，这条人生为何能和别条区分开

## 2. Goals

- 为三条样本线补齐最小玩家可读表达
- 将剧情关键节点转成 summary / route signal / long-term impact 可见信息
- 避免新增复杂面板或独立新系统
- 为后续人工 playtest 提供明确的玩家可感知信号

## 3. User Stories

### US-001: Audit Existing Player-Facing Surfaces For The Three Sample Lines
**Description:** As a maintainer, I want a focused audit of current player-facing expression surfaces so that P48 fills the real readability gaps instead of adding parallel presentation layers.

**Acceptance Criteria:**
- [ ] 盘点主界面 summary、life-memory、route signal、长期影响文案等现有表达面
- [ ] 标出三条样本线在这些表达面上的现有覆盖与缺口
- [ ] 将 audit 保存到 `docs/test-reports/`
- [ ] 本故事不改 gameplay 行为

### US-002: Define Orthodox Martial Summary Expression Tasks
**Description:** As a planner, I want the orthodox line’s player-facing expression decomposed into small tasks so that implementation can strengthen readability without broad UI redesign.

**Acceptance Criteria:**
- [ ] 拆出正派武道的当前追求表达小任务
- [ ] 拆出守正代价表达小任务
- [ ] 拆出 40 岁身份总结表达小任务
- [ ] 每个任务都能单次迭代完成

### US-003: Define Demonic Edge Summary Expression Tasks
**Description:** As a planner, I want the demonic line’s player-facing expression decomposed into small tasks so that temptation and backlash become legible without adding a new evil dashboard.

**Acceptance Criteria:**
- [ ] 拆出邪路偏锋的诱惑表达小任务
- [ ] 拆出越界后代价表达小任务
- [ ] 拆出 40 岁身份总结表达小任务
- [ ] 每个任务都能单次迭代完成

### US-004: Define Merchant Rise Summary Expression Tasks
**Description:** As a planner, I want the merchant line’s player-facing expression decomposed into small tasks so that wealth, leverage, and obligation become legible without business-specific UI expansion.

**Acceptance Criteria:**
- [ ] 拆出商路崛起的当前追求表达小任务
- [ ] 拆出债务/义气/风险表达小任务
- [ ] 拆出 40 岁身份总结表达小任务
- [ ] 每个任务都能单次迭代完成

### US-005: Define Cross-Line Current-Goal Expression Rules
**Description:** As a player, I want to know what my current life direction is so that I can intentionally continue or pivot the sample line I am building.

**Acceptance Criteria:**
- [ ] 定义三条线共享的“当前追求”表达规则
- [ ] 规则不暴露原始内部 key
- [ ] 规则能在样本线尚未完全成形时优雅降级
- [ ] 将规则写入 PRD

### US-006: Define Cross-Line Cost And Fallout Expression Rules
**Description:** As a player, I want important costs and fallout to feel like real consequences so that sample-line choices do not read as bookkeeping only.

**Acceptance Criteria:**
- [ ] 定义三条线共享的“长期代价/后果”表达规则
- [ ] 规则至少覆盖债、敌、机会、名声、牺牲中的若干类型
- [ ] 规则优先复用现有长期影响表达面
- [ ] 将规则写入 PRD

### US-007: Define Age-40 Identity Summary Rules
**Description:** As a player, I want age-40 summary language to clearly tell me what kind of person I became so that each sample line lands as a memorable life type.

**Acceptance Criteria:**
- [ ] 为三条线分别定义 40 岁身份总结规则
- [ ] 每条线总结都必须能和其核心目标、代价来源对上
- [ ] 三条线总结文风保持统一但内容区分明显
- [ ] 将规则写入 PRD

### US-008: Define Lightweight Surface Mapping
**Description:** As a developer, I want explicit mapping from each required expression to existing surfaces so implementation stays narrow and avoids accidental UX expansion.

**Acceptance Criteria:**
- [ ] 明确哪些信息落在 main screen summary
- [ ] 明确哪些信息落在 long-term impact / route signal
- [ ] 明确哪些信息落在 life-memory / age-40 summary
- [ ] 标明哪些需求本阶段不做

### US-009: Define P48 Closure Evidence
**Description:** As a maintainer, I want explicit closure evidence for the player-facing expression stage so later validation work knows what should already be visible to a human tester.

**Acceptance Criteria:**
- [ ] 定义 P48 的玩家可读阶段收口证据
- [ ] 定义最小人工检查项
- [ ] 定义哪些表达缺口会阻塞进入 P49
- [ ] 将 closure 规则写入 PRD

## 4. Functional Requirements

1. FR-1: 本阶段必须只做轻量玩家可见表达补齐，不新增复杂面板。
2. FR-2: 三条样本线都必须有“当前追求”“长期代价/后果”“40 岁身份总结”三类表达要求。
3. FR-3: 表达规则必须优先复用现有 summary、route signal、life-memory、长期影响承载面。
4. FR-4: 表达内容必须使用玩家可读语言，而不是内部 state key。
5. FR-5: 所有实施故事都必须拆到单次迭代可完成。

## 5. Non-Goals

- 不做全新 UI 页面
- 不做复杂信息架构重构
- 不新增独立人生追踪面板
- 不在本阶段大规模补剧情配置
- 不在本阶段宣称验证已经完成

## 6. Design Considerations

- 正派线表达应突出“守住什么”与“放弃什么”
- 邪路线表达应突出“得到了什么”与“开始失去什么”
- 商路线表达应突出“掌握了什么机会”与“背上了什么关系负担”
- 所有表达都应帮助人工测试者复述人生线，而不是读到抽象标签

## 7. Technical Considerations

- 预期主要承载面为 `mainScreenModel`、life-memory summary、route signal 与现有长期影响文本生成逻辑
- 文案映射应尽量通过已有字段扩展完成
- 仅在现有表达面完全承载不了时，才考虑额外轻量字段

## 8. Success Metrics

- 三条线都拥有清晰的表达任务拆分
- 当前追求、长期代价、40 岁总结三类表达均有明确落点
- 后续人工测试者可以根据文档检查玩家是否读懂样本线
- 无需大 UI 改动即可支撑最小玩家可读性

## 9. Open Questions

- 当前追求是否需要更偏“叙事句”而不是“方向标签”
- 邪路线代价表达应更偏名声、关系还是身体反噬
- 商路线 40 岁总结是否要强调“商人”还是“商路主导下的江湖人”

