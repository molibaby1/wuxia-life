# P86 Medical Pressure Design-First Closure Report

> **Date:** 2026-06-29
> **Stage:** P86 Wuxia Medical Pressure Design-First
> **Branch:** `codex/p86-wuxia-medical-pressure-design-first`
> **Type:** Closure — design-only, zero runtime changes
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)
> **Input from:** P85 on-ramp spine complete + P85 closure report GO recommendation
> **Reference Pattern:** P74 renown pressure design-first (proven methodology)

---

## 1. Executive Summary

P86 takes the `medical_sage_healer` route through its pressure-stage design-first contract — defining pressure directions (2 variants), pressure contract, and P87 validation expectations **before any runtime implementation begins**.

Following the same pattern as P74 (renown pressure design-first), P86 is a documentation-only stage. Zero runtime code, config, or test changes.

**Core outputs:**
- ✅ Prerequisite audit — 3-stage foundation verified (bridge + entry + on-ramp); 10+ flags/markers inventoried; 3 events cataloged; 7 expression surfaces mapped; 2 variant-specific pressure prerequisites analyzed
- ✅ Scope contract — 6 allowed layers, 14 forbidden expansions, 5 scope guardrails
- ✅ Pressure direction comparison (per variant) — Compassionate: 3 candidates (仁心耗尽 🥇, 药材告急 🥈, 被利用善心 ❌); Pragmatic: 3 candidates (人情债缠身 🥇, 选边站 ❌, 名声与利益冲突 🥈)
- ✅ Pressure contract (2 variants) — Compassionate: burnout direction; Pragmatic: favor debt direction; shared checkpoint + variant markers; 5 expression surfaces each; payoff flags reserved
- ✅ P87 validation shape — ~26 targeted proof nodes (12 core), ~30-35 regression assertions, 12 closure criteria
- ✅ Closure report (this document)

**Selected pressure directions:**
- **Compassionate variant:** 仁心耗尽 / 身体垮掉 (Burnout) — 向内的压力，自我消耗
- **Pragmatic variant:** 人情债缠身 (Favor Debt Entanglement) — 向外的压力，社会束缚

**Why design-first (not implementation-first):** Medical route has 2 variants, each needing its own pressure direction. Design-first ensures we select the right direction per variant before writing code, maintains consistency with the renown methodology, and gives P87 clear, bounded deliverables.

---

## 2. Deliverables Inventory

### 2.1 Audit and Scope

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Prerequisite audit | `docs/test-reports/p86-medical-pressure-prerequisite-audit.md` | P86-001 | ✅ Done |
| Scope contract | `docs/test-reports/p86-medical-pressure-scope-contract.md` | P86-002 | ✅ Done |

### 2.2 Design and Contract

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Pressure direction comparison (per variant) | `docs/test-reports/p86-medical-pressure-direction-comparison.md` | P86-003 | ✅ Done |
| Pressure contract (2 variants) | `docs/PRD/p86-medical-pressure-contract.md` | P86-004 | ✅ Done |
| P87 validation shape | `docs/test-reports/p86-p87-validation-shape.md` | P86-005 | ✅ Done |

### 2.3 Closure

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Closure report | `docs/test-reports/p86-medical-pressure-closure-report.md` | P86-006 | 📌 This document |

### 2.4 Runtime Changes

| File | Change | Nature |
|------|--------|--------|
| None | — | P86 is documentation-only; zero runtime behavior changes |

### 2.5 Validation

| Check | Result | Notes |
|-------|--------|-------|
| Typecheck | ✅ Not needed | Documentation-only stage — no code changes |
| prd.json valid JSON | ✅ Pass | Valid structure, all 6 stories `passes: true` |
| All 6 stories complete | ✅ Pass | P86-001 through P86-006 |
| Zero runtime changes | ✅ Pass | No files under `src/data/` or `src/core/` modified |
| Renown route untouched | ✅ Pass | No renown route files modified |
| Merchant route untouched | ✅ Pass | No merchant route files modified |

---

## 3. Prerequisite Audit Summary

### 3.1 What Already Exists (Before Pressure)

Medical route has completed **3 stages** of tavern-born playable content:

