# P72 Selected Next Route Entry Differentiation — Closure Report

> **Date:** 2026-06-29
> **Stage:** P72 Wuxia Selected Next Route Entry Differentiation
> **Route:** `jianghu_renown_sage` (江湖名宿)
> **Origin:** `tavern_hand` (酒肆跑堂)
> **Bridge:** Ally-Network Midlife Bridge (P71 — done)
> **Scope:** Bounded post-bridge entry differentiation only

---

## 1. Executive Summary

P72 已完成。`jianghu_renown_sage` 路线在 bridge 后的 entry 层已具备清晰的身份差异化，不再塌缩回 generic tavern_hand 或 generic renown。

**核心结论：**
- ✅ Entry 层差异化已到位，4+ 表达面全部有 renown 专属内容
- ✅ 酒肆出身的味道（tavern-born flavor）贯穿所有表达面
- ✅ 与 merchant bridge、orthodox、demonic、plain tavern 均有清晰区分
- ✅ 全部通过现有测试 + 新增 15 个窄回归测试，零回归
- ✅ 为 P73+ 的深层差异化（on-ramp、pressure、payoff）打下了坚实基础

**Go/No-Go for deeper work: GO** — 身份基础扎实，继续深化是合理的。

---

## 2. What Entry Differentiation Now Exists

### 2.1 Expression Surfaces

| Surface | Renown Entry Text | Trigger |
|---------|-------------------|---------|
| **Sample line** | `'renown'` | `tavern_renown_bridge_crossed` |
| **Current goal** | "凭人脉声名在江湖立足，常有人来寻你引荐主事" | `tavern_renown_bridge_crossed` |
| **Cost label** | "江湖声名之累" | `tavern_renown_bridge_crossed` |
| **Age-40 identity** | "你是从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量。" | `tavern_renown_bridge_crossed` + age ≥ 38 |
| **Route summary name** | "江湖名宿" | `tavern_renown_bridge_crossed` or `route_renown_committed` |
| **Origin summary** | "酒肆出身的江湖人物：靠人脉和名声在江湖上立足。" | `origin_tavern_hand` + renown bridge |

### 2.2 Core Identity Signals Preserved

1. **Tavern origin** — "从酒肆走来", "酒肆出身", "酒肆出身的江湖人物"
2. **Network/reputation path** — "人脉为基", "引荐为径", "声名", "人脉和名声"
3. **Social cost, not martial** — "江湖声名之累", "人情往来的重量"
4. **Bridge as checkpoint** — All renown expression requires `tavern_renown_bridge_crossed`

### 2.3 Detection Priority

`detectSampleLine()` 优先级（从高到低）：
1. `tavern_renown_bridge_crossed` → renown
2. `route_renown_committed` → renown
3. `tavern_merchant_bridge_crossed` → merchant
4. `route_merchant` / `magnate_on_ramp_done` → merchant
5. `ally_network` + age ≥ 25 → merchant (legacy ally-network path)
6. Orthodox seeds / flags → orthodox
7. Demonic seeds / flags → demonic
8. Sect faction → orthodox / demonic
9. `null` (no sample line)

---

## 3. Files Changed

### 3.1 Source Code

| File | Change |
|------|--------|
| `src/p50/sampleLineExpression.ts` | Added `'renown'` to SampleLineId; `detectSampleLine()` renown detection; `renownCurrentGoal()`, `renownAge40Identity()`; updated `deriveSampleLineCurrentGoal()`, `deriveSampleLineCostLabel()`, `deriveSampleLineAge40Identity()` |
| `src/utils/playerFacingLabels.ts` | Added renown entries to `ROUTE_DISPLAY_NAMES`, `ROUTE_FLAG_LABELS`, `LONG_TERM_FLAG_LABELS`; updated `getPlayerRouteSummary()` to detect renown flags |

### 3.2 Documentation

| File | Purpose |
|------|---------|
| `docs/PRD/p72-wuxia-selected-next-route-entry-differentiation.md` | P72 PRD (product truth) |
| `docs/PRD/p72-wuxia-selected-next-route-entry-differentiation.prd.json` | P72 execution index (story splits) |
| `docs/PRD/p72-wuxia-renown-entry-differentiation-contract.md` | Entry differentiation contract (P72-003) |
| `docs/test-reports/p72-selected-route-entry-sharedness-audit.md` | Post-bridge entry sharedness audit (P72-001) |
| `docs/test-reports/p72-selected-route-entry-scope-contract.md` | P72 scope contract (P72-002) |
| `docs/test-reports/p72-tavern-hand-renown-entry-targeted-proof.md` | Targeted entry proof (P72-006) |
| `docs/test-reports/p72-selected-next-route-entry-closure-report.md` | This report (P72-008) |

### 3.3 Tests

| File | Purpose |
|------|---------|
| `tests/p72TavernHandRenownEntryDifferentiationTests.ts` | 15 narrow regression tests for entry differentiation |

