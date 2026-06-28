# P66 Merchant Trilogy Success-Cost Differentiation Closure Report

> **Date:** 2026-06-28
> **Stage:** P66 Wuxia Merchant Trilogy Success-Cost Differentiation
> **Branch:** `codex/p66-wuxia-merchant-trilogy-success-cost-differentiation`
> **Type:** Closure — bounded player-experience differentiation stage

---

## 1. Executive Summary

P66 makes the three merchant bridge routes (apprentice, tavern, peasant) feel like they pay *different prices* for success — not just different flavor text, but meaningfully different kinds of cost that echo their respective origin paths.

**Before P66:** Cost was described but not felt. The payoff phase read as unmitigated success with decoration. Cost labels were only differentiated at entry (on_ramp), then collapsed back to generic. Age-40 identity talked about the path but not the price.

**After P66:** Cost persists and echoes through the entire magnate journey. The payoff phase has a "success... but at what cost" structure. Cost labels stay route-specific through pressure and payoff. Age-40 identity carries the weight of what was lost.

All done within the existing expression/marker framework — no new systems, no new events, no structural change to the magnate skeleton.

---

## 2. Deliverables Inventory

### 2.1 Documentation

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Success-cost signal audit | `docs/test-reports/p66-success-cost-signal-audit.md` | P66-001 | ✅ Done |
| Scope contract | `docs/test-reports/p66-success-cost-scope-contract.md` | P66-002 | ✅ Done |
| Success-cost contracts (Appendix A) | `docs/PRD/p66-wuxia-merchant-trilogy-success-cost-differentiation.md` | P66-003/004/005 | ✅ Done |
| Comparison proof | `docs/test-reports/p66-success-cost-differentiation-proof.md` | P66-008 | ✅ Done |
| Closure report (this document) | `docs/test-reports/p66-success-cost-differentiation-closure-report.md` | P66-010 | ✅ Done |

### 2.2 Runtime Changes

| File | Change | Nature |
|------|--------|--------|
| `src/p50/sampleLineExpression.ts` | Deepened payoff cost reflection, extended cost labels to pressure/payoff, added cost weight to age-40 identity | Expression-only |
| `tests/p50SampleLineExpressionTests.ts` | Added 4 new P66 test functions (cost label persistence, payoff cost reflection, age-40 cost weight, comparison distinction) | Narrow regression tests |

### 2.3 Validation

| Check | Result | Notes |
|-------|--------|-------|
| P50 sample line expression tests | ✅ Pass | Includes new P66 tests + existing P63/P64 tests |
| Typecheck | ✅ Pass | `tsc --noEmit` |
| P63 entry differentiation (regression) | ✅ Pass | No regression — existing tests still pass |
| P64 pressure/payoff differentiation (regression) | ✅ Pass | No regression — existing tests still pass |
| Player-visibility check | ✅ Pass | All expressions pass `isPlayerVisibleSampleLineText` |

---

## 3. What Changed (Runtime)

### 3.1 Payoff-Phase Cost Reflection (Biggest Change)

The payoff current goal now uses a "success... but..." structure that makes the cost feel earned rather than decorative:

- **Apprentice:** "巨贾之位到手，供货销路尽在掌握，**只是**当年的手艺人如今要看合伙人的脸色，账目上的分成比刨子上的木纹更难拿捏"
- **Tavern:** "商号凭人脉通八方，老主顾遍布各行，**只是**欠的人情比挣的银子还多，每一笔生意都要掂量谁的面子、还谁的情"
- **Peasant:** "车马仓储物流根基已成，泥腿子熬出了头，**只是**脚下的路比田埂还长，每一步都赌过收成、押过季节，赢了但也再回不到田里了"

The "只是" (but) pivot is key — it turns unmitigated success into "success with a price."

### 3.2 Cost Label Persistence

Cost labels were previously only differentiated at `magnate_on_ramp`. Now they stay route-specific through pressure and payoff:

| Stage | Apprentice | Tavern | Peasant |
|-------|------------|--------|---------|
| on_ramp (P63) | 手艺与合伙的担子 | 人脉与铺子的担子 | 粮路与买卖的担子 |
| pressure (P66) | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |
| payoff (P66) | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |

The label evolves slightly (entry → pressure/payoff) but stays route-distinct.

### 3.3 Age-40 Identity Cost Weight

Age-40 identity now includes a "代价是..." clause that names what was lost:

- **Apprentice:** "...代价是再也回不到只管刨花的日子"
- **Tavern:** "...代价是人人都认得你、人人都有求于你"
- **Peasant:** "...代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳"

---

## 4. Three Kinds of Pain Summary

| Dimension | Apprentice | Tavern | Peasant |
|-----------|------------|--------|---------|
| **Core metaphor** | Partnership = ceding control | Network = owing everyone | Labor = betting the body |
| **Primary pain** | Control / accountability | Relationship / authenticity | Physical wear / timing bet |
| **Bridge choice** | Join partnership | Take referral | Accept outside offer |
| **Cost type** | Agency loss | Social entropy | Body + risk |
| **What's lost** | Craft independence | Authenticity / privacy | Landed stability + physical ease |
| **Payoff pivot** | "要看合伙人的脸色" | "欠的人情比挣的银子还多" | "赢了但也再回不到田里了" |
| **Identity代价** | "再也回不到只管刨花的日子" | "人人都认得你、人人都有求于你" | "再也回不到守着一亩三分地的安稳" |
| **Cost label** | 合伙与账目的担子 | 人情与面子的担子 | 粮路与奔波的担子 |

