# Structured Final Output Contract V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one shared, Role-agnostic terminal-output contract to Solution, Reviewer, and Configuration Execution prompts while preserving the existing strict fail-closed parsers and all runtime/provider behavior.

**Architecture:** Introduce a single prompt-fragment renderer in `src/evolution/participantStructuredOutputContract.ts`. Each pilot Role passes only its schema label into that renderer; the shared module contains no Role-specific branching. Existing Role parsers remain authoritative and unchanged in behavior. Runtime/model/provider/timeout/adapter changes are explicitly out of scope.

**Tech Stack:** TypeScript, Node.js, existing `tsx` test scripts, Node `assert`, existing Auto Evolution prompt builders and strict JSON parsers.

**Spec:** `2026-08-23-structured-final-output-contract-v1-design.md` (user-approved design; logical repository destination if later committed: `docs/superpowers/specs/2026-08-23-structured-final-output-contract-v1-design.md`)

## Global Constraints

- The contract applies only to the **terminal Role payload** consumed by the workflow; provider-native progress/thinking/tool events are outside this contract.
- The terminal payload must be **exactly one bare JSON object** matching the Role-specific schema.
- Markdown/code fences and prose before/after the JSON are invalid.
- The host validates or rejects; it must not extract, normalize, or repair Participant output.
- Negative/non-actionable outcomes must remain valid Role-specific structured outcomes.
- Pilot scope is exactly: **Solution, Reviewer, Configuration Execution**.
- Do not modify `runWorkspaceAgentJob`, Cursor/Codex adapters, timeout, retry, model selection, provider configuration, Orchestrator, Run Report, Execution Trace, shared Skills, or Role schemas.
- Do not add a shared parser or new production failure taxonomy.
- Do not roll out to Feedback, Hypothesis, Hypothesis Investigation, Modification Work, or Comparative Feedback in this implementation.
- Do not fix the historical Hypothesis `feedbackRefs=[]` issue in this task.
- The shared renderer must not branch on Role; only schema-label data may vary.
- Existing dirty worktree state must not be reset, stashed, cleaned, or attributed to this task.
- In a shared dirty checkout, do not commit unless the human/project workflow explicitly permits it; use scoped diff checkpoints instead.

---

## File Structure

**Create**
- `src/evolution/participantStructuredOutputContract.ts` — owns the shared V1 prompt fragment and renderer only.

**Modify**
- `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts:90-140` — inject the shared terminal-output contract into the Solution prompt.
- `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts:85-129` — inject the same shared contract into the Reviewer prompt.
- `scripts/evolution/configurationExecutionParticipant.ts:100-118` — inject the same shared contract into the Configuration Execution prompt.
- `tests/evolution/problemAgnosticSolutionContracts.test.ts:1-178` — unit-test the renderer and strengthen fail-closed envelope regression for Solution/Reviewer parsers.
- `tests/evolution/solutionAgentLoop.test.ts:90-120` — verify Solution receives V1 with `SolutionWorkV1`.
- `tests/evolution/solutionReviewerLoop.test.ts:88-105` and delivered-prompt assertions later in the file — verify Reviewer receives V1 with `SolutionReviewV1`.
- `tests/evolution/p2-configuration-participant.test.ts:1-50` — verify Configuration Execution receives V1 and rejects wrapped/fenced/multiple payloads.

**Must remain unchanged**
- `scripts/evolution/problemAgnosticSolution/agentParticipant.ts`
- `scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts`
- `scripts/evolution/problemAgnosticSolution/solutionParticipantSkills.ts`
- `skills/repository-grounded-investigation/SKILL.md`
- `src/evolution/solutionWorkContract.ts`
- `src/evolution/solutionReviewContract.ts`
- Orchestrator, failure routing, Execution Trace, Run Report, provider/runtime configuration.

**Repository-authority calibration:** the current Configuration Execution payload schema is identified by `schemaVersion: "configuration-execution-result-v1"` and the production interface is `ConfigurationExecutionParticipantResult`. Do **not** invent or rename a production type called `ConfigurationExecutionResultV1`; use the existing schema label `configuration-execution-result-v1` in the shared prompt renderer.

---

### Task 1: Add the shared Structured Final Output Contract renderer

