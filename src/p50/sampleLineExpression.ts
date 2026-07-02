import type { GameState } from '../types/eventTypes';

export type SampleLineId = 'orthodox' | 'demonic' | 'merchant' | 'renown' | 'medical';

export function detectSampleLine(flags: Record<string, unknown>): SampleLineId | null {
  if (flags.tavern_medical_bridge_crossed || flags.route_medical_committed) {
    return 'medical';
  }
  if (flags.tavern_renown_bridge_crossed || flags.route_renown_committed) {
    return 'renown';
  }

  const hasOrthodoxSeed = Boolean(
    flags.orthodox_childhood_seed_done || flags.orthodox_age40_identity_done,
  );
  const hasDemonicSeed = Boolean(
    flags.demonic_childhood_seed_done || flags.demonic_age40_identity_done,
  );
  const hasMerchantSeed = Boolean(
    flags.merchant_childhood_seed_done
    || flags.merchant_age40_identity_done
    || flags.merchant_shop_grocery
    || flags.merchant_shop_weapon
    || flags.merchant_shop_herb,
  );

  // ponytail: spine childhood seeds beat parallel route_* from other pools (P51 RW-05)
  if (hasMerchantSeed && !hasOrthodoxSeed && !hasDemonicSeed) {
    return 'merchant';
  }
  if (hasOrthodoxSeed && !hasDemonicSeed && !hasMerchantSeed) {
    return 'orthodox';
  }
  if (hasDemonicSeed && !hasOrthodoxSeed && !hasMerchantSeed) {
    return 'demonic';
  }
  if (hasMerchantSeed && (flags.merchant_shop_grocery || flags.merchant_shop_weapon || flags.merchant_shop_herb || flags.merchant_age40_identity_done)) {
    return 'merchant';
  }
  if (hasOrthodoxSeed) {
    return 'orthodox';
  }
  if (hasDemonicSeed) {
    return 'demonic';
  }

  if (flags.route_orthodox || flags.orthodox_trial_completed || flags.orthodox_formal_disciple) {
    return 'orthodox';
  }
  if (flags.route_demonic || flags.outlaw_identity_done || flags.demonic_path_touched) {
    return 'demonic';
  }
  if (
    flags.route_merchant
    || flags.merchant_talent
    || flags.merchant_childhood_seed_done
    || flags.p8_route_wealth
    // P63: Bridge-origin merchant entry flags
    || flags.apprentice_merchant_bridge_crossed
    || flags.tavern_merchant_bridge_crossed
    || flags.peasant_merchant_bridge_crossed
  ) {
    return 'merchant';
  }
  const faction = flags.sect_faction;
  if (faction === 'orthodox') {
    return 'orthodox';
  }
  if (faction === 'unconventional') {
    return 'demonic';
  }
  return null;
}

function orthodoxCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.orthodox_age45_legacy_steward_done) {
    return '传承守门，门派遗命在肩';
  }
  if (flags.orthodox_age40_identity_done && age >= 44) {
    return '四十回望之后，守山之责待承';
  }
  if (flags.orthodox_age40_identity_done) {
    return '回望正道身份，守正之路已刻进一生';
  }
  if (flags.orthodox_gray_pressure_visible) {
    return '灰度压力在肩，守正须付代价';
  }
  if (flags.orthodox_righteousness_cost_visible && age >= 25) {
    return '守正有代价，义务先于私利';
  }
  if (flags.sect_midlife_gray_executed || flags.sect_midlife_gray_leaked || flags.sect_midlife_gray_refused) {
    return '守正有代价，仍在承担门派义务';
  }
  if (flags.orthodox_formal_disciple || flags.orthodox_trial_completed) {
    return age >= 25 ? '行侠守义，承担门派义务' : '入门试炼、争取认可';
  }
  if (flags.sect_faction === 'orthodox' || flags.orthodox_childhood_seed_done) {
    return '门派倾向已显，尚未立誓入门';
  }
  return '习武向道，争取被正道认可';
}

function demonicCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.demonic_age45_territory_consolidated) {
    return '地盘既固，反噬与孤立加深';
  }
  if (flags.demonic_age40_identity_done && age >= 44) {
    return '邪路已定，扩张与反噬待至';
  }
  if (flags.demonic_age40_identity_done) {
    return '邪路身份已定，收益与孤立并存';
  }
  if (flags.demonic_midlife_isolation_done || flags.demonic_midlife_betrayal_done) {
    return '扩张之后，孤立与代价渐深';
  }
  if (flags.outlaw_rise || flags.demonic_midlife_expansion_done || flags.demonic_leader) {
    return '力量与地盘在涨，诱惑未止';
  }
  if (flags.demonic_youth_first_transgression || flags.outlaw_identity_done) {
    return '第一次越界之后，邪路已开';
  }
  if (flags.demonic_childhood_seed_done || flags.p9_childhood_dark_spark) {
    return '邪念已萌，尚未立誓入魔';
  }
  return age >= 20 ? '试探底线，换取力量' : '暗中试探，尚未公开入魔';
}

function merchantCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.magnate_payoff_done) {
    // P67: success-shape differentiation — each route succeeds in a different shape
    // P66 cost reflection is preserved and woven into the success shape
    if (flags.apprentice_merchant_bridge_crossed) {
      return '从刨子到账本，靠手艺的眼光算出了一片商路，品质立住了招牌，合伙铺出了版图，只是如今要看着合伙人的脸色，账目上的分成比木纹更难拿捏';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '从酒肆到商号，靠人情的网络织出了八方商路，老主顾串起了门路，引荐打通了关节，只是欠的人情比挣的银子还多，每一笔都要掂量谁的面子、还谁的情';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '从田埂到车马，靠脚力和血汗踩出了一条粮路，车马仓储踩出了根基，收成赌出了规模，只是脚下的路比田埂还长，赢了但也再回不到田里了';
    }
    return '巨贾之位已成，守住比扩张更难';
  }
  if (flags.magnate_midlife_pressure_done) {
    // P64 + P66: differentiated pressure with stronger cost flavor
    if (flags.apprentice_merchant_bridge_crossed) {
      return '商号遍九州，合伙人与账目债也遍九州，供货的账期、销路的分成拴住了手艺人的手脚';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '商号遍九州，人情面子债也遍九州，老主顾的期待、介绍的欠情让巨贾被人脉捆住了手脚';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '商号遍九州，车马仓储债也遍九州，运力、仓库、下属工钱让泥腿子巨贾用身体在扛';
    }
    return '商号遍九州，人情债也遍九州';
  }
  if (flags.magnate_on_ramp_done) {
    // P63: Entry differentiation via bridge-origin markers
    // Apprentice path: craft mastery + partnership → business as skill extension
    if (flags.apprentice_merchant_bridge_crossed) {
      return '手艺学透、合伙商路已通，正谋划更大的局面';
    }
    // Tavern path: network + referral → business as relationship extension
    if (flags.tavern_merchant_bridge_crossed) {
      return '人脉已通、铺子已上手，正借助这些关系扩张';
    }
    // Peasant path: labor + trade → business as labor elevation
    if (flags.peasant_merchant_bridge_crossed) {
      return '粮路跑通、买卖上手，正学着像商人一样思考';
    }
    return '产业初成，巨贾之路刚起步';
  }
  if (flags.merchant_age45_expansion_fork_done) {
    return '扩张分岔已至，债与人情并重';
  }
  if (flags.merchant_age40_identity_done && age >= 44) {
    return '商路身份已定，扩张分岔在前';
  }
  if (flags.merchant_age40_identity_done) {
    return '财富带来选择，也带来债';
  }
  if (flags.merchant_midlife_debt || flags.merchant_shop_failed) {
    return age >= 32 ? '周转吃紧，人情债未清' : '扩张初尝，债务阴影已现';
  }
  if (flags.merchant_caravan_success || flags.merchant_sect_investment_done) {
    return '商队或投资分岔，扩张与风险并行';
  }
  // P95: 16-25 operating chain — track-specific goals after rhythm/pressure
  if (flags.hvg_merchant_operating_pressure_done) {
    if (flags.hvg_merchant_ledger_track) {
      if (flags.hvg_merchant_ledger_pressure_credit) {
        return age >= 22 ? '赊欠已压稳，店铺周转渐入正轨' : '头一回催收赊欠，学着把账收回来';
      }
      if (flags.hvg_merchant_ledger_pressure_stockout) {
        return age >= 22 ? '断货教训在心头，库存管得比人情还紧' : '断货险些砸了招牌，正想法子补库存';
      }
    }
    if (flags.hvg_merchant_caravan_track) {
      if (flags.hvg_merchant_caravan_pressure_swing_win) {
        return age >= 22 ? '行市波动扛过来了，敢再押一程货' : '行市大跌时咬牙扛住，见识了涨跌';
      }
      if (flags.hvg_merchant_caravan_pressure_swing_loss) {
        return age >= 22 ? '行市一跌痛彻心扉，押货脚步慢了下来' : '低价囤货吃了亏，行市的风向比账难猜';
      }
    }
  }
  if (flags.hvg_merchant_post_shop_rhythm_done) {
    if (flags.hvg_merchant_ledger_track) {
      if (flags.hvg_merchant_ledger_rhythm_steady) {
        return '店已开张，守着赊欠与库存周转';
      }
      if (flags.hvg_merchant_ledger_rhythm_expand) {
        return '店已开张，小步扩货试探新门路';
      }
    }
    if (flags.hvg_merchant_caravan_track) {
      if (flags.hvg_merchant_caravan_rhythm_fast) {
        return '店已开张，快周转压货把货路跑通';
      }
      if (flags.hvg_merchant_caravan_rhythm_market) {
        return '店已开张，盯行市小赌涨跌吃波动';
      }
    }
  }
  if (flags.merchant_shop_grocery || flags.merchant_shop_weapon || flags.merchant_shop_herb) {
    if (flags.hvg_merchant_ledger_track) {
      return '第一桶金已得，账房式经营守周转';
    }
    if (flags.hvg_merchant_caravan_track) {
      return '第一桶金已得，跑货式经营吃波动';
    }
    return '第一桶金已得，店铺经营中';
  }
  // P94: 10-15 growth chain — track-specific goals after confirmation/challenge
  if (flags.hvg_merchant_first_challenge_done) {
    if (flags.hvg_merchant_ledger_track) {
      if (flags.hvg_merchant_ledger_challenge_steady) {
        return age >= 15 ? '账房稳手已练成，正为开张攒底气' : '逐户收账练出了稳手，学着守账识风险';
      }
      if (flags.hvg_merchant_ledger_challenge_rushed) {
        return age >= 15 ? '赶账收了第一笔，也尝到疏漏的风险' : '先收大头稳了场面，小账的尾巴还在身后';
      }
    }
    if (flags.hvg_merchant_caravan_track) {
      if (flags.hvg_merchant_caravan_challenge_steady) {
        return age >= 15 ? '货路押稳了第一次，认得守本分也可起家' : '跟老伙计押货练稳了脚，学着认货见世面';
      }
      if (flags.hvg_merchant_caravan_challenge_bold) {
        return age >= 15 ? '赌行市赢了第一回，也见识了涨跌起伏' : '低价收货赌了一回，行市的波动比账本上写得烫手';
      }
    }
  }
  if (flags.hvg_merchant_post_fork_confirmation_done) {
    if (flags.hvg_merchant_ledger_track) {
      return '账房路已确认，正学着守账识风险';
    }
    if (flags.hvg_merchant_caravan_track) {
      return '货路已确认，正学着认货见世面';
    }
  }
  if (flags.merchant_talent || flags.merchant_childhood_seed_done) {
    return '营商天赋已显，尚未开张';
  }
  return age >= 16 ? '以小本经营积累财富与人脉' : '观察买卖，等待开张时机';
}

function renownCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.renown_endgame_done) {
    if (flags.tavern_renown_endgame_sigh) {
      return '听着自己成了传说，也算值了';
    }
    if (flags.tavern_renown_endgame_distant) {
      return '传说真假谁真谁假，自己知道就好';
    }
    if (flags.tavern_renown_endgame_legacy) {
      return '看着后辈们传下去，这就够了';
    }
  }
  if (flags.renown_late_life_done) {
    if (flags.tavern_renown_late_burnout) {
      return '守住这一辈子的名声，撑到最后';
    }
    if (flags.tavern_renown_late_lone_wolf) {
      return '无牵无挂，过好剩下的日子';
    }
    if (flags.tavern_renown_late_mentor) {
      return '指点后辈，把这一辈子的人情世故传下去';
    }
  }
  if (flags.renown_midlife_payoff_done) {
    if (flags.tavern_renown_payoff_hard_holder) {
      return '硬扛所有人情债，保住江湖名声';
    }
    if (flags.tavern_renown_payoff_breaker) {
      return '撕破脸皮，断了不该还的债';
    }
    if (flags.tavern_renown_payoff_balancer) {
      return '拿捏人情往来的分寸，找到平衡';
    }
  }
  if (flags.renown_midlife_pressure_done) {
    return '一面维持声名，一面应付越来越重的人情债';
  }
  if (flags.renown_on_ramp_done) {
    return '在江湖上有了名号，常有人来请你主持公道、引荐高人';
  }
  if (flags.tavern_renown_bridge_crossed) {
    return '凭人脉声名在江湖立足，常有人来寻你引荐主事';
  }
  if (flags.ally_network) {
    return age >= 25 ? '积累声名，拓展人脉' : '认识些江湖朋友，攒下些名头';
  }
  return '在江湖上闯出名头';
}

function medicalCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.medical_endgame_echo_done) {
    if (flags.tavern_medical_endgame_compassionate_ember) {
      return '仁薪尽传，此生无憾';
    }
    if (flags.tavern_medical_endgame_compassionate_peace) {
      return '晒晒太阳看看病，从容了此一生';
    }
    if (flags.tavern_medical_endgame_compassionate_legacy) {
      return '看着仁心一辈辈传下去，这就够了';
    }
    if (flags.tavern_medical_endgame_pragmatic_fame_remain) {
      return '权势如烟云，医名自长久';
    }
    if (flags.tavern_medical_endgame_pragmatic_wanderer_legend) {
      return '传说真假谁在乎，自在就好';
    }
    if (flags.tavern_medical_endgame_pragmatic_grand_master) {
      return '看着这一世医名，守着这一份圆满';
    }
  }
  if (flags.medical_late_life_done) {
    if (flags.tavern_medical_late_compassionate_final) {
      return '多救一个是一个，撑到最后一刻';
    }
    if (flags.tavern_medical_late_compassionate_peaceful) {
      return '晒晒太阳看看病，过好剩下的日子';
    }
    if (flags.tavern_medical_late_compassionate_legacy) {
      return '看着徒弟们成长，仁心传下去就够了';
    }
    if (flags.tavern_medical_late_pragmatic_fallen) {
      return '看淡世态炎凉，过好自己的日子';
    }
    if (flags.tavern_medical_late_pragmatic_wanderer) {
      return '走到哪儿算哪儿，自在就好';
    }
    if (flags.tavern_medical_late_pragmatic_master) {
      return '看着这一世繁华，守着这一份体面';
    }
  }
  if (flags.medical_payoff_done) {
    if (flags.tavern_medical_payoff_compassionate_holder) {
      return '趁着还能动，能多救一个是一个';
    }
    if (flags.tavern_medical_payoff_compassionate_let_go) {
      return '量力而行，把有限的精力留给真正需要的人';
    }
    if (flags.tavern_medical_payoff_compassionate_legacy) {
      return '把医术和仁心传下去，让更多人能得到救治';
    }
    if (flags.tavern_medical_payoff_pragmatic_holder) {
      return '维持各方人情，在权贵圈里站稳脚跟';
    }
    if (flags.tavern_medical_payoff_pragmatic_breaker) {
      return '断了权贵的人情，只给愿意给的人看病';
    }
    if (flags.tavern_medical_payoff_pragmatic_master) {
      return '拿捏人情往来的分寸，游刃有余地行走在权贵之间';
    }
  }
  if (flags.tavern_medical_pressure_compassionate) {
    return '一面撑着身子救人，一面看着自己的仁心一点点耗尽';
  }
  if (flags.tavern_medical_pressure_pragmatic) {
    return '一面维持名声，一面应付越来越多的人情债';
  }
  if (flags.tavern_medical_on_ramp_compassionate) {
    return '名声传开了，周边村子的人都来找你看病，累是累，但救人要紧';
  }
  if (flags.tavern_medical_on_ramp_pragmatic) {
    return '镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏';
  }
  if (flags.tavern_embrace_compassionate_healer) {
    return '多救一个是一个，酒肆的小药庐挤不下了';
  }
  if (flags.tavern_embrace_pragmatic_healer) {
    return '名声银子都要挣，酒肆出来的大夫懂分寸';
  }
  if (flags.tavern_medical_bridge_crossed) {
    return '靠自学的医术在镇上立足，酒肆后面辟出了小药庐';
  }
  return age >= 25 ? '学医救人，攒下些名声' : '翻医书认草药，摸索着学医';
}

