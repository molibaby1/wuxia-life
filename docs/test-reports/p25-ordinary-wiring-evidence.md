# P25 Ordinary Origin Early/Mid-Life Wiring (US-018)

Generated: 2026-06-23

## Layer choice (simulation-driven workflow)

| Layer | Choice | Rationale |
| --- | --- | --- |
| **world profile** | `WUXIA_ORIGIN_SURFACES` ordinary tier + `eventBiasTags` | Opportunity structure, not stat debuffs |
| **content** | `origin-infant-passives.json` (0–2), `preschool-passive-spine.json` (3–7), `ordinary-origin-early-life.json` (8–15 choices) | Profile-first; no scheduler rewrite |
| **runtime** | Existing `selectOrderedOriginInfantPassive`, `selectPreschoolPassiveEntry`, `getOriginChildhoodEventMultiplier` | Reuses P16 childhood agency hooks |

## Per-origin wiring

| Origin | Infant chain | Preschool (3–7) | Choice (8–15) | Mid-tier eligibility |
| --- | --- | --- | --- | --- |
| `farm_peasant` | `quest_peasant_infant_passive_0_2` | `preschool_peasant_*` | `ordinary_peasant_plow_fork` → `peasant_steadfast_field` / `peasant_swap_crew_curiosity` | `jianghu_renown_sage` via `mentor_bond` path fixtures |
| `town_apprentice` | `quest_apprentice_infant_passive_0_2` | `preschool_apprentice_*` | `ordinary_apprentice_craft_fork` | `merchant_magnate` via trade route flags |
| `tavern_hand` | `quest_tavern_infant_passive_0_2` | `preschool_tavern_*` | `ordinary_tavern_network_fork` → `ally_network` | `jianghu_renown_sage` / mixed via guest network |

## Trajectory divergence vs vivid controls

Ordinary infant/preschool/choice flag sequences differ from vivid origin pairs (`scholar_house`, `martial_family`, `merchant_house`) — validated in `p25-ordinary-origin-slice`.
