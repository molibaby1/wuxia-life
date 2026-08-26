# Envelope Failure Bounded Retransmission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one bounded, same-thread retransmission for Solution terminal `ENVELOPE_FAILURE` while keeping `SCHEMA_FAILURE` fail-closed, preserving both terminal attempts in provenance, and leaving the Orchestrator/workflow shape unchanged.

**Architecture:** Introduce one authoritative whole-payload JSON envelope validator, add an opaque same-thread continuation capability to the workspace Participant abstraction, and expose Cursor continuation by parsing `stream-json` only on Solution executions. A Role-neutral structured Participant execution helper owns the state machine: initial execution → envelope validation → schema validation → optional one 60s same-thread retransmission → second validation. `runSolutionAgent()` is the only initial Role caller; Reviewer and Configuration Execution retain their current fail-closed behavior. Execution Trace and Operational Report observe recovery but never control it.

**Tech Stack:** TypeScript, Node.js `child_process`, existing Cursor Agent CLI, `tsx`, Node `assert`, existing Auto Evolution Solution contracts, provenance helpers, Operational Run Report.

**Spec:** `docs/superpowers/specs/2026-08-24-envelope-failure-bounded-retransmission-design.md`

## Global Constraints

- Layer: **Participant Communication Contract — Minimal Slice #2**.
- Full Participant Communication Contract P3 remains **DEFERRED**.
- Trigger is terminal **`ENVELOPE_FAILURE` only**.
- Maximum envelope retransmissions per Role execution: **1**.
- Retransmission must continue the **exact same Participant thread**.
- `SCHEMA_FAILURE` is never retransmitted in this slice.
- Host extraction, normalization, canonicalization, field repair, embedded-JSON recovery, and semantic feedback are forbidden.
- Pretty-printed JSON and all legal insignificant JSON whitespace are valid envelope content.
- Do not introduce `trimmed === JSON.stringify(parsed)` or any equivalent compact/canonical serialization rule.
- Initial Role rollout: **Solution only**.
- Initial provider implementation: **Cursor**, behind a provider-agnostic opaque thread reference.
- Reviewer, Configuration Execution, Feedback, and Hypothesis retransmission remain disabled.
- Initial Solution participant timeout remains unchanged.
- Envelope retransmission timeout is exactly **60_000ms** and is an additional bounded communication-recovery allowance, not a reasoning-budget reset.
- No second retransmission, fresh-session fallback, transcript replay, provider switching, tool enforcement, global deadline allocator, generic retry subsystem, Orchestrator Step, or Role decomposition.
- Retransmission prompt is communication-only and does not replay Problem Package, Skill content, previous terminal payload, or extracted JSON.
- Report remains sidecar-only; Report failure must not change retransmission behavior.
- First-pass structured-output quality and post-recovery final success must remain separately observable.
- Existing `actualParticipantJobs` accounting remains Role-based; an internal retransmission does **not** increment Orchestrator participant-job count.
- Existing dirty worktree state must not be reset, stashed, cleaned, or attributed to this task.
- In the current shared dirty checkout, **do not commit unless the Human explicitly authorizes repository commits**. End each task with a scoped diff checkpoint instead.
- If implementation requires any STOP-boundary item from the accepted spec, STOP and return to design before coding it.

---

## Repository Calibration

Current relevant authority in the accepted repository snapshot:

- `src/evolution/participantStructuredOutputContract.ts` renders Shared Structured Final Output Contract V1 and does not require compact/canonical JSON.
- `src/evolution/solutionWorkContract.ts` already exports both `validateSolutionWork(value)` and `parseSolutionWork(raw)`.
- `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts` currently calls `runWorkspaceAgentJob()` once, writes `raw-output.txt`, parses `job.rawOutput.trim()`, validates problemId/references, and seals `result.json`.
- `scripts/evolution/problemAgnosticSolution/agentParticipant.ts` currently owns generic process execution, 240s default timeout, and `participant-execution-trace-v1` process/output activity tracing.
- `scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts` currently uses Cursor text output and does not expose `session_id`/`--resume`.
- Only Solution currently writes `solution-agent/execution-trace.json`; Reviewer and Configuration Execution do not.
- `scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts` counts Solution as participant job 3 and Reviewer as participant job 4. The retransmission must not alter those counts.
- `scripts/evolution/reporting/buildOperationalRunReport.ts` is sidecar-only and currently does not summarize structured-terminal recovery.
- `docs/governance/current-product-stage.md` currently records P3 Minimal Slice #1 only and keeps full P3 deferred.

If the execution checkout differs materially from these facts, STOP and reconcile repository authority before implementing.

---

## File Structure

### Create

- `src/evolution/structuredTerminalEnvelope.ts`  
  Authoritative whole-terminal envelope validator. No Role/provider/retransmission logic.

- `scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts`  
  Solution rollout policy, 60s constant, deterministic coarse NACK renderer, recovery outcome types.

- `scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts`  
  Role-neutral bounded state machine, attempt-artifact preservation, aggregate communication trace.

- `tests/evolution/structuredTerminalEnvelope.test.ts`  
  Regression tests for legal whitespace and forbidden wrappers/extra content.

- `tests/evolution/cursorAgentParticipant.test.ts`  
  Cursor Solution stream-json/session/ref/continuation tests without invoking Cursor.

- `tests/evolution/envelopeRetransmission.test.ts`  
  Renderer, policy, and fake-Participant state-machine tests.

### Modify

- `scripts/evolution/problemAgnosticSolution/agentParticipant.ts`  
  Add opaque thread ref, completed-output interpretation hook, same-thread continuation primitive, in-memory trace return, and narrow trace event extensions.

- `scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts`  
  Solution-only `stream-json` transport interpretation and `--resume` continuation capability. Reviewer/config paths remain text mode.

- `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`  
  Replace one-shot parse path with structured Participant execution helper; preserve existing Solution prompt/reasoning/reference authority.

- `tests/evolution/agentParticipant.test.ts`  
  Generic continuation/interpreter/trace primitive tests.

- `tests/evolution/solutionAgentLoop.test.ts`  
  Solution-only recovery behavior, no-schema-retry, max-one retransmission, artifacts/trace tests.

- `scripts/evolution/reporting/buildOperationalRunReport.ts`  
  Read execution-trace communication observations and render sidecar terminal-delivery summary/metrics.

- `tests/evolution/operationalRunReport.test.ts`  
  Report recovered/fail-closed examples and first-pass/final counts.

- `docs/governance/current-product-stage.md`  
  After engineering verification only: record Minimal Slice #2 as `ENGINEERING DELIVERED / RUNTIME CONFORMANCE UNVERIFIED`; keep overall RUN / OBSERVE and full P3 deferred.

### Runtime observation only — do not commit

- `.tmp/evolution/envelope-failure-bounded-retransmission-runtime-conformance-20260824/`
  - controlled fault-injection host;
  - provider-health evidence;
  - three serial Cursor Solution trials;
  - runtime report and protected-file hashes.

### Must remain unchanged

- `src/evolution/solutionWorkContract.ts`
- `src/evolution/solutionReviewContract.ts`
- `src/evolution/problemPackageContract.ts`
- `src/evolution/participantStructuredOutputContract.ts` contract wording
- `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts` retransmission behavior
- `scripts/evolution/configurationExecutionParticipant.ts` retransmission behavior
- `scripts/evolution/problemAgnosticSolution/solutionParticipantSkills.ts`
- `skills/repository-grounded-investigation/SKILL.md`
- Orchestrator workflow structure and participant-job accounting
- provider/model routing
- Solution reasoning/convergence prompt
- Role schemas
- Full P3 governance status

---

# Task 1: Add the Authoritative Structured Terminal Envelope Validator

**Files:**
- Create: `src/evolution/structuredTerminalEnvelope.ts`
- Create/Test: `tests/evolution/structuredTerminalEnvelope.test.ts`

**Interfaces:**

Produces:

```ts
export type StructuredTerminalEnvelopeFailureReason =
  | 'EMPTY'
  | 'INVALID_JSON'
  | 'NON_OBJECT_ROOT';

export type StructuredTerminalEnvelopeValidation =
  | {
      ok: true;
      parsedObject: Record<string, unknown>;
    }
  | {
      ok: false;
      failureClass: 'ENVELOPE_FAILURE';
      reason: StructuredTerminalEnvelopeFailureReason;
    };

export function validateStructuredTerminalEnvelope(
  raw: string,
): StructuredTerminalEnvelopeValidation;
```

Notes:
- The accepted design lists more precise diagnostic reasons as optional/suggested. V1 implementation intentionally emits only reasons that are mechanically reliable without substring extraction.
- Prose/fence/multiple-object/trailing-garbage cases may all map to `INVALID_JSON`. That is sufficient for eligibility because Participant-facing NACK remains coarse `ENVELOPE_FAILURE`.

- [ ] **Step 1: Write the failing valid-whitespace tests**

Create `tests/evolution/structuredTerminalEnvelope.test.ts` with:

```ts
import assert from 'node:assert/strict';
import { validateStructuredTerminalEnvelope } from '../../src/evolution/structuredTerminalEnvelope';

export async function runStructuredTerminalEnvelopeTests(): Promise<void> {
  for (const raw of [
    '{"a":1}',
    '{\n  "a": 1\n}',
    '\n  {\n    "a": 1\n  }\n',
  ]) {
    const result = validateStructuredTerminalEnvelope(raw);
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok ? result.parsedObject : undefined, { a: 1 });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runStructuredTerminalEnvelopeTests()
    .then(() => console.log('structuredTerminalEnvelope.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
```

- [ ] **Step 2: Add failing invalid-envelope cases**

In the same test, add:

```ts
  for (const raw of [
    '',
    'Here is the result:\n{"a":1}',
    '```json\n{"a":1}\n```',
    '{"a":1}\nextra',
    '{"a":1}\n{"b":2}',
    '[]',
    '"text"',
    'null',
  ]) {
    assert.equal(validateStructuredTerminalEnvelope(raw).ok, false);
  }

  assert.deepEqual(validateStructuredTerminalEnvelope('   '), {
    ok: false,
    failureClass: 'ENVELOPE_FAILURE',
    reason: 'EMPTY',
  });

  assert.deepEqual(validateStructuredTerminalEnvelope('[]'), {
    ok: false,
    failureClass: 'ENVELOPE_FAILURE',
    reason: 'NON_OBJECT_ROOT',
  });
```

Do not add any `JSON.stringify(parsed)` comparison.

- [ ] **Step 3: Run the test and verify it fails because the module does not exist**

Run:

```bash
npm exec -- tsx tests/evolution/structuredTerminalEnvelope.test.ts
```

Expected: FAIL at module resolution.

- [ ] **Step 4: Implement the minimal validator**

Create `src/evolution/structuredTerminalEnvelope.ts`:

```ts
export type StructuredTerminalEnvelopeFailureReason =
  | 'EMPTY'
  | 'INVALID_JSON'
  | 'NON_OBJECT_ROOT';

export type StructuredTerminalEnvelopeValidation =
  | {
      ok: true;
      parsedObject: Record<string, unknown>;
    }
  | {
      ok: false;
      failureClass: 'ENVELOPE_FAILURE';
      reason: StructuredTerminalEnvelopeFailureReason;
    };

export function validateStructuredTerminalEnvelope(
  raw: string,
): StructuredTerminalEnvelopeValidation {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      failureClass: 'ENVELOPE_FAILURE',
      reason: 'EMPTY',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return {
      ok: false,
      failureClass: 'ENVELOPE_FAILURE',
      reason: 'INVALID_JSON',
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      failureClass: 'ENVELOPE_FAILURE',
      reason: 'NON_OBJECT_ROOT',
    };
  }

  return {
    ok: true,
    parsedObject: parsed as Record<string, unknown>,
  };
}
```

Do not inspect substrings inside an invalid payload.

- [ ] **Step 5: Run validator tests**

Run:

```bash
npm exec -- tsx tests/evolution/structuredTerminalEnvelope.test.ts
```

Expected:

```text
structuredTerminalEnvelope.test.ts: ok
```

- [ ] **Step 6: Run existing structured-output contract tests**

Run:

```bash
npm exec -- tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: all PASS; no existing Role behavior has changed.

- [ ] **Step 7: Scoped diff checkpoint**

Run:

```bash
git diff --check -- \
  src/evolution/structuredTerminalEnvelope.ts \
  tests/evolution/structuredTerminalEnvelope.test.ts

git diff -- \
  src/evolution/structuredTerminalEnvelope.ts \
  tests/evolution/structuredTerminalEnvelope.test.ts
```

Expected: only the authority validator and its regression tests.

Do not commit unless separately authorized.

---

# Task 2: Add Opaque Same-Thread Continuation to the Generic Workspace Participant Runtime

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/agentParticipant.ts`
- Modify/Test: `tests/evolution/agentParticipant.test.ts`

**Interfaces:**

Extend `agentParticipant.ts` with:

```ts
export interface ParticipantThreadRef {
  provider: string;
  opaqueId: string;
}

export type WorkspaceAgentOutputInterpretation =
  | {
      ok: true;
      rawOutput: string;
      threadRef?: ParticipantThreadRef;
    }
  | {
      ok: false;
      errorKind: 'invalid_output' | 'continuation';
      message: string;
    };

export interface WorkspaceAgentSameThreadContinuation {
  provider: string;
  buildArgs: (
    input: WorkspaceAgentJobInput,
    threadRef: ParticipantThreadRef,
  ) => string[];
}

export interface WorkspaceAgentCompletedOutputInput {
  job: WorkspaceAgentJobInput;
  stdout: string;
  stderr: string;
  expectedThreadRef?: ParticipantThreadRef;
}
```

Extend options:

```ts
interpretCompletedOutput?: (
  input: WorkspaceAgentCompletedOutputInput,
) => WorkspaceAgentOutputInterpretation;

sameThreadContinuation?: WorkspaceAgentSameThreadContinuation;
```

Extend job result:
- success carries optional `threadRef`;
- success/failure both carry `executionTrace`;
- `WorkspaceAgentJobFailure['errorKind']` adds `'continuation'`.

Add:

```ts
export async function runWorkspaceAgentContinuation(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  threadRef: ParticipantThreadRef,
  timeoutMs: number,
): Promise<WorkspaceAgentJobResult>;
```

- [ ] **Step 1: Add failing success-result trace assertions**

In `tests/evolution/agentParticipant.test.ts`, after the first successful `runWorkspaceAgentJob()` call, add:

```ts
  assert.equal(success.ok, true);
  assert.equal(success.executionTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.equal(success.executionTrace.terminal.outcome, 'completed');
```

The trace artifact assertions already present must continue to pass.

- [ ] **Step 2: Add a failing completed-output interpreter test**

Add a job with:

```ts
  const interpreted = await runWorkspaceAgentJob(
    traceInput('solution-interpreted'),
    {
      executable: process.execPath,
      buildArgs: () => [
        '-e',
        'process.stdout.write("transport-envelope");',
      ],
      interpretCompletedOutput: ({ stdout }) => ({
        ok: true,
        rawOutput: `terminal:${stdout}`,
        threadRef: {
          provider: 'test-provider',
          opaqueId: 'thread-000001',
        },
      }),
    },
  );

  assert.equal(interpreted.ok, true);
  if (interpreted.ok) {
    assert.equal(interpreted.rawOutput, 'terminal:transport-envelope');
    assert.deepEqual(interpreted.threadRef, {
      provider: 'test-provider',
      opaqueId: 'thread-000001',
    });
  }
```

- [ ] **Step 3: Add failing interpreter-rejection test**

```ts
  const rejectedInterpretation = await runWorkspaceAgentJob(
    traceInput('solution-interpreter-reject'),
    {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("bad-transport");'],
      interpretCompletedOutput: () => ({
        ok: false,
        errorKind: 'invalid_output',
        message: 'terminal result missing',
      }),
    },
  );

  assert.equal(rejectedInterpretation.ok, false);
  assert.equal(
    rejectedInterpretation.ok ? undefined : rejectedInterpretation.errorKind,
    'invalid_output',
  );
```

- [ ] **Step 4: Add failing same-thread continuation tests**

