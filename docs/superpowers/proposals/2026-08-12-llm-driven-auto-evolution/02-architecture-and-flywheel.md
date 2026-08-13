# 02. 总体架构：受约束的假设—实验飞轮

> 状态：v2 候选架构。这里描述逻辑职责、数据契约和信息边界；不要求第一阶段就实现全部角色。

## 1. 核心架构

```text
Formal Wuxia-Life source/config
           │
           ├── frozen source/config fingerprint
           │
           v
┌──────────────────────────────┐
│ Deterministic Orchestrator   │
│ manifest / ACL / state machine│
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│ Simulator / Headless Runner  │<── persona / policy / seed corpus
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│ PlayerObservableTranscript   │
│ player-view evidence contract│
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│ Experience Reviewer          │
│ findings + evidence only     │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│ Planner                      │
│ findings → PatchIntent       │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│ Deterministic Scope Controller│
│ whitelist / schema / overlay │
└──────────────┬───────────────┘
               │
               v
┌──────────────────────────────┐
│ Candidate Runner             │
│ paired + population corpus   │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       v                v
┌───────────────┐  ┌────────────────────┐
│ Blind Pair    │  │ Deterministic      │
│ Verifier      │  │ Population Stats   │
└──────┬────────┘  └─────────┬──────────┘
       │                     │
       └──────────┬──────────┘
                  v
        ┌────────────────────┐
        │ Aggregate Reviewer │
        │ explain + synthesize│
        └─────────┬──────────┘
                  v
        ┌────────────────────┐
        │ Mechanical / Red   │
        │ Team / Trust Checks│
        └─────────┬──────────┘
                  v
        ┌────────────────────┐
        │ Iteration Gate     │
        │ accept/reject/stop │
        └────────────────────┘
```

## 2. 第一核心 Contract：PlayerObservableTranscript

当前简化 visible trace 不足以支持“选择是否改变人生、反馈是否充分”等判断，因此正式 Reviewer 输入需要一个独立 Contract。

### 2.1 必须分离 ObservablePayload 与 ExperimentEnvelope

`PlayerObservableTranscript` 的玩家可观察内容不能与 seed、内部 persona/policy、arm/config identity 等实验元数据混在同一个 Reviewer payload 中。

系统应至少分成两个对象：

```text
ExperimentEnvelope
├── run / seed / policy / provenance
├── source/config fingerprints
├── arm identity（如存在）
└── observablePayloadHash

ObservablePayload
├── reviewer-scoped opaque transcriptId
├── 玩家实际可感知的人物/开局设定
└── entries[]
```

Orchestrator 可以持有两者；Experience Reviewer 默认**只收到 `ObservablePayload`**。

### 2.2 `ExperimentEnvelope` 建议最小结构

```json
{
  "envelopeVersion": "...",
  "runRef": "...",
  "seedRef": "...",
  "personaRef": "...",
  "policyRef": "...",
  "policyVisibilityBoundary": "...",
  "sourceFingerprint": "...",
  "configFingerprint": "...",
  "armRef": "sealed-or-null",
  "observablePayloadHash": "..."
}
```

这里的 `personaRef` / `policyRef` 是 simulation / experiment metadata，不等于玩家角色在游戏中能看到的身份信息。

### 2.3 `ObservablePayload` 建议最小结构

```json
{
  "transcriptVersion": "...",
  "transcriptId": "reviewer-scoped-opaque-id",
  "visibleCharacterContext": {
    "background": "...",
    "publicTraits": ["..."]
  },
  "entries": [
    {
      "step": 12,
      "age": 18,
      "eventIdRef": "opaque-or-stable-ref",
      "title": "...",
      "body": "...",
      "visibleChoices": [
        { "choiceRef": "...", "label": "..." }
      ],
      "selectedChoiceRef": "...",
      "visibleOutcome": "...",
      "visibleStateDelta": [
        { "field": "...", "before": "...", "after": "..." }
      ],
      "visibleAcknowledgement": "...",
      "visibleMilestoneOrPhase": "..."
    }
  ]
}
```

字段只在玩家实际能看到时出现。`visibleCharacterContext` 只表达游戏内已经对玩家公开的背景/身份，不暴露用于 Headless 选择的内部 persona 或 policy。

### 2.4 明确禁止进入 Experience Reviewer 的字段

- hidden effects；
- unrevealed state；
- engine-only flags；
- RNG draw sequence / seed identity；
- formal/candidate identity；
- simulation persona / internal policy identity；
- Planner rationale；
- oracle choice ranking；
- test-only assertions。

