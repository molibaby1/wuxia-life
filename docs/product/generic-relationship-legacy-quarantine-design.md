# Generic Relationship Legacy Quarantine Design

**Status:** Human-approved design, pending repository authority closure  
**Decision:** PD-104 — Generic Relationship Legacy Quarantine  
**Date:** 2026-08-31  
**Scope:** Active generic relationship legacy governance only  
**Development mode:** Destructive development; no gameplay compatibility guarantee for pre-PD-104 content state

---

## 1. Purpose

PD-104 quarantines active legacy relationship content that creates or implies durable important-person relationships without a concrete and causally established person identity when later content depends on who that person is.

The governing rule is:

> When later content depends on “who this person is,” an active relationship chain must not create that durable important-person relationship through only a generic relationship role or boolean flag.

This is a quarantine and retirement decision. It is not a replacement-character project, a relationship-system redesign, or a Person Instantiation expansion.

Person-first does **not** mean every social role in the world must become a concrete person. Transient social roles and aggregate social-network semantics remain valid where later content does not require stable person identity.

---

## 2. Authority Boundaries

### 2.1 PD-101 remains authoritative for character and relationship product semantics

PD-101 continues to govern:

- concrete-person-first relationship authoring;
- how meaningful relationships emerge from actual history;
- Character Anchors, Core Concern, Event Responsibilities, Relationship Possibilities, and Long-term Hooks;
- Romance ≠ Marriage;
- delayed abstraction;
- the rule that important persons should be grounded in concrete life experience rather than generic affinity or role labels.

PD-104 does not replace PD-101.

### 2.2 PD-103 remains a separate capability

PD-103 — Sex-Variant Person Archetype Contract v1 — only applies after a valid authored Person Archetype already exists.

PD-103 must not be used as a repair mechanism for generic relationship flags.

The following pattern is forbidden:

```text
has_master
→ automatically materialize a Person Archetype
```

PD-104 determines which current legacy chains cannot remain active. PD-101 governs how a future replacement person would be designed. PD-103 may later provide a fixed-sex or sex-variable presentation policy for that already-valid person design.

### 2.3 PD-102 remains authoritative for Parenthood / Family Life

This quarantine must not modify Parenthood semantics, child identity, successor semantics, or the Mingyue Parenthood first sample.

---

## 3. Active Legacy Disposition

### 3.1 Quarantined pending redesign

The following events must no longer be runtime-active:

```text
relationship_master_disciple
relationship_master_betrayal
relationship_master_legacy

relationship_blood_brotherhood
relationship_sworn_help

relationship_mentor_encounter

p22_relationship_mentor_obligation
```

These are retained only as legacy source material until and unless their product semantics are redesigned.

#### Master chain

Current legacy semantics create an anonymous master and later treat that role as a persistent concrete person through betrayal and legacy content.

If master content is restored later, it must first answer:

- Who is the master?
- How did the player meet them?
- Why did a master-disciple relationship form?
- Did the player actually accept that relationship?
- Are later betrayal / legacy events causally produced by that same concrete person?

The current three-event generic chain is not automatically entitled to one-for-one replacement.

#### Sworn relationship

Current legacy semantics automatically turn numeric qualifications into “several like-minded friends,” then into sworn siblings, and later impose obligations on those unnamed people.

If sworn-sibling content is restored later, it must first answer:

- Who is the concrete person or people involved?
- What actual shared experience preceded the oath?
- Did the player choose to enter the sworn relationship?
- Which concrete person later creates any responsibility or request?

#### Generic mentor

Current legacy semantics create “a senior who appreciates you” and later treat that role as a durable mentor.

If mentor content is restored later, it must first answer:

- Who is the mentor?
- In what concrete event did the mentor’s recognition occur?
- Why does the later relationship have enough causal weight to create obligation?

`ally_network` is not evidence that a mentor exists.

### 3.2 Retired semantics

The following events are retired rather than merely waiting for repair:

```text
relationship_enemy_create
relationship_revenge
```

The current enemy/revenge model is causally invalid because later revenge can fabricate an enemy history that was never established.

