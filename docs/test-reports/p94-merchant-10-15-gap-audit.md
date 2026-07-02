# P94 Merchant 10–15 Gap Audit

> **Stage:** P94 Wuxia Merchant 10–15 Growth Chain Reinforcement  
> **Story:** P94-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02

## 1. Purpose

Document the merchant_house age 7–22 anchor inventory and isolate the **10–15 gap** between early fork and later talent/shop milestones. Distinguish **route is on** from **player feels continued growth**.

---

## 2. Merchant Anchors (Age 7–22)

| Age band | Event ID | Location | Key flags | Player-facing signal |
| -------- | -------- | -------- | --------- | ------------------- |
| 7–12 | `merchant_childhood_seed_milestone` | sample-lines-spine | `merchant_childhood_seed_done`, `route_merchant` | 营生塑形初现；currentGoal →「营商天赋已显，尚未开张」 |
| 9–11 | `hvg_merchant_early_opportunity_fork` | sample-lines-spine | `hvg_merchant_early_fork_done`, `hvg_merchant_ledger_track` **or** `hvg_merchant_caravan_track` | 账房 vs 认货跑商分岔；stat +1 |
| 8–16 | `merchant_talent_discovery` | merchant.json | `merchant_talent`, `route_merchant` | 经商天赋确认；money/charisma bump |
| 16–22 | `merchant_first_shop` | merchant.json | `merchant_shop_grocery/weapon/herb` | 第一间店铺；currentGoal →「第一桶金已得，店铺经营中」 |
| 38–42 | `merchant_age40_identity_summary` | sample-lines-spine | `merchant_age40_identity_done` | 四十岁商路身份收束 |

**Supporting hooks (pre-7):** preschool merchant spine (`preschool_merchant_*`), infant passive chain, P9 business habit actions (`action_household_errand`, `action_household_apprentice`).

---

## 3. The 10–15 Gap

### What exists before age 10

- Infant + preschool atmosphere (flavor, light stats)
- Age 7–12 **营生塑形确认** via businessHabit ≥ 2
- Age 9–11 **ledger / caravan fork** with track flags and +1 stat

### What exists after age 15

- `merchant_talent_discovery` (8–16) can fire on ledger/caravan track OR charisma/money
- `merchant_first_shop` (16–22) is the next major business milestone

### What is missing (age 10–15)

| Gap | Description |
| --- | ----------- |
| **G-01 Post-fork silence** | After fork at 9–11, no event confirms the player is *becoming* a ledger-type or caravan-type merchant within 1–3 years |
| **G-02 No first pressure** | Age 13–15 has no legible first responsibility / mistake / opportunity node |
| **G-03 Flag-only differentiation** | `hvg_merchant_ledger_track` / `hvg_merchant_caravan_track` satisfy talent gates but produce no readable branch-specific growth text or downstream goal |
| **G-04 Flat checkpoint goal** | Age 13–15 replay checkpoint stays at「营商天赋已显，尚未开张」even after fork + talent |

### Timeline visualization

```
Age 7────9────11────13────15────16────22
  │     │      │      │      │      │
  seed  fork   [GAP]  [GAP]  talent shop
        │◄── 10–15 empty band ──►│
```

---

## 4. Route Is On vs Continued Growth

| Signal | Route is on | Continued growth |
| ------ | ----------- | ---------------- |
| Flags | `route_merchant`, track flags, `merchant_talent` | Branch-specific confirmation + challenge flags |
| currentGoal | Generic「尚未开张」 | Track-specific「守账识风险」/「认货见世面」等 |
| Player sentence |「我知道走商路了」 |「我知道自己在成为哪种商人，且已经担过一次责」 |
| Replay age 13 | Same goal for ledger and caravan | Different goal reflecting branch + challenge outcome |

**Conclusion:** HVG P92-era work proved the merchant loop *can* start (habit → seed → fork). P94 targets the **10–15 band** where fork flags exist but the player narrative goes quiet until talent/shop.

---

## 5. Implementation Target (for P94-002+)

1. One post-fork confirmation (age 10–12): `hvg_merchant_post_fork_confirmation`
2. One first challenge (age 13–15): `hvg_merchant_first_responsibility_challenge`
3. Player-facing expression in currentGoal / cost label
4. Continuity into `merchant_talent_discovery` and `merchant_first_shop` without orphaning either

---

## 6. Non-Goals (this audit)

- Full merchant route rewrite
- Skill system changes
- `merchant_martial_patron` bridge
- Parallel scholar / orthodox / demonic work
