import type { GameProcessRecord, GameProcessReport } from '../types/simulationRecordTypes';
import type { P8Persona } from './types';
import type {
  AgencyMetricPayload,
  AchievementMetricPayload,
  CausalityMetricPayload,
  CausalityEcho,
  FrustrationMetricPayload,
  FrustrationSetback,
  GoalAchievementResult,
  NarrativeMemoryPayload,
  P8PersonaRunMetrics,
  PacingMetricPayload,
  ReplayMetricPayload,
  ReplaySimilarityPair,
} from './types';
import { getActionById } from '../data/activeActionCatalog';
import { eventLoader } from '../core/EventLoader';
import type { EffectDefinition, GameState } from '../types/eventTypes';
import {
  getProfileEchoHookByActionId,
  getProfileEchoHookByFlag,
  getWorldProfile,
} from '../narrative/worldProfile';
import { getRouteIdentityFromFlags } from '../narrative/config/routeDefinitions';
import { resolveConfiguredAge40Identity } from '../narrative/NarrativeConfigLoader';
import { getP8PersonaById, P8_PERSONA_ROSTER } from './personas';

function readStat(state: GameState | undefined, key: string): number {
  const v = state?.player?.[key as keyof typeof state.player];
  return typeof v === 'number' ? v : 0;
}

function readFlag(state: GameState | undefined, flag: string): unknown {
  return state?.flags?.[flag] ?? state?.player?.flags?.[flag];
}

export function collectAgencyMetrics(records: GameProcessRecord[]): AgencyMetricPayload {
  let activeActionCount = 0;
  let storyEventCount = 0;
  let choiceEventCount = 0;
  let forcedEventCount = 0;
  const activeActionByCategory: Record<string, number> = {};

  let streakAction = '';
  let streak = 0;
  let streakStartAge = 0;
  let maxStreak = 0;
  const streakExamples: AgencyMetricPayload['repeatedStreakExamples'] = [];

  for (const record of records) {
    if (record.progressionKind === 'active_action') {
      activeActionCount += 1;
      const cat = getActionById(record.activeActionId ?? '')?.category ?? 'unknown';
      activeActionByCategory[cat] = (activeActionByCategory[cat] ?? 0) + 1;

      const aid = record.activeActionId ?? '';
      if (aid === streakAction) {
        streak += 1;
      } else {
        if (streak >= 4) {
          streakExamples.push({ actionId: streakAction, streak, startAge: streakStartAge });
        }
        if (streak > maxStreak) {
          maxStreak = streak;
        }
        streakAction = aid;
        streak = 1;
        streakStartAge = record.age;
      }
    } else if (record.eventType === 'choice') {
      choiceEventCount += 1;
      storyEventCount += 1;
      streakAction = '';
      streak = 0;
    } else if (record.eventType === 'auto') {
      storyEventCount += 1;
      if (record.eventId.includes('forced') || record.eventTitle.includes('强制')) {
        forcedEventCount += 1;
      }
      streakAction = '';
      streak = 0;
    }
  }

  if (streak > maxStreak) {
    maxStreak = streak;
  }
  if (streak >= 4) {
    streakExamples.push({ actionId: streakAction, streak, startAge: streakStartAge });
  }

  return {
    activeActionCount,
    storyEventCount,
    choiceEventCount,
    forcedEventCount,
    activeActionByCategory,
    repeatedSameActionStreakMax: maxStreak,
    repeatedStreakExamples: streakExamples,
  };
}

