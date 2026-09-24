# Contract-Constrained Autonomous Authoring v1

## Status

**HUMAN ACCEPTED — 2026-09-24**
**Repository landing: accepted authority baseline**
**Runtime authority: not operative until the required governance reconciliation is landed**
## Authority identifier

```text
contract-constrained-autonomous-authoring-v1-20260924
```

## Implementation baseline

This design was consolidated against:

```text
repository: molibaby1/wuxia-life
branch: dev
HEAD: 6bfab91e45e51383f5119ebaebaa6494c6625fdd
```

## Purpose

This design defines the first bounded path by which Auto Evolution may autonomously turn a confirmed content-capacity problem into a fully authored, implemented, and verified **shadow patch** without changing the authoritative repository.

The objective is not to maximize autonomous execution frequency. The objective is to make one class of product improvement reliably executable under reusable Human-approved authoring authority, so that Auto Evolution can perform contract-preserving content expansion without requiring Human instance-by-instance design.

The first reference domain is:

```text
Preschool Shared-Neutral Passive Capacity Autonomous Authoring Contract v1
```

The v1 reference domain is intentionally narrow. It exists to validate the authority model and execution loop before broader Event, Milestone, Person, origin-specific, or causal-content authoring is considered.

---

## 1. Governance relationship

### 1.1 Current authority before landing

PD-120 remains the operative Content Authoring Workflow authority until this design is reconciled into repository governance.

PD-120 currently permits:

```text
Player-visible signal
→ Gap Diagnosis
→ Content Proposal
→ Draft Authoring Contract
→ Human Approval boundary
```

and explicitly does not authorize AE to auto-author and implement formal content.

This design is the Human discussion contemplated by PD-120's re-discussion condition.

### 1.2 Required governance reconciliation

Before runtime implementation of this design begins, repository governance must land a new Product Decision, expected to be the next available decision number after current `PD-120`, and update the canonical Content Authoring Workflow Contract accordingly.

The governance landing must make the following relationship explicit:

```text
PD-120 default rule remains:
instance-level Human Approval before authoritative content implementation

EXCEPT:
Human-approved Autonomous Authoring Contract
+ contract applicability proven
+ shadow-only execution
→ AE may author + implement + verify in an isolated workspace
```

This exception does **not** authorize authoritative repository modification.

Until that reconciliation is committed, this design is non-operative and must not be used to bypass PD-120.

### 1.3 Preserved authorities

This design does not weaken:

- PD-111 player-observable / diagnostic evidence boundaries;
- PD-118 Source-local Candidate Pool / source-change semantics;
- PD-119 fail-closed failure containment outside specifically authorized behavior;
- repository baseline and fingerprint integrity rules;
- Human authority over authoritative repository promotion;
- specific domain Contracts such as Person Domain, Parenthood, bounded archetype, Milestone, and relationship quarantine authorities;
- PD-120's seven-category Gap taxonomy; this design adds no eighth top-level Gap category.

---

## 2. Core distinction: contract-preserving vs contract-changing work

The previous conversational shorthand “量变 / 质变” is operationalized as follows.

### 2.1 Contract-preserving expansion

```text
Contract-preserving expansion
=
all product semantics required by the proposed change
are already covered by a current Human-approved Autonomous Authoring Contract

AND

the instance does not require adding, modifying, or reinterpreting:
- product semantics
- the authoring Contract itself
- Schema
- Runtime abstraction
- permission boundary
- verification standard
```

The size of the patch does not define this category.

A larger content-only patch can remain contract-preserving if every instance is inside the approved Contract. A one-line change is contract-changing if it creates a new product rule.

### 2.2 Contract-changing work

```text
Contract-changing work
=
solving the problem requires semantic or technical authority
that the current Autonomous Authoring Contract does not already grant
```

Examples include needing a new persistent Person concept, a new relationship model, a new player state, a new selector semantic, a new Schema field, a new Story runtime, or a changed verification standard.

Contract-changing work must not be forced through an autonomous authoring lane.

### 2.3 Boundary movement over time

The boundary is intentionally evolvable.

A class of work that is contract-changing today may become contract-preserving later only after:

1. its semantics are independently designed and Human approved;
2. a reusable Contract exists;
3. real execution evidence shows that the Contract is sufficiently precise;
4. delegated autonomous authority is explicitly granted.

Authority expansion must therefore happen by improving the Contract surface, not by weakening STOP behavior.

---

## 3. v1 authority model

### 3.1 Delegated Authoring Authority

Human authority is delegated at the reusable Contract level, not at the individual content instance level.

A Human-approved Autonomous Authoring Contract consists conceptually of:

```text
Semantic Envelope
+ Applicability Gate
+ Allowed Degrees of Freedom
+ Structural Envelope
+ Side-effect Envelope
+ Required Verification
+ STOP / Escalation Conditions
```

A Reviewer does not create authority merely by accepting a proposal.

