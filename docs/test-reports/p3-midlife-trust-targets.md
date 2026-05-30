# P3 Midlife Experience and Trust Hardening — Trust Targets (US-002)

生成时间：2026-05-31

Story：**US-002 Define P3 Trust Targets**

权威输入：`docs/test-reports/p3-midlife-baseline.md`（US-001，W1–W7）、`docs/PRD/p3-midlife-experience-and-trust-hardening.md`、`docs/test-reports/product-experience-governance-simulation-gates.md`。

本文档冻结 P3 玩家信任指标、阈值、评估队列，以及 warning → blocker 的升级策略。后续 US-004/006/012/014/016/024/029 与 gate 实现须引用本文，不得自行扩指标。

---

## 1. 目的与范围

| 项 | 说明 |
| --- | --- |
| **目的** | 把「能过 gate 但玩家不信」量化为可执行的信任标准，而非仅技术完成度 |
| **在 scope** | death rate、romance/family achievement、simulated key-choice payoff rate、route contradiction；0–50 deterministic 场景目标态 |
| **不在 scope** | 业务代码修改；直接修 W1–W7；life memory、midlife 事件数量等（由各自 story 引用本文阈值） |
| **指标来源** | 仅 US-001 四类信任 warning + PRD Success Metrics；不新增第五类 gate 指标 |

---

## 2. 评估队列（Cohort）

P3 必须区分队列，避免 legacy 仿真设计污染 golden-line 信任结论。

| Cohort ID | 样本 | 年龄上限 | 运行模式 | P3 完成时是否阻断 gate |
| --- | --- | ---: | --- | --- |
| **P3-GL** | `golden-sect`, `golden-wanderer`, `golden-demonic`, `golden-neutral-baseline` | **50**（US-017 后；基线 30） | deterministic；须 **存活至终点年龄** | **是**（信任主队列） |
| **P3-RF** | US-010 新增的 `golden-romance-family`（或执行计划批准的等价 id） | **50** | deterministic；以关系/家庭里程碑为选题策略 | **是**（情感线主样本） |
| **P2-LEGACY** | `martial-riser`, `merchant-weaver`, `bond-keeper`, `official-track`, `beggars-track`, `demonic-track` | 85（`runUntilDeath=true`） | 历史 P2 gameplay 样本 | **否**（观测队列） |

**P3 信任评估集（P3-EVAL）** = P3-GL ∪ P3-RF。US-029 最终 gate 以 P3-EVAL 为准；P2-LEGACY 仅用于回归对比与 closure before/after，不得单独作为 P3 未完成的借口。

---

## 3. 指标阈值（冻结）

### 3.1 Death rate（`death_rate`）

| 维度 | 规则 |
| --- | --- |
| **语义** | 评估集内 `isAlive=false` 的样本占比 |
| **P3-GL / P3-RF 聚合** | **目标 = 0**（所有 deterministic 0–50 样本须存活至 `finalAge = 50`） |
| **单样本连续性** | `finalAge < 50` 或 `isAlive=false` → **blocker**（延续 PXG4 continuity；终点年龄由 30 升为 50） |
| **可读死亡（US-006）** | 0–50 内若发生死亡：须满足「死亡前已有玩家可见 warning 或可选缓解路径」→ 违反时为 **blocker**（指标名建议 `death_without_warning`；实现由 US-005/006 落地） |
| **P2-LEGACY** | 保持 `min=0.15, max=0.9` 为 **warning**；`death_rate=1.0` 为预期（跑至自然死亡），**不升级为 P3 blocker** |
| **基线对照** | W1：`death_rate=1.0` on P2-LEGACY only |

**冻结数值（P3-EVAL）**

| 指标 | 运算符 | 阈值 | 聚合方式 |
| --- | --- | ---: | --- |
| `death_rate` | `≤` | **0.00** | 跨 P3-EVAL 样本 |
| `death_without_warning_count` | `=` | **0** | 跨 P3-EVAL 样本（US-006 起 enforce） |

