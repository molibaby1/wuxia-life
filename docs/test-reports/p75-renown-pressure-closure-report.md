# P75 Renown Pressure Playable Implementation — Closure Report

> **Date:** 2026-06-29
> **Stage:** P75 Wuxia Renown Pressure Playable Implementation
> **Branch:** codex/p75-wuxia-renown-pressure-playable-implementation
> **Status:** Complete — 7/7 user stories passed

---

## 1. Executive Summary

P75 successfully delivered the **runtime implementation** of the `jianghu_renown_sage` (江湖名宿) pressure stage, strictly following the P74 pressure contract. After this stage, the renown route has a working pressure milestone — the first real "cost" of renown fame.

**What was delivered:**
- 1 pressure spine event wired (`renown_midlife_pressure` in sample-lines-spine.json)
- 5 expression surface updates (3 P0 + 2 P1)
- 2 payoff flag interface placeholders reserved
- 1 targeted proof document (5 core nodes + 2 bonus nodes verified)
- 1 regression test suite (18 tests across 5 groups)
- 1 closure report (this document)

**Direction implemented:** 人情债渐重 (Favor Debt Burden)
- Tavern-born renown flavor: ✅ Consistently preserved
- Pattern symmetry with merchant pressure: ✅ Same shape, different flavor
- Narrative arc: 上升 (bridge → on-ramp) → 平台+代价 (pressure) — feels like a real turning point

**Scope discipline:** Strictly bounded — 1 event + 5 expression updates + tests. Zero new systems. Zero scope creep into payoff.

---

## 2. Stage Outputs Summary

### 2.1 Pressure Event Wiring (P75-001)

**File:** `src/data/lines/sample-lines-spine.json`

**Event spec:**
| Field | Value |
|-------|-------|
| ID | `renown_midlife_pressure` |
| Type | `auto` (mandatory milestone) |
| Age range | 37–41 |
| Trigger | `age_reach: 37` |
| Upstream gate | `renown_on_ramp_done` |
| Exclusivity guard | `!renown_midlife_pressure_done` + no orthodox/demonic seeds |
| Checkpoint flag | `renown_midlife_pressure_done` |
| Origin marker | `tavern_renown_pressure` |
| Stat changes | reputation +3, connections +2, charisma +1 |

**Narrative:**
> 这些年，你在江湖上的名声越来越响。酒肆里常有人来，有受过你恩惠专程来道谢的，有你欠了人情找上门来的，还有人借着你的名头在外行事。你站在柜台后，看着一拨又一拨的人，忽然想起小时候在这儿见惯的人情往来——那时候你只觉得热闹，如今才知道，这人情债，是真的能压得人喘不过气。

**Pattern alignment:** Follows `magnate_midlife_pressure` exactly — auto event in sample-lines-spine, checkpoint flag + origin marker, stat boosts.

### 2.2 Player-Facing Expression Updates (P75-002 + P75-003)

**Files:**
- `src/p50/sampleLineExpression.ts` — sample line expression
- `src/p56/ordinaryOriginExpression.ts` — ordinary origin expression

**5 expression surfaces updated:**

| Surface | Function | Before (on-ramp) | After (pressure) | Priority |
|---------|----------|-------------------|------------------|----------|
| Sample line cost label | `deriveSampleLineCostLabel()` | 江湖声名之累 | 人情债渐重 | P0 |
| Sample line currentGoal | `renownCurrentGoal()` | 在江湖上有了名号，常有人来请你主持公道、引荐高人 | 一面维持声名，一面应付越来越重的人情债 | P0 |
| Ordinary origin currentGoal | `tavernCurrentGoal()` | 在江湖上有了名号，常有人来请你主持公道 | 一面维持声名，一面应付越来越重的人情债 | P0 |
| Ordinary origin lifeMemory | `tavernLifeMemory()` | 第一次以江湖人的身份主持了公道...不是因为武功，是因为人脉和面子 | 这些年欠的人情、攒的面子，如今都成了要还的债。有人登门道谢，有人上门讨债，酒肆的门槛都快被踩平了。你才明白——江湖名声，从来不是白来的。 | P1 |
| Ordinary origin summary | `deriveOrdinaryOriginSummary()` | 酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。 | 酒肆出身的江湖名宿：靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重。 | P1 |

