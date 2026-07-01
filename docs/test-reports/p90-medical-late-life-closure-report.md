# P90 Medical Late-Life Design-First — Closure Report

> **Date:** 2026-06-29
> **Stage:** P90 Wuxia Medical Late-Life Design-First
> **Branch:** `codex/p90-wuxia-medical-late-life-design-first`
> **Status:** Complete — 6/6 user stories passed
> **Route:** `medical_sage_healer`（一代名医）
> **Origin:** `tavern_hand`（酒肆帮工）
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)
> **Branches:** 2 variants × 3 choices = 6 late-life branches

---

## 1. Executive Summary

P90 successfully delivered the **design-first contract** for the `medical_sage_healer` (一代名医) late-life stage. After careful design and assessment of 6 branches (2 variants × 3 choices each), we recommend **GO for P91 late-life implementation**, with the condition that scope stays bounded (1 auto event + expression updates).

**What was delivered:**
- Prerequisite audit — 5-stage foundation verified, 15+ flags/markers inventoried, 6-branch structure analyzed
- Scope contract — 6 allowed layers, 16 forbidden expansions, clear boundaries, GO/NO-GO criteria
- 6 late-life branches designed — 最后仁心 / 从容自在 / 仁心传承 / 人走茶凉 / 逍遥自在 / 德高望重 (one per payoff choice)
- Late-life contract LOCKED — full event spec, expression updates, gate acceptance criteria
- P91 validation shape defined — 48+ core proof nodes, ~60-70 regression tests, 14 closure criteria
- This closure report — with explicit GO/NO-GO recommendation

**Key design decision:** Late-life is a **single auto event with 6 branches** (branching based on payoff choice marker). This is bounded, leverages the 2-variant × 3-choice structure, and each branch has meaningful differentiation.

**Key variant-level insight:** Compassionate and pragmatic late-life explore fundamentally different axes:
- **Compassionate late-life = inward (body + spirit):** What did a lifetime of healing do to *you*?
- **Pragmatic late-life = outward (social + position):** What did a lifetime of playing the game do to your *place in the world*?

This is NOT a mirrored structure — the two variants have different core questions, different stat profiles, different narrative tones, and different tavern-born flavor anchors.

**GO recommendation:** ✅ **GO** for P91 late-life implementation. Conditions: maintain bounded scope (1 event + expressions), preserve tavern-born healer flavor, 6 branches must remain meaningfully different, 2 variants must remain fundamentally different axes.

---

## 2. Stage Outputs Summary

### 2.1 Prerequisite Audit (P90-001)

**File:** `docs/test-reports/p90-medical-late-life-prerequisite-audit.md`

**Key findings:**
- ✅ 5-stage foundation (bridge + entry + on-ramp + pressure + payoff) — all verified, all stable
- ✅ 15+ flags/markers inventoried — clear branching points from payoff (6 choice markers)
- ✅ 7 events cataloged — 1 bridge + 2 on-ramp + 2 pressure + 2 payoff
- ✅ 7 expression surfaces mapped — sample line (3) + ordinary origin (4)
- ✅ 6 payoff choice state differences documented — stats, identity, flags, narrative
- ✅ Tavern-born healer flavor consistency confirmed across all stages
- ✅ Medical-unique opportunities identified: 2-variant structure, healer-specific themes, 6-branch richness
- ✅ Medical-unique constraints identified: higher complexity, risk of dilution, variant weakening

**Foundation strength: Strong** — ready for late-life design. 6 branches = 2× renown's complexity, but also 2× the differentiation opportunity.

### 2.2 Scope Contract (P90-002)

**File:** `docs/test-reports/p90-medical-late-life-scope-contract.md`

**Key boundaries:**
- 6 allowed layers: audit, scope, branch design, contract, validation shape, closure
- 16 forbidden expansions: runtime wiring, new framework, endgame design, second seed, other origins, plague/pure expansion, etc.
- 4 scope guardrails: boundedness, flavor, differentiation (6-branch + 2-variant), GO/NO-GO
- GO/NO-GO criteria defined (8 for GO, 8 for NO-GO)
- Rollback strategy defined (full + partial scenarios)
- 6 branches is upper bound — allow reduction to 4-5 if some feel weak

