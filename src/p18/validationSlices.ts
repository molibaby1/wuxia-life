import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import { buildLaterLifeLegacyReport } from './laterLifeLegacySelection';

function baseLateLifeState(): GameState {
  return {
    player: {
      age: 50,
      name: 'slice',
      gender: 'male',
      martialPower: 70,
      externalSkill: 65,
      internalSkill: 60,
      qinggong: 55,
      chivalry: 55,
      constitution: 50,
      comprehension: 55,
      sect: null,
      title: null,
      reputation: 55,
      money: 800,
      knowledge: 45,
      charisma: 50,
      businessAcumen: 35,
      influence: 50,
      connections: 45,
      martialHeritage: 30,
      scholarlyHeritage: 10,
      merchantNetwork: 10,
      children: 0,
      spouse: null,
      flags: {},
      alive: true,
    },
    flags: {},
    achievements: [],
  } as GameState;
}

export interface ContinuityComparisonSliceResult {
  slice: 'legacy_continuity_comparison';
  cases: Array<{
    caseId: string;
    description: string;
    successionQualityScore: number;
    combinedMultiplier: number;
    riskMultiplier: number;
    activeLegacyOutcomes: string[];
    materiallyDifferent: boolean;
  }>;
  cultivationChangesStability: boolean;
}

export interface InheritedBurdenComparisonSliceResult {
  slice: 'inherited_burden_comparison';
  withBurden: { successionQualityScore: number; riskMultiplier: number; outcomes: string[] };
  withoutBurden: { successionQualityScore: number; riskMultiplier: number; outcomes: string[] };
  burdenAltersOutcomeSpace: boolean;
}

export interface UnderinvestmentComparisonSliceResult {
  slice: 'underinvestment_vs_achievement';
  highAchievementWeakLegacy: {
    successionQualityScore: number;
    combinedMultiplier: number;
    unmetPressureCount: number;
  };
  strongCultivation: {
    successionQualityScore: number;
    combinedMultiplier: number;
    unmetPressureCount: number;
  };
  underinvestmentWeakerThanAchievementSuggests: boolean;
}

export function runContinuityComparisonSlice(): ContinuityComparisonSliceResult {
  const baseline = baseLateLifeState();
  const baselineReport = buildLaterLifeLegacyReport(baseline, new Set(['legacy']), 50);

  const invested = baseLateLifeState();
  invested.flags = {
    martial_transmission: true,
    disciple_training_active: true,
    has_disciples: true,
  };
  invested.player!.flags = { ...invested.flags };
  invested.player!.martialHeritage = 75;
  invested.player!.money = 2000;
  invested.player!.connections = 65;
  invested.lifePath = {
    primaryIdentity: 'martial',
    faction: 'neutral',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: [], mentors: [], disciples: ['a', 'b'] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
  };
  const investedReport = buildLaterLifeLegacyReport(invested, new Set(['legacy', 'continuity']), 50);

  const neglected = baseLateLifeState();
  neglected.flags = { has_disciples: true, has_child: true };
  neglected.player!.flags = { has_disciples: true, has_child: true };
  neglected.player!.martialPower = 95;
  neglected.player!.reputation = 90;
  neglected.player!.money = 30;
  neglected.lifePath = {
    primaryIdentity: 'martial',
    faction: 'neutral',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: [], mentors: [], disciples: ['x', 'y', 'z'] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
  };
  const neglectedReport = buildLaterLifeLegacyReport(neglected, new Set(['legacy', 'decline']), 50);

  const cases = [
    {
      caseId: 'baseline',
      description: 'No successor cultivation signals',
      successionQualityScore: baselineReport.successionQualityScore,
      combinedMultiplier: baselineReport.combinedMultiplier,
      riskMultiplier: baselineReport.riskMultiplier,
      activeLegacyOutcomes: baselineReport.activeLegacyOutcomes,
      materiallyDifferent: false,
    },
    {
      caseId: 'invested_transmission',
      description: 'Disciple cultivation + martial transmission',
      successionQualityScore: investedReport.successionQualityScore,
      combinedMultiplier: investedReport.combinedMultiplier,
      riskMultiplier: investedReport.riskMultiplier,
      activeLegacyOutcomes: investedReport.activeLegacyOutcomes,
      materiallyDifferent:
        investedReport.successionQualityScore > baselineReport.successionQualityScore + 0.15,
    },
    {
      caseId: 'neglected_disciples',
      description: 'High personal stats but unmet cultivation pressure',
      successionQualityScore: neglectedReport.successionQualityScore,
      combinedMultiplier: neglectedReport.combinedMultiplier,
      riskMultiplier: neglectedReport.riskMultiplier,
      activeLegacyOutcomes: neglectedReport.activeLegacyOutcomes,
      materiallyDifferent:
        neglectedReport.unmetCultivationPressure.length > 0 &&
        neglectedReport.riskMultiplier > baselineReport.riskMultiplier,
    },
  ];

  return {
    slice: 'legacy_continuity_comparison',
    cases,
    cultivationChangesStability: cases.some(c => c.materiallyDifferent),
  };
}

