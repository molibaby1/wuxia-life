/**
 * P17 mid/late-life consequence closure tests.
 */

import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  P17_RELATIONSHIP_FEUD_PRESSURE,
  P17_RELATIONSHIP_SWORN_SHIELDING,
} from '../src/narrative/profile/wuxiaConsequenceSurfaces';
import { collectUnmetMaintenancePressure } from '../src/p17/achievementMaintenance';
import { resolveActiveFactionConsequences } from '../src/p17/factionConsequences';
import {
  buildLaterLifeConsequenceReport,
  collectEventTags,
  combineSchedulingMultiplier,
  getLaterLifeConsequenceMultiplierForTags,
  P17_LATER_LIFE_MIN_AGE,
} from '../src/p17/laterLifeSelection';
import { resolveActiveRelationshipConsequences } from '../src/p17/relationshipConsequences';
import { assembleP17GateReport, profileHasP17Sections } from '../src/p17/reportBuilder';
import { profileHasP17Sections as sliceHasP17, runMidLateLifeValidationSlice } from '../src/p17/validationSlices';
import type { EventDefinition, GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: {
      age: 35,
      name: 't',
      gender: 'male',
      martialPower: 40,
      externalSkill: 40,
      internalSkill: 40,
      qinggong: 40,
      chivalry: 50,
      constitution: 50,
      comprehension: 50,
      sect: null,
      title: null,
      reputation: 40,
      money: 200,
      knowledge: 30,
      charisma: 40,
      businessAcumen: 30,
      influence: 30,
      connections: 25,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
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
  assert(profileHasP17Sections(profile), 'P17 profile sections present');
  assert((profile.relationshipConsequencePatterns?.length ?? 0) >= 3, 'relationship patterns');
  assert((profile.factionIdentityConsequencePatterns?.length ?? 0) >= 3, 'faction patterns');
  assert((profile.achievementMaintenancePatterns?.length ?? 0) >= 3, 'maintenance patterns');
  assert(WUXIA_WORLD_PROFILE.relationshipConsequencePatterns?.some(p => p.id === P17_RELATIONSHIP_SWORN_SHIELDING.id), 'sworn pattern');
  assert(WUXIA_WORLD_PROFILE.relationshipConsequencePatterns?.some(p => p.id === P17_RELATIONSHIP_FEUD_PRESSURE.id), 'feud pattern');
}

function testRelationshipPatternsDiffer(): void {
  const sworn = makeState({ flags: { has_sworn_siblings: true }, player: { flags: { has_sworn_siblings: true } } as GameState['player'] });
  const feud = makeState({
    lifePath: {
      primaryIdentity: 'none',
      faction: 'neutral',
      achievements: [],
      relationships: { allies: [], enemies: ['x'], mentors: [], disciples: [] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['x'] },
      focus: { martial: 0, social: 0, wealth: 0, comprehension: 0 },
    },
  });
  const obligation = makeState({ flags: { has_life_debt: true }, player: { flags: { has_life_debt: true } } as GameState['player'] });

  const swornActive = resolveActiveRelationshipConsequences(sworn);
  const feudActive = resolveActiveRelationshipConsequences(feud);
  const obligationActive = resolveActiveRelationshipConsequences(obligation);

  assert(swornActive.some(a => a.pattern.consequenceKind === 'social_shielding'), 'shielding active');
  assert(feudActive.some(a => a.pattern.consequenceKind === 'feud'), 'feud active');
  assert(obligationActive.some(a => a.pattern.consequenceKind === 'entanglement'), 'entanglement active');

  const swornMul = getLaterLifeConsequenceMultiplierForTags(sworn, new Set(['rescue', 'relationship']));
  const feudMul = getLaterLifeConsequenceMultiplierForTags(feud, new Set(['conflict', 'feud']));
  const obligationMul = getLaterLifeConsequenceMultiplierForTags(obligation, new Set(['duty', 'debt']));
  assert(swornMul.multiplier > 1.1, 'sworn boosts opportunity tags');
  const swornConflict = getLaterLifeConsequenceMultiplierForTags(sworn, new Set(['conflict']));
  assert(swornConflict.multiplier < 1, 'sworn shielding dampens conflict-tagged events');
  assert(feudMul.report.riskMultiplier > 1.15, 'feud boosts risk tags');
  assert(obligationMul.report.riskMultiplier > 1.1, 'obligation boosts duty/debt');
  assert(swornMul.multiplier !== feudMul.multiplier, 'relationship patterns differ materially');
}

function testFactionPatternsDiffer(): void {
  const orthodox = makeState({
    flags: { orthodox_member: true },
    player: { flags: { orthodox_member: true } } as GameState['player'],
  });
  const demonic = makeState({
    flags: { route_demonic: true, unconventional_member: true },
    player: { flags: { route_demonic: true, unconventional_member: true } } as GameState['player'],
  });
  const official = makeState({
    flags: { route_official: true },
    player: { flags: { route_official: true } } as GameState['player'],
  });

  const orthodoxActive = resolveActiveFactionConsequences(orthodox);
  const demonicActive = resolveActiveFactionConsequences(demonic);
  const officialActive = resolveActiveFactionConsequences(official);

  assert(orthodoxActive.some(a => a.pattern.consequenceKind === 'protection'), 'orthodox protection');
  assert(demonicActive.some(a => a.pattern.consequenceKind === 'rivalry'), 'demonic rivalry');
  assert(officialActive.some(a => a.pattern.consequenceKind === 'political_cost'), 'official cost');
  assert(orthodoxActive.length >= 1 && demonicActive.length >= 1 && officialActive.length >= 1, 'three faction patterns');
}

function testAchievementMaintenance(): void {
  const maintained = makeState({
    flags: { hero_rep_mantle: true },
    player: {
      flags: { hero_rep_mantle: true },
      reputation: 80,
      martialPower: 70,
      influence: 60,
    } as GameState['player'],
  });
  const neglected = makeState({
    flags: { hero_rep_mantle: true },
    player: {
      flags: { hero_rep_mantle: true },
      reputation: 10,
      martialPower: 15,
      influence: 5,
    } as GameState['player'],
  });

  const maintainedPressure = collectUnmetMaintenancePressure(maintained);
  const neglectedPressure = collectUnmetMaintenancePressure(neglected);
  assert(maintainedPressure.length < neglectedPressure.length, 'neglected shows more unmet pressure');

  const neglectedReport = buildLaterLifeConsequenceReport(neglected, new Set(['decline', 'backlash']), 35);
  const maintainedReport = buildLaterLifeConsequenceReport(maintained, new Set(['decline', 'backlash']), 35);
  assert(neglectedReport.riskMultiplier > maintainedReport.riskMultiplier, 'neglect raises decline risk');
}

function testCombineSchedulingMultiplier(): void {
  assert(combineSchedulingMultiplier(1.35, 0.85) < 1.15, 'shielding dampens even with opportunity active');
  assert(combineSchedulingMultiplier(1.4, 1.45) === 1.45, 'dominant risk when both channels escalate');
  assert(combineSchedulingMultiplier(1.4, 1) === 1.4, 'opportunity-only passthrough');
  assert(combineSchedulingMultiplier(1, 1.45) === 1.45, 'risk-only passthrough');
}

function testLaterLifeAgeGate(): void {
  const young = makeState({ player: { age: 20, flags: { has_sworn_siblings: true } } as GameState['player'], flags: { has_sworn_siblings: true } });
  const report = buildLaterLifeConsequenceReport(young, new Set(['rescue']), 20);
  assert(report.combinedMultiplier === 1, 'no consequence weight before min age');
  assert(P17_LATER_LIFE_MIN_AGE === 25, 'documented min age');
}

function testEventTagCollection(): void {
  const event = {
    id: 'hero_reputation_backlash',
    category: 'story',
    storyLine: 'hero_arc',
    metadata: { tags: ['backlash'] },
  } as EventDefinition;
  const tags = collectEventTags(event);
  assert(tags.has('backlash'), 'metadata tag');
  assert(tags.has('prestige'), 'inferred prestige');
  assert(tags.has('decline'), 'inferred decline');
}

function testValidationSlice(): void {
  const slice = runMidLateLifeValidationSlice();
  assert(sliceHasP17(), 'profile has P17 sections');
  assert(slice.allyChangesOpportunity, 'ally changes opportunity');
  assert(slice.factionAddsDuty, 'faction adds duty');
  assert(slice.achievementFragileWhenNeglected, 'achievement fragile when neglected');
  assert(slice.cases.length >= 5, 'validation cases');
}

function testGateReport(): void {
  const report = assembleP17GateReport();
  assert(report.decision === 'pass' || report.decision === 'warning', `gate decision ${report.decision}`);
  assert(report.balance.relationshipUpsideAndBurden, 'relationship balance');
  assert(report.balance.factionProtectionAndDuty, 'faction balance');
  assert(report.balance.achievementPrestigeAndUpkeep, 'achievement balance');
}

function runAll(): void {
  testProfileSchema();
  testRelationshipPatternsDiffer();
  testFactionPatternsDiffer();
  testAchievementMaintenance();
  testCombineSchedulingMultiplier();
  testLaterLifeAgeGate();
  testEventTagCollection();
  testValidationSlice();
  testGateReport();
  console.log('✔ p17ConsequenceTests passed');
}

runAll();
