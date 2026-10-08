# Wuxia-Life 当前产品阶段

> 用途：短滚动看板——回答「现在做到哪、下一步是什么、当前禁止扩展什么」。
> 不是长期产品规范，也不是 Participant 执行流水账。
> 最后更新：2026-10-08。attempt-000019 已归档：`SUCCEEDED / CLEANUP`、`SHADOW_AUTHORING_VERIFIED`；execution authorization SHA `b588ac21102229cc3c95064573e7ad917fee105bc955d1ccfddfe4aff5d74319` 已消费，`reviewContinuation=null`，V1–V5 六项均 PASS，且不需要 PD-117 continuation。归档后 canonical history SHA=`bc42913ad78c5780f41e36608e11d0d618adb2f27260b77dd273d998cff6149d`，共 18 次 attempt，最新 #19 成功且无活动 attempt；authoritative repo fingerprint 前后相同。
> Layer A — Historical Controlled Downstream Mechanism Proof = `ESTABLISHED / PASS`。exact patch SHA `88c4e5ed16709d5d33efd2d34b179cb2069b5d60304ca26d3b7f92a32d2e48f3` 的 Human promotion outcome 为 `REJECT`：authoritative dev 已有后续等价 residual preschool shared-capacity 内容（commit `6a46b2749c301b002420f3f77190ea3439d783bb`），故未应用该 historical patch。没有执行 Natural PVER；Layer B / Layer C 均未建立。历史 Layer A tuning 结束，总体返回 `RUN / OBSERVE`。
> 2026-10-07 Human direction：Content Authoring 的需求来源与 downstream authoring capability 已按 PD-124 解耦。除问题驱动的 `DIAGNOSED_PROBLEM → CONTENT_GAP → Authoring Requirement` 外，Human 可直接建立 `HUMAN_DIRECT` Authoring Requirement。第二个治理上已批准的 bounded family 为 `bounded-formal-event-authoring-v1@1`；其 deterministic downstream pipeline 与 Participant authorization preparation 已落地。当前不为了验证该 family 启动完整 AE 或制造 Gap。
> 2026-10-07 Human direction（PD-125）：停止为普通 bounded shadow run 生成需要 Human 手工批准的 Gate A / Gate B SHA candidate。Human 批准的是 Requirement / Contract 与最终 authoritative promotion；repo / binding / evidence / prompt / proposal / review / admission / result digest 改为 Host 自动 freshness/provenance。
> 2026-10-08 closure：PD-125 runtime reconciliation 已完成；首个真实 model-backed `bounded-formal-event-authoring-v1@1` Human-direct case 已完成 Proposal → independent Reviewer → Host admission → isolated shadow → V1–V6 verification → Human exact-patch promotion。Event `p42_training_business_river_delivery` 已由 commit `a06c33cb1029511806c09ccfc65fa5205327a1c9` promotion；catalog baseline closure commit `21f9256c207a262d4dedde1d30862b90f97f8457` 后 GitHub Actions quality 全绿。Natural Effectiveness 仍为 `NOT ESTABLISHED`。

## 当前导航

