import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { WorkspaceAgentJobInput, WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { buildPreschoolAutonomousAuthoringContractPacket } from '../../scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket';
import {
  overlayReferenceTrialAuthority,
  prepareReferenceTrialParticipantWorkspace,
  runPreschoolReferenceTrial,
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
  const root = await mkdtemp(join(tmpdir(), 'preschool-reference-trial-test-'));
  try {
    const currentRoot = join(root, 'current');
    const historicalRoot = join(root, 'historical');
    const artifactRoot = join(root, 'host-artifacts');
    const packetPath = 'autonomous-authoring-contract-packet.json';

    const currentAuthorityText = [
      '### PD-121：Contract-Constrained Autonomous Authoring v1\n',
      '# Content Authoring Workflow Contract v3\nPD-121\nHuman exact-patch promotion\n',
      'Auto Evolution current authority includes PD-121.\n',
    ];
    for (const [index, path] of AUTHORITY_PATHS.entries()) {
      await put(currentRoot, path, `${currentAuthorityText[index]}\nPD-121 current authority\n`);
      await put(historicalRoot, path, `${path}\nhistorical authority\n`);
    }
    await put(currentRoot, ACCEPTED_DESIGN_PATH, `accepted design reference section\n${ANSWER_IDS.join('\n')}\n`);
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
    const packet = await buildPreschoolAutonomousAuthoringContractPacket({ repositoryRoot: currentRoot });
    await put(artifactRoot, packetPath, `${JSON.stringify(packet)}\n`);

    const solutionWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'solution-workspace'),
      jobKind: 'solution',
      artifactSourceRoot: artifactRoot,
      artifactRelativePaths: [packetPath],
    });
    const reviewerWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: historicalRoot,
      destinationRoot: join(root, 'reviewer-workspace'),
      jobKind: 'reviewer',
      artifactSourceRoot: artifactRoot,
      artifactRelativePaths: [packetPath],
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
