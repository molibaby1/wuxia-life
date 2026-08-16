# Auto Evolution Execution-to-Experience Skeleton 001

> 状态：CLOSED / Human accepted
>
> 日期：2026-08-15
>
> 性质：探索型骨架实验历史证据，不是游戏内容改进，也不授权 promotion / 重新执行。

## 1. 实验问题

本实验只回答一个问题：

> 一个 Human 手写的极小修改需求，能否被工程 Runtime 消费，真实改变 Wuxia-Life 的正式运行输入，然后让修改后的 Wuxia-Life 重新跑出可追溯的 player-observable evidence？

本实验故意 Mock 掉所有上游智能能力：Feedback、Hypothesis、Investigation、自动 Modification Proposal、自动 PRD 生成都不参与。

## 2. 骨架

```text
Human-authored PRD
→ executable prd.json
→ Codex consumes one Story
→ real Wuxia-Life source change
→ deterministic verification
→ one new Phase 0 run
→ new sealed player-observable evidence
→ provenance check
→ STOP for Human review
```

成功只表示这段骨架成立，不表示 Auto Evolution 已经能够自动产生修改方案，也不表示修改值得进入正式产品。

## 3. 固定修改靶点

只允许修改：

```text
src/data/lines/general.json
```

目标事件：

```text
eventId: birth_wuxia_family
field: content.text
```

当前文本：

```text
你降生在一个武侠世家，哭声洪亮，远近皆闻。家族长辈们都说，你天生就有习武之资。
```

实验文本：

```text
你降生在一个武侠世家，哭声洪亮，远近皆闻。家族长辈们都说，你天生就有习武之资。 AE-SKELETON-001
```

只允许追加准确的 ASCII marker：

```text
AE-SKELETON-001
```

不得修改该事件的：

- `id`；
- `version`；
- `category`；
- `priority`；
- `weight`；
- `ageRange`；
- `triggers`；
- `eventType`；
- `autoEffects`；
- metadata；
- 其他 content 字段。

不得修改其他事件或其他游戏行为。

## 4. 为什么选择这个靶点

当前正式 `EventLoader` 从 `src/data/lines/general.json` 加载该事件。

在年龄 0：

- `birth_wuxia_family` 是 exact-age critical event；
- 它位于同年龄、同优先级出生事件之前；
- Headless progression 会把 formal auto story event 留给 `runStoryEventStep`；
- player-surface capture 会读取该事件的 `content.text`；
- Phase 0 projector 会把它投影为 player-observable entry 的 `body`。

因此使用一个 `endAge = 1` 的最小 Phase 0 run 即可让修改进入 player-observable output，不需要跑完整人生。

## 5. 固定运行参数

只授权一次新的 Phase 0 run：

```text
runRef: ae-skeleton-001
persona: p8-martial-lin
seed: 801
endAge: 1
catalogVersion: 1.0.0
```

等价 CLI：

```bash
npx tsx scripts/evolution/phase0/runPhase0.ts \
  --run-ref ae-skeleton-001 \
  --persona p8-martial-lin \
  --seed 801 \
  --end-age 1 \
  --catalog-version 1.0.0
```

如果 `ae-skeleton-001` 的 final run 或 anchor 在执行前已经存在，STOP 并报告 blocker；不得删除旧 artifact 后复用同一 `runRef`。

## 6. Ralph 的使用边界

本实验采用 Ralph 的核心双文档约定：

```text
PRD.md = 实验 / 产品真值
prd.json = 可执行 Story + acceptance state
```

但第一轮**不要求原样运行现有 `ralph-run` Skill**，原因是当前 Wuxia-Life 仓库：

- 没有该 Skill 假设存在的 `scripts/agent-git-commit.sh`；
- 当前 worktree 已存在与本实验无关的未提交改动；
- `ralph-run` 的自动 branch / commit-all 语义可能误提交既有工作。

因此本实验由 Codex 直接读取本 PRD 与 paired `prd.json`，执行唯一的 `passes:false` Story，并在成功后更新 Story 状态。

