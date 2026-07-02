# P118 Founding Patriarch Endgame — Two Branch Design

> **Date:** 2026-07-02
> **Stage:** P118 Wuxia Founding Patriarch Endgame Design-First
> **Purpose:** Detailed design for 2 endgame branches (one per late-life branch) — CONDITIONAL_GO
> **Status:** Not skipped — GO verdict from P118-003

---

## 1. Executive Summary

Two endgame branches designed, each a distinct variant of the Founding Legacy Echo (开派终局回响) theme. Both are single auto echo events (not choice) with the same structure but different content — one per late-life branch.

**Event shape:** Single auto event with 2 variants (or 2 spine auto events mirroring P117 late-life pattern) — satisfies lightweight constraint.

**Branching:** Based on late-life branch markers:
- Branch A: 门规守成 → 开派终局·规 (Rule Legacy Echo)
- Branch B: 盟约续责 → 开派终局·盟 (Alliance Legacy Echo)

---

## 2. Event Structure Decision

### 2.1 Selected: Single Auto Event with 2 Variants

**Event ID:** `founding_patriarch_endgame_echo` (or 2 spine events: `founding_patriarch_endgame_echo_rule_keeper`, `founding_patriarch_endgame_echo_alliance_bearer`)

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at pressure/payoff; late-life was the consequence; endgame is the final settlement
- Feels like "开派名号怎么收官" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint and renown P80/P81 / patron P111 pattern

**Why 2 variants (not unified):**
- Each late-life branch has fundamentally different identity
- Each deserves a distinct "how the founding legacy settles"
- 2 variants under 1 event = still lightweight
- Deepens the 2-branch structure that makes founding-patriarch unique

**Recommended implementation:** 2 separate auto events in spine (mirroring P117 late-life pattern) OR single event with conditional branchEffects. P119 may choose either; contract specifies behavior, not wiring detail.

---

## 3. Branch A — 门规守成 → 开派终局·规

### 3.1 Core Narrative

**Late-life identity:** 门规守成的开宗祖师 — 门规守了一辈子，晚年以书斋治学为主

**Endgame echo:** 书斋封了最后一卷，弟子在门规碑前立匾。诸派来人只说"门规立住了"，盟约文书退到一旁。开派名号成了门规的碑——人老了，规矩还在。

**Narrative beat:**
- 六十二岁这年，书斋伙计封上最后一卷门规抄本
- 弟子在山门前立匾，匾上写的是你定的治学师承规矩
- 诸派来人拱手，说"这门规，江湖还会照着走"
- 你站在书斋与山门之间，想起四十岁那年的次序选择
- 门规比人长久——你守了一辈子的开派名号，最后真的成了门规的碑

### 3.2 Trigger Conditions

- `founding_patriarch_late_life_done` = true
- `founding_patriarch_late_rule_keeper` = true
- `!founding_patriarch_endgame_echo_done`
- orthodox exclusivity guards

### 3.3 Player Experience

- **Tone:** Bittersweet-solemn — 门规终了，规矩比人长久
- **Feeling:** 你守住了开派名号，但名号已经不属于你了——它成了门规的一部分
- **Player emotion:** 沉稳中有释然，门规立派终老
- **Founding anchor:** 书斋封卷、门规碑、弟子立匾、治学师承

### 3.4 Expression Updates

| Surface | Endgame Value |
|---------|---------------|
| Cost label | **开派终局·规** |
| Current goal | **门规碑立，治学师承交给后来人续** |
| Identity | **门规碑上的开宗祖师：书斋封了，门规立了，诸派还照着走。开派名号比人长久，规矩也还在** |

### 3.5 Stat Changes

**None.** Endgame is about founding legacy settlement, not power-up.

---

## 4. Branch B — 盟约续责 → 开派终局·盟

### 4.1 Core Narrative

**Late-life identity:** 盟约续责的开宗祖师 — 盟约扛了一辈子，晚年以山门对外为主

