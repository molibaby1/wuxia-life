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
  if (flags.founding_patriarch_payoff_done) {
    if (flags.founding_patriarch_payoff_legacy_holder) {
      return '续责如山，开派名号落在门派与治学一并传承之上';
    }
    if (flags.founding_patriarch_payoff_independent_founder) {
      return '自立山门，治学规矩自己定，不再听诸派差遣';
    }
    if (flags.founding_patriarch_payoff_dual_gate) {
      return '盟约师承各守其份，开派之路不再两头拉扯';
    }
  }
  if (flags.founding_patriarch_midlife_pressure_done) {
    if (flags.founding_patriarch_pressure_rule_first) {
      return '先稳门规传承，再承接诸派盟约续责，开派担子已压实';
    }
    if (flags.founding_patriarch_pressure_alliance_first) {
      return '先承接诸派盟约续责，再收束门规传承，开派担子已压实';
    }
    return '门规传承与盟约续责并压在肩，开派担子已压实';
  }
  if (flags.founding_patriarch_on_ramp_done) {
    if (flags.founding_patriarch_on_ramp_scholar) {
      return '学者师徒与治学盟约并进，开宗立派的念头渐明';
    }
    if (flags.founding_patriarch_on_ramp_alliance) {
      return '门派续责与诸派盟约并进，开宗立派的担子渐沉';
    }
    return '师门盟约与学者线拧在一处，开派之路已开';
  }
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
    return '守正有代价，门派义务先于私利';
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
  if (flags.magnate_endgame_echo_done) {
    if (flags.magnate_bridge_endgame_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
      return '商号招牌化作身后名，手艺合伙人都还记得你';
    }
    if (flags.magnate_bridge_endgame_tavern_network || flags.tavern_merchant_bridge_crossed) {
      return '人情商路化作身后名，欠情与引荐都成了江湖谈资';
    }
    if (flags.magnate_bridge_endgame_peasant_grain || flags.peasant_merchant_bridge_crossed) {
      return '粮路奔波化作身后名，车马仓储都还记着你的名号';
    }
    if (flags.magnate_native_endgame_ledger_legacy) {
      return '稳态招牌化作身后名，信誉比规模更长久';
    }
    if (flags.magnate_native_endgame_caravan_legacy) {
      return '行市货路化作身后名，涨跌余波都成了江湖谈资';
    }
    return '巨贾之位化作身后回响，商号与人情都留在了江湖';
  }
  if (flags.magnate_late_life_done) {
    // P64 bridge priority at late-life (expression only; no bridge late-life rewrite)
    if (flags.apprentice_merchant_bridge_crossed) {
      return '晚年守手艺商路：合伙账目与品质招牌都要收束';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '晚年守人情商路：欠情与引荐都要收束，面子比利润更烫手';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '晚年守粮路奔波：车马仓储与下属工钱都要收束';
    }
    // P99: Native magnate late-life reads P99 late-life markers, then P98 payoff lineage
    if (flags.magnate_native_late_ledger_steady) {
      return '晚年守稳态招牌：信誉比规模更金贵，接班与收束都在眼前';
    }
    if (flags.magnate_native_late_ledger_credit) {
      return '晚年清赊欠人情：人情账比银钱账更难算，收束比再赊更要紧';
    }
    if (flags.magnate_native_late_caravan_market) {
      return '晚年收行市余波：涨跌都在心上，货路收势比再押更难';
    }
    if (flags.magnate_native_late_caravan_fast) {
      return '晚年守货路周转：货路比利润更金贵，收束比再压更要紧';
    }
    if (flags.magnate_native_late_ledger) {
      return '晚年账房式守成：守招牌比抢规模要紧，信誉与接班一并考量';
    }
    if (flags.magnate_native_late_caravan) {
      return '晚年跑货式收势：行市风向比账烫手，货路收束在前';
    }
    return '巨贾晚年守成，商号与人情都要收束';
  }
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
    // P98: Native magnate payoff reads P98 payoff markers, then pressure/entry lineage
    if (flags.magnate_native_payoff_ledger_steady || flags.magnate_native_payoff_ledger) {
      return '稳态巨贾之位已成：稳扩积势守住了招牌，信誉比规模更金贵，守住比再扩更难';
    }
    if (flags.magnate_native_payoff_ledger_credit) {
      return '信誉资本收束已成：赊欠铺路铺出了版图，人情账比银钱账更难算，守住比再赊更难';
    }
    if (flags.magnate_native_payoff_caravan_market || flags.magnate_native_payoff_caravan) {
      return '行市赢家之位已成：赌市扩货铺了货路，涨跌都在心上，守住比再押更难';
    }
    if (flags.magnate_native_payoff_caravan_fast) {
      return '货路帝国之位已成：快周转压货撑了规模，货路比利润更金贵，守住比再压更难';
    }
    if (flags.magnate_native_ledger_entry) {
      if (flags.magnate_native_pressure_ledger_credit || flags.magnate_native_ledger_credit || flags.hvg_merchant_ledger_expansion_credit) {
        return '账房式巨贾之位已成：赊欠铺路撑了规模，信誉与周转两头顾，守住比再赊更难';
      }
      return '账房式巨贾之位已成：稳扩积势跨了门槛，守信誉比抢规模要紧，守住比再扩更难';
    }
    if (flags.magnate_native_caravan_entry) {
      if (flags.magnate_native_pressure_caravan_fast || flags.magnate_native_caravan_fast || flags.hvg_merchant_caravan_expansion_fast) {
        return '跑货式巨贾之位已成：快周转压货撑了货路，货路一断便卡死，守住比再压更难';
      }
      return '跑货式巨贾之位已成：赌市扩货跨了门槛，行市风向比账烫手，守住比再押更难';
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
    // P98: Native magnate pressure reads P98 pressure-phase markers, then P97 entry lineage
    if (flags.magnate_native_pressure_ledger_steady || flags.magnate_native_pressure_ledger) {
      return '商号遍九州，稳扩欠下的人情债也遍九州，守信誉比抢规模要紧';
    }
    if (flags.magnate_native_pressure_ledger_credit) {
      return '商号遍九州，赊欠铺开的信誉债也遍九州，人情账比银钱账更难算';
    }
    if (flags.magnate_native_pressure_caravan_market || flags.magnate_native_pressure_caravan) {
      return '商号遍九州，赌市扩货欠下的债也遍九州，行市一跌便喘不过气';
    }
    if (flags.magnate_native_pressure_caravan_fast) {
      return '商号遍九州，快周转撑起的债也遍九州，货路一断便卡死';
    }
    // P97 fallback: native entry markers + P96 expansion sub-flags
    if (flags.magnate_native_ledger_entry) {
      if (flags.hvg_merchant_ledger_expansion_credit || flags.magnate_native_ledger_credit) {
        return '商号遍九州，赊欠铺开的信誉债也遍九州，人情账比银钱账更难算';
      }
      if (flags.hvg_merchant_ledger_expansion_steady || flags.magnate_native_ledger_steady) {
        return '商号遍九州，稳扩欠下的人情债也遍九州，守信誉比抢规模要紧';
      }
      return '商号遍九州，账房式扩张债也遍九州';
    }
    if (flags.magnate_native_caravan_entry) {
      if (flags.hvg_merchant_caravan_expansion_market || flags.magnate_native_caravan_market) {
        return '商号遍九州，赌市扩货欠下的债也遍九州，行市一跌便喘不过气';
      }
      if (flags.hvg_merchant_caravan_expansion_fast || flags.magnate_native_caravan_fast) {
        return '商号遍九州，快周转撑起的债也遍九州，货路一断便卡死';
      }
      return '商号遍九州，跑货式扩张债也遍九州';
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
    // P97: Native merchant_house ledger/caravan magnate entry
    if (flags.magnate_native_ledger_entry) {
      if (flags.magnate_native_ledger_steady || flags.hvg_merchant_ledger_expansion_steady) {
        return '稳扩积势已足，正守信誉跨巨贾门槛';
      }
      if (flags.magnate_native_ledger_credit || flags.hvg_merchant_ledger_expansion_credit) {
        return '赊欠铺路撑了规模，正控债务再做大';
      }
      return '账房式积势已足，正跨巨贾门槛';
    }
    if (flags.magnate_native_caravan_entry) {
      if (flags.magnate_native_caravan_market || flags.hvg_merchant_caravan_expansion_market) {
        return '赌市扩货撑了货路，正押行市跨巨贾门槛';
      }
      if (flags.magnate_native_caravan_fast || flags.hvg_merchant_caravan_expansion_fast) {
        return '快周转换了规模，正抢货路跨巨贾门槛';
      }
      return '跑货式积势已足，正跨巨贾门槛';
    }
    return '产业初成，巨贾之路刚起步';
  }
  // P112: Patron endgame goals (endgame > late_life > payoff > pressure > on-ramp)
  if (flags.merchant_patron_endgame_echo_done) {
    if (flags.merchant_patron_endgame_covenant_echo) {
      return '盟约碑立，商武名号交给后来人记';
    }
    if (flags.merchant_patron_endgame_solitary_echo) {
      return '商号是自己的定论，不再等盟约回音';
    }
    if (flags.merchant_patron_endgame_legacy_echo) {
      return '看后来人按新盟分寸运转，这就够了';
    }
    return '商武定型之后，终局自有终局的定论';
  }
  // P110: Patron late-life goals (late_life > payoff > pressure > on-ramp)
  if (flags.merchant_patron_late_life_done) {
    if (flags.merchant_patron_late_covenant_bound) {
      return '守盟约至终，商武名号不能倒';
    }
    if (flags.merchant_patron_late_isolated_merchant) {
      return '商路自分断，不再求山门庇护';
    }
    if (flags.merchant_patron_late_sustainable_covenant) {
      return '守新盟规矩，传商武分寸给后来人';
    }
    return '商武定型之后，晚年自有晚年的过法';
  }
  // P102/P108: Patron bridge goals (magnate tiers above take priority when magnate markers set)
  if (flags.merchant_patron_payoff_done) {
    if (flags.merchant_patron_payoff_covenant_holder) {
      return '硬扛盟约护商，商武名号靠刀与账一起撑';
    }
    if (flags.merchant_patron_payoff_covenant_breaker) {
      return '撕破盟约，商号不再听山门差遣';
    }
    if (flags.merchant_patron_payoff_balancer) {
      return '重谈盟约边界，商武各守其份';
    }
    return '商武一体名号已定，门派对投与江湖护卫都成了招牌';
  }
  // P106: Patron midlife pressure goals (payoff > pressure > on-ramp)
  if (flags.merchant_patron_midlife_pressure_done) {
    if (flags.merchant_patron_on_ramp_orthodox) {
      return '一面守侠义盟约护商，一面应付门派索债般的武力差遣';
    }
    if (flags.merchant_patron_on_ramp_martial) {
      return '一面加派护镖撑商路，一面应付盟约兑现后的武力负担';
    }
    if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
      return '一面用手艺标准护商，一面应付盟约兑现后的品质与护镖两头紧';
    }
    if (flags.merchant_patron_bridge_tavern_network || flags.tavern_merchant_bridge_crossed) {
      return '一面靠消息网调度护商，一面应付盟约兑现后的借道与人手两头紧';
    }
    if (flags.merchant_patron_bridge_peasant_grain || flags.peasant_merchant_bridge_crossed) {
      return '一面用粮路脚力撑护商，一面应付盟约兑现后的囤粮与护镖两头紧';
    }
    return '一面扩张商路，一面应付门派护商盟约兑现后的武力负担';
  }
  if (flags.merchant_patron_on_ramp_done) {
    if (flags.merchant_patron_on_ramp_orthodox) {
      return '银钱换侠义盟约，正把手中的商路与门派的剑绑在同一条绳上';
    }
    if (flags.merchant_patron_on_ramp_martial) {
      return '武力护商路，正把护镖与放贷拧成一条商武绳';
    }
    // P103: Bridge-origin patron goals (native orthodox/martial above retain priority)
    if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
      return '手艺眼光换门派护商，正把刨花与剑鞘绑成一条商武绳';
    }
    if (flags.merchant_patron_bridge_tavern_network || flags.tavern_merchant_bridge_crossed) {
      return '酒肆人脉换门派借道，正把消息网与护镖拧成一条商武绳';
    }
    // P104: Peasant bridge-origin patron goal (native + apprentice/tavern above retain priority)
    if (flags.merchant_patron_bridge_peasant_grain || flags.peasant_merchant_bridge_crossed) {
      return '粮路脚力换门派护商，正把囤粮与护镖拧成一条商武绳';
    }
    return '商武一体之约已立，门派对投比单纯营利更烫手';
  }
  if (flags.merchant_age45_expansion_fork_done) {
    if (flags.hvg_merchant_ledger_track && flags.hvg_merchant_expansion_rhythm_done) {
      return '扩张分岔已至，稳扩欠下的人情债在前';
    }
    if (flags.hvg_merchant_caravan_track && flags.hvg_merchant_expansion_rhythm_done) {
      return '扩张分岔已至，赌市扩货的风险与机遇并行';
    }
    return '扩张分岔已至，债与人情并重';
  }
  if (flags.merchant_age40_identity_done && age >= 44) {
    return '商路身份已定，扩张分岔在前';
  }
  if (flags.merchant_age40_identity_done) {
    return '财富带来选择，也带来债';
  }
  if (flags.merchant_midlife_debt) {
    if (flags.merchant_midlife_debt_ledger_steady) {
      return age >= 35 ? '稳扩欠下的债，守信誉比抢规模要紧' : '人情债涌来，稳扩的代价落在周转上';
    }
    if (flags.merchant_midlife_debt_ledger_credit) {
      return age >= 35 ? '赊欠铺开的债，人情账比银钱账难算' : '扩张赊欠到期，信誉与周转两头难';
    }
    if (flags.merchant_midlife_debt_caravan_market) {
      return age >= 35 ? '赌市扩货的债，行市一跌便喘不过气' : '行市波动欠下的债，押货脚步慢了下来';
    }
    if (flags.merchant_midlife_debt_caravan_fast) {
      return age >= 35 ? '快周转撑起的债，货路一断便卡死' : '压货扩规模的债，周转比利润更紧';
    }
    return age >= 32 ? '周转吃紧，人情债未清' : '扩张初尝，债务阴影已现';
  }
  if (flags.merchant_shop_failed) {
    return age >= 32 ? '周转吃紧，人情债未清' : '扩张初尝，债务阴影已现';
  }
  if (flags.hvg_merchant_expansion_rhythm_done) {
    if (flags.hvg_merchant_ledger_track) {
      if (flags.hvg_merchant_ledger_expansion_credit) {
        return age >= 28 ? '赊欠铺路扩了规模，信誉与周转两头顾' : '放宽赊欠换客源，头一回认真扩门面';
      }
      if (flags.hvg_merchant_ledger_expansion_steady) {
        return age >= 28 ? '稳扩守信誉，债务控得比库存还紧' : '稳扩门面控债务，慢一步也不砸招牌';
      }
    }
    if (flags.hvg_merchant_caravan_track) {
      if (flags.hvg_merchant_caravan_expansion_market) {
        return age >= 28 ? '赌市扩货铺了货路，涨跌都在心上' : '盯行市赌市扩货，趁涨势把规模撑起来';
      }
      if (flags.hvg_merchant_caravan_expansion_fast) {
        return age >= 28 ? '快周转压货撑了规模，货路比利润更紧' : '快周转压货走量，先把货路跑通再说';
      }
    }
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
    if (flags.founding_patriarch_payoff_done) {
      if (flags.founding_patriarch_payoff_legacy_holder) {
        return '续责开派之累';
      }
      if (flags.founding_patriarch_payoff_independent_founder) {
        return '自立开派之快';
      }
      if (flags.founding_patriarch_payoff_dual_gate) {
        return '双门并立之累';
      }
    }
    if (flags.founding_patriarch_midlife_pressure_done) {
      return '门派延续之重';
    }
    if (flags.founding_patriarch_on_ramp_done) {
      return '开派盟约之累';
    }
    return '守正代价';
  }
  if (line === 'demonic') {
    return '邪路代价';
  }
  if (line === 'merchant') {
    // P66: cost label differentiation persists through pressure and payoff
    if (flags.magnate_endgame_echo_done) {
      if (flags.magnate_bridge_endgame_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '手艺身后名';
      }
      if (flags.magnate_bridge_endgame_tavern_network || flags.tavern_merchant_bridge_crossed) {
        return '人情身后名';
      }
      if (flags.magnate_bridge_endgame_peasant_grain || flags.peasant_merchant_bridge_crossed) {
        return '粮路身后名';
      }
      if (flags.magnate_native_endgame_ledger_legacy) {
        return '稳态身后回响';
      }
      if (flags.magnate_native_endgame_caravan_legacy) {
        return '行市身后回响';
      }
      return '巨贾身后回响';
    }
    if (flags.magnate_late_life_done) {
      if (flags.apprentice_merchant_bridge_crossed) {
        return '合伙守成之累';
      }
      if (flags.tavern_merchant_bridge_crossed) {
        return '人情收束之累';
      }
      if (flags.peasant_merchant_bridge_crossed) {
        return '粮路收束之累';
      }
      // P99: Native magnate late-life cost labels
      if (flags.magnate_native_late_ledger_steady || flags.magnate_native_late_ledger) {
        return '稳态守成之累';
      }
      if (flags.magnate_native_late_ledger_credit) {
        return '信誉收束之累';
      }
      if (flags.magnate_native_late_caravan_market || flags.magnate_native_late_caravan) {
        return '行市收势之累';
      }
      if (flags.magnate_native_late_caravan_fast) {
        return '货路收束之累';
      }
      return '巨贾晚年之累';
    }
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
      // P98: Native magnate payoff cost labels
      if (flags.magnate_native_payoff_ledger_steady || flags.magnate_native_payoff_ledger) {
        return '稳态巨贾之累';
      }
      if (flags.magnate_native_payoff_ledger_credit) {
        return '信誉资本之累';
      }
      if (flags.magnate_native_payoff_caravan_market || flags.magnate_native_payoff_caravan) {
        return '行市赢家之累';
      }
      if (flags.magnate_native_payoff_caravan_fast) {
        return '货路帝国之累';
      }
      if (flags.magnate_native_ledger_entry) {
        return flags.magnate_native_payoff_ledger_credit || flags.magnate_native_ledger_credit
          ? '信誉资本之累'
          : '稳态巨贾之累';
      }
      if (flags.magnate_native_caravan_entry) {
        return flags.magnate_native_payoff_caravan_fast || flags.magnate_native_caravan_fast
          ? '货路帝国之累'
          : '行市赢家之累';
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
      // P98: Native magnate pressure cost labels
      if (flags.magnate_native_pressure_ledger_steady || flags.magnate_native_pressure_ledger) {
        return '稳扩中年之累';
      }
      if (flags.magnate_native_pressure_ledger_credit) {
        return '赊欠中年之累';
      }
      if (flags.magnate_native_pressure_caravan_market || flags.magnate_native_pressure_caravan) {
        return '赌市中年之累';
      }
      if (flags.magnate_native_pressure_caravan_fast) {
        return '压货中年之累';
      }
      if (flags.magnate_native_ledger_entry) {
        return flags.magnate_native_ledger_credit || flags.hvg_merchant_ledger_expansion_credit
          ? '赊欠中年之累'
          : '稳扩中年之累';
      }
      if (flags.magnate_native_caravan_entry) {
        return flags.magnate_native_caravan_fast || flags.hvg_merchant_caravan_expansion_fast
          ? '压货中年之累'
          : '赌市中年之累';
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
      // P97: Native ledger/caravan magnate entry cost labels
      if (flags.magnate_native_ledger_entry) {
        if (flags.magnate_native_ledger_credit || flags.hvg_merchant_ledger_expansion_credit) {
          return '赊欠跨门槛之累';
        }
        if (flags.magnate_native_ledger_steady || flags.hvg_merchant_ledger_expansion_steady) {
          return '稳扩跨门槛之累';
        }
        return '账房跨门槛之累';
      }
      if (flags.magnate_native_caravan_entry) {
        if (flags.magnate_native_caravan_market || flags.hvg_merchant_caravan_expansion_market) {
          return '赌市跨门槛之累';
        }
        if (flags.magnate_native_caravan_fast || flags.hvg_merchant_caravan_expansion_fast) {
          return '压货跨门槛之累';
        }
        return '跑货跨门槛之累';
      }
      return '巨贾负担';
    }
    // P112: Patron endgame cost labels (endgame > late_life > payoff > pressure > on-ramp)
    if (flags.merchant_patron_endgame_echo_done) {
      if (flags.merchant_patron_endgame_covenant_echo) {
        return '商武终局·担';
      }
      if (flags.merchant_patron_endgame_solitary_echo) {
        return '商武终局·孤';
      }
      if (flags.merchant_patron_endgame_legacy_echo) {
        return '商武终局·传';
      }
      return '商武终局之累';
    }
    // P110: Patron late-life cost labels (late_life > payoff > pressure > on-ramp)
    if (flags.merchant_patron_late_life_done) {
      if (flags.merchant_patron_late_covenant_bound) {
        return '盟约终老之累';
      }
      if (flags.merchant_patron_late_isolated_merchant) {
        return '孤商自在之快';
      }
      if (flags.merchant_patron_late_sustainable_covenant) {
        return '新盟久立之累';
      }
      return '商武晚年之累';
    }
    // P102/P108: Patron bridge cost labels (magnate tiers above retain priority)
    if (flags.merchant_patron_payoff_done) {
      if (flags.merchant_patron_payoff_covenant_holder) {
        return '盟约如山之累';
      }
      if (flags.merchant_patron_payoff_covenant_breaker) {
        return '断武从商之快';
      }
      if (flags.merchant_patron_payoff_balancer) {
        return '商武新矩之累';
      }
      return '商武名号之累';
    }
    // P106: Patron midlife pressure cost labels (payoff > pressure > on-ramp)
    if (flags.merchant_patron_midlife_pressure_done) {
      if (flags.merchant_patron_on_ramp_orthodox) {
        return '侠义盟约之债';
      }
      if (flags.merchant_patron_on_ramp_martial) {
        return '护商武力之债';
      }
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '手艺护商之债';
      }
      if (flags.merchant_patron_bridge_tavern_network || flags.tavern_merchant_bridge_crossed) {
        return '人脉护商之债';
      }
      if (flags.merchant_patron_bridge_peasant_grain || flags.peasant_merchant_bridge_crossed) {
        return '粮路护商之债';
      }
      return '盟约护商之累';
    }
    if (flags.merchant_patron_on_ramp_done) {
      if (flags.merchant_patron_on_ramp_orthodox) {
        return '侠义盟约之累';
      }
      if (flags.merchant_patron_on_ramp_martial) {
        return '护商武力之累';
      }
      // P103: Bridge-origin patron cost labels (native variants above retain priority)
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '手艺护商之累';
      }
      if (flags.merchant_patron_bridge_tavern_network || flags.tavern_merchant_bridge_crossed) {
        return '人脉护商之累';
      }
      // P104: Peasant bridge-origin patron cost label
      if (flags.merchant_patron_bridge_peasant_grain || flags.peasant_merchant_bridge_crossed) {
        return '粮路护商之累';
      }
      return '商武盟约之累';
    }
    if (flags.merchant_midlife_debt) {
      if (flags.merchant_midlife_debt_ledger_steady || flags.merchant_midlife_debt_ledger_credit) {
        return flags.merchant_midlife_debt_ledger_credit ? '赊欠之债' : '稳扩之债';
      }
      if (flags.merchant_midlife_debt_caravan_market || flags.merchant_midlife_debt_caravan_fast) {
        return flags.merchant_midlife_debt_caravan_market ? '行市之债' : '压货之债';
      }
    }
    if (flags.hvg_merchant_expansion_rhythm_done) {
      if (flags.hvg_merchant_ledger_track) {
        return flags.hvg_merchant_ledger_expansion_credit ? '扩赊之累' : '稳扩之累';
      }
      if (flags.hvg_merchant_caravan_track) {
        return flags.hvg_merchant_caravan_expansion_market ? '赌市之累' : '压货之累';
      }
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
  if (flags.founding_patriarch_identity_done || flags.founding_patriarch_on_ramp_done) {
    if (flags.founding_patriarch_payoff_independent_founder) {
      return '你是自立山门的开派武者，为治学规矩与门派名号撕开了旧盟约';
    }
    if (flags.founding_patriarch_payoff_legacy_holder) {
      return '你是续责开派的开宗者，门派香火与学者师承一并扛在肩上';
    }
    if (flags.founding_patriarch_payoff_dual_gate) {
      return '你是双门并立的开宗者，盟约与师承各守其份而开派有名';
    }
    if (flags.founding_patriarch_on_ramp_scholar) {
      return '你是治学盟约并进的开派苗子，学者师徒线拉着开宗念头往前走';
    }
    if (flags.founding_patriarch_on_ramp_alliance) {
      return '你是门派盟约并进的开派苗子，续责诸派牵着开宗念头往前走';
    }
  }
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
  if (flags.magnate_endgame_identity_done) {
    if (flags.magnate_bridge_endgame_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
      return '你是身后留名的手艺巨贾：从刨子到账本，商号招牌化作江湖谈资，品质合伙人都还记得你';
    }
    if (flags.magnate_bridge_endgame_tavern_network || flags.tavern_merchant_bridge_crossed) {
      return '你是身后留名的人情巨贾：从酒肆到商号，欠情与引荐化作江湖谈资，面子比利润更长久';
    }
    if (flags.magnate_bridge_endgame_peasant_grain || flags.peasant_merchant_bridge_crossed) {
      return '你是身后留名的粮路巨贾：从田埂到车马，奔波与仓储化作江湖谈资，脚下的路比田埂还长';
    }
    if (flags.magnate_native_endgame_ledger_legacy) {
      return '你是稳态招牌留名的巨贾：半生稳扩积势守住了信誉，晚年收束之后，江湖提起你说的不是银两多少，而是招牌立得住';
    }
    if (flags.magnate_native_endgame_caravan_legacy) {
      return '你是行市货路留名的巨贾：半生赌市扩货铺了货路，晚年收势之后，江湖提起你说的不是账本多厚，而是货路走得通';
    }
    return '你是身后留响的巨贾：巨贾之位坐过，晚年收束过，商号与人情都化作江湖余响';
  }
  if (flags.magnate_late_life_identity_done) {
    if (flags.apprentice_merchant_bridge_crossed) {
      return '你是守成收束的手艺巨贾：从刨子到账本，晚年仍要看着合伙人与账目，品质招牌比规模更金贵';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '你是守成收束的人情巨贾：从酒肆到商号，晚年欠情与引荐都要收束，面子比利润更烫手';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '你是守成收束的粮路巨贾：从田埂到车马，晚年车马仓储与奔波都要收束，脚下的路比田埂还长';
    }
    // P99: Native magnate late-life identity
    if (flags.magnate_native_late_ledger_steady) {
      return '你是稳态守成的晚年巨贾：招牌立住了，跨过中年压力后守信誉比再扩规模更要紧，晚年要把接班与收束一并考量';
    }
    if (flags.magnate_native_late_ledger_credit) {
      return '你是信誉收束的晚年巨贾：赊欠铺路铺出了版图，晚年人情账比银钱账更难算清，收束比再赊更要紧';
    }
    if (flags.magnate_native_late_caravan_market) {
      return '你是行市收势的晚年巨贾：赌市扩货铺了货路，晚年涨跌余波仍在心上，收势比再押更难';
    }
    if (flags.magnate_native_late_caravan_fast) {
      return '你是货路收束的晚年巨贾：快周转压货撑了规模，晚年货路比利润更金贵，收束比再压更要紧';
    }
    if (flags.magnate_native_late_ledger) {
      return '你是账房式守成的晚年巨贾：稳扩积势跨了门槛又扛过中年压力，晚年守招牌比抢规模要紧';
    }
    if (flags.magnate_native_late_caravan) {
      return '你是跑货式收势的晚年巨贾：赌市扩货跨了门槛又扛过中年压力，晚年行市风向比账烫手';
    }
    return '你是富甲一方却仍在收束的晚年巨贾，商号与人情都要守，接班与余波都在眼前';
  }
  if (flags.magnate_payoff_done) {
    if (flags.apprentice_merchant_bridge_crossed) {
      return '你是靠手艺眼光做起来的巨贾：从刨子到账本，品质立住了招牌，合伙铺出了版图，代价是再也回不到只管刨花的日子';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '你是靠人情网络做起来的巨贾：从酒肆到商号，人脉织出了商路，引荐打通了关节，代价是人人都认得你、人人都有求于你';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '你是靠脚力血汗做起来的巨贾：从田埂到车马，粮路踩出了根基，奔波换来了规模，代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳';
    }
    // P98: Native magnate payoff identity
    if (flags.magnate_native_payoff_ledger_steady || flags.magnate_native_payoff_ledger) {
      return '你是稳态巨贾：稳扩积势守住了招牌，跨过中年压力后信誉比规模更金贵，守住比再扩更难';
    }
    if (flags.magnate_native_payoff_ledger_credit) {
      return '你是信誉资本巨贾：赊欠铺路铺出了版图，跨过中年压力后人情账比银钱账更难算清';
    }
    if (flags.magnate_native_payoff_caravan_market || flags.magnate_native_payoff_caravan) {
      return '你是行市赢家巨贾：赌市扩货铺了货路，跨过中年压力后涨跌都在心上';
    }
    if (flags.magnate_native_payoff_caravan_fast) {
      return '你是货路帝国巨贾：快周转压货撑了规模，跨过中年压力后货路比利润更金贵';
    }
    if (flags.magnate_native_ledger_entry) {
      return '你是账房式巨贾：稳扩积势跨了门槛又扛过中年压力，财富带来地位，也带来赊欠与信义之债';
    }
    if (flags.magnate_native_caravan_entry) {
      return '你是跑货式巨贾：赌市扩货跨了门槛又扛过中年压力，财富带来地位，也带来涨跌与押货的风险';
    }
    return '你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任';
  }
  if (flags.magnate_midlife_pressure_done) {
    if (flags.apprentice_merchant_bridge_crossed) {
      return '你是扛过合伙与账目债的巨贾：商号遍九州，供货账期与销路分成拴住了手艺人的手脚';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '你是扛过人情面子债的巨贾：商号遍九州，老主顾的期待与介绍的欠情让人脉捆住了手脚';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '你是扛过车马仓储债的巨贾：商号遍九州，运力、仓库与下属工钱让泥腿子巨贾用身体在扛';
    }
    // P98: Native magnate pressure identity
    if (flags.magnate_native_pressure_ledger_steady || flags.magnate_native_pressure_ledger) {
      return '你是扛过稳扩债的账房式巨贾：商号遍九州，守信誉比抢规模更要紧，中年压力落在周转与信义上';
    }
    if (flags.magnate_native_pressure_ledger_credit) {
      return '你是扛过赊欠债的账房式巨贾：商号遍九州，人情账比银钱账更难算，中年压力落在信誉与欠情上';
    }
    if (flags.magnate_native_pressure_caravan_market || flags.magnate_native_pressure_caravan) {
      return '你是扛过赌市债的跑货式巨贾：商号遍九州，行市一跌便喘不过气，中年压力落在涨跌与押货上';
    }
    if (flags.magnate_native_pressure_caravan_fast) {
      return '你是扛过快周转债的跑货式巨贾：商号遍九州，货路一断便卡死，中年压力落在压货与运力上';
    }
    if (flags.magnate_native_ledger_entry) {
      return '你是进入中年压力的账房式巨贾：稳扩积势跨了门槛，人情债与周转压力一并涌来';
    }
    if (flags.magnate_native_caravan_entry) {
      return '你是进入中年压力的跑货式巨贾：赌市扩货跨了门槛，行市波动与货路风险一并涌来';
    }
    return '你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任';
  }
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
    // P97: Native merchant_house magnate identity
    if (flags.magnate_native_ledger_entry) {
      if (flags.magnate_native_ledger_credit || flags.hvg_merchant_ledger_expansion_credit) {
        return '你是靠赊欠铺路做起来的账房式巨贾：守账识风险，用信誉换规模，跨过门槛后人情账比银钱账更难算清';
      }
      if (flags.magnate_native_ledger_steady || flags.hvg_merchant_ledger_expansion_steady) {
        return '你是靠稳扩积势做起来的账房式巨贾：控债务、守周转，跨过门槛后招牌比规模更金贵';
      }
      return '你是靠账房式经营做起来的巨贾：稳扩积势跨了门槛，财富带来地位，也带来赊欠与信义之债';
    }
    if (flags.magnate_native_caravan_entry) {
      if (flags.magnate_native_caravan_market || flags.hvg_merchant_caravan_expansion_market) {
        return '你是靠赌市扩货做起来的跑货式巨贾：吃波动、押行市，跨过门槛后行市的风向比账本上写得烫手';
      }
      if (flags.magnate_native_caravan_fast || flags.hvg_merchant_caravan_expansion_fast) {
        return '你是靠快周转压货做起来的跑货式巨贾：扩货路、抢规模，跨过门槛后货路一断周转便卡死';
      }
      return '你是靠跑货式经营做起来的巨贾：赌市扩货跨了门槛，财富带来地位，也带来涨跌与押货的风险';
    }
    return '你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任';
  }
  // P112: Patron endgame identity (endgame branch > late-life branch > payoff choice > entry variant)
  if (flags.merchant_patron_endgame_identity_done) {
    if (flags.merchant_patron_endgame_covenant_echo) {
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '你是盟约碑上的商武金主：手艺眼光与盟约绑在一起，账房关了，刀收了，山门还记着这笔账。商武名号比人长久，担子也还在';
      }
      return '你是盟约碑上的商武金主：账房关了，刀收了，山门还记着这笔账。商武名号比人长久，担子也还在';
    }
    if (flags.merchant_patron_endgame_solitary_echo) {
      return '你是孤商终局的巨贾：账房自己管，演武场空着，商路上的名号不靠山门。自由是真的，定论也是自己的';
    }
    if (flags.merchant_patron_endgame_legacy_echo) {
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '你是新盟传统的金主：手艺标准成了新盟规矩的一部分，商武分寸传下去了，后来人按你定的规矩运转，新盟比人长久';
      }
      return '你是新盟传统的金主：商武分寸传下去了，账房与演武场各守其份。后来人按你定的规矩运转，新盟比人长久';
    }
  }
  // P110: Patron late-life identity (late-life branch > payoff choice > entry variant)
  if (flags.merchant_patron_late_life_identity_done) {
    if (flags.merchant_patron_late_covenant_bound) {
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '你是盟约终老的商武金主：手艺眼光与盟约绑在一起，晚年山门差遣比账房还多，刨花与剑鞘仍是一条绳';
      }
      return '你是盟约终老的商武金主：硬扛了一辈子盟约，晚年山门差遣比账房还多。护镖借道一件接一件，刀与算盘都没放下，但从不退缩';
    }
    if (flags.merchant_patron_late_isolated_merchant) {
      return '你是孤商巨贾：撕破盟约后商号靠自己撑起来了。山门疏远，商路自撑，自由是真的，孤立也是真的';
    }
    if (flags.merchant_patron_late_sustainable_covenant) {
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '你是新盟掌局的金主：手艺标准成了新盟规矩的一部分，后来人请教商武分寸，账房与演武场终于不再两头拉扯';
      }
      return '你是新盟掌局的金主：重谈的盟约规矩还在运转，商号与山门各守其份。后来人请教商武分寸，账房与演武场终于不再两头拉扯';
    }
  }
  // P102/P108: Patron bridge identity (magnate tiers above retain priority)
  if (flags.merchant_patron_identity_done) {
    // P108: payoff choice marker takes priority over entry variant
    if (flags.merchant_patron_payoff_covenant_holder) {
      if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
        return '你是靠盟约定型的商武金主：手艺眼光与盟约绑在一起，名号越大担子越重，但从不退缩';
      }
      return '你是靠盟约定型的商武金主：出钱出刀都在一条绳上，名号越大，担子越重，但从不退缩';
    }
    if (flags.merchant_patron_payoff_covenant_breaker) {
      return '你是断武从商的巨贾：撕破盟约后商路靠自己，财富保住了，山门庇护没了';
    }
    if (flags.merchant_patron_payoff_balancer) {
      return '你是懂商武分寸的金主：重谈盟约后商号与山门各守其份，不再被两头拉扯';
    }
    if (flags.merchant_patron_on_ramp_orthodox) {
      return '你是商武一体的侠义金主：银钱换盟约，正道门派成了幕后靠山，名号落定之后，江湖提起你说的是出钱出刀都在一条绳上';
    }
    if (flags.merchant_patron_on_ramp_martial) {
      return '你是商武一体的武力金主：护镖与放贷拧成一条绳，名号落定之后，商路上的麻烦要按江湖规矩算';
    }
    // P103: Bridge-origin patron payoff identity (native variants above retain priority)
    if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
      return '你是商武一体的手艺金主：刨花与剑鞘绑成一条绳，名号落定之后，江湖提起你说的是手艺眼光换门派护商';
    }
    if (flags.merchant_patron_bridge_tavern_network || flags.tavern_merchant_bridge_crossed) {
      return '你是商武一体的人脉金主：酒肆消息网与护镖拧成一条绳，名号落定之后，商路上的借道比银钱更烫手';
    }
    // P104: Peasant bridge-origin patron payoff identity
    if (flags.merchant_patron_bridge_peasant_grain || flags.peasant_merchant_bridge_crossed) {
      return '你是商武一体的粮路金主：囤粮与护镖拧成一条绳，名号落定之后，江湖提起你说的是脚力血汗换门派借道';
    }
    return '你是商武一体的金主：门派对投比单纯营利更烫手，商武复合身份已成定评';
  }
  if (flags.merchant_patron_on_ramp_done) {
    if (flags.merchant_patron_on_ramp_orthodox) {
      return '你是押注侠义盟约的商武金主：银钱已换得道义靠山，商路与剑鞘绑在一起';
    }
    if (flags.merchant_patron_on_ramp_martial) {
      return '你是押注武力护商的商武金主：护镖放贷成了一体，商路上的恩怨会拖进账本';
    }
    // P103: Bridge-origin patron on-ramp identity (native variants above retain priority)
    if (flags.merchant_patron_bridge_apprentice_craft || flags.apprentice_merchant_bridge_crossed) {
      return '你是押注手艺护商的商武金主：刨花与剑鞘绑在一起，商路上的品质比规模更烫手';
    }
    if (flags.merchant_patron_bridge_tavern_network || flags.tavern_merchant_bridge_crossed) {
      return '你是押注人脉护商的商武金主：酒肆消息网与护镖拧成一条绳，商路上的借道比利润更烫手';
    }
    // P104: Peasant bridge-origin patron on-ramp identity
    if (flags.merchant_patron_bridge_peasant_grain || flags.peasant_merchant_bridge_crossed) {
      return '你是押注粮路护商的商武金主：囤粮与护镖拧成一条绳，商路上的脚力比利润更烫手';
    }
    return '你是走商武一体之路的金主：门派对投比账本上的数字更烫手';
  }
  if (flags.merchant_shop_failed && !flags.merchant_midlife_debt) {
    return '你是历经起落仍撑住门面的商路中人，财富带来选择，也带来债、人情与周转风险';
  }
  if (flags.hvg_merchant_ledger_track && flags.hvg_merchant_expansion_rhythm_done) {
    if (flags.merchant_midlife_debt_ledger_credit || flags.hvg_merchant_ledger_expansion_credit) {
      return '你是靠赊欠铺路做起来的账房式商人：守账识风险，用信誉换规模，四十岁回望，人情账比银钱账更难算清';
    }
    if (flags.merchant_midlife_debt_ledger_steady || flags.hvg_merchant_ledger_expansion_steady) {
      return '你是靠稳扩守信誉做起来的账房式商人：控债务、守周转，宁可慢一步也不砸招牌，四十岁回望，招牌比规模更金贵';
    }
    return '你是靠账房式经营做起来的商路中人：守赊欠、控库存、慢积人脉，财富带来选择，也带来周转与信义之债';
  }
  if (flags.hvg_merchant_caravan_track && flags.hvg_merchant_expansion_rhythm_done) {
    if (flags.merchant_midlife_debt_caravan_market || flags.hvg_merchant_caravan_expansion_market) {
      return '你是靠赌市扩货做起来的跑货式商人：吃波动、押行市，四十岁回望，行市的风向比账本上写得烫手';
    }
    if (flags.merchant_midlife_debt_caravan_fast || flags.hvg_merchant_caravan_expansion_fast) {
      return '你是靠快周转压货做起来的跑货式商人：扩货路、抢规模，四十岁回望，货路一断周转便卡死';
    }
    return '你是靠跑货式经营做起来的商路中人：盯行市、吃波动、快周转，财富带来选择，也带来涨跌与押货的风险';
  }
  if (flags.hvg_merchant_operating_pressure_done) {
    if (flags.hvg_merchant_ledger_track) {
      return '你是靠账房式经营立足的中年商人：扛过赊欠与断货，财富带来选择，也带来周转与信义之债';
    }
    if (flags.hvg_merchant_caravan_track) {
      return '你是靠跑货式经营立足的中年商人：扛过行市涨跌，财富带来选择，也带来押货与波动的风险';
    }
  }
  if (flags.merchant_midlife_debt) {
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
