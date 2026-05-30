# Product Experience Governance — Route Lifecycle Model

**Stories:** US-009  
**Runtime source:** `src/core/RouteStateManager.ts`, `src/core/RouteCompatibilityRules.ts`  
**Machine conflict table:** `src/data/route-conflict-table.json`  
**Scope:** three priority routes (orthodox/sect, wandering hero, demonic path), ages 0–30

---

## 1. Design phases vs runtime lifecycle

| Design phase | Narrative meaning | Runtime `RouteLifecycleState` | Typical trigger |
| --- | --- | --- | --- |
| **Start** 路线启动 | 玩家首次进入该路线承诺窗口 | `inactive` → `active` | `route_*` flag set via choice; `RouteStateManager.syncFromFlagSet` |
| **Commitment** 路线承诺 | 路线成为当前主 arc，可被锁定 | `active` → `locked_in` | `route_*_locked`, trial completion, `lockRoute()` |
| **Conflict** 路线冲突 | 候选路线与现有路线不兼容 | (no new lifecycle; gating only) | `resolveRouteConflict()` in event selection |
| **Turn** 路线转向 | 显式脱离旧路线、进入新路线 | `locked_in`/`active` → `turned` → `active` (new route) | Event with `metadata.routeTransition='turn'` or tag `route_turn` |
| **Completion** 路线完成 | 0–30 early arc 收束 | `*` → `completed` | `route_*_completed`, `completeRoute()` |
| **Failure** 路线失败/放弃 | 试炼失败、退出门派、拒绝魔道等 | `*` → `failed` | `route_*_failed`, `failRoute()`, or abandonment flags |

Additional runtime states:

| State | Use |
| --- | --- |
| `temporary` | 试探性并存（soft exclusion 且未 lock-in）；PXG4 gate 视为 active |
| `inactive` | 默认；路线从未写入或已清空 |

**Precedence when multiple signals exist:** `routeStates` canonical record > `route_*` flags > heuristic (`getDominantPaths`).

---

## 2. Priority route identity mapping

| PRD route | `routeId` | Primary flag | `sect_faction` when committed |
| --- | --- | --- | --- |
| Orthodox / sect | `sect` | `route_orthodox` | `orthodox` |
| Wandering hero | `wanderer` | `route_wanderer` | `neutral` or unset |
| Demonic path | `demonic` | `route_demonic` | `unconventional` |

Heroic wandering also maps to `hero` routeId when `hero_path` / chivalry-driven events fire; golden-line wanderer arc uses `wanderer` + `hero_first_case` beats. Conflict rules treat `hero` ↔ `wanderer` as **coexist**.

---

## 3. Entry conditions (Start)

| Route | Age window | Entry event / choice | Durable writes | `routeStates` transition |
| --- | ---: | --- | --- | --- |
| Sect | 13–14 | `sect_path_choice` → `join_orthodox` | `route_orthodox`, `orthodox_trial_active` | `sect`: inactive → active (main) |
| Wanderer | 13+ | `sect_path_choice` → `stay_wanderer` | `route_wanderer` | `wanderer`: inactive → active (main) |
| Demonic | 14–17 | `demonic_encounter` → `accept_demonic` | `route_demonic`, `current_sect` | `demonic`: inactive → active (main) |

**Admission:** entry choice must pass active event admission (valid trigger, executable choice, player-facing feedback, durable write).

---

## 4. Commitment conditions (Lock-in)

| Route | Commitment beat | Age | Lock signal | Lifecycle |
| --- | --- | ---: | --- | --- |
| Sect | `orthodox_trial_completion` or `sect_trial_final` success | 15–18 | `orthodox_trial_completed` / `sect_trial_completed` | `sect` → `locked_in` |
| Wanderer | `hero_first_case` (first public heroic act) | 20–30 | `hero_first_case` flag | `wanderer` → `locked_in` (via route sync) |
| Demonic | `demonic_usurpation` or sustained `demonic_power_struggle` | 17–30 | `demonic_path_usurp` / struggle flags | `demonic` → `locked_in` |

Soft commitment (pre-lock): sect trial chain (`orthodox_trial_entry` → `orthodox_trial_service`), demonic trial chain, `jianghu_experience` for wanderer — lifecycle stays `active`, `lockedIn: false`.

