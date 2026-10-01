# Artifact-Backed Structured Final Result V1 — Design

**Date:** 2026-10-01
**Status:** APPROVED DESIGN
**Human approval:** 2026-10-01 — approved fixed Host path, small receipt + SHA, 1 MiB transport ceiling, and zero-retransmission artifact-backed pilot
**Project:** wuxia-life / Auto Evolution
**Scope:** Solution Participant structured-result transport; controlled reference path first

## 1. Purpose

Introduce an artifact-backed transport mode for large machine-consumable Solution results.

The design changes **how a complete `SolutionWorkV1` is transported from the Participant to the Host**. It does not change the semantic result, the Agent's reasoning authority, the Host's validation authority, Reviewer input semantics, Contract authority, or promotion authority.

The architectural invariant remains:

> **Framework controls protocol. Agent controls content.**

The new transport is:

```text
Agent reasoning
        ↓
Agent writes complete SolutionWorkV1 JSON to one Host-fixed workspace artifact
        ↓
Agent terminal message returns one small integrity receipt
        ↓
Host validates receipt
        ↓
Host reads the fixed artifact bytes
        ↓
Host verifies byte length + SHA-256
        ↓
Host applies the existing strict JSON-object envelope rules
        ↓
Host applies validateSolutionWork()
        ↓
Host applies existing accepted-result / reference / Contract checks
        ↓
accepted SolutionWorkV1 or FAIL CLOSED
```

The artifact is a transport carrier only. It receives no semantic authority.

---

## 2. Evidence motivating the design

### 2.1 Large terminal-result path is unreliable under the sealed reference binding

Under the sealed binding:

- Codex CLI: `0.159.0`
- model: `gpt-6-luna`
- reasoning effort: `max`
- ambient config SHA-256: `96b427bf579753a79fb19fee077501de8dc0f026f221886ee31d822ef149bdc9`
- native envelope schema SHA-256: `358cdca1ea154dbe62ccb12bad41aceaf9e645c4cdcc8e47d6bac71aa5d19f30`

the corrected large-terminal Matrix B produced 0/3 completed results. B-01, B-02, and B-03 all hit the existing `1_800_000ms` initial hard timeout without a completed terminal JSON object.

Matrix A under the same binding completed 3/3 with small terminal objects in approximately 40–43 seconds.

This establishes a size/workload-dependent reliability boundary in the current terminal-result path. It does not establish whether the dominant internal cause is model large-output generation, structured-output handling, or provider stream transport.

### 2.2 Artifact-backed diagnostic spike

A throwaway diagnostic changed only the delivery shape:

```text
large structured object
→ workspace tool writes file
→ terminal returns small receipt
```

The valid v2 spike matched production stdin behavior and ran three independent trials with a 300-second observation ceiling.

All three passed:

- 70,897ms
- 65,324ms
- 63,788ms

Each produced:

- a `24,850` byte JSON artifact;
- identical SHA-256 `bd0d9ab717c180e8dfe2313a9843517f65395cd9967fd660d21942977bf55e2d`;
- a valid small terminal receipt;
- exact artifact/receipt integrity match;
- valid JSON;
- exact expected structure.

One successful trial also observed a model-manager refresh timeout without preventing completion.

The earlier v1 spike is explicitly invalid evidence because its temporary Python harness inherited stdin while production Participant execution uses ignored stdin. V1 was preserved rather than rewritten; only v2 supports this design.

### 2.3 Evidence-level conclusion

The evidence supports this conclusion:

> Moving large structured result bytes out of the model terminal message and into a workspace artifact materially changes reliability under the tested binding.

The evidence does **not** prove a specific internal provider bug. It also does not prove that a model can author a novel 25 KiB semantic Solution result through workspace tools: the spike materialized deterministic content from supplied generator logic. That remaining question is the reason historical Solution-only artifact-backed probes are a mandatory gate.

This design therefore addresses the observable architectural boundary rather than guessing at an internal transport root cause.

---

## 3. Goals

V1 MUST:

1. preserve `SolutionWorkV1` as the complete semantic result;
2. move the complete Solution result bytes from the terminal message into one Host-fixed workspace artifact;
3. keep the terminal result small and machine-consumable;
4. cryptographically bind the terminal receipt to the exact artifact bytes;
5. prevent Agent-selected artifact paths;
6. prevent path traversal, symlink substitution, stale-file acceptance, unbounded result-file reads, and post-hoc Host repair;
7. preserve the current strict Host JSON and Role-schema validation semantics;
8. keep downstream Reviewer and autonomous-authoring semantics unaware of the transport mode;
9. preserve the existing `1_800_000ms` initial hard timeout during the pilot;
10. avoid carrying the unresolved 60-second retransmission policy into the first artifact-backed slice;
11. validate the transport with synthetic and historical Solution-only probes before reopening governed Layer A;
12. keep ordinary non-pilot Participant behavior unchanged until evidence supports broader rollout.

