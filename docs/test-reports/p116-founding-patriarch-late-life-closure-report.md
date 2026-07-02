# P116 Founding Patriarch Late-Life Closure Report

> **Stage:** P116 Founding Patriarch Late-Life Design-First
> **Date:** 2026-07-02
> **Branch:** `codex/p116-wuxia-founding-patriarch-late-life-design-first`
> **Contract:** `docs/PRD/p116-founding-patriarch-late-life-contract.md`

---

## 1. Summary

P116 为 `founding_patriarch` 路线的 late-life 阶段产出 design-first contract。基于 P115 pressure 二选一结构（rule_first / alliance_first），设计两条差异化的 late-life 分支（门规守成终老 / 盟约续责终老），锁定 auto event 模式、flag 接口、表达更新边界与 P117 验证形状。

本 stage **零运行时代码改动**；P113/P115 runtime evidence 未退化。

---

## 2. Deliverables

| Area | Status | Evidence |
|------|--------|----------|
| Prerequisite audit | ✅ | `docs/test-reports/p116-founding-patriarch-late-life-prerequisite-audit.md` |
| Scope contract | ✅ | `docs/test-reports/p116-founding-patriarch-late-life-scope-contract.md` |
| Branch design | ✅ | `docs/test-reports/p116-founding-patriarch-late-life-direction-comparison.md` |
| Late-life contract | ✅ | `docs/PRD/p116-founding-patriarch-late-life-contract.md` |
| P117 validation shape | ✅ | `docs/test-reports/p116-p117-validation-shape.md` |
| Closure report | ✅ | This document |
| Runtime changes | ❌ (by design) | Zero `src/` changes |

---

## 3. Design Decisions Locked

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Event mode | Auto × 2 branches | Late-life 是 pressure 后果，非新选择（对齐 P78/P109） |
| Event ID | `founding_patriarch_late_life` | New spine event after payoff |
| Age range | 52–56 | Payoff 48–52 后；对齐 patron/renown |
| Upstream gate | `founding_patriarch_payoff_done` | P113 checkpoint |
| Branch key | `founding_patriarch_pressure_*` | **Pressure markers**（非 payoff，路线差异化） |
| Checkpoint | `founding_patriarch_late_life_done` + `founding_patriarch_late_life_identity_done` | 对齐 renown/patron pattern |
| Branch A | 门规守成终老 → `founding_patriarch_late_rule_keeper` | rule_first 治理次序后果 |
| Branch B | 盟约续责终老 → `founding_patriarch_late_alliance_bearer` | alliance_first 治理次序后果 |

---

## 4. Closure Criteria (P116 Stage — 8/8)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Prerequisite audit complete | P116-001 deliverable |
| C2 | Scope contract locked | P116-002 deliverable |
| C3 | Two branches meaningfully different | Direction comparison §4–5 |
| C4 | Late-life contract written | P116 contract doc |
| C5 | P117 validation shape defined | p116-p117-validation-shape.md |
| C6 | GO/NO-GO stated with rationale | §6 below |
| C7 | Zero runtime changes | No `src/` diff |
| C8 | Typecheck passes | `npm run typecheck` ✅ |

**P116 design-first closed: 8/8.**

---

## 5. What Founding-Patriarch Late-Life Contract Now Provides

- Auto late-life event spec keyed on 2 pressure markers（与 patron payoff-keyed 区分）
- Two meaningfully different late-life arcs: 门规守成终老 / 盟约续责终老
- Player-facing differentiation via cost label, goal, and identity (per branch)
- Flag interfaces for P118+ endgame echo: `founding_patriarch_endgame_echo_done` reserved
- Expression priority rule: late_life_done > payoff_done > pressure_done > on-ramp
- Continuity constraints: pressure → late-life → endgame handoff
- P117 validation shape with 12-criteria closure pattern

---

## 6. GO / NO-GO for P117 Playable Late-Life

### **GO** — Proceed with P117 playable late-life implementation

**Rationale:**
1. P115 pressure markers are wired and expression-differentiated — late-life has clear branch keys
2. P113 payoff checkpoint provides direct upstream gate; full on-ramp → pressure → payoff chain proven
3. Patron P109 / Renown P78 auto late-life pattern is proven — founding-patriarch can reuse structure with pressure-keyed branches
4. Prerequisite audit confirms all upstream gates exist; no blocking gaps (GAP-P115-N01/N02 addressed at contract level)
5. Contract is unambiguous — P117 needs no direction decisions

**Conditions for P117:**
- Follow `docs/PRD/p116-founding-patriarch-late-life-contract.md` exactly
- Validate against `docs/test-reports/p116-p117-validation-shape.md` (12/12 criteria)
- Minimum: 2 branch proof paths + 1 on-ramp variant overlay + P113/P115/P37/patron regression

---

## 7. P117 Boundary

**P117 must do:**
- Wire `founding_patriarch_late_life` auto event in spine
- Set checkpoint + 2 branch markers
- Update expression (cost label, goal, identity) with late_life_done gate
- Add `tests/p117FoundingPatriarchLateLifeTests.ts`
- Produce targeted proof artifact

**P117 must NOT do:**
- Redesign late-life direction (locked by P116)
- Touch P113/P115 bridge/pressure/payoff wiring (regression only)
- Implement endgame echo (P118+)
- Expand to full 2×3 pressure×payoff identity matrix
- Add new UI or platform systems
- Switch branch key to payoff markers (locked as pressure-keyed)

---

## 8. Deferred Items

| Item | Reason | Deferred To |
|------|--------|-------------|
| Full 2×3 pressure×payoff identity matrix | P117 minimum: 2 pressure branches | Post-P117 |
| Payoff overlay expression modifiers | Optional bonus | P117 bonus / defer |
| Ordinary-origin founding-patriarch late-life | Out of bounded scope | P117+ bonus / defer |
| Stat threshold gates on late-life branches | Optional enhancement | P117 bonus |
| Founding-patriarch endgame echo design + implementation | Late-life only in P116/P117 | P118+ |
| Sect inheritance handoff markers | Endgame stage concern | P118+ |
| Life memory / summary updates | Endgame stage | P118+ |
| Full-lifetime `gate:p20` broad rerun | Out of scope | Far future |
| Multi-event late-life expansion | Bounded single event sufficient | Revisit if justified |
| P37 founding_patriarch lifetime trace rewrite | Prior stage closed | Far future |

---

## 9. Test Commands (P116 — docs only)

```
npm run typecheck
```

P117 will add:
```
npm exec tsx tests/p117FoundingPatriarchLateLifeTests.ts
npm exec tsx tests/p115FoundingPatriarchMidlifePressureTests.ts
npm exec tsx tests/p113FoundingPatriarchBridgeTests.ts
npm run guard:sample-lines-baseline
```

---

## 10. Story Completion

| Story | Title | Status |
|-------|-------|--------|
| P116-001 | Audit founding-patriarch late-life prerequisites | ✅ |
| P116-002 | Lock P116 scope contract | ✅ |
| P116-003 | Design late-life branch directions | ✅ |
| P116-004 | Define founding-patriarch late-life contract | ✅ |
| P116-005 | Define P117 validation shape | ✅ |
| P116-006 | Produce P116 closure report | ✅ |

---

**P116 complete. Handoff to P117.**
