import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { coreTalents } from '../src/data/traits/coreTalents';
import { weaknesses } from '../src/data/traits/weaknesses';
import { createDefaultPlayerLifeStates, lifeStates } from '../src/data/life/lifeStates';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { DailyEventSystem } from '../src/core/DailyEventSystem';
import { EndingSystem } from '../src/core/EndingSystem';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
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

  assert(
    !weaknesses.some(item => item.stateBiases?.some(
      bias => bias.state === ('fatigue' as never) || bias.state === ('anxiety' as never),
    )),
    'weakness configs must not reference fatigue/anxiety',
  );
  assert(
    !coreTalents.some(item => item.stateBiases?.some(bias => bias.state === ('anxiety' as never))),
    'core talents must not reference anxiety',
  );

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
  assertEndingInvariance(absentState);
  assertLifeMemoryInvariance(absentState);
  await assertFormalOutcomeInvariance(absentState);
  assertDailyWeightInvariance(absentState);
  assertNoNumericFatigueAnxietyReferences();
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function withDeterministicRandom<T>(run: () => T): T {
  const originalRandom = Math.random;
  Math.random = () => 0;
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
  const expectedAdds: Record<string, 'fatigued' | 'anxious'> = {
    daily_copybook_practice_neg_1: 'fatigued',
    daily_morning_training_neg_1: 'anxious',
    daily_skip_training_neg_1: 'anxious',
    daily_training_bottleneck_neg_1: 'anxious',
    daily_reading_notes_neg_1: 'anxious',
    daily_take_odd_job_neg_1: 'anxious',
    daily_small_trade_neg_1: 'anxious',
    daily_tight_budget_neg_1: 'anxious',
    daily_home_letter_neg_1: 'anxious',
    daily_shared_meal_neg_1: 'anxious',
    daily_household_burden_neg_1: 'anxious',
    daily_night_reflection_neg_1: 'anxious',
    daily_second_guess_neg_1: 'anxious',
    daily_get_back_spirit_neg_1: 'anxious',
  };
  for (const [variantId, status] of Object.entries(expectedAdds)) {
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
  const files = ['middle-age-career.json', 'family-life.json', 'love.json'];
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
  const expected: Array<[string, 'fatigued' | 'anxious']> = [
    ['innovate_full', 'fatigued'],
    ['innovate_full', 'anxious'],
  ];
  for (const [id, status] of expected) {
    const target = findById(id);
    const effects = target.effects ?? [];
    assert(effects.some((effect: any) => effect.type === 'status_add' && effect.status === status), `${id} must add ${status}`);
  }
  for (const [text, status] of [
    ['参加比武，争夺盟主', 'fatigued'],
    ['大规模扩建', 'anxious'],
    ['倾尽家财', 'anxious'],
    ['尽力而为，量力而行', 'anxious'],
    ['正面对决', 'anxious'],
    ['设法缓和局面', 'anxious'],
  ] as const) {
    const target = findChoiceContaining(values, text);
    assert((target.effects ?? []).some((effect: any) => effect.type === 'status_add' && effect.status === status), `${text} must add ${status}`);
  }
  for (const [id, status] of [
    ['innovate_suspend', 'anxious'],
    ['career_sect_expansion', 'anxious'],
    ['love_withdraw', 'anxious'],
  ] as const) {
    const target = id === 'innovate_suspend'
      ? findById(id)
      : findChoiceContaining(values, id === 'career_sect_expansion' ? '暂缓扩建' : '暂时退让');
    assert((target.effects ?? []).some((effect: any) => effect.type === 'status_remove' && effect.status === status), `${id} must remove ${status}`);
  }
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
    externalSkill: controlResult.player.externalSkill,
  };
  const subjectObservable = {
    connections: subjectResult.player.connections,
    externalSkill: subjectResult.player.externalSkill,
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
