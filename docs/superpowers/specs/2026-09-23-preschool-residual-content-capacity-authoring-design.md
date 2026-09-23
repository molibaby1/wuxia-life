# Preschool Residual Content Capacity Authoring Contract

## Status

HUMAN ACCEPTED — 2026-09-23

## Authority identifier

`preschool-residual-content-capacity-authoring-20260923`

本文件不新增 Product Decision 编号。PD-120 已定义 Content Authoring
Workflow；本文件只固定本次具体的 Preschool residual content capacity
authoring decision。

## Scope

本文件是对 Preschool 4–7 岁 residual authored capacity gap 的具体 authority
landing。它记录已经完成的 evidence diagnosis、第一轮 8-entry authoring 的
自然体验结果，以及 Human 已批准的第二轮 exactly 5 条 shared-neutral
authored experiences。

本文件不是 implementation，不修改 catalog、runtime、tests、Phase 0、HFL
或 measurement pipeline。它不重新设计 unified candidate pool，不改变
history no-reuse、origin isolation、3-beat season 或 3-month cadence。

本文件只授权后续独立 implementation 在现有 `PassiveNarrativeEntry` 与现有
preschool unified pool 中落地这 5 条内容。最终 player-facing `title` / `text`
不在本 authority 中锁定；后续 implementation 可以在不改变本文件 Card 产品
语义、年龄窗口与 scope boundary 的前提下 author 简洁正文。

## Evidence provenance

### Implementation baseline

`e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf`

### First approved authoring authority

`preschool-content-capacity-authoring-20260922`

第一轮 implementation 已新增 8 条 shared-neutral preschool authored
experiences。该事实不表示第二轮 5 条已经实现。

### Natural Player-visible sample

- `runRef`: `preschool-pver-20260922231805-71297571`
- `seed`: `71297571`
- `persona`: `p8-wealth-shen`
- canonical origin: `frontier_military`
- preschool exclusive tag: `frontier`
- player-visible origin context: `你生在边关营寨`

该 natural sample 后续通过一次 bounded deterministic diagnostic replay 恢复
exact committed authored provenance。该 replay 只恢复原 natural sample 的
canonical authored IDs，不是新的 natural sample。

### Replay equivalence

- original observable payload SHA-256:
  `d91231e2967e75bf508d276c3163fc6ca5fcd2cbeba21db71132b3374b676ab4`
- replay observable payload SHA-256: 与 original 相同
- `cmp`: exit `0`

只有在 same HEAD、same persona、same seed、same endAge、same catalogVersion
与 same maxSteps 的 replay payload 字节级一致后，才使用
`experienceTrace.stateDelta.eventHistoryAdded` 恢复原 natural sample 的 exact
authored IDs。该诊断 replay 不改变原始 sealed evidence，也不构成第二个
natural sample。

## Exact residual Gap Diagnosis

### Player-visible and exact provenance counts

- 4–7 season cards: `10`
- 4–7 beats: `30`
- exact authored beats: `26`
- generic gaps: `4`
- full 3-gap season: `1`
- authored duplicates: `0`
- foreign-origin leak: `0`

### Capacity accounting

- `U4_7`: `26`
- `PRECONSUMED`: `0`
- available unique authored capacity `C`: `26`
- actual demand `D`: `30`
- `STRUCTURAL_MIN_GAPS = max(0, D - C)`: `4`
- `UNCONSUMED`: none

在每一个实际 generic gap 发生时，按 exact event-history chronology 重建的
legal unconsumed `availablePool` 均为空。packed season 内先出现的 authored
beats 也计入后续 beat 的 prior consumption；因此 gap 判断遵循实际
`preparePreschoolSeasonMemory()` 的 sequential working-state 语义。

### Formal classification

```text
Primary:   CONTENT_GAP / CONTENT_CAPACITY_GAP
Secondary: NONE
```

这是 deterministic capacity layer 的结论，不是机械的 `generic gap == 0`
判断。

