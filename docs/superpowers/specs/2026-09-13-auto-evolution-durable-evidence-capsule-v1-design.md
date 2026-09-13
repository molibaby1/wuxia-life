# Auto Evolution Durable Evidence Capsule v1

## 1. Status

**Status: DRAFT — design sections accepted in chat on 2026-09-13; written spec pending Human review.**

Current implementation baseline inspected for this design:

```text
repository: molibaby1/wuxia-life
branch: dev
baseline HEAD: f0a718d300ab8c219af22acba3f7764f1fecdc63
```

This design introduces a bounded durable evidence layer for ordinary Auto Evolution sessions. It does not change AE reasoning, routes, permissions, Participant evidence authority, HFL triggers, or gameplay semantics.

Implementation must not begin until this written spec is Human reviewed, required formal authority updates are recorded, and an implementation plan is accepted.

---

## 2. Problem Statement

Ordinary AE currently has three materially different evidence surfaces:

1. `.tmp/evolution/**`: rich execution evidence, including Phase0 source artifacts, Participant prompts/invocations/raw outputs/traces/structured results, workspaces, configuration execution evidence, and modified-runtime reruns.
2. `artifacts/evolution/run-reports/**`: durable semantic projection of workflow facts, not a byte-complete execution archive.
3. Human Follow-up retention: bounded durable evidence only for the existing `ESCALATE_HUMAN` route.

Current V6 reporting materially improves semantic auditability, including PD-117 continuation. However, after `.tmp` is removed, a later investigator may no longer be able to verify:

```text
What exact prompt did a Participant receive?
What explicit evidence and authority snapshots were bound to that invocation?
What raw output or failure did the Participant produce?
What process/transport trace accompanied the call?
What exact configuration bytes changed?
What actual sealed modified gameplay source was used by the next round?
```

The root cause is not that `project.zip` simply forgot to include `.tmp`. The root cause is an artifact lifecycle gap:

```text
ordinary AE produces useful forensic execution evidence
→ that evidence remains ephemeral
→ durable reporting retains a semantic projection
→ ordinary runs lack a bounded promotion step
```

Therefore:

```text
PRIMARY_GAP = ordinary AE lacks durable forensic evidence closure
ROOT_CAUSE_CLASS = ARTIFACT_LIFECYCLE / EVIDENCE_PROVENANCE_ARCHITECTURE
```

---

## 3. Authority Boundaries

### 3.1 Existing semantics that remain unchanged

This design must preserve:

- PD-100 Human Follow-up trigger scope;
- PD-111 evidence boundary: Feedback/Hypothesis remain player-observable, Solution/Reviewer may receive only currently authorized bounded causal attribution, and raw Phase0 internal source remains prohibited from Participant exposure;
- PD-117 bounded Reviewer `REQUEST_MORE_WORK` continuation semantics, budget, immutability, and effective-route behavior;
- existing reasoning Participant permissions;
- accepted configuration-only execution path;
- existing ordinary-run route and stop semantics;
- existing Operational Report semantic role;
- existing historical artifact immutability;
- full P3 deferral.

### 3.2 New authority introduced by this design

This design adds one generated operational artifact class:

```text
Auto Evolution Durable Evidence Capsule v1
```

Every completed ordinary AE session attempts to promote an explicitly allowlisted set of forensic evidence from ephemeral execution storage into a durable Capsule under `artifacts/evolution/**`.

The Capsule is historical generated evidence. It is not product authority, governance authority, configuration truth, or current implementation truth.

Formal artifact/output documentation must be updated during implementation to describe this artifact class and its relationship to `.tmp`, run reports, HFL retention, and project packaging.

No Participant authority, route authority, gameplay authority, or product semantic authority changes in this design.

---

## 4. Goals

