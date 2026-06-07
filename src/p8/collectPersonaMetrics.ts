import type { GameProcessRecord, GameProcessReport } from '../../tests/GameProcessSimulator';
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
  const earlyRefs: Array<{ age: number; ref: string }> = [];

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
        echoes.push({
          kind: 'direct',
          age: record.age,
          description: text.slice(0, 120),
          reference: prior.ref,
        });
      }
    }

    const flags = record.gameState?.flags ?? {};
    for (const [key, value] of Object.entries(flags)) {
      if (typeof value === 'string' && value.includes('from_choice')) {
        echoes.push({
          kind: 'direct',
          age: record.age,
          description: `flag ${key}=${value}`,
          reference: key,
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

export function collectPacingMetrics(records: GameProcessRecord[]): PacingMetricPayload {
  if (records.length === 0) {
    return { longestLowImpactSpanYears: 0, lowImpactSpanStartAge: null, lowImpactSpanEndAge: null };
  }

  let spanStart = records[0].age;
  let maxSpan = 0;
  let maxStart: number | null = null;
  let maxEnd: number | null = null;
  let lastImpactAge = records[0].age;

  const isImpact = (r: GameProcessRecord): boolean =>
    r.eventType === 'choice' ||
    Boolean(r.selectedChoice) ||
    r.progressionKind === 'active_action' ||
    /路线|身份|关系|突破/.test(`${r.eventTitle} ${r.outcomeText ?? ''}`);

  for (const record of records) {
    if (isImpact(record)) {
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
  const identityBits = [
    report.statistics.sectJoined ? `门派：${report.statistics.sectJoined}` : null,
    report.statistics.origin ? `出身：${report.statistics.origin}` : null,
    report.statistics.endingSummary ? report.statistics.endingSummary.slice(0, 60) : null,
    persona.routePreference !== 'balanced' ? `倾向：${persona.routePreference}` : null,
  ].filter(Boolean);

  return {
    earlyLife: early.map(r => `${r.age}岁 ${r.eventTitle}`).join('；') || '早年记录不足',
    turningPoint: turning
      ? `${turning.age}岁 ${turning.eventTitle}${turning.outcomeText ? ' — ' + turning.outcomeText.slice(0, 40) : ''}`
      : '',
    age40Identity: identityBits.join('，') || `${persona.name}至${report.finalAge}岁的江湖轨迹`,
    evidenceCitations: citations.length >= 3 ? citations : [...citations, ...records.slice(-3).map(cite)].slice(0, 3),
    missingTurningPoint: !turning,
    missingIdentity: identityBits.length === 0,
  };
}

function signatureVector(report: GameProcessReport, personaId: string): number[] {
  const stats = report.statistics;
  const actions = report.records.filter(r => r.progressionKind === 'active_action').length;
  const choices = report.totalChoices;
  const martial = report.records[report.records.length - 1]?.gameState?.player?.martialPower ?? 0;
  const money = report.records[report.records.length - 1]?.gameState?.player?.money ?? 0;
  const seedHash = personaId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return [actions, choices, martial, money, stats.children ?? 0, seedHash % 100];
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
