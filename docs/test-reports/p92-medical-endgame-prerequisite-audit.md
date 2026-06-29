# P92 Medical Endgame Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P92 Wuxia Medical Endgame Design-First
> **Purpose:** Audit existing medical route foundations before designing endgame / final legacy
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)
> **Late-Life Branches:** 6 (2 variants × 3 choices)

---

## 1. Executive Summary

Medical route (`medical_sage_healer`, tavern_hand seed) has a complete **6-stage foundation**: bridge → entry → on-ramp → pressure → payoff → late-life. The late-life stage features **2 variants × 3 choices = 6 distinct branches**, each with unique stats, flags, identities, and expressions — creating rich branching points for endgame differentiation.

This is **more complex than renown endgame** (which had only 3 branches from a single variant), but also creates more opportunities for meaningful endgame narratives.

**Foundation strength:** ✅ Very Strong — 6 stages deep, all verified, all stable
**Endgame readiness:** ✅ Ready — 6 late-life branch markers provide clear branching points (2× renown's complexity)
**Reusable assets:** 5 expression surfaces, 7+ events (1 bridge + 6 spine), 20+ flags/markers
**Medical-unique opportunities:** 2-variant structure (compassionate vs pragmatic) × 3 choices each = richer endgame differentiation
**P19 endgame echo system:** Exists at platform level — provides historical memory framework, but route-specific thematic coda is still valuable

---

## 2. Existing Flags & Markers Inventory

### 2.1 Route & Bridge Flags

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `tavern_medical_bridge_crossed` | Bridge event (P83) | Bridge checkpoint — crossed from tavern_hand to medical | P83 |
| `route_medical_committed` | Bridge event (P83) | Route commitment flag | P83 |
| `medical_pure` | Bridge event (P83) | Key-choice dim 2 for medical_sage_healer gate | P83 |
| `medical_talent` | Bridge event (P83) | Medical talent marker | P83 |

### 2.2 Stage Checkpoint Flags

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `medical_on_ramp_done` | On-ramp event (P85) | On-ramp checkpoint (shared by both variants) | P85 |
| `medical_midlife_pressure_done` | Pressure event (P87) | Pressure checkpoint (shared by both variants) | P87 |
| `medical_payoff_done` | Payoff event (P89) | Payoff checkpoint — upstream gate for late-life | P89 |
| `medical_age40_identity_done` | Payoff event (P89) | Age-40 identity deepening | P89 |
| `medical_late_life_done` | Late-life event (P91) | Late-life checkpoint — upstream gate for endgame | P91 |
| `medical_late_life_identity_done` | Late-life event (P91) | Late-life identity deepening | P91 |

### 2.3 Variant Marker Flags

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `tavern_medical_on_ramp_compassionate` | On-ramp event (P85) | Compassionate variant on-ramp marker | P85 |
| `tavern_medical_on_ramp_pragmatic` | On-ramp event (P85) | Pragmatic variant on-ramp marker | P85 |
| `tavern_medical_pressure_compassionate` | Pressure event (P87) | Compassionate variant pressure marker | P87 |
| `tavern_medical_pressure_pragmatic` | Pressure event (P87) | Pragmatic variant pressure marker | P87 |

### 2.4 Payoff Choice Markers

| Choice Marker | Variant | Choice | Late-Life Branch |
|---------------|---------|--------|-----------------|
| `tavern_medical_payoff_compassionate_holder` | Compassionate | A: 硬扛到底 | Comp-A: 最后仁心 |
| `tavern_medical_payoff_compassionate_let_go` | Compassionate | B: 学会放手 | Comp-B: 从容自在 |
| `tavern_medical_payoff_compassionate_legacy` | Compassionate | C: 找到传承 | Comp-C: 仁心传承 |
| `tavern_medical_payoff_pragmatic_holder` | Pragmatic | A: 硬扛人情 | Prag-A: 人走茶凉 |
| `tavern_medical_payoff_pragmatic_breaker` | Pragmatic | B: 撕破脸皮 | Prag-B: 逍遥自在 |
| `tavern_medical_payoff_pragmatic_master` | Pragmatic | C: 人情练达 | Prag-C: 德高望重 |

### 2.5 Late-Life Branch Markers (Critical for Endgame Branching)

**Exactly one of these six is set after late-life — these are the primary branching points for endgame.**

| Branch Marker | Variant | Late-Life Branch | Endgame Direction Hint |
|---------------|---------|------------------|-----------------------|
| `tavern_medical_late_compassionate_final` | Compassionate | 最后仁心（燃尽自己） | "身后名" — 人们如何记住这位燃尽自己的医者 |
| `tavern_medical_late_compassionate_peaceful` | Compassionate | 从容自在（颐养天年） | "善终" — 平静地走完一生，留下什么 |
| `tavern_medical_late_compassionate_legacy` | Compassionate | 仁心传承（桃李满天下） | "薪火相传" — 徒弟们如何传承你的仁心 |
| `tavern_medical_late_pragmatic_fallen` | Pragmatic | 人走茶凉（失势跌落） | "世态炎凉" — 失势后，谁还记得你 |
| `tavern_medical_late_pragmatic_wanderer` | Pragmatic | 逍遥自在（云游四方） | "逍遥游" — 江湖上流传的老游医传说 |
| `tavern_medical_late_pragmatic_master` | Pragmatic | 德高望重（一代名医） | "医名远播" — 一生圆满，福寿双全的传说 |

### 2.6 Reserved Flags (From P90 Contract)

| Flag | Purpose | Stage |
|------|---------|-------|
| `medical_endgame_echo_done` | Endgame echo checkpoint (reserved) | P92+ |

---

## 3. Existing Events Inventory

### 3.1 Spine Events (Sample-Line Chain)

| Event ID | Type | Age Range | Trigger | Variant | Stage | Purpose |
|----------|------|-----------|---------|---------|-------|---------|
| `medical_on_ramp_compassionate` | auto | 31-34 | age_reach 31 | Compassionate | P85 | On-ramp — "医名初起" |
| `medical_on_ramp_pragmatic` | auto | 31-34 | age_reach 31 | Pragmatic | P85 | On-ramp — "医名初起" |
| `medical_pressure_compassionate` | auto | 36-40 | age_reach 36 | Compassionate | P87 | Pressure — "仁心之累" |
| `medical_pressure_pragmatic` | auto | 37-41 | age_reach 37 | Pragmatic | P87 | Pressure — "世故之秤" |
| `medical_payoff_compassionate` | choice | 42-46 | age_reach 42 | Compassionate | P89 | Payoff — "仁心之解" (3 choices) |
| `medical_payoff_pragmatic` | choice | 43-47 | age_reach 43 | Pragmatic | P89 | Payoff — "世故之解" (3 choices) |
| `medical_late_life_compassionate_final` | auto | 52-56 | payoff_done + compassionate_holder | Compassionate | P91 | Late-life — 最后仁心 |
| `medical_late_life_compassionate_peaceful` | auto | 52-56 | payoff_done + compassionate_let_go | Compassionate | P91 | Late-life — 从容自在 |
| `medical_late_life_compassionate_legacy` | auto | 52-56 | payoff_done + compassionate_legacy | Compassionate | P91 | Late-life — 仁心传承 |
| `medical_late_life_pragmatic_fallen` | auto | 52-56 | payoff_done + pragmatic_holder | Pragmatic | P91 | Late-life — 人走茶凉 |
| `medical_late_life_pragmatic_wanderer` | auto | 52-56 | payoff_done + pragmatic_breaker | Pragmatic | P91 | Late-life — 逍遥自在 |
| `medical_late_life_pragmatic_master` | auto | 52-56 | payoff_done + pragmatic_master | Pragmatic | P91 | Late-life — 德高望重 |

### 3.2 Bridge Event (Ordinary Origin Midlife)

| Event ID | Type | Age | Trigger | Stage | Purpose |
|----------|------|-----|---------|-------|---------|
| `ordinary_tavern_midlife_medical_bridge` | choice | 28 | tavern_hand + ordinary_tavern_midlife_done guard | P83 | Bridge from tavern_hand to medical_sage_healer |

---

## 4. Existing Expression Surfaces Inventory

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Function | Late-Life Branches? | Notes |
|---------|----------|---------------------|-------|
| Route detection | `detectSampleLine()` | N/A | Returns `'medical'` for bridge-crossed state |
| Cost label | `deriveSampleLineCostLabel()` | ✅ 6 branches | 最后仁心 / 从容自在 / 仁心传承 / 人走茶凉 / 逍遥自在 / 德高望重 |
| Current goal | `medicalCurrentGoal()` | ✅ 6 branches | 6 unique goal texts |
| Age-40 / late-life identity | `medicalAge40Identity()` | ✅ 6 branches | 6 unique identities, all with tavern anchor |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Function | Late-Life Branches? | Notes |
|---------|----------|---------------------|-------|
| Current goal | `tavernCurrentGoal()` | ✅ 6 branches | Same as sample line |
| Life memory | `tavernLifeMemory()` | ✅ 6 branches | Late-life-specific memory text |
| Origin summary | `deriveOrdinaryOriginSummary()` | ✅ 6 branches | Late-life-specific summary |

### 4.3 Expression Gate Order (Existing — Late-Life First)

For both sample line and ordinary origin, the gate priority order is:
1. `medical_late_life_done` + late-life branch marker → late-life state (6 branches)
2. `medical_payoff_done` + choice marker → payoff state (6 branches)
3. `medical_midlife_pressure_done` + variant marker → pressure state (2 branches)
4. `medical_on_ramp_done` + variant marker → on-ramp state (2 branches)
5. `tavern_medical_bridge_crossed` → bridge state
6. Base → tavern_hand baseline

**Endgame would slot in at position 0** (before late-life), following the same done-flag-first pattern.

---

## 5. Six Late-Life Branch State Differences

### 5.1 Identity Differences

| Dimension | Comp-A (最后仁心) | Comp-B (从容自在) | Comp-C (仁心传承) |
|-----------|-------------------|-------------------|-------------------|
| Core identity | 燃尽自己的最后仁心 | 从容自在的老者 | 仁心满天下的老宗师 |
| Cost label | 最后仁心 | 从容自在 | 仁心传承 |
| Narrative tone | Tragic sacrifice | Peaceful release | Warm mentorship |
| Tavern anchor | 酒肆里熬出来的苦孩子 | 看开了的老掌柜式通透 | 带徒弟的老掌柜 |

| Dimension | Prag-A (人走茶凉) | Prag-B (逍遥自在) | Prag-C (德高望重) |
|-----------|-------------------|-------------------|-------------------|
| Core identity | 失势的老御医 | 逍遥自在的老游医 | 德高望重的老名医 |
| Cost label | 人走茶凉 | 逍遥自在 | 德高望重 |
| Narrative tone | Fallen grace | Free wandering | Wise mastery |
| Tavern anchor | 从跑堂到御医的爬天梯 | 三教九流见多了的老江湖 | 懂往来的酒肆智慧 |

### 5.2 Stat Differences (Cumulative Through Late-Life)

Approximate cumulative stats from bridge through late-life:

| Stat | Comp-A | Comp-B | Comp-C | Prag-A | Prag-B | Prag-C |
|------|--------|--------|--------|--------|--------|--------|
| reputation | High (+13) | Medium (+7) | High (+13) | Very High (+11) | Low (+3) | High (+15) |
| constitution | Very Low (-7) | Medium (+3) | Medium (0) | Low (-2) | High (+4) | Low (-1) |
| chivalry | Very High (+13) | Medium (+4) | High (+10) | Low (+1) | High (+9) | Medium (+4) |
| connections | Medium (+3) | Low (+1) | High (+6) | High (+6) | Very Low (-4) | Very High (+11) |
| charisma | Medium (+2) | High (+8) | Very High (+9) | High (+8) | Medium (+3) | Very High (+12) |
| money | Low (+0) | Low (+0) | Low (+0) | Very High (+188) | Low (+0) | High (+132) |

### 5.3 Flag State Differences

| Flag Pattern | Comp-A | Comp-B | Comp-C | Prag-A | Prag-B | Prag-C |
|--------------|--------|--------|--------|--------|--------|--------|
| `medical_late_life_done` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `medical_late_life_identity_done` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tavern_medical_late_compassionate_*` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `tavern_medical_late_pragmatic_*` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Variant pressure marker | compassionate | compassionate | compassionate | pragmatic | pragmatic | pragmatic |

---

## 6. What Exists Before Endgame vs What Can Be Reused

### 6.1 Reusable Assets

| Asset | Reuse for Endgame? | How |
|-------|---------------------|-----|
| Sample line expression framework | ✅ Yes | Add endgame branches to existing gate order (before late-life) |
| Ordinary origin expression framework | ✅ Yes | Add endgame branches to existing gate order |
| Spine event infrastructure | ✅ Yes | Add endgame event(s) to sample-lines-spine.json |
| Late-life branch marker pattern | ✅ Yes | Reuse 6 late-life markers as branching input |
| Flag naming convention | ✅ Yes | Follow `medical_*_done` + `tavern_medical_*` pattern |
| Event type patterns (auto) | ✅ Yes | Reuse existing auto event wiring pattern |
| 2-variant structure | ✅ Yes | Medical's 2-variant × 3-choice structure is unique |
| Tavern-born healer flavor | ✅ Yes | Well-established across all 6 stages |
| P19 historical memory framework | ✅ Partial | Platform-level endgame system exists; route-specific echo adds thematic depth |

### 6.2 Gaps — What Needs to Be Created for Endgame

| Gap | Description |
|-----|-------------|
| Endgame checkpoint flag | `medical_endgame_echo_done` — reserved in P90, needs definition |
| Endgame identity flag | `medical_endgame_identity_done` — identity deepening (new) |
| Endgame event(s) | New spine event(s) for age 60+ |
| Endgame expression branches | Updates to sampleLineExpression.ts + ordinaryOriginExpression.ts (6 branches) |
| Endgame-specific markers | Per-branch identity markers (6 new markers) |
| Endgame player-facing signals | 2+ endgame-specific signals beyond what late-life provides |

---

## 7. Upstream Gate Readiness

### 7.1 Endgame Upstream Gate

**Primary gate:** `medical_late_life_done`
- ✅ Already exists and is verified
- ✅ Set by late-life events at age 52–56
- ✅ 6 late-life branch markers provide branching input (2× renown's 3)
- ✅ 2 variants (compassionate + pragmatic) provide additional differentiation

### 7.2 Exclusivity Guards (Pattern to Reuse)

Existing pattern from prior stages:
```
!flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')
```

This pattern should continue for endgame events.

### 7.3 Trigger Timing

Renown endgame fires at age 60–65. Medical endgame should follow a similar pattern (age 60+), consistent with the north-star methodology.

**Recommendation:** Single auto echo event at age 60–65 (same as renown) for consistency, with 6 internal branches based on late-life branch markers.

---

## 8. Tavern-Born Flavor Foundation

Medical route has consistently maintained tavern-born healer flavor across all 6 stages. Key flavor anchors:

| Flavor Anchor | Appears In |
|---------------|------------|
| 酒肆 / 酒肆跑堂 / 酒肆帮工 | Bridge, on-ramp, pressure, payoff, late-life — all stages |
| 老掌柜 | Bridge, on-ramp, payoff, late-life — all stages |
| 药庐 / 药铺 | On-ramp, pressure, payoff, late-life |
| 仁心 / 医者仁心 | Compassionate variant — all stages |
| 人情往来 / 世故 | Pragmatic variant — all stages |
| 苦孩子出身 | Compassionate variant |
| 三教九流 | Pragmatic variant (breaker choice) |
| 掌柜的智慧 | Both variants (legacy/master choices) |
| "从酒肆帮工到一代名医" | Age-40 identity + late-life identity — all 6 branches |
| 熬药的味道 | Compassionate variant (final/peaceful branches) |
| 人情账 / 算盘珠子 | Pragmatic variant |

**Flavor consistency:** ✅ Excellent — every stage, every choice has tavern-specific imagery

---

## 9. Medical vs Renown Endgame Comparison

### 9.1 Structural Differences

| Dimension | Medical Endgame | Renown Endgame |
|-----------|-----------------|----------------|
| **Branches** | 6 (2 variants × 3 choices) | 3 (1 variant × 3 choices) |
| **Variant structure** | 2 distinct variants (compassionate + pragmatic) | Single variant (jianghu renown) |
| **Core identity** | Healer / doctor | Jianghu reputation / networker |
| **Endgame theme** | 医名身后事 — 世人如何记住这位医者 | 身后名之声 — 江湖如何记住你 |
| **Flavor anchors** | 酒肆 + 药庐 + 医者 + 仁心/世故 | 酒肆 + 江湖 + 人情 |
| **Axis differentiation** | Body/spirit (compassionate) vs social/position (pragmatic) | Single axis — jianghu reputation |

### 9.2 Medical-Unique Endgame Opportunities

1. **Dual-variant endgame:** Compassionate and pragmatic variants can have fundamentally different endgame directions — not just different flavors, but different narrative questions
2. **Healer-specific endgame themes:** Legacy of healing, medical ethics, what it means to save lives, who remembers the healer
3. **6-branch richness:** More branches = more nuanced endgame experiences
4. **Tavern-born healer specificity:** The "从酒肆帮工到一代名医" arc provides rich endgame reflection material
5. **Body/spirit vs social/position:** The two-variant axis creates natural endgame differentiation — compassionate endgame is about personal/spiritual legacy, pragmatic endgame is about social/historical reputation

### 9.3 Medical-Unique Constraints

1. **Higher complexity:** 6 branches vs renown's 3 = more design and implementation work
2. **Risk of dilution:** With 6 branches, some might feel thin or reskinned if not carefully designed
3. **Variant weakening risk:** Compassionate and pragmatic endgame might end up feeling like mirror images if not carefully differentiated
4. **Redundancy risk:** P19 generic endgame echo already provides historical memory — route-specific echo must add clear value

---

## 10. P19 Endgame Echo Reuse Assessment

### 10.1 What P19 Provides

P19 is a **platform-level endgame system** that provides:
- Endgame category differentiation (3-5 types)
- Pre-endgame relationship/faction/legacy recovery
- Historical memory / posthumous reputation model
- Endgame summary upgrade

### 10.2 What Route-Specific Endgame Echo Adds

A route-specific endgame echo (like renown's P80/P81) adds:
- **Thematic depth:** Route-specific narrative coda, not generic endgame
- **Identity deepening:** Route-specific identity markers and expression
- **Flavor preservation:** Tavern-born healer-specific imagery and tone
- **Branching precision:** 6 route-specific branches vs generic P19 categories
- **Timing control:** Route-specific age window (60-65) vs P19's end-of-life timing

### 10.3 Reuse Verdict

**Conclusion:** P19 provides the platform-level endgame framework, but route-specific echo events add significant value through thematic depth and identity differentiation. Medical endgame echo should:
- ✅ Coexist with P19 (not replace it)
- ✅ Fire earlier (age 60-65) as a route-specific coda
- ✅ Focus on medical-specific legacy and memory
- ✅ Follow the same lightweight pattern as renown endgame

---

## 11. Audit Conclusion

### Strengths
1. **Very strong foundation:** 6 complete stages, all verified, all stable
2. **Rich branching points:** 6 late-life branch markers (2× renown's 3) create natural endgame branches
3. **Dual-variant structure:** Compassionate vs pragmatic provides unique differentiation opportunity
4. **Reusable infrastructure:** Expression framework, event infrastructure, flag patterns all proven
5. **Flavor consistency:** Tavern-born medical healer flavor is well-established and consistent
6. **Reserved flags:** P90 already reserved endgame flag interfaces
7. **Proven pattern:** Renown endgame (P80/P81) provides a clear template to follow
8. **P19 platform:** P19 endgame echo system exists at platform level; route-specific echo complements it

### Risks
1. **6-branch complexity:** 2× renown's complexity — risk of design dilution or inconsistency
2. **Variant weakening:** Compassionate and pragmatic endgame might feel like mirrors
3. **Redundancy with P19:** P19 already provides endgame/historical memory — route echo must add clear value
4. **Scope creep risk:** Easy to expand into multi-event endgame or full end-of-life system
5. **Narrative value question:** Does endgame add meaningful value or is late-life already satisfying? (6 branches = higher bar)

### Readiness Verdict
**✅ Ready for endgame design.** The foundation is very strong (6 stages deep), branching points are clear and numerous (6 vs renown's 3), and the dual-variant structure provides unique differentiation opportunities. The key question for P92 is not "can we do it?" but:
1. "Is endgame worth doing for medical route?" (GO/NO-GO assessment)
2. "If GO, how do we make 6 branches all feel meaningful and different?"
3. "How do we ensure compassionate vs pragmatic variants feel fundamentally different in endgame?"
4. "How does route-specific endgame echo add value beyond P19 generic endgame?"

---

*Audit complete. P92-001 passed. No runtime changes in this story.*
