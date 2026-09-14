import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CONSERVATIVE_SELECTION_SYSTEM_PROMPT,
  buildConservativeSelectionUserContent,
} from '../../scripts/evolution/conservativeSelectionReplay/deepseekConservativeSelection';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';
import { prepareConservativeSelectionReplay } from '../../scripts/evolution/conservativeSelectionReplay/prepareConservativeSelectionReplay';
import { runConservativeSelectionReplay } from '../../scripts/evolution/conservativeSelectionReplay/runConservativeSelectionReplay';
import type { ConservativeSelectionInvoke } from '../../scripts/evolution/conservativeSelectionReplay/deepseekConservativeSelection';

export async function runConservativeSelectionReplayExecutionTests(): Promise<void> {
  const prompt = CONSERVATIVE_SELECTION_SYSTEM_PROMPT;
  assert.match(prompt, /deterministic fallback/i);
  assert.match(prompt, /Evidence Readiness/i);
  assert.match(prompt, /Problem Specificity/i);
  assert.match(prompt, /clear superiority/i);
  assert.match(prompt, /broader.*does not.*better|更宏大.*不/i);
  assert.match(prompt, /KEEP_BASELINE/);
  assert.match(prompt, /OVERRIDE/);
  assert.match(prompt, /NO_CLEAR_PREFERENCE/);
  assert.match(prompt, /baseline.*eligible.*KEEP/i);
  assert.match(prompt, /exactly one/i);
  assert.match(prompt, /schemaVersion/);
  assert.match(prompt, /ae-conservative-selection-response-v1/);
  assert.match(prompt, /decision/);
  assert.match(prompt, /selectedCandidateRef/);
  assert.match(prompt, /baselineEligibility/);
  assert.match(prompt, /challengerEligibility/);
  assert.match(prompt, /decisiveComparison/);
  assert.match(prompt, /boundednessReason/);
  assert.match(prompt, /overallReason/);
  assert.match(prompt, /No extra top-level fields/i);
  assert.match(prompt, /No extra rationale fields/i);
  assert.match(prompt, /KEEP_BASELINE[\s\S]*baselineCandidateRef/);
  assert.match(prompt, /OVERRIDE[\s\S]*challenger[\s\S]*not baseline/i);
  assert.match(prompt, /NO_CLEAR_PREFERENCE[\s\S]*null/i);
  assert.doesNotMatch(prompt, /historical selected/i);
  assert.doesNotMatch(prompt, /sourceIndex/i);
  assert.doesNotMatch(prompt, /sourceHypothesisId/i);
  assert.doesNotMatch(prompt, /historicalSelectedHypothesisId/i);

  const userContent = buildConservativeSelectionUserContent({
    schemaVersion: 'ae-conservative-selection-input-v1',
    baselineCandidateRef: 'candidate-A',
    candidates: [],
  });
  assert.equal(userContent, canonicalJson({
    schemaVersion: 'ae-conservative-selection-input-v1',
    baselineCandidateRef: 'candidate-A',
    candidates: [],
  }));

  const prepared = await prepareConservativeSelectionReplay({
    repoRoot: process.cwd(),
    sourceRoot: join(process.cwd(), 'artifacts/ae-selection-priority-replay-v1-20260911'),
    outputRoot: join(await mkdtemp(join(tmpdir(), 'conservative-selection-runner-')), 'experiment'),
  });
  const smallExperiment = {
    ...prepared.experiment,
    jobCount: 2,
    jobs: prepared.experiment.jobs.slice(0, 2),
    invocationOrder: prepared.experiment.invocationOrder.slice(0, 2),
  };
  await writeFile(join(prepared.outputRoot, 'experiment.json'), `${canonicalJson(smallExperiment)}\n`);
  const validResponse = JSON.stringify({
    schemaVersion: 'ae-conservative-selection-response-v1',
    decision: 'KEEP_BASELINE',
    selectedCandidateRef: 'candidate-A',
    rationale: {
      baselineEligibility: 'ELIGIBLE',
      challengerEligibility: 'NOT_APPLICABLE',
      decisiveComparison: 'No challenger has clear superiority.',
      boundednessReason: 'The baseline is already a bounded investigation.',
      overallReason: 'Keep the eligible deterministic fallback.',
    },
  });
  let callCount = 0;
  const invoke: ConservativeSelectionInvoke = async () => {
    callCount += 1;
    const rawParticipantResponse = callCount === 1
      ? validResponse
      : JSON.stringify({ ...JSON.parse(validResponse), score: 0 });
    return {
      ok: true,
      responseId: `response-${callCount}`,
      model: 'deepseek-v4-flash',
      httpStatus: 200,
      rawProviderResponse: JSON.stringify({ choices: [{ message: { content: rawParticipantResponse } }] }),
      rawParticipantResponse,
    };
  };
  const execution = await runConservativeSelectionReplay({
    repoRoot: process.cwd(),
    experimentRoot: prepared.outputRoot,
    apiKey: 'test-key',
    invoke,
  });
  assert.equal(execution.jobs[0].terminalStatus, 'success');
  assert.equal(execution.jobs[0].attemptCount, 1);
  assert.equal(execution.jobs[1].terminalStatus, 'participant_contract_failure');
  assert.equal(execution.jobs[1].attemptCount, 1);
  assert.equal(execution.participantContractFailureCount, 1);
  assert.equal(callCount, 2);
  assert.equal(JSON.parse(await readFile(join(prepared.outputRoot, 'jobs/job-001/result.json'), 'utf8')).decision, 'KEEP_BASELINE');
  await assert.rejects(() => readFile(join(prepared.outputRoot, 'jobs/job-002/result.json'), 'utf8'));
  assert.equal(JSON.parse(await readFile(join(prepared.outputRoot, 'jobs/job-002/failure.json'), 'utf8')).failureKind, 'participant_contract_failure');

  async function makeSmallExperiment(prefix: string): Promise<typeof prepared> {
    const fixture = await prepareConservativeSelectionReplay({
      repoRoot: process.cwd(),
      sourceRoot: join(process.cwd(), 'artifacts/ae-selection-priority-replay-v1-20260911'),
      outputRoot: join(await mkdtemp(join(tmpdir(), prefix)), 'experiment'),
    });
    await writeFile(join(fixture.outputRoot, 'experiment.json'), `${canonicalJson({
      ...fixture.experiment,
      jobCount: 2,
      jobs: fixture.experiment.jobs.slice(0, 2),
      invocationOrder: fixture.experiment.invocationOrder.slice(0, 2),
    })}\n`);
    return fixture;
  }

  const retryFixture = await makeSmallExperiment('conservative-selection-retry-');
  let retryCalls = 0;
  const retryExecution = await runConservativeSelectionReplay({
    repoRoot: process.cwd(),
    experimentRoot: retryFixture.outputRoot,
    apiKey: 'test-key',
    invoke: (async () => {
      retryCalls += 1;
      if (retryCalls === 1) return { ok: false, errorKind: 'timeout', message: 'timeout' };
      return {
        ok: true,
        responseId: 'retry-success',
        model: 'deepseek-v4-flash',
        httpStatus: 200,
        rawProviderResponse: '{}',
        rawParticipantResponse: validResponse,
      };
    }) as ConservativeSelectionInvoke,
  });
  assert.equal(retryExecution.jobs[0].terminalStatus, 'success');
  assert.equal(retryExecution.jobs[0].attemptCount, 2);
  assert.equal(retryExecution.retriedJobCount, 1);
  const retryAttempt1 = JSON.parse(await readFile(join(retryFixture.outputRoot, 'jobs/job-001/attempts/attempt-01/attempt.json'), 'utf8')) as Record<string, string>;
  const retryAttempt2 = JSON.parse(await readFile(join(retryFixture.outputRoot, 'jobs/job-001/attempts/attempt-02/attempt.json'), 'utf8')) as Record<string, string>;
  assert.equal(retryAttempt1.systemPromptSha256, retryAttempt2.systemPromptSha256);
  assert.equal(retryAttempt1.blindInputSha256, retryAttempt2.blindInputSha256);
  assert.equal(retryAttempt1.mappingSha256, retryAttempt2.mappingSha256);

  const failedFixture = await makeSmallExperiment('conservative-selection-technical-');
  let failedCalls = 0;
  const failedExecution = await runConservativeSelectionReplay({
    repoRoot: process.cwd(),
    experimentRoot: failedFixture.outputRoot,
    apiKey: 'test-key',
    invoke: (async () => {
      failedCalls += 1;
      return { ok: false, errorKind: 'timeout', message: `timeout-${failedCalls}` };
    }) as ConservativeSelectionInvoke,
  });
  assert.equal(failedExecution.jobs[0].terminalStatus, 'technical_failure');
  assert.equal(failedExecution.jobs[0].attemptCount, 2);
}

runConservativeSelectionReplayExecutionTests().then(
  () => console.log('conservativeSelectionReplayExecution.test.ts: ok'),
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
