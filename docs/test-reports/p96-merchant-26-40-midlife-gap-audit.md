# P96 Merchant 26–40 Midlife Gap Audit

> **Stage:** P96 Wuxia Merchant 26–40 Midlife Expansion Identity  
> **Story:** P96-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02

## 1. Purpose

Document merchant_house anchors across age 25–45 and isolate the **26–40 midlife identity gap** between P95 operating pressure and age-40 identity. Distinguish **events exist** from **player feels continuous midlife identity**.

---

## 2. Merchant Anchors (Age 25–45)

| Age band | Event ID | Location | Key flags | Player-facing signal |
| -------- | -------- | -------- | --------- | ------------------- |
| 20–30 | `merchant_market_monopoly` | merchant.json | `merchant_monopoly` / `merchant_fair_trade` | 垄断或公平竞争 |
| 22–32 | `merchant_official_connection` | merchant.json | official ties | 官府关系 |
| 28–32 | `magnate_on_ramp` | sample-lines-spine | `magnate_on_ramp_done` | 巨贾门槛（本阶段不进入） |
| 32–38 | `merchant_midlife_debt_milestone` | sample-lines-spine | `merchant_midlife_debt` | 人情周转代价 |
| 38–42 | `merchant_age40_identity_summary` | sample-lines-spine | `merchant_age40_identity_done` | 四十岁商路身份收束 |
| 44–48 | `merchant_age45_expansion_fork` | sample-lines-spine | `merchant_age45_expansion_fork_done` | 扩张分岔 payoff |

**P95 upstream (feeds 26+):**

| Age band | Event ID | Key flags |
| -------- | -------- | --------- |
| 16–19 | `hvg_merchant_post_shop_operating_rhythm` | `hvg_merchant_post_shop_rhythm_done`, rhythm sub-flags |
| 19–22 | `hvg_merchant_first_operating_pressure` | `hvg_merchant_operating_pressure_done`, pressure sub-flags |
| 10–15 | P94 growth chain | `hvg_merchant_ledger_track` / `hvg_merchant_caravan_track` |

---

## 3. The 26–40 Gap

### What exists after P95 operating pressure

- P95 chain completes by age 22–25 with ledger/caravan differentiated rhythm + pressure
- `merchant_midlife_debt_milestone` (32–38) and `merchant_age40_identity_summary` (38–42) exist as spine anchors
- `merchantAge40Identity()` returns generic「靠经营立足的商路中人」for non-magnate, non-debt merchants
- Age 25–32 currentGoal reverts to operating-pressure goals without midlife expansion framing

### What is missing (age 26–40)

| Gap | ID | Description |
| --- | -- | ----------- |
| **G-01 Expansion silence** | GAP-M96-01 | After P95 operating pressure, no event confirms the player is *scaling* the business differently as ledger vs caravan within 26–30 |
| **G-02 Spine flags unread** | GAP-M96-02 | `merchant_midlife_debt_milestone` and `merchant_age40_identity_summary` do not read P95 track or operating flags |
| **G-03 Flat age-40 identity** | GAP-M96-03 | `merchantAge40Identity()` does not distinguish ledger vs caravan operating personality |
| **G-04 Checkpoint goal gap** | GAP-M96-04 | Age 26–40 replay checkpoint stays on P95 operating goals; no expansion-rhythm or midlife identity voice |

### Timeline visualization

```
Age 25──26────30────32────38────40────45
  │      │      │      │      │      │
  P95    [GAP]  [GAP]  debt   age40  fork
  done   │◄─ 26–40 identity empty band ─►│
```

---

## 4. Events Exist vs Continuous Midlife Identity

| Signal | Events exist | Continuous midlife identity |
| ------ | ------------ | --------------------------- |
| Flags | `merchant_midlife_debt`, `merchant_age40_identity_done` | `hvg_merchant_expansion_rhythm_done`, track-specific expansion sub-flags |
| currentGoal | P95 operating goals through age 25 | Track-specific expansion + midlife debt framing at 32–40 |
| Player sentence |「扛过第一次经营压力」 |「我知道自己在用账房式/跑货式方式扩张，且中年身份承接了早年选择」 |
| Replay age 32–40 | Same debt/identity text for ledger and caravan | Different goal/identity reflecting operating track |
| Downstream | `merchant_age45_expansion_fork` fires generically | Fork framing reads upstream expansion/operating chain |

**Conclusion:** P95 proved ledger/caravan differentiation in 16–25. P96 targets the **26–40 band** where operating personality goes quiet until generic midlife debt or age-40 identity.

---

## 5. Where P95 Flags Are Not Read (26–40)

| Surface | Reads P95 track? | Notes |
| ------- | ---------------- | ----- |
| `merchant_midlife_debt_milestone` | No | Condition: shop/bridge flags only; static「人情周转」text |
| `merchant_age40_identity_summary` | No | Auto event; static generic text |
| `merchantAge40Identity()` | No | Returns generic merchant text unless magnate/debt/failed |
| `merchant_age45_expansion_fork` | No | Static「扩张分岔」text; no upstream track read |
| `merchantCurrentGoal` (26–40) | Partial | P95 operating goals through ~25; no expansion-rhythm layer |
| `deriveSampleLineCostLabel` (26–40) | Partial | P95 labels through operating band; no midlife expansion cost |
| Replay checkpoint age 32–40 | No | Seed 804 passes with generic debt/identity expression |

---

## 6. Implementation Target (for P96-002+)

1. One mid-20s expansion rhythm node (age 26–30): `hvg_merchant_midlife_expansion_rhythm`
2. Wire P95/P96 continuity into `merchant_midlife_debt_milestone` and/or `merchant_age40_identity_summary`
3. Strengthen `merchantAge40Identity()` with ledger vs caravan branches
4. Player-facing expression in currentGoal / cost label for age 26–40
5. Narrow proof + regression tests
6. Continuity into `merchant_age45_expansion_fork` expression path

---

## 7. Non-Goals (this audit)

- Full merchant route rewrite
- `merchant_magnate` (Wave 3) on-ramp implementation
- `merchant_martial_patron` bridge
- New skill system or progression container
- Scholar / orthodox / demonic parallel work