**Files:**
- Create: `src/evolution/participantStructuredOutputContract.ts`
- Modify/Test: `tests/evolution/problemAgnosticSolutionContracts.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const STRUCTURED_FINAL_OUTPUT_CONTRACT_V1: 'Structured Final Output Contract V1';

  export function renderStructuredFinalOutputContractV1(input: {
    roleSchemaName: string;
  }): string;
  ```
- Consumers in later tasks:
  - `buildSolutionAgentPrompt()`
  - `buildSolutionReviewerPrompt()`
  - `buildConfigurationExecutionPrompt()`

- [ ] **Step 1: Write the failing shared-contract tests**

Add this import to `tests/evolution/problemAgnosticSolutionContracts.test.ts`:

```ts
import {
  STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
  renderStructuredFinalOutputContractV1,
} from '../../src/evolution/participantStructuredOutputContract';
```

Inside `runProblemAgnosticSolutionContractTests()`, before the existing unknown-field checks, add:

```ts
  assert.equal(
    STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
    'Structured Final Output Contract V1',
  );

  const solutionOutputContract = renderStructuredFinalOutputContractV1({
    roleSchemaName: 'SolutionWorkV1',
  });
  assert.match(solutionOutputContract, /Structured Final Output Contract V1/);
  assert.match(solutionOutputContract, /exactly one valid JSON object/i);
  assert.match(solutionOutputContract, /SolutionWorkV1/);
  assert.match(solutionOutputContract, /bare JSON only/i);
  assert.match(solutionOutputContract, /Markdown\/code fences/i);
  assert.match(solutionOutputContract, /before or after the JSON object/i);
  assert.match(solutionOutputContract, /strictly/i);
  assert.match(solutionOutputContract, /reject invalid output/i);
  assert.match(solutionOutputContract, /extract, normalize, or repair/i);

  const reviewerOutputContract = renderStructuredFinalOutputContractV1({
    roleSchemaName: 'SolutionReviewV1',
  });
  const executionOutputContract = renderStructuredFinalOutputContractV1({
    roleSchemaName: 'configuration-execution-result-v1',
  });

  assert.equal(
    solutionOutputContract.replaceAll('SolutionWorkV1', '<ROLE_SCHEMA>'),
    reviewerOutputContract.replaceAll('SolutionReviewV1', '<ROLE_SCHEMA>'),
  );
  assert.equal(
    solutionOutputContract.replaceAll('SolutionWorkV1', '<ROLE_SCHEMA>'),
    executionOutputContract.replaceAll('configuration-execution-result-v1', '<ROLE_SCHEMA>'),
  );
```

These last two assertions enforce that the rendered contract varies only by schema label.

- [ ] **Step 2: Run the test and verify it fails because the shared module does not exist**

Run:

```bash
npm exec -- tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
```

Expected: FAIL at module resolution/import because `participantStructuredOutputContract.ts` has not yet been created.

- [ ] **Step 3: Implement the minimal shared renderer**

Create `src/evolution/participantStructuredOutputContract.ts` with this shape:

```ts
export const STRUCTURED_FINAL_OUTPUT_CONTRACT_V1 =
  'Structured Final Output Contract V1' as const;

export function renderStructuredFinalOutputContractV1(input: {
  roleSchemaName: string;
}): string {
  return [
    STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
    '',
    `Your terminal result must be exactly one valid JSON object matching the ${input.roleSchemaName} schema required by this task.`,
    'Output bare JSON only. Do not include Markdown/code fences, prose, explanations, headings, or any other text before or after the JSON object.',
    'If the task requires a negative or non-actionable outcome, represent it using a valid status/output defined by the role-specific schema; do not replace the structured result with free-form prose.',
    'The host validates this result strictly and will reject invalid output rather than extract, normalize, or repair it.',
  ].join('\n');
}
```

Do not add Role enums, provider fields, parser logic, failure types, or branching.

- [ ] **Step 4: Run the shared-contract test and verify it passes**

Run:

```bash
npm exec -- tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
```

Expected: PASS and print:

```text
problemAgnosticSolutionContracts.test.ts: ok
```

- [ ] **Step 5: Checkpoint the Task 1 diff**

Run:

```bash
git diff --check -- \
  src/evolution/participantStructuredOutputContract.ts \
  tests/evolution/problemAgnosticSolutionContracts.test.ts

git diff -- \
  src/evolution/participantStructuredOutputContract.ts \
  tests/evolution/problemAgnosticSolutionContracts.test.ts
```

Expected: only the shared renderer and its unit tests are present. Do not commit in a shared dirty checkout unless explicitly authorized.

