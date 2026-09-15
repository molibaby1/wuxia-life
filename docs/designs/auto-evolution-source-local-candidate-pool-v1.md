# Auto Evolution Source-local Candidate Pool / Multi-candidate Session v1

> 状态：HUMAN-ACCEPTED / WRITTEN SPEC REVIEW ACCEPTED；IMPLEMENTATION DELIVERED / CLOSURE VERIFICATION COMPLETE
> 日期：2026-09-15
> 目标 authority：PD-118（本书面 spec 已获 Human 认可；需与 `docs/product/auto-evolution-model.md`、`docs/governance/product-decisions.md`、`docs/governance/current-product-stage.md` 同步落库）
> 本文是工程设计，不是 runtime implementation authorization。

## 1. Problem Statement

当前 Auto Evolution 的 Improvement Hypothesis 可以形成 `0..N` 条 hypothesis，但 active workflow 通过 `selectFirstHypothesis` 只让第一条进入 Problem Package → Solution → Reviewer → Decision。

这个结构实际把两个不同事实合并：

```text
当前 candidate 已完成处理
≈
当前 source 已无其他值得处理的 candidate
```

真实 RUN / OBSERVE evidence 已经暴露：一个 Hypothesis Set 中可以同时存在多条合法 candidate，而首项普通 terminal outcome 会让其余 candidate 没有 substantive disposition 地退出 active workflow。

本设计不通过更聪明的 Selector、ranking、score 或 LLM 选择器修复这个问题。目标是移除“winner-takes-all Selection”语义，同时保留现有单问题 investigation lane、PD-111 evidence isolation、HFL 边界和 bounded source-changing execution。

核心 invariant：

> **candidate terminal != candidate pool exhausted**

## 2. Design Goals

v1 必须做到：

- 保留同一 exact Hypothesis Set 中全部合法 candidate；
- Host 按确定性原始顺序逐个激活 candidate；
- participant order 只影响处理延迟，不决定 survival / investigation capability；
- 每个 candidate 独立获得现有单问题 lane 和 bounded continuation 能力；
- 普通 `SKIP / DEFER / ESCALATE_HUMAN / terminal DEFER_MORE_WORK_REQUESTED` 结束 candidate，但不结束 Pool；
- Host invocation 保持有界，并允许在 candidate boundary 暂停 / resume；
- source-changing execution 成功后显式 supersede 旧 Source Epoch 尚未调查的 candidate；
- Session 不合成单一 product route；
- Report 能表达多个 candidate facts 与多个 Human next actions；
- HFL、PD-111、fail-closed provenance / scope / verification 边界不因本设计放宽。

## 3. Non-goals

v1 不建设：

- LLM Selector；
- semantic ranking / priority score；
- semantic candidate filter；
- cross-source candidate matching / rebinding；
- semantic deduplication / merge；
- global backlog；
- generic task queue；
- distributed scheduler；
- Human task scheduler；
- generic event-sourcing platform；
- new reasoning Role；
- model switching；
- broader PD-111 evidence；
- multiple source-changing executions per Logical Session；
- autonomous program/code modification；
- Report Analysis Agent；
- full P3 expansion。

Candidate Pool 只是同一 sealed source 已经形成的 improvement candidates 的最小可恢复 Host lifecycle。

## 4. Core Architecture

目标数据流：

```text
Logical AE Session
│
├─ Source Epoch A
│   │
│   ├─ External Feedback A
│   ├─ Improvement Hypothesis Set A
│   └─ Candidate Pool A
│       ├─ H1 → Candidate Lane → disposition
│       ├─ H2 → Candidate Lane → disposition
│       ├─ H3 → Candidate Lane → READY
│       └─ H4/H5 → superseded after source change
│
├─ authorized configuration execution
├─ scope verification
├─ deterministic verification
├─ real runtime rerun
│
└─ Source Epoch B
    ├─ External Feedback B
    ├─ Improvement Hypothesis Set B
    └─ Candidate Pool B
```

