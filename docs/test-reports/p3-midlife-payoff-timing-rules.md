# P3 Midlife Experience and Trust Hardening — Payoff Timing Rules (US-012)

生成时间：2026-05-31

Story：**US-012 Define Payoff Timing Rules**

权威输入：`docs/test-reports/p3-midlife-key-choice-payoff-gap-audit.md`（US-011）、`docs/test-reports/p3-midlife-trust-targets.md`（US-002 §3.3、§4.1 B1、§5.2）、`docs/PRD/p3-midlife-experience-and-trust-hardening.md`（US-012/013/014）、`src/data/golden-line-payoff-map.json`、`src/data/golden-line-spine.json`、`scripts/goldenLineGate.ts`（当前仿真 payoff 判定）。

本文档冻结 **key choice → first payoff** 的年龄距离规则、七种 payoff 类型判定口径、P3-EVAL 0–50 最低仿真 payoff 率，以及 missed payoff opportunity 的报告格式。供 **US-013（hook 实现）** 与 **US-014（gate 硬化）** 直接引用；不修改业务代码、不修改 gate。

---

## 1. 目的与范围

| 项 | 说明 |
| --- | --- |
| **目的** | 把「静态 map 全绿但玩家无记忆」量化为可执行的 **时机 + 形式** 标准；让 payoff 在合理年龄内、以玩家可感知的形式回响 |
| **在 scope** | 首次 payoff 年龄距离（推荐值与 hard cap）、七种 payoff 类型定义与可感知标准、P3-EVAL 最低仿真 payoff 率、missed payoff 报告 schema、与 US-011 gap 的映射 |
| **不在 scope** | payoff hook 实现（US-013）；gate 代码修改（US-014）；payoff map 31–50 条目扩展（US-013/017 协同） |
| **评估队列** | **P3-EVAL** = P3-GL（四 golden 样本）∪ P3-RF（`golden-romance-family`）；阈值引用 US-002，本文不另设数值 |

---

## 2. 术语

| 术语 | 定义 |
| --- | --- |
| **Key choice** | 出现在 `golden-line-spine.json` → `keyChoiceEventIds`，且玩家手动选择并写入 durable state（flag / route / relationship / identity）的事件 |
| **First payoff** | 某 key choice 之后，replay 中 **首次** 满足 §4 任一 payoff 类型、且 map 或 spine 声明为对该 choice 的回响的事件或效果 |
| **Age distance** | `firstPayoffAge − keyChoiceAge`（同一次 replay；key choice 取带 `choiceId` 的记录） |
| **Simulated payoff hit** | 与 `goldenLineGate.ts` → `evaluateContinuityForRun` 一致：key choice 已发生，且 replay 中 **任一** map 列出的 `payoffs[].eventId` 出现 |
| **Player-perceptible payoff** | 玩家在正常游玩中 **无需 debug 面板** 即可察觉的回响（§4.2）；仿真 hit 且通过 §4.2 方为 **qualified hit**（US-014 目标态） |
| **Soft callback** | 在 first payoff 之前出现的 **轻量回响**（choice feedback、生命记忆条目、L0 叙事句），用于填补过长 age gap；**不计入** simulated payoff hit，但可消除 `timing_exceeded` warning |
| **Missed payoff opportunity** | key choice 已发生，但在 hard cap 内无 simulated hit，或 hit 的 event 不满足 §4.2 可感知标准 |
| **Never-reached key choice** | map 有条目但 P3-EVAL replay 中从未作为 key choice 触发（US-011 B 类） |

---

## 3. Key choice → first payoff 年龄距离规则

### 3.1 总原则

1. **先回响、后遗忘**：玩家应在仍记得该选择的 **人生阶段内** 看到至少一次 payoff；不得仅依赖 10+ 岁后的单次远距离事件。
2. **距离随年龄递增**：幼年少龄选择窗口短；中年选择可接受更长筹备期，但不得超出 50 岁 playable 终点。
3. **Hard cap 触发 authoring 义务**：超出 hard cap 且无 soft callback → US-013 backlog **P0**；US-014 报告 `timing_exceeded`。
4. **跨段 key choice**：0–30 写入的 state，若 first payoff 落在 31–50，须在 **0–30 内** 至少 1 次 soft callback（US-013），除非 first payoff age distance ≤ 该 choice 所在 band 的 **推荐 max**。
5. **调度竞争不延长距离**：love / family 链与 martial payoff 同 age slot 竞争（US-011 T2）**不得** 作为超出 hard cap 的理由；须调整 priority 或增设备选 payoff slot（US-013）。

