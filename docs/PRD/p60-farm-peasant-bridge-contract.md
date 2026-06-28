# P60 Farm-Peasant Bridge Contract

> **Stage:** P60 farm-peasant bridge design-first wave
> **Origin:** `farm_peasant` (普通农户, ordinary tier)
> **Target:** `merchant_magnate` (巨贾行商, mixed tier) via P55 magnate chain
> **Bridge type:** Grain-merchant adjacent — labor → commodity trade → magnate

---

## 1. Downstream Target Selection (US-004)

### 1.1 Chosen Target: Merchant-Adjacent via Grain/Commodity Trade

**Target:** `merchant_magnate` mixed destiny, via the existing P55 magnate chain (`magnate_on_ramp` → `magnate_midlife_pressure` → `magnate_payoff`).

**Entry path:** Peasant enters trade through physical labor on grain/commodity caravans, then gradually moves into small-scale trading.

### 1.2 Why Merchant-Adjacent Over Other Options

#### Why not jianghu_renown_sage (renown-adjacent)?

1. **No downstream event chain:** `jianghu_renown_sage` exists only as a profile-level mixed destiny outcome. There is no sample-line spine event chain for it, unlike `merchant_magnate` which has the complete P55 magnate chain.

2. **Scope would explode:** Building a jianghu-renown event chain for peasant would not be a "bridge" — it would be a full new content track. That belongs to a separate stage, not a bounded bridge design.

3. **Missing skill foundation:** `jianghu_renown_sage` requires `skill_growth ≥ 45`. Peasant origin has zero martial training infrastructure. An escort/guard angle could work narratively, but systemically there's nothing to plug into.

#### Why not "hard-wire merchant magnate" directly?

We are NOT just adding `route_wealth_committed` to `peasant_accept_outside` and calling it done. That would cause:

1. **Identity collapse:** The peasant origin would become "merchant with extra steps" — the rural/labor identity would be erased by the merchant path.

2. **Narrative hollow:** "去镇上试试" cannot credibly skip to "巨贾之路" — there's a missing skill-building and relationship-building phase.

3. **Precedent danger:** If every ordinary origin just slaps `route_wealth_committed` on a midlife choice, why have separate origins at all?

Instead, we are doing the same disciplined approach as P58 (apprentice) and P59 (tavern_hand):
- Peasant-specific bridge flag
- Peasant-flavored narrative framing
- Peasant-distinct entry point (physical labor + grain trade, not craft skill or social network)
- Identity preservation through expression

### 1.3 Why This Is Better Than Forcing Merchant Magnate

| Aspect | "Hard-wire" approach | Contract approach (this doc) |
|--------|---------------------|------------------------------|
| Bridge flag | Generic `route_wealth_committed` only | `peasant_merchant_bridge_crossed` + `route_wealth_committed` |
| Narrative framing | Vague "去镇上试试" → merchant | Specific "粮商找帮工" → grain trade → merchant |
| Identity | Peasant disappears into generic merchant | "农家出身的粮货商人" — peasant background visible |
| Expression | No peasant-specific bridge text | 3 surfaces × peasant bridge branches |
| Gate expansion | Would need to figure out from scratch | Follows P58/P59 proven pattern |

### 1.4 New Seed: Minimal Increment, Not New System

The bridge requires exactly **one minimal new seed layer**:

- **What changes:** The `ordinary_peasant_midlife_outside_offer` event's prompt and option text are reframed from generic "去镇上试试" to grain-trade-specific "粮商找帮工"
- **What doesn't change:** Event structure, age band, condition logic, flag pattern — all follow existing midlife event shape
- **New flags:** `peasant_merchant_bridge_crossed` (bridge-specific tracking flag) + `route_wealth_committed` (existing merchant-route gate flag)

This is a **content-level reframing + bridge flag addition**, not a new system. The event carrier, the gate pattern, the expression pattern, and the downstream chain are all reused.

---

## 2. Bridge Contract (US-005)

### 2.1 Minimal Prerequisite Group

The bridge fires only when the following peasant signals have accumulated:

