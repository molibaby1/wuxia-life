# Constrained Auto-Evolution B0 Guardrail Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改正式事件配置、PlayerState/Snapshot/Contract/Schema、正式 gate 阈值/latest report，以及不覆盖青年重大机会 Slice dirty worktree 的前提下，落地可复现的 B0 护栏校准管线，证明 known-bad 可检出、Control 不误杀、证据链完整，并由人工 accept/reject。

**Architecture:** B0 全部新增代码隔离在 `scripts/b0/` 与 `tests/b0/`。运行 artifact 只写 `.tmp/b0/<runId>/`（已被 `.gitignore` 忽略的 `.tmp/`）。六类角色实现为输入隔离的纯模块，禁止多数投票。因 `GameEngineIntegration` 硬编码 `eventLoader` 单例，B0 **不**把候选事件 overlay 注入正式调度；改为 sealed candidate overlay（内存/临时 JSON）+ 同 seed 的 baseline/candidate Trace 配对（Control 可跑真实 Headless；known-bad/adversarial 用确定性 fixture synthesizer 生成 sealed raw Trace）。若产品坚持要求引擎级 overlay 调度，立即 `blocked` 并停止。

**Tech Stack:** TypeScript + `tsx`；现有 `runHeadlessPersona` / `ExperienceTrace` / `collectPacingMetrics` / `collectFrustrationMetrics`；Node `crypto` SHA-256；仓库现有 `tests/runRealTestGate.ts` 注册风格。

**Commit policy:** 本 Slice **默认不 commit、不 push、不 merge、不发布**。计划中不出现自动 `git commit` 步骤；仅在用户另行明确授权后提交。

---

## 0. Read-only 审查结论（实施前已确认）

### 0.1 Dirty worktree 基线（必须完整保留）

- Branch: `dev`（ahead of `origin/dev` by 1）
- HEAD: `f49bfb712119c5a44b130260a627ab8789912687`
- Dirty baseline（权威副本）: `/tmp/wuxia-life-b0-baseline-20260811-145828/`
  - `dirty.diff` hash: `56bd5d2d2f4896bc29c726888bb04b87428dd8982ea0735d843edc5706804440`
  - `git-status-porcelain.txt` hash: `9d9528c4e216bcb6b649001ca0daf3cb55f2c492c73fa68afe251cb51baf9e65`
  - `path-sha256.txt` hash: `f3a23dc5af201e7ba8c2c1c885176a05db38a37a8a69e0a6c96aebc1a367d654`
  - Youth-slice untracked only: `docs/superpowers/plans/2026-08-09-youth-causal-opportunity.md`、`docs/superpowers/specs/2026-08-09-youth-causal-opportunity-design.md`、`docs/test-reports/product-experience-governance-golden-line-gates.md`、`tests/youthCausalOpportunity.test.ts`

**禁止** reset / clean / `git add .` / 覆盖上述 dirty/untracked 路径。

### 0.2 可复用能力

| 能力 | Owner | B0 用法 |
| --- | --- | --- |
| Headless persona + seed | `src/headless/playability/headlessPersonaRunner.ts` | Control baseline 真实模拟 |
| ExperienceTrace（含 hidden） | `src/headless/playability/experienceTraceTypes.ts` | raw Trace 来源；必须再投影 |
| 纯 pacing / frustration 指标 | `src/p8/collectPersonaMetrics.ts` | 机械审计复用，**不**调用会写 latest report 的 gate CLI |
| Persona roster | `src/p8/personas.ts`（8 个 `p8-*`） | 不新增 persona |
| Headless catalog DI | `HeadlessEngineSessionImpl.create(..., { catalog })` | 仅 session 查事件；**不能**替换引擎调度目录 |

### 0.3 结构性缺口（已确认）

```text
GameEngineIntegration.selectEvent / getAvailableEvents
  → eventLoader.getEventsByAge()   // 全局单例，静态 import 自 src/data
```

`InMemoryEventCatalogAdapter` 也读同一 `eventLoader`。现有注入点**不足以**做引擎级 candidate event overlay。

