import {
  validateExperienceSemanticContext,
  type ExperienceSemanticContext,
} from '../../../src/evolution/experienceSemanticContext';
import {
  validateExperiencePatternEvidence,
  type ExperiencePatternEvidence,
  type ExperiencePattern,
} from '../../../src/evolution/experiencePatternEvidenceContract';
import type { ComparativeFeedback } from '../../../src/evolution/comparativeFeedbackContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export interface ExperiencePatternRunEvidenceItem {
  evidenceId: string;
  kind: string;
  payload: unknown;
}

export interface ExperiencePatternRunInput {
  runRef: string;
  items: ExperiencePatternRunEvidenceItem[];
}

export interface ExperiencePatternComparativeInput {
  comparisonId: string;
  baselineRunRef: string;
  candidateRunRef: string;
  feedback: ComparativeFeedback;
}

interface ContextOccurrence {
  runRef: string;
  evidenceId: string;
  entryId: string;
  context: ExperienceSemanticContext;
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function contextFingerprint(context: ExperienceSemanticContext): string {
  return JSON.stringify({
    schemaVersion: context.schemaVersion,
    milestoneMeaning: context.milestoneMeaning ?? null,
    lifeStageMeaning: context.lifeStageMeaning ?? null,
    experienceCategory: context.experienceCategory,
    expectedExperienceSignals: [...context.expectedExperienceSignals].sort(),
  });
}

function runEvidenceRef(runRef: string, evidenceId: string): string {
  return `run:${runRef}:${evidenceId}`;
}

function contextRef(runRef: string, entryId: string): string {
  return `run:${runRef}:entry:${entryId}:experienceContext`;
}

export function experiencePatternEvidencePayload(
  value: ExperiencePatternEvidence,
): Omit<ExperiencePatternEvidence, 'patternEvidenceHash'> {
  const validated = validateExperiencePatternEvidence(value);
  const { patternEvidenceHash: _ignored, ...payload } = validated;
  return payload;
}

export function computeExperiencePatternEvidenceHash(value: ExperiencePatternEvidence): string {
  return sha256Hex(canonicalJson(experiencePatternEvidencePayload(value)));
}

export function withExperiencePatternEvidenceHash(
  value: ExperiencePatternEvidence,
): ExperiencePatternEvidence {
  const payload = experiencePatternEvidencePayload(value);
  return {
    ...payload,
    patternEvidenceHash: computeExperiencePatternEvidenceHash(payload),
  };
}

function comparisonObservationRef(comparisonId: string, index: number): string {
  return `comparison:${comparisonId}:observation:${index}`;
}

function collectOccurrences(
  runs: ExperiencePatternRunInput[],
): Map<string, ContextOccurrence[]> {
  const occurrencesByFingerprint = new Map<string, ContextOccurrence[]>();
  const runRefs = new Set<string>();

  for (const [runIndex, run] of runs.entries()) {
    assertNonEmptyString(run.runRef, `runs[${runIndex}].runRef`);
    if (runRefs.has(run.runRef)) throw new Error(`duplicate pattern runRef: ${run.runRef}`);
    runRefs.add(run.runRef);
    const evidenceIds = new Set<string>();
    for (const [itemIndex, item] of run.items.entries()) {
      assertNonEmptyString(item.evidenceId, `runs[${runIndex}].items[${itemIndex}].evidenceId`);
      assertNonEmptyString(item.kind, `runs[${runIndex}].items[${itemIndex}].kind`);
      if (evidenceIds.has(item.evidenceId)) {
        throw new Error(`duplicate run evidenceId: ${run.runRef}:${item.evidenceId}`);
      }
      evidenceIds.add(item.evidenceId);
      if (item.kind !== 'observable_entry') continue;
      if (!isRecord(item.payload)) {
        throw new Error(`observable run evidence payload must be an object: ${run.runRef}:${item.evidenceId}`);
      }
      assertNonEmptyString(item.payload.entryId, `runs[${runIndex}].items[${itemIndex}].payload.entryId`);
      if (item.payload.experienceContext === undefined) continue;
      const context = validateExperienceSemanticContext(item.payload.experienceContext);
      const fingerprint = contextFingerprint(context);
      const occurrences = occurrencesByFingerprint.get(fingerprint) ?? [];
      occurrences.push({
        runRef: run.runRef,
        evidenceId: item.evidenceId,
        entryId: item.payload.entryId,
        context,
      });
      occurrencesByFingerprint.set(fingerprint, occurrences);
    }
  }
  return occurrencesByFingerprint;
}

function validateComparativeInputs(
  comparisons: ExperiencePatternComparativeInput[],
  runs: ExperiencePatternRunInput[],
): void {
  const runEntryIds = new Map(
    runs.map(run => [
      run.runRef,
      new Set(
        run.items
          .filter(item => item.kind === 'observable_entry' && isRecord(item.payload))
          .map(item => item.payload.entryId)
          .filter((entryId): entryId is string => typeof entryId === 'string'),
      ),
    ]),
  );
  const comparisonIds = new Set<string>();
  for (const [index, comparison] of comparisons.entries()) {
    assertNonEmptyString(comparison.comparisonId, `comparativeEvidence[${index}].comparisonId`);
    assertNonEmptyString(comparison.baselineRunRef, `comparativeEvidence[${index}].baselineRunRef`);
    assertNonEmptyString(comparison.candidateRunRef, `comparativeEvidence[${index}].candidateRunRef`);
    if (comparisonIds.has(comparison.comparisonId)) {
      throw new Error(`duplicate comparisonId: ${comparison.comparisonId}`);
    }
    comparisonIds.add(comparison.comparisonId);
    const baselineEntries = runEntryIds.get(comparison.baselineRunRef);
    const candidateEntries = runEntryIds.get(comparison.candidateRunRef);
    if (!baselineEntries || !candidateEntries) {
      throw new Error(`comparative evidence references unknown run: ${comparison.comparisonId}`);
    }
    for (const [observationIndex, observation] of comparison.feedback.observations.entries()) {
      for (const entryId of observation.experienceARefs) {
        if (!baselineEntries.has(entryId)) {
          throw new Error(
            `comparative evidence ${comparison.comparisonId} references unknown baseline entry: ${entryId}`,
          );
        }
      }
      for (const entryId of observation.experienceBRefs) {
        if (!candidateEntries.has(entryId)) {
          throw new Error(
            `comparative evidence ${comparison.comparisonId} references unknown candidate entry: ${entryId}`,
          );
        }
      }
      if (!observation.comparison) {
        throw new Error(`comparative evidence observation ${observationIndex} must be non-empty`);
      }
    }
  }
}

function comparativeRefsForPattern(
  occurrences: ContextOccurrence[],
  comparisons: ExperiencePatternComparativeInput[],
): string[] {
  const matchingEntriesByRun = new Map<string, Set<string>>();
  for (const occurrence of occurrences) {
    const entries = matchingEntriesByRun.get(occurrence.runRef) ?? new Set<string>();
    entries.add(occurrence.entryId);
    matchingEntriesByRun.set(occurrence.runRef, entries);
  }
  const refs: string[] = [];
  for (const comparison of comparisons) {
    const baselineEntries = matchingEntriesByRun.get(comparison.baselineRunRef) ?? new Set<string>();
    const candidateEntries = matchingEntriesByRun.get(comparison.candidateRunRef) ?? new Set<string>();
    comparison.feedback.observations.forEach((observation, index) => {
      const referencesPattern = observation.experienceARefs.some(entryId => baselineEntries.has(entryId))
        || observation.experienceBRefs.some(entryId => candidateEntries.has(entryId));
      if (referencesPattern) refs.push(comparisonObservationRef(comparison.comparisonId, index));
    });
  }
  return [...new Set(refs)].sort();
}

function buildPattern(
  index: number,
  occurrences: ContextOccurrence[],
  comparisons: ExperiencePatternComparativeInput[],
): ExperiencePattern {
  const supportingRuns = [...new Set(occurrences.map(occurrence => occurrence.runRef))].sort();
  const firstContext = occurrences[0]!.context;
  const evidenceRefs = [
    ...occurrences.map(occurrence => runEvidenceRef(occurrence.runRef, occurrence.evidenceId)),
    ...comparativeRefsForPattern(occurrences, comparisons),
  ];
  return {
    patternId: `pattern-${String(index + 1).padStart(6, '0')}`,
    patternType: 'frequency',
    description: `重复出现的玩家可见体验语义：${firstContext.experienceCategory}；${firstContext.lifeStageMeaning ?? '未指定人生阶段'}。`,
    supportingRuns,
    evidenceRefs: [...new Set(evidenceRefs)].sort(),
    experienceContextRefs: [...new Set(
      occurrences.map(occurrence => contextRef(occurrence.runRef, occurrence.entryId)),
    )].sort(),
  };
}

export function extractExperiencePatternEvidence(input: {
  runs: ExperiencePatternRunInput[];
  comparativeEvidence: ExperiencePatternComparativeInput[];
}): ExperiencePatternEvidence {
  validateComparativeInputs(input.comparativeEvidence, input.runs);
  const grouped = collectOccurrences(input.runs);
  const repeated = [...grouped.entries()]
    .map(([fingerprint, occurrences]) => ({ fingerprint, occurrences }))
    .filter(({ occurrences }) => new Set(occurrences.map(occurrence => occurrence.runRef)).size >= 2)
    .sort((left, right) => left.fingerprint.localeCompare(right.fingerprint));
  return validateExperiencePatternEvidence({
    schemaVersion: 'experience-pattern-evidence-v1',
    patterns: repeated.map(({ occurrences }, index) =>
      buildPattern(index, occurrences, input.comparativeEvidence)),
  });
}
