# P55 Merchant Magnate Replay Artifact

> **Date:** 2026-06-27
> **Stage:** P55 bounded merchant magnate expansion
> **Branch:** `codex/p55-wuxia-merchant-magnate-bounded-expansion`
> **Seed:** 804 (p8-wealth-shen, choiceTendency: wealth)

## 1. Route Summary

| Field | Value |
| --- | --- |
| Route | merchant (wealth) |
| Persona | p8-wealth-shen |
| Seed | 804 |
| Magnate arc | on-ramp → midlife pressure → payoff |

## 2. Key Checkpoints

| Age | Event | Flag Set | Expression |
| --- | --- | --- | --- |
| 7 | `merchant_childhood_seed_milestone` | `merchant_childhood_seed_done`, `route_merchant` | 营商天赋已显，尚未开张 |
| 16–22 | `merchant_first_shop` | `merchant_shop_grocery/weapon/herb` | 第一桶金已得，店铺经营中 |
| 28 | **`magnate_on_ramp`** | `magnate_on_ramp_done` | 产业初成，巨贾之路刚起步 |
| 32–38 | `merchant_midlife_debt_milestone` | `merchant_midlife_debt` | (magnate expression takes priority) |
| 36 | **`magnate_midlife_pressure`** | `magnate_midlife_pressure_done` | 商号遍九州，人情债也遍九州 |
| 38–42 | `merchant_age40_identity_summary` | `merchant_age40_identity_done` | 你是富甲一方却身不由己的巨贾 |
| 42 | **`magnate_payoff`** | `magnate_payoff_done`, `merchant_age45_payoff_done` | 巨贾之位已成，守住比扩张更难 |

## 3. Magnate Flag Chain

```
merchant_childhood_seed_done / route_merchant / p8_route_wealth
    ↓
magnate_on_ramp_done  (age 28-32, requires merchant route + wealth milestone)
    ↓
magnate_midlife_pressure_done  (age 36-40, requires on-ramp done)
    ↓
magnate_payoff_done  (age 42-46, requires on-ramp + pressure done)
```

## 4. Expression Signals

### 4.1 currentGoal (magnate-specific)

| Stage | Goal Text |
| --- | --- |
| Post-on-ramp | 产业初成，巨贾之路刚起步 |
| Post-pressure | 商号遍九州，人情债也遍九州 |
| Post-payoff | 巨贾之位已成，守住比扩张更难 |

### 4.2 age40Identity

| Condition | Identity Text |
| --- | --- |
| magnate_on_ramp_done | 你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任 |

### 4.3 costLabel

| Condition | Label |
| --- | --- |
| magnate_on_ramp_done | 巨贾负担 |
| (generic merchant) | 商路债务 |

## 5. Cross-References

| Reference | Artifact |
| --- | --- |
| P25 static slice | `docs/test-reports/p25-mixed-identity-slice.md` — `mixed_merchant_magnate_path` PASS |
| P25 achievement traceability | `src/p25/achievementTraceability.ts:67` — merchant_magnate choiceFlags |
| P39 bounded audit | `docs/test-reports/p39-section8-item3-reconciliation-closure.md` |
| P54 residual polish | `docs/test-reports/p54-sample-lines-residual-polish-closure-report.md` — merchant debt closed |

## 6. Distinction from Other Merchant Payoffs

| Payoff | Key Difference |
| --- | --- |
| magnate_payoff (P55) | 财富规模 + 人情/风险/经营负担 — terminal state of magnate arc |
| merchant_age45_expansion_fork (P53) | 选择分岔 (联号共担 vs 独守铺面) — generic merchant fork |
| merchant_martial_patron (P25) | 武力投资 + 门派关系 — martial-merchant hybrid |
