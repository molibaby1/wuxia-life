import { mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import type { SkillBehavioralCondition } from './runSkillBehavioralValidation';

export interface SkillBehavioralConditionArtifact {
  condition: SkillBehavioralCondition;
  invocationRef: string;
  workspaceBaselineFingerprintSha256: string;
  output: unknown;
}

interface CandidateAliasMap {
  candidateA: SkillBehavioralCondition;
  candidateB: SkillBehavioralCondition;
}

export interface BuildSkillBlindedReviewPackageInput {
  destinationRoot: string;
  sourceRunRef: string;
  problemPackageSha256: string;
  solution: Record<SkillBehavioralCondition, SkillBehavioralConditionArtifact>;
  reviewer: Record<SkillBehavioralCondition, SkillBehavioralConditionArtifact>;
  blindingKey: {
    solution: CandidateAliasMap;
    reviewer: CandidateAliasMap;
  };
}

export interface SkillBlindedReviewPackageResult {
  blindedPackagePath: string;
  blindingKeyPath: string;
}

const PREREGISTERED_DIMENSIONS = [
  'grounding in supplied authority, problem statement, and evidence',
  'independent repository inspection and actual-path tracing',
  'separation of repository facts, evidence observations, inferences, and unknowns',
  'preservation of uncertainty when evidence is insufficient',
  'respect for authority, permission, and execution boundaries',
  'traceability and auditability of supporting references',
  'usefulness of the assigned Role result',
] as const;

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

function buildCandidate(
  role: 'solution' | 'reviewer',
  candidate: 'A' | 'B',
  artifact: SkillBehavioralConditionArtifact,
): Record<string, unknown> {
  return {
    candidateId: `${role}-candidate-${candidate.toLowerCase()}`,
    outputSha256: sha256Hex(canonicalJson(artifact.output)),
    workspaceBaselineFingerprintSha256: artifact.workspaceBaselineFingerprintSha256,
    output: artifact.output,
  };
}

function buildRolePackage(
  role: 'solution' | 'reviewer',
  artifacts: Record<SkillBehavioralCondition, SkillBehavioralConditionArtifact>,
  aliases: CandidateAliasMap,
): Record<string, unknown> {
  return {
    candidateA: buildCandidate(role, 'A', artifacts[aliases.candidateA]),
    candidateB: buildCandidate(role, 'B', artifacts[aliases.candidateB]),
  };
}

export async function buildSkillBlindedReviewPackage(
  input: BuildSkillBlindedReviewPackageInput,
): Promise<SkillBlindedReviewPackageResult> {
  assertAliasMap(input.blindingKey.solution, 'solution blinding key');
  assertAliasMap(input.blindingKey.reviewer, 'reviewer blinding key');
  const blindedPackagePath = join(input.destinationRoot, 'blinded-review-package.json');
  const blindingKeyPath = join(input.destinationRoot, 'blinding-key.json');

  await writeCreateOnly(blindingKeyPath, {
    schemaVersion: 'skill-blinding-key-v1',
    sourceRunRef: input.sourceRunRef,
    solution: input.blindingKey.solution,
    reviewer: input.blindingKey.reviewer,
  });
  await writeCreateOnly(blindedPackagePath, {
    schemaVersion: 'skill-blinded-human-review-package-v1',
    sourceRunRef: input.sourceRunRef,
    problemPackageSha256: input.problemPackageSha256,
    dimensions: PREREGISTERED_DIMENSIONS,
    roles: {
      solution: buildRolePackage('solution', input.solution, input.blindingKey.solution),
      reviewer: buildRolePackage('reviewer', input.reviewer, input.blindingKey.reviewer),
    },
    conditionMapping: 'withheld-until-blind-verdict-is-sealed',
  });
  return { blindedPackagePath, blindingKeyPath };
}
