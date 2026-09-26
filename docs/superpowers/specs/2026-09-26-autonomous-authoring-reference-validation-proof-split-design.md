# Autonomous Authoring Reference Validation Proof Split

**Date:** 2026-09-26

**Status:** HUMAN ACCEPTED

## 1. Purpose

The historical preschool residual-capacity case can validate bounded downstream authoring and execution. It cannot serve as a sufficient standalone fixture proving that an Agent independently derived the historical Minimum Sufficient Responsibility Set from permitted evidence.

~~~text
Historical controlled downstream mechanism proof
≠
Natural autonomous semantic-derivation proof
~~~

This split does not lower the long-term Autonomous Authoring objective. It assigns distinct proof obligations to the historical controlled case, a genuine natural candidate, and post-promotion natural effectiveness.

## 2. Current governance status

PD-120 is the current operative Content Authoring Workflow authority. It permits:

~~~text
Player-visible signal
→ Gap Diagnosis
→ Content Proposal
→ Draft Authoring Contract
→ Human Approval boundary
~~~

PD-120 does not currently authorize AE autonomous author + implement. The 2026-09-24 accepted Autonomous Authoring design requires new governance reconciliation before its runtime authority takes effect. Its implementation plan provisionally calls that future Product Decision PD-121. That decision has not landed as canonical operative governance; this design does not treat PD-121 as existing authority.

## 3. Relationship to future governance

If governance reconciliation later lands as PD-121 or under another formal decision number, it must incorporate this proof split. That authority must not claim that the historical reference trial proved autonomous responsibility discovery. This design constrains future governance wording but does not itself create runtime execution authority.

## 4. Supersession scope

This design supersedes only Part V §25, Part V §26, and Part VII §29 acceptance criteria 17–18 of the 2026-09-24 Contract-Constrained Autonomous Authoring v1 design, plus the corresponding historical-proof assumption in its implementation plan Task 9.

It does not supersede PD-120; the requirement for future governance reconciliation; the Contract v1 semantic envelope, freedom matrix, or implementation envelope; PD-111; PD-120 Gap Diagnosis; Solution / Reviewer separation; Host Admission; Shadow execution; V1–V5 mechanics; or Human exact-patch promotion authority.

## 5. Contract v1 immutable authority

This reconciliation does not modify contractId, contractVersion, Contract rules, Contract authority source identity, or Contract authority SHA. It creates no Contract v2. The proof split changes validation strategy, not Contract semantics. The 2026-09-24 accepted design remains byte-immutable; supersession is expressed in this separate spec.

## 6. Historical case evidence

The fixed reference evidence is:

~~~text
baseline: e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf
runRef: preschool-pver-20260922231805-71297571
classification: CONTENT_GAP / CONTENT_CAPACITY_GAP
demand: 30
authored: 26
generic structural gaps: 4
legal pool at every accepted gap: exhausted
~~~

These facts prove a capacity deficit. Alone, they do not prove which specific late-preschool life functions were missing.

## 7. Historical Human design provenance

The second-round responsibility selection in the 2026-09-23 accepted residual design was not mechanically derived from 30 - 26 = 4. Structural capacity diagnosis and specific semantic responsibility selection are separate judgments.

## 8. Attempts #1–#3

- Attempt #1: a Host construction defect caused failure before Participant binding.
- Attempt #2: Solution returned INSUFFICIENT_EVIDENCE because the Participant semantic evidence surface was incomplete.
- Attempt #3: Solution still returned INSUFFICIENT_EVIDENCE after receiving the exact sealed observable payload, historical catalog, accepted structural capacity evidence, Host runRef → baseline attestation, and Host-validated Contract Packet provenance semantics. Reviewer returned DEFER. The attempt did not reach Host Admission or Shadow.

The architectural classification is HISTORICAL_REFERENCE_CASE_SEMANTIC_TARGET_UNDERDETERMINED, specifically for independent responsibility-derivation proof. It does not negate the accepted capacity diagnosis or downstream mechanism as a testable capability.

## 9. Three proof layers

### Layer A — Historical Controlled Downstream Mechanism Proof

Given a Human-approved semantic responsibility set, validate:

~~~text
instance authoring
→ Reviewer
→ Host
→ Shadow
→ verification
→ Promotion Package
~~~

Layer A does not validate Contract §9 responsibility derivation.

### Layer B — Natural Autonomous Semantic-Derivation Proof

