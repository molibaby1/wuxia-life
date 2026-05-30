# P3 Midlife Experience and Trust Hardening — Death Risk Design Rules (US-004)

生成时间：2026-05-31

Story：**US-004 Define Death Risk Design Rules**

权威输入：`docs/test-reports/p3-midlife-trust-targets.md`（US-002 §3.1、§4.1 B4、§5.3）、`docs/test-reports/p3-midlife-death-source-audit.md`（US-003）、`docs/PRD/p3-midlife-experience-and-trust-hardening.md`（Design Considerations）、`docs/test-reports/product-experience-governance-choice-feedback-standard.md`（riskHints 层）。

本文档冻结 **0–50 人生阶段** 的死亡风险设计规则、预警信号标准、缓解手段目录、不可避免死亡允许条件，以及 P3 评估队列的死亡率目标。供 **US-005（遥测）** 与 **US-006（调优）** 直接引用；不修改业务代码。

---

## 1. 目的与范围

| 项 | 说明 |
| --- | --- |
| **目的** | 把「死亡像坏运气」转为「死亡像可读后果」；为 gate `death_without_warning` 与内容 authoring 提供统一口径 |
| **在 scope** | 年龄分段规则、风险分级、warning 层级、mitigation 目录、不可避免死亡条件、P3-EVAL 死亡率目标、US-005 遥测字段建议 |
| **不在 scope** | 事件文案修改、引擎逻辑修改、随机样本阈值（P2-LEGACY 仍引用 US-002 §3.1） |
| **评估队列** | **P3-EVAL**（`golden-sect` / `golden-wanderer` / `golden-demonic` / `golden-neutral-baseline` / `golden-romance-family`）须 **存活至 50 岁**；**P2-LEGACY** 不适用 §6 零死亡目标 |

---

## 2. 术语

| 术语 | 定义 |
| --- | --- |
| **直接致死** | 运行时设置 `alive=false`（含 `end_game` special、`deathProbability=100`） |
| **强生存惩罚** | 单次 `health` 损失 ≥10、`constitution` 损失 ≥15、`energy` 损失 ≥20，或等价组合 |
| **高风险选择** | 选项或 auto 链可导致直接致死、或单次强生存惩罚且缺少低风险替代 |
| **玩家可见 warning** | 事件正文/选项文案/`ChoiceFeedbackRiskHint`（severity ≥ medium）/生命记忆风险区可见的语义信号 |
| **缓解路径** | 玩家在当前或上一事件内可执行的更低风险选项、属性门槛安全分支、或后续恢复/豁免机制 |
| **不可避免死亡** | 满足 §7 允许条件、且玩家已获 §4 规定 warning 后仍无法通过任何缓解手段避免的死亡 |

---

## 3. 人生阶段死亡风险规则

### 3.1 总原则（全阶段）

1. **后果优先于概率**：玩家应理解「为何危险」，而非仅看到随机骰子结果。
2. **选择前可读**：凡 **高风险选择**，必须先出现 §4 规定的 warning（L2 及以上）。
3. **至少一条出路**：每条 priority route 的 **高风险分支** 须至少有 **1 条缓解路径**（选项、属性门槛或状态豁免）。
4. **叙事与机制一致**：文案写「殒命/清算/命尽」时，须么真的 `alive=false`，要么改为「重伤/危机」并给出恢复或后续选择（修复 US-003「假死亡」类：`demonic_ending_purge`）。
5. **P3-EVAL 零死亡**：0–50 deterministic 样本 **目标死亡率 = 0**（US-002 §3.1）；若发生死亡，须可追溯到 warning + 玩家路径选择，且 **US-006 须消除**。

### 3.2 Early life（幼年少龄，0–17 岁）

| 维度 | 规则 |
| --- | --- |
| **允许的风险类型** | 仅 **中等及以下** 强生存惩罚（如 trial 分支 `health −8～−25`）；**禁止直接致死** |
| **随机系统风险** | `setback_injury` 等可触发，但 **不得** 在 P3-EVAL 路径上单独构成死亡链；体质豁免视为系统缓解 |
| **设计密度** | 事件以「入门试炼、门派选择」为主；伤害应来自 **玩家可选** 的高难分支，而非 auto 击杀 |
| **当前盘点对照** | `orthodox_trial_service`、`sect_trial_entry`、`demonic_trial_shadow` — 均已具备 warning + 低风险选项（US-003 §4） |
| **P3-EVAL 目标** | 此阶段 **0 死亡**；强惩罚后须有恢复事件或自然属性回弹窗口（如 `orthodox_trial_recovery`） |

