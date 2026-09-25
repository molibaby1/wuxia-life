import assert from 'node:assert/strict';
import {
  canAdmitCandidate,
  consumeHostSliceJobs,
  createHostSliceBudget,
  requiredCandidateAdmissionJobs,
} from '../../scripts/evolution/candidateSliceBudget';

export function runCandidateSliceBudgetTests(): void {
  assert.equal(requiredCandidateAdmissionJobs({ sourceTransitionAvailable: true }), 5);
  assert.equal(requiredCandidateAdmissionJobs({ sourceTransitionAvailable: false }), 5);
  assert.equal(canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 7, remainingParticipantJobs: 4 }, sourceTransitionAvailable: true }), false);
  assert.equal(canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 7, remainingParticipantJobs: 4 }, sourceTransitionAvailable: false }), false);
  assert.equal(canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 6, remainingParticipantJobs: 5 }, sourceTransitionAvailable: true }), true);
  assert.equal(canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 6, remainingParticipantJobs: 5 }, sourceTransitionAvailable: false }), true);
  assert.deepEqual(consumeHostSliceJobs(createHostSliceBudget(), 2), { maxParticipantJobs: 11, usedParticipantJobs: 2, remainingParticipantJobs: 9 });
  assert.throws(() => consumeHostSliceJobs({ maxParticipantJobs: 11, usedParticipantJobs: 12, remainingParticipantJobs: -1 }, 0), /usedParticipantJobs/);
  assert.throws(() => consumeHostSliceJobs(createHostSliceBudget(), 12), /exceeded/);
  assert.throws(() => canAdmitCandidate({ budget: { maxParticipantJobs: 11, usedParticipantJobs: 1, remainingParticipantJobs: 8 }, sourceTransitionAvailable: false }), /remainingParticipantJobs/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runCandidateSliceBudgetTests();
    console.log('candidateSliceBudget.test.ts: ok');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
