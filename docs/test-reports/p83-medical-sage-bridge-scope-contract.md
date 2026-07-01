# P83 Medical Sage Bridge Runtime Scope Contract

> **Date:** 2026-06-29
> **Stage:** P83 Wuxia Medical Sage Bridge Playable Implementation
> **Story:** P83-002 — Lock P83 Runtime Scope Contract
> **Input from:** `docs/PRD/p83-wuxia-medical-sage-bridge-playable.md`, `docs/PRD/p82-medical-sage-bridge-contract.md`
> **Purpose:** Define exactly what P83 covers and what it explicitly does NOT cover, so the implementation stage stays bounded and does not sprawl into later differentiation work.

---

## 1. What P83 Covers (Allowed Layers)

P83 is a **playable bridge implementation stage**. It implements exactly what the P82 bridge contract defines — no more, no less.

### 1.1 Allowed Work Items

| Layer | Description | Details |
|-------|-------------|---------|
| **Bridge wiring** | Add medical bridge midlife event to ordinary-origin-midlife.json | 1 event, 3 choices (compassionate / pragmatic / decline), age 26–30, tavern_hand only |
| **2 entry variants** | Implement both entry variants defined in P82 contract | 仁心医者 (Compassionate Healer) + 世故人医 (Pragmatic Healer); each with distinct stats/flags/flavor |
| **Bridge expression (3 surfaces)** | Add medical bridge branches to existing expression surfaces | currentGoal + lifeMemory + summary; all on existing surfaces, no new UI |
| **Targeted proof** | Produce one targeted proof document | Covers all 14 chain nodes from P82 validation shape |
| **Narrow tests** | Add narrow regression test file | ~15–20 assertions across ~14 categories; reuse existing harness |

### 1.2 Allowed Flag Additions

| Flag | Purpose | Set By |
|------|---------|--------|
| `tavern_medical_bridge_crossed` | Bridge checkpoint tracking | Medical bridge event → embrace choice |
| `route_medical_committed` | Medical route commitment (for downstream spine gates) | Medical bridge event → embrace choice |
| `medical_pure` | Key_choice dim 2 for medical_sage_healer gate | Medical bridge event → embrace choice (idempotent) |
| `medical_talent` | Talent flag confirming healer aptitude | Medical bridge event → embrace choice (idempotent) |
| `tavern_embrace_compassionate_healer` | Variant A marker | Compassionate choice |
| `tavern_embrace_pragmatic_healer` | Variant B marker | Pragmatic choice |
| `tavern_decline_medical` | Decline marker | Decline choice |
| `tavern_midlife_medical_bridge` | Event-fired marker | Medical bridge event (any choice) |

**Note:** `medical_pure` and `medical_talent` already exist in the codebase (set by habit-led medical events). The bridge sets them idempotently (no change if already present).

---

## 2. What P83 Explicitly Does NOT Cover (Forbidden Expansions)

The following are **strictly out of scope** for P83. They belong to later stages.

### 2.1 Forbidden Expansions

| Category | Forbidden Item | Stage |
|----------|----------------|-------|
| **Spine events** | Medical on-ramp event (age 30–34) | P84+ |
| **Spine events** | Medical midlife pressure event (age 36–40) | P85+ |
| **Spine events** | Medical payoff event (age 42–46) | P86+ |
| **Entry densification** | More than 2 entry variants | P84+ (entry differentiation refinement) |
| **Entry densification** | Deeper variant differentiation beyond stats/flags | P84+ |
| **Cost differentiation** | Cost label for medical path | P85+ (with spine) |
| **Pressure / payoff work** | Any pressure or payoff mechanics | P85+/P86+ |
| **New systems** | Herbalism system | Way beyond scope |
| **New systems** | Clinic management system | Way beyond scope |
| **New systems** | Any new gameplay framework | Way beyond scope |
| **Additional origins** | Farm_peasant medical bridge | Future cycle |
| **Additional origins** | Town_apprentice medical bridge | Future cycle |
| **New UI components** | Any new UI surfaces | Not needed — existing surfaces suffice |
| **Poison path** | `medical_poison_path` as main route | Future cycle (alternative medical route) |
| **Social-momentum healer** | Second medical bridge direction | Future cycle |
| **Late-life / endgame** | Medical late-life content | P88+ |
| **Success-shape / destiny sentence** | End-of-life destiny text | P87+ |
| **Full lifetime sim exhaust** | Birth-to-death simulation for every variant | Out of scope for bridge stage |

