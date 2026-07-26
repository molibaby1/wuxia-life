import { dailyEvents } from '../data/life/dailyEvents';
import { resolvePrimaryOriginFamilyFlag } from '../p16/primaryOriginFlag';
import { isSpineOriginEligible } from '../p16/spineOriginIsolation';
import { isTraitLineSpineEligible } from '../p16/traitLineSpineEligibility';
import { getOriginId } from '../p20/stateAccess';
import { EffectType, EventCategory, EventPriority, type DailyEventConfig, type DailyEventVariantConfig, type EventDefinition, type EventTrigger, type GameState } from '../types/eventTypes';

// ponytail: built once at load; getConfigByVariantId was O(configs × variants) per daily event.
const dailyConfigByVariantId = new Map<string, DailyEventConfig>(
  dailyEvents.flatMap(config =>
    Object.values(config.variants)
      .flat()
      .map(variant => [variant.id, config] as const),
  ),
);

function pickWeightedVariant(variants: DailyEventVariantConfig[]): DailyEventVariantConfig {
  const total = variants.reduce((sum, variant) => sum + variant.weight, 0);
  let random = Math.random() * total;
  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant;
    }
  }
  return variants[variants.length - 1];
}

export class DailyEventSystem {
  getConfigByVariantId(eventId: string): DailyEventConfig | null {
    return dailyConfigByVariantId.get(eventId) ?? null;
  }

  selectEvent(state: GameState, configs: DailyEventConfig[] = dailyEvents): EventDefinition | null {
    const age = state.player?.age || 0;
    const primaryOrigin = resolvePrimaryOriginFamilyFlag(state);
    const candidates = configs
      .filter(event => age >= event.ageRange.min && age <= event.ageRange.max)
      .map(event => ({ event, weight: this.getWeight(event, state) }))
      .filter(item => item.weight > 0)
      .filter(item => {
        const probe = this.buildProbeEvent(item.event, state);
        return (
          isSpineOriginEligible(probe, primaryOrigin, age, item.event.spineOriginStageFit) &&
          isTraitLineSpineEligible(probe, state)
        );
      });

    if (candidates.length === 0) {
      return null;
    }

    const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = candidates[candidates.length - 1].event;
    for (const item of candidates) {
      random -= item.weight;
      if (random <= 0) {
        selected = item.event;
        break;
      }
    }

    return this.buildEvent(selected, state);
  }

  private getWeight(config: DailyEventConfig, state: GameState): number {
    const traitIds = this.getPlayerTraits(state);
    let weight = config.baseWeight;

    for (const trait of config.preferredTraits || []) {
      if (traitIds.has(trait)) {
        weight *= 1.2;
      }
    }
    for (const trait of config.suppressedTraits || []) {
      if (traitIds.has(trait)) {
        weight *= 0.75;
      }
    }
    const originId = getOriginId(state);
    if (originId && config.preferredOrigins?.includes(originId as typeof config.preferredOrigins[number])) {
      weight *= 1.2;
    }
    if (originId && config.suppressedOrigins?.includes(originId as typeof config.suppressedOrigins[number])) {
      weight *= 0.75;
    }
    for (const stateRule of config.preferredStates || []) {
      const value = state.player?.lifeStates?.[stateRule.state] || 0;
      const meetsMin = stateRule.min === undefined || value >= stateRule.min;
      const meetsMax = stateRule.max === undefined || value <= stateRule.max;
      if (meetsMin && meetsMax) {
        weight *= stateRule.weightMultiplier;
      }
    }

    weight *= this.getGroupStateMultiplier(config, state);
    weight *= this.getRecentRepeatPenalty(config, state);

    return weight;
  }

  private getRecentRepeatPenalty(config: DailyEventConfig, state: GameState): number {
    const age = state.player?.age || 0;
    const history = state.eventHistory || [];
    if (history.length === 0) {
      return 1;
    }

    const variantIds = new Set(
      Object.values(config.variants)
        .flat()
        .map(variant => variant.id)
    );

    let exactRecentCount = 0;
    let titleRecentCount = 0;

    for (const entry of history) {
      if (!variantIds.has(entry.eventId)) {
        continue;
      }

      const ageGap = age - (entry.age ?? age);
      if (ageGap < 0) {
        continue;
      }

      if (ageGap <= 6) {
        exactRecentCount += 1;
      }
      if (ageGap <= 10) {
        titleRecentCount += 1;
      }
    }

    if (exactRecentCount === 0 && titleRecentCount === 0) {
      return 1;
    }

    const exactPenalty = Math.pow(0.55, exactRecentCount);
    const titlePenalty = Math.pow(0.82, titleRecentCount);
    return this.clampMultiplier(Math.max(0.18, exactPenalty * titlePenalty));
  }

