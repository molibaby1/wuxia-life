import type { WorldProfileIdentityTrack } from './types';

export const WUXIA_PROFILE_IDENTITY_TRACKS: WorldProfileIdentityTrack[] = [
  { id: 'merchant', label: '营商致富', routeIds: ['route_wealth'] },
  { id: 'wanderer', label: '游历江湖', routeIds: ['route_wanderer'] },
  { id: 'martial', label: '习武成名', routeIds: ['route_martial'] },
  { id: 'deviant', label: '邪路偏锋', routeIds: ['route_deviant'] },
  { id: 'scholar', label: '治学成名', routeIds: ['route_scholar'] },
  { id: 'social', label: '交游成名', routeIds: ['route_social'] },
  { id: 'cautious', label: '守拙持重', routeIds: ['route_cautious'] },
  { id: 'balanced', label: '文武兼修', routeIds: ['route_balanced'] },
];