---

## 4. Non-goals

V1 does NOT:

- change `SolutionWorkV1`;
- change `AutonomousAuthoringProposalV1`;
- change the Preschool authoring Contract;
- change Reviewer input or Reviewer authority;
- change Shadow Authoring authority;
- change Human promotion authority;
- introduce Host semantic repair;
- introduce JSON extraction from arbitrary prose;
- allow the Agent to choose a result path;
- make `artifactRefs` inside `SolutionWorkV1` refer to the transport artifact;
- increase the initial hard timeout;
- select a new retransmission timeout;
- add a second retransmission;
- generalize immediately to every Role;
- claim Layer A, Layer B, or Natural Effectiveness success.

---

## 5. Alternatives considered

### 5.1 Recommended — Host-fixed artifact + small integrity receipt

The Agent writes the complete Role result to a fixed workspace path chosen by the Host. The terminal result contains only integrity metadata.

Advantages:

- removes large Role bytes from terminal generation/delivery;
- no path traversal surface in the receipt;
- keeps Host semantic validation unchanged;
- keeps provider-specific logic narrow;
- gives explicit byte-level provenance.

This is the selected design.

### 5.2 Rejected for V1 — Agent-selected path in the receipt

The receipt could contain an arbitrary relative path.

This creates unnecessary protocol surface:

- path traversal validation;
- ambiguous file selection;
- symlink/reference substitution;
- accidental coupling to Agent naming choices.

V1 therefore does not let the Agent choose the result path.

### 5.3 Rejected for V1 — Provider-native event/tool extraction as the authoritative result

The Host could attempt to identify the result directly from provider tool events.

This would make the Role-result contract provider-specific and couple semantic acceptance to Codex event structure.

Provider-native events remain transport observability only.

### 5.4 Rejected as primary response — larger hard timeout

The corrected large-terminal Matrix B failed 0/3 at 30 minutes, while the artifact-backed spike completed in roughly one minute.

Increasing the timeout would retain the same failing transport architecture without explaining why more time is the correct fix.

---

## 6. Contract boundary

Artifact-backed delivery separates two objects:

1. **Terminal Receipt** — transport metadata only.
2. **Structured Result Artifact** — the complete Role result consumed by Host semantic validation.

Conceptually:

```text
provider-native stream
        │
        ├─ thinking / progress / tool events
        │
        ├─ workspace write of structured result artifact
        │
        └─ small terminal receipt
                 │
                 ▼
        receipt validation
                 │
                 ▼
        fixed artifact lookup + integrity validation
                 │
                 ▼
        structured Role result
                 │
                 ▼
        existing Host semantic validation
```

The terminal receipt is **not** a `SolutionWorkV1`.

The structured artifact is the `SolutionWorkV1`.

---

## 7. Host-fixed result location

V1 uses one reserved relative workspace path:

`.evolution-participant/final-result.json`

The exact string is part of the V1 protocol.

Rules:

1. The Host determines this path; the receipt does not contain a path field.
2. Before the Participant starts, the Host MUST verify that the reserved result file does not already exist.
3. The Host MAY create the reserved parent directory before execution.
4. If the reserved path or parent cannot be safely prepared, execution fails before Participant invocation.
5. If the reserved parent directory already exists, the Host MUST verify it is a real directory inside the disposable workspace and not a symlink.
6. After Participant completion, the result path MUST resolve to a regular file inside the disposable workspace.
7. The result file and every reserved-path component MUST remain inside the workspace; symlink redirection is invalid.
8. The Host MUST NOT search the workspace for alternative result files.
9. Missing result file is a transport failure.
10. Additional files in the workspace do not substitute for the fixed result artifact.

The reserved transport artifact is distinct from domain `artifactRefs` carried inside `SolutionWorkV1`.

---

## 8. Terminal Receipt V1

The terminal message MUST be exactly one JSON object with exactly these fields:

```json
{
  "schemaVersion": "artifact-backed-structured-final-result-receipt-v1",
  "bytes": 24850,
  "sha256": "64-lowercase-hex-characters"
}
```

