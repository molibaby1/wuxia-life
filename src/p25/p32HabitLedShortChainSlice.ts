/**
 * P32 habit-led short-chain sim slice — event-driven unlock without static resolver.
 *
 * Renown path seed + sequence:
 * - Player: socialMomentum=2, stat gates met (martial 50, rep 70, connections 60), no key_choice flags
 * - Event sequence: `p28_social_reputation_reinforcement` → positive choice `attend_banquet`
 * - Outcome: `jianghu_renown_sage` unlock via JSON `ally_network` (not direct fixture seed)
 */
import { evaluateCompositeDestinyOutcome } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { EventLoader } from '../core/EventLoader';
import { applyEventChoiceFlagSets } from './p32BridgeParity';

export interface P32ShortChainStep {
  eventId: string;
  choiceIndex: number;
  choiceLabel: string;
  flagsAfter: string[];
}

export interface P32ShortChainSliceResult {
  slice: 'p32_habit_led_short_chain';
  pathId: string;
  outcomeId: 'jianghu_renown_sage' | 'medical_sage_healer';
  seed: {
    originId: string;
    lifeStates: Record<string, number>;
    statSnapshot: { martialPower: number; reputation: number; connections: number; money: number };
  };
  eventSequence: P32ShortChainStep[];
  unlocked: boolean;
  keyChoicesMet: boolean;
  resolvedBridgeFlags: string[];
  usedStaticResolver: false;
}

const RENOWN_SHORT_CHAIN_PLAYER: Partial<PlayerState> = {
  age: 36,
  martialPower: 50,
  reputation: 70,
  connections: 60,
  money: 35,
  lifeStates: {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
    socialMomentum: 2,
    familyBond: 0,
  },
};

const MEDICAL_SHORT_CHAIN_PLAYER: Partial<PlayerState> = {
  age: 38,
  martialPower: 30,
  reputation: 60,
  connections: 25,
  money: 45,
  lifeStates: {
    trainingHabit: 0,
    studyHabit: 3,
    businessHabit: 0,
    socialMomentum: 0,
    familyBond: 0,
  },
};

/** Habit on-ramp → bridge event → composite eval for jianghu_renown_sage (no resolver). */
export function runP32RenownShortChainSlice(): P32ShortChainSliceResult {
  const eventId = 'p28_social_reputation_reinforcement';
  const choiceIndex = 0;
  const event = EventLoader.getInstance().getEventById(eventId)!;
  const choice = event.choices?.[choiceIndex];
  const flags = applyEventChoiceFlagSets(event, choiceIndex, {});

  const player = {
    name: 'p32-short-chain',
    traitProfile: { origin: 'scholar_house' },
    ...RENOWN_SHORT_CHAIN_PLAYER,
  } as PlayerState;

  const outcome = getWorldProfile('wuxia').compositeDestinyOutcomes!.find(
    o => o.id === 'jianghu_renown_sage',
  )!;
  const report = evaluateCompositeDestinyOutcome(outcome, player, flags);
  const keyDims = report.dimensions.filter(d => d.dimension === 'key_choices');

  return {
    slice: 'p32_habit_led_short_chain',
    pathId: 'p32_renown_event_driven_short_chain',
    outcomeId: 'jianghu_renown_sage',
    seed: {
      originId: 'scholar_house',
      lifeStates: RENOWN_SHORT_CHAIN_PLAYER.lifeStates as Record<string, number>,
      statSnapshot: {
        martialPower: RENOWN_SHORT_CHAIN_PLAYER.martialPower!,
        reputation: RENOWN_SHORT_CHAIN_PLAYER.reputation!,
        connections: RENOWN_SHORT_CHAIN_PLAYER.connections!,
        money: RENOWN_SHORT_CHAIN_PLAYER.money!,
      },
    },
    eventSequence: [
      {
        eventId,
        choiceIndex,
        choiceLabel: choice?.id ?? choice?.text ?? 'attend_banquet',
        flagsAfter: Object.keys(flags).filter(k => flags[k] === true),
      },
    ],
    unlocked: report.unlocked,
    keyChoicesMet: keyDims.length > 0 && keyDims.every(d => d.status === 'satisfied'),
    resolvedBridgeFlags: ['ally_network'].filter(f => flags[f] === true),
    usedStaticResolver: false,
  };
}

