# Product Experience Governance — Event Asset Audit

生成时间：2026-05-30T18:03:21.936Z

## Summary

- Runtime-loaded files: **21**
- Non-loaded files: **39**
- Runtime events total: **234**

### Event status counts

| Status | Count |
| --- | ---: |
| active | 36 |
| candidate | 73 |
| broken | 41 |
| deferred | 84 |
| dead | 0 |

## Runtime-loaded files

| File | Status | Events | 0-30 overlap | Notes |
| --- | --- | ---: | ---: | --- |
| elderly-legacy.json | deferred | 12 | 0 | Primarily post-30 or non-golden-line identity module |
| faction-revelation.json | candidate | 5 | 5 | Golden-line candidate pool (PXG2 selects active spine) |
| family-life.json | deferred | 10 | 3 | Primarily post-30 or non-golden-line identity module |
| general.json | candidate | 36 | 23 | Golden-line candidate pool (PXG2 selects active spine) |
| identity-demon.json | candidate | 15 | 4 | Priority route golden-line pool (PXG2 selects active spine) |
| identity-hero.json | candidate | 11 | 3 | Priority route golden-line pool (PXG2 selects active spine) |
| identity-merchant.json | deferred | 5 | 2 | Primarily post-30 or non-golden-line identity module |
| identity-outlaw.json | deferred | 5 | 5 | Primarily post-30 or non-golden-line identity module |
| identity-year-events.json | deferred | 12 | 12 | Primarily post-30 or non-golden-line identity module |
| jianghu-conflict.json | deferred | 8 | 1 | Primarily post-30 or non-golden-line identity module |
| love.json | candidate | 18 | 18 | Golden-line candidate pool (PXG2 selects active spine) |
| middle-age-career.json | deferred | 12 | 2 | Primarily post-30 or non-golden-line identity module |
| official.json | deferred | 4 | 4 | Non-priority route per scope freeze (official/beggars ≠ PRD priority routes) |
| origin.json | candidate | 1 | 1 | Golden-line candidate pool (PXG2 selects active spine) |
| sect-beggars.json | deferred | 15 | 15 | Non-priority route per scope freeze (official/beggars ≠ PRD priority routes) |
| sect-border.json | candidate | 15 | 15 | Priority route golden-line pool (PXG2 selects active spine) |
| sect-marginal.json | candidate | 19 | 19 | Priority route golden-line pool (PXG2 selects active spine) |
| sect-shaolin.json | candidate | 4 | 4 | Priority route golden-line pool (PXG2 selects active spine) |
| sect-wudang.json | candidate | 12 | 7 | Priority route golden-line pool (PXG2 selects active spine) |
| setback-events.json | candidate | 6 | 6 | Golden-line candidate pool (PXG2 selects active spine) |
| training.json | candidate | 9 | 8 | Priority route golden-line pool (PXG2 selects active spine) |

## Non-loaded files (deferred backlog)

| File | Events | 0-30 overlap |
| --- | ---: | ---: |
| adventure.json | 37 | 30 |
| assassin.json | 15 | 10 |
| buddhist.json | 23 | 18 |
| career-paths.json | 7 | 4 |
| chivalry-events.json | 10 | 8 |
| daily.json | 39 | 38 |
| dynasty-change.json | 15 | 2 |
| economy.json | 10 | 9 |
| follower.json | 15 | 5 |
| good-evil-war.json | 15 | 6 |
| identity-assassin.json | 5 | 3 |
| identity-beggar.json | 5 | 4 |
| identity-doctor.json | 5 | 3 |
| identity-frontier-specific.json | 3 | 3 |
| identity-hermit.json | 5 | 3 |
| identity-merchant-specific.json | 3 | 3 |
| identity-official.json | 5 | 3 |
| identity-scholar-specific.json | 4 | 4 |
| identity-scholar.json | 5 | 3 |
| identity-sect_leader.json | 5 | 2 |
| inheritance.json | 15 | 2 |
| jianghu-crisis.json | 10 | 3 |
| love-marriage-conflict.json | 6 | 6 |
| love-mature.json | 8 | 1 |
| martial-arts-meeting.json | 13 | 13 |
| medical.json | 17 | 11 |
| merchant.json | 16 | 10 |
| money-events.json | 12 | 12 |
| non-combat.json | 6 | 6 |
| orthodox.json | 28 | 17 |
| prologue.json | 5 | 5 |
| relationship.json | 10 | 10 |
| reputation-events.json | 8 | 4 |
| reputation.json | 10 | 6 |
| rumor.json | 10 | 5 |
| shop.json | 12 | 11 |
| talent-events.json | 6 | 6 |
| talents.json | 16 | 16 |
| training-events.json | 6 | 6 |

## Documentation mismatches

- Historical docs claiming 35 events or full 0-80 coverage are stale; see scope freeze registry.
- Runtime actually loads **21** files with **234** events.
- Simulation: `npm run simulate:golden-line` uses sect/wanderer/demonic (0–30). Legacy `gate:experience` still runs 85-year official/beggars/demonic samples.

## Machine source of truth

JSON manifest: `src/data/event-asset-manifest.json`

Regenerate: `npm run report:event-asset-inventory`
