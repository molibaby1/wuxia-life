/**
 * P20 replayability and archetype coverage tests.
 */

import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  P20_MARTIAL_ASCENDANT,
  P20_REPETITION_DEFAULT,
  P20_SLICE_ORIGIN_EARLY,
} from '../src/narrative/profile/wuxiaReplayabilitySurfaces';
import {
  buildArchetypeCoverageReport,
  getArchetypeSchedulingMultiplier,
  selectArchetypeFamily,
} from '../src/p20/archetypeCoverage';
import {
  buildRepetitionPressureReport,
  getProfileRepetitionPressureMultiplier,
} from '../src/p20/repetitionPressure';
import { assembleP20GateReport, profileHasP20Sections } from '../src/p20/reportBuilder';
import { buildWholeLifePacingReport, getWholeLifePacingMultiplier } from '../src/p20/wholeLifePacing';
import {
  runArchetypeDifferentiationSlice,
  runArchetypeRegressionMatrix,
  runPacingDifferentiationSlice,
  runReplaySliceValidations,
  runReplayabilityValidationComparison,
  runRepetitionOverlapSlice,
} from '../src/p20/validationSlices';
import {
  EventCategory,
  EventPriority,
  type EventDefinition,
  type GameState,
  type PlayerState,
} from '../src/types/eventTypes';

const FIXTURE_EVENT_TIMESTAMP = 1_700_000_000_000;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function basePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  const { flags: overrideFlags, ...rest } = overrides;
  return {
    age: 20,
    name: 't',
    gender: 'male',
    martialPower: 35,
    chivalry: 35,
    constitution: 50,
    comprehension: 40,
    affiliation: null,
    title: null,
    reputation: 20,
    money: 300,
    knowledge: 30,
    charisma: 32,
    businessAcumen: 25,
    influence: 18,
    connections: 12,
    martialHeritage: 8,
    scholarlyHeritage: 5,
    merchantNetwork: 5,
    children: 0,
    spouse: null,
    alive: true,
    ...rest,
    flags: { ...(overrideFlags ?? {}) },
  };
}

type GameStateFixtureInput = Omit<Partial<GameState>, 'player'> & {
  player?: Partial<PlayerState>;
};

function makeState(overrides: GameStateFixtureInput = {}): GameState {
  return {
    player: basePlayer(overrides.player),
    flags: { origin_id: 'martial_family', ...(overrides.flags ?? {}) },
    relations: overrides.relations ?? {},
    lifePath: overrides.lifePath,
    achievements: overrides.achievements ?? [],
    eventHistory: overrides.eventHistory ?? [],
  };
}

function fakeEvent(id: string, tags: string[] = []): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.RANDOM_ENCOUNTER,
    priority: EventPriority.NORMAL,
    weight: 1,
    ageRange: { min: 0, max: 99 },
    triggers: [],
    content: { text: id, title: id, description: '' },
    eventType: 'auto',
    metadata: {
      enabled: true,
      createdAt: FIXTURE_EVENT_TIMESTAMP,
      updatedAt: FIXTURE_EVENT_TIMESTAMP,
      tags,
    },
  };
}

function testProfileSchema(): void {
  const profile = getWorldProfile();
  assert(profileHasP20Sections(profile), 'P20 profile sections present');
  assert((profile.archetypeFamilyConfigs?.length ?? 0) >= 5, 'archetype families');
  assert((profile.repetitionPressureConfigs?.length ?? 0) >= 3, 'repetition configs');
  assert((profile.archetypePacingProfiles?.length ?? 0) >= 5, 'pacing profiles');
  assert((profile.replaySliceConfigs?.length ?? 0) >= 3, 'replay slices');
  assert(
    WUXIA_WORLD_PROFILE.archetypeFamilyConfigs?.some(f => f.id === P20_MARTIAL_ASCENDANT.id),
    'martial ascendant config',
  );
  assert(
    WUXIA_WORLD_PROFILE.repetitionPressureConfigs?.some(c => c.id === P20_REPETITION_DEFAULT.id),
    'default repetition config',
  );
  assert(
    WUXIA_WORLD_PROFILE.replaySliceConfigs?.some(s => s.id === P20_SLICE_ORIGIN_EARLY.id),
    'origin early slice',
  );
}

function testArchetypeSelection(): void {
  const martial = makeState({
    flags: {
      origin_id: 'martial_family',
      martial_talent_acknowledged: true,
      joined_sect: true,
      has_disciples: true,
    },
    player: { age: 40, martialPower: 70 },
  });
  const family = selectArchetypeFamily(martial);
  assert(family.familyId === P20_MARTIAL_ASCENDANT.id, `martial family got ${family.familyId}`);
  const report = buildArchetypeCoverageReport(martial);
  assert(report.distinctiveBeyondRouteLabel, 'distinctive beyond route');
  const multiplier = getArchetypeSchedulingMultiplier(martial, fakeEvent('train_basic', ['training']));
  assert(multiplier > 1, 'training boost for martial');
}

function testRepetitionPressure(): void {
  const state = makeState({
    eventHistory: [
      { eventId: 'economy_loss', age: 18 },
      { eventId: 'economy_loss', age: 19 },
    ],
  });
  const event = fakeEvent('economy_loss', ['economy']);
  const report = buildRepetitionPressureReport(state, event);
  assert(report.recentExactRepeats >= 1, 'exact repeats detected');
  const multiplier = getProfileRepetitionPressureMultiplier(state, event);
  assert(multiplier < 1 || report.exactRepeatDecay < 1, 'repeat suppression applies');
}

function testWholeLifePacing(): void {
  const scholar = makeState({
    flags: { origin_id: 'scholar_house', scholar_path_started: true, mentor_bond: true },
    player: { age: 14, knowledge: 25 },
  });
  const report = buildWholeLifePacingReport(scholar);
  assert(report.comparisonLines.length >= 3, 'pacing comparison lines');
  assert(report.stageSnapshots.length === 4, 'four stage snapshots');
  const multiplier = getWholeLifePacingMultiplier(scholar, fakeEvent('study_event', ['study']));
  assert(multiplier > 0, 'pacing multiplier valid');
}

function testValidationSlices(): void {
  const archetype = runArchetypeDifferentiationSlice();
  assert(archetype.atLeastThreeDistinct, '3+ distinct archetypes');
  assert(archetype.beyondRouteLabel, 'beyond route label');

  const repetition = runRepetitionOverlapSlice();
  assert(repetition.overlapMateriallyReduced, 'overlap reduced');

  const pacing = runPacingDifferentiationSlice();
  assert(pacing.pacingMeaningfullyDiffers, 'pacing differs');

  const slices = runReplaySliceValidations();
  assert(slices.every(s => s.passed), 'all replay slices pass');

  const regression = runArchetypeRegressionMatrix();
  assert(regression.allRepresentativeEmerge, 'regression matrix');

  const comparison = runReplayabilityValidationComparison();
  assert(comparison.weakArchetypeImproved, 'weak archetype improved');
}

function testGateReport(): void {
  const gate = assembleP20GateReport();
  assert(gate.decision === 'pass', `gate decision ${gate.decision} warnings: ${gate.warnings.join('; ')}`);
  assert(gate.validation.archetypeDifferentiation, 'gate archetype');
  assert(gate.validation.replaySlicesPass, 'gate slices');
}

export function runP20ReplayabilityTests(): void {
  testProfileSchema();
  testArchetypeSelection();
  testRepetitionPressure();
  testWholeLifePacing();
  testValidationSlices();
  testGateReport();
  console.log('p20ReplayabilityTests: all passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP20ReplayabilityTests();
}
