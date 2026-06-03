import type { ActiveActionDefinition } from '../types/activeActionTypes';

export const P7_MINIMUM_ACTION_IDS = ['action_training_basic', 'action_study_basic', 'action_socializing_basic'] as const;

export type P7MinimumActionId = (typeof P7_MINIMUM_ACTION_IDS)[number];

export const activeActionCatalog: ActiveActionDefinition[] = [
  {
    id: 'action_training_basic',
    category: 'training',
    name: '练功',
    playerIntent: '专注习武，提升武功根基',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'externalSkill', min: 2, max: 4 },
      { stat: 'internalSkill', min: 1, max: 3 },
      { stat: 'martialPower', min: 1, max: 2 },
      { stat: 'constitution', min: 0, max: 1 },
    ],
    costs: [
      { stat: 'energy', amount: 5 },
      { stat: 'money', amount: 10 },
    ],
    risk: 'low',
    metadata: { focusTag: 'martial' },
  },
  {
    id: 'action_study_basic',
    category: 'study',
    name: '读书',
    playerIntent: '研习典籍，开阔见识',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'comprehension', min: 2, max: 4 },
      { stat: 'knowledge', min: 2, max: 3 },
      { stat: 'charisma', min: 0, max: 1 },
    ],
    costs: [
      { stat: 'money', amount: 15 },
      { stat: 'energy', amount: 3 },
    ],
    risk: 'low',
    metadata: { focusTag: 'scholarly' },
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
  },
];

export function getActionById(actionId: string): ActiveActionDefinition | undefined {
  return activeActionCatalog.find(action => action.id === actionId);
}

export function getMinimumActions(): ActiveActionDefinition[] {
  return activeActionCatalog.filter(action => P7_MINIMUM_ACTION_IDS.includes(action.id as P7MinimumActionId));
}
