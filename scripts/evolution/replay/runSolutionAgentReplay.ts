import { constants as fsConstants } from 'node:fs';
import { copyFile, lstat, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  assertAuthoritativeFingerprintUnchanged,
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../problemAgnosticSolution/agentWorkspace';
import {
  runSolutionAgent,
  type SolutionAgentRunResult,
} from '../problemAgnosticSolution/runSolutionAgent';
import {
  parseOperatorParticipantBindingId,
  resolveOperatorParticipantBinding,
} from '../operator/resolveParticipantBinding';
import type { WorkspaceAgentParticipantOptions } from '../problemAgnosticSolution/agentParticipant';
import {
  parseProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import type { ParticipantSkillAssignment } from '../problemAgnosticSolution/solutionParticipantSkills';
import { sha256Hex } from '../phase0/provenance';

const REQUIRED_FLAGS = [
  '--problem-package',
  '--workspace',
  '--artifact-root',
  '--source-invocation',
  '--output',
  '--participant-binding',
] as const;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

type RecordValue = Record<string, unknown>;

interface ReplayCliArgs {
  problemPackagePath: string;
  workspacePath: string;
  artifactRoot: string;
  sourceInvocationPath: string;
  outputPath: string;
  participantBinding: string;
}

export interface RunSolutionAgentReplayInput {
  problemPackagePath: string;
  workspacePath: string;
  artifactRoot: string;
  sourceInvocationPath: string;
  outputPath: string;
  participant: WorkspaceAgentParticipantOptions;
}

interface HistoricalSolutionInvocation {
  invocationRef: string;
  jobNumber: number;
  workspaceBaselineFingerprintSha256: string;
  problemPackageSha256: string;
  skillAssignments: readonly ParticipantSkillAssignment[];
}

interface HistoricalWorkspaceManifestEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

interface HistoricalSolutionWorkspaceManifest {
  workspaceBaselineFingerprintSha256: string;
  entries: Map<string, HistoricalWorkspaceManifestEntry>;
}

interface DeclaredReplayArtifact {
  relativePath: string;
  sha256: string;
}

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function sha256(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!SHA256_PATTERN.test(result)) throw new Error(`${label} must be a SHA-256 hex string`);
  return result;
}

function parseSkillAssignments(value: unknown): readonly ParticipantSkillAssignment[] {
  if (!Array.isArray(value)) throw new Error('historical solution invocation.skillAssignments must be an array');
  return value.map((item, index) => {
    assertObject(item, `historical solution invocation.skillAssignments[${index}]`);
    if (item.expectedContentSha256 === undefined) {
      throw new Error(
        `historical solution invocation.skillAssignments[${index}].expectedContentSha256 is required for replay provenance`,
      );
    }
    return {
      identity: nonEmptyString(item.identity, `historical solution invocation.skillAssignments[${index}].identity`),
      version: nonEmptyString(item.version, `historical solution invocation.skillAssignments[${index}].version`),
      canonicalPath: nonEmptyString(item.canonicalPath, `historical solution invocation.skillAssignments[${index}].canonicalPath`),
      expectedContentSha256: sha256(
        item.expectedContentSha256,
        `historical solution invocation.skillAssignments[${index}].expectedContentSha256`,
      ),
    };
  });
}

function parseHistoricalSolutionInvocation(value: unknown): HistoricalSolutionInvocation {
  assertObject(value, 'historical solution invocation');
  if (value.schemaVersion !== 'solution-agent-invocation-v2') {
    throw new Error('historical solution invocation schemaVersion must be solution-agent-invocation-v2');
  }
  if (value.role !== 'solution') throw new Error('historical solution invocation role must be solution');
  if (typeof value.jobNumber !== 'number' || !Number.isInteger(value.jobNumber) || value.jobNumber < 0) {
    throw new Error('historical solution invocation.jobNumber must be a non-negative integer');
  }
  return {
    invocationRef: nonEmptyString(value.invocationRef, 'historical solution invocation.invocationRef'),
    jobNumber: value.jobNumber,
    workspaceBaselineFingerprintSha256: sha256(
      value.workspaceBaselineFingerprintSha256,
      'historical solution invocation.workspaceBaselineFingerprintSha256',
    ),
    problemPackageSha256: sha256(value.problemPackageSha256, 'historical solution invocation.problemPackageSha256'),
    skillAssignments: parseSkillAssignments(value.skillAssignments),
  };
}

function parseWorkspaceManifest(value: unknown): HistoricalSolutionWorkspaceManifest {
  assertObject(value, 'historical Solution workspace manifest');
  if (value.schemaVersion !== 'agent-workspace-manifest-v1') {
    throw new Error('historical Solution workspace manifest schemaVersion must be agent-workspace-manifest-v1');
  }
  if (value.jobKind !== 'solution') {
    throw new Error('historical Solution workspace manifest jobKind must be solution');
  }
  if (!Array.isArray(value.entries)) {
    throw new Error('historical Solution workspace manifest.entries must be an array');
  }
  const entries = new Map<string, HistoricalWorkspaceManifestEntry>();
  for (const [index, item] of value.entries.entries()) {
    assertObject(item, `historical Solution workspace manifest.entries[${index}]`);
    const path = nonEmptyString(item.path, `historical Solution workspace manifest.entries[${index}].path`);
    if (entries.has(path)) throw new Error(`historical Solution workspace manifest.entries contains duplicate path: ${path}`);
    if (item.objectKind !== 'regular_file' && item.objectKind !== 'symlink') {
      throw new Error(`historical Solution workspace manifest.entries[${index}].objectKind is invalid`);
    }
    entries.set(path, {
      path,
      objectKind: item.objectKind,
      sha256: sha256(item.sha256, `historical Solution workspace manifest.entries[${index}].sha256`),
    });
  }
  return {
    workspaceBaselineFingerprintSha256: sha256(
      value.workspaceBaselineFingerprintSha256,
      'historical Solution workspace manifest.workspaceBaselineFingerprintSha256',
    ),
    entries,
  };
}

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

async function requireRegularFile(path: string, label: string): Promise<void> {
  let stat;
  try {
    stat = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error(`${label} does not exist: ${path}`);
    throw new Error(`unable to inspect ${label} ${path}: ${String(error)}`);
  }
  if (!stat.isFile()) throw new Error(`${label} must be a regular file: ${path}`);
}

async function requireDirectory(path: string, label: string): Promise<void> {
  let stat;
  try {
    stat = await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error(`${label} does not exist: ${path}`);
    throw new Error(`unable to inspect ${label} ${path}: ${String(error)}`);
  }
  if (!stat.isDirectory()) throw new Error(`${label} must be a directory: ${path}`);
}

async function assertOutputDoesNotExist(path: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw new Error(`unable to inspect replay output ${path}: ${String(error)}`);
  }
  throw new Error(`replay output already exists: ${path}`);
}