### 3.3 Young adulthood（青壮，18–30 岁）

| 维度 | 规则 |
| --- | --- |
| **主要风险窗口** | 夺位、试炼失败链、情关舍身、**引擎 `early_death`（ENG-01）** |
| **随机致死** | `early_death`（18–40，0.3% 基础概率）为 **当前唯一有效直接致死**；P3 设计口径：**不得** 在 P3-EVAL deterministic 路径上以「无预警随机」结束生命 |
| **高风险选择** | 须 L2 warning + 至少 1 缓解：`demonic_usurpation` 失败链、`love_life_or_death` 舍身、`demonic_redemption_test` 须补显性风险文案（US-003 缺口） |
| **auto 事件链** | **禁止** 新增「仅 flag 触发、无选项、文案致死但机制未致死」的 auto 链；现有 `demonic_ending_purge` 在 US-006 须改为 **可避** 或 **机制一致** |
| **wandering hero** | 本阶段 active 事件 **无** 专属 health 分支；shared/setback 风险须在 US-006 通过 **shared 事件标注** 或 **hero 专属风险分支** 满足 §3.1-3 |
| **P3-EVAL 目标** | **0 死亡**；`early_death` 对 deterministic 样本须 **禁用或保证不触发**（US-006 实现策略，本文仅冻结目标） |

### 3.4 Midlife（中年，31–50 岁）

| 维度 | 规则 |
| --- | --- |
| **P3 扩展重点** | US-018–023 新增 midlife 事件须遵守本文；压力来自 **0–30 路线状态与 key choice 欠债** |
| **允许的风险类型** | 路线义务型强惩罚、声誉/人脉代价、道德 compromise；**直接致死仅** 在满足 §7 且带 L3 warning 的 **路线终局型** 分支 |
| **随机风险** | `early_death` 年龄上限 40 — **31–50 不应** 再受 ENG-01 影响；随机 setback 仅作属性/resource 压力 |
| **每条 priority route** | midlife 须 ≥1 次 **可读高风险 moment**（manual choice），且含 warning + mitigation（PRD US-023） |
| **P3-EVAL 目标** | **0 死亡**；`finalAge=50` 且 `isAlive=true`（US-002 B5） |

### 3.5 Late-life（晚龄，51+ 岁）

| 维度 | 规则 |
| --- | --- |
| **P3 scope** | 不在 P3-EVAL；规则供 legacy 与后续全生命周期扩展 |
| **允许机制** | `EndingSystem.getForcedLateLifeEnding`（ENG-02，≥70 报告 `isAlive=false`）；deferred `elderly-legacy` 的 `end_game` |
| **玩家体验** | 晚龄死亡视为 **人生收束**，非「英年早逝」；**不要求** 0–50 式 mitigation，但 ending 文案须与路线状态一致 |
| **P2-LEGACY** | `death_rate=1.0` 为 **预期**（US-002 N1）；不升级为 P3 blocker |

---

## 4. 高风险选择前的 Warning 信号规则

### 4.1 Warning 层级

| 层级 | 名称 | 载体 | 最低要求 | 适用 |
| ---: | --- | --- | --- | --- |
| **L0** | 环境/状态预警 | 生命记忆「风险」区、低 `health`/`constitution` 提示、危险 flag（如 `demonic_usurp_failed`） | 玩家可在 **下一次** 高风险事件前看到 | 慢性累积风险、失败链后置 |
| **L1** | 事件级预警 | 事件 `title` / `description` 含风险语义（危/伤/死/覆灭/清算/命尽等） | 进入事件即可见 | 所有含强惩罚或致死可能的事件 |
| **L2** | 选项级预警 | 选项 `text`/`description` 或 `ChoiceFeedbackRiskHint`（severity **medium**） | **高风险选择前必须** | 手动选项导致强惩罚或致死 |
| **L3** | 明示致命预警 | 选项文案或 `riskHints`（severity **high**）明确「可能丧命/性命不保/难以生还」 | **直接致死或等价叙事** 前必须 | `end_game`、`deathProbability>0`、舍身类选项 |

### 4.2 组合要求（按风险类）

