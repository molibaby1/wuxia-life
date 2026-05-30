# P3 Midlife Experience and Trust Hardening — Wandering Hero Midlife Arc (US-020)

生成时间：2026-05-31

Story：**US-020 Define Wandering Hero Midlife Arc**

权威输入：`docs/PRD/p3-midlife-experience-and-trust-hardening.md`、`docs/PRD/p3-midlife-experience-and-trust-hardening.prd.json`（US-020）、`docs/test-reports/p3-midlife-simulation-segments.md`（US-017）、`docs/test-reports/p3-midlife-route-contradiction-audit.md`（US-015/016 边界）、`docs/test-reports/p3-midlife-death-risk-rules.md`（US-004）、`docs/test-reports/product-experience-governance-priority-route-specs.md`（US-011 0–30）、`docs/test-reports/p3-midlife-payoff-timing-rules.md`（US-012）、`src/data/route-conflict-table.json`。

本文档定义 **wandering hero** 路线在 **31–50 岁** 的中段叙事 beats 与事件规格，供 **US-021** 实现、**US-024** gate 断言对齐。**不实现事件、不修改业务代码。**

---

## 1. 摘要

| 项 | 定义 |
| --- | --- |
| **Arc ID** | `arc_wh_freedom_cost`（自由之价） |
| **路线** | `routeId=wanderer` + `hero` 共存（`route_wanderer` flag） |
| **年龄窗口** | 主弧 **31–50**；与 0–30 的 `hero_save_village`（25–40）、`hero_road_peril`（24–40）可衔接 |
| **叙事主题** | 自由与侠名皆有代价：旧案重提、声望反噬、盟友受累、道德灰区、中年收束 |
| **确定性样本** | `golden-wanderer`（seed 302，`routeTrack=wanderer`）须在 31–50 至少触发 **3** 个本弧 route-relevant 事件 |
| **死亡约束** | P3-EVAL **0 死亡**；高风险 moment 须 L2 warning + 缓解（US-004 §3.4、§5.2） |
| **路线互斥** | 遵循 US-016：`hero`↔`demonic` **strong_exclusion**；本弧事件 **不得** 在 `demonic:active` 时触发 |

### 1.1 五条 Beat 与事件映射

| Beat | 中文 | 主事件 ID | 年龄 | 类型 |
| --- | --- | --- | ---: | --- |
| **Old case** | 旧案重提 | `hero_old_case_returns` | 31–38 | choice |
| **Public reputation** | 公众声望 | `hero_reputation_backlash` | 33–42 | choice |
| **Ally cost** | 盟友代价 | `hero_ally_pays_price` | 36–45 | choice |
| **Moral dilemma** | 道德困境 | `hero_gray_judgment` | 38–48 | choice |
| **Midlife consequence** | 中年后果 | `hero_freedom_settlement` | 45–50 | auto（带条件分支文案） |

**与现有资产关系**

| 现有事件 | 处理 |
| --- | --- |
| `hero_save_village`（25–40） | **保留**；作为 0–30 payoff，本弧 **reputation** beat 读取 `save_village` flag |
| `hero_fight_evil`（35–50） | **US-021 可选**：并入 `hero_gray_judgment` 或保留为并行 moral beat；若保留须补 `route_wanderer` gate 与 callback |
| `hero_road_peril`（24–40） | **保留**；作为 **ally cost** 的前置 callback 来源 |
| `hero_become_legend`（50+） | **不在本弧**；`hero_freedom_settlement` 为其铺垫 flag，不替代 |

---

## 2. 设计原则

