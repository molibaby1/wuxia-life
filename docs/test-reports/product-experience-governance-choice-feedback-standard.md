# Product Experience Governance — Choice Feedback Standard

**Stories:** US-006  
**Runtime reference:** `src/composables/useNewGameEngine.ts`, `src/core/ChoiceFeedbackGenerator.ts`, `src/types/choiceFeedback.ts`

---

## 1. Required feedback layers

Every **active golden-line choice** must expose three layers after execution:

| Layer | Field / source | Player sees |
| --- | --- | --- |
| **Immediate narrative** | `outcome.text`, `choice.description`, or non-vague `choice.text` | 发生了什么（场景结果） |
| **Visible impact** | `ChoiceFeedbackModel.player.statImpacts`, `relationshipImpacts`, `routeImpact`, `longTermFlags` | 哪些属性/关系/路线发生变化 |
| **Future implication** | durable flags + optional `riskHints` | 哪条长期线被打开（如「你正式成为武当弟子」） |

Resolution order (runtime):

1. Matched `choice.outcomes[].text`
2. `choice.description`
3. Effect-derived narrative (`generateOutcomeText`) — **not sufficient alone for active spine**
4. Fallback (`createChoiceFeedbackFallback`) — **banned for active golden-line**

---

## 2. Allowed visible impact categories

| Category | Effect types | UI visibility |
| --- | --- | --- |
| Stats | `stat_modify` | player |
| Relationship | `relation_change` | player |
| Route | `route_*` flags, `sect_faction`, `current_sect` | player |
| Identity | identity flags, `lifepath_*` | player when narratively explained |
| Reputation | `reputation`, karma | player |
| Money / health | `money_modify`, health stats | player |
| Long-term flag | `flag_set` with narrative tie-in | player when surfaced in copy |

---

## 3. Hidden impacts

| Hidden | Why |
| --- | --- |
| Raw effect JSON / event ids | diagnostic only |
| `fallbackUsed`, `fallbackReason` | test/log only |
| Cooldown counters, internal weights | engine state |
| Stat delta without narrative | **not allowed** as sole active feedback |

---

## 4. Banned vague patterns

Defined in `src/data/golden-line-feedback-patterns.ts`. Active golden-line choices **must not** use:

- `你的选择激起了涟漪，后续影响仍在发酵。` (fallback default)
- `你的心中泛起涟漪，但一切似乎又归于平静。` (empty effect generator)
- Standalone `你获得了新的体悟`
- Standalone `与某人的关系发生了微妙的变化`
- Blank / missing narrative when effects exist

Gate: `npm run report:golden-line-feedback` (exit 1 on failure).

---

## 5. Examples

### Acceptable

1. **Route entry:** 「你拜入正道名门，清虚真人收你为徒，从此走上行侠仗义之路。」+ routeImpact `route_orthodox`
2. **Trial outcome:** 「你出手相助，击退歹徒。老者感激不已，侠义之举传为美谈。」+ chivalry/reputation impacts
3. **Demonic cost:** 「你接受幽冥尊者传功，正式踏上幽影门之路，江湖也将视你为异类。」+ chivalry −, martialPower +

### Unacceptable

1. （无文案，仅 stat 变化）→ 触发 fallback 涟漪句
2. 「你获得了新的体悟。」（无具体事件指称）
3. 「与某人的关系发生了微妙的变化。」（无对象、无原因）

---

## 6. Authoring checklist (active spine)

- [ ] Each choice has `outcomes[].text` **or** `description`
- [ ] Route/identity flags have narrative mention
- [ ] No reliance on `generateOutcomeText` alone
- [ ] Passes `npm run report:golden-line-feedback`

---

*PXG2 — 2026-05-30*