Import `runWorkspaceAgentContinuation`.

Create a participant:

```ts
  const continuationParticipant = {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write("initial")'],
    interpretCompletedOutput: ({
      stdout,
      expectedThreadRef,
    }: {
      stdout: string;
      expectedThreadRef?: { provider: string; opaqueId: string };
    }) => ({
      ok: true as const,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? {
        provider: 'test-provider',
        opaqueId: 'thread-000001',
      },
    }),
    sameThreadContinuation: {
      provider: 'test-provider',
      buildArgs: (
        _job: WorkspaceAgentJobInput,
        threadRef: { provider: string; opaqueId: string },
      ) => [
        '-e',
        'process.stdout.write(process.argv[1]);',
        `continued:${threadRef.opaqueId}`,
      ],
    },
  };
```

Run:

```ts
  const continued = await runWorkspaceAgentContinuation(
    {
      ...input,
      invocationRef: 'solution-continuation',
      workspaceRoot,
      prompt: 'Re-emit only.',
    },
    continuationParticipant,
    {
      provider: 'test-provider',
      opaqueId: 'thread-000001',
    },
    60_000,
  );

  assert.equal(continued.ok, true);
  assert.equal(
    continued.ok ? continued.rawOutput : undefined,
    'continued:thread-000001',
  );
```

Also assert provider mismatch fails without spawning:

```ts
  let mismatchSpawnCount = 0;
  const mismatch = await runWorkspaceAgentContinuation(
    {
      ...input,
      invocationRef: 'solution-continuation-mismatch',
      workspaceRoot,
      prompt: 'Re-emit only.',
    },
    {
      ...continuationParticipant,
      spawnProcess: ((...args: Parameters<typeof spawn>) => {
        mismatchSpawnCount += 1;
        return spawn(...args);
      }) as typeof spawn,
    },
    {
      provider: 'other-provider',
      opaqueId: 'thread-000001',
    },
    60_000,
  );

  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.ok ? undefined : mismatch.errorKind, 'continuation');
  assert.equal(mismatchSpawnCount, 0);
```

- [ ] **Step 5: Run tests and verify failure**

Run:

```bash
npm exec -- tsx tests/evolution/agentParticipant.test.ts
```

Expected: FAIL because the new types/functions/result fields do not exist yet.

- [ ] **Step 6: Refactor process execution behind one internal helper**

In `agentParticipant.ts`, keep public `runWorkspaceAgentJob()` behavior, but move the spawn body to an internal helper shaped like:

```ts
async function runWorkspaceAgentProcess(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  execution: {
    timeoutMs: number;
    buildArgs: () => string[];
    expectedThreadRef?: ParticipantThreadRef;
  },
): Promise<WorkspaceAgentJobResult> {
  // existing spawn/timeout/output-activity logic
}
```

`runWorkspaceAgentJob()` calls it using current `options.buildArgs(input)` and the existing default timeout.

`runWorkspaceAgentContinuation()`:
1. checks `options.sameThreadContinuation`;
2. checks provider equality;
3. calls the same internal process helper with the exact passed `timeoutMs`;
4. uses `sameThreadContinuation.buildArgs(input, threadRef)`;
5. passes `expectedThreadRef` into output interpretation.

Do not add retry.

- [ ] **Step 7: Interpret completed output only after exit code 0**

On process code `0`:
1. if no `interpretCompletedOutput`, preserve current `rawOutput = stdout`;
2. otherwise call it with `{ job, stdout, stderr, expectedThreadRef }`;
3. interpretation failure becomes job failure without any Role/schema parsing;
4. interpretation success returns the interpreted terminal `rawOutput` and optional opaque `threadRef`.

Do not combine stderr into a successful terminal payload.

- [ ] **Step 8: Return the in-memory process trace**

Keep existing create-only trace artifact behavior unchanged when `traceArtifactPath` is supplied, but also return the final `ParticipantExecutionTraceV1` on all job results.

Do not change the existing `participant-execution-trace-v1` schemaVersion in this task.

- [ ] **Step 9: Run participant tests**

Run:

```bash
npm exec -- tsx tests/evolution/agentParticipant.test.ts
```

Expected:

```text
agentParticipant.test.ts: ok
```

- [ ] **Step 10: Run Reviewer/Configuration regressions**

Run:

```bash
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: PASS; generic runtime additions are behavior-neutral without adapter capability.

- [ ] **Step 11: Scoped diff checkpoint**

```bash
git diff --check -- \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  tests/evolution/agentParticipant.test.ts

git diff -- \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  tests/evolution/agentParticipant.test.ts
```

Do not commit unless separately authorized.

---

# Task 3: Expose Cursor Solution Same-Thread Continuation Without Changing Other Roles

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts`
- Create/Test: `tests/evolution/cursorAgentParticipant.test.ts`

**Interfaces:**

Add exported Cursor stream interpreter:

```ts
export function interpretCursorCompletedOutput(input: {
  job: WorkspaceAgentJobInput;
  stdout: string;
  expectedThreadRef?: ParticipantThreadRef;
}): WorkspaceAgentOutputInterpretation;
```

Behavior:
- `job.role !== 'solution'` and no continuation → return raw text unchanged, no threadRef.
- Solution initial/continuation → parse Cursor NDJSON.
- thread ref source is only `type='system'`, `subtype='init'`, non-empty `session_id`.
- terminal payload source is only `type='result'`, `subtype='success'`, string `result`.
- continuation must observe the same `session_id` as `expectedThreadRef.opaqueId`.
- do not extract JSON from assistant/thinking events.

- [ ] **Step 1: Write failing initial Solution argv test**

Create `tests/evolution/cursorAgentParticipant.test.ts` and assert:

```ts
import assert from 'node:assert/strict';
import {
  createCursorAgentParticipant,
  cursorAgentArgs,
  interpretCursorCompletedOutput,
} from '../../scripts/evolution/problemAgnosticSolution/cursorAgentParticipant';

const solutionInput = {
  invocationRef: 'solution-agent-000001',
  role: 'solution' as const,
  workspaceRoot: '/tmp/workspace',
  prompt: 'Return structured output.',
};

export async function runCursorAgentParticipantTests(): Promise<void> {
  const args = cursorAgentArgs(solutionInput);

  assert.deepEqual(args.slice(0, 4), [
    'agent',
    '--print',
    '--trust',
    '--force',
  ]);
  assert.ok(args.includes('--output-format'));
  assert.ok(args.includes('stream-json'));
  assert.ok(args.includes('--workspace'));
  assert.equal(args.at(-1), solutionInput.prompt);
  assert.equal(args.includes('--resume'), false);
}
```

Do not assert or introduce `--model auto`; current production adapter does not bind a model and this slice must preserve model/binding semantics.

- [ ] **Step 2: Add Reviewer text-mode preservation test**

```ts
  const reviewerArgs = cursorAgentArgs({
    ...solutionInput,
    role: 'reviewer',
  });

  assert.equal(reviewerArgs.includes('--output-format'), false);
  assert.equal(reviewerArgs.includes('--resume'), false);
```

This locks initial rollout transport changes to Solution.

- [ ] **Step 3: Add failing stream interpretation tests**

Use:

```ts
  const stream = [
    JSON.stringify({
      type: 'system',
      subtype: 'init',
      session_id: 'session-123',
    }),
    JSON.stringify({
      type: 'assistant',
      subtype: 'message',
      text: 'thinking is not terminal authority',
      session_id: 'session-123',
    }),
    JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: '{"schemaVersion":"solution-work-v1"}',
      session_id: 'session-123',
    }),
    '',
  ].join('\n');

  const interpreted = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: stream,
  });

  assert.deepEqual(interpreted, {
    ok: true,
    rawOutput: '{"schemaVersion":"solution-work-v1"}',
    threadRef: {
      provider: 'cursor',
      opaqueId: 'session-123',
    },
  });
```

Add cases:
- missing `system/init.session_id` → `invalid_output`;
- missing `result/success.result` → `invalid_output`;
- malformed NDJSON → `invalid_output`;
- expected thread `session-123`, resumed stream reports `session-999` → `continuation`;
- all non-empty event `session_id` values must match the init session when present.

