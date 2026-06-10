# v1.0 Before/After Findings

## Targeted launch-readiness issues
1. No unified launch surface audit with ship / borderline / blocker classification.
2. RC release judgment implicit — false-positive internal health invisible.
3. Internal-external alignment gaps not machine-readable for ship decisions.
4. No post-launch hotfix / patch / content-wave cadence.

## After v1.0 RC workflow
- 6 launch dimensions with calibration baselines.
- 6/6 baselines distinguish stronger/weaker slices.
- 1 false-positive RC sample(s); 1 redirection(s); 1 targeted fix(es).
- RC wave: pass (6/6 cases).
- Full closure: pass (aligned share 100%).
- Post-launch cadence documented in docs/designs/v1-0-post-launch-cadence.md.

## Regression check
- gate:playability: PASS
- gate:p12-profile: PASS
- gate:p20: PASS
- gate:p23: PASS