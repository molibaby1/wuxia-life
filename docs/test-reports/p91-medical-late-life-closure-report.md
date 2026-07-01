# P91 Medical Late-Life Playable Implementation — Closure Report

> **Date:** 2026-06-29
> **Stage:** P91 Wuxia Medical Late-Life Playable Implementation
> **Branch:** `codex/p91-wuxia-medical-late-life-playable-implementation`
> **Type:** Closure — bounded playable implementation
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)
> **Branches:** 2 variants × 3 choices = 6 late-life branches
> **Input from:** P90 late-life contract + P90 closure report GO recommendation
> **Reference Pattern:** P79 renown late-life playable implementation

---

## 1. Executive Summary

P91 takes the `medical_sage_healer` route through its late-life stage playable implementation — turning the P90 design-first contract into actual runtime events, expression updates, targeted proof, and regression tests.

Following the same pattern as P79 (renown late-life implementation), P91 is a bounded implementation stage that strictly follows the P90 contract.

**Core outputs:**
- ✅ 6 late-life auto events wired to `sample-lines-spine.json` (3 compassionate + 3 pragmatic)
- ✅ 6 late-life branches fully implemented (2 variants × 3 choices)
- ✅ 5 expression surfaces × 6 branches = 30 expression updates (cost label, current goal, late-life identity, life memory, origin summary)
- ✅ Targeted proof document (payoff → late-life → expression changes path verification)
- ✅ Narrow regression test suite (~60 assertions across 9 groups)
- ✅ P83/P84/P85/P87/P89 existing evidence does not regress
- ✅ Typecheck passes
- ✅ Closure report (this document)

**6 Late-Life Branches:**

**Compassionate variant (Body/Spirit 轴):**
- **Branch A: 最后仁心**（燃尽自己的最后仁心）— con-3, chivalry+3, rep+2, cha+1（净 +3）
- **Branch B: 从容自在**（从容自在的老者）— con+2, cha+3, chivalry+1, rep+1（净 +7）
- **Branch C: 仁心传承**（仁心满天下的老宗师）— rep+4, chivalry+2, cha+2, connections+2（净 +10）

**Pragmatic variant (Social/Position 轴):**
- **Branch A: 人走茶凉**（失势的老御医）— rep-3, conn-4, money-2, cha+2, con+1（净 -6）
- **Branch B: 逍遥自在**（逍遥自在的老游医）— con+2, chivalry+2, cha+2, conn-3（净 +3）
- **Branch C: 德高望重**（德高望重的老名医）— rep+4, conn+3, cha+3, money+2, con+1（净 +13）

**Implementation integrity:** All 7 user stories complete. All 14 closure criteria satisfied. No scope creep beyond P90 contract.

---

## 2. Deliverables Inventory

### 2.1 Runtime Implementation

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Compassionate final late-life event | `src/data/lines/sample-lines-spine.json` | P91-001 | ✅ Done |
| Compassionate peaceful late-life event | `src/data/lines/sample-lines-spine.json` | P91-001 | ✅ Done |
| Compassionate legacy late-life event | `src/data/lines/sample-lines-spine.json` | P91-001 | ✅ Done |
| Pragmatic fallen late-life event | `src/data/lines/sample-lines-spine.json` | P91-001 | ✅ Done |
| Pragmatic wanderer late-life event | `src/data/lines/sample-lines-spine.json` | P91-001 | ✅ Done |
| Pragmatic master late-life event | `src/data/lines/sample-lines-spine.json` | P91-001 | ✅ Done |
| Sample line expression (cost label + current goal) | `src/p50/sampleLineExpression.ts` | P91-002 | ✅ Done |
| Late-life identity (6 branches) | `src/p50/sampleLineExpression.ts` | P91-003 | ✅ Done |
| Ordinary origin expression (goal + memory + summary) | `src/p56/ordinaryOriginExpression.ts` | P91-004 | ✅ Done |

