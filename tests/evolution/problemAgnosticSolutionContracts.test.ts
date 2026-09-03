import assert from 'node:assert/strict';
import {
  parseProblemPackage,
  type ProblemPackageV1,
} from '../../src/evolution/problemPackageContract';
import {
  parseSolutionWork,
  type SolutionWorkV1,
} from '../../src/evolution/solutionWorkContract';
import {
  parseSolutionReview,
  type SolutionReviewV1,
} from '../../src/evolution/solutionReviewContract';
import {
  parseSolutionDecision,
  type SolutionDecisionV1,
} from '../../src/evolution/solutionDecisionContract';
import {
  STRUCTURED_FINAL_OUTPUT_CONTRACT_V1,
  renderStructuredFinalOutputContractV1,
} from '../../src/evolution/participantStructuredOutputContract';

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-000001',
  source: {
    runRef: 'cohort-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'feedback/feedback.json',
    improvementHypothesisRef: 'hypothesis/hypotheses.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A fresh product problem.',
    observedBasis: 'Observed basis.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['Unknown.'],
    productSignificance: 'Significance.',
  },
  authorityRefs: ['docs/product/auto-evolution-model.md'],
  productSourceFingerprintSha256: 'a'.repeat(64),
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
};

const solutionWork: SolutionWorkV1 = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'Change one authorized setting.',
    rationale: 'It addresses the observed issue.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'The next run differs visibly.',
    risks: [],
    unknowns: ['Whether the setting is sufficient.'],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

const solutionReview: SolutionReviewV1 = {
  schemaVersion: 'solution-review-v1',
  problemId: problemPackage.problemId,
  decision: 'ACCEPT_OPTION',
  acceptedOptionId: 'option-000001',
  scopeAssessment: 'config_only',
  assessment: 'The option is bounded.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
  concerns: [],
};

const solutionDecision: SolutionDecisionV1 = {
  schemaVersion: 'solution-decision-v1',
  problemId: problemPackage.problemId,
  route: 'READY_FOR_CONFIG_EXECUTION',
  reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE',
  inputs: {
    solutionStatus: 'OPTIONS',
    reviewerDecision: 'ACCEPT_OPTION',
    solutionScope: 'configuration',
    reviewScope: 'config_only',
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
  },
};

export function runProblemAgnosticSolutionContractTests(): void {
  assert.deepEqual(parseProblemPackage(JSON.stringify(problemPackage)), problemPackage);
  assert.deepEqual(parseSolutionWork(JSON.stringify(solutionWork)), solutionWork);
  assert.deepEqual(parseSolutionReview(JSON.stringify(solutionReview)), solutionReview);
  assert.deepEqual(parseSolutionDecision(JSON.stringify(solutionDecision)), solutionDecision);

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
  assert.match(solutionOutputContract, /negative or non-actionable outcome/i);
  assert.match(solutionOutputContract, /free-form prose/i);

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

  for (const forbidden of [
    'problemType',
    'domain',
    'resourceStat',
    'mechanismType',
    'investigationMode',
    'allowedMechanismRefs',
  ]) {
    assert.throws(
      () => parseProblemPackage(JSON.stringify({ ...problemPackage, [forbidden]: 'forbidden' })),
      new RegExp(`unknown field.*${forbidden}`),
    );
  }

  const problemPackageV2 = {
    ...problemPackage,
    schemaVersion: 'problem-package-v2' as const,
    source: {
      ...problemPackage.source,
      diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
    },
  };
  assert.deepEqual(parseProblemPackage(JSON.stringify(problemPackageV2)), problemPackageV2);
  assert.throws(
    () => parseProblemPackage(JSON.stringify({
      ...problemPackage,
      schemaVersion: 'problem-package-v2',
      source: { ...problemPackage.source },
    })),
    /missing field: diagnosticEvidenceRefs|diagnosticEvidenceRefs/,
  );
  assert.throws(
    () => parseProblemPackage(JSON.stringify({
      ...problemPackageV2,
      source: {
        ...problemPackageV2.source,
        mechanismType: 'forbidden',
      },
    })),
    /unknown field/,
  );
  assert.throws(
    () => parseProblemPackage(JSON.stringify({
      ...problemPackageV2,
      source: {
        ...problemPackageV2.source,
        diagnosticEvidenceRefs: [
          'diagnostic/causal-attribution.json',
          'diagnostic/causal-attribution.json',
        ],
      },
    })),
    /duplicate ref/,
  );

  assert.throws(
    () => parseSolutionWork(JSON.stringify({ ...solutionWork, unexpected: true })),
    /unknown field.*unexpected/,
  );
  assert.throws(
    () => parseSolutionReview(JSON.stringify({ ...solutionReview, unexpected: true })),
    /unknown field.*unexpected/,
  );
  assert.throws(
    () => parseSolutionDecision(JSON.stringify({ ...solutionDecision, unexpected: true })),
    /unknown field.*unexpected/,
  );

  assert.throws(
    () => parseSolutionWork(JSON.stringify({
      ...solutionWork,
      options: [
        ...solutionWork.options,
        { ...solutionWork.options[0], optionId: 'option-000004' },
        { ...solutionWork.options[0], optionId: 'option-000005' },
      ],
    })),
    /at most three|option/i,
  );
  assert.throws(
    () => parseSolutionWork(JSON.stringify({
      ...solutionWork,
      options: [{ ...solutionWork.options[0], optionId: 'option-000002' }],
    })),
    /participant order|option-000001/i,
  );
  assert.throws(
    () => parseSolutionReview(JSON.stringify({
      ...solutionReview,
      acceptedOptionId: 'bad-option',
    })),
    /acceptedOptionId/i,
  );
  assert.throws(
    () => parseSolutionDecision(JSON.stringify({
      ...solutionDecision,
      inputs: {
        ...solutionDecision.inputs,
        solutionScope: 'program',
        reviewScope: 'config_only',
      },
      route: 'READY_FOR_CONFIG_EXECUTION',
    })),
    /configuration|scope|route/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProblemAgnosticSolutionContractTests();
  console.log('problemAgnosticSolutionContracts.test.ts: ok');
}