| Stage | Status | Key Deliverables |
|-------|--------|-----------------|
| **P83 Bridge** | ✅ Complete | Bridge event + 2 variants (compassionate/pragmatic) + 3 expression surfaces |
| **P84 Entry Differentiation** | ✅ Complete | 7 expression surfaces + 2-variant differentiation + route label system |
| **P85 On-Ramp Spine** | ✅ Complete | 2 auto events + 4 expression surfaces + 8 variant branches |

**Key assets inventoried:**
- 10+ flags/markers (bridge + on-ramp + variant markers)
- 3 sample-line events (bridge + 2 on-ramp variants)
- 7 expression surfaces (sample line + ordinary origin)
- 2 clearly differentiated variants with distinct pressure hooks

### 3.2 Pressure Readiness

**Pressure readiness: HIGH**

The foundation is solid:
- ✅ Clear checkpoint gating (`medical_on_ramp_done` + variant markers)
- ✅ Narrative hooks already planted in on-ramp events for both variants
- ✅ Sample-line spine pattern proven (renown pressure as precedent)
- ✅ 7 established expression surfaces ready for pressure updates

---

## 4. Scope Contract Summary

### 4.1 Allowed Layers (6)

1. **Gap audit / prerequisite analysis** — 摸清家底
2. **Scope contract** — 锁定边界
3. **Direction comparison / selection** — 选定方向（per variant）
4. **Pressure contract definition** — 定义契约
5. **Validation shape definition** — 锁定验证形状
6. **Closure report / handoff** — 汇总收口

### 4.2 Forbidden Expansions (14)

1. Runtime event wiring — no config or code changes
2. Runtime expression updates — design-first 不改表达层代码
3. New framework / system — 不建新系统
4. Bulk content wave — 不批量新增事件
5. Payoff stage design — pressure 不越界到 payoff
6. Late identity deepening — age-40 identity 属 payoff 阶段
7. Poison path (毒医路线) — 不在范围内
8. Plague hero / medical pure full 抉择 — defer 到 pressure 之后
9. Other origins (farm/town/apprentice) — 仅 tavern_hand
10. Full medical route lifecycle planning — bounded design-first
11. Stat threshold gate validation — 不做阈值验证
12. Cross-route interactions — 不设计跨路线交互
13. New UI components — 只复用现有表达面
14. Orthodox/demonic childhood seeds — 仅普通出身路线

### 4.3 Scope Guardrails (5)

1. **Zero runtime changes** — `src/` 目录零改动
2. **Single direction per variant** — 每 variant 只选 1 个方向
3. **No payoff leakage** — 只为 payoff 预留 flag 接口，不深入细节
4. **Tavern-born healer flavor first** — 所有设计必须通过风味检查
5. **Two-variant differentiation** — 两个 variant 必须有本质差异

---

## 5. Pressure Direction Comparison Summary

### 5.1 Compassionate Variant

| Direction | Score | Verdict |
|-----------|-------|---------|
| **A: 仁心耗尽 / 身体垮掉 (Burnout)** | ⭐⭐⭐⭐⭐ | 🥇 **RECOMMENDED** |
| B: 药材告急 (Herb Shortage) | ⭐⭐⭐⭐ | 🥈 Alternate |
| C: 被利用善心 (Exploited Kindness) | ⭐⭐⭐ | ❌ Rejected |

**Why burnout wins:**
- 最符合 compassionate variant 身份（只有仁心医者才会把自己累垮）
- 与 on-ramp 衔接最顺（"身子撑不了多久" → 累倒）
- 最有记忆点（累倒在药庐里）
- 最 bounded（1 事件 + 2-3 表达更新）
- 与其他路线区分最清晰（身体债 vs 人情债 vs 金钱债）

### 5.2 Pragmatic Variant

| Direction | Score | Verdict |
|-----------|-------|---------|
| **A: 人情债缠身 (Favor Debt Entanglement)** | ⭐⭐⭐⭐⭐ | 🥇 **RECOMMENDED** |
| B: 名声与利益冲突 (Fame vs Profit) | ⭐⭐⭐⭐ | 🥈 Alternate |
| C: 选边站 (Faction Siding) | ⭐⭐⭐ | ❌ Rejected |

