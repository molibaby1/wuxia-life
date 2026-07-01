# P78 Renown Late-Life Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P78 Wuxia Renown Late-Life Design-First
> **Purpose:** Audit existing renown route foundations before designing late-life branches

---

## 1. Executive Summary

Renown route (`jianghu_renown_sage`, tavern_hand + ally_network seed) has a complete 5-stage midlife foundation: bridge → entry → on-ramp → pressure → payoff. Three distinct payoff choices (硬扛/撕破脸/平衡) create clear branching points for late-life differentiation.

**Foundation strength:** ✅ Strong — 5 stages deep, all verified, all stable
**Late-life readiness:** ✅ Ready — three choice markers provide clear branching points
**Reusable assets:** 6 expression surfaces, 4 spine events, 7+ flags/markers

---

## 2. Existing Flags & Markers Inventory

### 2.1 Route & Bridge Flags

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `tavern_renown_bridge_crossed` | Bridge event (P71) | Bridge checkpoint — crossed from tavern_hand to renown | P71 |
| `route_renown_committed` | Bridge event (P71) | Route commitment flag | P71 |
| `ally_network` | Childhood seed | Prerequisite seed for bridge | P32 |

### 2.2 Stage Checkpoint Flags

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `renown_on_ramp_done` | On-ramp event (P73) | On-ramp checkpoint | P73 |
| `renown_midlife_pressure_done` | Pressure event (P75) | Pressure checkpoint | P75 |
| `renown_midlife_payoff_done` | Payoff event (P77) | Payoff checkpoint — upstream gate for late-life | P77 |
| `renown_age40_identity_done` | Payoff event (P77) | Age-40 identity deepening | P77 |

### 2.3 Stage Marker Flags (Flavor/Identity)

| Flag | Set By | Purpose | Stage |
|------|--------|---------|-------|
| `tavern_renown_on_ramp` | On-ramp event (P73) | On-ramp flavor marker | P73 |
| `tavern_renown_pressure` | Pressure event (P75) | Pressure flavor marker | P75 |

### 2.4 Payoff Choice Markers (Critical for Late-Life Branching)

**Exactly one of these three is set after payoff — these are the primary branching points for late-life.**

| Choice Marker | Choice | Identity | Net Stats | Late-Life Direction Hint |
|---------------|--------|----------|-----------|--------------------------|
| `tavern_renown_payoff_hard_holder` | Option A: 硬扛到底 | 硬撑面子的江湖好人 | rep+5, con+3, cha+2 = +10 | 声名之累 → burnout/health collapse |
| `tavern_renown_payoff_breaker` | Option B: 索性撕破脸 | 快意恩仇的独行侠 | rep-2, con-4, cha-1 = -7 | 快意恩仇 → loneliness/freedom |
| `tavern_renown_payoff_balancer` | Option C: 找到平衡 | 人情练达的江湖名宿 | rep+2, con+1, cha+3 = +6 | 人情练达 → mentorship/legacy |

### 2.5 Reserved Flags (From P76 Contract)

| Flag | Purpose | Stage |
|------|---------|-------|
| `renown_late_life_identity_done` | Late-life identity deepening (reserved) | P78+ |
| `renown_endgame_echo_done` | Endgame echo (reserved) | P80+ or later |

---

## 3. Existing Events Inventory

### 3.1 Spine Events (Sample-Line Chain)

| Event ID | Type | Age Range | Trigger | Stage | Purpose |
|----------|------|-----------|---------|-------|---------|
| `renown_on_ramp` | auto | 32–35 | age_reach 32 | P73 | On-ramp — "声名初显" |
| `renown_midlife_pressure` | auto | 37–41 | age_reach 37 | P75 | Pressure — "人情债重" |
| `renown_midlife_payoff` | choice | 43–47 | age_reach 43 | P77 | Payoff — "人情之解" (3 choices) |

### 3.2 Bridge Event (Ordinary Origin Midlife)

| Event ID | Type | Age | Trigger | Stage | Purpose |
|----------|------|-----|---------|-------|---------|
| `ordinary_tavern_midlife_renown_bridge` | choice | 29 | ally_network + ordinary_tavern_midlife_done guard | P71 | Bridge from tavern_hand to jianghu_renown_sage |

### 3.3 Event Record Markers

All spine events also set `event_record` targets:
- `renown_on_ramp`
- `renown_midlife_pressure`
- `renown_midlife_payoff`

---

## 4. Existing Expression Surfaces Inventory

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

| Surface | Function | Payoff Branches? | Notes |
|---------|----------|------------------|-------|
| Route detection | `detectSampleLine()` | N/A | Returns `'renown'` for bridge-crossed state |
| Cost label | `deriveSampleLineCostLabel()` | ✅ 3 choices | 声名之累 / 快意恩仇 / 人情练达 |
| Current goal | `renownCurrentGoal()` | ✅ 3 choices | 硬扛 / 撕破脸 / 找平衡 |
| Age-40 identity | `renownAge40Identity()` | ✅ 3 choices | 硬撑面子的好人 / 快意恩仇的独行侠 / 人情练达的名宿 |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

| Surface | Function | Payoff Branches? | Notes |
|---------|----------|------------------|-------|
| Current goal | `tavernCurrentGoal()` | ✅ 3 choices | Same as sample line |
| Life memory | `tavernLifeMemory()` | ✅ 3 choices | Payoff-specific memory text |
| Origin summary | `deriveOrdinaryOriginSummary()` | ✅ 3 choices | Payoff-specific summary |

### 4.3 Expression Gate Order (Existing)

For both sample line and ordinary origin, the gate priority order is:
1. `renown_midlife_payoff_done` + choice marker → payoff state
2. `renown_midlife_pressure_done` → pressure state
3. `renown_on_ramp_done` → on-ramp state
4. `tavern_renown_bridge_crossed` → bridge state
5. Base → tavern_hand baseline