### 3.2 按 key choice 发生年龄的分段上限

以 **key choice 发生时的年龄** 查表：

| Key choice 年龄带 | 人生阶段 | 推荐 max（first payoff） | Hard cap（first payoff） | 典型范例 |
| --- | --- | ---: | ---: | --- |
| **0–10** | 幼年少龄 | **3 岁** | **5 岁** | `childhood_preference` @4 → `martial_arts_enlightenment` @6（gap=2，PASS） |
| **11–17** | 少年青年 | **5 岁** | **8 岁** | `sect_path_choice` @13 → `orthodox_initiation` @14–16（gap≤3，PASS） |
| **18–30** | 青壮 | **8 岁** | **12 岁** | `hero_first_case` → `continued_journey` @19（gap≤5，PASS） |
| **31–50** | 中年 | **10 岁** | **15 岁** | midlife arc key choice（US-018–023 落地后适用） |

**终点约束：** first payoff 年龄 **≤ min(keyChoiceAge + hard cap, 50)**；P3-EVAL 样本须存活至 50 岁方计入。

### 3.3 当前 map 对照（US-011 基线）

| Key choice | Choice @ age | 声明 first payoff | Gap | 判定 |
| --- | ---: | --- | ---: | --- |
| `childhood_preference` | 4 | `martial_arts_enlightenment` @6 | 2 | PASS |
| `martial_arts_enlightenment` | 6 | `sect_trial` @15 / `martial_improvement` @17 | **9 / 11** | **FAIL hard cap**（band 0–10，cap=5）；US-013 P0 |
| `sect_path_choice` | 13 | `orthodox_initiation` @14+ | ≤3 | PASS（timing）；仿真 blocked 见 US-011 |
| `orthodox_trial_entry` | 14 | `orthodox_trial_service` @15+ | ≤3 | PASS（timing） |
| `orthodox_trial_service` | — | `orthodox_trial_completion` | — |  rarely reached |
| `demonic_encounter` | 14 | `demonic_trial` @14+ | ≤2 | PASS（timing） |
| `demonic_power_struggle` | 17+ | payoffs @17+ | ≤13 | PASS cap； rarely reached |
| `sect_trial_final` | 26+ | `martial_improvement` @17 | — | map age 矛盾；US-013 须修正 map 或事件窗 |
| `hero_first_case` | 20+ | `continued_journey` @19 / `hero_save_village` @25–30 | 视触发年龄 | `@19` 若 choice≥20 则 FAIL；`hero_save_village` gap≤10 通常 PASS |

### 3.4 Soft callback 义务（gap 介于推荐 max 与 hard cap 之间）

当 **推荐 max < gap ≤ hard cap** 时，US-013 须 **至少一项**：

| 手段 | 可感知载体 | 最早出现年龄 |
| --- | --- | --- |
| **Choice feedback 回响** | 选择后 feedback 含「日后…/他日…/当初…」且绑定 durable write | key choice 同岁或 +1 岁 |
| **生命记忆条目** | life memory（US-025+）或等价 UI 列出该 key choice | ≤ keyChoiceAge + 2 |
| **L0 叙事句** | 年度/过渡事件 description 读取 focus/route flag | ≤ keyChoiceAge + 3 |

仅有 soft callback **不** 计 simulated hit；但 US-014 可将 `timing_exceeded` 降为 **info**。

### 3.5 同岁 spine 链例外

若 first payoff 为 spine **下一锚点事件**（如 `childhood_preference` → `martial_arts_enlightenment`），且 age distance ≤ 2，视为 **immediate echo**，推荐 max 与 hard cap 均 **自动满足**，无需 soft callback。

---

## 4. Payoff 类型定义

### 4.1 七种类型（冻结枚举）

与 PRD US-012 对齐；map 字段 `payoffType` 与 gate 报告 **统一使用下列 `type` 值**：