现有 Problem Package → Solution → Reviewer → Decision 继续作为单 Candidate Lane。主要变化发生在该 lane 外部的 Orchestrator / Host lifecycle。

## 5. Selection Retirement and Candidate Activation

当 Improvement Hypothesis 输出为 `0` 时，继续使用现有 `noProblemAssessment` 语义，不创建 synthetic candidate。

当输出为 `1..N` 时，每条合法 hypothesis 都成为当前 Source Epoch 的 candidate。

原 hypothesis 顺序只定义：

```text
deterministic processing order
```

不定义：

```text
importance
quality
priority
survival
```

Host 使用纯机械 Candidate Activation：

```text
find first PENDING candidate by original hypothesis order
→ admission check
→ activate
```

Candidate Activation：

- 不是 Role；
- 不调用 Participant；
- 不比较 candidate 质量；
- 不打分；
- 不重新排序；
- 不过滤合法 hypothesis。

因此 active path 中 `selectFirstHypothesis` 的 winner-selection 职责退出。

## 6. Identity Model

正式区分四层 identity：

```text
Logical AE Session
  └─ Source Epoch
       └─ Candidate Pool
            └─ Candidate Lane
```

### 6.1 Logical Session

Logical Session 跨多个 Host execution slices 保持同一 identity：

```text
logical session != host invocation
```

一次 process / CLI invocation 只是一个 execution slice，不自动产生新的 Logical Session。

### 6.2 Source Epoch

每份 exact sealed runtime source 是一个 Source Epoch。

Source Epoch identity 必须锚定 exact source run / seal / fingerprint。Source-changing execution 成功产生新 sealed source 后，形成新 Source Epoch。

### 6.3 Pool identity

Pool identity 机械绑定：

```text
logicalSessionId
+ sourceRunRef
+ sealed source identity / fingerprint
+ exact hypothesis-set identity / hash
```

它不包含 semantic topic、priority、natural-language similarity 或跨 run issue identity。

### 6.4 Candidate identity

Candidate 必须保留原始 Hypothesis Set 中的：

```text
hypothesisId
sourceIndex
hypothesisSha256
```

完整 identity 由 `(poolId, original hypothesis identity)` 唯一确定。

不得因为抽出单 candidate 进入 downstream workflow 而重新编号为 `hypothesis-000001`。

Candidate identity 不跨 Source Epoch。Source B 中语义类似于 Source A 某 candidate 的 hypothesis，仍然是 Source B 的新 candidate；v1 不做 semantic continuity inference。

## 7. Candidate Lifecycle

Candidate processing lifecycle：

```text
PENDING
  ↓
ACTIVE
  ↓
├─ COMPLETED
├─ SOURCE_CHANGE_PENDING
└─ INTERRUPTED

另有：SUPERSEDED
```

Processing state 与产品 disposition 必须正交。

例如：

```text
processingState = COMPLETED

effectiveDecision:
  route = DEFER
  reasonCode = INSUFFICIENT_EVIDENCE
```

`COMPLETED` 仅表示该 candidate 在当前 Source Epoch 已获得正式 disposition，不表示问题永久解决。

### 7.1 Ordinary terminal dispositions

以下 ordinary effective outcomes 完成当前 candidate 后，Host 继续处理下一条 PENDING candidate：

```text
SKIP
DEFER
ESCALATE_HUMAN
terminal DEFER_MORE_WORK_REQUESTED
```

`ESCALATE_HUMAN` 仍按现有 HFL rule 创建 retained Human item；该 HFL item 默认不阻塞当前 Pool 继续处理其他 candidates。

### 7.2 SOURCE_CHANGE_PENDING

有效 `READY_FOR_CONFIG_EXECUTION` 不作为普通 `COMPLETED` 处理。

它把 candidate 与 Pool 推入 source-change barrier：

