# P65 Merchant Trilogy Player Experience Reconciliation — Gaps Report

> **Discovery round:** 1
> **Stage:** P65
> **Status:** NEXT_STAGE (stage CLEAR, end-state OPEN)

---

## Gap Summary

| Gap ID | Description | Route | Notes |
|--------|-------------|-------|-------|
| GAP-P65-001 | Success-cost differentiation (cost is described, not felt) | next-stage | P66 addresses as primary target |
| GAP-P65-002 | Recap-line / destiny-sentence strength (weak at ending) | next-stage | P67 addresses as secondary target |
| GAP-P65-003 | Success-shape differentiation (flavored, not shaped) | defer | Highest scope risk; needs dedicated stage after P66/P67 |
| GAP-P65-004 | Full merchant content wave | defer | Out of P65 reconciliation scope |
| GAP-P65-005 | New merchant systems (economy, map, platform) | defer | Out of bounded scope |
| GAP-P65-006 | Fourth ordinary-origin bridge | defer | Out of scope — P65 focuses on existing trilogy |
| GAP-P65-007 | Full playtest platformization | defer | Too large for this reconciliation stage |

---

## Route Classification

### Next-stage (GAP-P65-001, GAP-P65-002)
Both gaps routed to next-stage because:
- GAP-P65-001 (success-cost differentiation) = #1 priority per P65 ranking, addressed by P66
- GAP-P65-002 (recap-line / destiny-sentence) = #2 priority per P65 ranking, addressed by P67
- Both P66 and P67 PRDs already exist in queue with approved scope

### Defer (GAP-P65-003 through GAP-P65-007)
- GAP-P65-003: Success-shape differentiation has highest potential impact but lowest feasibility and highest scope risk. True shape differentiation risks expanding into full merchant content wave. Deferred to after P66/P67 deliver the cheaper, higher-probability wins.
- GAP-P65-004 through GAP-P65-007: Explicitly out of P65 reconciliation scope. P65 is a player-experience audit and prioritization stage, not an expansion stage.

---

## Next-stage PRD

| Stage | PRD MD | Status |
|-------|--------|--------|
| P66 | `docs/PRD/p66-wuxia-merchant-trilogy-success-cost-differentiation.md` | Already queued — primary next cut |
| P67 | `docs/PRD/p67-wuxia-merchant-trilogy-success-shape-and-recap.md` | Already queued — follows P66 |

---

## Evidence Links

- P65 closure: `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`
- P65 player route audit: `docs/test-reports/p65-merchant-trilogy-player-route-audit.md`
- P65 experience reconciliation: `docs/test-reports/p65-merchant-trilogy-experience-reconciliation.md`
- P65 scope contract: `docs/test-reports/p65-merchant-trilogy-experience-scope-contract.md`
- P63 closure (entry differentiation): `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`
- P64 closure (pressure/payoff differentiation): `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`

---

## Notes

- P65 is documentation-only; no runtime code changes
- All 8 P65 stories pass (P65-001 through P65-008)
- No in-stage gaps — P65 fully completes its reconciliation mandate
- Priority ranking confirmed: (1) success-cost → (2) recap-line → (3) success-shape
- end_state_status: OPEN because P66 and P67 have not yet been implemented
- P66 = success-cost differentiation (immediate next)
- P67 = recap-line / destiny-sentence + success-shape polish (follows P66)
