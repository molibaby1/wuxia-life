# P12 World Profile Gate Report

Generated: 2026-06-10T08:45:40.449Z

## Decision: **PASS**

## Profile sections

| Section | Present | Count |
|---------|---------|-------|
| stats | yes | 14 |
| resources | yes | 3 |
| identityTracks | yes | 8 |
| actionFamilies | yes | 5 |
| summarySignals | yes | 4 |
| stageConfig | yes | 4 |
| routeDefinitions | yes | 8 |
| echoHooks | yes | 6 |
| summaryTemplates | yes | 11 |

## Profile-first readers

- **narrative.age40_identity**: Age-40 identity assembly (profile routes/echo; template helper deferred)
- **narrative.echo_summary**: Echo-derived summary variables
- **narrative.stage_purpose**: Stage purpose by age
- **narrative.stage_feedback**: Stage feedback expectation by age
- **narrative.echo_hook_lookup**: Echo hook resolution from flags
- **p11.scheduling_routes**: P11 active route resolution
- **p11.report_routes**: P11 route baseline reporting
- **p11.stage_baseline**: P11 stage baseline reporting
- **p11.signal_detection_stage**: P11 stage signal detection
- **p8.echo_metrics**: P8 persona echo callback metrics
- **active.minimum_actions**: Minimum active action set for 0-40 slice

## Deferred readers

- **config.summary_template**: Age-40 summary template selection — Reads WUXIA_SUMMARY_TEMPLATES const; same array reference as profile.summaryTemplates
- **config.route_helpers**: Direct route lookup helper — Legacy config helper; profile assembly uses the same routeDefinitions array
- **config.stage_helpers**: Direct stage config enumeration — Legacy config helper; profile assembly uses the same stageConfig array
- **config.echo_helpers**: Direct echo hook lookup helpers — Legacy config helper; runtime metrics migrated to profile echo helpers
- **attribute.meanings**: Player attribute cognition labels — UI cognition layer; not part of executable world pack in P12
- **engine.player_state**: Authoritative numeric stat storage — Save schema unchanged; profile supplies metadata only

## Save schema

- Changed in P12: **no**

## Messages

- Deferred readers (6): config.summary_template, config.route_helpers, config.stage_helpers, config.echo_helpers, attribute.meanings, engine.player_state
