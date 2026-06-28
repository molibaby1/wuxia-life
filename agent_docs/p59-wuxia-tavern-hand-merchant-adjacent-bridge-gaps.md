# P59 Tavern Hand Merchant-Adjacent Bridge — Gaps

> Stage: `p59-wuxia-tavern-hand-merchant-adjacent-bridge`
> Date: 2026-06-28

## 1. In-Stage Gaps (P59 Scope)

None. All 9 P59 user stories are complete and verified:

| Story | Status | Evidence |
|-------|--------|----------|
| P59-001 Audit bridge opportunity | PASS | `docs/test-reports/p59-tavern-hand-bridge-gap-audit.md` |
| P59-002 Lock scope contract | PASS | `docs/test-reports/p59-tavern-hand-bridge-scope-contract.md` |
| P59-003 Define bridge contract | PASS | `docs/PRD/p59-tavern-hand-bridge-contract.md` |
| P59-004 Choose downstream gate | PASS | `docs/PRD/p59-tavern-hand-magnate-entry-contract.md` |
| P59-005 Wire bridge configuration | PASS | Config in `ordinary-origin-midlife.json` + `sample-lines-spine.json` |
| P59-006 Add bridge expression | PASS | 3 expression surfaces in `ordinaryOriginExpression.ts` |
| P59-007 Targeted bridge proof | PASS | `docs/test-reports/p59-tavern-hand-magnate-targeted-proof.md` |
| P59-008 Narrow regression coverage | PASS | 16 tests in `tests/p59TavernHandBridgeTests.ts` — all pass |
| P59-009 Closure report | PASS | `docs/test-reports/p59-tavern-hand-bridge-closure-report.md` |

### Verification
- `npx tsc --noEmit`: Pass
- `npm exec tsx tests/p59TavernHandBridgeTests.ts`: All 16 tests pass
- P56 ordinary origin regression: Pass
- P58 apprentice bridge regression: Pass

## 2. Next-Stage Gaps (Beyond P59)

### END-001: farm_peasant bridge not yet implemented
**Severity:** High
**Rationale:** North Star §3.4 requires ordinary origins to have paths to middle-tier mainstream or mixed achievements. P56 established early/midlife growth for all 3 ordinary origins. P58 (town_apprentice) and P59 (tavern_hand) have both completed bounded bridges to merchant_magnate. farm_peasant remains the only ordinary origin without a bridge to higher-value routes.

**Current state:** P60 (design-first) and P61 (playable implementation) are already queued but not yet started.

**Why not in P59:** P59 scope is explicitly single-origin (tavern_hand only). farm_peasant bridge has different narrative seeds and feasibility profile (no existing trade-network signal), requiring a dedicated design-first stage before implementation.

**Route to closure:** P60 → P61 sequential execution.

### END-002: Verify 3/3 ordinary-origin bridges as a complete set
**Severity:** Medium
**Rationale:** Once P60/P61 complete, all 3 ordinary origins will have bridges. A final reconciliation pass should verify:
- All 3 bridges have distinct narrative identities (not copy-paste)
- All 3 can reach at least one mixed/mainstream achievement
- Cross-origin regression protection is in place
- P25 ordinary wiring evidence is updated to reflect all 3 bridges

**Why not in P59:** Requires farm_peasant bridge to exist first.

**Route to closure:** Post-P61 reconciliation stage or integrated into P61 closure.

## 3. Deferred (Not Planned in Near Term)

- Full merchant wave expansion (P55 magnate chain is complete)
- Full tavern / social simulation system
- Economy system / map system
- Combinatorial exhaust testing of all ordinary origin + achievement combinations
- Additional mixed destinies for tavern_hand (jianghu_renown_sage already exists via P25 wiring)
