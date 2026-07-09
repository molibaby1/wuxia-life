# P128 Scholar Visible Growth Defer Rationale

**Date:** 2026-07-09  
**Branch:** `codex/p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation`  
**Story:** P128-004  
**Verdict:** **`scholar_house` / `studyHabit` third visible-growth sample remains DEFERRED**

---

## 1. Context

P122 closed visible growth on `merchant_house` / `businessHabit`. P127 closed the martial branch on `martial_family` / `trainingHabit`. P128 formally closes the two-sample wave and updates the P126 defer queue:

- **martial branch:** Closed (P127)
- **scholar branch:** Defer (this document)

**P128 does NOT imply scholar implementation.** Future Discovery must not assume scholar is in-flight or blocked only by scheduling.

---

## 2. Why scholar_house Remains OUT OF SCOPE

### 2.1 P127 Non-Goals (explicit)

P127 PRD §12 and §4 Out of Scope list:

- `scholar_house` 平行实现
- 不做跨两条以上出身的模板工程

P127 was scoped as a **single second sample**, not a third-origin expansion. Scholar was excluded at design time, not deferred by accident.

### 2.2 Indirect habit chain (P127 §3.3)

`scholar_house` early `studyHabit` accumulation is **less direct** than martial:

| Origin | Primary habit axis | Accumulation path | Proof chain length |
| --- | --- | --- | --- |
| merchant_house | businessHabit | Direct from household errand/apprentice actions | Short |
| martial_family | trainingHabit | Direct from action_childhood_training | Short |
| scholar_house | studyHabit | Indirect via comprehension/knowledge → studyHabit | **Longer, more fragile** |

A scholar sample requires proving not only Signal A/B/C but also that the **indirect stat→habit chain** remains readable to players. That increases implementation and proof cost without adding a new category of reusability evidence — merchant + martial already demonstrate cross-origin pattern transfer on **direct** habit axes.

### 2.3 Cost vs proof value after two-sample closure

| Factor | Assessment |
| --- | --- |
| Reusability already proven? | **Yes** — two origins with different habit axes |
| New systems required? | No — but scholar needs more careful wiring validation |
| Player-facing differentiation? | Moderate — study axis exists but early actions less consolidated |
| Risk of scope creep? | **High** — third sample invites「统一模板」engineering |

P127 §14 recommendation: after two samples, compare scholar vs higher-priority backlog. **Two samples are sufficient to stop the visible-growth expansion wave.**

### 2.4 P126 defer queue alignment

Original P126 defer:「非 merchant 路线早期成长反馈模板化扩展」

- Martial sub-item: **Closed** (P127)
- Scholar sub-item: **Defer** (this rationale)

No silent respawn of P127 martial work. No parallel scholar coding in P128.

---

## 3. What Would NOT Justify Scholar (Common Traps)

| Trap | Why it fails |
| --- | --- |
| 「三条出身对称才完整」 | Symmetry is product preference, not proof requirement; two samples satisfy reusability |
| 「studyHabit 已经存在所以便宜」 | Existence ≠ direct early action loop; indirect chain adds proof burden |
| 「P128 闭合了所以可以顺手做 scholar」 | P128 is docs-only reconciliation; scholar is a **new functional stage** if ever approved |
| 「统一成长模板需要第三条验证」 | P127 §14 explicitly rejects template engineering before backlog triage |

---

## 4. Optional Preconditions for a Future Scholar Sample Stage

These are **decision gates**, not commitments. A future stage (e.g. P129+) would need Discovery approval against higher-priority backlog.

| # | Precondition | Rationale |
| --- | --- | --- |
| P-1 | Product prioritizes early scholar readability over Wave 2–4 achievements or ordinary-origin work | North Star §3 / §8 still have OPEN items with higher strategic weight |
| P-2 | A bounded early scholar action loop is identified (analogous to errand/training) with direct studyHabit impact | Reduces indirect-chain proof risk |
| P-3 | Continuation targets exist or are scoped (echo/route events reading studyHabit≥2) | Matches P122/P127 continuation readability requirement |
| P-4 | Explicit single-sample scope contract — no fourth origin, no template framework | Mirrors P127 execution model |
| P-5 | Narrow regression test plan defined before implementation | Same verification standard as P122/P127 |

**If preconditions are not met:** scholar remains deferred indefinitely without blocking Product End-State progress on other axes.

---

## 5. Related Artifacts

| Artifact | Role |
| --- | --- |
| `p128-visible-growth-two-sample-reconciliation.md` §7 | P126 defer queue update |
| `p128-visible-growth-wave-closure-report.md` | End-state OPEN handoff + next theme recommendation |
| `docs/PRD/p127-wuxia-martial-second-visible-growth-sample.md` §3.3, §12, §14 | Source rationale for martial-over-scholar |

---

**Scholar third sample: DEFERRED. P128 closure does not authorize scholar implementation.**
