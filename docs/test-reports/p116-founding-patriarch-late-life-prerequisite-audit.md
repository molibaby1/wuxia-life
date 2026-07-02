# P116 Founding Patriarch Late-Life Prerequisite Audit

> **Date:** 2026-07-02
> **Stage:** P116 Wuxia Founding Patriarch Late-Life Design-First
> **Route:** `founding_patriarch`（开派祖师）
> **Gaps addressed:** GAP-P115-N01, GAP-P115-N02
> **Story:** P116-001 (read-only; no runtime changes)

---

## 1. Executive Summary

本审计汇总 `founding_patriarch` 路线在 late-life 阶段之前已有的全部基础设施：flags、markers、events、expressions、测试与证明。目的是确保 P116 从 P113/P115 的真实 runtime 出发，而非基于假设设计 late-life。

**结论：** Founding-patriarch 路线已具备进入 late-life 设计的坚实基础——P113 bridge entry/on-ramp、P115 midlife pressure、P113 payoff choice 均已落地。`founding_patriarch_payoff_done` + 双 pressure marker（`rule_first` / `alliance_first`）+ 三选一 payoff marker 作为明确上游 gate；表达面已按 on-ramp / pressure / payoff 阶段分化 goal / cost label / identity。Late-life 阶段缺失的是 late-life 事件、`founding_patriarch_late_life_done` checkpoint、late-life branch marker、late-life 表达更新与 P117 proof。

---

## 2. Existing Founding-Patriarch Route Infrastructure (P113–P115)

### 2.1 Flags & Markers

| Flag / Marker | Set By | Stage | Purpose | Late-Life Relevance |
|---------------|--------|-------|---------|---------------------|
| `p16_scholar_mentor` | P16 scholar line | Pre-bridge | Scholar 变体证据 | 上游 gate（entry 变体） |
| `p22_faction_continuation_active` | P22 faction | Pre-bridge | Faction commitment | 上游 gate |
| `p16_alliance_brokered` | P16 alliance | Pre-bridge | Alliance 变体证据 | 上游 gate |
| `orthodox_childhood_seed_done` | Childhood seed | Pre-bridge | Orthodox 样本线上下文 | Route exclusivity |
| `founding_patriarch_bridge_crossed` | `founding_patriarch_bridge_entry` | P113 entry | Bridge 终态 guard | 上游 |
| `founding_patriarch_on_ramp_done` | entry choices | P113 entry | On-ramp 检查点 | Late-life 间接上游 |
| `founding_patriarch_on_ramp_scholar` | scholar choice | P113 | Scholar 变体 | Late-life 表达修饰参考 |
| `founding_patriarch_on_ramp_alliance` | alliance choice | P113 | Alliance 变体 | Late-life 表达修饰参考 |
| `founding_patriarch_midlife_pressure_done` | `founding_patriarch_midlife_pressure` | P115 | Pressure 检查点 | Payoff 上游；**late-life 分支 key 上游** |
| `founding_patriarch_pressure_rule_first` | pressure choice A | P115 | 守规治学优先 marker | **Late-life Branch A key** |
| `founding_patriarch_pressure_alliance_first` | pressure choice B | P115 | 续盟扩责优先 marker | **Late-life Branch B key** |
| `founding_patriarch_payoff_done` | `founding_patriarch_payoff_echo` | P113 | **Payoff 检查点** | **Late-life 的直接上游 gate** |
| `founding_patriarch_identity_done` | payoff autoEffects | P113 | Identity 终态 | Late-life 表达上游 |
| `founding_patriarch_payoff_resolved` | payoff autoEffects | P113 | Payoff choice 后果总标记 | Late-life 表达辅助 |
| `founding_patriarch_payoff_legacy_holder` | payoff A | P113 | 续责如山 marker | 表达修饰参考（非主分支 key） |
| `founding_patriarch_payoff_independent_founder` | payoff B | P113 | 自立山门 marker | 表达修饰参考 |
| `founding_patriarch_payoff_dual_gate` | payoff C | P113 | 双门并立 marker | 表达修饰参考 |
| `founding_patriarch_late_life_done` | *(reserved, not set)* | P116+ (planned) | Late-life 检查点 | **P117 implementation target** |
| `founding_patriarch_endgame_echo_done` | *(reserved, not set)* | P118+ (planned) | Endgame echo | 远期预留 |

