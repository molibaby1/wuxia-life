import assert from 'node:assert/strict';
import { jaccard, normalizeTemplate } from './analyzeLateLifeActiveActions';

assert.equal(jaccard(['a', 'b'], ['b', 'c']), 1 / 3);
assert.equal(jaccard([], []), 1);
assert.equal(normalizeTemplate('结果 12\n收益 3'), '结果 # 收益 #');
console.log('analyzeLateLifeActiveActions.test.ts: ok');

