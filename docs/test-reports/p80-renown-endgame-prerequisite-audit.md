# P80 Renown Endgame — Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P80 Wuxia Renown Endgame Design-First Contract
> **Purpose:** Audit existing renown route assets, flags, markers, events, expressions — and assess endgame reuse potential

---

## 1. Executive Summary

The `jianghu_renown_sage` (江湖名宿) route now has 6 complete stages (bridge → entry → on-ramp → pressure → payoff → late-life) with 3 late-life branches. This audit inventories all existing assets and assesses what an endgame/final-legacy stage would build on.

**Foundation strength:** ✅ Strong — 6 stages deep, all verified, all stable.

**Key finding:** Three late-life branches create natural endgame branching points, but late-life already provides strong closure. Endgame must add clear added value (not "more content") to justify existence.

---

## 2. Renown Route Flag & Marker Inventory

### 2.1 Checkpoint Flags (Stage Gates)

| Flag | Stage | Set By | Purpose |
|------|-------|--------|---------|
| `tavern_renown_bridge_crossed | Bridge (P71) | ordinary_tavern_midlife_renown_bridge | Bridge checkpoint; entry into renown route |
| `route_renown_committed | Bridge (P71) | same | Route commitment flag |
| `renown_on_ramp_done | On-ramp (P73) | renown_on_ramp event | On-ramp checkpoint; gate for pressure |
| `renown_midlife_pressure_done | Pressure (P75) | renown_midlife_pressure event | Pressure checkpoint; gate for payoff |
| `renown_midlife_payoff_done | Payoff (P77) | renown_midlife_payoff event | Payoff checkpoint; gate for late-life |
| `renown_late_life_done | Late-life (P79) | renown_late_life_* events | Late-life checkpoint; gate for endgame (reserved) |
| `renown_late_life_identity_done | Late-life (P79) | same | Late-life identity deepening flag |
| `renown_age40_identity_done | Payoff (P77) | payoff event | Age-40 identity flag |

### 2.2 Branch / Identity Markers

| Marker | Stage | Branch | Purpose |
|--------|-------|--------|---------|
| `tavern_renown_on_ramp | On-ramp (P73) | — | On-ramp stage marker |
| `tavern_renown_pressure | Pressure (P75) | — | Pressure stage marker |
| `tavern_renown_payoff_hard_holder | Payoff (P77) | A: 硬扛到底 | Payoff choice A marker |
| `tavern_renown_payoff_breaker | Payoff (P77) | B: 撕破脸 | Payoff choice B marker |
| `tavern_renown_payoff_balancer | Payoff (P77) | C: 找到平衡 | Payoff choice C marker |
| `tavern_renown_late_burnout | Late-life (P79) | A: 油尽灯枯 | Late-life branch A marker |
| `tavern_renown_late_lone_wolf | Late-life (P79) | B: 逍遥自在 | Late-life branch B marker |
| `tavern_renown_late_mentor | Late-life (P79) | C: 传承授业 | Late-life branch C marker |

**Total:** 8 checkpoint flags + 8 stage/branch markers = 16 flags total

---

## 3. Renown Route Event Inventory

### 3.1 Spine Events (sample-lines-spine.json)

| Event ID | Type | Age | Stage | Branch |
|----------|------|-----|-------|--------|
| `renown_on_ramp | auto | 32–35 | On-ramp | — |
| `renown_midlife_pressure | auto | 37–41 | Pressure | — |
| `renown_midlife_payoff | choice | 43–47 | Payoff | 3 choices (A/B/C) |
| `renown_late_life_burnout | auto | 52–56 | Late-life | A: 油尽灯枯 |
| `renown_late_life_lone_wolf | auto | 52–56 | Late-life | B: 逍遥自在 |
| `renown_late_life_mentor | auto | 52–56 | Late-life | C: 传承授业 |

### 3.2 Bridge Event (ordinary-origin-midlife.json)