Autonomous execution is allowed only when:

```text
Human-approved reusable Contract exists
+
current case is proven applicable
+
proposed instances conform to the Contract
+
Host mechanical gates pass
```

### 3.2 Shadow-only authority

v1 authorizes autonomous work only inside an isolated mutable workspace.

Allowed:

- decide evidence-derived content responsibilities;
- author concrete content instances;
- create a real patch in the isolated workspace;
- add focused tests within the Contract write surface;
- run tests and deterministic validators;
- produce an immutable promotion package.

Forbidden:

- commit to the authoritative branch;
- push;
- merge;
- mutate the authoritative working tree;
- modify governance authority;
- modify the Autonomous Authoring Contract during the same execution;
- write outside Contract-authorized paths;
- silently broaden Runtime, Schema, state, or product semantics.

### 3.3 Promotion remains Human-controlled

`SHADOW_AUTHORING_VERIFIED` means:

> AE produced an exact, verified patch that is eligible for Human promotion review.

It does not mean:

> the product has been modified.

Authoritative promotion remains a separate, explicit Human-authorized operation in v1.

---

## 4. Architectural approach

v1 reuses the existing Problem → Solution → Reviewer → Decision workflow instead of building a parallel “Content AE”.

Conceptual flow:

```text
Source-local Candidate
→ existing investigation / Problem Package
→ Solution / Authoring Agent
→ existing independent Reviewer
→ Host contract gate
→ READY_FOR_SHADOW_AUTHORING
→ isolated Shadow Authoring Executor
→ Host independent verification
→ SHADOW_AUTHORING_VERIFIED
→ durable Promotion Package
→ Human PROMOTE_EXACT_PATCH / DEFER / REJECT
```

The design intentionally does not build:

- a second Candidate lifecycle;
- a second content-specific AE orchestrator;
- a generic executor plugin framework;
- a contract registry;
- a promotion database or queue;
- a new reasoning Role solely for content authoring.

The existing Solution and Reviewer roles remain the reasoning roles. New autonomous-authoring information must be expressed as bounded structured companion semantics, not as a separate parallel workflow.

---

## 5. Autonomous Authoring Contract model

Every autonomous authoring Contract must contain seven logical sections.

### 5.1 Contract Identity & Authority

Required semantics:

```text
contractId
version
status
domain
authorityRefs[]
Human approval provenance
```

The Contract is delegated execution authority; it does not duplicate all upstream product semantics.

A given `contractId + version` is immutable once active. Any semantic change to the delegated envelope requires a new Contract version and Human approval; the runtime must not silently reinterpret an existing version.

If an authority reference is superseded or changes incompatibly, the Contract must fail closed as stale until Human revalidation.

v1 does not require a generic contract registry. The runtime may directly support the single approved reference Contract by stable identity.

### 5.2 Applicability Gate

Applicability must be established before formal content authoring begins.

The sequence is mandatory:

```text
Problem evidence
→ Contract applicability assessment
→ only APPLICABLE may enter autonomous authoring
```

It is forbidden to generate content first and retroactively claim that the result fits the Contract.

Applicability statuses:

```text
APPLICABLE
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
CONTRACT_CHANGE_REQUIRED
```

Meanings:

- `APPLICABLE`: the confirmed problem can be addressed entirely inside this Contract.
- `NOT_APPLICABLE`: this Contract is not the correct authority for the problem.
- `INSUFFICIENT_EVIDENCE`: evidence cannot reliably establish the required preconditions.
- `CONTRACT_CHANGE_REQUIRED`: a reasonable solution requires authority outside the current Contract.

`EXECUTION_ENVELOPE_EXCEEDED` is a separate execution-eligibility outcome after applicability; it means the case is semantically inside the Contract but exceeds the pilot execution budget.

### 5.3 Semantic Envelope

The Contract defines what kind of content it authorizes and what product role that content may play.

The Semantic Envelope is Human-readable authority. It must not be reduced to field validation alone.

### 5.4 Freedom Matrix

Every relevant design dimension is classified as one of:

```text
CONTRACT_FIXED
EVIDENCE_DERIVED
AGENT_AUTHORED
FORBIDDEN
```

The purpose is to distinguish delegated creative freedom from locked product semantics.

### 5.5 Implementation Envelope

The Contract defines the exact production and test write surface, permitted object shape, forbidden fields/capabilities, and whether any Runtime or Schema modification is allowed.

Host enforcement, not prompt obedience, owns this boundary.

### 5.6 Verification / Completion Contract

Every Contract must define how the system proves that the proposed minimum content set addresses the already-established problem envelope.

The Contract must not use “feels sufficient” or a fixed content-count quota as completion criteria.

### 5.7 STOP / Escalation Boundary

Every Contract explicitly lists conditions requiring STOP rather than creative workaround.

Typical boundaries include:

- new Schema;
- new Runtime abstraction;
- modified scheduling semantics;
- new persistent state;
- Person or Relationship semantics not already authorized;
- unresolved authority conflict;
- insufficient evidence;
- execution budget exceeded;
- failed conformance or verification.

---

## 6. Evidence and PD-111 boundary

Autonomous authoring must not broaden Participant access to raw Phase 0 internals.

### 6.1 Preserved Participant boundary

Feedback / Hypothesis continue to consume player-observable evidence under existing rules.

Solution / Reviewer continue to receive only repository authority, permitted artifacts, and bounded diagnostics. Raw `internal/player-surface-source.json` remains Participant-forbidden.

### 6.2 Host-owned applicability verification

v1 does not create a new Participant-facing diagnostic type and does not extend PD-111's current passive causal-attribution payload.

The Host may independently verify contract preconditions using authority and internal evidence it is already trusted to access, but any such Host-only fact remains outside Participant workspaces unless it is already permitted by current evidence authority.

For the preschool reference Contract, Host-only checks may establish facts such as:

```text
whether an actual generic gap occurred only after whole-pool exhaustion
whether legal authored capacity remained at a gap point
whether canonical-origin isolation was preserved
whether the structural demand / capacity arithmetic used by the Contract is correct
```

These checks are execution/admission gates, not new evidence granted to Solution or Reviewer.

Solution / Reviewer must reason from their existing permitted player-observable evidence, repository authority, and already-authorized diagnostics. Raw internal passive provenance remains forbidden.

If a Participant cannot responsibly establish its applicability claim from the evidence it is allowed to see, it must use `INSUFFICIENT_EVIDENCE`. If Host-only verification contradicts an `APPLICABLE` claim, shadow execution is denied.

If future natural cases repeatedly require new participant-visible derived facts to make this lane useful, that is an explicit trigger to reconsider PD-111 rather than silently expanding it here.

---

## 7. Separation of applicability, conformance, and effectiveness

These three judgments are independent.

```text
Applicability
= can this confirmed problem be solved inside the Contract?

Conformance
= did the authored instances and shadow implementation obey the Contract?

Effectiveness
= after authoritative promotion, did natural player-visible experience improve?
```

A case may be:

```text
APPLICABLE
+ CONFORMING
+ Natural PVER still poor
```

The correct response is to return to Gap Diagnosis. It is not automatic authorization to generate more content.

---

# Part II — Reference Contract

## 8. Preschool Shared-Neutral Passive Capacity Autonomous Authoring Contract v1

### 8.1 Contract identity

```text
contractId: preschool-shared-neutral-passive-capacity-v1
version: 1
status: ACTIVE only after governance landing
```

### 8.2 Domain

This Contract applies only to:

```text
ages 4–7
preschool packed passive experience
shared-neutral authored capacity / semantic variety
existing PassiveNarrativeEntry
existing unified legal candidate pool
```

It does not authorize origin-specific authoring, Formal Event authoring, Person authoring, Milestone authoring, or causal content sequences.

### 8.3 Applicability requirements

A case is `APPLICABLE` only when all of the following hold:

1. Formal Gap Diagnosis is `CONTENT_GAP / CONTENT_CAPACITY_GAP`.
2. The player-visible problem belongs to the 4–7 preschool packed passive experience.
3. Existing unified-pool scheduling semantics are correct for the evidence under review.
4. Existing legal authored content is not being skipped while a generic gap is selected.
5. Canonical origin isolation is not the root problem; foreign-origin leakage is not driving the symptom.
6. Measurement/provenance is sufficient to establish whole-pool capacity or semantic-variety insufficiency within the evidence envelope.
7. Access, Causality, Scheduling, Presentation, and Measurement are not a sufficient root-cause explanation.
8. The required additional experiences can be expressed as shared-neutral passive childhood experiences.
9. Existing `eventHistory` authored IDs are sufficient as the durable result.
10. No new selector, scheduler, Schema, state, choice, prerequisite, Person, Relationship, Milestone, or Runtime abstraction is needed.
11. The production implementation can remain catalog-only.

If any required condition is unknown, applicability is `INSUFFICIENT_EVIDENCE` rather than optimistic `APPLICABLE`.

### 8.4 `NOT_APPLICABLE` examples

Examples include:

- evidence specifically supports an origin-exclusive content deficit;
- the problem is an age band outside 4–7;
- the problem belongs to Formal Event continuity rather than passive childhood variety;
- the requested content requires a meaningful player choice;
- the problem is primarily Presentation or Scheduling.

`NOT_APPLICABLE` does not mean the work is necessarily contract-changing. Another future Contract may cover it.

### 8.5 `CONTRACT_CHANGE_REQUIRED` examples

Examples include needing:

```text
persistent Person identity
Relationship progression
new prerequisite semantics
new player state
new selector or scheduler behavior
new choice semantics
new Story / Task abstraction
new Schema field
new verification authority
```

These conditions must not be disguised as shared-neutral passive content.

---

