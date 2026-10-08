# Standing Semantic Authorization & Host-Enforced Freshness v1

## Status

**HUMAN ACCEPTED — 2026-10-07**  
**Governance authority: active**  
**Implementation status: implemented / deterministically verified for Formal Event v1**  
**First real bounded flow: completed through Human exact-patch promotion; repository CI closure green**

## Authority identifier

~~~text
standing-semantic-authorization-host-enforced-freshness-v1-20261007
~~~

## 1. Problem

The project previously coupled two different concerns: Human product/authority decisions, and machine identity/freshness/integrity evidence.

PD-122 required fresh exact Participant binding plus fresh Human approval of a per-attempt canonical SHA/digest. The provenance value remains useful, but the bare digest usually gives Human no additional product decision to make. For bounded shadow-only workloads, the repeated candidate → approval → continuation round-trip creates material latency without equivalent decision value.

## 2. Decision principle

Human approves semantic authority. Host verifies machine freshness.

~~~text
Human:
- product need / Requirement
- governing Contract
- acceptable scope / permissions
- authoritative promotion of the actual verified patch

Host:
- exact repo / authority / evidence / binding / prompt / output identities
- drift detection
- execution-envelope enforcement
~~~

A SHA remains useful evidence. It is not, by default, a Human decision surface.

## 3. Standing semantic authorization

A bounded shadow workload has standing semantic authorization when the Contract is Human approved, the Requirement is Human direct or Human accepted, Host proves current applicability, all Participant/write/effect/job boundaries remain inside current authority, and the workload remains shadow-only.

No additional per-attempt candidate file or Human exact-SHA approval is required. Standing authorization does not allow the agent to reinterpret the Requirement or Contract.

## 4. Automatic preflight manifest

Before the first Participant job, Host captures an immutable attempt manifest containing repository HEAD/fingerprint, Contract and Requirement identity, canonical applicability/evidence inputs, role-specific binding locks, prompt digests, invocation identities, allowed correction/job budget, write paths, and workspace/artifact boundaries.

The manifest has a deterministic digest for provenance, replay prevention and integrity. It is generated and validated automatically and is not presented to Human as “approve this SHA”.

## 5. Binding semantics

At attempt start Host fresh-resolves every Participant binding. Within one attempt the binding lock is immutable; silent rebind is forbidden; binding drift stops the attempt.

Between attempts, a changed binding does not by itself invalidate standing semantic authorization. Host may create a new manifest and proceed when the new binding stays inside the already-approved role/permission/workspace envelope. Any authority-surface expansion returns to Human.

## 6. Repository / evidence drift

Before attempt start, Host reads current reality rather than preserving an obsolete digest. If current repo/evidence still supports the same Requirement and Contract, Host records a new manifest and continues. If evidence is insufficient, return INSUFFICIENT_EVIDENCE / DEFER. If authority must expand, return CONTRACT_CHANGE_REQUIRED / ESCALATE_HUMAN.

After attempt start, repo/authority/evidence drift invalidates the active snapshot and the attempt stops rather than crossing snapshots.

## 7. PD-122 semantics retained

Still required: fresh exact binding resolution, role-specific binding-lock provenance, PD-099 v2 activity-aware watchdog, at most one same-thread structural correction where permitted, correction evidence, strict Role-schema validation, no Host semantic repair, fail-closed runtime/provenance/integrity behavior, and no unapproved workload splitting.

Only the default Human exact-digest ceremony is removed.

## 8. Continuous bounded shadow flow

~~~text
accepted Requirement
→ Host applicability / automatic preflight
→ Proposal / Authoring Participant
→ independent Reviewer
→ Host admission
→ isolated shadow execution
→ deterministic verification
→ verified Promotion Package
→ Human promotion review
~~~

No Human round-trip is inserted solely because Proposal, Review, Admission, binding or workspace produced a new digest.

Host may keep machine manifests corresponding to former Gate A / Gate B artifacts, but they are provenance artifacts rather than approval gates.

## 9. Human re-entry conditions

