// 这是一个长时间跨度事件的示例文件
// 展示如何使用新的时间系统

import type { StoryNode } from '../types';

export const longEventExample: StoryNode[] = [
  // 示例 1: 闭关修炼（按日计算）
  {
    id: 'closed_training_start',
    minAge: 15,
    maxAge: 50,
    text: '你决定闭关修炼，突破当前瓶颈。',
    condition: (state) => state.martialPower >= 30 && !state.events.has('closedTraining'),
    weight: 15,
    choices: [
      {
        id: 'train_10_days',
        text: '闭关 10 天',
        timeSpan: { value: 10, unit: 'day' },
        effects: [{
          op: 'add',
          field: 'internalSkill',
          value: 5
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'closedTraining'
        }],
      },
      {
        id: 'train_30_days',
        text: '闭关 30 天（一个月）',
        timeSpan: { value: 30, unit: 'day' },
        effects: [{
          op: 'add',
          field: 'internalSkill',
          value: 12
        }, {
          op: 'add',
          field: 'martialPower',
          value: 8
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'closedTraining'
        }],
      },
      {
        id: 'train_90_days',
        text: '闭关 90 天（三个月）',
        condition: (state) => state.internalSkill >= 20,
        timeSpan: { value: 90, unit: 'day' },
        effects: [{
          op: 'add',
          field: 'internalSkill',
          value: 30
        }, {
          op: 'add',
          field: 'martialPower',
          value: 20
        }, {
          op: 'addFlag',
          field: 'flags',
          value: 'breakthrough'
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'closedTraining'
        }],
      },
    ],
  },

  // 示例 2: 长途旅行（按月计算）
  {
    id: 'long_journey_start',
    minAge: 18,
    maxAge: 40,
    text: '你想去西域游历，听说那里有许多奇人异士。',
    condition: (state) => state.money >= 50 && !state.events.has('westJourney'),
    weight: 12,
    choices: [
      {
        id: 'journey_quick',
        text: '快速往返（6 个月）',
        timeSpan: { value: 6, unit: 'month' },
        effects: [{
          op: 'add',
          field: 'chivalry',
          value: 10
        }, {
          op: 'sub',
          field: 'money',
          value: 30
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'westJourney'
        }],
      },
      {
        id: 'journey_slow',
        text: '慢慢游历（2 年）',
        timeSpan: { value: 2, unit: 'year' },
        effects: [{
          op: 'add',
          field: 'chivalry',
          value: 30
        }, {
          op: 'add',
          field: 'martialPower',
          value: 15
        }, {
          op: 'add',
          field: 'externalSkill',
          value: 20
        }, {
          op: 'sub',
          field: 'money',
          value: 50
        }, {
          op: 'addFlag',
          field: 'flags',
          value: 'wellTraveled'
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'westJourney'
        }],
      },
    ],
  },

  // 示例 3: 师门任务（多阶段，按日计算）
  {
    id: 'sect_mission_start',
    minAge: 14,
    maxAge: 25,
    text: '师傅交给你一个任务：护送师妹去江南办事。',
    condition: (state) => state.sect !== null && !state.events.has('sectMission'),
    weight: 20,
    choices: [
      {
        id: 'accept_mission',
        text: '接受任务',
        timeSpan: { value: 30, unit: 'day' },
        effects: [{
          op: 'add',
          field: 'chivalry',
          value: 15
        }, {
          op: 'add',
          field: 'money',
          value: 50
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'sectMission'
        }],
      },
      {
        id: 'decline_mission',
        text: '婉拒任务',
        effects: [{
          op: 'sub',
          field: 'chivalry',
          value: 5
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'sectMission'
        }],
      },
    ],
  },

  // 示例 4: 寻找秘籍（多阶段事件，按周计算）
  {
    id: 'seek_manual_start',
    minAge: 16,
    maxAge: 35,
    text: '你听说在东海之滨有一本上古秘籍，决定去寻找。',
    condition: (state) => state.qinggong >= 15 && !state.events.has('seekManual'),
    weight: 10,
    choices: [
      {
        id: 'seek_1_week',
        text: '寻找 1 周',
        timeSpan: { value: 7, unit: 'day' },
        effects: [{
          op: 'random',
          field: 'martialPower',
          minValue: 0,
          maxValue: 5
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'seekManual'
        }],
      },
      {
        id: 'seek_1_month',
        text: '寻找 1 个月',
        timeSpan: { value: 30, unit: 'day' },
        effects: [{
          op: 'random',
          field: 'martialPower',
          minValue: 5,
          maxValue: 15
        }, {
          op: 'add',
          field: 'qinggong',
          value: 5
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'seekManual'
        }],
      },
      {
        id: 'seek_3_months',
        text: '寻找 3 个月',
        timeSpan: { value: 90, unit: 'day' },
        effects: [{
          op: 'random',
          field: 'martialPower',
          minValue: 15,
          maxValue: 30
        }, {
          op: 'add',
          field: 'qinggong',
          value: 10
        }, {
          op: 'addFlag',
          field: 'flags',
          value: 'foundManual'
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'seekManual'
        }],
      },
    ],
  },
  {
    id: 'manual_result_found',
    minAge: 16,
    maxAge: 36,
    text: '功夫不负有心人！你在一处海蚀洞中找到了那本上古秘籍！',
    condition: (state) => state.flags.has('foundManual'),
    autoNext: true,
    weight: 100,
    timeSpan: { value: 1, unit: 'day' },
    autoEffects: [{
      op: 'add',
      field: 'internalSkill',
      value: 50
    }, {
      op: 'add',
      field: 'martialPower',
      value: 30
    }, {
      op: 'clearFlags',
    }],
  },

  // 示例 5: 照顾病人（按日计算的连续事件）
  {
    id: 'care_sick_start',
    minAge: 15,
    maxAge: 40,
    text: '你在路边遇到一位受伤的老人，他看起来病得不轻。',
    condition: (state) => state.chivalry >= 10 && !state.events.has('careSick'),
    weight: 18,
    choices: [
      {
        id: 'care_3_days',
        text: '照顾 3 天',
        timeSpan: { value: 3, unit: 'day' },
        effects: [{
          op: 'add',
          field: 'chivalry',
          value: 5
        }, {
          op: 'sub',
          field: 'money',
          value: 10
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'careSick'
        }],
      },
      {
        id: 'care_7_days',
        text: '照顾 7 天',
        timeSpan: { value: 7, unit: 'day' },
        effects: [{
          op: 'add',
          field: 'chivalry',
          value: 15
        }, {
          op: 'sub',
          field: 'money',
          value: 20
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'careSick'
        }],
      },
      {
        id: 'care_15_days',
        text: '照顾 15 天',
        timeSpan: { value: 15, unit: 'day' },
        condition: (state) => state.money >= 30,
        effects: [{
          op: 'add',
          field: 'chivalry',
          value: 30
        }, {
          op: 'sub',
          field: 'money',
          value: 30
        }, {
          op: 'addFlag',
          field: 'flags',
          value: 'savedElder'
        }, {
          op: 'addEvent',
          field: 'events',
          value: 'careSick'
        }],
      },
    ],
  },
  {
    id: 'sick_result_saved',
    minAge: 15,
    maxAge: 41,
    text: '老人康复后，感激地说：「年轻人，你是个好孩子。我无以为报，这套武功就传授给你吧。」',
    condition: (state) => state.flags.has('savedElder'),
    autoNext: true,
    weight: 100,
    timeSpan: { value: 1, unit: 'day' },
    autoEffects: [{
      op: 'add',
      field: 'martialPower',
      value: 40
    }, {
      op: 'add',
      field: 'internalSkill',
      value: 25
    }, {
      op: 'clearFlags',
    }],
  },
];
