import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import type { GameState, PlayerLifeStates } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const CONTEXT_DEPENDENT_IDS = [
  'merchant_year_trade',
  'merchant_year_crisis',
  'merchant_year_network',
  'jianghu_year_training',
  'jianghu_year_patrol',
  'jianghu_year_disciple',
  'scholar_year_social',
  'scholar_year_write',
] as const;

const UNIVERSAL_IDS = [
  'commoner_year_farming',
  'commoner_year_apprentice',
  'commoner_year_neighbor',
  'scholar_year_study',
] as const;

const EVENT_AGE: Record<string, number> = {
  commoner_year_farming: 18,
  commoner_year_apprentice: 18,
  commoner_year_neighbor: 20,
  scholar_year_study: 18,
  merchant_year_trade: 20,
  merchant_year_crisis: 25,
  merchant_year_network: 22,
  jianghu_year_training: 18,
  jianghu_year_patrol: 20,
  jianghu_year_disciple: 30,
  scholar_year_social: 20,
  scholar_year_write: 25,
};

type Scenario = {
  age: number;
  habits?: Partial<PlayerLifeStates>;
  flags?: Record<string, boolean>;
  knowledge?: number;
};

function createBaselineState(scenario: Scenario): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Identity-Year Context Eligibility', 'male');
  const state = engine.getGameState();

  state.player.traits = [];
  state.player.age = scenario.age;
  state.player.constitution = 80;
  state.player.businessAcumen = 80;
  state.player.connections = 80;
  state.player.merchantNetwork = 80;
  state.player.influence = 80;
  state.player.martialPower = 80;
  state.player.chivalry = 80;
  state.player.reputation = 80;
  state.player.charisma = 80;
  state.player.knowledge = scenario.knowledge ?? 80;
  state.player.lifeStates = createDefaultPlayerLifeStates({
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
    ...scenario.habits,
  });

  const flags = { ...(scenario.flags ?? {}) };
  state.flags = flags;
  state.player.flags = { ...flags };

  return { engine, state };
}

function isAvailable(eventId: string, scenario: Omit<Scenario, 'age'> = {}): boolean {
  const age = EVENT_AGE[eventId];
  assert.ok(age !== undefined, `missing test age for ${eventId}`);
  const { engine } = createBaselineState({ age, ...scenario });
  return engine.getAvailableEvents(age).some(event => event.id === eventId);
}

function main(): void {
  // Baseline: no domain history → all 8 context-dependent events unavailable.
  // scholar_year_write: knowledge threshold satisfied, studyHabit still below gate.
  for (const eventId of CONTEXT_DEPENDENT_IDS) {
    assert.equal(
      isAvailable(eventId, { knowledge: 80 }),
      false,
      `${eventId} must be ineligible without domain context`,
    );
  }

  // Universal / on-ramp events remain open at legal ages with no domain history.
  for (const eventId of UNIVERSAL_IDS) {
    assert.equal(
      isAvailable(eventId),
      true,
      `${eventId} must remain eligible without identity gates`,
    );
  }

  // Merchant
  assert.equal(
    isAvailable('merchant_year_trade', { habits: { businessHabit: 1 } }),
    true,
    'merchant_year_trade: businessHabit=1 unlocks',
  );
  assert.equal(
    isAvailable('merchant_year_trade', { flags: { route_merchant: true } }),
    true,
    'merchant_year_trade: route_merchant unlocks with businessHabit=0',
  );

  assert.equal(
    isAvailable('merchant_year_crisis', { flags: { route_merchant: true } }),
    true,
    'merchant_year_crisis: route_merchant unlocks',
  );
  assert.equal(
    isAvailable('merchant_year_crisis', { habits: { businessHabit: 1 } }),
    false,
    'merchant_year_crisis: businessHabit alone must not unlock',
  );

  assert.equal(
    isAvailable('merchant_year_network', { flags: { route_merchant: true } }),
    true,
    'merchant_year_network: route_merchant unlocks',
  );
  assert.equal(
    isAvailable('merchant_year_network', { habits: { businessHabit: 1 } }),
    false,
    'merchant_year_network: businessHabit alone must not unlock',
  );

  // Jianghu
  assert.equal(
    isAvailable('jianghu_year_training', { habits: { trainingHabit: 1 } }),
    true,
    'jianghu_year_training: trainingHabit=1 unlocks',
  );

  assert.equal(
    isAvailable('jianghu_year_patrol', { flags: { hero_first_case: true } }),
    true,
    'jianghu_year_patrol: hero_first_case unlocks',
  );
  assert.equal(
    isAvailable('jianghu_year_patrol', { flags: { route_wanderer: true } }),
    true,
    'jianghu_year_patrol: route_wanderer unlocks',
  );
  assert.equal(
    isAvailable('jianghu_year_patrol', { flags: { jianghuTraveler: true } }),
    true,
    'jianghu_year_patrol: jianghuTraveler unlocks',
  );
  assert.equal(
    isAvailable('jianghu_year_patrol', { habits: { trainingHabit: 1 } }),
    false,
    'jianghu_year_patrol: trainingHabit alone must not unlock',
  );

  assert.equal(
    isAvailable('jianghu_year_disciple', { flags: { p27_mentor_obligation_taken: true } }),
    true,
    'jianghu_year_disciple: p27_mentor_obligation_taken unlocks',
  );
  assert.equal(
    isAvailable('jianghu_year_disciple', { flags: { has_disciples: true } }),
    true,
    'jianghu_year_disciple: has_disciples unlocks',
  );
  assert.equal(
    isAvailable('jianghu_year_disciple', { flags: { hero_teacher: true } }),
    true,
    'jianghu_year_disciple: hero_teacher unlocks',
  );
  assert.equal(
    isAvailable('jianghu_year_disciple', { flags: { ally_network: true } }),
    false,
    'jianghu_year_disciple: ally_network must not unlock disciple context',
  );

  // Scholar
  assert.equal(
    isAvailable('scholar_year_social', { habits: { studyHabit: 1 } }),
    true,
    'scholar_year_social: studyHabit=1 unlocks',
  );

  assert.equal(
    isAvailable('scholar_year_write', { knowledge: 30, habits: { studyHabit: 2 } }),
    true,
    'scholar_year_write: knowledge>=30 AND studyHabit>=2 unlocks',
  );
  assert.equal(
    isAvailable('scholar_year_write', { knowledge: 30, habits: { studyHabit: 1 } }),
    false,
    'scholar_year_write: knowledge alone must not unlock',
  );
  assert.equal(
    isAvailable('scholar_year_write', { knowledge: 29, habits: { studyHabit: 2 } }),
    false,
    'scholar_year_write: studyHabit alone must not unlock (threshold retained)',
  );

  console.log('identityYearContextEligibility.test.ts: ok');
}

main();
