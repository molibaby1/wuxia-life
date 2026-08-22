# PRD: Auto Evolution First Skill Behavioral Validation

> Status: RETIRED FROM CURRENT PRIORITY / historical candidate (2026-08-20 strategic calibration)
> Scope: historical behavioral-validation proposal for `repository-grounded-investigation` version 1
> Current authority: **do not execute as the next Auto Evolution stage**; see PD-063 and `docs/governance/current-product-stage.md`
> Implementation / real-run authorization: NOT GRANTED by this document

## 0. Retirement note

This PRD remains as historical design / implementation context. The 2026-08-20 Human strategic calibration changed the default priority: Skill is treated as a reusable packaging of an already accepted working method, and behavioral uplift is not a prerequisite for continued use.

Do not run this comparison by default. Reopen only if later real operation exposes a concrete Skill-quality problem that makes such a comparison worth the cost.

## 1. Introduction

Auto Evolution has already demonstrated that the canonical `repository-grounded-investigation` Skill can be delivered to Solution and Reviewer Participants with matching identity, version, content hash, workspace isolation, and provenance.

That proves delivery mechanics. It does not prove that the Skill materially improves Participant behavior.

This PRD defines one bounded, fresh-problem comparison that asks:

> On the same new Wuxia-Life problem, does assigning `repository-grounded-investigation` version 1 produce more evidence-grounded and auditable Solution or Reviewer work than assigning no Skill?

The experiment compares Skill-off and Skill-on conditions for both Roles. It preserves external judgment as opinion rather than a gold answer, uses a Human-blinded paired review, allows neutral, harmful, and inconclusive outcomes, and stops after Human review.

## 2. Product Alignment

The first-layer Auto Evolution goal is a lightweight, problem-agnostic Agent workflow in which Orchestrator owns workflow and Participants own reasoning.

This validation is worth performing because a Skill that is merely delivered but does not improve useful behavior would add auxiliary-system complexity without reducing product uncertainty. Retaining, revising, or expanding Skill infrastructure therefore requires behavioral evidence rather than delivery success alone.

This PRD does not directly change gameplay. It helps Wuxia-Life decide whether its first reusable Participant working method earns continued maintenance.

Authority references:

- `docs/product/auto-evolution-model.md`
- `docs/governance/product-decisions.md`, especially PD-055 and PD-062
- `docs/governance/project-convergence.md`
- `docs/governance/current-product-stage.md`
- `docs/governance/ai-collaboration-workflow.md`

## 3. Goals

- Produce one bounded Skill-off versus Skill-on behavioral comparison for the Solution Role.
- Produce one bounded Skill-off versus Skill-on behavioral comparison for the Reviewer Role.
- Use a new Human-approved sealed Wuxia-Life problem that was not used by Instance 012 or Instance 013.
- Keep the two conditions identical except for the assigned Skill.
- Preserve canonical Skill identity, version, content hash, assignment, and delivery provenance.
- Let Human review the paired outputs without seeing which condition received the Skill.
- Separate protocol validity from behavioral judgment.
- End with one outcome per Role: `BENEFICIAL`, `NEUTRAL`, `HARMFUL`, or `INCONCLUSIVE`.
- Cap every conclusion to this one fixed fresh problem.

## 4. Experiment Claims

### 4.1 Claims this experiment may support

If the protocol is valid, this experiment may establish:

- how the Skill affected Solution behavior on this fixed problem;
- how the Skill affected Reviewer behavior on this fixed problem;
- whether the first Skill warrants a later, separately authorized refinement or reuse stage;
- whether the current Skill-delivery mechanism preserves isolation and provenance in a paired comparison.

### 4.2 Claims this experiment may not support

This experiment may not establish:

- general Skill effectiveness across arbitrary problems;
- statistical or causal effectiveness beyond this fixed comparison;
- Participant correctness;
- a gold answer for the product problem;
- that one model, runtime, or provider is generally better;
- that new Skills should be created;
- that Skill selection should become automatic;
- that configuration, gameplay, code, or production changes should execute;
- that origin promotion, production retain, or an autonomous loop is authorized.

## 5. Definitions

### 5.1 Conditions

- **Skill-off:** the Participant receives no assigned Skill.
- **Skill-on:** the Participant receives the canonical `repository-grounded-investigation` version 1 content.

The assigned Skill is the only intentional prompt/input difference between the paired conditions for a Role.

### 5.2 Protocol outcome