**Scope compliance: ✅ 100%** — all work stayed within allowed layers. Zero runtime changes.

### 2.3 Branch Design (P90-003)

**File:** `docs/test-reports/p90-medical-late-life-branch-design.md`

**Design decision:** Single auto event with 6 branches (bounded, leverages 2-variant × 3-choice structure)

**Six branches:**

**Compassionate (仁心医者 — body/spirit axis):**

| Branch | Payoff Choice | Core Narrative | Tone | Net Stats | Tavern Anchor |
|--------|--------------|----------------|------|-----------|---------------|
| Comp-A: 最后仁心 | 硬扛到底 (holder) | 燃尽自己照亮别人，身体垮了但仁心不改 | Tragic / transcendent | +3 | 老掌柜的眼泪 |
| Comp-B: 从容自在 | 学会放手 (let_go) | 放下执念，晚年反而过得从容 | Peaceful / wise | +7 | 老掌柜的笑 |
| Comp-C: 仁心传承 | 找到传承 (legacy) | 徒弟们散在各地，仁心传了一辈又一辈 | Warm / fulfilling | +10 | 老掌柜的欣慰 |

**Pragmatic (世故人医 — social/position axis):**

| Branch | Payoff Choice | Core Narrative | Tone | Net Stats | Tavern Anchor |
|--------|--------------|----------------|------|-----------|---------------|
| Prag-A: 人走茶凉 | 硬扛人情 (holder) | 爬得高摔得重，靠山一倒墙倒众人推 | Bitter / complex | -6 | 老掌柜的叹息 |
| Prag-B: 逍遥自在 | 撕破脸皮 (breaker) | 撕破所有假人情，行走江湖逍遥自在 | Free / adventurous | +3 | 老掌柜的笑骂 |
| Prag-C: 德高望重 | 人情练达 (master) | 人情练达一辈子，晚年人人敬重 | Satisfied / respected | +13 | 老掌柜的得意 |

**6-branch differentiation: ✅ Excellent** — each branch has distinct narrative, tone, stats, identity, tavern anchor, emotional beat. Not reskinned.

**2-variant differentiation: ✅ Excellent** — compassionate = body/spirit axis (inward); pragmatic = social/position axis (outward). Fundamentally different questions, different stat profiles, different tavern flavor anchors. NOT mirrored.

**Distinction from renown late-life: ✅ Clear** — different number of branches (6 vs 3), different variant structure (2 vs 1), different core axes (healer body/spirit + social position vs jianghu 人情债), different identity (healer vs networker).

**Late-life value assessment: ✅ Adds meaningful value** — delivers on payoff "future shadow" promises, makes payoff choice feel more consequential, provides emotional closure, 6-branch + 2-variant variety exceeds renown late-life.

### 2.4 Late-Life Contract (P90-004)

**File:** `docs/PRD/p90-medical-late-life-contract.md`

**Contract highlights:**
- **Event ID:** `medical_late_life`
- **Type:** auto (consequence of prior choice, not new choice)
- **Age range:** 52–56
- **Upstream gate:** `medical_payoff_done`
- **Branching logic:** Based on payoff choice marker (6 options: 3 compassionate + 3 pragmatic)
- **Checkpoint:** `medical_late_life_done` + `medical_late_life_identity_done`
- **6 branch markers:** `tavern_medical_late_compassionate_final` / `_peaceful` / `_legacy` + `tavern_medical_late_pragmatic_fallen` / `_wanderer` / `_master`
- **5 core late-life signals:** cost label, current goal, late-life identity, life memory, origin summary
- **5 expression surfaces × 6 branches = 30 expression updates**
- **Reserved future flag:** `medical_endgame_echo_done`
- **Gate acceptance criteria:** pre-late-life + post-late-life
- **Flavor constraints:** 6 rules for tavern-born healer flavor + variant differentiation

**Contract quality: ✅ Clear and unambiguous** — P91 can pick this up without rework.

