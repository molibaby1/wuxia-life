import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  buildPromotionPackage,
} from '../../scripts/evolution/autonomousAuthoring/buildPromotionPackage';
import {
  computePreschoolCapacityDeficit,
  verifyPreschoolShadowAuthoring,
  type PreschoolShadowAuthoringVerificationResultV1,
} from '../../scripts/evolution/autonomousAuthoring/verifyPreschoolShadowAuthoring';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { infantPassiveNarrativeCatalog } from '../../src/data/infantPassiveNarrativeCatalog';
import { isPreschoolPassiveEligible } from '../../src/data/preschoolPassiveSpine';
import { captureAuthoritativeFingerprint } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  validateAutonomousAuthoringAdmission,
  type PreschoolCapacityEvidenceV1,
} from '../../src/evolution/autonomousAuthoringAdmissionContract';
import { validateAutonomousAuthoringProposal } from '../../src/evolution/autonomousAuthoringContract';
import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
} from '../../src/evolution/preschoolSharedNeutralAuthoringContract';
import { validateSolutionReview } from '../../src/evolution/solutionReviewContract';
import { validateSolutionWork } from '../../src/evolution/solutionWorkContract';

const RUN_REF = 'preschool-shadow-verification-test-run';
const PROBLEM_ID = 'problem-preschool-shadow-verification';
const INITIAL_CATALOG = {
  entries: [{
    id: 'preschool_neutral_existing_age_four',
    title: 'Existing',
    text: 'Existing baseline entry.',
    originTags: ['neutral'],
    ageMin: 4,
    ageMax: 4,
  }],
};
const BASELINE_TEST = '// baseline assertion must stay byte-identical\n';
const FIXTURE_ROOTS: string[] = [];

async function cleanupFixtures(): Promise<void> {
  await Promise.all(FIXTURE_ROOTS.splice(0).map(root => rm(root, { recursive: true, force: true })));
}

