# P73 Renown On-Ramp Spine — Closure Report

> **Date:** 2026-06-29
> **Stage:** P73 Wuxia Renown On-Ramp Spine
> **Branch:** codex/p73-wuxia-renown-on-ramp-spine
> **Status:** Complete — 8/8 user stories passed

---

## 1. Executive Summary

P73 successfully delivered the **minimum playable on-ramp spine** for the `jianghu_renown_sage` (江湖名宿) route. After this stage, players crossing the renown bridge (P71) now encounter a real narrative milestone — "声名初显" at age 32-35 — that makes the route feel like it has content beyond just entry labels.

**What was delivered:**
- 1 auto spine event ("声名初显") with tavern-born renown flavor
- 1 checkpoint flag (`renown_on_ramp_done`) for downstream stages
- 4 expression surface updates (currentGoal ×2, lifeMemory, summary)
- 1 targeted proof document (8 chain nodes verified)
- 19 narrow regression tests
- All existing evidence (P71 bridge, P72 entry, merchant on-ramp) preserved without regression

**Scope discipline:** Stayed strictly within the 4 allowed layers (event config / expression / proof / narrow tests). No new systems. No pressure or payoff content. No other origins.

---

## 2. What the Renown On-Ramp Provides

### 2.1 Narrative Milestone

**Event:** "声名初显" (Fame Emerges)
- **Timing:** Age 32–35 (3 years after bridge at 29)
- **Type:** Auto event (mandatory milestone, like `magnate_on_ramp`)
- **Trigger:** `tavern_renown_bridge_crossed` + no `renown_on_ramp_done` + no orthodox/demonic seeds
- **Narrative:** Two groups of jianghu people come to the tavern to ask the player to mediate a dispute. The player uses their network and reputation to resolve it. Both sides leave saying "兄台高义". From that day, the player's name carries weight in the jianghu — not because of martial skill, but because of connections and face.

### 2.2 Player-Visible Signals

| Surface | Before On-Ramp (Bridge) | After On-Ramp |
|---------|------------------------|---------------|
| Sample line currentGoal | "凭人脉声名在江湖立足，常有人来寻你引荐主事" | "在江湖上有了名号，常有人来请你主持公道、引荐高人" |
| Ordinary origin currentGoal | "江湖上渐渐有了名声，常有人来寻你引荐" | "在江湖上有了名号，常有人来请你主持公道" |
| Life memory | Bridge-level: "凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号" | On-ramp specific: "第一次以江湖人的身份主持了公道...不是因为武功，是因为人脉和面子" |
| Origin summary | "酒肆出身的江湖人物：靠人脉和名声在江湖上立足" | "酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人" |

### 2.3 Tavern-Born Flavor

The renown on-ramp consistently preserves tavern-born flavor:
- **Mechanism:** Reputation, connections, charisma — not martial power
- **Narrative:** Mediating disputes, giving face, network leverage — not fighting
- **Origin:** "酒肆出身的" leads every summary; "不是因为武功" explicit in memory
- **Distinct from merchant:** Merchant = 商人/商路; Renown = 江湖名宿/人脉/面子

### 2.4 Checkpoint Flag

`renown_on_ramp_done` — the primary downstream checkpoint flag. This is analogous to `magnate_on_ramp_done` in the merchant route and can be used by pressure (P74) and payoff (P75+) stages.

Reserved but not implemented:
- `renown_pressure_started` — for pressure stage
- `renown_payoff_reached` — for payoff stage

---

## 3. Gap Audit → Delivery Comparison

| Gap Identified in P73-001 | Status | Delivered |
|---------------------------|--------|-----------|
| No on-ramp spine event | ✅ Closed | `renown_on_ramp` auto event in sample-lines-spine.json |
| No on-ramp checkpoint flag | ✅ Closed | `renown_on_ramp_done` flag set by event |
| No on-ramp expression updates | ✅ Closed | 4 expression surfaces updated (goal ×2, memory, summary) |
| No on-ramp proof | ✅ Closed | Targeted proof with 8 chain nodes |
| No on-ramp regression tests | ✅ Closed | 19 narrow regression tests |

**All identified gaps: ✅ Closed**

---

## 4. Scope Contract Compliance

### 4.1 Allowed Layers (All Used ✅)

| Layer | Used? | Evidence |
|-------|-------|----------|
| Event configuration | ✅ | `renown_on_ramp` in sample-lines-spine.json |
| Player-facing expression | ✅ | 4 updates in sampleLineExpression.ts + ordinaryOriginExpression.ts |
| Proof artifact | ✅ | p73-renown-on-ramp-targeted-proof.md |
| Narrow tests | ✅ | p73TavernHandRenownOnRampSpineTests.ts (19 tests) |

### 4.2 Forbidden Expansions (All Avoided ✅)

| Forbidden Expansion | Status | Notes |
|---------------------|--------|-------|
| Pressure wave events | ✅ Not done | Reserved only: `renown_pressure_started` flag interface |
| Payoff wave events | ✅ Not done | Reserved only: `renown_payoff_reached` flag interface |
| New systems/frameworks | ✅ Not done | Used existing event system, no new code |
| Full renown route expansion | ✅ Not done | Only on-ramp spine, 1 event |
| Second route (mentor-bond) | ✅ Not done | Single seed route only |
| Other origins (farm/town) | ✅ Not done | Tavern_hand only |

**Scope compliance: ✅ 100% — stayed strictly within contract**

---

## 5. Test Results

### 5.1 P73 Tests (New)

```
tests/p73TavernHandRenownOnRampSpineTests.ts — 19 tests, all passed
  1. On-ramp event wiring — 5 tests
  2. Pre-on-ramp bridge-only state — 4 tests
  3. Post-on-ramp expression updates — 5 tests
  4. Distinct from merchant on-ramp — 2 tests
  5. No regression of P71/P72 — 3 tests
```

