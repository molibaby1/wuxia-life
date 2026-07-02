# P118 Founding Patriarch Endgame Contract

> **Purpose:** Design-first contract for the `founding_patriarch` endgame / final legacy stage — 2 variants based on late-life branch, auto echo event at age 60+
> **Source of truth:** This contract defines what P119 (implementation) must deliver.
> **Status:** LOCKED — P118 design-first complete
> **Verdict:** CONDITIONAL_GO — lightweight only

---

## 1. Core Direction

**Selected:** Single auto echo event with 2 variants — Founding Legacy Echo (开派终局回响)

**Core narrative question:** 开派名号与门规/盟约遗产如何收官？

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at pressure/payoff; late-life was the consequence; endgame is the final settlement
- Feels like "开派名号怎么收官" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint

**Why 2 variants:**
- Leverages the 2-branch structure from late-life
- Each branch delivers on the "founding legacy settlement" promised by late-life identity
- Meaningful differentiation — not reskinned
- Still lightweight (1 event, 2 variants)

**Distinction from late-life:**
- Late-life = first-person: 你晚年怎么过
- Endgame = echo/settlement: 开派名号与门规/盟约怎么收官
- Late-life is an active life stage; endgame is a coda / echo

**Distinction from renown endgame:**
- Renown = 江湖怎么记住你（身后名之声）
- Founding = 山门怎么记住开派祖师（开派终局回响）

**Distinction from patron endgame:**
- Patron = 商武名号与盟约怎么收官（商武终局回响）
- Founding = 门规/盟约/书斋/山门的终局回响

**Distinction from magnate endgame:**
- Magnate = 巨贾守成传承
- Founding = 开派治理遗产的终局回响

**Distinction from generic P19 endgame:**
- P19 = comprehensive end-of-life system
- Founding endgame = route-specific thematic coda (开派治理 legacy settlement only)
- P19 = end of life / death; Founding endgame = 60–65 echo event, before final death

---

## 2. Endgame Event Spec

### Event ID
`founding_patriarch_endgame_echo` (or 2 spine events: `founding_patriarch_endgame_echo_rule_keeper`, `founding_patriarch_endgame_echo_alliance_bearer`)

### Type
`auto`（自动触发，echo event）

### Age Range
60–65 岁 (推荐 62±3)

### Trigger
`age_reach` at age 62 (or 60–65 window)

### Trigger Conditions
1. `flags.has('founding_patriarch_late_life_done')` — late-life 已完成
2. `!flags.has('founding_patriarch_endgame_echo_done')` — 互斥 guard
3. `flags.has('orthodox_childhood_seed_done')` — orthodox 样本线
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道
5. `!flags.has('merchant_childhood_seed_done')` — 排除商道
6. Exactly one `founding_patriarch_late_*` marker set (guaranteed by late-life)

### Upstream Gate
`founding_patriarch_late_life_done`

### Branching Logic
Branching is based on which late-life branch marker is set:
- `founding_patriarch_late_rule_keeper` → Variant A (开派终局·规)
- `founding_patriarch_late_alliance_bearer` → Variant B (开派终局·盟)

**Exactly one of these two will be set** (guaranteed by late-life events).

### Checkpoint Flag
`founding_patriarch_endgame_echo_done` — 通用 checkpoint，标记 endgame 已发生

### Endgame Identity Flag
`founding_patriarch_endgame_identity_done` — endgame 身份深化

### Branch-Specific Identity Markers
二选一设置：
- `founding_patriarch_endgame_rule_echo`（Variant A：规）
- `founding_patriarch_endgame_alliance_echo`（Variant B：盟）

### Stats
**None.** Endgame is about founding legacy settlement / echo, not stat changes.

Rationale:
- Endgame is a coda, not a power-up
- Stat changes would feel like "more late-life" rather than a distinct endgame
- Lightweight constraint — keep it minimal (align renown P81 / patron P111)

---

## 3. Two Variant Details

### Variant A — 开派终局·规 (Rule Legacy Echo)

**Late-life root:** 门规守成终老 (rule_keeper)
**Core theme:** 门规比人长久
**Tone:** Bittersweet-solemn

**Narrative beat:**
- 书斋封了最后一卷门规抄本
- 弟子在门规碑前立匾
- 开派名号成了门规的碑

**Expression updates:**
- Cost label: `开派终局·规`
- Current goal: `门规碑立，治学师承交给后来人续`
- Identity: `门规碑上的开宗祖师：书斋封了，门规立了，诸派还照着走。开派名号比人长久，规矩也还在`

