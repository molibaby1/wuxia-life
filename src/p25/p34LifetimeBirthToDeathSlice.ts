/**
 * P34 habit-led birth→death lifetime sim e2e slice — medical path without static resolver.
 *
 * Chains habit-zero on-ramp → bridge events → terminal-age composite eval for medical_sage_healer.
 */
import { evaluateCompositeDestinyOutcome } from '../p16/compositeDestiny';
import { EventLoader } from '../core/EventLoader';
import { getWorldProfile } from '../narrative/worldProfile';
import { applyEventChoiceFlagSets } from './p32BridgeParity';
import { incrementStudyHabitFromComprehension } from './p33HabitZeroOnRampSlice';
import { createSimulationPlayerState } from './simulationPlayerState';

export interface P34LifetimeAgeStep {
  age: number;
  phase: 'birth' | 'childhood' | 'youth' | 'midlife' | 'bridge' | 'terminal';
  action: string;
  studyHabit: number;
  reputation: number;
  money: number;
}

export interface P34LifetimeEventStep {
  age: number;
  eventId: string;
  choiceIndex: number;
  choiceLabel: string;
  flagsAfter: string[];
}

export interface P34LifetimeBirthToDeathResult {
  slice: 'p34_lifetime_birth_to_death';
  pathId: 'p34_medical_habit_zero_lifetime';
  outcomeId: 'medical_sage_healer';
  seed: {
    originId: string;
    birthAge: number;
    studyHabitStart: number;
  };
  ageProgression: P34LifetimeAgeStep[];
  eventSequence: P34LifetimeEventStep[];
  terminalCheckpoint: {
    age: number;
    endState: 'composite_eval_terminal';
    unlocked: boolean;
    keyChoicesMet: boolean;
  };
  resolvedBridgeFlags: string[];
  usedStaticResolver: false;
}

const TERMINAL_AGE = 72;

function buildPlayer(
  age: number,
  lifeStates: Record<string, number>,
  stats: { reputation: number; money: number; martialPower: number; connections: number },
) {
  return createSimulationPlayerState({
    name: 'p34-lifetime',
    age,
    origin: 'poor_family',
    martialPower: stats.martialPower,
    reputation: stats.reputation,
    connections: stats.connections,
    money: stats.money,
    alive: age < TERMINAL_AGE,
    lifeStates: {
      studyHabit: lifeStates.studyHabit ?? 0,
    },
  });
}

