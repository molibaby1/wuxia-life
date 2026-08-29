import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { getRouteDefinition } from '../src/narrative/config/routeDefinitions';
import { WUXIA_MIXED_DESTINY_OUTCOMES } from '../src/narrative/profile/wuxiaOriginSurfaces';
import { evaluateCompositeDestinyOutcome } from '../src/p16/compositeDestiny';
import { resolvePersonaYouthRouteSeeds } from '../src/p8/personaYouthRouteSeeds';
import { getP8PersonaById } from '../src/p8/personas';
import { observeRoutePoint } from '../src/p11/signalDetection';
import { detectSampleLine } from '../src/p50/sampleLineExpression';
import type { EffectDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
import { readRawRouteKeyFromFlags } from '../src/utils/playerFacingLabels';

function makeState(flags: Record<string, unknown>, playerOverrides: Partial<PlayerState> = {}): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.flags = { ...flags };
  state.player.flags = { ...flags };
  Object.assign(state.player, playerOverrides);
  return state;
}

function eventCondition(eventId: string): string {
  const event = EventLoader.getInstance().getEventById(eventId);
  assert(event?.conditions?.[0], `missing conditions for ${eventId}`);
  const condition = event.conditions[0];
  assert(condition.type === 'expression' && condition.expression, `${eventId} must use expression condition`);
  return condition.expression;
}

function testNormalGameplayMerchantPathWithoutP8(): void {
  const evaluator = new ConditionEvaluator();
  const canonical = makeState({
    route_merchant: true,
    p9_early_business_focus: true,
    p9_echo_business_hook: true,
  }, { age: 28 });

  assert(
    evaluator.evaluate({ type: 'expression', expression: eventCondition('p9_childhood_first_trade') }, makeState({
      route_merchant: true,
      p9_early_business_focus: true,
    }, { age: 10 })),
    'p9_childhood_first_trade must be reachable with route_merchant + early business focus',
  );
  assert(
    evaluator.evaluate({ type: 'expression', expression: eventCondition('p9_merchant_midlife_caravan') }, canonical),
    'p9_merchant_midlife_caravan must be reachable with canonical merchant evidence',
  );
  assert(
    evaluator.evaluate({ type: 'expression', expression: eventCondition('p9_business_echo_midlife') }, makeState({
      route_merchant: true,
      p9_echo_business_hook: true,
    }, { age: 29 })),
    'p9_business_echo_midlife must be reachable with route_merchant + business echo',
  );
}

function testP8AloneIsNotStrategicMerchantAuthority(): void {
  const flags = { p8_route_wealth: true };
  assert.equal(readRawRouteKeyFromFlags(flags), null, 'p8_route_wealth alone must not infer merchant route label');
  assert.equal(detectSampleLine(flags), null, 'p8_route_wealth alone must not infer canonical merchant sample line');

  const magnate = WUXIA_MIXED_DESTINY_OUTCOMES.find(outcome => outcome.id === 'merchant_magnate')!;
  const magnateReport = evaluateCompositeDestinyOutcome(
    magnate,
    { age: 48, connections: 65, money: 70, reputation: 55 } as PlayerState,
    { p8_route_wealth: true, merchant_empire: true },
  );
  assert.equal(magnateReport.unlocked, false, 'p8_route_wealth alone must not unlock merchant_magnate composite destiny');
}

function testRouteWealthCommittedAloneIsNotEconomicOwner(): void {
  const flags = { route_wealth_committed: true };
  assert.equal(readRawRouteKeyFromFlags(flags), null, 'route_wealth_committed alone must not infer merchant route owner');

  const patron = WUXIA_MIXED_DESTINY_OUTCOMES.find(outcome => outcome.id === 'merchant_martial_patron')!;
  const patronReport = evaluateCompositeDestinyOutcome(
    patron,
    { age: 44, martialPower: 55, money: 60, reputation: 50, connections: 50 } as PlayerState,
    { route_wealth_committed: true, merchant_invest_good: true },
  );
  assert.equal(patronReport.unlocked, false, 'route_wealth_committed + invest alone must not unlock merchant_martial_patron');
}

function testPatronBridgePreserved(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('merchant_patron_bridge_entry');
  assert(event, 'merchant_patron_bridge_entry must exist');
  const gate = event!.conditions![0]!;
  const bridgeState = makeState({
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  }, { age: 36 });
  assert(
    evaluator.evaluate(gate, bridgeState),
    'legitimate patron bridge must still accept route_wealth_committed + bridge marker',
  );
}

