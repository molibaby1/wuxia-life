import assert from 'node:assert/strict';
import { resolveChoiceEffects, type ResolvedChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';

const IDS = {
  trade: 'border_trade_route',
  tradeGuard: 'border_trade_guard',
  tradeNegotiate: 'border_trade_negotiate',
  followup: 'border_saiyin_trade_followup',
  followupGuard: 'border_saiyin_trade_guard',
  followupNegotiate: 'border_saiyin_trade_negotiate',
  alliance: 'border_alliance',
  contract: 'border_alliance_contract',
  endingEnvoy: 'border_ending_envoy',
} as const;

function createBorderEngine(): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 22;
  state.player.flags = {};
  state.flags = state.player.flags;
  state.player.events = [];
  state.eventHistory = [];
  state.triggeredEvents = [];
  state.relations = {};
  state.player.relationships = [];
  state.player.spouse = null;
  state.player.children = 0;
  state.flags.route_border = true;
  engine.setSuppressLethalSetbacks(true);
  return engine;
}

function getEvent(id: string): EventDefinition {
  const event = eventLoader.getEventById(id);
  assert(event, `missing Saiyin event: ${id}`);
  return event;
}

function getChoice(eventId: string, choiceId: string): EventChoice {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice: ${eventId}/${choiceId}`);
  return choice;
}

function availableIds(engine: GameEngineIntegration, age: number): Set<string> {
  engine.getGameState().player.age = age;
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

function hasRecordedEvent(engine: GameEngineIntegration, eventId: string): boolean {
  const state = engine.getGameState();
  return (
    state.triggeredEvents.includes(eventId) ||
    state.eventHistory.some(entry => entry.eventId === eventId) ||
    state.player.events.some(entry => entry.eventId === eventId)
  );
}

function absoluteMonth(time: { year: number; month: number; day: number } | undefined): number {
  assert(time, 'currentTime is required for Saiyin pacing assertions');
  return time.year * 12 + time.month;
}

async function choose(
  engine: GameEngineIntegration,
  eventId: string,
  choiceId: string,
): Promise<ResolvedChoiceEffects> {
  const event = getEvent(eventId);
  const choice = getChoice(eventId, choiceId);
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${eventId}/${choiceId}`);
  await engine.executeChoiceEffects(resolved.effects, eventId, choiceId);
  return resolved;
}

function assertNoSaiyinRomanceSemantics(event: EventDefinition): void {
  assert.doesNotMatch(
    JSON.stringify(event),
    /affinity|trust|closeness|relation_change|spouse|romance|marriage|lover_saiyin|border_path_marriage/i,
    `${event.id} must remain fact-first and non-romantic`,
  );
}

async function prepareSaiyinPath(
  tradeChoice: string,
  followupChoice: string,
): Promise<GameEngineIntegration> {
  const engine = createBorderEngine();
  assert(availableIds(engine, 22).has(IDS.trade));
  await choose(engine, IDS.trade, tradeChoice);
  assert(availableIds(engine, 22).has(IDS.followup));
  await choose(engine, IDS.followup, followupChoice);
  assert(availableIds(engine, 25).has(IDS.alliance));
  return engine;
}

async function testSaiyinEntersThroughTradeRouteAndUsesExistingHistories(): Promise<void> {
  const trade = getEvent(IDS.trade);
  assert.match(trade.content.text, /赛音/);
  assert.deepEqual(trade.conditions, [
    {
      type: 'expression',
      expression: 'flags.has("route_border") && !flags.has("border_trade_route")',
    },
  ]);
  assertNoSaiyinRomanceSemantics(trade);

  const followup = getEvent(IDS.followup);
  assert.equal(followup.id, IDS.followup);
  assert.equal(followup.metadata?.autoResolve, undefined, 'Saiyin follow-up must remain a player choice');
  assert.equal(followup.choices?.length, 2);
  assert.match(JSON.stringify(followup.conditions), /border_trade_guard/);
  assert.match(JSON.stringify(followup.conditions), /border_trade_negotiate/);
  assert.match(getChoice(IDS.followup, IDS.followupGuard).description ?? '', /这一次|共同/);
  assert.match(getChoice(IDS.followup, IDS.followupNegotiate).description ?? '', /这一次|共同/);
  assert.doesNotMatch(JSON.stringify(followup.choices), /上次|留下/);
  assertNoSaiyinRomanceSemantics(followup);

  for (const tradeChoice of [IDS.tradeGuard, IDS.tradeNegotiate]) {
    const engine = createBorderEngine();
    assert(availableIds(engine, 22).has(IDS.trade));
    const start = engine.getGameState().currentTime;
    await choose(engine, IDS.trade, tradeChoice);
    const afterTrade = engine.getGameState().currentTime;
    assert(
      absoluteMonth(afterTrade) - absoluteMonth(start) >= 3,
      'Saiyin follow-up must be grounded in a multi-month gap after the first meeting',
    );
    assert(availableIds(engine, 22).has(IDS.followup));
    assert(
      hasRecordedEvent(engine, tradeChoice),
      `${tradeChoice} must remain the concrete first-meeting history`,
    );
  }

  assert.match(followup.content.text, /数月以后/);
}

