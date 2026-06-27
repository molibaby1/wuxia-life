# P40 Discovery Gaps — Post-Run (A1-Discovery)

**Date:** 2026-06-24  
**Mode:** post-run (A1-discovery, `--pipeline-auto --spawn-stage`)  
**Branch:** `codex/p40-wuxia-p8-replay-pacing-polish`  
**Parent PRD:** `docs/PRD/p40-wuxia-p8-replay-pacing-polish.md`  
**Product End-State:** P39 closure chain (§8 all Met); canonical `docs/designs/p25-lifetime-simulation-north-star.md` **absent from tree**

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 5/5 `passes: true` |
| **Verify** | `agent_docs/p40-wuxia-p8-replay-pacing-polish-verify-result.md` — PASS |

### Evidence (2026-06-24 discovery re-run)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npm exec tsx tests/p40ReplayPacingPolishTests.ts` | PASS — deviant-ye span ≤5y, near-duplicate ≤3 |
| `docs/test-reports/p8-playability-gate-latest.json` | `decision: pass`; deviant-ye span **5y**; **3** near-duplicate warnings |
| `docs/test-reports/p40-closure-report.md` | M1–M5 Met; `GAP-P8-WARNINGS` closed |

P40 Goals satisfied: pacing audit + deviant-ye remediation (7y→5y), replay differentiation (≤3 pairs), gate refresh + isolated regression, closure + defer queue update.

---

## North Star §8 mapping (post-P40)

| §8 Item | Status | Evidence |
| --- | --- | --- |
| 1 — 三类可玩样本 | **Met** | P34/P35/P37 lifetime traces; Wave 3/4 **defer** (North Star §3.3/§3.4 intentional) |
| 2 — 平凡出身 ≥3 | **Met** | `docs/test-reports/p25-ordinary-origin-slice.md` |
| 3 — 零自相矛盾 | **Met** | P39: 13 paths, `highSeverityContradictionCount: 0` |
| 4 — 巅峰运气+选择 | **Met** | P35 pinnacle dual-gate + P34 mainstream |
| 5 — 门禁不退化 | **Met** | P38 absolute `gate:playability` PASS; P40 polish preserved PASS + frustration 0.00 |

**end_state_status:** **CLEAR** — all five §8 checklist items **Met** (unchanged from P39); P40 was optional polish only per PRD §1.

**Note:** Canonical End-State doc `docs/designs/p25-lifetime-simulation-north-star.md` is referenced across P25–P40 PRDs but **not present in tree**. §8 status derived from P39 discovery + P40 closure evidence chain (same methodology as P39).

---

## Gap inventory

| Gap ID | Description | Route | Priority | Status |
| --- | --- | --- | --- | --- |
| GAP-P8-WARNINGS | deviant-ye 6y pacing + near-duplicate replay pairs | **closed** | — | **Met** (P40: 5y span, 3 pairs) |
| GAP-REPLAY-STRETCH-0 | 3 near-duplicate pairs remain (stretch 0 not reached) | **defer** | Low | PRD stretch goal; ≤3 is Met |
| GAP-PACING-OTHER-PERSONAS | martial-lin / balanced-wei / others 6–7y low-impact spans | **defer** | Low | PRD non-goal (deviant-ye only hard gate) |
| GAP-DEVIANT-ACHIEVEMENT | `ye-risk-choice` misses `demonic_midlife_fork` | **defer** | Low | Pre-existing; documented in closure |
| GAP-WAVE3-4 | `merchant_magnate`, Wave 4 ordinary expansion | **defer** | Low | Intentional defer (North Star §3.3/§3.4) |
| GAP-MEDICAL-POOL | Medical pool habit migration 3/18 | **defer** | Low | Not §8 checklist item |
| GAP-COMBINATORIAL | Combinatorial all-events proof | **defer** | Low | Bounded representative policy |
| GAP-DOC-NORTH-STAR | Canonical `p25-lifetime-simulation-north-star.md` missing from tree | **defer** | Low | Doc drift; §8 Met via closure chain |
| GAP-DOC-CHILDHOOD-CONTRACT | `childhood-payoff-spine-7-13-content-contract.md` missing; audit used proxy | **defer** | Low | P40 audit documented workaround |
| GAP-POISON-MUTEX | Game-engine JSON poison mutex | **monitor** | Low | Non-blocking (P39) |
| GAP-DAILY-FLAGLESS | `daily.json` flag-less pool | **defer** | Low | No persistent flag contradiction surface |

---

## In-stage delta

**None.** P40 closed; do not modify `passes: true` stories.

---

## Next-stage PRD

| Field | Value |
| --- | --- |
| **spawned** | **false** |
| **Rationale** | P40 stage CLEAR; Product End-State §8 CLEAR (inherited P39). Remaining gaps are intentional defer/monitor (Wave 3/4, medical pool, stretch 0 replay, other-persona pacing, missing canonical docs). No verifiable §8 blocker or in-stage gap warrants spawn. |

### Future work (defer queue — not spawn blockers)

- Wave 3 `merchant_magnate` / Wave 4 平凡出身扩展
- Full medical pool habit-led migration
- Full setback pool audit
- Stretch 0 near-duplicate pairs (optional polish beyond P40 Met)
- Restore or reconcile missing `p25-lifetime-simulation-north-star.md` canonical doc
- Childhood payoff Slice C contract documentation

---

## Route summary

| Route | Count | Action |
| --- | --- | --- |
| **closed** | 1 | GAP-P8-WARNINGS Met |
| **in-stage** | 0 | — |
| **next-stage** | 0 | No spawn |
| **defer** | 8 | Documented in P40 closure |
| **monitor** | 1 | GAP-POISON-MUTEX |
