# Two-Turn Solution Transition Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute a zero-production-mutation Cursor Auto A/B spike that replaces the single long Solution turn with `CandidateCheckpointV1` → same-thread `--resume` → synthesis-only `SolutionWorkV1`.

**Architecture:** All executable spike code/tests/artifacts live under `.tmp/evolution/cursor-two-turn-solution-transition-spike-20260824/`. The host imports current production prompt/contract/reference helpers read-only. Turn 1 derives from the current production Solution prompt by replacing only the terminal deliverable; Turn 2 resumes Cursor’s exact `system/init.session_id` in the same workspace and restores the normal Solution terminal contract.

**Tech Stack:** TypeScript, Node `child_process.spawn`, `tsx`, Cursor Agent CLI `stream-json`, existing `SolutionWorkV1`, repo-reference and Structured Final Output Contract helpers.

**Spec:** `docs/superpowers/specs/2026-08-24-two-turn-solution-transition-spike-design.md`

## Global Constraints

- Production mutation = `0`; config mutation = `0`; workflow invocation = `0`.
- New executable code/tests/runtime artifacts live only under `.tmp/evolution/cursor-two-turn-solution-transition-spike-20260824/`.
- Do not modify `runSolutionAgent`, `runWorkspaceAgentJob`, Cursor adapter, Orchestrator, Shared Contract V1, SolutionWorkV1, convergence discipline, Skill, production timeout, or provider config.
- Do not add a production CandidateCheckpoint schema or Workflow Step.
- Cursor binding = `auto` only. No Composer/Grok/Codex.
- Baseline Auto×3 is reused from `.tmp/evolution/cursor-real-solution-model-matrix-20260824/`; reruns = `0`.
- Turn 1 ceiling = `360000ms`; Turn 2 ceiling = `120000ms`; total Participant execution budget = `480000ms`.
- Retry = `0`.
- Turn 1 preserves production investigation/reasoning, convergence, Skills, refs, and Problem Package verbatim; only terminal-deliverable instructions change.
- Do not stack the prior Candidate Transition Gate.
- Turn 2 “no tools” is prompt policy + observation only; do not add provider-level tool restrictions or kill-on-tool.
- Same-thread continuity must use observed Cursor `system/init.session_id` + `--resume`; transcript replay is forbidden.
- Shared dirty checkout: do not reset/stash/clean/commit unrelated work.

---

## Files

Create only:

```text
.tmp/evolution/cursor-two-turn-solution-transition-spike-20260824/
  run-spike-host.ts
  run-spike-host.test.ts
  preflight-report.json
  experiment-binding.json
  case-binding.json
  baseline-reference.json
  production-prompt.txt
  turn-01-prompt-template.txt
  turn-02-prompt.txt
  prompt-diff.txt
  spike-summary.json
  spike-report.md
  trial-01/...
  trial-02/...
  trial-03/...
```

Read-only production dependencies:

```text
scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts
scripts/evolution/problemAgnosticSolution/repoReference.ts
scripts/evolution/problemAgnosticSolution/solutionParticipantSkills.ts
src/evolution/participantStructuredOutputContract.ts
src/evolution/solutionWorkContract.ts
src/evolution/problemPackageContract.ts
skills/repository-grounded-investigation/SKILL.md
```

Protected-file pre/post hashes must remain identical for:

```text
runSolutionAgent.ts
agentParticipant.ts
cursorAgentParticipant.ts
participantStructuredOutputContract.ts
solutionWorkContract.ts
repository-grounded-investigation/SKILL.md
```

---

### Task 1: Preflight and Evidence Binding

**Produces:** resume capability proof, exact case/baseline binding, protected-state baseline.  
**Participant invocations:** `0`.

- [ ] **1. Capture repository/protected baseline**

```bash
ROOT=.tmp/evolution/cursor-two-turn-solution-transition-spike-20260824
mkdir -p "$ROOT"

git status --porcelain=v1 > "$ROOT/repository-status-before.txt"

shasum -a 256 \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  src/evolution/participantStructuredOutputContract.ts \
  src/evolution/solutionWorkContract.ts \
  skills/repository-grounded-investigation/SKILL.md \
  > "$ROOT/protected-sha256-before.txt"
```

- [ ] **2. Capture local Cursor resume authority**

