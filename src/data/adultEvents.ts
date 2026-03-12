/**
 * 成年事件定义（19-35 岁）
 * 
 * 事件分类：MAIN_STORY（主线剧情）、SIDE_QUEST（支线任务）
 * 年龄范围：19-35 岁
 * 事件数量：10 个
 * 
 * 设计原则：
 * - 遵循标准化事件格式
 * - 保持故事连贯性
 * - 引入武林大会、江湖恩怨、门派争斗
 * - 为中老年期剧情铺垫
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import {
  EventDefinition,
  EventCategory,
  EventPriority,
  EffectType,
  EffectOperator,
} from '../types/eventTypes';

// ========== 青年向成年过渡事件（19-22 岁） ==========
/**
 * 事件 1: 武林大会初试
 * 年龄：19 岁
 * 类型：自动事件
 * 效果：根据之前选择决定是否参加武林大会
 */
export const martialArtsBeginner: EventDefinition = {
  id: 'martial_arts_beginner',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 80,
  
  ageRange: { min: 19, max: 19 },
  triggers: [
    { type: 'age_reach', value: 19 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("willAttendMartialArtsMeeting")',
    },
  ],
  
  content: {
    text: '武林大会如期举行，你怀着激动的心情前往会场。各大门派的高手云集，年轻一代的佼佼者也纷纷登场。',
    title: '武林大会初试',
    description: '群雄荟萃，各显神通。',
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
      target: 'martialPower',
      value: 5,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'participatedInMartialArtsMeeting',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'martial_arts_beginner',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '武林大会', '主线'],
    enabled: true,
  },
};

/**
 * 事件 2: 武林大会观战
 * 年龄：19 岁
 * 类型：自动事件
 * 效果：作为观众学习武学心得
 */
export const martialArtsObserver: EventDefinition = {
  id: 'martial_arts_observer',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.HIGH,
  weight: 60,
  
  ageRange: { min: 19, max: 19 },
  triggers: [
    { type: 'age_reach', value: 19 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("willObserveMartialArtsMeeting")',
    },
  ],
  
  content: {
    text: '你来到武林大会现场，作为一名观众静静观战。高手们的精彩对决让你受益匪浅，对武学有了更深的理解。',
    title: '武林大会观战',
    description: '观他人之长，补己之短。',
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
      value: 8,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'charisma',
      value: 3,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'observedMartialArtsMeeting',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'martial_arts_observer',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '武林大会', '观察', '支线'],
    enabled: true,
  },
};

/**
 * 事件 3: 江湖历练继续
 * 年龄：19 岁
 * 类型：自动事件
 * 效果：未参加武林大会则继续江湖历练
 */
export const continuedJourney: EventDefinition = {
  id: 'continued_journey',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 50,
  
  ageRange: { min: 19, max: 19 },
  triggers: [
    { type: 'age_reach', value: 19 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: '!flags.has("willAttendMartialArtsMeeting") && !flags.has("willObserveMartialArtsMeeting")',
    },
  ],
  
  content: {
    text: '你没有参加武林大会，而是继续在江湖上游历。这段时间的历练让你的武艺更加扎实，经验也更加丰富。',
    title: '江湖历练继续',
    description: '路漫漫其修远兮，吾将上下而求索。',
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
      target: 'martialPower',
      value: 10,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'externalSkill',
      value: 3,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'internalSkill',
      value: 3,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'steadyProgress',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'continued_journey',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '江湖', '修炼', '主线'],
    enabled: true,
  },
};

// ========== 江湖声望建立事件（23-28 岁） ==========
/**
 * 事件 4: 江湖扬名
 * 年龄：23 岁
 * 类型：自动事件
 * 效果：在江湖中建立起一定声望
 */
export const fameRising: EventDefinition = {
  id: 'fame_rising',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 70,
  
  ageRange: { min: 23, max: 23 },
  triggers: [
    { type: 'age_reach', value: 23 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'player.martialPower >= 80',
    },
  ],
  
  content: {
    text: '经过多年的努力，你在江湖中的名声越来越大。许多人都知道有个年轻高手，武艺高强，品格高尚。',
    title: '江湖扬名',
    description: '声名远播，威震江湖。',
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
      value: 10,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'martialPower',
      value: 5,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'famousWarrior',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'fame_rising',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '成名', '江湖', '主线'],
    enabled: true,
  },
};