### 2.2 Validation and Proof

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Targeted late-life proof (6 branches) | `docs/test-reports/p91-medical-late-life-targeted-proof.md` | P91-005 | ✅ Done |
| Narrow regression test suite (~60 assertions) | `tests/p91TavernHandMedicalLateLifeSpineTests.ts` | P91-006 | ✅ Done |
| Closure report | `docs/test-reports/p91-medical-late-life-closure-report.md` | P91-007 | 📌 This document |

### 2.3 Validation Summary

| Check | Result | Notes |
|-------|--------|-------|
| Typecheck | ✅ Pass | `tsc --noEmit` passes with no errors |
| P91 regression tests | ✅ Pass | 9 test groups, ~60 assertions, all passing |
| P89 payoff regression | ✅ Pass | All P89 tests still pass |
| P87 pressure regression | ✅ Pass | All P87 tests still pass |
| P85 on-ramp regression | ✅ Pass | All P85 tests still pass |
| P84 entry regression | ✅ Pass | All P84 tests still pass |
| P83 bridge regression | ✅ Pass | All P83 tests still pass |
| Renown late-life regression | ✅ Pass | Renown late-life expression unchanged |
| JSON schema validity | ✅ Pass | sample-lines-spine.json parses correctly |
| prd.json valid JSON | ✅ Pass | Valid structure |

---

## 3. Event Wiring Summary

### 3.1 Six Late-Life Auto Events

| Event ID | Type | Age Range | Trigger Condition | Core Effect |
|----------|------|-----------|-------------------|-------------|
| `medical_late_life_compassionate_final` | auto | 52-56 | payoff_done + compassionate_holder + late-life_not_done + exclude orthodox/demonic + bridge_crossed | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_compassionate_final` |
| `medical_late_life_compassionate_peaceful` | auto | 52-56 | payoff_done + compassionate_let_go + late-life_not_done + exclude orthodox/demonic + bridge_crossed | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_compassionate_peaceful` |
| `medical_late_life_compassionate_legacy` | auto | 52-56 | payoff_done + compassionate_legacy + late-life_not_done + exclude orthodox/demonic + bridge_crossed | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_compassionate_legacy` |
| `medical_late_life_pragmatic_fallen` | auto | 52-56 | payoff_done + pragmatic_holder + late-life_not_done + exclude orthodox/demonic + bridge_crossed | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_pragmatic_fallen` |
| `medical_late_life_pragmatic_wanderer` | auto | 52-56 | payoff_done + pragmatic_breaker + late-life_not_done + exclude orthodox/demonic + bridge_crossed | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_pragmatic_wanderer` |
| `medical_late_life_pragmatic_master` | auto | 52-56 | payoff_done + pragmatic_master + late-life_not_done + exclude orthodox/demonic + bridge_crossed | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_pragmatic_master` |

### 3.2 Flag Flow

```
medical_payoff_done (P89)
  + 1 of 6 payoff choice markers
  ↓
medical_late_life_compassionate_* / medical_late_life_pragmatic_* (auto, age 52-56)
  ↓
medical_late_life_done (shared checkpoint)
  + medical_late_life_identity_done (late-life identity marker)
  + 1 of 6 late-life branch markers:
    - tavern_medical_late_compassionate_final
    - tavern_medical_late_compassionate_peaceful
    - tavern_medical_late_compassionate_legacy
    - tavern_medical_late_pragmatic_fallen
    - tavern_medical_late_pragmatic_wanderer
    - tavern_medical_late_pragmatic_master
  ↓
[P92+] endgame echo (reserved, not implemented)
```

### 3.3 Branch Stat Changes (Per P90 Contract)

**Compassionate (Body/Spirit 轴):**
- A (final): con-3, chivalry+3, rep+2, cha+1 → 净 +3
- B (peaceful): con+2, cha+3, chivalry+1, rep+1 → 净 +7
- C (legacy): rep+4, chivalry+2, cha+2, connections+2 → 净 +10

**Pragmatic (Social/Position 轴):**
- A (fallen): rep-3, conn-4, money-2, cha+2, con+1 → 净 -6
- B (wanderer): con+2, chivalry+2, cha+2, conn-3 → 净 +3
- C (master): rep+4, conn+3, cha+3, money+2, con+1 → 净 +13

