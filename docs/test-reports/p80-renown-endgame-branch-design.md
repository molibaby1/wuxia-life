# P80 Renown Endgame — Three Branch Design

> **Date:** 2026-06-29
> **Stage:** P80 Wuxia Renown Endgame Design-First Contract
> **Purpose:** Detailed design for 3 endgame branches (one per late-life branch) — CONDITIONAL_GO

---

## 1. Executive Summary

Three endgame branches designed, each a distinct variant of the Legacy Echo (身后名之声) theme. All three are single auto echo events (not choice) with the same structure but different content — one per late-life branch.

**Event shape:** Single auto event with 3 variants (not 3 separate events) — satisfies lightweight constraint.

**Branching:** Based on late-life branch markers:
- Branch A: 油尽灯枯 → 身后名之声·叹 (Bittersweet Legend)
- Branch B: 逍遥自在 → 身后名之声·遥 (Distant Legend)
- Branch C: 传承授业 → 身后名之声·传 (Living Legend)

---

## 2. Event Structure Decision

### 2.1 Selected: Single Auto Event with 3 Variants

**Why single event:** `renown_endgame_echo`

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at payoff; endgame is the final consequence
- Feels like "江湖怎么说你" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint

**Why 3 variants (not unified):**
- Each late-life branch has fundamentally different identity
- Each deserves a distinct "how jianghu remembers you
- 3 variants under 1 event = still lightweight
- Deepens the 3-branch structure that makes renown unique

---

## 3. Branch A — 油尽灯枯 → 身后名之声·叹

### 3.1 Core Narrative

**Late-life identity:** 油尽灯枯的老好人 — 守住名声仍在，人熬干了

**Endgame echo:** 老客人们还在酒肆里提起你，但新的客人只听过传说。你的名声还在，但已经开始变了味道——人们只记得你的好，记不得你付出了多少。

**Narrative beat:**
- 某个寻常的日子里，听见酒肆里来了个年轻人，问起"那个老掌柜"
- 老客人叹口气说："那人啊，是个好人……" 但说不出更多细节了
- 你坐在角落里，听着自己成了传说
- 名声比人长久——你守了一辈子的名声，最后真的传下去了，但代价也真的没人记得了

### 3.2 Player Experience

- **Tone:** Bittersweet — 名声传下去了，但人熬干了
- **Feeling:** 你守住了名声，但名声已经不属于你了
- **Player emotion:** 苦涩中有欣慰，又有释然
- **Tavern-born anchor:** 酒肆门槛、老客人叹息、年轻人听传说

### 3.3 Expression Updates

**Cost label:** 身后名·叹
**Current goal:** 听着自己成了传说，也算值了
**Identity:** 熬干了的老传说
**Life memory:** 名声传下去了 + 老客人还念你的好 + 年轻人只听过传说
**Summary:** 江湖名宿 + 身后名·叹 + 名声比人长久

### 3.4 Stat Changes (Minimal)
- rep: 0 (名声不是涨了，但也不是你自己的了)
- 或者: 0
- 净变化最小 — endgame是记忆，不是能力变化

---

## 4. Branch B — 逍遥自在 → 身后名之声·遥

### 4.1 Core Narrative

**Late-life identity:** 逍遥自在的孤翁 — 无牵无挂，过好剩下的日子

**Endgame echo:** 你的故事还在江湖上流传，但没人知道你在哪。有人说在塞外见过你，有人说你早就死了，有人说你还活着。你成了酒肆里真假参半的传说。

**Narrative beat:**
- 酒肆里有人讲起"那个逍遥翁"的故事
- 说当年怎么怎么样，真假难辨
- 你也许就在角落里听着，没人认出你
- 你笑了笑，自己都快忘了自己当年的样子了
- 江湖上的你，比真实的你，早就两回事了

### 4.2 Player Experience

- **Tone:** Playful-mysterious — 传说真假参半，人逍遥
- **Feeling:** 你和你的名声已经脱钩了——它在，你不在
- **emotion:** 好笑，又有点虚无
- **Tavern-born anchor:** 酒肆谈资、真假传说、逍遥人在没人认

### 4.3 Expression Updates

**Cost label:** 身后名·遥
**Current goal:** 传说真假谁真谁假，自己知道就好
**Identity:** 逍遥传说里的神秘人
**Life memory:** 故事还在流传 + 没人知道你在哪 + 真假参半的传说
**Summary:** 江湖独行 + 身后名·遥 + 传说比人逍遥

### 4.4 Stat Changes (Minimal)
- rep: 0
- con: 0
- cha: 0
- 净变化: 0 — endgame 是记忆，不是能力变化

---

## 5. Branch C — 传承授业 → 身后名之声·传

### 5.1 Core Narrative

**Late-life identity:** 德高望重的老前辈 — 指点后辈，把这一辈子的人情世故传下去

**Endgame echo:** 你的后辈们在酒肆里讲你的故事，讲"老掌柜当年说过……"。你的智慧通过他们传下去了。你不在江湖，但你的规矩、你的话，成了酒肆里的传统。

**Narrative beat:**
- 看见后辈们在酒肆里聊天
- 他们说起"老掌柜的规矩"
- 你的话还在被人提起
- 你笑了——你这辈子没白活
- 传承不是名字传下去，是智慧传下去了

### 5.2 Player Experience

- **Tone:** Warm-satisfied — 传承了，传下去了
- **Feeling:** 你的一部分活在后辈们的身上
- **Player emotion:** 温暖、满足
- **Tavern-born anchor:** 老掌柜的规矩、后辈们传下去、酒肆传统