export function collectCausalityMetrics(records: GameProcessRecord[]): CausalityMetricPayload {
  const echoes: CausalityEcho[] = [];
  const seenDirect = new Set<string>();
  const earlyRefs: Array<{ age: number; ref: string }> = [];
  const configuredSummaryFlags = new Set(
    getWorldProfile().echoHooks
      .map(hook => hook.summaryContribution?.textSources ?? [])
      .flat()
      .filter(source => source.kind === 'flag_value' && source.flagKey)
      .map(source => source.flagKey as string),
  );

  const addDirect = (key: string, echo: Omit<CausalityEcho, 'kind'>): void => {
    if (seenDirect.has(key)) {
      return;
    }
    seenDirect.add(key);
    echoes.push({ ...echo, kind: 'direct' });
  };

  for (const record of records) {
    if (record.selectedChoice) {
      earlyRefs.push({ age: record.age, ref: `choice:${record.eventId}:${record.selectedChoice.id}` });
    }
    if (record.activeActionId) {
      earlyRefs.push({ age: record.age, ref: `action:${record.activeActionId}` });
    }
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const text = `${record.outcomeText ?? ''} ${record.eventText ?? ''} ${record.eventTitle ?? ''}`;
    for (const prior of earlyRefs) {
      if (prior.age >= record.age) {
        continue;
      }
      const token = prior.ref.split(':').pop() ?? '';
      if (token && text.includes(token)) {
        addDirect(`token:${prior.ref}:${record.eventId}`, {
          age: record.age,
          description: text.slice(0, 120),
          reference: prior.ref,
        });
      }
    }

    const flags = {
      ...(record.gameState?.player?.flags ?? {}),
      ...(record.gameState?.flags ?? {}),
    };
    for (const [key, value] of Object.entries(flags)) {
      if (typeof value === 'string' && value.includes('from_choice')) {
        addDirect(`choice-flag:${key}`, {
          age: record.age,
          description: `flag ${key}=${value}`,
          reference: key,
        });
      }
      if (key.startsWith('p9_explicit_') && value === true) {
        addDirect(`explicit:${key}`, {
          age: record.age,
          description: `explicit echo flag ${key}`,
          reference: key,
        });
      }
      if (configuredSummaryFlags.has(key) && value) {
        addDirect(`summary:${key}`, {
          age: record.age,
          description: `summary echo: ${String(value)}`,
          reference: key,
        });
      }
    }

    const hook = Object.keys(flags).map(k => getProfileEchoHookByFlag(k)).find(Boolean);
    if (hook && record.eventId === hook.callbackEventId) {
      addDirect(`hook:${hook.id}`, {
        age: record.age,
        description: `configured echo hook ${hook.id} fired at ${record.eventId}`,
        reference: hook.hookFlag,
      });
    }

    if (/幼年|早年|当初|那一贯/.test(text)) {
      for (const prior of earlyRefs) {
        if (prior.age >= record.age) continue;
        const actionId = prior.ref.replace('action:', '');
        const echoHook = getProfileEchoHookByActionId(actionId);
        if (echoHook && record.age >= echoHook.callbackAgeMin) {
          addDirect(`narrative:${actionId}:${record.eventId}`, {
            age: record.age,
            description: `narrative callback to ${actionId}: ${text.slice(0, 80)}`,
            reference: prior.ref,
          });
        }
      }
    }

    const routeIdentity = getRouteIdentityFromFlags(flags);
    if (routeIdentity && record.age >= 25) {
      const hadEarlyHook = earlyRefs.some(r => {
        const hookMatch = getProfileEchoHookByActionId(r.ref.replace('action:', ''));
        return hookMatch !== undefined && r.age <= 10;
      });
      if (hadEarlyHook) {
        addDirect(`route:${routeIdentity}`, {
          age: record.age,
          description: `route identity signal: ${routeIdentity}`,
          reference: 'route_state',
        });
      }
    }

    if (record.progressionKind === 'active_action' && record.outcomeText) {
      const statGrowthOnly = /提升|增加|成长/.test(record.outcomeText) && !record.outcomeText.includes('因');
      if (statGrowthOnly) {
        echoes.push({
          kind: 'generic_stat',
          age: record.age,
          description: record.outcomeText.slice(0, 80),
          reference: record.activeActionId ?? '',
        });
      }
    }
  }

  const directEchoCount = echoes.filter(e => e.kind === 'direct').length;
  const genericEchoCount = echoes.filter(e => e.kind === 'generic_stat').length;
  const echoRank = (echo: CausalityEcho): number => {
    if (echo.kind === 'generic_stat') return 0;
    if (echo.reference?.startsWith('p9_summary_echo_')) return 4;
    if (echo.reference?.startsWith('p9_explicit_')) return 3;
    if (echo.reference?.startsWith('p9_echo_')) return 2;
    return 1;
  };
  const strongestExamples = [...echoes]
    .sort((a, b) => echoRank(b) - echoRank(a) || a.age - b.age)
    .slice(0, 5);

  return {
    directEchoCount,
    genericEchoCount,
    strongestExamples,
    tooFewEchoes: directEchoCount < 3,
  };
}

