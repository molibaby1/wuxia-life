# US-021 P1 Quality Gate Report

## Scope

- generatedAt: `2026-04-26T02:42:49.263Z`
- sample: seed=`1`, maxAge=`80`
- This report aggregates rhythm metrics, event quality validation, format status, and condition expression checks for P1->P2 readiness decision.

## Quality Gate Summary

- rhythm_metrics: pass (snapshot generated from deterministic sample `seed=1` / `maxAge=80`)
- event_quality_gate: pass (blocker=0, major=69, minor=12)
- format_validation: attention (target=144, legacy=5, mixed=61)
- condition_expression_checks: pass (3/3)

## Rhythm Metrics Snapshot

- timeline_events: 78
- empty_ages: 3
- formal_ratio: 98.7%
- daily_ratio: 1.3%
- choice_ratio: 76.9%
- storyline_continuity_rate: 0.0%
- critical_event_delay_max: 5y

```text
=== P1 Rhythm Metrics Report ===
sampleId=seed-1-age-80
seed=1
maxAge=80
timelineEvents=78

Metrics:
event_count_per_age=[{"age":0,"count":1},{"age":1,"count":1},{"age":2,"count":0},{"age":3,"count":1},{"age":4,"count":1},{"age":5,"count":0},{"age":6,"count":1},{"age":7,"count":0},{"age":8,"count":1},{"age":9,"count":1},{"age":10,"count":1},{"age":11,"count":1},{"age":12,"count":1},{"age":13,"count":1},{"age":14,"count":1},{"age":15,"count":1},{"age":16,"count":1},{"age":17,"count":1},{"age":18,"count":1},{"age":19,"count":1},{"age":20,"count":1},{"age":21,"count":1},{"age":22,"count":1},{"age":23,"count":1},{"age":24,"count":1},{"age":25,"count":1},{"age":26,"count":1},{"age":27,"count":1},{"age":28,"count":1},{"age":29,"count":1},{"age":30,"count":1},{"age":31,"count":1},{"age":32,"count":1},{"age":33,"count":1},{"age":34,"count":1},{"age":35,"count":1},{"age":36,"count":1},{"age":37,"count":1},{"age":38,"count":1},{"age":39,"count":1},{"age":40,"count":1},{"age":41,"count":1},{"age":42,"count":1},{"age":43,"count":1},{"age":44,"count":1},{"age":45,"count":1},{"age":46,"count":1},{"age":47,"count":1},{"age":48,"count":1},{"age":49,"count":1},{"age":50,"count":1},{"age":51,"count":1},{"age":52,"count":1},{"age":53,"count":1},{"age":54,"count":1},{"age":55,"count":1},{"age":56,"count":1},{"age":57,"count":1},{"age":58,"count":1},{"age":59,"count":1},{"age":60,"count":1},{"age":61,"count":1},{"age":62,"count":1},{"age":63,"count":1},{"age":64,"count":1},{"age":65,"count":1},{"age":66,"count":1},{"age":67,"count":1},{"age":68,"count":1},{"age":69,"count":1},{"age":70,"count":1},{"age":71,"count":1},{"age":72,"count":1},{"age":73,"count":1},{"age":74,"count":1},{"age":75,"count":1},{"age":76,"count":1},{"age":77,"count":1},{"age":78,"count":1},{"age":79,"count":1},{"age":80,"count":1}]
empty_ages=[2,5,7]
formal_event_ratio=98.7% baseline=[50.0%, 90.0%]
daily_event_ratio=1.3% baseline=[10.0%, 50.0%]
choice_event_ratio=76.9% baseline=[20.0%, 80.0%]
storyline_continuity=0/0 (0.0%) baseline=[30.0%, 100.0%]
critical_event_delay_avg=1.88y critical_event_delay_max=5y baseline_max<=15y

Critical event ages:
[0,1,3,4,6,8,13,14,15]

Sample timeline excerpt:
1. age=0 id=birth_wuxia_family category=main_story type=auto storyline=-
2. age=1 id=toddler_exploration category=main_story type=auto storyline=-
3. age=3 id=clever_speech category=main_story type=auto storyline=-
4. age=4 id=childhood_preference category=main_story type=choice storyline=-
5. age=6 id=martial_arts_enlightenment category=main_story type=choice storyline=-
6. age=8 id=childhood_summary category=main_story type=auto storyline=-
7. age=9 id=daily_morning_training_neu_1 category=daily_event type=auto storyline=-
8. age=10 id=setback_injury category=setback type=auto storyline=-
9. age=11 id=setback_injury category=setback type=auto storyline=-
10. age=12 id=setback_injury category=setback type=auto storyline=-
11. age=13 id=youth_begins category=main_story type=auto storyline=-
12. age=14 id=sect_trial_entry category=main_story type=choice storyline=-
13. age=15 id=outlaw_path_beginning category=main_story type=choice storyline=-
14. age=16 id=setback_injury category=setback type=auto storyline=-
15. age=17 id=setback_illness category=setback type=auto storyline=-
16. age=18 id=refugee_sect_story category=special_event type=choice storyline=-
17. age=19 id=setback_injury category=setback type=auto storyline=-
18. age=20 id=family_marriage category=family type=choice storyline=-
19. age=21 id=family_marriage category=family type=choice storyline=-
20. age=22 id=refugee_sect_story category=special_event type=choice storyline=-

Baselines (P1 observation):
{
  "formalEventRatio": {
    "min": 0.5,
    "max": 0.9,
    "label": "P1 observation baseline"
  },
  "dailyEventRatio": {
    "min": 0.1,
    "max": 0.5,
    "label": "P1 observation baseline"
  },
  "choiceEventRatio": {
    "min": 0.2,
    "max": 0.8,
    "label": "P1 observation baseline"
  },
  "storylineContinuityRate": {
    "min": 0.3,
    "max": 1,
    "label": "P1 observation baseline"
  },
  "criticalEventDelayMax": {
    "min": 0,
    "max": 15,
    "label": "P1 observation baseline"
  },
  "emptyAgeCount": {
    "min": 0,
    "max": 20,
    "label": "P1 observation baseline"
  }
}
```

