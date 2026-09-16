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
  runSolutionReviewer,
  type SolutionReviewerRunResult,
} from '../problemAgnosticSolution/runSolutionReviewer';
import {
  parseOperatorParticipantBindingId,
  resolveOperatorParticipantBinding,
} from '../operator/resolveParticipantBinding';
import type {
  WorkspaceAgentParticipantOptions,
} from '../problemAgnosticSolution/agentParticipant';
import {
  parseProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import {
  parseSolutionWork,
  type SolutionWorkV1,
} from '../../../src/evolution/solutionWorkContract';
import type { ParticipantSkillAssignment } from '../problemAgnosticSolution/solutionParticipantSkills';
import { sha256Hex } from '../phase0/provenance';

const REQUIRED_FLAGS = [
  '--problem-package',
  '--solution',
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
  solutionPath: string;
  workspacePath: string;
  artifactRoot: string;
  sourceInvocationPath: string;
  outputPath: string;
  participantBinding: string;
}

export interface RunSolutionReviewerReplayInput {
  problemPackagePath: string;
  solutionPath: string;
  workspacePath: string;
  artifactRoot: string;
  sourceInvocationPath: string;
  outputPath: string;
  participant: WorkspaceAgentParticipantOptions;
}

interface HistoricalReviewerInvocation {
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

interface HistoricalReviewerWorkspaceManifest {
  authoritativeFingerprintSha256: string;
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
  if (!Array.isArray(value)) throw new Error('historical reviewer invocation.skillAssignments must be an array');
  return value.map((item, index) => {
    assertObject(item, `historical reviewer invocation.skillAssignments[${index}]`);
    const assignment: ParticipantSkillAssignment = {
      identity: nonEmptyString(item.identity, `historical reviewer invocation.skillAssignments[${index}].identity`),
      version: nonEmptyString(item.version, `historical reviewer invocation.skillAssignments[${index}].version`),
      canonicalPath: nonEmptyString(item.canonicalPath, `historical reviewer invocation.skillAssignments[${index}].canonicalPath`),
      ...(item.expectedContentSha256 === undefined
        ? {}
        : { expectedContentSha256: sha256(item.expectedContentSha256, `historical reviewer invocation.skillAssignments[${index}].expectedContentSha256`) }),
    };
    return assignment;
  });
}

function parseHistoricalReviewerInvocation(value: unknown): HistoricalReviewerInvocation {
  assertObject(value, 'historical reviewer invocation');
  if (value.schemaVersion !== 'solution-reviewer-invocation-v2') {
    throw new Error('historical reviewer invocation schemaVersion must be solution-reviewer-invocation-v2');
  }
  if (value.role !== 'reviewer') throw new Error('historical reviewer invocation role must be reviewer');
  const jobNumber = value.jobNumber;
  if (typeof jobNumber !== 'number' || !Number.isInteger(jobNumber) || jobNumber < 0) {
    throw new Error('historical reviewer invocation.jobNumber must be a non-negative integer');
  }
  return {
    invocationRef: nonEmptyString(value.invocationRef, 'historical reviewer invocation.invocationRef'),
    jobNumber,
    workspaceBaselineFingerprintSha256: sha256(
      value.workspaceBaselineFingerprintSha256,
      'historical reviewer invocation.workspaceBaselineFingerprintSha256',
    ),
    problemPackageSha256: sha256(
      value.problemPackageSha256,
      'historical reviewer invocation.problemPackageSha256',
    ),
    skillAssignments: parseSkillAssignments(value.skillAssignments),
  };
}

function parseWorkspaceManifest(value: unknown): HistoricalReviewerWorkspaceManifest {
  assertObject(value, 'historical Reviewer workspace manifest');
  if (value.schemaVersion !== 'agent-workspace-manifest-v1') {
    throw new Error('historical Reviewer workspace manifest schemaVersion must be agent-workspace-manifest-v1');
  }
  if (value.jobKind !== 'reviewer') {
    throw new Error('historical Reviewer workspace manifest jobKind must be reviewer');
  }
  if (!Array.isArray(value.entries)) {
    throw new Error('historical Reviewer workspace manifest.entries must be an array');
  }
  const entries = new Map<string, HistoricalWorkspaceManifestEntry>();
  for (const [index, item] of value.entries.entries()) {
    assertObject(item, `historical Reviewer workspace manifest.entries[${index}]`);
    const path = nonEmptyString(item.path, `historical Reviewer workspace manifest.entries[${index}].path`);
    if (entries.has(path)) throw new Error(`historical Reviewer workspace manifest.entries contains duplicate path: ${path}`);
    if (item.objectKind !== 'regular_file' && item.objectKind !== 'symlink') {
      throw new Error(`historical Reviewer workspace manifest.entries[${index}].objectKind is invalid`);
    }
    entries.set(path, {
      path,
      objectKind: item.objectKind,
      sha256: sha256(item.sha256, `historical Reviewer workspace manifest.entries[${index}].sha256`),
    });
  }
  return {
    authoritativeFingerprintSha256: sha256(
      value.authoritativeFingerprintSha256,
      'historical Reviewer workspace manifest.authoritativeFingerprintSha256',
    ),
    workspaceBaselineFingerprintSha256: sha256(
      value.workspaceBaselineFingerprintSha256,
      'historical Reviewer workspace manifest.workspaceBaselineFingerprintSha256',
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

function declaredArtifactPaths(problemPackage: ProblemPackage, solutionWork: SolutionWorkV1): string[] {
  const sourceRefs = [
    problemPackage.source.observablePayloadRef,
    problemPackage.source.externalFeedbackRef,
    problemPackage.source.improvementHypothesisRef,
    ...(problemPackage.schemaVersion === 'problem-package-v2' ? problemPackage.source.diagnosticEvidenceRefs : []),
  ];
  const solutionRefs = [
    ...solutionWork.artifactRefs,
    ...solutionWork.options.flatMap(option => option.artifactRefs),
  ];
  return [...new Set([...sourceRefs, ...solutionRefs])];
}

async function readDeclaredArtifact(root: string, reference: string, label: string): Promise<{ path: string; sha256: string }> {
  const path = resolveDeclaredArtifactPath(root, reference, label);
  await requireRegularFile(path, label);
  return { path, sha256: sha256Hex(await readFile(path)) };
}

async function verifyDeclaredArtifactSurface(input: {
  artifactRoot: string;
  sourceWorkspace: string;
  workspaceManifest: HistoricalReviewerWorkspaceManifest;
  problemPackage: ProblemPackage;
  solutionWork: SolutionWorkV1;
}): Promise<DeclaredReplayArtifact[]> {
  const artifacts: DeclaredReplayArtifact[] = [];
  for (const relativePath of declaredArtifactPaths(input.problemPackage, input.solutionWork)) {
    const artifact = await readDeclaredArtifact(
      input.artifactRoot,
      relativePath,
      `declared replay artifact ${relativePath}`,
    );
    const manifestEntry = input.workspaceManifest.entries.get(relativePath);
    if (manifestEntry !== undefined) {
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
    throw new Error('replay output must not be inside the historical frozen Reviewer workspace');
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
    solutionPath: values.get('--solution')!,
    workspacePath: values.get('--workspace')!,
    artifactRoot: values.get('--artifact-root')!,
    sourceInvocationPath: values.get('--source-invocation')!,
    outputPath: values.get('--output')!,
    participantBinding: values.get('--participant-binding')!,
  };
}

async function verifyHistoricalInput(input: RunSolutionReviewerReplayInput): Promise<{
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  problemPackageSha256: string;
  solutionWork: SolutionWorkV1;
  sourceWorkspace: string;
  artifactRoot: string;
  outputPath: string;
  sourceInvocation: HistoricalReviewerInvocation;
  artifacts: DeclaredReplayArtifact[];
}> {
  const problemPackagePath = resolve(input.problemPackagePath);
  const solutionPath = resolve(input.solutionPath);
  const sourceWorkspace = resolve(input.workspacePath);
  const artifactRoot = resolve(input.artifactRoot);
  const sourceInvocationPath = resolve(input.sourceInvocationPath);
  const outputPath = resolve(input.outputPath);

  await requireRegularFile(problemPackagePath, 'problem package');
  await requireRegularFile(solutionPath, 'solution work');
  await requireRegularFile(sourceInvocationPath, 'source invocation');
  await requireDirectory(sourceWorkspace, 'historical Reviewer workspace');
  await requireDirectory(artifactRoot, 'historical artifact root');
  await assertOutputDoesNotExist(outputPath);
  assertOutputIsIsolated(outputPath, sourceWorkspace, artifactRoot);

  const problemPackageBytes = await readFile(problemPackagePath);
  const problemPackage = parseProblemPackage(problemPackageBytes.toString('utf8'));
  const solutionWork = parseSolutionWork(await readFile(solutionPath, 'utf8'));
  if (solutionWork.status !== 'OPTIONS') {
    throw new Error('solution work is not a valid Reviewer input: status must be OPTIONS');
  }
  if (solutionWork.problemId !== problemPackage.problemId) {
    throw new Error('solution work problemId must match problem package problemId');
  }
  const sourceInvocation = parseHistoricalReviewerInvocation(
    parseJson(await readFile(sourceInvocationPath, 'utf8'), 'historical reviewer invocation'),
  );
  const problemPackageSha256 = sha256Hex(problemPackageBytes);
  if (problemPackageSha256 !== sourceInvocation.problemPackageSha256) {
    throw new Error('problem-package bytes hash does not match historical reviewer invocation');
  }

  const manifestPath = join(sourceWorkspace, '.agent-workspace-manifest.json');
  await requireRegularFile(manifestPath, 'historical Reviewer workspace manifest');
  const manifest = parseWorkspaceManifest(
    parseJson(
      await readFile(manifestPath, 'utf8'),
      'historical Reviewer workspace manifest',
    ),
  );
  if (manifest.workspaceBaselineFingerprintSha256 !== sourceInvocation.workspaceBaselineFingerprintSha256) {
    throw new Error(
      'historical frozen Reviewer input is no longer pristine / reproducible: workspace baseline fingerprint mismatch between manifest and historical reviewer invocation',
    );
  }
  const actualSourceFingerprint = await captureAuthoritativeFingerprint(sourceWorkspace);
  if (actualSourceFingerprint !== manifest.workspaceBaselineFingerprintSha256) {
    throw new Error(
      `historical frozen Reviewer input is no longer pristine / reproducible: workspace baseline fingerprint mismatch (expected ${manifest.workspaceBaselineFingerprintSha256}, got ${actualSourceFingerprint})`,
    );
  }

  const artifacts = await verifyDeclaredArtifactSurface({
    artifactRoot,
    sourceWorkspace,
    workspaceManifest: manifest,
    problemPackage,
    solutionWork,
  });

  return {
    problemPackage,
    problemPackagePath,
    problemPackageSha256,
    solutionWork,
    sourceWorkspace,
    artifactRoot,
    outputPath,
    sourceInvocation,
    artifacts,
  };
}

function relocateReplayResult(result: SolutionReviewerRunResult, outputPath: string): SolutionReviewerRunResult {
  const invocationPath = join(outputPath, 'invocation.json');
  const rawOutputPath = join(outputPath, 'raw-output.txt');
  if (result.ok) {
    return {
      ...result,
      invocationPath,
      rawOutputPath,
      reviewPath: join(outputPath, 'review.json'),
    };
  }
  return {
    ...result,
    invocationPath,
    rawOutputPath,
    failurePath: join(outputPath, 'failure.json'),
  };
}

export async function runSolutionReviewerReplay(
  input: RunSolutionReviewerReplayInput,
): Promise<SolutionReviewerRunResult> {
  const verified = await verifyHistoricalInput(input);
  await mkdir(dirname(verified.outputPath), { recursive: true });
  const temporaryReplayRoot = await mkdtemp(join(dirname(verified.outputPath), 'solution-reviewer-replay-'));
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
      jobKind: 'reviewer',
    });
    const cloneFingerprint = await captureAuthoritativeFingerprint(clone.workspaceRoot);
    if (clone.workspaceBaselineFingerprintSha256 !== verified.sourceInvocation.workspaceBaselineFingerprintSha256
      || cloneFingerprint !== verified.sourceInvocation.workspaceBaselineFingerprintSha256) {
      throw new Error('replay clone workspace baseline fingerprint mismatch with historical Reviewer input');
    }

    const replayOutputPath = join(temporaryReplayRoot, 'output');
    const result = await runSolutionReviewer({
      problemPackage: verified.problemPackage,
      problemPackagePath: replaySurface.problemPackagePath,
      solutionWork: verified.solutionWork,
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

export async function runSolutionReviewerReplayCli(argv: string[]): Promise<SolutionReviewerRunResult> {
  const args = parseCliArgs(argv);
  const bindingId = parseOperatorParticipantBindingId(args.participantBinding);
  const binding = await resolveOperatorParticipantBinding(bindingId);
  const result = await runSolutionReviewerReplay({
    problemPackagePath: args.problemPackagePath,
    solutionPath: args.solutionPath,
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
      ? { invocationPath: result.invocationPath, rawOutputPath: result.rawOutputPath, reviewPath: result.reviewPath }
      : { invocationPath: result.invocationPath, rawOutputPath: result.rawOutputPath, failurePath: result.failurePath },
  }, null, 2));
  if (!result.ok) process.exitCode = 1;
  return result;
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runSolutionReviewerReplayCli(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
