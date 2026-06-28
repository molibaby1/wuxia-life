# P37 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Branch:** `codex/p37-wuxia-additional-mixed-pinnacle-lifetime-traces`  
**Parent PRD:** `docs/PRD/p37-wuxia-additional-mixed-pinnacle-lifetime-traces.md`  
**North Star:** `docs/designs/p25-lifetime-simulation-north-star.md` §3 / §6 / §8

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 5/5 `passes: true` |
| **Finalize** | P37 verify PASS (2026-06-24) |

### Evidence (2026-06-24 post-run)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `tests/p37AdditionalMixedPinnacleParityTests.ts` | PASS |
| `tests/p35MixedPinnacleParityTests.ts` | PASS (carry-forward) |
| `tests/p34LifetimeParityTests.ts` | PASS (carry-forward) |

P37 Goals satisfied: `merchant_martial_patron` + `founding_patriarch` habit-led lifetime traces, baseline delta, isolated regression, §8 item 1 additional-outcomes closure.

---

## North Star §8 mapping (post-P37)

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 三类可玩样本 | **Partial** | Category **Met** (P34/P35); additional outcomes **Met** (P37); Wave 3/4 full spectrum **Defer** |
| 2 — 平凡出身 ≥3 | **Met** | P25 ordinary slice (unchanged) |
| 3 — 零自相矛盾 | **Partial** | 8-path slice **Met** (`highSeverity=0`); full pool **Open** |
| 4 — 巅峰运气+选择 | **Met** | P35 + P37 `founding_patriarch` dual-gate |
| 5 — 门禁不退化 | **Partial** | No regression **Met**; P8 absolute pass **Open** (6 frustration blockers) |

**end_state_status:** **OPEN** (items 1/3/5 Partial; Wave 3/4 defer)

### §3 / §6 alignment

| North Star section | Post-P37 status |
| --- | --- |
| §3.2 巅峰成就 | **Met** for sim evidence — P35 `jianghu_myth_legend` + P37 `founding_patriarch` dual-gate lifetime traces |
| §3.3 混合成就 | **Met** for sim evidence — P35 `healer_swordsman` + P37 `merchant_martial_patron` cross-track lifetime traces |
| §6 重玩动机 | **Partial** — replayability gate pass; P8 frustration opaque ratio blocks playability absolute pass |

---

## Gap inventory

| Gap ID | Description | Route | Priority | Post-P37 |
| --- | --- | --- | --- | --- |
| GAP-END-08-01a | `merchant_martial_patron` habit-led lifetime trace | **closed** | — | **Met** (P37-002) |
| GAP-END-08-01b | `founding_patriarch` habit-led lifetime trace | **closed** | — | **Met** (P37-003) |
| GAP-END-08-03 | Full content-pool consequence audit (beyond 8-path slice) | **defer** | Low | Open — no exhaustive acceptance spec |
| GAP-END-08-05b | P8 playability absolute pass (6 frustration blockers, opaque ratio 1.00) | **next-stage** | **High** | Open — highest-priority verifiable gap |
| GAP-P8-FRUSTRATION | 6 personas: `setback_injury`, `setback_property_loss`, `love_secret_help` etc. classified opaque | **next-stage** | **High** | Open — `collectFrustrationMetrics` lacks causality keywords |
| GAP-MEDICAL-POOL | Medical pool habit migration 3/18 | **defer** | Low | Unchanged |
| GAP-POISON-MUTEX | Game-engine JSON path poison mutex | **monitor** | Low | Unchanged |
| GAP-WAVE3-4 | `merchant_magnate`, ordinary expansion | **defer** | Low | P37 non-goals |
| GAP-P37-CONSISTENCY | P37 trace flags in P36 consistency harness | **defer** | Low | Optional per P37 closure |

---

## In-stage delta

**None.** P37 closed; do not modify `passes: true` stories.

---

## Next-stage PRD

| Field | Value |
| --- | --- |
| **spawned** | **true** |
| **stage_slug** | `p38-wuxia-p8-playability-frustration-remediation` |
| **prd_md** | `docs/PRD/p38-wuxia-p8-playability-frustration-remediation.md` |
| **prd_json** | `docs/PRD/p38-wuxia-p8-playability-frustration-remediation.prd.json` |
| **Gaps addressed** | GAP-END-08-05b, GAP-P8-FRUSTRATION |
| **Rationale** | P37 closed §8 item 1 additional outcomes (Option B). Highest-priority remaining OPEN gap with verifiable Goals is P8 playability absolute pass — 6 personas at opaque ratio 1.00 on recurring setback events (`setback_injury`, `setback_property_loss`, `love_secret_help`). Deferred in P36 when user selected Option B. |

### P38 Goals summary (spawned)

1. Audit opaque setback root causes across 6 blocker personas
2. Add causality/explanation signals to top recurring setback event templates
3. Re-run `gate:playability`; document delta vs P36 baseline
4. Isolated frustration regression tests
5. Closure updating §8 item 5 toward absolute pass

### P38 Non-goals

- Scheduler / `dailyEvents.ts` rewrite
- Wave 3/4 achievement expansion
- Medical pool full migration
- Lifetime sim trace work (P34–P37 closed)
