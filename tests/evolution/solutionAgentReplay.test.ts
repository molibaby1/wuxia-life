import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import type {
  WorkspaceAgentJobInput,
  WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  runSolutionAgentReplay,
  runSolutionAgentReplayCli,
} from '../../scripts/evolution/replay/runSolutionAgentReplay';
import type { ParticipantSkillAssignment } from '../../scripts/evolution/problemAgnosticSolution/solutionParticipantSkills';
import {
  type ProblemPackageV2,
} from '../../src/evolution/problemPackageContract';
import {
  parseSolutionWork,
  type SolutionWorkV1,
} from '../../src/evolution/solutionWorkContract';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

const FIXED_ARTIFACT_REFS = [
  'source/observable-payload.json',
  'feedback-runs/feedback.json',
  'hypothesis-runs/hypotheses.json',
  'diagnostic/causal-attribution.json',
] as const;

const problemPackage: ProblemPackageV2 = {
  schemaVersion: 'problem-package-v2',
  problemId: 'problem-replay-000001',
  source: {
    runRef: 'ordinary-run-replay-000001',
    observablePayloadRef: FIXED_ARTIFACT_REFS[0],
    externalFeedbackRef: FIXED_ARTIFACT_REFS[1],
    improvementHypothesisRef: FIXED_ARTIFACT_REFS[2],
    diagnosticEvidenceRefs: [FIXED_ARTIFACT_REFS[3]],
  },
  problem: {
    hypothesisId: 'hypothesis-replay-000001',
    statement: 'A bounded Solution replay fixture problem.',
    observedBasis: 'A bounded historical observation.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-replay-000001'],
    unknowns: ['A bounded replay fixture unknown.'],
    productSignificance: 'It exercises the isolated Solution replay path.',
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

const solutionResult: SolutionWorkV1 = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'A bounded replay fixture change.',
    rationale: 'It is supported by the fixed fixture evidence.',
    repoRefs: ['src/example.ts'],
    artifactRefs: [FIXED_ARTIFACT_REFS[0]],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'A bounded fixture difference.',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One bounded replay fixture option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: [FIXED_ARTIFACT_REFS[0]],
};

const historicalSkillContent = 'historical Solution Skill bytes; current repository must not replace these\n';
const historicalSkillAssignment: ParticipantSkillAssignment = {
  identity: 'historical-solution-skill',
  version: '2026-09-10',
  canonicalPath: 'skills/historical-solution/SKILL.md',
  expectedContentSha256: sha256Hex(historicalSkillContent),
};

interface Fixture {
  root: string;
  experimentRoot: string;
  packagePath: string;
  artifactRoot: string;
  sourceWorkspace: string;
  sourceInvocationPath: string;
  sourceBaseline: string;
}

