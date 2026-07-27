/**
 * P37 additional mixed/pinnacle habit-led lifetime sim traces — merchant_martial_patron + founding_patriarch.
 */
import { evaluateMixedDestinies, evaluatePinnacleDestinies } from '../p16/compositeDestiny';
import {
  applyRareLineFlags,
  rollRareEventLines,
  type RareLineRollResult,
} from '../p16/rareEventLines';
import { EventLoader } from '../core/EventLoader';
import { getWorldProfile } from '../narrative/worldProfile';
import { applyEventChoiceFlagSets } from './p32BridgeParity';
import {
  incrementTrainingHabitFromMartialGain,
  type P35LifetimeAgeStep,
  type P35LifetimeEventStep,
  type P35PinnacleFailureAttribution,
} from './p35MixedPinnacleLifetimeSlices';
import { createSimulationPlayerState } from './simulationPlayerState';

export interface P37MixedMerchantPatronLifetimeResult {
  slice: 'p37_mixed_merchant_patron_lifetime';
  pathId: 'p37_mixed_merchant_patron_habit_zero_lifetime';
  outcomeId: 'merchant_martial_patron';
  seed: {
    originId: string;
    birthAge: number;
    businessHabitStart: number;
    trainingHabitStart: number;
  };
  ageProgression: P35LifetimeAgeStep[];
  eventSequence: P35LifetimeEventStep[];
  terminalCheckpoint: {
    age: number;
    endState: 'mixed_composite_eval_terminal';
    unlocked: boolean;
    crossTrackGroupsSatisfied: number;
  };
  resolvedBridgeFlags: string[];
  crossTrackSignals: string[];
  usedStaticResolver: false;
}

export interface P37PinnacleFoundingPatriarchLifetimeResult {
  slice: 'p37_pinnacle_founding_patriarch_lifetime';
  pathId: 'p37_pinnacle_founding_patriarch_habit_zero_lifetime';
  outcomeId: 'founding_patriarch';
  seed: {
    originId: string;
    birthAge: number;
    trainingHabitStart: number;
  };
  ageProgression: P35LifetimeAgeStep[];
  eventSequence: P35LifetimeEventStep[];
  luckWindow: {
    lineId: string;
    age: number;
    triggered: boolean;
    unlocksFlags: string[];
    effectiveProbability: number;
  };
  failureAttribution: P35PinnacleFailureAttribution;
  terminalCheckpoint: {
    age: number;
    endState: 'pinnacle_composite_eval_terminal';
    unlocked: boolean;
    choiceGateMet: boolean;
    luckGateMet: boolean;
  };
  resolvedBridgeFlags: string[];
  usedStaticResolver: false;
}

const MIXED_TERMINAL_AGE = 68;
const PINNACLE_TERMINAL_AGE = 72;

/** ponytail: mirrors GameEngineIntegration business tag + gain/money threshold */
export function incrementBusinessHabitFromGain(
  lifeStates: Record<string, number>,
  businessGain: number,
  moneyGain = 0,
): Record<string, number> {
  const next = { ...lifeStates };
  if (businessGain >= 2 || moneyGain >= 100) {
    next.businessHabit = Math.min(5, (next.businessHabit ?? 0) + 1);
  }
  return next;
}

function activeFlags(flags: Record<string, unknown>): string[] {
  return Object.keys(flags).filter(k => flags[k] === true);
}

function buildMixedMerchantPlayer(
  age: number,
  lifeStates: Record<string, number>,
  stats: { martialPower: number; reputation: number; money: number; connections: number },
) {
  return createSimulationPlayerState({
    name: 'p37-mixed-merchant-patron',
    age,
    origin: 'merchant_house',
    martialPower: stats.martialPower,
    reputation: stats.reputation,
    connections: stats.connections,
    money: stats.money,
    alive: age < MIXED_TERMINAL_AGE,
    lifeStates: {
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
      businessHabit: lifeStates.businessHabit ?? 0,
    },
  });
}

function buildPinnaclePatriarchPlayer(
  age: number,
  lifeStates: Record<string, number>,
  stats: { martialPower: number; reputation: number; money: number; connections: number },
) {
  return createSimulationPlayerState({
    name: 'p37-pinnacle-founding-patriarch',
    age,
    origin: 'scholar_house',
    martialPower: stats.martialPower,
    reputation: stats.reputation,
    connections: stats.connections,
    money: stats.money,
    alive: age < PINNACLE_TERMINAL_AGE,
    lifeStates: {
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
    },
  });
}

