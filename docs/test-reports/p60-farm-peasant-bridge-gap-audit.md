# P60 Farm-Peasant Bridge Gap Audit

> **Date:** 2026-06-28
> **Stage:** P60 design-first wave for `farm_peasant` bridge
> **Purpose:** Audit existing `farm_peasant` assets, identify bridge-seed gaps, and explain why the P58 apprentice pattern cannot be reused directly.

## 1. Executive Summary

`farm_peasant` is the only ordinary origin without a clear, repo-grounded bridge seed into a mixed destiny. While `town_apprentice` has a natural trade-curiosity → trade-network → partnership chain (wired in P58) and `tavern_hand` has an ally-network → referral chain (wired in P59), `farm_peasant` only has a vague "outside offer" midlife fork that points directionally outward but does not land on any specific downstream system.

This audit confirms: the core gap is **not** a missing gate flag — it is the absence of a narrative-specific, system-anchored bridge seed that explains *what* a peasant does when they leave the village, and *which* mixed destiny they naturally feed into.

## 2. Current Farm-Peasant Asset Inventory

### 2.1 Early-Life Flags and Choices (Ages 8–15)

**Source:** `ordinary-origin-early-life.json`

| Choice ID | Age | Prompt | Options | Flags Set |
|-----------|-----|--------|---------|-----------|
| `ordinary_peasant_plow_fork` | 10–14 | 开春农忙，父亲让你选：守在家田，还是跟邻村换工队出远门？ | 守家田 | `peasant_steadfast_field`, `ordinary_peasant_midlife_seed` |
| | | | 跟换工队 | `peasant_swap_crew_curiosity`, `ordinary_peasant_midlife_seed` |

**Key signal:** `peasant_swap_crew_curiosity` establishes early wanderlust and exposure to life outside the village — but only through seasonal labor exchange, not trade or social climbing.

### 2.2 Midlife Events and Choices (Ages 28–30)

**Source:** `ordinary-origin-midlife.json`

| Event ID | Age | Condition | Options | Flags Set |
|----------|-----|-----------|---------|-----------|
| `ordinary_peasant_midlife_steadfast` | 28 | `peasant_steadfast_field && !ordinary_peasant_midlife_done` | 继续耕种 | `peasant_midlife_steadfast_accrual`, `ordinary_peasant_midlife_done` |
| | | | 租田收租 | `peasant_midlife_steadfast_accrual`, `peasant_rent_out_fields`, `ordinary_peasant_midlife_done` |
| `ordinary_peasant_midlife_outside_offer` | 30 | `peasant_swap_crew_curiosity && !ordinary_peasant_midlife_done` | 留在村里 | `peasant_midlife_outside_offer`, `peasant_refuse_outside`, `ordinary_peasant_midlife_done` |
| | | | 去镇上试试 | `peasant_midlife_outside_offer`, `peasant_accept_outside`, `ordinary_peasant_midlife_done` |

**Key signal:** `peasant_accept_outside` is the closest thing to a bridge trigger, but it carries **no downstream commitment flag** (no `route_*` flag, no `*_bridge_crossed` flag). It is narratively open-ended ("去镇上试试") but systemically a dead end.

### 2.3 Expression Surfaces

**Source:** `src/p56/ordinaryOriginExpression.ts`

| Surface | Peasant Bridge-Relevant Content |
|---------|---------------------------------|
| `peasantCurrentGoal()` | "外面的机会在招手，村里还是镇上？" (midlife-outside-offer state) |
| `peasantLifeMemory()` | "你决定去镇上试试，离开生活了三十年的村子。" (accept-outside branch) |
| `deriveOrdinaryOriginSummary()` | "平凡农人的中年：在田地与机会之间，守住或换路。" (midlife generic) |

**Key signal:** Expression surfaces acknowledge the "outside" fork but provide **no post-bridge identity text**. Once a peasant accepts the outside offer, there is no "you became a X" or "you踏上了 Y 之路" narrative.

### 2.4 World-Profile Surface

**Source:** `src/narrative/profile/wuxiaOriginSurfaces.ts`

| Field | Value |
|-------|-------|
| Label | 普通农户 |
| Tier | ordinary |
| Regional background | rural |
| Event bias tags | `labor` (×1.45), `seasonal` (×1.35), `family` (×1.12) |
| Shaping tendencies | endurance +0.16, discipline +0.08, caution +0.10 |

**Key signal:** The peasant profile is anchored in **labor, seasonal rhythm, and rural family** — not trade, craft, or social networks. This makes a direct merchant bridge narratively weaker than for apprentice or tavern_hand.

### 2.5 Downstream Wiring Evidence

| Downstream Target | Wiring Status for Peasant | Evidence |
|-------------------|--------------------------|----------|
| `merchant_magnate` | **No wiring** | `sample-lines-spine.json` has zero `peasant` references; no `route_wealth_committed` flag on any peasant choice |
| `jianghu_renown_sage` | **Theoretical only** | P25 wiring evidence mentions "`jianghu_renown_sage` via `mentor_bond` path fixtures" but no concrete bridge seed or events |
| `merchant_martial_patron` | **No wiring** | No merchant-route + martial-training seed chain for peasant |
| `healer_swordsman` | **No wiring** | No medical-path seed for peasant |

**Conclusion:** `farm_peasant` has **zero runtime bridge wiring** into any mixed-destiny gate. The P25 mention of `jianghu_renown_sage` via `mentor_bond` is a fixture-level note, not a playable path.

## 3. Gap Analysis: What's Missing