function isInside(root: string, target: string): boolean {
  const escaped = relative(resolve(root), resolve(target));
  return escaped === '' || (escaped !== '..' && !escaped.startsWith(`..${sep}`) && !isAbsolute(escaped));
}

function resolveDeclaredArtifactPath(root: string, reference: string, label: string): string {
  if (!reference || isAbsolute(reference)) throw new Error(`${label} must be a relative path: ${reference}`);
  const target = resolve(root, reference);
  if (!isInside(root, target)) throw new Error(`${label} escapes replay artifact root: ${reference}`);
  return target;
}

function declaredArtifactPaths(problemPackage: ProblemPackage): string[] {
  const refs = [
    problemPackage.source.observablePayloadRef,
    problemPackage.source.externalFeedbackRef,
    problemPackage.source.improvementHypothesisRef,
    ...(problemPackage.schemaVersion === 'problem-package-v2' ? problemPackage.source.diagnosticEvidenceRefs : []),
  ];
  return [...new Set(refs)];
}

async function readDeclaredArtifact(root: string, reference: string, label: string): Promise<{ path: string; sha256: string }> {
  const path = resolveDeclaredArtifactPath(root, reference, label);
  await requireRegularFile(path, label);
  return { path, sha256: sha256Hex(await readFile(path)) };
}

