# Reference Participant Binding Stability and Codex Native Envelope Assistance — Design

**Date:** 2026-09-30
**Status:** DRAFT FOR HUMAN REVIEW
**Project:** wuxia-life / Auto Evolution
**Scope:** Participant communication reliability for controlled reference validation
**Real Layer A:** FROZEN until this design's communication gates are satisfied

## 1. Purpose

Define the smallest communication-layer change needed before another governed Preschool Layer A campaign.

This design addresses two boundaries only:

1. **Reference Participant Binding Stability** — controlled reference evidence must not silently mix different Codex CLI versions, model configuration, reasoning settings, or ambient Codex configuration.
2. **Codex Native Envelope Assistance** — when the Codex CLI supports provider-native final-output schema enforcement, use it only to strengthen JSON-object delivery while preserving Host-owned semantic validation.

The objective is not to make the Agent reason less. It is to make a controlled proof actually controlled and to reduce avoidable terminal serialization failures.

The architectural invariant remains:

> **Framework controls protocol. Agent controls content.**

The Host remains the final authority for Role schema, identity, reference, Contract, provenance, and repository-integrity validation.

## 2. Evidence that motivates the design

Preserved reference-trial evidence for run `preschool-pver-20260922231805-71297571` shows a material binding boundary between the earlier and later attempts.

- `attempt-000007`: `codex-cli 0.158.0-alpha.2.1`; valid JSON; 23,216-byte terminal payload; Solution schema valid; about 1,206 seconds.
- `attempt-000008`: `codex-cli 0.158.0-alpha.2.1`; valid JSON; 23,615-byte terminal payload; Role-schema value failure only; about 1,204 seconds.
- `attempt-000009`: `codex-cli 0.159.0`; malformed JSON; one same-thread `ENVELOPE_FAILURE` retransmission timed out at 60 seconds.
- `attempt-000010`: `codex-cli 0.159.0`; malformed JSON; one same-thread `ENVELOPE_FAILURE` retransmission timed out at 60 seconds.
- `attempt-000011`: `codex-cli 0.159.0`; no completed terminal turn; initial execution reached 1,800-second hard timeout; last observable output activity was about 1,722 seconds; raw transport included model-list timeout and stream-disconnect evidence.

The current binding artifact records `modelConfigured=null` and `reasoningEffort=null`, even though Codex may receive those settings from ambient user configuration.

The evidence therefore does **not** establish that Structured Final Output Contract V1 itself regressed. It establishes that the controlled campaign crossed an unsealed Participant-binding boundary while terminal reliability also degraded.

Current `dev` also contains a Solution-only prompt instruction added in `7d0ee9b9b4eed953d5b9c862f6342f33fb549f05`: `Return it as one compact JSON line.` That is an implementation deviation from the already accepted communication authority. Structured Final Output Contract V1 requires one bare JSON object but permits legal whitespace, and Envelope Failure Bounded Retransmission explicitly says the slice MUST NOT introduce canonical or single-line serialization requirements. This design does not treat that stricter prompt wording as authority.

This design therefore removes two uncontrolled variables before another governed proof: floating Participant binding and sender wording that exceeds the accepted terminal-output contract.

## 3. Goals

This design MUST:

1. make controlled reference Participant binding explicit and reproducible;
2. prevent a governed attempt from silently changing executable version, model setting, reasoning setting, or ambient Codex config after authorization;
3. use Codex native structured-output capability only as a transport/envelope aid;
4. keep Host Role-schema validation authoritative and unchanged in meaning;
5. preserve strict fail-closed behavior;
6. preserve no-extraction, no-normalization, and no semantic-repair rules;
7. gather evidence before changing the existing 60-second retransmission ceiling or 1,800-second initial hard timeout;
8. validate communication behavior outside governed Layer A before consuming another real attempt;
9. keep the design narrow enough to remove cleanly if the native capability is unreliable;
10. restore Solution sender wording to the accepted JSON-object contract without a compact/single-line requirement.

## 4. Non-goals

This design does NOT:

- change `SolutionWorkV1`;
- change Autonomous Authoring Contract v1;
- change Preschool Shared-Neutral Authoring Contract v1;
- change Reviewer or Shadow semantic authority;
- add Host-side JSON repair, substring extraction, Markdown stripping, field completion, or semantic normalization;
- introduce generic retry-until-success behavior;
- increase the number of retransmissions;
- change the 60-second retransmission timeout yet;
- change the 1,800-second initial hard timeout yet;
- redesign Solution reasoning or convergence;
- split `SolutionWorkV1` into artifact references;
- change promotion authority;
- run `attempt-000012` as part of this design;
- claim Natural Effectiveness, Layer B, or generalized autonomous-authoring effectiveness.

## 5. Reference Participant Binding Stability

### 5.1 Controlled reference bindings are not floating bindings

`CODEX_CURRENT` may remain useful for ordinary operator work, but a governed reference proof MUST resolve a complete binding snapshot before authorization.

For controlled reference validation, the Host MUST know at minimum:

- binding id and provider identity;
- executable real path and executable version;
- explicitly configured model;
- explicitly configured reasoning effort;
- ambient Codex configuration SHA-256 when ambient configuration is loaded;
- native output-schema assistance status and schema SHA-256 when enabled.

A controlled reference binding MUST NOT record `modelConfigured=null` or `reasoningEffort=null` when those settings can materially affect the run.

### 5.2 Explicit model and reasoning configuration

Reference execution MUST pass the intended model and reasoning effort explicitly to Codex rather than relying on whichever values happen to be in `~/.codex/config.toml`.

The initial implementation may continue loading the user's Codex configuration for provider/auth compatibility, but the complete config file MUST be fingerprinted when present.

This design does not require persisting the config contents. Only the SHA-256 and non-secret binding facts belong in provenance.

### 5.3 Binding lock

Before generating a governed execution authorization candidate, the Host creates an immutable binding lock conceptually equivalent to:

```json
{
  "schemaVersion": "reference-participant-binding-lock-v1",
  "bindingId": "CODEX_CURRENT",
  "provider": "codex-local-subagent",
  "executableRealPath": "...",
  "executableVersion": "...",
  "modelConfigured": "...",
  "reasoningEffort": "...",
  "ambientCodexConfigSha256": "...",
  "nativeEnvelopeAssistance": {
    "enabled": true,
    "schemaSha256": "..."
  }
}
```

The exact field names may follow existing repository conventions, but the semantics above are required.

### 5.4 Authorization commitment

A governed Layer A authorization candidate MUST commit to the binding-lock digest.

Immediately before execution, admission MUST resolve the binding again and reject the run if it differs from the authorized binding lock.

This prevents:

`Human authorizes candidate A → local Codex/config changes → mechanically different Participant executes under the old authorization`.

A binding change requires a fresh candidate and fresh Human authorization.

### 5.5 CLI-version change rule

If the Codex executable version changes after communication validation, governed reference execution is frozen again until the communication-only validation matrix is rerun for that new version.

This rule applies even if application code did not change.

## 6. Codex Native Envelope Assistance

### 6.1 Boundary

The current Codex CLI supports a native final-output schema option, `codex exec --output-schema <FILE>`, and the same capability is exposed on `codex exec resume`.

For controlled Solution reference execution, the Host may use this provider-native capability as an **envelope assistance layer**.

It is not a replacement for Host validation.

### 6.2 Envelope-only schema

The provider-native schema MUST constrain only the shared transport requirement:

> the final result is one JSON object.

It MUST NOT require canonical JSON, `JSON.stringify`-equivalent serialization, or a single physical line. Legal JSON whitespace remains valid.

Conceptually it is equivalent to:

```json
{
  "type": "object"
}
```

It MUST NOT duplicate `SolutionWorkV1`, Autonomous Authoring proposal fields, Preschool Card fields, Contract values, provenance rules, reference rules, or identity rules.

The exact JSON Schema dialect accepted by the installed Codex CLI must be proven by the communication-only experiment before production use.

### 6.3 Validation sequence

With native assistance enabled:

```text
Agent reasoning and tool use
        ↓
Codex native final-output envelope assistance
        ↓
unchanged terminal assistant payload text
        ↓
Host Structured Final Output Contract validation
        ↓
Host SolutionWorkV1 validation
        ↓
Host identity / reference / Contract validation
        ↓
ACCEPT or FAIL CLOSED
```

The Host MUST continue to validate the entire terminal payload. Provider-native success is never sufficient for Host acceptance.