## 9. Evidence decomposition and Minimum Sufficient Responsibility Set

The Contract must not hardcode the historical five second-round life functions as reusable answers.

The authoring sequence is:

```text
confirmed capacity-gap evidence
+
current shared-neutral catalog semantic inventory
+
player-visible repeated / missing experience evidence
↓
identify distinct missing childhood life functions
↓
remove functions already adequately represented
↓
merge semantic duplicates
↓
derive Minimum Sufficient Responsibility Set
```

The output is a set of evidence-derived responsibilities, not a requested number of entries.

Each new entry must correspond to exactly one primary responsibility.

If two proposed responsibilities are naturally the same semantic responsibility, they must be merged before authoring rather than hidden inside one overloaded vignette.

### 9.1 Completion predicate

Both conditions below must be satisfied.

#### Semantic Coverage

```text
every evidence-derived missing responsibility
is carried by exactly one proposed primary entry

AND

no proposed entry exists merely for generic “more variety”

AND

no proposed responsibility is a semantic duplicate of existing authored content
```

#### Evidence-Bounded Capacity Adequacy

Against the fixed chronology/evidence that established the current Gap:

```text
apply proposed age windows + shared-neutral eligibility
reconstruct legal unconsumed capacity

→ the proposed set must eliminate the already-proven structural deficit
```

This only proves adequacy for the established evidence envelope. It does not prove future natural effectiveness.

### 9.2 Pilot execution budget

```text
maxNewEntriesPerShadowExecution = 8
```

Eight is a safety budget, not a content-design target.

If the evidence-derived Minimum Sufficient Responsibility Set requires more than eight entries:

```text
EXECUTION_ENVELOPE_EXCEEDED
→ Human review
```

The system must not truncate to eight or split the same case into multiple autonomous batches to bypass the limit.

---

## 10. Preschool Freedom Matrix

| Dimension | v1 authority | Rule |
|---|---|---|
| Object type | `CONTRACT_FIXED` | Existing `PassiveNarrativeEntry` only |
| Production catalog | `CONTRACT_FIXED` | `src/data/lines/preschool-passive-spine.json` |
| Domain | `CONTRACT_FIXED` | 4–7 shared-neutral preschool passive |
| Primary responsibility | `EVIDENCE_DERIVED` | From Missing Life Function decomposition |
| Entry count | `EVIDENCE_DERIVED` | Minimum Sufficient Responsibility Set, max 8 |
| `id` | `AGENT_AUTHORED` | Namespace and uniqueness rules apply |
| `title` | `AGENT_AUTHORED` | Player-facing memory title |
| `text` | `AGENT_AUTHORED` | Compact child-scale vignette |
| concrete scene | `AGENT_AUTHORED` | Must serve the accepted responsibility |
| `originTags` | `CONTRACT_FIXED` | Exact `['neutral']` |
| `ageMin` | `EVIDENCE_DERIVED` | Integer 4..7, justified by developmental fit and evidence |
| `ageMax` | `CONTRACT_FIXED` | Exact `7` |
| `statDeltas` | `FORBIDDEN` | Must be absent |
| `flags` | `FORBIDDEN` | Must be absent |
| meaningful choice | `FORBIDDEN` | Passive experience only |
| new prerequisite | `FORBIDDEN` | Must not be introduced |
| Person / Relationship | `FORBIDDEN` | Other actors remain transient roles |
| Milestone | `FORBIDDEN` | No authored Milestone semantics |
| future hook | `CONTRACT_FIXED` | `NONE` |
| durable result | `CONTRACT_FIXED` | Existing `eventHistory` authored ID only |
| selector / scheduler | `FORBIDDEN` | No change |
| Schema / GameState | `FORBIDDEN` | No change |
| Runtime abstraction | `FORBIDDEN` | No change |

### 10.1 Age semantics

`ageMin` must answer:

```text
why is this not appropriate earlier?
why is it appropriate from this age?
why does it remain appropriate through age 7?
```

Capacity pressure alone is not a valid reason to move `ageMin` earlier.

v1 deliberately fixes `ageMax = 7`. A concept that naturally stops earlier than age 7 is outside this first Contract rather than a reason to broaden the Contract during execution.

---

## 11. Entry Authoring Card

Every proposed entry must have a structured authoring card before JSON implementation.

Required semantics:

```text
Responsibility ID
Primary Life Function
Player-visible Need
Developmental Age Justification
Concrete Scene Concept
Existing-content Distinction
Actor / Role Boundary
Past Evidence Consumed
Meaningful Player Decision
Durable Result
Future Hook
Origin Portability
Scope Check
Proposed ID
Proposed Title
Proposed Text
```

### 11.1 Fixed values for this Contract

```text
Past Evidence Consumed: NONE
Meaningful Player Decision: NONE
Durable Result: existing eventHistory authored ID
Future Hook: NONE
originTags: ["neutral"]
```

### 11.2 Shared-neutral portability