export function deriveSampleLineCostLabel(state: GameState): string {
  const flags = state.flags ?? {};
  const line = detectSampleLine(flags);
  if (line === 'orthodox') {
    return '守正代价';
  }
  if (line === 'demonic') {
    return '邪路代价';
  }
  if (line === 'merchant') {
    // P66: cost label differentiation persists through pressure and payoff
    if (flags.magnate_payoff_done) {
      if (flags.apprentice_merchant_bridge_crossed) {
        return '合伙与账目的担子';
      }
      if (flags.tavern_merchant_bridge_crossed) {
        return '人情与面子的担子';
      }
      if (flags.peasant_merchant_bridge_crossed) {
        return '粮路与奔波的担子';
      }
      return '巨贾负担';
    }
    if (flags.magnate_midlife_pressure_done) {
      if (flags.apprentice_merchant_bridge_crossed) {
        return '合伙与账目的担子';
      }
      if (flags.tavern_merchant_bridge_crossed) {
        return '人情与面子的担子';
      }
      if (flags.peasant_merchant_bridge_crossed) {
        return '粮路与奔波的担子';
      }
      return '巨贾负担';
    }
    // P63: Entry differentiation via bridge-origin markers at magnate_on_ramp
    if (flags.magnate_on_ramp_done) {
      if (flags.apprentice_merchant_bridge_crossed) {
        return '手艺与合伙的担子';
      }
      if (flags.tavern_merchant_bridge_crossed) {
        return '人脉与铺子的担子';
      }
      if (flags.peasant_merchant_bridge_crossed) {
        return '粮路与买卖的担子';
      }
      return '巨贾负担';
    }
    // P94: early merchant track differentiation at age 10-15
    if (flags.hvg_merchant_operating_pressure_done) {
      if (flags.hvg_merchant_ledger_track) {
        return flags.hvg_merchant_ledger_pressure_stockout ? '断货之累' : '赊欠之累';
      }
      if (flags.hvg_merchant_caravan_track) {
        return flags.hvg_merchant_caravan_pressure_swing_loss ? '行市之亏' : '波动之赌';
      }
    }
    if (flags.hvg_merchant_post_shop_rhythm_done) {
      if (flags.hvg_merchant_ledger_track) {
        return flags.hvg_merchant_ledger_rhythm_expand ? '扩货之累' : '周转之累';
      }
      if (flags.hvg_merchant_caravan_track) {
        return flags.hvg_merchant_caravan_rhythm_market ? '行市之赌' : '压货之累';
      }
    }
    if (flags.hvg_merchant_first_challenge_done) {
      if (flags.hvg_merchant_ledger_track) {
        return flags.hvg_merchant_ledger_challenge_rushed ? '赶账之累' : '守账之累';
      }
      if (flags.hvg_merchant_caravan_track) {
        return flags.hvg_merchant_caravan_challenge_bold ? '行市之赌' : '货路之累';
      }
    }
    if (flags.hvg_merchant_post_fork_confirmation_done) {
      if (flags.hvg_merchant_ledger_track) {
        return '账房见习之累';
      }
      if (flags.hvg_merchant_caravan_track) {
        return '认货跑商之累';
      }
    }
    return '商路债务';
  }
  if (line === 'renown') {
    if (flags.renown_endgame_done) {
      if (flags.tavern_renown_endgame_sigh) {
        return '身后名·叹';
      }
      if (flags.tavern_renown_endgame_distant) {
        return '身后名·遥';
      }
      if (flags.tavern_renown_endgame_legacy) {
        return '身后名·传';
      }
    }
    if (flags.renown_late_life_done) {
      if (flags.tavern_renown_late_burnout) {
        return '油尽灯枯';
      }
      if (flags.tavern_renown_late_lone_wolf) {
        return '逍遥自在';
      }
      if (flags.tavern_renown_late_mentor) {
        return '传承授业';
      }
    }
    if (flags.renown_midlife_payoff_done) {
      if (flags.tavern_renown_payoff_hard_holder) {
        return '声名之累';
      }
      if (flags.tavern_renown_payoff_breaker) {
        return '快意恩仇';
      }
      if (flags.tavern_renown_payoff_balancer) {
        return '人情练达';
      }
    }
    if (flags.renown_midlife_pressure_done) {
      return '人情债渐重';
    }
    return '江湖声名之累';
  }
  if (line === 'medical') {
    if (flags.medical_endgame_echo_done) {
      if (flags.tavern_medical_endgame_compassionate_ember) {
        return '仁心不灭·烬';
      }
      if (flags.tavern_medical_endgame_compassionate_peace) {
        return '医者从容·淡';
      }
      if (flags.tavern_medical_endgame_compassionate_legacy) {
        return '仁心满天下·传';
      }
      if (flags.tavern_medical_endgame_pragmatic_fame_remain) {
        return '医名犹存·寂';
      }
      if (flags.tavern_medical_endgame_pragmatic_wanderer_legend) {
        return '江湖游医·遥';
      }
      if (flags.tavern_medical_endgame_pragmatic_grand_master) {
        return '一代宗师·名';
      }
    }
    if (flags.medical_late_life_done) {
      if (flags.tavern_medical_late_compassionate_final) {
        return '最后仁心';
      }
      if (flags.tavern_medical_late_compassionate_peaceful) {
        return '从容自在';
      }
      if (flags.tavern_medical_late_compassionate_legacy) {
        return '仁心传承';
      }
      if (flags.tavern_medical_late_pragmatic_fallen) {
        return '人走茶凉';
      }
      if (flags.tavern_medical_late_pragmatic_wanderer) {
        return '逍遥自在';
      }
      if (flags.tavern_medical_late_pragmatic_master) {
        return '德高望重';
      }
    }
    if (flags.medical_payoff_done) {
      if (flags.tavern_medical_payoff_compassionate_holder) {
        return '油尽灯枯';
      }
      if (flags.tavern_medical_payoff_compassionate_let_go) {
        return '释然行医';
      }
      if (flags.tavern_medical_payoff_compassionate_legacy) {
        return '仁心传承';
      }
      if (flags.tavern_medical_payoff_pragmatic_holder) {
        return '声名所累';
      }
      if (flags.tavern_medical_payoff_pragmatic_breaker) {
        return '快意江湖';
      }
      if (flags.tavern_medical_payoff_pragmatic_master) {
        return '人情练达';
      }
    }
    if (flags.tavern_medical_pressure_compassionate) {
      return '仁心耗尽';
    }
    if (flags.tavern_medical_pressure_pragmatic) {
      return '人情债缠身';
    }
    if (flags.tavern_embrace_compassionate_healer) {
      return '仁心之累';
    }
    if (flags.tavern_embrace_pragmatic_healer) {
      return '世故之秤';
    }
    return '行医之重';
  }
  return '守正代价';
}

export function deriveSampleLineCurrentGoal(state: GameState): string | undefined {
  const flags = state.flags ?? {};
  const age = state.player?.age ?? 0;
  const line = detectSampleLine(flags);
  if (!line) {
    return undefined;
  }
  if (line === 'orthodox') {
    return orthodoxCurrentGoal(flags, age);
  }
  if (line === 'demonic') {
    return demonicCurrentGoal(flags, age);
  }
  if (line === 'merchant') {
    return merchantCurrentGoal(flags, age);
  }
  if (line === 'medical') {
    return medicalCurrentGoal(flags, age);
  }
  return renownCurrentGoal(flags, age);
}

