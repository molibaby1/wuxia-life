/** P7.1: short narrative copy for minimal disturbance pool (no chain state). */

export interface DisturbanceNarrativeCopy {
  title: string;
  bodyText: string;
  impactSummary: string;
  returnToPlanHint: string;
}

export const disturbanceNarrativeCatalog: Record<string, DisturbanceNarrativeCopy> = {
  disturbance_sparring_invite: {
    title: '有人邀你切磋',
    bodyText: '巷口传来一声朗笑，有位少年侠客抱拳相邀，想与你过几招印证剑路。',
    impactSummary: '切磋或婉拒都会占用片刻心神，本期余力略减。',
    returnToPlanHint: '点头或作罢皆可，随后回到本期规划。',
  },
  disturbance_market_rumor: {
    title: '街市传来江湖传闻',
    bodyText: '茶肆里有人低声议论近日江湖动向，话里藏着几分真假难辨的消息。',
    impactSummary: '你多听了几句，对江湖局势多了一分留意。',
    returnToPlanHint: '传闻听过便罢，继续安排下一期人生。',
  },
  disturbance_minor_injury: {
    title: '练功不慎，轻微扭伤',
    bodyText: '收势时脚下略滑，筋脉微微发紧，所幸只是皮肉小伤，静养即可。',
    impactSummary: '需暂缓狠练，本期体魄恢复略慢。',
    returnToPlanHint: '稍作调息后，仍可继续规划本期安排。',
  },
};

export function getDisturbanceNarrativeCopy(disturbanceId: string): DisturbanceNarrativeCopy | null {
  return disturbanceNarrativeCatalog[disturbanceId] ?? null;
}
