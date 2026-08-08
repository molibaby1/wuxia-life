import type { WorldProfileStatEntry } from './types';

/** Wuxia player-facing and scheduling-relevant stats — metadata only; save shape unchanged. */
export const WUXIA_PROFILE_STATS: WorldProfileStatEntry[] = [
  { id: 'martialPower', label: '功力', role: 'player_facing' },
  { id: 'constitution', label: '体魄', role: 'player_facing' },
  { id: 'knowledge', label: '学识', role: 'player_facing' },
  { id: 'connections', label: '人脉', role: 'action_reward' },
  { id: 'reputation', label: '名望', role: 'implicit' },
  { id: 'chivalry', label: '侠义声誉', role: 'implicit' },
  { id: 'charisma', label: '魅力', role: 'action_reward' },
  { id: 'businessAcumen', label: '经营', role: 'action_reward' },
  { id: 'influence', label: '影响力', role: 'scheduling_relevant' },
  { id: 'money', label: '银两', role: 'scheduling_relevant' },
];