Rules:

- `schemaVersion` MUST equal `artifact-backed-structured-final-result-receipt-v1`;
- `bytes` MUST be a non-negative integer no greater than `1_048_576`;
- `sha256` MUST match `^[0-9a-f]{64}$`;
- no unknown fields are allowed;
- the receipt MUST satisfy the existing bare-JSON/no-prose/no-Markdown terminal envelope rules;
- receipt validity does not imply Role-result validity.

The receipt deliberately omits:

- result path;
- Role schema name;
- semantic status;
- Contract fields;
- reference fields;
- any domain content.

All of those are already known by the Host execution context or belong in the structured result artifact.

---

## 9. Provider-native output schema

For Codex artifact-backed execution, provider-native `--output-schema` MAY constrain the terminal receipt to the exact Receipt V1 shape.

This is allowed because the receipt schema is transport metadata only.

The provider-native schema MUST NOT encode:

- `SolutionWorkV1` fields;
- autonomous-authoring fields;
- Card fields;
- Contract semantics;
- reference semantics;
- identity semantics;
- promotion semantics.

The Host independently validates the receipt even if the provider reports structured-output success.

The receipt-schema bytes and SHA-256 become part of the sealed reference Participant binding.

Changing the receipt schema therefore creates a different controlled binding.

---

## 10. Artifact integrity validation

After the Participant process has completed successfully and the terminal receipt is valid, the Host performs artifact validation in this order:

1. resolve the fixed Host-owned path;
2. use file metadata that does not follow a symlink to confirm the result is a regular file;
3. reject before reading if the file size exceeds `1_048_576` bytes;
4. read the artifact bytes once into Host memory;
5. compute byte length from those exact bytes;
6. compute SHA-256 from those exact bytes;
7. require exact equality with receipt `bytes` and `sha256`;
8. persist the exact raw artifact bytes to the Host-owned destination evidence directory using create-only semantics;
9. decode those exact bytes as strict UTF-8 and reject invalid UTF-8 rather than replacement-decoding it;
10. apply the structured JSON-object envelope validator to the strictly decoded text;
11. pass the parsed object to the existing Role-specific validator;
12. run the existing accepted-result validations.

The Host MUST NOT:

- repair the artifact;
- reserialize it before integrity comparison;
- normalize whitespace before hashing;
- strip Markdown;
- search for a JSON substring;
- rename fields;
- fill missing fields;
- accept a different file if the fixed path is invalid.

Hashing is performed over the exact file bytes, not canonicalized JSON.

`1_048_576` bytes is a transport safety ceiling, not a semantic `SolutionWorkV1` size rule. The Host MUST NOT truncate or compress an oversized result into acceptance. If a legitimate Solution result needs more than this ceiling, fail closed and return to design review.

---

## 11. Structured-result envelope semantics

The artifact bytes inherit the semantic requirements currently applied to a valid structured terminal Role result:

- exactly one JSON object;
- object root only;
- legal JSON whitespace allowed;
- no prose;
- no Markdown fences;
- no multiple adjacent values.

The implementation may reuse or factor the current envelope validator, but it MUST NOT weaken validation behavior.

The architecture is conceptually revised from:

```text
terminal Role payload
→ Structured Final Output Contract V1
→ Role schema
```

to:

```text
small terminal transport receipt
→ artifact integrity gate
→ complete structured Role payload
→ Structured Final Output semantics
→ Role schema
```

For the artifact-backed Solution pilot, the phrase **terminal Role payload** in the original V1 design is therefore superseded by **Host-consumed structured Role payload** for the full `SolutionWorkV1` bytes.

Existing terminal-mode Roles remain governed by the original terminal form.

---

## 12. Solution prompt contract

Artifact-backed Solution instructions MUST be short and mechanically explicit.

They must communicate semantics equivalent to:

```text
Produce the complete SolutionWorkV1 as one valid JSON object.

Write the complete JSON object to the Host-reserved result file:
.evolution-participant/final-result.json

Do not use the terminal message to carry SolutionWorkV1.

After writing the result file, compute its exact byte length and SHA-256.

Your terminal result must contain only Artifact-Backed Structured Final
Result Receipt V1 with the exact byte length and SHA-256.

The Host will reject rather than repair either the receipt or result artifact.
```

The existing Solution reasoning, convergence, authority, Contract, and Role-schema guidance remains unchanged.

The prompt MUST NOT instruct the model to duplicate the full result in both the artifact and terminal message.

