# P18 Cultivation Investment And Outcome Rules (US-006)

## Tradeoff Against Protagonist Late-Life Space

Successor cultivation competes with personal late-life opportunities via **cost dimensions**. Each active successor role imposes required investment levels. Unmet pressure:

- Reduces opportunity multiplier on personal `legacy`, `prestige`, `retirement` tags
- Increases risk on `instability`, `betrayal`, `decline` tags
- Lowers succession quality score (inspectable)

## Cost Dimension Balance

| Dimension | What it represents | Satisfaction signals |
| --- | --- | --- |
| Time | Years spent teaching vs personal pursuits | `disciple_training_active`, age band |
| Attention | Focus split | `has_disciples` + low `influence` |
| Resources | Money/material support | `player.money`, `merchantNetwork` |
| Political exposure | Sect/family visibility | `sect_master`, `connections` |
| Emotional burden | Kinship/duty stress | `has_child`, `mustProtect` |
| Deferred progress | Personal martial/scholarly stall | `martialHeritage` high but `martialPower` low |

## Legacy Outcomes (first P18 pass)

| Outcome | Trigger profile | Scheduling effect |
| --- | --- | --- |
| **Success / transmission** | High quality + met costs | Boost `legacy`, `continuity` |
| **Mediocrity** | Partial investment | Neutral multiplier; weak succession score |
| **Underinvestment** | Active role + unmet pressure | Risk on `decline`, `instability` |
| **Burden without capability** | Burden channel + low quality | High `obligation` risk, low opportunity |
| **Rupture / betrayal** | High instability + vendetta | `betrayal`, `collapse` risk tags |
| **Transcendence** (light) | Quality > 0.85 + transmission flag | Extra `prestige` opportunity (deferred deep sim) |

## Reporting

`formatUnmetCultivationPressureReport` and `LaterLifeLegacyReport` expose unmet dimensions for gates and validation slices.
