import type { GameState } from '../types/eventTypes';

export type SampleLineId = 'orthodox' | 'demonic' | 'merchant';

export function detectSampleLine(flags: Record<string, unknown>): SampleLineId | null {
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
    // P66: payoff with cost reflection — success that came at a price
    if (flags.apprentice_merchant_bridge_crossed) {
      return '巨贾之位到手，供货销路尽在掌握，只是当年的手艺人如今要看合伙人的脸色，账目上的分成比刨子上的木纹更难拿捏';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '商号凭人脉通八方，老主顾遍布各行，只是欠的人情比挣的银子还多，每一笔生意都要掂量谁的面子、还谁的情';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '车马仓储物流根基已成，泥腿子熬出了头，只是脚下的路比田埂还长，每一步都赌过收成、押过季节，赢了但也再回不到田里了';
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
  if (flags.merchant_shop_grocery || flags.merchant_shop_weapon || flags.merchant_shop_herb) {
    return '第一桶金已得，店铺经营中';
  }
  if (flags.merchant_talent || flags.merchant_childhood_seed_done) {
    return '营商天赋已显，尚未开张';
  }
  return age >= 16 ? '以小本经营积累财富与人脉' : '观察买卖，等待开张时机';
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
    return '商路债务';
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
  return merchantCurrentGoal(flags, age);
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
  // P63 + P66: Entry differentiation with cost weight at magnate_on_ramp+
  if (flags.magnate_on_ramp_done) {
    if (flags.apprentice_merchant_bridge_crossed) {
      return '你是从学徒走来的巨贾：手艺为基，合伙为径，商路是技能延伸的版图，代价是再也回不到只管刨花的日子';
    }
    if (flags.tavern_merchant_bridge_crossed) {
      return '你是从酒肆走来的巨贾：人脉为基，引荐为径，商路是人情往来的延伸，代价是人人都认得你、人人都有求于你';
    }
    if (flags.peasant_merchant_bridge_crossed) {
      return '你是从农家走来的巨贾：力气为基，跑商为径，商路是勤劳致富的通道，代价是脚下的路比田埂还长，再也回不到守着一亩三分地的安稳';
    }
    return '你是富甲一方却身不由己的巨贾，财富带来地位，也带来数不清的人情与责任';
  }
  if (flags.merchant_shop_failed || flags.merchant_midlife_debt) {
    return '你是历经起落仍撑住门面的商路中人，财富带来选择，也带来债、人情与周转风险';
  }
  return '你是靠经营立足的商路中人，财富带来选择，也带来人情与周转压力';
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
  return undefined;
}

export function isPlayerVisibleSampleLineText(text: string): boolean {
  return !/(^route_|_done$|eventId|flags\.)/.test(text);
}
