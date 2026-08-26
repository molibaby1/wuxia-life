import assert from 'node:assert/strict';
import { EndingSystem } from '../src/core/EndingSystem';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: 'generic-ending-retirement',
    gender: 'male',
    age: 70,
    martialPower: 0,
    chivalry: 0,
    charisma: 0,
    constitution: 50,
    money: 999999,
    wealthCapacity: 'no_surplus',
    reputation: 0,
    connections: 10,
    healthStatus: 'healthy',
    statuses: [],
    alive: true,
    items: [],
    flags: { business_empire: true },
    events: [],
    relationships: [],
    businessAcumen: 100,
    influence: 0,
  };
  return {
    player,
    flags: { business_empire: true },
    relations: {},
    eventHistory: [],
    achievements: [],
    karma: { good_karma: 0, evil_karma: 0, history: [] },
  } as GameState;
}

function run(): void {
  assert.equal(EndingSystem.getEndingById('richest_man'), undefined);
  assert.equal(EndingSystem.getAllEndings().some(ending => ending.id === 'richest_man'), false);

  const state = createState();
  assert.notEqual(EndingSystem.determineEnding(state).id, 'richest_man');
  assert.equal(EndingSystem.canUnlockEnding(state, 'richest_man'), false);
}

run();
console.log('genericRichestManLegacyAliasRetirement.test.ts: ok');
