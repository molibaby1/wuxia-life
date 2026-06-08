# P16 Childhood Agency Audit (US-002)

Read-only inventory of age-inappropriate childhood agency points.

## Agency Model (Current)

When `selectEvent()` returns null, `useNewGameEngine` offers **all five** P7 minimum active actions with no age filter (`GameEngineIntegration.getAvailableActiveActions` → `buildActiveActionChoices`).

P11 route definitions mark `p9_early_business_focus`, `p9_early_travel_focus`, `p9_early_social_focus` as **entry signals with `ageBand: 0-10`**, so childhood actions can seed adult route tracks.

## Problem Inventory

| Moment | Type | Violation | Fix layer |
|--------|------|-----------|-----------|
| `action_business_basic` (营商) | Direct-adult behavior | Commerce / capital accumulation at any age | Runtime age guard + config |
| `action_travel_basic` (游历) | Direct-adult behavior | Independent travel / jianghu exposure at any age | Runtime age guard + config |
| `action_socializing_basic` (交游) | Strategic build choice | Paid networking (20 silver) as normal childhood option | Runtime age guard |
| `action_study_basic` (读书) | Age-heavy strategic | Scholar/career framing before age 8 | Runtime age guard (early childhood) |
| `action_training_basic` (练功) | Mild — acceptable with framing | Still available age 0–3 without environment gate | Soft limit only |
| `origin_background` (age 1) | Strategic build choice | Player picks full origin archetype at age 1 | Content / design (out of US-009 scope) |
| `childhood_preference` → `focus_on_study` (age 4) | Strategic build choice | Sets `sect_trial_active` — sect pipeline at age 4 | Content-only |
| `preteen_training` + p9 milestone (age 10) | Acceptable with tuning | Training milestone OK for pre-teen band | Content tuning |
| Daily `daily_take_odd_job` (age 12+) | Direct-adult behavior | Odd jobs at 12 — borderline youth | Config age range |
| `sect_choice` (age 14) | Route-entry | Outside 0–12 but premature strategy adjacent | Content (youth band) |

## Classification

| Problem | Config-only | Content-only | Runtime-bound |
|---------|-------------|--------------|---------------|
| Active actions without age gates | — | — | **Yes** |
| Route entry signals age 0–10 | Partial (routeDefinitions) | — | Detection runtime |
| origin_background choice | — | **Yes** | Event selection |
| childhood_preference / sect flags | — | **Yes** | Effect application |
| backgroundWeights unused | **Yes** (dead config) | — | Needs runtime wiring |

## P16 Priority Order

1. Suppress business / travel / socializing in early childhood (runtime).
2. Preserve training (+ limited study after age 8) as meaningful but age-fit choices.
3. Wire origin surfaces so childhood feels environment-driven rather than build-driven.
4. Defer `origin_background` dual-track consolidation to a follow-up content pass.

No gameplay changes in US-002.