1. Make ordinary AE sessions independently auditable after their `.tmp` session trees are deleted.
2. Preserve invocation-grade evidence for every real Participant job.
3. Preserve historical bytes for explicitly bound evidence, assigned skills, and authority refs required to interpret each invocation.
4. Preserve raw Participant output/failure and execution trace evidence.
5. Preserve exact bounded configuration before/after evidence when configuration execution occurs.
6. Preserve a complete sealed modified Phase0 source when configuration execution causes a real cross-round transition.
7. Keep the durable artifact materially smaller than copying entire execution/workspace trees.
8. Preserve PD-111 visibility/authority boundaries mechanically.
9. Keep retention outside AE semantic decision-making.
10. Make recent durable evidence straightforward to include in `project.zip` for later ChatGPT/Human investigation.
11. Avoid automatic v1 evidence GC until real Capsule size data exists.

---

## 5. Non-Goals

V1 does **not**:

- retain complete Solution workspaces by default;
- retain complete Reviewer workspaces by default;
- promise exact filesystem replay;
- record Participant repository browsing history;
- capture hidden reasoning state;
- add a new reasoning Role;
- add a new reasoning stage;
- rerun gameplay solely to obtain evidence;
- rerun a Participant solely to obtain evidence;
- change Reviewer decisions, base Decisions, effective routes, or stop semantics;
- expand HFL trigger scope;
- expand Participant-visible evidence;
- make generated evidence authoritative over current product/governance documentation;
- automatically delete old durable Capsules in v1;
- implement global content-addressed storage, automatic pinning, or complex byte-budget allocation in v1;
- replace existing fixed replay tooling.

If a rare investigation needs the exact historical Solution/Reviewer filesystem surface, the operator may still manually preserve or inspect the relevant `.tmp` workspace while it exists. That low-frequency requirement is intentionally outside v1.

---

## 6. Capability Guarantee

After the original `.tmp/evolution/<session>` tree is removed, `repo + Durable Evidence Capsule` must be sufficient to independently audit the explicit historical inputs, rendered prompts, Participant bindings/invocations, raw outputs, structured results/failures, reasoning artifacts, decisions, bounded configuration changes, and retained cross-round source evidence covered by this contract.

It does **not** guarantee reproduction of the exact historical repository filesystem available to Solution/Reviewer.

```text
GUARANTEED
= explicit invocation-grade evidence and bounded execution provenance

NOT GUARANTEED
= exact filesystem replay of arbitrary Agent repository exploration
```

---

## 7. Artifact Roles

The relevant artifact classes remain separate:

```text
.tmp/evolution/<session>
  = ephemeral execution workspace

artifacts/evolution/run-reports/**
  = durable semantic projection
  = what the workflow concluded

artifacts/evolution/run-evidence/**
  = durable forensic evidence closure
  = what explicit evidence/invocation underlies that conclusion

artifacts/evolution/human-follow-up/**
  = route-specific retained Human work items
  = existing HFL semantics only
```

Durable Evidence is an observability side effect. It never feeds new evidence back into the active AE session and never changes the active Participant visibility surface.

---

## 8. Capsule Structure

Each ordinary AE session has at most one immutable Capsule:

```text
artifacts/evolution/run-evidence/<session-id>/
```

Logical responsibilities:

```text
manifest.json
session/
source/
reasoning/
authority/
skills/
participants/
extensions/
```

The exact file names may be refined during implementation, but these responsibilities are required.

The Capsule has two layers:

```text
Analysis Core
  mandatory for every ordinary session

Event Extensions
  generated only when the corresponding event actually occurred
```

Important event flags:

- `participantFailure`
- `reviewContinuation`
- `configurationExecution`
- `crossRoundTransition`

`participantFailure` and `reviewContinuation` are important-event markers but do not require separate duplicate evidence trees because their evidence is already covered by the Analysis Core.

`configurationExecution` and `crossRoundTransition` require additional bounded evidence and therefore define real extensions.

---

## 9. Manifest and Integrity

The top-level manifest records at least:

- schema version;
- session ID and creation time;
- branch / HEAD / available working-tree metadata;
- report/session/source-run relationships;
- Analysis Core status;
- important-event flags;
- extension status/refs;
- every retained file's logical ref, relative path, SHA-256, byte size, visibility class, and source ref;
- total Capsule size.

