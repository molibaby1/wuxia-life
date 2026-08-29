# PRD — Auto Evolution Real Run / Observe Batch

> Status: **CLOSED — NO_CROSS_ROUND_TRANSITION_OBSERVED; sidecar NO_REPORT_CHANGE; STOP for Human delta review**
>
> Pair: `auto-evolution-real-run-observe-batch.prd.json`
>
> Product stage: RUN / OBSERVE
>
> This PRD performs a small batch of fresh normal real runs. It must observe the workflow that exists; it must not manufacture a desired cross-round outcome.
>
> Entry gate (2026-08-29): PRD A matrix accepted (`CONTRACT_CONFORMANCE_PROMISING` + Human `PROMISING_WITH_CAVEATS`); hard-timeout policy v1 integrated (`DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS = 1800000`, PD-099); `240000ms` retained only as Slice #2 historical baseline, not current hard-timeout authority.
>
> Batch result: three fresh runs; 0/3 `READY_FOR_CONFIG_EXECUTION`; Q1=`NO_CROSS_ROUND_TRANSITION_OBSERVED`; Q2=`NO_REPORT_CHANGE`.

## 1. Goal

Collect fresh operational evidence for:

1. P1 Sidecar Run Report sufficiency;
2. normal Participant workflow behavior;
3. whether a real authorized run naturally reaches `READY_FOR_CONFIG_EXECUTION`;
4. if so, whether the already-engineered P2 mechanism produces a genuine cross-round transition.

This PRD does not require a cross-round transition to occur.

## 2. Entry gate

Do not start until:

- PRD A is complete and its first matrix is accepted as `CONTRACT_CONFORMANCE_PROMISING` with Human qualifier `PROMISING_WITH_CAVEATS`;
- Gate B delta review has passed and no conformance finding blocks ordinary RUN / OBSERVE;
- the repository is on the latest clean authoritative tip;
- the latest tip contains the accepted participant/model hard-timeout policy v1: default hard boundary `1800000ms`, used as abnormal-safety protection rather than a normal execution budget;
- `current-product-stage.md` and other active authority no longer present `240000ms` as the current Participant hard-timeout authority, unless newer Human-approved authority explicitly supersedes the accepted `1800000ms` policy;
- retransmission, retry, and other workflow budgets remain independent of that hard boundary;
- current product stage still authorizes real RUN / OBSERVE;
- Human has separately approved this PRD for execution. **Satisfied on 2026-08-29.**

If these do not hold, stop before US-001.

## 3. Real-run doctrine

Use three fresh, normal, problem-agnostic runs.

Do not:

- choose a problem because it is guaranteed to be configuration-only;
- prompt the Solution toward `READY_FOR_CONFIG_EXECUTION`;
- repeat a run because its outcome was `DEFER`, `NO_PROPOSAL`, rejection, failure, or escalation;
- weaken Reviewer independence;
- bypass permission or STOP boundaries;
- force a Round 2.

If a run naturally returns a route other than `READY_FOR_CONFIG_EXECUTION`, that run is valid evidence.

If a run naturally reaches `READY_FOR_CONFIG_EXECUTION`, allow only the already-authorized P2 execution path to continue.

### Evidence identity rule

For every real run, record the requested execution route/binding. Record a resolved concrete model identity only when provider/transport evidence directly exposes it. `Cursor Auto`, host configuration defaults, latency, output style, or prior runs are not sufficient to infer a concrete model identity.

Wall-clock latency is operational evidence only. Do not use this PRD to rank Codex versus Cursor or to infer model quality.

## 4. Story US-001 — Preflight the real-run evidence boundary

Before running Participant work:

- identify the exact current real workflow entry point;
- identify current Sidecar Run Report generation path;
- identify P2 natural transition handoff;
- confirm the run is not deterministic P2 test scaffolding;
- establish run ids and evidence destinations;
- confirm no protected product/runtime source change is pre-planned;
- confirm the active Participant hard-timeout authority is `1800000ms` abnormal-safety hard boundary (or a newer explicit Human-approved successor), not the stale `240000ms` authority;
- define evidence fields for requested execution route/binding and only record resolved concrete model identity when transport directly exposes it.

Acceptance:

- three fresh run slots are defined without pre-selecting desired outcomes;
- Sidecar report generation is available and remains sidecar-only;
- P2 handoff occurs only on actual `READY_FOR_CONFIG_EXECUTION`;
- deterministic engineering tests are not counted as real evidence;
- no source modification is required merely to start observation;
- current hard-timeout/retry/retransmission/Contract policies are preserved;
- active authority does not contradict the accepted `1800000ms` hard-timeout policy;
- route/binding provenance is recorded without inferring concrete model identity from Auto routing, host defaults, latency, or style;
- Tests pass;
- Typecheck passes.

