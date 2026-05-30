# P3 Midlife Experience and Trust Hardening — Orthodox / Sect Midlife Arc (US-018)

生成时间：2026-05-31

Story：**US-018 Define Orthodox Sect Midlife Arc**

权威输入：`docs/PRD/p3-midlife-experience-and-trust-hardening.md`、`docs/PRD/p3-midlife-experience-and-trust-hardening.prd.json`（US-018）、`docs/test-reports/p3-midlife-simulation-segments.md`（US-017）、`docs/test-reports/product-experience-governance-route-lifecycle.md` 与 `docs/test-reports/p3-midlife-route-contradiction-audit.md`（US-015/016 路线规则）、`docs/test-reports/product-experience-governance-priority-route-specs.md`（0–30 sect beats）、`docs/test-reports/p3-midlife-payoff-timing-rules.md`（US-012）、`docs/test-reports/p3-midlife-death-risk-rules.md`（US-004 §3.4）、`docs/test-reports/p3-midlife-romance-family-sample-arc.md`（US-008 §4 正/门派变体共存）、`agent_docs/p3-midlife-experience-and-trust-hardening-application-execution-plan.md`、`agent_docs/p3-midlife-experience-and-trust-hardening-story-dispatch-matrix.md`。

本文档定义 **orthodox/sect** 在 **31–50 岁** 的中段路线压力与事件规格，供 **US-019** 实现与 **golden-sect** 确定性样本断言。**不实现事件、不修改业务代码。**

---

## 1. 摘要

| 项 | 定义 |
| --- | --- |
| **Arc ID** | `arc_os_midlife`（门派中年） |
| **路线身份** | `routeId=sect`，主 flag `route_orthodox`，`sect_faction=orthodox` |
| **年龄窗口** | 主链 **31–50**；入口最早 31，收束 **45–50** |
| **叙事主轴** | 青年入门后的 **责任加重** → **门内倾轧** → **为大局妥协** → **名节代价** → **中年账本** |
| **资产落点** | 优先 `sect-wudang.json`；可复用 `orthodox.json` 中 `orthodox_member` 条件；**不**扩写 beggars / official / border 等非优先路线 |
| **与 US-017 现状** | `golden-sect` 在 31–50 已有 events=19，但 **无专用 sect midlife 事件**；本 arc 供 US-019 将其中 ≥3 次替换/提升为 **route-relevant** |
| **与 US-008** | 情感线共用 spine；`family_crisis` 等保留 US-008 正/门派变体；本 arc **不重复** 家庭危机，仅 **调度共存**（§8） |

**US-016 / 路线规则（实现须遵守）**

| 规则 | 说明 |
| --- | --- |
| **Strong exclusion** | `sect` ↔ `demonic`：`route-conflict-table.json`；候选魔道事件须 `block_candidate`，不得侧写 `sect_faction=unconventional` 激活 demonic（RC-01） |
| **转向** | 若中年改投魔道/退出门派，须 **显式 turn 事件**（`metadata.routeTransition=turn` 或 tag `route_turn`），并写 `routeHistory.reason` |
| **门禁** | `passesRouteConflictChecks` 对 strong_exclusion 在 **active/locked_in** 均阻断（US-016 P0） |
| **仿真** | `golden-sect` 使用 `routeTrack=sect`；不得依赖 neutral 样本的「无 isolation」路径 |

---

## 2. 五类中年压力（PRD 对齐）

| 压力类型 | 玩家可感知含义 | 本 arc 承载事件 | 典型状态/属性 |
| --- | --- | --- | --- |
| **Responsibility** 责任 | 不再是弟子试炼，而是 **代行门规、督练后辈、代表师门下山** | `sect_midlife_stewardship` | `reputation`↑ 义务；`energy`↓；`master` 关系 |
| **Internal pressure** 门内压力 | 长老派系、资源分配、继任暗涌 | `sect_midlife_faction_pressure` | flag `sect_faction_*_lean`；同门关系 |
| **Moral compromise** 道德妥协 | 为「大局」容忍灰线：缉盗、灭口、瞒报 | `sect_midlife_gray_mission` | `chivalry` vs `connections` 拉扯 |
| **Reputation cost** 名节代价 | 江湖公议、旧案翻出、门规与侠名冲突 | `sect_midlife_public_judgment` | `reputation`±；`sect_faction` 对外姿态 |
| **Midlife consequence** 中年后果 | 45–50 收束：**清誉守山 / 蒙污留任 / 请辞下山** | `sect_midlife_ledger` | `route_orthodox` lifecycle、`sect_midlife_outcome` |

