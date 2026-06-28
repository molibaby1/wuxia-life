# P72 Jianghu Renown Sage Entry Differentiation Contract

> **Stage:** P72 Wuxia Selected Next Route Entry Differentiation
> **Story:** P72-003 — Define entry differentiation contract
> **Route:** `jianghu_renown_sage` (江湖名宿, mainstream tier)
> **Origin:** `tavern_hand` (酒肆跑堂, ordinary tier)
> **Bridge:** Ally-Network Midlife Bridge (P71 — done)

---

## 1. Core Identity Signals

The following core identity signals **must be preserved** at the entry layer for the tavern-born jianghu_renown_sage path. These signals distinguish it from:
1. Generic renown (mentor-bond path, pure stat-grind path)
2. Merchant magnate path (the other tavern_hand bridge)
3. Generic ordinary origin (no bridge crossed)

### 1.1 Non-Negotiable Identity Signals

| Signal | Carrier | Must Read As |
|--------|---------|--------------|
| **Tavern origin preserved** | Origin detection + summary | "酒肆出身的江湖人物" not "江湖名宿" |
| **Network/reputation path** | Current goal + life memory | "人脉和名声" not "武功高强" |
| **Social entry, not martial** | Cost label + identity | "声名之累" not "修炼之苦" |
| **Bridge checkpoint visible** | Expression priority | Renown bridge beats merchant beats midlife |

### 1.2 Identity Principle

> The player is a **tavern hand who became jianghu renown through their network**, not a generic jianghu renown person who happened to be a tavern hand once.

The tavern_hand origin identity is **never erased**. The renown path is a **layer on top** of the origin, not a replacement.

---

## 2. Expression vs Light Markers

### 2.1 Expression Differences (Player-Facing Text)

These are the **player-readable** differentiation signals. They go in `sampleLineExpression.ts` and `deriveLifeMemorySummary.ts`.

| # | Signal | Surface | Text Direction |
|---|--------|---------|----------------|
| 1 | **Renown currentGoal** | `deriveSampleLineCurrentGoal()` | "凭人脉声名在江湖立足，常有人来寻你引荐主事" |
| 2 | **Renown costLabel** | `deriveSampleLineCostLabel()` | "江湖声名之累" |
| 3 | **Renown age40Identity** | `deriveSampleLineAge40Identity()` | "你是从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量" |
| 4 | **Route status in life summary** | `deriveLifeMemorySummary()` | routeStatus shows renown path, not generic |

### 2.2 Light Markers (Flags / Detection)

These are the **structural** markers that enable expression differentiation. They are not player-visible directly but drive the expression system.

| Marker | Purpose | Source |
|--------|---------|--------|
| `tavern_renown_bridge_crossed` | Bridge checkpoint — primary detection flag | P71 bridge event, `embrace_renown` choice |
| `route_renown_committed` | Route-level commitment flag | P71 bridge event, `embrace_renown` choice |
| `ally_network` | Pre-bridge seed + key_choices satisfier | Childhood `ordinary_tavern_network_fork` → `track_guests` |
| `origin_tavern_hand` | Origin identity preservation | Origin selection |

### 2.3 What's NOT a Marker (Don't Add)

- ❌ No new event IDs
- ❌ No new choice structures
- ❌ No new flag systems
- ❌ No `renown_on_ramp_done` or similar milestone flags (P73+ scope)
- ❌ No renown-specific habit pools

---

## 3. Detection Contract

### 3.1 `detectSampleLine()` Renown Recognition

`detectSampleLine()` must recognize the renown route and return `'renown'` (adding to the `SampleLineId` type).

**Detection priority:**
1. Renown bridge flags (`tavern_renown_bridge_crossed` or `route_renown_committed`)
2. Then orthodox / demonic / merchant (existing order)

**Rationale:** The bridge checkpoint is the strongest signal. If a player has crossed the renown bridge, they are on the renown path — even if they also have merchant seed flags (mutual exclusivity is enforced by `ordinary_tavern_midlife_done`, but detection should still be robust).

### 3.2 Mutual Exclusivity Note

The P71 bridge already enforces mutual exclusivity with the merchant bridge via `ordinary_tavern_midlife_done`. Detection does NOT need to re-implement this — but it should prefer renown when both flags are somehow present.

