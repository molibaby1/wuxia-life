# Experience Trace Choice Policy Audit

> 只读审计报告。输入为 40 条 `oracle_effect_score_v1` Trace；本报告没有修改 Trace、游戏状态、选择逻辑、P8/P11 Gate 或产品代码。

## Executive Summary

- 40 条 Trace、846 次事件选择、489 次主动行动已纳入分析；生成参数为 8 personas × 5 seeds/persona、endAge=40。
- 选择趋同的最强已确认来源是评分量纲：选中候选中 86.6% (733/846) 的 stat contribution 由单一属性超过 50%；money 超过 50% 的选择为 24.6% (208/846)。
- persona bonus 并非没有作用：按“基础最高候选的第一项”定义，9% (76/846) 次改变基础赢家；但出身节点 40/40 次仍选择 `origin_merchant_family`。
- tie 是确定性选择的重要来源：9.9% (84/846) 次最高分并列，9.9% (84/846) 次由候选顺序打破。
- outcome 合并存在可量化的敏感性，但当前 Trace 缺少完整选择前状态和 outcome 分支条件，92.5% (62/67) 是“在单分支反事实下可能变排名”的上界，不是已确认的实际可达比例。
- 唯一下一 Slice：**D. 暂不修正模拟器，进入产品 Slice**。先做 bounded player-visible/browser 产品体验验证；本轮证据足以证明 oracle 偏差存在，但不足以决定全局量纲修正或把 oracle 替换为玩家可见策略。

## Sample and Runtime Parameters

| Item | Value |
| --- | --- |
| Trace files | 40 |
| Personas | 8 |
| Seeds per persona | 5 |
| Seed range by roster | 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812 |
| endAge argument | 40 |
| finalAge observed | 40, 41 |
| Trace policy | oracle_effect_score_v1 |
| runtimePath | headless_server |
| input order | lexicographic file order; all aggregations stable-sorted |

## Current Selection Policy Definition

`oracle_effect_score_v1`: hidden direct effects plus all outcome effects are scored; martial tendency gives ×3 to martialPower/comprehension/constitution; wealth tendency gives ×3 to money/businessAcumen/reputation/connections and ×0.7 to other stats; persona route/risk/relationship/goal bonuses are then added; scores are deterministic and ties are resolved by the first candidate. `normalizedStatUnits=false`.

## 1. Event Selection Statistics

| Metric | Result |
| --- | --- |
| Total event choices | 846 |
| Candidate rows | 1934 |
| Single-candidate events | 104 |
| Multi-candidate events | 742 |
| All adjusted candidate scores = 0 | 54 (6.4% (54/846)) |
| Highest-score ties | 84 (9.9% (84/846)) |
| tieBrokenByOrder=true | 84 (9.9% (84/846)) |
| Persona bonus changed first base winner | 76 (9% (76/846)) |
| Selected candidate had non-zero persona bonus | 329 (38.9% (329/846)) |
| Selected winner left the entire base-score tie set | 48 (5.7% (48/846)) |
| Score margin distribution | min 0, p25 3, median 8.7, p75 35.4, max 846.6 |

| Persona | Choices |
| --- | --- |
| p8-balanced-wei | 150 |
| p8-cautious-han | 95 |
| p8-deviant-ye | 84 |
| p8-explorer-lu | 89 |
| p8-martial-lin | 102 |
| p8-scholar-su | 81 |
| p8-social-gu | 92 |
| p8-wealth-shen | 153 |

Margin buckets:

| Margin | Count |
| --- | --- |
| 0 | 84 |
| 0 < margin ≤ 10 | 329 |
| 10 < margin ≤ 50 | 179 |
| 50 < margin ≤ 100 | 61 |
| margin > 100 | 89 |

## 2. Numeric Unit Dominance

Contribution method: mirror `scoreByTendency`; for each candidate, compare absolute per-stat contribution with the sum of absolute stat contributions. Persona bonus is excluded from this denominator, so this isolates the raw hidden-effect score. Zero-stat candidates are not counted in dominance denominators.

| Population | >50% one stat | money >50% | money >75% | money >90% |
| --- | --- | --- | --- | --- |
| Selected candidates | 733/846 | 208/846 | 168/846 | 154/846 |
| All candidate rows | 1550/1934 | 378/1934 | 333/1934 | 263/1934 |

