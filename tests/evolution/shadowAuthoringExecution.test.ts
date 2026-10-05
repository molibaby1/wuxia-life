import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chmod, cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runShadowAuthoringExecution } from '../../scripts/evolution/autonomousAuthoring/shadowAuthoringExecutionParticipant';
import { createCodexReferenceParticipant } from '../../scripts/evolution/operator/resolveParticipantBinding';
import {
  buildDeterministicPromotionPatch,
  compareWorkspaceSnapshots,
} from '../../scripts/evolution/autonomousAuthoring/workspaceChangeSet';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import type {
  WorkspaceAgentJobInput,
  WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { captureAuthoritativeFingerprint, captureWorkspaceSnapshot } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import { validateAutonomousAuthoringAdmission } from '../../src/evolution/autonomousAuthoringAdmissionContract';
import { validateAutonomousAuthoringProposal } from '../../src/evolution/autonomousAuthoringContract';
import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
} from '../../src/evolution/preschoolSharedNeutralAuthoringContract';
import { validateSolutionReview } from '../../src/evolution/solutionReviewContract';
import { validateSolutionWork } from '../../src/evolution/solutionWorkContract';
import { validateShadowAuthoringExecutionParticipantResult } from '../../src/evolution/shadowAuthoringResultContract';

const SHADOW_RESULT_SCHEMA_VERSION = 'shadow-authoring-execution-participant-result-v1';

export function acceptedInputs() {
  const responsibility = {
    responsibilityId: 'responsibility-000001',
    primaryLifeFunction: 'shared cooperation',
    playerVisibleNeed: 'a child can help with a shared task',
    evidenceRefs: ['PRIVATE_PHASE0_SENTINEL'],
  };
  const proposal = validateAutonomousAuthoringProposal({
    schemaVersion: 'autonomous-authoring-proposal-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: 1,
    gapClassification: 'CONTENT_GAP',
    gapSubtype: 'CONTENT_CAPACITY_GAP',
    applicabilityClaim: 'APPLICABLE',
    authorityRefs: ['docs/governance/product-decisions.md'],
    sourceEvidenceRefs: ['PRIVATE_PHASE0_SENTINEL'],
    responsibilities: [responsibility],
    contractPayload: {
      schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1',
      cards: [{
        responsibilityId: responsibility.responsibilityId,
        primaryLifeFunction: responsibility.primaryLifeFunction,
        playerVisibleNeed: responsibility.playerVisibleNeed,
        developmentalAgeJustification: {
          ageMin: 4,
          whyNotEarlier: 'The child needs more coordination.',
          whyFromThisAge: 'The child can now join the activity.',
          whyThroughAgeSeven: 'The need remains useful through age seven.',
        },
        concreteSceneConcept: 'A child helps carry a shared basket.',
        existingContentDistinction: {
          closestEntryIds: ['preschool_neutral_existing'],
          sharedSemanticArea: 'Helping together.',
          specificDistinction: 'This scene practices sharing responsibility.',
        },
        actorClass: 'TRANSIENT_ROLE_ONLY',
        pastEvidenceConsumed: 'NONE',
        meaningfulPlayerDecision: 'NONE',
        durableResult: 'EVENT_HISTORY_ID_ONLY',
        futureHook: 'NONE',
        originPortability: 'The scene works across origins.',
        scopeCheck: 'CONTRACT_PRESERVING',
        proposedEntry: {
          id: 'preschool_neutral_shared_cooperation',
          title: '一起抬起小篮子',
          text: '你和伙伴各扶住小篮子的一边，把散落的木片送到屋檐下。',
          originTags: ['neutral'],
          ageMin: 4,
          ageMax: 7,
        },
      }],
    },
  });
  const solution = validateSolutionWork({
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: 'problem-shadow-test',
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Append the accepted shared-neutral passive entry.',
      rationale: 'It addresses one accepted responsibility.',
      repoRefs: [PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH],
      artifactRefs: ['PRIVATE_PHASE0_SENTINEL'],
      changeScope: 'program',
      expectedPlayerObservableDifference: 'One additional distinct childhood memory can appear.',
      risks: [],
      unknowns: [],
      autonomousAuthoring: proposal,
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One accepted card.',
    repoRefs: [PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH],
    artifactRefs: ['PRIVATE_PHASE0_SENTINEL'],
  });
  const review = validateSolutionReview({
    schemaVersion: 'solution-review-v1',
    problemId: solution.problemId,
    decision: 'ACCEPT_OPTION',
    acceptedOptionId: 'option-000001',
    scopeAssessment: 'code_required',
    executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
    autonomousAuthoringAssessment: {
      schemaVersion: 'autonomous-authoring-review-assessment-v1',
      contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
      contractVersion: 1,
      applicabilityAssessment: 'APPLICABLE',
      conformance: 'CONFORMING',
      executionEnvelope: 'WITHIN_ENVELOPE',
      assessment: 'The accepted card is distinct and contract-preserving.',
      blockers: [],
    },
    assessment: 'Accepted for shadow implementation.',
    repoRefs: [PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH],
    artifactRefs: ['PRIVATE_PHASE0_SENTINEL'],
    concerns: [],
  });
  const admission = validateAutonomousAuthoringAdmission({
    schemaVersion: 'autonomous-authoring-admission-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: 1,
    status: 'ELIGIBLE',
    proposalSha256: sha256Hex(canonicalJson(proposal)),
    reviewSha256: sha256Hex(canonicalJson(review)),
    sourceRunRef: 'cohort-run-shadow-test',
    authorityRefs: ['docs/governance/product-decisions.md'],
    allowedWritePaths: [...PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS],
    maxNewEntries: 8,
    capacityEvidence: {
      schemaVersion: 'preschool-capacity-evidence-v1',
      runRef: 'cohort-run-shadow-test',
      evidenceMode: 'STRUCTURAL_EXHAUSTION',
      canonicalOriginTag: 'martial',
      preConsumedEntryIds: [],
      beats: [{
        sequence: 1,
        age: 4,
        selectedEntryId: 'existing-entry',
        kind: 'AUTHORED',
        legalUnconsumedCountBeforeSelection: 1,
      }],
      demandBeats: 1,
      authoredBeats: 1,
      gapBeats: 0,
      foreignOriginLeakCount: 0,
      duplicateAuthoredCount: 0,
    },
    reasons: [],
  });
  return { solution, review, admission, proposal };
}