In a genuine natural candidate, permitted evidence must lead to independent derivation of a Minimum Sufficient Responsibility Set and then the downstream autonomous-authoring lifecycle. No Human responsibility brief is supplied.

### Layer C — Natural Effectiveness

Only Natural PVER after authoritative Human promotion can establish natural effectiveness.

## 10. Explicit §9 bypass

Layer A uses a Human-approved Reference Responsibility Brief in place of the §9 evidence → Minimum Sufficient Responsibility Set derivation step. Layer A therefore does **not** validate Contract §9 derivation and does **not** validate the full Contract v1 flow. This exception is confined to controlled historical validation, not the natural Contract.

## 11. Qualified Layer A result

A successful Layer A result is reported as HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM_VERIFIED or an equivalent explicitly qualified result. It must not be reported as CONTRACT_V1_FULL_FLOW_VERIFIED, AUTONOMOUS_SEMANTIC_DERIVATION_VERIFIED, or MINIMUM_SUFFICIENT_RESPONSIBILITY_DERIVATION_VERIFIED.

The generic downstream terminal SHADOW_AUTHORING_VERIFIED may remain. In Layer A, durable evidence must additionally record:

~~~text
validationLayer = HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM
responsibilityProvenance = HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES
~~~

SHADOW_AUTHORING_VERIFIED together with HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES proves only the bounded downstream mechanism.

## 12. V1–V5 interpretation

V1–V5 mechanics remain unchanged by default. In Layer A their responsibility premise is HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES, not EVIDENCE_DERIVED_MINIMUM_RESPONSIBILITY_SET. They may prove that supplied responsibilities became conforming Cards, exact implementation, and elimination of the bounded structural deficit. They cannot prove independent discovery of those responsibilities from evidence.

## 13. Durable provenance requirement

Durable evidence must mechanically distinguish HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES from EVIDENCE_DERIVED_MINIMUM_RESPONSIBILITY_SET. Prefer a reference-trial-local companion artifact or result wrapper. Historical validation must not add a generic natural-AE HUMAN_RESPONSIBILITY_MODE.

## 14. Reference Responsibility Brief

Layer A may receive an exact Human-approved Reference Responsibility Brief. Each item may contain only:

~~~text
responsibilityRef
primaryLifeFunction
playerVisibleNeed
~~~

responsibilityRef is an opaque reference-trial identity, not a production ID.

## 15. Forbidden instance-level answers

The Brief must not contain a historical or future production ID; title; text; concrete scene; ageMin answer; developmental-age justification; closest-entry answer; specific semantic-distinction answer; presentation scenario; test implementation; historical patch; historical Promotion Package; or later PVER implementation result.

The complete 2026-09-23 residual five-entry design remains Participant-forbidden. Later second-round catalog rows also remain forbidden.

## 16. Brief identity

Before a real Layer A trial, the Brief must have a stable schema, canonical or exact representation, Human acceptance boundary, immutable accepted digest, and fail-closed validation. A missing, malformed, altered, unaccepted, or digest-mismatched Brief requires STOP before Participant binding. It must not be reconstructed.

## 17. Solution responsibility in Layer A

Solution does not discover the responsibility set in Layer A. For each supplied responsibility, it independently determines Contract applicability, developmental age and justification, concrete scene, closest existing entries, semantic distinction, shared-neutral portability, transient-role compliance, durable-result compliance, production ID, title, and text.

If applicability is APPLICABLE, Solution must produce exactly one Card per supplied responsibility. It must not omit, add, merge, split, or replace responsibility semantics.

## 18. Non-positive outcomes remain valid

Human-approved responsibilities do not force APPLICABLE. If instance-level Contract fit cannot be established, Solution may legitimately return NOT_APPLICABLE, INSUFFICIENT_EVIDENCE, or CONTRACT_CHANGE_REQUIRED.

## 19. Reviewer responsibility

Reviewer receives the same exact Brief and independently checks one-to-one responsibility preservation; Contract applicability; scene fit; developmental age; distinction from existing content; shared-neutral portability; transient-role boundary; non-filler semantics; absence of unauthorized state or mechanics; execution envelope; and mechanical and semantic conformance. Reviewer does not assess whether Solution discovered the supplied responsibilities itself.

## 20. Host responsibility

Host retains ownership of capacity evidence identity, observable evidence identity, Brief identity, Contract identity, source/baseline attestation, Host-only evidence, execution envelope, allowed paths, mechanical gates, repository integrity, V1–V5, and Promotion Package.

