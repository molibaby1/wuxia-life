# P3 Midlife Experience and Trust Hardening — Life Memory Model (US-025)

生成时间：2026-05-31

Story：**US-025 Define Life Memory Model**

权威输入：`docs/PRD/p3-midlife-experience-and-trust-hardening.md`（US-025/026/027）、`docs/test-reports/product-experience-governance-state-field-audit.md`（US-014）、`docs/test-reports/p3-midlife-payoff-timing-rules.md`（US-012 §3.4 soft callback）、`docs/test-reports/p3-midlife-death-risk-rules.md`（US-004 §4 L0、§5）、`docs/test-reports/product-experience-governance-route-lifecycle.md`（US-009）、`src/types/eventTypes.ts`、`src/utils/playerFacingLabels.ts`、`src/data/golden-line-spine.json`、`src/data/golden-line-payoff-map.json`。

本文档冻结 **轻量 life memory** 的六类数据分类、existing state 来源、玩家可见标签与 spoiler/hidden 规则。供 **US-026（派生）**、**US-027（UI）**、**US-028（测试）** 直接引用；**不** 实现 derivation、**不** 做 UI、**不** 新增持久化字段或大型记忆系统。

---

## 1. 目的与范围

| 项 | 说明 |
| --- | --- |
| **目的** | 让玩家在 0–50 游玩中理解「我是谁、选了什么、还欠什么、有何风险、有何成就」；为 reports 与 UI 提供统一摘要 schema |
| **在 scope** | 六类 memory category；每类 state 来源与优先级；section / item 玩家标签；hidden 与 spoiler-protected 规则；US-026 目标 TypeScript shape（文档级） |
| **不在 scope** | derivation 实现（US-026）；UI 布局（US-027）；回归测试（US-028）；新 state 字段写入；全生命周期 51+ 完整历史档案 |
| **设计约束** | Summary **仅派生**、**可序列化**、**不冗余持久化**；条目 **有数据才显示**（empty category 省略，非占位符） |

### 1.1 与 payoff / death 规则的接线

| 上游规则 | life memory 用途 |
| --- | --- |
| US-012 §3.4 soft callback | key choice 条目可在 first payoff 前出现，填补 age gap |
| US-004 §4.1 L0 | 风险区承载慢性累积、失败链后置 flag |
| US-019/021/023 midlife arc spec | `*_midlife_outcome` / `*_midlife_legacy_*` 写入 achievements 或 unresolved debts |
| PXG5 player-facing labels | 禁止 raw event id / flag name 作为默认玩家文案 |

---

## 2. 总览：六类 memory category

| Category ID | 玩家 section 标题 | 一句话语义 | 典型条目上限（UI 软 cap） |
| --- | --- | --- | ---: |
| `routeStatus` | **人生路线** | 当前主路线、阶段与近期转向 | 1 主路线 + 0–1 次要路线 |
| `keyChoices` | **关键抉择** | 改变命运的手动选择及其后果摘要 | 8（按时间倒序） |
| `relationships` | **重要关系** | 师长、情缘、盟友、宿敌等 | 6 |
| `unresolvedDebts` | **未了因缘** | 尚未兑现的承诺、恩情、路线义务 | 5 |
| `risks` | **风险信号** | 玩家应知的 L0 环境与失败链预警 | 4 |
| `achievements` | **人生成就** | 已达成里程碑与中年收束 | 6 |

**排序原则（各类内部）**

1. **时间**：`occurredAtAge` 降序；同岁按 spine / payoff map 优先级。
2. ** salience**：`severity` / `status=active` 优先于 `resolved` / `historical`。
3. **路线相关**：与当前 `routeStatus.primaryRouteId` 匹配的条目优先。

---

## 3. US-026 目标 summary shape（文档级 contract）

US-026 须导出 **纯 JSON 可序列化** 结构；下列为冻结 shape（实现时放入 `src/types/` 或等价模块）。

