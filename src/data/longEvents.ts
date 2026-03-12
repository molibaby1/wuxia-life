import type { StoryNode, PlayerState } from '../types';

/**
 * 多阶段长事件集合
 * 每个事件都有完整的阶段流程，使用 flag 和 event 来连接各阶段
 */

// ==================== 门派入门事件 ====================
export const sectJoinEvents: StoryNode[] = [
  // 阶段 1: 门派招新公告
  {
    id: 'sect_recruitment_announcement',
    minAge: 12,
    maxAge: 16,
    text: '各大门派开始招收弟子了！少林、武当、峨眉等名门正派都在招揽人才。',
    condition: (state) => state.sect === null && !state.flags.has('joinedSectAttempt'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'apply_shaolin',
        text: '报名少林派',
        condition: (state) => state.gender === 'male',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['appliedShaolin']),
          events: new Set(['sectRecruitment']),
        }),
      },
      {
        id: 'apply_wudang',
        text: '报名武当派',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['appliedWudang']),
          events: new Set(['sectRecruitment']),
        }),
      },
      {
        id: 'apply_emei',
        text: '报名峨眉派',
        condition: (state) => state.gender === 'female',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['appliedEmei']),
          events: new Set(['sectRecruitment']),
        }),
      },
      {
        id: 'decline_sect',
        text: '自学成才',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['selfTaught']),
          events: new Set(['sectRecruitment']),
        }),
      },
    ],
  },

  // 阶段 2: 体魄测试（少林）
  {
    id: 'shaolin_physical_test',
    minAge: 12,
    maxAge: 17,
    text: '你来到少林寺，武僧统领打量着你：「来，试试举起这块五百斤的石锁。」',
    condition: (state) => state.flags.has('appliedShaolin') && !state.events.has('physicalTest'),
    weight: 1000, // 高权重，确保优先触发
    choices: [
      {
        id: 'lift_easily',
        text: '轻松举起',
        condition: (state) => state.externalSkill >= 10,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalPass']),
          events: new Set(['physicalTest']),
        }),
      },
      {
        id: 'lift_struggle',
        text: '勉强举起',
        condition: (state) => state.externalSkill >= 5 && state.externalSkill < 10,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalPass']),
          events: new Set(['physicalTest']),
        }),
      },
      {
        id: 'lift_fail',
        text: '举不起来',
        condition: (state) => state.externalSkill < 5,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalFail']),
          events: new Set(['physicalTest']),
        }),
      },
    ],
  },

  // 阶段 2: 体魄测试（武当）
  {
    id: 'wudang_physical_test',
    minAge: 12,
    maxAge: 17,
    text: '你来到武当山，道长让你展示基本功：「打一套太极拳来看看。」',
    condition: (state) => state.flags.has('appliedWudang') && !state.events.has('physicalTest'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'taichi_perfect',
        text: '打出完美拳法',
        condition: (state) => state.internalSkill >= 10,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalPass']),
          events: new Set(['physicalTest']),
        }),
      },
      {
        id: 'taichi_good',
        text: '打得不错',
        condition: (state) => state.internalSkill >= 5 && state.internalSkill < 10,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalPass']),
          events: new Set(['physicalTest']),
        }),
      },
      {
        id: 'taichi_poor',
        text: '打得很生疏',
        condition: (state) => state.internalSkill < 5,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalFail']),
          events: new Set(['physicalTest']),
        }),
      },
    ],
  },

  // 阶段 2: 体魄测试（峨眉）
  {
    id: 'emei_physical_test',
    minAge: 12,
    maxAge: 17,
    text: '你来到峨眉山，师姐让你演示剑法：「舞一套峨眉剑法来瞧瞧。」',
    condition: (state) => state.flags.has('appliedEmei') && !state.events.has('physicalTest'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'sword_perfect',
        text: '剑法精妙',
        condition: (state) => state.externalSkill >= 10,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalPass']),
          events: new Set(['physicalTest']),
        }),
      },
      {
        id: 'sword_good',
        text: '剑法不错',
        condition: (state) => state.externalSkill >= 5 && state.externalSkill < 10,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalPass']),
          events: new Set(['physicalTest']),
        }),
      },
      {
        id: 'sword_poor',
        text: '剑法生疏',
        condition: (state) => state.externalSkill < 5,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['physicalFail']),
          events: new Set(['physicalTest']),
        }),
      },
    ],
  },

  // 阶段 3: 心性测试（通用）
  {
    id: 'sect_mental_test',
    minAge: 12,
    maxAge: 17,
    text: '体魄测试通过后，长老问你：「习武之人，最重要的是什么？」',
    condition: (state) => state.flags.has('physicalPass') && !state.events.has('mentalTest'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'answer_virtue',
        text: '「武德」',
        condition: (state) => state.chivalry >= 15,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['mentalPass']),
          events: new Set(['mentalTest']),
        }),
      },
      {
        id: 'answer_persistence',
        text: '「毅力」',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['mentalPass']),
          events: new Set(['mentalTest']),
        }),
      },
      {
        id: 'answer_diligence',
        text: '「勤奋」',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['mentalPass']),
          events: new Set(['mentalTest']),
        }),
      },
    ],
  },

  // 阶段 4: 录取 - 少林
  {
    id: 'shaolin_accepted',
    minAge: 13,
    maxAge: 17,
    text: '方丈亲自接见你：「从今日起，你便是我少林弟子。望你勤修佛法，精研武学。」',
    condition: (state) => state.flags.has('appliedShaolin') && state.flags.has('mentalPass'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      sect: '少林派',
      externalSkill: state.externalSkill + 10,
      internalSkill: state.internalSkill + 5,
      events: new Set(['joinedShaolin']), // 设置已加入事件，防止重复触发
      flags: new Set(), // 清空临时 flags
    }),
  },

  // 阶段 4: 录取 - 武当
  {
    id: 'wudang_accepted',
    minAge: 13,
    maxAge: 17,
    text: '掌门微笑点头：「从今日起，你便是我武当弟子。望你潜心修道，领悟太极真谛。」',
    condition: (state) => state.flags.has('appliedWudang') && state.flags.has('mentalPass'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      sect: '武当派',
      internalSkill: state.internalSkill + 15,
      qinggong: state.qinggong + 5,
      events: new Set(['joinedWudang']),
      flags: new Set(),
    }),
  },

  // 阶段 4: 录取 - 峨眉
  {
    id: 'emei_accepted',
    minAge: 13,
    maxAge: 17,
    text: '掌门灭绝师太微微颔首：「从今日起，你便是我峨眉弟子。望你恪守门规，发扬峨眉。」',
    condition: (state) => state.flags.has('appliedEmei') && state.flags.has('mentalPass'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      sect: '峨眉派',
      internalSkill: state.internalSkill + 12,
      externalSkill: state.externalSkill + 8,
      events: new Set(['joinedEmei']),
      flags: new Set(),
    }),
  },

  // 阶段 4: 失败 - 少林
  {
    id: 'shaolin_rejected',
    minAge: 13,
    maxAge: 17,
    text: '武僧统领摇头：「你体魄不足，难当少林武学。回去吧。」',
    condition: (state) => state.flags.has('appliedShaolin') && state.flags.has('physicalFail'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      flags: new Set(['selfTaught']),
      martialPower: state.martialPower + 5,
    }),
  },

  // 阶段 4: 失败 - 武当
  {
    id: 'wudang_rejected',
    minAge: 13,
    maxAge: 17,
    text: '道长叹息：「你与道无缘，另寻他路吧。」',
    condition: (state) => state.flags.has('appliedWudang') && state.flags.has('physicalFail'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      flags: new Set(['selfTaught']),
      martialPower: state.martialPower + 5,
    }),
  },

  // 阶段 4: 失败 - 峨眉
  {
    id: 'emei_rejected',
    minAge: 13,
    maxAge: 17,
    text: '师姐摇头：「你的剑法还不够看，回去吧。」',
    condition: (state) => state.flags.has('appliedEmei') && state.flags.has('physicalFail'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      flags: new Set(['selfTaught']),
      martialPower: state.martialPower + 5,
    }),
  },

  // 阶段 4: 自学成才
  {
    id: 'self_taught_path',
    minAge: 13,
    maxAge: 18,
    text: '既然没有门派，那就走自己的路！你决定独自在江湖闯荡。',
    condition: (state) => state.flags.has('selfTaught'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      martialPower: state.martialPower + 15,
      qinggong: state.qinggong + 10,
      chivalry: state.chivalry + 10,
      flags: new Set(),
    }),
  },
];

