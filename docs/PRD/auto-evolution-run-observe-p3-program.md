# Auto Evolution Run/Observe → Bounded P3 Program

> Status: **PROGRAM SYNTHESIS COMPLETE — PRD A CLOSED / PRD B CLOSED / PRD C EXECUTED / terminal = `NO_BOUNDED_P3_SLICE_JUSTIFIED` / STOP → HUMAN GATE D**
>
> Program goal: use real runtime evidence to close the two currently explicit evidence gaps—Structured Final Output Contract V1 runtime conformance and real Participant-driven P2 cross-round observation—then decide whether any *bounded* next P3 communication slice is justified.
>
> This roadmap is program coordination authority only. Each executable batch is governed by its paired `*.md` + `*.prd.json`, with the Markdown PRD taking precedence over the JSON execution index.

## 1. Repository authority and current stage

Current repository authority places Auto Evolution in:

> **EARLY OPERATIONAL / RUN-OBSERVE**

Already established:

- P1 Sidecar Run Report: engineering closed / usable.
- P2 Multi-round Execution Validation: design accepted / engineering closed.
- P2 deterministic cross-round path: verified.
- P2 real Participant-driven cross-round product hypothesis: **UNVERIFIED**.
- P3 Minimal Slice #1 — Structured Final Output Contract V1: engineering delivered; first contract-only matrix = `CONTRACT_CONFORMANCE_PROMISING`; Human acceptance = `PROMISING_WITH_CAVEATS`; full runtime communication remains **UNVERIFIED**.
- P3 Minimal Slice #2 — Envelope Failure Bounded Retransmission: engineering delivered; runtime conformance **VERIFIED** for the accepted Solution-only / ENVELOPE_FAILURE-only boundary.
- Full P3 Participant Communication Contract Consolidation: **DEFERRED**.

The program must not reinterpret those statuses.

## 2. Program principle

The next work is evidence-first:

```text
existing delivered contracts
        ↓
independent runtime conformance evidence
        ↓
fresh normal real runs
        ↓
sidecar / cross-round observation
        ↓
communication evidence synthesis
        ↓
repeated structural problem?
  ├─ NO  → remain RUN / OBSERVE
  └─ YES → propose one bounded next P3 slice
```

The program does **not** pre-authorize full P3 consolidation.

## 3. Program packages

### PRD A — Structured Output Contract Conformance

Files:

- `auto-evolution-structured-output-conformance.md`
- `auto-evolution-structured-output-conformance.prd.json`

Purpose:

- run the already-designed Contract Conformance Matrix;
- separate communication-contract reliability from reasoning quality;
- compare Codex current binding and Cursor Auto first;
- collect three trivial contract-only trials per binding;
- keep strict validate-or-reject semantics;
- make no provider/model superiority claim.

Expected terminal verdict:

- `CONTRACT_CONFORMANCE_PROMISING`
- `CONTRACT_CONFORMANCE_UNSTABLE`
- `CONTRACT_CONFORMANCE_REGRESSION`
- `OBSERVATION_INSUFFICIENT`

PRD A is **CLOSED**. Its first 3+3 matrix was accepted as `CONTRACT_CONFORMANCE_PROMISING` with Human qualifier `PROMISING_WITH_CAVEATS`; harness closure is complete. This result does not validate full runtime communication or full P3.

### PRD B — Real Run / Observe Batch

Files:

- `auto-evolution-real-run-observe-batch.md`
- `auto-evolution-real-run-observe-batch.prd.json`

Purpose:

- execute three fresh, normal, problem-agnostic real runs using the existing authorized workflow;
- observe P1 Sidecar Run Report sufficiency;
- allow existing P2 machinery to take over **only if** a run naturally produces `READY_FOR_CONFIG_EXECUTION`;
- never manufacture a configuration-ready problem merely to obtain a cross-round sample.

Legitimate batch outcomes include:

- `NO_CROSS_ROUND_TRANSITION_OBSERVED`
- `CROSS_ROUND_TRANSITION_OBSERVED`
- `DEFER`
- `ESCALATE`
- `REVIEW_REJECTED`
- `PARTICIPANT_FAILURE`
- other already-authorized workflow outcomes.

