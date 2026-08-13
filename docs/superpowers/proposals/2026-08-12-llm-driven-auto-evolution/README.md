# LLM 驱动自动进化：方向重校准方案 v2

> 初始讨论：2026-08-12  
> v2 修订：2026-08-13  
> 状态：**v3 文档收敛版。二轮复审裁决为 `APPROVE DIRECTION / MINOR DOCUMENT CHANGES BEFORE IMPLEMENTATION`；本包仍不授权编码或原 B1.1。**

## 1. 本版裁决

二轮只读复审结论为：`APPROVE DIRECTION / MINOR DOCUMENT CHANGES BEFORE IMPLEMENTATION`。

v3 不再重做总体架构，只吸收三项精确修订：

1. Reviewer calibration 明确拆成 `calibration-development` 与 `sealed-qualification`，避免用调过 prompt 的同一套题证明自己合格；
2. `PlayerObservableTranscript` 明确拆成 Reviewer 可见的 `ObservablePayload` 与 Orchestrator 持有的 `ExperimentEnvelope`，seed/policy/arm/config identity 不再混入玩家可观察 Contract；
3. 在 Phase 3 前增加实验级、版本化 `EvaluationTarget` rubric，作为开放式 finding 与 deterministic incidence 之间的桥。

同时采纳两项小修：Phase 2 A/B 顺序随机化/镜像复评；Phase 0/1 可以共用 successor design，但 Phase 0 保留独立 stop gate。

> 本轮修订完成后，不再需要同级别总体方向评审。Phase 0/1 successor design 已写入 `docs/superpowers/specs/2026-08-13-player-observable-transcript-reviewer-calibration-design.md`；是否进入编码仍需独立授权。

## 2. 不变的根本方向

Wuxia-Life 的核心体验高度文本化，因此这套系统的核心价值仍然是：

```text
Simulation
→ Player-observable life transcripts
→ LLM qualitative review
→ evidence-grounded findings
→ bounded configuration hypothesis
→ controlled experiment
→ independent verification
→ population-level evidence
→ accept / reject / stop
```

这不是传统的：

```text
metric → score → optimizer → highest score wins
```

机械 metrics、阈值和硬规则继续存在，但主要承担：

- 安全护栏；
- 明确异常检测；
- 可复现性验证；
- 统计事实；
- 已经被长期验证的廉价过滤。

它们不默认代表“游戏体验更好”。

## 3. v3 的核心阅读顺序

1. [`01-vision-and-principles.md`](./01-vision-and-principles.md)  
   固定愿景、Reviewer 能力边界、配置驱动和人工角色。
2. [`02-architecture-and-flywheel.md`](./02-architecture-and-flywheel.md)  
   定义 Transcript、Agent 信息边界、实验模型、统计层、holdout、artifact seal 和飞轮。
3. [`03-phased-implementation-roadmap.md`](./03-phased-implementation-roadmap.md)  
   按“每阶段证明一个关键假设”重新排序，明确何时应该停止。

同时仍需核对仓库事实基线：

```text
docs/README.md
docs/governance/current-product-stage.md
docs/governance/product-decisions.md
docs/superpowers/handoffs/2026-08-12-constrained-auto-evolution-b1-handoff.md
docs/superpowers/specs/2026-08-12-constrained-auto-evolution-b1-design.md
docs/superpowers/plans/2026-08-12-constrained-auto-evolution-b1.md
```

## 4. 对当前 B1 的重新定位

### 4.1 B1.0：关闭为 Experiment Boundary Prototype

B1.0 的正确长期价值是证明：

- runtime catalog 可以实例级注入；
- formal source 默认路径可以保持不变；
- candidate 可以通过 immutable overlay 进入真实 Headless 调度；
- persona / seed / policy 可以形成可复现实验输入；
- candidate 不需要写回正式配置；
- artifact 可以隔离保存并进行基本 provenance 校验。

因此 B1.0 应被视为：

> **已关闭的 Experiment Boundary Prototype。**

它不是“候选效果已改善”的证明，也不是未来完整 evidence trust root 的证明。

### 4.2 原 B1.1：不再直接执行

原 Task 9～14 不应按原目标继续执行。

分类如下：

**直接继承：**

- deterministic scope controller；
- role isolation；
- candidate 不自动发布；
- baseline failure block；
- immutable experiment artifacts；
- holdout / adversarial 的基本思想；
- red-team veto。

**重新定位：**

