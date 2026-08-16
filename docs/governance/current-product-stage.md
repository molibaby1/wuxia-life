# Wuxia-Life 当前产品阶段

用途：滚动看板——回答「现在做到哪、允许做什么、禁止做什么」。
不是长期产品规范，不是实施流水账。

最后更新：2026-08-16（Skeleton 001–007 = CLOSED / Human accepted；Second-Problem Transfer Experiment = CLOSED / Human accepted；Modification Work Uncertainty Preservation Experiment = CLOSED / Human accepted；Fresh-Problem Candidate Transfer Experiment = CLOSED / Human accepted；Longitudinal Investigation Evidence Experiment = CLOSED / Human accepted；Cross-Run Cohort Investigation Evidence Experiment = ACTIVE / Human final review pending；Candidate C = experimental baseline only；origin promotion / production retain / autonomous loop / next evolution = NOT AUTHORIZED）

---

## 1. 当前产品目标

做一款能被玩家认真过完一生的武侠人生游戏。

Auto Evolution 当前属于高不确定性的探索型研发。Human 已明确将当前研发优先级从“继续细化下一角色”切换为：

> **先验证完整飞轮最关键的工程骨架，再逐步替换 Mock。**

Skeleton 001–007 已 **CLOSED / Human accepted**。

**Second-Problem Transfer Experiment** 已 **CLOSED / Human accepted**。

**Modification Work Uncertainty Preservation Experiment** 已 **CLOSED / Human accepted**。

证明（本固定实验）：

```text
Investigation epistemic handoff v2 = proven on this fixed case
Human review = UNCERTAINTY_PRESERVED
confirmed basis remained distinguishable from unresolved dependencies
participant-added unverified premises exposed as assumptions
proposal quality = NOT accepted or evaluated
no Product Decision on the proposal
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay = unchanged
single fixed case does NOT prove generalization to future Modification Work
```

Evidence（sealed，immutable）：

- `.tmp/evolution/second-problem-transfer/`
- `.tmp/evolution/modification-work-uncertainty-preservation/`

Fresh-Problem Candidate Transfer Experiment 已 **CLOSED / Human accepted**；当前没有 active evolution design / plan，下一项 evolution 工作仍 **尚未授权**。

**Cross-Run Cohort Investigation Evidence Experiment** 已由 Human 直接授权，当前为 **ACTIVE / Human final review pending**。真实 Investigation 已完成（exactly 1 call）；不得进入 Modification Work、生成 Candidate、修改 gameplay，或开启 successor experiment。

## 1.1 Fresh-Problem Candidate Transfer Experiment（CLOSED）

```text
Human Review = UNCERTAINTY_PRESERVED
Experiment = ACCEPTED / CLOSED
gameplay baseline = Candidate C experimental baseline
fresh persona = p8-scholar-su
seed = 101
real external calls = exactly 4
Improvement Hypothesis count = 2
selection rule = first_hypothesis_in_participant_order
selected hypothesis = hypothesis-000001
Investigation = completed with bounded current-product evidence
Modification Work v2 = no_proposal
Product Decision = NOT APPLICABLE
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay / origin = unchanged
MW v2 fresh-case epistemic generalization = supported on one fresh case
generalization to arbitrary future cases = NOT proven
origin promotion = NOT AUTHORIZED
production retain = NOT AUTHORIZED
autonomous loop = NOT AUTHORIZED
next evolution work = NOT AUTHORIZED
```

Evidence（sealed，immutable）：`.tmp/evolution/fresh-problem-candidate-transfer/`

## 1.2 Longitudinal Investigation Evidence Experiment（CLOSED）

```text
Longitudinal Investigation Evidence Experiment = CLOSED / Human accepted
Human review:
RETRIEVAL_ADEQUATE
INVESTIGATION_USED
UNCERTAINTY_PRESERVED
longitudinal-v1 bounded same-run retrieval = proven on this fixed case
same formal action longitudinal retrieval = proven
same explicit active-action resource relation = proven as bounded retrieval
Investigation used the newly supplied longitudinal evidence
genuine remaining uncertainty:
cross-run prevalence = NOT proven
resource income / full resource dynamics = NOT established
systemic balance problem = NOT proven
real calls = exactly 1
retry = 0
fixed run = ae-fresh-problem-transfer-001
fixed hypothesis = hypothesis-000001
Modification Work = NOT run
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay = unchanged
origin promotion / production retain / autonomous loop = NOT AUTHORIZED
next evolution work = NOT AUTHORIZED
```

Evidence：`.tmp/evolution/longitudinal-investigation-evidence/`（preserved，immutable）。
当前 STOP：本实验已闭合。不得重跑 Investigation、进入 Modification Work、生成 Candidate 或修改 gameplay。

本阶段只验证同一个 sealed run 内，Investigation 是否能沿正式 active-action identity 与显式 positive resource cost 关系补齐 bounded longitudinal player-observable evidence。不得修改 gameplay、Investigation participant prompt/response contract、旧 Fresh-Problem artifacts 或进入后续 evolution。

