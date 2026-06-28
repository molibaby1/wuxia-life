# P61 Farm Peasant Playable Bridge — Gaps

> Stage: `p61-wuxia-farm-peasant-playable-bridge`
> Date: 2026-06-28

## 1. In-Stage Gaps (P61 Scope)

None. All 8 P61 user stories are complete and verified:

| Story | Status | Evidence |
|-------|--------|----------|
| P61-001 Confirm P60 contract intake | PASS | `docs/test-reports/p61-farm-peasant-bridge-intake.md` |
| P61-002 Lock P61 scope contract | PASS | `docs/test-reports/p61-farm-peasant-bridge-scope-contract.md` |
| P61-003 Implement minimum bridge content | PASS | Config in `ordinary-origin-midlife.json` — reframed outside_offer to grain-trade context + bridge flags |
| P61-004 Wire the chosen downstream gate | PASS | `peasant_merchant_bridge_crossed` added to `magnate_on_ramp` + `merchant_midlife_debt_milestone` in `sample-lines-spine.json` |
| P61-005 Add peasant bridge expression | PASS | 3 expression surfaces in `ordinaryOriginExpression.ts` — currentGoal, lifeMemory, summary |
| P61-006 Add targeted playable bridge proof | PASS | `docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md` |
| P61-007 Add narrow regression coverage | PASS | 18 tests in `tests/p61FarmPeasantBridgeTests.ts` — all pass |
| P61-008 Produce P61 closure report | PASS | `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md` |

### Verification
- `npx tsc --noEmit`: Pass
- `npm exec tsx tests/p61FarmPeasantBridgeTests.ts`: All 18 tests pass
- P56 ordinary origin regression: Pass
- P58 apprentice bridge regression: Pass
- P59 tavern hand bridge regression: Pass

## 2. North Star §8 Status After P61

P61 completes the third ordinary-origin bridge (`farm_peasant` → `merchant_magnate`), closing the Wave 4 ordinary-origin trilogy. Full §8 item-by-item assessment:

| §8 Item | Status | Evidence |
|---------|--------|----------|
| 1 — 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | **Met** | Mainstream: P34 `medical_sage_healer` (habit-led lifetime). Mixed: P35 `healer_swordsman` + P37 `merchant_martial_patron` + P55 `merchant_magnate`. Pinnacle: P35 `jianghu_myth_legend` + P37 `founding_patriarch`. All have documented rules and verification artifacts. |
| 2 — 平凡出身 ≥3 种产生与鲜明出身可区分的早期与中期轨迹 | **Met** | 3 origins: `farm_peasant`, `town_apprentice`, `tavern_hand`. Early: P25 ordinary-origin slice (overlap=0.00 vs vivid controls). Midlife: P56 growth wave (2 midlife forks per origin). All 3 now also have bridges to mixed achievement (P58/P59/P61). |
| 3 — 主动 + 事件触发选择的后果链，在验收切片中零自相矛盾 | **Met** | P39 full-pool audit: 13 paths, `highSeverityContradictionCount: 0`. Covers P25 representative + P34/P35/P37 lifetime + pool samples. |
| 4 — 模拟门禁证明：巅峰成就需运气+选择；主流成就可单靠合理选择+时间达到中高档 | **Met** | Pinnacle: P35 + P37 dual-gate traces (choice + luck, grind-only fails). Mainstream: P34 medical lifetime (habit on-ramp → unlock without luck). |
| 5 — `gate:playability`、`gate:p20` 及 P25 专用报告不退化 | **Met** | P38: `gate:playability` PASS (6/6 blocker personas 0.00 opaque ratio). `gate:p20` pass (carry-forward, no regression). P25 reports: non-regression verified across all stages. |

## 3. Deferred (Not Planned in Near Term)

The following items remain deferred but do not block North Star §8 CLEAR status:

| Item | Rationale |
|------|-----------|
| Escort / jianghu-renown bridge for farm_peasant | Good narrative idea, but no downstream event chain. §8 satisfied with merchant bridge. |
| `farm_peasant` → healer-swordsman medical path | No peasant-medical seed; would need new system building. Not required for §8. |
| Rural-urban migration system | Too large — full feature, not a bridge. Out of scope for bounded delivery. |
| Fourth ordinary origin | Explicitly forbidden per P56 scope contract. §8 only requires ≥3. |
| Full ordinary-origin rebalance | Out of scope — P61 is single-origin implementation. |
| Economy system / trade routes map | Platform-level change — dwarfs bridge scope. |
| Full lifetime sim (age 0–50) for all origins | Out of scope for bounded bridge stages. |
| Combinatorial exhaust of all origin + achievement combinations | Not required by §8; bounded representative audit sufficient. |
