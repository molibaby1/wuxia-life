# P3 Midlife Experience and Trust Hardening — Key-Choice Payoff Gap Audit (US-011)

生成时间：2026-05-31

Story：**US-011 Audit Simulated Key-Choice Payoff Gaps**

权威输入：`docs/PRD/p3-midlife-experience-and-trust-hardening.md`、`docs/PRD/p3-midlife-experience-and-trust-hardening.prd.json`、`src/data/golden-line-payoff-map.json`、`src/data/golden-line-spine.json`、`docs/test-reports/p3-midlife-trust-targets.md`（US-002）、`docs/test-reports/p3-midlife-baseline.md`（US-001）、`scripts/goldenLineGate.ts`（仿真 payoff 判定逻辑）。

**Non-goals 遵守：** 未修改业务代码；未新增 payoff hook。

---

## 1. 摘要

| 维度 | 静态 map | 仿真（0–30，4 样本） | 仿真（0–50，5 样本） |
| --- | ---: | ---: | ---: |
| Key choice 定义数 | 9 | — | — |
| 静态 payoff 覆盖率 | **100%** | — | — |
| 仿真 payoff 率（per-sample 均值） | — | **39.6%** | **40.0%** |
| 低于 70% 阈值样本数 | 0 | **4/4** | **5/5** |
| **Simulated gap 实例数** | 0 | **8** | **9** |
| 31–50 段新增 key choice | — | — | **0**（缺口全部继承自 0–30） |

**核心结论：** 静态 payoff map 在数据层声明 9/9 key choice 均有后续 payoff，但 deterministic 仿真中 **无一 priority-route 样本达到 70% 仿真 payoff 阈值**。最大缺口来自 `martial_arts_enlightenment`（5/5 样本 universal miss）——静态 map 声称 `martial_improvement` / `sect_trial` 读取 focus flags，而运行时事件 **并不读取** `agilePath` 等 durable writes，且 payoff 事件被 love 链与 disciple 条件阻塞。

**Gap 总数（本报告口径）：**

| 类别 | 数量 | 说明 |
| --- | ---: | --- |
| **A. Simulated gap**（key choice 已发生，replay 未见任一 expected payoff event） | **9** | 0–50 五样本合计（§4） |
| **B. Never-reached key choice**（map 条目在 P3-EVAL 中从未作为 key choice 触发） | **5** | §5 |
| **C. Blocked payoff event**（payoff event 存在但全样本未触发，含 block reason） | **12** | §6 去重 event id |

---

## 2. 方法与判定口径

### 2.1 静态期望来源

- 机器源：`src/data/golden-line-payoff-map.json`（9 entries，`summary.payoffRate = 1.0`，`threshold = 0.7`）
- Key choice 集合：`golden-line-spine.json` → `keyChoiceEventIds`（与 map 一致）

### 2.2 仿真 payoff 判定（与 gate 一致）

与 `scripts/goldenLineGate.ts` → `evaluateContinuityForRun` 相同：

1. 在 replay 中找出 `payoff-map.entries[].keyChoiceEventId` 且带 `choiceId` 的记录 → **keyChoicesMade**
2. 对每个 key choice，若 replay 中 **任一** `entry.payoffs[].eventId` 出现 → **hit**
3. `simulatedPayoffRate = hits / keyChoicesMade.length`（阈值为 0.70）

**局限（US-012/014 需知）：** 当前 gate 仅检查 payoff **event id 是否出现**，不验证 durable write 是否被读取、不验证 payoff 类型（文本回调 vs 机械 gate）。

### 2.3 仿真命令与产物

| 队列 | 命令 / API | 终点年龄 | 样本 |
| --- | --- | ---: | --- |
| P3-GL 0–30 | `npm run simulate:golden-line` | 30 | `golden-sect`, `golden-wanderer`, `golden-demonic`, `golden-neutral-baseline` |
| P3-EVAL 0–50 | `runAllP3EvalSimulations()` | 50 | 上列 4 + `golden-romance-family` |

最新 JSON：`public/reports/golden-line-simulation-1780162292041.json`（0–30，2026-05-31 再生）。

### 2.4 Block reason 分类

| 代码 | 含义 |
| --- | --- |
| `static_data_mismatch` | Map 声明 readMechanism，但 payoff event conditions 不读取 key choice 写入的 flag |
| `condition_unmet` | Payoff event 条件在样本终态下不可满足 |
| `priority_ordering` | 同 age slot 被更高 priority / weight 事件抢占（如 love 链） |
| `age_window_miss` | Payoff event ageRange 与样本调度窗口无交集（或仅 1 岁窗口被错过） |
| `route_fixture_skip` | `GameProcessSimulator` routeTrack fixture 预写 route flag，跳过 key choice 事件 |
| `simulation_strategy` | 确定性选择策略偏离 payoff 链（如 wanderer 选 `sect_choice.stay_home`） |

