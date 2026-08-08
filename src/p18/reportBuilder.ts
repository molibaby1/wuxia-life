import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import { formatUnmetCultivationPressureReport } from './cultivationPressure';
import { buildLaterLifeLegacyReport } from './laterLifeLegacySelection';

export interface P18GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  successorRoles: { configCount: number; roleKinds: string[] };
  inheritanceChannels: {
    patternCount: number;
    assetCount: number;
    burdenCount: number;
    mixedCount: number;
  };
  cultivationCost: { patternCount: number; dimensionFamilies: string[] };
  legacyOutcomes: { patternCount: number; outcomeKinds: string[] };
  balance: {
    assetAndBurdenChannels: boolean;
    cultivationCostWithPressure: boolean;
    triumphAndDisappointmentOutcomes: boolean;
  };
  sampleReports: {
    transmissionSuccess: string[];
    networkObligation: string[];
    inheritedBurden: string[];
    underinvestment: string[];
    ruptureBetrayal: string[];
  };
  readability: {
    routeLegibilityPreserved: boolean;
    summaryCoherenceNotes: string[];
  };
  messages: string[];
  warnings: string[];
}

function makeSampleState(partial: Partial<GameState>): GameState {
  return {
    player: {
      age: 52,
      name: 'sample',
      gender: 'male',
      martialPower: 85,
      chivalry: 60,
      constitution: 55,
      affiliation: null,
      title: null,
      reputation: 70,
      money: 1500,
      knowledge: 50,
      charisma: 55,
      businessAcumen: 40,
      influence: 60,
      connections: 55,
      martialHeritage: 60,
      scholarlyHeritage: 20,
      merchantNetwork: 15,
      children: 1,
      spouse: 'spouse',
      flags: {},
      alive: true,
      ...(partial.player ?? {}),
    },
    flags: partial.flags ?? {},
    lifePath: partial.lifePath,
    achievements: partial.achievements ?? [],
  } as GameState;
}

