# P79 Renown Late-Life Playable Implementation — Closure Report

&gt; **Date:** 2026-06-29
&gt; **Stage:** P79 Wuxia Renown Late-Life Playable Implementation
&gt; **Branch:** codex/p79-wuxia-renown-late-life-playable-implementation
&gt; **Status:** Complete — 7/7 user stories passed

---

## 1. Executive Summary

P79 successfully delivered the **runtime implementation** of the `jianghu_renown_sage` (江湖名宿) late-life stage, strictly following the P78 late-life contract. After this stage, the renown route has a complete narrative arc — from bridge → on-ramp → pressure → payoff → late-life — with three distinct consequence-based late-life branches.

**What was delivered:**
- 3 late-life spine events wired (`renown_late_life_burnout` / `renown_late_life_lone_wolf` / `renown_late_life_mentor` auto events in sample-lines-spine.json)
- 3 branch directions: 油尽灯枯 / 逍遥自在 / 传承授业
- 6 expression surface updates (sample line + ordinary origin, all 3 branches)
- 1 targeted proof document (8 core nodes + 5 bonus nodes verified)
- 1 regression test suite (9 groups, covering event wiring + 3 branches + no regression)
- 1 closure report (this document)

**Branch directions implemented:**
- **Branch A — 油尽灯枯 (Burnout):** 守住名声撑到最后 / 油尽灯枯的老好人 — rep+2, con+1, cha-1 (net +2)
- **Branch B — 逍遥自在 (Lone Wolf):** 无牵无挂过好剩下的日子 / 逍遥自在的孤翁 — rep-1, con-2, cha+3 (net 0)
- **Branch C — 传承授业 (Mentor):** 指点后辈传下去 / 德高望重的老前辈 — rep+3, con+2, cha+2 (net +7)

**Tavern-born renown flavor:** ✅ Consistently preserved across all branches and all expression surfaces

**Narrative arc completeness:** 上升 (bridge → on-ramp) → 平台+代价 (pressure) → 主动选择了结 (payoff, 3 directions) → 晚年收束 (late-life, 3 consequences deepen) — feels like a complete jianghu life story with meaningful cause-and-effect

**Scope discipline:** Strictly bounded — 3 auto events + 6 expression updates + tests. Zero new systems. Zero scope creep into endgame.

---

## 2. Stage Outputs Summary

### 2.1 Late-Life Event Wiring (P79-001)

**File:** `src/data/lines/sample-lines-spine.json`

**Event specs (3 auto events, one per branch):**

| Field | Branch A (Burnout) | Branch B (Lone Wolf) | Branch C (Mentor) |
|-------|---------------------|----------------------|--------------------|
| ID | `renown_late_life_burnout` | `renown_late_life_lone_wolf` | `renown_late_life_mentor` |
| Type | `auto` (consequence-based) | `auto` | `auto` |
| Age range | 52–56 | 52–56 | 52–56 |
| Trigger | `age_reach: 52` | `age_reach: 52` | `age_reach: 52` |
| Payoff marker | `tavern_renown_payoff_hard_holder` | `tavern_renown_payoff_breaker` | `tavern_renown_payoff_balancer` |
| Upstream gate | `renown_midlife_payoff_done` + `tavern_renown_bridge_crossed` | same | same |
| Exclusivity guard | `!renown_late_life_done` + no orthodox/demonic seeds | same | same |
| Checkpoint flags | `renown_late_life_done` + `renown_late_life_identity_done` | same | same |
| Branch marker | `tavern_renown_late_burnout` | `tavern_renown_late_lone_wolf` | `tavern_renown_late_mentor` |
| Stats | rep+2, con+1, cha-1 | rep-1, con-2, cha+3 | rep+3, con+2, cha+2 |
| Net | +2 | 0 | +7 |

**Branch matching (payoff → late-life):**
- 硬扛到底 (hard_holder) → 油尽灯枯 (burnout) ✅
- 索性撕破脸 (breaker) → 逍遥自在 (lone_wolf) ✅
- 找到平衡 (balancer) → 传承授业 (mentor) ✅

**Distinction from merchant late-life:** Renown late-life has **3 distinct branches** driven by player choice at payoff, while merchant late-life is a single auto-milestone. Different core question: 这辈子选的路，晚年收成如何？ vs 巨贾晚年如何守业？

### 2.2 Player-Facing Expression Updates (P79-002 + P79-003 + P79-004)

**Files:**
- `src/p50/sampleLineExpression.ts` — sample line expression
- `src/p56/ordinaryOriginExpression.ts` — ordinary origin expression

**6 expression surfaces updated:**