---

### Task 2: Deliver V1 to the Solution Participant prompt

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts:1-140`
- Test: `tests/evolution/solutionAgentLoop.test.ts:90-120`

**Interfaces:**
- Consumes:
  ```ts
  renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionWorkV1' })
  ```
- Produces: a Solution prompt containing the shared V1 contract while preserving the existing convergence discipline, Skill delivery, reference rules, and Problem Package.

- [ ] **Step 1: Add failing Solution prompt assertions**

In `tests/evolution/solutionAgentLoop.test.ts`, after the existing Solution/convergence assertions, add:

```ts
  assert.match(deliveredPrompt, /Structured Final Output Contract V1/);
  assert.match(deliveredPrompt, /exactly one valid JSON object/i);
  assert.match(deliveredPrompt, /SolutionWorkV1/);
  assert.match(deliveredPrompt, /bare JSON only/i);
  assert.match(deliveredPrompt, /Markdown\/code fences/i);
  assert.match(deliveredPrompt, /before or after the JSON object/i);
  assert.match(deliveredPrompt, /reject invalid output/i);
  assert.match(deliveredPrompt, /extract, normalize, or repair/i);
```

Keep all existing assertions for convergence discipline, Skill provenance, reference formatting, and domain neutrality.

- [ ] **Step 2: Run the Solution loop test and verify the new assertions fail**

Run:

```bash
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
```

Expected: FAIL because the shared V1 wording has not yet been inserted into `buildSolutionAgentPrompt()`.

- [ ] **Step 3: Import and insert the shared renderer**

In `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts`, import:

```ts
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
```

Inside `buildSolutionAgentPrompt()`, replace the narrow line:

```ts
'Write/return only the structured SolutionWorkV1 result as the final job result.',
```

with the shared fragment:

```ts
renderStructuredFinalOutputContractV1({
  roleSchemaName: 'SolutionWorkV1',
}),
```

Keep the empty-line separator around the fragment so the convergence discipline remains a distinct prompt section.

Do not change the Solution convergence wording added earlier.

- [ ] **Step 4: Run the Solution loop test**

Run:

```bash
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
```

Expected: PASS and print:

```text
solutionAgentLoop.test.ts: ok
```

- [ ] **Step 5: Checkpoint the Solution diff**

Run:

```bash
git diff --check -- \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  tests/evolution/solutionAgentLoop.test.ts
```

Inspect the scoped diff and confirm no parser, timeout, trace, Skill, or participant binding changed.

---

### Task 3: Deliver the same V1 to the Reviewer prompt

**Files:**
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts:1-129`
- Test: `tests/evolution/solutionReviewerLoop.test.ts:76-150`

**Interfaces:**
- Consumes:
  ```ts
  renderStructuredFinalOutputContractV1({ roleSchemaName: 'SolutionReviewV1' })
  ```
- Produces: a Reviewer prompt containing the same shared V1 wording with only the schema label changed.

- [ ] **Step 1: Add failing Reviewer prompt assertions**

In `tests/evolution/solutionReviewerLoop.test.ts`, immediately after the existing prompt assertions around lines 88-105, add:

```ts
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /exactly one valid JSON object/i);
  assert.match(prompt, /SolutionReviewV1/);
  assert.match(prompt, /bare JSON only/i);
  assert.match(prompt, /Markdown\/code fences/i);
  assert.match(prompt, /before or after the JSON object/i);
  assert.match(prompt, /reject invalid output/i);
  assert.match(prompt, /extract, normalize, or repair/i);
```

After the actual `runSolutionReviewer()` call captures `deliveredPrompt`, add the same core delivery checks to prove runtime prompt construction uses the contract:

```ts
  assert.match(deliveredPrompt, /Structured Final Output Contract V1/);
  assert.match(deliveredPrompt, /SolutionReviewV1/);
  assert.match(deliveredPrompt, /bare JSON only/i);
```

- [ ] **Step 2: Run the Reviewer loop test and verify failure**

Run:

```bash
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
```

Expected: FAIL on the new shared-contract prompt assertions.

- [ ] **Step 3: Import and insert the shared renderer**

In `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts`, import:

```ts
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
```

Inside `buildSolutionReviewerPrompt()`, replace:

```ts
'Return only the structured SolutionReviewV1 result as the final job result.',
```

with:

```ts
renderStructuredFinalOutputContractV1({
  roleSchemaName: 'SolutionReviewV1',
}),
```