| 风险类 | 进入事件 | 选择前 | 触发后 |
| --- | --- | --- | --- |
| **直接致死** | L1 + L0（若存在失败链 flag） | **L3** | `failureText` 或结局叙事；US-005 记 `deathCauseId` |
| **强生存惩罚（手动）** | L1 | **L2** | choice feedback 含 stat impact + 可选 `riskHints` |
| **强生存惩罚（随机 setback）** | 触发后 L1（`failureText`） | **L0 年度风险脉动**（US-006）：体质低于豁免线时，在年度/状态 UI 提示「身子正虚，今年宜静养」 | 体质豁免成功时须有 **正面反馈**（「险死还生」） |
| **auto 链（无选项）** | L1 | 若可导致致死/强惩罚：**须改为 manual** 或在前置事件提供 L2 避错选择 | 不得 silent auto-kill |

### 4.3 随机 `early_death` 的 P3 专项规则（ENG-01）

US-003 结论：触发 **无选项**、warning 仅在 **触发后** `failureText`。

| 规则 ID | 内容 | US-006 落地 |
| --- | --- | --- |
| **WR-ENG-01** | 体质 `<80` 且 age 18–40：L0 须提示「命途多舛，需养精蓄锐」类 ambient 信号 | 生命记忆或年度 tick UI |
| **WR-ENG-02** | P3-EVAL deterministic 运行：**不得** 因 ENG-01 死亡（禁用或 seed/难度隔离） | 仿真配置 |
| **WR-ENG-03** | 非 P3 随机游玩：保留 ENG-01，但触发前须满足 WR-ENG-01 | 内容与 UI |

### 4.4 禁止模式

- 仅 hidden/diagnostic 字段含风险、玩家界面无 L1–L3 信号。
- 高风险选项与低风险选项 **文案对称**、无法区分后果轻重。
- 使用 banned vague feedback（见 choice-feedback-standard）作为 **唯一** 风险传达。
- JSON `setback_early_death` 与 TS `early_death` 混记为同一 death cause（US-005 须分源）。

---

## 5. 缓解（Mitigation）方法目录

缓解须在 **同一事件选项集** 或 **前置 1 个关键选择窗口** 内可达。US-005 遥测字段：`mitigationAvailable`、`mitigationTaken`。

### 5.1 按手段分类

| 手段 | 状态/属性来源 | 典型机制 | 示例（US-003） |
| --- | --- | --- | --- |
| **Health 管理** | `player.health` | 选低风险分支；选恢复选项；避免叠伤 | `orthodox_trial_service` → `service_meditate`；`love_life_or_death` → 「寻找援手」 |
| **Constitution 豁免** | `player.constitution` | setback 引擎 `exemption.constitutionThreshold` + `baseRate` | ENG-01：体质 ≥80 不进池；触发时 60% 豁免 |
| **Allies / 人脉** | `connections`、关系对象 | 高人脉解锁援护选项；关系 flag 触发 NPC 解围 | `love_life_or_death` 援护分支；future midlife ally cost 事件 |
| **Reputation / 侠义** | `reputation`、`chivalry` | 高声望避免敌对遭遇；负侠义触发追杀须提前 L0 | setback `reputation_crisis` 类；route 道德代价 |
| **Route state** | `routeStates`、`current_sect`、路线 flag | 避免进入 failed/ purge 链；路线内「金盆洗手/退隐/赎罪」分支 | 避免 `demonic_usurp_failed` → `demonic_ending_purge` |
| **Prior choices / flags** | `flag_set`、key choice 记录 | 早期选择解锁安全分支或 recovery 事件 | trial 选基础关；夺位前积累势力 |

### 5.2 按 priority route 的最低缓解覆盖

| Route | 当前高风险源 | 必须存在的缓解类型 | US-006 备注 |
| --- | --- | --- | --- |
| **orthodox/sect** | trial 伤、`sect_trial_entry` | 低风险选项 + recovery 事件 | 已满足；midlife 新增须复用 |
| **wandering hero** | shared setback、缺专属分支 | **至少 1**：shared 事件标注 + 援护/退避选项，或 hero 专属 midlife 风险事件 | US-003 明确缺口 |
| **demonic path** | usurp 链、purge auto、`redemption_test` | 避免 failed flag + redemption 线 + L2 文案 | purge 链须改可避 |
| **shared/romance** | `love_life_or_death` | 非舍身选项 | 已满足 |
| **system/setback** | ENG-01、随机病伤 | constitution 豁免 + L0 预警 | WR-ENG-01/02 |

