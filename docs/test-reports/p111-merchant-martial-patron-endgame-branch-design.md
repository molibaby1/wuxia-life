# P111 Merchant Martial Patron Endgame — Three Branch Design

> **Date:** 2026-07-02
> **Stage:** P111 Wuxia Merchant Martial Patron Endgame Design-First
> **Purpose:** Detailed design for 3 endgame branches (one per late-life branch) — CONDITIONAL_GO
> **Status:** Not skipped — GO verdict from P111-003

---

## 1. Executive Summary

Three endgame branches designed, each a distinct variant of the Covenant Legacy Echo (商武终局回响) theme. All three are single auto echo events (not choice) with the same structure but different content — one per late-life branch.

**Event shape:** Single auto event with 3 variants (not 3 separate events) — satisfies lightweight constraint.

**Branching:** Based on late-life branch markers:
- Branch A: 盟约绑紧 → 商武终局·担 (Covenant Burden Echo)
- Branch B: 自由孤立 → 商武终局·孤 (Solitary Merchant Echo)
- Branch C: 新盟可持续 → 商武终局·传 (Sustainable Covenant Legacy)

---

## 2. Event Structure Decision

### 2.1 Selected: Single Auto Event with 3 Variants

**Event ID:** `merchant_patron_endgame_echo`

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at payoff; late-life was the consequence; endgame is the final settlement
- Feels like "商武名号怎么收官" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint and renown P80/P81 pattern

**Why 3 variants (not unified):**
- Each late-life branch has fundamentally different identity
- Each deserves a distinct "how the covenant settles"
- 3 variants under 1 event = still lightweight
- Deepens the 3-branch structure that makes patron unique

**Recommended implementation:** 3 separate auto events in spine (mirroring P110 late-life pattern: `merchant_patron_endgame_echo_covenant_bound`, `merchant_patron_endgame_echo_isolated_merchant`, `merchant_patron_endgame_echo_sustainable_covenant`) OR single event with conditional branchEffects. P112 may choose either; contract specifies behavior, not wiring detail.

---

## 3. Branch A — 盟约绑紧 → 商武终局·担

### 3.1 Core Narrative

**Late-life identity:** 盟约终老的商武金主 — 硬扛了一辈子盟约，晚年山门差遣比账房还多

**Endgame echo:** 账房关了最后一本账，演武场收了最后一把刀。山门来人取走盟约副本，说"这笔账，江湖还会记着"。商武名号成了盟约的碑——人走了，担子还在。

**Narrative beat:**
- 六十二岁这年，账房伙计合上最后一本总账
- 演武场传来最后一声刀鸣，随后归于沉寂
- 山门使者来取盟约副本，语气恭敬却像在收债
- 你站在账房与演武场之间，想起四十八岁那年的选择
- 盟约比人长久——你守了一辈子的商武名号，最后真的成了盟约的碑

### 3.2 Trigger Conditions

- `merchant_patron_late_life_done` = true
- `merchant_patron_late_covenant_bound` = true
- `!merchant_patron_endgame_echo_done`
- orthodox/demonic exclusivity guards

### 3.3 Player Experience

- **Tone:** Bittersweet-solemn — 盟约终了，担子比人长久
- **Feeling:** 你守住了商武名号，但名号已经不属于你了——它成了盟约的一部分
- **Player emotion:** 沉重中有释然，盟约如山终老
- **Patron anchor:** 账房关账、演武场收刀、山门取盟约、刀与算盘

### 3.4 Expression Updates

| Surface | Endgame Value |
|---------|---------------|
| Cost label | **商武终局·担** |
| Current goal | **盟约碑立，商武名号交给后来人记** |
| Identity | **盟约碑上的商武金主：账房关了，刀收了，山门还记着这笔账。商武名号比人长久，担子也还在** |

### 3.5 Stat Changes

**None.** Endgame is about covenant settlement, not power-up.

---

## 4. Branch B — 自由孤立 → 商武终局·孤

### 4.1 Core Narrative

**Late-life identity:** 孤商巨贾 — 撕破盟约后商号靠自己撑起来了，自由且孤立

**Endgame echo:** 账房只有自己人，演武场空着——没有山门来取盟约，也没有人来还人情。商号立住了，商武名号是孤商自己的定论，没有盟约回音。

