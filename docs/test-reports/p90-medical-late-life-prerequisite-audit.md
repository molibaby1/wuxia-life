# P90 Medical Late-Life Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P90 Wuxia Medical Late-Life Design-First
> **Purpose:** Audit existing medical route foundations before designing late-life branches
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Executive Summary

Medical route (`medical_sage_healer`, tavern_hand seed) has a complete 5-stage midlife foundation: bridge → entry → on-ramp → pressure → payoff. The payoff stage features 2 variants × 3 choices = **6 distinct branches**, each with unique stats, flags, identities, and expressions — creating rich branching points for late-life differentiation.

This is **more complex than renown late-life** (which had only 3 branches), but also creates more opportunities for meaningful late-life narratives.

**Foundation strength:** ✅ Strong — 5 stages deep, all verified, all stable
**Late-life readiness:** ✅ Ready — 6 choice markers provide clear branching points (2× renown's complexity)
**Reusable assets:** 7 expression surfaces, 7 events (1 bridge + 6 spine), 15+ flags/markers
**Medical-unique opportunities:** 2-variant structure (compassionate vs pragmatic) × 3 choices each = richer late-life differentiation

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

### 2.3 Variant Marker Flags

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `tavern_medical_on_ramp_compassionate` | On-ramp event (P85) | Compassionate variant on-ramp marker | P85 |
| `tavern_medical_on_ramp_pragmatic` | On-ramp event (P85) | Pragmatic variant on-ramp marker | P85 |
| `tavern_medical_pressure_compassionate` | Pressure event (P87) | Compassionate variant pressure marker | P87 |
| `tavern_medical_pressure_pragmatic` | Pressure event (P87) | Pragmatic variant pressure marker | P87 |

### 2.4 Payoff Choice Markers (Critical for Late-Life Branching)

**Exactly one of these six is set after payoff — these are the primary branching points for late-life.**

| Choice Marker | Variant | Choice | Identity | Late-Life Direction Hint |
|---------------|---------|--------|----------|--------------------------|
| `tavern_medical_payoff_compassionate_holder` | Compassionate | A: 硬扛到底 | 油尽灯枯的仁心医者 | 身体彻底垮掉，但仍想多救一个人 |
| `tavern_medical_payoff_compassionate_let_go` | Compassionate | B: 学会放手 | 释然通透的医者 | 放下执念后，晚年反而更从容 |
| `tavern_medical_payoff_compassionate_legacy` | Compassionate | C: 找到传承 | 传道授业的仁医之师 | 徒弟独当一面，可以歇了 |
| `tavern_medical_payoff_pragmatic_holder` | Pragmatic | A: 硬扛人情 | 声名赫赫的权贵御医 | 靠山倒了，墙倒众人推 |
| `tavern_medical_payoff_pragmatic_breaker` | Pragmatic | B: 撕破脸皮 | 快意恩仇的江湖游医 | 行走江湖，自由自在 |
| `tavern_medical_payoff_pragmatic_master` | Pragmatic | C: 人情练达 | 人情练达的一代名医 | 年纪越大，面子越重 |

### 2.5 Reserved Flags (From P88 Contract)

| Flag | Purpose | Stage |
|------|---------|-------|
| `medical_late_life_done` | Late-life checkpoint (reserved) | P90+ |
| `medical_late_life_identity_done` | Late-life identity deepening (reserved) | P90+ |
| `medical_endgame_echo_done` | Endgame echo (reserved) | P92+ or later |

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

### 3.2 Bridge Event (Ordinary Origin Midlife)

| Event ID | Type | Age | Trigger | Stage | Purpose |
|----------|------|-----|---------|-------|---------|
| `ordinary_tavern_midlife_medical_bridge` | choice | 28 | tavern_hand + ordinary_tavern_midlife_done guard | P83 | Bridge from tavern_hand to medical_sage_healer |

### 3.3 Event Record Markers

All spine events also set `event_record` targets:
- `medical_on_ramp`
- `medical_pressure`
- `medical_payoff_compassionate`
- `medical_payoff_pragmatic`

---

## 4. Existing Expression Surfaces Inventory

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Function | Payoff Branches? | Notes |
|---------|----------|------------------|-------|
| Route detection | `detectSampleLine()` | N/A | Returns `'medical'` for bridge-crossed state |
| Cost label | `deriveSampleLineCostLabel()` | ✅ 6 branches | 油尽灯枯 / 释然行医 / 仁心传承 / 声名所累 / 快意江湖 / 人情练达 |
| Current goal | `medicalCurrentGoal()` | ✅ 6 branches | 6 unique goal texts |
| Age-40 identity | `medicalAge40Identity()` | ✅ 6 branches | 6 unique identities, all with tavern anchor |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Function | Payoff Branches? | Notes |
|---------|----------|------------------|-------|
| Current goal | `tavernCurrentGoal()` | ✅ 6 branches | Same as sample line |
| Life memory | `tavernLifeMemory()` | ✅ 6 branches | Payoff-specific memory text |
| Origin summary | `deriveOrdinaryOriginSummary()` | ✅ 6 branches | Payoff-specific summary |

### 4.3 Expression Gate Order (Existing)

For both sample line and ordinary origin, the gate priority order is:
1. `medical_payoff_done` + choice marker → payoff state (6 branches)
2. `medical_midlife_pressure_done` + variant marker → pressure state (2 branches)
3. `medical_on_ramp_done` + variant marker → on-ramp state (2 branches)
4. `tavern_medical_bridge_crossed` → bridge state
5. Base → tavern_hand baseline

---

## 5. Six Payoff Choice State Differences

### 5.1 Stat Differences (Cumulative Through Payoff)

Approximate cumulative stats from bridge through payoff (baseline = bridge entry):

| Stat | Comp. A (holder) | Comp. B (let_go) | Comp. C (legacy) | Prag. A (holder) | Prag. B (breaker) | Prag. C (master) |
|------|-----------------|------------------|------------------|------------------|-------------------|------------------|
| reputation | High (+11) | Medium (+6) | High (+9) | Very High (+14) | Low (+3) | High (+11) |
| constitution | Low (-4) | Medium (+1) | Medium (0) | Medium (-1) | High (+2) | Medium (0) |
| chivalry | Very High (+10) | Medium (+3) | High (+8) | Low (+1) | High (+7) | Medium (+4) |
| connections | Medium (+3) | Low (+1) | Medium (+4) | Very High (+10) | Very Low (-1) | High (+8) |
| charisma | Low (+1) | Medium (+5) | High (+7) | High (+6) | Low (+1) | Very High (+9) |
| money | Low (+0) | Low (+0) | Low (+0) | Very High (+190) | Low (+0) | High (+130) |

### 5.2 Identity Differences

| Dimension | Comp. A (holder) | Comp. B (let_go) | Comp. C (legacy) |
|-----------|-----------------|------------------|------------------|
| Core identity | 油尽灯枯的仁心医者 | 释然通透的医者 | 传道授业的仁医之师 |
| Cost label | 油尽灯枯 | 释然行医 | 仁心传承 |
| Narrative tone | Tragic sacrifice | Peaceful release | Warm mentorship |
| Tavern anchor | 酒肆里熬出来的苦孩子 | 看开了的老掌柜式通透 | 带徒弟的老掌柜 |

| Dimension | Prag. A (holder) | Prag. B (breaker) | Prag. C (master) |
|-----------|------------------|-------------------|------------------|
| Core identity | 声名赫赫的权贵御医 | 快意恩仇的江湖游医 | 人情练达的一代名医 |
| Cost label | 声名所累 | 快意江湖 | 人情练达 |
| Narrative tone | Burdened power | Free wandering | Wise mastery |
| Tavern anchor | 从跑堂到御医的爬天梯 | 三教九流见多了的老江湖 | 懂往来的酒肆智慧 |

### 5.3 Flag State Differences

| Flag Pattern | Comp. A | Comp. B | Comp. C | Prag. A | Prag. B | Prag. C |
|--------------|---------|---------|---------|---------|---------|---------|
| `medical_payoff_done` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `medical_age40_identity_done` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tavern_medical_payoff_compassionate_*` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `tavern_medical_payoff_pragmatic_*` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Variant pressure marker | compassionate | compassionate | compassionate | pragmatic | pragmatic | pragmatic |

---

## 6. What Exists Before Late-Life vs What Can Be Reused

### 6.1 Reusable Assets

| Asset | Reuse for Late-Life? | How |
|-------|----------------------|-----|
| Sample line expression framework | ✅ Yes | Add late-life branches to existing gate order (before payoff, after... wait — late-life comes AFTER payoff) |
| Ordinary origin expression framework | ✅ Yes | Add late-life branches to existing gate order |
| Spine event infrastructure | ✅ Yes | Add late-life event(s) to sample-lines-spine.json |
| Choice marker pattern | ✅ Yes | Reuse 6 payoff choice markers as branching input |
| Flag naming convention | ✅ Yes | Follow `medical_*_done` + `tavern_medical_*` pattern |
| Event type patterns (auto + choice) | ✅ Yes | Reuse existing event wiring patterns |
| 2-variant structure | ✅ Yes | Medical's 2-variant × 3-choice structure is unique and provides richer differentiation |
| Tavern-born healer flavor | ✅ Yes | Well-established across all 5 stages |

### 6.2 Gaps — What Needs to Be Created for Late-Life

| Gap | Description |
|-----|-------------|
| Late-life checkpoint flag | `medical_late_life_done` — reserved in P88, needs definition |
| Late-life identity flag | `medical_late_life_identity_done` — reserved in P88, needs definition |
| Late-life event(s) | New spine event(s) for age 50+ |
| Late-life expression branches | Updates to sampleLineExpression.ts + ordinaryOriginExpression.ts (6 branches) |
| Late-life-specific markers | Per-branch identity markers (or reuse payoff markers?) |
| Late-life stat changes | Per-branch stat adjustments |
| Late-life player-facing signals | 3+ late-life-specific signals beyond what payoff provides |

---

## 7. Upstream Gate Readiness

### 7.1 Late-Life Upstream Gate

**Primary gate:** `medical_payoff_done`
- ✅ Already exists and is verified
- ✅ Set by payoff events at age 42–47 (compassionate) / 43–47 (pragmatic)
- ✅ 6 choice markers provide branching input (2× renown's 3)
- ✅ 2 variants (compassionate + pragmatic) provide additional differentiation

### 7.2 Exclusivity Guards (Pattern to Reuse)

Existing pattern from prior stages:
```
!flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')
```

This pattern should continue for late-life events.

### 7.3 Trigger Timing

Renown late-life fires at age 52–56. Medical late-life should follow a similar pattern (age 50+), but may need slight variant-specific timing differences if narrative requires.

**Recommendation:** Single auto event at age 52–56 (same as renown) for consistency, with 6 internal branches based on payoff choice markers.

---

## 8. Tavern-Born Flavor Foundation

Medical route has consistently maintained tavern-born healer flavor across all 5 stages. Key flavor anchors:

| Flavor Anchor | Appears In |
|---------------|------------|
| 酒肆 / 酒肆跑堂 / 酒肆帮工 | Bridge, on-ramp, pressure, payoff — all stages |
| 老掌柜 | Bridge, on-ramp, payoff — all stages |
| 药庐 / 药铺 | On-ramp, pressure, payoff |
| 仁心 / 医者仁心 | Compassionate variant — all stages |
| 人情往来 / 世故 | Pragmatic variant — all stages |
| 苦孩子出身 | Compassionate variant |
| 三教九流 | Pragmatic variant (breaker choice) |
| 掌柜的智慧 | Both variants (legacy/master choices) |
| "从酒肆帮工到一代名医" | Age-40 identity — all 6 branches |

**Flavor consistency:** ✅ Excellent — every stage, every choice has tavern-specific imagery

---

## 9. Medical vs Renown Late-Life Comparison

### 9.1 Structural Differences

| Dimension | Medical Late-Life | Renown Late-Life |
|-----------|-------------------|------------------|
| **Branches** | 6 (2 variants × 3 choices) | 3 (1 variant × 3 choices) |
| **Variant structure** | 2 distinct variants (compassionate + pragmatic) | Single variant (jianghu renown) |
| **Core identity** | Healer / doctor | Jianghu reputation / networker |
| **Cost theme** | 仁心之累 + 世故之秤 (dual) | 人情债 (single) |
| **Flavor anchors** | 酒肆 + 药庐 + 医者 | 酒肆 + 江湖 + 人情 |
| **Stat profile** | More diverse (chivalry, constitution, connections, charisma, money) | More focused (reputation, connections, charisma) |

### 9.2 Medical-Unique Late-Life Opportunities

1. **Dual-variant late-life:** Compassionate and pragmatic variants can have fundamentally different late-life arcs — not just different flavors, but different narrative directions
2. **Healer-specific late-life themes:** Aging body, fading skills, legacy of healing, medical ethics, teacher-student relationships
3. **6-branch richness:** More branches = more nuanced late-life experiences
4. **Tavern-born healer specificity:** The "从酒肆帮工到一代名医" arc is unique and provides rich late-life reflection material

### 9.3 Medical-Unique Constraints

1. **Higher complexity:** 6 branches vs renown's 3 = more design and implementation work
2. **Risk of dilution:** With 6 branches, some might feel thin or reskinned if not carefully designed
3. **Variant weakening risk:** Compassionate and pragmatic late-life might end up feeling like mirror images if not carefully differentiated

---

## 10. Audit Conclusion

### Strengths
1. **Strong foundation:** 5 complete stages, all verified, all stable
2. **Rich branching points:** 6 payoff choice markers (2× renown's 3) create natural late-life branches
3. **Dual-variant structure:** Compassionate vs pragmatic provides unique differentiation opportunity
4. **Reusable infrastructure:** Expression framework, event infrastructure, flag patterns all proven
5. **Flavor consistency:** Tavern-born medical healer flavor is well-established and consistent
6. **Reserved flags:** P88 already reserved late-life and endgame flag interfaces

### Risks
1. **6-branch complexity:** 2× renown's complexity — risk of design dilution or inconsistency
2. **Variant weakening:** Compassionate and pragmatic late-life might feel like mirrors
3. **Narrative value question:** Does late-life add meaningful value or is payoff already satisfying? (6 branches = higher bar)
4. **Scope creep risk:** Easy to expand into endgame or multi-event late-life

### Readiness Verdict
**✅ Ready for late-life design.** The foundation is strong, branching points are clear and numerous (6 vs renown's 3), and the dual-variant structure provides unique differentiation opportunities. The key question for P90 is not "can we do it?" but "how do we make 6 branches all feel meaningful and different, and how do we ensure compassionate vs pragmatic variants feel fundamentally different in late-life?"

---

*Audit complete. P90-001 passed. No runtime changes in this story.*