### 5.3 缓解有效性判定（供 US-005/006）

满足 **任一** 即记 `mitigationAvailable=true`：

1. 同事件存在 **无强惩罚** 的 manual 选项。
2. 玩家属性达到 **门槛分支** 的安全 outcome（如 trial 属性检定成功）。
3. 引擎 **exemption** 可触发且玩家当前属性满足 threshold。
4. 前置关键选择曾选 **低风险路径**，使当前 lethal auto 链不可达。

`mitigationTaken=true`：死亡/强惩罚发生前 **1 个手动选择窗口** 内，玩家本可选但未选上述路径。

---

## 6. 0–50 Deterministic 场景死亡率目标

引用 US-002 §3.1、§5.3，本文 **冻结** 如下：

### 6.1 P3-EVAL 聚合目标

| 指标 | 运算符 | 阈值 | 聚合 | Enforce |
| --- | --- | ---: | --- | --- |
| `death_rate` | `≤` | **0.00** | 跨 P3-EVAL 全样本 | US-017 起 continuity；US-029 全面 |
| `death_without_warning_count` | `=` | **0** | 跨 P3-EVAL | **US-006** 起 blocker（B4） |
| `finalAge` | `=` | **50** | 每样本 | US-017 起 |
| `isAlive` | `=` | **true** | 每样本 @50 | 与 `death_rate` 等价 |

### 6.2 分段观测目标（US-017 报告）

| 分段 | 年龄 | `death_count` | `death_without_warning` |
| --- | --- | ---: | ---: |
| Youth | 0–30 | **0** | **0** |
| Midlife | 31–50 | **0** | **0** |

### 6.3 单样本期望（当前 4+1 样本）

| Sample ID | 0–50 死亡 | 说明 |
| --- | ---: | --- |
| `golden-sect` | 0 | 试炼伤仅；须存活至 50 |
| `golden-wanderer` | 0 | 无专属致死；setback 须隔离或豁免 |
| `golden-demonic` | 0 | usurp/purge 链须可避 |
| `golden-neutral-baseline` | 0 | 无路线偏置；setback 同规则 |
| `golden-romance-family` | 0 | US-010 占位；情感线不引入 silent death |

### 6.4 非 P3-EVAL 对照

| 队列 | `death_rate` | 说明 |
| --- | --- | --- |
| **P2-LEGACY** | warning `0.15–0.9`；实测 ~1.0 预期 | 跑至 85 + ENG-02；**非** P3 失败依据 |
| **随机/非 deterministic** | 不在本文冻结 | 可保留 ENG-01 低概率英年早逝 |

---

## 7. 不可避免（Unavoidable）死亡的允许条件

「不可避免」指设计上有意为之、且玩家已被充分告知的死亡，**不** 等同于 P3-EVAL 允许死亡。

### 7.1 允许条件（须全部满足）

| # | 条件 |
| ---: | --- |
| **U1** | 年龄 **≥51**（late-life），或玩家 **主动选择** L3 标注的致命选项且无后续 recovery 窗口 |
| **U2** | 死亡前 **至少 L3**（主动致死）或 **L1+L0+触发后叙事**（系统晚龄收束） |
| **U3** | 非 P3-EVAL cohort，或 US-006 已明确将该样本路径标为「stress test」且 **排除在 P3-EVAL 外**（默认 **无** stress-death 样本） |
| **U4** | 死亡原因可写入单一 `deathCauseId`（事件 id 或 `engine:early_death` / `engine:forced_late_life_ending`） |

### 7.2 不允许视为「不可避免」的情形

| # | 情形 | 处置 |
| ---: | --- | --- |
| **X1** | 随机 setback 在 P3-EVAL 0–50 内无任何 L0 即击杀 | US-006 blocker |
| **X2** | auto 链致死且无前置 manual 避错 | 改事件结构 |
| **X3** | 文案死亡但 `alive` 仍为 true（假死亡） | 机制或文案对齐 |
| **X4** | 双轨配置（JSON `setback_early_death` vs TS `early_death`）导致 cause 不可解释 | US-005 分源 + US-006 收敛配置 |

### 7.3 P3 阶段的实践口径

