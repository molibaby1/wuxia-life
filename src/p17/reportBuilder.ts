import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import { formatUnmetPressureReport } from './achievementMaintenance';
import { buildLaterLifeConsequenceReport } from './laterLifeSelection';

export interface P17GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  relationship: {
    patternCount: number;
    upsideKinds: string[];
    burdenKinds: string[];
  };
  factionIdentity: {
    patternCount: number;
    organizationCount: number;
    socialStatusCount: number;
  };
  achievementMaintenance: {
    patternCount: number;
    dimensionFamilies: string[];
  };
  balance: {
    relationshipUpsideAndBurden: boolean;
    factionProtectionAndDuty: boolean;
    achievementPrestigeAndUpkeep: boolean;
  };
  sampleReports: {
    swornAlly: string[];
    feudEnemy: string[];
    orthodoxDuty: string[];
    neglectedHero: string[];
  };
  messages: string[];
  warnings: string[];
}

function makeSampleState(partial: Partial<GameState>): GameState {
  return {
    player: {
      age: 35,
      name: 'sample',
      gender: 'male',
      martialPower: 40,
      chivalry: 50,
      constitution: 50,
      affiliation: null,
      title: null,
      reputation: 30,
      knowledge: 30,
      charisma: 40,
      businessAcumen: 30,
      influence: 25,
      connections: 20,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      flags: {},
      alive: true,
      ...(partial.player ?? {}),
    },
    flags: partial.flags ?? {},
    lifePath: partial.lifePath,
    achievements: partial.achievements ?? [],
  } as GameState;
}

export function assembleP17GateReport(
  profile: WorldProfile = getWorldProfile(),
): P17GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  const relationshipPatterns = profile.relationshipConsequencePatterns ?? [];
  const factionPatterns = profile.factionIdentityConsequencePatterns ?? [];
  const maintenancePatterns = profile.achievementMaintenancePatterns ?? [];

  const upsideKinds = new Set(
    relationshipPatterns
      .filter(p => ['support', 'social_shielding'].includes(p.consequenceKind))
      .map(p => p.consequenceKind),
  );
  const burdenKinds = new Set(
    relationshipPatterns
      .filter(p => ['obligation', 'entanglement', 'feud', 'betrayal_risk'].includes(p.consequenceKind))
      .map(p => p.consequenceKind),
  );

  const organizationCount = factionPatterns.filter(p => p.layer === 'organization').length;
  const socialStatusCount = factionPatterns.filter(p => p.layer === 'social_status').length;

  const dimensionFamilies = new Set(
    maintenancePatterns.flatMap(p => p.dimensions.map(d => d.dimension)),
  );

  const balance = {
    relationshipUpsideAndBurden: upsideKinds.size > 0 && burdenKinds.size > 0,
    factionProtectionAndDuty:
      factionPatterns.some(p => ['protection', 'access'].includes(p.consequenceKind)) &&
      factionPatterns.some(p => ['duty', 'exposure', 'rivalry', 'political_cost'].includes(p.consequenceKind)),
    achievementPrestigeAndUpkeep: maintenancePatterns.length >= 3 && dimensionFamilies.size >= 2,
  };

  const swornState = makeSampleState({
    flags: { has_sworn_siblings: true },
    player: { flags: { has_sworn_siblings: true } } as GameState['player'],
  });
  const feudState = makeSampleState({
    lifePath: {
      faction: 'neutral',
      lifeStage: 'growth',
      achievements: [],
      relationships: { allies: [], enemies: ['rival_mo'], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['rival_mo'] },
    },
  });
  const orthodoxState = makeSampleState({
    flags: { orthodox_member: true, sect_master: true },
    player: {
      flags: { orthodox_member: true, sect_master: true },
      reputation: 60,
      influence: 55,
    } as GameState['player'],
  });
  const neglectedHeroState = makeSampleState({
    flags: { hero_rep_mantle: true },
    player: {
      flags: { hero_rep_mantle: true },
      reputation: 15,
      martialPower: 20,
      influence: 10,
    } as GameState['player'],
  });

  const conflictTags = new Set(['conflict', 'feud']);
  const dutyTags = new Set(['duty', 'sect', 'political']);
  const declineTags = new Set(['decline', 'backlash']);

  const swornReport = buildLaterLifeConsequenceReport(swornState, new Set(['rescue', 'relationship']), 35);
  const feudReport = buildLaterLifeConsequenceReport(feudState, conflictTags, 35);
  const orthodoxReport = buildLaterLifeConsequenceReport(orthodoxState, dutyTags, 35);
  const neglectedReport = buildLaterLifeConsequenceReport(neglectedHeroState, declineTags, 35);

  if (relationshipPatterns.length < 3) {
    warnings.push(`relationshipConsequencePatterns count ${relationshipPatterns.length} < 3`);
  }
  if (factionPatterns.length < 3) {
    warnings.push(`factionIdentityConsequencePatterns count ${factionPatterns.length} < 3`);
  }
  if (maintenancePatterns.length < 3) {
    warnings.push(`achievementMaintenancePatterns count ${maintenancePatterns.length} < 3`);
  }
  if (!balance.relationshipUpsideAndBurden) {
    warnings.push('relationship patterns missing upside/burden balance');
  }
  if (!balance.factionProtectionAndDuty) {
    warnings.push('faction patterns missing protection/duty balance');
  }
  if (swornReport.combinedMultiplier <= 1.05) {
    warnings.push('sworn ally sample multiplier too low');
  }
  if (feudReport.riskMultiplier <= 1.05) {
    warnings.push('feud enemy sample risk multiplier too low');
  }
  if (neglectedReport.unmetMaintenance.length === 0) {
    warnings.push('neglected hero sample should show unmet maintenance');
  }

  const decision =
    relationshipPatterns.length >= 3 &&
    factionPatterns.length >= 3 &&
    maintenancePatterns.length >= 3 &&
    balance.relationshipUpsideAndBurden &&
    balance.factionProtectionAndDuty
      ? warnings.length > 0
        ? 'warning'
        : 'pass'
      : 'fail';

  messages.push(`relationship patterns: ${relationshipPatterns.length}`);
  messages.push(`faction/identity patterns: ${factionPatterns.length}`);
  messages.push(`maintenance patterns: ${maintenancePatterns.length}`);

  return {
    generatedAt: new Date().toISOString(),
    decision,
    relationship: {
      patternCount: relationshipPatterns.length,
      upsideKinds: [...upsideKinds],
      burdenKinds: [...burdenKinds],
    },
    factionIdentity: {
      patternCount: factionPatterns.length,
      organizationCount,
      socialStatusCount,
    },
    achievementMaintenance: {
      patternCount: maintenancePatterns.length,
      dimensionFamilies: [...dimensionFamilies],
    },
    balance,
    sampleReports: {
      swornAlly: [
        `multiplier=${swornReport.combinedMultiplier.toFixed(2)}`,
        `patterns=${swornReport.activeRelationshipPatterns.map(p => p.patternId).join(',')}`,
      ],
      feudEnemy: [
        `risk=${feudReport.riskMultiplier.toFixed(2)}`,
        `patterns=${feudReport.activeRelationshipPatterns.map(p => p.patternId).join(',')}`,
      ],
      orthodoxDuty: [
        `risk=${orthodoxReport.riskMultiplier.toFixed(2)}`,
        `patterns=${orthodoxReport.activeFactionPatterns.map(p => p.patternId).join(',')}`,
      ],
      neglectedHero: formatUnmetPressureReport(neglectedReport.unmetMaintenance),
    },
    messages,
    warnings,
  };
}

