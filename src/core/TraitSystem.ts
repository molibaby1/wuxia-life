import { coreTalents } from '../data/traits/coreTalents';
import { origins } from '../data/traits/origins';
import { temperaments } from '../data/traits/temperaments';
import { weaknesses } from '../data/traits/weaknesses';
import { lifeStates } from '../data/life/lifeStates';
import type {
  CoreTalentConfig,
  CoreTalentId,
  EventBiasTag,
  EventDefinition,
  GameState,
  LifeStateKey,
  OriginId,
  PlayerLifeStates,
  PlayerState,
  TemperamentConfig,
  TraitId,
  TraitStatKey,
  WeaknessConfig,
  WeaknessId,
  TemperamentId,
} from '../types/eventTypes';

type TraitConfig = CoreTalentConfig | WeaknessConfig | TemperamentConfig;

const EXCLUSIONS = new Set([
  'keen_mind:slow_witted',
  'martial_born:frail',
  'disciplined:lazy',
]);

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

interface TraitSelection {
  coreTalent: CoreTalentId;
  weakness: WeaknessId;
  temperament: TemperamentId;
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

  generateTraits(): TraitId[] {
    let selection: TraitSelection;
    do {
      selection = {
        coreTalent: randomPick(coreTalents).id,
        weakness: randomPick(weaknesses).id,
        temperament: randomPick(temperaments).id,
      };
    } while (!this.isValidSelection(selection));
    return [selection.coreTalent, selection.weakness, selection.temperament];
  }

  applyTraits(player: PlayerState, traits: TraitId[]): PlayerState {
    const nextPlayer = {
      ...player,
      traits: [...traits],
      lifeStates: this.createInitialLifeStates(),
    };

    for (const config of this.getTraitConfigs(traits)) {
      if ('initialStats' in config && config.initialStats) {
        for (const modifier of config.initialStats) {
          const current = Number(nextPlayer[modifier.stat] || 0);
          nextPlayer[modifier.stat] = current + modifier.value;
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

    return nextPlayer;
  }

  getGrowthMultiplier(player: PlayerState | undefined, stat: string): number {
    let multiplier = 1;
    for (const config of this.getTraitConfigs(player?.traits)) {
      if ('growthModifiers' in config && config.growthModifiers) {
        const hit = config.growthModifiers.find(item => item.stat === stat);
        if (hit) {
          multiplier *= hit.multiplier;
        }
      }
    }
    return multiplier;
  }

  getEventWeightMultiplier(state: GameState, event: EventDefinition): number {
    const player = state.player;
    if (!player) return 1;
    const tags = this.getEventBiasTags(event);
    let multiplier = 1;
    for (const config of this.getTraitConfigs(player.traits)) {
      const biases = 'eventBiases' in config ? config.eventBiases : [];
      for (const bias of biases || []) {
        if (tags.has(bias.tag)) {
          multiplier *= bias.multiplier;
        }
      }
    }

    const originId = this.getOriginId(state);
    if ((player.age || 0) > 18 && originId) {
      const originConfig = this.originMap.get(originId);
      for (const bias of originConfig?.earlyEventBiases || []) {
        if (tags.has(bias.tag)) {
          multiplier /= bias.multiplier;
        }
      }
    }

    return Math.max(0.35, Math.min(2.5, multiplier));
  }

  getTraitNames(traits: TraitId[] | undefined): {
    coreTalent?: string;
    weakness?: string;
    temperament?: string;
  } {
    const selection = this.getTraitSelection(traits);
    if (!selection) return {};
    return {
      coreTalent: this.coreTalentMap.get(selection.coreTalent)?.name,
      weakness: this.weaknessMap.get(selection.weakness)?.name,
      temperament: this.temperamentMap.get(selection.temperament)?.name,
    };
  }

  getGrowthBiasSummary(traits: TraitId[] | undefined): string[] {
    const summary: string[] = [];
    const selection = this.getTraitSelection(traits);
    if (!selection) return summary;
    const core = this.coreTalentMap.get(selection.coreTalent);
    const weakness = this.weaknessMap.get(selection.weakness);
    const temperament = this.temperamentMap.get(selection.temperament);

    if (core) {
      summary.push(`强项：${core.summary}`);
    }
    if (weakness) {
      summary.push(`短板：${weakness.summary}`);
    }
    if (temperament) {
      summary.push(`气质：${temperament.summary}`);
    }
    return summary;
  }

  getOriginName(originId: string | undefined): string | undefined {
    return originId ? this.originMap.get(originId as OriginId)?.name : undefined;
  }

  clampLifeState(stateKey: LifeStateKey, value: number): number {
    const config = lifeStates.find(item => item.key === stateKey);
    if (!config) return value;
    return Math.max(config.min, Math.min(config.max, value));
  }

  private isValidSelection(selection: TraitSelection): boolean {
    const pairs: Array<[string, string]> = [
      [selection.coreTalent, selection.weakness],
      [selection.temperament, selection.weakness],
      [selection.coreTalent, selection.temperament],
    ];
    return pairs.every(([left, right]) => !EXCLUSIONS.has(`${left}:${right}`) && !EXCLUSIONS.has(`${right}:${left}`));
  }

  private getTraitConfigs(traits: TraitId[] | undefined): TraitConfig[] {
    if (!traits) return [];
    const configs: TraitConfig[] = [
      ...traits.map(trait => this.coreTalentMap.get(trait as CoreTalentId)),
      ...traits.map(trait => this.weaknessMap.get(trait as WeaknessId)),
      ...traits.map(trait => this.temperamentMap.get(trait as TemperamentId)),
    ].filter(Boolean) as TraitConfig[];
    return configs;
  }

  private getTraitSelection(traits: TraitId[] | undefined): TraitSelection | undefined {
    if (!traits) return undefined;
    const coreTalent = traits.find(trait => this.coreTalentMap.has(trait as CoreTalentId)) as CoreTalentId | undefined;
    const weakness = traits.find(trait => this.weaknessMap.has(trait as WeaknessId)) as WeaknessId | undefined;
    const temperament = traits.find(trait => this.temperamentMap.has(trait as TemperamentId)) as TemperamentId | undefined;
    if (!coreTalent || !weakness || !temperament) return undefined;
    return { coreTalent, weakness, temperament };
  }

  private getOriginId(state: GameState): OriginId | undefined {
    const originId = state.flags?.origin_id;
    return typeof originId === 'string' && this.originMap.has(originId as OriginId)
      ? originId as OriginId
      : undefined;
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
