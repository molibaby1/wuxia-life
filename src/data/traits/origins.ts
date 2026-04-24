import type { OriginConfig } from '../../types/eventTypes';

export const origins: OriginConfig[] = [
  {
    id: 'martial_family',
    name: '武林世家',
    summary: '自小接触拳脚与江湖规矩。',
    flavor: '你生来就活在刀光剑影的影子里。',
    initialStats: [
      { stat: 'martialPower', value: 3 },
      { stat: 'externalSkill', value: 3 },
      { stat: 'reputation', value: 2 },
    ],
    earlyEventBiases: [
      { tag: 'training', multiplier: 1.4 },
      { tag: 'reputation', multiplier: 1.1 },
    ],
    startingFlags: ['origin_wuxia_family'],
  },
  {
    id: 'merchant_house',
    name: '商户之家',
    summary: '资源宽裕，也更早懂得钱与人情。',
    flavor: '你从小就知道柴米油盐的分量。',
    initialStats: [
      { stat: 'money', value: 150 },
      { stat: 'businessAcumen', value: 4 },
      { stat: 'connections', value: 2 },
    ],
    earlyEventBiases: [
      { tag: 'business', multiplier: 1.45 },
      { tag: 'social', multiplier: 1.1 },
    ],
    startingFlags: ['origin_merchant_family'],
  },
  {
    id: 'scholar_house',
    name: '书香门第',
    summary: '学识和礼法氛围更浓。',
    flavor: '你从小听的是书卷声，学的是规矩。',
    initialStats: [
      { stat: 'knowledge', value: 5 },
      { stat: 'comprehension', value: 3 },
    ],
    earlyEventBiases: [
      { tag: 'comprehension', multiplier: 1.4 },
      { tag: 'discipline', multiplier: 1.1 },
    ],
    startingFlags: ['origin_scholar_family'],
  },
  {
    id: 'frontier_military',
    name: '边地军户',
    summary: '耐力和生存本能更强，但人生更动荡。',
    flavor: '风沙、兵气和不确定，反而更像你的故乡。',
    initialStats: [
      { stat: 'constitution', value: 4 },
      { stat: 'health', value: 10 },
      { stat: 'reputation', value: -1 },
    ],
    earlyEventBiases: [
      { tag: 'survival', multiplier: 1.4 },
      { tag: 'risk', multiplier: 1.15 },
    ],
    startingFlags: ['origin_frontier_family'],
  },
  {
    id: 'poor_family',
    name: '寒门',
    summary: '资源更少，但上升意愿更强。',
    flavor: '一切向上的机会，对你来说都格外沉重。',
    initialStats: [
      { stat: 'money', value: -50 },
      { stat: 'constitution', value: 1 },
    ],
    earlyEventBiases: [
      { tag: 'business', multiplier: 1.15 },
      { tag: 'survival', multiplier: 1.25 },
      { tag: 'discipline', multiplier: 1.05 },
    ],
    startingFlags: ['origin_poor_family'],
  },
  {
    id: 'streetborn',
    name: '市井草根',
    summary: '适应力和人情嗅觉更强，但缺少稳定支撑。',
    flavor: '你自小就在烟火气里打滚，知道怎么活。',
    initialStats: [
      { stat: 'connections', value: 2 },
      { stat: 'charisma', value: 2 },
      { stat: 'money', value: -20 },
    ],
    earlyEventBiases: [
      { tag: 'social', multiplier: 1.2 },
      { tag: 'business', multiplier: 1.15 },
      { tag: 'family', multiplier: 1.05 },
    ],
    startingFlags: ['origin_streetborn'],
  },
];
