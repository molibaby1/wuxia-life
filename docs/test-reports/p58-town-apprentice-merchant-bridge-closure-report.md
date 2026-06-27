# P58 Town Apprentice → Merchant Bridge Closure Report

> **Date:** 2026-06-27
> **Stage:** P58 bounded ordinary-to-mixed bridge
> **Branch:** `codex/p58-wuxia-town-apprentice-merchant-magnate-bridge`

## 1. Summary

P58 将 `town_apprentice` 到 `merchant_magnate` 的路径从"文档与 fixture 口径上可达"推进到"bounded、可验证、可复盘的 playable bridge"。通过最小 JSON 配置接线、玩家可见表达信号、targeted proof 和窄回归测试，闭合了学徒到商路的 runtime bridge。

## 2. Delivery Evidence

### 2.1 Audit & Scope (P58-001, P58-002)

| Artifact | Path |
|----------|------|
| Gap audit | `docs/test-reports/p58-town-apprentice-merchant-bridge-gap-audit.md` |
| Scope contract | `docs/test-reports/p58-town-apprentice-merchant-bridge-scope-contract.md` |

### 2.2 Design Contracts (P58-003, P58-004)

| Artifact | Path |
|----------|------|
| Bridge contract | `docs/PRD/p58-apprentice-bridge-contract.md` |
| Magnate entry contract | `docs/PRD/p58-apprentice-magnate-entry-contract.md` |

### 2.3 Configuration (P58-005)

| Change | File |
|--------|------|
| Added `route_wealth_committed` + `apprentice_merchant_bridge_crossed` to `join_partnership` flags | `src/data/lines/ordinary-origin-midlife.json` |

**Bridge checkpoint:** When apprentice chooses partnership, bridge flags are set. No new framework, no new config carrier.

### 2.4 Expression (P58-006)

| Surface | Change |
|---------|--------|
| `apprenticeCurrentGoal()` | New branch: "合伙经商已有起色，商路渐通" |
| `apprenticeLifeMemory()` | New branch: "你与买卖人合伙经商，从学徒踏上了商路。" |
| `deriveOrdinaryOriginSummary()` | New branch: "学徒出身的商人：从铺子学徒到商路合伙，跨越了手艺与买卖的界限。" |

### 2.5 Proof (P58-007)

| Artifact | Evidence |
|----------|----------|
| Targeted proof | `docs/test-reports/p58-apprentice-magnate-targeted-proof.md` |
| Flag chain | `apprentice_trade_curiosity` → `apprentice_midlife_trade_network` → `apprentice_join_partnership` → `route_wealth_committed` → P55 magnate chain |
| Gate evaluation | 3/4 `merchant_magnate` requirements met by bridge; 4th from P55 downstream |

### 2.6 Tests (P58-008)

| Test File | Assertions |
|-----------|------------|
| `tests/p58ApprenticeBridgeTests.ts` | 8 tests: bridge gate flags, prerequisite enforcement, currentGoal, lifeMemory, summary, ordinary origin preservation, lifeMemory summary integration, non-apprentice isolation |

## 3. Validation Results

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | **Pass** |
| `npm exec tsx tests/p56OrdinaryOriginGrowthTests.ts` | **Pass** (no regression) |
| `npm exec tsx tests/p58ApprenticeBridgeTests.ts` | **Pass** |

## 4. What Now Exists

### 4.1 Runtime Bridge
`town_apprentice` → `apprentice_trade_curiosity` → `apprentice_midlife_trade_network` → `apprentice_join_partnership` → `route_wealth_committed` + `apprentice_merchant_bridge_crossed` → P55 magnate chain → `merchant_magnate` gate

### 4.2 Player-Visible Expression
- Bridge crossing reads as "从学徒踏上了商路" (crossed from apprentice into merchant route)
- Distinct from ordinary midlife ("认识些买卖人，有机会合伙经商")
- Distinct from magnate stage ("产业初成，巨贾之路刚起步")

### 4.3 Evidence Chain
- Configuration: JSON carrier within existing midlife event structure
- Expression: 3 surfaces with bridge-specific text
- Proof: 1 targeted artifact showing seed → bridge → magnate checkpoint
- Tests: 8 assertions covering gate, expression, and proof

## 5. Boundaries

### 5.1 vs. P55 Merchant Deepening
P58 does NOT modify P55 magnate chain, spine events, or expression. P58 only adds a new entry path into the existing P55 chain.

### 5.2 vs. P56 Ordinary Growth
P58 does NOT modify P56 midlife event structure. P58 only adds flag consequences to an existing choice option.

### 5.3 vs. Sample-Line Track
P58 does NOT reopen sample-line track or add second 40+ nodes. P58 operates entirely outside the closed sample-line track.

## 6. Deferred Items

The following remain deferred for later merchant or ordinary waves:

| Item | Reason Deferred |
|------|-----------------|
| `farm_peasant` → merchant bridge | Out of P58 scope (single-origin focus) |
| `tavern_hand` → merchant bridge | Out of P58 scope (single-origin focus) |
| Full merchant wave expansion | P55 already closed magnate chain |
| Deeper magnate payoff design | P55 already complete |
| Economy system / map system | Out of scope per PRD |
| Platformization / scheduler rewrite | Out of scope per PRD |
| Combinatorial exhaust testing | Out of scope per PRD |
| Full lifetime sim | Not required for bounded bridge proof |

## 7. Conclusion

P58 successfully closes the bounded runtime bridge from `town_apprentice` ordinary origin into the `merchant_magnate` mixed gate. The bridge is:
- **Runtime-reachable** through existing JSON config carriers
- **Player-visible** through existing expression surfaces
- **Provable** through targeted verification artifact
- **Regression-protected** through narrow test coverage
- **Non-breaking** to P55, P56, and P25 existing evidence
