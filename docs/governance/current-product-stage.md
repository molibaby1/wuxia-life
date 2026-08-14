# Wuxia-Life 当前产品阶段

用途：滚动看板——回答「现在做到哪、允许做什么、禁止做什么」。
不是长期产品规范，不是实施流水账。

最后更新：2026-08-14（Auto Evolution improvement-hypothesis successor：deterministic implementation complete）

---

## 1. 当前产品目标

做一款能被玩家认真过完一生的武侠人生游戏。

当前治理重点：保持产品模型收敛；improvement-hypothesis successor 的 **deterministic implementation 已完成并通过验证**，但 **real external participant smoke 未跑**，**Human implementation review 仍 PENDING**，**implementation acceptance 未授予**。下一步只能由 Human 决定是否授权一次 real hypothesis-participant smoke。

---

## 2. 当前 Authority

| 层级 | 文档 |
| --- | --- |
| 第一层产品规范 | `docs/product/player-model.md` |
| 第一层产品规范 | `docs/product/auto-evolution-model.md` |
| 长期决策 | `docs/governance/product-decisions.md`（含 PD-055） |
| 协作规则 | `docs/governance/ai-collaboration-workflow.md` |
| 收敛原则 | `docs/governance/project-convergence.md` |
| 文档入口 | `docs/README.md` |

方向转折压缩记录：`docs/history/2026-08-auto-evolution-direction-reset.md`

---

## 3. 已完成且仍然有效的基础能力（压缩）

| 能力 | 状态 | 含义 |
| --- | --- | --- |
| Snapshot / 存档契约 | 有效 | Snapshot `3.14.0`；无迁移；Local/API/Headless 共用正式语义 |
| B0 护栏校准 | 已关闭 | 隔离实验护栏可复现；**不**授权正式配置修改或自动合入 |
| B1.0 实验边界 | 已关闭 | 实例级 candidate catalog 可不污染正式配置做对照实验 |
| Phase 0 player-observable boundary | **有效** | 可生成 deterministic、只含玩家可见信息的材料；继续作为外部参与边界的通用基础；不是 Reviewer 产品 |
| Minimal External Feedback Loop | **CLOSED / Human accepted** | 第一次把真实游戏体验交给外部参与者并完整收回对方自己的体验反馈；见 §3.1 |
| Improvement Hypothesis Successor | **implementation complete / deterministic verification passed** | 可从已完成 MEF source 形成 0..N 待 Human 审阅的改善假设；real smoke 未跑；见 §3.2 |
| Reviewer Calibration / qualification / gold-answer | **已退休并清理** | 实现已从仓库移除；不得复活 |
| 青年重大机会因果化 | 已关闭 | 门派/爱情/幽影门/武林大会由事实开启、可永久错过 |
| Life Milestone 最小切片 | 工程完成 | 体验是否改善待独立 Player Experience Validation |
| P8 frustration 语义 | 有效 | 实际负面证据口径；P9/P40 自动分不构成正式验收 |

细节与历史 run ID 见 Git history；本看板不复述完整验收命令。

### 3.1 Minimal External Feedback Loop（CLOSED）

**产品能力（白话）：** Wuxia-Life 第一次能够把一次真实游戏体验交给游戏外部的参与者，并把对方自己的体验反馈完整收回来。

**历史授权路径：**

```text
Human implementation authorization
→ 实施完成
→ 真实 external participant smoke
→ Human Review ACCEPTED
→ CLOSED
```

**已发生的客观链路：**

```text
真实 Wuxia-Life run
→ sealed player-observable material
→ 真实外部参与者调用
→ 完整 raw participant response 保存
→ structured feedback
→ Human 同时查看游戏经历与对应反馈
→ Human accepted
```

**Accepted evidence（runtime artifact，不要求入库）：**

| 字段 | 值 |
| --- | --- |
| runRef | `minimal-external-feedback-smoke-001` |
| invocationRef | `minimal-external-feedback-smoke-001-deepseek-player-feedback-001` |
| experimentRootHash | `0236b0686cad25bf80957e6d8f1bcb0233c8c040ed5bc39467589caf8181d43f` |
| observablePayloadHash | `6faeff5761af69877f1a89674b4f5a551e93970183c90a34bf07fb0afa3f6758` |
| provider（实现层） | `deepseek` |
| modelRequested / modelReturned（实现层） | `deepseek-v4-flash` |
| status | `completed` |
| Human report | `artifacts/reports/evolution/minimal-external-feedback/feedback-runs/minimal-external-feedback-smoke-001/human-review.md` |

**产品语义边界：**

- 角色是工作；参与者是完成工作的人或外部系统。
- DeepSeek / `deepseek-v4-flash` / Chat Completions 只是第一版具体接入，**不是**产品层永久模型；换成真人或其他外部系统，核心流程仍成立。
- Implementation plan 曾写 OpenAI Responses API + `gpt-5`；最终实现为 DeepSeek Chat Completions + `deepseek-v4-flash`。这是 **implementation deviation**，不是产品语义变更（仍是单一具体外部 LLM、无 generic participant framework）。

