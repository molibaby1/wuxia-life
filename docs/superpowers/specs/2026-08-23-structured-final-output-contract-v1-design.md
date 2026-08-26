# Structured Final Output Contract V1 — Design Spec

**Date:** 2026-08-23  
**Status:** Approved design, pending implementation planning  
**Project:** wuxia-life / Auto Evolution

## 1. Purpose

Introduce a minimal shared communication contract for machine-consumable terminal outputs produced by Auto Evolution Participants.

The contract standardizes **how a Participant delivers its final structured result** without standardizing the Participant's reasoning, investigation method, or domain conclusion.

The design is intentionally limited to a first slice of the broader Participant Communication Contract direction:

> **P3 Minimal Slice #1 — Structured Final Output Contract V1**

It exists to reduce output-envelope variance across different harnesses and models while preserving the project's core boundary:

> **Orchestrator owns workflow; Agents own reasoning.**

The contract corrects communication, not thought.

---

## 2. Motivation

Current receiver-side contracts are already strict:

```text
raw Participant output
→ JSON.parse(...)
→ role-specific schema validation
→ reference validation
→ ACCEPT / REJECT
```

The host intentionally does not repair malformed output.

However, sender-side prompt delivery is inconsistent across Roles and providers. Different Roles currently express requirements such as:

- "return only the structured result";
- "only output final JSON";
- "must output JSON";

with different wording and enforcement strength.

Provider behavior also differs. Some provider integrations can request structured JSON output, while workspace-capable Agents such as Codex and Cursor primarily depend on prompt-level instructions.

This creates a gap:

> **The receiver contract is stricter and more uniform than the sender-delivered communication contract.**

Observed runtime evidence makes this gap concrete:

- Cursor produced a terminal answer consisting of prose plus a fenced, contract-shaped JSON payload rather than bare JSON.
- Hypothesis runs have shown role-schema requirements that were stricter than the semantics explicitly delivered in the prompt.
- Provider-level structured-output enforcement is not uniform.

The first problem is the scope of this design. The Hypothesis semantic mismatch is related evidence, but is explicitly deferred from V1.

---

## 3. Design Goals

V1 MUST:

1. define one shared terminal-output envelope contract;
2. be reusable by multiple Roles with different domain schemas;
3. require exactly one machine-consumable JSON object;
4. make Markdown wrappers and prose outside the JSON invalid;
5. preserve strict fail-closed receiver behavior;
6. prohibit host-side semantic repair;
7. allow valid negative outcomes only through the Role's own schema;
8. remain independent of provider-specific structured-output capabilities;
9. preserve existing Orchestrator, runtime, timeout, retry, and schema boundaries;
10. remain small enough to validate before broader rollout.

---

## 4. Non-Goals

V1 does NOT introduce or redesign:

- a full Participant Communication Contract registry;
- a provider capability registry;
- JSON Schema generation;
- provider-specific structured-output orchestration;
- Cursor stream-json production integration;
- Cursor model selection or routing;
- Cursor timeout policy;
- Codex timeout policy;
- shared parsing infrastructure;
- output repair or normalization;
- failure taxonomy migration;
- Workflow Steps for communication phases;
- new trace events;
- new operational reporting schema;
- Hypothesis `feedbackRefs` semantic requirements;
- Feedback / Hypothesis / Modification Work rollout;
- reasoning or chain-of-thought control.

---

## 5. Contract Boundary

The contract applies to:

> **the terminal Role payload consumed by the orchestrated workflow.**

It does NOT apply to provider-native progress events or internal execution events such as:

- thinking;
- tool calls;
- tool results;
- session initialization;
- progress messages;
- transport-native event envelopes.

Conceptually:

```text
Participant internal work / provider-native stream
        │
        ├─ thinking
        ├─ tool calls
        ├─ progress
        └─ intermediate events
        │
        ▼
terminal role payload
        │
        ▼
Structured Final Output Contract V1
        │
        ▼
role-specific strict parser / validator
```

This separation allows future provider adapters to observe native event streams while keeping the domain payload contract strict.

---

## 6. Structured Final Output Contract V1

### Rule 1 — Exactly one JSON object

The terminal Role payload MUST contain exactly one JSON object.

The top-level value MUST be an object, not an array or scalar.

Multiple adjacent JSON values are invalid.

### Rule 2 — Bare JSON only

After trimming leading and trailing whitespace:

- the first character MUST be `{`;
- the last character MUST be `}`.

Whitespace inside or around the JSON object is allowed.

### Rule 3 — No prose outside JSON

The terminal payload MUST NOT contain explanatory text, headings, acknowledgements, or any other prose before or after the JSON object.

