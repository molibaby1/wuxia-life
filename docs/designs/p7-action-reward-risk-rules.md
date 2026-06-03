# P7 Action Reward and Risk Rules (US-008)

## Reward channels (minimum actions)

| Action | Primary rewards | Secondary |
| --- | --- | --- |
| training | externalSkill, internalSkill, martialPower | constitution (+small) |
| study | comprehension, knowledge | charisma (+small) |
| socializing | connections, charisma | reputation (+small) |

## Cost / opportunity cost

| Action | Cost |
| --- | --- |
| training | energy −5, money −10 (supplies) |
| study | money −15 (books), energy −3 |
| socializing | money −20 (entertainment) |

## Risk levels

| Action | Risk | Disturbance weight modifier |
| --- | --- | --- |
| training | low | 0.8× |
| study | low | 0.6× |
| socializing | medium | 1.2× |

## Repeated focus

- Same category chosen **3+ times in a row**: reward multiplier decays to 0.7×; risk +1 tier (low→medium)
- Alternating categories reset decay counter

Implementation: `ActionResultResolver` reads `state.actionFocusStreak` (engine-maintained).
