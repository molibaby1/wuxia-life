import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDefaultPlayerLifeStates, lifeStates } from '../src/data/life/lifeStates';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { DailyEventSystem } from '../src/core/DailyEventSystem';
import { EndingSystem } from '../src/core/EndingSystem';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { EffectType } from '../src/types/eventTypes';
import { traitSystem } from '../src/core/TraitSystem';
import type { DailyEventConfig, GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runCanonicalFatigueAnxietyStatusMigrationTests(): Promise<void> {
  const defaults = createDefaultPlayerLifeStates() as unknown as Record<string, unknown>;
  assert(!('fatigue' in defaults), 'numeric lifeStates.fatigue must not exist');
  assert(!('anxiety' in defaults), 'numeric lifeStates.anxiety must not exist');
  assert(!lifeStates.some(item => item.key === ('fatigue' as never)), 'fatigue config must not exist');
  assert(!lifeStates.some(item => item.key === ('anxiety' as never)), 'anxiety config must not exist');

  const traitPlayer = traitSystem.applyTraits(
    { traits: [] } as PlayerState,
    ['perfect_memory', 'frail', 'unstable_mood'],
  );
  assert(!traitPlayer.statuses?.includes('fatigued'), 'frail must not initialize fatigued');
  assert(!traitPlayer.statuses?.includes('anxious'), 'traits must not initialize anxious');

  const traitSources = [
    'src/data/traits/coreTalents.ts',
    'src/data/traits/weaknesses.ts',
    'src/data/traits/temperaments.ts',
  ].map(file => readFileSync(resolve(file), 'utf8')).join('\n');
  assert(!/stateBiases|startingStates/.test(traitSources), 'Trait configs must not write lifeStates');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Canonical Status Migration', 'male');
  const executor = new EventExecutor();
  const dailySystem = new DailyEventSystem();

  const statusConfig: DailyEventConfig = {
    id: 'test_anxiety_status_contract',
    group: 'emotion',
    title: 'test',
    ageRange: { min: 0, max: 100 },
    baseWeight: 1,
    conditions: [{ type: 'status_has', status: 'anxious' }],
    variants: {
      positive: [{
        id: 'test_anxiety_status_contract_pos',
        weight: 1,
        text: 'test',
        effects: [{ type: EffectType.STATUS_ADD, status: 'anxious' }],
      }],
      neutral: [{ id: 'test_anxiety_status_contract_neutral', weight: 1, text: 'test' }],
      negative: [{ id: 'test_anxiety_status_contract_neg', weight: 1, text: 'test' }],
    },
  };

  const absentState = engine.getGameState();
  assert(dailySystem.selectEvent(absentState, [statusConfig]) === null, 'status_has must block absent status');

  const presentState = cloneState(absentState);
  presentState.player.statuses = ['anxious'];
  const selected = withDeterministicRandom(() => dailySystem.selectEvent(presentState, [statusConfig]));
  assert(selected !== null, 'status_has must allow present status');
  assert(
    selected?.autoEffects?.some(effect => effect.type === EffectType.STATUS_ADD && effect.status === 'anxious'),
    'DailyEvent variant effects must become canonical autoEffects',
  );

  const added = await executor.executeEffects(
    selected!.autoEffects!.filter(effect => effect.type !== EffectType.TIME_ADVANCE),
    presentState,
  );
  assert(added.player.statuses.length === 1 && added.player.statuses[0] === 'anxious', 'status_add must be idempotent');

  const removeState = cloneState(presentState);
  const removed = await executor.executeEffects([
    { type: EffectType.STATUS_REMOVE, status: 'anxious' },
  ], removeState);
  assert(removed.player.statuses.length === 0, 'status_remove must remove canonical status');
  const noOp = await executor.executeEffects([
    { type: EffectType.STATUS_REMOVE, status: 'anxious' },
  ], cloneState(absentState));
  assert(noOp.player.statuses.length === 0, 'status_remove absent status must be a no-op');

  const fatigueRecovery = findDailyEvent('daily_fatigue_recovery');
  const anxietyRecovery = findDailyEvent('daily_anxiety_recovery');
  assertRecoveryEvent(fatigueRecovery, 'fatigued');
  assertRecoveryEvent(anxietyRecovery, 'anxious');
  assert(
    withDeterministicRandom(() => dailySystem.selectEvent(absentState, [fatigueRecovery])) === null,
    'fatigue recovery must require fatigued',
  );
  assert(
    withDeterministicRandom(() => dailySystem.selectEvent(presentState, [anxietyRecovery])) !== null,
    'anxiety recovery must be selectable when anxious exists',
  );

  assertDailyStatusEffects();
  assertFormalStatusEffects();
  await assertDailyStatusSettlement();
  await assertFormalChoiceSettlement();
  await assertFamilyCrisisEmptyChoiceHistory();
  assertEndingInvariance(absentState);
  assertLifeMemoryInvariance(absentState);
  await assertFormalOutcomeInvariance(absentState);
  assertDailyWeightInvariance(absentState);
  assertNoNumericFatigueAnxietyReferences();
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function withDeterministicRandom<T>(run: () => T, value = 0): T {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return run();
  } finally {
    Math.random = originalRandom;
  }
}

function findDailyEvent(id: string): DailyEventConfig {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function assertRecoveryEvent(config: DailyEventConfig, status: 'fatigued' | 'anxious'): void {
  assert(
    config.conditions?.some(condition => condition.type === 'status_has' && condition.status === status) === true,
    `${config.id} must require ${status}`,
  );
  for (const variant of Object.values(config.variants).flat()) {
    assert(
      variant.effects?.length === 1 &&
        variant.effects[0].type === EffectType.STATUS_REMOVE &&
        variant.effects[0].status === status,
      `${variant.id} must always remove ${status}`,
    );
    assert(!variant.statEffects && !variant.stateEffects, `${variant.id} must not change numeric state`);
  }
}

function assertDailyStatusEffects(): void {
  const retainedAdds: Record<string, 'anxious'> = {
    daily_tight_budget_neg_1: 'anxious',
    daily_home_letter_neg_1: 'anxious',
    daily_shared_meal_neg_1: 'anxious',
    daily_household_burden_neg_1: 'anxious',
  };
  const removedAdds = [
    'daily_morning_training_neg_1',
    'daily_skip_training_neg_1',
    'daily_training_bottleneck_neg_1',
    'daily_copybook_practice_neg_1',
    'daily_reading_notes_neg_1',
    'daily_take_odd_job_neg_1',
    'daily_small_trade_neg_1',
    'daily_night_reflection_neg_1',
    'daily_second_guess_neg_1',
    'daily_get_back_spirit_neg_1',
  ];
  for (const [variantId, status] of Object.entries(retainedAdds)) {
    const variant = Object.values(dailyEvents)
      .flatMap(config => Object.values(config.variants).flat())
      .find(item => item.id === variantId);
    assert(
      variant?.effects?.length === 1 &&
        variant.effects[0].type === EffectType.STATUS_ADD &&
        variant.effects[0].status === status,
      `${variantId} must add ${status}`,
    );
  }
  for (const variantId of removedAdds) {
    const variant = findDailyVariant(variantId);
    assert(variant !== undefined, `${variantId} must remain in the Daily catalog`);
    assert(
      !variant.effects?.some(effect => effect.type === EffectType.STATUS_ADD),
      `${variantId} must not add a persistent Status`,
    );
  }
  for (const variantId of ['daily_skip_training_pos_1', 'daily_shared_meal_pos_1']) {
    assert(
      findDailyVariant(variantId)?.effects?.some(effect => effect.type === EffectType.STATUS_REMOVE && effect.status === 'fatigued'),
      `${variantId} must remove fatigued`,
    );
  }
  for (const variantId of ['daily_tight_budget_pos_1', 'daily_night_reflection_pos_1', 'daily_get_back_spirit_pos_1']) {
    assert(
      findDailyVariant(variantId)?.effects?.some(effect => effect.type === EffectType.STATUS_REMOVE && effect.status === 'anxious'),
      `${variantId} must remove anxious`,
    );
  }
  assert(!findDailyVariant('daily_night_reflection_pos_1')?.effects?.some(effect => effect.status === 'fatigued'), 'night reflection must not recover fatigued');
}

function findDailyVariant(id: string) {
  return Object.values(dailyEvents)
    .flatMap(config => Object.values(config.variants).flat())
    .find(variant => variant.id === id);
}

function assertFormalStatusEffects(): void {
  const files = ['middle-age-career.json', 'family-life.json', 'p22-content-expansions.json', 'love.json'];
  const values = files.flatMap(file => JSON.parse(readFileSync(resolve('src/data/lines', file), 'utf8')) as unknown[]);
  const findById = (id: string): any => {
    const visit = (value: any): any => {
      if (!value || typeof value !== 'object') return undefined;
      if (value.id === id) return value;
      for (const child of Array.isArray(value) ? value : Object.values(value)) {
        const found = visit(child);
        if (found) return found;
      }
      return undefined;
    };
    for (const value of values) {
      const found = visit(value);
      if (found) return found;
    }
    throw new Error(`formal content not found: ${id}`);
  };
  const retained: Array<[string, 'fatigued' | 'anxious']> = [
    ['innovate_full', 'anxious'],
  ];
  for (const [id, status] of retained) {
    const target = findById(id);
    const effects = target.effects ?? [];
    assert(effects.some((effect: any) => effect.type === 'status_add' && effect.status === status), `${id} must add ${status}`);
  }
  for (const [id, status] of [
    ['innovate_full', 'fatigued'],
    ['career_martial_arts_conference_choice_1', 'fatigued'],
    ['carry_the_river_road', 'fatigued'],
    ['career_sect_expansion_choice_1', 'anxious'],
    ['family_crisis_full_support', 'anxious'],
    ['family_crisis_limited_support', 'anxious'],
  ] as const) {
    const target = findById(id);
    assert(
      !(target.effects ?? []).some((effect: any) => effect.type === 'status_add' && effect.status === status),
      `${id} must not add its adjudicated persistent Status`,
    );
  }
  for (const [id, status] of [
    ['innovate_suspend', 'anxious'],
    ['career_sect_expansion_choice_3', 'anxious'],
  ] as const) {
    const target = findById(id);
    assert((target.effects ?? []).some((effect: any) => effect.type === 'status_remove' && effect.status === status), `${id} must remove ${status}`);
  }
  const loveWithdrawal = findChoiceContaining(values, '暂时退让');
  assert((loveWithdrawal.effects ?? []).some((effect: any) => effect.type === 'status_remove' && effect.status === 'anxious'), 'love withdrawal must retain its anxiety recovery');

  const tournamentRandomEffect = findById('career_martial_arts_conference_choice_1').effects
    ?.find((effect: any) => effect.type === 'random');
  assert(
    tournamentRandomEffect?.success?.type === 'stat_modify' &&
      tournamentRandomEffect.success.target === 'reputation' &&
      tournamentRandomEffect.success.value === 50 &&
      tournamentRandomEffect.success.operator === 'add',
    'tournament choice must retain its original success reputation effect',
  );
  assert(
    tournamentRandomEffect?.failure?.type === 'stat_modify' &&
      tournamentRandomEffect.failure.target === 'reputation' &&
      tournamentRandomEffect.failure.value === -10 &&
      tournamentRandomEffect.failure.operator === 'add',
    'tournament choice must retain its original failure reputation effect',
  );
}

async function assertDailyStatusSettlement(): Promise<void> {
  for (const [variantId, status] of [
    ['daily_morning_training_neg_1', 'anxious'],
    ['daily_copybook_practice_neg_1', 'fatigued'],
  ] as const) {
    const config = Object.values(dailyEvents).find(event =>
      Object.values(event.variants).flat().some(variant => variant.id === variantId),
    );
    assert(config !== undefined, `Daily config must exist for ${variantId}`);
    const engine = new GameEngineIntegration();
    engine.startNewGame('Status 内容结算测试', 'male');
    engine.setPlayerAttributes({ age: config.ageRange.min, statuses: [] });
    const before = cloneState(engine.getGameState());
    const event = withDeterministicRandom(() => new DailyEventSystem().selectEvent(before, [config]), 0.999999);
    assert(event?.id === variantId, `${variantId} must be selected through DailyEventSystem`);
    const after = await new EventExecutor().executeEffects(event.autoEffects ?? [], before);
    assert(!after.player.statuses.includes(status), `${variantId} settlement must not add ${status}`);
  }
}

async function assertFormalChoiceSettlement(): Promise<void> {
  const cases = [
    { eventId: 'career_martial_innovation', choiceId: 'innovate_full', status: 'fatigued' },
    { eventId: 'career_martial_arts_conference', choiceId: 'career_martial_arts_conference_choice_1', status: 'fatigued' },
    { eventId: 'p42_training_business_river_delivery', choiceId: 'carry_the_river_road', status: 'fatigued' },
    { eventId: 'career_sect_expansion', choiceId: 'career_sect_expansion_choice_1', status: 'anxious' },
    { eventId: 'family_crisis', choiceId: 'family_crisis_full_support', status: 'anxious' },
    { eventId: 'family_crisis', choiceId: 'family_crisis_limited_support', status: 'anxious' },
  ] as const;
  const loader = EventLoader.getInstance();
  const executor = new EventExecutor();
  for (const item of cases) {
    const event = loader.getEventById(item.eventId);
    assert(event !== undefined, `EventLoader must load ${item.eventId}`);
    const choice = event.choices?.find(candidate => candidate.id === item.choiceId);
    assert(choice !== undefined, `EventLoader must load choice ${item.choiceId}`);
    const engine = new GameEngineIntegration();
    engine.startNewGame('Status 内容结算测试', 'male');
    engine.setPlayerAttributes({
      age: event.ageRange.min,
      martialPower: 10,
      connections: 10,
      reputation: 10,
      statuses: [],
      traits: [],
      lifeStates: { trainingHabit: 2, studyHabit: 0, businessHabit: 2 },
    });
    const before = cloneState(engine.getGameState());
    const after = await executor.executeEffects(choice.effects ?? [], before);
    assert(!after.player.statuses.includes(item.status), `${item.choiceId} settlement must not add ${item.status}`);

    if (item.choiceId === 'innovate_full') {
      assert(after.player.martialPower === before.player.martialPower + 10, 'innovate_full must retain martialPower +10');
      assert(after.player.statuses.includes('anxious'), 'innovate_full must retain its unresolved anxious producer');
    }
    if (item.choiceId === 'carry_the_river_road') {
      assert(after.player.martialPower === before.player.martialPower + 2, 'river delivery must retain martialPower +2');
      assert(after.player.connections === before.player.connections + 2, 'river delivery must retain connections +2');
    }
    if (item.choiceId === 'career_sect_expansion_choice_1') {
      assert(after.player.reputation === before.player.reputation + 30, 'sect expansion must retain reputation +30');
      assert(after.player.flags.career_sect_major_expansion === true, 'sect expansion must retain its expansion flag');
    }
    if (item.choiceId === 'family_crisis_full_support') {
      assert(after.player.reputation === before.player.reputation + 20, 'family crisis full support must retain reputation +20');
    }
  }
}

async function assertFamilyCrisisEmptyChoiceHistory(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '家族危机空效果历史测试',
    gender: 'male',
    catalogVersion: '1.0.0',
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 40;
  snapshot.state.player.wealthCapacity = 'modest_savings';
  snapshot.state.player.statuses = [];
  snapshot.state.pendingStoryEventId = 'family_crisis';
  snapshot.state.eventHistory = [];

  const session = HeadlessEngineSessionImpl.create({ snapshot });
  assert(session.getCurrentEvent()?.id === 'family_crisis', 'Headless must load family_crisis as pending');
  const response = await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: 'family_crisis', choiceId: 'family_crisis_limited_support' },
  });

  assert(response.status === 'success', 'family_crisis_limited_support must execute with empty effects');
  assert(
    response.nextSnapshot.state.player.statuses.length === 0,
    'family_crisis_limited_support must not add anxious after formal settlement',
  );
  assert(
    response.nextSnapshot.state.eventHistory.filter(record => record.eventId === 'family_crisis').length === 1,
    'family_crisis_limited_support must retain exactly one formal event-history record',
  );
  assert(
    response.append.eventHistory?.filter(record => record.eventId === 'family_crisis').length === 1,
    'family_crisis_limited_support response must append its formal event-history record',
  );
}