async function testCanonicalSnapshotsAndDeterministicPatch(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'shadow-change-set-'));
  const beforeRoot = join(root, 'before-source');
  const afterRoot = join(root, 'after-source');
  await mkdir(join(beforeRoot, 'src'), { recursive: true });
  await mkdir(join(afterRoot, 'src'), { recursive: true });
  await writeFile(join(beforeRoot, 'src/changed.txt'), 'before\n');
  await writeFile(join(beforeRoot, 'src/deleted.txt'), 'delete me\n');
  await writeFile(join(afterRoot, 'src/changed.txt'), 'after\n');
  await writeFile(join(afterRoot, 'src/added.txt'), 'new file\n');
  await mkdir(join(beforeRoot, '.tmp/evolution'), { recursive: true });
  await mkdir(join(afterRoot, '.tmp/evolution'), { recursive: true });
  await writeFile(join(beforeRoot, '.tmp/evolution/hidden.txt'), 'before');
  await writeFile(join(afterRoot, '.tmp/evolution/hidden.txt'), 'after');

  const before = await captureWorkspaceSnapshot(beforeRoot);
  const after = await captureWorkspaceSnapshot(afterRoot);
  assert.equal(before.entries.some(entry => entry.path === '.tmp/evolution/hidden.txt'), false);
  const changes = compareWorkspaceSnapshots(before, after);
  assert.deepEqual(changes.map(change => [change.path, change.changeType]), [
    ['src/added.txt', 'ADDED'],
    ['src/changed.txt', 'MODIFIED'],
    ['src/deleted.txt', 'DELETED'],
  ]);
  assert.equal(changes[0]?.beforeSha256, null);
  assert.equal(changes[0]?.afterSha256, sha256Hex('new file\n'));
  assert.equal(changes[2]?.beforeSha256, sha256Hex('delete me\n'));
  assert.equal(changes[2]?.afterSha256, null);

  const first = await buildDeterministicPromotionPatch({ beforeRoot, afterRoot, changes });
  const second = await buildDeterministicPromotionPatch({ beforeRoot, afterRoot, changes });
  assert.deepEqual(first.patch, second.patch);
  assert.equal(first.patchSha256, sha256Hex(first.patch));
  assert.equal(first.patch.at(-1), 0x0a);
  assert.match(first.patch.toString('utf8'), /diff --git a\/src\/changed\.txt b\/src\/changed\.txt/);
  assert.doesNotMatch(first.patch.toString('utf8'), /before-source|after-source|a\/before\/|b\/after\//);
}

