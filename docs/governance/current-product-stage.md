# Wuxia-Life 当前产品阶段

> 用途：短滚动看板——回答「现在做到哪、下一步是什么、当前禁止扩展什么」。
> 不是长期产品规范，也不是 Participant 执行流水账。
> 最后更新：2026-09-04（Decision Audit / Human Review Surface v1 Slice B；仍为 RUN / OBSERVE）。

---

## 1. 当前成熟度

Auto Evolution 当前处于：

> **EARLY OPERATIONAL / RUN-OBSERVE STAGE — 核心 Agent workflow、旁路运行报告与一次跨轮工程路径已经可用；当前重点是进入真实使用并观察，而不是继续预先扩展系统。**

这不是 production-ready、fully autonomous 或 real cross-round product hypothesis 已验证的声明。

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
- Report 首屏与运行索引现在消费同一 projection，翻译 bounded Decision Audit 为结论、解释、建议动作与必要时的手工 ChatGPT 只读 handoff；不写入 `report.json`，不新增 LLM、Report Analysis、UI、自动任务或重跑，不改变 routing / HFL lifecycle；
- **P2 Multi-round Execution Validation：DESIGN ACCEPTED / ENGINEERING CLOSED；**
- P2 deterministic engineering path 已验证：`Round 1 → bounded configuration execution → scope verification → verification → real Phase 0 rerun → new sealed source → Round 2 → STOP`；
- P2 已验证 no-op execution、authoritative repository mutation、scope violation、verification / rerun failure 等边界会 fail closed；
- P2 不修改 authoritative product state，也不包含 repository promotion / commit / merge。
- **Human Follow-up Loop v1 / RUN-OBSERVE Evidence Review Policy：HUMAN ACCEPTED / AUTHORITY RECORDED；**
- **Human Follow-up Loop v1 minimal runtime：ENGINEERING DELIVERED / IMPLEMENTATION REVIEW ACCEPTED；real-use pilot completed / `HFL_REAL_USE_VALIDATED`；**
- 该 loop 采用 workflow-first、productization-later 边界：正式 `ESCALATE_HUMAN` 后保留可异步复核的 operational work-item state，但普通 unresolved item 不阻塞 RUN / OBSERVE。
- **P3 Minimal Slice #1 — Structured Final Output Contract V1：HUMAN-AUTHORIZED / ENGINEERING DELIVERED / FIRST CONTRACT CONFORMANCE MATRIX = `CONTRACT_CONFORMANCE_PROMISING`（Human acceptance: `PROMISING_WITH_CAVEATS`）；**
- 该 Slice 根据真实 Participant 通信 evidence 局部激活，只统一 terminal structured output envelope；当前 Pilot 为 Solution / Reviewer / Configuration Execution；
- shared contract 要求 bare JSON / no wrapper prose / no Markdown fence / strict validate-or-reject，并保持 Host 不做 semantic repair；
- 独立 Contract Conformance Matrix（trivial contract-only；Codex current binding ×3 + Cursor Auto ×3）全部 `PASS`；证据在实验目录，不构成主流程 authority；不证明 fixed Cursor model A/B，也不证明真实 Solution reasoning quality；不宣称 full runtime communication verified。
- **P3 Minimal Slice #2 — Envelope Failure Bounded Retransmission：HUMAN-AUTHORIZED / ENGINEERING DELIVERED / RUNTIME CONFORMANCE VERIFIED；**
- 已验证产品边界：Role = Solution only；Trigger = terminal `ENVELOPE_FAILURE` only；Recovery = exactly one same-thread retransmission；Retransmission ceiling = 60000ms；当时 Initial Participant timeout 为 production default `240000ms`（历史验证基线，不是当前 hard-timeout authority）；
- `SCHEMA_FAILURE` fail closed；Host repair / extraction / normalization forbidden；semantic correction forbidden；Participant 必须支持 reliable same-thread continuation；first-pass failure provenance 保持可观察；
- runtime conformance 由 clean corrective 3-trial Cursor batch 确认：3/3 均 one retransmission、`sameThread=true`、`timeoutMs=60000`、final `SUCCEEDED`；second retransmissions = 0；schema-failure retries = 0；aggregate Trace causal ordering verified；protected production hashes 在 runtime observation 期间不变；
- Sidecar Run Report 现已可从 `solution-agent/execution-trace.json` 观察 first-pass / retransmission / final structured-output 指标，但不影响 runtime outcome；
- 不代表完整 P3 启动或 broader Participant Communication Contract 激活。
- **Participant / model hard-timeout policy v1（PD-099）：默认 hard boundary = `1800000ms`；abnormal-safety only，不是 ordinary execution budget；正常 Participant execution 应在 boundary 内自然完成；retransmission / retry ceilings 保持独立（Slice #2 retransmission ceiling 仍为 `60000ms`）。**

这些结果支持当前系统进入真实使用 / 观察阶段。

第一 Skill 当前继续视为可用 working method；不要求先完成 Skill-off / Skill-on behavioral A/B 才能继续使用。

## 3. 当前仍未证明

以下内容不要因 deterministic engineering validation 或设计意图而写成已成立：

