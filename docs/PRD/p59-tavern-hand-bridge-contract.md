# P59 Tavern-Hand Bridge Contract

> **Stage:** P59 tavern-hand merchant-adjacent bridge
> **Origin:** `tavern_hand` (跑堂伙计, ordinary tier)
> **Target:** `merchant_magnate` (巨贾行商, mixed tier) via P55 magnate chain

## 1. Prerequisite Chain

The bridge fires only when the following tavern-hand network signals have accumulated in order:

| Step | Flag | Source | Age | Role |
|------|------|--------|-----|------|
| 1 | `origin_tavern_hand` | Origin selection | 0 | Origin identity |
| 2 | `tavern_guest_network` | Childhood fork `ordinary_tavern_network_fork` → `track_guests` | 9–13 | Network seed + `ally_network` |
| 3 | `tavern_embrace_network` | Midlife `ordinary_tavern_midlife_guest_regulars` → `embrace_network` | 25 | Active network cultivation |
| 4 | `tavern_take_referral` | Midlife `ordinary_tavern_midlife_ally_referral` → `take_referral` | 27 | Bridge checkpoint (accept city shop referral) |

**Minimum prerequisite set:** `tavern_guest_network` + `ally_network` + `tavern_embrace_network` + `tavern_take_referral`

The `tavern_keep_distance` or `tavern_decline_referral` paths do NOT cross the bridge — they stay in ordinary tavern identity.

## 2. Bridge Checkpoint

**Checkpoint flag:** `tavern_merchant_bridge_crossed`

**Set by:** `ordinary_tavern_midlife_ally_referral` → `take_referral` option

**What it means:** The tavern hand accepts the ally's referral to a city shop, crossing from local tavern service work into a broader merchant-adjacent opportunity network.

**Bridge flag role:**
- Satisfies the "route flag" condition in `magnate_on_ramp` gate (analogous to `apprentice_merchant_bridge_crossed`)
- Satisfies the "milestone flag" condition in `magnate_on_ramp` gate
- Satisfies both conditions in `merchant_midlife_debt_milestone` gate
- Triggers bridge-specific expression on existing surfaces

## 3. Identity Preservation

Before the bridge checkpoint fires (`tavern_merchant_bridge_crossed` not set):
- `detectOrdinaryOrigin()` still returns `'tavern_hand'`
- All existing tavern-hand expression (currentGoal, lifeMemory, summary) reads as ordinary tavern identity
- No merchant-flavored text appears

After the bridge checkpoint fires:
- `detectOrdinaryOrigin()` STILL returns `'tavern_hand'` (ordinary origin identity preserved)
- Bridge-specific expression branches activate on existing surfaces
- The expression reads as "tavern-hand background + merchant-adjacent ascent", not "generic merchant"
- The origin's social-capital advantage (highest among ordinary origins at 0.58) reads as the reason the bridge works

## 4. Narrative Framing

The bridge is framed as **network→referral→city shop**, not as "becoming a merchant overnight":
- Childhood: helping the accountant, getting to know guest faces → network seed
- Midlife 25: regular guests recognize you, you cultivate connections → network deepens
- Midlife 27: a favored guest refers you to a city shop → the bridge moment
- Post-bridge: you're in the city shop, learning the trade through your network → merchant-adjacent ascent

This framing is consistent with `tavern_hand`'s high socialCapital (0.58) and urban background — the bridge leverages existing strengths rather than inventing new ones.

## 5. Bridge vs. P58 Apprentice Bridge

| Dimension | P58 Apprentice Bridge | P59 Tavern-Hand Bridge |
|-----------|----------------------|----------------------|
| Origin | `town_apprentice` | `tavern_hand` |
| Prereq path | craft → trade curiosity → trade network → partnership | service → guest network → embrace network → ally referral |
| Bridge flag | `apprentice_merchant_bridge_crossed` | `tavern_merchant_bridge_crossed` |
| Downstream target | `merchant_magnate` via P55 chain | `merchant_magnate` via P55 chain |
| Narrative framing | Apprentice learns trade → partners with merchants → enters business | Tavern hand builds guest network → gets referral → enters city shop |
| Identity preserved | Yes (ordinary apprentice origin) | Yes (ordinary tavern-hand origin) |

Both bridges enter the same P55 magnate chain through the same gate pattern (single bridge flag satisfies both route + milestone conditions), but they have distinct prerequisites and narrative framing.