```text
candidate = SOURCE_CHANGE_PENDING
pool = SOURCE_CHANGE_BARRIER
```

Host 暂停激活后续 candidate，等待 / 执行已有授权的 configuration execution 路径。

### 7.3 INTERRUPTED

Participant failure、Host crash 后无可靠 terminal artifact、provenance / integrity failure 等不得伪装成 `DEFER` 或 `SKIP`。

此类情况使用 `INTERRUPTED` / fail-closed Session semantics。

### 7.4 SUPERSEDED

只有成功完成 source-changing execution、verification、real rerun 并形成 valid sealed Source B 后，旧 Source A Pool 中仍 `PENDING` 的 candidates 才进入 `SUPERSEDED`。

这不表示 candidate 无价值，只表示其 evidence basis 绑定旧 Source A，不得假定对 Source B 仍成立。

## 8. Candidate Lane

每一个 ACTIVE candidate 独立进入现有单问题 lane：

```text
ACTIVE Candidate
↓
bounded causal attribution
↓
Problem Package
↓
Solution
↓
Reviewer
↓
optional bounded continuation
↓
effective Decision
```

现有 Solution / Reviewer reasoning responsibilities 不因 Candidate Pool 改写。

## 9. PD-111 Evidence Handoff

PD-111 的安全边界保持。

原语义：

```text
diagnostic scope = selectedHypothesis.evidenceRefs
```

更新为：

```text
diagnostic scope = activeCandidate.evidenceRefs
```

新的 active path：

```text
activateCandidate
→ buildBoundedCausalAttribution(activeCandidate.evidenceRefs)
→ buildProblemPackage v2
→ Solution / Reviewer receive byte-identical bounded diagnostic evidence
```

仍然禁止：

- raw Phase0 `internal/player-surface-source.json` 进入 Participant workspace；
- nearby / same-storyline / longitudinal evidence expansion；
- seed / persona；
- GameState / hidden flags / lifeStates；
- stateDelta / effects；
- RNG；
- candidate pools；
- weights / probabilities；
- full catalog；
- full internal trace；
- 未属于当前 active candidate observable scope 的 producer identities。

Pool 中存在其他 candidates 不得扩大当前 active candidate 的 diagnostic scope。

## 10. Candidate-local Bounded Continuation

保留 PD-117 continuation 形状：

```text
first REQUEST_MORE_WORK in this Candidate Lane
→ one fresh Solution revision
→ if revised Solution returns OPTIONS, one fresh independent Reviewer
→ continuation Decision becomes effective Decision
```

Base Decision 保持 immutable evidence。

但 continuation ownership 从 session-wide 改为 candidate-local：

```text
at most one continuation per Candidate Lane
```

每条 candidate 因而拥有相同 bounded investigation capability。

一个 Candidate Lane 的最大 semantic Participant path：

```text
Solution
Reviewer
fresh Solution revision
fresh Reviewer
```

即最大 4 个 semantic Participant jobs。

第二个 `REQUEST_MORE_WORK` 仍终止为 `DEFER_MORE_WORK_REQUESTED`。

Ordinary semantic retry 继续为 `0`；既有 envelope retransmission 仍是 transport recovery，不构成新的 semantic reasoning round。

## 11. Host Execution Slice Budget

Logical Session 可以跨多个 Host execution slices。

v1 保留现有单次 bounded envelope 数字：

```text
maxTotalParticipantJobsPerHostSlice = 11
```

这里的 11 不再解释为整个 Logical Session 的总 Participant job 上限，而是单次 Host invocation 的 hard workflow slice budget。

所有本 slice 内 Participant calls 均计入，包括该 slice 内新发生的 Feedback / Hypothesis / Candidate Lane / allowed execution calls。

### 11.1 Admission check

Host 只允许在能够为 Candidate 最大合法 lane 保留足够容量时激活它。

概念规则：

