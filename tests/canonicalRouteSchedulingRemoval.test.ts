import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventPriority } from '../src/types/eventTypes';
import type { EventDefinition, GameState } from '../src/types/eventTypes';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { getNarrativeSchedulingMultiplier } from '../src/p11/schedulingPolicy';

function makeEvent(id: string, overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id,
    title: id,
    description: id,
    ageRange: { min: 20, max: 20 },
    eventType: 'side_quest',
    category: 'life',
    priority: EventPriority.NORMAL,
    ...overrides,
  } as EventDefinition;
}

function createState(): GameState {
  return {
    player: {
      age: 20,
      money: 500,
      reputation: 100,
      martialPower: 50,
      comprehension: 50,
      chivalry: 80,
      flags: { route_sect: true },
    },
    flags: { route_sect: true },
    routeStates: {
      sect: { routeId: 'sect', lifecycle: 'active', startedAt: 20 },
    },
    eventHistory: [],
  } as GameState;
}

function configureEngine(engine: GameEngineIntegration): GameState {
  const state = engine.getGameState();
  const fixture = createState();
  Object.assign(state.player, fixture.player);
  state.flags = { ...fixture.flags };
  state.routeStates = { ...fixture.routeStates };
  state.eventHistory = [];
  return state;
}

function testRouteEventsDoNotBreakCandidateCap(): void {
  const engine = new GameEngineIntegration();
  configureEngine(engine);
  const original = eventLoader.getEventsByAge;
  const events = Array.from({ length: 13 }, (_, index) =>
    makeEvent(`canonical_route_cap_${index + 1}`, {
      priority: index < 12 ? EventPriority.LOW : EventPriority.NORMAL,
      metadata: index === 12 ? { routeTargets: ['sect'] } : undefined,
    }),
  );
  eventLoader.getEventsByAge = (() => events) as typeof eventLoader.getEventsByAge;

  try {
    const available = engine.getAvailableEvents(20);
    assert.equal(available.length, 12, 'route-matching event must not bypass the formal candidate cap');
    assert.equal(
      available.some(event => event.id === 'canonical_route_cap_13'),
      false,
      'route state/route flag must not inject the 13th event',
    );
  } finally {
    eventLoader.getEventsByAge = original;
  }
}

function testMandatoryInjectionStillWorks(): void {
  const engine = new GameEngineIntegration();
  configureEngine(engine);
  const original = eventLoader.getEventsByAge;
  const events = Array.from({ length: 13 }, (_, index) =>
    makeEvent(`canonical_mandatory_cap_${index + 1}`, {
      priority: index < 12 ? EventPriority.LOW : EventPriority.NORMAL,
      metadata: index === 12 ? { tags: ['mandatory'] } : undefined,
    }),
  );
  eventLoader.getEventsByAge = (() => events) as typeof eventLoader.getEventsByAge;

  try {
    const available = engine.getAvailableEvents(20);
    assert.equal(
      available.some(event => event.id === 'canonical_mandatory_cap_13'),
      true,
      'mandatory event injection must remain active',
    );
  } finally {
    eventLoader.getEventsByAge = original;
  }
}

function testRouteMultiplierIsGone(): void {
  const engine = new GameEngineIntegration();
  configureEngine(engine);
  const routeEvent = makeEvent('canonical_route_multiplier', { metadata: { routeTargets: ['sect'] } });
  const ordinaryEvent = makeEvent('canonical_ordinary_multiplier');
  const routeMultiplier = (engine as any).getRouteSchedulingMultiplier(routeEvent);
  const ordinaryMultiplier = (engine as any).getRouteSchedulingMultiplier(ordinaryEvent);
  assert.equal(routeMultiplier, ordinaryMultiplier, 'active route must not receive the legacy 1.35 multiplier');
}

function testPathConflictDoesNotFilterFormalEvents(): void {
  const engine = new GameEngineIntegration();
  const state = configureEngine(engine);
  const conflict = makeEvent('canonical_path_conflict', {
    priority: EventPriority.CRITICAL,
    metadata: { pathConflicts: { merchant: 80 } },
  });
  const ordinary = makeEvent('canonical_path_ordinary');
  (engine as any).getAvailableEvents = () => [conflict, ordinary];

  const selected = engine.selectEvent(20);
  assert.equal(selected?.id, conflict.id, 'pathConflicts must not filter a formal event');
}

function testExplicitConditionsRemainRuntimeGuards(): void {
  const engine = new GameEngineIntegration();
  const state = configureEngine(engine);
  state.player!.flags = { ...state.player!.flags, canonical_flag: true, sect_faction: 'orthodox' };
  state.flags = { ...state.flags, canonical_flag: true, sect_faction: 'orthodox' };
  state.identity = { primary: 'heroic' } as any;
  state.player!.statuses = ['injured'];
  const allowed = makeEvent('canonical_explicit_allowed', {
    conditions: [
      { type: 'expression', expression: 'flags.has("canonical_flag")' },
      { type: 'status_has', status: 'injured' } as any,
    ],
    thresholds: {
      attributes: { comprehension: { min: 50 } },
      identity: { required: ['heroic'] },
    },
  });
  const rejected = makeEvent('canonical_explicit_rejected', {
    conditions: [{ type: 'expression', expression: 'flags.has("missing_canonical_flag")' }],
  });

  assert.equal((engine as any).passesRuntimeEventGuards(allowed, state), true, 'explicit conditions must remain effective');
  assert.equal((engine as any).passesRuntimeEventGuards(rejected, state), false, 'failed explicit conditions must still reject');
}

function testRepositoryGuard(): void {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), 'src/core/GameEngineIntegration.ts'),
    'utf8',
  );
  for (const forbidden of [
    'injectActiveRouteCandidates',
    'getActivePlayerRouteKeys',
    'eventBelongsToActiveRoute',
    'getDominantPaths',
    'isPathConflicting',
    'adjustWeightByPath',
    'routeMultiplier',
  ]) {
    assert.equal(source.includes(forbidden), false, `legacy route scheduling token remains: ${forbidden}`);
  }
  assert.equal(typeof getNarrativeSchedulingMultiplier, 'function', 'P11 scheduling multiplier must remain available');
}

testRouteEventsDoNotBreakCandidateCap();
testMandatoryInjectionStillWorks();
testRouteMultiplierIsGone();
testPathConflictDoesNotFilterFormalEvents();
testExplicitConditionsRemainRuntimeGuards();
testRepositoryGuard();
console.log('canonicalRouteSchedulingRemoval.test.ts passed');
