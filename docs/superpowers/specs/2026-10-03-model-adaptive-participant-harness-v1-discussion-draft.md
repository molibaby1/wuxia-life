# Model-Adaptive Participant Harness v1 — Discussion Handoff Draft

> Date: 2026-10-03
>
> Status: **DRAFT / HUMAN DISCUSSION BASIS / NOT PRODUCT AUTHORITY**
>
> Purpose: preserve the conclusions and implementation direction from the long discussion so a new conversation can continue without reconstructing the reasoning from chat history.
>
> This document does **not** create PD-122, does **not** authorize runtime changes, and does **not** supersede PD-099 / PD-119 / Reference Participant Binding / Artifact-Backed Structured Final Result. Formal authority still requires a later Human-accepted design.

## 1. Current context

Primary objective remains:

```text
Contract-driven autonomous content authoring
→ Layer A — Historical Controlled Downstream Mechanism Proof
```

Latest relevant state:

- `attempt-000013` ended terminal `FAILED / REVIEWER / invalid_output`.
- Its Reviewer communication mismatch was corrected, deterministically verified, committed and pushed in `ecec205751efc74cc26a5255878ea8b460b48c03`.
- A fresh `attempt-000014` authorization candidate was generated and Human-approved by exact canonical SHA.
- Before execution, the Human intentionally updated Codex from `0.159.0` to `0.160.0`; ambient Codex config identity also changed.
- The governed runner correctly stopped before attempt creation with `REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE / PARTICIPANT_BINDING_UNAVAILABLE: executable version drift`.
- Therefore `attempt-000014` was **NOT_ADMITTED**. No governed attempt directory, Solution, Reviewer, Shadow, V1–V5 or promotion was created.
- The old #14 authorization is stale for the new binding and must not be reused. Because the attempt was never created, the number `attempt-000014` can still be reused after fresh authorization.
- Under the new binding, terminal communication Matrix A passed 3/3. Matrix B failed by timeout on the first large terminal payload; Matrix C and later artifact/probe steps were not run.
- Matrix B is diagnostic evidence about a large terminal Solution-like payload. It is not evidence that the actual artifact-backed Solution path or actual Reviewer/Shadow workload failed.

The discussion then reconsidered whether synthetic communication certification should remain a mandatory gate before real Layer A work.

## 2. Working principle

The Harness should adapt work to the model rather than treating the model as a deterministic RPC endpoint.

```text
shape work for the model
+ recover mechanically recoverable output errors
+ stop only on real abnormality
+ learn primarily from real execution
```

Four directions were identified.

## 3. Direction 1 — Bounded structural correction

When a Participant has completed substantive reasoning but the Host rejects the output for a machine-detectable structural/conformance defect, prefer a bounded correction before discarding the whole expensive attempt.

Potentially recoverable examples:

- malformed JSON / invalid envelope;
- missing required field;
- unknown field;
- wrong exact schema shape;
- Role-schema mismatch where the Host can provide an exact validator error.

Critical boundary: **structural correction != semantic retry-until-success**.

Reviewer rejection, Contract non-applicability, or weak content must not be repeatedly retried until an acceptable semantic answer appears. Preserve first raw output, exact validator error, correction prompt, corrected output and second validation result.

## 4. Direction 2 — Timeout is a watchdog, not a deadline

Timeout is abnormal-safety protection, not an ordinary execution SLA.
Preferred semantics:

```text
observable meaningful progress → keep working
abnormally stalled            → stop
absolute safety boundary      → final runaway protection
```

PD-099 v2 already moves Solution partly in this direction. Future design should preserve the principle rather than optimize for a fixed completion duration.

Thresholds should not be based on average duration. A better reference is:

```text
longest known healthy completion
+ meaningful safety margin
```

The Host cannot see private model reasoning. It can only observe external signals such as provider/event activity, stdout, tool/process events, expected artifact progress and process liveness. Different Role/transport modes expose different signals. If progress observability is weak, use a conservative abnormal-safety fallback rather than pretending stall detection is precise.

## 5. Direction 3 — Shape and reduce model workload

Do not require a separate experiment before applying low-downside workload reduction.

The rule is not “split into as many Agent calls as possible”. It is:

> Each model invocation should have one clear cognitive responsibility, while deterministic/mechanical work should stay with the Host.

Prefer first to split cognitive work from mechanical work.

Useful shaping techniques:

- smaller/better-scoped context;
- remove repeated information;
- move deterministic metadata/mechanical checks to Host;
- large work products via workspace artifact + small terminal receipt;
- split genuinely independent cognitive tasks only when that reduces coupling.

Current artifact-backed Solution delivery is already an example.
## 6. Direction 4 — Validate primarily on the real path

Do not make detached model-capability experiments the default prerequisite for real work.

Preferred development loop:

```text
design invocation around the real business task
→ run the real path
→ observe actual failure/success
→ make targeted adjustment
→ continue
```

Synthetic matrices remain useful diagnostic tools when a concrete communication problem needs isolation, but should not automatically become certification gates unrelated to the actual production workload.

Binding drift still matters: old exact authorization must fail closed when the actual Participant identity changes, followed by fresh binding seal and fresh Human authorization.

Current Layer A already has role-specific transports:

```text
Solution         → WORKSPACE_ARTIFACT_RECEIPT_V1
Reviewer/Shadow  → TERMINAL_JSON
```

Validation, when needed, should correspond to the actual Role/workload/transport. Old Matrix B remains diagnostic for large terminal Solution-like payloads, not a universal Layer A gate.

For continuity: Matrix A = small JSON baseline terminal communication; Matrix B = large nested terminal JSON stress; Matrix C = same-thread continuation/retransmission. These are communication tests, not AE business stages.

## 7. Proposed implementation sequence

1. Formalize `Model-Adaptive Participant Harness v1` and, if Human accepts it, record a new formal decision (provisionally PD-122).
2. Reconcile `docs/governance/current-product-stage.md` with actual #14 NOT_ADMITTED / stale authorization / Matrix A PASS / Matrix B diagnostic timeout state.
3. Implement the minimum bounded structural-correction mechanism; no semantic retry.
4. Reconcile timeout/watchdog behavior around observable progress and abnormal safety, using existing natural execution history rather than a new parameter-search experiment.
5. Make a bounded Layer A workload-shaping pass; remove mechanical/redundant model work without redesigning the whole Agent architecture.
6. Run focused deterministic engineering tests for changed Harness behavior. Do **not** automatically schedule another A/B/C + artifact matrix + probe certification campaign.
7. Return to the real path:

```text
fresh binding capture
→ fresh attempt-000014 authorization candidate
→ Human exact canonical-SHA approval
→ run exactly one real Layer A attempt-000014
```

Use that real attempt as primary evidence and adjust only in response to actual observed problems.

## 8. Still open

This draft intentionally does not decide:

- exact structural-correction count;
- exact recoverable-error set;
- same-thread requirement per Role;
- exact progress-signal taxonomy;
- exact timeout/inactivity/absolute-cap values;
- exact amount of Layer A task splitting;
- exact formal supersession wording for binding-drift revalidation;
- whether a downstream-specific communication diagnostic harness remains useful.

These should be settled only as needed for the minimum useful Harness change.

## 9. Next-conversation starting point

Start the new conversation from:

> Given these four working directions, what is the minimum formal design and implementation slice required before returning to a real attempt-000014, without creating another synthetic-validation detour?

Do not resume from “rerun Matrix B”.

Do not generate a new #14 authorization candidate until the formal design/implementation boundary is settled.

Layer A remains the mainline objective. Harness reconciliation is a blocking detour whose return point is a fresh real attempt-000014.
