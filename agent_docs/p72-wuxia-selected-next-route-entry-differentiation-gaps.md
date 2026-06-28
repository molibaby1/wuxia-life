# P72 Gaps Report: Selected Next Route Entry Differentiation

> **Stage:** P72 Wuxia Selected Next Route Entry Differentiation
> **Route:** `jianghu_renown_sage` (江湖名宿)
> **Discovery mode:** post-run (pipeline E1)

---

## 1. Stage Completeness Assessment

### In-Stage Stories: All Complete

| Story | Status | Evidence |
|-------|--------|----------|
| P72-001 Audit post-bridge entry sharedness | ✅ Done | `docs/test-reports/p72-selected-route-entry-sharedness-audit.md` — 6 flattening points identified |
| P72-002 Lock P72 scope contract | ✅ Done | `docs/test-reports/p72-selected-route-entry-scope-contract.md` — 4 allowed layers, 4 forbidden categories |
| P72-003 Define entry differentiation contract | ✅ Done | `docs/PRD/p72-wuxia-renown-entry-differentiation-contract.md` — 4 core identity signals |
| P72-004 Wire entry-level differentiation | ✅ Done | `src/p50/sampleLineExpression.ts` + `src/utils/playerFacingLabels.ts` — renown detection + expression |
| P72-005 Add player-facing entry expression | ✅ Done | 4+ readable signals: currentGoal, costLabel, age40Identity, route summary name |
| P72-006 Add targeted entry proof | ✅ Done | `docs/test-reports/p72-tavern-hand-renown-entry-targeted-proof.md` — 4 cases × 6 surfaces, all distinct |
| P72-007 Add narrow regression coverage | ✅ Done | 15 tests in `tests/p72TavernHandRenownEntryDifferentiationTests.ts` — all pass |
| P72-008 Produce P72 closure report | ✅ Done | `docs/test-reports/p72-selected-next-route-entry-closure-report.md` — go decision for deeper work |

**In-stage gap count: 0** — all 8 stories pass, zero regressions.

---

## 2. End-State Gap Analysis (vs North Star §8)

对照 `docs/designs/p25-lifetime-simulation-north-star.md` §8 的 5 条 CLEAR 标准：

### END-001: 主流、混合、巅峰三类成就均有可玩样本且规则文档化
**Status: OPEN — far from complete**

Gap breakdown:
- **Wave 1 主流成就 — 5 条中仅 4 条有 partial 实现**
  - `grandmaster_guardian` — P16 已有 ✅
  - `sect_leader_statesman` — P16 已有 ✅
  - `lone_sword_legend` — P16 已有 ✅
  - `jianghu_renown_sage` — 仅 bridge + entry 差异化，无 on-ramp/pressure/payoff 主链 ⚠️
  - `medical_sage_healer` — 完全未开始 ❌
- **Wave 2 巅峰成就** — 完全未开始 ❌
- **Wave 3 混合成就** — merchant_magnate 有 P55 基础，其余未开始 ❌

**Route to next-stage:** `jianghu_renown_sage` on-ramp spine (P73) → pressure/payoff → 然后启动 `medical_sage_healer`

---

### END-002: 平凡出身 ≥3 种产生与鲜明出身可区分的早期与中期轨迹
**Status: OPEN — only 1 of 3 done**

Gap breakdown:
- `tavern_hand` (酒肆跑堂) — bridge + entry done for both merchant and renown ✅
- `town_apprentice` (小镇学徒) — merchant bridge done ⚠️ (但 renown/medical 未做)
- `farm_peasant` (农户子弟) — merchant bridge done ⚠️ (但 renown/medical 未做)
- **Renown/medical 路线的平凡出身覆盖** — 仅 tavern_hand 有 renown bridge，其余两条出身尚无 renown/medical 路径 ❌

**Route to next-stage:** 先完成第一条路线（jianghu_renown_sage）的全链路深度，再复制到其他出身。

---

### END-003: 主动 + 事件触发选择的后果链，在验收切片中零自相矛盾
**Status: OPEN — partial verification only**

Gap breakdown:
- P72 scope 内：entry 层表达无矛盾 ✅
- 全生命周期：尚未做 end-to-end consequence chain 验证 ❌
- renown 路线：尚无 on-ramp / pressure / payoff 事件，无法验证全链路后果一致性 ❌

**Route to next-stage:** P73 on-ramp → P74 pressure → P75 payoff，每阶段补 consequence chain 验证。

---

### END-004: 模拟门禁证明：巅峰成就需运气+选择；主流成就可单靠合理选择+时间达到中高档
**Status: OPEN — no simulation gate evidence yet**

Gap breakdown:
- 巅峰成就：尚未实现，无法验证 ❌
- 主流成就（jianghu_renown_sage）：仅有 entry 层，远未到 payoff，无法做门禁验证 ❌
- Simulation-driven workflow：尚未对 renown 路线运行 metrics 分类验证 ❌

**Route to next-stage:** P73-P75 完成 renown 全链路后，做 simulation gate 验证。

---

### END-005: gate:playability、gate:p20 及 P25 专用报告不退化
**Status: CLEAR (current scope)**

- P72 全部新增代码零回归 ✅
- P71 bridge 测试通过 ✅
- P56 origin 测试通过 ✅
- Life memory summary 测试通过 ✅
- TypeScript type check 通过 ✅

**No gap here — but conditional on no future regressions.**

---

## 3. Gap Routing

| Gap ID | Description | Routing | Target Stage |
|--------|-------------|---------|--------------|
| END-001 | 主流/混合/巅峰成就不全 | next-stage | P73 (renown on-ramp) → P74 (pressure) → P75 (payoff) → P76+ (medical_sage_healer 启动) |
| END-002 | 平凡出身覆盖不足 | next-stage (later) | P77+ (renown 路线扩展到其他出身) |
| END-003 | 全链路后果一致性未验证 | next-stage | P73-P75 每阶段补 consequence 验证 |
| END-004 | 模拟门禁未建立 | next-stage (later) | P76+ (renown 全链路后做 simulation gate) |
| END-005 | 不退化 | in-stage (maintained) | N/A — currently clear |

**In-stage gaps: 0**
**Next-stage gaps: 4 (END-001 through END-004)**

---

## 4. Immediate Next Stage Justification

P68-P72 五阶段已形成完整的"方法论迁移验证"闭环：
1. P68: 商人三部曲体验验证（方法论可迁移性验证）
2. P69: 下一条路线候选对账（选出 jianghu_renown_sage）
3. P70: 选定路线设计优先契约（bridge contract）
4. P71: 选定路线可玩桥接（runtime bridge 实现）
5. P72: 选定路线入口差异化（entry differentiation 实现）

闭环验证成功。按 merchant trilogy 的深化路径（entry → on-ramp → pressure → payoff），下一阶段应为 **jianghu_renown_sage 的 on-ramp spine 事件**，建立 renown 路线的主链骨架。

这对应：
- Merchant trilogy: P55 (magnate on-ramp skeleton) → P63 (entry differentiation) → P64 (pressure/payoff)
- Renown trilogy: P71 (bridge) → P72 (entry) → **P73 (on-ramp spine)** → P74 (pressure) → P75 (payoff)

**Spawn P73: jianghu_renown_sage on-ramp spine event.**

---

End of gaps report.