Do not alter Reviewer independence, evidence inspection, Skill delivery, or reference-format rules.

- [ ] **Step 4: Run the Reviewer loop test**

Run:

```bash
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
```

Expected: PASS and print:

```text
solutionReviewerLoop.test.ts: ok
```

- [ ] **Step 5: Checkpoint the Reviewer diff**

Run:

```bash
git diff --check -- \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  tests/evolution/solutionReviewerLoop.test.ts
```

Confirm the shared renderer is reused directly and there is no Reviewer-specific logic in the shared module.

---

### Task 4: Deliver V1 to Configuration Execution and harden envelope regression coverage

**Files:**
- Modify: `scripts/evolution/configurationExecutionParticipant.ts:1-118`
- Test: `tests/evolution/p2-configuration-participant.test.ts:1-50`
- Modify/Test: `tests/evolution/problemAgnosticSolutionContracts.test.ts:104-174`

**Interfaces:**
- Consumes:
  ```ts
  renderStructuredFinalOutputContractV1({
    roleSchemaName: 'configuration-execution-result-v1',
  })
  ```
- Preserves the existing private `parseParticipantResult()` and `invalid_output` failure behavior.

- [ ] **Step 1: Add fail-closed envelope regression tests for Solution and Reviewer**

In `tests/evolution/problemAgnosticSolutionContracts.test.ts`, add a helper inside `runProblemAgnosticSolutionContractTests()`:

```ts
  const invalidEnvelopes = (json: string): string[] => [
    `Here is the result:\n${json}`,
    `\`\`\`json\n${json}\n\`\`\``,
    `${json}\nAdditional explanation`,
    `${json}\n${json}`,
  ];

  for (const raw of invalidEnvelopes(JSON.stringify(solutionWork))) {
    assert.throws(() => parseSolutionWork(raw), /valid JSON/i);
  }

  for (const raw of invalidEnvelopes(JSON.stringify(solutionReview))) {
    assert.throws(() => parseSolutionReview(raw), /valid JSON/i);
  }
```

This must exercise existing strict parsers without modifying them.

- [ ] **Step 2: Refactor the Configuration Execution test fixture locally and add failing prompt assertions**

In `tests/evolution/p2-configuration-participant.test.ts`:

1. Import `buildConfigurationExecutionPrompt` alongside `runConfigurationExecutionParticipant`.
2. Lift the shared `problemPackage`, `solutionWork`, `solutionReview`, allowed paths, and authority refs into local constants inside `main()`.
3. Build a prompt with the same input and assert:

```ts
  const prompt = buildConfigurationExecutionPrompt(baseInput);
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /exactly one valid JSON object/i);
  assert.match(prompt, /configuration-execution-result-v1/);
  assert.match(prompt, /bare JSON only/i);
  assert.match(prompt, /Markdown\/code fences/i);
  assert.match(prompt, /before or after the JSON object/i);
  assert.match(prompt, /reject invalid output/i);
  assert.match(prompt, /extract, normalize, or repair/i);
```

Use a dummy participant in `baseInput`; `buildConfigurationExecutionPrompt()` does not consume it.

- [ ] **Step 3: Add Configuration Execution envelope-failure cases**

Create a local helper:

```ts
  const validExecutionPayload = JSON.stringify({
    schemaVersion: 'configuration-execution-result-v1',
    status: 'completed',
    changedFiles: ['src/data/lines/family-life.json'],
    verificationResults: [],
    deviations: [],
  });

  async function runWithRawOutput(label: string, rawOutput: string) {
    return runConfigurationExecutionParticipant({
      ...baseInput,
      invocationRef: `configuration-execution-${label}`,
      destinationRoot: join(root, `execution-${label}`),
      participant: {
        executable: process.execPath,
        buildArgs: () => [
          '-e',
          `process.stdout.write(${JSON.stringify(rawOutput)})`,
        ],
      },
    });
  }
```

Keep one valid case and add these invalid cases:

```ts
  const invalidExecutionOutputs = [
    `Here is the result:\n${validExecutionPayload}`,
    `\`\`\`json\n${validExecutionPayload}\n\`\`\``,
    `${validExecutionPayload}\nAdditional explanation`,
    `${validExecutionPayload}\n${validExecutionPayload}`,
  ];

  for (const [index, rawOutput] of invalidExecutionOutputs.entries()) {
    const invalid = await runWithRawOutput(`invalid-${index}`, rawOutput);
    assert.equal(invalid.status, 'failed');
    assert.equal(invalid.resultPath, null);
    assert.equal(invalid.failurePath !== null, true);
    assert.match(invalid.deviations[0] ?? '', /SyntaxError|JSON|valid/i);
  }