| `type` | 名称 | 机制要求 | Map 别名 / 归并 |
| --- | --- | --- | --- |
| **`text_callback`** | 文本回调 | 事件 `description` / 选项 `text` 因读取 key choice 写入的 flag、route、relationship 而产生 **可区分** 的叙事分支（非纯随机 fluff） | `altered_text` |
| **`event_availability`** | 事件可用性 | 后续事件 `conditions` / `triggerConditions` 含 key choice 的 durable write；仿真中该 event 被触发 | `altered_event_availability` |
| **`altered_choice`** | 选项变化 | 后续 manual 事件的选项集合、默认项或 `choice.condition` 因 prior state 不同而不同 | `altered_choice_availability` |
| **`relationship_change`** | 关系变化 | `relationships` / spouse / children / 指定 NPC 亲密度因读取 key choice state 而发生 **净变化**（非仅维持） | （新增归一化） |
| **`route_change`** | 路线变化 | `routeStates` lifecycle 变更（`active` / `completed` / `failed`）且 transition 读取 key choice flag | `route_state` |
| **`risk_mitigation`** | 风险缓解 | prior state 解锁更低风险选项、降低 `deathProbability`、或插入 recovery / exemption 分支 | （新增；US-006 死亡链可复用） |
| **`ending_weight`** | 结局权重 | `EndingSystem` 或等价结局选择器因 key choice state 改变可用结局集合或权重 | （新增；0–50 内多为铺垫） |

**一条 payoff 可标注多个 type**；gate 报告取 **主类型**（对玩家最明显的一项，见 §4.2）。

### 4.2 玩家可感知（player-perceptible）判定

仿真 hit 升级为 **qualified hit** 须满足 **至少一条**：

| 类型 | 可感知标准 |
| --- | --- |
| `text_callback` | 玩家可见文本与 **未选该 key choice 的对照路径** 有可辨认差异（authoring 声明或 diff 测试） |
| `event_availability` | 玩家 **经历** 该事件（非仅 debug 可见 trigger 满足） |
| `altered_choice` | 玩家看到 **增删改** 的选项；hidden 条件分支不算 |
| `relationship_change` | UI / 事件文案出现关系名、配偶、子嗣或「关系 +N」类 feedback |
| `route_change` | 玩家可见路线标签、门派身份或 life memory 路线区更新 |
| `risk_mitigation` | 玩家可见更低风险选项、risk hint、或「因先前…而化险为夷」类 feedback |
| `ending_weight` | 50 岁前通常仅作内部权重；若玩家可见结局预览则计；否则须 paired `text_callback` 或 `event_availability` |

**不合格模式（US-011 T1）：** event 出现在 replay，但 **conditions 不读取** key choice 写入的 flag（`static_data_mismatch`）→ 仿真 hit **不算** qualified hit。

### 4.3 类型与当前 gate 差距

| 现状 | US-014 目标 |
| --- | --- |
| 仅检查 payoff `eventId` 共现 | 共现 + §4.2 qualified + 可选 `readMechanism` 与 runtime conditions 交叉验证 |
| 不验证 age distance | 报告 `timing_exceeded` when gap > hard cap |
| 不区分 static vs simulated | 保持；补充 missed-opportunity 明细表 |

---

## 5. 最低仿真 payoff 率（P3-EVAL 0–50）

数值 **冻结引用 US-002 §3.3**；本文只补充 **聚合口径** 与 **分段 enforce** 规则。

### 5.1 阈值（不变）

| 指标 | 运算符 | 阈值 | 适用 |
| --- | --- | ---: | --- |
| `static_payoff_rate` | `≥` | **0.70** | 全局 `golden-line-payoff-map.json` |
| `simulated_payoff_rate` | `≥` | **0.70** | 每个 P3-GL priority-route 样本 |
| `simulated_payoff_rate` | `≥` | **0.70** | `golden-neutral-baseline`（US-029 blocker；US-014 前 warning） |
| `simulated_payoff_rate` | `≥` | **0.70** | `golden-romance-family`（P3-RF；与 P3-GL 同标准） |

### 5.2 样本分母与分子

与 `evaluateContinuityForRun` 一致，US-013/014 **除非本文 §5.4 排除** 否则不得改口径：

```
simulatedPayoffRate = hits / keyChoicesMade.length
```