All paths must be safe Capsule-relative paths. Duplicate logical refs or destination paths are invalid unless explicitly defined as aliases by schema.

The manifest is authoritative only for the historical Capsule's own integrity and provenance.

---

## 10. Evidence Visibility Contract

Every retained evidence object must declare at least one of:

```text
PARTICIPANT_VISIBLE
HUMAN_FORENSIC_ONLY
```

The class records the historical authority boundary, not merely who can read the durable file today.

Examples:

- player-observable payload: classified according to the historical invocation;
- bounded causal attribution: visible only to roles already authorized to receive it;
- `internal/player-surface-source.json`: `HUMAN_FORENSIC_ONLY`.

Retention must never expand active-runtime visibility.

Future replay/investigation tooling must consume explicit visibility and role bindings rather than assuming that every file in a Capsule is Participant-visible.

---

## 11. Analysis Core

### 11.1 Session/runtime provenance

Retain bounded session identity and observed runtime provenance, including where available:

- session/run identifiers;
- branch and HEAD SHA;
- working-tree state summary used by the ordinary operator;
- Participant binding identity;
- observed provider/executable/version metadata;
- ordinary session manifest/operator relationships needed to understand the historical workflow.

Unavailable metadata must be represented explicitly as not recorded/not applicable. Retention must not fabricate unavailable runtime facts.

### 11.2 Source evidence

Retain the bounded source evidence required to audit reasoning provenance, including applicable:

- initial player-observable payload;
- run identity/parameters;
- persona;
- experiment envelope;
- source fingerprint;
- Phase0 data-access manifest where required for source validation;
- `player-surface-source` used to validate bounded causal attribution.

`player-surface-source` is Human forensic evidence and does not become a Participant-visible input merely because it is retained.

The Core does not copy the entire Phase0 tree merely because it exists.

### 11.3 Reasoning artifacts

Retain exact applicable structured artifacts:

- Feedback;
- Hypothesis;
- Selection;
- bounded causal attribution;
- Problem Package;
- Solution structured result/failure;
- Reviewer structured review/failure;
- base Decision;
- continuation state;
- revision request;
- revised Solution result/failure;
- fresh re-review result/failure;
- continuation Decision;
- final/effective session relationship.

Historical artifacts are copied/hashed, not semantically regenerated.

### 11.4 Authority snapshots

If an invocation explicitly binds authority refs, retain the historical file bytes together with original ref/path and SHA-256.

A current version of an authority file must not be substituted when auditing a historical invocation.

Authority snapshots are historical evidence only and never override current formal authority.

### 11.5 Skill snapshots

If an invocation explicitly assigns skills, retain the historical skill bytes together with canonical ref/path and SHA-256.

A path/hash-only record is insufficient for durable analysis because current repository content may later change.

### 11.6 In-Capsule de-duplication

Shared evidence is stored once in a canonical Capsule location. Participant receipts refer to it by logical ref + hash.

V1 does not require a global cross-Capsule content-addressed store.

---

## 12. Uniform Participant Invocation Receipt

Every real Participant invocation must be representable by one durable receipt, including:

- Feedback;
- Hypothesis;
- Solution;
- Reviewer;
- Solution revision;
- fresh continuation re-review;
- configuration execution Participant where applicable.

Each receipt records where applicable:

- job identity, role, and round/continuation relationship;
- rendered prompt bytes;
- invocation metadata and Participant binding;
- observed provider/executable/version/timeout metadata;
- visible evidence refs + hashes;
- assigned skill refs + hashes;
- authority refs + hashes;
- raw terminal output;
- available stderr/process output;
- execution trace;
- structured result **or** failure.

This is the minimum auditability contract across roles. Existing role-specific instrumentation gaps must be closed rather than copied forward into the Capsule.

The receipt stores only observable execution material.

---

## 13. Participant Failure and Review Continuation

Participant failure is handled by the Core. After `.tmp` deletion, evidence must still support diagnosis of the currently observable failure classes, including provider/process, transport/stream, final-output/envelope, schema, and structured semantic failure where those classes are available from runtime evidence.