不得将剩余问题重新描述为 `SCHEDULING_PROBLEM`：当前 legal authored pool
已经真实消费完毕，没有 authored entry 因选择顺序、age window 或 scheduler
偏置而被留下未使用。`UNCONSUMED = none`，且每个实际 gap 时 legal
unconsumed pool 都为空。

## First-round authoring assessment

第一轮 8 条不是失败。Natural evidence 支持：

- 8/8 exact committed；
- 8/8 player-visible；
- duplicate = `0`；
- foreign-origin leak = `0`；
- 未见明显 age awkwardness；
- 未见 transient role 被误写成 persistent `Person`；
- 未见超出 approved scope 的重大危险或创伤；
- 明显增加了 peer reciprocity、responsibility、independence、care /
  household participation。

因此第一轮 authoring 的 semantic direction 获得 natural support。

但实际 demand `30` 大于合法 authored capacity `26`，所以没有完全消除
whole-pool exhaustion。

```text
Natural PVER overall status: PARTIAL
```

`PARTIAL` 表示 semantic direction 获得支持但容量问题仍有确定的 residual
structural gap；它不表示第一轮内容语义失败，也不表示 scheduler 仍然有问题。

## Residual Content Proposal

Human 已批准第二轮 Minimum Event Set：exactly 5 条 shared-neutral authored
experiences。

这 5 条不是由 `30 - 26 = 4` 机械补 4 条或 5 条推导出来。数量 5 来自五个
独立、当前仍未被已有 authored content 承担的 late-preschool life functions：

1. Fairness / rule acceptance
2. Self-directed persistence
3. Moral courage for another person
4. Farewell / changing relationships
5. Neighborhood / community participation

全部保持 shared neutral。本轮不新增 origin-specific content。

## Five Human-approved Authoring Cards

以下 ID、年龄窗口、origin scope、life function、semantic boundary 与 runtime
boundary 均为 Human Accepted authority。五条均为 passive childhood experience，
均不要求 meaningful player decision。最终 player-facing `title` / `text` 留给
后续 implementation authoring，但不得改变下列 Card 语义。

### A. Fair play

- **ID:** `preschool_neutral_fair_play`
- **ageMin:** `5`
- **ageMax:** `7`
- **originTags:** `["neutral"]`
- **Event Purpose:** 让孩子第一次理解共同规则、公平以及接受输赢。
- **Life Function:** 规则不能只在自己赢的时候才算数。孩子在不服输、吃亏
  或觉得不公平时，第一次学会在共同认可的规则里约束自己。
- **Past Evidence Consumed:** 不要求具体 prior event。
- **Meaningful Player Decision:** 无；保持 passive childhood experience。
- **Durable Result:** 现有 `eventHistory` authored ID。
- **Future Hook:** 无。
- **Presentation boundary:** 可以围绕儿童游戏、轮流、输赢、重新开始等小
  情境；重点是共同规则、公平与接受结果。
- **Existing-content distinction:** 与 `preschool_neutral_first_lie` 的诚实 /
  内疚、以及 `preschool_neutral_peer_repair` 的同伴冲突后关系修复区分。
- **Scope:** 不创建正式规则系统，不创建竞技 runtime，不增加 choice。

### B. Self-made project

- **ID:** `preschool_neutral_self_made_project`
- **ageMin:** `5`
- **ageMax:** `7`
- **originTags:** `["neutral"]`
- **Event Purpose:** 补充孩子第一次出于自己的想法，主动想完成一件事情。
- **Life Function:** self-directed persistence；孩子自己提出一个小目标，经历
  失败、重做并完成。
- **Past Evidence Consumed:** 无。
- **Meaningful Player Decision:** 无。
- **Durable Result:** 现有 `eventHistory` authored ID。
- **Future Hook:** 无。
- **Presentation boundary:** 可以是制作一个简单小物、搭一个小结构、完成一
  个自己坚持的小计划。
- **Existing-content distinction:** 与 `preschool_neutral_entrusted_task` 区分：
  `entrusted_task` 是别人交给我的责任；`self_made_project` 是我自己想做成
  的事情。
