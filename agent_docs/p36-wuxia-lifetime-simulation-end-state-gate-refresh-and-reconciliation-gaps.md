# P36 Discovery Gaps — Post-Run (Standalone)

**Date:** 2026-06-24  
**Mode:** post-run (standalone)  
**Branch:** `codex/p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation`  
**Parent PRD:** `docs/PRD/p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation.md`  
**North Star:** `docs/designs/p25-lifetime-simulation-north-star.md` §8

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 5/5 `passes: true` |
| **Finalize** | `980df28` (HEAD) |

### Evidence (2026-06-24 re-run)

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `tests/p36ConsistencyTests.ts` | PASS |
| `tests/p35MixedPinnacleParityTests.ts` | PASS |
| `tests/p34LifetimeParityTests.ts` | PASS |
| `scripts/runP36ConsistencySlice.ts` | PASS — `highSeverity=0, findings=0` |

P36 Goals satisfied: gate refresh, 8-path consistency audit, §8 reconciliation, optional trace skip, closure.

---

## North Star §8 mapping

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 三类可玩样本 | **Partial** | Category **Met** (P34 medical + P35 mixed/pinnacle); additional outcomes **Open** |
| 2 — 平凡出身 ≥3 | **Met** | P25 ordinary slice |
| 3 — 零自相矛盾 | **Partial** | 8-path slice **Met** (`highSeverity=0`); full pool **Open** |
| 4 — 巅峰运气+选择 | **Met** | P35 pinnacle dual-gate + P34 mainstream |
| 5 — 门禁不退化 | **Partial** | No regression **Met**; P8 absolute pass **Open** |

**end_state_status:** **OPEN** (items 1/3/5 Partial)

---

## Gap inventory

| Gap ID | Description | Route | Priority |
| --- | --- | --- | --- |
| GAP-END-08-01a | Additional mixed outcome `merchant_martial_patron` habit-led lifetime trace | **next-stage** | Medium |
| GAP-END-08-01b | Additional pinnacle outcome `founding_patriarch` habit-led lifetime trace | **next-stage** | Medium |
| GAP-END-08-03 | Full content-pool consequence audit (beyond 8-path slice) | **defer** | Low — no exhaustive acceptance spec |
| GAP-END-08-05b | P8 playability absolute pass (6 frustration blockers, opaque ratio 1.00) | **next-stage** | High (if §8 item 5 interpreted as absolute pass) |
| GAP-P8-FRUSTRATION | All 6 P8 personas: opaque setbacks = total setbacks | **next-stage** | High |
| GAP-MEDICAL-POOL | Medical pool habit migration 3/18 | **defer** | Low |
| GAP-POISON-MUTEX | Game-engine JSON path poison mutex (sim aligned) | **monitor** | Low |
| GAP-WAVE3-4 | merchant_magnate, ordinary expansion | **defer** | Low (P36 non-goals) |
| GAP-RENOWN-LIFETIME | Renown birth→death optional lifetime | **defer** | Low (P32 short-chain covers pattern) |
| GAP-P36-REG-GATE | `p36ConsistencyTests` not in `runRealTestGate` | **defer** | Low |

---

## Recommended next-stage packages (not spawned — standalone mode)

### Option A — `p37-wuxia-p8-playability-frustration-remediation`

**Theme:** Fix P8 opaque-setback frustration blockers so `gate:playability` can pass.

**Goals (draft):**
1. Audit 6 P8 persona opaque-setback root causes
2. Fix ≥1 high-impact causality/feedback path per persona cluster
3. Re-run gate and document delta vs P36 baseline

**Non-goals:** Scheduler rewrite; habit trajectory work.

### Option B — `p37-wuxia-additional-mixed-pinnacle-lifetime-traces`

**Theme:** Close §8 item 1 additional-outcomes gap.

**Goals (draft):**
1. Add `founding_patriarch` OR `merchant_martial_patron` habit-led lifetime trace
2. Baseline delta + isolated regression
3. Update §8 reconciliation item 1 toward full Met

**Non-goals:** Full medical pool migration; P8 remediation.

---

## In-stage delta

**None.** P36 closed; do not modify `passes: true` stories.

---

## Next-stage PRD

| Field | Value |
| --- | --- |
| **spawned** | **false** (standalone — awaiting user approval) |
| **Recommended** | Option A (P8) or Option B (additional trace) — pick one focused stage |