```text
candidate lane max = 4 jobs

if one source-changing execution is still available:
    conservative admission capacity = 5
else:
    conservative admission capacity = 4
```

额外 1 job 用于现有 bounded configuration execution Participant path；这是保守 admission ceiling，不表示每个 candidate 一定实际消耗 4/5 jobs。

### 11.2 Budget boundary

Budget 只能在 candidate boundary 正常截断。

禁止：

```text
Candidate ACTIVE
→ Solution done
→ global budget exhausted
→ force DEFER
```

当剩余 budget 不足以安全激活下一 PENDING candidate：

```text
Session = PAUSED
pauseReason = HOST_SLICE_BUDGET
```

下一 candidate 保持 PENDING。

Budget pause 是 Host execution state，不是 candidate product disposition。

## 12. Host Invocation Modes

Host primitive 必须明确区分：

```text
START_NEW_SESSION
RESUME_SESSION
```

Resume 必须显式指定 Logical Session identity。

禁止：

- 猜测“最新 unfinished session”；
- 自动挑某个 pending Pool；
- 重新生成 Hypothesis Set 代替恢复；
- 隐式切换 Participant binding。

## 13. Durable Operational State

Candidate Pool 必须是 durable、可恢复的 Host workflow state，但不能成为 generic backlog。

最小持久化职责：

```text
session identity
source identity
hypothesis-set identity
repository / workspace baseline
Participant binding
Pool state
candidate states
artifact refs
disposition refs
transition history
```

Pool 只保存 workflow facts + references，不复制 Participant reasoning。

例如：

```text
candidate H2:
  processingState = COMPLETED
  effectiveDecisionRef = candidates/hypothesis-000002/decision.json
```

Solution / Reviewer / Decision 正文继续由各自 immutable artifacts 保存。

正常 resume 不能只依赖可能被清理的 `.tmp/evolution/**`。需要 durable operational state 与 durable immutable source/evidence anchors。

最终物理 storage path 必须在 implementation planning 中结合 authoritative product fingerprint scope 决定；Host 自己写 operational state 不得造成伪 `AUTHORITATIVE_REPOSITORY_CHANGED`，但也不得通过弱化 fingerprint 规避真实 product-source mutation。

## 14. Candidate Pool Contract

建议新 canonical contract，不继续把新模型塞进 `multi-round-run-manifest-v3`。

建议命名：

```text
candidate-pool-v1
multi-candidate-session-manifest-v1
multi-candidate-session-summary-v1
```

旧 `multi-round-*` contracts 继续作为 legacy read contracts。

概念 Pool shape：

```text
CandidatePoolV1 {
  schemaVersion

  poolId
  logicalSessionId

  source {
    sourceEpochId
    sourceRunRef
    sourceFingerprintSha256
    sealedSourceRef
  }

  hypothesisSet {
    artifactRef
    sha256
    count
  }

  baseline {
    branch
    headSha
    workingTreeFingerprint
    participantBinding
  }

  status
  candidates[]
  transitions[]
}
```

Pool status 至少表达：

```text
PROCESSING
SOURCE_CHANGE_BARRIER
EXHAUSTED
SUPERSEDED
INTERRUPTED
```

## 15. Candidate Record Contract

概念 shape：

```text
CandidateRecordV1 {
  candidateRef
  hypothesisId
  sourceIndex
  hypothesisSha256

  processingState
  laneRef

  baseDecisionRef
  effectiveDecisionRef

  humanFollowupRef
  sourceTransitionRef
  interruptionRef
  supersededBySourceEpochRef
}
```

Semantic disposition 继续由 existing Decision route / reasonCode artifacts 拥有；Candidate lifecycle 不复制一套 route enum。

## 16. Candidate Activation Algorithm

Candidate activation 必须是 deterministic Host logic：

