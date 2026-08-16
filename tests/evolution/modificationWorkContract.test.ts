import assert from 'node:assert/strict';
import {
  parseModificationWorkResult,
  parseModificationWorkResultV2,
  validateModificationWorkReferences,
  validateModificationWorkReferencesV2,
} from '../../src/evolution/modificationWorkContract';
import { projectInvestigationHandoff } from '../../src/evolution/investigationHandoff';
import type { HypothesisInvestigationResult } from '../../src/evolution/hypothesisInvestigationContract';

const validProposal = {
  kind: 'proposal',
  proposedChange: '让婚姻选择后，玩家仍能在后续事件中看见自己放弃的情感线索。',
  scopeRefs: ['current-catalog:family_marriage'],
  evidenceRefs: ['feedback:observations[3]', 'current-catalog:family_marriage'],
  expectedPlayerObservableDifference: '选择门当户对后，后续家庭事件仍会出现与明月相关的可见后果，而不是情感线直接消失。',
  unknowns: ['单次 run 不能证明多数玩家都需要这条补偿。'],
  risks: ['可能把一次主观遗憾做成强制道德说教。'],
  nonGoals: ['不改结局判定', '不新增独立恋爱系统'],
};

const validNoProposal = {
  kind: 'no_proposal',
  reason: '当前 evidence 不足以提出一项 bounded、player-observable 的修改工作。',
};

const allowedEvidence = new Set([
  'feedback:observations[3]',
  'current-catalog:family_marriage',
  'source-catalog:family_marriage',
]);
const allowedScope = new Set(['current-catalog:family_marriage']);

export function runModificationWorkContractTests(): void {
  const proposal = parseModificationWorkResult(JSON.stringify(validProposal));
  assert.equal(proposal.kind, 'proposal');
  if (proposal.kind !== 'proposal') return;
  assert.equal(proposal.proposedChange, validProposal.proposedChange);
  assert.deepEqual(proposal.scopeRefs, validProposal.scopeRefs);
  assert.deepEqual(proposal.evidenceRefs, validProposal.evidenceRefs);
  assert.equal(
    proposal.expectedPlayerObservableDifference,
    validProposal.expectedPlayerObservableDifference,
  );
  assert.deepEqual(proposal.unknowns, validProposal.unknowns);
  assert.deepEqual(proposal.risks, validProposal.risks);
  assert.deepEqual(proposal.nonGoals, validProposal.nonGoals);

  const noProposal = parseModificationWorkResult(JSON.stringify(validNoProposal));
  assert.equal(noProposal.kind, 'no_proposal');
  if (noProposal.kind !== 'no_proposal') return;
  assert.equal(noProposal.reason, validNoProposal.reason);

  for (const forbidden of [
    'patch',
    'codePatch',
    'filePath',
    'filePaths',
    'implementationSteps',
    'prd',
    'shellCommand',
    'score',
    'confidence',
    'severity',
    'priority',
    'candidate',
    'promotion',
  ]) {
    assert.throws(() => parseModificationWorkResult(JSON.stringify({
      ...validProposal,
      [forbidden]: 'not allowed',
    })), /unknown field/i);
    assert.throws(() => parseModificationWorkResult(JSON.stringify({
      ...validNoProposal,
      [forbidden]: 'not allowed',
    })), /unknown field/i);
  }

  assert.throws(
    () => parseModificationWorkResult(JSON.stringify({ kind: 'maybe' })),
    /kind|proposal|no_proposal/i,
  );
  assert.throws(
    () => parseModificationWorkResult(JSON.stringify({
      kind: 'proposal',
      proposedChange: '',
      scopeRefs: ['current-catalog:family_marriage'],
      evidenceRefs: ['feedback:observations[3]'],
      expectedPlayerObservableDifference: '可见差异。',
      unknowns: [],
      risks: [],
      nonGoals: [],
    })),
    /proposedChange/i,
  );
  assert.throws(
    () => parseModificationWorkResult(JSON.stringify({
      kind: 'proposal',
      proposedChange: '改一下。',
      scopeRefs: [],
      evidenceRefs: ['feedback:observations[3]'],
      expectedPlayerObservableDifference: '可见差异。',
      unknowns: [],
      risks: [],
      nonGoals: [],
    })),
    /scopeRefs/i,
  );
  assert.throws(
    () => parseModificationWorkResult(JSON.stringify({
      kind: 'proposal',
      proposedChange: '改一下。',
      scopeRefs: ['current-catalog:family_marriage'],
      evidenceRefs: [],
      expectedPlayerObservableDifference: '可见差异。',
      unknowns: [],
      risks: [],
      nonGoals: [],
    })),
    /evidenceRefs/i,
  );
  assert.throws(
    () => parseModificationWorkResult(JSON.stringify({
      kind: 'no_proposal',
      reason: '',
    })),
    /reason/i,
  );
  assert.throws(() => parseModificationWorkResult('[]'), /must be an object/i);
  assert.throws(() => parseModificationWorkResult('{}'), /kind|missing required field/i);

  validateModificationWorkReferences(proposal, allowedEvidence, allowedScope);
  validateModificationWorkReferences(noProposal, allowedEvidence, allowedScope);

  assert.throws(
    () => validateModificationWorkReferences(
      parseModificationWorkResult(JSON.stringify({
        ...validProposal,
        evidenceRefs: ['feedback:observations[3]', 'source-catalog:not-real'],
      })),
      allowedEvidence,
      allowedScope,
    ),
    /source-catalog:not-real|unknown evidence/i,
  );
  assert.throws(
    () => validateModificationWorkReferences(
      parseModificationWorkResult(JSON.stringify({
        ...validProposal,
        scopeRefs: ['source-catalog:family_marriage'],
      })),
      allowedEvidence,
      allowedScope,
    ),
    /source-catalog:family_marriage|unknown scope|current-product/i,
  );

  runModificationWorkContractV2Tests();
}