Invalid examples include:

```text
Here is the result:
{...}
```

and:

```text
{...}
This is my recommendation.
```

### Rule 4 — No Markdown or code fences

The terminal payload MUST NOT be wrapped in Markdown or fenced code blocks.

A valid JSON object inside a fenced block is still a communication-contract failure.

### Rule 5 — Exact Role-specific schema

The shared contract does not define domain fields.

Instead, the terminal JSON object MUST satisfy the exact Role-specific schema named by the task.

Examples:

```text
Solution                → SolutionWorkV1
Reviewer                → SolutionReviewV1
Configuration Execution → ConfigurationExecutionResultV1
```

The shared layer MUST NOT contain Role-specific business logic.

### Rule 6 — Host validates or rejects; never repairs

The host behavior is:

```text
VALIDATE
or
REJECT
```

The host MUST NOT:

- strip Markdown fences;
- extract a JSON block from prose;
- repair quotes;
- rename fields;
- fill missing fields;
- normalize semantic values;
- guess which of multiple JSON values is intended;
- infer missing Role output.

This rule is part of the communication contract, not merely a current parser implementation detail.

### Rule 7 — Negative outcomes still use the Role schema

Failure to produce a positive result does not suspend the output contract.

A Participant MUST express negative or non-actionable outcomes through statuses/results already defined by the Role-specific schema.

For example, if the Solution schema permits:

```text
INSUFFICIENT_EVIDENCE
NO_PROPOSAL
ESCALATE
```

the Participant must use those structured outcomes rather than free-form text.

The shared contract does not define which negative statuses exist.

---

## 7. Prompt Wording

The shared renderer should produce a short, mechanically explicit fragment with semantics equivalent to:

```text
Structured Final Output Contract V1

Your terminal result must be exactly one valid JSON object matching the
<ROLE_SCHEMA_NAME> schema required by this task.

Output bare JSON only. Do not include Markdown/code fences, prose,
explanations, headings, or any other text before or after the JSON object.

If the task requires a negative or non-actionable outcome, represent it
using a valid status/output defined by the role-specific schema; do not
replace the structured result with free-form prose.

The host validates this result strictly and will reject invalid output
rather than extract, normalize, or repair it.
```

The wording may be adjusted slightly to match repository style, but the semantic rules above are authoritative.

The fragment should remain short enough that it does not compete with Role-specific reasoning instructions.

---

## 8. Module Boundary

Introduce one minimal shared module, conceptually:

```text
src/evolution/participantStructuredOutputContract.ts
```

Its responsibility is limited to shared prompt-contract delivery.

It should expose a stable shared contract identifier/content and a renderer conceptually equivalent to:

```ts
renderStructuredFinalOutputContractV1({
  roleSchemaName: "SolutionWorkV1",
})
```

The exact TypeScript signature should follow existing repository conventions.

The renderer may receive the Role schema name as data.

It MUST NOT contain Role-specific branching such as:

```ts
if (role === "solution") ...
if (role === "reviewer") ...
if (role === "execution") ...
```

If implementation requires Role-specific branching, the abstraction should be considered invalid and implementation should stop for design review.

---

## 9. Receiver Architecture

V1 does NOT introduce a shared parser.

Existing Role receivers remain authoritative:

```text
raw terminal payload
→ JSON.parse
→ Role-specific schema validation
→ Role-specific reference validation
```

No existing strict parser should be relaxed.

V1 addresses inconsistent sender-side communication-contract delivery, not parser abstraction.

A future shared receiver abstraction may be considered only if real duplication or drift is later observed.

---

## 10. Pilot Roles

V1 pilots the shared contract in exactly three workspace-capable Roles:

1. Solution;
2. Reviewer;
3. Configuration Execution.

These Roles intentionally have different domain schemas.

The pilot validates that one shared communication contract can serve multiple Role semantics without branching.

Logical prompt composition becomes:

```text
Role-specific instructions
        +
Role-specific reasoning / work discipline
        +
Role-specific domain-output semantics
        +
Structured Final Output Contract V1
```

For Solution, the existing convergence discipline remains separate from the final-output contract.

---

## 11. Provider-specific Capabilities

Provider capabilities may strengthen delivery but do not define the contract.

Conceptually:

```text
Shared Contract V1 = communication authority

Provider capability = optional enforcement assistance
```

Examples of future combinations:

```text
DeepSeek
→ Shared Contract V1
→ provider JSON response mode

Cursor
→ Shared Contract V1
→ provider-native event stream / terminal-result transport

Codex
→ Shared Contract V1
→ native structured-output capability if one is later adopted
```

