# P3 Midlife Experience and Trust Hardening — Death Source Audit (US-003)

生成时间：2026-05-31

Story：**US-003 Audit Death Sources**

权威输入：`docs/test-reports/p3-midlife-baseline.md`（W1）、`docs/test-reports/p3-midlife-trust-targets.md`（US-002）、`src/data/event-asset-manifest.json`、`src/data/events.json`。

本报告仅盘点 **active / candidate** 事件数据中的致死与强生存惩罚来源，并补充影响仿真的 **引擎级死亡路径**（供 US-004/005/006 使用）。未修改业务代码。

---

## 1. 摘要

| 维度 | 数量 / 结论 |
| --- | --- |
| Active + candidate 事件总数（manifest） | **107**（active 35 + candidate 72） |
| 含致死或强生存惩罚效果的事件 | **13** |
| **50 岁前**可触达的盘点条目（`ageMin < 50`） | **13** |
| Active/candidate 内 **真正设置 `alive=false`** 的事件 | **0** |
| 引擎级 **随机英年早逝**（`setbackEvents.ts` → `early_death`） | **1**（18–40 岁，有效） |
| P3-GL 0–30 确定性样本实测死亡 | **0/4**（`alive=true` @30） |
| W1 `death_rate=1.0` 主因 | **P2-LEGACY** 跑至 85 岁 + 仿真报告在 **≥70 岁** 强制结局收束（非 50 岁前事件击杀） |

**对 US-004/005/006 的核心结论：**

- 玩家可见的「死亡」在 legacy 样本中多为 **晚龄结局收束**，不是 active 事件直接击杀。
- **唯一有效的随机直接死亡**来自难度系统 `early_death`（与 candidate 事件 `setback_early_death` 数据重复且 JSON 版 **未接通 `alive=false`**）。
- 魔道线 `demonic_ending_purge` 文案为死亡，但效果仅为 `health -100`，**当前引擎不会因 health≤0 致死**。
- **wandering hero** 在 active/candidate 事件内 **无** health/致死分支；风险集中在 shared 与 system/setback。

---

## 2. 盘点方法

### 2.1 范围

- **在 scope**：`event-asset-manifest.json` 中 `status ∈ { active, candidate }` 且由 `events.json` 加载的事件。
- **强生存惩罚阈值**（静态效果扫描）：
  - 直接致死：`special/end_game`、`alive=false`、`deathProbability≥100`、`player_died` 类 flag
  - 强惩罚：单次 `health` 损失 ≥10，或 `constitution` 损失 ≥15，或 `energy` 损失 ≥20
  - 随机挫折：`isSetbackEvent` + `random` 触发器（叠加引擎 `checkSetbackEvents`）

### 2.2 信任标注字段

| 字段 | 含义 |
| --- | --- |
| **player-visible warning** | 事件标题/正文/选项描述含风险语义（危/死/伤/覆灭/清算等） |
| **avoidable choice** | 存在手动选项，或触发非纯随机 |
| **mitigation path** | 存在低风险选项、属性门槛分支、体质豁免、或后续恢复事件 |

### 2.3 路线映射（报告用）

| 文件前缀 | 报告 route 标签 |
| --- | --- |
| `sect-wudang` / `sect-shaolin` / `sect-border` / `training` | orthodox/sect |
| `identity-hero` | wandering hero |
| `identity-demon` / `sect-marginal` | demonic path |
| `general` / `origin` / `faction-revelation` | shared |
| `love` | shared/romance |
| `setback-events` | system/setback |

### 2.4 年龄分段

| 分段 | 规则 |
| --- | --- |
| **0–17** | `ageMax ≤ 17` |
| **18–30** | 与 golden line 重叠的主线窗口 |
| **31–49** | `ageMin ≤ 49` 且 `ageMax ≥ 31` |
| **spans-50** | `ageMax > 49`（可在 50 岁前触发） |

---

## 3. 引擎级死亡路径（非 manifest 事件，但影响仿真）

以下路径 **不** 出现在 active/candidate 事件清单中，但 US-001 W1 与长期仿真必须理解。

| ID | 机制 | 年龄窗口 | 可见 warning | 可规避 | 缓解 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| **ENG-01** | `SetbackEventSystem` + `setbackEvents.ts` → `early_death`，`deathProbability: 100` → `alive=false` | 18–40 | 有（`failureText`） | 否（年度随机） | 体质 ≥80 不进入候选池；触发时体质豁免率 60% | **唯一已验证的有效随机击杀** |
| **ENG-02** | `GameProcessSimulator` + `EndingSystem.getForcedLateLifeEnding`：年龄 ≥70 时报告 `isAlive=false` | 70+ | 无（报告层） | 不适用 | 不适用 | **解释 P2-LEGACY 100%「死亡」** |
| **ENG-03** | `SpecialEffectHandler` `target: end_game` → `alive=false` + 结局判定 | 由事件 age 决定 | 取决于事件文案 | 取决于选项 | 取决于选项 | active/candidate **无**；`elderly-legacy`（deferred）在 70+ 有 `end_game` |
| **ENG-04** | `health` 扣减 | 任意 | 分支文案 | 选低风险分支 | 如 `orthodox_trial_recovery` | **不自动致死**（`StatModifyHandler` 无 health≤0 判定） |

