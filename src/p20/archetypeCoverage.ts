import type {
  ArchetypeCoverageReport,
  ArchetypeFamilyConfig,
  ResolvedArchetypeFamily,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EventDefinition } from '../types/eventTypes';
import type { GameState } from '../types/eventTypes';
import { getActiveRouteKeys, getMergedFlags, getOriginId, getPlayerAge, hasAnyFlag } from './stateAccess';

function scoreLifecycleDimension(
  matched: string[],
  label: string,
  satisfied: boolean,
): number {
  if (satisfied) {
    matched.push(label);
    return 1;
  }
  return 0;
}

export function scoreArchetypeFamily(
  config: ArchetypeFamilyConfig,
  state: GameState,
): ResolvedArchetypeFamily {
  const flags = getMergedFlags(state);
  const originId = getOriginId(state);
  const routeKeys = getActiveRouteKeys(state);
  const matchedSignals: string[] = [];
  const signals = config.lifecycleSignals;

  let score = config.baseWeight;
  const dimensions: number[] = [];

  dimensions.push(
    scoreLifecycleDimension(
      matchedSignals,
      'origin',
      Boolean(originId && signals.originIds?.includes(originId)) ||
        hasAnyFlag(flags, signals.originTags),
    ),
  );
  dimensions.push(
    scoreLifecycleDimension(matchedSignals, 'growth', hasAnyFlag(flags, signals.growthPatternFlags)),
  );
  dimensions.push(
    scoreLifecycleDimension(
      matchedSignals,
      'route',
      signals.routeIdentityKeys?.some(key => routeKeys.includes(key)) ?? false,
    ),
  );
  dimensions.push(
    scoreLifecycleDimension(matchedSignals, 'social', hasAnyFlag(flags, signals.socialRoleFlags)),
  );
  dimensions.push(
    scoreLifecycleDimension(matchedSignals, 'legacy', hasAnyFlag(flags, signals.legacyShapeFlags)),
  );
  dimensions.push(
    scoreLifecycleDimension(
      matchedSignals,
      'endgame',
      hasAnyFlag(
        flags,
        signals.endgameCategoryKinds?.map(kind => `p19_endgame_${kind}`) ??
          signals.historicalMemoryTones?.map(tone => `p19_memory_${tone}`),
      ) || hasAnyFlag(flags, signals.legacyShapeFlags),
    ),
  );

  const satisfiedDimensions = dimensions.filter(value => value > 0).length;
  score += satisfiedDimensions * 0.35;
  if (satisfiedDimensions >= 3) {
    score += 0.5;
  }

  return {
    familyId: config.id,
    label: config.label,
    kind: config.familyKind,
    score,
    matchedSignals,
  };
}

export function resolveArchetypeCandidates(
  state: GameState,
  worldId = 'wuxia',
): ResolvedArchetypeFamily[] {
  const configs = getWorldProfile(worldId).archetypeFamilyConfigs ?? [];
  return configs
    .map(config => scoreArchetypeFamily(config, state))
    .sort((a, b) => b.score - a.score);
}

export function selectArchetypeFamily(
  state: GameState,
  worldId = 'wuxia',
): ResolvedArchetypeFamily {
  const candidates = resolveArchetypeCandidates(state, worldId);
  return candidates[0] ?? {
    familyId: 'unknown',
    label: '未分类',
    kind: 'martial_ascendant',
    score: 0,
    matchedSignals: [],
  };
}

export function buildArchetypeCoverageReport(
  state: GameState,
  worldId = 'wuxia',
): ArchetypeCoverageReport {
  const age = getPlayerAge(state);
  const candidates = resolveArchetypeCandidates(state, worldId);
  const selectedFamily = candidates[0] ?? selectArchetypeFamily(state, worldId);
  const lifecycleCoverage: Record<string, number> = {};
  for (const candidate of candidates) {
    for (const signal of candidate.matchedSignals) {
      lifecycleCoverage[signal] = (lifecycleCoverage[signal] ?? 0) + candidate.score;
    }
  }
  const distinctiveBeyondRouteLabel =
    selectedFamily.matchedSignals.length >= 3 &&
    !selectedFamily.matchedSignals.every(signal => signal === 'route');

  return {
    age,
    selectedFamily,
    candidates: candidates.slice(0, 5),
    lifecycleCoverage,
    distinctiveBeyondRouteLabel,
  };
}

export function collectArchetypeEventTags(event: EventDefinition): Set<string> {
  const tags = new Set<string>(event.metadata?.tags ?? []);
  if (event.category) {
    tags.add(event.category);
  }
  if (event.storyLine) {
    tags.add(event.storyLine);
  }
  const id = event.id.toLowerCase();
  if (id.includes('train') || id.includes('martial')) tags.add('training');
  if (id.includes('study') || id.includes('scholar')) tags.add('study');
  if (id.includes('trade') || id.includes('merchant') || id.includes('business')) tags.add('business');
  if (id.includes('legacy') || id.includes('inherit')) tags.add('legacy');
  if (id.includes('feud') || id.includes('demonic')) tags.add('feud');
  if (id.includes('hermit') || id.includes('withdraw')) tags.add('withdrawal');
  return tags;
}

export function getArchetypeSchedulingMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): number {
  const profile = getWorldProfile(worldId);
  const family = selectArchetypeFamily(state, worldId);
  const config = profile.archetypeFamilyConfigs?.find(entry => entry.id === family.familyId);
  if (!config) {
    return 1;
  }
  const eventTags = collectArchetypeEventTags(event);
  let multiplier = 1;
  for (const weight of config.opportunityTags ?? []) {
    if (eventTags.has(weight.tag)) {
      multiplier *= weight.multiplier;
    }
  }
  for (const weight of config.riskTags ?? []) {
    if (eventTags.has(weight.tag)) {
      multiplier *= weight.multiplier;
    }
  }
  return Math.max(0.35, Math.min(3.5, multiplier));
}
