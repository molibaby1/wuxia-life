/**
 * P19 endgame echo and historical memory closure tests.
 */

import { EndingSystem } from '../src/core/EndingSystem';
import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  P19_CATEGORY_INFAMOUS_ECHO,
  P19_CATEGORY_LEGENDARY_ECHO,
  P19_MEMORY_ADMIRED_HERO,
  P19_RECOVERY_FACTION_PROTECTION,
  P19_RECOVERY_LEGACY_CONTINUITY,
  P19_RECOVERY_RELATIONSHIP_RECONCILIATION,
} from '../src/narrative/profile/wuxiaEndgameSurfaces';
import { buildEndgameCategoryReport, selectEndgameCategory } from '../src/p19/endgameCategories';
import { composeP19FinalSummary } from '../src/p19/finalSummaryComposition';
import { buildHistoricalMemoryReport } from '../src/p19/historicalMemory';
import {
  buildPreEndgameRecoveryReport,
  resolveActivePreEndgameRecoveries,
} from '../src/p19/preEndgameRecovery';
import { assembleP19GateReport, profileHasP19Sections } from '../src/p19/reportBuilder';
import {
  runEndgameCategoryComparisonSlice,
  runHistoricalMemoryComparisonSlice,
  runPreEndgameClosureComparisonSlice,
} from '../src/p19/validationSlices';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: {
      age: 68,
      name: 't',
      gender: 'male',
      martialPower: 80,
      chivalry: 55,
      constitution: 50,
      comprehension: 60,
      affiliation: null,
      title: null,
      reputation: 65,
      money: 1200,
      knowledge: 45,
      charisma: 50,
      businessAcumen: 35,
      influence: 55,
      connections: 50,
      martialHeritage: 40,
      scholarlyHeritage: 15,
      merchantNetwork: 10,
      children: 0,
      spouse: null,
      flags: {},
      alive: true,
      ...(overrides.player ?? {}),
    },
    flags: overrides.flags ?? {},
    lifePath: overrides.lifePath,
    achievements: overrides.achievements ?? [],
    karma: overrides.karma,
  } as GameState;
}

function testProfileSchema(): void {
  const profile = getWorldProfile();
  assert(profileHasP19Sections(profile), 'P19 profile sections present');
  assert((profile.endgameCategoryConfigs?.length ?? 0) >= 5, 'endgame categories');
  assert((profile.preEndgameRecoveryPatterns?.length ?? 0) >= 7, 'recovery patterns');
  assert((profile.historicalMemoryPatterns?.length ?? 0) >= 6, 'memory patterns');
  assert(
    WUXIA_WORLD_PROFILE.endgameCategoryConfigs?.some(c => c.id === P19_CATEGORY_LEGENDARY_ECHO.id),
    'legendary category',
  );
  assert(
    WUXIA_WORLD_PROFILE.preEndgameRecoveryPatterns?.some(
      p => p.id === P19_RECOVERY_RELATIONSHIP_RECONCILIATION.id,
    ),
    'relationship recovery',
  );
  assert(
    WUXIA_WORLD_PROFILE.historicalMemoryPatterns?.some(p => p.id === P19_MEMORY_ADMIRED_HERO.id),
    'admired memory',
  );
}

