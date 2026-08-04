# Late-Life Active Action Player Experience Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 通过十二个正式 Snapshot 检查点和至少 60 次 Browser 主动行动决策，建立可复现的中晚年体验基线。

**Architecture:** 复用现有固定 persona、Headless session、Snapshot Contract 和 Browser Save/Load。Browser 选择只依据公开信息；oracle 结果只能在选择完成后读取。所有新增代码均为只读分析或验收工具。

**Tech Stack:** TypeScript、Node/tsx、Snapshot 3.13.0、Vue/Vite、现有 Browser automation、Markdown。

## Global Constraints

- 不修改主动行动、事件、persona、oracle、PlayerState、Snapshot、产品 UI、P8 或 P11。
- 固定样本：martial/801、wealth/804、balanced/810。
- 固定目标年龄：30、45、60、75。
- 每个检查点完成 5 次主动行动，正式 terminal 除外。
- Browser 选择前不得读取 hidden effects 或 oracle。
- 使用正式 Snapshot 和正式 Browser restore 路径。
- 保留 dirty worktree，不提交、不重置、不清理无关变化。
- 历史非绿色测试只做前后 fingerprint 对比。

---

### Task 1: 建立观察记录与基线指纹

**Files:**
- Create: `tests/experience/lateLifeBaselineTypes.ts`
- Create: `tests/experience/lateLifeBaselineTypes.test.ts`
- Create: `docs/test-reports/late-life-active-action-player-experience-baseline.md`

**Produces:**

```ts
type DecisionReadability =
  | 'CLEAR'
  | 'PARTIALLY_CLEAR'
  | 'UNCLEAR'
  | 'MISLEADING';

type LongTermEcho =
  | 'IMMEDIATE_ONLY'
  | 'STATE_ECHO'
  | 'EVENT_ECHO'
  | 'SUMMARY_ECHO'
  | 'ENDING_ECHO';

type ResultRepetition =
  | 'UNIQUE'
  | 'EXACT_REPEAT'
  | 'TEMPLATE_REPEAT'
  | 'SEMANTIC_REPEAT';
```

- [ ] 定义 checkpoint、公开候选、Browser 选择理由、结果 delta、presentation、oracle 对照和 failure fingerprint 类型。
- [ ] 测试 JSON round-trip 保留候选顺序、枚举和值。
- [ ] 运行并保存完整输出：