function orthodoxAge40Identity(flags: Record<string, unknown>): string | undefined {
  if (!flags.orthodox_age40_identity_done && !flags.sect_midlife_outcome) {
    return undefined;
  }
  if (flags.sect_midlife_gray_refused) {
    return '你是守住底线的正派武者，为守正放弃了捷径与灰色利益';
  }
  if (flags.sect_midlife_gray_executed) {
    return '你是背负灰色任务的正派武者，师门记功而心下难安';
  }
  if (flags.sect_midlife_gray_leaked) {
    return '你是把内幕捅出的正派武者，江湖侧目而问心无愧';
  }
  return '你是被门派与江湖认可的正派武者，为守正放弃了安逸与捷径';
}

function demonicAge40Identity(flags: Record<string, unknown>): string | undefined {
  if (!flags.demonic_age40_identity_done && !flags.demonic_midlife_fork_done) {
    return undefined;
  }
  if (flags.demonic_midlife_legacy_withdraw) {
    return '你成了金盆洗手却仍甩不脱阴影的魔道中人，诱惑让你得到权力，也让你失去信任';
  }
  if (flags.demonic_midlife_legacy_exile) {
    return '你成了远遁割席的魔道中人，诱惑让你得到力量，也让你失去归属';
  }
  if (flags.demonic_midlife_legacy_rule) {
    return '你成了立规掌权的魔道中人，诱惑让你得到地位，也让你失去退路';
  }
  return '你成了被选择与后果推向邪路的魔道中人，诱惑让你得到力量，也让你失去安稳';
}

function merchantAge40Identity(flags: Record<string, unknown>): string | undefined {
  if (!flags.merchant_age40_identity_done) {
    return undefined;
  }
  // P67: success-shape differentiation + P66 cost weight
  // Identity now emphasizes what KIND of success, not just where you came from
  if (flags.magnate_on_ramp_done) {
    if (flags.apprentice_merchant_bridge_crossed) {
      return '你是靠手艺眼光做起来的巨贾：从刨子到账本，品质立住了招牌，合伙铺出了版图，代价是再也回不到只管刨花的日子';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '你是靠人情网络做起来的巨贾：从酒肆到商号，人脉织出了商路，引荐打通了关节，代价是人人都认得你、人人都有求于你';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '你是靠脚力血汗做起来的巨贾：从田埂到车马，粮路踩出了根基，奔波换来了规模，代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳';
    }
    return '你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任';
  }
  if (flags.merchant_shop_failed || flags.merchant_midlife_debt) {
    return '你是历经起落仍撑住门面的商路中人，财富带来选择，也带来债、人情与周转风险';
  }
  return '你是靠经营立足的商路中人，财富带来选择，也带来人情与周转压力';
}

function renownAge40Identity(flags: Record<string, unknown>): string | undefined {
  if (!flags.tavern_renown_bridge_crossed) {
    return undefined;
  }
  if (flags.renown_endgame_identity_done) {
    if (flags.tavern_renown_endgame_sigh) {
      return '你是熬干了的老传说：从酒肆跑堂到江湖名宿，硬扛了一辈子人情债，名声传了一辈子，人也熬干了。最后坐在酒肆角落里，听着年轻人讲自己的传说——名声比人长久，代价也没人记得了。可你知道，有些人，就是为了名声活着的。';
    }
    if (flags.tavern_renown_endgame_distant) {
      return '你是传说里的神秘人：从酒肆跑堂到江湖独行，撕破了一辈子假人情，换来了逍遥自在。江湖上你的传说真假参半，在座没人认出你。你笑了笑——自己都快忘了当年的样子了。传说比人逍遥，真假谁在乎呢。';
    }
    if (flags.tavern_renown_endgame_legacy) {
      return '你是活在传说里的老掌柜：从酒肆跑堂到江湖名宿，人情练达了一辈子，也传了一辈子。老掌柜的规矩还在被人提起，后辈们照着你的路走下去。传承不是名字传下去，是智慧传下去了——你这辈子，没白活。';
    }
  }
  if (flags.renown_late_life_identity_done) {
    if (flags.tavern_renown_late_burnout) {
      return '你是油尽灯枯的老好人：从酒肆跑堂到江湖名宿，硬扛了一辈子人情债，名声响了一辈子，身体也垮了。酒肆的老掌柜若还在，大概会说你傻吧。可你知道——有些人，就是为了名声活着的。';
    }
    if (flags.tavern_renown_late_lone_wolf) {
      return '你是逍遥自在的孤翁：从酒肆跑堂到江湖独行，撕破了一辈子假人情，断了所有不该有的牵绊。身边的人少了，心却宽了。有人说你可怜，你只笑笑——酒肆里三教九流见多了，真真假假，你分得清。孤独？不，这叫自由。';
    }
    if (flags.tavern_renown_late_mentor) {
      return '你是德高望重的老前辈：从酒肆跑堂到江湖名宿，人情练达了一辈子，拿捏得准分寸，分得清真假。到了晚年，成了人人敬重的老前辈——年轻人来请教，你倾囊相授。酒肆掌柜的智慧，全被你用在了江湖上，也传给了后来人。';
    }
  }
  if (flags.renown_age40_identity_done) {
    if (flags.tavern_renown_payoff_hard_holder) {
      return '你是硬撑面子的江湖好人：从酒肆跑堂到江湖名宿，人情债都自己扛，名声响了，担子也重了。';
    }
    if (flags.tavern_renown_payoff_breaker) {
      return '你是快意恩仇的独行侠：从酒肆跑堂到江湖名宿，撕破了假人情，换来了真自由。';
    }
    if (flags.tavern_renown_payoff_balancer) {
      return '你是人情练达的江湖名宿：从酒肆跑堂到江湖名宿，懂人情往来，拿捏得住分寸，游刃有余。';
    }
  }
  return '你是从酒肆走来的江湖名宿：人脉为基，引荐为径，声名是人情往来的重量。';
}

