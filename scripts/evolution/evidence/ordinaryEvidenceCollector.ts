import { lstat, readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  PHASE0_REQUIRED_SEALED_ARTIFACTS,
  sha256Hex,
  validatePhase0RunRef,
  validatePhase0RunSeal,
} from '../phase0/provenance';
import type {
  DurableEvidenceObjectInput,
  DurableEvidenceVisibility,
} from './durableEvidenceCapsule';

const WORKFLOW_ROOT_FILES = [
  'run-manifest.json',
  'decision.json',
  'workflow-outcome.json',
  'problem-package.json',
  'human-review-package.md',
  'workspace-state-provenance.json',
] as const;

const ROUND_ROOT_FILES = [
  'selection/selected-hypothesis.json',
  'diagnostic/causal-attribution.json',
  'problem-package.json',
  'decision.json',
  'workflow-outcome.json',
] as const;

const FEEDBACK_FILES = [
  'observable-payload.json',
  'participant-prompt.txt',
  'participant-binding.json',
  'participant-execution-trace.json',
  'raw-provider-response.txt',
  'raw-participant-response.txt',
  'stderr.txt',
  'invocation.json',
  'feedback.json',
  'failure.json',
] as const;

const HYPOTHESIS_FILES = [
  'source-observable-payload.json',
  'source-feedback.json',
  'source-feedback-raw-participant-response.txt',
  'source-pattern-evidence.json',
  'participant-prompt.txt',
  'participant-binding.json',
  'participant-execution-trace.json',
  'raw-provider-response.txt',
  'raw-participant-response.txt',
  'stderr.txt',
  'invocation.json',
  'hypotheses.json',
  'failure.json',
] as const;

const SOLUTION_FILES = [
  'participant-prompt.txt',
  'participant-binding.json',
  'invocation.json',
  'execution-trace.json',
  'raw-output.txt',
  'stderr.txt',
  'result.json',
  'failure.json',
] as const;

const REVIEWER_FILES = [
  'participant-prompt.txt',
  'participant-binding.json',
  'invocation.json',
  'execution-trace.json',
  'raw-output.txt',
  'stderr.txt',
  'review.json',
  'failure.json',
] as const;

const CONTINUATION_ROOT_FILES = [
  'continuation.json',
  'revision-request.json',
  'decision.json',
] as const;

const CONFIG_EXECUTION_FILES = [
  'participant-prompt.txt',
  'participant-binding.json',
  'execution-trace.json',
  'raw-output.txt',
  'stderr.txt',
  'result.json',
  'failure.json',
] as const;

export interface CollectOrdinaryEvidenceInput {
  repositoryRoot: string;
  sessionRoot: string;
  experimentRoot: string;
  sessionId: string;
  sourceRunRefs: string[];
  configurationExecution?: boolean;
}

function visibilityFor(relativePath: string): DurableEvidenceVisibility {
  if (
    /(?:^|\/)reviewer-input\/observable-payload\.json$/.test(relativePath)
    || /(?:^|\/)source\/observable-payload\.json$/.test(relativePath)
    || /(?:^|\/)feedback-runs\/[^/]+\/observable-payload\.json$/.test(relativePath)
    || /(?:^|\/)hypothesis-runs\/[^/]+\/(?:source-)?observable-payload\.json$/.test(relativePath)
    || /(?:^|\/)hypothesis-runs\/[^/]+\/feedback\.json$/.test(relativePath)
    || /(?:^|\/)problem-package\.json$/.test(relativePath)
    || /(?:^|\/)(?:causal-attribution\/bounded-causal-attribution|diagnostic\/causal-attribution)\.json$/.test(relativePath)
  ) return 'PARTICIPANT_VISIBLE';
  return 'HUMAN_FORENSIC_ONLY';
}

