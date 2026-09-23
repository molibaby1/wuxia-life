# Preschool Residual Content Capacity Implementation Plan

Status: `HUMAN APPROVED — 2026-09-23`

Authority: `preschool-residual-content-capacity-authoring-20260923`

Baseline: `dev@e1b1b2616f91e10eaee2a77382bd658ff18c51de`

## 1. Goal

在现有 preschool passive authored catalog 中新增 exactly 5 条 Human-approved shared-neutral late-preschool experiences，并用 focused regression tests 锁定：

- exact ID / copy / age window；
- neutral-only；
- no `statDeltas` / `flags`；
- age staging；
- unified pool 能在 generic gap 之前实际消费这些新增内容；
- existing selector/runtime/schema/no-reuse/origin-isolation semantics 不变。

本次 implementation 只解决已批准的 residual `CONTENT_CAPACITY_GAP`。

独立的 Phase 0 canonical passive-ID `MEASUREMENT_PROBLEM` 不属于本任务。

## 2. Implementation scope

Production 只允许修改：

```text
src/data/lines/preschool-passive-spine.json
```

Tests 只允许修改：

```text
tests/preschoolPassiveSpineTests.ts
tests/annualPassiveMemoryTests.ts
```

明确不修改：

```text
src/data/preschoolPassiveSpine.ts
src/core/activePlanning/annualPassiveMemory.ts
src/data/passiveNarrativeTypes.ts
scripts/evolution/phase0/**
其他 src/**
其他 tests/**
docs/**
artifacts/**
```

如果仅靠增加 5 条 JSON row 无法使 approved tests GREEN，必须 STOP，而不是修改 selector/runtime 来迎合测试。

## 3. Final implementation copy

以下逐字内容作为 implementation contract 锁定。

### A. `preschool_neutral_fair_play`

```json
{
  "id": "preschool_neutral_fair_play",
  "title": "说好算数",
  "text": "你和几个孩子用石子定先后，这回偏偏轮到你输。你嘟囔着想重来，见大家都照着同一规矩等着，最后还是退回队尾，第一次明白说好的规矩不能只在自己赢时才算。",
  "originTags": ["neutral"],
  "ageMin": 5,
  "ageMax": 7
}
```

承担：公平、共同规则、接受输赢。

不得混成 `first_lie` 的诚实主题，也不得混成 `peer_repair` 的关系修复。

### B. `preschool_neutral_self_made_project`

```json
{
  "id": "preschool_neutral_self_made_project",
  "title": "自己做成",
  "text": "你找来几片木片和细绳，照自己的主意扎一个会转的小玩意。散了两回你都重新绑好，等它终于转起来，旁人没催你，你却比得了夸奖还高兴。",
  "originTags": ["neutral"],
  "ageMin": 5,
  "ageMax": 7
}
```

承担：self-directed persistence。

必须与 `entrusted_task` 区分：这里没有成年人交任务，也不产生 Craft、Recipe、inventory 或技能系统。

### C. `preschool_neutral_stand_for_peer`

```json
{
  "id": "preschool_neutral_stand_for_peer",
  "title": "替他说话",
  "text": "几个孩子把一件错事都怪在一个沉默的孩子头上，你明明可以装没看见，还是说出自己见到的经过。众人一时都看向你，你脸上发热，却没有把话收回去。",
  "originTags": ["neutral"],
  "ageMin": 6,
  "ageMax": 7
}
```

承担：为另一个人承担轻度社会压力，moral courage / empathy in action。

不得变成 persistent Person、Relationship、长期 bullying 或 trauma。

### D. `preschool_neutral_first_farewell`

```json
{
  "id": "preschool_neutral_first_farewell",
  "title": "送到路口",
  "text": "常与你一起玩的孩子要随家人离开这里。你一路送到路口，原先还说以后再玩，直到那道身影越走越远，才第一次明白有些人离开后，日子真的会换个样子。",
  "originTags": ["neutral"],
  "ageMin": 6,
  "ageMax": 7
}
```

承担：轻度告别、关系变化。

