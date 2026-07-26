export const LIFE_ROAD_IDS = ['martial', 'statecraft', 'official', 'hermit'] as const;

export type LifeRoadId = (typeof LIFE_ROAD_IDS)[number];

export const LIFE_ROAD_LABELS: Record<LifeRoadId, string> = {
  martial: '武道',
  statecraft: '经世',
  official: '仕途',
  hermit: '隐逸',
};

export const LIFE_ROAD_STAGES = ['inactive', 'temporary', 'active', 'locked_in', 'completed'] as const;

export type LifeRoadStage = (typeof LIFE_ROAD_STAGES)[number];

export const PUBLIC_ATTRIBUTE_KEYS = [
  'martialPower',
  'constitution',
  'knowledge',
  'connections',
  'reputation',
  'chivalry',
] as const;

export type PublicAttributeKey = (typeof PUBLIC_ATTRIBUTE_KEYS)[number];

export const PUBLIC_ATTRIBUTE_LABELS: Record<PublicAttributeKey, string> = {
  martialPower: '功力',
  constitution: '体魄',
  knowledge: '学识',
  connections: '人脉',
  reputation: '名望',
  chivalry: '侠义',
};

export const NON_ROAD_STATE_KEYS = ['money', 'lifeStates'] as const;

export type NonRoadStateKey = (typeof NON_ROAD_STATE_KEYS)[number];

export function isLifeRoadId(value: string): value is LifeRoadId {
  return (LIFE_ROAD_IDS as readonly string[]).includes(value);
}

export function isLifeRoadStage(value: string): value is LifeRoadStage {
  return (LIFE_ROAD_STAGES as readonly string[]).includes(value);
}

export function formatLifeRoadLabel(roadId: LifeRoadId | string | null | undefined): string {
  if (!roadId) {
    return '未定';
  }
  return isLifeRoadId(roadId) ? LIFE_ROAD_LABELS[roadId] : roadId;
}
