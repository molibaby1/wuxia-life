import { lstat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sha256Hex } from '../phase0/provenance';
import type {
  DurableEvidenceObjectInput,
  DurableParticipantInvocationReceiptInput,
  DurableParticipantRole,
} from './durableEvidenceCapsule';

type InvocationRoot = {
  rootRef: string;
  role: DurableParticipantRole;
  round: 1 | 2;
  continuationRef: string | null;
  structuredFile: string;
  rawOutputFiles: string[];
};

async function isFile(path: string): Promise<boolean> {
  try {
    return (await lstat(path)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function childDirectories(path: string): Promise<string[]> {
  try {
    return (await readdir(path, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function parseJson(value: string, label: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error(`${label} must be an object`);
  return parsed as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function logicalNameFor(evidence: Map<string, DurableEvidenceObjectInput>, rootRef: string, file: string, required: boolean, label: string): string | null {
  const sourceRef = `${rootRef}/${file}`;
  const object = evidence.get(sourceRef);
  if (!object) {
    if (required) throw new Error(`required participant evidence is missing: ${sourceRef} (${label})`);
    return null;
  }
  return object.logicalName;
}

function logicalNameForSourceRef(evidence: Map<string, DurableEvidenceObjectInput>, sourceRef: string): string | null {
  return evidence.get(sourceRef)?.logicalName ?? null;
}

function collectArtifactRefs(evidence: Map<string, DurableEvidenceObjectInput>, roundRef: string, problemPackage: Record<string, unknown>): string[] {
  const source = typeof problemPackage.source === 'object' && problemPackage.source !== null && !Array.isArray(problemPackage.source)
    ? problemPackage.source as Record<string, unknown>
    : {};
  const refs = [
    'problem-package.json',
    source.observablePayloadRef,
    source.externalFeedbackRef,
    source.improvementHypothesisRef,
    ...(Array.isArray(source.diagnosticEvidenceRefs) ? source.diagnosticEvidenceRefs : []),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
  return [...new Set(refs.map(ref => {
    const roundRelativeRef = ref.startsWith(`${roundRef}/`) ? ref : `${roundRef}/${ref}`;
    const logical = logicalNameForSourceRef(evidence, roundRelativeRef);
    if (logical === null) throw new Error(`required Problem Package evidence is missing: ${roundRelativeRef}`);
    return logical;
  }))];
}

function snapshotPath(value: string, label: string): string {
  if (value.length === 0 || value.includes('\\') || value.startsWith('/')) throw new Error(`${label} must be a safe relative path`);
  const segments = value.split('/');
  if (segments.some(segment => segment.length === 0 || segment === '.' || segment === '..')) throw new Error(`${label} must be a safe relative path`);
  return value;
}

async function validateRoundSnapshotCapture(input: {
  experimentRoot: string;
  roundRef: string;
  snapshotName: 'authority-snapshots' | 'skill-snapshots';
  path: string;
}): Promise<void> {
  const path = snapshotPath(input.path, `${input.roundRef}/${input.snapshotName} binding`);
  const manifestPath = join(input.experimentRoot, input.roundRef, input.snapshotName, 'manifest.json');
  if (!await isFile(manifestPath)) throw new Error(`required ${input.roundRef}/${input.snapshotName}/manifest.json is missing`);
  const manifest = parseJson(await readFile(manifestPath, 'utf8'), `${input.roundRef}/${input.snapshotName}/manifest.json`);
  if (!Array.isArray(manifest.entries)) throw new Error(`${input.roundRef}/${input.snapshotName}/manifest.json must declare entries`);
  const entry = manifest.entries.find(value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    return (input.snapshotName === 'authority-snapshots' ? record.path : record.canonicalPath) === path;
  });
  if (entry === undefined || typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    throw new Error(`required ${input.roundRef}/${input.snapshotName} manifest entry is missing: ${path}`);
  }
  const declaredSha256 = (entry as Record<string, unknown>).sha256;
  if (typeof declaredSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(declaredSha256)) {
    throw new Error(`invalid ${input.roundRef}/${input.snapshotName} manifest hash: ${path}`);
  }
  const bytesPath = join(input.experimentRoot, input.roundRef, input.snapshotName, path);
  if (!await isFile(bytesPath)) throw new Error(`required ${input.roundRef}/${input.snapshotName} snapshot is missing: ${path}`);
  if (sha256Hex(await readFile(bytesPath)) !== declaredSha256) {
    throw new Error(`${input.roundRef}/${input.snapshotName} snapshot hash mismatch: ${path}`);
  }
}

async function snapshotRefs(input: {
  evidence: Map<string, DurableEvidenceObjectInput>;
  experimentRoot: string;
  roundRef: string;
  invocation: Record<string, unknown>;
  problemPackage: Record<string, unknown> | null;
  snapshotName: 'authority-snapshots' | 'skill-snapshots';
}): Promise<{ logicalNames: string[]; manifestLogicalName: string | null }> {
  const { evidence, experimentRoot, roundRef, invocation, problemPackage, snapshotName } = input;
  const values = snapshotName === 'authority-snapshots'
    ? (Array.isArray(invocation.authorityRefs) ? invocation.authorityRefs : problemPackage?.authorityRefs)
    : (Array.isArray(invocation.skillAssignments) ? invocation.skillAssignments : []);
  if (!Array.isArray(values)) return { logicalNames: [], manifestLogicalName: null };
  if (values.length === 0) return { logicalNames: [], manifestLogicalName: null };
  const manifestLogicalName = logicalNameForSourceRef(evidence, `${roundRef}/${snapshotName}/manifest.json`);
  if (manifestLogicalName === null) throw new Error(`required ${roundRef}/${snapshotName}/manifest.json evidence is missing or undeclared`);
  const logicalNames: string[] = [];
  for (const value of values) {
    const ref = typeof value === 'string'
      ? value
      : typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (snapshotName === 'authority-snapshots' ? (value as Record<string, unknown>).path : (value as Record<string, unknown>).canonicalPath)
        : null;
    if (typeof ref !== 'string' || ref.length === 0) throw new Error(`${snapshotName} binding must contain a path`);
    const path = ref.split(':')[0]!;
    await validateRoundSnapshotCapture({ experimentRoot, roundRef, snapshotName, path });
    const logical = logicalNameForSourceRef(evidence, `${snapshotName}/${path}`);
    if (logical === null) throw new Error(`required ${snapshotName} evidence is missing or undeclared: ${path}`);
    logicalNames.push(logical);
  }
  return { logicalNames, manifestLogicalName };
}

function invocationRefFor(invocation: Record<string, unknown>, role: DurableParticipantRole, label: string): string {
  const value = role === 'hypothesis' ? invocation.hypothesisInvocationRef : invocation.invocationRef;
  return requireString(value, `${label}.${role === 'hypothesis' ? 'hypothesisInvocationRef' : 'invocationRef'}`);
}

function roleRoots(experimentRoot: string): Promise<InvocationRoot[]> {
  return (async () => {
    const roots: InvocationRoot[] = [];
    for (const round of [1, 2] as const) {
      const roundRef = `round-${round}`;
      for (const runRef of await childDirectories(join(experimentRoot, roundRef, 'feedback-runs'))) {
        roots.push({ rootRef: `${roundRef}/feedback-runs/${runRef}`, role: 'feedback', round, continuationRef: null, structuredFile: 'feedback.json', rawOutputFiles: ['raw-participant-response.txt', 'raw-provider-response.txt'] });
      }
      for (const runRef of await childDirectories(join(experimentRoot, roundRef, 'hypothesis-runs'))) {
        roots.push({ rootRef: `${roundRef}/hypothesis-runs/${runRef}`, role: 'hypothesis', round, continuationRef: null, structuredFile: 'hypotheses.json', rawOutputFiles: ['raw-participant-response.txt', 'raw-provider-response.txt'] });
      }
      const continuationRef = 'review-continuation-000001';
      roots.push({ rootRef: `${roundRef}/solution-agent`, role: 'solution', round, continuationRef: null, structuredFile: 'result.json', rawOutputFiles: ['raw-output.txt'] });
      roots.push({ rootRef: `${roundRef}/reviewer-agent`, role: 'reviewer', round, continuationRef: null, structuredFile: 'review.json', rawOutputFiles: ['raw-output.txt'] });
      roots.push({ rootRef: `${roundRef}/${continuationRef}/solution-revision`, role: 'solution', round, continuationRef, structuredFile: 'result.json', rawOutputFiles: ['raw-output.txt'] });
      roots.push({ rootRef: `${roundRef}/${continuationRef}/reviewer-agent`, role: 'reviewer', round, continuationRef, structuredFile: 'review.json', rawOutputFiles: ['raw-output.txt'] });
    }
    roots.push({ rootRef: 'configuration-execution', role: 'configuration-execution', round: 1, continuationRef: null, structuredFile: 'result.json', rawOutputFiles: ['raw-output.txt'] });
    return roots;
  })();
}

export async function buildParticipantInvocationReceiptInputs(input: {
  experimentRoot: string;
  evidence: DurableEvidenceObjectInput[];
}): Promise<DurableParticipantInvocationReceiptInput[]> {
  const evidenceBySourceRef = new Map(input.evidence.map(object => [object.sourceRef, object] as const));
  const receipts: DurableParticipantInvocationReceiptInput[] = [];
  for (const root of await roleRoots(input.experimentRoot)) {
    const invocationPath = join(input.experimentRoot, root.rootRef, 'invocation.json');
    if (!await isFile(invocationPath)) continue;
    const invocation = parseJson(await readFile(invocationPath, 'utf8'), `${root.rootRef}/invocation.json`);
    const invocationRef = invocationRefFor(invocation, root.role, `${root.rootRef}/invocation.json`);
    const status = invocation.status;
    if (status !== 'completed' && status !== 'failed') throw new Error(`${root.rootRef}/invocation.json.status is invalid`);
    const structuredExists = await isFile(join(input.experimentRoot, root.rootRef, root.structuredFile));
    const failureExists = await isFile(join(input.experimentRoot, root.rootRef, 'failure.json'));
    if (status === 'completed' && !structuredExists) throw new Error(`${root.rootRef} completed invocation is missing ${root.structuredFile}`);
    if (status === 'failed' && !failureExists) throw new Error(`${root.rootRef} failed invocation is missing failure.json`);
    const rawOutputLogicalName = root.rawOutputFiles
      .map(file => logicalNameFor(evidenceBySourceRef, root.rootRef, file, false, 'raw output'))
      .find((value): value is string => value !== null) ?? null;
    const structuredResultLogicalName = structuredExists
      ? logicalNameFor(evidenceBySourceRef, root.rootRef, root.structuredFile, true, 'structured result')
      : null;
    const failureLogicalName = failureExists
      ? logicalNameFor(evidenceBySourceRef, root.rootRef, 'failure.json', true, 'failure')
      : null;
    const roundRef = `round-${root.round}`;
    const problemPackageObject = root.role === 'feedback' || root.role === 'hypothesis'
      ? undefined
      : evidenceBySourceRef.get(`${roundRef}/problem-package.json`);
    if (root.role !== 'feedback' && root.role !== 'hypothesis' && problemPackageObject === undefined) {
      throw new Error(`required Problem Package is missing: ${roundRef}/problem-package.json`);
    }
    const problemPackage = problemPackageObject === undefined
      ? null
      : parseJson(await readFile(problemPackageObject.sourcePath, 'utf8'), `${roundRef}/problem-package.json`);
    const visibleEvidenceLogicalNames = root.role === 'feedback'
      ? [logicalNameFor(evidenceBySourceRef, root.rootRef, 'observable-payload.json', true, 'observable payload')!]
      : root.role === 'hypothesis'
        ? [
          logicalNameFor(evidenceBySourceRef, root.rootRef, 'source-observable-payload.json', true, 'source observable payload')!,
          logicalNameFor(evidenceBySourceRef, root.rootRef, 'source-feedback.json', true, 'source feedback')!,
          logicalNameFor(evidenceBySourceRef, root.rootRef, 'source-pattern-evidence.json', false, 'optional pattern evidence'),
        ].filter((value): value is string => value !== null)
        : collectArtifactRefs(evidenceBySourceRef, roundRef, problemPackage!);
    const skillSnapshots = await snapshotRefs({ evidence: evidenceBySourceRef, experimentRoot: input.experimentRoot, roundRef, invocation, problemPackage, snapshotName: 'skill-snapshots' });
    const authoritySnapshots = await snapshotRefs({ evidence: evidenceBySourceRef, experimentRoot: input.experimentRoot, roundRef, invocation, problemPackage, snapshotName: 'authority-snapshots' });
    receipts.push({
      invocationRef,
      role: root.role,
      round: root.round,
      continuationRef: root.continuationRef,
      promptLogicalName: logicalNameFor(evidenceBySourceRef, root.rootRef, 'participant-prompt.txt', true, 'rendered prompt')!,
      bindingLogicalName: logicalNameFor(evidenceBySourceRef, root.rootRef, 'participant-binding.json', true, 'participant binding')!,
      invocationLogicalName: logicalNameFor(evidenceBySourceRef, root.rootRef, 'invocation.json', true, 'invocation')!,
      rawOutputLogicalName,
      stderrLogicalName: logicalNameFor(evidenceBySourceRef, root.rootRef, 'stderr.txt', false, 'stderr'),
      executionTraceLogicalName: logicalNameFor(evidenceBySourceRef, root.rootRef, root.role === 'feedback' || root.role === 'hypothesis' ? 'participant-execution-trace.json' : 'execution-trace.json', true, 'execution trace')!,
      structuredResultLogicalName,
      failureLogicalName,
      visibleEvidenceLogicalNames,
      skillLogicalNames: skillSnapshots.logicalNames,
      authorityLogicalNames: authoritySnapshots.logicalNames,
      skillSnapshotManifestLogicalName: skillSnapshots.manifestLogicalName,
      authoritySnapshotManifestLogicalName: authoritySnapshots.manifestLogicalName,
    });
  }
  return receipts.sort((left, right) => left.round - right.round || (left.continuationRef ?? '').localeCompare(right.continuationRef ?? '') || left.role.localeCompare(right.role) || left.invocationRef.localeCompare(right.invocationRef));
}
