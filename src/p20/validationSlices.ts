import { buildEndgameCategoryReport } from '../p19/endgameCategories';
import { buildHistoricalMemoryReport } from '../p19/historicalMemory';
import {
  P20_DEMONIC_OUTLAW,
  P20_HERMIT_WITHDRAWAL,
  P20_MARTIAL_ASCENDANT,
  P20_SCHOLAR_STATESMAN,
  P20_WEALTH_MERCHANT,
} from '../narrative/profile/wuxiaReplayabilitySurfaces';
import {
  EventCategory,
  EventPriority,
  type EventDefinition,
  type GameState,
  type PlayerState,
} from '../types/eventTypes';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import { buildArchetypeCoverageReport, resolveArchetypeCandidates } from './archetypeCoverage';
import { buildRepetitionPressureReport } from './repetitionPressure';
import { buildWholeLifePacingReport, formatPacingComparisonMarkdown } from './wholeLifePacing';

const FIXTURE_EVENT_TIMESTAMP = 1_700_000_000_000;

function basePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  const { flags: overrideFlags, ...rest } = overrides;
  return {
    age: 18,
    name: 'slice',
    gender: 'male',
    martialPower: 30,
    externalSkill: 28,
    internalSkill: 25,
    qinggong: 22,
    chivalry: 30,
    constitution: 50,
    comprehension: 40,
    sect: null,
    title: null,
    reputation: 15,
    money: 200,
    knowledge: 25,
    charisma: 30,
    businessAcumen: 20,
    influence: 15,
    connections: 10,
    martialHeritage: 5,
    scholarlyHeritage: 5,
    merchantNetwork: 5,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    traits: [],
    healthStatus: 'healthy',
    statuses: [],
    lifeStates: createDefaultPlayerLifeStates(),
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

function baseState(partial: GameStateFixtureInput = {}): GameState {
  return {
    player: basePlayer(partial.player),
    facts: {},
    flags: { origin_id: 'martial_family', ...(partial.flags ?? {}) },
    relations: partial.relations ?? {},
    lifePath: partial.lifePath,
    achievements: partial.achievements ?? [],
    eventHistory: partial.eventHistory ?? [],
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

export interface ArchetypeDifferentiationSliceResult {
  slice: 'archetype_differentiation';
  martialFamily: string;
  scholarFamily: string;
  wealthFamily: string;
  demonicFamily: string;
  hermitFamily: string;
  atLeastThreeDistinct: boolean;
  beyondRouteLabel: boolean;
}

export interface RepetitionOverlapSliceResult {
  slice: 'repetition_overlap';
  baselineExactRepeatDecay: number;
  tunedExactRepeatDecay: number;
  overlapMateriallyReduced: boolean;
  noveltyImproved: boolean;
}

export interface PacingDifferentiationSliceResult {
  slice: 'pacing_differentiation';
  martialDensity: number;
  scholarDensity: number;
  densityDelta: number;
  pacingMeaningfullyDiffers: boolean;
  comparisonMarkdown: string;
}

export interface ReplaySliceValidationResult {
  sliceId: string;
  emphasis: string;
  archetypeFamily: string;
  signalsPresent: string[];
  passed: boolean;
}

export interface ArchetypeRegressionMatrixRow {
  archetypeId: string;
  label: string;
  emerges: boolean;
  arcDistinctive: boolean;
  endingCoherent: boolean;
  matchedSignals: string[];
}

export interface ArchetypeRegressionMatrixResult {
  matrix: 'archetype_regression';
  rows: ArchetypeRegressionMatrixRow[];
  allRepresentativeEmerge: boolean;
}

export function runArchetypeDifferentiationSlice(): ArchetypeDifferentiationSliceResult {
  const martial = baseState({
    flags: {
      origin_id: 'martial_family',
      martial_talent_acknowledged: true,
      joined_sect: true,
      has_disciples: true,
      martial_transmission: true,
    },
    player: { age: 45, martialPower: 80, martialHeritage: 50, flags: { martial_talent_acknowledged: true, joined_sect: true } },
    lifePath: {
      primaryIdentity: 'martial',
      faction: 'orthodox',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
      focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
    },
  });

  const scholar = baseState({
    flags: {
      origin_id: 'scholar_house',
      scholar_path_started: true,
      mentor_bond: true,
      teaching_legacy: true,
    },
    player: {
      age: 42,
      knowledge: 75,
      scholarlyHeritage: 40,
      flags: { scholar_path_started: true },
    },
    lifePath: {
      primaryIdentity: 'scholarly',
      faction: 'neutral',
      lifeStage: 'achievement',
      achievements: [],
      relationships: { allies: ['a1'], enemies: [], mentors: ['m1'], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
      focus: { martial: 0, business: 0, academic: 1, leadership: 0.2 },
    },
  });

  const wealth = baseState({
    flags: {
      origin_id: 'merchant_house',
      merchant_network_growing: true,
      wealth_milestone: true,
      family_heir: true,
    },
    player: {
      age: 38,
      money: 2500,
      merchantNetwork: 45,
      businessAcumen: 60,
    },
    lifePath: {
      primaryIdentity: 'wealth',
      faction: 'neutral',
      lifeStage: 'achievement',
      achievements: [],
      relationships: { allies: ['t1'], enemies: [], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
      focus: { martial: 0, business: 1, academic: 0, leadership: 0.3 },
    },
  });

  const demonic = baseState({
    flags: {
      origin_id: 'martial_family',
      demonic_reputation: true,
      blood_feud_active: true,
      sect_exposure: true,
      inherited_burden: true,
    },
    player: { age: 48, flags: { demonic_reputation: true } },
    lifePath: {
      primaryIdentity: 'martial',
      faction: 'evil',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: ['e1'], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e1'] },
      focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
    },
  });

  const hermit = baseState({
    flags: { origin_id: 'poor_family', hermit_withdrawal: true, lonely_elder: true, fade_legacy: true },
    player: { age: 62, flags: { hermit_withdrawal: true } },
  });

  const martialFamily = buildArchetypeCoverageReport(martial).selectedFamily.familyId;
  const scholarFamily = buildArchetypeCoverageReport(scholar).selectedFamily.familyId;
  const wealthFamily = buildArchetypeCoverageReport(wealth).selectedFamily.familyId;
  const demonicFamily = buildArchetypeCoverageReport(demonic).selectedFamily.familyId;
  const hermitFamily = buildArchetypeCoverageReport(hermit).selectedFamily.familyId;

  const families = new Set([martialFamily, scholarFamily, wealthFamily, demonicFamily, hermitFamily]);
  const reports = [martial, scholar, wealth, demonic, hermit].map(state =>
    buildArchetypeCoverageReport(state),
  );

  return {
    slice: 'archetype_differentiation',
    martialFamily,
    scholarFamily,
    wealthFamily,
    demonicFamily,
    hermitFamily,
    atLeastThreeDistinct: families.size >= 3,
    beyondRouteLabel: reports.every(report => report.distinctiveBeyondRouteLabel),
  };
}

export function runRepetitionOverlapSlice(): RepetitionOverlapSliceResult {
  const event = fakeEvent('economy_setback_trade', ['economy']);
  const baseline = baseState({
    eventHistory: [
      { eventId: 'economy_setback_trade', age: 16 },
      { eventId: 'economy_setback_trade', age: 17 },
    ],
  });
  const tuned = baseState({
    eventHistory: [{ eventId: 'economy_setback_trade', age: 16 }],
  });

  const baselineReport = buildRepetitionPressureReport(baseline, event);
  const tunedReport = buildRepetitionPressureReport(tuned, event);

  return {
    slice: 'repetition_overlap',
    baselineExactRepeatDecay: baselineReport.exactRepeatDecay,
    tunedExactRepeatDecay: tunedReport.exactRepeatDecay,
    overlapMateriallyReduced: tunedReport.exactRepeatDecay > baselineReport.exactRepeatDecay,
    noveltyImproved: tunedReport.noveltyBoost >= baselineReport.noveltyBoost,
  };
}

export function runPacingDifferentiationSlice(): PacingDifferentiationSliceResult {
  const martial = baseState({
    flags: { origin_id: 'martial_family', martial_talent_acknowledged: true, joined_sect: true },
    player: { age: 15 },
  });
  const scholar = baseState({
    flags: { origin_id: 'scholar_house', scholar_path_started: true, mentor_bond: true },
    player: { age: 15, knowledge: 30 },
  });

  const martialPacing = buildWholeLifePacingReport(martial);
  const scholarPacing = buildWholeLifePacingReport(scholar);
  const densityDelta = Math.abs(martialPacing.pacingMultiplier - scholarPacing.pacingMultiplier);

  return {
    slice: 'pacing_differentiation',
    martialDensity: martialPacing.pacingMultiplier,
    scholarDensity: scholarPacing.pacingMultiplier,
    densityDelta,
    pacingMeaningfullyDiffers: densityDelta >= 0.05,
    comparisonMarkdown: formatPacingComparisonMarkdown(
      { ...martialPacing, archetypeFamilyId: P20_MARTIAL_ASCENDANT.id },
      { ...scholarPacing, archetypeFamilyId: P20_SCHOLAR_STATESMAN.id },
    ),
  };
}

export function runReplaySliceValidations(): ReplaySliceValidationResult[] {
  const slices: Array<{ id: string; emphasis: string; state: GameState; expectedFamily: string; signals: string[] }> = [
    {
      id: 'p20_slice_origin_early',
      emphasis: 'origin_early_growth',
      expectedFamily: P20_MARTIAL_ASCENDANT.id,
      signals: ['origin', 'growth'],
      state: baseState({
        flags: { origin_id: 'martial_family', martial_talent_acknowledged: true, joined_sect: true },
        player: { age: 12 },
      }),
    },
    {
      id: 'p20_slice_midlife_consequence',
      emphasis: 'midlife_consequence',
      expectedFamily: P20_DEMONIC_OUTLAW.id,
      signals: ['route', 'social'],
      state: baseState({
        flags: { demonic_reputation: true, blood_feud_active: true, sect_exposure: true },
        player: { age: 35 },
        lifePath: {
          primaryIdentity: 'martial',
          faction: 'evil',
          lifeStage: 'achievement',
          achievements: [],
          relationships: { allies: [], enemies: ['e1'], mentors: [], disciples: [] },
          commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e1'] },
          focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
        },
      }),
    },
    {
      id: 'p20_slice_legacy_endgame',
      emphasis: 'legacy_endgame_memory',
      expectedFamily: P20_SCHOLAR_STATESMAN.id,
      signals: ['legacy', 'growth'],
      state: baseState({
        flags: { scholar_path_started: true, teaching_legacy: true, mentor_bond: true },
        player: { age: 58, scholarlyHeritage: 35 },
      }),
    },
    {
      id: 'p20_slice_wealth_pacing',
      emphasis: 'midlife_consequence',
      expectedFamily: P20_WEALTH_MERCHANT.id,
      signals: ['origin', 'growth'],
      state: baseState({
        flags: { origin_id: 'merchant_house', merchant_network_growing: true, wealth_milestone: true },
        player: { age: 32, merchantNetwork: 30 },
      }),
    },
    {
      id: 'p20_slice_hermit_closure',
      emphasis: 'legacy_endgame_memory',
      expectedFamily: P20_HERMIT_WITHDRAWAL.id,
      signals: ['social', 'endgame'],
      state: baseState({
        flags: { hermit_withdrawal: true, lonely_elder: true, fade_legacy: true },
        player: { age: 66 },
      }),
    },
  ];

  return slices.map(entry => {
    const report = buildArchetypeCoverageReport(entry.state);
    const signalsPresent = entry.signals.filter(signal =>
      report.selectedFamily.matchedSignals.includes(signal),
    );
    return {
      sliceId: entry.id,
      emphasis: entry.emphasis,
      archetypeFamily: report.selectedFamily.familyId,
      signalsPresent,
      passed:
        report.selectedFamily.familyId === entry.expectedFamily && signalsPresent.length >= 1,
    };
  });
}

export function runArchetypeRegressionMatrix(): ArchetypeRegressionMatrixResult {
  const fixtures: Array<{ configId: string; label: string; state: GameState }> = [
    {
      configId: P20_MARTIAL_ASCENDANT.id,
      label: P20_MARTIAL_ASCENDANT.label,
      state: baseState({
        flags: {
          origin_id: 'martial_family',
          martial_talent_acknowledged: true,
          joined_sect: true,
          martial_transmission: true,
          has_disciples: true,
        },
        player: { age: 50, martialPower: 85 },
      }),
    },
    {
      configId: P20_SCHOLAR_STATESMAN.id,
      label: P20_SCHOLAR_STATESMAN.label,
      state: baseState({
        flags: {
          origin_id: 'scholar_house',
          scholar_path_started: true,
          teaching_legacy: true,
        },
        player: { age: 48, knowledge: 70 },
      }),
    },
    {
      configId: P20_WEALTH_MERCHANT.id,
      label: P20_WEALTH_MERCHANT.label,
      state: baseState({
        flags: { origin_id: 'merchant_house', wealth_milestone: true, family_heir: true },
        player: { age: 44, money: 1800 },
      }),
    },
    {
      configId: P20_HERMIT_WITHDRAWAL.id,
      label: P20_HERMIT_WITHDRAWAL.label,
      state: baseState({
        flags: { hermit_withdrawal: true, lonely_elder: true, fade_legacy: true },
        player: { age: 64 },
      }),
    },
    {
      configId: P20_DEMONIC_OUTLAW.id,
      label: P20_DEMONIC_OUTLAW.label,
      state: baseState({
        flags: { demonic_reputation: true, blood_feud_active: true, inherited_burden: true },
        player: { age: 46 },
        lifePath: {
          primaryIdentity: 'martial',
          faction: 'evil',
          lifeStage: 'legacy',
          achievements: [],
          relationships: { allies: [], enemies: ['e1'], mentors: [], disciples: [] },
          commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e1'] },
          focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
        },
      }),
    },
  ];

  const rows: ArchetypeRegressionMatrixRow[] = fixtures.map(fixture => {
    const coverage = buildArchetypeCoverageReport(fixture.state);
    const endgame = buildEndgameCategoryReport(fixture.state);
    const memory = buildHistoricalMemoryReport(fixture.state);
    const emerges = coverage.selectedFamily.familyId === fixture.configId;
    const arcDistinctive = coverage.distinctiveBeyondRouteLabel;
    const endingCoherent =
      endgame.selectedCategory.kind.length > 0 && memory.divergenceScore >= 0;
    return {
      archetypeId: fixture.configId,
      label: fixture.label,
      emerges,
      arcDistinctive,
      endingCoherent,
      matchedSignals: coverage.selectedFamily.matchedSignals,
    };
  });

  return {
    matrix: 'archetype_regression',
    rows,
    allRepresentativeEmerge: rows.every(row => row.emerges),
  };
}

export function runReplayabilityValidationComparison(): {
  archetype: ArchetypeDifferentiationSliceResult;
  repetition: RepetitionOverlapSliceResult;
  pacing: PacingDifferentiationSliceResult;
  weakArchetypeImproved: boolean;
} {
  const archetype = runArchetypeDifferentiationSlice();
  const repetition = runRepetitionOverlapSlice();
  const pacing = runPacingDifferentiationSlice();

  const scholarCandidate = resolveArchetypeCandidates(
    baseState({
      flags: { origin_id: 'scholar_house', scholar_path_started: true, mentor_bond: true },
      player: { age: 40, knowledge: 55 },
    }),
  )[0];

  const weakArchetypeImproved =
    scholarCandidate?.familyId === P20_SCHOLAR_STATESMAN.id &&
    (scholarCandidate?.matchedSignals.length ?? 0) >= 2;

  return { archetype, repetition, pacing, weakArchetypeImproved };
}
