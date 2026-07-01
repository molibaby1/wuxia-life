# P79 Renown Late-Life Targeted Proof

&gt; **Date:** 2026-06-29
&gt; **Stage:** P79 Wuxia Renown Late-Life Playable Implementation
&gt; **Story:** P79-005 — Add targeted late-life proof
&gt; **Path:** Payoff → Late-Life — `renown_midlife_payoff_done` → `renown_late_life_done` + branch marker
&gt; **Proof type:** Targeted runtime proof (not full lifetime exhaust, not static fixture-only)

---

## 1. Proof Overview

This document provides a targeted proof that the `jianghu_renown_sage` late-life spine events are runtime-reachable and correctly wired after the payoff stage. It covers the ordered chain: **pre-late-life baseline → event fires → Branch A flags+stats → Branch B flags+stats → Branch C flags+stats → cost label per branch → current goal per branch → late-life identity per branch**, with tavern-born renown flavor verified throughout.

**Proof method:** Runtime evaluation of conditions and expressions via expression modules, using representative state snapshots at each chain node. This exercises the same code paths used during actual gameplay.

**Core chain nodes covered:** 8/8
**Bonus nodes covered:** 6/6 (life memory, origin summary, full chain traceback, mutex with other lines, branch matching, tavern-born flavor check)

---

## 2. Chain Node 1: Pre-Late-Life Baseline (Post-Payoff)

**Node:** Post-payoff baseline — `renown_midlife_payoff_done` set; late-life NOT yet triggered

**State:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true,
  renown_midlife_pressure_done: true,
  tavern_renown_pressure: true,
  renown_midlife_payoff_done: true,
  renown_age40_identity_done: true,
  tavern_renown_payoff_balancer: true
}
age: 51
```

**Evidence:**
- `detectSampleLine(flags)` returns `'renown'` ✅
- `detectOrdinaryOrigin(flags)` returns `'tavern_hand'` ✅
- `deriveSampleLineCostLabel(state)` returns "人情练达" ✅
- `renownCurrentGoal()` returns "拿捏人情往来的分寸，找到平衡" ✅
- `tavernCurrentGoal()` returns "拿捏人情往来的分寸，找到平衡" ✅
- `tavernLifeMemory()` returns payoff level memory ✅
- `deriveOrdinaryOriginSummary()` returns "酒肆出身的江湖名宿：靠人脉与面子闯出了名号，更懂人情往来的分寸，人情练达，游刃有余。" ✅
- `renown_late_life_done` is NOT set (correct — we haven't reached late-life yet) ✅
- `renown_late_life_identity_done` is NOT set (correct — late-life not yet done) ✅

**Status:** ✅ Verified

---

## 3. Chain Node 2: Late-Life Event Fires

**Node:** Late-life event trigger — each branch auto event fires at correct age when prerequisites met

**State (Branch C example):**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true,
  renown_midlife_pressure_done: true,
  tavern_renown_pressure: true,
  renown_midlife_payoff_done: true,
  renown_age40_identity_done: true,
  tavern_renown_payoff_balancer: true
}
age: 52
```

**Event condition (Branch C — Mentor):**
```
flags.has('renown_midlife_payoff_done') && flags.has('tavern_renown_payoff_balancer') && !flags.has('renown_late_life_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done') && flags.has('tavern_renown_bridge_crossed')
```

**Evidence:**
- Condition evaluates to `true` at age 52 with payoff done + balancer marker + no late-life done ✅
- 3 branch events total: `renown_late_life_burnout` / `renown_late_life_lone_wolf` / `renown_late_life_mentor`
- Age range: 52–56 (~9 years after payoff at 43-47)
- Event title: "晚景几何"
- Event type: `auto` (consequence-based, not player choice — unlike payoff which is choice) ✅
- Event location: `sample-lines-spine.json` (same file as all sample-line spine events) ✅
- Tavern-born flavor: event text set at 酒肆门口, about 一辈子的江湖路 ✅
- Branch matching: hard_holder→burnout, breaker→lone_wolf, balancer→mentor ✅
- 6 trigger conditions all verified (payoff gate + branch marker + exclusivity + orthodox/demonic exclusion + bridge guarantee + age range) ✅

**Status:** ✅ Verified

---

## 4. Chain Node 3: Branch A (Burnout) — Flags & Stats

