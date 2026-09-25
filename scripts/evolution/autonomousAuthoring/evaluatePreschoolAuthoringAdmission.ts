import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import type { SolutionOptionV1 } from '../../../src/evolution/solutionWorkContract';
import { composePreschoolPassiveCatalog, isPreschoolPassiveEligible } from '../../../src/data/preschoolPassiveSpine';
import type { PreschoolPassiveEntry } from '../../../src/data/preschoolPassiveSpine';
import {
  validateAutonomousAuthoringProposal,
  type AutonomousAuthoringApplicability,
} from '../../../src/evolution/autonomousAuthoringContract';
import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_AUTHORITY_SHA256,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
} from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';
import {
  validateAutonomousAuthoringAdmission,
  validatePreschoolCapacityEvidence,
  type AutonomousAuthoringAdmissionStatus,
  type AutonomousAuthoringAdmissionV1,
  type PreschoolCapacityEvidenceV1,
} from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import { canonicalJson, sha256Hex, validatePhase0RunRef } from '../phase0/provenance';

const AUTHORITY_REFS = [
  'docs/governance/product-decisions.md',
  'docs/product/content-authoring-workflow-contract-design.md',
  'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md',
] as const;
const ORIGIN_TAGS = ['scholar', 'martial', 'merchant', 'frontier'] as const;
const GAP_IDS = new Set(['preschool_passive_gap']);
const GAP_PREFIX = 'preschool_passive_gap::';

export interface EvaluatePreschoolAutonomousAuthoringAdmissionInput {
  repositoryRoot: string;
  sourceRoot: string;
  sourceRunRef: string;
  selectedOption: SolutionOptionV1;
  review: SolutionReviewV1;
  proposalSha256: string;
  reviewSha256: string;
  fixedCapacityEvidence?: PreschoolCapacityEvidenceV1;
}

interface CatalogEntry {
  id: string;
  originTags: string[];
  ageMin: number;
  ageMax: number;
}

interface Catalog {
  byId: Map<string, CatalogEntry>;
  entries: CatalogEntry[];
}

interface SourceStep {
  sequence: number;
  age: number;
  passiveEntryIds: string[];
}

