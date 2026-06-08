import type { WorldProfileStatEntry } from './types';

/** Wuxia player-facing and scheduling-relevant stats — metadata only; save shape unchanged. */
export const WUXIA_PROFILE_STATS: WorldProfileStatEntry[] = [
  { id: 'martialPower', label: '功力', role: 'player_facing' },
  { id: 'externalSkill', label: '外功', role: 'player_facing' },
  { id: 'internalSkill', label: '内功', role: 'player_facing' },
  { id: 'qinggong', label: '轻功', role: 'player_facing' },
  { id: 'constitution', label: '体魄', role: 'player_facing' },
  { id: 'comprehension', label: '悟性', role: 'implicit' },
  { id: 'charisma', label: '魅力', role: 'action_reward' },
  { id: 'connections', label: '人脉', role: 'action_reward' },
  { id: 'reputation', label: '声望', role: 'implicit' },
  { id: 'chivalry', label: '侠义', role: 'implicit' },
  { id: 'knowledge', label: '学识', role: 'scheduling_relevant' },
  { id: 'money', label: '银两', role: 'scheduling_relevant' },
  { id: 'energy', label: '精力', role: 'action_reward' },
  { id: 'businessAcumen', label: '经营', role: 'action_reward' },
];
