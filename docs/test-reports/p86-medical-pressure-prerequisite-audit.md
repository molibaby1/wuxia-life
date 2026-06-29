# P86 Medical Pressure Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P86 Wuxia Medical Pressure Design-First
> **Story:** P86-001 — Audit Medical Pressure Prerequisites
> **Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Purpose:** Audit existing medical route assets (flags, markers, events, expressions) across bridge + entry + on-ramp stages, identify what exists before pressure and what can be reused, and analyze variant-specific pressure prerequisites.

---

## 1. Executive Summary

Medical route has completed **3 stages** of tavern-born playable content:

| Stage | Status | Key Deliverables |
|-------|--------|-----------------|
| **P83 Bridge** | ✅ Complete | Bridge event + 2 variants (compassionate/pragmatic) + 3 expression surfaces |
| **P84 Entry Differentiation** | ✅ Complete | 7 expression surfaces + 2-variant differentiation + route label system |
| **P85 On-Ramp Spine** | ✅ Complete | 2 auto events + 4 expression surfaces + 8 variant branches |

**Pressure readiness:** The foundation is strong enough to enter pressure design. On-ramp has set clear pressure narrative hooks for both variants, checkpoint flags are in place, and expression surfaces have been established. The gap is **pressure direction selection + contract definition**, not infrastructure.

---

## 2. Existing Flags & Markers Inventory

### 2.1 Bridge-Stage Flags (P83)

| Flag | Set By | Purpose | Pressure Relevance |
|------|--------|---------|-------------------|
| `tavern_medical_bridge_crossed` | Bridge embrace choice | Bridge checkpoint | ✅ Gate prerequisite (confirmed path) |
| `route_medical_committed` | Bridge embrace choice | Route commitment | ✅ Route identity confirmation |
| `tavern_embrace_compassionate_healer` | Bridge choice A | Variant A marker | ✅ Compassionate variant gate |
| `tavern_embrace_pragmatic_healer` | Bridge choice B | Variant B marker | ✅ Pragmatic variant gate |
| `medical_pure` | Bridge (idempotent) | Key_choice dim 2 | ⚠️ Legacy — not used in sample-line branch |
| `medical_talent` | Bridge (idempotent) | Talent confirmation | ⚠️ Legacy — not used in sample-line branch |

### 2.2 Entry-Stage Markers (P84)

No new flags added at entry stage. Entry differentiation is **expression-only** — no runtime state changes beyond what bridge already set.

### 2.3 On-Ramp-Stage Flags (P85)

| Flag | Set By | Purpose | Pressure Relevance |
|------|--------|---------|-------------------|
| `medical_on_ramp_done` | Both variants (shared) | On-ramp checkpoint | ✅ **Primary pressure gate** |
| `tavern_medical_on_ramp_compassionate` | Compassionate branch | Variant A on-ramp marker | ✅ Compassionate pressure variant gate |
| `tavern_medical_on_ramp_pragmatic` | Pragmatic branch | Variant B on-ramp marker | ✅ Pragmatic pressure variant gate |

### 2.4 Reserved Future-Stage Flags

Reserved in P85 contract (not yet set):

| Flag | Purpose | Stage |
|------|---------|-------|
| `medical_midlife_pressure_done` | Midlife pressure checkpoint | P87 |
| `medical_payoff_done` | Payoff checkpoint | P88+ |
| `medical_age40_identity_done` | Age-40 identity checkpoint | P88+ |

---

## 3. Existing Events Inventory

### 3.1 Bridge Event (P83)

**Source:** `src/data/lines/ordinary-origin-midlife.json`

| Event ID | Age | Type | Variants |
|----------|-----|------|----------|
| `ordinary_tavern_midlife_medical_bridge` | 28 | choice | 2 embrace choices (compassionate / pragmatic) + decline |

### 3.2 On-Ramp Events (P85)

**Source:** `src/data/lines/sample-lines-spine.json`

| Event ID | Age | Type | Variant | Key Effects |
|----------|-----|------|---------|-------------|
| `medical_on_ramp_compassionate` | 31-34 | auto | Compassionate | rep+6, chivalry+5, con-2 |
| `medical_on_ramp_pragmatic` | 31-34 | auto | Pragmatic | rep+4, money+80, connections+4, charisma+3 |

