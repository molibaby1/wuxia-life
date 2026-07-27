import { dailyEvents } from '../src/data/life/dailyEvents';
import { getP8PersonaById } from '../src/p8/personas';
import { selectPersonaActiveAction } from '../src/p8/personaActionStrategy';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function action(actionId: string, category: string) {
  return { actionId, category, name: actionId };
}

function testBalancedEarlyRotation(): void {
  const persona = getP8PersonaById('p8-balanced-wei');
  assert(Boolean(persona), 'missing p8-balanced-wei');

  const availableActions = [
    action('action_training_basic', 'training'),
    action('action_study_basic', 'study'),
    action('action_socializing_basic', 'socializing'),
    action('action_business_basic', 'business'),
  ];

  const age0 = selectPersonaActiveAction({
    persona: persona!,
    availableActions,
    age: 0,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(age0.actionId === 'action_study_basic', `balanced age0 should open on study, got ${age0.actionId}`);

  const age3 = selectPersonaActiveAction({
    persona: persona!,
    availableActions,
    age: 3,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });
  assert(age3.actionId === 'action_socializing_basic', `balanced age3 should rotate to socializing, got ${age3.actionId}`);
}

function testBusinessPersonaKeepsBusinessPriority(): void {
  const persona = getP8PersonaById('p8-wealth-shen');
  assert(Boolean(persona), 'missing p8-wealth-shen');

  const picked = selectPersonaActiveAction({
    persona: persona!,
    availableActions: [
      action('action_training_basic', 'training'),
      action('action_study_basic', 'study'),
      action('action_business_basic', 'business'),
    ],
    age: 9,
    focusStreakCategory: null,
    focusStreakCount: 0,
  });

  assert(picked.actionId === 'action_business_basic', `business persona should prefer business when available, got ${picked.actionId}`);
}

function testLivelihoodDailyEventsAccumulateBusinessHabit(): void {
  const livelihoodEvents = dailyEvents.filter(event => event.group === 'livelihood');
  assert(livelihoodEvents.length >= 3, 'expected livelihood daily events');
  for (const event of livelihoodEvents) {
    assert(!('longTermHooks' in event), `${event.id} must not expose longTermHooks`);
  }
}

function testLivelihoodDailyEventsHaveEarlyRepeatBoost(): void {
  assert(dailyEvents.every(event => !('longTermHooks' in event)), 'DailyEvent configs must not expose repeat hooks');
}

function testStudyDailyEventsAccumulateStudyHabit(): void {
  const studyEvents = dailyEvents.filter(event => event.group === 'study');
  assert(studyEvents.length >= 2, `expected >=2 study daily events, got ${studyEvents.length}`);
  for (const event of studyEvents) {
    assert(
      !('longTermHooks' in event),
      `${event.id} must not expose longTermHooks`,
    );
  }
}

function main(): void {
  testBalancedEarlyRotation();
  testBusinessPersonaKeepsBusinessPriority();
  testLivelihoodDailyEventsAccumulateBusinessHabit();
  testLivelihoodDailyEventsHaveEarlyRepeatBoost();
  testStudyDailyEventsAccumulateStudyHabit();
  console.log('p45ShapingBiasRegressionTests: all passed');
}

main();
