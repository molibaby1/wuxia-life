# P8 Local Opaque Setback Semantic Inventory

状态：只读产品证据盘点，未实施修复。

数据源：`docs/test-reports/p8-playability-gate-local-latest.json`（`runtimePath: local_direct`，生成时间 `2026-08-05T04:47:48.634Z`）、对应 Local 运行记录、P8 persona seed 定义、相关事件源文件，以及定向 Headless 对照。本文不重新计算 gate，不改变 occurrence-based 聚合。

## 1. Executive conclusion

最新 Local P8 报告包含：

- opaque occurrence：22；
- unique opaque semantic pattern：11；
- A `TRUE_PLAYER_VISIBLE_CONTENT_GAP`：6 个 unique pattern / 7 个 occurrence；
- B `CLASSIFIER_FALSE_NEGATIVE`：5 个 unique pattern / 15 个 occurrence；
- C `SIMULATION_VISIBILITY_MISMATCH`：0；
- D `AGGREGATION_CONTRACT_QUESTION`：0 个确认 defect，1 个待产品裁决问题；
- E `INSUFFICIENT_EVIDENCE`：0。

五个失败 persona 的 ratio 是真实负面结果重建后的结果，不是由事件前景关键词单独产生：

| Persona | Seed | actual setbacks | opaque | ratio |
|---|---:|---:|---:|---:|
| `p8-martial-lin` | 801 | 8 | 3 | 0.375 |
| `p8-scholar-su` | 802 | 6 | 2 | 0.333 |
| `p8-social-gu` | 803 | 8 | 3 | 0.375 |
| `p8-wealth-shen` | 804 | 6 | 4 | 0.667 |
| `p8-cautious-han` | 805 | 8 | 3 | 0.375 |
| `p8-deviant-ye` | 806 | 7 | 1 | 0.143 |
| `p8-explorer-lu` | 807 | 7 | 2 | 0.286 |
| `p8-balanced-wei` | 808 | 7 | 4 | 0.571 |

结论是两类问题并存：7 条 occurrence 是真实的玩家可见内容缺口，15 条是内容已经提供相关线索但 classifier 漏判。当前证据足以提出一个限定后续 Slice，但不足以在本盘点中授权或实施代码、metric 或事件内容修改。

## 2. Local failure reconstruction

Local gate 的失败分子是每个 persona 在一次运行中实际经历的 opaque setback occurrence。分母是同一次运行中实际负面结果成立的 setback 总数；危险前景、near-miss、纯正向结果和恢复事件没有进入分母。

逐条重建得到：

- `p8-martial-lin`：opaque 为 `relationship_master_disciple`、`demonic_midlife_isolation_spouse`、`family_crisis`，即 `3 / 8 = 0.375`；
- `p8-social-gu`：opaque 为 `outlaw_path_beginning`、`family_crisis`、`p29_social_momentum_patron_obligation`，即 `3 / 8 = 0.375`；
- `p8-wealth-shen`：opaque 为 `merchant_talent_discovery`、`hero_road_peril`、`relationship_sworn_help`、`family_crisis`，即 `4 / 6 = 0.667`；
- `p8-cautious-han`：opaque 为 `relationship_master_disciple`、`family_crisis`、`sect_midlife_gray_mission`，即 `3 / 8 = 0.375`；
- `p8-balanced-wei`：opaque 为 `refugee_sect_story`、`daily_reading_notes_neg_1`、`family_crisis`、`sect_midlife_gray_mission`，即 `4 / 7 = 0.571`。

作为边界对照，7 次 `hero_peril_fight` 只有 `martialPower +3`，没有实际负面 delta，因此不属于 setback；`orthodox_trial_recovery` 移除 `injured` 并将健康状态从更严重状态改善为 `unwell`，也不属于 setback。`setback_injury` 和 `setback_property_loss` 均保留为真实 setback。

## 3. Occurrence inventory

下表覆盖全部 22 条 occurrence。`—` 表示该记录没有 choice；`warning / explanation / recovery` 是与实际负面 domain 直接相关的玩家可见信息，而不是泛化危险词。