---

## 4. Validation

### 4.1 Test Results

| Test Suite | Status | Count |
|------------|--------|-------|
| P72 entry differentiation tests | ✅ Pass | 15 |
| P71 bridge tests | ✅ Pass | (all) |
| P56 ordinary origin tests | ✅ Pass | (all) |
| Life memory summary tests | ✅ Pass | (all) |
| TypeScript type check | ✅ Pass | n/a |

### 4.2 Validation Commands

```bash
# Type check
npx tsc --noEmit

# P72 entry differentiation tests (new)
npx tsx tests/p72TavernHandRenownEntryDifferentiationTests.ts

# P71 bridge regression
npx tsx tests/p71TavernHandRenownBridgeTests.ts

# P56 origin regression
npx tsx tests/p56OrdinaryOriginGrowthTests.ts

# Life memory summary regression
npx tsx tests/testLifeMemorySummary.ts
```

---

## 5. Known Remaining Gaps

### 5.1 Out of Scope for P72 (By Design)

这些是 P72 范围之外的，是 P73+ 的候选工作：

1. **On-ramp spine event** — 过桥后的第一个叙事事件（renown 专属）
2. **Midlife pressure event** — 中年压力事件（renown 专属）
3. **Payoff event** — 结局事件（renown 专属）
4. **Stat threshold gates** — renown 路线的 stat 门槛验证
5. **Pressure/payoff expression differentiation** — 压力和结局层的表达差异化
6. **Full lifetime simulation** — 完整的一生模拟验证

### 5.2 Not Addressed (But Not Blocking)

1. **`deriveOrdinaryOriginSummary()` 的 renown 分支** — 当前是在 `ally_network` + merchant 检测的 else 分支中返回"酒肆出身的江湖人物"，逻辑上正确但结构上可以更显式。当前实现可以工作，无需紧急修改。
2. **Cost label 的年龄分层** — renown cost label 目前只有一个版本，没有按年龄细分。entry 层这是可接受的。

---

## 6. Is Deeper Differentiation Justified?

**Answer: Yes, absolutely.**

### 6.1 Why It's Justified

1. **Strong identity foundation** — Entry 层的身份已经非常清晰，玩家能明确感受到"我是从酒肆走来的江湖名宿"
2. **Tavern-born flavor is working** — 酒肆出身的味道贯穿所有表达面，不是 generic renown
3. **Technical foundation is solid** — `detectSampleLine()` + expression 函数的架构支持轻松扩展
4. **No regressions** — 对现有系统零影响，风险极低
5. **Player-visible value** — 每增加一层差异化，玩家的代入感和路线辨识度都会提升

### 6.2 Recommended Next Steps (P73+)

按优先级排序：

1. **P73: Renown on-ramp spine event** — 过桥后的第一个叙事事件，让 renown 路线有实际的内容
2. **P74: Renown midlife pressure** — 中年压力事件，补充"江湖声名之累"的实际体验
3. **P75: Renown payoff + age-40 identity** — 结局事件 + 更完整的中年身份认同
4. **P76: Full lifetime stat chain verification** — 从头到尾的 stat 门槛验证

---

## 7. Risk Assessment

### 7.1 What Could Go Wrong

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Future edits flatten renown back | Medium | Medium | 15 narrow regression tests guard entry layer |
| Priority conflicts with merchant | Low | Low | Explicit priority order in detectSampleLine, tested |
| Performance impact | Very Low | Very Low | All checks are O(1) flag reads |
| Scope creep into full route | Medium | Low | Scope contract + per-story PRD gating |

### 7.2 Rollback Plan

如果需要回滚 P72：
1. Revert branch `codex/p72-wuxia-selected-next-route-entry-differentiation`
2. All changes are isolated to 2 source files + docs + tests
3. P71 bridge remains fully functional even without P72 differentiation

---

## 8. Story-by-Story Summary

| Story | Title | Status |
|-------|-------|--------|
| P72-001 | Audit post-bridge entry sharedness | ✅ Done |
| P72-002 | Lock P72 scope contract | ✅ Done |
| P72-003 | Define entry differentiation contract | ✅ Done |
| P72-004 | Wire entry-level differentiation | ✅ Done |
| P72-005 | Add player-facing entry expression | ✅ Done |
| P72-006 | Add targeted entry proof | ✅ Done |
| P72-007 | Add narrow regression coverage | ✅ Done |
| P72-008 | Produce P72 closure report | ✅ Done |

**Total: 8/8 stories complete.**

---

## 9. Final Verdict

**P72 complete. Entry differentiation is solid. Ready for P73 on-ramp spine.**

The `jianghu_renown_sage` route now has a distinct, recognizable identity at the post-bridge entry layer. The tavern-born flavor comes through clearly on all expression surfaces. The foundation is stable and ready for deeper differentiation work.

---

**End of P72 closure report.**
