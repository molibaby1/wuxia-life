import type { GameState } from '../types/eventTypes';

export type SampleLineId = 'orthodox' | 'demonic' | 'merchant';

export function detectSampleLine(flags: Record<string, unknown>): SampleLineId | null {
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
  if (flags.orthodox_age40_identity_done) {
    return '回望正道身份，守正之路已刻进一生';
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
  if (flags.merchant_age40_identity_done) {
    return '财富带来选择，也带来债';
  }
  if (flags.merchant_midlife_debt || flags.merchant_shop_failed) {
    return '周转吃紧，人情债未清';
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
  const line = detectSampleLine(state.flags ?? {});
  if (line === 'orthodox') {
    return '守正代价';
  }
  if (line === 'demonic') {
    return '邪路代价';
  }
  if (line === 'merchant') {
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
  if (flags.merchant_shop_failed || flags.merchant_midlife_debt) {
    return '你是历经起落仍撑住门面的商路中人，财富带来选择，也带来债与风险';
  }
  return '你是靠经营立足的商路中人，财富带来选择，也带来人情与周转压力';
}

export function deriveSampleLineAge40Identity(state: GameState): string | undefined {
  const flags = state.flags ?? {};
  const age = state.player?.age ?? 0;
  if (age < 38) {
    return undefined;
  }
  if (flags.merchant_age40_identity_done) {
    return merchantAge40Identity(flags);
  }
  if (flags.orthodox_age40_identity_done) {
    return orthodoxAge40Identity(flags);
  }
  if (flags.demonic_age40_identity_done) {
    return demonicAge40Identity(flags);
  }
  const line = detectSampleLine(flags);
  if (line === 'orthodox') {
    return orthodoxAge40Identity(flags);
  }
  if (line === 'demonic') {
    return demonicAge40Identity(flags);
  }
  if (line === 'merchant') {
    return merchantAge40Identity(flags);
  }
  return undefined;
}

export function isPlayerVisibleSampleLineText(text: string): boolean {
  return !/(^route_|_done$|eventId|flags\.)/.test(text);
}
