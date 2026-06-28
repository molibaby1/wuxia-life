# P71 Selected Next Route Bridge Closure Report

> **Date:** 2026-06-29
> **Stage:** P71 Wuxia Selected Next Route Playable Bridge
> **Story:** P71-007 — Produce P71 closure report
> **Selected Route:** `jianghu_renown_sage` (江湖名宿, mainstream tier)
> **Origin:** `tavern_hand` (酒肆跑堂, ordinary tier)
> **Bridge:** Ally-Network Midlife Bridge — `tavern_hand` + `ally_network` → midlife bridge event → `tavern_renown_bridge_crossed` → `jianghu_renown_sage`

---

## 1. Executive Summary

P71 has successfully closed the **playable bridge** from `tavern_hand` origin to `jianghu_renown_sage` mainstream-tier route. The bridge is runtime-reachable, player-visible, verifiably connected to the target gate, and covered by regression tests.

**Result:** ✅ Bridge is closed. P72 (entry differentiation) can proceed.

**What was built:**
- 1 new midlife event (`ordinary_tavern_midlife_renown_bridge`, age 29)
- 2 new flags (`tavern_renown_bridge_crossed`, `route_renown_committed`)
- 3 expression branches (currentGoal, lifeMemory, summary)
- 1 targeted proof document (11 chain nodes)
- 1 regression test file (15 assertions)
- 0 new systems, 0 new frameworks, 0 new UI components

---

## 2. Wiring Summary

### 2.1 Bridge Event

**File:** `src/data/lines/ordinary-origin-midlife.json`

**Event ID:** `ordinary_tavern_midlife_renown_bridge`

| Property | Value |
|----------|-------|
| Origin | `tavern_hand` |
| Age | 29 |
| Condition | `ally_network && !ordinary_tavern_midlife_done` |
| Title | 江湖名号 |

**Choices:**

| Choice | Label | Flags Set | Stat Effects |
|--------|-------|-----------|-------------|
| `embrace_renown` | 踏入江湖 | `tavern_midlife_renown_bridge`, `tavern_embrace_renown`, `route_renown_committed`, `tavern_renown_bridge_crossed`, `ordinary_tavern_midlife_done` | reputation +5, connections +4, martialPower +3 |
| `stay_in_tavern` | 留在酒肆 | `tavern_midlife_renown_bridge`, `tavern_stay_in_tavern`, `ordinary_tavern_midlife_done` | charisma +2 |

### 2.2 Checkpoint Flags

| Flag | Purpose |
|------|---------|
| `tavern_renown_bridge_crossed` | Primary bridge checkpoint — indicates the player has crossed into the renown path |
| `route_renown_committed` | Route-level commitment flag (analogous to `route_wealth_committed` for merchant) |

### 2.3 Target Gate Connection

**Target gate:** `jianghu_renown_sage` (in `wuxiaOriginSurfaces.ts:374-383`)

**How the bridge connects:**
- **key_choices dimension:** `ally_network` flag (set in childhood from `ordinary_tavern_network_fork` → `track_guests`) satisfies `anyOfFlags: ['mentor_bond', 'ally_network']`
- **Stats dimensions:** Bridge event provides small bonuses (reputation +5, connections +4, martialPower +3); full stat thresholds are downstream spine concerns
- **The bridge provides the playable path** — the event-driven "cross the bridge" narrative from ordinary origin, not just habit-led sim flag setting

### 2.4 Mutual Exclusivity

Mechanism: `ordinary_tavern_midlife_done` lock flag

- Merchant bridge fires first (age 27)
- Renown bridge fires second (age 29)
- Both check `!ordinary_tavern_midlife_done`
- Both choices (accept + decline) set `ordinary_tavern_midlife_done`
- Result: whichever fires first locks the other out

**Note on decline path:** If the player declines the merchant bridge at age 27, `ordinary_tavern_midlife_done` is still set, so the renown bridge at 29 does NOT fire. This is acceptable for P71 (bridge-only stage); refinement can happen in P72+ if needed.

---

## 3. Expression Summary

**File:** `src/p56/ordinaryOriginExpression.ts`

### 3.1 Current Goal

**Branch:** `tavern_renown_bridge_crossed` → "江湖上渐渐有了名声，常有人来寻你引荐"

