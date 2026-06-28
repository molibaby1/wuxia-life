# P72 Tavern-Hand Renown Entry Differentiation — Targeted Proof

> **Date:** 2026-06-29
> **Stage:** P72 Wuxia Selected Next Route Entry Differentiation
> **Story:** P72-006 — Targeted entry proof
> **Route:** `jianghu_renown_sage` (江湖名宿)
> **Origin:** `tavern_hand` (酒肆跑堂)
> **Bridge:** Ally-Network Midlife Bridge (P71 — done)
> **Proof type:** Comparison-style targeted proof (no full lifetime exhaust)

---

## 1. Purpose

本 proof 验证 `jianghu_renown_sage` 路线在 bridge 后的 entry 层是否保持了身份差异化，即：玩家跨过 bridge 进入共享目的地路径后，是否仍能感受到"我是从酒肆走来的江湖名宿"，而不是塌缩回 generic tavern_hand 或 generic renown。

**Proof 方法：** Runtime evaluation via real code paths — 调用实际的 expression 函数，比较不同 flag 组合下的输出。

---

## 2. Test Matrix

### 2.1 Comparison Cases

| Case # | Scenario | Flags | Expected Identity |
|--------|----------|-------|-------------------|
| A | Plain tavern hand (no bridge) | `origin_tavern_hand` + `tavern_service_committed` | Generic tavern hand |
| B | Tavern hand + merchant bridge | `origin_tavern_hand` + `tavern_merchant_bridge_crossed` | Merchant magnate path |
| C | Tavern hand + renown bridge | `origin_tavern_hand` + `tavern_renown_bridge_crossed` | Jianghu renown path (tavern-born) |
| D | Generic renown (ally_network only) | `ally_network` (no origin, no bridge) | Generic renown (not the tavern-born path) |

### 2.2 Expression Surfaces Tested

1. `detectSampleLine()` — Sample line detection
2. `deriveSampleLineCurrentGoal()` — Current goal text
3. `deriveSampleLineCostLabel()` — Cost label
4. `deriveSampleLineAge40Identity()` — Age-40 identity (age ≥ 38)
5. `getPlayerRouteSummary()` — Route summary name
6. `deriveOrdinaryOriginSummary()` — Origin summary (for ordinary origins)

---

## 3. Proof Results

### 3.1 Case A: Plain Tavern Hand (No Bridge)

**Flags:** `origin_tavern_hand`, `tavern_service_committed`, `tavern_guest_network`
**Age:** 30

| Surface | Value | Distinct from Case C? |
|---------|-------|----------------------|
| `detectSampleLine()` | `null` | ✅ Yes (null vs 'renown') |
| `deriveSampleLineCurrentGoal()` | `undefined` (falls to ordinary) | ✅ Yes |
| `deriveSampleLineCostLabel()` | `'守正代价'` (fallback) | ✅ Yes |
| `deriveSampleLineAge40Identity()` | `undefined` | ✅ Yes |
| `getPlayerRouteSummary().name` | `'未定'` | ✅ Yes |
| `deriveOrdinaryOriginSummary()` | `'平凡酒肆帮工的中年：人脉与引荐之间，经营或留守。'` | ✅ Yes |

**Verdict:** Plain tavern hand is clearly distinct from renown bridge path. No flattening.

---

### 3.2 Case B: Tavern Hand + Merchant Bridge

**Flags:** `origin_tavern_hand`, `tavern_merchant_bridge_crossed`, `magnate_on_ramp_done`
**Age:** 35

| Surface | Value | Distinct from Case C? |
|---------|-------|----------------------|
| `detectSampleLine()` | `'merchant'` | ✅ Yes (merchant vs renown) |
| `deriveSampleLineCurrentGoal()` | `'人脉已通、铺子已上手，正借助这些关系扩张'` | ✅ Yes (merchant expansion vs renown reputation) |
| `deriveSampleLineCostLabel()` | `'人脉与铺子的担子'` | ✅ Yes (shop/network burden vs reputation burden) |
| `deriveSampleLineAge40Identity()` | `'你是靠人情网络做起来的巨贾：从酒肆到商号，人脉织出了商路，引荐打通了关节，代价是人人都认得你、人人都有求于你'` | ✅ Yes (merchant magnate vs jianghu renown) |
| `getPlayerRouteSummary().name` | `'商路'` | ✅ Yes (merchant vs renown) |
| `deriveOrdinaryOriginSummary()` | `'酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。'` | ✅ Yes (merchant identity vs renown identity) |

**Verdict:** Merchant bridge and renown bridge are clearly distinct. Both are tavern-born but diverge into different paths. No flattening between the two bridges.

---

### 3.3 Case C: Tavern Hand + Renown Bridge (Primary Case)

**Flags:** `origin_tavern_hand`, `ally_network`, `tavern_renown_bridge_crossed`, `route_renown_committed`
**Age:** 40

