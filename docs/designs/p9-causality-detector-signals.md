# P9 Causality Detector — New Detectable Signal Types

Extended in P9 US-015 (`src/p8/collectPersonaMetrics.ts`).

## Direct echo signals (counted)

| Signal type | Detection rule |
|-------------|----------------|
| Hard token match | Later event text contains early action/choice id token |
| Choice flag echo | Flag value contains `from_choice` |
| Explicit echo flags | `p9_explicit_*` flags set true |
| Summary echo flags | `p9_summary_echo_*` with non-empty value |
| Configured echo hook | Event id matches echoHooks callbackEventId when hook flag set |
| Narrative callback | Text matches 幼年/早年/当初/那一贯 + early action has echo hook |
| Route identity signal | `p9_route_identity_*` or milestone flag after early hook |
| Identity label progression | identity.primary set after early action (non-generic) |

## Explicitly NOT counted as direct echo

| Signal type | Bucket |
|-------------|--------|
| Generic stat growth text (提升/增加/成长 without 因) | generic_stat |

See `docs/test-reports/p9-causality-detector-verification.md` for regression evidence.