| Surface | Function | Branch A | Branch B | Branch C | Priority |
|---------|----------|----------|----------|----------|----------|
| Sample line cost label | `deriveSampleLineCostLabel()` | 油尽灯枯 | 逍遥自在 | 传承授业 | P0 |
| Sample line currentGoal | `renownCurrentGoal()` | 守住这一辈子的名声，撑到最后 | 无牵无挂，过好剩下的日子 | 指点后辈，把这一辈子的人情世故传下去 | P0 |
| Sample line age40Identity | `renownAge40Identity()` | 油尽灯枯的老好人 | 逍遥自在的孤翁 | 德高望重的老前辈 | P0 |
| Ordinary origin currentGoal | `tavernCurrentGoal()` | 守住这一辈子的名声，撑到最后 | 无牵无挂，过好剩下的日子 | 指点后辈，把这一辈子的人情世故传下去 | P1 |
| Ordinary origin lifeMemory | `tavernLifeMemory()` | 守了一辈子名声 + 熬干了 + 老客人念你的好 | 逍遥大半辈子 + 三教九流喝酒 + 这才是活着 | 德高望重 + 后辈来请教 + 掌柜智慧传下去 | P1 |
| Ordinary origin summary | `deriveOrdinaryOriginSummary()` | 江湖名宿 + 油尽灯枯 + 名声仍在人熬干了 | 江湖独行 + 逍遥自在 + 没人能拴住 | 江湖名宿 + 德高望重 + 智慧传下去 | P1 |

**Core signals (3+):** ✅ Cost label + current goal + late-life identity — all three clearly show late-life state and branch direction

**Branch differentiation:** ✅ All three branches have meaningfully different expressions — not reskinned

### 2.3 Targeted Late-Life Proof (P79-005)

**File:** `docs/test-reports/p79-renown-late-life-targeted-proof.md`

**Chain nodes verified:** 8 core + 5 bonus = 13 total

| # | Node | Type | Status |
|---|------|------|--------|
| 1 | Pre-late-life baseline (post-payoff) | Core | ✅ |
| 2 | Late-life event fires at age 52 | Core | ✅ |
| 3 | Branch A flags + stats | Core | ✅ |
| 4 | Branch B flags + stats | Core | ✅ |
| 5 | Branch C flags + stats | Core | ✅ |
| 6 | Cost label per branch | Core | ✅ |
| 7 | Current goal per branch | Core | ✅ |
| 8 | Late-life identity per branch | Core | ✅ |
| 9 | Life memory per branch | Bonus | ✅ |
| 10 | Origin summary per branch | Bonus | ✅ |
| 11 | Full chain traceback (origin → bridge → on-ramp → pressure → payoff → late-life) | Bonus | ✅ |
| 12 | Mutex with other lines (merchant/orthodox/demonic) | Bonus | ✅ |
| 13 | Branch matching (payoff → late-life) | Bonus | ✅ |

**Additional sections:**
- Tavern-born flavor check (10+ surfaces verified)
- Distinction from merchant late-life (8 dimensions compared)
- Endgame stage justification assessment

### 2.4 Narrow Regression Coverage (P79-006)

**File:** `tests/p79TavernHandRenownLateLifeSpineTests.ts`

**9 test groups:**

| Group | Tests | Description |
|-------|-------|-------------|
| 1. Event wiring | 4 | Existence, auto type, age range, conditions |
| 2. Pre-late-life state | 2 | Sample line detection, cost label baseline |
| 3. Branch A post-late-life | 4 | Flags + stats + cost label + current goal |
| 4. Branch B post-late-life | 4 | Flags + stats + cost label + current goal |
| 5. Branch C post-late-life | 4 | Flags + stats + cost label + current goal |
| 6. Distinct from merchant | 2 | Summary distinct, memory distinct |
| 7. No regression P71/P72/P73/P75/P77 | 5 | P71 bridge, P72 entry, P73 on-ramp, P75 pressure, P77 payoff |
| 8. Late-life identity verification | 4 | 3 branches + all different |
| 9. Ordinary origin late-life expression | 2 | Life memory + summary (3 branches each) |

**Test results:** ✅ All tests pass

---

## 3. Closure Criteria (9/9 Passed)