---

## 3. 静态 vs 仿真对照

### 3.1 Per-sample 仿真 payoff 率

| Sample | Route track | 分段 | keyChoicesMade | hits | Sim rate | Static map | vs 70% |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| `golden-sect` | sect | 0–30 | 2 | 1 | 50.0% | 100% | FAIL |
| `golden-wanderer` | wanderer | 0–30 | 3 | 1 | 33.3% | 100% | FAIL |
| `golden-demonic` | demonic | 0–30 | 2 | 1 | 50.0% | 100% | FAIL |
| `golden-neutral-baseline` | neutral | 0–30 | 4 | 1 | 25.0% | 100% | FAIL |
| `golden-romance-family` | — | 0–50 | 3 | 2 | 66.7% | 100% | FAIL |
| **0–50 四核心样本** | — | 0–50 | 11 | 4 | 36.4% | 100% | FAIL |
| **0–50 全五样本** | — | 0–50 | 14 | 6 | 42.9% | 100% | FAIL |

### 3.2 分段（0–30 vs 31–50）

| 分段 | keyChoicesMade（五样本合计） | gaps | 说明 |
| --- | ---: | ---: | --- |
| 0–30 | 14 | 9 | 全部 key choice 发生在此段 |
| 31–50 | 0 | 0 | 当前 payoff map 仅定义 age ≤ 30 payoff；中年段 **无新 key choice**，缺口为青年段遗留 |

> **US-017 提示：** 扩展 map 至 31–50 前，应先修复 0–30 仿真缺口；否则 US-014 分段 gate 将在 youth 段持续 fail。

---

## 4. Simulated gap 明细（A 类，共 9 条）

每条 = 样本中 **已发生** 的 key choice，replay 中 **未见** map 列出的任一 payoff event。

| # | Sample | Key choice @ age | Choice id | Durable writes（map） | Expected payoffs | Missing | Likely block reason |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| G1 | **all 5** | `martial_arts_enlightenment` @ 6 | `agile_path` | `agilePath` | `martial_improvement`, `sect_trial` | both | **`static_data_mismatch`**：`martial_improvement` 仅检查 `!meet_love_*`；`sect_trial` 需 `shaolinDisciple\|wudangDisciple\|emeiDisciple`，均不读 `agilePath`。叠加 **`priority_ordering`**（15–17 love 链占 slot）与 **`age_window_miss`**（`sect_trial` 仅 age 15） |
| G2 | `golden-wanderer` | `sect_path_choice` @ 13 | `stay_wanderer` | `route_wanderer` | `orthodox_initiation`, `jianghu_experience`, `demonic_encounter` | all | **`simulation_strategy`**：age 14 触发 `sect_choice(stay_home)` 而非 `jianghu_experience`；age 16 love 链抢占 **`jianghu_experience`** slot（priority 2）；`orthodox_initiation` 需 `route_orthodox` **`condition_unmet`** |
| G3 | `golden-neutral-baseline` | `sect_path_choice` @ 13 | `join_orthodox` | `route_orthodox`, `orthodox_trial_active` | 同上 | all | **`priority_ordering`**：age 14 已触发 `orthodox_trial_entry`，但 **`orthodox_initiation`**（age 14–16）被 trial 链与 love 链挤占；`jianghu_experience` / `demonic_encounter` 路线条件不符 |
| G4 | `golden-neutral-baseline` | `orthodox_trial_entry` @ 14 | `orthodox_trial_force` | `orthodox_trial_force_done` | `orthodox_trial_service`, `orthodox_trial_recovery` | both | **`priority_ordering`**：age 15 `love_first_meet` 抢占；`orthodox_trial_service` 虽 priority 1 且 force_done 已写入，同 age 竞争失败。Recovery 需 `force_failed` **`condition_unmet`** |

**Hit 对照（唯一稳定 hit）：** 五样本均 hit `childhood_preference` → `martial_arts_enlightenment`（下一 spine 事件按 age 6 必达）。

**部分 hit：**

- `golden-sect` @ 14：`orthodox_initiation` 出现，但 **`sect_path_choice` 未作为 key choice 发生**（routeTrack fixture 在 age 13 预写 `route_orthodox`，见 G6）。
- `golden-romance-family`：`sect_path_choice(join_orthodox)` hit `orthodox_initiation`；仍 miss G1。

---

## 5. Never-reached key choice（B 类，5 条 map 条目）