### 2.2 Scope Guardrails

1. **Bridge-only principle:** P83 implements only the bridge checkpoint + entry variants + expression. No spine, no pressure, no payoff.
2. **2-variant maximum:** Exactly 2 entry variants, as defined in P82 contract. No additional variants.
3. **Existing surfaces only:** All expression changes are branches on existing surfaces. No new UI components.
4. **No new frameworks:** Reuse existing midlife event system, expression system, test harness.
5. **Tavern_hand only:** Bridge is for `tavern_hand` origin only. No other origins.
6. **Mutual exclusivity preserved:** Medical bridge participates in the `ordinary_tavern_midlife_done` lock, same as merchant and renown bridges.
7. **Regression clean:** No existing bridges (merchant P59, renown P71) may be broken or modified.

---

## 3. Boundary with P84 (Entry Differentiation Refinement)

### 3.1 What P83 Delivers (Bridge-Level)

- **Bridge event + 2 entry variants** — players can cross the bridge and choose between compassionate and pragmatic healer identities
- **3 expression surfaces** — currentGoal, lifeMemory, summary all have medical bridge branches
- **Bridge checkpoint flags** — `tavern_medical_bridge_crossed` + `route_medical_committed` + `medical_pure` + `medical_talent`
- **Mutual exclusivity** — with merchant and renown bridges
- **Targeted proof** — 14 chain nodes verified
- **Narrow regression** — ~15–20 assertions

### 3.2 What P84 Adds (Entry Differentiation Refinement)

- **Deeper entry differentiation** — more distinct identity signals between the 2 variants
- **Cost label** (if spine is added in P84) — "行医之累" or similar
- **Additional expression surfaces** — age40 identity, sample line cost label, etc.
- **Entry variant-specific narrative beats** — more flavor text, more distinct feel
- **Maybe on-ramp spine event** — depending on P84 scope definition

### 3.3 Handoff Criterion

P83 is ready to hand off to P84 when:
- ✅ Bridge is runtime-reachable from tavern_hand
- ✅ 2 entry variants work with distinct stats/flags
- ✅ 3 expression surfaces have medical bridge branches
- ✅ Mutual exclusivity with merchant + renown works
- ✅ All existing regression suites pass
- ✅ Targeted proof covers all 14 chain nodes

P84 then picks up from the bridge checkpoint and refines entry differentiation / adds on-ramp spine.

---

## 4. Quality Priority Order

Quality-first priority order for implementation decisions:

1. **Correctness** — bridge must work, flags must be set correctly, mutual exclusivity must hold
2. **Regression safety** — no existing bridges broken, no existing tests failing
3. **Expression quality** — text must feel tavern-born, consistent with existing style
4. **Variant differentiation** — 2 variants must feel meaningfully different
5. **Scope discipline** — no scope creep, no sneaking in spine events or extra variants

If there's a conflict between these priorities, higher priority wins.

---

## 5. Rollback Strategy

If P83 cannot be completed within scope:

1. **Easy rollback:** Revert all P83 commits — changes are confined to 1 JSON file + 1 TS file + 1 test file + docs
2. **Partial rollback:** If bridge wiring works but expression is problematic, revert expression changes only
3. **No-go trigger:** If implementing the bridge requires new frameworks or systems beyond what's planned, stop and go back to design-first

Rollback is clean because P83 is bounded and touches a small number of files.

---

## 6. No Runtime Behavior Changes in This Story

Per US-002 acceptance criteria, this story produces only documentation. No code, no config, no test changes.

**Zero runtime changes.**

---

**P83-002 complete.** Runtime scope contract locked.
