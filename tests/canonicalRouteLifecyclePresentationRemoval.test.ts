import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { GameState } from '../src/types/eventTypes';

function initialState(): GameState {
  return new GameEngineIntegration().getGameState();
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function testLifeMemoryIgnoresRouteLifecycle(): void {
  const stateA = initialState();
  stateA.flags.orthodox_childhood_seed_done = true;
  const stateB = cloneState(stateA);
  stateB.routeStates = {
    sect: { routeId: 'sect', lifecycle: 'completed', category: 'main', lockedIn: true },
    demonic: { routeId: 'demonic', lifecycle: 'locked_in', category: 'main', lockedIn: true },
  } as any;
  stateB.routeHistory = [{ routeId: 'sect', from: 'active', to: 'completed', age: 40 }] as any;
  stateB.roadCommitments = {
    statecraft: { roadId: 'statecraft', lifecycle: 'locked_in', proofCount: 4, position: 'primary' },
  } as any;

  const summaryA = deriveLifeMemorySummary(stateA);
  const summaryB = deriveLifeMemorySummary(stateB);
  assert.deepEqual(summaryB, summaryA);
  assert.equal(summaryA.schemaVersion, '2.0.0');
  assert.equal('routeStatus' in summaryA, false);
  assert.equal('roadCommitments' in summaryA, false);
  assert.equal(summaryA.currentGoalLabel, '门派倾向已显，尚未立誓入门');
}

function testRouteLifecycleDoesNotCreateAchievementOrDebt(): void {
  const state = initialState();
  state.routeStates = {
    martial: { routeId: 'martial', lifecycle: 'completed', category: 'main', lockedIn: true },
    wanderer: { routeId: 'wanderer', lifecycle: 'active', category: 'main', lockedIn: false },
  } as any;
  const summary = deriveLifeMemorySummary(state);
  assert.equal(Boolean(summary.achievements?.some(entry => entry.label.includes('之路已竟'))), false);
  assert.equal(Boolean(summary.unresolvedDebts?.some(entry => entry.label.includes('收束'))), false);

  state.flags.route_wanderer = true;
  state.player.age = 45;
  state.flags.hero_first_case = true;
  state.flags.hero_midlife_beat_returns = true;
  state.flags.hero_midlife_beat_backlash = true;
  state.flags.hero_midlife_beat_ally = true;
  const withExplicitFacts = deriveLifeMemorySummary(state);
  assert.equal(
    withExplicitFacts.unresolvedDebts?.some(entry => entry.id === 'debt-wanderer-settlement'),
    true,
  );
}

function testMainScreenModelIgnoresRouteLifecycle(): void {
  const stateA = initialState();
  const stateB = cloneState(stateA);
  stateB.routeStates = {
    official: { routeId: 'official', lifecycle: 'active', category: 'main', lockedIn: false },
  } as any;
  stateB.roadCommitments = {
    official: { roadId: 'official', lifecycle: 'completed', proofCount: 9, position: 'primary' },
  } as any;
  const modelA = buildMainScreenModel(stateA.player, deriveLifeMemorySummary(stateA));
  const modelB = buildMainScreenModel(stateB.player, deriveLifeMemorySummary(stateB));
  assert.deepEqual(modelB, modelA);
  assert.equal(modelA.currentGoalSummary, '暂无明确目标');
  assert.equal('routeSummary' in modelA, false);
  assert.equal('roadCommitmentSummary' in modelA, false);
}

function testTendencyIgnoresRouteLifecycle(): void {
  const stateA = initialState();
  Object.assign(stateA.player, { martialPower: 12, comprehension: 30, knowledge: 20 });
  const stateB = cloneState(stateA);
  stateB.routeStates = {
    official: { routeId: 'official', lifecycle: 'active', category: 'main', lockedIn: false },
  } as any;
  const tendencyA = buildMainScreenModel(stateA.player, deriveLifeMemorySummary(stateA)).tendencySummary;
  const tendencyB = buildMainScreenModel(stateB.player, deriveLifeMemorySummary(stateB)).tendencySummary;
  assert.equal(tendencyB, tendencyA);
}

function testEndingAndPresentationGuards(): void {
  const files = [
    'src/core/deriveLifeMemorySummary.ts',
    'src/types/lifeMemory.ts',
    'src/components/LifeMemoryPanel.vue',
    'src/components/MainScreenLifeSummary.vue',
    'src/components/mainScreenModel.ts',
    'src/components/EndingScreen.vue',
  ];
  const source = files
    .map(file => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8'))
    .join('\n');
  for (const forbidden of [
    'routeStatus',
    'roadCommitments',
    'routeStates',
    'routeHistory',
    'RouteCompatibilityRules',
    'RouteStateManager',
    'locked_in',
    'proofCount',
    'routeSummary',
    'roadCommitmentSummary',
    'canonicalRoad',
    'roadStageLabel',
    '道路阶段',
  ]) {
    assert.equal(source.includes(forbidden), false, `route lifecycle presentation token remains: ${forbidden}`);
  }
  assert.equal(source.includes('identity.primary'), true);
}

testLifeMemoryIgnoresRouteLifecycle();
testRouteLifecycleDoesNotCreateAchievementOrDebt();
testMainScreenModelIgnoresRouteLifecycle();
testTendencyIgnoresRouteLifecycle();
testEndingAndPresentationGuards();
console.log('canonicalRouteLifecyclePresentationRemoval.test.ts passed');
