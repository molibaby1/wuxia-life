/**
 * 童年事件定义（0-12 岁）
 * 
 * 事件分类：MAIN_STORY（主线剧情）
 * 年龄范围：0-12 岁
 * 事件数量：5 个
 * 
 * 设计原则：
 * - 遵循标准化事件格式
 * - 保持故事连贯性
 * - 平衡趣味性和教育意义
 * - 为后续成长阶段铺垫
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { EventCategory, EventPriority, EffectType } from '../types/eventTypes';
import type { EventDefinition, EffectOperator } from '../types/eventTypes';

// ========== 出生事件（0 岁） ==========
/**
 * 事件 1: 降生武侠世家
 * 年龄: 0 岁
 * 类型: 自动事件
 * 效果: 年龄+1，可能触发天赋效果
 */
export const birthInWuxiaFamily: EventDefinition = {
  id: 'birth_wuxia_family',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 70,
  
  ageRange: { min: 0, max: 0 },
  triggers: [
    { type: 'age_reach', value: 0 },
  ],
  
  content: {
    text: '你降生在一个武侠世家，哭声洪亮，远近皆闻。家族长辈们都说，你天生就有习武之资。',
    title: '降生武侠世家',
    description: '人生的第一刻，命运的齿轮开始转动。',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
    {
      type: EffectType.FLAG_SET,
      target: 'bornInWuxiaFamily',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'birth_wuxia_family',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['出生', '主线', '武侠世家'],
    enabled: true,
  },
};

/**
 * 事件 2: 天降异象
 * 年龄: 0 岁
 * 类型: 自动事件（低权重，作为变体）
 * 效果: 年龄+1，触发特殊天赋
 */
export const birthWithPhenomenon: EventDefinition = {
  id: 'birth_with_phenomenon',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 20,
  
  ageRange: { min: 0, max: 0 },
  triggers: [
    { type: 'age_reach', value: 0 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'Math.random() < 0.25', // 25% 概率触发
    },
  ],
  
  content: {
    text: '你出生时天有异象，一道金光从天而降，笼罩了整个府邸。族中长老惊叹：「此子非凡，将来必成大器！」',
    title: '天降异象',
    description: '特殊的出生预示着不平凡的人生。',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'internalSkill',
      value: 5,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'bornWithBlessing',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'birth_with_phenomenon',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['出生', '主线', '异象', '天赋'],
    enabled: true,
  },
};

// ========== 幼年成长事件（1-6 岁） ==========
/**
 * 事件 3: 学步探索
 * 年龄: 1 岁
 * 类型: 自动事件
 * 效果: 年龄+1，开启探索能力
 */
export const toddlerExploration: EventDefinition = {
  id: 'toddler_exploration',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 80,
  
  ageRange: { min: 1, max: 1 },
  triggers: [
    { type: 'age_reach', value: 1 },
  ],
  
  content: {
    text: '你学会了走路，开始在家中四处探索，经常搞些小破坏，但也因此发现了许多有趣的秘密。',
    title: '探索小能手',
    description: '好奇心是成长的开始。',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'qinggong',
      value: 1,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'curiousChild',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'toddler_exploration',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['童年', '探索', '轻功'],
    enabled: true,
  },
};

/**
 * 事件 4: 伶牙俐齿
 * 年龄: 3 岁
 * 类型: 自动事件
 * 效果: 年龄+1，提升魅力
 */
export const cleverSpeech: EventDefinition = {
  id: 'clever_speech',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 60,
  
  ageRange: { min: 3, max: 3 },
  triggers: [
    { type: 'age_reach', value: 3 },
  ],
  
  content: {
    text: '你已经能说会道，常常逗得家人开怀大笑。长辈们都说你小小年纪就很有灵性。',
    title: '伶牙俐齿',
    description: '口才也是一种天赋。',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'charisma',
      value: 2,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'giftedSpeaker',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'clever_speech',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['童年', '魅力', '社交'],
    enabled: true,
  },
};

// ========== 童年启蒙事件（4-8 岁） ==========
/**
 * 事件 5: 喜欢玩耍vs读书练功
 * 年龄: 4 岁
 * 类型: 选择事件
 * 效果: 根据选择不同，影响后续发展
 */
export const childhoodPreference: EventDefinition = {
  id: 'childhood_preference',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 50,
  
  ageRange: { min: 4, max: 4 },
  triggers: [
    { type: 'age_reach', value: 4 },
  ],
  
  content: {
    text: '到了启蒙的年纪，家里开始教你读书识字，练习基本功。但你似乎对这些都不太感兴趣，更喜欢在外面玩耍。',
    title: '童年选择',
    description: '人生的重要选择往往从小开始。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'focus_on_study',
      text: '专心读书练功',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'externalSkill',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'internalSkill',
          value: 1,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'diligentStudent',
        },
      ],
      requirements: {
        statRequirements: [
          { statName: 'chivalry', minValue: 10 }, // 有一定品德基础
        ],
      },
    },
    {
      id: 'play_outside',
      text: '继续玩耍探索',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 1,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'freeSpirit',
        },
      ],
    },
    {
      id: 'balance_both',
      text: '尝试平衡两者',
      condition: {
        type: 'expression',
        expression: 'player.charisma >= 15',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'externalSkill',
          value: 1,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 1,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 1,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'balancedApproach',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['童年', '选择', '成长路径', '平衡'],
    enabled: true,
  },
};