P78 validation shape defined 9 closure criteria. All 9 satisfied:

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Late-life event fires correctly with right conditions | ✅ | Test Group 1 + proof node 2 |
| 2 | Three branches present with distinct identities | ✅ | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 3 | Branch-specific flags set correctly (one per path) | ✅ | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 4 | Stat changes correct per branch | ✅ | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 5 | Cost label + current goal update per branch | ✅ | Test Groups 3/4/5 + proof nodes 6/7 |
| 6 | Late-life identity deepens per branch | ✅ | Test Group 8 + proof node 8 + sampleLineExpression.ts |
| 7 | Tavern-born flavor consistent across all branches | ✅ | Proof §16 (10+ surfaces verified) |
| 8 | No P71/P72/P73/P75/P77 regressions | ✅ | Test Group 7 + all prior suites pass |
| 9 | Typecheck passes | ✅ | `npm run typecheck` exits 0 |

**Closure verdict: ✅ 9/9 criteria satisfied**

---

## 4. Scope Compliance

### 4.1 Allowed Layers — All Used ✅

| Layer | Used? | Evidence |
|-------|-------|----------|
| Event wiring | ✅ | P79-001 — 3 auto events in sample-lines-spine.json |
| Expression updates (sample line) | ✅ | P79-002/003 — cost label + current goal + late-life identity |
| Expression updates (ordinary origin) | ✅ | P79-004 — current goal + life memory + summary |
| Targeted proof | ✅ | P79-005 — 8 core + 5 bonus chain nodes verified |
| Regression tests | ✅ | P79-006 — 9 test groups |
| Closure report | ✅ | This document |

### 4.2 Forbidden Expansions — All Avoided ✅

| Forbidden Expansion | Status | Notes |
|---------------------|--------|-------|
| Endgame / final legacy implementation | ✅ Not done | Late-life only stage; endgame is next |
| New framework / system | ✅ Not done | Zero new systems; all reuse existing architecture |
| Second renown seed | ✅ Not done | Single seed (ally_network) only |
| Other origins (farm/town) | ✅ Not done | Tavern_hand only |
| Multiple late-life events per branch | ✅ Not done | 1 event per branch per contract |
| Stat threshold gates | ✅ Not done | Deferred enhancement |
| Bulk content wave | ✅ Not done | 3 events only (one per branch) |
| New UI components | ✅ Not done | Reuse existing expression surfaces |
| Cross-route interactions | ✅ Not done | Single route focus |
| Endgame / legacy deepening | ✅ Not done | Late-life stage only |

**Scope compliance: ✅ 100%**

---

## 5. Regressions Check

### 5.1 P71 Bridge — No Regression ✅
- Bridge event still fires correctly
- `tavern_renown_bridge_crossed` + `route_renown_committed` still work
- Bridge expression surfaces unchanged
- Test: `p71TavernHandRenownBridgeTests.ts` — all passed

### 5.2 P72 Entry Differentiation — No Regression ✅
- `detectSampleLine()` still returns `'renown'` for bridge-crossed state
- Entry-level cost label "江湖声名之累" still shows before on-ramp
- Entry-level current goal still correct
- Test: `p72TavernHandRenownEntryDifferentiationTests.ts` — all passed

### 5.3 P73 On-Ramp — No Regression ✅
- On-ramp event still fires correctly
- On-ramp expression surfaces unchanged before pressure
- `renown_on_ramp_done` still the upstream gate for pressure
- Test: `p73TavernHandRenownOnRampSpineTests.ts` — all passed

### 5.4 P75 Pressure — No Regression ✅
- Pressure event still fires correctly
- Pressure expression surfaces unchanged before payoff
- `renown_midlife_pressure_done` still the upstream gate for payoff
- Test: `p75TavernHandRenownPressureSpineTests.ts` — all passed

### 5.5 P77 Payoff — No Regression ✅
- Payoff event still fires correctly
- Payoff expression surfaces unchanged before late-life
- `renown_midlife_payoff_done` still the upstream gate for late-life
- Test: `p77TavernHandRenownPayoffSpineTests.ts` — all passed

### 5.6 Merchant Route — No Regression ✅
- Merchant route unchanged
- Renown late-life and merchant late-life are clearly distinct
- Different event types, different core questions

### 5.7 Typecheck — Pass ✅
- `npm run typecheck` exits with code 0
- No TypeScript errors introduced

---

## 6. Deferred Renown-Expansion Items

The following remain deferred after P79:

| Item | Rationale | Suggested Stage |
|------|-----------|-----------------|
| Endgame / final legacy implementation | Late-life only stage; endgame is next | P80 (if justified) |
| Stat threshold gate implementation | Optional enhancement, not required | Future stage |
| Mentor-bond renown seed | Second seed route, high scope | Future cycle |
| Farm_peasant / town_apprentice renown bridges | Other origins out of scope | Future cycles |
| Full renown route expansion | Way beyond late-life scope | Far future |
| Cross-route interaction (renown × merchant) | No route interaction systems | Far future |
| Multiple late-life events per branch | 1 event per branch per contract | Future expansion |
| Late-life stat tradeoff tuning | Initial implementation; balance passes | After playtesting |
| Additional expression surfaces | 6 surfaces already cover core UX | If player feedback demands |

