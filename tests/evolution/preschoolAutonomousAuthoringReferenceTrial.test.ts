import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WorkspaceAgentJobInput, WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  assertPreschoolReferenceResponsibilitiesPreserved,
  readAcceptedPreschoolReferenceResponsibilityBrief,
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
  validatePreschoolReferenceResponsibilityBrief,
} from '../../scripts/evolution/autonomousAuthoring/preschoolReferenceResponsibilityBrief';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { parseStoredImprovementHypothesisSet } from '../../src/evolution/improvementHypothesisContract';
import type { AutonomousAuthoringProposalV1 } from '../../src/evolution/autonomousAuthoringContract';
import { captureAuthoritativeFingerprint } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
  buildPreschoolReferenceTrialVerifiedResult,
  createPreschoolReferenceTrialOutputRoot,
  overlayReferenceTrialAuthority,
  prepareReferenceTrialParticipantWorkspace,
  referenceTrialInvocationRef,
  runPreschoolReferenceTrial,
  runPreschoolReferenceTrialCli,
  readExactReferenceObservablePayload,
  writePreschoolReferenceTrialInputs,
  withParticipantContaminationGuard,
} from '../../scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial';

const ANSWER_IDS = [
  'preschool_neutral_fair_play',
  'preschool_neutral_self_made_project',
  'preschool_neutral_stand_for_peer',
  'preschool_neutral_first_farewell',
  'preschool_neutral_neighborhood_help',
] as const;

const AUTHORITY_PATHS = [
  'docs/governance/product-decisions.md',
  'docs/product/content-authoring-workflow-contract-design.md',
  'docs/product/auto-evolution-model.md',
] as const;

const RESIDUAL_DESIGN_PATH = 'docs/superpowers/specs/2026-09-23-preschool-residual-content-capacity-authoring-design.md';
const ACCEPTED_DESIGN_PATH = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
const REFERENCE_TRIAL_ROOT_PATH = 'artifacts/evolution/autonomous-authoring/reference-trials/preschool-pver-20260922231805-71297571';
const REFERENCE_TRIAL_ATTEMPTS_PATH = join(REFERENCE_TRIAL_ROOT_PATH, 'attempts');
const REFERENCE_HYPOTHESIS_UNKNOWN = 'Whether the supplied Human-approved responsibilities admit independently authored contract-conforming content instances remains to be determined and independently reviewed.';

async function put(root: string, relativePath: string, content: string): Promise<void> {
  const path = join(root, relativePath);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, content);
}

async function listFiles(root: string, relativePath = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(join(root, relativePath), { withFileTypes: true })) {
    const child = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    else files.push(child);
  }
  return files;
}

function testReferenceResponsibilityBriefContract(): void {
  const brief = {
    schemaVersion: 'preschool-reference-responsibility-brief-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    responsibilities: [{
      responsibilityRef: 'reference-responsibility-000001',
      primaryLifeFunction: 'Shared play',
      playerVisibleNeed: 'A child needs a shared play experience.',
    }],
  };
  assert.deepEqual(validatePreschoolReferenceResponsibilityBrief(brief), brief);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({ ...brief, extra: true }), /unknown field/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], extra: true }],
  }), /unknown field/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({ ...brief, responsibilities: [] }), /1 through 8/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: Array.from({ length: 9 }, (_, index) => ({
      ...brief.responsibilities[0],
      responsibilityRef: 'reference-responsibility-' + String(index + 1).padStart(6, '0'),
    })),
  }), /1 through 8/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], responsibilityRef: 'reference-responsibility-000002' }],
  }), /participant order/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], primaryLifeFunction: '' }],
  }), /non-empty string/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({
    ...brief,
    responsibilities: [{ ...brief.responsibilities[0], playerVisibleNeed: '' }],
  }), /non-empty string/);
  assert.throws(() => validatePreschoolReferenceResponsibilityBrief({ ...brief, runRef: 'wrong-run' }), /runRef/);
}

function testReferenceResponsibilityPreservation(): void {
  const brief = validatePreschoolReferenceResponsibilityBrief({
    schemaVersion: 'preschool-reference-responsibility-brief-v1',
    runRef: 'preschool-pver-20260922231805-71297571',
    responsibilities: [
      { responsibilityRef: 'reference-responsibility-000001', primaryLifeFunction: 'Shared play', playerVisibleNeed: 'Need shared play.' },
      { responsibilityRef: 'reference-responsibility-000002', primaryLifeFunction: 'Farewell', playerVisibleNeed: 'Need a farewell.' },
    ],
  });
  const proposal = {
    applicabilityClaim: 'APPLICABLE',
    responsibilities: brief.responsibilities.map((responsibility, index) => ({
      responsibilityId: 'responsibility-' + String(index + 1).padStart(6, '0'),
      primaryLifeFunction: responsibility.primaryLifeFunction,
      playerVisibleNeed: responsibility.playerVisibleNeed,
      evidenceRefs: [],
    })),
  } as AutonomousAuthoringProposalV1;
  assert.deepEqual(assertPreschoolReferenceResponsibilitiesPreserved({ brief, proposal }), [
    { referenceResponsibilityRef: 'reference-responsibility-000001', proposalResponsibilityId: 'responsibility-000001' },
    { referenceResponsibilityRef: 'reference-responsibility-000002', proposalResponsibilityId: 'responsibility-000002' },
  ]);
  const rejects = (responsibilities: typeof proposal.responsibilities) => assert.throws(
    () => assertPreschoolReferenceResponsibilitiesPreserved({ brief, proposal: { ...proposal, responsibilities } }),
    /reference responsibility/i,
  );
  rejects(proposal.responsibilities.slice(0, 1));
  rejects([...proposal.responsibilities, { ...proposal.responsibilities[0]!, responsibilityId: 'responsibility-000003' }]);
  rejects([...proposal.responsibilities].reverse());
  rejects([{ ...proposal.responsibilities[0]!, primaryLifeFunction: 'Changed' }, proposal.responsibilities[1]!]);
  rejects([{ ...proposal.responsibilities[0]!, playerVisibleNeed: 'Changed' }, proposal.responsibilities[1]!]);
  rejects([{ ...proposal.responsibilities[0]!, evidenceRefs: ['source/observable-payload.json'] }, proposal.responsibilities[1]!]);
}