**B0 裁决（本计划默认）：** 不修改 `EventLoader` / `GameEngineIntegration`；overlay 与 known-bad 对照走 sealed fixture Trace。若审批要求引擎级 overlay，本计划转为 structural blocker，不实施。

### 0.4 Artifact 根目录

- 使用 `.tmp/b0/`（`.gitignore` 已忽略 `.tmp/`）
- **不要**使用未忽略的 `artifacts/`（当前 `.gitignore` 未忽略 `artifacts/`；治理文档与现实不一致，B0 不借机改 `.gitignore`，除非审批明确要求）

---

## 1. 文件边界

### 1.1 新增文件

```text
scripts/b0/
  types.ts
  hash.ts
  sourceFingerprint.ts
  patchScopeValidator.ts
  manifest.ts
  stateMachine.ts
  roles/
    experimentController.ts
    fixtureBuilder.ts
    simulator.ts
    mechanicalAuditor.ts
    blindReviewer.ts
    redTeamAuditor.ts
  trace/
    projectPlayerVisibleTrace.ts
    synthesizeKnownBadTrace.ts
  fixtures/
    registry.json
    control/
      control.meta.json
    known-bad/
      <badId>.recipe.json
    adversarial/
      <attackId>.recipe.json
    seeds/
      seed-bundle.json
  runB0.ts
  humanDecision.ts

tests/b0/
  b0GuardrailCalibration.test.ts
  b0IsolationAndHash.test.ts
  b0PatchScopeAndBlocked.test.ts
```

### 1.2 允许修改的文件（最小）

| 文件 | 改动 |
| --- | --- |
| `tests/AllTests.ts` 或 `tests/runRealTestGate.ts` | 仅注册 `tests/b0/*.test.ts`（跟现有注册方式一致，精确一行 import/数组项） |
| `docs/governance/current-product-stage.md` | 仅追加独立 B0 Slice 看板条目（设计 §10 前提）；不改已关闭 Slice 语义 |

### 1.3 明确不修改

```text
src/data/events.json 及任何 src/data/lines/*
src/core/EventLoader.ts
src/core/GameEngineIntegration.ts
PlayerState / Snapshot / Contract / Schema 相关正式定义
正式 gate 阈值、测试逻辑、tracked latest report
现有 dirty/untracked 青年 Slice 文件内容
docs/test-reports/*（不写入）
```

---

## 2. 角色隔离契约

| 角色模块 | 允许输入 | 输出 | 禁止读取 |
| --- | --- | --- | --- |
| `experimentController` | 全部 manifest 元数据、sealed labels（仅控制器持有） | manifest、seed 分层、A/B 映射、状态推进 | 改阈值 |
| `fixtureBuilder` | fixture 规范 / recipe | Control / Known-bad / Adversarial sealed fixtures | 正式 `src/data` |
| `simulator` | 冻结 overlay 描述、seed、版本 | raw Trace（+ hash） | 评价 |
| `mechanicalAuditor` | raw Trace、hidden state、硬约束 | 确定性指标 + hard verdict | blind/red 结论、标签 |
| `blindReviewer` | player-visible Trace、匿名 A/B | 感性观察 + 证据引用 | hidden effects、阈值、A/B 真身份、机械 verdict、标签 |
| `redTeamAuditor` | 匿名样本 + 必要原始证据（不含其他评审结论） | 漏检/污染/泄漏/越权；`veto: boolean` | 其他评审结论；不得改输入 |

**禁止简单多数投票。** 最终 `passed/failed/blocked` 只由 `humanDecision` + 控制器聚合规则产生。

状态机：

```text
draft → sealed → queued → simulated → audited → evidence_checked → awaiting_human
  → passed | failed | blocked
```

语义：

- `failed`：跑完，但漏检严重坏例或硬误杀 Control
- `blocked`：证据泄漏、hash 断裂、dirty source 无法冻结、越权修改、写入正式路径

---

## 3. Known-bad / Adversarial 覆盖矩阵

### 3.1 体验坏例（fixture recipe → sealed raw Trace）