Future rival/enemy content must start from:

```text
concrete person
+ concrete conflict
+ unresolved durable history
```

There is no requirement to restore the old event IDs, event count, or event structure.

### 3.3 Explicitly retained and out of scope

The following relationship events remain active for this decision:

```text
relationship_life_saving
relationship_debt_return
```

Their separate life-debt direction / obligation semantics remain an independent backlog item. Retention under PD-104 does not constitute full approval of those semantics.

The following social-network content also remains active:

```text
p28_social_momentum_network_fork
p28_social_reputation_reinforcement
p29_social_momentum_patron_obligation
p42_social_momentum_youth_introduction
p42_social_momentum_later_testimonial
```

These events model aggregate social network, reputation, introductions, trust, or social capital. Their transient participants do not need stable concrete-person identity unless future content begins to depend on who those people are.

---

## 4. Consumer Closure

Quarantining a producer does not by itself justify mechanically deleting every same-named legacy flag. Each relevant flag must be audited by active producers and consumers.

However, no active consumer may continue to interpret a generic relationship boolean as a concrete person when the concrete person is not causally established.

### 4.1 `has_master`

After the generic master chain is quarantined:

- audit all remaining active producers of `has_master`;
- keep the flag only if at least one independent legitimate active producer remains and the consumer meaning is still valid;
- remove Life Memory behavior that turns `has_master` alone into a concrete “恩师” person entry or synthetic affinity.

A boolean that means “some master relationship exists” cannot by itself answer who the master is.

### 4.2 `master_legacy`

Audit all active producers and consumers.

If no independent legitimate active producer remains after quarantine:

- remove active `master_legacy` consumers, including any P18 legacy/succession consumer that depends only on this dead producer;
- do not substitute `has_master`;
- do not invent a replacement flag.

The current destructive-development stage does not preserve active compatibility branches solely for old content state.

### 4.3 `has_sworn_siblings`

After the generic sworn producer is quarantined:

- remove Life Memory behavior that turns `has_sworn_siblings` into a concrete “义兄弟/义兄弟姐妹” person entry or synthetic affinity;
- audit any remaining active producer and consumer before deciding whether the coarse historical fact itself remains valid.

A boolean that may refer to multiple people must not generate a fabricated concrete-person presentation.

### 4.4 `mentor_bond`

After `relationship_mentor_encounter` and `p22_relationship_mentor_obligation` are quarantined:

- audit for any independent legitimate active producer;
- if none remains, remove active consumers;
- do not use `ally_network` as fallback evidence;
- do not reconstruct an anonymous mentor from unrelated social-network facts.

### 4.5 `ally_network`

`ally_network` remains a valid social-network semantic where its own producers and consumers are legitimate.

It must not imply:

```text
mentor exists
master exists
specific important person exists
```

### 4.6 Enemy semantics

No replacement `has_enemy`, `enemy_bond`, `enemy_person`, or equivalent flag is created under PD-104.

Future rival/enemy content must be redesigned from concrete conflict and person history.

---

## 5. Life Memory Boundary

Life Memory must not promote generic relationship booleans into concrete-person entries.

At minimum, these facts must no longer independently create concrete person presentation or synthetic affinity:

```text
has_master
has_sworn_siblings
mentor_bond
```

This rule follows the same product principle already applied to spouse/child presentation:

> presentation may display established facts, but it must not invent person identity or relationship quality that the underlying life history does not support.

PD-103 must not be invoked to materialize a missing person merely because Life Memory wants a displayable character.

---

## 6. Quarantine Source Structure

Create a dedicated non-runtime legacy source:

```text
src/data/lines/relationship-person-legacy-deferred.json
```

It should contain exactly the nine events governed by this quarantine:

```text
relationship_master_disciple
relationship_master_betrayal
relationship_master_legacy

relationship_blood_brotherhood
relationship_sworn_help

relationship_mentor_encounter

relationship_enemy_create
relationship_revenge

p22_relationship_mentor_obligation
```

The file is intentionally not runtime-loaded.

The provenance distinction is:

- master / sworn / mentor / P22 mentor obligation: quarantined pending redesign;
- enemy / revenge: retired semantics preserved only as historical source.

The dedicated source must not be merged into the Parenthood deferred source or another unrelated deferred domain.

No Event DSL or scheduler architecture change is authorized merely to support quarantine.

---

## 7. Runtime Inventory Closure

Current accepted baseline before PD-104:

```text
runtime-loaded files = 28
runtime events = 400
relationship.json active events = 15
```

PD-104 removes exactly nine active events and adds no replacement events.

Expected runtime inventory after closure:

```text
runtime-loaded files = 28
runtime events = 391
relationship.json active events = 7
```

`391` is not a target number. It is the expected consequence of:

```text
400 - 9 = 391
```

If the actual repository inventory does not reconcile to this subtraction, implementation must stop and explain the discrepancy.

Forbidden responses to an inventory mismatch include:

- adding placeholder events;
- deleting an unrelated tenth event;
- changing counts merely to reach 391.

The formal event manifest must be regenerated after quarantine.

Only tests/guards that genuinely represent the active runtime event catalog size may be changed from `400` to `391`. Business fixtures or unrelated numeric values must not be mechanically replaced.

---

## 8. Deterministic Verification Requirements

Add an aggregate regression such as:

```text
tests/genericRelationshipLegacyQuarantine.test.ts
```

The exact filename may follow repository conventions, but the test must cover all requirements below.

### 8.1 Quarantined events are not runtime-active

Assert that the runtime catalog excludes exactly:

```text
relationship_master_disciple
relationship_master_betrayal
relationship_master_legacy
relationship_blood_brotherhood
relationship_sworn_help
relationship_mentor_encounter
relationship_enemy_create
relationship_revenge
p22_relationship_mentor_obligation
```

Also verify that the dedicated deferred source retains those IDs as legacy source material.

### 8.2 Explicitly retained events remain active

Assert that the runtime catalog still includes:

```text
relationship_life_saving
relationship_debt_return
p28_social_momentum_network_fork
p28_social_reputation_reinforcement
p29_social_momentum_patron_obligation
p42_social_momentum_youth_introduction
p42_social_momentum_later_testimonial
```

This prevents future implementation from misreading PD-104 as “all anonymous social actors must be removed.”

### 8.3 Consumer closure

Verify that:

- `has_master` does not independently create a concrete Life Memory person entry or synthetic affinity;
- `has_sworn_siblings` does not independently create a concrete Life Memory person entry or synthetic affinity;
- `ally_network` cannot produce a player-facing “昔日恩师” obligation;
- `master_legacy` and `mentor_bond` have their active producer/consumer dispositions reconciled against actual repository evidence.

For each of these relevant flags, implementation must report:

```text
active producers after quarantine
active consumers after quarantine
final disposition
```

If an independent legitimate producer exists, keep only consumers whose semantics are genuinely supported by that producer.

### 8.4 Catalog closure

Verify:

```text
runtimeLoadedFiles === 28
totalEventsInRuntime === 391
relationship active events === 7
```

---

## 9. Testing Scope

Focused verification must include the new quarantine regression plus affected:

- Life Memory regression;
- P17 regression;
- P18 regression;
- relationship-focused tests;
- PD-101 / Character Relationship contract regressions;
- PD-103 Sex-Variant Person Archetype regressions;
- Mingyue / Saiyin / Marriage regressions where existing gates cover them.

Then run repository-standard:

```bash
npm run report:event-asset-inventory
npm run typecheck
npm run test:headless
npm run test:headless:parity
git diff --check
```

Run the current full repository gates according to repository convention.

Existing repository-level failures must be reported separately and must not be repaired under PD-104 unless they are directly caused by the quarantine changes.

---

## 10. Destructive Development Policy

The project is currently in a destructive development stage.

PD-104 does not guarantee gameplay continuity for pre-PD-104 content state.

A structurally readable old Snapshot may contain legacy facts such as:

```text
has_master
master_legacy
has_sworn_siblings
mentor_bond
```

but PD-104 does not require those old content states to continue the quarantined progression.