None of these are "generic merchant debt" — each pain is specific to the route's origin and path.

---

## 5. Story Completion

| Story | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| P66-001 | Audit current success-cost signals | ✅ Pass | `p66-success-cost-signal-audit.md` — 3-route inventory, thin-spot identification |
| P66-002 | Lock P66 scope contract | ✅ Pass | `p66-success-cost-scope-contract.md` — allowed/forbidden layers, enforcement |
| P66-003 | Define apprentice success-cost contract | ✅ Pass | PRD Appendix A.1 — partnership/control/bookkeeping cost profile |
| P66-004 | Define tavern success-cost contract | ✅ Pass | PRD Appendix A.2 — favor/network/information-distortion cost profile |
| P66-005 | Define peasant success-cost contract | ✅ Pass | PRD Appendix A.3 — cargo/travel/timing-bet cost profile |
| P66-006 | Wire success-cost differentiation | ✅ Pass | Extended cost labels, deepened payoff expressions, cost-weighted identity — all via existing expression framework |
| P66-007 | Add player-facing cost expression | ✅ Pass | 3+ groups of cost-specific signals: (1) payoff cost reflection, (2) cost label persistence, (3) age-40 cost weight |
| P66-008 | Add targeted success-cost proof | ✅ Pass | `p66-success-cost-differentiation-proof.md` — 3-dimension comparison proof |
| P66-009 | Add narrow regression coverage | ✅ Pass | 4 new test functions: cost label persistence, payoff cost reflection, age-40 cost weight, comparison distinction |
| P66-010 | Produce P66 closure report | ✅ Pass | This document |

**All 10 stories complete. P66 execution complete.**

---

## 6. Boundary with P67

### P66 Completes
- Success-cost differentiation is runtime-visible across 3+ expression surfaces
- Three routes feel like they pay different prices for success
- Cost persists from entry through payoff (not just decoration at the start)
- "Success... but at what cost" structure established at payoff
- Foundation laid for stronger end-of-life recap

### P67 Takes Over
- **Recap-line / destiny-sentence differentiation** — add a distinct ending punchline per route
- The ending will land harder because P66 made the cost felt throughout the journey
- P66's cost keywords (刨花/账目, 人情/面子, 田埂/奔波) are reusable for final recap
- If scope allows, success-shape exploration can build on the cost foundation P66 established

### Why P67 After P66
P65 ranked success-cost as #1 priority and recap-line as #2. The logic: deepen the experience first (P66), then cap it with a memorable ending (P67). A destiny sentence lands harder when players have already felt the cost.

---

## 7. Deferred Items

| Item | Reason Deferred |
|------|-----------------|
| Success-shape structural differentiation | Highest impact but highest scope risk — needs dedicated stage, not a bounded cost stage |
| Full merchant content wave | P66 is expression-only, no new events/content |
| New merchant systems (economy, map, relationship) | Out of bounded scope — would require full platform build |
| Fourth ordinary-origin bridge | Out of scope — P66 focuses on existing trilogy |
| Mechanical cost difference | Expressions only per scope contract — cost is felt in text, not in different mechanics |
| Route-specific failure modes | Would require structural magnate skeleton change |
| Full lifetime comparative exhaust | Proof is targeted (payoff phase), not exhaustive — sufficient for P66 goals |
| Playtest platformization | Out of scope — P66 is content/expression stage |
| Sample-line track reopening | Sample-line track remains closed |

---

## 8. Commits Summary

| Commit | Description |
|--------|-------------|
| `80ecc13` | P66-001: Add success-cost signal audit doc |
| `e40e563` | P66-002: Add success-cost scope contract |
| `41f568b` | P66-003/004/005: Add success-cost contracts to PRD appendix |
| `dbe07bb` | P66-006/007/009: Wire success-cost differentiation with expression and tests |
| `266b833` | P66-008: Add success-cost differentiation comparison proof |

---

## 9. Final Takeaway

The merchant trilogy is no longer "strong entrance, weak ending" on the cost dimension. P63 made the entry feel different. P64 added pressure/payoff flavor. P66 makes the **cost persist and echo** — so when players reach the top, they don't just feel like they succeeded with decoration; they feel like they succeeded *at a price*, and that price is different depending on where they came from.

- **Apprentice merchants** succeeded by giving up control — they answer to partners now, not just to themselves
- **Tavern merchants** succeeded by going into debt — not money debt, but favor debt, where everyone knows their name and everyone wants something
- **Peasant merchants** succeeded by betting everything — their bodies, their land, their sense of place, and they won, but they can never go back

This is the "success-cost differentiation" that P65 identified as the thinnest and most high-leverage layer to fix next. And it's done with bounded, expression-only changes — no new systems, no scope creep.

**P67 (recap-line / destiny-sentence)** will now have a much stronger foundation to build on. The ending punchline hits harder when the cost was already felt throughout the journey.
