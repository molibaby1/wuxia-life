# P81 Renown Endgame Closure Report

> **Stage:** P81 — jianghu_renown_sage Endgame (身后名之声)
> **Type:** Lightweight implementation (echo event + expression updates only)
> **Status:** Complete ✅

---

## 1. Deliverables Summary

| Story | Description | Status |
|-------|-------------|--------|
| P81-001 | Wire renown endgame echo event in sample-lines-spine.json | ✅ Done |
| P81-002 | Add endgame expression — sample line core (cost label + current goal) | ✅ Done |
| P81-003 | Add endgame expression — endgame identity | ✅ Done |
| P81-004 | Add endgame expression — ordinary origin | ✅ Done |
| P81-005 | Produce targeted endgame proof | ✅ Done |
| P81-006 | Add narrow regression coverage | ✅ Done |
| P81-007 | Produce P81 closure report | ✅ Done |

---

## 2. Files Changed

| File | Change Type | Lines |
|------|------------|-------|
| `src/data/lines/sample-lines-spine.json` | Added 3 endgame echo events | ~100 |
| `src/p50/sampleLineExpression.ts` | Updated cost label, current goal, identity for endgame | ~60 |
| `src/p56/ordinaryOriginExpression.ts` | Updated current goal, life memory, summary for endgame | ~80 |
| `tests/p81TavernHandRenownEndgameSpineTests.ts` | New test file (9 groups, ~30 assertions) | 697 |
| `docs/test-reports/p81-renown-endgame-targeted-proof.md` | New proof document | 267 |
| `docs/test-reports/p81-renown-endgame-closure-report.md` | This file | — |
| `docs/PRD/p81-wuxia-renown-endgame-playable.prd.json` | Updated passes: true for all stories | — |

**Total new code:** ~940 lines (test-heavy)
**Total modified code:** ~140 lines of production code

---

## 3. Implementation Pattern: Endgame Echo + Expression Updates

P81 follows the P80-endgame-contract lightweight pattern strictly:

```
Endgame Echo Event (age 60-65, auto, no stat changes)
    ↓ sets flags:
    - renown_endgame_done (checkpoint)
    - renown_endgame_identity_done (identity deepening)
    - tavern_renown_endgame_sigh/distant/legacy (variant marker)
    ↓
Expression Surfaces (sampleLineExpression + ordinaryOriginExpression)
    ↓ done-flag-first: endgame checked before late-life
    - Cost label: 身后名·叹 / 身后名·遥 / 身后名·传
    - Current goal: 3 variant-specific goals
    - Identity: 熬干了的老传说 / 传说里的神秘人 / 活在传说里的老掌柜
    - Life memory: 3 variant-specific tavern-flavored memories
    - Summary: 3 variant-specific summaries
```

**Key constraint compliance:**
- ✅ No stat changes (lightweight)
- ✅ 1 echo event conceptually (3 variant implementations)
- ✅ Auto-triggered (not player choice)
- ✅ Single age window (60-65)
- ✅ 3 variants (sigh / distant / legacy)
- ✅ 6 expression surfaces updated (≥2 required)
- ✅ Done-flag-first pattern (endgame > late-life)

---

## 4. Three Endgame Variants

### Variant A: 叹 (Sigh)
- **Late-life root:** burnout (油尽灯枯)
- **Theme:** 名声比人长久 (Fame outlasts the person)
- **Tone:** Bittersweet
- **Identity:** 熬干了的老传说
- **Cost label:** 身后名·叹
- **Current goal:** 听着自己成了传说，也算值了

### Variant B: 遥 (Distant)
- **Late-life root:** lone_wolf (逍遥自在)
- **Theme:** 传说比人逍遥 (Legend outstrips reality)
- **Tone:** Playful-mysterious
- **Identity:** 传说里的神秘人
- **Cost label:** 身后名·遥
- **Current goal:** 传说真假谁真谁假，自己知道就好

### Variant C: 传 (Legacy)
- **Late-life root:** mentor (传承授业)
- **Theme:** 智慧比人长久 (Wisdom outlasts the person)
- **Tone:** Warm-satisfied
- **Identity:** 活在传说里的老掌柜
- **Cost label:** 身后名·传
- **Current goal:** 看着后辈们传下去，这就够了

---

## 5. Test Results

| Test Suite | Result |
|------------|--------|
| P81 renown endgame spine tests (9 groups, ~30 assertions) | ✅ All pass |
| P79 renown late-life spine tests (regression check) | ✅ All pass |
| TypeScript typecheck | ✅ Pass |

**Regression coverage:** P71 (bridge), P72 (entry), P73 (on-ramp), P75 (pressure), P77 (payoff), P79 (late-life) — all verified no regression.

---

## 6. Renown Route Full Arc

The renown route is now fully closed from start to end:

```
P69: 选线 → jianghu_renown_sage
  ↓
P70-P71: Bridge (酒肆声名桥)
  ↓
P72: Entry 差异化 (江湖声名之累 / 江湖声名之始)
  ↓
P73: On-ramp spine (声名初显, 32-35岁)
  ↓
P74-P75: Pressure (人情债渐重, 37-41岁)
  ↓
P76-P77: Payoff (人情债之解, 3 choice, 43-47岁)
  ↓
P78-P79: Late-life (晚景几何, 3 分支, 52-56岁)
  ↓
P80-P81: Endgame (身后名之声, 3 variants, 60-65岁) ← P81 DELIVERS
```

**Renown route fully closed:** ✅ Yes

---

## 7. Risks & Limitations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Endgame event may fire before player reaches age 60 if late-life completes late | Low | Age range 60-65 ensures it only triggers in endgame window |
| Player may miss endgame if they die before 60 | Low | Expected behavior — endgame is a "good ending" bonus |
| Other routes may need endgame implementations later | Info | P80 contract defines the pattern; can be reused |

---

## 8. Follow-up Suggestions

1. **Other routes' endgame:** When merchant/scholar/warrior routes reach endgame stage, follow the same P80 contract pattern
2. **Endgame death scene:** If/when death events are implemented, endgame flags could feed into death narrative
3. **Endgame grandchildren epilogue:** Potential future expansion (optional, beyond current scope)

---

## 9. Acceptance Criteria Checklist

From PRD user stories:

- [x] Endgame echo event fires at age 60-65 (auto, no stat changes)
- [x] Three distinct variants (叹/遥/传) map to late-life branches
- [x] Cost label updated per variant (身后名·叹/遥/传)
- [x] Current goal updated per variant
- [x] Endgame identity deepened (done-flag-first)
- [x] Ordinary origin expression updated (current goal + life memory + summary)
- [x] Targeted proof document produced
- [x] Narrow regression tests added (9 groups, ~30 assertions)
- [x] All prior renown stages (P71-P79) still function correctly
- [x] Typecheck passes
- [x] Closure report produced

---

**P81 Renown Endgame: COMPLETE ✅**