1. **自由有价**：每个 beat 须让玩家感到「无门派」带来的 **不可转嫁责任**——无人兜底、无人分锅、侠名即靶子。
2. **欠债来自 0–30**：压力优先读取青年 key choice（侠义初案、留名/不留名、村庄救援、险路抉择、情感承诺），而非凭空 midlife 危机。
3. **与门派/魔道差异化**：正/门派中年弧强调 **门规与公务**；魔道强调 **权力与孤立**；游侠强调 **流动性、声望外溢、盟友牵连**（对齐 `arc_rf_mingyue` §4 wanderer 变体）。
4. **可读风险**：`hero_ally_pays_price` 为全弧 **唯一** 须满足 L2+L0 的高风险 moment；**禁止** 31–50 直接致死（US-004 §3.4）。
5. **最小增量**：US-021 新增 **4** 个事件 JSON（上表）；优先 **接线** `identity-hero.json`；仅当 `hero_fight_evil` 与 `hero_gray_judgment` 叙事重复时二选一。

---

## 3. 弧线五段结构

```text
[旧案重提] → [声望反噬] → [盟友代价] → [道德灰区] → [中年收束]
   31-38        33-42        36-45        38-48         45-50
```

### 3.1 推荐阅读时间线（`golden-wanderer` 主路径）

| Age | Beat | Event ID | 玩家动作 |
| ---: | --- | --- | --- |
| 31–38 | Old case | `hero_old_case_returns` | 旧案证人/仇家上门；选澄清/沉默/转嫁 |
| 33–42 | Public reputation | `hero_reputation_backlash` | 侠名招来的武林帖/官府关注；选承担/推辞/分功 |
| 36–45 | Ally cost | `hero_ally_pays_price` | 同伴/明月/旧识因你的侠名受累；选护短/切割/代偿 |
| 38–48 | Moral dilemma | `hero_gray_judgment` | 恩义与法理冲突；选守律/护人/不判 |
| 45–50 | Midlife consequence | `hero_freedom_settlement` | 自动收束；文案与 flag 汇总前四 beat |

**调度（US-021）**

- 同一 age tick **最多 1** 个本弧 route-relevant 事件；`family_crisis` 与 hero 弧 **可同段共存**（`arc_rf_mingyue` §4）。
- 31–50 内本弧 **至少 3** 事件须可达；推荐顺序上表，但允许 38–42 段 **轻微交错**（如 reputation 与 ally 同年不同 tick）。
- `golden-wanderer` 须在 US-021 后 replay 含 ≥3 个 `{hero_old_case_returns, hero_reputation_backlash, hero_ally_pays_price, hero_gray_judgment, hero_freedom_settlement}` 且 `route_wanderer` 仍为 active。

---

## 4. 事件规格（≥3）

### EV-1 `hero_old_case_returns` — Old case

| 字段 | 规格 |
| --- | --- |
| **资产** | `identity-hero.json`（新建） |
| **年龄** | 31–38 |
| **类型** | `choice`（manual） |
| **路线 gate** | `route_wanderer`；`wanderer:active`；`identity:hero`；`demonic` ∉ active |
| **属性** | `chivalry ≥ 15` |
| **前置 flag** | `hero_first_case` **required** |
| **priority/weight** | priority 82，weight 72（高于 generic midlife filler） |

**叙事**：数年前你介入的那桩「路见不平」被人翻旧账——或仇家寻仇，或无辜者因你的留名/不留名而遭牵连。

**选项（manual choice #1 — MC-1）**

| Choice ID | 文案方向 | 效果要点 | 风险 |
| --- | --- | --- | --- |
| `old_case_reveal_truth` | 公开澄清当年真相 | `reputation +8`, `chivalry +5`, `hero_old_case_truth` | 低 |
| `old_case_stay_silent` | 沉默，避免再掀波澜 | `reputation -5`, `connections +3`, `hero_old_case_silent` | 中（L1 文案：或累及无辜） |
| `old_case_redirect` | 将矛头引向他处 | `reputation +3`, `karma evil +8`, `hero_old_case_burden` | 中（L2：侠名有损） |

**Callback 读取（见 §5）**：`hero_first_case` 分支决定 **默认选项高亮** 与 `description` 变体句。

---

### EV-2 `hero_reputation_backlash` — Public reputation

