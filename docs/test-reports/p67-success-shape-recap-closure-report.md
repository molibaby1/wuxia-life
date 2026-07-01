# P67 Merchant Trilogy Success-Shape and Recap Closure Report

> **Date:** 2026-06-28
> **Stage:** P67 Wuxia Merchant Trilogy Success Shape And Recap
> **Branch:** `codex/p67-wuxia-merchant-trilogy-success-shape-and-recap`
> **Type:** Closure — final stage of the merchant trilogy bounded player-experience optimization

---

## 1. Executive Summary

P67 completes the merchant trilogy optimization sequence by making the three merchant routes (apprentice, tavern, peasant) succeed in meaningfully different *shapes* and giving each route a memorable destiny sentence that players can walk away with.

**Before P67:** Success was "same shape, different flavor" — all three routes became "巨贾" (merchant magnate) with different origin decoration. The recap layer had no distinct punchline per route. Players left thinking "I became a merchant [with X background]" rather than "I became this specific kind of successful person."

**After P67:** Each route has a distinct success shape and a destiny sentence that captures it:
- **Apprentice:** 从刨子到账本，靠手艺眼光算出了一片商路 (craft-judgment empire)
- **Tavern:** 从酒肆到商号，靠人情网络织出了八方商路 (network-information empire)
- **Peasant:** 从田埂到车马，靠脚力血汗踩出了一条粮路 (endurance-logistics empire)

All done within the existing expression/marker framework — no new systems, no new events, no structural change to the magnate skeleton. This is the final stage of the merchant trilogy optimization.

---

## 2. Deliverables Inventory

### 2.1 Documentation

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Success-shape and recap audit | `docs/test-reports/p67-success-shape-recap-audit.md` | P67-001 | ✅ Done |
| Scope contract | `docs/test-reports/p67-success-shape-recap-scope-contract.md` | P67-002 | ✅ Done |
| Success-shape contracts (Appendix A) | `docs/PRD/p67-wuxia-merchant-trilogy-success-shape-and-recap.md` | P67-003/004/005 | ✅ Done |
| Comparison proof | `docs/test-reports/p67-success-shape-recap-proof.md` | P67-008 | ✅ Done |
| Closure report (this document) | `docs/test-reports/p67-success-shape-recap-closure-report.md` | P67-010 | ✅ Done |

### 2.2 Runtime Changes

| File | Change | Nature |
|------|--------|--------|
| `src/p50/sampleLineExpression.ts` | Reframed payoff success metaphors to route-specific shapes, strengthened age-40 identity with success-shape emphasis, added `deriveSampleLineDestinySentence()` expression function | Expression-only |
| `tests/p50SampleLineExpressionTests.ts` | Added 4 new P67 test functions (payoff success-shape differentiation, destiny sentence existence/distinction, age-40 success-shape identity, comparison-level distinction) | Narrow regression tests |

### 2.3 Validation

| Check | Result | Notes |
|-------|--------|-------|
| P50 sample line expression tests | ✅ Pass | Includes new P67 tests + existing P63/P64/P66 tests |
| Typecheck | ✅ Pass | `tsc --noEmit` |
| P63 entry differentiation (regression) | ✅ Pass | No regression — existing tests still pass |
| P64 pressure/payoff differentiation (regression) | ✅ Pass | No regression — existing tests still pass |
| P66 cost differentiation (regression) | ✅ Pass | No regression — existing tests still pass |
| Player-visibility check | ✅ Pass | All expressions pass `isPlayerVisibleSampleLineText` |

---

## 3. What Changed (Runtime)

### 3.1 Success-Shape Metaphor at Payoff (Biggest Change)

The payoff current goal now frames success in route-specific shapes, not just "巨贾之位" with decoration:

**Apprentice:**
> 从刨子到账本，靠手艺的眼光算出了一片商路，品质立住了招牌，合伙铺出了版图，只是如今要看着合伙人的脸色，账目上的分成比木纹更难拿捏