**Why favor debt wins:**
- 最符合 pragmatic variant 身份（只有世故人医才会陷入权贵人情网）
- 与 on-ramp 衔接最顺（"认识了不少有头有脸的人物" → 人情债）
- 最有 tavern-born 特色（酒肆门槛踩平、大户人家管家来请）
- 最 bounded（1 事件 + 2-3 表达更新）
- 与 renown pressure 有区分（medical = 权贵人情，renown = 江湖人情）

### 5.3 Two-Variant Differentiation

两个 variant 的压力方向有本质差异：

| Dimension | Compassionate | Pragmatic |
|-----------|--------------|-----------|
| **压力方向** | 向内（自我消耗） | 向外（社会束缚） |
| **核心主题** | 仁心耗尽、油尽灯枯 | 人情债缠身、世故的重量 |
| **Stats 变化** | constitution ↓（身体垮掉） | connections ↑ 但变成负担 |
| **情绪基调** | 悲壮、令人心疼 | 纠结、令人唏嘘 |
| **Payoff 方向** | 硬扛/放手/传承 | 依附/撕破脸/平衡 |

**结论：不是简单换皮，而是真正的差异化设计。**

---

## 6. Pressure Contract Summary

### 6.1 Flag Flow (Both Variants)

```
medical_on_ramp_done (P85 on-ramp checkpoint)
  + tavern_medical_on_ramp_compassionate / tavern_medical_on_ramp_pragmatic
  ↓
NEW: medical_pressure_compassionate (age 36-40, auto)
  OR medical_pressure_pragmatic (age 37-41, auto)
  ↓
medical_midlife_pressure_done (shared pressure checkpoint)
  + tavern_medical_pressure_compassionate / tavern_medical_pressure_pragmatic
  ↓
[P88+] medical_payoff_done → medical_sage_healer final evaluation
```

### 6.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| 2 separate auto events (not 1 event with branches) | Follows P85 on-ramp pattern; simpler, condition-driven |
| Shared checkpoint + variant markers | Matches renown pattern; enables both shared and variant-specific logic |
| Compassionate: burnout (not herb shortage) | Most variant-specific; best on-ramp hook; most memorable |
| Pragmatic: favor debt (not fame-vs-profit) | Most variant-specific; best on-ramp hook; most tavern-born |
| Compassionate age 36-40 / Pragmatic age 37-41 | Slight stagger reflects different pressure accumulation rates |
| 5 expression surfaces per variant | Follows P75 renown pressure pattern (cost label + current goal ×2 + life memory + summary) |
| Payoff flags reserved only | No payoff design in pressure stage; follows scope contract |
| Tavern-born flavor anchors throughout | Medical route must maintain its unique tavern-small-clinic identity |

### 6.3 Pressure vs. On-Ramp vs. Generic Midlife

**vs On-Ramp:**
- On-ramp = 上升期、第一个里程碑、成就感
- Pressure = 维持期、代价显现、沉重感

**vs Generic Midlife:**
- Generic = 通用中年危机、生计压力
- Medical Pressure = 路线专属（仁心耗尽/人情债）、酒肆小药庐场景、医者身份

**vs Other Routes:**
- Merchant Pressure = 金钱债、经营负担
- Renown Pressure = 江湖人情债、名声负担
- Medical Compassionate = 身体债、仁心耗尽
- Medical Pragmatic = 权贵人情债、世故的重量

---

## 7. P87 Validation Shape Summary

### 7.1 Targeted Proof Chain Nodes (~26 total, 12 core)

**Per variant (6 core nodes each):**
1. Pre-pressure state (on-ramp done, pressure not done)
2. Pressure event fires (correct age range)
3. Pressure checkpoint set (`medical_midlife_pressure_done`)
4. Variant marker set
5. Cost label update (仁心耗尽 / 人情债缠身)
6. Current goal update

**Bonus nodes (P1):**
- Life memory update (2 variants)
- Summary update (2 variants)
- Full chain trace (bridge → entry → on-ramp → pressure)

### 7.2 Regression Assertions (~30-35, 6 groups)

