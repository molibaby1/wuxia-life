# P75 Renown Pressure Targeted Proof

> **Date:** 2026-06-29
> **Stage:** P75 Wuxia Renown Pressure Playable Implementation
> **Story:** P75-005 — Add targeted pressure proof
> **Path:** On-Ramp → Pressure — `renown_on_ramp_done` → `renown_midlife_pressure_done`
> **Proof type:** Targeted runtime proof (not full lifetime exhaust, not static fixture-only)

---

## 1. Proof Overview

This document provides a targeted proof that the `jianghu_renown_sage` pressure spine event is runtime-reachable and correctly wired after the on-ramp. It covers the ordered chain: **pre-pressure state → pressure event fires → checkpoint set → cost label update → current goal update**, with tavern-born renown flavor verified throughout.

**Proof method:** Runtime evaluation of conditions and expressions via expression modules, using representative state snapshots at each chain node. This exercises the same code paths used during actual gameplay.

**Core chain nodes covered:** 5/5
**Bonus nodes covered:** 2/2 (life memory, summary)

---

## 2. Chain Node 1: Pre-Pressure State (Post-On-Ramp)

**Node:** Post-on-ramp baseline — `renown_on_ramp_done` set; pressure NOT yet triggered

**State:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true
}
age: 35
```

**Evidence:**
- `detectSampleLine(flags)` returns `'renown'` ✅
- `detectOrdinaryOrigin(flags)` returns `'tavern_hand'` ✅
- `deriveSampleLineCostLabel(state)` returns "江湖声名之累" ✅
- `renownCurrentGoal()` returns "在江湖上有了名号，常有人来请你主持公道、引荐高人" ✅
- `tavernCurrentGoal()` returns "在江湖上有了名号，常有人来请你主持公道" ✅
- `tavernLifeMemory()` returns on-ramp level memory ✅
- `deriveOrdinaryOriginSummary()` returns "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。" ✅
- `renown_midlife_pressure_done` is NOT set (correct — we haven't reached pressure yet) ✅

**Status:** ✅ Verified

---

## 3. Chain Node 2: Pressure Event Fires

**Node:** Pressure event trigger — `renown_midlife_pressure` event fires at correct age when prerequisites met

**State:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true
}
age: 37
```

**Event condition:**
```
flags.has('renown_on_ramp_done') && !flags.has('renown_midlife_pressure_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')
```

**Evidence:**
- Condition evaluates to `true` at age 37 with on-ramp done and no pressure done ✅
- Event ID: `renown_midlife_pressure`
- Age range: 37–41 (2-6 years after on-ramp at 32-35)
- Event title: "人情债重"
- Event type: `auto` (mandatory milestone, like `magnate_midlife_pressure`)
- Event location: `sample-lines-spine.json` (same file as merchant pressure) ✅
- Pattern matches merchant `magnate_midlife_pressure` (same structure: auto event in sample-lines-spine) ✅
- Tavern-born flavor: event text set in 酒肆, about 人情债 ✅
- Distinct from merchant pressure: renown is 人情债 (favor debt), merchant is 金钱债 (money debt) ✅

**Status:** ✅ Verified

---

## 4. Chain Node 3: Pressure Checkpoint Set

**Node:** Pressure checkpoint — `renown_midlife_pressure_done` + `tavern_renown_pressure` set after event fires

