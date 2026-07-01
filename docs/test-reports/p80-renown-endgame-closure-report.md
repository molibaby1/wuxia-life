# P80 Renown Endgame Design-First — Closure Report

> **Date:** 2026-06-29
> **Stage:** P80 Wuxia Renown Endgame Design-First Contract
> **Branch:** codex/p80-wuxia-renown-endgame-design-first
> **Status:** Complete — 7/7 user stories passed

---

## 1. Executive Summary

P80 successfully delivered the **design-first contract** for the `jianghu_renown_sage` (江湖名宿) endgame / final legacy stage. After thorough assessment, the verdict is **CONDITIONAL_GO** — endgame adds meaningful thematic value for the renown route, but only if it stays strictly lightweight.

**What was delivered:**
- 1 prerequisite audit (16 flags, 7 events, 7 expression surfaces inventoried)
- 1 scope contract (7 allowed layers, 13 forbidden items, lightweight constraint)
- 1 GO/NO-GO assessment (CONDITIONAL_GO, Legacy Echo positioning)
- 3 endgame branch designs (叹/遥/传, all meaningfully different)
- 1 endgame contract (LOCKED — `renown_endgame_echo`, age 60-65, 3 variants)
- 1 P81 validation shape (7 core + 5 bonus proof nodes, ~22-27 tests, 9 closure criteria)
- 1 closure report (this document)

**Verdict: CONDITIONAL_GO for P81 endgame implementation**

**Conditions for GO:**
1. Must stay lightweight: 1 echo event + expression updates only
2. Must follow the P80 endgame contract exactly
3. No stat changes (endgame is memory, not power)
4. Tavern-born flavor must be preserved
5. 3 variants must be meaningfully different

**If any condition is violated during P81, STOP and reassess NO-GO.**

---

## 2. Stage Outputs Summary

### 2.1 Prerequisite Audit (P80-001)

**File:** `docs/test-reports/p80-renown-endgame-prerequisite-audit.md`

**Key findings:**
- 6-stage foundation: bridge + entry + on-ramp + pressure + payoff + late-life
- 16 flags/markers inventoried (8 checkpoints + 8 stage/branch markers)
- 7 events cataloged (1 bridge + 1 on-ramp + 1 pressure + 1 payoff + 3 late-life)
- 7 expression surfaces mapped (3 sample line + 4 ordinary origin)
- 3 late-life branches with distinct stats/identities/expressions
- P19 endgame echo system partially reusable (config pattern, age trigger, done-flag gating)
- Foundation is strong; the open question is value, not feasibility

### 2.2 Scope Contract (P80-002)

**File:** `docs/test-reports/p80-renown-endgame-scope-contract.md`