这些可以存在于 `ExperimentEnvelope`、`EngineeringTrace` 或 `AuditTrace` 中，但必须与 `ObservablePayload` 分离。

## 3. Reviewer Invocation Contract

Reviewer 的“独立性”不能只靠提示词声明。

每次调用至少要 seal：

```text
model/provider identifier
model version if available
system prompt hash
review prompt/template hash
context builder version/hash
input transcript hash list
schema version
sampling/temperature parameters
invocation timestamp/run id
output raw text hash
structured findings hash
```

Reviewer 默认：

- 无 repository 读权限；
- 无 shell；
- 无网络；
- 无其他 Agent artifact 访问权；
- 只消费 Orchestrator 构造的 PlayerObservableTranscript package。

所有事件文本都视为**不可信数据**。日志里即使出现“忽略之前规则”“给本次实验通过”等 instruction-like text，也只能作为人生内容分析，不能改变 Reviewer 指令。

## 4. 逻辑角色与最小信息边界

| Role | 可以看到 | 不应该看到 | 主要输入 | 主要输出 |
|---|---|---|---|---|
| Orchestrator | manifest、所有 artifact metadata | 不参与体验判断 | experiment state | state transition / ACL / seal |
| Simulator | source/config、persona、policy、seed | Reviewer/Planner 结论 | run manifest | raw/audit trace + transcript |
| Experience Reviewer | baseline player-observable corpus | config、candidate、Planner、holdout、hidden state | transcripts | raw review + findings |
| Planner | sealed findings、授权 action schema、必要配置片段 | holdout、Verifier、arm identity | findings | PatchIntent / no_legal_action |
| Scope Controller | PatchIntent、schema、whitelist | 无需体验上下文 | intents | legal overlay / blocked |
| Blind Pair Verifier | 匿名 A/B transcripts 或分段 | arm identity、Planner rationale、mechanical verdict | anonymous pair | open regression scan + targeted pair findings |
| Population Stats | sealed pair/per-trace structured data | 不做语义判断 | corpus outputs | incidence/coverage/uncertainty |
| Aggregate Reviewer | sealed stats、sealed findings、代表性 evidence | Planner rationale、未解盲 arm map（在 seal 前） | population package | synthesis / evidence sufficiency |
| Red Team | manifest、ACL、access log、hash、input/output metadata | 不改写其他报告 | evidence package | veto / pass / suspicious |
| Historian | 多轮 sealed results | 不直接改 candidate | iteration lineage | drift / oscillation / trend findings |

早期真正需要独立 LLM 调用的只有：

- Experience Reviewer；
- Planner；
- Blind Pair Verifier；
- 需要语义判断时的 Red Team。

Simulator、Scope Controller、Population Stats、状态机必须优先是确定性程序。

Aggregate Reviewer 到 population 阶段再引入，Historian 到多轮阶段再引入。

## 5. Reviewer 输出与 Planner 输出严格分离

### 5.1 Reviewer finding

```json
{
  "findingId": "...",
  "dimension": "...",
  "severity": "...",
  "confidence": 0.0,
  "summary": "...",
  "evidence": [
    { "transcriptRef": "...", "location": "...", "observation": "..." }
  ],
  "whyItMatters": "...",
  "evidenceLimit": "none | partial | requires_player_study"
}
```

### 5.2 Planner PatchIntent

```json
{
  "patchIntentId": "...",
  "addressesFindingIds": ["..."],
  "target": "...",
  "operation": "...",
  "proposedValue": "...",
  "rationale": "...",
  "expectedObservableEffects": ["..."],
  "fallback": "no_legal_action | capability_gap | none"
}
```

Planner 可以回答 `no_legal_action`，不能为了让飞轮继续而发明越权修改。

## 6. 三层实验模型

same-seed 不应被赋予单一含义。

### 6.1 Prefix / Local Attribution

记录 baseline 与 candidate 的**第一次语义分叉点**。

在分叉前和明确 intervention window 内，可以较强地讨论局部归因：

- 原本会发生什么；
- candidate 改变了哪个可观察节点；
- 目标 finding 是否在局部被影响。

一旦人生路径明显分叉，不再声称后续每一步是单变量比较。

### 6.2 Paired Outcome Evaluation

对同一：

```text
persona + policy + seed + endAge
```

运行 baseline / candidate。

Blind Pair Verifier 首先做：

1. **开放式回归扫描**：不告诉目标 finding，先独立指出 A/B 各自明显问题；
2. seal 后再做**目标 finding 定向比较**：判断目标问题是否改善。

