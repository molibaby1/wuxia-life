import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { difficultyManager } from '../src/core/DifficultyManager';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import relationshipLegacyDeferredEvents from '../src/data/lines/relationship-person-legacy-deferred.json';
import setbackEvents from '../src/data/lines/setback-events.json';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EventCondition, EventDefinition, GameState } from '../src/types/eventTypes';

type JsonRecord = Record<string, any>;

const MONEY_SENTINELS = [0, 9999];

function findEvent(events: JsonRecord[], id: string): JsonRecord {
  const event = events.find(candidate => candidate.id === id);
  assert(event, `missing event: ${id}`);
  return event;
}

function findChoice(event: JsonRecord, id: string): JsonRecord {
  const choice = event.choices?.find((candidate: JsonRecord) => candidate.id === id);
  assert(choice, `missing choice ${id} in ${event.id}`);
  return choice;
}

function statEffects(effects: JsonRecord[] | undefined): JsonRecord[] {
  return (effects ?? []).filter(effect => effect.type === 'stat_modify');
}

function makeState(money: number): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.charisma = 50;
  state.player.traits = [];
  state.flags.has_sworn_siblings = true;
  return { engine, state };
}

function isEligible(conditions: JsonRecord[] | undefined, state: GameState): boolean {
  const evaluator = new ConditionEvaluator();
  return (conditions ?? []).every(condition => evaluator.evaluate(condition as EventCondition, state));
}

function assertNoMoneyOrWealth(value: JsonRecord, label: string): void {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes('money'), false, `${label} must not reference money`);
  assert.equal(serialized.includes('wealth'), false, `${label} must not reference Wealth`);
}

function stateWithoutMoney(state: GameState): JsonRecord {
  const { money: _money, ...playerWithoutMoney } = state.player;
  return { ...state, player: playerWithoutMoney };
}

function testAuthoringSemantics(): void {
  const relationship = relationshipLegacyDeferredEvents as JsonRecord[];
  const setback = setbackEvents as JsonRecord[];
  const swornHelp = findEvent(relationship, 'relationship_sworn_help');
  const financialHelp = findChoice(swornHelp, 'sworn_help_financial');
  const enemyCreate = findEvent(relationship, 'relationship_enemy_create');
  const reconciliation = findChoice(enemyCreate, 'relationship_enemy_create_choice_1');
  const propertyLoss = findEvent(setback, 'setback_property_loss');

  assertNoMoneyOrWealth(swornHelp, 'relationship_sworn_help');
  assert.deepEqual(financialHelp.conditions ?? [], []);
  assert.equal(financialHelp.text.includes('金钱'), false);
  assert.equal(financialHelp.text.includes('-200'), false);
  assert.deepEqual(statEffects(financialHelp.effects), [
    { type: 'stat_modify', stat: 'chivalry', value: 8 },
    { type: 'stat_modify', stat: 'charisma', value: 5 },
  ]);

  assertNoMoneyOrWealth(enemyCreate, 'relationship_enemy_create');
  assert.deepEqual(reconciliation.conditions, [
    { type: 'expression', expression: 'charisma >= 50' },
  ]);
  assert.equal(reconciliation.text.includes('金钱'), false);
  assert.equal(reconciliation.text.includes('-100'), false);
  assert.deepEqual(statEffects(reconciliation.effects), [
    { type: 'stat_modify', stat: 'charisma', value: 8 },
    { type: 'stat_modify', stat: 'chivalry', value: 5 },
  ]);

  assertNoMoneyOrWealth(propertyLoss, 'setback_property_loss');
  assert.deepEqual(propertyLoss.conditions ?? [], []);
  assert.deepEqual(propertyLoss.autoEffects, [
    { type: 'flag_set', target: 'setback_property_loss_active', value: true },
  ]);
  assert.deepEqual(
    {
      id: propertyLoss.id,
      version: propertyLoss.version,
      category: propertyLoss.category,
      priority: propertyLoss.priority,
      weight: propertyLoss.weight,
      ageRange: propertyLoss.ageRange,
      triggers: propertyLoss.triggers,
      cooldown: propertyLoss.cooldown,
      maxTriggers: propertyLoss.maxTriggers,
      isSetbackEvent: propertyLoss.isSetbackEvent,
      setbackSeverity: propertyLoss.setbackSeverity,
      content: propertyLoss.content,
      metadata: propertyLoss.metadata,
    },
    {
      id: 'setback_property_loss',
      version: '1.0.0',
      category: 'setback',
      priority: 40,
      weight: 60,
      ageRange: { min: 15, max: 80 },
      triggers: [],
      cooldown: 4,
      maxTriggers: 3,
      isSetbackEvent: true,
      setbackSeverity: 'minor',
      content: {
        title: '财产损失',
        text: '由于遭遇盗匪，你损失了部分积蓄；此事导致你短期内手头紧拙，但慢慢经营还有机会补回。江湖上的风险总是防不胜防。',
        description: '财富损失是常见的风险',
      },
      metadata: {
        createdAt: 1773893913000,
        updatedAt: 1773893913000,
        author: 'difficulty_system',
        tags: ['挫折', '财产', '负面'],
        enabled: true,
      },
    },
  );
}

