# P3 Midlife Experience and Trust Hardening — Romance/Family Availability Audit (US-007)

生成时间：2026-05-31

Story：**US-007 Audit Romance and Family Availability**

权威输入：`docs/test-reports/p3-midlife-baseline.md`（W2）、`docs/test-reports/p3-midlife-trust-targets.md`（US-002）、`src/data/events.json`、`src/data/event-asset-manifest.json`、`scripts/gameplaySimulationGate.ts`。

本报告仅盘点 runtime 已加载的 romance/family 事件、触发门槛，以及在 deterministic 样本中的首个断点。**未修改业务代码。**

---

## 1. 摘要

| 维度 | 结论 |
| --- | --- |
| Runtime 恋爱/家庭事件（主链） | `love.json` **19** 个 + `family-life.json` **10** 个（均经 `EventLoader` 加载） |
| 未加载 backlog | `love-mature.json`（8）、`love-marriage-conflict.json`（6）不在 `events.json` imports |
| W2 `romance_family_achievement_rate=0` 主因 | **指标读 `player.spouse` / `player.children`，事件只写 flag（`married` / `spouse_mingyue` / `has_child`），引擎无 effect 写入 player 字段** |
| P2-LEGACY 6 样本实测 | **5/6** 触发 `family_marriage` + `family_child_born`，终态 `married=true` & `has_child=true`，但 **6/6** `spouse=null`、`children=0` |
| P3-GL 4 样本（0–30） | **2/4** 触发 `family_marriage`；**4/4** 触发 `love_first_meet` 链；**0/4** achievement |
| P3-EVAL 4 样本（0–50） | **2/4** 触发 `family_marriage` + `family_child_born`；**2/4**（wanderer/demonic）婚姻链在 50 岁前未闭合 |
| Manifest 质量标注 | `family-life.json` 10 事件均为 **broken**（mixed/legacy format）；`love.json` 仅 `love_first_meet` 为 **active**，其余 18 为 **candidate** |

**对 US-008/009 的核心结论：**

1. **首要断点 RF-01（全局）**：成就判定与事件效果使用不同状态面；修复须同步 `player.spouse` / `player.children`（或调整 gate 语义），否则链跑通仍计 0。
2. **P3 优先路线断点 RF-02**：`golden-wanderer` / `golden-demonic` 在 0–50 deterministic 中 **从未触发 `family_marriage`**（路线事件挤占 20–30 岁窗口）。
3. **选择断点 RF-03**：触发 `family_marriage` 时，模拟器稳定选「门当户对」，不选「迎娶明月」；`spouse_mingyue` flag 常为空。
4. **内容断点 RF-04**：`love_ending_good` 等结局与 `spouse_mingyue_daily` 依赖 flag，均不写入 achievement 字段；且与 `family_marriage` 并行、无统一「成家」状态。

---

## 2. 成就指标语义（与 W2 对齐）

来源：`scripts/gameplaySimulationGate.ts` → `computeMetrics`

| 字段 | 判定 |
| --- | --- |
| `romance_family_achievement_rate` | 样本终态 `Boolean(statistics.spouse) \|\| statistics.children > 0` |
| 不计入 | `relationships[]` 中 `lover_mingyue` 好感、`flags.married`、`flags.has_child`、`flags.spouse_mingyue` |

US-001 观察：`lover_mingyue:48` 来自 `relation_change` 累积，**不构成 achievement**。

---

## 3. Runtime 事件盘点

### 3.1 加载来源

| 文件 | `events.json` | 事件数 | Manifest 文件态 | 说明 |
| --- | --- | ---: | --- | --- |
| `love.json` | ✅ | 19 | candidate（文件级） | 含完整明月恋爱链 + `spouse_mingyue_daily` |
| `family-life.json` | ✅ | 10 | deferred（文件级）/ 事件 broken | 婚姻、生育、教育、危机等 |
| `love-mature.json` | ❌ | 8 | deferred | 中年恋爱/外遇/黄昏恋 |
| `love-marriage-conflict.json` | ❌ | 6 | deferred | 婚后冲突、生子压力、离婚危机 |

其他 runtime 文件含零星关系效果（非主链）：`official.json`（`official_love_obstacle`）、`sect-shaolin.json`（+4 明月好感）、`elderly-legacy.json`（`family_happiness`）。

### 3.2 `love.json` 事件链（runtime）

