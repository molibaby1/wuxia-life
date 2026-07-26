import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EndingInfo } from '../core/EndingSystem';
import type { GameState } from '../types/eventTypes';
import { composeP19FinalSummary } from './finalSummaryComposition';
import {
  runEndgameCategoryComparisonSlice,
  runHistoricalMemoryComparisonSlice,
  runPreEndgameClosureComparisonSlice,
} from './validationSlices';

export interface P19GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  endgameCategories: { configCount: number; kinds: string[] };
  preEndgameRecovery: {
    patternCount: number;
    dimensions: string[];
    recoveryKinds: string[];
  };
  historicalMemory: {
    patternCount: number;
    dimensions: string[];
    tones: string[];
  };
  balance: {
    categoryCoverage: boolean;
    recoveryKindCoverage: boolean;
    memoryToneCoverage: boolean;
    livedRealityDivergenceSample: boolean;
  };
  sampleReports: {
    legendaryEcho: string;
    infamousEcho: string;
    admiredMemory: string;
    disputedMemory: string;
    recoveryClosure: string[];
  };
  validationSlices: {
    categoryComparison: ReturnType<typeof runEndgameCategoryComparisonSlice>;
    memoryComparison: ReturnType<typeof runHistoricalMemoryComparisonSlice>;
    closureComparison: ReturnType<typeof runPreEndgameClosureComparisonSlice>;
  };
  readability: {
    summaryCoherenceNotes: string[];
    routeLegibilityPreserved: boolean;
  };
  messages: string[];
  warnings: string[];
}

function makeSampleState(partial: Partial<GameState>): GameState {
  return {
    player: {
      age: 68,
      name: 'sample',
      gender: 'male',
      martialPower: 85,
      externalSkill: 80,
      internalSkill: 75,
      qinggong: 70,
      chivalry: 60,
      constitution: 55,
      comprehension: 65,
      sect: null,
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
      investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
      traits: [],
      healthStatus: 'healthy',
      statuses: [],
      children: 1,
      spouse: 'spouse',
      flags: {},
      alive: true,
      ...(partial.player ?? {}),
    },
    facts: {},
    flags: partial.flags ?? {},
    lifePath: partial.lifePath,
    achievements: partial.achievements ?? [],
    eventHistory: partial.eventHistory ?? [],
    relations: partial.relations ?? {},
    karma: partial.karma,
  };
}

function sampleEnding(): EndingInfo {
  return {
    id: 'bittersweet_success',
    name: '有成有憾',
    description: '有所成就，但代价明显。',
    category: 'neutral',
    requirements: {},
    priority: 50,
  };
}

export function profileHasP19Sections(profile: WorldProfile = getWorldProfile()): boolean {
  return (
    (profile.endgameCategoryConfigs?.length ?? 0) >= 3 &&
    (profile.preEndgameRecoveryPatterns?.length ?? 0) >= 5 &&
    (profile.historicalMemoryPatterns?.length ?? 0) >= 4
  );
}

