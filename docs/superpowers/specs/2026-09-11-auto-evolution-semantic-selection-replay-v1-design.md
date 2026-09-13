# Auto Evolution Semantic Selection Replay v1

## 1. Status

Status: HISTORICAL EXPERIMENT.
This spec records the 2026-09-11 Selection experiment.
It is not the current AE participant/model policy and is not an active tuning direction.

本设计定义 Selection Priority Replay Phase 1 的 **semantic selection controlled experiment**。

它建立在已经冻结并验证完成的：

```text
artifacts/ae-selection-priority-replay-v1-20260911/
```

之上。

本设计只回答：

> 在相同 historical Hypothesis Set 下，一个看不到 historical ordering identity 的 semantic selector，是否能比 `first_hypothesis_in_participant_order` 产生更稳定、且 materially better 的 investigation target selection？

它不是：

- production Selection v2；
- Product Decision；
- production Participant Contract；
- Hypothesis Contract 修改；
- Solution / Reviewer 修改；
- downstream counterfactual replay；
- autonomous execution permission。

Phase 1 semantic replay 通过之前，不修改正式 AE workflow。

---

## 2. Existing Frozen Baseline

已完成并冻结的 Phase 1 corpus：

```text
8 historical ordinary sessions
×
original / reversed presentation
=
16 controlled presentations
```

已有 artifact 保存：

- historical source provenance；
- stable `sourceIndex`；
- stable `sourceHypothesisId`；
- stable `sourceHypothesisSha256`；
- original / reversed presentation；
- historical selected hypothesis；
- experiment-only result validator。

Phase 1 corpus 是实验真源。

本阶段不得重新生成 Hypothesis、替换 case、修改 candidate semantic content 或修改 source identity。

---

## 3. Newly Identified Experimental Contamination Risk

当前 replay presentation envelope 包含：

```text
presentationIndex
sourceIndex
sourceHypothesisId
sourceHypothesisSha256
```

其中：

```text
sourceIndex
sourceHypothesisId
```

直接或间接暴露 historical participant order。

例如：

```text
sourceIndex = 0
sourceHypothesisId = hypothesis-000001
```

即使 reversed presentation 改变了展示顺序，semantic selector 仍可能推断 historical first hypothesis。

因此不能直接把完整 replay presentation 发送给 Participant。

否则：

```text
original choice == reversed choice
```

不能可靠证明 selector 对 presentation order 稳定。

---

## 4. Core Experimental Rule

Participant 只能看到 **identity-blind semantic projection**。

完整实验路径：

```text
Frozen Replay Presentation
        ↓
trusted deterministic blind projection
        ↓
Participant-visible Semantic Selection Input
        ↓
one isolated Participant invocation
        ↓
Participant-visible Selection Response
        ↓
trusted deterministic candidateRef → source identity mapping
        ↓
ae-selection-replay-result-v1
        ↓
existing result validator
```

Trusted harness 拥有 source identity。

Participant 不拥有 source identity。

---

## 5. Blind Projection

每个 presentation deterministically 投影为：

```text
ae-semantic-selection-input-v1
```

Participant-visible input 只包含：

```text
schemaVersion
candidates
```

每个 candidate：

```text
candidateRef
hypothesis
observedBasis
feedbackRefs
evidenceRefs
patternEvidenceRefs?
unknowns
productSignificance
```

### 5.1 candidateRef

`candidateRef` 只表达当前 presentation 中的位置：

```text
candidate-A
candidate-B
candidate-C
...
```

规则：

```text
presentationIndex 0 → candidate-A
presentationIndex 1 → candidate-B
presentationIndex 2 → candidate-C
...
```

它没有跨 presentation identity 语义。

同一个 source hypothesis 在 original 与 reversed 中通常会拥有不同 `candidateRef`。

### 5.2 Participant must not receive

以下字段必须从 Participant-visible bytes 中完全删除：

```text
caseId
sessionId

presentationId
order

presentationIndex
sourceIndex
sourceHypothesisId
sourceHypothesisSha256

historicalSelectedHypothesisId

sourceHypothesesSha256
presentationSha256

historical Solution
historical Reviewer
historical Decision
historical Execution
```

也不得在 prompt prose 中描述：

- “这是 reversed presentation”；
- “历史系统选择了第一条”；
- “我们正在测试首项偏差”；
- 某候选的历史 index；
- 某候选历史 downstream outcome。

