# PRD — Auto Evolution Communication Evidence Synthesis

> Status: **HUMAN APPROVED FOR RALPH EXECUTION**
>
> Pair: `auto-evolution-communication-evidence-synthesis.prd.json`
>
> Product stage: RUN / OBSERVE
>
> This PRD decides whether the accumulated communication evidence justifies one bounded next P3 slice. It does not implement that slice.

Accepted input state from PRD B delta review:

```text
PRD A: CLOSED — first matrix accepted as PROMISING_WITH_CAVEATS
PRD B: CLOSED — accepted as observation evidence
PRD B fresh runs: 3
READY_FOR_CONFIG_EXECUTION: 0 / 3
Cross-round transitions observed: 0
Retransmissions observed: 0
P2 real Participant-driven cross-round hypothesis: UNVERIFIED
Full P3: DEFERRED
```

The three PRD B terminal paths were observed outcomes, not target outcomes. In particular, `0 / 3 READY_FOR_CONFIG_EXECUTION` is evidence about this batch only; it does **not** establish that DEFER/ESCALATE is statistically normal, dominant, or more likely than READY.

## 1. Goal

Consume:

- PRD A Contract Conformance Matrix evidence;
- PRD B fresh real-run artifacts;
- Sidecar Run Reports;
- existing P3 Slice #1/#2 runtime evidence;
- current Contract/Role authority;

and answer:

> Is there a repeated, structural Participant communication problem that should be promoted into a shared bounded Contract change?

## 2. Evidence boundary

Do not use this PRD to judge whether a Participant reached the “correct” subjective answer.

Required PRD A / PRD B raw evidence must be directly openable and attributable in the execution workspace. Summaries in `current-product-stage.md`, `prd.json` notes, Human memory, or prior chat are not substitutes for raw evidence. If required evidence cannot be opened or attributed, stop synthesis and report `OBSERVATION_INSUFFICIENT`; do not infer missing details from summaries.

Classify communication/runtime observations, for example:

- `ENVELOPE_VARIANCE`
- `ROLE_SCHEMA_VARIANCE`
- `FIELD_SEMANTICS_AMBIGUITY`
- `PROVENANCE_AMBIGUITY`
- `PERMISSION_OR_STOP_AMBIGUITY`
- `PARTICIPANT_FAILURE`
- `PROVIDER_OR_RUNTIME_FAILURE`
- `ONE_OFF_BEHAVIOR`
- `NO_STRUCTURAL_COMMUNICATION_PROBLEM`

These are analysis labels for evidence synthesis, not a required new runtime taxonomy.

Do not migrate runtime failure taxonomy merely to match this report.

## 3. Repetition standard

A bounded P3 candidate requires evidence stronger than one isolated odd output.

The synthesis must show a repeated structural pattern across at least one of:

- more than one independent real run;
- more than one Pilot Role;
- more than one harness/binding;
- one real run plus independent conformance evidence demonstrating the same structural issue.

A single isolated Participant mistake is insufficient unless repository authority already identifies it as an unresolved systemic invariant violation.

Absence of a natural cross-round transition in the three-run PRD B batch is not itself evidence for or against a communication Contract change. Do not convert `0 / 3 READY_FOR_CONFIG_EXECUTION` into an estimated route frequency or a claim about what the workflow “usually” does.

Do not create a numeric “communication quality score.”

## 4. Story US-001 — Assemble an attributable evidence corpus

Collect only references necessary for synthesis.

Include:

- PRD A matrix/verdict;
- PRD B three-run batch summary;
- relevant structured-output/retransmission traces;
- Sidecar reports;
- current Role schemas/Contracts;
- current product-stage/governance statements.

Do not copy full raw conversations into governance.

Acceptance:

- every observation is traceable to a source artifact or current authority;
- required PRD A / PRD B raw evidence is directly openable in the execution workspace and attribution is verified before synthesis;
- if required raw evidence is missing or unattributable, synthesis stops with `OBSERVATION_INSUFFICIENT` rather than relying on summaries or memory;
- historical evidence is dated/labeled and not confused with current runtime evidence;
- raw Participant reasoning is not normalized into invented facts;
- no product source change is required;
- Tests pass;
- Typecheck passes.

## 5. Story US-002 — Classify communication variance

For each material observation determine whether it is:

```text
one-off Participant behavior
repeated communication-contract problem
provider/runtime issue
existing already-handled invariant
insufficient evidence
```

Explicitly account for:

- PRD B Slot 1 `IMPROVEMENT_HYPOTHESIS` parse failure as a separate observation from Slice #1 Pilot conformance: it is **not** a Slice #1 regression unless independent evidence demonstrates the same structural Contract problem in the Slice #1 Pilot boundary;
- `0 / 3 READY_FOR_CONFIG_EXECUTION` as a batch observation only, not a route-frequency or dominance claim;
- bare JSON / wrapper/fence variance;
- Role schema mismatch;
- Slice #2 first-pass ENVELOPE_FAILURE and bounded recovery;
- schema failures remaining fail-closed;
- provenance / references;
- permission / STOP semantics;
- report visibility.

Acceptance:

- classifications are evidence-grounded;
- the Slot 1 `IMPROVEMENT_HYPOTHESIS` parse failure is classified independently from Slice #1 Pilot conformance unless evidence establishes the same structural issue;
- `0 / 3 READY_FOR_CONFIG_EXECUTION` is not generalized into a claim that DEFER/ESCALATE is the normal or dominant workflow route;
- thought/solution correctness is not judged;
- existing Slice #2 behavior is not generalized beyond its authority;
- runtime/provider failure is not mislabeled as Contract semantics;
- no new runtime taxonomy is required;
- Tests pass;
- Typecheck passes.

## 6. Story US-003 — Decide whether a bounded P3 slice is justified

Choose exactly one terminal decision:

```text
NO_BOUNDED_P3_SLICE_JUSTIFIED
BOUNDED_P3_SLICE_CANDIDATE
OBSERVATION_INSUFFICIENT
```

### If NO_BOUNDED_P3_SLICE_JUSTIFIED

State:

- what was observed;
- why it does not justify shared Contract expansion;
- which current Contracts remain sufficient;
- that full P3 remains deferred;
- what future evidence would reopen the question.

### If BOUNDED_P3_SLICE_CANDIDATE

Produce a candidate packet containing only:

- repeated observed problem;
- evidence refs;
- minimum affected Role(s);
- smallest possible Contract change;
- explicit non-goals;
- expected failure/stop behavior;
- why a local Role fix is insufficient;
- what would falsify the need for the shared change.

Do not implement it.

### If OBSERVATION_INSUFFICIENT

State what evidence is missing without manufacturing more runs inside this Story.

Acceptance:

- exactly one terminal decision is produced;
- decision cites repeated evidence or explicitly says evidence is insufficient;
- no full P3 platform is proposed;
- candidate, if any, is bounded and falsifiable;
- no implementation source change is made;
- Tests pass;
- Typecheck passes.

## 7. Story US-004 — Close the program evidence status

Update only the minimal repository authority needed so future work does not rediscover the same evidence state.

Possible current-stage updates:

- Structured Final Output Contract V1 runtime conformance status;
- P2 real cross-round observation status, if PRD B actually changed it;
- bounded P3 candidate/no-candidate status.

Do not paste run-by-run transcripts into `current-product-stage.md`.

Runtime details belong in evidence artifacts / reports.

Acceptance:

- current-product-stage reflects only evidence that actually changed;
- product-decisions are added only if a product decision was genuinely made, not to manufacture numbering;
- full P3 remains DEFERRED unless Human separately authorizes it;
- no P3 implementation PRD is silently executed;
- program terminal decision is easy to find from current authority;
- Tests pass;
- Typecheck passes.

## 8. Execution approval and entry gate

Human has approved this PRD for Ralph execution. This approval authorizes US-001 through US-004 in priority order; it does not authorize any P3 implementation after the terminal synthesis decision.

Before US-001 starts:

- use the latest clean authoritative repository tip containing the accepted PRD A and PRD B closure state;
- confirm PRD A and PRD B raw evidence referenced by this PRD is present and directly openable;
- confirm `git status --short` is clean;
- use branch `ralph/auto-evolution-communication-evidence-synthesis` or an equivalent ordinary clean branch matching the JSON execution index;
- stop if current repository authority materially contradicts this PRD.

Human approval does not waive any evidence-provenance or stop condition.

## 9. Explicit non-goals

Do not:

- implement a next P3 slice;
- build Contract registry/platform;
- redesign transport/MCP;
- add provider abstraction;
- change model routing;
- broaden retry;
- add automatic report analysis/intervention;
- create Participant quality scoring;
- modify Game product content;
- authorize autonomous code modification.

## 10. Completion

After US-004:

```text
STOP
→ HUMAN GATE
```

If terminal decision is:

```text
NO_BOUNDED_P3_SLICE_JUSTIFIED
```

continue ordinary RUN / OBSERVE.

If:

```text
BOUNDED_P3_SLICE_CANDIDATE
```

Human reviews the candidate and, only if accepted, a *new* paired PRD is generated.

If:

```text
OBSERVATION_INSUFFICIENT
```

Human decides whether to authorize another evidence batch.