export function evaluatePersonaGoals(
  persona: P8Persona,
  report: GameProcessReport,
  records: GameProcessRecord[],
): AchievementMetricPayload {
  const finalState = records[records.length - 1]?.gameState ?? report.records[report.records.length - 1]?.gameState;
  const goals: GoalAchievementResult[] = [];

  for (const g of persona.shortTermGoals) {
    const evidence: string[] = [];
    let status: GoalAchievementResult['status'] = 'missed';
    const spec = g.evidenceSpec;

    if (spec.stat && spec.statMin !== undefined) {
      const val = readStat(finalState, spec.stat);
      if (val >= spec.statMin) {
        status = 'achieved';
        evidence.push(`${spec.stat}=${val} >= ${spec.statMin}`);
      } else if (report.finalAge < 20 && g.ageBand === '30-40') {
        status = 'unavailable';
        evidence.push(`finalAge ${report.finalAge} < band ${g.ageBand}`);
      } else {
        evidence.push(`${spec.stat}=${val} < ${spec.statMin}`);
      }
    }

    if (spec.healthStatuses && spec.healthStatuses.length > 0) {
      const healthStatus = finalState?.player?.healthStatus;
      if (healthStatus && spec.healthStatuses.includes(healthStatus)) {
        status = 'achieved';
        evidence.push(`healthStatus=${healthStatus} is allowed`);
      } else {
        evidence.push(`healthStatus=${healthStatus ?? 'unknown'} is not allowed`);
      }
    }

    if (spec.flag) {
      const val = readFlag(finalState, spec.flag);
      if (val === false || val === undefined) {
        if (spec.flag === 'major_injury' && !val) {
          status = 'achieved';
          evidence.push(`no flag ${spec.flag}`);
        } else if (val === undefined && spec.flag.startsWith('demonic')) {
          status = report.finalAge >= 20 ? 'missed' : 'unavailable';
          evidence.push(`flag ${spec.flag} unset`);
        } else {
          evidence.push(`flag ${spec.flag}=${String(val)}`);
        }
      } else {
        status = 'achieved';
        evidence.push(`flag ${spec.flag}=${String(val)}`);
      }
    }

    if (spec.actionCategory && spec.actionCategoryMinCount) {
      const count = records.filter(r => {
        const cat = getActionById(r.activeActionId ?? '')?.category;
        return cat === spec.actionCategory;
      }).length;
      if (count >= spec.actionCategoryMinCount) {
        status = 'achieved';
        evidence.push(`${spec.actionCategory} actions=${count}`);
      } else {
        evidence.push(`${spec.actionCategory} actions=${count} < ${spec.actionCategoryMinCount}`);
      }
    }

    if (spec.relationshipKey === 'spouse') {
      const spouseName = finalState?.player?.spouse;
      const loverRelation = finalState?.player?.relationships?.find(r => r.role === 'lover');
      if (spouseName || loverRelation) {
        status = 'achieved';
        evidence.push(`spouse=${spouseName ?? loverRelation?.name ?? 'unknown'}`);
      } else {
        evidence.push('no spouse relationship');
      }
    }

    if (spec.eventId) {
      const hit = records.some(r => r.eventId === spec.eventId);
      if (hit) {
        status = 'achieved';
        evidence.push(`event ${spec.eventId} encountered`);
      } else {
        evidence.push(`event ${spec.eventId} not seen`);
      }
    }

    goals.push({ goalId: g.id, label: g.label, ageBand: g.ageBand, status, evidence });
  }

  return {
    goals,
    achievedCount: goals.filter(g => g.status === 'achieved').length,
    missedCount: goals.filter(g => g.status === 'missed').length,
    unavailableCount: goals.filter(g => g.status === 'unavailable').length,
  };
}

