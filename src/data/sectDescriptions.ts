/**
 * 门派描述系统
 * 
 * 为每个门派提供独立的描述模块，
 * 包含历史背景、核心教义、行为准则等特色内容。
 * 
 * 设计原则：
 * - 避免简单的"正邪"二元对立
 * - 展现每个门派的合理性和复杂性
 * - 区分"外界评价"和"内部视角"
 * 
 * @version 1.0
 * @since 2026-03-17
 */

import type { FactionType } from '../types/eventTypes';

export interface SectDescription {
  id: string;
  name: string;
  shortName: string;
  
  /** 所属阵营 */
  faction: FactionType;
  
  /** 创立时间（游戏内虚构） */
  founded: string;
  
  /** 门派所在地 */
  location: string;
  
  /** 核心教义 */
  doctrine: string;
  
  /** 行为准则 */
  conduct: string;
  
  /** 外界评价（通常是负面的） */
  externalView: string;
  
  /** 内部视角（自我认知） */
  internalView: string;
  
  /** 门派历史 */
  history: string;
  
  /** 与朝廷的关系 */
  courtRelation: 'aligned' | 'opposed' | 'neutral';
  
  /** 特色武学 */
  specialSkills: string[];
  
  /** 门派关系：-100(死敌) 到 100(盟友) */
  relations?: Record<string, number>;
  
  /** 是否可自由加入 */
  recruitOpen?: boolean;
  
  /** 收徒要求 */
  recruitmentRequirements?: {
    minChivalry?: number;
    maxChivalry?: number;
    minMartialPower?: number;
    minInternalSkill?: number;
  };
}