```text
assert Pool.status == PROCESSING
assert no ACTIVE candidate
find minimum sourceIndex where state == PENDING
perform admission check
mark candidate ACTIVE atomically
run Candidate Lane
```

若没有 PENDING candidate：

```text
Pool → EXHAUSTED
```

不调用 Agent 决定“下一条处理谁”。

## 17. Zero-hypothesis Path

当 Hypothesis Set 为零：

```text
noProblemAssessment required
Candidate Pool contains zero candidates
Source Epoch completes without Candidate Lane
```

不得生成 synthetic candidate 或伪造 Selection artifact。

## 18. Candidate Lane Artifact Layout

多个 candidates 不能共享会互相覆盖的：

```text
problem-package.json
solution-agent/result.json
reviewer-agent/review.json
decision.json
```

概念 layout：

```text
source-epoch-000001/
  hypotheses/...

  candidates/
    hypothesis-000001/
      problem-package.json
      diagnostic/
      solution-agent/
      reviewer-agent/
      decision.json
      review-continuation-000001/

    hypothesis-000002/
      ...
```

实际 repository-relative root 在 implementation plan 中映射现有 workspace conventions，但必须满足：

- candidate identity 稳定；
- lane artifacts 不互相覆盖；
- refs 是 safe relative paths；
- HFL retention 能从 exact candidate lane 保留所需 evidence。

## 19. Selection Artifact Migration

新的 active path 不再把：

```text
selection/selected-hypothesis.json
```

作为唯一赢家证据。

需要保留的 provenance 是：

```text
original hypothesis set
candidate identity
candidate sourceIndex
candidate activation transition
```

当前 HFL retention 仍显式复制 legacy Selection artifact。实现迁移必须让新 candidate lane 保留 candidate activation / hypothesis provenance，而不是为兼容 HFL 伪造一个 winner-selection artifact。

历史 HFL items 不迁移、不重写。

## 20. Resume Validation

Resume 前必须机械验证：

```text
session contract
logical session identity
source seal / source hash
hypothesis-set hash
candidate records and mapping
repository branch
HEAD
working-tree / authoritative fingerprint
Participant binding
transition-history consistency
```

任一 identity / baseline mismatch：

```text
fail closed
```

禁止：

```text
auto semantic repair
silent rebase
regenerate hypotheses
change Participant binding
rebind old candidates to a new source
```

## 21. Crash Reconciliation

正常 budget pause 时禁止留下 ACTIVE candidate。

异常 process termination 后若 Pool 中存在 ACTIVE candidate：

### Case A — terminal artifact complete

若已有完整且 Contract-valid 的 effective terminal artifacts：

```text
Host deterministic reconciliation
→ complete Pool transition from immutable artifacts
```

该动作不是 semantic retry，不重新调用 Participant。

### Case B — terminal artifact incomplete

若没有可靠 terminal artifact：

```text
candidate → INTERRUPTED
session → INTERRUPTED / fail-closed handling
```

不自动重新调用 Participant 以补完原 candidate。

## 22. Source-change Barrier

有效 `READY_FOR_CONFIG_EXECUTION` 后：

```text
candidate = SOURCE_CHANGE_PENDING
pool = SOURCE_CHANGE_BARRIER
```

若 configuration execution 仍需独立授权：

```text
Session = PAUSED
pauseReason = AWAITING_CONFIGURATION_EXECUTION_AUTHORITY
```

在 mutation 是否会改变 observation basis 未决时，不继续调查同 Source 的后续 candidate。

只有全部成立才创建 Source Epoch B：

```text
authorized configuration execution
scope verification PASS
deterministic verification PASS
real runtime rerun PASS
new source sealed and valid
```

随后 Source A 中仍 `PENDING` 的 candidates：

```text
→ SUPERSEDED
supersededBySourceEpochRef = Source B
```

Execution failure / scope violation / verification failure / rerun failure 不创建 Source B，也不把旧 PENDING candidates 标记为 superseded；Session fail closed。

