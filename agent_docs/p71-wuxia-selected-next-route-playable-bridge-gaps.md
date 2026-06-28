# P71 Discovery Gaps — Selected Next Route Playable Bridge

> **Stage:** P71 Wuxia Selected Next Route Playable Bridge
> **Discovery mode:** post-run (pipeline-auto, allow spawn-stage)
> **Date:** 2026-06-29

## 1. Stage-Internal Gaps (In-Stage)

P71 自身范围的所有 7 个 user story 均已通过验收，无 in-stage gaps 需要追加。

| Story | Status | Evidence |
|-------|--------|----------|
| P71-001 Audit implementation delta | ✅ Pass | `docs/test-reports/p71-selected-route-bridge-implementation-audit.md` |
| P71-002 Lock runtime scope contract | ✅ Pass | `docs/test-reports/p71-selected-route-bridge-scope-contract.md` |
| P71-003 Implement bridge wiring | ✅ Pass | `ordinary-origin-midlife.json` + `tavern_renown_bridge_crossed` flag |
| P71-004 Bridge player-facing expression | ✅ Pass | 3 expression branches (currentGoal, lifeMemory, summary) |
| P71-005 Targeted bridge proof | ✅ Pass | `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md` (11 nodes) |
| P71-006 Narrow regression coverage | ✅ Pass | `tests/p71TavernHandRenownBridgeTests.ts` (15 assertions) |
| P71-007 Closure report | ✅ Pass | `docs/test-reports/p71-selected-next-route-bridge-closure-report.md` |

**Regression verification:**
- P56 ordinary origin tests: ✅ Pass
- P58 apprentice bridge tests: ✅ Pass
- P59 tavern hand merchant bridge tests: ✅ Pass
- P61 farm peasant bridge tests: ✅ Pass
- lifeMemorySummary tests: ✅ Pass
- TypeScript typecheck: ✅ Pass

## 2. Cross-Stage Gaps (Next-Stage)

以下 gap 超出 P71 scope，应路由至 P72（entry differentiation）：

### GAP-P71-NS1: Entry differentiation not yet implemented
- **Severity:** OPEN (expected — P71 is bridge-only)
- **North Star reference:** §3.1 (jianghu_renown_sage mainstream achievement requires full playable path, not just bridge)
- **Description:** Bridge crossing 已闭合，但 bridge 后的 entry 层（post-bridge 第一层 shared path）尚未做差异化表达。玩家刚进入 renown 路线时，entry 层的身份信号可能不足。
- **Route to:** P72 (Selected Next Route Entry Differentiation)
- **Acceptance direction:** entry 层至少 3 个可读差异信号，玩家能区分 "带着 tavern_hand 出身的 renown" 与 generic renown

### GAP-P71-NS2: Full stat chain to gate threshold not verified
- **Severity:** OPEN (expected — P71 is bridge-only)
- **North Star reference:** §3.1 (jianghu_renown_sage: 武学≥45, 声望≥65, 社会资本≥55)
- **Description:** P71 bridge 只验证了 key_choices 维度（ally_network）满足 gate 条件，未验证 full stat chain（武学/声望/社会资本）能否从 bridge event 后实际增长到 gate 阈值。
- **Route to:** P72 (entry differentiation + extended proof)
- **Acceptance direction:** targeted proof 从 bridge 延伸到 gate acceptance（含 stats）

### GAP-P71-NS3: Only one origin has renown bridge
- **Severity:** OPEN (future cycle)
- **North Star reference:** §3.4 (平凡出身 ≥3 种产生可区分轨迹)
- **Description:** 当前只有 tavern_hand 有 renown bridge，farm_peasant 和 town_apprentice 尚未接入 renown 路线。
- **Route to:** Future cycle (after P72+ renown route is proven viable)
- **Acceptance direction:** 至少 2-3 个 ordinary origin 都有 renown bridge

### GAP-P71-NS4: Mentor-bond bridge direction not implemented
- **Severity:** OPEN (future cycle)
- **North Star reference:** §3.1 (jianghu_renown_sage key_choices: mentor_bond OR ally_network)
- **Description:** gate 允许 mentor_bond 或 ally_network 任一满足，但当前只有 ally_network bridge。mentor_bond 方向的桥接路径尚未实现。
- **Route to:** Future cycle (second renown bridge direction)
- **Acceptance direction:** mentor_bond 路径也能通过 bridge 进入 renown route

### GAP-P71-NS5: Medical sage route not started
- **Severity:** OPEN (Wave 1 remaining)
- **North Star reference:** §3.1 (medical_sage_healer — 5th mainstream achievement)
- **Description:** Wave 1 第五条主流成就 `medical_sage_healer`（一代名医）尚未开始实现。当前只有 4 条主流成就有 playable path（P16 三条 + jianghu_renown_sage bridge）。
- **Route to:** Future wave (after renown route completes P72+)
- **Acceptance direction:** medical_sage_healer 形成完整 playable bridge + entry differentiation

### GAP-P71-NS6: Decline merchant → renown offer not supported
- **Severity:** LOW (deferred refinement)
- **North Star reference:** §4.2 (事件触发选择的拒绝/回避应有可观测后果)
- **Description:** 当前 `ordinary_tavern_midlife_done` 在 merchant bridge decline 时也被设置，导致 29 岁的 renown bridge 不会触发。玩家拒绝 merchant 后也无法获得 renown 选项。
- **Route to:** P72+ refinement (if entry stage validates worth)
- **Acceptance direction:** 拒绝 merchant 后仍有机会获得 renown bridge offer

## 3. End-State Gaps (North Star §8)

对照 North Star §8 Discovery 完成判定：

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | ❌ OPEN | 主流：4/5 有 playable path（缺 medical_sage）；混合/巅峰：0/0 |
| 2 | 平凡出身 ≥3 种产生与鲜明出身可区分的早期与中期轨迹 | ⚠️ PARTIAL | 3 种 ordinary origin 都有 merchant bridge；但 renown 路线仅 1 种 |
| 3 | 主动 + 事件触发选择的后果链零自相矛盾 | ✅ VERIFIED | P71 closure 10/10 criteria；所有回归测试通过 |
| 4 | 模拟门禁证明：巅峰成就需运气+选择；主流成就可单靠合理选择+时间达到中高档 | ❌ OPEN | 未做模拟门禁验证；新 renown route 尚未做 full stat chain proof |
| 5 | gate:playability、gate:p20 及 P25 专用报告不退化 | ✅ VERIFIED | 所有回归测试通过；typecheck 通过 |

**End-state summary: OPEN** — Wave 1 主流成就尚未全部完成，混合/巅峰成就未开始，模拟门禁未做验证。

## 4. Gap Routing Summary

| Gap | Route | Priority |
|-----|-------|----------|
| GAP-P71-NS1 Entry differentiation | P72 | High (queued next) |
| GAP-P71-NS2 Full stat chain proof | P72 | High (queued next) |
| GAP-P71-NS6 Decline→renown refinement | P72+ | Medium |
| GAP-P71-NS3 Multi-origin renown bridges | Future cycle | Low |
| GAP-P71-NS4 Mentor-bond bridge | Future cycle | Low |
| GAP-P71-NS5 Medical sage route | Future wave | Low |