- **PROTOCOL_VALID:** all four planned Participant jobs complete under the fixed contract, both blind pairs are valid, provenance matches, and no STOP condition is hit.
- **PROTOCOL_STOPPED:** the experiment stops before a valid four-job comparison because of a contract, runtime, provenance, isolation, source, budget, or blinding failure.

`PROTOCOL_STOPPED` is preserved evidence, not permission to tune and rerun.

### 5.3 Behavioral outcome

Human records one outcome for Solution and one for Reviewer:

- **BENEFICIAL:** after unblinding, Skill-on is materially better on at least one preregistered dimension without a material regression or new boundary violation.
- **NEUTRAL:** no material behavioral difference is observed.
- **HARMFUL:** Skill-on is materially worse, more overconfident, less auditable, or more likely to cross a boundary.
- **INCONCLUSIVE:** missing, invalid, confounded, or insufficient evidence prevents a reliable comparison.

These are bounded Human judgments, not gold labels or Participant qualification.

## 6. Fixed Evaluation Design

### 6.1 Fresh source and problem

Before any Participant job:

1. Produce at most one new deterministic Phase 0 run under a create-only root.
2. Validate its seal and read its authoritative `runRef` from the sealed manifest.
3. Human selects and approves one product problem grounded in that run's player-observable evidence.
4. The problem must not be the `family_crisis` Skill smoke problem or another problem already processed by Instance 012 or Instance 013.
5. Freeze one canonical Problem Package before the paired calls.
6. Record its bytes and SHA-256 hash; all four jobs must consume the same Problem Package bytes.

The source is not selected through fallback, discovery, registry, scoring, or filesystem basename inference. If the single run does not provide a suitable problem, stop before all Participant calls.

No Feedback or Improvement Hypothesis Participant job is used to manufacture the evaluation problem. Human problem selection is an experiment-control action, not a new Orchestrator domain capability.

### 6.2 Solution pair

Run two fresh Solution jobs from independent disposable workspaces created from the same authoritative baseline:

1. Solution Skill-off.
2. Solution Skill-on.

Both jobs use the same:

- Participant runtime;
- model;
- reasoning effort;
- execution parameters;
- Problem Package bytes;
- repository baseline fingerprint;
- artifact access;
- read/write permissions;
- output contract;
- timeout;
- retry policy.

The jobs must not share scratch state or see each other's output.

### 6.3 Frozen Reviewer stimulus

Reviewer comparison uses the valid structured `OPTIONS` result from Solution Skill-off as its single frozen Solution input.

This prevents the Solution Skill-on output from contaminating the Reviewer comparison. Both Reviewer conditions receive exactly the same Problem Package and Solution result.

If Solution Skill-off does not complete with a valid `OPTIONS` result:

- do not force Reviewer execution against an invalid or terminal result;
- stop the experiment as `PROTOCOL_STOPPED`;
- preserve completed evidence;
- record both Role outcomes as `INCONCLUSIVE` unless Human determines that only the Solution comparison remains interpretable;
- do not retry, change the problem, or substitute the Skill-on result in the same attempt.

### 6.4 Reviewer pair

If the frozen Reviewer stimulus is valid, run two fresh Reviewer jobs in separate disposable workspaces created from the same authoritative baseline:

1. Reviewer Skill-off.
2. Reviewer Skill-on.

The two jobs use identical runtime, model, reasoning effort, inputs, permissions, contract, timeout, and baseline. The only intentional difference is the assigned Skill.

### 6.5 Human-blinded comparison

Original invocation and provenance artifacts remain create-only and complete.

A separate blinded review package must:

- alias each Role's two outputs independently as Candidate A and Candidate B;
- omit Skill assignment, Skill content, condition name, and other direct condition indicators;
- retain the output content and the evidence needed to inspect its claims;
- keep the create-only blinding key outside the Human review package until the blind verdict is sealed;
- reveal the key only after Human records the paired comparison.

Human compares each pair using these preregistered dimensions:

1. grounding in supplied authority, problem statement, and evidence;
2. independent repository inspection and actual-path tracing;
3. separation of repository facts, evidence observations, inferences, and unknowns;
4. preservation of uncertainty when evidence is insufficient;
5. respect for authority, permission, and execution boundaries;
6. traceability and auditability of supporting references;
7. usefulness of the Solution or Review result for the assigned Role.

Human does not judge agreement with a predetermined product answer.

