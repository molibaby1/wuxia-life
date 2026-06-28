# P25 Lifetime Simulation Baseline Audit (US-001)

Read-only inventory of current lifetime simulation surfaces before Wave 1 implementation.

**Date:** 2026-06-23  
**Scope:** Mainstream achievements, composite destiny, rare lines, origin surfaces, choice/outcome wiring, endgame summary paths  
**Gameplay changes:** None (audit only)

---

## 1. Mainstream Achievements & Composite Destiny

**Config:** `src/narrative/profile/wuxiaOriginSurfaces.ts` → `WUXIA_COMPOSITE_DESTINY_OUTCOMES`  
**Evaluator:** `src/p16/compositeDestiny.ts`  
**Dimension mapping:** `src/p16/originSurfaces.ts` `readDimensionValueForDestiny`

| ID | Label | Requirements | Status |
| --- | --- | --- | --- |
| `grandmaster_guardian` | 一代宗师兼护道者 | 武学 ≥80；声望 ≥50；flag `p16_guardian_oath` | Config only |
| `sect_leader_statesman` | 门派掌门兼盟会领袖 | 武学 ≥55；社会资本 ≥60；资源 ≥40；flag `p16_alliance_brokered` | Config only |
| `lone_sword_legend` | 独行剑侠传奇 | 武学 ≥90；社会资本 ≥15 且非 `p16_alliance_brokered`；flag `p16_rare_master_encounter` | Config only |
| `jianghu_renown_sage` | 江湖名宿 | — | **Missing** (PRD §12) |
| `medical_sage_healer` | 一代名医 | — | **Missing** (PRD §12) |

**Partial-progress reporting:** `evaluateCompositeDestinyOutcome` + `formatCompositeDestinyReport` expose per-dimension satisfied/missing/blocked. Used in P16 gate (`src/p16/reportBuilder.ts`) and `tests/p16OriginDestinyTests.ts` only — not player-facing.

**Critical wiring gaps:**

| Flag | Expected role | Event `flag_set` in runtime-loaded content |
| --- | --- | --- |
| `p16_guardian_oath` | grandmaster_guardian | **None** |
| `p16_alliance_brokered` | sect_leader_statesman | **None** |
| `p16_rare_master_encounter` | lone_sword_legend | Set via `src/p16/rareEventLines.ts` checkpoint roll |
| `mentor_bond` | jianghu_renown_sage | **None** (only consumed by `p22_relationship_mentor_obligation`) |
| `ally_network` | jianghu_renown_sage | **None** |
| `medical_divine_doctor_fame` | medical_sage_healer | Event ID exists in `medical.json` but **file not runtime-loaded**; auto event does not set flag |
| `medical_imperial` | medical_sage_healer | In `medical.json` (not loaded) |

---

## 2. Rare Event Lines

**Config:** `WUXIA_RARE_EVENT_LINES` in `wuxiaOriginSurfaces.ts` (3 lines)

| ID | Unlock flag | Runtime |
| --- | --- | --- |
| `hidden_master_line` | `p16_rare_master_encounter` | Checkpoint roll in `GameEngineIntegration.applyP16RareLineCheckpoints` |
| `merchant_patron_line` | `p16_merchant_patron` | Same |
| `scholar_mentor_line` | `p16_scholar_mentor` | Same |

**Gap:** `getRareLineOpportunityMultiplier` (`src/p16/rareEventLines.ts`) has no callers — tag weighting from rare lines does not affect scheduling.

---

## 3. Origin Surfaces

**Config:** `WUXIA_ORIGIN_SURFACES` — 6 origins (martial_family, merchant_house, scholar_house, frontier_military, poor_family, streetborn)  
**Runtime:** `src/p16/originSurfaces.ts` multipliers; infant chains in `src/data/lines/origin-infant-passives.json`

**Assessment:** Supported for vivid origins. No dedicated「平凡出身」pool (Wave 4 defer).

---

## 4. Choice / Outcome Wiring