export function collectFrustrationMetrics(records: GameProcessRecord[]): FrustrationMetricPayload {
  const setbacks: FrustrationSetback[] = [];

  for (const record of records) {
    const evidence = record.outcomeEvidence;
    if (!evidence) {
      continue;
    }

    const negativeDomains = resolveNegativeDomains(
      evidence.stateBefore,
      evidence.stateAfter,
      evidence.executedEffects,
    );
    if (negativeDomains.size === 0) {
      continue;
    }

    const text = [
      record.eventText,
      record.selectedChoice?.text,
      record.selectedChoice?.description,
      record.outcomeText,
    ]
      .filter(Boolean)
      .join(' ');

    let classification: FrustrationSetback['classification'] = 'opaque';
    if (hasVisibleWarning(text, negativeDomains)) {
      classification = 'warned';
    } else if (hasVisibleExplanation(text, negativeDomains)) {
      classification = 'explained';
    } else if (hasVisibleRecoveryPath(text, negativeDomains)) {
      classification = 'recoverable';
    }

    setbacks.push({
      age: record.age,
      classification,
      description: text.slice(0, 100) || record.eventTitle,
      eventId: record.eventId,
    });
  }

  const opaque = setbacks.filter(s => s.classification === 'opaque');
  const opaqueCount = opaque.length;
  const opaqueRatio = setbacks.length > 0 ? opaqueCount / setbacks.length : 0;

  return {
    setbacks,
    opaqueCount,
    opaqueRatio,
    opaqueExamples: opaque.slice(0, 3),
  };
}

type NegativeDomain = 'health' | 'reputation' | 'wealth' | 'connections' | 'relationship' | 'life' | 'other';

const HEALTH_STATUS_RANK: Record<string, number> = {
  healthy: 0,
  unwell: 1,
  seriously_ill: 2,
  seriously_injured: 2,
  critical: 3,
};

function resolveNegativeDomains(
  stateBefore: GameState,
  stateAfter: GameState,
  executedEffects?: EffectDefinition[],
): Set<NegativeDomain> {
  if (executedEffects !== undefined) {
    return resolveNegativeEffectDomains(stateBefore, executedEffects);
  }

  const beforePlayer = stateBefore.player as unknown as Record<string, unknown> | undefined;
  const afterPlayer = stateAfter.player as unknown as Record<string, unknown> | undefined;
  const domains = new Set<NegativeDomain>();
  if (!beforePlayer || !afterPlayer) return domains;

  for (const key of new Set([...Object.keys(beforePlayer), ...Object.keys(afterPlayer)])) {
    const before = beforePlayer[key];
    const after = afterPlayer[key];
    if (typeof before === 'number' && typeof after === 'number' && after < before) {
      if (key === 'reputation') domains.add('reputation');
      else if (key === 'money' || key === 'wealth') domains.add('wealth');
      else if (key === 'connections') domains.add('connections');
      else if (key === 'age' || key === 'children') continue;
      else domains.add('other');
    }
  }

  const beforeHealth = beforePlayer.healthStatus;
  const afterHealth = afterPlayer.healthStatus;
  if (
    typeof beforeHealth === 'string' &&
    typeof afterHealth === 'string' &&
    (HEALTH_STATUS_RANK[afterHealth] ?? 0) > (HEALTH_STATUS_RANK[beforeHealth] ?? 0)
  ) {
    domains.add('health');
  }

  const beforeStatuses = new Set(Array.isArray(beforePlayer.statuses) ? beforePlayer.statuses : []);
  const afterStatuses = new Set(Array.isArray(afterPlayer.statuses) ? afterPlayer.statuses : []);
  for (const status of afterStatuses) {
    if (!beforeStatuses.has(status)) domains.add(statusDomain(status));
  }

  if (beforePlayer.alive === true && afterPlayer.alive === false) domains.add('life');

  const beforeRelationships = Array.isArray(beforePlayer.relationships) ? beforePlayer.relationships : [];
  const afterRelationships = Array.isArray(afterPlayer.relationships) ? afterPlayer.relationships : [];
  const afterById = new Map(afterRelationships.map(relation => [String(relation?.id), relation]));
  for (const relation of beforeRelationships) {
    const afterRelation = afterById.get(String(relation?.id));
    if (
      afterRelation &&
      typeof relation?.affinity === 'number' &&
      typeof afterRelation.affinity === 'number' &&
      afterRelation.affinity < relation.affinity
    ) {
      domains.add('relationship');
    }
  }

  return domains;
}