1. **Event wiring** (10 assertions) — 2 events exist, correct conditions, correct age range, correct flags
2. **Pre-pressure state** (4 assertions) — on-ramp state correct before pressure
3. **Post-pressure expression** (10 assertions) — 5 surfaces × 2 variants
4. **Variant differentiation** (4 assertions) — 2 variants are different
5. **Cross-route distinction** (3 assertions) — different from merchant/renown
6. **No regression (P83/P84/P85)** (4+ assertions) — existing stages still work

### 7.3 "Pressure Closed" Criteria (12)

1. Compassionate pressure event fires correctly
2. Pragmatic pressure event fires correctly
3. Shared checkpoint flag set
4. Variant markers set correctly
5. Cost label updates (both variants)
6. Current goal updates (both variants)
7. Two-variant differentiation verified
8. Tavern-born healer flavor consistent
9. No P83/P84/P85 regressions
10. Typecheck passes
11. Sample-lines-baseline guard passes
12. Payoff flag interfaces reserved

---

## 8. Boundary Between P86 and P87

### 8.1 What P86 Completes

- ✅ Prerequisite audit of existing medical pressure assets
- ✅ Scope contract for the design-first stage
- ✅ Pressure direction comparison + recommendation (2 variants)
- ✅ Pressure contract definition (events, flags, expression, payoff reservation)
- ✅ P87 validation shape (proof chain, test matrix, closure criteria)
- ✅ Closure report (this document)
- ✅ Zero runtime changes (documentation-only)

### 8.2 What P87 Takes Over

**P87 = Playable pressure implementation for medical_sage_healer**

Following the same pattern as P75 (renown pressure implementation):

1. Add 2 pressure auto events to `sample-lines-spine.json` (compassionate + pragmatic)
2. Add pressure flags (`medical_midlife_pressure_done` + 2 variant markers)
3. Add pressure expression branches (5 surfaces × 2 variants)
4. Write targeted proof document (12+ core nodes)
5. Write regression tests (~30-35 assertions)
6. Run typecheck + regression suites
7. Write closure report

P87 is the first implementation stage for pressure. P86 hands it a complete, unambiguous contract.

### 8.3 What P86 Does NOT Do

- ❌ No runtime pressure implementation
- ❌ No payoff stage design (beyond flag reservation)
- ❌ No late-life / endgame content
- ❌ No other origins (farm_peasant, town_apprentice)
- ❌ No poison path as main route
- ❌ No new systems (clinic management, herbalism system, etc.)
- ❌ No renown/merchant route modifications
- ❌ No full medical route lifecycle planning

---

## 9. Deferred Items

The following items remain deferred — they are explicitly out of scope for P86 and should not be picked up in P87 either unless a separate stage is approved:

| Item | Reason Deferred | Priority for Future |
|------|-----------------|---------------------|
| Payoff stage design | Pressure stage only; payoff has its own design-first cycle | High — P88 payoff design-first after P87 |
| Herb shortage pressure direction | Alternate for compassionate; burnout is primary | Medium — revisit if burnout proves insufficient |
| Fame-vs-profit pressure direction | Alternate for pragmatic; favor debt is primary | Medium — revisit if favor debt proves insufficient |
| Exploited kindness pressure direction | Not medical-core enough; too generic | Low |
| Faction siding pressure direction | Too generic jianghu; scope too large | Low |
| Farm_peasant medical pressure | No farm_peasant medical bridge yet | Low–Medium — after farm_peasant medical bridge exists |
| Town_apprentice medical pressure | No apprentice medical bridge yet | Low — after 1-2 medical origins proven |
| Poison path (`medical_poison_path`) as main route | Alternative medical route, not focus of this stage | Low–Medium — could be future "dark healer" route |
| Full medical system / herbalism system / clinic management | Platform-level change — dwarfs pressure scope | Very low — not on current roadmap |
| Medical × merchant / renown cross-route interactions | Cross-route design is far future | Very low |
| Orthodox/demonic childhood seed medical route | Only tavern-born ordinary origin in scope | Low |

---

## 10. Story Completion

