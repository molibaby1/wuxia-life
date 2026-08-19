import assert from 'node:assert/strict';
import {
  routeSolutionDecision,
  type RouteSolutionDecisionInput,
} from '../../scripts/evolution/problemAgnosticSolution/routeSolutionDecision';

const base: RouteSolutionDecisionInput = {
  problemId: 'problem-000001',
  solutionStatus: 'OPTIONS',
  reviewerDecision: 'ACCEPT_OPTION',
  solutionScope: 'configuration',
  reviewScope: 'config_only',
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
  budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
};

function route(input: Partial<RouteSolutionDecisionInput>) {
  return routeSolutionDecision({ ...base, ...input });
}

export function runSolutionDecisionRouterTests(): void {
  assert.equal(route({}).route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(route({ solutionScope: 'program' }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ solutionScope: 'configuration', reviewScope: 'mixed' }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null }).route, 'SKIP');
  assert.equal(route({ solutionStatus: 'INSUFFICIENT_EVIDENCE', reviewerDecision: null, solutionScope: null, reviewScope: null }).route, 'DEFER');
  assert.equal(route({ reviewerDecision: 'REJECT' }).route, 'SKIP');
  assert.equal(route({ reviewerDecision: 'REQUEST_MORE_WORK' }).route, 'DEFER_MORE_WORK_REQUESTED');
  assert.equal(route({ reviewerDecision: 'DEFER' }).route, 'DEFER');
  assert.equal(route({ reviewerDecision: 'ESCALATE' }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ solutionStatus: 'ESCALATE', reviewerDecision: null, solutionScope: null, reviewScope: null }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ reviewerDecision: 'ACCEPT_NO_ACTION' }).route, 'SKIP');

  const first = route({ problemId: 'problem-a', solutionText: 'different prose' } as Partial<RouteSolutionDecisionInput>);
  const second = route({ problemId: 'problem-b', solutionText: 'another domain-shaped prose' } as Partial<RouteSolutionDecisionInput>);
  assert.equal(first.route, second.route);
  assert.equal(first.reasonCode, second.reasonCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionDecisionRouterTests();
  console.log('solutionDecisionRouter.test.ts: ok');
}
