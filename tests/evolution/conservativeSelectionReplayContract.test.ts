import assert from 'node:assert/strict';
import {
  buildConservativeSelectionProjection,
  parseConservativeSelectionResponse,
  projectConservativeSelectionResult,
  validateConservativeSelectionProjection,
  type ConservativeSelectionInput,
} from '../../scripts/evolution/conservativeSelectionReplay/conservativeSelectionContracts';
import {
  buildSelectionPriorityReplayPresentation,
  type SelectionPriorityReplayCandidate,
  type SelectionPriorityReplayPresentation,
} from '../../scripts/evolution/selectionPriorityReplay/selectionPriorityReplay';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';

function candidate(id: string, label: string, sourceIndex: number): SelectionPriorityReplayCandidate {
  const hypothesis = {
    hypothesisId: id,
    hypothesis: `问题 ${label}`,
    observedBasis: `依据 ${label}`,
    feedbackRefs: [`feedback-${label}`],
    evidenceRefs: [`evidence-${label}`],
    unknowns: [`未知 ${label}`],
    productSignificance: `意义 ${label}`,
  };
  return {
    presentationIndex: sourceIndex,
    sourceIndex,
    sourceHypothesisId: id,
    sourceHypothesisSha256: sha256Hex(canonicalJson(hypothesis)),
    ...hypothesis,
  };
}

function presentation(order: 'original' | 'reversed', candidates: SelectionPriorityReplayCandidate[]) {
  return buildSelectionPriorityReplayPresentation({
    caseId: 'case-000001',
    presentationId: `case-000001-${order}`,
    order,
    sourceHypothesesSha256: '1'.repeat(64),
    candidates,
  });
}

function validResponse(input: ConservativeSelectionInput, decision: string, selectedCandidateRef: string | null) {
  return {
    schemaVersion: 'ae-conservative-selection-response-v1',
    decision,
    selectedCandidateRef,
    rationale: {
      baselineEligibility: 'ELIGIBLE',
      challengerEligibility: 'NOT_APPLICABLE',
      decisiveComparison: 'No challenger has clear superiority.',
      boundednessReason: 'The baseline is bounded.',
      overallReason: `Keep ${input.baselineCandidateRef}.`,
    },
  };
}

export async function runConservativeSelectionReplayContractTests(): Promise<void> {
  const sourceCandidates = [candidate('hypothesis-000001', 'A', 0), candidate('hypothesis-000002', 'B', 1)];
  const original = presentation('original', sourceCandidates);
  const reversed = presentation('reversed', [...sourceCandidates].reverse());
  const originalProjection = buildConservativeSelectionProjection(original);
  const reversedProjection = buildConservativeSelectionProjection(reversed);

  assert.equal(originalProjection.input.schemaVersion, 'ae-conservative-selection-input-v1');
  assert.equal(originalProjection.input.baselineCandidateRef, 'candidate-A');
  assert.equal(originalProjection.mapping.candidates.filter(item => item.isBaseline).length, 1);
  assert.equal(originalProjection.mapping.candidates.find(item => item.isBaseline)?.sourceIndex, 0);
  assert.equal(reversedProjection.input.baselineCandidateRef, 'candidate-B');
  assert.equal(reversedProjection.mapping.candidates.find(item => item.isBaseline)?.sourceIndex, 0);
  assert.deepEqual(
    originalProjection.input.candidates
      .map(({ candidateRef: _ref, ...semantic }) => semantic)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    reversedProjection.input.candidates
      .map(({ candidateRef: _ref, ...semantic }) => semantic)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
  );

  const visibleBytes = JSON.stringify(originalProjection.input);
  for (const forbidden of [
    'sourceIndex', 'sourceHypothesisId', 'sourceHypothesisSha256', 'presentationIndex',
    'historicalSelectedHypothesisId', 'presentationId', '-original', '-reversed',
  ]) {
    assert.equal(visibleBytes.includes(forbidden), false, `visible input leaked ${forbidden}`);
  }

  assert.doesNotThrow(() => validateConservativeSelectionProjection(
    original,
    originalProjection.input,
    originalProjection.mapping,
  ));
  assert.throws(() => validateConservativeSelectionProjection(original, originalProjection.input, {
    ...originalProjection.mapping,
    candidates: originalProjection.mapping.candidates.map(item => ({ ...item, sourceIndex: 1 })),
  }), /source identity|sourceIndex|baseline/i);

  const keep = parseConservativeSelectionResponse(
    JSON.stringify(validResponse(originalProjection.input, 'KEEP_BASELINE', originalProjection.input.baselineCandidateRef)),
    originalProjection.input,
  );
  assert.equal(keep.selectedCandidateRef, originalProjection.input.baselineCandidateRef);
  const override = parseConservativeSelectionResponse(
    JSON.stringify(validResponse(originalProjection.input, 'OVERRIDE', 'candidate-B')),
    originalProjection.input,
  );
  assert.equal(override.selectedCandidateRef, 'candidate-B');
  const abstain = parseConservativeSelectionResponse(
    JSON.stringify(validResponse(originalProjection.input, 'NO_CLEAR_PREFERENCE', null)),
    originalProjection.input,
  );
  assert.equal(abstain.selectedCandidateRef, null);

  for (const extraKey of ['score', 'ranking', 'confidence', 'secondChoice', 'alternativeCandidates']) {
    const raw = { ...validResponse(originalProjection.input, 'KEEP_BASELINE', 'candidate-A'), [extraKey]: 1 };
    assert.throws(() => parseConservativeSelectionResponse(JSON.stringify(raw), originalProjection.input), /unknown field/i);
  }
  assert.throws(
    () => parseConservativeSelectionResponse(
      JSON.stringify(validResponse(originalProjection.input, 'OVERRIDE', 'candidate-A')),
      originalProjection.input,
    ),
    /baseline|candidate/i,
  );

  const trusted = projectConservativeSelectionResult(override, originalProjection.mapping, '2026-09-14T00:00:00.000Z');
  assert.equal(trusted.selected?.sourceIndex, 1);
  assert.equal(trusted.selected?.sourceHypothesisId, 'hypothesis-000002');
  const trustedAbstain = projectConservativeSelectionResult(abstain, originalProjection.mapping, '2026-09-14T00:00:00.000Z');
  assert.equal(trustedAbstain.selected, null);
}

runConservativeSelectionReplayContractTests().then(
  () => console.log('conservativeSelectionReplayContract.test.ts: ok'),
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
