import type { DailyEventConfig } from '../../types/eventTypes';

export const dailyEvents: DailyEventConfig[] = [
  {
    id: 'daily_morning_training',
    group: 'training',
    title: '晨起练功',
    ageRange: { min: 8, max: 60 },
    baseWeight: 40,
    preferredTraits: ['martial_born', 'keen_mind', 'unyielding', 'disciplined'],
    suppressedTraits: ['lazy', 'indulgent'],
    preferredStates: [
      { state: 'discipline', min: 1, weightMultiplier: 1.2 },
      { state: 'fatigue', min: 2, weightMultiplier: 0.72 },
      { state: 'anxiety', min: 2, weightMultiplier: 0.85 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_morning_training_pos_1',
          weight: 3,
          text: '你照常起身练功，一招一式都比昨日更稳。',
          statEffects: [
            { stat: 'martialPower', value: 1 },
            { stat: 'externalSkill', value: 1 },
          ],
          stateEffects: [{ state: 'discipline', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_morning_training_neu_1',
          weight: 2,
          text: '你照例练了一阵，只觉得身子活动开了。',
        },
      ],
      negative: [
        {
          id: 'daily_morning_training_neg_1',
          weight: 1,
          text: '你勉强练完，心里却始终烦躁，没什么收获。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['disciplined', 'martial_born'],
      negativeByTraits: ['lazy', 'unstable_mood'],
    },
    longTermHooks: {
      addTendency: ['training_habit'],
      addStateOnRepeat: [{ state: 'discipline', increment: 1, repeatThreshold: 3 }],
    },
  },
  {
    id: 'daily_skip_training',
    group: 'training',
    title: '偷懒一天',
    ageRange: { min: 10, max: 65 },
    baseWeight: 28,
    preferredTraits: ['lazy', 'indulgent', 'unstable_mood'],
    suppressedTraits: ['disciplined', 'unyielding'],
    preferredStates: [
      { state: 'fatigue', min: 2, weightMultiplier: 1.18 },
      { state: 'discipline', min: 2, weightMultiplier: 0.8 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_skip_training_pos_1',
          weight: 2,
          text: '你给自己放了一天假，反倒觉得筋骨和心气都松快了些。',
          stateEffects: [{ state: 'fatigue', value: -1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_skip_training_neu_1',
          weight: 2,
          text: '你想着“明日再练也不迟”，这一天便这么过去了。',
        },
      ],
      negative: [
        {
          id: 'daily_skip_training_neg_1',
          weight: 1,
          text: '偷懒时固然舒服，到了夜里，你又隐隐觉得自己在原地打转。',
          stateEffects: [
            { state: 'discipline', value: -1 },
            { state: 'anxiety', value: 1 },
          ],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['risk_averse'],
      negativeByTraits: ['competitive', 'disciplined'],
    },
  },
  {
    id: 'daily_training_bottleneck',
    group: 'training',
    title: '卡在瓶颈',
    ageRange: { min: 14, max: 65 },
    baseWeight: 24,
    preferredTraits: ['martial_born', 'keen_mind', 'grand_dreams_poor_followthrough'],
    suppressedTraits: ['lazy'],
    preferredStates: [
      { state: 'discipline', min: 2, weightMultiplier: 1.15 },
      { state: 'anxiety', min: 2, weightMultiplier: 1.1 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_training_bottleneck_pos_1',
          weight: 2,
          text: '你在老地方卡了许久，终于从一丝别扭里摸到了一点门道。',
          statEffects: [{ stat: 'martialPower', value: 1 }],
          stateEffects: [{ state: 'discipline', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_training_bottleneck_neu_1',
          weight: 2,
          text: '你今天依旧被卡在老地方，只能靠耐性把动作一遍遍磨过去。',
        },
      ],
      negative: [
        {
          id: 'daily_training_bottleneck_neg_1',
          weight: 1,
          text: '越是想突破，越是觉得气不顺，最后只剩下一肚子烦闷。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['unyielding', 'disciplined'],
      negativeByTraits: ['unstable_mood'],
    },
  },
  {
    id: 'daily_take_odd_job',
    group: 'livelihood',
    title: '接点零活',
    ageRange: { min: 12, max: 70 },
    baseWeight: 34,
    preferredTraits: ['poor_family', 'streetborn', 'unyielding', 'iron_abacus'],
    suppressedTraits: ['heroic_heart'],
    preferredStates: [
      { state: 'anxiety', min: 1, weightMultiplier: 1.12 },
      { state: 'socialMomentum', min: 1, weightMultiplier: 1.15 },
      { state: 'fatigue', min: 3, weightMultiplier: 0.8 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_take_odd_job_pos_1',
          weight: 3,
          text: '你忙活了一天，虽然辛苦，好歹把眼下的日子稳住了。',
          statEffects: [{ stat: 'money', value: 25 }],
          stateEffects: [{ state: 'socialMomentum', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_take_odd_job_neu_1',
          weight: 2,
          text: '你接了点零活，只能算勉强糊口。',
          statEffects: [{ stat: 'money', value: 10 }],
        },
      ],
      negative: [
        {
          id: 'daily_take_odd_job_neg_1',
          weight: 1,
          text: '你白忙一场，银钱没攒下多少，心里却更紧了。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['iron_abacus', 'profit_driven'],
      negativeByTraits: ['grand_dreams_poor_followthrough'],
    },
  },
  {
    id: 'daily_small_trade',
    group: 'livelihood',
    title: '小本生意',
    ageRange: { min: 15, max: 70 },
    baseWeight: 26,
    preferredTraits: ['merchant_house', 'iron_abacus', 'profit_driven', 'streetborn'],
    suppressedTraits: ['heroic_heart'],
    preferredStates: [
      { state: 'socialMomentum', min: 1, weightMultiplier: 1.2 },
      { state: 'anxiety', min: 1, weightMultiplier: 1.08 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_small_trade_pos_1',
          weight: 2,
          text: '你试着周转了一笔小买卖，赚得不算多，却让手头松快了些。',
          statEffects: [{ stat: 'money', value: 35 }],
          stateEffects: [{ state: 'socialMomentum', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_small_trade_neu_1',
          weight: 2,
          text: '你忙了一阵，最后只是把账目堪堪做平。',
        },
      ],
      negative: [
        {
          id: 'daily_small_trade_neg_1',
          weight: 1,
          text: '你看走了眼，白忙一场不说，心里还添了几分懊恼。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['iron_abacus', 'profit_driven'],
      negativeByTraits: ['soft_eared'],
    },
  },
  {
    id: 'daily_tight_budget',
    group: 'livelihood',
    title: '手头拮据',
    ageRange: { min: 14, max: 80 },
    baseWeight: 22,
    preferredTraits: ['poor_family', 'fear_of_responsibility'],
    suppressedTraits: ['merchant_house'],
    preferredStates: [
      { state: 'anxiety', min: 2, weightMultiplier: 1.18 },
      { state: 'fatigue', min: 2, weightMultiplier: 1.08 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_tight_budget_pos_1',
          weight: 1,
          text: '你咬咬牙把开销都压了下来，这阵子总算还能撑过去。',
          stateEffects: [{ state: 'anxiety', value: -1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_tight_budget_neu_1',
          weight: 2,
          text: '你把银钱算了又算，发现这阵子还是得省着些花。',
        },
      ],
      negative: [
        {
          id: 'daily_tight_budget_neg_1',
          weight: 2,
          text: '手头一紧，许多原本不值一提的小事，也都压得人透不过气来。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['unyielding'],
      negativeByTraits: ['indulgent'],
    },
  },
  {
    id: 'daily_home_letter',
    group: 'family',
    title: '家中来信',
    ageRange: { min: 12, max: 70 },
    baseWeight: 20,
    preferredTraits: ['affectionate', 'poor_family', 'risk_averse'],
    suppressedTraits: ['loner'],
    preferredStates: [
      { state: 'familyBond', max: 2, weightMultiplier: 1.18 },
      { state: 'anxiety', min: 2, weightMultiplier: 1.08 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_home_letter_pos_1',
          weight: 2,
          text: '家中来信写得平平淡淡，却让你觉得这世上仍有人等你回去。',
          stateEffects: [{ state: 'familyBond', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_home_letter_neu_1',
          weight: 2,
          text: '信里没什么大事，只是些琐碎牵挂。',
        },
      ],
      negative: [
        {
          id: 'daily_home_letter_neg_1',
          weight: 1,
          text: '字里行间尽是操心与盼望，让你一时也轻松不起来。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['affectionate'],
      negativeByTraits: ['fear_of_responsibility'],
    },
  },
  {
    id: 'daily_shared_meal',
    group: 'family',
    title: '一顿安稳饭',
    ageRange: { min: 15, max: 80 },
    baseWeight: 18,
    preferredTraits: ['affectionate', 'risk_averse'],
    suppressedTraits: ['loner'],
    preferredStates: [{ state: 'familyBond', max: 2, weightMultiplier: 1.15 }],
    variants: {
      positive: [
        {
          id: 'daily_shared_meal_pos_1',
          weight: 2,
          text: '难得大家都在，你安安稳稳吃了一顿饭，心里也跟着松了一截。',
          stateEffects: [
            { state: 'familyBond', value: 1 },
            { state: 'fatigue', value: -1 },
          ],
        },
      ],
      neutral: [
        {
          id: 'daily_shared_meal_neu_1',
          weight: 2,
          text: '饭桌上说的都是些日常琐事，却让人觉得日子总算有了落脚处。',
        },
      ],
      negative: [
        {
          id: 'daily_shared_meal_neg_1',
          weight: 1,
          text: '本想好好吃顿饭，话题却又拐到了那些说不清的旧账上。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['affectionate'],
      negativeByTraits: ['unstable_mood'],
    },
  },
  {
    id: 'daily_household_burden',
    group: 'family',
    title: '家中琐事缠身',
    ageRange: { min: 20, max: 80 },
    baseWeight: 20,
    preferredTraits: ['affectionate', 'fear_of_responsibility'],
    preferredStates: [
      { state: 'familyBond', min: 1, weightMultiplier: 1.15 },
      { state: 'anxiety', min: 1, weightMultiplier: 1.05 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_household_burden_pos_1',
          weight: 1,
          text: '这些琐事虽烦，你却还是一件件处理了下来，心里也没那么虚了。',
          stateEffects: [{ state: 'familyBond', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_household_burden_neu_1',
          weight: 2,
          text: '这一阵子总有些家里事要顾，谈不上大麻烦，却也让人很难彻底松快。',
        },
      ],
      negative: [
        {
          id: 'daily_household_burden_neg_1',
          weight: 2,
          text: '一件接一件的小事压上来，让你忽然觉得，日子比江湖还难应付。',
          stateEffects: [
            { state: 'anxiety', value: 1 },
            { state: 'discipline', value: -1 },
          ],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['disciplined'],
      negativeByTraits: ['fear_of_responsibility'],
    },
  },
  {
    id: 'daily_night_reflection',
    group: 'emotion',
    title: '夜里发呆',
    ageRange: { min: 10, max: 80 },
    baseWeight: 26,
    preferredTraits: ['unstable_mood', 'perfect_memory', 'loner'],
    suppressedTraits: ['competitive'],
    preferredStates: [
      { state: 'anxiety', min: 1, weightMultiplier: 1.22 },
      { state: 'fatigue', min: 2, weightMultiplier: 1.08 },
      { state: 'socialMomentum', min: 2, weightMultiplier: 0.88 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_night_reflection_pos_1',
          weight: 2,
          text: '夜深人静时，你忽然把近来的心绪理顺了些。',
          stateEffects: [
            { state: 'anxiety', value: -1 },
            { state: 'fatigue', value: -1 },
          ],
        },
      ],
      neutral: [
        {
          id: 'daily_night_reflection_neu_1',
          weight: 2,
          text: '你一个人坐了很久，什么也没想明白，只觉得夜色很长。',
        },
      ],
      negative: [
        {
          id: 'daily_night_reflection_neg_1',
          weight: 1,
          text: '旧事忽然翻涌上来，让你心里更乱了。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['cold_reader', 'disciplined'],
      negativeByTraits: ['unstable_mood'],
    },
  },
  {
    id: 'daily_second_guess',
    group: 'emotion',
    title: '忽然怀疑自己',
    ageRange: { min: 14, max: 75 },
    baseWeight: 20,
    preferredTraits: ['unstable_mood', 'grand_dreams_poor_followthrough', 'affectionate'],
    preferredStates: [
      { state: 'anxiety', min: 1, weightMultiplier: 1.18 },
      { state: 'discipline', min: 2, weightMultiplier: 0.9 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_second_guess_pos_1',
          weight: 1,
          text: '你心里虽乱，最后却还是把疑问理成了下一步要走的路。',
          stateEffects: [{ state: 'discipline', value: 1 }],
        },
      ],
      neutral: [
        {
          id: 'daily_second_guess_neu_1',
          weight: 2,
          text: '你忽然怀疑自己是不是走错了路，可想来想去，也没人能替你回答。',
        },
      ],
      negative: [
        {
          id: 'daily_second_guess_neg_1',
          weight: 2,
          text: '越想越觉得自己哪条路都差了一口气，连心里的那点劲也跟着散了。',
          stateEffects: [
            { state: 'anxiety', value: 1 },
            { state: 'discipline', value: -1 },
          ],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['cold_reader'],
      negativeByTraits: ['unstable_mood'],
    },
  },
  {
    id: 'daily_get_back_spirit',
    group: 'emotion',
    title: '心里重新有了劲',
    ageRange: { min: 14, max: 80 },
    baseWeight: 18,
    preferredTraits: ['unyielding', 'disciplined', 'heroic_heart'],
    preferredStates: [
      { state: 'anxiety', min: 1, weightMultiplier: 1.1 },
      { state: 'fatigue', min: 1, weightMultiplier: 1.05 },
    ],
    variants: {
      positive: [
        {
          id: 'daily_get_back_spirit_pos_1',
          weight: 2,
          text: '也不知是因为什么，你忽然又把那口气提了起来，觉得自己还能继续往前走。',
          stateEffects: [
            { state: 'anxiety', value: -1 },
            { state: 'discipline', value: 1 },
          ],
        },
      ],
      neutral: [
        {
          id: 'daily_get_back_spirit_neu_1',
          weight: 2,
          text: '你没想通很多事，但至少没有昨天那样灰心。',
        },
      ],
      negative: [
        {
          id: 'daily_get_back_spirit_neg_1',
          weight: 1,
          text: '你本想振作，可那股劲只亮了一下，终究还是没稳住。',
          stateEffects: [{ state: 'anxiety', value: 1 }],
        },
      ],
    },
    outcomeBias: {
      positiveByTraits: ['unyielding', 'disciplined'],
      negativeByTraits: ['lazy'],
    },
  },
];
