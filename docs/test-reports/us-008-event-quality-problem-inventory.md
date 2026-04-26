# US-008 Event Quality Problem Inventory

## Scope

This inventory defines the known event quality problem types that P1 quality gates must target.
It is intentionally read-only and does not modify any event content.

## Severity Model

- `blocker`: Must fail validation; can break progression, cause runtime risk, or make content unreachable.
- `major`: Should not block local iteration but must be fixed before release quality sign-off.
- `minor`: Hygiene issue; track and fix in normal content maintenance.

## Inventory of Known Problem Types

| Problem type | Proposed severity | Why it matters | Gate detection hint |
| --- | --- | --- | --- |
| Duplicate titles | minor | Low direct runtime risk, but creates authoring confusion and weak searchability. | Normalize title text and report repeated values. |
| Duplicate IDs | blocker | Event identity collisions break trigger history, cooldown, and deterministic references. | Fail when the same `id` appears more than once. |
| Invalid age ranges | blocker | Impossible or inverted age windows break selection flow and can create dead content. | Validate `minAge <= maxAge` and bounds within supported life span. |
| Empty content | major | Player-facing narrative becomes blank or incoherent, reducing readability and UX quality. | Flag empty/whitespace-only main text and required outcome text. |
| Empty effects | major | Event executes without meaningful state impact when impact is expected by design. | Flag required effect containers that are empty arrays/objects. |
| Invalid conditions | blocker | Malformed condition payloads can bypass intended gating or always fail. | Validate condition shape and supported grammar fields/operators. |
| Invalid stats | major | Unknown stat keys or malformed stat payloads reduce balancing reliability and create warning noise. | Validate stat keys against canonical modifiable stat list. |
| Same-age congestion | major | Too many events targeting one age bucket causes rhythm spikes and poor pacing. | Report high concentration ages and compare against baseline threshold. |
| Broken storylines | blocker | Story chain discontinuity causes narrative stalls and impossible follow-up progression. | Validate storyline predecessor/successor references and chain integrity. |
| Unreachable events | blocker | Content can never trigger, wasting authoring effort and hiding progression paths. | Detect impossible constraints (age/condition/storyline/trigger conflicts). |

## Notes for Follow-up Stories

- `US-009` should formalize this inventory into blocker/major/minor gate policy.
- `US-010` should implement structured scanning output (`event ID`, `source`, `issue type`, `severity`, `explanation`) based on this inventory.
- This story only inventories and classifies risks; no event data files are modified.