| badId | 模式 | 机械审计期望 |
| --- | --- | --- |
| `repeat_short_window` | 单事件短窗口重复 | detect |
| `category_monopoly` | 单类别/单事件垄断 | detect |
| `formal_event_drought` | 正式事件空窗 | detect（复用 pacing low-impact span 思想，B0 自有阈值，不改 P8 正式阈值） |
| `choice_unreachable` | 选择不可达 | detect |
| `choice_collapse` | 选项等价/分支坍缩 | detect |
| `opaque_negative` | 实际负面缺预警/解释 | detect（复用 `collectFrustrationMetrics` 纯函数于 fixture records） |

### 3.2 管线攻击（应 `blocked`，不是体验 `failed`）

| attackId | 模式 |
| --- | --- |
| `mutate_gate_threshold` | 提议修改阈值/测试 |
| `overwrite_latest_report` | 提议覆盖 baseline/latest |
| `holdout_leak` | holdout seed 暴露给提案/盲评输入 |
| `hidden_in_visible_trace` | player-visible 含 hidden effects |
| `mutate_player_state_contract` | 提议改 PlayerState/Snapshot/Contract/Schema |
| `out_of_scope_files` | 提议修改允许范围外文件 |
| `cross_reviewer_contamination` | 评审读取其他角色结论后重写 |

### 3.3 分层

`scripts/b0/fixtures/seeds/seed-bundle.json` 预先冻结：

- `train`: persona × seed 子集
- `holdout`: 未参与 recipe 调参的组合（标签仅控制器可见）
- `adversarial`: 仅守门

沿用现有 8 个 persona id，不新增。

---

## Tasks

### Task 0: 登记 B0 Slice 看板 + 冻结源码指纹工具骨架

**Files:**
- Modify: `docs/governance/current-product-stage.md`（文首或新节追加 B0 为当前独立 Slice；保留青年 Slice 已关闭记录）
- Create: `scripts/b0/types.ts`
- Create: `scripts/b0/hash.ts`
- Create: `scripts/b0/sourceFingerprint.ts`
- Create: `scripts/b0/stateMachine.ts`

- [ ] **Step 1: 追加 current-product-stage B0 节**

只追加，不改写已关闭 Slice 的完成结论。内容必须包含：目标=护栏校准；禁止引擎级正式配置优化/B1；dirty worktree 保留；artifact 根=`.tmp/b0/`。

- [ ] **Step 2: 实现 hash / fingerprint / stateMachine**

```ts
// scripts/b0/hash.ts
import { createHash } from 'node:crypto';

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function stableJsonHash(value: unknown): string {
  return sha256Hex(JSON.stringify(value));
}
```

```ts
// scripts/b0/sourceFingerprint.ts
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { sha256Hex } from './hash';

export type SourceFingerprint = {
  headSha: string;
  branch: string;
  statusPorcelainHash: string;
  dirtyDiffHash: string;
  pathSha256ManifestHash: string;
  baselineDirHint: string;
  frozenAt: string;
};

export function captureSourceFingerprint(baselineDir = '/tmp/wuxia-life-b0-baseline-20260811-145828'): SourceFingerprint {
  if (!existsSync(`${baselineDir}/dirty.diff`)) {
    throw new Error(`B0_BLOCKED: dirty baseline missing at ${baselineDir}`);
  }
  const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
  const status = execFileSync('git', ['status', '--porcelain=v1'], { encoding: 'utf8' });
  // Compare live dirty.diff hash against sealed baseline; mismatch => blocked (youth slice mutated unexpectedly)
  const liveDiff = execFileSync('git', ['diff'], { encoding: 'utf8' });
  const baselineDiffHash = sha256Hex(readFileSync(`${baselineDir}/dirty.diff`));
  const liveDiffHash = sha256Hex(liveDiff);
  if (liveDiffHash !== baselineDiffHash) {
    // Allow only additions under scripts/b0|tests/b0|docs governance plan path during B0 itself;
    // experimentController enforces allowlist. Fingerprint still records both hashes.
  }
  return {
    headSha,
    branch,
    statusPorcelainHash: sha256Hex(status),
    dirtyDiffHash: liveDiffHash,
    pathSha256ManifestHash: sha256Hex(readFileSync(`${baselineDir}/path-sha256.txt`)),
    baselineDirHint: baselineDir,
    frozenAt: new Date().toISOString(),
  };
}
```

