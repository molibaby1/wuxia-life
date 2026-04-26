# US-007 Event Repetition Reproduction

## Local Command

```bash
npm run repro:event-repetition
```

## Fixed Input

- Seed strategy: fixed deterministic search `1..200` (default), first matched seed is reported.
- Reproduced seed: `1`
- Max age: `40` (default `REPRO_MAX_AGE=40`)

## Reproduction Result

- Adjacent repetition issues found: `7`
- Sample adjacent repeated events/classes:
  - `age=11 setback_injury -> setback_injury` (`same_event`, class=`injury`)
  - `age=12 setback_injury -> setback_injury` (`same_event`, class=`injury`)
  - `age=22 merchant_first_trade -> merchant_first_trade` (`same_event`, class=`economy`)
  - `age=33 merchant_first_trade -> merchant_expand_business` (`same_class`, class=`economy`)
  - `age=35 merchant_expand_business -> merchant_expand_business` (`same_event`, class=`economy`)

## Raw Output Snapshot

```text
=== Event Repetition Reproduction Report ===
seed=1
maxAge=40
trackedEvents=9
adjacentRepetitionIssues=7
Adjacent repetition issues:
1. age=11 setback_injury -> setback_injury reason=same_event repeatedClasses=injury
2. age=12 setback_injury -> setback_injury reason=same_event repeatedClasses=injury
3. age=22 merchant_first_trade -> merchant_first_trade reason=same_event repeatedClasses=economy
4. age=33 merchant_first_trade -> merchant_expand_business reason=same_class repeatedClasses=economy
5. age=35 merchant_expand_business -> merchant_expand_business reason=same_event repeatedClasses=economy
6. age=36 merchant_expand_business -> merchant_expand_business reason=same_event repeatedClasses=economy
7. age=39 merchant_expand_business -> merchant_expand_business reason=same_event repeatedClasses=economy
```