## 23. Source-change Limit

v1 保留现有 bounded P2 authority：

```text
maxSourceTransitionsPerLogicalSession = 1
```

Source B 中若再次有 candidate 得到 READY：

```text
candidate = SOURCE_CHANGE_PENDING
session = PAUSED
pauseReason = SOURCE_CHANGE_LIMIT_REACHED
```

不自动执行第二次 mutation。

这不是 candidate rejection，也不是 Pool exhausted；它是明确、可审计的 authority boundary。

## 24. Session Lifecycle

新 Session 只表达 workflow lifecycle：

```text
PROCESSING
PAUSED
COMPLETED
INTERRUPTED
FAILED
```

`COMPLETED` 只表示 logical workflow closure，不等价于：

```text
success
no problem
product improved
```

Candidate 才拥有 product disposition。

新 Session Contract 不应再合成：

```text
overallRoute
dominantRoute
highestPriorityRoute
lastCandidateRoute-as-session-outcome
```

## 25. Participant / Host Failure Semantics

v1 不新增“某 candidate Participant failure 后自动跳过并继续下一 candidate”的 recovery capability。

Participant failure、repository/provenance integrity failure、scope violation、deterministic verification failure、invalid sealed source 等继续 fail closed。

这些 failure：

- 不伪装成 `DEFER`；
- 不伪装成 `SKIP`；
- 不自动完成其余 PENDING candidates；
- 不新增 semantic retry。

## 26. HFL Integration

每个 effective `ESCALATE_HUMAN` candidate 独立创建 HFL item。

多个 candidates 可以产生多个 HFL items。

Pool 只保存：

```text
humanFollowupRef
```

HFL 继续独立维护自己的 operational lifecycle。Candidate Pool 不负责：

- Human review lifecycle；
- semantic dedupe；
- priority；
- merge；
- formal task conversion。

PD-100 trigger scope 不变：只有正式 effective `ESCALATE_HUMAN` 自动创建 retained Human Follow-up state。

## 27. Session Manifest / Summary

新的 Session manifest 不保存单一 product route。

概念字段：

```text
logicalSessionId
sessionState
pauseOrStopReason

limits
budgetAccounting

sourceEpochs[]
currentSourceEpochRef

hostSlices[]
sourceTransitionCount
failureRef
```

每个 Source Epoch summary 至少包含：

```text
sourceRunRef
poolRef
poolStatus

candidateCounts {
  total
  pending
  active
  completed
  superseded
  interrupted
}

dispositionCounts {
  SKIP
  DEFER
  ESCALATE_HUMAN
  READY_FOR_CONFIG_EXECUTION
  ...
}
```

`dispositionCounts` 只是 observability facts，不是 route precedence。

## 28. Run Report Snapshots

一个 Logical Session 可以跨多个 Host slices，并产生多个 immutable Report Snapshots：

```text
one Logical Session
→ snapshot #1
→ snapshot #2
→ snapshot #3
```

每个 snapshot 必须声明：

```text
logicalSessionId
hostSliceId
sessionStateAtSnapshot
```

历史 snapshot 不重写。

Report snapshot identity 与 Logical Session identity 必须分离。

## 29. Human Review Projection

当前单-workflow Human Review projection 假定一个 run 可以归纳为一个主要 route / next action；多 Candidate Session 不再满足该假设。

新 projection 基于完整 Session facts，并支持：

```text
actions[]
```

Action 至少可以表达：

```text
RESUME_SESSION
REVIEW_HUMAN_FOLLOWUP
INVESTIGATE_HOST_FAILURE
AWAIT_EXECUTION_AUTHORITY
OPTIONAL_DECISION_AUDIT
```

每个 action 应明确：

```text
required / optional
blocksResume
candidateRef if applicable
humanFollowupRef if applicable
```

同一 Session 可以同时存在非阻塞的：