---

## 4. Expression Updates Summary (5 surfaces × 6 branches = 30)

### 4.1 Cost Label (Sample Line)

| Variant | Branch A | Branch B | Branch C |
|---------|----------|----------|----------|
| **Compassionate** | 最后仁心 | 从容自在 | 仁心传承 |
| **Pragmatic** | 人走茶凉 | 逍遥自在 | 德高望重 |

### 4.2 Current Goal (Sample Line + Ordinary Origin)

Each of the 6 branches has a unique current goal reflecting the player's late-life state.

### 4.3 Late-Life Identity (Sample Line)

| Variant | Branch A | Branch B | Branch C |
|---------|----------|----------|----------|
| **Compassionate** | 燃尽自己的最后仁心 | 从容自在的老者 | 仁心满天下的老宗师 |
| **Pragmatic** | 失势的老御医 | 逍遥自在的老游医 | 德高望重的老名医 |

All identities include tavern-born anchors to preserve flavor.

### 4.4 Life Memory (Ordinary Origin)

6 unique life memory paragraphs, each with tavern-specific anchors (老掌柜, 酒肆, 药庐, etc.).

### 4.5 Origin Summary (Ordinary Origin)

6 unique origin summaries, each clearly labeled as "酒肆出身的仁心名医" or "酒肆出身的世故名医".

---

## 5. Differentiation Verification

### 5.1 Two-Variant Differentiation (Body/Spirit vs Social/Position)

| Dimension | Compassionate | Pragmatic |
|-----------|--------------|-----------|
| **核心轴** | Body/Spirit（身体/精神） | Social/Position（社会/地位） |
| **Branch A** | 最后仁心 → 燃尽自己（悲壮牺牲） | 人走茶凉 → 失势跌落（社会跌落） |
| **Branch B** | 从容自在 → 颐养天年（平和释然） | 逍遥自在 → 云游四方（超脱自由） |
| **Branch C** | 仁心传承 → 桃李满天下（精神传承） | 德高望重 → 一代名医（地位巅峰） |
| **Stat 倾向** | constitution, chivalry | reputation, connections, money |
| **Cost label tone** | 悲壮/平和/传承 | 跌落/超脱/巅峰 |
| **叙事焦点** | 个人内心 + 医者仁心 | 社会地位 + 人情世故 |

### 5.2 Six-Branch Differentiation (Not Reskinned)

- 6 unique cost labels ✅
- 6 unique current goals ✅
- 6 unique late-life identities ✅
- 6 unique life memories ✅
- 6 unique origin summaries ✅
- 6 unique stat profiles ✅

### 5.3 Cross-Route Distinction (vs Renown Late-Life)

| Route | Late-Life Type | Core Theme | Key Differentiator |
|-------|---------------|-----------|-------------------|
| **Medical (Compassionate)** | Auto (6 branches) | 医者晚年，仁心何往 | Healing, sacrifice, legacy of care |
| **Medical (Pragmatic)** | Auto (6 branches) | 名医晚年，世态炎凉 | Favors, power, medical social standing |
| **Renown** | Auto (3 branches) | 江湖名宿晚年 | Jianghu reputation, mentorship, networks |

Medical late-life is clearly distinct from renown late-life:
- Medical = healer identity (药庐, 病人, 徒弟, 医术)
- Renown = jianghu networker identity (酒肆, 后辈, 江湖传说)
- Medical has 6 branches (2 variants × 3 choices) vs Renown's 3 branches
- Medical has body/spirit vs social/position axis differentiation

---

## 6. Regression Verification

### 6.1 No Regression of Earlier Medical Stages

| Stage | Status | Evidence |
|-------|--------|----------|
| P83 Bridge | ✅ No regression | P83 test suite passes |
| P84 Entry Differentiation | ✅ No regression | P84 test suite passes |
| P85 On-Ramp Spine | ✅ No regression | P85 test suite passes |
| P87 Pressure Spine | ✅ No regression | P87 test suite passes |
| P89 Payoff Spine | ✅ No regression | P89 test suite passes |

