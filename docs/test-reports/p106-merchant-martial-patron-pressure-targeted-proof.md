# P106 Merchant Martial Patron Pressure Targeted Proof

> **Stage:** P106 Patron Pressure Playable Implementation
> **Date:** 2026-07-02
> **Contract:** `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`

## Purpose

Bounded proof that `merchant_patron_midlife_pressure` fires correctly on **native** and **bridge-origin (apprentice)** paths, showing the 5 core P0 nodes without full lifetime exhaust.

---

## Path A — Native Orthodox (wealth + invest)

| Node | Age | State | Evidence |
| ---- | --- | ----- | -------- |
| **5. Pre-pressure state** | 38 | `merchant_patron_on_ramp_done` + `merchant_patron_on_ramp_orthodox`; `midlife_pressure_done` = false | cost = `侠义盟约之累`; goal = `银钱换侠义盟约，正把手中的商路与门派的剑绑在同一条绳上` |
| **6. Pressure event fires** | 40–44 | Gate: `on_ramp_done` + `!midlife_pressure_done` + `!payoff_done` + age 40–44 | `merchant_patron_midlife_pressure` eligible; choice type |
| **7. Checkpoint set** | 42 | Choice `patron_pressure_orthodox_hold` | Sets `merchant_patron_midlife_pressure_done` + `merchant_patron_pressure_orthodox` |
| **9. Cost label update** | 42+ | `midlife_pressure_done` = true | cost = `侠义盟约之债` |
| **10. Current goal update** | 42+ | `midlife_pressure_done` = true | goal = `一面守侠义盟约护商，一面应付门派索债般的武力差遣` |

**Payoff reachability:** After pressure, `merchant_patron_payoff_echo` gate (`midlife_pressure_done` + `!payoff_done`) passes at age 48–52.

---

## Path B — Bridge-Origin Apprentice

| Node | Age | State | Evidence |
| ---- | --- | ----- | -------- |
| **5. Pre-pressure state** | 38 | `merchant_patron_on_ramp_done` + `merchant_patron_bridge_apprentice_craft`; pressure not done | cost = `手艺护商之累`; goal = `手艺眼光换门派护商，正把刨花与剑鞘绑成一条商武绳` |
| **6. Pressure event fires** | 40–44 | Same gate; `patron_pressure_apprentice_quality` branch condition matches | Event eligible at age 40–44 |
| **7. Checkpoint set** | 42 | Choice `patron_pressure_apprentice_quality` | Sets `merchant_patron_midlife_pressure_done` + `merchant_patron_pressure_apprentice` |
| **9. Cost label update** | 42+ | pressure done | cost = `手艺护商之债` |
| **10. Current goal update** | 42+ | pressure done | goal = `一面用手艺标准护商，一面应付盟约兑现后的品质与护镖两头紧` |

---

## Verification method

Assertions encoded in `tests/p106MerchantMartialPatronPressureTests.ts` (R8–R13) plus manual chain review against `sample-lines-spine.json` and `sampleLineExpression.ts`.

## Deferred (not required for P106 proof)

- Full 6-variant exhaust
- Stat threshold gates (`martialPower` / `businessAcumen` ≥ 8)
- Ordinary-origin patron expression
- Full lifetime `gate:p20` rerun

---

**Proof status:** PASS — 5 core nodes demonstrated on 2 paths (native + bridge-origin).