```text
RESUME_SESSION
+
REVIEW_HUMAN_FOLLOWUP
```

不得通过 route precedence 强行产生“唯一正确 next action”。

Report Producer 仍然是 deterministic observability projection，不判断 Participant 是否主观正确，也不获得 routing authority。

## 30. Operational Index

当前 operational index 以 archived report 为顶层 run 条目。新模型下，同一 Logical Session 多个 snapshots 不能被统计为多次 independent natural AE sessions。

新 index 顶层按：

```text
logicalSessionId
```

聚合。

Human 默认看到每个 Logical Session 的 latest snapshot，并可向下查看历史 snapshots。

必须区分：

```text
logicalSessionCount
reportSnapshotCount
```

## 31. Durable Evidence Semantics

需要区分：

```text
recoverable Source Epoch evidence
```

与：

```text
terminal Logical Session forensic archive
```

PAUSED Session 可以拥有完整可恢复 evidence，但不得因此宣称整个 Logical Session 已 forensic-complete。

现有 Durable Evidence Capsule 的 hash / integrity / retention 思路可以复用，但 mutable Candidate Pool state 不得伪装成 immutable final capsule。

## 32. Legacy Compatibility

历史以下 artifacts 继续只读可解析：

```text
multi-round-run-manifest-v1/v2
multi-round-session-summary-v1/v2
operational report v1..v6
legacy selection artifacts
historical HFL items
```

不 rewrite。

不 backfill candidate pools。

不根据历史 `selectFirstHypothesis` 猜测未处理 candidates 的 disposition。

新的 ordinary sessions 才使用新的 multi-candidate contracts。

## 33. Error Handling Invariants

必须保持：

```text
no Host semantic repair
no automatic semantic retry
no stale-source continuation
no baseline guessing
no missing-artifact success inference
no source-change success before sealed rerun
```

缺失信息只能形成明确 unavailable / interrupted / failed state，不能补造成功或产品 disposition。

## 34. Acceptance Scenarios

| Scenario | Required result |
| --- | --- |
| 0 hypotheses | 保留 `noProblemAssessment`；无 synthetic candidate |
| H1 SKIP, H2 exists | H1 `COMPLETED`；自动进入 H2 |
| H1 DEFER, H2 exists | H1 `COMPLETED`；自动进入 H2 |
| H1 ESCALATE, H2 exists | 创建 HFL；继续 H2 |
| H1 uses continuation, H2 requests more work | H2 仍拥有自己的一次 continuation |
| Host slice budget 不足启动 H3 | 在 H3 前 `PAUSED`；H3 保持 `PENDING` |
| resume exact session | 不重跑 Feedback/Hypothesis；激活 exact next PENDING |
| repository/product baseline changed | fail closed；不 silent resume |
| crash after valid Decision before Pool update | deterministic reconciliation |
| crash before valid terminal artifact | candidate/session interrupted；无 semantic retry |
| H3 READY → successful new source | 旧 source 剩余 PENDING → `SUPERSEDED`；创建 Source B |
| execution fails | 不 supersede；Session fail closed |
| Source B candidate READY | pause at source-change limit；不执行第二次 mutation |
| two candidates ESCALATE | 创建两个独立 HFL items |
| mixed SKIP + DEFER + ESCALATE | Report 不合成 overall route |
| PAUSED + active HFL | Human view 同时显示 resume 与 Human review actions |
| archived v1/v2 reports | 继续可读且不迁移 |

## 35. Verification Strategy

工程实施阶段至少需要四层验证：

```text
Contract tests
State-machine unit tests
Host integration tests
Observability / legacy compatibility tests
```

完成性验证不能只看“测试绿色”，还必须证明以下正式语义：

> 多 candidate 不再因为前一个 candidate 的 ordinary terminal disposition、前一个 candidate 消耗 continuation、或 Host slice boundary，而无理由失去 investigation opportunity。

同时必须验证：

