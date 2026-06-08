/**
 * P9 echo hook skeleton — early action/choice to later callback mapping.
 */

export type EchoCallbackTarget = 'event_text' | 'route_signal' | 'summary_text';
export type EchoSummarySlot = 'early_life' | 'turning_point' | 'age40_identity';
export type EchoSummaryTextSourceKind = 'flag_value' | 'description';

export interface EchoSummaryTextSource {
  kind: EchoSummaryTextSourceKind;
  flagKey?: string;
}

export interface EchoSummaryContribution {
  enabled: boolean;
  slot: EchoSummarySlot;
  variableName: string;
  order: number;
  textSources: EchoSummaryTextSource[];
}

export interface EchoHook {
  id: string;
  sourceActionId?: string;
  sourceChoiceId?: string;
  hookFlag: string;
  callbackEventId: string;
  callbackAgeMin: number;
  callbackAgeMax: number;
  targets: EchoCallbackTarget[];
  summaryContribution?: EchoSummaryContribution;
  description: string;
}

export const WUXIA_ECHO_HOOKS: EchoHook[] = [
  {
    id: 'echo_training_basic',
    sourceActionId: 'action_training_basic',
    hookFlag: 'p9_echo_training_hook',
    callbackEventId: 'p9_training_echo_midlife',
    callbackAgeMin: 26,
    callbackAgeMax: 28,
    targets: ['event_text', 'summary_text'],
    summaryContribution: {
      enabled: true,
      slot: 'age40_identity',
      variableName: 'echo_suffix',
      order: 10,
      textSources: [{ kind: 'flag_value', flagKey: 'p9_summary_echo_training' }, { kind: 'description' }],
    },
    description: '幼年练功 → 中段功底显现',
  },
  {
    id: 'echo_business_basic',
    sourceActionId: 'action_business_basic',
    hookFlag: 'p9_echo_business_hook',
    callbackEventId: 'p9_business_echo_midlife',
    callbackAgeMin: 28,
    callbackAgeMax: 30,
    targets: ['event_text', 'route_signal'],
    description: '幼年营商 → 营商旧梦',
  },
  {
    id: 'echo_travel_basic',
    sourceActionId: 'action_travel_basic',
    hookFlag: 'p9_echo_travel_hook',
    callbackEventId: 'p9_wanderer_midlife_discovery',
    callbackAgeMin: 28,
    callbackAgeMax: 32,
    targets: ['event_text', 'route_signal'],
    description: '幼年游历 → 远游记名',
  },
  {
    id: 'echo_study_basic',
    sourceActionId: 'action_study_basic',
    hookFlag: 'p9_echo_study_hook',
    callbackEventId: 'p9_study_echo_midlife',
    callbackAgeMin: 24,
    callbackAgeMax: 28,
    targets: ['event_text', 'summary_text'],
    summaryContribution: {
      enabled: true,
      slot: 'age40_identity',
      variableName: 'echo_suffix',
      order: 20,
      textSources: [{ kind: 'flag_value', flagKey: 'p9_summary_echo_study' }, { kind: 'description' }],
    },
    description: '幼年读书 → 学识回响',
  },
  {
    id: 'echo_social_basic',
    sourceActionId: 'action_socializing_basic',
    hookFlag: 'p9_echo_social_hook',
    callbackEventId: 'p9_social_echo_midlife',
    callbackAgeMin: 26,
    callbackAgeMax: 30,
    targets: ['event_text', 'route_signal', 'summary_text'],
    summaryContribution: {
      enabled: true,
      slot: 'age40_identity',
      variableName: 'echo_suffix',
      order: 30,
      textSources: [{ kind: 'flag_value', flagKey: 'p9_summary_echo_social' }, { kind: 'description' }],
    },
    description: '幼年交游 → 人脉回响',
  },
  {
    id: 'echo_deviant_identity',
    hookFlag: 'p9_route_identity_deviant',
    callbackEventId: 'p9_deviant_fork_temptation',
    callbackAgeMin: 23,
    callbackAgeMax: 29,
    targets: ['route_signal', 'summary_text'],
    summaryContribution: {
      enabled: true,
      slot: 'age40_identity',
      variableName: 'echo_suffix',
      order: 40,
      textSources: [{ kind: 'flag_value', flagKey: 'p9_summary_echo_deviant' }, { kind: 'description' }],
    },
    description: '邪路偏锋的习惯延续至今',
  },
];

export function getEchoHookByActionId(actionId: string): EchoHook | undefined {
  return WUXIA_ECHO_HOOKS.find(h => h.sourceActionId === actionId);
}

export function getEchoHookByFlag(flag: string): EchoHook | undefined {
  return WUXIA_ECHO_HOOKS.find(h => h.hookFlag === flag);
}

export function getAllEchoHooks(): EchoHook[] {
  return WUXIA_ECHO_HOOKS;
}
