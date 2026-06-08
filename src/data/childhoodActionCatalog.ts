import type { ActiveActionDefinition } from '../types/activeActionTypes';

/**
 * Age-appropriate childhood actions — same categories as P7 minimum set,
 * but framed for upbringing (no adult commerce / mature networking / long travel).
 */
export const childhoodActionCatalog: ActiveActionDefinition[] = [
  {
    id: 'action_childhood_training',
    category: 'training',
    name: '玩耍练功',
    playerIntent: '在家人看护下活动筋骨，模仿大人练几式基本功',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'externalSkill', min: 1, max: 2 },
      { stat: 'constitution', min: 0, max: 1 },
      { stat: 'martialPower', min: 0, max: 1 },
    ],
    costs: [{ stat: 'energy', amount: 3 }],
    risk: 'low',
    metadata: { focusTag: 'martial', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_training_hook', 'p9_early_training_focus'],
  },
  {
    id: 'action_study_lite',
    category: 'study',
    name: '听先生讲课',
    playerIntent: '坐在堂前认字听书，由长辈或私塾先生启蒙',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'comprehension', min: 1, max: 3 },
      { stat: 'knowledge', min: 1, max: 2 },
    ],
    costs: [{ stat: 'energy', amount: 2 }],
    risk: 'low',
    metadata: { focusTag: 'scholarly', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_study_hook'],
  },
  {
    id: 'action_socializing_lite',
    category: 'socializing',
    name: '与玩伴相处',
    playerIntent: '在街巷或亲戚家中与同龄孩子玩耍、听故事、学人情世故',
    duration: { value: 1, unit: 'month' },
    rewards: [
      { stat: 'connections', min: 1, max: 2 },
      { stat: 'charisma', min: 0, max: 2 },
    ],
    costs: [{ stat: 'energy', amount: 2 }],
    risk: 'low',
    metadata: { focusTag: 'social', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_social_hook', 'p9_early_social_focus'],
  },
  {
    id: 'action_household_apprentice',
    category: 'business',
    name: '帮家里打杂',
    playerIntent: '帮长辈记账、看摊、跑腿收摊，学着分辨货价与柴米油盐',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'money', min: 3, max: 10 },
      { stat: 'businessAcumen', min: 0, max: 2 },
    ],
    costs: [{ stat: 'energy', amount: 3 }],
    risk: 'low',
    metadata: { focusTag: 'wealth', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_business_hook', 'p9_early_business_focus'],
  },
  {
    id: 'action_errand_nearby',
    category: 'travel',
    name: '街坊跑腿',
    playerIntent: '在附近街巷、集市或村口为人捎信带货，见识一点外面的世界',
    duration: { value: 1, unit: 'month' },
    rewards: [
      { stat: 'knowledge', min: 0, max: 2 },
      { stat: 'constitution', min: 0, max: 1 },
      { stat: 'connections', min: 0, max: 1 },
    ],
    costs: [{ stat: 'energy', amount: 3 }],
    risk: 'low',
    metadata: { focusTag: 'exploration', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_travel_hook', 'p9_early_travel_focus'],
  },
];

export function getChildhoodActionById(actionId: string): ActiveActionDefinition | undefined {
  return childhoodActionCatalog.find(action => action.id === actionId);
}