### 2.2 Events

| Event ID | Location | Type | Age Range | Stage |
|----------|----------|------|-----------|-------|
| `founding_patriarch_bridge_entry` | `sample-lines-spine.json` | Choice (2 variants) | 32–38 | P113 entry |
| `founding_patriarch_midlife_pressure` | `sample-lines-spine.json` | Choice (2 branches) | 40–45 | P115 pressure |
| `founding_patriarch_payoff_echo` | `sample-lines-spine.json` | **Choice (3 branches)** v2.0.0 | 48–52 | P113 payoff |

**Payoff 事件详情（P113 已落地，P115 重接 gate）：**
- 触发：`founding_patriarch_midlife_pressure_done` + `!founding_patriarch_payoff_done` + orthodox exclusivity
- 3 条 choice 分支：续责如山 / 自立山门 / 双门并立
- 共享效果：`founding_patriarch_payoff_done` + `founding_patriarch_identity_done` + `founding_patriarch_payoff_resolved` + 对应 payoff marker
- **Gap：** 无 late-life 下游事件；`founding_patriarch_late_life_done` 未接线

**Pressure 事件详情（P115 已落地）：**
- 触发：`founding_patriarch_on_ramp_done` + `!founding_patriarch_midlife_pressure_done`
- 2 条 choice 分支：守规治学优先 / 续盟扩责优先
- 分支互斥：scholar mentor 路径 → rule_first；alliance 路径（无 scholar）→ alliance_first
- **Late-life 分支 key 来源：** pressure marker 而非 payoff marker（与 patron P109 的 payoff-keyed 模式区分）

### 2.3 Pressure Branch State Differences (Post-P115)

| Dimension | rule_first (A) | alliance_first (B) |
|-----------|----------------|-------------------|
| **Choice text** | 先稳门规传承，再补诸派盟约续责 | 先稳诸派盟约续责，再收束门规传承 |
| **Pressure marker** | `founding_patriarch_pressure_rule_first` | `founding_patriarch_pressure_alliance_first` |
| **Cost label** | 门派延续之重 | 门派延续之重（共享） |
| **Current goal** | 先稳门规传承，再承接诸派盟约续责… | 先承接诸派盟约续责，再收束门规传承… |
| **叙事重心** | 内部门规与治学传承优先 | 对外盟约续责优先 |

### 2.4 Payoff Choice State Differences (Post-P113)

| Dimension | legacy_holder (A) | independent_founder (B) | dual_gate (C) |
|-----------|-------------------|-------------------------|---------------|
| **Payoff marker** | `founding_patriarch_payoff_legacy_holder` | `founding_patriarch_payoff_independent_founder` | `founding_patriarch_payoff_dual_gate` |
| **Cost label** | 续责开派之累 | 自立开派之快 | 双门并立之累 |
| **Current goal** | 续责如山，开派名号落在门派与治学一并传承之上 | 自立山门，治学规矩自己定… | 盟约师承各守其份… |
| **Identity** | 续责开派的开宗者… | 自立山门的开派武者… | 双门并立的开宗者… |

Payoff 三选一提供**名号定型**层面的价值判断；pressure 二选一提供**治理次序**层面的负担排序。Late-life 应以 pressure 次序为分支 key（P116 contract 方向），payoff 作为表达修饰层（P117 可选 bonus）。

### 2.5 Expression Surfaces (`src/p50/sampleLineExpression.ts`)

| Surface | Function | Current State (payoff done) | Late-Life Gap |
|---------|----------|----------------------------|---------------|
| Current Goal | `orthodoxCurrentGoal()` | 3 payoff choice goals | 无 `late_life_done` 分支 |
| Cost Label | `deriveSampleLineCostLabel()` | 3 payoff choice labels | 无 late-life label |
| Age-40 Identity | `orthodoxAge40Identity()` | payoff choice + on-ramp variant | 无 late-life identity 深化 |

**Expression priority rules（P115 确认）：**
1. `founding_patriarch_payoff_done` > `founding_patriarch_midlife_pressure_done` > on-ramp
2. Within payoff: payoff choice marker > on-ramp variant
3. Generic orthodox fallback