- [ ] **Step 4: Add failing continuation argv test**

```ts
  const participant = createCursorAgentParticipant({
    cursorExecutable: 'cursor',
  });

  assert.equal(participant.sameThreadContinuation?.provider, 'cursor');

  const resumeArgs = participant.sameThreadContinuation?.buildArgs(
    solutionInput,
    {
      provider: 'cursor',
      opaqueId: 'session-123',
    },
  );

  assert.ok(resumeArgs?.includes('--resume'));
  assert.ok(resumeArgs?.includes('session-123'));
  assert.ok(resumeArgs?.includes('--output-format'));
  assert.ok(resumeArgs?.includes('stream-json'));
  assert.ok(resumeArgs?.includes('--workspace'));
  assert.ok(resumeArgs?.includes(solutionInput.workspaceRoot));
  assert.equal(resumeArgs?.at(-1), solutionInput.prompt);
```

- [ ] **Step 5: Run tests and verify failure**

```bash
npm exec -- tsx tests/evolution/cursorAgentParticipant.test.ts
```

Expected: FAIL because Solution stream-json/continuation interpretation is not implemented.

- [ ] **Step 6: Make `cursorAgentArgs()` Role-aware**

Change its input to `WorkspaceAgentJobInput`.

For Solution, return:

```ts
[
  'agent',
  '--print',
  '--trust',
  '--force',
  '--output-format',
  'stream-json',
  '--workspace',
  input.workspaceRoot,
  input.prompt,
]
```

For all other Roles, preserve the current exact text-mode argv:

```ts
[
  'agent',
  '--print',
  '--trust',
  '--force',
  '--workspace',
  input.workspaceRoot,
  input.prompt,
]
```

- [ ] **Step 7: Implement strict Cursor stream interpretation**

Parse every non-empty stdout line with `JSON.parse`.

Do not use OCR/text extraction/string brace search.

Initial Solution success requires:
- exactly one reliable init session identity;
- one final successful `result` event with string `.result`.

Use the final successful result event if the stream contains non-terminal prior events.

Return:

```ts
{
  ok: true,
  rawOutput: result.result,
  threadRef: {
    provider: 'cursor',
    opaqueId: sessionId,
  },
}
```

For expected-thread continuation, identity mismatch returns:

```ts
{
  ok: false,
  errorKind: 'continuation',
  message: 'Cursor resumed session identity does not match the requested Participant thread',
}
```

- [ ] **Step 8: Add the generic same-thread capability to `createCursorAgentParticipant()`**

Return:
- `interpretCompletedOutput: interpretCursorCompletedOutput`;
- `sameThreadContinuation.provider = 'cursor'`;
- continuation argv with exact `--resume <opaqueId>`, Solution `stream-json`, same workspace, same prompt.

Do not add retries, model flags, SDK dependencies, hooks, or tool-permission changes.

- [ ] **Step 9: Run Cursor adapter tests**

```bash
npm exec -- tsx tests/evolution/cursorAgentParticipant.test.ts
```

Expected:

```text
cursorAgentParticipant.test.ts: ok
```

- [ ] **Step 10: Run generic Participant and non-Solution regressions**

```bash
npm exec -- tsx tests/evolution/agentParticipant.test.ts
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: all PASS.

- [ ] **Step 11: Scoped diff checkpoint**

```bash
git diff --check -- \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  tests/evolution/cursorAgentParticipant.test.ts

git diff -- \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  tests/evolution/cursorAgentParticipant.test.ts
```

Do not commit unless separately authorized.

---

# Task 4: Implement the Bounded Envelope Retransmission State Machine with Policy Disabled

**Files:**
- Create: `scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts`
- Create: `scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/agentParticipant.ts` trace event types only
- Create/Test: `tests/evolution/envelopeRetransmission.test.ts`

**Interfaces:**

`envelopeRetransmission.ts` produces:

```ts
export const ENVELOPE_RETRANSMISSION_TIMEOUT_MS = 60_000 as const;

export type EnvelopeRetransmissionOutcome =
  | 'NOT_ATTEMPTED'
  | 'SUCCEEDED'
  | 'TIMEOUT'
  | 'CONTINUATION_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'ENVELOPE_FAILURE'
  | 'SCHEMA_FAILURE';

export interface EnvelopeRetransmissionObservation {
  eligible: boolean;
  attempted: boolean;
  outcome: EnvelopeRetransmissionOutcome;
}

export function isEnvelopeRetransmissionEnabledForRole(
  role: WorkspaceAgentJobInput['role'],
): boolean;

export function renderEnvelopeRetransmissionRequestV1(input: {
  expectedRoleSchemaName: string;
}): string;
```

During Task 4 foundation, `isEnvelopeRetransmissionEnabledForRole()` returns `false` for every Role. Task 5 flips only Solution to enabled after the full integration tests exist.

`runStructuredParticipantExecution.ts` produces:

```ts
export type StructuredParticipantExecutionResult<T> =
  | {
      ok: true;
      value: T;
      rawOutput: string;
      acceptedAttempt: 0 | 1;
      recovery: EnvelopeRetransmissionObservation;
      executionTrace: ParticipantExecutionTraceV1;
    }
  | {
      ok: false;
      errorKind: WorkspaceAgentJobFailure['errorKind'];
      message: string;
      rawOutput?: string;
      recovery: EnvelopeRetransmissionObservation;
      executionTrace: ParticipantExecutionTraceV1;
    };

export async function runStructuredParticipantExecution<T>(input: {
  invocationRef: string;
  role: WorkspaceAgentJobInput['role'];
  workspaceRoot: string;
  destinationRoot: string;
  initialPrompt: string;
  expectedRoleSchemaName: string;
  participant: WorkspaceAgentParticipantOptions;
  retransmissionEnabled: boolean;
  validateSchema: (value: Record<string, unknown>) => T;
  validateAcceptedResult: (value: T) => Promise<void>;
}): Promise<StructuredParticipantExecutionResult<T>>;
```

Attempt artifacts:
- `terminal-attempt-0.txt`
- `terminal-attempt-1.txt` only when a retransmission terminal payload exists.

The existing `raw-output.txt` remains owned by `runSolutionAgent()` in Task 5.

- [ ] **Step 1: Write failing renderer/policy tests**

Create `tests/evolution/envelopeRetransmission.test.ts`.

Assert:

```ts
import assert from 'node:assert/strict';
import {
  ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
  isEnvelopeRetransmissionEnabledForRole,
  renderEnvelopeRetransmissionRequestV1,
} from '../../scripts/evolution/problemAgnosticSolution/envelopeRetransmission';