async function verifySkillAssignments(input: {
  sourceWorkspace: string;
  workspaceManifest: HistoricalSolutionWorkspaceManifest;
  skillAssignments: readonly ParticipantSkillAssignment[];
}): Promise<void> {
  for (const assignment of input.skillAssignments) {
    const manifestEntry = input.workspaceManifest.entries.get(assignment.canonicalPath);
    if (manifestEntry === undefined) {
      throw new Error(`historical Skill assignment is missing from Solution workspace manifest: ${assignment.canonicalPath}`);
    }
    if (manifestEntry.objectKind !== 'regular_file') {
      throw new Error(`historical Skill assignment is not sealed as a regular file: ${assignment.canonicalPath}`);
    }
    const skill = await readDeclaredArtifact(
      input.sourceWorkspace,
      assignment.canonicalPath,
      `historical Skill artifact ${assignment.canonicalPath}`,
    );
    if (skill.sha256 !== manifestEntry.sha256 || skill.sha256 !== assignment.expectedContentSha256) {
      throw new Error(`historical Skill assignment hash mismatch: ${assignment.canonicalPath}`);
    }
  }
}

async function verifyDeclaredArtifactSurface(input: {
  artifactRoot: string;
  sourceWorkspace: string;
  workspaceManifest: HistoricalSolutionWorkspaceManifest;
  problemPackage: ProblemPackage;
}): Promise<DeclaredReplayArtifact[]> {
  const artifacts: DeclaredReplayArtifact[] = [];
  for (const relativePath of declaredArtifactPaths(input.problemPackage)) {
    const artifact = await readDeclaredArtifact(
      input.artifactRoot,
      relativePath,
      `declared replay artifact ${relativePath}`,
    );
    const manifestEntry = input.workspaceManifest.entries.get(relativePath);
    if (manifestEntry === undefined) {
      throw new Error(`historical Solution workspace manifest is missing declared artifact: ${relativePath}`);
    }
    if (manifestEntry.objectKind !== 'regular_file') {
      throw new Error(`historical artifact hash mismatch: ${relativePath} was not sealed as a regular file`);
    }
    const frozenArtifact = await readDeclaredArtifact(
      input.sourceWorkspace,
      relativePath,
      `historical sealed artifact ${relativePath}`,
    );
    if (frozenArtifact.sha256 !== manifestEntry.sha256 || artifact.sha256 !== manifestEntry.sha256) {
      throw new Error(`historical artifact hash mismatch: ${relativePath}`);
    }
    artifacts.push({ relativePath, sha256: artifact.sha256 });
  }
  return artifacts;
}

async function copyVerifiedFile(input: {
  sourcePath: string;
  destinationPath: string;
  expectedSha256: string;
  label: string;
}): Promise<void> {
  await mkdir(dirname(input.destinationPath), { recursive: true });
  await copyFile(input.sourcePath, input.destinationPath, fsConstants.COPYFILE_EXCL);
  if (sha256Hex(await readFile(input.destinationPath)) !== input.expectedSha256) {
    throw new Error(`replay ${input.label} hash mismatch after copy`);
  }
}

async function restoreReplaySurface(input: {
  replayRoot: string;
  problemPackagePath: string;
  problemPackageSha256: string;
  artifactRoot: string;
  artifacts: readonly DeclaredReplayArtifact[];
}): Promise<{ problemPackagePath: string }> {
  const replayProblemPackagePath = join(input.replayRoot, 'problem-package.json');
  await copyVerifiedFile({
    sourcePath: input.problemPackagePath,
    destinationPath: replayProblemPackagePath,
    expectedSha256: input.problemPackageSha256,
    label: 'problem package',
  });
  for (const artifact of input.artifacts) {
    await copyVerifiedFile({
      sourcePath: resolveDeclaredArtifactPath(input.artifactRoot, artifact.relativePath, `declared replay artifact ${artifact.relativePath}`),
      destinationPath: resolveDeclaredArtifactPath(input.replayRoot, artifact.relativePath, `declared replay artifact ${artifact.relativePath}`),
      expectedSha256: artifact.sha256,
      label: `artifact ${artifact.relativePath}`,
    });
  }
  return { problemPackagePath: replayProblemPackagePath };
}

function assertOutputIsIsolated(outputPath: string, sourceWorkspace: string, artifactRoot: string): void {
  if (isInside(sourceWorkspace, outputPath)) {
    throw new Error('replay output must not be inside the historical frozen Solution workspace');
  }
  if (isInside(artifactRoot, outputPath)) {
    throw new Error('replay output must not be inside the historical artifact root');
  }
}

function requireFlagValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseCliArgs(argv: string[]): ReplayCliArgs {
  const values = new Map<string, string>();
  const allowed = new Set<string>(REQUIRED_FLAGS);
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireFlagValue(argv, index, flag));
  }
  for (const flag of REQUIRED_FLAGS) {
    if (!values.has(flag)) throw new Error(`missing required argument: ${flag}`);
  }
  return {
    problemPackagePath: values.get('--problem-package')!,
    workspacePath: values.get('--workspace')!,
    artifactRoot: values.get('--artifact-root')!,
    sourceInvocationPath: values.get('--source-invocation')!,
    outputPath: values.get('--output')!,
    participantBinding: values.get('--participant-binding')!,
  };
}

async function verifyHistoricalInput(input: RunSolutionAgentReplayInput): Promise<{
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  problemPackageSha256: string;
  sourceWorkspace: string;
  artifactRoot: string;
  outputPath: string;
  sourceInvocation: HistoricalSolutionInvocation;
  artifacts: DeclaredReplayArtifact[];
}> {
  const problemPackagePath = resolve(input.problemPackagePath);
  const sourceWorkspace = resolve(input.workspacePath);
  const artifactRoot = resolve(input.artifactRoot);
  const sourceInvocationPath = resolve(input.sourceInvocationPath);
  const outputPath = resolve(input.outputPath);

  await requireRegularFile(problemPackagePath, 'problem package');
  await requireRegularFile(sourceInvocationPath, 'source invocation');
  await requireDirectory(sourceWorkspace, 'historical Solution workspace');
  await requireDirectory(artifactRoot, 'historical artifact root');
  await assertOutputDoesNotExist(outputPath);
  assertOutputIsIsolated(outputPath, sourceWorkspace, artifactRoot);

  const problemPackageBytes = await readFile(problemPackagePath);
  const problemPackage = parseProblemPackage(problemPackageBytes.toString('utf8'));
  const sourceInvocation = parseHistoricalSolutionInvocation(
    parseJson(await readFile(sourceInvocationPath, 'utf8'), 'historical solution invocation'),
  );
  const problemPackageSha256 = sha256Hex(problemPackageBytes);
  if (problemPackageSha256 !== sourceInvocation.problemPackageSha256) {
    throw new Error('problem-package bytes hash does not match historical solution invocation');
  }

  const manifestPath = join(sourceWorkspace, '.agent-workspace-manifest.json');
  await requireRegularFile(manifestPath, 'historical Solution workspace manifest');
  const manifest = parseWorkspaceManifest(
    parseJson(await readFile(manifestPath, 'utf8'), 'historical Solution workspace manifest'),
  );
  if (manifest.workspaceBaselineFingerprintSha256 !== sourceInvocation.workspaceBaselineFingerprintSha256) {
    throw new Error(
      'historical frozen Solution input is no longer pristine / reproducible: workspace baseline fingerprint mismatch between manifest and historical solution invocation',
    );
  }
  const actualSourceFingerprint = await captureAuthoritativeFingerprint(sourceWorkspace);
  if (actualSourceFingerprint !== manifest.workspaceBaselineFingerprintSha256) {
    throw new Error(
      `historical frozen Solution input is no longer pristine / reproducible: workspace baseline fingerprint mismatch (expected ${manifest.workspaceBaselineFingerprintSha256}, got ${actualSourceFingerprint})`,
    );
  }

  await verifySkillAssignments({
    sourceWorkspace,
    workspaceManifest: manifest,
    skillAssignments: sourceInvocation.skillAssignments,
  });
  const artifacts = await verifyDeclaredArtifactSurface({
    artifactRoot,
    sourceWorkspace,
    workspaceManifest: manifest,
    problemPackage,
  });

  return {
    problemPackage,
    problemPackagePath,
    problemPackageSha256,
    sourceWorkspace,
    artifactRoot,
    outputPath,
    sourceInvocation,
    artifacts,
  };
}

