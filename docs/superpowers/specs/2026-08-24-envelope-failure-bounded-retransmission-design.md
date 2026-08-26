# Envelope Failure Bounded Retransmission — Design

**Date:** 2026-08-24  
**Status:** DESIGN READY FOR REVIEW  
**Scope:** Participant Communication Contract — Minimal Slice #2  
**Overall product stage:** RUN / OBSERVE  
**Full P3:** DEFERRED  
**Implementation:** NOT STARTED  
**Commit:** NOT REQUESTED / NOT DONE

## 1. Product Problem

Structured Final Output Contract V1 already gives the Host a strict terminal validation boundary:

```text
Participant terminal payload
→ Host strict validation
```

Today that path is effectively:

```text
valid
→ accept

invalid
→ reject / fail closed
```

Runtime evidence has now established a narrower recoverable failure class. For terminal `ENVELOPE_FAILURE`, the Agent can already hold the correct reasoning and schema-shaped content, while the terminal communication frame violates the Shared Structured Final Output Contract V1. Across two independent historical envelope-failure sessions, a mechanical Host NACK followed by one same-thread `RE-EMIT ONLY` turn produced fully compliant retransmissions in 2/2 reconciled cases.

The product problem is therefore not “help the Agent reason again.” It is:

> When a Participant has completed its reasoning but the terminal transport frame violates the envelope contract, should the Host allow one bounded, mechanical, same-thread retransmission?

This is a Participant Communication Contract concern, not Solution reasoning policy.

## 2. Proposed Product Semantics

Minimal Slice #2 introduces one narrow recovery semantic:

```text
Participant terminal result
        ↓
Host validates envelope

VALID
→ normal schema validation / existing path

ENVELOPE_FAILURE
→ one bounded same-thread retransmission
→ validate retransmitted payload

second failure
→ fail closed
```

The trigger is exactly `ENVELOPE_FAILURE`, not `ANY_VALIDATION_FAILURE`.

## 3. Scope

### 3.1 Terminal payload only

This protocol applies only to Participant terminal Role payloads.

It does not apply to:

- thinking;
- tool events;
- progress events;
- intermediate artifacts;
- checkpoint-like internal reasoning;
- provider transport retries.

### 3.2 Structured Final Output Contract V1 only

The protocol is eligible only for Role executions that already use Structured Final Output Contract V1 and therefore have:

```text
expected role schema
+
Shared Structured Final Output Contract V1
```

Free-text Participants are not automatically eligible.

### 3.3 `ENVELOPE_FAILURE` only

Typical `ENVELOPE_FAILURE` cases include:

- prose before JSON;
- prose after JSON;
- Markdown/code fence wrappers;
- multiple terminal payloads;
- non-JSON terminal text;
- empty payload;
- non-object root when the Shared Contract requires an object;
- trailing non-whitespace content.

Legal JSON whitespace is explicitly allowed. Pretty-printed JSON is valid envelope content.

```text
bare JSON object
≠ compact/canonical JSON serialization
```

Minimal Slice #2 MUST NOT introduce canonical, single-line, or `JSON.stringify`-equivalent serialization requirements.

### 3.4 Exactly one retransmission

```text
maxEnvelopeRetransmissions = 1
```

There is no retry-until-valid loop.

### 3.5 Same-thread only

Retransmission requires continuation of the exact same Participant conversation/thread.

If reliable same-thread continuation is unavailable:

```text
retransmission unavailable
→ fail closed
```

Fresh conversation fallback and transcript replay are forbidden.

## 4. Explicit Non-goals

Minimal Slice #2 does not include:

- `SCHEMA_FAILURE` recovery;
- field-level schema repair;
- minimal JSON skeleton injection;
- Host field completion;
- Host prose stripping;
- Host extraction of embedded JSON;
- canonicalization or normalization;
- semantic critique;
- second retransmission;
- unbounded retries;
- model switching;
- provider fallback;
- tool deny;
- Solution synthesis retry;
- investigation retry;
- generic Role retry;
- generic Participant failure recovery.

This slice improves communication reliability, not reasoning reliability.

## 5. Authority Boundary

### 5.1 Agent owns

