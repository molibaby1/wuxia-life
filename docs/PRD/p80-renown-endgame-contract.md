# P80 Renown Endgame Contract

> **Purpose:** Design-first contract for the `jianghu_renown_sage` endgame / final legacy stage — 3 variants based on late-life branch, auto echo event at age 60+
> **Source of truth:** This contract defines what P81 (implementation) must deliver.
> **Status:** LOCKED — P80 design-first complete
> **Verdict:** CONDITIONAL_GO — lightweight only

---

## 1. Core Direction

**Selected:** Single auto echo event with 3 variants — Legacy Echo (身后名之声)

**Core narrative question:** 江湖如何记住你？

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at payoff; endgame is the final consequence
- Feels like "江湖怎么说你" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint

**Why 3 variants:**
- Leverages the 3-branch structure from late-life
- Each branch delivers on the "jianghu memory" promised by late-life identity
- Meaningful differentiation — not reskinned
- Still lightweight (1 event, 3 variants)

**Distinction from late-life:**
- Late-life = first-person: 你晚年怎么过
- Endgame = third-person: 江湖怎么记住你
- Late-life is an active life stage; endgame is a coda / echo

**Distinction from generic P19 endgame:**
- P19 = comprehensive end-of-life system (relationships + factions + legacy + memory)
- Renown endgame = route-specific thematic coda (reputation / jianghu memory only)
- P19 = end of life / death; Renown endgame = 60-65 echo event, before final death

---

## 2. Endgame Event Spec

### Event ID
`renown_endgame_echo`

### Type
`auto`（自动触发，echo event）

### Age Range
60–65 岁 (推荐 62±3)

### Trigger
`age_reach` at age 60