## 7. Participant and Call Budget

The experiment budget is fixed:

```text
Phase 0 runs: maximum 1
Solution Participant jobs: maximum 2
Reviewer Participant jobs: maximum 2
Total Participant jobs: maximum 4
Retry: 0
Alternate Participant fallback: 0
Feedback Participant jobs: 0
Improvement Hypothesis Participant jobs: 0
Configuration execution: 0
Gameplay modification: 0
Authoritative code execution: 0
Production actions: 0
```

`PROTOCOL_VALID` requires exactly four completed Participant jobs. A stopped attempt may have fewer jobs and must retain the actual count.

No model, runtime, reasoning effort, timeout, prompt wording, Skill content, source, or Problem Package may be tuned after observing an output in the same attempt.

## 8. User Stories

### US-001: Freeze a fresh evaluation source and Problem Package

**Description:** As the Human owner, I want the comparison grounded in one new sealed Wuxia-Life problem so that prior Skill smoke results do not contaminate the evidence.

**Acceptance Criteria:**

- [ ] At most one new deterministic Phase 0 run is produced under a create-only root.
- [ ] The seal validates before any Participant job.
- [ ] Source identity comes from the sealed manifest `runRef`.
- [ ] Human approves one player-observable problem not used by Instance 012 or Instance 013.
- [ ] One canonical Problem Package is frozen and hashed.
- [ ] The package grants no new write or execution authority.
- [ ] If no suitable problem exists, the experiment stops before Participant calls.

### US-002: Make Skill assignment an explicit experiment input

**Description:** As the experiment host, I want Skill-off and Skill-on to be explicit, provenance-bearing inputs so that the comparison does not depend on hidden defaults or workspace manipulation.

**Acceptance Criteria:**

- [ ] Each Solution and Reviewer invocation explicitly records its assigned Skill set.
- [ ] Skill-off records an empty assignment without treating it as a delivery failure.
- [ ] Skill-on loads the canonical Skill artifact from the authoritative workspace.
- [ ] Skill-on records identity, version, canonical path, and content SHA-256.
- [ ] Missing, empty, escaping, non-regular, or hash-inconsistent Skill artifacts fail before Participant execution.
- [ ] The Orchestrator does not inspect the problem domain to choose the condition.
- [ ] Focused tests prove explicit empty and single-Skill assignment behavior.
- [ ] Typecheck passes.

### US-003: Execute the paired Solution comparison

**Description:** As the Human owner, I want two isolated Solution outputs for the same problem so that I can compare behavior with and without the first Skill.

**Acceptance Criteria:**

- [ ] Skill-off and Skill-on use independent disposable workspaces.
- [ ] Both workspaces have the same authoritative baseline fingerprint.
- [ ] Both jobs receive identical Problem Package bytes and permissions.
- [ ] Runtime, model, reasoning effort, timeout, output contract, and retry policy match.
- [ ] Neither job can read the other job's output or scratch state.
- [ ] Actual Participant job count and all terminal outcomes are preserved.
- [ ] No retry or alternate Participant is used.
- [ ] Focused orchestration and workspace-isolation tests pass.
- [ ] Typecheck passes.

### US-004: Execute the paired Reviewer comparison

**Description:** As the Human owner, I want two isolated Reviewer outputs over one frozen Solution result so that Solution variation does not confound Reviewer Skill behavior.

**Acceptance Criteria:**

- [ ] Reviewer stimulus is the valid structured `OPTIONS` output from Solution Skill-off.
- [ ] If that stimulus is unavailable, Reviewer jobs do not run and the protocol stops.
- [ ] Both Reviewer jobs receive identical Problem Package and Solution bytes.
- [ ] Reviewer workspaces are fresh, separate from each other, and separate from both Solution workspaces.
- [ ] Runtime, model, reasoning effort, timeout, output contract, and retry policy match.
- [ ] Actual Participant job count and all terminal outcomes are preserved.
- [ ] Focused Reviewer and fail-closed routing tests pass.
- [ ] Typecheck passes.

### US-005: Produce a blinded Human review package

**Description:** As the Human reviewer, I want condition labels hidden until after comparison so that knowledge of Skill assignment does not determine my judgment.

**Acceptance Criteria:**

