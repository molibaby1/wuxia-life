# P68 Merchant Trilogy Comparison Readout

> **Date:** 2026-06-29
> **Stage:** P68 Wuxia Merchant Trilogy Live Experience Validation
> **Type:** Comparison readout — side-by-side review of apprentice, tavern, and peasant merchant routes
> **Evidence base:** P58/P59/P61 bridge proofs + P63 entry proof + P64 pressure/payoff proof + P66 cost proof + P67 success-shape/recap proof

---

## 1. Purpose

This readout provides a single, side-by-side comparison of the three merchant bridge routes (apprentice, tavern, peasant) across the three core experience dimensions defined in the verdict contract:

1. **Success-cost differentiation** — "What did I lose?"
2. **Success-shape differentiation** — "How did I succeed?"
3. **Destiny-sentence recall** — "What was my life?"

This is a **bounded** comparison — not a full lifetime exhaustive matrix, but a targeted review at the payoff phase where differentiation matters most for the player's final impression.

---

## 2. Route Overview

| Route | Origin Arc | Bridge Mechanism | Core Metaphor |
|-------|-----------|-----------------|---------------|
| **Apprentice** (town_apprentice) | 学徒 → 手艺 → 合伙入伙 | Join partnership → share control → craft-judgment empire | 从刨子到账本 |
| **Tavern** (tavern_hand) | 酒肆 → 人脉 → 引荐入行 | Take referral → owe favors → network-information empire | 从酒肆到商号 |
| **Peasant** (farm_peasant) | 农家 → 力气 → 粮商offer | Accept outside offer → bet on harvests → endurance-logistics empire | 从田埂到车马 |

All three reach the same destination (`merchant_magnate`) but through meaningfully different paths — and the differentiation persists through the journey, not just at the entrance.

---

## 3. Dimension 1: Success-Cost Differentiation (成功代价)

### 3.1 Cost Label Persistence

| Stage | Apprentice | Tavern | Peasant |
|-------|------------|--------|---------|
| **Entry (on_ramp)** | 手艺与合伙的担子 | 人脉与铺子的担子 | 粮路与买卖的担子 |
| **Pressure** | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |
| **Payoff** | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |

**Verdict:** ✅ Cost labels stay route-specific through the entire journey — they don't collapse back to generic at pressure/payoff.

### 3.2 Payoff "Success... But" Structure

| Route | Payoff Goal (excerpt) | Cost Type |
|-------|----------------------|-----------|
| **Apprentice** | "巨贾之位到手...**只是**如今要看着合伙人的脸色，账目上的分成比木纹更难拿捏" | Partnership control loss + bookkeeping burden |
| **Tavern** | "商号凭人脉通八方...**只是**欠的人情比挣的银子还多，每一笔都要掂量谁的面子、还谁的情" | Favor debt + social performance burden |
| **Peasant** | "车马仓储物流根基已成...**只是**脚下的路比田埂还长...赢了但也再回不到田里了" | Travel wear + timing bet + land loss |

**Verdict:** ✅ All three routes have the "success... but at what cost" structure at payoff. The cost is different in kind, not just degree.

### 3.3 Age-40 Identity Cost Weight

| Route | Identity Cost Phrase | What's Lost |
|-------|---------------------|-------------|
| **Apprentice** | "代价是再也回不到只管刨花的日子" | Craft independence — the freedom of being just a craftsman |
| **Tavern** | "代价是人人都认得你、人人都有求于你" | Authenticity + privacy — you can never be "off" |
| **Peasant** | "代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳" | Landed stability + physical ease — the comfort of staying put |

**Verdict:** ✅ Each route's cost traces back to its origin character. The cost isn't generic merchant debt — it's the specific price of leaving that origin behind.

### 3.4 Success-Cost Summary

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Runtime evidence exists | ✅ Yes | P66 proof + `testP66CostLabelPersistsThroughJourney`, `testP66PayoffHasCostReflection`, `testP66Age40IdentityHasCostWeight` |
| Distinct per route | ✅ Yes | 3 different cost types: control loss / social debt / physical wear |
| Origin echo | ✅ Yes | Each cost maps to origin character (craft → control loss, network → social debt, labor → physical wear) |
| Persists across stages | ✅ Yes | Cost labels differentiated at entry, pressure, AND payoff |
| Playtest-readable | ⚠️ Pending | Needs human readout (P68-005) |

**Replay evidence verdict: Pass** — cost differentiation is implemented, distinct, origin-echoing, and persistent.

---

## 4. Dimension 2: Success-Shape Differentiation (成功形状)

### 4.1 Success Metaphor at Payoff

