# P21 Content Addition Workflow Rules (US-003)

Explicit workflow for adding new wuxia content from authoring through validation.

## Workflow Steps

1. **Classify intent** — route-sensitive, stage-sensitive, callback-sensitive, endgame/legacy, or general pool filler.
2. **Check constraint surface** — read `WorldProfile.contentStyleConstraints` and `contentDuplicateConstraints` for route/stage/tone/duplicate boundaries.
3. **Author content** — edit JSON in `src/data/lines/` using `EventDefinition` + `authoringSemantics` metadata; for echoes, follow `EchoHookAuthoringContract` in `authoringSchema.ts`.
4. **Wire imports** — add path to `events.json` imports and `EventLoader.ts` lineMap (until declarative loader exists).
5. **Declare scheduling** — set `metadata.narrativeScheduling.stageSignals` and `routePoints` when event affects route/stage identity.
6. **Run validation chain**:
   - `npm run typecheck`
   - `npm run validate:event-quality`
   - `npm run gate:p21` (style/fit/duplicate matrix)
   - `npm test` (regression)
7. **Record evidence** — append findings to `docs/test-reports/p21-production-matrix-latest.json`.

## Minimum Required Artifacts

| Artifact | Purpose |
| --- | --- |
| Event JSON (or echo hook + callback event) | Content body |
| `authoringSemantics` on event metadata | LLM/human field guide |
| `events.json` import entry | Loader discoverability |
| P21 production matrix row | Quality/fit/duplicate evidence |
| Gate pass (`gate:p21`, `validate:event-quality`) | Regression safety |

## Echo / Callback Addition Sub-Workflow

1. Add `onCompleteFlags` to source action in `activeActionCatalog.ts`.
2. Add `EchoHook` entry with `authoringContract` in `echoHooks.ts`.
3. Add callback event with matching `flags.has("<hookFlag>")` condition.
4. Optionally add `summaryContribution` and route divergence reference.
5. Validate via `gate:p21` echo wiring check and `report:p9-verification` if route signal affected.

## Non-Goals

- Do not add runtime logic for content that can be expressed in JSON + profile metadata.
- Do not skip `authoringSemantics` on P21 sample or LLM-generated events.
