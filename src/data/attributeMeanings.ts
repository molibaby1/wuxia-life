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
    key: 'externalSkill',
    name: '外功',
    purpose: '招式技巧，决定外家拳法与兵刃威力',
    examples: ['练剑', '擂台比试'],
    visibilityTier: 'explicit',
  },
  {
    key: 'internalSkill',
    name: '内功',
    purpose: '内力修为，支撑长战与高深武学',
    examples: ['打坐', '传功'],
    visibilityTier: 'explicit',
  },
  {
    key: 'qinggong',
    name: '轻功',
    purpose: '身法速度，影响闪避与追击',
    examples: ['夜探', '逃命'],
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
    key: 'comprehension',
    name: '悟性',
    purpose: '领悟速度，影响研读秘籍与自创招式',
    examples: ['观武', '闭关顿悟'],
    visibilityTier: 'semi_implicit',
  },
  {
    key: 'charisma',
    name: '魅力',
    purpose: '说服与社交倾向，影响 NPC 态度',
    examples: ['宴饮', '调解纠纷'],
    visibilityTier: 'semi_implicit',
  },
  {
    key: 'connections',
    name: '人脉',
    purpose: '关系网络广度，影响情报与援手',
    examples: ['引荐', '求助'],
    visibilityTier: 'semi_implicit',
  },
  {
    key: 'reputation',
    name: '声望',
    purpose: '江湖名望，解锁高门槛事件',
    examples: ['侠名远播', '恶名昭彰'],
    visibilityTier: 'implicit',
  },
  {
    key: 'chivalry',
    name: '侠义',
    purpose: '道德倾向，影响正邪分支权重',
    examples: ['锄强扶弱', '见利忘义'],
    visibilityTier: 'implicit',
  },
  {
    key: 'money',
    name: '银两',
    purpose: '当前可用钱财，支撑行动与消费',
    examples: ['购书', '宴请'],
    visibilityTier: 'explicit',
  },
  {
    key: 'knowledge',
    name: '学识',
    purpose: '文化修养，影响科举与谋略选项',
    examples: ['科举', '献策'],
    visibilityTier: 'semi_implicit',
  },
];

export const ALWAYS_VISIBLE_ATTRIBUTE_KEYS = [
  'martialPower',
  'externalSkill',
  'internalSkill',
  'qinggong',
  'constitution',
  'money',
];

export function getAttributeMeaning(key: string): AttributeMeaningDefinition | undefined {
  return attributeMeaningCatalog.find(entry => entry.key === key);
}

export function defaultSelfAwareness(player: { comprehension?: number }): number {
  return Math.min(100, Math.max(0, (player.comprehension ?? 0) + 20));
}

export function fuzzyLabelForStat(key: string): string {
  const map: Record<string, string> = {
    reputation: '江湖传闻中你的名字时隐时现',
    chivalry: '行事风格正邪难辨',
    comprehension: '似有所悟，难以言表',
    charisma: '旁人对你观感不一',
    connections: '似乎识得一些人，但关系深浅未知',
  };
  return map[key] ?? '尚不清楚';
}

export function preciseLabelForStat(key: string, value: number): string {
  const meaning = getAttributeMeaning(key);
  const name = meaning?.name ?? key;
  return `${name} ${value}`;
}