Provider integration must not weaken or redefine the terminal Role payload semantics.

---

## 12. Error Classification

V1 does not change production error taxonomy.

Existing errors such as:

```text
parse
invalid_reference
timeout
```

remain unchanged.

The design recognizes that future taxonomy may distinguish:

```text
INVALID_FINAL_OUTPUT_ENVELOPE
ROLE_SCHEMA_MISMATCH
```

but introducing these would affect persisted artifacts, failure routing, reporting, and historical comparison, so it is explicitly deferred.

Conformance experiments may use richer experimental classifications without changing production schemas.

---

## 13. Static Test Strategy

### 13.1 Shared Contract Unit Tests

Test stable semantic anchors rather than snapshotting the full prose.

At minimum assert the renderer communicates:

- exactly one valid JSON object;
- bare JSON only;
- no Markdown/code fences;
- no text before or after;
- strict rejection;
- no repair;
- the supplied Role schema name.

### 13.2 Role Delivery Tests

Verify:

```text
Solution prompt
→ includes Structured Final Output Contract V1
→ identifies SolutionWorkV1

Reviewer prompt
→ includes Structured Final Output Contract V1
→ identifies SolutionReviewV1

Configuration Execution prompt
→ includes Structured Final Output Contract V1
→ identifies ConfigurationExecutionResultV1
```

Existing Role-specific prompt semantics must continue to pass.

### 13.3 Fail-closed Regression Tests

Existing strict receivers should explicitly reject representative envelope failures:

1. prose before JSON;
2. fenced JSON;
3. prose after JSON;
4. multiple JSON objects.

Tests must not introduce extractor or repair logic.

---

## 14. Engineering Acceptance Criteria

The implementation is accepted only if all are true:

1. one shared contract module exists;
2. Solution, Reviewer, and Configuration Execution use the same shared renderer;
3. only `roleSchemaName`-like data varies between Roles;
4. shared renderer contains no Role-specific branching;
5. existing strict parsers remain unchanged in behavior;
6. no Markdown stripping or JSON extraction is introduced;
7. Orchestrator remains unchanged;
8. runtime timeout and retry semantics remain unchanged;
9. provider adapters remain unchanged;
10. Role domain schemas remain unchanged;
11. shared Skills remain unchanged;
12. relevant targeted tests pass;
13. repository typecheck passes;
14. scoped diff-check passes.

The static implementation verdict is:

```text
STRUCTURED_FINAL_OUTPUT_CONTRACT_V1_DELIVERED
```

This verdict does NOT mean model output variance has been solved.

---

## 15. Rollout Boundary

V1 must not automatically roll out to all Participants.

The pilot stops after:

```text
Solution
Reviewer
Configuration Execution
```

Broader rollout requires:

1. the abstraction to remain Role-agnostic;
2. static verification to pass;
3. Contract Conformance Matrix evidence to show no obvious regression.

Only then may V1.1 consider:

- Feedback;
- Improvement Hypothesis;
- Hypothesis Investigation;
- Modification Work;
- Comparative Feedback.

Role-specific semantic-contract gaps such as Hypothesis `feedbackRefs` requirements are separate work.

---

## 16. Contract Conformance Matrix

After static implementation, do not immediately use a full Auto Evolution real run.

First run a contract-only conformance experiment.

### 16.1 Conformance Task

Use a trivial exact object such as:

```json
{
  "schemaVersion": "participant-contract-conformance-v1",
  "status": "OK",
  "message": "contract-confirmed"
}
```

No repository investigation, Skill, or material reasoning workload is required.

The goal is to isolate terminal contract compliance from reasoning quality.

### 16.2 Layer A — Harness Conformance

Compare at least:

```text
Codex current binding
Cursor Auto
```

Observe:

- completion;
- elapsed time;
- bare JSON;
- exact schema;
- wrapper prose;
- Markdown fence;
- multiple payloads;
- runtime failure.

### 16.3 Layer B — Cursor Model Conformance

Only after verifying local Cursor CLI model-selection capability, compare:

```text
Cursor Auto
Cursor fixed model A
Cursor fixed model B
...
```

Do not pre-assume CLI model flags or model names.

The experiment must prove:

- requested model binding;
- resolved model if observable;
- reasoning setting if independently configurable.

If model binding cannot be reliably fixed or observed:

```text
CURSOR_MODEL_BINDING_NOT_OBSERVABLE
```

Do not claim model A/B evidence.

### 16.4 Repetition

Each binding should run three small conformance trials.

One success is insufficient to establish communication reliability.

