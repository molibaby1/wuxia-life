import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import { buildEndgameCategoryReport } from './endgameCategories';
import { composeP19FinalSummary } from './finalSummaryComposition';
import { buildHistoricalMemoryReport } from './historicalMemory';
import { buildPreEndgameRecoveryReport } from './preEndgameRecovery';
import type { EndingInfo } from '../core/EndingSystem';

function baseLateLifeState(): GameState {
  return {
    player: {
      age: 68,
      name: 'slice',
      gender: 'male',
      martialPower: 42,
      externalSkill: 40,
      internalSkill: 38,
      qinggong: 35,
      chivalry: 38,
      constitution: 50,
      comprehension: 45,
      sect: null,
      title: null,
      reputation: 32,
      money: 400,
      knowledge: 40,
      charisma: 38,
      businessAcumen: 30,
      influence: 28,
      connections: 12,
      martialHeritage: 8,
      scholarlyHeritage: 5,
      merchantNetwork: 5,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    traits: [],
      children: 0,
      spouse: null,
      flags: { hermit_withdrawal: true, lonely_elder: true },
      alive: true,
    },
    facts: {},
    flags: { hermit_withdrawal: true, lonely_elder: true },
    achievements: [],
    eventHistory: [],
    relations: {},
  };
}

function sampleEnding(): EndingInfo {
  return {
    id: 'ordinary_life',
    name: '平凡一生',
    description: '无特殊成就，平静度过一生。',
    category: 'neutral',
    requirements: {},
    priority: 10,
  };
}

export interface EndgameCategoryComparisonSliceResult {
  slice: 'endgame_category_comparison';
  baselineCategory: string;
  factionShiftedCategory: string;
  legacyShiftedCategory: string;
  categoryChangesBeyondAge: boolean;
}

export interface HistoricalMemoryComparisonSliceResult {
  slice: 'historical_memory_comparison';
  admiredTone: string;
  disputedTone: string;
  divergenceScore: number;
  memoryDiffersFromSelfUnderstanding: boolean;
}

export interface PreEndgameClosureComparisonSliceResult {
  slice: 'pre_endgame_closure_comparison';
  withoutRecoverySummaryLines: number;
  withRecoverySummaryLines: number;
  closureMateriallyChangesSummary: boolean;
  withRecoveryComposedLength: number;
  withoutRecoveryComposedLength: number;
}

export function runEndgameCategoryComparisonSlice(): EndgameCategoryComparisonSliceResult {
  const baseline = baseLateLifeState();
  const baselineReport = buildEndgameCategoryReport(baseline);

  const factionHeavy = baseLateLifeState();
  factionHeavy.flags = { sect_exposure: true, blood_feud_active: true, demonic_reputation: true };
  factionHeavy.player!.flags = { ...factionHeavy.flags };
  factionHeavy.lifePath = {
    primaryIdentity: 'martial',
    faction: 'evil',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: ['e1'], mentors: [], disciples: [] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e1'] },
    focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
  };
  const factionReport = buildEndgameCategoryReport(factionHeavy);

  const legacyHeavy = baseLateLifeState();
  legacyHeavy.flags = {
    martial_transmission: true,
    inheritance_legacy_complete: true,
    hero_rep_mantle: true,
    disciple_training_active: true,
  };
  legacyHeavy.player!.flags = { ...legacyHeavy.flags };
  legacyHeavy.player!.reputation = 88;
  legacyHeavy.player!.martialPower = 92;
  legacyHeavy.player!.martialHeritage = 75;
  legacyHeavy.lifePath = {
    primaryIdentity: 'martial',
    faction: 'orthodox',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: ['a'], enemies: [], mentors: [], disciples: ['d1', 'd2'] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
  };
  const legacyReport = buildEndgameCategoryReport(legacyHeavy);

  const categoryChangesBeyondAge =
    baselineReport.selectedCategory.categoryId !== factionReport.selectedCategory.categoryId &&
    baselineReport.selectedCategory.categoryId !== legacyReport.selectedCategory.categoryId &&
    factionReport.selectedCategory.kind !== legacyReport.selectedCategory.kind;

  return {
    slice: 'endgame_category_comparison',
    baselineCategory: baselineReport.selectedCategory.kind,
    factionShiftedCategory: factionReport.selectedCategory.kind,
    legacyShiftedCategory: legacyReport.selectedCategory.kind,
    categoryChangesBeyondAge,
  };
}

function memorySliceState(
  flags: Record<string, boolean>,
  playerOverrides: Partial<NonNullable<GameState['player']>> = {},
): GameState {
  const state = baseLateLifeState();
  state.flags = { ...flags };
  state.player = {
    ...state.player!,
    flags: { ...flags },
    ...playerOverrides,
  };
  return state;
}

export function runHistoricalMemoryComparisonSlice(): HistoricalMemoryComparisonSliceResult {
  const admired = memorySliceState(
    { hero_rep_mantle: true, legendary_deed: true },
    { reputation: 90, chivalry: 85 },
  );
  const admiredReport = buildHistoricalMemoryReport(admired);

  const disputed = memorySliceState(
    { sect_exposure: true, gray_choice_history: true },
    { reputation: 75 },
  );
  const disputedReport = buildHistoricalMemoryReport(disputed);

  return {
    slice: 'historical_memory_comparison',
    admiredTone: admiredReport.selectedTone,
    disputedTone: disputedReport.selectedTone,
    divergenceScore: disputedReport.divergenceScore,
    memoryDiffersFromSelfUnderstanding:
      disputedReport.divergenceScore >= 0.35 &&
      admiredReport.selectedTone !== disputedReport.selectedTone,
  };
}

export function runPreEndgameClosureComparisonSlice(): PreEndgameClosureComparisonSliceResult {
  const without = baseLateLifeState();
  const withoutRecovery = buildPreEndgameRecoveryReport(without, new Set(['legacy']), 68);
  const withoutSummary = composeP19FinalSummary(without, sampleEnding());

  const withRecovery = baseLateLifeState();
  withRecovery.flags = {
    feud_reconciled: true,
    martial_transmission: true,
    inheritance_legacy_complete: true,
    disciple_training_active: true,
  };
  withRecovery.player!.flags = { ...withRecovery.flags };
  const recoveryReport = buildPreEndgameRecoveryReport(withRecovery, new Set(['legacy', 'continuity']), 68);
  const withSummary = composeP19FinalSummary(withRecovery, sampleEnding());

  return {
    slice: 'pre_endgame_closure_comparison',
    withoutRecoverySummaryLines: withoutRecovery.explicitSummaryLines.length,
    withRecoverySummaryLines: recoveryReport.explicitSummaryLines.length,
    closureMateriallyChangesSummary:
      recoveryReport.explicitSummaryLines.length >= 2 &&
      withSummary.composedSummary !== withoutSummary.composedSummary &&
      withSummary.recoveryLines.length > withoutSummary.recoveryLines.length,
    withRecoveryComposedLength: withSummary.composedSummary.length,
    withoutRecoveryComposedLength: withoutSummary.composedSummary.length,
  };
}

export function profileHasP19Sections(profile = getWorldProfile()): boolean {
  return (
    (profile.endgameCategoryConfigs?.length ?? 0) >= 3 &&
    (profile.preEndgameRecoveryPatterns?.length ?? 0) >= 5 &&
    (profile.historicalMemoryPatterns?.length ?? 0) >= 4
  );
}
