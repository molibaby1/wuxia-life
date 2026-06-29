# P84 Medical Entry Sharedness Audit

> **Stage:** P84 — Medical Sage Entry Differentiation Refinement
> **Purpose:** Audit what the medical route currently shares at post-bridge entry and identify flattening points that weaken player-perceived route identity.
> **Predecessor:** P83 Medical Sage Bridge Playable (closed, 7/7 stories)

## 1. Executive Summary

P83 successfully closed the tavern_hand → medical_sage_healer bridge with 2 entry variants (compassionate / pragmatic). However, at the post-bridge entry layer, the medical route currently:

- **Is NOT detectable** by the sample-line detection system (`detectSampleLine()`)
- **Has NO sample-line expression** (no cost label, no sample-line currentGoal, no age40 identity)
- **Has NO route summary recognition** in `playerFacingLabels.ts`
- **Has weak variant differentiation** — only lifeMemory has variant-specific text; currentGoal and summary are shared

This audit identifies **6 flattening points**, 4 of which are addressable within P84's bounded entry-differentiation scope.

## 2. Current Post-Bridge Entry Inventory

### 2.1 Bridge Layer (P83 — complete)

| Item | Location | Notes |
|------|----------|-------|
| Bridge event | `ordinary-origin-midlife.json` → `ordinary_tavern_midlife_medical_bridge` | age 28, tavern_hand only |
| Checkpoint flags | `tavern_medical_bridge_crossed` + `route_medical_committed` | Set on both variant choices |
| Key-choice flags | `medical_pure` + `medical_talent` | Satisfy `medical_sage_healer` gate dim 2 |
| Entry variant A flag | `tavern_embrace_compassionate_healer` | 仁心医者 — chivalry-focused |
| Entry variant B flag | `tavern_embrace_pragmatic_healer` | 世故人医 — money/charisma-focused |
| Decline flag | `tavern_decline_medical` | Sets `ordinary_tavern_midlife_done` only |

### 2.2 Ordinary Origin Expression Layer (P83 — partial)

| Surface | Location | Medical? | Variant-specific? |
|---------|----------|----------|-------------------|
| `tavernCurrentGoal` | `ordinaryOriginExpression.ts:99-101` | ✅ Yes (1 branch) | ❌ No — shared text |
| `tavernLifeMemory` | `ordinaryOriginExpression.ts:238-246` | ✅ Yes (3 branches) | ✅ Yes — compassionate + pragmatic variants |
| `deriveOrdinaryOriginSummary` | `ordinaryOriginExpression.ts:360-362` | ✅ Yes (1 branch) | ❌ No — shared text |

**Current Goal (shared):**
> 渐渐有人寻你看病，酒肆后面辟出了一间小药庐

**Summary (shared):**
> 酒肆出身的医者：靠自学和经验在镇上行医，渐渐有了神医的名头。

**Life Memory (compassionate):**
> 你在酒肆里耳濡目染，竟自学成了一手医术。起初只是帮熟客看看小病，后来名声渐渐传开，镇上人都称你一声小神医。你见不得人受苦，有钱没钱都给看——酒肆后面的柴房改成了小药庐，看病的人比喝酒的还多。

**Life Memory (pragmatic):**
> 跑堂的出身，没想到竟走上了行医的路。这些年在酒肆里见过的人、听过的方子、偷偷翻过的医书，竟都攒成了本事。你看病收钱，也看人下菜碟——镇上的大户人家都捧你，穷人家也说你公道。名声和日子都渐渐好了起来。

### 2.3 Sample-Line Expression Layer (NOT YET WIRED)

| Surface | Location | Medical? |
|---------|----------|----------|
| `detectSampleLine()` | `sampleLineExpression.ts:5-70` | ❌ No — returns null for medical |
| `deriveSampleLineCostLabel()` | `sampleLineExpression.ts:242-332` | ❌ No |
| `deriveSampleLineCurrentGoal()` | `sampleLineExpression.ts:334-351` | ❌ No |
| `deriveSampleLineAge40Identity()` | `sampleLineExpression.ts:449-469` | ❌ No |
| `deriveSampleLineDestinySentence()` | `sampleLineExpression.ts:487-494` | ❌ No |

### 2.4 Player-Facing Route Labels (NOT YET WIRED)

| Surface | Location | Medical? |
|---------|----------|----------|
| `ROUTE_DISPLAY_NAMES` | `playerFacingLabels.ts:10-22` | ❌ No |
| `ROUTE_FLAG_LABELS` | `playerFacingLabels.ts:24-34` | ❌ No — no `route_medical_committed` |
| `LONG_TERM_FLAG_LABELS` | `playerFacingLabels.ts:49-60` | ❌ No — no `tavern_medical_bridge_crossed` |
| `getPlayerRouteSummary()` | `playerFacingLabels.ts:117-163` | ❌ No |
| `readRawRouteKeyFromFlags()` | `playerFacingLabels.ts:174-218` | ❌ No |

### 2.5 Sample-Line Spine Events (NOT YET — out of P84 scope)

| Stage | Event | Exists? |
|-------|-------|---------|
| On-ramp | `medical_on_ramp` | ❌ No — P85+ scope |
| Pressure | `medical_midlife_pressure` | ❌ No — P85+ scope |
| Payoff | `medical_payoff` | ❌ No — P85+ scope |

## 3. Compassionate vs Pragmatic Variant Differentiation Strength