**Node:** Branch A post-late-life state — `tavern_renown_late_burnout` + correct stat changes

**State after Branch A auto event:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true,
  renown_midlife_pressure_done: true,
  tavern_renown_pressure: true,
  renown_midlife_payoff_done: true,
  renown_age40_identity_done: true,
  tavern_renown_payoff_hard_holder: true,
  renown_late_life_done: true,
  renown_late_life_identity_done: true,
  tavern_renown_late_burnout: true
}
age: 52
```

**Common flags (all branches):**
1. `renown_late_life_done` — late-life checkpoint
2. `renown_late_life_identity_done` — late-life identity deepening

**Branch-specific marker:**
- `tavern_renown_late_burnout` — Branch A identity marker

**Stat effects (Branch A):**
- `reputation` +2
- `connections` +1
- `charisma` -1
- **Net: +2** (modest gain — fame still grows but charisma declines, narrative of burnout)

**Evidence:**
- `renown_late_life_done` is `true` ✅
- `renown_late_life_identity_done` is `true` ✅
- `tavern_renown_late_burnout` is `true` ✅
- Other branch markers (`lone_wolf`, `mentor`) are NOT set (exactly one marker set) ✅
- Stat distribution: reputation still up but charisma down — matches "油尽灯枯" identity (fame grows but person wears out) ✅
- No martial power stats changed — consistent with renown route ✅

**Status:** ✅ Verified

---

## 5. Chain Node 4: Branch B (Lone Wolf) — Flags & Stats

**Node:** Branch B post-late-life state — `tavern_renown_late_lone_wolf` + correct stat changes

**State after Branch B auto event:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true,
  renown_midlife_pressure_done: true,
  tavern_renown_pressure: true,
  renown_midlife_payoff_done: true,
  renown_age40_identity_done: true,
  tavern_renown_payoff_breaker: true,
  renown_late_life_done: true,
  renown_late_life_identity_done: true,
  tavern_renown_late_lone_wolf: true
}
age: 52
```

**Branch-specific marker:**
- `tavern_renown_late_lone_wolf` — Branch B identity marker

**Stat effects (Branch B):**
- `reputation` -1
- `connections` -2
- `charisma` +3
- **Net: 0** (break-even — trade social capital for personal freedom/charisma)

**Evidence:**
- `renown_late_life_done` is `true` ✅
- `renown_late_life_identity_done` is `true` ✅
- `tavern_renown_late_lone_wolf` is `true` ✅
- Other branch markers (`burnout`, `mentor`) are NOT set ✅
- Stat distribution: connections loss is heaviest (-2), charisma gain is highest (+3) — matches "逍遥自在的孤翁" narrative (fewer connections, but more personal magnetism from being free) ✅
- Net stat is roughly break-even — meaningful tradeoff (not all upside) ✅

**Status:** ✅ Verified

---

## 6. Chain Node 5: Branch C (Mentor) — Flags & Stats

**Node:** Branch C post-late-life state — `tavern_renown_late_mentor` + correct stat changes

**State after Branch C auto event:**
```typescript
flags: {
  origin_tavern_hand: true,
  ally_network: true,
  tavern_renown_bridge_crossed: true,
  route_renown_committed: true,
  renown_on_ramp_done: true,
  tavern_renown_on_ramp: true,
  renown_midlife_pressure_done: true,
  tavern_renown_pressure: true,
  renown_midlife_payoff_done: true,
  renown_age40_identity_done: true,
  tavern_renown_payoff_balancer: true,
  renown_late_life_done: true,
  renown_late_life_identity_done: true,
  tavern_renown_late_mentor: true
}
age: 52
```

**Branch-specific marker:**
- `tavern_renown_late_mentor` — Branch C identity marker

**Stat effects (Branch C):**
- `reputation` +3
- `connections` +2
- `charisma` +2
- **Net: +7** (highest net — balanced life = best late-life outcome)

**Evidence:**
- `renown_late_life_done` is `true` ✅
- `renown_late_life_identity_done` is `true` ✅
- `tavern_renown_late_mentor` is `true` ✅
- Other branch markers (`burnout`, `lone_wolf`) are NOT set ✅
- Stat distribution: all around gain, reputation highest (+3) — matches "德高望重的老前辈" identity (balanced life pays off in late years) ✅
- Best net stat of all three branches — balanced payoff choice leads to best late-life outcome ✅

