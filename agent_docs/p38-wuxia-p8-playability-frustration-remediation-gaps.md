# P38 Discovery Gaps — Post-Run (Pipeline-Auto)

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto`)  
**Branch:** `codex/p38-wuxia-p8-playability-frustration-remediation`  
**Parent PRD:** `docs/PRD/p38-wuxia-p8-playability-frustration-remediation.md`  
**Product End-State:** `docs/designs/p25-lifetime-simulation-north-star.md` §8

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 5/5 `passes: true` |
| **Verify** | `agent_docs/p38-wuxia-p8-playability-frustration-remediation-verify-result.md` — PASS |

### Evidence (2026-06-24)

| Check | Result |
| --- | --- |
| `npm run gate:playability` | **PASS** — decision `pass`, 8/8 personas frustration pass |
| `p8-playability-gate-latest.json` | 6/6 former blockers opaque ratio **0.00** (target ≥4/6 &lt;0.35) |
| `npx tsc --noEmit` | PASS |
| `tests/p38FrustrationRemediationTests.ts` | PASS |
| `tests/p37AdditionalMixedPinnacleParityTests.ts` | PASS (carry-forward) |
| `tests/p36ConsistencyTests.ts` | PASS (carry-forward) |

P38 Goals satisfied: opaque setback audit, ≥3 recurring template fixes (4 delivered), gate refresh with 6/6 blockers below threshold, §8 item 5 absolute pass closure.

---

## North Star §8 mapping (post-P38)

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 三类可玩样本 | **Met** | P34 medical + P35 mixed/pinnacle + P37 additional outcomes (`merchant_martial_patron`, `founding_patriarch`); Wave 3/4 spectrum **defer** |
| 2 — 平凡出身 ≥3 | **Met** | P25 ordinary slice (unchanged) |
| 3 — 零自相矛盾 | **Partial** | 8-path slice Met (`highSeverity=0`); **full content pool audit Open** |
| 4 — 巅峰运气+选择 | **Met** | P35 pinnacle + P34 mainstream (unchanged) |
| 5 — 门禁不退化 | **Met** | P38: `gate:playability` absolute PASS; `gate:p20` no regression |

**end_state_status:** **OPEN** (item 3 Partial)

---

## Gap inventory

| Gap ID | Description | Route | Priority | Status |
| --- | --- | --- | --- | --- |
| GAP-END-08-05b | P8 playability absolute pass (6 frustration blockers) | **closed** | — | **Met** (P38) |
| GAP-P8-FRUSTRATION | Opaque setback ratio 1.00 on 6 personas | **closed** | — | **Met** (P38) |
| GAP-END-08-03 | Full content-pool consequence audit (beyond 8-path slice) | **next-stage** | **High** | Open — highest-priority verifiable §8 blocker |
| GAP-WAVE3-4 | `merchant_magnate`, Wave 4 ordinary expansion | **defer** | Low | Intentional defer (North Star §3.3/§3.4) |
| GAP-MEDICAL-POOL | Medical pool habit migration 3/18 | **defer** | Low | P29/P33 scope; not §8 checklist item |
| GAP-POISON-MUTEX | Game-engine JSON poison mutex (sim aligned) | **monitor** | Low | Non-blocking |
| GAP-P8-WARNINGS | p8-deviant-ye pacing; near-duplicate replay pairs | **defer** | Low | Non-blocker warnings |
| GAP-P37-CONSISTENCY | P37 lifetime traces not in P36 8-path audit | **next-stage** | Medium | Absorbed into GAP-END-08-03 P39 scope |

---

## In-stage delta

**None.** P38 closed; do not modify `passes: true` stories.

---

## Next-stage PRD

| Field | Value |
| --- | --- |
| **spawned** | **true** |
| **prd_md** | `docs/PRD/p39-wuxia-full-content-pool-consequence-audit-reconciliation.md` |
| **prd_json** | `docs/PRD/p39-wuxia-full-content-pool-consequence-audit-reconciliation.prd.json` |
| **stage_slug** | `p39-wuxia-full-content-pool-consequence-audit-reconciliation` |
| **Gaps addressed** | GAP-END-08-03, GAP-P37-CONSISTENCY |
| **Rationale** | P38 closed §8 item 5 absolute pass. Sole remaining §8 checklist Partial is item 3 (full pool audit). Wave 3/4 and medical pool remain explicit defer queue — not spawn blockers per prior P36/P37 reconciliation. |
