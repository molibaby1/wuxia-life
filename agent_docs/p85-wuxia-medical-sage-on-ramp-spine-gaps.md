# P85 Medical Sage On-Ramp Spine — Gaps & Routing

**Discovery date:** 2026-06-29
**Stage:** p85-wuxia-medical-sage-on-ramp-spine
**North Star ref:** docs/designs/p25-lifetime-simulation-north-star.md §3.1 (Wave 1 mainstream achievements)

---

## 1. Stage Status: CLEAR

P85 所有 8 个 user stories 已完成并通过验证：

| Story | Status | Evidence |
|-------|--------|----------|
| US-001 Gap Audit | ✅ Pass | docs/test-reports/p85-medical-on-ramp-gap-audit.md |
| US-002 Scope Contract | ✅ Pass | docs/test-reports/p85-medical-on-ramp-scope-contract.md |
| US-003 On-Ramp Contract | ✅ Pass | docs/PRD/p85-medical-on-ramp-contract.md |
| US-004 Event Wiring | ✅ Pass | sample-lines-spine.json 新增 2 auto events |
| US-005 Expression Updates | ✅ Pass | 4 expression surfaces × 2 variants = 8 新分支 |
| US-006 Targeted Proof | ✅ Pass | docs/test-reports/p85-medical-on-ramp-targeted-proof.md |
| US-007 Narrow Regression | ✅ Pass | tests/p85TavernHandMedicalOnRampSpineTests.ts (8/8) |
| US-008 Closure Report | ✅ Pass | docs/test-reports/p85-medical-sage-on-ramp-closure-report.md |

**P85 交付内容：**
- 2 个 on-ramp auto events（compassionate / pragmatic）
- 4 个表达面更新（sample-line currentGoal, tavern currentGoal, tavern lifeMemory, tavern summary）
- 2 个 variant 差异化（仁心医者 vs 世故人医）
- 检查点 flags：`medical_on_ramp_done`, `tavern_medical_on_ramp_compassionate`, `tavern_medical_on_ramp_pragmatic`

---

## 2. End-State Status: OPEN

对照 North Star §3.1 中 `medical_sage_healer`（一代名医）的最终目标，当前仅完成了 **entry + on-ramp**，距完整可达成成就还有显著差距。

### 2.1 North Star 要求的成就条件

| 维度 | 要求 | 当前状态 | Gap |
|------|------|----------|-----|
| **声望 reputation** | ≥55 | on-ramp 仅 +4~+6，远不足 | ❌ Need payoff/late-life |
| **资源 resources** | ≥30 | pragmatic 仅 +80 money（一次性），非持续 | ❌ Need sustained resources |
| **关键抉择 1** | `medical_divine_doctor_fame` 或 `medical_imperial` 至少其一 | 均未实现（仅 medical.json 中有传统路径，与 tavern-born 主链解耦） | ❌ Need payoff stage |
| **关键抉择 2** | `medical_plague_hero` 或 `medical_pure`（与毒术线互斥） | 均未在 tavern-born 主链中实现 | ❌ Need pressure stage |
| **武学门槛** | ≤50（非 martial 单轴） | 无需额外实现（tavern-born 天然低武） | ✅ OK |

### 2.2 路线完整度差距（类比 renown 路线阶段）

| Stage | Renown Status | Medical Status | Gap |
|-------|---------------|----------------|-----|
| Bridge | ✅ P71 | ✅ P83 | — |
| Entry Diff | ✅ P72 | ✅ P84 | — |
| On-Ramp | ✅ P73 | ✅ P85 | — |
| **Pressure Design** | ✅ P74 | ❌ 未开始 | **Next Stage** |
| Pressure Impl | ✅ P75 | ❌ 未开始 | P87+ |
| Payoff Design | ✅ P76 | ❌ 未开始 | P88+ |
| Payoff Impl | ✅ P77 | ❌ 未开始 | P89+ |
| Late-Life | ✅ P78/P79 | ❌ 未开始 | P90+ |

---

## 3. Gap Routing

### 3.1 In-Stage (P85) — None

P85 scope 已完全闭合，无遗留 gap 可在当前 stage 内补全。所有未完成项均超出 P85 on-ramp spine 范围。

### 3.2 Next-Stage (P86) — Pressure Design-First

**立即 spawn：P86 Medical Pressure Design-First Contract**

**理由：**
1. 对照 renown 路线模式，on-ramp 之后的标准下一阶段是 pressure design-first
2. P85 closure report 明确建议 pressure stage GO（但需 design-first）
3. Pressure 阶段是成就关键抉择（`medical_plague_hero` / `medical_pure`）的承载层
4. 2 个 variant 在 pressure 层的分化方向需要先设计再实现

**P86 范围（设计，非实现）：**
- 医疗路线 pressure 核心叙事方向选定（compassionate: 身体垮掉/药材告急/被利用善心；pragmatic: 人情债/选边站/名声与利益冲突）
- Pressure 事件触发条件、结构、flag 接口
- Player-facing expression 更新边界
- 为 P87 implementation 提供无歧义输入

### 3.3 Deferred (更远阶段)

| 项目 | 阶段 | 说明 |
|------|------|------|
| Pressure runtime implementation | P87+ | 待 P86 design 完成后 |
| Payoff design-first | P88+ | 神医名声 / 太医线的方向选定 |
| Payoff implementation | P89+ | 成就关键抉择的落地 |
| Late-life / endgame | P90+ | 终局表达与回响 |
| 其他出身扩展（farm_peasant, town_apprentice） | Wave 4+ | 非 Wave 1 范围 |
| 毒医路线（poison path） | Wave 3+ | 混合成就波次 |
| 医武双绝（healer_swordsman） | Wave 3+ | 混合成就 |

---

## 4. End-State Open Items

- **END-MED-001:** Pressure 阶段缺失 — 医疗路线尚无"代价与压力"层，玩家只有上升没有代价感
- **END-MED-002:** Payoff 阶段缺失 — 尚无神医名声 / 太医线等成就关键抉择的 tavern-born 主链实现
- **END-MED-003:** Late-life / endgame 缺失 — 医疗路线无终局表达
- **END-MED-004:** 其他出身（farm_peasant / town_apprentice）的医疗路线未覆盖
- **END-MED-005:** 毒医路线（poison path）未实现
- **END-MED-006:** 医武双绝等混合成就未实现

---

## 5. Routing Decision

| Gap | Route to | Reason |
|-----|----------|--------|
| Pressure design contract | **P86 (next stage)** | 紧接 on-ramp 的标准下一阶段，design-first 模式 |
| Pressure implementation | P87+ | 待 P86 design 完成 |
| Payoff design + impl | P88+ | Pressure 之后的标准阶段 |
| Late-life / endgame | P90+ | Payoff 之后 |
| 其他出身 / 毒医 / 混合成就 | Wave 3/4+ | 非 Wave 1 主流成就范围 |

**结论：P85 CLEAR → spawn P86 Medical Pressure Design-First → end_state_status: OPEN**
