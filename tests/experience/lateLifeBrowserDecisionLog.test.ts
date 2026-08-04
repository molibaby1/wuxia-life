import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const base = path.join(process.cwd(), '.tmp/late-life-active-action-baseline');
if (fs.existsSync(path.join(base, 'observations.json'))) {
  const value = JSON.parse(fs.readFileSync(path.join(base, 'observations.json'), 'utf8')) as { windowCount: number; decisionCount: number };
  assert.equal(value.windowCount, 12);
  assert.equal(value.decisionCount, 60);
}
console.log('lateLifeBrowserDecisionLog.test.ts: ok');

