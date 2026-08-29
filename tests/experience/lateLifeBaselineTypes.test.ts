import assert from 'node:assert/strict';
import type { DecisionObservation } from './lateLifeBaselineTypes';

const sample: DecisionObservation = {
  sequence: 1,
  checkpointId: 'martial-801-age-30',
  personaKey: 'martial',
  seed: 801,
  age: 30,
  source: 'browser-local',
  preChoice: {
    age: 30, martialPower: 2, knowledge: 3, businessAcumen: 4, connections: 5,
    reputation: 6, healthStatus: 'healthy', affiliation: null, title: null, alive: true, endingId: null,
  },
  candidates: [
    { actionId: 'a', text: '甲', description: '乙', rewardSummary: '丙', costSummary: '丁', riskLevel: '低', category: 'training' },
    { actionId: 'b', text: '乙', description: '甲', rewardSummary: '丁', costSummary: '丙', riskLevel: '中', category: 'study' },
  ],
  selectedActionId: 'b',
  publicReason: '公开信息显示当前更需要补足学识。',
  result: { postChoice: { age: 30, martialPower: 2, knowledge: 4, businessAcumen: 4, connections: 5, reputation: 6, healthStatus: 'healthy', affiliation: null, title: null, alive: true, endingId: null }, actionSummary: null, disturbanceNarrative: null, periodSummary: null, continuationEventIds: [] },
  presentation: { readable: 'CLEAR', repetition: 'UNIQUE', longTermEcho: 'STATE_ECHO', note: '' },
};

const roundTrip = JSON.parse(JSON.stringify(sample)) as DecisionObservation;
assert.deepEqual(roundTrip.candidates.map(candidate => candidate.actionId), ['a', 'b']);
assert.equal(roundTrip.presentation.readable, 'CLEAR');
assert.equal(roundTrip.result.postChoice.knowledge, 4);
console.log('lateLifeBaselineTypes.test.ts: ok');