  private buildProbeEvent(config: DailyEventConfig, state: GameState): EventDefinition {
    const variant =
      config.variants.neutral[0] ??
      config.variants.positive[0] ??
      config.variants.negative[0];
    const age = state.player?.age || 0;
    return {
      id: variant?.id ?? config.id,
      version: '1.0.0',
      category: EventCategory.DAILY_EVENT,
      priority: EventPriority.LOW,
      weight: config.baseWeight,
      ageRange: { min: age, max: age },
      triggers: [{ type: 'age_reach', value: age }],
      content: {
        title: config.title,
        text: variant?.text ?? config.title,
      },
      eventType: 'auto',
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['daily', config.group, 'daily_pool'],
        enabled: true,
      },
    };
  }

  private buildEvent(config: DailyEventConfig, state: GameState): EventDefinition {
    const outcomeType = this.chooseOutcomeType(config, state);
    const variant = pickWeightedVariant(config.variants[outcomeType]);
    const age = state.player?.age || 0;
    const triggers: EventTrigger[] = [{ type: 'age_reach', value: age }];

    return {
      id: variant.id,
      version: '1.0.0',
      category: EventCategory.DAILY_EVENT,
      priority: EventPriority.LOW,
      weight: config.baseWeight,
      ageRange: { min: age, max: age },
      triggers,
      content: {
        title: config.title,
        text: variant.text,
        description: variant.text,
      },
      eventType: 'auto',
      autoEffects: [
        ...(variant.statEffects || []).map(effect => ({
          type: EffectType.STAT_MODIFY,
          target: effect.stat,
          value: effect.value,
          operator: 'add' as const,
        })),
        ...(variant.stateEffects || []).map(effect => ({
          type: EffectType.LIFE_STATE_CHANGE,
          target: effect.state,
          value: effect.value,
          operator: 'add' as const,
        })),
        ...((variant.flags || []).map(flag => ({
          type: EffectType.FLAG_SET,
          target: 'player.flags',
          value: true,
          flag,
        })) as any[]),
        {
          type: EffectType.TIME_ADVANCE,
          target: 'time',
          value: 1,
          timeUnit: 'year',
        },
      ],
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['daily', config.group, 'daily_pool'],
        enabled: true,
      },
    };
  }

  private chooseOutcomeType(config: DailyEventConfig, state: GameState): 'positive' | 'neutral' | 'negative' {
    let positive = 1;
    let neutral = 1.4;
    let negative = 1;
    const traitIds = this.getPlayerTraits(state);
    const originId = getOriginId(state);

    for (const trait of config.outcomeBias?.positiveByTraits || []) {
      if (traitIds.has(trait)) positive += 0.5;
    }
    for (const trait of config.outcomeBias?.negativeByTraits || []) {
      if (traitIds.has(trait)) negative += 0.6;
    }
    for (const origin of config.outcomeBias?.positiveByOrigins || []) {
      if (origin === originId) positive += 0.5;
    }
    for (const origin of config.outcomeBias?.negativeByOrigins || []) {
      if (origin === originId) negative += 0.6;
    }

    const discipline = state.player?.lifeStates?.discipline || 0;
    const socialMomentum = state.player?.lifeStates?.socialMomentum || 0;
    positive += discipline * 0.16;
    positive += socialMomentum * 0.08;

    const total = positive + neutral + negative;
    let random = Math.random() * total;
    random -= positive;
    if (random <= 0) return 'positive';
    random -= neutral;
    if (random <= 0) return 'neutral';
    return 'negative';
  }

  private getPlayerTraits(state: GameState): Set<string> {
    return new Set(state.player?.traits || []);
  }

  private getGroupStateMultiplier(config: DailyEventConfig, state: GameState): number {
    const lifeStates = state.player?.lifeStates;
    if (!lifeStates) {
      return 1;
    }

    const discipline = lifeStates.discipline || 0;
    const familyBond = lifeStates.familyBond || 0;
    const socialMomentum = lifeStates.socialMomentum || 0;

    switch (config.group) {
      case 'training':
        return this.clampMultiplier(
          1 + discipline * 0.08
        );
      case 'study':
        return this.clampMultiplier(
          1 + discipline * 0.09
        );
      case 'livelihood':
        return this.clampMultiplier(
          1 + socialMomentum * 0.12
        );
      case 'family':
        return this.clampMultiplier(
          1 + Math.max(0, 2 - familyBond) * 0.08
        );
      case 'emotion':
        return this.clampMultiplier(
          1 - socialMomentum * 0.08
        );
      default:
        return 1;
    }
  }

  private clampMultiplier(value: number): number {
    return Math.max(0.18, Math.min(1.6, value));
  }
}

export const dailyEventSystem = new DailyEventSystem();