- **分子 `hits`：** 该样本 replay 中，每个已发生的 key choice，若 **任一** map `payoffs[].eventId` 出现在 replay → +1。
- **分母 `keyChoicesMade`：** replay 中带 `choiceId` 且 `eventId ∈ map.entries[].keyChoiceEventId` 的记录数。

**US-014 增强（qualified）：**

```
qualifiedPayoffRate = qualifiedHits / keyChoicesMade.length
```

- `qualifiedHits`：hit 且满足 §4.2，且 **非** `static_data_mismatch`。

P3 完成态（US-029）：`simulated_payoff_rate ≥ 0.70` **且** `qualifiedPayoffRate ≥ 0.70`（US-014 落地后）。

### 5.3 分段最低率（US-017 后 enforce）

对每个 P3-EVAL 样本，按 key choice / payoff 发生年龄拆分：

| 分段 | 年龄 | 规则 |
| --- | --- | --- |
| **Youth** | 0–30 | 该分段内 `hits_youth / keyChoicesMade_youth ≥ 0.70`；若某 key choice 仅发生在 0–30，其 payoff 可落在 31–50，但 **计入 youth key choice 的 hit** |
| **Midlife** | 31–50 | 该分段内 **新定义** 的 key choice（US-013 扩展 map 后）须 `hits_midlife / keyChoicesMade_midlife ≥ 0.70` |
| **Full** | 0–50 | 全样本 `simulatedPayoffRate ≥ 0.70`（主 blocker） |

**任一分段** priority-route 样本低于 70% → fail（US-002 §3.3，防止中年段吞噬青年 payoff）。

### 5.4 P3-EVAL 聚合与豁免

| 规则 ID | 内容 |
| --- | --- |
| **PR-01** | P3-EVAL **五样本各自**须 `simulatedPayoffRate ≥ 0.70`；不做「4/5 平均」通过 |
| **PR-02** | `route_fixture_skip` 预写 route 导致 **未触发** key choice 事件时，该 map 条目 **不计入** 分母（US-013 修 fixture 前，US-014 报告 `fixture_excluded` 明细） |
| **PR-03** | Never-reached key choice（US-011 B 类）不计入分母，但须 **单独** 报告 `never_reached`；静态 map 仍要求有 payoff 声明 |
| **PR-04** | P3-RF 样本允许 love 链占用 age slot，但 **不得** 使 P3-GL 三路线样本 payoff 率低于 70%；RF 自身亦须 ≥ 70% |

### 5.5 基线对照（US-011）

| 样本 | 当前 simulated | P3 目标 | 主要 gap |
| --- | ---: | ---: | --- |
| `golden-sect` | 50.0% | ≥ 70% | G1 |
| `golden-wanderer` | 33.3% | ≥ 70% | G1, G2 |
| `golden-demonic` | 50.0% | ≥ 70% | G1 |
| `golden-neutral-baseline` | 25.0% | ≥ 70%（US-029） | G1, G3, G4 |
| `golden-romance-family` | 66.7% | ≥ 70% | G1 |
| **五样本加权** | **42.9%** | **各样本 ≥ 70%** | T1 为 universal blocker |

---

## 6. Missed payoff opportunity 报告方式

### 6.1 Finding 严重度

| Finding type | 严重度（US-014 前） | US-014 起 | 触发条件 |
| --- | --- | --- | --- |
| **`simulated_gap`** | warning | **blocker**（priority-route） | key choice 已发生；replay 无 map payoff event |
| **`qualified_gap`** | — | **blocker** | 有 event hit 但 §4.2 不合格或 `static_data_mismatch` |
| **`timing_exceeded`** | info | **warning** | hit 但 gap > hard cap；或无 hit 且 age 已超过 keyChoiceAge + hard cap |
| **`never_reached`** | info | **warning** | map 有条目；P3-EVAL 无 key choice 记录 |
| **`fixture_excluded`** | info | info | §5.4 PR-02 排除分母 |
| **`segment_fail`** | — | **blocker** | §5.3 分段 rate < 70% |

严重度与 US-002 §4.1 B1、§4.3 阶段表对齐；neutral 样本 simulated_gap 在 US-014 前为 warning。

### 6.2 单条 missed opportunity 必填字段

