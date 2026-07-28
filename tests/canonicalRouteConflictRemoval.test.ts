import fs from 'node:fs';
import path from 'node:path';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { RouteStateManager } from '../src/core/RouteStateManager';
import { EffectType, EventCategory, EventPriority } from '../src/types/eventTypes';
import type { EventDefinition, GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`canonicalRouteConflictRemoval.test.ts: ${message}`);
}

function createRouteEvent(id: string, tags: string[] = [], conditions?: EventDefinition['conditions']): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight: 100,
    ageRange: { min: 20, max: 40 },
    triggers: [],
    content: { title: id, text: id },
    eventType: 'auto',
    conditions,
    autoEffects: [{ type: EffectType.FLAG_SET, target: 'route_demonic', value: true }],
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags },
  } as EventDefinition;
}

function withLockedSect(state: GameState): void {
  state.routeStates = {
    sect: {
      routeId: 'sect',
      lifecycle: 'locked_in',
      category: 'main',
      lockedIn: true,
    },
  };
}

function testConflictingCandidatesRemainSelectable(): void {
  const engine = new GameEngineIntegration() as any;
  const state = engine.getGameState() as GameState;
  state.player.age = 24;
  withLockedSect(state);

  const originalGetAvailableEvents = engine.getAvailableEvents.bind(engine);
  const conflictEvent = createRouteEvent('canonical_demonic_without_turn');
  const transitionEvent = createRouteEvent('canonical_demonic_with_turn', ['route_turn'], [
    { type: 'expression', expression: 'flags.has("canonical_route_guard")' },
  ]);
  const originalFlags = state.flags;
  state.flags = { ...state.flags, canonical_route_guard: true };

  try {
    engine.getAvailableEvents = () => [conflictEvent];
    assert(
      engine.selectEvent(24)?.id === conflictEvent.id,
      'active/locked sect must not filter a demonic candidate by generic route compatibility',
    );

    engine.getAvailableEvents = () => [transitionEvent];
    assert(
      engine.selectEvent(24)?.id === transitionEvent.id,
      'route_turn metadata must not be required for a conflicting candidate',
    );
  } finally {
    engine.getAvailableEvents = originalGetAvailableEvents;
    state.flags = originalFlags;
  }
}

async function testRouteFlagActivationCoexists(): Promise<void> {
  const executor = new EventExecutor();
  let state = new GameEngineIntegration().getGameState() as GameState;
  state = RouteStateManager.writeRouteState(state, {
    routeId: 'sect',
    lifecycle: 'locked_in',
    category: 'main',
    lockedIn: true,
    eventId: 'canonical_sect_lock',
  });

  const nextState = await executor.executeEffects(
    [{ type: EffectType.FLAG_SET, target: 'route_demonic', value: true }],
    state,
  );

  assert(nextState.player.flags.route_demonic === true, 'route_demonic flag must still be written');
  assert(
    RouteStateManager.readRouteState(nextState, 'sect').lifecycle === 'locked_in',
    'activating a new route flag must not turn the existing sect route',
  );
  assert(
    !(nextState.routeHistory ?? []).some(item => item.routeId === 'sect' && item.to === 'turned'),
    'activating a new route flag must not write a sect turned history record',
  );
  assert(RouteStateManager.readRouteState(nextState, 'demonic').lifecycle === 'active', 'demonic route state remains active');
}

function testExplicitConditionsStillFilterCandidates(): void {
  const engine = new GameEngineIntegration() as any;
  const state = engine.getGameState() as GameState;
  state.player.age = 24;
  state.flags = {
    ...state.flags,
    canonical_route_guard: true,
    sect_faction: 'orthodox',
  };
  state.player.flags = state.flags;
  state.identity = { identities: ['heroic'], primary: 'heroic' };
  state.player.comprehension = 10;
  state.player.statuses = ['injured'];
  withLockedSect(state);

  const allowed = createRouteEvent('canonical_condition_allowed', [], [
    { type: 'expression', expression: 'flags.has("canonical_route_guard")' },
    { type: 'status_has', status: 'injured' },
  ]);
  (allowed as any).thresholds = {
    attributes: { comprehension: { min: 10 } },
    identity: { required: ['heroic'] },
  };
  (allowed as any).triggerConditions = {
    flags: { required: ['sect_faction'] },
    identity: { required: ['heroic'] },
  };
  const rejected = createRouteEvent('canonical_condition_rejected', [], [
    { type: 'expression', expression: 'flags.has("missing_canonical_route_guard")' },
  ]);
  assert((engine as any).passesRuntimeEventGuards(allowed, state), 'explicit true condition must remain effective');
  assert(!(engine as any).passesRuntimeEventGuards(rejected, state), 'explicit false condition must remain effective');
}

function testRepositoryGuard(): void {
  const engineSource = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  const managerSource = fs.readFileSync(path.resolve('src/core/RouteStateManager.ts'), 'utf8');
  assert(!engineSource.includes('passesRouteConflictChecks'), 'runtime must not contain generic candidate conflict filter');
  assert(!managerSource.includes('resolveStrongExclusionsBeforeActivate'), 'runtime must not contain generic auto-turn helper');
}

await testConflictingCandidatesRemainSelectable();
await testRouteFlagActivationCoexists();
testExplicitConditionsStillFilterCandidates();
testRepositoryGuard();
console.log('canonicalRouteConflictRemoval.test.ts passed');