| # | Persona / seed / age | Event / type | Selected choice | Actual negative evidence（before → after） | Concurrent positive result | Player-visible context and outcome | W / E / R | Pattern |
|---:|---|---|---|---|---|---|---|---|
| 1 | `p8-martial-lin` / 801 / 24 | `relationship_master_disciple` / choice | `拜入名门（需悟性≥40）` | `martialPower 32→20`; `reputation 14→15`（该次声望为正向变化） | `reputation +1` | 正文“这是你武学道路上的重要契机”；choice 只有“需悟性≥40”；outcome“你的武艺似乎有些生疏。” | 否 / 否 / 否 | A |
| 2 | `p8-martial-lin` / 801 / 33 | `demonic_midlife_isolation_spouse` / auto | — | `reputation 24→18`; `lover_mingyue 40→32` | `chivalry 21→18`、`knowledge 11→6` 亦下降，无正向 delta | 正文“旧友疏远”“家与门，孰轻孰重”；outcome“关于你的传言似乎不那么美好了。”；有负面叙述但没有把声望/关系损失解释成可预见代价 | 否 / 否 / 否 | B |
| 3 | `p8-martial-lin` / 801 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 10→0` | 无 | 正文“家族遭遇困难”；choice 明确显示“声望 -10”；outcome“家里的难关终于摆到了眼前，你再也不能把它当成与己无关的事。” | 是 / 否 / 否 | B |
| 4 | `p8-scholar-su` / 802 / 35 | `family_crisis` / choice | 同上 | `reputation 18→8` | 无 | 同上：choice 明示“声望 -10”，outcome 未新增原因或恢复路径 | 是 / 否 / 否 | B |
| 5 | `p8-scholar-su` / 802 / 38 | `p29_social_momentum_patron_obligation` / choice | `decline_the_petition`：婉拒担保，保留后手 | `connections 25→23` | 无 | 正文“若推辞，也会折损几分旧日情面”；outcome“你获得了新的体悟。” | 是（但“情面”未被 classifier 映射） / 否 / 否 | B |
| 6 | `p8-social-gu` / 803 / 21 | `outlaw_path_beginning` / choice | `加入幽影门` | `martialPower 22→5` | 无 | 正文讨论正邪与江湖传言；choice 没有武力损失提示；outcome“你的武艺似乎有些生疏。”，未说明为何下降 | 否 / 否 / 否 | A |
| 7 | `p8-social-gu` / 803 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 39→29` | 无 | 正文家族困难；choice 明示“声望 -10”；outcome“家里的难关终于摆到了眼前，你再也不能把它当成与己无关的事。” | 是 / 否 / 否 | B |
| 8 | `p8-social-gu` / 803 / 38 | `p29_social_momentum_patron_obligation` / choice | `decline_the_petition`：婉拒担保，保留后手 | `connections 54→52` | 无 | 正文“若推辞，也会折损几分旧日情面”；outcome“你获得了新的体悟。” | 是（但“情面”未被 classifier 映射） / 否 / 否 | B |
| 9 | `p8-wealth-shen` / 804 / 8 | `merchant_talent_discovery` / choice | `study_business`：学习经商 | `charisma 18→5`; `money 305→20` | 正文声称“赚取了人生第一桶金”，但没有对应正向 delta | 正文是“低价买入高价卖出，赚取了人生第一桶金”；choice 没有魅力/金钱代价；outcome“你感觉自己有些黯淡。” | 否 / 否 / 否 | A |
| 10 | `p8-wealth-shen` / 804 / 26 | `hero_road_peril` / choice | `hero_peril_retreat`：退避寻援 | `reputation 10→7` | `connections 3→7`（+4） | 正文“押镖途中遇伏……危机四伏”；choice“暂缓押镖，先寻援手，以保全身而退”；outcome“关于你的传言似乎不那么美好了。”；身体风险提示不能解释名望损失 | 否 / 否 / 否 | A |
| 11 | `p8-wealth-shen` / 804 / 34 | `relationship_sworn_help` / choice | `全力相助（需武力≥70，侠义 +15）` | `martialPower 20→10`; `constitution 9→0`; `reputation 22→15` | `chivalry 10→15`（+5） | 正文“结拜兄弟/姐妹遇到了麻烦”；choice 只显示武力门槛和“侠义 +15”；outcome“你的心中似乎多了一丝动摇。”；没有说明武力、体魄、声望代价 | 否 / 否 / 否 | A |
| 12 | `p8-wealth-shen` / 804 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 15→5` | 无 | 正文家族困难；choice 明示“声望 -10”；outcome 未给恢复路径 | 是 / 否 / 否 | B |
| 13 | `p8-cautious-han` / 805 / 27 | `relationship_master_disciple` / choice | `拜入名门（需悟性≥40）` | `martialPower 26→20`; `reputation 24→15` | 无 | “重要契机”与悟性门槛不是武力/声望损失预警；outcome“你的武艺似乎有些生疏。”没有原因或恢复路径 | 否 / 否 / 否 | A |
| 14 | `p8-cautious-han` / 805 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 30→20` | 无 | choice 已直接写出“声望 -10” | 是 / 否 / 否 | B |
| 15 | `p8-cautious-han` / 805 / 36 | `sect_midlife_gray_mission` / choice | `gray_refuse_order`：拒令请罪 | `master_qingxu 30→22` | `chivalry 18→22`（+4） | 正文“长老以大局压你”；choice/outcome 含“清虚真人震怒，却念你昔日功绩从轻发落。【L1 可避重罚】”；已给出原因和减罚路径 | 是 / 是 / 是 | B |
| 16 | `p8-deviant-ye` / 806 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 10→0` | 无 | choice 已直接写出“声望 -10” | 是 / 否 / 否 | B |
| 17 | `p8-explorer-lu` / 807 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 17→7` | 无 | choice 已直接写出“声望 -10” | 是 / 否 / 否 | B |
| 18 | `p8-explorer-lu` / 807 / 36 | `sect_midlife_gray_mission` / choice | `gray_refuse_order`：拒令请罪 | `master_qingxu 30→22` | `chivalry 7→11`（+4） | 同第 15 条：震怒、从轻发落、【L1 可避重罚】均与关系损失相关 | 是 / 是 / 是 | B |
| 19 | `p8-balanced-wei` / 808 / 16 | `refugee_sect_story` / choice | `同情他的遭遇` | `chivalry 29→5` | `connections 2→10`（+8） | 正文是流浪武者被围剿灭门的故事；choice 只表达同情；outcome“你的心中似乎多了一丝动摇。”；没有侠义损失提示 | 否 / 否 / 否 | A |
| 20 | `p8-balanced-wei` / 808 / 17 | `daily_reading_notes_neg_1` / auto | — | 新增 `anxious`；同批次 `money 95→0` 是无关时间推进变化，不归因给该 event | 无；`money` 变化不计入该 event | 正文“前后矛盾……烦躁”；outcome“心中泛起涟漪，但一切似乎又归于平静。”；烦躁与新增 anxious 相关，现 classifier 未识别 | 否 / 是 / 否 | B |
| 21 | `p8-balanced-wei` / 808 / 35 | `family_crisis` / choice | `抽身自保，先守住自家日子 (声望 -10)` | `reputation 23→13` | 无 | choice 已直接写出“声望 -10” | 是 / 否 / 否 | B |
| 22 | `p8-balanced-wei` / 808 / 36 | `sect_midlife_gray_mission` / choice | `gray_refuse_order`：拒令请罪 | `master_qingxu 30→22` | `chivalry 12→17`（+5） | 同第 15 条：震怒、从轻发落、【L1 可避重罚】均与关系损失相关 | 是 / 是 / 是 | B |