Gate / 仿真报告 JSON **每条** missed opportunity 须含：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `findingType` | enum | §6.1 |
| `sampleId` | string | P3-EVAL 样本 id |
| `segment` | enum | `0-30` \| `31-50` \| `full` |
| `keyChoiceEventId` | string | map key |
| `choiceId` | string | 玩家所选选项 |
| `keyChoiceAge` | number | replay 年龄 |
| `expectedPayoffEventIds` | string[] | map `payoffs[].eventId` |
| `expectedPayoffTypes` | string[] | map `payoffs[].payoffType` → §4.1 `type` |
| `firstPayoffMaxAge` | number | keyChoiceAge + hard cap（§3.2） |
| `recommendedPayoffMaxAge` | number | keyChoiceAge + 推荐 max |
| `actualFirstPayoffAge` | number \| null | 首次 hit 年龄；无 hit 则 null |
| `ageDistance` | number \| null | actual − keyChoiceAge |
| `blockReason` | enum | US-011 §2.4：`static_data_mismatch` \| `condition_unmet` \| `priority_ordering` \| `age_window_miss` \| `route_fixture_skip` \| `simulation_strategy` \| `timing_exceeded` \| `unknown` |
| `blockReasonDetail` | string | 一句可读说明（无本地路径） |
| `durableWrites` | string[] | map 声明写入 |
| `readMechanismDeclared` | string | map `readMechanism` |
| `readMechanismVerified` | boolean | US-014：runtime conditions 是否读取 durable write |
| `gapId` | string | 可选；US-011 交叉引用（如 `G1`） |

### 6.3 汇总块（report header）

每次 P3 payoff 评估输出 **汇总对象** `payoffOpportunitySummary`：

```json
{
  "evalCohort": "P3-EVAL",
  "staticPayoffRate": 1.0,
  "simulatedPayoffThreshold": 0.7,
  "samples": [
    {
      "id": "golden-sect",
      "segment": "full",
      "keyChoicesMade": 2,
      "simulatedHits": 1,
      "qualifiedHits": 0,
      "simulatedPayoffRate": 0.5,
      "qualifiedPayoffRate": 0.0,
      "segmentYouth": { "keyChoicesMade": 2, "simulatedPayoffRate": 0.5 },
      "segmentMidlife": { "keyChoicesMade": 0, "simulatedPayoffRate": 1.0 },
      "missedOpportunityIds": ["G1"]
    }
  ],
  "missedOpportunityCount": 9,
  "neverReachedKeyChoiceCount": 5,
  "topBlockReasons": ["static_data_mismatch", "priority_ordering", "route_fixture_skip"],
  "timingExceededCount": 1
}
```

### 6.4 人类可读报告结构（Markdown / CI log）

1. **Summary 表**：样本 × simulated / qualified rate × pass/fail。
2. **Missed opportunities 表**：§6.2 字段列（与 US-011 §4 同构，增 `timing` 列）。
3. **Never-reached key choices 表**：US-011 §5。
4. **Timing violations 表**：gap > hard cap 或 map age 矛盾（如 `sect_trial_final`）。
5. **Block reason 计数**：饼图或 top-N 列表。

### 6.5 与 US-011 gap 的 ID 映射

| gapId | key choice | 主要 blockReason | US-013 优先级 |
| --- | --- | --- | ---: |
| G1 | `martial_arts_enlightenment` | `static_data_mismatch` + `priority_ordering` | **P0** |
| G2 | `sect_path_choice` (wanderer) | `simulation_strategy` + `priority_ordering` | P1 |
| G3 | `sect_path_choice` (neutral) | `priority_ordering` | P1 |
| G4 | `orthodox_trial_entry` | `priority_ordering` + `condition_unmet` | P1 |

---

## 7. 调度与共存规则（love / martial / route）

引用 US-011 T2；US-013 实施时须满足：

