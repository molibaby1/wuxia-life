# P83 Medical Sage Bridge Playable — Gaps

> **Stage:** P83 Wuxia Medical Sage Bridge Playable Implementation
> **Discovery date:** 2026-06-29
> **Status after P83:** Bridge closed; entry differentiation and spine remain open

---

## 1. Stage Gap Summary

### In-Stage (P83) — DONE

All 7 user stories in P83 are complete:

| # | Story | Status |
|---|-------|--------|
| P83-001 | Audit implementation delta | ✅ Done |
| P83-002 | Lock runtime scope contract | ✅ Done |
| P83-003 | Implement bridge wiring + 2 entry variants | ✅ Done |
| P83-004 | Bridge player-facing expression (3 surfaces × 2 variants) | ✅ Done |
| P83-005 | Targeted bridge proof | ✅ Done |
| P83-006 | Narrow regression coverage | ✅ Done |
| P83-007 | Closure report | ✅ Done |

**Stage status:** CLEAR — P83 scope fully delivered. 12/12 closure criteria met.

---

## 2. End-State Gaps (vs North Star §3.1 Wave 1)

### North Star target: `medical_sage_healer` (一代名医)

| North Star requirement | Current state (P83) | Gap |
|-----------------------|---------------------|-----|
| 声望 ≥55 | Bridge gives +4~+5 reputation; rest is downstream | OPEN — spine needs to deliver stat progression |
| 资源 ≥30 | Pragmatic variant gives +80 money; no sustained resource track | OPEN — spine needs to deliver sustained resources |
| key_choices dim 1: `medical_divine_doctor_fame` or `medical_imperial` | Neither flag set at bridge | OPEN — payoff / late-life spine concern |
| key_choices dim 2: `medical_plague_hero` or `medical_pure` | `medical_pure` set at bridge ✅ | DONE (bridge-level) |
| Full playable route from bridge → gate acceptance | Only bridge is closed | OPEN — need on-ramp / pressure / payoff spine |
| 2 entry variants with meaningful differentiation | 2 variants exist with distinct stats/flags and lifeMemory text | PARTIAL — entry differentiation refinement needed (P84) |
| Player-visible expression on all surfaces | 3 surfaces (currentGoal, lifeMemory, summary) updated at bridge | PARTIAL — spine-level expression not yet built |
| Full lifetime sim verification | Targeted proof only (14 chain nodes) | OPEN — downstream concern |

### Wave 1 status overview

| Achievement | Bridge | Entry Diff | On-ramp | Pressure | Payoff | Late-life | Endgame |
|-------------|--------|------------|---------|----------|--------|-----------|---------|
| `grandmaster_guardian` (P16) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sect_leader_statesman` (P16) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lone_sword_legend` (P16) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `jianghu_renown_sage` | ✅ P71 | ✅ P72 | ✅ P73 | ✅ P75 | ✅ P77 | ✅ P79 | ✅ P81 |
| `medical_sage_healer` | ✅ P83 | ❌ P84 | ❌ P85 | ❌ P86 | ❌ P87 | ❌ P88 | ❌ P89 |

---

## 3. Gap Routing

### Next-stage (spawn P84)

| Gap ID | Description | Routing | Rationale |
|--------|-------------|---------|-----------|
| GAP-END-001 | Entry differentiation refinement — deepen compassionate vs pragmatic variants | **P84** | Immediate next step after bridge closure; follows P72 renown pattern; bounded scope |
| GAP-END-002 | Medical on-ramp spine event (first post-bridge milestone) | P85 | After entry differentiation; follows P73 renown pattern |
| GAP-END-003 | Medical pressure spine (practice pressures / 疑难杂症 / 瘟疫初现) | P86 | After on-ramp; follows P74/P75 renown pattern |
| GAP-END-004 | Medical payoff spine (climax choice: 瘟疫英雄 / 归隐 / 传承) | P87 | After pressure; follows P76/P77 renown pattern |
| GAP-END-005 | Medical late-life spine | P88 | After payoff; follows P78/P79 renown pattern |
| GAP-END-006 | Medical endgame (legacy echo) | P89 | After late-life; follows P80/P81 renown pattern |
| GAP-END-007 | key_choices dim 1: `medical_divine_doctor_fame` / `medical_imperial` | P87+ | Payoff-stage concern |
| GAP-END-008 | Full stat threshold verification (reputation ≥55, resources ≥30) | P85+ | Spine delivers stat progression |
| GAP-END-009 | Farm_peasant / town_apprentice medical bridges | P90+ | Additional origins; future cycle |
| GAP-END-010 | Poison path (`medical_poison_path`) | Future cycle | Alternative medical route; not Wave 1 mainline |
| GAP-END-011 | Social-momentum healer bridge direction | Future cycle | Second medical bridge for tavern_hand |

### P84 scope (entry differentiation refinement)

What P84 will address:

1. Deepen compassionate vs pragmatic variants beyond bridge-level stat differences
2. Add sample-line entry expression (currentGoal, cost label, identity) for medical route
3. Add entry-level markers that carry through to downstream spine
4. Verify the 2 variants feel meaningfully different at entry
5. Provide GO/NO-GO for full spine implementation (P85+)

What P84 will NOT do:

- No on-ramp / pressure / payoff spine events
- No full stat threshold delivery
- No new systems or frameworks
- No additional origins

---

## 4. Deferred / Out-of-Scope

- Merchant trilogy replication for medical route is long-term but not P83 concern
- Full lifetime sim exhaust is downstream
- Additional origins (farm_peasant, town_apprentice) are future cycle
- Poison path is alternative route, not Wave 1 mainline

---

## 5. Evidence Sources

- `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md` — 12/12 criteria met
- `agent_docs/p83-wuxia-medical-sage-bridge-playable-verify-result.md` — PASS
- `tests/p83TavernHandMedicalBridgeTests.ts` — 21/21 assertions pass
- `docs/designs/p25-lifetime-simulation-north-star.md` §3.1 — Wave 1 achievement spec
- `docs/PRD/p83-wuxia-medical-sage-bridge-playable.md` — P83 PRD (7 stories, all done)