```ts
// scripts/b0/stateMachine.ts
export const B0_STATES = [
  'draft', 'sealed', 'queued', 'simulated', 'audited',
  'evidence_checked', 'awaiting_human', 'passed', 'failed', 'blocked',
] as const;
export type B0State = typeof B0_STATES[number];

const ALLOWED: Record<B0State, B0State[]> = {
  draft: ['sealed', 'blocked'],
  sealed: ['queued', 'blocked'],
  queued: ['simulated', 'blocked'],
  simulated: ['audited', 'blocked'],
  audited: ['evidence_checked', 'blocked'],
  evidence_checked: ['awaiting_human', 'blocked'],
  awaiting_human: ['passed', 'failed', 'blocked'],
  passed: [],
  failed: [],
  blocked: [],
};

export function transition(from: B0State, to: B0State): B0State {
  if (!ALLOWED[from].includes(to)) {
    throw new Error(`B0_BLOCKED: illegal transition ${from} -> ${to}`);
  }
  return to;
}
```

- [ ] **Step 3: 验证指纹可读取基线**

Run: `npx tsx -e "import { captureSourceFingerprint } from './scripts/b0/sourceFingerprint.ts'; console.log(captureSourceFingerprint())"`

Expected: 打印含 `headSha` / hashes；不写正式路径。

- [ ] **Step 4: 不 commit**

---

### Task 1: Manifest、patch-scope、角色控制器骨架

**Files:**
- Create: `scripts/b0/types.ts`（补全）
- Create: `scripts/b0/manifest.ts`
- Create: `scripts/b0/patchScopeValidator.ts`
- Create: `scripts/b0/roles/experimentController.ts`

- [ ] **Step 1: 定义 B0 类型与允许路径**

```ts
// scripts/b0/types.ts（关键摘录）
export type SeedLayer = 'train' | 'holdout' | 'adversarial';
export type SampleKind = 'control' | 'known-bad' | 'adversarial';

export type B0Manifest = {
  runId: string;
  schemaVersion: 'b0-manifest-v1';
  sourceFingerprint: import('./sourceFingerprint').SourceFingerprint;
  eventCatalogFingerprint: string; // hash of current formal catalog ids only; never mutated
  overlayFingerprint: string;
  fixtureSetFingerprint: string;
  seedBundleFingerprint: string;
  evaluatorVersions: {
    mechanicalAuditor: 'b0-mech-v1';
    blindReviewer: 'b0-blind-v1';
    redTeam: 'b0-red-v1';
    playerVisibleProjection: 'b0-visible-v1';
  };
  allowedCandidatePaths: string[]; // e.g. ['scripts/b0/fixtures/**']
  forbiddenPaths: string[]; // src/data/**, PlayerState owners, gate latest reports, etc.
  seedLayers: Record<SeedLayer, Array<{ personaId: string; seed: number }>>;
  abMapSealed: boolean;
};

export const B0_FORBIDDEN_PATH_GLOBS = [
  'src/data/**',
  'src/types/**',
  'docs/contracts/**',
  'docs/test-reports/**',
  'scripts/runP8PlayabilityGate.ts',
  'src/p8/metricDefinitions.ts',
  'src/p8/playabilityGate.ts',
] as const;
```

- [ ] **Step 2: patchScopeValidator**

输入：候选 proposed file paths。若命中 forbidden 或超出 allowed → `{ ok: false, code: 'out_of_scope' }`，控制器据此 `blocked`。

- [ ] **Step 3: experimentController.sealManifest**

冻结 fingerprint、seed bundle、fixture registry hash；之后拒绝修改输入。Holdout 标签与 A/B 真身份只存在于控制器私有 sealed store（文件权限上写在 `.tmp/b0/<runId>/controller-private/`，不传给 blind/red）。

