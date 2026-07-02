# P115 Founding Patriarch Midlife Pressure Closure Report

> Stage: P115 Wuxia Founding Patriarch Midlife Pressure Playable Implementation  
> Date: 2026-07-02  
> Decision: GO

## Implementation delivered

- Added `founding_patriarch_midlife_pressure` single core choice event (`40-45`) between on-ramp and payoff.
- Added pressure checkpoint `founding_patriarch_midlife_pressure_done` and branch markers:
  - `founding_patriarch_pressure_rule_first`
  - `founding_patriarch_pressure_alliance_first`
- Rewired payoff gate to require pressure checkpoint before `founding_patriarch_payoff_echo`.
- Updated orthodox player-facing pressure expressions:
  - cost label: `门派延续之重`
  - current goal keeps both `门规传承` and `盟约续责`, with scholar/alliance variant distinction.

## Validation evidence

- Targeted P115 proof: `docs/test-reports/p115-founding-patriarch-midlife-pressure-targeted-proof.md`
- Updated chain proof (on-ramp -> pressure -> payoff): `docs/test-reports/p113-founding-patriarch-bridge-chain-proof.md`
- P115 targeted test: `npm exec tsx tests/p115FoundingPatriarchMidlifePressureTests.ts`

## Regression boundaries

Executed and passed:

- `npm run typecheck`
- `npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts`
- `npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts`
- `npm exec tsx tests/p103MerchantMartialPatronBridgeOriginTests.ts`
- `npm exec tsx tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts`
- `npm exec tsx tests/p106MerchantMartialPatronPressureTests.ts`
- `npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts`
- `npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts`
- `npm exec tsx tests/p112MerchantMartialPatronEndgameTests.ts`
- `npm run guard:sample-lines-baseline`

## Deferred scope

- Multi-event pressure chain expansion (keep single-event pressure in P115).
- Founding-patriarch expansion for ordinary-origin routes.
- Late-life and endgame deepening for founding-patriarch line.

## Risks and notes

- Pressure stage remains intentionally lightweight and single-node; narrative density is bounded by design.
- Existing unrelated modules are untouched; changes are limited to founding-patriarch event spine, expression surface, and targeted tests/reports.
