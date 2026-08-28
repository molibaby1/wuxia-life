import assert from 'node:assert/strict';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import { mapSessionProgression } from '../server/src/services/sessionProgressionMapper';
import type { LifeMemorySummary } from '../src/types/lifeMemory';
import type { WealthCapacity } from '../src/types/wealthCapacity';

type PlayerSummaryWithCapacity = PlayerSummaryDto & {
  wealthCapacity: WealthCapacity;
};

function createPlayerSummary(overrides: Partial<PlayerSummaryWithCapacity> = {}): PlayerSummaryWithCapacity {
  return {
    name: '沈孤舟',
    age: 19,
    martialPower: 42,
    chivalry: 13,
    constitution: 18,
    money: 200,
    reputation: 10,
    connections: 11,
    knowledge: 24,
    businessAcumen: 0,
    influence: 0,
    charisma: 0,
    affiliation: 'wudang',
    title: null,
    alive: true,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    currentYear: 19,
    currentMonth: 6,
    currentDay: 1,
    wealthCapacity: 'comfortable_means',
    ownedAssets: [],
    ...overrides,
  };
}

function createLifeMemory(overrides: Partial<LifeMemorySummary> = {}): LifeMemorySummary {
  return {
    schemaVersion: '3.1.0',
    derivedAtAge: 19,
    ...overrides,
  };
}

function assertCase(name: string, fn: () => void, failures: string[]): void {
  try {
    fn();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const failures: string[] = [];

assertCase('main screen shows canonical wealth capacity first', () => {
  const player = createPlayerSummary();
  const model = buildMainScreenModel(player, createLifeMemory());

  assert.equal(model.topResources[0]?.key, 'wealthCapacity');
  assert.equal(model.topResources[0]?.label, '财力');
  assert.equal(model.topResources[0]?.value, '家资殷实');
  assert.equal(model.topResources.length, 1);
  assert(!model.topResources.some((item) => item.key === 'money' || item.label === '银两'));
}, failures);

assertCase('api mapper carries canonical wealth capacity', () => {
  const player = createPlayerSummary();
  const session = {
    getSessionPhase: () => 'active_planning',
    getPlanningOptions: () => [],
    getProgressionVolatileState: () => ({
      pendingActionSummary: null,
      pendingDisturbanceNarrative: null,
      pendingPeriodSummary: null,
      passiveNarrative: null,
      annualPassiveMemory: null,
      pendingStoryEventId: null,
      pendingEphemeralStoryEvent: null,
    }),
    getRuntimeState: () => ({
      player,
      facts: {},
      currentTime: { year: 19, month: 6, day: 1 },
    }),
  };

  const payload = mapSessionProgression(session as never, 7, 'snapshot-7', null, createLifeMemory());

  assert.equal(payload.player.wealthCapacity, 'comfortable_means');
  assert.equal(payload.player.money, 200);
}, failures);

if (failures.length > 0) {
  throw new Error(failures.join('\n'));
}

console.log('wealthCapacityPresentation.test.ts: ok');
