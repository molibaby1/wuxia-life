# P16 Stage Agency Design Rules (US-003)

Approved agency split for childhood, youth, and adulthood.

## Target Agency Split

| Stage | Age band | Player agency | Primary drivers |
|-------|----------|---------------|-----------------|
| Early childhood | 0–7 | **Low** — observe and react | Origin, family resources, environment events |
| Late childhood | 8–12 | **Limited** — 1–2 age-fit choices per window | Upbringing exposure + light preferences |
| Youth | 13–20 | **Moderate** — route exploration begins | Training focus, social seeds, mentor encounters |
| Adulthood | 21+ | **High** — strategic planning | Composite requirements, reputation, resources |

## Core Principle

**Childhood is shaped more by origin and circumstance than by direct route choice.**

- Formal spine events (birth, toddler, preference, summary) carry most narrative weight.
- Active actions in childhood are **experience framing** (play-like training, listening to elders), not career optimization.
- Route-entry flags (`p9_early_*`) should not fire from commerce/travel/socializing before age 13.

## Invalid or Heavily Limited Actions (Early Childhood 0–7)

| Action class | Policy |
|--------------|--------|
| Commerce (`business`) | **Suppressed** — replaced by passive family-resource events |
| Independent travel (`travel`) | **Suppressed** |
| Paid networking (`socializing`) | **Suppressed** |
| Formal study (`study`) | **Suppressed** — implicit learning via events only |
| Martial practice (`training`) | **Allowed** — lowest-friction age-fit action |

## Late Childhood (8–12) Allowlist

| Action | Policy |
|--------|--------|
| `training` | Allowed |
| `study` | Allowed (light scholarly exposure) |
| `business`, `travel`, `socializing` | **Suppressed** until youth band |

## Replacement / Suppression Behavior

- Suppressed actions **do not appear** in the active-action choice list.
- When only training (and optionally study) remain, story-gap pacing uses those plus daily/formal events.
- No silent downgrade to commerce/travel for empty pools.

## Validation

- P16 childhood agency gate checks no suppressed action IDs appear in records for ages 0–7 (and 8–12 for business/travel/socializing).
- At least one meaningful choice remains in late childhood via formal events or allowlisted actions.

## Youth (13–20) — Stage-10 executable rules

**Cross-reference:** US-001 baseline (`docs/test-reports/early-childhood-stage10-baseline-audit.md`) — pre-Stage-10 code path `age > 12 → getMinimumActions()` dumps all five `action_*_basic` every tick; US-003 replaces with `resolveYouthActionPalette`.

### Age band boundaries

| Band | Ages | Resolver | Agency |
| --- | --- | --- | --- |
| Late childhood (Stage-9) | ≤12 | `resolveChildhoodActionPalette` (unchanged) | Limited — training/study only |
| **Youth** | **13–20** | **`resolveYouthActionPalette`** | **Moderate** — route exploration begins |
| Adulthood | >20 | `getMinimumActions()` | High — full P7 minimum pool |

Constants: `YOUTH_MIN_AGE = 13`, `YOUTH_MAX_AGE = 20`.

### Moderate agency definition (13–20)

- Player may plan across **training**, **study**, **socializing**, **business**, **travel** — not the unrestricted 21+ strategic pool rhythm.
- **Palette cap:** ≤5 categories per tick; origin + persona ranking preserved (`scoreYouthCategories`).
- **Lite-before-basic gradient:**
  - Ages **13–15:** lite ids preferred for all categories.
  - Ages **16–17:** `training` / `study` may use `action_*_basic`; business/travel/socializing stay lite.
  - Ages **18–20:** up to **3** basic ids total per palette; never all five `action_*_basic` in one tick.
- **Minimum pool:** every non-empty palette includes ≥1 training or study action.
- **Category floor:** all five youth-allowed categories receive a small base score so origin ordering wins but business/travel/socializing remain reachable (contrast 8–12 suppression).

### Allowed action ids (youth)

| Category | Lite (preferred) | Basic (gradient) |
| --- | --- | --- |
| training | `action_childhood_training` | `action_training_basic` (16+) |
| study | `action_study_lite` | `action_study_basic` (16+) |
| socializing | `action_socializing_lite` | `action_socializing_basic` (18+, cap) |
| business | `action_household_apprentice` | `action_business_basic` (18+, cap) |
| travel | `action_errand_nearby` | `action_travel_basic` (18+, cap) |

### Route entry (unchanged semantics)

- Childhood gameplay (≤12) must **not** set `p9_early_*` focus flags from palette paths.
- `applyYouthTransitionSeeds(12→13)` + `promoteYouthRouteEntryFromUpbringing` remain the canonical promotion path for deferred upbringing → `p9_early_*`.
- Config `routeDefinitions` entry `ageBand` target: **13–20** (US-005).

### Demonic exception (carryover)

- Stage-9 demonic travel semantics preserved: `p8_route_demonic` + childhood travel echo → `p9_demonic_restless_journey`, **not** `p9_early_travel_focus`.
- Youth band does **not** add new wanderer-focus shortcuts.

### Invalid at youth

- Same-tick palette containing **all five** `action_*_basic` ids (21+ adult dump).
- Re-introducing 8–12 category suppression for ages 13–20.

### Validation (Stage-10)

- Matrix: four origins × ages 13–20 × 20 ticks → **0** cells with all five basics (`tests/youthAgencyStage10Tests.ts`).
- Regression: `lateChildhoodAgencyStage9Tests` — 8–12 bleed **0**.