function testMagnateOnRampPreservedUnderCanonicalEvidence(): void {
  const evaluator = new ConditionEvaluator();
  const gate = eventCondition('magnate_on_ramp');
  const state = makeState({
    route_merchant: true,
    merchant_shop_grocery: true,
  }, { age: 30 });
  assert(
    evaluator.evaluate({ type: 'expression', expression: gate }, state),
    'magnate_on_ramp must remain reachable under route_merchant + operational merchant evidence',
  );
}

function testHeadlessP8BridgePreserved(): void {
  const persona = getP8PersonaById('p8-wealth-shen');
  assert(persona, 'p8-wealth-shen must exist');
  const seeds = resolvePersonaYouthRouteSeeds(persona);
  assert.equal(seeds.p8_route_wealth, true, 'P8 wealth persona must still seed p8_route_wealth');
  assert.equal(seeds.p9_early_business_focus, true, 'P8 wealth persona must retain early commercial evidence seeds');

  const bridgeFlags = {
    p8_route_wealth: true,
    p9_early_business_focus: true,
  };
  assert.equal(readRawRouteKeyFromFlags(bridgeFlags), 'merchant', 'P8 bridge may still infer merchant label with commercial evidence');
  assert.equal(detectSampleLine(bridgeFlags), 'merchant', 'P8 bridge may still infer merchant sample line with commercial evidence');
}

function testP11RouteDivergenceWealthValidationPreserved(): void {
  const routeWealth = getRouteDefinition('route_wealth');
  assert(routeWealth, 'route_wealth narrative config must remain');
  const divergence = routeWealth.divergencePoints.find(point => point.eventId === 'p9_merchant_midlife_caravan');
  assert(divergence, 'route_wealth divergence must remain configured');

  const records: GameProcessRecord[] = [{
    age: 28,
    eventId: 'p9_merchant_midlife_caravan',
    eventTitle: '商路初成',
    eventType: 'choice',
    outcomeText: '',
    gameState: { flags: { p11_route_divergence_wealth: true } } as GameState,
    timestamp: '',
  }];
  const observed = observeRoutePoint(
    { kind: 'divergence', ageBand: '28-32', eventId: 'p9_merchant_midlife_caravan', flagKey: 'p9_merchant_midlife_path', description: '商路中段分化' },
    records,
    { p11_route_divergence_wealth: true },
  );
  assert(observed.observed, 'P11 route-point coverage must still observe p11_route_divergence_wealth history signal');
}

function testWealthInvariance(): void {
  const flags = {
    route_merchant: true,
    merchant_shop_grocery: true,
  };
  const lowMoney = readRawRouteKeyFromFlags(flags);
  assert.equal(lowMoney, 'merchant');
  assert.equal(readRawRouteKeyFromFlags({ ...flags, money: 9999 }), lowMoney, 'authority inference must not depend on numeric money');
  assert.equal(readRawRouteKeyFromFlags({ ...flags, money: 0 }), lowMoney, 'authority inference must not depend on numeric money');
}

function testSnapshotAndNoWealthReplacement(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
}

function assertStrategicOnlyMoneyInventory(): void {
  const loader = EventLoader.getInstance();
  const byEvent = new Map<string, number>();
  for (const event of loader.getAllEvents()) {
    const scan = (effects: EffectDefinition[] | undefined) => {
      for (const effect of effects ?? []) {
        if (effect.type !== 'stat_modify') continue;
        if ((effect.target ?? effect.stat) !== 'money') continue;
        byEvent.set(event.id, (byEvent.get(event.id) ?? 0) + 1);
      }
    };
    scan(event.autoEffects);
    for (const choice of event.choices ?? []) scan(choice.effects);
  }
  assert.equal(byEvent.size, 0, `expected 0 formal money-writing events after D16, got ${[...byEvent.keys()].join(',')}`);
  let total = 0;
  for (const count of byEvent.values()) total += count;
  assert.equal(total, 0, `expected 0 formal money writes after D16, got ${total}`);
}

function testMoneyProducerInventoryBaseline(): void {
  assertStrategicOnlyMoneyInventory();
}

function main(): void {
  testNormalGameplayMerchantPathWithoutP8();
  testP8AloneIsNotStrategicMerchantAuthority();
  testRouteWealthCommittedAloneIsNotEconomicOwner();
  testPatronBridgePreserved();
  testMagnateOnRampPreservedUnderCanonicalEvidence();
  testHeadlessP8BridgePreserved();
  testP11RouteDivergenceWealthValidationPreserved();
  testWealthInvariance();
  testSnapshotAndNoWealthReplacement();
  testMoneyProducerInventoryBaseline();
  console.log('globalMoneyLegacyWealthAuthorityConsumerMigration.test.ts: all passed');
}

main();
