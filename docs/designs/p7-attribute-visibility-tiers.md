# P7 Attribute Visibility Tiers (US-019)

## Tiers

| Tier | Player experience |
| --- | --- |
| explicit | Name, numeric value, and purpose text always visible |
| semi_implicit | Purpose visible; value shown with light fuzz until self-awareness rises |
| implicit | Fuzzy narrative label by default; precise value when self-awareness high |
| hidden | Implementation-only; never shown in panel |

## Assignments

| Attribute | Tier |
| --- | --- |
| martialPower, externalSkill, internalSkill, qinggong, constitution, money | explicit |
| comprehension, charisma, connections, knowledge | semi_implicit |
| reputation, chivalry | implicit |
| martialPotential, socialPotential, learningPotential | hidden |

## Always visible

martialPower, externalSkill, internalSkill, qinggong, constitution, money — see `ALWAYS_VISIBLE_ATTRIBUTE_KEYS` in attribute meanings catalog.
