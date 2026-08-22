import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildSkillBlindedReviewPackage,
  type SkillBehavioralConditionArtifact,
} from '../../scripts/evolution/problemAgnosticSolution/buildSkillBlindedReviewPackage';

const solutionArtifact = (condition: 'off' | 'on'): SkillBehavioralConditionArtifact => ({
  condition,
  invocationRef: `skill-validation-solution-${condition}-001`,
  workspaceBaselineFingerprintSha256: 'b'.repeat(64),
  output: {
    status: 'OPTIONS',
    problemId: 'skill-behavioral-problem',
    summary: `A ${condition === 'off' ? 'first' : 'second'} bounded result.`,
  },
});

const reviewerArtifact = (condition: 'off' | 'on'): SkillBehavioralConditionArtifact => ({
  condition,
  invocationRef: `skill-validation-reviewer-${condition}-001`,
  workspaceBaselineFingerprintSha256: 'b'.repeat(64),
  output: {
    decision: 'ACCEPT_NO_ACTION',
    problemId: 'skill-behavioral-problem',
    assessment: `A ${condition === 'off' ? 'first' : 'second'} bounded review.`,
  },
});

export async function runSkillBlindingTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'skill-blinding-'));
  const result = await buildSkillBlindedReviewPackage({
    destinationRoot: root,
    sourceRunRef: 'fresh-run-000001',
    problemPackageSha256: 'a'.repeat(64),
    solution: {
      off: solutionArtifact('off'),
      on: solutionArtifact('on'),
    },
    reviewer: {
      off: reviewerArtifact('off'),
      on: reviewerArtifact('on'),
    },
    blindingKey: {
      solution: { candidateA: 'off', candidateB: 'on' },
      reviewer: { candidateA: 'on', candidateB: 'off' },
    },
  });

  const packageText = await readFile(result.blindedPackagePath, 'utf8');
  assert.doesNotMatch(packageText, /Skill-off|Skill-on|repository-grounded-investigation/i);
  assert.doesNotMatch(packageText, /skill-validation-(solution|reviewer)-(off|on)/i);
  const blindedPackage = JSON.parse(packageText) as {
    schemaVersion: string;
    roles: { solution: { candidateA: { candidateId: string }; candidateB: { candidateId: string } }; reviewer: unknown };
    dimensions: string[];
  };
  assert.equal(blindedPackage.schemaVersion, 'skill-blinded-human-review-package-v1');
  assert.equal(blindedPackage.roles.solution.candidateA.candidateId, 'solution-candidate-a');
  assert.equal(blindedPackage.roles.solution.candidateB.candidateId, 'solution-candidate-b');
  assert.equal(blindedPackage.dimensions.length, 7);

  const key = JSON.parse(await readFile(result.blindingKeyPath, 'utf8')) as {
    schemaVersion: string;
    solution: { candidateA: string; candidateB: string };
    reviewer: { candidateA: string; candidateB: string };
  };
  assert.equal(key.schemaVersion, 'skill-blinding-key-v1');
  assert.deepEqual(key.solution, { candidateA: 'off', candidateB: 'on' });
  assert.deepEqual(key.reviewer, { candidateA: 'on', candidateB: 'off' });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSkillBlindingTests()
    .then(() => console.log('skillBlinding.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