## 4. Unique semantic patterns

| Unique pattern | Event / choice | Occurrences | Personas | Actual negative evidence | Visible-context result | Classification |
|---|---|---:|---|---|---|---|
| U1 | `relationship_master_disciple` / 拜入名门 | 2 | martial-lin, cautious-han | martialPower 降至 20；并伴随 reputation 变化 | 悟性门槛和“重要契机”没有披露武力损失 | A |
| U2 | `demonic_midlife_isolation_spouse` / auto | 1 | martial-lin | reputation -6；lover affinity -8 | 有“旧友疏远”“传言”语义，但 classifier 未映射到相关 domain | B |
| U3 | `family_crisis` / 抽身自保 | 8 | martial-lin, scholar-su, social-gu, wealth-shen, cautious-han, deviant-ye, explorer-lu, balanced-wei | reputation -10 | choice 直接写“声望 -10” | B |
| U4 | `p29_social_momentum_patron_obligation` / decline | 2 | scholar-su, social-gu | connections -2 | 正文写“折损几分旧日情面”，应视为相关预警 | B |
| U5 | `outlaw_path_beginning` / 加入幽影门 | 1 | social-gu | martialPower 22→5 | 没有功力下降的风险、原因或恢复路径 | A |
| U6 | `merchant_talent_discovery` / study_business | 1 | wealth-shen | charisma 18→5；money 305→20 | 正文反而写“赚取第一桶金”，没有相关负面提示 | A |
| U7 | `hero_road_peril` / hero_peril_retreat | 1 | wealth-shen | reputation 10→7 | 预警只涉及身体风险；connections +4 是正向结果，不能抵销未说明的 reputation -3 | A |
| U8 | `relationship_sworn_help` / 全力相助 | 1 | wealth-shen | martialPower 20→10；constitution 9→0；reputation 22→15 | 只披露武力门槛和侠义正向结果 | A |
| U9 | `sect_midlife_gray_mission` / gray_refuse_order | 3 | cautious-han, explorer-lu, balanced-wei | master affinity 30→22 | “震怒、从轻发落、可避重罚”已解释损失并提供减罚路径 | B |
| U10 | `refugee_sect_story` / 同情他的遭遇 | 1 | balanced-wei | chivalry 29→5 | 故事背景不是该侠义损失的风险/代价说明；connections +8 为正向结果 | A |
| U11 | `daily_reading_notes_neg_1` / auto | 1 | balanced-wei | 新增 anxious | 正文“烦躁”解释新增 status；money 95→0 属周边时间推进，不属于该 event 的 evidence | B |

