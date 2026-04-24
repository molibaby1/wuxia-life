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
