# P66 Success-Cost Differentiation Targeted Proof

> **Date:** 2026-06-28
> **Stage:** P66 Wuxia Merchant Trilogy Success-Cost Differentiation
> **Story:** P66-008 — Targeted success-cost comparison proof
> **Type:** Proof artifact — runtime-grounded comparison of cost differentiation across the three merchant routes

---

## 1. Purpose

This proof artifact demonstrates that the three merchant bridge routes (apprentice, tavern, peasant) now pay meaningfully different prices for success — not just different flavor text, but different *kinds* of cost that echo their respective origin paths.

This is not a full lifetime comparative exhaust. It's a targeted comparison at the payoff phase, where cost matters most for the "what did I give up for this success" feeling.

---

## 2. Comparison Framework

### 2.1 Comparison Point
All three routes are compared at **magnate payoff** (the top of the merchant chain), with:
- Bridge origin flag set (apprentice/tavern/peasant)
- `magnate_on_ramp_done` = true
- `magnate_midlife_pressure_done` = true
- `magnate_payoff_done` = true
- Age 44 (post-payoff)

### 2.2 Comparison Dimensions
1. **Cost label** — the "burden" label shown to the player
2. **Current goal text** — the payoff-phase goal expression (where cost should echo)
3. **Age-40 identity** — the identity statement (where cost should carry weight)

### 2.3 Distinctiveness Test
For each dimension, we verify:
- All three routes produce different text
- Each route's text contains its distinctive cost keywords
- No raw flag keys leak into player-facing text
- The cost type matches the route's contract (apprentice = partnership/control, tavern = favor/network, peasant = labor/bet)

---

## 3. Side-by-Side Comparison

### 3.1 Cost Label at Payoff

| Route | Cost Label | Cost Type | Distinctive Keywords |
|-------|-----------|-----------|---------------------|
| **Apprentice** | 合伙与账目的担子 | Partnership / accountability | 合伙, 账目 |
| **Tavern** | 人情与面子的担子 | Favor / social debt | 人情, 面子 |
| **Peasant** | 粮路与奔波的担子 | Labor / travel burden | 粮路, 奔波 |

**Distinctiveness:** All three labels are different (Set size = 3). Each label maps to its contract's primary cost type.

### 3.2 Current Goal at Payoff (Cost Reflection)

**Apprentice payoff goal:**
> 巨贾之位到手，供货销路尽在掌握，只是当年的手艺人如今要看合伙人的脸色，账目上的分成比刨子上的木纹更难拿捏

- Cost type: **Partnership control loss + bookkeeping burden**
- Distinctive keywords: 合伙人的脸色, 账目, 分成, 刨子, 木纹
- Echoes origin: 手艺人 (craftsman identity), 合伙 (partnership path)
- "Success but at what cost" feeling: ✅ — the first half is success, the second half ("只是...") is the cost

**Tavern payoff goal:**
> 商号凭人脉通八方，老主顾遍布各行，只是欠的人情比挣的银子还多，每一笔生意都要掂量谁的面子、还谁的情

- Cost type: **Favor debt + social performance burden**
- Distinctive keywords: 欠的人情, 掂量, 面子, 还谁的情
- Echoes origin: 人脉 (network path), 老主顾 (familiar guests)
- "Success but at what cost" feeling: ✅ — success is "通八方/遍布各行", cost is "欠的人情比挣的银子还多"

**Peasant payoff goal:**
> 车马仓储物流根基已成，泥腿子熬出了头，只是脚下的路比田埂还长，每一步都赌过收成、押过季节，赢了但也再回不到田里了

- Cost type: **Travel wear + timing bet + land loss**
- Distinctive keywords: 赌过收成, 押过季节, 回不到田里, 田埂, 脚下的路
- Echoes origin: 泥腿子 (peasant identity), 车马仓储 (cargo path)
- "Success but at what cost" feeling: ✅ — success is "熬出了头/根基已成", cost is "再回不到田里了" + the bet-weight of every step

### 3.3 Age-40 Identity with Cost Weight

**Apprentice age-40 identity:**
> 你是从学徒走来的巨贾：手艺为基，合伙为径，商路是技能延伸的版图，代价是再也回不到只管刨花的日子

- Cost phrase: 代价是再也回不到只管刨花的日子
- Cost type: **Lost craft independence**
- Ties to origin: 学徒, 手艺, 刨花 (woodworking craft imagery)

