import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSkillBehavioralTerminalReport } from '../../scripts/evolution/problemAgnosticSolution/buildSkillBehavioralTerminalReport';
import type { SkillBehavioralValidationResult } from '../../scripts/evolution/problemAgnosticSolution/runSkillBehavioralValidation';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = {
  executable: 'injected-only',
  buildArgs: () => [],
  model: 'fixed-model',
  reasoningEffort: 'fixed-reasoning',
  timeoutMs: 1000,
};

const validation = {
  status: 'PROTOCOL_VALID',
  sourceRunRef: 'fresh-run-000001',
  sourceExperimentRootHash: 'b'.repeat(64),
  sourceFingerprintSha256: 'c'.repeat(64),
  problemPackageSha256: 'd'.repeat(64),
  actualParticipantJobs: 4,
  maxParticipantJobs: 4,
  retryCount: 0,
  configGameplayExecutionCount: 0,
  solution: { off: {}, on: {} },
  reviewer: { off: {}, on: {} },
} as unknown as SkillBehavioralValidationResult;

export async function runSkillBehavioralTerminalReportTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'skill-behavioral-terminal-'));
  const result = await buildSkillBehavioralTerminalReport({
    destinationRoot: root,
    validation,
    participant,
    blindedPackageSha256: 'e'.repeat(64),
    unblindedReportSha256: 'f'.repeat(64),
    behavioralOutcomes: {
      solution: 'NEUTRAL',
      reviewer: 'INCONCLUSIVE',
    },
  });
  const report = JSON.parse(await readFile(result.reportPath, 'utf8')) as Record<string, any>;
  assert.equal(report.schemaVersion, 'skill-behavioral-terminal-report-v1');
  assert.equal(report.protocolOutcome, 'PROTOCOL_VALID');
  assert.equal(report.source.runRef, 'fresh-run-000001');
  assert.deepEqual(report.source.hashes, {
    experimentRoot: 'b'.repeat(64),
    sourceFingerprint: 'c'.repeat(64),
    problemPackage: 'd'.repeat(64),
    blindedPackage: 'e'.repeat(64),
    unblindedReport: 'f'.repeat(64),
  });
  assert.deepEqual(report.behavioralOutcomes, { solution: 'NEUTRAL', reviewer: 'INCONCLUSIVE' });
  assert.deepEqual(report.budget, {
    actualParticipantJobs: 4,
    maxParticipantJobs: 4,
    retryCount: 0,
    alternateParticipantFallbacks: 0,
    configurationExecutionCount: 0,
    gameplayExecutionCount: 0,
    authoritativeCodeExecutionCount: 0,
    productionActionCount: 0,
  });
  assert.deepEqual(report.runtime, {
    executable: 'injected-only',
    model: 'fixed-model',
    reasoningEffort: 'fixed-reasoning',
    timeoutMs: 1000,
    outputContracts: ['SolutionWorkV1', 'SolutionReviewV1'],
  });
  assert.equal(report.automaticAdvancement, false);
  assert.equal(report.humanFinalReviewTerminalGate, true);
  assert.equal(report.nextPrdStarted, false);
  assert.equal(report.secondSkillStarted, false);
  assert.equal(report.autonomousLoopStarted, false);

  const stoppedValidation = { ...validation, status: 'PROTOCOL_STOPPED' } as SkillBehavioralValidationResult;
  await assert.rejects(
    () => buildSkillBehavioralTerminalReport({
      destinationRoot: join(root, 'stopped-invalid'),
      validation: stoppedValidation,
      participant,
      blindedPackageSha256: 'e'.repeat(64),
      unblindedReportSha256: 'f'.repeat(64),
      behavioralOutcomes: { solution: 'BENEFICIAL', reviewer: 'INCONCLUSIVE' },
    }),
    /PROTOCOL_STOPPED requires INCONCLUSIVE behavioral outcomes/,
  );

  const stoppedResult = await buildSkillBehavioralTerminalReport({
    destinationRoot: join(root, 'stopped-valid'),
    validation: stoppedValidation,
    participant,
    blindedPackageSha256: 'e'.repeat(64),
    unblindedReportSha256: 'f'.repeat(64),
    behavioralOutcomes: { solution: 'INCONCLUSIVE', reviewer: 'INCONCLUSIVE' },
  });
  const stoppedReport = JSON.parse(await readFile(stoppedResult.reportPath, 'utf8')) as Record<string, any>;
  assert.equal(stoppedReport.blindReviewSealed, false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSkillBehavioralTerminalReportTests()
    .then(() => console.log('skillBehavioralTerminalReport.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