---

## 5. Conflict handling

Conflict is **not** a separate lifecycle state. When a candidate route event is selected:

1. Read locked core routes from `routeStates` where `lockedIn=true` and lifecycle ≠ `failed`.
2. Call `resolveRouteConflict({ currentMainRoute, currentSecondaryRoutes, candidateRoute, lockedIn })`.
3. Apply action:
   - `block_candidate` — event removed from pool (strong exclusion).
   - `require_turn_event` — allowed only if event is explicit turn (`routeTransition='turn'`).
   - `allow_coexist` — proceed; may set `temporary` for secondary route.

Priority route hard exclusions: **sect ↔ demonic**, **hero ↔ demonic**. See `src/data/route-conflict-table.json`.

---

## 6. Turn, completion, failure

### Turn (转向)

Required when soft exclusion + `lockedIn=true`. Turn event must:

- Set `metadata.routeTransition: "turn"` OR `metadata.tags` includes `route_turn`
- Write new `route_*` flag and update prior route to `turned` or `failed` via effects
- Example future anchors: `demonic_renounce_path` (demonic → wanderer redemption turn)

### Completion (完成)

- `RouteStateManager.completeRoute(routeId)` or `route_*_completed` flag sync
- Sets `lifecycle: completed`, `lockedIn: true`
- 0–30 sect completion: `orthodox_trial_completion` after `orthodox_trial_service_done`

### Failure / abandonment (失败/放弃)

| Route | Failure / turn-away condition | Signal | Lifecycle |
| --- | --- | --- | --- |
| Sect | Trial force fail + no recovery; expulsion | `orthodox_trial_force_failed`, `route_orthodox_failed` | `sect` → `failed` |
| Wanderer | Refuse all heroic beats; join sect instead | `join_orthodox` after `route_wanderer` | wanderer → `turned`; sect → `active` |
| Demonic | `decline_demonic` at encounter; `demonic_renounce_path` | no `route_demonic`; renounce flags | `demonic` → `failed` or never activated |

---

## 7. History and debug presentation

### Canonical storage

| Field | Content |
| --- | --- |
| `routeStates[routeId]` | Current snapshot: `lifecycle`, `category`, `lockedIn`, `lastChangedAtAge`, `sourceEventId`, `reason` |
| `routeHistory[]` | Transition log: `from`, `to`, `age`, `eventId`, `reason`, `timestamp` |
| `eventHistory[]` | Synthetic entries `route_state:{routeId}:{lifecycle}` on each transition |

### Player-facing (PXG5 default flow)

- Show route **display name** + **phase label** (启动 / 承诺 / 完成 / 失败), not raw flag names.
- Derive phase from `lifecycle` + `lockedIn`:

| Display phase | Condition |
| --- | --- |
| 未入门 | lifecycle `inactive` |
| 路线进行中 | `active` or `temporary` |
| 已承诺 | `locked_in` |
| 已转向 | `turned` |
| 已完成 | `completed` |
| 已失败 | `failed` |

### Debug / simulation report (PXG4)

Each tick SHOULD log:

```json
{
  "age": 16,
  "eventId": "orthodox_trial_service",
  "routeStates": { "sect": { "lifecycle": "active", "lockedIn": false } },
  "routeFlags": ["route_orthodox"],
  "routeHistoryTail": [{ "routeId": "sect", "from": "inactive", "to": "active", "age": 13 }]
}
```

**Contradiction detection:** two priority routes both `active|locked_in|temporary` with a `strong_exclusion` pair in conflict table → gate fail (PXG4 US-018).

---

## 8. Verification evidence

- Lifecycle types defined in `RouteStateManager.ts` (`RouteLifecycleState`, `RouteStateRecord`, `RouteHistoryRecord`).
- Flag sync: `syncFromFlagSet` maps `route_*`, `route_*_locked`, `_completed`, `_failed`.
- Conflict resolution: `RouteCompatibilityRules.ts` + tests in `tests/AllTests.ts` (US-009 regression).
- Machine-readable priority conflict table: `src/data/route-conflict-table.json`.

---

*PXG3 / US-009 — 2026-05-30*
