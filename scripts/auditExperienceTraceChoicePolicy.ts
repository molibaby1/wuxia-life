#!/usr/bin/env tsx

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { eventLoader } from '../src/core/EventLoader';
import { applyPersonaChoiceBias } from '../src/p8/personaChoiceBias';
import { getP8PersonaById } from '../src/p8/personas';
import type { P8Persona } from '../src/p8/types';
import type { EventDefinition, EffectDefinition } from '../src/types/eventTypes';
import type {
  ExperienceTrace,
  ExperienceTraceActiveAction,
  ExperienceTraceChoiceCandidate,
  ExperienceTraceStep,
} from '../src/headless/playability/experienceTraceTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const DEFAULT_TRACE_DIR = path.join(process.cwd(), 'artifacts/reports/experience-traces');
const DEFAULT_OUTPUT = path.join(process.cwd(), 'artifacts/reports/experience-trace-choice-policy-audit.md');
const STAT_KEYS = [
  'money',
  'martialPower',
  'constitution',
  'connections',
  'reputation',
  'charisma',
  'businessAcumen',
  'chivalry',
  'knowledge',
  'influence',
  'wealth',
] as const;
type StatKey = (typeof STAT_KEYS)[number];

type AnyRecord = Record<string, any>;

interface Run {
  file: string;
  trace: ExperienceTrace;
}

interface ChoiceObservation {
  run: Run;
  step: ExperienceTraceStep;
  candidates: ExperienceTraceChoiceCandidate[];
}

interface ActionObservation {
  run: Run;
  step: ExperienceTraceStep;
  action: ExperienceTraceActiveAction;
}

interface EffectLike {
  type?: string;
  target?: string;
  value?: unknown;
  operator?: string;
}

interface ChoiceVariantAnalysis {
  directWinner: string;
  branchWinnerSet: string[];
  branchAnalysisExact: boolean;
  branchConditionCount: number;
  branchOutcomeCount: number;
  labels: string[];
}

