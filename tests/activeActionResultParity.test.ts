import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mapSessionProgression } from '../server/src/services/sessionProgressionMapper';
import { buildActiveActionSummaryDisplay } from '../src/core/activePlanning/activeActionSummaryBuilder';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { ActiveActionSummaryDisplay } from '../src/types/activeActionTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeSummary(): ActiveActionSummaryDisplay {
  return buildActiveActionSummaryDisplay(
    {
      actionId: 'action_business_basic',
      deltas: { money: -5 },
      duration: { value: 1, unit: 'quarter' },
      metadata: {
        actionId: 'action_business_basic',
        category: 'business',
        duration: { value: 1, unit: 'quarter' },
        risk: 'medium',
        sourceKind: 'active_action',
        rewardSummary: '银两-5',
        costSummary: '银两-25',
        riskSummary: '偶有变数',
      },
    },
    { publicDelta: { money: -5 }, currentMoney: 0 },
  );
}

function testApiMapperPreservesSharedSemantics(): void {
  const summary = makeSummary();
  const fakeSession = {
    getSessionPhase: () => 'action_summary',
    getNextEvent: async () => null,
    getPlanningOptions: () => [],
    getProgressionVolatileState: () => ({
      pendingActionSummary: summary,
      pendingDisturbanceNarrative: null,
      pendingPeriodSummary: null,
      passiveNarrative: null,
      annualPassiveMemory: null,
      pendingStoryEventId: null,
      pendingEphemeralStoryEvent: null,
    }),
    getRuntimeState: () => ({ player: { name: 'parity', age: 45, alive: true } }),
  };
  const payload = mapSessionProgression(
    fakeSession as never,
    1,
    'snapshot-1',
    null,
    {} as never,
  );
  assert(payload.activeActionSummary === summary, 'API mapper must preserve the shared summary object');
  assert(payload.activeActionSummary?.resultExplanation === summary.resultExplanation, 'API must preserve result explanation');
  assert(payload.activeActionSummary?.resourcePressureNotice === summary.resourcePressureNotice, 'API must preserve resource notice');
}

async function testHeadlessConsumesSharedBuilder(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '结果 parity',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 30;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  snapshot.state.flags = {};
  snapshot.state.player.flags = {};
  const session = HeadlessEngineSessionImpl.create({ snapshot });
  assert(session.getSessionPhase() === 'active_planning', 'headless parity fixture must enter active planning');
  await session.executeActiveAction('action_training_basic');
  const summary = session.getProgressionVolatileState().pendingActionSummary;
  assert(Boolean(summary?.resultExplanation?.includes('练功')), 'Headless must expose category result explanation');
  assert(Boolean(summary?.appliedDeltaSummary?.includes('功力')), 'Headless must expose actual public delta');
}

function testBrowserConsumerRendersSharedFields(): void {
  const source = readFileSync(resolve(process.cwd(), 'src/components/GameScreen.vue'), 'utf8');
  assert(source.includes('activeActionSummaryDisplay.resultExplanation'), 'Browser must render shared result explanation');
  assert(source.includes('activeActionSummaryDisplay.diminishingReturnNotice'), 'Browser must render diminishing notice');
  assert(source.includes('activeActionSummaryDisplay.resourcePressureNotice'), 'Browser must render resource pressure notice');
}

function testLocalEngineConsumesSharedBuilder(): void {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 30;
  state.player.events = [];
  state.events = [];
  state.eventHistory = [];
  state.flags = {};
  state.player.flags = {};
  const result = engine.executeActiveAction('action_training_basic', { random: () => 0.5 });
  assert(Boolean(result?.activeActionSummary.resultExplanation?.includes('练功')), 'Local engine must expose shared result explanation');
  assert(Boolean(result?.activeActionSummary.appliedDeltaSummary?.includes('功力')), 'Local engine must expose actual public delta');
}

async function main(): Promise<void> {
  testApiMapperPreservesSharedSemantics();
  testLocalEngineConsumesSharedBuilder();
  await testHeadlessConsumesSharedBuilder();
  testBrowserConsumerRendersSharedFields();
  console.log('activeActionResultParity.test.ts: Local/API/Headless/Browser parity ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
