# v1.0 Launch Surfaces Audit

Read-only audit of launch-facing experience surfaces (P8–P24). No gameplay changes in this audit.

## Classification legend

| Status | Meaning |
|--------|---------|
| launch-ready | Sufficient for v1.0 RC with monitoring |
| borderline | Shippable with documented mitigation or patch plan |
| release-blocking | Must fix or defer with explicit RC hold |

## Surface inventory

| Surface | Primary evidence | Status | Main risk |
|---------|------------------|--------|-----------|
| First-run quality | P8 playability, P16 origin, P7 active planning | borderline | Internal gate can pass while first-session prose clarity still weak |
| Replay value | P20 replay slices, repetition pressure | launch-ready | Cross-run desire still proxy-only without playtest capture |
| Route clarity | P11 scheduling, P8 route tracks, P20 pacing | borderline | Scheduling health conflated with route legibility |
| Mid/late payoff | P17 consequences, P23 acceptance baselines | launch-ready | Outward payoff still partially proxy |
| Legacy / endgame | P18 legacy, P19 endgame, historical memory | launch-ready | Category match ≠ aftertaste in human review |
| Technical stability | playability gate, profile gate, AllTests | launch-ready | Regression if RC fixes broaden beyond freeze boundary |
| Report health | P12–P24 machine-readable gates | launch-ready | Over-trusting internal reports without alignment indicators |

## Main launch risks

1. **Internal-external misalignment** — P23 can pass while first-run readability or ending aftertaste fail in playtest.
2. **False-positive RC confidence** — Strong internal health with weak outward appeal not systematically caught without RC samples.
3. **Unbounded RC scope** — Without freeze boundary, fixes drift into phase-style expansion.
4. **Post-launch vacuum** — Without cadence definition, team reverts to open-ended Pxx roadmap.

## v1.0 targets (addressed by RC workflow)

- Profile-first playtest dimensions, baselines, and RC comparison samples
- Alignment indicators for ship / hold / patch decisions
- Machine-readable validation matrix and closure wave
- Documented freeze, blocker, and post-launch cadence rules
