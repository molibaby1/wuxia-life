# P113 Founding Patriarch Bridge Gap Audit

> **Stage:** P113 Wuxia Founding Patriarch Bridge (Narrow Playable)  
> **Story:** P113-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P112-N01, GAP-NS8-02

## 1. Purpose

Document existing `founding_patriarch` achievement/traceability assets and isolate missing spine/sample-line hooks so P113 targets the correct bounded bridge wiring surface without reopening P35/P37 pinnacle lifetime traces or P102–P112 patron spine.

---

## 2. Existing Assets (Pre-P113)

### 2.1 Pinnacle achievement definition

| Asset | Location | Status |
| ----- | -------- | ------ |
| Outcome ID | `wuxiaOriginSurfaces.ts` → `founding_patriarch` | ✅ Defined — tier `pinnacle`, dual-gate |
| Requirements | skill_growth≥70, social_capital≥70, resources≥55, `p16_alliance_brokered` (choice), `p16_scholar_mentor` (luck) | ✅ Gate defined |
| Cross-tracks | scholar mentor + faction alliance | ✅ Aligned with 开派祖师 |

### 2.2 Traceability / simulation proof

| Asset | Location | Status |
| ----- | -------- | ------ |
| P37 habit-led lifetime | `p37AdditionalMixedPinnacleLifetimeSlices.ts` | ✅ `p37_pinnacle_founding_patriarch_habit_zero_lifetime` |
| P37 trace report | `p37-pinnacle-founding-patriarch-lifetime-trace.md` | ✅ scholar_mentor + faction continuation |
| Achievement traceability | `achievementTraceability.ts` | ✅ choiceFlags + midLifeConsequenceSurfaces |
| P39 content pool | `p39ContentPoolConsistencySlice.ts` | ✅ Referenced |
| P25 rare-window waste | `rareWindowWasteSlice.ts` | ✅ `pinnacle_patriarch_grind_no_luck` control |

### 2.3 Scholar/faction content (partial)

| Asset | Location | Status |
| ----- | -------- | ------ |
| Faction continuation | `p22-content-expansions.json` → `p22_faction_sect_continuation` | ✅ Sets `p16_alliance_brokered` |
| Scholar mentor rare line | `scholar_mentor_line` | ✅ Probabilistic; sets `p16_scholar_mentor` |
| Orthodox sample line | `sample-lines-spine.json` orthodox milestones | ✅ Generic orthodox identity chain |

### 2.4 Patron spine (closed — do not reopen)

| Stage | Scope | P113 relationship |
| ----- | ----- | ----------------- |
| P102–P112 | `merchant_martial_patron` bridge → endgame echo | **Regression guard only** |

---

## 3. Missing Layers (P113 Target)

### 3.1 No founding-patriarch bridge spine events

| Gap | Description |
| --- | ----------- |
| No patriarch bridge entry | No sample-line spine event reads scholar/faction commitment flags and sets founding-patriarch checkpoint beyond flavor |
| No patriarch payoff/echo | No lightweight P93-style terminal echo for founding-patriarch path |
| No patriarch checkpoint flags | No `founding_patriarch_bridge_crossed` / `founding_patriarch_on_ramp_done` / `founding_patriarch_payoff_done` in spine |

**Impact:** Players with `p16_scholar_mentor` + `p16_alliance_brokered` can unlock pinnacle via P37 sim/trace only; no playable event-driven bridge comparable to P102 patron or P63 magnate.

### 3.2 No founding-patriarch expression differentiation

| Surface | Reads patriarch bridge markers? | Status |
| ------- | ------------------------------- | ------ |
| `orthodoxCurrentGoal` | ❌ | No founding-patriarch branch |
| `orthodoxAge40Identity` | ❌ | No founding-patriarch branch |
| `deriveSampleLineCostLabel` (orthodox) | ❌ | Flat `守正代价` only |

**Impact:** Even if flags were set manually, player-facing text would read as generic orthodox success or renown on-ramp.

### 3.3 No bounded cross-route bridge sample

| Path | Bridge to founding_patriarch? | Notes |
| ---- | ----------------------------- | ----- |
| `scholar_house` + faction continuation | ❌ Spine hook | P37 habit-led trace only |
| Renown endgame (P79–P81) | ❌ | Different outcome tier |
| `jianghu_myth_legend` (P35) | ❌ Closed lifetime trace | Not reopened |

---

## 4. Prerequisite Flags (P22/P37 Evidence)

| Flag | Source | Role in founding-patriarch bridge |
| ---- | ------ | --------------------------------- |
| `p16_scholar_mentor` | `scholar_mentor_line` rare roll | Luck gate evidence |
| `p22_faction_continuation_active` | `p22_faction_sect_continuation` accept | Faction commitment signal |
| `p16_alliance_brokered` | `p22_faction_sect_continuation` accept | Choice gate evidence |
| `orthodox_childhood_seed_done` | Orthodox spine childhood | Sample-line orthodox context |
| `sect_exposure` / `joined_sect` | Youth/sect exposure | Faction continuation precondition |

**P37 terminal bridge flags:** `[p16_alliance_brokered, p16_scholar_mentor]` — P113 spine entry should align with this evidence chain.

---

## 5. Founding Patriarch vs Renown vs Myth-Legend — Scope Boundary

| Dimension | `founding_patriarch` (P113 target) | `jianghu_renown_sage` (P79–P81) | `jianghu_myth_legend` (P35 closed) |
| --------- | ---------------------------------- | ------------------------------- | ---------------------------------- |
| Focus | 门派延续 + 学者盟约 + 开派祖师 | 江湖声名 + 人情债 | 稀有线 + Guardian oath |
| Entry spine | **New** `founding_patriarch_bridge_entry` | `tavern_renown_bridge_crossed` chain | P35 lifetime trace only |
| Mid/late chain | **Lightweight** payoff echo only (P93 pattern) | Full renown pressure → endgame | Full pinnacle lifetime |
| Sample line | `orthodox` (scholar/faction) | `renown` | N/A (trace only) |
| Coexistence | Orthogonal to renown sample line | Does not read scholar mentor flags | Separate outcome |

---

## 6. Gap Inventory

| Gap | ID | P113 story |
| --- | -- | ---------- |
| No patriarch spine entry | GAP-P113-01 | P113-003 |
| No patriarch expression | GAP-P113-02 | P113-004 |
| No proof/tests | GAP-P113-03 | P113-005 |
| No scope contract | GAP-P113-04 | P113-002 |

---

## 7. Non-goals (this audit)

- No gameplay / JSON content changes
- No P37 lifetime trace rewrite
- No P102–P112 patron spine reopen
- No full faction empire graph audit