必须与 `waiting_threshold` 区分：后者是等待一个会回来的照料者，本条是熟悉关系真的发生改变。

不得涉及 death、bereavement、disappearance、abandonment trauma 或 permanent Person arc。

### E. `preschool_neutral_neighborhood_help`

```json
{
  "id": "preschool_neutral_neighborhood_help",
  "title": "邻里搭手",
  "text": "住处附近一片大家常走的空地堆了不少杂物，周围的人一起动手收拾。你也提着小筐来回跑了几趟，忙完以后才觉得，门外这片地方也有自己的一份。",
  "originTags": ["neutral"],
  "ageMin": 6,
  "ageMax": 7
}
```

承担：community participation / belonging。

必须与 `household_disruption` 区分：前者是家外熟悉共同体，本条不能退化成又一次家庭内部应对。

不得创建 Community、Faction、Reputation、neighborhood state 或 Task runtime。

## 4. TDD — RED A: exact authoring contract

先只修改：

```text
tests/preschoolPassiveSpineTests.ts
```

新增：

```ts
testApprovedResidualPreschoolCapacityAuthoringSet()
```

并由 `runPreschoolPassiveSpineTests()` 调用。

测试内建立 exact expected contract，包含每条的：

```text
id
title
text
ageMin
ageMax
```

逐条断言：

```text
entry exists
entry.title === expected.title
entry.text === expected.text
entry.ageMin === expected.ageMin
entry.ageMax === expected.ageMax
entry.originTags exactly ["neutral"]
entry.statDeltas === undefined
entry.flags === undefined
```

同时锁定 age staging：

```text
age 4: 0 / 5
age 5: exactly 2 / 5
       fair_play
       self_made_project
age 6: 5 / 5
age 7: 5 / 5
```

然后立即运行：

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
```

预期 RED：当前 catalog 中不存在这 5 个 approved IDs。

这个失败必须来自真实 missing content，不得加入 artificial failing assertion。

## 5. TDD — RED B: unified-pool integration

在 production 仍未修改时，再只修改：

```text
tests/annualPassiveMemoryTests.ts
```

新增：

```ts
testApprovedResidualCapacityEntriesAreConsumedBeforeGap()
```

并由 `runAnnualPassiveMemoryTests()` 调用。

Fixture 使用：

```ts
const state = martialPreschoolState(6);
```

Approved residual ID set：

```ts
new Set([
  'preschool_neutral_fair_play',
  'preschool_neutral_self_made_project',
  'preschool_neutral_stand_for_peer',
  'preschool_neutral_first_farewell',
  'preschool_neutral_neighborhood_help',
]);
```

从 `getPreschoolPassiveEntries(6)` 中取所有对 martial legal 的：

```text
neutral
+
matching martial-exclusive
```

将除 5 个 residual IDs 外的所有 legal authored entries写入 `eventHistory`。

保存输入 history snapshot 后执行：

```ts
preparePreschoolSeasonMemory(state, () => 0)
```

GREEN 后该测试必须证明：

```text
plan.entries.length === 3
三个 beat 都不是 generic gap
三个 ID 全属于上述 5 个 residual IDs
三个 ID distinct
没有 foreign-origin exclusive entry
prepare 不 mutate input eventHistory
```

在当前 baseline 上，由于 5 个 IDs 尚不存在，fixture 会消费掉所有现有 legal authored content，因此正确 RED 应表现为 generic gap，而不是 approved residual content。

执行：

```bash
npm exec tsx tests/annualPassiveMemoryTests.ts
```

记录真实失败。若失败原因不是上述 missing-capacity 行为，先修测试 fixture，不进入 GREEN。

## 6. GREEN

只有两个 RED 都以正确原因成立之后，修改：

```text
src/data/lines/preschool-passive-spine.json
```

只追加上述 exactly 5 个 JSON rows。

要求：

```text
0 existing entry modifications
0 existing entry deletions
0 existing entry renames
0 selector changes
0 runtime changes
0 schema changes
0 statDeltas
0 flags
0 sixth entry
```

优先紧接当前第一轮 8 个 neutral authoring rows 后追加，避免无意义的大规模 catalog reorder。

## 7. Focused GREEN verification

先执行：

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
```