| Step | Flag | Source | Age | Role |
|------|------|--------|-----|------|
| 1 | `origin_farm_peasant` | Origin selection | 0 | Origin identity |
| 2 | `peasant_swap_crew_curiosity` | Childhood fork `ordinary_peasant_plow_fork` → `join_swap_crew` | 10–14 | Wanderlust seed + exposure to outside life |
| 3 | `peasant_midlife_outside_offer` | Midlife event `ordinary_peasant_midlife_outside_offer` | 30 | Bridge opportunity presents (grain merchant offer) |
| 4 | `peasant_accept_outside` | Choice: accept the grain-trade offer | 30 | Bridge checkpoint (commit to leaving village for trade work) |

**Minimum prerequisite set:** `origin_farm_peasant` + `peasant_swap_crew_curiosity` + `peasant_midlife_outside_offer` + `peasant_accept_outside`

The `peasant_refuse_outside` path does NOT cross the bridge — it stays in ordinary peasant identity (either steadfast-field or refused-outside variant).

### 2.2 Bridge Checkpoint

**Checkpoint flag:** `peasant_merchant_bridge_crossed`

**Set by:** `ordinary_peasant_midlife_outside_offer` → `accept_offer` option (text reframed to grain-trade context)

**What it means:** The peasant accepts the grain merchant's offer to work as a cargo handler, crossing from village farm life into a trade-adjacent livelihood. From this point, the grain-trade path gradually leads into the magnate chain.

**Flags set at checkpoint:**
1. `peasant_merchant_bridge_crossed` — bridge-specific tracking flag
2. `route_wealth_committed` — connects to existing `merchant_magnate` mixed destiny gate

**Bridge flag role in downstream gates:**
- Satisfies the **route flag condition** in `magnate_on_ramp` gate (alongside `apprentice_merchant_bridge_crossed`, `tavern_merchant_bridge_crossed`, etc.)
- Satisfies the **milestone flag condition** in `magnate_on_ramp` gate
- Satisfies both conditions in `merchant_midlife_debt_milestone` gate
- Triggers bridge-specific expression on existing surfaces

### 2.3 Minimal New Event / Choice / Flag Additions

#### Configuration Changes (Runtime — for P61 implementation)

| Change | File | Nature |
|--------|------|--------|
| Reframe `ordinary_peasant_midlife_outside_offer` prompt + option text | `ordinary-origin-midlife.json` | Content reframing only — no structural change |
| Add `route_wealth_committed` + `peasant_merchant_bridge_crossed` to `accept_offer` flags | `ordinary-origin-midlife.json` | 2 flags added to existing option |
| Add `peasant_merchant_bridge_crossed` to `magnate_on_ramp` gate conditions (both route + milestone) | `sample-lines-spine.json` | Gate expression expansion — follows P58/P59 pattern |
| Add `peasant_merchant_bridge_crossed` to `merchant_midlife_debt_milestone` gate conditions | `sample-lines-spine.json` | Same pattern |

#### Expression Additions (Runtime — for P61 implementation)

| Surface | New Branch | Approximate Text (design only) |
|---------|------------|--------------------------------|
| `peasantCurrentGoal()` | Bridge-crossed state | "跟着粮商走南闯北，粮路渐宽" |
| `peasantLifeMemory()` | Bridge-crossed state | "你从田间走到粮路上，从帮工做起，渐渐摸通了粮货买卖。" |
| `deriveOrdinaryOriginSummary()` | Peasant-merchant branch | "农家出身的粮货商人：从田埂到粮路，靠体力和勤恳踏出生意路。" |

**Total additions:**
- 0 new event IDs (existing event reframed)
- 0 new choice structures (existing options repurposed)
- 2 new flags (`peasant_merchant_bridge_crossed`, plus `route_wealth_committed` which already exists)
- 3 expression branches (1 per surface)

This is **minimal scope** — comparable to P58 apprentice bridge and P59 tavern-hand bridge.

### 2.4 Downstream Gate and Expression Change Summary

#### After Bridge Crossing

**Before bridge checkpoint:**
- `detectOrdinaryOrigin()` returns `'farm_peasant'`
- Expression reads as ordinary peasant (village life, fields, seasonal work)
- No merchant-route flags are set
- Magnate chain events are unreachable

