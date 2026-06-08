import type { WorldProfileActionFamily } from './types';

/** 0-40 slice action directions — actionIds reference activeActionCatalog, not a duplicate catalog. */
export const WUXIA_PROFILE_ACTION_FAMILIES: WorldProfileActionFamily[] = [
  {
    id: 'martial_training',
    label: '习武',
    category: 'training',
    actionIds: ['action_training_basic'],
  },
  {
    id: 'scholarly_study',
    label: '治学',
    category: 'study',
    actionIds: ['action_study_basic'],
  },
  {
    id: 'social_network',
    label: '交游',
    category: 'socializing',
    actionIds: ['action_socializing_basic'],
  },
  {
    id: 'wealth_business',
    label: '营商',
    category: 'business',
    actionIds: ['action_business_basic'],
  },
  {
    id: 'wanderer_travel',
    label: '游历',
    category: 'travel',
    actionIds: ['action_travel_basic'],
  },
];