interface EvidenceReadResult {
  evidence: PreschoolCapacityEvidenceV1 | null;
  status: 'OK' | 'NOT_APPLICABLE' | 'INSUFFICIENT_EVIDENCE';
  reason: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isGapId(id: string): boolean {
  return GAP_IDS.has(id) || id.startsWith(GAP_PREFIX);
}

function isCanonicalOrigin(value: string): value is typeof ORIGIN_TAGS[number] {
  return (ORIGIN_TAGS as readonly string[]).includes(value);
}

function readCatalog(value: unknown): Catalog | null {
  if (!isRecord(value) || !Array.isArray(value.entries)) return null;
  const entries: CatalogEntry[] = [];
  const byId = new Map<string, CatalogEntry>();
  const effectiveEntries = composePreschoolPassiveCatalog(value.entries as PreschoolPassiveEntry[]);
  for (const [index, raw] of effectiveEntries.entries()) {
    if (!isRecord(raw)
      || typeof raw.id !== 'string' || raw.id.length === 0
      || !Array.isArray(raw.originTags) || raw.originTags.length === 0
      || !raw.originTags.every(tag => typeof tag === 'string' && tag.length > 0)
      || typeof raw.ageMin !== 'number' || !Number.isInteger(raw.ageMin)
      || typeof raw.ageMax !== 'number' || !Number.isInteger(raw.ageMax)
      || raw.ageMin > raw.ageMax
      || byId.has(raw.id)) {
      return null;
    }
    const entry: CatalogEntry = {
      id: raw.id,
      originTags: [...raw.originTags] as string[],
      ageMin: raw.ageMin,
      ageMax: raw.ageMax,
    };
    byId.set(entry.id, entry);
    entries.push(entry);
    if (index > 10000) return null;
  }
  return { byId, entries };
}

async function readJson(path: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch {
    return null;
  }
}

async function hasCurrentAuthority(repositoryRoot: string): Promise<boolean> {
  const [decisions, workflow, spec] = await Promise.all([
    readFile(join(repositoryRoot, AUTHORITY_REFS[0]), 'utf8').catch(() => ''),
    readFile(join(repositoryRoot, AUTHORITY_REFS[1]), 'utf8').catch(() => ''),
    readFile(join(repositoryRoot, AUTHORITY_REFS[2])).catch(() => Buffer.alloc(0)),
  ]);
  return decisions.includes('### PD-121：Contract-Constrained Autonomous Authoring v1')
    && workflow.startsWith('# Content Authoring Workflow Contract v3')
    && workflow.includes('PD-121')
    && spec.toString('utf8').includes('**HUMAN ACCEPTED — 2026-09-24**')
    && sha256Hex(spec) === PRESCHOOL_SHARED_NEUTRAL_CONTRACT_AUTHORITY_SHA256;
}

function participantVisibleEvidenceRef(ref: string): boolean {
  return ref.startsWith('source/')
    && !ref.includes('internal/')
    && !ref.includes('passiveEntryIds')
    && !ref.includes('player-surface-source.json');
}

function semanticEvidenceIsReviewed(
  input: EvaluatePreschoolAutonomousAuthoringAdmissionInput,
  proposal: ReturnType<typeof validateAutonomousAuthoringProposal>,
): boolean {
  const assessment = input.review.autonomousAuthoringAssessment;
  return proposal.sourceEvidenceRefs.some(participantVisibleEvidenceRef)
    && proposal.responsibilities.every(responsibility => responsibility.evidenceRefs.some(participantVisibleEvidenceRef))
    && input.review.artifactRefs.some(participantVisibleEvidenceRef)
    && assessment?.applicabilityAssessment === 'APPLICABLE'
    && assessment.conformance === 'CONFORMING'
    && assessment.executionEnvelope === 'WITHIN_ENVELOPE'
    && assessment.blockers.length === 0;
}

function participantEvidenceRefsArePresent(
  proposal: ReturnType<typeof validateAutonomousAuthoringProposal>,
  review: SolutionReviewV1,
): boolean {
  return proposal.sourceEvidenceRefs.some(participantVisibleEvidenceRef)
    && proposal.responsibilities.every(responsibility => responsibility.evidenceRefs.some(participantVisibleEvidenceRef))
    && review.artifactRefs.some(participantVisibleEvidenceRef);
}

function legalPool(catalog: Catalog, origin: string, age: number, consumed: Set<string>): CatalogEntry[] {
  const playerOriginTags = new Set([origin]);
  return catalog.entries.filter(entry =>
    isPreschoolPassiveEligible(entry as PreschoolPassiveEntry, playerOriginTags)
    && entry.ageMin <= age
    && entry.ageMax >= age
    && !consumed.has(entry.id));
}

function validateEvidenceAgainstCatalog(
  evidence: PreschoolCapacityEvidenceV1,
  catalog: Catalog,
): EvidenceReadResult {
  const consumed = new Set(evidence.preConsumedEntryIds);
  const inferredOrigins = new Set<string>();
  for (const id of evidence.preConsumedEntryIds) {
    const entry = catalog.byId.get(id);
    if (!entry) return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'A pre-consumed entry is missing from the evaluated catalog.' };
    for (const tag of entry.originTags) if (isCanonicalOrigin(tag)) inferredOrigins.add(tag);
  }
  let authoredBeats = 0;
  let gapBeats = 0;
  let foreignOriginLeakCount = 0;
  let duplicateAuthoredCount = 0;
  let contradiction = false;
  for (const beat of evidence.beats) {
    const available = legalPool(catalog, evidence.canonicalOriginTag, beat.age, consumed);
    if (available.length !== beat.legalUnconsumedCountBeforeSelection) {
      return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'Capacity counts do not match the evaluated catalog.' };
    }
    if (beat.kind === 'GAP') {
      gapBeats += 1;
      if (!isGapId(beat.selectedEntryId)) {
        return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'A GAP beat has an invalid gap identifier.' };
      }
      if (available.length > 0) contradiction = true;
      continue;
    }
    authoredBeats += 1;
    if (isGapId(beat.selectedEntryId)) {
      return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'An AUTHORED beat uses a gap identifier.' };
    }
    const entry = catalog.byId.get(beat.selectedEntryId);
    if (!entry) return { evidence: null, status: 'NOT_APPLICABLE', reason: 'A selected authored entry is absent from the evaluated catalog.' };
    const matchingOrigin = entry.originTags.includes(evidence.canonicalOriginTag);
    const neutral = entry.originTags.includes('neutral');
    for (const tag of entry.originTags) if (isCanonicalOrigin(tag)) inferredOrigins.add(tag);
    if (!matchingOrigin && !neutral) {
      foreignOriginLeakCount += 1;
      contradiction = true;
    }
    if (entry.ageMin > beat.age || entry.ageMax < beat.age) contradiction = true;
    if (consumed.has(entry.id)) {
      duplicateAuthoredCount += 1;
      contradiction = true;
    }
    consumed.add(entry.id);
  }
  if (inferredOrigins.size === 0) {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'Fixed capacity evidence cannot establish a canonical origin.' };
  }
  if (inferredOrigins.size > 1 || !inferredOrigins.has(evidence.canonicalOriginTag)) {
    contradiction = true;
  }
  if (evidence.demandBeats !== evidence.beats.length
    || evidence.authoredBeats !== authoredBeats
    || evidence.gapBeats !== gapBeats
    || evidence.foreignOriginLeakCount !== foreignOriginLeakCount
    || evidence.duplicateAuthoredCount !== duplicateAuthoredCount) {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'Capacity evidence counters do not match the observed beats.' };
  }
  return {
    evidence,
    status: contradiction ? 'NOT_APPLICABLE' : 'OK',
    reason: contradiction ? 'Host evidence contradicts the proposed shared-neutral capacity diagnosis.' : '',
  };
}