Return to Human only for real authority/product choices: Requirement change; Contract/version or role/permission/job/write/effect envelope expansion; new Runtime/Schema/Person/Relationship/scheduler semantics; CONTRACT_CHANGE_REQUIRED or authority conflict; a future explicitly-designated high-risk start decision; or authoritative promotion of a verified patch.

A future explicit-run gate must present a human-understandable action and scope. A bare digest is not sufficient approval material.

## 10. Promotion

Human exact-patch promotion remains mandatory. Human reviews the actual candidate patch/content and chooses PROMOTE_EXACT_PATCH, DEFER or REJECT. Host automatically records the exact patch identity. Any post-approval mutation invalidates the prior promotion decision.

No autonomous commit / push / merge is authorized.

## 11. Historical compatibility

Historical authorization SHA, consumed markers and binding-lock evidence remain valid records of the governance that applied at the time. Do not rewrite, replay or recompute historical #13–#19 or preschool Layer A proof.

Older statements that PD-122 exact-SHA attempt authorization remains required are superseded by PD-125 for future bounded shadow-only execution only; all other historical proof semantics remain intact.

## 12. Formal Event v1 application

For `bounded-formal-event-authoring-v1@1`, the existing Participant-generation candidate becomes a Host preflight manifest and the post-review/shadow candidate becomes a Host execution manifest. Both retain exact provenance; neither requires Human exact-SHA approval.

Proposal and Reviewer may run continuously after Host preflight; after Host admission, isolated shadow execution may continue without a second Human digest gate. The first model-backed trial stays bounded to the accepted Human-direct “持续修行 × 持续经商” Requirement and does not reconnect full Auto Evolution.

The Formal Event runtime reconciliation is complete: preflight/execution identities are Host-managed machine manifests, and ordinary bounded execution no longer waits for Human approval of bare SHA/digest values. The first real model-backed Formal Event flow exercised this standing-authorization path through independent review, Host admission, shadow verification, and Human review of the actual patch. No Human digest gate was reintroduced.

## 13. Preschool application

Future preschool bounded shadow execution follows the same default authorization semantics. Historical Layer A attempts and authorization records remain historical evidence.

## 14. Non-goals

- no reduction in Contract/applicability/review/admission rigor;
- no silent rebind;
- no removal of digests or audit evidence;
- no autonomous authoritative repository mutation;
- no generic authorization DSL/framework;
- no new Participant role;
- no relaxation of effect/write boundaries;
- no interpretation of shadow success as Natural Effectiveness;
- no redesign of historical attempt artifacts.

## 15. Acceptance criteria

1. bounded shadow workloads do not require Human approval of per-attempt SHA/digest;
2. Host still records exact identities needed for freshness, integrity and forensics;
3. binding is freshly resolved before an attempt and immutable within it;
4. repo/authority/evidence drift is machine-detected and fail closed;
5. drift that stays inside accepted semantics does not create a Human round-trip;
6. drift that changes semantics or authority returns to Human;
7. PD-122 watchdog/correction/provenance guarantees remain intact;
8. Participant generation → review → admission → shadow execution can run continuously under standing authorization;
9. authoritative promotion still requires Human review of the actual patch;
10. Human is never asked to approve a bare digest as the sole decision material;
11. historical proof artifacts remain unchanged;
12. deterministic verification passes before the first real model-backed trial.

## 16. Implementation outcome

The implementation slice above is closed for Formal Event v1.

Verified outcome:

1. Human exact-SHA approval is no longer a Participant-generation or shadow-execution prerequisite;
2. Host machine manifests retain exact repo/evidence/binding/prompt/proposal/review/admission/result provenance;
3. binding drift, repo/evidence drift, schema failure, non-ELIGIBLE admission, and verification failure remain fail closed;
4. one fresh real model-backed bounded trial completed continuously under standing semantic authorization after the Reviewer schema communication defect was corrected;
5. Human reviewed the actual verified patch rather than a bare digest;
6. the promoted Event entered the authoritative catalog only after that Human decision;
7. repository CI is green after the legitimate catalog-count baseline moved from 391 to 392.

No additional authorization-runtime expansion is required by this proof. The next evidence question is Natural Effectiveness under ordinary `RUN / OBSERVE`, not further SHA-gate infrastructure.
