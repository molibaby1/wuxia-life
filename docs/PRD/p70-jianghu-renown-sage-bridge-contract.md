# P70 Jianghu Renown Sage Bridge Contract

> **Stage:** P70 selected next route design-first contract
> **Input from:** `docs/test-reports/p69-next-route-candidate-closure-report.md` (jianghu_renown_sage selected)
> **Origin:** `tavern_hand` (酒肆跑堂, ordinary tier)
> **Target:** `jianghu_renown_sage` (江湖名宿, mainstream tier)
> **Bridge type:** Ally-network midlife bridge — childhood network seed → midlife reputation event → renown path

---

## 1. Bridge Direction Selection (Recap from P70-003)

### 1.1 Chosen Direction: Ally-Network Midlife Bridge

**Bridge shape:** A tavern hand who built a network of allies and regulars over the years crosses into jianghu renown through a midlife event that formalizes their reputation. The `ally_network` flag (set in childhood) is the seed; a midlife bridge event is the checkpoint.

**Why this direction (quality-first priority):**
1. **Evidence strength:** `ally_network` already exists, is set from tavern_hand childhood, and is validated by P32 short-chain proof
2. **Implementation risk:** Single-seed bridge, proven pattern, low scope creep risk
3. **Methodology fit:** Follows the same bridge pattern as the merchant trilogy (seed → bridge event → bridge flag → downstream gate)
4. **Value density:** Good — adds a mainstream-tier route and tests methodology generality

### 1.2 Why Not Mentor-Bond Martial Seed?

The mentor-bond direction is deferred (not rejected):
- Zero existing infrastructure — no mentor events, no martial training chain, no `mentor_bond` set from any ordinary origin
- Large scope — would need a full seed chain + training system + bridge, not just a bridge
- Poor small-step iterability — need 4–5 stages minimum to reach playable
- Can be revisited later as a second or third renown bridge

---

## 2. Bridge Contract Definition

### 2.1 Minimal Prerequisite Chain

The bridge fires only when the following tavern_hand signals have accumulated:

| Step | Flag | Source | Age | Role |
|------|------|--------|-----|------|
| 1 | `origin_tavern_hand` | Origin selection | 0 | Origin identity |
| 2 | `tavern_guest_network` + `ally_network` | Childhood fork `ordinary_tavern_network_fork` → `track_guests` | 9–13 | Network seed + ally foundation |
| 3 | `tavern_midlife_guest_regulars` + `tavern_embrace_network` | Midlife event `ordinary_tavern_midlife_guest_regulars` → `embrace_network` | 25 | Network deepening (optional but thematic) |
| 4 | **New:** `tavern_renown_bridge_event` | New midlife bridge event | 28–30 | Bridge opportunity — jianghu reputation moment |
| 5 | **New:** `tavern_embrace_renown` | Choice: accept the renown path | 28–30 | Bridge checkpoint (commit to renown path) |

**Minimum prerequisite set:** `origin_tavern_hand` + `ally_network` + renown bridge event + embrace_renown choice

The `ally_network` flag is the core seed — it's already set from childhood. The bridge event formalizes the transition from "tavern hand with allies" to "jianghu renown."

Note: Step 3 (guest-regulars midlife event) is **not** a hard prerequisite — the bridge should work whether or not the player chose the embrace_network path. It's a thematic pre-bridge deepening, not a gate.

### 2.2 Bridge Checkpoint

**Checkpoint flag:** `tavern_renown_bridge_crossed`

**Set by:** New midlife renown bridge event → `embrace_renown` choice

**What it means:** The tavern hand's reputation and network have crossed a threshold — they are no longer just a local tavern worker with connections, but someone known in jianghu circles. Their name carries weight, people seek them out for introductions and mediation, and they are recognized as part of the jianghu community.

**Flags set at checkpoint:**
1. `tavern_renown_bridge_crossed` — bridge-specific tracking flag
2. `route_renown_committed` — renown-route equivalent of `route_wealth_committed` (if needed for downstream spine gates)

**Note:** The `ally_network` flag is NOT the bridge checkpoint — it's the pre-bridge seed. The bridge checkpoint is the new `tavern_renown_bridge_crossed` flag, which represents the *decision/transition* into the renown path (following the same pattern as merchant bridges: pre-bridge seed ≠ bridge flag).

### 2.3 Target Gate Acceptance

**Target gate:** `jianghu_renown_sage` composite destiny in `wuxiaOriginSurfaces.ts`

**Current gate requirements (all must be met):**
1. `skill_growth >= 45`
2. `reputation >= 65`
3. `social_capital >= 55`
4. `key_choices`: any of `['mentor_bond', 'ally_network']`

**How the bridge satisfies the gate:**
- **key_choices:** Already satisfied by `ally_network` (set from childhood)
- **reputation / social_capital:** Should be achievable through natural play + bridge event effects + pre-bridge midlife events
- **skill_growth:** The baseline fixture has martialPower 42 at age 42 — need a small boost from bridge event and/or pre-bridge events

