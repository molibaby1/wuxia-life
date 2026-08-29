export type AttributeVisibilityTier = 'explicit' | 'semi_implicit' | 'implicit' | 'hidden';

export interface AttributeMeaningDefinition {
  key: string;
  name: string;
  purpose: string;
  examples: string[];
  visibilityTier: AttributeVisibilityTier;
}

export const attributeMeaningCatalog: AttributeMeaningDefinition[] = [
  {
    key: 'martialPower',
    name: '功力',
    purpose: '综合武力水平，影响战斗与江湖地位',
    examples: ['切磋胜负', '门派考核'],
    visibilityTier: 'explicit',
  },
  {
    key: 'constitution',
    name: '体魄',
    purpose: '身体底子，影响耐伤与恢复',
    examples: ['负重远途', '受伤恢复'],
    visibilityTier: 'explicit',
  },
  {
    key: 'knowledge',
    name: '学识',
    purpose: '知识、理解、文化和学习能力，影响读书、谋划与需要见识的选择',
    examples: ['研读典籍', '科举献策'],
    visibilityTier: 'explicit',
  },
  {
    key: 'connections',
    name: '人脉',
    purpose: '关系网络广度，影响情报与援手',
    examples: ['引荐', '求助'],
    visibilityTier: 'explicit',
  },
  {
    key: 'reputation',
    name: '名望',
    purpose: '江湖名望，解锁高门槛事件',
    examples: ['侠名远播', '恶名昭彰'],
    visibilityTier: 'explicit',
  },
  {
    key: 'chivalry',
    name: '侠义声誉',
    purpose: '外界对行为与品行的评价，允许正值、负值或中立',
    examples: ['锄强扶弱', '见利忘义'],
    visibilityTier: 'explicit',
  },
];

export const ALWAYS_VISIBLE_ATTRIBUTE_KEYS = [
  'martialPower',
  'constitution',
  'knowledge',
  'connections',
  'reputation',
  'chivalry',
];

export function getAttributeMeaning(key: string): AttributeMeaningDefinition | undefined {
  return attributeMeaningCatalog.find(entry => entry.key === key);
}

export function defaultSelfAwareness(player: { knowledge?: number }): number {
  return Math.min(100, Math.max(0, (player.knowledge ?? 0) + 20));
}

export function fuzzyLabelForStat(key: string): string {
  const map: Record<string, string> = {
    reputation: '江湖传闻中你的名字时隐时现',
    chivalry: '行事风格正邪难辨',
    knowledge: '积累尚浅，许多道理还未融会贯通',
    connections: '似乎识得一些人，但关系深浅未知',
  };
  return map[key] ?? '尚不清楚';
}

export function preciseLabelForStat(key: string, value: number): string {
  const meaning = getAttributeMeaning(key);
  const name = meaning?.name ?? key;
  return `${name} ${value}`;
}
