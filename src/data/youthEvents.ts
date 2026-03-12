/**
 * 青年事件定义（13-18 岁）
 * 
 * 事件分类：MAIN_STORY（主线剧情）
 * 年龄范围：13-18 岁
 * 事件数量：8 个
 * 
 * 设计原则：
 * - 遵循标准化事件格式
 * - 保持故事连贯性
 * - 引入门派系统和武林大会
 * - 为成年期剧情铺垫
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

// ========== 少年成长事件（13-14 岁） ==========
/**
 * 事件 1: 少年初长成
 * 年龄：13 岁
 * 类型：自动事件
 * 效果：年龄 +1，总结少年期成长
 */
export const youthBegins: EventDefinition = {
  id: 'youth_begins',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 100,
  
  ageRange: { min: 13, max: 13 },
  triggers: [
    { type: 'age_reach', value: 13 },
  ],
  
  content: {
    text: '转眼之间，你已从孩童成长为少年。身形逐渐挺拔，武艺也小有成就。家族的长辈们开始考虑你的未来。',
    title: '少年初长成',
    description: '人生的新篇章即将开启。',
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
      target: 'youthStarted',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'youth_begins',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '成长', '主线'],
    enabled: true,
  },
};

/**
 * 事件 2: 门派选择
 * 年龄：14 岁
 * 类型：选择事件
 * 效果：根据选择加入不同门派，影响后续发展
 */
export const sectChoice: EventDefinition = {
  id: 'sect_choice',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 80,
  
  ageRange: { min: 14, max: 14 },
  triggers: [
    { type: 'age_reach', value: 14 },
  ],
  
  content: {
    text: '到了离家闯荡的年纪。江湖上有几大著名门派：少林、武当、峨眉。家族长辈询问你的意愿，想要拜入哪一门派。',
    title: '门派选择',
    description: '选择将影响你的武学道路。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'join_shaolin',
      text: '拜入少林派（刚猛外功）',
      condition: {
        type: 'expression',
        expression: 'player.externalSkill >= 15',
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
          value: 8,
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
          target: 'shaolinDisciple',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'sect_shaolin',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'join_shaolin',
        },
      ],
    },
    {
      id: 'join_wudang',
      text: '拜入武当派（柔韧内功）',
      condition: {
        type: 'expression',
        expression: 'player.internalSkill >= 15',
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
          value: 8,
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
          target: 'wudangDisciple',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'sect_wudang',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'join_wudang',
        },
      ],
    },
    {
      id: 'join_emei',
      text: '拜入峨眉派（轻灵身法）',
      condition: {
        type: 'expression',
        expression: 'player.qinggong >= 15',
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
          value: 8,
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
          target: 'emeiDisciple',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'sect_emei',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'join_emei',
        },
      ],
    },
    {
      id: 'stay_home',
      text: '留在家族继续修炼',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
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
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'familyDisciple',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'stay_home',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '门派', '选择', '主线'],
    enabled: true,
  },
};

// ========== 门派修炼事件（15-16 岁） ==========
/**
 * 事件 3: 门派试炼
 * 年龄：15 岁
 * 类型：选择事件
 * 效果：根据门派不同，有不同试炼内容
 */
export const sectTrial: EventDefinition = {
  id: 'sect_trial',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 70,
  
  ageRange: { min: 15, max: 15 },
  triggers: [
    { type: 'age_reach', value: 15 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("shaolinDisciple") OR flags.has("wudangDisciple") OR flags.has("emeiDisciple")',
    },
  ],
  
  content: {
    text: '入门一年后，师父安排你参加门派试炼。这是对你修炼成果的检验，也是证明自己的机会。',
    title: '门派试炼',
    description: '证明自己的时刻到了。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'challenge_master',
      text: '挑战师兄师姐',
      condition: {
        type: 'expression',
        expression: 'player.martialPower >= 30',
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
          target: 'trialVictor',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'trial_victory',
        },
      ],
    },
    {
      id: 'complete_tasks',
      text: '完成门派任务',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'externalSkill',
          value: 5,
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
          target: 'diligentDisciple',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'trial_completed',
        },
      ],
    },
    {
      id: 'meditate',
      text: '闭关修炼',
      condition: {
        type: 'expression',
        expression: 'flags.has("wudangDisciple")',
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
          value: 10,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'meditationMaster',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'trial_meditation',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '门派', '试炼', '成长'],
    enabled: true,
  },
};

/**
 * 事件 4: 江湖历练
 * 年龄：16 岁
 * 类型：自动事件
 * 效果：年龄 +1，提升实战经验
 */
export const jianghuExperience: EventDefinition = {
  id: 'jianghu_experience',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 60,
  
  ageRange: { min: 16, max: 16 },
  triggers: [
    { type: 'age_reach', value: 16 },
  ],
  
  content: {
    text: '师父认为你已经学有所成，让你下山历练。你行走江湖，见识了各种人物和事端，武艺也在实战中不断精进。',
    title: '江湖历练',
    description: '读万卷书不如行万里路。',
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
      target: 'charisma',
      value: 3,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'jianghuTraveler',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'jianghu_experience',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '江湖', '历练', '成长'],
    enabled: true,
  },
};

// ========== 青年成长事件（17-18 岁） ==========
/**
 * 事件 5: 初遇意中人
 * 年龄：17 岁
 * 类型：选择事件（低权重，作为变体）
 * 效果：可能触发爱情线
 */