| 事件 ID | Age | 类型 | Manifest | 主要门槛 | 关系/状态效果 |
| --- | --- | --- | --- | --- | --- |
| `love_first_meet` | 15–35 | choice | **active** | `!love_started` 等；`charisma≥5`；trigger: age≥15 + random 0.6 | 选项 outcomes → `love_started` + `lover_mingyue` relation |
| `love_after_greet` | 15–35 | auto | candidate | `love_started` && `!love_after_greet_done` | +5 明月好感 |
| `love_shared_mission` | 16–25 | auto | candidate | `love_started` && `!love_bonded` | +8 好感 |
| `love_family_obstacle` | 17–26 | choice | candidate | `love_started` | 选 prove/avoid → 后续 flag |
| `love_rival_appears` | 20–26 | choice | candidate | 恋爱链 flag | 好感 ± |
| `love_separation` | 21–28 | auto | candidate | 分离 flag | 时间推进 |
| `love_reunion` | 22–30 | choice | candidate | 分离且未复合 | `love_committed` 可选 |
| `love_misunderstanding` | 18–25 | choice | candidate | 恋爱中 | 澄清/冷战 |
| `love_secret_help` | 20–28 | auto | candidate | 误解后 | +4 好感 |
| `love_life_or_death` | 23–32 | choice | candidate | 秘密帮助后 | 生死抉择 |
| `love_family_reconcile` | 21–30 | auto | candidate | 生死后 && `!spouse_mingyue` | `love_family_reconcile` |
| `love_ending_good` | 24–35 | auto | candidate | `love_committed` + reconcile/life_or_death；**`!spouse_mingyue`** | 仅 flag，**无 spouse 字段** |
| `love_ending_sad/sacrifice/hideaway` | 22–36 | auto | candidate | 各分支 flag | 仅 flag |
| `love_hideaway_pull` | 24–36 | choice | candidate | hideaway 结局后 | 回归/隐居 |
| `love_demonic_conflict` | 19–30 | choice | candidate | 魔道路线交叉 | 好感 ± |
| `spouse_mingyue_daily` | 21–60 | auto | candidate | **`flags.spouse_mingyue == true`** | 侠义/声望；**不写 player.spouse** |

**路线要求：** 恋爱链本身无 `route_*` 硬门槛；`love_demonic_conflict` 面向魔道交叉。Golden line 三路线均可触达 `love_first_meet`。

### 3.3 `family-life.json` 事件（runtime）

| 事件 ID | Age | 类型 | Manifest | 主要门槛 | 状态效果 |
| --- | --- | --- | --- | --- | --- |
| `family_marriage` | 20–30 | choice | broken | age≥20；`triggerConditions.flags.not: married` | 选项设 `married` + `spouse_mingyue` / `spouse_arranged` / `spouse_love`；**无 player.spouse** |
| `family_child_born` | 25–40 | choice | broken | **`flags.required: married`**；not `has_child` | 选项设 **`has_child`**；**无 player.children++** |
| `family_child_education` | 28–45 | choice | broken | `has_child` | lifeStates / 属性 |
| `family_crisis` | 35–50 | choice | broken | 已婚/有子相关 flag | 家庭危机分支 |
| `family_child_marriage` | 45–60 | choice | broken | `has_child` | 子女婚嫁 |
| `family_grandchild_born` | 50–70 | auto | deferred | 已婚有子 | flag only |
| `family_reunion` | 40–70 | auto | deferred | 家庭 flag | auto |
| `family_teach_grandchild` | 55–75 | choice | broken | 有孙辈 | — |
| `family_family_precepts` | 50–70 | choice | broken | 有子 | — |
| `family_family_honor` | 48–65 | auto | deferred | 家族 flag | — |

**`family_marriage` 选项门槛：**

| 选项 | 额外条件 | 写入 flag |
| --- | --- | --- |
| 迎娶明月 | `love_started \|\| mingyue_fiancee` | `married`, **`spouse_mingyue`**, `marriage_type_love` |
| 门当户对 | 无 | `married`, `spouse_arranged`, `mingyue_married_other` |
| 自由恋爱 | 无 | `married`, `spouse_love` |

---

## 4. Deterministic 样本：首个断点

### 4.1 验证命令（2026-05-31）

```bash
npm run simulate:gameplay:samples   # P2-LEGACY
./node_modules/.bin/tsx scripts/runGoldenLineSimulation.ts   # P3-GL 0–30
# P3-EVAL 0–50：GameProcessSimulator + runP3EvalSimulation（goldenLineSimulation.ts）
npm run typecheck
```

### 4.2 P2-LEGACY（W2 观测队列）

| 样本 | love 链 | family_marriage | family_child_born | flags (终态) | achievement 字段 |
| --- | --- | --- | --- | --- | --- |
| martial-riser | ✅ @15 | ✅ @27 | ✅ @32 | married, has_child | spouse=null, children=0 |
| merchant-weaver | ✅ @15 | ✅ @23 | ✅ @28 | married, has_child | spouse=null, children=0 |
| bond-keeper | ✅ @15 | ✅ @29 | ✅ @34 | married, has_child | spouse=null, children=0 |
| official-track | ✅ @15 | ✅ @30 | ✅ @33 | married, has_child | spouse=null, children=0 |
| beggars-track | ✅ @15 | ❌ | ❌ | — | spouse=null, children=0 |
| demonic-track | ✅ @15 | ✅ @29 | ✅ @39 | married, has_child | spouse=null, children=0 |

