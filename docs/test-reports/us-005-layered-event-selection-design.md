# US-005 Layered Event Selection Design

## Goal

Define explicit selection boundaries for five event layers so event rhythm remains intentional:
- critical
- storyline
- regular formal
- daily
- fallback

This story is design-only and does not require event data migration or runtime behavior rewrite.

## Layer Definitions

### Layer 1: Critical
- **Definition:** Events that must not be starved by rhythm controls.
- **Identification signals:** `priority === EventPriority.CRITICAL`, `category === 'main_story'`, or tags like `critical` / `mandatory` / `mainline`.
- **Protection level:** highest, non-skippable by pacing suppression.

### Layer 2: Storyline
- **Definition:** Events carrying narrative continuity (`event.storyLine` present) but not necessarily hard-critical.
- **Identification signals:** `storyLine` exists and event is not already classified as critical.
- **Protection level:** protected from aggressive repetition suppression; can still yield to hard guardrails (invalid condition/cooldown/maxTriggers).

### Layer 3: Regular Formal
- **Definition:** Standard formal candidates from the main pool after normal eligibility checks.
- **Identification signals:** selected via `eventLoader.getEventsByAge(...)`, not in critical/storyline protected buckets.
- **Protection level:** skippable when density controls request downshift (e.g., annual pressure pause, no valid weighted candidate).

### Layer 4: Daily
- **Definition:** Lightweight pacing fillers from `dailyEventSystem`.
- **Identification signals:** `category === 'daily_event'` or daily-pool tagging.
- **Protection level:** skippable if no daily candidate is valid.

### Layer 5: Fallback
- **Definition:** Final non-crash fallback behavior when no event layer can return a valid event.
- **Identification signals:** all upper layers fail selection.
- **Protection level:** always available as control-flow fallback (`return null`), never blocks game loop.

## Entry and Fallback Conditions by Layer

### Critical
- **Entry:**
  - Candidate passes baseline checks (age, conditions, cooldown/maxTriggers, choice availability).
  - Candidate is identified as critical by the signals above.
- **Fallback:**
  - If no critical candidate is currently valid, continue to storyline layer.
  - Critical events are excluded from optional suppression logic by design (protected lane).

### Storyline
- **Entry:**
  - Candidate passes baseline checks and has `storyLine`.
  - Not already selected by critical lane.
- **Fallback:**
  - If no storyline candidate is valid, continue to regular formal layer.
  - Storyline continuity checks remain hook points (`checkStoryLineDensity`, `checkStoryLineGuarantee`) without requiring data rewrite.

### Regular Formal
- **Entry:**
  - Candidate survives formal filtering and weighting pipeline.
- **Fallback:**
  - If empty after filtering (`availableEvents.length === 0` or `untriggeredEvents.length === 0`), fall back to daily.
  - If annual pressure decides to pause formal flow, fall back to daily.

### Daily
- **Entry:**
  - Formal layer cannot provide a selected event.
- **Fallback:**
  - If daily selector has no valid candidate, continue to fallback layer (`null` return).

### Fallback
- **Entry:**
  - Formal and daily both fail.
- **Fallback behavior:**
  - Return `null` and let caller continue lifecycle progression safely.

## Skippable vs Protected Event Types

### Protected (should not be skipped by optional rhythm suppression)
- critical lane events:
  - `priority === EventPriority.CRITICAL`
  - `category === 'main_story'`
  - metadata tags containing `critical`, `mandatory`, or `mainline`
- storyline lane events (protected from aggressive suppression, but still honor hard validity guards)

### Skippable (can yield to pacing/fallback controls)
- regular formal events
- daily events
- fallback layer output (`null`) as a valid no-event outcome

## No-Large-Rewrite Constraint

- The design reuses existing runtime checks and fallback points in `GameEngineIntegration.selectEvent`.
- Layer identification is derived from current fields (`priority`, `category`, `storyLine`, `metadata.tags`), so no bulk event-data transformation is required.
- Future implementation story (`US-006`) can apply this layering as orchestration logic first, then tune weights incrementally.
