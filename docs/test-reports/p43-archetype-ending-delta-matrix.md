# P43 Archetype Ending Delta Matrix

**Date:** 2026-06-25  
**Branch:** `codex/p43-wuxia-archetype-recap-and-ending-differentiation`  
**Story:** P43-003

Sample before/after cases showing same-route-family runs ending with visibly distinct player-facing output when long-term shaping patterns differ.

---

## 1. Selected Families & Patterns

| Family | Route signals | Pattern A | Pattern B |
| --- | --- | --- | --- |
| **Martial route** | `route_orthodox`, `route_wanderer`, `route_demonic`, `sectMember` | `trainingHabit` dominant (≥2) | `studyHabit` dominant (≥2) |
| **Livelihood route** | `route_merchant`, `merchant_path`, `wealth_caravan_gate` | `businessHabit` dominant | `socialMomentum` dominant |

---

## 2. Martial Route — Before vs After

### Before (P41 baseline)

| Run | Route | Shaping | Ending recap visible output |
| --- | --- | --- | --- |
| A | Orthodox sect | `trainingHabit` 5 | P19 category + legacy only; no shaping named |
| B | Orthodox sect | `studyHabit` 5 | Same category stack when stats align |

**Gap:** Two orthodox runs with opposite shaping read identically at closure despite life-memory showing different「长期塑形」chips mid-game.

### After (P43)

| Run | Dominant shaping | New player-facing lines |
| --- | --- | --- |
| A | 习武塑形 · 入骨 | Recap: `回首这一生，习武塑形 · 入骨最为醒目；名望与战意多由此立…` + tone: `与同路侠客相比，你是苦修成锋、以武立名之人。` |
| B | 饱学塑形 · 入骨 | Recap: `回首这一生，饱学塑形 · 入骨最为醒目；文字与思辨成为你识世立身的主轴…` + tone: `与同路侠客相比，你以文佐武、守礼而不蛮干。` |

**Differentiation proof:** `composeP19FinalSummary(...).composedSummary` differs between A and B while route flags stay constant.

---

## 3. Livelihood Route — Before vs After

### Before

| Run | Route | Shaping | Ending recap |
| --- | --- | --- | --- |
| C | Merchant | `businessHabit` 4 | Generic P19 stack |
| D | Merchant | `socialMomentum` 4 | Same when endgame category matches |

### After (P43)

| Run | Dominant shaping | New player-facing lines |
| --- | --- | --- |
| C | 营生塑形 · 成形 | Tone: `在同一条营生路上，你把算账与门路练成了绝活。` |
| D | 人情往来 · 成形 | Tone: `在同一条营生路上，你的人脉比货单更值钱。` |

---

## 4. Regression Coverage

```bash
npm exec tsx tests/p43ArchetypeRecapEndingTests.ts
```

Key assertions:

- `buildShapingPatternEndingTone` returns distinct strings for martial A vs B
- `composeP19FinalSummary(...).composedSummary` differs for same-route opposite shaping
- Livelihood business vs social tones differ

---

## 5. Remaining Flattening Areas

- `EndingScreen.vue` still shows stat grid only — composed summary not wired to UI (deferred per PRD non-goals)
- `familyBond` shaping pattern tones not yet differentiated within a route family
- Ending **category selection** (`determineEnding`) still stat-threshold based; P43 improves narrative differentiation only