| 字段 | 规格 |
| --- | --- |
| **资产** | `identity-hero.json`（新建） |
| **年龄** | 33–42 |
| **类型** | `choice`（manual） |
| **路线 gate** | 同 EV-1 |
| **属性** | `reputation ≥ 25` |
| **前置 flag** | `hero_first_case`；**至少其一**：`save_village` 或 `reputation ≥ 40` |

**叙事**：茶馆把你的事迹说成了「独行大侠」或「村民领袖」——武林盟、地方官、江湖小派纷纷递帖，自由行走的空间被声望挤压。

**选项（manual choice #2 — MC-2）**

| Choice ID | 文案方向 | 效果要点 |
| --- | --- | --- |
| `rep_accept_mantle` | 认下侠名，应帖行事 | `reputation +12`, `chivalry +8`, `hero_rep_mantle`, `connections +5` |
| `rep_decline_fame` | 推辞虚名，继续漂泊 | `reputation -8`, `connections -3`, `hero_rep_declined` |
| `rep_share_credit` | 分功给同伴与村民 | `reputation +5`, `connections +10`, `hero_rep_shared`（仅当 `save_village` + `organize_villagers` 记录时 **可用** — `altered_choice`） |

**Beat 覆盖**：本事件主责 **public reputation**；若选 `rep_accept_mantle`，提高 EV-3 触发权重（盟友更易被Targeting）。

---

### EV-3 `hero_ally_pays_price` — Ally cost

| 字段 | 规格 |
| --- | --- |
| **资产** | `identity-hero.json`（新建） |
| **年龄** | 36–45 |
| **类型** | `choice`（manual） |
| **路线 gate** | 同 EV-1 |
| **属性** | `connections ≥ 10` **或** `married` + `spouse_mingyue` |
| **前置** | 至少触发过 EV-1 或 EV-2 之一（flag 或 event_record） |

**叙事**：因你的侠名或旧案，同伴/明月/旧识被仇家或官府盯上——自由让你 **无法常伴左右**，却让他们代你承受。

**选项（manual choice #3 — MC-3；全弧高风险 moment）**

| Choice ID | 文案方向 | 效果要点 | 风险/缓解 |
| --- | --- | --- | --- |
| `ally_shield_reputation` | 以声望换他们平安（公开担责） | `reputation -15`, `chivalry +10`, `hero_ally_shielded`, 关系 +Δ | L2；缓解：自身担责无 health 扣减 |
| `ally_cut_ties` | 切割关系，让他们与你撇清 | `connections -12`, `hero_ally_abandoned`；若 `spouse_mingyue` → 关系大减 | L2；缓解：选后触发 short auto「书信致歉」减幅 |
| `ally_pay_ransom` | 倾囊/涉险营救 | `wealth -20` 或 `health -10`, `hero_ally_ransomed` | L2；缓解：`connections ≥ 20` 时解锁「江湖朋友凑份子」降 wealth 损耗 |

**US-004 对齐**：禁止致死；health 扣减 ≤ 15 且须可选低损分支；须 `ChoiceFeedbackRiskHint` severity **medium**。

---

### EV-4 `hero_gray_judgment` — Moral dilemma

| 字段 | 规格 |
| --- | --- |
| **资产** | `identity-hero.json`（新建） |
| **年龄** | 38–48 |
| **类型** | `choice`（manual） |
| **路线 gate** | 同 EV-1 |
| **属性** | `chivalry ≥ 30` |
| **前置 flag** | 至少 **`hero_old_case_*`** 或 **`hero_rep_*`** 之一 |

**叙事**：你曾受一人之恩，却发现此人现为官府通缉犯；或你曾救的村庄，如今为自保出卖过路侠客——**无人替你定义正邪**。

**选项（manual choice #4 — MC-4）**

| Choice ID | 文案方向 | 效果要点 |
| --- | --- | --- |
| `gray_uphold_law` | 守律举报/不助 | `reputation +5`（官方）, `chivalry -5`, `hero_gray_lawful` |
| `gray_shield_debtor` | 护短，瞒天过海 | `chivalry +10`, `reputation -10`, `karma good +5`, `hero_gray_debtor` |
| `gray_refuse_judge` | 拒判，抽身江湖 | `connections -5`, `hero_gray_neutral`；若 `childhood_preference=freeSpirit` 则 **额外** `comprehension +3` |

