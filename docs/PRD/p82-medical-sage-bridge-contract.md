# P82 Medical Sage Bridge Contract

> **Stage:** P82 medical sage bridge design-first contract
> **Input from:** `docs/test-reports/p82-medical-sage-prerequisite-audit.md` + `docs/test-reports/p82-candidate-bridge-shapes-comparison.md`
> **Origin:** `tavern_hand` (酒肆跑堂, ordinary tier)
> **Target:** `medical_sage_healer` (一代名医, mainstream tier)
> **Bridge type:** Habit-led study-healer midlife bridge — study habit accumulation → midlife healer discovery → medical path

---

## 1. Bridge Direction Selection (Recap from P82-003)

### 1.1 Chosen Direction: Habit-Led Study-Healer Bridge

**Bridge shape:** A tavern hand who developed a studious habit (reading, observing, learning from guests) discovers an aptitude for medicine and crosses into the healer path through a midlife event that formalizes their healing identity. The study habit is the seed; a midlife bridge event is the checkpoint.

**Why this direction (quality-first priority):**
1. **Evidence strength:** Study-healer path is fully verified by P33 short-chain proof and P34 birth-to-death lifetime sim. Both key_choice flags (`medical_pure` + `medical_divine_doctor_fame`) have existing event-driven paths.
2. **Implementation risk:** Single-seed bridge, proven habit-led pattern, low scope creep risk.
3. **Methodology fit:** Follows the same bridge pattern as renown (seed → bridge event → bridge flag → downstream gate) and reuses the verified habit-led medical framework.
4. **Differentiation from renown:** Study-based intellectual path vs renown's social/reputation path — gives players two distinct routes from tavern_hand.

### 1.2 Why Not Social-Momentum Healer?

The social-momentum direction is deferred (not rejected):
- Partial foundation only — `p29_social_momentum_healer_network` sets `medical_talent` but no key_choice flags
- Incomplete chain — need 2–3 more events to reach the medical_sage_healer gate
- Less verification — no P33/P34-style proof for the social-healer path
- More overlap with renown — both are social/reputation-based
- Can be revisited later as a second medical bridge or entry variant

---

## 2. Bridge Contract Definition

### 2.1 Minimal Prerequisite Chain

The bridge fires only when the following tavern_hand signals have accumulated:

| Step | Flag / State | Source | Age | Role |
|------|--------------|--------|-----|------|
| 1 | `origin_tavern_hand` | Origin selection | 0 | Origin identity |
| 2 | Study habit development | Natural play / bridge event itself | 18–28 | Healer aptitude seed |
| 3 | **New:** `tavern_medical_bridge_event` | New midlife bridge event | 26–30 | Bridge opportunity — healer identity moment |
| 4 | **New:** `tavern_embrace_healer` | Choice: embrace the healer path | 26–30 | Bridge checkpoint (commit to medical path) |

**Minimum prerequisite set:** `origin_tavern_hand` + medical bridge event + embrace_healer choice

The study habit is the core driver of healer aptitude. The bridge event formalizes the transition from "tavern hand who knows some remedies" to "someone known as a healer."

**Note on studyHabit seeding:** The bridge should not require a pre-existing high studyHabit. Instead, the bridge event itself can be the moment the character's latent medical aptitude (developed through careful observation of tavern guests, reading old medical books left by patrons, etc.) surfaces. This keeps the bridge accessible to more tavern_hand playthroughs.

### 2.2 Bridge Checkpoint

**Checkpoint flag:** `tavern_medical_bridge_crossed`

**Set by:** New midlife medical bridge event → `embrace_healer` choice

**What it means:** The tavern hand's medical knowledge and reputation have crossed a threshold — they are no longer just a local tavern worker who knows some remedies, but someone known in the community as a healer. People seek them out for treatment, they have a growing practice, and they are recognized as walking the healer's path.

**Flags set at checkpoint:**
1. `tavern_medical_bridge_crossed` — bridge-specific tracking flag
2. `route_medical_committed` — medical-route equivalent of `route_wealth_committed` / `route_renown_committed` (for downstream spine gates)
3. `medical_pure` — key_choice flag, set as part of the bridge (the tavern-born healer starts on the pure path, not the poison path)
4. `medical_talent` — talent flag, confirming the character's healer aptitude

**Why set medical_pure at the bridge:** The study-healer path is inherently a "pure" path — the character heals through knowledge and compassion, not through poison or morally ambiguous means. This aligns with the `medical_pure` flag's meaning and directly satisfies one key_choice dimension of the gate.

