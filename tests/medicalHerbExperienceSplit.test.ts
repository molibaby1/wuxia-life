import assert from 'node:assert/strict';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventDefinition } from '../src/types/eventTypes';

const APPRENTICE_EVENT_ID = 'medical_herb_gathering';
const SELF_TAUGHT_EVENT_ID = 'medical_herb_gathering_self_taught';

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing Medical herb event: ${id}`);
  return event;
}

function createEngine(flags: Record<string, boolean>): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Medical Herb Split', 'male');
  const state = engine.getGameState();
  state.player.age = 18;
  state.player.flags = { ...flags };
  state.flags = { ...flags };
  state.eventHistory = [];
  state.player.events = [];
  return engine;
}

function availableIds(engine: GameEngineIntegration): Set<string> {
  return new Set(engine.getAvailableEvents(18).map(event => event.id));
}

function effectTarget(effect: { target?: string; flag?: string; stat?: string }): string | undefined {
  return effect.target ?? effect.flag ?? effect.stat;
}

function testEventsAreRuntimeLoadedAndAligned(): void {
  const apprentice = getEvent(APPRENTICE_EVENT_ID);
  const selfTaught = getEvent(SELF_TAUGHT_EVENT_ID);

  assert.equal(apprentice.eventType, 'auto');
  assert.equal(selfTaught.eventType, 'auto');
  assert.deepEqual(selfTaught.ageRange, apprentice.ageRange);
  assert.deepEqual(selfTaught.triggers, apprentice.triggers);
  assert.equal(selfTaught.priority, apprentice.priority);
  assert.equal(selfTaught.weight, apprentice.weight);
  assert.equal(selfTaught.storyLine, undefined);
  assert.equal(selfTaught.personBinding, undefined);
  assert.equal(selfTaught.autoEffects?.some(effect => effect.type === 'relation_change'), false);
}

function testConditionsRouteOnlyToMatchingHistory(): void {
  const apprenticeIds = availableIds(createEngine({ medical_apprentice: true }));
  assert.equal(apprenticeIds.has(APPRENTICE_EVENT_ID), true);
  assert.equal(apprenticeIds.has(SELF_TAUGHT_EVENT_ID), false);

  const selfTaughtIds = availableIds(createEngine({ medical_self_taught: true }));
  assert.equal(selfTaughtIds.has(APPRENTICE_EVENT_ID), false);
  assert.equal(selfTaughtIds.has(SELF_TAUGHT_EVENT_ID), true);

  const contradictoryIds = availableIds(createEngine({
    medical_apprentice: true,
    medical_self_taught: true,
  }));
  assert.equal(contradictoryIds.has(APPRENTICE_EVENT_ID), false);
  assert.equal(contradictoryIds.has(SELF_TAUGHT_EVENT_ID), false);
}

function testPresentationSeparatesLearningHistories(): void {
  const apprentice = getEvent(APPRENTICE_EVENT_ID);
  const selfTaught = getEvent(SELF_TAUGHT_EVENT_ID);

  assert.match(apprentice.content.text, /师父/);
  assert.doesNotMatch(selfTaught.content.text, /师父|师门|老师|神医继续教导你/);
  assert.match(selfTaught.content.text, /独自|自己|摸索|实践/);
}

function testEffectsRemainEquivalent(): void {
  const apprentice = getEvent(APPRENTICE_EVENT_ID);
  const selfTaught = getEvent(SELF_TAUGHT_EVENT_ID);

  assert.deepEqual(selfTaught.autoEffects, apprentice.autoEffects);

  const effects = apprentice.autoEffects ?? [];
  assert.equal(
    effects.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'knowledge' && effect.value === 6),
    true,
  );
  assert.equal(
    effects.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'constitution' && effect.value === 4),
    true,
  );
  assert.equal(
    effects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_herb_master' && effect.value === true),
    true,
  );
}

testEventsAreRuntimeLoadedAndAligned();
testConditionsRouteOnlyToMatchingHistory();
testPresentationSeparatesLearningHistories();
testEffectsRemainEquivalent();

console.log('✅ Medical herb experience split contract tests passed');