## 5. Story US-002 — Execute fresh real run 1

Execute one normal authorized real run.

Record:

- run id;
- problem/package reference;
- Participant/Role sequence;
- requested execution route/binding;
- resolved concrete model identity only if transport directly exposes it;
- first-pass structured-output result;
- retransmission evidence if Slice #2 legitimately triggers;
- Reviewer decision;
- terminal workflow route;
- Sidecar Run Report;
- P2 transition evidence if naturally applicable.

If `READY_FOR_CONFIG_EXECUTION` does not occur, close the Story with the actual outcome.

If it does occur, permit existing P2 bounded configuration execution / verification / real rerun / sealed source B / Round 2 path to proceed under existing authority.

Acceptance:

- exactly one fresh real run is attributable;
- no desired route is manufactured;
- run outcome is preserved verbatim as workflow evidence;
- Sidecar report is generated or its failure is recorded without changing main workflow outcome;
- any P2 transition is natural and evidence-backed;
- no unauthorized source/framework change is made;
- Tests pass;
- Typecheck passes.

## 6. Story US-003 — Execute fresh real run 2

Same doctrine as US-002, using a new fresh run.

The second run must not be selected to compensate for the first run’s route.

Acceptance:

- exactly one additional fresh run is attributable;
- run is independent of US-002 desired outcome;
- workflow outcome is preserved;
- Sidecar report is attributable;
- any P2 transition is natural;
- no forced retry or route steering;
- Tests pass;
- Typecheck passes.

## 7. Story US-004 — Execute fresh real run 3

Same doctrine as US-002/US-003.

Acceptance:

- exactly one additional fresh run is attributable;
- total valid fresh batch size is three;
- outcome is preserved regardless of whether it is actionable;
- Sidecar report is attributable;
- any P2 transition is natural;
- no forced Round 2;
- Tests pass;
- Typecheck passes.

## 8. Story US-005 — Synthesize run/observe and report sufficiency

Read the three run artifacts and their Sidecar Run Reports.

Answer two separate questions.

### Q1 — P2 real transition observation

Allowed conclusions:

```text
CROSS_ROUND_TRANSITION_OBSERVED
NO_CROSS_ROUND_TRANSITION_OBSERVED
OBSERVATION_INSUFFICIENT
```

`NO_CROSS_ROUND_TRANSITION_OBSERVED` is a successful evidence result, not a failed PRD.

### Q2 — Sidecar Run Report sufficiency

Determine whether a Human can understand each run without opening raw Participant payloads.

At minimum the report/evidence should make understandable:

- run / round identity;
- problem reference;
- Role sequence;
- first-pass structured outcome;
- retransmission if any;
- final structured outcome;
- Reviewer decision;
- execution if any;
- next action / terminal reason.

If the report is sufficient:

```text
NO_REPORT_CHANGE
```

If a specific objective field is missing, a minimal Report Producer correction may be proposed/implemented only if it stays sidecar-only and does not become Report Analysis.

Acceptance:

- all three run outcomes are summarized without subjective quality scoring;
- P2 observation uses one allowed conclusion;
- absence of cross-round transition is not treated as defect;
- report sufficiency has evidence per run;
- no Report Analysis is introduced;
- any report correction is minimal, objective, and sidecar-only;
- current-product-stage is updated only if real evidence changes an explicit status;
- Tests pass;
- Typecheck passes.

## 9. Legitimate workflow outcomes

Examples that remain valid:

```text
OPTIONS
NO_PROPOSAL
INSUFFICIENT_EVIDENCE
REVIEW_REJECTED
REQUEST_MORE_WORK
DEFER
ESCALATE
PARTICIPANT_FAILURE
READY_FOR_CONFIG_EXECUTION
STOP
```

Do not redefine workflow semantics in this PRD.

## 10. Stop conditions

Stop if:

1. real execution requires a new Runtime / Framework / formal Contract change;
2. a desired P2 transition can only be obtained by selecting/steering a guaranteed modifiable problem;
3. a Sidecar Report must become a main workflow dependency;
4. an observed Participant failure is “fixed” by Host semantic repair;
5. configuration execution would exceed its existing permission scope;
6. unrelated repository dirt makes evidence attribution unsafe;
7. the active execution tip still presents `240000ms` as current Participant hard-timeout authority or otherwise lacks the accepted `1800000ms` hard-boundary decision.

## 11. Completion

After US-005:

```text
STOP
→ delta review
→ Human decides whether PRD C may start
```

Do not start a new communication-contract implementation from this PRD.
