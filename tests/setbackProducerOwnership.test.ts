/**
 * PD-109 — Canonical Setback Occurrence / Resolution Ownership
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import type { RuntimeEventCatalog } from '../src/core/RuntimeEventCatalog';
import {
  getCanonicalFormalSetbackEventId,
  MAPPED_DIFFICULTY_TO_FORMAL_SETBACK,
} from '../src/core/SetbackEventSystem';
import { SETBACK_EVENTS, canSetbackEventTrigger } from '../src/data/setbackEvents';
import {
  EventCategory,
  EventPriority,
  type EventDefinition,
  type PlayerState,
} from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const EXACT_MAPPING: ReadonlyArray<readonly [string, string]> = [
  ['serious_illness', 'setback_illness'],
  ['injury_accident', 'setback_injury'],
  ['early_death', 'setback_early_death'],
  ['property_loss', 'setback_property_loss'],
  ['relationship_betrayal', 'setback_betrayal'],
  [' cultivation_deviation', 'setback_cultivation_deviation'],
];

const MAPPED_FORMAL_IDS = EXACT_MAPPING.map(([, formalId]) => formalId);
const MAPPED_DIFFICULTY_IDS = new Set(EXACT_MAPPING.map(([difficultyId]) => difficultyId));

const LINES_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/data/lines');

function probeAutoEvent(id = 'pd109_probe_auto'): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.DAILY_EVENT,
    priority: EventPriority.NORMAL,
    weight: 1,
    ageRange: { min: 0, max: 100 },
    triggers: [],
    eventType: 'auto',
    content: { title: 'probe', text: 'probe' },
    autoEffects: [{ type: 'time_advance', target: 'age', value: 0 }],
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
  };
}

function createCatalogEvent(partial: Partial<EventDefinition> & { id: string }): EventDefinition {
  return {
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight: 10,
    ageRange: { min: 20, max: 20 },
    triggers: [],
    eventType: 'auto',
    content: { title: partial.id, text: partial.id },
    autoEffects: [{ type: 'flag_set', target: `${partial.id}_fired`, value: true }],
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
    ...partial,
  };
}

function withForcedDifficultySetback(
  targetId: string,
  player: Pick<PlayerState, 'age' | 'constitution'>,
  run: () => Promise<void>,
): Promise<void> {
  const original = Math.random;
  const rolls: number[] = [];
  for (const event of SETBACK_EVENTS) {
    if (!canSetbackEventTrigger(event, player.age, player.constitution)) continue;
    if (event.id === targetId) {
      rolls.push(0);
      rolls.push(0.999);
    } else {
      rolls.push(0.999);
    }
  }
  let index = 0;
  Math.random = () => {
    if (index >= rolls.length) return 0.999;
    return rolls[index++];
  };
  return run().finally(() => {
    Math.random = original;
  });
}

function testExactMapping(): void {
  assert.deepEqual(
    Object.entries(MAPPED_DIFFICULTY_TO_FORMAL_SETBACK).sort(([a], [b]) => a.localeCompare(b)),
    [...EXACT_MAPPING].sort(([a], [b]) => a.localeCompare(b)),
  );

  for (const [difficultyId, formalId] of EXACT_MAPPING) {
    assert.equal(getCanonicalFormalSetbackEventId(difficultyId), formalId);
    const formal = eventLoader.getEventById(formalId);
    assert.ok(formal, `${formalId} must exist in Runtime Event Catalog`);
    assert.equal(formal.isSetbackEvent, true, `${formalId} must be isSetbackEvent`);
  }

  for (const event of SETBACK_EVENTS) {
    if (MAPPED_DIFFICULTY_IDS.has(event.id)) continue;
    assert.equal(
      getCanonicalFormalSetbackEventId(event.id),
      undefined,
      `unmapped difficulty ${event.id} must not fabricate a Formal mapping`,
    );
  }

  assert.equal(getCanonicalFormalSetbackEventId('cultivation_deviation'), undefined);
}

function testOrdinaryFormalSchedulingExclusion(): void {
  const setback = createCatalogEvent({
    id: 'pd109_synthetic_setback',
    isSetbackEvent: true,
    setbackSeverity: 'minor',
  });
  const ordinary = createCatalogEvent({
    id: 'pd109_synthetic_ordinary',
  });
  const events = [setback, ordinary];
  const catalog: RuntimeEventCatalog = {
    getAllEvents: () => events,
    getEventsByAge: age => (age === 20 ? events : []),
    getEventById: id => events.find(event => event.id === id),
    getWeightForAge: event => event.weight ?? 1,
  };

  const engine = new GameEngineIntegration(catalog);
  engine.startNewGame('PD109排程', 'male');
  const state = engine.getGameState();
  state.player.age = 20;
  state.player.constitution = 40;

  const available = engine.getAvailableEvents(20);
  assert.equal(
    available.some(event => event.id === 'pd109_synthetic_setback'),
    false,
    'otherwise-eligible isSetbackEvent must not be an ordinary scheduling candidate',
  );
  assert.equal(
    available.some(event => event.id === 'pd109_synthetic_ordinary'),
    true,
    'otherwise-equivalent ordinary event must remain available',
  );

  const live = new GameEngineIntegration();
  live.startNewGame('PD109早逝排程', 'male');
  live.getGameState().player.age = 28;
  live.getGameState().player.constitution = 40;
  assert.equal(
    live.getAvailableEvents(28).some(event => event.id === 'setback_early_death'),
    false,
    'ordinary Formal selection cannot directly produce setback_early_death',
  );
}

async function testMappedRuntimeResolutionInjury(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('PD109受伤', 'male');
  const state = engine.getGameState();
  state.player.age = 20;
  state.player.constitution = 40;
  state.player.martialPower = 30;
  state.player.healthStatus = 'healthy';
  state.player.statuses = [];

  await withForcedDifficultySetback('injury_accident', state.player, async () => {
    const result = await engine.executeAutoEvent(probeAutoEvent('pd109_injury_probe'));
    const setbackStages = result.stageResults.filter(stage => stage.sourceKind === 'setback');
    assert.equal(setbackStages.length, 1);
    assert.equal(setbackStages[0]?.id, 'setback_injury');
    assert.equal(setbackStages[0]?.title, '意外受伤');

    const after = engine.getGameState();
    assert.equal(after.player.healthStatus, 'unwell');
    assert.ok(after.player.statuses?.includes('injured'));
    assert.equal(after.player.constitution, 35);
    assert.equal(after.player.martialPower, 27);

    const historyIds = (after.eventHistory ?? []).map(entry => entry.eventId);
    assert.ok(historyIds.includes('setback_injury'));
    assert.equal(historyIds.includes('injury_accident'), false);
    assert.equal(historyIds.filter(id => id === 'setback_injury').length, 1);
  });
}

async function testEarlyDeathSingleProducerPath(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('PD109早逝', 'male');
  const state = engine.getGameState();
  state.player.age = 28;
  state.player.constitution = 50;

  await withForcedDifficultySetback('early_death', state.player, async () => {
    const result = await engine.executeAutoEvent(probeAutoEvent('pd109_early_death_probe'));
    const setbackStages = result.stageResults.filter(stage => stage.sourceKind === 'setback');
    assert.equal(setbackStages.length, 1);
    assert.equal(setbackStages[0]?.id, 'setback_early_death');

    const after = engine.getGameState();
    assert.equal(after.player.alive, false);
    assert.equal(after.player.deathReason, '英年早逝');
    assert.equal(after.flags.gameEnded, true);

    const historyIds = (after.eventHistory ?? []).map(entry => entry.eventId);
    assert.ok(historyIds.includes('setback_early_death'));
    assert.equal(historyIds.includes('early_death'), false);
  });

  assert.equal(
    engine.getAvailableEvents(28).some(event => event.id === 'setback_early_death'),
    false,
  );
}

async function testLethalSuppressionHasNoFormalBypass(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('PD109抑制', 'male');
  engine.setSuppressLethalSetbacks(true);
  const state = engine.getGameState();
  state.player.age = 28;
  state.player.constitution = 50;

  await withForcedDifficultySetback('early_death', state.player, async () => {
    const result = await engine.executeAutoEvent(probeAutoEvent('pd109_suppress_probe'));
    const setbackStages = result.stageResults.filter(stage => stage.sourceKind === 'setback');
    assert.equal(
      setbackStages.some(stage => stage.id === 'setback_early_death' || stage.id === 'early_death'),
      false,
      'suppressLethalSetbacks must skip Difficulty early_death',
    );
    assert.equal(engine.getGameState().player.alive, true);
    assert.equal(engine.getGameState().flags.gameEnded, undefined);
  });

  assert.equal(
    engine.getAvailableEvents(28).some(event => event.id === 'setback_early_death'),
    false,
    'Formal setbacks must not remain a second early-death producer path',
  );
}

async function testCultivationDeviationCanonicalHistory(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('PD109走火', 'male');
  const state = engine.getGameState();
  state.player.age = 22;
  state.player.constitution = 50;
  state.player.martialPower = 40;

  await withForcedDifficultySetback(' cultivation_deviation', state.player, async () => {
    const result = await engine.executeAutoEvent(probeAutoEvent('pd109_cultivation_probe'));
    const setbackStages = result.stageResults.filter(stage => stage.sourceKind === 'setback');
    assert.equal(setbackStages.length, 1);
    assert.equal(setbackStages[0]?.id, 'setback_cultivation_deviation');

    const historyIds = (engine.getGameState().eventHistory ?? []).map(entry => entry.eventId);
    assert.ok(historyIds.includes('setback_cultivation_deviation'));
    assert.equal(historyIds.includes(' cultivation_deviation'), false);
    assert.equal(historyIds.includes('cultivation_deviation'), false);
  });
}

function testStaticOwnershipCheck(): void {
  const authored = JSON.parse(readFileSync(join(LINES_DIR, 'setback-events.json'), 'utf8')) as Array<{
    id: string;
    isSetbackEvent?: boolean;
    triggers?: Array<{ type: string }>;
  }>;

  for (const formalId of MAPPED_FORMAL_IDS) {
    const runtime = eventLoader.getEventById(formalId);
    assert.ok(runtime, `${formalId} must be runtime-loaded`);
    assert.equal(runtime.isSetbackEvent, true);

    const authoredEvent = authored.find(event => event.id === formalId);
    assert.ok(authoredEvent, `${formalId} must exist in setback-events.json`);
    assert.equal(authoredEvent.isSetbackEvent, true);
    assert.equal(
      (authoredEvent.triggers ?? []).some(trigger => trigger.type === 'random'),
      false,
      `${formalId} must not declare triggers.random`,
    );
  }

  const live = new GameEngineIntegration();
  live.startNewGame('PD109静态', 'male');
  for (const age of [20, 28, 35]) {
    live.getGameState().player.age = age;
    live.getGameState().player.constitution = 40;
    const available = live.getAvailableEvents(age);
    assert.equal(
      available.some(event => event.isSetbackEvent === true),
      false,
      `ordinary Formal scheduling at age ${age} must not select isSetbackEvent`,
    );
  }
}

async function main(): Promise<void> {
  testExactMapping();
  testOrdinaryFormalSchedulingExclusion();
  await testMappedRuntimeResolutionInjury();
  await testEarlyDeathSingleProducerPath();
  await testLethalSuppressionHasNoFormalBypass();
  await testCultivationDeviationCanonicalHistory();
  testStaticOwnershipCheck();
  console.log('setbackProducerOwnership.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