export const sectDescriptions: Record<string, SectDescription> = {
  // ========== 传统门派（orthodox）==========
  shaolin: {
    id: 'shaolin',
    name: '少林寺',
    shortName: '少林',
    faction: 'orthodox',
    founded: '南北朝时期',
    location: '河南嵩山',
    doctrine: '以禅入武，武禅合一。强调「修心不修口」，追求身心合一的上乘境界。',
    conduct: '不杀生、不偷盗、不妄语。弟子需遵守少林十戒，犯了戒规要受罚。',
    externalView: '武林正宗，武林泰斗。江湖传言「天下武功出少林」，少林弟子被视为正派标杆。',
    internalView: '少林千年基业，需以守护为第一要务。与朝廷保持良好关系有利于门派传承。',
    history: '始建于南北朝，历经隋唐盛世，与历代王朝关系密切。唐太宗时期曾助朝廷平定天下，因而获得「武林正宗」地位。',
    courtRelation: 'aligned',
    specialSkills: ['七十二绝技', '易筋经', '金钟罩'],
    relations: {
      wudang: 80,     // 盟友
      beggar: 30,     // 友好
      youming: -80,   // 死敌
      mingjiao: -70,  // 敌对
      tangmen: 20,    // 中立偏友
    },
    recruitOpen: true,
    recruitmentRequirements: {
      minChivalry: 20,
      minMartialPower: 10,
    },
  },
  
  wudang: {
    id: 'wudang',
    name: '武当派',
    shortName: '武当',
    faction: 'orthodox',
    founded: '元末明初',
    location: '湖北武当山',
    doctrine: '道法自然，以柔克刚。强调内功修炼，追求「四两拨千斤」的境界。',
    conduct: '尊师重道，维护武林正义。弟子需以天下苍生为己任。',
    externalView: '与少林齐名的武林泰斗，以内功深厚著称。江湖传言「北少林，南武当」。',
    internalView: '道家清静无为，但必要时也需出手维护正道。武当不追求名利，但声望关乎门派存亡。',
    history: '由张三丰所创，以道家思想为本。明成祖时期受朝廷册封，成为武林正宗之一。',
    courtRelation: 'aligned',
    specialSkills: ['太极拳', '太极剑', '纯阳无极功'],
    relations: {
      shaolin: 80,     // 盟友
      beggar: 30,     // 友好
      youming: -70,   // 敌对
      mingjiao: -60,  // 敌对
      tangmen: 30,    // 友好
    },
    recruitOpen: true,
    recruitmentRequirements: {
      minChivalry: 15,
      minInternalSkill: 10,
    },
  },
  
 丐帮: {
    id: 'beggar',
    name: '丐帮',
    shortName: '丐帮',
    faction: 'neutral',
    founded: '唐代',
    location: '遍布大江南北',
    doctrine: '以「义」为核心，帮中兄弟有福同享，有难同当。不分高低贵贱，只凭一颗义气之心。',
    conduct: '不准背叛兄弟，不准私吞财物。帮规森严，违者严惩。',
    externalView: '江湖上最大的帮派，弟子遍布各地。有人说他们乞丐出身LOW，也有人说他们深藏不露。',
    internalView: '丐帮虽穷，但丐帮弟子遍布天下，没有我们不知道的消息。朝廷想动我们，也要掂量掂量。',
    history: '起源已不可考，传说唐代就有丐帮雏形。历代帮主都以「仁义」为本，帮众虽穷却有骨气。',
    courtRelation: 'neutral',
    specialSkills: ['打狗棒法', '降龙十八掌', '消息网络'],
    relations: {
      shaolin: 30,     // 友好
      wudang: 30,     // 友好
      youming: 20,    // 中立偏友
      tangmen: 50,    // 盟友
      mingjiao: 10,   // 中立
    },
    recruitOpen: true,
    recruitmentRequirements: {
      minChivalry: 10,
    },
  },
  
  // ========== 非传统门派（unconventional）==========
  youying: {
    id: 'youying',
    name: '幽影门',
    shortName: '幽影',
    faction: 'unconventional',
    founded: '明中叶',
    location: '幽冥谷（外界不知其所在）',
    doctrine: '「人心所向，即为正道」。不受江湖规矩约束，行事全凭己心，但不伤无辜。',
    conduct: '不杀平民，不叛祖国，不卖同类。门规看似松散，实则有三条铁律。',
    externalView: '江湖传言的「魔教」，据说修炼邪功，手段残忍。正派人士人人得而诛之。',
    internalView: '我们不是魔教，只是选择了不被主流认可的道路。门中弟子多是是被正派逼上绝路的孤儿遗孀，我们互相扶持，仅此而已。正派说我们是魔教，不过是害怕我们不受控制。',
    history: '创始人原是少林叛徒，因不满少林与朝廷勾结、压迫异己而叛出少林，另立门户。幽影门虽被称为「魔教」，但从未做过真正伤天害理之事。',
    courtRelation: 'opposed',
    specialSkills: ['幽冥神功', '暗影潜行', '夺魂指'],
    relations: {
      shaolin: -80,   // 死敌
      wudang: -70,    // 敌对
      beggar: 20,     // 中立偏友
      tangmen: 10,    // 中立
      mingjiao: 40,   // 友好（同为非传统）
    },
    recruitOpen: false,
    recruitmentRequirements: {
      maxChivalry: 30,
    },
  },
  
  // ========== 其他门派 ==========
  tangmen: {
    id: 'tangmen',
    name: '唐门',
    shortName: '唐门',
    faction: 'neutral',
    founded: '唐代',
    location: '四川唐家堡',
    doctrine: '以暗器与毒术立门，追求「杀人于无形」。但门规禁止对无辜者下手。',
    conduct: '不准以暗器对付同门，不准背叛唐门。违者逐出家门，永世为敌。',
    externalView: '神秘的暗器世家，据说唐门暗器天下无双。但使用毒物终究是「歪门邪道」。',
    internalView: '正派虚伪，暗器不过是工具，关键看用在什么人身上。唐门不参与江湖纷争，但也不怕事。',
    history: '唐代皇室后裔所创，因不满朝廷而隐居四川。以暗器和毒术闻名江湖数百年。',
    courtRelation: 'neutral',
    specialSkills: ['暴雨梨花针', '唐门毒术', '五行暗器'],
    relations: {
      shaolin: 20,     // 中立
      wudang: 30,     // 友好
      beggar: 50,     // 盟友
      youming: 10,    // 中立
      mingjiao: 30,   // 友好
    },
    recruitOpen: true,
  },
  
  mingjiao: {
    id: 'mingjiao',
    name: '明教',
    shortName: '明教',
    faction: 'unconventional',
    founded: '唐代（传入）',
    location: '光明顶',
    doctrine: '崇敬光明，驱除黑暗。强调平等互助，不分贵贱。',
    conduct: '以善行为本，扶危济困。但若被逼上绝路，也会以暴制暴。',
    externalView: '历史上曾被定义为「邪教」，但近代已逐渐淡出江湖。',
    internalView: '明尊教导我们追求光明，只是这条路太难走了。江湖误解我们太久，但清者自清。',
    history: '源于波斯的摩尼教，唐代传入中国。曾多次被朝廷定义为「邪教」打压，但明教弟子始终坚守信仰。',
    courtRelation: 'opposed',
    specialSkills: ['明教内功', '圣火令功', '乾坤大挪移'],
    relations: {
      shaolin: -70,   // 敌对
      wudang: -60,    // 敌对
      beggar: 10,     // 中立
      tangmen: 30,    // 友好
      youming: 40,   // 友好（同为非传统）
    },
    recruitOpen: false,
  },
};

