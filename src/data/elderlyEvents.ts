/**
 * 中老年事件定义（36-80 岁）
 * 
 * 事件分类：MAIN_STORY（主线剧情）、SPECIAL_EVENT（特殊事件）
 * 年龄范围：36-80 岁
 * 事件数量：10 个
 * 
 * 设计原则：
 * - 遵循标准化事件格式
 * - 保持故事连贯性
 * - 包含多种人生结局
 * - 体现人生起伏和传承
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { EventCategory, EventPriority, EffectType } from '../types/eventTypes';
import type { EventDefinition, EffectOperator } from '../types/eventTypes';

// ========== 中年发展事件（36-50 岁） ==========
/**
 * 事件 1: 开宗立派
 * 年龄：40 岁
 * 类型：自动事件
 * 效果：如果之前选择创立门派，此事件确认门派地位
 */
export const sectEstablishment: EventDefinition = {
  id: 'sect_establishment',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 80,
  
  ageRange: { min: 40, max: 40 },
  triggers: [
    { type: 'age_reach', value: 40 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("sectFounder")',
    },
  ],
  
  content: {
    text: '经过多年经营，你创立的门派已在江湖上占据一席之地。门徒众多，声名远播。你的武学理念得以传承发扬。',
    title: '开宗立派',
    description: '开创新局，传承武学。',
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
      target: 'sectEstablished',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'sect_establishment',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['中年', '门派', '传承', '主线'],
    enabled: true,
  },
};

/**
 * 事件 2: 桃李满天下
 * 年龄：45 岁
 * 类型：自动事件
 * 效果：如果之前选择寻找传人，此事件确认传承成果
 */
export const disciplesEverywhere: EventDefinition = {
  id: 'disciples_everywhere',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 75,
  
  ageRange: { min: 45, max: 45 },
  triggers: [
    { type: 'age_reach', value: 45 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("wiseMaster") OR flags.has("sectFounder")',
    },
  ],
  
  content: {
    text: '你的弟子们已遍布江湖，其中不乏杰出之辈。他们在各自的领域发光发热，将你的武学精神传承下去。',
    title: '桃李满天下',
    description: '薪火相传，生生不息。',
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
      value: 20,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'legacySecured',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'disciples_everywhere',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['中年', '传承', '弟子', '主线'],
    enabled: true,
  },
};

/**
 * 事件 3: 江湖地位巩固
 * 年龄：50 岁
 * 类型：自动事件
 * 效果：确认江湖地位
 */
export const statusConsolidation: EventDefinition = {
  id: 'status_consolidation',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 85,
  
  ageRange: { min: 50, max: 50 },
  triggers: [
    { type: 'age_reach', value: 50 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'player.martialPower >= 180',
    },
  ],
  
  content: {
    text: '年过半百，你已是江湖中德高望重的前辈。各大门派都对你敬重有加，江湖事务常来请教你的意见。',
    title: '江湖地位巩固',
    description: '德高望重，一言九鼎。',
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
      value: 15,
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
      target: 'respectedElder',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'status_consolidation',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['中年', '地位', '江湖', '主线'],
    enabled: true,
  },
};

// ========== 晚年生活事件（55-70 岁） ==========
/**
 * 事件 4: 归隐田园
 * 年龄：55 岁
 * 类型：选择事件
 * 效果：选择退休生活方式
 */
export const retirement: EventDefinition = {
  id: 'retirement',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 70,
  
  ageRange: { min: 55, max: 55 },
  triggers: [
    { type: 'age_reach', value: 55 },
  ],
  
  content: {
    text: '年岁渐长，你开始考虑退休生活。是继续留在江湖中心，还是归隐田园，享受平静的生活？',
    title: '归隐田园',
    description: '功成身退，享受人生。',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'retire_to_countryside',
      text: '归隐田园，远离江湖',
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
          target: 'retiredInCountryside',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'peacefulLife',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'retire_to_countryside',
        },
      ],
    },
    {
      id: 'stay_in_jianghu',
      text: '继续留在江湖',
      condition: {
        type: 'expression',
        expression: 'player.martialPower >= 200',
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
          target: 'activeInJianghu',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'stay_in_jianghu',
        },
      ],
    },
    {
      id: 'travel_world',
      text: '游历天下',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'qinggong',
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
          target: 'worldTraveler',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'travel_world',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['老年', '退休', '选择', '主线'],
    enabled: true,
  },
};