---

## 4. Expression Surfaces (Detailed)

### 4.1 Current Goal

**Function:** `deriveSampleLineCurrentGoal()` → `renownCurrentGoal()`

**Priority order (highest first):**
1. (Future) Renown payoff done
2. (Future) Renown pressure visible
3. **Renown bridge crossed** — "凭人脉声名在江湖立足，常有人来寻你引荐主事"
4. Fallback — "积累声名，拓展人脉"

**Tavern-born flavor:** The text should emphasize network/reputation/introductions, not martial skill or sect membership.

### 4.2 Cost Label

**Function:** `deriveSampleLineCostLabel()`

**Renown label:** "江湖声名之累"

**Why this label:**
- Distinct from merchant: "巨贾负担" (wealth burden) vs "声名之累" (reputation burden)
- Distinct from orthodox: "守正代价" vs "声名之累"
- Captures the social obligation / reputation pressure that comes with being known
- Fits the tavern-born flavor: you're known because of people, not because you defeated someone

### 4.3 Age-40 Identity

**Function:** `deriveSampleLineAge40Identity()`

**Renown identity (tavern-born):**
> "你是从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量。"

**What makes it tavern-born:**
- "从酒肆走来" — explicit origin reference
- "人脉为基" — network as foundation (not martial skill)
- "引荐为径" — introductions as the path (not combat)
- "人情往来的重量" — the cost is social, not physical

**Pattern match:** Mirrors the merchant trilogy's P63 pattern where each bridge origin gets its own age-40 identity text.

### 4.4 Life Memory Summary Integration

`deriveLifeMemorySummary.ts` should show renown route status when `tavern_renown_bridge_crossed` is set.

**Route status label:** "江湖名宿之路" (or similar — implementation can refine)

---

## 5. Shared Destination Skeleton (Intact)

The following are **shared skeleton** and must NOT be modified by P72:

| Skeleton Item | Status | Rationale |
|---------------|--------|-----------|
| `jianghu_renown_sage` composite gate definition | 🔒 Shared | The destination is shared; multiple paths reach it |
| Stat threshold requirements | 🔒 Shared | Stats are universal measures |
| `ally_network` as key_choices satisfier | 🔒 Shared | Correct that both mentor-bond and ally-network satisfy |
| P71 bridge event and flags | 🔒 Reuse | P72 builds on P71, doesn't rewrite it |

P72 only adds **expression-layer differentiation** on top of the shared skeleton. It does not modify the skeleton itself.

---

## 6. Differentiation vs Generic Renown

How the tavern-born entry differs from a hypothetical generic / mentor-born renown entry:

| Dimension | Tavern-Born Renown (P72) | Generic / Mentor-Born Renown (Future) |
|-----------|--------------------------|---------------------------------------|
| Entry flavor | Network / reputation / introductions | Martial / mentorship / skill |
| Cost feel | Social obligation / reputation pressure | Physical injury / rival grudges |
| Origin reference | "从酒肆走来" | "从师门走来" or generic |
| Core strength leveraged | Social capital / connections | Martial skill / combat prowess |
| Bridge flag | `tavern_renown_bridge_crossed` | `mentor_bond_bridge_crossed` (TBD) |

P72 only implements the **tavern-born** variant. The structure should be extensible to future renown bridges (mentor-bond, etc.) but only the tavern variant is built now.

---

## 7. Acceptance Criteria for P72-004/005 Implementation

The implementation stories (P72-004, P72-005) must satisfy:

1. ✅ `detectSampleLine()` recognizes renown and returns `'renown'`
2. ✅ `SampleLineId` type includes `'renown'`
3. ✅ Renown currentGoal is distinct from merchant/orthodox/demonic
4. ✅ Renown costLabel is distinct from merchant/orthodox/demonic
5. ✅ Renown age40Identity has tavern-born flavor
6. ✅ `tavern_renown_bridge_crossed` is the primary detection flag
7. ✅ No new event IDs, no new flag systems
8. ✅ P71 bridge tests continue passing
9. ✅ Shared destination skeleton unchanged

---

**P72-003 complete.** Entry differentiation contract saved.
