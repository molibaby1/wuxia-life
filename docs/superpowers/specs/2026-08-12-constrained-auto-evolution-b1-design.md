# 受约束自动进化系统：B1 真实配置评估设计

状态：**历史设计。B1.0 已于 2026-08-12 人工 accepted 并关闭；B1.1 已 superseded，不得按本文继续授权实现。**

> 迁移说明（2026-08-13）：本文保留 B1.0 的历史设计语义。原 B1.1 的 deterministic scope、role isolation、holdout/red-team 等思想由 `docs/superpowers/proposals/2026-08-12-llm-driven-auto-evolution/` 重新定位；原“机械指标主优化向量 + Pareto/holdout 严格改善”不再是当前方向。下一候选只允许 Phase 0/1 successor design，编码需另行授权。

前置条件：B0 护栏校准已由人工 accept 关闭。B0 的最终依据为
`.tmp/b0/b0-status-20260812085143/`。B0 通过不等于 B1 已授权发布，也不等于正式事件配置已经改变。

## 1. 目标与边界

### 1.1 B1 首轮目标

B1 首轮只验证一件事：

> 对已有事件的少量 `weight` 配置进行受限候选调整，候选能够在真实 Headless 调度中运行，并在相同 persona、seed 和 engine 版本下改善节奏与重复指标，同时不破坏关键剧情覆盖和既有硬门禁。

首轮不试图证明大模型能够独立完成产品设计，也不把候选自动写回正式配置。

### 1.2 非目标

B1 首轮不负责：

- 新增、删除或重写事件；
- 修改事件正文、标题、选择、条件、触发器、效果、依赖、年龄窗口或 `priority`；
- 修改 `PlayerState`、`GameState`、Snapshot、Contract、Schema 或存档版本；
- 修改 Local、API、Browser 的正式事件目录；
- 修改 P0/P1/P8/P9 或其他正式门禁的阈值和 verdict 语义；
- 自动合入、自动发布或自动修改 `src/data/**`；
- 用 headless 指标替代真人或 Browser 体验校准；
- 把训练集改善当作 holdout 改善；
- 进入其他题材、world pack 或通用叙事引擎建设。

## 2. 两阶段结构

B1 分为两个必须按顺序完成的阶段。B1.0 未通过时，不得进入 B1.1。

```text
B1.0 Headless-only Catalog 注入
  → 人工确认真实 candidate 调度已接通
  → B1.1 受限 weight 候选搜索
```

### 2.1 B1.0：Headless-only Catalog 注入

B1.0 只建设隔离的运行时 catalog 边界，并证明：

```text
baseline catalog → baseline trace
candidate overlay → candidate trace
```

两条路径使用相同 persona、seed、endAge 和 engine/source hash，candidate overlay 必须真实参与 Headless 的事件筛选、权重计算、即时事件查询和历史事件分类。

默认运行行为保持不变：

- 不传入候选 catalog 的 Headless、Local、API、Browser 继续使用当前正式事件目录；
- 正式 `EventLoader` singleton 不被替换、猴补或写入；
- candidate 只存在于 session 实例、独立运行进程或 `.tmp/b1/<runId>/` artifact；
- 如果 B1.0 发现进程内全局状态会污染 baseline/candidate，则必须将两个 arm 放入独立子进程；不得通过共享 singleton 或恢复全局状态来规避问题。

B1.0 的成功只表示注入边界真实接通，不授权候选生成、候选接受或正式配置发布。

### 2.2 B1.1：受限 weight 候选搜索

B1.1 只有在 B1.0 通过并单独收口后才可执行：

1. 大模型输出结构化候选意图；
2. 确定性控制器验证意图并生成 immutable weight overlay；
3. baseline、train、holdout 和 adversarial 按冻结 manifest 执行；
4. 机械指标、可见 Trace 盲评和 red-team 分别审查；
5. Pareto 规则筛选候选；
6. 人工决定 `accepted`、`rejected` 或 `blocked`；
7. `accepted` 只接受 artifact，不改变正式事件目录；
8. 发布必须是另一个显式、人工授权的动作。

## 3. B1.0 Runtime Event Catalog 契约

### 3.1 运行时接口

