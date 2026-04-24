import { coreTalents } from '../data/traits/coreTalents';
import { origins } from '../data/traits/origins';
import { temperaments } from '../data/traits/temperaments';
import { weaknesses } from '../data/traits/weaknesses';
import { lifeStates } from '../data/life/lifeStates';
import type {
  CoreTalentConfig,
  EventBiasTag,
  EventDefinition,
  GameState,
  LifeStateKey,
  OriginConfig,
  PlayerLifeStates,
  PlayerState,
  PlayerTraitProfile,
  TemperamentConfig,
  TraitStatKey,
  WeaknessConfig,
} from '../types/eventTypes';

type TraitConfig = CoreTalentConfig | WeaknessConfig | TemperamentConfig | OriginConfig;

const EXCLUSIONS = new Set([
  'keen_mind:slow_witted',
  'martial_born:frail',
  'disciplined:lazy',
]);

const RARE_COMBOS: Array<{
  traits: string[];
  title: string;
  description: string;
}> = [
  {
    traits: ['martial_born', 'lazy'],
    title: '璞玉蒙尘',
    description: '资质极佳，却总难把劲使到正地方。',
  },
  {
    traits: ['heroic_heart', 'profit_driven'],
    title: '义利两难',
    description: '你并非不讲义气，只是不愿轻看得失。',
  },
  {
    traits: ['cold_reader', 'affectionate'],
    title: '冷眼热心',
    description: '你看事很冷静，心却没法真正变冷。',
  },
];

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export class TraitSystem {
  private coreTalentMap = new Map(coreTalents.map(item => [item.id, item]));
  private weaknessMap = new Map(weaknesses.map(item => [item.id, item]));
  private temperamentMap = new Map(temperaments.map(item => [item.id, item]));
  private originMap = new Map(origins.map(item => [item.id, item]));

  createInitialLifeStates(): PlayerLifeStates {
    return lifeStates.reduce((acc, state) => {
      acc[state.key] = state.defaultValue;
      return acc;
    }, {} as PlayerLifeStates);
  }

  generateProfile(): PlayerTraitProfile {
    let profile: PlayerTraitProfile;
    do {
      profile = {
        origin: randomPick(origins).id,
        coreTalent: randomPick(coreTalents).id,
        weakness: randomPick(weaknesses).id,
        temperament: randomPick(temperaments).id,
      };
    } while (!this.isValidProfile(profile));

    const combo = this.getRareCombo(profile);
    if (combo) {
      profile.rareComboTitle = combo.title;
      profile.rareComboDescription = combo.description;
    }
    return profile;
  }

  applyProfile(player: PlayerState, profile: PlayerTraitProfile): PlayerState {
    const nextPlayer = {
      ...player,
      traitProfile: profile,
      lifeStates: this.createInitialLifeStates(),
      growthBiasSummary: this.getGrowthBiasSummary(profile),
    };

    const allConfigs = this.getAllConfigs(profile);
    for (const config of allConfigs) {
      if ('initialStats' in config && config.initialStats) {
        for (const modifier of config.initialStats) {
          const current = Number((nextPlayer as any)[modifier.stat] || 0);
          (nextPlayer as any)[modifier.stat] = current + modifier.value;
        }
      }

      if ('startingStates' in config && config.startingStates) {
        for (const modifier of config.startingStates) {
          nextPlayer.lifeStates![modifier.state] = this.clampLifeState(
            modifier.state,
            nextPlayer.lifeStates![modifier.state] + modifier.value
          );
        }
      }

      if ('stateBiases' in config && config.stateBiases) {
        for (const modifier of config.stateBiases) {
          nextPlayer.lifeStates![modifier.state] = this.clampLifeState(
            modifier.state,
            nextPlayer.lifeStates![modifier.state] + modifier.value
          );
        }
      }
    }

    const flags = { ...(((nextPlayer as any).flags || {}) as Record<string, boolean>) };
    const originConfig = this.originMap.get(profile.origin);
    for (const flag of originConfig?.startingFlags || []) {
      flags[flag] = true;
    }
    (nextPlayer as any).flags = flags;

    return nextPlayer;
  }

  getGrowthMultiplier(player: PlayerState | undefined, stat: string): number {
    if (!player?.traitProfile) return 1;
    const profile = player.traitProfile;
    let multiplier = 1;
    for (const config of this.getAllConfigs(profile)) {
      if ('growthModifiers' in config && config.growthModifiers) {
        const hit = config.growthModifiers.find(item => item.stat === stat);
        if (hit) {
          multiplier *= hit.multiplier;
        }
      }
    }
    return multiplier;
  }

  getEventWeightMultiplier(player: PlayerState | undefined, event: EventDefinition): number {
    if (!player?.traitProfile) return 1;
    const tags = this.getEventBiasTags(event);
    let multiplier = 1;
    for (const config of this.getAllConfigs(player.traitProfile)) {
      const biases = 'eventBiases' in config ? config.eventBiases : config.earlyEventBiases;
      for (const bias of biases || []) {
        if (tags.has(bias.tag)) {
          multiplier *= bias.multiplier;
        }
      }
    }

    if ((player.age || 0) > 18) {
      const originConfig = this.originMap.get(player.traitProfile.origin);
      for (const bias of originConfig?.earlyEventBiases || []) {
        if (tags.has(bias.tag)) {
          multiplier /= bias.multiplier;
        }
      }
    }

    return Math.max(0.35, Math.min(2.5, multiplier));
  }

  getTraitNames(profile: PlayerTraitProfile | undefined): {
    origin?: string;
    coreTalent?: string;
    weakness?: string;
    temperament?: string;
  } {
    if (!profile) return {};
    return {
      origin: this.originMap.get(profile.origin)?.name,
      coreTalent: this.coreTalentMap.get(profile.coreTalent)?.name,
      weakness: this.weaknessMap.get(profile.weakness)?.name,
      temperament: this.temperamentMap.get(profile.temperament)?.name,
    };
  }

  getGrowthBiasSummary(profile: PlayerTraitProfile): string[] {
    const summary: string[] = [];
    const core = this.coreTalentMap.get(profile.coreTalent);
    const weakness = this.weaknessMap.get(profile.weakness);
    const temperament = this.temperamentMap.get(profile.temperament);
    const origin = this.originMap.get(profile.origin);

    if (core) {
      summary.push(`强项：${core.summary}`);
    }
    if (weakness) {
      summary.push(`短板：${weakness.summary}`);
    }
    if (temperament) {
      summary.push(`气质：${temperament.summary}`);
    }
    if (origin) {
      summary.push(`出身：${origin.summary}`);
    }
    return summary;
  }

  clampLifeState(stateKey: LifeStateKey, value: number): number {
    const config = lifeStates.find(item => item.key === stateKey);
    if (!config) return value;
    return Math.max(config.min, Math.min(config.max, value));
  }

  private getRareCombo(profile: PlayerTraitProfile) {
    const traitIds = [profile.origin, profile.coreTalent, profile.weakness, profile.temperament];
    return RARE_COMBOS.find(combo => combo.traits.every(trait => traitIds.includes(trait as any)));
  }

  private isValidProfile(profile: PlayerTraitProfile): boolean {
    const pairs: Array<[string, string]> = [
      [profile.coreTalent, profile.weakness],
      [profile.temperament, profile.weakness],
      [profile.coreTalent, profile.temperament],
    ];
    return pairs.every(([left, right]) => !EXCLUSIONS.has(`${left}:${right}`) && !EXCLUSIONS.has(`${right}:${left}`));
  }

  private getAllConfigs(profile: PlayerTraitProfile): TraitConfig[] {
    return [
      this.originMap.get(profile.origin),
      this.coreTalentMap.get(profile.coreTalent),
      this.weaknessMap.get(profile.weakness),
      this.temperamentMap.get(profile.temperament),
    ].filter(Boolean) as TraitConfig[];
  }

  public getEventBiasTags(event: EventDefinition): Set<EventBiasTag> {
    const tags = new Set<EventBiasTag>();
    const metaTags = event.metadata?.tags || [];

    if (event.category === 'daily_event' || metaTags.includes('daily')) {
      tags.add('discipline');
    }
    if (event.category === 'daily_event' || metaTags.includes('training') || event.storyLine?.includes('training')) {
      tags.add('training');
    }
    if (metaTags.some(tag => ['scholar', 'learning', 'comprehension', 'read'].includes(tag))) {
      tags.add('comprehension');
    }
    if (metaTags.some(tag => ['social', 'relationship', 'sect', 'friendship'].includes(tag))) {
      tags.add('social');
    }
    if (metaTags.some(tag => ['love', 'romance', 'marriage'].includes(tag))) {
      tags.add('romance');
    }
    if (metaTags.some(tag => ['family', 'home', 'children'].includes(tag))) {
      tags.add('family');
    }
    if (metaTags.some(tag => ['merchant', 'business', 'money'].includes(tag))) {
      tags.add('business');
    }
    if (metaTags.some(tag => ['survival', 'setback', 'illness'].includes(tag))) {
      tags.add('survival');
    }
    if (metaTags.some(tag => ['risk', 'danger', 'adventure'].includes(tag))) {
      tags.add('risk');
    }
    if (metaTags.some(tag => ['lazy', 'indulgence', 'pleasure'].includes(tag))) {
      tags.add('indulgence');
    }
    if (metaTags.some(tag => ['reputation', 'fame', 'legend'].includes(tag))) {
      tags.add('reputation');
    }

    if (tags.size === 0) {
      if (event.category === 'main_story') tags.add('risk');
      if (event.category === 'side_quest') tags.add('social');
      if (event.category === 'random_encounter') tags.add('survival');
    }
    return tags;
  }
}

export const traitSystem = new TraitSystem();