function runGit(root: string, args: string[]): string {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function entry(ageMin = 4) {
  return {
    id: 'preschool_neutral_shared_responsibility',
    title: '守住共同的小事',
    text: '大人把一件小事交给你照看，旁边的孩子喊你去玩。你几次回头，还是先把手里的事做完，才跑过去跟上他们。',
    originTags: ['neutral'],
    ageMin,
    ageMax: 7,
  };
}

function acceptedInputs(
  proposedEntry = entry(),
  assessmentOverrides: Record<string, unknown> = {},
  options: {
    evidenceMode?: PreschoolCapacityEvidenceV1['evidenceMode'];
    baselineEntries?: typeof INITIAL_CATALOG.entries;
  } = {},
) {
  const responsibility = {
    responsibilityId: 'responsibility-000001',
    primaryLifeFunction: 'maintain a small shared obligation',
    playerVisibleNeed: 'The child can finish a small entrusted task before returning to play.',
    evidenceRefs: ['source/observable-payload.json'],
  };
  const proposal = validateAutonomousAuthoringProposal({
    schemaVersion: 'autonomous-authoring-proposal-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: 1,
    gapClassification: 'CONTENT_GAP',
    gapSubtype: 'CONTENT_CAPACITY_GAP',
    applicabilityClaim: 'APPLICABLE',
    authorityRefs: ['docs/governance/product-decisions.md'],
    sourceEvidenceRefs: ['source/observable-payload.json'],
    responsibilities: [responsibility],
    contractPayload: {
      schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1',
      cards: [{
        responsibilityId: responsibility.responsibilityId,
        primaryLifeFunction: responsibility.primaryLifeFunction,
        playerVisibleNeed: responsibility.playerVisibleNeed,
        developmentalAgeJustification: {
          ageMin: proposedEntry.ageMin,
          whyNotEarlier: 'The task requires sustained attention beyond an immediate impulse.',
          whyFromThisAge: 'The child can understand and keep a small shared responsibility.',
          whyThroughAgeSeven: 'The same modest responsibility remains age-appropriate through age seven.',
        },
        concreteSceneConcept: 'A child finishes a small task before joining a game.',
        existingContentDistinction: {
          closestEntryIds: ['preschool_neutral_existing_age_four'],
          sharedSemanticArea: 'Everyday responsibility.',
          specificDistinction: 'This scene is about following through on an entrusted task.',
        },
        actorClass: 'TRANSIENT_ROLE_ONLY',
        pastEvidenceConsumed: 'NONE',
        meaningfulPlayerDecision: 'NONE',
        durableResult: 'EVENT_HISTORY_ID_ONLY',
        futureHook: 'NONE',
        originPortability: 'The scene uses only children and a familiar adult.',
        scopeCheck: 'CONTRACT_PRESERVING',
        proposedEntry,
      }],
    },
  });
  const solution = validateSolutionWork({
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: PROBLEM_ID,
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Append the accepted preschool passive entry.',
      rationale: 'It addresses the accepted responsibility within the content contract.',
      repoRefs: [PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH],
      artifactRefs: ['source/observable-payload.json'],
      changeScope: 'program',
      expectedPlayerObservableDifference: 'The legal age-four pool gains one distinct memory.',
      risks: [],
      unknowns: ['No natural Player-visible Experience Review has been performed.'],
      autonomousAuthoring: proposal,
    }],
    recommendedOptionId: 'option-000001',
    summary: 'Append the accepted content Card.',
    repoRefs: [PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH],
    artifactRefs: ['source/observable-payload.json'],
  });
  const review = validateSolutionReview({
    schemaVersion: 'solution-review-v1',
    problemId: PROBLEM_ID,
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
      assessment: 'The accepted Card fits the current contract.',
      blockers: [],
      ...assessmentOverrides,
    },
    assessment: 'Accepted for shadow execution.',
    repoRefs: [PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH],
    artifactRefs: ['source/observable-payload.json'],
    concerns: [],
  });
  const baselineEntries = options.baselineEntries ?? INITIAL_CATALOG.entries;
  const evidence: PreschoolCapacityEvidenceV1 = options.evidenceMode === 'SEMANTIC_VARIETY'
    ? {
      schemaVersion: 'preschool-capacity-evidence-v1',
      runRef: RUN_REF,
      evidenceMode: 'SEMANTIC_VARIETY',
      canonicalOriginTag: 'martial',
      preConsumedEntryIds: [],
      beats: baselineEntries.slice(0, 2).map((baselineEntry, index) => ({
        sequence: index + 1,
        age: 4 as const,
        selectedEntryId: baselineEntry.id,
        kind: 'AUTHORED' as const,
        legalUnconsumedCountBeforeSelection: 2 - index,
      })),
      demandBeats: 2,
      authoredBeats: 2,
      gapBeats: 0,
      foreignOriginLeakCount: 0,
      duplicateAuthoredCount: 0,
    }
    : {
    schemaVersion: 'preschool-capacity-evidence-v1',
    runRef: RUN_REF,
    evidenceMode: 'STRUCTURAL_EXHAUSTION',
    canonicalOriginTag: 'martial',
    preConsumedEntryIds: ['child_martial_wooden_dummy', 'toddler_martial_watch', 'toddler_neutral_season'],
    beats: [
      { sequence: 1, age: 4, selectedEntryId: 'preschool_neutral_existing_age_four', kind: 'AUTHORED', legalUnconsumedCountBeforeSelection: 1 },
      { sequence: 2, age: 4, selectedEntryId: 'preschool_passive_gap', kind: 'GAP', legalUnconsumedCountBeforeSelection: 0 },
    ],
    demandBeats: 2,
    authoredBeats: 1,
    gapBeats: 1,
    foreignOriginLeakCount: 0,
    duplicateAuthoredCount: 0,
  };
  const admission = validateAutonomousAuthoringAdmission({
    schemaVersion: 'autonomous-authoring-admission-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: 1,
    status: 'ELIGIBLE',
    proposalSha256: sha256Hex(canonicalJson(proposal)),
    reviewSha256: sha256Hex(canonicalJson(review)),
    sourceRunRef: RUN_REF,
    authorityRefs: ['docs/governance/product-decisions.md'],
    allowedWritePaths: [...PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS],
    maxNewEntries: 8,
    capacityEvidence: evidence,
    reasons: ['Host confirmed whole-pool structural exhaustion.'],
  });
  return { solution, review, admission, proposal, evidence };
}

async function writeFileAt(root: string, path: string, contents: string): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
}