**Late-life gap：** 表达层无 `founding_patriarch_late_life_done` gate；payoff 表达在 late-life 后不会继续演化。

### 2.6 Tests & Proof Artifacts

| Artifact | Location | Coverage |
|----------|----------|----------|
| P113 bridge tests | `tests/p113FoundingPatriarchBridgeTests.ts` | Entry + payoff wiring |
| P115 pressure tests | `tests/p115FoundingPatriarchMidlifePressureTests.ts` | Pressure gate + branch markers |
| P113 chain proof | `docs/test-reports/p113-founding-patriarch-bridge-chain-proof.md` | On-ramp → payoff chain |
| P115 targeted proof | `docs/test-reports/p115-founding-patriarch-midlife-pressure-targeted-proof.md` | On-ramp → pressure → payoff |
| P115 closure | `docs/test-reports/p115-founding-patriarch-midlife-pressure-closure-report.md` | GO for P116 |
| P37 parity | `tests/p37AdditionalMixedPinnacleParityTests.ts` | Non-regression |
| P102–P112 patron | Various patron tests | Non-regression |
| Typecheck | `npm run typecheck` | ✅ Pass |
| Guard: sample-lines-baseline | `npm run guard:sample-lines-baseline` | ✅ Pass |

---

## 3. What Exists Before Late-Life (Reusable Assets)

### 3.1 Gating Surfaces (可直接复用)

- **Upstream gate:** `founding_patriarch_payoff_done` — P113 payoff 检查点，late-life 事件的直接前置
- **Branch key:** 二选一 `founding_patriarch_pressure_*` marker — late-life 分支逻辑 key（与 patron payoff-keyed 模式区分）
- **Payoff modifier:** 三选一 `founding_patriarch_payoff_*` marker — late-life 表达修饰参考
- **Entry variant markers:** scholar / alliance on-ramp flag — late-life 表达可叠加 entry 风味
- **Terminal guards:** `founding_patriarch_bridge_crossed`、payoff/pressure once guards
- **Route detection:** `detectSampleLine()` → `orthodox` when founding-patriarch markers set on orthodox line

### 3.2 Expression Carriers (late-life 更新载体)

- `orthodoxCurrentGoal()` — P0 late-life signal（按 late-life branch 分化，gate: `late_life_done`）
- `deriveSampleLineCostLabel()` — P0 late-life signal
- `orthodoxAge40Identity()` — P0 late-life identity 深化（late-life marker > payoff marker > on-ramp variant）

### 3.3 Narrative Seeds (pressure + payoff 已埋下)

Pressure 叙事强化：
> 四十岁后，门派香火与治学师承同时压到你肩上。一边是门规续责，另一边是诸派盟约续责。

Payoff 事件文本强化：
> 开宗立派的名号已经传开，但你自己最清楚——这名号是靠门派续责撑住的，还是靠治学盟约撑住的，还是两者之间的某条绳？

On-ramp → pressure → payoff → late-life 因果链已闭合到 payoff；late-life 是自然兑现 pressure 治理次序与 payoff 名号定型的远期后果。

---

## 4. Reserved Flag Status

| Flag | Current Runtime State | P116 Contract Role |
|------|----------------------|-------------------|
| `founding_patriarch_late_life_done` | Not defined in spine; not set anywhere | Late-life 检查点；P117 实施 |
| `founding_patriarch_late_life_identity_done` | Not defined | Late-life 身份深化（推荐，对齐 renown P78 / patron P109） |
| `founding_patriarch_endgame_echo_done` | Not defined | Endgame echo；P118+ 消费 |

---

## 5. What Is Missing (P116 / P117 Target)

| Gap | ID | Description |
|-----|-----|-------------|
| No late-life event | GAP-P115-N01 | Spine 在 payoff 后无 late-life 事件 |
| No late-life checkpoint | GAP-P115-N02 | `founding_patriarch_late_life_done` 未接线 |
| No late-life branch markers | GAP-P116-01 | 无 `founding_patriarch_late_*` choice markers |
| No late-life expression | GAP-P116-02 | goal / cost label / identity 无 late-life 分支 |
| No late-life tests | GAP-P116-03 | 无 late-life 链路 proof 或 regression |

