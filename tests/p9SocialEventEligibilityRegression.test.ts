import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(flags: Record<string, unknown>): GameState {
  return {
    player: {
      age: 19,
      name: 'eligibility-test',
      gender: 'female',
      martialPower: 10,
      chivalry: 10,
      constitution: 10,
      comprehension: 10,
      affiliation: null,
      title: null,
      reputation: 4,
      money: 100,
      knowledge: 10,
      charisma: 10,
      businessAcumen: 10,
      influence: 0,
      connections: 7,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      alive: true,
      lifeStates: createDefaultPlayerLifeStates(),
      facts: {},
      flags,
    },
    facts: {},
    flags,
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;
}

function isEligible(state: GameState): boolean {
  const event = EventLoader.getInstance().getEventById('p42_social_momentum_youth_introduction');
  assert(event !== undefined, 'missing p42 social introduction event');
  const evaluator = new ConditionEvaluator();
  return (event.conditions ?? []).every(condition => evaluator.evaluate(condition, state));
}

function main(): void {
  const balancedWithoutSocialHistory = makeState({
    p8_route_balanced: true,
    p9_echo_social_hook: true,
    p9_early_social_focus: true,
  });
  assert(
    !isEligible(balancedWithoutSocialHistory),
    'resource totals alone must not unlock the social introduction for balanced route',
  );

  const socialRoute = makeState({
    p8_route_social: true,
    p9_echo_social_hook: true,
  });
  assert(isEligible(socialRoute), 'social route with the same resources should remain eligible');

  const event = EventLoader.getInstance().getEventById('p42_social_momentum_youth_introduction')!;
  const expression = event.conditions?.[0]?.type === 'expression' ? event.conditions[0].expression : '';
  assert(!expression.includes('familyBond'), 'event must not use the removed family axis');
  assert(!expression.includes('socialMomentum'), 'event must not use the removed social axis');

  console.log('p9SocialEventEligibilityRegression.test.ts passed');
}

main();