同一 unique pattern 的 occurrence 是不同 persona 在不同运行中的实际经历，不在本报告中按 event ID 去重，也不以 unique count 重算 gate。

## 5. Classification table

### A — `TRUE_PLAYER_VISIBLE_CONTENT_GAP`

6 个 unique pattern、7 条 occurrence：

- `relationship_master_disciple` ×2：实际武力下降，但“需悟性≥40”只是准入条件，不是武力代价说明；
- `outlaw_path_beginning` ×1：实际 `martialPower 22→5`，没有相关提示；
- `merchant_talent_discovery` ×1：实际魅力和金钱下降，正文却叙述第一桶金，没有负面原因或恢复路径；
- `hero_road_peril / hero_peril_retreat` ×1：保留 `reputation 10→7`，身体风险提示不能覆盖名望代价；
- `relationship_sworn_help` ×1：实际武力、体魄、声望下降，choice 只披露侠义正向结果和武力门槛；
- `refugee_sect_story` ×1：实际侠义下降，choice 只表达同情，且同时获得人脉正向结果。

### B — `CLASSIFIER_FALSE_NEGATIVE`

5 个 unique pattern、15 条 occurrence：

- `family_crisis` ×8：choice 明示“声望 -10”，但 classifier 的 reputation 词表未覆盖“声望”；
- `p29_social_momentum_patron_obligation` ×2：正文明确“若推辞，也会折损几分旧日情面”，与 connections loss 相关，但“情面”未被识别；
- `demonic_midlife_isolation_spouse` ×1：正文“旧友疏远”，结果“关于你的传言似乎不那么美好了”，与关系/声望损失相关；
- `sect_midlife_gray_mission` ×3：choice 说明“清虚真人震怒，却念你昔日功绩从轻发落。【L1 可避重罚】”，已给出原因和恢复/减罚路径；
- `daily_reading_notes_neg_1` ×1：正文“前后矛盾……烦躁”与新增 `anxious` 相关，现有解释词表未覆盖该表达。