**Human acceptance 判定的是通信与可追溯性，不是主观意见对错：**

- player-observable boundary 成立；
- 真实 external invocation 发生；
- raw feedback 完整保存；
- run / invocation / observable 可追溯；
- Human 能同时看到参与者当时看到的体验与其原始回答。

继续：`纠正通信，不纠正思想。`（PD-055）

本阶段**没有**恢复 gold answer、Reviewer qualification、participant score、precision/recall、severity/confidence taxonomy、experience/subjective correctness、Freeze Checkpoint。

### 3.2 Improvement Hypothesis Successor（deterministic implementation）

**产品能力（白话）：** Wuxia-Life 第一次能够从一次真实外部体验反馈中形成 0..N 条待 Human 审阅的改善假设，并明确区分观察、推断和仍未知的信息。

**当前状态（必须准确）：**

```text
Auto Evolution improvement-hypothesis successor:
implementation complete
deterministic verification passed
real external participant smoke: NOT RUN
Human implementation review: PENDING
implementation acceptance: NOT GRANTED
next action: STOP and ask Human whether to authorize one real hypothesis-participant smoke
```

**已实现链路（mocked provider only）：**

```text
completed MEF source (game-runs + feedback-runs)
→ read-only source validation (Phase 0 seal / hashes / feedback identity)
→ Hypothesis Formation participant (injected/mocked in tests)
→ 0..N improvement hypotheses
→ Human review artifact
→ STOP
```

**未发生：** 真实 DeepSeek / 其他 external hypothesis-participant 调用；Human 对 implementation 的接受；modification / candidate / Verifier。

**未授权：**

- 未授权 modification proposal
- 未授权 candidate generation
- 未授权 Verifier
- 未授权 promotion
- 未授权 Phase 2

DeepSeek 仍是第一版具体接入细节，不是产品 authority。

---

## 4. 当前授权

**Minimal External Feedback Loop：已授权 → 已实施 → real smoke → Human accepted → CLOSED。**

**Auto Evolution successor 产品设计：Human Review ACCEPTED。**

已接受设计：

- `docs/superpowers/specs/2026-08-14-auto-evolution-improvement-hypothesis-successor-design.md`
- 产品终点：`participant feedback → 0..N improvement hypotheses → Human Review → STOP`

**Planning：已由 Human 于 2026-08-14 明确授权并 ACCEPTED。**

- `docs/superpowers/plans/2026-08-14-auto-evolution-improvement-hypothesis-successor.md`

**Implementation：已由 Human 明确授权；deterministic implementation 已完成并通过验证。**

**仍未授权 / 仍未发生：**

- real external hypothesis-participant smoke；
- Human implementation review / acceptance；
- modification proposal、candidate、Verifier、promotion、Phase 2。

允许在当前阶段内：文档治理、工程收敛、已关闭能力范围内的普通 bugfix / 回归。

---

## 5. 当前 STOP / 禁止

- **STOP：deterministic implementation complete；等待 Human Review / 是否授权 real smoke。**
- 不得在未获 Human 另行授权时真实调用 hypothesis participant；
- 不得进入 modification proposal、candidate、Verifier、promotion 或下一 successor；
- 不得开始 ExternalParticipant framework、provider registry、多模型平台、Planner、Blind Verifier、population、自动进化闭环；
- 不得把已关闭的最小反馈闭环扩展成完整 Auto Evolution loop；
- 不得重建 Reviewer Calibration / qualification / gold-answer；
- 不得把 candidate 自动写回正式事件配置或自动发布；
- 不得因 sunk cost 把已完成实现抬成产品主线；
- 不得把 `docs/superpowers/**` 的 spec/plan 当作第一层产品 authority。

---

## 6. Candidate next work（≠ 授权）

当前候选（**不是授权**）：

1. Human 审阅 deterministic implementation；
2. Human 决定是否授权一次 real hypothesis-participant smoke；
3. 仅在 Human 另行授权后，才可能进入下一产品决策。

当前不得预先设计或实施 modification proposal / candidate / Verifier / Phase 2。

---

## 7. 给新 Agent 的一分钟检查单

1. 第一层产品规范是什么？→ `player-model` + `auto-evolution-model`
2. Reviewer Calibration？→ 退休且代码已删
3. Phase 0？→ 边界能力仍有效，不是 Reviewer 台阶
4. Minimal External Feedback Loop？→ **CLOSED / Human accepted**
5. Improvement Hypothesis Successor？→ **implementation complete / deterministic verification passed；real smoke NOT RUN；Human review PENDING；acceptance NOT GRANTED**
6. 现在能真实调用 DeepSeek 做 hypothesis smoke 吗？→ **不能，等待 Human 另行授权**
7. 现在能做 modification / candidate / Verifier 吗？→ **不能**
8. Phase 2？→ **未授权**
9. 当前 STOP 在哪里？→ **deterministic implementation complete；等待 Human Review / 是否授权 real smoke**