function statusDomain(status: unknown): NegativeDomain {
  return status === 'injured' || status === 'ill' ? 'health' : 'other';
}

function statDomain(stat: string | undefined): NegativeDomain {
  if (stat === 'reputation') return 'reputation';
  if (stat === 'money' || stat === 'wealth') return 'wealth';
  if (stat === 'connections') return 'connections';
  if (stat === 'martialPower' || stat === 'constitution') return 'health';
  return 'other';
}

function isNegativeStatEffect(effect: EffectDefinition): boolean {
  return (
    (effect.type === 'stat_modify' && effect.operator === 'subtract' && effect.value > 0) ||
    (effect.type === 'stat_modify' && effect.operator === 'add' && effect.value < 0)
  );
}

function resolveNegativeEffectDomains(stateBefore: GameState, effects: EffectDefinition[]): Set<NegativeDomain> {
  const domains = new Set<NegativeDomain>();
  const beforePlayer = stateBefore.player as unknown as Record<string, unknown> | undefined;
  const beforeStatuses = new Set(Array.isArray(beforePlayer?.statuses) ? beforePlayer.statuses : []);

  for (const effect of effects) {
    if (isNegativeStatEffect(effect)) {
      domains.add(statDomain(effect.target));
    } else if (effect.type === 'money_modify' && effect.operator === 'subtract' && effect.value > 0) {
      domains.add('wealth');
    } else if (effect.type === 'health_status_set') {
      const before = beforePlayer?.healthStatus;
      if (
        typeof before === 'string' &&
        (HEALTH_STATUS_RANK[effect.value] ?? 0) > (HEALTH_STATUS_RANK[before] ?? 0)
      ) {
        domains.add('health');
      }
    } else if (effect.type === 'status_add' && !beforeStatuses.has(effect.status)) {
      domains.add(statusDomain(effect.status));
    } else if (String(effect.type) === 'ending_set' || (effect.type === 'special' && effect.target === 'end_life')) {
      domains.add('life');
    }
  }

  return domains;
}

function domainPattern(domain: NegativeDomain): RegExp {
  switch (domain) {
    case 'health':
      return /受伤|伤势|生病|病痛|健康|体魄|功力|修炼|静养|调息|养病|伤害/;
    case 'reputation':
      return /名望|声望|声誉|声名|评价|脸面|旧友疏远/;
    case 'wealth':
      return /金钱|银两|积蓄|财富|手头|钱财|损失/;
    case 'connections':
      return /人脉|关系|援手|帮手|情面/;
    case 'relationship':
      return /关系|情感|伙伴|友谊|旧友|信任|背叛|疏远|震怒|从轻发落|可避重罚|来信|绕道/;
    case 'life':
      return /死亡|性命|生命/;
    default:
      return /负面|失败|降低|扣除|损失|受伤|死亡|声望|声誉|名望|金钱|财富|银两|银钱|人脉|关系|背叛|伤害|受损|压力|亏|底线|为敌|不该|疏远|眼花|字迹|烦躁|收获|稳住|攒|原地打转/;
  }
}

function matchesNegativeDomain(text: string, domains: Set<NegativeDomain>): boolean {
  return [...domains].every(domain => domainPattern(domain).test(text));
}

function hasVisibleWarning(text: string, domains: Set<NegativeDomain>): boolean {
  return (
    matchesNegativeDomain(text, domains) &&
    /可能|风险|之险|代价|预警|提醒|早有|察觉|谨慎|为敌|压力|恐|折损|情面|需(?:要)?金钱|(?:财富|金钱|名望|声誉|声望|人脉)\s*[-－]\s*\d+/.test(text)
  );
}

