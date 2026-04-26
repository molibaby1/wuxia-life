# Release Validation Contract

This project uses a fixed pre-merge quality gate. Every change must pass the same checks locally and in CI.

## Required Checks

Run these commands in order:

1. `npm run typecheck`
2. `npm run build`
3. `npm test`
4. `npm run validate:event-quality`
5. `npm run stability`

Or run the combined gate:

- `npm run validate` (runs all five stages above)

Run `npm run validate:event-quality` whenever event content, event metadata, or event condition/effect format changes. It is also part of the default merge gate (`npm run validate`) and CI.

## What `npm test` Means

`npm test` executes the real regression gate:

- `AllTests`
- `IntegrationTests`
- `testGameSimulation`

The gate runs all suites sequentially and returns non-zero if any suite fails.

Additionally, the runner performs **log-aware blocking**: if aggregated stdout/stderr contains any **Blocker** substring defined in `tests/qualityGatePolicy.ts`, the gate fails even when every suite exited with code `0`. See `docs/test-output-severity-taxonomy.md`.

## Stability Gate

`npm run stability` runs `tests/testGameSimulation.ts` repeatedly (default **20** runs, override with `STABILITY_RUNS`). Each run must exit `0` and must not contain Blocker substrings in its captured log. Specification: `docs/stability-gate.md`.

## Local Workflow

Before opening a PR:

1. Install dependencies with `npm ci` (or `npm install` when lockfile updates are intended).
2. Run `npm run validate`.
3. Do not merge while any check is red.

Environment conventions (localStorage, `NODE_OPTIONS`, CI parity): `docs/test-environment-conventions.md`.

## CI Workflow

CI runs the same gate in `.github/workflows/ci.yml`:

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run validate:event-quality`
- `npm run stability`

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
- `npm test` passes (real regression gate + log-aware Blocker scan)
- `npm run validate:event-quality` passes (no Blocker-level content quality issues)
- `npm run stability` passes (default batch count)
- Gate logs contain **zero** Blocker-keyword hits (see `docs/test-output-severity-taxonomy.md`)
- Gate logs have no unresolved critical warnings
- Local run result is reproducible in CI using the same command set

## Autonomous PRD execution (optional)

To drive the Ralph loop via Cursor Agent headless mode (`cursor agent --print --trust --force`), use:

- `scripts/ralph-cursor-agent.sh [path/to.prd.json]`

Requires `cursor`, `jq`, and valid Cursor agent authentication. The script reads the next `passes: false` story by `priority`, invokes the agent with the `ralph-run` skill path, and repeats until all stories are complete.