```bash
cursor --version > "$ROOT/cursor-version.txt"
cursor agent -v > "$ROOT/cursor-agent-version.txt" 2>&1 || true
cursor agent --help > "$ROOT/cursor-agent-help.txt"

grep -n -- '--resume' "$ROOT/cursor-agent-help.txt"
grep -n -- '--output-format' "$ROOT/cursor-agent-help.txt"
grep -n -- '--model' "$ROOT/cursor-agent-help.txt"
```

If specific-session `--resume` is unavailable: write `SPIKE_BLOCKED_BY_THREAD_RESUME_IDENTITY` and STOP before any Participant invocation.

- [ ] **3. Prove resumable identity from an existing stream, not a new call**

```bash
STREAM="$(
  find .tmp/evolution/cursor-native-event-stream-diagnostic-20260823 \
       .tmp/evolution/cursor-extended-completion-probe-20260823 \
       .tmp/evolution/cursor-real-solution-model-matrix-20260824 \
       -name native-stream.jsonl -type f -print 2>/dev/null | head -1
)"
test -n "$STREAM"

node --input-type=module - "$STREAM" <<'NODE'
import { readFileSync } from 'node:fs';
const path = process.argv[2];
const events = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
const init = events.find(e => e?.type === 'system' && e?.subtype === 'init');
if (!init || typeof init.session_id !== 'string' || !init.session_id) {
  throw new Error('system/init.session_id unavailable');
}
console.log(JSON.stringify({
  source: path,
  session_id: init.session_id,
  cwd: init.cwd ?? null,
  model: init.model ?? null,
}, null, 2));
NODE
```

Authority for resume identity is exactly `system/init.session_id`.

- [ ] **4. Bind the existing instance-012 baseline**

Read:

```text
.tmp/evolution/cursor-real-solution-model-matrix-20260824/case-binding.json
.tmp/evolution/cursor-real-solution-model-matrix-20260824/matrix-summary.json
.tmp/evolution/cursor-real-solution-model-matrix-20260824/run-matrix-host.ts
```

Confirm:

```text
historical root = problem-agnostic-agent-solution-loop-instance-012
problemPackageSha256 = 1141cc375270789dfdf31c65723e7d4fde380b8e04ecf0da8cf252ead264d182
Auto baseline = 3/3 TIMEOUT @480000ms
terminal results = 0/3
```

Compute and record the full current production/matrix prompt SHA and Skill SHA; do not use shortened SHA values in machine-readable files.

- [ ] **5. Write binding files**

`experiment-binding.json` must include:

```json
{
  "schemaVersion": "cursor-two-turn-solution-transition-experiment-binding-v1",
  "binding": "auto",
  "outputFormat": "stream-json",
  "retry": 0,
  "turn1TimeoutMs": 360000,
  "turn2TimeoutMs": 120000,
  "maxParticipantExecutionMs": 480000,
  "baselineReruns": 0,
  "productionMutationAllowed": false,
  "configMutationAllowed": false
}
```

Add observed executable/version fields.

`preflight-report.json` must include:

```json
{
  "resumeFlagSupported": true,
  "streamSessionIdObserved": true,
  "sessionIdField": "system/init.session_id",
  "terminalResultField": "result/success.result",
  "participantInvocations": 0,
  "preflightVerdict": "READY"
}
```

If either resume syntax or `session_id` observation fails, set verdict to `SPIKE_BLOCKED_BY_THREAD_RESUME_IDENTITY` and STOP.

---

### Task 2: Implement and Test Experimental Contracts/Prompt Transformation

**Files:** `run-spike-host.ts`, `run-spike-host.test.ts`  
**Participant invocations:** `0`.

**Interfaces:**

```ts
export interface CandidateCheckpointV1 {
  schemaVersion: 'solution-candidate-checkpoint-v1';
  problemId: string;
  status: 'READY_TO_SYNTHESIZE' | 'INSUFFICIENT_EVIDENCE';
  candidates: Array<{
    candidateId: string;
    mechanism: string;
    evidenceRefs: string[];
    remainingMaterialUnknowns: string[];
  }>;
}

export function parseCandidateCheckpoint(
  raw: string,
  expectedProblemId: string,
): CandidateCheckpointV1;

export async function validateCheckpointRepoRefs(
  checkpoint: CandidateCheckpointV1,
  workspaceRoot: string,
): Promise<void>;

export function buildTurn1Prompt(productionPrompt: string): string;
export function buildTurn2Prompt(): string;
```