function medicalAge40Identity(flags: Record<string, unknown>): string | undefined {
  if (flags.medical_endgame_identity_done) {
    if (flags.tavern_medical_endgame_compassionate_ember) {
      return '你是燃尽自己的点灯人：从酒肆里的苦孩子到一代名医，你硬扛了一辈子，燃尽了自己，却点亮了无数盏灯。你救过的人，有的成了好大夫，有的一辈子记着你的恩情。仁心像火种——你这盏灯快灭了，但别处的灯，还亮着。老掌柜若还在，大概会摸着你的头说：「傻孩子，值了。」';
    }
    if (flags.tavern_medical_endgame_compassionate_peace) {
      return '你是从容淡然的老医者：硬扛了半辈子，终于想通了。到了晚年，你成了最从容的老医者——搬个小凳子坐在门口晒太阳，老病人找上门来随手就给看了，不收钱，就当聊聊天。有人说你真好，你只笑笑——好什么呀，就是顺手的事。酒肆的老掌柜若还在，大概会拍你肩膀说：「臭小子，终于想通了？」';
    }
    if (flags.tavern_medical_endgame_compassionate_legacy) {
      return '你是桃李满天下的仁医宗师：一辈子行医救人，带出了一群好徒弟。大徒弟在江南开药庐，二徒弟在塞外救牧民，三徒弟进宫做了太医……个个都像你，一样的仁心，一样的热血。有人说你是「一代宗师」，你只摆摆手——「什么宗师不宗师的，救人而已。」酒肆的老掌柜若还在，大概会捋着胡子笑——当年酒肆里熬药的苦孩子，现在桃李满天下了。';
    }
    if (flags.tavern_medical_endgame_pragmatic_fame_remain) {
      return '你是失势但名存的老太医：从酒肆跑堂爬到太医院院判，你风光了半辈子。可靠山一倒，墙倒众人推，从人人巴结的「李院判」变成了无人问津的「老李头」。你倒是看得开——起起落落，不就是人生吗？只是你写的医书药方，还在太医院里传着，还在江湖上用着。权势如烟云，医名自长久。酒肆老掌柜若还在，大概会叹口气——爬那么高干什么呢？可转头又会说：可你写的那些药方，管用！';
    }
    if (flags.tavern_medical_endgame_pragmatic_wanderer_legend) {
      return '你是传说里的逍遥游医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖。从江南走到塞北，从东海走到西域，什么权贵什么人情，全不放在眼里。江湖上到处是你的传说——有人说你能活死人肉白骨，有人说你脾气古怪，有人说你早就死在塞外了……你听着直乐。酒肆老掌柜若还在，大概会笑着骂你「这匹野马，到死都拴不住」。你也笑——人生在世，不就图个自在吗？';
    }
    if (flags.tavern_medical_endgame_pragmatic_grand_master) {
      return '你是德高望重的一代宗师：一辈子人情练达，拿捏得住分寸，分得清真假。到了晚年，人人敬重——权贵给你面子，江湖人卖你情面，徒弟们个个有出息。太医院请你做院判你不去，江湖门派请你做供奉你也不去——就守着你的药庐，看着后辈们成长。酒肆老掌柜若还在，大概会捋着胡子得意——「我就说这小子是块料子！」你也笑——这一辈子，全靠当年在酒肆学的那点人情世故。';
    }
    return undefined;
  }
  if (flags.medical_late_life_identity_done) {
    if (flags.tavern_medical_late_compassionate_final) {
      return '你是燃尽自己的最后仁心：从酒肆里的苦孩子到一代名医，你硬扛了一辈子。身体垮了，手抖了，眼看不清了，可只要还有人找上门，你还是撑着坐起来。老掌柜若还在，大概会哭着骂你傻。可你知道——医者仁心，就是燃尽自己，照亮别人。';
    }
    if (flags.tavern_medical_late_compassionate_peaceful) {
      return '你是从容自在的老者：硬扛了半辈子，终于学会了放手。到了晚年，你成了最从容的老者——没事晒晒太阳，给街坊看看小病，徒弟们都独当一面了。酒肆的老掌柜若还在，大概会笑着拍你肩膀——"臭小子，终于想通了？"你也笑——是啊，早该这样了。';
    }
    if (flags.tavern_medical_late_compassionate_legacy) {
      return '你是仁心满天下的老宗师：一辈子行医救人，带出了一群好徒弟。徒弟们散在各地，个个仁心仁术，像你年轻时一样。有人说你是"一代宗师"，你只摆摆手——"什么宗师不宗师的，救人而已。"酒肆的老掌柜若还在，大概会捋着胡子笑——当年酒肆里的苦孩子，现在桃李满天下了。';
    }
    if (flags.tavern_medical_late_pragmatic_fallen) {
      return '你是失势的老御医：从酒肆跑堂爬到太医院院判，你风光了半辈子。可靠山一倒，墙倒众人推，从人人巴结的"李院判"变成了无人问津的"老李头"。有人说你可怜，你只冷笑——可怜？你见过的世面，这些人一辈子都见不到。酒肆老掌柜若还在，大概会叹口气——爬那么高干什么呢？可你知道——不爬，就只能端一辈子盘子。';
    }
    if (flags.tavern_medical_late_pragmatic_wanderer) {
      return '你是逍遥自在的老游医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖。从江南走到塞北，从东海走到西域，什么权贵什么人情，全不放在眼里。酒肆老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？';
    }
    if (flags.tavern_medical_late_pragmatic_master) {
      return '你是德高望重的老名医：一辈子人情练达，拿捏得住分寸，分得清真假。到了晚年，人人敬重——权贵给你面子，江湖人卖你情面，徒弟们个个有出息。酒肆老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子！"你也笑——这一辈子，全靠当年在酒肆学的那点人情世故。';
    }
    return undefined;
  }
  if (!flags.medical_age40_identity_done) {
    return undefined;
  }
  if (flags.tavern_medical_payoff_compassionate_holder) {
    return '你是油尽灯枯的仁心医者：从酒肆帮工到一代名医，一辈子救了无数人，唯独忘了救自己。';
  }
  if (flags.tavern_medical_payoff_compassionate_let_go) {
    return '你是释然通透的医者：从酒肆帮工到一代名医，曾以为自己能救所有人，直到身体垮了才学会量力而行。';
  }
  if (flags.tavern_medical_payoff_compassionate_legacy) {
    return '你是传道授业的仁医之师：从酒肆帮工到一代名医，身体垮了，但仁心没断，医术和医德一起传了下去。';
  }
  if (flags.tavern_medical_payoff_pragmatic_holder) {
    return '你是声名赫赫的权贵御医：从酒肆帮工到一代名医，靠人情世故闯出了名头，成了权贵座上宾，只是再也脱不开身。';
  }
  if (flags.tavern_medical_payoff_pragmatic_breaker) {
    return '你是快意恩仇的江湖游医：从酒肆帮工到一代名医，曾在权贵圈里风生水起，后来撕破脸断了人情，反倒活得自在。';
  }
  if (flags.tavern_medical_payoff_pragmatic_master) {
    return '你是人情练达的一代名医：从酒肆帮工到一代名医，深谙人情世故，拿捏得恰到好处，谁都给面子，谁也绑不住。';
  }
  return undefined;
}