PRD B is **CLOSED / ACCEPTED AS OBSERVATION EVIDENCE** after Human delta review. The three fresh runs produced `0 / 3 READY_FOR_CONFIG_EXECUTION`, `0` cross-round transitions, and `0` retransmissions. This leaves the P2 real Participant-driven cross-round hypothesis **UNVERIFIED**; absence of READY in this three-run batch is not a route-frequency claim.

### PRD C — Communication Evidence Synthesis

Files:

- `auto-evolution-communication-evidence-synthesis.md`
- `auto-evolution-communication-evidence-synthesis.prd.json`

Purpose:

- consume PRD A and PRD B evidence;
- classify communication variance without judging Participant thoughts;
- distinguish one-off behavior from repeated structural communication problems;
- decide whether a bounded next P3 slice is justified.

Terminal program decision:

```text
NO_BOUNDED_P3_SLICE_JUSTIFIED
```

or:

```text
BOUNDED_P3_SLICE_CANDIDATE
```

A candidate is a proposal only; it does not authorize implementation.

PRD C has **executed**. Required PRD A / PRD B raw evidence was directly openable and attributable. Terminal decision:

```text
NO_BOUNDED_P3_SLICE_JUSTIFIED
```

Evidence: `.tmp/evolution/communication-evidence-synthesis-20260829/decision.json`. No bounded P3 implementation was authorized or performed. Full P3 remains **DEFERRED**.

## 4. Four program phases

| Phase | Executable package | Goal |
|---|---|---|
| 1. Contract conformance | PRD A | Verify terminal-envelope behavior independently of reasoning workload |
| 2. Real run / observe | PRD B | Collect fresh real workflow evidence and natural P2 transition evidence if it occurs |
| 3. Operational report sufficiency | PRD B | Determine whether the existing sidecar report is sufficient to understand those runs |
| 4. Communication evidence synthesis | PRD C | Decide whether repeated evidence justifies one bounded next P3 slice |

## 5. Global invariants

All three PRDs inherit these invariants.

1. **Run / Observe remains the product stage.**
2. Do not manufacture `READY_FOR_CONFIG_EXECUTION`.
3. Do not pre-select a problem because it is guaranteed to modify configuration.
4. Do not force every real run to reach Round 2.
5. `NO_PROPOSAL`, `INSUFFICIENT_EVIDENCE`, `DEFER`, `ESCALATE`, rejection, participant failure, and STOP remain legitimate outcomes.
6. Host validates terminal structured output or rejects it; it does not semantically repair it.
7. “Correct communication, not thoughts.”
8. P3 Minimal Slice #2 remains Solution-only and terminal `ENVELOPE_FAILURE`-only unless a later Human-approved PRD changes that.
9. No second retransmission.
10. No `SCHEMA_FAILURE` recovery.
11. No Reviewer or Configuration Execution rollout of Slice #2.
12. No provider switching / fallback designed as recovery.
13. No generic retry subsystem.
14. No Contract registry / platform.
15. No MCP / transport redesign.
16. No Report Analysis / automatic intervention.
17. No autonomous code modification expansion.
18. No repository promotion / merge automation.
19. Runtime evidence may produce a `NO_SOURCE_CHANGE` Story outcome.
20. A Ralph Story is not required to modify product source code to pass; evidence and verified artifacts are valid outputs when the Story is evidence-only.
21. Participant/model execution uses the accepted hard-timeout policy v1: default hard boundary `1800000ms`; it is an abnormal-safety boundary, not the ordinary execution budget. Retransmission, retry, and other workflow budgets remain independent.
22. Runtime evidence records requested route/binding; resolved concrete model identity is recorded only when transport evidence exposes it. Do not infer model identity from Auto routing, host defaults, latency, or style.

## 6. Branch and workspace policy

Default:

```text
latest clean authoritative repository tip
→ ordinary branch for the current PRD
→ Ralph Story commits
```

