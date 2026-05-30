# P3 Midlife Experience and Trust Hardening — Romance/Family Sample Arc (US-008)

生成时间：2026-05-31

Story：**US-008 Define Romance and Family Sample Arc**

权威输入：`docs/PRD/p3-midlife-experience-and-trust-hardening.md`、`docs/test-reports/p3-midlife-romance-family-availability-audit.md`（US-007）、`docs/test-reports/p3-midlife-trust-targets.md`（US-002）、`src/data/lines/love.json`、`src/data/lines/family-life.json`。

本文档定义 **一条** 可在 31–50 前后走完情感里程碑的样例弧线，供 **US-009** 实现、**US-010** 确定性样本与 gate 成就对齐。**不实现事件、不修改业务代码。**

---

## 1. 摘要

| 项 | 定义 |
| --- | --- |
| **Arc ID** | `arc_rf_mingyue`（明月情契） |
| **核心角色** | `lover_mingyue` / 明月（复用 runtime 恋爱链，不新增主要 NPC） |
| **年龄窗口** | 相遇 15–22；信任与冲突 16–32；成家 20–30；中年后果 **31–50** |
| **可选性** | 全程无 `route_*` 硬门槛；`love_first_meet` 可拒绝；不成家仍可通关 0–50 |
| **成就对齐** | US-009 须在成家/生育效果中写入 `player.spouse` / `player.children`（修复 US-007 **RF-01**） |
| **优先路线** | 正/门派、游侠、魔道 **共用 spine**，三条 **变体 beat** 在冲突与中年后果段分叉 |

**对 US-007 断点的设计回应**

| 断点 | 本 arc 规格中的处理 |
| --- | --- |
| RF-01 状态面断裂 | §6 统一「成家」状态面；US-009 实现 |
| RF-02 20–30 调度错过 | §7 `family_marriage` 保底调度策略 |
| RF-03 模拟器不选明月 | §8 P3-RF 样本选择策略 |
| RF-04 恋爱结局与婚姻并行 | 本 arc **以 `family_marriage`（迎娶明月）为 commitment 主轴**，恋爱结局事件不替代 achievement |
| RF-05 backlog 未加载 | 不依赖 `love-mature` / `love-marriage-conflict`；31–50 用现有 `family_crisis` + 路线变体文案（US-009 补丁） |

---

## 2. 设计原则（与 PRD 对齐）

1. **非必选**：玩家可只触发 `love_first_meet` 后走「保持距离」，或成家后不再触发子女/危机；gate 只要求 P3-EVAL 中 **至少一条** 路径可达（US-002）。
2. **情感可读**：每个阶段有玩家可见状态（关系好感、flag、choice feedback），中年段须 **回调** 早先关键抉择（US-012 payoff 类别：文本回调、选项变化、关系/风险变化）。
3. **路线共存**：魔道不禁止恋爱，但增加 **代价与冲突**；正/门派对 **门规与公务** 施压；游侠对 **长期缺席与江湖名望** 施压。
4. **最小增量**：优先 **调整/接线** 现有 29 个 runtime 事件；US-009 最多新增 **1** 个 midlife 变体事件（见 §5.5），仅在 `family_crisis` 路线分叉不足时启用。

---

## 3. 弧线五段结构

```text
[相遇] → [信任成长] → [冲突] → [承诺或分离] → [中年后果]
 15-22     16-28        19-32      20-35           31-50
```

### 3.1 阶段总表

| 阶段 | 年龄 | 叙事目标 | 主事件（现有 ID） | 类型 |
| --- | ---: | --- | --- | --- |
| **Meeting** | 15–22 | 建立可选情感线 | `love_first_meet` | choice |
| **Trust growth** | 16–28 | 累积信任与 `love_started` | `love_after_greet`, `love_shared_mission`, `love_secret_help` | auto |
| **Conflict** | 19–32 | 外部阻力与误解 | `love_family_obstacle`, `love_misunderstanding`, 路线变体（§4） | choice |
| **Commitment or separation** | 20–35 | 成家或情断 | `family_marriage`, `love_separation` / `love_reunion`（分离支） | choice |
| **Midlife consequence** | 31–50 | 家庭与人生路线张力 | `family_child_born`, `family_child_education`, `family_crisis`, `spouse_mingyue_daily` | choice / auto |