// ========== 童年修炼事件（6-12 岁） ==========
/**
 * 事件 6: 武功启蒙
 * 年龄: 6 岁
 * 类型: 选择事件
 * 效果: 根据前期选择，有不同的启蒙路径
 */
export const martialArtsEnlightenment: EventDefinition = {
  id: 'martial_arts_enlightenment',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 40,
  
  ageRange: { min: 6, max: 6 },
  triggers: [
    { type: 'age_reach', value: 6 },
  ],
  
  content: {
    text: '到了习武的年纪，家中长辈开始传授你基础武功。根据你之前的表现，他们为你制定了不同的训练计划。',
    title: '武学启蒙',
    description: '武道之路正式开启。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'external_focus',
      text: '专注外功修炼',
      condition: {
        type: 'expression',
        expression: 'flags.has("diligentStudent")',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'externalSkill',
          value: 4,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'externalFocus',
        },
      ],
    },
    {
      id: 'internal_focus',
      text: '注重内力培养',
      condition: {
        type: 'expression',
        expression: 'flags.has("bornWithBlessing")',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'internalSkill',
          value: 4,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'internalFocus',
        },
      ],
    },
    {
      id: 'agile_path',
      text: '专修轻功身法',
      condition: {
        type: 'expression',
        expression: 'flags.has("freeSpirit") OR flags.has("curiousChild")',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 5,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 1,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'agilePath',
        },
      ],
    },
    {
      id: 'balanced_start',
      text: '全面发展',
      condition: {
        type: 'expression',
        expression: 'flags.has("balancedApproach")',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'externalSkill',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'internalSkill',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'balancedStart',
        },
      ],
    },
    {
      id: 'generic_path',
      text: '常规修炼',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'externalSkill',
          value: 2,
          operator: 'add',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['童年', '武学', '修炼路径', '个性化'],
    enabled: true,
  },
};

// ========== 童年成长事件（8-12 岁） ==========
/**
 * 事件 7: 童年总结与成长
 * 年龄: 8 岁
 * 类型: 自动事件
 * 效果: 总结童年经历，为青少年期做准备
 */
export const childhoodSummary: EventDefinition = {
  id: 'childhood_summary',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 100,
  
  ageRange: { min: 8, max: 12 },
  triggers: [
    { type: 'age_reach', value: 8 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: '!flags.has("childhoodSummaryDone")',
    },
  ],
  
  content: {
    text: '日复一日，你的武艺在逐渐进步。童年的时光即将过去，少年的你开始思考未来的道路。',
    title: '童年总结',
    description: '成长路上的重要节点。',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
    {
      type: EffectType.FLAG_SET,
      target: 'childhoodSummaryDone',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'childhood_summary',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['童年', '总结', '成长'],
    enabled: true,
  },
};

// ========== 事件集合导出 ==========
/**
 * 童年事件集合（0-12 岁）
 * 
 * 包含：
 * 1. 出生事件（2 个变体）
 * 2. 幼年成长（2 个事件）
 * 3. 童年启蒙（1 个选择事件）
 * 4. 武功启蒙（1 个选择事件）
 * 5. 成长总结（1 个事件）
 * 
 * 总计：7 个事件（2 个出生事件 + 5 个发展阶段事件）
 */
export const childhoodEvents: EventDefinition[] = [
  birthInWuxiaFamily,
  birthWithPhenomenon,
  toddlerExploration,
  cleverSpeech,
  childhoodPreference,
  martialArtsEnlightenment,
  childhoodSummary,
];

/**
 * 童年事件设计说明：
 * 
 * 1. 年龄分布：
 *    - 0 岁：出生事件（2 个变体）
 *    - 1 岁：学步探索
 *    - 3 岁：伶牙俐齿
 *    - 4 岁：童年选择
 *    - 6 岁：武学启蒙
 *    - 8-12 岁：成长总结
 * 
 * 2. 事件类型：
 *    - 自动事件：推动故事发展
 *    - 选择事件：影响后续路径
 * 
 * 3. 设计理念：
 *    - 为后续阶段铺垫
 *    - 体现个性化发展
 *    - 保持故事连贯性
 *    - 平衡趣味性和教育意义
 * 
 * 4. 条件触发：
 *    - 基于年龄
 *    - 基于前期选择结果
 *    - 基于属性和Flag
 */