- [ ] **1. Write failing parser tests**

Use valid fixtures for `READY_TO_SYNTHESIZE` and `INSUFFICIENT_EVIDENCE`.

Reject:

```text
unknown top-level key
unknown candidate key
wrong schemaVersion
wrong problemId
forbidden status
READY with 0 or >3 candidates
INSUFFICIENT with candidates
candidateId not /^candidate-\d{6}$/
duplicate candidateId
blank mechanism
empty/blank evidenceRefs
blank remainingMaterialUnknowns item
Markdown-fenced JSON
prose before JSON
multiple JSON payloads
```

- [ ] **2. Write failing prompt-control tests**

Generate the real current production prompt with `buildSolutionAgentPrompt()`.

For Turn 1 assert:

```ts
turn1Prompt.includes(
  renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionWorkV1' })
) === false;
```

and:

```text
SolutionCandidateCheckpointV1 present
CandidateCheckpointV1 is terminal result
INSUFFICIENT_EVIDENCE not a time-budget escape hatch
```

Extract the existing convergence section between:

```text
Convergence discipline (Solution work only):
```

and:

```text
Assigned Skills (working methods only; they do not grant authority):
```

Assert Turn 1 convergence text is byte-identical to production.

Also assert ref requirements, Skill text, and Problem Package tail are unchanged.

Turn 2 must contain:

```text
SYNTHESIS ONLY
zero to three options / valid negative outcome
SolutionWorkV1 contract
no new repository/shell/file/search/tool use
```

and must not reserialize the full Problem Package.

- [ ] **3. Run tests and verify failure**

```bash
npm exec -- tsx "$ROOT/run-spike-host.test.ts"
```

Expected: FAIL before helper implementation.

- [ ] **4. Implement strict `CandidateCheckpointV1` parsing**

Mechanical Host rules only:

```text
top exact keys: schemaVersion problemId status candidates
candidate exact keys: candidateId mechanism evidenceRefs remainingMaterialUnknowns
candidateId: /^candidate-\d{6}$/ and unique
mechanism: trimmed non-empty string
evidenceRefs: non-empty string array
remainingMaterialUnknowns: string array; entries non-empty; [] allowed
READY: 1..3 candidates
INSUFFICIENT: candidates=[]
problemId: exact trial-bound id
```

Use direct `JSON.parse(raw.trim())`. No fence stripping, brace search, normalization, or repair.

Validate every evidence ref with existing `assertRepoReferenceFile()` against the disposable workspace.

- [ ] **5. Implement deterministic Turn 1 prompt replacement**

Use an exact-once replacement helper.

Replace exactly:

```text
Return zero to three options or an explicit no-proposal/insufficient-evidence/escalate result.
```

with the experimental checkpoint terminal obligation.

Replace exactly the current:

```ts
renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionWorkV1' })
```

rendered block with:
1. compact `CandidateCheckpointV1` schema/Participant-semantic instructions;
2. `renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionCandidateCheckpointV1' })`.

Do not alter the convergence block or other production prompt content.

- [ ] **6. Implement Turn 2 prompt**

Short resume prompt only:

```text
investigation/verification turn complete
use CandidateCheckpointV1 + evidence already gathered in this thread
SYNTHESIS ONLY
do not reopen broad investigation
do not seek evidence only to increase confidence
do not call repository/shell/file/search/other tools
produce zero to three options or valid structured negative Solution outcome
Structured Final Output Contract V1 → SolutionWorkV1
```

- [ ] **7. Run tests**

```bash
npm exec -- tsx "$ROOT/run-spike-host.test.ts"
```

Expected: PASS.

Write:

```text
production-prompt.txt
turn-01-prompt-template.txt
turn-02-prompt.txt
prompt-diff.txt
```

`prompt-diff.txt` must show only terminal-deliverable/contract changes for Turn 1.

---

### Task 3: Implement and Test Cursor NDJSON Turn Runner

**Interfaces:**