- Success shape: **Craft-judgment empire** — quality builds reputation, partnership builds scale
- The success is *calculated* (算出) — matching the apprentice's craft/numbers orientation

**Tavern:**
> 从酒肆到商号，靠人情的网络织出了八方商路，老主顾串起了门路，引荐打通了关节，只是欠的人情比挣的银子还多，每一笔都要掂量谁的面子、还谁的情

- Success shape: **Network-information empire** — connections build reach, referrals build access
- The success is *woven* (织出) — matching the tavern's network/relationship orientation

**Peasant:**
> 从田埂到车马，靠脚力和血汗踩出了一条粮路，车马仓储踩出了根基，收成赌出了规模，只是脚下的路比田埂还长，赢了但也再回不到田里了

- Success shape: **Endurance-logistics empire** — labor builds foundation, risk builds scale
- The success is *stepped out* (踩出) — matching the peasant's labor/endurance orientation

### 3.2 Destiny Sentence / Recap Punchline

Added `deriveSampleLineDestinySentence()` function that returns a short, memorable punchline sentence per route:

| Route | Destiny Sentence |
|-------|-----------------|
| **Apprentice** | 从刨子到账本，靠手艺眼光算出了一片商路 |
| **Tavern** | 从酒肆到商号，靠人情网络织出了八方商路 |
| **Peasant** | 从田埂到车马，靠脚力血汗踩出了一条粮路 |

Key design choices:
- All 16 characters long — short enough to remember
- Same structure ("从X到Y，靠Z算出/织出/踩出了...") — players recognize the pattern but remember the specific version
- Each has a distinctive verb (算出/织出/踩出) that matches the route's character
- Each anchors to a vivid origin image (刨子/酒肆/田埂)

### 3.3 Age-40 Identity: From "Came From" to "Built Through"

The age-40 identity shifted from emphasizing *origin* ("从X走来的巨贾") to emphasizing *success shape* ("靠X做起来的巨贾"):

**Before (P66):** "你是从学徒走来的巨贾：手艺为基，合伙为径..."
**After (P67):** "你是靠手艺眼光做起来的巨贾：从刨子到账本，品质立住了招牌..."

This is a subtle but important shift: the success is now *shaped by* the origin path, not just *decorated by* it. Players don't just "come from" somewhere — they "built through" something.

### 3.4 Cost Shape and Success Shape Alignment

P66's cost differentiation is preserved and now aligns with P67's success-shape differentiation:

| Route | Success Shape | Cost Shape | Alignment |
|-------|--------------|-----------|-----------|
| **Apprentice** | Craft-judgment / partnership | 合伙与账目的担子 | ✅ — You pay a partnership/accounting price for a craft-quality success |
| **Tavern** | Network-information / connection | 人情与面子的担子 | ✅ — You pay a favor/face price for a network success |
| **Peasant** | Endurance-logistics / labor | 粮路与奔波的担子 | ✅ — You pay a travel/labor price for a logistics success |

The cost and success are two sides of the same coin — you pay a specific price for a specific kind of success.

---

## 4. Three Kinds of Success Summary

| Dimension | Apprentice | Tavern | Peasant |
|-----------|------------|--------|---------|
| **Core success metaphor** | Craft-judgment empire | Network-information empire | Endurance-logistics empire |
| **Success through** | Judgment, quality, partnership | Connections, information, referrals | Endurance, cargo risk, scale |
| **Destiny sentence** | 从刨子到账本，靠手艺眼光算出了一片商路 | 从酒肆到商号，靠人情网络织出了八方商路 | 从田埂到车马，靠脚力血汗踩出了一条粮路 |
| **Distinctive verb** | 算出 (calculated) | 织出 (woven) | 踩出 (stepped out) |
| **Origin anchor** | 刨子 (wood plane) | 酒肆 (tavern) | 田埂 (field ridge) |
| **What you build** | 品质立住的商路 | 人情织就的商路网 | 脚力踩出的粮路 |
| **What you pay** | 合伙人的脸色 + 账目分成 | 人情债 + 面子的重量 | 奔波的路 + 回不去的田 |
| **Cost label** | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |
| **Identity framing** | "靠手艺眼光做起来的巨贾" | "靠人情网络做起来的巨贾" | "靠脚力血汗做起来的巨贾" |