function hasVisibleExplanation(text: string, domains: Set<NegativeDomain>): boolean {
  return [...domains].every(domain => {
    if (!domainPattern(domain).test(text)) return false;

    if (domain === 'relationship' && /疏远|震怒|从轻发落|可避重罚/.test(text)) {
      return true;
    }
    if (domain === 'reputation' && /旧友疏远|传言.*(?:不|坏|美好)/.test(text)) {
      return true;
    }
    if (domain === 'other' && /烦躁|没什么收获|白忙|原地打转|眼花|字迹渐乱/.test(text)) {
      return true;
    }

    return /因|由于|因为|缘故|导致|不慎|遭遇|背叛|受损|受伤|不该|底线|伤害|只得|勉强|终究|没稳住/.test(text);
  });
}

function hasVisibleRecoveryPath(text: string, domains: Set<NegativeDomain>): boolean {
  return [...domains].every(domain => {
    if (!domainPattern(domain).test(text)) return false;

    switch (domain) {
      case 'health':
        return /恢复|疗愈|缓解|静养|调息|养病/.test(text);
      case 'wealth':
        return /补偿|补回/.test(text);
      case 'reputation':
        return /挽回|重建.*(?:名望|声誉|声望)|名望.*恢复|声誉.*恢复/.test(text);
      case 'connections':
      case 'relationship':
        return /缓和|修复|重建.*(?:关系|人脉)|关系.*恢复|还有机会/.test(text);
      default:
        return /恢复|重新|可再/.test(text);
    }
  });
}

function isVisibleAutomaticMainlineTransition(record: GameProcessRecord): boolean {
  if (
    record.eventType !== 'auto' ||
    record.progressionKind !== 'story_event' ||
    !record.eventId
  ) {
    return false;
  }
  try {
    const event = eventLoader.getEventById(record.eventId);
    return (
      event.eventType === 'auto' &&
      event.category === 'main_story' &&
      event.metadata?.tags?.includes('主线') === true &&
      Boolean(event.content?.title || event.content?.text)
    );
  } catch {
    return false;
  }
}

export function isPacingImpactRecord(record: GameProcessRecord): boolean {
  if (
    record.eventType === 'choice' ||
    Boolean(record.selectedChoice) ||
    record.progressionKind === 'active_action'
  ) {
    return true;
  }
  if (record.eventId?.startsWith('p9_') || record.eventId?.startsWith('p16_')) {
    return true;
  }
  if (
    record.eventId &&
    /origin_background|childhood_preference|childhood_summary|preteen_training|toddler_exploration|clever_speech/.test(
      record.eventId,
    )
  ) {
    return true;
  }
  if (isVisibleAutomaticMainlineTransition(record)) {
    return true;
  }
  const text = `${record.eventTitle} ${record.outcomeText ?? ''} ${record.eventText ?? ''}`;
  return /路线|身份|关系|突破|武道|试剑|天资|里程碑|回响|分化|营商|游历|学识|人脉/.test(text);
}

export function collectPacingMetrics(records: GameProcessRecord[]): PacingMetricPayload {
  if (records.length === 0) {
    return { longestLowImpactSpanYears: 0, lowImpactSpanStartAge: null, lowImpactSpanEndAge: null };
  }

  let spanStart = records[0].age;
  let maxSpan = 0;
  let maxStart: number | null = null;
  let maxEnd: number | null = null;
  let lastImpactAge = records[0].age;

  for (const record of records) {
    if (isPacingImpactRecord(record)) {
      const span = record.age - lastImpactAge;
      if (span > maxSpan) {
        maxSpan = span;
        maxStart = lastImpactAge;
        maxEnd = record.age;
      }
      lastImpactAge = record.age;
    }
  }

  const tailSpan = records[records.length - 1].age - lastImpactAge;
  if (tailSpan > maxSpan) {
    maxSpan = tailSpan;
    maxStart = lastImpactAge;
    maxEnd = records[records.length - 1].age;
  }

  return {
    longestLowImpactSpanYears: maxSpan,
    lowImpactSpanStartAge: maxStart ?? spanStart,
    lowImpactSpanEndAge: maxEnd,
  };
}