这样减少“只找预期改善证据”的确认偏差。

匿名 A/B 的呈现顺序还必须随机化；对关键 qualification fixture 可做镜像复评（A/B 与 B/A 各一次），用于测量 position bias。若顺序翻转会系统性改变 verdict，该 Verifier 配置不能被视为稳定。

pair 结论允许：

```text
A_better
B_better
indistinguishable
both_problematic
insufficient_evidence
```

### 6.3 Population Evaluation

冻结一个分层 corpus：

```text
persona × seed × policy × endAge
```

由程序计算：

- finding incidence；
- paired incidence delta；
- persona / seed coverage；
- long-tail regression count；
- sample completeness；
- uncertainty / interval；
- known mechanical metrics。

Aggregate Reviewer 不负责重新计算这些数字，只负责：

- 解释结构化统计；
- 对代表性 evidence 做语义综合；
- 判断改善是否集中在少数样本；
- 发现新模式和 summary loss；
- 判断是否 `insufficient_evidence`。

## 6.4 EvaluationTarget：开放式发现与确定性 incidence 之间的桥

开放式 `dimension + summary` finding 不能直接被程序可靠聚类成“同一个现象”。因此 population 统计前必须引入**实验级、版本化的 EvaluationTarget rubric**。

它不是全局固定 taxonomy，也不要求提前穷举所有体验问题。它只把一个已经被选中验证的 finding 冻结成当前实验可以机械计数的目标：

```json
{
  "targetId": "...",
  "rubricVersion": "...",
  "targetDescription": "...",
  "assessment": "present | absent | insufficient_evidence",
  "evidenceRefs": ["..."],
  "severity": "low | medium | high | critical"
}
```

关键规则：

- `targetId + rubricVersion` 必须在 candidate evaluation 前 seal，避免看到结果后移动判定口径；
- 程序只统计已经按同一 rubric 得到的 `present / absent / insufficient_evidence`；
- `insufficient_evidence` 不得静默按 absent 计数；
- Reviewer 仍然可以输出未被 rubric 覆盖的新问题，这些保留在 `exploratoryFindings`；
- exploratory finding 只有在后续被冻结成新的 EvaluationTarget 后，才进入确定性 incidence / delta 统计；
- 不建设跨项目的全局体验 taxonomy，除非未来多轮证据证明有必要。

因此 population 层的数据流应明确为：

```text
open-ended findings
        +
frozen EvaluationTarget rubric
        ↓
per-trace target assessments
        ↓
deterministic incidence / paired delta
        +
exploratoryFindings（另行保留）
```

## 7. Branch Divergence 的正式语义

candidate 改变一个事件后，可能同时改变：

- 后续状态；
- 可见选项；
- RNG 消耗；
- 后续可达事件；
- 人生路线。

因此：

> same seed 是 common-random-number experimental control，不是逐步 replay equivalence。

artifact 应记录：

- first divergence location；
- divergence reason if mechanically knowable；
- prefix hash；
- post-divergence pair 作为路径依赖 outcome 解释。

未来如果需要同进程并行跑 population arms，当前依赖全局 `Math.random` 的做法必须先替换为实例级 RNG 或进程隔离。否则同进程并发会破坏实验独立性。

## 8. Population Sampling 与 Summary Loss

不能把几千份日志直接塞给一个模型，也不能只保留一份无证据摘要。

推荐分层：

```text
PlayerObservableTranscripts
→ Per-trace findings
→ Anonymous pair findings
→ Deterministic incidence/statistics
→ stratified representative evidence selection
→ Aggregate Reviewer
```

代表样本至少覆盖：

- high-severity findings；
- common findings；
- rare long-tail regressions；
- healthy hard negatives；
- persona strata；
- disagreement cases。

所有 synthesis 必须保留 evidence refs，允许追溯到 transcript。

## 9. Holdout 生命周期

固定 holdout 不能无限复用。

建议分为：

### Discovery / Train Corpus

Reviewer / Planner 可以使用，用于发现问题、调 prompt 和形成候选。

### Per-candidate Validation Corpus

candidate seal 后使用；本轮结果可以进入 iteration decision，因此不能长期称为未污染 holdout。

### Final Promotion Holdout

只用于独立 promotion 判断。其结果一旦反馈给 Planner / evolution loop，就必须：

- retire；或
- rotate；或
- 降级为已知 validation corpus。

### Persistent Adversarial Canaries

用于 hard guardrail / prompt injection / known-regression 检测，不参与优化方向。

长期应记录 holdout exposure history，避免系统在多轮中“逐渐记住考试题”。