- **Scope:** 不创建 Craft system、Recipe、inventory item，也不得变成技能
  训练日志。

### C. Stand for a peer

- **ID:** `preschool_neutral_stand_for_peer`
- **ageMin:** `6`
- **ageMax:** `7`
- **originTags:** `["neutral"]`
- **Event Purpose:** 第一次让孩子为了另一个人承担轻度社会压力。
- **Life Function:** moral courage / empathy in action；孩子看到另一个孩子被
  排挤、被误会或被不公平对待时，明知自己可能难堪，仍替对方说一句话或做一
  件小事。
- **Past Evidence Consumed:** 不要求具体 friendship history。
- **Meaningful Player Decision:** 无。
- **Durable Result:** 现有 `eventHistory` authored ID。
- **Future Hook:** 无。
- **Presentation boundary:** 情境必须是儿童尺度、低危险、可恢复的社会压力。
- **Existing-content distinction:** 与 `preschool_neutral_speak_for_self` 区分：
  `speak_for_self` 是为自己表达；`stand_for_peer` 是为另一个人承担一点
  社会风险。
- **Scope:** peer 必须是 transient role；不得创建 `Person`、`Relationship`，
  不得写成欺凌主线或长期 trauma。

### D. First farewell

- **ID:** `preschool_neutral_first_farewell`
- **ageMin:** `6`
- **ageMax:** `7`
- **originTags:** `["neutral"]`
- **Event Purpose:** 让孩子第一次理解：熟悉的人有时会真正离开日常生活范围，
  不是明天一定还会回来。
- **Life Function:** relationship change / separation understanding。
- **Past Evidence Consumed:** 无。
- **Meaningful Player Decision:** 无。
- **Durable Result:** 现有 `eventHistory` authored ID。
- **Future Hook:** 无。
- **Presentation boundary:** 可以是熟悉玩伴搬走、常见邻人离开、一个季节性
  熟人启程或其他轻度、非创伤性的告别。
- **Existing-content distinction:** 与 `preschool_neutral_waiting_threshold` 区分：
  `waiting_threshold` 是等照料者短暂回来；`first_farewell` 是一段熟悉关系
  进入真实改变。
- **Scope:** 不得使用 death、bereavement、disappearance 或 abandonment
  trauma；不得创建 permanent `Person` arc、`Person` 或 `Relationship` runtime。

### E. Neighborhood help

- **ID:** `preschool_neutral_neighborhood_help`
- **ageMin:** `6`
- **ageMax:** `7`
- **originTags:** `["neutral"]`
- **Event Purpose:** 让孩子从家庭内部参与者，第一次扩展为邻里共同生活的一员。
- **Life Function:** community participation / belonging；孩子参与一次家门之外、
  但仍属于熟悉社区的小型共同事务。
- **Past Evidence Consumed:** 无。
- **Meaningful Player Decision:** 无。
- **Durable Result:** 现有 `eventHistory` authored ID。
- **Future Hook:** 无。
- **Presentation boundary:** 可以是邻里一起收拾雨后杂物、准备公共节庆、帮一
  户人家搬一个大家都能搭手的东西，或共同整理小范围公共空间。
- **Existing-content distinction:** 与 `preschool_neutral_household_disruption`
  区分：`household_disruption` 是我的家庭内部共同应对；`neighborhood_help`
  是家之外的熟悉共同体参与。
- **Scope:** 不创建 Community system、Faction、Reputation、正式 neighborhood
  state 或任务线。

## Age staging

本轮新增内容必须保持以下 approved age semantics：

| 年龄 | 新增内容可进入范围 |
| --- | --- |
| age 4 | `0` 条 |
| age 5 | `preschool_neutral_fair_play`, `preschool_neutral_self_made_project` |
| age 6 | 五条全部可进入 |
| age 7 | 五条全部可进入 |

不得把所有新内容提前到 age 4。该 staging 是 approved content age semantics，
不是 scheduler quota，也不授权新增 quota、priority 或 age-specific runtime。