| 规则 ID | 内容 |
| --- | --- |
| **SC-01** | 同一 age slot 多事件竞争时，**key choice payoff** 不得被连续 **3 个以上** 非 payoff 事件挤占（如 love 链 @15–17） |
| **SC-02** | P3-RF 样本可优先 scheduling 情感事件，但 **G1 类 universal gap** 须在 P3-GL 样本中有等效修复，不得仅 RF 特例通过 |
| **SC-03** | 新增 midlife payoff（31–50）须显式标注读取的 0–30 durable write；不得仅依赖 fixture sync flag |
| **SC-04** | 同 key choice 的多个声明 payoff 中，**至少一个** first payoff 须在 §3.2 hard cap 内且 type ∈ {`event_availability`, `altered_choice`, `text_callback`, `relationship_change`}（玩家可感知主类型） |

---

## 8. US-013 实施 backlog（规则派生）

按 US-011 §7 与本文 §3.3 排序：

| 优先级 | 项 | 规则条目 |
| ---: | --- | --- |
| **P0** | `martial_arts_enlightenment`：增 focus flag 读取 + 将 first payoff 提前至 ≤11 岁或增 soft callback @8–10 | §3.2, §4.2, G1 |
| **P0** | 修正 map `readMechanism` 与 runtime conditions 一致 | §4.2, `static_data_mismatch` |
| **P1** | love @15–17 与 martial payoff 调度（SC-01） | §7 SC-01 |
| **P1** | route fixture 改为真实 key choice 或 PR-02 排除 | §5.4 PR-02, G2–G4 |
| **P2** | `hero_first_case` / wanderer hero identity 链 | US-011 T5 |
| **P2** | 扩展 map 至 31–50 midlife key choices（与 US-017/018–023 同步） | §5.3 Midlife 分段 |

---

## 9. US-014 gate 检查清单（规则输入）

US-014 实现时从本文导出 **必检项**：

1. [ ] 分样本 `simulatedPayoffRate` vs 0.70（§5.1）
2. [ ] 分 segment youth/midlife rate（§5.3）
3. [ ] 输出 §6.2 每条 missed opportunity 字段
4. [ ] 区分 `static_payoff_rate` 与 `simulated_payoff_rate` / `qualifiedPayoffRate`
5. [ ] `blockReason=static_data_mismatch` 时 `readMechanismVerified=false`
6. [ ] `timing_exceeded` 当 gap > §3.2 hard cap
7. [ ] PR-02 fixture 排除明细
8. [ ] 失败 severity 按 §6.1 与 US-002 §4.3 阶段表

---

## 10. US-012 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Define maximum recommended age distance between key choice and first payoff | done — §3.2–3.4 |
| Define payoff types: text callback, event availability, altered choice, relationship change, route change, risk mitigation, ending weight | done — §4.1 |
| Define minimum simulated payoff rate for 0–50 priority-route samples | done — §5（引用 US-002 0.70） |
| Define how missed payoff opportunities are reported | done — §6 |
| Do not modify business code or gate | done |
| Typecheck passes | 见 §11 |
| Ready for US-013 and US-014 | done — §8–§9 |

---

## 11. 验证

```bash
npm run typecheck
```

---

## 12. 下游 Story 引用

| Story | 引用本文章节 |
| --- | --- |
| **US-013** Implement Missing Payoff Hooks | §3 距离、§4 类型、§7 调度、§8 backlog |
| **US-014** Harden Payoff Gate | §5 率与分段、§6 报告、§9 检查清单 |
| **US-017** Extend Simulation 31–50 | §5.3 分段、§3 midlife hard cap |
| **US-018–023** Midlife arcs | §3.2 31–50 band、§4 `text_callback` / `event_availability` |
| **US-025–026** Life memory | §3.4 soft callback、§4.2 `relationship_change` / `route_change` |
| **US-029** Update Experience Gates | §5.1 阈值、§6.1 严重度与 US-002 对齐 |

---

## 13. 残余风险

1. **Qualified payoff 检测成本：** §4.2 需 conditions diff 或 authoring 标注；US-014 可分阶段先 enforce simulated hit，再 enforce qualified。
2. **Map 年龄上限 30：** 31–50 key choice 列表待 US-013/017 扩展；本文 hard cap 已预留 midlife band。
3. **Fixture 与玩家路径分叉：** PR-02 排除分母为过渡方案；长期须 US-013 统一为真实 key choice（US-011 §12）。
4. **`sect_trial_final` map 年龄矛盾：** 需 US-013 修正 map 或事件 age window，否则 perpetual `timing_exceeded`。

---

*P3-W3 — US-012 — 2026-05-31*