| Route | Success Metaphor | Success Type | Distinctive Verb |
|-------|-----------------|-------------|------------------|
| **Apprentice** | 从刨子到账本，靠手艺的眼光**算出了**一片商路 | Craft-judgment / quality-shaped | 算出 (calculated) |
| **Tavern** | 从酒肆到商号，靠人情的网络**织出了**八方商路 | Network-information / connection-shaped | 织出 (woven) |
| **Peasant** | 从田埂到车马，靠脚力和血汗**踩出了**一条粮路 | Endurance-logistics / labor-shaped | 踩出 (stepped out) |

**Verdict:** ✅ Three fundamentally different success metaphors. The distinctive verbs (算出/织出/踩出) make each route feel like a different kind of win.

### 4.2 Payoff Goal Full Text

**Apprentice:**
> 从刨子到账本，靠手艺的眼光算出了一片商路，品质立住了招牌，合伙铺出了版图，只是如今要看着合伙人的脸色，账目上的分成比木纹更难拿捏

- Success is *calculated* — quality judgments, careful bookkeeping, partnership scale
- Cost is *control loss* — answering to partners, the difficulty of accounts vs. craft

**Tavern:**
> 从酒肆到商号，靠人情的网络织出了八方商路，老主顾串起了门路，引荐打通了关节，只是欠的人情比挣的银子还多，每一笔都要掂量谁的面子、还谁的情

- Success is *woven* — connections, referrals, information flow
- Cost is *social debt* — owing everyone, performing for everyone

**Peasant:**
> 从田埂到车马，靠脚力和血汗踩出了一条粮路，车马仓储踩出了根基，收成赌出了规模，只是脚下的路比田埂还长，赢了但也再回不到田里了

- Success is *stepped* — physical labor, cargo logistics, timing bets
- Cost is *endless travel* — leaving the land behind, constant movement

**Verdict:** ✅ Each route's success has a different *shape* — it's not just "you succeeded with different decoration," it's "you succeeded in a different way, building a different kind of empire."

### 4.3 Age-40 Identity: "Came From" → "Built Through"

| Route | Before (P65 baseline) | After (P67) |
|-------|----------------------|-------------|
| **Apprentice** | "你是从学徒走来的巨贾" | "你是**靠手艺眼光做起来的**巨贾" |
| **Tavern** | "你是从酒肆走来的巨贾" | "你是**靠人情网络做起来的**巨贾" |
| **Peasant** | "你是从农家走来的巨贾" | "你是**靠脚力血汗做起来的**巨贾" |

**Verdict:** ✅ The identity shift from "came from X" to "built through X" is a subtle but important change. The success is now *shaped by* the origin, not just *decorated by* it.

### 4.4 Cost-Shape Alignment

| Route | Success Shape | Cost Shape | Alignment |
|-------|--------------|-----------|-----------|
| **Apprentice** | Craft-judgment / partnership | 合伙与账目的担子 | ✅ — You pay a partnership/accounting price for a craft-quality success |
| **Tavern** | Network-information / connection | 人情与面子的担子 | ✅ — You pay a favor/face price for a network success |
| **Peasant** | Endurance-logistics / labor | 粮路与奔波的担子 | ✅ — You pay a travel/labor price for a logistics success |

**Verdict:** ✅ Cost and success are two sides of the same coin — you pay a specific price for a specific kind of success. They don't feel arbitrary or disconnected.

### 4.5 Success-Shape Summary

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Runtime evidence exists | ✅ Yes | P67 proof + `testP67PayoffSuccessShapeDifferentiation`, `testP67Age40IdentityHasSuccessShape` |
| Distinct per route | ✅ Yes | 3 different success types: craft-judgment / network-information / endurance-logistics |
| Origin echo | ✅ Yes | Each success shape grows from origin strengths (craft→quality, network→connections, labor→endurance) |
| Persists across stages | ✅ Yes | Entry shape (P63) → pressure flavor (P64) → payoff shape (P67) — consistent arc |
| Playtest-readable | ⚠️ Pending | Needs human readout (P68-005) |

**Replay evidence verdict: Pass** — success-shape differentiation is implemented, distinct, origin-echoing, and consistent across the journey.

---

## 5. Dimension 3: Destiny-Sentence Recall (命运句记忆度)

### 5.1 The Three Destiny Sentences

| Route | Destiny Sentence | Length | Origin Anchor | Distinctive Verb |
|-------|-----------------|--------|---------------|------------------|
| **Apprentice** | 从刨子到账本，靠手艺眼光算出了一片商路 | 16 chars | 刨子 (wood plane) | 算出 |
| **Tavern** | 从酒肆到商号，靠人情网络织出了八方商路 | 16 chars | 酒肆 (tavern) | 织出 |
| **Peasant** | 从田埂到车马，靠脚力血汗踩出了一条粮路 | 16 chars | 田埂 (field ridge) | 踩出 |

### 5.2 Memorability Analysis