### 6.2 No Cross-Route Regression

| Route | Status | Evidence |
|-------|--------|----------|
| Renown late-life | ✅ No regression | Renown late-life expression unchanged |
| Renown payoff | ✅ No regression | Renown payoff expression unchanged |
| Merchant | ✅ No regression | Merchant route untouched |
| Orthodox | ✅ No regression | Orthodox route untouched |
| Demonic | ✅ No regression | Demonic route untouched |

---

## 7. 14 Closure Criteria (From P90 Validation Shape)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Compassionate late-life events fire correctly (3 branches) | ✅ Met | 3 compassionate events configured with correct conditions; tests verify existence + type + age range |
| 2 | Pragmatic late-life events fire correctly (3 branches) | ✅ Met | 3 pragmatic events configured with correct conditions; tests verify existence + type + age range |
| 3 | 6 branches all work (flags + stats) | ✅ Met | All 6 branch markers + stat changes verified in tests |
| 4 | Shared checkpoint flags set | ✅ Met | `medical_late_life_done` + `medical_late_life_identity_done` both set in autoEffects |
| 5 | 6 branch markers set correctly | ✅ Met | Each event sets its unique marker flag |
| 6 | Cost label updates (all 6 branches) | ✅ Met | 6 unique cost labels verified |
| 7 | Current goal updates (all 6 branches) | ✅ Met | 6 unique current goals verified |
| 8 | Late-life identity (all 6 branches) | ✅ Met | 6 unique late-life identities verified |
| 9 | Two-variant differentiation verified | ✅ Met | 4 differentiation tests pass (label, goal, identity, axis) |
| 10 | Six-branch differentiation verified | ✅ Met | 3 differentiation tests pass (6 unique labels, goals, identities) |
| 11 | Tavern-born healer flavor consistent | ✅ Met | All expressions include tavern anchors (酒肆, 老掌柜, 药庐) |
| 12 | No P83/P84/P85/P87/P89 regressions | ✅ Met | All 5 earlier stage test suites pass |
| 13 | Typecheck passes | ✅ Met | `tsc --noEmit` passes |
| 14 | Endgame flag interfaces reserved | ✅ Met | `medical_endgame_echo_done` concept reserved; 6 branch markers can support endgame branching |

**All 14 closure criteria satisfied. ✅**

---

## 8. Deferred Items

The following items remain deferred — consistent with the P90 contract and P91 scope:

| Item | Reason Deferred | Priority for Future |
|------|-----------------|---------------------|
| Endgame echo stage (P92+) | Late-life stage only; endgame has its own design + implementation cycle | High — natural next step after late-life |
| Other origins (farm_peasant, town_apprentice) | No medical bridge for these origins yet | Low — after tavern_hand medical is fully built out |
| Poison path as main route | Alternative medical route, not focus of this stage | Low–Medium — could be future "dark healer" route |
| Full medical system / herbalism system / clinic management | Platform-level change — dwarfs late-life scope | Very low — not on current roadmap |
| Medical × merchant / renown cross-route interactions | Cross-route design is far future | Very low |
| Orthodox/demonic childhood seed medical route | Only tavern-born ordinary origin in scope | Low |
| Multiple late-life events per branch | Current design has 1 late-life event per branch | Low — evaluate after player feedback |
| Plague hero / medical pure full choice line | Expansion beyond current scope | Low — could be future content wave |
| Full lifetime exhaust testing | Not required for bounded late-life proof | Low — platform-level concern |
| Second medical seed (pure healer vs plague hero) | Only 1 seed in scope for now | Low–Medium — future expansion |

---

## 9. Story Completion

