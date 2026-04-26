# US-009 Event Quality Gate Rules

## Goal

Define explicit event quality gate rules so new content validation does not rely on manual inspection.

## Severity Levels

- `blocker`: Must fail validation immediately; indicates progression or runtime correctness risk.
- `major`: Warning in iterative development; must be resolved before release quality sign-off.
- `minor`: Warning-only hygiene issue for normal content maintenance.

## Explicit Blocking Issues

The following issue types are gate-blocking:

- `duplicate_id`
- `invalid_age_range`
- `invalid_condition`
- `broken_storyline`
- `unreachable_event`

## Explicit Warning-Only Issues

The following issue types are warning-only (`major` or `minor`):

- `empty_content` (`major`)
- `empty_effects` (`major`)
- `invalid_stat` (`major`)
- `same_age_congestion` (`major`)
- `duplicate_title` (`minor`)

## Validation Configuration Source of Truth

Rules are encoded in `scripts/eventQualityGateRules.ts` and exported as:

- `EVENT_QUALITY_SEVERITY_DEFINITIONS`
- `EVENT_QUALITY_RULES`
- `EVENT_QUALITY_BLOCKING_ISSUES`
- `EVENT_QUALITY_WARNING_ONLY_ISSUES`

`US-010` should consume this module directly when implementing the event quality validation command output and fail-on-blocker behavior.