### 2.3 Target Gate Acceptance

**Target gate:** `medical_sage_healer` composite destiny in `wuxiaOriginSurfaces.ts`

**Current gate requirements (all must be met):**
1. `reputation >= 55`
2. `resources >= 30`
3. `key_choices` (dim 1): any of `['medical_divine_doctor_fame', 'medical_imperial']`
4. `key_choices` (dim 2): any of `['medical_plague_hero', 'medical_pure']` — blocked by `medical_poison_path`

**How the bridge satisfies / feeds into the gate:**
- **key_choices dim 2 (medical_pure):** Satisfied by bridge event (set at checkpoint)
- **reputation:** Should be achievable through natural play + bridge event effects + post-bridge spine events
- **resources:** Should be achievable through healer income + bridge event effects
- **key_choices dim 1 (medical_divine_doctor_fame):** Satisfied by post-bridge progression (on-ramp / pressure spine events, following the p29 study-case-duty pattern)

**Note on medical_divine_doctor_fame:** The bridge sets `medical_pure` but not `medical_divine_doctor_fame`. The divine_doctor_fame flag comes from post-bridge progression (on-ramp / pressure stages), following the pattern of `p29_study_habit_case_record_duty` which sets it after the p27 initial healer path.

### 2.4 Bridge-Specific Player-Facing Signals

The bridge must be visible to the player on at least these surfaces:

#### Signal 1: Current Goal (`tavernCurrentGoal()`)

**Bridge-crossed state text (approximate — implementation may refine):**
> "渐渐有人寻你看病，酒肆后面辟出了一间小药庐"

Or alternatively:
> "凭着自学的医术，在镇上有了些神医的名头"

**Rationale:** Distinct from merchant bridge ("城里铺子已上手，酒肆人脉铺出了商路") and renown bridge ("江湖上渐渐有了名声，常有人来寻你引荐") — this is about healing and medical practice, not business or jianghu reputation.

#### Signal 2: Life Memory (`tavernLifeMemory()`)

**Bridge-crossed state text (approximate):**
> "你在酒肆里耳濡目染，竟自学成了一手医术。起初只是帮熟客看看小病，后来名声渐渐传开，镇上人都称你一声小神医。酒肆后面的柴房改成了小药庐，看病的人比喝酒的还多。"

Or alternatively:
> "跑堂的出身，没想到竟走上了行医的路。这些年在酒肆里见过的人、听过的方子、偷偷翻过的医书，竟都攒成了本事。有人千里迢迢来寻你看病，你也渐渐有了医者的样子。"

**Rationale:** Preserves tavern_hand identity — the character's medical skill grows FROM their tavern background (observing guests, learning from patrons, self-study in spare time), not from a formal apprenticeship.

#### Signal 3: Life Memory Summary / Origin Summary

**Summary signal words:** `['酒肆', '医术', '行医']` or similar

**Rationale:** Distinguishes medical path from merchant path (`['酒肆', '人脉', '商路']`) and renown path (`['酒肆', '人脉', '江湖']`).

#### Additional signal: Cost Label (if medical gets a spine)

Once the medical spine is built (P83+), a cost label like "行医之累" or "医者仁心之重" would provide a fourth player-facing signal. This is deferred to the spine implementation stage.

### 2.5 How the Medical Bridge Differs from a Generic Path to Medical Sage

This is NOT a generic "become a medical sage" path. It is specifically a **tavern_hand → study-healer → medical_sage** path with distinct identity:

| Aspect | Generic Medical Path | This Bridge (Tavern Hand Study-Healer) |
|--------|---------------------|----------------------------------------|
| **Entry point** | Formal apprenticeship / medical family / divine talent | Tavern self-study / observation of guests / practical experience |
| **Core strength** | Medical knowledge / formal training / master-apprentice lineage | Resourcefulness / people skills / practical wisdom from running a tavern |
| **Healer identity** | "I'm a trained doctor/healer" | "I'm a tavern person who became a healer" |
| **Medical style** | Formal / systematic / school-based | Pragmatic / experiential / self-taught |
| **Cost feel** | Study burden / moral dilemmas / medical ethics | Balancing tavern and healer identities / community expectations |
| **Origin preservation** | Could be any origin | Deeply tied to tavern_hand identity — the medical skill grows FROM the tavern background |

