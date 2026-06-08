# P16 Stage Agency Design Rules (US-003)

Approved agency split for childhood, youth, and adulthood.

## Target Agency Split

| Stage | Age band | Player agency | Primary drivers |
|-------|----------|---------------|-----------------|
| Early childhood | 0–7 | **Low** — observe and react | Origin, family resources, environment events |
| Late childhood | 8–12 | **Limited** — 1–2 age-fit choices per window | Upbringing exposure + light preferences |
| Youth | 13–20 | **Moderate** — route exploration begins | Training focus, social seeds, mentor encounters |
| Adulthood | 21+ | **High** — strategic planning | Composite requirements, reputation, resources |

## Core Principle

**Childhood is shaped more by origin and circumstance than by direct route choice.**

- Formal spine events (birth, toddler, preference, summary) carry most narrative weight.
- Active actions in childhood are **experience framing** (play-like training, listening to elders), not career optimization.
- Route-entry flags (`p9_early_*`) should not fire from commerce/travel/socializing before age 13.

## Invalid or Heavily Limited Actions (Early Childhood 0–7)

| Action class | Policy |
|--------------|--------|
| Commerce (`business`) | **Suppressed** — replaced by passive family-resource events |
| Independent travel (`travel`) | **Suppressed** |
| Paid networking (`socializing`) | **Suppressed** |
| Formal study (`study`) | **Suppressed** — implicit learning via events only |
| Martial practice (`training`) | **Allowed** — lowest-friction age-fit action |

## Late Childhood (8–12) Allowlist

| Action | Policy |
|--------|--------|
| `training` | Allowed |
| `study` | Allowed (light scholarly exposure) |
| `business`, `travel`, `socializing` | **Suppressed** until youth band |

## Replacement / Suppression Behavior

- Suppressed actions **do not appear** in the active-action choice list.
- When only training (and optionally study) remain, story-gap pacing uses those plus daily/formal events.
- No silent downgrade to commerce/travel for empty pools.

## Validation

- P16 childhood agency gate checks no suppressed action IDs appear in records for ages 0–7 (and 8–12 for business/travel/socializing).
- At least one meaningful choice remains in late childhood via formal events or allowlisted actions.
