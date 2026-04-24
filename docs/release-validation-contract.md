# Release Validation Contract

This project uses a fixed pre-merge quality gate. Every change must pass the same checks locally and in CI.

## Required Checks

Run these commands in order:

1. `npm run typecheck`
2. `npm run build`
3. `npm test`

Or run the combined gate:

- `npm run validate`

## What `npm test` Means

`npm test` executes the real regression gate:

- `AllTests`
- `IntegrationTests`
- `testGameSimulation`

The gate runs all suites sequentially and returns non-zero if any suite fails.

## Local Workflow

Before opening a PR:

1. Install dependencies with `npm ci` (or `npm install` when lockfile updates are intended).
2. Run `npm run validate`.
3. Do not merge while any check is red.

## CI Workflow

CI runs the same gate in `.github/workflows/ci.yml`:

- `npm run typecheck`
- `npm run build`
- `npm test`

Any failure blocks merge readiness.

## Warning Hygiene Requirements

Release validation requires warning hygiene in addition to pass/fail exit codes:

- Do not ignore warnings that indicate invalid environment setup, incompatible data contract, or broken persistence paths.
- Treat warning patterns previously fixed in this repo (for example `Unknown stat:*` and invalid localstorage path warnings) as regressions if they reappear in gate logs.
- When introducing a new warning class, document whether it is expected and how it is monitored; otherwise resolve it before merge.

## Release Checklist

All items must be true before merge:

- `npm run typecheck` passes
- `npm run build` passes
- `npm test` passes (real regression gate)
- Gate logs have no unresolved critical warnings
- Local run result is reproducible in CI using the same command set