### 3.1 Current Variant Differences

| Dimension | Compassionate (仁心医者) | Pragmatic (世故人医) | Differentiated? |
|-----------|------------------------|---------------------|-----------------|
| Stats at bridge | reputation +4, chivalry +5, comprehension +3 | reputation +5, money +80, charisma +3 | ✅ Yes |
| Life memory text | "见不得人受苦，有钱没钱都给看" | "看病收钱，也看人下菜碟" | ✅ Yes |
| Current goal | Shared — "渐渐有人寻你看病" | Shared — "渐渐有人寻你看病" | ❌ No |
| Summary | Shared — "酒肆出身的医者" | Shared — "酒肆出身的医者" | ❌ No |
| Sample-line cost label | N/A — not wired | N/A — not wired | ❌ N/A |
| Sample-line identity | N/A — not wired | N/A — not wired | ❌ N/A |
| Route label | N/A — not wired | N/A — not wired | ❌ N/A |

### 3.2 Variant Strength Assessment: WEAK

**Only 2 out of 7 expression surfaces have variant differentiation:**
1. Bridge stats (functional, not narrative)
2. Life memory text (narrative, but only one surface)

**Players crossing the medical bridge get:**
- One different life memory paragraph
- Slightly different stat distribution
- Everything else reads the same

This is weaker than renown entry differentiation, where the bridge already has distinct currentGoal + cost label + identity signals.

## 4. Healthy Reuse vs Flattening

### 4.1 Healthy Reuse (✅ Keep)

1. **Ordinary origin expression system** — reusing `tavernCurrentGoal`, `tavernLifeMemory`, `deriveOrdinaryOriginSummary` is correct and consistent with renown/merchant patterns.
2. **Bridge event pattern** — following the same structure as `ordinary_tavern_midlife_renown_bridge` and `ordinary_tavern_midlife_merchant_bridge` is good.
3. **Flag system** — reusing `medical_pure` and `medical_talent` from existing medical events (P27 study-healer path) provides continuity.
4. **Composite gate** — `medical_sage_healer` gate in `wuxiaOriginSurfaces.ts` already exists and works with P83 bridge.

### 4.2 Flattening Points (⚠️ Address)

| # | Flattening Point | Severity | P84 Addressable? | Category |
|---|------------------|----------|-------------------|----------|
| F-1 | `detectSampleLine()` does not recognize medical route | High | ✅ Yes | Sample-line detection |
| F-2 | No sample-line cost label for medical route | High | ✅ Yes | Entry expression |
| F-3 | No sample-line current goal for medical route | High | ✅ Yes | Entry expression |
| F-4 | `getPlayerRouteSummary()` / `readRawRouteKeyFromFlags()` don't recognize medical | Medium | ✅ Yes | Route label |
| F-5 | Weak variant differentiation — only lifeMemory differs | Medium | ✅ Yes | Variant expression |
| F-6 | No on-ramp / pressure / payoff spine events | High | ❌ No — P85+ scope | Spine events |

### 4.3 Addressable in P84 (4 out of 6)

- **F-1, F-2, F-3:** Wire medical into sample-line expression system (entry level only)
- **F-4:** Add medical route to player-facing labels and route summary
- **F-5:** Strengthen variant differentiation across existing expression surfaces

### 4.4 NOT Addressable in P84 (2 out of 6)

- **F-6:** Spine events belong to on-ramp/pressure/payoff stages (P85+)

## 5. Comparison with Renown Entry (P72 Precedent)

| Dimension | Renown (P72 — post-entry-diff) | Medical (P83 — current) |
|-----------|-------------------------------|-------------------------|
| Sample-line detection | ✅ Yes | ❌ No |
| Sample-line cost label | ✅ Yes ("江湖声名之累") | ❌ No |
| Sample-line currentGoal | ✅ Yes | ❌ No |
| Age40 identity | ✅ Yes (entry-level stub) | ❌ No |
| Route summary recognition | ✅ Yes | ❌ No |
| Variant differentiation | N/A (single variant) | 2 variants but weak |
| Tavern-born flavor | ✅ Strong | ✅ Present but could be stronger |

**Key takeaway:** Medical route currently has weaker entry differentiation than renown did before P72. P84 should close this gap following the P72 pattern, plus add variant-specific differentiation (which renown doesn't have since it's single-variant).

## 6. P84 Targets (from this audit)

Based on the flattening analysis, P84 should target:

1. **Wire medical into sample-line detection** — add `'medical'` to `SampleLineId` and `detectSampleLine()`
2. **Add entry-level sample-line expression** — cost label + current goal for medical route (entry phase only)
3. **Add route summary recognition** — `getPlayerRouteSummary()`, `readRawRouteKeyFromFlags()`, labels
4. **Strengthen variant expression** — differentiate compassionate vs pragmatic across more surfaces (currentGoal, summary, cost label nuances)
5. **Preserve tavern-born healer identity** — ensure all expression carries the tavern-hand flavor, not generic "神医"

## 7. Scope Guardrails (for next story)

This audit confirms that P84 scope can stay bounded:
- No new events needed (expression-only + flag wiring)
- No new framework needed (reuse existing carriers)
- No spine events (F-6 explicitly deferred)
- Changes concentrated in 3 files: `sampleLineExpression.ts`, `playerFacingLabels.ts`, `ordinaryOriginExpression.ts`

---

*Audit complete. Next: P84-002 Scope Contract.*
