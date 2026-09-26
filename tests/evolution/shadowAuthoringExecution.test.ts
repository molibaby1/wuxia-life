import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runShadowAuthoringExecution } from '../../scripts/evolution/autonomousAuthoring/shadowAuthoringExecutionParticipant';
import {
  buildDeterministicPromotionPatch,
  compareWorkspaceSnapshots,
} from '../../scripts/evolution/autonomousAuthoring/workspaceChangeSet';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import type { WorkspaceAgentJobInput } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
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

async function testShadowExecutorUsesExactAcceptedCardsAndHostChangeSet(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'shadow-executor-'));
  const repositoryRoot = join(root, 'repository');
  await mkdir(join(repositoryRoot, 'src/data/lines'), { recursive: true });
  await mkdir(join(repositoryRoot, 'tests'), { recursive: true });
  await writeFile(join(repositoryRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), '{"entries":[]}\n');
  for (const testPath of PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS) {
    await writeFile(join(repositoryRoot, testPath), 'export const baseline = true;\n');
  }
  const beforeFingerprint = await captureAuthoritativeFingerprint(repositoryRoot);
  const accepted = acceptedInputs();
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
    `process.stdout.write(${JSON.stringify(output)});`,
  ].join('\n');
  const result = await runShadowAuthoringExecution({
    repositoryRoot,
    workspaceDestinationRoot: join(root, 'isolated-workspaces'),
    artifactRoot: join(root, 'shadow-authoring-artifacts'),
    invocationRef: 'shadow-authoring-invocation-test',
    solution: accepted.solution,
    review: accepted.review,
    admission: accepted.admission,
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        observedJob = input;
        return ['-e', script];
      },
    },
  });

  assert.equal(result.status, 'completed');
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
  assert.ok(observedJob?.prompt.includes(canonicalJson(accepted.proposal.contractPayload?.cards)));
  assert.doesNotMatch(observedJob?.prompt ?? '', /PRIVATE_PHASE0_SENTINEL/);
  assert.match(observedJob?.prompt ?? '', /Do not commit, push, or merge/);
  assert.equal(result.authoritativeFingerprintBefore, beforeFingerprint);
  assert.equal(result.authoritativeFingerprintAfter, beforeFingerprint);
  assert.equal(await captureAuthoritativeFingerprint(repositoryRoot), beforeFingerprint);
  assert.equal(result.promotionPatchSha256, sha256Hex(result.promotionPatch));
  assert.match(result.promotionPatch.toString('utf8'), /diff --git a\/src\/undeclared-shadow-change\.txt b\/src\/undeclared-shadow-change\.txt/);
  assert.equal(await readFile(join(result.artifactRoot, 'participant-prompt.txt'), 'utf8'), observedJob?.prompt);
  assert.equal(await readFile(join(result.artifactRoot, 'raw-output.txt'), 'utf8'), output);
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
