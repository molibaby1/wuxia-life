import { EffectType, type EventChoice } from '../src/types/eventTypes';
import { isChoicePlayerFacingVisibleState } from '../src/p25/choiceFeedbackValidation';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

console.log('=== P41 Choice Feedback Validation Regression ===\n');

{
  const factionOnlyChoice: EventChoice = {
    id: 'join_faction',
    text: '加入门派',
    effects: [
      {
        type: EffectType.SET_FACTION,
        faction: '少林',
      },
    ],
  };

  assert(
    isChoicePlayerFacingVisibleState(factionOnlyChoice),
    'SET_FACTION should count as player-visible state write',
  );
  console.log('✓ set_faction counts as visible state write');
}

console.log('\n=== P41 Choice Feedback Validation Regression Passed ===');
