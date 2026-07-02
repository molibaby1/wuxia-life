# P95 Merchant 16–25 Gap Audit

> **Stage:** P95 Wuxia Merchant 16–25 Operating Pressure Chain  
> **Story:** P95-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02

## 1. Purpose

Document merchant_house anchors across age 16–30 and isolate the **16–25 operating gap** between first shop and mid-twenties business payoff. Distinguish **events exist** from **player feels operating pressure loop**.

---

## 2. Merchant Anchors (Age 16–30)

| Age band | Event ID | Location | Key flags | Player-facing signal |
| -------- | -------- | -------- | --------- | ------------------- |
| 16–22 | `merchant_first_shop` | merchant.json | `merchant_shop_grocery/weapon/herb` | 第一间店铺；currentGoal →「第一桶金已得，店铺经营中」 |
| 17–24 | `merchant_shop_failure` | merchant.json | `merchant_shop_success` / `merchant_shop_failed` | 经营困境；追加投资或关门 |
| 18–26 | `merchant_caravan_guard` | merchant.json | `merchant_caravan_success` | 商队护送；扩张与风险 |
| 20–30 | `merchant_market_monopoly` | merchant.json | `merchant_monopoly` / `merchant_fair_trade` | 垄断或公平竞争 |
| 22–32 | `merchant_official_connection` | merchant.json | official ties | 官府关系 |
| 32–38 | `merchant_midlife_debt_milestone` | sample-lines-spine | `merchant_midlife_debt` | 人情周转代价 |
| 38–42 | `merchant_age40_identity_summary` | sample-lines-spine | `merchant_age40_identity_done` | 四十岁商路身份收束 |

**P94 upstream (feeds 16+):**

| Age band | Event ID | Key flags |
| -------- | -------- | --------- |
| 9–11 | `hvg_merchant_early_opportunity_fork` | `hvg_merchant_ledger_track` / `hvg_merchant_caravan_track` |
| 10–12 | `hvg_merchant_post_fork_confirmation` | `hvg_merchant_post_fork_confirmation_done` |
| 13–15 | `hvg_merchant_first_responsibility_challenge` | `hvg_merchant_first_challenge_done` |

---

## 3. The 16–25 Gap

### What exists after first shop

- `merchant_first_shop` (16–22) opens the shop and sets `merchant_shop_*`
- `merchant_shop_failure` (17–24) and `merchant_caravan_guard` (18–26) exist as downstream anchors
- Generic currentGoal:「第一桶金已得，店铺经营中」for all shop owners

### What is missing (age 16–25)

| Gap | ID | Description |
| --- | -- | ----------- |
| **G-01 Post-shop silence** | GAP-M95-01 | After `merchant_first_shop`, no event confirms the player is *operating* the shop as ledger-type vs caravan-type merchant within 1–3 years |
| **G-02 No operating pressure** | GAP-M95-02 | Age 19–22 has no legible first credit/stockout/market-swing crisis tied to shop operation |
| **G-03 Track flags unread** | GAP-M95-03 | `hvg_merchant_ledger_track` / `hvg_merchant_caravan_track` are not read by `merchant_shop_failure`, `merchant_caravan_guard`, or 16–25 currentGoal |
| **G-04 Flat checkpoint goal** | — | Age 22–25 replay checkpoint stays at generic「店铺经营中」even after P94 track differentiation |

### Timeline visualization

```
Age 16──17────19────22────25────30
  │     │      │      │      │
  shop  failure [GAP]  [GAP]  monopoly
        caravan  │◄─ 16–25 empty band ─►│
```

---

## 4. Events Exist vs Operating Pressure Loop

| Signal | Events exist | Operating pressure loop |
| ------ | ------------ | ----------------------- |
| Flags | `merchant_shop_*`, `merchant_shop_success` | `hvg_merchant_post_shop_rhythm_done`, `hvg_merchant_operating_pressure_done` |
| currentGoal | Generic「店铺经营中」 | Track-specific「守赊欠控库存」/「赌行市吃波动」 |
| Player sentence |「店开了」 |「我知道自己在用账房式/跑货式方式经营，且已经扛过第一次真亏/真赚」 |
| Replay age 22–25 | Same goal for ledger and caravan | Different goal reflecting rhythm + pressure outcome |
| Downstream | `merchant_shop_failure` ignores P94 track | Failure/caravan conditions read P95 chain flags |

**Conclusion:** P94 proved ledger/caravan differentiation in 10–15. P95 targets the **16–25 band** where shop is open but the player narrative goes quiet until midlife debt or caravan/monopoly anchors.

---

## 5. Where P94 Track Flags Are Not Read (16–25)

| Surface | Reads P94 track? | Notes |
| ------- | ---------------- | ----- |
| `merchant_first_shop` | No | Entry milestone only; shop type choice is grocery/weapon/herb |
| `merchant_shop_failure` | No | Condition: shop flag + !success only |
| `merchant_caravan_guard` | No | Condition: shop flag only |
| `merchantCurrentGoal` (shop band) | No | Line 187 returns generic「店铺经营中」before P94 10–15 goals |
| `deriveSampleLineCostLabel` (16–25) | No | Falls through to「商路债务」without shop-operating flavor |
| Replay checkpoint age 22–25 | No | Seed 804 passes with generic operating goal |

---

## 6. Implementation Target (for P95-002+)

1. One post-shop operating rhythm node (age 16–19): `hvg_merchant_post_shop_operating_rhythm`
2. One first operating pressure node (age 19–22): `hvg_merchant_first_operating_pressure`
3. Wire continuity into `merchant_shop_failure` and `merchant_caravan_guard`
4. Player-facing expression in currentGoal / cost label for age 16–25
5. Narrow proof + regression tests

---

## 7. Non-Goals (this audit)

- Full merchant route rewrite
- `merchant_magnate` (Wave 3)
- `merchant_martial_patron` bridge
- New skill system or progression container
- Scholar / orthodox / demonic parallel work
