# Theme Configurability Direction Boundary

**Date:** 2026-06-27

This document records the current product and engineering direction for future
development discussions. It is not an implementation plan and does not approve
new runtime work by itself.

## Current Decision

The project should continue as a focused wuxia life game first.

The long-term idea of configurable worlds, storylines, and theme packs is
valuable, but it should remain an architectural boundary rather than the active
product goal. The near-term priority is to make the wuxia experience itself
playable, distinct, and worth replaying.

In short:

> Product focus stays wuxia. Engineering should avoid locking the engine to
> wuxia-only assumptions.

## Why This Direction

The current strongest risk is not the absence of more settings. The strongest
risk is that the core life-simulation experience can still feel like repeated
event-table playback instead of a memorable martial-arts life.

Adding officialdom, cultivation, palace intrigue, time travel, looping lives, or
other worlds before the wuxia loop is healthy would multiply content and
configuration debt. It would not automatically solve pacing, repetition, route
identity, payoff, or replay desire.

The right order is:

1. Prove that one wuxia theme can produce clearly different, replayable lives.
2. Preserve neutral engine concepts where they already exist or are naturally
   needed.
3. Use a second theme later to test which abstractions are truly reusable.

## Development Principles

Future work should follow these principles:

- Improve the wuxia experience first: event repetition, route feel, long-term
  payoff, feedback clarity, and replay contrast remain higher priority than
  multi-theme expansion.
- Keep data and rules as configurable as practical when this directly serves the
  wuxia experience.
- Prefer neutral naming for reusable concepts, such as `routes`, `lifeStages`,
  `identityTags`, `memoryFlags`, `relationshipStates`, and `endingCriteria`.
- Avoid new hardcoded wuxia-only concepts in shared engine code when a neutral
  concept is equally clear.
- Do not add speculative generic platform layers only because a future theme may
  need them.
- Let working wuxia cases reveal the real abstraction boundary before designing
  a broad multi-world platform.

## LLM Role

Large language models are expected to be useful for future content production,
especially for:

- world profile drafts
- event candidates
- route outlines
- character and faction templates
- flavor text and callbacks
- homage and easter-egg ideas

However, LLM output should be treated as candidate content, not as validated
gameplay. The project still needs rules, gates, simulation reports, and human
review to judge pacing, repetition, causality, route contrast, and emotional
payoff.

The preferred model is:

> LLMs help produce assets. The engine, gates, and review process protect
> structure and experience quality.

## Non-Goals For The Current Phase

Until the wuxia loop is stronger, the project should not pursue:

- a general multi-world platform
- live LLM runtime generation
- automatic publication of LLM-generated story packs
- officialdom, palace, cultivation, time-travel, loop-life, or other new playable
  themes
- broad schema work whose only justification is future non-wuxia support
- a content editor for arbitrary theme-pack creation

These ideas can be revisited later, but they should not displace the current
wuxia playability work.

## Future Revisit Trigger

This direction should be revisited only after the wuxia theme can demonstrate:

- a first run that is readable and emotionally legible
- at least three route-shaped lives that feel meaningfully different
- reduced event repetition in normal play
- visible long-term consequences for key choices
- replay comparison evidence showing that multiple runs produce distinct life
  stories

At that point, the best next validation theme is likely a small officialdom
theme pack. Officialdom is different enough from wuxia to test the abstraction:
it emphasizes rank, factions, political risk, patronage, reputation, and hidden
costs rather than martial sects, jianghu reputation, and personal heroism.

If the same engine can support both a focused wuxia theme and a small officialdom
theme without major rewrites, then broader configurable-world work becomes a
stronger product direction.

## Practical Rule For Future Sessions

When a future change touches theme, world profile, event configuration, or route
architecture, use this rule:

> Do not build a generic multi-theme platform. Build the wuxia feature in a way
> that does not unnecessarily prevent future theme packs.

If a proposed change cannot improve the wuxia experience now, it should usually
be deferred.