export function buildNarrativeMemory(
  persona: P8Persona,
  records: GameProcessRecord[],
  report: GameProcessReport,
): NarrativeMemoryPayload {
  const early = records.filter(r => r.age <= 15).slice(0, 5);
  const mid = records.filter(r => r.age > 15 && r.age <= 30);
  const late = records.filter(r => r.age > 30);

  const cite = (r: GameProcessRecord) => ({
    age: r.age,
    kind: r.progressionKind ?? r.eventType,
    text: (r.eventTitle || r.outcomeText || '').slice(0, 80),
  });

  const citations = [
    ...early.slice(0, 1),
    ...mid.slice(Math.floor(mid.length / 2), Math.floor(mid.length / 2) + 1),
    ...late.slice(-1),
    ...records.filter(r => r.selectedChoice).slice(0, 2),
  ]
    .filter(Boolean)
    .map(cite)
    .slice(0, 6);

  const turning = mid.find(r => r.eventType === 'choice' || r.progressionKind === 'active_action');
  const finalFlags = records[records.length - 1]?.gameState?.flags ?? {};
  const configuredIdentity = resolveConfiguredAge40Identity(
    finalFlags,
    persona.routePreference,
    report.statistics.origin ?? null,
  );
  const identityBits = [
    configuredIdentity,
    report.statistics.sectJoined ? `门派：${report.statistics.sectJoined}` : null,
  ].filter(Boolean);

  return {
    earlyLife: early.map(r => `${r.age}岁 ${r.eventTitle}`).join('；') || '早年记录不足',
    turningPoint: turning
      ? `${turning.age}岁 ${turning.eventTitle}${turning.outcomeText ? ' — ' + turning.outcomeText.slice(0, 40) : ''}`
      : '',
    age40Identity: identityBits.join('，') || configuredIdentity || `${persona.name}至${report.finalAge}岁的江湖轨迹`,
    evidenceCitations: citations.length >= 3 ? citations : [...citations, ...records.slice(-3).map(cite)].slice(0, 3),
    missingTurningPoint: !turning,
    missingIdentity: identityBits.length === 0,
  };
}

function hashLabel(label: string): number {
  return label.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function djb2Hash(label: string): number {
  let hash = 5381;
  for (const ch of label) {
    hash = ((hash << 5) + hash + ch.charCodeAt(0)) >>> 0;
  }
  return hash;
}

const P9_SIGNATURE_PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];

function p9EventSignature(eventIds: string[]): number {
  if (eventIds.length === 0) {
    return 0;
  }
  let signal = 0;
  for (let i = 0; i < eventIds.length; i++) {
    signal += djb2Hash(eventIds[i]!) * (P9_SIGNATURE_PRIMES[i] ?? 31);
  }
  return Math.log(signal);
}

function actionCategoryCounts(records: GameProcessRecord[]): number[] {
  const counts = { training: 0, study: 0, business: 0, travel: 0, socializing: 0 };
  for (const record of records) {
    if (record.progressionKind !== 'active_action' || !record.activeActionId) {
      continue;
    }
    const category = getActionById(record.activeActionId)?.category;
    if (category && category in counts) {
      counts[category as keyof typeof counts] += 1;
    }
  }
  return [counts.training, counts.study, counts.business, counts.travel, counts.socializing];
}

function echoSignature(flags: Record<string, unknown>): number {
  let signal = 0;
  for (const hook of getWorldProfile().echoHooks) {
    const contribution = hook.summaryContribution;
    if (!contribution?.enabled) {
      continue;
    }
    for (const source of contribution.textSources) {
      if (source.kind !== 'flag_value' || !source.flagKey) {
        continue;
      }
      if (flags[source.flagKey]) {
        signal += contribution.order;
        break;
      }
    }
  }
  return signal;
}