**与 candidate 事件 `setback_early_death` 的关系：** JSON 版设置 `player_died` / `death_reason` flag，但代码库 **无** `player_died` 读取逻辑；运行时实际走的是 **ENG-01**（`early_death` id），存在 **双份配置漂移** 风险。

---

## 4. 按 route × age range 分组

### 4.1 orthodox/sect

| Age | Event ID | Status | 风险类 | 效果摘要 | Warning | Avoidable | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 14–17 | `orthodox_trial_service` | active | 强生存 | 分支 health −8～−25；failure 分支更重 | 是（「身负轻伤」「击伤」） | 是（3 主选项 + 属性分支） | 是（`service_meditate` 无伤；`orthodox_trial_recovery` 恢复） |
| 14–17 | `sect_trial_entry` | active | 中等 | `trial_basic_fail`：health −10 | 是（「失误摔伤」） | 是（选其他关卡） | 是（选 `trial_basic` 无伤） |

### 4.2 wandering hero

| Age | Event ID | Status | 风险类 | 效果摘要 | Warning | Avoidable | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | **active/candidate 中无 health/致死效果事件** | — | — | 仅能通过 shared / setback 间接受损 |

> `identity-hero.json` 内当前无 `health` / `end_game` 效果。US-006 若要求「每条 priority route 高风险分支可读可避」，hero 线需新增或从 shared 事件显式标注。

### 4.3 demonic path

| Age | Event ID | Status | 风险类 | 效果摘要 | Warning | Avoidable | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 14–18 | `demonic_trial_shadow` | active | 中等 | 某分支 health −10 | 是 | 是 | 是（其他 trial 选项） |
| 17–30 | `demonic_usurpation` | active | 中等 | 分支 health −15 | 是 | 是 | 是（避免夺位失败链） |
| 18–35 | `demonic_redemption_test` | candidate | 中等 | health −12 | **否**（标题未写风险） | 是 | 部分（选项分流） |
| 25–45 | `demonic_ending_purge` | candidate | **叙事致死 / 数据未致死** | auto：`health` subtract 100；文案「死于清算」 | 是 | **否**（auto，需 `demonic_usurp_failed`） | **否**（无恢复分支；应避免进入 failed 状态） |

### 4.4 shared / romance

| Age | Event ID | Status | 风险类 | 效果摘要 | Warning | Avoidable | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 14–17 | `sect_trial_entry` | active | 中等 | 见 §4.1 | 是 | 是 | 是 |
| 23–32 | `love_life_or_death` | candidate | 中等 | 「舍身救她」health −12 | 是（「生死一线」） | 是 | 是（「寻找援手」无伤） |

### 4.5 system/setback（candidate 事件文件 + 引擎并行）

| Age | Event ID | Status | 风险类 | 效果摘要 | Warning | Avoidable | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 16–80 | `setback_illness` | candidate | 中等 | constitution −15，energy −20；随机 4% | **否** | 否 | 体质豁免（引擎） |
| 10–80 | `setback_injury` | candidate | 低 | constitution −5；随机 8% | 是 | 否 | 体质豁免 |
| **18–40** | **`setback_early_death`** | candidate | **致死意图 / 实现断裂** | flag `player_died`；constitution −50；随机 0.3% | 是 | 否 | 体质≥80 条件 + 引擎豁免（**ENG-01** 生效） |
| 15–80 | `setback_property_loss` | candidate | 经济 | money −100 | 是 | 否 | 否 |
| 20–80 | `setback_betrayal` | candidate | 社交 | chivalry/connections 下降 | 是 | 否 | 否 |
| 16–70 | `setback_cultivation_deviation` | candidate | 强生存 | internal −20，martial −15，constitution −10；随机 2% | 是 | 否 | 体质豁免 |

**引擎对照（同一主题）：** `setbackEvents.ts` 中 `early_death`（0.3%×全局倍率，18–40）为 **实际击杀**；JSON `setback_early_death` 为 **重复且未接线的数据面**。

---

## 5. 直接致死 vs 强生存惩罚汇总表