None of these are "generic merchant success" — each success is shaped by the route's origin and path.

---

## 5. Story Completion

| Story | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| P67-001 | Audit current success-shape and recap strength | ✅ Pass | `p67-success-shape-recap-audit.md` — 3-route inventory, thin-spot identification |
| P67-002 | Lock P67 scope contract | ✅ Pass | `p67-success-shape-recap-scope-contract.md` — allowed/forbidden layers, enforcement |
| P67-003 | Define apprentice success-shape contract | ✅ Pass | PRD Appendix A.1 — craft-judgment/partnership success shape |
| P67-004 | Define tavern success-shape contract | ✅ Pass | PRD Appendix A.2 — network-information/connection success shape |
| P67-005 | Define peasant success-shape contract | ✅ Pass | PRD Appendix A.3 — endurance-logistics/labor success shape |
| P67-006 | Add recap-line and destiny-sentence expression | ✅ Pass | Destiny sentence function + payoff success-shape metaphors + age-40 identity strengthening |
| P67-007 | Wire success-shape differentiation | ✅ Pass | All differentiation via existing expression/carrier framework — no new systems |
| P67-008 | Add targeted success-shape and recap proof | ✅ Pass | `p67-success-shape-recap-proof.md` — 5-dimension comparison proof |
| P67-009 | Add narrow regression coverage | ✅ Pass | 4 new test functions: success-shape differentiation, destiny sentence, identity shape, comparison distinction |
| P67-010 | Produce P67 closure report | ✅ Pass | This document |

**All 10 stories complete. P67 execution complete. Merchant trilogy optimization complete.**

---

## 6. Merchant Trilogy Full Arc Summary

The complete trilogy optimization sequence:

| Stage | Focus | Key Result |
|-------|-------|------------|
| **P58/P59/P61** | Bridges | Three distinct paths to the same destination (apprentice/tavern/peasant → merchant) |
| **P63** | Entry differentiation | Entrance feels different — cost labels and identity distinguish the three routes at on_ramp |
| **P64** | Pressure/payoff flavor | Middle and end have different wording per route — but structure is shared |
| **P66** | Cost differentiation | Success *feels* like it costs different things — cost persists through the journey |
| **P67** | Success shape + recap | Success *is* different shapes — each route has a distinct success metaphor and destiny sentence |

**The progression:**
1. Different paths to the same place
2. Different entrances
3. Different decoration along the way
4. Different prices paid
5. **Different kinds of success** (P67 — final layer)

Each layer builds on the previous one, and each layer is bounded and expression-only.

---

## 7. Methodology Template: How to Apply This to Future Routes

The merchant trilogy optimization sequence is a reusable template for optimizing ordinary→mixed route work. Here's the methodology:

### 7.1 The Five-Stage Optimization Sequence

**Stage 1: Bridges** (e.g., P58/P59/P61)
- Goal: Get multiple distinct paths to the same mixed destination
- Key: Each bridge must preserve origin identity and have a distinct narrative
- Validation: Bridge flags, bridge expressions, gate acceptance

**Stage 2: Entry differentiation** (e.g., P63)
- Goal: Make the entrance to the mixed path feel different per origin
- Key: Cost labels, entry identity, entry current-goal differentiation
- Validation: Entry expressions are distinct and origin-appropriate

**Stage 3: Pressure/payoff flavor** (e.g., P64)
- Goal: Add route-specific wording to the middle and end of the mixed path
- Key: Pressure-stage flavor, payoff-stage flavor — same structure, different words
- Validation: Pressure and payoff expressions differ per route

**Stage 4: Cost differentiation** (e.g., P66)
- Goal: Make success feel like it costs different things per route
- Key: Cost persistence (not just entry), payoff cost reflection, cost-weighted identity
- Validation: Cost labels persist, payoff has "success... but" structure, identity carries cost weight