---

## 13. Host execution mode

Artifact-backed delivery is a new explicit execution mode, conceptually:

```ts
type StructuredResultDeliveryMode =
  | { kind: 'TERMINAL_JSON' }
  | {
      kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
      resultRelativePath: '.evolution-participant/final-result.json';
    };
```

The exact TypeScript shape may follow repository conventions, but the semantics are fixed.

V1 requirements:

- existing Roles default to `TERMINAL_JSON`;
- only the controlled Solution pilot enables `WORKSPACE_ARTIFACT_RECEIPT_V1`;
- downstream validation receives the same parsed `SolutionWorkV1` type regardless of transport;
- Reviewer and later workflow stages MUST NOT branch on transport mode.

This keeps transport below the domain workflow boundary.

---

## 14. Evidence persistence

For artifact-backed execution, Host-owned destination evidence MUST preserve separately:

1. the original Participant prompt;
2. Participant binding receipt;
3. provider raw stream;
4. terminal receipt text;
5. exact copied result-artifact bytes;
6. computed artifact byte length;
7. computed artifact SHA-256;
8. receipt validation outcome;
9. artifact integrity outcome;
10. structured envelope outcome;
11. Role-schema outcome;
12. accepted-result outcome;
13. execution trace.

The copied raw artifact is diagnostic/provenance evidence.

The existing canonical accepted `result.json` may still be written from the validated `SolutionWorkV1` after acceptance.

The raw transport artifact and canonical accepted result are distinct evidence objects and MUST NOT be silently conflated.

---

## 15. Failure classification

V1 must preserve fail-closed behavior and distinguish transport from semantic validation.

At minimum, artifact-backed execution must be able to distinguish:

- Participant runtime/process failure;
- initial hard timeout;
- invalid terminal receipt envelope;
- invalid terminal receipt schema;
- missing result artifact;
- result artifact not a regular file;
- result artifact symlink;
- receipt/artifact byte-length mismatch;
- receipt/artifact SHA-256 mismatch;
- invalid structured-result JSON envelope;
- Role-schema failure;
- accepted-result/reference/Contract failure.

The exact persisted failure enum may reuse existing categories where possible.

Do not broaden production failure taxonomy merely for nicer names if that would force unrelated migrations.

However, diagnostic evidence MUST retain enough detail to identify the earliest failing boundary.

---

## 16. Retransmission policy

Artifact-backed V1 does **not** reuse the existing bounded retransmission automatically.

Reason:

- the current 60-second retransmission ceiling is not supported by existing continuation measurements;
- artifact-backed failure modes differ from terminal-only envelope failure;
- no runtime evidence yet establishes the correct recovery semantics for missing/invalid artifact or invalid receipt.

Therefore, in the first controlled artifact-backed Solution pilot:

- maximum artifact-backed retransmissions = zero;
- a failed receipt/artifact/integrity/schema gate fails closed;
- the existing terminal-mode Solution retransmission implementation remains unchanged for non-pilot flows;
- no production timeout constant is modified.

A later artifact-backed recovery slice requires its own evidence and Human approval.

---

## 17. Initial hard timeout

The existing Solution Participant hard timeout remains:

`1_800_000ms`

The synthetic spike completed much faster, but that workload did not include real repository investigation or Solution reasoning.

Therefore the spike does not justify reducing or increasing the real Solution hard boundary.

If historical artifact-backed Solution-only probes still hit 1,800 seconds before writing/returning a valid result, return to workload/convergence/runtime design review.

Do not solve such a failure by automatically increasing the timeout.

---

## 18. Security and containment

The Host MUST enforce:

- fixed Host-owned result path;
- result remains inside the disposable workspace;
- no symlink result file;
- no path from terminal receipt;
- no symlink in the reserved path chain;
- result artifact size at or below `1_048_576` bytes;
- exact receipt hash/size match;
- no acceptance before process completion;
- no workspace search fallback;
- no writes to the authoritative repository;
- no governed reference-trial history mutation from communication probes.

The artifact-backed result file is allowed only in the isolated mutable workspace.

The Host-owned evidence copy is written only after process completion.

---

## 19. Pilot scope

V1 pilot scope is intentionally narrow:

- Role: Solution only;
- provider/binding: sealed Codex reference Participant;
- use case: communication validation and historical Solution-only reference probe;
- no Reviewer transport change;
- no Configuration Execution transport change;
- no ordinary-run rollout by default;
- no governed Layer A execution until pilot gates pass and Human authorizes reopening.