## Schema / mechanics boundary

后续 implementation 必须继续使用现有 `PassiveNarrativeEntry`。默认只使用：

```text
id
title
text
originTags
ageMin
ageMax
```

五条全部使用：

```json
{"originTags":["neutral"]}
```

本 Contract 不授权：

- `statDeltas`
- `flags`
- `Person`
- `choice`
- `Milestone`
- `Relationship`
- new player state
- new prerequisite
- new schema
- `TaskLine`
- `StoryArc`
- Craft / Recipe / inventory system
- Community / neighborhood system
- new runtime abstraction

现有 `eventHistory` authored ID 是最小 durable result。五条均不新增 flag、不要求
player decision，也没有当前 future hook。

如果 implementation 发现某张 Card 必须增加上述 mechanics 才能成立：

```text
STOP
返回 Human / Contract
```

不得自行扩 scope，也不得用兼容层绕过本边界。

## Why no origin-specific additions

本次 exact natural evidence 已证明 frontier 的合法 authored pool 最终被完整
消费：`UNCONSUMED = none`。因此当前剩余问题是 whole preschool authored
capacity exhausted，而不是 frontier-specific content 无法进入、frontier
scheduler 偏置或 `p8-wealth-shen` persona 特有问题。

当前没有独立 evidence 证明某个 canonical origin 需要额外 origin-specific
authored set，所以本轮继续只增加 shared-neutral life-development content。

如果 future PVER 表明 generic exhaustion 已解决，但某 origin 仍表现出明显单一
职业 texture，再单独进入 `origin-specific authored diversity gap` 的 Gap
Diagnosis。本轮不提前处理该问题。

## Relationship to previous authority

本文件依赖并保留：

- `PD-120 / Content Authoring Workflow Contract v2`；
- `docs/product/content-authoring-workflow-contract-design.md`；
- `docs/superpowers/specs/2026-09-19-preschool-season-unified-candidate-pool-design.md`；
- `docs/superpowers/specs/2026-09-22-preschool-content-capacity-authoring-design.md`；
- `docs/superpowers/plans/2026-09-22-preschool-content-capacity-implementation.md`；
- 第一轮 authority identifier `preschool-content-capacity-authoring-20260922`。

它不 supersede：

- unified candidate pool semantics；
- history no-reuse；
- origin isolation；
- 3-beat season；
- 3-month cadence；
- 第一轮 8-entry authority。

它只扩展 Human-approved authored capacity scope，增加第二轮 5-entry Minimum
Event Set。

## Independent Measurement Finding

### Top-level

`MEASUREMENT_PROBLEM`

### Fact

Current sealed Phase 0 player-visible PVER evidence 没有保存 packed preschool
passive memory 的 canonical authored entry IDs。player-visible payload 保存的是
visible title/body 与 opaque transcript entry IDs，而不是 authored catalog IDs。

因此，仅使用 sealed player-visible payload，不能可靠完成 authored-ID-level
capacity accounting。

本次通过 same HEAD、same seed、same persona、same runtime parameters 的一次
bounded deterministic diagnostic replay，并要求 observable payload SHA-256
identical、`cmp exit 0`，才使用
`experienceTrace.stateDelta.eventHistoryAdded` 恢复原 natural run 的 exact
provenance。

本 authority 文档只能记录这个 measurement finding。明确禁止在本文件中：

- 设计 Phase 0 修复；
- 授权 measurement remediation implementation；
- 修改 observable payload；
- 将 internal ID 暴露给 player-visible surface；
- 把 measurement remediation 与 5-entry content implementation 捆绑。

后续 measurement remediation 必须是单独任务。

## Natural PVER status

当前 overall PVER：

```text
PARTIAL
```

Positive：第一轮 8-entry set 获得明确 player-visible semantic support。

Residual：4 个 generic gaps 被 exact deterministic evidence 证明为 whole-pool
structural exhaustion。