Headless 使用的 engine 必须接收一个实例级、只读的 catalog source。最小接口为：

```ts
interface RuntimeEventCatalog {
  getAllEvents(): readonly EventDefinition[];
  getEventsByAge(age: number): EventDefinition[];
  getEventById(id: string): EventDefinition | undefined;
  getWeightForAge(event: EventDefinition, age: number): number;
}
```

默认实现包装当前正式 `EventLoader`。candidate 实现基于正式目录的深拷贝和 immutable weight patch，不得改变原始事件对象。

### 3.2 统一读取边界

以下读取必须使用同一个实例级 catalog：

- 按年龄获取候选事件；
- 按年龄读取事件权重；
- 通过 event ID 读取历史事件定义；
- 读取全部事件以寻找即时反馈事件；
- Headless runner 的 mandatory/mainline 判断；
- Headless runner 的历史回填和事件分类；
- 任何用于 candidate 指标、Trace 或可见投影的事件定义查询。

不能出现“调度使用 candidate、指标分类使用 baseline”或“session 有 candidate、runner 仍读取全局 loader”的混合路径。

### 3.3 默认路径兼容

- `GameEngineIntegration` 不传 catalog 时，行为与当前正式目录一致；
- Local/API/Browser 不暴露 candidate catalog 参数；
- Snapshot metadata 中不新增候选 patch、overlay 或运行态配置；
- 正式 catalog version、Snapshot version 和 API Contract 不变；
- B1.0 必须包含默认 catalog parity 测试，证明注入边界未改变正式 Headless 结果。

## 4. Weight Overlay 契约

### 4.1 数据结构

```ts
type WeightOverlay = {
  schemaVersion: 'b1-weight-overlay-v1';
  baseCatalogHash: string;
  patches: Array<{
    eventId: string;
    baselineWeight: number;
    candidateWeight: number;
  }>;
};
```

每个 artifact 还必须保存：

```text
sourceFingerprint
baseCatalogHash
overlayHash
seedBundleHash
engineVersion
personaId
seed
endAge
rawTraceHash
visibleTraceHash
metricHash
```

### 4.2 白名单

首轮唯一允许的运行时修改是已有事件的 `weight`。

- 每个候选最多修改 8 个不同事件；
- `candidateWeight` 必须位于 `baselineWeight × 0.8` 到 `baselineWeight × 1.2`；
- `candidateWeight` 不得小于 1；
- `baselineWeight` 必须与冻结 base catalog 中的实际值一致；
- event ID 必须已经存在于 base catalog；
- patch 之外的全部事件字段必须深度一致；
- 不允许重复 event ID；
- 不允许新增、删除、重排事件数组中的定义对象。

### 4.3 禁止修改的事件与字段

以下事件不得进入 patch：

- `priority === EventPriority.CRITICAL` 的事件；
- 含 `critical`、`mandatory` 或 `mainline` tag 的事件；
- 被当前引擎识别为 mandatory/mainline/critical layer 的事件。

以下字段不得修改：

```text
id
version
category
priority
ageRange
ageWeights
triggers
conditions
triggerConditions
dependencies
thresholds
cooldown
maxTriggers
storyLine
content
eventType
endingType
choices
requirements
effects
autoEffects
metadata
```

超出白名单、超出数量或超出比例的意图必须直接标记为 `blocked`。控制器不得静默裁剪、四舍五入成合法值或替换为“最接近的安全候选”。

## 5. 候选意图与角色隔离

### 5.1 大模型输出

大模型只能输出结构化意图，不得直接写入事件文件：

```ts
type WeightPatchIntent = {
  eventId: string;
  direction: 'increase' | 'decrease';
  deltaRatio: number;
  rationale: string;
  expectedMetricEffects: string[];
};
```

`deltaRatio` 必须是有限数字；`direction`、`eventId`、`rationale` 和 `expectedMetricEffects` 缺失时拒绝。意图转换为 patch 后，控制器重新从 base catalog 校验全部白名单规则。

### 5.2 信息分层

