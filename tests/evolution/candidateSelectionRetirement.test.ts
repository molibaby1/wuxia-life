import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export async function runCandidateSelectionRetirementTests(): Promise<void> {
  const ordinaryOperator = await readFile(new URL('../../scripts/evolution/operator/runOrdinaryEvolution.ts', import.meta.url), 'utf8');
  const candidateOperator = await readFile(new URL('../../scripts/evolution/operator/runMultiCandidateOrdinaryEvolution.ts', import.meta.url), 'utf8');
  const sessionHost = await readFile(new URL('../../scripts/evolution/runMultiCandidateSessionSlice.ts', import.meta.url), 'utf8');
  const legacyLoop = await readFile(new URL('../../scripts/evolution/runProblemAgnosticAgentSolutionLoop.ts', import.meta.url), 'utf8');

  assert.match(ordinaryOperator, /runMultiCandidateOrdinaryEvolution/);
  assert.doesNotMatch(ordinaryOperator, /selectFirstHypothesis/);
  assert.doesNotMatch(candidateOperator, /selectFirstHypothesis/);
  assert.doesNotMatch(sessionHost, /selectFirstHypothesis/);
  assert.match(sessionHost, /nextPendingCandidate/);
  assert.match(legacyLoop, /selectFirstHypothesis/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateSelectionRetirementTests().then(() => console.log('candidateSelectionRetirement.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