| # | Route | Age range | Event / Engine ID | Status | 类型 | Before 50? |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | system | 18–40 | **ENG-01 `early_death`** | engine | 直接致死 | **是** |
| 2 | system/setback | 18–40 | `setback_early_death` | candidate | 直接致死（**flag only，无效**） | **是** |
| 3 | demonic path | 25–45 | `demonic_ending_purge` | candidate | 叙事致死 / health−100 | **是** |
| 4 | orthodox/sect | 13–17 | `orthodox_trial_service` | active | 强生存（≤−25 health） | **是** |
| 5 | shared | 14–17 | `sect_trial_entry` | active | 中等（−10 health） | **是** |
| 6 | demonic path | 14–18 | `demonic_trial_shadow` | active | 中等 | **是** |
| 7 | demonic path | 17–30 | `demonic_usurpation` | active | 中等 | **是** |
| 8 | demonic path | 18–35 | `demonic_redemption_test` | candidate | 中等 | **是** |
| 9 | shared/romance | 23–32 | `love_life_or_death` | candidate | 中等 | **是** |
| 10 | system/setback | 16+ | `setback_illness` | candidate | 强生存 | **是** |
| 11 | system/setback | 10+ | `setback_injury` | candidate | 低 | **是** |
| 12 | system/setback | 16+ | `setback_cultivation_deviation` | candidate | 强生存 | **是** |
| 13 | system/setback | 15+ | `setback_property_loss` / `setback_betrayal` | candidate | 非生命（列入完整性） | **是** |

---

## 6. 与 US-001 基线 / 仿真的对照

### 6.1 Golden line（P3-GL 前置，0–30）

`npm run simulate:golden-line`（2026-05-31）：

| Sample | Final age | Alive |
| --- | ---: | --- |
| golden-sect | 30 | true |
| golden-wanderer | 30 | true |
| golden-demonic | 30 | true |
| golden-neutral-baseline | 30 | true |

→ 确定性黄金线 **无** 事件致死；与本次静态盘点一致（无 active `end_game`）。

### 6.2 Legacy gameplay（P2-LEGACY，W1）

- `death_rate=1.0`：**6/6** 样本 `isAlive=false`，`runUntilDeath=true`，`years=85`。
- 终局摘要为「有成有憾」「壮志未酬」等 **结局文案**，非「英年早逝」类事件名。
- 与 **ENG-02**（≥70 强制结局）一致；**不能** 归因于 §4 中 50 岁前事件直接击杀。

### 6.3 可读性缺口（供 US-004）

| 缺口 | 影响 |
| --- | --- |
| 随机 `setback_*` 无玩家选项 | 触发前无 UI warning（仅有触发后正文） |
| `demonic_ending_purge` auto 链 | 有文案 warning，无规避选项 |
| `demonic_redemption_test` | 缺显性风险文案 |
| health 损伤不致死 | 高伤分支可能造成「假死亡」预期（文案死，状态活） |
| JSON vs TS 挫折双轨 | 审计与遥测易记错 event id |

---

## 7. 50 岁前死亡源计数（交付用）

| 计数口径 | 数量 |
| --- | ---: |
| **A. 有效直接致死路径**（运行时能 `alive=false`） | **1**（ENG-01 `early_death`） |
| **B. 配置为致死但实现无效** | **1**（`setback_early_death` JSON） |
| **C. 叙事/数据不一致的「假死亡」** | **1**（`demonic_ending_purge`） |
| **D. 含强生存惩罚的 active/candidate 事件** | **13**（§5 全表） |
| **E. 其中 `ageMin < 50` 的条目** | **13**（= D，本批无 50+ 专属条目） |

**US-003 对外口径建议：**

- **before-age-50 死亡源（有效）= 1**
- **before-age-50 死亡相关配置（含断裂/假死亡）= 3**（A+B+C）
- **before-age-50 生存风险事件 = 13**

---

## 8. US-003 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Inventory active/candidate kill or sharp survival sources | done — §4–§5 |
| Warning / avoidable / mitigation per source | done — 表内列 |
| Identify before-age-50 sources | done — §7 |
| Report grouped by route and age range | done — §4 |
| Do not modify business code | done |
| Typecheck passes | 见 §9 |

---

## 9. 验证

```bash
npm run typecheck
```

---

## 10. 后续 story 入口

| Story | 使用本报告的方式 |
| --- | --- |
| **US-004** | 以 §3 ENG 表 + §6.3 缺口定义早/中/晚死亡规则与「假死亡」处理原则 |
| **US-005** | 遥测须区分 `early_death` vs `setback_early_death` vs `demonic_ending_purge` vs ENG-02 强制结局 |
| **US-006** | 优先：`early_death` 警告/豁免 UX、`demonic_ending_purge` 链可读可避、hero 线补风险分支或标注 shared 依赖 |

---

*P3-W1 / US-003 — 2026-05-31*