/**
 * 获取门派描述
 */
export function getSectDescription(sectId: string): SectDescription | undefined {
  return sectDescriptions[sectId.toLowerCase()];
}

/**
 * 获取阵营描述
 */
export function getFactionDescription(faction: FactionType): string {
  switch (faction) {
    case 'orthodox':
      return '传统名门正派。获得朝廷认可，在江湖上拥有较高地位和声望。代表门派：少林、武当等。';
    case 'unconventional':
      return '非传统门派。未获得朝廷认可，被主流江湖定义为「异端」。但他们有自己的价值观和行为准则。代表门派：幽影门、明教等。';
    case 'neutral':
      return '中立门派。不参与正邪纷争，保持独立。代表门派：丐帮、唐门等。';
    default:
      return '无阵营归属。';
  }
}

/**
 * 获取两个门派之间的关系值
 * @param sectId1 门派1 ID
 * @param sectId2 门派2 ID
 * @returns 关系值：-100(死敌) 到 100(盟友)，0表示无定义
 */
export function getSectRelation(sectId1: string, sectId2: string): number {
  const sect1 = sectDescriptions[sectId1.toLowerCase()];
  const sect2 = sectDescriptions[sectId2.toLowerCase()];
  
  if (!sect1 || !sect2) return 0;
  
  return sect1.relations?.[sectId2.toLowerCase()] ?? 0;
}

/**
 * 判断两个门派是否为敌对关系
 * @param sectId1 门派1 ID
 * @param sectId2 门派2 ID
 */
export function areSectsHostile(sectId1: string, sectId2: string): boolean {
  return getSectRelation(sectId1, sectId2) < -30;
}

/**
 * 判断两个门派是否为友好关系
 * @param sectId1 门派1 ID
 * @param sectId2 门派2 ID
 */
export function areSectsFriendly(sectId1: string, sectId2: string): boolean {
  return getSectRelation(sectId1, sectId2) > 30;
}

/**
 * 计算从原门派转到目标门派的代价加成
 * @param fromSect 原门派ID
 * @param toSect 目标门派ID
 * @returns 代价加成百分比（0-100）
 */
export function getSectSwitchPenalty(fromSect: string | null, toSect: string): number {
  if (!fromSect) return 0;
  
  const relation = getSectRelation(fromSect, toSect);
  
  if (relation < -50) return 50;   // 死敌：+50%惩罚
  if (relation < -20) return 30;   // 敌对：+30%惩罚
  if (relation > 50) return -10;   // 盟友：-10%惩罚（优惠）
  
  return 0;
}

/**
 * 获取门派关系描述
 * @param relation 关系值
 */
export function getRelationDescription(relation: number): string {
  if (relation <= -70) return '死敌';
  if (relation <= -30) return '敌对';
  if (relation <= -10) return '中立偏敌';
  if (relation <= 10) return '中立';
  if (relation <= 30) return '中立偏友';
  if (relation <= 70) return '友好';
  return '盟友';
}
