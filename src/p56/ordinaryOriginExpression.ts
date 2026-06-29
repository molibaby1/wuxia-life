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
  if (flags.peasant_merchant_bridge_crossed) {
    return '跟着粮商走南闯北，粮路渐宽';
  }
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
    return '在江湖上有了名号，常有人来请你主持公道';
  }
  if (flags.tavern_renown_bridge_crossed) {
    return '江湖上渐渐有了名声，常有人来寻你引荐';
  }
  if (flags.tavern_medical_bridge_crossed) {
    if (flags.tavern_embrace_compassionate_healer) {
      return '酒肆后面辟出小药庐，有钱没钱都给看';
    }
    if (flags.tavern_embrace_pragmatic_healer) {
      return '酒肆后面辟出小药庐，看病也讲人情世故';
    }
    return '渐渐有人寻你看病，酒肆后面辟出了一间小药庐';
  }
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
  if (flags.peasant_merchant_bridge_crossed) {
    return '你从田间走到粮路上，从帮工做起，渐渐摸通了粮货买卖。';
  }
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
  if (flags.renown_endgame_done) {
    if (flags.tavern_renown_endgame_sigh) {
      return '你坐在酒肆角落里，听着年轻人讲「那个老掌柜」的故事。老客人叹口气说：「那人啊，是个好人……」名声比人长久——你守了一辈子的名声，最后真的传下去了，只是代价，也真的没人记得了。';
    }
    if (flags.tavern_renown_endgame_distant) {
      return '你在酒肆里喝酒，听邻桌讲「逍遥翁」的传说。说得有鼻子有眼，真假难辨。在座没人认出你。你笑了笑——自己都快忘了当年的样子了。江湖上的你，和真实的你，早就两回事了。';
    }
    if (flags.tavern_renown_endgame_legacy) {
      return '你看着酒肆里的年轻人聊「老掌柜的规矩」。该帮的帮，该推的推，有来有往才长久。你的话还在被人提起。传承不是名字传下去，是智慧传下去了。看着后辈们传下去，这就够了。';
    }
  }
  if (flags.renown_late_life_done) {
    if (flags.tavern_renown_late_burnout) {
      return '身体越来越差了。可只要还有人找上门，你还是硬撑着答应。老客人们见了你，都叹口气——"这老好人，还是改不了。"夜深人静时，你摸着酸疼的骨头，想起小时候在酒肆跑堂的日子——那时候累是累，可身子骨硬朗啊。算盘珠子拨了一辈子人情账，最后算到了自己头上。';
    }
    if (flags.tavern_renown_late_lone_wolf) {
      return '你常常一个人去酒肆，点一壶酒，坐一下午。老客人们有的还打招呼，有的绕着走。你不在乎——这辈子撕破了那么多假人情，剩下的才是真的。一个人喝酒怎么了？自在。算盘珠子不算人情账了，算自己的逍遥账——赚了。';
    }
    if (flags.tavern_renown_late_mentor) {
      return '酒肆里常来年轻人，向你请教江湖上的人情世故。你像当年老掌柜教你一样，慢慢点拨他们——该帮的帮，该推的推，有来有往才长久。看着他们从青涩到练达，你觉得这辈子没白活。算盘珠子算的不是人情债，是传承账——赚大了。';
    }
  }
  if (flags.renown_midlife_payoff_done) {
    if (flags.tavern_renown_payoff_hard_holder) {
      return '你把所有人情债都扛了下来。受过你恩惠的人念你的好，你自己却常在夜深人静时叹气——名声是撑住了，人也累垮了。酒肆的老掌柜若还在，大概会说你傻吧。';
    }
    if (flags.tavern_renown_payoff_breaker) {
      return '你撕破了脸，断了那些不该还的假人情。有人骂你忘恩负义，也有人说你活得通透。你不在乎——酒肆里三教九流见多了，真真假假，你分得清。';
    }
    if (flags.tavern_renown_payoff_balancer) {
      return '你拿捏住了人情往来的分寸。该帮的帮，该推的推，有来有往，不欠人情也不结仇。酒肆掌柜的智慧，全被你用在了江湖上。人们说你人情练达，你只是笑笑。';
    }
  }
  if (flags.renown_midlife_pressure_done) {
    return '这些年欠的人情、攒的面子，如今都成了要还的债。有人登门道谢，有人上门讨债，酒肆的门槛都快被踩平了。你才明白——江湖名声，从来不是白来的。';
  }
  if (flags.renown_on_ramp_done) {
    return '你第一次以江湖人的身份主持了公道，两拨人都服你的气。从那天起，你的名字在江湖上有了分量——不是因为武功，是因为人脉和面子。';
  }
  if (flags.tavern_renown_bridge_crossed) {
    return '你凭着酒肆里攒下的人脉和名声，渐渐在江湖上有了名号。人们不是来找你喝酒，是来寻你引荐、求你主事。';
  }
  if (flags.tavern_medical_bridge_crossed) {
    if (flags.tavern_embrace_compassionate_healer) {
      return '你在酒肆里耳濡目染，竟自学成了一手医术。起初只是帮熟客看看小病，后来名声渐渐传开，镇上人都称你一声小神医。你见不得人受苦，有钱没钱都给看——酒肆后面的柴房改成了小药庐，看病的人比喝酒的还多。';
    }
    if (flags.tavern_embrace_pragmatic_healer) {
      return '跑堂的出身，没想到竟走上了行医的路。这些年在酒肆里见过的人、听过的方子、偷偷翻过的医书，竟都攒成了本事。你看病收钱，也看人下菜碟——镇上的大户人家都捧你，穷人家也说你公道。名声和日子都渐渐好了起来。';
    }
    return '你凭着自学的医术，在镇上有了些神医的名头。酒肆后面辟出了一间小药庐，来找你看病的人络绎不绝。';
  }
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
    if (flags.peasant_merchant_bridge_crossed) {
      return '农家出身的粮货商人：从田埂到粮路，靠体力和勤恳踏出生意路。';
    }
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
    if (flags.renown_endgame_done) {
      if (flags.tavern_renown_endgame_sigh) {
        return '酒肆出身的江湖名宿：硬扛了一辈子人情债，名声比人长久。最后坐在酒肆角落里，听着自己成了传说——身后名·叹，名声比人长久。';
      }
      if (flags.tavern_renown_endgame_distant) {
        return '酒肆出身的江湖独行：撕破了假人情，换来了逍遥自在。江湖上的传说真假参半，没人认出角落里的你——身后名·遥，传说比人逍遥。';
      }
      if (flags.tavern_renown_endgame_legacy) {
        return '酒肆出身的江湖名宿：人情练达了一辈子，也传了一辈子。老掌柜的规矩还在被人提起，后辈们照着你的路走下去——身后名·传，智慧比人长久。';
      }
    }
    if (flags.renown_late_life_done) {
      if (flags.tavern_renown_late_burnout) {
        return '酒肆出身的江湖名宿：硬扛了一辈子人情债，名声响遍江湖，最后油尽灯枯。有人念你的好，有人叹你的傻。';
      }
      if (flags.tavern_renown_late_lone_wolf) {
        return '酒肆出身的江湖独行：撕破了假人情，断了所有牵绊，换来一身自由。有人说你绝情，你只觉得可笑——真真假假，你早就分得清。';
      }
      if (flags.tavern_renown_late_mentor) {
        return '酒肆出身的江湖名宿：人情练达了一辈子，拿捏得住分寸，分得清真假。晚年成了人人敬重的老前辈，把这一辈子的智慧都传了下去。酒肆掌柜的智慧，后继有人。';
      }
    }
    if (flags.renown_midlife_payoff_done) {
      if (flags.tavern_renown_payoff_hard_holder) {
        return '酒肆出身的江湖名宿：靠人脉与面子闯出了名号，人情债全自己扛，名声越响，担子越重。';
      }
      if (flags.tavern_renown_payoff_breaker) {
        return '酒肆出身的江湖独行：曾靠人脉与面子闯出名号，后来撕破脸断了假人情，反倒活得通透快意。';
      }
      if (flags.tavern_renown_payoff_balancer) {
        return '酒肆出身的江湖名宿：靠人脉与面子闯出了名号，更懂人情往来的分寸，人情练达，游刃有余。';
      }
    }
    if (flags.renown_midlife_pressure_done) {
      return '酒肆出身的江湖名宿：靠人脉与面子闯出了名号，只是名声越大，欠下的人情债也越重。';
    }
    if (flags.renown_on_ramp_done) {
      return '酒肆出身的江湖名宿：凭人脉与面子在江湖上有了名号，主持公道、引荐高人。';
    }
    if (flags.tavern_renown_bridge_crossed) {
      return '酒肆出身的江湖人物：靠人脉和名声在江湖上立足。';
    }
    if (flags.tavern_medical_bridge_crossed) {
      if (flags.tavern_embrace_compassionate_healer) {
        return '酒肆出身的仁心医者：靠自学在镇上行医，有钱没钱都给看，小药庐里挤满了求医的人。';
      }
      if (flags.tavern_embrace_pragmatic_healer) {
        return '酒肆出身的世故人医：靠眼力在镇上行医，看病也讲分寸，名声银子都挣到了手。';
      }
      return '酒肆出身的医者：靠自学和经验在镇上行医，渐渐有了神医的名头。';
    }
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
