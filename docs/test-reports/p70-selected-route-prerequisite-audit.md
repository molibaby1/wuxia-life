# P70 Selected Route Prerequisite Audit

> **Date:** 2026-06-29
> **Stage:** P70 Wuxia Selected Next Route Design-First Contract
> **Story:** P70-001 — Audit Selected Route Prerequisites
> **Selected Route:** `jianghu_renown_sage` (江湖名宿)
> **Input from:** `docs/test-reports/p69-next-route-candidate-closure-report.md` (jianghu_renown_sage selected)
> **Purpose:** Audit existing jianghu_renown_sage assets — origins, flags, gates, expressions, tests — so P70 starts from real gating surfaces rather than assumptions.

---

## 1. Executive Summary

`jianghu_renown_sage` is a mainstream-tier composite destiny outcome with a strong evidence foundation from P25 (ordinary wiring) and P32 (short-chain proof). The route has:

- **One verified ordinary-origin seed:** `tavern_hand` → `ally_network` (from childhood fork)
- **One verified event-driven short chain:** `p28_social_reputation_reinforcement` → `ally_network` → composite eval
- **A working composite gate:** `wuxiaOriginSurfaces.ts` — requires skill_growth≥45, reputation≥65, social_capital≥55, and key_choices (mentor_bond or ally_network)
- **Existing midlife events for tavern_hand:** guest-regulars and ally-referral midlife events (P56)
- **Existing expression framework:** `ordinaryOriginExpression.ts` with tavern_hand branches

**Core gap:** `jianghu_renown_sage` has no **playable bridge** from any ordinary origin. The `ally_network` flag exists but it's seeded from childhood or habit-led sim events, not from a midlife "cross the bridge" event chain. There's also no sample-line spine for renown (no equivalent of the P55 merchant magnate on_ramp → pressure → payoff sequence).

---

## 2. Gate Truth Surface

### 2.1 Composite Gate Definition

**Source:** `src/narrative/profile/wuxiaOriginSurfaces.ts`

| Field | Value |
|-------|-------|
| **Outcome ID** | `jianghu_renown_sage` |
| **Label** | 江湖名宿 |
| **Tier** | mainstream (mid-tier) |
| **Require all?** | Yes |

**Requirements (all must be met):**

| Dimension | Threshold | Type |
|-----------|-----------|------|
| `skill_growth` | ≥ 45 | stat |
| `reputation` | ≥ 65 | stat |
| `social_capital` | ≥ 55 | stat |
| `key_choices` | any of `['mentor_bond', 'ally_network']` | flag |

### 2.2 Coexistence / Mutex

- **Coexists with:** `merchant_magnate`, `sect_leader_statesman`
- **Mutex with:** `lone_sword_legend`

---

## 3. Ordinary-Origin Inventory

### 3.1 Tavern Hand (Strongest Baseline)

**Origin ID:** `tavern_hand`

#### 3.1.1 Early-Life Flag Chain (Ages 9–13)

**Source:** `ordinary-origin-early-life.json` — `ordinary_tavern_network_fork`

| Choice Path | Flags Set | Notes |
|------------|-----------|-------|
| 学跑堂 (master_service) | `tavern_service_committed`, `ordinary_tavern_midlife_seed` | Service-committed path |
| 记客人 (track_guests) | `tavern_guest_network`, `ally_network` | Network path — **sets ally_network directly in childhood** |

**Key insight:** `ally_network` is set as early as age 9–13 from the tavern_hand childhood fork. This is a seed, not a bridge — it's a childhood preference, not a midlife career crossing.

#### 3.1.2 Midlife Events (Ages 25–27)

**Source:** `ordinary-origin-midlife.json`

| Event ID | Age | Condition | Bridge Relevance |
|----------|-----|-----------|------------------|
| `ordinary_tavern_midlife_guest_regulars` | 25 | `tavern_guest_network && !ordinary_tavern_midlife_done` | Deepens network but stays in tavern context |
| `ordinary_tavern_midlife_ally_referral` | 27 | `ally_network && !ordinary_tavern_midlife_done` | **Merchant bridge** — take_referral sets `route_wealth_committed` + `tavern_merchant_bridge_crossed` |