| Persona | Selected rows | money >50% |
| --- | --- | --- |
| p8-balanced-wei | 150 | 42/150 (28%) |
| p8-cautious-han | 95 | 20/95 (21.1%) |
| p8-deviant-ye | 84 | 19/84 (22.6%) |
| p8-explorer-lu | 89 | 18/89 (20.2%) |
| p8-martial-lin | 102 | 23/102 (22.5%) |
| p8-scholar-su | 81 | 20/81 (24.7%) |
| p8-social-gu | 92 | 19/92 (20.7%) |
| p8-wealth-shen | 153 | 47/153 (30.7%) |

Largest money contributions observed:

| Event | Choice | Persona | Money abs contribution | Base | Adjusted |
| --- | --- | --- | --- | --- | --- |
| p9_merchant_midlife_caravan | lead_caravan | p8-wealth-shen | 900 | 945 | 1314 |
| p9_merchant_midlife_caravan | lead_caravan | p8-wealth-shen | 900 | 945 | 1314 |
| p9_merchant_midlife_caravan | lead_caravan | p8-wealth-shen | 900 | 945 | 1314 |
| p9_merchant_midlife_caravan | lead_caravan | p8-wealth-shen | 900 | 945 | 1314 |
| p9_merchant_midlife_caravan | lead_caravan | p8-wealth-shen | 900 | 945 | 1314 |
| p9_wealth_caravan_gate | wealth_caravan_expand | p8-wealth-shen | 840 | 864 | 1254.8 |
| p9_wealth_caravan_gate | wealth_caravan_expand | p8-wealth-shen | 840 | 864 | 1254.8 |
| p9_wealth_caravan_gate | wealth_caravan_expand | p8-wealth-shen | 840 | 864 | 1254.8 |
| p9_wealth_caravan_gate | wealth_caravan_expand | p8-wealth-shen | 840 | 864 | 1254.8 |
| p9_wealth_caravan_gate | wealth_caravan_expand | p8-wealth-shen | 840 | 864 | 1254.8 |

Origin scoring decomposition (first stable occurrence per persona; all five seeds were checked for the same event shape):

| Persona | Choice | Base score | Persona bonus | Adjusted score | Stat contribution |
| --- | --- | --- | --- | --- | --- |
| p8-balanced-wei | origin_wuxia_family | 11 | 0 | 11 | martialPower:5, constitution:6 |
| p8-balanced-wei | origin_scholar_family | 12 | 0 | 12 | comprehension:8, chivalry:4 |
| p8-balanced-wei | origin_merchant_family | 208 | 0 | 208 | money:200, connections:2, charisma:6 |
| p8-balanced-wei | origin_frontier | 6 | 0 | 6 | martialPower:4, constitution:4, chivalry:-2 |
| p8-cautious-han | origin_wuxia_family | 11 | 0 | 11 | martialPower:5, constitution:6 |
| p8-cautious-han | origin_scholar_family | 12 | 0 | 12 | comprehension:8, chivalry:4 |
| p8-cautious-han | origin_merchant_family | 208 | 0 | 208 | money:200, connections:2, charisma:6 |
| p8-cautious-han | origin_frontier | 6 | -8 | -2 | martialPower:4, constitution:4, chivalry:-2 |
| p8-deviant-ye | origin_wuxia_family | 33 | 0 | 33 | martialPower:15, constitution:18 |
| p8-deviant-ye | origin_scholar_family | 28 | 0 | 28 | comprehension:24, chivalry:4 |
| p8-deviant-ye | origin_merchant_family | 208 | 4.800000000000011 | 212.8 | money:200, connections:2, charisma:6 |
| p8-deviant-ye | origin_frontier | 22 | 0.6000000000000014 | 22.6 | martialPower:12, constitution:12, chivalry:-2 |
| p8-explorer-lu | origin_wuxia_family | 11 | 0 | 11 | martialPower:5, constitution:6 |
| p8-explorer-lu | origin_scholar_family | 12 | 0 | 12 | comprehension:8, chivalry:4 |
| p8-explorer-lu | origin_merchant_family | 208 | 0 | 208 | money:200, connections:2, charisma:6 |
| p8-explorer-lu | origin_frontier | 6 | -1 | 5 | martialPower:4, constitution:4, chivalry:-2 |
| p8-martial-lin | origin_wuxia_family | 33 | 6 | 39 | martialPower:15, constitution:18 |
| p8-martial-lin | origin_scholar_family | 28 | 0 | 28 | comprehension:24, chivalry:4 |
| p8-martial-lin | origin_merchant_family | 208 | 4.800000000000011 | 212.8 | money:200, connections:2, charisma:6 |
| p8-martial-lin | origin_frontier | 22 | 4.800000000000001 | 26.8 | martialPower:12, constitution:12, chivalry:-2 |
| p8-scholar-su | origin_wuxia_family | 11 | 0 | 11 | martialPower:5, constitution:6 |
| p8-scholar-su | origin_scholar_family | 12 | 0 | 12 | comprehension:8, chivalry:4 |
| p8-scholar-su | origin_merchant_family | 208 | 0 | 208 | money:200, connections:2, charisma:6 |
| p8-scholar-su | origin_frontier | 6 | -8 | -2 | martialPower:4, constitution:4, chivalry:-2 |
| p8-social-gu | origin_wuxia_family | 11 | 0 | 11 | martialPower:5, constitution:6 |
| p8-social-gu | origin_scholar_family | 12 | 0 | 12 | comprehension:8, chivalry:4 |
| p8-social-gu | origin_merchant_family | 208 | 12 | 220 | money:200, connections:2, charisma:6 |
| p8-social-gu | origin_frontier | 6 | 0 | 6 | martialPower:4, constitution:4, chivalry:-2 |
| p8-wealth-shen | origin_wuxia_family | 7.699999999999999 | 0 | 7.699999999999999 | martialPower:3.5, constitution:4.2 |
| p8-wealth-shen | origin_scholar_family | 8.399999999999999 | 0 | 8.399999999999999 | comprehension:5.6, chivalry:2.8 |
| p8-wealth-shen | origin_merchant_family | 610.2 | 244.79999999999995 | 855 | money:600, connections:6, charisma:4.2 |
| p8-wealth-shen | origin_frontier | 4.199999999999999 | 0 | 4.199999999999999 | martialPower:2.8, constitution:2.8, chivalry:-1.4 |

