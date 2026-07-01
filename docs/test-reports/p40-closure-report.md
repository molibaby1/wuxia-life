# P40 Closure Report — P8 Replay And Pacing Polish

> **Stage:** `p40-wuxia-p8-replay-pacing-polish`  
> **Date:** 2026-06-24  
> **Branch:** `codex/p40-wuxia-p8-replay-pacing-polish`

## Summary

P40 cleared the **p8-deviant-ye pacing warning** (7y → **5y**) via content + bootstrap flag wiring, without changing scheduler core or playability metric thresholds. Near-duplicate replay pairs remain at **3** (baseline already ≤3 target). `gate:playability` stays **PASS**; P38 frustration opaque ratios unchanged.

## Deliverables

| Story | Artifact |
| --- | --- |
| P40-001 | `docs/test-reports/p40-pacing-replay-audit.md` |
| P40-002 | `createPersonaSession.ts`, `personaYouthRouteSeeds.ts`, `p9_deviant_youth_route_milestone`, `p40-deviant-ye-pacing-before-after.md` |
| P40-003 | `p9_scholar_academy_gate`, `p9_wealth_caravan_gate` + route bootstrap enabling childhood milestones |
| P40-004 | `tests/p40ReplayPacingPolishTests.ts`, `p40-post-polish-gate-refresh.md`, refreshed `p8-playability-gate-latest.*` |
| P40-005 | This closure |

## Success Metrics

| ID | Target | Result |
| --- | --- | --- |
| M1 deviant-ye span | ≤5y | **5y** Met |
| M2 near-duplicate pairs | ≤3 | **3** Met |
| M3 gate decision | PASS | **PASS** Met |
| M4 frustration | no regression | **0.00** all personas Met |
| M5 tests | pass | P40 + P8 playability Met |

## GAP-P8-WARNINGS Status

**Closed** for deviant-ye pacing (was sole persona-specific pacing warning in PRD scope).

**Residual (documented, non-blocker):**

- 3 near-duplicate pairs remain (stretch 0 not reached)
- Other personas retain 6–7y low-impact spans (warning tier, not PRD hard gate)
- `p8-deviant-ye` achievement `ye-risk-choice` still misses `demonic_midlife_fork` (pre-existing)

## §8 Item 5 Gate-No-Regression

**Unchanged — Met.** P38 absolute playability pass preserved; P40 is polish-only per PRD.

## Verification Commands

```bash
npm run gate:playability
npm exec tsx tests/p40ReplayPacingPolishTests.ts
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/p36ConsistencyTests.ts
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
npm exec tsx tests/p39ContentPoolConsistencyTests.ts
npm exec tsx tests/p8PlayabilityTests.ts
npx tsc --noEmit
```

## Residual Risk Remediation (post-closure)

| Risk | Fix |
| --- | --- |
| P36–P39 carry-forward tests missing on p40 branch | Restored isolated suites + `src/p25/` harness from p39 lineage (selective, no full engine merge) |
| P40 test repeated 25 headless runs (~22min) | Single-bundle refactor → 8 runs per suite |
| Canonical North Star doc absent | Restored `docs/designs/p25-lifetime-simulation-north-star.md` |
| Childhood payoff contract doc referenced but missing | Restored `docs/designs/childhood-payoff-spine-7-13-content-contract.md` |

## Remaining Defer Queue

- Wave 3 `merchant_magnate` / Wave 4 平凡出身扩展
- Full medical pool habit-led migration
- Full setback pool audit (`setback_illness`, `setback_betrayal`, etc.)
- Combinatorial proof / stretch 0 near-duplicates
- Childhood payoff Slice C contract docs — **restored** (`childhood-payoff-spine-7-13-content-contract.md`)

## PRD vs JSON Notes

- PRD baseline cited **7** near-duplicate pairs; current tree pre-P40 already had **3** — audit documents delta.
- PRD cited `childhood-payoff-spine-7-13-content-contract.md` — file not in repo; used `golden-line-spine.json` + `p9-remediation.json` as proxy.