function testQualifiedLayerAResult(): void {
  const result = buildPreschoolReferenceTrialVerifiedResult({
    briefSha256: PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
    responsibilityMappings: [{
      referenceResponsibilityRef: 'reference-responsibility-000001',
      proposalResponsibilityId: 'responsibility-000001',
    }],
    downstream: {
      status: 'SHADOW_AUTHORING_VERIFIED',
      runRef: 'preschool-pver-20260922231805-71297571',
      newEntryCount: 1,
      changedFiles: ['src/data/lines/preschool-passive-spine.json'],
      promotionPackagePath: '/tmp/synthetic-promotion-package.json',
      promotionPatchPath: '/tmp/synthetic-promotion.patch',
      liveRepositoryFingerprintBefore: 'b'.repeat(64),
      liveRepositoryFingerprintAfter: 'b'.repeat(64),
    },
  });
  assert.deepEqual(result, {
    schemaVersion: 'preschool-reference-trial-result-v2',
    status: 'SHADOW_AUTHORING_VERIFIED',
    validationLayer: 'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM',
    responsibilityProvenance: 'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES',
    referenceResponsibilityBriefRef: 'source/reference-trial/reference-responsibility-brief.json',
    referenceResponsibilityBriefSha256: PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
    referenceResponsibilityAttestationRef: 'source/reference-trial/reference-responsibility-attestation.json',
    responsibilityMappings: [{ referenceResponsibilityRef: 'reference-responsibility-000001', proposalResponsibilityId: 'responsibility-000001' }],
    runRef: 'preschool-pver-20260922231805-71297571',
    newEntryCount: 1,
    changedFiles: ['src/data/lines/preschool-passive-spine.json'],
    promotionPackagePath: '/tmp/synthetic-promotion-package.json',
    promotionPatchPath: '/tmp/synthetic-promotion.patch',
    liveRepositoryFingerprintBefore: 'b'.repeat(64),
    liveRepositoryFingerprintAfter: 'b'.repeat(64),
  });
}

type SyntheticLayerAScenario = 'success' | 'omitted-responsibility' | 'unauthorized-shadow-path' | 'residual-v5-deficit';