function evidenceKindFor(relativePath: string): string {
  if (relativePath.endsWith('participant-prompt.txt')) return 'rendered_prompt';
  if (relativePath.endsWith('participant-binding.json')) return 'participant_binding';
  if (relativePath.endsWith('execution-trace.json') || relativePath.endsWith('participant-execution-trace.json')) return 'execution_trace';
  if (relativePath.endsWith('raw-output.txt') || relativePath.endsWith('raw-participant-response.txt') || relativePath.endsWith('raw-provider-response.txt')) return 'raw_observable_output';
  if (relativePath.endsWith('failure.json')) return 'participant_failure';
  if (/(?:^|\/)game-runs\//.test(relativePath)) return 'sealed_phase0_source';
  if (/(?:^|\/)configuration-execution\//.test(relativePath)) return 'configuration_execution';
  return 'workflow_artifact';
}

async function isRegularFile(path: string): Promise<boolean> {
  try {
    return (await lstat(path)).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function addDeclaredFile(input: {
  root: string;
  sourceRef: string;
  relativePath: string;
  evidence: DurableEvidenceObjectInput[];
  required?: boolean;
  visibility?: DurableEvidenceVisibility;
  evidenceKind?: string;
}): Promise<void> {
  const sourcePath = resolve(input.root, input.sourceRef);
  const escaped = relative(resolve(input.root), sourcePath);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`ordinary evidence source escapes root: ${input.sourceRef}`);
  }
  if (!await isRegularFile(sourcePath)) {
    if (input.required) throw new Error(`required ordinary evidence is missing: ${input.sourceRef}`);
    return;
  }
  input.evidence.push({
    logicalName: `session:${input.sourceRef}`,
    relativePath: input.relativePath,
    sourcePath,
    visibility: input.visibility ?? visibilityFor(input.sourceRef),
    evidenceKind: input.evidenceKind ?? evidenceKindFor(input.sourceRef),
    sourceRef: input.sourceRef,
  });
}

async function addFile(input: {
  sourcePath: string;
  relativePath: string;
  sourceRef: string;
  evidence: DurableEvidenceObjectInput[];
  visibility?: DurableEvidenceVisibility;
  evidenceKind?: string;
}): Promise<void> {
  if (!await isRegularFile(input.sourcePath)) return;
  input.evidence.push({
    logicalName: `session:${input.sourceRef}`,
    relativePath: input.relativePath,
    sourcePath: input.sourcePath,
    visibility: input.visibility ?? visibilityFor(input.sourceRef),
    evidenceKind: input.evidenceKind ?? evidenceKindFor(input.sourceRef),
    sourceRef: input.sourceRef,
  });
}

async function addSealedPhase0Source(input: {
  sourceRoot: string;
  sourceRunRef: string;
  destinationPrefix: string;
  evidence: DurableEvidenceObjectInput[];
}): Promise<void> {
  const sourceRoot = resolve(input.sourceRoot);
  const expectedHash = (await readFile(join(sourceRoot, 'experiment-root.sha256'), 'utf8')).trim();
  await validatePhase0RunSeal(sourceRoot, expectedHash);
  for (const relativePath of [...PHASE0_REQUIRED_SEALED_ARTIFACTS].sort()) {
    await addFile({
      sourcePath: join(sourceRoot, relativePath),
      relativePath: `${input.destinationPrefix}/${relativePath}`,
      sourceRef: `game-runs/${input.sourceRunRef}/${relativePath}`,
      evidence: input.evidence,
      visibility: relativePath === 'reviewer-input/observable-payload.json'
        ? 'PARTICIPANT_VISIBLE'
        : 'HUMAN_FORENSIC_ONLY',
      evidenceKind: 'sealed_phase0_source',
    });
  }
  await addFile({
    sourcePath: join(sourceRoot, 'experiment-root.json'),
    relativePath: `${input.destinationPrefix}/experiment-root.json`,
    sourceRef: `game-runs/${input.sourceRunRef}/experiment-root.json`,
    evidence: input.evidence,
    evidenceKind: 'sealed_phase0_manifest',
  });
  await addFile({
    sourcePath: join(sourceRoot, 'experiment-root.sha256'),
    relativePath: `${input.destinationPrefix}/experiment-root.sha256`,
    sourceRef: `game-runs/${input.sourceRunRef}/experiment-root.sha256`,
    evidence: input.evidence,
    evidenceKind: 'sealed_phase0_manifest_hash',
  });
}

async function addDeclaredFamily(input: {
  root: string;
  sourcePrefix: string;
  destinationPrefix: string;
  files: readonly string[];
  evidence: DurableEvidenceObjectInput[];
}): Promise<void> {
  for (const file of input.files) {
    const sourceRef = input.sourcePrefix ? `${input.sourcePrefix}/${file}` : file;
    await addDeclaredFile({
      root: input.root,
      sourceRef,
      relativePath: `${input.destinationPrefix}/${file}`,
      evidence: input.evidence,
    });
  }
}

async function directoryNames(path: string): Promise<string[]> {
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

function snapshotPath(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value) || value.includes('\\')) {
    throw new Error(`${label} must be a safe relative path`);
  }
  const segments = value.split('/');
  if (segments.some(segment => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error(`${label} must be a safe relative path`);
  }
  return value;
}

async function addDeclaredSnapshot(input: {
  root: string;
  roundRef: string;
  canonicalSources: Map<string, { sourcePath: string; sha256: string }>;
  snapshotName: 'authority-snapshots' | 'skill-snapshots';
  evidence: DurableEvidenceObjectInput[];
}): Promise<void> {
  const manifestSourceRef = `${input.snapshotName}/manifest.json`;
  const manifestPath = join(input.root, manifestSourceRef);
  if (!await isRegularFile(manifestPath)) return;
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  if (!Array.isArray(manifest.entries)) throw new Error(`${input.roundRef}/${manifestSourceRef} must declare entries`);
  const addCanonical = async (sourcePath: string, canonicalSourceRef: string, relativePath: string, declaredSha256: unknown, evidenceKind: string, deduplicate: boolean): Promise<void> => {
    if (!await isRegularFile(sourcePath)) throw new Error(`required ordinary evidence is missing: ${canonicalSourceRef}`);
    const bytes = await readFile(sourcePath);
    const sha256 = sha256Hex(bytes);
    if (declaredSha256 !== undefined && (typeof declaredSha256 !== 'string' || declaredSha256 !== sha256)) {
      throw new Error(`snapshot hash mismatch for ${canonicalSourceRef}`);
    }
    if (deduplicate) {
      const existing = input.canonicalSources.get(canonicalSourceRef);
      if (existing !== undefined) {
        if (existing.sha256 !== sha256) throw new Error(`conflicting round snapshot bytes for ${canonicalSourceRef}`);
        return;
      }
      input.canonicalSources.set(canonicalSourceRef, { sourcePath, sha256 });
    }
    input.evidence.push({
      logicalName: `session:${canonicalSourceRef}`,
      relativePath,
      sourcePath,
      visibility: 'HUMAN_FORENSIC_ONLY',
      evidenceKind,
      sourceRef: canonicalSourceRef,
    });
  };
  await addCanonical(
    manifestPath,
    `${input.roundRef}/${manifestSourceRef}`,
    `provenance/${input.roundRef}/${input.snapshotName}/manifest.json`,
    undefined,
    'provenance_snapshot_manifest',
    false,
  );
  for (const [index, rawEntry] of manifest.entries.entries()) {
    if (typeof rawEntry !== 'object' || rawEntry === null || Array.isArray(rawEntry)) {
      throw new Error(`${input.roundRef}/${manifestSourceRef}.entries[${index}] must be an object`);
    }
    const entry = rawEntry as Record<string, unknown>;
    const path = snapshotPath(
      input.snapshotName === 'authority-snapshots' ? entry.path : entry.canonicalPath,
      `${input.roundRef}/${manifestSourceRef}.entries[${index}].path`,
    );
    const declaredSha256 = entry.sha256;
    if (typeof declaredSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(declaredSha256)) {
      throw new Error(`${input.roundRef}/${manifestSourceRef}.entries[${index}].sha256 must be a lowercase SHA-256`);
    }
    await addCanonical(
      join(input.root, input.snapshotName, path),
      `${input.snapshotName}/${path}`,
      `provenance/${input.snapshotName}/${path}`,
      declaredSha256,
      input.snapshotName === 'authority-snapshots' ? 'authority_snapshot' : 'skill_snapshot',
      true,
    );
  }
}

async function addConfigurationEvidence(input: {
  experimentRoot: string;
  evidence: DurableEvidenceObjectInput[];
  occurred: boolean;
}): Promise<void> {
  const configurationRoot = join(input.experimentRoot, 'configuration-execution');
  if (!input.occurred && !await isRegularFile(join(configurationRoot, 'invocation.json'))
    && !await isRegularFile(join(configurationRoot, 'before-manifest.json'))
    && !await isRegularFile(join(configurationRoot, 'after-manifest.json'))) return;

  if (input.occurred) {
    for (const file of ['invocation.json', 'before-manifest.json', 'after-manifest.json'] as const) {
      await addDeclaredFile({
        root: input.experimentRoot,
        sourceRef: `configuration-execution/${file}`,
        relativePath: `extensions/configuration-execution/${file}`,
        evidence: input.evidence,
        required: true,
        evidenceKind: 'configuration_execution',
      });
    }
  }

  await addDeclaredFamily({
    root: input.experimentRoot,
    sourcePrefix: 'configuration-execution',
    destinationPrefix: 'extensions/configuration-execution',
    files: CONFIG_EXECUTION_FILES,
    evidence: input.evidence,
  });
  for (const phase of ['before', 'after'] as const) {
    const manifestPath = join(configurationRoot, `${phase}-manifest.json`);
    if (!await isRegularFile(manifestPath)) continue;
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
    if (manifest.entries === undefined) {
      if (input.occurred) throw new Error(`configuration-execution/${phase}-manifest.json must declare entries`);
      continue;
    }
    if (!Array.isArray(manifest.entries)) throw new Error(`configuration-execution/${phase}-manifest.json must declare entries`);
    for (const [index, rawEntry] of manifest.entries.entries()) {
      if (typeof rawEntry !== 'object' || rawEntry === null || Array.isArray(rawEntry)) {
        throw new Error(`configuration-execution/${phase}-manifest.json.entries[${index}] must be an object`);
      }
      const entry = rawEntry as Record<string, unknown>;
      const path = snapshotPath(entry.path, `configuration-execution/${phase}-manifest.json.entries[${index}].path`);
      if (entry.status !== 'present') continue;
      if (typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(entry.sha256)) {
        throw new Error(`configuration-execution/${phase}-manifest.json.entries[${index}].sha256 must be a lowercase SHA-256`);
      }
      if (!Number.isSafeInteger(entry.byteLength) || (entry.byteLength as number) < 0) {
        throw new Error(`configuration-execution/${phase}-manifest.json.entries[${index}].byteLength must be a non-negative integer`);
      }
      await addDeclaredFile({
        root: input.experimentRoot,
        sourceRef: `configuration-execution/${phase}/${path}`,
        relativePath: `extensions/configuration-execution/${phase}/${path}`,
        evidence: input.evidence,
        required: true,
        evidenceKind: 'configuration_bounded_file',
      });
      const bytes = await readFile(join(input.experimentRoot, 'configuration-execution', phase, path));
      if (sha256Hex(bytes) !== entry.sha256 || bytes.byteLength !== entry.byteLength) {
        throw new Error(`configuration-execution/${phase}-manifest.json entry metadata does not match bytes: ${path}`);
      }
    }
  }
}

export async function collectOrdinaryEvidence(
  input: CollectOrdinaryEvidenceInput,
): Promise<DurableEvidenceObjectInput[]> {
  const evidence: DurableEvidenceObjectInput[] = [];
  const sessionId = validatePhase0RunRef(input.sessionId);
  const sessionRoot = resolve(input.sessionRoot);
  const experimentRoot = resolve(input.experimentRoot);
  const sourceRunRefs = [...new Set(input.sourceRunRefs.map(validatePhase0RunRef))].sort();

  for (const sourceRunRef of sourceRunRefs) {
    const candidates = [
      join(sessionRoot, 'game-runs', sourceRunRef),
      join(experimentRoot, 'game-runs', sourceRunRef),
    ];
    let sourceRoot: string | undefined;
    for (const candidate of candidates) {
      if (await isRegularFile(join(candidate, 'experiment-root.sha256'))) {
        sourceRoot = candidate;
        break;
      }
    }
    if (!sourceRoot) throw new Error(`sealed Phase 0 source is missing for ${sourceRunRef}`);
    await addSealedPhase0Source({
      sourceRoot,
      sourceRunRef,
      destinationPrefix: `source/${sourceRunRef}`,
      evidence,
    });
  }

  await addFile({
    sourcePath: join(sessionRoot, 'phase0-anchors', `${sessionId}.json`),
    relativePath: `session/phase0-anchor.json`,
    sourceRef: `phase0-anchors/${sessionId}.json`,
    evidence,
    evidenceKind: 'session_anchor',
  });
  await addDeclaredFamily({
    root: experimentRoot,
    sourcePrefix: '',
    destinationPrefix: 'workflow',
    files: WORKFLOW_ROOT_FILES,
    evidence,
  });
  await addDeclaredFamily({
    root: experimentRoot,
    sourcePrefix: 'source',
    destinationPrefix: 'workflow/source',
    files: ['observable-payload.json'],
    evidence,
  });

  for (const roundName of ['round-1', 'round-2'] as const) {
    const roundRoot = join(experimentRoot, roundName);
    if (!await isRegularFile(join(roundRoot, 'workflow-outcome.json'))
      && (await directoryNames(roundRoot)).length === 0) continue;
    await addDeclaredFamily({
      root: experimentRoot,
      sourcePrefix: roundName,
      destinationPrefix: `workflow/${roundName}`,
      files: ROUND_ROOT_FILES,
      evidence,
    });
    await addDeclaredFamily({
      root: experimentRoot,
      sourcePrefix: roundName,
      destinationPrefix: `workflow/${roundName}`,
      files: ['source/observable-payload.json'],
      evidence,
    });
    for (const runRef of await directoryNames(join(roundRoot, 'feedback-runs'))) {
      validatePhase0RunRef(runRef);
      await addDeclaredFamily({
        root: experimentRoot,
        sourcePrefix: `${roundName}/feedback-runs/${runRef}`,
        destinationPrefix: `workflow/${roundName}/feedback-runs/${runRef}`,
        files: FEEDBACK_FILES,
        evidence,
      });
    }
    for (const runRef of await directoryNames(join(roundRoot, 'hypothesis-runs'))) {
      validatePhase0RunRef(runRef);
      await addDeclaredFamily({
        root: experimentRoot,
        sourcePrefix: `${roundName}/hypothesis-runs/${runRef}`,
        destinationPrefix: `workflow/${roundName}/hypothesis-runs/${runRef}`,
        files: HYPOTHESIS_FILES,
        evidence,
      });
    }
    for (const role of [
      ['solution-agent', SOLUTION_FILES],
      ['reviewer-agent', REVIEWER_FILES],
    ] as const) {
      await addDeclaredFamily({
        root: experimentRoot,
        sourcePrefix: `${roundName}/${role[0]}`,
        destinationPrefix: `workflow/${roundName}/${role[0]}`,
        files: role[1],
        evidence,
      });
    }
    const continuationRoot = `${roundName}/review-continuation-000001`;
    await addDeclaredFamily({
      root: experimentRoot,
      sourcePrefix: continuationRoot,
      destinationPrefix: `workflow/${continuationRoot}`,
      files: CONTINUATION_ROOT_FILES,
      evidence,
    });
    await addDeclaredFamily({
      root: experimentRoot,
      sourcePrefix: `${continuationRoot}/solution-revision`,
      destinationPrefix: `workflow/${continuationRoot}/solution-revision`,
      files: SOLUTION_FILES,
      evidence,
    });
    await addDeclaredFamily({
      root: experimentRoot,
      sourcePrefix: `${continuationRoot}/reviewer-agent`,
      destinationPrefix: `workflow/${continuationRoot}/reviewer-agent`,
      files: REVIEWER_FILES,
      evidence,
    });
  }
  await addConfigurationEvidence({ experimentRoot, evidence, occurred: input.configurationExecution === true });
  const canonicalSnapshotSources = new Map<string, { sourcePath: string; sha256: string }>();
  for (const roundName of ['round-1', 'round-2'] as const) {
    const roundRoot = join(experimentRoot, roundName);
    await addDeclaredSnapshot({ root: roundRoot, roundRef: roundName, snapshotName: 'authority-snapshots', evidence, canonicalSources: canonicalSnapshotSources });
    await addDeclaredSnapshot({ root: roundRoot, roundRef: roundName, snapshotName: 'skill-snapshots', evidence, canonicalSources: canonicalSnapshotSources });
  }
  return evidence;
}
