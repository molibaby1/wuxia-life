# P111 Merchant Martial Patron Endgame Contract

> **Purpose:** Design-first contract for the `merchant_martial_patron` endgame / final legacy stage — 3 variants based on late-life branch, auto echo event at age 60+
> **Source of truth:** This contract defines what P112 (implementation) must deliver.
> **Status:** LOCKED — P111 design-first complete
> **Verdict:** CONDITIONAL_GO — lightweight only

---

## 1. Core Direction

**Selected:** Single auto echo event with 3 variants — Covenant Legacy Echo (商武终局回响)

**Core narrative question:** 商武名号与盟约如何收官？

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at payoff; late-life was the consequence; endgame is the final settlement
- Feels like "商武名号怎么收官" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint

**Why 3 variants:**
- Leverages the 3-branch structure from late-life
- Each branch delivers on the "covenant settlement" promised by late-life identity
- Meaningful differentiation — not reskinned
- Still lightweight (1 event, 3 variants)

**Distinction from late-life:**
- Late-life = first-person: 你晚年怎么过
- Endgame = echo/settlement: 商武名号与盟约怎么收官
- Late-life is an active life stage; endgame is a coda / echo

**Distinction from renown endgame:**
- Renown = 江湖怎么记住你（身后名之声）
- Patron = 商武名号与盟约怎么收官（商武终局回响）

**Distinction from magnate endgame:**
- Magnate = 巨贾守成传承
- Patron = 盟约/账房/演武场的终局回响

**Distinction from generic P19 endgame:**
- P19 = comprehensive end-of-life system
- Patron endgame = route-specific thematic coda (商武一体 covenant settlement only)
- P19 = end of life / death; Patron endgame = 60–65 echo event, before final death

---

## 2. Endgame Event Spec

### Event ID
`merchant_patron_endgame_echo` (or 3 spine events: `merchant_patron_endgame_echo_covenant_bound`, `merchant_patron_endgame_echo_isolated_merchant`, `merchant_patron_endgame_echo_sustainable_covenant`)

### Type
`auto`（自动触发，echo event）

### Age Range
60–65 岁 (推荐 62±3)

### Trigger
`age_reach` at age 62 (or 60–65 window)