Origin result: 40/40 selected `origin_merchant_family`; distinct selected origin IDs: origin_merchant_family. Scoring shape consistent across five seeds per persona: yes.

## 3. Outcome-Scoring Bias

| Metric | Result |
| --- | --- |
| Choices with at least one outcome | 67 (7.9% (67/846)) |
| Choices with multi-outcome candidate | 67 (7.9% (67/846)) |
| Outcome candidates (rows) | 142 |
| Merged outcome base-score distribution | min -10.8, p25 5, median 8, p75 16.3, max 81.6 |
| Merged outcome adjusted-score distribution | min -50, p25 6.3, median 8, p75 20, max 220.8 |
| Direct-only winner differs from recorded merged winner | 57/67 |
| Single-branch ranking may differ from recorded merged winner | 62/67 |
| Choice steps with success/failure-like branches both present | 62/67 |
| Branch analysis exact from catalog | 67/67 |
| Outcome conditions inspected | 430 |
| Success/failure-like branch labels present | service_aid:failure, service_aid:great_success, service_aid:success, service_injury:failure, service_injury:great_success, service_injury:success, service_meditate:failure, service_meditate:success, love_charm:failure, love_charm:great_success, love_charm:success, love_greet:failure, love_greet:great_success, love_greet:success, join_outlaw_conditional:failure, join_outlaw_conditional:success, join_outlaw_full:great_success, join_outlaw_full:success, border_join:great_success, border_join:success, beggars_join:great_success, beggars_join:success |

Interpretation: the runner currently flattens direct effects and every outcome effect before scoring. The catalog resolver later selects the first satisfied outcome; therefore a choice can receive score from branches that will not all execute. The branch comparison above is a deterministic sensitivity analysis, not an actual-reachability claim: the Trace schema does not retain the full pre-choice state or outcome IDs/conditions.

## 4. Persona Effectiveness

Across the same event ID, cross-persona first observations agree on the selected choice 670/808 (82.9%).

