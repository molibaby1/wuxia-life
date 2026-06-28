# P59 Tavern Hand → Merchant-Adjacent Bridge Closure Report

> **Date:** 2026-06-28
> **Stage:** P59 bounded ordinary-to-mixed bridge
> **Branch:** `codex/p59-wuxia-tavern-hand-merchant-adjacent-bridge`

## 1. Summary

P59 将 `tavern_hand` 到 `merchant_magnate` 的路径从"文档与叙事口径上的人脉信号"推进到"bounded、可验证、可复盘的 playable bridge"。通过最小 JSON 配置接线、玩家可见表达信号、targeted proof 和窄回归测试，闭合了酒肆帮工靠人脉进入商路的 runtime bridge。

## 2. Delivery Evidence

### 2.1 Audit & Scope (P59-001, P59-002)

| Artifact | Path |
|----------|------|
| Gap audit | `docs/test-reports/p59-tavern-hand-bridge-gap-audit.md` |
| Scope contract | `docs/test-reports/p59-tavern-hand-bridge-scope-contract.md` |

### 2.2 Design Contracts (P59-003, P59-004)

| Artifact | Path |
|----------|------|
| Bridge contract | `docs/PRD/p59-tavern-hand-bridge-contract.md` |
| Magnate entry contract | `docs/PRD/p59-tavern-hand-magnate-entry-contract.md` |

### 2.3 Configuration (P59-005)

| Change | File |
|--------|------|
| Added `route_wealth_committed` + `tavern_merchant_bridge_crossed` to `take_referral` flags | `src/data/lines/ordinary-origin-midlife.json` |
| Added `tavern_merchant_bridge_crossed` to `magnate_on_ramp` gate (route + milestone conditions) | `src/data/lines/sample-lines-spine.json` |
| Added `tavern_merchant_bridge_crossed` to `merchant_midlife_debt_milestone` gate (route + milestone conditions) | `src/data/lines/sample-lines-spine.json` |

**Bridge checkpoint:** When tavern hand accepts ally referral, bridge flags are set. Gate expressions expanded to accept bridge flag as alternative to generic merchant route/milestone flags.

### 2.4 Expression (P59-006)

| Surface | Change |
|---------|--------|
| `tavernCurrentGoal()` | New branch: "城里铺子已上手，酒肆人脉铺出了商路" |
| `tavernLifeMemory()` | New branch: "你靠着酒肆积累的人脉进了城里的铺子，从跑堂伙计踏上了商路。" |
| `deriveOrdinaryOriginSummary()` | New branch: "酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。" |

### 2.5 Proof (P59-007)

| Artifact | Evidence |
|----------|----------|
| Targeted proof | `docs/test-reports/p59-tavern-hand-magnate-targeted-proof.md` |
| Gate fix | `sample-lines-spine.json` — `magnate_on_ramp` and `merchant_midlife_debt_milestone` gates accept `tavern_merchant_bridge_crossed` in both route + milestone conditions |
| Flag chain | `tavern_guest_network` → `tavern_embrace_network` → `tavern_take_referral` → `tavern_merchant_bridge_crossed` → P55 magnate chain |
| Gate evaluation | `tavern_merchant_bridge_crossed` satisfies both `magnate_on_ramp` conditions (route flag + merchant milestone) |

### 2.6 Tests (P59-008)

| Test File | Assertions |
|-----------|------------|
| `tests/p59TavernHandBridgeTests.ts` | 16 tests: bridge gate flags, prerequisite enforcement, currentGoal, lifeMemory, summary, ordinary origin preservation, lifeMemory summary integration, non-tavern isolation, **magnate_on_ramp gate acceptance**, **magnate_on_ramp rejection without bridge**, **merchant_midlife_debt gate acceptance**, **magnate_on_ramp rejection when already done**, **magnate_on_ramp rejection for orthodox**, **generic merchant path still works**, **P58 apprentice bridge still works**, **decline referral no bridge** |

