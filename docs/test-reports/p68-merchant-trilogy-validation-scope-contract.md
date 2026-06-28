# P68 Merchant Trilogy Validation Scope Contract

> **Date:** 2026-06-29
> **Stage:** P68 Wuxia Merchant Trilogy Live Experience Validation
> **Type:** Scope contract — bounds P68 to validation/readout only

---

## 1. Purpose

This contract locks P68's scope to validation, replay, playtest-style readout, and verdict work. P68 is **not** a merchant implementation stage — it is a live-experience validation and readout stage that evaluates the already-completed merchant trilogy (P58–P67).

The goal is to prevent scope creep: P68 must not reopen merchant implementation, add new content, or build new systems. It must only validate and synthesize what already exists.

---

## 2. Allowed Layers

P68 may work in the following layers:

### 2.1 Documentation Layer
- Validation asset audits and inventories
- Scope contracts and verdict contracts
- Comparison readouts and synthesis documents
- Playtest-style readout documents
- Closure reports and transfer-readiness judgments
- PRD updates and appendices

**Principle:** Documentation is the primary output of P68.

### 2.2 Minimum Validation Scripts
- Reuse of existing replay infrastructure (`p49:replay`)
- Reuse of existing test suites (no new tests unless absolutely necessary)
- If new scripts are needed, they must be read-only validation tools, not content producers

**Principle:** Reuse before build. Only add scripts if existing tools cannot produce the needed evidence.

### 2.3 Comparison Readout
- Side-by-side comparison of the three merchant routes
- Evidence-based synthesis of existing proof documents
- Human-readable formatting that makes differences visible
- No new runtime content — only new presentation of existing content

**Principle:** Synthesis, not creation.

### 2.4 Verdict Framework
- Definition of pass/warning/fail criteria
- Application of criteria to existing evidence
- Transfer-readiness judgment
- Methodology stability assessment

**Principle:** Judgment is based on existing evidence, not new implementation.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P68. If any of these become necessary, they belong to a future stage, not P68.

### 3.1 No New Merchant Content
- No new merchant events
- No new merchant chains or branches
- No new merchant endings or destinations
- No new merchant NPCs or relationships
- No new merchant items or mechanics

**Why:** P58–P67 already completed the merchant trilogy content. P68 validates, it does not expand.

### 3.2 No New Systems
- No new economy system
- No new merchant map or travel system
- No new relationship system for merchants
- No new UI for merchant-specific display
- No new progression mechanics

**Why:** Systems work belongs to dedicated infrastructure stages. P68 is a validation stage.

### 3.3 No New Bridges
- No fourth ordinary-origin bridge
- No new merchant→destination bridges
- No mixed-identity destination expansions
- No new route tracks or persona boots

**Why:** Bridge expansion is content work, not validation work.

### 3.4 No New Mixed Endings
- No new `merchant_*` ending gates
- No new ending flavors or epilogues
- No ending system rewrites
- No final summary system overhauls

**Why:** Ending expansion is implementation work, not validation work.

### 3.5 No Playtest Platformization
- No full playtest platform build
- No user research pipeline
- No external tester recruitment
- No analytics instrumentation
- No A/B testing infrastructure

**Why:** Platformization is a separate infrastructure effort. P68 uses bounded, simulation-assisted playtest-style readout only.

---

## 4. Scope Enforcement

### 4.1 How to Recognize Scope Creep

A change is out of scope if it:
1. Adds new runtime content (events, flags, expressions that weren't there before)
2. Builds new systems or mechanics
3. Expands the merchant trilogy beyond P58–P67's boundaries
4. Requires platform or infrastructure work
5. Changes gameplay outcomes (not just how we evaluate them)

### 4.2 What to Do If Scope Creep Is Tempting

If validation reveals a gap that seems to require implementation work:
1. **Document the gap** in the closure report
2. **Flag it as deferred** to a future stage
3. **Do not implement it** in P68
4. **Assess whether it blocks transfer readiness** or can be deferred

### 4.3 P68-007 Safety Valve

Story P68-007 ("Add narrow validation reinforcement if needed") is the only story that may add minimal validation support. Even then:
- It must be read-only or validation-only
- It must not change gameplay outcomes
- It must be the smallest possible addition
- It must be justified by a specific validation gap that blocks the verdict

---

## 5. Relationship to Other Stages

### 5.1 P68 Builds On
- **P58/P59/P61:** Three merchant bridges (implementation complete)
- **P63:** Entry differentiation (implementation complete)
- **P64:** Pressure/payoff flavor (implementation complete)
- **P65:** Player experience reconciliation (analysis complete)
- **P66:** Success-cost differentiation (implementation complete)
- **P67:** Success-shape and recap (implementation complete)

P68 treats all of the above as fixed, completed work. P68 does not reopen or modify them.

### 5.2 P68 Feeds Into
- **P69:** Next route selection — P68's transfer-readiness verdict informs whether the methodology is stable enough to apply to another route

P68's output is a verdict and recommendation, not implementation.

### 5.3 What P68 Is Not
- P68 is not P68-merchant-content-wave
- P68 is not P68-fourth-bridge
- P68 is not P68-playtest-platform
- P68 is not P68-ending-system-overhaul

All of those could be future stages, but they are not this stage.

---

## 6. Validation of Scope

At the end of P68, the following will be verified:
1. No new merchant runtime content was added
2. No new systems were built
3. No bridges were expanded
4. All output is documentation or readout
5. The verdict is based on existing evidence, not new implementation

If any of these are violated, P68 has slipped scope and must be corrected before closure.

---

## 7. Summary

| Category | Allowed? | Examples |
|----------|----------|----------|
| Documentation | ✅ Yes | Audits, contracts, readouts, verdicts, closures |
| Validation scripts | ✅ If minimal | Reuse existing tools first |
| Comparison readout | ✅ Yes | Synthesis of existing evidence |
| Verdict framework | ✅ Yes | Pass/warning/fail criteria |
| New merchant content | ❌ No | Events, chains, endings, NPCs |
| New systems | ❌ No | Economy, map, UI, mechanics |
| New bridges | ❌ No | Fourth origin, new destinations |
| New mixed endings | ❌ No | Ending gates, epilogues, overhauls |
| Playtest platformization | ❌ No | Platform, analytics, external users |

**P68 = validate and synthesize, not implement and expand.**