**Status:** ✅ Verified

---

## 7. Chain Node 6: Cost Label Per Branch

**Node:** Player-facing signal 1 (cost label) — `deriveSampleLineCostLabel()` returns branch-specific label

**Before late-life (payoff state):**
- Branch A: "声名之累"
- Branch B: "快意恩仇"
- Branch C: "人情练达"

**Branch A (油尽灯枯 / Burnout):**
&gt; "油尽灯枯"

**Branch B (逍遥自在 / Lone Wolf):**
&gt; "逍遥自在"

**Branch C (传承授业 / Mentor):**
&gt; "传承授业"

**Evidence:**
- Branch A cost label: "油尽灯枯" — matches "硬撑面子→晚年耗尽" arc (fame as final burden) ✅
- Branch B cost label: "逍遥自在" — matches "撕破脸→晚年自由" arc (unshackled from social debt) ✅
- Branch C cost label: "传承授业" — matches "平衡→晚年传业" arc (passing on wisdom) ✅
- All three labels are distinct — not reskinned ✅
- All labels are tavern-born flavored: 油尽灯枯/逍遥自在/传承授业都是江湖人生语境 ✅
- Progression: payoff labels (声名之累/快意恩仇/人情练达) → late-life labels (油尽灯枯/逍遥自在/传承授业) — each deepens the identity ✅
- `isPlayerVisibleSampleLineText()` returns `true` for all ✅

**Status:** ✅ Verified

---

## 8. Chain Node 7: Current Goal Per Branch

**Node:** Player-facing signal 2 (current goal) — both sample line and ordinary origin currentGoal return branch-specific goal

### 8.1 Sample Line Current Goal

**Before late-life (payoff state):**
- Branch A: "硬扛所有人情债，保住江湖名声"
- Branch B: "撕破脸皮，断了不该还的债"
- Branch C: "拿捏人情往来的分寸，找到平衡"

**Branch A (Burnout):**
&gt; "守住这一辈子的名声，撑到最后"

**Branch B (Lone Wolf):**
&gt; "无牵无挂，过好剩下的日子"

**Branch C (Mentor):**
&gt; "指点后辈，把这一辈子的人情世故传下去"

### 8.2 Ordinary Origin Current Goal

**Branch A (Burnout):**
&gt; "守住这一辈子的名声，撑到最后"

**Branch B (Lone Wolf):**
&gt; "无牵无挂，过好剩下的日子"

**Branch C (Mentor):**
&gt; "指点后辈，把这一辈子的人情世故传下去"

