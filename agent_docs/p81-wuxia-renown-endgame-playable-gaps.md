# P81 Discovery Gaps Report

> **Stage:** P81 — jianghu_renown_sage Endgame (身后名之声)
> **Discovery mode:** post-run, pipeline-auto
> **Generated:** 2026-06-29

---

## 1. Stage Status: CLEAR

P81 所有 7 个 user stories 均已完成并标记 `passes: true`：

| Story | Status | Notes |
|-------|--------|-------|
| P81-001 Wire renown endgame echo event | ✅ Pass | 3 endgame echo events wired in sample-lines-spine.json |
| P81-002 Endgame expression — sample line core | ✅ Pass | Cost label + current goal updated for 3 variants |
| P81-003 Endgame expression — endgame identity | ✅ Pass | renownAge40Identity() extended with endgame variants |
| P81-004 Endgame expression — ordinary origin | ✅ Pass | Current goal + life memory + summary updated |
| P81-005 Targeted endgame proof | ✅ Pass | 7 core nodes + 7 bonus nodes verified |
| P81-006 Narrow regression coverage | ✅ Pass | ~30 assertions in 9 groups, all passing |
| P81-007 P81 closure report | ✅ Pass | Renown route fully closed |

**Renown route 完整闭合：**
```
Bridge (P70-P71) → Entry (P72) → On-ramp (P73) → Pressure (P74-P75)
  → Payoff (P76-P77, 3 choice) → Late-life (P78-P79, 3 branches)
  → Endgame (P80-P81, 3 variants)
```

共 12 个阶段（P70-P81），1 条完整成就线，3 个 payoff choice × 3 个 late-life/endgame 分支。

### In-Stage Gaps: NONE

P81 范围（lightweight endgame echo + expression updates）已完全闭合，无遗留 gap 需要放入当前 stage。

---

## 2. End-State Status: OPEN

对照 North Star §8 Discovery 完成判定，仍有以下 OPEN 项：

### END-001: 主流成就可玩样本不足（2/5 条完整线）
- **Severity:** High
- **North Star ref:** §8 第 1 条
- **现状:**
  - ✅ `jianghu_renown_sage` — 完整 sample-line 路线（P70-P81）
  - ⚠️ `grandmaster_guardian` — P16 遗留配置 + orthodox 部分事件，无完整 sample-line
  - ⚠️ `sect_leader_statesman` — P16 遗留配置 + orthodox 部分事件，无完整 sample-line
  - ⚠️ `lone_sword_legend` — P16 遗留配置 + demonic 部分事件，无完整 sample-line
  - ⚠️ `medical_sage_healer` — 配置定义 + P27/P29 habit-led 事件 + P33 短链验证，无完整 sample-line
- **Gap:** 主流成就 5 条中仅 1 条（renown）有完整可玩的 sample-line 全生命周期
- **North Star 要求:** 主流成就有"可玩样本且规则文档化"
- **最小可接受:** 至少 2 条主流成就有完整可玩路线（renown + 1 条）

### END-002: 巅峰成就无可玩样本
- **Severity:** Medium
- **North Star ref:** §8 第 1 条、§3.2
- **现状:**
  - `jianghu_myth_legend` — 配置定义存在，无专门实现
  - `founding_patriarch` — 配置定义存在，无专门实现
  - 无双门槛（运气+选择）的 sample-line 验证
- **Gap:** 巅峰成就仅有配置定义，无可玩样本或专门验证
- **Note:** Wave 2 内容，优先级低于主流成就补齐

### END-003: 混合成就仅部分可玩
- **Severity:** Medium
- **North Star ref:** §8 第 1 条、§3.3
- **现状:**
  - `merchant_magnate` — 有部分 sample-line（on-ramp/pressure/payoff）
  - `healer_swordsman` — 配置定义存在，无专门实现
  - `merchant_martial_patron` — 配置定义存在，无专门实现