async function testSyntheticLayerAEndToEnd(root: string, paths: {
  evidence: string;
  observable: string;
  brief: string;
}, scenario: SyntheticLayerAScenario): Promise<void> {
  const liveRepositoryRoot = join(root, `synthetic-layer-a-${scenario}-git-clone`);
  const cloned = spawnSync('git', ['clone', '--quiet', '--shared', process.cwd(), liveRepositoryRoot], { encoding: 'utf8' });
  assert.equal(cloned.status, 0, cloned.stderr);
  const nodeModules = join(process.cwd(), 'node_modules');
  const linked = spawnSync('ln', ['-s', nodeModules, join(liveRepositoryRoot, 'node_modules')], { encoding: 'utf8' });
  assert.equal(linked.status, 0, linked.stderr);
  const accepted = await readAcceptedPreschoolReferenceResponsibilityBrief(paths.brief);
  if (!accepted.ok) throw new Error(accepted.reason);
  const brief = accepted.value.brief;
  const ids = brief.responsibilities.map((_, index) => `preschool_neutral_synthetic_reference_${String(index + 1).padStart(2, '0')}`);
  const entries = ids.map((id, index) => ({
    id,
    title: `Synthetic reference ${index + 1}`,
    text: `Synthetic scene for supplied responsibility ${index + 1}; no historical instance answer is used.`,
    originTags: ['neutral'],
    ageMin: 4,
    ageMax: 7,
  }));
  const responsibilities = brief.responsibilities.map((item, index) => ({
    responsibilityId: `responsibility-${String(index + 1).padStart(6, '0')}`,
    primaryLifeFunction: item.primaryLifeFunction,
    playerVisibleNeed: item.playerVisibleNeed,
    evidenceRefs: [],
  }));
  const cards = responsibilities.map((item, index) => ({
    responsibilityId: item.responsibilityId,
    primaryLifeFunction: item.primaryLifeFunction,
    playerVisibleNeed: item.playerVisibleNeed,
    developmentalAgeJustification: {
      ageMin: 4,
      whyNotEarlier: 'The synthetic scenario assumes a basic shared-social understanding.',
      whyFromThisAge: 'The synthetic scenario is legible to a preschool child.',
      whyThroughAgeSeven: 'The synthetic scenario stays small and age-appropriate.',
    },
    concreteSceneConcept: `Synthetic scene ${index + 1} addressing ${item.primaryLifeFunction}.`,
    existingContentDistinction: {
      closestEntryIds: ['preschool_neutral_peer_cooperation'],
      sharedSemanticArea: 'A child interacts with familiar people.',
      specificDistinction: `The synthetic scene addresses supplied responsibility ${index + 1}.`,
    },
    actorClass: 'TRANSIENT_ROLE_ONLY',
    pastEvidenceConsumed: 'NONE',
    meaningfulPlayerDecision: 'NONE',
    durableResult: 'EVENT_HISTORY_ID_ONLY',
    futureHook: 'NONE',
    originPortability: 'No origin-specific people or setting are required.',
    scopeCheck: 'CONTRACT_PRESERVING',
    proposedEntry: entries[index],
  }));
  if (scenario === 'omitted-responsibility') {
    responsibilities.pop();
    cards.pop();
  }
  if (scenario === 'residual-v5-deficit') {
    for (const entry of entries) entry.ageMin = 7;
    for (const card of cards) card.developmentalAgeJustification.ageMin = 7;
  }
  const observableRef = 'source/reference-trial/observable-payload.json';
  const briefRef = 'source/reference-trial/reference-responsibility-brief.json';
  const attestationRef = 'source/reference-trial/reference-responsibility-attestation.json';
  const catalogRef = 'src/data/lines/preschool-passive-spine.json';
  const problemId = 'problem-hypothesis-000001';
  const solution = {
    schemaVersion: 'solution-work-v1', status: 'OPTIONS', problemId,
    options: [{
      optionId: 'option-000001', proposedChange: 'Append synthetic contract-bound preschool entries.',
      rationale: 'This synthetic fixture exercises supplied responsibilities and the structural capacity gate.',
      repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef], changeScope: 'program',
      expectedPlayerObservableDifference: 'Additional distinct synthetic preschool entries can be selected.',
      risks: [], unknowns: [],
      autonomousAuthoring: {
        schemaVersion: 'autonomous-authoring-proposal-v1',
        contractId: 'preschool-shared-neutral-passive-capacity-v1', contractVersion: 1,
        gapClassification: 'CONTENT_GAP', gapSubtype: 'CONTENT_CAPACITY_GAP',
        applicabilityClaim: 'APPLICABLE', authorityRefs: ['docs/governance/product-decisions.md'],
        sourceEvidenceRefs: [observableRef], responsibilities,
        contractPayload: { schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1', cards },
      },
    }],
    recommendedOptionId: 'option-000001', summary: 'Synthetic contract-bound proposal.',
    repoRefs: [catalogRef], artifactRefs: [observableRef, briefRef],
  };
  const review = {
    schemaVersion: 'solution-review-v1', problemId, decision: 'ACCEPT_OPTION', acceptedOptionId: 'option-000001',
    scopeAssessment: 'code_required', executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
    autonomousAuthoringAssessment: {
      schemaVersion: 'autonomous-authoring-review-assessment-v1',
      contractId: 'preschool-shared-neutral-passive-capacity-v1', contractVersion: 1,
      applicabilityAssessment: 'APPLICABLE', conformance: 'CONFORMING', executionEnvelope: 'WITHIN_ENVELOPE',
      assessment: 'Synthetic one-to-one responsibility preservation and contract conformance.', blockers: [],
    },
    assessment: 'Synthetic Layer A review.', repoRefs: [catalogRef],
    artifactRefs: [observableRef, briefRef, attestationRef], concerns: [],
  };
  const executorResult = {
    schemaVersion: 'shadow-authoring-execution-participant-result-v1', status: 'completed',
    changedFiles: [catalogRef, 'tests/preschoolPassiveSpineTests.ts', 'tests/annualPassiveMemoryTests.ts'],
    verificationCommandsRun: [], deviations: [],
  };
  const executorScript = [
    "const fs = require('node:fs');",
    "const path = 'src/data/lines/preschool-passive-spine.json';",
    'const catalog = JSON.parse(fs.readFileSync(path, "utf8"));',
    'catalog.entries.push(...JSON.parse(process.argv[1]));',
    'fs.writeFileSync(path, JSON.stringify(catalog, null, 2) + "\\n");',
    'const ids = JSON.parse(process.argv[2]);',
    'for (const name of ["preschoolPassiveSpineTests.ts", "annualPassiveMemoryTests.ts"]) {',
    '  const block = `\\nimport { readFileSync as readSyntheticCatalog } from "node:fs";\\nif (process.argv[1]?.endsWith(\'${name}\')) {\\n  const rows = JSON.parse(readSyntheticCatalog("src/data/lines/preschool-passive-spine.json", "utf8")).entries;\\n  for (const id of ${JSON.stringify(ids)}) if (!rows.some((row) => row.id === id)) throw new Error("AUTONOMOUS_AUTHORING_MISSING_ENTRY: " + id);\\n}\\n`;',
    '  fs.appendFileSync(`tests/${name}`, block);',
    '}',
    'if (process.argv[4] === "unauthorized-shadow-path") fs.writeFileSync("docs/synthetic-shadow-unauthorized.txt", "outside allowedWritePaths");',
    'process.stdout.write(process.argv[3]);',
  ].join('\n');
  const jobs: string[] = [];
  const participant: WorkspaceAgentParticipantOptions = {
    executable: process.execPath,
    buildArgs: job => {
      jobs.push(job.role);
      if (job.role === 'solution') return ['-e', 'process.stdout.write(process.argv[1])', JSON.stringify(solution)];
      if (job.role === 'reviewer') return ['-e', 'process.stdout.write(process.argv[1])', JSON.stringify(review)];
      return ['-e', executorScript, JSON.stringify(entries), JSON.stringify(ids), JSON.stringify(executorResult), scenario];
    },
  };
  const before = await captureAuthoritativeFingerprint(liveRepositoryRoot);
  const trial = runPreschoolReferenceTrial({
    liveRepositoryRoot,
    evidencePath: paths.evidence,
    observablePayloadPath: paths.observable,
    responsibilityBriefPath: paths.brief,
    attemptRef: 'attempt-000900',
  }, { resolveParticipantBinding: async () => ({ participant }) as never });
  if (scenario !== 'success') {
    const expectedFailure = scenario === 'omitted-responsibility'
      ? /reference responsibility count or applicability does not match the accepted brief/
      : scenario === 'unauthorized-shadow-path'
        ? /Shadow workspace changed paths outside the Contract/
        : /Structural capacity deficit must decrease from a positive value to zero/;
    await assert.rejects(trial, expectedFailure);
    const outputRoot = join(liveRepositoryRoot, REFERENCE_TRIAL_ATTEMPTS_PATH, 'attempt-000900');
    assert.deepEqual(jobs, scenario === 'omitted-responsibility'
      ? ['solution', 'reviewer']
      : ['solution', 'reviewer', 'configuration-execution']);
    await assert.rejects(readFile(join(outputRoot, 'trial-result.json')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(outputRoot, 'promotion-package.json')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(outputRoot, 'promotion.patch')), { code: 'ENOENT' });
    if (scenario === 'omitted-responsibility') {
      await assert.rejects(readFile(join(outputRoot, 'decision.json')), { code: 'ENOENT' });
      await assert.rejects(readdir(join(outputRoot, 'shadow-authoring')), { code: 'ENOENT' });
    } else {
      const decision = JSON.parse(await readFile(join(outputRoot, 'decision.json'), 'utf8')) as { route: string };
      assert.equal(decision.route, 'READY_FOR_SHADOW_AUTHORING');
    }
    assert.equal(await captureAuthoritativeFingerprint(liveRepositoryRoot), before);
    process.stdout.write(`historical integration negative ${scenario}: PASS\n`);
    return;
  }
  const result = await trial;
  assert.equal(result.status, 'SHADOW_AUTHORING_VERIFIED');
  if (result.status !== 'SHADOW_AUTHORING_VERIFIED') throw new Error('synthetic Layer A did not verify');
  assert.equal(result.validationLayer, 'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM');
  assert.equal(result.responsibilityProvenance, 'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES');
  assert.equal(result.referenceResponsibilityBriefSha256, accepted.value.sha256);
  assert.equal(result.responsibilityMappings.length, brief.responsibilities.length);
  assert.equal(result.newEntryCount, brief.responsibilities.length);
  assert.deepEqual(jobs, ['solution', 'reviewer', 'configuration-execution']);
  assert.equal(await captureAuthoritativeFingerprint(liveRepositoryRoot), before);
  const packageJson = JSON.parse(await readFile(result.promotionPackagePath, 'utf8')) as { schemaVersion: string; authoritativeRepositoryUnchanged: boolean; naturalPverPerformed: boolean };
  assert.equal(packageJson.schemaVersion, 'shadow-authoring-promotion-package-v1');
  assert.equal(packageJson.authoritativeRepositoryUnchanged, true);
  assert.equal(packageJson.naturalPverPerformed, false);
  assert.ok((await readFile(result.promotionPatchPath)).length > 0);
}

