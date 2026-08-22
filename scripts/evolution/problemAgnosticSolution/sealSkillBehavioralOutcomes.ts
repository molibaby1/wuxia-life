import { mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { canonicalJson } from '../phase0/provenance';
import type { SkillBehavioralCondition } from './runSkillBehavioralValidation';

export type SkillBehavioralOutcome = 'BENEFICIAL' | 'NEUTRAL' | 'HARMFUL' | 'INCONCLUSIVE';

interface CandidateAliasMap {
  candidateA: SkillBehavioralCondition;
  candidateB: SkillBehavioralCondition;
}

interface BlindRoleJudgment {
  outcome: SkillBehavioralOutcome;
  comparisons: Array<{ dimension: string; judgment: string }>;
}

export interface SealSkillBehavioralOutcomesInput {
  destinationRoot: string;
  sourceRunRef: string;
  blindedPackageSha256: string;
  protocolOutcome: 'PROTOCOL_VALID' | 'PROTOCOL_STOPPED';
  blindingKey: {
    solution: CandidateAliasMap;
    reviewer: CandidateAliasMap;
  };
  // Outcomes (BENEFICIAL/HARMFUL/…) are Skill-relative and must be sealed after the
  // blinding key is revealed; comparisons may still describe Candidate A/B.
  blindJudgment: {
    solution: BlindRoleJudgment;
    reviewer: BlindRoleJudgment;
  };
}

export interface SealSkillBehavioralOutcomesResult {
  unblindedReportPath: string;
}

const EXPECTED_DIMENSION_COUNT = 7;

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

function assertAliasMap(map: CandidateAliasMap, label: string): void {
  if (map.candidateA === map.candidateB || !['off', 'on'].includes(map.candidateA) || !['off', 'on'].includes(map.candidateB)) {
    throw new Error(`${label} must map Candidate A and Candidate B to distinct Skill conditions`);
  }
}

function assertJudgment(judgment: BlindRoleJudgment, label: string): void {
  if (!['BENEFICIAL', 'NEUTRAL', 'HARMFUL', 'INCONCLUSIVE'].includes(judgment.outcome)) {
    throw new Error(`${label} has an invalid behavioral outcome`);
  }
  if (judgment.comparisons.length !== EXPECTED_DIMENSION_COUNT) {
    throw new Error(`${label} must contain exactly ${EXPECTED_DIMENSION_COUNT} preregistered dimension comparisons`);
  }
  const dimensions = judgment.comparisons.map(comparison => comparison.dimension);
  if (new Set(dimensions).size !== dimensions.length || dimensions.some(dimension => dimension.length === 0)) {
    throw new Error(`${label} must contain unique non-empty comparison dimensions`);
  }
}

export async function sealSkillBehavioralOutcomes(
  input: SealSkillBehavioralOutcomesInput,
): Promise<SealSkillBehavioralOutcomesResult> {
  assertAliasMap(input.blindingKey.solution, 'solution blinding key');
  assertAliasMap(input.blindingKey.reviewer, 'reviewer blinding key');
  assertJudgment(input.blindJudgment.solution, 'Solution blind judgment');
  assertJudgment(input.blindJudgment.reviewer, 'Reviewer blind judgment');
  const unblindedReportPath = join(input.destinationRoot, 'unblinded-behavioral-report.json');
  await writeCreateOnly(unblindedReportPath, {
    schemaVersion: 'skill-unblinded-behavioral-report-v1',
    sourceRunRef: input.sourceRunRef,
    blindedPackageSha256: input.blindedPackageSha256,
    protocolOutcome: input.protocolOutcome,
    blindJudgment: input.blindJudgment,
    behavioralOutcomes: {
      solution: input.blindJudgment.solution.outcome,
      reviewer: input.blindJudgment.reviewer.outcome,
    },
    revealedConditionMapping: {
      solution: input.blindingKey.solution,
      reviewer: input.blindingKey.reviewer,
    },
    claimBoundary: 'This report supports conclusions only for this one fixed fresh-problem comparison.',
    humanReviewTerminalGate: true,
    automaticAdvancement: false,
  });
  return { unblindedReportPath };
}
