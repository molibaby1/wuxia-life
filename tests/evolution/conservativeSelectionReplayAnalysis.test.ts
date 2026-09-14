import assert from 'node:assert/strict';
import {
  buildConservativeSelectionDiagnostic,
  sourceDecisionKey,
  type ConservativeSelectionAnalysisItem,
} from '../../scripts/evolution/conservativeSelectionReplay/analyzeConservativeSelectionReplay';
import {
  determineConservativeSelectionTerminalVerdict,
  validateConservativeSelectionHumanAuditResponse,
} from '../../scripts/evolution/conservativeSelectionReplay/finalizeConservativeSelectionReplay';
import type { ConservativeSelectionInput, ConservativeSelectionMapping, ConservativeSelectionTrustedResult } from '../../scripts/evolution/conservativeSelectionReplay/conservativeSelectionContracts';

const CASES = [
  'ordinary-run-20260910-000005',
  'ordinary-run-20260910-000006',
  'ordinary-run-20260910-000007',
  'ordinary-run-20260911-000002',
] as const;

function input(): ConservativeSelectionInput {
  return {
    schemaVersion: 'ae-conservative-selection-input-v1',
    baselineCandidateRef: 'candidate-A',
    candidates: [
      {
        candidateRef: 'candidate-A', hypothesis: '基线问题', observedBasis: '基线依据',
        feedbackRefs: ['feedback-A'], evidenceRefs: ['evidence-A'], unknowns: ['未知 A'], productSignificance: '意义 A',
      },
      {
        candidateRef: 'candidate-B', hypothesis: '挑战问题', observedBasis: '挑战依据',
        feedbackRefs: ['feedback-B'], evidenceRefs: ['evidence-B'], unknowns: ['未知 B'], productSignificance: '意义 B',
      },
    ],
  };
}

function mapping(): ConservativeSelectionMapping {
  return {
    schemaVersion: 'ae-conservative-selection-mapping-v1', caseId: 'case', presentationId: 'original',
    presentationSha256: '1'.repeat(64), blindInputSha256: '2'.repeat(64), baselineSourceHypothesisSha256: '3'.repeat(64),
    candidates: [
      { candidateRef: 'candidate-A', presentationIndex: 0, sourceIndex: 0, sourceHypothesisId: 'hypothesis-000001', sourceHypothesisSha256: '3'.repeat(64), isBaseline: true },
      { candidateRef: 'candidate-B', presentationIndex: 1, sourceIndex: 1, sourceHypothesisId: 'hypothesis-000002', sourceHypothesisSha256: '4'.repeat(64), isBaseline: false },
    ],
  };
}

function result(decision: 'KEEP_BASELINE' | 'OVERRIDE' | 'NO_CLEAR_PREFERENCE', selected: string | null, hash = '4'.repeat(64)): ConservativeSelectionTrustedResult {
  return {
    schemaVersion: 'ae-conservative-selection-result-v1', decision,
    selected: selected === null ? null : { candidateRef: selected, sourceIndex: 1, sourceHypothesisId: 'hypothesis-000002', sourceHypothesisSha256: hash, isBaseline: false },
    rationale: { baselineEligibility: 'ELIGIBLE', challengerEligibility: 'ELIGIBLE', decisiveComparison: '比较', boundednessReason: '有界', overallReason: '结论' },
    createdAt: '2026-09-14T00:00:00.000Z',
  };
}

function items(): ConservativeSelectionAnalysisItem[] {
  const output: ConservativeSelectionAnalysisItem[] = [];
  let ordinal = 0;
  for (const caseId of CASES) {
    for (const presentationId of ['original', 'reversed'] as const) {
      for (const sampleOrdinal of [1, 2, 3]) {
        ordinal += 1;
        output.push({
          job: { jobId: `job-${ordinal}`, invocationOrdinal: ordinal, caseId, presentationId, sampleOrdinal },
          result: caseId === CASES[2] ? result('NO_CLEAR_PREFERENCE', null) : result('KEEP_BASELINE', 'candidate-A'),
          input: input(), mapping: mapping(),
        });
      }
    }
  }
  return output;
}