```ts
export interface CursorEvent {
  type?: unknown;
  subtype?: unknown;
  session_id?: unknown;
  call_id?: unknown;
  result?: unknown;
  [key: string]: unknown;
}

export interface CursorTurnResult {
  terminalOutcome: 'completed' | 'timeout' | 'runtime_failure';
  elapsedMs: number;
  exitCode: number | null;
  events: CursorEvent[];
  sessionId: string | null;
  terminalPayload: string | null;
  toolCallCount: number;
  hadAnyToolEvent: boolean;
  stderr: string;
}
```

- [ ] **1. Write failing stream helper/runner tests**

Fixture:

```json
{"type":"system","subtype":"init","session_id":"session-123"}
{"type":"tool_call","subtype":"started","call_id":"tool-1","session_id":"session-123"}
{"type":"tool_call","subtype":"completed","call_id":"tool-1","session_id":"session-123"}
{"type":"result","subtype":"success","result":"{}","session_id":"session-123"}
```

Assert:
- session id = `session-123`;
- terminal payload = `{}`;
- distinct tool-call count = `1`;
- any tool event = true.

Reject conflicting session IDs and terminal success without string `.result`.

Use a fake spawned process to test:
- raw NDJSON persisted;
- stderr persisted;
- timeout returns `timeout`;
- malformed NDJSON returns runtime failure;
- resumed argv contains `--resume <session-id>` and the same `--workspace`.

- [ ] **2. Implement stream helpers**

Rules:

```text
session id = type=system, subtype=init, non-empty session_id
all non-empty event session_id values in one turn must match
terminal = type=result, subtype=success, string result
never derive terminal payload from assistant/thinking text
tool boundary violation = any type=tool_call event
toolCallCount = distinct call_id values; fallback to started-event count only if IDs absent
```

- [ ] **3. Implement `runCursorTurn()`**

Turn 1 argv conceptually:

```text
cursor agent
  --print
  --trust
  --force
  --output-format stream-json
  --model auto
  --workspace <trial-workspace>
  <prompt>
```

Turn 2 adds:

```text
--resume <Turn1 session_id>
```

and keeps the exact same workspace.

Use local `cursor agent --help` as final argv authority.

Do not use/modify production `cursorAgentArgs()`.

Persist each turn:

```text
native-stream.jsonl
stderr.txt
terminal-payload.txt (only if result/success.result exists)
event-summary.json
timing.json
```

Participant elapsed is spawn→close/timeout only.

- [ ] **4. Run unit tests**

```bash
npm exec -- tsx "$ROOT/run-spike-host.test.ts"
```

Expected: PASS.

---

### Task 4: Implement Trial Classification, Solution Validation, and Diagnostic Provenance

- [ ] **1. Write failing taxonomy tests**

Cover all Turn 1 primary outcomes:

```text
CHECKPOINT_READY
CHECKPOINT_INSUFFICIENT_EVIDENCE
CHECKPOINT_ENVELOPE_FAILURE
CHECKPOINT_SCHEMA_FAILURE
CHECKPOINT_TIMEOUT
CHECKPOINT_RUNTIME_FAILURE
```

Cover Turn 2:

```text
VALID_SOLUTION_COMPLETED
SOLUTION_ENVELOPE_FAILURE
SOLUTION_SCHEMA_FAILURE
SYNTHESIS_ONLY_TOOL_VIOLATION
SYNTHESIS_TIMEOUT
SYNTHESIS_RUNTIME_FAILURE
```

Precedence test:

```text
tool event + valid SolutionWorkV1
→ SYNTHESIS_ONLY_TOOL_VIOLATION
→ solutionValid=true
→ synthesisOnlyBoundaryRespected=false
```

- [ ] **2. Implement Turn 1 classification**

Order:

```text
timeout → CHECKPOINT_TIMEOUT
runtime/stream failure → CHECKPOINT_RUNTIME_FAILURE
successful process without terminal result → CHECKPOINT_RUNTIME_FAILURE
non-bare/invalid JSON terminal → CHECKPOINT_ENVELOPE_FAILURE
valid JSON but checkpoint/problem/ref rules invalid → CHECKPOINT_SCHEMA_FAILURE
valid INSUFFICIENT → CHECKPOINT_INSUFFICIENT_EVIDENCE; no Turn2
valid READY → CHECKPOINT_READY
```

For timeout, also record:
- last tool time;
- broad-exploration evidence if mechanically recoverable;
- terminalization evidence.

Timeout alone must not decide final spike verdict.

