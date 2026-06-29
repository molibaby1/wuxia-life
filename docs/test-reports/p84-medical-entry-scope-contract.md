# P84 Medical Entry Scope Contract

> **Stage:** P84 — Medical Sage Entry Differentiation Refinement
> **Type:** Bounded post-bridge entry differentiation refinement
> **Predecessor:** P83 Medical Sage Bridge Playable (closed)
> **Successor:** P85 Medical On-Ramp Spine (if GO)

## 1. Stage Definition

P84 is an **entry differentiation refinement stage** for the medical_sage_healer route. It follows the same pattern as P72 (renown entry differentiation) but with the added complexity of 2 entry variants (compassionate / pragmatic).

**Core question:** When a player crosses the medical bridge, can they immediately feel "I'm a tavern-born healer, not a generic doctor" — and can they feel the difference between compassionate and pragmatic styles?

## 2. Allowed Layers

P84 may only operate at these layers:

| Layer | Description | Examples |
|-------|-------------|----------|
| Light configuration | Add medical to existing detection/lookup tables | `detectSampleLine()`, `ROUTE_DISPLAY_NAMES`, `ROUTE_FLAG_LABELS` |
| Expression | Update existing expression surfaces with medical entry branches | `tavernCurrentGoal`, `tavernLifeMemory`, `deriveOrdinaryOriginSummary`, `deriveSampleLineCostLabel`, `deriveSampleLineCurrentGoal` |
| Light markers | Add entry-level variant markers via existing flag system | Variant-specific flags for compassionate/pragmatic differentiation |
| Targeted proof | Comparison-style proof artifact showing entry differentiation | 5-case comparison: plain tavern / merchant bridge / renown bridge / medical compassionate / medical pragmatic |
| Narrow tests | Regression tests guarding entry differentiation | `tests/p84TavernHandMedicalEntryDifferentiationTests.ts` |

## 3. Forbidden Expansions

P84 MUST NOT expand into any of these:

| Category | Forbidden Items | Rationale |
|----------|-----------------|-----------|
| Spine events | No on-ramp, pressure, payoff, late-life, or endgame events | Belong to P85+ full spine implementation |
| New systems | No new route framework, no new expression carrier, no new UI | P84 is refinement, not infrastructure |
| Full route expansion | No comprehensive rewrite of medical.json events | Existing medical events are P27/P29 short-chain, not part of tavern-born spine |
| New origins | No farm_peasant or town_apprentice medical bridges | P84 is tavern_hand only, following P83 scope |
| Poison path | No medical_poison_path differentiation | Out of scope — medical_sage_healer is pure healer path |
| Full stat threshold delivery | No reputation ≥55 / resources ≥30 guarantees | P84 is entry-level, not full achievement |
| New UI components | No new panels, screens, or visual elements | Expression-only changes |
| Full lifetime exhaust | No exhaustive simulation across all seeds | Targeted proof only |

## 4. Boundary with P85 (On-Ramp Spine)

| Dimension | P84 (Entry Differentiation) | P85 (On-Ramp Spine) |
|-----------|------------------------------|---------------------|
| Focus | First shared layer after bridge | First spine milestone event |
| Mechanism | Expression + detection wiring | New auto event + stats + markers |
| Age range | Bridge (28) → ~32 | ~32–35 (on-ramp event) |
| Events added | 0 | 1 (medical_on_ramp auto event) |
| Player perception | "This feels like MY medical route" | "Ah, I've hit the next milestone" |
| Success shape | Entry identity established | On-ramp checkpoint + pressure setup |

**P84 → P85 handoff criteria:**
- Entry differentiation is perceptible (3+ readable signals)
- Both variants feel meaningfully different at entry
- Sample-line detection works for medical
- P83 bridge evidence not regressed
- GO decision for deeper spine work is justified

## 5. Quality Priority Order

1. **P83 bridge preservation** — do not regress existing bridge evidence
2. **Entry identity (tavern-born healer)** — medical entry must not feel generic
3. **Variant differentiation** — compassionate vs pragmatic must feel different
4. **Sample-line integration** — medical must be detectable and have expression
5. **Test coverage** — narrow regression tests must pass

## 6. Implementation Boundaries

### 6.1 Files Likely to Change

| File | Change Type | Rationale |
|------|-------------|-----------|
| `src/p50/sampleLineExpression.ts` | Add medical branches | Wire medical into sample-line detection + entry expression |
| `src/utils/playerFacingLabels.ts` | Add medical labels | Route display names, flag labels, route summary |
| `src/p56/ordinaryOriginExpression.ts` | Strengthen variants | Add variant-specific currentGoal and summary branches |
| `tests/p84TavernHandMedicalEntryDifferentiationTests.ts` | New file | Narrow regression coverage |

### 6.2 Files NOT to Change

| File | Why Not |
|------|---------|
| `src/data/lines/sample-lines-spine.json` | No new spine events in P84 |
| `src/data/lines/medical.json` | Existing medical events are short-chain, not entry |
| `src/narrative/profile/wuxiaOriginSurfaces.ts` | Gate already works with P83 bridge |
| `src/data/lines/ordinary-origin-midlife.json` | Bridge event already complete (P83) |

## 7. Risk and Rollback

### Risks

1. **Copy-paste risk:** Over-applying renown patterns without medical semantic adaptation
2. **Variant weakening:** 2 variants might still feel too similar after P84
3. **Scope creep:** Temptation to add on-ramp event "since we're here"

### Rollback Strategy

- **If entry differentiation still feels weak:** Can add polish within P84 (more expression surfaces, stronger variant text)
- **If variants can't be differentiated:** Can fall back to single-variant medical entry and defer variant work to later stage
- **If shared skeleton can't carry entry identity:** Stop at P84 — do not proceed to P85 on-ramp

## 8. Validation Gates

P84 closure requires all of:

1. ✅ `detectSampleLine()` returns `'medical'` for medical bridge paths
2. ✅ Medical has entry-level cost label and current goal in sample-line expression
3. ✅ Route summary recognizes medical path
4. ✅ Compassionate and pragmatic have ≥3 differentiated expression surfaces
5. ✅ Tavern-born flavor is recognizable in medical entry
6. ✅ P83 bridge tests still pass (no regression)
7. ✅ New P84 narrow tests pass
8. ✅ Typecheck passes

---

*Scope contract locked. Next: P84-003 Entry Differentiation Contract.*