| Surface | Value |
|---------|-------|
| `detectSampleLine()` | `'renown'` |
| `deriveSampleLineCurrentGoal()` | `'凭人脉声名在江湖立足，常有人来寻你引荐主事'` |
| `deriveSampleLineCostLabel()` | `'江湖声名之累'` |
| `deriveSampleLineAge40Identity()` | `'你是从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量。'` |
| `getPlayerRouteSummary().name` | `'江湖名宿'` |
| `deriveOrdinaryOriginSummary()` | `'酒肆出身的江湖人物：靠人脉和名声在江湖上立足。'` |

**Key identity signals preserved:**
1. ✅ **Tavern origin preserved** — "从酒肆走来", "酒肆出身"
2. ✅ **Network/reputation path** — "人脉为基", "声名", "引荐"
3. ✅ **Social entry, not martial** — "人情往来的重量", "声名之累" (not "修炼之苦" or "武功")
4. ✅ **Bridge checkpoint visible** — All surfaces activate on `tavern_renown_bridge_crossed`

**Verdict:** The renown entry is clearly differentiated. The tavern-born flavor comes through on all 4 expression surfaces.

---

### 3.4 Case D: Generic Renown (Ally Network Only, No Bridge)

**Flags:** `ally_network` (no `origin_tavern_hand`, no `tavern_renown_bridge_crossed`)
**Age:** 40

| Surface | Value | Distinct from Case C? |
|---------|-------|----------------------|
| `detectSampleLine()` | `null` | ✅ Yes (null vs 'renown') |
| `deriveSampleLineCurrentGoal()` | `undefined` | ✅ Yes |
| `deriveSampleLineCostLabel()` | `'守正代价'` (fallback) | ✅ Yes |
| `deriveSampleLineAge40Identity()` | `undefined` | ✅ Yes |
| `getPlayerRouteSummary().name` | `'未定'` | ✅ Yes |

**Verdict:** Generic ally_network without the bridge does NOT trigger renown entry expression. The bridge checkpoint (`tavern_renown_bridge_crossed`) is the required trigger — this is correct. The renown entry is specifically for the tavern-born bridge path, not for anyone with ally_network.

---

## 4. Summary of Differentiation

### 4.1 All Surfaces Distinct

| Comparison | detectSampleLine | currentGoal | costLabel | age40Identity | route summary | origin summary |
|------------|-----------------|-------------|-----------|---------------|---------------|----------------|
| Renown vs Plain tavern | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct |
| Renown vs Merchant bridge | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct |
| Renown vs Generic ally | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct | ✅ Distinct | N/A |

### 4.2 Identity Signals Preserved

1. **Tavern origin** — "从酒肆走来", "酒肆出身" — explicit origin reference in age40Identity and origin summary
2. **Network/reputation path** — "人脉为基", "引荐为径", "声名" — the core strength is connections, not martial skill
3. **Social cost** — "江湖声名之累", "人情往来的重量" — the cost is social obligation, not physical injury or sect duty
4. **Bridge as checkpoint** — All renown expression requires `tavern_renown_bridge_crossed` — the bridge is the entry point

---

## 5. Does This Support Deeper Differentiation?

**Answer: Yes.**

The entry differentiation proves that:
1. ✅ The renown path has a distinct, recognizable identity at entry
2. ✅ The tavern-born flavor is strong enough to feel different from merchant and generic paths
3. ✅ The structure (detectSampleLine + expression functions) supports adding more layers
4. ✅ The foundation is stable — no regressions in existing test suites

**Recommended next steps (P73+):**
- Add renown on-ramp spine event (first post-bridge narrative content)
- Add renown midlife pressure event
- Add renown payoff event
- Verify full stat chain from bridge → gate acceptance
- Add pressure/payoff expression differentiation

The entry differentiation is strong enough that deeper work would build on a solid foundation.

---

## 6. Method Notes

- **Runtime evaluation:** All results produced by calling the actual TypeScript functions with constructed GameState objects
- **No static text comparison:** Text is evaluated by the real code, not copy-pasted from specs
- **Bounded scope:** This proof covers entry layer only — no full lifetime simulation, no stat threshold verification
- **Comparison style:** Side-by-side comparison of multiple scenarios to demonstrate differentiation

---

## 7. Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Entry markers are runtime-visible | ✅ Pass | All 4 expression surfaces return renown-specific text |
| Renown is distinguishable from generic path | ✅ Pass | 6/6 surfaces distinct from plain tavern hand |
| Renown is distinguishable from merchant bridge | ✅ Pass | 6/6 surfaces distinct from merchant path |
| Tavern-born flavor preserved | ✅ Pass | "从酒肆走来" and "酒肆出身" in age40Identity + origin summary |
| No full lifetime exhaust required | ✅ Pass | Entry-layer proof only, bounded scope |
| Supports go/no-go for deeper differentiation | ✅ Pass | Foundation is solid; deeper work is justified |

---

**P72-006 complete.** Targeted entry proof saved.