**Endgame echo:** 山门立了最后一块匾，诸派差遣文书归档。书斋门半掩——没有弟子来抄门规，只有盟会来人续签。开派名号成了盟约的碑——人老了，续责还在。

**Narrative beat:**
- 六十二岁这年，诸派使者来取最后一份盟约副本
- 山门匾上写着开派名号，底下小字是诸派续责的条款
- 书斋门半掩，门规卷宗收在柜里，不再翻出来
- 盟会的人说"这盟约，诸派还会续下去"
- 盟约比人长久——你扛了一辈子的开派名号，最后真的成了盟约的碑

### 4.2 Trigger Conditions

- `founding_patriarch_late_life_done` = true
- `founding_patriarch_late_alliance_bearer` = true
- `!founding_patriarch_endgame_echo_done`
- orthodox exclusivity guards

### 4.3 Player Experience

- **Tone:** Weary-resigned — 盟约终了，续责比人长久
- **Feeling:** 你扛住了开派名号，但名号已经不属于你了——它成了盟约的一部分
- **Player emotion:** 疲惫中有认命，盟约立派终老
- **Founding anchor:** 山门立匾、盟约归档、诸派续签、书斋半掩

### 4.4 Expression Updates

| Surface | Endgame Value |
|---------|---------------|
| Cost label | **开派终局·盟** |
| Current goal | **盟约碑立，诸派续责交给后来人扛** |
| Identity | **盟约碑上的开宗祖师：山门立了，盟约续了，诸派还记着这笔账。开派名号比人长久，续责也还在** |

### 4.5 Stat Changes

**None.** Endgame is about founding legacy settlement, not power-up.

---

## 5. Branch Differentiation Check

| Dimension | Branch A (规) | Branch B (盟) |
|-----------|---------------|---------------|
| **Late-life root** | rule_keeper | alliance_bearer |
| **Core theme** | 门规比人长久 | 盟约比人长久 |
| **Scene anchor** | 书斋封卷 / 门规碑 | 山门立匾 / 盟约归档 |
| **Tone** | 沉稳释然 | 疲惫认命 |
| **Cost label** | 开派终局·规 | 开派终局·盟 |
| **Goal semantic** | 门规碑立，师承续 | 盟约碑立，续责扛 |
| **Identity semantic** | 门规碑上的开宗祖师 | 盟约碑上的开宗祖师 |

**Differentiation check: ✅ Pass** — 两个分支有实质差异，不是换皮。各自对应不同的 late-life identity 和开派治理风味。

---

## 6. Sect Inheritance Handoff (Narrative Only)

Both branches may reference inheritance as **narrative beat** only:

| Branch | Inheritance Beat |
|--------|------------------|
| A (规) | 弟子在门规碑前立匾，治学师承交给后来人续 |
| B (盟) | 诸派使者取盟约副本，续责交给后来人扛 |

**No new markers.** No `sect_inheritance_*` flag system. No life memory / summary surface in P119 minimum.

---

## 7. Shared Event Structure

| Field | Value |
|-------|-------|
| Event record | `founding_patriarch_endgame_echo` |
| Type | auto |
| Age range | 60–65 (recommend trigger at 62) |
| Upstream gate | `founding_patriarch_late_life_done` |
| Branch key | `founding_patriarch_late_rule_keeper` / `founding_patriarch_late_alliance_bearer` |
| Checkpoint | `founding_patriarch_endgame_echo_done` |
| Identity checkpoint | `founding_patriarch_endgame_identity_done` |
| Branch markers | `founding_patriarch_endgame_rule_echo` / `founding_patriarch_endgame_alliance_echo` |
| Stats | None |

**Shared opening text (reference):**
> 六十二岁这年，你站在山门与书斋之间，想起五十二岁那年的晚年光景。
>
> 开宗立派的名号传了这么多年，江湖上的评价也定了调。可你自己最清楚——当年定下的治理次序，到了最后，是个什么定论？
>
> 这笔终局的账，该算清了。

Branch-specific text continues based on late-life marker.

---

**P118-004 complete.**
