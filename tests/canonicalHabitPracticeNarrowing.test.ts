import { assert, assertDeepEqual } from './GameTestFramework';
import { GameTestFramework } from './GameTestFramework';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import fs from 'node:fs';
import path from 'node:path';
import { EventLoader } from '../src/core/EventLoader';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { dailyEventSystem } from '../src/core/DailyEventSystem';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';
import { inferLivedSelfUnderstanding } from '../src/p19/stateAccess';
import { selectArchetypeFamily } from '../src/p20/archetypeCoverage';
import { buildLateLifePracticeRecapLine, derivePracticeTrajectoryLines } from '../src/utils/practiceTrajectorySummary';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { EndingSystem } from '../src/core/EndingSystem';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function findAction(id: string) {
  const action = [...activeActionCatalog, ...childhoodActionCatalog].find(item => item.id === id);
  if (!action) throw new Error(`action not found: ${id}`);
  return action;
}

function testExplicitActiveActionHabitEffects(): void {
  assertDeepEqual(findAction('action_training_basic').habitEffects, [
    { state: 'trainingHabit', value: 1 },
  ], 'quarterly training must explicitly add training practice');
  assertDeepEqual(findAction('action_study_basic').habitEffects, [
    { state: 'studyHabit', value: 1 },
  ], 'quarterly study must explicitly add study practice');
  assertDeepEqual(findAction('action_business_basic').habitEffects, [
    { state: 'businessHabit', value: 1 },
  ], 'quarterly business must explicitly add business practice');
  assertDeepEqual(findAction('action_childhood_training').habitEffects, [
    { state: 'trainingHabit', value: 1 },
  ], 'quarterly childhood training is explicit practice');
  assertDeepEqual(findAction('action_study_lite').habitEffects, [
    { state: 'studyHabit', value: 1 },
  ], 'quarterly childhood study is explicit practice');
  assertDeepEqual(findAction('action_household_apprentice').habitEffects, [
    { state: 'businessHabit', value: 1 },
  ], 'quarterly household apprenticeship is explicit practice');
  assert(findAction('action_childhood_yard_play').habitEffects === undefined, 'yard play is not training practice');
  assert(findAction('action_household_errand').habitEffects === undefined, 'one-month errand is not business practice');
}

