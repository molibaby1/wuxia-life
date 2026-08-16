import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  parseHypothesisInvestigationResult,
  validateHypothesisInvestigationReferences,
  type HypothesisInvestigationResult,
} from '../../../src/evolution/hypothesisInvestigationContract';
import {
  projectInvestigationHandoff,
  type InvestigationHandoff,
} from '../../../src/evolution/investigationHandoff';
import type { ImprovementHypothesis } from '../../../src/evolution/improvementHypothesisContract';
import {
  investigationEvidenceRefs,
  type InvestigationEvidencePack,
} from '../hypothesisInvestigation/buildInvestigationEvidence';
import {
  canonicalJson,
  resolvePhase0RunPath,
  sha256Hex,
  validatePhase0RunRef,
} from '../phase0/provenance';

const INVESTIGATION_INVOCATION_SCHEMA_VERSION = 'hypothesis-investigation-invocation-v1' as const;
const EVIDENCE_PACK_SCHEMA_VERSION = 'hypothesis-investigation-evidence-v1' as const;
const HYPOTHESIS_ID_PATTERN = /^hypothesis-\d{6}$/;

export interface ModificationWorkSource {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  hypothesesHash: string;
  selectedHypothesisHash: string;
  evidencePackHash: string;
  investigationHash: string;
  status: 'completed';
  selectedHypothesis: ImprovementHypothesis;
  investigation: HypothesisInvestigationResult;
  evidencePack: InvestigationEvidencePack;
  allowedEvidenceRefs: ReadonlySet<string>;
  allowedScopeRefs: ReadonlySet<string>;
  sourceInvestigationBytes: string;
  sourceInvestigationInvocationBytes: string;
  sourceEvidencePackBytes: string;
}

interface InvestigationInvocationRecord {
  schemaVersion: typeof INVESTIGATION_INVOCATION_SCHEMA_VERSION;
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  hypothesesHash: string;
  selectedHypothesisHash: string;
  evidencePackHash: string;
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

function parseInvestigationInvocation(value: unknown): InvestigationInvocationRecord {
  assertObject(value, 'investigation source invocation');
  assertNonEmptyString(value.schemaVersion, 'investigation source invocation.schemaVersion');
  if (value.schemaVersion !== INVESTIGATION_INVOCATION_SCHEMA_VERSION) {
    throw new Error(
      `investigation source invocation.schemaVersion must be ${INVESTIGATION_INVOCATION_SCHEMA_VERSION}`,
    );
  }
  assertNonEmptyString(value.runRef, 'investigation source invocation.runRef');
  assertNonEmptyString(value.hypothesisId, 'investigation source invocation.hypothesisId');
  assertNonEmptyString(
    value.feedbackInvocationRef,
    'investigation source invocation.feedbackInvocationRef',
  );
  assertNonEmptyString(
    value.hypothesisInvocationRef,
    'investigation source invocation.hypothesisInvocationRef',
  );
  assertNonEmptyString(
    value.investigationInvocationRef,
    'investigation source invocation.investigationInvocationRef',
  );
  assertNonEmptyString(
    value.experimentRootHash,
    'investigation source invocation.experimentRootHash',
  );
  assertNonEmptyString(
    value.observablePayloadHash,
    'investigation source invocation.observablePayloadHash',
  );
  assertNonEmptyString(value.feedbackHash, 'investigation source invocation.feedbackHash');
  assertNonEmptyString(value.hypothesesHash, 'investigation source invocation.hypothesesHash');
  assertNonEmptyString(
    value.selectedHypothesisHash,
    'investigation source invocation.selectedHypothesisHash',
  );
  assertNonEmptyString(value.evidencePackHash, 'investigation source invocation.evidencePackHash');
  if (value.status !== 'completed' && value.status !== 'failed') {
    throw new Error('investigation source invocation.status must be completed or failed');
  }
  return {
    schemaVersion: INVESTIGATION_INVOCATION_SCHEMA_VERSION,
    runRef: value.runRef,
    hypothesisId: value.hypothesisId,
    feedbackInvocationRef: value.feedbackInvocationRef,
    hypothesisInvocationRef: value.hypothesisInvocationRef,
    investigationInvocationRef: value.investigationInvocationRef,
    experimentRootHash: value.experimentRootHash,
    observablePayloadHash: value.observablePayloadHash,
    feedbackHash: value.feedbackHash,
    hypothesesHash: value.hypothesesHash,
    selectedHypothesisHash: value.selectedHypothesisHash,
    evidencePackHash: value.evidencePackHash,
    status: value.status,
  };
}

function parseEvidencePack(bytes: string): InvestigationEvidencePack {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes);
  } catch {
    throw new Error('investigation evidence pack must be valid JSON');
  }
  assertObject(parsed, 'investigation evidence pack');
  assertNonEmptyString(parsed.schemaVersion, 'investigation evidence pack.schemaVersion');
  if (parsed.schemaVersion !== EVIDENCE_PACK_SCHEMA_VERSION) {
    throw new Error(
      `investigation evidence pack.schemaVersion must be ${EVIDENCE_PACK_SCHEMA_VERSION}`,
    );
  }
  if (!Array.isArray(parsed.items)) {
    throw new Error('investigation evidence pack.items must be an array');
  }
  return parsed as InvestigationEvidencePack;
}