**Core signals (2+):** ✅ Cost label + current goal — both clearly show pressure state

### 2.3 Payoff Flag Interfaces Reserved (P75-004)

**File:** `src/p50/sampleLineExpression.ts`

Two TODO placeholders in both `renownCurrentGoal()` and `renownAge40Identity()`:
- `TODO: renown_payoff_done — for P76+ payoff stage`
- `TODO: renown_age40_identity_done — for P76+ payoff stage`

**No payoff logic implemented.** Placeholders only, clearly annotated for future stages.

### 2.4 Targeted Pressure Proof (P75-005)

**File:** `docs/test-reports/p75-renown-pressure-targeted-proof.md`

**Chain nodes verified:** 5 core + 2 bonus = 7 total

| # | Node | Type | Status |
|---|------|------|--------|
| 1 | Pre-pressure baseline (post-on-ramp) | Core | ✅ |
| 2 | Pressure event fires at age 37 | Core | ✅ |
| 3 | Checkpoint flags set correctly | Core | ✅ |
| 4 | Cost label updates (江湖声名之累 → 人情债渐重) | Core | ✅ |
| 5 | Current goal updates (sample line + origin) | Core | ✅ |
| 6 | Life memory updates (酒肆门槛被踩平) | Bonus | ✅ |
| 7 | Summary updates (名声越大，人情债越重) | Bonus | ✅ |

**Additional sections:**
- Full chain traceback (origin → bridge → on-ramp → pressure)
- Tavern-born flavor check (7 surfaces verified)
- Distinction from merchant pressure (pattern symmetric, flavor different)
- Payoff stage readiness assessment

### 2.5 Narrow Regression Coverage (P75-006)

**File:** `tests/p75TavernHandRenownPressureSpineTests.ts`

**18 tests across 5 groups:**

| Group | Tests | Description |
|-------|-------|-------------|
| 1. Event wiring | 5 | Existence, conditions, age range, auto type, flag setting |
| 2. Pre-pressure state | 2 | Sample line detection, cost label baseline |
| 3. Post-pressure expression | 5 | 3 P0 (costLabel, currentGoal×2) + 2 P1 (lifeMemory, summary) |
| 4. Distinct from merchant | 2 | Summary distinct, memory distinct |
| 5. No regression P71/P72/P73 | 4 | P71 bridge, P72 entry, P73 on-ramp, merchant pressure |

**Test results:** ✅ All 18 tests pass

---

## 3. Closure Criteria (9/9 Passed)

P74 validation shape defined 9 closure criteria. All 9 satisfied:

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Pressure event fires correctly | ✅ | Test Group 1 + proof node 2 |
| 2 | Checkpoint flag set correctly | ✅ | Test Group 1 + proof node 3 |
| 3 | Cost label updates correctly | ✅ | Test Group 3 + proof node 4 |
| 4 | Current goal updates correctly | ✅ | Test Group 3 + proof node 5 |
| 5 | Tavern-born flavor consistent | ✅ | Proof §11 (7 surfaces verified) |
| 6 | No P71/P72/P73 regressions | ✅ | Test Group 5 + P71/P72/P73 suites all pass |
| 7 | Typecheck passes | ✅ | `npm run typecheck` exits 0 |
| 8 | Sample-lines-baseline guard passes | ✅ | No spine structure changes; same pattern as merchant |
| 9 | Payoff flag interfaces reserved | ✅ | P75-004 — TODO comments in renownCurrentGoal + renownAge40Identity |

**Closure verdict: ✅ 9/9 criteria satisfied**

---

## 4. Scope Compliance

### 4.1 Allowed Layers — All Used ✅

