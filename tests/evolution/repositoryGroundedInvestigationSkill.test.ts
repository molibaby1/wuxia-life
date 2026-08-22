import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const CANONICAL_SKILL_PATH = 'skills/repository-grounded-investigation/SKILL.md';

export async function runRepositoryGroundedInvestigationSkillTests(): Promise<void> {
  const skillPath = join(process.cwd(), CANONICAL_SKILL_PATH);
  const exists = await lstat(skillPath).then(() => true, error => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  });
  assert.equal(exists, true, 'canonical repository-grounded-investigation Skill artifact must exist');
  const firstRead = await readFile(skillPath, 'utf8');
  const secondRead = await readFile(skillPath, 'utf8');

  assert.equal(firstRead, secondRead);
  assert.equal(
    createHash('sha256').update(firstRead).digest('hex'),
    createHash('sha256').update(secondRead).digest('hex'),
  );
  assert.match(firstRead, /name: repository-grounded-investigation/);
  assert.match(firstRead, /version: 1/);
  assert.match(firstRead, /authority.*problem.*evidence/i);
  assert.match(firstRead, /source.*configuration.*tests/i);
  assert.match(firstRead, /implementation.*data.*execution path/i);
  assert.match(firstRead, /facts.*observations.*inferences.*unknowns/i);
  assert.match(firstRead, /insufficient.*uncertainty/i);

  for (const forbidden of [
    'money',
    'marriage',
    'combat',
    'family',
    'SolutionWorkV1',
    'SolutionReviewV1',
    'repoRef',
    'artifactRef',
    'Decision Router',
    'PARTICIPANT_FAILURE',
    'permission',
    'workspace',
    'Cursor',
    'Codex',
  ]) {
    assert.doesNotMatch(firstRead, new RegExp(forbidden, 'i'));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRepositoryGroundedInvestigationSkillTests()
    .then(() => console.log('repositoryGroundedInvestigationSkill.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