export async function runConservativeSelectionReplayAnalysisTests(): Promise<void> {
  assert.equal(sourceDecisionKey(result('KEEP_BASELINE', 'candidate-A')), 'KEEP_BASELINE');
  assert.equal(sourceDecisionKey(result('NO_CLEAR_PREFERENCE', null)), 'NO_CLEAR_PREFERENCE');
  assert.equal(sourceDecisionKey(result('OVERRIDE', 'candidate-B')), `OVERRIDE:${'4'.repeat(64)}`);

  const built = buildConservativeSelectionDiagnostic({
    experimentSha256: 'a'.repeat(64), executionSha256: 'b'.repeat(64), plannedJobCount: 24, items: items(),
    executionCounts: { participantContractFailureCount: 0, technicalFailureCount: 0 },
  });
  const summary = built.machineSummary;
  assert.equal(summary.technicalSufficiency.pass, true);
  assert.equal(summary.validDecisionCount, 24);
  assert.equal(summary.pairwisePermutation.length, 12);
  assert.equal(summary.pairwisePermutation.filter(pair => pair.agreement === true).length, 12);
  assert.equal(summary.permutationGate.pass, true);
  assert.equal(summary.protection000005.pass, true);
  assert.equal(summary.concentration000007.pass, true);
  assert.equal(summary.overrideCount, 0);
  assert.equal(summary.overrideAuditRequired, false);

  const overrideItems = items();
  overrideItems[0].result = result('OVERRIDE', 'candidate-B');
  const withOverrideBuilt = buildConservativeSelectionDiagnostic({
    experimentSha256: 'a'.repeat(64), executionSha256: 'b'.repeat(64), plannedJobCount: 24, items: overrideItems,
    executionCounts: { participantContractFailureCount: 0, technicalFailureCount: 0 },
  });
  const withOverride = withOverrideBuilt.machineSummary;
  assert.equal(withOverride.overrideCount, 1);
  assert.equal(withOverrideBuilt.humanAuditRequest.items.length, 1);
  assert.equal(withOverrideBuilt.humanAuditMapping.items.length, 1);
  const auditBytes = JSON.stringify(withOverrideBuilt.humanAuditRequest);
  for (const forbidden of ['caseId', 'jobId', 'sampleOrdinal', 'presentationId', 'sourceIndex', 'sourceHypothesisId', 'sourceHypothesisSha256', 'original', 'reversed']) {
    assert.equal(auditBytes.includes(forbidden), false, `audit request leaked ${forbidden}`);
  }

  const insufficient = buildConservativeSelectionDiagnostic({
    experimentSha256: 'a'.repeat(64), executionSha256: 'b'.repeat(64), plannedJobCount: 24, items: items().slice(0, 8),
    executionCounts: { participantContractFailureCount: 1, technicalFailureCount: 2 },
  });
  assert.equal(insufficient.machineSummary.technicalSufficiency.pass, false);
  assert.equal(insufficient.machineSummary.technicalSufficiency.reasons.length > 0, true);

  const request = withOverrideBuilt.humanAuditRequest;
  const auditResponse = {
    schemaVersion: 'ae-conservative-selection-human-audit-response-v1',
    items: [{
      auditId: request.items[0].auditId,
      verdict: 'SUPPORTED_OVERRIDE',
      answers: {
        baselineInvestigationEligible: true,
        challengerInvestigationEligible: true,
        materiallySuperiorForSlot: true,
        superiorityNotBroadMaterialityOnly: true,
        challengerStillBounded: true,
        givingUpBaselineJustified: true,
      },
      note: '审计支持。',
    }],
  };
  assert.deepEqual(validateConservativeSelectionHumanAuditResponse(auditResponse, request), auditResponse);
  assert.throws(() => validateConservativeSelectionHumanAuditResponse({
    ...auditResponse,
    items: [{ ...auditResponse.items[0], auditId: 'unknown' }],
  }, request), /unknown auditId/i);
  assert.throws(() => validateConservativeSelectionHumanAuditResponse({
    ...auditResponse,
    items: [{ ...auditResponse.items[0], note: '' }],
  }, request), /note/i);
  assert.equal(
    determineConservativeSelectionTerminalVerdict(summary, [], 'supported', 'Human review note'),
    'CONSERVATIVE_OVERRIDE_SUPPORTED_ON_DIAGNOSTIC_CORPUS',
  );
  assert.equal(
    determineConservativeSelectionTerminalVerdict({ ...summary, protection000005: { ...summary.protection000005, pass: false } }, [], 'supported', 'Human review note'),
    'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED',
  );
  assert.equal(
    determineConservativeSelectionTerminalVerdict({ ...summary, permutationGate: { ...summary.permutationGate, pass: false } }, [], 'supported', 'Human review note'),
    'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED',
  );
  assert.equal(
    determineConservativeSelectionTerminalVerdict(insufficient.machineSummary, [], 'supported', 'Human review note'),
    'INCONCLUSIVE_TECHNICAL',
  );
  assert.equal(
    determineConservativeSelectionTerminalVerdict(summary, [{ verdict: 'UNSUPPORTED_OVERRIDE' }], 'supported', 'Human review note'),
    'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED',
  );
  assert.equal(
    determineConservativeSelectionTerminalVerdict(summary, [], 'not-supported', 'Human review note'),
    'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED',
  );
}

runConservativeSelectionReplayAnalysisTests().then(
  () => console.log('conservativeSelectionReplayAnalysis.test.ts: ok'),
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
