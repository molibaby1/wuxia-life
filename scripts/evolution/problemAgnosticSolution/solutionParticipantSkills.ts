import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { sha256Hex } from '../phase0/provenance';

export interface ParticipantSkillAssignment {
  identity: string;
  version: string;
  canonicalPath: string;
  expectedContentSha256?: string;
}

export interface DeliveredParticipantSkill extends ParticipantSkillAssignment {
  content: string;
  contentSha256: string;
}

const REPOSITORY_GROUNDED_INVESTIGATION_SKILL = {
  identity: 'repository-grounded-investigation',
  version: '1',
  canonicalPath: 'skills/repository-grounded-investigation/SKILL.md',
  expectedContentSha256: 'c0714cf8930aa2f2701294c676cb23f90731c29b5cd5d26bd1ca511cb5bdcae6',
} as const satisfies ParticipantSkillAssignment;

export const SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS = [
  REPOSITORY_GROUNDED_INVESTIGATION_SKILL,
] as const satisfies readonly ParticipantSkillAssignment[];

export const REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS = [
  REPOSITORY_GROUNDED_INVESTIGATION_SKILL,
] as const satisfies readonly ParticipantSkillAssignment[];

function resolveCanonicalSkillPath(workspaceRoot: string, canonicalPath: string): string {
  const root = resolve(workspaceRoot);
  const target = resolve(root, canonicalPath);
  const escaped = relative(root, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`canonical Skill path escapes workspace: ${canonicalPath}`);
  }
  return target;
}

export async function loadParticipantSkills(
  workspaceRoot: string,
  assignments: readonly ParticipantSkillAssignment[],
): Promise<DeliveredParticipantSkill[]> {
  return Promise.all(assignments.map(async assignment => {
    const path = resolveCanonicalSkillPath(workspaceRoot, assignment.canonicalPath);
    const stat = await lstat(path);
    if (!stat.isFile()) {
      throw new Error(`canonical Skill artifact must be a regular file: ${assignment.canonicalPath}`);
    }
    const content = await readFile(path, 'utf8');
    if (content.trim().length === 0) {
      throw new Error(`canonical Skill artifact must not be empty: ${assignment.canonicalPath}`);
    }
    const contentSha256 = sha256Hex(content);
    if (assignment.expectedContentSha256 !== undefined && assignment.expectedContentSha256 !== contentSha256) {
      throw new Error(`canonical Skill content SHA-256 does not match expected provenance: ${assignment.canonicalPath}`);
    }
    return {
      ...assignment,
      content,
      contentSha256,
    };
  }));
}
