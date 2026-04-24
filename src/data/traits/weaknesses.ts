import type { WeaknessConfig } from '../../types/eventTypes';

export const weaknesses: WeaknessConfig[] = [
  {
    id: 'frail',
    name: '体弱',
    summary: '恢复慢，苦修与伤病更伤身。',
    flavor: '你天生身子骨偏弱，很多别人扛得住的苦，对你来说都更重。',
    initialStats: [
      { stat: 'constitution', value: -5 },
      { stat: 'health', value: -15 },
    ],
    growthModifiers: [{ stat: 'constitution', multiplier: 0.82 }],
    eventBiases: [
      { tag: 'training', multiplier: 0.9 },
      { tag: 'survival', multiplier: 1.25 },
    ],
    stateBiases: [{ state: 'fatigue', value: 1 }],
    resultModifiers: { failureBonus: 0.15, stressBonus: 0.1 },
    removable: false,
  },
  {
    id: 'slow_witted',
    name: '迟钝',
    summary: '很多道理总要慢几拍才懂。',
    flavor: '你不是不努力，只是很多道理总要比别人慢几拍才想得明白。',
    initialStats: [
      { stat: 'comprehension', value: -5 },
      { stat: 'knowledge', value: -2 },
    ],
    growthModifiers: [
      { stat: 'comprehension', multiplier: 0.82 },
      { stat: 'internalSkill', multiplier: 0.9 },
    ],
    eventBiases: [{ tag: 'comprehension', multiplier: 0.75 }],
    removable: false,
  },
  {
    id: 'lazy',
    name: '好逸恶劳',
    summary: '长期苦功更难坚持，容易分心偷懒。',
    flavor: '你总容易在关键时候觉得“明天再说也不迟”。',
    growthModifiers: [{ stat: 'martialPower', multiplier: 0.9 }],
    eventBiases: [
      { tag: 'discipline', multiplier: 0.75 },
      { tag: 'indulgence', multiplier: 1.4 },
      { tag: 'training', multiplier: 0.8 },
    ],
    stateBiases: [{ state: 'indulgence', value: 1 }],
    removable: false,
  },
  {
    id: 'soft_eared',
    name: '耳根软',
    summary: '容易被人说动，也容易被带偏。',
    flavor: '你太容易相信别人，也太容易被一句话改变主意。',
    eventBiases: [
      { tag: 'social', multiplier: 1.15 },
      { tag: 'risk', multiplier: 1.15 },
    ],
    resultModifiers: { failureBonus: 0.12 },
    removable: false,
  },
  {
    id: 'unstable_mood',
    name: '情绪不稳',
    summary: '心气起伏更大，关系和状态波动更明显。',
    flavor: '你的心气起伏比别人更大，好的时候锋芒毕露，坏的时候也容易失控。',
    initialStats: [{ stat: 'health', value: -5 }],
    eventBiases: [
      { tag: 'social', multiplier: 1.1 },
      { tag: 'family', multiplier: 1.15 },
      { tag: 'indulgence', multiplier: 1.15 },
    ],
    stateBiases: [{ state: 'anxiety', value: 1 }],
    removable: false,
  },
  {
    id: 'grand_dreams_poor_followthrough',
    name: '眼高手低',
    summary: '想得大，却不总能稳稳落地。',
    flavor: '你总想得很远、很大，可真正一步一步去做的时候，往往没那么稳。',
    growthModifiers: [
      { stat: 'knowledge', multiplier: 0.92 },
      { stat: 'businessAcumen', multiplier: 0.9 },
    ],
    eventBiases: [
      { tag: 'risk', multiplier: 1.1 },
      { tag: 'discipline', multiplier: 0.85 },
    ],
    removable: false,
  },
  {
    id: 'loner',
    name: '孤僻',
    summary: '不擅群体关系，更容易走向独处。',
    flavor: '你并不讨厌人，只是与人靠近总让你觉得疲惫。',
    initialStats: [
      { stat: 'connections', value: -4 },
      { stat: 'charisma', value: -2 },
      { stat: 'comprehension', value: 1 },
    ],
    growthModifiers: [
      { stat: 'connections', multiplier: 0.8 },
      { stat: 'charisma', multiplier: 0.85 },
    ],
    eventBiases: [
      { tag: 'social', multiplier: 0.7 },
      { tag: 'family', multiplier: 0.85 },
      { tag: 'comprehension', multiplier: 1.1 },
    ],
    removable: false,
  },
  {
    id: 'fear_of_responsibility',
    name: '怕担责',
    summary: '需要站出来的时候，常会下意识后退。',
    flavor: '真到了需要你站出来的时候，你总会下意识地想往后退半步。',
    initialStats: [
      { stat: 'influence', value: -3 },
      { stat: 'reputation', value: -1 },
    ],
    growthModifiers: [{ stat: 'influence', multiplier: 0.85 }],
    eventBiases: [
      { tag: 'risk', multiplier: 0.92 },
      { tag: 'social', multiplier: 0.95 },
    ],
    removable: false,
  },
];