function testActiveActionDoesNotProjectLegacyHabitFlags(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();
  state.player.lifeStates.trainingHabit = 0;

  executeActiveActionOnState(state, 'action_training_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.player.lifeStates.trainingHabit === 1, 'explicit effect adds training practice');
  assert(state.flags.training_habit === undefined, 'game flags must not project training_habit');
  assert(state.player.flags.training_habit === undefined, 'player flags must not project training_habit');
}

function testEchoFlagDoesNotCreateHabit(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();
  state.player.lifeStates.trainingHabit = 0;

  const yardPlay = findAction('action_childhood_yard_play');
  assert(yardPlay.onCompleteFlags?.includes('p9_echo_training_hook') === true, 'fixture keeps route echo fact');
  executeActiveActionOnState(state, yardPlay.id, {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.flags.p9_echo_training_hook === true, 'route echo fact remains');
  assert(state.player.lifeStates.trainingHabit === 0, 'echo flag must not create training practice');
}

function eventHasHabitEffect(
  eventId: string,
  target: 'trainingHabit' | 'studyHabit' | 'businessHabit',
  choiceId?: string,
): boolean {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  const effects = choiceId
    ? event.choices?.find(item => item.id === choiceId)?.effects ?? []
    : event.autoEffects ?? [];
  return effects.some(effect => effect.type === 'life_state_change' && effect.target === target);
}

function testRejectedExplicitFormalProducersAreRemoved(): void {
  assert(!eventHasHabitEffect('martial_arts_enlightenment', 'studyHabit', 'balanced_start'), 'balanced enlightenment must not create study practice');
  assert(!eventHasHabitEffect('p9_childhood_balanced_posture', 'studyHabit'), 'one childhood posture test must not create study practice');
  assert(!eventHasHabitEffect('p9_childhood_first_trade', 'businessHabit'), 'first trade must not create long-term business practice');
  assert(!eventHasHabitEffect('childhood_preference', 'studyHabit', 'balance_both'), 'one balanced childhood choice must not create study practice');
}

function testFormalEventTagsDoNotAutoCreateHabit(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!/martialGain\s*>=\s*8[\s\S]{0,260}trainingHabit/.test(source), 'martial gain threshold must not create trainingHabit');
  assert(!/academicGain\s*>=\s*3[\s\S]{0,260}studyHabit/.test(source), 'academic gain threshold must not create studyHabit');
  assert(!/moneyGain\s*>=\s*25[\s\S]{0,320}businessHabit/.test(source), 'business gain threshold must not create businessHabit');
}

function findDailyEvent(id: string) {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function testDailyHabitProducerAndWeightNarrowing(): void {
  for (const event of dailyEvents) {
    assert(!('longTermHooks' in event), `${event.id} must not expose longTermHooks`);
    assert(!('preferredStates' in event), `${event.id} must not expose removed preferredStates contract`);
  }

  const bottleneck = findDailyEvent('daily_training_bottleneck');
  const positive = bottleneck.variants.positive.find(item => item.id === 'daily_training_bottleneck_pos_1');
  assert(
    positive?.stateEffects?.some(effect => effect.state === 'trainingHabit' && effect.value === 1) === true,
    'training bottleneck explicit producer must remain',
  );
}

function testDailyGroupWeightsIgnorePracticeHabits(): void {
  const state = createState();
  state.player.age = 20;
  state.player.lifeStates = createDefaultPlayerLifeStates();
  state.player.lifeStates.trainingHabit = 0;
  state.player.lifeStates.studyHabit = 0;
  const training = findDailyEvent('daily_morning_training');
  const study = findDailyEvent('daily_copybook_practice');
  const getWeight = (dailyEventSystem as unknown as {
    getWeight(config: typeof training, state: GameState): number;
  }).getWeight.bind(dailyEventSystem);

  const lowTraining = getWeight(training, state);
  const lowStudy = getWeight(study, state);
  state.player.lifeStates.trainingHabit = 5;
  state.player.lifeStates.studyHabit = 5;

  assert(getWeight(training, state) === lowTraining, 'trainingHabit must not change daily training weight');
  assert(getWeight(study, state) === lowStudy, 'studyHabit must not change daily study weight');
}

function testNoLegacyHabitFlagConsumers(): void {
  const p21 = fs.readFileSync(path.resolve('src/data/lines/p21-content-samples.json'), 'utf8');
  const p22 = fs.readFileSync(path.resolve('src/data/lines/p22-content-expansions.json'), 'utf8');
  const replay = fs.readFileSync(path.resolve('src/narrative/profile/wuxiaReplayabilitySurfaces.ts'), 'utf8');
  const validation = fs.readFileSync(path.resolve('src/p20/validationSlices.ts'), 'utf8');
  const flagFallback = /flags\.has\("(?:training_habit|study_habit|business_habit)"\)/;
  assert(!flagFallback.test(p21), 'P21 content must not read legacy habit flags');
  assert(!flagFallback.test(p22), 'P22 content must not read legacy habit flags');
  assert(!/["'](?:training_habit|study_habit|business_habit)["']/.test(replay), 'P20 replay config must not use legacy habit flags');
  assert(!/["'](?:training_habit|study_habit|business_habit)["']/.test(validation), 'P20 validation fixtures must not use legacy habit flags');
}

function testRepositoryGuard(): void {
  const forbiddenMechanisms: Array<{ pattern: RegExp; message: string }> = [
    { pattern: /\btraining_habit\b(?![a-z0-9_])/, message: 'legacy training_habit flag' },
    { pattern: /\bstudy_habit\b(?![a-z0-9_])/, message: 'legacy study_habit flag' },
    { pattern: /\bbusiness_habit\b(?![a-z0-9_])/, message: 'legacy business_habit flag' },
    { pattern: /projectHabitCompatibilityFlags/, message: 'habit compatibility projection' },
    { pattern: /mapLegacyHabitFlagToLifeState/, message: 'legacy habit flag mapping' },
    { pattern: /buildShapingPatternEndingTone/, message: 'identity ending tone' },
  ];
  const allowedFiles = new Set([
    path.normalize('src/contracts/validation/contractValidation.ts'),
    path.normalize('src/p44/habitOperatorAudit.ts'),
  ]);
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }
      if (!/\.(ts|tsx|json)$/.test(entry.name) || allowedFiles.has(path.normalize(path.relative(process.cwd(), filePath)))) continue;
      const source = fs.readFileSync(filePath, 'utf8');
      for (const rule of forbiddenMechanisms) {
        assert(!rule.pattern.test(source), `${rule.message} found in ${path.relative(process.cwd(), filePath)}`);
      }
    }
  };
  visit(path.resolve('src'));

  const assertFunctionRangeClean = (file: string, startMarker: string, endMarker: string): void => {
    const source = fs.readFileSync(path.resolve(file), 'utf8');
    const start = source.indexOf(startMarker);
    const end = source.indexOf(endMarker, start + startMarker.length);
    assert(start >= 0 && end > start, `${file} guard markers must exist`);
    assert(!/trainingHabit|studyHabit|businessHabit/.test(source.slice(start, end)), `${file} global multiplier must ignore practice habits`);
  };
  const dailyEventSystemSource = fs.readFileSync(path.resolve('src/core/DailyEventSystem.ts'), 'utf8');
  assert(!dailyEventSystemSource.includes('preferredStates'), 'DailyEventSystem must not interpret preferredStates');
  assert(!dailyEventSystemSource.includes('getGroupStateMultiplier'), 'DailyEventSystem group multiplier helper must be removed');
  assert(!/socialMomentum|familyBond/.test(dailyEventSystemSource), 'DailyEventSystem must not read deleted axes');
  assertFunctionRangeClean('src/core/GameEngineIntegration.ts', 'getSpecializationMultiplier', 'getEventFocus');
  const mainScreenModelSource = fs.readFileSync(path.resolve('src/components/mainScreenModel.ts'), 'utf8');
  assert(!mainScreenModelSource.includes('tendencyContextMultiplier'), 'main screen tendency must not use context multipliers');
  assertFunctionRangeClean('src/components/mainScreenModel.ts', 'function buildTendencySummary', 'function createStat');
  const replaySource = fs.readFileSync(path.resolve('src/narrative/profile/wuxiaReplayabilitySurfaces.ts'), 'utf8');
  assert(!/growthPatternFlags[\s\S]{0,500}(training_habit|study_habit|business_habit)/.test(replaySource), 'replayability growth flags must not use legacy habit flags');
}

function testPracticeHabitsDoNotDefineIdentityOrTendency(): void {
  const base = createState();
  base.player.age = 40;
  base.flags = { origin_id: 'poor_family' };
  base.player.flags = { origin_id: 'poor_family' };
  base.player.martialPower = 25;
  base.player.knowledge = 25;
  base.player.businessAcumen = 25;
  base.player.connections = 25;
  base.player.reputation = 25;
  const withHabits = (value: number): GameState => {
    const clone = structuredClone(base);
    clone.player.lifeStates = createDefaultPlayerLifeStates();
    clone.player.lifeStates.trainingHabit = value;
    clone.player.lifeStates.studyHabit = value;
    clone.player.lifeStates.businessHabit = value;
    return clone;
  };
  const low = withHabits(0);
  const high = withHabits(5);
  assert(selectArchetypeFamily(low).familyId === selectArchetypeFamily(high).familyId, 'Habit-only changes must not change P20 archetype');
  assert(inferLivedSelfUnderstanding(low) === inferLivedSelfUnderstanding(high), 'Habit-only changes must not change lived self identity');
  const lifeMemory = { schemaVersion: LIFE_MEMORY_SCHEMA_VERSION, derivedAtAge: 40 } as const;
  assert(buildMainScreenModel(low.player, lifeMemory).tendencySummary === buildMainScreenModel(high.player, lifeMemory).tendencySummary, 'Habit-only changes must not change main-screen tendency ranking');

  const lowEnding = EndingSystem.determineEnding(low);
  const highEnding = EndingSystem.determineEnding(high);
  assert(lowEnding.id === highEnding.id && lowEnding.category === highEnding.category, 'Habit-only changes must not change ending selection');
  for (const ending of EndingSystem.ENDINGS) {
    assert(
      EndingSystem.canUnlockEnding(low, ending.id) === EndingSystem.canUnlockEnding(high, ending.id),
      `Habit-only changes must not change ending eligibility for ${ending.id}`,
    );
  }

  const lowMemory = deriveLifeMemorySummary(low);
  const highMemory = deriveLifeMemorySummary(high);
  const stripTrajectory = (summary: ReturnType<typeof deriveLifeMemorySummary>) => {
    const clone = structuredClone(summary);
    delete clone.habitTrajectory;
    return clone;
  };
  assertDeepEqual(stripTrajectory(lowMemory), stripTrajectory(highMemory), 'Habit-only changes must not alter other memory fields');
}

function testFormalSchedulingSourceDoesNotReadPracticeHabits(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  const start = source.indexOf('private getSpecializationMultiplier');
  const end = source.indexOf('private getEventFocus');
  assert(start >= 0 && end > start, 'formal scheduling guard markers must exist');
  assert(!/trainingHabit|studyHabit|businessHabit/.test(source.slice(start, end)), 'formal state multiplier must ignore practice habits');
}

function testPracticeTrajectoryIsDescriptiveOnly(): void {
  const state = createState();
  state.player.lifeStates = { ...createDefaultPlayerLifeStates(), trainingHabit: 3, studyHabit: 4, businessHabit: 2 };
  assertDeepEqual(derivePracticeTrajectoryLines(state.player.lifeStates, 3).map(line => line.label), ['读书实践', '练功实践', '营生实践'], 'practice trajectory must include only three practice habits');
  const recap = buildLateLifePracticeRecapLine(state.player.lifeStates);
  assert(recap.includes('读书实践'), 'recap names practice');
  assert(!/塑形|入骨|立身|身份|主轴|绝活/.test(recap), 'recap must not claim identity');
  const memory = deriveLifeMemorySummary(state);
  assert((memory.habitTrajectory ?? []).every(item => /实践$/.test(item.label)), 'Life Memory labels must be practice labels');
}

function testIdentityEndingToneHelperIsRemoved(): void {
  const source = fs.readFileSync(path.resolve('src/p19/finalSummaryComposition.ts'), 'utf8');
  assert(!source.includes('habitShapingSummary'), 'final summary composition must not import the removed shaping helper');
  assert(!source.includes('buildShapingPatternEndingTone'), 'identity ending tone helper must be removed');
}

export function runCanonicalHabitPracticeNarrowingTests(): void {
  testExplicitActiveActionHabitEffects();
  testActiveActionDoesNotProjectLegacyHabitFlags();
  testEchoFlagDoesNotCreateHabit();
  testRejectedExplicitFormalProducersAreRemoved();
  testFormalEventTagsDoNotAutoCreateHabit();
  testDailyHabitProducerAndWeightNarrowing();
  testDailyGroupWeightsIgnorePracticeHabits();
  testNoLegacyHabitFlagConsumers();
  testRepositoryGuard();
  testPracticeHabitsDoNotDefineIdentityOrTendency();
  testFormalSchedulingSourceDoesNotReadPracticeHabits();
  testPracticeTrajectoryIsDescriptiveOnly();
  testIdentityEndingToneHelperIsRemoved();
}

runCanonicalHabitPracticeNarrowingTests();