A worktree is optional, not required.

Before each PRD starts:

- confirm the branch contains the latest accepted repository authority relevant to Auto Evolution;
- confirm `git status --short` is clean;
- do not infer authority from an older feature-branch ZIP if a newer accepted integration tip exists;
- stop if `current-product-stage.md`, `product-decisions.md`, or the relevant active Contract materially contradict this roadmap;
- any future real-run evidence batch must not treat `240000ms` as the current Participant hard-timeout authority. The accepted policy is `1800000ms` as an abnormal-safety hard boundary, unless newer Human-approved repository authority supersedes it.

## 7. Evidence policy

Evidence must be attributable.

For runtime trials record at least:

- run/trial identity;
- requested Participant / harness route or binding;
- resolved concrete model identity only if directly exposed by transport evidence;
- role;
- start/end or elapsed time when available;
- terminal raw-output reference;
- structured validation result;
- workflow outcome;
- first-pass / retransmission provenance when applicable;
- Sidecar Run Report reference for real workflow runs.

Do not convert subjective “answer quality” into a generic numeric score.

Do not copy runtime payloads into governance documents merely to create a permanent transcript.

## 8. Human gates

### Gate A — before PRD A

Human approves PRD A for execution.

### Gate B — after PRD A — **PASSED**

Delta review result:

- PRD A first matrix is accepted as `CONTRACT_CONFORMANCE_PROMISING` with Human qualifier `PROMISING_WITH_CAVEATS`.
- No conformance finding blocks ordinary RUN / OBSERVE.
- Harness closure corrected FAQ authority wording and non-PASS CLI exit semantics without changing validator/retry/retransmission behavior.
- PRD B does not require program replanning.

PRD B execution approval was subsequently granted, its latest-authority integration gate was satisfied for the executed batch, and PRD B is now **CLOSED / ACCEPTED AS OBSERVATION EVIDENCE**. This Gate B paragraph is historical context, not a pending execution instruction.

### Gate C — after PRD B — **PASSED**

Delta review result:

- PRD B is accepted as observation evidence;
- `0 / 3 READY_FOR_CONFIG_EXECUTION` remains a batch observation, not a route-frequency or dominance claim;
- PRD B Slot 1 `IMPROVEMENT_HYPOTHESIS` parse failure must be classified independently from Slice #1 Pilot conformance unless independent evidence demonstrates the same structural issue;
- PRD C may proceed only if required PRD A / PRD B raw evidence is directly openable and attributable; otherwise it must stop with `OBSERVATION_INSUFFICIENT`.

PRD C is separately **Human-approved for Ralph execution**. No bounded P3 implementation is authorized by this approval.

### Gate D — after PRD C — **PENDING HUMAN REVIEW**

Ralph synthesis produced:

```text
NO_BOUNDED_P3_SLICE_JUSTIFIED
```

Human Gate D should confirm remain RUN / OBSERVE (expected path) or override only with new authority.

No future P3 implementation is pre-approved by this roadmap.

## 9. Program stop conditions

Stop the active PRD if any of the following occurs:

1. repository authority materially contradicts the assumed current stage;
2. execution requires weakening strict terminal validation;
3. a Story requires Host semantic JSON repair/extraction;
4. a Story requires broad retry / recovery expansion;
5. a Story requires unauthorized Runtime / Framework / Contract redesign outside its explicit scope;
6. a real-run Story can only “pass” by manufacturing a desired workflow outcome;
7. source modifications become necessary but are not explicitly authorized by the active Story;
8. evidence provenance cannot be established;
9. unrelated dirty changes make Story attribution unsafe;
10. a proposed bounded P3 change cannot be tied to repeated observed evidence.

## 10. Program completion definition

The program is complete when PRD C produces one evidence-grounded terminal decision and Human reviews it.

Program completion does **not** require:

- observing a real cross-round transition;
- inventing a new P3 slice;
- making all harness/model bindings conformant;
- eliminating all Participant failures;
- adding new product capability.

The intended outcome is better evidence and a justified next decision, not mandatory expansion.
