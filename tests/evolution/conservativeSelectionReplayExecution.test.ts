import assert from 'node:assert/strict';
import {
  CONSERVATIVE_SELECTION_SYSTEM_PROMPT,
  buildConservativeSelectionUserContent,
} from '../../scripts/evolution/conservativeSelectionReplay/deepseekConservativeSelection';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';

export async function runConservativeSelectionReplayExecutionTests(): Promise<void> {
  const prompt = CONSERVATIVE_SELECTION_SYSTEM_PROMPT;
  assert.match(prompt, /deterministic fallback/i);
  assert.match(prompt, /Evidence Readiness/i);
  assert.match(prompt, /Problem Specificity/i);
  assert.match(prompt, /clear superiority/i);
  assert.match(prompt, /broader.*does not.*better|更宏大.*不/i);
  assert.match(prompt, /KEEP_BASELINE/);
  assert.match(prompt, /OVERRIDE/);
  assert.match(prompt, /NO_CLEAR_PREFERENCE/);
  assert.match(prompt, /baseline.*eligible.*KEEP/i);
  assert.match(prompt, /exactly one/i);
  assert.doesNotMatch(prompt, /historical selected/i);
  assert.doesNotMatch(prompt, /sourceIndex/i);

  const userContent = buildConservativeSelectionUserContent({
    schemaVersion: 'ae-conservative-selection-input-v1',
    baselineCandidateRef: 'candidate-A',
    candidates: [],
  });
  assert.equal(userContent, canonicalJson({
    schemaVersion: 'ae-conservative-selection-input-v1',
    baselineCandidateRef: 'candidate-A',
    candidates: [],
  }));
}

runConservativeSelectionReplayExecutionTests().then(
  () => console.log('conservativeSelectionReplayExecution.test.ts: ok'),
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