function makeAdmission(
  input: EvaluatePreschoolAutonomousAuthoringAdmissionInput,
  status: AutonomousAuthoringAdmissionStatus,
  capacityEvidence: PreschoolCapacityEvidenceV1 | null,
  reasons: string[],
): AutonomousAuthoringAdmissionV1 {
  const proposal = input.selectedOption.autonomousAuthoring;
  if (!proposal) throw new Error('admission evaluation requires an autonomous authoring proposal');
  return validateAutonomousAuthoringAdmission({
    schemaVersion: 'autonomous-authoring-admission-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
    status,
    proposalSha256: input.proposalSha256,
    reviewSha256: input.reviewSha256,
    sourceRunRef: input.sourceRunRef,
    authorityRefs: [...AUTHORITY_REFS],
    allowedWritePaths: [...PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS],
    maxNewEntries: PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
    capacityEvidence,
    reasons,
  });
}

function mapApplicability(value: AutonomousAuthoringApplicability): AutonomousAuthoringAdmissionStatus | null {
  switch (value) {
    case 'NOT_APPLICABLE': return 'NOT_APPLICABLE';
    case 'INSUFFICIENT_EVIDENCE': return 'INSUFFICIENT_EVIDENCE';
    case 'CONTRACT_CHANGE_REQUIRED': return 'CONTRACT_CHANGE_REQUIRED';
    case 'APPLICABLE': return null;
  }
}

