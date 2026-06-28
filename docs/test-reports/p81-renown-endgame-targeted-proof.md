# P81 Renown Endgame Targeted Proof

> **Purpose:** Bounded proof artifact showing renown endgame event fires correctly, all three variants work, and tavern-born renown flavor is preserved.
> **Stage:** P81 — jianghu_renown_sage endgame (Legacy Echo / 身后名之声)
> **Method:** Runtime code path verification via expression functions + event config inspection

---

## Chain Overview

```
late-life (52-56) → endgame echo (60-65) → expression changes
     ↓                    ↓                        ↓
  3 branches        1 echo event × 3 variants   6 expression surfaces
  burnout→sigh      renown_endgame_done          cost label
  lone_wolf→distant renown_endgame_identity_done current goal
  mentor→legacy    tavern_renown_endgame_*       identity
                                            ↘ life memory
                                              summary
```

---

## Core Nodes (7 required)

### Node 1: Pre-endgame Baseline (Post-late-life, Pre-endgame)

**State:** age 59, renown_late_life_done + tavern_renown_late_mentor, NO renown_endgame_done

| Signal | Value |
|--------|-------|
| detectSampleLine | `renown` ✅ |
| Cost label | `传承授业` (late-life level, NOT endgame) ✅ |
| Current goal | `指点后辈，把这一辈子的人情世故传下去` (late-life goal) ✅ |
| Identity | `德高望重的老前辈` (late-life identity) ✅ |

**Verification:** Endgame NOT visible before age 60 / before endgame_done flag.

---

### Node 2: Event Fires (Endgame Echo Event Wiring)

**Event:** `renown_endgame_echo_*` (3 variant events)

| Property | Value |
|----------|-------|
| Event type | `auto` (echo event, not player choice) ✅ |
| Age range | 60–65 ✅ |
| Trigger | age_reach at 60 ✅ |
| Upstream gate | `renown_late_life_done` ✅ |
| Exclusivity guard | `!flags.has('renown_endgame_done')` ✅ |
| Orthodox exclusion | `!flags.has('orthodox_childhood_seed_done')` ✅ |
| Demonic exclusion | `!flags.has('demonic_childhood_seed_done')` ✅ |
| Bridge requirement | `flags.has('tavern_renown_bridge_crossed')` ✅ |
| Branching | late-life branch marker → endgame variant ✅ |
| Stat changes | **None** (lightweight compliance) ✅ |

**Checkpoint flags set:**
- `renown_endgame_done` — universal checkpoint
- `renown_endgame_identity_done` — identity deepening
- `tavern_renown_endgame_sigh` / `distant` / `legacy` — variant marker (one of three)

---

### Node 3: Variant A (叹 / Sigh) — Flags + Identity

**Late-life root:** burnout → sigh
**Core theme:** 名声比人长久 (Fame outlasts the person)
**Tone:** Bittersweet

| Signal | Value |
|--------|-------|
| renown_endgame_done | `true` ✅ |
| renown_endgame_identity_done | `true` ✅ |
| tavern_renown_endgame_sigh | `true` ✅ |
| tavern_renown_endgame_distant | `undefined` ✅ |
| tavern_renown_endgame_legacy | `undefined` ✅ |
| Endgame identity | **熬干了的老传说** ✅ |
| Tavern-born flavor | 酒肆角落 / 老客人 / 年轻人讲传说 ✅ |

**Identity text:** "你是熬干了的老传说：从酒肆跑堂到江湖名宿，硬扛了一辈子人情债，名声传了一辈子，人也熬干了。最后坐在酒肆角落里，听着年轻人讲自己的传说——名声比人长久，代价也没人记得了。可你知道，有些人，就是为了名声活着的。"

---

### Node 4: Variant B (遥 / Distant) — Flags + Identity

**Late-life root:** lone_wolf → distant
**Core theme:** 传说比人逍遥 (Legend outstrips reality)
**Tone:** Playful-mysterious

