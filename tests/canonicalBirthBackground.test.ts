import { EventExecutor } from '../src/core/EventExecutor';
import { eventLoader } from '../src/core/EventLoader';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import {
  BIRTH_BACKGROUND_CANDIDATES,
  getBirthBackgroundNarrative,
  getCanonicalBirthBackground,
  getLegacyBirthBackgroundProjection,
  resolveBirthBackground,
} from '../src/p16/canonicalBirthBackground';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function baseState(): GameState {
  return {
    player: {
      age: 0,
      gender: 'male',
      name: '出生背景测试',
      martialPower: 0,
      chivalry: 0,
      constitution: 10,
      charisma: 10,
      reputation: 0,
      wealthCapacity: 'no_surplus',
      knowledge: 10,
      businessAcumen: 10,
      influence: 0,
      connections: 0,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
      flags: {},
      events: [],
      children: 0,
      spouse: null,
      alive: true,
      traits: [],
      healthStatus: 'healthy',
      statuses: [],
      lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    },
    facts: {},
    flags: {},
    relations: {},
    eventHistory: [],
  };
}

function testProductionRandomResolutionHasOneCanonicalBackground(): void {
  const state = resolveBirthBackground(baseState(), { random: () => 0 });
  const background = getCanonicalBirthBackground(state);
  assert(background === BIRTH_BACKGROUND_CANDIDATES[0], 'production resolver must choose a legal candidate');
  assert(state.facts.birth_background === background, 'canonical background must be stored in facts');
  assert(
    BIRTH_BACKGROUND_CANDIDATES.filter(candidate => state.facts.birth_background === candidate).length === 1,
    'one life must have exactly one canonical birth background',
  );
}

function testDebugOverrideUsesSameResolverWithoutSecondFact(): void {
  const state = resolveBirthBackground(baseState(), { override: 'merchant_house', random: () => 0 });
  assert(state.facts.birth_background === 'merchant_house', 'debug override must replace random resolution');
  assert(state.flags.origin_merchant_family === true, 'merchant compatibility flag must be derived');
  assert(!state.flags.origin_wuxia_family, 'derived compatibility flags must remain mutually exclusive');
  assert(!state.flags.origin_scholar_family, 'derived compatibility flags must remain mutually exclusive');
  assert(!state.flags.origin_frontier, 'derived compatibility flags must remain mutually exclusive');
  assert(state.player.events?.filter(event => event.eventId.startsWith('origin_')).length === 1, 'override must not create a second origin fact');
}

function testOriginEffectsRemainAdditiveAndTraitAware(): void {
  const martialStart = baseState();
  martialStart.player.martialPower = 7;
  martialStart.player.constitution = 8;
  const martial = resolveBirthBackground(martialStart, { override: 'martial_family' });
  assert(martial.player.martialPower === 12, 'martial background must add +5 martialPower');
  assert(martial.player.constitution === 14, 'martial background must add +6 constitution');

  const scholarStart = baseState();
  scholarStart.player.knowledge = 10;
  const scholar = resolveBirthBackground(scholarStart, { override: 'scholar_house' });
  assert(scholar.player.knowledge === 18, 'scholar background must add +8 knowledge');
  assert(scholar.player.chivalry === 4, 'scholar background must add +4 chivalry');

  const merchantStart = baseState();
  merchantStart.player.charisma = 10;
  merchantStart.player.connections = 4;
  const merchant = resolveBirthBackground(merchantStart, { override: 'merchant_house' });
  assert(merchant.player.charisma === 16, 'merchant background must add +6 charisma, not set it to 6');
  assert(merchant.player.connections === 6, 'merchant background must add +2 connections');
  assert(merchant.player.wealthCapacity === 'comfortable_means', 'merchant background must set comfortable means');

  const frontierStart = baseState();
  frontierStart.player.constitution = 10;
  frontierStart.player.chivalry = 5;
  const frontier = resolveBirthBackground(frontierStart, { override: 'frontier_military' });
  assert(frontier.player.constitution === 14, 'frontier background must add +4 constitution');
  assert(frontier.player.chivalry === 3, 'frontier background must subtract 2 chivalry');

  const traitStart = baseState();
  traitStart.player.traits = ['social_gift'];
  traitStart.player.charisma = 16;
  traitStart.player.connections = 5;
  const traitAware = resolveBirthBackground(traitStart, { override: 'merchant_house' });
  assert(traitAware.player.charisma === 24, 'merchant charisma growth multiplier must apply to the +6 delta');
  assert(traitAware.player.connections === 8, 'merchant connections growth multiplier must apply to the +2 delta');
}