---

## 5. Three Payoff Choice State Differences

### 5.1 Stat Differences (Cumulative Through Payoff)

Assuming baseline at bridge (approximate):

| Stat | Option A (硬扛) | Option B (撕破脸) | Option C (平衡) |
|------|-----------------|-------------------|-----------------|
| reputation | High (+10 total from on-ramp+pressure+payoff) | Medium-low (+6 total) | High (+8 total) |
| connections | High (+9 total) | Low (+2 total) | Medium (+7 total) |
| charisma | Medium (+5 total) | Low (+2 total) | High (+6 total) |
| **Net total** | **+24** | **+10** | **+21** |

### 5.2 Identity Differences

| Dimension | Option A (硬扛) | Option B (撕破脸) | Option C (平衡) |
|-----------|-----------------|-------------------|-----------------|
| Core identity | 硬撑面子的江湖好人 | 快意恩仇的独行侠 | 人情练达的江湖名宿 |
| Cost label | 声名之累 | 快意恩仇 | 人情练达 |
| Current goal | 硬扛所有人情债，保住江湖名声 | 撕破脸皮，断了不该还的债 | 拿捏人情往来的分寸，找到平衡 |
| Narrative tone | Tragic hero — sacrifice for reputation | Anti-hero — break free, live authentically | Wise moderate — balance, mastery |
| Tavern-born anchor | 打落牙齿和血吞的跑堂 | 三教九流见多了的老江湖 | 懂往来的掌柜智慧 |

### 5.3 Flag State Differences

| Flag Pattern | Option A | Option B | Option C |
|--------------|----------|----------|----------|
| `renown_midlife_payoff_done` | ✅ | ✅ | ✅ |
| `renown_age40_identity_done` | ✅ | ✅ | ✅ |
| `tavern_renown_payoff_hard_holder` | ✅ | ❌ | ❌ |
| `tavern_renown_payoff_breaker` | ❌ | ✅ | ❌ |
| `tavern_renown_payoff_balancer` | ❌ | ❌ | ✅ |

---

## 6. What Exists Before Late-Life vs What Can Be Reused

### 6.1 Reusable Assets

| Asset | Reuse for Late-Life? | How |
|-------|----------------------|-----|
| Sample line expression framework | ✅ Yes | Add late-life branches to existing gate order |
| Ordinary origin expression framework | ✅ Yes | Add late-life branches to existing gate order |
| Spine event infrastructure | ✅ Yes | Add late-life event to sample-lines-spine.json |
| Choice marker pattern | ✅ Yes | Reuse 3 payoff choice markers as branching input |
| Flag naming convention | ✅ Yes | Follow `renown_*_done` + `tavern_renown_*` pattern |
| Event type patterns (auto + choice) | ✅ Yes | Reuse existing event wiring patterns |

### 6.2 Gaps — What Needs to Be Created for Late-Life

| Gap | Description |
|-----|-------------|
| Late-life checkpoint flag | `renown_late_life_done` (or similar) — not yet defined |
| Late-life identity flag | `renown_late_life_identity_done` — reserved in P76, not yet defined |
| Late-life event | New spine event(s) for age 50+ |
| Late-life expression branches | Updates to sampleLineExpression.ts + ordinaryOriginExpression.ts |
| Late-life-specific markers | Per-branch identity markers (or reuse payoff markers) |
| Late-life stat changes | Per-branch stat adjustments |

---

## 7. Upstream Gate Readiness

### 7.1 Late-Life Upstream Gate

**Primary gate:** `renown_midlife_payoff_done`
- ✅ Already exists and is verified
- ✅ Set by payoff event at age 43–47
- ✅ Three choice markers provide branching input

### 7.2 Exclusivity Guards (Pattern to Reuse)

Existing pattern from prior stages:
```
!flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')
```

This pattern should continue for late-life events.

---

## 8. Tavern-Born Flavor Foundation

Renown route has consistently maintained tavern-born flavor across all 5 stages. Key flavor anchors:

| Flavor Anchor | Appears In |
|---------------|------------|
| 酒肆 / 酒肆跑堂 / 酒肆掌柜 | Bridge, on-ramp, pressure, payoff — all stages |
| 人情往来 / 面子 / 人情债 | All stages (core theme) |
| 三教九流 | Bridge, payoff Option B |
| 掌柜的智慧 | Payoff Option C |
| 打落牙齿和血吞 | Payoff Option A |
| 算盘 / 算账 | Pressure, payoff |

**Flavor consistency:** ✅ Excellent — every stage, every choice has tavern-specific imagery

---

## 9. Audit Conclusion

### Strengths
1. **Strong foundation:** 5 complete stages, all verified, all stable
2. **Clear branching points:** 3 payoff choice markers create natural late-life branches
3. **Reusable infrastructure:** Expression framework, event infrastructure, flag patterns all proven
4. **Flavor consistency:** Tavern-born renown flavor is well-established and consistent
5. **Reserved flags:** P76 already reserved late-life and endgame flag interfaces

### Risks
1. **Single origin only:** Only tavern_hand — replication value per stage is lower
2. **Narrative value question:** Does late-life add meaningful value or is payoff already a satisfying conclusion?
3. **Scope creep risk:** Easy to expand into endgame or multi-event late-life

### Readiness Verdict
**✅ Ready for late-life design.** The foundation is strong, branching points are clear, and the 3-choice structure creates meaningful differentiation opportunities. The key question for P78 is not "can we do it?" but "should we do it, and what shape should it take?"

---

*Audit complete. P78-001 passed. No runtime changes in this story.*