function relocateReplayResult(result: SolutionAgentRunResult, outputPath: string): SolutionAgentRunResult {
  const invocationPath = join(outputPath, 'invocation.json');
  const rawOutputPath = join(outputPath, 'raw-output.txt');
  if (result.ok) {
    return {
      ...result,
      invocationPath,
      rawOutputPath,
      resultPath: join(outputPath, 'result.json'),
    };
  }
  return {
    ...result,
    invocationPath,
    rawOutputPath,
    failurePath: join(outputPath, 'failure.json'),
  };
}

export async function runSolutionAgentReplay(
  input: RunSolutionAgentReplayInput,
): Promise<SolutionAgentRunResult> {
  const verified = await verifyHistoricalInput(input);
  await mkdir(dirname(verified.outputPath), { recursive: true });
  const temporaryReplayRoot = await mkdtemp(join(dirname(verified.outputPath), 'solution-agent-replay-'));
  try {
    const replaySurface = await restoreReplaySurface({
      replayRoot: temporaryReplayRoot,
      problemPackagePath: verified.problemPackagePath,
      problemPackageSha256: verified.problemPackageSha256,
      artifactRoot: verified.artifactRoot,
      artifacts: verified.artifacts,
    });
    const clone = await prepareAgentWorkspace({
      authoritativeRoot: verified.sourceWorkspace,
      destinationRoot: join(temporaryReplayRoot, 'agent-workspaces'),
      jobKind: 'solution',
    });
    const cloneFingerprint = await captureAuthoritativeFingerprint(clone.workspaceRoot);
    if (clone.workspaceBaselineFingerprintSha256 !== verified.sourceInvocation.workspaceBaselineFingerprintSha256
      || cloneFingerprint !== verified.sourceInvocation.workspaceBaselineFingerprintSha256) {
      throw new Error('replay clone workspace baseline fingerprint mismatch with historical Solution input');
    }

    const replayOutputPath = join(temporaryReplayRoot, 'output');
    const result = await runSolutionAgent({
      problemPackage: verified.problemPackage,
      problemPackagePath: replaySurface.problemPackagePath,
      workspaceRoot: clone.workspaceRoot,
      repositoryRoot: verified.sourceWorkspace,
      artifactRoot: temporaryReplayRoot,
      workspaceBaselineFingerprintSha256: verified.sourceInvocation.workspaceBaselineFingerprintSha256,
      invocationRef: `${verified.sourceInvocation.invocationRef}-replay`,
      jobNumber: verified.sourceInvocation.jobNumber,
      destinationRoot: replayOutputPath,
      skillAssignments: verified.sourceInvocation.skillAssignments,
      participant: input.participant,
    });
    await rename(replayOutputPath, verified.outputPath);
    return relocateReplayResult(result, verified.outputPath);
  } finally {
    try {
      await assertAuthoritativeFingerprintUnchanged(
        verified.sourceWorkspace,
        verified.sourceInvocation.workspaceBaselineFingerprintSha256,
      );
    } finally {
      await rm(temporaryReplayRoot, { recursive: true, force: true });
    }
  }
}

export async function runSolutionAgentReplayCli(argv: string[]): Promise<SolutionAgentRunResult> {
  const args = parseCliArgs(argv);
  const bindingId = parseOperatorParticipantBindingId(args.participantBinding);
  const binding = await resolveOperatorParticipantBinding(bindingId);
  const result = await runSolutionAgentReplay({
    problemPackagePath: args.problemPackagePath,
    workspacePath: args.workspacePath,
    artifactRoot: args.artifactRoot,
    sourceInvocationPath: args.sourceInvocationPath,
    outputPath: args.outputPath,
    participant: binding.participant,
  });
  console.log(JSON.stringify({
    participantBinding: binding.bindingId,
    provider: binding.provider,
    executableVersion: binding.executableVersion,
    status: result.ok ? 'completed' : 'failed',
    artifacts: result.ok
      ? { invocationPath: result.invocationPath, rawOutputPath: result.rawOutputPath, resultPath: result.resultPath }
      : { invocationPath: result.invocationPath, rawOutputPath: result.rawOutputPath, failurePath: result.failurePath },
  }, null, 2));
  if (!result.ok) process.exitCode = 1;
  return result;
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runSolutionAgentReplayCli(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
