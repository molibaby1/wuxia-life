# Authoring Requirement & Bounded Formal Event Authoring Contract v1

## Status

**HUMAN ACCEPTED — 2026-10-07**  
**Governance authority: active**  
**Deterministic infrastructure: landed / verified**  
**Model-backed execution: paused until PD-125 authorization-flow reconciliation is landed and deterministically verified**

## Authority identifier

~~~text
bounded-formal-event-authoring-v1-20261007
~~~

## Purpose

This design does two things only:

1. separates content-demand origin from downstream authoring capability through a thin Authoring Requirement boundary;
2. approves a second Autonomous Authoring Contract family for one bounded Formal Event.

It does not replace the preschool reference Contract and does not modify the immutable authority bytes or historical proof obligations of `preschool-shared-neutral-passive-capacity-v1@1`.

The first validation Requirement for this family is the Human-approved direction:

> when a player has genuinely formed both sustained cultivation practice and sustained commerce practice, author one meaningful Formal Event in which those two life directions enter the same concrete situation and create coordination, conflict, or tradeoff.

The Requirement defines the life meaning. It does not pre-author the scene, choice text, exact thresholds, or exact effects.

---

## 1. Authoring Requirement boundary

### 1.1 Sources

An Authoring Requirement may originate from exactly two semantic sources:

~~~text
HUMAN_DIRECT
DIAGNOSED_PROBLEM
~~~

`DIAGNOSED_PROBLEM` must trace to the existing Gap Diagnosis / Content Proposal path. Only `CONTENT_GAP` may produce a problem-driven authoring requirement.

`HUMAN_DIRECT` is a positive Human product intent. It does not require a fabricated problem statement or Gap classification.

Discovery channels such as Auto Evolution, tests, traces, or player feedback are provenance for a diagnosed problem; they are not separate authoring authorities.

### 1.2 Minimum semantics

Conceptually:

~~~text
requirementId
source
  kind
  refs[]
authorityRefs[]
target
intent
requiredContext[]
desiredPlayerExperience
scopeConstraints[]
~~~

Rules:

- `source.refs[]` are provenance, not product authority;
- the Requirement describes what product need is accepted, not how JSON must be written;
- exact runtime predicates and numeric effects are downstream Contract / evidence decisions;
- a Requirement does not itself authorize autonomous execution, repository mutation, or promotion.

---

## 2. Contract identity

~~~text
contractId: bounded-formal-event-authoring-v1
version: 1
domain: single bounded Formal Event authoring
execution budget: exactly one new Formal Event per Requirement
~~~

The Contract is Human-approved delegated shadow-authoring authority, subject to applicability, independent semantic conformance, Host mechanical admission, isolated execution, verification, and Human exact-patch promotion.

v1 does not authorize Event chains or a Minimum Event Set greater than one. If one Event is insufficient, the result is `EXECUTION_ENVELOPE_EXCEEDED` or `CONTRACT_CHANGE_REQUIRED` as appropriate.

---

## 3. Semantic Envelope

The authored object must be an existing Formal Event and must be an important life-meaning unit rather than filler.

Every authored Event must explain:

~~~text
Past
→ what real prior state/history makes this Event legitimate now

Present
→ what meaningful situation, conflict, opportunity, or decision occurs

Future
→ what durable result exists; Future Hook may be NONE
~~~

For v1:

- prior evidence must be expressible through existing canonical state, facts, flags, event history, choice history, or other already-authorized prerequisite semantics;
- the Event may be `choice` or `auto`; the author must justify the form;
- transient functional scene roles are allowed;
- stable Person identity, persistent Person facts, or Relationship progression are outside the Contract;
- Story continuity remains concrete history / prerequisites; no generic StoryArc / TaskLine runtime is authorized;
- v1 Future Hook is `NONE`. The Event may still leave ordinary event history and existing-state results, but this Contract does not author a downstream callback Event.

---

## 4. Reference Requirement A

The first validation Requirement is Human-direct.

~~~text
target:
  FORMAL_EVENT

intent:
  add one life Event for a character who has genuinely formed
  both sustained cultivation practice and sustained commerce practice

requiredContext:
  - real prior cultivation practice
  - real prior commerce practice

desiredPlayerExperience:
  the two life directions enter the same concrete situation and create
  coordination, conflict, or tradeoff rather than remaining parallel tracks

scopeConstraints:
  - existing canonical state/history/effects only
  - no persistent Person
  - no new Relationship semantics
  - no new Runtime or Schema
  - no scheduler change
  - no generic Story/Task abstraction
  - no new "cultivation-commerce hybrid identity" system
~~~

The exact eligibility thresholds are not fixed here. They must be derived from current canonical semantics and verified. The Contract must not invent arbitrary thresholds merely to make the Event reachable.

---

## 5. Applicability Gate

Applicability is decided before authoring.

Statuses remain:

~~~text
APPLICABLE
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
CONTRACT_CHANGE_REQUIRED
~~~

A Requirement is `APPLICABLE` only when all are true:

1. target is one Formal Event;
2. the Requirement authority is valid and the core intent is stable;
3. one Event is a minimum sufficient implementation;
4. required past context can be proven with existing canonical semantics;
5. access can be expressed using existing condition / prerequisite capabilities;
6. the Event can use the current Formal Event object shape;
7. the result can use only the v1 allowed effect surface and ordinary event history;
8. no new Person, Relationship semantic, Runtime, Schema, scheduler semantic, Story/Task abstraction, or persistent-state type is required;
9. no existing Event already carries substantially the same life function such that access, scheduling, causality, or presentation is the more appropriate remedy;
10. current authority sources do not conflict.

For a Human-direct Requirement, `INSUFFICIENT_EVIDENCE` means the accepted product need cannot yet be safely mapped onto current canonical mechanics; it does not mean the Human must prove the product has a defect.

---

## 6. Freedom Matrix

| Dimension | v1 authority | Rule |
|---|---|---|
| Object type | `CONTRACT_FIXED` | Existing Formal Event only |
| New Event count | `CONTRACT_FIXED` | Exactly 1 |
| Requirement intent | `CONTRACT_FIXED` | Agent may not reinterpret it |
| Required past semantics | `CONTRACT_FIXED` | Must preserve Requirement meaning |
| Exact prerequisite predicate | `EVIDENCE_DERIVED` | Derive from current canonical semantics |
| Age window | `EVIDENCE_DERIVED` | Must follow prerequisite and life-stage semantics |
| Concrete scene | `AGENT_AUTHORED` | Must serve the Requirement |
| Title / player-facing text | `AGENT_AUTHORED` | Must remain product-consistent |
| `choice` vs `auto` | `AGENT_AUTHORED` | Must be semantically justified |
| Choice count / copy | `AGENT_AUTHORED` | Choices must create real distinction |
| Existing allowed effects | `AGENT_AUTHORED` | Only within §7 allowlist |
| Exact values | `AGENT_AUTHORED` | Must be semantically proportional and verified |
| category / priority / weight | `EVIDENCE_DERIVED` | Use existing catalog conventions; no scheduler change |
| Durable result | `CONTRACT_FIXED` + bounded | Ordinary Event history plus allowed existing-state effects |
| Future Hook | `CONTRACT_FIXED` | NONE in v1 |
| Persistent Person | `FORBIDDEN` | STOP |
| Relationship mutation / progression | `FORBIDDEN` | STOP |
| New fact / flag semantic | `FORBIDDEN` | Event-local new persistent state is not authorized |
| New state / stat / identity system | `FORBIDDEN` | STOP |
| New Runtime / Schema | `FORBIDDEN` | STOP |
| Scheduler / selector change | `FORBIDDEN` | STOP |
| generic Story / Task abstraction | `FORBIDDEN` | STOP |
| retired martial fields | `FORBIDDEN` | PD-010 remains authoritative |

---

## 7. Implementation Envelope

The first v1 execution surface is intentionally narrow.

Allowed production path:

~~~text
src/data/lines/p22-content-expansions.json
~~~

Allowed focused-test path:

~~~text
tests/evolution/boundedFormalEventAuthoring.test.ts
~~~

The shadow authoring patch may modify only those paths.

Allowed effect surface:

- `stat_modify` only on current non-retired canonical player-facing stats;
- `life_state_change` only on existing `trainingHabit`, `studyHabit`, or `businessHabit`;
- `status_add` / `status_remove` using existing canonical status IDs;
- ordinary Event history produced by the existing Event lifecycle.

Forbidden in v1 autonomous authoring:

- new `flag_set` / `flag_unset` semantics;
- fact mutation;
- Person / Relationship effects;
- affiliation / faction mutation;
- wealth / asset mutation;
- random effects;
- special / ending effects;
- generic lifepath mutation;
- new effect types;
- time/scheduler semantics changes.

If a good Event reasonably requires a forbidden capability, the Contract must STOP rather than degrade the design to fit the allowlist.

---

## 8. Verification / Completion Contract

Completion is not “the story sounds good”.

### V1 — Authority integrity

Verify Requirement identity, source provenance, authority references, Contract identity/version, and absence of authority drift.

### V2 — Requirement coverage

The Event must materially satisfy the accepted Requirement. For the reference case, both cultivation and commerce must be true causal inputs to the same situation; superficial wording overlap is insufficient.

### V3 — Past → Present → Future semantics

Verify:

- required past is real and encoded in access;
- the Event is a meaningful life unit;
- if `choice`, choices create genuinely different present results;
- if `auto`, auto resolution is justified;
- durable result is real canonical history/state;
- Future Hook is explicitly NONE.

### V4 — Deterministic mechanical verification

At minimum, the reference Requirement must support deterministic fixtures equivalent to:

~~~text
cultivation satisfied + commerce satisfied → eligible
cultivation satisfied + commerce absent    → not eligible
commerce satisfied + cultivation absent    → not eligible
~~~

Also verify loader validity, condition validity, choice/effect execution, Event history, duplicate ID protection, and write-surface integrity.

