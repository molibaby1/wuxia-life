import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  parseStoredImprovementHypothesisSet,
  validateImprovementHypothesisReferences,
  type ImprovementHypothesis,
} from '../../../src/evolution/improvementHypothesisContract';
import {
  validateExperiencePatternEvidence,
  type ExperiencePatternEvidence,
} from '../../../src/evolution/experiencePatternEvidenceContract';
import {
  loadExternalFeedbackSource,
  type ExternalFeedbackSource,
} from '../improvementHypothesis/loadExternalFeedbackSource';
import {
  canonicalJson,
  resolvePhase0RunPath,
  sha256Hex,
  validatePhase0RunRef,
} from '../phase0/provenance';

const LEGACY_HYPOTHESIS_INVOCATION_SCHEMA_VERSION =
  'improvement-hypothesis-invocation-v1' as const;
const PATTERN_HYPOTHESIS_INVOCATION_SCHEMA_VERSION =
  'improvement-hypothesis-invocation-v2' as const;
const HYPOTHESIS_ID_PATTERN = /^hypothesis-\d{6}$/;

export interface HypothesisInvestigationSource {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  hypothesesHash: string;
  selectedHypothesisHash: string;
  selectedHypothesis: ImprovementHypothesis;
  sourceHypothesesBytes: string;
  sourceHypothesisInvocationBytes: string;
  patternEvidence?: ExperiencePatternEvidence;
  patternEvidenceBytes?: string;
  patternEvidenceHash?: string;
  mefSource: ExternalFeedbackSource;
  gameRunPath: string;
}

interface HypothesisInvocationRecord {
  schemaVersion:
    | typeof LEGACY_HYPOTHESIS_INVOCATION_SCHEMA_VERSION
    | typeof PATTERN_HYPOTHESIS_INVOCATION_SCHEMA_VERSION;
  runRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
  status: 'completed' | 'failed';
}