export const meetLoveInterest: EventDefinition = {
  id: 'meet_love_interest',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.HIGH,
  weight: 25,
  
  ageRange: { min: 17, max: 17 },
  triggers: [
    { type: 'age_reach', value: 17 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'Math.random() < 0.4 && !flags.has("hasLoveInterest")',
    },
  ],
  
  content: {
    text: '在一次江湖游历中，你偶然遇到了一位令人心动的女子/男子。她/他气质不凡，谈吐优雅，让你印象深刻。',
    title: '初遇意中人',
    description: '情窦初开，心动时刻。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'approach',
      text: '主动上前搭话',
      condition: {
        type: 'expression',
        expression: 'player.charisma >= 20',
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
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'hasLoveInterest',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'romanticApproach',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'meet_love_success',
        },
      ],
    },
    {
      id: 'observe',
      text: '默默观察',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.FLAG_SET,
          target: 'hasLoveInterest',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'romanticObserver',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'meet_love_observe',
        },
      ],
    },
    {
      id: 'ignore',
      text: '继续赶路',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.FLAG_SET,
          target: 'focusedOnMartialArt',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'meet_love_ignore',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '爱情', '选择', '支线'],
    enabled: true,
  },
};

/**
 * 事件 6: 武艺精进
 * 年龄：17 岁
 * 类型：自动事件
 * 效果：年龄 +1，根据门派提升武艺
 */
export const martialImprovement: EventDefinition = {
  id: 'martial_improvement',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 50,
  
  ageRange: { min: 17, max: 17 },
  triggers: [
    { type: 'age_reach', value: 17 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: '!flags.has("meet_love_success") && !flags.has("meet_love_observe")',
    },
  ],
  
  content: {
    text: '你没有被儿女情长所困扰，而是专心致志地修炼武艺。日复一日，你的武功已经达到了一个新的高度。',
    title: '武艺精进',
    description: '专注是成功的关键。',
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
      value: 12,
      operator: 'add',
    },
    {
      type: EffectType.STAT_MODIFY,
      target: 'externalSkill',
      value: 5,
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
      target: 'martialArtist',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'martial_improvement',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '武艺', '修炼', '主线'],
    enabled: true,
  },
};

/**
 * 事件 7: 青年成名
 * 年龄：18 岁
 * 类型：自动事件
 * 效果：年龄 +1，开始在江湖上小有名气
 */
export const youthFame: EventDefinition = {
  id: 'youth_fame',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 80,
  
  ageRange: { min: 18, max: 18 },
  triggers: [
    { type: 'age_reach', value: 18 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'player.martialPower >= 50',
    },
  ],
  
  content: {
    text: '十八岁的你，武艺已经小有成就。江湖上开始流传着你的名号，有人说你是后起之秀，有人说你是百年难遇的奇才。',
    title: '青年成名',
    description: '名声鹊起，江湖皆知。',
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
      value: 8,
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
      target: 'risingStar',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'youth_fame',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '成名', '江湖', '主线'],
    enabled: true,
  },
};

/**
 * 事件 8: 武林大会邀请
 * 年龄：18 岁
 * 类型：选择事件
 * 效果：为成年期武林大会剧情铺垫
 */
export const martialArtsInvitation: EventDefinition = {
  id: 'martial_arts_invitation',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 90,
  
  ageRange: { min: 18, max: 18 },
  triggers: [
    { type: 'age_reach', value: 18 },
  ],
  
  content: {
    text: '你收到了一封武林大会的邀请函。这是江湖盛事，各路英雄豪杰都会参加。师父建议你去见识一下，但也提醒你江湖险恶。',
    title: '武林大会邀请',
    description: '江湖盛事，英雄汇聚。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'accept_invitation',
      text: '接受邀请，参加武林大会',
      condition: {
        type: 'expression',
        expression: 'player.martialPower >= 60',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.FLAG_SET,
          target: 'willAttendMartialArtsMeeting',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'confident',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'accept_martial_meeting',
        },
      ],
    },
    {
      id: 'decline_invitation',
      text: '拒绝邀请，继续修炼',
      effects: [
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
          type: EffectType.FLAG_SET,
          target: 'cautious',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'decline_martial_meeting',
        },
      ],
    },
    {
      id: 'observe_only',
      text: '前去观战，不参与比试',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'charisma',
          value: 5,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'willObserveMartialArtsMeeting',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'observe_martial_meeting',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['青年', '武林大会', '选择', '主线'],
    enabled: true,
  },
};

// ========== 事件集合导出 ==========
/**
 * 青年事件集合（13-18 岁）
 * 
 * 包含：
 * 1. 少年成长（1 个事件）
 * 2. 门派选择（1 个事件）
 * 3. 门派试炼（1 个事件）
 * 4. 江湖历练（1 个事件）
 * 5. 爱情线（1 个事件）
 * 6. 武艺精进（1 个事件）
 * 7. 青年成名（1 个事件）
 * 8. 武林大会邀请（1 个事件）
 * 
 * 总计：8 个事件
 */
export const youthEvents: EventDefinition[] = [
  youthBegins,
  sectChoice,
  sectTrial,
  jianghuExperience,
  meetLoveInterest,
  martialImprovement,
  youthFame,
  martialArtsInvitation,
];

/**
 * 青年事件设计说明：
 * 
 * 1. 年龄分布：
 *    - 13 岁：少年初长成
 *    - 14 岁：门派选择
 *    - 15 岁：门派试炼
 *    - 16 岁：江湖历练
 *    - 17 岁：爱情线/武艺精进（分支）
 *    - 18 岁：青年成名 + 武林大会邀请
 * 
 * 2. 事件类型：
 *    - 自动事件：推动故事发展
 *    - 选择事件：影响后续路径
 * 
 * 3. 设计理念：
 *    - 引入门派系统
 *    - 引入爱情线
 *    - 为武林大会剧情铺垫
 *    - 体现个性化发展
 * 
 * 4. 条件触发：
 *    - 基于年龄
 *    - 基于门派选择
 *    - 基于属性值
 *    - 基于概率（爱情线）
 */