| Story | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| P91-001 | Wire medical late-life spine event (6 branches) | ✅ Pass | 6 auto events added to sample-lines-spine.json; correct conditions, age ranges, effects, branch markers |
| P91-002 | Add late-life player-facing expression — sample line (core P0) | ✅ Pass | Cost label (6 branches) + current goal (6 branches) in sampleLineExpression.ts |
| P91-003 | Add late-life player-facing expression — late-life identity (core P0) | ✅ Pass | medicalAge40Identity() expanded with 6 unique late-life identities (late-life > age-40 priority) |
| P91-004 | Add late-life player-facing expression — ordinary origin (bonus P1) | ✅ Pass | Current goal + life memory + summary (6 branches each) in ordinaryOriginExpression.ts |
| P91-005 | Add targeted late-life proof (6 branches) | ✅ Pass | Targeted proof document covering config + logic + contract layers |
| P91-006 | Add narrow regression coverage | ✅ Pass | Test file with 9 groups (~60 assertions); all passing |
| P91-007 | Produce P91 closure report | ✅ Pass | This document |

**All 7 stories complete. P91 execution complete.**

---

## 10. GO / NO-GO Recommendation for P92 (Medical Endgame)

### 10.1 GO Criteria Check

| GO Criterion for Endgame | Status |
|--------------------------|--------|
| Late-life stage fully implemented and verified | ✅ Pass — 6 branches, 30 expression updates, all tested |
| 2 variants clearly differentiated | ✅ Pass — body/spirit vs social/position (not mirrored) |
| 6 branches meaningfully different | ✅ Pass — all 6 have unique identity, stats, expression, narrative tone |
| Tavern-born healer flavor strong | ✅ Pass — 酒肆 anchors throughout all 6 branches |
| No regressions in earlier stages | ✅ Pass — P83/P84/P85/P87/P89 all clean |
| Endgame hooks clearly planted | ✅ Pass — 6 distinct branches each have clear endgame echo potential |
| Foundation solid enough to justify endgame | ✅ Pass — 6 stages deep (bridge → entry → on-ramp → pressure → payoff → late-life) |

### 10.2 Endgame Narrative Potential (Per Branch)

| Branch | Endgame Echo Hook | Narrative Potential |
|--------|-------------------|---------------------|
| Compassionate A (最后仁心) | 燃尽自己 | "身后名" — 人们如何记住这位燃尽自己的医者 |
| Compassionate B (从容自在) | 从容老去 | "善终" — 平静地走完一生，留下什么 |
| Compassionate C (仁心传承) | 桃李满天下 | "薪火相传" — 徒弟们如何传承你的仁心 |
| Pragmatic A (人走茶凉) | 失势跌落 | "世态炎凉" — 失势后，谁还记得你 |
| Pragmatic B (逍遥自在) | 云游四方 | "逍遥游" — 江湖上流传的老游医传说 |
| Pragmatic C (德高望重) | 一代名医 | "医名远播" — 一生圆满，福寿双全的传说 |

### 10.3 Final Recommendation

**✅ GO — Recommend opening P92 medical endgame design-first stage**

The medical late-life stage is fully implemented, verified, and differentiated. All 6 branches have clear endgame echo narrative potential. The foundation (6 stages deep) is solid enough to justify moving into endgame design.

The endgame stage should follow the same design-first pattern: P92 = endgame contract definition, then P93 = implementation. This maintains consistency with the renown trilogy (P78 design → P79 implement → P80 design → P81 implement) methodology and ensures quality-first delivery.

**Recommendation: Proceed with P92 medical endgame design-first (lightweight echo pattern, same as P80 renown endgame).**

---

## 11. Final Takeaway

P91 does for `medical_sage_healer` late-life what P79 did for `jianghu_renown_sage` late-life: it takes a design-first contract and turns it into a fully playable, fully tested runtime implementation.

The key achievement is that **medical route now has 2 variants × 3 choices = 6 fully differentiated late-life branches**, each with its own identity, stats, and expression. This is the most complex late-life implementation so far — the first route with 2 clearly differentiated variants each having 3 meaningful late-life outcomes.

The implementation strictly follows the P90 contract — no scope creep, no feature additions beyond what was specified. All 14 closure criteria are met. All earlier stages (P83/P84/P85/P87/P89) remain unregressed.

**P91 late-life implementation complete. Medical route ready for endgame echo stage.**

---

**P91-007 complete.** Closure report saved.