两项必须 fresh exit `0`。

如果失败，应修正新增 catalog rows 或 fixture 中的真实问题；不得削弱 exact-copy、age、neutral、authored-before-gap assertions。

## 8. Semantic Verification

随后 fresh 执行：

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm exec tsx tests/preschoolPlaceholderGovernanceTests.ts
npm exec tsx tests/preschoolLitePaletteBrowserVerifyTests.ts
npm run typecheck
git diff --check
```

验收语义：

```text
exactly 5 new rows
exact IDs
exact title/text
exact age windows
neutral-only
no statDeltas
no flags
age 4 unchanged by this set
age 5 exposes exactly 2
age 6/7 exposes all 5
unified pool consumes them before gap
same-card authored IDs remain distinct
history no-reuse unchanged
foreign-origin isolation unchanged
3-beat season unchanged
3-month cadence unchanged
first-round 8 entries unchanged
0–3 unchanged
```

已知 repository-wide `npm test` 仍有此前已差分证明的 4 个 baseline failures：

```text
stageAtomicProgression
experienceTrace
ordinaryEvolutionOperator
canonicalUndefinedPropertyElimination
```

本任务不修它们，也不能在完成报告中写成“repository-wide tests green”。

## 9. Strong regression proof

在所有 GREEN verification 通过后、commit 前，再证明测试确实依赖本次 production change。

只保存 production diff：

```bash
git diff <STARTING_HEAD> --   src/data/lines/preschool-passive-spine.json   > /tmp/preschool-residual-capacity-catalog.patch
```

保持新增 tests 不动，只临时恢复 catalog：

```bash
git checkout <STARTING_HEAD> --   src/data/lines/preschool-passive-spine.json
```

重新运行：

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
```

预期重新 RED，原因必须是 residual approved IDs/capacity 缺失。

随后恢复 production patch，再运行相同两项 tests，必须恢复 GREEN。

若 patch 无法安全恢复，STOP，不提交。

## 10. Diff gate

提交前检查：

```bash
git diff --name-only
```

必须只有：

```text
src/data/lines/preschool-passive-spine.json
tests/preschoolPassiveSpineTests.ts
tests/annualPassiveMemoryTests.ts
```

然后逐项 review：

- JSON diff 恰好新增 5 个对象；
- 第一轮 8 条逐字未变；
- 其他 existing row 无 diff；
- 两份 test diff 只增加本计划定义的 focused regressions；
- 没有无关格式化。

任何其他 tracked file 出现，STOP。

## 11. Explicit STOP conditions

实施期间出现以下任一情况，不得自行扩 scope：

```text
需要修改 selectPreschoolSeasonEntry 才能 GREEN
需要修改 annualPassiveMemory 才能 GREEN
需要新增 flag/stat 才能表达 Card
需要新增 Person/Relationship
需要修改 approved age windows
需要修改这 5 个 IDs
需要新增第 6 条内容
发现 authority 与现有 schema/runtime 冲突
发现 foreign-origin / no-reuse regression
```

此时保留 evidence，返回 Human。

## 12. Independent Measurement Problem

当前 Phase 0 sealed evidence 缺少 packed passive canonical authored IDs 的问题继续保持：

```text
MEASUREMENT_PROBLEM
```

本 implementation：

```text
不修改 Phase 0
不修改 observable payload
不把 internal authored IDs 暴露给玩家
不增加 measurement instrumentation
不以 measurement 修复作为 catalog GREEN 的隐含步骤
```

下一轮 Natural PVER 之前是否先处理该 measurement line，另行决定。

## 13. Completion boundary

本次 implementation 完成最多意味着：

```text
5-entry implementation complete
+
Semantic Verification complete
```

不意味着：

```text
Natural PVER PASS
CONTENT_CAPACITY_GAP 已在玩家体验层关闭
Phase 0 measurement problem 已修复
repository-wide npm test green
```

Implementation 后不得自动运行 natural sample、AE、resume 或 replay。