```typescript
/** 顶层 summary；各 category 数组可省略（= 无数据） */
type LifeMemorySummary = {
  schemaVersion: '1.0.0';
  derivedAtAge: number;
  routeStatus?: LifeMemoryRouteStatus;
  keyChoices?: LifeMemoryKeyChoiceEntry[];
  relationships?: LifeMemoryRelationshipEntry[];
  unresolvedDebts?: LifeMemoryDebtEntry[];
  risks?: LifeMemoryRiskEntry[];
  achievements?: LifeMemoryAchievementEntry[];
};

type LifeMemoryVisibility = 'player' | 'hidden' | 'diagnostic';

/** 每条 entry 均含 diagnostic 供 debug/report；player 字段不得含 raw id */
type LifeMemoryEntryBase = {
  id: string;              // stable slug for tests; NOT shown in default UI
  visibility: LifeMemoryVisibility;
  occurredAtAge?: number;
  sortKey: number;         // derivation-only ordering
};

type LifeMemoryRouteStatus = {
  primary: { routeId: string; name: string; phase: string };
  secondary?: { routeId: string; name: string; phase: string };
  factionLabel?: string;   // e.g. 传统门派
  lastTransition?: { label: string; age?: number }; // player-facing only
  diagnostic: {
    routeStates: Record<string, { lifecycle: string; lockedIn: boolean }>;
    activeRouteFlags: string[];
  };
};

type LifeMemoryKeyChoiceEntry = LifeMemoryEntryBase & {
  label: string;           // player-facing
  consequence?: string;    // 可选一句后果
  payoffStatus?: 'pending' | 'echoed' | 'resolved';
  diagnostic: { eventId: string; choiceId?: string; durableWrites: string[] };
};

type LifeMemoryRelationshipEntry = LifeMemoryEntryBase & {
  name: string;
  roleLabel: string;       // e.g. 师长、情缘
  statusLabel: string;     // e.g. 亲近、疏远、已婚
  affinityBand?: 'close' | 'neutral' | 'strained' | 'hostile';
  diagnostic: { relationId: string; affinity?: number };
};

type LifeMemoryDebtEntry = LifeMemoryEntryBase & {
  label: string;
  urgency?: 'low' | 'medium' | 'high';
  diagnostic: { sourceFlags: string[]; sourceFields: string[] };
};

type LifeMemoryRiskEntry = LifeMemoryEntryBase & {
  label: string;
  severity: 'low' | 'medium' | 'high';
  warningLevel: 'L0' | 'L1'; // life memory 仅 surfacing L0/L1 ambient；L2/L3 留在 choice 当下
  diagnostic: { sourceFlags: string[]; statSignals: string[] };
};

type LifeMemoryAchievementEntry = LifeMemoryEntryBase & {
  label: string;
  category?: 'route' | 'martial' | 'social' | 'family' | 'moral';
  diagnostic: { achievementId?: string; sourceFlags: string[] };
};
```

**US-026 硬性要求（摘自 PRD FR-11）**

- `label` / `name` / `phase` 等 **player 字段** 不得为 raw `eventId`、`choiceId`、未映射 flag key。
- `diagnostic` 块可含 raw id，**默认 UI 不渲染**（US-027）。
- Summary 每次从 `GameState` 计算；**不** 写入 save 除非现有架构强制（当前 **否**）。

---

## 4. Category 规格

### 4.1 Route status（人生路线）

#### 语义

玩家当前 **主人生路线**、lifecycle 阶段、门派倾向，以及（若有）次要并存路线。

#### State 来源（按读取优先级）

| 优先级 | 字段 / 模块 | 用途 |
| ---: | --- | --- |
| 1 | `state.routeStates` | canonical lifecycle：`sect` / `wanderer` / `demonic` / `hero` 等 |
| 2 | `state.flags.route_*` | `route_orthodox` / `route_wanderer` / `route_demonic` 等；routeStates 缺失时回退 |
| 3 | `state.flags.sect_faction` | 门派倾向：`orthodox` / `unconventional` / `neutral` |
| 4 | `state.routeHistory[]` | 最近一次 **玩家可见** 转向摘要（非完整 trail） |
| 5 | `getPlayerRouteSummary(state)` | 复用 `playerFacingLabels.ts` 的 name + phase |
| 6 | `state.lifePath.faction` | legacy-compatible；仅当 sect_faction 与 routeStates 皆空 |
| 7 | `state.player.sect` | **不用于** 新 derivation（suspected-deprecated）；diagnostic 对照 only |

