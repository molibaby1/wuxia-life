# P109 Merchant Martial Patron Late-Life Closure Report

> **Stage:** P109 Patron Late-Life Design-First
> **Date:** 2026-07-02
> **Branch:** `codex/p109-wuxia-merchant-martial-patron-late-life-design-first`
> **Contract:** `docs/PRD/p109-merchant-martial-patron-late-life-contract.md`

---

## 1. Summary

P109 为 `merchant_martial_patron` 路线的 late-life 阶段产出 design-first contract。基于 P108 payoff 三选一结构（covenant_holder / covenant_breaker / balancer），设计三条差异化的 late-life 分支（盟约绑紧 / 自由孤立 / 新盟可持续），锁定 auto event 模式、flag 接口、表达更新边界与 P110 验证形状。

本 stage **零运行时代码改动**；P102–P108 runtime evidence 未退化。

---

## 2. Deliverables

| Area | Status | Evidence |
|------|--------|----------|
| Prerequisite audit | ✅ | `docs/test-reports/p109-merchant-martial-patron-late-life-prerequisite-audit.md` |
| Scope contract | ✅ | `docs/test-reports/p109-merchant-martial-patron-late-life-scope-contract.md` |
| Branch design | ✅ | `docs/test-reports/p109-merchant-martial-patron-late-life-direction-comparison.md` |
| Late-life contract | ✅ | `docs/PRD/p109-merchant-martial-patron-late-life-contract.md` |
| P110 validation shape | ✅ | `docs/test-reports/p109-p110-validation-shape.md` |
| Closure report | ✅ | This document |
| Runtime changes | ❌ (by design) | Zero `src/` changes |

---

## 3. Design Decisions Locked

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Event mode | Auto × 3 branches | Late-life 是 payoff 后果，非新选择（对齐 P78） |
| Event ID | `merchant_patron_late_life` | New spine event after payoff |
| Age range | 52–56 | Payoff 48–52 后；对齐 renown P78 |
| Upstream gate | `merchant_patron_payoff_done` | P108 checkpoint |
| Branch key | `merchant_patron_payoff_*` | 三选一 payoff marker |
| Checkpoint | `merchant_patron_late_life_done` + `merchant_patron_late_life_identity_done` | 对齐 renown pattern |
| Branch A | 盟约绑紧 → `merchant_patron_late_covenant_bound` | Payoff holder 远期伏笔兑现 |
| Branch B | 自由孤立 → `merchant_patron_late_isolated_merchant` | Payoff breaker 远期伏笔兑现 |
| Branch C | 新盟可持续 → `merchant_patron_late_sustainable_covenant` | Payoff balancer 远期伏笔兑现 |

---

## 4. Closure Criteria (P109 Stage — 8/8)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Prerequisite audit complete | P109-001 deliverable |
| C2 | Scope contract locked | P109-002 deliverable |
| C3 | Three branches meaningfully different | Direction comparison §4–6 |
| C4 | Late-life contract written | P109 contract doc |
| C5 | P110 validation shape defined | p109-p110-validation-shape.md |
| C6 | GO/NO-GO stated with rationale | §6 below |
| C7 | Zero runtime changes | No `src/` diff |
| C8 | Typecheck passes | `npm run typecheck` ✅ |

**P109 design-first closed: 8/8.**

---

## 5. What Patron Late-Life Contract Now Provides

- Auto late-life event spec keyed on 3 payoff choice markers
- Three meaningfully different late-life arcs: 盟约绑紧 / 自由孤立 / 新盟可持续
- Player-facing differentiation via cost label, goal, and identity (per branch)
- Flag interfaces for P111+ endgame echo: `merchant_patron_endgame_echo_done` reserved
- Expression priority rule: late_life_done > payoff_done > pressure > on-ramp
- P110 validation shape with 12-criteria closure pattern

---

## 6. GO / NO-GO for P110 Playable Late-Life

### **GO** — Proceed with P110 playable late-life implementation

**Rationale:**
1. P108 payoff choice markers are wired and expression-differentiated — late-life has clear branch keys
2. P107 远期伏笔（盟约绑紧 / 自由孤立 / 新盟可持续）为三条分支提供叙事方向
3. Renown P78 auto × 3 branches pattern is proven — patron can reuse structure with 商武风味
4. Prerequisite audit confirms all upstream gates exist; no blocking gaps
5. Contract is unambiguous — P110 needs no direction decisions

**Conditions for P110:**
- Follow `docs/PRD/p109-merchant-martial-patron-late-life-contract.md` exactly
- Validate against `docs/test-reports/p109-p110-validation-shape.md` (12/12 criteria)
- Minimum: 3 branch proof paths + 1 bridge-origin overlay + P102–P108 regression

---

## 7. P110 Boundary

**P110 must do:**
- Wire `merchant_patron_late_life` auto event in spine
- Set checkpoint + 3 branch markers
- Update expression (cost label, goal, identity) with late_life_done gate
- Add `tests/p110MerchantMartialPatronLateLifeTests.ts`
- Produce targeted proof artifact

**P110 must NOT do:**
- Redesign late-life direction (locked by P109)
- Touch P102–P108 payoff/pressure/entry wiring (regression only)
- Implement endgame echo (P111+)
- Expand to full 5×3 identity matrix
- Add new UI or platform systems

---

## 8. Deferred Items

| Item | Reason | Deferred To |
|------|--------|-------------|
| Full 5×3 entry×payoff×late-life identity matrix | P110 minimum: 1 native + 1 bridge per branch | Post-P110 |
| Ordinary origin patron late-life expression | Out of bounded scope | P110 bonus / defer |
| Stat threshold gates on late-life branches | Optional enhancement | P110 bonus |
| Patron endgame echo design + implementation | Late-life only in P109/P110 | P111+ |
| Life memory / summary updates | Endgame stage | P111+ |
| Full-lifetime `gate:p20` broad rerun | Out of scope | Far future |
| Multi-event late-life expansion | Bounded single event sufficient | Revisit if justified |

---

## 9. Test Commands (P109 — docs only)

```
npm run typecheck
```

P110 will add:
```
npm exec tsx tests/p110MerchantMartialPatronLateLifeTests.ts
npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts
npm run guard:sample-lines-baseline
```

---

## 10. Story Completion

| Story | Title | Status |
|-------|-------|--------|
| P109-001 | Audit patron late-life prerequisites | ✅ |
| P109-002 | Lock P109 scope contract | ✅ |
| P109-003 | Design three late-life branches | ✅ |
| P109-004 | Define patron late-life contract | ✅ |
| P109-005 | Define P110 validation shape | ✅ |
| P109-006 | Produce P109 closure report | ✅ |

---

**P109 complete. Handoff to P110.**