async function testRuntimeMoneyInvariance(): Promise<void> {
  const relationship = relationshipLegacyDeferredEvents as JsonRecord[];
  const setback = setbackEvents as JsonRecord[];
  const swornHelp = findEvent(relationship, 'relationship_sworn_help');
  const financialHelp = findChoice(swornHelp, 'sworn_help_financial');
  const enemyCreate = findEvent(relationship, 'relationship_enemy_create');
  const reconciliation = findChoice(enemyCreate, 'relationship_enemy_create_choice_1');
  const propertyLoss = findEvent(setback, 'setback_property_loss');
  const propertyLossRuntime = EventLoader.getInstance().getEventById('setback_property_loss');
  assert(propertyLossRuntime, 'setback_property_loss must load in the canonical EventLoader');
  const financialHelpOutcomes: JsonRecord[] = [];
  const reconciliationOutcomes: JsonRecord[] = [];
  const propertyLossOutcomes: JsonRecord[] = [];
  const previousSetbackProbability = difficultyManager.config.setbackEventProbability;
  difficultyManager.config.setbackEventProbability = 0;

  try {
    for (const money of MONEY_SENTINELS) {
      const swornHelpScenario = makeState(money);
      assert.equal(isEligible(swornHelp.conditions, swornHelpScenario.state), true);
      assert.equal(isEligible(financialHelp.conditions, swornHelpScenario.state), true);
      await swornHelpScenario.engine.executeChoiceEffects(
        financialHelp.effects,
        swornHelp.id,
        financialHelp.id,
      );
      const afterFinancialHelp = swornHelpScenario.engine.getGameState();
      assert.equal('money' in afterFinancialHelp.player, false);
      financialHelpOutcomes.push(stateWithoutMoney(afterFinancialHelp));

      const reconciliationScenario = makeState(money);
      assert.equal(isEligible(reconciliation.conditions, reconciliationScenario.state), true);
      await reconciliationScenario.engine.executeChoiceEffects(
        reconciliation.effects,
        enemyCreate.id,
        reconciliation.id,
      );
      const afterReconciliation = reconciliationScenario.engine.getGameState();
      assert.equal('money' in afterReconciliation.player, false);
      reconciliationOutcomes.push(stateWithoutMoney(afterReconciliation));

      const propertyLossScenario = makeState(money);
      assert.equal(isEligible(propertyLoss.conditions, propertyLossScenario.state), true);
      await propertyLossScenario.engine.executeAutoEvent(propertyLossRuntime);
      const afterPropertyLoss = propertyLossScenario.engine.getGameState();
      assert.equal('money' in afterPropertyLoss.player, false);
      assert.equal(afterPropertyLoss.flags.setback_property_loss_active, true);
      propertyLossOutcomes.push(stateWithoutMoney(afterPropertyLoss));
    }

    assert.deepEqual(financialHelpOutcomes[0], financialHelpOutcomes[1]);
    assert.deepEqual(reconciliationOutcomes[0], reconciliationOutcomes[1]);
    assert.deepEqual(propertyLossOutcomes[0], propertyLossOutcomes[1]);

    const belowCharisma = makeState(0).state;
    belowCharisma.player.charisma = 49;
    assert.equal(isEligible(reconciliation.conditions, belowCharisma), false);
  } finally {
    difficultyManager.config.setbackEventProbability = previousSetbackProbability;
  }
}

async function main(): Promise<void> {
  testAuthoringSemantics();
  await testRuntimeMoneyInvariance();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  console.log('globalMoneyRelationshipSetbackRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
