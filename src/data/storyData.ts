import type { StoryNode, DeathEnding, PlayerState } from '../types';
import { evaluateCondition } from '../utils/storyInterpreter';
import { sectJoinEvents, tournamentEvents, loveStoryEvents } from './longEvents';

function checkNodeCondition(node: StoryNode, state: PlayerState): boolean {
  if ('condition' in node) {
    const cond = (node as any).condition;
    if (typeof cond === 'function') {
      return cond(state);
    } else if (cond && typeof cond === 'object') {
      return evaluateCondition(cond, state);
    }
  }
  return true;
}

export const storyNodes: StoryNode[] = [
  {
    id: 'birth_1',
    minAge: 0,
    maxAge: 0,
    text: '你降生在一个武侠世家，哭声洪亮，远近皆闻。',
    autoNext: true,
    weight: 70,
    autoEffect: (state) => {
      if (Math.random() < 0.1) {
        return { 
          alive: false, 
          deathReason: '出生时因脐带绕颈，不幸夭折', 
          title: '最短命少侠' 
        };
      }
      return { age: state.age + 1 };
    },
  },
  {
    id: 'birth_2',
    minAge: 0,
    maxAge: 0,
    text: '你出生时天有异象，一道金光从天而降！',
    autoNext: true,
    weight: 20,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 5,
      flags: new Set(['bornWithBlessing'])
    }),
  },
  {
    id: 'birth_3',
    minAge: 0,
    maxAge: 0,
    text: '你是个早产儿，体弱多病，但眼神异常坚定。',
    autoNext: true,
    weight: 10,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill - 2,
      qinggong: state.qinggong + 3,
      flags: new Set(['bornWeak'])
    }),
  },

  {
    id: 'age_1',
    minAge: 1,
    maxAge: 1,
    text: '你在父母的呵护下慢慢长大，牙牙学语。',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => ({ age: state.age + 1 }),
  },
  {
    id: 'age_1_2',
    minAge: 1,
    maxAge: 1,
    text: '你学会了走路，开始在家中四处探索，经常搞些小破坏。',
    autoNext: true,
    weight: 30,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      qinggong: state.qinggong + 1
    }),
  },
  {
    id: 'age_1_3',
    minAge: 1,
    maxAge: 1,
    text: '你天资聪颖，一岁就能背诗，三岁就能识字。',
    autoNext: true,
    weight: 20,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 2
    }),
  },

  {
    id: 'age_2',
    minAge: 2,
    maxAge: 2,
    text: '这一年你长高了不少，也更懂事了。',
    autoNext: true,
    weight: 60,
    autoEffect: (state) => ({ age: state.age + 1 }),
  },
  {
    id: 'age_2_2',
    minAge: 2,
    maxAge: 2,
    text: '你经常一个人发呆，似乎在思考什么深奥的问题。',
    autoNext: true,
    weight: 40,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 1
    }),
  },

  {
    id: 'age_3',
    minAge: 3,
    maxAge: 3,
    text: '你已经能说会道，常常逗得家人开怀大笑。',
    autoNext: true,
    weight: 70,
    autoEffect: (state) => ({ age: state.age + 1 }),
  },
  {
    id: 'age_3_2',
    minAge: 3,
    maxAge: 3,
    text: '你生了一场小病，但很快就康复了。',
    autoNext: true,
    weight: 30,
    autoEffect: (state) => ({ age: state.age + 1 }),
  },

  {
    id: 'age_4',
    minAge: 4,
    maxAge: 4,
    text: '你开始识字读书，对书架上的武学秘籍充满好奇。',
    autoNext: true,
    weight: 40,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 2 
    }),
  },
  {
    id: 'age_4_2',
    minAge: 4,
    maxAge: 4,
    text: '你偷偷翻阅了家中的几本基础武学书籍，似懂非懂。',
    autoNext: true,
    weight: 35,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 3,
      flags: new Set(['hasStolenBook'])
    }),
  },
  {
    id: 'age_4_3',
    minAge: 4,
    maxAge: 4,
    text: '你只喜欢玩耍，对读书练功毫无兴趣。',
    autoNext: true,
    weight: 25,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      qinggong: state.qinggong + 2,
      money: state.money + Math.floor(Math.random() * 5)
    }),
  },

  {
    id: 'age_5',
    minAge: 5,
    maxAge: 5,
    text: '这一年你在读书和玩耍中度过。',
    autoNext: true,
    weight: 60,
    autoEffect: (state) => ({ age: state.age + 1 }),
  },
  {
    id: 'age_5_2',
    minAge: 5,
    maxAge: 5,
    text: '你交到了几个好朋友，经常一起玩。',
    autoNext: true,
    weight: 40,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      qinggong: state.qinggong + 1
    }),
  },

  {
    id: 'age_6',
    minAge: 6,
    maxAge: 6,
    text: '这一年平平无奇，就这么过去了。',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => ({ age: state.age + 1 }),
  },
  {
    id: 'age_6_2',
    minAge: 6,
    maxAge: 6,
    text: '你开始对武功表现出浓厚的兴趣。',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 1
    }),
  },

  {
    id: 'age_7',
    minAge: 7,
    maxAge: 7,
    text: '父亲开始教你基础武功，你的武学天赋逐渐显露。',
    weight: 100,
    choices: [
      {
        id: 'train_hard',
        text: '刻苦练习',
        effect: (state) => ({ 
          age: state.age + 1, 
          externalSkill: state.externalSkill + 5, 
          martialPower: state.martialPower + 3 
        }),
      },
      {
        id: 'play_hooky',
        text: '偷偷溜出去玩',
        effect: (state) => ({ 
          age: state.age + 1, 
          qinggong: state.qinggong + 3,
          money: state.money + Math.floor(Math.random() * 10)
        }),
      },
    ],
  },

  {
    id: 'age_8_to_12_normal',
    minAge: 8,
    maxAge: 12,
    text: '日复一日，你的武艺在逐渐进步。',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => {
      const progress = Math.random();
      if (progress < 0.3) {
        return { 
          age: state.age + 1, 
          externalSkill: state.externalSkill + 2,
          internalSkill: state.internalSkill + 2,
          martialPower: state.martialPower + 2
        };
      } else if (progress < 0.6) {
        return { 
          age: state.age + 1, 
          qinggong: state.qinggong + 1,
          money: state.money + Math.floor(Math.random() * 10)
        };
      } else {
        return { age: state.age + 1 };
      }
    },
  },
  {
    id: 'age_8_to_12_bully',
    minAge: 8,
    maxAge: 12,
    text: '一日下山，你遇到一个恶棍在欺负百姓。',
    condition: (state) => !state.events.has('metBully'),
    weight: 25,
    choices: [
      {
        id: 'fight_bully',
        text: '出手相助',
        effect: (state) => {
          if (state.martialPower >= 10 || state.externalSkill >= 15) {
            return { 
              age: state.age + 1, 
              chivalry: state.chivalry + 20,
              money: state.money + 50,
              flags: new Set(['bullyFightWin']),
              events: new Set(['metBully']),
            };
          } else {
            return { 
              age: state.age + 1, 
              chivalry: state.chivalry + 5,
              internalSkill: Math.max(0, state.internalSkill - 3),
              externalSkill: Math.max(0, state.externalSkill - 3),
              flags: new Set(['bullyFightLose']),
              events: new Set(['metBully']),
            };
          }
        },
      },
      {
        id: 'escape_qinggong',
        text: '用轻功溜走，报官处理',
        condition: (state) => state.qinggong >= 8,
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 5,
          flags: new Set(['reportedToOfficials']),
          events: new Set(['metBully']),
        }),
      },
      {
        id: 'ignore_bully',
        text: '视而不见，绕道而行',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry - 10,
          flags: new Set(['ignoredBully']),
          events: new Set(['metBully']),
        }),
      },
    ],
  },
  {
    id: 'age_8_to_12_secret',
    minAge: 8,
    maxAge: 12,
    text: '你在练武时意外发现了一本藏在墙缝里的秘籍！',
    condition: (state) => !state.events.has('metBully') && !state.events.has('foundSecretBook'),
    autoNext: true,
    weight: 15,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 10,
      events: new Set(['foundSecretBook'])
    }),
  },
  {
    id: 'age_8_to_12_old_man',
    minAge: 8,
    maxAge: 12,
    text: '你在山上玩耍时救了一位受伤的老人，他传了你几招轻功。',
    condition: (state) => !state.events.has('metBully'),
    autoNext: true,
    weight: 10,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      qinggong: state.qinggong + 8,
      chivalry: state.chivalry + 10
    }),
  },

  {
    id: 'bully_result_win',
    minAge: 8,
    maxAge: 13,
    text: '你大喝一声冲上前去，几招就把那恶棍打倒在地！百姓们纷纷称谢，还给了你一些银两作为酬谢。',
    condition: (state) => state.flags.has('bullyFightWin'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'bully_result_lose',
    minAge: 8,
    maxAge: 13,
    text: '你冲上前去与那恶棍打斗，奈何实力不济，被他几招打倒在地，还受了些伤。幸好一位路过的大侠出手相救，才保住性命。',
    condition: (state) => state.flags.has('bullyFightLose'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'bully_result_reported',
    minAge: 8,
    maxAge: 13,
    text: '你施展轻功迅速离开现场，找到当地官府报案。官府很快派人前去，将那恶棍绳之以法。',
    condition: (state) => state.flags.has('reportedToOfficials'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'bully_result_ignored',
    minAge: 8,
    maxAge: 13,
    text: '你装作没看见，绕道而行。虽然保住了平安，但心里总觉得有些愧疚...',
    condition: (state) => state.flags.has('ignoredBully'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'age_13',
    minAge: 13,
    maxAge: 13,
    text: '几位江湖名宿来到你家，有意收你为徒。',
    weight: 100,
    choices: [
      {
        id: 'join_shaolin',
        text: '拜入少林派',
        effect: (state) => ({ 
          age: state.age + 1, 
          sect: '少林派',
          externalSkill: state.externalSkill + 10,
          internalSkill: state.internalSkill + 10,
        }),
      },
      {
        id: 'join_wudang',
        text: '拜入武当派',
        effect: (state) => ({ 
          age: state.age + 1, 
          sect: '武当派',
          internalSkill: state.internalSkill + 15,
          qinggong: state.qinggong + 5,
        }),
      },
      {
        id: 'join_emei',
        text: '拜入峨眉派',
        condition: (state) => state.gender === 'female',
        effect: (state) => ({ 
          age: state.age + 1, 
          sect: '峨眉派',
          internalSkill: state.internalSkill + 12,
          externalSkill: state.externalSkill + 8,
        }),
      },
      {
        id: 'stay_home',
        text: '留在家里自学',
        effect: (state) => ({ 
          age: state.age + 1, 
          martialPower: state.martialPower + 8,
        }),
      },
    ],
  },

  {
    id: 'age_14_to_24_normal',
    minAge: 14,
    maxAge: 24,
    text: '你在师门中刻苦修炼，武艺突飞猛进。',
    autoNext: true,
    weight: 60,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      martialPower: state.martialPower + 3,
      externalSkill: state.externalSkill + 2,
      internalSkill: state.internalSkill + 2,
    }),
  },
  {
    id: 'age_14_to_24_enemy',
    minAge: 14,
    maxAge: 24,
    text: '江湖险恶，不知何时你结下了仇家，今日他找上门来！',
    condition: (state) => !state.events.has('metEnemy'),
    weight: 20,
    choices: [
      {
        id: 'fight_enemy',
        text: '正面迎战',
        effect: (state) => {
          if (state.martialPower >= 35 || state.flags.has('hasEatenImmortalGrass')) {
            return { 
              age: state.age + 1, 
              chivalry: state.chivalry + 25,
              title: '武林大侠',
              flags: new Set(['enemyFightWin']),
              events: new Set(['metEnemy']),
            };
          } else {
            return { 
              age: state.age + 1, 
              internalSkill: Math.max(0, state.internalSkill - 8),
              externalSkill: Math.max(0, state.externalSkill - 8),
              martialPower: Math.max(0, state.martialPower - 12),
              money: Math.max(0, state.money - 150),
              flags: new Set(['enemyFightLose']),
              events: new Set(['metEnemy']),
            };
          }
        },
      },
      {
        id: 'escape_enemy',
        text: '施展轻功逃走',
        condition: (state) => state.qinggong >= 12,
        effect: (state) => ({ 
          age: state.age + 1, 
          flags: new Set(['escapedFromEnemy']),
          events: new Set(['metEnemy']),
        }),
      },
    ],
  },
  {
    id: 'age_14_to_24_master',
    minAge: 14,
    maxAge: 24,
    text: '你在客栈中遇到一位高人，他指点了你几句，受益匪浅！',
    condition: (state) => !state.events.has('metEnemy'),
    autoNext: true,
    weight: 10,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      martialPower: state.martialPower + 12,
      internalSkill: state.internalSkill + 8,
    }),
  },
  {
    id: 'age_14_to_24_robber',
    minAge: 14,
    maxAge: 24,
    text: '你在路上被强盗打劫！',
    condition: (state) => !state.events.has('metEnemy'),
    autoNext: true,
    weight: 5,
    autoEffect: (state) => {
      if (state.martialPower >= 18) {
        return { 
          age: state.age + 1, 
          money: state.money + 60,
          chivalry: state.chivalry + 8
        };
      } else {
        return { 
          age: state.age + 1, 
          money: Math.max(0, state.money - 40)
        };
      }
    },
  },
  {
    id: 'age_14_to_24_sick',
    minAge: 14,
    maxAge: 24,
    text: '你得了一场大病，差点死掉。',
    condition: (state) => !state.events.has('metEnemy'),
    autoNext: true,
    weight: 3,
    autoEffect: (state) => {
      if (Math.random() < 0.1) {
        return { 
          alive: false,
          deathReason: '一场大病夺走了你的生命',
          title: '天妒英才'
        };
      }
      return { 
        age: state.age + 1, 
        internalSkill: Math.max(0, state.internalSkill - 4),
        externalSkill: Math.max(0, state.externalSkill - 4),
      };
    },
  },

  {
    id: 'fantasy_15_ancient_tomb',
    minAge: 15,
    maxAge: 18,
    text: '你在山间迷路，误入一座上古陵墓，墓穴深处传来神秘的召唤声...',
    condition: (state) => !state.events.has('ancientTomb') && state.qinggong >= 10,
    weight: 12,
    choices: [
      {
        id: 'enter_tomb',
        text: '深入探索',
        effect: (state) => {
          const luck = Math.random();
          if (luck < 0.4) {
            return { 
              age: state.age + 1, 
              internalSkill: state.internalSkill + 40,
              martialPower: state.martialPower + 25,
              title: '古墓传人',
              flags: new Set(['tombBlessing']),
              events: new Set(['ancientTomb']),
            };
          } else if (luck < 0.7) {
            return { 
              age: state.age + 1, 
              qinggong: state.qinggong + 20,
              flags: new Set(['tombEscape']),
              events: new Set(['ancientTomb']),
            };
          } else {
            return { 
              age: state.age + 1, 
              internalSkill: Math.max(0, state.internalSkill - 15),
              flags: new Set(['tombCursed']),
              events: new Set(['ancientTomb']),
            };
          }
        },
      },
      {
        id: 'leave_tomb',
        text: '速速离开',
        effect: (state) => ({ 
          age: state.age + 1, 
          events: new Set(['ancientTomb']),
        }),
      },
    ],
  },
  {
    id: 'tomb_result_blessing',
    minAge: 15,
    maxAge: 19,
    text: '墓穴中躺着一位上古仙人的遗骸，他将毕生修为灌注于你！你感觉身体里有使不完的力量！',
    condition: (state) => state.flags.has('tombBlessing'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'tomb_result_escape',
    minAge: 15,
    maxAge: 19,
    text: '你在墓穴中发现了一本《凌波微步》残卷，轻功大进！匆忙中逃出了古墓。',
    condition: (state) => state.flags.has('tombEscape'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'tomb_result_cursed',
    minAge: 15,
    maxAge: 19,
    text: '你不小心触碰了墓中的诅咒，内力大损！幸好你逃得快，保住了性命。',
    condition: (state) => state.flags.has('tombCursed'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'fantasy_16_dragon',
    minAge: 16,
    maxAge: 20,
    text: '风云变色，一条五爪金龙从天而降！它口吐人言，说你是天命之子...',
    condition: (state) => !state.events.has('metDragon') && state.chivalry >= 15,
    weight: 8,
    choices: [
      {
        id: 'accept_dragon',
        text: '接受天命',
        effect: (state) => ({ 
          age: state.age + 1, 
          martialPower: state.martialPower + 50,
          internalSkill: state.internalSkill + 30,
          title: '真龙之子',
          flags: new Set(['dragonBlessed']),
          events: new Set(['metDragon']),
        }),
      },
      {
        id: 'decline_dragon',
        text: '我命由我不由天',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 30,
          qinggong: state.qinggong + 15,
          events: new Set(['metDragon']),
        }),
      },
    ],
  },
  {
    id: 'dragon_result_accepted',
    minAge: 16,
    maxAge: 21,
    text: '金龙长啸一声，化作一道金光钻入你体内！从此你内力生生不息，实力一日千里！',
    condition: (state) => state.flags.has('dragonBlessed'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'dragon_result_declined',
    minAge: 16,
    maxAge: 21,
    text: '金龙闻言哈哈大笑：「好一个我命由我不由天！本座就助你一臂之力！」说罢传授你一套绝世轻功！',
    condition: (state) => state.flags.has('dragonBlessed') === false && state.events.has('metDragon'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'fantasy_17_demon',
    minAge: 17,
    maxAge: 22,
    text: '月圆之夜，你在破庙中遇到一位被封印的上古魔神，他许诺传你无上魔功...',
    condition: (state) => !state.events.has('metDemon') && state.internalSkill >= 15,
    weight: 10,
    choices: [
      {
        id: 'accept_demon',
        text: '学习魔功',
        effect: (state) => {
          if (Math.random() < 0.5) {
            return { 
              age: state.age + 1, 
              martialPower: state.martialPower + 60,
              externalSkill: state.externalSkill + 40,
              title: '魔尊传人',
              chivalry: Math.max(0, state.chivalry - 50),
              flags: new Set(['demonPower']),
              events: new Set(['metDemon']),
            };
          } else {
            return { 
              alive: false,
              deathReason: '被魔神夺舍',
              title: '走火入魔',
            };
          }
        },
      },
      {
        id: 'seal_demon',
        text: '出手封印',
        condition: (state) => state.chivalry >= 20 && state.martialPower >= 25,
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 50,
          title: '降魔卫道',
          internalSkill: state.internalSkill + 25,
          events: new Set(['metDemon']),
        }),
      },
      {
        id: 'flee_demon',
        text: '速速逃离',
        effect: (state) => ({ 
          age: state.age + 1, 
          qinggong: state.qinggong + 5,
          events: new Set(['metDemon']),
        }),
      },
    ],
  },
  {
    id: 'demon_result_accepted',
    minAge: 17,
    maxAge: 23,
    text: '魔神大笑一声，将毕生魔功注入你体内！你感觉自己变强了，但心中似乎有什么东西在悄然改变...',
    condition: (state) => state.flags.has('demonPower'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'demon_result_sealed',
    minAge: 17,
    maxAge: 23,
    text: '你以浩然正气加固了封印！魔神在封印中怒吼，但也无可奈何。天降祥瑞，表彰你的功德！',
    condition: (state) => state.flags.has('demonPower') === false && state.chivalry >= 50 && state.events.has('metDemon'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'fantasy_18_immortal',
    minAge: 18,
    maxAge: 25,
    text: '你在东海之滨遇到一位垂钓的老者，他竟是活了三千年的上古仙人！',
    condition: (state) => !state.events.has('metImmortal') && (state.flags.has('tombBlessing') || state.flags.has('dragonBlessed') || state.martialPower >= 45),
    weight: 6,
    choices: [
      {
        id: 'request_longevity',
        text: '祈求长生',
        effect: (state) => ({ 
          age: state.age + 1, 
          title: '长生不老',
          flags: new Set(['immortalLongevity']),
          events: new Set(['metImmortal']),
        }),
      },
      {
        id: 'request_power',
        text: '追求力量',
        effect: (state) => ({ 
          age: state.age + 1, 
          martialPower: state.martialPower + 80,
          internalSkill: state.internalSkill + 50,
          externalSkill: state.externalSkill + 50,
          qinggong: state.qinggong + 30,
          flags: new Set(['immortalPower']),
          events: new Set(['metImmortal']),
        }),
      },
      {
        id: 'request_wisdom',
        text: '问道求解',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 100,
          title: '悟道真人',
          events: new Set(['metImmortal']),
        }),
      },
    ],
  },
  {
    id: 'immortal_result_longevity',
    minAge: 18,
    maxAge: 26,
    text: '仙人微微一笑，一指指向你的眉心：「长生之道，在于心境。本座赠你三百年寿元，好自为之。」',
    condition: (state) => state.flags.has('immortalLongevity'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'immortal_result_power',
    minAge: 18,
    maxAge: 26,
    text: '仙人仰天长笑：「好一个追求力量！本座便成全你！」说罢，天地灵气疯狂涌入你体内！',
    condition: (state) => state.flags.has('immortalPower'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'immortal_result_wisdom',
    minAge: 18,
    maxAge: 26,
    text: '仙人眼中闪过一丝赞许：「终于来了个问大道的。来，坐下听本座讲道三天。」经此一讲，你心中豁然开朗！',
    condition: (state) => state.flags.has('immortalLongevity') === false && state.flags.has('immortalPower') === false && state.events.has('metImmortal'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
      martialPower: state.martialPower + 40,
      internalSkill: state.internalSkill + 40,
      externalSkill: state.externalSkill + 40,
    }),
  },

  {
    id: 'fantasy_20_alien',
    minAge: 20,
    maxAge: 30,
    text: '夜空中划过一道流星，落地后走出一位金发碧眼的异族武士，他向你发起挑战！',
    condition: (state) => !state.events.has('metAlien') && state.martialPower >= 35,
    weight: 7,
    choices: [
      {
        id: 'fight_alien',
        text: '接受挑战',
        effect: (state) => {
          if (state.martialPower >= 60 || state.flags.has('immortalPower') || state.flags.has('demonPower')) {
            return { 
              age: state.age + 2, 
              title: '异族征服者',
              chivalry: state.chivalry + 40,
              martialPower: state.martialPower + 30,
              flags: new Set(['alienDefeated']),
              events: new Set(['metAlien']),
            };
          } else {
            return { 
              age: state.age + 2, 
              martialPower: Math.max(0, state.martialPower - 20),
              externalSkill: Math.max(0, state.externalSkill - 15),
              flags: new Set(['alienLost']),
              events: new Set(['metAlien']),
            };
          }
        },
      },
      {
        id: 'learn_alien',
        text: '请教武学',
        condition: (state) => state.chivalry >= 25,
        effect: (state) => ({ 
          age: state.age + 2, 
          externalSkill: state.externalSkill + 25,
          qinggong: state.qinggong + 15,
          events: new Set(['metAlien']),
        }),
      },
      {
        id: 'ignore_alien',
        text: '不予理会',
        effect: (state) => ({ 
          age: state.age + 2, 
          events: new Set(['metAlien']),
        }),
      },
    ],
  },
  {
    id: 'alien_result_won',
    minAge: 20,
    maxAge: 32,
    text: '你们大战三天三夜，你终于以一招险胜！异族武士心服口服，将他们一族的独门绝技传授给你！',
    condition: (state) => state.flags.has('alienDefeated'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'alien_result_lost',
    minAge: 20,
    maxAge: 32,
    text: '异族武士的招式诡异莫测，你虽然输了，但也从中学到了不少东西。',
    condition: (state) => state.flags.has('alienLost'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
      martialPower: state.martialPower + 10,
    }),
  },

  {
    id: 'fantasy_25_time_travel',
    minAge: 25,
    maxAge: 40,
    text: '你在探索一处上古遗迹时，触发了时间裂隙！你看到了过去和未来的自己...',
    condition: (state) => !state.events.has('timeTravel') && state.martialPower >= 50,
    weight: 5,
    choices: [
      {
        id: 'change_past',
        text: '改变过去',
        effect: (state) => ({ 
          age: state.age - 10, 
          martialPower: state.martialPower + 50,
          internalSkill: state.internalSkill + 30,
          flags: new Set(['pastChanged']),
          events: new Set(['timeTravel']),
        }),
      },
      {
        id: 'see_future',
        text: '窥探未来',
        effect: (state) => ({ 
          age: state.age + 10, 
          title: '先知',
          flags: new Set(['futureSeen']),
          events: new Set(['timeTravel']),
        }),
      },
      {
        id: 'stay_present',
        text: '活在当下',
        effect: (state) => ({ 
          age: state.age + 3, 
          chivalry: state.chivalry + 30,
          martialPower: state.martialPower + 20,
          events: new Set(['timeTravel']),
        }),
      },
    ],
  },
  {
    id: 'timetravel_result_past',
    minAge: 15,
    maxAge: 30,
    text: '你回到了过去，弥补了当年的遗憾！带着未来的记忆，你的修行一日千里！',
    condition: (state) => state.flags.has('pastChanged'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'timetravel_result_future',
    minAge: 35,
    maxAge: 50,
    text: '你看到了未来的种种可能，虽然年华老去，但心中通明，再无困惑！',
    condition: (state) => state.flags.has('futureSeen'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'enemy_result_win',
    minAge: 14,
    maxAge: 25,
    text: '你与仇家大战一场，终于将其击退！从此你的名声在江湖上更加响亮。',
    condition: (state) => state.flags.has('enemyFightWin'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'enemy_result_lose',
    minAge: 14,
    maxAge: 25,
    text: '你与仇家激战，奈何实力相差悬殊，被打成重伤，还被抢走了不少银两。幸好你命大，捡回了一条命。',
    condition: (state) => state.flags.has('enemyFightLose'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'enemy_result_escaped',
    minAge: 14,
    maxAge: 25,
    text: '你施展轻功，转瞬之间便消失得无影无踪。仇家虽然气得咬牙切齿，但也无可奈何。',
    condition: (state) => state.flags.has('escapedFromEnemy'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'shaolin_14_carry_water',
    minAge: 14,
    maxAge: 16,
    text: '初入少林，方丈命你每日挑水劈柴，磨练心性。',
    condition: (state) => state.sect === '少林派' && !state.events.has('shaolinCarryWater'),
    autoNext: true,
    weight: 1000, // 高优先级，确保门派剧情优先
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      externalSkill: state.externalSkill + 3,
      qinggong: state.qinggong + 2,
      events: new Set(['shaolinCarryWater'])
    }),
  },
  {
    id: 'shaolin_15_sutra',
    minAge: 15,
    maxAge: 17,
    text: '一日在藏经阁打扫，你发现一本泛黄的《易筋经》残篇！',
    condition: (state) => state.sect === '少林派' && !state.events.has('shaolinSutra') && state.internalSkill >= 10,
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'steal_sutra',
        text: '偷偷研习',
        effect: (state) => ({ 
          age: state.age + 1, 
          internalSkill: state.internalSkill + 20,
          martialPower: state.martialPower + 10,
          flags: new Set(['stolenSutra']),
          events: new Set(['shaolinSutra']),
        }),
      },
      {
        id: 'report_sutra',
        text: '交给方丈',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 15,
          internalSkill: state.internalSkill + 5,
          events: new Set(['shaolinSutra']),
        }),
      },
    ],
  },
  {
    id: 'sutra_result_stolen',
    minAge: 15,
    maxAge: 18,
    text: '你日夜研习《易筋经》残篇，内力大进，但也有些担心被发现...',
    condition: (state) => state.flags.has('stolenSutra'),
    autoNext: true,
    weight: 1000,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'sutra_result_reported',
    minAge: 15,
    maxAge: 18,
    text: '方丈见你心性正直，破例传授你《易筋经》入门心法！',
    condition: (state) => state.events.has('shaolinSutra') && !state.flags.has('stolenSutra'),
    autoNext: true,
    weight: 1000,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'wudang_14_taiji',
    minAge: 14,
    maxAge: 16,
    text: '初入武当，张三丰真人亲自指点你太极基础。',
    condition: (state) => state.sect === '武当派' && !state.events.has('wudangTaiji'),
    autoNext: true,
    weight: 1000, // 高优先级，确保门派剧情优先
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 5,
      martialPower: state.martialPower + 3,
      events: new Set(['wudangTaiji'])
    }),
  },
  {
    id: 'wudang_15_herb',
    minAge: 15,
    maxAge: 17,
    text: '你随师兄在武当山采药，发现一株百年灵芝！',
    condition: (state) => state.sect === '武当派' && !state.events.has('wudangHerb'),
    weight: 1000, // 高优先级
    choices: [
      {
        id: 'eat_herb',
        text: '自己服用',
        effect: (state) => ({ 
          age: state.age + 1, 
          internalSkill: state.internalSkill + 15,
          qinggong: state.qinggong + 5,
          flags: new Set(['ateHerb']),
          events: new Set(['wudangHerb']),
        }),
      },
      {
        id: 'give_master',
        text: '献给师傅',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 10,
          internalSkill: state.internalSkill + 8,
          events: new Set(['wudangHerb']),
        }),
      },
    ],
  },

  {
    id: 'emei_14_sword',
    minAge: 14,
    maxAge: 16,
    text: '初入峨眉，灭绝师太亲传你峨眉剑法基础。',
    condition: (state) => state.sect === '峨眉派' && !state.events.has('emeiSword'),
    autoNext: true,
    weight: 1000, // 高优先级，确保门派剧情优先
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      externalSkill: state.externalSkill + 5,
      qinggong: state.qinggong + 3,
      events: new Set(['emeiSword'])
    }),
  },
  {
    id: 'emei_15_needle',
    minAge: 15,
    maxAge: 17,
    text: '师姐周芷若教你金针渡厄之术，可救人也可伤人。',
    condition: (state) => state.sect === '峨眉派' && !state.events.has('emeiNeedle'),
    autoNext: true,
    weight: 1000, // 高优先级
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      internalSkill: state.internalSkill + 4,
      chivalry: state.chivalry + 5,
      events: new Set(['emeiNeedle'])
    }),
  },

  {
    id: 'self_14_encounter',
    minAge: 14,
    maxAge: 16,
    text: '你独自在江湖闯荡，一日遇到一位落魄的高手。',
    condition: (state) => state.sect === null && !state.events.has('selfEncounter'),
    weight: 25,
    choices: [
      {
        id: 'help_master',
        text: '出手相助',
        condition: (state) => state.martialPower >= 10 || state.chivalry >= 10,
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 15,
          martialPower: state.martialPower + 12,
          externalSkill: state.externalSkill + 8,
          events: new Set(['selfEncounter']),
        }),
      },
      {
        id: 'ignore_master',
        text: '视而不见',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: Math.max(0, state.chivalry - 5),
          events: new Set(['selfEncounter']),
        }),
      },
    ],
  },

  {
    id: 'love_16_meet',
    minAge: 16,
    maxAge: 18,
    text: '这一年，你遇到了一位让你心动的人...',
    condition: (state) => !state.events.has('metLove'),
    weight: 35,
    choices: [
      {
        id: 'approach_love',
        text: '主动接近',
        effect: (state) => ({ 
          age: state.age + 1, 
          flags: new Set(['approachedLove']),
          events: new Set(['metLove']),
        }),
      },
      {
        id: 'shy_love',
        text: '暗自喜欢',
        effect: (state) => ({ 
          age: state.age + 1, 
          events: new Set(['metLove']),
        }),
      },
    ],
  },
  {
    id: 'love_17_develop',
    minAge: 17,
    maxAge: 19,
    text: '你们的关系逐渐升温，一起经历了许多事情。',
    condition: (state) => state.events.has('metLove') && state.flags.has('approachedLove') && !state.events.has('loveDevelop'),
    autoNext: true,
    weight: 40,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      chivalry: state.chivalry + 5,
      events: new Set(['loveDevelop'])
    }),
  },
  {
    id: 'love_20_propose',
    minAge: 20,
    maxAge: 22,
    text: '是时候考虑终身大事了...',
    condition: (state) => state.events.has('loveDevelop') && !state.events.has('proposed'),
    weight: 45,
    choices: [
      {
        id: 'propose',
        text: '求婚/提亲',
        effect: (state) => ({ 
          age: state.age + 1, 
          children: state.children + 1,
          money: Math.max(0, state.money - 100),
          events: new Set(['proposed']),
        }),
      },
      {
        id: 'focus_wuxia',
        text: '专注武道',
        effect: (state) => ({ 
          age: state.age + 1, 
          martialPower: state.martialPower + 8,
          events: new Set(['proposed']),
        }),
      },
    ],
  },

  {
    id: 'age_15_to_18_normal',
    minAge: 15,
    maxAge: 18,
    text: '春去秋来，你的武艺日渐精进。',
    autoNext: true,
    weight: 40,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      martialPower: state.martialPower + 2,
      externalSkill: state.externalSkill + 1,
      internalSkill: state.internalSkill + 1,
    }),
  },
  {
    id: 'age_15_competition',
    minAge: 15,
    maxAge: 17,
    text: '师门举行小比，你要参加吗？',
    condition: (state) => state.sect !== null && !state.events.has('sectCompetition'),
    weight: 25,
    choices: [
      {
        id: 'join_competition',
        text: '参加比试',
        effect: (state) => {
          if (state.martialPower >= 20) {
            return { 
              age: state.age + 1, 
              martialPower: state.martialPower + 5,
              money: state.money + 50,
              flags: new Set(['competitionWin']),
              events: new Set(['sectCompetition']),
            };
          } else {
            return { 
              age: state.age + 1, 
              martialPower: state.martialPower + 3,
              flags: new Set(['competitionLose']),
              events: new Set(['sectCompetition']),
            };
          }
        },
      },
      {
        id: 'skip_competition',
        text: '默默修炼',
        effect: (state) => ({ 
          age: state.age + 1, 
          internalSkill: state.internalSkill + 3,
          events: new Set(['sectCompetition']),
        }),
      },
    ],
  },
  {
    id: 'competition_result_win',
    minAge: 15,
    maxAge: 18,
    text: '你在比试中脱颖而出，师长们对你刮目相看！',
    condition: (state) => state.flags.has('competitionWin'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'competition_result_lose',
    minAge: 15,
    maxAge: 18,
    text: '虽然输了比试，但你从中学到了很多，受益匪浅。',
    condition: (state) => state.flags.has('competitionLose'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'age_18_to_20_normal',
    minAge: 18,
    maxAge: 20,
    text: '你已长大成人，在江湖上也有了一些见识。',
    autoNext: true,
    weight: 45,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      martialPower: state.martialPower + 3,
      externalSkill: state.externalSkill + 2,
      internalSkill: state.internalSkill + 2,
    }),
  },
  {
    id: 'age_18_rogue',
    minAge: 18,
    maxAge: 20,
    text: '一群地痞流氓在欺压百姓，你看不下去了！',
    condition: (state) => !state.events.has('foughtRogue'),
    weight: 20,
    choices: [
      {
        id: 'fight_rogue',
        text: '出手教训',
        effect: (state) => {
          if (state.martialPower >= 25 || state.externalSkill >= 20) {
            return { 
              age: state.age + 1, 
              chivalry: state.chivalry + 15,
              money: state.money + 30,
              flags: new Set(['rogueWin']),
              events: new Set(['foughtRogue']),
            };
          } else {
            return { 
              age: state.age + 1, 
              chivalry: state.chivalry + 5,
              externalSkill: Math.max(0, state.externalSkill - 2),
              flags: new Set(['rogueLose']),
              events: new Set(['foughtRogue']),
            };
          }
        },
      },
      {
        id: 'avoid_rogue',
        text: '绕道而行',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: Math.max(0, state.chivalry - 3),
          events: new Set(['foughtRogue']),
        }),
      },
    ],
  },
  {
    id: 'rogue_result_win',
    minAge: 18,
    maxAge: 21,
    text: '你几招就把那群地痞打得落花流水，百姓们拍手称快！',
    condition: (state) => state.flags.has('rogueWin'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'rogue_result_lose',
    minAge: 18,
    maxAge: 21,
    text: '双拳难敌四手，你受了些轻伤，但也让那些地痞见识了你的骨气。',
    condition: (state) => state.flags.has('rogueLose'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'age_20_to_22_normal',
    minAge: 20,
    maxAge: 22,
    text: '江湖路远，你的故事还在继续...',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      martialPower: state.martialPower + 4,
    }),
  },
  {
    id: 'age_20_business',
    minAge: 20,
    maxAge: 22,
    text: '有人邀你合伙做些生意，你意下如何？',
    condition: (state) => !state.events.has('doneBusiness') && state.money >= 50,
    weight: 18,
    choices: [
      {
        id: 'join_business',
        text: '合伙经营',
        effect: (state) => {
          if (Math.random() < 0.6) {
            return { 
              age: state.age + 1, 
              money: state.money + 150,
              flags: new Set(['businessSuccess']),
              events: new Set(['doneBusiness']),
            };
          } else {
            return { 
              age: state.age + 1, 
              money: Math.max(0, state.money - 80),
              flags: new Set(['businessFail']),
              events: new Set(['doneBusiness']),
            };
          }
        },
      },
      {
        id: 'reject_business',
        text: '专心武道',
        effect: (state) => ({ 
          age: state.age + 1, 
          internalSkill: state.internalSkill + 5,
          events: new Set(['doneBusiness']),
        }),
      },
    ],
  },
  {
    id: 'business_result_success',
    minAge: 20,
    maxAge: 23,
    text: '生意兴隆，你赚了不少银子！',
    condition: (state) => state.flags.has('businessSuccess'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'business_result_fail',
    minAge: 20,
    maxAge: 23,
    text: '生意失败，损失了一些银两，就当是买个教训吧。',
    condition: (state) => state.flags.has('businessFail'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'age_21',
    minAge: 21,
    maxAge: 21,
    text: '你在江湖上已有小名气，一日在山中采药时，发现一株发光的仙草！',
    condition: (state) => !state.flags.has('hasEatenImmortalGrass'),
    weight: 100,
    choices: [
      {
        id: 'eat_immortal_grass',
        text: '吃下仙草',
        effect: (state) => ({ 
          age: state.age + 1, 
          internalSkill: state.internalSkill + 50,
          martialPower: state.martialPower + 30,
          flags: new Set(['hasEatenImmortalGrass']),
        }),
      },
      {
        id: 'sell_grass',
        text: '拿去卖钱',
        effect: (state) => ({ 
          age: state.age + 1, 
          money: state.money + 500,
        }),
      },
    ],
  },

  {
    id: 'age_22_to_24_normal',
    minAge: 22,
    maxAge: 24,
    text: '年复一年，你在江湖上的阅历越来越丰富。',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => ({ 
      age: state.age + 1, 
      martialPower: state.martialPower + 3,
    }),
  },
  {
    id: 'age_22_martial_tournament',
    minAge: 22,
    maxAge: 24,
    text: '五年一度的武林大会召开了，你要去参加吗？',
    condition: (state) => !state.events.has('martialTournament'),
    weight: 30,
    choices: [
      {
        id: 'join_tournament',
        text: '参加大会',
        condition: (state) => state.martialPower >= 30,
        effect: (state) => {
          if (state.martialPower >= 50) {
            return { 
              age: state.age + 1, 
              title: '武林新秀',
              chivalry: state.chivalry + 20,
              money: state.money + 200,
              flags: new Set(['tournamentChampion']),
              events: new Set(['martialTournament']),
            };
          } else {
            return { 
              age: state.age + 1, 
              martialPower: state.martialPower + 8,
              flags: new Set(['tournamentParticipant']),
              events: new Set(['martialTournament']),
            };
          }
        },
      },
      {
        id: 'watch_tournament',
        text: '旁观学习',
        effect: (state) => ({ 
          age: state.age + 1, 
          martialPower: state.martialPower + 5,
          externalSkill: state.externalSkill + 3,
          events: new Set(['martialTournament']),
        }),
      },
    ],
  },
  {
    id: 'tournament_result_champion',
    minAge: 22,
    maxAge: 25,
    text: '你在武林大会上力克群雄，夺得头筹！从此「武林新秀」的名号传遍江湖！',
    condition: (state) => state.flags.has('tournamentChampion'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'tournament_result_participant',
    minAge: 22,
    maxAge: 25,
    text: '虽然没能夺得名次，但你在大会上见识了各大门派的绝技，受益匪浅！',
    condition: (state) => state.flags.has('tournamentParticipant'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'age_23_children',
    minAge: 23,
    maxAge: 25,
    text: '你的孩子渐渐长大，展现出了不俗的武学天赋！',
    condition: (state) => state.children >= 1 && !state.events.has('childrenTrain'),
    weight: 25,
    choices: [
      {
        id: 'train_children',
        text: '亲自教导',
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 10,
          martialPower: state.martialPower + 2,
          events: new Set(['childrenTrain']),
        }),
      },
      {
        id: 'send_to_sect',
        text: '送入门派',
        condition: (state) => state.sect !== null,
        effect: (state) => ({ 
          age: state.age + 1, 
          money: Math.max(0, state.money - 100),
          events: new Set(['childrenTrain']),
        }),
      },
    ],
  },

  {
    id: 'age_24_old_friend',
    minAge: 24,
    maxAge: 26,
    text: '你在酒馆遇到了一位多年未见的老朋友，他邀你共谋大事。',
    condition: (state) => !state.events.has('oldFriend'),
    weight: 20,
    choices: [
      {
        id: 'join_friend',
        text: '欣然答应',
        condition: (state) => state.chivalry >= 20,
        effect: (state) => ({ 
          age: state.age + 1, 
          chivalry: state.chivalry + 15,
          money: state.money + 100,
          flags: new Set(['joinedFriend']),
          events: new Set(['oldFriend']),
        }),
      },
      {
        id: 'decline_friend',
        text: '婉言谢绝',
        effect: (state) => ({ 
          age: state.age + 1, 
          events: new Set(['oldFriend']),
        }),
      },
    ],
  },
  {
    id: 'friend_result_joined',
    minAge: 24,
    maxAge: 27,
    text: '你与老友一起行侠仗义，造福一方，成为江湖上的一段佳话！',
    condition: (state) => state.flags.has('joinedFriend'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },

  {
    id: 'age_25_to_30_normal',
    minAge: 25,
    maxAge: 30,
    text: '而立之年，你的武艺已自成一派。',
    autoNext: true,
    weight: 45,
    autoEffect: (state) => ({ 
      age: state.age + 3, 
      martialPower: state.martialPower + 8,
    }),
  },
  {
    id: 'age_25_establish_sect',
    minAge: 25,
    maxAge: 35,
    text: '有人建议你开宗立派，广收门徒，你意下如何？',
    condition: (state) => state.martialPower >= 40 && !state.events.has('establishedSect'),
    weight: 25,
    choices: [
      {
        id: 'establish_sect',
        text: '创立门派',
        condition: (state) => state.money >= 200,
        effect: (state) => ({ 
          age: state.age + 5, 
          title: '一派宗师',
          money: Math.max(0, state.money - 200),
          chivalry: state.chivalry + 25,
          events: new Set(['establishedSect']),
        }),
      },
      {
        id: 'continue_alone',
        text: '独来独往',
        effect: (state) => ({ 
          age: state.age + 3, 
          martialPower: state.martialPower + 15,
          qinggong: state.qinggong + 10,
          events: new Set(['establishedSect']),
        }),
      },
    ],
  },

  {
    id: 'age_30_to_40_normal',
    minAge: 30,
    maxAge: 40,
    text: '人到中年，江湖上已有你的传说。',
    autoNext: true,
    weight: 50,
    autoEffect: (state) => ({ 
      age: state.age + 5, 
      martialPower: state.martialPower + 10,
    }),
  },
  {
    id: 'age_35_rival',
    minAge: 35,
    maxAge: 45,
    text: '一位与你齐名的高手约你在华山之巅决斗！',
    condition: (state) => state.martialPower >= 50 && !state.events.has('foughtRival'),
    weight: 30,
    choices: [
      {
        id: 'accept_duel',
        text: '应战',
        effect: (state) => {
          if (state.martialPower >= 70 || state.flags.has('hasEatenImmortalGrass')) {
            return { 
              age: state.age + 3, 
              title: '天下第一',
              chivalry: state.chivalry + 30,
              flags: new Set(['defeatedRival']),
              events: new Set(['foughtRival']),
            };
          } else {
            return { 
              age: state.age + 3, 
              martialPower: Math.max(0, state.martialPower - 10),
              internalSkill: Math.max(0, state.internalSkill - 10),
              flags: new Set(['lostToRival']),
              events: new Set(['foughtRival']),
            };
          }
        },
      },
      {
        id: 'decline_duel',
        text: '婉拒',
        effect: (state) => ({ 
          age: state.age + 3, 
          chivalry: Math.max(0, state.chivalry - 10),
          events: new Set(['foughtRival']),
        }),
      },
    ],
  },
  {
    id: 'rival_result_win',
    minAge: 35,
    maxAge: 48,
    text: '华山之巅，你与对手大战三百回合，终于一招制胜！「天下第一」的名号，舍你其谁！',
    condition: (state) => state.flags.has('defeatedRival'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
    }),
  },
  {
    id: 'rival_result_lose',
    minAge: 35,
    maxAge: 48,
    text: '这一战你输了，但输得心服口服。经此一役，你对武学有了更深的领悟。',
    condition: (state) => state.flags.has('lostToRival'),
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ 
      flags: new Set(),
      martialPower: state.martialPower + 15,
    }),
  },

  {
    id: 'age_40_to_50_normal',
    minAge: 40,
    maxAge: 50,
    text: '不惑之年，你已看淡江湖恩怨。',
    autoNext: true,
    weight: 55,
    autoEffect: (state) => ({ 
      age: Math.min(state.age + 5, 51), 
      chivalry: state.chivalry + 10,
    }),
  },
  {
    id: 'age_45_write_book',
    minAge: 45,
    maxAge: 50,
    text: '你想把自己毕生所学写成一本武学秘籍，流传后世。',
    condition: (state) => state.martialPower >= 60 && !state.events.has('wroteBook'),
    weight: 35,
    choices: [
      {
        id: 'write_book',
        text: '撰写秘籍',
        effect: (state) => ({ 
          age: 51, 
          title: '武学宗师',
          chivalry: state.chivalry + 40,
          events: new Set(['wroteBook']),
        }),
      },
      {
        id: 'take_apprentice',
        text: '收徒传承',
        effect: (state) => ({ 
          age: 51, 
          chivalry: state.chivalry + 25,
          events: new Set(['wroteBook']),
        }),
      },
    ],
  },

  {
    id: 'age_25_to_50_normal',
    minAge: 25,
    maxAge: 50,
    text: '江湖岁月，匆匆而过。',
    autoNext: true,
    weight: 60,
    autoEffect: (state) => ({ 
      age: Math.min(state.age + 5, 51), 
      martialPower: state.martialPower + 5
    }),
  },
  {
    id: 'age_25_to_50_hero',
    minAge: 25,
    maxAge: 50,
    text: '你成为了江湖上有名的侠客，行侠仗义。',
    condition: (state) => state.chivalry >= 30,
    autoNext: true,
    weight: 20,
    autoEffect: (state) => ({ 
      age: Math.min(state.age + 5, 51), 
      chivalry: state.chivalry + 15,
      martialPower: state.martialPower + 5,
    }),
  },
  {
    id: 'age_25_to_50_leader',
    minAge: 25,
    maxAge: 50,
    text: '你被推选为武林盟主！',
    condition: (state) => state.chivalry >= 50 && state.martialPower >= 50,
    autoNext: true,
    weight: 15,
    autoEffect: (state) => ({ 
      age: 51, 
      title: '武林盟主',
      money: state.money + 1000,
    }),
  },
  {
    id: 'age_25_to_50_business',
    minAge: 25,
    maxAge: 50,
    text: '你开了一家镖局，生意兴隆。',
    autoNext: true,
    weight: 15,
    autoEffect: (state) => ({ 
      age: 51, 
      money: state.money + 500,
      children: state.children + 2,
    }),
  },

  {
    id: 'old_age',
    minAge: 51,
    text: '你已年过半百，江湖小辈都尊称你一声前辈。',
    weight: 100,
    choices: [
      {
        id: 'live_long',
        text: '安享晚年',
        effect: (state) => {
          const finalAge = state.age + 20;
          return { 
            age: finalAge, 
            alive: false,
            deathReason: '无疾而终，享年' + finalAge + '岁',
            title: state.title || '武林泰斗',
          };
        },
      },
    ],
  },

  // ========== 长事件集合 ==========
  ...sectJoinEvents,
  ...tournamentEvents,
  ...loveStoryEvents,
];