- [ ] Solution and Reviewer pairs are independently aliased as Candidate A and Candidate B.
- [ ] The blinded package contains no direct Skill-on or Skill-off indicators.
- [ ] Original complete provenance remains preserved outside the blinded package.
- [ ] The create-only blinding key is withheld until Human seals the blind comparison.
- [ ] Human reviews all seven preregistered dimensions.
- [ ] Human records one bounded outcome for each Role.
- [ ] The unblinded report preserves the blind judgment and the revealed mapping.
- [ ] No gold answer, precision/recall score, or Participant qualification is introduced.

### US-006: Close the experiment without automatic advancement

**Description:** As the Human owner, I want the experiment to stop after review so that one fixed-case result cannot silently authorize further Skill or gameplay work.

**Acceptance Criteria:**

- [ ] Final report distinguishes protocol outcome from both behavioral outcomes.
- [ ] Report states the exact source `runRef`, hashes, runtime/model settings, actual call count, and retry count.
- [ ] Report caps conclusions to this fixed problem.
- [ ] All abnormal or partial evidence is preserved without rerun.
- [ ] Configuration, gameplay, authoritative code, and production execution counts remain zero.
- [ ] No subsequent PRD, `.prd.json`, Skill revision, second Skill, registry, or autonomous loop starts automatically.
- [ ] Human final review is the terminal Gate.

## 9. Functional Requirements

- **FR-1:** The execution host must explicitly provide the fixed sealed source root.
- **FR-2:** Source identity must be read from the validated sealed manifest.
- **FR-3:** The evaluation problem must be new relative to Instance 012 and Instance 013.
- **FR-4:** All four planned jobs must consume the same canonical Problem Package bytes.
- **FR-5:** Skill assignment must be explicit for every invocation; no default, fallback, registry, or domain-based selection is allowed.
- **FR-6:** Skill-on must use canonical content and record delivery provenance.
- **FR-7:** Solution conditions must use independent workspaces from the same baseline.
- **FR-8:** Reviewer conditions must use one frozen Skill-off Solution `OPTIONS` result.
- **FR-9:** Reviewer jobs must not run when the frozen stimulus is absent or invalid.
- **FR-10:** Runtime, model, reasoning effort, permissions, contracts, timeout, and retry policy must match within each pair.
- **FR-11:** Total Participant jobs must not exceed four and retry must remain zero.
- **FR-12:** The blinded package must hide condition identity while preserving reviewable evidence.
- **FR-13:** Human must record Solution and Reviewer outcomes separately.
- **FR-14:** Protocol failure must preserve evidence and stop without tuning or rerun.
- **FR-15:** The experiment must not execute any proposed product change.

## 10. Non-Goals

- No edit to `repository-grounded-investigation` version 1 during this experiment.
- No second Skill.
- No Skill generator, self-modifying Skill, registry, marketplace, recommender, or automatic selector.
- No provider comparison or model benchmark.
- No Feedback or Improvement Hypothesis Participant replacement.
- No change to Problem Package, SolutionWork, SolutionReview, or Decision Router product semantics beyond what is strictly required for explicit experimental Skill assignment.
- No configuration, narrative, gameplay, runtime, framework, Contract, Schema, or production modification.
- No Candidate generation, origin promotion, production retain, or autonomous loop.
- No statistical generalization from one paired fixed-case comparison.
- No automatic conversion of this PRD to `.prd.json`.

## 11. Technical Considerations

### 11.1 Minimal implementation boundary

The smallest acceptable implementation exposes assigned Skills as an explicit invocation input and keeps existing fail-closed canonical loading and provenance behavior.

It must not introduce a generic Skill registry, provider registry, domain classifier, scoring system, or selection framework. Static role assignments remain sufficient outside this bounded experiment unless later evidence proves otherwise.

### 11.2 Tracked-reality precondition

Implementation may start only after the accepted First Skill slice, its tests, and its governance state are reconciled as tracked repository truth on the execution checkout. An untracked Skill artifact, conflicting dirty scope, stale branch, or mismatched authority produces `RECONCILE_FIRST`, not execution.

### 11.3 Artifact integrity

Original invocations, raw outputs, parsed outputs, workspace baseline fingerprints, Skill provenance, hashes, the blinding key, blind review, and unblinded result must be create-only within the experiment root.

Blinded copies are review artifacts, not replacements for original provenance.

### 11.4 Failure semantics

Normal failure outcomes remain valid. The experiment must not fabricate an `OPTIONS` result, Reviewer decision, or behavioral conclusion to complete the four-job shape.

## 12. Success Metrics

### Protocol metrics