### 3.2 推荐阅读时间线（明月承诺支）

| Age | Phase | Event ID | 玩家动作 |
| ---: | --- | --- | --- |
| 15–18 | Meeting | `love_first_meet` | 选「上前搭话」或「施展魅力」→ `love_started` |
| 16–20 | Trust | `love_after_greet` → `love_shared_mission` | 自动推进；好感累积 |
| 20–24 | Conflict | `love_family_obstacle` | 选「证明自己」或「暂避风头」 |
| 22–28 | Trust | `love_secret_help`（可选） | 澄清误解链 |
| 24–30 | Commitment | `family_marriage` | 选 **迎娶明月** → `spouse_mingyue`, `married` |
| 26–35 | Family | `family_child_born` | 选庆祝/照料方式 → `has_child` |
| 31–45 | Midlife | `family_child_education` | 子女培养方向（若已有子） |
| 35–50 | Midlife | `family_crisis` | 家族/伴侣危机；路线变体文案（§4） |
| 21–50 | Ongoing | `spouse_mingyue_daily` | 已婚明月日常（侠义/声望小幅） |

**分离支（仍算 arc 完成的一种终态，但 P3-RF 主样本不采用）**：`love_separation` → 不触发 `family_marriage` 或选门当户对 → `mingyue_married_other`；中年 `family_crisis` 弱化为「旧情」回调（US-009 文案）。

---

## 4. 三条优先路线变体

共用条件：已 `love_started`；无 `married` 时进入冲突段；`family_marriage` 窗口 **20–30** 须保底触发（§7）。

| 路线 | 活跃 flag（典型） | 冲突段变体 | Commitment 压力 | 31–50 中年后果变体 |
| --- | --- | --- | --- | --- |
| **Orthodox / sect** | `route_orthodox`, `sect` | `love_family_obstacle` 文案强调门规与师门任务；可选插入 `sect-shaolin` 已有 +4 明月好感作辅线 | 门派对「私情」：`family_marriage` 选项加 **声望/门规** 风险反馈；选明月 → `marriage_type_love` + 后续 `family_crisis` 出现「师门召你回山，明月守家」 | `family_crisis`：倾尽家财 vs 量力而行 → 影响 `reputation` 与门规 flag；`spouse_mingyue_daily` 侠义加成与正派身份一致 |
| **Wandering hero** | `route_wanderer`, `hero` | `love_family_obstacle` 强调漂泊无依；**RF-02 修复**：20–30 须挤出 `family_marriage` | 长期江湖案与成家冲突：`family_marriage` 选明月后，`hero_first_case` 类事件与家庭事件 **同窗口竞争** 时 marriage **优先一次**（调度规则 §7） | `family_crisis`：江湖仇家牵连家小；选倾尽家财 → 侠名+家庭牵绊；缺席路线 → 关系好感下降（`lover_mingyue` delta） |
| **Demonic path** | `route_demonic`, `demonic` | **`love_demonic_conflict`**（现有）：救赎 vs 魔道加深 | 选明月需 **`!love_choose_demonic` 或事后赎罪 flag** 方可 `spouse_mingyue`；否则引导分离支或 arranged 婚姻 | `family_crisis` 魔道版：魔教任务 vs 护家；选魔道加深 → 明月好感大减、**不写入 achievement** 除非已分离； redemption 分支可保留配偶 |

**路线互斥**：本 arc **不** 要求玩家同时激活 sect 与 demonic；遵循 `route-conflict-table.json` strong_exclusion（US-016）。

---

## 5. 关键玩家抉择（≥3）

以下三条为 **US-009 / US-010 必须稳定可测** 的 key choices；均写入 `criticalChoices` 或 choice feedback（与 golden-line payoff 机制一致）。

