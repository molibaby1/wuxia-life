import ordinaryEarlyLifeJson from '../data/lines/ordinary-origin-early-life.json';
import { getOriginSurfaceById } from '../p16/originSurfaces';
import { WUXIA_ORDINARY_ORIGIN_IDS } from '../narrative/profile/wuxiaOriginSurfaces';

export interface OrdinaryEarlyLifeChoiceOption {
  id: string;
  label: string;
  flags: string[];
}

export interface OrdinaryEarlyLifeChoice {
  id: string;
  originId: string;
  originFlag: string;
  ageMin: number;
  ageMax: number;
  title: string;
  prompt: string;
  options: OrdinaryEarlyLifeChoiceOption[];
}

const ORDINARY_EARLY_LIFE_CHOICES = (
  ordinaryEarlyLifeJson as { choices: OrdinaryEarlyLifeChoice[] }
).choices;

export function getOrdinaryEarlyLifeChoices(): readonly OrdinaryEarlyLifeChoice[] {
  return ORDINARY_EARLY_LIFE_CHOICES;
}

export function getOrdinaryEarlyLifeChoiceForOrigin(
  originId: string,
): OrdinaryEarlyLifeChoice | undefined {
  return ORDINARY_EARLY_LIFE_CHOICES.find(c => c.originId === originId);
}

const ORIGIN_TRAJECTORY_ANCHORS: Record<
  string,
  { infantComplete: string; preschoolFlag: string; choiceFlags?: string[] }
> = {
  farm_peasant: {
    infantComplete: 'peasant_infant_chain_complete',
    preschoolFlag: 'preschool_peasant_harvest_help',
  },
  town_apprentice: {
    infantComplete: 'apprentice_infant_chain_complete',
    preschoolFlag: 'preschool_apprentice_plane_shavings',
  },
  tavern_hand: {
    infantComplete: 'tavern_infant_chain_complete',
    preschoolFlag: 'preschool_tavern_tray_balance',
  },
  poor_family: {
    infantComplete: 'shared_infant_filler',
    preschoolFlag: 'preschool_passive_gap',
    choiceFlags: ['survival_upbringing'],
  },
  streetborn: {
    infantComplete: 'shared_infant_filler',
    preschoolFlag: 'preschool_passive_gap',
    choiceFlags: ['street_network_seed'],
  },
  merchant_house: {
    infantComplete: 'merchant_infant_chain_complete',
    preschoolFlag: 'preschool_merchant_first_coin',
    choiceFlags: ['p9_early_merchant_seed'],
  },
  martial_family: {
    infantComplete: 'martial_infant_chain_complete',
    preschoolFlag: 'preschool_martial_first_stance',
    choiceFlags: ['p9_early_martial_seed'],
  },
  scholar_house: {
    infantComplete: 'scholar_infant_chain_complete',
    preschoolFlag: 'preschool_scholar_clever_speech',
    choiceFlags: ['p9_early_scholar_seed'],
  },
  frontier_military: {
    infantComplete: 'frontier_infant_chain_complete',
    preschoolFlag: 'preschool_frontier_bonfire_tale',
    choiceFlags: ['p9_early_frontier_seed'],
  },
};

/** Sim/validation: early+mid trajectory signature from infant, preschool, and choice flags. */
export function buildOriginTrajectorySignature(
  originId: string,
  selectedOptionId?: string,
): string[] {
  const choice = getOrdinaryEarlyLifeChoiceForOrigin(originId);
  const surface = getOriginSurfaceById(originId);
  const biasTags = surface?.eventBiasTags.map(t => t.tag) ?? [];
  const anchors = ORIGIN_TRAJECTORY_ANCHORS[originId] ?? {
    infantComplete: 'unknown_infant',
    preschoolFlag: 'unknown_preschool',
  };
  const option = choice?.options.find(o => o.id === selectedOptionId) ?? choice?.options[0];
  const choiceFlags = option?.flags ?? anchors.choiceFlags ?? [];
  return [
    `origin:${originId}`,
    `infant:${anchors.infantComplete}`,
    `preschool:${anchors.preschoolFlag}`,
    `bias:${biasTags.join('+')}`,
    ...choiceFlags.map(f => `flag:${f}`),
  ];
}

export function assertOrdinaryEarlyLifeWiring(): string[] {
  const issues: string[] = [];
  for (const originId of WUXIA_ORDINARY_ORIGIN_IDS) {
    const choice = getOrdinaryEarlyLifeChoiceForOrigin(originId);
    if (!choice) {
      issues.push(`${originId}: missing early-life choice`);
      continue;
    }
    if (choice.ageMin > 15 || choice.ageMax < 3) {
      issues.push(`${originId}: choice age band outside 3-15`);
    }
    if (choice.options.length < 2) {
      issues.push(`${originId}: need meaningful fork`);
    }
    const surface = getOriginSurfaceById(originId);
    if (!surface || surface.originTier !== 'ordinary') {
      issues.push(`${originId}: missing ordinary surface`);
    }
  }
  return issues;
}