Participant 只能根据候选 semantic content 做选择。

---

## 6. Trusted Mapping Artifact

因为 Participant-visible input 是 blind 的，trusted harness 必须单独保存映射：

```text
ae-semantic-selection-mapping-v1
```

每项：

```text
candidateRef
presentationIndex
sourceIndex
sourceHypothesisId
sourceHypothesisSha256
```

mapping 不进入 Participant prompt。

它只用于：

```text
Participant selectedCandidateRef
        ↓
trusted mapping
        ↓
source identity
        ↓
existing selection replay result
```

mapping 必须绑定：

```text
caseId
presentationId
presentationSha256
blindInputSha256
```

任何 hash 或 identity mismatch 均 fail closed。

---

## 7. Semantic Selection Responsibility

Participant 的唯一工作是：

> 从当前提供的候选中选择一个最值得投入下一步有限 investigation budget 的 improvement hypothesis。

Participant 不负责：

- 重新形成 hypothesis；
- 修复 hypothesis；
- 新增候选；
- 合并候选；
- repository investigation；
- causal attribution；
- root-cause conclusion；
- solution proposal；
- implementation design；
- authority routing；
- 猜测哪个候选更容易自动修改。

必须选择 **exactly one** existing candidate。

---

## 8. Selection Criteria

不使用 numeric score。

Participant 按以下四个定性标准选择：

### Product Materiality

如果 hypothesis 成立，它对玩家核心体验是否具有实质意义。

不是：

```text
severity score
```

而是判断该问题是否值得当前有限 investigation budget。

### Evidence Readiness

当前：

```text
observedBasis
feedbackRefs
evidenceRefs
unknowns
```

是否已经形成值得继续调查的问题。

Evidence 多不自动等于更好。

### Investigation Leverage

一次 bounded investigation 是否有合理机会：

- 显著减少关键 uncertainty；或
- 形成有价值的 Human decision handoff。

### Problem Specificity

候选是否足够集中，可以作为一个 investigation job。

过于宽泛、多问题混合的 hypothesis 可以因此失去优先级。

---

## 9. Explicit Non-Criteria

以下因素不得作为优先理由：

```text
candidateRef 靠前
candidateRef 靠后

evidenceRefs 数量更多

实现更容易
配置改动即可完成
更容易自动执行
不需要 Human approval
预计 Reviewer 更容易接受
预计 Decision Router 更容易进入 execution
```

需要 Human authority 的重要问题仍可能是正确 selection。

Participant 不能根据 implementation cost 回避产品重要问题。

---

## 10. Participant Output

Participant-visible response 固定为：

```text
ae-semantic-selection-response-v1
```

结构：

```json
{
  "schemaVersion": "ae-semantic-selection-response-v1",
  "selectedCandidateRef": "candidate-C",
  "rationale": {
    "productMateriality": "...",
    "evidenceReadiness": "...",
    "investigationLeverage": "...",
    "problemSpecificity": "...",
    "overallReason": "..."
  }
}
```

严格禁止额外字段。

禁止：

```text
score
scores
ranking
rank
severity
priority
confidence
alternativeCandidates
secondChoice
```

不得输出 source identity。

---

## 11. Participant Model

Phase 1 controlled experiment 固定使用：

```text
deepseek-v4-flash
```

原因：

- 当前 AE Feedback / Hypothesis 等已有 Participant 使用同一 model family；
- 本实验目标是测试 Selection responsibility，而不是比较模型；
- 新增不同模型会引入额外变量。

该决定仅适用于：

```text
Semantic Selection Replay v1
```

不代表未来 production Selection 必须使用该模型。

不进行：

- model A/B；
- temperature A/B；
- multiple-agent voting；
- best-of-N；
- retry-until-desired-answer。

---

## 12. Invocation Isolation

实验固定执行：

```text
8 cases × 2 presentations = 16 invocations
```

每个 invocation 必须：

- 独立 request；
- 独立 conversation；
- 只看到一个 blind input；
- 不携带前一次 selection；
- 不共享 previous response；
- 不使用跨 invocation memory。

尤其禁止：

```text
original
→ same conversation
→ reversed
```

否则会人为提高 order stability。

---

## 13. Invocation Order

16 个 jobs 的运行顺序必须在第一次 Participant invocation 前冻结。

不能：

```text
跑 original
看结果
再决定什么时候跑 reversed
```