| Layer | Used? | Evidence |
|-------|-------|----------|
| Event wiring | ✅ | P75-001 — renown_midlife_pressure in sample-lines-spine.json |
| Expression updates | ✅ | P75-002/003 — 5 expression surfaces |
| Payoff flag reservation | ✅ | P75-004 — TODO placeholders |
| Targeted proof | ✅ | P75-005 — 5+2 chain nodes verified |
| Regression tests | ✅ | P75-006 — 18 tests, 5 groups |
| Closure report | ✅ | This document |

### 4.2 Forbidden Expansions — All Avoided ✅

| Forbidden Expansion | Status | Notes |
|---------------------|--------|-------|
| Payoff stage implementation | ✅ Not done | Only flag placeholders reserved |
| Age-40 identity deepening | ✅ Not done | Deferred to payoff stage |
| New framework / system | ✅ Not done | Zero new systems; all reuse existing architecture |
| Second renown seed | ✅ Not done | Single seed (ally_network) only |
| Other origins (farm/town) | ✅ Not done | Tavern_hand only |
| Choice-based pressure | ✅ Not done | Auto event per contract |
| Stat threshold gates | ✅ Not done | Deferred enhancement |
| Bulk content wave | ✅ Not done | 1 event only |
| New UI components | ✅ Not done | Reuse existing expression surfaces |
| Cross-route interactions | ✅ Not done | Single route focus |

**Scope compliance: ✅ 100%**

---

## 5. Regressions Check

### 5.1 P71 Bridge — No Regression ✅
- Bridge event still fires correctly
- `tavern_renown_bridge_crossed` + `route_renown_committed` still work
- Bridge expression surfaces unchanged before on-ramp
- Test: `p71TavernHandRenownBridgeTests.ts` — all passed

### 5.2 P72 Entry Differentiation — No Regression ✅
- `detectSampleLine()` still returns `'renown'` for bridge-crossed state
- Entry-level cost label "江湖声名之累" still shows before pressure
- Entry-level current goal still correct
- Test: `p72TavernHandRenownEntryDifferentiationTests.ts` — all passed

### 5.3 P73 On-Ramp — No Regression ✅
- On-ramp event still fires correctly
- On-ramp expression surfaces unchanged before pressure
- `renown_on_ramp_done` still the upstream gate for pressure
- Test: `p73TavernHandRenownOnRampSpineTests.ts` — all passed

### 5.4 Merchant Pressure — No Regression ✅
- Merchant pressure unchanged
- Renown pressure and merchant pressure are clearly distinct
- Pattern symmetric (auto milestone + expression updates), flavor different (人情债 vs 金钱债)

### 5.5 Typecheck — Pass ✅
- `npm run typecheck` exits with code 0
- No TypeScript errors introduced

---

## 6. Deferred Renown-Expansion Items

The following remain deferred after P75:

| Item | Rationale | Suggested Stage |
|------|-----------|-----------------|
| Payoff stage implementation | Pressure-only stage; payoff is next | P76 (design-first recommended) |
| Age-40 identity deepening | Payoff stage concern | P76+ |
| Choice-based payoff (how to handle the debt) | Auto pressure per contract; choice for payoff | P76+ |
| Stat threshold gate implementation | Optional enhancement, not required | P76 or later |
| Mentor-bond renown seed | Second seed route, high scope | Future cycle |
| Farm_peasant / town_apprentice renown bridges | Other origins out of scope | Future cycles |
| Full renown route expansion | Way beyond pressure scope | Far future |
| Cross-route interaction (renown × merchant) | No route interaction systems | Far future |
| Multiple pressure events | 1 event per contract | Future expansion |
| Fame burden direction (candidate B from P74) | Backup direction, not selected | If 人情债 proves weak |

---

## 7. GO / NO-GO for Payoff Stage

### 7.1 Assessment