/**
 * 事件 5: 恩怨情仇
 * 年龄：25 岁
 * 类型：选择事件
 * 效果：根据选择处理江湖恩怨
 */
export const grudgeAndAffection: EventDefinition = {
  id: 'grudge_and_affection',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.HIGH,
  weight: 65,
  
  ageRange: { min: 25, max: 25 },
  triggers: [
    { type: 'age_reach', value: 25 },
  ],
  
  content: {
    text: '江湖恩怨如流水，你遇到了一些麻烦。有人想要报当年的仇，也有人想要拉拢你加入他们的势力。',
    title: '恩怨情仇',
    description: '江湖路险，是非难辨。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'face_challenges',
      text: '正面应对挑战',
      condition: {
        type: 'expression',
        expression: 'player.martialPower >= 90',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 12,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'braveWarrior',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'face_challenges',
        },
      ],
    },
    {
      id: 'negotiate_peace',
      text: '寻求和平解决',
      condition: {
        type: 'expression',
        expression: 'player.charisma >= 50',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 10,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'peacefulNegotiator',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'negotiate_peace',
        },
      ],
    },
    {
      id: 'avoid_conflict',
      text: '暂避锋芒',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 8,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'cautiousSurvivor',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'avoid_conflict',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '恩怨', '选择', '江湖', '支线'],
    enabled: true,
  },
};

// ========== 门派地位确立事件（29-35 岁） ==========
/**
 * 事件 6: 门派贡献
 * 年龄：29 岁
 * 类型：自动事件
 * 效果：根据门派身份做出贡献
 */
export const sectContribution: EventDefinition = {
  id: 'sect_contribution',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 75,
  
  ageRange: { min: 29, max: 29 },
  triggers: [
    { type: 'age_reach', value: 29 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("shaolinDisciple") OR flags.has("wudangDisciple") OR flags.has("emeiDisciple")',
    },
  ],
  
  content: {
    text: '你在门派中的地位日益重要，师父委以重任，让你处理一些重要的事务。这是对你多年来努力的认可。',
    title: '门派贡献',
    description: '不负师恩，光大门派。',
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
      target: 'martialPower',
      value: 8,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'internalSkill',
      value: 5,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'respectedElder',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'sect_contribution',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '门派', '贡献', '主线'],
    enabled: true,
  },
};

/**
 * 事件 7: 独立门户
 * 年龄：31 岁
 * 类型：选择事件
 * 效果：决定是否独立门户
 */
export const independentPath: EventDefinition = {
  id: 'independent_path',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 85,
  
  ageRange: { min: 31, max: 31 },
  triggers: [
    { type: 'age_reach', value: 31 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'player.martialPower >= 120',
    },
  ],
  
  content: {
    text: '经过多年积累，你已具备独当一面的能力。江湖朋友建议你开创自己的基业，或是另立门派，传承武学。',
    title: '独立门户',
    description: '自立门户，开创新局。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'start_own_sect',
      text: '创立自己的门派',
      condition: {
        type: 'expression',
        expression: 'player.charisma >= 80 && player.martialPower >= 140',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 15,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 10,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'sectFounder',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'legendaryMaster',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'start_own_sect',
        },
      ],
    },
    {
      id: 'become_free_walker',
      text: '成为自由江湖客',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 12,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 8,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'freeWalker',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'become_free_walker',
        },
      ],
    },
    {
      id: 'serve_government',
      text: '为朝廷效力',
      condition: {
        type: 'expression',
        expression: 'player.chivalry >= 70',
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
          value: 10,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 8,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'loyalGuardian',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'serve_government',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '独立', '选择', '主线'],
    enabled: true,
  },
};

// ========== 成年巅峰事件（33-35 岁） ==========
/**
 * 事件 8: 武学巅峰
 * 年龄：33 岁
 * 类型：自动事件
 * 效果：达到武学巅峰境界
 */