### 2.5 P91 Validation Shape (P90-005)

**File:** `docs/test-reports/p90-p91-validation-shape.md`

**Validation plan:**
- **48+ core proof nodes:** baseline, event fires, 6 branches (flags+stats), cost label, current goal
- **Bonus proof nodes:** late-life identity, life memory, origin summary, full chain traceback, variant differentiation
- **~60-70 regression tests** across 9 groups
- **14 closure criteria** for P91 (matching P89's 14-criteria pattern)
- **Regression boundaries:** P83/P84/P85/P87/P89 medical stages + renown late-life/payoff + merchant
- **No full lifetime exhaust required** — targeted proof + narrow regression sufficient

---

## 3. GO / NO-GO Assessment

### 3.1 GO Criteria Check

| # | GO Criterion | Status | Evidence |
|---|-------------|--------|----------|
| 1 | 6 late-life branches are meaningfully differentiated (not reskinned) | ✅ Pass | Different narrative, tone, stats, identity, tavern anchor, emotional beat — all 6 distinct |
| 2 | 2 variants have fundamentally different late-life directions | ✅ Pass | Compassionate = body/spirit (inward); Pragmatic = social/position (outward) — NOT mirrored |
| 3 | Each branch has clear tavern-born healer flavor | ✅ Pass | Each branch has distinct tavern anchors (眼泪/笑/欣慰 vs 叹息/笑骂/得意) |
| 4 | Late-life adds meaningful narrative value beyond payoff | ✅ Pass | Delivers on payoff "future shadow"; makes choice feel consequential; provides emotional closure |
| 5 | Implementation scope is bounded (1 event + expression updates) | ✅ Pass | Single auto event + 5 expression surfaces; consistent with prior medical stages |
| 6 | Contract is clear enough for P91 to pick up without rework | ✅ Pass | Full event spec, expression details, gate criteria, validation shape all defined |
| 7 | 2-variant × 3-choice structure is leveraged | ✅ Pass | Late-life would be less interesting without 6 branches + 2-variant depth |
| 8 | Clearly differentiated from renown late-life | ✅ Pass | 6 vs 3 branches, 2 vs 1 variants, healer vs jianghu identity, different axes |

**All 8 GO criteria satisfied.**

### 3.2 NO-GO Criteria Check

| # | NO-GO Criterion | Status | Notes |
|---|----------------|--------|-------|
| 1 | Late-life feels like "more of the same" | ❌ Not true | Each branch has distinct emotional tone and narrative direction; 2 variants explore different axes |
| 2 | 6 branches are basically reskinned | ❌ Not true | Substantial differences across all dimensions — narrative, tone, stats, identity, flavor |
| 3 | Compassionate and pragmatic variants feel like mirrors | ❌ Not true | Different axes (body/spirit vs social/position), different stat profiles, different flavors, different core questions |
| 4 | Payoff already feels like a satisfying conclusion | ❌ Not true | Payoff is "the choice"; late-life is "the consequence" — adds a new life stage layer |
| 5 | Implementation scope would balloon beyond 1 event | ❌ Not true | Bounded design: 1 auto event + expression updates only |
| 6 | Tavern-born healer flavor can't be maintained | ❌ Not true | Each branch has strong, distinct tavern anchors — both variants |
| 7 | Narrative value doesn't justify implementation effort | ❌ Not true | 6-branch + 2-variant structure = high value density; leverages existing infrastructure |
| 8 | Too similar to renown late-life | ❌ Not true | Different structure, different axes, different identity, different flavor |

**None of the NO-GO criteria triggered.**

### 3.3 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep in P91 (adding more events) | Medium | High | Contract clearly states 1 event only; validation shape enforces bounded scope |
| Flavor dilution in implementation | Low | Medium | Contract has explicit flavor constraints; P91 proof includes flavor check |
| 6 branches feel thin / rushed | Medium | Medium | Design is detailed but implementation must maintain quality; allow cutting weakest branch if needed |
| Variant weakening — compassionate and pragmatic feel too similar | Low | Medium | Contract has explicit variant axis differentiation; P91 tests include variant diff verification |
| Single origin = lower replication value | High (known) | Medium | Accepted tradeoff — medical route is still proving itself; quality > quantity |
| Late-life doesn't land emotionally | Low | Medium | 6 different tones + 2 axes increase chance at least some resonate; can tune in P91 if needed |

### 3.4 Final Verdict

## ✅ GO for P91 Late-Life Implementation

**Why GO:**
1. **Strong foundation:** 5 stages deep, all verified, all stable
2. **6-branch meaningful differentiation:** All 6 branches feel genuinely different — not reskinned
3. **2-variant fundamental differentiation:** Compassionate vs pragmatic explore different axes — not mirrored
4. **Narrative value:** Delivers on payoff "future shadow" promises; makes payoff choice feel more consequential
5. **Bounded scope:** 1 auto event + expression updates — consistent with prior stages
6. **Tavern-born healer flavor:** Each branch has strong, distinct tavern anchors — both variants
7. **Leverages 2-variant × 3-choice structure:** More interesting than renown late-life (3 branches, 1 variant)
8. **Clearly differentiated from renown late-life:** Different structure, different axes, different identity
9. **Contract clarity:** P91 can pick this up without rework

**Conditions for P91:**
1. **Maintain bounded scope:** 1 auto event + expression updates only — no multi-event expansion
2. **Preserve tavern-born healer flavor:** All expression updates must feel tavern-specific, not generic old doctor
3. **Keep 6 branches differentiated:** Each branch must maintain distinct identity and narrative
4. **Keep 2 variants on different axes:** Compassionate = body/spirit; Pragmatic = social/position — NOT mirrored
5. **Follow the contract:** Implement exactly what's defined in `p90-medical-late-life-contract.md`
6. **No scope creep without new PRD:** Any expansion beyond the contract requires a new design stage

**If any condition is violated in P91, revert to P89 payoff-only state.**

---

## 4. Boundary with P91

| P90 (Design-First) | P91 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Scope contract | Expression updates in sampleLineExpression.ts |
| 6 branch designs | Expression updates in ordinaryOriginExpression.ts |
| Late-life contract (LOCKED) | Targeted proof document |
| P91 validation shape | Regression tests (~60-70 tests) |
| Closure report + GO/NO-GO | Closure report |

**P91 must deliver on everything defined in `p90-medical-late-life-contract.md`. No scope expansion beyond what's defined in P90 without a new PRD.**

---

## 5. Deferred Medical-Expansion Items

The following remain deferred after P90:

| Item | Rationale | Suggested Stage |
|------|-----------|-----------------|
| Endgame / final legacy deepening | Late-life stage only; endgame is later | P92+ or later |
| Stat threshold gate implementation | Optional enhancement, not required | Future stage |
| Other origins (farm_peasant / town_apprentice) medical bridges | Other origins out of scope | Future cycles |
| Plague hero / medical pure full choice line | Expansion beyond current scope | Future content wave |
| Poison path as main route | Alternative medical route, not focus | Future "dark healer" route |
| Full medical system / herbalism / clinic management | Platform-level change — dwarfs late-life scope | Far future |
| Medical × merchant / renown cross-route interactions | No route interaction systems | Far future |
| Orthodox/demonic childhood seed medical route | Only tavern-born ordinary origin in scope | Low priority |
| Multiple late-life events per variant | Bounded scope = 1 event only | Future expansion if justified |
| Choice stat tradeoff tuning | Initial design; balance passes implementation | After P91 playtesting |
| Additional expression surfaces | 5 surfaces already cover core UX | If player feedback demands |
| Second medical seed (other childhood seeds) | Single seed route for now | Future cycle |

---

## 6. Files Created

### Created (8 files)
- `docs/PRD/p90-wuxia-medical-late-life-design-first.md` — PRD truth document (product spec)
- `docs/test-reports/p90-medical-late-life-prerequisite-audit.md` — Prerequisite audit
- `docs/test-reports/p90-medical-late-life-scope-contract.md` — Scope contract
- `docs/test-reports/p90-medical-late-life-branch-design.md` — 6 branch designs
- `docs/PRD/p90-medical-late-life-contract.md` — Late-life contract (LOCKED)
- `docs/test-reports/p90-p91-validation-shape.md` — P91 validation shape
- `docs/test-reports/p90-medical-late-life-closure-report.md` — This report
- `docs/PRD/p90-wuxia-medical-late-life-design-first.prd.json` — PRD execution index

### Modified (1 file)
- `progress.txt` — Progress tracking

**Zero runtime code changes — pure design-first stage.**

---

## 7. Story Completion Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P90-001 | Audit medical late-life prerequisites | 1 | ✅ Pass |
| P90-002 | Lock P90 scope contract | 2 | ✅ Pass |
| P90-003 | Design six late-life branches (per payoff choice) | 3 | ✅ Pass |
| P90-004 | Define medical late-life contract | 4 | ✅ Pass |
| P90-005 | Define P91 validation shape | 5 | ✅ Pass |
| P90-006 | Produce P90 closure report | 6 | ✅ Pass |

**6/6 stories: ✅ All passed**

---

## 8. 14 Closure Criteria

Following the P88→P89 validation shape pattern (14 closure criteria):

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Prerequisite audit complete and thorough | ✅ Met | 10 sections, 15+ flags inventoried, 7 events cataloged, 6-branch analysis, renown comparison |
| 2 | Scope contract locked with clear boundaries | ✅ Met | 9 sections, 6 allowed layers, 16 forbidden items, GO/NO-GO criteria |
| 3 | 6 late-life branches designed (2 variants × 3 choices) | ✅ Met | Full branch design doc with narrative, stats, flavor, expression |
| 4 | 2 variants have fundamentally different late-life axes | ✅ Met | Compassionate = body/spirit (inward); Pragmatic = social/position (outward) |
| 5 | 6 branches are meaningfully differentiated | ✅ Met | Different narrative, tone, stats, identity, flavor, core question — all 6 |
| 6 | Late-life contract is clear and unambiguous | ✅ Met | Full event spec, 6 branch details, 30 expression updates, gate criteria |
| 7 | Tavern-born healer flavor preserved in all branches | ✅ Met | Each branch has distinct tavern anchors — 6 different flavors of tavern |
| 8 | Clearly differentiated from renown late-life | ✅ Met | 6 vs 3 branches, 2 vs 1 variants, healer vs jianghu identity, different axes |
| 9 | P91 validation shape defined | ✅ Met | 48+ core nodes, ~60-70 tests, 14 closure criteria, regression boundaries |
| 10 | Endgame flag interface reserved | ✅ Met | `medical_endgame_echo_done` reserved in contract |
| 11 | Zero runtime code changes | ✅ Met | Pure design-first stage — no code modified |
| 12 | GO/NO-GO recommendation explicit with rationale | ✅ Met | Full GO with 8 criteria satisfied, 0 NO-GO triggered, risks documented |
| 13 | All 6 user stories passed | ✅ Met | P90-001 through P90-006 all complete |
| 14 | P91 can pick up without rework | ✅ Met | Contract + validation shape + closure report all clear and complete |

**14/14 closure criteria satisfied. ✅**

---

## 9. Final Verdict

P90 is **complete and ready for handoff** to P91 implementation (GO).

The medical late-life design is:
- **Well-scoped:** 1 auto event + expression updates, bounded and verifiable
- **Richly differentiated:** 6 branches with distinct narratives, tones, stats, and identities
- **Variant depth:** 2 variants explore fundamentally different axes (body/spirit vs social/position) — NOT mirrored
- **Flavorful:** Each branch has strong tavern-born healer anchors — not generic old doctor
- **Valuable:** Delivers on payoff "future shadow" promises; makes the payoff choice feel more consequential
- **Clearly distinct from renown:** Different structure, different axes, different identity, different flavor
- **Ready to implement:** Contract is clear, validation shape is defined, P91 can pick this up directly

**Next step:** A1-verify, then proceed to P91 late-life implementation (GO — maintain scope discipline).

---

**P90-006 complete.** Closure report saved. 6/6 stories passed. GO for P91.
