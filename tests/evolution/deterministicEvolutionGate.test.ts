import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import {
  DETERMINISTIC_EVOLUTION_SUITES,
  runDeterministicEvolutionSuites,
} from './runDeterministicEvolutionTests.ts';

const REQUIRED_CRITICAL_ENTRIES = [
  'tests/evolution/candidatePoolContract.test.ts',
  'tests/evolution/candidateSessionStore.test.ts',
  'tests/evolution/candidateSliceBudget.test.ts',
  'tests/evolution/multiCandidateSessionManifestContract.test.ts',
  'tests/evolution/candidateLaneFailureContract.test.ts',
  'tests/evolution/sourceCandidateAnalysis.test.ts',
  'tests/evolution/sourceCandidatePool.test.ts',
  'tests/evolution/candidateLane.test.ts',
  'tests/evolution/candidateReviewContinuation.test.ts',
  'tests/evolution/candidateSessionReconciliation.test.ts',
  'tests/evolution/participantHardTimeoutPolicyV1.test.ts',
  'tests/evolution/participantFailureOutcomeContract.test.ts',
  'tests/evolution/participantFailureRouting.test.ts',
  'tests/evolution/structuredTerminalEnvelope.test.ts',
  'tests/evolution/envelopeRetransmission.test.ts',
  'tests/evolution/referenceParticipantBinding.test.ts',
  'tests/evolution/problemAgnosticSolutionContracts.test.ts',
  'tests/evolution/solutionAgentLoop.test.ts',
  'tests/evolution/solutionReviewerLoop.test.ts',
  'tests/evolution/solutionDecisionRouter.test.ts',
  'tests/evolution/autonomousAuthoringContracts.test.ts',
  'tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts',
  'tests/evolution/shadowAuthoringExecution.test.ts',
  'tests/evolution/preschoolShadowAuthoringVerification.test.ts',
  'tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts',
  'tests/evolution/multiCandidateSessionSlice.test.ts',
  'tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts',
  'tests/evolution/ordinaryEvolutionOperator.test.ts',
] as const;

const suiteNames = DETERMINISTIC_EVOLUTION_SUITES.map(suite => suite.name);
const suiteEntries = DETERMINISTIC_EVOLUTION_SUITES.map(suite => suite.entry);
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
assert.equal(
  packageJson.scripts?.['test:evolution:deterministic'],
  'tsx tests/evolution/runDeterministicEvolutionTests.ts',
);
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
function extractCiCheckoutStep(workflow: string): string[] {
  const lines = workflow.split(/\r?\n/);
  const stepStart = lines.findIndex(line => /^\s*-\s*name:\s*Checkout\s*$/.test(line));
  if (stepStart === -1) return [];

  const stepIndent = lines[stepStart].search(/\S/);
  const stepEnd = lines.findIndex((line, index) =>
    index > stepStart
    && line.trim() !== ''
    && line.search(/\S/) === stepIndent
    && /^-\s+name:/.test(line.slice(stepIndent)),
  );
  return lines.slice(stepStart, stepEnd === -1 ? lines.length : stepEnd);
}
const checkoutStep = extractCiCheckoutStep(ciWorkflow);
assert.ok(
  checkoutStep.some(line => /^\s+uses:\s*actions\/checkout@v4\s*$/.test(line)),
  'CI must contain a Checkout step using actions/checkout@v4',
);
const checkoutWithIndex = checkoutStep.findIndex(line => /^\s+with:\s*$/.test(line));
const checkoutWithIndent = checkoutWithIndex === -1
  ? -1
  : checkoutStep[checkoutWithIndex].search(/\S/);
const checkoutWithEnd = checkoutWithIndex === -1
  ? -1
  : checkoutStep.findIndex((line, index) =>
    index > checkoutWithIndex
    && line.trim() !== ''
    && line.search(/\S/) <= checkoutWithIndent,
  );
const checkoutWithBlock = checkoutWithIndex === -1
  ? []
  : checkoutStep.slice(checkoutWithIndex + 1, checkoutWithEnd === -1 ? checkoutStep.length : checkoutWithEnd);