The Agent continues to own:

- reasoning;
- candidate/content semantics;
- evidence selection;
- Role-specific meaning;
- negative-outcome choice;
- terminal payload values.

### 5.2 Host owns

The Host owns:

- terminal envelope validation;
- failure classification;
- whether bounded retransmission is permitted;
- retransmission count;
- same-thread transition;
- second validation;
- final accept/fail-closed decision.

The Host does not provide semantic correction.

### 5.3 Framework boundary

```text
Framework controls protocol.
Agent controls content.
```

Envelope retransmission is a communication-frame retransmission mechanism, not a reasoning-correction mechanism.

## 6. Role / Workflow Boundary

Envelope retransmission is a Role-internal Participant execution protocol, not an Orchestrator Step.

```text
Solution Role
│
├─ Participant execution
│  ├─ terminal attempt #0
│  ├─ Host envelope validation
│  └─ optional terminal retransmission #1
│
└─ one final Role outcome
```

The Orchestrator still sees one Solution Role execution.

## 7. Initial Product Eligibility

Product semantics are provider-agnostic, but initial rollout is narrow:

```text
Role policy:
Solution = ENABLED
Reviewer = DISABLED
Configuration Execution = DISABLED
Feedback = DISABLED
Hypothesis = DISABLED
```

A Role is eligible only when both are true:

```text
Role policy allows retransmission
AND
Participant supports reliable same-thread continuation
```

Initial provider implementation is Cursor because same-thread resume has been repeatedly verified there.

No implicit fallback exists for Participants without continuation capability.

## 8. Validation Order

Terminal validation order is fixed:

```text
terminal payload
    ↓
Envelope Validation
    ↓
Role Schema Validation
```

### 8.1 Envelope result

```text
ENVELOPE_VALID
ENVELOPE_FAILURE
```

### 8.2 Schema result

Schema validation occurs only after envelope validation succeeds:

```text
SCHEMA_VALID
SCHEMA_FAILURE
```

Eligibility is determined mechanically:

```text
ENVELOPE_FAILURE
→ may retransmit once

SCHEMA_FAILURE
→ fail closed
```

## 9. Authoritative Envelope Validator

The product MUST have one authoritative envelope validator.

Conceptual interface:

```ts
type StructuredTerminalEnvelopeValidation =
  | {
      ok: true;
      parsedObject: Record<string, unknown>;
    }
  | {
      ok: false;
      failureClass: 'ENVELOPE_FAILURE';
      reason: StructuredTerminalEnvelopeFailureReason;
    };
```

Suggested internal mechanical reasons:

```ts
type StructuredTerminalEnvelopeFailureReason =
  | 'EMPTY'
  | 'INVALID_JSON'
  | 'NON_OBJECT_ROOT'
  | 'EXTRA_CONTENT'
  | 'MARKDOWN_WRAPPER'
  | 'MULTIPLE_PAYLOADS';
```

These reasons are diagnostic. They do not authorize repair.

### 9.1 Validation strategy

The validator should:

```text
raw terminal string
→ trim leading/trailing whitespace
→ parse the entire trimmed string as one JSON value
→ require object root
```

It MUST NOT:

- search for the first `{`;
- search for the last `}`;
- extract a JSON substring;
- strip prose or Markdown;
- canonicalize whitespace;
- repair malformed output.

Legal insignificant JSON whitespace remains valid.

## 10. Schema Failure Boundary

After a valid envelope, existing Role-specific strict schema validation remains authoritative.

For example:

```text
SolutionWorkV1
SolutionReviewV1
configuration-execution-result-v1
```

If schema validation fails:

```text
SCHEMA_FAILURE
→ fail closed
```

Even apparently simple missing/unknown fields do not qualify for retransmission in Minimal Slice #2.

## 11. Retransmission Trigger Contract

Retransmission is permitted only when all conditions hold:

```text
1. Role execution uses Structured Final Output Contract V1
2. failure class = ENVELOPE_FAILURE
3. retransmission count = 0
4. Role policy enables retransmission
5. Participant supports reliable same-thread continuation
6. original thread/session identity is available
7. no structural STOP or fatal runtime failure has already ended execution
```