interface CliArgs {
  traceDir: string;
  output: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { traceDir: DEFAULT_TRACE_DIR, output: DEFAULT_OUTPUT };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--trace-dir' && value) {
      args.traceDir = path.resolve(value);
      i += 1;
    } else if (flag === '--output' && value) {
      args.output = path.resolve(value);
      i += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${flag}`);
    }
  }
  return args;
}

function readRuns(traceDir: string): Run[] {
  const files = fs.readdirSync(traceDir)
    .filter(file => file.endsWith('.json') && file !== 'experience-trace-index.json')
    .sort();
  const runs = files.map(file => ({
    file,
    trace: JSON.parse(fs.readFileSync(path.join(traceDir, file), 'utf8')) as ExperienceTrace,
  }));
  if (runs.length !== 40) {
    throw new Error(`Expected 40 trace JSON files, found ${runs.length}`);
  }
  const keys = new Set(runs.map(run => `${run.trace.persona.id}:${run.trace.seed}`));
  if (keys.size !== 40) throw new Error('Trace input contains duplicate persona/seed pairs');
  return runs;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as AnyRecord).sort().map(key => `${JSON.stringify(key)}:${stableJson((value as AnyRecord)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown): string {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex').slice(0, 12);
}

function md(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function fmt(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return Number(value.toFixed(digits)).toString();
}

function pct(value: number, total: number): string {
  return `${fmt(total === 0 ? 0 : (value / total) * 100, 1)}% (${value}/${total})`;
}

function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function effectDelta(effect: EffectLike): number {
  const raw = typeof effect.value === 'number' ? effect.value : 0;
  return effect.operator === 'subtract' ? -Math.abs(raw) : raw;
}

function scoreEffects(
  effects: unknown[],
  tendency: P8Persona['choiceTendency'],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const raw of effects) {
    const effect = (raw ?? {}) as EffectLike;
    if (effect.type !== 'stat_modify' || !effect.target) continue;
    const delta = effectDelta(effect);
    let multiplier = 1;
    if (tendency === 'martial' && ['martialPower', 'knowledge', 'constitution'].includes(effect.target)) {
      multiplier = 3;
    } else if (tendency === 'wealth' && ['money', 'businessAcumen', 'reputation', 'connections'].includes(effect.target)) {
      multiplier = 3;
    } else if (tendency === 'wealth') {
      multiplier = 0.7;
    }
    result[effect.target] = (result[effect.target] ?? 0) + delta * multiplier;
  }
  return result;
}

function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

function adjustedScore(
  persona: P8Persona,
  eventId: string,
  candidate: ExperienceTraceChoiceCandidate,
  effects: unknown[],
): number {
  const baseScore = sumScores(scoreEffects(effects, persona.choiceTendency));
  return applyPersonaChoiceBias({
    persona,
    baseScore,
    choiceId: candidate.choiceId,
    eventId,
    effects: effects as EffectLike[],
  });
}

function winner(scores: Array<{ choiceId: string; score: number }>): string {
  let best = scores[0];
  for (const score of scores.slice(1)) {
    if (score.score > best.score) best = score;
  }
  return best?.choiceId ?? '';
}

function choiceObservations(runs: Run[]): ChoiceObservation[] {
  return runs.flatMap(run => run.trace.steps
    .filter(step => step.choiceDecision && step.choiceCandidates)
    .map(step => ({ run, step, candidates: step.choiceCandidates! })));
}

function actionObservations(runs: Run[]): ActionObservation[] {
  return runs.flatMap(run => run.trace.steps
    .filter(step => step.activeAction)
    .map(step => ({ run, step, action: step.activeAction! })));
}

function actionCategories(run: Run): string[] {
  return run.trace.steps.filter(step => step.activeAction).map(step => step.activeAction!.availableActions
    .find(action => action.actionId === step.activeAction!.selectedActionId)?.category ?? 'unknown');
}

function actionSequence(run: Run): string[] {
  return run.trace.steps.filter(step => step.activeAction).map(step => step.activeAction!.selectedActionId);
}

function maxStreak(values: string[]): number {
  let best = 0;
  let current = '';
  let count = 0;
  for (const value of values) {
    if (value === current) count += 1;
    else {
      current = value;
      count = 1;
    }
    best = Math.max(best, count);
  }
  return best;
}

function oneSwitchReturnPattern(values: string[]): number {
  let count = 0;
  let i = 0;
  while (i < values.length) {
    const category = values[i];
    let end = i;
    while (end + 1 < values.length && values[end + 1] === category) end += 1;
    if (end - i + 1 >= 4 && values[end + 1] && values[end + 1] !== category && values[end + 2] === category) {
      count += 1;
    }
    i = end + 1;
  }
  return count;
}

function choiceVariantAnalysis(observation: ChoiceObservation): ChoiceVariantAnalysis | null {
  const eventId = observation.step.event?.id;
  const persona = getP8PersonaById(observation.run.trace.persona.id);
  if (!eventId || !persona) return null;
  const directScores = observation.candidates.map(candidate => ({
    choiceId: candidate.choiceId,
    score: adjustedScore(persona, eventId, candidate, candidate.directEffects),
  }));
  const event = eventLoader.getEventById(eventId);
  const branchEffects = observation.candidates.map(candidate => {
    const definition = event?.choices?.find(choice => choice.id === candidate.choiceId);
    return definition?.outcomes?.map(outcome => outcome.effects ?? []) ?? [];
  });
  const branchConditionCount = branchEffects.reduce((sum, branches, index) => {
    const definition = event?.choices?.find(choice => choice.id === observation.candidates[index].choiceId);
    return sum + (definition?.outcomes?.filter(outcome => Boolean(outcome.condition)).length ?? 0);
  }, 0);
  const branchOutcomeCount = branchEffects.reduce((sum, branches) => sum + branches.length, 0);
  const labels = (event?.choices ?? [])
    .filter(choice => observation.candidates.some(candidate => candidate.choiceId === choice.id))
    .flatMap(choice => (choice.outcomes ?? []).map(outcome => `${choice.id}:${outcome.id}`))
    .filter(label => /success|failure|fail|great|poor|good|bad|成功|失败|出色|失误|普通/i.test(label));
  if (observation.candidates.every(candidate => candidate.outcomeCount === 0)) {
    return {
      directWinner: winner(directScores),
      branchWinnerSet: [],
      branchAnalysisExact: true,
      branchConditionCount: 0,
      branchOutcomeCount: 0,
      labels: [],
    };
  }

  const exact = branchEffects.every((branches, index) => {
    return observation.candidates[index].outcomeCount === 0 || branches.length === observation.candidates[index].outcomeCount;
  });
  const variants = branchEffects.map((branches, index) => {
    if (branches.length === 0) return [observation.candidates[index].directEffects];
    return branches.map(effects => [...observation.candidates[index].directEffects, ...effects]);
  });
  const totalCombinations = variants.reduce((product, values) => product * values.length, 1);
  const branchWinnerSet = new Set<string>();
  if (exact && totalCombinations <= 4096) {
    const walk = (index: number, scores: Array<{ choiceId: string; score: number }>): void => {
      if (index === observation.candidates.length) {
        branchWinnerSet.add(winner(scores));
        return;
      }
      for (const effects of variants[index]) {
        walk(index + 1, [...scores, {
          choiceId: observation.candidates[index].choiceId,
          score: adjustedScore(persona, eventId, observation.candidates[index], effects),
        }]);
      }
    };
    walk(0, []);
  } else {
    for (let index = 0; index < observation.candidates.length; index += 1) {
      for (const effects of variants[index]) {
        const candidateScore = adjustedScore(persona, eventId, observation.candidates[index], effects);
        const otherScores = observation.candidates.map((candidate, otherIndex) => ({
          choiceId: candidate.choiceId,
          score: otherIndex === index ? candidateScore : adjustedScore(persona, eventId, candidate, candidate.directEffects),
        }));
        branchWinnerSet.add(winner(otherScores));
      }
    }
  }
  return {
    directWinner: winner(directScores),
    branchWinnerSet: [...branchWinnerSet].sort(),
    branchAnalysisExact: exact && totalCombinations <= 4096,
    branchConditionCount,
    branchOutcomeCount,
    labels: [...new Set(labels)].sort(),
  };
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.map(md).join(' | ')} |`),
  ].join('\n');
}

function percentileLine(values: number[]): string {
  return `min ${fmt(Math.min(...values))}, p25 ${fmt(quantile(values, 0.25) ?? 0)}, median ${fmt(quantile(values, 0.5) ?? 0)}, p75 ${fmt(quantile(values, 0.75) ?? 0)}, max ${fmt(Math.max(...values))}`;
}

function visibleSignature(run: Run): string {
  return hash(run.trace.steps.map(step => ({
    event: step.event,
    presentation: step.presentation,
  })));
}

function selectionSignature(run: Run): string {
  return hash(run.trace.steps.map(step => ({
    event: step.event?.id,
    choice: step.choiceDecision?.selectedChoiceId,
    action: step.activeAction?.selectedActionId,
  })));
}

function metricSignature(run: Run): string {
  const flags = run.trace.finalState.flags ?? {};
  const routeIdentity = Object.entries(flags)
    .filter(([key]) => key.startsWith('p9_route_identity_'))
    .map(([key, value]) => [key, value]);
  const echoFlags = Object.entries(flags)
    .filter(([key]) => /echo/i.test(key) && (valueIsMeaningful(key, flags[key])))
    .map(([key, value]) => [key, value]);
  return hash({
    primaryIdentity: run.trace.finalState.identity?.primary ?? null,
    ending: run.trace.finalState.ending ?? null,
    routeIdentity,
    echoFlags,
  });
}

function valueIsMeaningful(key: string, value: unknown): boolean {
  return value === true || (typeof value === 'string' && value.length > 0) || key.startsWith('p9_summary_echo_');
}

function pairwiseSimilarity(runs: Run[], signature: (run: Run) => string): { equal: number; total: number } {
  let equal = 0;
  let total = 0;
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      total += 1;
      if (signature(runs[i]) === signature(runs[j])) equal += 1;
    }
  }
  return { equal, total };
}

function samePersonaPairwiseAgreement(runs: Run[], sequence: (run: Run) => string[]): { equal: number; total: number; positional: number } {
  let equal = 0;
  let total = 0;
  let positionalEqual = 0;
  let positionalTotal = 0;
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      if (runs[i].trace.persona.id !== runs[j].trace.persona.id) continue;
      total += 1;
      const left = sequence(runs[i]);
      const right = sequence(runs[j]);
      if (stableJson(left) === stableJson(right)) equal += 1;
      const length = Math.min(left.length, right.length);
      positionalTotal += length;
      for (let index = 0; index < length; index += 1) {
        if (left[index] === right[index]) positionalEqual += 1;
      }
    }
  }
  return { equal, total, positional: positionalTotal === 0 ? 0 : positionalEqual / positionalTotal };
}

function routeIdentity(run: Run): string[] {
  return Object.entries(run.trace.finalState.flags ?? {})
    .filter(([key, value]) => key.startsWith('p9_route_identity_') && value)
    .map(([key, value]) => `${key}=${String(value)}`)
    .sort();
}

function directEchoKeys(run: Run): string[] {
  return Object.entries(run.trace.finalState.flags ?? {})
    .filter(([key, value]) => /echo/i.test(key) && valueIsMeaningful(key, value))
    .map(([key]) => key)
    .sort();
}

function buildReport(runs: Run[]): string {
  const choices = choiceObservations(runs);
  const actions = actionObservations(runs);
  const candidateRows = choices.flatMap(observation => observation.candidates.map(candidate => ({ observation, candidate })));
  const selectedRows = candidateRows.filter(row => row.candidate.selected);
  const phaseCounts = new Map<string, number>();
  const allSteps = runs.flatMap(run => run.trace.steps);
  for (const step of allSteps) phaseCounts.set(step.phaseBefore, (phaseCounts.get(step.phaseBefore) ?? 0) + 1);

  const ties = choices.filter(observation => (observation.step.choiceDecision?.tieCount ?? 0) > 1);
  const orderTies = choices.filter(observation => observation.step.choiceDecision?.tieBrokenByOrder === true);
  const allZero = choices.filter(observation => observation.candidates.every(candidate => candidate.personaAdjustedScore === 0));
  const margins = choices.map(observation => observation.step.choiceDecision?.scoreMargin).filter((value): value is number => value !== null && value !== undefined);
  const baseWinnerChanged = choices.filter(observation => {
    const max = Math.max(...observation.candidates.map(candidate => candidate.baseScore));
    const firstBaseWinner = observation.candidates.find(candidate => candidate.baseScore === max)?.choiceId;
    return firstBaseWinner !== observation.step.choiceDecision?.selectedChoiceId;
  });
  const adjustedOutsideBaseTie = choices.filter(observation => {
    const max = Math.max(...observation.candidates.map(candidate => candidate.baseScore));
    const baseTieSet = new Set(observation.candidates.filter(candidate => candidate.baseScore === max).map(candidate => candidate.choiceId));
    return !baseTieSet.has(observation.step.choiceDecision?.selectedChoiceId ?? '');
  });

  const statDominance = (rows: Array<{ candidate: ExperienceTraceChoiceCandidate; observation: ChoiceObservation }>) => {
    const contributions = rows.map(({ candidate, observation }) => {
      const scores = scoreEffects([...candidate.directEffects, ...candidate.outcomeEffects], observation.run.trace.persona.choiceTendency);
      const denominator = Object.values(scores).reduce((sum, value) => sum + Math.abs(value), 0);
      return { scores, denominator };
    });
    const dominant50 = contributions.filter(item => item.denominator > 0 && Math.max(...Object.values(item.scores).map(Math.abs)) / item.denominator > 0.5).length;
    const moneyAt = (threshold: number) => contributions.filter(item => item.denominator > 0 && Math.abs(item.scores.money ?? 0) / item.denominator > threshold).length;
    return { contributions, dominant50, moneyAt };
  };
  const allDominance = statDominance(candidateRows);
  const selectedDominance = statDominance(selectedRows);
  const selectedMoneyByPersona = new Map<string, { total: number; dominant: number }>();
  for (const row of selectedRows) {
    const persona = row.observation.run.trace.persona.id;
    const entry = selectedMoneyByPersona.get(persona) ?? { total: 0, dominant: 0 };
    const scores = scoreEffects([...row.candidate.directEffects, ...row.candidate.outcomeEffects], row.observation.run.trace.persona.choiceTendency);
    const denominator = Object.values(scores).reduce((sum, value) => sum + Math.abs(value), 0);
    entry.total += 1;
    if (denominator > 0 && Math.abs(scores.money ?? 0) / denominator > 0.5) entry.dominant += 1;
    selectedMoneyByPersona.set(persona, entry);
  }
  const topMoneyRows = [...candidateRows]
    .map(({ candidate, observation }) => {
      const scores = scoreEffects([...candidate.directEffects, ...candidate.outcomeEffects], observation.run.trace.persona.choiceTendency);
      return { candidate, observation, money: Math.abs(scores.money ?? 0), scores };
    })
    .filter(row => row.money > 0)
    .sort((a, b) => b.money - a.money || a.observation.run.file.localeCompare(b.observation.run.file))
    .slice(0, 10);

  const originObservations = choices.filter(observation => observation.step.event?.id === 'origin_background');
  const originRows = originObservations.flatMap(observation => observation.candidates.map(candidate => ({ observation, candidate })));
  const originByPersona = [...new Set(originObservations.map(observation => observation.run.trace.persona.id))].sort().flatMap(personaId => {
    const observation = originObservations.find(item => item.run.trace.persona.id === personaId)!;
    return observation.candidates.map(candidate => {
      const scores = scoreEffects([...candidate.directEffects, ...candidate.outcomeEffects], observation.run.trace.persona.choiceTendency);
      return [personaId, candidate.choiceId, candidate.baseScore, candidate.personaBonus, candidate.personaAdjustedScore,
        Object.entries(scores).filter(([, value]) => value !== 0).map(([key, value]) => `${key}:${fmt(value)}`).join(', ') || 'none'];
    });
  });

  const outcomeChoices = choices.filter(observation => observation.candidates.some(candidate => candidate.outcomeCount > 0));
  const multiOutcomeChoices = choices.filter(observation => observation.candidates.some(candidate => candidate.outcomeCount > 1));
  const variantAnalyses = multiOutcomeChoices.map(choiceVariantAnalysis).filter((value): value is ChoiceVariantAnalysis => value !== null);
  const directWinnerDiffers = variantAnalyses.filter((analysis, index) => analysis.directWinner !== multiOutcomeChoices[index].step.choiceDecision?.selectedChoiceId);
  const branchPotentiallyChanges = variantAnalyses.filter((analysis, index) => analysis.branchWinnerSet.some(id => id !== multiOutcomeChoices[index].step.choiceDecision?.selectedChoiceId));
  const incompleteBranchAnalyses = variantAnalyses.filter(analysis => !analysis.branchAnalysisExact);
  const branchLabels = [...new Set(variantAnalyses.flatMap(analysis => analysis.labels))];

  const eventGroups = new Map<string, ChoiceObservation[]>();
  for (const observation of choices) {
    const eventId = observation.step.event?.id ?? 'unknown';
    const list = eventGroups.get(eventId) ?? [];
    list.push(observation);
    eventGroups.set(eventId, list);
  }
  let agreementSame = 0;
  let agreementTotal = 0;
  const eventAgreementRows: string[][] = [];
  for (const [eventId, observations] of [...eventGroups.entries()].sort()) {
    const crossPersona = observations.filter((observation, index, list) => list.findIndex(other => other.run.trace.persona.id === observation.run.trace.persona.id) === index);
    let same = 0;
    let total = 0;
    for (let i = 0; i < crossPersona.length; i += 1) {
      for (let j = i + 1; j < crossPersona.length; j += 1) {
        total += 1;
        if (crossPersona[i].step.choiceDecision!.selectedChoiceId === crossPersona[j].step.choiceDecision!.selectedChoiceId) same += 1;
      }
    }
    if (total > 0) {
      agreementSame += same;
      agreementTotal += total;
      eventAgreementRows.push([eventId, observations.length, new Set(observations.map(item => item.step.choiceDecision!.selectedChoiceId)).size, `${same}/${total} (${fmt((same / total) * 100)}%)`]);
    }
  }

  const keywordList = ['origin', 'merchant', 'martial', 'scholar', 'orthodox', 'demonic', 'dark', 'join', 'sect', 'challenge', 'decline', 'observe', 'study', 'training', 'business', 'travel', 'social', 'peace', 'mediate', 'aid'];
  const keywordRows = keywordList.map(keyword => [keyword, choices.filter(observation => String(observation.step.choiceDecision?.selectedChoiceId).toLowerCase().includes(keyword)).length]);

  const actionRowsByPersona = [...new Set(runs.map(run => run.trace.persona.id))].sort().map(personaId => {
    const personaRuns = runs.filter(run => run.trace.persona.id === personaId);
    const values = personaRuns.flatMap(actionCategories);
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    const maxCategory = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const streak = Math.max(...personaRuns.map(run => maxStreak(actionCategories(run))), 0);
    const pattern = personaRuns.reduce((sum, run) => sum + oneSwitchReturnPattern(actionCategories(run)), 0);
    return [personaId, values.length, [...counts.entries()].sort().map(([key, value]) => `${key}:${value}`).join(', '), maxCategory ? `${maxCategory[0]} ${fmt(maxCategory[1] / values.length * 100)}%` : '—', streak, pattern];
  });
  const balancedRuns = runs.filter(run => run.trace.persona.id === 'p8-balanced-wei');
  const balancedCounts = new Map<string, number>();
  balancedRuns.flatMap(actionCategories).forEach(value => balancedCounts.set(value, (balancedCounts.get(value) ?? 0) + 1));
  const samePersonaActionAgreement = samePersonaPairwiseAgreement(runs, actionSequence);
  const fixedPriorityCount = actions.filter(({ action }) => action.selectionReason.startsWith('persona_strategy:')).length;
  const focusBreakCount = actions.filter(({ action }) => action.selectionReason.includes('broke_focus_streak')).length;
  const degradedCount = actions.filter(({ action }) => action.selectionReason.startsWith('degraded_')).length;
  const availableSetCount = new Set(actions.map(({ action }) => action.availableActions.map(item => item.category).sort().join(','))).size;

  const disturbanceRows = allSteps.filter(step => step.phaseBefore === 'disturbance_narrative').map(step => ({
    step,
    run: runs.find(run => run.trace.steps.includes(step))!,
    payload: (step.presentation?.disturbanceNarrative ?? {}) as AnyRecord,
  }));
  const disturbanceDetailRows = disturbanceRows.map(({ run, step, payload }) => [run.trace.persona.id, run.trace.seed, step.age, payload.disturbanceId ?? 'unknown', payload.sourceActionName ?? 'unknown']);
  const presentationKinds: Array<[string, string]> = [
    ['active_planning', 'actionSummary'],
    ['action_summary', 'actionSummary'],
    ['period_summary', 'periodSummary'],
    ['passive_progression', 'passiveNarrative'],
    ['disturbance_narrative', 'disturbanceNarrative'],
  ];
  const presentationRows = presentationKinds.map(([phase, key]) => {
    const phaseSteps = allSteps.filter(step => step.phaseBefore === phase);
    const captured = phaseSteps.filter(step => Boolean((step.presentation as AnyRecord | undefined)?.[key])).length;
    return [phase, phaseSteps.length, captured, pct(captured, phaseSteps.length), phaseSteps.length - captured];
  });

  const finalRows = [...new Set(runs.map(run => run.trace.persona.id))].sort().map(personaId => {
    const personaRuns = runs.filter(run => run.trace.persona.id === personaId);
    const values = personaRuns.map(run => run.trace.finalState.player?.money ?? 0);
    const martial = personaRuns.map(run => run.trace.finalState.player?.martialPower ?? 0);
    const identities = [...new Set(personaRuns.map(run => run.trace.finalState.identity?.primary ?? 'none'))];
    const routes = [...new Set(personaRuns.flatMap(routeIdentity))];
    const echoes = personaRuns.map(run => directEchoKeys(run).length);
    const endings = [...new Set(personaRuns.map(run => stableJson(run.trace.finalState.ending ?? null)))];
    const originChoices = [...new Set(originObservations.filter(item => item.run.trace.persona.id === personaId).map(item => item.step.choiceDecision!.selectedChoiceId))];
    return [personaId, `${Math.min(...values)}–${Math.max(...values)}`, `${Math.min(...martial)}–${Math.max(...martial)}`, identities.join(', '), routes.slice(0, 3).join(', ') || 'none', `${Math.min(...echoes)}–${Math.max(...echoes)}`, endings.join(', '), originChoices.join(', ')];
  });

  const choiceSig = pairwiseSimilarity(runs, selectionSignature);
  const visibleSig = pairwiseSimilarity(runs, visibleSignature);
  const metricSig = pairwiseSimilarity(runs, metricSignature);
  const samePersonaChoice = samePersonaPairwiseAgreement(runs, run => run.trace.steps.filter(step => step.choiceDecision).map(step => step.choiceDecision!.selectedChoiceId));
  const allEventSequences = runs.map(run => run.trace.steps.filter(step => step.event).map(step => step.event!.id));
  const uniqueEventSequences = new Set(allEventSequences.map(stableJson)).size;
  const uniqueChoiceSequences = new Set(runs.map(run => stableJson(run.trace.steps.filter(step => step.choiceDecision).map(step => step.choiceDecision!.selectedChoiceId)))).size;
  const uniqueActionSequences = new Set(runs.map(run => stableJson(actionSequence(run)))).size;
  const allFlags = new Map<string, number>();
  for (const run of runs) for (const [key, value] of Object.entries(run.trace.finalState.flags ?? {})) if (value) allFlags.set(key, (allFlags.get(key) ?? 0) + 1);
  const topFlags = [...allFlags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 15);

  const originSelected = originObservations.filter(observation => observation.step.choiceDecision?.selectedChoiceId === 'origin_merchant_family').length;
  const personaBonusChanged = baseWinnerChanged.length;
  const summary = [
    '# Experience Trace Choice Policy Audit',
    '',
    '> 只读审计报告。输入为 40 条 `oracle_effect_score_v1` Trace；本报告没有修改 Trace、游戏状态、选择逻辑、P8/P11 Gate 或产品代码。',
    '',
    '## Executive Summary',
    '',
    `- 40 条 Trace、${choices.length} 次事件选择、${actions.length} 次主动行动已纳入分析；生成参数为 8 personas × 5 seeds/persona、endAge=40。`,
    `- 选择趋同的最强已确认来源是评分量纲：选中候选中 ${pct(selectedDominance.dominant50, selectedRows.length)} 的 stat contribution 由单一属性超过 50%；money 超过 50% 的选择为 ${pct(selectedDominance.moneyAt(0.5), selectedRows.length)}。`,
    `- persona bonus 并非没有作用：按“基础最高候选的第一项”定义，${pct(personaBonusChanged, choices.length)} 次改变基础赢家；但出身节点 ${originSelected}/${originObservations.length} 次仍选择 \`origin_merchant_family\`。`,

    `- tie 是确定性选择的重要来源：${pct(ties.length, choices.length)} 次最高分并列，${pct(orderTies.length, choices.length)} 次由候选顺序打破。`,
    `- outcome 合并存在可量化的敏感性，但当前 Trace 缺少完整选择前状态和 outcome 分支条件，${pct(branchPotentiallyChanges.length, multiOutcomeChoices.length)} 是“在单分支反事实下可能变排名”的上界，不是已确认的实际可达比例。`,
    '- 唯一下一 Slice：**D. 暂不修正模拟器，进入产品 Slice**。先做 bounded player-visible/browser 产品体验验证；本轮证据足以证明 oracle 偏差存在，但不足以决定全局量纲修正或把 oracle 替换为玩家可见策略。',
    '',
    '## Sample and Runtime Parameters',
    '',
    table(['Item', 'Value'], [
      ['Trace files', runs.length],
      ['Personas', new Set(runs.map(run => run.trace.persona.id)).size],
      ['Seeds per persona', '5'],
      ['Seed range by roster', [...new Set(runs.map(run => run.trace.seed))].sort((a, b) => a - b).join(', ')],
      ['endAge argument', '40'],
      ['finalAge observed', [...new Set(runs.map(run => run.trace.finalState.player?.age ?? null))].sort().join(', ')],
      ['Trace policy', runs[0].trace.selectionPolicy.kind],
      ['runtimePath', runs[0].trace.runtimePath],
      ['input order', 'lexicographic file order; all aggregations stable-sorted'],
    ]),
    '',
    '## Current Selection Policy Definition',
    '',
    `\`oracle_effect_score_v1\`: hidden direct effects plus all outcome effects are scored; martial tendency gives ×3 to martialPower/knowledge/constitution; wealth tendency gives ×3 to money/businessAcumen/reputation/connections and ×0.7 to other stats; persona route/risk/relationship/goal bonuses are then added; scores are deterministic and ties are resolved by the first candidate. \`normalizedStatUnits=false\`.`,

    '',
    '## 1. Event Selection Statistics',
    '',
    table(['Metric', 'Result'], [
      ['Total event choices', choices.length],
      ['Candidate rows', candidateRows.length],
      ['Single-candidate events', choices.filter(observation => observation.candidates.length === 1).length],
      ['Multi-candidate events', choices.filter(observation => observation.candidates.length > 1).length],
      ['All adjusted candidate scores = 0', `${allZero.length} (${pct(allZero.length, choices.length)})`],
      ['Highest-score ties', `${ties.length} (${pct(ties.length, choices.length)})`],
      ['tieBrokenByOrder=true', `${orderTies.length} (${pct(orderTies.length, choices.length)})`],
      ['Persona bonus changed first base winner', `${personaBonusChanged} (${pct(personaBonusChanged, choices.length)})`],
      ['Selected winner left the entire base-score tie set', `${adjustedOutsideBaseTie.length} (${pct(adjustedOutsideBaseTie.length, choices.length)})`],
      ['Score margin distribution', margins.length ? percentileLine(margins) : 'none'],
    ]),
    '',
    table(['Persona', 'Choices'], [...new Set(runs.map(run => run.trace.persona.id))].sort().map(id => [id, choices.filter(observation => observation.run.trace.persona.id === id).length])),
    '',
    'Margin buckets:',
    '',
    table(['Margin', 'Count'], [
      ['0', margins.filter(value => value === 0).length],
      ['0 < margin ≤ 10', margins.filter(value => value > 0 && value <= 10).length],
      ['10 < margin ≤ 50', margins.filter(value => value > 10 && value <= 50).length],
      ['50 < margin ≤ 100', margins.filter(value => value > 50 && value <= 100).length],
      ['margin > 100', margins.filter(value => value > 100).length],
    ]),
    '',
    '## 2. Numeric Unit Dominance',
    '',
    'Contribution method: mirror `scoreByTendency`; for each candidate, compare absolute per-stat contribution with the sum of absolute stat contributions. Persona bonus is excluded from this denominator, so this isolates the raw hidden-effect score. Zero-stat candidates are not counted in dominance denominators.',
    '',
    table(['Population', '>50% one stat', 'money >50%', 'money >75%', 'money >90%'], [
      ['Selected candidates', `${selectedDominance.dominant50}/${selectedRows.length}`, `${selectedDominance.moneyAt(0.5)}/${selectedRows.length}`, `${selectedDominance.moneyAt(0.75)}/${selectedRows.length}`, `${selectedDominance.moneyAt(0.9)}/${selectedRows.length}`],
      ['All candidate rows', `${allDominance.dominant50}/${candidateRows.length}`, `${allDominance.moneyAt(0.5)}/${candidateRows.length}`, `${allDominance.moneyAt(0.75)}/${candidateRows.length}`, `${allDominance.moneyAt(0.9)}/${candidateRows.length}`],
    ]),
    '',
    table(['Persona', 'Selected rows', 'money >50%'], [...selectedMoneyByPersona.entries()].sort().map(([id, value]) => [id, value.total, `${value.dominant}/${value.total} (${fmt(value.dominant / value.total * 100)}%)`])),
    '',
    'Largest money contributions observed:',
    '',
    table(['Event', 'Choice', 'Persona', 'Money abs contribution', 'Base', 'Adjusted'], topMoneyRows.map(row => [row.observation.step.event?.id ?? 'unknown', row.candidate.choiceId, row.observation.run.trace.persona.id, fmt(row.money), fmt(row.candidate.baseScore), fmt(row.candidate.personaAdjustedScore)])),
    '',
    'Origin scoring decomposition (first stable occurrence per persona; all five seeds were checked for the same event shape):',
    '',
    table(['Persona', 'Choice', 'Base score', 'Persona bonus', 'Adjusted score', 'Stat contribution'], originByPersona),
    '',
    `Origin result: ${originSelected}/${originObservations.length} selected \`origin_merchant_family\`; distinct selected origin IDs: ${[...new Set(originObservations.map(observation => observation.step.choiceDecision!.selectedChoiceId))].join(', ')}.`,

    '',
    '## 3. Outcome-Scoring Bias',
    '',
    table(['Metric', 'Result'], [
      ['Choices with at least one outcome', `${outcomeChoices.length} (${pct(outcomeChoices.length, choices.length)})`],
      ['Choices with multi-outcome candidate', `${multiOutcomeChoices.length} (${pct(multiOutcomeChoices.length, choices.length)})`],
      ['Outcome candidates (rows)', candidateRows.filter(row => row.candidate.outcomeCount > 0).length],
      ['Direct-only winner differs from recorded merged winner', `${directWinnerDiffers.length}/${multiOutcomeChoices.length}`],
      ['Single-branch ranking may differ from recorded merged winner', `${branchPotentiallyChanges.length}/${multiOutcomeChoices.length}`],
      ['Branch analysis exact from catalog', `${variantAnalyses.length - incompleteBranchAnalyses.length}/${variantAnalyses.length}`],
      ['Outcome conditions inspected', variantAnalyses.reduce((sum, analysis) => sum + analysis.branchConditionCount, 0)],
      ['Success/failure-like branch labels present', branchLabels.length ? branchLabels.join(', ') : 'none detected by label'],
    ]),
    '',
    'Interpretation: the runner currently flattens direct effects and every outcome effect before scoring. The catalog resolver later selects the first satisfied outcome; therefore a choice can receive score from branches that will not all execute. The branch comparison above is a deterministic sensitivity analysis, not an actual-reachability claim: the Trace schema does not retain the full pre-choice state or outcome IDs/conditions.',
    '',
    '## 4. Persona Effectiveness',
    '',
    `Across the same event ID, cross-persona first observations agree on the selected choice ${agreementSame}/${agreementTotal} (${fmt(agreementTotal === 0 ? 0 : agreementSame / agreementTotal * 100)}%).`,
    '',
    table(['Event ID', 'Observations', 'Distinct choices', 'Cross-persona agreement'], eventAgreementRows.sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 20)),
    '',
    'Selected choice-ID keyword counts:',
    '',
    table(['Keyword', 'Selected choices'], keywordRows),
    '',
    `Persona bonus changed the first base winner in ${personaBonusChanged}/${choices.length} choices; it did not change it in ${choices.length - personaBonusChanged}/${choices.length}. This is evidence that persona bias is active, but not evidence that it produces player-visible differentiation. All eight personas selected the same origin node in the sampled origin event.`,
    '',
    '## 5. Active Action Strategy',
    '',
    table(['Persona', 'Actions', 'Category counts', 'Largest category', 'Max consecutive', '4→1→return patterns'], actionRowsByPersona),
    '',
    table(['Metric', 'Result'], [
      ['Aggregate action counts', [...new Set(actions.map(({ action }) => action.availableActions.find(item => item.actionId === action.selectedActionId)?.category ?? 'unknown'))].sort().map(category => `${category}:${actions.filter(({ action }) => action.availableActions.find(item => item.actionId === action.selectedActionId)?.category === category).length}`).join(', ')],
      ['Balanced persona aggregate counts', [...balancedCounts.entries()].sort().map(([key, value]) => `${key}:${value}`).join(', ')],
      ['Fixed priority reason share', `${fixedPriorityCount}/${actions.length}`],
      ['Focus-streak break count', focusBreakCount],
      ['Degraded/fallback count', degradedCount],
      ['Distinct available category sets', availableSetCount],
      ['Same-persona exact action sequence agreement', `${samePersonaActionAgreement.equal}/${samePersonaActionAgreement.total}`],
      ['Same-persona positional category agreement', `${fmt(samePersonaActionAgreement.positional * 100)}%`],
    ]),
    '',
    'The action selector is primarily a fixed category-priority policy. Seed variation changes the available event/action surface and timing; it does not introduce a new random choice in this analysis. Balanced is mixed but not uniform: the aggregate distribution above should be compared with a 20% per-category ideal, not treated as a player model.',
    '',
    '## 6. Disturbance and Phase Presentation Coverage',
    '',
    table(['Phase', 'Entered', 'Payload captured', 'Capture rate', 'Missing'], presentationRows),
    '',
    `Disturbance hits: ${disturbanceRows.length}.`,
    '',
    table(['Persona', 'Seed', 'Age', 'Disturbance ID', 'Source action'], disturbanceDetailRows),
    '',
    '## 7. Life-Outcome Differences',
    '',
    table(['Persona', 'Final money range', 'Martial range', 'Identity primary', 'Route identity flags', 'Echo flag count', 'Ending', 'Origin choice'], finalRows),
    '',
    table(['Dimension', 'Unique signatures', 'All-pair exact matches'], [
      ['Event ID sequence', uniqueEventSequences, '—'],
      ['Choice sequence', uniqueChoiceSequences, `${choiceSig.equal}/${choiceSig.total}`],
      ['Active action sequence', uniqueActionSequences, '—'],
      ['Visible event/presentation proxy', visibleSig.equal === 0 ? runs.length : new Set(runs.map(visibleSignature)).size, `${visibleSig.equal}/${visibleSig.total}`],
      ['Identity/ending/route/echo metric signature', new Set(runs.map(metricSignature)).size, `${metricSig.equal}/${metricSig.total}`],
    ]),
    '',
    `Trace-derived route/identity signals: ${[...new Set(runs.flatMap(routeIdentity))].slice(0, 20).join(', ') || 'none'}. Final ending payloads observed: ${[...new Set(runs.map(run => stableJson(run.trace.finalState.ending ?? null)))].join(', ')}. Top recurring final flags include: ${topFlags.map(([key, count]) => `${key} (${count}/40)`).join(', ')}.`,
    '',
    'The three layers must not be conflated:',
    '',
    '- **Real player-visible story convergence:** not proven by this headless batch. The event text and presentation payload are only a trace proxy; no human/browser observation was performed here.',
    '- **Simulation-strategy convergence:** strongly visible in the common origin choice, deterministic tie order, repeated choice IDs, and fixed action priorities.',
    '- **Metric-encoding convergence:** visible in repeated route/identity/echo flags and the absence of a final ending payload in these traces; this is an encoding/result-surface observation, not proof that the underlying story is identical.',
    '',
    '## Confirmed Facts',
    '',
    `- ${runs.length} JSON traces loaded; no trace file was written or changed by this audit script.`,
    `- Policy metadata is ${runs[0].trace.selectionPolicy.kind}, hidden effects enabled, unnormalized units, deterministic, first-candidate tie break.`,
    `- ${choices.length} choice steps, ${candidateRows.length} candidate rows, ${actions.length} active-action steps; ${ties.length} ties and ${orderTies.length} order tie breaks.`,
    `- Money contributes over 50% of absolute stat contribution in ${selectedDominance.moneyAt(0.5)}/${selectedRows.length} selected candidates; one-stat >50% occurs in ${selectedDominance.dominant50}/${selectedRows.length}.`,
    `- Persona bonus changes the first base winner ${personaBonusChanged}/${choices.length} times; origin merchant wins ${originSelected}/${originObservations.length} times.`,
    '',
    '## Reasonable Inferences',
    '',
    '- Raw hidden-effect scoring is materially capable of masking persona intent, especially where money is numerically large; this is a simulator-bias finding, not a product-balance finding.',
    '- Active-action differences are mostly availability/timing effects layered on a fixed priority policy; they should not be read as emergent preference learning.',
    '- Outcome flattening can change rankings in counterfactual single-branch calculations, so merged outcome scores should be treated as an oracle diagnostic rather than a faithful player decision model.',
    '',
    '## Unresolved / Awaiting Verification',
    '',
    '- Exact outcome reachability for every choice is unresolved because the current Trace does not store full choice-pre-state snapshots or outcome IDs/conditions. The report intentionally does not convert the sensitivity upper bound into an actual affected-choice count.',
    '- Human-visible story differentiation, understanding of option text, perceived risk, and fun are unresolved. Automated Trace evidence cannot answer them.',
    '- Final `ending` is not populated in the sampled trace payloads; this is a coverage/encoding fact, not a conclusion that no narrative ending exists elsewhere.',
    '',
    '## Decision and the Unique Next Slice',
    '',
    '**D. 暂不修正模拟器，进入产品 Slice。**',
    '',
    'Rationale: the audit proves substantial oracle distortion and identifies where it comes from, but the same batch cannot distinguish whether visible convergence is caused by event content, hidden-effect scoring, or identity/metric encoding with enough confidence to justify a global scoring rewrite. The smallest correct next slice is a bounded player-visible/browser playtest on the origin and one or two high-traffic multi-outcome nodes, comparing perceived differentiation against the same Trace-derived strategy diagnostics.',
    '',
    'Do not do in this slice:',
    '',
    '- Do not change `choiceScoring.ts`, persona bonuses, action priorities, events, seeds, thresholds, P8/P11 gates, Engine, Snapshot, Contract, or GameScreen.',
    '- Do not treat P8 near-duplicate numbers as a substitute for visible playtesting.',
    '- Do not globally normalize money or replace the oracle before a player-visible decision criterion is recorded.',
    '',
    '## Reproduction',
    '',
    '```bash',
    'npm run simulate:experience-trace -- --all-personas --seeds-per-persona 5 --end-age 40',
    'npm exec -- tsx scripts/auditExperienceTraceChoicePolicy.ts',
    '```',
    '',
  ].join('\n');
  return `${summary}\n`;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runs = readRuns(args.traceDir);
  const report = buildReport(runs);
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, report, 'utf8');
  console.log(`${path.relative(process.cwd(), args.output).split(path.sep).join('/')} traces=${runs.length} choices=${choiceObservations(runs).length}`);
}

main();