### 5.2 Regression Tests (Existing)

| Test Suite | Result |
|------------|--------|
| typecheck (tsc --noEmit) | ✅ Pass |
| P71 bridge tests | ✅ Pass |
| P72 entry differentiation tests | ✅ Pass |
| guard:sample-lines-baseline | ✅ Pass |

**Zero regressions across all existing test suites.**

---

## 6. Is the Pressure Stage Worth Opening?

### 6.1 Arguments FOR Pressure Stage

1. **Solid foundation:** Bridge (P71) + Entry (P72) + On-ramp (P73) form a strong 3-stage spine
2. **Clear narrative hooks:** "声名之累"、"人情债"、"江湖恩怨" — natural pressure directions for a renown character
3. **Tavern-born flavor is consistent:** The flavor discipline is working; pressure can build on it
4. **Merchant route precedent:** Merchant route has pressure (P55) + payoff (P56); renown route should have equivalent structure
5. **Checkpoint flag is in place:** `renown_on_ramp_done` is ready as a gate for pressure events

### 6.2 Arguments AGAINST Pressure Stage

1. **Single origin only:** Only `tavern_hand` is implemented; replication value vs. merchant route (which also has farm/town/apprentice origins) is lower
2. **Pressure direction not obvious:** Merchant pressure is straightforward (financial collapse, debt). Renown pressure is more nuanced — what does "renown pressure" feel like? Needs design work.
3. **Opportunity cost:** Could work on other routes or systems instead

### 6.3 Recommendation

**GO for pressure stage — but design-first, not implementation-first.**

Recommended approach for P74:
1. **Start with design (P74):** Define what renown pressure looks like — is it 声名之累? 人情债? 江湖恩怨? Pick one clear direction.
2. **Stay bounded:** 1 pressure event + expression updates, following the P55 merchant pressure pattern.
3. **Maintain flavor discipline:** Tavern-born renown pressure should feel different from merchant pressure and from orthodox/demonic pressure.
4. **Preserve optionality:** Don't commit to full payoff stage until pressure stage proves the route has enough narrative depth.

**Pressure stage readiness: ✅ GO (design-first, with bounded scope)**

---

## 7. Deferred Renown-Expansion Items

The following are intentionally out of scope for P73 and remain deferred:

| Item | Rationale | Suggested Stage |
|------|-----------|-----------------|
| Pressure event(s) | On-ramp only stage | P74 (design-first) |
| Payoff / age-40 identity deepening | On-ramp only stage | P75+ |
| Choice-based on-ramp (accept/decline) | Auto event chosen for simplicity; can add later | Future refinement |
| Stat threshold gates for renown route | Not implemented in P73 | Future stage |
| Mentor-bond renown seed | Deferred second seed | Future cycle |
| Farm_peasant / town_apprentice renown bridges | Other origins out of scope | Future cycles |
| Full renown route expansion (10+ events) | Way beyond on-ramp scope | Far future |
| Cross-route interaction (renown × merchant, etc.) | No route interaction systems | Far future |
| Renown-specific UI components | No new UI in P73 | Far future |

---

## 8. Files Modified/Created

### Created (6 files)
- `docs/test-reports/p73-renown-on-ramp-gap-audit.md` — Gap audit
- `docs/test-reports/p73-renown-on-ramp-scope-contract.md` — Scope contract
- `docs/PRD/p73-renown-on-ramp-contract.md` — On-ramp event contract
- `docs/test-reports/p73-renown-on-ramp-targeted-proof.md` — Targeted proof (8 chain nodes)
- `tests/p73TavernHandRenownOnRampSpineTests.ts` — 19 regression tests
- `docs/test-reports/p73-renown-on-ramp-closure-report.md` — This report

### Modified (4 files)
- `src/data/lines/sample-lines-spine.json` — Added `renown_on_ramp` auto event
- `src/p50/sampleLineExpression.ts` — Updated `renownCurrentGoal`
- `src/p56/ordinaryOriginExpression.ts` — Updated `tavernCurrentGoal`, `tavernLifeMemory`, `deriveOrdinaryOriginSummary`
- `docs/PRD/p73-wuxia-renown-on-ramp-spine.prd.json` — Updated story statuses

---

## 9. Story Completion Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P73-001 | Audit renown on-ramp gap | 1 | ✅ Pass |
| P73-002 | Lock P73 scope contract | 2 | ✅ Pass |
| P73-003 | Define renown on-ramp contract | 3 | ✅ Pass |
| P73-004 | Wire renown on-ramp spine event | 4 | ✅ Pass |
| P73-005 | Add on-ramp player-facing expression | 5 | ✅ Pass |
| P73-006 | Add targeted on-ramp proof | 6 | ✅ Pass |
| P73-007 | Add narrow regression coverage | 7 | ✅ Pass |
| P73-008 | Produce P73 closure report | 8 | ✅ Pass |

**8/8 stories: ✅ All passed**

---

## 10. Final Verdict

P73 is **complete and ready for handoff** to verification (A1-verify).

The renown route now has a solid 3-stage foundation:
- **Bridge (P71):** `tavern_hand` + `ally_network` → 江湖名号 → `tavern_renown_bridge_crossed`
- **Entry (P72):** 6 expression surfaces differentiating renown from merchant / plain tavern
- **On-ramp (P73):** "声名初显" milestone → `renown_on_ramp_done` → 江湖名宿 identity

**Next recommended step:** P74 renown pressure stage (design-first), to continue building out the renown route following the merchant route pattern.

---

**P73-008 complete.** Closure report saved. 8/8 stories passed.
