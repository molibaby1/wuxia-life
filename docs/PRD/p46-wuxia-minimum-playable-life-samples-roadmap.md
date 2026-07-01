# PRD: P46 Wuxia Minimum Playable Life Samples Roadmap

## 1. Introduction

P45 已经在 bounded replay matrix 内证明：`wuxia-life` 现有长期塑形机制可以稳定把不同 persona 推向不同的成长方向。下一步的核心问题不再是“机制是否成立”，而是“玩家是否能明显感到自己正在经历一条值得继续点下去的武侠人生线”。

本阶段不再继续扩大 P45 量化验证面，也不先做 runtime 平台化。目标是把已经成立的底层机制，收束成三条 0-40 岁、玩家可感知、可复述、可验证的最小可玩人生样本线：

- 正派武道
- 邪路偏锋
- 商路崛起

为了避免再次退回“大而全系统改造”或“泛化内容扩写”，本路线图把工作拆成三个执行阶段：

1. 剧情配置骨架与关键节点
2. 轻量展示补齐与玩家可读表达
3. 验证脚本与人工 playtest 收口

## 2. Goals

- 将已验证的长期塑形机制转化为三条玩家可感知的 0-40 岁人生样本线
- 确保每条样本线至少包含目标、诱惑/抉择、代价回流、身份收束四类体验要素
- 将工作严格限制在剧情配置、轻量展示、验证脚本三类范围内
- 为后续实施提供多个阶段化 PRD 与小故事拆分，便于按顺序执行与验收
- 保持现有 runtime 能力复用优先，避免先行平台化

### Stage PRD Index

本路线图拆为三个可独立审批、独立收口的阶段 PRD。依赖顺序为 P47 → P48 → P49（详见 §11 Phase Handoff Rules）。

