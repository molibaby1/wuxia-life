import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  parseImprovementHypothesisSet,
  validateImprovementHypothesisReferences,
  type ImprovementHypothesis,
} from '../../../src/evolution/improvementHypothesisContract';
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

const HYPOTHESIS_INVOCATION_SCHEMA_VERSION = 'improvement-hypothesis-invocation-v1' as const;
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
  mefSource: ExternalFeedbackSource;
  gameRunPath: string;
}

interface HypothesisInvocationRecord {
  schemaVersion: typeof HYPOTHESIS_INVOCATION_SCHEMA_VERSION;
  runRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  status: 'completed' | 'failed';
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
  if (value.schemaVersion !== HYPOTHESIS_INVOCATION_SCHEMA_VERSION) {
    throw new Error(
      `hypothesis source invocation.schemaVersion must be ${HYPOTHESIS_INVOCATION_SCHEMA_VERSION}`,
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
  return {
    schemaVersion: HYPOTHESIS_INVOCATION_SCHEMA_VERSION,
    runRef: value.runRef,
    feedbackInvocationRef: value.feedbackInvocationRef,
    hypothesisInvocationRef: value.hypothesisInvocationRef,
    experimentRootHash: value.experimentRootHash,
    observablePayloadHash: value.observablePayloadHash,
    feedbackHash: value.feedbackHash,
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

  // parseImprovementHypothesisSet expects draft shape without hypothesisId.
  // Stored hypotheses.json includes system-assigned IDs; strip them for re-parse,
  // then re-attach and verify IDs match stored values.
  const stored = JSON.parse(sourceHypothesesBytes) as {
    hypotheses: Array<Record<string, unknown>>;
  };
  if (!Array.isArray(stored.hypotheses)) {
    throw new Error('hypotheses.json hypotheses must be an array');
  }
  const draftPayload = {
    hypotheses: stored.hypotheses.map(item => {
      const {
        hypothesisId: _ignored,
        ...draft
      } = item;
      return draft;
    }),
  };
  const parsed = parseImprovementHypothesisSet(JSON.stringify(draftPayload));
  for (const [index, hypothesis] of parsed.hypotheses.entries()) {
    const storedId = stored.hypotheses[index]?.hypothesisId;
    if (typeof storedId === 'string' && storedId !== hypothesis.hypothesisId) {
      throw new Error(
        `hypotheses[${index}].hypothesisId mismatch: stored ${storedId}, expected ${hypothesis.hypothesisId}`,
      );
    }
  }

  validateImprovementHypothesisReferences(
    parsed,
    mefSource.feedback,
    mefSource.observablePayload,
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
    mefSource,
    gameRunPath,
  };
}
