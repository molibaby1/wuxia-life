# P68 Merchant Trilogy Experience Verdict Contract

> **Date:** 2026-06-29
> **Stage:** P68 Wuxia Merchant Trilogy Live Experience Validation
> **Type:** Verdict contract — fixed dimensions and judgment rules for merchant trilogy player experience

---

## 1. Purpose

This contract defines the fixed player-facing dimensions and pass/warning/fail judgment rules for evaluating the merchant trilogy (apprentice, tavern, peasant routes). It ensures consistency across all three routes and explains how replay evidence and human-readable playtest evidence combine into one verdict.

This verdict contract is the evaluation framework for P68 — it defines what "player-validated" means for the merchant trilogy.

---

## 2. Three Fixed Experience Dimensions

The merchant trilogy is evaluated on three fixed player-facing dimensions. These correspond to the three core questions from the PRD:

> - 我是怎么成功的 (success shape)
> - 我为了这种成功失去了什么 (success cost)
> - 我这局最后是什么命 (destiny sentence recall)

### 2.1 Dimension 1: Success-Cost Differentiation (成功代价)

**What it measures:** Whether players feel that the three routes pay *different kinds of prices* for success, not just different flavor text.

**Key signals:**
- Cost labels persist across stages (not just at entry)
- Payoff phase has "success... but at what cost" structure
- Age-40 identity carries cost weight
- Cost type matches origin character (apprentice = control loss, tavern = social debt, peasant = physical wear)

**Why it matters:** If success feels the same across routes, the differentiation is decorative, not meaningful.

### 2.2 Dimension 2: Success-Shape Differentiation (成功形状)

**What it measures:** Whether players feel that the three routes succeed in *different shapes* — not just "became a merchant with X background" but "became this specific kind of successful person."

**Key signals:**
- Success metaphors are distinct per route (craft-judgment vs network-information vs endurance-logistics)
- Payoff framing emphasizes different success mechanisms
- Age-40 identity frames success as "built through" origin strengths, not just "came from" origin
- Success shape aligns with cost shape (two sides of the same coin)

**Why it matters:** If success shape is the same, the trilogy feels like one path with three skins, not three different lives.

### 2.3 Dimension 3: Destiny-Sentence Recall (命运句记忆度)

**What it measures:** Whether each route has a short, memorable, one-sentence summary that players can walk away with — a "destiny sentence" that captures the specific arc of that route.

**Key signals:**
- Destiny sentence exists for each route
- Sentences are structurally parallel but meaningfully distinct
- Each sentence anchors to a vivid origin image
- Each sentence uses a distinctive verb
- Sentence length is short enough to remember (≤20 characters)

**Why it matters:** The destiny sentence is the "takeaway" — if players can't remember the difference in one sentence, the differentiation probably isn't landing.

---

## 3. Pass / Warning / Fail Judgment Rules

Each dimension receives one of three verdicts: **pass**, **warning**, or **fail**.

### 3.1 Pass Criteria

A dimension **passes** if all of the following are true:

1. **Runtime evidence exists:** The differentiation is implemented in player-visible text (verified via tests or replay)
2. **Distinct per route:** All three routes have meaningfully different expressions, not just synonym swaps
3. **Origin echo:** The differentiation traces back to the route's origin character (apprentice craft, tavern network, peasant labor)
4. **Persists across stages:** The differentiation is not just at entry — it carries through pressure and/or payoff
5. **Playtest-readable:** A human reviewer can identify the difference without reading the code

### 3.2 Warning Criteria

A dimension receives **warning** if any of the following are true:

1. **Implemented but thin:** Differentiation exists but is weak — it's there but might not be noticed by a casual player
2. **Entry-only:** Differentiation is strong at entry but thins out at pressure/payoff
3. **Partial coverage:** Two routes are strong, one is weaker
4. **Evidence mixed:** Runtime evidence says yes but playtest readout is uncertain
5. **Origin echo weak:** Differentiation exists but doesn't strongly trace back to origin character

**Warning means:** The feature is there but could be stronger. It doesn't block transfer readiness, but it should be noted as a known weakness.

### 3.3 Fail Criteria

A dimension **fails** if any of the following are true:

1. **Not implemented:** No runtime differentiation exists for this dimension
2. **Not distinct:** All three routes read as essentially the same on this dimension
3. **Not player-visible:** Differentiation exists in flags/data but doesn't surface in text players see
4. **No origin connection:** Differentiation is arbitrary — doesn't match the route's origin character
5. **Playtest can't tell:** A human reviewer cannot distinguish the three routes on this dimension