**Key insight:** The existing `ally_referral` event targets `merchant_magnate`, not `jianghu_renown_sage`. The `ally_network` flag that satisfies the renown gate is already set from childhood — the midlife event is a merchant bridge, not a renown bridge.

#### 3.1.3 Baseline Fixture

**Source:** `src/p25/ordinarySimulationBaselines.ts` — `ordinary_tavern_renown_path`

```
id: ordinary_tavern_renown_path
label: 跑堂→江湖名宿
originId: tavern_hand
age: 42
stats: martialPower 42, reputation 66, connections 62, money 40
flags: ally_network, tavern_guest_network, ordinary_tavern_midlife_seed
summarySignals: ['酒肆', '人脉']
```

This is a fixture-level baseline, not a playable event chain.

### 3.2 Farm Peasant (Theoretical Only)

**Source:** P60 farm-peasant gap audit + P25 wiring evidence mention

- **Theoretical path:** `mentor_bond` key_choice could feed jianghu_renown_sage
- **Status:** No concrete bridge seed exists — P60 explicitly deferred the escort/jianghu direction
- **Not in scope for P70:** P70 focuses on the tavern_hand seed that already exists

### 3.3 Town Apprentice (No Wiring)

- No documented path to jianghu_renown_sage
- Apprentice's existing bridge targets `merchant_magnate` (P58)

---

## 4. Existing Expression Surfaces

**Source:** `src/p56/ordinaryOriginExpression.ts`

### 4.1 Current Goal (tavernCurrentGoal)

| State | Text |
|-------|------|
| `tavern_merchant_bridge_crossed` | 城里铺子已上手，酒肆人脉铺出了商路 |
| `tavern_midlife_guest_regulars` | 常客认得你了，镇上有了些人脉 |
| `tavern_midlife_ally_referral` | 有人引荐你去城里的铺子 |
| `tavern_guest_network` | 记客人认脸，积累人脉 / 帮账房记流水，认得些客人 |
| `tavern_service_committed` | 跑堂规矩已熟，酒肆里的活都拿手 / 学跑堂规矩，手脚利索 |
| `ally_network` | 有几位熟客成了朋友 |

### 4.2 Life Memory (tavernLifeMemory)

| State | Text |
|-------|------|
| `tavern_merchant_bridge_crossed` | 你靠着酒肆积累的人脉进了城里的铺子，从跑堂伙计踏上了商路。 |
| `tavern_midlife_guest_regulars` + `tavern_embrace_network` | 你经营人脉，常客成了朋友，镇上有了些门路。 |
| `tavern_midlife_guest_regulars` + `tavern_keep_distance` | 你和常客保持距离，不愿太深入江湖事。 |
| `tavern_midlife_ally_referral` + `tavern_take_referral` | 你接受了引荐，去城里的铺子试试。 |
| `tavern_midlife_ally_referral` + `tavern_decline_referral` | 你婉拒了引荐，选择留在酒肆。 |
| `tavern_guest_network` | 你帮账房记流水，认得了不少江湖客人。 |
| `tavern_service_committed` | 你专心学跑堂规矩，手脚麻利。 |
| `ally_network` | 有几位熟客成了朋友。 |

### 4.3 What's Missing for Renown

- **No renown-specific bridge text** — all bridge text is merchant-oriented
- **No "crossed into jianghu renown" identity** — expression stops at "有几位熟客成了朋友" for ally_network
- **No renown summary signals** — baseline fixture has `['酒肆', '人脉']` but no renown-specific summary

---

## 5. Existing Tests and Proofs

### 5.1 P32 Short-Chain Proof

**Source:** `src/p25/p32HabitLedShortChainSlice.ts` + `docs/test-reports/p32-renown-short-chain-slice.md`

**What it proves:**
- `p28_social_reputation_reinforcement` event → `attend_banquet` choice → sets `ally_network` flag
- `ally_network` satisfies the `key_choices` dimension of the composite gate
- With stats at threshold (martialPower 50, reputation 70, connections 60), jianghu_renown_sage unlocks
- Uses event-driven JSON flag_set path, not static resolver
- Origin: `scholar_house` (vivid tier, not ordinary)

**Limitations:**
- Origin is scholar_house (vivid), not tavern_hand (ordinary)
- It's a habit-led sim slice, not a playable event chain from birth
- No midlife bridge event — the ally_network flag comes from a habit event