**首个断点（P2-LEGACY 聚合）：RF-01** — 在 **`family_marriage` 已触发之后**，achievement 仍失败，因为 **无任何 effect 类型写入 `player.spouse` 或 `player.children`**（`EventExecutor` 无对应 handler）。

**beggars-track 额外断点：** 仅 `love_first_meet@15`，**`family_marriage` 在 20–30 窗口未排入**（RF-02 调度型，与 wanderer 同类）。

### 4.3 P3-GL / P3-EVAL（优先路线）

| 样本 | 0–30 婚姻 | 0–50 婚姻/生育 | 首个 missing / unlikely trigger |
| --- | --- | --- | --- |
| golden-sect | ✅ @29 | ✅ marriage @29, child @32 | **RF-01**（flag 已成家，字段仍空）；**RF-03**（选「门当户对」非迎娶明月） |
| golden-neutral-baseline | ✅ @29 | ✅ marriage @29, child @32 | 同上 |
| golden-wanderer | ❌ | ❌（50 岁仍 `married=undefined`） | **RF-02**：`family_marriage`（age 20–30）在路线专项调度下 **整段未触发**；链止于 `love_family_obstacle@23` |
| golden-demonic | ❌ | ❌（仅有 `family_crisis@45`，无 marriage） | **RF-02**：同上；恋爱链顺序乱序（`love_after_greet@26` 晚于 obstacle）且 20–30 岁无婚姻窗口 |

### 4.4 断点编号（供 US-008/009）

| ID | 类型 | 描述 | 影响样本 |
| --- | --- | --- | --- |
| **RF-01** | **状态面断裂** | `family_marriage` / `family_child_born` / 恋爱结局只写 flag，不更新 `player.spouse` / `player.children`；gate 只读 player 字段 | **全部**（含已跑通家庭链的 P2-LEGACY） |
| **RF-02** | **调度/窗口** | `family_marriage` age 20–30 + 与路线事件竞争；wanderer/demonic/beggars 确定性路径常错过 | P3-GL wanderer/demonic；P2 beggars |
| **RF-03** | **选择偏好** | 模拟器在 `family_marriage` 稳定选「门当户对」（财富+人脉），不选需 `love_started` 的「迎娶明月」 | golden-sect, golden-neutral, 多数 P2-LEGACY |
| **RF-04** | **并行叙事无合流** | `love_ending_good` 要求 `!spouse_mingyue`；与 `family_marriage` 明月分支互斥设计；无统一「成家」player 状态 | 恋爱完整链样本 |
| **RF-05** | **Backlog 未加载** | 中年恋爱、婚后冲突（`love-mature` / `love-marriage-conflict`）不在 runtime | 31–50 情感深度内容 |

---

## 5. 与 US-001 W2 的对照

| US-001 信号 | 本 audit 解释 |
| --- | --- |
| 0/6 有 spouse 或 children | **RF-01**：非事件不可达；5/6 已有 `married`+`has_child` flag |
| 均有 `lover_mingyue:48` | 恋爱链 + 零散 relation_change；**不计 achievement** |
| W2 仅 info WARNING | 符合 US-002：P2-LEGACY 上为观测队列，但暴露真实状态面 bug |

---

## 6. US-008 / US-009 建议入口

1. **US-009 必做：** 在 `family_marriage`（各选项）与 `family_child_born` 效果中写入 `player.spouse` / `player.children`（或通过统一 effect 类型），使现有 P2-LEGACY 链能立即通过 gate 抽检。
2. **US-008 样条弧：** 以 `love_first_meet` → … → `family_marriage`（迎娶明月）→ `family_child_born` 为 spine；为 wanderer/demonic 定义 **20–30 岁保底调度** 或路线变体，解决 RF-02。
3. **选择策略：** deterministic 样本需 **relationship 倾向** 在 `family_marriage` 选明月分支，避免 RF-03。
4. **非目标确认：** 本 audit 不扩写 `love-mature` / `love-marriage-conflict` backlog（RF-05 留待后续 import 决策）。

---

## 7. US-007 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Inventory runtime-loaded romance/family events | done — §3 |
| Route, age, flag, relationship, choice requirements | done — §3.2–3.3 |
| First missing/unlikely trigger in deterministic scenarios | done — §4, RF-01–05 |
| Produce romance/family availability report | done — 本文档 |
| Do not modify business code | done |
| Typecheck passes | done — `npm run typecheck` exit 0 |

---

*P3-W2 / US-007 — 2026-05-31*
