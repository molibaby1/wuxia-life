import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EndingSystem } from '../src/core/EndingSystem';
import { EventExecutor } from '../src/core/EventExecutor';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: 'Ending canonical fixture', gender: 'male', age: 70,
    martialPower: 0, externalSkill: 0, internalSkill: 0, qinggong: 0,
    chivalry: 0, charisma: 0, constitution: 50, comprehension: 50,
    money: 100, reputation: 0, connections: 20, healthStatus: 'healthy',
    statuses: [], alive: true, items: [], flags: {}, events: [], relationships: [],
    businessAcumen: 0, influence: 0,
  };
  return {
    player, flags: {}, relations: {}, eventHistory: [], achievements: [],
    karma: { good_karma: 0, evil_karma: 0, history: [] },
  } as GameState;
}

function withRoadLifecycle(state: GameState): GameState {
  return {
    ...state,
    routeStates: {
      martial: { routeId: 'martial', lifecycle: 'completed', category: 'main', lockedIn: true },
      statecraft: { routeId: 'statecraft', lifecycle: 'locked_in', category: 'main', lockedIn: true },
      official: { routeId: 'official', lifecycle: 'completed', category: 'main', lockedIn: true },
      hermit: { routeId: 'hermit', lifecycle: 'locked_in', category: 'main', lockedIn: true },
    } as any,
    routeHistory: [
      { routeId: 'martial', from: 'active', to: 'completed', age: 68 },
      { routeId: 'statecraft', from: 'active', to: 'locked_in', age: 60 },
    ] as any,
    roadCommitments: {
      martial: { roadId: 'martial', lifecycle: 'completed', proofCount: 99, position: 'primary' },
      statecraft: { roadId: 'statecraft', lifecycle: 'completed', proofCount: 99, position: 'primary' },
      official: { roadId: 'official', lifecycle: 'completed', proofCount: 99, position: 'primary' },
      hermit: { roadId: 'hermit', lifecycle: 'completed', proofCount: 99, position: 'primary' },
    } as any,
  };
}

function testRequirementsHaveNoRoad(): void {
  for (const ending of EndingSystem.getAllEndings()) {
    assert.equal(ending.requirements.road, undefined, `${ending.id} still has a road requirement`);
  }
  const source = fs.readFileSync(path.resolve('src/core/EndingSystem.ts'), 'utf8');
  for (const forbidden of ['requirements.road', 'roadCommitments', 'minProofCount', 'LifeRoadStage', 'LifeRoadId']) {
    assert.equal(source.includes(forbidden), false, `EndingSystem still contains ${forbidden}`);
  }
}

function testEndingQualificationIgnoresRoadLifecycle(): void {
  const state = createState();
  const roadState = withRoadLifecycle(state);
  for (const ending of EndingSystem.getAllEndings()) {
    assert.equal(
      EndingSystem.canUnlockEnding(state, ending.id),
      EndingSystem.canUnlockEnding(roadState, ending.id),
      `${ending.id} qualification depends on road lifecycle`,
    );
    assert.equal(
      EndingSystem.determineEnding(state).id,
      EndingSystem.determineEnding(roadState).id,
      `${ending.id} determination depends on road lifecycle`,
    );
  }
}

function testExplicitPositivePrerequisites(): void {
  const martial = createState();
  Object.assign(martial.player, { martialPower: 95, externalSkill: 80, internalSkill: 80, qinggong: 80 });
  assert.equal(EndingSystem.canUnlockEnding(martial, 'martial_god'), true);
  assert.equal(EndingSystem.canUnlockEnding(withRoadLifecycle(createState()), 'martial_god'), false);

  const sect = createState();
  Object.assign(sect.player, { age: 65, reputation: 80, martialPower: 70, influence: 35 });
  sect.player.flags = { establish_sect: true, succession_completed: true };
  assert.equal(EndingSystem.canUnlockEnding(sect, 'sect_founder'), true);

  const richest = createState();
  Object.assign(richest.player, { age: 60, money: 1500, businessAcumen: 70 });
  richest.player.flags = { business_empire: true };
  assert.equal(EndingSystem.canUnlockEnding(richest, 'richest_man'), true);

  const official = createState();
  Object.assign(official.player, { age: 60, reputation: 70 });
  official.player.flags = { official_first_post: true, route_official_completed: true };
  assert.equal(EndingSystem.canUnlockEnding(official, 'official_minister'), true);
  official.player.flags = { official_first_post: true };
  assert.equal(EndingSystem.canUnlockEnding(official, 'official_minister'), false);

  const hermit = createState();
  hermit.player.flags = { peacefulHermit: true, retiredInCountryside: true };
  assert.equal(EndingSystem.canUnlockEnding(hermit, 'hermit_master'), true);
  hermit.player.flags = { retired: true };
  assert.equal(EndingSystem.canUnlockEnding(hermit, 'hermit_master'), false);
}

async function testEndGameDoesNotCompleteRoad(): Promise<void> {
  const executor = new EventExecutor();
  const cases: GameState[] = [];

  const positive = createState();
  Object.assign(positive.player, { age: 60, money: 1500, businessAcumen: 70 });
  positive.player.flags = { business_empire: true };
  cases.push(positive);

  cases.push(createState());

  const negative = createState();
  negative.karma = { good_karma: 0, evil_karma: 100, history: [] };
  cases.push(negative);

  for (const before of cases) {
    const input = withRoadLifecycle(before);
    const routeBefore = JSON.stringify({ inputRouteStates: input.routeStates, inputRouteHistory: input.routeHistory, inputRoadCommitments: input.roadCommitments });
    const after = await executor.executeEffects([{ type: 'special', target: 'end_game' }], input);
    assert.deepEqual(
      { routeStates: after.routeStates, routeHistory: after.routeHistory, roadCommitments: after.roadCommitments },
      { routeStates: input.routeStates, routeHistory: input.routeHistory, roadCommitments: input.roadCommitments },
    );
    assert.equal(JSON.stringify({ inputRouteStates: after.routeStates, inputRouteHistory: after.routeHistory, inputRoadCommitments: after.roadCommitments }), routeBefore);
    assert.equal(after.player.alive, false);
    assert.equal(after.flags.gameEnded, true);
    assert.equal(after.flags.ending_triggered, true);
    assert.equal(after.ending?.id !== undefined, true);
  }

  const source = fs.readFileSync(path.resolve('src/core/EventExecutor.ts'), 'utf8');
  const endGameSource = source.slice(source.indexOf("if (target === 'end_game')"), source.indexOf('// 其他特殊效果可以在这里添加'));
  for (const forbidden of ['completeRoad', 'completedRoadId', 'requirements.road', 'road_ending_completed']) {
    assert.equal(endGameSource.includes(forbidden), false, `end_game still contains ${forbidden}`);
  }
}

testRequirementsHaveNoRoad();
testEndingQualificationIgnoresRoadLifecycle();
testExplicitPositivePrerequisites();
await testEndGameDoesNotCompleteRoad();
console.log('canonicalEndingRoadLifecycleRemoval.test.ts passed');
