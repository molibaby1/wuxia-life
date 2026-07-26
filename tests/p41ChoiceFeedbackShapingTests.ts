import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import type { PlayerState } from '../src/types/eventTypes';
import { formatLongTermFlag } from '../src/utils/playerFacingLabels';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makePlayer(lifeStates: Partial<PlayerState['lifeStates']>): PlayerState {
  return {
    name: '测试',
    age: 20,
    gender: 'male',
    martialPower: 10,
    externalSkill: 10,
    internalSkill: 10,
    qinggong: 10,
    chivalry: 10,
    constitution: 10,
    comprehension: 10,
    reputation: 10,
    money: 100,
    knowledge: 10,
    charisma: 10,
    businessAcumen: 0,
    influence: 0,
    connections: 0,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    sect: null,
    title: null,
    flags: {},
    children: 0,
    spouse: null,
    alive: true,
    lifeStates: {
      trainingHabit: 0,
      studyHabit: 0,
      businessHabit: 0,
      socialMomentum: 0,
      familyBond: 0,
      ...lifeStates,
    },
  };
}

console.log('=== P41 Choice Feedback Shaping Tests ===\n');

{
  const feedback = generateChoiceFeedback({
    narrativeResult: '你坚持练功。',
    effects: [],
    beforePlayer: makePlayer({ trainingHabit: 1 }),
    afterPlayer: makePlayer({ trainingHabit: 2 }),
  });
  const visible = feedback.player.longTermFlags.filter((item) => item.visibility === 'player');
  assert(visible.some((item) => item.flag === 'shaping_trainingHabit_up'), 'training habit increment should emit shaping flag');
  assert(
    formatLongTermFlag('shaping_trainingHabit_up', true) === '习武塑形加深',
    'training shaping hint should use player-facing copy',
  );
  console.log('✓ training shaping feedback');
}

{
  const feedback = generateChoiceFeedback({
    narrativeResult: '你埋首苦读。',
    effects: [],
    beforePlayer: makePlayer({ studyHabit: 0 }),
    afterPlayer: makePlayer({ studyHabit: 1 }),
  });
  const visible = feedback.player.longTermFlags.filter((item) => item.visibility === 'player');
  assert(visible.some((item) => item.flag === 'shaping_studyHabit_up'), 'study habit increment should emit shaping flag');
  assert(
    formatLongTermFlag('shaping_studyHabit_up', true) === '饱学塑形加深',
    'study shaping hint should use player-facing copy',
  );
  console.log('✓ study shaping feedback');
}

{
  const feedback = generateChoiceFeedback({
    narrativeResult: '你打理营生。',
    effects: [],
    beforePlayer: makePlayer({ businessHabit: 1 }),
    afterPlayer: makePlayer({ businessHabit: 2 }),
  });
  const visible = feedback.player.longTermFlags.filter((item) => item.visibility === 'player');
  assert(visible.some((item) => item.flag === 'shaping_businessHabit_up'), 'business habit increment should emit shaping flag');
  console.log('✓ business shaping feedback');
}

{
  const feedback = generateChoiceFeedback({
    narrativeResult: '你照拂亲族。',
    effects: [],
    beforePlayer: makePlayer({ familyBond: 1, socialMomentum: 1 }),
    afterPlayer: makePlayer({ familyBond: 2, socialMomentum: 2 }),
  });
  const flags = feedback.player.longTermFlags
    .filter((item) => item.visibility === 'player')
    .map((item) => item.flag);
  assert(flags.includes('shaping_familyBond_up'), 'family bond increment should emit shaping flag');
  assert(flags.includes('shaping_socialMomentum_up'), 'social momentum increment should emit shaping flag');
  console.log('✓ social and family shaping feedback');
}

{
  const feedback = generateChoiceFeedback({
    narrativeResult: '无变化。',
    effects: [],
    beforePlayer: makePlayer({ trainingHabit: 2 }),
    afterPlayer: makePlayer({ trainingHabit: 2 }),
  });
  const shapingFlags = feedback.player.longTermFlags.filter((item) => item.flag.startsWith('shaping_'));
  assert(shapingFlags.length === 0, 'unchanged lifeStates should not emit shaping hints');
  console.log('✓ no false precision on unchanged axes');
}

console.log('\n=== P41 Choice Feedback Shaping Tests Passed ===');