async function loadOptionalPatternEvidence(input: {
  hypothesisDir: string;
  invocation: HypothesisInvocationRecord;
}): Promise<{
  patternEvidence: ExperiencePatternEvidence;
  patternEvidenceBytes: string;
  patternEvidenceHash: string;
} | undefined> {
  let patternEvidenceBytes: string;
  try {
    patternEvidenceBytes = await readFile(
      join(input.hypothesisDir, 'source-pattern-evidence.json'),
      'utf8',
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      if (input.invocation.patternEvidenceHash !== undefined) {
        throw new Error('patternEvidenceHash is present but source-pattern-evidence.json is missing');
      }
      return undefined;
    }
    throw error;
  }

  if (input.invocation.patternEvidenceHash === undefined) {
    throw new Error('source-pattern-evidence.json exists without patternEvidenceHash');
  }
  if (!/^[a-f0-9]{64}$/.test(input.invocation.patternEvidenceHash)) {
    throw new Error('hypothesis source invocation.patternEvidenceHash must be a SHA-256 hex string');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(patternEvidenceBytes);
  } catch {
    throw new Error('source pattern evidence must be valid JSON');
  }
  const patternEvidence = validateExperiencePatternEvidence(parsed);
  const { patternEvidenceHash: declaredArtifactHash, ...patternEvidencePayload } = patternEvidence;
  const patternEvidenceHash = declaredArtifactHash === undefined
    ? sha256Hex(patternEvidenceBytes)
    : sha256Hex(canonicalJson(patternEvidencePayload));
  if (
    declaredArtifactHash !== undefined
    && declaredArtifactHash !== patternEvidenceHash
  ) {
    throw new Error(
      `source patternEvidenceHash mismatch: expected ${declaredArtifactHash}, got ${patternEvidenceHash}`,
    );
  }
  if (patternEvidenceHash !== input.invocation.patternEvidenceHash) {
    throw new Error(
      `patternEvidenceHash mismatch: expected ${input.invocation.patternEvidenceHash}, got ${patternEvidenceHash}`,
    );
  }
  return {
    patternEvidence,
    patternEvidenceBytes,
    patternEvidenceHash,
  };
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function validateHypothesisId(hypothesisId: string): string {
  if (!HYPOTHESIS_ID_PATTERN.test(hypothesisId)) {
    throw new Error(`invalid hypothesisId: ${hypothesisId}`);
  }
  return hypothesisId;
}

function parseHypothesisInvocation(value: unknown): HypothesisInvocationRecord {
  assertObject(value, 'hypothesis source invocation');
  assertNonEmptyString(value.schemaVersion, 'hypothesis source invocation.schemaVersion');
  if (
    value.schemaVersion !== LEGACY_HYPOTHESIS_INVOCATION_SCHEMA_VERSION
    && value.schemaVersion !== PATTERN_HYPOTHESIS_INVOCATION_SCHEMA_VERSION
  ) {
    throw new Error(
      `unsupported hypothesis source invocation.schemaVersion: ${String(value.schemaVersion)}`,
    );
  }
  assertNonEmptyString(value.runRef, 'hypothesis source invocation.runRef');
  assertNonEmptyString(
    value.feedbackInvocationRef,
    'hypothesis source invocation.feedbackInvocationRef',
  );
  assertNonEmptyString(
    value.hypothesisInvocationRef,
    'hypothesis source invocation.hypothesisInvocationRef',
  );
  assertNonEmptyString(
    value.experimentRootHash,
    'hypothesis source invocation.experimentRootHash',
  );
  assertNonEmptyString(
    value.observablePayloadHash,
    'hypothesis source invocation.observablePayloadHash',
  );
  assertNonEmptyString(value.feedbackHash, 'hypothesis source invocation.feedbackHash');
  if (value.status !== 'completed' && value.status !== 'failed') {
    throw new Error('hypothesis source invocation.status must be completed or failed');
  }
  if (value.patternEvidenceHash !== undefined) {
    if (value.schemaVersion === LEGACY_HYPOTHESIS_INVOCATION_SCHEMA_VERSION) {
      throw new Error('improvement-hypothesis-invocation-v1 cannot contain patternEvidenceHash');
    }
    assertNonEmptyString(
      value.patternEvidenceHash,
      'hypothesis source invocation.patternEvidenceHash',
    );
    if (!/^[a-f0-9]{64}$/.test(value.patternEvidenceHash)) {
      throw new Error('hypothesis source invocation.patternEvidenceHash must be a SHA-256 hex string');
    }
  } else if (value.schemaVersion === PATTERN_HYPOTHESIS_INVOCATION_SCHEMA_VERSION) {
    throw new Error('improvement-hypothesis-invocation-v2 requires patternEvidenceHash');
  }
  return {
    schemaVersion: value.schemaVersion,
    runRef: value.runRef,
    feedbackInvocationRef: value.feedbackInvocationRef,
    hypothesisInvocationRef: value.hypothesisInvocationRef,
    experimentRootHash: value.experimentRootHash,
    observablePayloadHash: value.observablePayloadHash,
    feedbackHash: value.feedbackHash,
    ...(value.patternEvidenceHash !== undefined
      ? { patternEvidenceHash: value.patternEvidenceHash }
      : {}),
    status: value.status,
  };
}

export async function loadHypothesisInvestigationSource(input: {
  mefSourceRoot: string;
  hypothesisSourceRoot: string;
  runRef: string;
  hypothesisId: string;
}): Promise<HypothesisInvestigationSource> {
  const runRef = validatePhase0RunRef(input.runRef);
  const hypothesisId = validateHypothesisId(input.hypothesisId);

  const mefSource = await loadExternalFeedbackSource({
    sourceRoot: resolve(input.mefSourceRoot),
    runRef,
  });

  const hypothesisDir = resolvePhase0RunPath(
    join(resolve(input.hypothesisSourceRoot), 'hypothesis-runs'),
    runRef,
  );
  const sourceHypothesesBytes = await readFile(join(hypothesisDir, 'hypotheses.json'), 'utf8');
  const sourceHypothesisInvocationBytes = await readFile(
    join(hypothesisDir, 'invocation.json'),
    'utf8',
  );
  const invocation = parseHypothesisInvocation(JSON.parse(sourceHypothesisInvocationBytes));
  const patternSource = await loadOptionalPatternEvidence({ hypothesisDir, invocation });

  if (invocation.runRef !== runRef) {
    throw new Error(
      `hypothesis invocation.runRef mismatch: expected ${runRef}, got ${invocation.runRef}`,
    );
  }
  if (invocation.status !== 'completed') {
    throw new Error(
      `hypothesis invocation status must be completed, got ${invocation.status}`,
    );
  }
  if (invocation.feedbackInvocationRef !== mefSource.feedbackInvocationRef) {
    throw new Error(
      `feedbackInvocationRef mismatch: expected ${mefSource.feedbackInvocationRef}, got ${invocation.feedbackInvocationRef}`,
    );
  }
  if (invocation.experimentRootHash !== mefSource.experimentRootHash) {
    throw new Error(
      `experimentRootHash mismatch: expected ${mefSource.experimentRootHash}, got ${invocation.experimentRootHash}`,
    );
  }
  if (invocation.observablePayloadHash !== mefSource.observablePayloadHash) {
    throw new Error(
      `observablePayloadHash mismatch: expected ${mefSource.observablePayloadHash}, got ${invocation.observablePayloadHash}`,
    );
  }
  if (invocation.feedbackHash !== mefSource.feedbackHash) {
    throw new Error(
      `feedbackHash mismatch: expected ${mefSource.feedbackHash}, got ${invocation.feedbackHash}`,
    );
  }

  const parsed = parseStoredImprovementHypothesisSet(sourceHypothesesBytes);

  validateImprovementHypothesisReferences(
    parsed,
    mefSource.feedback,
    mefSource.observablePayload,
    patternSource?.patternEvidence,
  );

  const selectedHypothesis = parsed.hypotheses.find(
    item => item.hypothesisId === hypothesisId,
  );
  if (!selectedHypothesis) {
    throw new Error(`unknown hypothesisId: ${hypothesisId}`);
  }

  const gameRunPath = resolvePhase0RunPath(
    join(resolve(input.mefSourceRoot), 'game-runs'),
    runRef,
  );

  return {
    runRef,
    hypothesisId,
    feedbackInvocationRef: mefSource.feedbackInvocationRef,
    hypothesisInvocationRef: invocation.hypothesisInvocationRef,
    experimentRootHash: mefSource.experimentRootHash,
    observablePayloadHash: mefSource.observablePayloadHash,
    feedbackHash: mefSource.feedbackHash,
    hypothesesHash: sha256Hex(sourceHypothesesBytes),
    selectedHypothesisHash: sha256Hex(canonicalJson(selectedHypothesis)),
    selectedHypothesis,
    sourceHypothesesBytes,
    sourceHypothesisInvocationBytes,
    ...(patternSource !== undefined ? patternSource : {}),
    mefSource,
    gameRunPath,
  };
}
