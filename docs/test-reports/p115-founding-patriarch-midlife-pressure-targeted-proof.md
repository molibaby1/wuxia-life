# P115 Founding Patriarch Midlife Pressure Targeted Proof

> **Stage:** P115 Founding Patriarch Midlife Pressure Playable Implementation
> **Date:** 2026-07-02

## Chain validation

| Step | Gate | Checkpoint |
| ---- | ---- | ---------- |
| On-ramp | `founding_patriarch_on_ramp_done` | entry from P113 |
| Pressure (40-45) | `on_ramp_done && !midlife_pressure_done` | `founding_patriarch_midlife_pressure_done` + branch marker |
| Payoff (48-52) | `midlife_pressure_done && !payoff_done` | `founding_patriarch_payoff_done` + payoff marker |

## Branch sample signals

- Rule-first branch sets `founding_patriarch_pressure_rule_first`
- Alliance-first branch sets `founding_patriarch_pressure_alliance_first`
- Both branches keep cost label as `门派延续之重`
- Goals keep both `门规传承` and `盟约续责` while remaining branch-distinct