Priority order in `tavernCurrentGoal()`:
1. `tavern_renown_bridge_crossed` (new — highest priority)
2. `tavern_merchant_bridge_crossed`
3. `tavern_midlife_guest_regulars`
4. ... rest

### 3.2 Life Memory

**Branch:** `tavern_renown_bridge_crossed` → "你凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号。人们不是来找你喝酒，是来寻你引荐、求你主事。"

Priority order in `tavernLifeMemory()`:
1. `tavern_renown_bridge_crossed` (new — highest priority)
2. `tavern_merchant_bridge_crossed`
3. `tavern_midlife_guest_regulars`
4. ... rest

### 3.3 Summary

**Branch:** `tavern_renown_bridge_crossed` → "酒肆出身的江湖人物：靠人脉和名声在江湖上立足"

Priority order in `deriveOrdinaryOriginSummary()` for tavern_hand:
1. `tavern_renown_bridge_crossed` (new — highest priority)
2. `tavern_merchant_bridge_crossed`
3. `tavern_midlife_guest_regulars || tavern_midlife_ally_referral`
4. fallback

### 3.4 Identity Preservation

`detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge crossing. The bridge adds a route on top of the origin — it does NOT change the origin. All expression text reads as "tavern hand who became jianghu renown through their network," not "generic jianghu renown person."

---

## 4. Proof & Tests Summary

### 4.1 Targeted Proof

**File:** `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md`

All 11 chain nodes verified:

| # | Node | Status |
|---|------|--------|
| 1 | Origin identity | ✅ |
| 2 | Pre-bridge seed (ally_network) | ✅ |
| 3 | Bridge event trigger | ✅ |
| 4 | Bridge checkpoint (accept path) | ✅ |
| 5 | Bridge decline path | ✅ |
| 6 | Current goal expression | ✅ |
| 7 | Life memory expression | ✅ |
| 8 | Summary expression | ✅ |
| 9 | Origin identity preserved | ✅ |
| 10 | Composite gate key_choices satisfied | ✅ |
| 11 | Mutual exclusivity with merchant bridge | ✅ |

**Proof method:** Runtime evaluation via `ConditionEvaluator` + `ordinaryOriginExpression.ts` functions — not static fixture-only.

### 4.2 Regression Tests

**File:** `tests/p71TavernHandRenownBridgeTests.ts`

15 assertions covering:

| Category | Assertions |
|----------|-----------|
| Bridge flag chain | 1 |
| Prerequisite enforcement | 3 |
| Current goal expression | 1 |
| Life memory expression | 1 |
| Summary expression | 1 |
| Origin preservation | 1 |
| Life memory summary integration | 1 |
| Decline path | 1 |
| Mutual exclusivity (merchant → renown) | 1 |
| Mutual exclusivity (renown → merchant) | 1 |
| Non-target isolation (peasant + apprentice) | 1 |
| Composite gate key_choices | 1 |
| Existing merchant bridge regression | 1 |
| **Total** | **15** |

### 4.3 Existing Test Suites (No Regressions)

| Suite | Status |
|-------|--------|
| `p56OrdinaryOriginGrowthTests` | ✅ Pass |
| `p58ApprenticeBridgeTests` | ✅ Pass |
| `p59TavernHandBridgeTests` | ✅ Pass |
| `p61FarmPeasantBridgeTests` | ✅ Pass |
| `testLifeMemorySummary` | ✅ Pass |
| Typecheck | ✅ Pass |

---

## 5. P71 / P72 Boundary

### What P71 Delivers (Done)

- ✅ Playable bridge from tavern_hand to jianghu_renown_sage
- ✅ Bridge checkpoint flags (tavern_renown_bridge_crossed + route_renown_committed)
- ✅ Player-visible expression on 3 surfaces
- ✅ Tavern_hand identity preserved after crossing
- ✅ Mutual exclusivity with merchant bridge
- ✅ ally_network satisfies composite gate key_choices
- ✅ Targeted proof covering all 11 chain nodes
- ✅ Narrow regression tests (15 assertions)
- ✅ No regressions in existing test suites

### What P72 Will Deliver (Next)

P72 is the **entry differentiation** stage. It will add:

| Item | Description |
|------|-------------|
| Renown on-ramp spine event | First renown-specific event after bridge crossing (age 30-34) |
| Entry flavor text | Make the renown entry feel distinct from merchant entry |
| Cost label | "江湖声名之累" or similar (if spine includes pressure) |
| Full stat progression | Ensure skill_growth/reputation/social_capital reach gate thresholds |
| Entry differentiation tests | Verify renown entry feels different from merchant |
| Extended proof | From bridge crossing → gate acceptance (full stat chain) |

P72 will determine whether full renown route implementation is worth pursuing. P71 just confirms the bridge is closed.

---

## 6. Deferred Items

The following are explicitly deferred to later stages:

| Item | Stage | Rationale |
|------|-------|-----------|
| Renown spine events (on_ramp / pressure / payoff) | P72+ | Bridge stage only — no spine |
| Entry densification | P72+ | Not a bridge concern |
| Cost differentiation | P74+ | Later differentiation stage |
| Success-shape / destiny sentence | P75+ | Late-stage concern |
| Full stat threshold verification | P72+ | Downstream spine concern |
| Full lifetime sim | — | Out of scope for bounded bridge |
| Browser / UI verification | — | No new UI surfaces |
| Mentor-bond bridge direction | Future cycle | Second renown bridge, zero existing infrastructure |
| Farm_peasant renown bridge | Future cycle | Additional origin |
| Town_apprentice renown bridge | Future cycle | Additional origin |
| Reputation economy / faction system | Platform-level | Way beyond scope |
| Refinement: decline merchant → renown offer | P72+ | Current design: ordinary_tavern_midlife_done locks both |

---

## 7. Files Changed

| File | Change |
|------|--------|
| `src/data/lines/ordinary-origin-midlife.json` | Added `ordinary_tavern_midlife_renown_bridge` event (1 event, 2 choices) |
| `src/p56/ordinaryOriginExpression.ts` | Added 3 renown bridge branches (currentGoal, lifeMemory, summary) |
| `tests/p71TavernHandRenownBridgeTests.ts` | New test file with 15 assertions |
| `docs/test-reports/p71-selected-route-bridge-implementation-audit.md` | P71-001: Implementation delta audit |
| `docs/test-reports/p71-selected-route-bridge-scope-contract.md` | P71-002: Scope contract |
| `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md` | P71-005: Targeted proof (11 chain nodes) |
| `docs/PRD/p71-wuxia-selected-next-route-playable-bridge.prd.json` | PRD JSON with pass/fail tracking |
| `progress.txt` | Progress log updates |

**Total runtime code changes:** ~50 lines of JSON + ~15 lines of TypeScript

---

## 8. Closure Criteria Verification

Per `docs/test-reports/p70-p71-validation-shape.md` §6, P71 is successful when ALL 10 criteria are met:

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Bridge is runtime-reachable from tavern_hand origin with ally_network | ✅ |
| 2 | Bridge checkpoint flags set on embrace choice | ✅ |
| 3 | Bridge is player-visible on all 3 expression surfaces | ✅ |
| 4 | Tavern_hand identity preserved after bridge crossing | ✅ |
| 5 | Mutual exclusivity with merchant bridge works correctly | ✅ |
| 6 | ally_network satisfies jianghu_renown_sage gate's key_choices | ✅ |
| 7 | No regressions: P56, P58, P59, P61, lifeMemorySummary all pass | ✅ |
| 8 | Typecheck passes | ✅ |
| 9 | Targeted proof document covers all required chain nodes | ✅ |
| 10 | Closure report summarizes everything accurately | ✅ (this document) |

**Result:** 10/10 criteria met. ✅ P71 bridge is closed.

---

## 9. Handoff to P72

P72 (entry differentiation) can proceed with confidence. The bridge is solid, well-tested, and follows the same pattern as the merchant trilogy bridges (P58/P59/P61). P72 should focus on:

1. Adding the renown on-ramp spine event (first post-bridge content)
2. Making the renown entry feel distinct from merchant entry
3. Ensuring full stat progression reaches gate thresholds
4. Verifying the full chain from bridge → gate acceptance (with stats)

**Recommendation:** Proceed to P72. The bridge foundation is strong.

---

**P71-007 complete.** Closure report saved.
