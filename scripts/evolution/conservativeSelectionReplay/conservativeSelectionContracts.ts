import type {
  SelectionPriorityReplayCandidate,
  SelectionPriorityReplayPresentation,
} from '../selectionPriorityReplay/selectionPriorityReplay';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export const CONSERVATIVE_SELECTION_INPUT_SCHEMA = 'ae-conservative-selection-input-v1' as const;
export const CONSERVATIVE_SELECTION_MAPPING_SCHEMA = 'ae-conservative-selection-mapping-v1' as const;
export const CONSERVATIVE_SELECTION_RESPONSE_SCHEMA = 'ae-conservative-selection-response-v1' as const;
export const CONSERVATIVE_SELECTION_RESULT_SCHEMA = 'ae-conservative-selection-result-v1' as const;

export type ConservativeSelectionDecision =
  | 'KEEP_BASELINE'
  | 'OVERRIDE'
  | 'NO_CLEAR_PREFERENCE';

export interface ConservativeSelectionCandidate {
  candidateRef: string;
  hypothesis: string;
  observedBasis: string;
  feedbackRefs: string[];
  evidenceRefs: string[];
  patternEvidenceRefs?: string[];
  unknowns: string[];
  productSignificance: string;
}

export interface ConservativeSelectionInput {
  schemaVersion: typeof CONSERVATIVE_SELECTION_INPUT_SCHEMA;
  baselineCandidateRef: string;
  candidates: ConservativeSelectionCandidate[];
}

export interface ConservativeSelectionMappingCandidate {
  candidateRef: string;
  presentationIndex: number;
  sourceIndex: number;
  sourceHypothesisId: string;
  sourceHypothesisSha256: string;
  isBaseline: boolean;
}

export interface ConservativeSelectionMapping {
  schemaVersion: typeof CONSERVATIVE_SELECTION_MAPPING_SCHEMA;
  caseId: string;
  presentationId: string;
  presentationSha256: string;
  blindInputSha256: string;
  baselineSourceHypothesisSha256: string;
  candidates: ConservativeSelectionMappingCandidate[];
}

export interface ConservativeSelectionResponse {
  schemaVersion: typeof CONSERVATIVE_SELECTION_RESPONSE_SCHEMA;
  decision: ConservativeSelectionDecision;
  selectedCandidateRef: string | null;
  rationale: {
    baselineEligibility: string;
    challengerEligibility: string;
    decisiveComparison: string;
    boundednessReason: string;
    overallReason: string;
  };
}

export interface ConservativeSelectionTrustedResult {
  schemaVersion: typeof CONSERVATIVE_SELECTION_RESULT_SCHEMA;
  decision: ConservativeSelectionDecision;
  selected: null | {
    candidateRef: string;
    sourceIndex: number;
    sourceHypothesisId: string;
    sourceHypothesisSha256: string;
    isBaseline: boolean;
  };
  rationale: ConservativeSelectionResponse['rationale'];
  createdAt: string;
}