function sampleHandoffInvestigation(): HypothesisInvestigationResult {
  return {
    confirmedFacts: [{
      statement: '本次 run 选择了 marry_arranged。',
      evidenceRefs: ['source-catalog:family_marriage'],
    }],
    relevantMechanisms: [{
      statement: 'family_marriage 提供迎娶明月与门当户对选项。',
      evidenceRefs: ['current-catalog:family_marriage'],
    }],
    limitingEvidence: [{
      statement: '单次 evidence 不能证明多数玩家。',
      evidenceRefs: ['feedback:observations[3]'],
    }],
    unresolvedQuestions: ['玩家是否理解该机制？'],
    evidenceGaps: ['缺少对照 run。'],
  };
}

function runModificationWorkContractV2Tests(): void {
  const handoff = projectInvestigationHandoff(sampleHandoffInvestigation());
  const basisConfirmed = 'investigation:confirmed-fact:000001';
  const basisMech = 'investigation:relevant-mechanism:000001';
  const unresolvedQ = 'investigation:unresolved-question:000001';
  const gap = 'investigation:evidence-gap:000001';

  const validProposalV2 = {
    kind: 'proposal',
    proposedChange: '让婚姻选择后仍能看见放弃的情感线索。',
    scopeRefs: ['current-catalog:family_marriage'],
    evidenceRefs: ['feedback:observations[3]', 'current-catalog:family_marriage'],
    investigationBasisRefs: [basisConfirmed, basisMech],
    unresolvedDependencyRefs: [] as string[],
    assumptions: [] as Array<{ statement: string; relatedInvestigationRefs: string[] }>,
    expectedPlayerObservableDifference: '后续家庭事件仍出现与明月相关的可见后果。',
    risks: ['可能说教。'],
    nonGoals: ['不改结局判定'],
  };

  // C1
  const proposal = parseModificationWorkResultV2(JSON.stringify(validProposalV2));
  assert.equal(proposal.kind, 'proposal');
  if (proposal.kind !== 'proposal') return;
  validateModificationWorkReferencesV2(proposal, allowedEvidence, allowedScope, handoff);

  // C2
  const withUncertainty = parseModificationWorkResultV2(JSON.stringify({
    ...validProposalV2,
    unresolvedDependencyRefs: [unresolvedQ, gap],
    assumptions: [{
      statement: '玩家会把可见后果理解为对选择的反馈。',
      relatedInvestigationRefs: [unresolvedQ],
    }],
  }));
  assert.equal(withUncertainty.kind, 'proposal');
  validateModificationWorkReferencesV2(withUncertainty, allowedEvidence, allowedScope, handoff);

  // C3
  assert.throws(
    () => validateModificationWorkReferencesV2(
      parseModificationWorkResultV2(JSON.stringify({
        ...validProposalV2,
        investigationBasisRefs: [unresolvedQ],
      })),
      allowedEvidence,
      allowedScope,
      handoff,
    ),
    /investigationBasisRefs|unresolved_question/i,
  );

  // C4
  assert.throws(
    () => validateModificationWorkReferencesV2(
      parseModificationWorkResultV2(JSON.stringify({
        ...validProposalV2,
        unresolvedDependencyRefs: [basisConfirmed],
      })),
      allowedEvidence,
      allowedScope,
      handoff,
    ),
    /unresolvedDependencyRefs|confirmed_fact/i,
  );

  // C5
  assert.throws(
    () => validateModificationWorkReferencesV2(
      parseModificationWorkResultV2(JSON.stringify({
        ...validProposalV2,
        investigationBasisRefs: ['investigation:confirmed-fact:999999'],
      })),
      allowedEvidence,
      allowedScope,
      handoff,
    ),
    /unknown handoff ref/i,
  );

  // C6
  assert.throws(
    () => validateModificationWorkReferencesV2(
      parseModificationWorkResultV2(JSON.stringify({
        ...validProposalV2,
        assumptions: [{
          statement: '新假设。',
          relatedInvestigationRefs: ['investigation:evidence-gap:999999'],
        }],
      })),
      allowedEvidence,
      allowedScope,
      handoff,
    ),
    /relatedInvestigationRefs|unknown handoff ref/i,
  );

  // C7
  const emptyAssumptions = parseModificationWorkResultV2(JSON.stringify({
    ...validProposalV2,
    assumptions: [],
  }));
  validateModificationWorkReferencesV2(emptyAssumptions, allowedEvidence, allowedScope, handoff);

  // C8
  const noProposal = parseModificationWorkResultV2(JSON.stringify({
    kind: 'no_proposal',
    reason: '材料不足以提出 bounded proposal。',
  }));
  assert.equal(noProposal.kind, 'no_proposal');
  validateModificationWorkReferencesV2(noProposal, allowedEvidence, allowedScope, handoff);

  // C9
  assert.throws(
    () => parseModificationWorkResultV2(JSON.stringify({
      ...validProposalV2,
      unknowns: ['should fail'],
    })),
    /unknown field/i,
  );

  // C10 — v1 proposal still parses with v1 parser
  const v1StillWorks = parseModificationWorkResult(JSON.stringify(validProposal));
  assert.equal(v1StillWorks.kind, 'proposal');
  if (v1StillWorks.kind === 'proposal') {
    assert.ok(Array.isArray(v1StillWorks.unknowns));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runModificationWorkContractTests();
  console.log('modificationWorkContract.test.ts: ok');
}