**State after event:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true,
  renown_midlife_pressure_done: true,
  tavern_renown_pressure: true
}
age: 37
```

**Flags set (2 new):**
1. `renown_midlife_pressure_done` — **pressure checkpoint flag** (primary, analogous to `magnate_midlife_pressure_done`)
2. `tavern_renown_pressure` — origin-scoped event marker

**Stat effects:**
- `reputation` +3 (名声还在涨，但代价也来了)
- `connections` +2 (人脉继续扩展)
- `charisma` +1

**Evidence:**
- `renown_midlife_pressure_done` is `true` ✅
- `tavern_renown_pressure` is `true` ✅
- Checkpoint flag follows merchant pattern: `<route>_midlife_pressure_done` ✅
- Stat boosts are smaller than on-ramp (+3/+2/+1 vs +5/+4/+2) — reflects "维持期" vs "上升期" ✅
- Tavern-born flavor: stat boosts focus on social capital, not combat ✅
- No martial power stats changed — consistent with renown route identity ✅

**Status:** ✅ Verified

---

## 5. Chain Node 4: Cost Label Update (Sample Line)

**Node:** Player-facing signal 1 (cost label) — `deriveSampleLineCostLabel()` updates after pressure

**State:** `renown_midlife_pressure_done: true`, age 38

**Before pressure:**
> "江湖声名之累"

**After pressure:**
> "人情债渐重"

**Evidence:**
- `deriveSampleLineCostLabel(state)` returns pressure text "人情债渐重" ✅
- Text is distinct from pre-pressure "江湖声名之累" ✅
- Progression: abstract "累" → concrete "债" (more specific, more weight) ✅
- Tavern-born flavor: 人情债 is classic tavern/jianghu social currency ✅
- Distinct from merchant pressure cost label ("巨贾负担" / "人情与面子的担子") — renown is more about 债, merchant is more about 担子 ✅
- `isPlayerVisibleSampleLineText()` returns `true` ✅

**Status:** ✅ Verified

---

## 6. Chain Node 5: Current Goal Update (Sample Line + Ordinary Origin)

**Node:** Player-facing signal 2 (current goal) — both sample line and ordinary origin currentGoal update after pressure

### 6.1 Sample Line Current Goal

**State:** `renown_midlife_pressure_done: true`, age 38

**Before pressure:**
> "在江湖上有了名号，常有人来请你主持公道、引荐高人"

**After pressure:**
> "一面维持声名，一面应付越来越重的人情债"

**Evidence:**
- `deriveSampleLineCurrentGoal(state)` returns pressure text ✅
- Distinct from on-ramp text ✅
- Progression: "上升期" (有了名号，主持公道) → "维持期 + 应付压力" (维持声名，应付人情债) ✅
- Explicitly mentions "人情债" — ties to cost label update ✅
- Tavern-born flavor preserved ✅
- `isPlayerVisibleSampleLineText()` returns `true` ✅

### 6.2 Ordinary Origin Current Goal

**State:** `renown_midlife_pressure_done: true`

**Before pressure:**
> "在江湖上有了名号，常有人来请你主持公道"

**After pressure:**
> "一面维持声名，一面应付越来越重的人情债"

**Evidence:**
- `deriveOrdinaryOriginCurrentGoal(state)` returns pressure text ✅
- Distinct from on-ramp text ✅
- Matches sample line expression tone (same pressure-state sentence) ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` ✅

**Status:** ✅ Verified

---

## 7. Bonus Node 6: Life Memory Update (Ordinary Origin)

**Node:** Bonus player-facing signal (lifeMemory) — `tavernLifeMemory()` updates after pressure with specific memory

**State:** `renown_midlife_pressure_done: true`

**Before pressure (on-ramp):**
> "你第一次以江湖人的身份主持了公道，两拨人都服你的气。从那天起，你的名字在江湖上有了分量——不是因为武功，是因为人脉和面子。"

**After pressure:**
> "这些年欠的人情、攒的面子，如今都成了要还的债。有人登门道谢，有人上门讨债，酒肆的门槛都快被踩平了。你才明白——江湖名声，从来不是白来的。"