export async function runEnvelopeRetransmissionTests(): Promise<void> {
  assert.equal(ENVELOPE_RETRANSMISSION_TIMEOUT_MS, 60_000);

  assert.equal(isEnvelopeRetransmissionEnabledForRole('solution'), false);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('reviewer'), false);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('configuration-execution'), false);

  const prompt = renderEnvelopeRetransmissionRequestV1({
    expectedRoleSchemaName: 'SolutionWorkV1',
  });

  assert.match(prompt, /ENVELOPE_FAILURE/);
  assert.match(prompt, /Re-emit the same Role result only/i);
  assert.match(prompt, /Do not perform new reasoning or investigation/i);
  assert.match(prompt, /SolutionWorkV1/);
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /bare JSON/i);

  assert.doesNotMatch(prompt, /previous payload:/i);
  assert.doesNotMatch(prompt, /remove the prefix/i);
}
```

- [ ] **Step 2: Add failing fake-Participant happy-path state-machine test**

Build a generic fake Participant with Node `process.execPath` that emits a valid JSON object on attempt 0.

Use a minimal schema validator:

```ts
const validateFixture = (value: Record<string, unknown>) => {
  assert.equal(value.schemaVersion, 'fixture-v1');
  return value;
};
```

Call `runStructuredParticipantExecution()` with `retransmissionEnabled: true`.

Assert:
- success;
- acceptedAttempt `0`;
- only one process invocation;
- recovery outcome `NOT_ATTEMPTED`;
- `terminal-attempt-0.txt` exists;
- `terminal-attempt-1.txt` does not exist.

- [ ] **Step 3: Add failing envelope-failure → valid continuation test**

Create a Participant whose initial output is:

```text
Here is the result:
{"schemaVersion":"fixture-v1"}
```

and whose continuation returns:

```json
{"schemaVersion":"fixture-v1"}
```

with the same `ParticipantThreadRef`.

Assert:
- two process calls;
- acceptedAttempt `1`;
- recovery `eligible=true`, `attempted=true`, `outcome='SUCCEEDED'`;
- both attempt files preserve exact terminal strings;
- there is no third call.

- [ ] **Step 4: Add failing no-schema-retry and max-one tests**

Add independent cases:

```text
attempt0 envelope valid + schema invalid
→ one call
→ no continuation
→ invalid_output
```

```text
attempt0 envelope invalid
attempt1 envelope invalid
→ exactly two calls
→ recovery ENVELOPE_FAILURE
→ invalid_output
```

```text
attempt0 envelope invalid
attempt1 envelope valid + schema invalid
→ exactly two calls
→ recovery SCHEMA_FAILURE
→ invalid_output
```

- [ ] **Step 5: Add failing capability/runtime tests**

Cases:

```text
attempt0 envelope invalid + no same-thread capability
→ no continuation
→ invalid_output
```

```text
attempt0 envelope invalid + continuation timeout
→ recovery TIMEOUT
→ final timeout failure
```

```text
attempt0 envelope invalid + continuation identity failure
→ recovery CONTINUATION_FAILURE
→ final continuation failure
```

No case may schedule attempt 2.

- [ ] **Step 6: Run tests and verify failure**

```bash
npm exec -- tsx tests/evolution/envelopeRetransmission.test.ts
```

Expected: FAIL because the policy/state-machine modules do not exist.

- [ ] **Step 7: Implement the deterministic renderer**

`renderEnvelopeRetransmissionRequestV1()` must be constructed only from:
- coarse `ENVELOPE_FAILURE`;
- `expectedRoleSchemaName`;
- Shared `renderStructuredFinalOutputContractV1()`.

Use:

```ts
return [
  'The previous terminal payload was rejected by the Host.',
  '',
  'Failure class: ENVELOPE_FAILURE.',
  '',
  'Re-emit the same Role result only.',
  'Do not perform new reasoning or investigation.',
  'Do not change the semantic content merely because retransmission was requested.',
  '',
  renderStructuredFinalOutputContractV1({
    roleSchemaName: input.expectedRoleSchemaName,
  }),
].join('\n');
```

The renderer API MUST NOT accept the previous payload, envelope reason, extracted JSON, or Role-specific semantic data.

- [ ] **Step 8: Extend execution-trace event vocabulary narrowly**

In `agentParticipant.ts`, extend `ParticipantExecutionTraceEventType` with:

```ts
| 'participant_terminal_validation'
| 'participant_envelope_retransmission_requested'
| 'participant_envelope_retransmission_completed'
```

Add optional mechanical fields required by the accepted spec:

```ts
attempt?: 0 | 1;
envelopeValid?: boolean;
envelopeFailureReason?: StructuredTerminalEnvelopeFailureReason;
schemaValidationAttempted?: boolean;
schemaValid?: boolean;
accepted?: boolean;
retransmissionAttempt?: 1;
failureClass?: 'ENVELOPE_FAILURE';
sameThread?: boolean;
timeoutMs?: number;
participantCapability?: 'SAME_THREAD_CONTINUATION';
runtimeOutcome?: 'COMPLETED' | 'TIMEOUT' | 'CONTINUATION_FAILURE' | 'RUNTIME_FAILURE';
```

Existing process/output trace events remain valid.

Do not add previous payload or reasoning to trace events.

- [ ] **Step 9: Implement the bounded state machine**

The implementation order must be exactly:

```text
run attempt0
→ if runtime failure: return existing runtime failure
→ preserve terminal-attempt-0.txt
→ envelope validate attempt0
→ if envelope valid:
     schema validate
     validateAcceptedResult
     return success/fail closed
→ if envelope invalid:
     check retransmissionEnabled
     check participant same-thread capability
     check threadRef
     if any unavailable: fail closed
     record retransmission request
     run one continuation @ 60_000ms
     if runtime failure: return fail closed
     preserve terminal-attempt-1.txt
     envelope validate attempt1
     if invalid: fail closed
     schema validate attempt1
     if invalid: fail closed
     validateAcceptedResult
     return success/fail closed
```

`validateAcceptedResult` is allowed to enforce Solution problem identity/reference legality later. A failure there:
- never triggers retransmission;
- leaves `schemaValid=true`;
- sets trace `accepted=false`;
- returns final `invalid_output`.

For communication observation, `SUCCEEDED` means the retransmitted payload was envelope+schema valid; the final Role may still fail an independent Role acceptance check, which remains visible via `accepted=false` and the final Role result.

- [ ] **Step 10: Compose one aggregate `participant-execution-trace-v1`**

Do not write a second parallel authoritative trace schema.

Merge attempt process events into one trace:
- annotate initial process events with `attempt: 0`;
- annotate continuation process events with `attempt: 1`;
- offset attempt-1 elapsed values to the overall structured-execution clock;
- insert terminal-validation and retransmission lifecycle events in sequence;
- preserve `seq` monotonicity;
- set aggregate terminal elapsed to overall Role-internal Participant execution elapsed.

The helper returns the trace object. `runSolutionAgent()` will write the single authoritative `execution-trace.json` in Task 5.

- [ ] **Step 11: Run state-machine tests**

```bash
npm exec -- tsx tests/evolution/envelopeRetransmission.test.ts
```

Expected:

```text
envelopeRetransmission.test.ts: ok
```

- [ ] **Step 12: Run participant regression**

```bash
npm exec -- tsx tests/evolution/agentParticipant.test.ts
npm exec -- tsx tests/evolution/cursorAgentParticipant.test.ts
```

Expected: PASS.

- [ ] **Step 13: Scoped diff checkpoint**

```bash
git diff --check -- \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  tests/evolution/envelopeRetransmission.test.ts

git diff -- \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  tests/evolution/envelopeRetransmission.test.ts
```

At this checkpoint the role policy is still disabled.

Do not commit unless separately authorized.

---

# Task 5: Integrate and Enable Envelope Retransmission for Solution Only

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts`
- Modify/Test: `tests/evolution/solutionAgentLoop.test.ts`
- Test: `tests/evolution/problemAgnosticAgentSolutionLoop.test.ts`

**Interfaces:**

`runSolutionAgent()` consumes:

```ts
runStructuredParticipantExecution<SolutionWorkV1>({
  ...
  expectedRoleSchemaName: 'SolutionWorkV1',
  retransmissionEnabled: isEnvelopeRetransmissionEnabledForRole('solution'),
  validateSchema: validateSolutionWork,
  validateAcceptedResult: async result => {
    // problemId + existing reference validation
  },
});
```

Final policy:

```text
solution = enabled
reviewer = disabled
configuration-execution = disabled
feedback = disabled
hypothesis = disabled
```

Artifact semantics:
- `terminal-attempt-0.txt`: exact initial terminal payload when one exists.
- `terminal-attempt-1.txt`: exact retransmission terminal payload when one exists.
- `raw-output.txt`: terminal payload used for the final Role outcome:
  - attempt 0 when no retransmission;
  - attempt 1 when retransmission ran and produced a terminal payload;
  - existing raw runtime output when the final process failed before a terminal payload.
- `result.json`: only strict accepted `SolutionWorkV1`.
- `execution-trace.json`: one aggregate trace containing both attempts when recovery ran.

- [ ] **Step 1: Add failing first-pass success assertions**

In the existing successful Solution test, retain all current prompt assertions and add:

```ts
  assert.equal(
    await readFile(join(root, 'solution-agent/terminal-attempt-0.txt'), 'utf8'),
    JSON.stringify(solutionResult),
  );

  await assert.rejects(
    () => readFile(join(root, 'solution-agent/terminal-attempt-1.txt'), 'utf8'),
    /ENOENT/,
  );
```

Trace must contain one terminal-validation event:

```ts
  const terminalValidations = solutionTrace.events.filter(
    (event: { type: string }) => event.type === 'participant_terminal_validation',
  );

  assert.equal(terminalValidations.length, 1);
  assert.equal(terminalValidations[0].attempt, 0);
  assert.equal(terminalValidations[0].envelopeValid, true);
  assert.equal(terminalValidations[0].schemaValid, true);
  assert.equal(terminalValidations[0].accepted, true);
```

- [ ] **Step 2: Add failing real Solution recovery test with a fake continuation-capable Participant**

Create a fake Participant inside `solutionAgentLoop.test.ts` whose:
- initial process returns `Here is the result:\n${JSON.stringify(solutionResult)}`;
- output interpreter returns a stable threadRef;
- continuation process returns exactly `JSON.stringify(solutionResult)`;
- continuation buildArgs captures the continuation prompt.

Assert:

```text
run.ok = true
process calls = 2
raw-output.txt = exact attempt1 payload
terminal-attempt-0.txt = prose + JSON
terminal-attempt-1.txt = bare JSON
result.json = accepted SolutionWorkV1
```

Continuation prompt assertions:

```ts
assert.match(continuationPrompt, /ENVELOPE_FAILURE/);
assert.match(continuationPrompt, /Re-emit the same Role result only/i);
assert.match(continuationPrompt, /SolutionWorkV1/);
assert.doesNotMatch(continuationPrompt, new RegExp(problemPackage.problem.statement));
assert.doesNotMatch(continuationPrompt, /Here is the result:/);
```

The last two assertions prove no Problem Package replay and no previous-payload injection.

Trace assertions:

```text
attempt0 validation = ENVELOPE_FAILURE
retransmission requested = once
retransmission completed = COMPLETED
attempt1 validation = envelope valid + schema valid + accepted
no third attempt
```

- [ ] **Step 3: Add failing `SCHEMA_FAILURE` no-retransmission test**

Initial process returns one bare JSON object with an unknown/missing SolutionWorkV1 field.

Participant advertises continuation capability.

Assert:
- final `invalid_output`;
- process calls = 1;
- `terminal-attempt-1.txt` absent;
- no `participant_envelope_retransmission_requested` event.

This is the product guard against schema recovery.

- [ ] **Step 4: Add failing second-envelope/schema-failure fail-closed tests**

Case A:

```text
attempt0 prose + JSON
attempt1 prose + JSON
→ process calls exactly 2
→ invalid_output
→ no attempt2
```

Case B:

```text
attempt0 prose + JSON
attempt1 bare JSON but invalid SolutionWorkV1
→ process calls exactly 2
→ invalid_output
→ no attempt2
```

- [ ] **Step 5: Add failing unsupported-capability test**

Initial output is an envelope failure but Participant has no same-thread capability.

Assert:
- one process call;
- existing `invalid_output` failure;
- recovery observation in trace shows no retransmission request.

- [ ] **Step 6: Add participant-job accounting regression**

In `tests/evolution/problemAgnosticAgentSolutionLoop.test.ts`, use the existing dependency-injected Solution runner path to verify internal recovery does not alter workflow accounting:

```text
Solution Role still counts as job 3
Reviewer, when present, still makes actualParticipantJobs = 4
retryCount remains 0
```

Do not add a “participant job 5” for retransmission.

This can be a direct assertion on an existing completed workflow fixture after Solution recovery is represented by `runSolutionAgent()`.

- [ ] **Step 7: Run tests and verify failure before integration**

```bash
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
```

Expected: new recovery/artifact assertions FAIL.

- [ ] **Step 8: Import object-level Solution validation**

Change `runSolutionAgent.ts` to import:

```ts
import {
  validateSolutionWork,
  type SolutionWorkV1,
} from '../../../src/evolution/solutionWorkContract';
```

Stop using `parseSolutionWork(job.rawOutput.trim())` inside the main Role path.

Do not modify `solutionWorkContract.ts`.

- [ ] **Step 9: Route Solution through `runStructuredParticipantExecution()`**

Keep unchanged:
- `buildSolutionAgentPrompt()`;
- Skill delivery;
- problem package hash;
- common invocation schema;
- reference validation;
- result sealing.

Replace the one-shot job + parse block with the structured execution helper.

Pass `validateSchema: validateSolutionWork`.

Pass:

```ts
validateAcceptedResult: async result => {
  if (result.problemId !== problemPackage.problemId) {
    throw new Error('SolutionWork problemId does not match ProblemPackage');
  }
  await validateReferences(result, input);
}
```

- [ ] **Step 10: Write aggregate trace and attempt artifacts without changing failure routing**

`runStructuredParticipantExecution()` owns attempt files.

`runSolutionAgent()` writes exactly one:

```text
solution-agent/execution-trace.json
```

using the returned aggregate trace.

Keep existing:
- `invocation.json`;
- `raw-output.txt`;
- `failure.json`;
- `result.json`;
- `SolutionAgentRunResult` public shape.

Do not require callers/stubs to add new result fields.

- [ ] **Step 11: Flip only Solution policy to enabled**

In `envelopeRetransmission.ts`:

```ts
export function isEnvelopeRetransmissionEnabledForRole(
  role: WorkspaceAgentJobInput['role'],
): boolean {
  return role === 'solution';
}
```

No configuration flag.

- [ ] **Step 12: Run Solution and workflow tests**

```bash
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npm exec -- tsx tests/evolution/p2-success-path.test.ts
npm exec -- tsx tests/evolution/p2-participant-accounting.test.ts
```

Expected: PASS.

- [ ] **Step 13: Verify Reviewer and Configuration remain fail-closed/no-retransmission**

```bash
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: PASS with no new attempt-1/retransmission behavior.

- [ ] **Step 14: Run all focused communication tests**

```bash
npm exec -- tsx tests/evolution/structuredTerminalEnvelope.test.ts
npm exec -- tsx tests/evolution/agentParticipant.test.ts
npm exec -- tsx tests/evolution/cursorAgentParticipant.test.ts
npm exec -- tsx tests/evolution/envelopeRetransmission.test.ts
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
```

Expected: all PASS.

- [ ] **Step 15: Scoped diff checkpoint**

```bash
git diff --check -- \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/problemAgnosticAgentSolutionLoop.test.ts

git diff -- \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
```

Confirm no Solution reasoning/convergence/Skill prompt changes.

Do not commit unless separately authorized.

---

# Task 6: Add Sidecar Trace/Report Observability and Reconcile Governance

**Files:**
- Modify: `scripts/evolution/reporting/buildOperationalRunReport.ts`
- Modify/Test: `tests/evolution/operationalRunReport.test.ts`
- Modify: `docs/governance/current-product-stage.md`

**Interfaces:**

Operational Report derives communication recovery only from existing runtime artifacts, principally `solution-agent/execution-trace.json`.

Add to `WorkflowSummary` a nullable structured-terminal summary:

```ts
interface StructuredTerminalDeliverySummary {
  firstAttempt:
    | 'VALID'
    | 'ENVELOPE_FAILURE'
    | 'SCHEMA_FAILURE'
    | null;
  retransmission:
    | 'NOT_ATTEMPTED'
    | 'SUCCEEDED'
    | 'TIMEOUT'
    | 'CONTINUATION_FAILURE'
    | 'RUNTIME_FAILURE'
    | 'ENVELOPE_FAILURE'
    | 'SCHEMA_FAILURE'
    | null;
  finalStructuredOutput: 'VALID' | 'FAILED' | null;
}
```

Report remains observational; no runtime module imports Report code.

- [ ] **Step 1: Add failing recovered-run report fixture**

In `tests/evolution/operationalRunReport.test.ts`, create a workflow with:
- `problem-package.json`;
- `source/observable-payload.json`;
- valid `solution-agent/result.json`;
- `solution-agent/execution-trace.json` containing:
  - attempt0 terminal validation: envelope failure;
  - retransmission requested;
  - retransmission completed: COMPLETED;
  - attempt1 terminal validation: envelope+schema valid, accepted true.

Assert report contains:

```text
Structured terminal delivery:
First attempt: ENVELOPE_FAILURE
Bounded retransmission: SUCCEEDED
Final structured output: VALID
```

Exact punctuation may follow existing report style; keep the three semantic facts.

- [ ] **Step 2: Add failing fail-closed report fixture**

Create a workflow where attempt0 envelope fails and attempt1 schema fails.

Assert:

```text
First attempt: ENVELOPE_FAILURE
Bounded retransmission: SCHEMA_FAILURE
Final structured output: FAILED
```

- [ ] **Step 3: Add failing first-pass/final aggregate metric assertions**

For a scan root containing:
- one first-pass success;
- one recovered success;
- one fail-closed schema failure;

assert report-level counts distinguish:

```text
first-pass structured-output successes
first-pass envelope failures
retransmissions attempted
retransmissions succeeded
final structured-output successes
```

Do not present a single final-success number without first-pass counts.

- [ ] **Step 4: Run report test and verify failure**

```bash
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
```

Expected: FAIL because trace recovery is not yet summarized.

- [ ] **Step 5: Read execution trace defensively**

In `buildOperationalRunReport.ts`:
- add `solution-agent/execution-trace.json` to structured artifact discovery;
- parse only known communication event fields;
- if trace is absent/malformed, omit communication summary rather than changing workflow outcome;
- do not read `terminal-attempt-*.txt` payload contents into the report.

Derive:
- attempt0 classification;
- retransmission outcome;
- final structured output validity.

The Report must not influence runtime or fail a workflow.

- [ ] **Step 6: Render per-workflow communication summary and aggregate counts**

Add human-readable lines only when trace evidence exists.

Keep existing report statements about workflow outcome/authoritative modification unchanged.

Never report recovered success as a clean first-pass success.

- [ ] **Step 7: Run report tests**

```bash
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
```

Expected:

```text
operationalRunReport.test.ts: ok
```

- [ ] **Step 8: Update current-product-stage governance narrowly**

Edit `docs/governance/current-product-stage.md`.

Required state after engineering tests:

```text
overall stage:
RUN / OBSERVE

