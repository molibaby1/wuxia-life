# P72 Selected Route Entry Sharedness Audit

> **Date:** 2026-06-29
> **Stage:** P72 Wuxia Selected Next Route Entry Differentiation
> **Story:** P72-001 — Audit post-bridge entry sharedness
> **Selected Route:** `jianghu_renown_sage` (江湖名宿, mainstream tier)
> **Origin:** `tavern_hand` (酒肆跑堂, ordinary tier)
> **Bridge:** Ally-Network Midlife Bridge — P71已闭合

---

## 1. Executive Summary

本 audit 审视 `jianghu_renown_sage` 路线在 bridge 后的 entry 层目前有哪些共享的 gate、markers 和 expression，并区分**健康复用**与**导致玩家感知同构的 flattening**。

**核心发现：**
- **Bridge 层（P71）**：已建立差异化 — tavern_hand origin identity 保留，3 个 expression surface 有 renown-specific 分支
- **Entry 层（Bridge 后第一层）**：几乎完全 flatten — 没有 renown sample line spine，没有 renown-specific entry expression，没有 renown 专属的 cost/identity marker
- **目标 gate 层**：`jianghu_renown_sage` composite gate 是共享的（接受 mentor_bond 或 ally_network），不区分路径来源

**Flattening 风险等级：高** — 玩家跨过 bridge 后，立即进入"无差异化地带"，除了 origin summary 外，感受不到 renown 路线的独特身份。

---

## 2. Post-Bridge Entry Layer Definition

为了本 audit 的目的，**post-bridge entry 层**定义为：

> 从 `tavern_renown_bridge_crossed` 被设置（age 29）开始，到 `jianghu_renown_sage` composite gate 被评估（通常 age 40+）之间的所有玩家可见层。

包含：
1. Expression surfaces（currentGoal, lifeMemory, summary, costLabel, age40Identity 等）
2. Sample line spine events（如果有）
3. Markers / flags（route commitment flags, done flags 等）
4. Gate wiring（下游 gates 如何接受 bridge 身份）

---

## 3. Current State Inventory

### 3.1 Bridge Layer (P71 — Done)

| Layer | Item | Status | Differentiated? |
|-------|------|--------|-----------------|
| Bridge event | `ordinary_tavern_midlife_renown_bridge` (age 29) | ✅ Exists | ✅ Renown-specific |
| Bridge checkpoint | `tavern_renown_bridge_crossed` | ✅ Exists | ✅ Renown-specific |
| Route commitment | `route_renown_committed` | ✅ Exists | ✅ Renown-specific |
| Origin identity preservation | `detectOrdinaryOrigin()` returns `tavern_hand` | ✅ Verified | ✅ Preserved |
| Current goal expression | `tavernCurrentGoal()` renown branch | ✅ Exists | ✅ Differentiated |
| Life memory expression | `tavernLifeMemory()` renown branch | ✅ Exists | ✅ Differentiated |
| Summary expression | `deriveOrdinaryOriginSummary()` renown branch | ✅ Exists | ✅ Differentiated |

### 3.2 Entry Layer (Post-Bridge — Gap)

| Layer | Item | Status | Differentiated? |
|-------|------|--------|-----------------|
| Sample line spine | Renown on-ramp / pressure / payoff events | ❌ None | N/A — no spine |
| Sample line detection | `detectSampleLine()` recognizes renown | ❌ No | Only orthodox/demonic/merchant |
| Current goal (sample line) | Renown-specific currentGoal | ❌ None | N/A — no sample line |
| Cost label | Renown-specific costLabel | ❌ None | N/A — no sample line |
| Age 40 identity | Renown-specific age40Identity | ❌ None | N/A — no sample line |
| Life memory summary integration | `deriveLifeMemorySummary` renown branch | ❌ Generic | Falls through to generic |
| Main screen route row | Renown-specific route label | ❌ None | N/A — no sample line |

### 3.3 Target Gate Layer

| Layer | Item | Status | Differentiated? |
|-------|------|--------|-----------------|
| Composite gate | `jianghu_renown_sage` in `wuxiaOriginSurfaces.ts` | ✅ Exists | ⚠️ Shared — accepts both mentor_bond and ally_network |
| Gate stat requirements | skill_growth ≥45, reputation ≥65, social_capital ≥55 | ✅ Exists | Generic — same for all paths |
| Gate key_choices | anyOf: ['mentor_bond', 'ally_network'] | ✅ Exists | Shared — multiple paths satisfy |

---

## 4. Healthy Reuse vs Flattening

### 4.1 Healthy Reuse (OK to keep shared)

以下共享是健康的，不构成 identity flattening：

| Item | Why it's healthy |
|------|------------------|
| `jianghu_renown_sage` composite gate definition | The destination *is* shared — multiple paths can reach the same outcome. The gate itself should be a single definition. |
| Stat threshold requirements | Stats are universal measures; reaching renown through different paths should still require the same stat bar. |
| `ally_network` flag as key_choices satisfier | This is the bridge seed — it's correct that it satisfies the gate. The differentiation is in *how* you got there, not *whether* you qualify. |
| `detectOrdinaryOrigin()` preserving tavern_hand | Origin identity is correctly preserved; the renown route is a *path* on top of the origin, not a replacement. |

