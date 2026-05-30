# Debug Intrusion Policy (US-021)

**Phase:** PXG5  
**Goal:** Default player flow feels like a game, not a debug console.

---

## 1. Allowed in production-like player flow

- Player narrative text and choice labels
- Human-readable route names and lifecycle phases
- Structured feedback (stats, named relationships, route change summaries)
- Save / load controls (browser `prompt` / `alert` — known limitation, not debug)

---

## 2. Not allowed in default player flow

- Raw event ids (`orthodox_trial_service`, etc.)
- Raw condition JSON or engine diagnostics
- Debug panel toggle or console hijacking
- Raw `route_*` flag keys in UI copy
- Unlabeled `relationId` strings

---

## 3. Development-only debug entry

| Mechanism | Behavior |
| --- | --- |
| `import.meta.env.PROD` | Debug UI **disabled** entirely |
| Dev + `?debug=1` | Enables debug toggle + `DebugPanel` |
| Dev + `localStorage wuxia-debug=1` | Same as query param |

Implementation: `src/utils/debugAccess.ts`, wired in `src/App.vue`.

`DebugPanel` may show event ids and logs — acceptable **only** behind this entry.

---

## 4. Feedback pipeline

`ChoiceFeedbackGenerator` maps route flags to display labels; hides relationship impacts without a resolved name; only exposes long-term flags with player-facing labels.

---

*PXG5 / US-021 — 2026-05-30*