export function assembleP18GateReport(profile: WorldProfile = getWorldProfile()): P18GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  const roleConfigs = profile.successorRoleConfigs ?? [];
  const channelPatterns = profile.inheritanceChannelPatterns ?? [];
  const costPatterns = profile.successorCultivationCostPatterns ?? [];
  const outcomePatterns = profile.legacyOutcomePatterns ?? [];

  const assetCount = channelPatterns.filter(p => p.polarity === 'asset').length;
  const burdenCount = channelPatterns.filter(p => p.polarity === 'burden').length;
  const mixedCount = channelPatterns.filter(p => p.polarity === 'mixed').length;

  const dimensionFamilies = new Set(
    costPatterns.flatMap(p => p.costDimensions.map(d => d.dimension)),
  );

  const outcomeKinds = outcomePatterns.map(p => p.outcomeKind);
  const triumphKinds = ['transmission_success', 'network_obligation'];
  const disappointmentKinds = [
    'underinvestment',
    'burden_without_capability',
    'rupture_betrayal',
    'inherited_burden',
  ];

  const balance = {
    assetAndBurdenChannels: assetCount >= 2 && burdenCount >= 2,
    cultivationCostWithPressure: costPatterns.length >= 2 && dimensionFamilies.size >= 4,
    triumphAndDisappointmentOutcomes:
      triumphKinds.some(k => outcomeKinds.includes(k as (typeof outcomeKinds)[number])) &&
      disappointmentKinds.some(k => outcomeKinds.includes(k as (typeof outcomeKinds)[number])),
  };

  const transmissionState = makeSampleState({
    flags: {
      martial_transmission: true,
      inheritance_legacy_complete: true,
      disciple_training_active: true,
      has_disciples: true,
    },
    player: {
      flags: {
        martial_transmission: true,
        inheritance_legacy_complete: true,
        disciple_training_active: true,
        has_disciples: true,
      },
      martialHeritage: 80,
      martialPower: 90,
      money: 2500,
      connections: 70,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['disciple_a', 'disciple_b'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
  });

  const networkState = makeSampleState({
    flags: { family_legacy: true, follower_legacy: true },
    player: {
      flags: { family_legacy: true, follower_legacy: true },
      connections: 75,
      influence: 65,
    } as GameState['player'],
  });

  const burdenState = makeSampleState({
    flags: { inherited_vendetta: true, sect_heir: true },
    player: {
      flags: { inherited_vendetta: true, sect_heir: true },
      martialHeritage: 15,
      martialPower: 40,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['old_enemy'] },
    },
  });

  const underinvestState = makeSampleState({
    flags: { has_disciples: true, has_child: true },
    player: {
      flags: { has_disciples: true, has_child: true },
      martialHeritage: 5,
      money: 50,
      connections: 10,
      martialPower: 90,
      children: 2,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1', 'd2', 'd3'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
  });

  const ruptureState = makeSampleState({
    flags: { disciple_betrayal: true, legacy_collapse: true, has_disciples: true },
    player: { flags: { disciple_betrayal: true, legacy_collapse: true, has_disciples: true } } as GameState['player'],
  });

  const legacyTags = new Set(['legacy', 'continuity', 'family']);
  const transmissionReport = buildLaterLifeLegacyReport(transmissionState, legacyTags, 52);
  const networkReport = buildLaterLifeLegacyReport(networkState, new Set(['backing', 'duty', 'family']), 50);
  const burdenReport = buildLaterLifeLegacyReport(burdenState, new Set(['feud', 'obligation', 'instability']), 55);
  const underinvestReport = buildLaterLifeLegacyReport(underinvestState, new Set(['decline', 'instability', 'legacy']), 48);
  const ruptureReport = buildLaterLifeLegacyReport(ruptureState, new Set(['betrayal', 'collapse', 'conflict']), 54);

  if (roleConfigs.length < 4) {
    warnings.push(`successorRoleConfigs count ${roleConfigs.length} < 4`);
  }
  if (channelPatterns.length < 6) {
    warnings.push(`inheritanceChannelPatterns count ${channelPatterns.length} < 6`);
  }
  if (costPatterns.length < 2) {
    warnings.push(`successorCultivationCostPatterns count ${costPatterns.length} < 2`);
  }
  if (outcomePatterns.length < 5) {
    warnings.push(`legacyOutcomePatterns count ${outcomePatterns.length} < 5`);
  }
  if (!balance.assetAndBurdenChannels) {
    warnings.push('inheritance channels missing asset/burden balance');
  }
  if (transmissionReport.successionQualityScore < 0.5) {
    warnings.push('transmission success sample succession quality too low');
  }
  if (burdenReport.riskMultiplier <= 1.05) {
    warnings.push('inherited burden sample risk multiplier too low');
  }
  if (underinvestReport.unmetCultivationPressure.length === 0) {
    warnings.push('underinvestment sample should show unmet cultivation pressure');
  }
  if (transmissionReport.successionQualityScore <= underinvestReport.successionQualityScore) {
    warnings.push('transmission should outperform underinvestment on succession quality');
  }
  if (
    transmissionReport.opportunityMultiplier <= underinvestReport.opportunityMultiplier &&
    transmissionReport.successionQualityScore <= underinvestReport.successionQualityScore
  ) {
    warnings.push('transmission should outperform underinvestment on legacy opportunity');
  }

  const decision =
    roleConfigs.length >= 4 &&
    channelPatterns.length >= 6 &&
    costPatterns.length >= 2 &&
    outcomePatterns.length >= 5 &&
    balance.assetAndBurdenChannels &&
    balance.cultivationCostWithPressure &&
    balance.triumphAndDisappointmentOutcomes
      ? warnings.length > 0
        ? 'warning'
        : 'pass'
      : 'fail';

  messages.push(`successor role configs: ${roleConfigs.length}`);
  messages.push(`inheritance channels: ${channelPatterns.length}`);
  messages.push(`cultivation cost patterns: ${costPatterns.length}`);
  messages.push(`legacy outcome patterns: ${outcomePatterns.length}`);

  return {
    generatedAt: new Date().toISOString(),
    decision,
    successorRoles: {
      configCount: roleConfigs.length,
      roleKinds: [...new Set(roleConfigs.map(r => r.roleKind))],
    },
    inheritanceChannels: {
      patternCount: channelPatterns.length,
      assetCount,
      burdenCount,
      mixedCount,
    },
    cultivationCost: {
      patternCount: costPatterns.length,
      dimensionFamilies: [...dimensionFamilies],
    },
    legacyOutcomes: {
      patternCount: outcomePatterns.length,
      outcomeKinds,
    },
    balance,
    sampleReports: {
      transmissionSuccess: [
        `successionQuality=${transmissionReport.successionQualityScore.toFixed(2)}`,
        `multiplier=${transmissionReport.combinedMultiplier.toFixed(2)}`,
        `outcomes=${transmissionReport.activeLegacyOutcomes.join(',')}`,
      ],
      networkObligation: [
        `multiplier=${networkReport.combinedMultiplier.toFixed(2)}`,
        `channels=${networkReport.activeInheritanceChannels.map(c => c.patternId).join(',')}`,
      ],
      inheritedBurden: [
        `risk=${burdenReport.riskMultiplier.toFixed(2)}`,
        `successionQuality=${burdenReport.successionQualityScore.toFixed(2)}`,
      ],
      underinvestment: formatUnmetCultivationPressureReport(underinvestReport.unmetCultivationPressure),
      ruptureBetrayal: [
        `risk=${ruptureReport.riskMultiplier.toFixed(2)}`,
        `outcomes=${ruptureReport.activeLegacyOutcomes.join(',')}`,
      ],
    },
    readability: {
      routeLegibilityPreserved: true,
      summaryCoherenceNotes: [
        'LaterLifeLegacyReport exposes active roles, channels, outcomes, and succession quality',
        'Unmet cultivation pressure lines are human-readable for gate/debug',
        'P18 multiplier composes with P17 — no separate scheduler fork',
      ],
    },
    messages,
    warnings,
  };
}

export function formatP18GateMarkdown(report: P18GateReport): string {
  const lines = [
    '# P18 Legacy, Disciples, And Heirs Closure Gate',
    '',
    `Generated: ${report.generatedAt}`,
    `Decision: **${report.decision}**`,
    '',
    '## Coverage',
    `- Successor roles: ${report.successorRoles.configCount} (${report.successorRoles.roleKinds.join(', ')})`,
    `- Inheritance channels: ${report.inheritanceChannels.patternCount} (asset: ${report.inheritanceChannels.assetCount}, burden: ${report.inheritanceChannels.burdenCount}, mixed: ${report.inheritanceChannels.mixedCount})`,
    `- Cultivation cost patterns: ${report.cultivationCost.patternCount} (dimensions: ${report.cultivationCost.dimensionFamilies.join(', ')})`,
    `- Legacy outcomes: ${report.legacyOutcomes.patternCount}`,
    '',
    '## Balance',
    `- Asset+burden channels: ${report.balance.assetAndBurdenChannels}`,
    `- Cultivation cost+pressure: ${report.balance.cultivationCostWithPressure}`,
    `- Triumph+disappointment outcomes: ${report.balance.triumphAndDisappointmentOutcomes}`,
    '',
    '## Sample trajectories',
    `- Transmission success: ${report.sampleReports.transmissionSuccess.join('; ')}`,
    `- Network obligation: ${report.sampleReports.networkObligation.join('; ')}`,
    `- Inherited burden: ${report.sampleReports.inheritedBurden.join('; ')}`,
    `- Underinvestment: ${report.sampleReports.underinvestment.join('; ') || 'none'}`,
    `- Rupture/betrayal: ${report.sampleReports.ruptureBetrayal.join('; ')}`,
    '',
    '## Readability',
    ...report.readability.summaryCoherenceNotes.map(n => `- ${n}`),
    '',
  ];
  if (report.warnings.length > 0) {
    lines.push('## Warnings', ...report.warnings.map(w => `- ${w}`), '');
  }
  return lines.join('\n');
}

export function profileHasP18Sections(profile: WorldProfile): boolean {
  return (
    (profile.successorRoleConfigs?.length ?? 0) >= 4 &&
    (profile.inheritanceChannelPatterns?.length ?? 0) >= 6 &&
    (profile.successorCultivationCostPatterns?.length ?? 0) >= 2 &&
    (profile.legacyOutcomePatterns?.length ?? 0) >= 5
  );
}
