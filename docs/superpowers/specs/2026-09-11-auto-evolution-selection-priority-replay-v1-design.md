# Auto Evolution Selection Priority Replay v1

**建议文件：** `docs/superpowers/specs/2026-09-11-auto-evolution-selection-priority-replay-v1-design.md`

## 1. Status

本设计定义 **Selection Step 的 controlled replay experiment**。

它不是：

* Product Decision；
* production Participant Contract / Schema；
* 正式 Selection v2；
* Prompt / Skill 修改；
* runtime workflow 修改；
* execution permission。

本阶段只建立能够回答以下问题的实验能力：

> 在冻结同一份 historical Hypothesis Set 后，一个显式承担 semantic selection 的决策，是否比 `first_hypothesis_in_participant_order` 更稳定地选择值得投入本轮 investigation budget 的候选？

在本实验出现明确 improvement signal 之前，不修改正式 AE workflow。

---

## 2. Confirmed Current State

当前正式路径具有以下语义：

```text
Hypothesis
  → 0..N hypotheses
  → no priority / score / confidence semantics
  → Selection always chooses participant-order index 0
  → bounded causal attribution limited to selected hypothesis.evidenceRefs
  → Problem Package
  → Solution
  → Reviewer
```

因此当前 Selection 将没有正式优先级含义的 participant array order 转换成了唯一 downstream investigation target。

另外：

1. `hypothesisId` 当前由数组位置生成：
   `hypothesis-000001`, `hypothesis-000002`, ...
2. stored parser 要求已有 `hypothesisId` 与 participant order 一致。
3. 因此不能通过“重排正式 Hypothesis Set，同时保持原 ID”实现 order-sensitivity test。
4. `buildProblemPackage.ts` 与 `buildBoundedCausalAttribution.ts` 对非首项 hypothesis 仍存在已确认的 ID reconstruction coupling。
5. 本实验不得为了绕过该 coupling 修改 production consumer。

---

## 3. Scope

### Phase 1 — 本设计当前授权范围

只建立：

```text
Historical Hypothesis evidence
→ frozen replay case
→ experimental candidate envelope
→ original-order presentation
→ reversed-order presentation
→ externally produced semantic selection result
→ result validation
→ Human pairwise evaluation
```

不运行：

* External Feedback；
* Improvement Hypothesis Participant；
* production Selection；
* causal attribution；
* Problem Package；
* Solution；
* Reviewer；
* Decision Router；
* Execution；
* 新 ordinary session。

### Phase 2 — 当前不实施

只有 Phase 1 产生稳定 improvement signal 后，才单独批准：

```text
selected alternative hypothesis
→ ID-preserving experimental downstream adapter
→ bounded causal attribution
→ Problem Package
→ Solution
→ Reviewer
```

Phase 2 不属于本次 Codex 实施范围。

---

## 4. Fixed Corpus

第一批 corpus 固定为 8 个 historical ordinary sessions：

| Session                        | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `ordinary-run-20260909-000001` | 多候选；H1 重复感 vs 长期选择因果等               |
| `ordinary-run-20260909-000003` | 多个中后期、关系、目标兑现问题                     |
| `ordinary-run-20260910-000005` | protection case；H1 本身强且具体           |
| `ordinary-run-20260910-000006` | H1 童年重复 vs 高风险选择/关系/pacing          |
| `ordinary-run-20260910-000007` | 多个明显不同的产品问题                         |
| `ordinary-run-20260911-000001` | 宽泛 H1 vs 长期承诺、立场、终局                 |
| `ordinary-run-20260911-000002` | downstream Reviewer failure control |
| `ordinary-run-20260911-000003` | H1 后续进入 authority boundary；存在其他候选   |

不得因为实验结果不理想替换 corpus。

---

## 5. Source Provenance

### 5.1 Prefer exact historical artifact

如果仓库中存在 retained `hypotheses.json`，必须复制其 exact bytes，并记录 SHA-256。

已知优先来源包括：

```text
ordinary-run-20260909-000003
artifacts/evolution/human-follow-up/items/
item-7494a607f91d48d428c0999901e3659c14a1b936fbedf0c7059af4867a022ade/
evidence/hypothesis-runs/ordinary-run-20260909-000003/hypotheses.json
```

