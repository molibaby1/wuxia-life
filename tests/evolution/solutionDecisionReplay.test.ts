import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  replaySolutionDecision,
  runSolutionDecisionReplayCli,
} from '../../scripts/evolution/replay/runSolutionDecisionReplay';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';

const requestMoreWorkInput = {
  problemId: 'problem-000001',
  solutionStatus: 'OPTIONS',
  reviewerDecision: 'REQUEST_MORE_WORK',
  solutionScope: 'configuration',
  reviewScope: 'uncertain',
  executionAuthorityAssessment: 'AUTHORITY_UNCERTAIN',
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
  budget: {
    actualParticipantJobs: 4,
    maxParticipantJobs: 4,
    retryCount: 0,
  },
} as const;

const acceptedConfigurationInput = {
  ...requestMoreWorkInput,
  reviewerDecision: 'ACCEPT_OPTION',
  reviewScope: 'config_only',
  executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
} as const;

function cloneRequestMoreWorkInput(): Record<string, unknown> {
  return structuredClone(requestMoreWorkInput) as Record<string, unknown>;
}

function replay(input: unknown) {
  return replaySolutionDecision(JSON.stringify(input));
}

export async function runSolutionDecisionReplayTests(): Promise<void> {
  const output = replaySolutionDecision(JSON.stringify(requestMoreWorkInput));

  assert.equal(output.route, 'DEFER_MORE_WORK_REQUESTED');
  assert.equal(output.reasonCode, 'REVIEW_REQUEST_MORE_WORK');
  assert.equal(output.problemId, 'problem-000001');

  const acceptedConfiguration = replay(acceptedConfigurationInput);
  assert.equal(acceptedConfiguration.route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(acceptedConfiguration.reasonCode, 'ACCEPTED_CONFIGURATION_SCOPE');

  const missingAuthority = { ...acceptedConfigurationInput };
  delete (missingAuthority as { executionAuthorityAssessment?: string }).executionAuthorityAssessment;
  const missingAuthorityDecision = replay(missingAuthority);
  assert.equal(missingAuthorityDecision.route, 'ESCALATE_HUMAN');
  assert.equal(missingAuthorityDecision.reasonCode, 'EXECUTION_AUTHORITY_UNCERTAIN');

  assert.deepEqual(replay(requestMoreWorkInput), replay(requestMoreWorkInput));
  assert.deepEqual(validateSolutionDecision(output), output);

  const unknownField = cloneRequestMoreWorkInput();
  unknownField.extra = true;
  assert.throws(() => replay(unknownField), /unknown field/i);

  const unknownNestedField = cloneRequestMoreWorkInput();
  (unknownNestedField.permissions as Record<string, unknown>).extra = true;
  assert.throws(() => replay(unknownNestedField), /unknown field/i);

  const missingField = cloneRequestMoreWorkInput();
  delete missingField.budget;
  assert.throws(() => replay(missingField), /missing field/i);

  const invalidEnum = cloneRequestMoreWorkInput();
  invalidEnum.solutionStatus = 'INVALID_STATUS';
  assert.throws(() => replay(invalidEnum), /invalid value/i);

  const invalidType = cloneRequestMoreWorkInput();
  invalidType.solutionStatus = 123;
  assert.throws(() => replay(invalidType), /must be a non-empty string/i);

  const invalidPermissionType = cloneRequestMoreWorkInput();
  (invalidPermissionType.permissions as Record<string, unknown>).sandboxWrite = 'yes';
  assert.throws(() => replay(invalidPermissionType), /must be a boolean/i);

  const invalidPermission = cloneRequestMoreWorkInput();
  (invalidPermission.permissions as Record<string, unknown>).sandboxWrite = false;
  assert.throws(() => replay(invalidPermission), /sandboxWrite must be true/i);

  const invalidBudget = cloneRequestMoreWorkInput();
  (invalidBudget.budget as Record<string, unknown>).actualParticipantJobs = 5;
  assert.throws(() => replay(invalidBudget), /actualParticipantJobs/i);

  assert.throws(() => replaySolutionDecision('{'), /valid JSON/i);

  const tempRoot = await mkdtemp(join(tmpdir(), 'solution-decision-replay-'));
  try {
    const inputPath = join(tempRoot, 'input.json');
    const outputPath = join(tempRoot, 'nested', 'decision-output.json');
    await writeFile(inputPath, `${JSON.stringify(requestMoreWorkInput)}\n`);

    await runSolutionDecisionReplayCli([
      '--input', inputPath,
      '--output', outputPath,
    ]);
    const persisted = JSON.parse(await readFile(outputPath, 'utf8')) as unknown;
    assert.deepEqual(validateSolutionDecision(persisted), persisted);
    assert.deepEqual(persisted, output);

    await assert.rejects(
      () => runSolutionDecisionReplayCli([
        '--input', inputPath,
        '--output', outputPath,
      ]),
      /output file already exists/i,
    );
    await assert.rejects(
      () => runSolutionDecisionReplayCli([
        '--input', join(tempRoot, 'missing.json'),
        '--output', join(tempRoot, 'missing-output.json'),
      ]),
      /input file does not exist/i,
    );
    await assert.rejects(
      () => runSolutionDecisionReplayCli([
        '--input', inputPath,
        '--output', join(tempRoot, 'other-output.json'),
        '--unexpected', 'value',
      ]),
      /unknown argument/i,
    );
    await assert.rejects(
      () => runSolutionDecisionReplayCli(['--input', inputPath]),
      /missing required argument: --output/i,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionDecisionReplayTests()
    .then(() => console.log('solutionDecisionReplay.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
