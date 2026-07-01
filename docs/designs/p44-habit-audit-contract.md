# P44 Habit Trajectory Operator Audit Contract

**Date:** 2026-06-25  
**Branch:** `codex/p44-wuxia-habit-trajectory-operator-audit-tooling`  
**PRD:** `docs/PRD/p44-wuxia-habit-trajectory-operator-audit-tooling.md`

Operator-facing contract for repeatable shaping-system health checks. Tooling output MUST follow these shapes so future waves can diff reports without re-learning semantics.

---

## 1. Core Audit Questions

| ID | Question | Audit class | Operator action |
| --- | --- | --- | --- |
| **Q1** | 哪些轴在哪些年龄段缺样本？ | `coverage` | Add gated readers in sparse bands before merge |
| **Q2** | 哪些关键链路仍依赖 legacy flag？ | `legacy_drift` | Migrate to `lifeStates.*` or document allowlist reason |
| **Q3** | 哪些 archetype 缺少差异化后果？ | `archetype_differentiation` | Add cluster-specific echo pairs or revise copy |
| **Q4** | 哪些回顾层没有吸收 shaping 结果？ | `recap_absorption` | Wire shared `habitShapingSummary` helpers |

---

## 2. Shared Vocabulary

### 2.1 Shaping axes

| Key | Label |
| --- | --- |
| `trainingHabit` | 习武塑形 |
| `studyHabit` | 饱学塑形 |
| `businessHabit` | 营生塑形 |
| `socialMomentum` | 人情往来 |
| `familyBond` | 亲族牵绊 |

Source of truth: `SHAPING_AXES` in `src/utils/habitShapingSummary.ts`.

### 2.2 Age bands

| Band ID | Ages |
| --- | --- |
| `childhood` | 0–12 |
| `youth` | 13–19 |
| `early_adult` | 20–34 |
| `midlife` | 35–49 |
| `later_life` | 50+ |

An event **reads** an axis when its `conditions` reference `lifeStates.<axis>` (or equivalent axis key) at threshold ≥ 2. Writers-only events (effects accumulate axis, no gate) are excluded from reader counts.

### 2.3 Legacy flags

| Legacy flag | Modern axis |
| --- | --- |
| `training_habit` | `trainingHabit` |
| `study_habit` | `studyHabit` |
| `business_habit` | `businessHabit` |

**Allowed compatibility surfaces** (not suspicious when sole reference):

- `src/core/GameEngineIntegration.ts` — projection map
- `src/data/life/dailyEvents.ts` — hook name mapping
- `src/narrative/profile/wuxiaReplayabilitySurfaces.ts` — archetype seed flags
- `src/p20/validationSlices.ts`, `src/p24/sliceFixtures.ts` — calibration fixtures
- `tests/**` — regression fixtures
- `docs/**`, `agent_docs/**` — documentation

**Suspicious** when legacy flag appears as a **primary content gate** in `src/data/lines/*.json` or runtime logic outside the allowlist without `lifeStates.*` co-gate.

### 2.4 Archetype families (differentiation clusters)

Reference families from `wuxiaReplayabilitySurfaces.ts`:

| Family ID | Label | Typical route keys |
| --- | --- | --- |
| `p20_martial_ascendant` | 武道登峰 | martial, orthodox |
| `p20_scholar_statesman` | 文士仕林 | scholarly, academic |
| `p20_wealth_merchant` | 商贾识途 | wealth, merchant |

Differentiation is **strong** when an axis has ≥ 2 reader events with distinct cluster signals (route/origin/id naming). **Thin** when all readers share generic copy or only one cluster is represented.

### 2.5 Recap absorption surfaces

| Surface | Expected wiring |
| --- | --- |
| Main-screen shaping row | `buildCurrentShapingSummary` |
| Life-memory 长期塑形 | `deriveDominantShapingLines` |
| P19 final summary | `buildLateLifeShapingRecapLine`, `buildShapingPatternEndingTone` |
| Ending fallback summary | `buildLateLifeShapingRecapLine` |
| Self-understanding | `deriveDominantShapingLines` |