| # | Event | Choice ID | 阶段 | 持久写入 | 设计意图 |
| --- | --- | --- | --- | --- | --- |
| **KC-1** | `love_first_meet` | `love_greet` 或 `love_charm`（拒绝用 `love_pass`） | Meeting | `love_started`, `lover_mingyue` +Δ | 开启情感线；`love_pass` 为合法跳过（非本 arc 主路径） |
| **KC-2** | `love_family_obstacle` | `love_prove` vs `love_avoid` | Conflict | `love_family_obstacle_done`, 好感 ± | 证明诚意 vs 逃避；影响后续 `family_marriage` 明月选项可用性与对话 |
| **KC-3** | `family_marriage` | **迎娶明月**（`marry_mingyue` 语义选项）vs 门当户对 / 自由恋爱 | Commitment | `married`, `spouse_mingyue`, `marriage_type_love`；**+ `player.spouse`**（US-009） | 成就主轴；门当户对为对照支（RF-03 避免在 P3-RF 默认选择） |

**可选第四抉择（中年，不计入 KC 最低三条，供 US-010 报告）**

| Event | Choice | 写入 |
| --- | --- | --- |
| `family_crisis` | 倾尽家财 / 量力而行 / 置身事外（若有第三选项） | 家庭牵绊、财富、路线相关声望 |

---

## 6. 后续 Payoff（≥2）

| # | 触发关键抉择 | Payoff 事件 | 年龄 | Payoff 类型 | 玩家可见结果 |
| --- | --- | --- | ---: | --- | --- |
| **PO-1** | KC-3 迎娶明月 | `family_child_born` | 25–40 | 事件可用性 + 状态 | 需 `married`；选项文本区分「隆重庆祝」与「亲自照料」；**`player.children` 递增**（US-009） |
| **PO-2** | KC-3 + PO-1 | `family_crisis` | 35–50 | 文本回调 + 选项变化 | `spouse_mingyue` 时标题/正文提及明月与子女；sect/wanderer/demonic **变体句**（§4）；反馈引用 KC-2（曾证明/曾逃避） |
| **PO-3**（辅助） | KC-3 | `spouse_mingyue_daily` | 21–50 | 关系/属性小幅 echo | 已婚日常；强化「游戏记得你娶了明月」 |

**Payoff 时序（对齐 US-012 草案）**：KC-3 → PO-1 建议 ≤10 年；KC-3 → PO-2 建议 5–25 年（中年段）。

---

## 7. 调度与可达性（US-009 必做）

### 7.1 `family_marriage` 保底（RF-02）

对 **P3-GL** 的 `golden-wanderer`、`golden-demonic` 与 P3-RF 样本：

| 规则 | 说明 |
| --- | --- |
| **窗口** | 角色年龄进入 20–30 且 `!married` 且（`love_started` **或** P3-RF 强制策略） |
| **优先级** | 在 20–30 内至少 **1 次** 将 `family_marriage` 提升至路线竞争胜出（`priority` ≥ 当前占满窗口的路线事件，或 golden-line spine 预留 slot） |
| **失败判定** | 50 岁前未触发 `family_marriage` 且样本策略为 romance-primary → deterministic fail |

### 7.2 成就字段（RF-01）

在 `family_marriage`（各选项）与 `family_child_born`（各选项）效果中增加（或通过统一 effect）：

```text
player.spouse = { id: "lover_mingyue", name: "明月", ... }   // 迎娶明月支
player.children += 1   // 生育支
```

`romance_family_achievement_rate` 继续读 `statistics.spouse || statistics.children > 0`（US-002）。

### 7.3 并行叙事（RF-04）

- `love_ending_good` 等结局 **不** 作为 P3 achievement 主路径；若已 `spouse_mingyue`，保持现有 `!spouse_mingyue` 门槛，避免双轨成家。
- 实现时：**先** `family_marriage` 迎娶明月，**再** 开放中年家庭链。