### 3.1 Missing: A Specific Bridge Seed

The `peasant_accept_outside` flag says "去镇上试试" but never answers:
- **What kind of work?** Helper at a shop? Manual labor at a dock? Security for a caravan?
- **What skill or connection grows?** Trade knowledge? Martial skill from caravan guards? Medical knowledge from helping a village healer?
- **Which existing system does it feed?** Merchant route? Jianghu renown? Something else?

Without a specific seed event, any bridge implementation would have to invent the seed from scratch — which is exactly the scope risk P60 is designed to avoid.

### 3.2 Missing: A Natural Downstream Target

Apprentice → merchant makes sense because:
- Apprentices already work in a town shop environment
- "学跑外市" directly builds trade curiosity
- Partnership is a natural escalation from craft to commerce

Tavern hand → merchant makes sense because:
- Taverns are information and connection hubs
- "帮账房记流水、认江湖客人" builds network and financial literacy
- Ally referral is a natural escalation from service to opportunity

Peasant → ??? is unclear because:
- Peasant's existing fork is "守田" vs "外出" — not "labor" vs "trade"
- Leaving the village does not inherently mean commerce
- The peasant profile is anchored in labor/seasonal/family, not business/network

### 3.3 Missing: Bridge Commitment Flags

No peasant choice sets:
- `route_wealth_committed` (merchant-route gate)
- `mentor_bond` (jianghu-renown-sage gate)
- `*_bridge_crossed` (any bridge-specific flag)

The `peasant_accept_outside` flag is a midlife choice marker, not a bridge-crossing flag.

### 3.4 Missing: Post-Bridge Expression

There is no expression text for the state "peasant has crossed a bridge into X path." The expression system stops at the "decided to leave" moment.

## 4. Why P58 Apprentice Pattern Cannot Be Directly Reused

### 4.1 Narrative Fit Gap

| Dimension | Apprentice (P58) | Peasant (P60) |
|-----------|------------------|---------------|
| **Starting environment** | Urban shop, already embedded in commerce | Rural village, isolated from market systems |
| **Bridge seed origin** | Built-in — "学跑外市" is one of two childhood forks | External — "商人路过村子" is a random outsider offer |
| **Skill continuity** | Craft skill → trade skill is a natural lateral move | Farm labor → ??? requires a new skill domain |
| **Identity continuity** | "Apprentice who became a merchant" preserves the craft background | "Peasant who became a merchant" risks losing the peasant identity |

### 4.2 System Fit Gap

| Dimension | Apprentice (P58) | Peasant (P60) |
|-----------|------------------|---------------|
| **Trade-route seed** | `apprentice_trade_curiosity` → `apprentice_midlife_trade_network` chain exists | No trade-related flag chain exists |
| **Gate expansion cost** | Minimal — add bridge flag to existing gate expressions | Medium — would need a new seed event chain before gate expansion |
| **Expression cost** | Minimal — 3 surfaces × bridge branch | Medium — need seed expression + bridge expression |

### 4.3 Scope Risk of Direct Reuse

If we force `peasant_accept_outside` → `route_wealth_committed` → `merchant_magnate`:

1. **Identity collapse:** The peasant origin becomes "merchant with extra steps" — the rural/labor identity is erased by the merchant path
2. **Narrative hollow:** "去镇上试试" cannot credibly skip to "合伙经商" — there's a missing skill-building and relationship-building phase
3. **Precedent danger:** If peasant→merchant is this easy, why have separate ordinary origins at all?

## 5. Bridge-Seed Opportunity Areas

While the gap is real, there are promising anchors in existing assets:

### 5.1 Labor → Escort → Jianghu Renown

- **Anchor:** `peasant_swap_crew_curiosity` + physical endurance from farm labor
- **Logic:** Peasant's strength and stamina from farm work → caravan guard/escort work → jianghu connections → `jianghu_renown_sage`
- **Narrative fit:** High — physical labor translates naturally to physical protection work
- **System fit:** Medium — `jianghu_renown_sage` requires `mentor_bond` or `ally_network`; would need a new seed

### 5.2 Swap Crew → Trade → Merchant-Adjacent

- **Anchor:** `peasant_swap_crew_curiosity` + seasonal migration pattern
- **Logic:** Following harvest cycles → learning about grain/commodity trade → small-scale trade → `merchant_magnate` or `merchant_martial_patron`
- **Narrative fit:** Medium — grain trade is plausible for a peasant, but less direct than apprentice
- **System fit:** Medium-high — merchant gate exists but needs a peasant-specific seed chain

### 5.3 Rural Healer → Medical → Healer-Swordsman

- **Anchor:** Farm life + rural self-sufficiency + `seasonal` event bias
- **Logic:** Learning herbal medicine from village elders → helping with injuries → medical path → `healer_swordsman`
- **Narrative fit:** Medium — plausible but less anchored in existing flags
- **System fit:** Low — medical path has no peasant-specific entry point

## 6. Audit Conclusion

`farm_peasant` bridge feasibility is **Low** not because it has no potential, but because:
1. There is no specific, narrative-grounded bridge seed event
2. The natural downstream target is ambiguous (merchant vs jianghu vs medical)
3. Directly forcing merchant-magnate (the P58 pattern) would cause identity collapse

The highest-potential direction — based on existing flag anchors and narrative continuity — is **labor → escort/guard → jianghu renown** (Option 5.1), with **swap-crew → grain trade → merchant-adjacent** (Option 5.2) as a runner-up. Both require a minimal new seed event to bridge the "leaving the village" → "specific path" gap.