The scene must plausibly occur across all current canonical birth origins.

A shared-neutral entry must not secretly depend on merchant, scholar, martial, frontier, or another exclusive origin circumstance.

Generic transient roles such as family member, caregiver, familiar adult, several children, playmate, neighbor, or passerby are allowed when the scene does not require stable identity.

If the responsibility naturally requires origin-specific context, this Contract is `NOT_APPLICABLE` to that responsibility.

### 11.3 Existing-content distinction

Each Card must identify the closest existing authored entry or entries and explain the semantic distinction.

A difference only in location, prop, weather, actor label, or wording is not sufficient.

If no meaningful life-function distinction exists, the proposal is a semantic duplicate and must fail conformance.

### 11.4 Non-filler tests

Every entry must satisfy all of:

1. **Responsibility Test** — it serves an evidence-derived missing life function.
2. **Concrete Experience Test** — it presents a specific childhood event, not a generic growth summary.
3. **Meaning Test** — the moment contains an age-appropriate experiential change such as understanding, responsibility, adaptation, repair, participation, attempt, or recovery.
4. **Distinction Test** — it is not a reskin of existing content.
5. **No-System-Invention Test** — it does not require unapproved mechanics to make the text true.

### 11.5 Actor / role boundary

Other people in v1 entries are `TRANSIENT_ROLE` only.

Forbidden:

- proper-name creation;
- stable identity commitments;
- relationship progression;
- durable person facts;
- presentation that requires later recognition of the same person.

If the life function cannot be expressed without a persistent person, the result is `CONTRACT_CHANGE_REQUIRED`.

### 11.6 ID rule

```text
preschool_neutral_<semantic_slug>
```

Requirements:

- repository-wide unique;
- semantic slug reflects the life function rather than a prop;
- no `filler`, `extra`, `capacity`, numeric-only, or batch-style naming;
- the ID becomes stable identity for the shadow proposal after semantic acceptance.

### 11.7 Title rule

The title must be concise, player-facing, and memory-like.

It must not be a taxonomy label such as “公平意识形成” and must not imply an unearned identity or permanent state.

### 11.8 Text rule

The text must be one compact second-person vignette with one primary situation and one primary responsibility.

It must remain child-scale, shared-neutral, and free of system terminology.

The text must not assert unauthorized durable consequences such as “from then on you became brave”, “you gained neighborhood reputation”, or “this permanently improved your social ability”.

---

## 12. Mechanical conformance for the reference Contract

The Host must independently validate at least:

```text
newEntryCount <= 8

for every new entry:
- id starts with preschool_neutral_
- id is globally unique
- originTags is exactly ["neutral"]
- ageMin is an integer from 4 through 7
- ageMax is exactly 7
- keys are exactly:
  id, title, text, originTags, ageMin, ageMax
- statDeltas absent
- flags absent

catalog mutation:
- every pre-existing entry preserves the same ID, field set, field values, title, text, age bounds, origin tags, and optional effects
- no existing entry deletion
- no existing entry rename
- new rows appended only
```

Production diff must be catalog-only.

For the reference Contract, the only production path is:

```text
src/data/lines/preschool-passive-spine.json
```

The initial focused-test write surface is limited to:

```text
tests/preschoolPassiveSpineTests.ts
tests/annualPassiveMemoryTests.ts
```

Any need to modify additional production or test files must STOP the v1 shadow execution and return for explicit scope review rather than silently expanding `allowedWritePaths`.

---

## 13. Semantic conformance

Mechanical validation is necessary but insufficient.

The same independent Reviewer role must establish semantic conformance before shadow execution can become eligible.

The review must cover:

- the responsibility is evidence-derived;
- the scene actually carries that responsibility;
- the developmental age is defensible;
- the entry is shared-neutral;
- the entry is not a semantic duplicate;
- transient roles have not become Persons;
- danger / trauma remains within the Contract scope;
- no new durable state is implied;
- the entry is not filler;
- the proposal does not require contract-changing mechanics.

The implementation must use a structured, domain-neutral authoring assessment rather than infer execution authority from free-form reviewer prose.

The design does not require a new Reviewer Role. The existing Reviewer produces or validates the required structured authoring assessment.

---

# Part III — Shadow Execution

## 14. Separation of authoring from execution

The Solution / Authoring Agent owns product authoring.

The Shadow Executor owns exact implementation of an already accepted Authoring Instance.

The Executor must not rewrite accepted content.

Conceptual sequence:

```text
Solution authors responsibilities + exact Cards
→ Reviewer accepts semantic instance
→ Host authoring gate passes
→ Executor implements exactly those accepted Cards
```

If implementation requires changing an accepted Card, the Executor must STOP. It may not silently revise product semantics.

---

## 15. Autonomous Authoring Instance

Before execution, the system must have an immutable structured instance containing at least:

```text
contractId
contractVersion
authorityRefs
source evidence refs
applicability = APPLICABLE
responsibilities[]
authoringCards[]
review outcome
allowedWritePaths
required verification
execution budget
```

The exact wire schema may be designed during implementation planning, but it must remain domain-neutral enough that future Contracts can reuse the lifecycle without embedding preschool-specific fields in the generic Decision contract.

The implementation should prefer a bounded companion artifact over turning generic `SolutionWork` into a preschool-specific schema.

---

## 16. Decision routing

A new positive route is required conceptually:

```text
READY_FOR_SHADOW_AUTHORING
```

It is available only when all of the following are true:

```text
Solution has a valid autonomous-authoring instance
Reviewer accepts the selected option
Reviewer structured authoring assessment is conforming
Contract identity/version is current
applicability == APPLICABLE
execution budget is within Contract envelope
Host mechanical pre-execution gates pass
```

The route must not be produced from `ACCEPT_OPTION` alone.

Non-positive mappings:

```text
NOT_APPLICABLE
→ existing ordinary routing; no shadow authority

INSUFFICIENT_EVIDENCE
→ DEFER

CONTRACT_CHANGE_REQUIRED
→ ESCALATE_HUMAN

EXECUTION_ENVELOPE_EXCEEDED
→ ESCALATE_HUMAN
```

A future implementation may choose exact reason-code names, but the distinctions above are normative and must remain visible in durable evidence.

---

## 17. Workspace model

Shadow execution reuses the existing isolated workspace / fingerprint model.

Required topology:

```text
authoritative repository
        │
        │ materialize + fingerprint
        ▼
isolated mutable shadow workspace
        │
        ├─ write inside Contract path boundary
        ├─ run focused verification
        └─ produce exact patch evidence
```

Host, not Participant prompt compliance, enforces write scope.

Authoritative repository fingerprint must be captured before and after shadow execution and must remain identical.

Any authoritative-root mutation invalidates the result and fails closed.

---

## 18. Canonical change set

The Host must derive the actual change set by comparing workspace baseline and final workspace state.

Participant-reported `changedFiles` is diagnostic only and has no authority.

The canonical change set must preserve enough data to establish at least:

```text
path
change type
before SHA-256
after SHA-256
```

A deterministic human-readable patch must be generated from the canonical change set.

For the preschool Contract, catalog mutation must be append-only and existing entries must remain unchanged.

---

## 19. Verification layers

`SHADOW_AUTHORING_VERIFIED` requires all five verification layers.

### V1 — Authority Integrity

Verify:

- authoritative repository unchanged;
- exact Contract ID/version active;
- authority references still valid/current;
- repository baseline matches the session baseline.

### V2 — Scope / Mechanical Conformance

Verify:

- all changed paths are allowed;
- production diff is catalog-only;
- entry count is within budget;
- exact allowed keys / ages / neutral tags;
- forbidden fields absent;
- accepted Cards and implemented entries match exactly;
- existing catalog rows unchanged.

### V3 — Semantic Conformance

Verify the accepted structured Reviewer authoring assessment contains no unresolved semantic blocker.

No post-execution semantic reinterpretation may silently expand the accepted design.

### V4 — Regression Verification

The shadow result must include strong regression evidence.

For the accepted focused tests:

```text
new tests + baseline production catalog
→ RED for the intended missing-authoring reason

same tests + shadow implementation
→ GREEN
```

Then run adjacent preschool/passive regressions and TypeScript typecheck.

A RED caused by syntax, import, path, fixture, or unrelated failure does not satisfy regression proof.

The Host, not only the Executor, must evaluate the RED/GREEN evidence and rerun the final deterministic verification commands.

### V5 — Evidence-Bounded Completion

Re-run the deterministic capacity reconstruction against the fixed evidence that established the Gap.

The shadow proposal must eliminate the proven structural deficit without changing scheduler, selector, Schema, or Runtime behavior.

V5 is not a Natural PVER and must not be reported as natural effectiveness.

---

## 20. Shadow terminal states

The v1 authoring lane must distinguish at least:

```text
SHADOW_AUTHORING_VERIFIED
SHADOW_AUTHORING_EXECUTION_FAILED
SHADOW_AUTHORING_CONFORMANCE_FAILED
SHADOW_AUTHORING_VERIFICATION_FAILED
CONTRACT_CHANGE_REQUIRED
EXECUTION_ENVELOPE_EXCEEDED
```

These distinctions must remain observable rather than collapsing into a generic “failed” or `ESCALATE_HUMAN` explanation.

### 20.1 Failure containment

v1 does not broaden PD-119 fail-closed recovery semantics.

Unexpected executor runtime failure, scope violation, authoritative repository mutation, workspace/provenance integrity failure, or verification infrastructure failure continues to fail closed for the active workflow/session unless separately authorized in a later Product Decision.

`CONTRACT_CHANGE_REQUIRED` and `EXECUTION_ENVELOPE_EXCEEDED` are intentional routed outcomes, not infrastructure failures.