---

## 3. 弧线五段结构

```text
[责任加重] → [门内倾轧] → [灰色任务] → [名节公审] → [中年账本]
  31-37        33-42         36-45         40-48          45-50
```

### 3.1 阶段总表

| 阶段 | 年龄 | 叙事目标 | 事件 ID（US-019 新建） | 类型 |
| --- | ---: | --- | --- | --- |
| **Responsibility** | 31–37 | 确立中年门派身份 | `sect_midlife_stewardship` | auto（短叙）+ 可选 1 轻选 |
| **Internal pressure** | 33–42 | 派系站队压力 | `sect_midlife_faction_pressure` | **choice** |
| **Moral compromise** | 36–45 | 灰色任务抉择 | `sect_midlife_gray_mission` | **choice** |
| **Reputation cost** | 40–48 | 名节与旧案 | `sect_midlife_public_judgment` | choice 或 auto 分支（§5.4） |
| **Midlife consequence** | 45–50 | 路线中年收束 | `sect_midlife_ledger` | auto + 分支文案 |

### 3.2 推荐阅读时间线（golden-sect 主路径）

| Age | Phase | Event ID | 玩家动作 |
| ---: | --- | --- | --- |
| 31–33 | Responsibility | `sect_midlife_stewardship` | 自动：领受代行令；文案区分修心/修劲青年路径 |
| 34–38 | Internal pressure | `sect_midlife_faction_pressure` | **MC-1** 站队或守中立 |
| 37–43 | Moral compromise | `sect_midlife_gray_mission` | **MC-2** 执行 / 放水 / 拒令 |
| 41–47 | Reputation | `sect_midlife_public_judgment` | 应对公审；选项受 MC-2 与青年 service 记录影响 |
| 46–50 | Consequence | `sect_midlife_ledger` | 收束：写入 `sect_midlife_outcome` |

---

## 4. 事件规格（≥3）

以下均为 **US-019 待实现** 的 JSON 事件规格；字段命名对齐现有 `sect-wudang.json` 惯例。

### 4.1 `sect_midlife_stewardship`（Responsibility）

| 字段 | 值 |
| --- | --- |
| **年龄** | `ageRange.min=31`, `max=37` |
| **触发** | `flags.route_orthodox`；`routeStates.sect` ∈ `{active, locked_in, completed}`；`!flags.sect_midlife_stewardship_done` |
| **类型** | `auto`（若需玩家确认职司，可在 US-019 改为单选项 choice，**不计入** MC 最低 2 条） |
| **priority** | `≥` 同窗口 generic 事件；golden-sect 31–33 至少命中 **1 次** |
| **正文要点** | 师父/掌门委任：督练弟子、代掌刑堂、下山调停纠纷；强调「入门多年，门规在你肩上」 |
| **效果** | `flag_set sect_midlife_stewardship_done`；`reputation +3~5`；`energy -5`；`relation_change` master +5 |
| **死亡** | 无致死分支；符合 US-004 §3.4 |

**青年回调（文案/分支，§6 CB-2）**

| 青年状态 | 变体 |
| --- | --- |
| `orthodox_trial_mind_done` | 强调内政治理、门规条文 |
| `orthodox_trial_force_done` | 强调武试督练、对外震慑 |
| `orthodox_trial_force_failed` 且已恢复 | 文案提及「曾失足，如今更严」 |

---

### 4.2 `sect_midlife_faction_pressure`（Internal pressure）— **manual choice**