export async function runPreschoolAutonomousAuthoringReferenceTrialTests(): Promise<void> {
  const strictIntegrationRequired = process.env.PRESCHOOL_REFERENCE_TRIAL_INTEGRATION_REQUIRED === '1';
  const acceptedEvidenceTestPath = strictIntegrationRequired
    ? process.env.PRESCHOOL_REFERENCE_CAPACITY_EVIDENCE_PATH : undefined;
  const acceptedObservableTestPath = strictIntegrationRequired
    ? process.env.PRESCHOOL_REFERENCE_OBSERVABLE_PAYLOAD_PATH : undefined;
  const acceptedBriefTestPath = strictIntegrationRequired
    ? process.env.PRESCHOOL_REFERENCE_RESPONSIBILITY_BRIEF_PATH : undefined;
  if (strictIntegrationRequired && (!acceptedEvidenceTestPath || !acceptedObservableTestPath || !acceptedBriefTestPath)) {
    throw new Error('strict historical external-input integration requires all three accepted input paths');
  }
  testReferenceResponsibilityBriefContract();
  testReferenceResponsibilityPreservation();
  testQualifiedLayerAResult();
  assert.equal(
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
    'b7adb3af9c32c7476186dadd592b82410b08ac9f0784df11495b5c4ebd3d74d3',
  );
  assert.equal(
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
    'd91231e2967e75bf508d276c3163fc6ca5fcd2cbeba21db71132b3374b676ab4',
  );

  const root = await mkdtemp(join(tmpdir(), 'preschool-reference-trial-test-'));
  try {
    const syntheticBrief = validatePreschoolReferenceResponsibilityBrief({
      schemaVersion: 'preschool-reference-responsibility-brief-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      responsibilities: [{
        responsibilityRef: 'reference-responsibility-000001',
        primaryLifeFunction: 'Shared play',
        playerVisibleNeed: 'A child needs a shared play experience.',
      }],
    });
    const syntheticBriefBytes = Buffer.from(canonicalJson(syntheticBrief));
    const syntheticBriefPath = join(root, 'synthetic-brief.json');
    await writeFile(syntheticBriefPath, syntheticBriefBytes);
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(null), {
      ok: false,
      reason: 'Reference Responsibility Brief path was not supplied.',
    });
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(join(root, 'absent-brief.json')), {
      ok: false,
      reason: 'Reference Responsibility Brief file could not be read.',
    });
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(syntheticBriefPath), {
      ok: false,
      reason: 'Reference Responsibility Brief digest did not match the accepted digest.',
    });
    const malformedBriefPath = join(root, 'malformed-brief.json');
    await writeFile(malformedBriefPath, '{invalid json');
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(malformedBriefPath), {
      ok: false,
      reason: 'Reference Responsibility Brief is malformed JSON.',
    });
    const invalidBriefPath = join(root, 'invalid-brief.json');
    await writeFile(invalidBriefPath, '{}');
    assert.deepEqual(await readAcceptedPreschoolReferenceResponsibilityBrief(invalidBriefPath), {
      ok: false,
      reason: 'Reference Responsibility Brief schema or runRef is invalid.',
    });
    if (acceptedBriefTestPath) {
      const accepted = await readAcceptedPreschoolReferenceResponsibilityBrief(acceptedBriefTestPath);
      if (!accepted.ok) throw new Error(accepted.reason);
      assert.deepEqual(accepted.value.bytes, await readFile(acceptedBriefTestPath));
      assert.equal(accepted.value.sha256, '864f99ffa26d41631e329c229a7289bef2e9998fe04eb4c25ef51dcf5b99980a');
      assert.equal(accepted.value.brief.responsibilities.length, 5);
    }
    const syntheticAcceptedBrief = {
      brief: syntheticBrief,
      bytes: syntheticBriefBytes,
      sha256: sha256Hex(syntheticBriefBytes),
    };
    const currentRoot = join(root, 'current');
    const historicalRoot = join(root, 'historical');
    const packetPath = 'source/reference-trial/autonomous-authoring-contract-packet.json';
    const syntheticPayloadBytes = Buffer.from(`${JSON.stringify({
      transcriptVersion: 'player-observable-v1',
      surfaceId: 'headless-api-player-v1',
      transcriptId: 'synthetic-preschool-visible',
      entries: [{
        entryId: 'entry-000001',
        kind: 'story_event',
        age: 5,
        title: '一起搭小桥',
        body: '你和同伴一起搭起小桥。',
        experienceContext: {
          schemaVersion: 'experience-semantic-context-v1',
          experienceCategory: 'passive',
          expectedExperienceSignals: ['shared_play'],
        },
      }],
    }, null, 2)}\n`);
    const syntheticPayloadSha = createHash('sha256').update(syntheticPayloadBytes).digest('hex');
    const syntheticPayloadPath = join(root, 'synthetic-observable-payload.json');
    await writeFile(syntheticPayloadPath, syntheticPayloadBytes);
    assert.equal(await readExactReferenceObservablePayload(syntheticPayloadPath, syntheticPayloadSha) instanceof Buffer, true);
    assert.equal(await readExactReferenceObservablePayload(join(root, 'missing-observable.json'), syntheticPayloadSha), null);
    assert.equal(await readExactReferenceObservablePayload(syntheticPayloadPath, PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256), null);
    const malformedPayloadPath = join(root, 'malformed-observable.json');
    await writeFile(malformedPayloadPath, '{invalid json');
    assert.equal(await readExactReferenceObservablePayload(malformedPayloadPath, createHash('sha256').update('{invalid json').digest('hex')), null);
    const invalidPayloadPath = join(root, 'invalid-observable.json');
    await writeFile(invalidPayloadPath, '{}');
    assert.equal(await readExactReferenceObservablePayload(invalidPayloadPath, createHash('sha256').update('{}').digest('hex')), null);

    const currentAuthorityText = [
      '### PD-121：Contract-Constrained Autonomous Authoring v1\n',
      '# Content Authoring Workflow Contract v3\nPD-121\nHuman exact-patch promotion\n',
      'Auto Evolution current authority includes PD-121.\n',
    ];
    for (const [index, path] of AUTHORITY_PATHS.entries()) {
      await put(currentRoot, path, `${currentAuthorityText[index]}\nPD-121 current authority\n`);
      await put(historicalRoot, path, `${path}\nhistorical authority\n`);
    }
    await put(currentRoot, ACCEPTED_DESIGN_PATH, await readFile(join(process.cwd(), ACCEPTED_DESIGN_PATH), 'utf8'));
    await put(currentRoot, RESIDUAL_DESIGN_PATH, `later approved design\n${ANSWER_IDS.join('\n')}\n`);
    await put(currentRoot, 'src/data/lines/preschool-passive-spine.json', JSON.stringify({ entries: ANSWER_IDS.map(id => ({ id })) }));
    await put(currentRoot, 'tests/preschoolPassiveSpineTests.ts', `current tests ${ANSWER_IDS.join(' ')}`);
    await put(currentRoot, 'tests/annualPassiveMemoryTests.ts', `current annual tests ${ANSWER_IDS.join(' ')}`);
    await put(currentRoot, 'artifacts/evolution/later-pver/observations.json', `later PVER ${ANSWER_IDS.join(' ')}`);

    await put(historicalRoot, 'src/data/lines/preschool-passive-spine.json', JSON.stringify({ entries: [{ id: 'historical_safe_entry' }] }));
    await put(historicalRoot, 'src/data/infantPassiveNarrativeCatalog.ts', 'identical historical catalog bytes');
    await put(historicalRoot, 'tests/preschoolPassiveSpineTests.ts', 'historical preschool tests');
    await put(historicalRoot, 'tests/annualPassiveMemoryTests.ts', 'historical annual tests');
    await put(historicalRoot, RESIDUAL_DESIGN_PATH, `forbidden residual design ${ANSWER_IDS.join(' ')}`);
    await put(historicalRoot, ACCEPTED_DESIGN_PATH, `accepted design reference section ${ANSWER_IDS.join(' ')}`);
    await put(historicalRoot, 'artifacts/evolution/later-pver/observations.json', `later PVER ${ANSWER_IDS.join(' ')}`);

    await overlayReferenceTrialAuthority(currentRoot, historicalRoot);

    const legacyOutputFixtureRoot = join(root, 'legacy-output-fixture');
    assert.equal(
      await createPreschoolReferenceTrialOutputRoot(legacyOutputFixtureRoot),
      join(legacyOutputFixtureRoot, REFERENCE_TRIAL_ROOT_PATH),
    );

    const identityRoot = join(root, 'attempt-identity-fixture');
    const legacyAttemptRoot = join(identityRoot, REFERENCE_TRIAL_ROOT_PATH);
    const legacyHypothesis = Buffer.from('legacy attempt one hypothesis bytes\n');
    const legacyLog = Buffer.from('legacy attempt one log bytes\n');
    await put(
      identityRoot,
      join(REFERENCE_TRIAL_ROOT_PATH, 'source/reference-trial/improvement-hypothesis.json'),
      legacyHypothesis.toString('utf8'),
    );
    await put(
      identityRoot,
      join(REFERENCE_TRIAL_ROOT_PATH, 'trial-cli-output.log'),
      legacyLog.toString('utf8'),
    );

    const attemptTwoRoot = await createPreschoolReferenceTrialOutputRoot(identityRoot, 'attempt-000002');
    assert.equal(attemptTwoRoot, join(legacyAttemptRoot, 'attempts', 'attempt-000002'));
    await put(attemptTwoRoot, 'source/reference-trial/improvement-hypothesis.json', 'attempt two hypothesis bytes\n');
    await put(attemptTwoRoot, 'trial-cli-output.log', 'attempt two log bytes\n');
    assert.deepEqual((await listFiles(attemptTwoRoot)).sort(), [
      'source/reference-trial/improvement-hypothesis.json',
      'trial-cli-output.log',
    ]);
    await assert.rejects(
      createPreschoolReferenceTrialOutputRoot(identityRoot, 'attempt-000002'),
      /EEXIST/,
    );
    const attemptThreeRoot = await createPreschoolReferenceTrialOutputRoot(identityRoot, 'attempt-000003');
    assert.equal(attemptThreeRoot, join(legacyAttemptRoot, 'attempts', 'attempt-000003'));
    assert.deepEqual((await readdir(join(legacyAttemptRoot, 'attempts'))).sort(), ['attempt-000002', 'attempt-000003']);
    assert.deepEqual(await readFile(join(legacyAttemptRoot, 'source/reference-trial/improvement-hypothesis.json')), legacyHypothesis);
    assert.deepEqual(await readFile(join(legacyAttemptRoot, 'trial-cli-output.log')), legacyLog);

    const unsafeAttemptRefs = ['../attempt-000002', '/absolute/path', 'attempt-2', 'attempt-000002/foo', ''];
    for (const unsafeAttemptRef of unsafeAttemptRefs) {
      await assert.rejects(
        createPreschoolReferenceTrialOutputRoot(identityRoot, unsafeAttemptRef),
        /Invalid reference trial attemptRef/,
      );
    }
    assert.equal(
      referenceTrialInvocationRef('attempt-000002', 'solution'),
      'preschool-pver-20260922231805-71297571/attempt-000002/solution-000001',
    );
    assert.equal(
      referenceTrialInvocationRef('attempt-000002', 'reviewer'),
      'preschool-pver-20260922231805-71297571/attempt-000002/reviewer-000001',
    );
    assert.equal(
      referenceTrialInvocationRef('attempt-000002', 'shadow-authoring'),
      'preschool-pver-20260922231805-71297571/attempt-000002/shadow-authoring',
    );
    assert.equal(
      referenceTrialInvocationRef(null, 'solution'),
      'preschool-pver-20260922231805-71297571-solution-000001',
    );

    const cliRoot = join(root, 'attempt-ref-cli');
    await mkdir(cliRoot, { recursive: true });
    const originalWorkingDirectory = process.cwd();
    process.chdir(cliRoot);
    try {
      await assert.rejects(
        runPreschoolReferenceTrialCli([
          '--evidence', join(root, 'missing-cli-evidence.json'),
          '--attempt-ref', '../attempt-000002',
        ]),
        /Invalid reference trial attemptRef/,
      );
      const cliStopCode = await runPreschoolReferenceTrialCli([
        '--evidence', join(root, 'missing-cli-evidence.json'),
        '--observable-payload', syntheticPayloadPath,
        '--responsibility-brief', syntheticBriefPath,
        '--attempt-ref', 'attempt-000002',
      ]);
      assert.equal(cliStopCode, 1);
      await assert.rejects(readdir(join(cliRoot, REFERENCE_TRIAL_ATTEMPTS_PATH)), { code: 'ENOENT' });
    } finally {
      process.chdir(originalWorkingDirectory);
    }

    const hostInputRoot = join(root, 'synthetic-host-inputs');
    const trialInputs = await writePreschoolReferenceTrialInputs({
      outputRoot: hostInputRoot,
      authorityRepositoryRoot: currentRoot,
      candidateBaselineRoot: historicalRoot,
      runRef: 'preschool-pver-20260922231805-71297571',
      observablePayloadBytes: syntheticPayloadBytes,
      responsibilityBrief: syntheticAcceptedBrief,
    });
    assert.equal(trialInputs.problemPackage.source.observablePayloadRef, 'source/reference-trial/observable-payload.json');
    assert.deepEqual(
      await readFile(join(hostInputRoot, 'source/reference-trial/reference-responsibility-brief.json')),
      syntheticBriefBytes,
    );
    assert.equal(
      trialInputs.artifactRelativePaths.includes('source/reference-trial/reference-responsibility-brief.json'),
      true,
    );
    const responsibilityAttestationPath = 'source/reference-trial/reference-responsibility-attestation.json';
    assert.deepEqual(
      JSON.parse(await readFile(join(hostInputRoot, responsibilityAttestationPath), 'utf8')),
      {
        schemaVersion: 'preschool-reference-responsibility-attestation-v1',
        runRef: 'preschool-pver-20260922231805-71297571',
        validationLayer: 'HISTORICAL_CONTROLLED_DOWNSTREAM_MECHANISM',
        responsibilityProvenance: 'HUMAN_APPROVED_REFERENCE_RESPONSIBILITIES',
        referenceResponsibilityBriefRef: 'source/reference-trial/reference-responsibility-brief.json',
        referenceResponsibilityBriefSha256: syntheticAcceptedBrief.sha256,
      },
    );
    assert.equal(trialInputs.artifactRelativePaths.includes(responsibilityAttestationPath), true);
    assert.equal(trialInputs.problemPackage.source.diagnosticEvidenceRefs.includes(responsibilityAttestationPath), false);
    if (acceptedBriefTestPath) {
      const accepted = await readAcceptedPreschoolReferenceResponsibilityBrief(acceptedBriefTestPath);
      if (!accepted.ok) throw new Error(accepted.reason);
      const acceptedInputRoot = join(root, 'accepted-brief-inputs');
      await writePreschoolReferenceTrialInputs({
        outputRoot: acceptedInputRoot,
        authorityRepositoryRoot: currentRoot,
        candidateBaselineRoot: historicalRoot,
        runRef: 'preschool-pver-20260922231805-71297571',
        observablePayloadBytes: syntheticPayloadBytes,
        responsibilityBrief: accepted.value,
      });
      const materializedBriefBytes = await readFile(
        join(acceptedInputRoot, 'source/reference-trial/reference-responsibility-brief.json'),
      );
      assert.deepEqual(materializedBriefBytes, await readFile(acceptedBriefTestPath));
      assert.equal(sha256Hex(materializedBriefBytes), accepted.value.sha256);
    }
    const materializedPayload = await readFile(join(hostInputRoot, 'source/reference-trial/observable-payload.json'));
    assert.deepEqual(materializedPayload, syntheticPayloadBytes);
    assert.equal(createHash('sha256').update(materializedPayload).digest('hex'), syntheticPayloadSha);
    assert.deepEqual(trialInputs.problemPackage.source.diagnosticEvidenceRefs, [
      'source/reference-trial/capacity-summary.json',
      'source/reference-trial/reference-source-attestation.json',
    ]);
    const attestation = JSON.parse(await readFile(join(hostInputRoot, 'source/reference-trial/reference-source-attestation.json'), 'utf8'));
    assert.deepEqual(attestation, {
      schemaVersion: 'preschool-reference-source-attestation-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      historicalBaselineGitSha: 'e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf',
      observablePayloadSha256: syntheticPayloadSha,
      verification: 'HOST_VERIFIED_FIXED_REFERENCE_CASE',
    });
    const attestationText = JSON.stringify(attestation);
    for (const forbidden of ['passiveEntryIds', 'eventHistoryAdded', 'source-fingerprint', 'internal/player-surface-source', 'seed', 'persona', ...ANSWER_IDS]) {
      assert.equal(attestationText.includes(forbidden), false, forbidden);
    }
    assert.deepEqual(trialInputs.problemPackage.problem.unknowns, [REFERENCE_HYPOTHESIS_UNKNOWN]);
    const storedHypotheses = parseStoredImprovementHypothesisSet(
      await readFile(join(hostInputRoot, 'source/reference-trial/improvement-hypothesis.json'), 'utf8'),
    );
    assert.equal(storedHypotheses.hypotheses.length, 1);
    assert.equal(storedHypotheses.hypotheses[0]?.unknowns.length, 1);
    for (const relativePath of trialInputs.artifactRelativePaths) {
      const participantInput = await readFile(join(hostInputRoot, relativePath), 'utf8');
      for (const answerId of ANSWER_IDS) assert.equal(participantInput.includes(answerId), false, relativePath);
    }
    for (const answerId of ANSWER_IDS) assert.equal(JSON.stringify(trialInputs.problemPackage).includes(answerId), false);

    const solutionWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'solution-workspace'),
      jobKind: 'solution',
      artifactSourceRoot: hostInputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    const reviewerWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'reviewer-workspace'),
      jobKind: 'reviewer',
      artifactSourceRoot: hostInputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });

    for (const workspace of [solutionWorkspace.workspaceRoot, reviewerWorkspace.workspaceRoot]) {
      const visibleFiles = await listFiles(workspace);
      assert.equal(visibleFiles.includes(RESIDUAL_DESIGN_PATH), false);
      assert.equal(visibleFiles.includes(ACCEPTED_DESIGN_PATH), false);
      assert.equal(visibleFiles.includes('artifacts/evolution/later-pver/observations.json'), false);
      assert.equal(visibleFiles.includes('tests/preschoolPassiveSpineTests.ts'), true);
      assert.equal(visibleFiles.includes('tests/annualPassiveMemoryTests.ts'), true);
      assert.equal(await readFile(join(workspace, 'tests/preschoolPassiveSpineTests.ts'), 'utf8'), 'historical preschool tests');
      assert.equal(await readFile(join(workspace, 'tests/annualPassiveMemoryTests.ts'), 'utf8'), 'historical annual tests');
      assert.equal(visibleFiles.includes(packetPath), true);
      assert.deepEqual(await readFile(join(workspace, 'source/reference-trial/observable-payload.json')), syntheticPayloadBytes);
      const visiblePayload = JSON.parse(await readFile(join(workspace, 'source/reference-trial/observable-payload.json'), 'utf8'));
      assert.equal(visiblePayload.entries[0].age, 5);
      assert.equal(visiblePayload.entries[0].body, '你和同伴一起搭起小桥。');
      assert.equal(visiblePayload.entries[0].experienceContext.experienceCategory, 'passive');
      assert.equal(visibleFiles.includes('source/reference-trial/reference-source-attestation.json'), true);
      assert.equal(visibleFiles.includes(responsibilityAttestationPath), true);
      for (const forbiddenPath of [
        'internal/player-surface-source.json',
        'provenance/source-fingerprint.json',
        'inputs/run-input.json',
        'inputs/persona.json',
      ]) assert.equal(visibleFiles.includes(forbiddenPath), false, forbiddenPath);
      for (const authorityPath of AUTHORITY_PATHS) {
        assert.equal(await readFile(join(workspace, authorityPath), 'utf8'), await readFile(join(currentRoot, authorityPath), 'utf8'));
      }
      const safeCatalog = await readFile(join(workspace, 'src/data/lines/preschool-passive-spine.json'), 'utf8');
      for (const id of ANSWER_IDS) assert.equal(safeCatalog.includes(id), false);
      const visiblePacket = JSON.parse(await readFile(join(workspace, packetPath), 'utf8')) as { contractId: string };
      assert.equal(visiblePacket.contractId, 'preschool-shared-neutral-passive-capacity-v1');
    }

    let participantBindingResolved = false;
    const stop = await runPreschoolReferenceTrial({
      liveRepositoryRoot: currentRoot,
      evidencePath: join(root, 'missing-accepted-evidence.json'),
    }, {
      resolveParticipantBinding: async () => {
        participantBindingResolved = true;
        throw new Error('must not resolve a Participant binding without fixed evidence');
      },
    });
    assert.deepEqual(stop, {
      schemaVersion: 'preschool-reference-trial-stop-v1',
      status: 'REFERENCE_EVIDENCE_UNAVAILABLE',
      runRef: 'preschool-pver-20260922231805-71297571',
      reason: 'Exact accepted chronology was not supplied; replay or evidence reconstruction is forbidden for this trial.',
    });
    assert.equal(participantBindingResolved, false);

    for (const unsafeAttemptRef of unsafeAttemptRefs) {
      await assert.rejects(
        runPreschoolReferenceTrial({
          liveRepositoryRoot: currentRoot,
          evidencePath: join(root, 'missing-accepted-evidence.json'),
          attemptRef: unsafeAttemptRef,
        }),
        /Invalid reference trial attemptRef/,
      );
    }

    const fabricatedEvidencePath = join(root, 'fabricated-but-well-formed-evidence.json');
    await writeFile(fabricatedEvidencePath, JSON.stringify({
      schemaVersion: 'preschool-capacity-evidence-v1',
      runRef: 'preschool-pver-20260922231805-71297571',
      evidenceMode: 'STRUCTURAL_EXHAUSTION',
      canonicalOriginTag: 'scholar',
      preConsumedEntryIds: [],
      beats: Array.from({ length: 30 }, (_, index) => ({
        sequence: index + 1,
        age: 4 + (index % 4),
        selectedEntryId: `fabricated-entry-${index + 1}`,
        kind: index < 4 ? 'GAP' : 'AUTHORED',
        legalUnconsumedCountBeforeSelection: index < 4 ? 0 : 1,
      })),
      demandBeats: 30,
      authoredBeats: 26,
      gapBeats: 4,
      foreignOriginLeakCount: 0,
      duplicateAuthoredCount: 0,
    }), 'utf8');
    let fabricatedEvidenceResolvedBinding = false;
    const fabricatedEvidenceStop = await runPreschoolReferenceTrial({
      liveRepositoryRoot: currentRoot,
      evidencePath: fabricatedEvidencePath,
      attemptRef: 'attempt-000002',
    }, {
      resolveParticipantBinding: async () => {
        fabricatedEvidenceResolvedBinding = true;
        throw new Error('must not resolve a Participant binding for unanchored evidence');
      },
    }).catch(() => null);
    assert.deepEqual(fabricatedEvidenceStop, stop);
    assert.equal(fabricatedEvidenceResolvedBinding, false);
    await assert.rejects(readdir(join(currentRoot, REFERENCE_TRIAL_ATTEMPTS_PATH)), { code: 'ENOENT' });

    if (acceptedEvidenceTestPath) {
      assert.equal(
        createHash('sha256').update(await readFile(acceptedEvidenceTestPath)).digest('hex'),
        PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
      );
      await put(currentRoot, 'source/reference-trial/observable-summary.json', '{"diagnosticOnly":true}\n');
      for (const observablePayloadPath of [join(root, 'missing-observable.json'), syntheticPayloadPath]) {
        let resolvedBinding = false;
        const payloadStop = await runPreschoolReferenceTrial({
          liveRepositoryRoot: currentRoot,
          evidencePath: acceptedEvidenceTestPath,
          observablePayloadPath,
          attemptRef: 'attempt-000004',
        }, {
          resolveParticipantBinding: async () => {
            resolvedBinding = true;
            throw new Error('must not bind a Participant without the exact sealed observable payload');
          },
        });
        assert.deepEqual(payloadStop, {
          schemaVersion: 'preschool-reference-trial-stop-v1',
          status: 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE',
          runRef: 'preschool-pver-20260922231805-71297571',
          reason: 'Exact sealed player-visible reference payload was not supplied or did not match the accepted digest.',
        });
        assert.equal(resolvedBinding, false);
        await assert.rejects(readdir(join(currentRoot, REFERENCE_TRIAL_ATTEMPTS_PATH)), { code: 'ENOENT' });
      }
    }

    if (strictIntegrationRequired) {
      assert.equal(sha256Hex(await readFile(acceptedObservableTestPath!)), PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256);
      const paths = {
        evidence: acceptedEvidenceTestPath,
        observable: acceptedObservableTestPath,
        brief: acceptedBriefTestPath,
      } as { evidence: string; observable: string; brief: string };
      await testSyntheticLayerAEndToEnd(root, paths, 'success');
      await testSyntheticLayerAEndToEnd(root, paths, 'omitted-responsibility');
      await testSyntheticLayerAEndToEnd(root, paths, 'unauthorized-shadow-path');
      await testSyntheticLayerAEndToEnd(root, paths, 'residual-v5-deficit');
    }
    if (acceptedEvidenceTestPath && acceptedObservableTestPath) {
      for (const [responsibilityBriefPath, reason] of [
        [null, 'Reference Responsibility Brief path was not supplied.'],
        [syntheticBriefPath, 'Reference Responsibility Brief digest did not match the accepted digest.'],
        [malformedBriefPath, 'Reference Responsibility Brief is malformed JSON.'],
        [invalidBriefPath, 'Reference Responsibility Brief schema or runRef is invalid.'],
      ] as const) {
        let resolvedBinding = false;
        const briefStop = await runPreschoolReferenceTrial({
          liveRepositoryRoot: currentRoot,
          evidencePath: acceptedEvidenceTestPath,
          observablePayloadPath: acceptedObservableTestPath,
          responsibilityBriefPath,
        }, {
          resolveParticipantBinding: async () => {
            resolvedBinding = true;
            throw new Error('must not bind a Participant without the exact accepted brief');
          },
        });
        assert.deepEqual(briefStop, {
          schemaVersion: 'preschool-reference-trial-stop-v1',
          status: 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE',
          runRef: 'preschool-pver-20260922231805-71297571',
          reason,
        });
        assert.equal(resolvedBinding, false);
        await assert.rejects(readdir(join(currentRoot, REFERENCE_TRIAL_ROOT_PATH)), { code: 'ENOENT' });
      }
    }

    const safeParticipant: WorkspaceAgentParticipantOptions = {
      executable: 'fake-participant',
      buildArgs: () => ['safe'],
    };
    let buildArgsCalled = false;
    const guardedParticipant = withParticipantContaminationGuard({
      ...safeParticipant,
      buildArgs: (input: WorkspaceAgentJobInput) => {
        buildArgsCalled = true;
        return safeParticipant.buildArgs(input);
      },
    });
    const promptInput: WorkspaceAgentJobInput = {
      invocationRef: 'reference-trial-test',
      role: 'solution',
      workspaceRoot: solutionWorkspace.workspaceRoot,
      prompt: 'safe answer-free prompt',
    };
    assert.deepEqual(guardedParticipant.buildArgs(promptInput), ['safe']);
    assert.equal(buildArgsCalled, true);
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs({ ...promptInput, prompt: `contaminated ${ANSWER_IDS[0]}` }), /contamination/i);
    assert.equal(buildArgsCalled, false);

    const leakedName = `${ANSWER_IDS[2]}.txt`;
    await put(solutionWorkspace.workspaceRoot, leakedName, 'marker in participant-visible path');
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs(promptInput), /contamination/i);
    assert.equal(buildArgsCalled, false);
    await rm(join(solutionWorkspace.workspaceRoot, leakedName));

    await put(solutionWorkspace.workspaceRoot, 'participant-visible-leak.txt', ANSWER_IDS[1]);
    buildArgsCalled = false;
    assert.throws(() => guardedParticipant.buildArgs(promptInput), /contamination/i);
    assert.equal(buildArgsCalled, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  process.stdout.write(strictIntegrationRequired
    ? 'historical external-input integration: EXECUTED / PASS\n'
    : 'historical external-input integration: NOT RUN\n');
}

if (process.argv[1]?.endsWith('preschoolAutonomousAuthoringReferenceTrial.test.ts')) {
  runPreschoolAutonomousAuthoringReferenceTrialTests().then(() => {
    process.stdout.write('preschoolAutonomousAuthoringReferenceTrial.test.ts: ok\n');
  }).catch(error => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