- **Controller**：读取完整 manifest 和 sealed metadata，生成 patch、状态和 evidence index；不修改阈值。
- **Proposal agent**：读取允许公开的 train 诊断；不得读取 holdout 标签、holdout 结果或其他 reviewer 结论。
- **Simulator**：只读取 sealed base catalog、overlay、seed 和 engine；只输出 raw Trace。
- **Mechanical auditor**：读取 raw Trace 和 candidate/base catalog；不得读取盲评或 red-team 结果。
- **Blind reviewer**：只读取脱敏 player-visible Trace 和匿名 A/B；不得读取 event ID 身份映射、seed、机械 verdict 或 holdout 标签。
- **Red-team auditor**：检查越权、泄漏、污染、篡改和角色串通；拥有 veto，不修改其他角色结果。
- **Human reviewer**：查看完整 evidence、差异和冲突，决定接受或拒绝；不以多数投票替代证据。

Holdout 在 patch sealed 后才运行；候选提案和初筛不得读取 holdout Trace、指标或身份。

## 6. 评估矩阵与指标

### 6.1 样本固定

每次 B1.1 运行必须冻结：

- source fingerprint；
- base catalog hash；
- overlay hash；
- engine version；
- train/holdout/adversarial 分层；
- persona、seed 和 endAge；
- 指标实现版本和 evidence schema 版本。

baseline 与 candidate 使用相同的 persona、seed、endAge 和 engine/source hash。不得看完结果后重切 train/holdout。

### 6.2 主要优化向量

以下指标按最小化处理：

```text
adjacent_same_event_rate
adjacent_same_class_rate
short_window_same_class_rate
top_event_concentration
```

`normalized_patch_magnitude` 只用于候选之间的 Pareto 比较和同等效果下的最小改动优先，不与 baseline 的零 patch magnitude 直接进行“严格改善”比较。

### 6.3 硬性护栏

候选必须同时满足：

- train 与 holdout 的 P0 三项重复指标均不超过当前正式阈值；
- formal event ratio 与 daily event ratio 均保持在 B1 冻结范围 `[0.5, 0.9]` 与 `[0.1, 0.5]`；
- candidate 不新增正式 gate 的 blocking failure；
- 每个样本的 baseline critical/mandatory event 集合必须仍被 candidate 覆盖；
- 每个样本的 choice event 数量不得低于 baseline；
- 每个样本的 distinct storyline 覆盖数不得低于 baseline；
- candidate patch 之外的事件字段深度一致；
- source、catalog、overlay、seed、Trace 和 metric hash 链完整；
- blind package 无 hidden state、event identity、seed、arm 或 mechanical verdict 泄漏；
- red-team 无未解决 veto；
- 正式事件目录、正式 gate、tracked report、Snapshot 和 Contract 无写入。

如果 frozen baseline 自身已经触发当前正式 blocking threshold，B1.1 不得用候选“修复并晋级”该 baseline；本次运行应标记为 `blocked`，先重新裁决 baseline。

### 6.4 非回归容差

B1 首轮使用确定性同 seed 模拟，不引入统计抽样噪声，因此主要指标的 baseline 非回归容差为零，比较时只允许 `1e-12` 的浮点误差：

```text
candidateMetric <= baselineMetric + 1e-12
```

candidate 必须在 holdout 至少一个主要指标上严格改善，并且不得在 holdout 或 train 的任何主要指标上劣化。仅 train 改善、holdout 无改善或劣化的候选拒绝。

## 7. Pareto 与状态机

### 7.1 Pareto 规则

baseline 是固定的非回归锚点，不作为候选 Pareto 点。候选之间比较：

```text
(
  adjacent_same_event_rate,
  adjacent_same_class_rate,
  short_window_same_class_rate,
  top_event_concentration,
  normalized_patch_magnitude
)
```

候选只有同时满足硬性护栏、相对 baseline 不劣、并在 holdout 至少一个主要指标严格改善时，才进入人工候选集。候选集内部保留非支配解；若多个候选指标相同，优先 patch magnitude 更小、变更事件更少者。

### 7.2 B1.1 状态机

```text
draft
  → proposed
  → scope_checked
  → simulated
  → audited
  → awaiting_human
      → accepted
      → rejected
      → blocked
```

