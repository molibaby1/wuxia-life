import type { ActiveActionDefinition } from '../types/activeActionTypes';

/**
 * Age-appropriate childhood actions — same categories as P7 minimum set,
 * but framed for upbringing (no adult commerce / mature networking / long travel).
 */
export const childhoodActionCatalog: ActiveActionDefinition[] = [
  {
    id: 'action_childhood_yard_play',
    category: 'training',
    name: '院中玩耍',
    playerIntent: '在庭院里与玩伴追逐嬉闹，模仿大人招式，活动筋骨',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'constitution', min: 0, max: 2 },
    ],
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'martial', childhoodTier: 'lite', ageBand: '5-6' },
    onCompleteFlags: ['p9_echo_training_hook'],
  },
  {
    id: 'action_childhood_training',
    category: 'training',
    name: '玩耍练功',
    playerIntent: '在家人看护下活动筋骨，模仿大人练几式基本功',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'constitution', min: 1, max: 2 },
    ],
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'martial', childhoodTier: 'lite' },
    habitEffects: [{ state: 'trainingHabit', value: 1 }],
    onCompleteFlags: ['p9_echo_training_hook', 'p9_early_training_focus'],
  },
  {
    id: 'action_study_lite',
    category: 'study',
    name: '听先生讲课',
    playerIntent: '坐在堂前认字听书，由长辈或私塾先生启蒙',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'knowledge', min: 1, max: 2 },
    ],
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'scholarly', childhoodTier: 'lite' },
    habitEffects: [{ state: 'studyHabit', value: 1 }],
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
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'social', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_social_hook'],
  },
  {
    id: 'action_household_errand',
    category: 'business',
    name: '帮家里跑腿',
    playerIntent: '替家里记小账、送小件、认摊认货，先学最基础的营生分寸',
    duration: { value: 1, unit: 'month' },
    rewards: [
      { stat: 'businessAcumen', min: 1, max: 1 },
      { stat: 'knowledge', min: 0, max: 1 },
    ],
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'business', childhoodTier: 'lite', ageBand: '5-6' },
    onCompleteFlags: ['p9_echo_business_hook'],
  },
  {
    id: 'action_household_apprentice',
    category: 'business',
    name: '帮家里打杂',
    playerIntent: '帮长辈记账、看摊、跑腿收摊，学着分辨货价与柴米油盐',
    duration: { value: 1, unit: 'quarter' },
    rewards: [
      { stat: 'businessAcumen', min: 1, max: 2 },
    ],
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'business', childhoodTier: 'lite' },
    habitEffects: [{ state: 'businessHabit', value: 1 }],
    onCompleteFlags: ['p9_echo_business_hook'],
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
    costs: [],
    risk: 'low',
    metadata: { focusTag: 'exploration', childhoodTier: 'lite' },
    onCompleteFlags: ['p9_echo_travel_hook'],
  },
];

export function getChildhoodActionById(actionId: string): ActiveActionDefinition | undefined {
  return childhoodActionCatalog.find(action => action.id === actionId);
}