export const martialPeak: EventDefinition = {
  id: 'martial_peak',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 90,
  
  ageRange: { min: 33, max: 33 },
  triggers: [
    { type: 'age_reach', value: 33 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'player.martialPower >= 150',
    },
  ],
  
  content: {
    text: '经过数十年的修炼，你终于达到了武学的巅峰境界。江湖中人称你为绝世高手，你的名字已载入武林史册。',
    title: '武学巅峰',
    description: '登峰造极，名垂青史。',
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
      target: 'martialPower',
      value: 20,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'internalSkill',
      value: 15,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'peakMaster',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'legendaryStatus',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'martial_peak',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '巅峰', '传奇', '主线'],
    enabled: true,
  },
};

/**
 * 事件 9: 江湖传承
 * 年龄：35 岁
 * 类型：选择事件
 * 效果：决定武学传承方式
 */
export const martialLegacy: EventDefinition = {
  id: 'martial_legacy',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 80,
  
  ageRange: { min: 35, max: 35 },
  triggers: [
    { type: 'age_reach', value: 35 },
  ],
  
  content: {
    text: '步入中年，你开始思考武学的传承问题。是著书立说流传后世，还是寻找合适的传人，亦或是将武学融入生活？',
    title: '武学传承',
    description: '薪火相传，生生不息。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'write_manual',
      text: '著书立说',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'internalSkill',
          value: 10,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 5,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'martialScholar',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'write_manual',
        },
      ],
    },
    {
      id: 'find_disciple',
      text: '寻找传人',
      condition: {
        type: 'expression',
        expression: 'player.charisma >= 60',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 5,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 8,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'wiseMaster',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'find_disciple',
        },
      ],
    },
    {
      id: 'live_peacefully',
      text: '归隐田园',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'internalSkill',
          value: 8,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'peacefulHermit',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'live_peacefully',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '传承', '选择', '主线'],
    enabled: true,
  },
};

/**
 * 事件 10: 中年总结
 * 年龄：35 岁
 * 类型：自动事件
 * 效果：总结成年期成就，为中老年期铺垫
 */
export const middleAgeSummary: EventDefinition = {
  id: 'middle_age_summary',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 100,
  
  ageRange: { min: 35, max: 35 },
  triggers: [
    { type: 'age_reach', value: 35 },
  ],
  
  content: {
    text: '三十五年弹指一挥间，回顾过往，你已在江湖中留下浓墨重彩的一笔。未来的路还很长，是继续追求武学极致，还是享受人生平静？',
    title: '中年总结',
    description: '人生过半，回首来路。',
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
      target: 'middleAgeAchieved',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'middle_age_summary',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['成年', '总结', '过渡'],
    enabled: true,
  },
};

// ========== 事件集合导出 ==========
/**
 * 成年事件集合（19-35 岁）
 * 
 * 包含：
 * 1. 武林大会相关（3 个事件）
 * 2. 江湖声望建立（2 个事件）
 * 3. 门派地位确立（2 个事件）
 * 4. 成年巅峰（3 个事件）
 * 
 * 总计：10 个事件
 */
export const adultEvents: EventDefinition[] = [
  martialArtsBeginner,
  martialArtsObserver,
  continuedJourney,
  fameRising,
  grudgeAndAffection,
  sectContribution,
  independentPath,
  martialPeak,
  martialLegacy,
  middleAgeSummary,
];

/**
 * 成年事件设计说明：
 * 
 * 1. 年龄分布：
 *    - 19 岁：武林大会/江湖历练（3 个分支）
 *    - 23 岁：江湖扬名
 *    - 25 岁：恩怨情仇
 *    - 29 岁：门派贡献
 *    - 31 岁：独立门户
 *    - 33 岁：武学巅峰
 *    - 35 岁：武学传承 + 中年总结
 * 
 * 2. 事件类型：
 *    - 自动事件：推动故事发展
 *    - 选择事件：影响后续路径
 * 
 * 3. 设计理念：
 *    - 延续青年期选择的影响
 *    - 引入武林大会主线剧情
 *    - 体现江湖恩怨情仇
 *    - 为中老年期剧情铺垫
 *    - 体现个性化发展
 * 
 * 4. 条件触发：
 *    - 基于前期选择
 *    - 基于属性值
 *    - 基于年龄
 */