**P3-EVAL 0–50 内不存在不可避免的死亡目标** — 信任目标要求全员存活。§7.1 供 legacy、未来全生命周期与 **玩家自愿求死** 选项预留。

---

## 8. US-005 遥测字段建议（从规则映射）

| 字段 | 类型 | 来源规则 |
| --- | --- | --- |
| `deathCauseId` | string | §2 直接致死源；区分 `early_death` / `engine:forced_late_life_ending` / event id |
| `deathCauseCategory` | enum | `engine_setback` \| `event_choice` \| `event_auto` \| `forced_ending` |
| `deathAge` | number | §3 分段报告 |
| `deathLifePhase` | enum | `early` \| `young_adult` \| `midlife` \| `late_life` |
| `routeStateAtDeath` | object | active routes snapshot |
| `recentKeyChoices` | array | 前 N 个 key choice id + age |
| `warningLevelMax` | enum | `none` \| `L0` \| `L1` \| `L2` \| `L3` |
| `warningSatisfied` | boolean | 是否满足 §4 对该风险类的最低层级 |
| `mitigationAvailable` | boolean | §5.3 |
| `mitigationTaken` | boolean | §5.3 |
| `deathWithoutWarning` | boolean | `!warningSatisfied` 且 `deathCauseCategory≠forced_ending` |
| `healthAtDeath` / `constitutionAtDeath` | number | mitigation 分析 |

报告须汇总 **top death causes** 按 `deathCauseId` 计数，并分列 P3-EVAL vs P2-LEGACY。

---

## 9. US-006 调优 backlog（规则派生，非本文实施）

按 US-003 缺口与本文规则优先级：

| 优先级 | 项 | 规则条目 |
| ---: | --- | --- |
| P0 | P3-EVAL 禁用或隔离 ENG-01 | §3.3, WR-ENG-02, §6 |
| P0 | `demonic_ending_purge` 改可避或机制致死一致 | §3.3, §7.2 X2/X3 |
| P1 | `demonic_redemption_test` 补 L2 风险文案 | §4.2 |
| P1 | wandering hero 补高风险+缓解（shared 或专属） | §5.2 |
| P2 | 收敛 JSON/TS setback 双轨 | §4.4, §7.2 X4 |
| P2 | WR-ENG-01 L0 年度风险 UI | §4.3 |
| P3 | midlife 事件（US-019/021/023）落地时逐条对照 §3.4 | §3.4 |

---

## 10. 风险分级速查（authoring）

| 级别 | 机制 | Warning | Mitigation | P3-EVAL |
| --- | --- | --- | --- | --- |
| **R0 安全** | 无 stat 损伤或 ≤5 health | 无强制 | — | 允许 |
| **R1 低** | health −6～−9 | L1 推荐 | 可选 | 允许 |
| **R2 中** | health −10～−19 或 constitution −10～−14 | L1 + L2 | **必须** | 允许 |
| **R3 高** | health ≤−20 或 combo 强惩罚 | L1 + L2 | **必须** + recovery 路径 | 允许但 **不得致死** |
| **R4 致命** | `alive=false` / deathProbability | L1 + L3 | **必须**（P3-EVAL 下须 **可完全避免**） | P3-EVAL **禁止发生** |

---

## 11. US-004 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Define early, midlife, late-life death-risk rules | done — §3.2–3.5 |
| Define required warning signals before high-risk choices | done — §4 |
| Define mitigation methods (health, allies, reputation, route, prior choices) | done — §5 |
| Define when unavoidable death is allowed | done — §7 |
| Define death-rate target for 0–50 deterministic scenarios | done — §6 |
| Do not modify business code | done |
| Typecheck passes | 见 §12 |
| Ready for US-005 telemetry and US-006 tuning | done — §8–§9 |

---

## 12. 验证

```bash
npm run typecheck
```

---

## 13. 下游 Story 引用

| Story | 引用本文章节 |
| --- | --- |
| **US-005** Implement Death Risk Telemetry | §8 字段；§4.4 分源；§2 术语 |
| **US-006** Tune Early and Midlife Death Risk | §3、§4.3、§5.2、§6、§9 backlog |
| **US-023** Demonic Midlife Implement | §3.4、§5.2 demonic 行 |
| **US-024** 0–50 Midlife Gate | §6 death readability 与 §4 组合 |
| **US-029** Update Experience Gates | §6 与 US-002 一并 enforce |

---

*P3-W1 / US-004 — 2026-05-31*