/**
 * 事件 5: 武学总结
 * 年龄：60 岁
 * 类型：自动事件
 * 效果：总结一生武学心得
 */
export const martialSummary: EventDefinition = {
  id: 'martial_summary',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.HIGH,
  weight: 90,
  
  ageRange: { min: 60, max: 60 },
  triggers: [
    { type: 'age_reach', value: 60 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("martialScholar") OR flags.has("peakMaster")',
    },
  ],
  
  content: {
    text: '花甲之年，你开始总结一生的武学心得。这些经验若能流传后世，将是武林的宝贵财富。',
    title: '武学总结',
    description: '集大成者，流传后世。',
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
      value: 15,
      operator: 'add',
    },
    {
      type: EffectType.FLAG_SET,
      target: 'martialLegacyComplete',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'martial_summary',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['老年', '总结', '武学', '主线'],
    enabled: true,
  },
};

/**
 * 事件 6: 天伦之乐
 * 年龄：65 岁
 * 类型：自动事件
 * 效果：享受家庭生活
 */
export const familyHappiness: EventDefinition = {
  id: 'family_happiness',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.NORMAL,
  weight: 60,
  
  ageRange: { min: 65, max: 65 },
  triggers: [
    { type: 'age_reach', value: 65 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("hasLoveInterest")',
    },
  ],
  
  content: {
    text: '儿孙满堂，天伦之乐。你与伴侣相伴多年，看着子孙们健康成长，心中满是欣慰。',
    title: '天伦之乐',
    description: '家庭和睦，幸福美满。',
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
      type: EffectType.FLAG_SET,
      target: 'happyFamily',
    },
    {
      type: EffectType.EVENT_RECORD,
      target: 'family_happiness',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['老年', '家庭', '幸福', '支线'],
    enabled: true,
  },
};

// ========== 结局事件（70-80 岁） ==========
/**
 * 事件 7: 传奇人生（好结局）
 * 年龄：70 岁
 * 类型：自动事件
 * 效果：达成传奇人生结局
 */