| Event ID | Observations | Distinct choices | Cross-persona agreement |
| --- | --- | --- | --- |
| family_child_born | 40 | 1 | 28/28 (100%) |
| family_marriage | 40 | 1 | 28/28 (100%) |
| love_first_meet | 40 | 1 | 28/28 (100%) |
| martial_arts_invitation | 40 | 2 | 13/28 (46.4%) |
| merchant_childhood_preference | 40 | 2 | 12/28 (42.9%) |
| origin_background | 40 | 1 | 28/28 (100%) |
| martial_arts_enlightenment | 33 | 1 | 28/28 (100%) |
| commoner_year_farming | 25 | 1 | 28/28 (100%) |
| commoner_year_apprentice | 22 | 1 | 28/28 (100%) |
| sect_choice | 22 | 1 | 28/28 (100%) |
| sect_path_choice | 18 | 2 | 21/28 (75%) |
| commoner_year_neighbor | 17 | 2 | 21/28 (75%) |
| love_family_obstacle | 17 | 1 | 28/28 (100%) |
| sect_midlife_faction_pressure | 15 | 1 | 21/21 (100%) |
| sect_midlife_gray_mission | 15 | 2 | 11/21 (52.4%) |
| sect_midlife_stewardship | 15 | 2 | 15/21 (71.4%) |
| jianghu_challenge | 13 | 2 | 15/21 (71.4%) |
| orthodox_trial_entry | 13 | 1 | 21/21 (100%) |
| orthodox_trial_service | 13 | 2 | 15/21 (71.4%) |
| sect_midlife_public_judgment | 13 | 2 | 10/15 (66.7%) |

Selected choice-ID keyword counts:

| Keyword | Selected choices |
| --- | --- |
| origin | 40 |
| merchant | 80 |
| martial | 3 |
| scholar | 6 |
| orthodox | 40 |
| demonic | 20 |
| dark | 5 |
| join | 31 |
| sect | 14 |
| challenge | 16 |
| decline | 43 |
| observe | 17 |
| study | 10 |
| training | 3 |
| business | 19 |
| travel | 0 |
| social | 22 |
| peace | 0 |
| mediate | 0 |
| aid | 3 |

Persona bonus changed the first base winner in 76/846 choices; it did not change it in 770/846. This is evidence that persona bias is active, but not evidence that it produces player-visible differentiation. All eight personas selected the same origin node in the sampled origin event.

## 5. Active Action Strategy

| Persona | Actions | Category counts | Largest category | Max consecutive | 4→1→return patterns |
| --- | --- | --- | --- | --- | --- |
| p8-balanced-wei | 54 | business:18, socializing:14, study:4, training:13, travel:5 | business 33.3% | 3 | 0 |
| p8-cautious-han | 60 | study:10, training:50 | training 83.3% | 4 | 9 |
| p8-deviant-ye | 59 | study:19, training:40 | training 67.8% | 4 | 2 |
| p8-explorer-lu | 75 | business:1, socializing:12, travel:62 | travel 82.7% | 4 | 11 |
| p8-martial-lin | 60 | study:10, training:50 | training 83.3% | 4 | 9 |
| p8-scholar-su | 66 | socializing:12, study:54 | study 81.8% | 4 | 10 |
| p8-social-gu | 67 | business:1, socializing:55, study:11 | socializing 82.1% | 4 | 11 |
| p8-wealth-shen | 48 | business:40, socializing:8 | business 83.3% | 4 | 7 |

| Metric | Result |
| --- | --- |
| Aggregate action counts | business:60, socializing:101, study:108, training:153, travel:67 |
| Balanced persona aggregate counts | business:18, socializing:14, study:4, training:13, travel:5 |
| Fixed priority reason share | 489/489 |
| Focus-streak break count | 67 |
| Degraded/fallback count | 0 |
| Distinct available category sets | 7 |
| Same-persona exact action sequence agreement | 3/80 |
| Same-persona positional category agreement | 78.3% |

The action selector is primarily a fixed category-priority policy. Seed variation changes the available event/action surface and timing; it does not introduce a new random choice in this analysis. Balanced is mixed but not uniform: the aggregate distribution above should be compared with a 20% per-category ideal, not treated as a player model.

## 6. Disturbance and Phase Presentation Coverage

| Phase | Entered | Payload captured | Capture rate | Missing |
| --- | --- | --- | --- | --- |
| active_planning | 489 | 489 | 100% (489/489) | 0 |
| action_summary | 484 | 484 | 100% (484/484) | 0 |
| period_summary | 941 | 941 | 100% (941/941) | 0 |
| passive_progression | 166 | 166 | 100% (166/166) | 0 |
| disturbance_narrative | 39 | 39 | 100% (39/39) | 0 |