The decision is purely mechanical.

## 12. Retransmission Request Contract

The Host uses an internal typed request rendered deterministically.

Conceptual internal shape:

```ts
interface EnvelopeRetransmissionRequestV1 {
  schemaVersion: 'envelope-retransmission-request-v1';
  failureClass: 'ENVELOPE_FAILURE';
  expectedRoleSchemaName: string;
  retransmissionAttempt: 1;
}
```

This internal type does not need to become another Participant-facing JSON schema.

### 12.1 Participant-facing semantics

The rendered continuation request communicates only:

```text
The previous terminal payload was rejected by the Host.

Failure class: ENVELOPE_FAILURE.

Re-emit the same Role result only.
Do not perform new reasoning or investigation.
Do not change the semantic content merely because retransmission was requested.

Return the result under the existing Structured Final Output Contract V1
for <ExpectedRoleSchemaName>.

Output exactly one bare JSON object.
No prose, Markdown, code fences, or additional text.
```

The request may repeat:

- expected Role schema name;
- existing Role schema description;
- Shared Structured Final Output Contract V1.

It MUST NOT include:

- prior terminal payload;
- extracted embedded JSON;
- specific semantic correction;
- candidate/content data;
- repair instructions.

### 12.2 Coarse NACK externally, precise reason internally

Internal diagnostics may record precise envelope reason.

Participant-facing feedback remains only:

```text
ENVELOPE_FAILURE
```

Minimal Slice #2 does not send `PROSE_PREFIX`, `MARKDOWN_WRAPPER`, or other transform-specific hints.

## 13. Same-Thread Capability Interface

Cursor `session_id` is an adapter detail, not a product abstraction.

Conceptual capability:

```ts
interface ParticipantSameThreadContinuation {
  canContinueSameThread: boolean;

  continueSameThread(input: {
    threadRef: ParticipantThreadRef;
    prompt: string;
    timeoutMs: number;
  }): Promise<ParticipantExecutionResult>;
}

interface ParticipantThreadRef {
  provider: string;
  opaqueId: string;
}
```

A Participant may advertise same-thread continuation only when it guarantees:

1. initial execution yields a stable opaque thread reference;
2. the Host can continue that exact thread;
3. continuation preserves semantic conversation state;
4. thread identity can be verified/trusted;
5. continuation returns the normal Participant execution result shape.

Best-effort resume is insufficient.

## 14. Participant Execution Result

Conceptually, Participant execution needs to expose:

```ts
interface ParticipantExecutionResult {
  terminalPayload?: string;
  threadRef?: ParticipantThreadRef;

  runtime: {
    status:
      | 'COMPLETED'
      | 'TIMEOUT'
      | 'RUNTIME_FAILURE';
  };
}
```

`threadRef` is runtime provenance/continuation state, not a Role artifact and not Problem Package content.

## 15. Integration Placement

Bounded envelope retransmission belongs in the Participant execution layer:

```text
Role prompt completed
        ↓
Participant executes
        ↓
terminal payload returned
        ↓
Structured terminal validation
        ↓
optional envelope retransmission
        ↓
final Role result
```

It does not belong in:

- Orchestrator;
- Report;
- Role schema parser;
- provider transport retry logic.

The Participant execution wrapper owns bounded retransmission orchestration.

## 16. Component Boundaries

Minimal Slice #2 introduces or formalizes these narrow components:

1. **Authoritative structured terminal envelope validator**  
   Raw terminal string → envelope result only.

2. **Existing Role schema validator**  
   Parsed object → Role-specific schema result.

3. **Envelope retransmission policy**  
   Role + failure class + attempt + capabilities → eligible/not eligible.

4. **Same-thread Participant continuation capability**  
   Opaque thread ref → same-thread continuation.

5. **Deterministic retransmission request renderer**  
   Communication-only NACK prompt.

6. **Structured Participant execution helper**  
   Initial execution → envelope validation → optional one retransmission → second validation → schema validation.

The helper may be Role-neutral, but Minimal Slice #2 initially uses it only for Solution.

## 17. Relationship to `runSolutionAgent()`

Target boundary:

```text
runSolutionAgent
│
├─ build Solution prompt
├─ choose Solution schema validator
├─ invoke structured Participant execution helper
└─ seal accepted SolutionWorkV1
```

`runSolutionAgent()` MUST NOT contain Cursor-specific resume logic or ad hoc NACK prompt construction.

## 18. Cursor Capability Exposure

Cursor adapter exposes the generic capability:

```text
same-thread continuation
```

not “envelope retransmission support.”

Initial execution captures Cursor’s:

```text
system/init.session_id
```

and wraps it as an opaque `ParticipantThreadRef`.

Continuation maps the opaque ref to Cursor’s exact resume mechanism, e.g. `--resume <id>`, as an adapter-local detail.

The resumed session identity MUST match the original thread ref. Mismatch is a continuation failure.

## 19. Tool Permissions

Minimal Slice #2 does not introduce tool enforcement.

Continuation uses the existing Participant runtime tool permissions.

The retransmission prompt may instruct:

```text
do not investigate
do not use tools
```

but the product does not claim hard tool isolation in this slice.

## 20. Timeout Semantics

Initial execution timeout remains unchanged.

Envelope retransmission timeout is frozen at:

```text
60000ms
```

The retransmission timeout is an additional bounded communication-recovery allowance, not a reset of the Role reasoning budget.

```text
existing initial participant timeout
+
optional 60000ms retransmission ceiling
```

Minimal Slice #2 does not create a global deadline allocator or generic retry budget system.

## 21. Retransmission Runtime Outcomes

Same-thread continuation may produce:

```text
COMPLETED
TIMEOUT
CONTINUATION_FAILURE
RUNTIME_FAILURE
```

All recovery runtime failures fail closed. There is no second continuation.

If a retransmission terminal payload exists, it is validated from the beginning:

```text
Envelope Validation
→ Role Schema Validation
```

Possible outcomes:

```text
valid envelope + valid schema
→ accept

invalid envelope
→ fail closed

valid envelope + invalid schema
→ fail closed

runtime failure / timeout / no terminal payload
→ fail closed
```

## 22. Recovery Observation Model

Role final outcome and communication recovery observation remain separate.

Suggested enum:

```ts
type EnvelopeRetransmissionOutcome =
  | 'NOT_ATTEMPTED'
  | 'SUCCEEDED'
  | 'TIMEOUT'
  | 'CONTINUATION_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'ENVELOPE_FAILURE'
  | 'SCHEMA_FAILURE';
```

Example:

```text
attempt #0:
ENVELOPE_FAILURE

retransmission:
SUCCEEDED

final Role:
SUCCESS
```

This preserves both sender quality and final delivery result.

## 23. Failure Mapping

### Initial schema failure

```text
SCHEMA_FAILURE
→ no retransmission
→ existing Role validation failure
```

### Initial envelope failure, capability unavailable

```text
ENVELOPE_FAILURE
→ no retransmission
→ existing structured-output failure
```

### Initial envelope failure, retransmission runtime failure

```text
final Role outcome
= runtime/Participant-oriented failure

initial communication trigger
= ENVELOPE_FAILURE
```

### Initial envelope failure, retransmission envelope/schema failure

```text
final Role outcome
= structured-output validation failure
```

The system MUST preserve:

```text
trigger
+
recovery outcome
+
final Role outcome
```

rather than collapsing root cause.

## 24. Execution Trace Provenance

The existing `execution-trace.json` remains the runtime evidence authority.

Recommended narrow events:

```text
participant_terminal_validation
participant_envelope_retransmission_requested
participant_envelope_retransmission_completed
```

### 24.1 `participant_terminal_validation`

Conceptual fields:

```ts
{
  type: 'participant_terminal_validation',
  role: 'Solution',
  attempt: 0 | 1,

  envelopeValid: boolean,
  envelopeFailureReason?: StructuredTerminalEnvelopeFailureReason,

  schemaValidationAttempted: boolean,
  schemaValid?: boolean,

  accepted: boolean
}
```

### 24.2 `participant_envelope_retransmission_requested`

