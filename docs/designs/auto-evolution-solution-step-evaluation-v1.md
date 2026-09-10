# Auto Evolution Solution Role Controlled Replay Evaluation Methodology v1

> 状态：Solution Role controlled replay 的评价方法
>
> 本文不是 Product Decision，不是 Participant Contract / Schema，也不授予 execution permission。

## 1. Purpose and boundary

本文定义在固定历史输入后，如何判断当前 Solution Participant 的 Role 工作质量是否改善。

本文：

- 是 Solution Role controlled replay 的 evaluation methodology；
- 用于 Human / engineering review 判断 working-method change 是否改善；
- 评价 Role work quality，而不是模型是否复述历史结果。

本文不是：

- 某个 case 的“正确 Solution”定义；
- Auto Evolution workflow 的修改；
- Prompt、Skill、Runtime、Contract、Schema、Router 或 Permission 的修改；
- Fixed Case、expected option 或 expected route 的定义；
- execution permission 的来源。

本文不改变当前 RUN / OBSERVE 阶段，也不把评价结果自动转成 repair、rerun、promotion 或产品决策。

## 2. Evaluation unit

每次评价比较同一 frozen Fixed Case 上的两个独立工作结果：

- **Historical**：原始 Solution work result；
- **Candidate**：采用某项 working-method change 后的 controlled replay result。

Fixed Case 固定输入条件、可用证据和权限边界，不固定任何 Participant 的主观结论。评价对象是 Solution Role 在当前 case 中完成调查、校准、识别边界和交接工作的质量。

## 3. Evaluation Preconditions

只有满足以下条件的 candidate 才能进入正式 Role Evaluation：

- Fixed Case integrity 已验证；
- frozen Problem Package、artifacts、workspace 和 Skill provenance 有效；
- 实验明确记录哪些变量固定、哪些变量变化；
- candidate 通过当前 Solution output Contract。

前置 Gate 的语义固定为：

```text
Contract Conformance = PASS
→ candidate 可以进入六维 Role Evaluation

Contract Conformance = FAIL
→ candidate 不进入正式 Role pairwise comparison
→ raw output 可以保留为 forensic / conformance evidence
```

Contract Conformance 不是第七个 Role dimension。它只判断 candidate 是否满足进入 Role Evaluation 所需的输出契约，不判断 candidate 的工作是否有质量改进。

例如，envelope-valid 但 schema-invalid 的输出属于 Contract Conformance evidence；即使后续 replay 产生 contract-valid candidate，也必须把前一次失败作为独立的 conformance evidence 保留，不能把它混入六维 Role rating。

## 4. Objective Case Anchors

Case Anchor 只能来自：

- frozen player-observable facts；
- sealed / diagnostic provenance；
- frozen repository facts；
- applicable formal authority。

Case Anchor 不得来自：

- historical Solution 的主观判断；
- historical Reviewer 的主观判断；
- replay candidate 的主观判断；
- Human 预设的“正确 route”；
- expected option。

Reviewer 可以提示需要检查的位置，但提示只有在回到 frozen evidence、repository 或 applicable authority 并完成验证后，才能成为 Anchor。Anchor 约束评价所依赖的事实，不规定应提出哪一个 Solution。

## 5. Six Solution Role dimensions

六个维度分别独立评价。它们不是总分的组成项，不进行加权或聚合。

### 5.1 Evidence Grounding & Completeness

检查 Participant 的实际结论或 proposal 所依赖的 material evidence，是否已经读取并核对到足够程度。

不要求无边界审计；只要求不能遗漏足以直接改变当前结论的关键事实。

### 5.2 Causal Calibration

检查 Participant 是否区分：

- observable fact；
- producer provenance；
- repository mechanism；
- inference / hypothesis；
- unknown。

Repository 中存在某个机制，不自动证明 supplied run 就由该机制产生。因果结论必须与当前 supplied evidence 的强度相匹配。