---

## 8. 确定性样本策略（US-010 预置）

| 样本 ID | 目的 | 选择策略 |
| --- | --- | --- |
| `golden-romance-family`（P3-RF） | 情感线主样本；**必须** achievement | KC-1 搭话；KC-2 `love_prove`；KC-3 **迎娶明月**；PO-1 任选；50 岁存活 |
| `golden-sect` | 证明正/门派路线可达 | 同上或至少 KC-3 明月 + PO-1；允许其他路线事件共存 |
| `golden-wanderer` | 修复 RF-02 | 强制 §7.1 保底 + 明月婚姻 |
| `golden-demonic` | 魔道共存 | KC-1 + `love_demonic_conflict` 选 redemption 侧；再 KC-3 明月 |

**模拟器关系倾向（RF-03）**：在 `family_marriage` 节点，若 `love_started` 且样本为 P3-RF / romance-tagged，**不得** 默认选「门当户对」；应选 **迎娶明月**。

---

## 9. US-009 实现清单（交接）

按优先级排序，超出本表须回 US-008 变更 arc spec。

1. **RF-01**：`family_marriage` / `family_child_born` 写入 `player.spouse` / `player.children`。
2. **RF-02**：wanderer/demonic（及 beggars 若纳入）20–30 `family_marriage` 保底调度。
3. **RF-03**：P3-RF 与 romance-tagged 样本在 `family_marriage` 选明月。
4. **路线变体**：`family_crisis`（及可选 `family_child_education`）正文按 §4 三分支；可用 `triggerConditions.expression` + 路线 flag。
5. **Choice feedback**：为 KC-1/2/3 注册 key choice id，供 PO-1/2 仿真 payoff 统计。
6. **Manifest**：将本 arc 主链事件从 `candidate`/`broken` 提升至 **`active`**（至少：`love_first_meet`, `love_family_obstacle`, `family_marriage`, `family_child_born`, `family_crisis`）。
7. **可选新增**（仅当变体文案无法塞进 PO-2）：`family_crisis_sect` / `_wanderer` / `_demonic` 三选一轻量事件，年龄 35–50，互斥触发。

**不在 US-009**：加载 `love-mature.json` / `love-marriage-conflict.json` backlog（RF-05）。

---

## 10. US-010 报告字段（预置）

样本终态报告须包含：

| 字段 | 说明 |
| --- | --- |
| `arc_id` | `arc_rf_mingyue` |
| `arc_outcome` | `completed` \| `separated` \| `skipped` \| `failed` |
| `key_choices` | KC-1..3 是否触发及选项 id |
| `relationship` | `lover_mingyue` 好感终值 |
| `achievement` | `spouse` / `children` 是否满足 gate |
| `payoffs_hit` | PO-1, PO-2, PO-3 布尔 |

---

## 11. 非目标（本 story）

- 不编写或修改 JSON 事件 / 引擎代码。
- 不将 romance/family 设为通关必要条件。
- 不扩展 0–80 或导入 deferred 恋爱文件。
- 不要求三条优先路线 **均** 在单一样本中达成 achievement（US-002：至少一条即可）。

---

## 12. US-008 验收对照

| Acceptance criterion | Status |
| --- | --- |
| 定义 31–50 前后可达的一条 sample romance/family arc | done — `arc_rf_mingyue`，§3 |
| 含 meeting、trust growth、conflict、commitment or separation、midlife consequence | done — §3.1 |
| 与 orthodox/sect、wandering hero、demonic path 共存且有路线差异 | done — §4 |
| 至少 3 个 player choices | done — KC-1..3，§5 |
| 至少 2 个 later payoffs | done — PO-1..2（+PO-3 辅助），§6 |
| Typecheck passes | 见 §13 |
| 可直接交给 US-009 实现 | done — §9 |

---

## 13. 验证

```bash
npm run typecheck
```

预期：exit 0（本文档仅 markdown，无 TS 变更）。

---

*P3-W2 / US-008 — 2026-05-31*
