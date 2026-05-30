# Minimum Playable Layout (US-020)

**Phase:** PXG5 / Product Experience Governance  
**Scope:** Web player flow (`App.vue` → `GameScreen.vue`), not mini-program, not full visual redesign.

---

## 1. Information surfaces (required on screen)

| Surface | Desktop (≥768px) | Mobile (<600px) |
| --- | --- | --- |
| **Character header** | Name, age, in-game date, sect (if any), save/load | Same; header stacks vertically |
| **Core stats** | 4-column grid (功力/外功/内功/轻功 + 侠义/体魄/悟性/银两) | 2-column grid |
| **Route summary** | Route display name + lifecycle phase label | Same |
| **Relationships** | Role, name, affinity per row | 2-row compact card |
| **Event narrative** | Story text ≥15px, readable line-height | Same, slightly reduced padding |
| **Choice feedback** | Narrative outcome + structured impacts (stats, relations, route, long-term) | Same; scrollable content area |
| **Choices / continue** | Full-width buttons, max 720px centered | Full-width within viewport |

---

## 2. Explicit non-goals (this phase)

- No full UI redesign, new art direction, or component library migration
- No WeChat mini-program layout or API work
- No backend separation or cloud save UI

---

## 3. Implementation mapping

| Requirement | Implementation |
| --- | --- |
| Desktop readable width | `#app` max-width 960px; `GameScreen` content padding 32px |
| Mobile stat density | `@media (max-width: 600px)` → 2-column stats grid |
| Route clarity | `getPlayerRouteSummary()` — display name + phase per route-lifecycle §7 |
| Player-facing labels | `src/utils/playerFacingLabels.ts`; no raw `route_*` in feedback |
| Debug isolation | `src/utils/debugAccess.ts`; panel only when `?debug=1` in dev |

---

## 4. Browser verification

| Viewport | Check |
| --- | --- |
| Desktop ~1280×800 | Header, stats, story, choices visible without horizontal scroll |
| Mobile ~390×844 | Stats 2-col; choices tappable; content scrolls |

**Note:** Automated browser verification was not run in the delivering session (no dev-browser MCP session). Manual verification: `npm run dev`, open `/` with and without `?debug=1`.

---

*PXG5 / US-020 — 2026-05-30*