/** Dual-track lifetime: business + martial habit on-ramp → wealth + sect investment bridges → mixed eval. */
export function runP37MixedMerchantPatronLifetimeSlice(): P37MixedMerchantPatronLifetimeResult {
  const loader = EventLoader.getInstance();
  const wealthFork = loader.getEventById('p22_early_wealth_route_fork')!;
  const sectInvest = loader.getEventById('merchant_sect_investment')!;
  const wealthChoice = wealthFork.choices?.[0];
  const investChoice = sectInvest.choices?.[1];

  let lifeStates: Record<string, number> = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };
  let martialPower = 24;
  let reputation = 12;
  let money = 8;
  const connections = 28;

  const ageProgression: P35LifetimeAgeStep[] = [
    {
      age: 0,
      phase: 'birth',
      action: 'born merchant_house; businessHabit/trainingHabit at 0',
      trainingHabit: 0,
      studyHabit: 0,
      martialPower,
      reputation,
    },
  ];

  let flags: Record<string, unknown> = { origin_merchant_family: true, origin_id: 'merchant_house' };

  const businessRamp = [
    { age: 10, action: 'family_ledger (+3 business)', gain: 3, moneyGain: 40 },
    { age: 14, action: 'trade_apprentice (+2 business)', gain: 2, moneyGain: 80 },
    { age: 16, action: 'route_scouting (+3 business)', gain: 3, moneyGain: 120 },
  ];
  for (const tick of businessRamp) {
    lifeStates = incrementBusinessHabitFromGain(lifeStates, tick.gain, tick.moneyGain);
    money += tick.moneyGain;
    reputation += 3;
    ageProgression.push({
      age: tick.age,
      phase: tick.age < 18 ? 'childhood' : 'youth',
      action: `${tick.action} → businessHabit ${lifeStates.businessHabit}`,
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
      martialPower,
      reputation,
    });
  }

  const martialRamp = [
    { age: 12, gain: 7, action: 'guard_training (+7 martial)' },
    { age: 15, gain: 6, action: 'caravan_escort (+6 martial)' },
  ];
  for (const tick of martialRamp) {
    lifeStates = incrementTrainingHabitFromMartialGain(lifeStates, tick.gain);
    martialPower += tick.gain;
    ageProgression.push({
      age: tick.age,
      phase: 'youth',
      action: `${tick.action} → trainingHabit ${lifeStates.trainingHabit}`,
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
      martialPower,
      reputation: (reputation += 2),
    });
  }

  flags = applyEventChoiceFlagSets(wealthFork, 0, flags);
  money += 50;
  const flagsAfterWealth = activeFlags(flags);
  ageProgression.push({
    age: 18,
    phase: 'bridge',
    action: 'p22_early_wealth_route_fork → route_wealth_committed',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower: (martialPower += 3),
    reputation: (reputation += 4),
  });

  martialPower = 52;
  money = 165;
  reputation = 48;

  flags = applyEventChoiceFlagSets(sectInvest, 1, flags);
  const flagsAfterInvest = activeFlags(flags);
  martialPower += 10;
  reputation += 15;
  money -= 100;
  ageProgression.push({
    age: 32,
    phase: 'bridge',
    action: 'merchant_sect_investment → merchant_invest_good',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower,
    reputation,
  });

  const eventSequence: P35LifetimeEventStep[] = [
    {
      age: 18,
      eventId: 'p22_early_wealth_route_fork',
      choiceIndex: 0,
      choiceLabel: wealthChoice?.id ?? wealthChoice?.text ?? 'expand_trade_route',
      flagsAfter: flagsAfterWealth,
    },
    {
      age: 32,
      eventId: 'merchant_sect_investment',
      choiceIndex: 1,
      choiceLabel: investChoice?.text ?? 'merchant_invest_good',
      flagsAfter: flagsAfterInvest,
    },
  ];

  const terminalPlayer = buildMixedMerchantPlayer(MIXED_TERMINAL_AGE, lifeStates, {
    martialPower,
    reputation,
    money,
    connections,
  });
  terminalPlayer.alive = false;

  const mixedReports = evaluateMixedDestinies(terminalPlayer, flags);
  const report = mixedReports.find(r => r.outcomeId === 'merchant_martial_patron')!;
  const outcome = getWorldProfile('wuxia').mixedDestinyOutcomes!.find(
    o => o.id === 'merchant_martial_patron',
  )!;
  const satisfiedGroups = (outcome?.crossTrackGroups ?? []).filter(group =>
    group.requirementIndices.every(idx => report.dimensions[idx]?.status === 'satisfied'),
  );

  ageProgression.push({
    age: MIXED_TERMINAL_AGE,
    phase: 'terminal',
    action: `mixed composite eval → unlocked=${report.unlocked} tracks=${satisfiedGroups.map(g => g.trackId).join('+')}`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower,
    reputation,
  });

  return {
    slice: 'p37_mixed_merchant_patron_lifetime',
    pathId: 'p37_mixed_merchant_patron_habit_zero_lifetime',
    outcomeId: 'merchant_martial_patron',
    seed: {
      originId: 'merchant_house',
      birthAge: 0,
      businessHabitStart: 0,
      trainingHabitStart: 0,
    },
    ageProgression,
    eventSequence,
    terminalCheckpoint: {
      age: MIXED_TERMINAL_AGE,
      endState: 'mixed_composite_eval_terminal',
      unlocked: report.unlocked,
      crossTrackGroupsSatisfied: satisfiedGroups.length,
    },
    resolvedBridgeFlags: ['route_wealth_committed', 'merchant_invest_good'].filter(f => flags[f] === true),
    crossTrackSignals: satisfiedGroups.map(g => `${g.trackId}:ok`),
    usedStaticResolver: false,
  };
}