这些不是“只要文本有因果连接词就算解释”。每一条都先由实际 delta 或实际新增 status 确认负面结果，再验证可见文字是否针对同一 domain。

### C — `SIMULATION_VISIBILITY_MISMATCH`

确认数量为 0。当前没有 Browser 证据证明 Local simulation 记录的正文、choice 或 outcome 与正式界面显示不一致。Headless 的共同样本通常使用泛化 outcome 文案，但负面 evidence 和玩家可见相关语义没有被证明发生跨链路冲突。

### D — `AGGREGATION_CONTRACT_QUESTION`

确认 defect 数量为 0。存在一个待裁决问题：occurrence-based 聚合是在测量玩家累计经历的挫折次数，还是独立语义问题数量。

当前重复记录来自同一 event、同一 choice、同一种负面结果在不同 persona 运行中的再次经历；这些 persona 确实各自承受过一次结果。若产品目标是累计受挫体验，occurrence-based 计权有意义；若目标是独立内容缺陷数量，则会重复计权。该问题不能通过 event ID allowlist 或本报告中的 unique count 直接解决。

### E — `INSUFFICIENT_EVIDENCE`

0 条。所有 22 条都有可重建的实际负面 evidence、对应的 event/choice 或 auto-event 边界，以及足以判断 warning、explanation、recovery 相关性的玩家可见文本。

## 6. Headless comparison

仅对 Local opaque 涉及的 event/choice 做定向对照：

| Event / choice | Headless result | Local result | Classification / conclusion |
|---|---|---|---|
| `merchant_talent_discovery / study_business` | Headless 遇到同一 choice；`charisma 18→5`、`money 306→20`；opaque | Local 同一 choice；`charisma 18→5`、`money 305→20`；opaque | 同一负面语义，数值基线因运行状态不同而不同；无 visibility mismatch 证据 |
| `hero_road_peril / hero_peril_retreat` | Headless 遇到同一 choice；`reputation 10→7`、`connections 38→42`；opaque | Local `reputation 10→7`、`connections 3→7`；opaque | 名望损失和正向人脉结果一致；无 visibility mismatch 证据 |
| `sect_midlife_gray_mission / gray_refuse_order` | Headless 在 cautious persona 遇到同一 choice；`master_qingxu 30→22`；opaque | Local 在 cautious/explorer/balanced 遇到；同一 `30→22`；opaque | 实际关系损失一致；Headless 泛化 outcome 未覆盖完整 Local 文本，但没有证据证明 Browser 显示不同 |
| 其他 Local opaque patterns | Headless 本次定向运行未遇到 | Local 遇到并有完整 Local evidence | Headless 未遇到不能反推 Local 无效；差异更可能来自事件分布或 persona 决策 |

Headless 与 Local 的共同样本中，负面结果的 evidence 语义一致。当前没有必要进行 Browser 复核；Browser 复核只在出现 C 类候选时才有授权理由。

## 7. Browser visibility findings

未执行 Browser 复核。原因是 C 类候选为 0，当前没有代码或报告证据表明 simulation record 缺失、截断或错误拼接了 Browser 实际可见内容。

这不等于断言所有 Browser 显示都已被完整验证；它只表示本次 inventory 没有达到 Browser 复核的触发条件，也不将未知内容误分类为 C 或 E。

## 8. Product defects confirmed

确认的产品内容缺口为 A 类 6 个 unique pattern / 7 条 occurrence：

1. 拜师 choice 的实际武力损失没有可见代价说明；
2. 加入幽影门 choice 的实际武力损失没有可见代价说明；
3. 学习经商 choice 的实际魅力/金钱损失与“第一桶金”叙述相冲突，未提供负面说明；
4. 退避寻援 choice 的 reputation 损失未被身体风险预警覆盖；
5. 全力相助 choice 的武力、体魄、声望损失没有被其正向侠义说明覆盖；
6. 同情流浪武者 choice 的侠义损失没有可见说明。

这些条目可以授权后续正式事件内容 review Slice，但本任务不修改事件 JSON、文案、效果、条件、权重或调度。

## 9. Metric defects confirmed

确认的 metric defect 是 B 类 classifier false negative：实际负面结果成立且玩家可见内容已提供相关 warning、explanation 或 recovery，但词表/domain 映射没有识别。