export function formatP17GateMarkdown(report: P17GateReport): string {
  const lines = [
    '# P17 Mid-Late-Life Consequence Gate',
    '',
    `Generated: ${report.generatedAt}`,
    `Decision: **${report.decision}**`,
    '',
    '## Coverage',
    `- Relationship patterns: ${report.relationship.patternCount} (upside: ${report.relationship.upsideKinds.join(', ') || 'none'}; burden: ${report.relationship.burdenKinds.join(', ') || 'none'})`,
    `- Faction/identity patterns: ${report.factionIdentity.patternCount} (org: ${report.factionIdentity.organizationCount}, status: ${report.factionIdentity.socialStatusCount})`,
    `- Achievement maintenance: ${report.achievementMaintenance.patternCount} (dimensions: ${report.achievementMaintenance.dimensionFamilies.join(', ')})`,
    '',
    '## Balance',
    `- Relationship upside+burden: ${report.balance.relationshipUpsideAndBurden}`,
    `- Faction protection+duty: ${report.balance.factionProtectionAndDuty}`,
    `- Achievement prestige+upkeep: ${report.balance.achievementPrestigeAndUpkeep}`,
    '',
    '## Sample trajectories',
    `- Sworn ally: ${report.sampleReports.swornAlly.join('; ')}`,
    `- Feud enemy: ${report.sampleReports.feudEnemy.join('; ')}`,
    `- Orthodox duty: ${report.sampleReports.orthodoxDuty.join('; ')}`,
    `- Neglected hero upkeep: ${report.sampleReports.neglectedHero.join('; ') || 'none'}`,
    '',
  ];
  if (report.warnings.length > 0) {
    lines.push('## Warnings', ...report.warnings.map(w => `- ${w}`), '');
  }
  return lines.join('\n');
}

export function profileHasP17Sections(profile: WorldProfile): boolean {
  return (
    (profile.relationshipConsequencePatterns?.length ?? 0) >= 3 &&
    (profile.factionIdentityConsequencePatterns?.length ?? 0) >= 3 &&
    (profile.achievementMaintenancePatterns?.length ?? 0) >= 3
  );
}