| 字段 | 值 |
| --- | --- |
| **年龄** | `min=33`, `max=42` |
| **触发** | `sect_midlife_stewardship_done`；`route_orthodox` |
| **类型** | `choice` |
| **priority** | 高于 love/family 同 age 竞争 **1 次**（golden-sect 34–38 窗口） |

**选项（MC-1）**

| Choice ID | 文案方向 | 效果 | flag |
| --- | --- | --- | --- |
| `faction_support_elder` | 支持保守派长老 | `connections`+，`reputation` 门派内+ | `sect_midlife_lean_conservative` |
| `faction_support_reform` | 支持革律一脉 | `chivalry`+，同门部分关系- | `sect_midlife_lean_reform` |
| `faction_remain_neutral` | 守中立，只办差 | `energy` 节省；后续公审更易被双方指责 | `sect_midlife_lean_neutral` |

**Warning**：选项 1/2 标 L2（「卷入派系，恐难脱身」）；选项 3 标 L1（「两面不讨好」）。

---

### 4.3 `sect_midlife_gray_mission`（Moral compromise）— **manual choice**

| 字段 | 值 |
| --- | --- |
| **年龄** | `min=36`, `max=45` |
| **触发** | `sect_midlife_faction_pressure` 已触发；`route_orthodox` |
| **类型** | `choice` |
| **priority** | golden-sect 37–43 **必达 1 次** |

**情境**：门派接到「剿灭」令，目标含曾受你下山行善所救之人（或无辜家小）；长老以大局压你。

**选项（MC-2）**

| Choice ID | 文案方向 | 效果 | flag |
| --- | --- | --- | --- |
| `gray_execute_order` | 奉命行事 | `reputation` 门派+，`chivalry`−，`karma`+（若项目有） | `sect_midlife_gray_executed` |
| `gray_leak_warning` | 暗中放走并瞒报 | `chivalry`+，`reputation` 门派−，被查风险 flag | `sect_midlife_gray_leaked` |
| `gray_refuse_order` | 拒令请罪 | `master` 关系−，`orthodox_trial_exceeded` 者可能减罚 | `sect_midlife_gray_refused` |

**Warning**：`gray_execute_order` L2；`gray_leak_warning` L2（「东窗事发则名节尽毁」）；`gray_refuse_order` L1。

**死亡**：禁止直接 `alive=false`；拒令后果为禁闭/削权（属性与 flag），P3-EVAL 仍须存活至 50。

---

### 4.4 `sect_midlife_public_judgment`（Reputation cost）

| 字段 | 值 |
| --- | --- |
| **年龄** | `min=40`, `max=48` |
| **触发** | `sect_midlife_gray_mission` 任一选项已完成；`route_orthodox` |
| **类型** | 推荐 `choice`（若 US-019 工期紧，可用 auto + 按 flag 选文案，但 golden-sect 仍须满足 **≥2 manual**，以 MC-1/2 为准） |

**情境**：江湖传言与门内审计并发；公审连接 **青年下山记录** 与 **灰色任务**。

**选项示例（实现可二选一或三选一）**

| Choice ID | 条件 | 效果 |
| --- | --- | --- |
| `judgment_confess` | `gray_leaked` 或 `service_injury` 记录 | 公开担责：`reputation` 江湖+、门派− |
| `judgment_deflect` | `lean_conservative` | 推给政敌：短期过关，`connections` 受损 |
| `judgment_silence` | `lean_neutral` | 沉默：双方皆怨，`sect_midlife_judgment_silence` |

---

### 4.5 `sect_midlife_ledger`（Midlife consequence）

| 字段 | 值 |
| --- | --- |
| **年龄** | `min=45`, `max=50` |
| **触发** | `sect_midlife_public_judgment` 已触发；存活；`route_orthodox` |
| **类型** | `auto`（分支文案 + 终态 flag） |
| **priority** | 45–50 窗口 **至少 1 次** route-relevant 收束 |

**结局分支（`sect_midlife_outcome`）**