**Founding anchors:** 书斋封卷、门规碑、弟子立匾、治学师承

---

### Variant B — 开派终局·盟 (Alliance Legacy Echo)

**Late-life root:** 盟约续责终老 (alliance_bearer)
**Core theme:** 盟约比人长久
**Tone:** Weary-resigned

**Narrative beat:**
- 诸派使者来取最后一份盟约副本
- 山门匾上写着开派名号与续责条款
- 开派名号成了盟约的碑

**Expression updates:**
- Cost label: `开派终局·盟`
- Current goal: `盟约碑立，诸派续责交给后来人扛`
- Identity: `盟约碑上的开宗祖师：山门立了，盟约续了，诸派还记着这笔账。开派名号比人长久，续责也还在`

**Founding anchors:** 山门立匾、盟约归档、诸派续签、书斋半掩

---

## 4. Player-Facing Expression Updates

### 4.1 Endgame-Specific Signals (至少 2 个)

Expression 读取优先级：`endgame_echo_done` > `late_life_done` > `payoff_done` > pressure > on-ramp

**Gate order (P119):** `founding_patriarch_endgame_echo_done` > `founding_patriarch_late_life_done` > `founding_patriarch_payoff_done` > `founding_patriarch_midlife_pressure_done` > on-ramp

Within endgame: endgame branch marker > late-life branch marker > payoff choice marker > on-ramp variant

#### Signal 1: Cost Label（按 endgame branch 分化）

**位置：** `deriveSampleLineCostLabel()` → `founding_patriarch_endgame_echo_done` 分支

| Endgame Branch | Cost Label |
|----------------|------------|
| rule_echo | **开派终局·规** |
| alliance_echo | **开派终局·盟** |
| fallback (endgame done, no branch marker) | 开派终局之累 |

**Gate:** `flags.founding_patriarch_endgame_echo_done` + endgame branch marker

#### Signal 2: Current Goal（按 endgame branch 分化）

**位置:** `orthodoxCurrentGoal()` → `founding_patriarch_endgame_echo_done` 分支

| Endgame Branch | Current Goal |
|----------------|--------------|
| rule_echo | **门规碑立，治学师承交给后来人续** |
| alliance_echo | **盟约碑立，诸派续责交给后来人扛** |
| fallback | 开派名号已定，终局自有终局的定论 |

**Gate:** `flags.founding_patriarch_endgame_echo_done` + endgame branch marker

#### Signal 3: Age-40 Identity（按 endgame branch 分化）

**位置:** `orthodoxAge40Identity()` → `founding_patriarch_endgame_identity_done` 分支

| Endgame Branch | Identity (reference) |
|----------------|---------------------|
| rule_echo | 门规碑上的开宗祖师：书斋封了，门规立了，诸派还照着走。开派名号比人长久，规矩也还在 |
| alliance_echo | 盟约碑上的开宗祖师：山门立了，盟约续了，诸派还记着这笔账。开派名号比人长久，续责也还在 |

**Gate:** `flags.founding_patriarch_endgame_identity_done` + endgame branch marker

On-ramp variant (scholar / alliance) may overlay as P119 bonus.

### 4.2 Expression Priority (updated for P119)

1. `founding_patriarch_endgame_echo_done` > `founding_patriarch_late_life_done` > `founding_patriarch_payoff_done` > `founding_patriarch_midlife_pressure_done` > on-ramp
2. Within endgame: endgame branch marker > late-life branch marker > payoff choice marker > on-ramp variant
3. Generic orthodox fallback

### 4.3 Deferred Expression Updates

| Surface | Defer Reason |
|---------|--------------|
| Full 2×3 pressure×payoff×endgame identity matrix | P119 minimum: 2 late-life branches only |
| Ordinary-origin founding-patriarch endgame expression | P119 optional bonus |
| Life memory / summary | Beyond lightweight boundary |
| Sect inheritance handoff markers | Narrative element only; no marker system |

---

## 5. Continuity Constraints

### 5.1 Late-Life → Endgame

| Constraint | Rule |
|------------|------|
| Branch traceability | Endgame branch marker 必须匹配 late-life branch marker |
| Gate order | `late_life_done` 必须在 endgame 之前 |
| Late-life markers preserved | Endgame 不得清除或覆盖 late-life / pressure markers |
| Narrative continuity | Endgame 文本必须引用 late-life 治理次序晚年 |
| Checkpoint isolation | `founding_patriarch_endgame_echo_done` 独立于 `founding_patriarch_late_life_done` |