以下 key choice 在 **全部 P3-EVAL 0–50 replay** 中未出现（无 choice 记录），故不参与仿真 payoff 分母，但静态 map 仍计为「有 payoff」：

| Key choice | Map payoffs | 未触发原因 |
| --- | --- | --- |
| `orthodox_trial_service` | `orthodox_trial_completion` | 前置 `orthodox_trial_entry` 链在 priority 样本中 rarely 完成；neutral 有 entry 但 service payoff 仍 miss（G4） |
| `demonic_encounter` | `demonic_trial`, `demonic_trial_shadow`, `understand_unconventional_truth` | **`route_fixture_skip`**：`golden-demonic` 在 age 14 fixture 预写 `route_demonic`，跳过 encounter；直接触发 `demonic_trial` |
| `demonic_power_struggle` | `demonic_usurpation`, `demonic_renounce_path` | 样本在 16 岁前已转向 love/family 链，未进入 demonic power 年龄窗 |
| `sect_trial_final` | `sect_trial`, `martial_improvement` | 无样本完成 sect trial 前置链；sect fixture 在 age 26 直接 sync `sect_trial_completed` **不经事件** |
| `hero_first_case` | `hero_save_village`, `continued_journey` | **`condition_unmet`**：需 `identity: hero` + `faction: orthodox` + 属性门槛；样本走 family/outlaw 链。Wanderer fixture age 20 sync `hero_first_case` **flag 无对应事件** |

---

## 6. Blocked payoff events（C 类，按 event 去重）

以下 payoff event 在 **至少一条 gap** 中被期望，但 **五样本 0–50 replay 均未触发**（或仅 sect 样本部分触发）：

| Payoff event | Age window | 阻塞原因 | 影响 gap |
| --- | --- | --- | --- |
| `martial_improvement` | 17 | `condition_unmet`：`!meet_love_success && !meet_love_observe`；全样本 15+ 已进 love 链 | G1（×5） |
| `sect_trial` | 15 | `condition_unmet`：需 disciple flag，非 focus flag；`age_window_miss` | G1（×5） |
| `jianghu_experience` | 16 | `priority_ordering`：love / daily 事件抢占 | G2, G3 |
| `orthodox_initiation` | 14–16 | `route_fixture_skip` 或 `priority_ordering` | G2, G3 |
| `demonic_encounter` | 14–17 | `route_fixture_skip`（demonic track） | map entry 未触发 |
| `demonic_trial` | 14–16 | 作 encounter payoff 计，但 demonic 样本走 fixture 直跳 | — |
| `orthodox_trial_service` | 13–17 | `priority_ordering` vs love @ 15 | G4 |
| `orthodox_trial_recovery` | 13–18 | `condition_unmet`：需 `force_failed` | G4 |
| `orthodox_trial_completion` | 13–18 | 前置 service 链未走完 | B 类 |
| `hero_save_village` | 25–30 | `condition_unmet`：需 `hero_first_case` achievement + identity | B 类 |
| `continued_journey` | 19 | `condition_unmet`：需 `!willAttendMartialArtsMeeting*` | B 类 |
| `understand_unconventional_truth` | 18–40 | demonic encounter 链未完整走通 | B 类 |

---

## 7. Top gaps 摘要（US-012 / US-013 优先序）

按 **影响样本数 × 信任风险** 排序：

### 7.1 T1 — `martial_arts_enlightenment` universal miss（5/5 样本）

- **现象：** 静态 map 100% 声明有 payoff；仿真 0% hit（除 childhood 链外）。
- **根因：** **`static_data_mismatch`** — `agilePath` / `externalFocus` 等 flag 在代码库中 **无任何后续 event condition 读取**（仅写入）。Map `readMechanism` 与 runtime 不一致。
- **US-013 方向：** 在 `martial_improvement` 或新 midlife 事件增加 focus flag 读取；或修正 map 声明；或降低 love 链对 age 17 的抢占（调度层）。

### 7.2 T2 — Love / family 链抢占青年 payoff slot（4/5 样本）

- **现象：** age 15–20 `love_first_meet` → `family_marriage` 稳定出现，挤占 `sect_trial`、`orthodox_trial_service`、`jianghu_experience`、`martial_improvement` 窗口。
- **根因：** **`priority_ordering`** + P3-RF 样本设计（US-008/010）与 golden-line martial payoff 同 age 竞争。
- **US-012 方向：** 定义 love 链与 martial payoff 的 **scheduling 优先级** 或 **minimum martial payoff rate** 豁免规则。

### 7.3 T3 — Route track fixture 跳过 key choice（sect / demonic）