/** studyHabit threshold → p27 positive → p29 positive → composite eval for medical_sage_healer (no resolver). */
export function runP33MedicalShortChainSlice(): P32ShortChainSliceResult {
  const loader = EventLoader.getInstance();
  const p27Event = loader.getEventById('p27_study_habit_healer_reinforcement')!;
  const p29Event = loader.getEventById('p29_study_habit_case_record_duty')!;
  const p27Choice = p27Event.choices?.[0];
  const p29Choice = p29Event.choices?.[0];

  let flags = applyEventChoiceFlagSets(p27Event, 0, {});
  const flagsAfterP27 = Object.keys(flags).filter(k => flags[k] === true);
  flags = applyEventChoiceFlagSets(p29Event, 0, flags);
  const flagsAfterP29 = Object.keys(flags).filter(k => flags[k] === true);

  const player = {
    name: 'p33-medical-short-chain',
    traitProfile: { origin: 'poor_family' },
    ...MEDICAL_SHORT_CHAIN_PLAYER,
  } as PlayerState;

  const outcome = getWorldProfile('wuxia').compositeDestinyOutcomes!.find(
    o => o.id === 'medical_sage_healer',
  )!;
  const report = evaluateCompositeDestinyOutcome(outcome, player, flags);
  const keyDims = report.dimensions.filter(d => d.dimension === 'key_choices');

  return {
    slice: 'p32_habit_led_short_chain',
    pathId: 'p33_medical_event_driven_short_chain',
    outcomeId: 'medical_sage_healer',
    seed: {
      originId: 'poor_family',
      lifeStates: MEDICAL_SHORT_CHAIN_PLAYER.lifeStates as Record<string, number>,
      statSnapshot: {
        martialPower: MEDICAL_SHORT_CHAIN_PLAYER.martialPower!,
        reputation: MEDICAL_SHORT_CHAIN_PLAYER.reputation!,
        connections: MEDICAL_SHORT_CHAIN_PLAYER.connections!,
        money: MEDICAL_SHORT_CHAIN_PLAYER.money!,
      },
    },
    eventSequence: [
      {
        eventId: 'p27_study_habit_healer_reinforcement',
        choiceIndex: 0,
        choiceLabel: p27Choice?.id ?? p27Choice?.text ?? '顺势钻研医理',
        flagsAfter: flagsAfterP27,
      },
      {
        eventId: 'p29_study_habit_case_record_duty',
        choiceIndex: 0,
        choiceLabel: p29Choice?.id ?? p29Choice?.text ?? '接下汇辑之责',
        flagsAfter: flagsAfterP29,
      },
    ],
    unlocked: report.unlocked,
    keyChoicesMet: keyDims.length > 0 && keyDims.every(d => d.status === 'satisfied'),
    resolvedBridgeFlags: ['medical_pure', 'medical_divine_doctor_fame'].filter(f => flags[f] === true),
    usedStaticResolver: false,
  };
}

export function formatP32ShortChainMarkdown(result: P32ShortChainSliceResult): string {
  return [
    '# P32 Habit-Led Short-Chain Sim Slice',
    '',
    `Path: \`${result.pathId}\` → \`${result.outcomeId}\``,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- lifeStates: ${JSON.stringify(result.seed.lifeStates)}`,
    `- Stats: ${JSON.stringify(result.seed.statSnapshot)}`,
    '',
    '## Event sequence (JSON flag_set path, no static resolver)',
    '',
    ...result.eventSequence.map(
      (s, i) =>
        `${i + 1}. \`${s.eventId}\` choice ${s.choiceIndex} (\`${s.choiceLabel}\`) → flags [${s.flagsAfter.join(', ')}]`,
    ),
    '',
    '## Outcome',
    '',
    `- Unlocked: **${result.unlocked}**`,
    `- Key choices met: **${result.keyChoicesMet}**`,
    `- Bridge flags: [${result.resolvedBridgeFlags.join(', ')}]`,
    `- Static resolver used: ${result.usedStaticResolver}`,
    '',
  ].join('\n');
}
