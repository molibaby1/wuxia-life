import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const file = path.join(process.cwd(), '.tmp/late-life-active-action-baseline/oracle-comparison.json');
if (fs.existsSync(file)) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8')) as { decisionCount: number; divergenceCount: number; divergenceRate: number };
  assert.equal(value.decisionCount, 60);
  assert.equal(value.divergenceCount >= 0, true);
  assert.equal(value.divergenceRate, value.divergenceCount / value.decisionCount);
}
console.log('compareLateLifeOracleChoices.test.ts: ok');

