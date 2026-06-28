# P25 Ordinary Origin Trajectory Validation Slice (US-020)

Generated: 2026-06-23T07:29:55.334Z

Paths covered: 3
Decision: **PASS**

## Findings

- `ordinary_peasant_renown_path` (farm_peasant vs poor_family): PASS — Early/mid trajectory flags differ from vivid control → `path:ordinary_peasant_renown_path origin:farm_peasant vs poor_family overlap=0.00`
  - ordinary: origin:farm_peasant, infant:peasant_infant_chain_complete, preschool:preschool_peasant_harvest_help, bias:labor+seasonal+family, flag:peasant_steadfast_field, flag:ordinary_peasant_midlife_seed
  - vivid: origin:poor_family, infant:shared_infant_filler, preschool:preschool_passive_gap, bias:survival+business, flag:survival_upbringing
- `ordinary_apprentice_merchant_path` (town_apprentice vs streetborn): PASS — Early/mid trajectory flags differ from vivid control → `path:ordinary_apprentice_merchant_path origin:town_apprentice vs streetborn overlap=0.00`
  - ordinary: origin:town_apprentice, infant:apprentice_infant_chain_complete, preschool:preschool_apprentice_plane_shavings, bias:craft+apprenticeship+discipline, flag:apprentice_craft_committed, flag:ordinary_apprentice_midlife_seed
  - vivid: origin:streetborn, infant:shared_infant_filler, preschool:preschool_passive_gap, bias:social+family, flag:street_network_seed
- `ordinary_tavern_renown_path` (tavern_hand vs merchant_house): PASS — Early/mid trajectory flags differ from vivid control → `path:ordinary_tavern_renown_path origin:tavern_hand vs merchant_house overlap=0.00`
  - ordinary: origin:tavern_hand, infant:tavern_infant_chain_complete, preschool:preschool_tavern_tray_balance, bias:service+rumor+social, flag:tavern_service_committed, flag:ordinary_tavern_midlife_seed
  - vivid: origin:merchant_house, infant:merchant_infant_chain_complete, preschool:preschool_merchant_first_coin, bias:business+social, flag:p9_early_merchant_seed