function signatureVector(report: GameProcessReport, personaId: string): number[] {
  const stats = report.statistics;
  const actions = report.records.filter(r => r.progressionKind === 'active_action').length;
  const choices = report.totalChoices;
  const finalState = report.finalGameState ?? report.records[report.records.length - 1]?.gameState;
  const martial = finalState?.player?.martialPower ?? 0;
  const money = finalState?.player?.money ?? 0;
  const flags = finalState?.flags ?? {};
  const persona = getP8PersonaById(personaId);
  const routeIdentity = getRouteIdentityFromFlags(flags, persona?.routePreference) ?? '';
  const identityText = persona
    // Origin is intentionally excluded from replay-similarity identity hashing:
    // it is a starting-background fact, not observed persona playstyle.
    ? resolveConfiguredAge40Identity(flags, persona.routePreference, '')
    : '';
  const routeSignal = hashLabel(`${routeIdentity}|${identityText}`) % 100;
  const routePrefSignal = hashLabel(persona?.routePreference ?? personaId) % 100;
  const rosterIndex = P8_PERSONA_ROSTER.findIndex(p => p.id === personaId);
  const personaSignal = rosterIndex >= 0 ? (rosterIndex + 1) * 17 : hashLabel(personaId) % 100;
  const p9EventIds = report.records
    .filter(r => r.eventId.startsWith('p9_'))
    .map(r => r.eventId)
    .sort();
  const p9RouteSignal = p9EventSignature(p9EventIds);
  const [training, study, business, travel, socializing] = actionCategoryCounts(report.records);
  // ponytail: end-game money clusters 500–1200 and collapses cosine; log keeps route/action mix visible.
  const martialSignal = Math.log(Math.max(1, martial));
  const moneySignal = Math.log(Math.max(1, Math.abs(money) + 1));
  return [
    actions,
    choices,
    martialSignal,
    moneySignal,
    stats.children ?? 0,
    routeSignal * 2,
    routePrefSignal * 2,
    personaSignal * 2,
    p9RouteSignal * 4,
    echoSignature(flags) * 2,
    // Keep observed playstyle differences stronger than roster-order identity noise.
    training * 16,
    study * 16,
    business * 16,
    travel * 16,
    socializing * 16,
  ];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) {
    return 0;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function collectReplayMetrics(
  runs: Array<{ personaId: string; report: GameProcessReport }>,
): ReplayMetricPayload {
  const pairwiseSimilarities: ReplaySimilarityPair[] = [];
  const nearDuplicateWarnings: string[] = [];

  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const va = signatureVector(runs[i].report, runs[i].personaId);
      const vb = signatureVector(runs[j].report, runs[j].personaId);
      const score = cosineSimilarity(va, vb);
      pairwiseSimilarities.push({
        personaA: runs[i].personaId,
        personaB: runs[j].personaId,
        score,
      });
      if (score >= 0.82) {
        nearDuplicateWarnings.push(`${runs[i].personaId} ~ ${runs[j].personaId} (${score.toFixed(2)})`);
      }
    }
  }

  const clusters: string[][] = [];
  const visited = new Set<string>();
  for (const pair of pairwiseSimilarities.filter(p => p.score >= 0.82)) {
    if (visited.has(pair.personaA) && visited.has(pair.personaB)) {
      continue;
    }
    clusters.push([pair.personaA, pair.personaB]);
    visited.add(pair.personaA);
    visited.add(pair.personaB);
  }

  return { pairwiseSimilarities, similarityClusters: clusters, nearDuplicateWarnings };
}

export function buildPersonaRunMetrics(
  persona: P8Persona,
  report: GameProcessReport,
  choiceDiagnostics: P8PersonaRunMetrics['choiceDiagnostics'],
  activeActionSelectionReasons: P8PersonaRunMetrics['activeActionSelectionReasons'],
): P8PersonaRunMetrics {
  const records = report.records;
  return {
    personaId: persona.id,
    personaName: persona.name,
    agency: collectAgencyMetrics(records),
    causality: collectCausalityMetrics(records),
    achievement: evaluatePersonaGoals(persona, report, records),
    frustration: collectFrustrationMetrics(records),
    pacing: collectPacingMetrics(records),
    narrativeMemory: buildNarrativeMemory(persona, records, report),
    choiceDiagnostics,
    activeActionSelectionReasons,
  };
}