PD-117 continuation is also handled by the Core:

```text
base Review
→ base Decision
→ continuation state
→ revision request
→ revised Solution invocation/result
→ optional fresh Reviewer invocation/result
→ continuation Decision
→ effective route relationship
```

Retention must not create additional Participant jobs or continuation opportunities.

---

## 14. Configuration Execution Extension

When configuration execution actually occurs, the Capsule must include a complete bounded extension sufficient to answer:

```text
What was accepted?
Which paths were allowed to change?
What were the exact bounded before bytes?
What were the exact after bytes?
Which files actually changed?
Did scope verification pass?
Did deterministic verification pass?
```

Retain at least:

- refs/hashes to accepted Problem Package, Solution, and Reviewer;
- allowed write paths;
- exact before bytes and identity/hash required by the execution contract;
- exact after bytes and identity/hash for actual changed files;
- actual changed files;
- execution invocation/result/failure evidence;
- scope verification results;
- deterministic verification results.

Do not retain the full evolution workspace.

If execution occurred but required before/after/verification evidence cannot be closed, retention fails closed.

---

## 15. Cross-Round Extension

When a real configuration execution produces a modified gameplay rerun that becomes a subsequent round source, retain a complete validated sealed Phase0 source for that resulting run.

It must include the then-required sealed artifacts, including applicable:

```text
inputs/run-input.json
inputs/persona.json
inputs/catalog.json
provenance/source-fingerprint.json
internal/player-surface-source.json
reviewer-input/observable-payload.json
provenance/experiment-envelope.json
provenance/phase0-run-data-access-manifest.json
experiment-root manifest/hash artifacts
```

Retention revalidates the seal before committing the Capsule.

This preserves:

```text
Round 1 source
→ accepted configuration change
→ bounded before/after evidence
→ modified sealed source
→ Round 2 reasoning
```

A `resultingRunRef` alone is insufficient.

---

## 16. Security and Allowlist Rules

Retention is allowlist-driven. It must never recursively archive the whole `.tmp` session, an Agent workspace, or the repository.

Only contract-declared evidence sources may be copied. Local environment-only material, VCS internals, dependency trees, full workspaces, and arbitrary undeclared filesystem trees are excluded from the ordinary Capsule contract.

Any authority/skill/source file copied into the Capsule must have been explicitly declared by the relevant historical contract or invocation.

---

## 17. Lifecycle, Atomicity, and Failure Semantics

Retention runs only after the AE semantic outcome is already determined and the session artifacts needed for enumeration exist.

Conceptually:

```text
AE semantic execution
→ final session manifest/outcome
→ durable evidence retention
→ report/index/HFL observability projections
```

The exact order between independent observability side effects may be refined during implementation, but one observability failure must not cascade into unrelated observability failures.

Retention is atomic and create-only:

```text
.staging-<session>-<nonce>/
→ copy allowlisted evidence
→ build manifest
→ verify files/hashes/invariants/extensions
→ atomic rename to <session-id>/
```

A final Capsule directory exists only when complete and valid. An existing Capsule is reused only if identity/integrity validation matches. Historical evidence is never overwritten in place.

Retention failure must never:

- change Reviewer/Decision/effective-route semantics;
- invoke a Participant;
- rerun gameplay;
- create new HFL eligibility;
- rerun the ordinary session.

The operator preserves independently:

```text
AE semantic outcome
Evidence retention status
```

A failed retention attempt leaves source `.tmp` available for repair.

---

## 18. Manual Repair

V1 provides a bounded operator entry point that can retain/repair a Capsule from an already-completed existing `.tmp` session.

Its semantics are only:

```text
existing completed session
→ validate source artifacts
→ retain/verify Capsule
```

It must not rerun gameplay, call Participants, start a new ordinary session, or mutate historical execution artifacts.

---

## 19. Durable Evidence Index

Provide a lightweight inventory under `artifacts/evolution/run-evidence/`, at least `index.json`; a generated `index.md` is optional.