**Tavern age-40 identity:**
> 你是从酒肆走来的巨贾：人脉为基，引荐为径，商路是人情往来的延伸，代价是人人都认得你、人人都有求于你

- Cost phrase: 代价是人人都认得你、人人都有求于你
- Cost type: **Social entrapment**
- Ties to origin: 酒肆, 人脉, 引荐 (network/referral path)

**Peasant age-40 identity:**
> 你是从农家走来的巨贾：力气为基，跑商为径，商路是勤劳致富的通道，代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳

- Cost phrase: 代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳
- Cost type: **Lost land + endless travel**
- Ties to origin: 农家, 力气, 田埂, 一亩三分地 (peasant/land imagery)

---

## 4. Proof Validation

### 4.1 Test Coverage
All assertions below are verified by `tests/p50SampleLineExpressionTests.ts`:

| Test Function | What It Verifies | Status |
|--------------|-----------------|--------|
| `testP66CostLabelPersistsThroughJourney` | Cost labels are differentiated at on_ramp, pressure, AND payoff (not just entry) | ✅ Pass |
| `testP66PayoffHasCostReflection` | Payoff goals contain route-specific cost reflection keywords | ✅ Pass |
| `testP66Age40IdentityHasCostWeight` | Age-40 identities include "代价" and route-specific cost language | ✅ Pass |
| `testP66CostDistinctionComparison` | All three routes produce meaningfully different cost signals at payoff | ✅ Pass |

### 4.2 Regression Safety
Existing P63 + P64 tests continue to pass:
- `testP63ApprenticeBridgeEntryDifferentiation` — ✅ Pass
- `testP63TavernBridgeEntryDifferentiation` — ✅ Pass
- `testP63PeasantBridgeEntryDifferentiation` — ✅ Pass
- `testP63BridgeEntryDistinction` — ✅ Pass
- `testMagnatePressurePayoffDifferentiation` — ✅ Pass

### 4.3 Player-Visibility Check
All expressions pass the `isPlayerVisibleSampleLineText` check — no raw flag keys leak.

---

## 5. Three Kinds of Pain, Three Kinds of Success

This is the core proof: each route's success has a *different flavor of cost* that echoes its origin:

| Dimension | Apprentice Pain | Tavern Pain | Peasant Pain |
|-----------|----------------|-------------|--------------|
| **Core cost** | Losing control / sharing power | Owing everyone / being known | Endless travel / leaving the land |
| **Metaphor** | "刨花的木纹" → "账目上的分成" | "人脉通八方" → "欠的人情比银子多" | "田埂" → "脚下的路比田埂还长" |
| **What's lost** | Craft independence | Authenticity / privacy | Landed stability |
| **Success + cost structure** | "巨贾之位到手...只是...要看合伙人的脸色" | "商号凭人脉通八方...只是...欠的人情比挣的银子还多" | "熬出了头...只是...赢了但也再回不到田里了" |
| **Cost label** | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |
| **Identity代价** | 再也回不到只管刨花的日子 | 人人都认得你、人人都有求于你 | 再也回不到守着一亩三分地的安稳 |

The "只是..." (but...) structure is key — it turns success into "success with a price," making the cost feel earned rather than decorative.

---

## 6. Support for P67 (Next Stage)

This proof directly supports P67's success-shape / recap-line work:

1. **Cost foundation is laid** — P67's destiny sentence / recap can now reference route-specific costs, not just route-specific successes
2. **"But" pattern is established** — the "success + cost" pattern (成功...只是...) creates a natural rhythm for end-of-life recap
3. **Three distinct pain points are clear** — P67's ending punchline can hit harder because players will already have felt the cost throughout the journey
4. **Keywords are reusable** — 刨花/账目, 人情/面子, 田埂/奔波 — these are memorable phrases that can echo in final summaries

---

## 7. Limitations of This Proof

This is a **targeted** proof, not a full exhaust:

- ✅ Cost differentiation at payoff phase is clearly demonstrated
- ✅ Three routes have meaningfully different cost types
- ✅ Cost echoes origin path (not generic merchant debt)
- ⚠️ Full lifetime trajectory not exhaustively compared (on_ramp → pressure → payoff cost label progression is tested, but not every intermediate step)
- ⚠️ No playtest data — this is runtime-grounded but not player-tested
- ⚠️ Cost is expression-only — no mechanical difference in how burden accumulates (intentional per P66 scope)