async function createFixture(options: {
  entry?: ReturnType<typeof entry>;
  baselineEntries?: typeof INITIAL_CATALOG.entries;
  evidenceMode?: PreschoolCapacityEvidenceV1['evidenceMode'];
  historicalCandidate?: boolean;
  appendedTests?: string;
  appendInvalidSyntax?: boolean;
  appendBothTests?: boolean;
  extraChangedPath?: boolean;
  adjacentFailure?: boolean;
  mutateAcceptedAuthority?: boolean;
} = {}) {
  const tempRoot = await mkdtemp(join(tmpdir(), 'preschool-shadow-verification-'));
  FIXTURE_ROOTS.push(tempRoot);
  const repositoryRoot = join(tempRoot, 'candidate');
  const finalWorkspaceRoot = join(tempRoot, 'shadow');
  await mkdir(repositoryRoot, { recursive: true });
  await writeFileAt(repositoryRoot, 'package.json', JSON.stringify({
    name: 'shadow-verification-fixture',
    private: true,
    scripts: { typecheck: 'node -e "process.exit(0)"' },
  }));
  await writeFileAt(repositoryRoot, 'docs/governance/product-decisions.md', '# Decisions\n\n### PD-121：Contract-Constrained Autonomous Authoring v1\n');
  await writeFileAt(repositoryRoot, 'docs/product/content-authoring-workflow-contract-design.md', '# Content Authoring Workflow Contract v3\n\nPD-121 includes bounded shadow authoring and Human exact-patch promotion.\n');
  if (!options.historicalCandidate) {
    const authorityPath = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
    await writeFileAt(repositoryRoot, authorityPath, await readFile(join(process.cwd(), authorityPath), 'utf8'));
    if (options.mutateAcceptedAuthority) {
      const accepted = await readFile(join(repositoryRoot, authorityPath), 'utf8');
      const mutated = accepted.replace(
        '# Contract-Constrained Autonomous Authoring v1',
        '# Contract-Constrained Autonomous Authoring V1',
      );
      assert.notEqual(mutated, accepted);
      assert.ok(mutated.includes('**HUMAN ACCEPTED — 2026-09-24**'));
      await writeFileAt(repositoryRoot, authorityPath, mutated);
    }
  }
  const baselineEntries = options.baselineEntries ?? INITIAL_CATALOG.entries;
  await writeFileAt(repositoryRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, `${JSON.stringify({ entries: baselineEntries }, null, 2)}\n`);
  for (const path of PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS) await writeFileAt(repositoryRoot, path, BASELINE_TEST);
  await writeFileAt(
    repositoryRoot,
    'tests/neutralPassiveDedupTests.ts',
    options.adjacentFailure ? "throw new Error('ADJACENT_REGRESSION_FAILURE');\n" : 'console.log("neutral regression ok");\n',
  );
  await writeFileAt(repositoryRoot, 'tests/evolution/playerSurfaceCapture.test.ts', 'console.log("player surface regression ok");\n');
  await writeFileAt(repositoryRoot, 'tests/evolution/shadowFixture.ts', 'export const fixture = true;\n');

  if (!options.historicalCandidate) {
    runGit(repositoryRoot, ['init', '-q']);
    runGit(repositoryRoot, ['config', 'user.email', 'shadow-verification@example.invalid']);
    runGit(repositoryRoot, ['config', 'user.name', 'Shadow Verification Fixture']);
    runGit(repositoryRoot, ['add', '.']);
    runGit(repositoryRoot, ['commit', '-m', 'candidate baseline']);
  }

  const current = acceptedInputs(options.entry ?? entry(), {}, {
    evidenceMode: options.evidenceMode,
    baselineEntries,
  });
  const finalCatalog = {
    entries: [...baselineEntries, options.entry ?? entry()],
  };
  const additions = options.appendedTests ?? [
    "import { readFileSync } from 'node:fs';",
    "import { join } from 'node:path';",
    `const expectedId = ${JSON.stringify((options.entry ?? entry()).id)};`,
    `if (process.argv[1]?.endsWith('preschoolPassiveSpineTests.ts') || process.argv[1]?.endsWith('annualPassiveMemoryTests.ts')) {`,
    `  const catalog = JSON.parse(readFileSync(join(process.cwd(), '${PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH}'), 'utf8'));`,
    '  if (!catalog.entries.some((item: { id: string }) => item.id === expectedId)) {',
    '    throw new Error(`AUTONOMOUS_AUTHORING_MISSING_ENTRY: ${expectedId}`);',
    '  }',
    '}',
    '',
  ].join('\n');
  const finalAssertions = options.appendInvalidSyntax ? `${additions}const = ;\n` : additions;
  await mkdir(finalWorkspaceRoot, { recursive: true });
  const copied = spawnSync('cp', ['-R', `${repositoryRoot}/.`, finalWorkspaceRoot], { encoding: 'utf8' });
  if (copied.status !== 0) throw new Error(`fixture copy failed: ${copied.stderr}`);
  await writeFileAt(finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, `${JSON.stringify(finalCatalog, null, 2)}\n`);
  await writeFileAt(finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS[0], `${BASELINE_TEST}${finalAssertions}`);
  if (options.appendBothTests !== false) {
    await writeFileAt(finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS[1], `${BASELINE_TEST}${finalAssertions}`);
  }
  if (options.extraChangedPath) {
    await writeFileAt(finalWorkspaceRoot, 'src/undeclared-shadow-change.txt', 'forbidden change\n');
  }
  const authoritativeRepositoryRoot = options.historicalCandidate ? join(tempRoot, 'authoritative') : repositoryRoot;
  if (options.historicalCandidate) {
    await mkdir(authoritativeRepositoryRoot, { recursive: true });
    const authorityCopy = spawnSync('cp', ['-R', `${repositoryRoot}/.`, authoritativeRepositoryRoot], { encoding: 'utf8' });
    if (authorityCopy.status !== 0) throw new Error(`authority fixture copy failed: ${authorityCopy.stderr}`);
    const authorityPath = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
    await writeFileAt(authoritativeRepositoryRoot, authorityPath, await readFile(join(process.cwd(), authorityPath), 'utf8'));
  }
  const candidateBaselineGitSha = options.historicalCandidate
    ? 'e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf'
    : runGit(repositoryRoot, ['rev-parse', 'HEAD']);
  const candidateBaselineFingerprintSha256 = await captureAuthoritativeFingerprint(repositoryRoot);
  const authoritativeFingerprintBefore = await captureAuthoritativeFingerprint(authoritativeRepositoryRoot);
  return {
    tempRoot,
    repositoryRoot,
    authoritativeRepositoryRoot,
    finalWorkspaceRoot,
    candidateBaselineGitSha,
    candidateBaselineFingerprintSha256,
    authoritativeFingerprintBefore,
    ...current,
  };
}

