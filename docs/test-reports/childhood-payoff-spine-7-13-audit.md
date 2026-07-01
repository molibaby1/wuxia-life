# Childhood Payoff Spine 7–13 — Audit (Slice C US-001)

Read-only root-cause inventory before Slice C content work.

## Problem Band

P8 baseline: all 8 personas **6–7y** low-impact span, **ages 7–13/14**.

## Root Causes

| Cause | Evidence |
| --- | --- |
| Spine autos crowded out | `preteen_training`, `childhood_summary` in allowlist but often not selected vs active planning filler |
| Missing anchors 9, 11 | Golden spine jumped 8→10→12; deferred `prologue_peer_competition` (age 9) not runtime-loaded |
| Auto copy not impact-tagged | `late_childhood_prep`, `youth_begins` lacked 路线/身份/里程碑 keywords |
| Conditional payoff | `martial_focus_payoff` requires `martialPathDeclared` |

## Impact Record Mechanism

`isPacingImpactRecord` counts: choice, active_action, p9_/p16_ ids, allowlisted ids, keyword regex.

## Slice C Response

1. Add **`childhood_path_signal`** (age 9 choice) and **`pre_youth_milestone`** (age 11 choice), priority 1000
2. Enrich `preteen_training`, `late_childhood_prep`, `youth_begins` copy
3. Wire `golden-line-spine.json` anchors 9, 11

## Classification

**world profile / content structure** — not tuning_config (Slice B exhausted).

Generated: 2026-06-23.
