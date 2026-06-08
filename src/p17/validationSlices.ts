import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import { buildLaterLifeConsequenceReport } from './laterLifeSelection';

export interface MidLateLifeValidationSliceResult {
  slice: 'mid_late_life_consequences';
  cases: Array<{
    caseId: string;
    description: string;
    combinedMultiplier: number;
    riskMultiplier: number;
    opportunityMultiplier: number;
    activeRelationshipPatterns: string[];
    activeFactionPatterns: string[];
    unmetMaintenanceCount: number;
    materiallyDifferent: boolean;
  }>;
  allyChangesOpportunity: boolean;
  factionAddsDuty: boolean;
  achievementFragileWhenNeglected: boolean;
}

function baseMidLifeState(): GameState {
  return {
    player: {
      age: 35,
      name: 'slice',
      gender: 'male',
      martialPower: 50,
      externalSkill: 50,
      internalSkill: 50,
      qinggong: 50,
      chivalry: 50,
      constitution: 50,
      comprehension: 50,
      sect: null,
      title: null,
      reputation: 50,
      money: 500,
      knowledge: 40,
      charisma: 45,
      businessAcumen: 35,
      influence: 45,
      connections: 40,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      flags: {},
      alive: true,
    },
    flags: {},
    achievements: [],
  } as GameState;
}

export function runMidLateLifeValidationSlice(): MidLateLifeValidationSliceResult {
  const baseline = baseMidLifeState();
  const baselineReport = buildLaterLifeConsequenceReport(
    baseline,
    new Set(['relationship', 'faction']),
    35,
  );

  const swornAlly = baseMidLifeState();
  swornAlly.flags = { has_sworn_siblings: true };
  swornAlly.player!.flags = { has_sworn_siblings: true };
  const swornReport = buildLaterLifeConsequenceReport(
    swornAlly,
    new Set(['rescue', 'relationship']),
    35,
  );

  const feudEnemy = baseMidLifeState();
  feudEnemy.lifePath = {
    primaryIdentity: 'none',
    faction: 'neutral',
    lifeStage: 'growth',
    achievements: [],
    relationships: { allies: [], enemies: ['rival_mo'], mentors: [], disciples: [] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['rival_mo'] },
    focus: { martial: 0, business: 0, academic: 0, leadership: 0 },
  };
  const feudReport = buildLaterLifeConsequenceReport(
    feudEnemy,
    new Set(['conflict', 'feud']),
    35,
  );

  const orthodoxDuty = baseMidLifeState();
  orthodoxDuty.flags = { orthodox_member: true, sect_master: true };
  orthodoxDuty.player!.flags = { orthodox_member: true, sect_master: true };
  const orthodoxReport = buildLaterLifeConsequenceReport(
    orthodoxDuty,
    new Set(['duty', 'sect', 'political']),
    35,
  );

  const neglectedHero = baseMidLifeState();
  neglectedHero.flags = { hero_rep_mantle: true };
  neglectedHero.player!.flags = { hero_rep_mantle: true };
  neglectedHero.player!.reputation = 10;
  neglectedHero.player!.martialPower = 15;
  neglectedHero.player!.influence = 8;
  const neglectedReport = buildLaterLifeConsequenceReport(
    neglectedHero,
    new Set(['decline', 'backlash']),
    35,
  );

  const cases = [
    {
      caseId: 'baseline',
      description: 'No relationship/faction/achievement carryover',
      combinedMultiplier: baselineReport.combinedMultiplier,
      riskMultiplier: baselineReport.riskMultiplier,
      opportunityMultiplier: baselineReport.opportunityMultiplier,
      activeRelationshipPatterns: baselineReport.activeRelationshipPatterns.map(p => p.patternId),
      activeFactionPatterns: baselineReport.activeFactionPatterns.map(p => p.patternId),
      unmetMaintenanceCount: baselineReport.unmetMaintenance.length,
      materiallyDifferent: false,
    },
    {
      caseId: 'sworn_ally',
      description: 'Sworn sibling backing shifts opportunity space',
      combinedMultiplier: swornReport.combinedMultiplier,
      riskMultiplier: swornReport.riskMultiplier,
      opportunityMultiplier: swornReport.opportunityMultiplier,
      activeRelationshipPatterns: swornReport.activeRelationshipPatterns.map(p => p.patternId),
      activeFactionPatterns: swornReport.activeFactionPatterns.map(p => p.patternId),
      unmetMaintenanceCount: swornReport.unmetMaintenance.length,
      materiallyDifferent: swornReport.combinedMultiplier > baselineReport.combinedMultiplier + 0.08,
    },
    {
      caseId: 'feud_enemy',
      description: 'Sworn enemy raises conflict pressure',
      combinedMultiplier: feudReport.combinedMultiplier,
      riskMultiplier: feudReport.riskMultiplier,
      opportunityMultiplier: feudReport.opportunityMultiplier,
      activeRelationshipPatterns: feudReport.activeRelationshipPatterns.map(p => p.patternId),
      activeFactionPatterns: feudReport.activeFactionPatterns.map(p => p.patternId),
      unmetMaintenanceCount: feudReport.unmetMaintenance.length,
      materiallyDifferent: feudReport.riskMultiplier > baselineReport.riskMultiplier + 0.1,
    },
    {
      caseId: 'orthodox_duty',
      description: 'Orthodox sect master adds duty not just reward',
      combinedMultiplier: orthodoxReport.combinedMultiplier,
      riskMultiplier: orthodoxReport.riskMultiplier,
      opportunityMultiplier: orthodoxReport.opportunityMultiplier,
      activeRelationshipPatterns: orthodoxReport.activeRelationshipPatterns.map(p => p.patternId),
      activeFactionPatterns: orthodoxReport.activeFactionPatterns.map(p => p.patternId),
      unmetMaintenanceCount: orthodoxReport.unmetMaintenance.length,
      materiallyDifferent: orthodoxReport.riskMultiplier > swornReport.riskMultiplier,
    },
    {
      caseId: 'neglected_hero',
      description: 'Hero mantle fragile when reputation neglected',
      combinedMultiplier: neglectedReport.combinedMultiplier,
      riskMultiplier: neglectedReport.riskMultiplier,
      opportunityMultiplier: neglectedReport.opportunityMultiplier,
      activeRelationshipPatterns: neglectedReport.activeRelationshipPatterns.map(p => p.patternId),
      activeFactionPatterns: neglectedReport.activeFactionPatterns.map(p => p.patternId),
      unmetMaintenanceCount: neglectedReport.unmetMaintenance.length,
      materiallyDifferent: neglectedReport.unmetMaintenance.length > 0 && neglectedReport.riskMultiplier > 1.1,
    },
  ];

  return {
    slice: 'mid_late_life_consequences',
    cases,
    allyChangesOpportunity: cases.find(c => c.caseId === 'sworn_ally')?.materiallyDifferent ?? false,
    factionAddsDuty: cases.find(c => c.caseId === 'orthodox_duty')?.materiallyDifferent ?? false,
    achievementFragileWhenNeglected:
      cases.find(c => c.caseId === 'neglected_hero')?.materiallyDifferent ?? false,
  };
}

export function profileHasP17Sections(): boolean {
  const profile = getWorldProfile();
  return (
    (profile.relationshipConsequencePatterns?.length ?? 0) >= 3 &&
    (profile.factionIdentityConsequencePatterns?.length ?? 0) >= 3 &&
    (profile.achievementMaintenancePatterns?.length ?? 0) >= 3
  );
}
