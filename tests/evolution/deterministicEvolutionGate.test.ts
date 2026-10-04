import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { DETERMINISTIC_EVOLUTION_SUITES } from './runDeterministicEvolutionTests.ts';

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

process.stdout.write('deterministicEvolutionGate.test.ts: membership ok\n');
