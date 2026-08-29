/**
 * P18 legacy, disciples, and heirs closure tests.
 */

import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  P18_CHANNEL_MARTIAL_TEACHING,
  P18_CHANNEL_VENDETTA,
  P18_OUTCOME_TRANSMISSION_SUCCESS,
  P18_ROLE_DISCIPLE,
} from '../src/narrative/profile/wuxiaLegacySurfaces';
import { collectUnmetCultivationPressure } from '../src/p18/cultivationPressure';
import { resolveActiveInheritanceChannels } from '../src/p18/inheritanceChannels';
import {
  buildLaterLifeLegacyReport,
  collectLegacyEventTags,
  getLaterLifeLegacyMultiplierForTags,
} from '../src/p18/laterLifeLegacySelection';
import { resolveActiveLegacyOutcomes } from '../src/p18/legacyOutcomes';
import { assembleP18GateReport, profileHasP18Sections } from '../src/p18/reportBuilder';
import { resolveActiveSuccessorRoles } from '../src/p18/successorRoles';
import {
  profileHasP18Sections as sliceHasP18,
  runContinuityComparisonSlice,
  runInheritedBurdenComparisonSlice,
  runUnderinvestmentComparisonSlice,
} from '../src/p18/validationSlices';
import { P17_LATER_LIFE_MIN_AGE } from '../src/p17/laterLifeSelection';
import type { EventDefinition, GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: {
      age: 52,
      name: 't',
      gender: 'male',
      martialPower: 80,
      chivalry: 55,
      constitution: 50,
      affiliation: null,
      title: null,
      reputation: 65,
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
  } as GameState;
}

function testProfileSchema(): void {
  const profile = getWorldProfile();
  assert(profileHasP18Sections(profile), 'P18 profile sections present');
  assert((profile.successorRoleConfigs?.length ?? 0) >= 4, 'successor roles');
  assert((profile.inheritanceChannelPatterns?.length ?? 0) >= 6, 'inheritance channels');
  assert((profile.successorCultivationCostPatterns?.length ?? 0) >= 2, 'cultivation costs');
  assert((profile.legacyOutcomePatterns?.length ?? 0) >= 5, 'legacy outcomes');
  assert(WUXIA_WORLD_PROFILE.successorRoleConfigs?.some(r => r.id === P18_ROLE_DISCIPLE.id), 'disciple role');
  assert(
    WUXIA_WORLD_PROFILE.inheritanceChannelPatterns?.some(c => c.id === P18_CHANNEL_MARTIAL_TEACHING.id),
    'martial channel',
  );
}