assert.ok(
  checkoutWithBlock.some(line => {
    const indent = line.search(/\S/);
    return indent === checkoutWithIndent + 2 && /^fetch-depth:\s*0\s*$/.test(line.slice(indent));
  }),
  'CI Checkout must fetch full git history for pinned historical baseline tests',
);
assert.match(ciWorkflow, /^\s*run:\s*npm run test:evolution:deterministic\s*$/m);
assert.match(
  ciWorkflow,
  /^[ \t]*run:[ \t]*npx tsx tests\/evolution\/deterministicEvolutionGate\.test\.ts[ \t]*$/m,
  'CI must run the deterministic evolution gate trigger meta-test',
);
function extractCiPushBranches(workflow: string): string[] {
  const lines = workflow.split(/\r?\n/);
  const pushIndex = lines.findIndex(line => /^  push:\s*$/.test(line));
  if (pushIndex === -1) return [];

  const pushEnd = lines.findIndex(
    (line, index) => index > pushIndex && line.trim() !== '' && !line.startsWith(' '),
  );
  const pushBlock = lines.slice(pushIndex + 1, pushEnd === -1 ? lines.length : pushEnd);
  const branchesIndex = pushBlock.findIndex(line => /^    branches:\s*$/.test(line));
  if (branchesIndex === -1) return [];

  const branches: string[] = [];
  for (const line of pushBlock.slice(branchesIndex + 1)) {
    if (line.trim() === '') continue;
    if (/^    \S/.test(line)) break;
    if (/^      -\s/.test(line)) branches.push(line.replace(/^      -\s*/, '').trim());
  }
  return branches;
}
assert.ok(
  extractCiPushBranches(ciWorkflow).includes('dev'),
  'CI workflow push.branches must include dev',
);
assert.equal(new Set(suiteNames).size, suiteNames.length, 'suite names must be unique');
assert.equal(new Set(suiteEntries).size, suiteEntries.length, 'suite entry paths must be unique');

for (const suite of DETERMINISTIC_EVOLUTION_SUITES) {
  assert.ok(suite.entry.startsWith('tests/evolution/'), suite.entry);
  assert.ok(suite.entry.endsWith('.test.ts'), suite.entry);
  assert.equal(statSync(suite.entry).isFile(), true, suite.entry);
}

for (const entry of REQUIRED_CRITICAL_ENTRIES) {
  assert.ok(suiteEntries.includes(entry), `missing critical deterministic suite: ${entry}`);
}

const CAMPAIGN_STYLE_NAMES = [
  'CommunicationMatrix',
  'SolutionCommunicationProbe',
  'ArtifactBackedSolutionProbe',
] as const;
for (const suite of DETERMINISTIC_EVOLUTION_SUITES) {
  for (const forbiddenName of CAMPAIGN_STYLE_NAMES) {
    assert.equal(
      suite.entry.includes(forbiddenName),
      false,
      `campaign-style entry is forbidden: ${suite.entry}`,
    );
  }
}

async function testAggregateRunnerInvariants(): Promise<void> {
  const attemptedEntries: string[] = [];
  const results = await runDeterministicEvolutionSuites(
    DETERMINISTIC_EVOLUTION_SUITES,
    async suite => {
      attemptedEntries.push(suite.entry);
      if (attemptedEntries.length === 2) return 7;
      if (attemptedEntries.length === 3) return null;
      return 0;
    },
  );

  assert.deepEqual(
    attemptedEntries,
    DETERMINISTIC_EVOLUTION_SUITES.map(suite => suite.entry),
    'every suite must be attempted in manifest order after earlier failures',
  );
  assert.equal(results.length, DETERMINISTIC_EVOLUTION_SUITES.length);
  assert.deepEqual(results.slice(0, 3).map(result => result.status), [0, 7, null]);
  assert.equal(results.filter(result => result.status !== 0).length, 2);
}

void testAggregateRunnerInvariants()
  .then(() => process.stdout.write('deterministicEvolutionGate.test.ts: membership and runner invariants ok\n'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