The implementation should remain structurally reusable, but V1 must not claim generality from a Solution-only sample.

---

## 20. Validation sequence

### 20.1 Deterministic engineering tests

Tests MUST prove:

- fixed-path preparation rejects stale/preexisting result files;
- receipt accepts only exact fields and rejects `bytes > 1_048_576`;
- invalid receipt envelope fails;
- path cannot be supplied or redirected by the Agent;
- symlink result is rejected;
- missing result is rejected;
- byte-length mismatch is rejected;
- SHA mismatch is rejected;
- exact artifact bytes are what get hashed and parsed;
- invalid UTF-8 artifact bytes are rejected without replacement decoding;
- pretty-printed valid result JSON is accepted;
- invalid artifact JSON is rejected without extraction/repair;
- invalid `SolutionWorkV1` is rejected by existing validator;
- accepted-result/reference checks still run after transport/integrity/schema gates;
- terminal-mode behavior remains unchanged;
- artifact-backed pilot has zero retransmissions.

### 20.2 Synthetic artifact-backed matrix

Under one sealed binding, run three independent synthetic large-result trials.

Each trial must:

- produce a result artifact in the fixed path;
- complete within the observation ceiling;
- return a valid small receipt;
- match receipt bytes/SHA exactly;
- pass JSON envelope validation;
- pass the synthetic structure validator;
- apply no Host repair.

Required gate: 3/3 pass.

The prior throwaway spike is supporting evidence, not a substitute for the production harness matrix.

### 20.3 Historical Solution-only artifact-backed probes

Only after the synthetic matrix passes, run two independent historical Preschool Solution-only probes using the same controlled inputs and the artifact-backed mode.

Both probes MUST:

- use one sealed binding;
- use the same historical evidence/observable/responsibility inputs;
- use the same Solution reasoning and Contract guidance;
- complete before `1_800_000ms`;
- return a valid receipt;
- produce an integrity-valid artifact;
- produce a valid structured JSON object;
- reach Host `SolutionWorkV1` schema validation;
- leave authoritative repository fingerprint unchanged.

A Role-schema failure still demonstrates successful transport if schema validation is actually reached, but it does not establish semantic success.

No Reviewer or Shadow execution occurs in this validation layer.

---

## 21. Governed Layer A reopening gate

Artifact-backed transport alone does not reopen Layer A.

A new governed Layer A campaign may be proposed only after:

1. this design is Human-approved;
2. implementation passes deterministic tests and regressions;
3. synthetic artifact-backed matrix passes 3/3;
4. two historical Solution-only artifact-backed probes both reach Host Role-schema validation;
5. authoritative repository fingerprint remains unchanged during probes;
6. governed history remains unchanged;
7. no automatic promotion path is introduced.

Reopening still requires a separate fresh Human authorization.

No `attempt-000012` authorization candidate is created by this design or its communication validation.

---

## 22. Downstream semantics

After Host artifact/integrity/envelope/schema validation succeeds, downstream code receives an ordinary validated `SolutionWorkV1`.

Therefore:

- Reviewer input semantics do not change;
- Reviewer does not consume the receipt;
- Reviewer does not read the transport artifact;
- autonomous-authoring proposal semantics do not change;
- reference validation does not change;
- Host admission semantics do not change;
- Shadow Authoring semantics do not change;
- Human promotion semantics do not change.

Transport provenance may be persisted, but it is not part of domain authority.

---

## 23. Relationship to Structured Final Output Contract V1

This design extends the earlier contract rather than weakening it.

The earlier contract correctly established:

- machine-consumable JSON object;
- no prose/Markdown wrappers;
- strict Host validation;
- no repair;
- Role-specific schema authority.

The evidence now shows that requiring the **large full Role object itself** to be the terminal model message is unreliable for the current Solution workload/binding.

Artifact-backed V1 therefore preserves all strict structured-result semantics while moving the full Role object across a different carrier.

For terminal-mode Roles:

```text
terminal message = complete Role result
```

For artifact-backed Solution:

```text
terminal message = transport receipt
fixed artifact = complete Role result
```

In both cases:

```text
Host-consumed complete Role result
→ strict JSON object
→ exact Role schema
→ no repair
```

---

## 24. Relationship to Reference Participant Binding

The sealed binding design remains authoritative.

Artifact-backed controlled evidence must bind:

- executable real path;
- executable version;
- explicit model;
- explicit reasoning effort;
- ambient config SHA;
- provider-native terminal receipt schema SHA;
- artifact-backed delivery mode/version.