/** Pinnacle dual-gate lifetime: alliance choice + scholar_mentor luck → founding_patriarch. */
export function runP37PinnacleFoundingPatriarchLifetimeSlice(): P37PinnacleFoundingPatriarchLifetimeResult {
  const loader = EventLoader.getInstance();
  const factionContinuation = loader.getEventById('p22_faction_sect_continuation')!;
  const factionChoice = factionContinuation.choices?.[0];

  let lifeStates: Record<string, number> = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };
  let martialPower = 26;
  let reputation = 14;
  let money = 10;
  let connections = 18;

  const ageProgression: P35LifetimeAgeStep[] = [
    {
      age: 0,
      phase: 'birth',
      action: 'born scholar_house; trainingHabit at 0',
      trainingHabit: 0,
      studyHabit: 0,
      martialPower,
      reputation,
    },
    {
      age: 4,
      phase: 'childhood',
      action: 'childhood_preference focus_on_study',
      trainingHabit: 0,
      studyHabit: 0,
      martialPower,
      reputation,
    },
  ];

  let flags: Record<string, unknown> = { focus_on_study: true, origin_id: 'scholar_house' };
  const eventSequence: P35LifetimeEventStep[] = [];

  const trainingRamp = [
    { age: 10, gain: 7, action: 'academy_drill (+7 martial)' },
    { age: 12, gain: 6, action: 'sect_prep (+6 martial)' },
  ];
  for (const tick of trainingRamp) {
    lifeStates = incrementTrainingHabitFromMartialGain(lifeStates, tick.gain);
    martialPower += tick.gain;
    ageProgression.push({
      age: tick.age,
      phase: 'childhood',
      action: `${tick.action} → trainingHabit ${lifeStates.trainingHabit}`,
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: 0,
      martialPower,
      reputation,
    });
  }

  const socialRamp = [
    { age: 11, action: 'salon_introduction' },
    { age: 14, action: 'alliance_dinner' },
  ];
  for (const tick of socialRamp) {
    connections += 8;
    reputation += 4;
    ageProgression.push({
      age: tick.age,
      phase: tick.age < 13 ? 'childhood' : 'youth',
      action: `${tick.action} → connections ${connections}, reputation ${reputation}`,
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: 0,
      martialPower,
      reputation,
    });
  }

  flags = { ...flags, sect_exposure: true, joined_sect: true };
  ageProgression.push({
    age: 13,
    phase: 'bridge',
    action: 'sect exposure modeled for faction continuation precondition',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower: (martialPower += 4),
    reputation: (reputation += 3),
  });

  const luckAge = 15;
  const luckPlayer = buildPinnaclePatriarchPlayer(luckAge, lifeStates, {
    martialPower: (martialPower = 48),
    reputation: (reputation = 28),
    money,
    connections: (connections = 42),
  });
  const rareRolls: RareLineRollResult[] = rollRareEventLines(luckPlayer, flags, () => 0.01);
  flags = applyRareLineFlags(flags, rareRolls);
  const mentorRoll = rareRolls.find(r => r.lineId === 'scholar_mentor_line')!;
  ageProgression.push({
    age: luckAge,
    phase: 'luck',
    action: `scholar_mentor_line roll (p=${mentorRoll.effectiveProbability}) → triggered=${mentorRoll.triggered}`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower,
    reputation: (reputation += 6),
  });

  flags = applyEventChoiceFlagSets(factionContinuation, 0, flags);
  const flagsAfterFaction = activeFlags(flags);
  eventSequence.push({
    age: 30,
    eventId: 'p22_faction_sect_continuation',
    choiceIndex: 0,
    choiceLabel: factionChoice?.id ?? factionChoice?.text ?? 'accept_sect_duty',
    flagsAfter: flagsAfterFaction,
  });
  connections += 12;
  reputation += 4;
  ageProgression.push({
    age: 30,
    phase: 'bridge',
    action: 'p22_faction_sect_continuation → p16_alliance_brokered',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower: (martialPower = 74),
    reputation,
  });

  const midlifeTicks = [
    { age: 45, mp: 78, rep: 62, conn: 76, mon: 52 },
    { age: 60, mp: 80, rep: 65, conn: 78, mon: 54 },
  ];
  for (const tick of midlifeTicks) {
    martialPower = tick.mp;
    reputation = tick.rep;
    connections = tick.conn;
    money = tick.mon;
    ageProgression.push({
      age: tick.age,
      phase: 'midlife',
      action: 'social/resource grind toward pinnacle stat gates',
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: 0,
      martialPower,
      reputation,
    });
  }

  const terminalPlayer = buildPinnaclePatriarchPlayer(PINNACLE_TERMINAL_AGE, lifeStates, {
    martialPower: 74,
    reputation: 58,
    money: 56,
    connections: 72,
  });
  terminalPlayer.alive = false;

  const pinnacleReports = evaluatePinnacleDestinies(terminalPlayer, flags);
  const report = pinnacleReports.find(r => r.outcomeId === 'founding_patriarch')!;
  const grindPlayer = buildPinnaclePatriarchPlayer(PINNACLE_TERMINAL_AGE, lifeStates, {
    martialPower: 80,
    reputation: 68,
    money: 60,
    connections: 78,
  });
  const grindOnly = evaluatePinnacleDestinies(grindPlayer, {
    p16_alliance_brokered: true,
  }).find(r => r.outcomeId === 'founding_patriarch')!;

  const failureAttribution: P35PinnacleFailureAttribution = {
    grindOnlyLocked: !grindOnly.unlocked,
    luckGateUnmet: grindOnly.unmetGates?.luck !== undefined,
    choiceGateMet: flags.p16_alliance_brokered === true,
    detail: grindOnly.unlocked
      ? 'unexpected grind-only unlock'
      : 'grind + choice without scholar_mentor luck stays locked (aligns with p25 rare-window-waste slice)',
  };

  ageProgression.push({
    age: PINNACLE_TERMINAL_AGE,
    phase: 'terminal',
    action: `pinnacle eval → unlocked=${report.unlocked}`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower: 74,
    reputation: 58,
  });

  return {
    slice: 'p37_pinnacle_founding_patriarch_lifetime',
    pathId: 'p37_pinnacle_founding_patriarch_habit_zero_lifetime',
    outcomeId: 'founding_patriarch',
    seed: {
      originId: 'scholar_house',
      birthAge: 0,
      trainingHabitStart: 0,
    },
    ageProgression,
    eventSequence,
    luckWindow: {
      lineId: mentorRoll.lineId,
      age: luckAge,
      triggered: mentorRoll.triggered,
      unlocksFlags: mentorRoll.unlocksFlags,
      effectiveProbability: mentorRoll.effectiveProbability,
    },
    failureAttribution,
    terminalCheckpoint: {
      age: PINNACLE_TERMINAL_AGE,
      endState: 'pinnacle_composite_eval_terminal',
      unlocked: report.unlocked,
      choiceGateMet: report.dimensions.some(
        d => d.dimension === 'key_choices' && d.status === 'satisfied',
      ),
      luckGateMet: report.dimensions.some(
        d => d.dimension === 'special_event' && d.status === 'satisfied',
      ),
    },
    resolvedBridgeFlags: ['p16_alliance_brokered', 'p16_scholar_mentor'].filter(f => flags[f] === true),
    usedStaticResolver: false,
  };
}