**Evidence:**
- `deriveOrdinaryOriginLifeMemory(flags)` returns pressure memory ✅
- Memory is specific and vivid (酒肆门槛被踩平, 登门道谢/上门讨债) ✅
- Tavern-born flavor: 酒肆场景, 人情/面子 mechanism ✅
- Concrete narrative: "酒肆的门槛都快被踩平了" — matches "人情债重" event content ✅
- Distinct from on-ramp memory (on-ramp is about "第一次主持公道", pressure is about "人情债压身") ✅
- Causal chain: on-ramp memory (攒面子) → pressure memory (面子变债) — narrative arc works ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` ✅

**Status:** ✅ Verified (bonus node)

---

## 8. Bonus Node 7: Summary Update (Ordinary Origin)

**Node:** Bonus player-facing signal (summary) — `deriveOrdinaryOriginSummary()` updates after pressure

**State:** `renown_midlife_pressure_done: true`

**Before pressure (on-ramp):**
> "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。"

**After pressure:**
> "酒肆出身的江湖名宿：靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重。"

**Evidence:**
- `deriveOrdinaryOriginSummary(flags)` returns pressure summary ✅
- Title preserved: "酒肆出身的江湖名宿" still leads ✅
- Tone shift: "凭人脉与面子在江湖上有了名号" → "靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重" ✅
- Adds cost dimension: "只是"转折 + "人情债也越重" — pressure is visible at summary level ✅
- Distinct from merchant pressure summary ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` ✅

**Status:** ✅ Verified (bonus node)

---

## 9. Full Chain Traceback

Complete chain from origin → bridge → on-ramp → pressure:

| Stage | Checkpoint | Current Goal | Cost Label | Life Memory |
|-------|-----------|--------------|------------|-------------|
| Origin (tavern_hand) | — | "在酒肆帮忙，日子忙碌但热闹" | — | "有几位熟客成了朋友。" |
| Bridge (age 29) | `tavern_renown_bridge_crossed` | "凭人脉声名在江湖立足，常有人来寻你引荐主事" | "江湖声名之累" | "你凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号。" |
| On-Ramp (age 32-35) | `renown_on_ramp_done` | "在江湖上有了名号，常有人来请你主持公道、引荐高人" | "江湖声名之累" | "你第一次以江湖人的身份主持了公道...不是因为武功，是因为人脉和面子。" |
| **Pressure (age 37-41)** | **`renown_midlife_pressure_done`** | **"一面维持声名，一面应付越来越重的人情债"** | **"人情债渐重"** | **"这些年欠的人情、攒的面子，如今都成了要还的债...江湖名声，从来不是白来的。"** |

**Narrative arc:** 上升 (bridge → on-ramp) → 平台 + 代价 (pressure) — feels like a real turning point, not just "more of the same" ✅

---

## 10. Summary of All Chain Nodes

| # | Node | Type | Status | Key Evidence |
|---|------|------|--------|--------------|
| 1 | Pre-pressure baseline (post-on-ramp) | Core | ✅ | On-ramp flags set, pressure flag NOT set, cost label = 江湖声名之累 |
| 2 | Pressure event fires | Core | ✅ | Condition fires at age 37 with `renown_on_ramp_done` + no `renown_midlife_pressure_done` |
| 3 | Pressure checkpoint set | Core | ✅ | `renown_midlife_pressure_done` + `tavern_renown_pressure` both set; stat boosts (+3/+2/+1) |
| 4 | Cost label update (sample line) | Core | ✅ | "人情债渐重" — distinct from pre-pressure "江湖声名之累" |
| 5 | Current goal update (sample line + origin) | Core | ✅ | "一面维持声名，一面应付越来越重的人情债" |
| 6 | Life memory update (ordinary origin) | Bonus | ✅ | "这些年欠的人情、攒的面子，如今都成了要还的债" |
| 7 | Summary update (ordinary origin) | Bonus | ✅ | "靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重" |

**All 5 core nodes: ✅ Verified**
**All 2 bonus nodes: ✅ Verified**

---

## 11. Tavern-Born Flavor Check

The tavern-born renown flavor is preserved across all pressure surfaces:

| Surface | Tavern-Born Signal |
|---------|-------------------|
| Event title | "人情债重" — favor debt, not martial debt, not money debt |
| Event text | "酒肆里常有人来...你站在柜台后...小时候在这儿见惯的人情往来" |
| Event stat boosts | reputation +3, connections +2, charisma +1 (no martialPower) |
| Cost label | "人情债渐重" — classic jianghu social currency |
| Current goal | "一面维持声名，一面应付越来越重的人情债" |
| Life memory | "酒肆的门槛都快被踩平了" — concrete tavern imagery |
| Summary | "酒肆出身的江湖名宿" — origin explicitly foregrounded |