The index inventories **completed valid Capsules** and records fields such as:

- session ID;
- creation time;
- report ref;
- effective outcome summary;
- round count;
- important events;
- Capsule byte size.

A failed retention attempt must not masquerade as a Capsule entry. Its failure status belongs in the operator/observability result until a valid Capsule is repaired.

The index is not evidence itself and must be rebuildable from valid Capsule manifests.

---

## 20. Retention and Packaging Policy

V1 has no automatic Capsule GC.

```text
.tmp/evolution/**
  ephemeral

artifacts/evolution/run-evidence/**
  durable operational history
  not removed by ordinary temp cleanup
```

Default `project.zip` must not include unlimited Capsule history. The default recent window is determined from completed valid Capsules in deterministic descending recency order (session completion/Capsule creation time, with session ID as a stable tie-break).

Packaging policy:

```text
local history:
  retain all completed Capsules unless explicitly pruned later

project.zip default:
  include evidence index
  include latest 5 complete Capsules
  include explicitly selected older Capsules
```

Explicit older-run selection must be supported by the packager; exact CLI spelling is an implementation detail. Multiple explicit selections must be possible, and a Capsule already present in the recent window must not be duplicated.

---

## 21. Packaging Integrity and Status

Packaging selects whole Capsules atomically.

Before inclusion it validates:

- `manifest.json`;
- every declared file;
- every declared hash;
- all extensions required by event flags.

A selected invalid Capsule causes packaging failure. The packager must not silently include a partial Capsule.

`project.zip` also contains small evidence-package metadata recording at least:

- default evidence window;
- included session IDs;
- inclusion reason (`recent` or `explicit`);
- locally known Capsule count;
- included Capsule count;
- included evidence bytes.

This lets a later investigator distinguish:

```text
Capsule does not exist
```

from:

```text
Capsule exists locally but was not selected into this ZIP
```

Current package path exclusions must be changed or the Capsule storage layout must be mapped so **every manifest-declared file of a selected Capsule is actually packageable**. In particular, nested sealed-source paths such as `inputs/**` must not be silently removed merely because the general packager excludes an `inputs` path segment elsewhere. The whole-Capsule validation requirement is authoritative over incidental prune rules.

---

## 22. Relationships to Existing Systems

### Operational Report

Report and Capsule cross-reference each other where both exist.

- Report: semantic projection — what happened/concluded.
- Capsule: forensic closure — what explicit invocation/evidence underlies it.

The report should not absorb all raw evidence merely to become self-contained.

### HFL

HFL remains route-specific and unchanged. A session may have both an HFL item and a Capsule. Capsule existence does not create new HFL eligibility.

### Fixed replay

Existing fixed replay remains separate. V1 does not promise to make exact filesystem replay independent of `.tmp`.

---

## 23. Testing Strategy

### 23.1 Contract tests

Validate:

- schema version;
- safe paths;
- logical-ref/destination uniqueness;
- actual SHA-256 integrity;
- byte sizes;
- visibility enum;
- event/extension invariants;
- source refs;
- create-only behavior;
- fail-closed parsing/validation.

### 23.2 Participant instrumentation tests

Cover Feedback, Hypothesis, Solution, Reviewer, Solution revision, fresh re-review, and configuration execution Participant where applicable.

Each must satisfy the uniform invocation evidence contract.

Add a specific regression test that Hypothesis has rendered-prompt/trace auditability at the same minimum class as Feedback.

### 23.3 Retention integration test

Core integration test:

```text
completed .tmp session
→ retain Capsule
→ validate Capsule
→ delete source .tmp session
→ reopen/verify Capsule
→ complete supported forensic analysis using durable evidence only
```

### 23.4 Event tests

Cover at least:

1. normal single-round terminal;
2. Participant failure;
3. PD-117 continuation;
4. configuration execution;
5. real cross-round transition.

Config tests prove exact bounded before/after evidence. Cross-round tests prove the retained modified source still passes seal validation after source `.tmp` deletion.

### 23.5 Packaging tests

With more than five local Capsules, verify:

- default latest-five selection;
- explicit old-run additions;
- multiple explicit selections;
- selected-Capsule corruption failure;
- whole-Capsule inclusion;
- evidence-package status accuracy;
- exclusion of unselected old Capsule payloads.

### 23.6 Authority/regression tests

Prove retention does not:

1. add Participant jobs;
2. add gameplay runs;
3. alter base/effective route;
4. alter HFL trigger scope;
5. expose Human-forensic evidence to Participants;
6. archive full workspaces under the ordinary contract;
7. invent a configuration extension when configuration execution did not occur;
8. invent a cross-round extension when no real cross-round transition occurred;
9. automatically rerun ordinary AE after retention failure.

---

## 24. Acceptance Criteria

### AC-1 — Ordinary analysis closure

After deleting the complete original `.tmp/evolution/<session>` tree, `repo + Capsule` is sufficient to audit the explicit chain from player-observable source through Feedback, Hypothesis, Selection, causal attribution, Problem Package, Solution, Reviewer, continuation if any, and Decision/effective route.

### AC-2 — Participant failure closure

After `.tmp` deletion, retained evidence is sufficient to distinguish the supported observable provider/process, transport/stream, final-output/envelope, schema, and structured semantic failure classes to the extent those classes are observable in the runtime.

### AC-3 — Continuation closure

After `.tmp` deletion, the investigator can determine what Reviewer requested, what revision invocation ran, what revised Solution produced, what fresh Reviewer concluded if invoked, and why the effective route changed or remained terminal.

### AC-4 — Configuration closure

Without retaining a workspace, the Capsule exposes accepted evidence refs, allowed paths, exact bounded before/after bytes, actual changed files, scope verification, and deterministic verification.

### AC-5 — Cross-round closure

After `.tmp` deletion, the actual modified gameplay source used by the next round remains a valid sealed Phase0 source.

### AC-6 — Workspace replay excluded

No acceptance test requires complete Solution/Reviewer workspace retention or exact filesystem replay.

### AC-7 — Package growth bounded by selection count

Default package contains the evidence index plus the latest five complete Capsules. Explicitly requested older Capsules may be added without truncating local durable history.

### AC-8 — Semantic isolation

A forced retention failure leaves the already-determined AE outcome unchanged and does not trigger new Participants, gameplay, or HFL behavior.

---

## 25. Implementation Scope

Expected implementation surfaces are limited to:

- Participant invocation observability/instrumentation;
- a new durable evidence schema/contract;
- retention builder/validator/archive path;
- ordinary-run post-execution retention orchestration;
- bounded configuration before/after evidence capture;
- modified Phase0 source retention/validation;
- evidence index generation;
- project packaging selection/status;
- contract/integration/packaging tests;
- formal artifact/output documentation and any required governance recording.

This work must not justify unrelated AE refactoring, workspace replay redesign, new Roles, route changes, or broader product changes.

---

## 26. Recommended Implementation Order

1. Define Capsule schemas, visibility classes, and integrity invariants.
2. Normalize Participant invocation evidence contract.
3. Implement Analysis Core retention from completed sessions.
4. Add atomic create-only validation and repair entry point.
5. Add Configuration Execution Extension.
6. Add Cross-Round sealed-source Extension.
7. Add evidence index.
8. Integrate automatic ordinary-session retention.
9. Add project packaging selection/status.
10. Update formal artifact/output/governance documentation.
11. Run deletion-based integration and regression verification.

---

## 27. Success Definition

The normal investigation workflow changes from:

```text
new analysis session
→ report insufficient
→ ask operator for .tmp
→ locate and repack ad hoc evidence
→ resume diagnosis
```

to:

```text
new analysis session
→ inspect evidence index
→ open relevant complete Capsule already in project.zip
→ independently audit the AE reasoning/execution chain
```

while preserving:

```text
no workspace retention by default
no exact filesystem replay promise
no new AE reasoning behavior
no HFL expansion
no PD-111 evidence expansion
no hidden reasoning capture
no automatic v1 evidence GC
```
