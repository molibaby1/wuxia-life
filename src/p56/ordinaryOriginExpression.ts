import type { GameState } from '../types/eventTypes';

export type OrdinaryOriginId = 'farm_peasant' | 'town_apprentice' | 'tavern_hand';

export function detectOrdinaryOrigin(flags: Record<string, unknown>): OrdinaryOriginId | null {
  if (flags.origin_farm_peasant) {
    return 'farm_peasant';
  }
  if (flags.origin_town_apprentice) {
    return 'town_apprentice';
  }
  if (flags.origin_tavern_hand) {
    return 'tavern_hand';
  }
  return null;
}

function peasantCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.peasant_midlife_steadfast_accrual) {
    return '田地已稳，日子虽苦却有了根基';
  }
  if (flags.peasant_midlife_outside_offer) {
    return '外面的机会在招手，村里还是镇上？';
  }
  if (flags.peasant_steadfast_field) {
    return age >= 20 ? '守着田地，一年盼一年' : '在田里干活，盼着收成好';
  }
  if (flags.peasant_swap_crew_curiosity) {
    return age >= 20 ? '跟过换工队，想出去看看' : '跟着换工队，见过些世面';
  }
  return '在村里长大，日子平淡但安稳';
}

function apprenticeCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.apprentice_merchant_bridge_crossed) {
    return '合伙经商已有起色，商路渐通';
  }
  if (flags.apprentice_midlife_craft_mastery) {
    return '手艺出师，可以自立门户了';
  }
  if (flags.apprentice_midlife_trade_network) {
    return '认识些买卖人，有机会合伙经商';
  }
  if (flags.apprentice_craft_committed) {
    return age >= 20 ? '专精木工，手艺渐成' : '学木工手艺，师傅说有天赋';
  }
  if (flags.apprentice_trade_curiosity) {
    return age >= 20 ? '跑外市见世面，想做买卖' : '跟着跑外市，认得些人';
  }
  return '在铺子里学手艺，日子充实但辛苦';
}

function tavernCurrentGoal(flags: Record<string, unknown>, age: number): string {
  if (flags.tavern_merchant_bridge_crossed) {
    return '城里铺子已上手，酒肆人脉铺出了商路';
  }
  if (flags.tavern_midlife_guest_regulars) {
    return '常客认得你了，镇上有了些人脉';
  }
  if (flags.tavern_midlife_ally_referral) {
    return '有人引荐你去城里的铺子';
  }
  if (flags.tavern_guest_network) {
    return age >= 20 ? '记客人认脸，积累人脉' : '帮账房记流水，认得些客人';
  }
  if (flags.tavern_service_committed) {
    return age >= 20 ? '跑堂规矩已熟，酒肆里的活都拿手' : '学跑堂规矩，手脚利索';
  }
  if (flags.ally_network) {
    return '有几位熟客成了朋友';
  }
  return '在酒肆帮忙，日子忙碌但热闹';
}

export function deriveOrdinaryOriginCurrentGoal(state: GameState): string | undefined {
  const flags = state.flags ?? {};
  const age = state.player?.age ?? 0;
  const origin = detectOrdinaryOrigin(flags);
  if (!origin) {
    return undefined;
  }
  if (origin === 'farm_peasant') {
    return peasantCurrentGoal(flags, age);
  }
  if (origin === 'town_apprentice') {
    return apprenticeCurrentGoal(flags, age);
  }
  return tavernCurrentGoal(flags, age);
}

function peasantLifeMemory(flags: Record<string, unknown>): string | undefined {
  if (flags.peasant_midlife_steadfast_accrual) {
    return '你靠年复一年的耕种攒下几亩薄田，日子虽苦却有了根基。';
  }
  if (flags.peasant_midlife_outside_offer) {
    if (flags.peasant_accept_outside) {
      return '你决定去镇上试试，离开生活了三十年的村子。';
    }
    if (flags.peasant_refuse_outside) {
      return '你婉拒了外出的机会，选择留在熟悉的田地边。';
    }
    return '走南闯北的商人路过村子，说镇上缺人手。';
  }
  if (flags.peasant_steadfast_field) {
    return '你守着家田，日复一日地耕种。';
  }
  if (flags.peasant_swap_crew_curiosity) {
    return '你跟过换工队出远门，见过些世面。';
  }
  return undefined;
}