```

Do not export or rewrite `parseParticipantResult()` merely to make the test easier.

- [ ] **Step 4: Run the two tests and verify prompt assertions fail before production integration**

Run:

```bash
npm exec -- tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected before production integration:
- contract/parser regression test passes for Solution/Reviewer strict parsing;
- Configuration test fails on missing shared prompt fragment.

- [ ] **Step 5: Import and insert the renderer in Configuration Execution**

In `scripts/evolution/configurationExecutionParticipant.ts`, import:

```ts
import { renderStructuredFinalOutputContractV1 } from '../../src/evolution/participantStructuredOutputContract';
```

Inside `buildConfigurationExecutionPrompt()`, replace:

```ts
'Return only configuration-execution-result-v1 JSON.',
```

with:

```ts
renderStructuredFinalOutputContractV1({
  roleSchemaName: 'configuration-execution-result-v1',
}),
```

Do not rename the existing schema version or production result interface.

- [ ] **Step 6: Run Configuration Execution and contract tests**

Run:

```bash
npm exec -- tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: both PASS.

- [ ] **Step 7: Checkpoint the Task 4 diff**

Run:

```bash
git diff --check -- \
  scripts/evolution/configurationExecutionParticipant.ts \
  tests/evolution/p2-configuration-participant.test.ts \
  tests/evolution/problemAgnosticSolutionContracts.test.ts
```

Confirm all invalid envelope cases are rejected by existing parser behavior, not new repair/envelope extraction code.

---

### Task 5: Static verification, protected-boundary checks, and delivery verdict

**Files:**
- No new production files.
- Verify all task files and explicitly protected files.

**Interfaces:**
- Consumes all Tasks 1-4.
- Produces the engineering verdict:
  ```text
  STRUCTURED_FINAL_OUTPUT_CONTRACT_V1_DELIVERED
  ```

- [ ] **Step 1: Run all targeted V1 tests**

Run:

```bash
npm exec -- tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npm exec -- tsx tests/evolution/solutionAgentLoop.test.ts
npm exec -- tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec -- tsx tests/evolution/p2-configuration-participant.test.ts
```

Expected: all four PASS.

- [ ] **Step 2: Run TypeScript typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit 0.

If unrelated concurrent Wealth/product work breaks typecheck, do not fix it in this task. Prove whether the failure is outside the scoped files and report `STATIC_VERIFICATION_BLOCKED_BY_UNRELATED_WORKTREE` rather than widening scope.

- [ ] **Step 3: Run scoped whitespace/diff validation**

Run:

```bash
git diff --check -- \
  src/evolution/participantStructuredOutputContract.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  scripts/evolution/configurationExecutionParticipant.ts \
  tests/evolution/problemAgnosticSolutionContracts.test.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/solutionReviewerLoop.test.ts \
  tests/evolution/p2-configuration-participant.test.ts
```

Expected: exit 0.

- [ ] **Step 4: Verify the shared renderer has no Role branching**

Run:

```bash
grep -nE "role[[:space:]]*===|role[[:space:]]*!==|switch[[:space:]]*\\(.*role|SolutionWorkV1.*SolutionReviewV1|SolutionReviewV1.*configuration-execution" \
  src/evolution/participantStructuredOutputContract.ts
```

Expected: no matches.

Then inspect:

```bash
cat src/evolution/participantStructuredOutputContract.ts
```

Expected: the only Role-varying input is `roleSchemaName`.

- [ ] **Step 5: Verify forbidden production boundaries were not modified by this task**

Before implementation, the executor must record baseline hashes for protected files:

```bash
shasum -a 256 \
  scripts/evolution/problemAgnosticSolution/agentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/cursorAgentParticipant.ts \
  scripts/evolution/problemAgnosticSolution/solutionParticipantSkills.ts \
  skills/repository-grounded-investigation/SKILL.md \
  src/evolution/solutionWorkContract.ts \
  src/evolution/solutionReviewContract.ts