### Trigger Conditions
1. `flags.has('merchant_patron_late_life_done')` — late-life 已完成
2. `!flags.has('merchant_patron_endgame_echo_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. Exactly one `merchant_patron_late_*` marker set (guaranteed by late-life)

### Upstream Gate
`merchant_patron_late_life_done`

### Branching Logic
Branching is based on which late-life branch marker is set:
- `merchant_patron_late_covenant_bound` → Variant A (商武终局·担)
- `merchant_patron_late_isolated_merchant` → Variant B (商武终局·孤)
- `merchant_patron_late_sustainable_covenant` → Variant C (商武终局·传)

**Exactly one of these three will be set** (guaranteed by late-life events).

### Checkpoint Flag
`merchant_patron_endgame_echo_done` — 通用 checkpoint，标记 endgame 已发生

### Endgame Identity Flag
`merchant_patron_endgame_identity_done` — endgame 身份深化

### Branch-Specific Identity Markers
三选一设置：
- `merchant_patron_endgame_covenant_echo`（Variant A：担）
- `merchant_patron_endgame_solitary_echo`（Variant B：孤）
- `merchant_patron_endgame_legacy_echo`（Variant C：传）

### Stats
**None.** Endgame is about covenant settlement / legacy echo, not stat changes.

Rationale:
- Endgame is a coda, not a power-up
- Stat changes would feel like "more late-life" rather than a distinct endgame
- Lightweight constraint — keep it minimal (align renown P81)

---

## 3. Three Variant Details

### Variant A — 商武终局·担 (Covenant Burden Echo)

**Late-life root:** 盟约绑紧 (covenant_bound)
**Core theme:** 盟约比人长久
**Tone:** Bittersweet-solemn

**Narrative beat:**
- 账房关了最后一本账，演武场收了最后一把刀
- 山门使者来取盟约副本
- 商武名号成了盟约的碑

**Expression updates:**
- Cost label: `商武终局·担`
- Current goal: `盟约碑立，商武名号交给后来人记`
- Identity: `盟约碑上的商武金主：账房关了，刀收了，山门还记着这笔账。商武名号比人长久，担子也还在`

**Patron anchors:** 账房关账、演武场收刀、山门取盟约

---

### Variant B — 商武终局·孤 (Solitary Merchant Echo)

**Late-life root:** 自由孤立 (isolated_merchant)
**Core theme:** 孤商自立定论
**Tone:** Quiet-defiant

**Narrative beat:**
- 账房只有自己人，演武场空着
- 没有山门来取盟约
- 商路上的名号是孤商自己的定论

**Expression updates:**
- Cost label: `商武终局·孤`
- Current goal: `商号是自己的定论，不再等盟约回音`
- Identity: `孤商终局的巨贾：账房自己管，演武场空着，商路上的名号不靠山门。自由是真的，定论也是自己的`

**Patron anchors:** 空演武场、账房自管、商路提起孤商

---

### Variant C — 商武终局·传 (Sustainable Covenant Legacy)

**Late-life root:** 新盟可持续 (sustainable_covenant)
**Core theme:** 商武分寸传下去
**Tone:** Warm-satisfied

**Narrative beat:**
- 年轻掌柜来请教商武分寸
- 新盟规矩还在运转
- 分寸传下去了，不是名号传下去

**Expression updates:**
- Cost label: `商武终局·传`
- Current goal: `看后来人按新盟分寸运转，这就够了`
- Identity: `新盟传统的金主：商武分寸传下去了，账房与演武场各守其份。后来人按你定的规矩运转，新盟比人长久`

**Patron anchors:** 年轻掌柜请教、账房演武场分寸线、新盟规矩运转

---

## 4. Player-Facing Expression Updates

### 4.1 Endgame-Specific Signals (至少 2 个)

Expression 读取优先级：`endgame_echo_done` > `late_life_done` > `payoff_done` > pressure > on-ramp

**Gate order (P112):** `merchant_patron_endgame_echo_done` > `merchant_patron_late_life_done` > `merchant_patron_payoff_done` > `merchant_patron_midlife_pressure_done` > on-ramp

Within endgame: endgame branch marker > late-life branch marker > payoff choice marker > entry variant

#### Signal 1: Cost Label（按 endgame branch 分化）

**位置：** `deriveSampleLineCostLabel()` → `merchant_patron_endgame_echo_done` 分支

| Endgame Branch | Cost Label |
|----------------|------------|
| covenant_echo | **商武终局·担** |
| solitary_echo | **商武终局·孤** |
| legacy_echo | **商武终局·传** |
| fallback (endgame done, no branch marker) | 商武终局之累 |

**Gate:** `flags.merchant_patron_endgame_echo_done` + endgame branch marker

#### Signal 2: Current Goal（按 endgame branch 分化）

**位置:** `merchantCurrentGoal()` → `merchant_patron_endgame_echo_done` 分支

| Endgame Branch | Current Goal |
|----------------|--------------|
| covenant_echo | **盟约碑立，商武名号交给后来人记** |
| solitary_echo | **商号是自己的定论，不再等盟约回音** |
| legacy_echo | **看后来人按新盟分寸运转，这就够了** |
| fallback | 商武定型之后，终局自有终局的定论 |

**Gate:** `flags.merchant_patron_endgame_echo_done` + endgame branch marker

#### Signal 3: Age-40 Identity（按 endgame branch 分化）

**位置:** `merchantAge40Identity()` → `merchant_patron_endgame_identity_done` 分支

| Endgame Branch | Base Identity (reference) |
|----------------|----------------------------|
| covenant_echo | 盟约碑上的商武金主：账房关了，刀收了，山门还记着这笔账。商武名号比人长久，担子也还在 |
| solitary_echo | 孤商终局的巨贾：账房自己管，演武场空着，商路上的名号不靠山门。自由是真的，定论也是自己的 |
| legacy_echo | 新盟传统的金主：商武分寸传下去了，账房与演武场各守其份。后来人按你定的规矩运转，新盟比人长久 |

**Gate:** `flags.merchant_patron_endgame_identity_done` + endgame branch marker

### 4.2 Expression Priority (updated for P112)

1. Magnate markers win
2. `merchant_patron_endgame_echo_done` > `merchant_patron_late_life_done` > `merchant_patron_payoff_done` > pressure > on-ramp
3. Within endgame: endgame branch marker > late-life branch marker > payoff choice marker > entry variant
4. Generic fallback

### 4.3 Deferred Expression Updates

| Surface | Defer Reason |
|---------|--------------|
| Ordinary origin patron expression | P112 optional bonus / defer |
| Life memory / summary | Beyond lightweight endgame scope |
| Full 5×3 entry×payoff×late-life×endgame identity matrix | P112 minimum: native + 1 bridge per branch |

---

## 5. Differences: Endgame vs Late-Life vs Magnate/Renown Endgame

### 5.1 Endgame vs Late-Life

| Aspect | Late-Life (商武定型的晚年) | Endgame (商武终局回响) |
|--------|---------------------------|------------------------|
| **阶段定位** | 后果期、晚年展开 | 终局期、回响收束 |
| **核心情绪** | 沉淀、这个选择带来了什么 | 回响、商武名号与盟约怎么收官 |
| **事件模式** | Auto（3 条件分支） | Auto（3 条件分支 echo） |
| **Checkpoint** | `late_life_done` + `late_life_identity_done` | `endgame_echo_done` + `endgame_identity_done` |
| **Age band** | 52–56 | 60–65 |
| **Cost label** | 终老之累/自在之快/久立之累 | 终局·担/孤/传 |
| **Perspective** | First-person (your life) | Echo / settlement |

### 5.2 Patron Endgame vs Renown Endgame

| Aspect | Renown | Patron |
|--------|--------|--------|
| **Core theme** | 江湖怎么记住你 | 商武名号与盟约怎么收官 |
| **Scene** | 酒肆门槛 | 账房与演武场 |
| **A variant** | 身后名·叹 | 商武终局·担 |
| **B variant** | 身后名·遥 | 商武终局·孤 |
| **C variant** | 身后名·传 | 商武终局·传 |
| **Branch key** | `tavern_renown_late_*` | `merchant_patron_late_*` |

### 5.3 Patron Endgame vs Magnate Endgame

| Aspect | Magnate | Patron |
|--------|---------|--------|
| **Core theme** | 巨贾守成传承 | 商武盟约终局回响 |
| **Branch key** | P99 `magnate_native_late_*` | P110 `merchant_patron_late_*` |
| **Scene** | 商铺/商路 | 账房/演武场/盟约 |
| **Player agency** | Auto echo | Auto echo |

---

## 6. Flag Interfaces

### 6.1 Checkpoint Flags

| Flag | Purpose | Set By |
|------|---------|--------|
| `merchant_patron_endgame_echo_done` | Endgame echo 检查点 | Any endgame branch |
| `merchant_patron_endgame_identity_done` | Endgame 身份深化 | Any endgame branch |

### 6.2 Branch-Specific Markers (三选一)

| Marker | Branch |
|--------|--------|
| `merchant_patron_endgame_covenant_echo` | 商武终局·担 (A) |
| `merchant_patron_endgame_solitary_echo` | 商武终局·孤 (B) |
| `merchant_patron_endgame_legacy_echo` | 商武终局·传 (C) |

---

## 7. Gate Acceptance (Endgame Checkpoint)

| Checkpoint | Required Flags | Acceptance |
|------------|----------------|------------|
| Endgame closed | `merchant_patron_endgame_echo_done` | Set by any endgame branch |
| Branch traceability | `merchant_patron_endgame_*` (one of 3) | Matches late-life branch marker |
| Identity set | `merchant_patron_endgame_identity_done` | Set alongside endgame_echo_done |
| Upstream satisfied | `merchant_patron_late_life_done` + one `merchant_patron_late_*` | Must be true before endgame fires |
| Late-life preserved | `merchant_patron_late_life_done` remains true | Endgame does not unset late-life |

---

## 8. Implementation Notes (For P112)

### 8.1 Event Wiring Path

1. Add `merchant_patron_endgame_echo_*` auto event(s) to `sample-lines-spine.json`
2. Insert after late-life events in spine ordering
3. Configure 3 conditional branches keyed on late-life markers
4. Set checkpoint + branch markers per branch
5. Bump metadata tags: `p111`, `p112`, `auto`, `endgame`

### 8.2 Expression Placement

**文件:** `src/p50/sampleLineExpression.ts`

**函数:** `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`, `merchantAge40Identity()`

**模式:** 在 `merchant_patron_endgame_echo_done` / `merchant_patron_endgame_identity_done` 分支内，先检查 endgame branch marker，再 fallback late-life / payoff / entry variant.

### 8.3 Stat Changes

**None.** Do not add stat changes in endgame events.

---

**P111-005 complete.**