**Evidence:**
- All three goals are distinct and branch-specific ✅
- Branch A: 守住名声 + 撑到最后 — late-life version of "硬撑" (now defensive, preserving what's left) ✅
- Branch B: 无牵无挂 + 过好剩下的日子 — late-life version of "撕破脸" (now settled, enjoying freedom) ✅
- Branch C: 指点后辈 + 传下去 — late-life version of "平衡" (now generative, passing on wisdom) ✅
- Sample line and ordinary origin goals are consistent (same phrasing) ✅
- Progression: payoff goals (active resolution) → late-life goals (acceptance/legacy) — narrative deepening ✅
- `isPlayerVisibleSampleLineText()` returns `true` for all ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` for all ✅

**Status:** ✅ Verified

---

## 9. Chain Node 8: Late-Life Identity Per Branch

**Node:** Player-facing signal 3 (late-life identity) — `renownAge40Identity()` returns branch-specific late-life identity (checked before age-40 identity fallback)

**Before late-life (payoff state):**
- Branch A: "你是硬撑面子的江湖好人：从酒肆跑堂到江湖名宿，人情债都自己扛，名声响了，担子也重了。"
- Branch B: "你是快意恩仇的独行侠：从酒肆跑堂到江湖名宿，撕破了假人情，换来了真自由。"
- Branch C: "你是人情练达的江湖名宿：从酒肆跑堂到江湖名宿，懂人情往来，拿捏得住分寸，游刃有余。"

**Branch A (Burnout — 油尽灯枯的老好人):**
&gt; "你是油尽灯枯的老好人：从酒肆跑堂到江湖名宿，一辈子顾着别人的名声，欠下的人情自己扛，到了晚年，名声还在，人却熬干了。"

**Branch B (Lone Wolf — 逍遥自在的孤翁):**
&gt; "你是逍遥自在的孤翁：从酒肆跑堂到江湖名宿，中年撕破了假人情，换来了后半辈子的自在。三教九流都认识你，却没人能拴住你。"

**Branch C (Mentor — 德高望重的老前辈):**
&gt; "你是德高望重的老前辈：从酒肆跑堂到江湖名宿，一辈子懂分寸、知进退，到了晚年，后辈们都愿意来听你讲人情世故。酒肆掌柜的智慧，全被你传了下去。"

**Evidence:**
- All three identities are distinct and meaningfully different ✅
- Branch A: 油尽灯枯的老好人 — tragic late-life, payoff for "硬撑" ✅
- Branch B: 逍遥自在的孤翁 — free but lonely late-life, payoff for "撕破脸" ✅
- Branch C: 德高望重的老前辈 — wise revered late-life, payoff for "平衡" ✅
- All preserve "从酒肆跑堂到江湖名宿" origin anchor ✅
- Each has a different "who you become in old age" conclusion ✅
- `renown_late_life_identity_done` checked FIRST before falling back to `renown_age40_identity_done` ✅
- `isPlayerVisibleSampleLineText()` returns `true` for all ✅

**Status:** ✅ Verified

---

## 10. Bonus Node 9: Life Memory Per Branch

**Node:** Bonus player-facing signal (life memory) — `tavernLifeMemory()` returns branch-specific late-life memory

**Branch A (Burnout):**
&gt; "你守了一辈子的名声，到了晚年，名声还在，人却熬干了。酒肆的老客人还念你的好，你却连站在酒肆门口迎客的力气都快没了。这辈子，你对得起所有人，唯独对不起自己。"

**Branch B (Lone Wolf):**
&gt; "你逍遥了大半辈子，无牵无挂。偶尔路过酒肆，还能跟三教九流的朋友喝两杯，没人欠你，你也不欠谁。有人说你孤，你却觉得——这才是活着。"

**Branch C (Mentor):**
&gt; "你成了德高望重的老前辈。后辈们常来酒肆找你，想听你讲年轻时的江湖事，请教人情往来的分寸。你一一指点，像当年酒肆掌柜教你那样，把这份智慧传了下去。"

**Evidence:**
- All three memories are vivid and specific ✅
- Branch A: "连站在酒肆门口迎客的力气都快没了" + "对得起所有人，唯独对不起自己" — tragic, tavern-flavored ✅
- Branch B: "路过酒肆，还能跟三教九流的朋友喝两杯" + "没人欠你，你也不欠谁" — free, tavern-flavored ✅
- Branch C: "后辈们常来酒肆找你" + "像当年酒肆掌柜教你那样" — wise, tavern-flavored ✅
- All have concrete tavern imagery (酒肆门口, 酒肆三教九流, 酒肆掌柜) ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` for all ✅

**Status:** ✅ Verified (bonus node)

---

## 11. Bonus Node 10: Origin Summary Per Branch

**Node:** Bonus player-facing signal (summary) — `deriveOrdinaryOriginSummary()` returns branch-specific late-life summary

**Branch A (Burnout):**
&gt; "酒肆出身的江湖名宿：守了一辈子名声，人情债全自己扛，到了晚年油尽灯枯，名声仍在，人却熬干了。"

**Branch B (Lone Wolf):**
&gt; "酒肆出身的江湖独行：中年撕破脸断了假人情，后半辈子逍遥自在，无牵无挂，三教九流都认识，却没人能拴住。"

**Branch C (Mentor):**
&gt; "酒肆出身的江湖名宿：一辈子懂分寸知进退，到了晚年德高望重，后辈们都来请教，把人情世故的智慧传了下去。"

**Evidence:**
- All three summaries are distinct ✅
- Branch A: still "江湖名宿" but with "油尽灯枯" late-life cost ✅
- Branch B: shifts from "江湖名宿" to "江湖独行" — reinforces lone wolf identity ✅
- Branch C: still "江湖名宿" but elevated to "德高望重" with mentorship role ✅
- All preserve "酒肆出身" origin label ✅
- `isPlayerVisibleOrdinaryOriginText()` returns `true` for all ✅

**Status:** ✅ Verified (bonus node)

---

## 12. Bonus Node 11: Full Chain Traceback

Complete chain from origin → bridge → on-ramp → pressure → payoff → late-life (all 3 branches):

| Stage | Checkpoint | Current Goal | Cost Label | Identity |
|-------|-----------|--------------|------------|----------|
| Origin (tavern_hand) | — | "在酒肆帮忙，日子忙碌但热闹" | — | — |
| Bridge (age 29) | `tavern_renown_bridge_crossed` | "凭人脉声名在江湖立足，常有人来寻你引荐主事" | "江湖声名之累" | — |
| On-Ramp (age 32-35) | `renown_on_ramp_done` | "在江湖上有了名号，常有人来请你主持公道、引荐高人" | "江湖声名之累" | "从酒肆走来的江湖名宿" |
| Pressure (age 37-41) | `renown_midlife_pressure_done` | "一面维持声名，一面应付越来越重的人情债" | "人情债渐重" | "从酒肆走来的江湖名宿" |
| Payoff A (age 43-47) | `renown_midlife_payoff_done` | "硬扛所有人情债，保住江湖名声" | "声名之累" | "硬撑面子的江湖好人" |
| Payoff B (age 43-47) | `renown_midlife_payoff_done` | "撕破脸皮，断了不该还的债" | "快意恩仇" | "快意恩仇的独行侠" |
| Payoff C (age 43-47) | `renown_midlife_payoff_done` | "拿捏人情往来的分寸，找到平衡" | "人情练达" | "人情练达的江湖名宿" |
| **Late-Life A (age 52-56)** | **`renown_late_life_done`** | **"守住这一辈子的名声，撑到最后"** | **"油尽灯枯"** | **"油尽灯枯的老好人"** |
| **Late-Life B (age 52-56)** | **`renown_late_life_done`** | **"无牵无挂，过好剩下的日子"** | **"逍遥自在"** | **"逍遥自在的孤翁"** |
| **Late-Life C (age 52-56)** | **`renown_late_life_done`** | **"指点后辈，把这一辈子的人情世故传下去"** | **"传承授业"** | **"德高望重的老前辈"** |

**Narrative arc:** 上升 (bridge → on-ramp) → 平台 + 代价 (pressure) → 主动选择了结 (payoff, 3 directions) → 晚年收束 (late-life, 3 consequences deepen) — feels like a complete jianghu life story with meaningful cause-and-effect ✅

---

## 13. Bonus Node 12: Mutex With Other Lines

**Node:** Late-life event does NOT fire for merchant/orthodox/demonic lines

**Test cases:**

| Line | Flags | Late-life fires? |
|------|-------|------------------|
| Merchant (tavern origin) | `tavern_merchant_bridge_crossed`, `magnate_on_ramp_done`, `magnate_midlife_pressure_done`, `magnate_payoff_done` | ❌ No (no `tavern_renown_bridge_crossed`) |
| Orthodox | `orthodox_childhood_seed_done`, `orthodox_age40_identity_done` | ❌ No (excluded by `!orthodox_childhood_seed_done`) |
| Demonic | `demonic_childhood_seed_done`, `demonic_age40_identity_done` | ❌ No (excluded by `!demonic_childhood_seed_done`) |
| Renown (correct setup) | `tavern_renown_bridge_crossed`, `renown_on_ramp_done`, `renown_midlife_pressure_done`, `renown_midlife_payoff_done` + branch marker | ✅ Yes (exactly one branch event fires) |

**Evidence:**
- Mutex with merchant: merchant late-life uses different flags, renown uses `renown_late_life_done` — separate checkpoints ✅
- Mutex with orthodox/demonic: explicitly excluded in event conditions ✅
- Mutex enforced at bridge level: `tavern_renown_bridge_crossed` is only set for renown path ✅
- Branch-level mutex: each late-life event requires a specific payoff marker, and sets `renown_late_life_done` to prevent other branches from firing ✅

**Status:** ✅ Verified (bonus node)

---

## 14. Bonus Node 13: Branch Matching (Payoff → Late-Life)

**Node:** Correct mapping from payoff choice to late-life branch

| Payoff Choice | Payoff Marker | Late-Life Branch | Late-Life Marker |
|---------------|---------------|------------------|------------------|
| 硬扛到底 (Hard Holder) | `tavern_renown_payoff_hard_holder` | 油尽灯枯 (Burnout) | `tavern_renown_late_burnout` |
| 索性撕破脸 (Breaker) | `tavern_renown_payoff_breaker` | 逍遥自在 (Lone Wolf) | `tavern_renown_late_lone_wolf` |
| 找到平衡 (Balancer) | `tavern_renown_payoff_balancer` | 传承授业 (Mentor) | `tavern_renown_late_mentor` |

**Narrative consistency:**
- Hard holder → Burnout: 硬撑了一辈子 → 晚年油尽灯枯 ✅ (因果关系清晰)
- Breaker → Lone Wolf: 撕破脸断了人情 → 晚年逍遥自在 ✅ (因果关系清晰)
- Balancer → Mentor: 人情练达懂分寸 → 晚年德高望重传业 ✅ (因果关系清晰)

**Status:** ✅ Verified (bonus node)

---

## 15. Summary of All Chain Nodes

| # | Node | Type | Status | Key Evidence |
|---|------|------|--------|--------------|
| 1 | Pre-late-life baseline (post-payoff) | Core | ✅ | Payoff flags set, late-life flag NOT set, cost label = 人情练达 |
| 2 | Late-life event fires | Core | ✅ | Condition fires at age 52 with `renown_midlife_payoff_done` + branch marker + no `renown_late_life_done` |
| 3 | Branch A flags + stats | Core | ✅ | `tavern_renown_late_burnout` + rep+2/con+1/cha-1 |
| 4 | Branch B flags + stats | Core | ✅ | `tavern_renown_late_lone_wolf` + rep-1/con-2/cha+3 |
| 5 | Branch C flags + stats | Core | ✅ | `tavern_renown_late_mentor` + rep+3/con+2/cha+2 |
| 6 | Cost label per branch | Core | ✅ | 油尽灯枯 / 逍遥自在 / 传承授业 |
| 7 | Current goal per branch | Core | ✅ | 撑到最后 / 过好剩下的日子 / 指点后辈 |
| 8 | Late-life identity per branch | Core | ✅ | 油尽灯枯的老好人 / 逍遥自在的孤翁 / 德高望重的老前辈 |
| 9 | Life memory per branch | Bonus | ✅ | All vivid, tavern-flavored, distinct |
| 10 | Origin summary per branch | Bonus | ✅ | All distinct, preserve origin, different identity shapes |
| 11 | Full chain traceback | Bonus | ✅ | Origin → bridge → on-ramp → pressure → payoff → late-life (3 paths) |
| 12 | Mutex with other lines | Bonus | ✅ | No fire for merchant/orthodox/demonic |
| 13 | Branch matching | Bonus | ✅ | hard_holder→burnout, breaker→lone_wolf, balancer→mentor |

**All 8 core nodes: ✅ Verified**
**All 5 bonus nodes: ✅ Verified**

---

## 16. Tavern-Born Flavor Check

The tavern-born renown flavor is preserved across all late-life surfaces:

| Surface | Tavern-Born Signal |
|---------|-------------------|
| Event title | "晚景几何" — classic jianghu late-life reflection |
| Event text | "酒肆门口" + "站了一辈子的地方" + "这辈子的江湖路" |
| Branch A identity | "从酒肆跑堂到江湖名宿" + "欠下的人情自己扛" |
| Branch B identity | "从酒肆跑堂到江湖名宿" + "三教九流都认识你" |
| Branch C identity | "从酒肆跑堂到江湖名宿" + "酒肆掌柜的智慧，全被你传了下去" |
| Cost label A | "油尽灯枯" — burnout from life of holding face (tavern face-culture) |
| Cost label B | "逍遥自在" — freedom from social obligation (tavern free spirit) |
| Cost label C | "传承授业" — passing on tavern keeper wisdom |
| Life memory A | "酒肆的老客人还念你的好" + "站在酒肆门口迎客" |
| Life memory B | "路过酒肆，还能跟三教九流的朋友喝两杯" |
| Life memory C | "后辈们常来酒肆找你" + "像当年酒肆掌柜教你那样" |
| Summary (all) | "酒肆出身的..." — origin explicitly foregrounded |

**Flavor verdict:** ✅ Consistently tavern-born renown throughout — every branch, every expression surface has tavern-specific imagery and references

---

## 17. Distinction from Merchant Late-Life

Renown late-life vs merchant late-life — both are late-life stages, but fundamentally different:

| Aspect | Renown Late-Life | Merchant Late-Life |
|--------|------------------|-------------------|
| Event type | auto (consequence of payoff choice) | auto (milestone) |
| Branches | 3 distinct branches (burnout/lone_wolf/mentor) | TBD |
| Core question | 这辈子选的路，晚年收成如何？(What harvest does your chosen path yield in old age?) | 巨贾晚年如何守业？(How does a magnate hold wealth in old age?) |
| Key scene | 酒肆门口 + 一辈子的江湖路 | 商号 + 家产/商路 |
| Stat tradeoff | 3 different stat distributions (A:+2, B:0, C:+7) | TBD |
| Cost label | 油尽灯枯 / 逍遥自在 / 传承授业 | TBD |
| Identity shift | 3 different late-life identities (老好人/孤翁/老前辈) | TBD |
| Narrative tone | 因果报应 + 晚年收束 (cause and effect + late-life resolution) | 功成名就 + 晚年守业 (established success + late-life maintenance) |

**Conclusion:** Both are late-life stages, but the *nature* of late-life is completely different — renown is about *consequence of life choices* and *identity resolution*, merchant is about *wealth and legacy management*. Not reskinned. ✅

---

## 18. Endgame Stage Justification

Is an endgame / final legacy stage (P80+) justified?

**Arguments for proceeding:**
1. ✅ Late-life spine is solid and well-tested
2. ✅ Three branch directions create clear endgame branching points
3. ✅ Each branch has distinct "end-of-life shadow":
   - A (Burnout): "油尽灯枯" → endgame could be about final legacy / death with reputation intact
   - B (Lone Wolf): "逍遥自在" → endgame could be about final freedom / wandering off
   - C (Mentor): "传承授业" → endgame could be about final student / legacy passing
4. ✅ Tavern-born renown flavor is consistent and distinctive
5. ✅ Reserved flag interfaces already in place (`renown_endgame_echo_done`)
6. ✅ Narrative hooks exist for each direction
7. ✅ Auto late-life creates natural lead-in to endgame echo event

**Arguments for caution:**
1. ⚠️ Only one origin (tavern_hand) — replication value per stage is lower
2. ⚠️ Should assess player impact first before committing to endgame
3. ⚠️ Need to define what endgame actually looks like (not just "more content")
4. ⚠️ Late-life already provides strong closure — endgame might be redundant

**Recommendation:** CONDITIONAL_GO for endgame stage, but only if:
- Endgame contract is well-defined (not just "more of the same")
- Endgame is LIGHTWEIGHT (1 echo event + expression updates, not a full stage)
- Maintains tavern-born flavor discipline
- Stays bounded — should feel like a final coda, not a new act

---

## 19. Proof Method Notes

This proof is **not** static fixture-only. It exercises:

1. **`sampleLineExpression.ts` functions** — sample line expression (currentGoal, costLabel, age40Identity)
2. **`ordinaryOriginExpression.ts` functions** — ordinary origin expression (currentGoal, lifeMemory, summary)
3. **`detectSampleLine()` / `detectOrdinaryOrigin()`** — detection functions used throughout the codebase
4. **Sample-lines-spine.json event configuration** — event conditions, effects, metadata

This means the proof validates the *actual runtime code paths*, not just static data. However, it does not simulate a full lifetime from birth to death — that is out of scope for a targeted late-life proof.

---

## 20. Deferred Validations

The following are NOT proven here (out of scope for P79):

| Item | Rationale | Stage |
|------|-----------|-------|
| Full lifetime sim (age 0-60) | Out of scope for bounded late-life | — |
| Browser / UI verification | No new UI components | — |
| Endgame / final legacy deepening | Late-life only stage | P80+ |
| Stat threshold gates | Not implemented in P79 (deferred enhancement) | Future stage |
| Farm_peasant / town_apprentice renown | Other origins out of scope | Future cycles |
| Multiple late-life events | 3 branch events per P78 contract | Future expansion |

---

**P79-005 complete.** Targeted proof document saved. All 8 core nodes + 5 bonus nodes verified.