### 3.2 Romance / family achievement（`romance_family_achievement_rate`）

| 维度 | 规则 |
| --- | --- |
| **语义** | 样本终态满足：有 spouse **或** `children > 0`（与现有 experience gate 一致） |
| **P3-RF 主样本** | US-010 样本 **必须** 达成 achievement → 该样本 **blocker** if fail |
| **P3-EVAL 聚合** | **≥ 0.20**（至少 1/5 样本达成；US-010 落地后评估集为 5 个 golden + romance 样本） |
| **优先路线** | `golden-sect` / `golden-wanderer` / `golden-demonic` 中 **至少 1 条** 在 0–50 deterministic 路径上可达 achievement（US-009）；未要求三条都达成 |
| **P2-LEGACY** | 保持 `min=0.05, max=0.7` 为 **info/warning**；**不**作为 P3 完成阻断条件 |
| **基线对照** | W2：`0/6` on P2-LEGACY；`lover_mingyue` 不计入 achievement |

**冻结数值（P3-EVAL）**

| 指标 | 运算符 | 阈值 | 备注 |
| --- | --- | ---: | --- |
| `romance_family_achievement_rate` | `≥` | **0.20** | US-029 起 blocker |
| `romance_family_primary_sample_pass` | `=` | **true** | P3-RF 单样本，US-010 起 blocker |

### 3.3 Simulated key-choice payoff rate

| 维度 | 规则 |
| --- | --- |
| **阈值常量** | **0.70**（与 `golden-line-payoff-map.json` → `summary.threshold` 一致） |
| **静态 map** | 全表 `payoffRate ≥ 0.70` → 已为 **blocker**（保持） |
| **仿真 payoff** | 按样本：`hits / keyChoicesMade ≥ 0.70` |
| **P3 完成态** | `golden-sect`, `golden-wanderer`, `golden-demonic`：仿真 payoff **blocker** if `< 70%` |
| **neutral** | `golden-neutral-baseline`：US-014 前 **warning**；US-029 前须 **≥ 70%** 或经 US-015/016 明确 neutral 终态不得互斥路线后升为 blocker |
| **0–30 vs 31–50** | US-017 后报告分列；**任一分段** priority-route 样本低于 70% 即 fail（防止中年段吞噬青年 payoff） |
| **基线对照** | W3–W6：四样本 25%–50%，静态 100% |

**冻结数值**

| 指标 | 运算符 | 阈值 | 适用样本 |
| --- | --- | ---: | --- |
| `static_payoff_rate` | `≥` | **0.70** | 全局 map |
| `simulated_payoff_rate` | `≥` | **0.70** | 每 P3-GL priority-route + 聚合加权（见 §5） |
| `simulated_payoff_rate` | `≥` | **0.70** | `golden-neutral-baseline`：US-029 **blocker** |

### 3.4 Route contradiction（`strong_exclusion`）

| 维度 | 规则 |
| --- | --- |
| **语义** | `route-conflict-table.json` 中 `level=strong_exclusion` 的两条路线在 `active` lifecycle 同时成立 |
| **P3 完成态** | P3-EVAL 终态 **contradiction count = 0**（**blocker**） |
| **priority-route 样本** | 已为 **blocker**（保持） |
| **neutral** | 基线 W7：`sect` + `demonic` 并存 → US-016 修复后不得再出现；US-029 起与 priority 同等级 **blocker** |
| **P2-LEGACY** | 无 contradiction gate warning 时 **不** 新增阻断；`official-track` 多路线并存记入 audit（US-015），非 P3-EVAL 标准 |
| **rate 指标** | 使用 **计数** `route_contradiction_count`，目标 **0**；不用比例 |

**冻结数值（P3-EVAL 终态）**

| 指标 | 运算符 | 阈值 |
| --- | --- | ---: |
| `route_contradiction_count` | `=` | **0** |

---

## 4. Warning → Blocker 决策

### 4.1 必须在 P3 升级为 blocker 的 warning