### 5.2 P25 Ordinary Wiring Baseline

**Source:** `src/p25/ordinarySimulationBaselines.ts`

**What it proves:**
- Fixture-level verification that tavern_hand + ally_network + threshold stats = renown path
- Baseline stats and flag state are documented

**Limitations:**
- Fixture-seeded, not event-driven
- No "how you get there" narrative chain

### 5.3 Runtime Parity Tests

**Source:** `tests/p32RuntimeParityTests.ts`

- Covers renown bridge at threshold parity
- Verifies composite evaluation matches expected outcomes

---

## 6. What Exists vs What's Missing

### 6.1 What Already Exists (Before Bridge)

| Category | Status | Details |
|----------|--------|---------|
| **Composite gate** | ✅ Complete | `jianghu_renown_sage` in `wuxiaOriginSurfaces.ts` with 4 requirements |
| **Key-choice flag (ally_network)** | ✅ Exists | Set from tavern_hand childhood fork + P28 habit event |
| **Key-choice flag (mentor_bond)** | ⚠️ Exists but not ordinary-seeded | Defined in gate but no ordinary-origin path sets it |
| **Tavern_hand origin** | ✅ Complete | Early-life fork, midlife events, expression all exist |
| **Expression framework** | ✅ Complete | `ordinaryOriginExpression.ts` pattern proven |
| **Short-chain proof** | ✅ Exists (P32) | Event-driven unlock from habit-led sim |
| **Ordinary baseline fixture** | ✅ Exists (P25) | `ordinary_tavern_renown_path` |
| **Runtime parity tests** | ✅ Exists (P32) | Renown bridge parity covered |

### 6.2 What's Missing (For a Playable Bridge)

| Category | Status | Gap Description |
|----------|--------|-----------------|
| **Playable bridge event** | ❌ Missing | No midlife "cross into jianghu renown" event for tavern_hand |
| **Bridge commitment flag** | ❌ Missing | No `tavern_renown_bridge_crossed` equivalent |
| **Route committed flag** | ❌ Missing | No `route_renown_committed` equivalent |
| **Renown expression text** | ❌ Missing | No post-bridge identity text for renown path |
| **Sample-line spine** | ❌ Missing | No on_ramp → pressure → payoff sequence for renown |
| **Post-bridge progression** | ❌ Missing | No content after the bridge — just gate unlock |
| **Origin differentiation** | ❌ Missing | No tavern_hand-flavored entry into renown path |

---

## 7. Bridge Distance Assessment

How far is `jianghu_renown_sage` from a playable bridge from `tavern_hand`?

| Step | Status | Effort |
|------|--------|--------|
| 1. Add bridge-crossing midlife event | ❌ Not started | Small — 1 new event with 2 choices (accept / decline) |
| 2. Add bridge flags | ❌ Not started | Tiny — 2 new flags |
| 3. Add expression branches | ❌ Not started | Small — 3 surfaces × renown bridge branch |
| 4. Add sample-line spine (post-bridge) | ❌ Not started | Medium — 3 spine events (on_ramp / pressure / payoff) |
| 5. Add tests | ❌ Not started | Small-medium — targeted proof + regression tests |

**Overall bridge distance:** **Close** — the seed (ally_network) and gate both exist. The gap is a midlife bridge event + post-bridge spine + expression. This is comparable to where farm_peasant was before P60, but with a stronger existing seed.

---

## 8. Audit Conclusion

`jianghu_renown_sage` has a **strong foundation** for a playable bridge from `tavern_hand`:

1. The composite gate is complete and verified
2. The `ally_network` key-choice flag already exists and is set from tavern_hand childhood
3. The short-chain proof pattern is validated (P32)
4. The expression framework is in place

The gap is **not feasibility** — it's **playability**. The route is reachable in fixtures and habit-led sim, but there's no event-driven "cross the bridge" narrative from an ordinary origin, and no post-bridge progression content.

This makes `jianghu_renown_sage` an excellent candidate for the merchant trilogy methodology replication:
- Single-seed bridge (simple, low risk)
- Strong existing foundation
- Clear gap (playable bridge + spine, not "does this even work?")
- Tests methodology generality (mainstream tier, not mixed)

---

**P70-001 complete.** Prerequisite audit saved.
