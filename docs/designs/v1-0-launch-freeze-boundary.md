# v1.0 Launch Freeze Boundary

Defines what may change during the v1.0 release-candidate window without reopening phase-style expansion.

## Freeze scope

| Layer | Frozen during RC | Allowed during RC |
|-------|------------------|-------------------|
| Runtime core | Scheduler rewrite, simulation architecture, save format breaking changes | Bug fixes, guard rails, reporting hooks, profile schema extensions with migration |
| Content | New themes, new archetype families, broad pool expansion | Targeted copy/tuning on existing events, blocker-fix samples, calibration waves |
| Tuning | Global rebalance passes, whole-life pacing rewrites | Dimension-targeted tuning tied to RC comparison samples |
| UI | Layout redesign, new screens, visual overhaul | Copy clarity, blocker notices, report surfacing |
| Process | New Pxx phase roadmaps, open-ended optimization sprints | RC review, alignment comparison, bounded closure waves |

## RC change classes

1. **Ship-critical fix** — Resolves a release blocker; requires RC sample or alignment evidence.
2. **Launch-quality polish** — Improves borderline dimension without destabilizing strong areas; must pass targeted comparison.
3. **Deferred** — Documented in RC evaluation `deferredItems`; not merged during v1.0 RC.

## Exit criteria

The freeze lifts only when:

- v1.0 RC gate passes with no open `release-blocking` blockers.
- Post-launch cadence is documented and referenced in closure report.
- Upstream gates (playability, profile, replayability, P23 acceptance) remain non-regressed.

## Non-goals during freeze

- Second theme or major content vertical
- Automated release judgment without human RC review
- Reopening P25-style systems expansion under another label
