import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';

const OFFICIAL_COLLEAGUE = '许慎言';

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

function loadedOfficialEvent(eventId: string) {
  const event = eventLoader.getEventById(eventId);
  assert.ok(event, `${eventId} must be loaded by the formal EventLoader`);
  return event;
}

const firstPostEvent = loadedOfficialEvent('official_first_post');
const resignEvent = loadedOfficialEvent('official_resign');
const firstPostText = firstPostEvent.content.text;
const resignText = resignEvent.content.text;
const officialText = `${firstPostText} ${resignText}`;

assert.equal(firstPostEvent.personBinding, undefined);
assert.equal(resignEvent.personBinding, undefined);
assert.match(firstPostText, new RegExp(OFFICIAL_COLLEAGUE));
assert.match(firstPostText, /同僚/);
assert.match(firstPostText, /赈济账目|卷宗/);
assert.match(firstPostText, /署名|责任/);
assert.match(firstPostText, /官场的复杂/);
assert.match(resignText, new RegExp(OFFICIAL_COLLEAGUE));
assert.match(resignText, /后来|再次|再见到/);
assert.doesNotMatch(resignText, /(?:多年|数年|几年|数载)后/);
assert.match(resignText, /共同接手|卷宗|责任/);
assert.match(resignText, /继续仕途/);
assert.match(resignText, /由你自己决定|你自己决定/);
assert.doesNotMatch(officialText, /导师|师父|上司|门生/);
assert.doesNotMatch(officialText, /恋爱|爱情|真爱|婚姻|成婚/);

console.log('officialCausalOrdering.test.ts: ok');