- [ ] **3. Validate Turn 2 `SolutionWorkV1` strictly**

Use production:

```ts
parseSolutionWork()
assertRepoReferenceFile()
```

Validate root + option repoRefs and current artifactRef authority exactly as `runSolutionAgent()` does.

Require:

```text
final.problemId === bound Problem Package problemId
```

No repair.

- [ ] **4. Implement Turn 2 precedence/resume continuity**

Require resumed Turn 2 session identity to equal Turn 1 session identity.

Any Turn 2 `tool_call` event:

```text
primary = SYNTHESIS_ONLY_TOOL_VIOLATION
```

while separately retaining:

```text
solutionValid
envelopeValid
terminalOutcome
toolCallCount
synthesisOnlyBoundaryRespected=false
```

- [ ] **5. Implement diagnostic-only provenance**

Record:

```text
final.problemId === checkpoint.problemId === bound problemId
final repoRefs ∩ checkpoint evidenceRefs
final repoRefs ∩ mechanically extractable Turn1 tool paths
artifactRef validation
```

If full mapping cannot be established:

```text
FINAL_CHECKPOINT_PROVENANCE = PARTIALLY_OBSERVABLE
```

This is not a schema/success gate.

- [ ] **6. Run tests**

```bash
npm exec -- tsx "$ROOT/run-spike-host.test.ts"
```

Expected: PASS.

---

### Task 5: Execute B Group — Two-Turn Auto ×3

**Maximum Cursor process invocations:** `6`  
**Retry:** `0`.

- [ ] **1. Reuse sealed workspace construction from prior matrix**

Read:

```text
.tmp/evolution/cursor-real-solution-model-matrix-20260824/run-matrix-host.ts
.tmp/evolution/cursor-real-solution-model-matrix-20260824/case-binding.json
```

Copy only its sealed instance-012 binding/fresh disposable-workspace construction into the new `.tmp` host.

Do not copy model-matrix sequencing or single-turn invocation logic.

Create independent:

```text
trial-01/workspace
trial-02/workspace
trial-03/workspace
```

- [ ] **2. Freeze Turn 1 prompt per trial**

For each trial:
1. load the same Problem Package;
2. load the same delivered Skill assignment;
3. call current `buildSolutionAgentPrompt()`;
4. assert its SHA equals the Task 1 experiment binding;
5. derive Turn 1 prompt.

If prompt SHA drifts, STOP with `OBSERVATION_INSUFFICIENT` before that Participant invocation.

- [ ] **3. Run Turn 1 serially**

For Trial 1 → 2 → 3:

```text
model = auto
timeout = 360000ms
retry = 0
```

After each:
- classify;
- persist strict-valid `checkpoint.json`;
- if INSUFFICIENT or failure/timeout → no Turn 2;
- if READY → continue;
- never retry.

- [ ] **4. Measure Host transition overhead**

For READY trials:

```text
hostTransitionOverheadMs
= Turn2 spawn-start - Turn1 process-end
```

Keep separate from Participant execution.

- [ ] **5. Resume Turn 2**

Use exactly:

```text
same workspace
same Turn1 session_id
model=auto
timeout=120000ms
retry=0
```

No Turn 2 unless strict READY.

Do not kill on tool use; observe to terminal/120s.

- [ ] **6. Write `trial-summary.json`**

At minimum:

```text
trialId
turn1Outcome
checkpointCompleted
checkpointElapsedMs
checkpointValid
candidateCount
turn2Started
turn2Outcome
turn2ToolCallCount
solutionValid
synthesisOnlyBoundaryRespected
participantExecutionMs
hostTransitionOverheadMs
trialWallClockMs
provenanceObservation
```

- [ ] **7. After each trial, check production mutation**

Compare protected hashes/status with Task 1.

New `.tmp` files are allowed. Any task-authored non-`.tmp` mutation is a structural blocker: STOP and report `OBSERVATION_INSUFFICIENT`; do not reset/repair automatically.

---

### Task 6: Aggregate Verdict and STOP

- [ ] **1. Build A/B table**

At least:

| Trial | Checkpoint | T1 elapsed | Candidates | T2 started | T2 tools | Final valid | Participant ms | Host overhead | Wall-clock |
|---|---|---:|---:|---|---:|---|---:|---:|---:|

Then reused baseline:

```text
Auto single-turn:
3/3 TIMEOUT @480000ms participant ceiling
0/3 terminal result
baseline reruns = 0
```

- [ ] **2. Compute counts/timing**

Report:

```text
valid checkpoint /3
INSUFFICIENT /3
Turn2 started /3
valid final /3
zero-tool Turn2 / started
tool violations / started
resume failures / started
```

Plus median/range:
- Turn 1 Participant elapsed;
- Turn 2 Participant elapsed;
- total Participant execution;
- Host transition overhead;
- wall-clock.

- [ ] **3. Apply §1 timeout interpretation**

For Turn 1 timeouts, report:
- near-ceiling tool activity;
- broad exploration stopped/not stopped if mechanically observable;
- terminalization signs.

Do not infer `NOT_ENFORCEABLE` from timeout count alone.

- [ ] **4. Choose exactly one allowed verdict**

Only:

```text
HOST_ENFORCED_SOLUTION_TURN_BOUNDARY_EFFECTIVE
HOST_ENFORCED_SOLUTION_TURN_BOUNDARY_PROMISING_BUT_INCOMPLETE
CANDIDATE_CHECKPOINT_NOT_ENFORCEABLE_BY_PROMPT
CANDIDATE_CHECKPOINT_PREMATURE_CONVERGENCE
CURSOR_THREAD_RESUME_NOT_RELIABLE
SPIKE_BLOCKED_BY_THREAD_RESUME_IDENTITY
OBSERVATION_INSUFFICIENT
```

Strong positive requires:
- valid checkpoint 3/3;
- valid final `SolutionWorkV1` ≥2/3;
- most successful Turn 2s use zero tools;
- execution dynamics clearly improve vs baseline.

- [ ] **5. Recommend exactly one next direction**

Do not execute it.

- [ ] **6. Final protected-state verification**

```bash
shasum -a 256 \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  src/evolution/participantStructuredOutputContract.ts \
  src/evolution/solutionWorkContract.ts \
  skills/repository-grounded-investigation/SKILL.md \
  > "$ROOT/protected-sha256-after.txt"

diff -u "$ROOT/protected-sha256-before.txt" "$ROOT/protected-sha256-after.txt"

git status --porcelain=v1 > "$ROOT/repository-status-after.txt"
```

- [ ] **7. Final unit-test pass**

```bash
npm exec -- tsx "$ROOT/run-spike-host.test.ts"
```

Expected: PASS.

- [ ] **8. Write `spike-summary.json` + `spike-report.md` and STOP**

Final report includes:
1. spike status + one allowed verdict;
2. exact instance-012 SHA;
3. Cursor CLI version;
4. resume identity/continuity;
5. baseline reused/no rerun;
6. 3-trial table;
7. Turn 1/Turn 2 outcome counts;
8. checkpoint/final validity;
9. tool violations;
10. Participant vs Host timing;
11. timeout interpretation;
12. provenance diagnostics;
13. what is/is not proved;
14. exactly one next direction;
15. deviations;
16. budget confirmation.

Budget block:

```text
production mutation = 0
config mutation = 0
workflow invocation = 0
Solution experimental trials = 3
Turn 1 Cursor invocations <= 3
Turn 2 Cursor invocations <= 3
total Cursor process invocations <= 6
retry = 0
baseline reruns = 0
Turn 1 participant ceiling = 360000ms
Turn 2 participant ceiling = 120000ms
```

Then STOP. Do not productize automatically.

---

## Plan Self-Review

**Spec coverage:** same-Role two-turn boundary, CandidateCheckpointV1, terminal-only Turn 1 replacement, Shared Contract reuse, 360/120 budgets, session resume, no-tool observation, strict outcomes, diagnostic provenance, baseline reuse, verdict/STOP and zero production mutation are all mapped to tasks.

**Placeholder scan:** no TBD/TODO or repair/transcript-replay escape hatch. Runtime-discovered values are explicitly read from existing local authority rather than guessed.

**Interface consistency:** `system/init.session_id` is the only resume identity; `result/success.result` is the terminal payload; Turn 1 uses experimental `SolutionCandidateCheckpointV1`; Turn 2 restores `SolutionWorkV1`; same workspace is used across resume.

**Scope:** `.tmp` standalone spike only. No product code/schema/adapter/workflow changes.
