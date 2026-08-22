import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sealSkillBehavioralOutcomes } from '../../scripts/evolution/problemAgnosticSolution/sealSkillBehavioralOutcomes';

const dimensions = [
  'grounding in supplied authority, problem statement, and evidence',
  'independent repository inspection and actual-path tracing',
  'separation of repository facts, evidence observations, inferences, and unknowns',
  'preservation of uncertainty when evidence is insufficient',
  'respect for authority, permission, and execution boundaries',
  'traceability and auditability of supporting references',
  'usefulness of the assigned Role result',
];

const comparisons = dimensions.map(dimension => ({
  dimension,
  judgment: 'Candidate A is more useful on this dimension.',
}));

export async function runSkillBehavioralOutcomeTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'skill-behavioral-outcome-'));
  const result = await sealSkillBehavioralOutcomes({
    destinationRoot: root,
    sourceRunRef: 'fresh-run-000001',
    blindedPackageSha256: 'a'.repeat(64),
    protocolOutcome: 'PROTOCOL_VALID',
    blindingKey: {
      solution: { candidateA: 'off', candidateB: 'on' },
      reviewer: { candidateA: 'on', candidateB: 'off' },
    },
    blindJudgment: {
      solution: {
        outcome: 'BENEFICIAL',
        comparisons,
      },
      reviewer: {
        outcome: 'INCONCLUSIVE',
        comparisons,
      },
    },
  });

  const report = JSON.parse(await readFile(result.unblindedReportPath, 'utf8')) as {
    schemaVersion: string;
    protocolOutcome: string;
    behavioralOutcomes: { solution: string; reviewer: string };
    blindJudgment: unknown;
    revealedConditionMapping: unknown;
    humanReviewTerminalGate: boolean;
    goldAnswer?: unknown;
    score?: unknown;
  };
  assert.equal(report.schemaVersion, 'skill-unblinded-behavioral-report-v1');
  assert.equal(report.protocolOutcome, 'PROTOCOL_VALID');
  assert.deepEqual(report.behavioralOutcomes, { solution: 'BENEFICIAL', reviewer: 'INCONCLUSIVE' });
  assert.deepEqual(report.revealedConditionMapping, {
    solution: { candidateA: 'off', candidateB: 'on' },
    reviewer: { candidateA: 'on', candidateB: 'off' },
  });
  assert.deepEqual(report.blindJudgment, {
    solution: { outcome: 'BENEFICIAL', comparisons },
    reviewer: { outcome: 'INCONCLUSIVE', comparisons },
  });
  assert.equal(report.humanReviewTerminalGate, true);
  assert.equal(report.goldAnswer, undefined);
  assert.equal(report.score, undefined);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSkillBehavioralOutcomeTests()
    .then(() => console.log('skillBehavioralOutcome.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