| Story | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| P86-001 | Audit medical pressure prerequisites | ✅ Pass | Prerequisite audit — 8 sections, existing assets inventoried, gaps mapped, variant prerequisites analyzed |
| P86-002 | Lock P86 scope contract | ✅ Pass | Scope contract — 6 allowed layers, 14 forbidden expansions, 5 guardrails, NO-GO conditions |
| P86-003 | Compare medical pressure directions (per variant) | ✅ Pass | Direction comparison — 3 candidates per variant, 1 selected each, differentiation verified |
| P86-004 | Define medical pressure contract | ✅ Pass | Pressure contract — 2 events, shared checkpoint + variant markers, 5 expression surfaces each, payoff reservation |
| P86-005 | Define P87 validation shape | ✅ Pass | Validation shape — ~26 proof nodes, ~30-35 assertions, 12 closure criteria, regression boundaries |
| P86-006 | Produce P86 closure report | ✅ Pass | This document |

**All 6 stories complete. P86 execution complete.**

---

## 11. Success Criteria Recap

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Repo has medical pressure design-first truth source (2 variants) | ✅ Met | Pressure contract + prerequisite audit + scope contract + comparison + closure report |
| Pressure contract is unambiguous | ✅ Met | Explicit checkpoint, flags, events, expression updates, 2 variants clearly differentiated |
| Each variant has 1 clear pressure direction | ✅ Met | Compassionate = 仁心耗尽; Pragmatic = 人情债缠身 |
| Proof/test expectations fixed in advance | ✅ Met | P87 validation shape document — ~26 nodes, ~30-35 assertions, 12 criteria |
| P87 can proceed without ambiguity | ✅ Met | Complete contract + validation shape + clear P86/P87 boundary |
| No scope creep into implementation | ✅ Met | Zero runtime changes; all deliverables are documentation-only |
| At least 2 directions compared per variant | ✅ Met | 3 candidates per variant compared |
| Quality-first priority followed | ✅ Met | Evidence strength → implementation risk → methodology fit → value density |
| Methodology consistency with renown | ✅ Met | Same stage structure, same pressure pattern, same validation approach |
| Tavern-born healer flavor preserved | ✅ Met | All designs pass flavor checklist; 酒肆小药庐底色贯穿 |
| Two-variant differentiation maintained | ✅ Met | Compassionate = 向内消耗; Pragmatic = 向外束缚; 本质差异 |
| Renown/merchant routes regression clean | ✅ Met | No renown/merchant route files modified |

---

## 12. GO / NO-GO Recommendation

### 12.1 GO Criteria Check

| GO Criterion | Status |
|--------------|--------|
| On-ramp foundation is solid | ✅ Pass — P85 complete and verified |
| Clear pressure direction selected per variant | ✅ Pass — 2 variants each have 1 recommended direction |
| Pressure contract is well-defined | ✅ Pass — events, flags, expression, payoff reservation all specified |
| P87 validation shape is fixed | ✅ Pass — proof nodes, test assertions, closure criteria all defined |
| No major risks or blockers | ✅ Pass — all risks identified and mitigated |
| Scope is bounded and small-step | ✅ Pass — 2 auto events + expression updates; zero new systems |

### 12.2 Final Recommendation

**✅ GO — Recommend entering P87 pressure implementation stage**

The design-first contract is complete, unambiguous, and well-bounded. Both variants have clear pressure directions with strong tavern-born healer flavor and clear differentiation. P87 has a complete contract and validation shape to work from.

The foundation is strong, the direction is clear, and the risk is low. P87 can proceed with confidence.

---

## 13. Final Takeaway

P86 does for `medical_sage_healer` pressure what P74 did for `jianghu_renown_sage` pressure: it takes a route through its pressure-stage design-first contract, selecting the right direction and defining clear implementation targets — before writing any runtime code.

The key insight is that **medical pressure has 2 distinct flavors**, one for each variant:
- **Compassionate = 仁心耗尽** — 向内的压力，自我消耗，悲壮
- **Pragmatic = 人情债缠身** — 向外的压力，社会束缚，纠结

This is the first route with 2 clearly differentiated pressure directions. It tests whether the renown methodology generalizes not just across routes, but across variants within a route. If it works, we'll have strong evidence that the design-first pattern is robust enough for multi-variant routes.

**P86 design-first contract complete. P87 can pick up the contract and build the playable pressure. P86 done.**

---

**P86-006 complete.** Closure report saved.