Host must mechanically verify one-to-one preservation of the supplied responsibility set. It must not label that set as naturally evidence-derived.

## 21. Contamination boundary

Layer A permits Human-approved primaryLifeFunction, Human-approved playerVisibleNeed, and opaque responsibilityRef as explicit inputs. Historical IDs, titles, texts, scenes, age-window answers, developmental rationales, closest-entry mappings, presentation boundaries, later catalog rows, later implementation-revealing PVER, historical patch, and historical Promotion Package remain forbidden.

Reports must no longer say “no historical answer semantics supplied.” They may say “no historical instance-level authoring answers supplied.”

## 22. Layer A success

Layer A succeeds only when all of the following are established:

- The exact accepted Reference Responsibility Brief, accepted structural evidence, and permitted observable evidence are present; Host verifies the baseline; the Contract Packet is current.
- Solution returns APPLICABLE, preserves responsibilities one-to-one, independently authors instance-level Cards, and receives no forbidden instance-answer contamination.
- Reviewer accepts conforming Cards; the execution envelope is valid.
- Host Admission is ELIGIBLE and Decision is READY_FOR_SHADOW_AUTHORING.
- Shadow changes authorized paths only; Executor implements accepted Cards exactly.
- V1–V5 PASS under Layer A provenance and the bounded structural deficit is eliminated.
- The authoritative repository remains unchanged; a Promotion Package and promotion.patch are produced.

## 23. Layer A establishes only

A successful Layer A establishes bounded instance-authoring capability, Reviewer conformance capability, Host Admission, shadow execution, write-scope enforcement, downstream verification, bounded structural completion, Promotion Package creation, and authoritative-repository isolation.

The capability label is:

~~~text
Historical controlled downstream mechanism: PASS
~~~

## 24. Layer A does not establish

Layer A does not establish Contract v1 full-flow validation; Contract §9 autonomous derivation; autonomous missing-life-function discovery; autonomous Minimum Sufficient Responsibility Set derivation; natural activation; natural semantic derivation; natural effectiveness; or generalized effectiveness.

## 25. Layer B

A natural candidate must not receive a Reference Responsibility Brief, Human-selected missing life functions, a target responsibility count, historical answer mapping, or instance-level Human design. The full §9 derivation obligation remains.

Only a genuine natural candidate that autonomously completes the following path can prove Natural Autonomous Semantic Derivation:

~~~text
permitted evidence
→ applicability
→ evidence-derived Minimum Sufficient Responsibility Set
→ Cards
→ Reviewer
→ Host
→ Shadow
→ V1–V5
→ SHADOW_AUTHORING_VERIFIED

responsibilityProvenance = EVIDENCE_DERIVED_MINIMUM_RESPONSIBILITY_SET
~~~

## 26. Layer C

Even successful Layer B proves only natural activation, semantic derivation, and verified shadow capability. Natural effectiveness still requires Human exact-patch promotion followed by subsequent Natural PVER.

## 27. RUN / OBSERVE remains unchanged

The current product stage remains RUN / OBSERVE. Do not manufacture a natural target sample. Whatever outcome a real run naturally produces follows the existing STOP, permission, and provenance boundaries.

## 28. Controlled historical trial remains separately authorized

Design acceptance does not authorize a historical trial. The order is:

~~~text
accepted reconciliation design
→ governance reconciliation landed
→ implementation plan reviewed
→ bounded implementation completed
→ fresh verification reviewed
→ separate Human trial authorization
~~~

## 29. PD-111 remains unchanged

Participants must not receive raw passiveEntryIds, eventHistoryAdded, internal/player-surface-source.json, Host-only chronology, Host Admission internals, or other forbidden sealed internal state. This design does not expand evidence authority.

## 30. Generic schema remains natural-first

Ordinary Autonomous Authoring responsibilities retain the evidence-derived interpretation. Layer A provenance belongs in a reference-trial-local mechanism. Historical validation must not become a generic Human-responsibility production feature.

## 31. Supersession of old §25

The old historical requirement, “Minimum Sufficient Responsibility Set derived without historical answer leakage,” is replaced for Layer A by:

~~~text
Human-approved Reference Responsibility Brief
+ no historical instance-level answers
+ independent Solution instance authoring
+ Reviewer
+ Host
+ Shadow
+ Layer-A-qualified V1–V5
+ Promotion Package
~~~

## 32. Supersession of old §26