**Narrative beat:**
- 六十二岁这年，账房伙计问要不要给山门留副本
- 你摆摆手——没有盟约了，账房只有自己人
- 演武场空着，刀还在磨，但没人来差遣
- 商路上的伙计提起你，说的是"那个不靠山门的孤商"
- 自由是真的，孤立也是真的——但商号是自己的，定论也是自己的

### 4.2 Trigger Conditions

- `merchant_patron_late_life_done` = true
- `merchant_patron_late_isolated_merchant` = true
- `!merchant_patron_endgame_echo_done`
- orthodox/demonic exclusivity guards

### 4.3 Player Experience

- **Tone:** Quiet-defiant — 孤商自立，无盟约回音
- **Feeling:** 你和盟约已经脱钩了——商号在，名号是自己的
- **Player emotion:** 平静中有骄傲，也有淡淡的孤
- **Patron anchor:** 空演武场、账房自管、商路提起孤商、无山门来取

### 4.4 Expression Updates

| Surface | Endgame Value |
|---------|---------------|
| Cost label | **商武终局·孤** |
| Current goal | **商号是自己的定论，不再等盟约回音** |
| Identity | **孤商终局的巨贾：账房自己管，演武场空着，商路上的名号不靠山门。自由是真的，定论也是自己的** |

### 4.5 Stat Changes

**None.**

---

## 5. Branch C — 新盟可持续 → 商武终局·传

### 5.1 Core Narrative

**Late-life identity:** 新盟掌局的金主 — 重谈的盟约规矩还在运转，后来人请教商武分寸

**Endgame echo:** 后来人按你定的商武分寸运转账房与演武场。新盟规矩成了传统——不是你的名字传下去，是你定的分寸传下去了。

**Narrative beat:**
- 六十二岁这年，年轻掌柜来请教"商武分寸怎么算"
- 你指了指账房与演武场之间的那条线
- 他们说"老金主定的规矩，还在运转"
- 你笑了——新盟比人长久，分寸传下去了
- 传承不是名号传下去，是商武分寸传下去了

### 5.2 Trigger Conditions

- `merchant_patron_late_life_done` = true
- `merchant_patron_late_sustainable_covenant` = true
- `!merchant_patron_endgame_echo_done`
- orthodox/demonic exclusivity guards

### 5.3 Player Experience

- **Tone:** Warm-satisfied — 新盟运转，分寸传下去了
- **Feeling:** 你定的商武分寸活在后来人的运转里
- **Player emotion:** 温暖、满足、中庸智者
- **Patron anchor:** 年轻掌柜请教、账房演武场分寸线、新盟规矩运转

### 5.4 Expression Updates

| Surface | Endgame Value |
|---------|---------------|
| Cost label | **商武终局·传** |
| Current goal | **看后来人按新盟分寸运转，这就够了** |
| Identity | **新盟传统的金主：商武分寸传下去了，账房与演武场各守其份。后来人按你定的规矩运转，新盟比人长久** |

### 5.5 Stat Changes

**None.**

---

## 6. Branch Differentiation Check

| Dimension | A: 盟约绑紧 | B: 自由孤立 | C: 新盟可持续 |
|-----------|------------|------------|--------------|
| **Core theme** | 盟约比人长久 | 孤商自立定论 | 分寸传下去 |
| **Tone** | Bittersweet-solemn | Quiet-defiant | Warm-satisfied |
| **Cost label** | 商武终局·担 | 商武终局·孤 | 商武终局·传 |
| **Goal focus** | 盟约碑立 | 商号自定论 | 分寸传承 |
| **Scene anchor** | 山门取盟约 | 空演武场 | 年轻掌柜请教 |
| **Late-life root** | covenant_bound | isolated_merchant | sustainable_covenant |

**Differentiation verdict:** ✅ Three branches are meaningfully different — not reskinned. Each preserves 商武一体 patron flavor with distinct settlement narrative.

---

## 7. Shared Event Properties

| Property | Value |
|----------|-------|
| Event type | Auto |
| Age range | 60–65 (recommended trigger: age 62) |
| Upstream gate | `merchant_patron_late_life_done` |
| Branch key | `merchant_patron_late_*` (one of 3) |
| Shared checkpoint | `merchant_patron_endgame_echo_done` |
| Identity checkpoint | `merchant_patron_endgame_identity_done` |
| Stats | None |
| Choice | None |

---

**P111-004 complete.**