| ID | 原信号 | 升级时机 | 阻断队列 | 理由 |
| --- | --- | --- | --- | --- |
| **B1** | 仿真 payoff &lt; 70%（W3–W6） | **US-014** 落地 gate；**US-029** 全面 enforce | `golden-sect`, `golden-wanderer`, `golden-demonic` | 静态 map 全绿掩盖玩家无记忆；信任核心 |
| **B2** | neutral 路线矛盾（W7） | **US-016** 修复后 **US-029** enforce | `golden-neutral-baseline` | 互斥身份同时 active 破坏路线可信度 |
| **B3** | `romance_family_achievement_rate` 过低（W2） | **US-029** | P3-RF + P3-EVAL 聚合 | PRD FR-4：至少一条 0–50 情感线可达 |
| **B4** | 0–50 无预警死亡 | **US-006** 起 | P3-GL / P3-RF | 「可读可规避」死亡为 P3 明确目标 |
| **B5** | 未存活至 50 岁 | **US-017** 起（终点年龄变更） | P3-GL / P3-RF | 与 §3.1 连续性一致 |

### 4.2 保持 non-blocking 的 warning / 信号

| ID | 信号 | 严重度 | 原因 |
| --- | --- | --- | --- |
| **N1** | P2-LEGACY `death_rate=1.0`（W1） | warning | `runUntilDeath=true` 设计导致必死；非 0–50 信任队列 |
| **N2** | P2-LEGACY `romance_family_achievement_rate=0` | info/warning | 样本未优化情感线；P3 以 P3-RF 为准 |
| **N3** | `golden-neutral-baseline` 仿真 payoff &lt; 70% | warning 直至 US-014 | neutral 多路线探测样本；与 B1 并行，优先修 contradiction 再收紧 payoff |
| **N4** | Active-scope 质量汇总（81 issues；deferred/candidate major+） | warning 汇总 | 内容债与 deferred 资产；非四类信任指标（US-001 §3.5） |
| **N5** | `auto_event_rate`, `route_completion_rate`, `formal_event_ratio` 等 | warning | 基线已 PASS；非 P3 信任主因 |
| **N6** | `ending_distribution` 单结局 &gt; 70% | info | 观察多样性；P3 不改为 blocker |
| **N7** | P2-LEGACY 终态多路线并存（如 official-track） | 无 gate warning | 不在 P3-EVAL；由 US-015 audit，不阻塞 P3 交付 |

### 4.3 分阶段 enforce 一览

| 阶段 | Story | 新 enforce 的 blocker |
| --- | --- | --- |
| 当前 → US-013 | — | 静态 payoff、priority-route contradiction、continuity（30 岁） |
| US-014 | Harden Payoff Gate | B1（priority-route 仿真 payoff） |
| US-006 | Tune Death Risk | B4 |
| US-016 | Fix Route Contradictions | B2（neutral 终态） |
| US-017 | Extend Simulation 31–50 | B5（终点 50）、分段 payoff 报告 |
| US-029 | Update Experience Gates | B3、B1 全覆盖、neutral 仿真 payoff（B1 扩展） |

---

## 5. 0–50 Deterministic 场景目标态

### 5.1 样本清单（目标）

| Sample ID | Route track | Seed | 终点年龄 | 角色 |
| --- | --- | ---: | ---: | --- |
| `golden-sect` | sect | 301 | **50** | 正统/门派中年弧（US-018/019） |
| `golden-wanderer` | wanderer | 302 | **50** | 游侠中年弧（US-020/021） |
| `golden-demonic` | demonic | 303 | **50** | 魔道中年弧（US-022/023） |
| `golden-neutral-baseline` | — | 304 | **50** | 无路线偏置基线；终态 **无 strong_exclusion 矛盾** |
| `golden-romance-family` | （US-010 定义） | TBD | **50** | 情感/家庭达成回归样本 |

基线（US-001）为 0–30、4 样本；US-017 将 `GOLDEN_LINE_END_AGE` 提升至 **50** 并扩展 payoff map 至 0–50（US-011/012/013）。

