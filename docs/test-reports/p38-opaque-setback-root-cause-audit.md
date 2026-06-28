# P38 Opaque Setback Root-Cause Audit

**Date:** 2026-06-24  
**Story:** P38-001  
**Source gate:** `docs/test-reports/p8-playability-gate-latest.json` (P36 post-P35 baseline, 2026-06-24T06:44:16Z)  
**Metric:** `collectFrustrationMetrics` in `src/p8/collectPersonaMetrics.ts`

---

## 1. Blocker persona inventory

Six personas fail `gate:playability` on **frustration opaque ratio 1.00** (all setbacks classified opaque). Two personas pass with ratio 0.

| Persona | Cluster | Opaque / Total | Opaque ratio | Gate |
| --- | --- | --- | --- | --- |
| p8-martial-lin | martial | 5 / 5 | 1.00 | fail |
| p8-social-gu | social | 3 / 3 | 1.00 | fail |
| p8-wealth-shen | wealth | 5 / 5 | 1.00 | fail |
| p8-cautious-han | cautious | 7 / 7 | 1.00 | fail |
| p8-deviant-ye | deviant | 1 / 1 | 1.00 | fail |
| p8-balanced-wei | balanced | 7 / 7 | 1.00 | fail |
| p8-scholar-su | scholar | 0 / 0 | 0.00 | pass |
| p8-explorer-lu | explorer | 0 / 0 | 0.00 | pass |

---

## 2. Opaque eventId frequency (blocker personas only)

| Rank | eventId | Opaque count | Source file |
| --- | --- | --- | --- |
| 1 | `setback_injury` | 13 | `src/data/lines/setback-events.json` |
| 2 | `setback_property_loss` | 10 | `src/data/lines/setback-events.json` |
| 3 | `love_secret_help` | 3 | `src/data/lines/love.json` |
| 4 | `setback_cultivation_deviation` | 2 | `src/data/lines/setback-events.json` |

**Total opaque setbacks:** 28 across 6 blocker personas. No other eventIds contribute opaque setbacks in the baseline gate run.

---

## 3. Per-persona opaque event breakdown

| Persona | setback_injury | setback_property_loss | love_secret_help | setback_cultivation_deviation |
| --- | --- | --- | --- | --- |
| p8-martial-lin | 3 | 1 | 1 | — |
| p8-social-gu | 3 | — | — | — |
| p8-wealth-shen | 2 | 2 | 1 | — |
| p8-cautious-han | 3 | 3 | — | 1 |
| p8-deviant-ye | — | 1 | — | — |
| p8-balanced-wei | 2 | 3 | 1 | 1 |

---

## 4. Narrative → classification mapping

Classification rules (`collectFrustrationMetrics`):

1. **Negative trigger:** text matches `/损失|受伤|失败|降低|扣除|危机|重创|死亡/` OR health &lt; 40
2. If negative: **warned** if `/预警|提醒|早有|察觉/`; else **explained** if `/因为|由于|缘故|导致/`; else **recoverable** if `/恢复|疗愈|补偿|可再|还有机会/`; else **opaque**

### 4.1 setback_injury (13 opaque)

| Field | Value |
| --- | --- |
| Narrative | 在一次练功中，你不慎受伤。疼痛让你意识到江湖险恶，需要更加小心谨慎。 |
| Negative trigger | `受伤` |
| Causality keywords | none |
| Recoverable keywords | none |
| **Classification** | **opaque** |
| Remediation | Add `因为`/`由于`/`导致` causality; optional recoverable path |

### 4.2 setback_property_loss (10 opaque)

| Field | Value |
| --- | --- |
| Narrative | 遭遇盗匪或经营失败，你损失了部分财产。江湖上的风险总是防不胜防。 |
| Negative trigger | `损失` |
| Causality keywords | none |
| Recoverable keywords | none |
| **Classification** | **opaque** |
| Remediation | Add explicit causality (`由于遭遇盗匪` / `因为经营失败导致`) |

### 4.3 love_secret_help (3 opaque — false-positive setback)

| Field | Value |
| --- | --- |
| Narrative | 你在暗处协助明月度过危机，未曾留下姓名。 |
| Negative trigger | `危机` (positive event misclassified) |
| Causality keywords | none |
| **Classification** | **opaque** |
| Remediation | Remove `危机` false-positive trigger; reframe as explained social choice (`由于先前误会`) or non-negative wording |

### 4.4 setback_cultivation_deviation (2 opaque)

| Field | Value |
| --- | --- |
| Narrative | 修炼时心神不宁，你感到内息紊乱，一股邪念在心中滋长。这是每个武者都可能遇到的危机——走火入魔。 |
| Negative trigger | `危机` |
| Causality keywords | none |
| Recoverable keywords | none |
| **Classification** | **opaque** |
| Remediation | Add `由于…导致` causality; remove bare `危机`; add recoverable hint |

---

## 5. Persona-cluster remediation targets

| Cluster | Personas | Primary opaque events | P38 story |
| --- | --- | --- | --- |
| Martial / training-heavy | p8-martial-lin, p8-social-gu | setback_injury | P38-002 |
| Wealth / property | p8-wealth-shen, p8-deviant-ye | setback_property_loss | P38-002 |
| Social / love line | p8-martial-lin, p8-wealth-shen, p8-balanced-wei | love_secret_help | P38-002 |
| Cautious / cultivation | p8-cautious-han, p8-balanced-wei | setback_cultivation_deviation, setback_injury | P38-003 |

---

## 6. Gap vs collectFrustrationMetrics

| Gap | Impact |
| --- | --- |
| Setback templates lack causality keywords | 23/28 opaque from injury + property_loss |
| `love_secret_help` positive event triggers `危机` | 3/28 false-positive opaque |
| `setback_cultivation_deviation` uses `危机` without explanation | 2/28 opaque |
| No metric rule change needed if narratives fixed | narrative-first per PRD |

---

## 7. Remediation priority (minimal high-frequency set)

1. **P38-002:** `setback_injury`, `setback_property_loss`, `love_secret_help` (covers 26/28 opaque instances)
2. **P38-003:** `setback_cultivation_deviation` + cluster trace doc for martial/cautious and wealth/balanced residual paths

**Expected outcome:** If all four templates gain explained/recoverable classification or drop negative trigger, opaque ratio → 0 for all 6 blocker personas (exceeds ≥4/6 &lt;0.35 target).
