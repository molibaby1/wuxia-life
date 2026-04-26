# US-012 Event and Effect Format Inventory

- Generated at: 2026-04-26T02:19:02.479Z
- Scanned events: 210
- Scanned effects: 1519
- Data scope: runtime loaded events via `EventLoader.getAllEvents()`

Classification legend:
- `main-flow`: actively used by current main runtime paths.
- `legacy-compatible`: retained compatibility shape still accepted by runtime.
- `suspected-deprecated`: present in data but no clear active runtime consumer.

## top-level event fields

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| core event schema (id/version/category/priority/weight/ageRange/triggers/content/eventType) | 210 | main-flow | Main runtime selection/execution path relies on this schema. |
| event.triggerConditions present | 57 | legacy-compatible | Handled by `EventExecutor.canTriggerEvent` as broad compatibility payload. |
| event.thresholds present | 15 | main-flow | Runtime threshold checker consumes this structure directly. |
| event.requirements present | 3 | legacy-compatible | Used as a compatibility gate (`requirements.attributes`) in runtime selection. |

## content fields

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| content.text string | 210 | main-flow | Main narrative text consumed by UI. |
| content.title string | 210 | main-flow | Used for event title display and diagnostics. |
| content.description string | 155 | legacy-compatible | Optional helper text; not required for runtime progression. |
| content.autoEffects[] | 6 | legacy-compatible | Type marks it as compatibility access path. |
| content.media object | 0 | suspected-deprecated | No active runtime/media execution path found in event engine. |

## autoEffects

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| event.autoEffects[] | 77 | main-flow | Primary auto-event execution path (`executeAutoEvent`). |
| event.content.autoEffects[] | 6 | legacy-compatible | Explicit compatibility field in type definition. |

## effects

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| effect.type present | 1519 | main-flow | Dispatcher requires `type` to select handler. |
| effect.target field | 1403 | main-flow | Primary targeting field for stat/flag/event handlers. |
| effect.value field | 947 | main-flow | Primary value payload used by most handlers. |
| effect.operator field | 561 | main-flow | Arithmetic behavior selector in modifier handlers. |
| effect.flag alias | 58 | legacy-compatible | Backward-compatible alias for flag handlers. |
| effect.stat alias | 34 | legacy-compatible | Backward-compatible alias consumed with `target` fallback. |
| effect.effects nested | 0 | main-flow | Used by random/composite effect handlers. |
| effect.ending_effect payload | 0 | main-flow | Consumed in executor post-processing to mark ending flags. |
| effect.event alias | 0 | legacy-compatible | Backward-compatible alias for event record behavior. |

## choice.effects

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| choice.effects[] | 289 | main-flow | Primary fallback execution path for choice events. |
| choice.effects[] empty | 8 | suspected-deprecated | Runtime warns and treats as non-executable choice payload. |

## choice.outcomes

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| outcome.condition expression object | 36 | main-flow | Preferred condition grammar path. |
| outcome.effects[] | 36 | main-flow | Executable payload once outcome condition matches. |
| choice.outcomes[] present | 12 | main-flow | Core branch-resolution structure in new game engine. |
| outcome.condition function | 0 | legacy-compatible | Handled explicitly in composable as historical compatibility. |
| outcome.condition missing | 0 | legacy-compatible | Treated as always-true branch in runtime helper. |
| outcome.condition other shape | 0 | suspected-deprecated | Runtime warns and treats as unmet condition. |

## requirements

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| event.requirements extra keys | 3 | suspected-deprecated | Not consumed by current core runtime filtering. |
| event.requirements.attributes | 2 | main-flow | Runtime availability filtering checks this map. |
| choice.requirements.statRequirements[] | 1 | legacy-compatible | Propagated to UI payload but lacks strict runtime gate execution. |
| choice.requirements.itemRequirements[] | 0 | legacy-compatible | Propagated to UI payload but lacks strict runtime gate execution. |

## thresholds

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| thresholds.identity | 14 | main-flow | Checked by `checkThresholds` against current identity. |
| thresholds.attributes | 4 | main-flow | Checked by `checkThresholds` in formal selection path. |
| thresholds.background | 2 | main-flow | Checked by `checkThresholds` with background tag evaluation. |
| thresholds.experience | 2 | main-flow | Checked by `checkThresholds` against event history. |

## triggerConditions

| Format | Usage count | Classification | Notes |
| --- | ---: | --- | --- |
| triggerConditions extra keys | 57 | suspected-deprecated | No explicit runtime reader found for additional keys. |
| triggerConditions.identity | 10 | legacy-compatible | Consumed by `EventExecutor.canTriggerEvent` compatibility gate. |
| triggerConditions.choices | 0 | legacy-compatible | Consumed by `EventExecutor.canTriggerEvent` compatibility gate. |
| triggerConditions.karma | 0 | legacy-compatible | Consumed by `EventExecutor.canTriggerEvent` compatibility gate. |