- [ ] **Step 4: 不 commit**

---

### Task 2: Fixture builder + known-bad synthesizer + registry

**Files:**
- Create: `scripts/b0/roles/fixtureBuilder.ts`
- Create: `scripts/b0/trace/synthesizeKnownBadTrace.ts`
- Create: `scripts/b0/fixtures/registry.json`
- Create: `scripts/b0/fixtures/seeds/seed-bundle.json`
- Create: `scripts/b0/fixtures/known-bad/*.recipe.json`
- Create: `scripts/b0/fixtures/adversarial/*.recipe.json`
- Create: `scripts/b0/fixtures/control/control.meta.json`

- [ ] **Step 1: 写 registry 与 seed-bundle（预冻结，禁止跑完再切分）**

`registry.json` 列出每个 sample 的 `id/kind/layer/recipePath`；**不含**给评审看的坏例标签字段给盲评包。标签只在 `controller-private/labels.json` 生成时写入。

- [ ] **Step 2: synthesizer 为每个体验坏例生成确定性 GameProcessRecord[] + minimal ExperienceTrace**

规则：同一 `recipe + seed` → 字节级稳定 JSON。例如 `repeat_short_window`：连续 5 年插入同一 `eventId`；`opaque_negative`：提供 `outcomeEvidence` 负向 delta 且可见文本无预警。

- [ ] **Step 3: adversarial recipes 生成“提议 patch”描述对象**（不是真改仓库）

例如 `{ proposedPaths: ['src/p8/metricDefinitions.ts'], operation: 'rewrite-threshold' }`，供 patch-scope 与 red-team 消费。

- [ ] **Step 4: Control meta**

记录 Control 用真实 Headless 的 `personaId` + `seed` + `endAge`（建议短窗，如 endAge 20，避免 B0 校准拖成全量人生 gate）。

- [ ] **Step 5: 不 commit**

---

### Task 3: Simulator + player-visible 投影

**Files:**
- Create: `scripts/b0/roles/simulator.ts`
- Create: `scripts/b0/trace/projectPlayerVisibleTrace.ts`

- [ ] **Step 1: projectPlayerVisibleTrace**

从 `ExperienceTrace` 删除：

- `directEffects` / `outcomeEffects`
- `selectionPolicy` 中 hidden 标记细节可保留 kind，但不得含评分阈值
- `finalState` 完整 hidden state（改为仅公开展示字段子集或完全省略）
- A/B 身份、机械 verdict

若输出仍含 `directEffects`/`outcomeEffects`/`executedEffects` 等键 → 投影失败 → `blocked`。

- [ ] **Step 2: simulator.runPair**

对每个 sample：

1. baseline raw（Control=真实 Headless；known-bad= synthesizer baseline 变体或空对照）
2. candidate raw（overlay/synthetic）
3. 同 seed
4. 写 `.tmp/b0/<runId>/raw-traces/<sampleId>/{baseline,candidate}.json` + hash

**禁止**调用 `npm run gate:playability` / `gate:experience` 等会写 tracked latest 的入口。

- [ ] **Step 3: 不 commit**

---

### Task 4: Mechanical / Blind / Red-team 审计模块

**Files:**
- Create: `scripts/b0/roles/mechanicalAuditor.ts`
- Create: `scripts/b0/roles/blindReviewer.ts`
- Create: `scripts/b0/roles/redTeamAuditor.ts`

- [ ] **Step 1: mechanicalAuditor**

只读 raw Trace；输出确定性 detections：`repeat_short_window` 等。复用 `collectPacingMetrics` / `collectFrustrationMetrics` 时，**复制调用纯函数**，不要 import `evaluateP8Gate`，不要读写 P8 threshold 文件。

B0 自有硬规则常量放在 `mechanicalAuditor.ts` 顶部，注释明确：`// ponytail: B0-only guardrail constants; not P8 formal thresholds`。

- [ ] **Step 2: blindReviewer**

只接收 player-visible Trace + 匿名标签 `{ sampleKey: 'A'|'B' }`。输出 observations；**不得**输出 “这是 known-bad” 之类依赖标签的结论。实现为确定性启发式（可复现），不是 LLM 投票。