export function currentProductScopeRefs(
  pack: InvestigationEvidencePack,
): ReadonlySet<string> {
  return new Set(
    pack.items
      .filter(item => item.authority === 'current_product')
      .map(item => item.evidenceId),
  );
}

export function buildModificationWorkParticipantInput(
  source: ModificationWorkSource,
): string {
  return canonicalJson({
    schemaVersion: 'modification-work-input-v1',
    runRef: source.runRef,
    hypothesisId: source.hypothesisId,
    investigationInvocationRef: source.investigationInvocationRef,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    evidencePackHash: source.evidencePackHash,
    selectedHypothesisHash: source.selectedHypothesisHash,
    investigationHash: source.investigationHash,
    selectedHypothesis: source.selectedHypothesis,
    investigation: source.investigation,
    evidencePack: source.evidencePack,
  });
}

export function buildModificationWorkParticipantInputV2(
  source: ModificationWorkSource,
  handoff: InvestigationHandoff = projectInvestigationHandoff(source.investigation),
): string {
  return canonicalJson({
    schemaVersion: 'modification-work-input-v2',
    runRef: source.runRef,
    hypothesisId: source.hypothesisId,
    investigationInvocationRef: source.investigationInvocationRef,
    feedbackInvocationRef: source.feedbackInvocationRef,
    hypothesisInvocationRef: source.hypothesisInvocationRef,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    evidencePackHash: source.evidencePackHash,
    selectedHypothesisHash: source.selectedHypothesisHash,
    investigationHash: source.investigationHash,
    selectedHypothesis: source.selectedHypothesis,
    evidencePack: source.evidencePack,
    investigationHandoff: handoff,
  });
}