```ts
{
  type: 'participant_envelope_retransmission_requested',
  role: 'Solution',
  retransmissionAttempt: 1,
  failureClass: 'ENVELOPE_FAILURE',
  sameThread: true,
  timeoutMs: 60000,
  participantCapability: 'SAME_THREAD_CONTINUATION'
}
```

### 24.3 `participant_envelope_retransmission_completed`

```ts
{
  type: 'participant_envelope_retransmission_completed',
  role: 'Solution',
  retransmissionAttempt: 1,
  runtimeOutcome:
    | 'COMPLETED'
    | 'TIMEOUT'
    | 'CONTINUATION_FAILURE'
    | 'RUNTIME_FAILURE',
  elapsedMs: number
}
```

Runtime and validation remain separate events.

Trace MUST NOT contain:

- extracted embedded JSON;
- repair instructions;
- semantic diagnosis;
- full reasoning.

## 25. Raw Terminal Payload Provenance

Terminal attempts are preserved independently:

```text
terminal-attempt-0.txt
terminal-attempt-1.txt
```

Attempt #1 is absent when no retransmission occurs.

The accepted Role artifact, e.g.:

```text
solution-work.json
```

is created only from a strict-valid accepted payload.

Invalid raw attempts are execution evidence, not sealed Role artifacts.

## 26. Report Semantics

Report remains sidecar-only.

Human-readable reporting may show:

```text
Structured terminal delivery:
- First attempt: ENVELOPE_FAILURE
- Bounded retransmission: SUCCEEDED
- Final structured output: VALID
```

or:

```text
Structured terminal delivery:
- First attempt: ENVELOPE_FAILURE
- Bounded retransmission: SCHEMA_FAILURE
- Final outcome: FAILED_CLOSED
```

Report MUST NOT:

- decide eligibility;
- trigger retransmission;
- determine timeout;
- control workflow.

## 27. Metrics

At minimum, runtime observation must preserve:

```text
structuredTerminalAttempts
firstPassEnvelopeFailures
firstPassSchemaFailures

envelopeRetransmissionsEligible
envelopeRetransmissionsAttempted
envelopeRetransmissionsSucceeded

retransmissionEnvelopeFailures
retransmissionSchemaFailures
retransmissionTimeouts
retransmissionContinuationFailures
retransmissionRuntimeFailures
```

And separately:

```text
firstPassStructuredOutputSuccessRate
finalStructuredOutputSuccessRate
```

Recovery success must not hide first-pass sender quality.

## 28. Testing Strategy

### 28.1 Envelope validator regression tests

Valid:

```json
{"a":1}
```

```json
{
  "a": 1
}
```

and the same object with legal leading/trailing whitespace.

Invalid:

```text
Here is the result:
{"a":1}
```

Markdown-fenced JSON, JSON plus trailing prose, and multiple top-level objects.

These tests MUST specifically prevent reintroduction of canonical-compact validation.

### 28.2 Policy tests

Examples:

```text
Solution + ENVELOPE_FAILURE + continuation + attempt0
→ retransmit

Solution + SCHEMA_FAILURE
→ no retransmit

Solution + ENVELOPE_FAILURE + no continuation
→ fail closed

Solution + ENVELOPE_FAILURE + attempt1
→ fail closed

Reviewer + ENVELOPE_FAILURE
→ fail closed
```

### 28.3 Execution state-machine tests

Use fake Participants:

```text
attempt0 valid
→ one call → success

attempt0 envelope fail
attempt1 valid
→ two calls → success

attempt0 envelope fail
attempt1 envelope fail
→ fail, no attempt2

attempt0 envelope fail
attempt1 schema fail
→ fail, no attempt2

attempt0 envelope fail
continuation timeout
→ fail

attempt0 schema fail
→ exactly one Participant call
```

### 28.4 Renderer tests

Verify the retransmission renderer includes:

```text
ENVELOPE_FAILURE
RE-EMIT
expected Role schema
Shared Contract
```

and cannot include prior terminal payload or semantic repair data.

### 28.5 Cursor adapter tests

Verify:

```text
initial execution:
no --resume

continuation:
--resume <opaqueId>
same workspace
same binding/model semantics
```

Also verify:

```text
system/init.session_id
→ ParticipantThreadRef
```

