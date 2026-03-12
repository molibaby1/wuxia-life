/**
 * 标准化事件示例
 * 
 * 本文件展示了如何使用新的标准化事件格式定义事件
 * 所有新事件都应该遵循这个格式
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import { EventCategory, EventPriority, EffectType } from '../types/eventTypes';
import type { EventDefinition } from '../types/eventTypes';

// ========== 童年事件示例（0-12 岁） ==========

/**
 * 出生事件示例 1
 */
export const birthExample1: EventDefinition = {
  id: 'birth_example_1',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 70,
  
  ageRange: { min: 0, max: 0 },
  triggers: [
    { type: 'age_reach', value: 0 },
  ],
  
  content: {
    text: '你降生在一个武侠世家，哭声洪亮，远近皆闻。',
    title: '降生',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['出生', '主线'],
    enabled: true,
  },
};

/**
 * 出生事件示例 2（带随机效果）
 */
export const birthExample2: EventDefinition = {
  id: 'birth_example_2',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 20,
  
  ageRange: { min: 0, max: 0 },
  triggers: [
    { type: 'age_reach', value: 0 },
  ],
  
  content: {
    text: '你出生时天有异象，一道金光从天而降！',
    title: '天降异象',
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
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['出生', '奇遇'],
    enabled: true,
  },
};

// ========== 童年事件示例（2 岁） ==========

/**
 * 2 岁事件示例
 */
export const age2Example: EventDefinition = {
  id: 'age_2_example',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.NORMAL,
  weight: 50,
  
  ageRange: { min: 2, max: 2 },
  triggers: [
    { type: 'age_reach', value: 2 },
  ],
  
  content: {
    text: '这一年你长高了不少，也更懂事了。',
    title: '成长',
  },
  
  eventType: 'auto',
  autoEffects: [
    {
      type: EffectType.TIME_ADVANCE,
      target: 'age',
      value: 1,
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['童年', '成长'],
    enabled: true,
  },
};

// ========== 童年事件示例（8-12 岁，带选择） ==========

/**
 * 8-12 岁日常修炼事件（带选择）
 */
export const childhoodTrainingExample: EventDefinition = {
  id: 'childhood_training_example',
  version: '1.0.0',
  category: EventCategory.DAILY_EVENT,
  priority: EventPriority.NORMAL,
  weight: 50,
  
  ageRange: { min: 8, max: 12 },
  triggers: [
    { type: 'age_reach', value: 8 },
  ],
  
  conditions: [
    {
      type: 'expression',
      expression: '!flags.has("hasStartedTraining")',
    },
  ],
  
  content: {
    text: '你开始跟随家人学习基础武功，虽然很辛苦，但你乐在其中。',
    title: '习武启蒙',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'train_hard',
      text: '刻苦训练',
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
          target: 'externalSkill',
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'hasStartedTraining',
        },
      ],
    },
    {
      id: 'train_normal',
      text: '正常训练',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'martialPower',
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'hasStartedTraining',
        },
      ],
    },
    {
      id: 'skip_train',
      text: '偷懒玩耍',
      condition: {
        type: 'expression',
        expression: 'player.charisma >= 10',
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
          value: 2,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'hasStartedTraining',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['童年', '修炼', '选择'],
    enabled: true,
  },
};

// ========== 奇遇事件示例 ==========

/**
 * 恶棍欺人事件（随机遭遇）
 */
export const bullyEncounterExample: EventDefinition = {
  id: 'bully_encounter_example',
  version: '1.0.0',
  category: EventCategory.RANDOM_ENCOUNTER,
  priority: EventPriority.HIGH,
  weight: 25,
  
  ageRange: { min: 8, max: 12 },
  triggers: [
    { type: 'age_reach', value: 8 },
  ],
  
  conditions: [
    {
      type: 'expression',
      expression: '!flags.has("metBully")',
    },
  ],
  
  content: {
    text: '一日下山，你遇到一个恶棍在欺负百姓，周围的人都敢怒不敢言。',
    title: '路见不平',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'help_victim',
      text: '出手相助',
      condition: {
        type: 'expression',
        expression: 'player.martialPower >= 10',
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
          value: 3,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'chivalry',
          value: 10,
          operator: 'add',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'metBully',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'helpedVictim',
        },
      ],
    },
    {
      id: 'report_authority',
      text: '报官处理',
      condition: {
        type: 'expression',
        expression: 'player.money >= 10',
      },
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'money',
          value: -10,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'chivalry',
          value: 5,
          operator: 'add',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'metBully',
        },
      ],
    },
    {
      id: 'ignore',
      text: '当作没看见',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'chivalry',
          value: -5,
          operator: 'add',
        },
        {
          type: EffectType.EVENT_RECORD,
          target: 'metBully',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['童年', '奇遇', '道德选择'],
    enabled: true,
  },
};

// ========== 多阶段事件示例 ==========

/**
 * 师门任务事件（多阶段）
 */
export const sectMissionExample: EventDefinition = {
  id: 'sect_mission_example',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.HIGH,
  weight: 20,
  
  ageRange: { min: 14, max: 25 },
  triggers: [
    { type: 'age_reach', value: 14 },
  ],
  
  conditions: [
    {
      type: 'expression',
      expression: 'player.sect != null AND !flags.has("onSectMission")',
    },
  ],
  
  content: {
    text: '师傅叫住你：「徒儿，为师有个任务交给你。护送师妹去江南办事，你可愿意？」',
    title: '师门任务',
  },
  
  eventType: 'choice',
  choices: [
    {
      id: 'accept_mission',
      text: '接受任务',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'chivalry',
          value: 15,
          operator: 'add',
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'money',
          value: 50,
          operator: 'add',
        },
        {
          type: EffectType.FLAG_SET,
          target: 'onSectMission',
        },
      ],
    },
    {
      id: 'decline_mission',
      text: '婉拒任务',
      effects: [
        {
          type: EffectType.TIME_ADVANCE,
          target: 'age',
          value: 1,
        },
        {
          type: EffectType.STAT_MODIFY,
          target: 'chivalry',
          value: -5,
          operator: 'add',
        },
      ],
    },
  ],
  
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    author: 'system',
    tags: ['青年', '师门', '支线'],
    enabled: true,
  },
};

// ========== 事件集合导出 ==========

/**
 * 所有示例事件
 */
export const eventExamples: EventDefinition[] = [
  birthExample1,
  birthExample2,
  age2Example,
  childhoodTrainingExample,
  bullyEncounterExample,
  sectMissionExample,
];

/**
 * 事件模板使用说明：
 * 
 * 1. 复制任意一个示例事件作为模板
 * 2. 修改 id、category、priority 等基础信息
 * 3. 调整 ageRange 和 triggers 定义触发条件
 * 4. 编写 content.text 事件描述
 * 5. 定义 eventType（auto 或 choice）
 * 6. 如果是 choice 类型，添加 choices 数组
 * 7. 使用 EffectType 定义效果
 * 8. 填写 metadata 元数据
 * 
 * 注意事项：
 * - id 必须唯一，格式：category_age_description
 * - 所有效果都应该使用 EffectType 枚举
 * - 条件表达式使用安全的字符串格式
 * - 确保所有字段都符合 EventDefinition 类型
 */