| 条件组合 | outcome 值 | 玩家可见后果 |
| --- | --- | --- |
| `gray_refused` + `judgment_confess` | `upright_guardian` | 清誉守山；`routeStates.sect` → `completed` 候选 |
| `gray_executed` + `lean_conservative` | `sect_enforcer` | 蒙污留任；高门派声望、低侠义反馈 |
| `gray_leaked` + 高 `chivalry` | `hidden_mercy` | 江湖暗中称道，门派戒慎 |
| `sect_trial_final` delay + `judgment_silence` | `weary_steward` | 倦怠中年；解锁 US-023+ 退隐候选（仅 flag，本阶段不实现退隐链） |
| 默认 | `steadfast_elder` | 平稳收束，无额外惩罚 |

**效果**：`flag_set sect_midlife_ledger_done`；`flag_set sect_midlife_outcome=<value>`；choice feedback / life memory 引用 MC-1/2 与青年 CB（§6）。

---

## 5. 关键玩家抉择（≥2 manual）

| # | Event | Choice IDs | 阶段 | 持久写入 |
| --- | --- | --- | --- | --- |
| **MC-1** | `sect_midlife_faction_pressure` | `faction_support_elder` / `faction_support_reform` / `faction_remain_neutral` | Internal pressure | `sect_midlife_lean_*` |
| **MC-2** | `sect_midlife_gray_mission` | `gray_execute_order` / `gray_leak_warning` / `gray_refuse_order` | Moral compromise | `sect_midlife_gray_*` |

**US-019 须注册** 为 key choice 或 golden-line payoff 条目（与 US-012：31–50 band，first payoff hard cap ≤15 岁）。

---

## 6. 青年回调（≥2 callbacks to ages 0–30）

| # | 青年来源 | 年龄 | 持久信号 | 中年影响（availability / 文案 / 选项） |
| --- | --- | ---: | --- | --- |
| **CB-1** | `orthodox_trial_service` | 15–17 | `event_record`: `orthodox_trial_service_aid_great` / `orthodox_trial_service_aid_injury` / `orthodox_trial_service_meditate` 等 | **`sect_midlife_gray_mission`**：曾 `service_aid` 救人 → 灰任务目标更具体；`service_meditate` 主路径 → 多 **拒令** 减罚文案；`service_injury` → 公审 NPC 指认旧伤 |
| **CB-2** | `orthodox_trial_entry` | 14–16 | `orthodox_trial_mind_done` vs `orthodox_trial_force_done` | **`sect_midlife_stewardship`** 职司叙事分叉（§4.1）；`ledger` 结局权重微调 |
| **CB-3**（辅助） | `sect_path_choice` → `join_orthodox` | 13 | `route_orthodox`, `orthodox_trial_active` | 全链 **门槛**；未入门派则不触发本 arc |
| **CB-4**（辅助） | `sect_trial_final` | 15–18 | `sect_trial_completed` vs delay 记录 | **`sect_midlife_public_judgment`**：延迟试炼 → 「年少懈怠」台词；`ledger` → `weary_steward` 权重↑ |

**US-019 验收**：至少 **CB-1 + CB-2** 在 replay 中可观测（不同文案或选项可用性）。

---

## 7. Payoff 与记忆（对齐 US-012）

| # | 触发 | Payoff 事件 | 年龄 | Payoff 类型 |
| --- | --- | --- | ---: | --- |
| **PO-1** | MC-1 | `sect_midlife_gray_mission` | 36–45 | 事件可用性 + 派系文案 |
| **PO-2** | MC-2 | `sect_midlife_public_judgment` | 40–48 | 文本回调 + 选项变化 |
| **PO-3** | MC-1 + MC-2 + 青年 CB | `sect_midlife_ledger` | 45–50 | 路线后果 + life memory 摘要 |

**Soft callback 建议（0–30 → 31 过渡）**：30–31 岁间若播放 generic 年度事件，可增加 1 条 L0：「师门来信，召你回山议事」—— **不计入** payoff hit，仅减 midlife 脱节感（US-019 可选）。

---

## 8. 调度、样本与共存

### 8.1 `golden-sect`（US-019 必达）