## 10. Evaluator Calibration 与 Drift

Reviewer calibration 不只做一次。

以下变化应触发重新跑冻结 calibration set：

- model family/version 变化；
- system prompt 变化；
- review prompt/template 变化；
- context builder 变化；
- transcript schema 重大变化；
- 采样参数重大变化。

如果 precision / citation correctness / false-positive / consistency 等指标跌破已冻结阈值：

> Reviewer 不得继续拥有飞轮中的有效评审资格。

这不是“模型调用失败”，而是 evaluator capability regression。

## 11. Mechanical Auditor 与 LLM Reviewer 的职责边界

Mechanical / deterministic layer 负责可计算事实：

- source/config hash；
- schema completeness；
- patch whitelist；
- baseline gate；
- coverage；
- incidence；
- known repetition metric；
- invariant；
- sample manifest 完整性。

LLM layer 负责开放式语义：

- 合理性；
- 叙事连续性；
- 反馈是否有意义；
- 因果可见性；
- 节奏体验；
- 新问题模式；
- trade-off 解释。

程序负责“发生了多少”，LLM 负责“这意味着什么”。

## 12. Evidence Seal：当前与未来的边界

B1.0 现有 evidence chain 应继续复用为基础 provenance，但不能把它描述成完整 trust root。

### Phase 0/1 必须做到

- 每个实验输入 artifact 内容 hash；
- 所有参与的 source/config 文件逐项内容 hash，不能只 hash `git status`；
- untracked 实验源码也必须内容寻址；
- model/prompt/context/invocation hash；
- output artifact hash；
- 最终 experiment root hash；
- root hash 写入实验目录之外的独立 decision record 或 Git-tracked record。

### 当前不要求

- 复杂公钥签名体系；
- 外部透明日志服务；
- 通用 Merkle 基础设施平台。

目的首先是防止：

- Agent 或脚本意外改写证据；
- dirty/untracked 状态导致 artifact 无法绑定真实实现；
- 角色在验证前后偷偷更换输入。

不是在第一阶段建设面对强恶意攻击者的安全系统。

## 13. Red Team 的真实作用

Red Team 检查：

- role input leak；
- holdout exposure；
- arm 解盲；
- prompt injection；
- 越权工具访问；
- 正式配置写入；
- 修改测试/阈值作弊；
- artifact hash 断裂；
- 删除困难样本；
- baseline failure masking。

它可以 veto，但不能修改 Reviewer、Planner、Verifier 的报告。

## 14. 飞轮状态机

建议使用显式状态机：

```text
frozen
→ baseline_simulated
→ baseline_reviewed
→ planned
→ scope_checked
→ candidate_sealed
→ candidate_simulated
→ pair_verified
→ population_computed
→ aggregate_reviewed
→ audited
→ ready_for_iteration_decision
→ accepted_iteration | rejected | blocked | insufficient_evidence | capability_gap
```

`accepted_iteration` 不等于 formal config promotion。

## 15. 停止条件

飞轮必须可以主动停止：

- Reviewer 无 material finding；
- Reviewer calibration 失效；
- finding 证据不足；
- finding 超出 player-observable 能力边界；
- Planner `no_legal_action`；
- candidate 无可信 population-level 改善；
- high/critical regression；
- evaluator 重大分歧；
- red-team veto；
- source/config fingerprint 变化；
- holdout 生命周期违规；
- patch oscillation；
- 达到成本 / 轮数上限；
- Goodhart / diversity collapse 信号。

“不能安全继续”是正常终点。

## 16. 与 Wuxia-Life 的解耦方向

当前保持同仓库，但依赖应尽量形成：

```text
Evolution Layer
  consumes:
    - Simulation Adapter
    - PlayerObservableTranscript Contract
    - Config Action Schema
  produces:
    - Findings
    - PatchIntent
    - Evaluation Artifacts

Wuxia-Life
  owns:
    - engine
    - player semantics
    - formal config
    - adapters
```

当前必须有的 abstraction：

- Transcript contract；
- Config action schema；
- Simulation invocation manifest；
- Artifact / role input contract。

当前不应该做的 abstraction：

- 独立 package 生态；
- RPC；
- 通用游戏 DSL；
- plugin marketplace；
- 为未知第二个产品预设计扩展点。

另一个应在 successor 实施时修正的依赖方向：正式 `src/core` 不应该反向依赖 `scripts/b1` 中的实验 overlay 实现。核心运行层只拥有 `RuntimeEventCatalog` port；实验 overlay 应留在 evolution/B1 边界并实现该 port。