| Signal | Value |
|--------|-------|
| renown_endgame_done | `true` ✅ |
| renown_endgame_identity_done | `true` ✅ |
| tavern_renown_endgame_distant | `true` ✅ |
| tavern_renown_endgame_sigh | `undefined` ✅ |
| tavern_renown_endgame_legacy | `undefined` ✅ |
| Endgame identity | **传说里的神秘人** ✅ |
| Tavern-born flavor | 酒肆喝酒 / 邻桌讲传说 / 三教九流 ✅ |

**Identity text:** "你是传说里的神秘人：从酒肆跑堂到江湖独行，撕破了一辈子假人情，换来了逍遥自在。江湖上你的传说真假参半，在座没人认出你。你笑了笑——自己都快忘了当年的样子了。传说比人逍遥，真假谁在乎呢。"

---

### Node 5: Variant C (传 / Legacy) — Flags + Identity

**Late-life root:** mentor → legacy
**Core theme:** 智慧比人长久 (Wisdom outlasts the person)
**Tone:** Warm-satisfied

| Signal | Value |
|--------|-------|
| renown_endgame_done | `true` ✅ |
| renown_endgame_identity_done | `true` ✅ |
| tavern_renown_endgame_legacy | `true` ✅ |
| tavern_renown_endgame_sigh | `undefined` ✅ |
| tavern_renown_endgame_distant | `undefined` ✅ |
| Endgame identity | **活在传说里的老掌柜** ✅ |
| Tavern-born flavor | 老掌柜的规矩 / 后辈们 / 传承 ✅ |

**Identity text:** "你是活在传说里的老掌柜：从酒肆跑堂到江湖名宿，人情练达了一辈子，也传了一辈子。老掌柜的规矩还在被人提起，后辈们照着你的路走下去。传承不是名字传下去，是智慧传下去了——你这辈子，没白活。"

---

### Node 6: Cost Label Per Variant

| Variant | Cost Label | Done-flag-first? |
|---------|------------|-----------------|
| 叹 (Sigh) | `身后名·叹` | ✅ checked before late-life |
| 遥 (Distant) | `身后名·遥` | ✅ checked before late-life |
| 传 (Legacy) | `身后名·传` | ✅ checked before late-life |

**Distinct from late-life labels:**
- Not 油尽灯枯 / 逍遥自在 / 传承授业 (late-life)
- Not 声名之累 / 快意恩仇 / 人情练达 (payoff)
- Not 人情债渐重 (pressure)
- Not 江湖声名之累 (entry)

**Player-visible:** All three labels pass `isPlayerVisibleSampleLineText()` ✅

---

### Node 7: Current Goal Per Variant

| Variant | Current Goal |
|---------|-------------|
| 叹 (Sigh) | `听着自己成了传说，也算值了` |
| 遥 (Distant) | `传说真假谁真谁假，自己知道就好` |
| 传 (Legacy) | `看着后辈们传下去，这就够了` |

**All three meaningfully different:** ✅ (sigh = resignation/acceptance, distant = playful mystery, legacy = warm satisfaction)

**Player-visible:** All three pass `isPlayerVisibleSampleLineText()` ✅

---

## Bonus Nodes

### Bonus 1: Endgame Identity Deepening

Endgame identity deepens (not replaces) late-life identity:
- Late-life A: 油尽灯枯的老好人 → Endgame A: **熬干了的老传说** (perspective shifts from first-person decline to third-person legend)
- Late-life B: 逍遥自在的孤翁 → Endgame B: **传说里的神秘人** (perspective shifts from active freedom to legendary distance)
- Late-life C: 德高望重的老前辈 → Endgame C: **活在传说里的老掌柜** (perspective shifts from active mentorship to living legacy)

**All three endgame identities are distinct from each other:** ✅ (verified in test group 7)

---

### Bonus 2: Ordinary Origin Expression

Three additional expression surfaces updated in `ordinaryOriginExpression.ts`:

| Surface | Variant A (叹) | Variant B (遥) | Variant C (传) |
|---------|---------------|---------------|---------------|
| Current goal | 听着自己成了传说，也算值了 | 传说真假谁真谁假，自己知道就好 | 看着后辈们传下去，这就够了 |
| Life memory | 坐在酒肆角落里听年轻人讲「那个老掌柜」 / 名声比人长久 | 在酒肆听邻桌讲「逍遥翁」传说 / 真假难辨 / 没人认出你 | 年轻人聊「老掌柜的规矩」 / 智慧传下去了 |
| Summary | 身后名·叹 / 名声比人长久 | 身后名·遥 / 传说比人逍遥 | 身后名·传 / 智慧比人长久 |