#### Lifecycle → 玩家 phase 标签

复用 `lifecyclePhaseLabel()`：

| `RouteLifecycleState` | 玩家 phase |
| --- | --- |
| `inactive` | 未入门 |
| `temporary`, `active` | 路线进行中 |
| `locked_in` | 已承诺 |
| `turned` | 已转向 |
| `completed` | 已完成 |
| `failed` | 已失败 |

#### RouteId → 玩家 name

复用 `ROUTE_DISPLAY_NAMES` / `formatRouteLabel()`：

| routeId / flag | 玩家 name |
| --- | --- |
| `sect`, `route_orthodox` | 正道门派 |
| `wanderer`, `route_wanderer`, `route_border` | 流浪侠客 |
| `demonic`, `route_demonic` | 魔道 |
| `hero` | 侠义之路 |
| `official`, `route_official` | 仕途 |
| `beggars`, `route_beggars` | 丐帮 |
| `merchant` | 商路 |
| `hermit` | 隐逸 |

#### 主 / 次路线选取规则

1. **Primary**：`PRIORITY_ROUTE_IDS`（`sect`, `wanderer`, `demonic`）中第一个 lifecycle ≠ `inactive` 的项。
2. 若无 priority active，取任意 lifecycle ∈ `{active, locked_in, temporary}` 的 routeStates 条目。
3. **Secondary**：另一条 lifecycle ≠ `inactive` 且与 primary **coexist** 允许的路线（如 `hero` + `wanderer`）；hard exclusion 并存时 **仅显示 primary**，contradiction 记入 diagnostic。

#### Hidden / spoiler

| 内容 | 可见性 |
| --- | --- |
| `sourceEventId`, `reason`, 完整 `routeHistory` | diagnostic |
| 未触发的候选路线（仍为 inactive） | **隐藏**（不预告「你可能走魔道」） |
| 路线冲突解析中间态 | diagnostic |
| 未来 `turn` 目标路线 | **隐藏** |

---

### 4.2 Key choices（关键抉择）

#### 语义

玩家 **手动选择** 且写入 durable state 的 spine-critical 决策；含 0–30 golden line 与 31–50 midlife arc manual choices。

#### State 来源

| 优先级 | 字段 / 数据源 | 用途 |
| ---: | --- | --- |
| 1 | `golden-line-spine.json` → `keyChoiceEventIds` | 权威 key choice 事件集合 |
| 2 | `golden-line-payoff-map.json` → `entries[]` | durableWrites、payoff 链、midlife MC |
| 3 | `state.eventHistory[]` | `eventId` + `selectedChoice` + `age`：确认 **已发生** |
| 4 | `state.criticalChoices` | 结构化关键抉择（若已写入） |
| 5 | `state.flags` | durable write 验证（如 `route_orthodox`, `hero_old_case_truth`） |
| 6 | `state.routeHistory[]` | route_change 类 payoff 的 age 锚点 |

**纳入条件（须同时满足）**

1. 事件 id ∈ spine `keyChoiceEventIds` **或** payoff map 条目 **或** midlife arc spec 声明的 MC-*。
2. `eventHistory` 中存在该 `eventId` 且含 `selectedChoice`（auto-only 不算）。
3. 对应 durable write 至少一项在 `flags` / `routeStates` / `criticalChoices` 中可观测 **或** map 声明为 key choice。

**排除**

- 仅触发未选择的 event。
- 纯 stat 波动、无 durable write 的 daily 事件。
- spine `manualChoiceEventIds` 中 **未** 列入 keyChoiceEventIds 且 map 未声明者（除非 midlife MC）。

#### 玩家 label 规则

**禁止** 直接使用 `eventId` / `choiceId`。US-026 须通过 **冻结映射表** 或 choice 存档时的 `text` 快照生成 `label`。

##### 0–30 spine key choices（冻结默认 label）