**Stage 5: Success shape + recap** (e.g., P67 — this stage)
- Goal: Make success itself feel different in shape, not just flavor; add a memorable destiny sentence
- Key: Success-shape metaphors, destiny sentence/recap punchline, identity shifts from "came from" to "built through"
- Validation: Success shapes are distinct, destiny sentences exist and are memorable, cost and success shape align

### 7.2 Key Principles

1. **Bounded scope per stage** — each stage is expression-only, no new systems
2. **Build on previous layers** — each stage makes the previous layer stronger
3. **Player-visible difference** — differentiation must be in text players actually see
4. **Origin echo** — every differentiation must trace back to the origin's character
5. **Cost-success alignment** — the price should match the kind of success

### 7.3 Why This Sequence Works

The order matters:
- Bridges first (you need distinct paths before you can differentiate the experience)
- Entry next (first impressions matter most for identity)
- Flavor before cost (you need the words before you can make them mean something)
- Cost before success shape (the price makes the success feel earned in a specific way)
- Success shape last (the final layer — the payoff of all previous differentiation)

If you do success shape first, it feels hollow — because there's no cost or journey behind it. If you do cost last, it feels tacked on — because the success doesn't feel different enough yet.

---

## 8. Deferred Items

| Item | Reason Deferred |
|------|-----------------|
| Full ending framework / epilogue system | Out of bounded scope — needs dedicated ending stage |
| Mechanical success differentiation | Would require structural magnate skeleton changes |
| Route-specific failure modes | Out of scope for a success-focused stage |
| Fourth ordinary-origin bridge | Separate expansion work — not part of trilogy optimization |
| Full playtest platformization | Separate infrastructure work |
| Sample-line track reopening | Separate content pipeline work |
| Full UI recap overhaul | Out of scope — P67 is expression-only, no new UI |
| Mechanical cost differences | Expressions only per scope contract — cost is felt in text, not mechanics |
| Full lifetime comparative exhaust | Proof is targeted (payoff phase), not exhaustive — sufficient for P67 goals |

---

## 9. Commits Summary

| Commit | Description |
|--------|-------------|
| `6eea7ab` | P67-001: Add success-shape and recap strength audit |
| `4972dd0` | P67-002: Add success-shape and recap scope contract |
| `4628cd8` | P67-003/004/005: Add success-shape contracts to PRD appendix |
| `4cc56f4` | P67-006/007/009: Wire success-shape differentiation with expression and tests |
| `e612687` | P67-008: Add success-shape and recap comparison proof |

---

## 10. Final Takeaway

The merchant trilogy is now complete. What started as three bridges into one shared merchant path (P58/P59/P61) has been optimized layer by layer — entry (P63), pressure/payoff flavor (P64), cost (P66), and now success shape and recap (P67).

The result: three routes that feel like three different kinds of merchant success, not three variants of the same success. Players don't just "become a merchant" — they become a specific kind of merchant, built through their origin's strengths, paying their origin's price, and leaving with a sentence that captures their specific journey.

- **Apprentice merchants** built a craft-judgment empire — they calculated their way to success, one quality judgment at a time, and paid with craft independence
- **Tavern merchants** built a network-information empire — they wove their way to success, one connection at a time, and paid with authenticity and privacy
- **Peasant merchants** built an endurance-logistics empire — they stepped their way to success, one mile at a time, and paid with landed stability and physical ease

And each leaves with a destiny sentence worth remembering:
- 从刨子到账本，靠手艺眼光算出了一片商路
- 从酒肆到商号，靠人情网络织出了八方商路
- 从田埂到车马，靠脚力血汗踩出了一条粮路

This is the "success-shape and recap" that P65 identified as the final high-leverage layer to fix. And it's done with bounded, expression-only changes — no new systems, no scope creep, just layer upon layer of careful differentiation built on what came before.

**Merchant trilogy optimization complete.**