Do not add:

- migration;
- fallback;
- inferred concrete person;
- history reconstruction;
- aliasing;
- compatibility-only events;
- dead-flag compatibility consumers.

Snapshot compatibility must not be used as justification for preserving invalid active product semantics.

---

## 11. Replacement Rules

Quarantine does not automatically authorize replacement content.

Future replacement of master, sworn sibling, mentor, or rival/enemy content must be separately classified and approved.

### 11.1 Replacement is not one-for-one

Removing three legacy master events does not require three replacement master events.

Future redesign may:

- use one concrete person with a different event count;
- reuse an existing path-specific concrete person where Access and history support it;
- decide that a generic wandering-master chain does not need to return.

The deferred source is historical provenance, not a feature-backlog checklist.

### 11.2 No automatic Relationship v2 project

Master, sworn sibling, mentor, and rival/enemy semantics are different product domains.

They must not be automatically bundled into a generic “Relationship v2” implementation.

### 11.3 PD-103 remains optional

A future valid replacement person may be:

```text
fixed-sex archetype
```

or, where sex does not alter the person’s core semantics:

```text
sex-variable archetype
```

That choice happens only after the concrete Person Archetype itself is product-valid.

---

## 12. Explicit Non-Goals

PD-104 does not authorize:

- replacement master content;
- replacement sworn-sibling content;
- replacement mentor content;
- replacement enemy/rival content;
- new Person Archetypes;
- expansion of the PD-103 catalog;
- generic Person/NPC generation;
- Relationship schema changes;
- affinity redesign;
- new relationship flags;
- `relationship_life_saving` / `relationship_debt_return` semantic cleanup;
- social-network redesign;
- P17 or P18 domain redesign;
- Parenthood changes;
- Snapshot migration framework.

---

## 13. Mandatory STOP Conditions

Implementation must stop and return for Human redesign if any of the following becomes necessary:

- Runtime requires replacement master / sworn / mentor / enemy content to remain functional.
- A new Person Archetype must be created.
- PD-103 catalog must be expanded.
- Relationship schema must change.
- New relation flags are required.
- P17 or P18 requires product redesign rather than removal/closure of a direct legacy consumer.
- Life-saving/debt cleanup becomes inseparable from PD-104.
- Social-network semantics require restructuring.
- Runtime inventory cannot be reconciled as `400 - 9 = 391`.
- Compatibility requires migration, fallback, reconstruction, or inferred concrete persons.

The default response is `BLOCKED`, not opportunistic generalization.

---

## 14. Acceptance Criteria

PD-104 is complete only when all of the following hold:

1. The nine governed legacy events are no longer runtime-active.
2. The dedicated deferred source preserves those nine event definitions.
3. Runtime event count is 391 because the accepted 400-event baseline lost exactly nine active events.
4. Runtime-loaded source count remains 28.
5. `relationship.json` contains seven active events.
6. Master/sworn/mentor-related consumers are reconciled against actual remaining producers.
7. Life Memory no longer creates concrete master/sworn/mentor persons or synthetic affinity from generic relationship booleans alone.
8. `ally_network` no longer serves as evidence for an existing mentor.
9. No replacement person or relationship model is introduced.
10. No new relationship flags are introduced.
11. PD-103 is not expanded or used to auto-materialize missing legacy persons.
12. No Snapshot/content compatibility framework is added.
13. `relationship_life_saving` / `relationship_debt_return` remain out of scope.
14. The five retained social-network events remain out of scope and runtime-active.
15. Existing unrelated repository-level failures are reported separately rather than repaired under this decision.

---

## 15. Decision Summary

PD-104 deliberately reduces active content rather than immediately replacing it.

The intended sequence is:

```text
stop producing invalid generic important-person relationships
↓
close direct fabricated consumers
↓
observe where real life content still needs a concrete person
↓
redesign that specific person/domain later under PD-101
↓
optionally use PD-103 only if sex variation is semantically safe
```

The governing principle is:

> Removing invalid relationship semantics is preferable to preserving feature count with fabricated people, compatibility branches, or premature generic systems.
