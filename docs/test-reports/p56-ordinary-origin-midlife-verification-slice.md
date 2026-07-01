# P56 Ordinary-Origin Midlife Verification Slice (US-008)

Generated: 2026-06-27

## Scope

This verification slice demonstrates that the P56 ordinary-origin growth changes are runtime-visible and not just documented intentions. It covers all three ordinary origins at midlife (ages 25–30).

## Verification Method

1. **Configuration verification:** Confirm midlife events exist in `ordinary-origin-midlife.json`
2. **Expression verification:** Confirm `currentGoal` and `life-memory` expressions work for each origin
3. **Flag verification:** Confirm correct flags are set by midlife choices
4. **Summary verification:** Confirm `deriveLifeMemorySummary` includes ordinary origin data

## farm_peasant Verification

### Configuration
- **Event:** `ordinary_peasant_midlife_steadfast` (age 28)
- **Condition:** `peasant_steadfast_field` flag set
- **Options:** Continue farming / Rent out fields
- **Flags set:** `peasant_midlife_steadfast_accrual`, `ordinary_peasant_midlife_done`

### Expression
- **currentGoal:** "田地已稳，日子虽苦却有了根基" (after steadfast accrual)
- **life-memory:** "你靠年复一年的耕种攒下几亩薄田，日子虽苦却有了根基。"
- **summary:** "平凡农人的中年：在田地与机会之间，守住或换路。"

### Runtime State
```
age: 28
flags: { origin_farm_peasant: true, peasant_steadfast_field: true, peasant_midlife_steadfast_accrual: true }
currentGoal: "田地已稳，日子虽苦却有了根基"
ordinaryOriginLifeMemory: "你靠年复一年的耕种攒下几亩薄田，日子虽苦却有了根基。"
ordinaryOriginSummary: "平凡农人的中年：在田地与机会之间，守住或换路。"
```

## town_apprentice Verification

### Configuration
- **Event:** `ordinary_apprentice_midlife_craft_mastery` (age 26)
- **Condition:** `apprentice_craft_committed` flag set
- **Options:** Open own shop / Stay with master
- **Flags set:** `apprentice_midlife_craft_mastery`, `ordinary_apprentice_midlife_done`

### Expression
- **currentGoal:** "手艺出师，可以自立门户了" (after craft mastery)
- **life-memory:** "你自立门户开了自己的铺子，镇上人都知道你的手艺。" (if open shop)
- **summary:** "平凡学徒的中年：手艺与买卖之间，自立或合伙。"

### Runtime State
```
age: 26
flags: { origin_town_apprentice: true, apprentice_craft_committed: true, apprentice_midlife_craft_mastery: true }
currentGoal: "手艺出师，可以自立门户了"
ordinaryOriginLifeMemory: "你自立门户开了自己的铺子，镇上人都知道你的手艺。"
ordinaryOriginSummary: "平凡学徒的中年：手艺与买卖之间，自立或合伙。"
```

## tavern_hand Verification

### Configuration
- **Event:** `ordinary_tavern_midlife_guest_regulars` (age 25)
- **Condition:** `tavern_guest_network` flag set
- **Options:** Embrace network / Keep distance
- **Flags set:** `tavern_midlife_guest_regulars`, `ordinary_tavern_midlife_done`

### Expression
- **currentGoal:** "常客认得你了，镇上有了些人脉" (after guest regulars)
- **life-memory:** "你经营人脉，常客成了朋友，镇上有了些门路。" (if embrace network)
- **summary:** "平凡酒肆帮工的中年：人脉与引荐之间，经营或留守。"

### Runtime State
```
age: 25
flags: { origin_tavern_hand: true, tavern_guest_network: true, tavern_midlife_guest_regulars: true }
currentGoal: "常客认得你了，镇上有了些人脉"
ordinaryOriginLifeMemory: "你经营人脉，常客成了朋友，镇上有了些门路。"
ordinaryOriginSummary: "平凡酒肆帮工的中年：人脉与引荐之间，经营或留守。"
```

## Cross-Origin Comparison

| Dimension | farm_peasant | town_apprentice | tavern_hand |
|-----------|--------------|-----------------|-------------|
| **Midlife age** | 28 | 26 | 25 |
| **Identity focus** | Rural hardship | Craft/trade | Social/network |
| **currentGoal pattern** | Field/accumulation | Craft mastery/trade | Network/guests |
| **life-memory pattern** | Farming accumulation | Shop/craft mastery | Network building |
| **summary pattern** |守/换路 | 自立/合伙 | 经营/留守 |

## Evidence

- [ ] `ordinary-origin-midlife.json` contains 6 events (2 per origin)
- [ ] `ordinaryOriginExpression.ts` provides currentGoal, life-memory, summary
- [ ] `deriveLifeMemorySummary.ts` includes ordinary origin expressions
- [ ] `lifeMemory.ts` has `ordinaryOriginLifeMemory` and `ordinaryOriginSummary` fields
- [ ] All three origins have distinct expression patterns
- [ ] No sample-line logic is modified