Surfaces **outside contract** (manual follow-up): `EndingScreen.vue` UI wiring.

---

## 3. Output Shapes

All audits emit a JSON envelope plus optional markdown artifact.

### 3.1 Top-level envelope

```json
{
  "auditVersion": "p44-v1",
  "generatedAt": "ISO-8601",
  "coverage": { "...": "see 3.2" },
  "legacyDrift": { "...": "see 3.3" },
  "archetypeDifferentiation": { "...": "see 3.4" },
  "recapAbsorption": { "...": "see 3.5" }
}
```

### 3.2 Coverage (`coverage`)

```json
{
  "matrix": {
    "trainingHabit": { "childhood": 0, "youth": 1, "early_adult": 4, "midlife": 1, "later_life": 0, "total": 6 }
  },
  "gaps": [{ "axis": "trainingHabit", "band": "childhood", "readerCount": 0, "severity": "gap" }],
  "lowDensity": [{ "axis": "businessHabit", "band": "youth", "readerCount": 1, "severity": "low_density" }],
  "readers": [{ "eventId": "...", "axis": "...", "bands": ["..."], "poolHint": "..." }]
}
```

- `severity: "gap"` — reader count 0 in band  
- `severity: "low_density"` — reader count 1 in band (single-sample dependency)

### 3.3 Legacy drift (`legacyDrift`)

```json
{
  "hits": [{ "file": "...", "flag": "training_habit", "line": 42, "classification": "allowed_compatibility" }],
  "suspiciousReaders": [{ "file": "...", "flag": "...", "reason": "primary content gate without lifeStates co-gate" }],
  "allowedCount": 12,
  "suspiciousCount": 0
}
```

Classifications: `allowed_compatibility` | `allowed_fixture` | `allowed_replayability` | `allowed_documentation` | `suspicious_primary`.

### 3.4 Archetype differentiation (`archetypeDifferentiation`)

```json
{
  "axes": [{
    "axis": "trainingHabit",
    "readerCount": 6,
    "clusterVariants": ["martial", "scholar"],
    "differentiation": "strong",
    "sampleEvents": ["p42_training_habit_martial_clan_echo", "p42_training_habit_scholar_body_echo"],
    "thinAreas": []
  }],
  "convergenceWarnings": [{ "axis": "businessHabit", "reason": "no cluster-specific reader pairs" }]
}
```

Differentiation values: `strong` | `partial` | `thin`.

### 3.5 Recap absorption (`recapAbsorption`)

```json
{
  "wiredSurfaces": [{ "surface": "P19 final summary", "file": "src/p19/finalSummaryComposition.ts", "helper": "buildLateLifeShapingRecapLine" }],
  "unwiredSurfaces": [{ "surface": "Ending UI", "file": "src/components/EndingScreen.vue", "reason": "deferred UI wiring" }],
  "allRequiredEngineSurfacesWired": true
}
```

---

## 4. Runnable Entry Points

```bash
npm run audit:p44-habit
npm exec tsx tests/p44HabitAuditTests.ts
```

Artifacts (with `--write`, default via `npm run audit:p44-habit`):

- `docs/test-reports/p44-habit-operator-audit.json`
- `docs/test-reports/p44-habit-coverage-audit.md`
- `docs/test-reports/p44-legacy-flag-drift-audit.md`
- `docs/test-reports/p44-archetype-differentiation-audit.md`
- `docs/test-reports/p44-habit-operator-audit-summary.md`

---

## 5. Non-Goals (this contract)

- No gameplay behavior changes from audit tooling itself
- No external dashboards or web UI
- No automatic content fixes — audits are read-only signal generators

---

## 6. Manual Follow-Up (always operator-owned)

- Narrative quality review of flagged events (copy legibility)
- Ending UI surfacing of P19 shaping recap
- Archetype differentiation for axes beyond P42 cluster pairs
- Simulation-based lifetime traces (P25/P35 gates) — separate from this contract