### 3.3 Medical Event Pool (Legacy)

**Source:** `src/data/lines/medical.json` — 21 events total

Reusable for pressure inspiration but NOT in the sample-line chain:
- `medical_plague_outbreak` (plague hero arc)
- `medical_poison_temptation` (moral fork)
- `medical_divine_doctor_fame` (fame milestone)
- `medical_imperial_doctor` (imperial path)

These are **not** part of the tavern-born sample-line chain. P86+ pressure should follow sample-line pattern, not legacy medical.json pattern.

---

## 4. Existing Expression Surfaces

### 4.1 Sample Line Expression (P84 + P85)

**Source:** `src/p50/sampleLineExpression.ts`

| Surface | Entry Layer (P84) | On-Ramp Layer (P85) | Pressure Layer |
|---------|------------------|---------------------|---------------|
| `detectSampleLine` | ✅ 'medical' route detection | — | — |
| `deriveSampleLineCostLabel` | ✅ 仁心之累 / 世故之秤 | ⚠️ Kept entry-level | ⬜ Pressure update needed |
| `medicalCurrentGoal` | ✅ Entry-level goal | ✅ On-ramp goal (2 variants) | ⬜ Pressure update needed |
| `medicalAge40Identity` | — | — (deferred) | ⬜ Deferred to payoff |

### 4.2 Ordinary Origin Expression (P83 + P84 + P85)

**Source:** `src/p56/ordinaryOriginExpression.ts`

| Surface | Bridge Layer (P83) | Entry Layer (P84) | On-Ramp Layer (P85) | Pressure Layer |
|---------|-------------------|------------------|---------------------|---------------|
| `tavernCurrentGoal` | ✅ Bridge branch | ✅ Entry branches (2 variants) | ✅ On-ramp branches (2 variants) | ⬜ Pressure update needed |
| `tavernLifeMemory` | ✅ Bridge with 2 variants | — | ✅ On-ramp with 2 variants | ⬜ Pressure update needed |
| `deriveOrdinaryOriginSummary` | ✅ Medical branch | ✅ Entry branches (2 variants) | ✅ On-ramp branches (2 variants) | ⬜ Pressure update needed |

### 4.3 Player-Facing Labels (P84)

**Source:** `src/utils/playerFacingLabels.ts`

| Label | Value | Pressure Relevance |
|-------|-------|-------------------|
| Route display name | 一代名医 | ✅ Already set |
| Cost labels | 仁心之累 / 世故之秤 / 行医之重 | ⚠️ Entry-level — pressure may deepen |

### 4.4 Expression Surface Count Summary

| Stage | New Branches | Surfaces Touched |
|-------|-------------|-----------------|
| Bridge (P83) | ~4 | 3 |
| Entry (P84) | ~8 | 7 |
| On-Ramp (P85) | 8 | 4 |
| **Total before pressure** | **~20** | **7 unique surfaces** |

---

## 5. Variant Pressure Prerequisite Analysis

### 5.1 Compassionate Variant (仁心医者)

**On-ramp stats state:**
- Reputation: +6 (仁心之名)
- Chivalry: +5 (侠义之心)
- Constitution: -2 (累坏了身子)
- Money: no change (free care)

**On-ramp pressure hooks (from P85 narrative):**
1. "身子撑不了多久" → physical burnout angle
2. "小药庐挤不下" → capacity/resource pressure angle
3. "仁心之累" → exploited kindness angle

**Flags available for pressure gating:**
- `tavern_embrace_compassionate_healer` (bridge variant)
- `tavern_medical_on_ramp_compassionate` (on-ramp variant)
- `medical_on_ramp_done` (shared checkpoint)

**Stats thresholds that could drive pressure:**
- Low constitution (already -2 from on-ramp)
- High chivalry + low resources = overextending
- High reputation = more people seeking help

### 5.2 Pragmatic Variant (世故人医)