function testLegacyProjectionCannotWriteCanonicalFact(): void {
  const merchantFlagOnly = baseState();
  merchantFlagOnly.flags.origin_merchant_family = true;
  merchantFlagOnly.player.flags.origin_merchant_family = true;
  assert(getCanonicalBirthBackground(merchantFlagOnly) === null, 'strict canonical read must ignore legacy merchant flags');
  assert(getLegacyBirthBackgroundProjection(merchantFlagOnly) === 'merchant_house', 'legacy projection read must remain explicit');
  const resolvedFromFlag = resolveBirthBackground(merchantFlagOnly, { random: () => 0 });
  assert(resolvedFromFlag.facts.birth_background === 'martial_family', 'legacy merchant flag must not select the canonical background');

  const originIdOnly = baseState();
  originIdOnly.flags.origin_id = 'merchant_house';
  originIdOnly.player.flags.origin_id = 'merchant_house';
  const resolvedFromId = resolveBirthBackground(originIdOnly, { random: () => 0 });
  assert(resolvedFromId.facts.birth_background === 'martial_family', 'legacy origin_id must not select the canonical background');

  const canonical = resolveBirthBackground(baseState(), { override: 'merchant_house' });
  canonical.flags.origin_frontier = true;
  canonical.flags.origin_id = 'frontier_military';
  canonical.player.flags.origin_frontier = true;
  canonical.player.flags.origin_id = 'frontier_military';
  const preserved = resolveBirthBackground(canonical, { random: () => 0 });
  assert(preserved.facts.birth_background === 'merchant_house', 'stale legacy state must not override canonical fact');
  assert(preserved.flags.origin_merchant_family === true, 'canonical re-projection must restore merchant compatibility flag');
  assert(!preserved.flags.origin_frontier, 'canonical re-projection must clear stale frontier compatibility flag');
  assert(preserved.flags.origin_id === 'merchant_house', 'canonical re-projection must restore origin_id');

  const evaluator = new ConditionEvaluator();
  assert(
    !evaluator.evaluate({ type: 'expression', expression: "facts.birth_background == 'merchant_house'" }, merchantFlagOnly),
    'facts.birth_background conditions must not alias legacy flags',
  );
  assert(
    evaluator.evaluate({ type: 'expression', expression: "facts.birth_background == 'merchant_house'" }, preserved),
    'facts.birth_background conditions must read the canonical fact',
  );
}

async function testBirthNarrativeAndEarlyLifeBoundary(): Promise<void> {
  const originEvent = eventLoader.getEventById('origin_background');
  assert(originEvent?.eventType === 'auto', 'origin_background must be an automatic resolution event');
  assert(!originEvent?.choices?.length, 'origin_background must not expose independent choice writers');

  const before = resolveBirthBackground(baseState(), { override: 'merchant_house' });
  const next = await new EventExecutor().executeEffects(
    eventLoader.getEventById('birth_with_phenomenon')?.autoEffects ?? [],
    before,
  );
  assert(next.facts.birth_background === 'merchant_house', 'early-life events must not overwrite birth background');
  const narrative = getBirthBackgroundNarrative(next);
  assert(Boolean(narrative), 'resolved birth background must provide a narrative');
  assert(narrative?.includes('商贾之家') === true, 'merchant narrative must match canonical background');
  assert(!narrative?.includes('武侠世家'), 'merchant narrative must not announce a martial family');
}

export async function runCanonicalBirthBackgroundTests(): Promise<void> {
  testProductionRandomResolutionHasOneCanonicalBackground();
  testDebugOverrideUsesSameResolverWithoutSecondFact();
  testOriginEffectsRemainAdditiveAndTraitAware();
  testLegacyProjectionCannotWriteCanonicalFact();
  await testBirthNarrativeAndEarlyLifeBoundary();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalBirthBackgroundTests()
    .then(() => console.log('canonicalBirthBackground.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