export interface ConservativeSelectionProjection {
  input: ConservativeSelectionInput;
  mapping: ConservativeSelectionMapping;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const INPUT_KEYS = ['schemaVersion', 'baselineCandidateRef', 'candidates'] as const;
const INPUT_CANDIDATE_KEYS = [
  'candidateRef', 'hypothesis', 'observedBasis', 'feedbackRefs', 'evidenceRefs',
  'unknowns', 'productSignificance',
] as const;
const INPUT_CANDIDATE_OPTIONAL_KEYS = ['patternEvidenceRefs'] as const;
const MAPPING_KEYS = [
  'schemaVersion', 'caseId', 'presentationId', 'presentationSha256',
  'blindInputSha256', 'baselineSourceHypothesisSha256', 'candidates',
] as const;
const MAPPING_CANDIDATE_KEYS = [
  'candidateRef', 'presentationIndex', 'sourceIndex', 'sourceHypothesisId',
  'sourceHypothesisSha256', 'isBaseline',
] as const;
const RESPONSE_KEYS = ['schemaVersion', 'decision', 'selectedCandidateRef', 'rationale'] as const;
const RATIONALE_KEYS = [
  'baselineEligibility', 'challengerEligibility', 'decisiveComparison',
  'boundednessReason', 'overallReason',
] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function hash(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!SHA256_PATTERN.test(result)) throw new Error(`${label} must be a SHA-256 hex string`);
  return result;
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  for (const [index, item] of value.entries()) nonEmptyString(item, `${label}[${index}]`);
  return [...value] as string[];
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`);
  return value;
}

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

function semanticCandidate(candidate: SelectionPriorityReplayCandidate): Omit<ConservativeSelectionCandidate, 'candidateRef'> {
  return {
    hypothesis: candidate.hypothesis,
    observedBasis: candidate.observedBasis,
    feedbackRefs: [...candidate.feedbackRefs],
    evidenceRefs: [...candidate.evidenceRefs],
    ...(candidate.patternEvidenceRefs !== undefined
      ? { patternEvidenceRefs: [...candidate.patternEvidenceRefs] }
      : {}),
    unknowns: [...candidate.unknowns],
    productSignificance: candidate.productSignificance,
  };
}

function sourceHypothesisHash(candidate: SelectionPriorityReplayCandidate): string {
  const { sourceHypothesisId, ...semantic } = {
    sourceHypothesisId: candidate.sourceHypothesisId,
    ...semanticCandidate(candidate),
  };
  return sha256Hex(canonicalJson({ hypothesisId: sourceHypothesisId, ...semantic }));
}

export function buildConservativeSelectionProjection(
  presentation: SelectionPriorityReplayPresentation,
): ConservativeSelectionProjection {
  const baseline = presentation.candidates.find(candidate => candidate.sourceIndex === 0);
  if (!baseline) throw new Error('presentation must contain sourceIndex 0 baseline');
  const inputCandidates = presentation.candidates.map((candidate, index) => ({
    candidateRef: `candidate-${String.fromCharCode(65 + index)}`,
    ...semanticCandidate(candidate),
  }));
  const baselineCandidateRef = inputCandidates[presentation.candidates.indexOf(baseline)].candidateRef;
  const input: ConservativeSelectionInput = {
    schemaVersion: CONSERVATIVE_SELECTION_INPUT_SCHEMA,
    baselineCandidateRef,
    candidates: inputCandidates,
  };
  const mapping: ConservativeSelectionMapping = {
    schemaVersion: CONSERVATIVE_SELECTION_MAPPING_SCHEMA,
    caseId: presentation.caseId,
    presentationId: presentation.presentationId,
    presentationSha256: presentation.presentationSha256,
    blindInputSha256: sha256Hex(canonicalJson(input)),
    baselineSourceHypothesisSha256: baseline.sourceHypothesisSha256,
    candidates: presentation.candidates.map((candidate, presentationIndex) => ({
      candidateRef: inputCandidates[presentationIndex].candidateRef,
      presentationIndex,
      sourceIndex: candidate.sourceIndex,
      sourceHypothesisId: candidate.sourceHypothesisId,
      sourceHypothesisSha256: candidate.sourceHypothesisSha256,
      isBaseline: candidate.sourceIndex === 0,
    })),
  };
  validateConservativeSelectionProjection(presentation, input, mapping);
  return { input, mapping };
}

export function validateConservativeSelectionProjection(
  presentation: SelectionPriorityReplayPresentation,
  input: ConservativeSelectionInput,
  mapping: ConservativeSelectionMapping,
): void {
  const { presentationSha256, ...unsignedPresentation } = presentation;
  if (presentationSha256 !== sha256Hex(canonicalJson(unsignedPresentation))) {
    throw new Error('presentation hash does not match presentation content');
  }
  assertExactKeys(input as unknown as Record<string, unknown>, INPUT_KEYS, 'input');
  assertExactKeys(mapping as unknown as Record<string, unknown>, MAPPING_KEYS, 'mapping');
  if (mapping.schemaVersion !== CONSERVATIVE_SELECTION_MAPPING_SCHEMA) throw new Error('mapping schemaVersion is invalid');
  if (mapping.caseId !== presentation.caseId || mapping.presentationId !== presentation.presentationId) {
    throw new Error('mapping presentation identity does not match presentation');
  }
  if (mapping.presentationSha256 !== presentation.presentationSha256) throw new Error('mapping presentationSha256 does not match presentation');
  if (mapping.blindInputSha256 !== sha256Hex(canonicalJson(input))) throw new Error('mapping blindInputSha256 does not match input');
  if (mapping.candidates.length !== input.candidates.length || mapping.candidates.length !== presentation.candidates.length) {
    throw new Error('projection candidate counts do not match');
  }
  const refs = new Set<string>();
  let baselineCount = 0;
  for (const [index, entry] of mapping.candidates.entries()) {
    assertExactKeys(entry as unknown as Record<string, unknown>, MAPPING_CANDIDATE_KEYS, `mapping.candidates[${index}]`);
    if (refs.has(entry.candidateRef)) throw new Error('mapping candidateRef must be unique');
    refs.add(entry.candidateRef);
    if (entry.candidateRef !== input.candidates[index].candidateRef) throw new Error('mapping candidateRef order does not match input');
    if (entry.presentationIndex !== index) throw new Error('mapping presentationIndex does not match presentation');
    const source = presentation.candidates[index];
    if (entry.sourceIndex !== source.sourceIndex || entry.sourceHypothesisId !== source.sourceHypothesisId || entry.sourceHypothesisSha256 !== source.sourceHypothesisSha256) {
      throw new Error('mapping source identity does not match presentation');
    }
    if (entry.sourceHypothesisSha256 !== sourceHypothesisHash(source)) throw new Error('source hypothesis hash does not match semantic fields');
    const { candidateRef: _ref, ...visibleSemantic } = input.candidates[index];
    if (canonicalJson(visibleSemantic) !== canonicalJson(semanticCandidate(source))) throw new Error('visible candidate semantic fields do not match source');
    if (entry.isBaseline) baselineCount += 1;
  }
  if (baselineCount !== 1) throw new Error('projection must contain exactly one baseline mapping');
  const baseline = mapping.candidates.find(entry => entry.isBaseline);
  if (!baseline || baseline.sourceIndex !== 0) throw new Error('baseline mapping must have sourceIndex 0');
  if (input.baselineCandidateRef !== baseline.candidateRef) throw new Error('input baselineCandidateRef does not map to baseline');
  if (mapping.baselineSourceHypothesisSha256 !== baseline.sourceHypothesisSha256) throw new Error('baseline source hash does not match baseline mapping');
}

export function parseConservativeSelectionResponse(raw: string, input: ConservativeSelectionInput): ConservativeSelectionResponse {
  const parsed = parseJson(raw, 'conservative selection response');
  assertObject(parsed, 'conservative selection response');
  assertExactKeys(parsed, RESPONSE_KEYS, 'conservative selection response');
  if (parsed.schemaVersion !== CONSERVATIVE_SELECTION_RESPONSE_SCHEMA) throw new Error(`schemaVersion must be ${CONSERVATIVE_SELECTION_RESPONSE_SCHEMA}`);
  const decision = parsed.decision;
  if (decision !== 'KEEP_BASELINE' && decision !== 'OVERRIDE' && decision !== 'NO_CLEAR_PREFERENCE') throw new Error('decision is invalid');
  const selectedCandidateRef = parsed.selectedCandidateRef;
  if (selectedCandidateRef !== null) nonEmptyString(selectedCandidateRef, 'selectedCandidateRef');
  if (decision === 'KEEP_BASELINE' && selectedCandidateRef !== input.baselineCandidateRef) throw new Error('KEEP_BASELINE must select baseline');
  if (decision === 'NO_CLEAR_PREFERENCE' && selectedCandidateRef !== null) throw new Error('NO_CLEAR_PREFERENCE must select null');
  if (decision === 'OVERRIDE' && (selectedCandidateRef === null || !input.candidates.some(candidate => candidate.candidateRef === selectedCandidateRef) || selectedCandidateRef === input.baselineCandidateRef)) {
    throw new Error('OVERRIDE must select a present non-baseline candidate');
  }
  assertObject(parsed.rationale, 'rationale');
  assertExactKeys(parsed.rationale, RATIONALE_KEYS, 'rationale');
  const rationale = Object.fromEntries(RATIONALE_KEYS.map(key => [key, nonEmptyString(parsed.rationale[key], `rationale.${key}`)])) as ConservativeSelectionResponse['rationale'];
  return {
    schemaVersion: CONSERVATIVE_SELECTION_RESPONSE_SCHEMA,
    decision,
    selectedCandidateRef,
    rationale,
  };
}

export function projectConservativeSelectionResult(
  response: ConservativeSelectionResponse,
  mapping: ConservativeSelectionMapping,
  createdAt: string,
): ConservativeSelectionTrustedResult {
  const selected = response.selectedCandidateRef === null
    ? null
    : mapping.candidates.find(candidate => candidate.candidateRef === response.selectedCandidateRef);
  if (response.decision === 'OVERRIDE' && selected === undefined) throw new Error('response selected candidate is absent from mapping');
  if (response.decision === 'KEEP_BASELINE' && selected?.isBaseline !== true) throw new Error('KEEP_BASELINE mapping is not baseline');
  return {
    schemaVersion: CONSERVATIVE_SELECTION_RESULT_SCHEMA,
    decision: response.decision,
    selected: selected === undefined || selected === null ? null : {
      candidateRef: selected.candidateRef,
      sourceIndex: selected.sourceIndex,
      sourceHypothesisId: selected.sourceHypothesisId,
      sourceHypothesisSha256: selected.sourceHypothesisSha256,
      isBaseline: selected.isBaseline,
    },
    rationale: response.rationale,
    createdAt: nonEmptyString(createdAt, 'createdAt'),
  };
}