**Key boundaries:**
- 7 allowed layers (audit/scope/direction/design/contract/shape/closure)
- 13 forbidden expansions (runtime wiring, new framework, second seed, etc.)
- Lightweight constraint: max 1 echo event + expression updates only
- 4 scope guardrails (boundedness/flavor/differentiation/GO-NO-GO)
- GO criteria: 6 must-pass
- NO-GO criteria: 5 any-trigger
- Rollback: trivial (just don't do P81)

### 2.3 Endgame Direction Assessment (P80-003)

**File:** `docs/test-reports/p80-renown-endgame-direction-assessment.md`

**Verdict: CONDITIONAL_GO**

**Core positioning:** Legacy Echo (身后名之声) — 江湖如何记住你

**Why GO:**
- Thematic fit is strong — reputation → legacy is the natural renown culmination
- 3-branch structure creates meaningful differentiation
- Can be done within lightweight constraint
- Tavern-born flavor enhances well (酒肆传说 angle)
- Late-life provides life closure but not thematic closure

**Why conditional (not full GO):**
- Narrative value is real but modest — it's a coda, not a new act
- Single origin (tavern_hand) means lower replication value
- Must strictly adhere to lightweight constraint

**Key distinction from late-life:**
- Late-life = first-person: 你晚年怎么过
- Endgame = third-person: 江湖怎么记住你

**Key distinction from P19 generic endgame:**
- P19 = comprehensive end-of-life system
- Renown endgame = route-specific thematic coda (reputation only)

### 2.4 Three Endgame Branches (P80-004)

**File:** `docs/test-reports/p80-renown-endgame-branch-design.md`

**Event shape:** Single auto echo event with 3 variants

| Variant | Late-life root | Core theme | Tone |
|---------|---------------|------------|------|
| 身后名之声·叹 | 油尽灯枯 | 名声比人长久 | Bittersweet |
| 身后名之声·遥 | 逍遥自在 | 传说比人逍遥 | Playful-mysterious |
| 身后名之声·传 | 传承授业 | 智慧比人长久 | Warm-satisfied |

**Lightweight compliance:** ✅ 7/7 constraints satisfied

**Tavern-born flavor:** ✅ All 3 branches have distinct, meaningful tavern-born anchors

### 2.5 Endgame Contract (P80-005)

**File:** `docs/PRD/p80-renown-endgame-contract.md`

**Status: LOCKED**

**Event spec:**
- ID: `renown_endgame_echo`
- Type: `auto` (echo event)
- Age: 60-65
- Gate: `renown_late_life_done`
- Branching: 3 variants based on late-life branch markers
- Checkpoint: `renown_endgame_done`
- Identity flag: `renown_endgame_identity_done`
- Branch markers: `tavern_renown_endgame_sigh / distant / legacy`
- Stats: None (endgame is memory, not power)

**Expression updates:** 6 surfaces (3 sample line + 3 ordinary origin)

**Endgame-specific signals:** 3+ (cost label + current goal + identity)

**Reserved flags:** 5 total

**Lightweight compliance contract:** 7 constraints, all non-negotiable

### 2.6 P81 Validation Shape (P80-006)

**File:** `docs/test-reports/p80-p81-validation-shape.md`

**Proof nodes:** 7 core + 5 bonus = 12 total

**Regression tests:** ~22-27 tests across 7 groups

**Closure criteria:** 9 criteria

**No-regression boundary:** P71/P72/P73/P75/P77/P79 all must still pass

**No full lifetime exhaust required.**

---

## 3. GO / NO-GO Final Verdict

### 3.1 Verdict: CONDITIONAL_GO

**Endgame is worth doing — but only if it stays lightweight.**

### 3.2 GO Justification

1. **Thematic completion:** Renown's core theme is 名声 (reputation). Late-life covers "你晚年怎么过" but not "江湖怎么记住你". Endgame completes the thematic arc.

2. **3-branch leverage:** Three late-life branches create natural, meaningful endgame differentiation. Each path deserves its own "how they remember you" moment.

3. **Lightweight feasible:** The entire endgame can be done as 1 echo event + 6 expression updates. No new systems. No stat changes.

4. **Tavern-born flavor:** 酒肆传说 (tavern legend) is a natural tavern-born angle that enhances rather than dilutes the flavor.

5. **Low risk, bounded:** If P81 implementation starts creeping beyond scope, we can stop with no sunk cost beyond P80 design work.

### 3.3 Why Not Full GO

1. **Value is modest:** It's a coda, not a new act. The narrative value-add is real but not huge.

2. **Single origin:** Only tavern_hand has renown route, so replication value per stage is lower.

3. **Late-life is already strong:** P79 late-life provides excellent closure. Endgame is nice-to-have, not must-have.

4. **Scope creep risk is real:** Endgame could easily expand into a full chapter. Must be disciplined.

### 3.4 Non-Negotiable Conditions

P81 implementation **must** adhere to all of these. If any is violated, STOP and reassess:

1. ✅ 1 echo event maximum (not 3 separate events)
2. ✅ Expression updates only (no new systems/framework)
3. ✅ Auto event (not choice)
4. ✅ 3 variants max (one per late-life branch)
5. ✅ Single age window (60-65)
6. ✅ No stat changes
7. ✅ Tavern-born flavor preserved

---

## 4. P80 / P81 Boundary

| P80 (Design-First) | P81 (Implementation) |
|---------------------|---------------------|
| Prerequisite audit | — |
| Scope contract | — |
| GO/NO-GO assessment | — |
| Endgame direction & branch design | Event wiring implementation |
| Endgame contract (LOCKED) | Follows contract exactly |
| P81 validation shape definition | Targeted proof + regression tests |
| Closure report + handoff | Implementation + verification |

**P80 produces the contract; P81 implements it. No scope creep from P80 into P81.**

---

## 5. Deferred Renown-Expansion Items

The following remain deferred after P80:

| Item | Rationale | Suggested Stage |
|------|-----------|-----------------|
| Endgame / final legacy implementation | Design-only stage; implementation is P81 (if GO) | P81 (conditional) |
| Stat threshold gate implementation | Optional enhancement, not required | Future stage |
| Mentor-bond renown seed | Second seed route, high scope | Future cycle |
| Second renown achievement line (medical_sage_healer) | Single achievement line for now; second line is separate route | Future cycle |
| Peak / hybrid renown achievements (Wave 2/3) | Wave 1 only for now; peak/hybrid are later expansion | Future waves |
| Farm_peasant / town_apprentice renown bridges | Other origins out of scope | Future cycles |
| Full renown route expansion | Way beyond endgame scope | Far future |
| Cross-route interaction (renown × merchant) | No route interaction systems | Far future |
| Multiple endgame events per branch | 1 event per branch per contract | Future expansion |
| Endgame stat tradeoffs | Endgame is memory, not power | If player feedback demands |
| Additional expression surfaces | 6 surfaces already cover core UX | If player feedback demands |
| New UI components | Reuse existing expression surfaces | If player feedback demands |
| P19 generic endgame integration | Renown endgame is separate, route-specific | After P19 is proven |

---

## 6. Scope Compliance

### 6.1 Allowed Layers — All Used ✅

| Layer | Used? | Evidence |
|-------|-------|----------|
| Prerequisite audit | ✅ Yes | P80-001 |
| Scope contract | ✅ Yes | P80-002 |
| Endgame direction design | ✅ Yes | P80-003 |
| Endgame branch design | ✅ Yes | P80-004 |
| Endgame contract | ✅ Yes | P80-005 |
| Validation shape | ✅ Yes | P80-006 |
| Closure report | ✅ Yes | P80-007 (this document) |

### 6.2 Forbidden Expansions — All Avoided ✅

| Forbidden Expansion | Status | Notes |
|---------------------|--------|-------|
| Runtime event wiring | ✅ Not done | P80 is design-only; implementation is P81 |
| Expression code changes | ✅ Not done | No runtime changes in design-first stage |
| New framework or system | ✅ Not done | Zero new systems; all reuse existing architecture |
| Second renown seed | ✅ Not done | Single seed (ally_network) only |
| Other origins | ✅ Not done | Tavern_hand only |
| Multi-event endgame arc | ✅ Not done | 1 echo event with 3 variants — within lightweight |
| Stat threshold gate implementation | ✅ Not done | Optional enhancement |
| Bulk content wave | ✅ Not done | Design-only; no content production |
| New UI components | ✅ Not done | Reuse existing expression surfaces |
| Cross-route interactions | ✅ Not done | Single route focus |
| Full renown route expansion planning | ✅ Not done | Endgame-only scope |
| Full lifetime exhaust testing | ✅ Not done | Targeted proof only |
| P81 implementation work | ✅ Not done | P80 is contract only |

**Scope compliance: ✅ 100%**

---

## 7. Story Completion Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P80-001 | Audit renown endgame prerequisites | 1 | ✅ Pass |
| P80-002 | Lock P80 scope contract | 2 | ✅ Pass |
| P80-003 | Design endgame direction (GO/NO-GO assessment) | 3 | ✅ Pass |
| P80-004 | Design three endgame branches (if GO) | 4 | ✅ Pass |
| P80-005 | Define renown endgame contract | 5 | ✅ Pass |
| P80-006 | Define P81 validation shape (if GO) | 6 | ✅ Pass |
| P80-007 | Produce P80 closure report | 7 | ✅ Pass |

**7/7 stories: ✅ All passed**

---

## 8. Files Created

### Created (7 files)
- `docs/test-reports/p80-renown-endgame-prerequisite-audit.md` — Prerequisite audit
- `docs/test-reports/p80-renown-endgame-scope-contract.md` — Scope contract
- `docs/test-reports/p80-renown-endgame-direction-assessment.md` — GO/NO-GO + direction
- `docs/test-reports/p80-renown-endgame-branch-design.md` — 3 branch designs
- `docs/PRD/p80-renown-endgame-contract.md` — Endgame contract (LOCKED)
- `docs/test-reports/p80-p81-validation-shape.md` — P81 validation shape
- `docs/test-reports/p80-renown-endgame-closure-report.md` — This report

### Modified (2 files)
- `docs/PRD/p80-wuxia-renown-endgame-design-first.prd.json` — All 7 stories marked passes:true
- `progress.txt` — P80 progress recorded

---

## 9. Final Verdict

P80 is **complete and ready for handoff** to A1-verify, then (if GO confirmed) to P81 implementation.

The renown endgame design:
- **Direction:** Legacy Echo (身后名之声) — 江湖如何记住你
- **Shape:** Single auto echo event, 3 variants, age 60-65
- **Branches:** 叹 (bittersweet) / 遥 (mysterious) / 传 (warm)
- **Scope:** Lightweight — 1 event + 6 expression updates, no stat changes
- **Verdict:** CONDITIONAL_GO for P81 implementation
- **Flavor:** Tavern-born renown consistently preserved

**Next recommended step:** A1-verify P80 design, then proceed to P81 implementation (with strict lightweight discipline).

---

**P80-007 complete.** Closure report saved. 7/7 stories passed. CONDITIONAL_GO for P81.