function validateSourceSteps(value: unknown): SourceStep[] | null {
  if (!isRecord(value)
    || value.schemaVersion !== 'headless-api-player-surface-source-v1'
    || !Array.isArray(value.steps)) return null;
  const steps: SourceStep[] = [];
  for (const raw of value.steps) {
    if (!isRecord(raw) || raw.kind !== 'passive_narrative' || typeof raw.age !== 'number' || raw.age < 0 || raw.age > 7) continue;
    if (!Number.isInteger(raw.age)
      || typeof raw.sequence !== 'number' || !Number.isInteger(raw.sequence) || raw.sequence < 0
      || !Array.isArray(raw.passiveEntryIds)
      || raw.passiveEntryIds.length === 0
      || !raw.passiveEntryIds.every(id => typeof id === 'string' && id.length > 0)) return null;
    steps.push({
      sequence: raw.sequence,
      age: raw.age,
      passiveEntryIds: [...raw.passiveEntryIds] as string[],
    });
  }
  steps.sort((left, right) => left.sequence - right.sequence);
  for (let index = 1; index < steps.length; index += 1) {
    if (steps[index]!.sequence <= steps[index - 1]!.sequence
      || steps[index]!.age < steps[index - 1]!.age) return null;
  }
  return steps;
}

function reconstructNaturalEvidence(
  runRef: string,
  steps: SourceStep[],
  catalog: Catalog,
): EvidenceReadResult {
  const canonicalOrigins = new Set<string>();
  for (const step of steps) {
    for (const id of step.passiveEntryIds) {
      if (isGapId(id)) continue;
      const entry = catalog.byId.get(id);
      for (const tag of entry?.originTags ?? []) if (isCanonicalOrigin(tag)) canonicalOrigins.add(tag);
    }
  }
  if (canonicalOrigins.size > 1) {
    return { evidence: null, status: 'NOT_APPLICABLE', reason: 'The run contains conflicting canonical origins.' };
  }
  const canonicalOriginTag = [...canonicalOrigins][0];
  if (!canonicalOriginTag) {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'No canonical origin can be inferred from sealed passive provenance.' };
  }

  const preConsumedEntryIds: string[] = [];
  const priorConsumed = new Set<string>();
  for (const step of steps) {
    if (step.age >= 4) continue;
    for (const id of step.passiveEntryIds) {
      if (isGapId(id) || !catalog.byId.has(id)) continue;
      if (priorConsumed.has(id)) {
        return { evidence: null, status: 'NOT_APPLICABLE', reason: 'Prior passive provenance repeats a consumed authored entry.' };
      }
      priorConsumed.add(id);
      preConsumedEntryIds.push(id);
    }
  }

  const consumed = new Set(preConsumedEntryIds);
  const beats: PreschoolCapacityEvidenceV1['beats'] = [];
  let sequence = 0;
  for (const step of steps) {
    if (step.age < 4) continue;
    for (const selectedEntryId of step.passiveEntryIds) {
      sequence += 1;
      const gap = isGapId(selectedEntryId);
      const available = legalPool(catalog, canonicalOriginTag, step.age, consumed);
      if (gap) {
        if (available.length > 0) {
          return { evidence: null, status: 'NOT_APPLICABLE', reason: 'A generic gap was selected while legal unconsumed entries remained.' };
        }
        beats.push({
          sequence,
          age: step.age as 4 | 5 | 6 | 7,
          selectedEntryId,
          kind: 'GAP',
          legalUnconsumedCountBeforeSelection: 0,
        });
        continue;
      }
      const entry = catalog.byId.get(selectedEntryId);
      if (!entry) return { evidence: null, status: 'NOT_APPLICABLE', reason: 'An authored preschool entry is absent from the evaluated catalog.' };
      const matchingOrigin = entry.originTags.includes(canonicalOriginTag);
      const neutral = entry.originTags.includes('neutral');
      if (!matchingOrigin && !neutral) {
        return { evidence: null, status: 'NOT_APPLICABLE', reason: 'A selected authored entry is exclusive to a foreign origin.' };
      }
      if (entry.ageMin > step.age || entry.ageMax < step.age) {
        return { evidence: null, status: 'NOT_APPLICABLE', reason: 'A selected authored entry is outside its legal age window.' };
      }
      if (consumed.has(selectedEntryId)) {
        return { evidence: null, status: 'NOT_APPLICABLE', reason: 'A selected authored entry was already consumed.' };
      }
      if (!available.some(candidate => candidate.id === selectedEntryId)) {
        return { evidence: null, status: 'NOT_APPLICABLE', reason: 'A selected authored entry is not in the legal unconsumed pool.' };
      }
      beats.push({
        sequence,
        age: step.age as 4 | 5 | 6 | 7,
        selectedEntryId,
        kind: 'AUTHORED',
        legalUnconsumedCountBeforeSelection: available.length,
      });
      consumed.add(selectedEntryId);
    }
  }
  if (beats.length === 0) {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'The run contains no preschool passive demand beats.' };
  }
  const gapBeats = beats.filter(beat => beat.kind === 'GAP').length;
  const evidence = validatePreschoolCapacityEvidence({
    schemaVersion: 'preschool-capacity-evidence-v1',
    runRef,
    evidenceMode: gapBeats > 0 ? 'STRUCTURAL_EXHAUSTION' : 'SEMANTIC_VARIETY',
    canonicalOriginTag,
    preConsumedEntryIds,
    beats,
    demandBeats: beats.length,
    authoredBeats: beats.length - gapBeats,
    gapBeats,
    foreignOriginLeakCount: 0,
    duplicateAuthoredCount: 0,
  });
  return { evidence, status: 'OK', reason: '' };
}

