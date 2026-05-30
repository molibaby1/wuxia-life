# Product Experience Governance — State Field Audit

**US-014** 交付物。在 `docs/test-reports/us-007-route-identity-faction-field-inventory.md` 只读盘点基础上，给出黄金人生线（0–30）治理口径。

**Scope reference：** `docs/PRD/product-experience-governance-scope-and-guardrails.md` §5.1

---

## 1. Golden-line field policy

| Classification | Golden-line usage |
| --- | --- |
| **main-flow** | 新规则与 PXG2/PXG3 必须优先使用 |
| **legacy-compatible** | 可读可写，但不得新增平行语义；PXG3 conflict table 须声明与 main-flow 关系 |
| **suspected-deprecated** | 不得用于新 golden-line 写入；仅兼容读取 |

---

## 2. Route-like fields

| Field / signal | Write | Read | Golden-line class | Notes |
| --- | --- | --- | --- | --- |
| `route_orthodox` → `routeStates.sect` | sect-wudang/shaolin events | GameScreen, RouteStateManager | **main-flow** | Orthodox/sect priority route |
| `route_wanderer` / `route_border` → wanderer | sect-wudang, sect-border | RouteStateManager, events | **main-flow** | Wandering hero |
| `route_demonic` → demonic | sect-marginal, identity-demon | RouteStateManager, events | **main-flow** | Demonic path |
| `route_official` | official.json | events, UI | **legacy-compatible** | Non-priority; deferred for golden line |
| `route_beggars` | sect-beggars.json | events, UI | **legacy-compatible** | Non-priority; deferred |
| `sect_faction` flag | FlagSetHandler | ChoiceFeedback, events | **main-flow** | Faction stance; coordinate with route_* |
| `*_path` legacy flags | old events | some expressions | **suspected-deprecated** | Do not add new writes |
| `state.lifePath.primaryIdentity` | LifePathManager | LifePathManager | **legacy-compatible** | Parallel to `state.identity`; PXG3 picks primary conflict source |
| `state.identity.*` | IdentitySystem, EventExecutor | triggers, endings | **main-flow** | Preferred for new golden-line identity reads |

---

## 3. Identity, karma, relationship

| Field | Golden-line class | PXG2/PXG3 guidance |
| --- | --- | --- |
| `state.identity.identities` / `primary` | main-flow | Childhood + route commitment beats |
| `state.karma.*` | main-flow | Demonic/moral conflict payoffs |
| `state.relations` / `player.relationships` | main-flow | Mentor/relationship beats |
| `state.criticalChoices.*` | main-flow | Key choice → payoff map (PXG2) |
| `state.player.sect` | suspected-deprecated | Use flags + routeStates for new work |
| `state.lifePath.faction` | legacy-compatible | Align with sect_faction where possible |

---

## 4. Fields to avoid for new golden-line work

- `player.sect`（展示层旧字段）
- 新 `*_path` flags（与 `route_*` 并存）
- 仅写 `lifePath.primaryIdentity` 而不更新 `state.identity` 的新逻辑
- non-priority route flags（`route_official`, `route_beggars`）作为三条优先路线主 arc

---

## 5. History / debug presentation (preview for PXG3/PXG5)

Player-facing route state should derive from:

1. `routeStates` canonical ids（sect / wanderer / demonic）
2. `route_*` flags when routeStates unset
3. Never show raw flag names in default player flow (PXG5)

Debug reports may list both `routeStates` snapshot and active `route_*` flags for contradiction detection (PXG4).

---

## 6. Handoff

- **→ PXG2：** 优先 `criticalChoices` + `route_*` + `routeStates` 作为 key choice 写入/读取审计点。
- **→ PXG3：** 以 `RouteCompatibilityRules` + 上表 main-flow fields 构建 conflict table。
- **→ PXG4：** route health gate 输入 = `routeStates` + priority `route_*` flags；contradiction = sect+demonic 等 hard exclusion 同时 active。

---

*PXG1 交付 — 2026-05-30*