推荐使用 deterministic interleaving，而不是 8 个 original 后再跑 8 个 reversed。

固定顺序：

```text
1.  20260909-000001 / original
2.  20260910-000006 / reversed
3.  20260909-000003 / original
4.  20260911-000001 / reversed
5.  20260910-000005 / original
6.  20260911-000003 / reversed
7.  20260910-000007 / original
8.  20260911-000002 / reversed

9.  20260909-000001 / reversed
10. 20260910-000006 / original
11. 20260909-000003 / reversed
12. 20260911-000001 / original
13. 20260910-000005 / reversed
14. 20260911-000003 / original
15. 20260910-000007 / reversed
16. 20260911-000002 / original
```

该顺序一旦进入 invocation 不允许改变。

失败 job 可以被标记 technical failure，但不能跳过后重新重新排列剩余 jobs。

---

## 14. Retry Policy

为了避免 selective retry 污染结果：

### Allowed retry

仅允许对明确 technical failure 进行 **一次** retry：

```text
network
timeout
HTTP failure
provider response transport failure
```

retry 必须：

- 使用 byte-identical system prompt；
- 使用 byte-identical user content；
- 使用同一 model；
- 记录 attempt 1 与 attempt 2；
- 不读取或修改输入。

### Not allowed retry

如果 Participant 返回：

- 合法但判断不好；
- 合法但与 expected 不同；
- 选择 historical H1；
- original/reversed 不稳定；

不得 retry。

如果 response 违反 semantic response schema：

```text
PARTICIPANT_CONTRACT_FAILURE
```

记录失败，不使用手工修复后的答案替代。

不允许“再问一次看看”。

---

## 15. Invocation Provenance

每个 job 必须保存：

```text
job.json
input.json
mapping.json
raw-provider-response.json
raw-participant-response.json
result.json
```

如果失败：

```text
failure.json
```

### job.json

至少记录：

```text
schemaVersion
jobId
caseId
presentationId

model
invocationOrdinal

presentationRef
presentationSha256

blindInputRef
blindInputSha256

mappingRef
mappingSha256

attemptCount

startedAt
completedAt
```

### result.json

只有成功完成：

```text
blind response
→ trusted mapping
→ existing ae-selection-replay-result-v1 validation
```

后才允许生成。

不得直接信任 Participant 返回 source identity。

---

## 16. Freeze Before Invocation

第一次模型调用之前，必须 create-only 生成：

```text
artifacts/ae-semantic-selection-replay-v1-20260911/
  experiment.json
  jobs/
    <job-id>/
      job.json
      input.json
      mapping.json
```

`experiment.json` 至少记录：

```text
schemaVersion
sourceCorpusRef
sourceCorpusSha256

repositoryBranch
repositoryHead

model
jobCount = 16
invocationOrder[]

ordinarySessionsExecuted = false
productionSelectionModified = false
```

第一次 invocation 后：

- 不允许改变 jobs；
- 不允许改变 order；
- 不允许改变 system prompt；
- 不允许改变 selection criteria。

---

## 17. Preflight Audit

调用 Participant 前必须自动验证：

### Identity blindness

递归扫描 Participant-visible `input.json`，不得出现：

```text
sourceIndex
sourceHypothesisId
sourceHypothesisSha256
presentationIndex

historicalSelectedHypothesisId

presentationId
original
reversed

hypothesis-000001
hypothesis-000002
...
```

注意：

这里检查的是 metadata leakage。

如果 hypothesis 自然语言正文恰好包含数字或其他普通文本，不应误判。

### Semantic parity

Blind candidate semantic fields 必须与 presentation candidate byte-equivalent/canonical-equivalent。

blind projection 只能移除 identity metadata 和增加 `candidateRef`。

不得改写 candidate 内容。

### Mapping completeness

所有 blind candidates：

```text
1 candidateRef
↔
1 source candidate
```

必须是一一映射。

---

## 18. Phase 1A — Semantic Selection Runs

完成全部 16 jobs。

此时只检查：

- Participant response 合法性；
- identity mapping 合法性；
- artifact provenance；
- job completion status。

**不要边运行边评价哪个 selection 更好。**

也不要在前 8 个结果之后调整 instruction。

16 jobs 全部终止后才进入分析。

---

## 19. Phase 1B — Order Stability Analysis

对于每个 case：

```text
original selected sourceHypothesisId
vs
reversed selected sourceHypothesisId
```