- `draft`：意图可编辑；
- `proposed`：控制器已生成候选意图；
- `scope_checked`：白名单、hash 和深度一致性通过；
- `simulated`：baseline/train/holdout raw Trace 已生成；
- `audited`：机械、盲评和 red-team 结果已生成；
- `awaiting_human`：等待完整证据审阅；
- `accepted`：人工接受候选 artifact，不等于发布；
- `rejected`：人工拒绝候选；
- `blocked`：证据污染、越权、泄漏、基线失败或结构性问题。

任何 `blocked` 不得通过放宽阈值、删除样本、隐藏冲突或重写 reviewer prompt 转为 accepted。

## 8. Artifact、审批与发布

### 8.1 Artifact

每次 B1 运行使用不可覆盖的 `.tmp/b1/<runId>/`：

```text
manifest.json
base-catalog.json
overlay.json
proposal.json
raw-traces/
player-visible-traces/
metrics/
mechanical-audit.json
blind-review.json
red-team-review.json
evidence-index.json
human-decision.json
run-summary.json
```

任何 artifact 缺失、hash 不匹配、目录覆盖、正式路径写入或身份泄漏都必须是 `blocked`。

### 8.2 人工接受

人工 `accepted` 必须绑定：

- runId；
- source fingerprint；
- base catalog hash；
- overlay hash；
- engine version；
- 完整 train/holdout/adversarial 证据；
- 人工理由和 decision hash。

接受只表示“这个候选评估结果值得进入后续人工发布审查”。它不改变生产 catalog，也不授权下一个优化循环自动继续。

### 8.3 独立发布

发布是独立的显式人工动作，必须重新校验：

1. 当前正式 source hash 与 accepted manifest 一致；
2. accepted overlay hash 一致；
3. 事件目录深度差异仍只包含白名单 weight；
4. 完整 evidence chain、holdout、red-team 和 human decision 仍然存在；
5. 发布目标、回滚点和责任人已明确。

本设计不授权自动合入或自动发布。发布失败或线上回归时，只回滚正式 catalog 到发布前版本，不回滚玩家存档，不改写历史 artifact。

## 9. 风险与停止规则

必须停止并重新裁决的情况：

- 为注入 catalog 必须修改 Local/API/Browser 正式运行路径；
- 必须修改 Snapshot、Contract、Schema、PlayerState 或存档版本；
- 无法让 engine、runner、metrics 使用同一 candidate catalog；
- candidate 与 baseline 无法在同 seed、同 engine/source hash 下比较；
- baseline 已失败但系统试图直接用 candidate 覆盖失败；
- holdout、A/B 身份、hidden effects 或机械 verdict 泄漏；
- 需要修改正式门禁阈值、tracked latest report 或正式事件目录才能完成；
- 需要通过扩大白名单、增加事件、修改条件/effects/choices 或改变 priority 才能取得改善；
- 任何自动合入、自动发布或绕过人工决策的路径出现。

## 10. B1 完成标准

### B1.0 完成

- 默认 Headless parity 通过；
- candidate catalog 能真实影响调度；
- baseline/candidate 同 seed 结果可复现；
- engine、runner、metrics 没有混用 global loader；
- 正式 Local/API/Browser 行为和文件未改变；
- 无 Snapshot、Contract、Schema、tracked report 或正式配置改动；
- B1.0 artifact 和人工裁决已密封。

### B1.1 完成

- 至少一个合法 weight candidate 在 holdout 上严格改善主要指标；
- 没有 train/holdout 主要指标劣化；
- P0、formal/daily、关键事件、choice 和 storyline 护栏全部通过；
- blind、mechanical、red-team 和 evidence chain 全部通过；
- 人工明确 accepted/rejected/blocked；
- accepted 不自动写入正式配置；
- 结果中明确记录剩余风险和真人体验证据缺口。

B1.1 没有合法候选满足条件时，应诚实结束为 `rejected` 或 `blocked`，不得放宽边界把结果写成成功。

## 11. 后续边界

B1 首轮完成后，仍不能自动进入：

- ageRange、priority、conditions、effects、choices、content 的优化；
- 新事件或新路线生成；
- 自动闭环循环；
- 自动发布或真实线上实验；
- 其他题材 world profile；
- 取消 Browser 或真人体验校准。

任何扩大优化变量、改变正式配置来源或进入自动发布的工作，都必须作为新的独立产品阶段重新裁决。