// ==================== 武林大会事件 ====================
export const tournamentEvents: StoryNode[] = [
  // 阶段 1: 大会公告
  {
    id: 'tournament_announcement',
    minAge: 18,
    maxAge: 35,
    text: '江湖传闻，五年一度的武林大会即将在华山召开！各路英雄豪杰纷纷前往。',
    condition: (state) => state.martialPower >= 25 && !state.events.has('tournament2024'),
    weight: 30,
    choices: [
      {
        id: 'join_tournament',
        text: '报名参加',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['joinedTournament']),
          events: new Set(['tournament2024']),
        }),
      },
      {
        id: 'watch_tournament',
        text: '旁观观摩',
        effect: (state) => ({
          age: state.age + 1,
          martialPower: state.martialPower + 5,
          events: new Set(['tournament2024']),
        }),
      },
      {
        id: 'skip_tournament',
        text: '不感兴趣',
        effect: (state) => ({
          age: state.age + 1,
          events: new Set(['tournament2024']),
        }),
      },
    ],
  },

  // 阶段 2: 初赛
  {
    id: 'tournament_preliminary',
    minAge: 18,
    maxAge: 36,
    text: '武林大会正式开始！第一场比试，你的对手是一个彪形大汉，手持双斧。',
    condition: (state) => state.flags.has('joinedTournament') && !state.flags.has('preliminaryWin') && !state.flags.has('preliminaryLose'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'fight_careful',
        text: '谨慎应战',
        condition: (state) => state.martialPower >= 30,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['preliminaryWin']),
          martialPower: state.martialPower + 3,
        }),
      },
      {
        id: 'fight_aggressive',
        text: '主动进攻',
        effect: (state) => {
          if (state.martialPower >= 35) {
            return {
              age: state.age + 1,
              flags: new Set(['preliminaryWin']),
              martialPower: state.martialPower + 5,
            };
          } else {
            return {
              age: state.age + 1,
              flags: new Set(['preliminaryLose']),
              internalSkill: Math.max(0, state.internalSkill - 5),
            };
          }
        },
      },
    ],
  },

  // 阶段 3: 半决赛
  {
    id: 'tournament_semifinal',
    minAge: 18,
    maxAge: 37,
    text: '你成功晋级半决赛！对手是一位峨眉派女侠，剑法精妙。',
    condition: (state) => state.flags.has('preliminaryWin') && !state.flags.has('semifinalWin'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'use_qinggong',
        text: '以轻功取胜',
        condition: (state) => state.qinggong >= 20,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['semifinalWin']),
          qinggong: state.qinggong + 5,
        }),
      },
      {
        id: 'use_strength',
        text: '以力量取胜',
        condition: (state) => state.martialPower >= 45,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['semifinalWin']),
          martialPower: state.martialPower + 5,
        }),
      },
      {
        id: 'use_technique',
        text: '以技巧周旋',
        condition: (state) => state.externalSkill >= 30,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['semifinalWin']),
          externalSkill: state.externalSkill + 5,
        }),
      },
    ],
  },

  // 阶段 4: 决赛
  {
    id: 'tournament_final',
    minAge: 18,
    maxAge: 38,
    text: '决赛！你的对手是上届盟主之子，实力深不可测。全场观众屏息以待。',
    condition: (state) => state.flags.has('semifinalWin') && !state.flags.has('tournamentChampion') && !state.flags.has('tournamentRunnerUp'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'final_all_out',
        text: '全力以赴',
        condition: (state) => state.martialPower >= 60,
        effect: (state) => {
          if (state.martialPower >= 70) {
            return {
              age: state.age + 1,
              flags: new Set(['tournamentChampion']),
              title: '武林新秀',
              chivalry: state.chivalry + 50,
              money: state.money + 500,
            };
          } else {
            return {
              age: state.age + 1,
              flags: new Set(['tournamentRunnerUp']),
              chivalry: state.chivalry + 30,
              money: state.money + 200,
            };
          }
        },
      },
      {
        id: 'final_defensive',
        text: '防守反击',
        condition: (state) => state.internalSkill >= 50,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['tournamentRunnerUp']),
          chivalry: state.chivalry + 30,
          money: state.money + 200,
        }),
      },
    ],
  },

  // 阶段 5: 冠军结局
  {
    id: 'tournament_champion_result',
    minAge: 18,
    maxAge: 39,
    text: '恭喜你！你击败了所有对手，夺得武林大会头筹！「武林新秀」的名号传遍江湖！各门派纷纷向你抛出橄榄枝。',
    condition: (state) => state.flags.has('tournamentChampion'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      martialPower: state.martialPower + 20,
      chivalry: state.chivalry + 20,
      flags: new Set(),
    }),
  },

  // 阶段 5: 亚军结局
  {
    id: 'tournament_runnerup_result',
    minAge: 18,
    maxAge: 39,
    text: '你获得了武林大会的亚军！虽然有些遗憾，但你的表现已经赢得了众人的尊重。',
    condition: (state) => state.flags.has('tournamentRunnerUp'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      martialPower: state.martialPower + 15,
      chivalry: state.chivalry + 15,
      flags: new Set(),
    }),
  },

  // 阶段 5: 淘汰结局
  {
    id: 'tournament_eliminated_result',
    minAge: 18,
    maxAge: 39,
    text: '你在初赛或半决赛中落败，无缘决赛。但你从这次大会中学到了很多，见识了各门派的绝技。',
    condition: (state) => state.flags.has('preliminaryLose'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      martialPower: state.martialPower + 8,
      externalSkill: state.externalSkill + 8,
      flags: new Set(),
    }),
  },
];