当前确认的最小 metric-only 缺口是：

- `声望` → reputation domain；
- `情面` → connections/social consequence domain；
- `旧友疏远`、传言恶化 → relationship/reputation explanation；
- `震怒`、`从轻发落`、`可避重罚` → relationship explanation/recovery；
- `烦躁` → anxious status 的 explanation。

本结论不授权修改阈值 `0.35`、blocker severity、其他 P8 metric、P9、P39、P40 或事件内容。

## 10. Aggregation questions

occurrence-based 聚合存在产品语义疑问，但没有确认的 metric defect：

- 同一 event、同一 choice、同一种实际负面结果在多个 persona 中重复出现；
- 每个 persona 都确实经历了该结果，不是同一运行内被重复计入；
- occurrence count = 22 反映累计经历，unique pattern count = 11 反映独立语义问题；
- 不能在本任务按 event ID 排除，也不能用 unique count 替换 gate 分母或分子。

在不修改阈值的前提下，仅假设 A 类内容缺口被正确修复，条件预测为：

| Persona | 当前 | 仅修复 A 后的条件预测 |
|---|---:|---:|
| `p8-martial-lin` | 3/8 = 0.375 | 2/8 = 0.25 |
| `p8-social-gu` | 3/8 = 0.375 | 2/8 = 0.25 |
| `p8-wealth-shen` | 4/6 = 0.667 | 1/6 ≈ 0.17 |
| `p8-cautious-han` | 3/8 = 0.375 | 2/8 = 0.25 |
| `p8-balanced-wei` | 4/7 = 0.571 | 3/7 ≈ 0.43 |

因此仅修复确认的 A 类内容缺口，`p8-balanced-wei` 仍可能超过 `0.35`；若另行修复 B 类 classifier 漏判，才预计所有失败 persona 回到阈值内。以上是条件分析，不是 gate 重裁决。

## 11. Insufficient evidence

本次没有 E 类记录，也没有触发 Browser 复核。但以下事项仍不能从本报告确定：

- occurrence-based 是否最终符合产品对“累计受挫体验”的定义；
- A 类事件的正式产品文案、效果是否应如何重新设计；
- B 类 classifier 的最小词表扩展是否足以覆盖未来未采样表达；
- Headless 泛化 outcome 是否需要在另一个独立阶段补齐更丰富的玩家可见结果文案。

这些是后续产品裁决或限定 Slice 的输入，不是本次 inventory 可以直接实施的任务。

## 12. Recommended next product decision

证据足以批准一个限定后续 Slice 的范围决策，但不等于当前任务授权实施。建议拆分为：

1. B 类：metric-only 窄分类器 Slice，仅处理已确认的 domain/可见文本映射；不改阈值、不按 event ID 排除、不改正式 Contract；
2. A 类：正式事件 effect/content review Slice，由产品重新裁决实际代价、正向结果与恢复路径；
3. Simulation producer：当前没有 C 类或 simulation visibility defect 证据，不建议因本 inventory 修改 producer；
4. 聚合：另行裁决 occurrence 与 unique semantic pattern 的产品含义，不在此处改 gate。

限定 Slice 实施前仍需独立确认测试边界、预期分类和不变项。当前 P8 阶段保持 blocked，不因这份盘点自动关闭。

## 13. Explicit non-authorizations

本报告没有授权：

- 修改事件 JSON、事件文案、effects、conditions、weights、scheduling；
- 修改 P8 frustration threshold、severity 或其他 P8 metric；
- 按 event ID 或 choice ID 建立排除名单；
- 用关键词替代实际 negative evidence；
- 用 unique count 重算 gate；
- 修改 PlayerState、Snapshot、Schema、Contract、存档或正式 UI；
- 修改 P9、P39、P40、event-quality 或其他阶段；
- 运行完整 P8 gate 或重新裁决生成报告；
- 将当前阶段更新为已完成或进入下一阶段。

本轮允许且实际新增的文件仅为本 inventory 报告；阶段状态保持 `Blocked Pending Local Opaque Setback Semantic Inventory`。
