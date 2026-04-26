# US-004 Rhythm Baseline Report

## Baseline Inputs

- seed: `1`
- maxAge: `80` (complete life sample)
- generatedAt: `2026-04-26T01:52:11.450Z`

## Local Regeneration Command

```bash
RHYTHM_BASELINE_SEED=1 RHYTHM_BASELINE_MAX_AGE=80 npm run report:rhythm-baseline
```

## P1 Rhythm Metrics (Baseline Snapshot)

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
choice_event_ratio=82.1% baseline=[20.0%, 80.0%]
storyline_continuity=0/0 (0.0%) baseline=[30.0%, 100.0%]
critical_event_delay_avg=2.09y critical_event_delay_max=5y baseline_max<=15y

Critical event ages:
[0,1,3,4,6,8,13,14,16,17,20,23]

Sample timeline excerpt:
1. age=0 id=birth_wuxia_family category=main_story type=auto storyline=-
2. age=1 id=origin_background category=main_story type=choice storyline=-
3. age=3 id=clever_speech category=main_story type=auto storyline=-
4. age=4 id=childhood_preference category=main_story type=choice storyline=-
5. age=6 id=martial_arts_enlightenment category=main_story type=choice storyline=-
6. age=8 id=childhood_summary category=main_story type=auto storyline=-
7. age=9 id=daily_morning_training_pos_1 category=daily_event type=auto storyline=-
8. age=10 id=setback_injury category=setback type=auto storyline=-
9. age=11 id=setback_injury category=setback type=auto storyline=-
10. age=12 id=setback_injury category=setback type=auto storyline=-
11. age=13 id=sect_path_choice category=main_story type=choice storyline=-
12. age=14 id=sect_trial_entry category=main_story type=choice storyline=-
13. age=15 id=outlaw_identity_beginning category=identity type=choice storyline=-
14. age=16 id=outlaw_path_beginning category=main_story type=choice storyline=-
15. age=17 id=outlaw_training category=main_story type=choice storyline=-
16. age=18 id=outlaw_mentor category=side_quest type=choice storyline=-
17. age=19 id=outlaw_mercy_choice category=side_quest type=choice storyline=-
18. age=20 id=outlaw_training category=main_story type=choice storyline=-
19. age=21 id=merchant_first_trade category=identity type=choice storyline=-
20. age=22 id=merchant_first_trade category=identity type=choice storyline=-

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

## Representative Age Bands

| band | age_range | ages | total_events | avg_events_per_age | empty_ages |
|---|---:|---:|---:|---:|---:|
| childhood | 0-12 | 13 | 10 | 0.77 | 3 |
| adolescence | 13-18 | 6 | 6 | 1.00 | 0 |
| young_adult | 19-35 | 17 | 17 | 1.00 | 0 |
| midlife | 36-55 | 20 | 20 | 1.00 | 0 |
| late_life | 56-80 | 25 | 25 | 1.00 | 0 |

## Baseline Notes

- This baseline is deterministic under fixed seed and max age.
- Use the same command and inputs for before/after rhythm comparison in follow-up stories.
- P1 metric definitions come from `npm run report:rhythm-metrics` output.