**与 `hero_fight_evil` 关系**：若保留旧事件，本事件 priority **更高**；`hero_fight_evil` 降为 optional 高 chivalry 分支，避免 35–50 双 moral 事件堆叠。

---

### EV-5 `hero_freedom_settlement` — Midlife consequence

| 字段 | 规格 |
| --- | --- |
| **资产** | `identity-hero.json`（新建） |
| **年龄** | 45–50 |
| **类型** | `auto` |
| **路线 gate** | 同 EV-1 |
| **前置** | 至少完成 **3** 个 EV-1–EV-4 中事件（event_record 或对应 flag） |
| **maxTriggers** | 1 |

**叙事分支（`text_callback` 汇总）**

| 条件组合 | 收束标题 | 写入 |
| --- | --- | --- |
| `hero_rep_declined` + `hero_ally_shielded` | 无名之侠 | `hero_midlife_reclusive`, `chivalry +5` |
| `hero_rep_mantle` + `hero_gray_lawful` | 名满江湖 | `hero_midlife_legend_seed`, `reputation +15` |
| `hero_old_case_burden` 或 `hero_ally_abandoned` | 侠名带伤 | `hero_midlife_burdened`, `connections -5` |
| `married` + `hero_ally_shielded` | 漂泊有家 | `hero_midlife_family_tether`, 关系 +Δ |
| default | 仍在路上 | `hero_midlife_ongoing` |

**路线状态**：`wanderer` 保持 **active**（不 completed）；本弧 **不** 强制 turn 至 sect/demonic。

**autoEffects**：轻量 stat；主要交付 **flag + 生命记忆（US-025）输入**。

---

## 5. Callbacks to 0–30（≥2）

| ID | 0–30 来源 | 读取字段 | 影响 midlife 机制 | Payoff 类型 |
| --- | --- | --- | --- | --- |
| **CB-1** | `sect_path_choice` @13 → `stay_wanderer` | `route_wanderer` | EV-1–EV-5 **availability**；无 flag 则不触发本弧 | `event_availability` |
| **CB-2** | `hero_first_case` @20–30 → `fight_bandits` / `help_secretly` | `hero_first_case` + choice record | EV-1 **文案**：留名→仇家认脸；不留名→无辜被疑。EV-1 `old_case_stay_silent` 在 `help_secretly` 时 **默认推荐**（altered default 文案） | `text_callback`, `altered_choice` |
| **CB-3** | `hero_save_village` @25–40 → `fight_alone` / `organize_villagers` | `save_village` + choice record | EV-2 `rep_share_credit` **解锁**；EV-2 description 区分「独行传说」vs「领路英雄」 | `text_callback`, `altered_choice` |
| **CB-4** | `hero_road_peril` @24–40 → `hero_peril_fight` / `hero_peril_retreat` | `hero_road_peril`, event_record | EV-3 开场句：硬闯→同伴伤；退避→同伴怨。EV-3 `ally_cut_ties` 在 retreat 后 **关系惩罚加倍** | `text_callback`, `relationship_change` |
| **CB-5**（可选） | `love_family_obstacle` → `love_prove` / `love_avoid` | `love_family_obstacle_done` | EV-3 若 `spouse_mingyue`：prove→「她信你」减损；avoid→「她早习惯你缺席」增损 | `text_callback`, `relationship_change` |

**US-021 必测 callback**：**CB-1** + **CB-2**（gate 与文本/选项差异）。

---

## 6. 关键玩家抉择汇总（manual choices ≥2）

