# P63 Merchant Entry Differentiation Scope Contract

> **Date:** 2026-06-28
> **Stage:** P63 Merchant Magnate Bridge-Entry Differentiation
> **Branch:** `codex/p63-wuxia-merchant-magnate-bridge-entry-differentiation`
> **Type:** Scope governance document

---

## 1. Scope Definition

P63 is a **bounded bridge-entry differentiation stage**. Its only job is to add minimum viable differentiation at the magnate on-ramp layer so the three ordinary-origin bridge paths (apprentice, tavern, peasant) remain distinguishable to the player after crossing into the shared P55 magnate chain.

**P63 does NOT invent new merchant routes. It only ensures the existing three entry paths read differently at the point they converge.**

---

## 2. Allowed Layers

P63 is permitted to work in the following layers only:

### 2.1 Light Configuration
- Entry checkpoint flavor text at `magnate_on_ramp`
- Origin-bridge type markers (light flags, not new frameworks)
- Expression surface configuration for entry differentiation

### 2.2 Expression
- Differentiation in `currentGoal()` surface at magnate entry
- Differentiation in `lifeMemory()` surface at magnate entry
- Differentiation in `deriveOrdinaryOriginSummary()` surface at magnate entry
- No new UI components

### 2.3 Proof
- One comparison-style targeted proof artifact showing entry differentiation
- Does not require full lifetime comparative exhaust

### 2.4 Narrow Tests
- Entry marker assertions
- Player-facing expression assertions
- Comparison-level assertions for the three bridge paths
- Reuse existing bridge and merchant harnesses

---

## 3. Forbidden Expansions

P63 is explicitly FORBIDDEN from the following:

### 3.1 Pressure/Payoff Wave Growth
- Do NOT expand `magnate_midlife_pressure` events
- Do NOT expand `magnate_payoff` events
- Do NOT create differentiated pressure/payoff paths per origin

### 3.2 Full Merchant Densification
- Do NOT create new merchant events beyond entry differentiation
- Do NOT expand the merchant chain beyond the on-ramp layer
- Do NOT add new merchant subsystems (trade platforms, economy maps, etc.)

### 3.3 New Systems
- Do NOT introduce new event frameworks
- Do NOT create new merchant route frameworks
- Do NOT add new identity tracks

### 3.4 Bridge Rewriting
- Do NOT rewrite the three ordinary-origin bridges (P58/P59/P61)
- Do NOT modify the bridge flag naming pattern
- Do NOT change the bridge checkpoint mechanisms

### 3.5 Mixed Destiny Work
- Do NOT modify `merchant_magnate` mixed identity definition
- Do NOT create new mixed destinies
- Do NOT alter the P55 magnate skeleton

---

## 4. P63 Entry Differentiation Contract

### 4.1 What P63 MUST Preserve (Healthy Reuse)
| Item | Rationale |
|------|----------|
| `magnate_on_ramp` gate architecture | P55 magnate skeleton |
| `{origin}_merchant_bridge_crossed` flag pattern | Consistency |
| `route_wealth_committed` route commitment | Single route identity |
| `merchant_magnate` mixed identity | All three must reach same outcome |
| P55 magnate chain (pressure → payoff) | Must not break existing chain |

### 4.2 What P63 MAY Differentiate (Bounded)
| Item | Limit |
|------|-------|
| Entry checkpoint flavor text | Light, at `magnate_on_ramp` only |
| Expression templates | Extend bridge seed, not invent new backgrounds |
| Expression surface wiring | Carry origin-specific differentiation |
| Light origin markers | Distinguish bridge type at entry |

---

## 5. Boundary With P64

**P63 boundary:** Entry differentiation at `magnate_on_ramp` layer only.

**P64 starts:** Differentiated pressure/payoff wave expansion for the magnate chain.

If P63 work reveals that meaningful differentiation requires pressure/payoff changes, that work belongs to P64, not P63.

---

## 6. Deferred Items (Not P63 Scope)

The following remain deferred for future stages:

| Item | Rationale |
|------|-----------|
| Differentiated magnate_midlife_pressure paths | P64 territory |
| Differentiated magnate_payoff paths | P64 territory |
| Full merchant wave expansion | Out of scope |
| New merchant subsystems | Out of scope |
| Additional ordinary-origin bridges | Already complete (3/3) |

---

## 7. Success Criteria for P63

1. All three bridge entries read differently at `magnate_on_ramp`
2. Expression differentiation is runtime-visible (not just document-visible)
3. P55/P58/P59/P61 evidence does not regress
4. P64 decision is supported by P63 proof artifact