### 5.3 Product Authority Recognition

检查 Participant 是否识别：

- 当前正式 authority 是否已经决定产品语义；
- 是否仍存在新的 Human product choice；
- 是否把“技术上可修改”错误理解为“产品上已授权”。

必须保持：

```text
configuration technical surface != product authorization
```

### 5.4 Implementation Scope Recognition

独立评价 Participant 对实际技术修改面的识别，例如：

- configuration；
- program；
- runtime；
- contract / schema；
- mixed。

本维度与 Product Authority Recognition 正交。JSON 文件修改仍可能需要 Human product decision；程序修改也不因产品语义已经明确而自动获得 execution permission。

### 5.5 Decision / Next-action Closure

Solution 应满足以下两条路径之一。

**A. Proposal path**

- proposal 足够 concrete；
- target 明确；
- change 明确；
- material unknown 已处理；
- verification bounded；
- 足以交给 Reviewer 判断。

**B. Non-proposal path**

- material unknown 明确；
- smallest discriminating check 明确；
- starting evidence 明确；
- progress / resume condition 明确；
- 或已经证明只剩真正的 authority / execution boundary。

本维度评价是否形成可审查、可接手的 closure，不把 `READY`、`ESCALATE` 或 `DEFER` 本身当作质量结论。

### 5.6 Investigation Convergence

只有某项调查同时满足以下三个条件，才要求 Participant 在当前 job 中继续：

- **Locally available**：当前 frozen workspace、frozen evidence 或允许使用的工具中可以获得；
- **Material**：结果可能实质改变 problem、causal、proposal 或 handoff 判断；
- **Bounded**：可以作为有限调查完成，而不是开放式研究。

三项全部满足：

```text
→ Participant 应完成该调查后再 handoff
```

任一条件不满足：

```text
→ Participant 可以合理停止，并通过 unknown / next action / escalation 表达
```

Investigation Convergence 不表示“把所有理论上可能调查的东西全部查完”。它只要求完成当前 job 中 locally available、material 且 bounded 的调查。

## 6. Rating Semantics

每个维度只允许以下 rating：

```text
SATISFIED
PARTIAL
NOT_SATISFIED
INCONCLUSIVE
N/A
```

| Rating | 语义 |
| --- | --- |
| `SATISFIED` | 当前 case evidence 足以确认该职责已完成。 |
| `PARTIAL` | 做对重要部分，但存在 material omission、calibration gap 或 closure gap。 |
| `NOT_SATISFIED` | 存在明确、material 且由 case evidence 支持的 Role failure。 |
| `INCONCLUSIVE` | 当前材料不足以可靠判断。 |
| `N/A` | 该维度在当前 candidate 上客观不适用。 |

`INCONCLUSIVE` 是正常结果。它表示 evidence 不足以支持可靠 rating，不得被强行转换成 failure 或 success。

本文不定义数值总分、权重、PASS threshold 或任何聚合规则；不存在“5/6 合格”之类的判断。

## 7. Pairwise Comparison

Historical 和 Candidate 必须先分别独立评价，再进行比较。Pairwise comparison 只允许：

```text
BETTER
NEUTRAL
WORSE
INCONCLUSIVE
```

比较结果必须列出：

- Improved；
- Regressed；
- Unchanged weakness / strength。

Pairwise comparison 不得依据：

- 输出长度；
- 更谨慎；
- 更敢修改；
- terminal status；
- 是否 `READY`；
- 是否 `ESCALATE`；
- 是否 `DEFER`；
- 与 historical answer 的相似程度。

Pairwise comparison 判断 working-method change 对 Role work quality 的证据差异，不判断哪个 Participant 的语言更像预设结论。允许 `INCONCLUSIVE` 成为最终结果；不要求每次实验产生 winner。

## 8. Gold-answer prohibition

以下边界继承 PD-055，并适用于本方法的全部 replay 与 comparison：