**All tavern-born flavored:** 酒肆 / 老掌柜 / 三教九流 / 老客人 ✅

---

### Bonus 3: Done-flag-first Priority

When BOTH late-life and endgame flags are set, endgame wins:

| Test | Result |
|------|--------|
| Label with both sets of flags | `身后名·传` (NOT `传承授业`) ✅ |

Pattern: `renown_endgame_done` checked BEFORE `renown_late_life_done` in all expression functions.

---

### Bonus 4: Mutex With Other Lines

Endgame events exclude orthodox and demonic seeds:
- `!flags.has('orthodox_childhood_seed_done')` ✅
- `!flags.has('demonic_childhood_seed_done')` ✅

Endgame only triggers for tavern_hand origin renown route:
- Requires `tavern_renown_bridge_crossed` ✅

---

### Bonus 5: Branch Matching Correctness

Late-life branch → Endgame variant mapping:

| Late-life marker | Endgame variant | Event ID |
|-----------------|-----------------|----------|
| tavern_renown_late_burnout | tavern_renown_endgame_sigh | renown_endgame_echo_sigh |
| tavern_renown_late_lone_wolf | tavern_renown_endgame_distant | renown_endgame_echo_distant |
| tavern_renown_late_mentor | tavern_renown_endgame_legacy | renown_endgame_echo_legacy |

**Thematic consistency:**
- Burnout → Sigh: 硬扛 → 名声比人长久 (fame as final burden/payoff) ✅
- Lone Wolf → Distant: 撕破脸 → 传说比人逍遥 (freedom → legend) ✅
- Mentor → Legacy: 传承授业 → 智慧比人长久 (mentorship → living legacy) ✅

---

### Bonus 6: Tavern-born Flavor Check

All three variants preserve tavern-born renown flavor:

| Element | Variant A | Variant B | Variant C |
|---------|-----------|-----------|-----------|
| 酒肆 setting | ✅ 坐在酒肆角落 | ✅ 酒肆里喝酒 | ✅ 酒肆里坐着 |
| 老掌柜 reference | ✅ 那个老掌柜 | ✅ (逍遥翁 angle) | ✅ 老掌柜的规矩 |
| 三教九流 / 人情 | ✅ 年轻人讲传说 | ✅ 三教九流 | ✅ 后辈们传下去 |
| Perspective shift | ✅ 第三人称 (听别人讲自己) | ✅ 第三人称 (听别人讲自己) | ✅ 第三人称 (看别人传自己) |

---

### Bonus 7: Lightweight Compliance Verification

| Constraint | Status |
|------------|--------|
| 1 echo event maximum | ✅ 3 variant events of the same echo (conceptually 1 event) |
| Expression updates only | ✅ No new systems, no new framework |
| Auto event | ✅ Not a choice event |
| 3 variants max | ✅ Exactly 3 (sigh / distant / legacy) |
| Single age window | ✅ 60-65, not multiple stages |
| 2+ endgame signals | ✅ 6 expression surfaces updated |
| No stat changes | ✅ Zero stat_modify effects in any endgame event |

---

## Test Evidence

All assertions verified by `tests/p81TavernHandRenownEndgameSpineTests.ts`:

- **9 test groups, ~30 assertions** — all passing ✅
- P79 late-life tests still pass — no regressions ✅
- Typecheck passes ✅

---

## Conclusion

**Renown endgame targeted proof: PASS**

All 7 core nodes verified + 7 bonus nodes. The endgame echo event fires correctly at age 60-65 with 3 distinct variants (叹/遥/传), updates 6 expression surfaces with tavern-born flavor, maintains lightweight constraints (no stat changes), and causes no regressions in prior renown stages.

The renown route now has a complete narrative arc: bridge → entry → on-ramp → pressure → payoff → late-life → endgame.