interface ParticipantState {
  calls: number;
  workspaceRoots: string[];
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'solution-agent-replay-'));
  const authoritativeRoot = join(root, 'authoritative');
  const experimentRoot = join(root, 'experiment');
  const artifactRoot = experimentRoot;
  await mkdir(join(authoritativeRoot, 'src'), { recursive: true });
  await mkdir(join(authoritativeRoot, 'skills/historical-solution'), { recursive: true });
  await mkdir(join(artifactRoot, 'source'), { recursive: true });
  await mkdir(join(artifactRoot, 'feedback-runs'), { recursive: true });
  await mkdir(join(artifactRoot, 'hypothesis-runs'), { recursive: true });
  await mkdir(join(artifactRoot, 'diagnostic'), { recursive: true });
  await writeFile(join(authoritativeRoot, 'src/example.ts'), 'export const example = true;\n');
  await writeFile(join(authoritativeRoot, historicalSkillAssignment.canonicalPath), historicalSkillContent);
  await writeFile(join(artifactRoot, FIXED_ARTIFACT_REFS[0]), '{"observable":true}\n');
  await writeFile(join(artifactRoot, FIXED_ARTIFACT_REFS[1]), 'historical feedback bytes\n');
  await writeFile(join(artifactRoot, FIXED_ARTIFACT_REFS[2]), '{"hypotheses":[]}\n');
  await writeFile(join(artifactRoot, FIXED_ARTIFACT_REFS[3]), '{"diagnostic":true}\n');

  const packagePath = join(experimentRoot, 'problem-package.json');
  const packageBytes = `${JSON.stringify(problemPackage)}\n`;
  await writeFile(packagePath, packageBytes);

  const prepared = await prepareAgentWorkspace({
    authoritativeRoot,
    destinationRoot: join(experimentRoot, 'agent-workspaces'),
    jobKind: 'solution',
    artifactSourceRoot: artifactRoot,
    artifactRelativePaths: [...FIXED_ARTIFACT_REFS],
  });
  const sourceInvocationPath = join(experimentRoot, 'solution-agent/invocation.json');
  await mkdir(join(experimentRoot, 'solution-agent'), { recursive: true });
  await writeFile(sourceInvocationPath, `${JSON.stringify({
    schemaVersion: 'solution-agent-invocation-v2',
    invocationRef: 'historical-solution-000001',
    jobNumber: 3,
    role: 'solution',
    workspaceBaselineFingerprintSha256: prepared.workspaceBaselineFingerprintSha256,
    problemPackageSha256: sha256Hex(packageBytes),
    participant: 'workspace-capable-agent',
    skillAssignments: [historicalSkillAssignment],
    deliveredSkills: [{
      ...historicalSkillAssignment,
      contentSha256: historicalSkillAssignment.expectedContentSha256,
    }],
    status: 'completed',
  })}\n`);

  return {
    root,
    experimentRoot,
    packagePath,
    artifactRoot,
    sourceWorkspace: prepared.workspaceRoot,
    sourceInvocationPath,
    sourceBaseline: prepared.workspaceBaselineFingerprintSha256,
  };
}

function createParticipant(
  output: string,
  state: ParticipantState,
  options?: {
    mutateClone?: boolean;
    onPrompt?: (prompt: string) => void;
  },
): WorkspaceAgentParticipantOptions {
  return {
    executable: process.execPath,
    buildArgs: (input: WorkspaceAgentJobInput) => {
      state.calls += 1;
      state.workspaceRoots.push(input.workspaceRoot);
      options?.onPrompt?.(input.prompt);
      const mutation = options?.mutateClone
        ? "require('node:fs').writeFileSync('src/participant-write.txt', 'clone-only');"
        : '';
      return ['-e', `${mutation}process.stdout.write(process.argv[1]);`, output];
    },
  };
}