function verificationInput(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return {
    repositoryRoot: fixture.repositoryRoot,
    authoritativeRepositoryRoot: fixture.authoritativeRepositoryRoot,
    beforeWorkspaceRoot: fixture.repositoryRoot,
    finalWorkspaceRoot: fixture.finalWorkspaceRoot,
    candidateBaselineGitSha: fixture.candidateBaselineGitSha,
    candidateBaselineFingerprintSha256: fixture.candidateBaselineFingerprintSha256,
    authoritativeFingerprintBefore: fixture.authoritativeFingerprintBefore,
    solution: fixture.solution,
    review: fixture.review,
    admission: fixture.admission,
  };
}

async function testV1RejectsCandidateBaselineShaAndFingerprintMismatch(): Promise<void> {
  const fixture = await createFixture();
  const shaMismatch = await verifyPreschoolShadowAuthoring({
    ...verificationInput(fixture),
    candidateBaselineGitSha: '0'.repeat(40),
  });
  assert.equal(shaMismatch.status, 'SHADOW_AUTHORING_VERIFICATION_FAILED');
  assert.equal(shaMismatch.checks.authorityIntegrity, 'FAIL');

  const fingerprintMismatch = await verifyPreschoolShadowAuthoring({
    ...verificationInput(fixture),
    candidateBaselineFingerprintSha256: '0'.repeat(64),
  });
  assert.equal(fingerprintMismatch.status, 'SHADOW_AUTHORING_VERIFICATION_FAILED');
  assert.equal(fingerprintMismatch.checks.authorityIntegrity, 'FAIL');
}

async function testV1RejectsMutatedAcceptedAuthorityBytes(): Promise<void> {
  const fixture = await createFixture({ mutateAcceptedAuthority: true });
  const result = await verifyPreschoolShadowAuthoring(verificationInput(fixture));
  assert.equal(result.status, 'SHADOW_AUTHORING_VERIFICATION_FAILED');
  assert.equal(result.checks.authorityIntegrity, 'FAIL');
  assert.equal(result.promotionPatch, null);
  assert.throws(
    () => buildPromotionPackage({
      verification: result,
      solution: fixture.solution,
      review: fixture.review,
      admission: fixture.admission,
    }),
    /Promotion Package requires a complete V1-V5 SHADOW_AUTHORING_VERIFIED result/,
  );
}