**After bridge checkpoint:**
- `detectOrdinaryOrigin()` STILL returns `'farm_peasant'` (ordinary origin identity preserved)
- Bridge-specific expression branches activate on existing surfaces
- Expression reads as "peasant background + grain-merchant ascent", not "generic merchant"
- `peasant_merchant_bridge_crossed` satisfies both conditions of `magnate_on_ramp` gate
- `route_wealth_committed` satisfies `merchant_magnate` mixed destiny gate
- P55 magnate chain events become reachable

#### The bridge does NOT:
- Change origin tier from ordinary to vivid
- Remove peasant identity flags
- Rewrite the peasant origin surface
- Add new origin or framework
- Add new sample-line spine events
- Modify the P55 magnate chain itself

---

## 3. Flag Flow Diagram

```
origin_farm_peasant + peasant_swap_crew_curiosity (childhood, 10–14)
  ↓
ordinary_peasant_midlife_outside_offer (age 30)
  ↓ choice: accept grain-trade offer
peasant_merchant_bridge_crossed + route_wealth_committed (bridge checkpoint)
  ↓
P55 magnate_on_ramp (spine event, age 28–32 — bridge flag satisfies both conditions)
  ↓
P55 magnate_midlife_pressure → magnate_payoff
  ↓
merchant_magnate mixed gate evaluation (via route_wealth_committed)
```

---

## 4. Comparison with Other Ordinary Bridges

| Dimension | P58 Apprentice | P59 Tavern-Hand | P60 Peasant (this contract) |
|-----------|---------------|-----------------|----------------------------|
| Origin | `town_apprentice` | `tavern_hand` | `farm_peasant` |
| Entry path | Craft skill → trade curiosity → partnership | Service → guest network → ally referral | Physical labor → swap crew → grain trade |
| Bridge flag | `apprentice_merchant_bridge_crossed` | `tavern_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` |
| Downstream target | `merchant_magnate` via P55 chain | `merchant_magnate` via P55 chain | `merchant_magnate` via P55 chain |
| Core strength leveraged | Craft skill + trade learning | Social network + referrals | Physical endurance + seasonal labor |
| Background | Urban | Urban | Rural |

All three bridges enter the same P55 magnate chain through the same gate pattern (single bridge flag satisfies both route + milestone conditions), but each has distinct prerequisites, narrative framing, and expression text — preserving origin identity.

---

## 5. Edge Cases

| Case | Behavior |
|------|----------|
| Player chooses `refuse_offer` | Bridge does NOT fire; peasant stays in village life |
| Player has `peasant_steadfast_field` instead of `peasant_swap_crew_curiosity` | Bridge prerequisite not met; outside-offer event never fires; no bridge |
| Player is not `farm_peasant` origin | Bridge flags are never checked; no bridge |
| Player already has `route_wealth_committed` from another source | Flag is idempotent; bridge tracking flag still set |
| Player has `magnate_on_ramp_done` already | Bridge still fires (flag set), but magnate_on_ramp won't fire again (guarded by `!magnate_on_ramp_done`) |

---

## 6. P61 Implementation Validation Shape (US-006)

This section defines the validation shape for the P61 playable implementation stage. It specifies what proof, tests, and closure artifacts P61 must produce, which validations are required vs. deferred, and what the success criteria are.

### 6.1 Required Proof / Test / Closure Artifacts

P61 must produce the following artifacts:

| Artifact Type | Required | Description |
|---------------|----------|-------------|
| **Targeted proof document** | ✅ Required | `docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md` — walks through the full flag chain from origin to magnate_on_ramp, with gate expression evaluation evidence |
| **Narrow regression tests** | ✅ Required | `tests/p61FarmPeasantBridgeTests.ts` — ~12–15 assertions covering bridge behavior |
| **Typecheck** | ✅ Required | `npm run typecheck` must pass |
| **P56 regression** | ✅ Required | `p56OrdinaryOriginGrowthTests` must still pass (no regression to ordinary origin midlife) |
| **P58 regression** | ✅ Required | `p58ApprenticeBridgeTests` must still pass (no regression to apprentice bridge) |
| **P59 regression** | ✅ Required | `p59TavernHandBridgeTests` must still pass (no regression to tavern-hand bridge) |
| **Closure report** | ✅ Required | `docs/test-reports/p61-farm-peasant-bridge-closure-report.md` — summarizes implementation, validation, and boundaries |

