/**
 * P9 echo hook skeleton — early action/choice to later callback mapping.
 */

export type EchoCallbackTarget = 'event_text' | 'route_signal' | 'summary_text';

export interface EchoHook {
  id: string;
  sourceActionId?: string;
  sourceChoiceId?: string;
  hookFlag: string;
  callbackEventId: string;
  callbackAgeMin: number;
  callbackAgeMax: number;
  targets: EchoCallbackTarget[];
  summaryFlag?: string;
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
    summaryFlag: 'p9_summary_echo_training',
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
    summaryFlag: 'p9_summary_echo_study',
    description: '幼年读书 → 学识回响',
  },
  {
    id: 'echo_social_basic',
    sourceActionId: 'action_socializing_basic',
    hookFlag: 'p9_echo_social_hook',
    callbackEventId: 'p9_social_echo_midlife',
    callbackAgeMin: 26,
    callbackAgeMax: 30,
    targets: ['event_text', 'route_signal'],
    summaryFlag: 'p9_summary_echo_social',
    description: '幼年交游 → 人脉回响',
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