## 3. Validation Results

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | **Pass** |
| `npm exec tsx tests/p56OrdinaryOriginGrowthTests.ts` | **Pass** (no regression) |
| `npm exec tsx tests/p58ApprenticeBridgeTests.ts` | **Pass** (no regression) |
| `npm exec tsx tests/p59TavernHandBridgeTests.ts` | **Pass** (16 tests including gate-level assertions) |

## 4. What Now Exists

### 4.1 Runtime Bridge
`tavern_hand` → `tavern_guest_network` → `tavern_midlife_guest_regulars` → `tavern_embrace_network` → `tavern_midlife_ally_referral` → `tavern_take_referral` → `tavern_merchant_bridge_crossed` → `magnate_on_ramp` gate (bridge flag satisfies both conditions) → P55 magnate chain → `merchant_magnate` gate

### 4.2 Player-Visible Expression
- Bridge crossing reads as "从跑堂伙计踏上了商路" (crossed from tavern hand into merchant route)
- Distinct from ordinary midlife ("有人引荐你去城里的铺子")
- Distinct from magnate stage ("产业初成，巨贾之路刚起步")

### 4.3 Evidence Chain
- Configuration: bridge flags in midlife JSON + gate expression expansion in sample-lines-spine.json
- Expression: 3 surfaces with bridge-specific text
- Proof: 1 targeted artifact showing seed → bridge → magnate checkpoint, with gate-level evaluation
- Tests: 16 assertions covering gate acceptance, expression, rejection cases, and regression for P56/P58

## 5. Boundaries

### 5.1 vs. P55 Merchant Deepening
P59 does NOT modify P55 magnate chain, spine events, or expression. P59 only adds a new entry path into the existing P55 chain.

### 5.2 vs. P56 Ordinary Growth
P59 does NOT modify P56 midlife event structure. P59 only adds flag consequences to an existing choice option.

### 5.3 vs. P58 Apprentice Bridge
P59 mirrors the P58 bridge pattern (single bridge flag satisfies both route + milestone conditions), but with distinct prerequisites and narrative framing:
- P58: apprentice → trade curiosity → trade network → partnership → magnate
- P59: tavern_hand → guest network → embrace network → ally referral → magnate

Both bridges enter the same P55 magnate chain but through different origin narratives.

### 5.4 vs. Sample-Line Track
P59 does NOT reopen sample-line track or add second 40+ nodes. P59 operates entirely outside the closed sample-line track.

### 5.5 vs. P60 Peasant Design-First
P59 only handles `tavern_hand`. `farm_peasant` bridge is deferred to P60/P61.

## 6. Deferred Items

The following remain deferred for later merchant or ordinary waves:

| Item | Reason Deferred |
|------|-----------------|
| `farm_peasant` → merchant bridge | Out of P59 scope (single-origin focus); deferred to P60/P61 |
| Full merchant wave expansion | P55 already closed magnate chain |
| Deeper magnate payoff design | P55 already complete |
| Full tavern / social simulation system | Out of scope per PRD |
| Economy system / map system | Out of scope per PRD |
| Platformization / scheduler rewrite | Out of scope per PRD |
| Combinatorial exhaust testing | Out of scope per PRD |
| Full lifetime sim | Not required for bounded bridge proof |
| Additional mixed destiny for tavern_hand | `jianghu_renown_sage` already exists via P25; `merchant_magnate` added via P59 |

## 7. Conclusion

P59 successfully closes the bounded runtime bridge from `tavern_hand` ordinary origin into the `merchant_magnate` mixed gate. The bridge is:
- **Runtime-reachable** through existing JSON config carriers
- **Player-visible** through existing expression surfaces
- **Provable** through targeted verification artifact
- **Regression-protected** through narrow test coverage
- **Non-breaking** to P55, P56, P58, and P25 existing evidence
