import type { GameProcessRecord } from '../types/simulationRecordTypes';
import type { GameProcessReport } from '../../tests/GameProcessSimulator';
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
import type { GameState } from '../types/eventTypes';
import {
  getProfileEchoHookByActionId,
  getProfileEchoHookByFlag,
  getWorldProfile,
} from '../narrative/worldProfile';
import { getRouteIdentityFromFlags } from '../narrative/config/routeDefinitions';
import { resolveConfiguredAge40Identity } from '../narrative/NarrativeConfigLoader';
import { getP8PersonaById } from './personas';

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

    const flags = record.gameState?.flags ?? {};
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

    const identity = record.gameState?.identity?.primary;
    if (identity && record.age >= 20) {
      const earlyAction = earlyRefs.find(r => r.ref.startsWith('action:') && r.age <= 8);
      if (earlyAction && /merchant|hero|scholar|outlaw/.test(identity)) {
        addDirect(`identity:${identity}`, {
          age: record.age,
          description: `identity label ${identity} follows early ${earlyAction.ref}`,
          reference: `identity:${identity}`,
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
  const strongestExamples = [...echoes]
    .sort((a, b) => (a.kind === 'direct' ? 1 : 0) - (b.kind === 'direct' ? 1 : 0))
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
    const text = record.outcomeText ?? record.eventText ?? '';
    const negative =
      /损失|受伤|失败|降低|扣除|危机|重创|死亡/.test(text) ||
      (record.gameState?.player?.health !== undefined && record.gameState.player.health < 40);

    if (!negative) {
      continue;
    }

    let classification: FrustrationSetback['classification'] = 'opaque';
    if (/预警|提醒|早有|察觉/.test(text)) {
      classification = 'warned';
    } else if (/因为|由于|缘故|导致/.test(text)) {
      classification = 'explained';
    } else if (/恢复|疗愈|补偿|可再|还有机会/.test(text)) {
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
  const finalState = report.records[report.records.length - 1]?.gameState;
  const martial = finalState?.player?.martialPower ?? 0;
  const money = finalState?.player?.money ?? 0;
  const flags = finalState?.flags ?? {};
  const persona = getP8PersonaById(personaId);
  const routeIdentity = getRouteIdentityFromFlags(flags, persona?.routePreference) ?? '';
  const identityText = persona
    ? resolveConfiguredAge40Identity(flags, persona.routePreference, report.statistics.origin ?? null)
    : '';
  const routeSignal = hashLabel(`${routeIdentity}|${identityText}`) % 100;
  const routePrefSignal = hashLabel(persona?.routePreference ?? personaId) % 100;
  const personaSignal = hashLabel(personaId) % 100;
  const [training, study, business, travel, socializing] = actionCategoryCounts(report.records);
  return [
    actions,
    choices,
    martial,
    money,
    stats.children ?? 0,
    routeSignal,
    routePrefSignal,
    personaSignal,
    echoSignature(flags),
    training * 12,
    study * 12,
    business * 12,
    travel * 12,
    socializing * 12,
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