- weight overlay：第一种低风险 actuator，不是长期主要优化空间；
- repetition / concentration metrics：guardrail / supporting evidence；
- Pareto：多个合法候选之间的次级整理工具，不决定体验优劣；
- blind reviewer：独立体验验证通道，不是绝对真理来源；
- `accepted`：接受一次实验 iteration，不等于正式 promotion。

**延期：**

- Historian；
- 多轮自动循环；
- 正式 promotion preflight；
- text / conditions / rewards 等更大 action space；
- 分仓、通用 DSL、RPC、插件系统。

**废弃：**

- “四项机械指标组成主要优化向量”；
- “holdout 至少一个机械指标严格改善，其余不劣”作为体验候选的主验收逻辑；
- Reviewer 直接提出 `changeHypothesis`。Reviewer 只报告观察与证据，修改假设属于 Planner。

## 5. 本版明确修正的三个技术误区

### 5.1 same seed 不等于整条人生逐步对齐

same seed 的价值被拆成：

1. **prefix/local attribution**：第一次语义分叉前及局部 intervention window 的强归因；
2. **paired outcome evaluation**：相同 persona / policy / seed 下比较整个人生目标问题，但接受合法路径分叉；
3. **population evaluation**：冻结 corpus，程序计算发生率、覆盖和不确定性，LLM 解释典型模式和开放式副作用。

### 5.2 Aggregate Reviewer 不承担“数数”

诸如：

- finding incidence；
- persona/seed 覆盖；
- regression incidence；
- paired difference；
- sampling coverage；
- uncertainty interval；

应该由确定性程序计算。

LLM Aggregate Reviewer 负责：

- 解释结构化统计；
- 归纳案例模式；
- 检查 summary loss；
- 发现未预定义的新问题；
- 给出证据充分性判断。

### 5.3 多 Agent 不是天然独立

“换一个角色提示词”不算隔离。

需要：

- 独立调用 / 独立上下文；
- 最小输入；
- artifact schema；
- arm identity 隐藏；
- 工具权限限制；
- 输入访问日志；
- model / prompt / context builder 指纹；
- 对日志中的 instruction-like text 进行不可信数据处理。

## 6. v3 对二轮复审的精确吸收

- Calibration：development 与 sealed qualification 分离；qualification 暴露后退休/降级；小样本类别允许 `insufficient_evidence`。
- Transcript：Reviewer 只收 `ObservablePayload`；实验 provenance 全部放在 `ExperimentEnvelope`。
- Population：只有冻结 `EvaluationTarget` 才参与 deterministic incidence；开放式新发现保留为 `exploratoryFindings`。
- Blind Pair：增加顺序随机化和必要时镜像复评，显式测 position bias。
- Phase 0/1：共用 design，不共用 acceptance；Phase 0 未通过不得顺滑进入 Phase 1。

## 7. 当前治理动作建议

**本包本身不直接修改 governance。**

方案再次评审通过后，建议单独做一个非常小的 governance 更新：

1. `current-product-stage.md` 将 B1.0 收敛为 `closed / accepted experiment-boundary prototype`；
2. 明确“当前无 B1.1 实施授权”；
3. 下一候选阶段命名为：
   `Player-Observable Transcript & Reviewer Calibration`；
4. 原 B1 design / plan 保留 B1.0 历史事实，但将原 B1.1 明确标记为 `superseded`，禁止直接续跑 Task 9～14；
5. B1.0 handoff 作为历史验收记录保留，不回写历史。

## 8. 当前唯一推荐下一工程 Slice

当前方向已通过二轮复审。第一项可被单独授权的实现不应该是 Planner，也不应该是完整多 Agent 飞轮。

应该只授权：

> **Phase 0 + Phase 1：PlayerObservableTranscript 与 Reviewer Calibration。**

它回答整个方向最关键的问题：

> 在只看玩家可观察证据、没有 hidden oracle、没有修改方案暗示的条件下，LLM 是否能够稳定、可测量地发现 Wuxia-Life 的真实文本体验问题？

如果答案是否定的，应该停止或缩小自动进化方向，而不是继续建设 Planner、Verifier 和自动循环。

## 9. 当前不要做什么

- 不执行原 B1.1 Task 9～14；
- 不开始完整多 Agent 编排；
- 不让 LLM 自动写回正式配置；
- 不让 LLM 修改逻辑代码；
- 不建立“好玩总分”；
- 不把固定 holdout 永久重复使用；
- 不把一个 Reviewer 的判断当作 ground truth；
- 不为了抽离提前分仓或建设通用框架；
- 不优先建设银行级防篡改系统，而忽略 Reviewer 本身是否值得信任。
