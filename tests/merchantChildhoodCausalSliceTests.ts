import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import type { Effect, GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function state(
  flags: Record<string, unknown>,
  stats: Partial<PlayerState>,
): GameState {
  return {
    player: {
      age: 6,
      businessAcumen: 4,
      connections: 2,
      ...stats,
    } as PlayerState,
    flags: { origin_merchant_family: true, ...flags },
  } as GameState;
}

function hasEffect(effects: Effect[] | undefined, type: string, target: string): boolean {
  return Boolean(effects?.some(effect => effect.type === type && (effect.target ?? effect.stat) === target));
}

export function runMerchantChildhoodCausalSliceTests(): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const preference = loader.getEventById('merchant_childhood_preference');
  assert(Boolean(preference), 'merchant age-4 preference loads');
  assert(preference!.choices?.length === 2, 'merchant preference has exactly two choices');

  const abacus = preference!.choices!.find(choice => choice.id === 'merchant_childhood_choose_abacus')!;
  const customer = preference!.choices!.find(choice => choice.id === 'merchant_childhood_choose_customers')!;
  assert(hasEffect(abacus.effects, 'stat_modify', 'businessAcumen'), 'abacus choice changes businessAcumen');
  assert(hasEffect(abacus.effects, 'flag_set', 'merchant_childhood_abacus_memory'), 'abacus memory recorded');
  assert(hasEffect(customer.effects, 'stat_modify', 'connections'), 'customer choice changes connections');
  assert(hasEffect(customer.effects, 'flag_set', 'merchant_childhood_customer_memory'), 'customer memory recorded');

  const cases = [
    ['merchant_childhood_recognition_abacus_base', state({ merchant_childhood_abacus_memory: true }, { businessAcumen: 5 })],
    ['merchant_childhood_recognition_abacus_strong', state({ merchant_childhood_abacus_memory: true }, { businessAcumen: 6 })],
    ['merchant_childhood_recognition_customer_base', state({ merchant_childhood_customer_memory: true }, { connections: 3 })],
    ['merchant_childhood_recognition_customer_strong', state({ merchant_childhood_customer_memory: true }, { connections: 4 })],
  ] as const;

  for (const [eventId, matchingState] of cases) {
    const event = loader.getEventById(eventId)!;
    assert(Boolean(event), `${eventId} loads`);
    assert(evaluator.evaluate(event.conditions![0]!, matchingState), `${eventId} accepts its intended state`);
    assert(hasEffect(event.autoEffects, 'flag_set', 'merchant_childhood_recognition_done'), `${eventId} closes recognition`);
    assert(hasEffect(event.autoEffects, 'flag_set', 'p9_echo_business_hook'), `${eventId} hands off to existing merchant chain`);
  }

  assert(
    !evaluator.evaluate(
      loader.getEventById('merchant_childhood_recognition_abacus_base')!.conditions![0]!,
      state({ merchant_childhood_abacus_memory: true }, { businessAcumen: 6 }),
    ),
    'abacus base and strong tiers are mutually exclusive',
  );
  assert(Boolean(loader.getEventById('merchant_childhood_seed_milestone')), 'existing age-7 merchant milestone still loads');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMerchantChildhoodCausalSliceTests();
  console.log('merchantChildhoodCausalSliceTests: ok');
}