| 规则 | 说明 |
| --- | --- |
| **Route-relevant 计数** | 31–50 replay 中 **≥3** 次本 spec 事件 ID（建议 stewardship + faction + gray + ledger 中任选 3） |
| **Manual choices** | **≥2** 次 MC-1、MC-2 |
| **Priority** | 在 `routeTrack=sect` 下，本 arc 事件 `priority` 高于 generic filler；与 `family_marriage` 冲突时 **各保 1 次**：marriage 20–30 已完成，31+ 以 sect arc 为主 |
| **Romance** | `family_crisis` 正/门派变体（US-008 §4）保留；若与 `sect_midlife_public_judgment` 同 age，**sect 路线事件优先 1 次**，family 危机可延后 1–2 年 |

### 8.2 与 US-017 基线对照

| 指标 | US-017 现状 | US-019 目标 |
| --- | --- | --- |
| golden-sect midlife events | 19（多为通用） | 其中 **≥3** 为本 arc ID |
| midlife choices | 14 | 含 **≥2** 本 arc manual |
| routeFlags | `route_orthodox` | 保持；新增 `sect_midlife_*` |

### 8.3 Manifest / spine（US-019 交接）

1. 将 §4 五个事件 ID 加入 `event-asset-manifest` **active**（`sect-wudang` 或 `orthodox` 源文件）。
2. 扩展 `golden-line-spine.json` / payoff map **31–50** 条目（可与 US-013 协同）：`keyChoiceEventIds` 增加 MC-1/2；payoffs 链 PO-1→PO-3。
3. **不** 在 US-019 前修改 spine（本 story 仅 spec）。

---

## 9. 死亡、风险与路线边界

| 项 | 规则 |
| --- | --- |
| **US-004 §3.4** | 本 arc **无** P3-EVAL 致死；高风险仅属性/声望/关系 |
| **Warning** | MC-2 与公审选项须 L2+；禁止 silent 强惩罚 |
| **Mitigation** | 每条高风险分支至少 1 条低风险出路（拒令、守中立、担责） |
| **Demonic** | 不得在 gray 任务中「暗中学魔」；改投魔道须独立 **turn** 事件，且终止本 arc |
| **Wanderer turn** | 若 31+ 显式叛出师门，须 turn 事件；`route_orthodox` 清除后本 arc 事件 **不可触发** |

---

## 10. US-019 实现清单（交接）

按优先级排序；超出须回 US-018 修订。

1. 在 `sect-wudang.json` 实现 §4 五个事件（含 MC-1、MC-2 选项与 effects）。
2. 实现 §6 **CB-1、CB-2**（`triggerConditions.expression` + 选项 `conditions` / 变体 `content`）。
3. 注册 MC-1/2 至 key choice / payoff map；满足 US-012 31–50 timing。
4. 提升 golden-sect 31–50 调度 priority；验证 §8.1 计数。
5. `sect_midlife_ledger` 写入 `sect_midlife_outcome` 供 US-026 life memory 引用（字段名保持一致）。
6. 跑 `npm run simulate:p3-eval`：midlife 段列出本 arc 事件命中。

**不在 US-019**：魔道 turn 链、0–80 扩展、bulk 激活非优先路线文件。

---

## 11. 非目标（本 story）

- 不编写或修改 JSON 事件 / 引擎 / gate 代码。
- 不定义 wandering hero / demonic midlife arc（US-020/022）。
- 不要求 romance/family achievement。
- 不实现 US-016 代码修复（仅遵守其路线规则）。

---

## 12. US-018 验收对照

| Acceptance criterion | Status |
| --- | --- |
| 定义 31–50 responsibility、internal pressure、moral compromise、reputation cost、midlife consequence | done — §2、§3 |
| 至少 3 个 midlife events 或 event specs | done — §4（5 个） |
| 至少 2 个 manual choices | done — MC-1、MC-2，§5 |
| 至少 2 个 callbacks to 0–30 choices or route state | done — CB-1、CB-2（+CB-3/4 辅助），§6 |
| Typecheck passes | 见 §13 |
| 可交给 US-019 实现 | done — §10 |

---

## 13. 验证

```bash
npm run typecheck
```

预期：exit 0（本文档仅 markdown，无 TS 变更）。

---

*P3-W5 / US-018 — 2026-05-31*
