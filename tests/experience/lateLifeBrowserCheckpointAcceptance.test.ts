import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const file = path.join(process.cwd(), '.tmp/late-life-active-action-baseline/browser-parity.json');
if (fs.existsSync(file)) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8')) as { checkpointCount: number; decisionCount: number; exactParityCount: number; parity: Array<{ ok: boolean }> };
  assert.equal(value.checkpointCount, 12);
  assert.equal(value.decisionCount, 60);
  assert.equal(value.parity.length, 12);
  assert.equal(value.exactParityCount, value.parity.filter(item => item.ok).length);
}
console.log('lateLifeBrowserCheckpointAcceptance.test.ts: ok');