### 16.5 Trial Classification

Experimental-only classifications:

```text
PASS
ENVELOPE_FAILURE
ROLE_SCHEMA_FAILURE
RUNTIME_FAILURE
TIMEOUT
```

The validator remains strict:

```text
raw terminal payload
→ JSON.parse
→ exact conformance schema
```

No repair is allowed.

### 16.6 Cursor Provider-native Stream

If Cursor uses `stream-json` for observability, native events are transport data.

The experiment may deterministically extract the official terminal/result field from the provider-native event envelope.

It must then validate that terminal assistant payload against the shared contract.

Allowed:

```text
provider result event
→ defined terminal result field
```

Forbidden:

```text
result prose
→ search for fenced JSON
→ extract JSON
```

Transport extraction is allowed; semantic repair is not.

---

## 17. Conformance Verdicts

The first Contract Conformance Matrix should use evidence-level verdicts:

```text
CONTRACT_CONFORMANCE_PROMISING
CONTRACT_CONFORMANCE_UNSTABLE
CONTRACT_CONFORMANCE_REGRESSION
OBSERVATION_INSUFFICIENT
```

No fixed percentage threshold is required for the first small sample.

Latency may be reported as range/median, but the matrix does not determine which model is best for real Auto Evolution work.

It measures communication-contract reliability.

---

## 18. Real Solution Model Matrix

Only after contract-only conformance is understood should model performance be tested on a real Solution workload.

Use one fixed historical Solution case:

```text
same Problem Package
same sealed evidence
same disposable workspace
same prompt
same Shared Contract V1
same Skill
same timeout policy
same Cursor harness
```

Change only the model binding.

Compare:

- completion;
- elapsed;
- tool count;
- output volume;
- convergence behavior;
- final contract compliance;
- SolutionWorkV1 status;
- evidence quality.

This separates:

```text
contract reliability
```

from:

```text
reasoning / workload performance
```

Cursor Auto is a first-class binding strategy even if the routed model is not observable.

---

## 19. Rollback / Stop Conditions

Stop the rollout and return to design review if:

1. the three Pilot Roles require Role-specific logic inside the shared renderer;
2. the shared wording materially interferes with Role task comprehension;
3. Reviewer or Configuration Execution shows clear prompt regression;
4. normal outputs can only be accepted by introducing repair logic;
5. strict receiver behavior must be weakened to make a Participant pass.

Do not solve a conformance failure by adding:

```text
stripFence
extractJson
repairJson
```

Such changes create adapter-specific compatibility debt and violate this design.

---

## 20. Full Sequence

```text
Step 1
Implement Structured Final Output Contract V1
        ↓
Pilot Solution / Reviewer / Configuration Execution
        ↓
Step 2
Static verification
        ↓
Step 3
Contract Conformance Matrix
Codex current + Cursor Auto + fixed Cursor models
        ↓
Step 4
Separate communication reliability from model performance
        ↓
Step 5
Historical Solution Model Matrix
        ↓
Step 6
Choose Cursor binding / model direction
        ↓
Step 7
When product-authority governance is stable,
resume normal Auto Evolution observation batches
```

---

## 21. Design Rationale

The design deliberately chooses a small shared sender contract rather than:

- patching individual prompts;
- repairing model output;
- redesigning provider adapters;
- implementing a complete Contract Registry.

It is the smallest change that addresses the observed systemic problem:

> multiple Participants and models need an explicit, uniform, machine-consumable terminal-result envelope.

The expected long-term value is lower communication variance and clearer failure attribution across harnesses, without reducing Agent reasoning autonomy.

---

## 22. Self-Review

### Placeholder scan

No TBD/TODO/placeholder requirements remain.

### Internal consistency

- Shared contract governs terminal payload only.
- Role schemas remain authoritative for business semantics.
- Provider-native event streams remain transport concerns.
- Strict receiver behavior remains fail-closed.
- Pilot and broader rollout are explicitly separated.

No contradictions found.

### Scope check

V1 is intentionally limited to one shared prompt-contract module, three Pilot Roles, tests, and post-implementation conformance experiments.

Provider adapter changes, model routing, timeout changes, failure taxonomy, and Role-semantic corrections are excluded.

Scope is suitable for one implementation plan.

### Ambiguity check

Resolved explicitly:

- Markdown-fenced valid JSON is invalid.
- Prose around JSON is invalid.
- Provider-native event envelopes are outside the domain contract.
- Deterministic transport-field extraction is allowed; semantic JSON extraction is not.
- Negative outcomes remain structured Role outputs.
- No Role-specific branching is allowed in the shared renderer.
