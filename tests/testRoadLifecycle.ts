import { RouteStateManager } from '../src/core/RouteStateManager';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function createState(): GameState {
  const player: PlayerState = {
    name: '路线测试', gender: 'male', age: 24, martialPower: 10,
    externalSkill: 0, internalSkill: 0, qinggong: 0, chivalry: 0,
    charisma: 0, constitution: 10, comprehension: 10, money: 20,
    reputation: 0, connections: 0, health: 100, energy: 100, alive: true,
    items: [], flags: {}, events: [], relationships: [],
  };
  return { player, flags: {}, relations: {}, eventHistory: [] };
}

let state = createState();
state = RouteStateManager.recordRoadActivity(state, 'statecraft', 'ordinary_trade');
if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'temporary') {
  throw new Error('普通行为只能产生 temporary');
}
state.player.reputation = 100;
if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'temporary') {
  throw new Error('reputation 变化不应推进道路阶段');
}

state = RouteStateManager.commitRoad(state, 'statecraft', {
  choiceId: 'merchant_entry_choice',
  eventId: 'merchant_entry',
});
if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'active') {
  throw new Error('关键选择应产生 active 承诺');
}
state = RouteStateManager.recordRoadProof(state, 'statecraft', 'merchant_proof');
const commitment = state.roadCommitments?.statecraft;
if (commitment?.lifecycle !== 'locked_in' || commitment.proofCount !== 1) {
  throw new Error('道路承诺必须经过成果证明才能 locked_in');
}

let legacy = createState();
legacy.routeStates = {
  merchant: {
    routeId: 'merchant', lifecycle: 'active', category: 'main', lockedIn: false,
    sourceEventId: 'legacy_merchant_entry', lastChangedAtAge: 30,
  },
};
if (legacy.roadCommitments) {
  throw new Error('迁移前不应自动创建规范承诺');
}
legacy = RouteStateManager.migrateLegacyRoutes(legacy);
if (legacy.roadCommitments?.statecraft?.lifecycle !== 'active') {
  throw new Error('旧路线只能在显式迁移边界转换为经世');
}
if (legacy.roadCommitments?.statecraft?.sourceEventId !== 'legacy_merchant_entry') {
  throw new Error('迁移应保留旧路线来源证据');
}

const expectedLegacyRoads: Record<string, string> = {
  merchant: 'statecraft',
  official: 'official',
  hermit: 'hermit',
};
for (const legacyRouteId of ['merchant', 'official', 'hermit', 'sect', 'hero', 'demonic', 'wanderer']) {
  const fixture = createState();
  fixture.routeStates = {
    [legacyRouteId]: {
      routeId: legacyRouteId,
      lifecycle: 'active',
      category: 'main',
      lockedIn: false,
      sourceEventId: `legacy_${legacyRouteId}`,
    },
  };
  const migrated = RouteStateManager.migrateLegacyRoutes(fixture);
  const expectedRoadId = expectedLegacyRoads[legacyRouteId];
  if (expectedRoadId) {
    if (migrated.roadCommitments?.[expectedRoadId as keyof typeof migrated.roadCommitments]?.lifecycle !== 'active') {
      throw new Error(`${legacyRouteId} should migrate to ${expectedRoadId}`);
    }
  } else if (migrated.roadCommitments && Object.keys(migrated.roadCommitments).length > 0) {
    throw new Error(`${legacyRouteId} must remain historical and not become a canonical road`);
  }
}

const loadEngine = new GameEngineIntegration();
loadEngine.loadGameState(legacy);
if (loadEngine.getGameState().roadCommitments?.statecraft?.lifecycle !== 'active') {
  throw new Error('loadGameState must be the legacy migration boundary');
}

console.log('US-002 route lifecycle tests passed');