### V5 — Result truth

PD-031 / PD-032 / PD-033 remain authoritative:

- result presentation follows actual canonical before/after state;
- pre-choice text does not leak hidden exact effects;
- result copy does not claim unobserved future outcomes.

### V6 — Scope / regression

Verify no Runtime, Schema, scheduler, Person, Relationship, new persistent-state semantic, or forbidden file change occurred; focused regression must pass.

All V1–V6 are required for `SHADOW_AUTHORING_VERIFIED`.

---

## 9. STOP / Escalation Boundary

STOP when any of the following becomes true:

- one Event cannot sufficiently satisfy the Requirement;
- exact canonical prerequisites cannot be established;
- the Event requires a persistent Person or Relationship semantic;
- a new state, stat, fact/flag semantic, identity model, Runtime, Schema, or scheduler semantic is required;
- a generic Story / Task abstraction is required;
- a reasonable design requires effects outside §7;
- an existing Event already supplies the same life function and the actual issue is access, causality, scheduling, presentation, or measurement;
- authority is stale, contradictory, or insufficient;
- the Requirement changes materially during authoring;
- conformance or verification fails.

The correct action is to return to Human / product design or the relevant diagnostic path. The agent must not weaken the Contract to preserve execution.

---

## 10. Shared vs family-specific boundary

The reusable lifecycle across preschool and Formal Event families is:

~~~text
Authoring Requirement
→ Contract identity
→ Applicability
→ Responsibilities
→ family payload
→ independent review
→ Host admission
→ shadow execution
→ verification
→ Human promotion boundary
~~~

Shared concepts may include contract identity, applicability/conformance statuses, Requirement reference, authority/provenance hashes, write-surface admission, and terminal result provenance.

Family-specific semantics must remain local:

- Semantic Envelope;
- Freedom Matrix details;
- authoring Card / payload;
- evidence and applicability proof;
- write paths and execution budget;
- verification / completion algorithm;
- STOP details.

This design does not authorize a generic Contract registry, DSL, plugin system, generic executor factory, or generic trial runner.

---

## 11. Compatibility and migration

The existing preschool v1 proposal/admission/result schemas and historical/reference trial are preserved unchanged.

Do not rewrite the existing `autonomous-authoring-proposal-v1`, `autonomous-authoring-admission-v1`, `shadow-authoring-result-v1`, preschool Contract source, Layer A artifacts, or historical proof semantics merely for architectural uniformity.

Implementation should add a new bounded path for the Formal Event family. A shared v2 envelope may be introduced only where required by the second family; explicit discriminated routing by `contractId + version` is preferred over registry / DSL abstraction.

No requirement exists to migrate preschool onto the new envelope unless future evidence shows a concrete benefit.

---

## 12. First validation strategy

The first implementation validation should use the fixed Human-direct reference Requirement from §4.

It must not run full Auto Evolution, perform new discovery, manufacture a Gap, or depend on HFL activation.

The bounded validation path is:

~~~text
fixed Authoring Requirement
→ applicability
→ proposal
→ independent review
→ Host admission
→ isolated shadow authoring
→ deterministic verification
~~~

This validates the downstream authoring capability independently. A later integration test may connect a diagnosed problem to the same Requirement boundary; that is a separate proof.

Natural product effectiveness remains a post-promotion question and is not proven by shadow success.

### 12.1 PD-125 authorization model

For this Contract, Human authority is semantic rather than digest-driven.

Once the Requirement and Contract are Human accepted and Host proves the current case remains inside the Contract/applicability envelope, the intended model-backed validation flow is continuous:

~~~text
Host automatic freshness preflight
→ Proposal Participant
→ independent Reviewer
→ Host admission
→ isolated shadow execution
→ deterministic verification
→ Human reviews the actual verified patch for authoritative promotion
~~~

The Host must still capture and validate exact repo, authority, evidence, prompt, binding, proposal, review, admission, workspace and result identities. Those hashes/digests are machine provenance and freshness evidence.

The flow must not pause for Human approval of a Gate A / Gate B bare SHA.

Any implementation artifact currently named authorization candidate may remain as a machine manifest if useful, but:

- it must not expose `AWAITING_HUMAN_EXACT_SHA256_APPROVAL` as the normal bounded path;
- it must not require Human to copy or approve a digest before Participant generation;
- it must not require a second digest approval before shadow execution;
- drift during the attempt must still fail closed;
- Contract / Requirement / permission-envelope expansion must still return to Human.

Human exact-patch promotion remains required. “Exact patch” means Human reviews the real candidate content/patch while Host automatically records its exact identity; Human does not approve a hash in isolation.

---

## 13. Explicit non-goals

- no generic Event generator with unconstrained authority;
- no multi-Event autonomous story generation;
- no automatic authoritative commit / push / merge;
- no new Person / Relationship system;
- no new Runtime / Schema;
- no scheduler redesign;
- no generic Contract registry / DSL / plugin framework;
- no rewrite of preschool reference history;
- no requirement that content demand originate from Auto Evolution.