### 6.2 Test Coverage Matrix

P61 tests should cover these areas (following P58/P59 pattern):

| Test Category | Assertions | Priority |
|---------------|------------|----------|
| Bridge gate flags | 2–3 | High — verify all prerequisite flags and bridge flags |
| Prerequisite enforcement | 2–3 | High — verify bridge doesn't fire when prerequisites missing |
| Current goal expression | 1–2 | High — bridge-specific currentGoal text |
| Life-memory expression | 1–2 | High — bridge-specific lifeMemory text |
| Summary expression | 1–2 | High — bridge-specific summary text |
| Ordinary origin preservation | 1–2 | Medium — `detectOrdinaryOrigin()` still returns `'farm_peasant'` after bridge |
| Life-memory summary integration | 1–2 | Medium — bridge expression flows through `deriveLifeMemorySummary` |
| Non-peasant isolation | 1–2 | Medium — apprentice/tavern_hand not affected by peasant bridge |
| `magnate_on_ramp` gate acceptance | 2 | High — bridge flag satisfies both route + milestone conditions |
| `magnate_on_ramp` rejection without bridge | 1 | High — without bridge flag, gate rejects peasant path |
| `merchant_midlife_debt` gate acceptance | 1 | Medium — bridge flag satisfies debt milestone gate |
| Generic merchant path still works | 1 | Medium — existing merchant route not broken by peasant bridge |

**Total: ~12–15 assertions** — consistent with P58 (14) and P59 (16) scope.

### 6.3 Required vs. Deferred Validations

| Validation | Status | Rationale |
|------------|--------|-----------|
| Gate-level acceptance (magnate_on_ramp + merchant_midlife_debt) | ✅ Required | Core bridge functionality — must verify the bridge actually connects to the downstream chain |
| Expression on 3 surfaces (currentGoal, lifeMemory, summary) | ✅ Required | Player-visible identity — must verify the bridge is narratively present |
| Ordinary origin identity preservation | ✅ Required | Key design constraint — peasant origin must not disappear |
| Cross-origin regression (P58/P59) | ✅ Required | Must not break existing bridges |
| P56 ordinary growth regression | ✅ Required | Must not break existing midlife events |
| Full lifetime sim (age 0–50) | ⏳ Deferred | Out of scope for bounded bridge — sample-line track covers full sim |
| Browser / UI verification | ⏳ Deferred | Expression changes are on existing surfaces; no new UI components |
| Playtest / human acceptance | ⏳ Deferred | Gate + expression-level verification is sufficient for bounded bridge |
| Cross-line comparison (all 3 ordinary bridges side by side) | ⏳ Deferred | Nice-to-have but not required for P61 closure |
| Economy / balance tuning | ⏳ Deferred | Bridge entry only — downstream magnate chain balance handled by P55 |

### 6.4 P61 Success Criteria

P61 is considered successful when ALL of the following are met:

1. **Bridge is runtime-reachable:** Peasant origin with swap-crew curiosity + accept-outside choice sets `peasant_merchant_bridge_crossed` + `route_wealth_committed`
2. **Bridge connects to magnate chain:** `peasant_merchant_bridge_crossed` satisfies both conditions of `magnate_on_ramp` gate AND `merchant_midlife_debt_milestone` gate
3. **Bridge is player-visible:** All three expression surfaces (currentGoal, lifeMemory, summary) have peasant-merchant bridge branches with distinct text
4. **Peasant identity preserved:** `detectOrdinaryOrigin()` still returns `'farm_peasant'` after bridge crossing
5. **No regressions:** P56, P58, P59 test suites all pass; typecheck passes
6. **Documentation complete:** Targeted proof + closure report exist and accurately describe the bridge

### 6.5 P61 Boundary Reminder

P61 is the **implementation stage** for the bridge defined in this contract. P61 must NOT:
- Add new sample-line spine events
- Modify the P55 magnate chain
- Add a fourth ordinary origin
- Expand into economy/migration systems
- Add new expression surfaces (only add branches to existing surfaces)

P61 implements exactly what this contract defines — no more, no less.
