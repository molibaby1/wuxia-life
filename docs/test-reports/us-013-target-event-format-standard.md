# US-013 Target Event Format Standard

This standard defines the single recommended event/effect shape for new content in P1.
It is based on runtime consumers in `EventLoader`, `GameEngineIntegration`, and `EventExecutor`.

## 1. Target Event Structure (Canonical)

All new events should follow this shape:

```json
{
  "id": "event_unique_id",
  "version": "1.0.0",
  "category": "main_story | side_quest | random_encounter | time_event | daily_event | special_event",
  "priority": 0,
  "weight": 100,
  "ageRange": { "min": 18, "max": 25 },
  "triggers": [{ "type": "age_reach", "value": 18 }],
  "conditions": [{ "type": "expression", "expression": "player.martialPower >= 30" }],
  "thresholds": {
    "attributes": { "martialPower": { "min": 30 } }
  },
  "cooldown": 2,
  "maxTriggers": 1,
  "storyLine": "sect_growth_arc",
  "content": {
    "title": "事件标题",
    "text": "事件正文"
  },
  "eventType": "auto | choice | ending",
  "metadata": {
    "enabled": true,
    "tags": ["mainline"],
    "autoResolve": false
  }
}
```

Canonical requirements:
- Keep effect payloads on top-level `autoEffects` (for auto events) or `choices[].effects` / `choices[].outcomes[].effects` (for choice events).
- Keep narrative text in `content.title` + `content.text`.
- Keep runtime gates in `conditions` and `thresholds`; avoid legacy gate containers for new content.

## 2. Target Effect Structure (Canonical)

All new effects should use `type + target + value (+ operator)` as the first-class shape.

```json
{
  "type": "stat_modify | flag_set | flag_unset | event_record | relation_change | random | special | karma_change | set_faction | lifepath_add_focus | lifepath_record_achievement | lifepath_add_commitment | lifepath_add_relationship | trigger_event | life_state_change | time_advance",
  "target": "martialPower",
  "value": 5,
  "operator": "add"
}
```

Field guidance:
- `type` is mandatory and must map to an `EffectType` handler.
- `target` is the canonical target key for stat/flag/event/relation/lifepath handlers.
- `value` carries numeric or structured payload.
- `operator` is used when arithmetic behavior is required (`add`, `set`, `subtract`, `multiply`, `divide`).
- Use `effects` only for nested random/composite branches.

## 3. Standard Forms by Event Mode

### 3.1 Auto Event Standard Form

```json
{
  "eventType": "auto",
  "content": {
    "title": "拜师入门",
    "text": "你正式拜入门下。"
  },
  "autoEffects": [
    { "type": "flag_set", "target": "joined_sect", "value": true },
    { "type": "stat_modify", "target": "martialPower", "value": 8, "operator": "add" }
  ]
}
```

### 3.2 Choice Event Standard Form

`choices[].outcomes[]` is the recommended branch form.
If outcomes are not needed, use `choices[].effects` as a single direct branch.

```json
{
  "eventType": "choice",
  "choices": [
    {
      "id": "accept",
      "text": "接受邀请",
      "effects": [],
      "outcomes": [
        {
          "id": "success",
          "text": "你成功赢得了对方信任。",
          "condition": { "type": "expression", "expression": "player.charisma >= 35" },
          "effects": [
            { "type": "relation_change", "target": "npc_master_lin", "value": 10, "operator": "add" },
            { "type": "flag_set", "target": "trust_built", "value": true }
          ]
        }
      ]
    }
  ]
}
```

## 4. Deprecated Fields and Migration Window

The following fields are still compatibility-accepted but are deprecated for new content:

| Deprecated field/shape | Canonical replacement | Status |
| --- | --- | --- |
| `effect.flag` | `effect.target` (with `type: "flag_set"`/`"flag_unset"`) | deprecated |
| `effect.stat` | `effect.target` (with `type: "stat_modify"`) | deprecated |
| `effect.event` | `effect.target` (with `type: "event_record"`/`"trigger_event"`) | deprecated |
| `content.autoEffects` | top-level `autoEffects` | deprecated |
| `requirements.attributes` as main gate entry | `conditions` + `thresholds.attributes` | legacy-compatible only |
| broad `triggerConditions` payload | explicit `conditions` + `thresholds` | legacy-compatible only |

Migration window:
- **Start:** 2026-04-26 (US-013 accepted)
- **Target freeze:** 2026-05-31 (all new/edited events must use canonical format)
- **Removal planning window:** 2026-06-01 to 2026-06-30 (compatibility aliases can be removed after US-014/US-015 migration evidence is complete)

## 5. Authoring Checklist (Single Correct Shape)

- Event base fields (`id/version/category/priority/weight/ageRange/triggers/content/eventType`) are complete.
- Effects use canonical `type + target + value (+ operator)` shape.
- Auto events use top-level `autoEffects`.
- Choice events prefer `outcomes` with expression conditions for branch clarity.
- No new deprecated aliases (`stat`/`flag`/`event`, `content.autoEffects`) are introduced.