Disturbance hits: 39.

| Persona | Seed | Age | Disturbance ID | Source action |
| --- | --- | --- | --- | --- |
| p8-balanced-wei | 809 | 31 | disturbance_sparring_invite | 读书 |
| p8-balanced-wei | 809 | 33 | disturbance_sparring_invite | 交游 |
| p8-balanced-wei | 809 | 34 | disturbance_sparring_invite | 交游 |
| p8-balanced-wei | 809 | 35 | disturbance_sparring_invite | 交游 |
| p8-balanced-wei | 809 | 37 | disturbance_sparring_invite | 营商 |
| p8-cautious-han | 809 | 27 | disturbance_sparring_invite | 读书 |
| p8-cautious-han | 809 | 34 | disturbance_sparring_invite | 读书 |
| p8-deviant-ye | 809 | 26 | disturbance_sparring_invite | 读书 |
| p8-deviant-ye | 809 | 28 | disturbance_sparring_invite | 读书 |
| p8-deviant-ye | 809 | 31 | disturbance_sparring_invite | 读书 |
| p8-deviant-ye | 809 | 37 | disturbance_sparring_invite | 读书 |
| p8-explorer-lu | 809 | 14 | disturbance_sparring_invite | 街坊跑腿 |
| p8-explorer-lu | 809 | 21 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 23 | disturbance_sparring_invite | 交游 |
| p8-explorer-lu | 809 | 24 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 26 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 27 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 29 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 30 | disturbance_sparring_invite | 交游 |
| p8-explorer-lu | 809 | 31 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 33 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 34 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 35 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 36 | disturbance_sparring_invite | 交游 |
| p8-explorer-lu | 809 | 37 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 38 | disturbance_sparring_invite | 游历 |
| p8-explorer-lu | 809 | 39 | disturbance_sparring_invite | 游历 |
| p8-martial-lin | 804 | 13 | disturbance_market_rumor | 玩耍练功 |
| p8-martial-lin | 804 | 21 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 23 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 28 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 29 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 30 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 32 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 37 | disturbance_market_rumor | 练功 |
| p8-martial-lin | 804 | 39 | disturbance_market_rumor | 练功 |
| p8-scholar-su | 804 | 13 | disturbance_market_rumor | 听先生讲课 |
| p8-social-gu | 804 | 13 | disturbance_market_rumor | 与玩伴相处 |
| p8-wealth-shen | 804 | 8 | disturbance_market_rumor | 帮家里打杂 |

## 7. Life-Outcome Differences

| Persona | Final money range | Martial range | Identity primary | Route identity flags | Echo flag count | Ending | Origin choice |
| --- | --- | --- | --- | --- | --- | --- | --- |
| p8-balanced-wei | 2–245 | 10–94 | none | p9_route_identity_balanced=balanced_harmony_steward | 6–8 | null | origin_merchant_family |
| p8-cautious-han | 50–425 | 26–79 | none | p9_route_identity_cautious=cautious_steward | 4–6 | null | origin_merchant_family |
| p8-deviant-ye | 75–364 | 54–148 | none | p9_route_identity_deviant=demonic_shadow_master | 6–9 | null | origin_merchant_family |
| p8-explorer-lu | -80–315 | 10–30 | none | p9_route_identity_wanderer=wanderer_map_legend | 5–5 | null | origin_merchant_family |
| p8-martial-lin | -100–460 | 53–71 | none | p9_route_identity_martial=martial_proven_champion | 5–8 | null | origin_merchant_family |
| p8-scholar-su | 15–270 | 0–40 | none | p9_route_identity_scholar=scholar_lecturer | 5–7 | null | origin_merchant_family |
| p8-social-gu | -90–165 | 12–42 | none | p9_route_identity_social=social_network_hub | 4–7 | null | origin_merchant_family |
| p8-wealth-shen | 16–911 | 0–42 | none | p9_route_identity_merchant_master=merchant_caravan_master, p9_route_identity_wealth=wealth_caravan_magnate | 4–4 | null | origin_merchant_family |

| Dimension | Unique signatures | All-pair exact matches |
| --- | --- | --- |
| Event ID sequence | 40 | — |
| Choice sequence | 40 | 0/780 |
| Active action sequence | 37 | — |
| Visible event/presentation proxy | 40 | 0/780 |
| Identity/ending/route/echo metric signature | 25 | 21/780 |