async function testV1SupportsHistoricalArchiveWithSeparateAuthorityRoot(): Promise<void> {
  const fixture = await createFixture({ historicalCandidate: true });
  await assert.rejects(readFile(join(fixture.repositoryRoot, 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md')));
  const result = await verifyPreschoolShadowAuthoring(verificationInput(fixture));
  assert.equal(result.status, 'SHADOW_AUTHORING_VERIFIED');
  assert.equal(result.candidateBaselineGitSha, 'e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf');
  assert.equal(result.authoritativeFingerprintAfter, fixture.authoritativeFingerprintBefore);
}

async function testV2RejectsOutOfScopeChangeAndChangedBaselineCatalogRow(): Promise<void> {
  const extraPath = await createFixture({ extraChangedPath: true });
  const extraResult = await verifyPreschoolShadowAuthoring(verificationInput(extraPath));
  assert.equal(extraResult.checks.mechanicalConformance, 'FAIL', JSON.stringify({ checks: extraResult.checks, failures: extraResult.failures }));
  assert.match(extraResult.failures.join('\n'), /src\/undeclared-shadow-change\.txt/);

  const changedRow = await createFixture();
  const baseline = JSON.parse(await readFile(join(changedRow.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), 'utf8'));
  baseline.entries[0].title = 'rewritten old entry';
  await writeFileAt(changedRow.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  const changedResult = await verifyPreschoolShadowAuthoring(verificationInput(changedRow));
  assert.equal(changedResult.checks.mechanicalConformance, 'FAIL');
}

async function testV2RejectsForbiddenFieldsCardMismatchAndTestPrefixRemoval(): Promise<void> {
  const forbidden = await createFixture();
  const withFlags = JSON.parse(await readFile(join(forbidden.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), 'utf8'));
  withFlags.entries[1].flags = ['forbidden'];
  await writeFileAt(forbidden.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, `${JSON.stringify(withFlags, null, 2)}\n`);
  assert.equal((await verifyPreschoolShadowAuthoring(verificationInput(forbidden))).checks.mechanicalConformance, 'FAIL');

  const cardMismatch = await createFixture();
  const changedCard = JSON.parse(await readFile(join(cardMismatch.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), 'utf8'));
  changedCard.entries[1].text = 'rewritten accepted card';
  await writeFileAt(cardMismatch.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, `${JSON.stringify(changedCard, null, 2)}\n`);
  assert.equal((await verifyPreschoolShadowAuthoring(verificationInput(cardMismatch))).checks.mechanicalConformance, 'FAIL');

  const forbiddenStatDeltas = await createFixture();
  const withStatDeltas = JSON.parse(await readFile(join(forbiddenStatDeltas.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), 'utf8'));
  withStatDeltas.entries[1].statDeltas = { wisdom: 1 };
  await writeFileAt(forbiddenStatDeltas.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH, `${JSON.stringify(withStatDeltas, null, 2)}\n`);
  assert.equal((await verifyPreschoolShadowAuthoring(verificationInput(forbiddenStatDeltas))).checks.mechanicalConformance, 'FAIL');

  const removedLine = await createFixture();
  await writeFileAt(removedLine.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS[0], `${BASELINE_TEST.trim()}\n`);
  assert.equal((await verifyPreschoolShadowAuthoring(verificationInput(removedLine))).checks.mechanicalConformance, 'FAIL');

  const unguarded = await createFixture({ appendedTests: "throw new Error('AUTONOMOUS_AUTHORING_MISSING_ENTRY: preschool_neutral_shared_responsibility');\n" });
  assert.equal((await verifyPreschoolShadowAuthoring(verificationInput(unguarded))).checks.mechanicalConformance, 'FAIL');
}

async function testV2RejectsSymlinkedTestPathBeforeRunningCommands(): Promise<void> {
  const fixture = await createFixture();
  const testPath = join(fixture.finalWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS[0]);
  const outsideTestPath = join(fixture.tempRoot, 'outside-preschool-test.ts');
  const executionMarkerPath = join(fixture.tempRoot, 'outside-test-executed');
  const testContents = (await readFile(testPath, 'utf8'))
    .replace(
      'import { readFileSync } from \'node:fs\';',
      'import { readFileSync, writeFileSync } from \'node:fs\';',
    )
    .replace(
      "if (process.argv[1]?.endsWith('preschoolPassiveSpineTests.ts') || process.argv[1]?.endsWith('annualPassiveMemoryTests.ts')) {",
      `if (process.argv[1]?.endsWith('preschoolPassiveSpineTests.ts') || process.argv[1]?.endsWith('annualPassiveMemoryTests.ts')) {\n  writeFileSync(${JSON.stringify(executionMarkerPath)}, 'executed');`,
    );
  assert.notEqual(testContents, await readFile(testPath, 'utf8'));
  await writeFile(outsideTestPath, testContents);
  await rm(testPath);
  await symlink(outsideTestPath, testPath);

  const result = await verifyPreschoolShadowAuthoring(verificationInput(fixture));

  assert.equal(result.checks.mechanicalConformance, 'FAIL');
  assert.equal(result.commandResults.length, 0);
  await assert.rejects(readFile(executionMarkerPath), { code: 'ENOENT' });
}

async function testV2RejectsSymlinkedWorkspaceRootBeforeRunningCommands(): Promise<void> {
  const fixture = await createFixture();
  const linkedWorkspaceRoot = join(fixture.tempRoot, 'shadow-workspace-link');
  await symlink(fixture.finalWorkspaceRoot, linkedWorkspaceRoot, 'dir');

  const result = await verifyPreschoolShadowAuthoring({
    ...verificationInput(fixture),
    finalWorkspaceRoot: linkedWorkspaceRoot,
  });

  assert.equal(result.checks.mechanicalConformance, 'FAIL');
  assert.equal(result.commandResults.length, 0);
  assert.match(result.failures.join('\n'), /workspace root.*symlink|symlink.*workspace root/i);
}

async function testV3RequiresConformingReviewerAndCurrentExecutionAuthority(): Promise<void> {
  const fixture = await createFixture();
  const assessment = fixture.review.autonomousAuthoringAssessment!;
  const invalidReview = validateSolutionReview({
    ...fixture.review,
    autonomousAuthoringAssessment: { ...assessment, conformance: 'NON_CONFORMING' },
  });
  const invalidProposal = validateAutonomousAuthoringProposal(fixture.proposal);
  const admission = validateAutonomousAuthoringAdmission({
    ...fixture.admission,
    proposalSha256: sha256Hex(canonicalJson(invalidProposal)),
    reviewSha256: sha256Hex(canonicalJson(invalidReview)),
  });
  const result = await verifyPreschoolShadowAuthoring({
    ...verificationInput(fixture),
    review: invalidReview,
    admission,
  });
  assert.equal(result.checks.semanticConformance, 'FAIL');
}

async function testV4RejectsSyntaxErrorAsRedAndGreenRegressionFailure(): Promise<void> {
  const syntaxError = await createFixture({ appendInvalidSyntax: true });
  const syntaxResult = await verifyPreschoolShadowAuthoring(verificationInput(syntaxError));
  assert.equal(syntaxResult.checks.redGreenRegression, 'FAIL', JSON.stringify({ checks: syntaxResult.checks, failures: syntaxResult.failures, commands: syntaxResult.commandResults }));
  assert.match(syntaxResult.failures.join('\n'), /invalid syntax\/import\/path reason/);

  const greenFailure = await createFixture({
    appendedTests: [
      BASELINE_TEST.trimEnd(),
      "import { readFileSync } from 'node:fs';",
      `const catalog = JSON.parse(readFileSync('src/data/lines/preschool-passive-spine.json', 'utf8'));`,
      "if (process.argv[1]?.endsWith('preschoolPassiveSpineTests.ts') || process.argv[1]?.endsWith('annualPassiveMemoryTests.ts')) {",
      "  if (!catalog.entries.some((item: { id: string }) => item.id === 'preschool_neutral_shared_responsibility')) throw new Error('AUTONOMOUS_AUTHORING_MISSING_ENTRY: preschool_neutral_shared_responsibility');",
      "  else throw new Error('GREEN_PHASE_FAILURE');",
      '}',
      '',
    ].join('\n'),
  });
  const greenResult = await verifyPreschoolShadowAuthoring(verificationInput(greenFailure));
  assert.equal(greenResult.checks.redGreenRegression, 'FAIL');
  assert.match(greenResult.failures.join('\n'), /GREEN_PHASE_FAILURE/);
}

async function testV4RejectsAdjacentRegressionFailure(): Promise<void> {
  const fixture = await createFixture({ adjacentFailure: true });
  const result = await verifyPreschoolShadowAuthoring(verificationInput(fixture));
  assert.equal(result.checks.adjacentRegression, 'FAIL');
  assert.match(result.failures.join('\n'), /ADJACENT_REGRESSION_FAILURE/);
}

async function testV5UsesOneToOneMaximumMatchingForStructuralAndSemanticEvidence(): Promise<void> {
  const duplicateDemand = computePreschoolCapacityDeficit({
    demandAges: [4, 4],
    canonicalOriginTag: 'martial',
    catalogEntries: [INITIAL_CATALOG.entries[0]!],
    preConsumedEntryIds: [],
  });
  assert.deepEqual(duplicateDemand, { demand: 2, maximumMatchedAuthored: 1, structuralDeficit: 1 });

  const consumed = computePreschoolCapacityDeficit({
    demandAges: [4],
    canonicalOriginTag: 'martial',
    catalogEntries: [INITIAL_CATALOG.entries[0]!],
    preConsumedEntryIds: [INITIAL_CATALOG.entries[0]!.id],
  });
  assert.equal(consumed.structuralDeficit, 1);

  const finalEntries = [...INITIAL_CATALOG.entries, entry()];
  const completed = computePreschoolCapacityDeficit({
    demandAges: [4, 4],
    canonicalOriginTag: 'martial',
    catalogEntries: finalEntries,
    preConsumedEntryIds: [],
  });
  assert.deepEqual(completed, { demand: 2, maximumMatchedAuthored: 2, structuralDeficit: 0 });

  const wrongAge = computePreschoolCapacityDeficit({
    demandAges: [4, 4],
    canonicalOriginTag: 'martial',
    catalogEntries: [...INITIAL_CATALOG.entries, entry(7)],
    preConsumedEntryIds: [],
  });
  assert.equal(wrongAge.structuralDeficit, 1);
}

async function testV5UsesEffectiveLegacyAndConfiguredCatalogForBaseline(): Promise<void> {
  const fixture = await createFixture();
  const effectiveBaseline = [
    ...infantPassiveNarrativeCatalog.filter(entry => entry.ageMin >= 3 && entry.ageMax <= 7),
    ...INITIAL_CATALOG.entries,
  ];
  const availableBefore = effectiveBaseline.filter(entry =>
    isPreschoolPassiveEligible(entry, new Set(['martial']))
    && entry.ageMin <= 4
    && entry.ageMax >= 4,
  );
  const firstSelectedId = 'preschool_neutral_existing_age_four';
  const secondSelectedId = 'toddler_martial_watch';
  assert.ok(availableBefore.some(entry => entry.id === secondSelectedId));
  const evidence: PreschoolCapacityEvidenceV1 = {
    schemaVersion: 'preschool-capacity-evidence-v1',
    runRef: RUN_REF,
    evidenceMode: 'SEMANTIC_VARIETY',
    canonicalOriginTag: 'martial',
    preConsumedEntryIds: [],
    beats: [
      {
        sequence: 1,
        age: 4,
        selectedEntryId: firstSelectedId,
        kind: 'AUTHORED',
        legalUnconsumedCountBeforeSelection: availableBefore.length,
      },
      {
        sequence: 2,
        age: 4,
        selectedEntryId: secondSelectedId,
        kind: 'AUTHORED',
        legalUnconsumedCountBeforeSelection: availableBefore.length - 1,
      },
    ],
    demandBeats: 2,
    authoredBeats: 2,
    gapBeats: 0,
    foreignOriginLeakCount: 0,
    duplicateAuthoredCount: 0,
  };
  fixture.admission = validateAutonomousAuthoringAdmission({
    ...fixture.admission,
    capacityEvidence: evidence,
  });

  const result = await verifyPreschoolShadowAuthoring(verificationInput(fixture));
  const expectedBefore = computePreschoolCapacityDeficit({
    demandAges: [4, 4],
    canonicalOriginTag: 'martial',
    catalogEntries: effectiveBaseline,
    preConsumedEntryIds: [],
  });
  assert.equal(result.status, 'SHADOW_AUTHORING_VERIFIED');
  assert.deepEqual(result.capacityBefore, expectedBefore);
  assert.equal(result.capacityBefore?.structuralDeficit, 0);
  assert.equal(result.capacityAfter?.structuralDeficit, 0);
}

async function testV5RejectsUnresolvedStructuralDeficitAndAllowsSemanticZeroToZero(): Promise<void> {
  const unresolvedStructural = await createFixture({ entry: entry(7) });
  const structuralResult = await verifyPreschoolShadowAuthoring(verificationInput(unresolvedStructural));
  assert.equal(structuralResult.checks.evidenceBoundedCompletion, 'FAIL');
  assert.equal(structuralResult.capacityBefore?.structuralDeficit, 1);
  assert.equal(structuralResult.capacityAfter?.structuralDeficit, 1);

  const secondBaselineEntry = {
    id: 'preschool_neutral_existing_second_age_four',
    title: 'Existing second',
    text: 'Second existing baseline entry.',
    originTags: ['neutral'],
    ageMin: 4,
    ageMax: 4,
  };
  const semanticVariety = await createFixture({
    baselineEntries: [...INITIAL_CATALOG.entries, secondBaselineEntry],
    evidenceMode: 'SEMANTIC_VARIETY',
  });
  const semanticResult = await verifyPreschoolShadowAuthoring(verificationInput(semanticVariety));
  assert.equal(semanticResult.status, 'SHADOW_AUTHORING_VERIFIED');
  assert.equal(semanticResult.capacityBefore?.structuralDeficit, 0);
  assert.equal(semanticResult.capacityAfter?.structuralDeficit, 0);
}

async function testSuccessBuildsExactPatchAndPromotionPackage(): Promise<void> {
  const fixture = await createFixture();
  const verification = await verifyPreschoolShadowAuthoring(verificationInput(fixture));
  assert.equal(verification.status, 'SHADOW_AUTHORING_VERIFIED');
  assert.deepEqual(verification.checks, {
    authorityIntegrity: 'PASS',
    mechanicalConformance: 'PASS',
    semanticConformance: 'PASS',
    redGreenRegression: 'PASS',
    adjacentRegression: 'PASS',
    evidenceBoundedCompletion: 'PASS',
  });
  assert.equal(verification.capacityBefore?.structuralDeficit, 1);
  assert.equal(verification.capacityAfter?.structuralDeficit, 0);
  assert.ok(verification.promotionPatch);
  assert.equal(verification.patchSha256, sha256Hex(verification.promotionPatch!));

  const packageResult = buildPromotionPackage({
    verification,
    solution: fixture.solution,
    review: fixture.review,
    admission: fixture.admission,
  });
  assert.equal(packageResult.packageJson.schemaVersion, 'shadow-authoring-promotion-package-v1');
  assert.equal(packageResult.packageJson.patchSha256, verification.patchSha256);
  assert.deepEqual(packageResult.packageJson.authorityRefs, fixture.admission.authorityRefs);
  assert.deepEqual(packageResult.packageJson.sourceEvidenceIdentity, {
    runRef: fixture.admission.sourceRunRef,
    refs: fixture.proposal.sourceEvidenceRefs,
    capacityEvidence: fixture.evidence,
    sha256: sha256Hex(canonicalJson({
      runRef: fixture.admission.sourceRunRef,
      refs: fixture.proposal.sourceEvidenceRefs,
      capacityEvidence: fixture.evidence,
    })),
  });
  assert.deepEqual(
    packageResult.packageJson.responsibilitySummaries[0]?.evidenceRefs,
    fixture.proposal.responsibilities[0]?.evidenceRefs,
  );
  assert.equal(
    Buffer.from(packageResult.packageJson.exactPatchBase64, 'base64').compare(verification.promotionPatch!),
    0,
  );
  assert.deepEqual({
    authorityIntegrity: packageResult.packageJson.verification.authorityIntegrity,
    mechanicalConformance: packageResult.packageJson.verification.mechanicalConformance,
    semanticConformance: packageResult.packageJson.verification.semanticConformance,
    redGreenRegression: packageResult.packageJson.verification.redGreenRegression,
    adjacentRegression: packageResult.packageJson.verification.adjacentRegression,
    evidenceBoundedCompletion: packageResult.packageJson.verification.evidenceBoundedCompletion,
  }, verification.checks);
  assert.deepEqual(packageResult.packageJson.verification.commandResults, verification.commandResults);
  assert.deepEqual(packageResult.packageJson.verification.authoritativeRepositoryIntegrity, {
    before: verification.authoritativeFingerprintBefore,
    after: verification.authoritativeFingerprintAfter,
    unchanged: true,
  });
  assert.deepEqual(packageResult.packageJson.allowedHumanOutcomes, ['PROMOTE_EXACT_PATCH', 'DEFER', 'REJECT']);
  assert.equal(packageResult.packageJson.naturalPverPerformed, false);
  assert.match(packageResult.markdown, /Natural Player-visible Experience Review has not been performed\./);
  assert.match(packageResult.markdown, /Human exact-patch promotion review/);
}

async function testPromotionPackageRejectsProposalChangedAfterVerification(): Promise<void> {
  const fixture = await createFixture();
  const promotionPatch = Buffer.from('verified exact patch\n');
  const verification: PreschoolShadowAuthoringVerificationResultV1 = {
    schemaVersion: 'preschool-shadow-authoring-verification-v1',
    status: 'SHADOW_AUTHORING_VERIFIED',
    checks: {
      authorityIntegrity: 'PASS',
      mechanicalConformance: 'PASS',
      semanticConformance: 'PASS',
      redGreenRegression: 'PASS',
      adjacentRegression: 'PASS',
      evidenceBoundedCompletion: 'PASS',
    },
    failures: [],
    candidateBaselineGitSha: fixture.candidateBaselineGitSha,
    candidateBaselineFingerprintSha256: fixture.candidateBaselineFingerprintSha256,
    acceptedProposalSha256: sha256Hex(canonicalJson(fixture.proposal)),
    acceptedReviewSha256: sha256Hex(canonicalJson(fixture.review)),
    admissionSha256: sha256Hex(canonicalJson(fixture.admission)),
    authoritativeFingerprintBefore: fixture.authoritativeFingerprintBefore,
    authoritativeFingerprintAfter: fixture.authoritativeFingerprintBefore,
    changedFiles: [],
    commandResults: [],
    capacityBefore: { demand: 2, maximumMatchedAuthored: 1, structuralDeficit: 1 },
    capacityAfter: { demand: 2, maximumMatchedAuthored: 2, structuralDeficit: 0 },
    patchSha256: sha256Hex(promotionPatch),
    promotionPatch,
  };
  buildPromotionPackage({
    verification,
    solution: fixture.solution,
    review: fixture.review,
    admission: fixture.admission,
  });
  const changedOption = structuredClone(fixture.solution.options[0]!);
  changedOption.autonomousAuthoring!.contractPayload!.cards[0]!.proposedEntry.text = 'unverified post-review edit';
  const changedSolution = validateSolutionWork({
    ...fixture.solution,
    options: [changedOption],
  });
  assert.throws(
    () => buildPromotionPackage({
      verification,
      solution: changedSolution,
      review: fixture.review,
      admission: fixture.admission,
    }),
    /does not match the verified proposal/i,
  );
}

export async function runPreschoolShadowAuthoringVerificationTests(): Promise<void> {
  try {
    await testV1RejectsCandidateBaselineShaAndFingerprintMismatch();
    await testV1RejectsMutatedAcceptedAuthorityBytes();
    await testV1SupportsHistoricalArchiveWithSeparateAuthorityRoot();
    await testV2RejectsOutOfScopeChangeAndChangedBaselineCatalogRow();
    await testV2RejectsForbiddenFieldsCardMismatchAndTestPrefixRemoval();
    await testV2RejectsSymlinkedTestPathBeforeRunningCommands();
    await testV2RejectsSymlinkedWorkspaceRootBeforeRunningCommands();
    await testV3RequiresConformingReviewerAndCurrentExecutionAuthority();
    await testV4RejectsSyntaxErrorAsRedAndGreenRegressionFailure();
    await testV4RejectsAdjacentRegressionFailure();
    await testV5UsesOneToOneMaximumMatchingForStructuralAndSemanticEvidence();
    await testV5UsesEffectiveLegacyAndConfiguredCatalogForBaseline();
    await testV5RejectsUnresolvedStructuralDeficitAndAllowsSemanticZeroToZero();
    await testSuccessBuildsExactPatchAndPromotionPackage();
    await testPromotionPackageRejectsProposalChangedAfterVerification();
  } finally {
    await cleanupFixtures();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (process.argv[2] === '--package-only'
    ? testPromotionPackageRejectsProposalChangedAfterVerification()
    : process.argv[2] === '--authority-only'
      ? testV1RejectsMutatedAcceptedAuthorityBytes()
      : runPreschoolShadowAuthoringVerificationTests())
    .then(async () => {
      await cleanupFixtures();
      console.log('preschoolShadowAuthoringVerification.test.ts: ok');
    })
    .catch(async error => {
      await cleanupFixtures();
      console.error(error);
      process.exit(1);
    });
}
