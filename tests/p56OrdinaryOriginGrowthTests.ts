import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectOrdinaryOrigin,
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
  isPlayerVisibleOrdinaryOriginText,
} from '../src/p56/ordinaryOriginExpression';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeState(age: number, flags: Record<string, unknown>): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 30,
      chivalry: 10,
      constitution: 50,
      affiliation: null,
      title: null,
      reputation: 10,
      knowledge: 15,
      charisma: 10,
      businessAcumen: 10,
      influence: 8,
      connections: 5,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      alive: true,
      flags: {},
      lifeStates: createDefaultPlayerLifeStates(),
    },
    flags,
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;
}

function testPeasantOriginDetection(): void {
  const state = makeState(25, { origin_farm_peasant: true });
  const origin = detectOrdinaryOrigin(state.flags ?? {});
  assert(origin === 'farm_peasant', `expected farm_peasant, got ${origin}`);

  const noOrigin = makeState(25, {});
  assert(detectOrdinaryOrigin(noOrigin.flags ?? {}) === null, 'no origin should return null');
}

function testApprenticeOriginDetection(): void {
  const state = makeState(25, { origin_town_apprentice: true });
  const origin = detectOrdinaryOrigin(state.flags ?? {});
  assert(origin === 'town_apprentice', `expected town_apprentice, got ${origin}`);
}

function testTavernOriginDetection(): void {
  const state = makeState(25, { origin_tavern_hand: true });
  const origin = detectOrdinaryOrigin(state.flags ?? {});
  assert(origin === 'tavern_hand', `expected tavern_hand, got ${origin}`);
}

function testPeasantCurrentGoal(): void {
  const early = makeState(15, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(early) ?? '';
  assert(goal.includes('田') || goal.includes('耕'), `peasant early goal: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in peasant goal: ${goal}`);

  const midlife = makeState(28, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
    peasant_midlife_steadfast_accrual: true,
  });
  const midlifeGoal = deriveOrdinaryOriginCurrentGoal(midlife) ?? '';
  assert(midlifeGoal.includes('根基') || midlifeGoal.includes('田地'), `peasant midlife goal: ${midlifeGoal}`);
  assert(isPlayerVisibleOrdinaryOriginText(midlifeGoal), `raw key in peasant midlife goal: ${midlifeGoal}`);
}

function testApprenticeCurrentGoal(): void {
  const early = makeState(15, {
    origin_town_apprentice: true,
    apprentice_craft_committed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(early) ?? '';
  assert(goal.includes('木工') || goal.includes('手艺'), `apprentice early goal: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in apprentice goal: ${goal}`);

  const midlife = makeState(26, {
    origin_town_apprentice: true,
    apprentice_craft_committed: true,
    apprentice_midlife_craft_mastery: true,
  });
  const midlifeGoal = deriveOrdinaryOriginCurrentGoal(midlife) ?? '';
  assert(midlifeGoal.includes('出师') || midlifeGoal.includes('手艺'), `apprentice midlife goal: ${midlifeGoal}`);
  assert(isPlayerVisibleOrdinaryOriginText(midlifeGoal), `raw key in apprentice midlife goal: ${midlifeGoal}`);
}

function testTavernCurrentGoal(): void {
  const early = makeState(15, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(early) ?? '';
  assert(goal.includes('客人') || goal.includes('人脉'), `tavern early goal: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in tavern goal: ${goal}`);

  const midlife = makeState(25, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
    tavern_midlife_guest_regulars: true,
  });
  const midlifeGoal = deriveOrdinaryOriginCurrentGoal(midlife) ?? '';
  assert(midlifeGoal.includes('认得') || midlifeGoal.includes('人脉'), `tavern midlife goal: ${midlifeGoal}`);
  assert(isPlayerVisibleOrdinaryOriginText(midlifeGoal), `raw key in tavern midlife goal: ${midlifeGoal}`);
}

function testPeasantLifeMemory(): void {
  const state = makeState(28, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
    peasant_midlife_steadfast_accrual: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(state.flags ?? {});
  assert(Boolean(memory?.includes('耕种') || memory?.includes('田地')), `peasant life-memory: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in peasant life-memory: ${memory}`);
}

function testApprenticeLifeMemory(): void {
  const state = makeState(26, {
    origin_town_apprentice: true,
    apprentice_craft_committed: true,
    apprentice_midlife_craft_mastery: true,
    apprentice_open_shop: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(state.flags ?? {});
  assert(Boolean(memory?.includes('铺子') || memory?.includes('手艺')), `apprentice life-memory: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in apprentice life-memory: ${memory}`);
}

function testTavernLifeMemory(): void {
  const state = makeState(25, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
    tavern_midlife_guest_regulars: true,
    tavern_embrace_network: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(state.flags ?? {});
  assert(Boolean(memory?.includes('人脉') || memory?.includes('朋友')), `tavern life-memory: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in tavern life-memory: ${memory}`);
}

function testOrdinaryOriginSummary(): void {
  const peasant = makeState(28, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
    peasant_midlife_steadfast_accrual: true,
  });
  const peasantSummary = deriveOrdinaryOriginSummary(peasant.flags ?? {});
  assert(Boolean(peasantSummary?.includes('农人')), `peasant summary: ${peasantSummary}`);

  const apprentice = makeState(26, {
    origin_town_apprentice: true,
    apprentice_craft_committed: true,
    apprentice_midlife_craft_mastery: true,
  });
  const apprenticeSummary = deriveOrdinaryOriginSummary(apprentice.flags ?? {});
  assert(Boolean(apprenticeSummary?.includes('学徒')), `apprentice summary: ${apprenticeSummary}`);

  const tavern = makeState(25, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
    tavern_midlife_guest_regulars: true,
  });
  const tavernSummary = deriveOrdinaryOriginSummary(tavern.flags ?? {});
  assert(Boolean(tavernSummary?.includes('酒肆')), `tavern summary: ${tavernSummary}`);
}

function testLifeMemorySummaryIncludesOrdinaryOrigin(): void {
  const state = makeState(28, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
    peasant_midlife_steadfast_accrual: true,
  });
  const summary = deriveLifeMemorySummary(state);
  assert(Boolean(summary.ordinaryOriginLifeMemory), 'ordinaryOriginLifeMemory missing from summary');
  assert(Boolean(summary.ordinaryOriginSummary), 'ordinaryOriginSummary missing from summary');
  assert(
    summary.ordinaryOriginLifeMemory?.includes('耕种') || summary.ordinaryOriginLifeMemory?.includes('田地'),
    `summary life-memory content: ${summary.ordinaryOriginLifeMemory}`,
  );
}

function main(): void {
  testPeasantOriginDetection();
  testApprenticeOriginDetection();
  testTavernOriginDetection();
  testPeasantCurrentGoal();
  testApprenticeCurrentGoal();
  testTavernCurrentGoal();
  testPeasantLifeMemory();
  testApprenticeLifeMemory();
  testTavernLifeMemory();
  testOrdinaryOriginSummary();
  testLifeMemorySummaryIncludesOrdinaryOrigin();
  console.log('p56OrdinaryOriginGrowthTests: all passed');
}

main();