不得为了让 Ralph 原样运行而新增 git helper、Skill framework、adapter 或 Runtime abstraction。

## 7. Deterministic verification

修改后至少运行：

```bash
npm run typecheck
npx tsx tests/evolution/runPhase0Tests.ts
```

两者必须 PASS 后，才允许执行 §5 中恰好一次 Phase 0 run。

普通测试 / 类型问题可在当前唯一修改范围内修复；如果必须修改 `src/data/lines/general.json` 之外的产品代码或配置才能通过，则属于 blocker，STOP。

## 8. 新体验 evidence

成功 run 后必须验证：

### 8.1 Catalog evidence

```text
.tmp/evolution/phase0/ae-skeleton-001/inputs/catalog.json
```

其中 `birth_wuxia_family.content.text` 必须包含准确 marker：

```text
AE-SKELETON-001
```

### 8.2 Player-observable evidence

```text
.tmp/evolution/phase0/ae-skeleton-001/reviewer-input/observable-payload.json
```

必须存在一个 `story_event` entry：

```text
title = 降生武侠世家
body contains AE-SKELETON-001
```

marker 在 observable payload 中必须至少出现一次；若出现多次，必须解释来源并确认没有额外产品修改。

### 8.3 Source provenance

```text
.tmp/evolution/phase0/ae-skeleton-001/provenance/source-fingerprint.json
```

必须能证明这次 run 使用了包含 marker 的 `src/data/lines/general.json`。

允许两种客观证明方式：

1. 如果该文件在 run 时是 dirty worktree entry：
   - fingerprint 中存在 `path = src/data/lines/general.json`；
   - 记录的 `sha256` 与 run 时文件字节的实际 SHA-256 一致；
   - 该实际文件包含 marker。
2. 如果该文件在 run 前已被提交：
   - fingerprint 的 `headSha` 对应版本中的 `src/data/lines/general.json` 包含 marker。

不得只凭“最终 observable 里看到了 marker”就声称 provenance 已证明。

## 9. PASS 条件

只有同时满足以下事实，本实验才为 PASS：

1. Codex 从本 PRD + paired prd.json 消费唯一 Story；
2. 唯一产品源修改符合 §3；
3. deterministic verification 全 PASS；
4. 恰好执行一次授权的 `ae-skeleton-001` Phase 0 run；
5. sealed catalog input 包含 marker；
6. sealed player-observable payload 包含 marker；
7. source fingerprint 客观绑定到包含 marker 的 source；
8. run 完成后没有进入 feedback / hypothesis / investigation / candidate / promotion；
9. `prd.json` 只有在上述条件全部成立时才将 Story 设置为 `passes: true`。

## 10. FAIL / BLOCKER

以下任一情况应 STOP，不得扩大范围补救：

- 需要修改第二个产品代码 / 配置文件；
- Phase 0 无法从当前修改后的 worktree 正常运行；
- marker 出现在 catalog 但没有进入 observable payload；
- observable 有 marker，但无法证明 source provenance；
- 需要第二次真实 run 才能“再试一次”；
- 需要调用 DeepSeek / 其他外部 participant；
- 需要建设新 Skill / Runtime / adapter 才能继续；
- 需要 candidate / promotion 才能说明成功。

失败本身是有效实验结果；不要为了得到 PASS 扩大实验。

## 11. 明确非目标

本实验不验证：

- 修改是否改善游戏；
- Human PRD 能否自动生成；
- Feedback / Hypothesis / Investigation 是否正确；
- Ralph Skill 是否能在所有 Runtime 原样迁移；
- 自动 commit / merge / promotion；
- 多轮 autonomous evolution；
- candidate comparison；
- 自动回滚。

## 12. STOP

完成一次 run 和全部 evidence 检查后立即 STOP。

不要自动：

- 移除 marker；
- merge / promote 修改；
- 生成下一份 PRD；
- 开始下一轮游戏；
- 获取 participant feedback。

Human final review 之后再决定清理或下一步。
