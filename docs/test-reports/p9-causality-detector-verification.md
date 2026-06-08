# P9 Causality Detector Verification

Generated: 2026-06-08T14:40:31.752Z

## Positive case
- Training echo path produces directEchoCount > 0 when p9 events fire

## Negative case
- Generic stat-only progression counted as generic_echo, not direct_echo (see p9PlayabilityTests)

## New detectable signal types
- `p9_explicit_*` echo flags
- `p9_summary_echo_*` summary references
- Configured echo hook callback events (echoHooks.ts)
- Narrative text callbacks (幼年/早年/当初 + early action hook)
- Route identity flags following early action hooks
- Identity label progression following early actions