| 阶段 | PRD 路径 | 一句话职责 |
|------|----------|------------|
| 阶段一：剧情配置 | `docs/PRD/p47-wuxia-sample-lines-story-configuration.md` | 定义三条样本线 0–40 岁 spine、关键节点、选择与 flag/routePoint 骨架 |
| 阶段二：轻量展示 | `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md` | 将 P47 剧情关键信息映射为玩家可读的 summary / route signal / life-memory 表达 |
| 阶段三：验证收口 | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md` | 固定 seed 仿真 + 人工 playtest checklist，对三条样本线做最终 closure |

## 3. User Stories

### US-001: Define The Three-Line Scope Contract
**Description:** As a maintainer, I want an explicit scope contract for the three minimum playable life samples so that later implementation does not expand back into full-system rebuilding.

**Acceptance Criteria:**
- [x] 明确本阶段仅覆盖 `正派武道`、`邪路偏锋`、`商路崛起` 三条 0-40 岁样本线
- [x] 明确本阶段只允许三类工作：剧情配置、轻量展示补齐、验证脚本
- [x] 明确 runtime 平台化、全量路线覆盖、全量事件池扩写均为非目标
- [x] 将范围与边界写入本 PRD

### US-002: Split The Roadmap Into Executable Stages
**Description:** As a planner, I want the roadmap decomposed into multiple implementation-ready phases so that execution can proceed in bounded iterations instead of one oversized wave.

**Acceptance Criteria:**
- [x] 将路线图拆为 3 个阶段 PRD
- [x] 每个阶段有独立目标、非目标、故事列表与验收方式
- [x] 每个阶段都能单独审批和单独收口
- [x] 阶段之间的依赖顺序在文档中明确

### US-003: Define Cross-Stage Sample-Line Quality Bar
**Description:** As a maintainer, I want one shared quality bar for all three sample lines so that stage-level work does not drift into inconsistent interpretations of “minimum playable”.

**Acceptance Criteria:**
- [x] 定义每条样本线的最低体验要求：关键节点、关键选择、代价回流、中期身份信号、40 岁总结
- [x] 定义 shared 验收口径，供后续阶段复用
- [x] 明确 gate pass 不是本阶段唯一验收方式
- [x] 将 shared quality bar 写入本 PRD

### US-004: Define Phase Handoff Rules
**Description:** As a planner, I want explicit phase handoff rules so that later sessions know when to move from configuration to display and then to validation.

**Acceptance Criteria:**
- [x] 明确阶段一完成前，不进入大规模展示补齐
- [x] 明确阶段二完成前，不宣称三条样本线已经玩家可读
- [x] 明确阶段三必须包含仿真证据与人工 checklist
- [x] 将 handoff rules 写入本 PRD

## 4. Functional Requirements

1. FR-1: 本路线图必须只覆盖三条 0-40 岁最小可玩人生样本线。
2. FR-2: 本路线图必须把工作拆分为剧情配置、轻量展示补齐、验证脚本三个阶段。
3. FR-3: 每个阶段必须能独立形成 PRD 与 `prd.json`，并包含可单次迭代完成的小故事。
4. FR-4: 路线图必须定义 shared 质量门槛，避免不同阶段对“可玩”理解不一致。
5. FR-5: 路线图必须明确 runtime 平台化和全量系统重构不属于本阶段。

## 5. Non-Goals

- 不在本 PRD 中直接定义实现细节代码改动
- 不扩展为所有路线、所有结局、所有年龄段的全量覆盖
- 不做全量人生模拟架构升级
- 不做全量事件池扩写 / whole-pool expansion
- 不先做独立 runtime 编排平台
- 不把所有历史体验问题都塞进这一轮

## 6. Design Considerations

- 优先复用现有 `route_orthodox`、`route_demonic`、merchant 相关内容承载面
- 优先复用现有 `life memory`、`route signal`、主界面 summary 表达面
- 三条样本线应体现不同的人生欲望、不同的代价来源、不同的 40 岁总结

## 7. Technical Considerations

- 阶段一主要落在 `src/data/lines/` 及相关内容文档（对应 P47，见 §2 Stage PRD Index）
- 阶段二主要落在玩家可见 summary / life-memory / route signal 表达面（对应 P48）
- 阶段三主要落在 `scripts/`、`tests/`、`docs/test-reports/`（对应 P49）
- 阶段依赖顺序与交接门槛见 §11 Phase Handoff Rules
- 若后续执行发现 mandatory/mainline 无法支撑关键节点稳定触发，再单独立案讨论 runtime

## 8. Success Metrics

- 成功拆出 3 个执行阶段 PRD，且边界清晰
- 每个阶段的 story 都能在单次迭代中完成
- 三条样本线的 shared quality bar 被明确定义
- 后续执行无需再重新讨论“先做什么、哪些不做”

## 9. Open Questions

- 正派武道是否需要在阶段一就纳入门派中年代价节点的最小表达，还是先只立青年前后的 spine
- 邪路偏锋的“底线型邪路”与“彻底越界型邪路”是否在第一轮就要同时覆盖
- 商路崛起的中年冲突是先偏“债务/人情”，还是先偏“财富/义气”

## 10. Shared Sample-Line Quality Bar

本章节定义跨三条样本线（正派武道 / 邪路偏锋 / 商路崛起）共享的最低可玩质量门槛，供 P47、P48、P49 复用，避免各阶段对“minimum playable”理解漂移。

### 10.1 每条样本线最低体验要素（0–40 岁）

以下要求对三条样本线均适用：

| 要素 | 最低要求 |
|------|----------|
| 关键节点 | 至少 5 个，覆盖童年→少年→青年→中年前→40 岁收束 |
| 关键选择 | 至少 2 个，玩家能感到“选 A 与选 B 会推动不同人生方向” |
| 代价 / 失败回流 | 至少 1 个，选择或路径有可感知的损失、回流或不可逆后果 |
| 中期身份信号 | 至少 1 个玩家可感知信号（route signal、identity、life-memory 等），表明“我正在成为某类人” |
| 40 岁总结钩子 | 40 岁前有可辨认的身份总结，玩家能复述“这条人生为什么不同” |

### 10.2 Shared 验收口径（P47 / P48 / P49 复用）

**仿真证据最低组合：**

- 固定 seed 下，每条样本线的关键节点稳定出现
- 关键 flag 写入后，后续事件条件能续上（路线节点不断链）
- 路线身份不被无关事件覆盖；同年龄段无明显低影响空窗或复读
- 三条样本线之间具备可读差异（非仅内部 flag 不同）

**人工证据最低组合：**

- 玩家是否知道自己当前追求什么
- 玩家是否感到选择有代价
- 玩家是否记得一个关键转折
- 玩家是否愿意继续到下一个阶段
- 玩家是否愿意重开另一条路线

**Closure 信号说明：** gate pass / 自动化 gate 不是 closure 的唯一信号。最终收口必须同时参考仿真证据与人工 playtest 证据；仅凭 gate PASS 不得宣称“最小可玩已达成”或“三条样本线已玩家可读”。

### 10.3 三条线差异要求

三条样本线共享上述最低门槛，但必须在体验上可区分（参见 §6 Design Considerations）：

| 样本线 | 人生欲望 | 代价来源 | 40 岁总结方向 |
|--------|----------|----------|---------------|
| 正派武道 | 成为被门派/江湖认可的正派武者 | 守正、放弃捷径、门派/江湖义务 | 清晰正派武道身份，能说出“为何走正道、放弃了什么” |
| 邪路偏锋 | 以诱惑与风险换取力量或收益 | 名声、关系、健康、社会反噬 | 邪路身份总结，能感到“被选择与后果推向邪路” |
| 商路崛起 | 以小本经营积累财富与人脉 | 债务、人情、江湖义气冲突 | 商路身份总结，能感到“财富带来选择权也带来风险” |

## 11. Phase Handoff Rules

本章节明确三阶段交接规则，使后续会话无需自行推断“何时从配置进入展示、何时进入验证收口”。

### 11.1 阶段一（P47）收口前：不得启动 P48 大规模展示补齐

P47（`docs/PRD/p47-wuxia-sample-lines-story-configuration.md`）未收口前，不得启动 P48 的大规模玩家可见表达补齐。

**P47 最低收口证据类型：**

- 三条样本线各自的 0–40 岁 chapter spine 文档（含关键节点、关键选择、代价回流、40 岁钩子）
- 针对现有内容的 gap audit（标出已存在锚点与缺失节点）
- 关键 flag / routePoints 写入要求与续链条件说明
- 上述证据可指向 P47 PRD 具体 story 产出，但 P46 交接规则以“spine + audit + flag 续链”三类证据齐备为门槛

### 11.2 阶段二（P48）收口前：不得宣称样本线已玩家可读

P48（`docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md`）未收口前，不得宣称“三条样本线已玩家可读”或“最小可玩人生样本已达成”。

P48 收口意味着：P47 定义的关键目标、长期代价、身份变化已通过 summary / route signal / life-memory 等轻量表达面可被玩家感知；该结论仍须待 P49 仿真 + 人工证据验证。

### 11.3 阶段三（P49）：仿真 + 人工 checklist 方可 closure

P49（`docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md`）必须同时包含：

- **仿真证据：** 固定 seed 0–40 岁跑通，关键节点与 flag 续链符合 §10.2
- **人工 playtest checklist：** 覆盖 §10.2 人工证据五项

仅当上述两类证据齐备，方可对整个 P46 路线（三条最小可玩人生样本线）做最终 closure。

**Closure status (2026-06-26, P51):** P49 验证收口 **Pass**（RW-04 第二名 playtest 为 documented defer）。详见 `docs/test-reports/p49-sample-lines-closure-report.md`。

### 11.4 阶段依赖顺序

| 顺序 | 阶段 | PRD 文件 | 前置条件 |
|------|------|----------|----------|
| 1 | 剧情配置 | `docs/PRD/p47-wuxia-sample-lines-story-configuration.md` | P46 路线图审批 |
| 2 | 轻量展示 | `docs/PRD/p48-wuxia-sample-lines-player-facing-expression.md` | P47 收口（§11.1） |
| 3 | 验证收口 | `docs/PRD/p49-wuxia-sample-lines-validation-and-playtest.md` | P48 收口（§11.2） |

每个阶段 PRD 含独立目标、非目标、user stories 与验收方式，可单独审批、单独收口；阶段间仅按上表顺序推进，不得跳步宣称 closure。