Trace-derived route/identity signals: p9_route_identity_balanced=balanced_harmony_steward, p9_route_identity_cautious=cautious_steward, p9_route_identity_deviant=demonic_shadow_master, p9_route_identity_wanderer=wanderer_map_legend, p9_route_identity_martial=martial_proven_champion, p9_route_identity_scholar=scholar_lecturer, p9_route_identity_social=social_network_hub, p9_route_identity_merchant_master=merchant_caravan_master, p9_route_identity_wealth=wealth_caravan_magnate. Final ending payloads observed: null. Top recurring final flags include: bornInWuxiaFamily (40/40), childhoodSummaryDone (40/40), giftedSpeaker (40/40), has_child (40/40), love_approach_method (40/40), love_started (40/40), marriage_type_arranged (40/40), married (40/40), martialArtist (40/40), merchant_childhood_preference_done (40/40), merchant_infant_shop_birth (40/40), merchant_infant_swaddle_abacus (40/40), mingyue_married_other (40/40), origin_id (40/40), origin_merchant_family (40/40).

The three layers must not be conflated:

- **Real player-visible story convergence:** not proven by this headless batch. The event text and presentation payload are only a trace proxy; no human/browser observation was performed here.
- **Simulation-strategy convergence:** strongly visible in the common origin choice, deterministic tie order, repeated choice IDs, and fixed action priorities.
- **Metric-encoding convergence:** visible in repeated route/identity/echo flags and the absence of a final ending payload in these traces; this is an encoding/result-surface observation, not proof that the underlying story is identical.

## Confirmed Facts

- 40 JSON traces loaded; no trace file was written or changed by this audit script.
- Policy metadata is oracle_effect_score_v1, hidden effects enabled, unnormalized units, deterministic, first-candidate tie break.
- 846 choice steps, 1934 candidate rows, 489 active-action steps; 84 ties and 84 order tie breaks.
- Money contributes over 50% of absolute stat contribution in 208/846 selected candidates; one-stat >50% occurs in 733/846.
- Persona bonus is non-zero on the selected candidate 329/846 times, but changes the first base winner 76/846 times; origin merchant wins 40/40 times.

## Reasonable Inferences

- Raw hidden-effect scoring is materially capable of masking persona intent, especially where money is numerically large; this is a simulator-bias finding, not a product-balance finding.
- Active-action differences are mostly availability/timing effects layered on a fixed priority policy; they should not be read as emergent preference learning.
- Outcome flattening can change rankings in counterfactual single-branch calculations, so merged outcome scores should be treated as an oracle diagnostic rather than a faithful player decision model.

## Unresolved / Awaiting Verification

- Exact outcome reachability for every choice is unresolved because the current Trace does not store full choice-pre-state snapshots or outcome IDs/conditions. The report intentionally does not convert the sensitivity upper bound into an actual affected-choice count.
- Human-visible story differentiation, comprehension of option text, perceived risk, and fun are unresolved. Automated Trace evidence cannot answer them.
- Final `ending` is not populated in the sampled trace payloads; this is a coverage/encoding fact, not a conclusion that no narrative ending exists elsewhere.

## Decision and the Unique Next Slice

**D. 暂不修正模拟器，进入产品 Slice。**

Rationale: the audit proves substantial oracle distortion and identifies where it comes from, but the same batch cannot distinguish whether visible convergence is caused by event content, hidden-effect scoring, or identity/metric encoding with enough confidence to justify a global scoring rewrite. The smallest correct next slice is a bounded player-visible/browser playtest on the origin and one or two high-traffic multi-outcome nodes, comparing perceived differentiation against the same Trace-derived strategy diagnostics.

Do not do in this slice:

- Do not change `choiceScoring.ts`, persona bonuses, action priorities, events, seeds, thresholds, P8/P11 gates, Engine, Snapshot, Contract, or GameScreen.
- Do not treat P8 near-duplicate numbers as a substitute for visible playtesting.
- Do not globally normalize money or replace the oracle before a player-visible decision criterion is recorded.

## Reproduction

```bash
npm run simulate:experience-trace -- --all-personas --seeds-per-persona 5 --end-age 40
npm exec -- tsx scripts/auditExperienceTraceChoicePolicy.ts
```