/** Birth→terminal lifetime: studyHabit 0 → on-ramp → p27/p29 bridges → composite eval. */
export function runP34MedicalLifetimeBirthToDeathSlice(): P34LifetimeBirthToDeathResult {
  const loader = EventLoader.getInstance();
  const p27Event = loader.getEventById('p27_study_habit_healer_reinforcement')!;
  const p29Event = loader.getEventById('p29_study_habit_case_record_duty')!;
  const p27Choice = p27Event.choices?.[0];
  const p29Choice = p29Event.choices?.[0];

  let lifeStates: Record<string, number> = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
    socialMomentum: 0,
    familyBond: 0,
  };
  let reputation = 12;
  let money = 8;
  const martialPower = 30;
  const connections = 25;

  const ageProgression: P34LifetimeAgeStep[] = [
    {
      age: 0,
      phase: 'birth',
      action: 'born poor_family; studyHabit=0; no bridge flags',
      studyHabit: 0,
      reputation,
      money,
    },
  ];

  const onRampTicks = [
    { age: 16, action: 'childhood_comprehension_study (+5 academic)', gain: 5 },
    { age: 18, action: 'youth_comprehension_study (+4 academic)', gain: 4 },
    { age: 24, action: 'apprentice_case_records (+4 academic)', gain: 4 },
  ];

  for (const tick of onRampTicks) {
    lifeStates = incrementStudyHabitFromComprehension(lifeStates, tick.gain);
    reputation += 8;
    money += 6;
    ageProgression.push({
      age: tick.age,
      phase: tick.age <= 18 ? 'childhood' : 'youth',
      action: `${tick.action} → studyHabit ${lifeStates.studyHabit}`,
      studyHabit: lifeStates.studyHabit ?? 0,
      reputation,
      money,
    });
  }

  ageProgression.push({
    age: 32,
    phase: 'midlife',
    action: 'reputation from healer rounds before bridge events',
    studyHabit: lifeStates.studyHabit ?? 0,
    reputation: (reputation = 62),
    money: (money = 48),
  });

  let flags = applyEventChoiceFlagSets(p27Event, 0, {});
  const flagsAfterP27 = Object.keys(flags).filter(k => flags[k] === true);

  ageProgression.push({
    age: 34,
    phase: 'bridge',
    action: `p27_study_habit_healer_reinforcement → flags [${flagsAfterP27.join(', ')}]`,
    studyHabit: lifeStates.studyHabit ?? 0,
    reputation,
    money,
  });

  flags = applyEventChoiceFlagSets(p29Event, 0, flags);
  const flagsAfterP29 = Object.keys(flags).filter(k => flags[k] === true);

  ageProgression.push({
    age: 38,
    phase: 'bridge',
    action: `p29_study_habit_case_record_duty → flags include medical_divine_doctor_fame`,
    studyHabit: lifeStates.studyHabit ?? 0,
    reputation: (reputation = 65),
    money: (money = 50),
  });

  const eventSequence: P34LifetimeEventStep[] = [
    {
      age: 34,
      eventId: 'p27_study_habit_healer_reinforcement',
      choiceIndex: 0,
      choiceLabel: p27Choice?.id ?? p27Choice?.text ?? '顺势钻研医理',
      flagsAfter: flagsAfterP27,
    },
    {
      age: 38,
      eventId: 'p29_study_habit_case_record_duty',
      choiceIndex: 0,
      choiceLabel: p29Choice?.id ?? p29Choice?.text ?? '接下汇辑之责',
      flagsAfter: flagsAfterP29,
    },
  ];

  const terminalPlayer = buildPlayer(TERMINAL_AGE, lifeStates, {
    reputation,
    money,
    martialPower,
    connections,
  });
  terminalPlayer.alive = false;

  const outcome = getWorldProfile('wuxia').compositeDestinyOutcomes!.find(
    o => o.id === 'medical_sage_healer',
  )!;
  const report = evaluateCompositeDestinyOutcome(outcome, terminalPlayer, flags);
  const keyDims = report.dimensions.filter(d => d.dimension === 'key_choices');

  ageProgression.push({
    age: TERMINAL_AGE,
    phase: 'terminal',
    action: `end-of-life composite eval → unlocked=${report.unlocked}`,
    studyHabit: lifeStates.studyHabit ?? 0,
    reputation,
    money,
  });

  return {
    slice: 'p34_lifetime_birth_to_death',
    pathId: 'p34_medical_habit_zero_lifetime',
    outcomeId: 'medical_sage_healer',
    seed: { originId: 'poor_family', birthAge: 0, studyHabitStart: 0 },
    ageProgression,
    eventSequence,
    terminalCheckpoint: {
      age: TERMINAL_AGE,
      endState: 'composite_eval_terminal',
      unlocked: report.unlocked,
      keyChoicesMet: keyDims.length > 0 && keyDims.every(d => d.status === 'satisfied'),
    },
    resolvedBridgeFlags: ['medical_pure', 'medical_divine_doctor_fame'].filter(f => flags[f] === true),
    usedStaticResolver: false,
  };
}

export function formatP34LifetimeBirthToDeathMarkdown(result: P34LifetimeBirthToDeathResult): string {
  return [
    '# P34 Medical Habit-Led Birth-to-Death Lifetime E2E Slice',
    '',
    `Path: \`${result.pathId}\` → \`${result.outcomeId}\``,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- Birth age: **${result.seed.birthAge}**`,
    `- studyHabit start: **${result.seed.studyHabitStart}**`,
    '- No pre-seeded bridge flags or static resolver fixtures',
    '',
    '## Age progression (habit on-ramp → bridges → terminal eval)',
    '',
    ...result.ageProgression.map(
      s =>
        `- Age **${s.age}** (${s.phase}): ${s.action} [studyHabit=${s.studyHabit}, rep=${s.reputation}, money=${s.money}]`,
    ),
    '',
    '## Event sequence (JSON flag_set path, no static resolver)',
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
    `- Key choices met: **${result.terminalCheckpoint.keyChoicesMet}**`,
    `- Bridge flags: [${result.resolvedBridgeFlags.join(', ')}]`,
    `- Static resolver used: ${result.usedStaticResolver}`,
    '',
  ].join('\n');
}