### 5.2 Endgame vs Late-Life vs Pressure vs Payoff

| Aspect | Pressure | Payoff | Late-Life | Endgame |
|--------|----------|--------|-----------|---------|
| **阶段定位** | 治理次序期 | 名号定型期 | 后果期、晚年展开 | 终局回响、遗产收官 |
| **核心情绪** | 次序、先稳哪边 | 决断、我是谁 | 沉淀、这个次序带来了什么 | 回响、名号怎么收官 |
| **事件模式** | Choice（2 选项） | Choice（3 选项） | Auto（2 条件分支） | Auto（2 条件分支） |
| **Checkpoint** | `midlife_pressure_done` | `payoff_done` | `late_life_done` | `endgame_echo_done` |
| **Age band** | 40–45 | 48–52 | 52–56 | **60–65** |
| **Branch key** | Pressure markers | Payoff markers | Late-life markers | **Late-life markers** |
| **Stats** | Per choice | Per choice | Per branch | **None** |

---

## 6. Flag Interfaces

### 6.1 Checkpoint Flags

| Flag | Purpose | Set By |
|------|---------|--------|
| `founding_patriarch_endgame_echo_done` | Endgame 检查点 | Any endgame branch |
| `founding_patriarch_endgame_identity_done` | Endgame 身份深化 | Any endgame branch |

### 6.2 Branch-Specific Markers (二选一)

| Marker | Branch |
|--------|--------|
| `founding_patriarch_endgame_rule_echo` | 开派终局·规 (A) |
| `founding_patriarch_endgame_alliance_echo` | 开派终局·盟 (B) |

### 6.3 Upstream Flags (Read-Only)

| Flag | Purpose |
|------|---------|
| `founding_patriarch_late_life_done` | Endgame upstream gate |
| `founding_patriarch_late_rule_keeper` | Branch A key |
| `founding_patriarch_late_alliance_bearer` | Branch B key |
| `founding_patriarch_pressure_rule_first` | Traceability (preserved) |
| `founding_patriarch_pressure_alliance_first` | Traceability (preserved) |

---

## 7. Gate Acceptance (Endgame Checkpoint)

| Checkpoint | Required Flags | Acceptance |
|------------|----------------|------------|
| Endgame closed | `founding_patriarch_endgame_echo_done` | Set by any endgame branch |
| Branch traceability | `founding_patriarch_endgame_*` (one of 2) | Matches late-life branch marker |
| Identity set | `founding_patriarch_endgame_identity_done` | Set alongside endgame_echo_done |
| Upstream satisfied | `founding_patriarch_late_life_done` + one `founding_patriarch_late_*` | Must be true before endgame fires |
| Late-life preserved | `founding_patriarch_late_life_done` remains true | Endgame must not unset |
| No stat changes | No stat_modify in endgame effects | Lightweight constraint |

---

## 8. Sect Inheritance Handoff (Lightweight Boundary)

**Decision: Narrative element only — NOT a marker system.**

| Element | In Contract? | Notes |
|---------|--------------|-------|
| 弟子接掌 / 师承续 | Narrative beat in echo text | Branch A |
| 诸派续签 / 盟约移交 | Narrative beat in echo text | Branch B |
| `sect_inheritance_*` markers | ❌ No | Defer to post-P119 |
| Life memory / summary | ❌ No | Beyond lightweight |

---

## 9. Implementation Notes (For P119)

### 9.1 Event Wiring Path

1. Add `founding_patriarch_endgame_echo_*` auto event(s) to `sample-lines-spine.json`
2. Insert after `founding_patriarch_late_life_*` in spine ordering
3. Configure 2 conditional branches keyed on late-life markers
4. Set checkpoint + branch markers per branch
5. Bump metadata tags: `p118`, `p119`, `auto`, `endgame`

### 9.2 Expression Placement

**文件:** `src/p50/sampleLineExpression.ts`

**函数:** `orthodoxCurrentGoal()`, `deriveSampleLineCostLabel()`, `orthodoxAge40Identity()`

**模式:** 在 `founding_patriarch_endgame_echo_done` / `founding_patriarch_endgame_identity_done` 分支内，先检查 endgame branch marker，再 fallback late-life / payoff / pressure / on-ramp.

---

**P118-005 complete.**