| eventId | choiceId 模式 | 玩家 label（示例） |
| --- | --- | --- |
| `childhood_preference` | `focus_on_study` | 儿时专心向学 |
| | `play_outside` | 儿时偏爱游玩 |
| | `balance_both` | 儿时文武兼修 |
| `martial_arts_enlightenment` | `external_focus` / `internal_focus` / `agile_path` / `balanced_start` | 武学取向：外功 / 内功 / 轻功 / 均衡 |
| `sect_path_choice` | `join_orthodox` | 拜入正道门派 |
| | `stay_wanderer` | 选择行走江湖 |
| `orthodox_trial_entry` | `*` | 入门试炼：{选项摘要} |
| `orthodox_trial_service` | `*` | 试炼中：{选项摘要} |
| `demonic_encounter` | accept 类 | 接受魔道诱惑 |
| | reject 类 | 拒绝魔道诱惑 |
| `demonic_power_struggle` | usurp / renounce 类 | 魔道权争：{选项摘要} |
| `sect_trial_final` | `*` | 门派终试：{选项摘要} |
| `hero_first_case` | `*` | 侠路首案：{选项摘要} |

##### 31–50 midlife key choices（冻结 event → 默认 section 前缀）

| eventId | 默认 label 前缀 |
| --- | --- |
| `sect_midlife_faction_pressure` | 中年门派派系抉择 |
| `sect_midlife_gray_mission` | 中年门派灰任务 |
| `hero_old_case_returns` | 旧案重审 |
| `hero_reputation_backlash` | 名声反噬 |
| `hero_ally_pays_price` | 盟友代价 |
| `hero_gray_judgment` | 灰色审判 |
| `demonic_midlife_expansion` | 魔道扩张 |
| `demonic_midlife_betrayal` | 魔道背叛之局 |
| `demonic_midlife_fork` | 魔道岔路：救赎或加码 |
| `demonic_midlife_consequence` | 魔道中年收束 |

**consequence 字段**：若存在 outcome flag（如 `hero_old_case_truth`），生成一句 **已发生后果**（如「你选择说出旧案真相」），仍不用 raw id。

#### Payoff status（可选字段）

| 值 | 条件 |
| --- | --- |
| `pending` | map 声明 payoff，但 replay 尚无对应 payoff event / flag echo |
| `echoed` | 已有 soft callback（本 summary 已列出）或 first payoff 已发生 |
| `resolved` | midlife outcome / ledger done flag 已设置 |

引用 US-012 §3.4：life memory 条目本身可充当 soft callback。

#### Hidden / spoiler

| 内容 | 可见性 |
| --- | --- |
| 未发生的 key choice | **隐藏** |
| 未选择分支的文案 | **隐藏** |
| `eventId`, `choiceId`, `durableWrites` | diagnostic |
| 依赖 hidden event 的未来 payoff 预告 | **隐藏** |

---

### 4.3 Relationships（重要关系）

#### 语义

对当前叙事有显著影响的 NPC / 家庭关系。

#### State 来源

| 优先级 | 字段 | 用途 |
| ---: | --- | --- |
| 1 | `state.player.relationships[]` | `id`, `role`, `name`, `affinity`, `status` |
| 2 | `state.relations` | 旧式 id → 数值；与 relationships 合并去重 |
| 3 | `state.player.spouse` | 非空 → 生成「配偶」条目 |
| 4 | `state.player.children` | `> 0` → 生成「子女」汇总条目 |
| 5 | `state.lifePath.relationships` | `allies`, `enemies`, `mentors`, `disciples` id 列表 |
| 6 | 关系 flag | `married`, `spouse_mingyue`, `has_master`, `has_sworn_siblings`, `lover_mingyue` 等 |

#### Role → 玩家 roleLabel

| `Relationship.role` / 来源 | roleLabel |
| --- | --- |
| `master` | 师长 |
| `lover` | 情缘 |
| `sworn` | 义兄弟 |
| `rival` | 对手 |
| `friend` | 友人 |
| `family` | 家人 |
| `enemy` | 宿敌 |
| `patron` | 恩人 |
| spouse 字段 | 配偶 |
| children 汇总 | 子嗣 |