export function formatP37MixedMerchantPatronMarkdown(
  result: P37MixedMerchantPatronLifetimeResult,
): string {
  return [
    '# P37 Mixed Habit-Led Lifetime Sim Trace — merchant_martial_patron',
    '',
    `Path: \`${result.pathId}\` → \`${result.outcomeId}\``,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- Birth age: **${result.seed.birthAge}**`,
    `- businessHabit / trainingHabit start: **${result.seed.businessHabitStart}** / **${result.seed.trainingHabitStart}**`,
    '- Dual habit on-ramp (business + martial); no static resolver fixtures',
    '',
    '## Age progression',
    '',
    ...result.ageProgression.map(
      s =>
        `- Age **${s.age}** (${s.phase}): ${s.action} [trainingHabit=${s.trainingHabit}, studyHabit=${s.studyHabit}, mp=${s.martialPower}, rep=${s.reputation}]`,
    ),
    '',
    '## Event sequence (JSON flag_set path)',
    '',
    ...result.eventSequence.map(
      (s, i) =>
        `${i + 1}. Age ${s.age}: \`${s.eventId}\` choice ${s.choiceIndex} (\`${s.choiceLabel}\`) → flags [${s.flagsAfter.join(', ')}]`,
    ),
    '',
    '## Terminal checkpoint',
    '',
    `- Age: **${result.terminalCheckpoint.age}**`,
    `- End state: \`${result.terminalCheckpoint.endState}\``,
    `- Unlocked: **${result.terminalCheckpoint.unlocked}**`,
    `- Cross-track groups satisfied: **${result.terminalCheckpoint.crossTrackGroupsSatisfied}**`,
    `- Cross-track signals: [${result.crossTrackSignals.join(', ')}]`,
    `- Bridge flags: [${result.resolvedBridgeFlags.join(', ')}]`,
    `- Static resolver used: ${result.usedStaticResolver}`,
    '',
  ].join('\n');
}