async function testConditionalContractKeepsAllianceResultAndChangesText(): Promise<void> {
  const alliance = getEvent(IDS.alliance);
  const contract = getChoice(IDS.alliance, IDS.contract);
  const paths = [
    { tradeChoice: IDS.tradeGuard, followupChoice: IDS.followupGuard },
    { tradeChoice: IDS.tradeGuard, followupChoice: IDS.followupNegotiate },
    { tradeChoice: IDS.tradeNegotiate, followupChoice: IDS.followupGuard },
    { tradeChoice: IDS.tradeNegotiate, followupChoice: IDS.followupNegotiate },
  ] as const;
  const canonicalResult = (engine: GameEngineIntegration) => ({
    alliance: engine.getGameState().flags.border_alliance,
    contract: engine.getGameState().flags.border_path_contract,
    knowledge: engine.getGameState().player.knowledge,
    spouse: engine.getGameState().player.spouse,
    children: engine.getGameState().player.children,
    retiredSaiyinFlags: {
      lover: engine.getGameState().flags.lover_saiyin,
      marriage: engine.getGameState().flags.border_path_marriage,
      allianceMarriage: engine.getGameState().flags.border_alliance_marriage,
    },
  });

  let baselineEffects: ResolvedChoiceEffects['effects'] | undefined;
  let baselineCanonicalResult: ReturnType<typeof canonicalResult> | undefined;
  const outcomeTexts = new Set<string>();

  for (const path of paths) {
    const engine = await prepareSaiyinPath(path.tradeChoice, path.followupChoice);
    assert(availableIds(engine, 25).has(IDS.alliance));
    assert(hasRecordedEvent(engine, path.tradeChoice));
    assert(hasRecordedEvent(engine, path.followupChoice));

    const resolved = resolveChoiceEffects(engine.getGameState(), alliance, contract);
    assert(resolved?.outcomeText);
    outcomeTexts.add(resolved.outcomeText);
    if (path.followupChoice === IDS.followupGuard) {
      assert.match(resolved.outcomeText, /后来.*(护送路线|巡护责任)/);
      assert.doesNotMatch(resolved.outcomeText, /谈判|账册|通商规则|分担条款/);
    } else {
      assert.match(resolved.outcomeText, /后来.*(互市账册|通商规则|分担条款)/);
      assert.doesNotMatch(resolved.outcomeText, /护商|护送路线|巡护责任/);
    }

    if (!baselineEffects) {
      baselineEffects = resolved.effects;
    } else {
      assert.deepEqual(resolved.effects, baselineEffects);
    }

    await choose(engine, IDS.alliance, IDS.contract);
    const result = canonicalResult(engine);
    if (!baselineCanonicalResult) {
      baselineCanonicalResult = result;
    } else {
      assert.deepEqual(result, baselineCanonicalResult);
    }
    assert.deepEqual(result.retiredSaiyinFlags, {
      lover: undefined,
      marriage: undefined,
      allianceMarriage: undefined,
    });
  }

  assert.equal(contract.outcomes?.length, 2);
  assert.match(JSON.stringify(contract.outcomes), /border_saiyin_trade_guard/);
  assert.match(JSON.stringify(contract.outcomes), /border_saiyin_trade_negotiate/);
  assert.equal(outcomeTexts.size, 2);
}

function testLegacySaiyinRomanceAndMarriageSemanticsAreRetired(): void {
  const alliance = getEvent(IDS.alliance);
  const endingEnvoy = getEvent(IDS.endingEnvoy);
  const activeText = JSON.stringify(eventLoader.getAllEvents());
  assert.doesNotMatch(activeText, /border_alliance_marriage|lover_saiyin|border_path_marriage/);
  assert.doesNotMatch(JSON.stringify(alliance), /联姻|婚姻|恋爱|lover_saiyin|border_path_marriage/);
  assertNoSaiyinRomanceSemantics(alliance);
  assertNoSaiyinRomanceSemantics(endingEnvoy);

  const condition = endingEnvoy.conditions?.[0];
  assert.equal(
    condition && 'expression' in condition ? condition.expression : undefined,
    'flags.has("route_border") && flags.has("border_alliance") && flags.has("border_path_contract") && !flags.has("border_ending_envoy")',
  );
  assert.match(`${endingEnvoy.content.title} ${endingEnvoy.content.text} ${endingEnvoy.content.description}`, /赛音/);
  assert.match(`${endingEnvoy.content.title} ${endingEnvoy.content.text} ${endingEnvoy.content.description}`, /互市|盟约/);
  assert.doesNotMatch(`${endingEnvoy.content.title} ${endingEnvoy.content.text}`, /和亲/);
}

async function main(): Promise<void> {
  await testSaiyinEntersThroughTradeRouteAndUsesExistingHistories();
  await testConditionalContractKeepsAllianceResultAndChangesText();
  testLegacySaiyinRomanceAndMarriageSemanticsAreRetired();
  console.log('characterRelationshipSaiyinV1.test.ts: ok');
}

void main();