### 6.4 No semantic authority transfer

Provider-native schema assistance may prevent malformed JSON framing.

It MUST NOT decide which option is correct, fill missing domain fields, choose Contract values, rewrite Card semantics, repair an invalid Host Role schema, bypass accepted-result validation, or convert a failed Host result into success.

### 6.5 Initial and resumed turns

When enabled for a controlled Solution binding, the same envelope-only output schema MUST be supplied to both initial `codex exec` and same-thread `codex exec resume`.

This keeps first-pass and retransmission transport guarantees aligned.

## 7. Timeout policy remains unchanged until measured

The existing policies remain frozen during this design:

- initial Participant hard timeout: `1_800_000ms`;
- bounded retransmission ceiling: `60_000ms`;
- maximum retransmissions: one.

The two 60-second timeouts observed in attempts 000009 and 000010 are evidence that the current binding did not complete re-emission inside that ceiling. They are not, by themselves, evidence for a replacement timeout value.

A timeout change requires measured same-thread continuation latency under the fixed binding.

## 8. Communication-only validation matrix

No governed Layer A attempt is created during this matrix.

No Reviewer, Shadow Authoring, promotion package, or authoritative content mutation is permitted.

All trials use the same sealed binding.

### 8.1 Matrix A — trivial terminal object

Run three independent Solution-like Codex executions with no repository investigation, no Skills, a trivial exact object, native envelope assistance enabled, and Host strict parsing enabled.

Required result:

- 3/3 process completion;
- 3/3 terminal JSON object;
- 3/3 Host envelope-valid.

This proves basic provider capability wiring only.

### 8.2 Matrix B — synthetic large nested object

Run three independent executions that return a deterministic nested object with size and nesting comparable to the historical Solution terminal payload. The task MUST NOT require repository reasoning.

Required result:

- 3/3 completion;
- 3/3 Host envelope-valid;
- no truncation;
- no wrapper prose;
- no semantic repair.

This separates serialization reliability from reasoning workload.

### 8.3 Matrix C — same-thread re-emission latency

Create a completed thread containing a large structured result, then request same-thread re-emission under the same envelope-only schema. Repeat three times.

Record:

- resume startup latency;
- time to first output activity;
- time to completed terminal result;
- final envelope validity.

The 60-second ceiling remains unchanged during measurement.

Verdict:

- if all three complete within 60 seconds, the existing ceiling remains supported;
- if one or more exceed 60 seconds but later complete under an observation-only extended ceiling, return to Human design review with measured latency before changing production policy;
- if continuation is unreliable independently of the ceiling, do not solve it by merely increasing the timeout.

### 8.4 Matrix D — historical Solution-only communication probe

Only after A–C justify the transport path, run the historical Preschool Solution workload outside governed attempt history.

The probe MUST use the same fixed reference inputs, disposable workspace construction, Solution prompt and delivered Skills, sealed binding, native envelope assistance, and Host envelope/Role-schema validation.

It MUST NOT create an `attempt-000012` directory, consume or rewrite governed reference-trial history, invoke Reviewer or Shadow Authoring, generate a promotion package, or mutate authoritative content.

Run two independent probes.

To reopen a governed Layer A campaign, both probes MUST:

- complete before the existing 1,800-second hard timeout;
- produce a Host envelope-valid JSON object;
- reach Host Role-schema validation.

They do not need identical semantic content.

A Host Role-schema failure may still be useful evidence if transport succeeded; it does not count as an envelope failure.

## 9. Evidence and observability

Communication validation must preserve enough evidence to distinguish process/runtime failure, transport timeout, provider-native schema failure, Host envelope failure, Host Role-schema failure, and accepted-result failure.

Evidence MUST include:

- resolved binding lock and SHA;
- Codex executable version;
- explicit model/reasoning settings;
- ambient config SHA when applicable;
- output-schema SHA;
- elapsed time and last observable activity;
- Host terminal validation outcome.

Transport provenance and semantic validation remain separate.

## 10. Reopening governed Layer A

A new historical Layer A campaign may be proposed only after:

1. this written design is Human-approved;
2. implementation passes deterministic tests;
3. Matrix A succeeds;
4. Matrix B succeeds;
5. Matrix C produces a supported retransmission-policy conclusion;
6. both Matrix D historical Solution-only probes reach Host Role-schema validation;
7. current authoritative repository fingerprint is unchanged by the probes.