- **现象：** `golden-sect` 无 `sect_path_choice`；`golden-demonic` 无 `demonic_encounter`；fixture 直接 sync flag。
- **根因：** **`route_fixture_skip`** — `GameProcessSimulator.applyRouteTrackFixtureBootstrap` 预写 route flag。
- **US-013/016 方向：** Fixture 改为触发真实 key choice 事件，或 map/gate 排除 fixture 预写条目。

### 7.4 T4 — `sect_path_choice` wanderer / neutral payoff miss（2 样本）

- **现象：** `route_wanderer` / `route_orthodox` 已写入，但 `jianghu_experience` 等未出现。
- **根因：** **`simulation_strategy`**（wanderer `stay_home`）+ **`priority_ordering`**。
- **US-013 方向：** 强化 wanderer track 在 age 16 对 `jianghu_experience` 的调度保底。

### 7.5 T5 — `hero_first_case` 链从未仿真触发（0/5）

- **现象：** Map 声明 25–30 `hero_save_village` payoff；无样本触发 `hero_first_case` 事件。
- **根因：** **`condition_unmet`**（identity/faction）+ wanderer fixture 仅 sync flag 不触发事件。
- **US-013 方向：** PXG3 游侠路线 lifecycle 需 earlier hero identity（见 `product-experience-governance-key-choice-payoff-map.md` residual notes）。

---

## 8. 机器可读 gap 表（供 US-014 gate）

```json
{
  "auditStory": "US-011",
  "staticPayoffRate": 1.0,
  "simulatedPayoffThreshold": 0.7,
  "gapInstanceCount": 9,
  "neverReachedKeyChoiceCount": 5,
  "samples": [
    { "id": "golden-sect", "segment": "0-50", "simulatedPayoffRate": 0.5, "gapIds": ["G1"] },
    { "id": "golden-wanderer", "segment": "0-50", "simulatedPayoffRate": 0.333, "gapIds": ["G1", "G2"] },
    { "id": "golden-demonic", "segment": "0-50", "simulatedPayoffRate": 0.5, "gapIds": ["G1"] },
    { "id": "golden-neutral-baseline", "segment": "0-50", "simulatedPayoffRate": 0.25, "gapIds": ["G1", "G3", "G4"] },
    { "id": "golden-romance-family", "segment": "0-50", "simulatedPayoffRate": 0.667, "gapIds": ["G1"] }
  ],
  "topBlockReasons": ["static_data_mismatch", "priority_ordering", "route_fixture_skip", "condition_unmet", "simulation_strategy"]
}
```

---

## 9. 对下游 story 的交付物

| Story | 本报告提供 |
| --- | --- |
| **US-012** Define Payoff Timing Rules | §2 判定口径、§3.2 分段、§7 block reason  taxonomy、T1–T2 年龄距建议（focus @6 → payoff @17 = 11y） |
| **US-013** Implement Missing Payoff Hooks | §4 gap 表、§6 blocked events、§7 优先序 T1–T5 |
| **US-014** Harden Payoff Gate | §8 JSON schema、`static_data_mismatch` 与 `route_fixture_skip` 应升级为 gate finding 类型 |

---

## 10. 验证

| Command | Exit code | 备注 |
| --- | ---: | --- |
| `npm run typecheck` | 0 | 本 story 无代码变更 |
| `npm run simulate:golden-line` | 0 | 0–30 四样本再生 |
| `npm run gate:golden-line` | 0 | continuity payoff warning 仍为 W3–W6 模式 |

---

## 11. US-011 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Compare static map with 0–30 and 0–50 simulation | done — §3 |
| Identify key choices that write state but lack simulated payoff | done — §4 G1–G4, §5 |
| Identify payoff events blocked by age, route, condition, priority | done — §6, §2.4 |
| Produce key-choice payoff gap report | done — 本文档 |
| Do not modify business code | done |
| Typecheck passes | done — §10 |

---

## 12. 残余风险

1. **Gate 粒度不足：** 当前仅 event-id 共现，T1 类 **static_data_mismatch** 无法被现有 gate 检测。
2. **Fixture 与真实玩家路径分叉：** routeTrack 样本为通过 route health gate 设计，与「玩家亲手 key choice」 payoff 统计目标冲突。
3. **Payoff map 年龄上限 30：** 0–50 仿真中 31–50 无 map 条目，US-017 扩展前中年 payoff 不受此 map 覆盖。
4. **Romance-family 样本 66.7%：** 最接近阈值但仍 fail，且仅因 G1；修复 T1 可能一次性提升多样本。

---

*P3-W3 — US-011 — 2026-05-31*