function apprenticeLifeMemory(flags: Record<string, unknown>): string | undefined {
  if (flags.apprentice_merchant_bridge_crossed) {
    return '你与买卖人合伙经商，从学徒踏上了商路。';
  }
  if (flags.apprentice_midlife_craft_mastery) {
    if (flags.apprentice_open_shop) {
      return '你自立门户开了自己的铺子，镇上人都知道你的手艺。';
    }
    if (flags.apprentice_stay_master) {
      return '你留在师傅身边，继续精进手艺。';
    }
    return '你的手艺得到认可，师傅说出师了。';
  }
  if (flags.apprentice_midlife_trade_network) {
    if (flags.apprentice_join_partnership) {
      return '你和认识的买卖人合伙做了小本生意。';
    }
    if (flags.apprentice_decline_partnership) {
      return '你婉拒了合伙的提议，继续专注手艺。';
    }
    return '跑外市让你认识了不少买卖人。';
  }
  if (flags.apprentice_craft_committed) {
    return '你专精木工手艺，师傅说你有天赋。';
  }
  if (flags.apprentice_trade_curiosity) {
    return '你跟着跑外市，学些买卖门道。';
  }
  return undefined;
}

function tavernLifeMemory(flags: Record<string, unknown>): string | undefined {
  if (flags.tavern_merchant_bridge_crossed) {
    return '你靠着酒肆积累的人脉进了城里的铺子，从跑堂伙计踏上了商路。';
  }
  if (flags.tavern_midlife_guest_regulars) {
    if (flags.tavern_embrace_network) {
      return '你经营人脉，常客成了朋友，镇上有了些门路。';
    }
    if (flags.tavern_keep_distance) {
      return '你和常客保持距离，不愿太深入江湖事。';
    }
    return '常来的客人认得你了，有人请你帮忙传话带信。';
  }
  if (flags.tavern_midlife_ally_referral) {
    if (flags.tavern_take_referral) {
      return '你接受了引荐，去城里的铺子试试。';
    }
    if (flags.tavern_decline_referral) {
      return '你婉拒了引荐，选择留在酒肆。';
    }
    return '你帮忙照顾过的客人说城里铺子缺人。';
  }
  if (flags.tavern_guest_network) {
    return '你帮账房记流水，认得了不少江湖客人。';
  }
  if (flags.tavern_service_committed) {
    return '你专心学跑堂规矩，手脚麻利。';
  }
  if (flags.ally_network) {
    return '有几位熟客成了朋友。';
  }
  return undefined;
}

export function deriveOrdinaryOriginLifeMemory(flags: Record<string, unknown>): string | undefined {
  const origin = detectOrdinaryOrigin(flags);
  if (!origin) {
    return undefined;
  }
  if (origin === 'farm_peasant') {
    return peasantLifeMemory(flags);
  }
  if (origin === 'town_apprentice') {
    return apprenticeLifeMemory(flags);
  }
  return tavernLifeMemory(flags);
}

export function deriveOrdinaryOriginSummary(flags: Record<string, unknown>): string | undefined {
  const origin = detectOrdinaryOrigin(flags);
  if (!origin) {
    return undefined;
  }
  if (origin === 'farm_peasant') {
    if (flags.peasant_midlife_steadfast_accrual || flags.peasant_midlife_outside_offer) {
      return '平凡农人的中年：在田地与机会之间，守住或换路。';
    }
    return '平凡农人：在村里长大，日子平淡但安稳。';
  }
  if (origin === 'town_apprentice') {
    if (flags.apprentice_merchant_bridge_crossed) {
      return '学徒出身的商人：从铺子学徒到商路合伙，跨越了手艺与买卖的界限。';
    }
    if (flags.apprentice_midlife_craft_mastery || flags.apprentice_midlife_trade_network) {
      return '平凡学徒的中年：手艺与买卖之间，自立或合伙。';
    }
    return '平凡学徒：在铺子里学手艺，日子充实但辛苦。';
  }
  if (origin === 'tavern_hand') {
    if (flags.tavern_merchant_bridge_crossed) {
      return '酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。';
    }
    if (flags.tavern_midlife_guest_regulars || flags.tavern_midlife_ally_referral) {
      return '平凡酒肆帮工的中年：人脉与引荐之间，经营或留守。';
    }
    return '平凡酒肆帮工：在酒肆帮忙，日子忙碌但热闹';
  }
}

export function isPlayerVisibleOrdinaryOriginText(text: string): boolean {
  return !/(^origin_|_done$|eventId|flags\.)/.test(text);
}
