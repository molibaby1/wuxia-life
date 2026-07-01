# PRD: P43 Wuxia Archetype Recap And Ending Differentiation

> **Derived from:** P26-P42 habit trajectory system expansion
> **Stage slug:** `p43-wuxia-archetype-recap-and-ending-differentiation`
> **Parent:** `p42-wuxia-habit-trajectory-content-densification`

## 1. Introduction

P42 之后，长期塑形系统在过程层已经更稳定，但项目仍有一个高价值缺口：玩家在跑完整局后，未必能获得足够强的“我这一生到底成了怎样的人”的收束感。

当前问题通常表现为：

- 过程里有很多 shaping echo，但终局回顾未充分把它们归纳成 archetype
- ending / summary 对“长期塑形”与“人生类型”的关系表达不够强
- 不同 archetype 的一生虽然路径不同，但结尾层的辨识度还不够高

P43 的目标是让中后期 recap、人生摘要和 ending differentiation 共同形成更强的“整局人物画像收口”。

## 2. Goals

- 让 dominant long-term shaping 与 archetype 归纳更明确地进入结尾层
- 提高不同 archetype 的回顾辨识度
- 让玩家能读懂自己为何成为这种人，而不只是看到结果标签
- 强化“同一条路线，不同长期塑形会收束成不同人生味道”的表达

## 3. Non-Goals

- 不扩大新的内容池波次
- 不重做 replay gate
- 不在 P43 中做 operator 工具
- 不改 scheduler 核心
- 不新增完全独立的 ending system

## 4. User Stories

### US-001: Audit Current Endgame And Recap Differentiation Gaps

**Description:** As a maintainer, I want a gap audit of endgame recap and archetype differentiation so P43 targets the weakest closing surfaces.

**Acceptance Criteria:**

- [ ] Inventory current recap and ending surfaces that express life trajectory or archetype
- [ ] Identify where shaping is lost, flattened, or repeated across archetypes
- [ ] Rank the highest-value recap/ending gaps
- [ ] Save audit under `docs/test-reports/p43-ending-differentiation-gap-audit.md`
- [ ] No gameplay behavior changes in this story

### US-002: Add Dominant Shaping Recap To Late-Life Summary

**Description:** As a player, I want late-life recap to explicitly name the dominant long-term forces that shaped my life, so the whole run feels causally legible.

**Acceptance Criteria:**

- [ ] Add or revise recap output so it names dominant shaping directions in player-facing language
- [ ] Recap should connect shaping direction to visible life consequences or identity
- [ ] Avoid raw internal state output
- [ ] Add targeted regression coverage for recap derivation

### US-003: Differentiate Archetype Endings By Shaping Pattern

**Description:** As a player, I want two runs in the same broad route family to still end with different tones or summaries when their long-term shaping patterns differ.

**Acceptance Criteria:**

- [ ] Select at least 2 archetype families and 2 shaping patterns per family
- [ ] Add or revise ending/recap content so these patterns are visibly distinct
- [ ] Differentiation must be readable in player-facing output, not only hidden diagnostics
- [ ] Document sample before/after cases under `docs/test-reports/p43-archetype-ending-delta-matrix.md`

### US-004: Bind Life Memory, Recap, And Ending Language Together

**Description:** As a player, I want my life-memory summary, late recap, and ending language to feel like one coherent interpretation of the same life rather than three disconnected summaries.

**Acceptance Criteria:**

- [ ] Review terminology consistency across life memory, recap, and ending surfaces
- [ ] Align major labels for martial, scholarly, livelihood, social, and family shaping
- [ ] Remove obvious contradictions or duplicate phrasing patterns
- [ ] Add targeted regression or snapshot coverage where appropriate

### US-005: P43 Regression And Closure

**Description:** As a maintainer, I want regression coverage and closure evidence that archetype/ending differentiation improved without breaking prior shaping features.

**Acceptance Criteria:**

- [ ] Run typecheck
- [ ] Run existing habit and recap related tests
- [ ] Add at least one isolated P43 regression asserting differentiated recap or ending output
- [ ] Save closure under `docs/test-reports/p43-archetype-recap-ending-closure.md`
- [ ] Closure lists remaining flattening areas clearly

## 5. Success Metrics

| ID | Metric | Baseline | Target |
| --- | --- | --- | --- |
| **M1** | Dominant shaping visible in recap | partial | **explicitly surfaced** |
| **M2** | Same-route ending differentiation | weak in places | **improved in at least 2 families** |
| **M3** | Summary language consistency | mixed | **aligned across recap surfaces** |
| **M4** | Existing shaping regressions | pass | **no regression** |

## 6. Dependencies / Context

- P41 player-facing shaping visibility
- P42 densified content coverage
- Existing recap / summary / ending tests
- Existing life-memory summary surfaces

## 7. Recommended Execution Order

1. Gap audit
2. Dominant shaping recap
3. Same-route ending differentiation
4. Cross-surface terminology alignment
5. Regression + closure

## 8. Why This Is Next

P43 turns the long-term shaping system from a good midgame mechanic into a strong full-run identity payoff layer, which is necessary if replayability is supposed to feel like “different lives” rather than only “different event orderings”.

