# US-008 Event Repetition Rules

## Goal

Define explicit repetition boundaries so suppression logic can reduce noise without breaking valid narrative progression.

## Repetition Types

### 1) Same-event repetition

- Definition: the same `eventId` appears again within the protected window.
- Example: `setback_injury -> setback_injury`.
- Control target: strongest suppression.

### 2) Same-class repetition

- Definition: different events share the same class tag (`injury`, `illness`, `economy`, `romance`, `identity`, `main_story`, `daily`) and repeat within the protected window.
- Example: `merchant_first_trade -> merchant_expand_business` (both `economy`).
- Control target: medium suppression, preserve variety.

### 3) Same-storyline repetition

- Definition: events from the same narrative chain/storyline repeat too tightly, even if `eventId` differs.
- Example: repeated identity-year storyline beats in adjacent or near-adjacent ages.
- Control target: soft suppression, keep chain continuity.

## Allowed vs Disallowed Boundaries

| Scope | Allowed | Disallowed |
|---|---|---|
| Same-event | Re-trigger after cooldown window ends, or when explicitly marked as repeatable by design | Adjacent-year duplicate trigger; repeated trigger before cooldown/maxTriggers boundary |
| Same-class | Re-trigger with spacing and class diversity (at least one non-class event between) | Consecutive same-class negative events in short window (especially injury/illness/economy) |
| Same-storyline | Mainline/critical beats can continue if they are progression-gated and not random duplicates | Storyline beats firing back-to-back without progression gate advancement |

## Class-Specific Rules

### Injury (`injury`)
- Disallowed: adjacent or near-adjacent injury loops caused by random pool concentration.
- Allowed: injury follow-up after cooldown or after clear state change (e.g., recovery/major transition).

### Illness (`illness`)
- Disallowed: repeated illness penalties in short window without recovery beat.
- Allowed: illness recurrence after recovery storyline or long enough gap.

### Economy (`economy`)
- Disallowed: repeated identical trade/business beats in adjacent years.
- Allowed: economy storyline continuation if each beat represents a new stage and has spacing.

### Romance (`romance`)
- Disallowed: same romance conflict/encounter beat spam in adjacent turns.
- Allowed: romance chain progression with gated milestones (meet -> bond -> commitment).

### Identity (`identity`)
- Disallowed: repeated identity affirmation events without role/progression updates.
- Allowed: identity-year events when rank/title/faction state changes.

### Main story (`main_story`)
- Disallowed: random suppression that blocks mandatory critical path events.
- Allowed: immediate progression beats if required by quest/arc state.

### Daily (`daily`)
- Disallowed: strict suppression copied from formal story events (too rigid for daily flavor content).
- Allowed: higher repetition tolerance than formal story events, but still avoid direct adjacent duplicates.

## Implementation Constraints for Next Story (US-009)

- Mainline and critical events must always have bypass/priority over repetition suppression.
- Daily events should use a lighter boundary than formal story events.
- Suppression should be evaluated in order: same-event (hard) -> same-class (medium) -> same-storyline (soft).
- Metrics should separately track `same_event`, `same_class`, and `same_storyline` so behavior is debuggable.
