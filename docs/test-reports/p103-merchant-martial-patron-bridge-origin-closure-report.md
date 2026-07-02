# P103 Merchant Martial Patron Bridge-Origin Closure Report

> **Stage:** P103 Wuxia Merchant Martial Patron Bridge-Origin (Narrow Playable)  
> **Branch:** `codex/p103-wuxia-merchant-martial-patron-bridge-origin-narrow-playable`  
> **Date:** 2026-07-02  
> **Gap closed:** GAP-P102-N01

## 1. What P103 Proves

| Claim | Evidence |
| ----- | -------- |
| Bridge-origin apprentice/tavern can enter patron bridge without `merchant_invest_*` | Extended `merchant_patron_bridge_entry` gate + origin choices |
| At least 2 origins produce distinct player-facing differentiation | Expression pairs in goal/cost/identity; distinct checkpoint flags |
| P102 native wealth+invest patron path unchanged | Native gate arm preserved; regression tests pass |
| P97–P101 magnate spine no regression | Magnate test suite passes |
| Expression priority rules hold | Native orthodox/martial > bridge origin; magnate > patron |

## 2. Deliverables

| Artifact | Path |
| -------- | ---- |
| Gap audit | `docs/test-reports/p103-merchant-martial-patron-bridge-origin-gap-audit.md` |
| Scope contract | `docs/test-reports/p103-merchant-martial-patron-bridge-origin-scope-contract.md` |
| Chain proof | `docs/test-reports/p103-merchant-martial-patron-bridge-origin-chain-proof.md` |
| Focused test | `tests/p103MerchantMartialPatronBridgeOriginTests.ts` |
| Spine extension | `merchant_patron_bridge_entry` in `sample-lines-spine.json` |
| Expression | Bridge-origin branches in `src/p50/sampleLineExpression.ts` |

## 3. Verification

| Check | Result |
| ----- | ------ |
| `npm run typecheck` | Pass |
| `p103MerchantMartialPatronBridgeOriginTests` | Pass (7 assertion groups) |
| `p102MerchantMartialPatronBridgeTests` | Pass (no regression) |
| `p97`–`p101` magnate tests | Pass (no regression) |
| `npm run guard:sample-lines-baseline` | Pass |

## 4. Checkpoint Flags Introduced

| Flag | Set by | Purpose |
| ---- | ------ | ------- |
| `merchant_patron_bridge_apprentice_craft` | `patron_bridge_apprentice_craft_alliance` | Apprentice bridge-origin patron checkpoint |
| `merchant_patron_bridge_tavern_network` | `patron_bridge_tavern_network_alliance` | Tavern bridge-origin patron checkpoint |

## 5. Deferred (Out of Scope)

- Peasant bridge-origin patron entry (`peasant_merchant_bridge_crossed`)
- Full patron pressure/mid/late chain
- Full Wave 3 mixed-achievement graph
- North Star §8 broader waves
- Full-lifetime `gate:p20` broad rerun

## 6. Residual Risk

- Players with both native invest markers and bridge markers see native choices when invest flags present — expression correctly prefers native variants; dual-path UI edge case is acceptable for narrow sample scope.
- Bridge-origin patron entry shares age band with native entry — no mutual exclusion beyond `merchant_patron_bridge_crossed` once guard.