```text
ordinary-run-20260910-000005
artifacts/evolution/fixed-cases/ordinary-run-20260910-000005-round-1/
input/artifacts/hypothesis-runs/ordinary-run-20260910-000005/hypotheses.json
```

```text
ordinary-run-20260910-000006
artifacts/evolution/fixed-cases/ordinary-run-20260910-000006-round-1/
input/artifacts/hypothesis-runs/ordinary-run-20260910-000006/hypotheses.json
```

```text
ordinary-run-20260910-000007
artifacts/evolution/fixed-cases/ordinary-run-20260910-000007-round-1/
input/artifacts/hypothesis-runs/ordinary-run-20260910-000007/hypotheses.json
```

```text
ordinary-run-20260911-000003
artifacts/evolution/human-follow-up/items/
item-69fb68e9de3676b65e4b387afb2c5544eefb16fddb7686d3aee1b3ac4c4b948a/
evidence/hypothesis-runs/ordinary-run-20260911-000003/hypotheses.json
```

### 5.2 Operational-report projection fallback

如果 exact retained hypothesis artifact 不存在，允许从对应 Operational Run Report：

```text
workflows[0].decisionAudit.improvementHypothesis
```

构造 canonical experimental source。

此类 case 必须标记：

```text
sourceKind = "operational_report_projection"
```

并记录：

* source report path；
* source report SHA-256；
* source JSON pointer；
* projected hypothesis set SHA-256。

不得将 projection 描述成“historical source bytes”。

对应 reports：

```text
ordinary-run-20260909-000001
artifacts/evolution/run-reports/ae-report-558d77abf4524696/report.json

ordinary-run-20260911-000001
artifacts/evolution/run-reports/ae-report-a80bd131f1b8ad6f/report.json

ordinary-run-20260911-000002
artifacts/evolution/run-reports/ae-report-1192046673b1ab2e/report.json
```

### 5.3 Projection validation

对于同时存在 exact hypothesis artifact 和 Operational Report 的 case：

* parse 两者；
* 比较 hypothesis count；
* 比较每一项的 ID 与所有 semantic fields；
* 必须一致。

该检查用于证明 report projection 是可靠 fallback。

---

## 6. Frozen Case Shape

每个 case 建议保存到：

```text
artifacts/ae-selection-priority-replay-v1-20260911/
  <session-id>/
    case.json
    source/
      hypotheses.json
    presentations/
      original.json
      reversed.json
```

`case.json` 至少记录：

```text
schemaVersion
caseId
sessionId
sourceKind
sourceRef
sourceSha256
sourceReportRef
sourceReportSha256
hypothesisCount
historicalSelectedHypothesisId
```

所有实验文件 create-only。

不得覆盖 historical artifact。

---

## 7. Experimental Candidate Envelope

正式 `ImprovementHypothesisSet` 保持原样。

Permutation 发生在新的 **experiment-only envelope** 中。

每个 candidate 至少包含：

```text
presentationIndex
sourceIndex
sourceHypothesisId
sourceHypothesisSha256
hypothesis
observedBasis
feedbackRefs
evidenceRefs
patternEvidenceRefs?
unknowns
productSignificance
```

其中：

* `sourceIndex` = historical participant order 中的 0-based index；
* `sourceHypothesisId` = historical artifact 中的 ID；
* `sourceHypothesisSha256` = 对该原始 hypothesis canonical representation 的 hash；
* `presentationIndex` 仅代表本次实验展示位置。

严禁根据 presentation order 重写 `sourceHypothesisId`。

---

## 8. Presentations

每个 case 固定生成两个 presentation：

### `original`

```text
sourceIndex: 0, 1, 2, ... N-1
```

### `reversed`

```text
sourceIndex: N-1, ... 2, 1, 0
```

两者必须：

* candidate 数量相同；
* source identity 集合相同；
* candidate semantic content 相同；
* 只有 presentation order 不同。

原始 `source/hypotheses.json` 在生成 presentation 前后 SHA-256 必须完全一致。

---

## 9. Selection Responsibility

实验中的 semantic selector 只负责：

> 从当前完整候选集合中选择最值得投入下一步有限 investigation budget 的一个 hypothesis。

它不负责：