export function runInheritedBurdenComparisonSlice(): InheritedBurdenComparisonSliceResult {
  const without = baseLateLifeState();
  without.flags = { martial_transmission: true };
  without.player!.flags = { martial_transmission: true };
  without.player!.martialHeritage = 70;
  const withoutReport = buildLaterLifeLegacyReport(without, new Set(['legacy', 'feud']), 52);

  const withBurdenState = baseLateLifeState();
  withBurdenState.flags = { martial_transmission: true, inherited_vendetta: true, sect_heir: true };
  withBurdenState.player!.flags = {
    martial_transmission: true,
    inherited_vendetta: true,
    sect_heir: true,
  };
  withBurdenState.player!.martialHeritage = 25;
  withBurdenState.lifePath = {
    primaryIdentity: 'none',
    faction: 'neutral',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: [], mentors: [], disciples: [] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['nemesis'] },
    focus: { martial: 0, business: 0, academic: 0, leadership: 0 },
  };
  const withReport = buildLaterLifeLegacyReport(withBurdenState, new Set(['legacy', 'feud', 'obligation']), 52);

  return {
    slice: 'inherited_burden_comparison',
    withBurden: {
      successionQualityScore: withReport.successionQualityScore,
      riskMultiplier: withReport.riskMultiplier,
      outcomes: withReport.activeLegacyOutcomes,
    },
    withoutBurden: {
      successionQualityScore: withoutReport.successionQualityScore,
      riskMultiplier: withoutReport.riskMultiplier,
      outcomes: withoutReport.activeLegacyOutcomes,
    },
    burdenAltersOutcomeSpace:
      withReport.riskMultiplier > withoutReport.riskMultiplier + 0.05 ||
      withReport.successionQualityScore < withoutReport.successionQualityScore - 0.1,
  };
}

export function runUnderinvestmentComparisonSlice(): UnderinvestmentComparisonSliceResult {
  const highAchievement = baseLateLifeState();
  highAchievement.flags = { has_disciples: true, hero_rep_mantle: true };
  highAchievement.player!.flags = { has_disciples: true, hero_rep_mantle: true };
  highAchievement.player!.martialPower = 95;
  highAchievement.player!.reputation = 92;
  highAchievement.player!.martialHeritage = 10;
  highAchievement.player!.money = 40;
  highAchievement.lifePath = {
    primaryIdentity: 'hero',
    faction: 'neutral',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1', 'd2'] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
  };
  const weakLegacyReport = buildLaterLifeLegacyReport(
    highAchievement,
    new Set(['legacy', 'prestige']),
    55,
  );

  const strongCultivation = baseLateLifeState();
  strongCultivation.flags = {
    martial_transmission: true,
    disciple_training_active: true,
    inheritance_legacy_complete: true,
    has_disciples: true,
  };
  strongCultivation.player!.flags = { ...strongCultivation.flags };
  strongCultivation.player!.martialHeritage = 80;
  strongCultivation.player!.money = 2200;
  strongCultivation.player!.martialPower = 88;
  strongCultivation.lifePath = {
    primaryIdentity: 'martial',
    faction: 'neutral',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1', 'd2', 'd3'] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
  };
  const strongReport = buildLaterLifeLegacyReport(
    strongCultivation,
    new Set(['legacy', 'continuity']),
    55,
  );

  return {
    slice: 'underinvestment_vs_achievement',
    highAchievementWeakLegacy: {
      successionQualityScore: weakLegacyReport.successionQualityScore,
      combinedMultiplier: weakLegacyReport.combinedMultiplier,
      unmetPressureCount: weakLegacyReport.unmetCultivationPressure.length,
    },
    strongCultivation: {
      successionQualityScore: strongReport.successionQualityScore,
      combinedMultiplier: strongReport.combinedMultiplier,
      unmetPressureCount: strongReport.unmetCultivationPressure.length,
    },
    underinvestmentWeakerThanAchievementSuggests:
      weakLegacyReport.successionQualityScore < strongReport.successionQualityScore - 0.15 &&
      weakLegacyReport.unmetCultivationPressure.length > strongReport.unmetCultivationPressure.length,
  };
}

export function profileHasP18Sections(): boolean {
  const profile = getWorldProfile();
  return (
    (profile.successorRoleConfigs?.length ?? 0) >= 4 &&
    (profile.inheritanceChannelPatterns?.length ?? 0) >= 6
  );
}