**On-ramp stats state:**
- Reputation: +4 (名声渐起)
- Money: +80 (丰厚诊金)
- Connections: +4 (大户人脉)
- Charisma: +3 (人情练达)

**On-ramp pressure hooks (from P85 narrative):**
1. "该收的收，该推的推" → favor/debt angle
2. "认识了不少有头有脸的人物" → faction siding angle
3. "世故之秤" → fame-vs-profit conflict angle

**Flags available for pressure gating:**
- `tavern_embrace_pragmatic_healer` (bridge variant)
- `tavern_medical_on_ramp_pragmatic` (on-ramp variant)
- `medical_on_ramp_done` (shared checkpoint)

**Stats thresholds that could drive pressure:**
- High connections + high money = social entanglement
- High reputation = expectations from multiple sides
- Money/resources growth = responsibility growth

### 5.3 Variant Differences Summary

| Dimension | Compassionate | Pragmatic |
|-----------|--------------|-----------|
| **Core pressure theme** | Self-sacrifice / overextending | Social entanglement / tradeoffs |
| **Key stats going in** | High rep, high chivalry, low con | High rep, high money, high connections |
| **Narrative hooks from on-ramp** | Body breaking / too many patients / exploited kindness | Favor debts / faction politics / fame vs profit |
| **Pressure trigger type** | Capacity exhaustion | Social obligation |
| **Tavern-born flavor anchor** | 酒肆大堂摆满病床 / 老掌柜叹气 | 大户管家来请 / 酒席上引荐 / 人情世故 |

---

## 6. Reusable Assets for Pressure

### 6.1 Systems & Patterns

| Asset | Reusable? | Notes |
|-------|-----------|-------|
| Sample-line spine event pattern | ✅ Fully | Follow `renown_midlife_pressure` pattern |
| Auto-event branching via conditions | ✅ Fully | 2 separate auto events with shared checkpoint |
| Expression surface system | ✅ Fully | Same 4 surfaces as on-ramp |
| Variant marker pattern | ✅ Fully | `tavern_medical_on_ramp_*` → `tavern_medical_pressure_*` |
| Naming convention | ✅ Fully | `medical_midlife_pressure_done` matches renown pattern |

### 6.2 Renown Pressure Precedent

**Reference:** P74 renown pressure design-first + P75 implementation

Renown pressure pattern:
- Single auto event: `renown_midlife_pressure`
- Age range: 37-41
- Trigger: `renown_on_ramp_done`
- Core theme: 人情债渐重 (favor debt burden)
- Expression updates: 5 surfaces (cost label + current goal ×2 + life memory + summary)

Medical pressure should follow similar structural pattern but with **2 variants** and different thematic content.

---

## 7. Pressure-Stage Gaps (What's Missing)

| Category | Gap |
|----------|-----|
| **Pressure direction** | 2 variants each need 1 selected pressure direction |
| **Pressure event spec** | No pressure events defined yet |
| **Pressure checkpoint flag** | `medical_midlife_pressure_done` reserved but spec needed |
| **Pressure expression updates** | 4+ surfaces need pressure-state branches |
| **Pressure variant markers** | `tavern_medical_pressure_compassionate` / `_pragmatic` — naming TBD |
| **Payoff flag reservation** | Payoff-stage flags need interface definition |

---

## 8. Audit Conclusion

**Pressure readiness: HIGH**

The medical route has:
- ✅ 3 completed stages (bridge + entry + on-ramp) with verified quality
- ✅ Clear checkpoint gating (`medical_on_ramp_done` + variant markers)
- ✅ 7 established expression surfaces ready for pressure updates
- ✅ Narrative hooks already planted in on-ramp events for both variants
- ✅ Sample-line spine pattern proven (renown pressure as precedent)
- ✅ 2 clearly differentiated variants with distinct pressure directions

**What needs design work in P86:**
1. Select 1 pressure direction per variant (from 2+ candidates each)
2. Define pressure contract (events, flags, expression updates)
3. Lock P87 validation shape
4. Confirm GO/NO-GO for implementation

The foundation is solid. P86 can proceed to scope contract and direction comparison.

---

**P86-001 complete.** Prerequisite audit saved.