---

## 6. Late-Life Precedent Comparison

### 6.1 Patron Late-Life (P109 — payoff-keyed auto × 3 branches)

| Aspect | Value | Founding-Patriarch Relevance |
|--------|-------|------------------------------|
| Event type | Auto with 3 branches | **结构参考** — auto 后果展开 |
| Core narrative | 商武定型选择的晚年后果 | Founding：门派治理次序的晚年后果 |
| Upstream gate | `merchant_patron_payoff_done` | 对称：`founding_patriarch_payoff_done` |
| Branch key | `merchant_patron_payoff_*` (3) | **Contrast** — founding 用 `pressure_*` (2) |
| Age range | 52–56 | **推荐对齐** |
| Checkpoint | `late_life_done` + `late_life_identity_done` | 对称模式 |

### 6.2 Renown Late-Life (P78 — payoff-keyed auto × 3 branches)

| Aspect | Value | Founding-Patriarch Relevance |
|--------|-------|------------------------------|
| Event type | Auto with 3 branches | 结构参考 |
| Branch key | Payoff choice markers | Founding 用 pressure markers（差异化） |
| Age range | 52–56 | 推荐对齐 |

### 6.3 Precedent Summary

| Dimension | Patron | Renown | Founding-Patriarch (planned) |
|-----------|--------|--------|-------------------------------|
| Payoff 模式 | Choice (3) | Choice (3) | Choice (3) |
| Late-life 模式 | Auto × 3 branches | Auto × 3 branches | **Auto × 2 branches** |
| 分支 key | Payoff markers | Payoff markers | **Pressure markers** |
| 核心 late-life 问题 | 商武定型的晚年 | 人情债的晚年 | **门派治理次序的晚年** |
| 场景 | 账房与演武场 | 酒肆门口 | **山门与书斋** |

**Founding-patriarch 独特机会：** pressure 治理次序（门规优先 vs 盟约优先）在 P115 已分化 goal，late-life 可兑现「守成终老 vs 续责终老」——这是 patron（商武定型）和 renown（人情债）都不具备的开派治理差异化。

**Founding-patriarch 独特约束：** 门派延续 + 治学盟约复合身份意味着 late-life 叙事须同时触及山门治理与书斋传承，不能退化为 generic 正派武者。

---

## 7. Timeline Slot Analysis

当前 founding-patriarch spine 时间线（post-P115）：

```
Age 32–38: founding_patriarch_bridge_entry (on-ramp) ✅ P113
Age 40–45: founding_patriarch_midlife_pressure (pressure) ✅ P115
Age 48–52: founding_patriarch_payoff_echo (payoff choice) ✅ P113
Age 52–56: founding_patriarch_late_life (late-life — planned P117)
```

Patron 参考：payoff 48–52 → late-life 52–56。
Renown 参考：payoff 43–47 → late-life 52–56。
Founding-patriarch：payoff 48–52 → late-life **52–56**（与 patron/renown 对齐）。

---

## 8. Non-Regression Boundaries

P116 / P117 late-life 工作不得破坏：

| Closed Stage | Guard |
|--------------|-------|
| P113 bridge entry + payoff | `p113FoundingPatriarchBridgeTests` |
| P115 pressure | `p115FoundingPatriarchMidlifePressureTests` |
| P37 pinnacle parity | `p37AdditionalMixedPinnacleParityTests` |
| P102–P112 patron spine | Patron test suites |
| Payoff gate / expression | P113/P115 closure criteria |

---

## 9. Audit Conclusion

**Sufficient foundation for late-life design-first contract.**

- ✅ 上游 gate 明确：`founding_patriarch_payoff_done` + 二选一 pressure marker（P115 已接线）
- ✅ Pressure / payoff 表达已分化 goal / cost label / identity
- ✅ Patron P109 auto late-life 模式提供结构参考（分支 key 改用 pressure）
- ✅ P115 closure 明确 defer late-life → P116
- ❌ 缺 late-life 事件、checkpoint、branch markers、late-life 表达 — P117 implementation target
- ⚠️ `founding_patriarch_late_life_done` 需在 P117 首次接线

**P116-001 complete.**