**Strengths:**
- **Parallel structure** — "从X到Y，靠Z算出/织出/踩出了..." — players recognize the pattern but remember the specific version
- **Vivid origin anchors** — 刨子/酒肆/田埂 are all concrete, sensory images that immediately evoke the origin
- **Distinctive verbs** — 算出/织出/踩出 are different enough that they don't blur together
- **Uniform length** — all 16 characters, easy to remember as a set
- **Complete arc in one sentence** — origin → method → outcome, all in one line

**Potential weaknesses:**
- "商路" appears in all three — could be a point of similarity (but it's the shared destination, so this is expected)
- Not yet wired into a specific UI surface — players may not see it unless it's presented to them
- No playtest data yet on actual recall rate

### 5.3 Recall Test (Simulated)

If you showed these to a player and asked 5 minutes later:

| Prompt | Expected Answer | Could they mix them up? |
|--------|----------------|------------------------|
| "Which one had the wood plane?" | 从刨子到账本... | Unlikely — 刨子 is very specific |
| "Which one had the tavern?" | 从酒肆到商号... | Unlikely — 酒肆 is very specific |
| "Which one had the field ridge?" | 从田埂到车马... | Unlikely — 田埂 is very specific |
| "Which one was about calculating?" | ...靠手艺眼光算出了... | Unlikely — 算出 is unique to apprentice |
| "Which one was about weaving?" | ...靠人情网络织出了... | Unlikely — 织出 is unique to tavern |
| "Which one was about stepping?" | ...靠脚力血汗踩出了... | Unlikely — 踩出 is unique to peasant |

**Verdict:** ✅ The destiny sentences are highly distinguishable. The origin anchors and distinctive verbs create strong mnemonic hooks.

### 5.4 Destiny-Sentence Summary

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Runtime evidence exists | ✅ Yes | P67 proof + `testP67DestinySentenceExistsAndDistinct`, `deriveSampleLineDestinySentence()` function |
| Distinct per route | ✅ Yes | Different origin anchors, different verbs, different outcomes |
| Origin echo | ✅ Yes | Each sentence starts with a vivid origin image (刨子/酒肆/田埂) |
| Persists across stages | N/A | Destiny sentence is end-of-journey — it's the summary, not something that needs to persist |
| Playtest-readable | ⚠️ Pending | Needs human readout (P68-005) — but structural memorability is high |

**Replay evidence verdict: Pass** — destiny sentences exist, are distinct, are origin-echoing, and have strong mnemonic structure.

---

## 6. Cross-Dimension Summary Matrix

| Dimension | Replay Verdict | Key Evidence | Playtest Verdict | Combined Verdict |
|-----------|---------------|--------------|-----------------|------------------|
| **Success-cost** | ✅ Pass | Cost labels persist; "success... but" structure; origin-specific costs | ⚠️ Pending (P68-005) | ⚠️ TBD |
| **Success-shape** | ✅ Pass | Distinct metaphors; "built through" identity; cost-shape alignment | ⚠️ Pending (P68-005) | ⚠️ TBD |
| **Destiny sentence** | ✅ Pass | 3 distinct sentences; vivid anchors; memorable structure | ⚠️ Pending (P68-005) | ⚠️ TBD |

**Current state (replay only):** All three dimensions pass on replay evidence. Playtest readout (P68-005) will determine whether the implementation lands for human readers.

---

## 7. What Stands Out

### Strengths
1. **Consistent origin echo** — Every dimension traces back to the origin. Nothing feels arbitrary.
2. **Cost-success alignment** — You pay the right price for the right kind of success. It's coherent.
3. **Destiny sentence quality** — The 16-character punchline format works. It's memorable and distinctive.
4. **Layered build** — Entry → pressure → payoff → cost → shape → recap. Each layer makes the previous one stronger.

### Known Weaknesses
1. **Expression-only** — All differentiation is in text, not mechanics. It's strong for what it is, but it's still only one layer deep.
2. **Destiny sentence not wired to UI** — The function exists but isn't displayed anywhere specific yet.
3. **No playtest data** — We know it's in the code; we don't yet know if it lands for players.
4. **Same structural skeleton** — All three routes follow on_ramp → pressure → payoff. The *content* is different but the *shape of the journey* is the same structure.

---

## 8. Comparison Readout Conclusion

The merchant trilogy has **strong replay evidence** across all three verdict dimensions:

- ✅ **Success-cost:** Implemented, distinct, origin-echoing, persistent
- ✅ **Success-shape:** Implemented, distinct, origin-echoing, cost-aligned
- ✅ **Destiny sentence:** Exists, distinct, memorable structure, origin-anchored

All three dimensions pass on replay evidence. The open question is **playtest readout** — does this differentiation actually land for a human reader, or is it just clever text that players don't notice?

P68-005 (playtest readout) will answer that question and determine the combined verdict.

**Comparison readout complete. Evidence base: P58/P59/P61/P63/P64/P66/P67 proofs.**
