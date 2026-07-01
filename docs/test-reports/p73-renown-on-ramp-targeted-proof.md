# P73 Renown On-Ramp Targeted Proof

> **Date:** 2026-06-29
> **Stage:** P73 Wuxia Renown On-Ramp Spine
> **Story:** P73-006 — Add targeted on-ramp proof
> **Path:** Bridge → On-Ramp — `tavern_renown_bridge_crossed` → `renown_on_ramp_done`
> **Proof type:** Targeted runtime proof (not full lifetime exhaust, not static fixture-only)

---

## 1. Proof Overview

This document provides a targeted proof that the `jianghu_renown_sage` on-ramp spine event is runtime-reachable and correctly wired after the bridge. It covers the ordered chain: **bridge checkpoint → on-ramp event trigger → on-ramp checkpoint → expression updates**, with tavern-born renown flavor verified throughout.

**Proof method:** Runtime evaluation of conditions and expressions via `ConditionEvaluator` and expression modules, using representative state snapshots at each chain node. This exercises the same code paths used during actual gameplay.

**Chain nodes covered:** 8/8

---

## 2. Chain Node 1: Pre-On-Ramp State (Post-Bridge)

**Node:** Post-bridge baseline — `tavern_renown_bridge_crossed` + `route_renown_committed` set; on-ramp NOT yet triggered

**State:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  ordinary_tavern_midlife_done: true
}
age: 30
```

**Evidence:**
- `detectSampleLine(flags)` returns `'renown'` ✅
- `detectOrdinaryOrigin(flags)` returns `'tavern_hand'` ✅
- `renownCurrentGoal()` returns "凭人脉声名在江湖立足，常有人来寻你引荐主事" ✅
- `tavernCurrentGoal()` returns "江湖上渐渐有了名声，常有人来寻你引荐" ✅
- `tavernLifeMemory()` returns bridge-level memory ✅
- `deriveOrdinaryOriginSummary()` returns "酒肆出身的江湖人物：靠人脉和名声在江湖上立足。" ✅
- `renown_on_ramp_done` is NOT set (correct — we haven't reached on-ramp yet) ✅

**Status:** ✅ Verified

---

## 3. Chain Node 2: On-Ramp Event Trigger

**Node:** On-ramp event trigger — `renown_on_ramp` event fires at correct age when prerequisites met

**State:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  ordinary_tavern_midlife_done: true
}
age: 32
```

**Event condition:**
```
flags.has('tavern_renown_bridge_crossed') && !flags.has('renown_on_ramp_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')
```

**Evidence:**
- Condition evaluates to `true` at age 32 with bridge crossed and no on-ramp done ✅
- Event ID: `renown_on_ramp`
- Age range: 32–35 (3 years after bridge at 29)
- Event title: "声名初显"
- Event type: `auto` (mandatory milestone, like `magnate_on_ramp`)
- Event location: `sample-lines-spine.json` (same file as merchant on-ramp) ✅
- Pattern matches merchant `magnate_on_ramp` (same structure: auto event in sample-lines-spine) ✅

**Status:** ✅ Verified

---

## 4. Chain Node 3: On-Ramp Checkpoint

**Node:** On-ramp checkpoint — `renown_on_ramp_done` + `tavern_renown_on_ramp` set after event fires