- **总体产品阶段：**`RUN / OBSERVE`；这不表示现在立即继续 ordinary AE sampling。
- **Primary objective：**Contract-driven autonomous content authoring。当前治理上批准的 bounded families 为 `preschool-shared-neutral-passive-capacity-v1@1` 与 PD-124 `bounded-formal-event-authoring-v1@1`。Formal Event 的 PD-125 standing-authorization runtime、真实 model-backed bounded authoring、independent review、Host admission、V1–V6 shadow verification、Human promotion 与 repository CI closure 已在一个 Human-direct case 上闭环；当前重点回到 `RUN / OBSERVE`，获取自然玩家可见 evidence，而不是继续预先扩展 authoring infrastructure。
- **已完成的 Human-prioritized milestone：**Layer A — Historical Controlled Downstream Mechanism Proof = `ESTABLISHED / PASS`。它只验证受控历史 downstream mechanism，不验证 Contract §9 的自主责任推导；历史 tuning 已结束。
- **Artifact-backed 首次 communication reopening gate（在原受测 binding 上）：**`REESTABLISHED`；Probe #1 / #2 均已成功完成。
- **Latest governed attempt：**`attempt-000019 = SUCCEEDED / CLEANUP`，terminal result=`SHADOW_AUTHORING_VERIFIED`，validation layer=`HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM`，responsibility provenance=`HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES`。Authorization SHA `b588ac21102229cc3c95064573e7ad917fee105bc955d1ccfddfe4aff5d74319` 已消费；`reviewContinuation=null`，authority integrity、mechanical conformance、semantic conformance、red-green regression、adjacent regression 与 evidence-bounded completion 均 PASS，`failures=[]`。不需要 PD-117 continuation。Canonical history SHA=`bc42913ad78c5780f41e36608e11d0d618adb2f27260b77dd273d998cff6149d`；共 18 次 attempt，最新 #19 `SUCCEEDED`，无活动 attempt。
- **Human promotion outcome：**exact patch SHA `88c4e5ed16709d5d33efd2d34b179cb2069b5d60304ca26d3b7f92a32d2e48f3` = `REJECT`。authoritative dev 已包含后续等价 residual preschool shared-capacity 内容（commit `6a46b2749c301b002420f3f77190ea3439d783bb`），因此没有应用 historical patch。该 `REJECT` 不改变 Layer A PASS；authoritative repo fingerprint 在 #19 前后相同。
- **已完成的 Human-prioritized milestone（Formal Event）：**首个真实 model-backed Bounded Formal Event authoring/promotion closure = `ESTABLISHED / PASS`，范围仅限固定 Human-direct “持续修行 × 持续经商” Requirement 与 `bounded-formal-event-authoring-v1@1`。standing authorization 没有 bare-SHA Human round-trip；最终 exact patch 经 Human 审阅后 promotion。preschool historical tuning 不重开。
- **Current evidence limit：**preschool Layer A 仍只证明受控 historical downstream mechanism。Formal Event 现在额外证明了一个真实 Human-direct bounded case 可以完成 model-backed authoring → independent review → admission → shadow verification → Human promotion；这仍不证明 generic/unbounded Event authoring、跨 Contract family 泛化、完整 AE 自动发现→authoring 闭环或 Natural Effectiveness。Natural PVER 尚未执行。
- **Current return point：**总体 operating mode 仍是 `RUN / OBSERVE`。Formal Event 特殊验证/tuning 到此收口，不需要为了证明 infrastructure 再制造第二个 bounded sample。后续等待该已 promotion Event 在自然运行中的玩家可见 evidence；若自然体验暴露问题，再按正常 Gap Diagnosis / Contract 路径处理。该 closure 不计作 preschool Layer B proof；Formal Event Natural Effectiveness 仍为 `NOT ESTABLISHED`。
- **Non-blocking Status 风险追踪（Human 手工登记）：** [GitHub Issue #5：Status 生命周期、时间尺度与反馈边界](https://github.com/molibaby1/wuxia-life/issues/5) 保留已识别风险、证据与重新审查触发点；在《雨后渡口》Natural PVER、未来 Status 内容准入或 Status UI/反馈设计时主动检索复核。该 Issue 不是 PD-100 自动 HFL work item、正式 Product Decision、实施授权或自动提醒；不阻塞当前 `RUN / OBSERVE`。
- **attempt-000014：**the pre-upgrade authorization became stale after Participant binding drift and was not reused. A fresh one-time authorization admitted #14, which terminally failed at `SHADOW_AUTHORING`; that authorization is consumed. Detailed Host-verified outcome is recorded below.
- **Historical binding diagnostics：**under the tested binding, Matrix A passed 3/3. Matrix B timed out on its first large terminal Solution-like payload; this is diagnostic evidence for that workload and does not establish failure of artifact-backed Solution or real Reviewer/Shadow transport. Matrix C and later artifact/probe steps were not run.
- **Layer A overall proof：**`ESTABLISHED / PASS`，仅限 historical controlled downstream mechanism；不表示 Contract v1 fully validated，也不表示 Natural PVER 或 natural effectiveness 已通过。
- **当前 ordinary RUN / OBSERVE 边界：**Layer A historical tuning 已结束。Human Follow-up Loop v1 与其现有 active items 继续 non-blocking；Layer B / Layer C 均未建立。Layer B 等待自然 candidate，不制造样本；Layer C 仅能在未来 exact patch 经 Human promotion 后由 subsequent Natural PVER 判断。本次未执行 Natural PVER。
- **授权边界：**#13–#19 的一次性 governed Human authorizations 均已消费；#16 bounded replay 的独立 authorization 也已消费。#17 authorization digest `7284cccbab072d087d1291e472d4ff727cc6dcff2bc59a2a5f40bb57628613ae` 仅用于 #17；#18 authorization SHA `82ae1c9934e401da23e5ce9922ba7595a896828a9b36dc892c90691849046e59` 仅用于 #18；#19 authorization SHA `b588ac21102229cc3c95064573e7ad917fee105bc955d1ccfddfe4aff5d74319` 仅用于 #19 且已消费。这些 SHA 保持为历史 evidence。PD-125 起，未来 bounded shadow-only workload 默认不再创建需要 Human exact-SHA approval 的 attempt token；Host 仍自动记录并校验 exact machine provenance。当前不创建 #20。

---

## 1. 当前成熟度

Auto Evolution 当前处于：

> **EARLY OPERATIONAL / RUN-OBSERVE STAGE — 核心 Agent workflow、旁路运行报告与一次跨轮工程路径已经可用；当前重点是进入真实使用并观察，而不是继续预先扩展系统。**

这里的 `RUN / OBSERVE` 是总体产品阶段，不表示当前立即继续 ordinary AE sampling；当前 Human-prioritized 顺序见上方导航。

real cross-round transition 已自然观察到一次；这仍不是 production-ready / fully autonomous 的声明；长期稳定性尚未证明。

## 2. 已确认基础

当前已有 Human-accepted / repository evidence 支持：

- Skeleton 001–007：CLOSED；
- problem-agnostic Agent Solution Loop：已完成多轮真实实例；
- Role / Participant / independent Reviewer 接力：可运行；
- Participant failure / defer / skip / escalation：可作为正常 workflow outcome；
- bounded configuration execution：已真实执行；
- modified-runtime verification / real rerun：已完成；
- First Skill Slice：CLOSED / Human accepted；
- First Skill：`repository-grounded-investigation` version 1；
- Solution / Reviewer Skill provenance：canonical / delivered matched；
- **P0 Documentation Strategic Calibration：CLOSED / Human accepted；**
- **P1 Sidecar Run Report：ENGINEERING CLOSED / USABLE；**
- P1 Report 已能从现有 structured workflow artifacts 生成 Human-readable run history，且不成为主流程依赖；
- **Decision Audit / SKIP Explainability Slice A：HUMAN-AUTHORIZED / bounded correction；**
- Run Report 可旁路保留已验证的 Participant decision outputs；当前 0-hypothesis contract 必须带有界 `noProblemAssessment`，legacy 缺失时显式标记 unavailable；不启动 Report Analysis，不新增 reasoning Participant，不改变 SKIP 或 HFL 语义；
- **Human Review Surface v1 Slice B：HUMAN-AUTHORIZED / deterministic Human-view projection；**
- Report 首屏与运行索引现在消费同一 projection，翻译 bounded Decision Audit 为结论、解释、建议动作与必要时的手工 ChatGPT 只读 handoff；首屏按 Human next action（上传项目包、复制提示词）而非 system next state 表达，ESCALATE handoff 为 required、SKIP 审计为 optional，历史报告保持 run-time 真实且要求先确认当前 HFL disposition；不写入 `report.json`，不新增 LLM、Report Analysis、UI、自动任务或重跑，不改变 routing / HFL lifecycle；
- **P2 Multi-round Execution Validation：DESIGN ACCEPTED / ENGINEERING CLOSED；**
- P2 deterministic engineering path 已验证：`Round 1 → bounded configuration execution → scope verification → verification → real Phase 0 rerun → new sealed source → Round 2 → STOP`；
- P2 已验证 no-op execution、authoritative repository mutation、scope violation、verification / rerun failure 等边界会 fail closed；
- P2 不修改 authoritative product state，也不包含 repository promotion / commit / merge。
- **PD-118 Source-local Candidate Pool / Multi-candidate Session v1：ENGINEERING DELIVERED / DEFAULT ORDINARY PATH ACTIVE / DETERMINISTIC ACCEPTANCE VERIFIED；**
- 已验证 canonical Candidate Pool / Logical Session contracts、一次性 Source Analysis、保留原始 hypothesis identity 的 Candidate Lane、单 Source deterministic serial Pool processing、durable Host resume、candidate-local continuation、一次 source-change barrier、immutable per-slice report snapshots、multi-action Human projection、Logical Session index grouping 与 terminal forensic evidence。
- 默认 ordinary operator 已切换到 exact START/RESUME semantics；legacy multi-round / Selection artifacts 仅保留为历史读取与 replay 兼容面，不再是新 ordinary path 的 winner-selection 入口。
- PD-118 migration 前，RUN / OBSERVE 曾确认 `selectFirstHypothesis` 使 participant order 决定 candidate survival，且单 candidate terminal 被错误放大为 Pool/session terminal；该 bounded engineering migration 已完成，不表示这是当前主线目标。
- PD-118 保留 PD-100 HFL trigger、PD-111 evidence safety、PD-117 continuation shape / semantic retry=0 与 P2 one-source-transition ceiling；改变的是 Selection winner semantics、continuation/budget ownership、Logical Session / Host slice、Pool persistence/resume 与 multi-candidate report semantics。
- **Human Follow-up Loop v1 / RUN-OBSERVE Evidence Review Policy：HUMAN ACCEPTED / AUTHORITY RECORDED；**
- **Human Follow-up Loop v1 minimal runtime：ENGINEERING DELIVERED / IMPLEMENTATION REVIEW ACCEPTED；real-use pilot completed / `HFL_REAL_USE_VALIDATED`；**
- 该 loop 采用 workflow-first、productization-later 边界：正式 `ESCALATE_HUMAN` 后保留可异步复核的 operational work-item state，但普通 unresolved item 不阻塞 RUN / OBSERVE。
- **P3 Minimal Slice #1 — Structured Final Output Contract V1：HUMAN-AUTHORIZED / ENGINEERING DELIVERED / FIRST CONTRACT CONFORMANCE MATRIX = `CONTRACT_CONFORMANCE_PROMISING`（Human acceptance: `PROMISING_WITH_CAVEATS`）；**
- 该 Slice 根据真实 Participant 通信 evidence 局部激活，只统一 terminal structured output envelope；当前 Pilot 为 Solution / Reviewer / Configuration Execution；
- shared contract 要求 bare JSON / no wrapper prose / no Markdown fence / strict validate-or-reject，并保持 Host 不做 semantic repair；
- 独立 Contract Conformance Matrix（trivial contract-only；Codex current binding ×3 + Cursor Auto ×3）全部 `PASS`；证据在实验目录，不构成主流程 authority；不证明 fixed Cursor model A/B，也不证明真实 Solution reasoning quality；不宣称 full runtime communication verified。
- **P3 Minimal Slice #2 — Envelope Failure Bounded Retransmission：HUMAN-AUTHORIZED / ENGINEERING DELIVERED / RUNTIME CONFORMANCE VERIFIED；**
- 原始 Slice #2 授权并验证的边界为：Role = Solution only；Trigger = terminal `ENVELOPE_FAILURE` only；Recovery = exactly one same-thread retransmission；Retransmission ceiling = 60000ms；当时 Initial Participant timeout 为 production default `240000ms`（历史验证基线，不是当前 hard-timeout authority）；
- 2026-09-30 Human 授权增加有界的 `SCHEMA_FAILURE` trigger：仅当 Solution 返回合法 JSON object envelope、但 Host role-schema validation 失败时，允许 exactly one same-thread retransmission；继续使用 60000ms ceiling，并将 exact Host schema error 写入 retransmission prompt；accepted-result validation failure 不触发重传，非 Solution role 不适用，attempt 1 再失败即 fail closed；
- 原始 Slice #2 的 runtime conformance 由 clean corrective 3-trial Cursor batch 确认：3/3 均 one retransmission、`sameThread=true`、`timeoutMs=60000`、final `SUCCEEDED`；second retransmissions = 0；当时 schema-failure retries = 0；aggregate Trace causal ordering verified；protected production hashes 在 runtime observation 期间不变。此次 schema-trigger 扩展仅作 deterministic verification，未执行真实 Participant run；
- 两类 trigger 均禁止 Host repair / extraction / normalization 与 semantic correction；Participant 必须支持 reliable same-thread continuation；first-pass failure provenance 保持可观察；
- Sidecar Run Report 现已可从 `solution-agent/execution-trace.json` 观察 first-pass / retransmission / final structured-output 指标，但不影响 runtime outcome；
- 不代表完整 P3 启动或 broader Participant Communication Contract 激活。
- **PD-099 v2 / PD-122 Revision 1 — Participant activity-aware watchdog：HUMAN ACCEPTED / ROLE-NEUTRAL HARNESS HARDENING IMPLEMENTED / DETERMINISTIC GATES VERIFIED。** Accepted values are `evaluationStartMs = 1800000`, `stdoutInactivityMs = 600000`, and `absoluteCapMs = 2700000`; non-empty stdout refreshes progress and stderr does not. Every default workspace Participant Role and structural-correction continuation uses this policy. Explicit caller timeouts remain fixed overrides. The former fixed `60000ms` production correction deadline is removed. These are abnormal-safety limits, not ordinary execution budgets or performance targets; timeout remains Participant runtime `TIMEOUT` and fails closed under PD-119.
- **PD-099 v2 的历史决策依据：**以下两次自然 Solution timeout 均发生于旧 v1 fixed-cutoff 行为下：`ordinary-run-20260917-000004` 的 terminal elapsed 为 `1800057ms`、last stdout 为 `1789486ms`；`ordinary-run-20261002-000001` / `hypothesis-000002` 分别为 `1800013ms` 与 `1729931ms`。两者在旧 cutoff 前仍有 stdout，支持修正无条件 fixed cutoff 与仍活跃 observable stdout 不匹配；不证明较长运行的原因或语义结果，也不构成 `NATURAL_ACTIVATION_OBSERVED`、`NATURAL_SEMANTIC_DERIVATION_PASS` 或 Layer A PASS。

这些结果支持当前系统进入真实使用 / 观察阶段。

第一 Skill 当前继续视为可用 working method；不要求先完成 Skill-off / Skill-on behavioral A/B 才能继续使用。

## 3. 当前仍未证明

- PD-118 在长期自然运行中的 effectiveness、稳定性与普遍性尚未证明；
- PD-118 implementation closure 不等于 production-ready 声明；
- 当前 focused PD-118 suites、`npm run typecheck`、`npm run test:contracts` 与 `npm run build` 已通过；完整 `npm test` 仍受既有 baseline failures `stageAtomicProgression` 与 `canonicalUndefinedPropertyEliminationTests` 阻断，不归因于本次迁移；

以下内容不要因 deterministic engineering validation 或设计意图而写成已成立：

- **一次真实 Participant-driven cross-round transition 已自然观察到（ordinary-run-20260913-000006）；P2 real transition hypothesis 已获得直接实例 evidence；多轮真实运行的长期稳定性、普遍性与成功率仍未证明；**
- 2026-08-29 fresh real-run observe batch（3 normal Codex current-binding runs）：`NO_CROSS_ROUND_TRANSITION_OBSERVED`（0/3 `READY_FOR_CONFIG_EXECUTION`；sidecar `NO_REPORT_CHANGE`）；
- 多轮真实运行在长期使用中的稳定性；
- 每个真实 run 都能或都应该进入下一轮；
- Participant Communication Contract 的最终形态；
- Structured Final Output Contract V1 的 first harness matrix 仅为 `CONTRACT_CONFORMANCE_PROMISING`（小样本、contract-only）；fixed Cursor model matrix 与真实 Solution workload matrix 尚未证明；
- **Reference Participant Binding / Native Envelope Assistance：**Task 4 corrected implementation 已交付（`aab6d25c12a904e900ba24460cf29586f812cb23`）；fresh matrix `reference-binding-2026-10-01-corrected-v1` 在单一 sealed binding 下，Matrix A 为 3/3 completed 且 Host envelope-valid。Corrected Matrix B 为 0/3：B-01 / B-02 / B-03 均在旧 PD-099 v1 `1_800_000ms` fixed cutoff 到期，实际耗时分别为 `1_800_010ms` / `1_800_009ms` / `1_800_019ms`；没有完成的 JSON terminal payload，故 Host envelope 无效、结构校验及 parsed payload size 未评估。按 gate 未运行 Matrix C/D；这组 corrected evidence 不判定 60 秒 continuation ceiling。旧 v1/v2 matrix evidence 保持原样且未与本次 binding 混合；该 matrix 未修改 timeout policy，此历史 Solution cutoff 已由 PD-099 v2 取代。此 terminal-mode evidence 不替代下方 Artifact-Backed V1 reopening gate 结论。
- **Artifact-Backed Structured Final Result V1 controlled Solution gate：**历史 artifact-backed re-establishment synthetic matrix `artifact-backed-v1-receipt-propagation-20261001-01` 为 `PASS`（3/3；receipt、artifact integrity、envelope 与 synthetic structure 均通过；retransmissions = 0），binding-lock SHA-256：`226223ba3a2ee56c50a6aec3c31991014184a054d30622916586323f54a40d46`。Artifact-Backed Historical Solution-only Probe #1 / #2 已在 containment 修复后的当前实现上成功完成，artifact-backed communication reopening gate = `REESTABLISHED`；历史 synthetic evidence 仍不等同于 Layer A downstream proof。`attempt-000012` 曾以 `FAILED / SOLUTION / TIMEOUT` 终止；`attempt-000013` 以 `FAILED / REVIEWER / invalid_output` terminal 结束，Reviewer assessment 因包含 schema 禁止的 `responsibilities` 字段而未通过 structured validation。其一次性 authorization 已消费；Reviewer invocation 已发生，但 Host 未获得合法 review，Shadow / promotion 未运行。
- **attempt-000014 — historical real governed outcome：**Solution artifact-backed path passed；Reviewer accepted the option within current authority；Shadow process completed but Host rejected the terminal Role payload for wrong `schemaVersion` (`preschool-shadow-authoring-result-v1`; expected `shadow-authoring-execution-participant-result-v1`). The eligible schema correction was not attempted because the real reference downstream Participant exposed no usable thread capability (`CAPABILITY_UNAVAILABLE`). The consumed #14 authorization cannot be reused; no promotion was produced. This confirmed a PD-122 Revision 1 implementation deviation, now fixed and deterministically verified. At that time, Layer A was still `NOT ESTABLISHED`.
- Envelope Failure Bounded Retransmission 的真实 Participant runtime 扩展（第二重传、Reviewer / Configuration Execution rollout、跨 harness / model 推广）尚未证明；PD-122 Revision 1 的一次 same-thread structural correction 当前有 deterministic implementation evidence，未做 Matrix/probe recertification；
- report analysis / automatic intervention；
- Game 与 Auto Evolution 已经物理解耦；
- 世界观 / 产品内容可无成本替换；
- autonomous code modification；
- Participant 主观判断存在统一“正确答案”或通用质量分数。

`CROSS_ROUND_TRANSITION_OBSERVED` 只有在真实 authorized Participant workflow 自然完成以下链路后才可用于产品假设：

```text
real sealed run A
→ real Agent Round 1
→ accepted configuration work
→ real bounded configuration execution
→ real modified game rerun B
→ new sealed source B
→ real Agent Round 2 automatically starts
```

Deterministic integration test 只证明工程路径成立，不替代上述真实 evidence。

上述真实 evidence 条件已于 ordinary-run-20260913-000006 自然满足一次（disposable evolution workspace 内 bounded configuration execution，changed file：`src/data/lines/preschool-passive-spine.json`；`authoritativeRootChanged = false`；Round 2 自动启动后以 `DEFER_MORE_WORK_REQUESTED` 终止，不视为失败）。长期稳定性仍需继续观察。

## 4. 当前阶段：RUN / OBSERVE

当前不新增新的核心能力阶段。总体阶段仍为 `RUN / OBSERVE`；attempt-000019 的 Layer A historical proof 与 Human promotion disposition 已关闭，回到 ordinary observation。此次 closure 本身没有启动 ordinary run、Natural PVER 或新的 governed attempt。

当前导航顺序是：

```text
Historical Solution-only Probe #1 / #2 已成功完成；artifact-backed 首次 communication reopening gate = REESTABLISHED
↓
attempt-000013 Reviewer communication blocker 已修复并 deterministic verified
↓
pre-upgrade attempt-000014 authorization 因 Participant binding drift 失效且未复用
↓
fresh one-time authorization admitted attempt-000014
→ FAILED / SHADOW_AUTHORING：wrong Role schemaVersion；correction 未尝试（`CAPABILITY_UNAVAILABLE`）；authorization 已消费
↓
reference downstream same-thread capability gap + Shadow exact schemaVersion guidance
→ implementation deviation fixed / deterministic verification → VERIFIED
↓
fresh exact current binding captured after dev commit `71d53665af1becc746639806767311933ae3a12d`
→ attempt-000015 candidate generated (`098a651db78f2d3b7f36788cc5d38b8537f27a9cad687c828f6a81964e80eba4`) → Human exact-SHA approval
→ attempt-000015 FAILED / REVIEWER / RUNTIME_EXCEPTION under the historical runner; Reviewer artifact decision `ESCALATE`, assessment `CONTRACT_CHANGE_REQUIRED / NON_CONFORMING` for responsibility-000004; no `decision.json`, Shadow, or promotion; authorization consumed
↓
2026-10-04 Human PD-121 clarification retains Contract v1 and responsibility-000004 under the transient-role interpretation; no Contract expansion adopted
→ Reviewer prompt clarification + reference-runner routing correction committed and deterministic tests PASS
→ Reviewer ESCALATE persists `ESCALATE_HUMAN / EXPLICIT_ESCALATION`; Host `INSUFFICIENT_EVIDENCE` persists `DEFER / AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE`; both terminally classify as `ROUTED_DECISION` without Shadow/promotion
↓
历史序列：#16 = `FAILED / VERIFICATION / RUNTIME_EXCEPTION`；独立 bounded Shadow→Host replay 达到 `SHADOW_AUTHORING_VERIFIED` 且 V1–V5 全 PASS，但未建立 Layer A。#17 = `FAILED / SHADOW_AUTHORING / SHADOW_AUTHORING_EXECUTION_FAILED`；reference Host continuation guard 后续已 deterministic 修复。#18 按其 approved SHA 执行并归档为 `FAILED / REVIEWER / ROUTED_DECISION` → `DEFER_MORE_WORK_REQUESTED / REVIEW_REQUEST_MORE_WORK`；其 Solution promotion-authority 误述与 Reviewer 拒绝是历史结论，#18 未回写或 replay，Shadow / V1–V5 / Promotion 未进入。

attempt-000019 = `SUCCEEDED / CLEANUP`，`SHADOW_AUTHORING_VERIFIED`；Layer A = `ESTABLISHED / PASS`，validation layer=`HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM`，responsibility provenance=`HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES`。V1–V5 全 PASS，`reviewContinuation=null`，不需要 PD-117 continuation，authoritative repository 未改变。Human 对 exact patch SHA `88c4e5ed16709d5d33efd2d34b179cb2069b5d60304ca26d3b7f92a32d2e48f3` 的 promotion outcome 为 `REJECT`，原因是 authoritative dev 已含后续等价 residual shared-capacity 内容；patch 未应用。历史 tuning 结束，返回 ordinary `RUN / OBSERVE`；没有执行 Natural PVER。Layer B 与 Layer C 均 `NOT ESTABLISHED`，不制造 Layer B 样本；Layer C 仅在未来 exact patch 经 Human promotion 后由 subsequent Natural PVER 判断。
```

### 当前目标

- Artifact-backed 首次 communication reopening gate 已 `REESTABLISHED`；Probe #1 / #2 均已成功完成。此历史 gate 不因 binding drift 自动重跑。
- 当前 Layer A 状态 = `ESTABLISHED / PASS`，仅限 historical controlled downstream mechanism；PD-121 Contract v1 的自主责任推导与自然效果不因此视为验证完成。Human 对 #19 exact patch 的 `REJECT` 保持独立，不改变 Layer A 结论。
- 当前返回点：#18 的历史终态与路由保持原样；首次 RMW 暴露的 Reference continuation integration/coverage gap 已按 2026-10-06 clarification 修复并通过 deterministic tests。#19 已完成且未回写、未 replay；历史 Layer A tuning 结束，总体 operating mode 回到 `RUN / OBSERVE`，但 immediate priority 按下述 Contract reuse investigation 执行，不立即启动 fresh ordinary AE sampling。
- #14 的 pre-upgrade authorization 因 binding drift 失效且未复用；新的 #14 一次性 authorization 已消费。#14 在 `SHADOW_AUTHORING` 因错误 `schemaVersion` terminal 失败，未尝试 correction（`CAPABILITY_UNAVAILABLE`），未产生 promotion。
- under the new binding，Matrix A passed 3/3。Matrix B timed out on the first large terminal Solution-like payload; this is diagnostic only and does not establish failure of artifact-backed Solution or real Reviewer/Shadow transport. Matrix B will not rerun automatically; neither Matrix C nor an artifact-probe campaign is an automatic prerequisite. Use synthetic diagnostics only when a concrete real-path communication failure needs isolation.
- attempt-000013 至 #19 的一次性 governed Human authorizations 均已消费；#16 bounded replay 使用的独立 authorization 也已消费。#18 与 #19 的历史 artifacts 均已归档；当前没有新 governed attempt 的准备或授权，不创建 #20。
- 历史 #18 的 Participant outputs 均通过 transport / envelope / schema validation，无 correction；Reviewer 合法返回 `REQUEST_MORE_WORK`，原 attempt 以 `DEFER_MORE_WORK_REQUESTED` 终止。该历史结果暴露的 Reference runner PD-117 first-RMW integration/coverage gap 已 deterministic 修复。#18 不回写、不 replay。
- Layer A overall proof = `ESTABLISHED / PASS`；Reference continuation deterministic coverage 与本地 repository gates 已通过。当前不要求 Matrix/probe campaign。
- 当前 3 个 Human Follow-up active items 是保留的 operational work，non-blocking，不构成当前 Contract validation 的同步 gate。
- 总体 operating mode 仍为 RUN / OBSERVE；当前不立即启动 fresh ordinary AE sampling。先从已有 historical unresolved AE evidence 中筛选适合的内容丰富化案例，用作 Contract reuse / content-generator usability investigation。Human Follow-up Loop v1 与现有 active items 继续 non-blocking。Layer B natural semantic derivation 与 Layer C natural effectiveness 均未建立。
- Layer A historical tuning 已结束；当前复用调查不得伪装成 Layer B natural proof，也不得为 Layer B 制造自然样本。Layer C 仍须在未来 exact patch 经 Human promotion 后通过 subsequent Natural PVER 判断。

- **PD-117 Bounded More-Work Continuation v1：ENGINEERING DELIVERED / IMPLEMENTATION REVIEW ACCEPTED / INITIAL NATURAL EFFECTIVENESS SUPPORTED ACROSS MULTIPLE INDEPENDENT CASES；GLOBAL / LONG-RUN EFFECTIVENESS NOT YET ESTABLISHED；** 首个符合条件的 Reviewer `REQUEST_MORE_WORK` 在单次 session 内最多触发一次 Host continuation、最多增加两个 Participant jobs；base Decision、PD-100 HFL trigger、PD-111 evidence scope 与 full P3 boundary 保持不变。自然 evidence anchor：ordinary-run-20260913-000001（continuation 后再次 `REQUEST_MORE_WORK`）与 ordinary-run-20260913-000006（continuation 后 `ACCEPT_OPTION` → disposable workspace 配置执行 → modified rerun B → Round 2 以 `DEFER_MORE_WORK_REQUESTED` 终止，`authoritativeRootChanged = false`）；Batch #3 early-stop sampling 不用于 activation-rate 统计；不宣称 global effectiveness / 成功率 / READY 率提升。

### 当前 Contract 复用验证方向

- **长期目标：**把 contract-governed content authoring 发展为可复用的内容生成能力，而不是每遇到一个具体内容缺口都重新手工发明一份彼此无关的 Contract。
- **当前验证对象：**preschool Contract 只作为 reference case，不预设其结构已经通用。下一步从历史 AE 已暴露但未闭环的问题中选择少量代表性内容丰富化案例，至少包含一个与 preschool materially different 的场景。
- **验证问题：**先判断哪些 Contract 结构真正可共享，哪些字段、类型、语义和约束必须留在 generator family 或 case 层；再以最小改动验证下一条 reuse hypothesis。
- **负面证据：**如果每个代表性案例都必须重新设计一份无共享结构的一次性 Contract，应视为当前抽象尚不可复用，而不是把多个 bespoke contracts 当作“通用能力已建立”。
- **fresh-run boundary：**只要 historical evidence 已足以提供代表性 candidate，就不运行 fresh AE 仅用于发现更多同类问题。只有现有证据不足、过期，或必须观察真实 integration / natural activation 时，才回到 fresh natural execution。
- **abstraction guard：**当前不预建 generic Contract registry、DSL、executor plugin framework 或 universal Event / Person / Milestone schema；是否需要新的 generator family、Contract / Schema 或 runtime change，必须由代表性案例的实际差异驱动。

### Engineering convenience（非 Product Decision）

以下是本地便利边界，**不得**当成长久产品权威：

- ordinary AE operator 允许 dirty tree 启动并披露 `workingTreeClean` + fingerprint（`DEV_CONVENIENCE_ONLY`）。正式观察 / 可引用结论的 batch 仍应 clean。
- `runRealTestGate`：`B0_NOT_IN_WORKING_TREE_GATE`（frozen-checkout 实验；与 dirty convenience 同裁决，非产品退休）。
- local External Feedback evidence sidecars（`participant-prompt.txt` / `participant-binding.json` / `participant-execution-trace.json`）仅覆盖 Feedback local-subagent；Hypothesis / Solution / Reviewer 不在此边界。

### Human Follow-up Loop v1

Human Follow-up Loop v1 / RUN-OBSERVE Evidence Review Policy 的 authority 已记录于 PD-100 与 Auto Evolution 产品模型（HUMAN ACCEPTED / AUTHORITY RECORDED）。v1 minimal runtime 已 ENGINEERING DELIVERED，implementation review 已 ACCEPTED，real-use pilot completed (`HFL_REAL_USE_VALIDATED`)。

当前已有范围保持 `retain + review + list`：

- 正式 `decision.route == ESCALATE_HUMAN` 才自动创建 retained operational work-item state；普通 `DEFER`、`PARTICIPANT_FAILURE`、`SKIP`、`NO_PROPOSAL` 与 `INSUFFICIENT_EVIDENCE` 不自动转为 Human item；
- Human lifecycle 与可重建 Inbox 已存在；ordinary unresolved items 不阻塞主 RUN / OBSERVE loop；
- `READY_FOR_FORMAL_TASK` 不是 implementation authorization；正式改进仍走现有 Human Gate / accepted-design / implementation authorization 流程；
- retained operational state 不成为 product / governance authority，也不把 governance 文档当 backlog database；
- automatic Review Trigger detection 有意未实现；UI / database / semantic dedupe / priority / productization 仍 out of scope；
- real-use pilot 已完成并验证 workflow usability / provenance / noise / disposition-to-formal-work closure，不要求人为制造 Human escalations。

PD-100 中的 2-run recurrence、3 active items、5 fresh normal runs 仅是可复议的 v1 pilot parameters；不改变 full P3、`NO_BOUNDED_P3_SLICE_JUSTIFIED` 或当前 permission boundary。

### P3 — Participant Communication Contract Consolidation

**FULL CONSOLIDATION: DEFERRED / NOT CURRENTLY ACTIVE。**

**Run/Observe → Bounded P3 Program（PRD A/B/C）terminal decision：`NO_BOUNDED_P3_SLICE_JUSTIFIED`。**  
证据索引：`.tmp/evolution/communication-evidence-synthesis-20260829/decision.json`（不把 run-by-run transcript 写入本文件）。  
含义：当时不提出下一个 bounded P3 communication slice，也不授权任何 P3 implementation PRD；总体阶段仍为 RUN / OBSERVE，当前 ordinary AE sampling 的排序见文件前部导航。
未改变：Slice #1 matrix 状态、Slice #2 已验证边界；已改变：P2 real transition 已获得首次自然实例 evidence，长期稳定性仍未证明。

完整 P3 仍应继续从真实运行与多轮 evidence 中逐步归纳，不启动协议平台化建设。

此前 Run / Observe 已暴露具体的 terminal-output communication variance，Human 当时已重新排序并授权 bounded corrective；下列 Slice #1 / #2 是该历史 corrective 的状态，不表示当前开启了新的 timeout / communication campaign：

**Minimal Slice #1 — Structured Final Output Contract V1：
ENGINEERING DELIVERED / FIRST CONTRACT CONFORMANCE MATRIX = `CONTRACT_CONFORMANCE_PROMISING`（Human acceptance: `PROMISING_WITH_CAVEATS`；contract-only；full runtime communication仍 UNVERIFIED）。**

**Minimal Slice #2 — Envelope Failure Bounded Retransmission：
ENGINEERING DELIVERED / RUNTIME CONFORMANCE VERIFIED。**

Minimal Slice #2 已验证边界：

- Role：Solution only；
- 原始已验证 Trigger：terminal `ENVELOPE_FAILURE`；2026-09-30 授权扩展后当前 Trigger：terminal `ENVELOPE_FAILURE` 或合法 JSON object envelope 上的 Host `SCHEMA_FAILURE`；
- Recovery：exactly one same-thread retransmission；
- Retransmission ceiling：60000ms；
- Initial Participant timeout（Slice #2 验证时的 historical baseline）：`240000ms`；当前所有 default workspace Participant Roles 与 structural-correction continuation 均按 PD-122 Revision 1 使用 PD-099 v2 watchdog：evaluation start `1800000ms`、stdout inactivity `600000ms`、absolute cap `2700000ms`。显式 caller timeout 仍是 fixed override；historical `60000ms` retransmission ceiling 不再是 production correction deadline；
- `SCHEMA_FAILURE`：仅首次 Solution role-schema failure 可触发该一次重传；无 same-thread capability、accepted-result failure、非 Solution role 或重传后失败均 fail closed；
- Host repair / extraction / normalization：forbidden；
- semantic correction：forbidden；
- Participant 必须支持 reliable same-thread continuation；
- first-pass failure provenance 保持可观察；
- 原始 envelope-trigger runtime conformance 由 clean corrective 3-trial Cursor batch 确认；2026-09-30 schema-trigger 扩展只有 deterministic test evidence，尚无真实 Participant runtime evidence；
- 3/3 trials：one retransmission、`sameThread=true`、`timeoutMs=60000`、final `SUCCEEDED`；
- second retransmissions = 0；原始 batch 中 schema-failure retries = 0；
- aggregate Trace causal ordering verified；
- protected production hashes 在 runtime observation 期间不变。

Sidecar Run Report 现已可区分 first-pass success、envelope/schema failure、retransmission outcome 与 final structured-output success，但不读取 `terminal-attempt-*.txt` payload，也不影响 workflow outcome。

Minimal Slice #1 只固定：

- terminal Role payload 必须是 exactly one bare JSON object；
- 不允许 wrapper prose / Markdown code fence；
- 必须匹配 Role-specific schema；
- Host validate-or-reject，不 extract / normalize / repair。

Pilot 范围（Slice #1）：

- Solution；
- Reviewer；
- Configuration Execution。

它不代表完整 P3 启动，也不授权：

- `SCHEMA_FAILURE` recovery；
- second retransmission；
- Reviewer rollout（Slice #2）；
- Configuration Execution rollout（Slice #2）；
- generic retry subsystem；
- fresh-session fallback；
- provider switching；
- semantic correction；
- Host JSON repair / extraction；
- tool enforcement；
- Contract registry / platform；
- provider abstraction redesign；
- failure taxonomy migration；
- broader Participant rollout；
- MCP；
- model routing；
- transport redesign。

Slice #1 first Contract Conformance Matrix 已完成：machine verdict `CONTRACT_CONFORMANCE_PROMISING`；Human acceptance `PROMISING_WITH_CAVEATS`（Codex current ×3 PASS；Cursor Auto ×3 PASS；`CURSOR_MODEL_BINDING_NOT_OBSERVABLE`；不打开 full P3；不宣称 full runtime communication verified）。Harness closure：non-PASS experiment classifications now exit non-zero after artifact persistence。STOP → 未批准下一 PRD。

继续遵守：

> **纠正通信，不纠正思想。**

## 5. 当前 STOP / 非优先项

除非 Human 重新排序或真实运行暴露明确 blocker，当前不优先：

- 继续雕刻 P2 deterministic engineering path；
- 为了验证 P2 人为制造 cross-round sample；
- First Skill behavioral A/B validation；
- second Skill；
- Skill registry / selector / recommender / self-evolution；
- Report Analysis；
- automatic report intervention；
- Human Control Surface / UI；
- Participant Communication Contract 平台化；
- MCP platform；
- domain-specific analyzer / observer；
- autonomous code modification；
- repository promotion / rollback platform；
- 为未来世界观替换提前做大规模抽象。
- smarter / LLM Selector、semantic ranking、priority scorer；
- generic work queue / global backlog；
- cross-source candidate matching / dedupe / rebind；
- multiple automatic source-changing transitions per Logical Session；
- 为 PD-118 再人为制造 Selection replay / READY 样本。

## 6. 配置 / 代码边界

普通自动写入继续限制在已授权配置层，并受既有 Host enforcement 约束。

需要程序、Runtime、Framework、正式 Contract / Schema 级修改时：

```text
ESCALATE TO HUMAN
```

多轮执行不自动扩大权限。

P2 isolated evolution workspace 的修改不等于 authoritative repository promotion；promotion / commit / merge 当前不属于自动飞轮能力。

## 7. Authority

当前优先读取：

1. `docs/product/player-model.md`
2. `docs/product/auto-evolution-model.md`
3. `docs/governance/product-decisions.md`（尤其 PD-055 / PD-062 / PD-063）
4. `docs/governance/project-convergence.md`
5. 本文件
6. `docs/governance/ai-collaboration-workflow.md`
7. 当前任务直接相关的 active design / Contract

历史 PRD、旧实验 plan 和 `.tmp/evolution/**` 是 evidence / history，不产生新的 next-stage authority。

真实运行明细进入 runtime artifacts / Sidecar Run Report，不重新堆入本文件。

## 8. 一分钟检查单

1. 核心 Agent workflow 能跑？→ **YES**
2. First Skill 能真实复用？→ **YES**
3. P1 Sidecar Run Report 可用？→ **YES / CLOSED**
3b. Human Review Surface v1 Slice B？→ **ENGINEERING DELIVERED / shared deterministic projection；不改变 machine contracts**
4. P2 engineering path 完整？→ **YES / CLOSED**
5. P2 deterministic cross-round path 已验证？→ **YES**
6. P2 real Participant product hypothesis 已验证？→ **YES — first natural real cross-round transition observed（ordinary-run-20260913-000006）；long-run/generalized reliability remains unverified**
7. 当前阶段？→ **RUN / OBSERVE**
8. 当前应该继续加 P2 代码？→ **NO**
9. P3 full Communication Contract Consolidation 当前启动？→ **NO / DEFERRED**
9b. 下一 bounded P3 communication slice 是否由 PRD C 提出？→ **NO / `NO_BOUNDED_P3_SLICE_JUSTIFIED`（STOP → HUMAN GATE）**
10. Structured Final Output Contract V1 Minimal Slice？→ **ENGINEERING DELIVERED / first matrix `CONTRACT_CONFORMANCE_PROMISING`（Human acceptance: PROMISING_WITH_CAVEATS；contract-only；full runtime communication仍 UNVERIFIED；full P3 DEFERRED；Cursor concrete model = `CURSOR_MODEL_BINDING_NOT_OBSERVABLE`）**
11. Envelope Failure Bounded Retransmission Minimal Slice？→ **ENGINEERING DELIVERED / RUNTIME CONFORMANCE VERIFIED**
12. Report 是否主流程依赖？→ **NO**
13. Report Analysis 是否当前建设？→ **NO**
14. MCP 是否已选定？→ **NO**
15. code-level autonomous modification？→ **NOT AUTHORIZED**
16. repository promotion / commit / merge 是否属于当前自动能力？→ **NO**
17. Participant timeout authority？→ **PD-099 v2 values：evaluation start `1800000ms` / stdout inactivity `600000ms` / absolute cap `2700000ms`；PD-122 Revision 1 requires role-neutral defaults for every workspace Participant Role and correction continuation before #15; stdout refreshes, stderr does not; explicit timeout remains fixed override**
18. Human Follow-up Loop v1 authority？→ **HUMAN ACCEPTED / AUTHORITY RECORDED（PD-100）**
18b. Human Follow-up Loop v1 minimal runtime？→ **ENGINEERING DELIVERED / IMPLEMENTATION REVIEW ACCEPTED；real-use pilot completed / HFL_REAL_USE_VALIDATED**
19. Ordinary unresolved Human work item 是否阻塞 RUN / OBSERVE？→ **NO**
20. 当前 Human Follow-up bounded scope？→ **retain + review + list；继续 RUN / OBSERVE，不启动 full P3**
21. PD-118 multi-candidate semantics？→ **HUMAN ACCEPTED / ENGINEERING DELIVERED / DEFAULT ORDINARY PATH ACTIVE / DETERMINISTIC ACCEPTANCE VERIFIED**
22. 当前 default ordinary path 是否仍使用 legacy `selectFirstHypothesis` winner selection？→ **NO；legacy Selection 仅保留历史兼容**
23. 当前 immediate prerequisite？→ **无新的 Layer A prerequisite。attempt-000019 已 `SUCCEEDED / CLEANUP`，Layer A — Historical Controlled Downstream Mechanism Proof = `ESTABLISHED / PASS`；Human exact-patch promotion outcome = `REJECT`，patch 未应用。当前 immediate priority 是从已有 historical unresolved AE evidence 中筛选代表性内容丰富化案例，验证 Contract reuse / content-generator usability；不为了发现新问题启动 fresh AE，不创建 #20。该工作不等于 Layer B / Layer C proof；Natural PVER 未执行，Layer B / Layer C 均 `NOT ESTABLISHED`。**
