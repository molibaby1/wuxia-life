# P11 Stage-Aware Scheduler Wiring Verification

Generated: 2026-06-07

## Positive example: missing `relationship_shift` boosts candidate priority

**Setup**
- Player age: 25 (stage `stage_20_30`)
- Expected stage signals include `relationship_shift`
- No prior relationship-shift flag in state

**Scheduler context**
- `missingStageSignals`: includes `relationship_shift`
- Event `p11_relationship_shift_midlife` declares `metadata.narrativeScheduling.stageSignals: ['relationship_shift']`

**Priority change**
- Base route multiplier: 1.0
- Stage bias multiplier (`getStageSchedulingMultiplier`): **2.2**
- Combined narrative multiplier (`getNarrativeSchedulingMultiplier`): **> 1**

**Diagnostic reason string**
- `stage-missing:route_reinforcement,identity_signal,relationship_shift` (exact missing set varies by run state)

## Conclusion

Stage-aware scheduling reads live stage feedback gaps and increases weight for content that declares matching stage signal coverage. The bias is multiplicative on existing formal-event weighting, not a forced script.
