import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WorkspaceAgentJobInput, WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { parseStoredImprovementHypothesisSet } from '../../src/evolution/improvementHypothesisContract';
import {
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256,
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
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
const REFERENCE_HYPOTHESIS_UNKNOWN = 'The minimum sufficient shared-neutral responsibility set and concrete contract-conforming content instances needed to close the evidenced gaps remain to be derived and independently reviewed.';

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

export async function runPreschoolAutonomousAuthoringReferenceTrialTests(): Promise<void> {
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
    });
    assert.equal(trialInputs.problemPackage.source.observablePayloadRef, 'source/reference-trial/observable-payload.json');
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

    const acceptedEvidenceTestPath = process.env.PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_TEST_PATH;
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
}

if (process.argv[1]?.endsWith('preschoolAutonomousAuthoringReferenceTrial.test.ts')) {
  runPreschoolAutonomousAuthoringReferenceTrialTests().then(() => {
    process.stdout.write('preschoolAutonomousAuthoringReferenceTrial.test.ts: ok\n');
  }).catch(error => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