```bash
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

- [ ] 在报告写入阶段前 exit code、失败 suite/rule/event、blockers 和 warnings。
- [ ] 不修改任何失败对应的产品或事件文件。
- [ ] 运行：

```bash
npm exec -- tsx tests/experience/lateLifeBaselineTypes.test.ts
```

---

### Task 2: 生成十二个 canonical 检查点

**Files:**
- Create: `tests/experience/generateLateLifeCheckpoints.ts`
- Create: `tests/experience/generateLateLifeCheckpoints.test.ts`
- Generate: `.tmp/late-life-active-action-baseline/checkpoints/*`

**Produces:**

```ts
type LateLifeCheckpointManifest = {
  schemaVersion: 1;
  checkpoints: Array<{
    id: string;
    personaId: string;
    seed: number;
    targetAge: 30 | 45 | 60 | 75;
    actualAge: number;
    phase: 'active_action';
    snapshotPath: string;
    snapshotHash: string;
    publicFingerprint: PublicStateFingerprint;
  }>;
};
```

- [ ] 复用现有完整人生 Trace 使用的 persona 定义和 Headless runner，不建立第二套 persona engine。
- [ ] 对每个 persona/seed/targetAge 正式推进 session。
- [ ] 仅在 `age >= targetAge && sessionPhase === 'active_action'` 时导出。
- [ ] terminal 先发生时记录 `terminal_before_target`，不伪造状态。
- [ ] 使用现有 Snapshot converter 导出并通过 3.13.0 Contract。
- [ ] fingerprint 精确记录：

```text
age, money, martialPower, knowledge, businessAcumen,
connections, reputation, healthStatus, affiliation,
title, alive, ending.id
```

- [ ] 连续生成两次，排除时间戳和绝对临时路径后比较 checkpoint ID、实际年龄、fingerprint 和 Snapshot hash。
- [ ] 运行：

```bash
npm exec -- tsx tests/experience/generateLateLifeCheckpoints.test.ts
npm exec -- tsx tests/experience/generateLateLifeCheckpoints.ts
```

---

### Task 3: 验证 Browser 恢复 parity

**Files:**
- Create: `tests/experience/lateLifeBrowserCheckpointAcceptance.ts`
- Modify: 仅必要的现有 Browser test harness helper。

- [ ] 通过现有 Local save、API slot 或已存在的正式 Browser fixture restore 路径恢复每个 Snapshot。
- [ ] 禁止直接给 store 赋值或页面脚本写 PlayerState。
- [ ] 从 UI 或正式 DTO 读取公开字段。
- [ ] 将 Browser/DTO fingerprint 与 manifest 比较。
- [ ] 对每个检查点验证：

```text
active-action choices visible
no application Console error
desktop no horizontal overflow
390px no horizontal overflow
```

- [ ] 任意字段不一致时停止并报告 checkpoint、restore path、Snapshot 值、Browser 值和首个差异字段。
- [ ] 不在 parity 失败状态上继续采样。

---

### Task 4: 完成至少 60 次可见信息决策

**Files:**
- Create: `tests/experience/lateLifeBrowserDecisionLog.ts`
- Create: `tests/experience/runLateLifeBrowserDecisions.ts`
- Create: `tests/experience/runLateLifeBrowserDecisions.test.ts`
- Generate: `.tmp/late-life-active-action-baseline/observations.json`

- [ ] 每个检查点独立恢复。
- [ ] 每次选择前记录：
  - 公开状态；
  - 可见行动顺序；
  - 名称、说明、公开成本、风险和收益方向；
  - 是否为新 action/结构；
  - 选择和一句公开理由。
- [ ] 选择代码路径不得接收 oracle 或 hidden effects。
- [ ] 按当前阶段文档执行 martial、wealth、balanced 协议。
- [ ] 选择后完整推进正式 continuation、disturbance、period summary、被动事件，直到下一 `active_action` 或 terminal。
- [ ] 只计正式 active-action step，不重复计算续接 payload。
- [ ] 记录公开 delta、action summary、收益递减、disturbance、period summary 和后续事件。
- [ ] 每个检查点完成 5 次，terminal 除外。
- [ ] 测试以下不变量：

```text
pre-choice 不含 hidden effects
choice 必须存在于 visible candidates
reason 非空
sequence 连续
decision 1 前 fingerprint 与 checkpoint 一致
```

- [ ] 运行：

```bash
npm exec -- tsx tests/experience/runLateLifeBrowserDecisions.test.ts
npm exec -- tsx tests/experience/runLateLifeBrowserDecisions.ts
```

---

### Task 5: 事后 oracle 对照

**Files:**
- Create: `tests/experience/compareLateLifeOracleChoices.ts`
- Create: `tests/experience/compareLateLifeOracleChoices.test.ts`

**Produces:**

```ts
type OracleDifferenceReason =
  | 'HIDDEN_EFFECTS'
  | 'FIXED_PRIORITY'
  | 'UNNORMALIZED_UNITS'
  | 'CANDIDATE_ORDER'
  | 'VISIBLE_RISK_AVOIDANCE'
  | 'VISIBLE_STATE_BALANCING'
  | 'OTHER';
```

- [ ] 每次 Browser 选择和理由已经写入日志后，才读取同状态的 oracle。
- [ ] 第 2～5 次决策使用 Browser 正式执行后的 pre-choice state，不使用原始 checkpoint。
- [ ] hidden candidate scores 只写入 post-choice analysis 区。
- [ ] 记录 browserChoice、oracleChoice、same 和差异原因。
- [ ] 测试移除 oracle 模块后 Browser 决策日志仍能独立生成。
- [ ] 运行：

```bash
npm exec -- tsx tests/experience/compareLateLifeOracleChoices.test.ts
npm exec -- tsx tests/experience/compareLateLifeOracleChoices.ts
```

---

### Task 6: 分析行动结构、反馈和长期回响

**Files:**
- Create: `tests/experience/analyzeLateLifeActiveActions.ts`
- Create: `tests/experience/analyzeLateLifeActiveActions.test.ts`
- Modify: `docs/test-reports/late-life-active-action-player-experience-baseline.md`

- [ ] 对每个 persona/window 计算：
  - visible action count；
  - 新增/消失 action ID；
  - Jaccard similarity；
  - complete action set 是否相同。
- [ ] 对玩家可见结果计算：
  - exact repeat；
  - 仅标准化数字和空白后的 template repeat。
- [ ] 生成 semantic repeat 人工复核队列，不自动下结论。
- [ ] 根据公开预期与实际结果分类 CLEAR/PARTIALLY_CLEAR/UNCLEAR/MISLEADING。
- [ ] 每个 MISLEADING 必须记录公开承诺与矛盾结果。
- [ ] 根据明确 effect/state/event/summary/ending 证据分类长期回响；不根据时间相邻推断因果。
- [ ] 计算 Browser/oracle divergence rate 和原因分布。
- [ ] 使用合成样本测试精确计数、Jaccard、模板分组和 divergence totals。
- [ ] 运行：

```bash
npm exec -- tsx tests/experience/analyzeLateLifeActiveActions.test.ts
npm exec -- tsx tests/experience/analyzeLateLifeActiveActions.ts
```

---

### Task 7: 完成报告和阶段收口

**Files:**
- Modify: `docs/test-reports/late-life-active-action-player-experience-baseline.md`
- Modify: `docs/governance/current-product-stage.md`

- [ ] 报告必须包含：
  - Executive Summary；
  - Evidence Boundary；
  - Baseline Failure Fingerprint；
  - Checkpoint Generation；
  - Browser State Parity；
  - Decision Sample；
  - Action Set Progression；
  - Decision Readability；
  - Result Repetition；
  - Long-Term Echo；
  - Browser/Oracle Divergence；
  - Product Defects；
  - Simulator Bias；
  - Evidence Gaps；
  - Top 3 Problems；
  - Unique Next Slice；
  - Do Not Do；
  - Verification。
- [ ] 只能选择 A/B/C/D/E 中一个，并解释其余四个为何不是当前优先级。
- [ ] 重新运行：

```bash
npm test
npm run validate:event-quality
npm run gate:playability
npm run gate:p11-scheduling
git diff --check
```

- [ ] 比较阶段前后失败 fingerprint，确认没有新增或扩大。
- [ ] 运行全部专项测试。
- [ ] 只有在 checkpoint parity、Browser 样本、报告和失败对比都完成时，才标记阶段完成。
- [ ] 完成后停止，不实施推荐的产品 Slice。