After Layer A succeeds, STOP historical-case tuning and return to ordinary natural RUN / OBSERVE. The next independent capability question is whether a genuine new natural candidate can derive the Minimum Sufficient Responsibility Set under ordinary §9. Do not manufacture a sample.

## 33. Replacement criterion 17

Historical controlled validation passes only when SHADOW_AUTHORING_VERIFIED has durable qualification:

~~~text
validationLayer = HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM
responsibilityProvenance = HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES
~~~

This proves only the bounded downstream mechanism.

## 34. Replacement criterion 18

After Layer A succeeds, stop historical tuning. Natural responsibility derivation remains NOT YET OBSERVED until a genuine natural case succeeds.

## 35. Existing Task 9 becomes stale

The 2026-09-24 implementation plan Task 9 requirement that the historical Solution independently derive the Minimum Sufficient Responsibility Set became stale upon Human acceptance of this design. Do not execute Task 9 under its old proof obligation. A new implementation plan is required later.

## 36. Future governance requirement

Before the runtime mechanism becomes operative authority, formal governance reconciliation must land. If numbered PD-121, it must reconcile PD-120 with bounded shadow-authoring authority, preserve Human authoritative promotion control and PD-111, incorporate this proof split, avoid claiming historical responsibility derivation, and distinguish Layer A from natural §9 validation. If the formal decision receives another number, its actual canonical identity controls.

## 37. Future implementation plan

After governance lands, a new plan must cover at least Reference Responsibility Brief schema; Human acceptance and digest; reference-trial-local provenance; Participant materialization; contamination rules; Solution one-to-one preservation; Reviewer checks; Host one-to-one gate; Layer A reporting qualification; qualified SHADOW_AUTHORING_VERIFIED interpretation; synthetic tests; and a separately authorized real trial.

Reuse already verified capacity evidence, sealed observable payload, historical baseline materialization, attempt identity, Contract Packet, baseline attestation, Shadow Executor, V1–V5 where semantically applicable, and Promotion Package.

## 38. Design acceptance does not grant runtime authority

Human acceptance means the reference-validation architecture is accepted. It does not mean PD-121 is already operative, runtime shadow authority is active, implementation is authorized without a plan, a historical trial is authorized, natural sample generation is authorized, or promotion is authorized.

## 39. Non-goals

This reconciliation does not authorize Contract v2; a Contract v1 SHA change; treating PD-121 as already landed; a universal preschool ontology; a generic semantic taxonomy; generic Human responsibility injection for natural AE; PD-111 expansion; a new reasoning Role; automatic retry; replay; seed rerun; a manufactured natural sample; weakened INSUFFICIENT_EVIDENCE; prompt pressure toward APPLICABLE; historical implementation answer comparison; or autonomous authoritative promotion.

## 40. Reporting semantics

Reporting must distinguish at least:

~~~text
Historical controlled downstream mechanism:
NOT ESTABLISHED | PASS

Natural autonomous semantic derivation:
NOT YET OBSERVED | PASS

Natural activation:
NOT YET OBSERVED | OBSERVED

Natural effectiveness:
NOT YET OBSERVED | PARTIAL | PASS | FAIL

Authoritative promotion:
NOT PERFORMED | HUMAN-PROMOTED
~~~

Layer A may record both shadowTerminalStatus = SHADOW_AUTHORING_VERIFIED and responsibilityProvenance = HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES. It must not report “Contract v1 fully validated.”

## 41. Current accepted-state snapshot

At landing, the accepted-state snapshot is:

~~~text
Current operative governance:
PD-120

Future shadow-authoring governance reconciliation:
NOT YET LANDED

Accepted capacity evidence trust anchor:
COMPLETE

Historical Host/reference harness repairs:
COMPLETE

Participant-safe historical evidence surface:
COMPLETE

Historical reference attempts #1–#3:
COMPLETED / FAILED BEFORE SHADOW

Historical controlled downstream mechanism:
NOT ESTABLISHED

Natural autonomous semantic derivation:
NOT YET OBSERVED

Natural effectiveness:
NOT YET OBSERVED

Authoritative promotion:
NOT PERFORMED

Product stage:
RUN / OBSERVE
~~~

## 42. Acceptance record

Human accepted: 2026-09-26

The next sequence is:

~~~text
land accepted reconciliation design
→ land governance reconciliation
→ write new implementation plan
~~~

No code modification or historical trial follows automatically.