---

## 21. Candidate / Session lifecycle interaction

A successful shadow execution is not a source change.

Therefore:

```text
SHADOW_AUTHORING_VERIFIED
!= authoritative source transition
```

It does not:

- trigger the PD-118 source-change barrier;
- create a new Phase 0 source;
- supersede PENDING candidates in the current Source Epoch;
- alter repository baseline;
- consume the Logical Session's one authoritative source-changing transition.

After a successful shadow candidate reaches its terminal shadow disposition, Host may continue normal candidate-boundary scheduling.

A successful `SHADOW_AUTHORING_VERIFIED` result does not create a Human Follow-up item. Existing HFL creation remains tied to formal `ESCALATE_HUMAN`. `CONTRACT_CHANGE_REQUIRED` and `EXECUTION_ENVELOPE_EXCEEDED` may use that existing escalation path; success does not.

If Human later promotes the patch, repository baseline changes. Any old Logical Session resume must then obey the existing exact repository-baseline mismatch rule and must not silently continue on the old source.

### 21.1 Host job budget

Shadow execution adds one workspace-capable execution Participant job to the maximum legal lane.

PD-118's existing per-Host-slice Participant job ceiling remains unchanged in v1.

Candidate admission must reserve enough remaining budget to complete the maximum legal lane including the possible shadow execution job. v1 must not start a Candidate and then pause mid-candidate merely because the new execution job was not budgeted.

If real operation shows this materially harms throughput, budget policy may be reviewed later with natural evidence.

---

# Part IV — Promotion

## 22. Shadow Authoring Promotion Package

A successful result produces one durable, self-contained Promotion Package.

v1 does not create a new promotion database, queue, dashboard, or work-item lifecycle.

The package must contain at least:

```text
problem / Gap summary
why the case matched this Contract
contract ID/version + authority refs
source evidence identity
responsibilities derived by AE
accepted Authoring Cards
exact new IDs / titles / texts / ages
canonical changed-file set
immutable exact patch
patch SHA-256
mechanical conformance result
semantic conformance result
RED → GREEN evidence
adjacent regression / typecheck evidence
evidence-bounded capacity before / after
authoritative repository integrity result
deviations / unresolved uncertainty
explicit statement that Natural PVER is not yet performed
```

The ordinary run report may link to the package. The report does not become promotion authority.

---

## 23. Human promotion outcomes

v1 defines exactly three Human outcomes:

```text
PROMOTE_EXACT_PATCH
DEFER
REJECT
```

### 23.1 Exact-patch semantics

Promotion approval is approval of the exact verified patch identity.

If Human requests any content or code edit, the verified patch is no longer the promoted artifact.

The correct flow is:

```text
original shadow result not promoted
→ revision / new shadow result
→ new verification
→ new patch hash
```

v1 does not need to automate this revision loop.

### 23.2 No autonomous Git promotion in v1

Even after `PROMOTE_EXACT_PATCH`, AE does not commit or push.

The patch may be applied through the project's existing explicit Human-authorized implementation path, for example by Codex executing the exact approved patch.

Autonomous authoritative repository promotion is a separate future authority question.

---

## 24. Natural effectiveness after promotion

After authoritative promotion and normal semantic verification, the project returns to natural sealed observation.

Natural PVER answers whether the player-visible problem actually improved.

A successful shadow result establishes:

```text
engineering correctness
+ contract conformance
+ evidence-bounded adequacy
```

It does not establish:

```text
case-level natural effectiveness
initial natural effectiveness
generalized / long-run effectiveness
```

If Natural PVER fails, return to PD-120-style Gap Diagnosis. Do not automatically generate more content.

---

# Part V — Reference validation strategy

## 25. Historical contamination-controlled reference trial

The first implementation must prove the mechanism on the completed preschool residual-capacity case without giving the Agent the historical Human answer.

### 25.1 Reference baseline

Use the pre-second-round-authoring implementation baseline:

```text
e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf
```

and the already-established fixed evidence from:

```text
runRef: preschool-pver-20260922231805-71297571
confirmed result:
CONTENT_GAP / CONTENT_CAPACITY_GAP
26 authored beats / 30 demanded beats
4 structural generic gaps
whole legal pool exhausted at each actual gap
```

The trial does not rerun natural AE or manufacture new evidence.

### 25.2 Answer-contamination exclusion

The Participant workspace for the reference trial must be materialized from the historical pre-second-round source snapshot rather than copied from current `dev`, because current `dev` already contains the later answer-bearing catalog rows and design material.

The Participant workspace for the reference trial must not contain or receive:

- the 2026-09-23 residual five-entry Human-approved design as an answer source;
- the later committed second-round five catalog rows;
- later PVER handoffs that reveal which entries Human ultimately selected;
- an answer fixture enumerating fairness / self-directed project / stand-for-peer / farewell / neighborhood-help as required outputs.