export const randomEvents: StoryNode[] = [];

export const deathEndings: DeathEnding[] = [
  {
    id: 'death_poison',
    title: '中毒身亡',
    text: '你不慎中了江湖歹人的毒，无药可救...',
    condition: (state) => !state.flags.has('isImmuneToPoison'),
    epitaph: '江湖险恶，毒最难防',
  },
  {
    id: 'death_old',
    title: '寿终正寝',
    text: '你安详地离开了这个世界，走完了传奇的一生。',
    condition: (state) => state.age >= 70,
    epitaph: '人生七十古来稀',
  },
];

function selectNodeByWeight(nodes: StoryNode[]): StoryNode {
  const totalWeight = nodes.reduce((sum, node) => sum + (node.weight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const node of nodes) {
    random -= node.weight || 1;
    if (random <= 0) {
      return node;
    }
  }
  
  return nodes[nodes.length - 1];
}

export function getAvailableNodes(state: PlayerState): StoryNode[] {
  // 1. 优先匹配长事件的下一阶段（检查 flag 条件）
  if (state.flags.size > 0) {
    const longEventNodes = storyNodes.filter(
      node => node.minAge !== undefined &&
              node.minAge <= state.age &&
              checkNodeCondition(node, state) &&
              (
                // 原有的结果节点模式
                node.id.includes('result') || 
                node.id.includes('_win') || 
                node.id.includes('_lose') || 
                node.id.includes('escaped') || 
                node.id.includes('reported') || 
                node.id.includes('ignored') ||
                // 长事件节点模式
                node.id.includes('tournament_') ||
                node.id.includes('love_') ||
                node.id.includes('sect_') ||
                node.id.includes('physical_test') ||
                node.id.includes('mental_test') ||
                node.id.includes('accepted') ||
                node.id.includes('rejected')
              )
    );
    
    if (longEventNodes.length > 0) {
      return [longEventNodes[0]];
    }
  }
  
  // 2. 匹配单年龄节点
  const exactAgeNodes = storyNodes.filter(
    node => node.minAge === state.age && 
            node.maxAge === state.age && 
            checkNodeCondition(node, state)
  );
  
  if (exactAgeNodes.length > 0) {
    const selectedNode = selectNodeByWeight(exactAgeNodes);
    return [selectedNode];
  }
  
  // 3. 匹配年龄范围节点
  const rangeNodes = storyNodes.filter(
    node => node.minAge !== undefined &&
            node.maxAge !== undefined &&
            node.minAge <= state.age && 
            node.maxAge >= state.age &&
            checkNodeCondition(node, state)
  );
  
  if (rangeNodes.length > 0) {
    const selectedNode = selectNodeByWeight(rangeNodes);
    return [selectedNode];
  }
  
  // 4. 匹配开放节点
  const openEndedNodes = storyNodes.filter(
    node => node.minAge !== undefined &&
            node.maxAge === undefined &&
            node.minAge <= state.age &&
            checkNodeCondition(node, state)
  );
  
  if (openEndedNodes.length > 0) {
    const selectedNode = selectNodeByWeight(openEndedNodes);
    return [selectedNode];
  }
  
  // 5. 安全默认节点
  const safeDefaultNode: StoryNode = {
    id: 'safe_default',
    minAge: 0,
    text: '岁月流逝，你的人生继续着...',
    autoNext: true,
    weight: 100,
    autoEffect: (state) => ({ age: state.age + 1 }),
  };
  
  return [safeDefaultNode];
}