**Key principle:** The tavern_hand identity must be preserved. `detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge crossing. The expression reads as "tavern hand who became a healer through self-study and experience," not "generic medical sage who happened to be a tavern hand once."

### 2.6 Entry Differentiation Shape (At Least 2 Variants)

The medical bridge should support at least 2 entry variants, giving the player some choice in how their healer identity manifests:

#### Variant A: 仁心医者 (Compassionate Healer)

**Trigger:** Choice to prioritize helping people over personal gain

**Flavor:** The healer is known for their kindness and compassion. They treat the poor for free, go out of their way to help those in need, and their reputation is built on goodwill.

**Stats / flags:** Higher chivalry, slightly lower resources, `medical_pure` (stronger)

**Narrative beat:** "你见不得人受苦，有钱没钱都给看。名声传开了，家里也渐渐撑不住。"

#### Variant B: 世故人医 (Pragmatic Healer)

**Trigger:** Choice to balance healing with practical concerns

**Flavor:** The healer is practical and grounded. They charge fair prices, maintain good relationships with patrons and officials, and build a sustainable practice. They're respected for both their skill and their ability to navigate the world.

**Stats / flags:** Higher reputation and resources, slightly lower chivalry, `medical_pure` (still pure, just more practical)

**Narrative beat:** "你看病收钱，也看人下菜碟。镇上的大户人家都捧你，穷人家也说你公道。名声和日子都渐渐好了起来。"

**Why 2 variants:** This follows the entry differentiation pattern from renown (though renown's entry differentiation came later, in P72). For the medical bridge, having 2 variants at the entry point gives players meaningful choice and makes the path feel less linear. Both variants stay on the `medical_pure` path (the poison path is a separate, later fork).

### 2.7 Minimal New Event / Choice / Flag Additions

#### Configuration Changes (Runtime — for P83 implementation)

| Change | File | Nature |
|--------|------|--------|
| Add new midlife medical bridge event | `ordinary-origin-midlife.json` | New event (1 event, 2+ choices) |
| Add bridge flags to `embrace_healer` option(s) | `ordinary-origin-midlife.json` | 4 flags on new choice(s) |
| Add stat effects to bridge event choices | `ordinary-origin-midlife.json` | Stat effects on existing pattern |
| (Later, with spine) Add medical spine gate expressions | New medical spine JSON | Gate expansion — follows P55/P73 pattern |

#### Expression Additions (Runtime — for P83 implementation)

| Surface | New Branch | Approximate Text (design only) |
|---------|------------|--------------------------------|
| `tavernCurrentGoal()` | Medical bridge-crossed state | "渐渐有人寻你看病，酒肆后面辟出了一间小药庐" |
| `tavernLifeMemory()` | Medical bridge-crossed state | "你在酒肆里耳濡目染，竟自学成了一手医术。" |
| `deriveOrdinaryOriginSummary()` | Tavern-hand medical branch | "酒肆出身的医者：靠自学和经验在镇上行医" |

**Total additions (bridge only, not including spine):**
- 1 new event ID (medical bridge midlife event)
- 2+ choices (embrace_compassionate / embrace_pragmatic / decline)
- 4 new flags (`tavern_medical_bridge_crossed`, `route_medical_committed`, plus medical_pure + medical_talent which may already exist)
- 3 expression branches (1 per surface)

This is **minimal scope** — comparable to the renown bridge (P70/P71), plus entry differentiation built in from the start.

### 2.8 Downstream Spine Shape (Placeholder for P83+)

The bridge feeds into a medical sample-line spine (to be built in P83+). The spine shape follows the renown / merchant trilogy pattern:

```
tavern_medical_bridge_crossed (bridge checkpoint)
    ↓
medical_on_ramp (spine event, age 30–34 — early healer practice)
    ↓