export async function loadModificationWorkSource(input: {
  investigationSourceRoot: string;
  runRef: string;
  hypothesisId: string;
}): Promise<ModificationWorkSource> {
  const runRef = validatePhase0RunRef(input.runRef);
  const hypothesisId = validateHypothesisId(input.hypothesisId);

  const investigationDir = resolvePhase0RunPath(
    resolvePhase0RunPath(
      join(resolve(input.investigationSourceRoot), 'investigation-runs'),
      runRef,
    ),
    hypothesisId,
  );

  const sourceInvestigationInvocationBytes = await readFile(
    join(investigationDir, 'invocation.json'),
    'utf8',
  );
  const invocation = parseInvestigationInvocation(
    JSON.parse(sourceInvestigationInvocationBytes),
  );

  if (invocation.runRef !== runRef) {
    throw new Error(
      `investigation invocation.runRef mismatch: expected ${runRef}, got ${invocation.runRef}`,
    );
  }
  if (invocation.hypothesisId !== hypothesisId) {
    throw new Error(
      `investigation invocation.hypothesisId mismatch: expected ${hypothesisId}, got ${invocation.hypothesisId}`,
    );
  }
  if (invocation.status !== 'completed') {
    throw new Error(
      `investigation invocation status must be completed, got ${invocation.status}`,
    );
  }

  const sourceEvidencePackBytes = await readFile(
    join(investigationDir, 'investigation-evidence.json'),
    'utf8',
  );
  const evidencePackHash = sha256Hex(sourceEvidencePackBytes);
  if (evidencePackHash !== invocation.evidencePackHash) {
    throw new Error(
      `evidencePackHash mismatch: expected ${invocation.evidencePackHash}, got ${evidencePackHash}`,
    );
  }

  const sourceHypothesesBytes = await readFile(
    join(investigationDir, 'source-hypotheses.json'),
    'utf8',
  );
  const hypothesesHash = sha256Hex(sourceHypothesesBytes);
  if (hypothesesHash !== invocation.hypothesesHash) {
    throw new Error(
      `hypothesesHash mismatch: expected ${invocation.hypothesesHash}, got ${hypothesesHash}`,
    );
  }

  const sourceInvestigationBytes = await readFile(
    join(investigationDir, 'investigation.json'),
    'utf8',
  );
  const investigationHash = sha256Hex(sourceInvestigationBytes);
  const investigation = parseHypothesisInvestigationResult(sourceInvestigationBytes);
  const evidencePack = parseEvidencePack(sourceEvidencePackBytes);
  if (evidencePack.runRef !== runRef) {
    throw new Error(
      `evidence pack runRef mismatch: expected ${runRef}, got ${evidencePack.runRef}`,
    );
  }
  if (evidencePack.hypothesisId !== hypothesisId) {
    throw new Error(
      `evidence pack hypothesisId mismatch: expected ${hypothesisId}, got ${evidencePack.hypothesisId}`,
    );
  }

  const allowedEvidenceRefs = investigationEvidenceRefs(evidencePack);
  validateHypothesisInvestigationReferences(investigation, allowedEvidenceRefs);

  const selectedHypothesis = evidencePack.selectedHypothesis;
  if (!selectedHypothesis || selectedHypothesis.hypothesisId !== hypothesisId) {
    throw new Error(`evidence pack selectedHypothesis.hypothesisId mismatch: ${hypothesisId}`);
  }
  const selectedHypothesisHash = sha256Hex(canonicalJson(selectedHypothesis));
  if (selectedHypothesisHash !== invocation.selectedHypothesisHash) {
    throw new Error(
      `selectedHypothesisHash mismatch: expected ${invocation.selectedHypothesisHash}, got ${selectedHypothesisHash}`,
    );
  }

  const allowedScopeRefs = currentProductScopeRefs(evidencePack);
  if (allowedScopeRefs.size === 0) {
    throw new Error('investigation evidence pack has no current-product bounded mechanism slice');
  }

  return {
    runRef,
    hypothesisId,
    feedbackInvocationRef: invocation.feedbackInvocationRef,
    hypothesisInvocationRef: invocation.hypothesisInvocationRef,
    investigationInvocationRef: invocation.investigationInvocationRef,
    experimentRootHash: invocation.experimentRootHash,
    observablePayloadHash: invocation.observablePayloadHash,
    feedbackHash: invocation.feedbackHash,
    hypothesesHash,
    selectedHypothesisHash,
    evidencePackHash,
    investigationHash,
    status: 'completed',
    selectedHypothesis,
    investigation,
    evidencePack,
    allowedEvidenceRefs,
    allowedScopeRefs,
    sourceInvestigationBytes,
    sourceInvestigationInvocationBytes,
    sourceEvidencePackBytes,
  };
}
