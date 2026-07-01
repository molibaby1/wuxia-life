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
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_ember) {
      return '仁薪尽传，此生无憾';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_peace) {
      return '晒晒太阳看看病，从容了此一生';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_legacy) {
      return '看着仁心一辈辈传下去，这就够了';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_fame_remain) {
      return '权势如烟云，医名自长久';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_wanderer_legend) {
      return '传说真假谁在乎，自在就好';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_grand_master) {
      return '看着这一世医名，守着这一份圆满';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_final) {
      return '多救一个是一个，撑到最后一刻';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_peaceful) {
      return '晒晒太阳看看病，过好剩下的日子';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_legacy) {
      return '看着徒弟们成长，仁心传下去就够了';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_fallen) {
      return '看淡世态炎凉，过好自己的日子';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_wanderer) {
      return '走到哪儿算哪儿，自在就好';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_master) {
      return '看着这一世繁华，守着这一份体面';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_holder) {
      return '趁着还能动，能多救一个是一个，药庐的灯夜夜亮着';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_let_go) {
      return '每日十诊，量力而行，救人先救己';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_legacy) {
      return '收个徒弟，把医术和仁心一起传下去';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_holder) {
      return '维持各方人情，在权贵圈里站稳脚跟';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_breaker) {
      return '断了权贵的人情，只给看得起的人看病';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_master) {
      return '拿捏人情往来的分寸，游刃有余地行走在权贵之间';
    }
    if (flags.medical_midlife_pressure_done && flags.tavern_medical_pressure_compassionate) {
      return '一面撑着身子给人看病，一面看着自己的仁心一点点耗尽';
    }
    if (flags.medical_midlife_pressure_done && flags.tavern_medical_pressure_pragmatic) {
      return '一面维持名声场面，一面应付越来越多的人情债';
    }
    if (flags.tavern_medical_on_ramp_compassionate) {
      return '周边村子的人都慕名而来，小药庐挤不下，大堂都摆上了病床';
    }
    if (flags.tavern_medical_on_ramp_pragmatic) {
      return '镇上大户都来请你，诊金丰厚，还认识了不少有头有脸的人物';
    }
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
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_ember) {
      return '某个冬日，你坐在药庐门口晒太阳，越来越觉得累。恍惚间，你想起小时候在酒肆帮着熬药的日子，老掌柜摸着你的头说「这孩子心善」。这些年，你救过多少人？数不清了。你不知道的是，你救过的那些人，有的成了好大夫，有的一辈子记着你的恩情。仁心像火种——你这盏灯快灭了，但别处的灯，还亮着。老掌柜若还在，大概会摸着你的头说：「傻孩子，值了。」';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_peace) {
      return '你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样。偶尔还有老病人找上门来，你随手就给看了——不收钱，就当聊聊天。有人说「李大夫你真好」，你只笑笑——好什么呀，就是顺手的事。年轻时候总觉得「我不救谁救」，硬扛了半辈子，现在想通了。老掌柜若还在，大概会拍你肩膀说：「臭小子，终于想通了？」你也笑——是啊，早该这样了。';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_legacy) {
      return '逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子。大徒弟在江南开了药庐，二徒弟在塞外救牧民，三徒弟进宫做了太医……个个都像你。你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血。有人说「老恩师您是一代宗师」，你只摆摆手——「什么宗师不宗师的，救人而已」。老掌柜若还在，大概会捋着胡子笑——当年酒肆里熬药的苦孩子，现在桃李满天下了。';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_fame_remain) {
      return '门前冷落鞍马稀。以前送礼的人能排半条街，现在连个问安的都没有。你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗。只是有时候，你会翻翻自己写的医书，勾勾改改——这些东西，传下去就好。你不知道的是，太医院里的年轻太医还在看你的书，江湖上的游医还在用你的方。权势如烟云，说散就散了。但医名不一样——它比权势长久。';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_wanderer_legend) {
      return '你还在路上。背着药箱，拄着拐杖，从一个村子走到另一个镇子。有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚。你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了。只是偶尔经过某个酒肆，会停下来喝一碗——听听这些年，江湖上把你传成了什么样。有人说你能活死人肉白骨，有人说你脾气古怪看人下菜碟，有人说你早就死在塞外了……你听着直乐。';
    }
    if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_grand_master) {
      return '家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们。你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清。太医院请你做院判你不去，江湖门派请你做供奉你也不去——就守着你的药庐，看着后辈们成长。有人说「李老先生您是一代宗师」，你只摆摆手——「什么宗师，就是个看病的」。老掌柜若还在，大概会捋着胡子得意——「我就说这小子是块料子！」';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_final) {
      return '手抖得越来越厉害了，有时候连针都抓不住。可只要门外有病人的声音，你还是撑着要起来。徒弟们哭着劝你歇着，你只摇摇头——"能多救一个是一个。"夜深人静时，你闻着空气里淡淡的药味，想起小时候在酒肆帮着熬药的日子，也是这样的味道。那时候苦，可现在，你觉得值。';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_peaceful) {
      return '你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样。街坊邻居有个头疼脑热的来找你，你随手就给看了——不收钱，就当聊聊天。徒弟们都长大了，各自开了药庐，你乐得清闲。有时候想起年轻时候硬扛的那些日子，你摇摇头——那时候真傻，可也真热血。';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_legacy) {
      return '逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子。你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血。老掌柜若还在，大概会笑着说"这酒肆里熬出来的药香，飘到全天下了。"你想想也是——从酒肆里的苦孩子，到满天下的仁医，这辈子，值了。';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_fallen) {
      return '门前冷落鞍马稀。以前送礼的人能排半条街，现在连个问安的都没有。你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗。只是有时候深夜醒来，想起当年在酒肆里端盘子的日子——那时候穷，可睡得踏实。';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_wanderer) {
      return '你还在路上。背着药箱，拄着拐杖，从一个村子走到另一个镇子。有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚。你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了。只是偶尔经过某个酒肆，会停下来喝一碗——还是当年的味道吗？';
    }
    if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_master) {
      return '家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们。你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清。有时候想起当年在酒肆里跟老掌柜学看人学说话的日子，忍不住笑——那时候哪能想到，酒肆里学的那点东西，能用一辈子呢？老掌柜要是知道你现在这样子，大概会得意得胡子都翘起来吧。';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_holder) {
      return '药庐的灯夜夜亮着，你的身子一天不如一天。老掌柜劝你歇，你摆摆手说「救人要紧」。只要还有力气坐起来，就不会拒病人于门外。仁心这东西，是真的能把人耗干的。';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_let_go) {
      return '你在药庐门口贴了「每日十诊」的告示。有人骂你忘了初心，也有人说你早该如此。老掌柜拍了拍你的肩膀，说「你终于想通了」。救人先救己——你笑着，眼里有了光。';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_legacy) {
      return '你收了酒肆后厨帮工的孩子做徒弟。那孩子从小看着你看病长大，眼里有光。你教他认药、诊脉、熬药，就像当年老掌柜教你一样。他第一次独立坐诊那天，你站在药庐门口，心里说不出的踏实。';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_holder) {
      return '张员外、李知府、总督府、将军衙……认识的人越来越多，身份越来越高。你的诊金是当初的十倍，出入的都是深宅大院。只是有时候深夜回家，看着手里的金元宝，你会想起酒肆里那个给穷人免费看病的自己。';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_breaker) {
      return '你把权贵人家的请帖全退了。有人说你自毁前程，有人说你有骨气。老掌柜给你烫了壶酒，说「好样的，我就知道你不是那种人」。你喝了一口，辣得直咧嘴，但心里敞亮——终于不用看别人脸色了。';
    }
    if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_master) {
      return '该去的去，该推的推。张员外的人情用一张药方还了，李知府的面子用一次夜诊给了。没人说你架子大，也没人敢把你当自己人。老掌柜说你「学到家了」——酒肆掌柜的那套八面玲珑，你全用在行医上了。';
    }
    if (flags.medical_midlife_pressure_done && flags.tavern_medical_pressure_compassionate) {
      return '这些年，你治病救人，从不问贫富。周边村子的人都慕名而来，酒肆大堂摆上了病床，小药庐的药罐从早煎到晚。老掌柜劝你歇一歇，你总说「救人要紧」。可你自己的身子，你比谁都清楚——夜里常常咳醒，手也开始发颤。你坐在药庐门口，望着天边的鱼肚白，忽然想起小时候帮老掌柜晒草药的日子。那时候你以为，救人是天底下最体面的事。如今你才明白——仁心这东西，也是会耗尽的。';
    }
    if (flags.medical_midlife_pressure_done && flags.tavern_medical_pressure_pragmatic) {
      return '这些年，你在镇上的名气越来越响。大户人家请你看病，诊金丰厚；寻常百姓找你问诊，也得看你的脸色。你懂分寸、会办事——该收的收，该推的推，该欠的人情也欠着。可这天夜里，你坐在酒肆后院的小药庐里，翻着这些年记下的人情账，忽然觉得累。张老爷的姨娘、李掌柜的独子、县衙的师爷……人情这东西，欠的时候容易，还的时候才知道是一笔还不清的债。你以为自己拿捏得住分寸，到头来，还是被这张人情的网，缠得死死的。';
    }
    if (flags.tavern_medical_on_ramp_compassionate) {
      return '你在酒肆后面的小药庐行医，有钱没钱都给看。名声传开了，周边村子的人都慕名而来，小药庐挤不下，连酒肆大堂都摆上了病床。老掌柜叹口气，没说什么——他知道你这脾气。镇上人都说，你是真的仁心。可只有你自己知道，这样下去，身子撑不了多久。';
    }
    if (flags.tavern_medical_on_ramp_pragmatic) {
      return '你在酒肆后面的小药庐行医，看病收钱，也看人下菜碟。镇上大户人家的老爷被你治好后，厚赏了你，还把你引荐给了其他有头有脸的人物。名声传开了，找你看病的人越来越多。你懂分寸、会办事——该收的收，该推的推，这才是长久之道。';
    }
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
      if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_ember) {
        return '酒肆出身的仁心名医：燃尽自己，点亮了无数盏灯。仁心像火种，你这盏灯快灭了，但别处的灯，还亮着。从酒肆里的苦孩子到燃尽自己的点灯人，这辈子，值了。';
      }
      if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_peace) {
        return '酒肆出身的仁心名医：硬扛了半辈子，终于想通了。晚年从容淡然，晒晒太阳看看病，像回到了酒肆的日子。老掌柜若还在，大概会笑着说你终于想通了。';
      }
      if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_compassionate_legacy) {
        return '酒肆出身的仁心名医：一辈子救人，也一辈子教人。徒弟们散在各地，仁心传了一辈又一辈。从酒肆里的苦孩子到桃李满天下的仁医宗师，这辈子，值了。';
      }
      if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_fame_remain) {
        return '酒肆出身的世故名医：从跑堂爬到御医，风光了半辈子，也摔了下来。人走茶凉，世态炎凉，你都见过了。可权势如烟云，医名自长久——你写的药方，还在传着。';
      }
      if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_wanderer_legend) {
        return '酒肆出身的世故名医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖，逍遥自在。从酒肆里听江湖故事，到自己成了江湖传说。有人说你漂泊可怜，你只笑——可怜？这叫自在。';
      }
      if (flags.medical_endgame_echo_done && flags.tavern_medical_endgame_pragmatic_grand_master) {
        return '酒肆出身的世故名医：一辈子人情练达，拿捏得住分寸，分得清真假。从酒肆里跟老掌柜学说话，到成为人人敬重的一代宗师，这一辈子，走得稳，走得顺。老掌柜若还在，大概会得意得很——我就说这小子是块料子！';
      }
      if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_final) {
        return '酒肆出身的仁心名医：硬扛了一辈子，燃尽了自己，照亮了无数人。身体垮了，可仁心还在。老掌柜若还在，大概会哭着说你傻。可你知道——这就是医者的命。';
      }
      if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_peaceful) {
        return '酒肆出身的仁心名医：硬扛了半辈子，终于学会了放下。晚年过得从容自在，晒晒太阳看看病，像回到了酒肆的日子。老掌柜若还在，大概会笑着说你终于想通了。';
      }
      if (flags.medical_late_life_done && flags.tavern_medical_late_compassionate_legacy) {
        return '酒肆出身的仁心名医：一辈子救人，也一辈子教人。徒弟们散在各地，仁心传了一辈又一辈。从酒肆里的苦孩子到桃李满天下的老宗师，这辈子，值了。';
      }
      if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_fallen) {
        return '酒肆出身的世故名医：从跑堂爬到御医，风光了半辈子，也摔了下来。人走茶凉，世态炎凉，你都见过了。有人说你可怜，你只冷笑——可怜？你见过的世面，这些人一辈子都见不到。';
      }
      if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_wanderer) {
        return '酒肆出身的世故名医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖，逍遥自在。从酒肆里听江湖故事，到自己成了江湖故事。有人说你漂泊可怜，你只笑——可怜？这叫自在。';
      }
      if (flags.medical_late_life_done && flags.tavern_medical_late_pragmatic_master) {
        return '酒肆出身的世故名医：一辈子人情练达，拿捏得住分寸，分得清真假。从酒肆里跟老掌柜学说话，到成为人人敬重的老名医，这一辈子，走得稳，走得顺。老掌柜若还在，大概会得意得很——我就说这小子是块料子！';
      }
      if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_holder) {
        return '酒肆出身的仁心名医：靠仁心济世闯出了名号，只是身子也熬垮了——油尽灯枯，仁心不灭。';
      }
      if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_let_go) {
        return '酒肆出身的仁心名医：曾以为自己能救所有人，直到身体垮了才学会放手——量力而行，释然通透。';
      }
      if (flags.medical_payoff_done && flags.tavern_medical_payoff_compassionate_legacy) {
        return '酒肆出身的仁心名医：身体垮了，但仁心没断，收了徒弟把医术传下去——薪火相传，仁心延续。';
      }
      if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_holder) {
        return '酒肆出身的世故名医：靠医术和分寸在权贵间游走，名声银子都有了，只是人情网越织越密——声名赫赫，身不由己。';
      }
      if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_breaker) {
        return '酒肆出身的世故名医：曾在权贵圈里风生水起，后来撕破脸断了人情，反倒活得自在——快意江湖，不伺候了。';
      }
      if (flags.medical_payoff_done && flags.tavern_medical_payoff_pragmatic_master) {
        return '酒肆出身的世故名医：深谙人情世故，拿捏得恰到好处，权贵都想结交，谁也绑不住你——人情练达，游刃有余。';
      }
      if (flags.medical_midlife_pressure_done && flags.tavern_medical_pressure_compassionate) {
        return '酒肆出身的仁心医者：名声传遍周边，只是仁心耗尽、身子渐垮，仍硬撑着救人。';
      }
      if (flags.medical_midlife_pressure_done && flags.tavern_medical_pressure_pragmatic) {
        return '酒肆出身的世故人医：镇上大户都捧着你，只是人情债越积越多，被缠得脱不开身。';
      }
      if (flags.tavern_medical_on_ramp_compassionate) {
        return '酒肆出身的仁心医者：名声传开，周边村子的人都慕名而来，累是累，但救人要紧。';
      }
      if (flags.tavern_medical_on_ramp_pragmatic) {
        return '酒肆出身的世故人医：镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏。';
      }
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