- **真实 Participant 驱动的一次 cross-round product transition 尚未被观察到；P2 real product hypothesis = `UNVERIFIED`；**
- 2026-08-29 fresh real-run observe batch（3 normal Codex current-binding runs）：`NO_CROSS_ROUND_TRANSITION_OBSERVED`（0/3 `READY_FOR_CONFIG_EXECUTION`；sidecar `NO_REPORT_CHANGE`）；
- 多轮真实运行在长期使用中的稳定性；
- 每个真实 run 都能或都应该进入下一轮；
- Participant Communication Contract 的最终形态；
- Structured Final Output Contract V1 的 first harness matrix 仅为 `CONTRACT_CONFORMANCE_PROMISING`（小样本、contract-only）；fixed Cursor model matrix 与真实 Solution workload matrix 尚未证明；
- Envelope Failure Bounded Retransmission 超出已验证边界的扩展（第二重传、`SCHEMA_FAILURE` recovery、Reviewer / Configuration Execution rollout、跨 harness / model 推广）尚未证明；
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

## 4. 当前阶段：RUN / OBSERVE

当前不新增新的核心能力阶段。

默认动作是：

```text
使用现有 Auto Evolution workflow
↓
使用 P1 Sidecar Run Report 看见实际运行
↓
真实运行自然产生什么 outcome，就按既有 STOP / permission / provenance 处理
↓
如果自然出现 READY_FOR_CONFIG_EXECUTION，允许现有 P2 mechanism 接管一次跨轮
↓
继续记录真实 evidence
```

### 当前目标

- 让现有系统实际运行；
- 观察 P1 Report 是否足以让 Human 理解运行轨迹；
- 等待一次自然产生、已授权的真实 P2 cross-round evidence；
- 真实运行暴露具体问题时再修正对应模块；
- 不为了“完成验证”人为制造 READY、反复 retry 或预选保证可修改的问题。
- 对正式 `ESCALATE_HUMAN` outcome，按 Human Follow-up Loop v1 保留后续异步 review 语义；不把它变成 RUN / OBSERVE 的同步 gate。

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
含义：当前不提出下一个 bounded P3 communication slice；不授权任何 P3 implementation PRD；继续 ordinary RUN / OBSERVE。  
未改变：Slice #1 matrix 状态、Slice #2 已验证边界、P2 real cross-round = `UNVERIFIED`。

完整 P3 仍应继续从真实运行与多轮 evidence 中逐步归纳，不启动协议平台化建设。

但 Run / Observe 已暴露足够具体的 terminal-output communication variance，且 Human 已重新排序并授权一个 bounded corrective：

**Minimal Slice #1 — Structured Final Output Contract V1：
ENGINEERING DELIVERED / FIRST CONTRACT CONFORMANCE MATRIX = `CONTRACT_CONFORMANCE_PROMISING`（Human acceptance: `PROMISING_WITH_CAVEATS`；contract-only；full runtime communication仍 UNVERIFIED）。**

**Minimal Slice #2 — Envelope Failure Bounded Retransmission：
ENGINEERING DELIVERED / RUNTIME CONFORMANCE VERIFIED。**

Minimal Slice #2 已验证边界：

- Role：Solution only；
- Trigger：terminal `ENVELOPE_FAILURE` only；
- Recovery：exactly one same-thread retransmission；
- Retransmission ceiling：60000ms；
- Initial Participant timeout（Slice #2 验证时的 historical baseline）：`240000ms`；当前 Participant hard-timeout authority 见 PD-099 / `1800000ms`，与 retransmission ceiling 独立；
- `SCHEMA_FAILURE`：fail closed；
- Host repair / extraction / normalization：forbidden；
- semantic correction：forbidden；
- Participant 必须支持 reliable same-thread continuation；
- first-pass failure provenance 保持可观察；
- runtime conformance 由 clean corrective 3-trial Cursor batch 确认；
- 3/3 trials：one retransmission、`sameThread=true`、`timeoutMs=60000`、final `SUCCEEDED`；
- second retransmissions = 0；schema-failure retries = 0；
- aggregate Trace causal ordering verified；
- protected production hashes 在 runtime observation 期间不变。

Sidecar Run Report 现已可区分 first-pass success、envelope failure、retransmission outcome 与 final structured-output success，但不读取 `terminal-attempt-*.txt` payload，也不影响 workflow outcome。

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
6. P2 real Participant product hypothesis 已验证？→ **NO / UNVERIFIED**
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
17. Participant hard-timeout authority？→ **`1800000ms` abnormal-safety hard boundary（PD-099）；不是 ordinary budget；retransmission ceiling 仍独立为 `60000ms`**
18. Human Follow-up Loop v1 authority？→ **HUMAN ACCEPTED / AUTHORITY RECORDED（PD-100）**
18b. Human Follow-up Loop v1 minimal runtime？→ **ENGINEERING DELIVERED / IMPLEMENTATION REVIEW ACCEPTED；real-use pilot completed / HFL_REAL_USE_VALIDATED**
19. Ordinary unresolved Human work item 是否阻塞 RUN / OBSERVE？→ **NO**
20. 当前 Human Follow-up bounded scope？→ **retain + review + list；继续 RUN / OBSERVE，不启动 full P3**
