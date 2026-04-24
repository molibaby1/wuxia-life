import type { TemperamentConfig } from '../../types/eventTypes';

export const temperaments: TemperamentConfig[] = [
  {
    id: 'competitive',
    name: '好胜',
    summary: '不愿认输，常会硬顶。',
    flavor: '你总不愿轻易认输。',
    eventBiases: [
      { tag: 'training', multiplier: 1.15 },
      { tag: 'risk', multiplier: 1.25 },
      { tag: 'reputation', multiplier: 1.1 },
    ],
    autoChoiceBias: { aggressive: 0.25, cautious: -0.1 },
  },
  {
    id: 'affectionate',
    name: '重情',
    summary: '关系影响更深，也更容易为情所困。',
    flavor: '你把人与人之间的牵连看得很重。',
    eventBiases: [
      { tag: 'romance', multiplier: 1.35 },
      { tag: 'family', multiplier: 1.35 },
      { tag: 'social', multiplier: 1.15 },
    ],
    startingStates: [{ state: 'familyBond', value: 1 }],
    autoChoiceBias: { relational: 0.25, profitable: -0.1 },
  },
  {
    id: 'profit_driven',
    name: '逐利',
    summary: '做事更看投入产出。',
    flavor: '你做事常先看得失。',
    eventBiases: [
      { tag: 'business', multiplier: 1.35 },
      { tag: 'social', multiplier: 1.05 },
      { tag: 'family', multiplier: 0.95 },
    ],
    autoChoiceBias: { profitable: 0.25 },
  },
  {
    id: 'orderly',
    name: '守序',
    summary: '更愿意走规则和名分明确的路。',
    flavor: '你对规矩和名分总更看重些。',
    eventBiases: [
      { tag: 'discipline', multiplier: 1.2 },
      { tag: 'risk', multiplier: 0.9 },
      { tag: 'reputation', multiplier: 1.1 },
    ],
    autoChoiceBias: { cautious: 0.15, disciplined: 0.1 },
  },
  {
    id: 'adventurous',
    name: '冒险',
    summary: '喜欢试一把，也更容易卷入高风险高收益局面。',
    flavor: '你不怕试，甚至有些喜欢去赌一把。',
    eventBiases: [
      { tag: 'risk', multiplier: 1.35 },
      { tag: 'survival', multiplier: 1.1 },
      { tag: 'discipline', multiplier: 0.9 },
    ],
    autoChoiceBias: { aggressive: 0.15, cautious: -0.2 },
  },
  {
    id: 'risk_averse',
    name: '避险',
    summary: '更倾向稳妥和保存实力。',
    flavor: '你并非胆怯，只是更愿意把路走稳。',
    eventBiases: [
      { tag: 'risk', multiplier: 0.82 },
      { tag: 'family', multiplier: 1.1 },
      { tag: 'survival', multiplier: 1.15 },
    ],
    autoChoiceBias: { cautious: 0.25, aggressive: -0.1 },
  },
  {
    id: 'disciplined',
    name: '自律',
    summary: '更能长期坚持，成长更稳。',
    flavor: '你擅长把日子一点一点过成自己的样子。',
    eventBiases: [
      { tag: 'discipline', multiplier: 1.35 },
      { tag: 'training', multiplier: 1.15 },
      { tag: 'indulgence', multiplier: 0.75 },
    ],
    startingStates: [{ state: 'discipline', value: 1 }],
    autoChoiceBias: { disciplined: 0.3, indulgent: -0.2 },
  },
  {
    id: 'indulgent',
    name: '放纵',
    summary: '更容易追逐眼前快意，也更容易分心。',
    flavor: '你常把当下的痛快看得更重一些。',
    eventBiases: [
      { tag: 'indulgence', multiplier: 1.4 },
      { tag: 'discipline', multiplier: 0.75 },
      { tag: 'social', multiplier: 1.1 },
    ],
    startingStates: [{ state: 'indulgence', value: 1 }],
    autoChoiceBias: { indulgent: 0.3, disciplined: -0.15 },
  },
];