### Trigger Conditions
1. `flags.has('renown_late_life_done')` — late-life 已完成
2. `!flags.has('renown_endgame_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. `flags.has('tavern_renown_bridge_crossed')` — 隐含保证 tavern_hand origin + ally_network seed

### Upstream Gate
`renown_late_life_done`

### Branching Logic
Branching is based on which late-life branch marker is set:
- `tavern_renown_late_burnout` → Variant A (身后名之声·叹 / Sigh)
- `tavern_renown_late_lone_wolf` → Variant B (身后名之声·遥 / Distant)
- `tavern_renown_late_mentor` → Variant C (身后名之声·传 / Legacy)

**Exactly one of these three will be set** (guaranteed by late-life events).

### Checkpoint Flag
`renown_endgame_done` — 通用 checkpoint，标记 endgame 已发生

### Endgame Identity Flag
`renown_endgame_identity_done` — endgame 身份深化

### Branch-Specific Identity Markers
三选一设置：
- `tavern_renown_endgame_sigh`（Variant A：叹）
- `tavern_renown_endgame_distant`（Variant B：遥）
- `tavern_renown_endgame_legacy`（Variant C：传）

### Stats
**None.** Endgame is about memory / jianghu reputation, not stat changes.

Rationale:
- Endgame is a coda, not a power-up
- Stat changes would feel like "more late-life" rather than a distinct endgame
- Lightweight constraint — keep it minimal

---

## 3. Three Variant Details

### Variant A — 身后名之声·叹 (Sigh / Bittersweet Legend)

**Late-life root:** 油尽灯枯 (Burnout)
**Core theme:** 名声比人长久
**Tone:** Bittersweet — 名声传下去了，但人熬干了

**Narrative beat:**
- 听见酒肆里年轻人问起"那个老掌柜"
- 老客人叹口气说："那人啊，是个好人……" 但说不出更多细节
- 你坐在角落里，听着自己成了传说
- 名声比人长久——你守了一辈子的名声，最后真的传下去了，但代价也真的没人记得了

**Expression updates:**
- Cost label: `身后名·叹`
- Current goal: `听着自己成了传说，也算值了`
- Identity: `熬干了的老传说`
- Life memory: `名声传下去了 + 老客人还念你的好 + 年轻人只听过传说`
- Summary: `江湖名宿 + 身后名·叹 + 名声比人长久`

**Tavern-born anchors:** 酒肆门槛、老客人叹息、年轻人听传说

---

### Variant B — 身后名之声·遥 (Distant / Mysterious Legend)

**Late-life root:** 逍遥自在 (Lone Wolf)
**Core theme:** 传说比人逍遥
**Tone:** Playful-mysterious — 传说真假参半，人逍遥

**Narrative beat:**
- 酒肆里有人讲起"那个逍遥翁"的故事
- 说当年怎么怎么样，真假难辨
- 你也许就在角落里听着，没人认出你
- 你笑了笑，自己都快忘了自己当年的样子了
- 江湖上的你，比真实的你，早就两回事了

**Expression updates:**
- Cost label: `身后名·遥`
- Current goal: `传说真假谁真谁假，自己知道就好`
- Identity: `逍遥传说里的神秘人`
- Life memory: `故事还在流传 + 没人知道你在哪 + 真假参半的传说`
- Summary: `江湖独行 + 身后名·遥 + 传说比人逍遥`

**Tavern-born anchors:** 酒肆谈资、真假传说、在座没人认出你

---

### Variant C — 身后名之声·传 (Legacy / Living Legend)

**Late-life root:** 传承授业 (Mentor)
**Core theme:** 智慧比人长久
**Tone:** Warm-satisfied — 传承了，传下去了

**Narrative beat:**
- 看见后辈们在酒肆里聊天
- 他们说起"老掌柜的规矩"
- 你的话还在被人提起
- 你笑了——你这辈子没白活
- 传承不是名字传下去，是智慧传下去了

**Expression updates:**
- Cost label: `身后名·传`
- Current goal: `看着后辈们传下去，这就够了`
- Identity: `活在传说里的老掌柜`
- Life memory: `后辈们讲你的故事 + 老掌柜的规矩 + 智慧传下去了`
- Summary: `江湖名宿 + 身后名·传 + 智慧比人长久`

**Tavern-born anchors:** 老掌柜的规矩、后辈们传下去、酒肆传统

---

## 4. Expression Update Surfaces

### 4.1 Sample Line Expression (sampleLineExpression.ts)

| Surface | Function | Priority | Notes |
|---------|----------|----------|-------|
| Cost label | `deriveSampleLineCostLabel()` | P0 | 身后名·叹/遥/传 |
| Current goal | `renownCurrentGoal()` | P0 | Endgame goal per branch |
| Age-40 identity | `renownAge40Identity()` | P0 | Endgame identity per branch |

**Implementation pattern:** Done-flag-first — check `renown_endgame_done` first, then branch marker.

---

### 4.2 Ordinary Origin Expression (ordinaryOriginExpression.ts)

| Surface | Function | Priority | Notes |
|---------|----------|----------|-------|
| Current goal | `tavernCurrentGoal()` | P1 | Endgame goal per branch |
| Life memory | `tavernLifeMemory()` | P1 | Endgame memory per branch |
| Summary | `deriveOrdinaryOriginSummary()` | P1 | Endgame summary per branch |

**Implementation pattern:** Done-flag-first — check `renown_endgame_done` first, then branch marker.

---

**Total: 6 expression surfaces (3 sample line + 3 ordinary origin)**

---

## 5. Endgame-Specific Player-Facing Signals

**Minimum 2 core signals:** ✅ Satisfied (3+)

1. **Cost label change** — 身后名·叹/遥/传 (clearly shows endgame state)
2. **Current goal change** — each branch has distinct endgame goal
3. **Endgame identity** — 3 distinct endgame identities (熬干了的老传说 / 传说里的神秘人 / 活在传说里的老掌柜)

**Bonus signals:**
4. Life memory updates
5. Summary updates

---

## 6. Gate Acceptance Criteria

For endgame to be considered "done" (P81 closure):

1. ✅ Endgame echo event fires at age 60-65 with correct conditions
2. ✅ All 3 variants present with distinct identities
3. ✅ Branch-specific flags set correctly (one per path)
4. ✅ No stat changes (endgame is memory, not power)
5. ✅ Cost label + current goal update per branch
6. ✅ Endgame identity deepens per branch
7. ✅ Tavern-born flavor consistent across all branches
8. ✅ No P71/P72/P73/P75/P77/P79 regressions
9. ✅ Typecheck passes

---

## 7. Lightweight Compliance Contract

P81 implementation MUST adhere to these lightweight constraints:

| Constraint | Requirement |
|------------|-------------|
| 1 echo event maximum | 1 event with 3 variants, not 3 separate events |
| Expression updates only | No new systems, no new framework |
| Auto event | Not a choice event |
| 3 variants max | One per late-life branch |
| Single age window | 60-65, not multiple stages |
| 2+ endgame signals | Cost label + current goal minimum |
| No stat changes | Endgame is memory, not power |

**If P81 implementation requires more than this, STOP and reassess GO/NO-GO.**

---

## 8. P80 / P81 Boundary

| P80 (this stage) | P81 (implementation) |
|-------------------|---------------------|
| Prerequisite audit | — |
| Scope contract | — |
| GO/NO-GO assessment | — |
| Endgame direction & branch design | Event wiring implementation |
| Endgame contract (THIS DOCUMENT) — LOCKED | Follows contract exactly |
| P81 validation shape definition | Targeted proof + regression tests |
| Closure report + handoff | Implementation + verification |

**P80 produces the contract; P81 implements it. No scope creep from P80 into P81.**

---

## 9. Reserved Flags

The following flags are reserved for endgame implementation in P81:
- `renown_endgame_done` — checkpoint
- `renown_endgame_identity_done` — identity deepening
- `tavern_renown_endgame_sigh` — Variant A marker
- `tavern_renown_endgame_distant` — Variant B marker
- `tavern_renown_endgame_legacy` — Variant C marker

**No other flags should be needed. If more flags are required in P81, reassess scope creep.**

---

## 10. Quality Priority Order for P81

1. **Lightweight compliance** — stay within 1 event + expression updates only
2. **GO/NO-GO integrity** — if scope creeps, stop and reassess
3. **Flavor consistency** — tavern-born renown throughout
4. **Branch differentiation** — 3 meaningfully different endgames
5. **Expression correctness** — all 6 surfaces update correctly
6. **No regressions** — P71/P72/P73/P75/P77/P79 all still pass

---

**Contract LOCKED. P81 may proceed with implementation — CONDITIONAL_GO, lightweight only.**