export function deriveSampleLineAge40Identity(state: GameState): string | undefined {
  const flags = state.flags ?? {};
  const age = state.player?.age ?? 0;
  if (age < 38) {
    return undefined;
  }
  const line = detectSampleLine(flags);
  if (line === 'merchant') {
    return merchantAge40Identity(flags);
  }
  if (line === 'orthodox') {
    return orthodoxAge40Identity(flags);
  }
  if (line === 'demonic') {
    return demonicAge40Identity(flags);
  }
  if (line === 'renown') {
    return renownAge40Identity(flags);
  }
  if (line === 'medical') {
    return medicalAge40Identity(flags);
  }
  return undefined;
}

function merchantDestinySentence(flags: Record<string, unknown>): string | undefined {
  if (!flags.magnate_payoff_done) {
    return undefined;
  }
  if (flags.apprentice_merchant_bridge_crossed) {
    return '从刨子到账本，靠手艺眼光算出了一片商路';
  }
  if (flags.tavern_merchant_bridge_crossed) {
    return '从酒肆到商号，靠人情网络织出了八方商路';
  }
  if (flags.peasant_merchant_bridge_crossed) {
    return '从田埂到车马，靠脚力血汗踩出了一条粮路';
  }
  return undefined;
}

export function deriveSampleLineDestinySentence(state: GameState): string | undefined {
  const flags = state.flags ?? {};
  const line = detectSampleLine(flags);
  if (line === 'merchant') {
    return merchantDestinySentence(flags);
  }
  return undefined;
}

export function isPlayerVisibleSampleLineText(text: string): boolean {
  return !/(^route_|_done$|eventId|flags\.)/.test(text);
}
