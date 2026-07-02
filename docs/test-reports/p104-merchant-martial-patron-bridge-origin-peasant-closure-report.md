# P104 Merchant Martial Patron Bridge-Origin Peasant Closure Report

> **Stage:** P104 Wuxia Merchant Martial Patron Bridge-Origin Peasant (Narrow Playable)  
> **Date:** 2026-07-02  
> **Branch:** `codex/p104-wuxia-merchant-martial-patron-bridge-origin-peasant-narrow-playable`

---

## 1. What P104 Proves

| Claim | Evidence |
| ----- | -------- |
| Peasant bridge-origin can enter patron bridge without `merchant_invest_*` | Extended `merchant_patron_bridge_entry` gate + `patron_bridge_peasant_grain_alliance` |
| Distinct peasant checkpoint beyond flavor text | `merchant_patron_bridge_peasant_grain` flag set by entry choice |
| Player-facing differentiation | Goal / cost / identity expression branches for peasant bridge-origin |
| P102 native path non-regressed | `p102MerchantMartialPatronBridgeTests` pass |
| P103 apprentice/tavern paths non-regressed | `p103MerchantMartialPatronBridgeOriginTests` pass |
| Magnate spine non-regressed | P100/P101 magnate tests pass |

---

## 2. Artifacts

| Artifact | Path |
| -------- | ---- |
| Gap audit | `docs/test-reports/p104-merchant-martial-patron-bridge-origin-peasant-gap-audit.md` |
| Scope contract | `docs/test-reports/p104-merchant-martial-patron-bridge-origin-peasant-scope-contract.md` |
| Chain proof | `docs/test-reports/p104-merchant-martial-patron-bridge-origin-peasant-chain-proof.md` |
| Focused test | `tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts` |

---

## 3. Spine Changes (Additive)

| Surface | Change |
| ------- | ------ |
| `merchant_patron_bridge_entry` gate | Bridge arm OR includes `peasant_merchant_bridge_crossed` |
| New choice | `patron_bridge_peasant_grain_alliance` |
| New checkpoint | `merchant_patron_bridge_peasant_grain` |
| Expression | `sampleLineExpression.ts` peasant patron branches |

---

## 4. Checkpoint Flags

| Flag | Choice | Role |
| ---- | ------ | ---- |
| `merchant_patron_bridge_peasant_grain` | `patron_bridge_peasant_grain_alliance` | Peasant bridge-origin patron checkpoint |

---

## 5. Verification

| Check | Result |
| ----- | ------ |
| `npm run typecheck` | Pass |
| `p104MerchantMartialPatronBridgeOriginPeasantTests` | Pass (8 assertion groups) |
| `p102MerchantMartialPatronBridgeTests` | Pass |
| `p103MerchantMartialPatronBridgeOriginTests` | Pass |
| `npm run guard:sample-lines-baseline` | Pass |

---

## 6. Deferred (Out of P104 Scope)

- Full patron pressure/mid/late chain
- Full Wave 3 mixed-achievement graph
- North Star §8 broader waves
- Full-lifetime `gate:p20` broad rerun

---

## 7. Priority Rules (Confirmed)

1. Magnate expression wins when magnate markers set
2. Native patron orthodox/martial wins when invest variant markers set
3. Peasant patron expression when `merchant_patron_bridge_peasant_grain` or `peasant_merchant_bridge_crossed` + `merchant_patron_on_ramp_done` without native variant
4. Apprentice/tavern bridge expressions unchanged and retain their own priority when respective markers set
