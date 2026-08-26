# Two-Turn Solution Transition Spike — Design Spec

**Date:** 2026-08-24  
**Status:** Design revised after Human review (narrow clarifications) — awaiting re-acceptance  
**Project:** wuxia-life / Auto Evolution  
**Authority:** Superpowers working-area design only. Not first-layer product authority. Success does not graduate CandidateCheckpoint or multi-turn execution into product semantics.

---

## 0. Product Alignment

| Check | Answer |
| --- | --- |
| Product problem | Cursor Solution single long turn keeps a 400s+ tool loop after candidates form; terminal `SolutionWorkV1` is unstable. Prior Gate A/B (`CANDIDATE_TRANSITION_GATE_BEHAVIORALLY_EFFECTIVE_BUT_INSUFFICIENT`) showed prompt-only phase language shifts exploration but does not reliably complete within budget; next direction was host-level terminal-transition enforcement. |
| First-layer / PD anchor | `auto-evolution-model` (Orchestrator owns workflow; Agents own reasoning) + delivered Structured Final Output Contract V1 (P3 Minimal Slice #1). |
| Concrete change if successful | Evidence that a **same-Role** host-enforced turn boundary (checkpoint → synthesis) can interrupt uncontrolled exploration and yield valid SolutionWork more often than the Auto baseline. |
| Why worth doing now | Run/Observe already exposed this blocker; this is a bounded architecture-feasibility spike, not a new capability stage. |

**Assumption Drift:** `CandidateCheckpointV1` is an **experimental** intermediate handoff schema. It must not silently become a production Role schema, Workflow Step, or Framework reasoning rubric.

---

## 1. Question and Non-Goals

### 1.1 Single core question

When the Solution Participant explicitly delivers a grounded candidate checkpoint, the Host ends the investigation turn and opens a synthesis-only turn on the **same Cursor thread**, can that prevent sustained 400s+ tool loops and stably produce valid `SolutionWorkV1`?

### 1.2 What is being tested

```text
single long turn → uncontrolled exploration

  vs

bounded working turn
  → explicit checkpoint
  → host-enforced turn boundary
  → synthesis turn
```

### 1.3 Explicit non-goals

This spike does **not** validate:

- which Cursor model is best;
- whether 360s / 120s are correct production timeouts;
- whether CandidateCheckpoint should permanently enter the product;
- whether Codex should become multi-turn;
- whether the Orchestrator should add an Investigation Step.

### 1.4 Interpretation boundary (budget vs checkpoint)

**Turn 1 hitting the 360s participant ceiling must not alone decide that a checkpoint is unenforceable.**

Classification of `CANDIDATE_CHECKPOINT_NOT_ENFORCEABLE_BY_PROMPT` requires joint evidence from the timeout window, including whether:

- tool activity was still ongoing near the ceiling;
- broad exploration had clearly stopped;
- terminalization signs were present (attempted structured final output, explicit checkpoint language, process winding down).

Otherwise budget effect and checkpoint effect are confounded.

### 1.5 Experimental budgets (participant execution)

| Bound | Value | Meaning |
| --- | ---: | --- |
| Turn 1 participant ceiling | 360000ms | Working turn with checkpoint as terminal |
| Turn 2 participant ceiling | 120000ms | Synthesis-only turn |
| Total participant execution budget | 480000ms | Sum of Turn 1 + Turn 2 ceilings when both run |

**Do not** equate this with strict trial wall-clock = 480s. Process spawn, checkpoint parse, and resume preparation add host overhead.

Per trial report:

- `participantExecutionMs`
- `hostTransitionOverheadMs`
- `trialWallClockMs`

Baseline comparison uses the same participant-execution framing (Auto baseline: 480s participant ceiling, 3/3 timeout, 0/3 terminal).

---

## 2. Architecture Boundary and CandidateCheckpointV1

### 2.1 Still one Role

```text
Solution Role
│
├── Turn 1 — Investigation + Targeted Verification
│      ↓
│   CandidateCheckpointV1
│
│   [HOST TURN BOUNDARY]
│
└── Turn 2 — Synthesis Only
       ↓
    SolutionWorkV1
```

This is **not**:

```text
Problem → Investigation Role → Verification Role → Synthesis Role → Reviewer
```

Framework does **not** own candidate content.

| Authority | Owns |
| --- | --- |
| Agent | What the candidate is; what evidence supports it; what remains a material unknown |
| Host | Checkpoint schema validity; ending Turn 1; opening Turn 2; **turn transition** — after a valid `READY_TO_SYNTHESIZE` checkpoint, Host does **not** schedule another investigation turn |

**Wording precision:** Host does **not** claim provider-level ability to forbid Cursor tool use in Turn 2. Turn 2 “no tools” is prompt-level policy + Host observation in this spike.

### 2.2 CandidateCheckpointV1 (experimental, minimal)

Example (`READY_TO_SYNTHESIZE`):

```json
{
  "schemaVersion": "solution-candidate-checkpoint-v1",
  "problemId": "problem-hypothesis-000001",
  "status": "READY_TO_SYNTHESIZE",
  "candidates": [
    {
      "candidateId": "candidate-000001",
      "mechanism": "A concise repository-grounded explanation of the candidate mechanism.",
      "evidenceRefs": ["repo-relative/path.ts"],
      "remainingMaterialUnknowns": []
    }
  ]
}
```

Example (`INSUFFICIENT_EVIDENCE`):

```json
{
  "schemaVersion": "solution-candidate-checkpoint-v1",
  "problemId": "problem-hypothesis-000001",
  "status": "INSUFFICIENT_EVIDENCE",
  "candidates": []
}
```

#### Top-level required fields

Exact keys only; unknown fields fail-closed:

- `schemaVersion`
- `problemId`
- `status`
- `candidates`

`schemaVersion` must be `"solution-candidate-checkpoint-v1"`.

`problemId` must **strictly equal** the Problem Package `problemId` bound to this trial (identity anchor for later provenance diagnostics).

#### `status` (V1 only two values)

| Status | `candidates` | Host behavior |
| --- | --- | --- |
| `READY_TO_SYNTHESIZE` | length `1..3` | May enter Turn 2 if strict-valid + resumable thread id |
| `INSUFFICIENT_EVIDENCE` | must be `[]` | Accept as **legal negative checkpoint**; **do not** enter Turn 2 |

Forbidden status values (would turn checkpoint into a continue-exploration license):

- `NEEDS_MORE_TIME`
- `CONTINUE_INVESTIGATION`
- `PARTIAL`
- `UNCERTAIN`

`INSUFFICIENT_EVIDENCE` is **not** a time-budget escape hatch. Prompt must state this explicitly.

#### Candidate object

Exact keys only; unknown fields fail-closed:

- `candidateId`
- `mechanism`
- `evidenceRefs`
- `remainingMaterialUnknowns`

`candidateId` must be unique within the checkpoint. Host checks **format and uniqueness only**, not content. Required format (exact):

```text
/^candidate-\d{6}$/
```

Examples: `candidate-000001`, `candidate-000002`, `candidate-000003`.

**Host mechanical validation only** (structure / identity / reference legality — not candidate semantics):

| Field | Host checks |
| --- | --- |
| `mechanism` | non-empty trimmed string. Host does **not** judge explanatory quality or correctness. |
| `evidenceRefs` | non-empty array of strings; each ref obeys existing `repoRef` syntax / legality rules. Do **not** invent a second path syntax. |
| `remainingMaterialUnknowns` | array of strings (may be `[]`); if present, each entry must be non-empty after trim. Host does **not** judge whether an unknown is materially important. |

**Participant prompt semantics** (Agent authority — not Host rejection rules):

- `mechanism` should explain the causal mechanism by which the problem arises, rather than merely request more investigation.
- Non-empty `remainingMaterialUnknowns` entries should be questions that could confirm, reject, or materially distinguish the candidate.
- `evidenceRefs` exist so the Participant cannot “guess in 20s → checkpoint immediately”; Host still only validates reference legality, not that the refs prove the candidate.

This split must not blur into a Framework reasoning rubric.

### 2.3 Turn 1 structured output contract

Do not invent a new envelope.

Reuse delivered **Structured Final Output Contract V1** with role schema label:

```text
SolutionCandidateCheckpointV1
```

Requirements unchanged:

- exactly one bare JSON object;
- no prose;
- no Markdown;
- no host repair.

Until this spike succeeds, CandidateCheckpoint remains an **experimental** schema only — not part of formal P3 rollout.

Authority split that must not blur:

```text
candidate semantics = Agent authority
checkpoint validity = Host authority
```

---

## 3. Turn Duties, Budgets, Tool Policy, Resume

### 3.1 Turn 1 prompt structure (clean A/B control)

**Turn 1 MUST NOT reuse the complete production Solution prompt verbatim.**

`buildSolutionAgentPrompt()` currently includes terminal-deliverable instructions that conflict with this spike:

```text
Return zero to three options or an explicit no-proposal /
insufficient-evidence / escalate result.

Structured Final Output Contract V1
roleSchemaName = SolutionWorkV1
```

Appending a checkpoint obligation on top of that full prompt would give the model **two conflicting terminal contracts**.

Do **not** re-strengthen production convergence wording either. Stacking stronger new convergence text would confound:

```text
checkpoint + turn boundary
```

with:

```text
stronger new convergence prompt + checkpoint + turn boundary
```

#### Preserve verbatim

- investigation / reasoning instructions
- current convergence discipline
- assigned Skill content / provenance
- reference-format requirements
- Problem Package

#### Replace only production terminal-deliverable instructions

Remove for this turn:

- the instruction requiring zero-to-three Solution options / normal Solution terminal outcome
- the Structured Final Output Contract V1 binding to `SolutionWorkV1`

Then add:

- CandidateCheckpointV1 terminal obligation
- Structured Final Output Contract V1 bound to `SolutionCandidateCheckpointV1`

Terminal obligation core:

```text
This turn's deliverable is not SolutionWorkV1,
but CandidateCheckpointV1.

When investigation + targeted verification, as already described
by the existing convergence discipline, is sufficient to form
a checkpoint, end this turn immediately with that checkpoint.
```

Independent variable for Turn 1 is then:

```text
final deliverable: SolutionWorkV1 → CandidateCheckpointV1
+ host turn boundary
```

not two stacked output contracts.

Also: do **not** stack the prior Candidate Transition Gate prompt fragment (separate prior factor).

### 3.2 Turn 1 duties (via existing discipline + terminal obligation)

Turn 1 is investigate + targeted verify + checkpoint — not pure investigation. The experimental obligation makes the checkpoint the **terminal result** of the turn and forbids emitting final `SolutionWorkV1` in Turn 1.

### 3.3 Session / thread capture

Turn 1 must recover an officially resumable thread/session identifier from the **native Cursor stream**. Do not guess or synthesize IDs.

Preflight must prove:

1. Turn 1 native stream exposes a resumable identity (or document how official Cursor output exposes it);
2. local CLI `--resume <id>` syntax from `cursor agent --help`.

If unavailable:

```text
CURSOR_RESUMABLE_THREAD_ID_UNAVAILABLE
→ SPIKE_BLOCKED_BY_THREAD_RESUME_IDENTITY
→ STOP
```

Cursor invocations may be 0.

**Forbidden degradation:** stuffing the entire Turn 1 transcript into Turn 2. That tests a different architecture.

### 3.4 Turn 2 entry conditions

All required:

1. Turn 1 `status = READY_TO_SYNTHESIZE`
2. checkpoint strict-valid (schema, exact keys, unique `candidateId`s, bound `problemId`)
3. resumable thread id available

Otherwise do not start Turn 2.

### 3.5 Turn 2: synthesis only

Same Cursor thread. Planned shape (exact argv from local `--help` authority):

```text
cursor agent
  --resume <thread-id>
  --print
  --output-format stream-json
  --model auto
  <synthesis-only-prompt>
```

Do not assume `--workspace` / `--model` / `--resume` combination; confirm read-only before first invocation.

Turn 2 does **not** restate the full Problem Package; it relies on thread context.

Turn 2 **must restore** normal Solution terminal semantics (removed in Turn 1):

- zero-to-three options / valid negative Solution outcome
  (`no-proposal` / `insufficient-evidence` / `escalate` as defined by SolutionWorkV1)
- Structured Final Output Contract V1 bound to `SolutionWorkV1`

Core prompt semantics:

```text
The investigation and verification turn is complete.

Use the CandidateCheckpointV1 and the repository evidence already
gathered in this thread.

You are now in SYNTHESIS ONLY.

Do not reopen broad repository investigation.
Do not seek additional evidence merely to increase confidence.

Produce the final SolutionWorkV1 using the already gathered evidence
(zero to three options, or a valid structured negative Solution outcome).

Return the terminal result according to Structured Final Output Contract V1
with roleSchemaName = SolutionWorkV1.
```

### 3.6 Turn 2 tool policy (V1)

- Prompt-level: prohibit all new tool use (repository, shell, file, search, or other investigation tools).
- Host does **not** implement provider/tool-permission engineering, kill-on-tool, filtering, or Cursor permission changes.
- Host **observes** whether tool events occur.

On any Turn 2 tool event:

- classify primary outcome as `SYNTHESIS_ONLY_TOOL_VIOLATION` (see §4.3 precedence);
- do **not** immediately kill the process;
- allow the process until the 120s participant ceiling;

so the spike can distinguish:

```text
1 accidental tool → then final
```

vs:

```text
re-enter investigation loop
```

Record at least:

- `solutionValid`
- `synthesisOnlyBoundaryRespected` (false if any tool event)
- `toolCallCount`

Even if `solutionValid = true`, a tool violation means the trial is **not** a full primary success.

### 3.7 Binding

Cursor Auto only. Explicit `--model auto`. No Composer, Grok, or Codex.

### 3.8 A/B cleanliness summary

```text
Baseline:
  single Cursor Auto turn
  current production prompt
  480s participant ceiling

Intervention:
  same production investigation / convergence / Skill / refs / Problem Package
  + terminal deliverable replaced: SolutionWorkV1 → CandidateCheckpointV1
  Turn 1 ≤360s participant
  → same-thread resume
  → synthesis-only turn restores SolutionWorkV1 terminal contract ≤120s participant

total participant execution budget: same 480s
```

---

## 4. A/B, Outcomes, Provenance, Verdicts, Artifacts, Preflight, STOP

### 4.1 Groups

**A — reuse only (no rerun):**  
`cursor-real-solution-model-matrix-20260824` Auto ×3  
→ 3/3 TIMEOUT @480s participant ceiling · 0/3 terminal result

**B — Two-Turn Auto ×3**

Report separately:

- `Solution trials = 3`
- `Cursor process invocations = <actual>` (at most 6; no Turn 2 if insufficient / Turn 1 failure)

### 4.2 Turn 1 outcomes

| Code | Meaning |
| --- | --- |
| `CHECKPOINT_READY` | `READY_TO_SYNTHESIZE` + strict-valid |
| `CHECKPOINT_INSUFFICIENT_EVIDENCE` | `INSUFFICIENT_EVIDENCE` + `candidates=[]` + valid; legal stop; no Turn 2 |
| `CHECKPOINT_ENVELOPE_FAILURE` | Shared Contract envelope failure |
| `CHECKPOINT_SCHEMA_FAILURE` | schema / exact-keys / uniqueness / problemId binding failure |
| `CHECKPOINT_TIMEOUT` | Hit 360s participant ceiling (interpret with §1.4) |
| `CHECKPOINT_RUNTIME_FAILURE` | Process / CLI / stream failure |

Per trial Turn 1 metrics at least: `checkpointCompleted`, `checkpointElapsedMs`, `checkpointValid`, `candidateCount`.

### 4.3 Turn 2 outcomes and primary classification precedence

Turn 2 outcomes exist only after `CHECKPOINT_READY`.

**Precedence:** if Turn 2 emits **any** tool event, primary classification is:

```text
SYNTHESIS_ONLY_TOOL_VIOLATION
```

Also record (always when Turn 2 ran):

- `solutionValid` = true/false
- `envelopeValid` = true/false
- `terminalOutcome` = completed / timeout / runtime-failure
- `toolCallCount` = N
- `synthesisOnlyBoundaryRespected` = (toolCallCount === 0)

So a run that calls one tool then emits valid `SolutionWorkV1` is **not** primary-classified as `VALID_SOLUTION_COMPLETED`, while retaining the diagnostic that the final payload was schema-valid.

Other primary codes when no tool event:

| Code | Meaning |
| --- | --- |
| `VALID_SOLUTION_COMPLETED` | valid SolutionWorkV1 and `synthesisOnlyBoundaryRespected` |
| `SOLUTION_ENVELOPE_FAILURE` | Shared Contract envelope failure |
| `SOLUTION_SCHEMA_FAILURE` | SolutionWorkV1 schema / reference validation failure |
| `SYNTHESIS_TIMEOUT` | Hit 120s participant ceiling |
| `SYNTHESIS_RUNTIME_FAILURE` | Process / CLI / stream failure |

### 4.4 Checkpoint → Final provenance (diagnostic only)

Provenance checks are **diagnostic evidence**, **not** a new success gate and **not** a new schema failure mode.

Mechanical checks:

```text
problemId:
  final.problemId === checkpoint.problemId === bound Problem Package problemId

repoRefs:
  record how many final repoRefs already appear in Turn 1 tool evidence
  and/or checkpoint.evidenceRefs

artifactRefs:
  continue validating under existing SolutionWorkV1 / sealed-artifact authority
```

Do **not** fail the trial as schema failure solely because some final `repoRef` is absent from `checkpoint.evidenceRefs`. Turn 2 retains synthesis autonomy; checkpoint is not a final option manifest.

If a full mechanical mapping cannot be established:

```text
FINAL_CHECKPOINT_PROVENANCE = PARTIALLY_OBSERVABLE
```

No semantic judge model.

### 4.5 Allowed spike verdicts (exactly one)

| Verdict | When |
| --- | --- |
| `HOST_ENFORCED_SOLUTION_TURN_BOUNDARY_EFFECTIVE` | Strong positive: valid checkpoint 3/3; valid final SolutionWorkV1 ≥ 2/3; most successful trials have Turn 2 tool calls = 0; participant-execution dynamics clearly better than baseline 480s timeout pattern (with §1.4) |
| `HOST_ENFORCED_SOLUTION_TURN_BOUNDARY_PROMISING_BUT_INCOMPLETE` | e.g. 3/3 checkpoint but 1/3 final; or ≥2/3 final but synthesis keeps calling tools |
| `CANDIDATE_CHECKPOINT_NOT_ENFORCEABLE_BY_PROMPT` | Turn 1 mostly fails to deliver checkpoint **and** timeout windows show continued tools / unstopped broad exploration / no terminalization (§1.4) |
| `CANDIDATE_CHECKPOINT_PREMATURE_CONVERGENCE` | Fast weak checkpoints + fast finals that are essentially guesses; speed alone ≠ success |
| `CURSOR_THREAD_RESUME_NOT_RELIABLE` | Checkpoint OK but `--resume` cannot restore same context (integration failure; not convergence failure) |
| `SPIKE_BLOCKED_BY_THREAD_RESUME_IDENTITY` | Preflight cannot prove resumable identity; STOP; invocations may be 0 |
| `OBSERVATION_INSUFFICIENT` | Residual |

After verdict: recommend **exactly one** next direction, then **STOP**. Do not auto-enter implementation. Do not promote experimental schemas to product authority.

### 4.6 Artifacts

Root:

```text
.tmp/evolution/cursor-two-turn-solution-transition-spike-20260824/
```

Per trial:

```text
trial-0N/
  workspace/
  turn-01/
    prompt.txt
    native-stream.jsonl
    stderr.txt
    terminal-payload.txt
    checkpoint.json
    event-summary.json
    timing.json
  turn-02/   # if started
    prompt.txt
    native-stream.jsonl
    stderr.txt
    terminal-payload.txt
    solution-work.json
    event-summary.json
    timing.json
  trial-summary.json
```

Root files:

```text
experiment-binding.json
case-binding.json
baseline-reference.json
spike-summary.json
spike-report.md
```

Final comparison table at least:

| Trial | Checkpoint | T1 elapsed | Candidates | T2 started | T2 tools | Final valid | participantExecutionMs | hostTransitionOverheadMs | trialWallClockMs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Versus baseline Auto: 0/3 final · 3/3 timeout @480s participant ceiling.

### 4.7 Preflight (before first Participant invocation)

1. Capture Cursor Agent CLI version.
2. Capture `cursor agent --help` resume syntax.
3. Prove Turn 1 native stream exposes resumable identity (or document official exposure). Failure → `SPIKE_BLOCKED_BY_THREAD_RESUME_IDENTITY`.
4. Record exact Turn 1 argv and planned Turn 2 argv.
5. Prove production repository remains untouched.
6. Record baseline Problem Package / Skill / production Solution prompt SHA.

### 4.8 Hard budget

```text
production mutation = 0
config mutation = 0
workflow invocation = 0
Solution experimental trials = 3
Turn 1 Cursor invocations ≤ 3
Turn 2 Cursor invocations ≤ 3
total Cursor process invocations ≤ 6
retry = 0
baseline reruns = 0
Turn 1 participant ceiling = 360000ms
Turn 2 participant ceiling = 120000ms
```

### 4.9 Prohibitions

Must not:

- modify production `runSolutionAgent()`;
- modify `runWorkspaceAgentJob()`;
- modify Cursor adapter;
- add production CandidateCheckpoint schema;
- modify Orchestrator;
- add formal Workflow Step;
- modify Shared Contract;
- modify current convergence discipline;
- modify Skill;
- modify production timeout;
- switch models;
- use a semantic candidate detector;
- hard tool-count kill;
- rerun baseline;
- retry;
- auto-enter implementation.

Experiment host lives under `.tmp/evolution/...` only (same pattern as matrix / gate spikes).

---

## 5. Recommended Approach (frozen)

**Host-enforced two-turn protocol with Agent-authored `CandidateCheckpointV1`**, Cursor Auto only. Turn 1 preserves production investigation / convergence / Skill / refs / Problem Package but **replaces** the SolutionWorkV1 terminal contract with CandidateCheckpointV1. Turn 2 same-thread resume restores SolutionWorkV1 terminal contract under prompt-level synthesis-only + observe tools.

Rejected for this spike:

- mid-stream host candidate detection / kill without Agent checkpoint;
- transcript-replay Turn 2;
- provider-level tool-permission engineering as the independent variable.

---

## 6. Next after Human acceptance of this design

1. Human ACCEPTED on this spec.
2. Then (only if requested): implementation plan for the `.tmp` spike host — still zero production mutation.
3. Execute spike under §4.8 budget.
4. Emit verdict + one next direction + STOP.

**This document does not authorize implementation by itself until Human acceptance and a subsequent plan/request.**
