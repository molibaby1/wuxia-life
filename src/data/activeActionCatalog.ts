import { getChildhoodActionById } from './childhoodActionCatalog';
import { getProfileMinimumActionIds } from '../narrative/worldProfile';
import type { ActiveActionDefinition } from '../types/activeActionTypes';

export const P7_MINIMUM_ACTION_IDS = [
  'action_training_basic',
  'action_study_basic',
  'action_socializing_basic',
  'action_business_basic',
  'action_travel_basic',
] as const;

export type P7MinimumActionId = (typeof P7_MINIMUM_ACTION_IDS)[number];

export const activeActionCatalog: ActiveActionDefinition[] = [
  {
    id: 'action_training_basic',
    category: 'training',
    name: '练功',
    playerIntent: '专注习武，提升武功根基',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'martialPower', min: 1, max: 2 },
      { stat: 'constitution', min: 0, max: 1 },
    ],
    costs: [{ stat: 'money', amount: 10 }],
    risk: 'low',
    metadata: { focusTag: 'martial' },
    habitEffects: [{ state: 'trainingHabit', value: 1 }],
    onCompleteFlags: ['p9_echo_training_hook', 'p9_early_training_focus'],
  },
  {
    id: 'action_study_basic',
    category: 'study',
    name: '读书',
    playerIntent: '研习典籍，开阔见识',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'knowledge', min: 1, max: 3 },
    ],
    costs: [{ stat: 'money', amount: 10 }],
    risk: 'low',
    metadata: { focusTag: 'scholarly' },
    habitEffects: [{ state: 'studyHabit', value: 1 }],
    onCompleteFlags: ['p9_echo_study_hook'],
  },
  {
    id: 'action_socializing_basic',
    category: 'socializing',
    name: '交游',
    playerIntent: '结交朋友，拓展人脉',
    duration: { value: 1, unit: 'month' },
    rewards: [
      { stat: 'connections', min: 2, max: 4 },
      { stat: 'charisma', min: 1, max: 3 },
      { stat: 'reputation', min: 0, max: 1 },
    ],
    costs: [{ stat: 'money', amount: 20 }],
    risk: 'medium',
    metadata: { focusTag: 'social' },
    onCompleteFlags: ['p9_echo_social_hook', 'p9_early_social_focus'],
  },
  {
    id: 'action_business_basic',
    category: 'business',
    name: '营商',
    playerIntent: '经营小本买卖，积累银两与名望',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'money', min: 15, max: 35 },
      { stat: 'businessAcumen', min: 1, max: 3 },
      { stat: 'reputation', min: 0, max: 2 },
    ],
    costs: [{ stat: 'money', amount: 25 }],
    risk: 'medium',
    metadata: { focusTag: 'wealth', useCase: '缺钱或想做经营时优先' },
    habitEffects: [{ state: 'businessHabit', value: 1 }],
    onCompleteFlags: ['p9_echo_business_hook', 'p9_early_business_focus'],
  },
  {
    id: 'action_travel_basic',
    category: 'travel',
    name: '游历',
    playerIntent: '行走四方，增长见闻与人脉',
    duration: { value: 1, unit: 'month' },
    rewards: [
      { stat: 'knowledge', min: 1, max: 3 },
      { stat: 'connections', min: 1, max: 2 },
      { stat: 'reputation', min: 0, max: 1 },
    ],
    costs: [{ stat: 'money', amount: 15 }],
    risk: 'medium',
    metadata: { focusTag: 'exploration', useCase: '想开视野或触发奇遇时优先' },
    onCompleteFlags: ['p9_echo_travel_hook', 'p9_early_travel_focus'],
  },
];

export function getActionById(actionId: string): ActiveActionDefinition | undefined {
  return activeActionCatalog.find(action => action.id === actionId) ?? getChildhoodActionById(actionId);
}

export function getMinimumActions(): ActiveActionDefinition[] {
  const profileActionIds = getProfileMinimumActionIds();
  const ids = profileActionIds.length > 0 ? profileActionIds : [...P7_MINIMUM_ACTION_IDS];
  return activeActionCatalog.filter(action => ids.includes(action.id));
}