function assertEndingInvariance(control: GameState): void {
  const subject = cloneState(control);
  subject.player.statuses = ['fatigued', 'anxious'];

  const controlEnding = EndingSystem.determineEnding(control);
  const subjectEnding = EndingSystem.determineEnding(subject);
  assert(controlEnding.id === subjectEnding.id, 'fatigue/anxiety must not change Ending id');
  assert(controlEnding.category === subjectEnding.category, 'fatigue/anxiety must not change Ending category');

  const controlEligible = EndingSystem.getUnlockableEndings(control).map(ending => ending.id);
  const subjectEligible = EndingSystem.getUnlockableEndings(subject).map(ending => ending.id);
  assert(JSON.stringify(controlEligible) === JSON.stringify(subjectEligible), 'fatigue/anxiety must not change Ending eligibility');
}

function assertLifeMemoryInvariance(control: GameState): void {
  const subject = cloneState(control);
  subject.player.statuses = ['fatigued', 'anxious'];
  const controlSummary = deriveLifeMemorySummary(control);
  const subjectSummary = deriveLifeMemorySummary(subject);
  assert(JSON.stringify(controlSummary) === JSON.stringify(subjectSummary), 'fatigue/anxiety must not change Life Memory summary');
}

async function assertFormalOutcomeInvariance(control: GameState): Promise<void> {
  const choice = findFormalChoice('倾囊相授，友好交流');
  const effects = choice.effects ?? [];
  assert(
    effects.every((effect: any) => !String(effect.type).startsWith('status_')),
    'formal invariance fixture must not contain Status effects',
  );

  const subject = cloneState(control);
  subject.player.statuses = ['fatigued', 'anxious'];
  const executor = new EventExecutor();
  const [controlResult, subjectResult] = await Promise.all([
    executor.executeEffects(effects, control),
    executor.executeEffects(effects, subject),
  ]);
  const controlObservable = {
    connections: controlResult.player.connections,
  };
  const subjectObservable = {
    connections: subjectResult.player.connections,
  };
  assert(JSON.stringify(controlObservable) === JSON.stringify(subjectObservable), 'fatigue/anxiety must not change formal non-Status outcome');
}

