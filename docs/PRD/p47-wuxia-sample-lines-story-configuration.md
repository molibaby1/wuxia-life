# PRD: P47 Wuxia Sample Lines Story Configuration

## 1. Introduction

P47 是三条最小可玩人生样本线的第一执行阶段，目标不是“把所有内容做全”，而是先把三条线的 0-40 岁剧情骨架、关键节点、关键选择、代价回流、身份收束明确落在现有内容配置承载面上。

本阶段只处理剧情配置层，不先做大规模展示补齐，不先做验证平台扩写。重点是确保三条线都能回答同一个玩家问题：

- 我这一生想成为什么人？
- 我为了它要持续做什么？
- 我会为此失去什么？
- 到 40 岁时，我能不能明显看出这条人生和别条不同？

## 2. Goals

- 为正派武道、邪路偏锋、商路崛起三条样本线定义 0-40 岁章节骨架
- 为每条样本线补齐最小关键节点、关键选择、代价回流和 40 岁身份总结钩子
- 将工作限制在现有内容配置和 route/flag/routePoint 承载面内
- 为后续轻量展示和验证阶段提供稳定输入

## 3. User Stories

### US-001: Audit Existing Content Anchors For The Three Sample Lines
**Description:** As a content planner, I want a focused gap audit of existing orthodox, demonic, and merchant anchors so that P47 extends real repo content instead of inventing disconnected new arcs.

**Acceptance Criteria:**
- [ ] 盘点现有正派武道、邪路偏锋、商路相关内容锚点
- [ ] 标出哪些节点已存在，哪些节点缺失
- [ ] 将 gap audit 保存到 `docs/test-reports/`
- [ ] 本故事不改 gameplay 行为

### US-002: Define The 0-40 Chapter Spine For Orthodox Martial
**Description:** As a designer, I want an explicit chapter spine for the orthodox martial sample so that later event work serves one coherent life arc instead of scattered martial content.

**Acceptance Criteria:**
- [ ] 定义正派武道在童年、少年、青年、中年前的章节目标
- [ ] 明确至少 5 个关键节点
- [ ] 明确至少 2 个关键选择
- [ ] 明确至少 1 个守正代价或失败回流节点
- [ ] 将 spine 规格写入文档

### US-003: Define The 0-40 Chapter Spine For Demonic Edge
**Description:** As a designer, I want an explicit chapter spine for the demonic edge sample so that the route reads as temptation, gain, and cost rather than flat evil-stat growth.

**Acceptance Criteria:**
- [ ] 定义邪路偏锋在童年、少年、青年、中年前的章节目标
- [ ] 明确至少 5 个关键节点
- [ ] 明确至少 2 个关键选择
- [ ] 明确至少 1 个收益后的代价回流节点
- [ ] 将 spine 规格写入文档

### US-004: Define The 0-40 Chapter Spine For Merchant Rise
**Description:** As a designer, I want an explicit chapter spine for the merchant rise sample so that the route reads as ambition, leverage, and obligation instead of only money gain.

**Acceptance Criteria:**
- [ ] 定义商路崛起在童年、少年、青年、中年前的章节目标
- [ ] 明确至少 5 个关键节点
- [ ] 明确至少 2 个关键选择
- [ ] 明确至少 1 个财富/义气或债务/人情回流节点
- [ ] 将 spine 规格写入文档

### US-005: Specify Orthodox Childhood And Youth Configuration Work
**Description:** As an implementer, I want orthodox early-life work split into small tasks so that story configuration can be delivered incrementally instead of as one broad content rewrite.

**Acceptance Criteria:**
- [ ] 将正派武道的童年种子拆成独立小任务
- [ ] 将少年首次被认可节点拆成独立小任务
- [ ] 将青年入门/立志节点拆成独立小任务
- [ ] 每个小任务都能单次迭代完成

### US-006: Specify Demonic Childhood And Youth Configuration Work
**Description:** As an implementer, I want demonic early-life work split into small tasks so that the corruption arc can be built stepwise and validated locally.

