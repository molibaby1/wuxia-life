import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildConfigurationExecutionPrompt,
  runConfigurationExecutionParticipant,
} from '../../scripts/evolution/configurationExecutionParticipant';

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'p2-config-participant-'));
  const workspaceRoot = join(root, 'workspace');
  await mkdir(workspaceRoot, { recursive: true });
  const problemPackagePath = join(root, 'problem-package.json');
  await writeFile(problemPackagePath, '{}\n');

  const problemPackage = {
    schemaVersion: 'problem-package-v1' as const,
    problemId: 'problem-000001',
    source: {
      runRef: 'run-000001',
      observablePayloadRef: 'payload.json',
      externalFeedbackRef: 'feedback.json',
      improvementHypothesisRef: 'hypothesis.json',
    },
    problem: {
      hypothesisId: 'hypothesis-000001',
      statement: 'A bounded configuration issue.',
      observedBasis: 'A sealed run.',
      feedbackRefs: [],
      evidenceRefs: [],
      unknowns: [],
      productSignificance: 'Player-visible.',
    },
    authorityRefs: [] as string[],
    productSourceFingerprintSha256: 'a'.repeat(64),
    permissions: {
      authoritativeProductWrite: false,
      sandboxWrite: true,
      productExecution: false,
      codeExecution: false,
    },
  };
  const solutionWork = {
    schemaVersion: 'solution-work-v1' as const,
    status: 'OPTIONS' as const,
    problemId: 'problem-000001',
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Change data.',
      rationale: 'Narrow.',
      repoRefs: ['src/data/lines/family-life.json'],
      artifactRefs: [],
      changeScope: 'configuration' as const,
      expectedPlayerObservableDifference: 'Executable data.',
      risks: [],
      unknowns: [],
    }],
    summary: 'One option.',
    repoRefs: [],
    artifactRefs: [],
  };
  const solutionReview = {
    schemaVersion: 'solution-review-v1' as const,
    problemId: 'problem-000001',
    decision: 'ACCEPT_OPTION' as const,
    acceptedOptionId: 'option-000001',
    scopeAssessment: 'config_only' as const,
    assessment: 'Accepted.',
    repoRefs: [],
    artifactRefs: [],
    concerns: [],
  };
  const allowedWritePaths = ['src/data/lines/family-life.json'];
  const authorityRefs: string[] = [];

  const baseInput = {
    invocationRef: 'configuration-execution-000001',
    destinationRoot: join(root, 'execution'),
    workspaceRoot,
    problemPackagePath,
    problemPackage,
    solutionWork,
    solutionReview,
    acceptedOptionId: 'option-000001',
    allowedWritePaths,
    authorityRefs,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("")'],
    },
  };

  const prompt = buildConfigurationExecutionPrompt(baseInput);
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /exactly one valid JSON object/i);
  assert.match(prompt, /configuration-execution-result-v1/);
  assert.match(prompt, /bare JSON only/i);
  assert.match(prompt, /Markdown\/code fences/i);
  assert.match(prompt, /before or after the JSON object/i);
  assert.match(prompt, /reject invalid output/i);
  assert.match(prompt, /extract, normalize, or repair/i);
  assert.doesNotMatch(prompt, /Return only configuration-execution-result-v1 JSON\./i);

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

  const result = await runWithRawOutput('valid', validExecutionPayload);
  assert.equal(result.status, 'completed');
  assert.equal(result.resultPath !== null, true);
  assert.equal(result.failurePath, null);

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
    const failure = JSON.parse(await readFile(invalid.failurePath!, 'utf8')) as {
      errorKind?: string;
    };
    assert.equal(failure.errorKind, 'invalid_output');
  }

  console.log('p2-configuration-participant.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
