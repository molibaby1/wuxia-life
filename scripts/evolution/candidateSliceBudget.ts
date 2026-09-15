export interface HostSliceBudgetV1 {
  maxParticipantJobs: 11;
  usedParticipantJobs: number;
  remainingParticipantJobs: number;
}

function validateBudget(budget: HostSliceBudgetV1): HostSliceBudgetV1 {
  if (budget.maxParticipantJobs !== 11) throw new Error('maxParticipantJobs must be 11');
  if (!Number.isInteger(budget.usedParticipantJobs) || budget.usedParticipantJobs < 0 || budget.usedParticipantJobs > 11) {
    throw new Error('usedParticipantJobs must be an integer from 0 to 11');
  }
  if (budget.remainingParticipantJobs !== 11 - budget.usedParticipantJobs) {
    throw new Error('remainingParticipantJobs does not match usedParticipantJobs');
  }
  return { ...budget };
}

export function createHostSliceBudget(): HostSliceBudgetV1 {
  return { maxParticipantJobs: 11, usedParticipantJobs: 0, remainingParticipantJobs: 11 };
}

export function consumeHostSliceJobs(budget: HostSliceBudgetV1, count: number): HostSliceBudgetV1 {
  const current = validateBudget(budget);
  if (!Number.isInteger(count) || count < 0) throw new Error('count must be a non-negative integer');
  if (current.usedParticipantJobs + count > 11) throw new Error('Host slice Participant job budget exceeded');
  return {
    maxParticipantJobs: 11,
    usedParticipantJobs: current.usedParticipantJobs + count,
    remainingParticipantJobs: 11 - current.usedParticipantJobs - count,
  };
}

export function requiredCandidateAdmissionJobs(input: { sourceTransitionAvailable: boolean }): 4 | 5 {
  return input.sourceTransitionAvailable ? 5 : 4;
}

export function canAdmitCandidate(input: { budget: HostSliceBudgetV1; sourceTransitionAvailable: boolean }): boolean {
  const budget = validateBudget(input.budget);
  return budget.remainingParticipantJobs >= requiredCandidateAdmissionJobs(input);
}
