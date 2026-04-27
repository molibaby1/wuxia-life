# US-016 Simulation Thresholds and Gate

## Scope

- Define blocker-level simulation gate checks.
- Define warning-only simulation gate checks.
- Enforce waiver list format with mandatory reason.

## Implemented

- Added executable gate module: `scripts/gameplaySimulationGate.ts`.
  - Maps simulation reports to metric values.
  - Evaluates blocker/warning/info metrics against `P2_SIMULATION_METRIC_DEFINITIONS`.
  - Supports dynamic `ending_distribution` escalation (`warning > 0.70`, `blocker > 0.85`).
  - Requires waiver format `metricKey:reason`; empty reason is rejected.
- Extended CLI in `scripts/runGameplaySimulation.ts`.
  - `--gate`: print pass/fail gate signal.
  - `--waive=metricKey:reason`: register waivers with explicit reasons.
  - Gate works for single run and `--samples` mode.
- Added regression coverage in `tests/AllTests.ts`.
  - Blocker threshold violation returns `fail`.
  - Waiver parser rejects missing reasons.
  - Valid waiver can downgrade blocker failure and allow pass.

## Acceptance Mapping

- Blocking simulation metrics are defined: **Done** (`choice_rate`, `route_breakage_rate`, dynamic `ending_distribution` blocker escalation).
- Warning-only simulation metrics are defined: **Done** (`auto_event_rate`, `route_completion_rate`, `death_rate`, dynamic `ending_distribution` warning).
- Waiver list support requires reasons: **Done** (`parseWaiverArg` + `validateWaivers`).
- `npm test` passes: **Validated in this story**.