#### Affinity → statusLabel

| affinity 区间 | statusLabel |
| --- | --- |
| ≥ 60 | 亲近 |
| 20 – 59 | 和睦 |
| −19 – 19 | 平淡 |
| −59 – −20 | 疏远 |
| ≤ −60 | 敌对 |

#### 纳入 / 排除

- **纳入**：affinity 绝对值 ≥ 20，或 role ∈ `{lover, master, spouse, family, enemy}`，或 lifePath 列表中的 id。
- **排除**：仅出现一次且无 flag 支撑的路人；affinity 接近 0 的泛泛「友人」。

#### Hidden / spoiler

| 内容 | 可见性 |
| --- | --- |
| `relationId` | diagnostic |
| 尚未见面的「未来情缘」flag | **隐藏** |
| 未触发事件的 NPC 名 | **隐藏** |

---

### 4.4 Unresolved debts（未了因缘）

#### 语义

玩家 **已知** 但尚未兑现的承诺、恩情、路线义务或 midlife 待收束项。

#### State 来源

| 信号类型 | 字段 / flag | 未了判定 | 玩家 label（示例） |
| --- | --- | --- | --- |
| 救命恩情 | `flags.has_life_debt == true` | flag 仍 true | 尚欠救命之恩 |
| 灰色庇护 | `flags.hero_gray_debtor == true` | 未 unset 且无 `hero_gray_*` 收束 | 灰色案中的庇护之债 |
| 魔道清算链 | `flags.demonic_usurp_failed` | 且非 `demonic_midlife_consequence_done` | 夺位失败后清算阴影 |
| 路线承诺 | `lifePath.commitments.mustProtect[]` | 列表非空 | 誓守之人：{name} |
| 路线约束 | `lifePath.commitments.swornEnemies[]` | 列表非空 | 未了的宿怨 |
| 入门约束 | `lifePath.commitments.cannotJoin[]` | 与当前 turn 意图冲突时 | 此前立誓不入：{org} |
| 门派中年 ledger | `route_orthodox` + 有 midlife beat flags 但 **无** `sect_midlife_ledger_done` | age ≥ 40 | 师门中年账尚未清 |
| 游侠收束 | wanderer active + ≥3 `hero_midlife_beat_*` 但 **无** `hero_freedom_settlement_done` | age ≥ 43 | 江湖路仍未定收束 |
| 魔道收束 | `demonic_midlife_fork_done` 且 **无** `demonic_midlife_consequence_done` | age ≥ 44 | 魔道中年后果未落锤 |

**resolved 判定**：对应 unset flag、`relationship_debt_return` 类回报事件已触发、或 midlife `*_done` / `*_outcome` 已写入 → **移出** unresolved，必要时转入 achievements。

#### urgency 规则

| urgency | 条件 |
| --- | --- |
| `high` | 失败链 flag（`demonic_usurp_failed`）+ age ≥ 35；或 US-004 认定的 L0 失败链后置 |
| `medium` | midlife arc 已启动但未 ledger / consequence |
| `low` | `has_life_debt` 等可延迟恩情 |

#### Hidden / spoiler

| 内容 | 可见性 |
| --- | --- |
| 玩家从未触发过的 debt 来源 event | **隐藏** |
| `cannotJoin` 未暴露给玩家的约束 | **隐藏** |
| 具体 payoff event 名称 | **隐藏** |

---

### 4.5 Risks（风险信号）

#### 语义

US-004 **L0 环境/状态预警** 与慢性失败链；供玩家在 **下一次** 高风险事件前感知，**不** 重复 L2/L3 选项级预警。

#### State 来源