**Skill_growth approach:**
- The bridge event grants a small skill bonus (e.g., +3–5 martialPower / skill_growth) through "learned from jianghu allies"
- Pre-bridge events (guest-regulars, etc.) can contribute small amounts
- The renown on-ramp spine event can grant the rest
- This is consistent with "renown through connections — you pick up some skill from the people you know"

### 2.4 Bridge-Specific Player-Facing Signals

The bridge must be visible to the player on at least these surfaces:

#### Signal 1: Current Goal (`tavernCurrentGoal()`)

**Bridge-crossed state text (approximate — implementation may refine):**
> "江湖上渐渐有了名声，常有人来寻你引荐"

Or alternatively:
> "凭着人脉和名头，在江湖上有了一席之地"

**Rationale:** Distinct from merchant bridge ("城里铺子已上手，酒肆人脉铺出了商路") — this is about reputation and jianghu standing, not business.

#### Signal 2: Life Memory (`tavernLifeMemory()`)

**Bridge-crossed state text (approximate):**
> "你凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号。人们不是来找你喝酒，是来寻你引荐、求你主事。"

Or alternatively:
> "跑堂的出身，没想到竟在江湖上有了些名头。熟客们抬举，朋友们帮衬，跌跌撞撞竟也成了一方人物。"

**Rationale:** Preserves tavern_hand identity — the character's renown comes from their tavern network background, not from martial prowess.

#### Signal 3: Life Memory Summary / Origin Summary

**Summary signal words:** `['酒肆', '人脉', '江湖']` or similar

**Rationale:** Distinguishes renown path from merchant path (which uses `['酒肆', '人脉', '商路']`).

#### Additional signal: Cost Label (if renown gets a spine)

Once the renown spine is built (P71+), a cost label like "江湖声名之累" or "人脉维系之重" would provide a fourth player-facing signal. This is deferred to the spine implementation stage.

### 2.5 How the Bridge Differs from a Generic Path to Jianghu Renown

This is NOT a generic "become jianghu renown" path. It is specifically a **tavern_hand → ally_network → renown** path with distinct identity:

| Aspect | Generic Renown Path | This Bridge (Tavern Hand Ally-Network) |
|--------|---------------------|----------------------------------------|
| **Entry point** | Martial training / sect / wandering swordsman | Tavern network / guest relationships / social reputation |
| **Core strength** | Martial skill / combat prowess | Connections / reputation / people skills |
| **Renown source** | Defeating enemies / performing heroic deeds | Mediation / introductions / being a known figure |
| **Identity feel** | "I'm a skilled fighter who became famous" | "I'm a people person who built a reputation" |
| **Cost feel** | Physical injury / enemies made / isolation | Social obligation / reputation pressure / network maintenance |
| **Origin preservation** | Could be any origin | Deeply tied to tavern_hand identity — the renown grows FROM the tavern background |

**Key principle:** The tavern_hand identity must be preserved. `detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge crossing. The expression reads as "tavern hand who became jianghu renown through their network," not "generic jianghu renown person who happened to be a tavern hand once."

### 2.6 Minimal New Event / Choice / Flag Additions

#### Configuration Changes (Runtime — for P71 implementation)

| Change | File | Nature |
|--------|------|--------|
| Add new midlife renown bridge event | `ordinary-origin-midlife.json` | New event (1 event, 2 choices) |
| Add bridge flags to `embrace_renown` option | `ordinary-origin-midlife.json` | 2 flags on new choice |
| Add skill/reputation effects to bridge event choices | `ordinary-origin-midlife.json` | Stat effects on existing pattern |
| (Later, with spine) Add renown spine gate expressions | New renown spine JSON | Gate expansion — follows P55 pattern |

#### Expression Additions (Runtime — for P71 implementation)

| Surface | New Branch | Approximate Text (design only) |
|---------|------------|--------------------------------|
| `tavernCurrentGoal()` | Renown bridge-crossed state | "江湖上渐渐有了名声，常有人来寻你引荐" |
| `tavernLifeMemory()` | Renown bridge-crossed state | "你凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号。" |
| `deriveOrdinaryOriginSummary()` | Tavern-hand renown branch | "酒肆出身的江湖人物：靠人脉和名声在江湖上立足" |

**Total additions (bridge only, not including spine):**
- 1 new event ID (renown bridge midlife event)
- 2 new choices (embrace_renown / stay_in_tavern)
- 2 new flags (`tavern_renown_bridge_crossed`, `route_renown_committed`)
- 3 expression branches (1 per surface)

This is **minimal scope** — comparable to the merchant bridges (P58/P59/P61), plus a new event (since there's no existing renown-adjacent midlife event to reframe, unlike peasant which had the outside-offer event).

### 2.7 Downstream Spine Shape (Placeholder for P71+)

The bridge feeds into a renown sample-line spine (to be built in P71+). The spine shape follows the merchant trilogy pattern:

```
tavern_renown_bridge_crossed (bridge checkpoint)
    ↓