Full P3:
DEFERRED / NOT CURRENTLY ACTIVE

Minimal Slice #1:
Structured Final Output Contract V1
ENGINEERING DELIVERED

Minimal Slice #2:
Envelope Failure Bounded Retransmission
ENGINEERING DELIVERED / RUNTIME CONFORMANCE UNVERIFIED
```

Document only the accepted Minimal Slice #2 semantics:
- Solution only;
- terminal `ENVELOPE_FAILURE` only;
- one same-thread retransmission;
- 60s recovery ceiling;
- `SCHEMA_FAILURE` fail closed;
- no Host repair/semantic correction;
- continuation-capable Participant required.

Do not claim runtime conformance or broad Participant Communication Contract activation.

- [ ] **Step 9: Run focused regression + typecheck**

```bash
npm exec -- tsx tests/evolution/structuredTerminalEnvelope.test.ts
npm exec -- tsx tests/evolution/agentParticipant.test.ts
npm exec -- tsx tests/evolution/cursorAgentParticipant.test.ts
npm exec -- tsx tests/evolution/envelopeRetransmission.test.ts
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 10: Check protected scope**

Run:

```bash
git diff --check

git diff -- \
  src/evolution/participantStructuredOutputContract.ts \
  src/evolution/solutionWorkContract.ts \
  src/evolution/solutionReviewContract.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  scripts/evolution/configurationExecutionParticipant.ts \
  scripts/evolution/problemAgnosticSolution/solutionParticipantSkills.ts \
  skills/repository-grounded-investigation/SKILL.md
```

Expected: no changes in the protected files above.

- [ ] **Step 11: Scoped engineering-delivery diff checkpoint**

Review only intended Task 1–6 files:

```bash
git diff -- \
  src/evolution/structuredTerminalEnvelope.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/reporting/buildOperationalRunReport.ts \
  tests/evolution/structuredTerminalEnvelope.test.ts \
  tests/evolution/agentParticipant.test.ts \
  tests/evolution/cursorAgentParticipant.test.ts \
  tests/evolution/envelopeRetransmission.test.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/problemAgnosticAgentSolutionLoop.test.ts \
  tests/evolution/operationalRunReport.test.ts \
  docs/governance/current-product-stage.md
```

No unrelated dirty-worktree changes may be staged or attributed to this task.

Do not commit unless separately authorized.

---

# Task 7: Run a Controlled Real-Cursor Runtime Conformance Batch and STOP

**Files:**
- Create only under: `.tmp/evolution/envelope-failure-bounded-retransmission-runtime-conformance-20260824/`
- No committed production/test code changes in this task.

**Purpose:** Verify the delivered product code against the real Cursor harness without waiting indefinitely for a naturally occurring envelope failure. This is a **fault-injected protocol conformance batch**, not a measurement of natural first-pass sender quality.

**Batch:** 3 serial Solution trials, retry 0.

**Fault injection:** The `.tmp` harness wraps only the initial successful Cursor terminal interpretation and prepends a deterministic prose prefix while preserving the actual `threadRef`. Continuation interpretation is untouched. This guarantees a real Host-observed `ENVELOPE_FAILURE` without changing production code or asking the Agent to violate its contract.

- [ ] **Step 1: Create the conformance root and protected hash baseline**

```bash
ROOT=.tmp/evolution/envelope-failure-bounded-retransmission-runtime-conformance-20260824
mkdir -p "$ROOT"

git status --porcelain=v1 > "$ROOT/repository-status-before.txt"

shasum -a 256 \
  src/evolution/participantStructuredOutputContract.ts \
  src/evolution/solutionWorkContract.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  skills/repository-grounded-investigation/SKILL.md \
  > "$ROOT/protected-sha256-before.txt"
```

The production files added by this feature are protected from mutation during runtime observation.

- [ ] **Step 2: Run exactly one provider-health probe**

Capture:

```bash
cursor --version > "$ROOT/cursor-version.txt"
cursor agent --help > "$ROOT/cursor-agent-help.txt"
```

Then run one tiny `stream-json` Cursor probe with a disposable workspace and ≤60s ceiling.

PASS requires:
- `system/init.session_id`;
- `result/success`;
- no `resource_exhausted`;
- no fatal provider/runtime failure.

If health fails:
- write `PROVIDER_NOT_STABLE_FOR_RUNTIME_CONFORMANCE`;
- do not retry;
- STOP the batch.

- [ ] **Step 3: Create a tiny disposable Solution fixture per trial**

For each `trial-01..03`:
- fresh workspace;
- `src/example.ts` with one small exported constant;
- canonical `skills/repository-grounded-investigation/SKILL.md` copied unchanged;
- artifact root containing `source/observable-payload.json`;
- valid `ProblemPackageV1` with a simple repository-grounded question;
- no authoritative repository writes.

Use `runSolutionAgent()` and `createCursorAgentParticipant()` from the delivered production code.

- [ ] **Step 4: Wrap Cursor interpretation only for initial-attempt fault injection**

In the `.tmp` host:

```ts
const cursor = createCursorAgentParticipant();
const interpret = cursor.interpretCompletedOutput;

if (!interpret) throw new Error('Cursor completed-output interpreter unavailable');

const faultInjectedParticipant = {
  ...cursor,
  interpretCompletedOutput: input => {
    const interpreted = interpret(input);
    if (
      interpreted.ok
      && input.expectedThreadRef === undefined
      && input.job.role === 'solution'
    ) {
      return {
        ...interpreted,
        rawOutput: `HOST_FAULT_INJECTION_PREFIX\n${interpreted.rawOutput}`,
      };
    }
    return interpreted;
  },
};
```

Rules:
- preserve `threadRef`;
- do not alter continuation result;
- do not strip/repair anything;
- save the unmodified initial Cursor terminal payload to a `.tmp` diagnostic file before prefix injection so the report can distinguish injected envelope corruption from model output.

This wrapper exists only in `.tmp`.

- [ ] **Step 5: Execute three serial trials**

For each trial:
- retry = 0;
- existing initial Solution timeout unchanged;
- retransmission timeout must be exactly 60_000ms through production policy;
- no parallelism.

Record:
- initial Cursor terminal result;
- injected attempt-0 terminal;
- thread ref observed;
- retransmission attempted;
- same-thread identity outcome;
- attempt-1 terminal;
- final Solution result/failure;
- execution trace;
- process timing.