function testSuccessorRolesAndChannels(): void {
  const transmission = makeState({
    flags: { martial_transmission: true, has_disciples: true, disciple_training_active: true },
    player: {
      flags: { martial_transmission: true, has_disciples: true, disciple_training_active: true },
      martialHeritage: 70,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'elderly',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['a', 'b'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
  });
  const burden = makeState({
    flags: { inherited_vendetta: true, sect_heir: true },
    player: {
      flags: { inherited_vendetta: true, sect_heir: true },
      martialHeritage: 10,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'elderly',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['enemy'] },
    },
  });

  const roles = resolveActiveSuccessorRoles(transmission);
  const channels = resolveActiveInheritanceChannels(transmission);
  const burdenChannels = resolveActiveInheritanceChannels(burden);

  assert(roles.length >= 2, 'multiple successor roles active');
  assert(channels.some(c => c.pattern.id === P18_CHANNEL_MARTIAL_TEACHING.id), 'martial channel active');
  assert(burdenChannels.some(c => c.pattern.id === P18_CHANNEL_VENDETTA.id), 'vendetta channel active');

  const transmissionMul = getLaterLifeLegacyMultiplierForTags(transmission, new Set(['legacy', 'training']));
  const burdenMul = getLaterLifeLegacyMultiplierForTags(burden, new Set(['feud', 'obligation']));
  assert(transmissionMul.multiplier > 1.1, 'transmission boosts legacy tags');
  assert(burdenMul.report.riskMultiplier > 1.1, 'burden raises risk');
  assert(transmissionMul.multiplier !== burdenMul.multiplier, 'legacy trajectories differ');
}

function testCultivationPressure(): void {
  const invested = makeState({
    flags: { has_disciples: true, disciple_training_active: true, martial_transmission: true },
    player: {
      flags: { has_disciples: true, disciple_training_active: true, martial_transmission: true },
      martialHeritage: 75,
      connections: 70,
    } as GameState['player'],
  });
  const neglected = makeState({
    flags: { has_disciples: true, has_child: true },
    player: {
      flags: { has_disciples: true, has_child: true },
      martialHeritage: 5,
      connections: 8,
      martialPower: 95,
      children: 2,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'elderly',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1', 'd2', 'd3'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
  });

  const investedPressure = collectUnmetCultivationPressure(invested);
  const neglectedPressure = collectUnmetCultivationPressure(neglected);
  assert(neglectedPressure.length > investedPressure.length, 'neglect shows more unmet pressure');

  const neglectedReport = buildLaterLifeLegacyReport(neglected, new Set(['decline', 'legacy']), 50);
  const investedReport = buildLaterLifeLegacyReport(invested, new Set(['legacy', 'continuity']), 50);
  assert(neglectedReport.riskMultiplier > investedReport.riskMultiplier, 'neglect raises legacy risk');
}

function testLegacyOutcomes(): void {
  const success = makeState({
    flags: { martial_transmission: true, inheritance_legacy_complete: true, has_disciples: true },
    player: {
      flags: { martial_transmission: true, inheritance_legacy_complete: true, has_disciples: true },
      martialHeritage: 80,
    } as GameState['player'],
    lifePath: {
      faction: 'neutral',
      lifeStage: 'elderly',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
  });
  const rupture = makeState({
    flags: { disciple_betrayal: true, legacy_collapse: true },
    player: { flags: { disciple_betrayal: true, legacy_collapse: true } } as GameState['player'],
  });

  const successOutcomes = resolveActiveLegacyOutcomes(success);
  const ruptureOutcomes = resolveActiveLegacyOutcomes(rupture);
  assert(
    successOutcomes.some(o => o.pattern.id === P18_OUTCOME_TRANSMISSION_SUCCESS.id),
    'transmission success outcome',
  );
  assert(ruptureOutcomes.some(o => o.pattern.outcomeKind === 'rupture_betrayal'), 'rupture outcome');
}

function testLaterLifeAgeGate(): void {
  const young = makeState({
    flags: { martial_transmission: true },
    player: { age: 20, flags: { martial_transmission: true } } as GameState['player'],
  });
  const report = buildLaterLifeLegacyReport(young, new Set(['legacy']), 20);
  assert(report.combinedMultiplier === 1, 'no legacy weight before min age');
  assert(P17_LATER_LIFE_MIN_AGE === 25, 'shared min age with P17');
}

function testEventTagCollection(): void {
  const event = {
    id: 'elderly_disciple_legacy_transmission',
    category: 'elderly',
    storyLine: 'legacy_arc',
    metadata: { tags: ['legacy'] },
  } as EventDefinition;
  const tags = collectLegacyEventTags(event);
  assert(tags.has('legacy'), 'metadata tag');
  assert(tags.has('family'), 'inferred family');
  assert(tags.has('continuity'), 'inferred continuity');
}

function testValidationSlices(): void {
  const continuity = runContinuityComparisonSlice();
  const burden = runInheritedBurdenComparisonSlice();
  const underinvest = runUnderinvestmentComparisonSlice();
  assert(sliceHasP18(), 'profile has P18 sections');
  assert(continuity.cultivationChangesStability, 'cultivation changes stability');
  assert(burden.burdenAltersOutcomeSpace, 'burden alters outcome space');
  assert(underinvest.underinvestmentWeakerThanAchievementSuggests, 'underinvestment weaker than achievement');
}

function testGateReport(): void {
  const report = assembleP18GateReport();
  assert(report.decision === 'pass' || report.decision === 'warning', `gate decision ${report.decision}`);
  assert(report.balance.assetAndBurdenChannels, 'asset/burden balance');
  assert(report.balance.cultivationCostWithPressure, 'cultivation cost balance');
  assert(report.balance.triumphAndDisappointmentOutcomes, 'triumph and disappointment');
}

function runAll(): void {
  testProfileSchema();
  testSuccessorRolesAndChannels();
  testCultivationPressure();
  testLegacyOutcomes();
  testLaterLifeAgeGate();
  testEventTagCollection();
  testValidationSlices();
  testGateReport();
  console.log('✔ p18LegacyTests passed');
}

runAll();