## Event Quality Issue Counts

- scanned_events: 210
- blocker: 0
- major: 69
- minor: 12
- total: 81

## Format Validation Result

- target: 144
- legacy: 5
- mixed: 61
- Baseline explanation: format validation follows P1 policy where blocker issues fail the gate; legacy/mixed are migration-tracking signals for P2/P3 planning.

## Condition Expression Test Result

| check | expression | expected | actual | status |
|---|---|---:|---:|---|
| legal_expression | `player.martialPower >= 30 AND flags.has('is_sect_leader')` | true | true | pass |
| invalid_syntax_fail_close | `(player.age >= 18` | false | false | pass |
| malicious_expression_fail_close | `globalThis.process.exit(1)` | false | false | pass |

## Before/After or Baseline Context

- Baseline explanation is used in this story: deterministic rhythm baseline/reporting pipeline from US-003/US-004 and validator policy from US-010/US-014 are reused without changing business logic.
- This report is a P1 closure snapshot for decision-making; future after-change comparisons should reuse the same seed and maxAge to keep evidence comparable.

## Residual Risks

- Event quality still contains blocker/major issues in current content inventory; release readiness depends on waiver policy or remediation completion.
- Legacy and mixed format events remain in the loaded set; migration debt can increase authoring inconsistency risk.
- Condition checks in this report are smoke-level; full regression confidence still depends on default `npm test` suite.

## P2/P3 Candidate Follow-ups

- P2: prioritize blocker issue remediation in event data, then rerun `npm run validate:event-quality` until blocker=0.
- P2: reduce mixed format count first, then legacy format count using incremental low-risk migrations.
- P3: expand condition expression dedicated test matrix and add report trend history for multi-run quality drift monitoring.

## Regeneration Command

```bash
P1_QUALITY_SEED=1 P1_QUALITY_MAX_AGE=80 npm run report:p1-quality-gate
```