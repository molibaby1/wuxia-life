# P25 Rare Line Wiring Evidence (US-010)

Generated: 2026-06-23

## Layer choice (simulation-driven workflow)

| Issue | Layer | Rationale |
| --- | --- | --- |
| Rare-line rolls do not bias later opportunity events | **runtime** (`GameEngineIntegration.pickWeightedFormalEvent`) | `getRareLineOpportunityMultiplier` already exists; no `tuning_config` knob expresses per-line tag boosts from checkpoint flags. Profile config (`WUXIA_RARE_EVENT_LINES.altersOpportunityTags`) unchanged. |

## Wiring

- Checkpoint rolls: `applyP16RareLineCheckpoints` → `rollRareEventLines` → flags (unchanged).
- Scheduling: `deriveRareLineRollResultsFromFlags` + `getRareLineOpportunityMultiplier` applied to formal event weights when matching `altersOpportunityTags` overlap event bias tags.
- Explainability: `src/p25/rareLineExplainability.ts` → `buildRareLineExplainReport` (sim/validation: flag, window, weight pointers).

## Regression guard

Existing three rare lines (`hidden_master_line`, `merchant_patron_line`, `scholar_mentor_line`) unlock flags unchanged; `p16OriginDestinyTests` rare-line roll behavior preserved.