// ==================== 爱情线事件 ====================
export const loveStoryEvents: StoryNode[] = [
  // 阶段 1: 初次相遇
  {
    id: 'love_first_meeting',
    minAge: 16,
    maxAge: 22,
    text: '春日明媚，你在桃花树下遇到了一位让你心动的人。Ta 正专注地看着手中的书卷，微风拂过，花瓣飘落。',
    condition: (state) => !state.events.has('metLove'),
    weight: 40,
    choices: [
      {
        id: 'approach_bravely',
        text: '勇敢上前搭话',
        condition: (state) => state.chivalry >= 15,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['approachedLove']),
          events: new Set(['metLove']),
          chivalry: state.chivalry + 3,
        }),
      },
      {
        id: 'watch_silently',
        text: '默默注视',
        effect: (state) => ({
          age: state.age + 1,
          events: new Set(['metLove']),
        }),
      },
      {
        id: 'leave_quietly',
        text: '悄悄离开',
        effect: (state) => ({
          age: state.age + 1,
          events: new Set(['metLove']),
        }),
      },
    ],
  },

  // 阶段 2: 再次相遇
  {
    id: 'love_second_encounter',
    minAge: 17,
    maxAge: 23,
    text: '数月后，你们在江湖上再次相遇。原来 Ta 也是习武之人，正在追查一桩案件。',
    condition: (state) => state.events.has('metLove') && !state.events.has('secondMeeting'),
    weight: 35,
    choices: [
      {
        id: 'help_investigate',
        text: '主动帮忙查案',
        condition: (state) => state.martialPower >= 25,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['helpedLove']),
          events: new Set(['secondMeeting']),
          chivalry: state.chivalry + 10,
        }),
      },
      {
        id: 'give_tips',
        text: '提供线索',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['helpedLove']), // 设置帮助 flag，让后续剧情可以触发
          events: new Set(['secondMeeting']),
          chivalry: state.chivalry + 5,
        }),
      },
      {
        id: 'pretend_not_know',
        text: '假装不认识',
        effect: (state) => ({
          age: state.age + 1,
          events: new Set(['secondMeeting']),
        }),
      },
    ],
  },

  // 阶段 3: 感情发展（如果选择了帮忙）
  {
    id: 'love_develop_relationship',
    minAge: 18,
    maxAge: 24,
    text: '经过几次相遇，你们渐渐熟悉起来。Ta 邀请你一起游历江湖，你意下如何？',
    condition: (state) => state.flags.has('helpedLove') && !state.events.has('travelTogether'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'travel_together',
        text: '一起游历',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['travelingTogether']),
          events: new Set(['travelTogether']),
          chivalry: state.chivalry + 15,
          martialPower: state.martialPower + 10,
        }),
      },
      {
        id: 'decline_travel',
        text: '婉言谢绝',
        effect: (state) => ({
          age: state.age + 1,
          events: new Set(['travelTogether']),
          chivalry: Math.max(0, state.chivalry - 5),
        }),
      },
    ],
  },

  // 阶段 3 替代：假装不认识的后续（关系冷淡）
  {
    id: 'love_stranger_path',
    minAge: 18,
    maxAge: 24,
    text: '自从你假装不认识后，你们的关系渐渐疏远。多年后听说 Ta 已与他人成婚。',
    condition: (state) => state.events.has('metLove') && state.events.has('secondMeeting') && !state.flags.has('helpedLove') && !state.events.has('travelTogether'),
    weight: 1000, // 高优先级
    autoNext: true,
    autoEffect: (state) => ({
      age: state.age + 5,
      martialPower: state.martialPower + 15,
      chivalry: Math.max(0, state.chivalry - 10),
      events: new Set(['loveEnded']),
    }),
  },

  // 阶段 4: 表白
  {
    id: 'love_confession',
    minAge: 19,
    maxAge: 25,
    text: '中秋之夜，月色如水。Ta 对你说：「这一路走来，有你在身边真好。」眼神中似有千言万语。',
    condition: (state) => state.flags.has('travelingTogether'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'confess_love',
        text: '表白心意',
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['inLove']),
          chivalry: state.chivalry + 20,
        }),
      },
      {
        id: 'hesitate',
        text: '犹豫不决',
        effect: (state) => ({
          age: state.age + 1,
          events: new Set(['hesitated']),
          chivalry: Math.max(0, state.chivalry - 10),
        }),
      },
    ],
  },

  // 阶段 5: 求婚
  {
    id: 'love_proposal',
    minAge: 21,
    maxAge: 28,
    text: '几年过去，你们的感情愈发深厚。是时候考虑终身大事了...',
    condition: (state) => state.flags.has('inLove'),
    weight: 50,
    choices: [
      {
        id: 'propose_marriage',
        text: '求婚/提亲',
        condition: (state) => state.money >= 100,
        effect: (state) => ({
          age: state.age + 1,
          flags: new Set(['married']),
          money: Math.max(0, state.money - 100),
          chivalry: state.chivalry + 30,
          events: new Set(['gotMarried']),
        }),
      },
      {
        id: 'focus_career',
        text: '先专注武道',
        effect: (state) => ({
          age: state.age + 1,
          martialPower: state.martialPower + 20,
          events: new Set(['gotMarried']),
        }),
      },
    ],
  },

  // 阶段 6: 婚礼
  {
    id: 'love_wedding',
    minAge: 21,
    maxAge: 30,
    text: '良辰吉日，你们举行了盛大的婚礼。亲朋好友齐聚一堂，共同见证这幸福的时刻。',
    condition: (state) => state.flags.has('married'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({
      age: state.age + 1,
      chivalry: state.chivalry + 20,
      money: state.money + 100,
      children: state.children + 1,
      flags: new Set(),
    }),
  },

  // 阶段 6: 单身结局
  {
    id: 'love_single_life',
    minAge: 25,
    maxAge: 40,
    text: '你选择了一个人的生活，虽然偶尔会感到孤独，但江湖就是你的家。',
    condition: (state) => state.events.has('metLove') && !state.events.has('gotMarried'),
    autoNext: true,
    weight: 20,
    autoEffect: (state) => ({
      age: state.age + 5,
      martialPower: state.martialPower + 30,
      qinggong: state.qinggong + 20,
    }),
  },
];