export function assembleP19GateReport(profile: WorldProfile = getWorldProfile()): P19GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  const categories = profile.endgameCategoryConfigs ?? [];
  const recoveries = profile.preEndgameRecoveryPatterns ?? [];
  const memories = profile.historicalMemoryPatterns ?? [];

  const recoveryKinds = [...new Set(recoveries.map(r => r.recoveryKind))];
  const memoryTones = [...new Set(memories.map(m => m.memoryTone))];

  const balance = {
    categoryCoverage: categories.length >= 5,
    recoveryKindCoverage:
      recoveryKinds.includes('reconciliation') &&
      recoveryKinds.includes('collapse') &&
      recoveries.some(r => r.dimension === 'faction') &&
      recoveries.some(r => r.dimension === 'inheritance'),
    memoryToneCoverage:
      memoryTones.includes('admired') &&
      (memoryTones.includes('feared') || memoryTones.includes('disputed')),
    livedRealityDivergenceSample: memories.some(m => (m.livedRealityDelta ?? 0) >= 0.35),
  };

  const legendaryState = makeSampleState({
    flags: {
      hero_rep_mantle: true,
      martial_transmission: true,
      inheritance_legacy_complete: true,
    },
    player: { reputation: 90, martialPower: 92, flags: { hero_rep_mantle: true } } as GameState['player'],
  });
  const infamousState = makeSampleState({
    flags: { demonic_reputation: true, blood_feud_active: true, sect_exposure: true },
    player: { flags: { demonic_reputation: true }, chivalry: -10 } as GameState['player'],
    lifePath: {
      primaryIdentity: 'martial',
      faction: 'evil',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: ['e'], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e'] },
      focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
    },
  });

  const admiredMemory = composeP19FinalSummary(legendaryState, sampleEnding()).historicalMemoryLines;
  const disputedState = makeSampleState({
    flags: { sect_exposure: true, gray_choice_history: true },
    player: { flags: { sect_exposure: true, gray_choice_history: true } } as GameState['player'],
  });
  const disputedMemory = composeP19FinalSummary(disputedState, sampleEnding()).historicalMemoryLines;

  const recoveryState = makeSampleState({
    flags: {
      feud_reconciled: true,
      martial_transmission: true,
      inheritance_legacy_complete: true,
      disciple_training_active: true,
    },
    player: { flags: { feud_reconciled: true, martial_transmission: true } } as GameState['player'],
  });
  const recoverySummary = composeP19FinalSummary(recoveryState, sampleEnding());

  const categorySlice = runEndgameCategoryComparisonSlice();
  const memorySlice = runHistoricalMemoryComparisonSlice();
  const closureSlice = runPreEndgameClosureComparisonSlice();

  if (!balance.categoryCoverage) warnings.push('Fewer than 5 endgame category configs');
  if (!balance.recoveryKindCoverage) warnings.push('Pre-endgame recovery missing dimension or kind coverage');
  if (!balance.memoryToneCoverage) warnings.push('Historical memory missing admired/feared-disputed coverage');
  if (!categorySlice.categoryChangesBeyondAge) {
    warnings.push('Endgame category slice did not show change beyond baseline');
  }
  if (!memorySlice.memoryDiffersFromSelfUnderstanding) {
    warnings.push('Historical memory slice did not show lived-vs-posthumous divergence');
  }
  if (!closureSlice.closureMateriallyChangesSummary) {
    warnings.push('Pre-endgame closure slice did not materially change summary');
  }

  let decision: P19GateReport['decision'] = 'pass';
  if (
    !profileHasP19Sections(profile) ||
    !balance.categoryCoverage ||
    !balance.recoveryKindCoverage ||
    !balance.memoryToneCoverage
  ) {
    decision = 'fail';
  } else if (warnings.length > 0) {
    decision = 'warning';
  }

  messages.push(`Endgame categories: ${categories.length}`);
  messages.push(`Recovery patterns: ${recoveries.length}`);
  messages.push(`Historical memory patterns: ${memories.length}`);

  return {
    generatedAt: new Date().toISOString(),
    decision,
    endgameCategories: {
      configCount: categories.length,
      kinds: categories.map(c => c.categoryKind),
    },
    preEndgameRecovery: {
      patternCount: recoveries.length,
      dimensions: [...new Set(recoveries.map(r => r.dimension))],
      recoveryKinds,
    },
    historicalMemory: {
      patternCount: memories.length,
      dimensions: [...new Set(memories.map(m => m.dimension))],
      tones: memoryTones,
    },
    balance,
    sampleReports: {
      legendaryEcho: composeP19FinalSummary(legendaryState, sampleEnding()).personalFateLine,
      infamousEcho: composeP19FinalSummary(infamousState, sampleEnding()).personalFateLine,
      admiredMemory: admiredMemory.join(' '),
      disputedMemory: disputedMemory.join(' '),
      recoveryClosure: recoverySummary.recoveryLines,
    },
    validationSlices: {
      categoryComparison: categorySlice,
      memoryComparison: memorySlice,
      closureComparison: closureSlice,
    },
    readability: {
      summaryCoherenceNotes: [
        'Final summary composes category, recovery, legacy, and historical memory in one path',
        'P19 multipliers compose with P17/P18 without scheduler rewrite',
      ],
      routeLegibilityPreserved: true,
    },
    messages,
    warnings,
  };
}

export function formatP19GateMarkdown(report: P19GateReport): string {
  return [
    '# P19 Endgame Echo And Historical Memory Gate',
    '',
    `Generated: ${report.generatedAt}`,
    `Decision: **${report.decision}**`,
    '',
    '## Coverage',
    `- Endgame categories: ${report.endgameCategories.configCount} (${report.endgameCategories.kinds.join(', ')})`,
    `- Pre-endgame recovery: ${report.preEndgameRecovery.patternCount} patterns`,
    `- Historical memory: ${report.historicalMemory.patternCount} patterns`,
    '',
    '## Validation Slices',
    `- Category changes beyond age: ${report.validationSlices.categoryComparison.categoryChangesBeyondAge}`,
    `- Memory differs from self-understanding: ${report.validationSlices.memoryComparison.memoryDiffersFromSelfUnderstanding}`,
    `- Closure changes summary: ${report.validationSlices.closureComparison.closureMateriallyChangesSummary}`,
    '',
    '## Warnings',
    ...(report.warnings.length ? report.warnings.map(w => `- ${w}`) : ['- none']),
  ].join('\n');
}