**State after event:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  ordinary_tavern_midlife_done: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true
}
age: 32
```

**Flags set (2 new):**
1. `renown_on_ramp_done` — **on-ramp checkpoint flag** (primary, analogous to `magnate_on_ramp_done`)
2. `tavern_renown_on_ramp` — origin-scoped event marker

**Stat effects:**
- `reputation` +5
- `connections` +4
- `charisma` +2

**Evidence:**
- `renown_on_ramp_done` is `true` ✅
- `tavern_renown_on_ramp` is `true` ✅
- Checkpoint flag follows merchant pattern: `<route>_on_ramp_done` ✅
- Stat boosts are renown-appropriate: reputation/connections/charisma (not martial power) ✅
- Tavern-born flavor: stat boosts focus on social capital, not combat

**Status:** ✅ Verified

---

## 5. Chain Node 4: Expression Update 1 — Sample Line Current Goal

**Node:** Player-facing signal 1 (sample line currentGoal) — `renownCurrentGoal()` updates after on-ramp

**State:** `renown_on_ramp_done: true`, age 33

**Before on-ramp:**
> "凭人脉声名在江湖立足，常有人来寻你引荐主事"

**After on-ramp:**
> "在江湖上有了名号，常有人来请你主持公道、引荐高人"

**Evidence:**
- `deriveSampleLineCurrentGoal(state)` returns on-ramp text ✅
- Text is distinct from bridge-only text ✅
- Progression: "寻你引荐主事" (bridge) → "请你主持公道、引荐高人" (on-ramp)
- On-ramp text shows *advancement*: from "立足" to "有了名号" ✅
- Tavern-born flavor preserved: still about 引荐/人脉, not martial skill ✅
- `isPlayerVisibleSampleLineText()` returns `true` ✅

**Status:** ✅ Verified

---

## 6. Chain Node 5: Expression Update 2 — Ordinary Origin Current Goal

**Node:** Player-facing signal 2 (ordinary origin currentGoal) — `tavernCurrentGoal()` updates after on-ramp

**State:** `renown_on_ramp_done: true`

**Before on-ramp:**
> "江湖上渐渐有了名声，常有人来寻你引荐"

**After on-ramp:**
> "在江湖上有了名号，常有人来请你主持公道"

**Evidence:**
- `deriveOrdinaryOriginCurrentGoal(state)` returns on-ramp text ✅
- Distinct from bridge-only text ✅
- Matches sample line expression tone (slightly shorter, more ordinary-origin style) ✅
- Key progression signal: "渐渐有了名声" → "有了名号" ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` ✅

**Status:** ✅ Verified

---

## 7. Chain Node 6: Expression Update 3 — Life Memory

**Node:** Player-facing signal 3 (lifeMemory) — `tavernLifeMemory()` updates after on-ramp with specific event memory

**State:** `renown_on_ramp_done: true`

**Before on-ramp:**
> "你凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号。人们不是来找你喝酒，是来寻你引荐、求你主事。"

**After on-ramp:**
> "你第一次以江湖人的身份主持了公道，两拨人都服你的气。从那天起，你的名字在江湖上有了分量——不是因为武功，是因为人脉和面子。"

**Evidence:**
- `deriveOrdinaryOriginLifeMemory(flags)` returns on-ramp memory ✅
- Memory is specific and event-driven (not just a label) ✅
- Tavern-born flavor: "不是因为武功，是因为人脉和面子" ✅
- Concrete narrative: "两拨人都服你的气" — matches "声名初显" event content ✅
- Distinct from bridge-level memory (bridge is about "渐渐有了名号", on-ramp is about "第一次主持公道") ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` ✅

**Status:** ✅ Verified

---

## 8. Chain Node 7: Expression Update 4 — Origin Summary

**Node:** Player-facing signal 4 (summary) — `deriveOrdinaryOriginSummary()` updates after on-ramp

**State:** `renown_on_ramp_done: true`

**Before on-ramp:**
> "酒肆出身的江湖人物：靠人脉和名声在江湖上立足。"

**After on-ramp:**
> "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。"

**Evidence:**
- `deriveOrdinaryOriginSummary(flags)` returns on-ramp summary ✅
- Title advancement: "江湖人物" → "江湖名宿" ✅
- Action specificity: "靠人脉和名声在江湖上立足" → "凭人脉与面子在江湖上有了名号，主持公道、引荐高人" ✅
- Origin preserved: "酒肆出身的" still leads the summary ✅
- Distinct from merchant on-ramp summary: "酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。" ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` ✅

**Status:** ✅ Verified

---

## 9. Chain Node 8: No Regression of Existing Evidence

**Node:** No regression — P71 bridge evidence and P72 entry evidence still hold

### 9.1 P71 Bridge Evidence Still Valid

- Bridge event still fires at age 29 with `ally_network` + no `ordinary_tavern_midlife_done` ✅
- `tavern_renown_bridge_crossed` + `route_renown_committed` still set by `embrace_renown` ✅
- Decline path still works correctly ✅
- All 3 ordinary origin expression surfaces (goal/memory/summary) still show bridge text before on-ramp ✅

### 9.2 P72 Entry Differentiation Still Valid

- `detectSampleLine()` still returns `'renown'` for bridge-crossed state ✅
- Cost label "江湖声名之累" still shows ✅
- Age-40 identity text still shows ✅
- Route summary "江湖名宿" still shows ✅
- Differentiation from merchant / plain tavern still holds ✅

### 9.3 Merchant On-Ramp Unchanged

- `magnate_on_ramp` event unchanged ✅
- All merchant expression surfaces unchanged ✅
- `guard:sample-lines-baseline` passes ✅

**Status:** ✅ Verified (no regressions)

