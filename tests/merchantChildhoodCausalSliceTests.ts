import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { gameEngine } from '../src/core/GameEngineIntegration';
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

function getStatDelta(effects: Effect[] | undefined, target: string): number | null {
  const effect = effects?.find(item => item.type === 'stat_modify' && (item.target ?? item.stat) === target);
  return typeof effect?.value === 'number' ? effect.value : null;
}

async function assertRecognitionRemainsVisible(
  eventId: string,
  flags: Record<string, unknown>,
  stats: Partial<PlayerState>,
): Promise<void> {
  const previousAnimationFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = callback =>
    setTimeout(() => callback(Date.now()), 0) as unknown as number;
  const browser = useNewGameEngine();
  try {
    gameEngine.applyGameState({
      player: {
        age: 6,
        alive: true,
        businessAcumen: 4,
        traits: [],
        connections: 2,
        flags: { ...flags },
        ...stats,
      } as PlayerState,
      flags: { origin_merchant_family: true, ...flags },
      currentTime: { year: 7, month: 1, day: 1 },
      eventHistory: [],
    } as GameState);
    browser.engineState.currentEvent = null;
    browser.engineState.availableChoices = [];
    browser.engineState.lastOutcomeText = null;

    browser.getNextEvent();
    await new Promise(resolve => setTimeout(resolve, 10));

    assert(
      browser.engineState.currentEvent?.id === eventId,
      `${eventId} must remain visible after its automatic effects execute`,
    );
    assert(
      Boolean(gameEngine.getGameState().flags?.merchant_childhood_recognition_done),
      `${eventId} must still apply recognition effects before presentation`,
    );
  } finally {
    globalThis.requestAnimationFrame = previousAnimationFrame;
  }
}

export async function runMerchantChildhoodCausalSliceTests(): Promise<void> {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const origin = loader.getEventById('origin_background');
  const merchantOrigin = origin?.choices?.find(choice => choice.id === 'origin_merchant_family');
  assert(Boolean(merchantOrigin), 'merchant origin choice loads');
  assert(
    getStatDelta(merchantOrigin?.effects, 'connections') === 2,
    'merchant origin provides the two starting connections assumed by the childhood payoff',
  );
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

  await assertRecognitionRemainsVisible(
    'merchant_childhood_recognition_abacus_base',
    { merchant_childhood_abacus_memory: true },
    { businessAcumen: 5 },
  );
  await assertRecognitionRemainsVisible(
    'merchant_childhood_recognition_customer_base',
    { merchant_childhood_customer_memory: true },
    { connections: 3 },
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMerchantChildhoodCausalSliceTests()
    .then(() => console.log('merchantChildhoodCausalSliceTests: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