async function readNaturalEvidence(input: EvaluatePreschoolAutonomousAuthoringAdmissionInput, catalog: Catalog): Promise<EvidenceReadResult> {
  let runRef: string;
  try {
    runRef = validatePhase0RunRef(input.sourceRunRef);
  } catch {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'The source run reference is invalid.' };
  }
  const source = await readJson(join(resolve(input.sourceRoot), 'game-runs', runRef, 'internal/player-surface-source.json'));
  const steps = validateSourceSteps(source);
  if (!steps) {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'Sealed passive provenance is missing or incomplete.' };
  }
  return reconstructNaturalEvidence(runRef, steps, catalog);
}

function validateFixedEvidence(
  input: EvaluatePreschoolAutonomousAuthoringAdmissionInput,
  catalog: Catalog,
): EvidenceReadResult {
  try {
    const evidence = validatePreschoolCapacityEvidence(input.fixedCapacityEvidence);
    if (evidence.runRef !== input.sourceRunRef) {
      return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'Fixed capacity evidence belongs to a different source run.' };
    }
    return validateEvidenceAgainstCatalog(evidence, catalog);
  } catch {
    return { evidence: null, status: 'INSUFFICIENT_EVIDENCE', reason: 'Fixed capacity evidence is missing or invalid.' };
  }
}