---

## 7. GO / NO-GO for Endgame Stage

### 7.1 Assessment

**Is an endgame / final legacy stage (P80+) worth doing?**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Foundation strength | ✅ Strong | 6-stage foundation verified (bridge + entry + on-ramp + pressure + payoff + late-life) |
| Direction clarity | ⚠️ Medium | Three late-life branches create potential endgame points, but endgame scope needs definition |
| Flavor consistency | ✅ Excellent | Tavern-born renown preserved across all 6 stages + all 3 branches |
| Implementation risk | ⚠️ Medium | Need to define what endgame actually adds (not just "more content") |
| Narrative value | ⚠️ Medium | Late-life already provides strong closure — endgame might be redundant |
| Branch leverage | ✅ High | 3-branch structure creates more endgame variation |
| Replication value | ⚠️ Low | Only one origin (tavern_hand) |

### 7.2 Recommendation

**Conditional GO for endgame stage (P80), but only if lightweight.**

**Why GO:**
1. **Strong foundation:** 6 stages deep, all verified, all stable
2. **Natural continuation:** Three late-life branches set up potential endgame trajectories
3. **High branch leverage:** 3-branch structure creates more interesting endgame variation
4. **Narrative completion:** Endgame echo would provide final "life review" coda

**Why caution:**
1. **Late-life already provides strong closure** — endgame might feel redundant
2. **Only one origin** — replication value per stage is lower
3. **Risk of scope creep** — endgame could easily expand beyond what's justified

**Conditions for P80 (if pursued):**
- Endgame must be LIGHTWEIGHT: 1 echo event + expression updates only
- Endgame contract must be well-defined (not just "more of the same")
- Maintain tavern-born flavor discipline
- Stay bounded — should feel like a final coda, not a new act
- Should assess player impact first before committing

**Alternative:** Skip endgame for now. The renown route already has a complete 6-stage narrative arc with strong late-life closure. Endgame can be revisited after player feedback or when more origins have late-life stages.

---

## 8. Files Created/Modified

### Created (3 files)
- `tests/p79TavernHandRenownLateLifeSpineTests.ts` — Regression test suite (9 groups)
- `docs/test-reports/p79-renown-late-life-targeted-proof.md` — Targeted proof (13 chain nodes)
- `docs/test-reports/p79-renown-late-life-closure-report.md` — This report

### Modified (3 files)
- `src/data/lines/sample-lines-spine.json` — Added 3 late-life auto events (burnout/lone_wolf/mentor)
- `src/p50/sampleLineExpression.ts` — Late-life cost label + currentGoal + identity (all 3 branches)
- `src/p56/ordinaryOriginExpression.ts` — Late-life currentGoal + lifeMemory + summary (all 3 branches)

---

## 9. Story Completion Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P79-001 | Wire renown late-life spine event | 1 | ✅ Pass |
| P79-002 | Add late-life player-facing expression — sample line (core P0) | 2 | ✅ Pass |
| P79-003 | Add late-life player-facing expression — late-life identity (core P0) | 3 | ✅ Pass |
| P79-004 | Add late-life player-facing expression — ordinary origin (bonus P1) | 4 | ✅ Pass |
| P79-005 | Add targeted late-life proof | 5 | ✅ Pass |
| P79-006 | Add narrow regression coverage | 6 | ✅ Pass |
| P79-007 | Produce P79 closure report | 7 | ✅ Pass |

**7/7 stories: ✅ All passed**

---

## 10. Final Verdict

P79 is **complete and ready for handoff** to verification (A1-verify).

The renown route now has a complete late-life stage:
- **Runtime:** 3 late-life events fire, 1 per branch, checkpoint + branch marker set, stats change per path
- **Expression:** 6 surfaces updated, 3+ core late-life signals clearly visible, all branches distinct
- **Flavor:** Tavern-born renown consistently preserved — every branch, every surface has tavern-specific imagery
- **Quality:** All tests pass, P71/P72/P73/P75/P77 no regression, typecheck passes
- **Narrative arc:** Complete — origin → bridge → on-ramp → pressure → payoff (3 choices) → late-life (3 consequences)
- **Future:** Endgame stage conditional GO recommended (lightweight only), or skip — late-life already provides strong closure

**Next recommended step:** A1-verify, then decide on P80 endgame stage (conditional GO — lightweight only, or skip).

---

**P79-007 complete.** Closure report saved. 7/7 stories passed. 9/9 closure criteria satisfied.