判断：

```text
YES
NO
INCONCLUSIVE
```

### YES

两者映射回同一 source hypothesis。

### NO

两者明确选择不同 source hypothesis，并且不是 technical failure。

### INCONCLUSIVE

至少一侧：

- Participant technical failure；
- Participant contract failure；
- 无合法 semantic result。

不要把 failure 计成 order instability。

---

## 20. Phase 1C — Human Pairwise Evaluation

完成 order stability 后，再比较：

```text
historical baseline H1
vs
semantic selector choice
```

评价标准继续使用：

```text
Product Materiality
Evidence Readiness
Investigation Leverage
Problem Specificity
Causal / Authority Calibration
```

其中 `Causal / Authority Calibration` 是 Human evaluation 维度，不提供给 selector 作为 authority-cost optimization signal。

每个 case 结论：

```text
BETTER
NEUTRAL
WORSE
INCONCLUSIVE
```

记录：

```text
Improved
Regressed
Unchanged strengths / weaknesses
```

历史 H1 不是 gold answer。

---

## 21. Protection Case

`ordinary-run-20260910-000005` 是 protection case。

Semantic selector 可以继续选择 H1。

事实上：

```text
always choose non-H1
```

应被视为实验失败模式，而不是 improvement。

如果 selector 为了表现“不同”而系统性避开 H1，则不能支持 Selection change。

---

## 22. Success Gate

只有同时满足以下条件：

1. 16 jobs 按 frozen protocol 执行；
2. 无 identity leakage；
3. 无 selective retry；
4. valid-result cases 中大多数 original/reversed semantic choice 稳定；
5. protection case 不出现明确 regression；
6. 多个 target cases 相比 historical H1 得到 `BETTER`；
7. 没有系统性 authority avoidance；
8. 没有“永远避开 H1”的 anti-first bias；
9. improvement 不能仅由 presentation position 解释；

才可得：

```text
SELECTION_PHASE_1_SUPPORTED
```

如果只证明 selector 会选择不同候选：

```text
SELECTION_CHANGE_NOT_SUPPORTED
```

如果结果质量看起来更好但 order instability 明显：

```text
SELECTION_SEMANTIC_SIGNAL_PRESENT_BUT_UNSTABLE
```

如果 technical/contract failures 太多：

```text
SELECTION_REPLAY_INCONCLUSIVE
```

---

## 23. Phase 2 Boundary

即使：

```text
SELECTION_PHASE_1_SUPPORTED
```

也不自动授权：

- production Selection v2；
- runtime change；
- Hypothesis Contract change；
- non-first downstream support；
- ordinary AE run。

下一步只能进入独立批准的：

```text
counterfactual downstream replay
```

从发生 meaningful divergence 的 2–3 个 case 中比较：

```text
historical H1 downstream
vs
semantic-selected hypothesis downstream
```

只有 Phase 2 再确认最终 AE outcome materially improves，才讨论 production Selection design。

---

## 24. Explicit Non-goals

本阶段不得：

- 修改 frozen 8-case corpus；
- 新增 ordinary session；
- 修改 Hypothesis Prompt；
- 修改 production Selection；
- 修改 `ImprovementHypothesis` schema；
- 修改 bounded causal attribution；
- 修改 Problem Package；
- 运行 Solution；
- 运行 Reviewer；
- 修改 game content；
- 设计多模型 voting；
- 引入 score/ranking system；
- 根据实验中途结果修改 prompt。

---

## 25. Required Final Report

Semantic replay 完成后必须汇报：

### Experiment integrity

- corpus SHA；
- repository HEAD；
- model；
- 16-job execution order；
- identity-blind preflight result；
- retries / failures。

### Per-case result

```text
session
historical selection
original semantic selection
reversed semantic selection
ORDER_STABLE
```

### Pairwise evaluation

```text
session
baseline vs semantic
BETTER / NEUTRAL / WORSE / INCONCLUSIVE
key reason
```

### Aggregate diagnosis

只回答：

```text
Does semantic Selection show a stable,
materially better selection signal
than first_hypothesis_in_participant_order?
```

最终 verdict 只能使用：

```text
SELECTION_PHASE_1_SUPPORTED
SELECTION_CHANGE_NOT_SUPPORTED
SELECTION_SEMANTIC_SIGNAL_PRESENT_BUT_UNSTABLE
SELECTION_REPLAY_INCONCLUSIVE
```