| Event ID | Type | Age | Stage |
|----------|------|-----|-------|
| `ordinary_tavern_midlife_renown_bridge | choice | 29 | Bridge |

**Total:** 7 events (1 bridge + 1 on-ramp + 1 pressure + 1 payoff + 3 late-life)

---

## 4. Expression Surface Inventory

### 4.1 Sample Line Expression (sampleLineExpression.ts)

| Surface | Function | Stages Covered |
|---------|----------|----------------|
| Route detection | `detectSampleLine()` | Bridge+ |
| Cost label | `deriveSampleLineCostLabel()` | Pressure → Payoff → Late-life |
| Current goal | `renownCurrentGoal()` | Bridge → On-ramp → Pressure → Payoff → Late-life |
| Age-40 identity | `renownAge40Identity()` | Payoff → Late-life |

### 4.2 Ordinary Origin Expression (ordinaryOriginExpression.ts)

| Surface | Function | Stages Covered |
|---------|----------|----------------|
| Current goal | `tavernCurrentGoal()` | Bridge → On-ramp → Pressure → Payoff → Late-life |
| Life memory | `tavernLifeMemory()` | Bridge → On-ramp → Pressure → Payoff → Late-life |
| Summary | `deriveOrdinaryOriginSummary()` | Bridge → On-ramp → Pressure → Payoff → Late-life |

**Total:** 7 expression surfaces × 6 stages = 42+ expression touchpoints (with branch variations)**

---

## 5. Three Late-Life Branch State Differences

### 5.1 Stat Differences

| Branch | rep | con | cha | Net |
|--------|-----|-----|-----|-----|
| A: 油尽灯枯 | +2 | +1 | -1 | +2 |
| B: 逍遥自在 | -1 | -2 | +3 | 0 |
| C: 传承授业 | +3 | +2 | +2 | +7 |

### 5.2 Identity Differences

| Branch | Late-Life Identity | Core Trait |
|--------|-------------------|------------|
| A: 油尽灯枯 | 油尽灯枯的老好人 | 守了一辈子名声，人熬干了 |
| B: 逍遥自在 | 逍遥自在的孤翁 | 无牵无挂，三教九流见多了 |
| C: 传承授业 | 德高望重的老前辈 | 指点后辈，掌柜智慧传下去 |

### 5.3 Expression Differences

| Surface | Branch A | Branch B | Branch C |
|---------|----------|----------|----------|
| Cost label | 油尽灯枯 | 逍遥自在 | 传承授业 |
| Current goal | 守住这一辈子的名声，撑到最后 | 无牵无挂，过好剩下的日子 | 指点后辈，把这一辈子的人情世故传下去 |
| Life memory | 守了一辈子名声 + 熬干了 + 老客人念你的好 | 逍遥大半辈子 + 三教九流喝酒 + 这才是活着 | 德高望重 + 后辈来请教 + 掌柜智慧传下去 |
| Summary | 江湖名宿 + 油尽灯枯 + 名声仍在人熬干了 | 江湖独行 + 逍遥自在 + 没人能拴住 | 江湖名宿 + 德高望重 + 智慧传下去 |

---

## 6. What Exists Before Endgame — Reusable Assets

### 6.1 Directly Reusable
- **Flag infrastructure: All 16 existing flags + marker pattern (checkpoint + branch marker)
- **Event pattern:** auto event with age_reach trigger + exclusivity guard
- **Expression pattern:** done-flag-first, branch-by-branch branching
- **3-branch structure:** Payoff choice → late-life consequence → endgame echo (natural chain)
- **Tavern-born flavor patterns:** 老掌柜、酒肆、三教九流、人情世故

### 6.2 Gaps for Endgame
- **No endgame checkpoint flag** (only `renown_late_life_done` is the latest)
- **No endgame-specific event** (no echo event defined yet
- **No endgame expression updates** (expression stops at late-life)
- **No endgame identity marker** (late-life identity is deepest so far)
- **No integration with generic P19 endgame echo system** (renown route doesn't hook into P19)

---

## 7. P19 Endgame Echo System Reuse Assessment

### 7.1 What P19 Provides
P19 established endgame/historical-memory closure system with:
- Endgame category differentiation (3-5 types)
- Pre-endgame recovery of relationships/enmities/factions/legacy
- Historical memory/posthumous reputation model
- Config-driven endgame surfaces

### 7.2 Reuse Potential for Renown Endgame

| Dimension | Reuse? | Notes |
|-----------|--------|-------|
| Endgame category framework | ⚠️ Partial | P19 is generic; renown endgame is route-specific echo |
| Historical memory model | ⚠️ Partial | Could be leveraged for "江湖如何记住你" angle |
| Config-driven pattern | ✅ Yes | Same event config pattern is reusable |
| Age-based trigger pattern | ✅ Yes | age_reach pattern already used throughout |
| Done-flag gating pattern | ✅ Yes | Standard pattern |

### 7.3 Key Distinction
P19 endgame is **generic, final end of life** (death/epilogue). Renown endgame should be **route-specific echo** (60+ life review/legacy coda) — earlier than final death, but after late-life. Different positioning matters.

---

## 8. Endgame Stage Readiness Assessment

### 8.1 Strengths
- 6-stage foundation, all verified & stable
- 3-branch structure creates natural endgame branching
- Tavern-born flavor consistently established
- Expression infrastructure mature & pattern clear

### 8.2 Risks/Open Questions
1. **Redundancy risk:** Late-life already provides strong closure — does endgame add enough value?
2. **Single origin:** Only tavern_hand — lower replication value
3. **Scope creep risk:** Endgame could easily expand
4. **P19 overlap:** Need clear distinction from generic endgame

### 8.3 If GO — What Endgame Would Need (Minimal)
- 1 echo event (auto, age 60-65)
- 3 variants (one per late-life branch)
- Endgame checkpoint flag
- Expression updates (sample line + ordinary origin)
- 2+ endgame-specific player-facing signals
- Clear distinction from both late-life AND generic P19 endgame

---

## 9. Conclusion

**Foundation readiness: ✅ Ready for design-first assessment**

The renown route has a strong 6-stage foundation with 3 late-life branches. The infrastructure (flags, events, expressions) is mature and the 3-branch structure creates natural endgame branching points.

**The open question is not "can we build endgame?" but "should we build endgame?"** — late-life already provides strong closure, and endgame must prove it adds meaningful value (not just "more content") to justify the route.

This audit provides the baseline for US-003 direction assessment (GO/NO-GO).

---

**P80-001 complete.** Prerequisite audit saved. 0 runtime changes.