### 5.2 分段指标（US-017 后必填）

对每个 P3-GL / P3-RF 样本，仿真报告须包含：

| 分段 | 年龄 | 必填输出 |
| --- | --- | --- |
| **Youth** | 0–30 | event/choice 计数、route state、simulated payoff、contradiction |
| **Midlife** | 31–50 | 同上 + relationship state、death status、payoff status |

**Midlife 内容下限**（US-024 gate；内容指标引用 PRD，阈值不在此重复）：

- 每条 priority route：31–50 内 ≥ **3** 条路线相关事件、≥ **2** 次手动选择、≥ **2** 处对 0–30 状态/选择的 callback。

### 5.3 P3-EVAL 聚合通过条件（US-029 门禁摘要）

全部满足方可称 P3 信任目标达成：

1. **Death**：P3-EVAL `death_rate = 0`；`death_without_warning_count = 0`。
2. **Romance/family**：P3-RF 主样本 pass；`romance_family_achievement_rate ≥ 0.20`。
3. **Payoff**：静态 map ≥ 70%；priority-route 各样本 simulated payoff ≥ 70%（0–30 与 31–50 分段均 ≥ 70%）；US-029 起 neutral ≥ 70%。
4. **Route**：P3-EVAL `route_contradiction_count = 0`。
5. **Continuity**：`finalAge = 50` 且 `isAlive = true`（全体 P3-EVAL）。

### 5.4 与 US-001 warning 的映射

| Baseline ID | P3 目标态 |
| --- | --- |
| W1 | 仅 P2-LEGACY warning；P3-EVAL death_rate = 0 |
| W2 | P3-RF pass + 聚合 ≥ 20% |
| W3–W6 | priority-route simulated ≥ 70%（blocker） |
| W7 | neutral 终态 contradiction = 0 |

---

## 6. 下游 Story 引用索引

| Story | 引用本文章节 |
| --- | --- |
| US-004 Define Death Risk Design Rules | §3.1, §4.1 B4 |
| US-006 Tune Early and Midlife Death Risk | §3.1, §4.1 B4, §5.3-1 |
| US-009/010 Romance Family | §3.2, §5.1 P3-RF |
| US-012/013/014 Payoff | §3.3, §4.1 B1, §5.2 分段 |
| US-015/016 Route Contradiction | §3.4, §4.1 B2 |
| US-017 Extend Simulation 31–50 | §5.1–5.2 |
| US-024 Add 0-50 Midlife Gate | §5.2–5.3 |
| US-029 Update Experience Gates | §4.3, §5.3 全文 |

**Gate 实现约定（供 US-014/029）**

- 配置键建议：`p3TrustTargets` 或引用本文路径；阈值以 §3 表格为准。
- 失败输出须含：`sampleId`, `metric`, `actual`, `threshold`, `segment`（`0-30` | `31-50` | `full`）。
- `gate:experience` 子门禁应标注评估队列 `P3-EVAL` vs `P2-LEGACY`。

---

## 7. US-002 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Define thresholds for death, romance/family, simulated payoff, route contradiction | done — §3 |
| Define which warnings become blockers during P3 | done — §4.1, §4.3 |
| Define non-blocking warnings and why | done — §4.2 |
| Document 0-50 deterministic scenario target state | done — §5 |
| Typecheck passes | 见 CI 记录（`npm run typecheck`） |
| No local absolute paths in doc | done |

---

## 8. 开放项（不阻塞 US-002）

| 项 | 处置 |
| --- | --- |
| `golden-romance-family` 的 seed / 选题策略 | US-010 冻结；本文用占位 id |
| neutral 是否在 US-014 即升为 payoff blocker | 默认 US-029；若 US-016 提前消除 W7 可提前收紧（§4.3） |
| Payoff map 扩展至 31–50 的 key choice 列表 | US-011/012/013 |

---

*P3-W0 / US-002 — 2026-05-31*