**Fail means:** This dimension is not delivering on its promise. It would block transfer readiness unless addressed.

---

## 4. Evidence Combination: Replay + Playtest

P68 uses two kinds of evidence, and they combine as follows:

### 4.1 Replay Evidence (结构性证据)

**Source:** Test suites, replay output, proof documents, expression code review

**What it tells us:**
- Whether differentiation exists in the runtime
- Whether it's distinct across routes
- Whether it persists across stages
- Whether it traces to the right flags/markers

**Strength:** Definitive — if tests say it's there, it's there.

**Weakness:** Doesn't tell us if players actually *notice* or *feel* the difference.

### 4.2 Human-Readable Playtest Evidence (感知性证据)

**Source:** Playtest-style readout (simulation-assisted, protocol-based review)

**What it tells us:**
- Whether a human reader can tell the routes apart
- Whether the differences feel meaningful vs decorative
- Whether the destiny sentence is memorable
- Whether the "success... but at what cost" feeling lands

**Strength:** Player-facing — closer to real player experience than code review.

**Weakness:** Subjective — depends on reviewer; small sample size.

### 4.3 Combination Rules

The two evidence types combine into a single verdict per dimension:

| Replay Evidence | Playtest Evidence | Combined Verdict |
|-----------------|-------------------|------------------|
| Pass | Pass | **Pass** |
| Pass | Warning | **Warning** |
| Pass | Fail | **Warning** (implementation exists but doesn't land — needs expression tuning) |
| Warning | Pass | **Warning** |
| Warning | Warning | **Warning** |
| Warning | Fail | **Fail** |
| Fail | Pass | **Warning** (playtest says it works but we can't verify why — needs investigation) |
| Fail | Warning | **Fail** |
| Fail | Fail | **Fail** |

**Key principle:** Replay evidence is the floor (if it's not in the code, it's not real). Playtest evidence is the ceiling (if it's in the code but players don't feel it, it doesn't count fully).

---

## 5. Overall Trilogy Verdict

The three dimensions roll up into an overall merchant trilogy verdict:

### 5.1 Overall Pass

**All three dimensions pass.**

Meaning: The merchant trilogy is player-validated — players can tell the three routes apart, they feel different costs and different success shapes, and each has a memorable destiny sentence. The methodology is ready to transfer.

### 5.2 Overall Warning

**One or two dimensions are warning; none are fail.**

Meaning: The trilogy is substantially player-validated but has known weak spots. Transfer readiness is possible but with caveats — the weak dimensions should be noted as things to watch when applying the methodology to the next route.

### 5.3 Overall Fail

**Any dimension fails.**

Meaning: The trilogy is not yet player-validated on at least one core dimension. Transfer readiness is blocked — the failing dimension needs to be addressed before the methodology can be confidently applied elsewhere.

---

## 6. Transfer-Readiness Threshold

The methodology is **transfer-ready** if:

1. **Overall verdict is pass or warning** (no fails)
2. **At least 2 of 3 dimensions pass**
3. **The failing-if-any dimension is warning, not fail**
4. **The weak spots are documented and understood**

If transfer-ready, the closure report will:
- State that the methodology is ready to transfer
- Specify the minimum stage order that must be preserved
- List known warning areas to watch in the next route

If not transfer-ready, the closure report will:
- State which dimension(s) fail
- Identify whether the blocker is validation weakness or content weakness
- Recommend what needs to happen before re-evaluation

---

## 7. Application Protocol

When applying this verdict contract:

1. **Start with replay evidence** — review tests, proofs, and replay output for each dimension
2. **Then do playtest readout** — apply the human-readable review protocol
3. **Combine per dimension** — use the combination rules from §4.3
4. **Roll up to overall** — use the overall verdict rules from §5
5. **Judge transfer readiness** — apply the threshold from §6
6. **Document everything** — record evidence, reasoning, and verdict in the readout and closure report

---

## 8. Summary

| Dimension | Question | Pass if |
|-----------|----------|---------|
| Success-cost | "What did I lose?" | Cost feels different per route, persists through journey |
| Success-shape | "How did I succeed?" | Success feels like different shapes, not just flavors |
| Destiny sentence | "What was my life?" | Each route has a memorable one-sentence summary |

| Overall Verdict | Condition | Transfer Ready? |
|-----------------|-----------|-----------------|
| Pass | All 3 dimensions pass | ✅ Yes |
| Warning | 1–2 warnings, 0 fails | ⚠️ Yes, with caveats |
| Fail | Any dimension fails | ❌ No — blocked |

**Verdict contract complete. This is the evaluation framework for P68.**