- Exactly four completed Participant jobs for `PROTOCOL_VALID`.
- Zero retries.
- Zero alternate Participant fallbacks.
- Matching source, package, baseline, runtime, model, reasoning, permissions, and contract within each pair.
- Matching canonical and delivered Skill provenance in both Skill-on jobs.
- Zero configuration, gameplay, authoritative code, and production executions.
- Valid blind package and sealed pre-reveal Human comparison.

### Behavioral metrics

- One Human outcome for Solution.
- One Human outcome for Reviewer.
- A written comparison across all seven preregistered dimensions.
- Explicit preservation of neutral, harmful, and inconclusive evidence.
- No conclusion stronger than this one fixed fresh-problem comparison.

An outcome of `NEUTRAL`, `HARMFUL`, or `INCONCLUSIVE` does not make the experiment unsuccessful if the evidence is honestly preserved. It prevents automatic advancement.

## 13. Assumptions and Risks

### Confirmed constraints

- Skill is a reusable Participant working method, not a Role, Runtime, authority source, workflow state, or output contract.
- External Participant and Human judgments are not gold answers.
- The current product boundary does not authorize autonomous evolution or execution of product changes.

### Bounded assumptions

- One paired fresh-problem comparison can produce useful fixed-case evidence.
- Keeping the runtime and inputs matched makes the comparison interpretable enough for a bounded Human judgment.
- Human can review outputs without seeing the condition mapping.

### Risks

- A single sample per condition cannot separate Skill effect from ordinary model variance.
- The fresh run may not expose a suitable problem.
- Skill-off Solution may not return `OPTIONS`, preventing Reviewer comparison.
- Output content may reveal the Skill condition indirectly despite label removal.
- A behavior that helps Solution may be neutral or harmful for Reviewer.

These risks cap the claim; they do not authorize more calls, tuning, or retries.

## 14. Conditional Gate Roadmap

The following stages are planning boundaries only. They are not separate PRDs, are not implementation-authorized, and must not be converted to `.prd.json` from this document.

### Gate B: First Skill targeted refinement

Purpose: revise the existing Skill only when PRD-A provides favorable evidence plus one concrete, bounded improvement supported by observed behavior.

Entry conditions:

- PRD-A is `CLOSED / Human accepted`;
- protocol is valid;
- at least one Role is `BENEFICIAL`;
- neither Role is `HARMFUL`;
- Human identifies one specific revision target without changing Skill invariants;
- a new PRD is explicitly authorized.

If both Roles are beneficial and no concrete gap exists, Gate B may be skipped. If evidence is neutral, harmful, or inconclusive, default action is STOP, defer, or retire; it does not automatically authorize repair.

Gate B must validate one Skill revision through a new baseline-versus-revision comparison and stop before any second Skill.

### Gate C: Second Skill candidate

Purpose: consider one additional reusable working method only after repeated evidence shows a distinct gap that the first Skill should not absorb.

Entry conditions:

- the first Skill has favorable evidence on at least two independent product problems;
- the candidate method is supported by repeated failures or repeated manual work across independent problems;
- the candidate is problem-agnostic and does not grant authority or define workflow state/contracts;
- the method cannot be enforced more reliably as deterministic code;
- baseline failure is observed before authoring the Skill;
- a new PRD is explicitly authorized.

Only one new Skill may be developed and behaviorally validated in this stage.

### Gate D: Minimal Skill lifecycle and assignment

Purpose: generalize versioning or Role assignment only when multiple validated Skills make the current static approach measurably insufficient.

Entry conditions:

- at least two Skills have independent behavioral evidence;
- repeated maintenance or assignment problems are observed in real workflow runs;
- static explicit assignment is demonstrably inadequate;
- the proposed mechanism remains problem-agnostic and fail-closed;
- a new PRD is explicitly authorized.

Gate D does not authorize automatic Skill generation, automatic promotion, domain-based selection, autonomous mutation, or a general plugin platform.

### Roadmap STOP rule

Completion of any Gate does not start the next Gate. Each later stage requires fresh repository reconciliation, a separate PRD, explicit Human acceptance, and its own bounded call and STOP policy.

## 15. Open Questions

No unresolved product question remains for drafting this PRD.

The exact future `runRef`, fixed source root, Problem Package hash, model identifier, and blinding aliases are execution artifacts. They must be fixed and recorded before calls under a separately accepted implementation and real-run authorization; they are not placeholders to fill silently during implementation.