### 4.2 Problematic Flattening (Needs fixing in P72+)

以下共享导致玩家感知同构，是 entry differentiation 需要解决的：

| Item | Flattening Risk | Why it matters |
|------|-----------------|----------------|
| **No renown sample line spine** | 🔴 High | After crossing the bridge, there are no renown-specific events. The player goes from "I just became jianghu renown" back to generic habit-led narrative. |
| **`detectSampleLine()` doesn't recognize renown** | 🔴 High | The sample line expression system (currentGoal, costLabel, age40Identity) has zero renown branches. Players on the renown path get... nothing from this system. |
| **No renown cost label** | 🔴 High | Merchant has "巨贾负担" as a cost signal; renown has nothing. Players can't feel the "cost of reputation." |
| **No renown age-40 identity** | 🔴 High | At age 40, orthodox/demonic/merchant all have identity-defining moments; renown has none. |
| **Generic life memory summary after bridge** | 🟡 Medium | The ordinary origin summary covers the bridge moment, but there's no renown-specific deepening after that. |
| **No entry flavor differentiation vs generic renown** | 🔴 High | A player who reaches renown via tavern_ally_network vs mentor_bond vs pure stat grind all look the same at the gate. There's no "tavern-born renown sage" flavor. |

---

## 5. Comparison with Merchant Trilogy Pattern

For reference, here's how the merchant trilogy handles entry differentiation (P63):

| Layer | Merchant Trilogy (P63) | Renown (Current) | Gap |
|-------|------------------------|------------------|-----|
| `detectSampleLine()` | Recognizes all 3 bridge flags | ❌ No renown | Recognize renown |
| `currentGoal` at on_ramp | 3 distinct origin-specific texts | ❌ None | Add renown currentGoal |
| `costLabel` at on_ramp | 3 distinct origin-specific labels | ❌ None | Add renown costLabel |
| `age40Identity` | 3 distinct origin-specific identities | ❌ None | Add renown age40Identity |
| Spine events | Shared magnate_on_ramp event (P55) | ❌ No renown spine | Need renown spine first |
| Shared skeleton | Magnate chain skeleton is shared | N/A — no skeleton | Skeleton is shared, expression is differentiated |

**Key insight:** Merchant trilogy has a *shared skeleton* (magnate chain) with *differentiated expression* on top. Renown doesn't even have the skeleton yet — but P72 is only about entry differentiation, not building the full spine.

---

## 6. P72 Target: Bounded Entry Differentiation

Given P72's scope constraint (entry-only, no full spine), here's what we can realistically differentiate:

### 6.1 What P72 Can Do (Bounded)

1. **Extend `detectSampleLine()`** to recognize renown route flags
2. **Add renown currentGoal** in sampleLineExpression.ts — "凭人脉声名在江湖立足"
3. **Add renown costLabel** — "江湖声名之累" or "人脉维系之重"
4. **Add renown age40Identity** — "你是从酒肆走来的江湖名宿..."
5. **Extend `deriveLifeMemorySummary`** with renown-specific route status
6. **Differentiate tavern-born renown from generic renown** — keep the tavern origin flavor

### 6.2 What P72 Should NOT Do (Deferred)

1. Build full renown sample line spine (on_ramp/pressure/payoff events)
2. Add new event IDs or choice structures
3. Build a renown route framework
4. Add pressure/payoff differentiation
5. Full stat threshold verification

---

## 7. Primary Flattening Points (Ranked)

Ranked by player-perceived identity loss:

| Rank | Flattening Point | Player Impact | P72 Addressable? |
|------|------------------|---------------|------------------|
| 1 | No renown recognition in sample line expression | 🔴 High — entire expression system ignores renown | ✅ Yes — add detection + expression branches |
| 2 | No cost label for renown path | 🔴 High — no "cost" signal differentiates renown | ✅ Yes — add costLabel |
| 3 | No age-40 identity for renown | 🔴 High — midlife identity milestone missing | ✅ Yes — add age40Identity |
| 4 | No entry flavor vs generic renown | 🟡 Medium — can't tell tavern-born from mentor-born | ✅ Yes — origin-aware expression |
| 5 | No renown-specific spine events | 🔴 High — no narrative content after bridge | ❌ No — P73+ scope |
| 6 | Generic composite gate evaluation | 🟢 Low — gate is correctly shared | ❌ No — by design |

---

## 8. Audit Conclusion

**Verdict:** Entry layer flattening is significant but addressable within P72's bounded scope.

The bridge (P71) establishes the renown path with clear identity markers. But immediately after crossing, the player falls into a "differentiation gap" where the main expression systems (sample line expression, cost label, age-40 identity) don't recognize renown at all.

**P72 opportunity:**
- We don't need to build a full renown spine to add entry differentiation
- We can follow the P63 merchant pattern: recognize renown in `detectSampleLine()`, add expression branches for currentGoal/costLabel/age40Identity
- We can make tavern-born renown feel distinct from (future) mentor-born renown
- This is bounded, low-risk, high-impact

**Recommendation:** Proceed with P72 scope — add entry-level expression differentiation through existing carriers (sampleLineExpression.ts, lifeMemorySummary), without building new event infrastructure or a full renown spine.

---

**P72-001 complete.** Sharedness audit saved.