| 信号 | 来源 | severity | 玩家 label（示例） |
| --- | --- | --- | --- |
| 低体低质 | `player.health` < 40 或 `player.constitution` < 50 | medium | 身子正虚，宜静养 |
| 早夭池 L0 | age 18–40, constitution < 80 | low | 命途多舛，需养精蓄锐 |
| 魔道夺位失败 | `flags.demonic_usurp_failed` | high | 夺位失败后余波未平 |
| 魔道清洗压力 | `flags.demonic_midlife_purge` 或 `demonic_ending_purge` 链 active | high | 门内清算风险未解 |
| 门派公审压力 | `flags.sect_midlife_judgment_pending` 类（若存在） | medium | 师门公审将至 |
| 声誉危机 | `reputation` < −20 或 setback reputation 类 flag | medium | 声名狼藉，行事多阻 |
| 侠义失衡 | `chivalry` < −30 且 `route_demonic` | medium | 魔念渐深，正道难容 |
| 焦虑/疲累 | `player.lifeStates.anxiety` ≥ 70 或 `fatigue` ≥ 70 | low | 心事重重 / 身心俱疲 |

**不含**

- 单次 L2/L3 choice `riskHints`（属于 choice feedback 当下，非 memory 区常驻）。
- `deathProbability`、setback 内部 `baseRate`、权重 — diagnostic only。
- 51+ forced ending 预告 — **hidden**（spoiler）。

#### warningLevel

life memory 风险区 **仅 surfacing `L0` 与 persistent `L1` ambient**（见 US-004 §4.1）。

#### Hidden / spoiler

| 内容 | 可见性 |
| --- | --- |
| 具体致死 event 名 | **隐藏** |
| 未触发的 demonic purge 链（玩家尚无 failed flag） | **隐藏** |
| ENG-01 精确概率 | diagnostic |

---

### 4.6 Achievements（人生成就）

#### 语义

已完成的里程碑、路线收束与身份认可；与 unresolved debts **互斥**（同一 flag 不可同时出现在两类）。

#### State 来源

| 优先级 | 字段 / flag | 用途 |
| ---: | --- | --- |
| 1 | `state.achievements[]` | 顶层成就 id 列表 |
| 2 | `state.lifePath.achievements[]` | lifepath 成就 |
| 3 | `state.identity.achievements[]` | 身份成就 |
| 4 | Midlife outcome flags | 见下表 |
| 5 | 关系 / 家庭里程碑 | `married`, `children > 0`, `lover_mingyue` 等 |
| 6 | 路线 completion | `routeStates.*.lifecycle === 'completed'` |

##### Midlife outcome → 玩家 label（冻结）

| flag / 值 | 玩家 label |
| --- | --- |
| `sect_midlife_outcome=upright_guardian` | 中年守正，清誉如山 |
| `sect_midlife_outcome=sect_enforcer` | 中年掌刑，门规铁面 |
| `sect_midlife_outcome=hidden_mercy` | 中年暗施慈悲 |
| `sect_midlife_outcome=weary_steward` | 中年倦守山门 |
| `sect_midlife_outcome=steadfast_elder` | 中年长老，定海神针 |
| `hero_midlife_reclusive` | 退隐江湖 |
| `hero_midlife_legend_seed` | 侠名渐起 |
| `hero_midlife_burdened` | 负侠名而行 |
| `hero_midlife_family_tether` | 以家为锚 |
| `hero_midlife_ongoing` | 侠路未绝 |
| `demonic_midlife_legacy_rule` | 魔道立规 |
| `demonic_midlife_legacy_withdraw` | 金盆洗手 |
| `demonic_midlife_legacy_exile` | 远遁割席 |

##### 通用 achievement id → label（示例，US-026 可扩展 map）

| achievementId | label |
| --- | --- |
| `save_village` | 拯救村庄 |
| `defeat_bandits` | 击退匪患 |
| `sect_trial_completed` | 通过门派试炼 |
| `orthodox_trial_completed` | 完成正道试炼 |

#### category 推断

| 来源模式 | category |
| --- | --- |
| `sect_midlife_*`, route completed | `route` |
| martial / trial flags | `martial` |
| spouse / children / lover | `family` |
| reputation / connections | `social` |
| chivalry / karma / gray judgment | `moral` |

#### Hidden / spoiler

| 内容 | 可见性 |
| --- | --- |
| 未达成成就的条件提示 | **隐藏** |
| `achievementId` raw | diagnostic |
| 隐藏结局专属 achievement | 达成前 **hidden** |