因此当前不是全面 PASS，也不是第一轮 authoring semantic failure。若后续新的
Natural PVER 仍暴露问题，必须返回 Gap Diagnosis，不能自动继续增加内容。

## Future implementation boundary

本次 authority landing 不实施 5 条内容。后续独立 implementation 才允许：

- 向现有 preschool authored catalog 增加 exactly 5 条 approved shared-neutral
  entries；
- 为五张 Card 编写符合语义的最终 `title` / `text`；
- 增加 focused semantic regressions。

后续 implementation 不得重新决定：

- 数量；
- IDs；
- age windows；
- neutral-only scope；
- 五个 life functions；
- runtime boundaries。

如果真实 schema / architecture 与 accepted semantics 冲突：

```text
STOP
报告冲突
```

不要自行重新设计。

## Future Semantic Verification contract

后续 implementation 至少必须证明：

1. exactly 5 new entries；
2. IDs 精确为本文件五张 Card 的 IDs；
3. age ranges 精确；
4. all `originTags == ["neutral"]`；
5. no `statDeltas`；
6. no `flags`；
7. age 4 没有任何新条目可进入；
8. age 5 恰好有两条新条目可进入；
9. age 6 / 7 五条全部可进入；
10. unified pool 自动把它们作为 first-class candidates；
11. foreign-origin isolation 不变；
12. history no-reuse 不变；
13. same-card IDs distinct；
14. authored-before-gap semantics 不变；
15. season 仍为 3 beats；
16. cadence 仍为 3 months；
17. no new `Person` / choice / runtime。

完成 Semantic Verification 后，才进入新的 Natural PVER。

## Future Natural PVER contract

下一轮 natural PVER 不机械判断 `gap == 0`，而重点检查：

- generic fallback 是否不再结构性主导 late preschool；
- 五个 new life functions 是否自然可见；
- 是否与已有 8 条发生 semantic collision；
- age 5–7 是否呈现更完整的成长阶段；
- 是否出现新的 age awkwardness、主题连续堆叠、transient role / Person 混淆
  或超出 approved scope 的危险/创伤感；
- 是否仍存在 whole-pool structural exhaustion。

若仍失败，必须重新 Gap Diagnosis。不得自动继续增加内容，也不得把新的失败
直接解释成需要更多内容。

## Explicit non-goals

本 authority landing 禁止：

- 修改 `src/**`；
- 修改 `tests/**`；
- 修改 `scripts/**`；
- 修改 `artifacts/**`；
- 修改 preschool catalog；
- 修改 scheduler；
- 修改 selector weights；
- 修改 origin affinity；
- 修改 generic gap placeholder；
- 修改 Phase 0；
- 修复 measurement problem；
- 新增 HFL；
- 运行 AE；
- 运行 replay；
- 运行 natural run；
- 编写 implementation plan；
- 开始 implementation。

本次不修改以下既有 authority 或索引文件：

```text
docs/product/content-authoring-workflow-contract-design.md
docs/superpowers/specs/2026-09-19-preschool-season-unified-candidate-pool-design.md
docs/superpowers/specs/2026-09-22-preschool-content-capacity-authoring-design.md
docs/governance/product-decisions.md
project-source-index.md
```

如果发现 authority conflict，应 STOP 并汇报，不得静默改写既有 authority。

## Related authority

- Current workflow authority: `PD-120` / `docs/product/content-authoring-workflow-contract-design.md`。
- Prior unified-pool authority: `docs/superpowers/specs/2026-09-19-preschool-season-unified-candidate-pool-design.md`。
- First-round capacity authority: `docs/superpowers/specs/2026-09-22-preschool-content-capacity-authoring-design.md`。
- First-round implementation plan: `docs/superpowers/plans/2026-09-22-preschool-content-capacity-implementation.md`。
- Current implementation baseline: `e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf`。

本文件完成的是具体 accepted authoring authority landing。它不表示第二轮已
实现、不表示 Semantic Verification 已完成，也不表示新的 Natural PVER 已完成。