function replayInput(
  fixture: Fixture,
  participant: WorkspaceAgentParticipantOptions,
  outputName: string,
) {
  return {
    problemPackagePath: fixture.packagePath,
    workspacePath: fixture.sourceWorkspace,
    artifactRoot: fixture.artifactRoot,
    sourceInvocationPath: fixture.sourceInvocationPath,
    outputPath: join(fixture.root, outputName),
    participant,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
}

async function readSourceInvocation(fixture: Fixture): Promise<Record<string, unknown>> {
  return readJson(fixture.sourceInvocationPath);
}

async function runWithFixture<T>(callback: (fixture: Fixture) => Promise<T>): Promise<T> {
  const fixture = await createFixture();
  try {
    return await callback(fixture);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

export async function runSolutionAgentReplayTests(): Promise<void> {
  await runWithFixture(async fixture => {
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    let prompt = '';
    const sourceBefore = await captureAuthoritativeFingerprint(fixture.sourceWorkspace);
    const result = await runSolutionAgentReplay(
      replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state, {
        mutateClone: true,
        onPrompt: value => { prompt = value; },
      }), 'replay-success'),
    );
    assert.equal(result.ok, true, result.ok ? undefined : result.message);
    assert.equal(state.calls, 1);
    assert.notEqual(state.workspaceRoots[0], fixture.sourceWorkspace);
    assert.equal(await pathExists(state.workspaceRoots[0] ?? ''), false);
    assert.equal(await captureAuthoritativeFingerprint(fixture.sourceWorkspace), sourceBefore);
    assert.equal(await pathExists(join(fixture.sourceWorkspace, 'src/participant-write.txt')), false);
    assert.match(prompt, /historical Solution Skill bytes/);
    assert.doesNotMatch(prompt, /current repository must replace/);

    const outputRoot = join(fixture.root, 'replay-success');
    assert.deepEqual(parseSolutionWork(await readFile(join(outputRoot, 'result.json'), 'utf8')), solutionResult);
    assert.equal(await pathExists(join(outputRoot, 'invocation.json')), true);
    assert.equal(await pathExists(join(outputRoot, 'raw-output.txt')), true);
    const replayInvocation = await readJson(join(outputRoot, 'invocation.json'));
    assert.equal(replayInvocation.invocationRef, 'historical-solution-000001-replay');
    assert.equal(replayInvocation.jobNumber, 3);
    assert.equal(replayInvocation.workspaceBaselineFingerprintSha256, fixture.sourceBaseline);
    assert.deepEqual(replayInvocation.skillAssignments, [historicalSkillAssignment]);
  });

  await runWithFixture(async fixture => {
    await writeFile(fixture.packagePath, `${JSON.stringify({ ...problemPackage, problemId: 'mutated-problem' })}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-package-mutated')),
      /problem-package bytes hash does not match historical solution invocation/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    await rm(join(fixture.artifactRoot, FIXED_ARTIFACT_REFS[1]));
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-artifact-missing')),
      /declared replay artifact.*does not exist/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    await writeFile(join(fixture.artifactRoot, FIXED_ARTIFACT_REFS[2]), 'changed historical hypothesis bytes\n');
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-artifact-mutated')),
      /historical artifact hash mismatch/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    await writeFile(join(fixture.sourceWorkspace, 'src/example.ts'), 'mutated frozen Solution workspace\n');
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-workspace-mutated')),
      /historical frozen Solution input is no longer pristine/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const invocation = await readSourceInvocation(fixture);
    invocation.workspaceBaselineFingerprintSha256 = 'b'.repeat(64);
    await writeFile(fixture.sourceInvocationPath, `${JSON.stringify(invocation)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-baseline-mismatch')),
      /workspace baseline fingerprint mismatch/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const manifestPath = join(fixture.sourceWorkspace, '.agent-workspace-manifest.json');
    const manifest = await readJson(manifestPath);
    manifest.jobKind = 'reviewer';
    await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-job-kind')),
      /jobKind.*solution/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const invocation = await readSourceInvocation(fixture);
    invocation.skillAssignments = [{
      ...historicalSkillAssignment,
      expectedContentSha256: 'c'.repeat(64),
    }];
    await writeFile(fixture.sourceInvocationPath, `${JSON.stringify(invocation)}\n`);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-skill-mismatch')),
      /historical Skill assignment.*hash mismatch/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    await writeFile(join(fixture.sourceWorkspace, historicalSkillAssignment.canonicalPath), 'tampered historical Skill bytes\n');
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-skill-bytes-mutated')),
      /historical frozen Solution input is no longer pristine/i,
    );
    assert.equal(state.calls, 0);
  });

  await runWithFixture(async fixture => {
    const outputPath = join(fixture.root, 'replay-existing');
    await mkdir(outputPath);
    const state: ParticipantState = { calls: 0, workspaceRoots: [] };
    await assert.rejects(
      () => runSolutionAgentReplay(replayInput(fixture, createParticipant(JSON.stringify(solutionResult), state), 'replay-existing')),
      /replay output already exists/i,
    );
    assert.equal(state.calls, 0);
  });

  await assert.rejects(
    () => runSolutionAgentReplayCli([]),
    /missing required argument: --problem-package/i,
  );
  await assert.rejects(
    () => runSolutionAgentReplayCli(['--problem-package', 'package.json', '--unexpected', 'value']),
    /unknown argument/i,
  );
  await assert.rejects(
    () => runSolutionAgentReplayCli(['--problem-package', 'package.json', '--problem-package', 'other.json']),
    /duplicate argument/i,
  );
  await assert.rejects(
    () => runSolutionAgentReplayCli([
      '--problem-package', 'missing-package.json',
      '--workspace', 'missing-workspace',
      '--artifact-root', 'missing-artifacts',
      '--source-invocation', 'missing-invocation.json',
      '--output', 'new-output',
      '--participant-binding', 'UNSUPPORTED',
    ]),
    /unsupported binding|PARTICIPANT_BINDING_UNAVAILABLE/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionAgentReplayTests()
    .then(() => console.log('solutionAgentReplay.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