medical_midlife_pressure (spine event, age 36–40 — healer's burden / growing reputation)
    ↓
medical_payoff (spine event, age 42–46 — divine doctor fame / medical sage status)
    ↓
medical_sage_healer composite gate evaluation
```

**This is placeholder-level only.** The exact spine design is deferred to the implementation stage (P83) and later differentiation stages. P82 only confirms that the bridge exists and feeds into a spine of this general shape.

---

## 3. Flag Flow Diagram

```
origin_tavern_hand + study habit development (age 18–28)
  ↓
NEW: tavern_medical_bridge_event (age 26–30) — healer identity moment
  ↓ choice: embrace_healer (compassionate or pragmatic variant)
tavern_medical_bridge_crossed + route_medical_committed (bridge checkpoint)
  + medical_pure + medical_talent
  + small reputation/resource boost from event effects
  ↓
[P83+] medical_on_ramp → medical_midlife_pressure → medical_payoff
  ↓ (medical_divine_doctor_fame set during on-ramp or pressure stage)
medical_sage_healer composite gate evaluation
  (medical_pure + medical_divine_doctor_fame satisfy key_choices;
   stats reach threshold via events + natural play)
```

---

## 4. Comparison with Existing Bridges (Renown + Merchant)

| Dimension | P59 Tavern-Hand (Merchant) | P70/P71 Renown | P82/P83 Medical (this contract) |
|-----------|---------------------------|----------------|---------------------------------|
| Origin | `tavern_hand` | `tavern_hand` | `tavern_hand` |
| Entry path | Service → guest network → ally referral → trade | Tavern network → reputation → jianghu renown | Study/observation → self-taught healer → medical sage |
| Pre-bridge seed | `ally_network` (merchant path) | `ally_network` (renown path) | Study habit + latent medical aptitude |
| Bridge flag | `tavern_merchant_bridge_crossed` | `tavern_renown_bridge_crossed` | `tavern_medical_bridge_crossed` |
| Route flag | `route_wealth_committed` | `route_renown_committed` | `route_medical_committed` |
| Downstream target | `merchant_magnate` via P55 chain | `jianghu_renown_sage` via renown spine | `medical_sage_healer` via medical spine (TBD) |
| Tier transition | ordinary → mixed | ordinary → mainstream | ordinary → mainstream |
| Core strength leveraged | Social network + business referrals | Social network + reputation | Study habit + observation + practical wisdom |
| Identity flavor | "Tavern hand who became a merchant" | "Tavern hand who became jianghu renown" | "Tavern hand who became a healer" |

Key insight: `tavern_hand` becomes the first ordinary origin with **three potential bridges** — merchant (P59), renown (P71), and medical (P83). This makes tavern_hand the most versatile ordinary origin, with three distinct late-life paths.

**Mutual exclusivity approach (preliminary):**
- All three bridges (merchant, renown, medical) should be **mutually exclusive**
- `ordinary_tavern_midlife_done` flag prevents multiple bridges from firing
- If player takes one bridge, the others become unavailable
- This gives players meaningful choices and keeps each path distinct
- The bridges should fire at slightly different ages to create natural branching points

This is a preliminary design decision — P83 should validate and refine it during implementation.

---

## 5. Edge Cases

| Case | Behavior |
|------|----------|
| Player chooses `stay_in_tavern` (decline healer path) | Bridge does NOT fire; tavern hand stays in ordinary identity |
| Player took merchant bridge (P59 `tavern_take_referral`) | `ordinary_tavern_midlife_done` is already set; medical bridge event never fires; mutual exclusivity maintained |
| Player took renown bridge (P71 renown bridge) | Same as above — mutual exclusivity maintained |
| Player declined merchant/renown bridges | Medical bridge becomes available (if prerequisites met) |
| Player has `tavern_service_committed` path (no study inclination) | Medical bridge may still fire if the character shows aptitude through other means (observation, etc.) |
| Player is not `tavern_hand` origin | Bridge flags are never checked; no bridge |
| Player already has `medical_plague_hero` or `medical_imperial` from other sources | `medical_sage_healer` gate still works via those flags; medical bridge is an additional path, not the only path |
| Player reaches medical gate stats without bridge event | Gate can still unlock via P33/P34 habit-led pattern; bridge is the *playable* path, not the *only* path |
| Player already has `medical_pure` from habit-led events (p27_study_habit_healer_reinforcement) | Bridge event still sets `medical_pure` (idempotent — no change if already present); bridge checkpoint still fires normally |
| Player chose poison path (`medical_poison_path`) | `medical_pure` key_choice is blocked; player would need `medical_plague_hero` for dim 2; this is a legitimate alternative path but not the focus of this bridge |

---

## 6. What This Contract Does NOT Cover

The following are explicitly **out of scope** for this contract and belong to later stages:

| Item | Stage |
|------|-------|
| Medical sample-line spine design (on_ramp / pressure / payoff details) | P83+ implementation stage |
| Entry differentiation refinement (beyond the 2 variants here) | P84+ |
| Pressure/payoff flavor text | P85+ |
| Cost differentiation (what does being a healer cost the player?) | P86+ |
| Late-life / endgame content | P88+ |
| Social-momentum healer bridge direction | Future cycle (second medical bridge) |
| Farm_peasant / town_apprentice medical bridges | Future cycles (additional origins) |
| Poison path (`medical_poison_path`) as a main path | Future cycle (alternative medical route) |
| Full medical system / herbalism system / clinic management | Way beyond scope — platform-level change |

---

**P82-004 complete.** Bridge contract saved.
