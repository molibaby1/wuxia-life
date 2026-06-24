# P40 Pacing And Replay Root-Cause Audit

> **Date:** 2026-06-24  
> **Baseline:** `docs/test-reports/p8-playability-gate-latest.json` (post-P38/P39)  
> **PRD:** `docs/PRD/p40-wuxia-p8-replay-pacing-polish.md`  
> **Note:** PRD cited `childhood-payoff-spine-7-13-content-contract.md` and Slice C probe docs are **not present** in tree; this audit uses `golden-line-spine.json` + `p9-remediation.json` as the childhood payoff contract proxy.

## Executive Summary

| Metric | Baseline | Target |
| --- | --- | --- |
| `p8-deviant-ye` low-impact span | **7y** (ages 7→14) | ≤5y |
| Near-duplicate pairs (cosine ≥0.82) | **3** (not PRD-defer 7) | ≤3 |
| `gate:playability` | PASS | PASS |

**Pacing root cause:** After last recorded impact at **age 7** (`active_action:action_childhood_training`), headless persona records show **no events ages 8–13**; next impact is **`sect_choice` at age 14**. Childhood spine payoffs (`childhood_summary`, `preteen_training`, `p9_childhood_dark_spark`) exist in content but **do not appear in metrics records** for deviant-ye because (a) `p8_route_demonic` / youth seeds were applied only at **age ≥13** in `applyPersonaYouthRouteSeedsAtAge`, blocking age-10 demonic milestones, and (b) deviant misses age-13 `sect_path_choice` that martial personas record, slipping to generic `sect_choice` at 14.

**Replay root cause:** Scholar/wealth/deviant cluster shares study-heavy action mix and overlapping midlife echo flags; martial/cautious cluster shares training strategy seeds without distinct `p8_route_martial` / `p8_route_conservative` bootstrap (unlike `GameProcessSimulator` which sets `p8_route_*` at init).

---

## 1. Deviant-Ye Pacing Span (7y warning)

### 1.1 Gate extraction

```json
"pacing": {
  "longestLowImpactSpanYears": 7,
  "lowImpactSpanStartAge": 7,
  "lowImpactSpanEndAge": 14
}
```

### 1.2 Recorded events ages 6–15 (headless re-run 2026-06-24)

| Age | eventId | impact (`isPacingImpactRecord`) |
| --- | --- | --- |
| 6 | `martial_arts_enlightenment` | yes (choice) |
| 7 | `active_action:action_childhood_training` ×2 | yes (active_action) |
| 8–13 | *(none recorded)* | — |
| 14 | `sect_choice` | yes (choice) |
| 15 | `love_first_meet` | yes (choice) |

**Last impact before span:** age 7 active childhood training.  
**First impact after span:** age 14 `sect_choice`.

### 1.3 Non-impact gap vs childhood payoff contract

| Expected spine age (`golden-line-spine.json`) | Event | Why missing / non-impact |
| --- | --- | --- |
| 8 | `childhood_summary`, `martial_focus_payoff` | Not in headless **metrics records** (may auto-resolve in `progressUntilChoiceOrTerminal` without record append) |
| 10 | `preteen_training`, **`p9_childhood_dark_spark`** | `p9_childhood_dark_spark` requires `p8_route_demonic` + `p9_echo_training_hook`; seeds applied only at age 13 |
| 12 | `late_childhood_prep` | Auto; text lacks pacing keywords; often unrecorded |
| 13 | `youth_begins`, **`sect_path_choice`** | `youth_begins` auto without impact keywords; deviant falls through to `sect_choice` @14 |

### 1.4 Remediation levers (P40-002)

1. **Bootstrap youth route seeds** at session creation (`createPersonaSession.ts`): `p8_route_*`, strategy hooks, `p8_persona_id` — mirror `GameProcessSimulator`.
2. **Remove premature `p9_childhood_dark_spark` seed** from `personaYouthRouteSeeds.ts` so age-10 event can fire and record.
3. **Add `p9_deviant_youth_route_milestone` choice @12–13** with route/里程碑 copy for guaranteed story-phase record before `sect_choice`.

---

## 2. Near-Duplicate Replay Pairs

### 2.1 Current gate (3 pairs — already at target ≤3)

| Pair | Cosine | Cluster |
| --- | --- | --- |
| `p8-scholar-su` ~ `p8-wealth-shen` | **0.96** | scholar / wealth / deviant / balanced |
| `p8-scholar-su` ~ `p8-deviant-ye` | **0.85** | same |
| `p8-martial-lin` ~ `p8-cautious-han` | **0.84** | martial / cautious |

PRD defer queue listed 7 pairs from an earlier probe; **current tree baseline is 3**. P40-003 still adds differentiation to prevent regression and push stretch toward 0.

### 2.2 Signature divergence gaps (`signatureVector` in `collectPersonaMetrics.ts`)

Vector dimensions: `[actions, choices, martial, money, children, routeSignal, routePrefSignal, personaSignal, echoSignature, training×12, study×12, business×12, travel×12, socializing×12]`.

| Cluster | Convergence drivers | Gaps |
| --- | --- | --- |
| scholar / wealth / deviant / balanced | Shared `p9_echo_study_hook`; similar choice counts; `routeSignal` weak when `p8_route_*` unset at bootstrap | Missing `p8_route_scholar` / `p8_route_wealth`; wealth lacks money-delta milestone; scholar lacks knowledge-only fork |
| martial / cautious | Both `strategy: training`; same training action counts; childhood milestones (`p9_childhood_sword_trial` vs `p9_childhood_steady_gate`) blocked without `p8_route_martial` / `p8_route_conservative` | `p9_martial_midlife_proving` never fires for martial; cautious midlife echo overlaps training vector |

### 2.3 Differentiation levers (P40-003)

| Lever | Expected Δ |
| --- | --- |
| Bootstrap `p8_route_martial` → `p9_childhood_sword_trial` + `p9_martial_midlife_proving` | ↑martial, routeSignal, training |
| Bootstrap `p8_route_conservative` → `p9_childhood_steady_gate` + cautious steward | ↑reputation path, different echoSignature |
| `p9_scholar_academy_gate` (study-only) vs `p9_wealth_caravan_gate` (business-only) | ↑study×12 vs ↑business×12, money divergence |
| Demonic age-10/12 milestones | ↓scholar~deviant cosine via routeSignal + echo flags |

---

## 3. Persona Cluster Ranking (replay)

1. **scholar–wealth** (0.96) — highest priority  
2. **scholar–deviant** (0.85)  
3. **martial–cautious** (0.84)  

---

## 4. Implementation Surfaces (no scheduler / metric changes)

| Surface | P40 stories |
| --- | --- |
| `src/headless/playability/createPersonaSession.ts` | P40-002 bootstrap flags |
| `src/p8/personaYouthRouteSeeds.ts` | P40-002 route seeds |
| `src/data/lines/p9-remediation.json` | P40-002 demonic youth milestone; P40-003 persona forks |
| `src/data/golden-line-spine.json` | optional anchor for new event ids |

---

## 5. Verification Commands

```bash
npm exec tsx scripts/p40AuditExtract.ts -- --deviant-only
npm run gate:playability
npm exec tsx tests/p40ReplayPacingPolishTests.ts
npx tsc --noEmit
```