---

## 10. Summary of All Chain Nodes

| # | Node | Status | Key Evidence |
|---|------|--------|--------------|
| 1 | Pre-on-ramp baseline | ✅ | Bridge flags set, on-ramp flag NOT set, entry expression correct |
| 2 | On-ramp event trigger | ✅ | Condition fires at age 32 with `tavern_renown_bridge_crossed` + no `renown_on_ramp_done` |
| 3 | On-ramp checkpoint | ✅ | `renown_on_ramp_done` + `tavern_renown_on_ramp` both set; stat boosts (reputation/connections/charisma) |
| 4 | Sample line currentGoal | ✅ | "在江湖上有了名号，常有人来请你主持公道、引荐高人" |
| 5 | Ordinary origin currentGoal | ✅ | "在江湖上有了名号，常有人来请你主持公道" |
| 6 | Life memory | ✅ | "第一次以江湖人的身份主持了公道...不是因为武功，是因为人脉和面子" |
| 7 | Origin summary | ✅ | "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人" |
| 8 | No regression | ✅ | P71/P72/merchant evidence all intact; baseline guard passes |

**All 8 chain nodes: ✅ Verified**

---

## 11. Tavern-Born Flavor Check

The tavern-born renown flavor is preserved across all on-ramp surfaces:

| Surface | Tavern-Born Signal |
|---------|-------------------|
| Event title | "声名初显" — fame through reputation, not martial power |
| Event text | "不是因为武功多高，而是因为你认识的人多、能说上话、肯给面子" |
| Event stat boosts | reputation +5, connections +4, charisma +2 (no martialPower) |
| Current goal | "主持公道、引荐高人" — social leadership, not combat leadership |
| Life memory | "不是因为武功，是因为人脉和面子" — explicit tavern-born framing |
| Summary | "酒肆出身的江湖名宿：凭人脉与面子" — origin + mechanism stated |

**Flavor verdict:** ✅ Consistently tavern-born renown throughout

---

## 12. Pressure Stage Readiness

Is the pressure stage (P74+) justified?

**Arguments for proceeding:**
1. ✅ On-ramp spine is solid and well-tested
2. ✅ Tavern-born renown flavor is consistent and distinctive
3. ✅ Expression surfaces are already layered (bridge → on-ramp → ???)
4. ✅ Checkpoint flag `renown_on_ramp_done` is in place for downstream gates
5. ✅ Narrative hooks exist (声名之累、人情债 can be explored in pressure)

**Arguments for caution:**
1. ⚠️ Only one origin (tavern_hand) — replication value needs assessment
2. ⚠️ Pressure content direction not yet defined (what does renown pressure look like?)
3. ⚠️ No payoff shape defined yet

**Recommendation:** GO for pressure stage design (P74 design-first), conditional on:
- Pressure contract being well-defined (not just "more content")
- Maintaining tavern-born flavor discipline
- Staying bounded (1 pressure event + expression updates, like P55 merchant pressure)

---

## 13. Proof Method Notes

This proof is **not** static fixture-only. It exercises:

1. **`ConditionEvaluator.evaluate()`** — the same condition evaluation used by the event selection system at runtime
2. **`sampleLineExpression.ts` functions** — sample line expression (currentGoal, costLabel, age40Identity)
3. **`ordinaryOriginExpression.ts` functions** — ordinary origin expression (currentGoal, lifeMemory, summary)
4. **`detectSampleLine()` / `detectOrdinaryOrigin()`** — detection functions used throughout the codebase

This means the proof validates the *actual runtime code paths*, not just static data. However, it does not simulate a full lifetime from birth to death — that is out of scope for a targeted on-ramp proof.

---

## 14. Deferred Validations

The following are NOT proven here (out of scope for P73):

| Item | Rationale | Stage |
|------|-----------|-------|
| Full lifetime sim (age 0-50) | Out of scope for bounded on-ramp | — |
| Browser / UI verification | No new UI components | — |
| Pressure event content | On-ramp only stage | P74+ |
| Payoff / age-40 identity deepening | On-ramp only stage | P75+ |
| Stat threshold gates | Not implemented in P73 | Future stage |
| Farm_peasant / town_apprentice renown | Other origins out of scope | Future cycles |
| Mentor-bond renown seed | Deferred second seed | Future cycle |
| Choice-based on-ramp (accept/decline) | Auto event chosen for simplicity; can add choice later | Future refinement |

---

**P73-006 complete.** Targeted proof document saved. All 8 chain nodes verified.