| # | Event | Choice IDs | Beat | 持久写入 |
| --- | --- | --- | --- | --- |
| **MC-1** | `hero_old_case_returns` | `old_case_reveal_truth`, `old_case_stay_silent`, `old_case_redirect` | Old case | `hero_old_case_*` |
| **MC-2** | `hero_reputation_backlash` | `rep_accept_mantle`, `rep_decline_fame`, `rep_share_credit` | Public reputation | `hero_rep_*` |
| **MC-3** | `hero_ally_pays_price` | `ally_shield_reputation`, `ally_cut_ties`, `ally_pay_ransom` | Ally cost | `hero_ally_*` |
| **MC-4** | `hero_gray_judgment` | `gray_uphold_law`, `gray_shield_debtor`, `gray_refuse_judge` | Moral dilemma | `hero_gray_*` |

**Gate 最低**：MC-1 + MC-2（或任意 2 个 manual 事件）须在 `golden-wanderer` 31–50 replay 中出现。

---

## 7. Payoff 与生命记忆（US-021 / US-025 接线）

| # | 触发 | Payoff 事件 | 年龄 | 类型 |
| --- | --- | --- | ---: | --- |
| **PO-1** | MC-1 | EV-2 权重 + EV-4 文案引用「当年旧案」 | 33+ | `text_callback` |
| **PO-2** | MC-2 `rep_accept_mantle` | EV-3 触发 weight ↑ | 36+ | `event_availability` |
| **PO-3** | MC-1–MC-4 任意 ≥3 | EV-5 `hero_freedom_settlement` | 45–50 | `text_callback`, `ending_weight` seed |

**Payoff 时序（US-012 §3.2）**：midlife key choice → first payoff hard cap **15 岁**；EV-1 @31 → EV-5 @45  gap=14 **PASS**。

---

## 8. 路线规则与 US-016 边界

| 规则 | 说明 |
| --- | --- |
| **共存** | `hero` + `wanderer` **coexist**（`route-conflict-table.json`） |
| **强互斥** | `hero` + `demonic` **block**；本弧 `requirements` 须含 `demonic` not active |
| **软互斥** | `sect` + `wanderer`：已 `stay_wanderer` 且 `sect:inactive`；midlife **不** 提供 silent 回宗门 |
| **Turn** | 若未来加入「重入门派」须单独 `route_turn` 事件；**不在 US-021** |
| **仿真** | `golden-wanderer` 终态须 `wanderer:active`，`route_wanderer`，无 sect+demonic 双 active |

---

## 9. US-017 基线与 US-021 验收清单

### 9.1 当前基线（US-017）

| 样本 | Midlife events | Midlife choices | 缺口 |
| --- | ---: | ---: | --- |
| `golden-wanderer` | 19 | 12 | 无 **route-specific** midlife hero 事件；本弧待 US-021 |

### 9.2 US-021 Done 检查

- [ ] `identity-hero.json` 含 EV-1–EV-5 五事件（或 EV-4 与 `hero_fight_evil` 合并文档化）
- [ ] `golden-wanderer` 31–50 replay ≥ **3** 本弧 event id
- [ ] ≥ **2** manual choices（MC-*）
- [ ] ≥ **2** callback 可测（CB-1 + CB-2 最低）
- [ ] `hero_ally_pays_price` 含 L2 risk hint + 缓解分支
- [ ] `npm run typecheck`；deterministic 测试断言
- [ ] P3-EVAL：`finalAge=50`, `isAlive=true`

---

## 10. 非目标（US-020）

- 不实现 JSON / 引擎代码
- 不扩展 `route_beggars`、`route_official` 等非优先路线
- 不重做全局 `reputation` 公式
- 不新增 51+ `hero_become_legend` 逻辑

---

## 11. 残余风险

| 风险 | 缓解 |
| --- | --- |
| 31–50 事件窗与 `family_crisis` 竞争 | 调度 priority；参考 `arc_rf_mingyue` §7 |
| `hero_fight_evil` 与 EV-4 重复 | US-021 二选一或降权旧事件 |
| 仿真 payoff map 未覆盖 31–50 key choices | US-021 同步扩展 `golden-line-payoff-map.json` |

---

*P3 / US-020 — 2026-05-31*
