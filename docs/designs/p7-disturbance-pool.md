# P7 Random Disturbance Pool (US-032)

## Trigger sources

- After active action execution (25% base chance, modified by action category)
- Not triggered on forced critical events in same tick

## Minimum metadata

`id`, `title`, `weight`, `sourceKind: random_disturbance`

## Action type weight influence

| Category | Modifier |
| --- | --- |
| training | 0.8× |
| study | 0.6× |
| socializing | 1.2× |

## Return to action loop

Disturbance recorded separately in `actionHistory`; no automatic chain. Player returns via continue → `getNextEvent` → action offering or story event.

Implementation: `DisturbanceResolver.ts`