and session mismatch → continuation failure.

## 29. Runtime Conformance After Engineering

Engineering delivery does not equal runtime confirmation.

After implementation, runtime observation must verify:

1. real first-pass envelope failures trigger retransmission;
2. same-thread continuity remains reliable;
3. max retransmission is strictly one;
4. second failure fails closed;
5. no Host repair/extraction occurs;
6. recovered payload passes strict validation;
7. both terminal attempts remain in Trace/artifacts;
8. Report remains sidecar-only;
9. first-pass and final-success metrics remain distinguishable.

The design does not hard-code a sample count; the implementation plan will define the observation batch.

## 30. Migration Strategy

### Phase A — Foundation

Deliver:

- authoritative envelope validator;
- same-thread capability abstraction;
- retransmission renderer;
- bounded state-machine helper;
- tests;
- Trace support.

Role policy remains disabled during engineering verification.

### Phase B — Solution Enablement

Enable only:

```text
Solution
+
Participant advertising reliable same-thread continuation
```

Initial provider implementation: Cursor.

Then run runtime observation.

### Phase C — Future Consideration

Only after evidence supports expansion may the project separately consider:

- Reviewer;
- Configuration Execution;
- other Roles;
- other Participants/providers.

Phase C is outside this design.

## 31. Feature Gating

Minimal Slice #2 introduces no user/deployment config flag.

V1 eligibility is:

```text
Solution role policy enabled
AND
participant.sameThreadContinuation == true
```

Unsupported Participants fail closed.

A rollout kill-switch, if later needed, requires separate design.

## 32. Governance

Overall product stage remains:

```text
RUN / OBSERVE
```

Full Participant Communication Contract P3 remains:

```text
DEFERRED
```

Minimal slices are tracked separately:

```text
Minimal Slice #1:
Structured Final Output Contract V1
ENGINEERING DELIVERED

Minimal Slice #2:
Envelope Failure Bounded Retransmission
DESIGN ACCEPTED / ENGINEERING PENDING
```

After implementation, Minimal Slice #2 may become:

```text
ENGINEERING DELIVERED
RUNTIME CONFORMANCE UNVERIFIED
```

but full P3 still remains deferred unless explicitly reconsidered.

## 33. Rollback Boundary

If runtime observation finds any of these:

- same-thread continuation unreliable;
- retransmission frequently re-enters reasoning;
- a second retransmission occurs;
- initial payload provenance is overwritten;
- schema failures are retried;
- Host starts extracting/repairing output;

then Solution eligibility should be disabled and the system returns to existing fail-closed behavior.

Shared Contract and Role schemas do not need rollback.

## 34. Explicit STOP Boundaries

Implementation MUST STOP and return to design if it requires any of:

```text
SCHEMA_FAILURE recovery
second retransmission
fresh-session fallback
provider switching
semantic feedback
Host JSON extraction
tool enforcement
generic retry subsystem
Orchestrator Step
Role decomposition
global deadline manager
all-Role migration
```

These are not incidental extensions of Minimal Slice #2.

## 35. Implementation Scope

The later implementation plan may cover only:

- authoritative envelope validator;
- Participant continuation capability;
- Cursor continuation implementation;
- bounded structured Participant execution helper;
- deterministic retransmission renderer;
- Solution-only policy rollout;
- Trace/report observation;
- unit/integration tests;
- runtime conformance batch.

It MUST NOT include:

- schema retry;
- Reviewer rollout;
- Configuration Execution rollout;
- SDK migration;
- tool deny;
- model-routing changes.

## 36. Acceptance Summary

Minimal Slice #2 is defined by:

```text
Layer:
Participant Communication Contract

Trigger:
terminal ENVELOPE_FAILURE only

Action:
one same-thread retransmission

Max:
1

SCHEMA_FAILURE:
fail closed

Host repair:
forbidden

Semantic feedback:
forbidden

Initial Role:
Solution only

Capability owner:
Participant / adapter

Initial provider implementation:
Cursor

Timeout:
60000ms

Trace:
preserve both attempts

Report:
sidecar only

Metrics:
preserve first-pass and final-success rates separately

Full P3:
still deferred
```