## 1.3 Cross-Run Cohort Investigation Evidence Experiment（ACTIVE — Human final review pending）

```text
Cross-Run Cohort Investigation Evidence Experiment = ACTIVE / Human final review pending
baseline = Candidate C experimental baseline only
cohort = exactly 8 preregistered P8 runs
anchor p8-scholar-su / seed 101 = excluded from cohort
endAge = 80
catalogVersion = 1.0.0
signal = exact player-observable pressure lines only
evidenceMode = cohort-v1
real Investigation calls = exactly 1
retry = 0
provider = deepseek
model = deepseek-v4-flash
investigationInvocationRef = ae-fresh-problem-transfer-001-hypothesis-000001-deepseek-hypothesis-investigation-cohort-001
Modification Work = NOT authorized / NOT run
Candidate = NOT authorized / NOT generated
gameplay = unchanged
Human final review = pending
```

Evidence（create-only）：`.tmp/evolution/cross-run-cohort-investigation-evidence/`

Human must independently decide:

1. `COHORT_RETRIEVAL_ADEQUATE` / `COHORT_RETRIEVAL_NOT_ADEQUATE`
2. `INVESTIGATION_USED_COHORT` / `INVESTIGATION_DID_NOT_USE_COHORT`
3. `UNCERTAINTY_PRESERVED` / `UNCERTAINTY_NOT_PRESERVED`

Descriptive cohort counts (including 8/8) are not population prevalence.

---

## 2. 当前 Authority

| 层级 | 文档 |
| --- | --- |
| 第一层产品规范 | `docs/product/player-model.md` / `docs/product/auto-evolution-model.md` |
| 治理 | `docs/governance/*` |
| Skeleton 001–007 | CLOSED 历史证据 |
| Second-Problem Transfer Experiment | CLOSED 历史证据 |
| Modification Work Uncertainty Preservation Experiment | CLOSED 历史证据 |

---

## 3. 能力状态

| 能力 | 状态 |
| --- | --- |
| Skeleton 001–007 | **CLOSED / Human accepted** |
| Second-Problem Transfer Experiment | **CLOSED / Human accepted** |
| Modification Work Uncertainty Preservation Experiment | **CLOSED / Human accepted** |
| Fresh-Problem Candidate Transfer Experiment | **CLOSED / Human accepted** |
| Longitudinal Investigation Evidence Experiment | **CLOSED / Human accepted** |
| longitudinal-v1 bounded same-run retrieval | **proven on this fixed case** |
| same formal action longitudinal retrieval | **proven** |
| same explicit active-action resource relation | **proven as bounded retrieval** |
| Investigation used newly supplied longitudinal evidence | **proven on this fixed case** |
| longitudinal genuine remaining uncertainty | **cross-run prevalence NOT proven；resource income / full resource dynamics NOT established；systemic balance problem NOT proven** |
| Investigation epistemic handoff v2（本固定实验） | **proven** |
| MW v2 fresh-case epistemic generalization | **supported on one fresh case** |
| proposal product acceptance | **NOT evaluated** |
| Product Decision for Fresh-Problem proposal | **NOT APPLICABLE** |
| Candidate C | **experimental baseline only** |
| Candidate | **NOT generated**（本实验） |
| Candidate transfer | **NOT proven** |
| origin promotion | **NOT AUTHORIZED** |
| production retain | **NOT AUTHORIZED** |
| autonomous loop | **NOT AUTHORIZED** |
| next evolution work | **NOT AUTHORIZED** |

---

## 4–9. Skeleton 001–006 历史

保持 immutable。006 corrective Candidate C：

```text
family-life: 3ef049dcf0ef77d47a0d2d6c1156488e678b8c4e54ead3c8e0b59dee794eb6c6
```

---

## 10. Skeleton 007 CLOSED 摘要

```text
human-decision.sha256: 9a1ce9cb1ab22774a36a5057f7446d3c7866eb6c6b55ad24e546eabf976196bd
Human Decision: ACCEPT_CANDIDATE
scope: experimental_next_baseline_only
selectedBaselineCommitSha: 74fb4fb3179f3ddeec78e3a43232ece0fc6e420f
runRef: ae-skeleton-007-next-baseline
post-run source == selected baseline == Candidate C
origin unchanged: true
```

Evidence：`.tmp/evolution/skeleton-007/phase-b/`

---

## 11. Second-Problem Transfer CLOSED 摘要

```text
runRef: minimal-external-feedback-smoke-001
hypothesisId: hypothesis-000001
Human Product Decision: REJECT_PROPOSAL
Candidate: NOT generated
Candidate transfer: NOT proven
origin gameplay behavior: unchanged
```

Evidence：`.tmp/evolution/second-problem-transfer/`

---

## 12. Modification Work Uncertainty Preservation CLOSED 摘要