**Acceptance Criteria:**
- [ ] 将邪路偏锋的童年偏执/狠劲种子拆成独立小任务
- [ ] 将少年第一次越界节点拆成独立小任务
- [ ] 将青年高收益诱惑节点拆成独立小任务
- [ ] 每个小任务都能单次迭代完成

### US-007: Specify Merchant Childhood And Youth Configuration Work
**Description:** As an implementer, I want merchant early-life work split into small tasks so that the livelihood arc can be expanded through bounded story slices.

**Acceptance Criteria:**
- [ ] 将商路崛起的童年营商种子拆成独立小任务
- [ ] 将少年第一桶金节点拆成独立小任务
- [ ] 将青年商队/投资分岔拆成独立小任务
- [ ] 每个小任务都能单次迭代完成

### US-008: Specify Midlife Cost And Identity Hooks For All Three Lines
**Description:** As a planner, I want the shared midlife-cost and identity-hook work split clearly so later implementation does not stop at youth growth spikes without lifetime consequence.

**Acceptance Criteria:**
- [ ] 为正派武道定义中年守正代价钩子
- [ ] 为邪路偏锋定义中年名声/关系/健康代价钩子
- [ ] 为商路崛起定义中年财富/义气冲突钩子
- [ ] 为三条线分别定义 40 岁身份总结钩子

### US-009: Define RoutePoint And Flag Wiring Requirements
**Description:** As a developer, I want explicit routePoint and flag wiring requirements so that content implementation stays compatible with the current runtime instead of drifting into hidden assumptions.

**Acceptance Criteria:**
- [ ] 为三条样本线定义必须写入的关键 flags
- [ ] 为三条样本线定义关键 routePoints 或同级承载点
- [ ] 标明哪些节点应使用 `mainline` / `mandatory` / `once` 保护
- [ ] 将 wiring 要求写入 PRD

### US-010: Define P47 Closure Evidence
**Description:** As a maintainer, I want explicit closure evidence for the configuration stage so later phases know the story spine is stable enough to build on.

**Acceptance Criteria:**
- [ ] 定义 P47 的配置阶段收口证据
- [ ] 明确需要产出的文档或报告
- [ ] 明确未完成哪些内容不能进入后续阶段
- [ ] 将 closure 规则写入 PRD

## 4. Functional Requirements

1. FR-1: 三条样本线都必须有 0-40 岁章节骨架。
2. FR-2: 每条样本线都必须至少定义 5 个关键节点、2 个关键选择、1 个代价回流、1 个 40 岁总结钩子。
3. FR-3: 配置工作必须优先复用现有 `route_orthodox`、`route_demonic`、merchant 相关承载面。
4. FR-4: 配置工作必须明确关键 flags、routePoints 与节点保护标签。
5. FR-5: 所有实施故事必须足够小，能在单次迭代中完成。

## 5. Non-Goals

- 不在本阶段做主界面或 summary 层的大改
- 不在本阶段做新的 runtime 通用框架
- 不做三条线之外的新路线样本
- 不做全量事件池补写
- 不在本阶段宣称玩家已能完整读懂三条线

## 6. Design Considerations

- 正派武道应突出“守正的代价”，而不只是练功升级
- 邪路偏锋应突出“诱惑与反噬”，而不是单调黑化
- 商路崛起应突出“财富带来的选择权与债务”，而不是纯金钱膨胀
- 三条线都要能被玩家复述成一条人生故事，而不是一串离散事件

## 7. Technical Considerations

- 预期主要落点为 `src/data/lines/` 内既有 route/identity/merchant/demon/sect 相关内容文件
- 现有内容需要的新增应优先采用配置扩写，而非共享 runtime 抽象
- 若执行中发现关键节点无法稳定承载，再在后续单独立案

## 8. Success Metrics

- 三条线都具备书面章节 spine
- 三条线都完成小故事级别拆解
- 所有关键 flags / routePoints / protection tags 要求明确
- 后续执行者无需再重新设计三条线主干

## 9. Open Questions

- 正派武道是否要在第一轮直接绑定某一门派中年节点，还是先保持更宽泛的正道身份
- 邪路线第一轮是否要显式区分“保留底线”与“彻底沉沦”两种分支
- 商路线第一轮是否优先强调商队经营还是投资布局