renown_on_ramp (spine event, age 30–34 — early renown days)
    ↓
renown_midlife_pressure (spine event, age 36–40 — reputation pressure)
    ↓
renown_payoff (spine event, age 42–46 — renown sage status)
    ↓
jianghu_renown_sage composite gate evaluation
```

**This is placeholder-level only.** The exact spine design is deferred to the implementation stage (P71) and later differentiation stages. P70 only confirms that the bridge exists and feeds into a spine of this general shape.

---

## 3. Flag Flow Diagram

```
origin_tavern_hand + tavern_guest_network + ally_network (childhood, 9–13)
  ↓
[optional: tavern_midlife_guest_regulars + tavern_embrace_network (age 25)]
  ↓
NEW: tavern_renown_bridge_event (age 28–30) — jianghu reputation moment
  ↓ choice: embrace_renown
tavern_renown_bridge_crossed + route_renown_committed (bridge checkpoint)
  + small skill/reputation boost from event effects
  ↓
[P71+] renown_on_ramp → renown_midlife_pressure → renown_payoff
  ↓
jianghu_renown_sage composite gate evaluation
  (ally_network satisfies key_choices; stats reach threshold via events + natural play)
```

---

## 4. Comparison with Existing Merchant Bridges

| Dimension | P58 Apprentice | P59 Tavern-Hand (Merchant) | P70 Renown (this contract) |
|-----------|---------------|---------------------------|----------------------------|
| Origin | `town_apprentice` | `tavern_hand` | `tavern_hand` |
| Entry path | Craft skill → trade curiosity → partnership | Service → guest network → ally referral → trade | Tavern network → reputation → jianghu renown |
| Pre-bridge seed flag | `apprentice_trade_curiosity` | `ally_network` (merchant path uses it too) | `ally_network` (same flag, different downstream) |
| Bridge flag | `apprentice_merchant_bridge_crossed` | `tavern_merchant_bridge_crossed` | `tavern_renown_bridge_crossed` |
| Downstream target | `merchant_magnate` via P55 chain | `merchant_magnate` via P55 chain | `jianghu_renown_sage` via renown spine (TBD) |
| Tier transition | ordinary → mixed | ordinary → mixed | ordinary → mainstream |
| Core strength leveraged | Craft skill + trade learning | Social network + business referrals | Social network + reputation |
| Identity flavor | "Apprentice who became a merchant" | "Tavern hand who became a merchant" | "Tavern hand who became jianghu renown" |

Key insight: `tavern_hand` is the first ordinary origin with **two potential bridges** — one to merchant (P59) and one to renown (P70/P71). Both use the `ally_network` seed but branch into different downstream paths. This is a new pattern that needs careful handling (mutual exclusivity? both possible? branch point?).

**Mutual exclusivity approach (preliminary):**
- The merchant bridge (ally_referral event, age 27) and the renown bridge (new event, age 28–30) should be **mutually exclusive**
- If player takes the merchant referral, `ordinary_tavern_midlife_done` is set, which prevents the renown bridge from firing
- If player declines the merchant referral but has `ally_network`, the renown bridge becomes available
- This gives players a meaningful choice and keeps each path distinct

This is a preliminary design decision — P71 should validate and refine it during implementation.

---

## 5. Edge Cases

| Case | Behavior |
|------|----------|
| Player chooses `stay_in_tavern` (decline renown) | Bridge does NOT fire; tavern hand stays in ordinary identity |
| Player took merchant bridge (P59 `tavern_take_referral`) | `ordinary_tavern_midlife_done` is already set; renown bridge event never fires; mutual exclusivity maintained |
| Player declined merchant bridge but has `ally_network` | Renown bridge event becomes available |
| Player has `tavern_service_committed` path (no `ally_network`) | Renown bridge prerequisite not met; no bridge |
| Player is not `tavern_hand` origin | Bridge flags are never checked; no bridge |
| Player already has `mentor_bond` from another source | `jianghu_renown_sage` gate still works via mentor_bond; renown bridge is an additional path, not the only path |
| Player reaches renown gate stats without bridge event | Gate can still unlock via P32 habit-led pattern; bridge is the *playable* path, not the *only* path |

---

## 6. What This Contract Does NOT Cover

The following are explicitly **out of scope** for this contract and belong to later stages:

| Item | Stage |
|------|-------|
| Renown sample-line spine design (on_ramp / pressure / payoff details) | P71+ implementation stage |
| Entry differentiation (making the renown entry feel different from other paths) | P72+ |
| Pressure/payoff flavor text | P73+ |
| Cost differentiation (what does renown cost the player?) | P74+ |
| Success-shape + recap / destiny sentence | P75+ |
| Mentor-bond bridge direction | Future cycle (second renown bridge) |
| Farm_peasant / town_apprentice renown bridges | Future cycles (additional origins) |
| Full jianghu system / faction system / reputation economy | Way beyond scope — platform-level change |

---

**P70-004 complete.** Bridge contract saved.