```

After implementation, run the exact same command.

Expected: hashes are identical to the executor's pre-task baseline.

Also confirm no task-authored changes exist in Orchestrator, failure routing, Execution Trace, Run Report, provider/runtime config, timeout, or retry paths. Because the checkout may already be dirty, compare against the pre-task scoped baseline rather than blindly treating every existing `git diff` as task-authored.

- [ ] **Step 6: Inspect the final scoped task diff**

Run:

```bash
git diff -- \
  src/evolution/participantStructuredOutputContract.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  scripts/evolution/configurationExecutionParticipant.ts \
  tests/evolution/problemAgnosticSolutionContracts.test.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/solutionReviewerLoop.test.ts \
  tests/evolution/p2-configuration-participant.test.ts
```

Review for:
- one shared renderer;
- no Role-specific branching in the renderer;
- three Pilot Role integrations;
- no output repair;
- no parser relaxation;
- no unrelated refactor.

- [ ] **Step 7: Report the static delivery verdict and STOP**

If all engineering acceptance checks pass, report:

```text
STRUCTURED_FINAL_OUTPUT_CONTRACT_V1_DELIVERED
```

Do **not** claim:
- `MODEL_OUTPUT_STABILIZED`
- `CURSOR_PARITY_FIXED`
- `COMMUNICATION_CONTRACT_COMPLETE`

The implementation report must include:

1. verdict;
2. baseline branch/HEAD and pre-existing dirty state;
3. modified files;
4. shared renderer signature and exact pilot schema labels;
5. evidence that the renderer has no Role-specific branching;
6. Solution delivery test result;
7. Reviewer delivery test result;
8. Configuration Execution delivery test result;
9. fail-closed envelope regression result;
10. typecheck result;
11. scoped `git diff --check` result;
12. protected-file hash comparison;
13. confirmation that timeout/retry/provider/adapters/Orchestrator/Trace/Report/Skills/Role schemas were unchanged;
14. deviations or unrelated-worktree blockers.

Then STOP. Do not run model/Participant conformance trials inside this implementation task.

---

## Follow-on Experiment — Not Part of This Implementation Plan

After `STRUCTURED_FINAL_OUTPUT_CONTRACT_V1_DELIVERED`, create a separate, explicitly authorized **Contract Conformance Matrix** task.

It should:

1. use a trivial exact contract-only payload:
   ```json
   {
     "schemaVersion": "participant-contract-conformance-v1",
     "status": "OK",
     "message": "contract-confirmed"
   }
   ```
2. compare `Codex current binding` and `Cursor Auto` first;
3. verify local Cursor explicit model-selection capability before adding fixed-model bindings;
4. run three small trials per binding;
5. classify each trial only as:
   - `PASS`
   - `ENVELOPE_FAILURE`
   - `ROLE_SCHEMA_FAILURE`
   - `RUNTIME_FAILURE`
   - `TIMEOUT`
6. use strict `JSON.parse` plus exact test-schema validation;
7. allow deterministic provider-native terminal-field extraction, but prohibit semantic JSON extraction/repair;
8. keep contract reliability separate from real Solution reasoning performance.

Only after that matrix is understood should a fixed historical Solution model matrix be authorized.

---

## Plan Self-Review

### Spec coverage

Covered:
- shared V1 contract and prompt wording: Task 1;
- exactly one/bare JSON/no prose/no Markdown/no repair: Tasks 1 and 4;
- Role-specific schema labels without shared business logic: Tasks 1-4;
- Solution/Reviewer/Configuration Execution pilot: Tasks 2-4;
- strict receiver preservation and fail-closed regression: Tasks 1 and 4;
- provider/runtime/timeout/adapter/schema non-goals: Global Constraints + Task 5;
- Role-agnostic renderer acceptance criterion: Tasks 1 and 5;
- static delivery verdict: Task 5;
- conformance matrix sequencing: Follow-on Experiment section.

No spec requirement intended for V1 implementation is missing.

### Placeholder scan

No `TBD`, `TODO`, “implement later”, or unspecified testing steps remain.

### Type/interface consistency

The plan consistently uses:

```ts
renderStructuredFinalOutputContractV1({
  roleSchemaName: string,
})
```

Pilot labels:
- `SolutionWorkV1`
- `SolutionReviewV1`
- `configuration-execution-result-v1`

The last label intentionally follows current repository authority rather than inventing a new production type.

### Scope check

The implementation modifies one new shared prompt module, three existing prompt builders, and focused tests only. Provider adapters, parsers, failure taxonomy, Orchestrator, runtime, model routing, and broader Participant rollout remain separate work.