function testEndgameCategorySelection(): void {
  const legendary = makeState({
    flags: {
      hero_rep_mantle: true,
      martial_transmission: true,
      inheritance_legacy_complete: true,
    },
    player: {
      reputation: 90,
      martialPower: 92,
      martialHeritage: 75,
      flags: { hero_rep_mantle: true, martial_transmission: true },
    } as GameState['player'],
    lifePath: {
      faction: 'orthodox',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: ['a'], enemies: [], mentors: [], disciples: ['d1'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
  });
  const category = selectEndgameCategory(legendary);
  assert(category.kind === 'legendary_echo', `expected legendary_echo got ${category.kind}`);

  const infamous = makeState({
    flags: { demonic_reputation: true, blood_feud_active: true, sect_exposure: true },
    player: { flags: { demonic_reputation: true }, chivalry: -15 } as GameState['player'],
    karma: { good_karma: 0, evil_karma: 120 },
    lifePath: {
      faction: 'evil',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: ['e'], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e'] },
    },
  });
  const infamousCategory = selectEndgameCategory(infamous);
  assert(infamousCategory.kind === 'infamous_echo', `expected infamous_echo got ${infamousCategory.kind}`);
  assert(category.categoryId !== infamousCategory.categoryId, 'categories differ by trajectory');
}

function testPreEndgameRecoverySamples(): void {
  const reconciled = makeState({
    flags: { feud_reconciled: true, ally_reunion: true },
    player: { flags: { feud_reconciled: true } } as GameState['player'],
  });
  const recoveries = resolveActivePreEndgameRecoveries(reconciled);
  assert(
    recoveries.some(r => r.patternId === P19_RECOVERY_RELATIONSHIP_RECONCILIATION.id),
    'relationship reconciliation sample',
  );

  const faction = makeState({
    flags: { sect_protection: true, sectLeader: true },
    player: { flags: { sect_protection: true, sectLeader: true } } as GameState['player'],
  });
  assert(
    resolveActivePreEndgameRecoveries(faction).some(
      r => r.patternId === P19_RECOVERY_FACTION_PROTECTION.id,
    ),
    'faction protection sample',
  );

  const legacy = makeState({
    flags: {
      martial_transmission: true,
      inheritance_legacy_complete: true,
      disciple_training_active: true,
    },
    player: { flags: { martial_transmission: true } } as GameState['player'],
  });
  assert(
    resolveActivePreEndgameRecoveries(legacy).some(
      r => r.patternId === P19_RECOVERY_LEGACY_CONTINUITY.id,
    ),
    'legacy continuity sample',
  );

  const report = buildPreEndgameRecoveryReport(legacy, new Set(['legacy', 'continuity']), 68);
  assert(report.explicitSummaryLines.length >= 1, 'inspectable recovery output');
}

function testHistoricalMemorySamples(): void {
  const admired = makeState({
    flags: { hero_rep_mantle: true, legendary_deed: true },
    player: { reputation: 90, chivalry: 85, flags: { hero_rep_mantle: true } } as GameState['player'],
  });
  const admiredReport = buildHistoricalMemoryReport(admired);
  assert(admiredReport.selectedTone === 'admired', 'admired memory sample');

  const disputed = makeState({
    flags: { sect_exposure: true, gray_choice_history: true },
    player: { flags: { sect_exposure: true, gray_choice_history: true } } as GameState['player'],
  });
  const disputedReport = buildHistoricalMemoryReport(disputed);
  assert(
    disputedReport.selectedTone === 'disputed' || disputedReport.selectedTone === 'feared',
    'disputed/feared memory sample',
  );

  const local = makeState({
    flags: { family_legacy: true, quiet_retirement: true, has_child: true },
    player: { connections: 30, reputation: 40, children: 2, spouse: 'x' } as GameState['player'],
  });
  const localReport = buildHistoricalMemoryReport(local);
  assert(localReport.divergenceScore >= 0.35, 'lived vs memory divergence');
  assert(
    localReport.livedSelfUnderstanding !== localReport.posthumousReputation,
    'self understanding differs from posthumous text',
  );
}

function testFinalSummaryUpgrade(): void {
  const state = makeState({
    flags: {
      feud_reconciled: true,
      martial_transmission: true,
      inheritance_legacy_complete: true,
      hero_rep_mantle: true,
    },
    player: {
      reputation: 85,
      flags: { feud_reconciled: true, hero_rep_mantle: true, martial_transmission: true },
    } as GameState['player'],
  });
  const ending = EndingSystem.determineEnding(state);
  const composition = composeP19FinalSummary(state, ending);
  assert(composition.recoveryLines.length >= 1, 'recovery lines in summary');
  assert(composition.legacyContinuationLine.length > 0, 'legacy line');
  assert(composition.historicalMemoryLines.length >= 1, 'memory lines');
  assert(composition.composedSummary.includes('【'), 'category label in summary');

  const endingSummary = EndingSystem.getEndingSummary(state, ending);
  assert(endingSummary.includes('后世') || endingSummary.includes('传承'), 'upgraded ending summary');
}

function testValidationSlices(): void {
  const categorySlice = runEndgameCategoryComparisonSlice();
  assert(categorySlice.categoryChangesBeyondAge, 'category changes beyond age');

  const memorySlice = runHistoricalMemoryComparisonSlice();
  assert(memorySlice.memoryDiffersFromSelfUnderstanding, 'memory divergence slice');

  const closureSlice = runPreEndgameClosureComparisonSlice();
  assert(closureSlice.closureMateriallyChangesSummary, 'closure changes summary');
}

function testGateReport(): void {
  const report = assembleP19GateReport();
  assert(report.decision === 'pass' || report.decision === 'warning', `gate decision ${report.decision}`);
  assert(report.balance.categoryCoverage, 'category coverage');
  assert(report.balance.recoveryKindCoverage, 'recovery coverage');
  assert(report.balance.memoryToneCoverage, 'memory coverage');
}

function runAll(): void {
  testProfileSchema();
  testEndgameCategorySelection();
  testPreEndgameRecoverySamples();
  testHistoricalMemorySamples();
  testFinalSummaryUpgrade();
  testValidationSlices();
  testGateReport();
  console.log('p19EndgameTests: all passed');
}

runAll();