* 重新形成 hypothesis；
* 修复 hypothesis；
* 调查 repository；
* 判断 root cause；
* 形成 solution；
* 判断 implementation permission；
* 猜测最终 Reviewer route。

Selection 不得把“容易自动修改”当作优先条件。

需要 Human authority 的重要问题仍然允许被选择。

---

## 10. Selection Criteria

不使用数值总分。

Selection 使用四个定性判断：

### Product Materiality

如果 hypothesis 成立，对核心玩家体验是否具有实质影响。

### Evidence Readiness

当前 hypothesis 自身的 observed basis、refs 与 unknowns 是否已经足以值得投入调查，而不是纯 speculative concern。

### Investigation Leverage

一次 bounded investigation 是否有合理机会显著减少 material uncertainty 或形成有价值的 Human handoff。

### Problem Specificity

是否足够集中，能够成为一个 investigation job，而不是多个问题的宽泛集合。

### Boundary rule

以下均不得成为隐式优先规则：

```text
more evidenceRefs == higher priority
earlier array position == higher priority
easier implementation == higher priority
configuration-only == higher priority
no Human approval needed == higher priority
```

不得输出 severity / score / numeric priority。

---

## 11. Experimental Selection Result

实验结果建议使用：

```text
ae-selection-replay-result-v1
```

至少包含：

```text
schemaVersion
caseId
presentationId
sourceHypothesesSha256
presentationSha256

selected:
  sourceIndex
  sourceHypothesisId
  sourceHypothesisSha256

rationale:
  productMateriality
  evidenceReadiness
  investigationLeverage
  problemSpecificity
  overallReason

createdAt
```

Validator 必须拒绝：

* 不存在的 hypothesis；
* ID/index/hash 不一致；
* presentation 中不存在的 candidate；
* 空 rationale；
* 未知字段；
* `score`；
* `ranking`；
* `severity`；
* numeric `priority`。

这是实验 artifact，不是 production Contract。

---

## 12. Evaluation

Historical baseline 固定为：

```text
first_hypothesis_in_participant_order
```

即 historical `hypothesis-000001`。

semantic candidate 与 baseline 分别评价，不把 historical H1 当 gold answer。

每个 case 的 pairwise verdict 只能是：

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

同时比较同一 semantic selector 的：

```text
original selection
vs
reversed selection
```

得到：

```text
ORDER_STABLE = YES | NO | INCONCLUSIVE
```

如果 original/reversed 选择不同，但两者属于真正难以区分的 material tie，允许标记 `INCONCLUSIVE`，不能为了 order stability 强造唯一答案。

---

## 13. Success Gate

Phase 1 只有同时满足以下条件，才允许提出进入 Phase 2：

1. 所有 result 都引用真实 source candidate；
2. 不引入 Hypothesis Set 中不存在的新事实；
3. protection case `20260910-000005` 不出现明确退化；
4. 多个 target case 相对 historical H1 出现可解释的 `BETTER`；
5. original / reversed 大多数 case 保持同一 semantic choice；
6. 不表现出“自动执行容易度”或 Human authority avoidance bias；
7. improvement 不是简单来自“总是避免第一项”。

如果仅表现为“选择变得不同”，但没有稳定质量改善：

```text
SELECTION_CHANGE_NOT_SUPPORTED
```

如果出现稳定 improvement signal：

```text
SELECTION_PHASE_1_SUPPORTED
```

该结论只授权设计 Phase 2，不自动授权修改 runtime Selection。

---

## 14. Explicit Non-goals

本阶段禁止：

* 修改 `selectFirstHypothesis.ts`；
* 修改 `improvementHypothesisContract.ts`；
* 修改任何 Feedback/Hypothesis Prompt；
* 修改 Skill；
* 创建 production Selection v2；
* 修改 `buildProblemPackage.ts`；
* 修改 `buildBoundedCausalAttribution.ts`；
* 放宽 PD-111；
* 修改 Router / permission；
* 运行 ordinary sessions；
* 调用新的 AE Participant；
* 运行 Solution / Reviewer；
* 修改产品内容。

---

## 15. Next Decision

Phase 1 完成后只回答：

```text
Does semantic Selection show a stable,
materially better selection signal
than first_hypothesis_in_participant_order?
```

只有答案为 YES，才单独设计 Phase 2 counterfactual downstream replay。