**Golden spine:** `src/data/golden-line-spine.json` — ages 0–30, 9 key choices, 17 manual-choice events  
**Payoff map:** `src/data/golden-line-payoff-map.json` — 11 key choices with durable writes  
**Feedback runtime:** `ChoiceFeedbackGenerator.ts` → `useNewGameEngine` → `GameScreen.vue`  
**Existing standard doc:** `docs/test-reports/product-experience-governance-choice-feedback-standard.md`

**Active planning:** P16 childhood agency (`src/p16/childhoodAgency.ts`) + P7 active actions

**Event loader scope:** `src/data/events.json` imports 25 line files; **not loaded:** `medical.json`, `relationship.json`, `orthodox.json`, most identity-* files (see manifest deferred entries)

---

## 5. Endgame Summary Paths

| Path | Module | Composite destiny? |
| --- | --- | --- |
| P19 final summary | `src/p19/finalSummaryComposition.ts` | No |
| Ending review | `src/core/EndingSystem.ts` | No |
| Life memory (in-run) | `src/core/deriveLifeMemorySummary.ts` | No |
| P16 composite destiny | `src/p16/compositeDestiny.ts` | Gate/tests only |

**Gap:** Player endgame sees P19 categories + stats; mainstream achievements invisible at summary time.

---

## 6. Ultimate North Star Goal Mapping

| Goal | Status | Evidence |
| --- | --- | --- |
| 1. 一生可玩叙事弧 | **Partial** | P16–P24 systems; golden spine 0–30; no full-life P25 audit baseline before this doc |
| 2. 主流成就可追可达成 | **Partial** | 3 P16 outcomes configured; 2 Wave 1 outcomes missing; key flags unwired |
| 3. 巅峰成就双门槛 | **Missing** | Wave 2 defer |
| 4. 混合成就跨轨组合 | **Missing** | Wave 3 defer |
| 5. 平凡出身可信可玩 | **Partial** | 6 vivid origins; no ordinary-origin pool |
| 6. 选择双通道 | **Partial** | Agency + event choices exist; no P25 three-layer standard applied to full spine |
| 7. 后果一致性 | **Partial** | P16 slices exist; no P25 contradiction slice |
| 8. 重玩动机 | **Partial** | `gate:p20` PASS; no P25 path-divergence baseline |
| 9. 门禁不退化 | **Met** | `gate:playability` / `gate:p20` PASS per latest reports |

---

## 7. Top Contradiction Risks

| # | Type | Pointer | Severity |
| --- | --- | --- | --- |
| R1 | **反馈缺失 / 不可达成** | `p16_guardian_oath`, `p16_alliance_brokered` — config in `wuxiaOriginSurfaces.ts` L230–241, zero `flag_set` in loaded events | Critical |
| R2 | **状态幽灵** | `mentor_bond`, `ally_network` — consumed by `p22-content-expansions.json` L296, never set | High |
| R3 | **因果断裂** | `medical_imperial_doctor` requires `flags.medical_divine_doctor_fame` (`medical.json` L265) but `medical_divine_doctor_fame` auto event (L230–252) sets no flag; file not in `EventLoader` | Critical |
| R4 | **窗口矛盾** | `lone_sword_legend` social_capital `minValue: 15` (`wuxiaOriginSurfaces.ts` L250) vs North Star intent ≤15 low-social; evaluator lacks `maxValue` | High |
| R5 | **双轨分离** | Composite destiny not in `EndingSystem` / P19 summary — achievements pursuable in sim only | Medium |
| R6 | **死代码** | `getRareLineOpportunityMultiplier` never called — rare line roll does not affect later weights | Medium |
| R7 | **内容未加载** | `medical.json`, `relationship.json`, `orthodox.json` deferred in `event-asset-manifest.json` | High |

---

## 8. Recommended Wave 1 Layer Targets

Per `simulation-driven-optimization-workflow.md`:

| Issue | Layer |
| --- | --- |
| Missing composite outcomes + flag wiring | `world profile` + content (`wuxiaOriginSurfaces.ts`, line JSON) |
| medical chain unreachable | `world profile` — wire `medical.json` into `EventLoader` |
| Golden-line feedback gaps | `tuning_config` / content copy in loaded spine events |
| Contradiction detection | `runtime` reporting module (`src/p25/`) |
| Achievement reachability tuning | `tuning_config` (US-007) |

No gameplay behavior modified in this story.
