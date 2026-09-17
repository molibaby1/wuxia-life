# Preschool Origin Exhaustion Gap Fallback

## Status

HUMAN ACCEPTED — 2026-09-17

## Scope

本 accepted-design 固定 preschool origin exhaustion 的后续 implementation boundary，供独立 TDD implementation 使用。本次 landing 只记录已接受的产品 / workflow 语义与验收条件，不修改 runtime、product implementation、preschool authored catalog 或 Auto Evolution execution logic。

## Gap diagnosis

问题分类为 `SCHEDULING_PROBLEM`，不是已确认的 `CONTENT_GAP`。

在 `preschool-season-everyday-texture-20260910` 实施后，自 2026-09-11 至 2026-09-17 的多个 independent natural runs 仍持续出现早期成长重复。当前根因已收敛为：

```text
固定每季两个 origin slots
+ 有限 origin pool
+ origin pool exhaustion 后重新开放历史条目
→ 旧 origin narrative 回流
```

这属于现有内容选择与 history interaction 的调度问题。不能因为重复体验而直接扩写 catalog，也不能把 metric / player-visible concern 自动解释为内容缺口。该诊断遵守 PD-106 的 Gap Diagnosis 与 Human Approval 边界。

## Accepted product and runtime boundary

以下语义保持不变：

- 保留当前 4–7 岁 season structure：`origin → neutral everyday texture → origin`。
- 保留每张 season card 三笔内容。
- 保留确认后推进三个月。
- 保留当前 canonical birth-background isolation。
- origin slot 首先选择同时满足以下条件的 entry：当前年龄合法、符合当前 canonical birth background、且尚未出现在 `eventHistory`。
- 当上述未消费 origin pool 为空时，不得重新打开已经存在于 `eventHistory` 的 origin entries。
- origin pool exhaustion 时使用现有 preschool passive gap fallback。
- gap 仅表示 origin slot exhaustion fallback，不代表新增第二个 everyday-texture slot。
- `selectNeutralOnlyPreschoolEntry` 的 exhaustion / reuse 行为本次不修改。
- 不新增或改写 preschool authored catalog。
- 不新增 Event、Person、Milestone、player state 或 runtime generator。
- 不修改 season cadence、origin slot 数量或三个月时间语义。
- 不修改 0–3 岁已有行为。
- 不修改 PD-106 或其他 governance authority。

## Current implementation boundary

后续 implementation 必须以当前实现和测试为起点，至少核对：

- `src/core/activePlanning/annualPassiveMemory.ts`：4–7 岁 season card 依次组装两个 origin beat 与一个 neutral beat，并在 acknowledgement 后沿用既有三个月推进。
- `src/data/preschoolPassiveSpine.ts`：`selectPreschoolOriginExclusiveEntry` 先排除 `eventHistory` 中的 origin entry；当前未消费 pool 为空时会重新建立包含历史 origin 的 pool。该 fallback 是本 accepted-design 的唯一实现目标。
- `tests/annualPassiveMemoryTests.ts`：season card 三 beat、中间唯一 everyday texture、history trace 与三个月推进的现有契约。
- `tests/preschoolPassiveSpineTests.ts`：preschool catalog、origin tag 合法性、origin isolation 与 neutral entry 基线。
- PD-106：问题先做 closed-category gap diagnosis；只有明确 `CONTENT_GAP` 才进入新增内容流程；本问题保持 `SCHEDULING_PROBLEM`。

相关 Human Follow-up provenance：

- 已转换 HFL：`item-e664562316d98d2f633d39ae9f031298db0d990244f7bbe39aed8768f4941eb0`
- 当前主 HFL：`item-19ae92d75f6249dbab7911356e33f90735f8a8b4d8d6eb28e7b0506b68220c6d`

上述 evidence 只用于支持诊断与 provenance，不授权修改其他产品语义，也不替代后续实现验证。

## Implementation acceptance criteria

后续独立 TDD implementation 必须满足：

1. 当仍存在未消费的合法 origin entry 时，selection 行为不变。
2. 当全部合法 origin entries 已进入 history 时，origin-exclusive selector 返回现有 gap fallback，而不是历史 origin entry。
3. season card 仍有 3 beats，中间仍恰好一个 everyday texture。
4. 本修复不得改变 neutral selector，包括其 exhaustion / reuse 行为。
5. existing preschool / annual-passive regression tests 保持通过。
6. 实施完成后必须回到 natural observation；不得仅凭静态测试宣称 player-visible repetition 已长期解决。

## Explicit non-goals

本 accepted-design 不授权：

- 新增 preschool authored content 或把问题重新分类为 `CONTENT_GAP`；
- 修改 `selectNeutralOnlyPreschoolEntry`；
- 改变 season card 结构、slot 数量、cadence、三个月推进或 0–3 岁行为；
- 新增 Event / Person / Milestone / player state / runtime generator；
- 修改 PD-106、其他 governance authority、HFL lifecycle、AE report schema、Participant contract、retry 或 execution flow；
- 通过新的自动化 run 人为制造验证样本。

本文件完成的是 authority baseline landing；runtime 修复必须作为后续独立、可审查的 TDD implementation 提交。