function continuationCapableParticipant(
  initialScript: string,
  continuationOutput: string,
  continuationCalls: { count: number },
  options?: {
    timeoutMs?: number;
    onInitialJob?: (input: WorkspaceAgentJobInput) => void;
  },
): WorkspaceAgentParticipantOptions {
  const threadRef = { provider: 'shadow-test', opaqueId: 'shadow-thread-000001' };
  return {
    executable: process.execPath,
    ...(options?.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    buildArgs: input => {
      options?.onInitialJob?.(input);
      return ['-e', initialScript];
    },
    interpretCompletedOutput: ({ stdout, expectedThreadRef }) => ({
      ok: true,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? threadRef,
    }),
    sameThreadContinuation: {
      provider: threadRef.provider,
      buildArgs: () => {
        continuationCalls.count += 1;
        return ['-e', `process.stdout.write(${JSON.stringify(continuationOutput)})`];
      },
    },
  };
}

async function createReferenceShadowParticipant(
  root: string,
  invocationName: string,
  failCorrection: boolean,
): Promise<{ participant: WorkspaceAgentParticipantOptions; callLogPath: string }> {
  const executablePath = join(root, `${invocationName}-codex`);
  const callLogPath = join(root, `${invocationName}-calls.jsonl`);
  const threadId = '31234567-89ab-cdef-0123-456789abcdef';
  const invalidOutput = JSON.stringify({
    schemaVersion: 'preschool-shadow-authoring-result-v1',
    status: 'completed',
    changedFiles: [],
    verificationCommandsRun: [],
    deviations: [],
  });
  const validOutput = JSON.stringify({
    schemaVersion: SHADOW_RESULT_SCHEMA_VERSION,
    status: 'completed',
    changedFiles: [],
    verificationCommandsRun: [],
    deviations: [],
  });
  const script = [
    '#!/usr/bin/env node',
    "const fs = require('node:fs');",
    'const args = process.argv.slice(2);',
    "const isContinuation = args.includes('resume');",
    `fs.appendFileSync(${JSON.stringify(callLogPath)}, JSON.stringify(args) + '\\n');`,
    `const threadId = ${JSON.stringify(threadId)};`,
    `const invalidOutput = ${JSON.stringify(invalidOutput)};`,
    `const validOutput = ${JSON.stringify(validOutput)};`,
    `const payload = isContinuation && ${JSON.stringify(!failCorrection)} ? validOutput : invalidOutput;`,
    'const events = [',
    "  { type: 'thread.started', thread_id: threadId },",
    "  { type: 'turn.started', turn_id: isContinuation ? 'turn-000002' : 'turn-000001' },",
    "  { type: 'item.completed', item: { type: 'agent_message', text: payload } },",
    "  { type: 'turn.completed', turn_id: isContinuation ? 'turn-000002' : 'turn-000001' },",
    "].map(event => JSON.stringify(event)).join('\\n') + '\\n';",
    'process.stdout.write(events);',
  ].join('\n');
  await writeFile(executablePath, script);
  await chmod(executablePath, 0o755);
  return {
    participant: createCodexReferenceParticipant({
      executable: executablePath,
      executableVersion: 'codex-reference-test 1',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      nativeOutputSchemaPath: join(root, 'solution-only-native-schema.json'),
      nativeOutputSchemaSha256: 'a'.repeat(64),
      ambientCodexConfigSha256: 'ABSENT',
    }),
    callLogPath,
  };
}

async function testShadowExecutorUsesExactAcceptedCardsAndHostChangeSet(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'shadow-executor-'));
  const repositoryRoot = join(root, 'repository');
  await mkdir(join(repositoryRoot, 'src/data/lines'), { recursive: true });
  await mkdir(join(repositoryRoot, 'tests'), { recursive: true });
  await writeFile(join(repositoryRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), '{"entries":[]}\n');
  for (const testPath of PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS) {
    await writeFile(join(repositoryRoot, testPath), 'export const baseline = true;\n');
  }
  const replayRoot = join(root, 'fresh-baseline');
  await cp(repositoryRoot, replayRoot, { recursive: true });
  const beforeFingerprint = await captureAuthoritativeFingerprint(repositoryRoot);
  const accepted = acceptedInputs();
  const artifactRoot = join(root, 'shadow-authoring-artifacts');
  const admissionPath = join(artifactRoot, 'admission.json');
  let admissionPresentBeforeParticipant = false;
  let observedJob: WorkspaceAgentJobInput | undefined;
  const participantResult = {
    schemaVersion: 'shadow-authoring-execution-participant-result-v1',
    status: 'completed',
    changedFiles: ['participant-claimed-only.txt'],
    verificationCommandsRun: ['npm exec tsx tests/preschoolPassiveSpineTests.ts'],
    deviations: [],
  };
  const output = JSON.stringify(participantResult);
  const script = [
    "const fs = require('node:fs');",
    "fs.writeFileSync('src/data/lines/preschool-passive-spine.json', '{\\\"entries\\\":[{\\\"id\\\":\\\"preschool_neutral_shared_cooperation\\\"}]}\\n');",
    "fs.appendFileSync('tests/preschoolPassiveSpineTests.ts', '\\n// appended focused regression\\n');",
    "fs.appendFileSync('tests/annualPassiveMemoryTests.ts', '\\n// appended focused regression\\n');",
    "fs.writeFileSync('src/undeclared-shadow-change.txt', 'host must detect this');",
    'process.stdout.write("not-json");',
  ].join('\n');
  const continuationCalls = { count: 0 };
  const result = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'isolated-workspaces'),
    artifactRoot,
    invocationRef: 'shadow-authoring-invocation-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: continuationCapableParticipant(script, output, continuationCalls, {
      onInitialJob: input => {
        observedJob = input;
        admissionPresentBeforeParticipant = existsSync(admissionPath);
      },
    }),
  });

  assert.deepEqual({
    admissionPresentBeforeParticipant,
    admission: existsSync(admissionPath),
    changeSet: existsSync(join(artifactRoot, 'change-set.json')),
    executionPatch: existsSync(join(artifactRoot, 'execution.patch')),
  }, {
    admissionPresentBeforeParticipant: true,
    admission: true,
    changeSet: true,
    executionPatch: true,
  });
  assert.equal(result.status, 'completed');
  assert.equal(continuationCalls.count, 1);
  assert.equal(result.participantResult.changedFiles[0], 'participant-claimed-only.txt');
  assert.deepEqual(result.canonicalChanges.map(change => change.path), [
    'src/data/lines/preschool-passive-spine.json',
    'src/undeclared-shadow-change.txt',
    'tests/annualPassiveMemoryTests.ts',
    'tests/preschoolPassiveSpineTests.ts',
  ]);
  assert.notDeepEqual(result.canonicalChanges.map(change => change.path), result.participantResult.changedFiles);
  assert.equal(observedJob?.role, 'configuration-execution');
  assert.equal(observedJob?.workspaceRoot, result.preparedWorkspace.workspaceRoot);
  assert.ok(observedJob?.prompt.includes(canonicalJson(PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS)));
  for (const allowedPath of PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS) {
    assert.ok(observedJob?.prompt.includes(allowedPath), `prompt is missing allowed path ${allowedPath}`);
  }
  const acceptedCardsJson = canonicalJson(accepted.proposal.contractPayload?.cards);
  assert.ok(observedJob?.prompt.includes(acceptedCardsJson));
  assert.doesNotMatch(observedJob?.prompt ?? '', /PRIVATE_PHASE0_SENTINEL/);
  assert.match(observedJob?.prompt ?? '', /Do not commit, push, or merge/);
  const observedPrompt = observedJob?.prompt ?? '';
  assert.ok(observedPrompt.includes('AUTONOMOUS_AUTHORING_MISSING_ENTRY'));
  assert.ok(observedPrompt.includes('process.argv[1]'));
  assert.ok(observedPrompt.includes('import.meta.url'));
  for (const testPath of PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS) {
    assert.ok(observedPrompt.includes(testPath.split('/').at(-1)!), `prompt is missing ${testPath}`);
  }
  assert.ok(observedPrompt.includes('preschool_neutral_shared_cooperation'));
  assert.ok(observedPrompt.includes('AUTONOMOUS_AUTHORING_MISSING_ENTRY: ${acceptedId}'));
  assert.ok(observedPrompt.includes(
    'Error: AUTONOMOUS_AUTHORING_MISSING_ENTRY: <accepted ID copied exactly from Accepted Cards>',
  ));
  assert.ok(!observedPrompt.replace(acceptedCardsJson, '').includes('preschool_neutral_shared_cooperation'));
  assert.match(observedPrompt, /Each focused RED command must emit exactly one Error line/);
  assert.match(observedPrompt, /GREEN must pass with the Shadow catalog/);
  assert.equal(result.authoritativeFingerprintBefore, beforeFingerprint);
  assert.equal(result.authoritativeFingerprintAfter, beforeFingerprint);
  assert.equal(await captureAuthoritativeFingerprint(repositoryRoot), beforeFingerprint);
  assert.equal(result.promotionPatchSha256, sha256Hex(result.promotionPatch));
  assert.match(result.promotionPatch.toString('utf8'), /diff --git a\/src\/undeclared-shadow-change\.txt b\/src\/undeclared-shadow-change\.txt/);
  const admissionBytes = await readFile(admissionPath);
  assert.deepEqual(admissionBytes, Buffer.from(canonicalJson(accepted.admission)));
  assert.equal(sha256Hex(admissionBytes), result.admissionSha256);
  const changeSet = JSON.parse(await readFile(join(artifactRoot, 'change-set.json'), 'utf8')) as {
    schemaVersion: string;
    authoritativeFingerprintBefore: string;
    authoritativeFingerprintAfter: string;
    patchSha256: string;
    patchByteLength: number;
    changes: typeof result.canonicalChanges;
  };
  assert.deepEqual(Object.keys(changeSet).sort(), [
    'schemaVersion', 'authoritativeFingerprintBefore', 'authoritativeFingerprintAfter',
    'patchSha256', 'patchByteLength', 'changes',
  ].sort());
  assert.equal(changeSet.schemaVersion, 'shadow-authoring-change-set-v1');
  assert.equal(changeSet.authoritativeFingerprintBefore, result.authoritativeFingerprintBefore);
  assert.equal(changeSet.authoritativeFingerprintAfter, result.authoritativeFingerprintAfter);
  assert.deepEqual(changeSet.changes, result.canonicalChanges);
  const executionPatch = await readFile(join(artifactRoot, 'execution.patch'));
  assert.deepEqual(executionPatch, result.promotionPatch);
  assert.equal(changeSet.patchSha256, result.promotionPatchSha256);
  assert.equal(changeSet.patchSha256, sha256Hex(executionPatch));
  assert.equal(changeSet.patchByteLength, executionPatch.length);

  const replayBefore = await captureWorkspaceSnapshot(replayRoot);
  const appliedPatch = spawnSync('git', ['apply', '--'], {
    cwd: replayRoot,
    input: executionPatch,
    encoding: 'utf8',
  });
  assert.equal(appliedPatch.status, 0, appliedPatch.stderr);
  const replayAfter = await captureWorkspaceSnapshot(replayRoot);
  const replayedChanges = compareWorkspaceSnapshots(replayBefore, replayAfter);
  assert.deepEqual(replayedChanges, changeSet.changes);
  for (const change of changeSet.changes) {
    const replayed = replayAfter.entries.find(entry => entry.path === change.path);
    assert.equal(replayed?.sha256 ?? null, change.afterSha256, `replayed hash mismatch for ${change.path}`);
  }
  assert.equal(await readFile(join(result.artifactRoot, 'participant-prompt.txt'), 'utf8'), observedJob?.prompt);
  assert.equal(await readFile(join(result.artifactRoot, 'raw-output.txt'), 'utf8'), output);
  assert.equal(await readFile(join(result.artifactRoot, 'terminal-attempt-0.txt'), 'utf8'), 'not-json');
  assert.equal(await readFile(join(result.artifactRoot, 'terminal-attempt-1.txt'), 'utf8'), output);
  assert.ok(await readFile(join(result.artifactRoot, 'participant-envelope-retransmission-prompt-1.txt'), 'utf8'));
  assert.equal(
    result.executionTrace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );
  assert.equal(
    result.executionTrace.events.filter(event => event.type === 'participant_terminal_validation' && event.attempt === 1).length,
    1,
  );

  const referenceCorrection = await createReferenceShadowParticipant(root, 'reference-schema-correction', false);
  const recoveredSchemaFailure = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'reference-schema-correction-workspaces'),
    artifactRoot: join(root, 'reference-schema-correction-artifacts'),
    invocationRef: 'shadow-authoring-reference-schema-correction-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: referenceCorrection.participant,
  });
  assert.equal(recoveredSchemaFailure.status, 'completed');
  assert.equal(recoveredSchemaFailure.participantResult?.schemaVersion, SHADOW_RESULT_SCHEMA_VERSION);
  assert.equal(
    recoveredSchemaFailure.executionTrace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );
  const correctedPrompt = await readFile(
    join(recoveredSchemaFailure.artifactRoot, 'participant-envelope-retransmission-prompt-1.txt'),
    'utf8',
  );
  assert.ok(correctedPrompt.includes(SHADOW_RESULT_SCHEMA_VERSION));
  const correctionCalls = (await readFile(referenceCorrection.callLogPath, 'utf8'))
    .trim()
    .split('\n')
    .map(line => JSON.parse(line) as string[]);
  assert.equal(correctionCalls.length, 2);
  assert.equal(correctionCalls[0]?.includes('--json'), true);
  assert.equal(correctionCalls[0]?.includes('--ephemeral'), false);
  assert.equal(correctionCalls[0]?.includes('--output-schema'), false);
  assert.equal(correctionCalls[1]?.includes('resume'), true);
  assert.equal(correctionCalls[1]?.includes('31234567-89ab-cdef-0123-456789abcdef'), true);
  assert.equal(correctionCalls[1]?.includes('-m'), true);
  assert.equal(correctionCalls[1]?.[correctionCalls[1]!.indexOf('-m') + 1], 'gpt-6-luna');
  assert.equal(correctionCalls[1]?.includes('model_reasoning_effort="max"'), true);
  assert.equal(correctionCalls[1]?.includes('--output-schema'), false);
  assert.match(correctionCalls[0]?.at(-1) ?? '', /schemaVersion must be exactly "shadow-authoring-execution-participant-result-v1"/);

  const repeatedSchemaFailure = await createReferenceShadowParticipant(root, 'reference-schema-failure', true);
  const terminalSchemaFailure = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'reference-schema-failure-workspaces'),
    artifactRoot: join(root, 'reference-schema-failure-artifacts'),
    invocationRef: 'shadow-authoring-reference-schema-failure-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: repeatedSchemaFailure.participant,
  });
  assert.equal(terminalSchemaFailure.status, 'failed');
  assert.equal(terminalSchemaFailure.participantResult, null);
  assert.match(terminalSchemaFailure.failure ?? '', /shadow-authoring-execution-participant-result-v1/);
  assert.equal(
    terminalSchemaFailure.executionTrace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );
  assert.equal(
    (await readFile(repeatedSchemaFailure.callLogPath, 'utf8')).trim().split('\n').length,
    2,
  );

  assert.throws(
    () => validateShadowAuthoringExecutionParticipantResult({
      schemaVersion: 'preschool-shadow-authoring-result-v1',
      status: 'completed',
      changedFiles: [],
      verificationCommandsRun: [],
      deviations: [],
    }),
    /shadow-authoring-execution-participant-result-v1/,
  );

  const failedParticipantResult = JSON.stringify({ ...participantResult, status: 'failed' });
  const runtimeContinuationCalls = { count: 0 };
  const runtimeBuildCalls = { count: 0 };
  const runtimeFailure = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'timeout-workspaces'),
    artifactRoot: join(root, 'timeout-shadow-authoring-artifacts'),
    invocationRef: 'shadow-authoring-timeout-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: continuationCapableParticipant(
      'setInterval(() => {}, 1000);',
      output,
      runtimeContinuationCalls,
      { timeoutMs: 50, onInitialJob: () => { runtimeBuildCalls.count += 1; } },
    ),
  });
  assert.equal(runtimeFailure.status, 'failed');
  assert.equal(runtimeFailure.executionTrace.terminal.outcome, 'timeout');
  assert.match(runtimeFailure.failure ?? '', /timed out after 50ms/);
  assert.equal(runtimeBuildCalls.count, 1);
  assert.equal(runtimeContinuationCalls.count, 0);

  const semanticContinuationCalls = { count: 0 };
  const semanticBuildCalls = { count: 0 };
  const semanticFailure = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'semantic-failure-workspaces'),
    artifactRoot: join(root, 'semantic-failure-shadow-authoring-artifacts'),
    invocationRef: 'shadow-authoring-semantic-failure-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: continuationCapableParticipant(
      `process.stdout.write(${JSON.stringify(failedParticipantResult)});`,
      output,
      semanticContinuationCalls,
      { onInitialJob: () => { semanticBuildCalls.count += 1; } },
    ),
  });
  assert.equal(semanticFailure.status, 'failed');
  assert.equal(semanticFailure.participantResult?.status, 'failed');
  assert.equal(semanticFailure.failure, 'Shadow Executor reported failed status');
  assert.equal(semanticBuildCalls.count, 1);
  assert.equal(semanticContinuationCalls.count, 0);

  const fingerprintContinuationCalls = { count: 0 };
  const fingerprintBuildCalls = { count: 0 };
  const authoritativeChangePath = join(repositoryRoot, 'participant-authoritative-change.txt');
  const fingerprintFailure = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'fingerprint-workspaces'),
    artifactRoot: join(root, 'fingerprint-shadow-authoring-artifacts'),
    invocationRef: 'shadow-authoring-fingerprint-failure-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: continuationCapableParticipant(
      [
        `require('node:fs').writeFileSync(${JSON.stringify(authoritativeChangePath)}, 'unauthorized');`,
        `process.stdout.write(${JSON.stringify(output)});`,
      ].join('\n'),
      output,
      fingerprintContinuationCalls,
      { onInitialJob: () => { fingerprintBuildCalls.count += 1; } },
    ),
  });
  assert.equal(fingerprintFailure.status, 'failed');
  assert.equal(fingerprintFailure.failure, 'authoritative repository fingerprint changed during shadow execution');
  assert.notEqual(fingerprintFailure.authoritativeFingerprintAfter, fingerprintFailure.authoritativeFingerprintBefore);
  assert.equal(await captureAuthoritativeFingerprint(repositoryRoot), fingerprintFailure.authoritativeFingerprintAfter);
  assert.equal(fingerprintBuildCalls.count, 1);
  assert.equal(fingerprintContinuationCalls.count, 0);
}

export async function runShadowAuthoringExecutionTests(): Promise<void> {
  await testCanonicalSnapshotsAndDeterministicPatch();
  await testShadowExecutorUsesExactAcceptedCardsAndHostChangeSet();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runShadowAuthoringExecutionTests()
    .then(() => console.log('shadowAuthoringExecution.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
