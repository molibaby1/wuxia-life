# Wuxia-Life 当前产品阶段

> 用途：短滚动看板——回答「现在做到哪、下一步是什么、当前禁止扩展什么」。
> 不是长期产品规范，也不是 Participant 执行流水账。
> 最后更新：2026-08-21（P2 Engineering Closure / Run-Observe Entry）。

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
- **P2 Multi-round Execution Validation：DESIGN ACCEPTED / ENGINEERING CLOSED；**
- P2 deterministic engineering path 已验证：`Round 1 → bounded configuration execution → scope verification → verification → real Phase 0 rerun → new sealed source → Round 2 → STOP`；
- P2 已验证 no-op execution、authoritative repository mutation、scope violation、verification / rerun failure 等边界会 fail closed；
- P2 不修改 authoritative product state，也不包含 repository promotion / commit / merge。

这些结果支持当前系统进入真实使用 / 观察阶段。

第一 Skill 当前继续视为可用 working method；不要求先完成 Skill-off / Skill-on behavioral A/B 才能继续使用。

## 3. 当前仍未证明

以下内容不要因 deterministic engineering validation 或设计意图而写成已成立：

- **真实 Participant 驱动的一次 cross-round product transition 尚未被观察到；P2 real product hypothesis = `UNVERIFIED`；**
- 多轮真实运行在长期使用中的稳定性；
- 每个真实 run 都能或都应该进入下一轮；
- Participant Communication Contract 的最终形态；
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

### P3 — Participant Communication Contract Consolidation

**DEFERRED / NOT CURRENTLY ACTIVE。**

P3 应在真实多轮运行提供足够通信 evidence 后归纳。

未来重点固化：

- 输入 / 输出 schema；
- 字段语义；
- authority / provenance / reference；
- fact / evidence / inference / opinion / unknown；
- workflow outcome；
- participant failure；
- permission / STOP boundary。

继续遵守：

> **纠正通信，不纠正思想。**

不预先绑定 MCP，不在缺少真实多轮 evidence 时先建设协议平台。

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
4. P2 engineering path 完整？→ **YES / CLOSED**
5. P2 deterministic cross-round path 已验证？→ **YES**
6. P2 real Participant product hypothesis 已验证？→ **NO / UNVERIFIED**
7. 当前阶段？→ **RUN / OBSERVE**
8. 当前应该继续加 P2 代码？→ **NO**
9. P3 Communication Contract 当前启动？→ **NO / wait for real multi-round evidence**
10. Report 是否主流程依赖？→ **NO**
11. Report Analysis 是否当前建设？→ **NO**
12. MCP 是否已选定？→ **NO**
13. code-level autonomous modification？→ **NOT AUTHORIZED**
14. repository promotion / commit / merge 是否属于当前自动能力？→ **NO**