A change to any of these facts requires fresh communication evidence.

The result artifact's content SHA is per-run evidence and is not part of the static Participant binding lock.

---

## 25. Implementation boundaries

Likely implementation areas:

- shared structured-participant execution transport;
- Solution prompt rendering;
- Codex reference Participant terminal receipt schema;
- artifact/receipt validation and evidence persistence;
- reference communication matrix;
- historical Solution-only communication probe;
- focused tests and narrow stage documentation.

The implementation MUST NOT require changes to:

- `SolutionWorkV1`;
- autonomous-authoring domain schemas;
- Reviewer domain schema;
- Shadow Authoring authority;
- catalog/product semantics;
- promotion authority.

If implementation requires one of those changes, stop and return to design review.

---

## 26. Engineering acceptance criteria

Implementation is accepted only if all are true:

1. full `SolutionWorkV1` is written to the Host-fixed workspace artifact in artifact-backed mode;
2. terminal message contains only Receipt V1;
3. receipt contains no path;
4. Host rejects stale/preexisting fixed result files;
5. Host rejects symlink/non-regular result files and symlinked reserved-path components;
6. Host rejects result artifacts larger than `1_048_576` bytes without reading/truncating them into acceptance;
7. Host computes byte length and SHA from exact file bytes;
8. receipt and file integrity must match exactly;
9. Host persists exact raw artifact bytes create-only;
10. artifact bytes must decode as strict UTF-8 and satisfy strict structured-result JSON envelope semantics;
11. existing `validateSolutionWork()` remains authoritative and unchanged in meaning;
12. existing accepted-result/reference/Contract checks remain authoritative;
13. downstream receives validated `SolutionWorkV1`, not receipt metadata;
14. Host performs no extraction, normalization, or repair;
15. artifact-backed pilot performs zero retransmissions;
16. production initial hard timeout remains `1_800_000ms`;
17. ordinary terminal-mode Roles remain behaviorally unchanged;
18. synthetic artifact-backed matrix passes before historical probes;
19. historical probes remain outside governed attempt history;
20. `attempt-000012` is not created;
21. relevant regression suites and typecheck pass.

---

## 27. Stop conditions

Return to Human design review if implementation appears to require:

- Agent-selected result paths;
- Host search for alternative files;
- semantic repair;
- Role-schema duplication into transport receipt;
- weakening `validateSolutionWork()`;
- receipt fields that carry domain authority;
- automatic retransmission for artifact-backed failures;
- changing the 60-second retransmission ceiling;
- changing the 1,800-second hard timeout;
- Reviewer/Shadow transport redesign;
- governed Layer A execution before communication gates pass;
- automatic promotion.

---

## 28. Design conclusion

The current evidence supports changing the carrier, not weakening validation and not extending timeouts.

Artifact-Backed Structured Final Result V1 therefore makes one architectural move:

> **Large Role result bytes live in one Host-fixed isolated workspace artifact; the model terminal message becomes a small integrity receipt.**

Everything after transport remains strict and Host-authoritative:

```text
Agent-owned content
        ↓
fixed artifact
        +
small receipt
        ↓
Host integrity gate
        ↓
Host structured-result envelope gate
        ↓
Host Role schema / references / Contract
        ↓
existing downstream workflow
```

The first implementation remains Solution-only and controlled-reference-only until synthetic and historical communication evidence justifies broader use.

---

## 29. Self-review

### Placeholder scan

No TBD/TODO/placeholder requirements remain.

### Internal consistency

- Receipt is transport-only and contains no Agent-selected path.
- Full semantic result remains `SolutionWorkV1`.
- Host validates exact artifact bytes before domain validation.
- Existing downstream workflow consumes the same validated type.
- Retransmission is explicitly disabled for the first artifact-backed pilot.
- Production hard timeout remains unchanged.
- Governed Layer A remains separately authorized.

### Scope check

The design introduces one transport mode and a Solution-only controlled pilot. It does not redesign Reviewer, Shadow, Contract, or promotion semantics.

Scope is suitable for one implementation plan.

### Ambiguity check

Resolved explicitly:

- the fixed artifact path is protocol-defined;
- symlinks are invalid;
- receipt has no path;
- hashing uses exact bytes, not canonical JSON;
- raw artifact evidence and accepted canonical result are distinct;
- the existing 60-second retransmission is not inherited by the first artifact-backed pilot;
- successful transport to Role-schema validation is distinct from semantic success.