The trial may receive:

- the new Human-approved Autonomous Authoring Contract;
- relevant pre-second-round product authorities;
- the pre-second-round catalog;
- the fixed gap evidence necessary for applicability;
- current Contract-safe method instructions.

### 25.3 Reference success criterion

The historical reference trial does **not** require reproduction of the exact historical five entries.

Success requires:

```text
Applicability = APPLICABLE
Minimum Sufficient Responsibility Set derived without answer leakage
new entry count <= 8
all proposed entries conform mechanically and semantically
shadow implementation is catalog-only
evidence-bounded structural deficit is eliminated
RED → GREEN regression proof succeeds
authoritative repository remains unchanged
Promotion Package is produced
Human can evaluate the package without supplying instance-level content design
```

This establishes controlled mechanism capability, not natural production effectiveness.

---

## 26. Natural activation requirement

After the controlled reference trial succeeds, stop tuning the historical case.

Return to ordinary natural full-flow observation.

The next effectiveness question is:

> when a new natural candidate genuinely falls inside an approved Autonomous Authoring Contract, does the lane activate and produce a useful `SHADOW_AUTHORING_VERIFIED` package without Human instance-level design?

No target event should be forced merely to generate a success sample.

---

# Part VI — Explicit non-goals

## 27. v1 does not authorize

- autonomous commit / push / merge;
- automatic authoritative catalog modification;
- generic Event authoring;
- origin-specific preschool authoring;
- Person authoring or a Person generator;
- Milestone authoring;
- causal Story / Task generation;
- generic StoryArc / TaskLine runtime;
- new player state or Schema;
- scheduler / selector redesign;
- new relationship semantics;
- a generic contract DSL;
- a generic Contract registry;
- a general executor plugin platform;
- a promotion dashboard / database / queue;
- a new reasoning Role solely for content authoring;
- expanded raw Phase 0 Participant access;
- automatic retries or repair beyond already-authorized continuation / transport behavior;
- higher autonomous-authoring rates as a success metric by themselves.

---

## 28. Re-discussion triggers

Revisit this design only when evidence supports one of the following:

- a second independent content domain needs the same reusable contract-loading mechanism;
- the single-contract direct implementation creates real duplication that justifies a registry;
- the preschool Contract is repeatedly `NOT_APPLICABLE` for origin-specific gaps and a separate origin-specific Contract is justified;
- Formal Event authoring has enough stable semantics to define its own autonomous Contract;
- Milestone or Person authoring reaches autonomous-readiness review;
- shadow execution repeatedly produces conforming promotable patches and Human promotion itself becomes the material bottleneck;
- the per-Host-slice job budget materially prevents normal candidate throughput;
- promotion package volume justifies a persistent lifecycle / inbox;
- contract-safe evidence cannot be derived without a deliberate PD-111 boundary change;
- repeated natural evidence shows the Contract is systematically too narrow, ambiguous, or unsafe.

---

# Part VII — Acceptance criteria

## 29. Design acceptance

This design is considered correctly implemented only when all of the following are true:

1. Governance explicitly reconciles the new shadow-autonomy exception with PD-120 before runtime activation.
2. Existing ordinary config execution and ordinary program/Human escalation remain behaviorally unchanged outside the new lane.
3. Exactly one v1 autonomous reference Contract is supported; no generic registry is required.
4. The Host cannot route to shadow execution from Reviewer acceptance alone.
5. Applicability, conformance, and effectiveness are represented as separate judgments.
6. Raw Phase 0 internal source remains Participant-forbidden.
7. Preschool v1 production modification is restricted to the exact catalog path; test writes are restricted to the two approved test files.
8. Forbidden preschool fields/capabilities are mechanically rejected.
9. The Authoring Agent, not the Executor, owns title/text/scene creation.
10. The Executor implements accepted Cards exactly and cannot silently revise them.
11. Host independently derives actual changed files and verifies authoritative-root integrity.
12. Strong RED → GREEN evidence is required for the shadow patch.
13. Evidence-bounded capacity adequacy is proven independently of Natural PVER.
14. `SHADOW_AUTHORING_VERIFIED` does not trigger source-change barrier or repository baseline change.
15. Successful shadow results generate a durable exact-patch Promotion Package.
16. Human promotion is exact-patch-only and does not grant autonomous Git write authority.
17. The contamination-controlled historical reference trial reaches `SHADOW_AUTHORING_VERIFIED` without receiving the historical five-entry answer set.
18. After reference validation, development returns to natural AE observation rather than continuing to optimize the solved historical case.

---

## 30. Expected next step after written-spec review

After Human reviews the landed wording of this spec, the next engineering artifact should be a detailed implementation plan using the project's `writing-plans` method.

The implementation plan must begin with governance reconciliation and then implement the smallest end-to-end shadow-authoring vertical slice required by the preschool reference Contract.

It must not independently reopen the product decisions already fixed in this design.
