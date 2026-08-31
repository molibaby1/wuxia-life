import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import { resolveActiveRelationshipConsequences } from '../src/p17/relationshipConsequences';
import { resolveChoiceEffects } from '../src/core/ChoiceOutcomeResolver';
import type { EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

const LIFE_SAVING_ID = 'relationship_life_saving';
const DEBT_RETURN_ID = 'relationship_debt_return';
const PENDING_FLAG = 'life_debt_owed_to_player';

function getEvent(id: string): EventDefinition {
  const event = eventLoader.getEventById(id);
  assert(event, `missing relationship event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `missing choice: ${event.id}/${id}`);
  return choice;
}

function createEngine(): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 25;
  state.player.chivalry = 50;
  state.player.martialPower = 60;
  state.player.reputation = 12;
  state.player.charisma = 18;
  state.player.flags = {};
  state.flags = {};
  state.eventHistory = [];
  state.achievements = [];
  state.relations = {};
  state.player.relationships = [];
  engine.setSuppressLethalSetbacks(true);
  return engine;
}

async function choose(
  engine: GameEngineIntegration,
  event: EventDefinition,
  choice: EventChoice,
): Promise<void> {
  const resolved = resolveChoiceEffects(engine.getGameState(), event, choice);
  assert(resolved, `choice did not resolve: ${event.id}/${choice.id}`);
  await engine.executeChoiceEffects(resolved.effects, event.id, choice.id);
}

function conditionMatches(event: EventDefinition, state: GameState): boolean {
  const condition = event.conditions?.[0];
  assert(condition, `${event.id} must retain a condition`);
  return new ConditionEvaluator().evaluate(condition, state);
}

function playerSnapshot(state: GameState): Record<string, unknown> {
  return {
    chivalry: state.player.chivalry,
    reputation: state.player.reputation,
    charisma: state.player.charisma,
    wealthCapacity: state.player.wealthCapacity,
    achievements: [...(state.achievements ?? [])],
    relations: { ...state.relations },
    relationships: [...(state.player.relationships ?? [])],
  };
}

async function run(): Promise<void> {
  const savingEvent = getEvent(LIFE_SAVING_ID);
  const returnEvent = getEvent(DEBT_RETURN_ID);

  assert.equal(savingEvent.eventType, 'choice', 'saving must distinguish save from non-save');
  assert.equal(savingEvent.autoEffects?.length ?? 0, 0, 'saving must not retain automatic good-deed effects');
  assert.equal(savingEvent.choices?.length, 2, 'saving must expose save and non-save choices');

  const saveChoice = savingEvent.choices?.find(choice => choice.id.includes('save'));
  const nonSaveChoice = savingEvent.choices?.find(choice => choice.id.includes('not'));
  assert(saveChoice, 'actual saving choice must exist');
  assert(nonSaveChoice, 'non-saving choice must exist');

  const saveEngine = createEngine();
  const beforeSave = playerSnapshot(saveEngine.getGameState());
  await choose(saveEngine, savingEvent, saveChoice);
  const savedState = saveEngine.getGameState();
  assert.deepEqual(playerSnapshot(savedState), beforeSave, 'saving must not grant generic stat or relationship rewards');
  assert.equal(savedState.flags[PENDING_FLAG], true, 'actual saving must create the directional pending favor');
  assert.equal(savedState.flags.has_life_debt, undefined, 'legacy life-debt flag must not be produced');
  assert.equal(savedState.eventHistory.some(record => record.eventId === LIFE_SAVING_ID), true);
  assert.equal(conditionMatches(returnEvent, savedState), true, 'return must be eligible after actual saving');

  const nonSaveEngine = createEngine();
  await choose(nonSaveEngine, savingEvent, nonSaveChoice);
  const nonSavedState = nonSaveEngine.getGameState();
  assert.equal(nonSavedState.flags[PENDING_FLAG], undefined, 'non-saving must not create a pending favor');
  assert.equal(conditionMatches(returnEvent, nonSavedState), false, 'return must be blocked after non-saving');

  const historyWithoutPending = createEngine().getGameState();
  historyWithoutPending.eventHistory = [{ eventId: LIFE_SAVING_ID, age: 25 }];
  assert.equal(conditionMatches(returnEvent, historyWithoutPending), false, 'event occurrence alone must not unlock return');

  const beforeReturn = playerSnapshot(savedState);
  await saveEngine.executeAutoEvent(returnEvent);
  const returnedState = saveEngine.getGameState();
  assert.deepEqual(playerSnapshot(returnedState), beforeReturn, 'return must not grant generic payoff rewards');
  assert.equal(returnedState.flags[PENDING_FLAG], undefined, 'return must close the pending favor');
  assert.equal(returnedState.flags.has_life_debt, undefined, 'return must not restore the legacy flag');
  assert.equal(conditionMatches(returnEvent, returnedState), false, 'closed favor must not remain return-eligible');
  assert.equal(returnedState.eventHistory.some(record => record.eventId === LIFE_SAVING_ID), true);
  assert.equal(returnedState.eventHistory.some(record => record.eventId === DEBT_RETURN_ID), true);

  const p17Active = resolveActiveRelationshipConsequences(savedState);
  assert.equal(
    p17Active.some(item => item.pattern.id === 'p17_life_debt_burden'),
    false,
    'P17 must not turn a favor owed to the player into player responsibility or maintenance',
  );
  const lifeMemory = deriveLifeMemorySummary(savedState);
  assert.equal(
    lifeMemory.unresolvedDebts?.some(entry => entry.label.includes('救命')) ?? false,
    false,
    'Life Memory must not present the favor owed to the player as player debt',
  );

  assert.equal(returnEvent.autoEffects?.length, 1, 'return must only close the pending favor');
  assert.equal(returnEvent.autoEffects?.[0]?.type, 'flag_unset');
  assert.equal(returnEvent.autoEffects?.[0]?.target, PENDING_FLAG);
  assert.equal(returnEvent.content.text.includes('善有善报'), false, 'return copy must not promise universal moral payoff');
  assert.equal(returnEvent.personBinding, undefined, 'life-debt events must not integrate a Person Archetype');

  const relationshipSource = fs.readFileSync('src/data/lines/relationship.json', 'utf8');
  assert.equal(relationshipSource.includes('has_life_debt'), false, 'legacy flag must leave active relationship production');
  assert.equal(
    (relationshipSource.match(new RegExp(PENDING_FLAG, 'g')) ?? []).length,
    3,
    'directional flag must only appear in the producer, return condition, and closure effect',
  );
  for (const sourcePath of [
    'src/core/deriveLifeMemorySummary.ts',
    'src/data/lifeMemoryLabels.ts',
    'src/narrative/profile/wuxiaConsequenceSurfaces.ts',
  ]) {
    assert.equal(
      fs.readFileSync(sourcePath, 'utf8').includes('has_life_debt'),
      false,
      `${sourcePath} must not consume the legacy life-debt semantic`,
    );
  }

  console.log('lifeDebtTransientSemantics.test.ts: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
