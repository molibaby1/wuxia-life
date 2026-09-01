import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';

function createOfficialEngine(eventHistory: string[]): GameEngineIntegration {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 30;
  state.player.knowledge = 20;
  state.player.charisma = 10;
  state.player.affiliation = null;
  state.flags = { route_official: true };
  state.player.flags = state.flags;
  state.eventHistory = eventHistory.map(eventId => ({ eventId, age: 24 }));
  state.player.events = [];
  return engine;
}

function officialResignIsEligible(eventHistory: string[]): boolean {
  return createOfficialEngine(eventHistory)
    .getAvailableEvents(30)
    .some(event => event.id === 'official_resign');
}

assert.equal(
  officialResignIsEligible(['route_official']),
  false,
  'official_resign must remain unavailable before official_first_post',
);
assert.equal(
  officialResignIsEligible(['route_official', 'official_first_post']),
  true,
  'official_resign must become eligible after official_first_post',
);

console.log('officialCausalOrdering.test.ts: ok');