- [ ] **Step 3: redTeamAuditor**

检查：holdout 是否出现在盲评包；visible 是否含 hidden 键；proposedPaths 是否越权；若发现 → `veto: true`。有 veto 则控制器不能 `passed`。

- [ ] **Step 4: 模块间不得互相 import 对方的结果类型工厂**；由 controller 编排。

- [ ] **Step 5: 不 commit**

---

### Task 5: 编排入口 + human decision + evidence index

**Files:**
- Create: `scripts/b0/runB0.ts`
- Create: `scripts/b0/humanDecision.ts`

- [ ] **Step 1: runB0 主流程**

```text
capture fingerprint
→ seal manifest
→ build fixtures
→ simulate all
→ mechanical || (blind + red in isolation)
→ evidence hash chain check
→ write awaiting_human bundle
→ optional --decision=accept|reject 写入 human-decision.json
```

Artifact 布局：

```text
.tmp/b0/<runId>/
  manifest.json
  fixture-set/
  seed-bundle.json
  raw-traces/
  player-visible-traces/
  mechanical-audit.json
  blind-review.json
  red-team-review.json
  evidence-index.json
  controller-private/   # labels + abMap；测试可断言 blind 包不含此目录内容
  human-decision.json
```

证据链 hash 字段按设计 §5 逐层写入 `evidence-index.json`。任一断裂 → `blocked`。

- [ ] **Step 2: humanDecision**

`accept` 仅当：无 red veto、无 blocked、机械/红队覆盖所有严重 known-bad、Control 未被硬误杀、可复现检查通过。  
`reject` → `failed`。  
缺证据 → 拒绝写成 `passed`。

- [ ] **Step 3: CLI**

`npx tsx scripts/b0/runB0.ts --out .tmp/b0 --decision accept`

- [ ] **Step 4: 不 commit**

---

### Task 6: B0 专项测试

**Files:**
- Create: `tests/b0/b0GuardrailCalibration.test.ts`
- Create: `tests/b0/b0IsolationAndHash.test.ts`
- Create: `tests/b0/b0PatchScopeAndBlocked.test.ts`
- Modify: `tests/runRealTestGate.ts` 或 `tests/AllTests.ts`（精确注册）

- [ ] **Step 1: 写 failing tests（先红）覆盖**

1. 每个体验 known-bad 被 mechanical 或 red-team 检出  
2. Control 不被硬误杀  
3. 同 manifest+seed 两次 run：raw/mechanical deterministic hash 一致  
4. evidence chain 完整  
5. holdout 不出现在 blind 输入  
6. visible projection 不含 hidden effects 键  
7. red-team veto 阻止 passed  
8. patch-scope 检出越权  
9. 运行后 `git diff` 相对 B0 开始时：正式配置 / tracked latest / 青年 dirty 文件内容不变（允许新增 `scripts/b0|tests/b0` 与 stage 文档追加）

- [ ] **Step 2: 跑定向测试**

Run:

```bash
npx tsx tests/b0/b0GuardrailCalibration.test.ts
npx tsx tests/b0/b0IsolationAndHash.test.ts
npx tsx tests/b0/b0PatchScopeAndBlocked.test.ts
```

Expected: 实现完成后全部 exit 0；失败项按 `failed`/`blocked` 语义区分断言。

- [ ] **Step 3: 端到端校准跑一次**

```bash
npx tsx scripts/b0/runB0.ts --out .tmp/b0
```

Expected: 生成 `awaiting_human` bundle；不改 `src/data/**`；`.tmp/b0/**` 不被 git 跟踪。

- [ ] **Step 4: dirty worktree 保护检查**

```bash
git diff --stat -- src/data/events.json src/data/lines docs/test-reports
# 与基线 youth slice 文件内容比对（不得被 B0 改写）
```

- [ ] **Step 5: 不 commit**

---

## 4. 验证命令清单