function assertDailyWeightInvariance(control: GameState): void {
  const ordinary: DailyEventConfig = {
    id: 'test_status_invariant_daily_event',
    group: 'training',
    title: 'ordinary daily event',
    ageRange: { min: 0, max: 100 },
    baseWeight: 7,
    variants: {
      positive: [{
        id: 'test_status_invariant_daily_positive',
        weight: 1,
        text: 'positive',
        statEffects: [{ stat: 'martialPower', value: 1 }],
      }],
      neutral: [{ id: 'test_status_invariant_daily_neutral', weight: 1, text: 'neutral' }],
      negative: [{ id: 'test_status_invariant_daily_negative', weight: 1, text: 'negative' }],
    },
  };
  const subject = cloneState(control);
  subject.player.statuses = ['fatigued', 'anxious'];
  const system = new DailyEventSystem();
  const controlEvent = withDeterministicRandom(() => system.selectEvent(control, [ordinary]));
  const subjectEvent = withDeterministicRandom(() => system.selectEvent(subject, [ordinary]));
  assert(controlEvent !== null && subjectEvent !== null, 'ordinary DailyEvent must remain eligible');
  assert(controlEvent!.id === subjectEvent!.id, 'fatigue/anxiety must not change ordinary DailyEvent outcome');
  assert(controlEvent!.weight === subjectEvent!.weight, 'fatigue/anxiety must not change ordinary DailyEvent weight');
  assert(
    JSON.stringify(controlEvent!.autoEffects) === JSON.stringify(subjectEvent!.autoEffects),
    'fatigue/anxiety must not change ordinary DailyEvent outcome effects',
  );
}