export function formatP37PinnacleFoundingPatriarchMarkdown(
  result: P37PinnacleFoundingPatriarchLifetimeResult,
): string {
  return [
    '# P37 Pinnacle Habit-Led Lifetime Sim Trace — founding_patriarch',
    '',
    `Path: \`${result.pathId}\` → \`${result.outcomeId}\``,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- Birth age: **${result.seed.birthAge}**`,
    `- trainingHabit start: **${result.seed.trainingHabitStart}**`,
    '- Childhood `focus_on_study` enables scholar_mentor_line precondition',
    '',
    '## Luck window',
    '',
    `- Line: \`${result.luckWindow.lineId}\` at age **${result.luckWindow.age}**`,
    `- Triggered: **${result.luckWindow.triggered}** (p=${result.luckWindow.effectiveProbability})`,
    `- Unlocks flags: [${result.luckWindow.unlocksFlags.join(', ')}]`,
    '',
    '## Failure attribution (grind-only control)',
    '',
    `- Grind-only locked: **${result.failureAttribution.grindOnlyLocked}**`,
    `- Luck gate unmet on grind-only: **${result.failureAttribution.luckGateUnmet}**`,
    `- Choice gate met on success path: **${result.failureAttribution.choiceGateMet}**`,
    `- Detail: ${result.failureAttribution.detail}`,
    '',
    '## Age progression',
    '',
    ...result.ageProgression.map(
      s =>
        `- Age **${s.age}** (${s.phase}): ${s.action} [trainingHabit=${s.trainingHabit}, mp=${s.martialPower}, rep=${s.reputation}]`,
    ),
    '',
    '## Event sequence',
    '',
    ...result.eventSequence.map(
      (s, i) =>
        `${i + 1}. Age ${s.age}: \`${s.eventId}\` (\`${s.choiceLabel}\`) → flags [${s.flagsAfter.join(', ')}]`,
    ),
    '',
    '## Terminal checkpoint',
    '',
    `- Age: **${result.terminalCheckpoint.age}**`,
    `- Unlocked: **${result.terminalCheckpoint.unlocked}**`,
    `- Choice gate met: **${result.terminalCheckpoint.choiceGateMet}**`,
    `- Luck gate met: **${result.terminalCheckpoint.luckGateMet}**`,
    `- Bridge flags: [${result.resolvedBridgeFlags.join(', ')}]`,
    `- Static resolver used: ${result.usedStaticResolver}`,
    '',
  ].join('\n');
}