- PD-111 scope 未扩大；
- HFL trigger 未扩大；
- semantic retry 仍为 0；
- source-changing execution 仍最多一次 / Logical Session；
- baseline mismatch / provenance / scope / verification failure 继续 fail closed；
- legacy reports / manifests / HFL evidence 继续可读。

## 36. Implementation Scope Boundary

后续 implementation plan 只允许覆盖完成本 v1 所必须修改的：

- Candidate Pool / Session contracts；
- Host orchestration；
- candidate lane artifact isolation；
- deterministic activation / resume；
- candidate-local continuation accounting；
- source-change barrier integration；
- HFL candidate provenance handoff；
- Run Report / Human projection / index aggregation；
- legacy-read compatibility；
- tests / verification。

不得借本项目：

- 重写 Participant prompts 的产品判断；
- 建立 semantic ranking；
- 建设 generic scheduler / queue；
- 扩大 config / code execution authority；
- 引入第二次 source transition；
- 重做 HFL；
- 建设 general workflow engine；
- 打开 full P3。

## 37. Authority Synchronization Required Before Implementation Planning

本书面 spec 经 Human review 后，应在同一 authority-sync change 中：

1. 更新 `docs/product/auto-evolution-model.md`：
   - `selectedHypothesis` → `activeCandidate`；
   - `selectFirstHypothesis` winner path → Source-local Candidate Pool + deterministic activation；
   - ordinary candidate terminal 不再结束 Pool；
   - continuation 改为 candidate-local；
   - 11 Participant jobs 改为 per Host slice；
   - Logical Session / Host slice 分离；
   - source-change barrier、one-transition ceiling；
   - Session 不合成 product route；
   - Report 支持 multiple candidate facts / actions。

2. 更新 `docs/governance/product-decisions.md`：
   - 追加 Human-accepted PD-118；
   - 明确与 PD-100 / PD-111 / PD-117 / P2 的 supersede / retained boundary；
   - 校正文档 `最后更新` 日期。

3. 更新 `docs/governance/current-product-stage.md`：
   - 记录 PD-118 / 本设计 accepted；
   - implementation 已完成，closure verification 已完成；
   - 当前 next step 为在新 workflow 基础上继续 RUN / OBSERVE；
   - 不继续通过 ordinary runs 重复证明已确认的 Selection bottleneck。

上述 authority sync 已完成；本设计对应的 runtime implementation 已完成，并已通过本 repair plan 的 closure verification。

## 38. Governance Relationship

目标 PD-118 的正式调和关系：

| Existing authority | v1 effect |
| --- | --- |
| PD-111 player-observable / diagnostic evidence boundary | 保留 |
| PD-111 `selectedHypothesis` / `selectFirstHypothesis` active-path wording | 局部 supersede：改为 `activeCandidate` / deterministic activation |
| PD-117 continuation shape | 保留 |
| PD-117 one continuation per session | supersede：one per candidate |
| PD-117 max 11 jobs per whole session | supersede：11 jobs per Host slice |
| PD-117 ordinary semantic retry = 0 | 保留 |
| PD-100 HFL trigger scope | 保留 |
| P2/current one source-changing transition | 保留 |
| provenance / scope / verification fail-closed boundaries | 保留 |

## 39. Re-open Conditions

只有真实 evidence 表明以下任一情况成立，才重开本 v1 的对应边界：

- participant order 作为 scheduling order 本身造成 material starvation；
- 11-job Host slice 无法在 bounded latency 下提供合理 throughput；
- Source B 必须可靠继承 Source A pending work；
- 需要超过一次 source-changing transition；
- Candidate-level Participant failure 需要安全隔离而不是 Session fail closed；
- 需要跨 Source / Session semantic dedupe、priority 或 merge；
- PD-111 evidence boundary 无法支撑 candidate investigation；
- Source-local Pool 无法在不建设 generic queue 的情况下稳定恢复。