export async function evaluatePreschoolAutonomousAuthoringAdmission(
  input: EvaluatePreschoolAutonomousAuthoringAdmissionInput,
): Promise<AutonomousAuthoringAdmissionV1> {
  const rawProposal = input.selectedOption.autonomousAuthoring;
  if (!rawProposal) throw new Error('selected option has no autonomous authoring proposal');
  const proposal = validateAutonomousAuthoringProposal(rawProposal);
  if (proposal.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    || proposal.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION) {
    return makeAdmission(input, 'AUTHORITY_STALE', null, ['The selected authoring contract identity is not current.']);
  }
  if (!await hasCurrentAuthority(input.repositoryRoot)) {
    return makeAdmission(input, 'AUTHORITY_STALE', null, ['PD-121, Content Authoring Workflow v3, or accepted design authority is missing.']);
  }

  const claimedStatus = mapApplicability(proposal.applicabilityClaim);
  if (claimedStatus !== null) {
    return makeAdmission(input, claimedStatus, null, [`The proposal claims ${proposal.applicabilityClaim}.`]);
  }
  if (proposal.responsibilities.length > PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES) {
    return makeAdmission(input, 'EXECUTION_ENVELOPE_EXCEEDED', null, ['The minimum responsibility set exceeds the eight-entry execution envelope.']);
  }
  if (input.selectedOption.changeScope !== 'program') {
    return makeAdmission(input, 'CONTRACT_CHANGE_REQUIRED', null, ['Autonomous preschool authoring requires a program-scope option.']);
  }
  const reviewAssessment = input.review.autonomousAuthoringAssessment;
  const reviewedStatus = reviewAssessment ? mapApplicability(reviewAssessment.applicabilityAssessment) : null;
  if (reviewedStatus !== null) {
    return makeAdmission(input, reviewedStatus, null, [`Reviewer assessment is ${reviewAssessment!.applicabilityAssessment}.`]);
  }
  if (reviewAssessment?.executionEnvelope === 'EXECUTION_ENVELOPE_EXCEEDED') {
    return makeAdmission(input, 'EXECUTION_ENVELOPE_EXCEEDED', null, ['Reviewer found the proposal outside the execution envelope.']);
  }
  if (input.review.executionAuthorityAssessment === 'HUMAN_AUTHORITY_REQUIRED') {
    return makeAdmission(input, 'CONTRACT_CHANGE_REQUIRED', null, ['Reviewer determined that Human authority is required.']);
  }
  if (input.review.executionAuthorityAssessment !== 'WITHIN_CURRENT_AUTHORITY'
    || input.review.decision !== 'ACCEPT_OPTION'
    || input.review.acceptedOptionId !== input.selectedOption.optionId
    || reviewAssessment?.conformance !== 'CONFORMING'
    || reviewAssessment.executionEnvelope !== 'WITHIN_ENVELOPE'
    || reviewAssessment.blockers.length > 0) {
    return makeAdmission(input, 'INSUFFICIENT_EVIDENCE', null, ['The independent Reviewer did not establish accepted, conforming, within-envelope authority.']);
  }
  if (!participantEvidenceRefsArePresent(proposal, input.review)) {
    return makeAdmission(input, 'INSUFFICIENT_EVIDENCE', null, ['The proposal or Reviewer lacks references to permitted player-visible evidence.']);
  }

  const catalogValue = await readJson(join(input.repositoryRoot, 'src/data/lines/preschool-passive-spine.json'));
  const catalog = readCatalog(catalogValue);
  if (!catalog) {
    return makeAdmission(input, 'INSUFFICIENT_EVIDENCE', null, ['The evaluated preschool catalog is missing or invalid.']);
  }
  const evidenceResult = input.fixedCapacityEvidence === undefined
    ? await readNaturalEvidence(input, catalog)
    : validateFixedEvidence(input, catalog);
  if (evidenceResult.status === 'NOT_APPLICABLE') {
    return makeAdmission(input, 'NOT_APPLICABLE', evidenceResult.evidence, [evidenceResult.reason]);
  }
  if (evidenceResult.status !== 'OK' || evidenceResult.evidence === null) {
    return makeAdmission(input, 'INSUFFICIENT_EVIDENCE', null, [evidenceResult.reason]);
  }
  const evidence = evidenceResult.evidence;
  if (evidence.evidenceMode === 'STRUCTURAL_EXHAUSTION') {
    if (evidence.gapBeats === 0 || evidence.beats.some(beat => beat.kind === 'GAP' && beat.legalUnconsumedCountBeforeSelection !== 0)) {
      return makeAdmission(input, 'NOT_APPLICABLE', evidence, ['Structural exhaustion is contradicted by a legal unconsumed entry.']);
    }
  } else if (
    evidence.gapBeats !== 0
    || !semanticEvidenceIsReviewed(input, proposal)
    || evidence.beats.some(beat => beat.kind === 'GAP')
  ) {
    return makeAdmission(input, 'INSUFFICIENT_EVIDENCE', evidence, ['Semantic-variety evidence lacks a reviewed player-visible basis or contains a structural gap.']);
  }
  return makeAdmission(input, 'ELIGIBLE', evidence, [
    evidence.evidenceMode === 'STRUCTURAL_EXHAUSTION'
      ? 'Host verified whole-pool exhaustion in the sealed source.'
      : 'Reviewer established a player-visible semantic-variety gap without a Host-observed structural deficit.',
  ]);
}