- [ ] **Step 6: Validate protocol conformance mechanically**

For every trial assert from product artifacts/trace:

```text
attempt0 envelopeValid = false
failureClass = ENVELOPE_FAILURE
retransmission requested count <= 1
retransmissionAttempt = 1
sameThread = true
timeoutMs = 60000
no attempt2
terminal-attempt-0.txt preserved
```

If continuation produces a terminal result:
- `terminal-attempt-1.txt` preserved;
- attempt1 is revalidated from scratch;
- schema failure, if any, fails closed without retry.

If a trial recovers:
- result.json exists;
- accepted attempt is attempt1;
- Host did not extract/repair attempt0.

- [ ] **Step 7: Report recovery separately from protocol conformance**

Write `runtime-conformance-report.md` and `runtime-conformance-summary.json`.

Required metrics:

```text
provider health
trials = 3
protocol-conformant trials / 3
same-thread continuation success / attempted
retransmissions attempted / 3
mechanically valid retransmission payloads / attempted
final Solution successes / 3
second retransmissions = 0
schema-failure retries = 0
```

Verdict model:

```text
ENVELOPE_RETRANSMISSION_RUNTIME_PROTOCOL_CONFIRMED
```

only if all completed trials obey:
- max one retransmission;
- exact same-thread continuation;
- correct 60s recovery ceiling;
- no Host repair;
- second failure fail-closed;
- provenance preserved.

Report recovery success rate separately. Do **not** require 3/3 model recovery to call the protocol implementation conformant; a model-side attempt-1 schema/envelope failure is acceptable if the Host fails closed correctly.

If implementation violates a bounded-protocol rule, verdict:

```text
ENVELOPE_RETRANSMISSION_RUNTIME_PROTOCOL_VIOLATION
```

and STOP.

If provider stability prevents a meaningful batch:

```text
OBSERVATION_INSUFFICIENT_DUE_TO_PROVIDER_RUNTIME
```

Do not retry automatically.

- [ ] **Step 8: Verify production files did not mutate during runtime observation**

```bash
shasum -a 256 \
  src/evolution/participantStructuredOutputContract.ts \
  src/evolution/solutionWorkContract.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/envelopeRetransmission.ts \
  scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution.ts \
  skills/repository-grounded-investigation/SKILL.md \
  > "$ROOT/protected-sha256-after.txt"

diff -u "$ROOT/protected-sha256-before.txt" "$ROOT/protected-sha256-after.txt"
```

Expected: no runtime mutation.

- [ ] **Step 9: Run final focused engineering verification**

```bash
npm exec -- tsx tests/evolution/structuredTerminalEnvelope.test.ts
npm exec -- tsx tests/evolution/agentParticipant.test.ts
npm exec -- tsx tests/evolution/cursorAgentParticipant.test.ts
npm exec -- tsx tests/evolution/envelopeRetransmission.test.ts
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/problemAgnosticAgentSolutionLoop.test.ts
npm exec -- tsx tests/evolution/operationalRunReport.test.ts
npm run typecheck
git diff --check
```

Expected: PASS.

- [ ] **Step 10: STOP**

The final handoff must report:
1. engineering delivery status;
2. runtime-conformance verdict;
3. 3-trial matrix;
4. first-pass fault injection clearly labeled synthetic;
5. retransmission count/timeout/same-thread proof;
6. recovered vs fail-closed counts;
7. Trace/raw attempt provenance proof;
8. Report sidecar evidence;
9. protected hash result;
10. exact changed files;
11. deviations;
12. governance state;
13. one next direction only.

Do not automatically:
- expand to Reviewer/Configuration Execution;
- add schema recovery;
- add second retransmission;
- add tool enforcement;
- change Full P3 status;
- create a generic retry framework.

---

# Final Verification Matrix

Before declaring `ENGINEERING DELIVERED`, all deterministic checks below must pass:

| Requirement | Verification |
|---|---|
| Pretty JSON valid | `structuredTerminalEnvelope.test.ts` |
| Prose/fence/multiple invalid | `structuredTerminalEnvelope.test.ts` |
| No canonicalization | validator source + regression |
| Opaque thread ref | `agentParticipant.test.ts` |
| Cursor session_id adapter-local | `cursorAgentParticipant.test.ts` |
| Reviewer Cursor text behavior preserved | `cursorAgentParticipant.test.ts` |
| Max retransmission = 1 | `envelopeRetransmission.test.ts`, `solutionAgentLoop.test.ts` |
| Schema failure no retry | `envelopeRetransmission.test.ts`, `solutionAgentLoop.test.ts` |
| Unsupported capability fail closed | `solutionAgentLoop.test.ts` |
| 60s retransmission timeout | policy test + runtime trace |
| No previous payload in NACK | renderer + Solution prompt assertions |
| No Problem Package replay | Solution recovery prompt assertion |
| Both terminal attempts preserved | `solutionAgentLoop.test.ts` |
| One aggregate execution trace | `solutionAgentLoop.test.ts` |
| Participant-job accounting unchanged | `problemAgnosticAgentSolutionLoop.test.ts` |
| Report sidecar only | architecture dependency + `operationalRunReport.test.ts` |
| First-pass vs final metrics separated | `operationalRunReport.test.ts` |
| Full P3 remains deferred | `current-product-stage.md` diff |
| Real Cursor same-thread protocol | Task 7 conformance artifacts |

---

# Plan Self-Review

## 1. Spec coverage

Mapped accepted design requirements:

- Product problem/scope/non-goals → Global Constraints.
- Envelope-only trigger → Tasks 1, 4, 5.
- Legal JSON whitespace / no canonical compact check → Task 1.
- Envelope → schema ordering → Tasks 4–5.
- Schema fail-closed → Tasks 4–5.
- One retransmission only → Tasks 4–5.
- Same-thread opaque capability → Tasks 2–3.
- Cursor `session_id` adapter detail → Task 3.
- Solution-only rollout → Tasks 3, 4, 5.
- 60s communication allowance → Tasks 4–5.
- No Problem Package/payload replay → Tasks 4–5.
- No tool enforcement → Global Constraints.
- Runtime failure/continuation fail-closed → Tasks 2, 4.
- Both attempts preserved → Tasks 4–5.
- Trace lifecycle events → Tasks 4–5.
- Report sidecar and first-pass metrics → Task 6.
- Foundation → Solution enablement → observation migration → Tasks 1–4 → Task 5 → Task 7.
- Full P3 deferred / Minimal Slice #2 engineering state → Task 6.
- Rollback/STOP boundaries → Global Constraints + Task 7 STOP.
- Runtime conformance batch → Task 7.

No accepted-spec requirement intended for this implementation is omitted.

## 2. Placeholder scan

No `TBD`, `TODO`, “implement later”, transcript replay, Host repair, generic retry, or unspecified “write tests for the above” step remains.

Runtime values that are inherently observed rather than predetermined are explicitly captured:
- Cursor CLI version;
- provider health;
- actual opaque session IDs;
- trial timing/outcomes.

## 3. Type/interface consistency

The plan consistently uses:
- `ParticipantThreadRef { provider, opaqueId }`;
- `WorkspaceAgentOutputInterpretation`;
- `runWorkspaceAgentContinuation(...)`;
- `ENVELOPE_RETRANSMISSION_TIMEOUT_MS = 60_000`;
- `EnvelopeRetransmissionOutcome`;
- `runStructuredParticipantExecution<T>()`;
- `validateStructuredTerminalEnvelope()`;
- `validateSolutionWork()` object-level schema validation;
- Solution-only `isEnvelopeRetransmissionEnabledForRole()`.

`Cursor session_id` never appears in the Role/Orchestrator product interface.

## 4. Scope check

This plan is one coherent Minimal Slice, not multiple independent products. It does not include schema recovery, all-Role migration, tool enforcement, SDK migration, model routing, generic retries, or Orchestrator changes.

## 5. Shared-worktree/commit check

The repository snapshot is already dirty for unrelated Wealth/game work. This plan therefore replaces the writing-plans default “commit every task” step with scoped diff checkpoints. No task may stage or commit unrelated files. Repository commits require separate Human authorization.
