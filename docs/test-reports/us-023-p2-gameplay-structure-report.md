# US-023 P2 Gameplay Structure Report

## Scope

- generatedAt: `2026-04-27T00:29:11.649Z`
- sample strategy: fixed 3 persona samples (`martial-riser`, `merchant-weaver`, `bond-keeper`), complete-life simulation, save-restore enabled
- evidence sources: `tests/AllTests.ts` (choice feedback coverage), `GameProcessSimulator` sample reports, `gameplaySimulationGate` metric evaluation

## Acceptance Coverage

- choice feedback coverage: 7/7
- route completion rate: 0.00%
- route breakage rate: 0.00%
- simulation metrics: pass (blocking fail count: 0)
- save consistency: 3/3 (100.00%)

## Choice Feedback Coverage Detail

| coverage item | status |
|---|---|
| manual_choice_feedback_case | pass |
| auto_resolve_choice_feedback_case | pass |
| stat_impact_assertion | pass |
| relationship_impact_assertion | pass |
| route_impact_assertion | pass |
| long_term_flag_assertion | pass |
| fallback_text_assertion | pass |

## Simulation Sample Snapshot

| persona | seed | total events | total choices | saves | loads | ending |
|---|---:|---:|---:|---:|---:|---|
| 凌霄 | 11 | 142 | 60 | 14 | 1 | 有明显成就，但状态、关系或代价阻止了它成为完美结局。 |
| 沈绫 | 37 | 146 | 63 | 14 | 1 | 一生持续向上，但始终差一步，留下了明显遗憾。 |
| 顾晚 | 73 | 148 | 63 | 14 | 1 | 一生持续向上，但始终差一步，留下了明显遗憾。 |

## Simulation Metrics

| metric | severity | actual | status | detail |
|---|---|---:|---|---|
| choice_rate | blocker | 42.66% | pass | actual=0.4266, min=0.2, max=0.75 |
| route_breakage_rate | blocker | 0.00% | pass | actual=0.0000, min=0, max=0.4 |
| auto_event_rate | warning | 57.34% | pass | actual=0.5734, min=0.25, max=0.8 |
| route_completion_rate | warning | 0.00% | fail | actual=0.0000, min=0.1, max=0.6 (below min) |
| death_rate | warning | 100.00% | fail | actual=1.0000, min=0.15, max=0.9 (above max) |
| ending_distribution | info | 66.67% | pass | actual=0.6667 |
| romance_family_achievement_rate | info | 0.00% | warning | actual=0.0000, min=0.05, max=0.7 (below min) |
| save_count | info | 14.00 | warning | actual=14.0000, min=0, max=12 (above max) |

## Save Consistency

- total consistency checks: 3
- passed checks: 3
- failed checks: 0
- pass rate: 100.00%

## Residual Risks

- Current route metrics are aggregated by final route lifecycle state, which can hide per-route progression volatility within one life.
- Choice feedback coverage is assertion-source driven (test presence); it confirms regression coverage existence but not narrative quality scoring.
- Current simulation snapshot contains warning/info-level metric breaches (for example route completion/death/save count), so P3 kickoff should bind follow-up thresholds and trend tracking before tightening release gates.

## P3 Candidate Follow-ups

- Split route completion/breakage metrics by route type (`main`/`secondary`) and add trend tracking across baseline snapshots.
- Add narrative quality scoring for choice feedback (clarity/completeness) rather than structural assertions only.
- Promote save consistency from aggregate pass-rate to mismatch taxonomy dashboard (field-level trend and root-cause buckets).

## Regeneration Command

```bash
npm run report:p2-gameplay-structure
```