```text
runRef: minimal-external-feedback-smoke-001
hypothesisId: hypothesis-000001
contractVersion: v2
real calls: exactly 1
resultKind: proposal
Human review: UNCERTAINTY_PRESERVED
epistemic handoff on the fixed case: proven
proposal product acceptance: NOT evaluated
Candidate: NOT generated
Candidate transfer: NOT proven
gameplay: unchanged
generalization to future Modification Work: NOT proven
```

Evidence（sealed，immutable）：`.tmp/evolution/modification-work-uncertainty-preservation/`

---

## 13. 当前授权 / 禁止（Human locked 2026-08-16）

```text
Candidate C:
experimental baseline only

Second-Problem Transfer Experiment:
CLOSED / Human accepted

Modification Work Uncertainty Preservation Experiment:
CLOSED / Human accepted
Human review = UNCERTAINTY_PRESERVED
epistemic handoff on the fixed case = proven
proposal product acceptance = NOT evaluated
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay = unchanged

Fresh-Problem Candidate Transfer Experiment:
CLOSED / Human accepted
Human review = UNCERTAINTY_PRESERVED
real external calls = exactly 4
Improvement Hypothesis count = 2
selection rule = first_hypothesis_in_participant_order
selected hypothesis = hypothesis-000001
Investigation = completed with bounded current-product evidence
Modification Work v2 = no_proposal
Product Decision = NOT APPLICABLE
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay / origin = unchanged
MW v2 fresh-case epistemic generalization = supported on one fresh case
generalization to arbitrary future cases = NOT proven

origin promotion:
NOT AUTHORIZED

production retain:
NOT AUTHORIZED

autonomous loop:
NOT AUTHORIZED

next evolution work:
NOT AUTHORIZED
```

---

## 14. STOP

```text
Skeleton 001–007 = CLOSED / Human accepted
Second-Problem Transfer Experiment = CLOSED / Human accepted
Modification Work Uncertainty Preservation Experiment = CLOSED / Human accepted
Fresh-Problem Candidate Transfer Experiment = CLOSED / Human accepted
Human review = UNCERTAINTY_PRESERVED
epistemic handoff on the fixed case = proven
MW v2 fresh-case epistemic generalization = supported on one fresh case
generalization to arbitrary future cases = NOT proven
proposal product acceptance = NOT evaluated
Fresh-Problem Product Decision = NOT APPLICABLE
Candidate C = experimental baseline only
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay = unchanged
origin promotion / production retain / autonomous loop / next evolution = NOT AUTHORIZED

Longitudinal Investigation Evidence Experiment = CLOSED / Human accepted
Human review = RETRIEVAL_ADEQUATE / INVESTIGATION_USED / UNCERTAINTY_PRESERVED
longitudinal-v1 bounded same-run retrieval = proven on this fixed case
same formal action longitudinal retrieval = proven
same explicit active-action resource relation = proven as bounded retrieval
Investigation used the newly supplied longitudinal evidence
genuine remaining uncertainty:
cross-run prevalence = NOT proven
resource income / full resource dynamics = NOT established
systemic balance problem = NOT proven
real Investigation calls = exactly 1
retry = 0
Modification Work = NOT run
Candidate = NOT generated
Candidate transfer = NOT proven
gameplay = unchanged
origin promotion / production retain / autonomous loop / next evolution = NOT AUTHORIZED

Cross-Run Cohort Investigation Evidence Experiment = ACTIVE / Human final review pending
cohort plan / eight Phase0 runs / cohort-v1 evidence = GENERATED
real Investigation = completed (exactly 1 call, retry = 0)
Human final review = pending
Modification Work / Candidate / gameplay modification = NOT AUTHORIZED
do not rerun Investigation, add seeds/personas, inspect resource dynamics, or start a successor experiment
```

## 15. 一分钟检查单

1. 001–007？→ CLOSED
2. Second-Problem Transfer？→ CLOSED / Human accepted；REJECT_PROPOSAL；Candidate transfer NOT proven
3. Uncertainty Preservation？→ CLOSED / Human accepted；UNCERTAINTY_PRESERVED；handoff proven on fixed case；proposal NOT evaluated；Candidate NOT generated
4. Fresh-Problem Candidate Transfer？→ CLOSED / Human accepted；4 calls；2 hypotheses；hypothesis-000001；no_proposal；Candidate NOT generated
5. Longitudinal Investigation Evidence？→ CLOSED / Human accepted；RETRIEVAL_ADEQUATE；INVESTIGATION_USED；UNCERTAINTY_PRESERVED；1 call；Candidate NOT generated
6. Cross-Run Cohort Investigation Evidence？→ ACTIVE / Human final review pending；cohort-v1；1 call；Candidate NOT generated
7. Candidate C？→ experimental baseline only
8. origin promotion / production retain / autonomous loop / next evolution？→ **NOT AUTHORIZED**