export const legendaryLife: EventDefinition = {
  id: 'legendary_life',
  version: '1.0.0',
  category: EventCategory.SPECIAL_EVENT,
  priority: EventPriority.CRITICAL,
  weight: 100,
  
  ageRange: { min: 70, max: 70 },
  triggers: [
    { type: 'age_reach', value: 70 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'player.martialPower >= 250 && player.charisma >= 100 && flags.has("legendaryStatus")',
    },
  ],
  
  content: {
    text: '古稀之年，你已是一代传奇。江湖中到处流传着你的故事，你的名字将永远载入武林史册。你的一生，是辉煌的武林传奇。',
    title: '传奇人生',
    description: '一代宗师，名垂青史。',
  },
  
  eventType: 'ending',
  endingType: 'legendary',
  autoEffects: [
    {
      type: EffectType.EVENT_RECORD,
      target: 'legendary_life',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['结局', '传奇', '完美'],
    enabled: true,
  },
};

/**
 * 事件 8: 幸福晚年（普通好结局）
 * 年龄：75 岁
 * 类型：自动事件
 * 效果：达成幸福晚年结局
 */
export const peacefulOldAge: EventDefinition = {
  id: 'peaceful_old_age',
  version: '1.0.0',
  category: EventCategory.SPECIAL_EVENT,
  priority: EventPriority.CRITICAL,
  weight: 90,
  
  ageRange: { min: 75, max: 75 },
  triggers: [
    { type: 'age_reach', value: 75 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("peacefulLife") && flags.has("happyFamily")',
    },
  ],
  
  content: {
    text: '年逾古稀，你过着平静的生活。家人陪伴在侧，子孙孝顺。虽然没有惊天动地的成就，但这一生平淡而幸福。',
    title: '幸福晚年',
    description: '平淡是真，幸福安康。',
  },
  
  eventType: 'ending',
  endingType: 'peaceful',
  autoEffects: [
    {
      type: EffectType.EVENT_RECORD,
      target: 'peaceful_old_age',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['结局', '幸福', '平静'],
    enabled: true,
  },
};

/**
 * 事件 9: 武学宗师（传承结局）
 * 年龄：78 岁
 * 类型：自动事件
 * 效果：达成武学宗师结局
 */
export const martialMaster: EventDefinition = {
  id: 'martial_master',
  version: '1.0.0',
  category: EventCategory.SPECIAL_EVENT,
  priority: EventPriority.CRITICAL,
  weight: 95,
  
  ageRange: { min: 78, max: 78 },
  triggers: [
    { type: 'age_reach', value: 78 },
  ],
  conditions: [
    {
      type: 'expression',
      expression: 'flags.has("sectEstablished") && flags.has("legacySecured") && player.martialPower >= 220',
    },
  ],
  
  content: {
    text: '你的门派已传承数代，门徒遍布天下。你的武学理念影响深远，被后人尊为一代宗师。',
    title: '武学宗师',
    description: '开宗立派，万世流芳。',
  },
  
  eventType: 'ending',
  endingType: 'master',
  autoEffects: [
    {
      type: EffectType.EVENT_RECORD,
      target: 'martial_master',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['结局', '宗师', '传承'],
    enabled: true,
  },
};

/**
 * 事件 10: 平凡一生（普通结局）
 * 年龄：80 岁
 * 类型：自动事件
 * 效果：默认结局
 */
export const ordinaryLife: EventDefinition = {
  id: 'ordinary_life',
  version: '1.0.0',
  category: EventCategory.SPECIAL_EVENT,
  priority: EventPriority.CRITICAL,
  weight: 50,
  
  ageRange: { min: 80, max: 80 },
  triggers: [
    { type: 'age_reach', value: 80 },
  ],
  
  content: {
    text: '八十高龄，你回顾一生。虽然没有惊天动地的成就，但也经历了江湖的风风雨雨，有过欢笑，有过泪水。这就是你的人生，平凡而真实。',
    title: '平凡一生',
    description: '平凡人生，亦有光彩。',
  },
  
  eventType: 'ending',
  endingType: 'ordinary',
  autoEffects: [
    {
      type: EffectType.EVENT_RECORD,
      target: 'ordinary_life',
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'development_team',
    tags: ['结局', '平凡', '默认'],
    enabled: true,
  },
};

// ========== 事件集合导出 ==========
/**
 * 中老年事件集合（36-80 岁）
 * 
 * 包含：
 * 1. 中年发展（3 个事件）
 * 2. 晚年生活（3 个事件）
 * 3. 结局事件（4 个事件）
 * 
 * 总计：10 个事件
 */
export const elderlyEvents: EventDefinition[] = [
  sectEstablishment,
  disciplesEverywhere,
  statusConsolidation,
  retirement,
  martialSummary,
  familyHappiness,
  legendaryLife,
  peacefulOldAge,
  martialMaster,
  ordinaryLife,
];

/**
 * 中老年事件设计说明：
 * 
 * 1. 年龄分布：
 *    - 40 岁：开宗立派
 *    - 45 岁：桃李满天下
 *    - 50 岁：江湖地位巩固
 *    - 55 岁：归隐田园（选择）
 *    - 60 岁：武学总结
 *    - 65 岁：天伦之乐
 *    - 70 岁：传奇人生（结局）
 *    - 75 岁：幸福晚年（结局）
 *    - 78 岁：武学宗师（结局）
 *    - 80 岁：平凡一生（默认结局）
 * 
 * 2. 事件类型：
 *    - 自动事件：推动故事发展
 *    - 选择事件：影响后续路径
 *    - 结局事件：人生终点
 * 
 * 3. 设计理念：
 *    - 体现人生起伏
 *    - 多种结局选择
 *    - 强调传承意义
 *    - 反映不同人生价值观
 * 
 * 4. 结局类型：
 *    - 传奇人生：武力和魅力双高 + 传奇状态
 *    - 幸福晚年：平静生活 + 家庭幸福
 *    - 武学宗师：开宗立派 + 传承有人
 *    - 平凡一生：默认结局
 * 
 * 5. 条件触发：
 *    - 基于前期选择
 *    - 基于属性值
 *    - 基于 Flag 状态
 */