The first new governed attempt after reopening is sequential after the preserved history.

This design does not itself authorize that attempt. A fresh governed authorization remains required.

## 11. Failure interpretation

### Case A — native envelope assistance still produces malformed Host terminal JSON

Verdict: `NATIVE_ENVELOPE_ASSISTANCE_UNRELIABLE`.

Do not reopen Layer A.

### Case B — synthetic matrix passes, historical probe times out before terminal completion

The dominant problem is no longer JSON serialization.

Return to design review for Solution workload/convergence/runtime behavior. Do not increase the hard timeout automatically.

### Case C — initial historical probe reaches Host Role-schema validation but retransmission exceeds 60 seconds

Transport is improved, but recovery policy is not yet supported.

Return with measured continuation latency and decide the retransmission ceiling separately.

### Case D — historical probes consistently reach Host Role-schema validation

Communication reliability is sufficient to reopen a bounded governed Layer A campaign.

This still does not prove downstream autonomous-authoring success.

## 12. Files and component boundaries

Implementation is expected to remain within existing Participant communication and reference-trial boundaries.

Likely affected areas include Codex binding resolution, Participant binding provenance, Codex Solution command construction, controlled reference authorization/admission, communication-conformance tests/probes, and narrow governance/status documentation.

The design MUST NOT require changes to `SolutionWorkV1`, Autonomous Authoring domain schemas, Reviewer semantic contract, Shadow Authoring content authority, or production catalog semantics.

If implementation requires one of those changes, stop and return to design review.

## 13. Engineering acceptance criteria

The implementation is accepted only if:

1. controlled reference binding has non-null explicit model and reasoning settings;
2. the binding lock is immutable and digestible;
3. governed authorization commits to the binding-lock digest;
4. admission rejects post-authorization binding drift;
5. Codex native output-schema assistance is envelope-only;
6. initial and resume paths use the same envelope assistance when enabled;
7. Host strict envelope and Role-schema validation remain authoritative;
8. no extraction, normalization, or semantic repair is introduced;
9. existing 60-second and 1,800-second production timeouts are unchanged unless separately Human-approved after measurement;
10. deterministic tests cover binding drift rejection and native-envelope wiring;
11. communication-only matrices are clearly separated from governed Layer A history;
12. no communication probe can create promotion artifacts or authoritative content writes;
13. the current Solution-only compact/single-line instruction is removed so sender wording matches the accepted communication contract;
14. tests preserve acceptance of legal pretty-printed JSON objects;
15. repository typecheck and relevant existing suites pass.

## 14. Relationship to existing designs

This design extends, but does not replace:

- **Structured Final Output Contract V1** — the Host still requires exactly one machine-consumable JSON object and still rejects rather than repairs;
- **Envelope Failure Bounded Retransmission** — at most one same-thread retransmission remains the current recovery policy;
- the existing Solution Role schema and Autonomous Authoring Contract — semantic authority is unchanged.

Provider-native output schemas are treated exactly as originally intended by Structured Final Output Contract V1:

> provider capabilities may strengthen delivery but do not define the contract.

## 15. Stop conditions

Return to Human design review if any of the following is required:

- duplicating the complete Role/domain schema into provider-native JSON Schema;
- Host-side semantic repair;
- more than one retransmission;
- changing the 60-second retransmission ceiling without measured continuation evidence;
- changing the 1,800-second initial hard timeout without historical-probe evidence;
- changing Solution reasoning authority;
- changing Reviewer or Shadow authority;
- changing Contract or Schema semantics;
- continuing governed Layer A before communication validation is complete.

## 16. Design conclusion

The next step is not another Layer A attempt.

The next step is to turn a floating reference Participant into a sealed controlled binding and to use Codex's native structured-output capability only as an envelope-level transport guard.

The intended boundary is:

```text
Fixed Participant binding
        +
Agent-owned reasoning
        +
Provider-native JSON-object assistance
        ↓
Host strict envelope validation
        ↓
Host strict semantic validation
        ↓
governed downstream workflow
```

This removes an uncontrolled experimental variable and tests the communication layer before consuming more governed reference attempts.