- **Gap:** 混合成就 3 条中仅 1 条有部分实现
- **Note:** Wave 3 内容，优先级低于主流成就补齐

### END-004: 后果链零矛盾未全量验证
- **Severity:** Medium
- **North Star ref:** §8 第 3 条
- **现状:**
  - P36 后果一致性切片（早期版本）
  - P39 内容池一致性切片（早期版本）
  - Renown 路线新增大量内容（P70-P81）后未重新全量验证
- **Gap:** 新增内容后的后果链一致性未系统验证
- **Note:** 可在第二条成就线完成后统一做 reconciliation 阶段

### END-005: 模拟门禁未覆盖新成就线
- **Severity:** Medium
- **North Star ref:** §8 第 4 条
- **现状:**
  - P30-P35 habit-led 模拟基线（早期版本）
  - P25 基础模拟基线
  - Renown 路线（P70-P81）新增后未更新完整模拟门禁
- **Gap:** 新增成就线未纳入模拟门禁验证
- **Note:** 可在 2 条以上主流成就线完成后统一完善

### END-006: 平凡出身中期深度不足
- **Severity:** Low
- **North Star ref:** §8 第 2 条、§3.4
- **现状:**
  - ✅ 3 种平凡出身已定义（farm_peasant / town_apprentice / tavern_hand）
  - ✅ 早期可区分性已验证（P56）
  - ✅ tavern_hand 有完整 renown 路线（P59-P81）
  - ⚠️ farm_peasant 仅有 bridge 阶段（P61）
  - ⚠️ town_apprentice 仅有 bridge 阶段（P58）
- **Gap:** 平凡出身 3 种中仅 1 种（tavern_hand）有完整中晚期路线
- **Note:** 数量要求（≥3种）已满足早期可区分性，但中期深度不足

---

## 3. Gap Routing

| Gap ID | Route to | Rationale |
|--------|----------|-----------|
| END-001 主流成就不足 | **next-stage** | 需要第二条完整成就线，超出 P81 范围 |
| END-002 巅峰成就 | deferred (Wave 2) | Wave 2 内容，优先级低于主流成就补齐 |
| END-003 混合成就 | deferred (Wave 3) | Wave 3 内容，优先级低于主流成就补齐 |
| END-004 后果链验证 | deferred (reconciliation) | 可在更多内容完成后统一验证 |
| END-005 模拟门禁 | deferred | 可在 2 条以上成就线完成后统一完善 |
| END-006 平凡出身中期深度 | deferred | 数量要求已基本满足，深度可后续扩展 |

**Next-stage 选择：** `medical_sage_healer` bridge + entry design-first contract

**选择理由（quality-first + smallest viable step）：**
1. 直接满足 North Star §8"主流成就至少 2 条可玩"的最紧迫 gap
2. medical_sage_healer 已有坚实基础：配置定义 + P27/P29 habit-led 事件 + P33 短链验证
3. 与 renown 路线形成"非 martial 单轴"的双路线对照（声望线 vs 医术线）
4. 复用已验证的 design-first → implementation 方法论
5. 最小可行步骤：先做 bridge + entry contract，再逐步扩展

**放弃的选项：**
- **B (renown 扩展到其他出身):** 有价值但不是硬指标，1 条完整线先证明方法论
- **C (后果链 reconciliation):** 重要但可在更多内容完成后统一做
- **D (模拟门禁完善):** 可在第二条成就线完成后一并纳入

---

## 4. Spawned Next Stage

- **Stage slug:** `p82-wuxia-medical-sage-bridge-design-first`
- **PRD path:** `docs/PRD/p82-wuxia-medical-sage-bridge-design-first.md`
- **PRD JSON path:** `docs/PRD/p82-wuxia-medical-sage-bridge-design-first.prd.json`
- **Stage type:** bounded design-first contract stage for medical_sage_healer bridge + entry
- **Queued behind current:** true
