# PRD — Auto Evolution Structured Output Contract Conformance

> Status: **HUMAN APPROVED FOR RALPH EXECUTION**
>
> Pair: `auto-evolution-structured-output-conformance.prd.json`
>
> Product stage: RUN / OBSERVE
>
> This PRD executes the independent Contract Conformance Matrix already required by Structured Final Output Contract V1. It is an evidence task, not a new communication-contract design.

## 1. Goal

Close the explicit evidence gap:

> Structured Final Output Contract V1 is engineering-delivered, but cross-harness/model runtime conformance is unverified.

Run trivial contract-only trials that isolate terminal-output compliance from repository reasoning quality.

## 2. Authority

Read before execution:

1. `docs/governance/current-product-stage.md`
2. `docs/product/auto-evolution-model.md`
3. `docs/governance/product-decisions.md`
4. `docs/superpowers/specs/2026-08-23-structured-final-output-contract-v1-design.md`
5. current Structured Final Output Contract implementation and tests
6. current Participant execution / trace contracts

Conflict rule:

```text
current repository authority
> this PRD assumptions
> agent inference
```

If current authority materially differs, stop before trials.

## 3. Frozen experiment contract

Use the trivial exact object specified by the accepted design:

```json
{
  "schemaVersion": "participant-contract-conformance-v1",
  "status": "OK",
  "message": "contract-confirmed"
}
```

Trial classification is restricted to:

```text
PASS
ENVELOPE_FAILURE
ROLE_SCHEMA_FAILURE
RUNTIME_FAILURE
TIMEOUT
```

Validation is strict:

```text
official terminal Participant payload
→ JSON.parse
→ exact conformance schema
```

Forbidden:

- extracting JSON from prose;
- stripping Markdown fences as repair;
- quote repair;
- field renaming;
- filling missing fields;
- semantic normalization;
- accepting multiple adjacent values.

Provider-native deterministic extraction of the official terminal/result field is allowed where the transport requires it. Semantic extraction from Participant prose is not.

## 4. Required bindings and repetitions

Required first matrix:

```text
Codex current binding   × 3 trials
Cursor Auto             × 3 trials
```

Do not add fixed Cursor model bindings unless the current local CLI can both:

1. reliably request the binding; and
2. independently establish what binding was used or at minimum establish the requested binding mechanism.

If binding cannot be observed, record:

```text
CURSOR_MODEL_BINDING_NOT_OBSERVABLE
```

Do not invent model A/B evidence.

Fixed-model experiments are not required to close this PRD.

## 5. Story US-001 — Establish conformance preflight and evidence shape

Purpose:

- confirm the current delivered Contract V1 is still present;
- confirm the trial can be executed without changing role schemas, retry policy, provider abstraction, or Host validation semantics;
- define/create the smallest evidence artifact shape necessary to record the six trials if the repo does not already provide one.

Allowed source change:

- only a minimal experiment/helper or test harness necessary to execute and classify the contract-only trials, if no existing path suffices.

Preferred outcome:

```text
NO_PRODUCT_SOURCE_CHANGE
```

Acceptance:

- current Contract V1 renderer/validator behavior is identified from source;
- conformance payload/schema is exact and trivial;
- trial classification set is fixed to the five accepted values;
- no reasoning/repository-investigation workload is part of the conformance task;
- no Host repair is introduced;
- no retry policy is changed;
- no Role schema is changed;
- no production Participant timeout policy is changed;
- evidence output path/shape is attributable and does not become main workflow authority;
- focused preflight test or dry-run passes if a helper is added;
- Tests pass;
- Typecheck passes.

STOP if a valid matrix cannot be executed without redesigning production communication infrastructure.

## 6. Story US-002 — Run three Codex current-binding trials

Run exactly three fresh trivial contract-only trials against the current Codex binding.

Each trial must record:

- trial id;
- binding label;
- elapsed time when observable;
- terminal payload reference;
- classification;
- parse/schema failure detail if non-PASS;
- runtime/timeout evidence when applicable.

A failed trial is valid evidence.

Do not rerun a failure merely to obtain three PASS results. Replacement is allowed only for a clearly invalid experimental setup, and the invalid attempt must remain documented.

Acceptance:

- exactly three attributable valid Codex trials are included in the matrix;
- every trial has one of the five accepted classifications;
- raw terminal payload is not semantically repaired;
- no repository reasoning workload is added;
- no product source change occurs unless required by US-001 experiment infrastructure;
- Tests pass;
- Typecheck passes.

## 7. Story US-003 — Run three Cursor Auto trials

Run exactly three fresh trivial contract-only trials against Cursor Auto.

Observe provider-native stream as transport evidence if available.

Allowed:

```text
provider-native result event
→ documented official terminal field
→ strict Contract V1 validation
```

Forbidden:

```text
prose / fenced output
→ search / extract a JSON-looking block
→ accept
```

Acceptance:

- exactly three attributable valid Cursor Auto trials are included;
- every trial has one of the five accepted classifications;
- provider-native terminal extraction, if used, is deterministic and transport-level only;
- no unverified resolved model name is claimed;
- no provider fallback/switching is introduced;
- no production retry policy changes;
- Tests pass;
- Typecheck passes.

## 8. Story US-004 — Produce the Contract Conformance Matrix verdict

Synthesize the six required trials.

Use only these first-matrix verdicts:

```text
CONTRACT_CONFORMANCE_PROMISING
CONTRACT_CONFORMANCE_UNSTABLE
CONTRACT_CONFORMANCE_REGRESSION
OBSERVATION_INSUFFICIENT
```

No fixed pass-rate threshold is required. Explain the verdict from evidence.

The matrix may include latency range/median, but it must not rank models for real Solution reasoning quality.

Acceptance:

- matrix includes all six valid trials;
- per-trial classification is traceable to evidence;
- Codex and Cursor Auto observations are separated;
- contract reliability is explicitly separated from reasoning quality;
- verdict uses exactly one accepted evidence-level verdict;
- any fixed-model binding uncertainty is recorded without invented claims;
- repository governance/current-stage is updated only if the evidence changes an existing explicit status;
- full P3 remains DEFERRED unless Human separately changes authority;
- Slice #2 boundaries remain unchanged;
- Tests pass;
- Typecheck passes.

## 9. Non-goals

Do not:

- run a real Solution model-quality matrix;
- redesign Structured Final Output Contract V1;
- add Contract registry/platform;
- broaden Role rollout;
- broaden retransmission;
- recover SCHEMA_FAILURE;
- introduce second retransmission;
- add generic retry;
- alter provider routing;
- change Participant hard-timeout policy;
- add MCP;
- add Report Analysis;
- judge Participant reasoning quality.

## 10. Completion

PRD result is an evidence matrix and verdict.

Valid closure includes unstable or insufficient evidence.

After closure:

```text
STOP
→ delta review
→ Human decides whether PRD B may start
```