function findFormalChoice(text: string): any {
  const files = ['middle-age-career.json', 'family-life.json', 'love.json'];
  const visit = (value: any): any => {
    if (!value || typeof value !== 'object') return undefined;
    if (typeof value.text === 'string' && value.text.includes(text) && Array.isArray(value.effects)) return value;
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }
    return undefined;
  };
  for (const file of files) {
    const found = visit(JSON.parse(readFileSync(resolve('src/data/lines', file), 'utf8')));
    if (found) return found;
  }
  throw new Error(`formal choice not found: ${text}`);
}

function assertNoNumericFatigueAnxietyReferences(): void {
  const sourceFiles = collectSourceFiles(resolve('src'));
  const forbidden = [
    /\blifeStates\.(?:fatigue|anxiety)\b/,
    /\bstate\s*:\s*['"](?:fatigue|anxiety)['"]/,
    /['"]?(?:fatigue|anxiety)['"]?\s*:/,
  ];
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8');
    for (const pattern of forbidden) {
      assert(!pattern.test(source), `numeric fatigue/anxiety contract leaked into ${file}`);
    }
  }
}

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return statSync(path).isFile() && /\.(json|ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

function findChoiceContaining(values: unknown[], text: string): any {
  const visit = (value: any): any => {
    if (!value || typeof value !== 'object') return undefined;
    if (typeof value.text === 'string' && value.text.includes(text) && Array.isArray(value.effects)) return value;
    for (const child of Array.isArray(value) ? value : Object.values(value)) {
      const found = visit(child);
      if (found) return found;
    }
    return undefined;
  };
  for (const value of values) {
    const found = visit(value);
    if (found) return found;
  }
  throw new Error(`formal choice not found: ${text}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalFatigueAnxietyStatusMigrationTests().then(() => {
    console.log('canonicalFatigueAnxietyStatusMigration.test.ts: ok');
  });
}
