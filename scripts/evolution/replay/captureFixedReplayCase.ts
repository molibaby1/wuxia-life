import { constants as fsConstants } from 'node:fs';
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readlink,
  readdir,
  rename,
  rm,
  symlink,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  assertAuthoritativeFingerprintUnchanged,
  captureAuthoritativeFingerprint,
} from '../problemAgnosticSolution/agentWorkspace';
import { sha256Hex, canonicalJson } from '../phase0/provenance';
import { parseProblemPackage, type ProblemPackage } from '../../../src/evolution/problemPackageContract';
import { parseSolutionReview, type SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import { parseSolutionDecision, type SolutionDecisionV1 } from '../../../src/evolution/solutionDecisionContract';
import { parseSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';

const REQUIRED_FLAGS = ['--report', '--workflow', '--output'] as const;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

type RecordValue = Record<string, unknown>;

export interface CaptureFixedReplayCaseInput {
  reportPath: string;
  workflowIdentity: string;
  outputPath: string;
  repositoryRoot?: string;
}

export interface FixedReplayCaseManifest {
  schemaVersion: 'ae-fixed-replay-case-manifest-v1';
  caseId: string;
  source: {
    sessionId: string;
    workflowIdentity: string;
    reportRef: 'historical/source-report.json';
  };
  problemPackage: {
    ref: 'input/problem-package.json';
    sha256: string;
  };
  declaredArtifacts: Array<{ ref: string; sha256: string }>;
  solution: {
    workspaceRef: 'workspaces/solution';
    workspaceBaselineFingerprintSha256: string;
    invocationRef: 'historical/solution-invocation.json';
    historicalResultRef: 'historical/solution-result.json';
  };
  reviewer: {
    workspaceRef: 'workspaces/reviewer';
    workspaceBaselineFingerprintSha256: string;
    invocationRef: 'historical/reviewer-invocation.json';
    historicalResultRef: 'historical/reviewer-result.json';
  };
  historicalDecisionRef: 'historical/decision.json';
}

export interface CaptureFixedReplayCaseResult {
  outputPath: string;
  manifest: FixedReplayCaseManifest;
  source: {
    reportSha256: string;
    problemPackageSha256: string;
    solutionWorkspaceFingerprintSha256: string;
    reviewerWorkspaceFingerprintSha256: string;
  };
  captured: {
    problemPackageSha256: string;
    solutionWorkspaceFingerprintSha256: string;
    reviewerWorkspaceFingerprintSha256: string;
    declaredArtifacts: Array<{ ref: string; sha256: string }>;
  };
}

interface ReplayCliArgs {
  reportPath: string;
  workflowIdentity: string;
  outputPath: string;
}

interface SkillAssignment {
  identity: string;
  version: string;
  canonicalPath: string;
  expectedContentSha256: string;
}

interface HistoricalInvocation {
  invocationRef: string;
  jobNumber: number;
  workspaceBaselineFingerprintSha256: string;
  problemPackageSha256: string;
  skillAssignments: readonly SkillAssignment[];
}

interface WorkspaceManifestEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

interface WorkspaceManifest {
  workspaceBaselineFingerprintSha256: string;
  entries: Map<string, WorkspaceManifestEntry>;
}

interface FilesystemSnapshotEntry {
  relativePath: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

interface SourceFileSnapshot {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

interface VerifiedSource {
  reportPath: string;
  sourceRoot: string;
  workflowRoot: string;
  workflowSourceRunRef: string;
  caseId: string;
  outputPath: string;
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  problemPackageBytes: Buffer;
  solutionWork: SolutionWorkV1;
  solutionReview: SolutionReviewV1;
  solutionDecision: SolutionDecisionV1;
  solutionWorkspace: string;
  reviewerWorkspace: string;
  solutionInvocation: HistoricalInvocation;
  reviewerInvocation: HistoricalInvocation;
  solutionInvocationPath: string;
  reviewerInvocationPath: string;
  solutionResultPath: string;
  reviewerResultPath: string;
  decisionPath: string;
  solutionManifest: WorkspaceManifest;
  reviewerManifest: WorkspaceManifest;
  solutionWorkspaceSnapshot: readonly FilesystemSnapshotEntry[];
  reviewerWorkspaceSnapshot: readonly FilesystemSnapshotEntry[];
  sourceFiles: readonly SourceFileSnapshot[];
  declaredArtifacts: readonly { ref: string; sha256: string }[];
  reportSha256: string;
  solutionWorkspaceFingerprintSha256: string;
  reviewerWorkspaceFingerprintSha256: string;
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

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

function isInside(root: string, target: string): boolean {
  const escaped = relative(resolve(root), resolve(target));
  return escaped === '' || (escaped !== '..' && !escaped.startsWith(`..${sep}`) && !isAbsolute(escaped));
}

function resolveInside(root: string, reference: string, label: string): string {
  if (!reference || isAbsolute(reference)) throw new Error(`${label} must be a relative path: ${reference}`);
  const target = resolve(root, reference);
  if (!isInside(root, target)) throw new Error(`${label} escapes source workflow root: ${reference}`);
  return target;
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
    throw new Error(`unable to inspect fixed replay case output ${path}: ${String(error)}`);
  }
  throw new Error(`fixed replay case output already exists: ${path}`);
}

function assertSafeSymlink(root: string, linkPath: string, linkText: string): void {
  if (isAbsolute(linkText)) throw new Error(`absolute symlink is not allowed: ${linkPath}`);
  const target = resolve(dirname(linkPath), linkText);
  if (!isInside(root, target) || relative(resolve(root), target) === '') {
    throw new Error(`symlink escapes workspace: ${linkPath}`);
  }
}

async function collectWorkspaceSnapshot(root: string, current = ''): Promise<FilesystemSnapshotEntry[]> {
  const directory = current ? resolveInside(root, current, 'workspace path') : resolve(root);
  const entries = await readdir(directory, { withFileTypes: true });
  const result: FilesystemSnapshotEntry[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    const absolutePath = resolveInside(root, relativePath, 'workspace path');
    if (entry.isDirectory()) {
      result.push(...await collectWorkspaceSnapshot(root, relativePath));
    } else if (entry.isFile()) {
      result.push({
        relativePath,
        objectKind: 'regular_file',
        sha256: sha256Hex(await readFile(absolutePath)),
      });
    } else if (entry.isSymbolicLink()) {
      const linkText = await readlink(absolutePath);
      assertSafeSymlink(root, absolutePath, linkText);
      result.push({
        relativePath,
        objectKind: 'symlink',
        sha256: sha256Hex(await readlink(absolutePath, { encoding: 'buffer' })),
      });
    } else {
      throw new Error(`unsupported source object: ${relativePath}`);
    }
  }
  return result;
}

async function snapshotFile(path: string, label: string): Promise<SourceFileSnapshot> {
  const stat = await lstat(path);
  if (stat.isFile()) {
    return { path, objectKind: 'regular_file', sha256: sha256Hex(await readFile(path)) };
  }
  if (stat.isSymbolicLink()) {
    const linkText = await readlink(path);
    throw new Error(`${label} must be a regular file: ${path}; symlink ${linkText} is not allowed`);
  }
  throw new Error(`${label} must be a regular file: ${path}`);
}

async function snapshotWorkspaceObject(path: string, expectedObjectKind: SourceFileSnapshot['objectKind']): Promise<SourceFileSnapshot> {
  const stat = await lstat(path);
  if (expectedObjectKind === 'regular_file' && stat.isFile()) {
    return { path, objectKind: 'regular_file', sha256: sha256Hex(await readFile(path)) };
  }
  if (expectedObjectKind === 'symlink' && stat.isSymbolicLink()) {
    return { path, objectKind: 'symlink', sha256: sha256Hex(await readlink(path, { encoding: 'buffer' })) };
  }
  throw new Error(`captured source object changed type: ${path}`);
}

function parseSkillAssignments(value: unknown, label: string): readonly SkillAssignment[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => {
    assertObject(item, `${label}[${index}]`);
    return {
      identity: nonEmptyString(item.identity, `${label}[${index}].identity`),
      version: nonEmptyString(item.version, `${label}[${index}].version`),
      canonicalPath: nonEmptyString(item.canonicalPath, `${label}[${index}].canonicalPath`),
      expectedContentSha256: sha256(item.expectedContentSha256, `${label}[${index}].expectedContentSha256`),
    };
  });
}

function parseHistoricalInvocation(value: unknown, role: 'solution' | 'reviewer'): HistoricalInvocation {
  assertObject(value, `historical ${role} invocation`);
  const expectedSchema = role === 'solution'
    ? 'solution-agent-invocation-v2'
    : 'solution-reviewer-invocation-v2';
  if (value.schemaVersion !== expectedSchema) {
    throw new Error(`historical ${role} invocation schemaVersion must be ${expectedSchema}`);
  }
  if (value.role !== role) throw new Error(`historical ${role} invocation role must be ${role}`);
  if (typeof value.jobNumber !== 'number' || !Number.isInteger(value.jobNumber) || value.jobNumber < 0) {
    throw new Error(`historical ${role} invocation.jobNumber must be a non-negative integer`);
  }
  return {
    invocationRef: nonEmptyString(value.invocationRef, `historical ${role} invocation.invocationRef`),
    jobNumber: value.jobNumber,
    workspaceBaselineFingerprintSha256: sha256(
      value.workspaceBaselineFingerprintSha256,
      `historical ${role} invocation.workspaceBaselineFingerprintSha256`,
    ),
    problemPackageSha256: sha256(value.problemPackageSha256, `historical ${role} invocation.problemPackageSha256`),
    skillAssignments: parseSkillAssignments(value.skillAssignments, `historical ${role} invocation.skillAssignments`),
  };
}

function parseWorkspaceManifest(value: unknown, role: 'Solution' | 'Reviewer'): WorkspaceManifest {
  assertObject(value, `historical ${role} workspace manifest`);
  if (value.schemaVersion !== 'agent-workspace-manifest-v1') {
    throw new Error(`historical ${role} workspace manifest schemaVersion must be agent-workspace-manifest-v1`);
  }
  const expectedJobKind = role.toLowerCase();
  if (value.jobKind !== expectedJobKind) {
    throw new Error(`historical ${role} workspace manifest jobKind must be ${expectedJobKind}`);
  }
  if (!Array.isArray(value.entries)) {
    throw new Error(`historical ${role} workspace manifest.entries must be an array`);
  }
  const entries = new Map<string, WorkspaceManifestEntry>();
  for (const [index, item] of value.entries.entries()) {
    assertObject(item, `historical ${role} workspace manifest.entries[${index}]`);
    const path = nonEmptyString(item.path, `historical ${role} workspace manifest.entries[${index}].path`);
    if (isAbsolute(path) || path.includes('\\')) {
      throw new Error(`historical ${role} workspace manifest entry path must be relative: ${path}`);
    }
    if (entries.has(path)) throw new Error(`historical ${role} workspace manifest.entries contains duplicate path: ${path}`);
    if (item.objectKind !== 'regular_file' && item.objectKind !== 'symlink') {
      throw new Error(`historical ${role} workspace manifest.entries[${index}].objectKind is invalid`);
    }
    entries.set(path, {
      path,
      objectKind: item.objectKind,
      sha256: sha256(item.sha256, `historical ${role} workspace manifest.entries[${index}].sha256`),
    });
  }
  return {
    workspaceBaselineFingerprintSha256: sha256(
      value.workspaceBaselineFingerprintSha256,
      `historical ${role} workspace manifest.workspaceBaselineFingerprintSha256`,
    ),
    entries,
  };
}

async function verifyWorkspace(
  workspaceRoot: string,
  role: 'Solution' | 'Reviewer',
  expectedInvocationFingerprint: string,
): Promise<{ manifest: WorkspaceManifest; snapshot: readonly FilesystemSnapshotEntry[]; fingerprint: string }> {
  await requireDirectory(workspaceRoot, `historical ${role} workspace`);
  const snapshot = await collectWorkspaceSnapshot(workspaceRoot);
  const manifestPath = join(workspaceRoot, '.agent-workspace-manifest.json');
  await requireRegularFile(manifestPath, `historical ${role} workspace manifest`);
  const manifest = parseWorkspaceManifest(
    parseJson(await readFile(manifestPath, 'utf8'), `historical ${role} workspace manifest`),
    role,
  );
  const fingerprint = await captureAuthoritativeFingerprint(workspaceRoot);
  if (manifest.workspaceBaselineFingerprintSha256 !== expectedInvocationFingerprint) {
    throw new Error(`historical ${role} workspace manifest fingerprint mismatch with invocation`);
  }
  if (fingerprint !== manifest.workspaceBaselineFingerprintSha256) {
    throw new Error(
      `historical ${role} workspace fingerprint mismatch: expected ${manifest.workspaceBaselineFingerprintSha256}, got ${fingerprint}`,
    );
  }
  const actualEntries = new Map(snapshot.map(entry => [entry.relativePath, entry]));
  for (const entry of manifest.entries.values()) {
    resolveInside(workspaceRoot, entry.path, `historical ${role} workspace manifest entry`);
    const actual = actualEntries.get(entry.path);
    if (actual === undefined || actual.objectKind !== entry.objectKind || actual.sha256 !== entry.sha256) {
      throw new Error(`historical ${role} workspace manifest entry hash mismatch: ${entry.path}`);
    }
  }
  return { manifest, snapshot, fingerprint };
}

async function verifySkillAssignments(
  workspaceRoot: string,
  manifest: WorkspaceManifest,
  assignments: readonly SkillAssignment[],
  role: 'Solution' | 'Reviewer',
): Promise<void> {
  for (const assignment of assignments) {
    const path = resolveInside(workspaceRoot, assignment.canonicalPath, `historical ${role} Skill path`);
    const manifestEntry = manifest.entries.get(assignment.canonicalPath);
    if (manifestEntry === undefined || manifestEntry.objectKind !== 'regular_file') {
      throw new Error(`historical ${role} Skill assignment is not sealed as a regular file: ${assignment.canonicalPath}`);
    }
    await requireRegularFile(path, `historical ${role} Skill artifact`);
    const actualSha256 = sha256Hex(await readFile(path));
    if (actualSha256 !== manifestEntry.sha256 || actualSha256 !== assignment.expectedContentSha256) {
      throw new Error(`historical ${role} Skill hash mismatch: ${assignment.canonicalPath}`);
    }
  }
}

function declaredArtifactRefs(problemPackage: ProblemPackage, solutionWork: SolutionWorkV1): string[] {
  const refs = [
    problemPackage.source.observablePayloadRef,
    problemPackage.source.externalFeedbackRef,
    problemPackage.source.improvementHypothesisRef,
    ...(problemPackage.schemaVersion === 'problem-package-v2' ? problemPackage.source.diagnosticEvidenceRefs : []),
    ...solutionWork.artifactRefs,
    ...solutionWork.options.flatMap(option => option.artifactRefs),
  ];
  return [...new Set(refs)];
}

async function verifyDeclaredArtifacts(input: {
  workflowRoot: string;
  solutionManifest: WorkspaceManifest;
  reviewerManifest: WorkspaceManifest;
  problemPackage: ProblemPackage;
  solutionWork: SolutionWorkV1;
}): Promise<readonly { ref: string; sha256: string }[]> {
  const artifacts: Array<{ ref: string; sha256: string }> = [];
  const packageRefs = new Set([
    input.problemPackage.source.observablePayloadRef,
    input.problemPackage.source.externalFeedbackRef,
    input.problemPackage.source.improvementHypothesisRef,
    ...(input.problemPackage.schemaVersion === 'problem-package-v2'
      ? input.problemPackage.source.diagnosticEvidenceRefs
      : []),
  ]);
  for (const ref of declaredArtifactRefs(input.problemPackage, input.solutionWork)) {
    const path = resolveInside(input.workflowRoot, ref, `declared artifact ${ref}`);
    await requireRegularFile(path, `declared artifact`);
    const actualSha256 = sha256Hex(await readFile(path));
    for (const [role, manifest] of [
      ['Solution', input.solutionManifest] as const,
      ['Reviewer', input.reviewerManifest] as const,
    ]) {
      const manifestEntry = manifest.entries.get(ref);
      if (manifestEntry !== undefined) {
        if (manifestEntry.objectKind !== 'regular_file' || manifestEntry.sha256 !== actualSha256) {
          throw new Error(`${role} sealed artifact hash mismatch: ${ref}`);
        }
      } else if (packageRefs.has(ref)) {
        throw new Error(`${role} workspace manifest is missing declared artifact: ${ref}`);
      }
    }
    artifacts.push({ ref, sha256: actualSha256 });
  }
  return artifacts;
}

function snapshotMap(entries: readonly FilesystemSnapshotEntry[]): Map<string, FilesystemSnapshotEntry> {
  return new Map(entries.map(entry => [entry.relativePath, entry]));
}

async function copyWorkspaceTree(sourceRoot: string, destinationRoot: string, current = ''): Promise<void> {
  const sourceDirectory = current ? resolveInside(sourceRoot, current, 'workspace path') : resolve(sourceRoot);
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    const sourcePath = resolveInside(sourceRoot, relativePath, 'workspace path');
    const destinationPath = resolveInside(destinationRoot, relativePath, 'workspace path');
    if (entry.isDirectory()) {
      await mkdir(destinationPath, { recursive: true });
      await copyWorkspaceTree(sourceRoot, destinationRoot, relativePath);
    } else if (entry.isFile()) {
      await mkdir(dirname(destinationPath), { recursive: true });
      await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
    } else if (entry.isSymbolicLink()) {
      const linkText = await readlink(sourcePath);
      assertSafeSymlink(sourceRoot, sourcePath, linkText);
      assertSafeSymlink(destinationRoot, destinationPath, linkText);
      await mkdir(dirname(destinationPath), { recursive: true });
      await symlink(linkText, destinationPath);
    } else {
      throw new Error(`unsupported source object: ${relativePath}`);
    }
  }
}

async function copyVerifiedFile(sourcePath: string, destinationPath: string, expectedSha256: string, label: string): Promise<void> {
  await mkdir(dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);
  if (sha256Hex(await readFile(destinationPath)) !== expectedSha256) {
    throw new Error(`captured ${label} hash mismatch after copy`);
  }
}

async function writeCreateOnlyJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

async function assertSourceFilesUnchanged(files: readonly SourceFileSnapshot[]): Promise<void> {
  for (const expected of files) {
    const actual = await snapshotWorkspaceObject(expected.path, expected.objectKind);
    if (actual.objectKind !== expected.objectKind || actual.sha256 !== expected.sha256) {
      throw new Error(`source changed during fixed replay case capture: ${expected.path}`);
    }
  }
}

async function verifyCopiedWorkspace(
  sourceRoot: string,
  destinationRoot: string,
  sourceSnapshot: readonly FilesystemSnapshotEntry[],
  expectedFingerprint: string,
  role: 'Solution' | 'Reviewer',
): Promise<void> {
  const destinationSnapshot = await collectWorkspaceSnapshot(destinationRoot);
  const sourceMap = snapshotMap(sourceSnapshot);
  const destinationMap = snapshotMap(destinationSnapshot);
  if (sourceMap.size !== destinationMap.size) {
    throw new Error(`captured ${role} workspace object count mismatch`);
  }
  for (const [path, sourceEntry] of sourceMap) {
    const destinationEntry = destinationMap.get(path);
    if (destinationEntry === undefined
      || destinationEntry.objectKind !== sourceEntry.objectKind
      || destinationEntry.sha256 !== sourceEntry.sha256) {
      throw new Error(`captured ${role} workspace entry mismatch: ${path}`);
    }
  }
  const destinationFingerprint = await captureAuthoritativeFingerprint(destinationRoot);
  if (destinationFingerprint !== expectedFingerprint) {
    throw new Error(`captured ${role} workspace fingerprint mismatch: expected ${expectedFingerprint}, got ${destinationFingerprint}`);
  }
  await assertAuthoritativeFingerprintUnchanged(sourceRoot, expectedFingerprint);
}

function parseReport(value: unknown, workflowIdentity: string): { sourceRoot: string; workflow: RecordValue } {
  assertObject(value, 'operational run report');
  const sourceRoot = nonEmptyString(value.sourceRoot, 'operational run report.sourceRoot');
  if (!Array.isArray(value.workflows)) throw new Error('operational run report.workflows must be an array');
  const matches = value.workflows.filter(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
    return (item as RecordValue).identity === workflowIdentity;
  });
  if (matches.length === 0) throw new Error(`workflow not found in operational run report: ${workflowIdentity}`);
  if (matches.length > 1) throw new Error(`workflow appears more than once in operational run report: ${workflowIdentity}`);
  assertObject(matches[0], 'operational run report workflow');
  return { sourceRoot, workflow: matches[0] };
}

async function verifyHistoricalInput(input: CaptureFixedReplayCaseInput): Promise<VerifiedSource> {
  const repositoryRoot = resolve(input.repositoryRoot ?? process.cwd());
  const reportPath = isAbsolute(input.reportPath) ? resolve(input.reportPath) : resolve(repositoryRoot, input.reportPath);
  const outputPath = isAbsolute(input.outputPath) ? resolve(input.outputPath) : resolve(repositoryRoot, input.outputPath);
  const workflowIdentity = nonEmptyString(input.workflowIdentity, 'workflow identity');
  if (isAbsolute(workflowIdentity)) throw new Error('workflow identity must be relative');
  await requireRegularFile(reportPath, 'operational run report');
  await assertOutputDoesNotExist(outputPath);

  const reportBytes = await readFile(reportPath);
  const report = parseReport(parseJson(reportBytes.toString('utf8'), 'operational run report'), workflowIdentity);
  const sourceRoot = isAbsolute(report.sourceRoot)
    ? resolve(report.sourceRoot)
    : resolve(repositoryRoot, report.sourceRoot);
  await requireDirectory(sourceRoot, 'report source root');
  const workflowRoot = resolveInside(sourceRoot, workflowIdentity, 'workflow identity');
  await requireDirectory(workflowRoot, 'historical workflow root');
  if (isInside(sourceRoot, outputPath)) throw new Error('fixed replay case output must not be inside source root');

  const workflowSourceRunRef = nonEmptyString(report.workflow.sourceRunRef, 'workflow.sourceRunRef');
  const caseId = basename(outputPath);
  if (!caseId || caseId === '.' || caseId === '..') throw new Error('fixed replay case output must have a case id');

  const problemPackagePath = join(workflowRoot, 'problem-package.json');
  const solutionWorkspace = join(workflowRoot, 'agent-workspaces/solution');
  const reviewerWorkspace = join(workflowRoot, 'agent-workspaces/reviewer');
  const solutionInvocationPath = join(workflowRoot, 'solution-agent/invocation.json');
  const reviewerInvocationPath = join(workflowRoot, 'reviewer-agent/invocation.json');
  const solutionResultPath = join(workflowRoot, 'solution-agent/result.json');
  const reviewerResultPath = join(workflowRoot, 'reviewer-agent/review.json');
  const decisionPath = join(workflowRoot, 'decision.json');

  await requireRegularFile(problemPackagePath, 'historical Problem Package');
  await requireRegularFile(solutionInvocationPath, 'historical Solution invocation');
  await requireRegularFile(reviewerInvocationPath, 'historical Reviewer invocation');
  await requireRegularFile(solutionResultPath, 'historical Solution result');
  await requireRegularFile(reviewerResultPath, 'historical Reviewer result');
  await requireRegularFile(decisionPath, 'historical Decision');
  const problemPackageBytes = await readFile(problemPackagePath);
  const problemPackage = parseProblemPackage(problemPackageBytes.toString('utf8'));
  if (problemPackage.source.runRef !== workflowSourceRunRef) {
    throw new Error('Problem Package source.runRef does not match workflow sourceRunRef');
  }
  const solutionInvocation = parseHistoricalInvocation(
    parseJson(await readFile(solutionInvocationPath, 'utf8'), 'historical Solution invocation'),
    'solution',
  );
  const reviewerInvocation = parseHistoricalInvocation(
    parseJson(await readFile(reviewerInvocationPath, 'utf8'), 'historical Reviewer invocation'),
    'reviewer',
  );
  const solutionWork = parseSolutionWork(await readFile(solutionResultPath, 'utf8'));
  if (solutionWork.status !== 'OPTIONS') throw new Error('historical Solution result must be OPTIONS for Reviewer replay');
  if (solutionWork.problemId !== problemPackage.problemId) throw new Error('historical Solution result problemId mismatch');
  const solutionReview = parseSolutionReview(await readFile(reviewerResultPath, 'utf8'));
  if (solutionReview.problemId !== problemPackage.problemId) throw new Error('historical Reviewer result problemId mismatch');
  const solutionDecision = parseSolutionDecision(await readFile(decisionPath, 'utf8'));
  if (solutionDecision.problemId !== problemPackage.problemId) throw new Error('historical Decision problemId mismatch');

  const problemPackageSha256 = sha256Hex(problemPackageBytes);
  if (problemPackageSha256 !== solutionInvocation.problemPackageSha256) {
    throw new Error('problem-package bytes hash does not match historical solution invocation');
  }
  if (problemPackageSha256 !== reviewerInvocation.problemPackageSha256) {
    throw new Error('problem-package bytes hash does not match historical reviewer invocation');
  }
  const solutionVerified = await verifyWorkspace(
    solutionWorkspace,
    'Solution',
    solutionInvocation.workspaceBaselineFingerprintSha256,
  );
  const reviewerVerified = await verifyWorkspace(
    reviewerWorkspace,
    'Reviewer',
    reviewerInvocation.workspaceBaselineFingerprintSha256,
  );
  await verifySkillAssignments(solutionWorkspace, solutionVerified.manifest, solutionInvocation.skillAssignments, 'Solution');
  await verifySkillAssignments(reviewerWorkspace, reviewerVerified.manifest, reviewerInvocation.skillAssignments, 'Reviewer');
  const declaredArtifacts = await verifyDeclaredArtifacts({
    workflowRoot,
    solutionManifest: solutionVerified.manifest,
    reviewerManifest: reviewerVerified.manifest,
    problemPackage,
    solutionWork,
  });

  const sourceFiles: SourceFileSnapshot[] = [
    { path: reportPath, objectKind: 'regular_file', sha256: sha256Hex(reportBytes) },
    await snapshotFile(problemPackagePath, 'historical Problem Package'),
    await snapshotFile(solutionInvocationPath, 'historical Solution invocation'),
    await snapshotFile(reviewerInvocationPath, 'historical Reviewer invocation'),
    await snapshotFile(solutionResultPath, 'historical Solution result'),
    await snapshotFile(reviewerResultPath, 'historical Reviewer result'),
    await snapshotFile(decisionPath, 'historical Decision'),
    ...await Promise.all(declaredArtifacts.map(async artifact => snapshotFile(
      resolveInside(workflowRoot, artifact.ref, `declared artifact ${artifact.ref}`),
      `declared artifact ${artifact.ref}`,
    ))),
    ...solutionVerified.snapshot.map(entry => ({
      path: join(solutionWorkspace, entry.relativePath),
      objectKind: entry.objectKind,
      sha256: entry.sha256,
    })),
    ...reviewerVerified.snapshot.map(entry => ({
      path: join(reviewerWorkspace, entry.relativePath),
      objectKind: entry.objectKind,
      sha256: entry.sha256,
    })),
  ];

  return {
    reportPath,
    sourceRoot,
    workflowRoot,
    workflowSourceRunRef,
    caseId,
    outputPath,
    problemPackage,
    problemPackagePath,
    problemPackageBytes,
    solutionWork,
    solutionReview,
    solutionDecision,
    solutionWorkspace,
    reviewerWorkspace,
    solutionInvocation,
    reviewerInvocation,
    solutionInvocationPath,
    reviewerInvocationPath,
    solutionResultPath,
    reviewerResultPath,
    decisionPath,
    solutionManifest: solutionVerified.manifest,
    reviewerManifest: reviewerVerified.manifest,
    solutionWorkspaceSnapshot: solutionVerified.snapshot,
    reviewerWorkspaceSnapshot: reviewerVerified.snapshot,
    sourceFiles,
    declaredArtifacts,
    reportSha256: sha256Hex(reportBytes),
    solutionWorkspaceFingerprintSha256: solutionVerified.fingerprint,
    reviewerWorkspaceFingerprintSha256: reviewerVerified.fingerprint,
  };
}

function buildCaseManifest(verified: VerifiedSource): FixedReplayCaseManifest {
  return {
    schemaVersion: 'ae-fixed-replay-case-manifest-v1',
    caseId: verified.caseId,
    source: {
      sessionId: verified.workflowSourceRunRef,
      workflowIdentity: verified.workflowRoot.slice(verified.sourceRoot.length + 1),
      reportRef: 'historical/source-report.json',
    },
    problemPackage: {
      ref: 'input/problem-package.json',
      sha256: sha256Hex(verified.problemPackageBytes),
    },
    declaredArtifacts: verified.declaredArtifacts.map(artifact => ({ ...artifact })),
    solution: {
      workspaceRef: 'workspaces/solution',
      workspaceBaselineFingerprintSha256: verified.solutionInvocation.workspaceBaselineFingerprintSha256,
      invocationRef: 'historical/solution-invocation.json',
      historicalResultRef: 'historical/solution-result.json',
    },
    reviewer: {
      workspaceRef: 'workspaces/reviewer',
      workspaceBaselineFingerprintSha256: verified.reviewerInvocation.workspaceBaselineFingerprintSha256,
      invocationRef: 'historical/reviewer-invocation.json',
      historicalResultRef: 'historical/reviewer-result.json',
    },
    historicalDecisionRef: 'historical/decision.json',
  };
}

async function materializeCase(verified: VerifiedSource, manifest: FixedReplayCaseManifest): Promise<void> {
  await mkdir(dirname(verified.outputPath), { recursive: true });
  const temporaryRoot = await mkdtemp(join(dirname(verified.outputPath), `.${verified.caseId}.capture-`));
  let renamed = false;
  try {
    await copyVerifiedFile(
      verified.reportPath,
      join(temporaryRoot, 'historical/source-report.json'),
      verified.reportSha256,
      'source report',
    );
    await copyVerifiedFile(
      verified.problemPackagePath,
      join(temporaryRoot, 'input/problem-package.json'),
      sha256Hex(verified.problemPackageBytes),
      'Problem Package',
    );
    for (const artifact of verified.declaredArtifacts) {
      await copyVerifiedFile(
        resolveInside(verified.workflowRoot, artifact.ref, `declared artifact ${artifact.ref}`),
        resolveInside(join(temporaryRoot, 'input/artifacts'), artifact.ref, `captured artifact ${artifact.ref}`),
        artifact.sha256,
        `artifact ${artifact.ref}`,
      );
    }
    await copyWorkspaceTree(verified.solutionWorkspace, join(temporaryRoot, 'workspaces/solution'));
    await copyWorkspaceTree(verified.reviewerWorkspace, join(temporaryRoot, 'workspaces/reviewer'));
    for (const [sourcePath, destinationPath, label] of [
      [verified.solutionInvocationPath, 'historical/solution-invocation.json', 'Solution invocation'],
      [verified.solutionResultPath, 'historical/solution-result.json', 'Solution result'],
      [verified.reviewerInvocationPath, 'historical/reviewer-invocation.json', 'Reviewer invocation'],
      [verified.reviewerResultPath, 'historical/reviewer-result.json', 'Reviewer result'],
      [verified.decisionPath, 'historical/decision.json', 'Decision'],
    ] as const) {
      const expected = verified.sourceFiles.find(file => file.path === sourcePath);
      if (expected === undefined) throw new Error(`missing capture source snapshot: ${sourcePath}`);
      await copyVerifiedFile(sourcePath, join(temporaryRoot, destinationPath), expected.sha256, label);
    }

    await verifyCopiedWorkspace(
      verified.solutionWorkspace,
      join(temporaryRoot, 'workspaces/solution'),
      verified.solutionWorkspaceSnapshot,
      verified.solutionWorkspaceFingerprintSha256,
      'Solution',
    );
    await verifyCopiedWorkspace(
      verified.reviewerWorkspace,
      join(temporaryRoot, 'workspaces/reviewer'),
      verified.reviewerWorkspaceSnapshot,
      verified.reviewerWorkspaceFingerprintSha256,
      'Reviewer',
    );
    for (const artifact of verified.declaredArtifacts) {
      const copiedPath = resolveInside(join(temporaryRoot, 'input/artifacts'), artifact.ref, `captured artifact ${artifact.ref}`);
      if (sha256Hex(await readFile(copiedPath)) !== artifact.sha256) {
        throw new Error(`captured artifact hash mismatch: ${artifact.ref}`);
      }
    }
    await assertSourceFilesUnchanged(verified.sourceFiles);
    await assertAuthoritativeFingerprintUnchanged(
      verified.solutionWorkspace,
      verified.solutionWorkspaceFingerprintSha256,
    );
    await assertAuthoritativeFingerprintUnchanged(
      verified.reviewerWorkspace,
      verified.reviewerWorkspaceFingerprintSha256,
    );
    await writeCreateOnlyJson(join(temporaryRoot, 'case.json'), manifest);
    await rename(temporaryRoot, verified.outputPath);
    renamed = true;
  } finally {
    if (!renamed) await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function captureFixedReplayCase(input: CaptureFixedReplayCaseInput): Promise<CaptureFixedReplayCaseResult> {
  const verified = await verifyHistoricalInput(input);
  const manifest = buildCaseManifest(verified);
  await materializeCase(verified, manifest);
  return {
    outputPath: verified.outputPath,
    manifest,
    source: {
      reportSha256: verified.reportSha256,
      problemPackageSha256: verified.problemPackageSha256,
      solutionWorkspaceFingerprintSha256: verified.solutionWorkspaceFingerprintSha256,
      reviewerWorkspaceFingerprintSha256: verified.reviewerWorkspaceFingerprintSha256,
    },
    captured: {
      problemPackageSha256: manifest.problemPackage.sha256,
      solutionWorkspaceFingerprintSha256: manifest.solution.workspaceBaselineFingerprintSha256,
      reviewerWorkspaceFingerprintSha256: manifest.reviewer.workspaceBaselineFingerprintSha256,
      declaredArtifacts: manifest.declaredArtifacts,
    },
  };
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
    reportPath: values.get('--report')!,
    workflowIdentity: values.get('--workflow')!,
    outputPath: values.get('--output')!,
  };
}

export async function runFixedReplayCaseCli(argv: string[]): Promise<CaptureFixedReplayCaseResult> {
  const args = parseCliArgs(argv);
  const result = await captureFixedReplayCase(args);
  console.log(JSON.stringify({ caseId: result.manifest.caseId, outputPath: result.outputPath }, null, 2));
  return result;
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runFixedReplayCaseCli(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