### 5.3 Expression Updates

**Cost label:** 身后名·传
**Current goal:** 看着后辈们传下去，这就够了
**Identity:** 活在传说里的老掌柜
**Life memory:** 后辈们讲你的故事 + 老掌柜的规矩 + 智慧传下去了
**Summary:** 江湖名宿 + 身后名·传 + 智慧比人长久

### 5.4 Stat Changes (Minimal)
- rep: 0
- con: 0
- cha: 0
- 净变化: 0 — endgame 是记忆，不是能力变化

---

## 6. Three Branches Comparison

| Dimension | Branch A: 叹 | Branch B: 遥 | Branch C: 传 |
|-----------|--------------|-------------|-------------|
| **Late-life root** | 油尽灯枯 | 逍遥自在 | 传承授业 |
| **Core theme** | 名声比人长久 | 传说比人逍遥 | 智慧比人长久 |
| **Tone** | Bittersweet | Playful-mysterious | Warm-satisfied |
| **Jianghu memory** | 只记得你的好，忘了你的代价 | 真假参半的传说，人在哪没人知道 | 智慧通过后辈传下去 |
| **Player feeling** | 苦涩中有释然 | 好笑中有虚无 | 温暖中有满足 |
| **Cost label** | 身后名·叹 | 身后名·遥 | 身后名·传 |
| **Identity** | 熬干了的老传说 | 传说里的神秘人 | 活在传说里的老掌柜 |
| **Tavern anchor** | 老客人叹息 | 酒肆谈资 | 后辈传规矩 |
| **Stat changes** | None | None | None |

---

## 7. Single Event Structure

### Event ID
`renown_endgame_echo`

### Type
`auto` (echo event)

### Age Range
60–65 岁 (推荐 62±3)

### Trigger
`age_reach` at age 60

### Trigger Conditions
1. `flags.has('renown_late_life_done')` — late-life 已完成
2. `!flags.has('renown_endgame_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. `flags.has('tavern_renown_bridge_crossed')` — 隐含保证 tavern_hand origin + ally_network seed

### Upstream Gate
`renown_late_life_done`

### Branching Logic
Based on which late-life branch marker is set:
- `tavern_renown_late_burnout` → Variant A (身后名之声·叹)
- `tavern_renown_late_lone_wolf` → Variant B (身后名之声·遥)
- `tavern_renown_late_mentor` → Variant C (身后名之声·传)

**Exactly one of these three will be set** (guaranteed by late-life events).

### Checkpoint Flag
`renown_endgame_done` — 通用 checkpoint，标记 endgame 已发生

### Endgame Identity Flag
`renown_endgame_identity_done` — endgame 身份深化

### Branch-Specific Identity Markers
三选一设置：
- `tavern_renown_endgame_sigh`（Variant A：叹）
- `tavern_renown_endgame_distant`（Variant B：遥）
- `tavern_renown_endgame_legacy`（Variant C：传）

### Stats
**None — Endgame is about memory/jianghu memory, not stat changes.

---

## 8. Endgame-Specific Player-Facing Signals

1. **Cost label change:** 身后名·叹 / 身后名·遥 / 身后名·传 — clearly shows endgame state
2. **Current goal change:** Each branch has distinct endgame goal
3. **Endgame identity:** 3 distinct endgame identities
4. **Life memory updates:** Each branch has distinct memory content
5. **Summary update:** Endgame summary includes 身后名 + branch flavor

**At least 2 core signals: ✅ Cost label + current goal + identity — all clearly show endgame state and branch direction.

---

## 9. Differentiation from Late-Life

| Dimension | Late-Life (52-56) | Endgame (60-65) |
|-----------|-------------------|-----------------|
| **Perspective | First-person: 你怎么过 | Third-person: 江湖怎么说你 |
| **Cost label | 油尽灯枯/逍遥自在/传承授业 | 身后名·叹/遥/传 |
| **Current goal | 守住名声/过好日子/指点后辈 | 听着传说/真假自知/看着传承 |
| **Identity | 老好人/孤翁/老前辈 | 老传说/神秘人/活在传说里 |
| **Core theme | 晚年怎么过 | 江湖怎么记住你 |
| **Agency | You're still living it | It's happening to your legacy |

---

## 10. Tavern-Born Flavor Verification

All three branches have distinct tavern-born flavor anchors:

| Branch | Tavern-born Anchors |
|--------|-------------------|
| A: 叹 | 酒肆门槛、老客人叹息、年轻人听传说 |
| B: 遥 | 酒肆谈资、真假传说、在座没人认出你 |
| C: 传 | 老掌柜的规矩、后辈们传下去、酒肆传统 |

**Flavor consistency: ✅ All branches have distinct, meaningful tavern-born anchors**

---

## 11. Lightweight Compliance Check

| Constraint | Status | Notes |
|------------|--------|-------|
| 1 echo event maximum | ✅ Yes | Single event with 3 variants |
| Expression updates only | ✅ Yes | No new systems, no new framework |
| Auto event (not choice) | ✅ Yes | Echo event, auto trigger |
| 3 variants | ✅ Yes | One per late-life branch |
| Single age window | ✅ Yes | 60-65 |
| 2+ endgame-specific signals | ✅ Yes | Cost label + current goal + identity (3+) |
| No stat changes | ✅ Yes | Endgame is memory, not stat changes |

**Lightweight compliance: ✅ 7/7 constraints satisfied**

---

**P80-004 complete.** Three endgame branches designed. All 3 meaningfully different. All tavern-born flavored. Lightweight compliant. 0 runtime changes.
