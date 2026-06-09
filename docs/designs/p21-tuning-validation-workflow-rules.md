# P21 Tuning And Validation Workflow Rules (US-004)

Explicit workflow for tuning weights, distribution, or pacing through config with evidence-based validation.

## Tuning Workflow Steps

1. **Identify tuning class** — route/event distribution, stage pacing/payoff spacing, or archetype/replayability/endgame coverage.
2. **Select config surface** — `pathAffinity`, `routeDefinitions`, `archetypePacingProfiles`, `repetitionPressureConfigs`, `archetypeFamilyConfigs.baseWeight`, or `TuningSampleConfig` in P21 profile.
3. **Apply bounded change** — use `TuningSampleConfig` or documented profile field; avoid `GameEngineIntegration` edits unless classified as minimal runtime support.
4. **Run before snapshot** — `npm run gate:p21` captures baseline matrix and tuning comparison slice.
5. **Apply tuning** — config-only edit in profile or event metadata.
6. **Run after snapshot** — re-run `gate:p21`, relevant phase gates (`gate:p20`, `gate:p11-scheduling`), `gate:playability`.
7. **Compare evidence** — inspect `p21-tuning-comparison-slice.json` for measurable route/pacing/archetype deltas.
8. **Sign off** — tuning accepted when matrix shows improved target metric without blocker regressions.

## Validation Evidence Requirements

| Tuning type | Required reports |
| --- | --- |
| Route/event distribution | P21 tuning comparison + P11 scheduling gate |
| Stage pacing / payoff spacing | P21 pacing delta + P20 pacing comparison slice |
| Archetype / replayability | P20 archetype regression matrix + P21 production matrix |
| Endgame distribution | P19 gate + P21 endgame fit findings |

## LLM-Assisted Tuning

- Input/output bounded by `LlmTuningContract` in `src/p21/llmTuningContract.ts`.
- Allowed output fields listed per tuning class; disallowed: direct `GameEngineIntegration` edits.
- Validation via `validateTuningOutput()` before merge.

## Rollback

- Revert profile or JSON diff; re-run `gate:p21` and `gate:playability` to confirm parity.