```text
Historical Solution != gold answer
Historical Reviewer != gold answer
Historical route != expected correct route
Case Anchor != prescribed solution
Replay candidate != proof of improvement
```

因此：

- 不把 historical Solution 或 historical Reviewer 当成标准答案；
- 不把历史 route 变成 expected correct route；
- 不把 Case Anchor 写成 prescribed solution；
- 不把 replay candidate 的出现当成 improvement proof；
- 不把 Participant 主观判断改写成 qualification、考试或 gold-answer 一致性。

Fixed Case 固定的是输入条件，不固定主观结论。评价判断的是 Role work quality，不是语言模型是否复述历史结果。

## 9. Baseline Cases

以下三个 case 是当前第一批已验证本方法的 baseline。它们只用于诊断用途，不永久写死任何 rating，也不构成标准答案：

| Case | 主要诊断覆盖 |
| --- | --- |
| `ordinary-run-20260910-000005-round-1` | configuration surface vs product authority；locally-resolvable repository investigation；premature handoff。 |
| `ordinary-run-20260910-000006-round-1` | evidence completeness；full-cycle reasoning；causal attribution boundary；bounded next action；Contract Conformance 与 Role Quality 分层。 |
| `ordinary-run-20260910-000007-round-1` | multiple causal candidates；program/runtime scope recognition；discriminating local investigation；premature recommendation / termination。 |

这些 case 不是 exhaustive corpus，也不是 qualification suite。后续 case 的 rating 必须依据其自身 frozen evidence 和 applicable authority，不能从上述 case 推导预设结果。

## 10. Current Evidence Status

当前阶段结论为：

- Evaluation methodology 已经在三个不同真实 Fixed Case 上使用；
- 六维能够产生有证据支撑且不依赖 gold answer 的诊断；
- 因此当前状态为 `EVALUATION_V1_READY`；
- Investigation Convergence 是三个 case 中重复出现的 weakness；
- 当前证据不足以把它声明为所有 Solution run 的系统性缺陷；
- `000006` 的一次 schema-invalid replay 属于 Contract Conformance evidence，不属于六维 Role Evaluation candidate。

上述是当前 methodology evidence status，不是新的 Product Decision，不产生新的产品语义或 implementation authorization。

## 11. Intended Use

未来标准流程：

```text
Frozen Case
→ run controlled Solution replay
→ Contract Conformance Gate
→ build / verify Objective Case Anchors
→ independently evaluate candidate
→ independently evaluate baseline
→ pairwise comparison
→ decide whether working-method change improved Role quality
```

如果修改 Solution working method，必须保持同组 Fixed Case 做回归，再使用少量新的 natural run 检查泛化。

两类运行职责不同：

```text
Natural Run
= 发现真实分布和新案例

Fixed Replay
= 控制变量、诊断 Step、回归比较
```

Natural Run 不能替代 controlled replay 的控制变量；Fixed Replay 也不能替代自然分布 evidence。两者都不自动授权 prompt / Skill / runtime repair。

## 12. Non-goals

当前 v1 不建设：

- automated evaluator；
- LLM judge；
- quality score；
- CI gate；
- gold answer；
- expected route；
- case qualification；
- precision / recall；
- automatic corpus promotion；
- automatic Participant repair；
- prompt tuning；
- Reviewer evaluation methodology；
- execution permission expansion。

## 13. Revisit Conditions

只有出现以下证据，才重新设计 v1：

- 新真实 case 出现重要 Role failure，而六维无法表达；
- 两个维度在多个 case 中无法稳定区分；
- Investigation Convergence 的 available / material / bounded 判定持续产生歧义；
- Human evaluator 无法基于同一 evidence 稳定解释 rating；
- 自动评价出现独立、经过验证的产品 / 工程需求。

重新设计只解决已出现的证据缺口，不因一次 rating、一次 terminal outcome 或某个 case 的相似性而自动扩展为评分、资格或执行系统。