---

## 5. 玩家可见 section 与空态

| Section | 空态行为 |
| --- | --- |
| 人生路线 | 显示 `{ name: '未定', phase: '未入门' }`（与 `getPlayerRouteSummary` 一致） |
| 其余五类 | **整 section 省略**（不占位、不写「暂无」） |

**US-027 最小 UI** 建议顺序：人生路线 → 风险信号 → 未了因缘 → 关键抉择 → 重要关系 → 人生成就（风险与债务优先服务 trust 目标）。

---

## 6. Hidden 与 spoiler-protected 总表

| 规则 ID | 规则 |
| --- | --- |
| **VIS-01** | 默认 UI 仅渲染 `visibility: 'player'` 字段 |
| **VIS-02** | `diagnostic` 块仅供 debug 面板、simulation report、US-028 断言 |
| **VIS-03** | 不得展示 raw `eventId`, `choiceId`, 未映射 flag key |
| **VIS-04** | 不得预告未触发路线、未见面 NPC、未解锁 midlife 事件 |
| **VIS-05** | 不得展示未来分支差异（「若选另一项将…」） |
| **VIS-06** | 隐藏结局、late-life forced ending 相关成就/风险，直至触发或 age ≥ 触发窗 |
| **VIS-07** | 双轨 legacy 字段（`player.sect`, `*_path` flags）不生成 player label；仅 diagnostic |
| **VIS-08** | 路线 hard exclusion 同时 active 时，player 侧只显示 primary；完整快照见 diagnostic |

---

## 7. Main-flow vs legacy 字段策略

与 US-014 state-field-audit 对齐：

| 分类 | 字段 | life memory 用法 |
| --- | --- | --- |
| **main-flow** | `routeStates`, `route_*`, `sect_faction`, `identity.*`, `karma.*`, `criticalChoices`, `relations`, `player.relationships`, `eventHistory`, `achievements` | 优先使用 |
| **legacy-compatible** | `lifePath.*`, `player.sect` | 仅 main-flow 缺失时回退；diagnostic 标注 `legacySource` |
| **suspected-deprecated** | `*_path` flags | 不生成新条目；不写入 label |

---

## 8. 交接清单

### US-026 Implement Life Memory Summary Data

1. 实现 `deriveLifeMemorySummary(state: GameState): LifeMemorySummary`（命名可调整，shape 不变）。
2. 复用 / 扩展 `playerFacingLabels.ts`；新增 `lifeMemoryLabels.ts` 存放 §4 冻结映射。
3. key choice 映射与 payoff status 读取 `golden-line-spine.json` + `golden-line-payoff-map.json`。
4. 单元测试前置：至少覆盖 §4 每类 1 条（US-028 正式落地）。

### US-027 Display Minimum Life Memory View

1. 消费 `LifeMemorySummary`；不直接读 raw state。
2. 遵循 §5 section 顺序与空态。
3. `diagnostic` 仅 debug 模式（`debugAccess`）展示。

### US-028 Add Life Memory Regression Coverage

1. 断言 route / key choice / relationship / debt / risk 各 ≥1 条（PRD US-028）。
2. 断言 player label 不含 spine event id 字符串。

---

## 9. 非目标（本 story）

- 不实现 derivation 模块。
- 不修改 gameplay UI。
- 不新增 GameState 字段。
- 不定义 51+ 全量人生档案或云同步。

---

## 10. 验收对照

| Acceptance criterion | Status |
| --- | --- |
| 定义六类 memory category | done — §2、§4 |
| 定义每类 existing state 来源 | done — §4 各「State 来源」 |
| 定义 player-facing labels | done — §2 section 标题、§4 label 表、§5 |
| 定义 hidden / spoiler-protected | done — §4 各小节、§6 |
| Typecheck passes | 见 §11 |

---

## 11. 验证

本 story **仅产出 spec**，无业务代码变更。验证命令：

```bash
npm run typecheck
```

预期：与 US-025 实施前一致（pass）。

---

*US-025 交付 — 2026-05-31*