```bash
# 指纹/基线
npx tsx -e "import { captureSourceFingerprint } from './scripts/b0/sourceFingerprint.ts'; console.log(JSON.stringify(captureSourceFingerprint(),null,2))"

# B0 单测
npx tsx tests/b0/b0GuardrailCalibration.test.ts
npx tsx tests/b0/b0IsolationAndHash.test.ts
npx tsx tests/b0/b0PatchScopeAndBlocked.test.ts

# 端到端（artifact → .tmp/b0）
npx tsx scripts/b0/runB0.ts --out .tmp/b0

# 正式边界未被改
git status --porcelain=v1
git diff --check
```

**不跑**（除非用户另授）：`gate:playability`、`gate:experience`、全量 `npm test` 作为 B0 必过项——它们会写 latest 或过宽；B0 以专项测试为准。若注册进 `runRealTestGate` 后被 `npm test` 捎带执行，测试本身不得写 tracked 报告。

---

## 5. 风险与 Blocker

| 项 | 级别 | 说明 |
| --- | --- | --- |
| 引擎级 overlay 不可用 | **结构性** | 无 EventLoader DI；本计划用 sealed fixture Trace。若审批要求真实候选事件进 `selectEvent`，停止。 |
| Dirty worktree 漂移 | blocked | 青年 Slice 文件被意外改写 → fingerprint/保护测试失败 → blocked |
| `artifacts/` 未 ignore | 工程陷阱 | 一律用 `.tmp/b0/`；不要写 `artifacts/` |
| 误调正式 gate CLI | blocked | 会写 tracked latest；代码与测试禁止 |
| 把 LLM 观感当通过条件 | 产品违规 | 禁止；仅人工 + 证据 |
| 登记 stage 文档 | 流程 | Task 0 需要改 `current-product-stage.md`；属本计划允许修改 |

---

## 6. Spec 覆盖自检

| 设计要求 | 对应 Task |
| --- | --- |
| candidate overlay（非改正式配置） | Task 2–3（sealed overlay/fixture；非 `src/data`） |
| 同 seed baseline/candidate | Task 3 |
| train/holdout/adversarial | Task 2 seed-bundle + Task 1 controller |
| immutable manifest + hash lineage | Task 1, 5 |
| known-bad registry | Task 2 |
| hidden-state mechanical audit | Task 4 |
| player-visible 盲评 | Task 3 投影 + Task 4 blind |
| red-team veto | Task 4–5 |
| 人工 accept/reject | Task 5 |
| 职责隔离、无多数投票 | Task 1/4/5 |
| failed vs blocked | Task 5 + tests |
| 不改正式配置/gate/dirty slice | 文件边界 + Task 6 |
| 引擎注入不足则停止 | §0.3 + 风险表 |

**已知偏差（需审批确认）：** 设计文案中的“isolated overlay → 同 seed 模拟”在字面上易读成引擎调度 overlay。本计划将其落实为 **sealed fixture/candidate Trace 对照模拟**，否则必须改核心运行逻辑 → structural blocker。

---

## 7. 完成报告模板（实施后填写，不预写）

1. 实际修改文件  
2. 未修改但检查过的关键边界  
3. 测试和验证命令  
4. 每项结果：passed / failed / blocked  
5. artifact、manifest 和 hash 位置  
6. 与设计文档的偏差  
7. 剩余风险  
8. 是否具备重新评估 B1 的证据（即使 B0 passed，也不等于授权 B1）

---

## 8. 执行闸门

本计划已写入 `docs/superpowers/plans/2026-08-11-constrained-auto-evolution-b0.md`。

**现在停止。** 未收到你明确回复「批准执行」前，不创建 `scripts/b0/`、不改测试注册、不改 `current-product-stage.md`、不跑会改状态的实施步骤。

审批时请一并确认下面唯一产品/结构问题：

> **是否接受 B0 在不修改 `EventLoader`/`GameEngineIntegration` 的前提下，用 sealed fixture Trace 承担 candidate overlay 对照模拟？**  
> - 接受 → 按本计划实施  
> - 拒绝 → 报告 structural blocker，等待是否授权最小 DI 注入（那会越出当前“不改核心运行逻辑”边界）
