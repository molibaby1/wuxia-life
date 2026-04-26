# US-002 Event Selection Flow Map

## Scope

This document maps the current runtime event selection flow centered on `GameEngineIntegration.selectEvent`, plus the trigger recording points that run after event execution.

## Flow Diagram

```mermaid
flowchart TD
    A[selectEvent(age?)] --> B[Resolve currentAge + yearly cap check]
    B -->|cap blocked| Z[Return null]
    B --> C[getAvailableEvents(currentAge)]
    C --> D{formal candidates exist?}
    D -->|No| E[dailyEventSystem.selectEvent]
    D -->|Yes| F[Filter re-trigger and choice availability]
    F --> G{candidates remain?}
    G -->|No| E
    G -->|Yes| H[Path conflict filter with fallback]
    H --> I[Reputation gate with fallback]
    I --> J[Annual pressure pause check]
    J -->|Pause| E
    J -->|Continue| K[Weighted random selection]
    K --> L[Return formal event]
    E --> M[Return daily event or null]
    L --> N[executeAutoEvent / executeChoiceEffects]
    M --> N
    N --> O[recordEventTrigger + append eventHistory]
```

## Ordered Selection Steps

### 1) Candidate loading
- Input: `currentAge` from `selectEvent(age?)` (fallback to `gameState.player.age`).
- Process: `eventLoader.getEventsByAge(age)` uses age weights / age range and returns raw formal-event candidates.
- Output: age-valid formal event list.
- Fallback: none at this step.

### 2) Age filtering (already applied in loader)
- Input: each event's `ageWeights` or `ageRange`, current age.
- Process: `EventLoader.getWeightForAge` returns `0` for out-of-range ages; `getEventsByAge` keeps only weight `> 0`.
- Output: age-compatible candidates only.
- Fallback: if empty after later filters, switch to daily event selection.

### 3) Condition filtering
- Input: candidate events + `gameState`.
- Process (in `getAvailableEvents`):
  - evaluate `event.conditions` via `ConditionEvaluator`,
  - enforce `once` tag (block if already in `eventHistory`),
  - apply life-path compatibility,
  - apply attribute requirements,
  - apply thresholds (attributes/background/experience/identity).
- Output: logically triggerable candidates.
- Fallback: if none survives, daily fallback in `selectEvent`.

### 4) Cooldown / max trigger filtering
- Input: candidate + `eventHistory`, current age, `event.maxTriggers`, `event.cooldown`.
- Process: `checkEventCooldown` rejects events at max trigger count or still in cooldown years.
- Output: candidates allowed by trigger frequency limits.
- Fallback: if list becomes empty later, daily fallback.

### 5) Storyline checks
- Input: candidate storyline metadata + `eventHistory`.
- Process:
  - `checkStoryLineDensity` (currently no-op, always true),
  - `checkStoryLineGuarantee` (currently effectively always true, keeps hook points).
- Output: storyline-screened candidates (currently unchanged by implementation behavior).
- Fallback: none currently triggered by these checks.

### 6) Daily fallback switch (first)
- Input: result of `getAvailableEvents`.
- Switch condition: `availableEvents.length === 0`.
- Output: call `dailyEventSystem.selectEvent(gameState)`.
- Fallback behavior: daily system may still return `null` when no daily candidate exists.

### 7) Re-trigger + choice-availability pass
- Input: available formal candidates + `eventHistory` + choice conditions.
- Process:
  - reject events that exceeded `maxTriggers`,
  - for `choice` events, require at least one available choice.
- Output: `untriggeredEvents`.
- Fallback: if empty, daily fallback (`dailyEventSystem.selectEvent`).

### 8) Path / reputation fallback chain
- Input: `untriggeredEvents`, dominant paths, player reputation, difficulty config.
- Process:
  - path conflict filter; fallback to unfiltered list if all removed,
  - reputation gate filter; fallback to pre-reputation list if all removed.
- Output: `eventsToSelect`.
- Fallback: two in-step fallbacks prevent hard emptying by strict filters.

### 9) Annual pressure gate
- Input: `eventsToSelect`, `annualEventPressure`, `eventsThisYear`.
- Process: `shouldPauseEventsThisYear` computes pause probability from annual pressure and priority makeup.
- Switch condition: pause roll is true.
- Output: when paused, switch to daily fallback; otherwise continue formal weighting.
- Fallback: daily event selection.

### 10) Weighting and formal pick
- Input: `eventsToSelect`, age, player state.
- Process:
  - base weight from `eventLoader.getWeightForAge`,
  - multiply by path multiplier, trait multiplier, formal-state multiplier, specialization multiplier, repetition suppression multiplier, annual-pressure decay,
  - weighted random pick across final weights.
- Output: one formal event.
- Fallback:
  - if only one candidate, return it directly,
  - weighted loop has final safety fallback to last candidate.

### 11) Trigger recording (post-selection execution stage)
- Input: selected event + execution path.
- Process:
  - `executeAutoEvent` / `executeChoiceEffects` call `recordEventTrigger(event, ageBeforeEvent)`,
  - both append `eventHistory` (with event id, trigger year, age).
- Output: updated yearly counters (`eventsThisYear`, `annualEventPressure`) and historical trace.
- Fallback: if event id is missing in choice execution, only generic effects run and trigger record is skipped.

## Formal vs Daily Selection Conditions

- Formal path is used when:
  - yearly hard cap allows (`canTriggerEventThisYear`),
  - and at least one formal candidate survives to the weighting stage,
  - and annual pause check does not trigger.
- Daily path is used when any of these occurs:
  - no formal candidate from `getAvailableEvents`,
  - no candidate after re-trigger / choice filter,
  - annual pressure pause check returns true.
- Null return occurs when:
  - yearly hard cap blocks formal events before fallback (`return null`),
  - or daily event system has no available daily candidates.