**Flavor verdict:** ✅ Consistently tavern-born renown throughout

---

## 12. Distinction from Merchant Pressure

Renown pressure vs merchant pressure — same pattern, different flavor:

| Aspect | Renown Pressure | Merchant Pressure |
|--------|-----------------|-------------------|
| Core debt | 人情债 (favor debt) | 金钱债 / 经营担子 (money/business burden) |
| Pressure source | 名声太大、人脉太广 | 生意太大、债务太多 |
| Key scene | 酒肆 (tavern) | 商铺/商路 (shop/trade route) |
| Stat focus | reputation, connections, charisma | wealth, business-related |
| Cost label | 人情债渐重 | 巨贾负担 / 合伙与账目的担子 |
| Current goal | 一面维持声名，一面应付人情债 | 商号遍九州，人情债也遍九州 |

**Conclusion:** Pattern symmetric (auto milestone + expression updates), flavor distinctly different (人情债 vs 金钱债) ✅

---

## 13. Payoff Stage Readiness

Is the payoff stage (P76+) justified?

**Arguments for proceeding:**
1. ✅ Pressure spine is solid and well-tested
2. ✅ Tavern-born renown flavor is consistent and distinctive
3. ✅ Narrative arc works: bridge → on-ramp → pressure → ??? (payoff naturally follows)
4. ✅ Checkpoint flag `renown_midlife_pressure_done` is in place for downstream gates
5. ✅ Payoff flag interfaces reserved (`renown_payoff_done`, `renown_age40_identity_done`)
6. ✅ Narrative hooks exist (人情债能不能还得清？名声和自由哪个更重要？)
7. ✅ Pattern proven with merchant trilogy (on-ramp → pressure → payoff)

**Arguments for caution:**
1. ⚠️ Only one origin (tavern_hand) — replication value needs assessment
2. ⚠️ Payoff direction not yet defined (what does renown payoff look like?)
3. ⚠️ Need to decide: choice-based payoff vs auto payoff (merchant payoff is auto)

**Recommendation:** GO for payoff stage (P76), conditional on:
- Payoff contract being well-defined (not just "more content")
- Maintaining tavern-born flavor discipline
- Staying bounded (1 payoff event + expression updates, like P55 merchant payoff)
- Considering choice-based payoff (to differentiate from merchant auto payoff)

---

## 14. Proof Method Notes

This proof is **not** static fixture-only. It exercises:

1. **`sampleLineExpression.ts` functions** — sample line expression (currentGoal, costLabel, age40Identity)
2. **`ordinaryOriginExpression.ts` functions** — ordinary origin expression (currentGoal, lifeMemory, summary)
3. **`detectSampleLine()` / `detectOrdinaryOrigin()`** — detection functions used throughout the codebase
4. **Sample-lines-spine.json event configuration** — event conditions, effects, metadata

This means the proof validates the *actual runtime code paths*, not just static data. However, it does not simulate a full lifetime from birth to death — that is out of scope for a targeted pressure proof.

---

## 15. Deferred Validations

The following are NOT proven here (out of scope for P75):

| Item | Rationale | Stage |
|------|-----------|-------|
| Full lifetime sim (age 0-50) | Out of scope for bounded pressure | — |
| Browser / UI verification | No new UI components | — |
| Payoff / age-40 identity deepening | Pressure only stage | P76+ |
| Stat threshold gates | Not implemented in P75 (deferred enhancement) | Future stage |
| Farm_peasant / town_apprentice renown | Other origins out of scope | Future cycles |
| Choice-based pressure | Auto event per contract; choice for payoff | P76+ |
| Multiple pressure events | 1 event per P74 contract | Future expansion |

---

**P75-005 complete.** Targeted proof document saved. All 5 core nodes + 2 bonus nodes verified.
