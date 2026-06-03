# P7 US-001 — Active and Deferred Event Source Baseline

生成时间：2026-06-03

## Active runtime event files (21)

Loaded via `src/data/events.json` imports, wired in `EventLoader`:

| File | Status | Events | 0–30 overlap |
| --- | --- | ---: | ---: |
| origin.json | candidate | 1 | 1 |
| general.json | candidate | 36 | 23 |
| love.json | candidate | 18 | 18 |
| official.json | deferred | 4 | 4 |
| sect-beggars.json | deferred | 15 | 15 |
| sect-border.json | candidate | 15 | 15 |
| sect-marginal.json | candidate | 19 | 19 |
| sect-shaolin.json | candidate | 4 | 4 |
| sect-wudang.json | candidate | 12 | 7 |
| training.json | candidate | 9 | 8 |
| middle-age-career.json | deferred | 12 | 2 |
| family-life.json | deferred | 10 | 3 |
| jianghu-conflict.json | deferred | 8 | 1 |
| elderly-legacy.json | deferred | 12 | 0 |
| identity-hero.json | candidate | 11 | 3 |
| identity-merchant.json | deferred | 5 | 2 |
| identity-demon.json | candidate | 15 | 4 |
| identity-outlaw.json | deferred | 5 | 5 |
| identity-year-events.json | deferred | 12 | 12 |
| faction-revelation.json | candidate | 5 | 5 |
| setback-events.json | candidate | 6 | 6 |

**Runtime total:** 234 events in 21 files.

## Not-wired / deferred event files (39)

Present under `src/data/lines/` but absent from `events.json` imports. Notable 0–30 overlap pools:

- daily.json (38), adventure.json (30), talents.json (16), martial-arts-meeting.json (13)
- money-events.json, training-events.json, talent-events.json, relationship.json, prologue.json
- Full list: see `docs/test-reports/product-experience-governance-event-asset-audit.md`

## Unreachable attribute logic

Events in non-loaded files reference `player.*` conditions that never execute at runtime (e.g. `daily.json`, `money-events.json`, `reputation-events.json`). Within loaded files, **41 events** fail quality/loader validation (`broken` status) — their branches and attribute gates are unreachable until fixed.

Deferred loaded modules (official, beggars, identity-year-events, post-30 identity modules) are wired but deprioritized for golden-line 0–30; attribute logic inside them is weakly reachable compared to candidate spine pools.

## Baseline note

P7 active planning should target **candidate + active spine events** (general, love, training, sect-border/marginal/shaolin/wudang, identity-hero/demon, setback, origin, faction-revelation) for 0–30. Do not plan against the 39 backlog files or 41 broken runtime entries without explicit wiring stories.

Regenerate: `npm run report:event-asset-inventory`