**Is the payoff stage (P76+) worth doing?**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Foundation strength | ✅ Strong | 4-stage foundation verified (bridge + entry + on-ramp + pressure) |
| Direction clarity | ✅ Clear | 人情债渐重 → payoff naturally follows (how to handle the debt?) |
| Flavor consistency | ✅ Excellent | Tavern-born renown preserved across all 4 stages |
| Implementation risk | ✅ Low | Follow merchant payoff pattern; 1 event + expression updates |
| Narrative value | ✅ High | Completes the arc: rise → cost → resolution |
| Precedent alignment | ✅ Good | Merchant trilogy proves the pattern works |
| Small-step fit | ✅ Good | 1 payoff event + expression updates = bounded |

### 7.2 Recommendation

**GO for payoff stage (P76).**

**Why GO:**
1. **Strong foundation:** 4 stages deep, all verified, all stable
2. **Natural continuation:** Pressure sets up the question (人情债怎么还？); payoff answers it
3. **Low risk:** Follow merchant payoff pattern — same shape, renown flavor
4. **High narrative value:** Completes the renown arc — rise → cost → resolution
5. **Flavor opportunity:** Can differentiate from merchant (auto payoff) with choice-based payoff

**Recommended approach for P76:**
- Consider **design-first** for payoff (like P74 for pressure)
- Explore **choice-based payoff** (vs merchant auto payoff) to differentiate
- 3 choice directions: 硬扛到底 / 索性撕破脸 / 找到平衡
- Stay bounded: 1 payoff event + expression updates + maybe 1 choice fork
- Keep tavern-born renown flavor discipline

**Conditions / risks to monitor:**
- Don't let payoff expand into "full renown expansion"
- Keep it bounded — one stage, one milestone
- Maintain flavor discipline — don't slip into generic jianghu

---

## 8. Files Created/Modified

### Created (3 files)
- `tests/p75TavernHandRenownPressureSpineTests.ts` — Regression test suite (18 tests, 5 groups)
- `docs/test-reports/p75-renown-pressure-targeted-proof.md` — Targeted proof (7 chain nodes)
- `docs/test-reports/p75-renown-pressure-closure-report.md` — This report

### Modified (4 files)
- `src/data/lines/sample-lines-spine.json` — Added `renown_midlife_pressure` event
- `src/p50/sampleLineExpression.ts` — Pressure cost label + currentGoal + payoff TODOs
- `src/p56/ordinaryOriginExpression.ts` — Pressure currentGoal + lifeMemory + summary
- `docs/PRD/p75-wuxia-renown-pressure-playable-implementation.prd.json` — Updated story statuses

---

## 9. Story Completion Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P75-001 | Wire renown pressure spine event | 1 | ✅ Pass |
| P75-002 | Add pressure player-facing expression (core P0) | 2 | ✅ Pass |
| P75-003 | Add pressure player-facing expression (bonus P1) | 3 | ✅ Pass |
| P75-004 | Reserve payoff flag interfaces | 4 | ✅ Pass |
| P75-005 | Add targeted pressure proof | 5 | ✅ Pass |
| P75-006 | Add narrow regression coverage | 6 | ✅ Pass |
| P75-007 | Produce P75 closure report | 7 | ✅ Pass |

**7/7 stories: ✅ All passed**

---

## 10. Final Verdict

P75 is **complete and ready for handoff** to verification (A1-verify) and then to P76 payoff stage.

The renown route now has a working pressure stage:
- **Runtime:** Pressure event fires, checkpoint is set, stats change
- **Expression:** 5 surfaces updated, 2+ core pressure signals clearly visible
- **Flavor:** Tavern-born renown consistently preserved — 人情债, not 金钱债, not 武功压
- **Quality:** 18 tests pass, P71/P72/P73 no regression, typecheck passes
- **Future:** Payoff flag interfaces reserved, payoff stage readiness assessed

**Next recommended step:** P76 renown payoff stage — design-first recommended, explore choice-based payoff to differentiate from merchant auto payoff.

---

**P75-007 complete.** Closure report saved. 7/7 stories passed. 9/9 closure criteria satisfied.
